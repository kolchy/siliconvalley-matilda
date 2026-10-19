import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, symlinkSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { makeTools, resolveSafe, runAllowed } from './tools.mjs';

const setup = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'agent-'));
  const posted = [];
  const tools = makeTools(root, { postPlan: async (md) => posted.push(md) });
  return { root, posted, ...tools };
};

test('resolveSafe rejects traversal, .git and env files', () => {
  const root = '/repo';
  assert.throws(() => resolveSafe(root, '../etc/passwd'));
  assert.throws(() => resolveSafe(root, '/etc/passwd'));
  assert.throws(() => resolveSafe(root, '.git/config'));
  assert.throws(() => resolveSafe(root, '.env'));
  assert.throws(() => resolveSafe(root, '.env.local'));
  assert.ok(resolveSafe(root, 'public/index.html'));
});

test('writes to protected paths are rejected, reads of them are allowed', () => {
  assert.throws(() => resolveSafe('/repo', '.github/workflows/x.yml', { write: true }));
  assert.throws(() => resolveSafe('/repo', 'agent/tools.mjs', { write: true }));
  assert.throws(() => resolveSafe('/repo', 'wrangler.jsonc', { write: true }));
  assert.ok(resolveSafe('/repo', 'wrangler.jsonc'));
});

test('write_file is refused until the plan is posted', async () => {
  const { toolHandlers, root } = setup();
  const before = await toolHandlers.write_file({ path: 'a.txt', content: 'x' });
  assert.equal(before.isError, true);
  assert.equal(existsSync(path.join(root, 'a.txt')), false);
});

test('post_plan prefixes the heading and unlocks writes', async () => {
  const { toolHandlers, posted, root } = setup();
  await toolHandlers.post_plan({ markdown: 'Do the thing' });
  assert.match(posted[0], /^## Agent plan/);
  const res = await toolHandlers.write_file({ path: 'public/a.txt', content: 'hello' });
  assert.equal(res.isError, undefined);
  assert.equal(readFileSync(path.join(root, 'public/a.txt'), 'utf8'), 'hello');
});

test('symlinks pointing outside the repo are rejected', async () => {
  const { toolHandlers, root } = setup();
  const outside = mkdtempSync(path.join(tmpdir(), 'outside-'));
  writeFileSync(path.join(outside, 'secret'), 's3cret');
  symlinkSync(outside, path.join(root, 'link'));
  const res = await toolHandlers.read_file({ path: 'link/secret' });
  assert.equal(res.isError, true);
});

test('run_command only allows the exact allowlist', async () => {
  for (const cmd of ['rm -rf /', 'npm test && id', 'npm test; id', 'npm run evil', 'npm publish', 'node -e 1']) {
    const res = await runAllowed('/tmp', cmd);
    assert.equal(res.isError, true, cmd);
    assert.match(res.content, /not allowed/);
  }
});

test('run_command scrubs secrets from the environment', async () => {
  process.env.GH_TOKEN = 'leak-me';
  process.env.MATILDA_API_KEY = 'leak-me-too';
  const { root } = setup();
  writeFileSync(path.join(root, 'package.json'),
    JSON.stringify({ scripts: { lint: 'node -e "console.log(process.env.GH_TOKEN, process.env.MATILDA_API_KEY)"' } }));
  const res = await runAllowed(root, 'npm run lint');
  assert.doesNotMatch(res.content, /leak-me/);
});
