import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
assert(html.includes('Silicon Yarra'), 'index.html should contain "Silicon Yarra"');
console.log('index.test.js: ok');
