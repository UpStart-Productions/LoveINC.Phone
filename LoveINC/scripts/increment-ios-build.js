/**
 * Increments CURRENT_PROJECT_VERSION in the iOS Xcode project (all configurations).
 * Run only as part of a release / App Store ship workflow.
 */
const fs = require('fs');
const path = require('path');

const pbxprojPath = path.join(
  __dirname,
  '../ios/App/App.xcodeproj/project.pbxproj'
);

const content = fs.readFileSync(pbxprojPath, 'utf8');
const re = /CURRENT_PROJECT_VERSION = (\d+);/g;
const matches = [...content.matchAll(re)];

if (matches.length === 0) {
  console.error('increment-ios-build: no CURRENT_PROJECT_VERSION entries found in', pbxprojPath);
  process.exit(1);
}

const values = [...new Set(matches.map((m) => m[1]))];
if (values.length !== 1) {
  console.error(
    'increment-ios-build: inconsistent CURRENT_PROJECT_VERSION values:',
    values.join(', ')
  );
  process.exit(1);
}

const current = parseInt(values[0], 10);
const next = current + 1;

const updated = content.replace(re, `CURRENT_PROJECT_VERSION = ${next};`);
fs.writeFileSync(pbxprojPath, updated, 'utf8');

console.log(`iOS build number: ${current} → ${next}`);
