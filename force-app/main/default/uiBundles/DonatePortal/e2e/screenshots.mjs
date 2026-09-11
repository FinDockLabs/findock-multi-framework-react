import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const base = process.env.BASE_URL || 'http://localhost:5173/';
const out = process.env.OUT || 'e2e-output';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const toStep3 = async (page) => {
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.getByLabel('Last name').fill('Lovelace');
  await page.getByLabel('Email address').fill('ada@example.org');
  await page.getByRole('button', { name: /Continue to payment/ }).click();
  await page.locator('label.choice', { hasText: 'iDEAL' }).click();
};
const shots = [
  ['desktop-step1', 1360, 900, async () => {}],
  ['mobile-step1', 390, 844, async () => {}],
  ['desktop-step3', 1360, 900, toStep3],
  ['mobile-step3', 390, 844, toStep3],
];
for (const [name, w, h, act] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForSelector('legend', { timeout: 30000 });
  await act(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + '/' + name + '.png', fullPage: true });
  console.log(name, 'errors:', errors.length ? errors : 'none');
  await page.close();
}
await browser.close();
