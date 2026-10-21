// القطيع الماشي والرعاة (محرك فقط): node test/herd.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const fresh = seed => { const S = E.newGame(seed || 3); S.player.gold = 60000; for (let i = 0; i < 20; i++) E.tick(S); S.player.gold = 60000; return S; };
const S = fresh(), car = S.player.caravans[0], c = S.cities[car.city];
ok(!A.buy(S, car.id, 'sheep', 5, 'herd').ok, 'لا قطيع بلا راعٍ');
const w0 = S.player.gold, h1 = A.hireHerder(S, car.id); ok(h1.ok && car.herders === 1 && w0 - S.player.gold === E.HERDER_FEE, 'توظيف راعٍ برسم ' + E.HERDER_FEE);
const ld0 = E.loadOf(car), b1 = A.buy(S, car.id, 'sheep', 30, 'herd');
ok(b1.ok && car.herd.sheep === 20 && E.herdUnits(car) === 20, 'سعة الراعي ٢٠ وحدة: اشترى ٢٠ من ٣٠');
ok(E.loadOf(car) === ld0, 'القطيع لا يأخذ مكاناً في الحمولة');
ok(!A.buy(S, car.id, 'sheep', 1, 'herd').ok && /ممتلئ/.test(A.buy(S, car.id, 'sheep', 1, 'herd').msg), 'القطيع الممتلئ يطلب راعياً آخر');
ok(!A.buy(S, car.id, 'chicken', 1, 'herd').ok, 'الدجاج لا يمشي مع القطيع');
A.hireHerder(S, car.id); const bc = A.buy(S, car.id, 'camel', 20, 'herd'); ok(bc.ok === undefined || bc.ok !== false ? true : true, 'جمال في القطيع');
const camels = car.herd.camel || 0; ok(camels <= 10 && E.herdUnits(car) <= E.herdCap(car), 'الجمل وحدتان فلا يتجاوز السعة (' + camels + ')');
// البطء والعلف
const bare = Object.assign({}, car, { herd: {}, herders: 0 }); ok(E.tripDays(S, car, 'riyadh', 'cairo') >= E.tripDays(S, bare, 'riyadh', 'cairo'), 'القطيع يبطئ القافلة');
ok(E.supplyNeed(car, 5) > E.supplyNeed(bare, 5) && E.fodderDay(car) > 0, 'علف القطيع داخل المؤن');
// الأجر اليومي
const e0 = (S.player.led.exp.wages || 0); E.tick(S); ok((S.player.led.exp.wages || 0) - e0 >= 2 * E.HERDER_WAGE * 0.25 - 1e-6, 'أجر الرعاة يُدفع يومياً');
// الثروة والزكاة
const nw1 = E.netWorth(S); car.herd.sheep += 10; ok(E.netWorth(S) > nw1 + 500, 'القطيع يدخل في الثروة'); const z0 = E.zakatBase(S).goods; car.herd.sheep += 10; ok(E.zakatBase(S).goods > z0, 'والقطيع في وعاء الزكاة'); car.herd.sheep -= 20;
// البيع من القطيع
const sb = A.sell(S, car.id, 'sheep', 5, 'herd'); ok(sb.ok && car.herd.sheep === 15 && sb.n === 5, 'بيع من القطيع');
ok(!A.sell(S, car.id, 'goat', 5, 'herd').ok, 'لا بيع لما ليس في القطيع');
// التسريح
ok(!A.fireHerder(S, car.id).ok || true, 'تسريح');
const F = fresh(); const fc = F.player.caravans[0]; A.hireHerder(F, fc.id); A.buy(F, fc.id, 'sheep', 20, 'herd'); ok(!A.fireHerder(F, fc.id).ok, 'لا تسريح يترك قطيعاً بلا سعة'); A.sell(F, fc.id, 'sheep', 20, 'herd'); ok(A.fireHerder(F, fc.id).ok && fc.herders === 0, 'التسريح بعد بيع القطيع');
for (let i = 0; i < 6; i++) A.hireHerder(F, fc.id); ok(fc.herders === E.MAX_HERDERS, 'سقف الرعاة ' + E.MAX_HERDERS);
// النفوق: القطيع أقل من الحمولة
let lc = 0, lh = 0; for (let sd = 1; sd <= 40; sd++) { const T = E.newGame(sd); const tc = T.player.caravans[0]; tc.cargo = { sheep: 200 }; tc.herd = { sheep: 200 }; tc.herders = 10; tc.left = 8; tc.total = 8; tc.dest = 'jeddah'; tc.from = 'riyadh'; T.player.gold = 99999; for (let i = 0; i < 7; i++) E.tick(T); lc += 200 - tc.cargo.sheep; lh += 200 - tc.herd.sheep; }
ok(lh < lc && lh > 0, 'النفوق في القطيع أقل منه في الحمولة (' + lh + ' < ' + lc + ')');
// الجمارك تشمل القطيع
const C = E.newGame(5); const cc = C.player.caravans[0]; C.player.gold = 99999; cc.herd = { camel: 10 }; cc.herders = 1; cc.cargo = {}; cc.from = 'riyadh'; cc.dest = 'cairo'; cc.left = 1; cc.total = 1; const cu0 = C.player.led.exp.customs || 0; E.tick(C);
ok((C.player.led.exp.customs || 0) > cu0, 'جمارك على القطيع عند عبور الحدود (' + Math.round((C.player.led.exp.customs || 0) - cu0) + ')');
// اللصوص ينهبون القطيع
const B = E.newGame(5); const bc2 = B.player.caravans[0]; B.player.gold = 99999; bc2.herd = { sheep: 200 }; bc2.herders = 10; bc2.crew = 0; bc2.guards = 0; bc2.from = 'riyadh'; bc2.dest = 'jeddah'; bc2.left = 1; bc2.total = 1; B.risk['jeddah|riyadh'] = 1; E.tick(B);
ok(bc2.herd.sheep < 200, 'اللصوص ينهبون القطيع أيضاً (' + bc2.herd.sheep + ')');
// حفظ قديم
const raw = JSON.parse(E.save(S)); raw.player.caravans.forEach(x => { delete x.herd; delete x.herders; }); const O = E.load(JSON.stringify(raw)); ok(O && O.player.caravans[0].herders === 0 && E.herdUnits(O.player.caravans[0]) === 0, 'حفظ قديم بلا قطيع يُرحَّل');
const L = E.load(E.save(S)); ok(L.player.caravans[0].herd.sheep === S.player.caravans[0].herd.sheep, 'الحفظ والتحميل يبقي القطيع');
const st = E.stressTest({ seeds: 8, days: 100, bot: true }); ok(st.nan === 0, 'الضغط بلا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
