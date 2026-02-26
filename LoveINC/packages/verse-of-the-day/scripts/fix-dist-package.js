const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../dist/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.main = 'fesm2022/verse-of-the-day.mjs';
pkg.module = 'fesm2022/verse-of-the-day.mjs';
pkg.types = 'index.d.ts';
delete pkg.files; // dist/ is the publish root; no subfolder
if (pkg.exports?.['.']) {
  pkg.exports['.'].import = 'fesm2022/verse-of-the-day.mjs';
  pkg.exports['.'].default = 'fesm2022/verse-of-the-day.mjs';
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// Copy .npmrc to dist for GitHub Packages publish
const npmrcSrc = path.join(__dirname, '../.npmrc');
const npmrcDest = path.join(__dirname, '../dist/.npmrc');
if (fs.existsSync(npmrcSrc)) {
  fs.copyFileSync(npmrcSrc, npmrcDest);
}

console.log('Fixed dist/package.json entry points');
