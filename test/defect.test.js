// البضاعة المعيبة وخيار العيب (محرك): node test/defect.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, lv) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = lv; S.learn.intro = lv; S.learn.abroad = true; S.player.gold = 90000; return S; };
const main = S => S.player.caravans[0];
const day = S => { E.tick(S); S.pause = false; if (S.learn.eq.length) S.learn.eq.length = 0; };
// يشتري كل يوم خمس وحدات من أول سلعة تُباع في مدينة القافلة حتى يقع العيب
const hunt = S => {
  for (let i = 0; i < 400 && !(S.defects && S.defects.length); i++) { day(S); const car = main(S), c = S.cities[car.city], g = E.GIDS.find(x => E.sells(c, x) && !E.GD[x].live && c.stock[x] > 50); if (g) { car.cargo = {}; car.basis = {}; A.buy(S, car.id, g, 5); } }
  return S.defects && S.defects[0];
};
{ const S = mk(5, 3); for (let i = 0; i < 150; i++) { day(S); const car = main(S), g = E.GIDS.find(x => E.sells(S.cities[car.city], x) && !E.GD[x].live); A.buy(S, car.id, g, 5); } ok(!(S.defects || []).length, 'قبل المستوى ٤ لا بضاعة معيبة'); }
{ const S = mk(5, 4), d = hunt(S); ok(d && d.st === 'hidden' && d.n >= 5, 'بعد المستوى ٤ يقع عيب خفي في شراء ٥ وحدات أو أكثر ' + (d ? d.day : ''));
  const car = main(S), q0 = E.qualOf(car.basis, d.g); ok(q0 === 1 && !E.defectClaim(S), 'قبل ظهور العيب لا طلب ولا نقص في الجودة');
  day(S); ok(E.defectClaim(S) === null, 'لا يظهر في اليوم التالي'); day(S);
  const c = E.defectClaim(S); ok(c && c.d.st === 'found' && c.here && c.k === d.n, 'بعد يومين يظهر العيب والقافلة في مدينة البائع');
  ok(Math.abs(E.qualOf(car.basis, d.g) - E.DEFECT.q) < 0.02, 'جودة البضاعة المعيبة تنقص إلى النصف');
  ok(S.news.some(n => /عيب كان مخفياً/.test(n.t)), 'خبر بالعيب');
  const g0 = S.player.gold, st0 = S.cities[d.city].stock[d.g]; const r = A.defectReturn(S);
  ok(r.ok !== false && Math.abs(S.player.gold - g0 - c.refund) < 1 && !(car.cargo[d.g] > 0) && S.cities[d.city].stock[d.g] > st0 && d.st === 'returned', 'الرد: يُسترد الثمن كاملاً وتخرج البضاعة من القافلة');
  ok(A.defectReturn(S).ok === false && !E.defectClaim(S), 'لا رد ثانٍ'); }
{ const S = mk(6, 4), d = hunt(S); day(S); day(S); const car = main(S), c = E.defectClaim(S);
  const b = S.bosses && S.bosses[d.city]; if (b) b.trust = 0; const r0 = A.defectArsh(S);
  ok(b ? (r0.ok === false && /لم يرضَ/.test(r0.msg)) : true, 'الأرش برضا البائع: لا يرضى إن قلّت الثقة');
  if (b) b.trust = 50; const g0 = S.player.gold, cost0 = car.basis[d.g].c, r = A.defectArsh(S);
  ok(r.ok !== false && Math.abs(S.player.gold - g0 - c.arsh) < 1 && car.cargo[d.g] >= d.n && car.basis[d.g].c < cost0 && d.st === 'arsh', 'الأرش: يأخذ فرق القيمة ويبقي البضاعة'); }
{ const S = mk(7, 4), d = hunt(S); day(S); day(S); const car = main(S); const dest = S.order.find(x => x !== d.city && S.cities[x].country === S.cities[d.city].country); ok(A.travel(S, car.id, dest, 0).ok !== false, 'سافر بعيداً');
  ok(E.defectClaim(S).here === false && A.defectReturn(S).ok === false, 'خارج مدينة البائع لا رد');
  for (let i = 0; i < 16; i++) { E.tick(S); S.pause = false; S.learn.eq.length = 0; } ok(d.st === 'late' && S.news.some(n => /انقضى وقت المطالبة المعتاد/.test(n.t)), 'تنقضي المهلة فيسقط الحق'); }
{ const S = mk(10, 4), d = hunt(S); day(S); day(S); const car = main(S); ok(E.defectClaim(S) !== null, 'العيب ظاهر'); car.cargo[d.g] -= 1; ok(E.defectClaim(S) === null && d.st === 'forfeit' && S.news.some(n => /بعد أن علمتَ بعيبها/.test(n.t)), 'البيع بعد ظهور العيب يُسقط الحق (رضاً بالعيب)'); ok(A.defectReturn(S).ok === false && A.defectArsh(S).ok === false, 'لا رد ولا أرش بعد السقوط'); }
{ const S = mk(8, 4), d = hunt(S); day(S); const car = main(S); delete car.cargo[d.g]; delete car.basis[d.g]; day(S); ok(d.st === 'gone', 'إن بيعت البضاعة قبل ظهور العيب لا شيء'); }
{ const S = mk(9, 4), d = hunt(S); const L = E.load(E.save(S)); ok(L.defects.length === 1 && L.defects[0].g === d.g, 'الحفظ والتحميل يبقيان الطلب'); const o = E.load(JSON.stringify(Object.assign(JSON.parse(E.save(S)), { defects: undefined }))); ok(Array.isArray(o.defects), 'ترحيل حفظ قديم بلا الحقل'); }
{ const B = E.newGame(11); for (let i = 0; i < 100; i++) E.tick(B); ok(!(B.defects || []).length, 'لعبة بلا شخصية (الروبوتات): لا عيوب'); }
console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
