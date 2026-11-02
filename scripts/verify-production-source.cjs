const { spawnSync } = require('node:child_process');

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

const containsMain = git(['merge-base', '--is-ancestor', 'origin/main', 'HEAD']);
if (containsMain.status !== 0) {
  const branch = git(['branch', '--show-current']).stdout.trim() || '(detached HEAD)';
  console.error(`Production deploy blocked: ${branch} does not contain the latest origin/main.`);
  console.error('Rebase or merge the requested update onto origin/main before publishing the full site.');
  process.exit(1);
}

console.log('PASS: production source contains the latest canonical main branch.');
