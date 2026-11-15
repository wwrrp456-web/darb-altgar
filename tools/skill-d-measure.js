'use strict';
// قياس توازن 035د بالبذور: صافي الثروة بعد 365 يوماً، SKT.on=true مقابل false (±10٪ بالوسيط). node tools/skill-d-measure.js [أيام=365]
const { E } = require('../src/engine.js'), { mkScene, runDays } = require('../test/lib/skill-d-sim.js');
const days = +process.argv[2] || 365, rows = [], ratios = [];
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
// (أ) قافلة بقائد وحرس وطاقم على حفظتين محفوظتين (المشهد الحتمي نفسه للاختبار)
for (const [f, seed] of [['autopilot-23', 5], ['autopilot-18', 5], ['autopilot-13', 5]]) {
  const res = {}; for (const on of [false, true]) { E.SKT.on = on; const { S, car } = mkScene(E, seed, f); runDays(E, S, days); res[on] = { nw: Math.round(E.netWorth(S)), pl: Math.round(car.pl || 0), gx: car.gx && car.gx.xp, cx: car.cx && car.cx.xp, tr: car.captain && car.captain.sk && Math.round(car.captain.sk.tr || 0) }; }
  const r = res[true].nw / res[false].nw; ratios.push(r); rows.push({ المشهد: f, مطفأ: res[false].nw, مشغَّل: res[true].nw, 'الفرق٪': +((r - 1) * 100).toFixed(2), 'ربح القافلة (مطفأ→مشغَّل)': res[false].pl + '→' + res[true].pl, 'خبرة حرس/طاقم/قائد': [res[true].gx, res[true].cx, res[true].tr].join('/') });
}
// (ب) لاعب آلي كامل على عشر بذور: الوسيط بترتيب النسب
{ const per = []; for (let i = 1; i <= 10; i++) { const sd = i * 7919, v = {}; for (const on of [false, true]) { E.SKT.on = on; const S = E.newGame(sd); for (let d = 1; d <= days; d++) { E.botMain(S); E.botBuild(S); E.tick(S); } v[on] = E.netWorth(S); } per.push(v[true] / v[false]); }
  const m = med(per); ratios.push(m); rows.push({ المشهد: 'bot × 10 بذور (وسيط النسب، ' + days + ' يوماً)', مطفأ: '-', مشغَّل: '-', 'الفرق٪': +((m - 1) * 100).toFixed(2), 'ربح القافلة (مطفأ→مشغَّل)': 'أدنى ' + (Math.min(...per) * 100 - 100).toFixed(1) + '٪ / أعلى ' + (Math.max(...per) * 100 - 100).toFixed(1) + '٪', 'خبرة حرس/طاقم/قائد': '' }); }
E.SKT.on = true; console.table(rows); const worst = Math.max(...rows.map(r => Math.abs(r['الفرق٪']))); console.log('أقصى انحراف: ' + worst + '٪ ' + (worst <= 10 ? '(ضمن ±10٪)' : '(خارج الحد)')); process.exitCode = worst <= 10 ? 0 : 1;
