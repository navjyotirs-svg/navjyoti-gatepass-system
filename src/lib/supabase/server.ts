import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// We MUST use the service role key on the server to bypass RLS and read private mobile numbers.
// The public anon key cannot read the 'employees' table directly due to RLS.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Missing Supabase Service Role Key. Private operations will fail. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.");
}

export const supabaseServer = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder'
);
