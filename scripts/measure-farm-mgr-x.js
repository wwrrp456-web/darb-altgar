'use strict';
// قياس 035ج2: 12 بذرة × 120 يوماً، مزرعة (رئيس مزرعة) ومصنع غير محلي (مدير مصنع) والبقية ثابتة، بالدرجات 1 و3 و5.
// ثلاث تجارب لكل درجة: الرئيس وحده، المدير وحده، كلاهما؛ مقابل المطفأ (FARMX/MGRX معاً مطفأ). المخرجات: صافي ما أضافه كل دور (الثروة مفعّلاً − مطفأ) ووسيط نسب الثروة بترتيبها.
// node scripts/measure-farm-mgr-x.js [seeds=12] [days=120]
const E = require('../src/engine.js'), A = E.A, SEEDS = +process.argv[2] || 12, DAYS = +process.argv[3] || 120, WARM = +process.env.WARM || 20;
const median = a => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }, mean = a => a.reduce((x, y) => x + y, 0) / a.length;
function run(seed, grade, farmOn, mgrOn) {
  E.FARMX.on = farmOn; E.MGRX.on = mgrOn; const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 3; S.learn.level = 6; S.noEvents = true; S.noShocks = true;
  for (let i = 0; i < WARM; i++) { E.botMain(S); E.tick(S, false); S.pause = false; if (S.road) S.road = null; }
  S.player.gold = 300000; const city = 'riyadh'; S.player.caravans[0].city = city; A.buildShop(S, city); A.buildWarehouse(S, city); A.buildWarehouse(S, city); A.buildFarm(S, city);
  const f = E.farmOf(S, city); f.level = 3; for (const [g, n] of [['najdi', 30], ['naeemi', 20], ['aardi', 10], ['majaheem', 8]]) { f.herd[g] = n; E.hxOf(f, g).m = Math.round(n * 0.3); E.hxOf(f, g).y = Math.round(n * 0.2); } S.player.props[city].store.najdi = 12; S.player.props[city].store.naeemi = 8; // مزرعة قريبة من الامتلاء ومخزن فيه أنعام
  A.hireFarmBoss(S, city, 6); const origin = S.order.find(id => S.cities[id].sig === 'silk'); S.bosses[origin].trust = 50; A.buildFactory(S, city, 'silk'); const lv = grade <= 2 ? 1 : grade === 3 ? 2 : 3; A.hireManager(S, city, lv);
  const L = E.loadChecked(E.save(S)).S; // التهجير يملأ sk
  const pr = L.player.props[city]; pr.farmBoss.sk.g = grade; pr.mgr.sk.g = Math.max(grade, pr.mgr.sk.g); if (mgrOn && grade >= 5) { A.mgrXRule(L, city, 'mode', 'exec'); A.mgrXRule(L, city, 'budget', 5000); }
  L.player.gold = 300000; L.player.wallet.sar = 300000; E.FARMX.on = farmOn; E.MGRX.on = mgrOn;
  for (let d = 0; d < DAYS; d++) { E.botMain(L); E.tick(L, false); L.pause = false; if (L.road) L.road = null; }
  const m = L.player.props[city].mgr, fb = L.player.props[city].farmBoss, fac = L.player.factories[0];
  return { nw: E.netWorth(L), young: fb && fb.x ? fb.x.log.filter(l => /صغار/.test(l.t)).reduce((t, l) => t + l.amt, 0) : 0, bought: m && m.x ? -m.x.log.filter(l => /اشتريتُ/.test(l.t)).reduce((t, l) => t + l.amt, 0) : 0, alerts: m && m.x ? m.x.cards.length : 0, made: fac ? fac.made || 0 : 0, theft: m ? 0 : 1 };
}
const out = {}, base = {}; for (const g of [1, 3, 5]) { base[g] = []; for (let sd = 1; sd <= SEEDS; sd++) base[g].push(run(sd, g, false, false)); } // مطفأ بالمستوى نفسه (الأجور تتبع المستوى المشترى)
for (const g of [1, 3, 5]) for (const [k, fo, mo] of [['رئيس المزرعة وحده', true, false], ['مدير المصنع وحده', false, true], ['كلاهما', true, true]]) { const r = []; for (let sd = 1; sd <= SEEDS; sd++) r.push(run(sd, g, fo, mo)); out[g + '|' + k] = r; }
const bm = [1, 3, 5].map(g => Math.round(mean(base[g].map(x => x.nw)))).join(' / ');
console.log('== ' + SEEDS + ' بذرة × ' + DAYS + ' يوماً (إحماء ' + WARM + ' يوماً بلاعب آلي) · ثروة المطفأ (متوسط للدرجات 1/3/5): ' + bm + ' ==');
console.log('الدرجة | التجربة | صافي ما أضافه (متوسط) | وسيط الفرق | وسيط نسب الثروة مقابل المطفأ | أدنى/أعلى نسبة | صغار مباعة | مشتريات المدير | مصانع خُسرت (اختلاس)');
for (const k of Object.keys(out)) { const g = +k.split('|')[0], r = out[k], d = r.map((x, i) => x.nw - base[g][i].nw), ra = r.map((x, i) => x.nw / base[g][i].nw); console.log(k.replace('|', ' | '), '|', Math.round(mean(d)), '|', Math.round(median(d)), '|', (100 * (median(ra) - 1)).toFixed(2) + '٪', '|', (100 * (Math.min(...ra) - 1)).toFixed(1) + '٪ / ' + (100 * (Math.max(...ra) - 1)).toFixed(1) + '٪', '|', Math.round(mean(r.map(x => x.young))), '|', Math.round(mean(r.map(x => x.bought))), '|', r.reduce((t, x) => t + x.theft, 0)); }
E.FARMX.on = true; E.MGRX.on = true;
