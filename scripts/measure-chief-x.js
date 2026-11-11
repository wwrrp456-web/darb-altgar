'use strict';
// قياس 035ج: 12 بذرة × 120 يوماً، مزرعة واحدة بقطيع مختلط، كبير رعاة بالدرجة 1 ثم 3 ثم 5 والبقية ثابتة.
// المخرجات: ch.x.pnl لكل درجة (المتوسط والوسيط وعدد البذور الخاسرة) وثروة اللاعب الآلي (botMain) بالمفتاح مفعّلاً مقابل مطفأ. node scripts/measure-chief-x.js [seeds=12] [days=120]
const E = require('../src/engine.js'), A = E.A, SEEDS = +process.argv[2] || 12, DAYS = +process.argv[3] || 120, WARM = +process.env.WARM || 20;
if (process.env.CHX) Object.assign(E.CHIEFX, JSON.parse(process.env.CHX)); if (process.env.DISC) process.env.DISC.split(',').forEach((v, i) => { E.CHIEFX.T[i + 3].disc = +v; }); // ضبط تجريبي: CHX='{"edge":0.1}'
const median = a => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const HERDS = { full: [3, [['najdi', 30], ['naeemi', 20], ['aardi', 10], ['majaheem', 8], ['arab_kuhaylan', 3]]], mid: [2, [['najdi', 20], ['naeemi', 12], ['aardi', 6], ['majaheem', 4], ['arab_kuhaylan', 1]]], small: [1, [['najdi', 10], ['naeemi', 6], ['aardi', 4], ['majaheem', 2]]] };
function run(seed, grade, on, size = 'full') {
  E.CHIEFX.on = on; const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 3; S.learn.level = 6; if (process.env.QUIET) { S.noEvents = true; S.noShocks = true; } for (let i = 0; i < WARM; i++) { E.botMain(S); E.tick(S, false); S.pause = false; if (S.road) S.road = null; }
  S.player.gold = 300000; const city = 'riyadh'; S.player.caravans[0].city = city; A.buildShop(S, city); A.buildWarehouse(S, city); A.buildFarm(S, city); A.hireChief(S, 'sa');
  const f = E.farmOf(S, city), ch = E.chiefOf(S, 'sa'); f.level = HERDS[size][0]; for (const [g, n] of HERDS[size][1]) { f.herd[g] = n; E.hxOf(f, g).m = Math.round(n * 0.3); }
  if (process.env.ALLKNOWN) E.snapshotKnown(S, S.order); S.player.gold = 300000;
  if (on) { ch.sk = { g: grade, xp: 999, m: 1, spec: {} }; const x = E.chxOf(ch, true); x.rules.sell = process.env.RS || 'exec'; x.rules.buy = process.env.RB || 'exec'; A.chiefPolicy(S, 'sa', true, 20000); }
  for (let d = 0; d < DAYS; d++) { E.botMain(S); E.tick(S, false); S.pause = false; if (S.road) S.road = null; }
  return { S, pnl: on ? E.chiefOf(S, 'sa').x.pnl : 0, nw: E.netWorth(S), trips: on ? E.chiefOf(S, 'sa').x.log.filter(l => l.k === 'sell' || l.k === 'buy').length : 0, slips: on ? E.chiefOf(S, 'sa').x.log.filter(l => l.k === 'slip').length : 0 };
}
module.exports = { run };
if (require.main === module) {
  for (const size of (process.env.SIZES || 'full,mid,small').split(',')) {
    const out = {}, base = []; for (let sd = 1; sd <= SEEDS; sd++) base.push(run(sd, 3, false, size).nw);
    for (const g of [1, 3, 5]) { const r = []; for (let sd = 1; sd <= SEEDS; sd++) r.push(run(sd, g, true, size)); out[g] = r; }
    const bm = mean(base); console.log('\n== ' + ({ full: 'مزرعة مستوى 3 (82 وحدة قطيع مختلط)', mid: 'مزرعة مستوى 2 (48 وحدة)', small: 'مزرعة مستوى 1 (قطيع صغير 22 رأساً)' })[size] + ' · ' + SEEDS + ' بذرة × ' + DAYS + ' يوماً (إحماء ' + WARM + ' يوماً بلاعب آلي) ==');
    console.log('الدرجة | متوسط pnl | وسيط pnl | بذور خاسرة | متوسط الثروة | وسيط نسب الثروة (لكل بذرة) | الثروة مقابل المطفأ | بيع/شراء | كبوات');
    for (const g of [1, 3, 5]) { const r = out[g], p = r.map(x => x.pnl); console.log(g, '|', Math.round(mean(p)), '|', Math.round(median(p)), '|', p.filter(v => v < 0).length + '/' + SEEDS, '|', Math.round(mean(r.map(x => x.nw))), '|', (100 * (median(r.map((x, i) => x.nw / base[i])) - 1)).toFixed(2) + '٪', '|', (100 * (mean(r.map(x => x.nw)) / bm - 1)).toFixed(2) + '٪', '|', mean(r.map(x => x.trips)).toFixed(1), '|', mean(r.map(x => x.slips)).toFixed(1)); }
    console.log('ثروة المطفأ (متوسط):', Math.round(bm)); console.log('pnl لكل بذرة:', JSON.stringify(Object.fromEntries([1, 3, 5].map(g => [g, out[g].map(x => Math.round(x.pnl))]))));
  }
  E.CHIEFX.on = true;
}
