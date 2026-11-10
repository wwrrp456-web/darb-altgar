'use strict';
// قياس توازن 035ب على بذور كثيرة بأمين تفويض كامل (withSteward): الثروة الصافية بعد N يوماً، SKILLB مفعّلاً مقابل مطفأ.
// وضعان للفعّل: «اقترح عليّ» (الافتراضي) و«تصرّف ضمن حدودي» (أقصى أثر). اللاعب الآلي القياسي (botMain) لا يوظّف أميناً فلا يتأثر (يُطبع أيضاً).
// node tools/skill-b-measure.js [عدد البذور=14] [أيام=200]
const { E, load, rich, run, withSteward } = require('../test/lib/skill-sim.js');
const N = +process.argv[2] || 14, days = +process.argv[3] || 200, FX = ['skill-save-a23', 'skill-save-a18', 'autopilot-13', 'guided-10', 'guided-8'];
const sim = (k, on, mode, approve) => { E.SKILLB.on = on; const S = withSteward(rich(load(FX[k % FX.length]))); S.seed = (S.seed + k * 1013) >>> 0; E.skillMigrate(S); S.noShocks = false;
  { const pr = Object.values(S.player.props).find(p => p.shops.length); pr.store.wool = 80; pr.shops[0].items = [{ g: 'wool', price: 3, auto: false, carry: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 20, lastSold: 0 }]; } // رف راكد (سعر مرتفع) يستدعي التدوير/التجربة
  if (mode) for (const pr of Object.values(S.player.props)) for (const sh of pr.shops) sh.mode = mode; for (let d = 0; d < days; d++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; if (approve && on) for (const n of E.sbNeeds(S).filter(x => x.kind === 'trial' && x.state === 'open')) E.A.mgrApprove(S, n.id); } return Math.round(E.netWorth(S)); };
for (const [mode, approve, label] of [['act', false, 'تصرّف ضمن حدودي'], ['suggest', true, 'اقترح عليّ مع لاعب يوافق في اليوم نفسه'], ['suggest', false, 'اقترح عليّ بلا موافقة (لاعب غائب: لا يتغير الرف، وكلفته ركود الرف المسعَّر خطأً في هذا المشهد)']]) {
  const rows = []; let a = 0, b = 0;
  for (let k = 0; k < N; k++) { const off = sim(k, false, mode, approve), on = sim(k, true, mode, approve); a += off; b += on; rows.push({ بذرة: k + 1, ملف: FX[k % FX.length], مطفأ: off, مفعّل: on, نسبة: +((on / off - 1) * 100).toFixed(2) }); }
  console.log('\nالوضع: ' + label); console.table(rows);
  const avg = +((b / a - 1) * 100).toFixed(2), out = rows.filter(r => Math.abs(r.نسبة) > 10);
  console.log(`متوسط ${Math.round(a / N)} ← ${Math.round(b / N)} (${avg}٪)؛ خارج ±10٪ منفردةً: ` + (out.length ? out.map(r => r.بذرة + ' (' + r.نسبة + '٪)').join('، ') : 'لا شيء') + '؛ ' + (Math.abs(avg) <= 10 ? 'المتوسط ضمن ±10٪' : 'المتوسط خارج الحد'));
  if (Math.abs(avg) > 10 && approve !== false) process.exitCode = 1;
}
