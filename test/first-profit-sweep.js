// مسح يدوي (خارج all.sh): من أول فتح بوضع اللاعب إلى أول بيع، على ٢٠ بذرة: node test/first-profit-sweep.js [عدد البذور]
const { chromium } = require('/opt/node-tools/node_modules/playwright'), measure = require('./lib/first-profit.js');
(async () => {
  const n = +process.argv[2] || 20, b = await chromium.launch(), rows = [];
  for (let s = 1; s <= n; s++) { const r = await measure(b, s); rows.push(r); console.log(`بذرة ${String(s).padStart(2)}: ضغطات ${String(r.presses).padStart(3)} · أيام ${r.days} · مقاطع ${r.beats} · ${r.sold ? 'ربح ' + r.pl : 'لم يبع' + (r.err ? ' (' + r.err + ')' : '')}`); }
  await b.close();
  const ok = rows.filter(r => r.sold), win = ok.filter(r => r.pl > 0), mx = k => Math.max(...ok.map(r => r[k])), av = k => (ok.reduce((a, r) => a + r[k], 0) / (ok.length || 1)).toFixed(1);
  console.log(`\nبيع: ${ok.length}/${n} · ربح > 0: ${win.length}/${n} · ضغطات متوسط ${av('presses')} أقصى ${mx('presses')} · أيام متوسط ${av('days')} أقصى ${mx('days')} · أقل ربح ${Math.min(...ok.map(r => r.pl))}`);
})();
