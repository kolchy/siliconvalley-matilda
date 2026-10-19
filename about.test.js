import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./public/about.html', import.meta.url), 'utf8');

// Issue #17: About page text replaced with a brief history of house music
assert(html.includes('<title>About Us | Silicon Yarra</title>'), 'about.html should have an About Us page title');
assert(html.includes('About Us'), 'about.html should contain an "About Us" heading');
assert(!html.toLowerCase().includes('lorem ipsum'), 'about.html should no longer contain lorem ipsum placeholder text');
assert(html.toLowerCase().includes('house music'), 'about.html should contain a brief history of house music');
assert(html.includes('Chicago'), 'about.html should mention Chicago, the birthplace of house music');
assert(html.includes('Warehouse'), 'about.html should mention the Warehouse club');
assert(html.includes('Frankie Knuckles'), 'about.html should mention Frankie Knuckles');
assert(html.includes('tailwindcss.com'), 'about.html should include Tailwind CSS');
assert(html.includes('bg-slate-950'), 'about.html body should use the same dark Tailwind background as the home page');
assert(html.includes('siliconyarra.png'), 'about.html should reuse the site background image');
assert(html.includes('href="index.html"'), 'about.html should link back to the home page');
assert(html.includes('href="about.html"'), 'about.html nav should include an About link');
assert(html.includes('Last deployed:'), 'about.html footer should match the home page footer');

const index = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
assert(index.includes('href="about.html"'), 'index.html should link to the About Us page');
assert(index.includes('href="index.html"'), 'index.html nav should include a Home link');

console.log('about.test.js: ok');
