const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MINE_DIR = path.join(__dirname, '..', 'docs', 'redesign', 'mine');

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];

const PAGES = [
  { name: 'home', url: 'http://127.0.0.1:3000/' },
  { name: 'pricing', url: 'http://127.0.0.1:3000/pricing' },
  { name: 'login', url: 'http://127.0.0.1:3000/login' },
];

async function main() {
  console.log('Launching Chrome to capture redesigned pages...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const measurements = {};

  for (const pageInfo of PAGES) {
    console.log(`\nNavigating to ${pageInfo.name} at ${pageInfo.url}`);
    const page = await browser.newPage();
    await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture measurements at 1440
    await page.setViewport({ width: 1440, height: 900 });
    const comp = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const h3 = document.querySelector('h3');
      const highlight = document.querySelector('.heading-highlight');
      const btn = document.querySelector('.taskible-btn-primary, button');
      const card = document.querySelector('.taskible-card');

      function getProps(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
          borderRadius: cs.borderRadius,
          padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        };
      }

      return {
        h1: getProps(h1),
        h2: getProps(h2),
        h3: getProps(h3),
        highlight: getProps(highlight),
        button: getProps(btn),
        card: getProps(card),
      };
    });

    measurements[pageInfo.name] = comp;

    for (const vp of VIEWPORTS) {
      console.log(`Capturing ${pageInfo.name} at ${vp.width}px...`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 1000));
      const filename = path.join(MINE_DIR, `${pageInfo.name}-${vp.name}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`Saved ${filename}`);
    }

    await page.close();
  }

  await browser.close();

  const outPath = path.join(__dirname, '..', 'docs', 'redesign', 'mine-measurements.json');
  fs.writeFileSync(outPath, JSON.stringify(measurements, null, 2), 'utf8');
  console.log(`Saved measurements to ${outPath}`);
}

main().catch(err => {
  console.error('Error in capture_mine:', err);
  process.exit(1);
});
