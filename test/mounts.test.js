// المراكب المملوكة (جمل يزيد الحمولة، فرس يقصّر الرحلة): node test/mounts.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(3); S.phase = 2; S.player.gold = 20000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0;
const c0 = E.capOfCar(car), d0 = E.tripDays(S, car, 'riyadh', 'shanghai');
let r = A.buyMount(S, car.id, 'camel'); ok(r.ok && S.player.gold === 20000 - 1400, 'شراء جمل أصيل بـ1400');
ok(E.capOfCar(car) === Math.round(c0 * 1.2), 'الحمولة +20٪ (' + c0 + '→' + E.capOfCar(car) + ')');
ok(!A.buyMount(S, car.id, 'horse').ok, 'مركب واحد فقط لكل قافلة');
const g1 = S.player.gold; car.cargo = { wheat: 115 }; ok(!A.sellMount(S, car.id).ok && S.player.gold === g1, 'لا يُباع الجمل إن زادت الحمولة عن السعة بدونه');
car.cargo = {}; r = A.sellMount(S, car.id); ok(r.ok && S.player.gold === g1 + 840 && !car.mount && E.capOfCar(car) === c0, 'بيعه بـ60٪ (840) وتعود السعة');
r = A.buyMount(S, car.id, 'horse'); ok(r.ok && E.tripDays(S, car, 'riyadh', 'shanghai') < d0, 'الفرس يقصّر الرحلة (' + d0 + '→' + E.tripDays(S, car, 'riyadh', 'shanghai') + ')');
const gold0 = S.player.gold; S.noShocks = true; E.tick(S); ok(gold0 - S.player.gold >= 8 - 1e-9 || S.player.gold !== gold0, 'العلف اليومي يُخصم');
const L = E.load(E.save(S)); ok(L.player.caravans[0].mount.kind === 'horse', 'المركب يُحفظ');
car.left = 3; ok(!A.sellMount(S, car.id).ok && !A.buyMount(S, car.id, 'camel').ok, 'لا شراء ولا بيع في الطريق');
const T = E.newGame(4); ok(!A.buyMount(T, T.player.caravans[0].id, 'camel').ok, 'مغلق قبل الطور 2');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
