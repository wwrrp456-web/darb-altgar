// اختبار وحدة للدكاكين والمخازن والمصانع والجمارك: node test/shops.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(42); S.phase = 4; S.player.gold = 100000;
// ١. الدكان يفتح مخزناً واحداً فقط
ok(!A.buildWarehouse(S, 'riyadh').ok, 'مخزن بلا دكان مرفوض');
ok(A.buildShop(S, 'riyadh').ok, 'بناء دكان');
ok(E.whsOf(S, 'riyadh') === 0 && E.storeCap(S, 'riyadh') === E.SHELF_CAP, 'السعة = رف الدكان فقط قبل المخزن');
ok(A.buildWarehouse(S, 'riyadh').ok, 'مخزن أول بعد الدكان');
ok(!A.buildWarehouse(S, 'riyadh').ok, 'مخزن ثانٍ مرفوض بلا دكان ثانٍ');
ok(A.buildShop(S, 'riyadh').ok && A.buildWarehouse(S, 'riyadh').ok, 'دكان ثانٍ يفتح مخزناً ثانياً');
ok(E.storeCap(S, 'riyadh') === 2 * E.WH_CAP + 2 * E.SHELF_CAP, 'سعة التخزين تنمو مع العدد');
// ٢. تكلفة تصاعدية + حدّ أقصى
const c0 = S.cities.riyadh; const costs = []; let n = 0;
while (n < 10) { costs.push(E.shopCost(S, c0)); if (!A.buildShop(S, 'riyadh').ok) break; n++; }
ok(E.shopsOf(S, 'riyadh').length === E.shopLimit(c0), 'الدكاكين تتوقف عند الحد ' + E.shopLimit(c0));
ok(costs.every((v, i) => i === 0 || v > costs[i - 1]), 'تكلفة الدكان تتصاعد: ' + costs.join('/'));
ok(E.shopCost(S, S.cities.cairo) > E.shopCost(S, S.cities.hail) * 1.3, 'البناء في دولة أخرى أغلى (×١٫٤)');
// ٣. البيع الآلي يتأثر بالسعر
const city = 'jeddah', cj = S.cities[city];
A.buildShop(S, city); const sh = E.shopsOf(S, city)[0]; A.buildWarehouse(S, city);
const pr = S.player.props[city];
function run(price) { const T = E.newGame(7); T.phase = 4; T.player.gold = 50000; A.buildShop(T, city); A.buildWarehouse(T, city); const s = E.shopsOf(T, city)[0]; A.shopSetItem(T, city, s.id, 'coffee', price, false); T.player.props[city].store.coffee = 200; let rev = 0; for (let i = 0; i < 10; i++) { E.tick(T); } return T.player.props[city].shops[0].items[0].sold; }
const low = run(0.9), high = run(1.8);
ok(low > high * 1.5, 'سعر منخفض يبيع أكثر: ' + low.toFixed(1) + ' مقابل ' + high.toFixed(1));
ok(run(3) < low * 0.4, 'سعر مرتفع جداً (300٪) يبيع أقل بكثير');
// ٤. المبيعات في الدفتر والمخزن ينقص
const T = E.newGame(7); T.phase = 4; T.player.gold = 50000; A.buildShop(T, city); A.buildWarehouse(T, city);
const s2 = E.shopsOf(T, city)[0]; A.shopSetItem(T, city, s2.id, 'coffee', 1.0, false); T.player.props[city].store.coffee = 100;
const g0 = T.player.gold; for (let i = 0; i < 5; i++) E.tick(T);
ok((T.player.led.inc.shops || 0) > 0 && T.player.props[city].store.coffee < 100, 'المبيعات تدخل الدفتر والمخزن ينقص');
ok(A.shopSetItem(T, city, s2.id, 'dates', 1).ok && A.shopSetItem(T, city, s2.id, 'wheat', 1).ok && A.shopSetItem(T, city, s2.id, 'tea', 1).ok && !A.shopSetItem(T, city, s2.id, 'silk', 1).ok, 'الدكان يتسع لـ ٤ سلع فقط');
// ٥. تعبئة آلية من السوق
const U = E.newGame(9); U.phase = 4; U.player.gold = 50000; const uc = 'jazan'; A.buildShop(U, uc); A.buildWarehouse(U, uc);
const s3 = E.shopsOf(U, uc)[0]; A.shopSetItem(U, uc, s3.id, 'coffee', 1.1, true); U.cities[uc].stock.coffee = E.capG(U.cities[uc], 'coffee') * 0.8;
for (let i = 0; i < 3; i++) E.tick(U);
ok((U.player.props[uc].store.coffee || 0) > 0, 'التعبئة الآلية تشتري من السوق عند الرخص');
// ٦. المصانع وأداة الدولة
{ const t = A.buildFactory(S, 'riyadh', 'tools'); const f = S.player.factories.find(x => x.recipe === 'tools'); ok(!t.ok || (f && f.local === false), 'ورشة الأدوات في السعودية «غير محلية» (جودة السمعة) أو تحتاج إذناً (هي صنعة صينية)'); }
ok(A.buildFactory(S, 'riyadh', 'perfume').ok, 'مصنع العطور يُبنى في السعودية');
const before = (S.player.props.riyadh.store.perfume || 0); for (let i = 0; i < 6; i++) E.tick(S);
ok((S.player.props.riyadh.store.perfume || 0) > before, 'المصنع ينتج إلى المخزن');
ok(!A.buildFactory(S, 'cairo', 'textile').ok, 'مصنع بلا دكان في المدينة مرفوض');
// ٧. الجمارك
const car = S.player.caravans[0]; car.city = 'riyadh'; car.cargo = { dates: 50 }; const gg = S.player.gold;
A.travel(S, car.id, 'cairo'); while (car.left > 0) E.tick(S);
ok((S.player.led.exp.customs || 0) > 0, 'جمارك عند دخول دولة أخرى: ' + Math.round(S.player.led.exp.customs || 0));
car.cargo = { dates: 50 }; const c1 = S.player.led.exp.customs; A.travel(S, car.id, 'alex'); while (car.left > 0) E.tick(S);
ok(S.player.led.exp.customs === c1, 'لا جمارك داخل نفس الدولة');
// ٨. حفظ/تحميل
const L = E.load(E.save(S)); ok(L && L.ver === E.VER && L.player.props.riyadh.shops.length > 0, 'الحفظ والتحميل');
ok(E.load('{"ver":1,"player":{}}') === null, 'حفظ قديم جداً يُهمَل');
console.log(fails ? fails + ' فشل' : 'كل الاختبارات نجحت'); process.exit(fails ? 1 : 0);
