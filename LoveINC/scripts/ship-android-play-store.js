/**
 * Play Store / release pipeline for Android:
 * - bump src/app-version.json + sync versionName / versionCode in Android
 *   (default: semver patch + build; pass `build` for build-only when marketing version stays the same)
 * - production Angular build → www (version badge reads app-version.json)
 * - cap sync android
 * - remove live-reload `server` from native capacitor.config.json (Ionic -l injects LAN URL)
 * - build the signed release .aab via Gradle (uses android/keystore.properties)
 *
 * Usage: node scripts/ship-android-play-store.js [patch|minor|major|build]
 * Default: patch
 *
 * Unlike ship-ios-app-store.js, this does NOT open an IDE — Android's CLI tooling
 * (Gradle) builds and signs the release artifact directly. Upload the resulting
 * Copies the signed .aab to dist-play/loveinc-{version}-build{build}-release.aab
 * for upload (Gradle still writes android/.../app-release.aab).
 * Upload the versioned file to Play Console → your release track manually.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const versionFile = path.join(root, 'src/app-version.json');
const androidCapConfig = path.join(root, 'android/app/src/main/assets/capacitor.config.json');
const aabOutputPath = path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab');
const distPlayDir = path.join(root, 'dist-play');

const bumpArg = process.argv[2] || 'patch';
const allowedBumps = ['major', 'minor', 'patch', 'build'];
if (!allowedBumps.includes(bumpArg)) {
  console.error(
    `ship-android-play-store: bump must be one of: ${allowedBumps.join(', ')} (got ${JSON.stringify(process.argv[2])})`,
  );
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function stripLiveReloadServerFromAndroidConfig() {
  if (!fs.existsSync(androidCapConfig)) {
    console.error('ship-android-play-store: missing', androidCapConfig);
    process.exit(1);
  }
  const raw = fs.readFileSync(androidCapConfig, 'utf8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    console.error('ship-android-play-store: invalid JSON in', androidCapConfig);
    process.exit(1);
  }
  if (!config.server) {
    assertNoLiveReloadServerInNativeConfig(androidCapConfig);
    return;
  }
  delete config.server;
  fs.writeFileSync(androidCapConfig, `${JSON.stringify(config, null, '\t')}\n`, 'utf8');
  console.log('Removed `server` from android/app/src/main/assets/capacitor.config.json (live reload must not ship).');
  assertNoLiveReloadServerInNativeConfig(androidCapConfig);
}

function assertNoLiveReloadServerInNativeConfig(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (parsed.server != null && typeof parsed.server === 'object') {
    console.error(
      'ship-android-play-store: native android capacitor.config.json still contains a `server` block. ' +
        'Shipping with this causes the WebView to load the dev-machine URL → blank screen / wrong content in Review.',
    );
    process.exit(1);
  }
}

function loadVersion() {
  try {
    return JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  } catch (e) {
    console.error('ship-android-play-store: cannot read', versionFile, e);
    process.exit(1);
  }
}

function copyVersionedReleaseBundle() {
  const { version, build } = loadVersion();
  const versionedName = `loveinc-${version}-build${build}-release.aab`;
  fs.mkdirSync(distPlayDir, { recursive: true });
  const versionedPath = path.join(distPlayDir, versionedName);
  if (fs.existsSync(versionedPath)) {
    fs.unlinkSync(versionedPath);
  }
  fs.copyFileSync(aabOutputPath, versionedPath);
  return versionedPath;
}

run(`node scripts/bump-version.js ${bumpArg}`);
run('npx ng build --configuration production');
run('npx cap sync android');
stripLiveReloadServerFromAndroidConfig();

const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(`cd android && ${gradlewCmd} bundleRelease`);

if (!fs.existsSync(aabOutputPath)) {
  console.error('ship-android-play-store: expected output not found at', aabOutputPath);
  process.exit(1);
}

const versionedAabPath = copyVersionedReleaseBundle();
console.log(`\nSigned release bundle ready:`);
console.log(`  Gradle:   ${aabOutputPath}`);
console.log(`  Upload:   ${versionedAabPath}`);
console.log('Upload the versioned .aab to Play Console → your release track.');

try {
  execSync(`open "${distPlayDir}"`, { stdio: 'ignore' });
} catch {
  // Non-macOS or headless — ignore.
}
