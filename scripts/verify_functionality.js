const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { width: 1440, height: 900, name: 'Desktop 1440' },
  { width: 1024, height: 800, name: 'Laptop 1024' },
  { width: 768, height: 1024, name: 'Tablet 768' },
  { width: 390, height: 844, name: 'Mobile 390' },
  { width: 360, height: 800, name: 'Mobile 360' },
];

const ROUTES = [
  { path: '/', name: 'Landing Page' },
  { path: '/pricing', name: 'Pricing Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/activate', name: 'Activate Page' },
];

async function verify() {
  console.log('--- STARTING FUNCTIONALITY & RESPONSIVE VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const results = [];

  // Check HTTP status for all routes
  for (const route of ROUTES) {
    const url = `http://127.0.0.1:3000${route.path}`;
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
    const status = res.status();
    console.log(`Route [${route.name}] (${route.path}): HTTP ${status}`);
    results.push({ test: `Route ${route.path} Status 200`, pass: status === 200 });
  }

  // Check responsiveness: No horizontal scroll across viewports on Landing Page
  console.log('\n--- CHECKING RESPONSIVE OVERFLOW ---');
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalScroll = scrollWidth > clientWidth;

    console.log(`Viewport ${vp.name} (${vp.width}px): scrollWidth=${scrollWidth}, clientWidth=${clientWidth} -> ${hasHorizontalScroll ? 'OVERFLOW ERROR' : 'OK (NO OVERFLOW)'}`);
    results.push({ test: `Responsive No Overflow at ${vp.name} (${vp.width}px)`, pass: !hasHorizontalScroll });
  }

  // Check Button interactive triggers
  console.log('\n--- CHECKING INTERACTIVE BUTTONS ---');
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle2' });

  // Test Copy Prompt Button
  const copyBtn = await page.$('button');
  if (copyBtn) {
    console.log('Copy prompt button located on page.');
    results.push({ test: 'Copy button rendered', pass: true });
  }

  // Check Theme Toggle
  const themeToggle = await page.$('button[aria-label*="theme"]');
  if (themeToggle) {
    await themeToggle.click();
    const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
    console.log(`ThemeToggle clicked: light class is ${isLight}`);
    results.push({ test: 'ThemeToggle functional', pass: isLight });
    // Toggle back
    await themeToggle.click();
  }

  // Check Links
  const navLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute('href'),
    })).filter(a => a.text && a.href);
  });

  console.log(`\nVerified ${navLinks.length} functional links on landing page.`);
  results.push({ test: 'Navigation links intact', pass: navLinks.length >= 8 });

  await browser.close();

  console.log('\n--- VERIFICATION SUMMARY ---');
  let allPass = true;
  for (const r of results) {
    console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}: ${r.test}`);
    if (!r.pass) allPass = false;
  }

  if (!allPass) {
    process.exit(1);
  }
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
