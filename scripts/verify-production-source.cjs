const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

const canonicalRoot = '/Users/davidjergovic/Documents/Codex/oneshotlens-site';
if (fs.realpathSync(process.cwd()) !== canonicalRoot) {
  console.error('Production deploy blocked: run only from the canonical checkout ' + canonicalRoot);
  process.exit(1);
}

function git(args, options = {}) {
  return spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
  });
}

const insideWorktree = git(['rev-parse', '--is-inside-work-tree']);
if (insideWorktree.status !== 0 || insideWorktree.stdout.trim() !== 'true') {
  console.error('Production deploy blocked: this directory is not a Git worktree.');
  process.exit(1);
}

const fetchMain = git(['fetch', 'origin', 'main', '--quiet']);
if (fetchMain.status !== 0) {
  console.error('Production deploy blocked: origin/main could not be refreshed.');
  console.error(fetchMain.stderr.trim());
  process.exit(1);
}

const branch = git(['branch', '--show-current']).stdout.trim() || '(detached HEAD)';
if (branch !== 'main') {
  console.error(`Production deploy blocked: production must be published from main, not ${branch}.`);
  process.exit(1);
}

const head = git(['rev-parse', 'HEAD']).stdout.trim();
const originMain = git(['rev-parse', 'origin/main']).stdout.trim();
if (!head || head !== originMain) {
  console.error('Production deploy blocked: HEAD must exactly match the latest origin/main.');
  console.error('Commit and push the complete requested update before publishing.');
  process.exit(1);
}

const worktreeStatus = git(['status', '--porcelain', '--untracked-files=all']).stdout.trim();
if (worktreeStatus) {
  console.error('Production deploy blocked: the canonical checkout has uncommitted files.');
  console.error('Commit and push the complete requested update before publishing.');
  process.exit(1);
}

console.log('PASS: production source is a clean, exact copy of canonical origin/main.');
