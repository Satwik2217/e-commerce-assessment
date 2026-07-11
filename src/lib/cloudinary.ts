import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export interface UploadValidation {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): UploadValidation {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Accepted: PNG, JPEG, WEBP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large (${fileMb} MB). Maximum size is ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL and public_id for database storage.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    overwrite?: boolean;
  } = {}
): Promise<CloudinaryUploadResult> {
  const { folder = 'shopmyuniform/products', public_id, overwrite = false } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [{ width: 1200, height: 1600, crop: 'limit' }, { quality: 'auto:good' }],
        ...(public_id ? { public_id, overwrite } : {}),
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload returned no result'));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Silently succeeds if the asset does not exist.
 * Only deletes images hosted on Cloudinary (not external URLs).
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    return result.result === 'ok';
  } catch {
    return false;
  }
}

/**
 * Extract the Cloudinary public_id from a full Cloudinary URL.
 * Returns null if the URL is not a Cloudinary URL.
 *
 * Example:
 *   "https://res.cloudinary.com/demo/image/upload/v1234/shopmyuniform/products/abc.webp"
 *   → "shopmyuniform/products/abc"
 */
export function extractPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('cloudinary.com')) return null;

    // Cloudinary URLs follow: https://res.cloudinary.com/{cloud}/image/upload/{public_id}.{format}
    // or with folder: https://res.cloudinary.com/{cloud}/image/upload/{folder}/{public_id}.{format}
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let path = url.substring(uploadIndex + '/upload/'.length);

    // Strip version prefix (e.g., "v123456/")
    path = path.replace(/^v\d+\//, '');

    // Remove file extension
    path = path.replace(/\.\w+$/, '');

    return path || null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Cloudinary-hosted image.
 */
export function isCloudinaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('cloudinary.com');
  } catch {
    return false;
  }
}

export default cloudinary;
