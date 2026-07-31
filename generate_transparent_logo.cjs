const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const iconPath = path.resolve('resources/icon.png');
  const iconBase64 = fs.readFileSync(iconPath).toString('base64');
  const iconDataUri = 'data:image/png;base64,' + iconBase64;
  
  // 1. Generate splash.png (For Android 11 and older)
  let html = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%); display: flex; justify-content: center; align-items: center; width: 1024px; height: 1024px; font-family: system-ui, -apple-system, "Helvetica Neue", sans-serif; position: relative; overflow: hidden; }
          body::before, body::after { content: ''; position: absolute; z-index: -1; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 50%; }
          body::before { width: 900px; height: 900px; top: -350px; left: -350px; }
          body::after { width: 1100px; height: 1100px; bottom: -450px; right: -450px; }
          .container { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1024px; height: 1024px; margin-top: -80px; }
          .logo-wrapper { filter: drop-shadow(0 0 80px rgba(59, 130, 246, 0.15)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1)); margin-bottom: 30px; }
          img { width: 750px; height: 750px; clip-path: inset(12.3% round 16%); display: block; }
          .title { font-size: 110px; font-weight: 800; margin-bottom: 12px; letter-spacing: -1px; text-align: center; line-height: 1.1; }
          .title .navy { color: #0f172a; }
          .title .gold { color: #cba052; }
          .tagline { font-size: 40px; font-weight: 600; color: #64748b; letter-spacing: 2px; }
          
          .footer-container { position: absolute; bottom: 60px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
          .features { display: flex; gap: 40px; }
          .feature { display: flex; align-items: center; gap: 12px; font-size: 32px; font-weight: 700; color: #334155; }
          .icon { width: 36px; height: 36px; color: #cba052; }
          .version { font-size: 24px; font-weight: 600; color: #cbd5e1; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-wrapper"><img src="${iconDataUri}" /></div>
          <div class="title"><span class="navy">EMI Pro</span> <span class="gold">Calculator</span></div>
          <div class="tagline">Smart EMI &bull; Better Decisions</div>
        </div>
        <div class="footer-container">
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
          <div class="version">Version 1.2.9</div>
        </div>
      </body>
    </html>
  `;
  await page.setContent(html, { waitUntil: 'load' });
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await page.screenshot({ path: 'android/app/src/main/res/drawable/splash.png', omitBackground: false });

  // 2. Generate splash_logo.png (For Android 12+ centered icon)
  html = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; display: flex; justify-content: center; align-items: center; width: 1024px; height: 1024px; font-family: system-ui, -apple-system, "Helvetica Neue", sans-serif; }
          .container { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1024px; height: 1024px; margin-top: -60px; }
          .logo-wrapper { filter: drop-shadow(0 0 60px rgba(59, 130, 246, 0.15)) drop-shadow(0 12px 24px rgba(0, 0, 0, 0.1)); margin-bottom: 15px; }
          img { width: 500px; height: 500px; clip-path: inset(12.3% round 16%); display: block; }
          .title { font-size: 58px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; text-align: center; }
          .title .navy { color: #0f172a; }
          .title .gold { color: #cba052; }
          .tagline { font-size: 24px; font-weight: 600; color: #64748b; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-wrapper"><img src="${iconDataUri}" /></div>
          <div class="title"><span class="navy">EMI Pro</span> <span class="gold">Calculator</span></div>
          <div class="tagline">Smart EMI &bull; Better Decisions</div>
        </div>
      </body>
    </html>
  `;
  await page.setContent(html, { waitUntil: 'load' });
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await page.screenshot({ path: 'android/app/src/main/res/drawable/splash_logo.png', omitBackground: true });

  await browser.close();
  console.log('Generated splash.png and splash_logo.png successfully.');
})();
