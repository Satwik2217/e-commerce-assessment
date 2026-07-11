import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  validateImageFile,
  extractPublicId,
  isCloudinaryUrl,
} from '@/lib/cloudinary';

const MAX_FILES = 5;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.json();
    const { images, folder = 'shopmyuniform/products' } = formData as {
      images: string[];
      folder?: string;
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (images.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} images per request` },
        { status: 400 }
      );
    }

    const results: { secure_url: string; public_id: string }[] = [];

    for (const dataUrl of images) {
      // Parse the data URL to get the buffer and mime type
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Create a synthetic File-like object for validation
      const fakeFile = {
        type: mimeType,
        size: buffer.length,
      } as File;

      const validation = validateImageFile(fakeFile);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const result = await uploadToCloudinary(buffer, { folder });
      results.push({
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
    }

    return NextResponse.json({ data: results }, { status: 201 });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { url } = body as { url: string };

    if (!url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Only attempt deletion for Cloudinary-hosted images
    if (!isCloudinaryUrl(url)) {
      return NextResponse.json({
        data: { deleted: false, reason: 'Not a Cloudinary image' },
      });
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      return NextResponse.json(
        { error: 'Could not extract Cloudinary public_id from URL' },
        { status: 400 }
      );
    }

    const deleted = await deleteFromCloudinary(publicId);

    return NextResponse.json({ data: { deleted } });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
