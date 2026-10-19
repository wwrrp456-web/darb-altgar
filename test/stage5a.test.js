// تحسين الدكان وقوالب المسارات: node test/stage5a.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(21); S.phase = 3; S.player.gold = 90000; S.player.caravans[0].city = 'riyadh'; A.buildShop(S, 'riyadh');
const pr = S.player.props.riyadh, sh = pr.shops[0]; const cap0 = E.shCap(sh);
let r = A.upgradeShop(S, 'riyadh', sh.id, 'shelf'); ok(r.ok && E.shCap(sh) === Math.round(cap0 * 1.25), 'رفوف: سعة +25٪ (' + cap0 + '→' + E.shCap(sh) + ')');
ok(A.upgradeShop(S, 'riyadh', sh.id, 'shelf').ok && E.shUp(sh, 'shelf') === 2 && E.shCap(sh) === Math.round(cap0 * 1.5), 'المستوى الثاني');
ok(!A.upgradeShop(S, 'riyadh', sh.id, 'shelf').ok, 'لا مستوى ثالث'); ok(!A.upgradeShop(S, 'riyadh', sh.id, 'nope').ok, 'بند مجهول');
const g0 = S.player.gold; A.upgradeShop(S, 'riyadh', sh.id, 'awning'); ok(g0 - S.player.gold === 800, 'كلفة المستوى الأول 800');
// المظلة ترفع المبيعات
function sold(up) { const T = E.newGame(22); T.phase = 3; T.noShocks = true; T.player.gold = 90000; T.player.caravans[0].city = 'riyadh'; A.buildShop(T, 'riyadh'); const p = T.player.props.riyadh, s0 = p.shops[0]; s0.up = up; p.staff = p.staff || {}; p.store = { dates: 500 }; s0.items = [{ g: 'dates', price: 1, auto: false, target: 0, buyBelow: 1 }]; let tot = 0; for (let i = 0; i < 10; i++) { E.tick(T); tot += s0.items[0].lastSold || 0; p.store.dates = 500; } return tot; }
const a = sold({}), b = sold({ awning: 2, sign: 2 }); ok(b > a || a === 0, 'المظلة واللافتة ترفعان البيع (' + a.toFixed(1) + '→' + b.toFixed(1) + ')');
const st = E.newGame(23); st.phase = 3; st.player.gold = 90000; A.rentShop(st, 'riyadh', 'stall'); ok(!A.upgradeShop(st, 'riyadh', (st.player.props.riyadh.shops[0] || {}).id, 'shelf').ok, 'لا تحسين للبسطة المؤجرة');
// القوالب
const car = S.player.caravans[0]; car.route = { a: 'riyadh', b: 'jeddah', buyA: 'dates', buyB: 'coffee' };
r = A.saveTemplate(S, car.id, 'تمر وقهوة'); ok(r.ok && S.player.tpl.length === 1 && S.player.tpl[0].name === 'تمر وقهوة', 'حفظ قالب');
const car2 = { id: 77 }; S.player.caravans.push(Object.assign(E.newGame(1).player.caravans[0], { id: 77, name: 'ثانية', main: false })); const c2 = S.player.caravans.find(c => c.id === 77); c2.route = null;
r = A.applyTemplate(S, 77, S.player.tpl[0].id); ok(r.ok && c2.route.a === 'riyadh' && c2.route.buyB === 'coffee', 'تطبيق القالب على قافلة أخرى');
ok(!A.saveTemplate(S, 77 + 1000, 'x').ok, 'قافلة غير موجودة');
for (let i = 0; i < 6; i++) A.saveTemplate(S, car.id, 'ق' + i); ok(S.player.tpl.length === 6 && !A.saveTemplate(S, car.id, 'زائد').ok, 'حد 6 قوالب');
A.delTemplate(S, S.player.tpl[0].id); ok(S.player.tpl.length === 5, 'حذف قالب');
const L = E.load(E.save(S)); ok(L.player.tpl.length === 5 && L.player.props.riyadh.shops[0].up.shelf === 2, 'الحفظ');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
