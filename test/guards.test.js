// 019: رتب حرّاس القوافل وخطر الطريق المتدرّج: الدفاع بالرتب، قوة العصابة بقدر الغنيمة (القوافل الصغيرة كما هي)، الترقية بالخدمة أو الدفع، الأجر، التقدير، الحفظ القديم والمفتاحان
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
const { GUARDS, GR } = E;
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; return S; };
const tick = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
const old = car => (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
assert.deepEqual(GR.def, [1.5, 2.5, 4]); assert.deepEqual(GR.wage, [1, 1.5, 2.5]); assert.deepEqual([GR.V0, GR.k, GR.cap], [5000, 0.15, 1.6]);
// ١) الدفاع بالرتب
{ const S = mk(), car = S.player.caravans[0]; car.guards = 4; car.morale = 100; assert.equal(E.defenseOf(car), old(car), 'بلا رتب كما هو'); car.gr = { v: 1, c: 0, svc: 0 }; assert.ok(Math.abs(E.defenseOf(car) - (old(car) + 1.0)) < 1e-9, 'متمرّس +1.0 عن العادي');
  car.gr = { v: 1, c: 1, svc: 0 }; assert.ok(Math.abs(E.defenseOf(car) - (old(car) + 1.0 + 2.5)) < 1e-9, 'رئيس الحرس +2.5 عن العادي'); car.gr = { v: 0, c: 1, svc: 0 }; car.morale = 80; assert.ok(Math.abs(E.defenseOf(car) - (E.guardPower(car) + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * 0.9) < 1e-9, 'رئيس الحرس يرفع المعنويات الفعلية +10');
  car.gr = { v: 9, c: 9, svc: 0 }; const r = E.gRanks(car); assert.equal(r.p + r.v + r.c, 4, 'لا رتب فوق عدد الحراس'); assert.ok(r.c === 4 && r.v === 0, 'التقليم');
  GUARDS.ranks = false; try { car.gr = { v: 2, c: 1, svc: 0 }; assert.equal(E.defenseOf(car), old(car), 'مفتاح الرتب مطفأ: الدفاع القديم حرفياً'); } finally { GUARDS.ranks = true; } ok('الدفاع: 1.5 / 2.5 / 4 ومعنويات رئيس الحرس +10، والمفتاح مطفأً يعيد القديم'); }
// ٢) قوة العصابة بقدر الغنيمة
{ const S = mk(), car = S.player.caravans[0]; const sc = v => { car.cargo = { wheat: v / E.mid('wheat') }; car.herd = {}; return E.banditScale(car); };
  assert.equal(sc(0), 1); assert.equal(sc(5000), 1, '≤ 5000 بلا تغيير'); assert.ok(Math.abs(sc(10000) - 1.15) < 1e-6); assert.ok(Math.abs(sc(40000) - 1.45) < 1e-6); assert.equal(sc(80000), 1.6); assert.equal(sc(1e8), 1.6, 'سقف 1.6');
  GUARDS.scale = false; try { assert.equal(sc(1e6), 1, 'المفتاح مطفأ'); } finally { GUARDS.scale = true; } ok('B ×1 للقافلة الصغيرة، ×1.15 عند 10 آلاف، ×1.45 عند 40 ألفاً، سقف ×1.6 عند 80 ألفاً'); }
// ٣) الترقية بالخدمة أو بالدفع، ورئيس واحد، وأجر الرتب
{ const S = mk(), car = S.player.caravans[0]; S.player.gold = 5000; car.guards = 3; car.left = 0; assert.equal(A.promoteGuard(S, car.id, 'chief').ok, false, 'لا رئيس بلا متمرّس'); const g0 = S.player.gold; let r = A.promoteGuard(S, car.id, 'vet'); assert.ok(r.ok, r.msg); assert.equal(g0 - S.player.gold, 500, 'بالدفع 500'); assert.equal(E.gRanks(car).v, 1);
  r = A.promoteGuard(S, car.id, 'chief'); assert.ok(r.ok && S.player.gold === g0 - 500 - 1500, 'رئيس بالدفع 1500'); assert.deepEqual([E.gRanks(car).c, E.gRanks(car).v, E.gRanks(car).p], [1, 0, 2]); assert.equal(A.promoteGuard(S, car.id, 'vet').ok && A.promoteGuard(S, car.id, 'chief').ok, false, 'رئيس حرس واحد');
  const S2 = mk(), c2 = S2.player.caravans[0]; S2.player.gold = 100; c2.guards = 2; c2.left = 0; assert.equal(A.promoteGuard(S2, c2.id, 'vet').ok, false, 'لا يكفي الرصيد'); for (let i = 0; i < 5; i++) E.guardServed(c2); assert.equal(A.promoteGuard(S2, c2.id, 'vet').ok, false, '5 رحلات لا تكفي'); E.guardServed(c2); const gg = S2.player.gold; assert.ok(A.promoteGuard(S2, c2.id, 'vet').ok && S2.player.gold === gg, 'بعد 6 رحلات مجاناً'); assert.equal(c2.gr.svc, 0, 'تُصفَّر الخدمة بالترقية');
  for (let i = 0; i < 11; i++) E.guardServed(c2); assert.equal(A.promoteGuard(S2, c2.id, 'chief').ok, false, '11 لا تكفي للرئيس'); E.guardServed(c2); assert.ok(A.promoteGuard(S2, c2.id, 'chief').ok && S2.player.gold === gg, 'بعد 12 مجاناً'); E.guardDefeat(c2); assert.equal(c2.gr.svc, 0, 'الهزيمة تصفّر');
  car.left = 3; assert.equal(A.promoteGuard(S, car.id, 'vet').ok, false, 'لا ترقية في الطريق'); ok('الترقية: بالدفع (500 ثم 1500) أو بخدمة 6 ثم 12 رحلة بلا هزيمة، ورئيس واحد، والهزيمة تصفّر'); }
{ const S = mk(), car = S.player.caravans[0]; car.guards = 4; const base = E.guardWageUnits(car); assert.equal(base, 4); car.gr = { v: 1, c: 1, svc: 0 }; assert.equal(E.guardWageUnits(car), 2 * 1 + 1 * 1.5 + 1 * 2.5, 'أجر الرتب ×1 و×1.5 و×2.5');
  GUARDS.ranks = false; try { assert.equal(E.guardWageUnits(car), 4); } finally { GUARDS.ranks = true; } ok('الأجر: ×1 و×1.5 و×2.5 والمفتاح مطفأً يعيد القديم'); }
// ٤) تقدير الطريق للجميع
{ const S = mk(), car = S.player.caravans[0]; car.left = 0; const to = S.order.find(x => x !== car.city); const e0 = E.roadEstimate(S, car, to); assert.ok(e0.attack > 0 && e0.lo === 4 && e0.hi === 16 && e0.secMul === 1, 'قافلة صغيرة: العصابة 4 إلى 16');
  car.cargo = { wheat: 40000 / E.mid('wheat') }; const e1 = E.roadEstimate(S, car, to); assert.ok(Math.abs(e1.hi - 16 * 1.45) < 1e-6 && e1.loss >= e0.loss, 'الكبيرة: عصابة أقوى'); car.guards = 8; car.gr = { v: 6, c: 1, svc: 0 }; car.morale = 100; const e2 = E.roadEstimate(S, car, to); assert.ok(e2.loss < e1.loss && e2.level <= e1.level, 'الحراسة المرقّاة تخفّض الخسارة المتوقعة');
  S.projects = { peak: 1e7, paid: { P20: 2 }, until: {}, pick: { P20: E.projectPickOptions(S, 'P20')[0].v }, done: ['P20'], tier: 3 }; const [a, b] = S.projects.pick.P20.split('|'); car.city = a; const e3 = E.roadEstimate(S, car, b); assert.ok(e3.secMul < 1 && e3.secMul <= 0.9 + 1e-9, 'أثر المحطات (015) ظاهر: ×' + e3.secMul);
  ok('تقدير الطريق: مستوى الخطر والدفاع مقابل العصابة (4–16 للصغيرة، ×1.45 لقافلة 40 ألفاً)، وأثر الأمن والمحطات'); }
// ٥) الحفظ القديم والمفتاحان
{ const S = mk(), car = S.player.caravans[0]; car.guards = 3; const L = E.load(E.save(S)); assert.equal(L.player.caravans[0].gr, undefined, 'حراس قدامى بلا رتب'); assert.equal(E.gRanks(L.player.caravans[0]).p, 3); assert.equal(E.defenseOf(L.player.caravans[0]), E.defenseOf(car));
  car.left = 0; S.player.gold = 5000; A.promoteGuard(S, car.id, 'vet'); const L2 = E.load(E.save(S)); assert.deepEqual(L2.player.caravans[0].gr, car.gr); GUARDS.ranks = false; GUARDS.scale = false; try { tick(L2, 5); } finally { GUARDS.ranks = GUARDS.scale = true; } tick(L2, 5); ok('الحفظ القديم بلا حقل يعمل، والمحفوظ يعود، والتبديل بين المفتاحين لا يفسده'); }
// ٦) القافلة الصغيرة لا تتغير: لعب آلي بلا قيمة كبيرة، المفتاحان مطفآن ومفعّلان ينتجان الذهب نفسه
{ const run = on => { GUARDS.ranks = GUARDS.scale = on; try { const S = mk(5); S.player.gold = 3000; for (let d = 0; d < 40; d++) { E.botMain(S); tick(S); } return [Math.round(S.player.gold), S.player.trips, Math.round(E.valueOf(E.holdings(S.player.caravans[0])))]; } finally { GUARDS.ranks = GUARDS.scale = true; } };
  const off = run(false), on = run(true); assert.deepEqual(on, off, 'قافلة صغيرة: لا فرق'); ok('القافلة الصغيرة بلا أي تغيير (ذهب ورحلات متطابقة بالمفتاحين)'); }
console.log('\nguards: كلها ناجحة');
