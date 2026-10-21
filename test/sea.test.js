// السفر البحري: الموانئ والسفن والرياح الموسمية والعواصف والقراصنة (محرك فقط): node test/sea.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, city) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.phase = 3; S.player.gold = 60000; const car = S.player.caravans[0]; car.city = city || 'jeddah'; car.left = 0; return { S, car }; };
let { S, car } = mk(4);
ok(E.PORTS.length === 7 && !E.PORTS.some(p => ['isfahan', 'shiraz', 'tabriz', 'riyadh', 'xian'].includes(p)), 'سبعة موانئ ولا ميناء لفارس');
// الفتح والشروط
{ const t = mk(4); t.S.phase = 2; ok(!A.buyShip(t.S, 'jeddah').ok, 'لا سفن قبل الطور ٣'); }
ok(!A.buyShip(S, 'riyadh').ok && /الموانئ/.test(A.buyShip(S, 'riyadh').msg), 'الشراء في الموانئ فقط');
let p = E.seaPlan(S, car, 'mumbai'); ok(!p.ok && p.needShip, 'لا إبحار بلا سفينة راسية: ' + p.msg);
const g0 = S.player.gold; ok(A.buyShip(S, 'jeddah').ok && g0 - S.player.gold > 3000, 'شراء سنبوق في جدة بنحو ٣٢٠٠');
ok(!A.buyShip(S, 'jeddah').ok, 'سفينة واحدة في الميناء الواحد');
ok(!E.seaPlan(S, car, 'riyadh').ok && !E.seaPlan(S, car, 'jeddah').ok, 'لا إبحار إلى مدينة داخلية ولا إلى الميناء نفسه');
// المدة والموسم
S.day = 0; const fair = E.seaPlan(S, car, 'mumbai'); S.day = 200; const off = E.seaPlan(S, car, 'mumbai'); S.day = 0;
ok(fair.ok && off.ok && off.days > fair.days && off.risk > fair.risk && fair.monsoon.fair && !off.monsoon.fair, 'الموسم المخالف أبطأ وأخطر (' + fair.days + ' ← ' + off.days + ' أيام)');
ok(fair.days <= E.tripDays(S, car, 'jeddah', 'mumbai'), 'البحر في الموسم لا يتأخر عن البر (' + fair.days + ' مقابل ' + E.tripDays(S, car, 'jeddah', 'mumbai') + ')');
S.day = 200; const back = E.seaPlan(S, { ...car, city: 'mumbai' }, 'jeddah'); S.day = 0; // نصف السنة الثاني: العودة غرباً موسمها
{ const t = mk(4, 'mumbai'); t.S.day = 200; A.buyShip(t.S, 'mumbai'); ok(E.seaPlan(t.S, t.car, 'jeddah').monsoon.fair === true, 'العودة من الهند في النصف الثاني في موسمها'); }
ok(E.monsoonOf(S, 'jeddah', 'jazan').dir === 'calm', 'داخل البحر الواحد لا رياح موسمية');
// السعة والقطيع
car.cargo.wheat = 300; ok(!E.seaPlan(S, car, 'mumbai').ok && /تزيد على سعة السفينة/.test(E.seaPlan(S, car, 'mumbai').msg), 'الحمولة الزائدة على سعة السفينة تمنع الإبحار');
car.cargo.wheat = 80;
// الإبحار والوصول
const gold1 = S.player.gold, plan = E.seaPlan(S, car, 'mumbai'), r = A.sail(S, car.id, 'mumbai');
ok(r.ok && car.left === plan.days && car.sea && car.dest === 'mumbai' && E.shipAt(S, 'jeddah') === null, 'الإبحار: السفينة في البحر والقافلة تقصد مومباي');
ok(gold1 - S.player.gold >= plan.fee + 1, 'دُفع رسم الميناء والمؤن (' + Math.round(gold1 - S.player.gold) + ')');
ok(!A.sail(S, car.id, 'kolkata').ok, 'لا إبحار والقافلة في الطريق');
for (let i = 0; i < 20 && car.left > 0; i++) E.tick(S);
ok(car.city === 'mumbai' && car.sea === null && E.shipAt(S, 'mumbai') && !E.shipAt(S, 'jeddah'), 'الوصول: ترسو السفينة في مومباي (' + car.city + ')');
// الأحداث البحرية عبر بذور كثيرة
const seen = { fair: 0, storm: 0, pirates: 0 }; let pirateOutcome = null, stormOk = true;
for (let seed = 1; seed <= 260; seed++) {
  const t = mk(seed); A.buyShip(t.S, 'jeddah'); t.car.cargo.wheat = 100; const w0 = t.car.cargo.wheat;
  if (!A.sail(t.S, t.car.id, 'mumbai').ok) continue; t.S.pause = false; t.S.seaRes = null;
  for (let i = 0; i < 20 && t.car.left > 0; i++) E.tick(t.S);
  if (t.S.road && t.S.road.k === 'pirates') { seen.pirates++; if (!pirateOutcome) { const o = A.roadChoose(t.S, 'pay'); pirateOutcome = o; } }
  else if (t.S.seaRes && t.S.seaRes.k === 'storm') { seen.storm++; const f = 1 - t.car.cargo.wheat / w0; if (!(f > 0 && f <= 0.21)) stormOk = false; }
  else seen.fair++;
}
ok(seen.fair > 100 && seen.storm > 3 && seen.pirates > 3, 'تظهر الرحلة الآمنة والعاصفة والقراصنة (' + JSON.stringify(seen) + ')');
ok(stormOk, 'العاصفة تُلقي من ٢٪ إلى ٢٠٪ فقط من الحمولة');
ok(pirateOutcome && pirateOutcome.sea === true && /القراصنة|السفينة/.test(pirateOutcome.msg), 'القراصنة: النتيجة بلغة البحر (' + (pirateOutcome && pirateOutcome.msg) + ')');
// البيع والحفظ
{ const t = mk(6); A.buyShip(t.S, 'jeddah'); const id = t.S.player.ships[0].id, b = t.S.player.gold; const rs = A.sellShip(t.S, id); ok(rs.ok && t.S.player.gold - b > 2000 && t.S.player.ships.length === 0, 'بيع السفينة يُرجع ٧٠٪');
  A.buyShip(t.S, 'jazan'); const L = E.load(E.save(t.S)); ok(L.player.ships.length === 1 && L.player.ships[0].city === 'jazan', 'السفن تُحفظ وتُستعاد');
  const o = JSON.parse(E.save(t.S)); delete o.player.ships; ok(Array.isArray(E.load(JSON.stringify(o)).player.ships), 'حفظ قديم بلا سفن يُرحَّل'); }

// ===== المرحلة ٢: أنواع السفن والترقية والطاقم والقادة والتأمين =====
{
  const t = mk(31); const S2 = t.S, c2 = t.car; A.buyShip(S2, 'jeddah'); const sh = S2.player.ships[0];
  ok(E.SHIPS.baghla.cap > E.SHIPS.dhow.cap && E.SHIPS.boom.cap > E.SHIPS.baghla.cap && E.SHIPS.boom.cost > E.SHIPS.baghla.cost, 'ثلاثة أنواع بسعة وسعر متصاعدين');
  ok(!A.buyShip(S2, 'jazan', 'baghla').ok && /رحلات بحرية/.test(A.buyShip(S2, 'jazan', 'baghla').msg), 'البغلة مقفلة قبل ٣ رحلات بحرية');
  S2.player.seaTrips = 3; ok(A.buyShip(S2, 'jazan', 'baghla').ok && S2.player.ships.length === 2, 'تُفتح البغلة بعد ٣ رحلات');
  ok(!A.buyShip(S2, 'alex', 'boom').ok, 'البوم مقفل قبل ١٠ رحلات'); S2.player.seaTrips = 10; ok(A.buyShip(S2, 'alex', 'boom').ok, 'ويُفتح بعد ١٠');
  // الترقية
  S2.day = 0; const d0 = E.seaPlan(S2, c2, 'guangzhou').days; const g0 = S2.player.gold;
  ok(A.upgradeShip(S2, sh.id, 'sail').ok && A.upgradeShip(S2, sh.id, 'sail').ok && !A.upgradeShip(S2, sh.id, 'sail').ok, 'أشرعة أخف مستويان فقط'); ok(g0 - S2.player.gold > 1000, 'للترقية كلفة');
  const d2 = E.seaPlan(S2, c2, 'guangzhou').days; ok(d2 <= d0, 'الأشرعة الأخف لا تُبطئ (' + d0 + '←' + d2 + ')');
  ok(A.upgradeShip(S2, sh.id, 'hull').ok && E.shipUp(S2.player.ships[0], 'hull') === 1, 'تقوية الهيكل');
  // الطاقم
  const ex0 = E.seaExtra(S2, 'jeddah'); ok(A.hireSailor(S2, sh.id).ok && A.hireSailor(S2, sh.id).ok && A.hireSailor(S2, sh.id).ok && !A.hireSailor(S2, sh.id).ok, 'بحّارة حتى سعة السنبوق (٣)');
  ok(E.seaExtra(S2, 'jeddah') > ex0, 'الطاقم يرفع دفاع السفينة'); ok(A.dismissSailor(S2, sh.id).ok && E.shipCrew(S2.player.ships[0]) === 2, 'تسريح بحّار');
  // القائد البحري
  const pool = E.seaCaptainPool(S2); ok(pool.length === 3 && new Set(pool.map(p => p.role)).size === 3 && pool.every(p => E.SEA_ROLES[p.role]), 'ثلاثة مرشحين بأدوار مختلفة');
  const bold = pool.find(p => p.role === 'bold'); const before = E.seaExtra(S2, 'jeddah'); S2.player.gold = 90000;
  ok(A.hireSeaCaptain(S2, sh.id, pool.indexOf(bold)).ok && !A.hireSeaCaptain(S2, sh.id, 0).ok, 'توظيف قائد واحد للسفينة'); ok(E.seaExtra(S2, 'jeddah') > before, 'القائد الجريء يرفع الدفاع');
  // الأجور اليومية
  const w0 = S2.player.led.exp.wages || 0; for (let i = 0; i < 5; i++) E.tick(S2); const dw = (S2.player.led.exp.wages || 0) - w0; ok(dw > 5 * 8, 'أجور القائد والبحّارة وصيانة السفن تُدفع يومياً (' + Math.round(dw) + ')');
  ok(A.fireSeaCaptain(S2, sh.id).ok && S2.player.ships[0].captain === null, 'تسريح القائد');
  // التأمين
  const t2 = mk(32); A.buyShip(t2.S, 'jeddah'); t2.car.cargo.wheat = 100; t2.car.insured = true; const tk0 = t2.S.tk ? JSON.stringify(t2.S.tk) : ''; const g1 = t2.S.player.gold; A.sail(t2.S, t2.car.id, 'mumbai');
  const t3 = mk(32); A.buyShip(t3.S, 'jeddah'); t3.car.cargo.wheat = 100; const g3 = t3.S.player.gold; A.sail(t3.S, t3.car.id, 'mumbai');
  ok(g1 - t2.S.player.gold > g3 - t3.S.player.gold, 'المؤمَّن يدفع تبرع التكافل البحري زيادة');
  // السرعة بحسب النوع
  { const a = mk(33), b = mk(33); A.buyShip(a.S, 'jeddah'); b.S.player.seaTrips = 10; A.buyShip(b.S, 'jeddah', 'boom'); ok(E.seaPlan(b.S, b.car, 'guangzhou').days <= E.seaPlan(a.S, a.car, 'guangzhou').days, 'البوم أسرع من السنبوق'); }
  // ترحيل سفن المرحلة ١
  { const t4 = mk(34); A.buyShip(t4.S, 'jeddah'); const o = JSON.parse(E.save(t4.S)); delete o.player.ships[0].up; delete o.player.ships[0].crew; delete o.player.ships[0].captain; const L = E.load(JSON.stringify(o)); ok(E.shipUp(L.player.ships[0], 'hull') === 0 && E.shipCrew(L.player.ships[0]) === 0 && E.seaExtra(L, 'jeddah') === 0, 'سفينة المرحلة ١ تعمل بلا حقول جديدة'); }
}

console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
