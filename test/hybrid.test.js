// التزاوج والتهجين بين الأصناف (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const buyAt = (S, car, city, g, n, sex) => { const b = car.city; car.city = city; S.cities[city].stock[g] = 400; const r = A.buy(S, car.id, g, n, 'herd', sex); car.city = b; return r; };
function world(seed, lv) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.fxFree = true; S.learn.level = lv || 11; S.phase = 3; S.player.gold = 400000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; car.herders = 5; const c = S.cities.riyadh; ['horse', 'arab_kuhaylan', 'mongolian', 'sheep', 'najdi'].forEach(g => c.stock[g] = 400); return { S, car, c }; }
ok(E.GD.horse_h && E.GD.horse_h.hyb && E.BREED.horse_h && E.GD.sheep_h.sp === 'sheep', 'لكل نوع سلعة هجين');
ok(!E.sells(E.newGame(3).cities.riyadh, 'horse_h'), 'الهجين لا يُشترى من الأسواق');
let { S, car } = world(4);
A.buy(S, car.id, 'arab_kuhaylan', 6, 'herd', 'f'); A.buy(S, car.id, 'arab_kuhaylan', 1, 'herd', 'p');
let r = A.pairSet(S, 'car', car.id, 'arab_kuhaylan', 'mongolian'); ok(r.ok === false && /لا ذكر|لا إناث/.test(r.msg), 'لا تلقيح بلا ذكر من الصنف الآخر: ' + r.msg);
buyAt(S, car, 'xian', 'mongolian', 2, 'm');
r = A.pairSet(S, 'car', car.id, 'arab_kuhaylan', 'mongolian'); ok(r.ok !== false && car.pair.arab_kuhaylan === 'mongolian', 'ربط إناث العربي بذكور المنغولي');
r = A.pairSet(S, 'car', car.id, 'sheep', 'mongolian'); ok(r.ok === false, 'لا تزاوج بين نوعين: ' + r.msg);
r = A.pairSet(S, 'car', car.id, 'arab_kuhaylan', 'horse_h'); ok(r.ok === false, 'الهجين لا يلقّح هجيناً: ' + r.msg);
let born = 0; for (let d = 0; d < 120; d++) born += E.breedStep(S, car, 'arab_kuhaylan', 1, 100, 0.5, 1);
const hx = car.hx.horse_h;
ok(born >= 1 && hx && hx.y >= 0 && (car.herd.horse_h !== undefined), 'وُلد هجين (' + born + ') ودخل في القطيع');
ok(!(car.hx.arab_kuhaylan.y > 0) || born === 0 || car.hx.arab_kuhaylan.y === 0, 'المواليد هجينٌ لا من صنف الأمّ');
const tA = E.trHold(car, 'arab_kuhaylan'), tM = E.trHold(car, 'mongolian'), tH = E.trHold(car, 'horse_h');
ok(Math.abs(tH.speed - (tA.speed + tM.speed) / 2) < 1e-6 && tH.endu >= Math.min(5, (tA.endu + tM.endu) / 2 + 0.5) - 1e-6, 'سمات الهجين = متوسط الأبوين مع قوة الهجين (سرعة ' + tH.speed + '، تحمّل ' + tH.endu + ')');
const pfH = E.pfHold(car, 'horse_h'); ok(Math.abs(pfH - (1.7 + 0.6) / 2 * 1.05) < 1e-6, 'سعر الهجين متوسط الأبوين +5٪ (' + pfH.toFixed(3) + ')');
// نضوج الصغار إلى بالغين هجين
for (let d = 0; d < 400; d++) E.breedStep(S, car, 'horse_h', 1, 100, 0.5, 1);
ok(car.herd.horse_h >= 1, 'كبر المهر الهجين فصار بالغاً (' + car.herd.horse_h.toFixed(1) + ')');
// البيع: يعتمد السعر على سمة الهجين
const c = S.cities.riyadh; const q1 = E.quoteSell(S, 'riyadh', 'horse_h', 1, 1).net; ok(q1 > 0, 'للهجين سعر بيع في السوق');
// إلغاء الربط
r = A.pairSet(S, 'car', car.id, 'arab_kuhaylan', 'arab_kuhaylan'); ok(r.ok !== false && !car.pair.arab_kuhaylan, 'إلغاء الربط يعيد التلقيح بذكور الصنف نفسه');
// الفتح بالمستوى
const L = world(6, 3); A.buy(L.S, L.car.id, 'arab_kuhaylan', 1, 'herd', 'f'); buyAt(L.S, L.car, 'xian', 'mongolian', 1, 'm'); L.S.learn.level = 3;
ok(A.pairSet(L.S, 'car', L.car.id, 'arab_kuhaylan', 'mongolian').ok === false, 'التهجين مغلق قبل المستوى 5');
// المزرعة: الهجين ينتقل بسماته
const w = world(7); A.buildShop(w.S, 'riyadh'); A.buildFarm(w.S, 'riyadh'); const wc = w.car;
A.buy(w.S, wc.id, 'arab_kuhaylan', 6, 'herd', 'f'); buyAt(w.S, wc, 'xian', 'mongolian', 2, 'm'); A.pairSet(w.S, 'car', wc.id, 'arab_kuhaylan', 'mongolian');
for (let d = 0; d < 300; d++) E.breedStep(w.S, wc, 'arab_kuhaylan', 1, 100, 0.5, 1); for (let d = 0; d < 300; d++) E.breedStep(w.S, wc, 'horse_h', 1, 100, 0.5, 1);
const nh = Math.floor(wc.herd.horse_h || 0); A.farmIn(w.S, wc.id, 'horse_h', nh); const f = E.farmOf(w.S, 'riyadh');
ok(nh >= 1 && f.herd.horse_h >= 1 && f.hx.horse_h.tr && Math.abs(f.hx.horse_h.pf - wc.hx.horse_h.pf) < 1e-6, 'نقل الهجين للمزرعة يحمل سماته (' + nh + ')');
// الحفظ والتحميل
const Z = E.load(E.save(w.S)); ok(Z && Z.player.caravans[0].pair.arab_kuhaylan === 'mongolian' && E.trHold(E.farmOf(Z, 'riyadh'), 'horse_h').speed === f.hx.horse_h.tr.speed, 'الربط والسمات تُحفظ وتُحمَّل');
// الاقتصاد
const st = E.stressTest({ seeds: 6, days: 60, bot: true }); ok(st.nan === 0, 'الضغط: لا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
