/**
 * Makes sure an Android emulator (or real device) is connected before a
 * cap:run:android / cap:run:android:live / cap:test:android command proceeds.
 *
 * - If `adb devices` already shows a connected device/emulator, does nothing.
 * - Otherwise boots an AVD (default: DEFAULT_AVD below, override with
 *   `--avd "Name"` or the ANDROID_AVD env var) and waits until Android has
 *   fully finished booting before handing control back.
 *
 * SDK location is read from android/local.properties (sdk.dir), which
 * Android Studio keeps up to date per-machine — falls back to $ANDROID_HOME.
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const DEFAULT_AVD = 'Pixel_7a';

function getSdkDir() {
  const localPropsPath = path.join(root, 'android/local.properties');
  if (fs.existsSync(localPropsPath)) {
    const raw = fs.readFileSync(localPropsPath, 'utf8');
    const match = raw.match(/^sdk\.dir=(.+)$/m);
    if (match) return match[1].trim();
  }
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT;
  console.error(
    'ensure-android-emulator: could not find the Android SDK (no android/local.properties sdk.dir, ' +
      'no $ANDROID_HOME, no $ANDROID_SDK_ROOT). Open the project in Android Studio once to generate local.properties.',
  );
  process.exit(1);
}

function getAvdArg() {
  const flagIdx = process.argv.indexOf('--avd');
  if (flagIdx !== -1 && process.argv[flagIdx + 1]) return process.argv[flagIdx + 1];
  if (process.env.ANDROID_AVD) return process.env.ANDROID_AVD;
  return DEFAULT_AVD;
}

const sdkDir = getSdkDir();
const adb = path.join(sdkDir, 'platform-tools', 'adb');
const emulatorBin = path.join(sdkDir, 'emulator', 'emulator');

// A long-lived adb server (e.g. left over from an earlier session with the
// emulator already running) tends to go flaky and trigger Capacitor's
// kill-server-and-retry deploy logic mid-install, which can race the
// device's reauthorization and fail with "device still authorizing".
// Restarting the server fresh, every run, avoids that.
console.log('Restarting adb server...');
spawnSync(adb, ['kill-server']);
spawnSync(adb, ['start-server'], { stdio: 'inherit' });

function hasConnectedDevice() {
  const result = spawnSync(adb, ['devices'], { encoding: 'utf8' });
  if (result.status !== 0) return false;
  const lines = result.stdout.split('\n').slice(1);
  return lines.some((line) => /\bdevice\b/.test(line) && !line.includes('offline'));
}

function listAvds() {
  const result = spawnSync(emulatorBin, ['-list-avds'], { encoding: 'utf8' });
  return result.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

function waitForBoot(timeoutMs = 180000) {
  const start = Date.now();
  spawnSync(adb, ['wait-for-device'], { stdio: 'inherit' });
  process.stdout.write('Waiting for Android to finish booting');
  while (Date.now() - start < timeoutMs) {
    const result = spawnSync(adb, ['shell', 'getprop', 'sys.boot_completed'], { encoding: 'utf8' });
    if (result.stdout && result.stdout.trim() === '1') {
      console.log('\nEmulator ready.');
      return;
    }
    process.stdout.write('.');
    spawnSync('sleep', ['2']);
  }
  console.error('\nensure-android-emulator: timed out waiting for emulator to finish booting.');
  process.exit(1);
}

if (hasConnectedDevice()) {
  console.log('Android device/emulator already connected — skipping emulator launch.');
  process.exit(0);
}

const avdName = getAvdArg();
const available = listAvds();
if (!available.includes(avdName)) {
  console.error(
    `ensure-android-emulator: AVD "${avdName}" not found. Available: ${available.join(', ') || '(none)'}.\n` +
      'Pass a different one with `--avd "Name"` or set ANDROID_AVD.',
  );
  process.exit(1);
}

console.log(`No device connected — booting emulator "${avdName}"…`);
const child = spawn(emulatorBin, ['-avd', avdName, '-netdelay', 'none', '-netspeed', 'full'], {
  detached: true,
  stdio: 'ignore',
});
child.unref();

waitForBoot();
