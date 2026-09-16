#!/usr/bin/env node
/**
 * One-command Android dev loop, no Android Studio required:
 *  1. Ensures an emulator/device is connected (scripts/ensure-android-emulator.js).
 *  2. Builds and installs the app with Ionic live reload (-l --external), so web
 *     changes (JS/HTML/CSS) show up on save without a native rebuild - and,
 *     critically, without going through capacitor-updater's OTA bundle at all,
 *     so a device that previously pulled an OTA update can't get "stuck" on a
 *     stale bundle while you're iterating.
 *  3. Streams this app's logcat (crashes, console.log/error, plugin logs) to
 *     this terminal - the same info Android Studio's Logcat panel shows.
 *
 * Usage: npm run cap:run:android
 *        npm run cap:run:android -- --avd "Pixel_7a"   (forwarded to step 1)
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const APP_ID = 'org.loveincnewberg.app';

function getSdkDir() {
  const localPropsPath = path.join(root, 'android/local.properties');
  if (fs.existsSync(localPropsPath)) {
    const raw = fs.readFileSync(localPropsPath, 'utf8');
    const match = raw.match(/^sdk\.dir=(.+)$/m);
    if (match) return match[1].trim();
  }
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT;
  console.error('run-android-live: could not find the Android SDK (no android/local.properties sdk.dir, no $ANDROID_HOME/$ANDROID_SDK_ROOT).');
  process.exit(1);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// 1. Emulator/device
run('node', ['scripts/ensure-android-emulator.js', ...process.argv.slice(2)]);

// 2. Build once up front (live reload still needs an initial native install)
run('npx', ['ng', 'build']);

const sdkDir = getSdkDir();
const adb = path.join(sdkDir, 'platform-tools', 'adb');

function getPid() {
  const result = spawnSync(adb, ['shell', 'pidof', '-s', APP_ID], { encoding: 'utf8' });
  const pid = result.stdout && result.stdout.trim();
  return pid && /^\d+$/.test(pid) ? pid : null;
}

function streamLogcat() {
  console.log(`\n[logcat] waiting for ${APP_ID} to launch...`);
  const start = Date.now();
  let pid = null;
  while (Date.now() - start < 180000) {
    pid = getPid();
    if (pid) break;
    spawnSync('sleep', ['1']);
  }
  if (!pid) {
    console.error(`[logcat] ${APP_ID} did not launch within 180s - continuing without log streaming.`);
    return;
  }
  console.log(`[logcat] streaming ${APP_ID} (pid ${pid}). Crashes, console.log/error, and plugin logs will show up below.\n`);
  spawnSync(adb, ['logcat', '-c']);
  const logcat = spawn(adb, ['logcat', '--pid', pid, '-v', 'color'], { stdio: 'inherit' });
  process.on('exit', () => {
    try { logcat.kill(); } catch { /* already gone */ }
  });
}

// 3 & 4 run concurrently: the live-reload dev server/install (foreground,
// long-running) and the logcat stream (waits for the pid, then tails).
const capRun = spawn('npx', ['ionic', 'cap', 'run', 'android', '-l', '--external'], {
  stdio: 'inherit',
  cwd: root,
  shell: process.platform === 'win32',
});

streamLogcat();

capRun.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => {
  try { capRun.kill('SIGINT'); } catch { /* already gone */ }
  process.exit(0);
});
