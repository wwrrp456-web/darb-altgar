// شراء القطيع بتحديد الجنس (ذكر، أنثى، حامل) والحمل والولادة (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.phase = 2; S.player.gold = 90000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; car.herders = 2; S.cities.riyadh.stock.sheep = 500; return { S, car }; }
let { S, car } = world(4);
const u = E.unitPrice(S.cities.riyadh, 'sheep');
let g0 = S.player.gold, r = A.buy(S, car.id, 'sheep', 4, 'herd', 'f'); ok(r.ok !== false && car.herd.sheep === 4 && E.malesOf(car, 'sheep') === 0, 'شراء 4 إناث: بلا ذكور');
const cf = g0 - S.player.gold; g0 = S.player.gold; r = A.buy(S, car.id, 'sheep', 1, 'herd', 'm'); ok(r.ok !== false && E.malesOf(car, 'sheep') === 1, 'شراء ذكر واحد يرفع الذكور إلى 1');
g0 = S.player.gold; const cp0 = S.player.gold; r = A.buy(S, car.id, 'sheep', 2, 'herd', 'p'); const cp = cp0 - S.player.gold;
ok(r.ok !== false && E.pregOf(car, 'sheep') === 2, 'شراء حاملين: يُسجَّلان حوامل (' + E.pregOf(car, 'sheep') + ')');
ok(cp / 2 > u * E.SEXF.p * 0.9 && cp / 2 < u * E.SEXF.p * 1.3 && cp / 2 > (cf / 4) * 1.15, 'سعر الحامل أعلى بنحو ' + Math.round((E.SEXF.p - 1) * 100) + '٪');
r = A.buy(S, car.id, 'sheep', 1, 'cargo', 'f'); ok(r.ok === false, 'لا جنس خارج وضع القطيع: ' + (r.msg || ''));
r = A.buy(S, car.id, 'sheep', 1, 'herd', 'x'); ok(r.ok === false, 'جنس غير معروف مرفوض');
// الولادة: الحوامل يلدن بعد مدة الحمل ثم يكبر الصغار
const h = car, x = E.hxOf(h, 'sheep'), G = E.gestOf('sheep'); let born = 0;
for (let d = 0; d < Math.ceil(G * 2); d++) born += E.breedStep(S, h, 'sheep', 1, 100, 0.5, 1);
ok(born >= 1, 'وُلد ' + born + ' بعد ' + Math.ceil(G * 2) + ' يوماً من حوامل');
// بلا ذكر: لا حمل جديد
const w2 = world(5); const c2 = w2.car; A.buy(w2.S, c2.id, 'sheep', 6, 'herd', 'f'); let b2 = 0; for (let d = 0; d < 120; d++) b2 += E.breedStep(w2.S, c2, 'sheep', 1, 100, 0.5, 1);
ok(b2 === 0 && E.pregOf(c2, 'sheep') === 0, 'إناث بلا ذكر لا تحمل ولا تلد');
// جائعة: لا ولادة
const w3 = world(6); const c3 = w3.car; A.buy(w3.S, c3.id, 'sheep', 6, 'herd', 'p'); A.buy(w3.S, c3.id, 'sheep', 1, 'herd', 'm'); let b3 = 0; for (let d = 0; d < 60; d++) b3 += E.breedStep(w3.S, c3, 'sheep', 0, 100, 0.5, 1);
ok(b3 === 0, 'القافلة الجائعة: لا ولادة');
// المزرعة تحمل الحوامل معها
const w4 = world(7); const c4 = w4.car; w4.S.player.gold = 200000; w4.S.phase = 3; A.buildShop(w4.S, 'riyadh'); ok(A.buildFarm(w4.S, 'riyadh').ok, 'بناء مزرعة');
A.buy(w4.S, c4.id, 'sheep', 6, 'herd', 'p'); A.buy(w4.S, c4.id, 'sheep', 2, 'herd', 'm');
const pin = E.pregOf(c4, 'sheep'); r = A.farmIn(w4.S, c4.id, 'sheep', 8); const f = E.farmOf(w4.S, 'riyadh');
ok(r.ok !== false && Math.abs(E.pregOf(f, 'sheep') - pin) <= 1 && E.pregOf(c4, 'sheep') === 0, 'نقل القطيع للمزرعة ينقل الحوامل (' + pin + ' → ' + E.pregOf(f, 'sheep') + ')');
r = A.farmOut(w4.S, c4.id, 'sheep', 4); ok(r.ok !== false && E.pregOf(c4, 'sheep') >= 1, 'الإخراج من المزرعة يعيد جزءاً من الحوامل');
// الحفظ والتحميل
const Z = E.load(E.save(w4.S)); ok(Z && E.pregOf(E.farmOf(Z, 'riyadh'), 'sheep') === E.pregOf(f, 'sheep'), 'الحمل يُحفظ ويُحمَّل');
// الاستقرار: معدل الولادة عند الاستقرار كالسابق (إناث × الحجم ÷ الدورة)
const h5 = { herd: { goat: 30 }, hx: {} }; const x5 = E.hxOf(h5, 'goat'); x5.m = 5; const Sx = E.newGame(3); let t5 = 0; const D = 400;
for (let d = 0; d < D; d++) { t5 += E.breedStep(Sx, h5, 'goat', 1, 1e9, 0.1, 0); h5.herd.goat = 30; x5.y = 0; x5.m = 5; }
const exp = 25 * E.BREED.goat.L / E.BREED.goat.T * D; ok(t5 > exp * 0.85 && t5 < exp * 1.15, 'معدل الولادة المستقر قرب المتوقع (' + Math.round(t5) + ' من ~' + Math.round(exp) + ')');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
