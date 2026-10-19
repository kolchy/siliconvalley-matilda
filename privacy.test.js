import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./public/privacy.html', import.meta.url), 'utf8');

// Issue #20: standard privacy statement page for a private Australian company
assert(html.includes('<title>Privacy Policy | Silicon Yarra</title>'), 'privacy.html should have a Privacy Policy page title');
assert(html.includes('Privacy Policy'), 'privacy.html should contain a "Privacy Policy" heading');
assert(!html.toLowerCase().includes('lorem ipsum'), 'privacy.html should not contain lorem ipsum placeholder text');
assert(html.includes('Privacy Act 1988'), 'privacy.html should reference the Privacy Act 1988 (Cth)');
assert(html.includes('Australian Privacy Principles'), 'privacy.html should reference the Australian Privacy Principles');
assert(html.includes('Office of the Australian Information Commissioner'), 'privacy.html should reference the OAIC');
assert(html.toLowerCase().includes('personal information'), 'privacy.html should discuss personal information');
assert(html.toLowerCase().includes('cookies'), 'privacy.html should cover cookies');
assert(html.toLowerCase().includes('access'), 'privacy.html should cover access to personal information');
assert(html.toLowerCase().includes('correction'), 'privacy.html should cover correction of personal information');
assert(html.toLowerCase().includes('complaint'), 'privacy.html should explain how to make a privacy complaint');
assert(html.includes('tailwindcss.com'), 'privacy.html should include Tailwind CSS');
assert(html.includes('bg-slate-950'), 'privacy.html body should use the same dark Tailwind background as the other pages');
assert(html.includes('siliconyarra.png'), 'privacy.html should reuse the site background image');
assert(html.includes('href="index.html"'), 'privacy.html should link back to the home page');
assert(html.includes('href="about.html"'), 'privacy.html nav should include an About link');
assert(html.includes('href="privacy.html"'), 'privacy.html nav should include a Privacy link');
assert(html.includes('Last deployed:'), 'privacy.html footer should match the other pages footer');

const index = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
assert(index.includes('href="privacy.html"'), 'index.html should link to the Privacy Policy page');

const about = readFileSync(new URL('./public/about.html', import.meta.url), 'utf8');
assert(about.includes('href="privacy.html"'), 'about.html should link to the Privacy Policy page');

console.log('privacy.test.js: ok');
