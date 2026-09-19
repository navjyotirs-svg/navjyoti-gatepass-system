import { supabase } from '@/lib/supabase/client';

export async function uploadVisitorPhoto(file: Blob, sessionId: string): Promise<string> {
  const fileExt = file.type === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `temporary/${sessionId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('visitor-photos')
    .upload(filePath, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload photo');
  }

  return data.path;
}
