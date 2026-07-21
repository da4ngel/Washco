import { supabase } from './supabase';

export type Bucket = 'tenant-photos' | 'booking-photos' | 'avatars';

/**
 * Uploads a file to a Supabase Storage bucket and returns its public URL.
 * For the private `booking-photos` bucket a signed URL (1 year) is returned.
 */
export async function uploadFile(bucket: Bucket, path: string, file: File): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  if (bucket === 'booking-photos') {
    const { data, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr) throw signErr;
    return data.signedUrl;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Generates a reasonably unique object path within a bucket folder. */
export function objectPath(folder: string, file: File): string {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const id = crypto.randomUUID();
  return `${folder}/${id}.${ext}`;
}
