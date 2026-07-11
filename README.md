# ShopMyUniform | Premium Fashion E-Commerce Storefront

A production-ready fashion e-commerce storefront and admin dashboard application built using **Next.js 16** (App Router & Turbopack), **React 19**, **Prisma ORM**, **NextAuth.js v5**, and **PostgreSQL**.

---

## 🎯 Internship Assessment Deliverables

This repository implements the core security, authentication, and state persistence requirements for the internship assessment:

1. **Auth-Gated Shopping Cart**: Unauthenticated guest users are prevented from adding items to the cart. Both the database state and client-side context block modifications until logged in.
2. **Protected Client Routes**: Enforced route protection on key customer paths:
   - `/cart` (Shopping Cart)
   - `/checkout` (Checkout Invoice & Address form)
   - `/orders` (Order History)
   - If an unauthenticated user attempts to visit these paths, they are redirected to `/login`.
3. **Smooth Session Redirection**:
   - When a guest clicks "Add to Cart", they receive an info toast notification asking them to sign in, and they are redirected to `/login`.
   - After a successful login, they are **automatically redirected back** to the same product details page (or original destination) they came from so they can proceed with their purchase.
4. **Server-Side Verification**: Gated the `/api/cart` endpoint. Unauthorized API requests receive a secure **HTTP 401 Unauthorized** response, protecting against client-side bypasses.
5. **No Browser Alerts**: Replaced all native browser alerts with a custom, glassmorphic toast notification system with entrance and exit micro-animations built using `framer-motion`.
6. **Cart State Persistence**: Carts are fully persisted in the PostgreSQL database per user. Cart items survive browser refreshes, logouts, and logging back in.

---

## ⚙️ Step-by-Step Setup Guide

Follow these steps to clone, configure, and run this project from scratch on your local system:

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or later recommended)
- **Git**
- **Docker Desktop** (optional, recommended for database setup) OR a local **PostgreSQL** server.

---

### 2. Clone the Repository
Clone the project to your local machine and navigate into the root directory:
```bash
git clone https://github.com/Satwik2217/e-commerce-assessment.git
cd e-commerce-assessment
```

---

### 3. Configure Environment Variables
Create a `.env` file in the root folder by copying the provided template:
```bash
# On Linux/macOS
cp .env.example .env

# On Windows (PowerShell)
copy .env.example .env
```

Open the newly created `.env` file and review the variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fashion_ecommerce"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"
```
*Note: If you run a local PostgreSQL server manually, update the `DATABASE_URL` string with your username, password, host, port, and database name.*

---

### 4. Configure Cloudinary (Image Uploads)

The admin panel uses **Cloudinary** for image uploads. To enable image uploading:

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From your Cloudinary dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**
3. Add these to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Without Cloudinary credentials, the admin forms still work but image uploads will fail. Existing seeded product images (hosted on Unsplash) will continue to display correctly.

---

### 5. Start the PostgreSQL Database

#### Option A: Using Docker (Recommended for DB only)
If you want to run PostgreSQL inside a Docker container while running the Next.js app locally on your host machine:
```bash
docker compose up -d postgres
```

#### Option B: Using a Local PostgreSQL Installation
If you prefer running PostgreSQL natively on your machine:
1. Start your local PostgreSQL service.
2. Create an empty database named `fashion_ecommerce`.
3. Verify your `.env` file's `DATABASE_URL` matches your local credentials.

#### Option C: Running the Entire Application via Docker
If you want to spin up both the database and the Next.js application inside Docker containers (without running node/npm locally on your host):
1. Start the container group:
   ```bash
   docker compose up --build -d
   ```
2. Wait a few seconds for services to initialize, then run the database seeder inside the running container:
   ```bash
   docker compose exec web npm run db:seed
   ```
3. Access the web app in your browser at `http://localhost:3000`.

---

### 6. Install Dependencies & Seed Database (For Options A & B)
If you are running the Next.js app locally on your machine, install Node modules, compile the database schema models, and run the seeder:

```bash
# Install node modules (also generates Prisma client via postinstall hook)
npm install

# (Troubleshooting) If Prisma clients fail to resolve, run client code generation explicitly:
npx prisma generate

# Sync the schema structures and indices on your database
npm run db:push

# Populate products, categories, coupons, and test accounts
npm run db:seed
```

---

### 7. Start the Development Server (For Options A & B)
Launch the development server using Next.js Turbopack:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

---

## 🔑 Demo Credentials

The seeder populates default user accounts to test the application flows:

*   **Shopper Customer Account:**
    *   **Email:** `user@shop.com`
    *   **Password:** `user123`
    *   *Permissions: Use this account to test cart persistence, protected routes, checkout, review submissions, and order history.*

*   **Administrator Account:**
    *   **Email:** `admin@shop.com`
    *   **Password:** `admin123`
    *   *Permissions: Access the `/admin` dashboard KPIs, Category CRUD, Product CRUD, and Order Shipment status controls.*

---

## 🧪 Running Automated Tests
A comprehensive test suite validates the registration schema constraints, checkout forms, and stock boundary controls. To execute the tests, run:

```bash
npm run test
```

---

## 🚀 Production Deployment

### Live Demo
**Deployment URL:** [https://shopmyuniform.vercel.app](https://shopmyuniform.vercel.app) *(update after deployment)*

### Deployment Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel CDN    │────▶│   Next.js 16     │────▶│  Neon PostgreSQL │
│   (Frontend)    │     │   (Serverless)   │     │  (Database)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │    Cloudinary     │
                        │  (Image Hosting)  │
                        └──────────────────┘
```

| Layer | Service | Purpose |
|-------|---------|---------|
| **Frontend & API** | Vercel | Next.js 16 serverless functions, static generation, edge proxy |
| **Database** | Neon PostgreSQL | Serverless PostgreSQL with connection pooling (PgBouncer) |
| **Images** | Cloudinary | Product/category image uploads and CDN delivery |
| **Auth** | NextAuth.js v5 | JWT-based session management with role-based access |

### Environment Variables (Production)

Set these in your Vercel dashboard under **Settings → Environment Variables**:

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Neon Dashboard | Neon pooled connection string with `?pgbouncer=true` |
| `NEXTAUTH_URL` | Your Vercel URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Generated | `openssl rand -base64 32` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard | Your API key |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard | Your API secret |

### Deployment Steps

#### 1. Create a Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the **pooled connection string** (it includes `?sslmode=require`)
4. Append `&pgbouncer=true` to the URL

#### 2. Push Code to GitHub
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

#### 3. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → Import your GitHub repository
2. Vercel auto-detects Next.js — keep default build settings
3. Add all environment variables in Vercel dashboard
4. Deploy

#### 4. Seed the Production Database
After first deploy, run the seed command:
```bash
# Via Vercel CLI
npx vercel env pull .env.production.local
npx prisma db push --skip-generate
npx prisma db seed
```

Or run locally with the production `DATABASE_URL`:
```bash
DATABASE_URL="your-neon-url" npx prisma db push --skip-generate
DATABASE_URL="your-neon-url" npx prisma db seed
```

### Post-Deployment Checklist
- [ ] Landing page loads
- [ ] Product catalog displays seeded images
- [ ] User registration and login work
- [ ] Admin login works (`admin@shop.com` / `admin123`)
- [ ] Product CRUD operations function
- [ ] Category CRUD operations function
- [ ] Image uploads via Cloudinary work
- [ ] Cart persistence across sessions
- [ ] Checkout flow completes
- [ ] Order history displays
- [ ] Protected routes redirect to login
- [ ] Admin routes block non-admin users

---

## 🏗️ Folder Structure

```text
fashion-ecommerce/
├── prisma/                 # Database Schema, Migrations, and Seed script
├── public/                 # Static images, assets, and SVG icons
├── src/
│   ├── app/                # App Router Page tree & API endpoints
│   │   ├── admin/          # Admin Dashboard (Category & Product CRUD)
│   │   ├── api/            # API Routes (Cart, Wishlist, Checkout, Validation)
│   │   ├── products/       # Store Catalog, Search, Filters, Details Page
│   │   ├── wishlist/       # User Wishlist page
│   │   ├── cart/           # Shopping Cart page
│   │   ├── checkout/       # Address validation & checkout invoice page
│   │   └── orders/         # Order History & status tracking timelines
│   ├── components/         # Reusable UI component libraries
│   │   ├── ui/             # Dialog, Select, Sheet, Button primitives
│   │   ├── layout/         # Header Navigation & Footer menus
│   │   ├── products/       # Review forms, filters, catalogs, product actions
│   │   └── admin/          # KPI dashboards, order status controllers, image upload
│   ├── context/            # Context providers (CartProvider, ToastProvider)
│   ├── lib/                # Database clients, utilities, and validations
│   │   └── cloudinary.ts   # Cloudinary config, upload/delete helpers
│   ├── types/              # TS definitions
│   └── proxy.ts            # Next.js 16 route proxy (gating, rate-limiting)
├── package.json            # Scripts & project dependencies
└── tsconfig.json           # TS configurations
```

---

## ⚠️ Known Limitations

During engineering evaluation, the following implementation boundaries and design limitations were documented:
1. **Mock Payment Gateway:** The checkout route uses a simulated payment framework (sandbox context in `/api/checkout`). No integrations with payment merchants like Stripe or Razorpay are active.
2. **Upstash Redis edge-proxy Rate-limiting Fallback:** If serverless Redis access credentials (`REDIS_URL` and `REDIS_TOKEN`) are not provided in the environment variables, the proxy fallback system tracks client IP quotas using short-lived in-memory maps inside the serverless edge process.
3. **Cloudinary Upload Dependencies:** If Cloudinary keys are omitted inside `.env`, custom catalog creations/edits in the admin console will not support media uploads (they fallback to standard placeholders). Seeded default products will continue rendering Unsplash images correctly.
4. **Window Alerts in Admin Status Updater:** The client-side status controller ([order-status-updater.tsx](file:///c:/Users/satwi/OneDrive/Desktop/fashion-ecommerce/src/components/admin/order-status-updater.tsx#L35)) fires native browser alert popups on error states rather than invoking the custom Toast alerts system.

---

## 🤖 LLM/AI Usage Disclosure

This project was built and audited leveraging Advanced AI coding assistants (Gemini 3.5 Flash and Claude 3.5 Sonnet) under full human supervision:

1. **Scaffolding and Boilerplate:** Used AI to scaffold initial App Router page layouts, Tailwind components, and Prisma DB schema fields.
2. **Security & Concurrency Refactoring:** Instructed AI to secure the checkout API to perform coupon validation inside the transaction scope to prevent concurrency race conditions.
3. **Database Rename Migration:** Leveraged AI to rename the Wishlist `id` DateTime column to `createdAt` and dynamically update references.
4. **Next.js 16 proxy Conversion:** Used AI to migrate the deprecated middleware convention to the modern `src/proxy.ts` setup with Next.js 16-specific exports and write a conditional Redis rate limiter.
5. **Testing suite:** AI aided in generating native test scripts to validate registration, checkout, and custom formatting helper functions.

