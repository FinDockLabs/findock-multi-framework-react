// Downloads the Lightning Out 2.0 runtime from your org into public/, so the app serves it from its own domain.
// A Multi-Framework (React) site only allows scripts from itself: CSP Trusted Sites have no script setting and
// React sites don't support "Trusted Sites for Scripts". Runs before every build; rebuild to pick up a new runtime.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...loadEnv('production', root, 'VITE_'), ...process.env };
const myDomain = env.VITE_SALESFORCE_MY_DOMAIN;
if (!myDomain) {
    console.error('Set VITE_SALESFORCE_MY_DOMAIN (e.g. https://MY-DOMAIN.my.salesforce.com) in .env; see .env.example.');
    process.exit(1);
}
const url = `${myDomain.replace(/\/+$/, '')}/lightning/lightning.out.latest/index.iife.prod.js`;
const response = await fetch(url);
if (!response.ok) {
    console.error(`Could not download the Lightning Out runtime from ${url}: HTTP ${response.status}`);
    process.exit(1);
}
const target = resolve(root, 'public/lightning-out/index.iife.prod.js');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.from(await response.arrayBuffer()));
console.log(`Lightning Out runtime: ${url} → public/lightning-out/index.iife.prod.js`);
