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
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
