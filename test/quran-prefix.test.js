'use strict';
// كل آية قرآنية في نصوص اللعبة (بين ﴿ ﴾) تسبقها «قال تعالى:» بقرار بن محمود: node test/quran-prefix.test.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'src'), bad = []; let n = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js') && p !== path.join(root, 'engine.js')) scan(p); });
function scan(p) {
  const s = fs.readFileSync(p, 'utf8'); let i = -1;
  while ((i = s.indexOf('﴿', i + 1)) !== -1) { n++; if (!/قال تعالى:\s*$/.test(s.slice(Math.max(0, i - 14), i))) bad.push(path.relative(root, p) + ' @' + i + ': ' + s.slice(Math.max(0, i - 20), i + 15)); }
}
walk(root);
console.log((bad.length ? 'FAIL ' : 'OK   ') + 'آيات مسبوقة بـ«قال تعالى:» ' + (n - bad.length) + '/' + n);
bad.forEach(b => console.log('     ' + b));
if (!n) { console.log('FAIL لم تُوجد أي آية: تحقق من الفحص'); process.exit(1); }
process.exit(bad.length ? 1 : 0);
