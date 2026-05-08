/**
 * Increments build in src/app-version.json and syncs CURRENT_PROJECT_VERSION in Xcode.
 * Prefer: npm run version:build
 * Kept as alias for older habits; ship:ios uses bump-version directly (default patch).
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
execSync('node scripts/bump-version.js build', { cwd: root, stdio: 'inherit' });
