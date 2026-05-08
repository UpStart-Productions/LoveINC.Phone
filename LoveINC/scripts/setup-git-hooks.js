#!/usr/bin/env node
/**
 * Optional: post-merge on `main` runs patch version bump + commits app-version.json + iOS pbxproj.
 * Run once from the LoveINC folder: npm run setup:git-hooks
 */
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');

function findGitDir() {
  let cursor = appRoot;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(cursor, '.git');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return null;
}

const gitDir = findGitDir();
if (!gitDir) {
  console.error('setup-git-hooks: no .git found above', appRoot);
  process.exit(1);
}

const gitRoot = path.dirname(gitDir);
const rel = path.relative(gitRoot, appRoot).replace(/\\/g, '/');
const p = rel && rel !== '.' ? `${rel}/` : '';

const appCd = p ? `"$GIT_ROOT/${rel}"` : '"$GIT_ROOT"';

const hookBody = `#!/bin/sh
branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "main" ] || exit 0
GIT_ROOT=$(git rev-parse --show-toplevel)
cd ${appCd} || exit 1
[ -f scripts/bump-version.js ] || exit 0
echo "Post-merge (main): patch version bump..."
node scripts/bump-version.js patch || exit 1
cd "$GIT_ROOT" || exit 1
git add "${p}src/app-version.json" "${p}ios/App/App.xcodeproj/project.pbxproj"
if ! git diff --cached --quiet; then
  git commit -m "chore: bump app version after merge to main"
fi
`;

const hooksDir = path.join(gitDir, 'hooks');
const postMergeFile = path.join(hooksDir, 'post-merge');
if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });
fs.writeFileSync(postMergeFile, hookBody, 'utf8');
fs.chmodSync(postMergeFile, 0o755);
console.log('Installed', postMergeFile, '(patch bump on merge to main)');
console.log('Git root:', gitRoot, 'App path rel:', rel || '.');
