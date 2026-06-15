import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Allowed image MIME types and their extensions
const ALLOWED_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif']
  // SVG intentionally excluded — can contain <script> tags (XSS vector)
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  // Admin check
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // FIX #5: Validate file size server-side
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  // FIX #5: Validate MIME type (don't trust extension alone)
  const allowedExts = ALLOWED_TYPES[file.type];
  if (!allowedExts) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP and GIF images allowed' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: 'File extension does not match content type' }, { status: 400 });
  }

  const fileName = `${crypto.randomUUID()}.${ext}`;

  try {
    // Ensure bucket exists (idempotent)
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'thumbnails')) {
      await admin.storage.createBucket('thumbnails', {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: Object.keys(ALLOWED_TYPES)
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from('thumbnails').upload(fileName, buffer, {
      contentType: file.type,
      upsert: false
    });
    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from('thumbnails').getPublicUrl(fileName);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
