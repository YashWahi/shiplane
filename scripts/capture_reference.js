const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const REF_DIR = path.join(__dirname, '..', 'docs', 'redesign', 'ref');

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];

const PAGES = [
  { name: 'home-1', url: 'https://taskible.framer.website/' },
  { name: 'home-2', url: 'https://taskible.framer.website/home-2' },
];

async function main() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const extractedData = {};

  for (const pageInfo of PAGES) {
    console.log(`\nNavigating to ${pageInfo.name}: ${pageInfo.url}`);
    const page = await browser.newPage();
    
    // Track web fonts
    const fontsFound = new Set();
    page.on('response', response => {
      const url = response.url();
      if (url.includes('.woff') || url.includes('.woff2') || url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
        fontsFound.add(url);
      }
    });

    await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Allow Framer animations to settle
    await new Promise(r => setTimeout(r, 4000));

    // Extract computed styles on 1440 viewport
    await page.setViewport({ width: 1440, height: 900 });
    
    const computedStyles = await page.evaluate(() => {
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
          backgroundColor: cs.backgroundColor,
          backgroundImage: cs.backgroundImage,
          border: `${cs.borderWidth} ${cs.borderStyle} ${cs.borderColor}`,
          borderRadius: cs.borderRadius,
          boxShadow: cs.boxShadow,
          padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
          margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
          backdropFilter: cs.backdropFilter,
        };
      }

      // Collect headings
      const headings = [];
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
        headings.push({
          tag: h.tagName,
          text: h.innerText.slice(0, 80),
          styles: getProps(h),
          highlightSpan: h.querySelector('span, em, strong') ? getProps(h.querySelector('span, em, strong')) : null
        });
      });

      // Collect buttons and links
      const buttons = [];
      document.querySelectorAll('button, a').forEach(b => {
        const text = (b.innerText || '').trim();
        if (text && text.length < 40) {
          buttons.push({
            tag: b.tagName,
            text,
            href: b.getAttribute('href'),
            styles: getProps(b),
          });
        }
      });

      // Collect cards / frames
      const containers = [];
      document.querySelectorAll('[data-framer-name]').forEach(c => {
        const name = c.getAttribute('data-framer-name');
        if (['Feature Card', 'bento', 'Pricing', 'Hero', 'Navbar', 'Footer', 'FAQ', 'How it Works Card', 'Basic Plan', 'Enterprise Plan'].some(k => name.includes(k))) {
          containers.push({
            name,
            styles: getProps(c),
            rect: {
              width: c.offsetWidth,
              height: c.offsetHeight,
            }
          });
        }
      });

      // Body / Page styles
      const bodyStyles = getProps(document.body);
      const htmlStyles = getProps(document.documentElement);

      return {
        bodyStyles,
        htmlStyles,
        headings,
        buttons: buttons.slice(0, 30),
        containers: containers.slice(0, 40),
      };
    });

    extractedData[pageInfo.name] = {
      fonts: Array.from(fontsFound),
      computed: computedStyles,
    };

    // Now capture screenshots at all 4 viewports
    for (const vp of VIEWPORTS) {
      console.log(`Capturing ${pageInfo.name} at ${vp.width}px...`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 1500));
      const filename = path.join(REF_DIR, `${pageInfo.name}-${vp.name}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`Saved ${filename}`);
    }

    await page.close();
  }

  await browser.close();

  const dataPath = path.join(__dirname, '..', 'docs', 'redesign', 'raw-reference-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(extractedData, null, 2), 'utf8');
  console.log(`Saved reference data to ${dataPath}`);
}

main().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
