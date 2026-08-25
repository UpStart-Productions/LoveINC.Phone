#!/usr/bin/env node
/**
 * Build a GrovLink OTA bundle zip for admin upload.
 *
 * Bumps src/app-version.json semver (patch by default), production-builds www,
 * zips www contents (index.html at zip root), prints checksum + upload hints.
 * Does NOT sync Xcode or cap sync — OTA is web-only; the native shell stays as-is.
 *
 * Usage:
 *   node scripts/deploy-ota.js              # patch bump + build + zip
 *   node scripts/deploy-ota.js minor|major    # semver bump
 *   node scripts/deploy-ota.js --no-bump      # build + zip current version
 *   node scripts/deploy-ota.js 1.0.9          # set exact semver + build + zip
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const versionFile = path.join(root, 'src/app-version.json');
const wwwDir = path.join(root, 'www');
const outDir = path.join(root, 'dist-ota');
const semverPattern = /^\d+\.\d+\.\d+$/;

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function loadVersion() {
  try {
    return JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  } catch (e) {
    console.error('deploy-ota: cannot read', versionFile, e);
    process.exit(1);
  }
}

function saveVersion(versionData) {
  versionData.lastUpdated = new Date().toISOString();
  fs.writeFileSync(versionFile, `${JSON.stringify(versionData, null, 2)}\n`, 'utf8');
}

function bumpSemver(versionData, type) {
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
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--no-bump')) {
    return { mode: 'no-bump' };
  }
  if (args.length === 1 && semverPattern.test(args[0])) {
    return { mode: 'exact', version: args[0] };
  }
  if (args.length === 0) {
    return { mode: 'bump', bump: 'patch' };
  }
  if (args.length === 1 && ['patch', 'minor', 'major'].includes(args[0])) {
    return { mode: 'bump', bump: args[0] };
  }
  console.error(
    'Usage: node scripts/deploy-ota.js [patch|minor|major|--no-bump|<semver>]',
  );
  process.exit(1);
}

function resolveVersion() {
  const parsed = parseArgs(process.argv);
  const versionData = loadVersion();

  if (parsed.mode === 'no-bump') {
    if (!semverPattern.test(String(versionData.version))) {
      console.error('deploy-ota: app-version.json version must be semver (e.g. 1.0.8)');
      process.exit(1);
    }
    console.log(`Using current version ${versionData.version} (no bump).`);
    return versionData.version;
  }

  if (parsed.mode === 'exact') {
    versionData.version = parsed.version;
    saveVersion(versionData);
    console.log(`app-version.json → ${versionData.version}`);
    return versionData.version;
  }

  console.log(`Bumping semver (${parsed.bump})…`);
  bumpSemver(versionData, parsed.bump);
  saveVersion(versionData);
  console.log(`app-version.json → ${versionData.version}`);
  return versionData.version;
}

function assertWwwReady() {
  const indexPath = path.join(wwwDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('deploy-ota: www/index.html missing after build.');
    process.exit(1);
  }
}

function createZip(version) {
  fs.mkdirSync(outDir, { recursive: true });
  const zipName = `loveinc-${version}.zip`;
  const zipPath = path.join(outDir, zipName);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  // Zip www *contents* so index.html sits at the archive root (GrovLink admin validates this).
  run(`cd "${wwwDir}" && zip -rq "${zipPath}" .`);
  return zipPath;
}

function sha256Hex(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const version = resolveVersion();
console.log('Production build…');
run('npx ng build --configuration production');
assertWwwReady();

const zipPath = createZip(version);
const { size } = fs.statSync(zipPath);
const checksum = sha256Hex(zipPath);

console.log('');
console.log('OTA bundle ready:');
console.log(`  Version:  ${version}`);
console.log(`  File:     ${zipPath}`);
console.log(`  Size:     ${formatBytes(size)}`);
console.log(`  SHA-256:  ${checksum}`);
console.log('');
console.log('Next: GrovLink admin → affiliate → OTA Updates');
console.log(`  1. Upload ${path.basename(zipPath)} with version ${version}`);
console.log('  2. Set Active Bundle, Rollout 100%, kill switch off, save');
console.log('  3. Force-quit the app twice on device (download, then apply)');

try {
  execSync(`open "${outDir}"`, { stdio: 'ignore' });
} catch {
  // Non-macOS or headless — ignore.
}
