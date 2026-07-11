import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes = ['/cart', '/checkout', '/orders', '/wishlist'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register'];

// In-memory rate limiting map fallback
const ipTrackers = new Map<string, { count: number; resetTime: number }>();

function checkRateLimitInMem(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Bounded memory prune: prevent memory leaks by cleaning expired entries when map grows large
  if (ipTrackers.size > 1000) {
    for (const [key, val] of ipTrackers.entries()) {
      if (now > val.resetTime) {
        ipTrackers.delete(key);
      }
    }
  }

  const tracker = ipTrackers.get(ip);

  if (!tracker) {
    ipTrackers.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > tracker.resetTime) {
    ipTrackers.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (tracker.count >= limit) {
    return false;
  }

  tracker.count += 1;
  return true;
}

// Check Redis if REDIS_URL and REDIS_TOKEN are configured (compatible with Serverless Edge Rest API e.g. Upstash)
async function checkRedisRateLimit(ip: string, limit: number, windowMs: number): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (!redisUrl || !redisToken) {
    return checkRateLimitInMem(ip, limit, windowMs);
  }

  try {
    const key = `rate_limit:${ip}`;
    const windowSecs = Math.ceil(windowMs / 1000);
    const url = `${redisUrl.replace(/\/$/, '')}/pipeline`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSecs],
      ]),
      // Avoid blocking requests on slow Redis connection
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      const data = await response.json();
      const count = data[0]?.result;
      if (count && count > limit) {
        return false;
      }
      return true;
    }
  } catch (err) {
    console.warn('Redis rate limiting failed, falling back to in-memory:', err);
  }

  return checkRateLimitInMem(ip, limit, windowMs);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Apply API Rate Limiting
  if (pathname.startsWith('/api')) {
    const isStrict =
      pathname === '/api/checkout' || pathname === '/api/register' || pathname === '/api/reviews';
    const limit = isStrict ? 10 : 100; // 10 per min for checkout/register/reviews, 100 for others

    const isAllowed = await checkRedisRateLimit(ip, limit, 60000);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // Retrieve and decode the JWT session token
  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:';

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  // Try all possible cookie names and secure flags to decode the session token on Vercel and local environments
  const cookieCandidates = [
    { name: '__Secure-authjs.session-token', secure: true },
    { name: 'authjs.session-token', secure: false },
    { name: '__Secure-next-auth.session-token', secure: true },
    { name: 'next-auth.session-token', secure: false },
  ];

  // Prioritize candidates based on the request protocol
  if (!isHttps) {
    cookieCandidates.sort((a, b) => (a.secure === b.secure ? 0 : a.secure ? 1 : -1));
  }

  let token = null;
  let resolvedCookieName = '';
  for (const candidate of cookieCandidates) {
    try {
      token = await getToken({
        req: request,
        secret,
        cookieName: candidate.name,
        secureCookie: candidate.secure,
      });
      if (token) {
        resolvedCookieName = candidate.name;
        break;
      }
    } catch (err) {
      console.warn(`[Proxy Log] Failed to retrieve token with candidate ${candidate.name}:`, err);
    }
  }

  // Debug logging for session tracking in Vercel logs
  console.log(
    `[Proxy Log] Path: ${pathname} | Secure: ${isHttps} | Has Secret: ${!!secret} | Session Found: ${!!token}${
      token ? ` | Cookie: ${resolvedCookieName}` : ''
    }`
  );

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isAdmin = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isAuth = authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  let response: NextResponse = NextResponse.next();

  // If not logged in and attempting to access protected or admin routes
  if (!token && (isProtected || isAdmin)) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    response = NextResponse.redirect(url);
  }
  // If logged in as non-admin and trying to access admin routes
  else if (token && isAdmin && token.role !== 'ADMIN') {
    response = NextResponse.redirect(new URL('/', request.url));
  }
  // If logged in and trying to access auth pages (login/register)
  else if (token && isAuth) {
    response = NextResponse.redirect(new URL('/', request.url));
  }

  // Inject Production Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';"
  );

  // Set secure same-origin CORS policies for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', new URL(request.url).origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    // Apply to all routes except static resource files
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
