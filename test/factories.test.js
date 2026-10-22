// المصانع: محلية وغير محلية، الجودة، الصحة والانهيار، إذن الزعيم، مدير الأعمال (محرك فقط)
const E = require('../src/engine.js'), A = E.A, mid = g => (E.GD[g].pmin + E.GD[g].pmax) / 2;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, city) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.fxFree = true; S.learn.level = 11; S.phase = 3; S.player.gold = 400000; const car = S.player.caravans[0]; car.city = city || 'riyadh'; car.left = 0; A.buildShop(S, car.city); A.buildWarehouse(S, car.city); A.buildWarehouse(S, car.city); return { S, car, pr: S.player.props[car.city] }; }
const R = E.RECIPES, newer = Object.keys(R).filter(k => !R[k].old);
ok(Object.keys(R).length === 18 && newer.length === 13, 'ثماني عشرة سلعة تُصنَّع: 5 أصلية و13 جديدة');
ok(newer.every(k => { const inV = Object.keys(R[k].inp).reduce((a, g) => a + R[k].inp[g] * mid(g), 0); return inV / (R[k].n * mid(k)) < 0.27; }), 'مواد الجديدة ≈ 18٪ من قيمة الدفعة (أقل من 27٪)');
ok(E.MFG_COST('sugar') === 8000 && E.MFG_COST('porcelain') === 12000 && E.MFG_COST('silk') === 18000 && E.MFG_COST('perfume') === 18000, 'تكلفة البناء 8000/12000/18000 بحسب الغلاء');
// المحلي كما كان
let { S, car, pr } = world(4); const g0 = S.player.gold; let r = A.buildFactory(S, 'riyadh', 'perfume'); ok(r.ok && g0 - S.player.gold === 4000 && E.isAbroad(S.player.factories[0]) === false, 'العطور في الرياض محلية بـ 4000');
ok(E.factoryQual(S, S.player.factories[0]) === 1, 'المحلي بجودة كاملة (أصلية)');
// غير محلي
({ S, car, pr } = world(5, 'cairo')); S.player.gold = 400000;
r = A.buildFactory(S, 'cairo', 'silk');
const origin = S.order.find(id => S.cities[id].sig === 'silk'), bs = S.bosses[origin];
if (!r.ok) { ok(/إذن/.test(r.msg), 'يلزم إذن زعيم شيآن للحرير: ' + r.msg); bs.trust = 45; r = A.buildFactory(S, 'cairo', 'silk'); }
ok(r.ok && S.player.factories[0].local === false && 400000 - S.player.gold >= 18000, 'بناء مشغل حرير في القاهرة (غير محلي) بـ 18000');
const f = S.player.factories[0];
// الإذن بالشراء
const T = world(6, 'cairo'); T.S.bosses[origin].trust = 15; ok(/إذن/.test(A.buildFactory(T.S, 'cairo', 'silk').msg || ''), 'ثقة 15 لا تكفي');
ok(A.buyCraft(T.S, origin).ok && T.S.bosses[origin].craft && A.buildFactory(T.S, 'cairo', 'silk').ok, 'شراء «نقل الصنعة» يتيح البناء');
const T2 = world(6, 'cairo'); T2.S.bosses[origin].trust = 5; ok(A.buyCraft(T2.S, origin).ok === false, 'نقل الصنعة يحتاج ثقة ' + E.CRAFT_TRUST);
// الجودة والإنتاج
const q = E.factoryQual(S, f); const rep = E.reputation(S).quality / 100; ok(Math.abs(q - rep) < 1e-9 && q >= 0.35 && q <= 0.8, 'الجودة = جودة السمعة (' + q.toFixed(2) + ')');
S.cities.cairo.stock.cotton = 5000; for (let i = 0; i < 10; i++) E.tick(S);
const made = pr.store.silk || 0, per = R.silk.n * (0.5 + 0.5 * q) * 4 * 10; ok(made > 0 && Math.abs(made - per) < 4.5, 'الإنتاج = الدفعة × (50٪ + نصف الجودة) (' + made.toFixed(1) + ' من ~' + per.toFixed(1) + ')');
ok(Math.abs(E.qualOf(pr.basis, 'silk') - q) < 1e-6, 'الجودة تُسجَّل مع التكلفة');
// الجودة تضرب سعر البيع وتسافر مع النقل
const car1 = S.player.caravans[0]; car1.city = 'cairo'; car1.left = 0; const have = Math.floor(pr.store.silk); S.cities.cairo.stock.silk = 100;
A.fromStore(S, car1.id, 'silk', have); ok(Math.abs(E.qualOf(car1.basis, 'silk') - q) < 1e-6, 'الجودة تنتقل من المخزن إلى القافلة');
const full = E.quoteSell(S, 'cairo', 'silk', have, 1).net; const gg = S.player.gold; A.sell(S, car1.id, 'silk', have); const got = S.player.gold - gg;
ok(Math.abs(got / full - q) < 0.02, 'البيع بسعر × الجودة (' + (got / full).toFixed(2) + ')');
// الصحة: أجور متأخرة بعد المهلة
const H = world(7, 'cairo'); H.S.bosses[origin].trust = 50; A.buildFactory(H.S, 'cairo', 'silk'); const hf = H.S.player.factories[0];
for (let i = 0; i < 31; i++) E.tick(H.S); ok(hf.hp === 100, 'خلال شهر المهلة تبقى الصحة 100 (' + hf.hp + ')');
H.S.player.gold = 0; H.S.player.wallet.sar = 0; const hp0 = hf.hp; for (let i = 0; i < 3; i++) { H.S.player.gold = 0; E.tick(H.S); } ok(hf.hp < hp0 && hf.late >= 1, 'الأجور المتأخرة تُنزل الصحة (' + hf.hp + ')');
for (let i = 0; i < 40 && !hf.crisis; i++) { H.S.player.gold = 0; E.tick(H.S); } ok(!!hf.crisis, 'انهار المصنع عند الصفر');
H.S.player.gold = 5000; const fine = Math.round(E.factoryValue(hf) * E.FACT_HP.rescue); const rg = H.S.player.gold; r = A.rescueFactory(H.S, hf.id); ok(r.ok && rg - H.S.player.gold >= fine - 1 && rg - H.S.player.gold < fine + 60 && hf.hp === 50 && !hf.crisis, 'الإنقاذ بغرامة 10٪ (' + fine + ')');
const H2 = world(8, 'cairo'); H2.S.bosses[origin].trust = 50; A.buildFactory(H2.S, 'cairo', 'silk'); const f2 = H2.S.player.factories[0]; f2.hp = 0; f2.crisis = { day: H2.S.day - 19 }; const gb = H2.S.player.gold; E.tick(H2.S);
ok(H2.S.player.factories.length === 0 && H2.S.player.gold > gb + 4000, 'بعد 20 يوماً يُباع إجبارياً بنحو 40٪ (' + Math.round(H2.S.player.gold - gb) + ')');
// المدير
const M = world(9, 'cairo'); M.S.bosses[origin].trust = 50; A.buildFactory(M.S, 'cairo', 'silk'); const mf = M.S.player.factories[0]; M.S.cities.cairo.stock.cotton = 5000;
ok(A.hireManager(M.S, 'cairo', 1).ok && M.pr.mgr.lv === 1, 'تعيين مدير مبتدئ');
const sv = M.pr.store.cotton || 0; for (let i = 0; i < 3; i++) E.tick(M.S);
ok(E.mgrOk(M.S, 'cairo', M.pr) && E.assetsIn(M.S, 'cairo') === 3, 'الأصول 3 (دكان ومخزن ومصنع) ضمن طاقة المبتدئ');
M.S.bosses[origin].craft = true; M.S.bosses.guangzhou.craft = true; A.buildFactory(M.S, 'cairo', 'tea'); ok(!E.mgrOk(M.S, 'cairo', M.pr) && E.assetsIn(M.S, 'cairo') === 4, 'الأصل الرابع يُرهق المبتدئ');
M.S.player.gold = 400000; A.hireManager(M.S, 'cairo', 3); ok(M.pr.mgr.lv === 3 && E.mgrOk(M.S, 'cairo', M.pr), 'خبير يدير حتى 10 أصول');
ok(E.factoryQual(M.S, mf) > E.reputation(M.S).quality / 100 + 0.029, 'الخبير يرفع الجودة 3٪');
A.setFactory(M.S, mf.id, 'sell', 'now'); const rv0 = mf.rev || 0; for (let i = 0; i < 5; i++) E.tick(M.S); ok((mf.rev || 0) > rv0 && (M.pr.store.silk || 0) < 3, 'بيع فوري عبر المدير (إيراد ' + Math.round((mf.rev || 0) - rv0) + ')');
M.S.player.gold = 50000; A.setFactory(M.S, mf.id, 'minBal', 100000); M.pr.store.cotton = 0; M.pr.store.wood = 0; M.S.cities.cairo.stock.cotton = 5000; const m0 = mf.made; for (let i = 0; i < 3; i++) E.tick(M.S); ok(mf.made === m0, 'حدّ الرصيد الأدنى يمنع شراء المواد');
A.setFactory(M.S, mf.id, 'minBal', 0); A.setFactory(M.S, mf.id, 'maxBuy', 0.6); M.S.player.gold = 400000; M.pr.store.cotton = 0; M.S.cities.cairo.stock.cotton = 20; M.S.cities.cairo.idx.cotton = 1.2; const m1 = mf.made; for (let i = 0; i < 3; i++) E.tick(M.S); ok(mf.made === m1, 'أعلى سعر شراء للمواد يمنع الشراء الغالي');
// الاختلاس
const X = world(10, 'cairo'); A.hireManager(X.S, 'cairo', 1); X.pr.mgr.audit = X.S.day - 20; X.pr.store.wheat = 500; let stolen = false; for (let i = 0; i < 4000 && !stolen; i++) { X.S.day++; if (!X.pr.mgr) { stolen = true; break; } X.S.player.gold = 100000; try { require('../src/engine.js').tick; } catch (e) {} E.tick(X.S); if (!X.pr.mgr) stolen = true; }
ok(stolen, 'قد يختلس المدير إن لم تُراجَع حساباته');
const Y = world(11, 'cairo'); A.hireManager(Y.S, 'cairo', 1); for (let i = 0; i < 400; i++) { if (i % 8 === 0) A.auditCity(Y.S, 'cairo'); Y.S.player.gold = 100000; E.tick(Y.S); } ok(!!Y.pr.mgr, 'مراجعة الحسابات كل 8 أيام تمنع الاختلاس');
// الأجر المتأخر
const Z = world(12, 'cairo'); A.hireManager(Z.S, 'cairo', 1); for (let i = 0; i < 4; i++) { Z.S.player.gold = 0; Z.S.player.wallet.sar = 0; E.tick(Z.S); } ok(!Z.pr.mgr, 'ترك المدير لتأخّر أجره');
// الحفظ والتحميل
const L = E.load(E.save(M.S)); ok(L && L.player.factories[0].local === false && L.player.props.cairo.mgr.lv === 3 && Math.abs(E.qualOf(L.player.props.cairo.basis, 'silk') - E.qualOf(M.pr.basis, 'silk')) < 1e-9, 'الحفظ يبقي المصنع والمدير والجودة');
const st = E.stressTest({ seeds: 6, days: 80, bot: true }); ok(st.nan === 0 && st.summary.avgPlayerNW > 6000 && st.summary.avgPlayerNW < 16000, 'الضغط: لا NaN والثروة معقولة (' + Math.round(st.summary.avgPlayerNW) + ')');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
