/**
 * Writes versionName and versionCode in android/app/build.gradle
 * from src/app-version.json (single source of truth).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const versionFile = path.join(root, 'src/app-version.json');
const buildGradlePath = path.join(root, 'android/app/build.gradle');

function loadVersion() {
  const raw = fs.readFileSync(versionFile, 'utf8');
  const data = JSON.parse(raw);
  if (!data.version || typeof data.build !== 'number') {
    console.error('sync-android-from-app-version: invalid app-version.json');
    process.exit(1);
  }
  return data;
}

function syncAndroid(versionData) {
  if (!fs.existsSync(buildGradlePath)) {
    console.error('sync-android-from-app-version: missing', buildGradlePath);
    process.exit(1);
  }
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  const versionCodeBefore = [...content.matchAll(/versionCode\s+(\d+)/g)].map((m) => m[1]);
  const versionNameBefore = [...content.matchAll(/versionName\s+"([^"]+)"/g)].map((m) => m[1]);

  if (versionCodeBefore.length === 0 || versionNameBefore.length === 0) {
    console.error('sync-android-from-app-version: could not find version keys in build.gradle');
    process.exit(1);
  }

  const v = String(versionData.version).trim();
  const b = String(Math.floor(Number(versionData.build)));

  content = content.replace(/versionCode\s+\d+/g, `versionCode ${b}`);
  content = content.replace(/versionName\s+"[^"]+"/g, `versionName "${v}"`);

  const versionCodeAfter = [...content.matchAll(/versionCode\s+(\d+)/g)].map((m) => m[1]);
  const versionNameAfter = [...content.matchAll(/versionName\s+"([^"]+)"/g)].map((m) => m[1]);
  const uniqC = [...new Set(versionCodeAfter)];
  const uniqN = [...new Set(versionNameAfter)];
  if (uniqC.length !== 1 || uniqC[0] !== b || uniqN.length !== 1 || uniqN[0] !== v) {
    console.error('sync-android-from-app-version: build.gradle replace did not produce consistent values');
    process.exit(1);
  }

  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log(`Android sync: versionName = ${v}, versionCode = ${b}`);
}

const isMain = require.main === module;
if (isMain) {
  syncAndroid(loadVersion());
}

module.exports = { loadVersion, syncAndroid, versionFile, buildGradlePath };
