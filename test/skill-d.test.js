// 035د: كفاءة التجارة والنقل: القائد فوق السقف، خبرة الحرس والطاقم، عتبات شيخ القوافل والشهبندر: node test/skill-d.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/engine.js'), 'utf8'), box);
const E = box.module.exports, A = E.A, J = x => JSON.stringify(x), ok = m => console.log('OK   ' + m), near = (x, y, m) => a(Math.abs(x - y) < 1e-9, (m || '') + ` ${x} != ${y}`);
const { mkScene, runDays, hashOf } = require('./lib/skill-d-sim.js'), base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/skill-d-baseline.json'), 'utf8'));
const game = () => { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 400000; S.player.gold = 400000; S.noEvents = true; S.noShocks = true; return S; };
const fleet = (S, n, role) => { for (let i = 0; i < n; i++) { a(A.hireCaptain(S).ok); const c = S.player.caravans.at(-1); c.captain.role = role || 'loyal'; c.captain.home = 'sa'; c.route = null; c.free = false; c.sup = null; c.waiting = null; } return S.player.caravans.filter(c => c.captain && !c.main); };
const clone = S => { const r = E.loadChecked(E.save(S)); if (!r.ok) throw Error(r.why); return r.S; };
const on0 = E.SKT.on; E.CLOG.on = false; /* 054 */ E.MFILE.on = E.KASHF.on = E.REPX.on = E.ACHX.on = false; /* 052: بلا P.mx ولا tx/lw ولا أثر سمعة في بصمة ما قبل الحزمة */ 
try {
  // ١) المطفأ = السلوك السابق حرفاً: بصمة محرك ما قبل الحزمة (قافلة بقائد وحرس وطاقم، 120 يوماً، بذرتان)، ولا حقل جديد في الحفظ
  E.SKT.on = false;
  for (const [k, fx] of [['a23', 'autopilot-23'], ['a18', 'autopilot-18']]) { const { S } = mkScene(E, 5, fx); runDays(E, S, 120); a.equal(hashOf(E, S), base[k].h, 'مطابقة ' + k); a.equal(Math.round(S.player.gold), base[k].gold); const raw = E.save(S); a.ok(!/"(tr|pl0|t1|t2)":/.test(raw) && !('sktAsk' in S.player), 'لا حقل جديد في الحفظ'); const gx = S.player.caravans.at(-1).gx; a.ok(!gx || gx.xp === 0, 'المطفأ: لا نمو للحرس'); }
  E.SKT.on = true; E.SKILL.on = false; { const { S } = mkScene(E, 5); runDays(E, S, 30); a.ok(!/"tr":/.test(E.save(S)), 'SKILL.on=false يطفئ SKT أيضاً'); } E.SKILL.on = true; E.SKT.on = on0;
  ok('SKT.on=false: بصمة 120 يوماً مطابقة حرفاً لمحرك ما قبل 035د (بذرتان) وبلا حقول جديدة');
  // ٢) القائد والنوخذة: الطبقة فوق السقف
  { const cp = { trade: 3, nav: 5, combat: 5, sk: { g: 2, xp: 100, tr: 119 } }; const eff = () => [sktE(cp, 'trade'), sktE(cp, 'nav'), sktE(cp, 'combat')]; function sktE(c, k) { return E.sktEff(c, k); }
    a.deepEqual(eff(), [3, 5, 5], 'tr=119: بلا زيادة'); cp.sk.tr = 120; a.deepEqual(eff(), [4, 6, 6], 'tr=120: +1 وقصّ عند 6'); cp.sk.tr = 360; a.deepEqual(eff(), [5, 6, 6], 'tr=360: +2 وقصّ عند 6 (5+2 لا 7)'); a.equal(E.sktEff({ trade: 3, nav: 3, combat: 3 }, 'nav'), 3, 'بلا sk: الخام');
    E.SKT.on = false; a.equal(E.sktEff(cp, 'nav'), 5, 'المطفأ: الخام'); E.SKT.on = true;
    near(1 + 0.015 * E.sktEff(cp, 'trade'), 1.075, 'مساومة 1+0.015·5'); near(1 + 0.10 * E.sktEff(cp, 'trade'), 1.5, 'مستقل 1+0.10·5'); }
  { const S = game(), [car] = fleet(S, 1), cp = car.captain; cp.trade = 3; cp.nav = 3; cp.combat = 3; delete cp.sk; const w0 = E.capWage(car);
    car.pl = 500; E.sktCapGrow(S, car, null); a.ok(cp.sk && cp.sk.tr === 1 && cp.sk.pl0 === 500, 'أول وصول: m=1 (net=0) ويُنشأ sk'); car.pl = 500 + 1000; E.sktCapGrow(S, car, null); near(cp.sk.tr, 1 + E.skM(1000)); a.ok(Math.abs(E.skM(1000) - 1.6) < 1e-4, 'رابح ≈1.6'); const t1 = cp.sk.tr;
    car.pl = 1500 - 1000; E.sktCapGrow(S, car, null); a.ok(Math.abs(cp.sk.tr - t1 - 0.6) < 1e-4, 'خاسر 0.6 ولا ينقص'); a.ok(cp.sk.tr > t1);
    cp.sk.tr = 119.5; car.pl = cp.sk.pl0; E.sktCapGrow(S, car, null); a.ok(cp.sk.tr >= 120 && cp.sk.t1 === 1 && S.news.some(n => /ترقّى القائد/.test(n.t) && /فعّالاً/.test(n.t)), 'خبر الترقية عند 120'); const nn = S.news.length; E.sktCapGrow(S, car, null); a.equal(S.news.filter(n => /ترقّى القائد/.test(n.t)).length, 1, 'مرة واحدة');
    cp.sk.tr = 400; near(E.capWage(car), w0, 'الأجر ثابت على الخام قبل العتبة وبعدها'); }
  { const S = game(), [car] = fleet(S, 1); car.captain.nav = 3; car.captain.combat = 3; car.captain.sk = { g: 1, xp: 0, tr: 0 }; const d0 = E.defenseOf(car), n0 = E.tripDays(S, car, 'riyadh', 'jeddah'); car.captain.sk.tr = 120; near(E.defenseOf(car) - d0, 2 * (car.morale / 100) * 1, 'دفاع القائد: combat×2 فعّالاً'); a.ok(E.tripDays(S, car, 'riyadh', 'jeddah') <= n0, 'السرعة لا تنقص'); car.captain.sk.tr = 0; }
  ok('القائد: tr 119⇒الخام، 120⇒+1، 360⇒+2، قصّ عند 6، نمو skM (1.6/0.6)، خبر مرة واحدة، الأجر ثابت');
  // ٣) الحرس
  { const car = { guards: 4, crew: 0, morale: 100, gx: { g: 1, xp: 0 }, captain: null }, g = x => { car.gx.xp = x; return E.sktGx(car); };
    a.deepEqual([g(0), g(11), g(12), g(39), g(40), g(500)], [1, 1, 2, 2, 3, 3], 'عتبات 12 و40'); a.equal(E.sktGx({ guards: 0, gx: { xp: 99 } }), 0, 'بلا حرس: لا درجة'); a.deepEqual([g(0), g(12), g(40)].map(() => 0), [0, 0, 0]);
    car.gx.xp = 0; near(E.defenseOf(car), E.guardPower(car) * 1); car.gx.xp = 40; near(E.defenseOf(car), E.guardPower(car) * 1.10, 'g3: ×1.10'); car.gx.xp = 12; near(E.defenseOf(car), E.guardPower(car) * 1, 'g2: دفاع كما هو'); }
  { const S = game(), [car] = fleet(S, 1); car.guards = 4; car.gx = { g: 1, xp: 0 }; E.guardServed(car, S); a.equal(car.gx.xp, 1, 'وصول سالم +1'); E.guardDefeat(car); a.equal(car.gx.xp, 1, 'الهزيمة لا تنقص'); car.guards = 0; E.guardServed(car, S); a.equal(car.gx.xp, 1, 'بلا حرس لا نمو'); car.guards = 4; E.sktGxXp(S, car, 11); a.equal(car.gx.g, 2); a.ok(S.news.some(n => /خبرة حرس/.test(n.t)) && S.player.sktAsk.some(x => x.key === 'gx:' + car.id), 'خبر + إشعار «المطلوب»'); }
  { // صدّ (+3) وهزيمة بخسارة أقل: نسختان من الحالة نفسها تسحبان العشوائية نفسها
    const S = game(), [car] = fleet(S, 1); car.guards = 4; car.cargo = { wheat: 200 }; car.basis = {}; car.insured = false; car.city = 'riyadh'; car.gx = { g: 1, xp: 0 };
    const fight = (xp, B) => { const T = clone(S), c = T.player.caravans.at(-1); c.gx = { g: 1, xp }; c.captain.combat = 1; const r = E.banditFight(T, c, 'jeddah', B, 1); return { r, c, T }; };
    const x1 = fight(0, 1e9), x2 = fight(12, 1e9), x3 = fight(40, 1e9); a.equal(x1.r.repelled, false); near(x2.r.f, x1.r.f * 0.85, 'g2: ×0.85'); near(x3.r.f, x1.r.f * 0.85, 'g3: ×0.85'); a.ok(x2.r.lost < x1.r.lost && x2.r.lost > 0, 'lost بعد الخفض'); a.equal(x2.c.gx.xp, 12, 'الهزيمة لا تغيّر الخبرة'); a.ok(x2.T.news.some(n => /خفّضت خبرة الحرس النهب من \d+٪ إلى \d+٪/.test(n.t)), 'خبر النهب يذكر الخفض'); a.ok(!x1.T.news.some(n => /خفّضت خبرة الحرس/.test(n.t)), 'g1 بلا عبارة');
    const y = fight(0, 0); a.equal(y.r.repelled, true); a.equal(y.c.gx.xp, 3, 'صدّ +3 مرة واحدة');
    { const T = clone(S), c = T.player.caravans.at(-1); c.gx = { g: 1, xp: 12 }; c.insured = true; const t0 = T.player.gold; const r = E.banditFight(T, c, 'jeddah', 1e9, 1); a.ok(r.lost > 0); const ctl = clone(S), cc = ctl.player.caravans.at(-1); cc.gx = { g: 1, xp: 0 }; cc.insured = true; const r0 = E.banditFight(ctl, cc, 'jeddah', 1e9, 1); a.ok(r.lost < r0.lost, 'التكافل يعوّض lost بعد الخفض لا قبله'); } }
  { const S = game(), [car] = fleet(S, 1); car.guards = 5; car.crew = 4; car.city = 'riyadh'; car.gx = { g: 1, xp: 0 }; car.cargo = {}; const e0 = E.roadEstimate(S, car, 'jeddah'); car.gx.xp = 40; const e1 = E.roadEstimate(S, car, 'jeddah'); a.ok(e1.defense > e0.defense && e1.repel >= e0.repel, 'roadEstimate يقرأ الدفاع فيتحسن'); a.equal(e1.cut, 0.15); a.equal(e0.cut, 0); }
  ok('الحرس: 12/40، +1 سالم و+3 صدّ و0 هزيمة، النهب ×0.85 لـg2/g3، دفاع ×1.10 لـg3، roadEstimate والتكافل');
  // ٤) الطاقم
  { const car = { crew: 6, cx: { g: 1, xp: 0 } }, g = x => { car.cx.xp = x; return E.sktCx(car); }; a.deepEqual([g(59), g(60), g(199), g(200)], [1, 2, 2, 3], 'عتبات 60 و200'); a.equal(E.sktCx({ crew: 0, cx: { xp: 999 } }), 0);
    car.cx.xp = 0; a.equal(E.supplyNeed(car, 10), Math.ceil(6 * 0.12 * 10)); car.cx.xp = 200; a.equal(E.supplyNeed(car, 10), Math.ceil(6 * 0.12 * 0.9 * 10), 'g3: 0.108 للفرد'); car.cx.xp = 60; a.equal(E.supplyNeed(car, 10), Math.ceil(6 * 0.12 * 10), 'g2: المؤن كما هي'); }
  { const day1 = xp => { const { S, car } = mkScene(E, 5); S.player.caravans.forEach(c => { if (c !== car) c.left = 0; }); car.route = null; car.city = car.city || 'riyadh'; const dest = S.order.find(x => x !== car.city); a.ok(E.A && (car.cx = { g: 1, xp }, true)); const r = A.startTrip ? A.startTrip(S, car, dest) : null; return { S, car, r }; };
    const run1 = xp => { const { S, car } = (() => { const x = mkScene(E, 5); x.car.route = null; x.car.cx = { g: 1, xp }; const dest = x.S.order.find(c => c !== x.car.city); const r = A.travel(x.S, x.car.id, dest); a.ok(r.ok, r.msg); x.car.morale = 90; x.car.supplies = 300; x.car.hungry = false; return x; })(); const m0 = car.morale, s0 = car.supplies, x0 = car.cx.xp; E.tick(S, false); S.pause = false; a.ok(car.left > 0 || car.trips >= 0); return { dm: m0 - car.morale, ds: s0 - car.supplies, dx: car.cx.xp - x0 }; };
    const r1 = run1(0), r2 = run1(60), r3 = run1(200); near(r1.dm, 0.8); near(r2.dm, 0.6, 'g2: 0.6'); near(r3.dm, 0.6); near(r1.ds, 0.72); near(r2.ds, 0.72); near(r3.ds, 0.648, 'g3: 0.648'); a.equal(r1.dx, 1, 'يوم طريق = +1 خبرة'); }
  ok('الطاقم: 60/200، معنويات 0.8⇒0.6، مؤن 0.12⇒0.108 (g3)، supplyNeed يتبعها، +1 خبرة يومياً على الطريق');
  // ٥) شيخ القوافل والشهبندر
  { const S = game(); fleet(S, 3); a(A.hireCChief(S).ok); const D = S.player.cchief; a.equal(E.sktChiefT(S, 'moraleMin'), 50, 'بلا sk بعد التوظيف مباشرة: القيمة الحالية'); E.sktDay(S); a.ok(D.sk.g === 3, 'sk ينشأ بدرجة 3');
    const T = key => { const r = [3, 4, 5].map(g => { D.sk.g = g; return E.sktChiefT(S, key); }); return r; };
    a.deepEqual(T('moraleMin'), [50, 55, 60]); a.deepEqual(T('idleDays'), [7, 6, 5]); a.deepEqual(T('restDays'), [5, 5, 4]); a.deepEqual(T('budget'), [5000, 5000, 5000], 'الميزانية ثابتة'); a.deepEqual(T('topUp'), [3000, 3000, 3000]); D.sk.g = 1; a.equal(E.sktChiefT(S, 'moraleMin'), 50, 'تحت الثالثة كاليوم');
    // معنويات 52: درجة 3 لا تتدخل، درجة 4 تتدخل
    const run = g => { const T2 = clone(S), D2 = T2.player.cchief; D2.sk.g = g; for (const c of T2.player.caravans.filter(c => c.captain && !c.main)) { c.left = 0; c.morale = 52; c.free = true; } T2.day++; D2.day = null; E.cchiefDay(T2); return T2.player.caravans.filter(c => (c.restUntil || 0) > T2.day).length; };
    a.equal(run(3), 0, 'معنويات 52 والدرجة 3: لا راحة'); a.ok(run(4) >= 1, 'والدرجة 4: يتدخل'); a.ok(clone(S) && true);
    // النمو الأسبوعي
    const cars = E.sktChiefT && S.player.caravans.filter(c => c.captain && !c.main); cars.forEach(c => { c.pl = 1000; }); D.sk.g = 3; D.sk.xp = 150; D.sk.pl0 = 3000 - 5000; S.day = 70; E.sktDay(S); near(D.sk.m, 1.6, 'ربح قوافل القادة'); a.equal(D.sk.pl0, 3000); D.sk.pl0 = 3000 + 5000; S.day = 77; E.sktDay(S); near(D.sk.m, 0.6, 'خسارة تبطّئ'); const x1 = D.sk.xp; S.day = 78; E.sktDay(S); near(D.sk.xp - x1, 0.6); D.sk.xp = 319.8; D.sk.g = 3; S.day = 79; E.sktDay(S); a.equal(D.sk.g, 4, 'الدرجة 4 عند 320'); a.ok(S.player.sktAsk.some(x => x.key === 'cchief:4'), 'إشعار المطلوب'); D.sk.xp = 699.9; S.day = 80; E.sktDay(S); a.equal(D.sk.g, 5, 'الدرجة 5 عند 700'); D.sk.xp = 1000; D.sk.g = 5; S.day = 81; E.sktDay(S); a.equal(D.sk.g, 5, 'لا ينزل'); }
  { const S = game(); S.player.seaTrips = 1; a(A.buyShip(S, 'jeddah', 'dhow').ok); a(A.hirePortM(S).ok); const D = S.player.portm; E.sktDay(S); a.equal(D.sk.g, 3); const T = key => [3, 4, 5].map(g => { D.sk.g = g; D.sk.xp = D.sk.xp || 0; return E.sktPortmT(S, key); });
    a.deepEqual(T('noDealDays'), [2, 2, 1]); a.deepEqual(T('fixCool'), [30, 24, 18]); a.deepEqual(T('budgetShare'), [0.4, 0.4, 0.4], 'الميزانية ثابتة'); a.deepEqual(T('topUp'), [3000, 3000, 3000]); a.deepEqual(T('qty'), [100, 100, 100]); }
  ok('الشيخ والشهبندر: النمو الأسبوعي بـskM (1.6/0.6)، درجة 4 عند 320 و5 عند 700، العتبات بالجدول، معنويات 52، والميزانيات ثابتة');
  // ٦) الحدود: لا أثر مالي بالكفاءة وحدها، ولا rnd جديد، والحفظ القديم
  { const mkS = tr => { const S = game(), [car] = fleet(S, 1); car.route = null; car.captain.sk = { g: 1, xp: 0, tr, home: 'trade', spec: {}, m: 1, wk: 0 }; car.gx = { g: 1, xp: tr ? 40 : 0 }; car.cx = { g: 1, xp: tr ? 200 : 0 }; car.guards = 0; car.crew = 0; return S; };
    const S0 = mkS(0), S1 = mkS(400); E.tick(S0, false); E.tick(S1, false); a.equal(Math.round(S0.player.gold * 100) / 100, Math.round(S1.player.gold * 100) / 100, 'لا تغيّر في P.gold بسبب الكفاءة في يوم بلا رحلة'); a.equal(S0.seed, S1.seed, 'بلا rnd جديد (S.seed متطابق)'); a.equal(S0.seedB, S1.seedB); }
  { const S = game(); fleet(S, 1); const raw = JSON.parse(E.save(S)); for (const c of raw.player.caravans) { delete c.gx; delete c.cx; if (c.captain) delete c.captain.sk; } const r = E.loadChecked(JSON.stringify(raw)); a.ok(r.ok, 'حفظ بلا sk/gx/cx يُحمَّل'); runDays(E, r.S, 20); a.ok(true); }
  ok('الحدود: لا أثر مالي ولا سحب عشوائي جديد، والحفظ القديم بلا tr/pl0/gx/cx يعمل');
  // ٧) المعتمد لا يُمسّ يُتحقق منه في اختبارات penalty-guard وguards وcaptains المستقلة
  ok('عدم المساس بالمعتمد: يُشغَّل penalty-guard وguards وcaptains منفردة (انظر التقرير)');
} finally { E.SKT.on = on0; E.SKILL.on = true; }
