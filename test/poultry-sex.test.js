// تحديد جنس الدواجن (الدجاج والبط) عند الشراء للتربية، وانتقاله إلى المزرعة: node test/poultry-sex.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(3); S.phase = 3; for (let i = 0; i < 20; i++) E.tick(S); S.player.gold = 300000; S.fxFree = true;
const car = S.player.caravans[0], city = 'cairo'; car.city = city; car.left = 0;
A.buildShop(S, city); A.buildWarehouse(S, city); ok(A.buildFarm(S, city).ok, 'مزرعة في القاهرة');
S.cities[city].stock.chicken = 500; S.cities[city].stock.duck = 500;
const f = E.farmOf(S, city);
// شراء بتحديد الجنس
let r = A.buy(S, car.id, 'chicken', 6, undefined, 'm'); ok(r.ok && r.n === 6, 'شراء ٦ ذكور دجاج');
r = A.buy(S, car.id, 'chicken', 10, undefined, 'f'); ok(r.ok && r.n === 10, 'شراء ١٠ إناث');
const cx = E.cxOf(car, 'chicken'); ok(cx.m === 6 && cx.f === 10 && Math.floor(car.cargo.chicken) === 16, 'الأجناس مسجلة (' + cx.m + ' ذكر، ' + cx.f + ' أنثى)');
ok(!A.buy(S, car.id, 'chicken', 1, undefined, 'p').ok, 'لا «حامل» للدواجن في الحمولة');
ok(!A.buy(S, car.id, 'wheat', 1, undefined, 'm').ok, 'السلع غير الحيوانية لا جنس لها');
// البيع يعدّل نسبة الجنس
const before = Math.floor(car.cargo.chicken);
A.sell(S, car.id, 'chicken', 4); const after = Math.floor(car.cargo.chicken), k = after / before, cx2 = E.cxOf(car, 'chicken');
ok(Math.abs(cx2.m - 6 * k) < 1e-6 && Math.abs(cx2.f - 10 * k) < 1e-6, 'البيع يقلّص الأجناس بنسبتها (' + cx2.m.toFixed(2) + ' / ' + cx2.f.toFixed(2) + ')');
// إلى المزرعة: الذكور المحدَّدون تنتقل
const have = Math.floor(car.cargo.chicken), mBefore = cx2.m; const fi = A.farmIn(S, car.id, 'chicken', have); ok(fi.ok, 'نقل الدجاج إلى المزرعة');
ok(Math.abs(E.malesOf(f, 'chicken') - mBefore) < 0.51, 'ذكور المزرعة = الذكور المحدَّدة (' + E.malesOf(f, 'chicken').toFixed(1) + ' من ' + mBefore.toFixed(1) + ')');
// بلا تحديد: القاعدة الافتراضية (ربع الذكور) على الدفعة الجديدة
const m1 = E.malesOf(f, 'chicken'); A.buy(S, car.id, 'chicken', 8); const fo = A.farmIn(S, car.id, 'chicken', 8); ok(fo.ok && Math.abs(E.malesOf(f, 'chicken') - m1 - 2) < 0.51, 'بلا تحديد: ربع ذكور للدفعة (+٢ من ٨)');
// إناث فقط: لا ذكور فلا تكاثر
const S2 = E.newGame(3); S2.phase = 3; for (let i = 0; i < 20; i++) E.tick(S2); S2.player.gold = 300000; S2.fxFree = true; const c2 = S2.player.caravans[0]; c2.city = city; c2.left = 0; A.buildShop(S2, city); A.buildWarehouse(S2, city); A.buildFarm(S2, city); S2.cities[city].stock.chicken = 500;
A.buy(S2, c2.id, 'chicken', 10, undefined, 'f'); A.farmIn(S2, c2.id, 'chicken', 10); ok(E.malesOf(E.farmOf(S2, city), 'chicken') === 0, 'إناث فقط: لا ذكور في المزرعة (التكاثر بحاجة لذكر)');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
