'use strict';
// قياس 040أ: تسريب الثروة. ثلاثة أحجام ثروة × (خامل | نشط بلاعب الـbot القائم botMain/botBuild) × 360 يوماً.
// الاستعمال: node tools/econ-baseline.js [أيام=360] [--levy=on]   (الافتراضي: الرسم ملغى؛ --levy=on يعيد المعادلة القديمة 0.0006 للمقارنة «قبل»)
const { E, load, run } = require('../test/lib/skill-sim.js');
const args = process.argv.slice(2), days = +args.find(a => /^\d+$/.test(a)) || 360, lv = (args.find(a => a.startsWith('--levy=')) || '').slice(7);
if (E.LEVY && lv === 'on') E.LEVY.on = true;
const SIZES = [['≈100 ألف', 'autopilot-18', 100e3], ['≈1 مليون', 'autopilot-23', 1e6], ['≈10 ملايين', 'autopilot-23', 10e6]];
function setWealth(S, target) { const gap = target - E.netWorth(S); S.player.gold += gap; return S; }
function active(S, n) { for (let i = 0; i < n; i++) { try { E.botMain(S); E.botBuild(S); } catch (e) {} E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; }
const sum = o => Object.values(o).reduce((a, b) => a + b, 0), pct = (a, b) => +((a / b - 1) * 100).toFixed(2);
const rows = [], detail = [];
for (const [label, fx, target] of SIZES) for (const mode of ['خامل', 'نشط']) {
  const S = setWealth(load(fx), target); const w0 = E.netWorth(S), exp0 = { ...S.player.led.exp }, inc0 = { ...S.player.led.inc };
  (mode === 'خامل' ? run : active)(S, days);
  const w1 = E.netWorth(S), exp = {}, inc = {};
  for (const k in S.player.led.exp) { const d = S.player.led.exp[k] - (exp0[k] || 0); if (d > 0.005) exp[k] = d; }
  for (const k in S.player.led.inc) { const d = S.player.led.inc[k] - (inc0[k] || 0); if (d > 0.005) inc[k] = d; }
  const te = sum(exp), levy = exp.wealthLevy || 0;
  rows.push({ الحجم: label, النمط: mode, 'ثروة أولية': Math.round(w0), 'ثروة نهائية': Math.round(w1), 'تغير %': pct(w1, w0), 'دخل': Math.round(sum(inc)), 'مصروفات': Math.round(te), 'wealthLevy': Math.round(levy), 'الرسم % من المصروفات': te ? +(levy / te * 100).toFixed(1) : 0 });
  detail.push(label + ' | ' + mode + ': ' + Object.entries(exp).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + '=' + Math.round(v)).join('، '));
}
console.log('أيام=' + days + (E.LEVY ? ' LEVY=' + JSON.stringify(E.LEVY) : ' (القديم)'));
console.table(rows); console.log(detail.join('\n'));
