// 040هـ: حالة الدكاكين والمخازن: للصيانة أثر ظاهر. المبلغ اليومي واسم البند لا يتغيران؛ الحالة تستقر 80–90 بالصيانة، وتهبط بالإهمال فيقلّ الإقبال وتكثر الأعطال، والترميم يعيدها؛ والمفتاح المطفأ كالسابق حرفياً
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, { SHOPCOND: SC } = E, ok = m => console.log('OK   ' + m);
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noEvents = true; S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = true; S.player.gold = 1e6;
  A.buildShop(S, 'riyadh'); const sh = E.shopsOf(S, 'riyadh')[0]; A.shopSetItem(S, 'riyadh', sh.id, 'wheat', 1.0); return S; };
const day = (S, f) => { if (f) f(S); E.tick(S, false); S.pause = false; };
const shop = S => S.player.props.riyadh.shops[0], upk = S => S.player.led.exp.upkeep || 0;
// ١) المفتاح والقيم المعتمدة، والحالة الغائبة = start (لا ترحيل)
assert.deepEqual([SC.on, SC.start, SC.wear, SC.mend, SC.neglect, SC.floor], [true, 80, 0.3, 0.45, 0.9, 30]); assert.deepEqual(SC.sales, [0.85, 1.03]); assert.deepEqual(SC.breakMul, [1, 2.5]);
{ const S = mk(); assert.equal(shop(S).cond, undefined, 'الحقل اختياري'); assert.equal(E.scCond(shop(S)), 80); assert.equal(E.scSalesOf(80), 1); assert.equal(E.scBreakOf(80), 1); assert.equal(E.scName(80), 'جيدة'); assert.equal(E.scQuote(S, 'riyadh', shop(S).id).cond, 80); }
ok('القيم المعتمدة، والدكان القديم بلا حقل يبدأ 80 (إقبال ×1 وعطل ×1)');
// ٢) صيانة منتظمة: تستقر الحالة 80–90 والمبلغ اليومي هو نفسه (10 للدكان + 6 للمخزن)
{ const S = mk(); A.buildWarehouse(S, 'riyadh'); const pr = S.player.props.riyadh, u0 = upk(S); day(S, s => { pr.store.wheat = 800; }); const d1 = upk(S) - u0; assert.ok(Math.abs(d1 - (10 * (1 + 0.08 * 0) + 6)) < 1e-9, 'المبلغ اليومي كما هو: ' + d1);
  for (let d = 2; d <= 150; d++) day(S, s => { pr.store.wheat = 800; }); const c = shop(S).cond; assert.ok(c >= 80 && c <= 90, 'مستقر 80–90: ' + c); assert.equal(c, 90, 'يبلغ سقف الصيانة 90'); assert.equal(pr.wcond, 90); assert.ok(S.player.led.exp.upkeep > 0 && !('repair' in S.player.led.exp), 'البند upkeep وحده');
  ok('صيانة منتظمة 150 يوماً: الدكان والمخزن يستقران عند 90، والمبلغ اليومي 16 كما هو'); }
// ٣) إهمال 90 يوماً (رصيد صفر فلا تُدفع الصيانة): ≤ floor، ثم الترميم يعيدها بمقابل معلوم في بند upkeep
{ const S = mk(); const pr = S.player.props.riyadh, hist = []; for (let d = 1; d <= 90; d++) { day(S, s => { pr.store.wheat = 800; s.player.gold = 0; }); if (d % 30 === 0) hist.push(shop(S).cond); }
  assert.deepEqual(hist.map(x => Math.round(x)), [53, 26, 0], 'ينزل 0.9 يومياً'); assert.ok(hist[1] <= SC.floor, 'تحت العتبة بعد 60 يوماً'); const q = E.scQuote(S, 'riyadh', shop(S).id); assert.equal(q.name, 'متهالكة'); assert.equal(q.can, true); assert.equal(q.cost, Math.round(12 * 10 * 90 / 10), 'ترميم 12 يوم صيانة لكل +10'); assert.equal(E.scBreakOf(0), 2.5);
  S.player.gold = 5; let r = A.shopRepair(S, 'riyadh', shop(S).id); assert.equal(r.ok, false, 'رصيد ناقص'); S.player.gold = 1e6; const u0 = upk(S), g0 = S.player.gold; r = A.shopRepair(S, 'riyadh', shop(S).id); assert.ok(r.ok, r.msg); assert.equal(shop(S).cond, 90); assert.equal(upk(S) - u0, q.cost, 'يُسجَّل في upkeep'); assert.equal(g0 - S.player.gold, q.cost);
  assert.equal(A.shopRepair(S, 'riyadh', shop(S).id).ok, false, 'سليم لا يُرمَّم'); assert.equal(E.scSummary(S).good, 1);
  ok('إهمال 90 يوماً: 53 ← 26 ← 0؛ الترميم 1080 ريالاً يعيدها 90 ويُسجَّل في upkeep ولا يُرمَّم السليم'); }
// ٤) الأثر على المبيعات: حالة مثبَّتة (دون تغيّر الحالة) ثم مقارنة الوحدات المباعة
{ const pin = (seed, cond) => { const m0 = SC.mend; SC.mend = SC.wear; try { const S = mk(seed), pr = S.player.props.riyadh, it = shop(S).items[0]; let s0 = 0; for (let d = 1; d <= 90; d++) { pr.store.wheat = 800; shop(S).cond = cond; S.player.gold = 1e6; E.tick(S, false); S.pause = false; if (d === 30) s0 = it.sold; } return (it.sold - s0) / 60; } finally { SC.mend = m0; } };
  const avg = c => [3, 5, 7].reduce((a, s) => a + pin(s, c), 0) / 3, b = avg(80), r = {}; for (const c of [0, 45, 90]) r[c] = avg(c) / b - 1;
  assert.ok(Math.abs(r[0] + 0.15) < 0.02, 'متهالك 0: −15٪ (' + (r[0] * 100).toFixed(1) + ')'); assert.ok(r[45] < -0.03 && r[45] > -0.09, 'مقبولة: −3 إلى −9٪'); assert.ok(r[90] > 0.01 && r[90] < 0.06, 'ممتازة: +1 إلى +6٪ (' + (r[90] * 100).toFixed(1) + ')');
  ok('الإقبال: متهالك −15٪، مقبولة ≈−5٪، ممتازة ≈+3٪ (قياس فعلي بمبيعات الدكان)'); }
// ٥) الأثر على الأعطال: حريق المخزن ×2.5 عند الإهمال (قياس إحصائي على shockDay)، ولا يقلّ عن السابق بالصيانة
{ const fires = c => { const S = mk(); A.buildWarehouse(S, 'riyadh'); const pr = S.player.props.riyadh; pr.store.wheat = 2000; pr.wcond = c; let n = 0; for (let i = 0; i < 30000; i++) { S.shocks = []; S.day = 40; E.shockDay(S); if (S.shocks.some(x => x.k === 'fire')) n++; } return n; };
  const hi = fires(90), lo = fires(0), mid = fires(80); assert.ok(hi > 25, 'عيّنة كافية: ' + hi); assert.ok(Math.abs(hi - mid) / mid < 0.35, 'الصيانة لا تنزل عن السابق'); const ratio = lo / hi; assert.ok(ratio > 1.7 && ratio < 3.0, 'نسبة الحريق المهمل/المصان: ' + ratio.toFixed(2)); console.log('     حرائق من 30000 يوم: مصان ' + hi + '، مهمل ' + lo + ' (×' + ratio.toFixed(2) + ')');
  ok('حريق المخزن يتضاعف عند الإهمال (≈×2.3 من الحصة الكلية للأحداث)'); }
// ٦) المفتاح المطفأ = السابق حرفياً: لا حقول، ولا أثر؛ والتشغيل بحالة 80 المثبَّتة مطابق للمطفأ
{ const run = (on, pinned) => { SC.on = on; const m0 = SC.mend; if (pinned) SC.mend = SC.wear; try { const S = mk(7); S.noShocks = false; for (let d = 0; d < 120; d++) day(S, s => { s.player.props.riyadh.store.wheat = 800; }); return S; } finally { SC.on = true; SC.mend = m0; } };
  const off = run(false), pin = run(true, true); assert.equal(JSON.stringify(off).includes('"cond"') || JSON.stringify(off).includes('wcond'), false, 'لا حقول حين يُطفأ'); assert.equal(shop(pin).cond, 80); delete shop(pin).cond; assert.equal(JSON.stringify(pin), JSON.stringify(off), 'بصمة: المطفأ يطابق التشغيل بحالة ثابتة عند 80');
  SC.on = false; try { assert.equal(E.scQuote(mk(), 'riyadh', 1), null); assert.equal(E.scView(mk(), 'riyadh'), null); assert.equal(A.shopRepair(mk(), 'riyadh', 1).ok, false); assert.equal(E.scSalesMul === undefined, true); } finally { SC.on = true; }
  ok('SHOPCOND.on=false: لا حالة ولا ترميم ولا أثر، والبصمة مطابقة'); }
// ٧) الحفظ: اختياري ويصمد للحفظ والتحميل
{ const S = mk(); day(S, s => { s.player.props.riyadh.store.wheat = 800; }); const raw = E.save(S), S2 = E.loadChecked(raw).S; assert.equal(shop(S2).cond, shop(S).cond); const S3 = E.loadChecked(raw).S; delete shop(S3).cond; day(S3, s => { s.player.props.riyadh.store.wheat = 800; s.player.gold = 1e6; }); assert.ok(shop(S3).cond >= 80, 'القديم بلا حقل يستأنف من 80');
  ok('الحفظ والتحميل والحقل المفقود'); }
console.log('ALL OK');
