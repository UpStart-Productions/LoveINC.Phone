const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../dist/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.main = 'fesm2022/simple-budget.mjs';
pkg.module = 'fesm2022/simple-budget.mjs';
pkg.types = 'index.d.ts';
delete pkg.files;
if (pkg.exports?.['.']) {
  pkg.exports['.'].import = 'fesm2022/simple-budget.mjs';
  pkg.exports['.'].default = 'fesm2022/simple-budget.mjs';
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log('Fixed dist/package.json entry points');
