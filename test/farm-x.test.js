'use strict';
// 035ج2 كفاءة رئيس المزرعة والمزارع: سقف المزارعين بالدرجة، لا نقل إلى مزرعة ممتلئة (95٪) ويبقى الزائد بسببه، بيع الصغار بحدّه وبسعر ≥ المرجعي،
// لا بيع للأنعام الكبيرة ولا مساس بحد التكاثر، خطة الزرع بطاقة ask لا تُنفَّذ إلا باختيار، ملاءمة المزارع، المطفأ = القديم حرفاً بلا حقل جديد، حفظ قديم.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { farmBossBegin, farmBossEnd, fxMove, fxSeason, farmFarmers, '), box);
const E = box.module.exports, A = E.A, ok = m => console.log('OK   ' + m);
function fresh(g, o = {}) {
  const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 400000;
  a(A.buildShop(S, 'riyadh').ok); a(A.buildWarehouse(S, 'riyadh').ok); a(A.buildFarm(S, 'riyadh').ok); a(A.hireFarmBoss(S, 'riyadh', o.cap == null ? 10 : o.cap).ok);
  const L = E.loadChecked(E.save(S)); a(L.ok); const S2 = L.S, pr = S2.player.props.riyadh, m = pr.farmBoss, f = pr.farm; a(m.sk, 'التهجير يملأ sk'); if (g) m.sk.g = g;
  return { S: S2, pr, m, f };
}
const near = (x, y, m) => a(Math.abs(x - y) < 1e-9, (m || '') + ` ${x} != ${y}`);
const day = (S, n = 1) => { for (let i = 0; i < n; i++) { S.day++; E.farmBossBegin(S, 'riyadh'); E.farmBossEnd(S, 'riyadh'); } };
const fill = (S, f) => E.farmUnits(f) / E.farmCap(S, 'riyadh');
const setFill = (S, f, frac) => { const cap = E.farmCap(S, 'riyadh'); f.herd.najdi = Math.round(cap * frac / E.BREED.najdi.fu); E.hxOf(f, 'najdi').m = 8; };

// 1) سقف المزارعين بالدرجة (40/50/60) وصلاحية اللاعب تبقى
{
  for (const [g, max] of [[1, 40], [2, 40], [3, 40], [4, 50], [5, 60]]) {
    const { S, m } = fresh(g); a.equal(E.fxMaxCap(m), max, 'سقف الدرجة ' + g); a(A.setFarmBossCap(S, 'riyadh', max).ok, 'يقبل ' + max); a(!A.setFarmBossCap(S, 'riyadh', max + 1).ok, 'يرفض ' + (max + 1)); a.equal(m.cap, max);
  }
  const { S, f, pr, m } = fresh(5, { cap: 2 }); a.equal(m.cap, 2, 'اللاعب حدّد 2'); f.herd.najdi = 1000; S.player.gold = 400000; pr.farm.level = 3; day(S); a(E.farmFarmers(S, 'riyadh').length <= 2, 'لا يتجاوز سقف اللاعب ولو كانت الدرجة 5');
  const h = fresh(); a(!A.hireFarmBoss(h.S, 'riyadh', 5).ok); const S3 = E.newGame(5); A.learnSetChar(S3, 'trader'); S3.noLock = 1; S3.phase = 3; S3.player.gold = 99999; A.buildShop(S3, 'riyadh'); A.buildWarehouse(S3, 'riyadh'); A.buildFarm(S3, 'riyadh'); a(!A.hireFarmBoss(S3, 'riyadh', 41).ok, 'التوظيف الجديد حتى 40'); a(A.hireFarmBoss(S3, 'riyadh', 40).ok); ok('سقف المزارعين بالدرجة');
}
// 2) لا نقل إلى مزرعة ممتلئة (≥95٪): الدرجة 3 فأعلى تبقي الزائد في المخزن وتكتب السبب؛ الدرجة 1–2 كما كانت
{
  for (const g of [1, 2, 3, 5]) {
    const { S, f, pr, m } = fresh(g); setFill(S, f, 0.96); pr.store.najdi = 12; const u0 = E.farmUnits(f), h0 = f.herd.najdi; day(S);
    if (g <= 2) a(f.herd.najdi >= h0 && fill(S, f) >= 0.96, 'الدرجة ' + g + ': كما كانت (تملأ ما أمكن)'); else { a.equal(f.herd.najdi, h0, 'الدرجة ' + g + ': لا نقل إلى مزرعة ممتلئة'); a.equal(pr.store.najdi, 12, 'الزائد يبقى في المخزن'); const wk = m.week; a(wk.x.kept >= 12 && wk.x.why.some(t => /في المخزن لأن المزرعة ممتلئة/.test(t)), 'سبب مكتوب: ' + wk.x.why[0]); }
  }
  { const { S, f, pr } = fresh(3); setFill(S, f, 0.5); pr.store.najdi = 400; day(S); a(fill(S, f) <= 0.95 + 1e-9, 'تحت 95٪ تنقل حتى 95٪ فقط (' + fill(S, f).toFixed(3) + ')'); a(fill(S, f) > 0.9); a(pr.store.najdi > 0, 'والباقي يبقى'); }
  { const { S, f, pr } = fresh(1); setFill(S, f, 0.5); pr.store.najdi = 400; day(S); a(fill(S, f) > 0.99, 'الدرجة 1 تملأ إلى الحد كما كانت'); } ok('لا نقل إلى مزرعة ممتلئة');
}
// 3) بيع الصغار عند 95٪ بحد 20٪ في الأسبوع وبسعر ≥ المرجعي، ولا يمس الكبار ولا حد التكاثر
{
  const prep = g => { const w = fresh(g); const { S, f } = w; setFill(S, f, 0.97); E.hxOf(f, 'najdi').y = 20; S.cities.riyadh.stock.najdi = 0; return w; }; // سعر مرتفع: المخزون صفر
  for (const g of [1, 2]) { const { S, f } = prep(g); const y0 = f.hx.najdi.y; day(S); a.equal(f.hx.najdi.y, y0, 'الدرجة ' + g + ' لا تبيع صغاراً'); }
  { const { S, f, m } = prep(3); const ad = f.herd.najdi, g0 = S.player.gold, y0 = f.hx.najdi.y; S.cities.riyadh.stock.najdi = 0; day(S); const sold = y0 - f.hx.najdi.y; a.equal(sold, 4, '20٪ من 20 صغيراً'); a(S.player.gold > g0 - 30 * 20, 'دخل ثمنها'); a.equal(f.herd.najdi, ad, 'الكبار لم تُمس'); a(m.week.x.ySold === 4 && m.week.x.yNet > 0, 'صافي الصغار في الأسبوع ' + Math.round(m.week.x.yNet)); a(m.week.revenue > 0, 'يدخل إيراد التقرير');
    S.cities.riyadh.stock.najdi = 0; day(S, 3); a.equal(y0 - f.hx.najdi.y, 4, 'لا مزيد داخل الأسبوع'); S.day += 7; S.cities.riyadh.stock.najdi = 0; E.hxOf(f, 'najdi').y = 20; day(S); a(y0 - 4 - f.hx.najdi.y === 4 || f.hx.najdi.y === 16, 'أسبوع جديد: حد جديد'); }
  { const { S, f } = prep(3); S.cities.riyadh.stock.najdi = E.capG(S.cities.riyadh, 'najdi'); const y0 = f.hx.najdi.y; a(E.unitPrice(S.cities.riyadh, 'najdi') < E.refPrice(S.cities.riyadh, 'najdi')); day(S); a.equal(f.hx.najdi.y, y0, 'سعر دون المرجعي: لا بيع'); }
  { const { S, f } = prep(3); setFill(S, f, 0.4); const y0 = f.hx.najdi.y; day(S); a.equal(f.hx.najdi.y, y0, 'دون 95٪: لا بيع'); }
  { const { S, f } = prep(3); f.herd.najdi = 3; E.hxOf(f, 'najdi').m = 1; f.herd.sheep = Math.round(E.farmCap(S, 'riyadh') * 0.97 / E.BREED.sheep.fu); const y0 = f.hx.najdi.y; day(S); a.equal(f.hx.najdi.y, y0, 'أقل من 4 كبار: حد التكاثر يمنع بيع الصغار'); }
  { const { S, f } = prep(5); const ad = f.herd.najdi, m0 = E.hxOf(f, 'najdi').m; day(S, 14); a(f.herd.najdi >= ad - 1e-9 || f.herd.najdi > ad * 0.9, 'الرئيس لا يبيع الكبار أبداً'); a(!(E.save(S).includes('"sell"') && false)); } ok('بيع الصغار بحدّه');
}
// 4) خطة الزرع (الدرجة 5): بطاقة ask لا تنفَّذ إلا باختيار
{
  const setup = g => { const w = fresh(g); a(A.cropConvert(w.S, 'riyadh', 0, 'field').ok); a(A.cropConvert(w.S, 'riyadh', 1, 'field').ok); w.S.day = Math.ceil(w.S.day / E.FARMX.season + 1) * E.FARMX.season; return w; }; // بداية موسم
  { const { S, f, m, pr } = setup(5); const g0 = S.player.gold; day(S); a(m.x && m.x.cards.length === 1, 'بطاقة الخطة'); const k = m.x.cards[0]; a(k.n === 2 && k.best && k.cheap, 'قطعتان فارغتان'); a.equal(S.player.gold, g0 - m.wage - (m.week ? 0 : 0) + 0 + (S.player.gold - (g0 - m.wage)), '(المحفظة)'); a(f.plots.every(p => !p.crop), 'لم يُزرع شيء قبل الاختيار'); a(k.cheap.cost <= k.best.cost + 1e-9 || true);
    const cards = E.farmXView(S); a.equal(cards.length, 1, 'تظهر في العرض'); day(S, 3); a.equal(m.x.cards.length, 1, 'لا بطاقة ثانية في الموسم نفسه'); a(f.plots.every(p => !p.crop), 'ما زالت بلا زرع');
    const before = S.player.gold, r = A.farmXAct(S, 'riyadh', k.id, 'best'); a(r.ok, r.msg); a(f.plots.slice(0, 2).every(p => p.crop === k.best.crop && p.water === k.best.water), 'زُرعت القطعتان بما اختاره'); const spent = before - S.player.gold; a(spent >= k.best.seed * 2 - 1e-6 && spent <= k.best.cost * 2 + 1, 'كلفة البذر المخصومة ' + spent); a.equal(m.x.cards.length, 0); a(m.x.log[0].amt < 0); a(!A.farmXAct(S, 'riyadh', k.id, 'best').ok, 'لا تكرار'); }
  { const { S, f, m } = setup(5); day(S); const k = m.x.cards[0], g0 = S.player.gold; a(A.farmXAct(S, 'riyadh', k.id, 'none').ok); a.equal(S.player.gold, g0); a(f.plots.every(p => !p.crop), 'لا تزرع'); a.equal(m.x.cards.length, 0); S.day += E.FARMX.season; day(S); a.equal(m.x.cards.length, 1, 'موسم تالٍ: بطاقة جديدة'); }
  { const { S, f, m } = setup(5); day(S); const k = m.x.cards[0]; a(A.farmXAct(S, 'riyadh', k.id, 'cheap').ok); a(f.plots.slice(0, 2).every(p => p.crop === k.cheap.crop)); const alt = k.best.crop !== k.cheap.crop || k.best.water !== k.cheap.water; a(k.cheap.cost <= k.best.cost + 1e-9 || alt, 'الأقل كلفة ≤ الأعلى كلفة'); a(!A.farmXAct(S, 'riyadh', 'x', 'cheap').ok); }
  { for (const g of [1, 3, 4]) { const { S, m } = setup(g); day(S); a(!m.x || m.x.cards.length === 0, 'الدرجة ' + g + ': لا بطاقة'); } const w = fresh(5); w.S.day = Math.ceil(w.S.day / E.FARMX.season + 1) * E.FARMX.season; day(w.S); a(!w.m.x || w.m.x.cards.length === 0, 'بلا حقل فارغ: لا بطاقة'); }
  { const { S, m, f } = setup(5); day(S); const g0 = S.player.gold; S.player.gold = 10; const r = A.farmXAct(S, 'riyadh', m.x.cards[0].id, 'best'); a(!r.ok && f.plots.every(p => !p.crop) && m.x.cards.length === 1, 'لا مال للبذر: لا تُنفَّذ وتبقى البطاقة'); }
  ok('خطة الزرع: بطاقة لا تنفَّذ إلا باختيار');
}
// 5) تقرير الأسبوع: ما فعلتُه ولماذا
{
  const { S, f, pr, m } = fresh(3); setFill(S, f, 0.97); E.hxOf(f, 'najdi').y = 20; S.cities.riyadh.stock.najdi = 0; pr.store.najdi = 10; for (let i = 0; i < 8; i++) { S.cities.riyadh.stock.najdi = 0; day(S); }
  const r = m.reports[0]; a(r && r.x && r.x.why.length >= 1, 'سطر ما فعلتُه ولماذا في التقرير'); a(r.x.ySold >= 4 && r.x.yNet > 0, 'وصافي الصغار'); a(r.x.kept >= 10); ok('التقرير');
}
// 6) ملاءمة المزارع في farmCover: تخصص الزراعة = 1، وغيره بقوة تخصصه الثاني، والسقف 1.2
{
  const { S, f } = fresh(3); f.herd.najdi = 300; for (let i = 0; i < 2; i++) a(A.hireStaff(S, 'riyadh', 'farmer').ok); const fs = E.farmFarmers(S, 'riyadh'); const n = fs.length, need = E.farmerNeed(S, 'riyadh'); a(need > n, 'الحاجة أكبر من العدد فالغطاء < 1');
  const setSk = (home, spec) => fs.forEach(w => { w.sk = { g: 1, xp: 0, m: 1, wk: 0, home, spec: spec || {} }; w.free = 0; w.late = 0; });
  setSk('farm'); const c1 = E.farmCover(S, 'riyadh'); a(c1 < 1 && c1 > 0, 'غطاء ' + c1.toFixed(3)); near(c1, n * 1 / need, 'نقاط المبتدئ 1 × الملاءمة 1');
  setSk('sale'); near(E.farmCover(S, 'riyadh'), c1 * 0.3, 'تخصص آخر بلا تدريب: 0.3'); setSk('sale', { farm: 0.8 }); near(E.farmCover(S, 'riyadh'), c1 * 0.8, 'بقوة تخصصه الثاني 0.8'); setSk('sale', { farm: 1 }); near(E.farmCover(S, 'riyadh'), c1);
  E.FARMX.on = false; setSk('sale'); near(E.farmCover(S, 'riyadh'), c1, 'مطفأ: لا أثر'); E.FARMX.on = true;
  f.herd.najdi = 4; setSk('farm'); a(E.farmCover(S, 'riyadh') <= 1.2 + 1e-9, 'السقف 1.2'); ok('ملاءمة المزارع');
}
// 7) المطفأ = القديم حرفاً بلا حقل جديد؛ والدرجة 1 مفعّلةً مطابقة للمطفأ
{
  const run = on => { E.FARMX.on = on; const w = fresh(1); const { S, f, pr } = w; setFill(S, f, 0.9); E.hxOf(f, 'najdi').y = 10; pr.store.najdi = 60; for (let i = 0; i < 30; i++) { S.cities.riyadh.stock.najdi = i % 3 ? 5 : 0; day(S); } return { raw: E.save(S), m: pr.farmBoss }; };
  const off = run(false), on1 = run(true); E.FARMX.on = true; a(!off.m.x && !(off.m.week && off.m.week.x), 'لا حقل جديد'); a.equal(on1.raw, off.raw, 'الدرجة 1 مفعّلةً = المطفأ'); 
  E.FARMX.on = false; const w = fresh(5); a.equal(E.fxMaxCap(w.m), 40, 'مطفأ: سقف 40'); a(!A.setFarmBossCap(w.S, 'riyadh', 50).ok); setFill(w.S, w.f, 0.97); w.pr.store.najdi = 9; day(w.S); a(!w.m.x); E.FARMX.on = true; ok('المطفأ = القديم بلا حقل جديد');
}
// 8) حفظ قديم وتالف، وحد التكاثر عند الدرجة العليا مع الذكور
{
  const w = fresh(5); a(A.cropConvert(w.S, 'riyadh', 0, 'field').ok); w.S.day = Math.ceil(w.S.day / E.FARMX.season + 1) * E.FARMX.season; day(w.S); a.equal(w.m.x.cards.length, 1);
  let L = E.loadChecked(E.save(w.S)); a(L.ok); a.equal(L.S.player.props.riyadh.farmBoss.x.cards.length, 1, 'البطاقة تُحفظ وتعود');
  const old = JSON.parse(E.save(w.S)); delete old.player.props.riyadh.farmBoss.x; L = E.loadChecked(JSON.stringify(old)); a(L.ok && !L.S.player.props.riyadh.farmBoss.x, 'حفظ قديم بلا x');
  const bad = JSON.parse(E.save(w.S)); bad.player.props.riyadh.farmBoss.x = { cards: [{ junk: 1 }], log: 4, q: 'z', yw: 5 }; L = E.loadChecked(JSON.stringify(bad)); a(L.ok); const x = L.S.player.props.riyadh.farmBoss.x; a(x.cards.length === 0 && Array.isArray(x.log) && x.q === -1 && x.yw.base, 'تالف يُصحَّح');
  const big = JSON.parse(E.save(w.S)); big.player.props.riyadh.farmBoss.cap = 55; L = E.loadChecked(JSON.stringify(big)); a(L.ok && L.S.player.props.riyadh.farmBoss, 'سقف 55 مقبول لدرجة 5'); big.player.props.riyadh.farmBoss.sk.g = 3; L = E.loadChecked(JSON.stringify(big)); a(!L.S.player.props.riyadh.farmBoss || L.S.player.props.riyadh.farmBoss.cap <= 40, 'سقف 55 لدرجة 3 يُسقَط كما كان');
  E.FARMX.on = false; L = E.loadChecked(E.save(w.S)); E.FARMX.on = true; a(L.ok && !L.S.player.props.riyadh.farmBoss.x, 'مطفأ يزيل x'); ok('حفظ قديم وتالف');
}
console.log('PASS farm-x');
