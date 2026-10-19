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

// Issue #13: siliconyarra.png is the page background with a gradient overlay
assert(!html.includes('<img'), 'logo image should no longer be an inline <img> element');
assert(html.includes('siliconyarra.png'), 'index.html should reference siliconyarra.png as the background image');
assert(html.includes('bg-cover'), 'background image should cover the viewport');
assert(html.includes('bg-center'), 'background image should be centred');
assert(html.includes('bg-gradient-to-b'), 'a Tailwind gradient overlay should sit above the background image');
assert(html.includes('from-slate-950/80'), 'gradient should start from a dark translucent slate for text contrast');
assert(html.includes('aria-hidden="true"'), 'decorative background image div should be hidden from assistive tech');
console.log('index.test.js: ok');
