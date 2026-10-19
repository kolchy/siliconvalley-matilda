import assert from 'node:assert';
import { readFileSync } from 'node:fs';

// Issue #22: SEO best practices across every HTML page
const pages = {
  'public/index.html': {
    title: 'Silicon Yarra | Melbourne Tech Community',
    description: 'Silicon Yarra is a dark, minimal home for the builders, backers and dreamers along the Yarra. Join Melbourne\'s tech scene.',
    canonical: 'https://siliconyarra.com.au/',
  },
  'public/about.html': {
    title: 'About Us | Silicon Yarra',
    description: 'Learn about Silicon Yarra, Melbourne\'s tech community along the Yarra River, and the story we tell through the history of house music.',
    canonical: 'https://siliconyarra.com.au/about.html',
  },
  'public/privacy.html': {
    title: 'Privacy Policy | Silicon Yarra',
    description: 'How Silicon Yarra Pty Ltd collects, holds, uses and discloses personal information under the Privacy Act 1988 (Cth) and the Australian Privacy Principles.',
    canonical: 'https://siliconyarra.com.au/privacy.html',
  },
};

for (const [path, expected] of Object.entries(pages)) {
  const html = readFileSync(new URL('./' + path, import.meta.url), 'utf8');

  // Title tag
  assert(html.includes(`<title>${expected.title}</title>`), `${path} should have a descriptive <title>`);

  // Meta description
  assert(html.includes(`<meta name="description" content="${expected.description}">`), `${path} should have a meta description`);

  // Canonical link
  assert(html.includes(`<link rel="canonical" href="${expected.canonical}">`), `${path} should declare a canonical URL`);

  // Open Graph tags
  assert(html.includes('<meta property="og:type" content="website">'), `${path} should set og:type`);
  assert(html.includes(`<meta property="og:title" content="${expected.title}">`), `${path} should set og:title`);
  assert(html.includes(`<meta property="og:description" content="${expected.description}">`), `${path} should set og:description`);
  assert(html.includes(`<meta property="og:url" content="${expected.canonical}">`), `${path} should set og:url`);
  assert(html.includes('<meta property="og:image" content="https://siliconyarra.com.au/siliconyarra.png">'), `${path} should set og:image`);
  assert(html.includes('<meta property="og:site_name" content="Silicon Yarra">'), `${path} should set og:site_name`);
  assert(html.includes('<meta property="og:locale" content="en_AU">'), `${path} should set og:locale`);

  // Twitter card tags
  assert(html.includes('<meta name="twitter:card" content="summary_large_image">'), `${path} should set twitter:card`);
  assert(html.includes(`<meta name="twitter:title" content="${expected.title}">`), `${path} should set twitter:title`);
  assert(html.includes(`<meta name="twitter:description" content="${expected.description}">`), `${path} should set twitter:description`);
  assert(html.includes('<meta name="twitter:image" content="https://siliconyarra.com.au/siliconyarra.png">'), `${path} should set twitter:image`);

  // Robots
  assert(html.includes('<meta name="robots" content="index, follow">'), `${path} should allow indexing`);

  // Theme colour
  assert(html.includes('<meta name="theme-color" content="#020617">'), `${path} should set a theme-color`);

  // Language and charset sanity
  assert(html.includes('<html lang="en"'), `${path} should declare lang="en"`);
  assert(html.includes('<meta charset="utf-8">'), `${path} should declare charset utf-8`);
  assert(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'), `${path} should have a responsive viewport meta`);

  // Exactly one h1 per page
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  assert.strictEqual(h1Count, 1, `${path} should contain exactly one <h1>`);
}

console.log('seo.test.js: ok');
