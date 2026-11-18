const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const iconPath = path.resolve('resources/icon.png');
  const iconUrl = 'file://' + iconPath;
  
  const html = `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'Geneva';
            src: url('file:///System/Library/Fonts/Geneva.ttf');
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #F9FAFB;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 1024px;
            height: 1024px;
            font-family: 'Geneva', sans-serif;
          }
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 1024px;
            height: 1024px;
          }
          .logo-wrapper {
            filter: drop-shadow(0 25px 35px rgba(59, 130, 246, 0.25)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.15));
            margin-bottom: 25px;
          }
          img {
            width: 360px;
            height: 360px;
            clip-path: inset(12.3% round 16%);
            display: block;
          }
          .title {
            color: #041639;
            font-size: 38px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
          }
          .subtitle {
            color: #475569;
            font-size: 22px;
            font-weight: normal;
          }
        </style>
      </head>
      <body>
        <div class="container" id="splash">
          <div class="logo-wrapper">
            <img src="${iconUrl}" />
          </div>
          <div class="title">EMI Pro Calculator</div>
          <div class="subtitle">Where Smart Borrowing Begins</div>
        </div>
      </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1024, height: 1024 });
  
  const element = await page.$('#splash');
  await element.screenshot({ path: 'splash_logo_with_text.png' });
  
  await browser.close();
  console.log('Image generated successfully.');
})();
