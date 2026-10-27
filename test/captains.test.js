// أدوار القادة الستة والولاء والراتب (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, learn) { const S = E.newGame(seed); if (learn !== false) { A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 8; S.learn.abroad = true; } S.phase = 2; S.player.gold = 90000; return S; }
function withCap(seed, role, extra) { const S = world(seed); S.noShocks = true; const pool = E.captainPool(S); const i = pool.findIndex(c => c.role === role); let id; if (i >= 0) { A.hireCaptain(S, i); } else { A.hireCaptain(S, 0); } const car = S.player.caravans[1]; car.captain.role = role; if (extra) Object.assign(car.captain, extra); return { S, car }; }
// المجموعة
let S = world(4); const pool = E.captainPool(S); ok(pool.length === 3 && new Set(pool.map(c => c.role)).size === 3, 'ثلاثة مرشحين بأدوار مختلفة');
ok(JSON.stringify(E.captainPool(S)) === JSON.stringify(pool), 'المرشحون ثابتون خلال اليوم'); S.day++; ok(JSON.stringify(E.captainPool(S)) !== JSON.stringify(pool), 'يتغيرون في اليوم التالي'); S.day--;
ok(pool.every(c => c.fee >= 1500 && c.fee <= 2550 && E.ROLES[c.role] && c.trade >= 1 && c.trade <= 3), 'رسوم المرشحين وسماتهم ضمن الحدود');
ok(E.ROLE_KEYS.length === 6, 'ستة أدوار');
const g0 = S.player.gold; let r = A.hireCaptain(S, 1); ok(r.ok && g0 - S.player.gold === pool[1].fee, 'توظيف مرشح برسمه (' + pool[1].fee + ')');
const cp = S.player.caravans[1].captain; ok(cp.role === pool[1].role && cp.loyal === 70 && cp.home === pool[1].home, 'القائد بدوره ووطنه وولاء 70');
ok(A.hireCaptain(S, 7).ok === false, 'مرشح غير موجود');
const L = world(5, false); A.hireCaptain(L); ok(!L.player.caravans[1].captain.role, 'التوظيف القديم بلا دور (معيار الضغط)');
// الخبير: بيع بعلاوة 4٪
function sellTest(role) { const { S, car } = withCap(6, role); const c = S.cities.riyadh; car.city = 'riyadh'; car.left = 0; car.route = { a: 'riyadh', b: 'jeddah', buyA: null, buyB: null }; car.cargo = { perfume: 5 }; car.basis = { perfume: { q: 5, c: 100 } }; const g = S.player.gold; E.tick(S); return S.player.gold - g; }
const gLux = sellTest('lux'), gPlain = sellTest('envoy'); ok(gLux > gPlain && gLux / gPlain < 1.1, 'خبير السلع الثمينة يبيع بعلاوة (' + Math.round(gLux) + ' مقابل ' + Math.round(gPlain) + ')');
// ابن البلد: جمارك أقل عند دخول بلده
function customsTest(role, home) { const { S, car } = withCap(7, role, { home }); car.city = 'riyadh'; car.left = 0; car.cargo = { silk: 40 }; car.basis = { silk: { q: 40, c: 4000 } }; S.risk['cairo|riyadh'] = 0; A.travel(S, car.id, 'cairo'); for (let i = 0; i < 20 && car.left >= 0 && !(car.city === 'cairo' && car.left === 0); i++) E.tick(S); return S.player.led.exp.customs || 0; }
const cN = customsTest('native', 'eg'), cP = customsTest('envoy', 'eg'); ok(cP > 0 && Math.abs(cN / cP - 0.7) < 0.05, 'ابن البلد: جمارك أقل 30٪ (' + Math.round(cN) + ' مقابل ' + Math.round(cP) + ')');
const cO = customsTest('native', 'in'); ok(Math.abs(cO / cP - 1) < 0.05, 'في غير بلده: جمارك عادية');
// الرسول: ثقة الزعيم
{ const { S, car } = withCap(8, 'envoy'); car.city = 'riyadh'; car.left = 0; S.risk['cairo|riyadh'] = 0; const t0 = S.bosses.cairo.trust; A.travel(S, car.id, 'cairo'); for (let i = 0; i < 20 && !(car.city === 'cairo' && car.left === 0); i++) E.tick(S); ok(S.bosses.cairo.trust >= t0 + 1.4, 'رسول الزعماء يرفع ثقة زعيم المدينة (' + t0.toFixed(1) + '→' + S.bosses.cairo.trust.toFixed(1) + ')'); }
// المستقل: يسافر وحده
{ const { S, car } = withCap(9, 'indep'); car.route = null; car.city = 'riyadh'; car.left = 0; let moved = false; for (let i = 0; i < 12; i++) { E.tick(S); if (car.left > 0 || car.trips > 0) { moved = true; break; } } ok(moved, 'القائد المستقل يبدأ رحلة وحده بلا مسار'); }
// العيون: تنبيه
{ const { S, car } = withCap(10, 'eyes'); S.player.caravans[0].cargo = { silk: 20 }; const c = S.cities.jeddah; c.stock.silk = 0; c.idx.silk = 1.25; for (let i = 0; i < 3; i++) E.tick(S); ok(S.news.some(n => n.k === 'alert' && /عيون الأسواق/.test(n.t)), 'عيون الأسواق تنبّه بسعر صاعد لبضاعة معك'); }
{ const { S } = withCap(11, 'eyes'); S.bosses.cairo.trust = -40; for (let i = 0; i < 2; i++) E.tick(S); ok(S.news.some(n => n.k === 'alert' && /غاضب/.test(n.t)), 'وتنبّه بغضب الزعيم'); }
// الأجر والولاء
{ const { S, car } = withCap(12, 'loyal'); ok(E.capWage(car) < (4 + 2 * (car.captain.trade + car.captain.nav + car.captain.combat) / 3), 'الوفيّ أجره أقل'); }
{ const { S, car } = withCap(13, 'envoy'); const l0 = car.captain.loyal; for (let i = 0; i < 10; i++) E.tick(S); ok(car.captain.loyal > l0, 'الأجر في موعده يزيد الولاء (' + l0 + '→' + car.captain.loyal.toFixed(1) + ')'); }
{ const { S, car } = withCap(14, 'envoy'); const l0 = car.captain.loyal; for (let i = 0; i < 5; i++) { S.player.gold = 0; S.player.wallet.sar = 0; E.tick(S); } ok(car.captain.loyal < l0 - 8, 'الأجر المتأخر يهدم الولاء (' + car.captain.loyal.toFixed(1) + ')'); }
{ const { S, car } = withCap(15, 'envoy'); car.captain.loyal = 26; for (let i = 0; i < 4; i++) { S.player.gold = 0; S.player.wallet.sar = 0; E.tick(S); } ok(!car.captain, 'تحت 25 يترك العمل'); }
{ const { S, car } = withCap(16, 'envoy'); const w0 = E.capWage(car), l0 = car.captain.loyal; let r = A.raiseCaptain(S, car.id); ok(r.ok && E.capWage(car) > w0 * 1.1 && car.captain.loyal >= l0 + 11, 'العلاوة ترفع الأجر والولاء'); ok(A.raiseCaptain(S, car.id).ok === false, 'علاوة ثانية قريبة مرفوضة'); S.day += 25; A.raiseCaptain(S, car.id); S.day += 25; A.raiseCaptain(S, car.id); S.day += 25; A.raiseCaptain(S, car.id); S.day += 25; r = A.raiseCaptain(S, car.id); ok(r.ok === false && car.captain.raise <= 0.6 + 1e-9, 'حدّ أقصى للعلاوة 60٪'); }
// الحفظ والضغط
{ const { S } = withCap(17, 'indep'); const Z = E.load(E.save(S)); ok(Z && Z.player.caravans[1].captain.role === 'indep' && Z.player.caravans[1].captain.loyal === 70, 'الأدوار تُحفظ'); }
const st = E.stressTest({ seeds: 6, days: 80, bot: true }); ok(st.nan === 0 && st.summary.avgPlayerNW > 6000 && st.summary.avgPlayerNW < 16000, 'الضغط سليم');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
