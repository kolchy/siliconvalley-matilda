import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
assert(html.includes('Silicon Yarra'), 'index.html should contain "Silicon Yarra"');
assert(html.includes('<footer'), 'index.html should contain a footer element');
assert(html.includes('Last deployed:'), 'footer should contain "Last deployed:" label');
assert(html.includes('id="last-deployed"'), 'footer should contain an element with id="last-deployed"');
assert(html.includes('toLocaleString'), 'footer date should be rendered client-side via toLocaleString');
assert(html.includes('tailwindcss.com'), 'index.html should include Tailwind CSS');
assert(html.includes('bg-slate-950'), 'body should use a dark Tailwind background');
assert(html.includes('text-slate-100'), 'body should use light text for the dark theme');
assert(html.includes('dark'), 'index.html should explicitly reference the dark theme');
console.log('index.test.js: ok');
