const { chromium } = require('@playwright/test');
const path = require('path');

const DIR = path.join(__dirname, 'responsive-logo-fix');

async function capture() {
  const browser = await chromium.launch();
  const contextDesktop = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });

  const takeScreenshots = async (url, name) => {
    try {
      const pageDesktop = await contextDesktop.newPage();
      await pageDesktop.goto(url);
      await pageDesktop.waitForTimeout(500);
      await pageDesktop.screenshot({ path: path.join(DIR, `${name}-desktop.png`) });
      await pageDesktop.close();

      const pageMobile = await contextMobile.newPage();
      await pageMobile.goto(url);
      await pageMobile.waitForTimeout(500);
      await pageMobile.screenshot({ path: path.join(DIR, `${name}-mobile.png`) });
      await pageMobile.close();
    } catch (e) {}
  };

  await takeScreenshots('http://localhost:3000/visit', '01-visitor-form');
  await takeScreenshots('http://localhost:3000/visit/photo', '02-camera');
  await takeScreenshots('http://localhost:3000/visit/review', '03-review');

  await browser.close();
}

capture().then(() => console.log('Screenshots taken.'));
