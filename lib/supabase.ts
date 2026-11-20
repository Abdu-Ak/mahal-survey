import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function publicPhotoUrl(path: string) {
  const base = process.env.SUPABASE_URL;
  if (!base) return '';
  return `${base}/storage/v1/object/public/owner-photos/${encodeURIComponent(path)}`;
}
