/**
 * App Store / release pipeline for iOS:
 * - bump build in src/app-version.json + sync MARKETING_VERSION / CURRENT_PROJECT_VERSION in Xcode
 * - production Angular build → www (version badge reads app-version.json)
 * - cap sync ios
 * - remove live-reload `server` from native capacitor.config.json (Ionic -l injects LAN URL)
 * - open Xcode for Archive
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const iosCapConfig = path.join(root, 'ios/App/App/capacitor.config.json');

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

run('node scripts/increment-ios-build.js');
run('npx ng build --configuration production');
run('npx cap sync ios');
stripLiveReloadServerFromIosConfig();
run('open -a Xcode ios/App/App.xcworkspace');
