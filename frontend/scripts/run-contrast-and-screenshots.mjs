import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.resolve(__dirname, '../../docs/evidence/phase-2');
const chromePath = 'C:\\Users\\AMIT KUMAR SINGH\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';

async function main() {
  console.log('Starting Playwright browser for contrast audit and screenshot capture...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const baseUrl = 'http://localhost:5173';

  // 1. Accessibility & Contrast Audits on /design-system
  console.log('\n--- 1. Running Axe-Core Contrast Audit on /design-system ---');
  const auditContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const auditPage = await auditContext.newPage();

  // A. Light Theme Audit
  await auditPage.goto(`${baseUrl}/design-system`, { waitUntil: 'networkidle' });
  await auditPage.waitForSelector('h1', { timeout: 10000 });
  // Wait an extra second for any animations or fonts
  await auditPage.waitForTimeout(1000);

  console.log('Running Axe on Light Theme...');
  const lightResults = await new AxeBuilder({ page: auditPage })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const lightContrastViolations = lightResults.violations.filter(v => v.id === 'color-contrast');
  console.log(`Light Theme Total Violations: ${lightResults.violations.length}`);
  console.log(`Light Theme Color Contrast Violations: ${lightContrastViolations.length}`);
  if (lightResults.violations.length > 0) {
    console.log(JSON.stringify(lightResults.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map(n => ({ html: n.html, failureSummary: n.failureSummary }))
    })), null, 2));
  }

  // B. Dark Theme Audit
  console.log('\nSwitching to Dark Theme for Axe Audit...');
  await auditPage.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await auditPage.waitForTimeout(1000);

  const darkResults = await new AxeBuilder({ page: auditPage })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const darkContrastViolations = darkResults.violations.filter(v => v.id === 'color-contrast');
  console.log(`Dark Theme Total Violations: ${darkResults.violations.length}`);
  console.log(`Dark Theme Color Contrast Violations: ${darkContrastViolations.length}`);
  if (darkResults.violations.length > 0) {
    console.log(JSON.stringify(darkResults.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map(n => ({ html: n.html, failureSummary: n.failureSummary }))
    })), null, 2));
  }

  await auditContext.close();

  // 2. Capture Screenshots at 360, 768, 1280 px
  console.log('\n--- 2. Capturing Screenshots at 360px, 768px, and 1280px ---');
  const viewports = [
    { width: 360, height: 740, name: '360' },
    { width: 768, height: 1024, name: '768' },
    { width: 1280, height: 800, name: '1280' },
  ];

  const routes = [
    { path: '/', slug: 'home' },
    { path: '/app', slug: 'app' },
    { path: '/design-system', slug: 'design-system' },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2, // HiDPI for crisp UI captures
    });
    const page = await context.newPage();

    for (const route of routes) {
      const url = `${baseUrl}${route.path}`;
      console.log(`Capturing ${route.slug} at ${vp.name}px (${url})...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      const filePath = path.join(evidenceDir, `${route.slug}-${vp.name}px.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`  -> Saved to ${filePath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll audits and screenshots completed successfully!');
}

main().catch(err => {
  console.error('Error during execution:', err);
  process.exit(1);
});
