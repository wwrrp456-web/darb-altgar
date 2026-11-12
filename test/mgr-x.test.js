'use strict';
// 035ج2 كفاءة مدير المصنع: السعة بالدرجة ولا نقص لمدير قائم، الأمانة (الاختلاس) مقيسة، توقّع نفاد المواد بـ3 و7 أيام بالحساب الصحيح، الشراء بالبطاقة وبوضع exec ضمن الميزانية،
// التمويل من الخزينة، المطفأ = القديم حرفاً بلا حقل جديد، حفظ قديم.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { mgrDay, mgrxDay, mgrxUse, mgrxBuy, mgrXAct, '), box);
const E = box.module.exports, A = E.A, ok = m => console.log('OK   ' + m);
function world(seed, g, lv, city0) {
  const CT = city0 || 'cairo';
  const S = E.newGame(seed || 5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.fxFree = true; S.learn.level = 11; S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 400000;
  const car = S.player.caravans[0]; car.city = CT; car.left = 0; A.buildShop(S, CT); A.buildWarehouse(S, CT); A.buildWarehouse(S, CT);
  const origin = S.order.find(id => S.cities[id].sig === 'silk'); S.bosses[origin].trust = 50; a(A.buildFactory(S, CT, 'silk').ok);
  a(A.hireManager(S, CT, lv || 1).ok); const L = E.loadChecked(E.save(S)); a(L.ok); const S2 = L.S, pr = S2.player.props[CT], m = pr.mgr; a(m.sk, 'التهجير يملأ sk'); if (g) m.sk.g = g; m.audit = S2.day;
  return { S: S2, pr, m, f: S2.player.factories[0] };
}
const seedUse = (S, pr, g, perDay) => { for (let d = 0; d < 7; d++) { const day = S.day; S.day = day - d; E.mgrxUse(S, pr, g, perDay); S.day = day; } };

// 1) السعة بالدرجة، ولا نقص لمدير قائم
{
  a.equal(JSON.stringify(E.MGRX.cap), '[3,4,6,10,12]'); a.equal(JSON.stringify(E.MGRX.theft), '[1,0.8,0.6,0.3,0.1]');
  for (const lv of [1, 2, 3]) {
    const legacy = { lv }; const g0 = E.skLegacyG ? E.skLegacyG(legacy) : null;
    const { m } = world(5, null, lv); a.equal(E.mgrCap(m), E.MGR[lv].cap, 'مهجَّر ' + lv + ': سعته كما كانت');
    for (let g = E.mgrxGrade(m); g <= 5; g++) { m.sk.g = g; a(E.mgrCap(m) >= E.MGR[lv].cap, 'لا نقص مع الارتقاء'); }
    m.sk.g = 1; a.equal(E.mgrCap(m), E.MGR[lv].cap, 'درجة أدنى من مستواه المشترى لا تنقص سعته (الأعلى منهما)');
    delete m.sk; a.equal(E.mgrCap(m), E.MGR[lv].cap, 'بلا sk: كما كان');
  }
  const { m } = world(5, 1, 1); a.equal(JSON.stringify([1, 2, 3, 4, 5].map(g => { m.sk.g = g; return E.mgrCap(m); })), '[3,4,6,10,12]'); ok('السعة بالدرجة ولا نقص');
}
// 2) الاختلاس مقيس: مفعول الدرجة على احتمال اليوم (2000 يوم لكل درجة × 24 بذرة، والمراجعة متأخرة دائماً)
{
  const rate = {}; 
  for (const g of [1, 2, 3, 4, 5]) {
    let thefts = 0, days = 0;
    const lv = g <= 2 ? 1 : g === 3 ? 2 : 3;
    for (let seed = 1; seed <= 24; seed++) {
      const { S, pr } = world(seed, g, lv), mkm = () => ({ lv, since: S.day, audit: S.day - 99, late: 0, sk: { g, xp: 999, m: 1, spec: {}, home: 'make', wk: 0 } }); pr.mgr = mkm(); S.seedB = seed * 2654435761 >>> 0; const city = 'cairo';
      for (let d = 0; d < 2000; d++) { S.day++; if (!pr.mgr) pr.mgr = mkm(); pr.mgr.audit = S.day - 99; S.player.gold = 400000; E.mgrDay(S, city, pr); days++; if (!pr.mgr) thefts++; }
    }
    rate[g] = thefts / days;
  }
  const base = 0.03 / 30;
  a(rate[1] > base * 0.6 && rate[1] < base * 1.5, 'الدرجة 1: ≈ 0.1٪ في اليوم (' + (rate[1] * 100).toFixed(3) + '٪)');
  a(rate[1] > rate[3] && rate[3] > rate[5] && rate[2] >= rate[4], 'الاحتمال ينزل بالدرجة: ' + [1, 2, 3, 4, 5].map(g => (rate[g] * 1000).toFixed(2)).join(' / ') + ' ‰');
  a(rate[5] < base * 0.35, 'الدرجة 5 أدنى بكثير من الأولى'); ok('الاختلاس بالدرجة مقيس (‰ يومياً: ' + [1, 2, 3, 4, 5].map(g => (rate[g] * 1000).toFixed(2)).join(' / ') + ')');
}
// 3) تسجيل الاستهلاك الفعلي، ثم توقّع النفاد قبل 3 أيام (ماهر) و7 (خبير) بالحساب الصحيح
{
  const { S, pr, m, f } = world(5, 3, 2); S.cities.cairo.stock.cotton = 99999; pr.store.cotton = 500; const s0 = pr.store.cotton; S.player.gold = 400000;
  for (let i = 0; i < 3; i++) E.tick(S); 
  const sum = Object.values(m.x.use.cotton).reduce((t, v) => t + v, 0); a(sum > 0, 'الاستهلاك يُسجَّل من الصنع الفعلي (' + sum.toFixed(1) + ')');
  for (const g of [3, 4]) {
    const w = world(6, g, 2); w.S.player.gold = 400000; w.m.x = undefined; seedUse(w.S, w.pr, 'cotton', 10); const x = w.m.x; a.equal(Math.round(E.mgrxRate(w.S, x, 'cotton') * 100) / 100, 10, 'المعدل = مجموع 7 أيام ÷ 7');
    const warn = g === 3 ? 3 : 7;
    w.pr.store.cotton = 10 * (warn + 0.5); E.mgrxDay(w.S, 'cairo', w.pr); a.equal(x.cards.length, 0, 'درجة ' + g + ': لا تنبيه قبل ' + warn + ' أيام (' + (warn + 0.5) + ')');
    w.pr.store.cotton = 10 * warn; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(x.cards.length, 1, 'درجة ' + g + ': تنبيه عند ' + warn + ' أيام'); const k = x.cards[0]; a.equal(k.days, warn); a.equal(k.g, 'cotton'); a(k.qty >= 1 && k.est > 0);
    if (g === 3) a.equal(k.cheap, null, 'الثالثة بلا أرخص سوق'); else { a(k.cheap && k.cheap.p > 0, 'الرابعة: أرخص سوق يعرفها اللاعب'); S.player.known && 0; }
  }
  const w2 = world(6, 2, 1); w2.m.x = undefined; seedUse(w2.S, w2.pr, 'cotton', 10); w2.pr.store.cotton = 5; E.mgrxDay(w2.S, 'cairo', w2.pr); a(!w2.m.x || w2.m.x.cards.length === 0, 'الدرجة 2: لا تنبيه'); // لا يسجّل الاستهلاك دون الدرجة 3
  const w1 = world(6, 1, 1); E.mgrxUse(w1.S, w1.pr, 'cotton', 10); a(!w1.m.x, 'الدرجة 1: لا حقل جديد'); ok('التنبيه قبل 3 و7 أيام بالحساب الصحيح');
}
// 4) البطاقة: اشترِ / ذكّرني غداً / تجاهل
{
  const mk2 = () => { const w = world(7, 4, 3); w.m.x = undefined; seedUse(w.S, w.pr, 'cotton', 10); w.pr.store.cotton = 20; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 1); return w; };
  { const w = mk2(), k = w.m.x.cards[0], g0 = w.S.player.gold, s0 = w.pr.store.cotton; w.S.cities.cairo.stock.cotton = 5000; const r = A.mgrXAct(w.S, 'cairo', k.id, 'buy'); a(r.ok, r.msg); a(w.pr.store.cotton > s0 && w.pr.store.cotton <= s0 + k.qty, 'المخزون زاد'); const spent = g0 - w.S.player.gold; a(spent > 0 && spent <= k.est * 1.2, 'خُصم من المحفظة ' + spent + ' ≤ ' + k.est); a.equal(w.m.x.cards.length, 0); a(w.m.x.log[0].amt < 0 && w.m.x.log[0].t.includes('اشتريتُ'), 'سجل الدفتر'); }
  { const w = mk2(), k = w.m.x.cards[0], g0 = w.S.player.gold; a(A.mgrXAct(w.S, 'cairo', k.id, 'tomorrow').ok); a.equal(w.S.player.gold, g0); a.equal(w.m.x.cards.length, 0); E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 0, 'مؤجَّل'); w.S.day++; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 1, 'يعود بعد يوم'); }
  { const w = mk2(), k = w.m.x.cards[0]; a(A.mgrXAct(w.S, 'cairo', k.id, 'ignore').ok); w.S.day += 5; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 0, 'تجاهل أياماً'); w.S.day += 20; seedUse(w.S, w.pr, 'cotton', 10); E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 1, 'ثم يعود إن بقي النقص'); }
  { const w = mk2(); a(!A.mgrXAct(w.S, 'cairo', 'nope', 'buy').ok); a(!A.mgrXAct(w.S, 'cairo', w.m.x.cards[0].id, 'zzz').ok); w.pr.store.cotton = 9999; w.S.day++; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 0, 'انحلّت بوفرة المخزون'); }
  ok('البطاقة: اشترِ وذكّرني وتجاهل');
}
// 5) الدرجة 5: exec ضمن الميزانية، ask بلا إنفاق، والخزينة
{
  const mk5 = (mode, budget) => { const w = world(8, 5, 3); a(A.mgrXRule(w.S, 'cairo', 'mode', mode).ok); a(A.mgrXRule(w.S, 'cairo', 'budget', budget).ok); seedUse(w.S, w.pr, 'cotton', 10); w.pr.store.cotton = 20; w.S.cities.cairo.stock.cotton = 5000; return w; };
  { const w = mk5('ask', 10000), g0 = w.S.player.gold; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.S.player.gold, g0, 'ask: لا إنفاق'); a.equal(w.m.x.cards.length, 1); }
  { const w = mk5('exec', 0), g0 = w.S.player.gold; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.S.player.gold, g0, 'ميزانية صفر: لا شراء'); a.equal(w.m.x.cards.length, 1); }
  { const w = mk5('exec', 10000), g0 = w.S.player.gold, s0 = w.pr.store.cotton; E.mgrxDay(w.S, 'cairo', w.pr); const spent = g0 - w.S.player.gold; a(spent > 0 && spent <= 10000 && w.pr.store.cotton > s0, 'اشترى ضمن الميزانية: ' + spent); a.equal(w.m.x.cards.length, 0); a(w.m.x.sp.n <= 10000);
    w.pr.store.cotton = 20; w.m.x.budget = 2000; w.m.x.sp.n = 1990; const g1 = w.S.player.gold; w.m.x.snooze = {}; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.S.player.gold, g1, 'الأسبوع استُهلكت ميزانيته: بطاقة بدل الشراء'); a.equal(w.m.x.cards.length, 1);
    w.m.x.cards = []; w.S.day += 7; seedUse(w.S, w.pr, 'cotton', 10); w.pr.store.cotton = 20; w.m.x.snooze = {}; w.m.x.sp.n = 1990; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.sp.n < 1990 || w.m.x.cards.length === 1, true); }
  { const w = world(8, 5, 3, 'riyadh'); a(A.mgrXRule(w.S, 'riyadh', 'mode', 'exec').ok && A.mgrXRule(w.S, 'riyadh', 'budget', 10000).ok); seedUse(w.S, w.pr, 'cotton', 10); w.pr.store.cotton = 20; w.S.cities.riyadh.stock.cotton = 5000;
    w.S.player.gold = 0; w.S.player.wallet.sar = 0; w.S.player.diwan = { box: 50000, rules: { herd: { mode: 'exec', max: 8000 } }, log: [], covered: 0 };
    const box0 = w.S.player.diwan.box; E.mgrxDay(w.S, 'riyadh', w.pr); a(w.S.player.diwan.box < box0 && w.pr.store.cotton > 20, 'من خزينة الناظر بقاعدتها'); a(w.S.player.diwan.log[0] && w.S.player.diwan.log[0].amount > 0, 'يُسجَّل في الديوان'); a(w.S.player.wallet.sar >= -1e-6, 'لا رصيد سالب'); }
  { const w = world(8, 4, 3); a(!A.mgrXRule(w.S, 'cairo', 'mode', 'exec').ok, 'الدرجة 4 لا تشتري'); const z = mk5('ask', 0); a(!A.mgrXRule(z.S, 'cairo', 'mode', 'x').ok); a(!A.mgrXRule(z.S, 'cairo', 'budget', 777).ok); a(!A.mgrXRule(z.S, 'cairo', 'k', 1).ok); }
  ok('شراء الدرجة 5: ask وexec والميزانية والخزينة');
}
// 6) المطفأ = القديم حرفاً بلا حقل جديد؛ والدرجة 1 مفعّلةً مطابقة للمطفأ
{
  const run = on => { E.MGRX.on = on; const w = world(9, 1, 1); w.S.cities.cairo.stock.cotton = 5000; for (let i = 0; i < 40; i++) E.tick(w.S); return { raw: E.save(w.S), m: w.pr.mgr }; };
  const off = run(false), on1 = run(true); E.MGRX.on = true; a(!off.m.x, 'لا m.x'); a(!/"x":/.test(off.raw.replace(/"[^"]*":\{"[^}]*\}/g, '')) || !off.m.x); a.equal(on1.raw, off.raw, 'الدرجة 1 مفعّلةً = المطفأ'); 
  E.MGRX.on = false; const w = world(9, 5, 3); a.equal(E.mgrCap(w.m), 10, 'مطفأ: السعة من المستوى'); a.equal(E.mgrTheftMul ? E.mgrTheftMul(w.m) : 1, 1); for (let i = 0; i < 5; i++) E.tick(w.S); a(!w.pr.mgr || !w.pr.mgr.x, 'مطفأ: لا حقل'); E.MGRX.on = true; ok('المطفأ = القديم بلا حقل جديد');
}
// 7) حفظ قديم وحفظ تالف
{
  const w = world(10, 4, 3); w.m.x = undefined; seedUse(w.S, w.pr, 'cotton', 10); w.pr.store.cotton = 20; E.mgrxDay(w.S, 'cairo', w.pr); a.equal(w.m.x.cards.length, 1);
  let L = E.loadChecked(E.save(w.S)); a(L.ok); a.equal(L.S.player.props.cairo.mgr.x.cards.length, 1, 'تُحفظ البطاقة وتعود');
  const old = JSON.parse(E.save(w.S)); delete old.player.props.cairo.mgr.x; L = E.loadChecked(JSON.stringify(old)); a(L.ok && !L.S.player.props.cairo.mgr.x, 'حفظ قديم بلا x');
  const bad = JSON.parse(E.save(w.S)); bad.player.props.cairo.mgr.x = { use: 5, cards: [{ junk: 1 }], mode: 'zzz', budget: 3 }; L = E.loadChecked(JSON.stringify(bad)); a(L.ok); const x = L.S.player.props.cairo.mgr.x; a(Array.isArray(x.cards) && x.cards.length === 0 && x.mode === 'ask' && x.budget === 0 && typeof x.use === 'object', 'حقل تالف يُصحَّح');
  E.MGRX.on = false; L = E.loadChecked(E.save(w.S)); E.MGRX.on = true; a(L.ok && !L.S.player.props.cairo.mgr.x, 'مطفأ يزيل x عند التحميل'); ok('حفظ قديم وتالف');
}
console.log('PASS mgr-x');
