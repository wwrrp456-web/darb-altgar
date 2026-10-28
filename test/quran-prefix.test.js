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
// آيات بطاقات الفقه (الدليل) تُعرض بـhadithQ: كل دليل مصدره سورة ورقم يجب أن يخرج «قال تعالى: ﴿…﴾»
{ const vm = require('vm'), ui = fs.readFileSync(path.join(root, 'ui', '02-learn.js'), 'utf8');
  const code = ui.match(/const QURAN_S = .*\n/)[0] + ui.match(/const hadithQ = .*\n/)[0] + 'this.hadithQ = hadithQ; this.QURAN_S = QURAN_S;';
  const ctx = {}; vm.runInNewContext(code, ctx);
  const C = require(path.join(root, 'cards.js')), cards = C.CARDS || C; let m = 0;
  for (const [id, c] of Object.entries(cards)) (c && c.dalil || []).forEach(d => { if (!ctx.QURAN_S.test(d.s || '')) return; n++; m++; const out = ctx.hadithQ(d); if (!/^قال تعالى: ﴿[^]+﴾$/.test(out)) bad.push('cards ' + id + ': ' + out.slice(0, 40)); });
  if (!m) bad.push('لم تُوجد آيات في بطاقات الفقه: تحقق من الفحص');
  const hq = ctx.hadithQ({ q: 'مَطْلُ الغنيّ ظلم', s: 'متفق عليه' }); if (!hq.startsWith('قال رسول الله ﷺ')) bad.push('الحديث لم يعد يُسبق بقال رسول الله: ' + hq); }
console.log((bad.length ? 'FAIL ' : 'OK   ') + 'آيات مسبوقة بـ«قال تعالى:» ' + (n - bad.length) + '/' + n);
bad.forEach(b => console.log('     ' + b));
if (!n) { console.log('FAIL لم تُوجد أي آية: تحقق من الفحص'); process.exit(1); }
process.exit(bad.length ? 1 : 0);
