const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('test-artifacts/screenshots')) {
    fs.mkdirSync('test-artifacts/screenshots', { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  console.log('Navigating to home...');
  await page.goto('http://localhost:3000/visit');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-artifacts/screenshots/01-home.png' });

  console.log('Filling visitor form...');
  await page.fill('input[name="visitorName"]', 'QA Test User');
  await page.fill('input[name="visitorMobile"]', '9999999999');
  await page.fill('textarea[name="purpose"]', 'QA Testing E2E');
  await page.screenshot({ path: 'test-artifacts/screenshots/02-form-filled.png' });

  console.log('Navigating forward (if possible)...');
  await page.click('button:has-text("Continue to Photo")').catch(() => {});
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'test-artifacts/screenshots/03-next-step.png' });

  await browser.close();
  console.log('Evidence captured successfully.');
})();
