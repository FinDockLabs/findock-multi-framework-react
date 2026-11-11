// Copies the shared files into the plain-HTML examples, so each example folder can be served on its own
// by any static host. Edit the files under /shared, then run `npm run sync-shared`. `--check` fails if a copy
// is out of date (use it in CI).
import { cpSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const copies = [
    ['shared/lightning-out/lightning-out-embed.js', 'examples/html-lightning-out-donation/shared/lightning-out-embed.js'],
    ['shared/lightning-out/lightning-out-embed.js', 'examples/html-lightning-out-checkout/shared/lightning-out-embed.js'],
    ['shared/lightning-out/lightning-out-embed.js', 'examples/html-lightning-out-checkout-page/shared/lightning-out-embed.js'],
    ['shared/canopy', 'examples/html-lightning-out-donation/shared/canopy'],
];

function files(path) {
    return statSync(path).isDirectory()
        ? readdirSync(path).flatMap((name) => files(join(path, name)))
        : [path];
}

const check = process.argv.includes('--check');
let stale = 0;
for (const [from, to] of copies) {
    const source = join(root, from);
    const target = join(root, to);
    if (check) {
        for (const file of files(source)) {
            const copy = target + file.slice(source.length);
            if (!existsSync(copy) || !readFileSync(file).equals(readFileSync(copy))) {
                console.error(`Out of date: ${copy.slice(root.length + 1)}`);
                stale++;
            }
        }
    } else {
        cpSync(source, target, { recursive: true });
        console.log(`${from} → ${to}`);
    }
}
if (stale) {
    console.error('Run `npm run sync-shared`.');
    process.exit(1);
}
