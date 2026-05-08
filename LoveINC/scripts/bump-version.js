#!/usr/bin/env node
/**
 * Bump src/app-version.json and sync ios/App/App.xcodeproj/project.pbxproj.
 *
 * Usage: node scripts/bump-version.js [major|minor|patch|build]
 *   patch|minor|major — semver bump + build +1
 *   build — build +1 only (typical between App Store uploads for same marketing version)
 */
const fs = require('fs');
const path = require('path');
const { syncIos } = require('./sync-ios-from-app-version.js');

const versionFile = path.join(__dirname, '..', 'src/app-version.json');

function loadVersion() {
  try {
    return JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  } catch (e) {
    console.error('bump-version: cannot read', versionFile, e);
    process.exit(1);
  }
}

function saveVersion(versionData) {
  versionData.lastUpdated = new Date().toISOString();
  fs.writeFileSync(versionFile, `${JSON.stringify(versionData, null, 2)}\n`, 'utf8');
  console.log(`app-version.json → ${versionData.version} (build ${versionData.build})`);
}

function bumpSemver(type, versionData) {
  const parts = String(versionData.version).split('.').map(Number);
  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;
  switch (type) {
    case 'major':
      versionData.version = `${major + 1}.0.0`;
      break;
    case 'minor':
      versionData.version = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      versionData.version = `${major}.${minor}.${patch + 1}`;
      break;
  }
  versionData.build = Math.floor(Number(versionData.build || 0)) + 1;
}

function bumpBuildOnly(versionData) {
  versionData.build = Math.floor(Number(versionData.build || 0)) + 1;
}

const type = process.argv[2] || 'patch';
const allowed = ['major', 'minor', 'patch', 'build'];
if (!allowed.includes(type)) {
  console.error('Usage: node scripts/bump-version.js [major|minor|patch|build]');
  process.exit(1);
}

const versionData = loadVersion();
console.log(`Bumping (${type})…`);
if (type === 'build') {
  bumpBuildOnly(versionData);
} else {
  bumpSemver(type, versionData);
}

saveVersion(versionData);
syncIos(versionData);
