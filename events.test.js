import assert from 'node:assert';
import { readFileSync } from 'node:fs';

// Issue #26: the events page must be linked to from every other page
const pages = [
  'public/index.html',
  'public/about.html',
  'public/events.html',
  'public/privacy.html',
];

for (const path of pages) {
  const html = readFileSync(new URL('./' + path, import.meta.url), 'utf8');
  assert(
    html.includes('href="events.html"'),
    `${path} should link to events.html`
  );
}

console.log('events.test.js: ok');
