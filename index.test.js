import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
assert(html.includes('Silicon Yarra'), 'index.html should contain "Silicon Yarra"');
assert(html.includes('<footer'), 'index.html should contain a footer element');
assert(html.includes('Last deployed:'), 'footer should contain "Last deployed:" label');
assert(html.includes('id="last-deployed"'), 'footer should contain an element with id="last-deployed"');
assert(html.includes('toLocaleString'), 'footer date should be rendered client-side via toLocaleString');
console.log('index.test.js: ok');
