import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { withAuth } from '@/middleware/auth';

export const POST = withAuth(async (request) => {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // image is expected to be a base64 string
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'attendance_system',
    });

    return NextResponse.json({ 
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id 
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
