const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const html = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 600px; height: 240px; font-family: system-ui, -apple-system, "Helvetica Neue", sans-serif; gap: 16px; }
          .features { display: flex; gap: 32px; }
          .feature { display: flex; align-items: center; gap: 8px; font-size: 28px; font-weight: 700; color: #334155; }
          .icon { width: 36px; height: 36px; color: #cba052; }
          .version { font-size: 22px; font-weight: 600; color: #94a3b8; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="features">
          <div class="feature">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Fast
          </div>
          <div class="feature">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            Accurate
          </div>
          <div class="feature">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Reliable
          </div>
        </div>
        <div class="version">Version 1.3.0</div>
      </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'load' });
  await page.setViewport({ width: 600, height: 240, deviceScaleFactor: 1 });
  await page.screenshot({ path: 'android/app/src/main/res/drawable-xxhdpi/splash_branding.png', omitBackground: true });

  await browser.close();
  console.log('Generated splash_branding.png successfully.');
})();
