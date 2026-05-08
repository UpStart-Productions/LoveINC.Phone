/**
 * Writes MARKETING_VERSION and CURRENT_PROJECT_VERSION in the Xcode project
 * from src/app-version.json (single source of truth).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const versionFile = path.join(root, 'src/app-version.json');
const pbxprojPath = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');

function loadVersion() {
  const raw = fs.readFileSync(versionFile, 'utf8');
  const data = JSON.parse(raw);
  if (!data.version || typeof data.build !== 'number') {
    console.error('sync-ios-from-app-version: invalid app-version.json');
    process.exit(1);
  }
  return data;
}

function syncIos(versionData) {
  if (!fs.existsSync(pbxprojPath)) {
    console.error('sync-ios-from-app-version: missing', pbxprojPath);
    process.exit(1);
  }
  let content = fs.readFileSync(pbxprojPath, 'utf8');
  const marketingBefore = [...content.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
  const currentBefore = [...content.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => m[1]);

  if (marketingBefore.length === 0 || currentBefore.length === 0) {
    console.error('sync-ios-from-app-version: could not find version keys in pbxproj');
    process.exit(1);
  }

  const v = String(versionData.version).trim();
  const b = String(Math.floor(Number(versionData.build)));

  content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${v};`);
  content = content.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${b};`);

  const marketingAfter = [...content.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
  const currentAfter = [...content.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => m[1]);
  const uniqM = [...new Set(marketingAfter)];
  const uniqC = [...new Set(currentAfter)];
  if (uniqM.length !== 1 || uniqM[0] !== v || uniqC.length !== 1 || uniqC[0] !== b) {
    console.error('sync-ios-from-app-version: pbxproj replace did not produce consistent values');
    process.exit(1);
  }

  fs.writeFileSync(pbxprojPath, content, 'utf8');
  console.log(`iOS sync: MARKETING_VERSION = ${v}, CURRENT_PROJECT_VERSION = ${b}`);
}

const isMain = require.main === module;
if (isMain) {
  syncIos(loadVersion());
}

module.exports = { loadVersion, syncIos, versionFile, pbxprojPath };
