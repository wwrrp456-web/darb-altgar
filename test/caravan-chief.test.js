'use strict';
// 026 شيخ القوافل: التوظيف والثمن، الراحة بالتناوب (لا أكثر من الثلث)، إنقاذ الواقف، سدّ النقص بالتموين، القواعد والمهلة، احترام قرار اللاعب، الحفظ القديم، المفتاح.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { staffDay, mgrDay, '), box);
const E = box.module.exports, A = E.A, near = (x, y, m) => a(Math.abs(x - y) < 1e-6, (m || '') + ` ${x} != ${y}`), J = x => JSON.stringify(x);
function game() { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 400000; S.noEvents = true; S.noShocks = true; return S; }
function fleet(S, n, role) { for (let i = 0; i < n; i++) { a(A.hireCaptain(S).ok); const c = S.player.caravans.at(-1); c.captain.role = role || 'loyal'; c.captain.home = 'sa'; c.route = null; c.free = false; c.sup = null; c.waiting = null; } return S.player.caravans.filter(c => c.captain && !c.main); }
function withSteward(S, city) {
  for (let i = 0; i < 2; i++) a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok);
  const pr = S.player.props[city]; for (const w of pr.staff) { w.days = 120; w.free = 0; }
  const d0 = S.day; for (let day = d0 + 1; day <= d0 + 30; day++) { S.day = day; E.staffDay(S, city, pr, S.cities[city]); }
  a(A.promoteWorker(S, city, pr.staff[0].id, 'shop', pr.shops[0].id).ok);
  { const d1 = S.day; for (let day = d1 + 1; day <= d1 + 90; day++) { S.day = day; E.mgrDay(S, city, pr); } }
  a(A.auditCity(S, city).ok); a(A.promoteSteward(S, city).ok); return pr;
}
const day = S => { S.day++; S.player.cchief && (S.player.cchief.day = null); E.cchiefDay(S); };

// 1) الثمن والتوظيف: رسم 80,000 وأجر 60 (قرار 2026-11-05)، ويُفتح بثلاث قوافل بقادة مستأجرين
a.equal(E.CHIEFC.fee, 80000); a.equal(E.CHIEFC.wage, 60); a.equal(E.CHIEFC.on, true);
{
  const S = game(); fleet(S, 2); let q = E.cchiefQuote(S); a.equal(q.ok, false); a.equal(q.open, false); a(q.reasons[0].includes('تحتاج 3 قوافل بقادة مستأجرين (عندك 2)')); a.equal(A.hireCChief(S).ok, false);
  fleet(S, 1); S.player.wallet.sar = 50000; q = E.cchiefQuote(S); a.equal(q.open, true, 'يظهر هدفاً'); a.equal(q.ok, false); a.equal(J(q.reasons), J(['اجمع 30000 ريال أخرى (الرسم 80000)'])); near(q.frac, 50000 / 80000);
  S.player.wallet.sar = 200000; a(A.hireCChief(S).ok); near(S.player.wallet.sar, 120000, 'الرسم من المحفظة'); const D = S.player.cchief;
  a.equal(J(Object.fromEntries(Object.entries(D.rules).map(([k, v]) => [k, v.mode]))), J({ rest: 'exec', rescue: 'exec', supply: 'ask' }), 'الافتراضيات من المواصفة'); a(Object.values(D.rules).every(r => r.wait === 3)); a.equal(D.rules.supply.budget, 5000); a.equal(D.rules.supply.target, 60);
  a.equal(A.hireCChief(S).ok, false); a.equal(E.cchiefView(S).hired, true); a(A.fireCChief(S).ok); a.equal(S.player.cchief, undefined); a.equal(A.fireCChief(S).ok, false);
}

// 2) الأجر اليومي من المحفظة؛ تأخره 5 أيام يتركه
{
  const S = game(); fleet(S, 3); a(A.hireCChief(S).ok); const D = S.player.cchief, w0 = S.player.wallet.sar; S.day++; E.cchiefBegin(S); near(S.player.wallet.sar, w0 - 60); E.cchiefBegin(S); near(S.player.wallet.sar, w0 - 60, 'مرة واحدة في اليوم');
  S.player.wallet.sar = 0; S.player.wallet.usd = 0; S.player.wallet.au = 0; for (let i = 1; i <= 4; i++) { S.day++; E.cchiefBegin(S); a(S.player.cchief); a.equal(D.late, i); } S.day++; E.cchiefBegin(S); a.equal(S.player.cchief, undefined); a(S.news.some(n => /ترك شيخ القوافل/.test(n.t)));
}

// 3) الراحة بالتناوب: معنويات < 50؛ لا أكثر من ثلث القوافل معاً؛ ويعود قائدها إلى عمله السابق
{
  const S = game(), cars = fleet(S, 5, 'indep'); a(A.hireCChief(S).ok); const D = S.player.cchief; let maxRest = 0; const resting = () => cars.filter(c => (c.restUntil || 0) > S.day).length;
  for (const c of cars) { c.free = true; c.morale = 30; } cars[0].route = { a: 'riyadh', b: 'jeddah' }; cars[0].free = false;
  for (let i = 0; i < 25; i++) { for (const c of cars) if (!((c.restUntil || 0) > S.day)) c.morale = Math.min(c.morale, 30); day(S); maxRest = Math.max(maxRest, resting()); a(resting() <= Math.floor(cars.length / 3), 'لا أكثر من الثلث في يوم ' + i); }
  a(maxRest >= 1, 'أراح فعلاً'); a(D.log.some(l => l.kind === 'rest' && l.text.includes('أرحتُ قائد')));
  // عاد إلى وضعه السابق (المسار والحرية لم تُمسّ)
  a.equal(J(cars[0].route), J({ a: 'riyadh', b: 'jeddah' }), 'المسار باقٍ بعد الراحة'); a(cars.slice(1).every(c => c.free), 'الحرّ باقٍ حرّاً');
  // ختم اللاعب: فعل الشيخ لا يختم userDay
  a(cars.every(c => c.userDay === undefined), 'أفعال الشيخ لا تُحسب أفعال لاعب');
  // لا تُراح قافلة في رحلة، ولا قافلة اللاعب الرئيسية، ولا قافلة بلا قائد
  const S2 = game(), cs2 = fleet(S2, 3, 'indep'); a(A.hireCChief(S2).ok); const main = S2.player.caravans[0]; main.morale = 10; cs2[0].morale = 10; cs2[0].left = 3; cs2[0].dest = 'jeddah'; day(S2); a(!(main.restUntil > S2.day), 'قافلة اللاعب الرئيسية لا تُمس'); a(!((cs2[0].restUntil || 0) > S2.day), 'قافلة في رحلة لا تُراح');
}

// 4) إنقاذ الواقف ≥ 7 أيام: حرّة؛ والنقد ⇒ الناظر وإلا تذكير
{
  const S = game(), cars = fleet(S, 3); a(A.hireCChief(S).ok); const D = S.player.cchief, [c1] = cars;
  for (let i = 0; i < 6; i++) { day(S); a.equal(c1.free, false, 'قبل 7 أيام لا يُمس: يوم ' + i); } a.equal(c1.idleDays, 6); day(S); a.equal(c1.free, true, 'بعد 7 أيام صارت حرّة'); a.equal(c1.idleDays, 0); a(D.log.some(l => l.kind === 'rescue' && l.text.includes(c1.name)));
  a(cars.every(c => c.free), 'كل الواقفة أُعيدت'); a(cars.every(c => c.userDay === undefined));
  // بلا شيخ تبقى واقفة (الشاهد)
  const S2 = game(), cs2 = fleet(S2, 3); for (let i = 0; i < 12; i++) { S2.day++; } a(cs2.every(c => !c.free && !c.route), 'الشاهد: واقفة');
  // سبب النقد: تعذّر الشراء مع نقد < 2000 ⇒ يرفع للناظر إن وُجد
  const S3 = game(), c3 = fleet(S3, 3); a(A.hireCChief(S3).ok); const D3 = S3.player.cchief; S3.phase = 4; S3.player.diwan = { since: S3.day, box: 50000, rules: E.diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 };
  c3[0].free = true; c3[0].waiting = 'تعذّر الشراء'; c3[0].idleDays = 6; S3.player.wallet.sar = 100; S3.player.wallet.usd = 0; S3.player.wallet.au = 0; day(S3); near(S3.player.wallet.sar, 3100, 'الناظر غطّى 3000 من الخزينة'); near(S3.player.diwan.box, 47000); a(D3.log.some(l => /ناظر الديوان/.test(l.text)));
  a(c3[0].free, 'بقيت حرّة (لم تُغيَّر)'); a.equal(c3[0].idleDays, 0);
  // بلا ناظر: تذكير للاعب لا فعل
  const S4 = game(), c4 = fleet(S4, 3); a(A.hireCChief(S4).ok); c4[0].free = true; c4[0].waiting = 'تعذّر الشراء'; c4[0].idleDays = 6; S4.player.wallet.sar = 100; S4.player.wallet.usd = 0; S4.player.wallet.au = 0; day(S4); const rem = S4.player.cchief.ask.find(x => x.remind && x.key === 'cash:' + c4[0].id); a(rem, 'تذكير بنقص النقد'); near(S4.player.wallet.sar, 100);
  // لا يُنقَذ ما وُجّه بيد اللاعب خلال أسبوع
  const S5 = game(), c5 = fleet(S5, 3); a(A.hireCChief(S5).ok); a(A.captainMode(S5, c5[0].id, 'stop').ok); a.equal(c5[0].userDay, S5.day); for (let i = 0; i < 6; i++) day(S5); a.equal(c5[0].free, false, 'قرار اللاعب محترم أسبوعاً'); day(S5); a(c5[1].free, 'غيرها أُنقذت'); a.equal(c5[0].free, true, 'بعد الأسبوع يعالج');
}

// 5) سدّ النقص: دكاكين مدينة أمين نفد منها صنف ⇒ قافلة تموين بميزانية اللاعب؛ «اسألني» ينفّذ بعد المهلة بالضبط
function shortage(S) { const pr = S.player.props.riyadh, c = S.cities.riyadh; const g = E.GIDS.find(x => x !== 'wheat' && E.sells(S.cities.jeddah, x) && !E.GD[x].sp && !E.GD[x].live && !(x in E.BREED)); for (const sh of pr.shops) sh.items = []; pr.shops[0].items = [{ g, price: 1.8, auto: false, carry: false, buyBelow: 1.05, target: 60, sold: 0, revenue: 0 }]; pr.store = {}; return g; }
{
  const S = game(); withSteward(S, 'riyadh'); const cars = fleet(S, 3); for (const c of cars) { c.city = 'riyadh'; c.free = true; } a(A.hireCChief(S).ok); const D = S.player.cchief; const g = shortage(S);
  a.equal(E.ccShortages(S).length, 1); a.equal(E.ccShortages(S)[0].g, g); day(S); const q = D.ask.find(x => x.type === 'supply'); a(q, 'يسأل (الافتراضي)'); a.equal(q.g, g); a.equal(q.city, 'riyadh'); a.equal(q.due, q.day + 3); a(cars.every(c => !c.sup), 'لم يُوجَّه قبل الرد');
  const d0 = q.day; while (S.day < d0 + 2) day(S); a(cars.every(c => !c.sup), 'قبل المهلة'); day(S); a.equal(S.day, d0 + 3); const sup = cars.find(c => c.sup); a(sup, 'نُفّذ في يوم المهلة بالضبط'); a.equal(sup.sup.g, g); a.equal(sup.sup.wh, 'riyadh'); a.equal(sup.sup.budget, 5000); a.equal(sup.sup.target, 60); a(!D.ask.some(x => x.id === q.id)); a(D.log.some(l => l.kind === 'supply' && l.text.includes(E.GD[g].name)));
  // لا نقص ⇒ لا تموين: المخزون كافٍ
  const S2 = game(); withSteward(S2, 'riyadh'); const c2 = fleet(S2, 3); for (const c of c2) { c.city = 'riyadh'; c.free = true; } a(A.hireCChief(S2).ok); const g2 = shortage(S2); S2.player.props.riyadh.store[g2] = 40; a.equal(E.ccShortages(S2).length, 0); for (let i = 0; i < 5; i++) day(S2); a(c2.every(c => !c.sup) && S2.player.cchief.ask.length === 0, 'لا يموّن سلعة غير ناقصة');
  // exec: فوراً؛ والقافلة على مسار رابح لا تُقطع
  const S3 = game(); withSteward(S3, 'riyadh'); const c3 = fleet(S3, 3); for (const c of c3) c.city = 'riyadh'; c3[0].route = { a: 'riyadh', b: 'jeddah' }; c3[1].route = { a: 'riyadh', b: 'jeddah' }; c3[2].free = true; a(A.hireCChief(S3).ok); a(A.cchiefRule(S3, 'supply', 'exec', null, 3000, 40).ok); shortage(S3); day(S3); a(c3[2].sup && c3[2].sup.budget === 3000 && c3[2].sup.target === 40, 'ميزانية اللاعب وكميته'); a(!c3[0].sup && !c3[1].sup && c3[0].route && c3[1].route, 'لا يقطع مساراً');
  // «سأتولاها» لا يعيد السؤال أسبوعاً، و«نفّذ عني» فوراً، و«اتركه لي» تذكير فقط
  const S4 = game(); withSteward(S4, 'riyadh'); const c4 = fleet(S4, 3); for (const c of c4) { c.city = 'riyadh'; c.free = true; } a(A.hireCChief(S4).ok); const D4 = S4.player.cchief; shortage(S4); day(S4); const q4 = D4.ask.find(x => x.type === 'supply'); a(A.cchiefAnswer(S4, q4.id, 'mine').ok); for (let i = 0; i < 6; i++) { day(S4); a(!D4.ask.some(x => x.type === 'supply'), 'لا سؤال خلال أسبوع'); } a(c4.every(c => !c.sup));
  const S5 = game(); withSteward(S5, 'riyadh'); const c5 = fleet(S5, 3); for (const c of c5) { c.city = 'riyadh'; c.free = true; } a(A.hireCChief(S5).ok); shortage(S5); day(S5); const q5 = S5.player.cchief.ask.find(x => x.type === 'supply'); a(A.cchiefAnswer(S5, q5.id, 'do').ok); a(c5.some(c => c.sup)); a.equal(A.cchiefAnswer(S5, q5.id, 'do').ok, false);
  const S6 = game(); withSteward(S6, 'riyadh'); const c6 = fleet(S6, 3); for (const c of c6) { c.city = 'riyadh'; c.free = true; } a(A.hireCChief(S6).ok); a(A.cchiefRule(S6, 'supply', 'mine').ok); shortage(S6); for (let i = 0; i < 20; i++) day(S6); const rq = S6.player.cchief.ask.find(x => x.type === 'supply'); a(rq && rq.remind === true && rq.due === undefined, 'تذكير فقط'); a(c6.every(c => !c.sup), 'لا ينفّذ أبداً');
}

// 6) FR-001: لا يشتري قافلة ولا يفصل قائداً ولا يمس قافلة بلا قائد أو الرئيسية
{
  const S = game(), cars = fleet(S, 3); a(A.hireCChief(S).ok); const ids = S.player.caravans.map(c => c.id), caps = S.player.caravans.map(c => c.captain && c.captain.name), main = S.player.caravans[0]; const m0 = J({ r: main.route, f: main.free, s: main.sup, rest: main.restUntil });
  for (let i = 0; i < 40; i++) { for (const c of cars) c.morale = 20; day(S); } a.equal(J(S.player.caravans.map(c => c.id)), J(ids)); a.equal(J(S.player.caravans.map(c => c.captain && c.captain.name)), J(caps)); a.equal(J({ r: main.route, f: main.free, s: main.sup, rest: main.restUntil }), m0, 'الرئيسية لم تُمس');
  a.equal(A.cchiefRule(S, 'buy', 'exec').ok, false); a.equal(A.cchiefRule(S, 'fire', 'exec').ok, false); a.deepEqual(Object.keys(E.CHIEFC_TYPES), ['rest', 'rescue', 'supply']);
}

// 7) القواعد: التحقق
{
  const S = game(); fleet(S, 3); a(A.hireCChief(S).ok); const D = S.player.cchief; a.equal(A.cchiefRule(S, 'zzz', 'exec').ok, false); a.equal(A.cchiefRule(S, 'rest', 'zzz').ok, false); a.equal(A.cchiefRule(S, 'rest', 'ask', 2).ok, false); a.equal(A.cchiefRule(S, 'supply', 'ask', 3, 100).ok, false); a.equal(A.cchiefRule(S, 'supply', 'ask', 3, 5000, 0).ok, false);
  a(A.cchiefRule(S, 'rest', 'ask', 7).ok); a.equal(D.rules.rest.wait, 7); a(A.cchiefRule(S, 'supply', 'exec', 1, 9000, 80).ok); a.equal(D.rules.supply.budget, 9000); a.equal(D.rules.supply.target, 80);
  D.ask.push({ id: S.nextId++, type: 'rest', key: 'x', text: 't', day: S.day, remind: true }); a(A.cchiefRule(S, 'rest', 'exec').ok); a.equal(D.ask.length, 0);
}

// 8) SC-002: بتأثير الشيخ على أسطول يتاجر (6 قوافل، 360 يوماً): دخله مع الشيخ ≥ دخله بلا شيخ ناقص أجره، ولا يرتاح أكثر من الثلث
{
  const run = chief => { const S = game(); const cs = fleet(S, 5, 'indep'); for (const c of cs) c.free = true; if (chief) a(A.hireCChief(S).ok); const w0 = E.netWorth(S); let maxRest = 0; for (let d = 0; d < 360; d++) { E.tick(S, false); maxRest = Math.max(maxRest, E.fleetReport(S).filter(r => r.mode === 'rest').length); } return { gain: E.netWorth(S) - w0, wages: S.player.cchief ? S.player.cchief.paid : 0, maxRest }; };
  const off = run(false), on = run(true); const grossOn = on.gain + on.wages; a(grossOn >= off.gain - on.wages, `دخل الأسطول مع الشيخ ${Math.round(grossOn)} ≥ دخله بلا شيخ ${Math.round(off.gain)} ناقص أجره ${on.wages}`); a(on.maxRest <= Math.floor(5 / 3), 'لا أكثر من ثلث القوافل: ' + on.maxRest); near(on.wages, 60 * 360, 'الأجر 60 × 360');
}

// 9) الحفظ والمفتاح
{
  const S = game(); fleet(S, 3); a(A.hireCChief(S).ok); S.player.cchief.rules.rest.mode = 'mine'; S.player.cchief.rules.supply.budget = 7000; const L = E.load(E.save(S)); a.equal(L.player.cchief.rules.rest.mode, 'mine'); a.equal(L.player.cchief.rules.supply.budget, 7000);
  const bad = JSON.parse(E.save(S)); bad.player.cchief.rules = { rest: { mode: 'zzz', wait: 99 }, supply: { budget: 5, target: -3 } }; bad.player.cchief.ask = [null, { id: 1, type: 'fake', key: 'k', day: 0, text: 'x' }, { id: 9, type: 'rest', key: '5', day: 0, due: 4, text: 'ok' }]; bad.player.cchief.log = [{ d: 'x' }, { d: 0, text: 'y', amount: 2 }]; bad.player.caravans[0].idleDays = -4; bad.player.caravans[0].userDay = 'x';
  const B = E.load(JSON.stringify(bad)); a.equal(B.player.cchief.rules.rest.mode, 'exec'); a.equal(B.player.cchief.rules.rest.wait, 3); a.equal(B.player.cchief.rules.supply.budget, 5000); a.equal(B.player.cchief.rules.supply.target, 60); a.equal(B.player.cchief.ask.length, 1); a.equal(B.player.cchief.log.length, 1); a.equal(B.player.caravans[0].idleDays, undefined); a.equal(B.player.caravans[0].userDay, undefined);
  const bad2 = JSON.parse(E.save(S)); bad2.player.cchief = { since: 'x' }; a.equal(E.load(JSON.stringify(bad2)).player.cchief, undefined); const bad3 = JSON.parse(E.save(S)); bad3.player.cchief = 4; a.equal(E.load(JSON.stringify(bad3)).player.cchief, undefined);
  const old = JSON.parse(E.save(game())); a.equal(old.player.cchief, undefined); a(E.load(JSON.stringify(old)));
  // المفتاح: بلا شيخ لا أثر؛ وبوجوده والإطفاء لا نشاط ولا خصم أجر
  const X = game(), Y = game(); E.CHIEFC.on = false; for (let i = 0; i < 20; i++) E.tick(X, false); E.CHIEFC.on = true; for (let i = 0; i < 20; i++) E.tick(Y, false); a.equal(E.save(X), E.save(Y), 'بلا شيخ: خط الأساس لا يتغير بالمفتاح');
  const Z = E.load(E.save(S)); E.CHIEFC.on = false; const w0 = Z.player.wallet.sar; for (let i = 0; i < 5; i++) { E.tick(Z, false); } a.equal(E.cchiefQuote(Z).ok, false); a(Z.player.cchief, 'السجل محفوظ'); near(Z.player.cchief.paid || 0, 0, 'لا أجر ولا نشاط'); E.CHIEFC.on = true;
}
console.log('PASS caravan-chief: price/hire, wage/quit, rest (<=1/3, mode restored), rescue (7 days, cash->diwan/reminder), supply (real shortage, ask due exact, answers, mine), FR-001/002, rules, SC-002, old/bad saves, off switch');
