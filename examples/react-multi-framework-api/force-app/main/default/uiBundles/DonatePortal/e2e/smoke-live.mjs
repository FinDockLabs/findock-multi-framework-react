import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const base = process.env.BASE_URL; if (!base) { console.error('Set BASE_URL to the live site, e.g. https://<my-domain>.my.site.com/donate/'); process.exit(1); }
const out = process.env.OUT || 'e2e-output';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const log = [];
page.on('pageerror', e => log.push('PAGEERROR ' + e));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push('CONSOLE ' + m.type() + ' ' + m.text().slice(0, 300)); });
page.on('response', async r => {
  const u = r.url();
  if (u.includes('/donate/v1/') || u.includes('apexrest')) {
    let body = '';
    try { body = (await r.text()).slice(0, 600); } catch {}
    log.push('API ' + r.status() + ' ' + u + '\n     ' + body);
  }
});
try {
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '/live-step1.png', fullPage: true });
  console.log('title:', await page.title(), '| url:', page.url());
  await page.waitForSelector('legend', { timeout: 30000 });
  // €1 test gift as an obviously fake donor
  await page.getByLabel('Or enter another amount').fill('1');
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Donor');
  await page.getByLabel('Email address').fill('test.donor@example.com');
  await page.getByRole('button', { name: /Continue to payment/ }).click();
  await page.waitForTimeout(500);
  const radios = await page.getByRole('radio').allTextContents();
  const labels = await page.locator('.choice').allInnerTexts();
  console.log('methods offered:', JSON.stringify(labels));
  await page.screenshot({ path: out + '/live-step3.png', fullPage: true });
  await page.locator('label.choice', { hasText: 'iDEAL' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: out + '/live-step3-ideal.png', fullPage: true });
  const nav = page.waitForURL(u => !u.toString().startsWith(base), { timeout: 45000 }).then(() => 'navigated').catch(e => 'no-nav: ' + e.message.split('\n')[0]);
  await page.getByRole('button', { name: /^Donate/ }).click();
  console.log('after submit:', await nav, '| url:', page.url());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '/live-after-submit.png', fullPage: true });
} catch (e) {
  console.log('ERROR', String(e).split('\n')[0]);
  await page.screenshot({ path: out + '/live-error.png', fullPage: true }).catch(() => {});
}
console.log(log.join('\n'));
await browser.close();
