'use server';

import { supabaseServer } from '@/lib/supabase/server';

export async function getPhotoSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  
  try {
    const { data, error } = await supabaseServer.storage
      .from('visitor-photos')
      .createSignedUrl(path, 3600); // 1 hour expiry
      
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('Exception creating signed URL:', err);
    return null;
  }
}
