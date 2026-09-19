import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data, error } = await supabase
    .from('notification_attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Recent Notification Attempts:");
    console.table(data);
  }
}

main();
