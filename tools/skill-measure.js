'use strict';
// قياس توازن 035أ بالبذور: الثروة الصافية بعد N يوماً، SKILL.on=true مقابل false (±10٪). node tools/skill-measure.js [أيام]
const { E, load, rich, run } = require('../test/lib/skill-sim.js');
const days = +process.argv[2] || 300, rows = [];
for (const f of ['autopilot-13', 'autopilot-18', 'autopilot-23', 'guided-10', 'guided-8']) {
  const res = {}; for (const on of [false, true]) { E.SKILL.on = on; const S = rich(load(f)); if (on) E.skillMigrate(S); run(S, days); res[on] = { nw: Math.round(E.netWorth(S)), gold: Math.round(S.player.gold) }; }
  const r = res[true].nw / res[false].nw; rows.push({ f, off: res[false].nw, on: res[true].nw, pct: +((r - 1) * 100).toFixed(2) });
}
// لاعب آلي كامل (botMain/botBuild) على ست بذور سنة: متوسط الثروة مفعّلاً مقابل مطفأ
{ const sum = { false: 0, true: 0 }; for (const on of [false, true]) { E.SKILL.on = on; for (const sd of [1, 2, 3, 4, 5, 6]) { const S = E.newGame(sd * 7919); for (let d = 1; d <= 354; d++) { E.botMain(S); E.botBuild(S); E.tick(S); } sum[on] += E.netWorth(S); } }
  const pct = +((sum[true] / sum[false] - 1) * 100).toFixed(2); rows.push({ f: 'bot × 6 بذور (354 يوماً)', off: Math.round(sum[false] / 6), on: Math.round(sum[true] / 6), pct }); }
console.table(rows); const worst = Math.max(...rows.map(r => Math.abs(r.pct))); console.log('أقصى انحراف: ' + worst + '٪ ' + (worst <= 10 ? '(ضمن ±10٪)' : '(خارج الحد)')); process.exitCode = worst <= 10 ? 0 : 1;
