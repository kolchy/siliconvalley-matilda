// Tools exposed to the Matilda agent. Kept free of SDK imports so they can be unit tested.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

// Nothing in these may be written by the agent (read is still allowed, except .git/.env*).
const PROTECTED = ['.git', '.github', 'agent', 'node_modules', 'AGENTS.md', 'wrangler.jsonc'];
const UNREADABLE = ['.git', 'node_modules'];
const MAX_OUTPUT = 20000;
const MAX_LIST = 500;

// Exact argv only: no shell, no extra arguments.
const ALLOWED_COMMANDS = new Set([
  'npm test',
  'npm run lint',
  'npm run build',
  'npm ci',
  'npm install',
]);

const isEnv = (name) => name === '.env' || name.startsWith('.env.');

export function resolveSafe(root, rel, { write = false } = {}) {
  if (typeof rel !== 'string' || !rel || rel.includes('\0')) throw new Error('invalid path');
  const abs = path.resolve(root, rel);
  const relative = path.relative(root, abs);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('path is outside the repository');
  }
  const top = relative.split(path.sep)[0];
  if (UNREADABLE.includes(top) || isEnv(top)) throw new Error(`access to ${top} is not allowed`);
  if (write && PROTECTED.includes(top)) throw new Error(`${top} is protected and cannot be modified`);
  return abs;
}

// Reject symlinks that point outside the repo.
async function assertRealInside(root, abs) {
  const realRoot = await fs.realpath(root);
  let probe = abs;
  for (;;) {
    try {
      const real = await fs.realpath(probe);
      const rel = path.relative(realRoot, real);
      if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('path resolves outside the repository');
      return;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      const parent = path.dirname(probe);
      if (parent === probe) return;
      probe = parent;
    }
  }
}

const truncate = (s) => (s.length > MAX_OUTPUT ? `${s.slice(0, MAX_OUTPUT)}\n...[truncated]` : s);

export function runAllowed(root, command, timeoutMs = 5 * 60 * 1000) {
  const argv = String(command ?? '').trim().split(/\s+/);
  if (!ALLOWED_COMMANDS.has(argv.join(' '))) {
    return Promise.resolve({
      content: `Command not allowed. Allowed: ${[...ALLOWED_COMMANDS].join(', ')}`,
      isError: true,
    });
  }
  // Scrubbed environment: repo scripts must never see GH_TOKEN or MATILDA_API_KEY.
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, CI: 'true' };
  return new Promise((resolve) => {
    execFile(argv[0], argv.slice(1), { cwd: root, env, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const out = truncate(`${stdout}${stderr}`);
        resolve({ content: `exit ${err ? (err.code ?? 'error') : 0}\n${out}`, isError: Boolean(err) });
      });
  });
}

const ok = (content) => ({ content });
const fail = (e) => ({ content: String(e.message ?? e), isError: true });

export function makeTools(root, { postPlan }) {
  const state = { planPosted: false };

  const clientTools = [
    { name: 'list_files', description: 'List files in the repository (optionally under a subdirectory).',
      parameters: { type: 'object', properties: { dir: { type: 'string' } } } },
    { name: 'read_file', description: 'Read a UTF-8 text file from the repository.',
      parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    { name: 'post_plan', description: 'Post your implementation plan (markdown) to the GitHub issue. Required before write_file.',
      parameters: { type: 'object', properties: { markdown: { type: 'string' } }, required: ['markdown'] } },
    { name: 'write_file', description: 'Create or overwrite a file (full contents). Only allowed after post_plan.',
      parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
    { name: 'run_command', description: `Run one of: ${[...ALLOWED_COMMANDS].join(', ')}.`,
      parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
  ];

  const toolHandlers = {
    async list_files(args) {
      try {
        const base = args.dir ? resolveSafe(root, String(args.dir)) : root;
        await assertRealInside(root, base);
        const out = [];
        const walk = async (dir) => {
          for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
            if (out.length >= MAX_LIST) return;
            if (entry.name === '.git' || entry.name === 'node_modules') continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) await walk(full);
            else out.push(path.relative(root, full));
          }
        };
        await walk(base);
        return ok(out.sort().join('\n') || '(empty)');
      } catch (e) { return fail(e); }
    },

    async read_file(args) {
      try {
        const abs = resolveSafe(root, args.path);
        await assertRealInside(root, abs);
        return ok(truncate(await fs.readFile(abs, 'utf8')));
      } catch (e) { return fail(e); }
    },

    async post_plan(args) {
      try {
        const md = String(args.markdown ?? '').trim();
        if (!md) throw new Error('plan is empty');
        await postPlan(md.startsWith('## Agent plan') ? md : `## Agent plan\n\n${md}`);
        state.planPosted = true;
        return ok('Plan posted to the issue. You may now write files.');
      } catch (e) { return fail(e); }
    },

    async write_file(args) {
      try {
        if (!state.planPosted) throw new Error('Post your plan with post_plan before writing files.');
        if (typeof args.content !== 'string') throw new Error('content must be a string');
        const abs = resolveSafe(root, args.path, { write: true });
        await assertRealInside(root, abs);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, args.content, 'utf8');
        return ok(`Wrote ${args.path} (${args.content.length} chars)`);
      } catch (e) { return fail(e); }
    },

    async run_command(args) { return runAllowed(root, args.command); },
  };

  return { clientTools, toolHandlers, state };
}
