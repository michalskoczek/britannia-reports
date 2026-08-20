#!/usr/bin/env node
/**
 * PostToolUse hook (matcher `Write|Edit`): lint-and-fix only the file the agent just touched.
 *
 * Reads the hook payload from stdin, pulls `tool_input.file_path`, and runs ESLint's Node API
 * on that single path. Linting the whole repo instead would cost seconds on every edit, and
 * PostToolUse fires once per tool use — three edits in one turn would pay it three times.
 *
 * Signal contract:
 *   exit 0 — nothing to say (not a lintable file, ignored by eslint.config.js, or clean after --fix)
 *   exit 2 — errors ESLint could not auto-fix; stderr is fed back to the agent so it can correct them
 *   exit 1 — the hook itself broke; non-blocking, surfaced but does not interrupt work
 *
 * Warnings never block: they are reported by the pre-commit layer, not per edit.
 */

const path = require('path');

const LINTABLE = new Set(['.ts', '.html']);
const MAX_FEEDBACK_CHARS = 10000;

function readStdin() {
  return new Promise((resolve, reject) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (raw += chunk));
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) return 0;

  const filePath = JSON.parse(raw)?.tool_input?.file_path;
  if (!filePath) return 0;
  if (!LINTABLE.has(path.extname(filePath).toLowerCase())) return 0;

  // Edits outside this project (another working directory, a scratchpad) are none of our business.
  const absolute = path.resolve(filePath);
  const root = process.cwd();
  if (path.relative(root, absolute).startsWith('..')) return 0;

  const { ESLint } = require('eslint');
  const eslint = new ESLint({ fix: true, cwd: root });

  if (await eslint.isPathIgnored(absolute)) return 0;

  const results = await eslint.lintFiles([absolute]);
  await ESLint.outputFixes(results);

  const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
  if (errorCount === 0) return 0;

  const formatter = await eslint.loadFormatter('stylish');
  const report = await formatter.format(results);
  process.stderr.write(report.slice(0, MAX_FEEDBACK_CHARS));
  return 2;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    process.stderr.write(`eslint hook failed: ${error?.stack || error}\n`);
    process.exit(1);
  },
);
