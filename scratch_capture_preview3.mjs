import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fiitjsgumbcaqlejiblr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXRqc2d1bWJjYXFsZWppYmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcyNTAxMywiZXhwIjoyMTAyMzAxMDEzfQ.Mt_ILvEa9_ZFHVhBsr1A8IYfE_bDmkk9M8bEatdKcF8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function capture() {
  const { data, error } = await supabase
    .from('gate_pass_requests')
    .select('request_reference, status')
    .not('request_reference', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return;

  const url = `http://localhost:3000/visit/pass/${data.request_reference}`;
  const browser = await chromium.launch({ headless: true });
  
  const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto(url);
  await pageDesktop.waitForTimeout(2000);
  await pageDesktop.screenshot({ path: 'C:/Users/singh/.gemini/antigravity-ide/brain/3638e3d6-83d2-4a32-ab6e-cdd0d0d1d735/pass_preview_desktop.png', fullPage: true });
  
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto(url);
  await pageMobile.waitForTimeout(2000);
  await pageMobile.screenshot({ path: 'C:/Users/singh/.gemini/antigravity-ide/brain/3638e3d6-83d2-4a32-ab6e-cdd0d0d1d735/pass_preview_mobile.png', fullPage: true });

  await browser.close();
}

capture();
