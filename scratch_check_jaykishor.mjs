import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fiitjsgumbcaqlejiblr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXRqc2d1bWJjYXFsZWppYmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcyNTAxMywiZXhwIjoyMTAyMzAxMDEzfQ.Mt_ILvEa9_ZFHVhBsr1A8IYfE_bDmkk9M8bEatdKcF8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('employees').select('id, name, mobile, email').ilike('name', '%Jaykishor%');
  if (error) console.error(error);
  else console.log(data);
}
check();
