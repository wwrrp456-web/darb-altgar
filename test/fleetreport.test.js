// تقرير الأسطول (محرك): node test/fleetreport.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 2; S.player.gold = 90000;
ok(E.fleetReport(S).length === 0, 'بلا قادة: التقرير فارغ');
ok(A.hireCaptain(S, 0).ok, 'توظيف قائد'); const car = S.player.caravans[1];
let r = E.fleetReport(S)[0]; ok(r.name === car.name && /واقف|يستعد/.test(r.status), 'الحالة بلا مسار: ' + r.status);
ok(r.lines.some(l => !l.ok && /بلا مسار/.test(l.t)) || car.captain.role === 'indep', 'تنبيه «بلا مسار» (إلا للمستقل)');
car.captain.role = 'loyal'; car.route = { a: 'jeddah', b: 'riyadh', buyA: 'dates', buyB: 'coffee' };
r = E.fleetReport(S)[0]; ok(!r.lines.some(l => /بلا مسار/.test(l.t)), 'مع مسار: لا تنبيه');
car.waiting = 'لا صفقة مجزية الآن'; r = E.fleetReport(S)[0]; ok(/غيّر سلعته/.test(r.status) && r.ok === false, 'سبب التعطل بلغة بسيطة مع الإصلاح');
car.waiting = null; car.left = 4; car.dest = 'riyadh'; r = E.fleetReport(S)[0]; ok(/في الطريق إلى/.test(r.status) && /باقٍ 4/.test(r.status), 'في الطريق: الوجهة والأيام');
car.left = 0; car.trips = 3; car.pl = 420; r = E.fleetReport(S)[0]; ok(r.trips === 3 && r.pl === 420 && r.lines.some(l => l.ok && /3 رحلة/.test(l.t)), 'الربح والرحلات: ' + r.lines.map(l => l.t).join(' | '));
car.pl = -80; r = E.fleetReport(S)[0]; ok(r.lines.some(l => !l.ok && /خسارة/.test(l.t)), 'الخسارة تُنبَّه');
car.captain.loyal = 20; r = E.fleetReport(S)[0]; ok(r.lines.some(l => /يترك العمل/.test(l.t)), 'ولاء تحت 25: يوشك أن يترك');
car.cargo = { silk: 200 }; car.guards = 0; car.insured = false; r = E.fleetReport(S)[0]; ok(r.lines.some(l => /بلا حرّاس/.test(l.t)), 'حمولة غالية بلا حرّاس ولا تكافل');
// تتبّع الربح فعلاً عبر أيام اللعب
{ const S2 = E.newGame(9); A.learnSetChar(S2, 'trader'); S2.phase = 2; S2.player.gold = 90000; A.hireCaptain(S2, 0); const c2 = S2.player.caravans[1]; c2.captain.role = 'indep'; for (let i = 0; i < 120; i++) { E.tick(S2); S2.pause = false; } ok(c2.trips > 0 && typeof (c2.pl || 0) === 'number' && !Number.isNaN(c2.pl || 0), 'القائد المستقل يتاجر ويتراكم ربحه (' + c2.trips + ' رحلة، ربح ' + Math.round(c2.pl || 0) + ')'); }
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
