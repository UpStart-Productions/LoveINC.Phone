/**
 * App Store / release pipeline for iOS:
 * - bump src/app-version.json + sync MARKETING_VERSION / CURRENT_PROJECT_VERSION in Xcode
 *   (default: semver patch + build; pass `build` for build-only when marketing version stays the same)
 * - production Angular build → www (version badge reads app-version.json)
 * - cap sync ios
 * - remove live-reload `server` from native capacitor.config.json (Ionic -l injects LAN URL)
 * - xcodebuild Release archive + App Store export (.ipa)
 * - open the .xcarchive in Xcode (Organizer) for upload / validation
 *
 * Usage: node scripts/ship-ios-app-store.js [patch|minor|major|build] [--open-workspace]
 * Default: patch
 *
 * Flags:
 *   --open-workspace  Skip archive; only open App.xcworkspace (legacy manual Archive flow)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const iosAppDir = path.join(root, 'ios/App');
const iosCapConfig = path.join(iosAppDir, 'App/capacitor.config.json');
const versionFile = path.join(root, 'src/app-version.json');
const exportOptionsPlist = path.join(iosAppDir, 'ExportOptions.appstore.plist');
const distIosDir = path.join(root, 'dist-ios');

const argv = process.argv.slice(2);
const openWorkspaceOnly = argv.includes('--open-workspace');
const bumpArg = argv.find((a) => ['major', 'minor', 'patch', 'build'].includes(a)) || 'patch';

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

function loadVersion() {
  return JSON.parse(fs.readFileSync(versionFile, 'utf8'));
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

function archiveAndExportForAppStore(versionData) {
  if (!fs.existsSync(exportOptionsPlist)) {
    console.error('ship-ios-app-store: missing', exportOptionsPlist);
    process.exit(1);
  }

  const archivePath = path.join(iosAppDir, 'build', 'LoveINC.xcarchive');
  const exportDir = path.join(
    distIosDir,
    `loveinc-${versionData.version}-build${versionData.build}-appstore`,
  );
  const ipaPath = path.join(exportDir, 'App.ipa');

  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  fs.mkdirSync(distIosDir, { recursive: true });
  if (fs.existsSync(exportDir)) {
    fs.rmSync(exportDir, { recursive: true, force: true });
  }
  fs.mkdirSync(exportDir, { recursive: true });

  console.log('\nship-ios-app-store: archiving (Release, generic iOS device)…');
  run(
    [
      'xcodebuild',
      '-workspace App.xcworkspace',
      '-scheme App',
      '-configuration Release',
      '-destination generic/platform=iOS',
      '-archivePath',
      JSON.stringify(archivePath),
      '-allowProvisioningUpdates',
      'archive',
    ].join(' '),
    iosAppDir,
  );

  console.log('\nship-ios-app-store: exporting App Store .ipa…');
  run(
    [
      'xcodebuild',
      '-exportArchive',
      '-archivePath',
      JSON.stringify(archivePath),
      '-exportOptionsPlist',
      JSON.stringify(exportOptionsPlist),
      '-exportPath',
      JSON.stringify(exportDir),
      '-allowProvisioningUpdates',
    ].join(' '),
    iosAppDir,
  );

  if (!fs.existsSync(ipaPath)) {
    console.error('ship-ios-app-store: export finished but .ipa not found at', ipaPath);
    process.exit(1);
  }

  const versionedIpa = path.join(
    distIosDir,
    `loveinc-${versionData.version}-build${versionData.build}-appstore.ipa`,
  );
  fs.copyFileSync(ipaPath, versionedIpa);

  console.log('\nship-ios-app-store: archive:', archivePath);
  console.log('ship-ios-app-store: .ipa (export folder):', ipaPath);
  console.log('ship-ios-app-store: .ipa (versioned copy):', versionedIpa);
  console.log('\nOpening archive in Xcode Organizer…');
  run(`open ${JSON.stringify(archivePath)}`);
}

run(`node scripts/bump-version.js ${bumpArg}`);
run('npx ng build --configuration production');
run('npx cap sync ios');
stripLiveReloadServerFromIosConfig();

if (openWorkspaceOnly) {
  run('open -a Xcode ios/App/App.xcworkspace');
} else {
  archiveAndExportForAppStore(loadVersion());
}
