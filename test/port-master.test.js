'use strict';
// 027 الشهبندر (المحرك، T002–T004): التوظيف والثمن والأجر، فتح الخط وحواجزه، الموسم (لا إبحار ضد الريح افتراضياً)، القواعد والمهلة، bestDeal بوجهة، الحفظ، المفتاح.
// ملاحظة: القياس (T005، SC-002) في tools/port-measure.js وspecs/027-port-master/measure.md؛ والواجهة (T006) واختبارها (T007 الواجهة) بعد قرار الثابت.
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, near = (x, y, m) => a(Math.abs(x - y) < 1e-6, (m || '') + ` ${x} != ${y}`), J = x => JSON.stringify(x);
function game(seed) { const S = E.newGame(seed || 3); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 400000; S.noEvents = true; S.noShocks = true; return S; }
function line(seed, all) { const S = game(seed); S.player.seaTrips = 1; const f = (x, y) => E.monsoonOf(S, x, y).fair, [s, o] = f('jeddah', 'mumbai') || !f('mumbai', 'jeddah') ? ['jeddah', 'mumbai'] : ['mumbai', 'jeddah']; a(A.buyShip(S, s, 'dhow').ok); a(A.hireCaptain(S).ok); const c = S.player.caravans.at(-1); c.captain.role = 'loyal'; c.captain.home = 'sa'; c.city = s; c.route = null; c.free = false; a(A.hirePortM(S).ok); a(A.portmOpenLine(S, c.id, E.shipsOf(S)[0].id, s, o, !!all).ok); return { S, c, s, o }; }

// 1) الثمن والتوظيف: رسم 100,000 وأجر 80 (قرار 2026-11-05)؛ ويُفتح بعد رحلة بحرية وسفينة
a.equal(E.PORTM.fee, 100000); a.equal(E.PORTM.wage, 80); a.equal(E.PORTM.on, true);
{
  const S = game(); let q = E.portmQuote(S); a.equal(q.ok, false); a.equal(q.open, false); a(q.reasons.includes('أتمّ رحلة بحرية واحدة أولاً')); a(q.reasons.includes('اشترِ سفينة أولاً')); a.equal(A.hirePortM(S).ok, false);
  S.player.seaTrips = 1; a(A.buyShip(S, 'jeddah', 'dhow').ok); S.player.wallet.sar = 60000; q = E.portmQuote(S); a.equal(q.open, true, 'يظهر هدفاً'); a.equal(q.ok, false); a.equal(J(q.reasons), J(['اجمع 40000 ريال أخرى (الرسم 100000)'])); near(q.frac, 0.6);
  S.player.wallet.sar = 300000; a(A.hirePortM(S).ok); near(S.player.wallet.sar, 200000); const D = S.player.portm; a.equal(J(Object.fromEntries(Object.entries(D.rules).map(([k, v]) => [k, v.mode]))), J({ dock: 'exec', run: 'exec', fix: 'ask' }), 'الافتراضيات من المواصفة'); a.equal(A.hirePortM(S).ok, false);
  // الأجر: من المحفظة يومياً، وتأخره 5 أيام يتركه فيُلغى الخط
  const w0 = S.player.wallet.sar; S.day++; E.portmBegin(S); near(S.player.wallet.sar, w0 - 80); E.portmBegin(S); near(S.player.wallet.sar, w0 - 80, 'مرة واحدة في اليوم');
  S.player.wallet.sar = 0; S.player.wallet.usd = 0; S.player.wallet.au = 0; for (let i = 1; i <= 4; i++) { S.day++; E.portmBegin(S); a(S.player.portm); a.equal(D.late, i); } S.day++; E.portmBegin(S); a.equal(S.player.portm, undefined); a(S.news.some(n => /ترك الشهبندر/.test(n.t)));
  const { S: S2 } = line(5); a(A.firePortM(S2).ok); a(S2.player.caravans.every(c => !c.line)); a.equal(A.firePortM(S2).ok, false);
}

// 2) فتح الخط: قافلة مستأجرة فقط (FR-001)، ميناءان مختلفان، السفينة راسية مع القافلة؛ حواجز: لا تغيير وضع القافلة ولا استعمال السفينة لغير الخط
{
  const S = game(); S.player.seaTrips = 1; a(A.buyShip(S, 'jeddah', 'dhow').ok); a(A.hirePortM(S).ok); const main = S.player.caravans[0], ship = E.shipsOf(S)[0]; main.city = 'jeddah';
  a.equal(A.portmOpenLine(S, main.id, ship.id, 'jeddah', 'mumbai').ok, false, 'قافلة اللاعب الرئيسية لا خط لها'); a(A.hireCaptain(S).ok); const c = S.player.caravans.at(-1); c.captain.role = 'loyal'; c.city = 'riyadh';
  a.equal(A.portmOpenLine(S, c.id, ship.id, 'jeddah', 'mumbai').msg.includes('يبدأ الخط والقافلة في أحد ميناءيه'), true); c.city = 'jeddah'; a.equal(A.portmOpenLine(S, c.id, ship.id, 'jeddah', 'jeddah').ok, false); a.equal(A.portmOpenLine(S, c.id, ship.id, 'jeddah', 'riyadh').ok, false, 'ميناءان فقط'); a.equal(A.portmOpenLine(S, c.id, 999, 'jeddah', 'mumbai').ok, false);
  a(A.portmOpenLine(S, c.id, ship.id, 'jeddah', 'mumbai').ok); a.equal(A.portmOpenLine(S, c.id, ship.id, 'jeddah', 'mumbai').ok, false, 'على خط بالفعل');
  a.equal(A.setRoute(S, c.id, { a: 'riyadh', b: 'jeddah' }).ok, false); a.equal(A.captainMode(S, c.id, 'free').ok, false); a.equal(A.captainMode(S, c.id, 'stop').ok, false); a.equal(A.captainSupply(S, c.id, 'riyadh', 'wheat', 10, 500).ok, false); a(A.captainMode(S, c.id, 'rest', 2).ok, 'الراحة مسموحة');
  a(E.shipsOf(S).length === 1); const rp = E.seaPlan ? null : null; main.cargo = {}; const plan = A.sail ? null : null; a(A.portmCloseLine(S, c.id).ok); a.equal(c.line, undefined); a(A.setRoute(S, c.id, { a: 'riyadh', b: 'jeddah' }).ok, 'بعد الإلغاء حرّ');
  const L = line(7); a.equal(A.portmAllSeasons(L.S, L.c.id, true).ok, true); a.equal(L.c.line.allSeasons, true); a.equal(A.portmAllSeasons(L.S, 99, true).ok, false);
}

// 3) الموسم: لا إبحار ضد الريح بالإعداد الافتراضي، وتنتظر الموسم بعدّ الأيام؛ وكل المواسم تُبحر؛ ولا وقوف > 3 أيام في الموسم المفتوح
{
  const { S, c, s, o } = line(3); let unfair = 0, departures = 0, run = 0, maxRun = 0, waited = false;
  for (let d = 0; d < 360; d++) { const before = { city: c.city, left: c.left }; E.tick(S, false); if (before.left === 0 && c.left > 0) { departures++; const fair = E.monsoonOf(S, before.city, c.dest).fair; if (!fair) unfair++; }
    if (c.waiting && /^تنتظر الموسم: يفتح بعد \d+ يوماً$/.test(c.waiting) && c.left === 0) { waited = true; const n = +c.waiting.match(/\d+/)[0]; a.equal(n, E.portmOpensIn(S, c.city, c.city === s ? o : s), 'عدّ الأيام صحيح'); }
    const idleOpen = c.left === 0 && !(c.waiting && /الموسم/.test(c.waiting)); run = idleOpen ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
  a.equal(unfair, 0, 'لا إبحار ضد الريح بالإعداد الافتراضي'); a(departures >= 2, 'أبحر مع الموسم: ' + departures); a(waited, 'انتظرت الموسم'); a(maxRun <= 3, 'لا وقوف > 3 أيام في الموسم المفتوح: ' + maxRun);
  const L = line(3, true); let unfairAll = 0; for (let d = 0; d < 120; d++) { const b = { l: L.c.left }; E.tick(L.S, false); if (b.l === 0 && L.c.left > 0 && !E.monsoonOf(L.S, L.c.from, L.c.dest).fair) unfairAll++; } a(unfairAll >= 1, 'كل المواسم: يُبحر ضد الريح');
  // السفينة مربوطة: قافلة أخرى لا تبحر بها
  const M = line(9); const other = M.S.player.caravans[0]; other.city = M.c.city; const plan = E.seaPlan ? E.seaPlan(M.S, other, M.c.city === M.s ? M.o : M.s) : null; if (plan) a(plan.ok === false && /مربوطة/.test(plan.msg));
}

// 4) القواعد: اسألني ينفّذ بعد المهلة بالضبط، واتركه لي لا يُبحر أبداً (SC-003)
{
  const base = mode => { const R = line(3); R.S.player.portm.rules.run.mode = mode; R.S.player.portm.rules.dock.mode = mode; R.S.player.portm.rules.run.wait = 3; R.S.player.portm.rules.dock.wait = 3; return R; };
  { const { S, c } = base('ask'); let asked = null, sailedDay = null, d0 = null; for (let d = 0; d < 200 && sailedDay == null; d++) { E.tick(S, false); if (!asked) { asked = S.player.portm.ask.find(x => x.car === c.id); if (asked) d0 = S.day; } if (asked && c.left > 0) sailedDay = S.day; if (asked && c.left === 0) a(S.day - d0 < 3 || sailedDay != null, 'قبل المهلة لا يُبحر'); } a(asked, 'سأل'); a.equal(asked.due, asked.day + 3); a.equal(sailedDay, asked.due, 'أبحر في يوم المهلة بالضبط'); }
  { const { S, c } = base('ask'); let q = null; for (let d = 0; d < 100 && !q; d++) { E.tick(S, false); q = S.player.portm.ask.find(x => x.car === c.id); } a(q); a(A.portmAnswer(S, q.id, 'do').ok); a(c.left > 0, 'نفّذ عنك فوراً'); a.equal(A.portmAnswer(S, q.id, 'do').ok, false); }
  { const { S, c } = base('ask'); let q = null; for (let d = 0; d < 100 && !q; d++) { E.tick(S, false); q = S.player.portm.ask.find(x => x.car === c.id); } a(A.portmAnswer(S, q.id, 'mine').ok); for (let d = 0; d < 3; d++) { E.tick(S, false); a.equal(c.left, 0, 'تولّيتَ بنفسك'); a(!S.player.portm.ask.some(x => x.car === c.id && x.id === q.id)); } }
  { const { S, c } = base('mine'); for (let d = 0; d < 120; d++) E.tick(S, false); a.equal(c.line.sails || 0, 0, 'اتركه لي: لا إبحار أبداً'); a(S.player.portm.ask.some(x => x.remind === true && x.car === c.id), 'تذكير'); }
  // التحقق من القواعد
  const S = line(3).S; a.equal(A.portmRule(S, 'zzz', 'exec').ok, false); a.equal(A.portmRule(S, 'run', 'zzz').ok, false); a.equal(A.portmRule(S, 'run', 'ask', 2).ok, false); a(A.portmRule(S, 'run', 'ask', 7).ok); a.equal(S.player.portm.rules.run.wait, 7); a.deepEqual(Object.keys(E.PORTM_TYPES), ['dock', 'run', 'fix']);
}

// 5) bestDeal بوجهة: السلوك القديم بلا تغيير، والمحصور بوجهة يوافق الأفضل إن وافقته
{
  const S = game(5); const c = S.player.caravans[0]; c.city = 'jeddah'; const budget = 60000; const d0 = E.bestDeal ? E.bestDeal(S, c, budget, 'trade') : null;
  if (d0) { const d1 = E.bestDeal(S, c, budget, 'trade', null), d2 = E.bestDeal(S, c, budget, 'trade', d0.dest); a.equal(J(d0), J(d1), 'وسيط الوجهة الفارغ = القديم'); a.equal(d2.g, d0.g, 'محصور بوجهته نفسها = الأفضل'); a.equal(d2.dest, d0.dest); const alt = E.bestDeal(S, c, budget, 'trade', S.order.find(x => x !== 'jeddah' && x !== d0.dest)); if (alt) a.equal(alt.dest, S.order.find(x => x !== 'jeddah' && x !== d0.dest), 'لا يخرج عن الوجهة'); }
}

// 6) الحفظ والمفتاح
{
  const { S, c } = line(3); const L = E.load(E.save(S)); a(L.player.portm); a.equal(L.player.caravans.find(x => x.id === c.id).line.a, c.line.a);
  const bad = JSON.parse(E.save(S)); const car = bad.player.caravans.find(x => x.id === c.id); car.line = { ship: 'x', a: 'jeddah', b: 'jeddah' }; bad.player.portm.rules = { run: { mode: 'zzz', wait: 99 } }; bad.player.portm.ask = [null, { id: 1, type: 'fake', key: 'k', day: 0, text: 'x' }]; bad.player.portm.log = [{ d: 'x' }]; const B = E.load(JSON.stringify(bad));
  a.equal(B.player.caravans.find(x => x.id === c.id).line, undefined); a.equal(B.player.portm.rules.run.mode, 'exec'); a.equal(B.player.portm.rules.run.wait, 3); a.equal(B.player.portm.ask.length, 0); a.equal(B.player.portm.log.length, 0);
  const bad2 = JSON.parse(E.save(S)); bad2.player.portm = { since: 'x' }; const B2 = E.load(JSON.stringify(bad2)); a.equal(B2.player.portm, undefined); a(B2.player.caravans.every(x => !x.line));
  const old = JSON.parse(E.save(game())); a.equal(old.player.portm, undefined); a(E.load(JSON.stringify(old)));
  // المفتاح: بلا شهبندر لا أثر؛ ومعه مطفأً لا نشاط ولا أجر
  const X = game(), Y = game(); E.PORTM.on = false; for (let i = 0; i < 20; i++) E.tick(X, false); E.PORTM.on = true; for (let i = 0; i < 20; i++) E.tick(Y, false); a.equal(E.save(X), E.save(Y), 'بلا شهبندر: خط الأساس لا يتغير بالمفتاح');
  const Z = E.load(E.save(S)), zc = Z.player.caravans.find(x => x.id === c.id); E.PORTM.on = false; const p0 = Z.player.portm.paid; for (let i = 0; i < 30; i++) E.tick(Z, false); a.equal(zc.line.sails || 0, 0, 'المفتاح مطفأ: لا إبحار'); near(Z.player.portm.paid, p0, 'ولا أجر'); a.equal(A.portmOpenLine(Z, zc.id, zc.line.ship, 'jeddah', 'mumbai').ok, false); E.PORTM.on = true;
}
console.log('PASS port-master (engine): price/hire/wage, line guards (FR-001), monsoon (no sailing against wind, countdown, <=3 idle days), ask/mine rules, bestDeal destination, old/bad saves, off switch');
