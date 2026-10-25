// المزرعة: التربية والتكاثر والمنتجات والذبح (محرك فقط): node test/farm.test.js
const E = require('../src/engine.js'), A = E.A;
require('./lib/legacy-market.js')(E);
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function fresh(city) { const S = E.newGame(3); S.phase = 3; for (let i = 0; i < 20; i++) E.tick(S); S.player.gold = 300000; const car = S.player.caravans[0]; if (city && city !== car.city) { car.city = city; } A.buildShop(S, car.city); A.buildWarehouse(S, car.city); return { S, car, city: car.city }; }
let { S, car, city } = fresh();
{ const P = E.newGame(3); P.phase = 2; P.player.gold = 99999; A.buildShop(P, 'riyadh'); ok(!A.buildFarm(P, 'riyadh').ok, 'المزرعة مقفلة قبل الطور ٣'); P.phase = 3; ok(A.buildFarm(P, 'riyadh').ok, 'تُبنى في الطور ٣'); const Q = E.newGame(3); Q.phase = 3; Q.player.gold = 99999; ok(!A.buildFarm(Q, 'riyadh').ok, 'تحتاج دكاناً أولاً'); ok(!A.buildFarm(P, 'riyadh').ok, 'مزرعة واحدة لكل مدينة'); }
const g0 = S.player.gold; ok(A.buildFarm(S, city).ok && g0 - S.player.gold === E.FARM_COST, 'التكلفة ' + E.FARM_COST);
const f = E.farmOf(S, city); ok(f && f.level === 1 && E.farmCap(S, city) === Math.round(40 * 0.8), 'سعة المزرعة في الجزيرة = ٣٢ (المرعى ٠٫٨)');
{ const C = E.newGame(3); C.phase = 3; C.player.gold = 99999; A.buildShop(C, 'cairo'); A.buildFarm(C, 'cairo'); ok(E.farmCap(C, 'cairo') > 40 && E.farmCap(C, 'cairo') > E.farmCap(S, city), 'المرعى في مصر أخصب (' + E.farmCap(C, 'cairo') + ')'); }
ok(E.staffOf(S, city).some(w => w.role === 'farmer' && w.free > S.day), 'مزارع مجاني ٣٠ يوماً');
// الإيداع
A.hireHerder(S, car.id); A.hireHerder(S, car.id); A.buy(S, car.id, 'sheep', 20, 'herd'); const m0 = E.malesOf(car, 'sheep');
const fi = A.farmIn(S, car.id, 'sheep', 20); ok(fi.ok && f.herd.sheep === 20 && !(car.herd.sheep > 0), 'نقل ٢٠ غنمة إلى المزرعة');
ok(Math.abs(E.malesOf(f, 'sheep') - m0) < 1e-6, 'الذكور تنتقل بنسبتها (' + E.malesOf(f, 'sheep').toFixed(1) + ')');
ok(S.player.props[city].basis.sheep && S.player.props[city].basis.sheep.q === 20, 'تكلفة الشراء تنتقل مع القطيع');
ok(E.farmUnits(f) === 20, 'وحدات المزرعة = ٢٠');
car.cargo = { chicken: 60 }; ok(A.farmIn(S, car.id, 'chicken', 60).ok && f.herd.chicken === 60 && Math.abs(E.farmUnits(f) - 26) < 1e-9, 'الدجاج من الحمولة، وحدته ٠٫١ (' + E.farmUnits(f) + ')');
ok(!A.farmIn(S, car.id, 'wool', 1).ok, 'لا تُربّى السلع العادية');
A.buy(S, car.id, 'sheep', 20, 'herd'); const fin = A.farmIn(S, car.id, 'sheep', 20); ok(fin.ok && E.farmUnits(f) <= E.farmCap(S, city) + 1e-9, 'السعة تحدّ الإيداع (' + f.herd.sheep + ')');
// المنتجات والتكاثر
const st0 = S.player.props[city].store; for (let i = 0; i < 30; i++) E.tick(S);
ok((st0.wool || 0) > 10 && (st0.eggs || 0) > 5, 'صوف وبيض يصلان المخزن (صوف ' + Math.round(st0.wool) + ' بيض ' + Math.round(st0.eggs) + ')');
ok(E.youngOf(f, 'chicken') > 0, 'الدجاج يتكاثر في المزرعة (' + E.youngOf(f, 'chicken').toFixed(1) + ')');
// سعة ممتلئة تمنع الولادة
for (let i = 0; i < 60; i++) E.tick(S); ok(E.farmUnits(f) <= E.farmCap(S, city) + 1.01, 'لا ولادة فوق السعة (' + E.farmUnits(f).toFixed(1) + ' ≤ ' + E.farmCap(S, city) + ')');
// الجبن من الإناث فقط
const K = fresh('cairo'); A.buildFarm(K.S, K.city); A.hireHerder(K.S, K.car.id); A.hireHerder(K.S, K.car.id); A.buy(K.S, K.car.id, 'cow', 10, 'herd'); if (K.car.herd.cow) A.farmIn(K.S, K.car.id, 'cow', 10);
const kf = E.farmOf(K.S, K.city); for (let i = 0; i < 30; i++) E.tick(K.S); ok((K.S.player.props[K.city].store.cheese || 0) > 3, 'البقر ينتج جبناً (' + Math.round(K.S.player.props[K.city].store.cheese || 0) + ')');
// المزارعون
ok(E.farmerNeed(S, city) === Math.ceil(E.farmUnits(f) / E.FARMER_UNITS), 'الحاجة للمزارعين تتبع الوحدات (' + E.farmerNeed(S, city) + ')');
const N = fresh(); A.buildFarm(N.S, N.city); A.hireHerder(N.S, N.car.id); A.buy(N.S, N.car.id, 'sheep', 10, 'herd'); A.farmIn(N.S, N.car.id, 'sheep', 10); const np = N.S.player.props[N.city]; np.staff = np.staff.filter(w => w.role !== 'farmer');
ok(E.farmCover(N.S, N.city) === 0, 'بلا مزارع: التغطية صفر'); for (let i = 0; i < 30; i++) E.tick(N.S); ok((np.store.wool || 0) === 0 && E.youngOf(E.farmOf(N.S, N.city), 'sheep') === 0, 'بلا مزارع لا إنتاج ولا تكاثر');
ok(A.hireFill(N.S, N.city).ok && E.farmCover(N.S, N.city) >= 1, 'وظّف حتى اكتمال الحاجة يشمل المزارعين');
// الذبح
const Z = fresh(); A.buildFarm(Z.S, Z.city); A.hireHerder(Z.S, Z.car.id); A.buy(Z.S, Z.car.id, 'sheep', 10, 'herd'); A.farmIn(Z.S, Z.car.id, 'sheep', 10); const zp = Z.S.player.props[Z.city];
const sl = A.slaughter(Z.S, Z.city, 'sheep', 4); ok(sl.ok && zp.store.jerky === 8 && E.farmOf(Z.S, Z.city).herd.sheep === 6, 'ذبح ٤ غنمات = ٨ لحم مجفف');
ok(zp.basis.jerky && zp.basis.jerky.c > 0, 'تكلفة اللحم المجفف من ثمن الغنم');
A.buy(Z.S, Z.car.id, 'horse', 2, 'herd'); A.hireHerder(Z.S, Z.car.id); A.buy(Z.S, Z.car.id, 'horse', 2, 'herd'); A.farmIn(Z.S, Z.car.id, 'horse', 2); ok(!A.slaughter(Z.S, Z.city, 'horse', 1).ok, 'لا تُذبح الخيل');
// البيع من المزرعة
const sb = A.farmSell(Z.S, Z.city, 'sheep', 2); ok(sb.ok && sb.n === 2, 'بيع غنم من المزرعة'); E.farmOf(Z.S, Z.city).hx.sheep.y = 5; const sy = A.farmSell(Z.S, Z.city, 'sheep', 3, 'young'); ok(sy.ok && Math.abs(E.youngOf(E.farmOf(Z.S, Z.city), 'sheep') - 2) < 1e-9, 'بيع صغار المزرعة');
// الإخراج للقطيع
const O = A.farmOut(Z.S, Z.car.id, 'sheep', 2); ok(O.ok && Z.car.herd.sheep === 2, 'إخراج للقطيع');
// الأجر والصيانة والثروة والزكاة
const e0 = Z.S.player.led.exp.farm || 0; E.tick(Z.S); ok((Z.S.player.led.exp.farm || 0) - e0 >= E.FARM_UPKEEP - 1e-6, 'صيانة المزرعة تُدفع يومياً');
const nw = E.netWorth(Z.S), zg = E.zakatBase(Z.S).store; E.farmOf(Z.S, Z.city).herd.sheep += 20; ok(E.netWorth(Z.S) > nw + 1500 && E.zakatBase(Z.S).store > zg, 'مواشي المزرعة في الثروة والزكاة');
// التوسعة
const U = fresh(); A.buildFarm(U.S, U.city); const c1 = E.farmCap(U.S, U.city); ok(A.upgradeFarm(U.S, U.city).ok && E.farmCap(U.S, U.city) === c1 * 2, 'التوسعة تضاعف السعة'); A.upgradeFarm(U.S, U.city); ok(!A.upgradeFarm(U.S, U.city).ok, 'سقف المستويات ' + E.FARM_MAXLV);
// سلالة الخيل
{ const H = fresh(); A.buildFarm(H.S, H.city); for (let i = 0; i < 2; i++) A.upgradeFarm(H.S, H.city); for (let i = 0; i < 3; i++) A.hireHerder(H.S, H.car.id); A.buy(H.S, H.car.id, 'horse', 8, 'herd'); A.farmIn(H.S, H.car.id, 'horse', 8); const hf = E.farmOf(H.S, H.city);
  ok(Math.abs(E.pedOf(hf, 'horse') - 1) < 1e-9 && Math.abs(E.pedMul(1) - 1) < 1e-9, 'الخيل المشتراة سلالتها نجمة واحدة وسعرها عادي');
  const p0 = E.pedOf(hf, 'horse'); const sd = A.buyStud(H.S, H.city); ok(sd.ok && E.pedOf(hf, 'horse') > p0, 'الفحل الأصيل يرفع متوسط السلالة (' + E.pedOf(hf, 'horse').toFixed(2) + ')');
  ok(!A.buyStud(H.S, H.city).ok, 'الفحول نادرة: مرة كل ٦٠ يوماً');
  ok(!A.buyStud(E.newGame(1), 'cairo').ok, 'لا فحول أصيلة إلا في أسواق الخيل');
  const hb = fresh(); A.buildFarm(hb.S, hb.city); for (let i = 0; i < 2; i++) A.upgradeFarm(hb.S, hb.city); for (let i = 0; i < 3; i++) A.hireHerder(hb.S, hb.car.id); A.buy(hb.S, hb.car.id, 'horse', 8, 'herd'); A.farmIn(hb.S, hb.car.id, 'horse', 8); A.buyStud(hb.S, hb.city); A.buildStable(hb.S, hb.city);
  const nb = fresh(); A.buildFarm(nb.S, nb.city); for (let i = 0; i < 2; i++) A.upgradeFarm(nb.S, nb.city); for (let i = 0; i < 3; i++) A.hireHerder(nb.S, nb.car.id); A.buy(nb.S, nb.car.id, 'horse', 8, 'herd'); A.farmIn(nb.S, nb.car.id, 'horse', 8); A.buyStud(nb.S, nb.city);
  for (let i = 0; i < 500; i++) { E.tick(hb.S); E.tick(nb.S); }
  const qs = E.pedOf(E.farmOf(hb.S, hb.city), 'horse'), qn = E.pedOf(E.farmOf(nb.S, nb.city), 'horse'); ok(qs > qn && qn > p0, 'الإسطبل يحسّن السلالة أسرع (' + qs.toFixed(2) + ' > ' + qn.toFixed(2) + ')');
  const f2 = E.farmOf(hb.S, hb.city), pm = E.pedMulOf(f2, 'horse'); ok(pm > 1.1, 'السعر يتبع السلالة ×' + pm.toFixed(2));
  const price = E.unitPrice(hb.S.cities[hb.city], 'horse'), rs = A.farmSell(hb.S, hb.city, 'horse', 1); ok(rs.ok && rs.net > price * 0.9 * 1.05, 'بيع فرس أصيلة بسعر أعلى (' + Math.round(rs.net) + ' مقابل ' + Math.round(price) + ')');
  const w0 = E.pedOf(f2, 'horse'); const hv = A.farmOut(hb.S, hb.car.id, 'horse', 4); ok(hv.ok && Math.abs(E.pedOf(hb.car, 'horse') - w0) < 0.35, 'السلالة تنتقل مع الخيل إلى القطيع (' + E.pedOf(hb.car, 'horse').toFixed(2) + ')'); }
// الحفظ
const L = E.load(E.save(S)); ok(L && E.farmOf(L, city) && Math.abs(E.farmOf(L, city).herd.sheep - f.herd.sheep) < 1e-9, 'الحفظ والتحميل يبقي المزرعة');
const st = E.stressTest({ seeds: 8, days: 100, bot: true }); ok(st.nan === 0, 'الضغط بلا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
