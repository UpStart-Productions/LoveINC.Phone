/**
 * App Store / release pipeline for iOS:
 * - bump src/app-version.json + sync MARKETING_VERSION / CURRENT_PROJECT_VERSION in Xcode
 *   (default: semver patch + build; pass `build` for build-only when marketing version stays the same)
 * - production Angular build → www (version badge reads app-version.json)
 * - cap sync ios
 * - remove live-reload `server` from native capacitor.config.json (Ionic -l injects LAN URL)
 * - open Xcode for Archive
 *
 * Usage: node scripts/ship-ios-app-store.js [patch|minor|major|build]
 * Default: patch
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const iosCapConfig = path.join(root, 'ios/App/App/capacitor.config.json');

const bumpArg = process.argv[2] || 'patch';
const allowedBumps = ['major', 'minor', 'patch', 'build'];
if (!allowedBumps.includes(bumpArg)) {
  console.error(
    `ship-ios-app-store: bump must be one of: ${allowedBumps.join(', ')} (got ${JSON.stringify(process.argv[2])})`,
  );
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function stripLiveReloadServerFromIosConfig() {
  if (!fs.existsSync(iosCapConfig)) {
    console.error('ship-ios-app-store: missing', iosCapConfig);
    process.exit(1);
  }
  const raw = fs.readFileSync(iosCapConfig, 'utf8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    console.error('ship-ios-app-store: invalid JSON in', iosCapConfig);
    process.exit(1);
  }
  if (!config.server) {
    assertNoLiveReloadServerInNativeConfig(iosCapConfig);
    return;
  }
  delete config.server;
  fs.writeFileSync(iosCapConfig, `${JSON.stringify(config, null, '\t')}\n`, 'utf8');
  console.log('Removed `server` from ios/App/App/capacitor.config.json (live reload must not ship).');
  assertNoLiveReloadServerInNativeConfig(iosCapConfig);
}

function assertNoLiveReloadServerInNativeConfig(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (parsed.server != null && typeof parsed.server === 'object') {
    console.error(
      'ship-ios-app-store: native ios/App/App/capacitor.config.json still contains a `server` block. ' +
        'Shipping with this causes the WKWebView to load the dev-machine URL → white screen / wrong content in Review.',
    );
    process.exit(1);
  }
}

run(`node scripts/bump-version.js ${bumpArg}`);
run('npx ng build --configuration production');
run('npx cap sync ios');
stripLiveReloadServerFromIosConfig();
run('open -a Xcode ios/App/App.xcworkspace');
