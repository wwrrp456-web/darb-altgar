'use strict';
// 025 ناظر الديوان: التوظيف والثمن، الخزينة والزكاة، التغطية بالترتيب، القواعد (نفّذ/اسألني/اتركه لي)، المخزن والصفقات، المواعيد، الحفظ القديم، المفتاح.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { staffDay, mgrDay, '), box);
const E = box.module.exports, A = E.A, near = (x, y, m) => a(Math.abs(x - y) < 1e-6, (m || '') + ` ${x} != ${y}`), J = x => JSON.stringify(x);
function game() { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 5e6; S.noEvents = true; S.noShocks = true; return S; }
function withSteward(S, city) {
  for (let i = 0; i < 2; i++) a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok);
  const pr = S.player.props[city]; for (const w of pr.staff) { w.days = 120; w.free = 0; }
  const d0 = S.day; for (let day = d0 + 1; day <= d0 + 30; day++) { S.day = day; E.staffDay(S, city, pr, S.cities[city]); }
  a(A.promoteWorker(S, city, pr.staff[0].id, 'shop', pr.shops[0].id).ok);
  { const d1 = S.day; for (let day = d1 + 1; day <= d1 + 90; day++) { S.day = day; E.mgrDay(S, city, pr); } }
  a(A.auditCity(S, city).ok); a(A.promoteSteward(S, city).ok); return pr;
}
function hired() { const S = game(); withSteward(S, 'riyadh'); withSteward(S, 'jeddah'); S.phase = 4; a(A.hireAgent(S, 'sa').ok); a(A.hireDiwan(S).ok); return S; }
const policy = (extra = {}) => ({ pay: true, report: false, restock: false, pricing: false, rotate: false, sellStale: false, herd: false, minPrice: { sellStale: 1, herd: 1 }, limit: 100000, every: 'daily', ...extra });

// 1) الثمن والتوظيف: رسم 720,000 وأجر 140 (D9)، والشروط من الطور والوكيل والنقد
a.equal(E.DIWAN.fee, 720000); a.equal(E.DIWAN.wage, 140); a.equal(E.DIWAN.on, true);
{
  const S = game(); let q = E.diwanQuote(S); a.equal(q.ok, false); a.equal(q.open, false); a(q.reasons.includes('يُفتح في الطور 4')); a(q.reasons.includes('وظّف وكيل إقليم أولاً')); a.equal(A.hireDiwan(S).ok, false);
  withSteward(S, 'riyadh'); withSteward(S, 'jeddah'); S.phase = 4; a(A.hireAgent(S, 'sa').ok); S.player.wallet.sar = 700000; q = E.diwanQuote(S); a.equal(q.ok, false); a.equal(q.open, true, 'يظهر هدفاً حين يُفتح'); same(q.reasons, ['اجمع 20000 ريال أخرى (الرسم 720000)']);
  near(q.frac, 700000 / 720000); a.equal(q.have, 700000); a.equal(A.hireDiwan(S).msg, q.msg);
  S.player.wallet.sar = 1000000; const nw0 = E.netWorth(S); a(A.hireDiwan(S).ok); near(S.player.wallet.sar, 280000, 'الرسم من المحفظة'); a(E.netWorth(S) < nw0, 'الرسم نفقة');
  const D = S.player.diwan; a.equal(D.box, 0); same(Object.fromEntries(Object.entries(D.rules).map(([k, v]) => [k, v.mode])), { pay: 'exec', fill: 'exec', sell: 'ask', herd: 'ask' }, 'الافتراضيات من جدول المواصفة'); a(Object.values(D.rules).every(r => r.wait === 3)); a.equal(D.rules.herd.max, 5000);
  a.equal(A.hireDiwan(S).ok, false); const v = E.diwanView(S); a.equal(v.hired, true); a.equal(v.wage, 140);
  function same(x, y) { a.equal(J(x), J(y)); }
}

// 2) الخزينة: إيداع وسحب وهي مال اللاعب: تدخل الثروة والزكاة بسطر مستقل
{
  const S = hired(), D = S.player.diwan, w0 = S.player.wallet.sar, nw0 = E.netWorth(S), z0 = E.zakatBase(S);
  a.equal(A.diwanDeposit(S, 0).ok, false); a.equal(A.diwanDeposit(S, w0 + 1).ok, false); a(A.diwanDeposit(S, 100000).ok); near(D.box, 100000); near(S.player.wallet.sar, w0 - 100000);
  near(E.netWorth(S), nw0, 'الإيداع لا يغيّر الثروة'); const z1 = E.zakatBase(S); near(z1.diwan, 100000, 'سطر خزينة الديوان'); near(z1.base, z0.base, 'الوعاء كما هو: النقد انتقل للخزينة وبقي في الوعاء'); near(z1.cash, z0.cash);
  a.equal(E.wealthReport(S).rows.some(r => r.k === 'diwan' && r.value === 100000), true, 'تقرير الثروة يذكرها'); near(E.wealthReport(S).rows.reduce((n, r) => n + r.value, 0), E.netWorth(S), 'مجموع البنود = الثروة');
  a.equal(A.diwanWithdraw(S, 200000).ok, false); a(A.diwanWithdraw(S, 40000).ok); near(D.box, 60000); near(S.player.wallet.sar, w0 - 60000);
  // الزكاة تشمل الخزينة حتى لو أُوقف المفتاح (مال اللاعب لا يختفي)
  E.DIWAN.on = false; near(E.zakatBase(S).diwan, 60000); near(E.netWorth(S), nw0); E.DIWAN.on = true;
  // التسريح يعيد الخزينة إلى المحفظة
  const w1 = S.player.wallet.sar; a(A.fireDiwan(S).ok); near(S.player.wallet.sar, w1 + 60000); a.equal(S.player.diwan, undefined); a.equal(A.fireDiwan(S).ok, false);
}

// 3) الأجر اليومي: من الخزينة أولاً ثم المحفظة؛ تأخره 5 أيام يترك العمل ويعيد الخزينة
{
  const S = hired(), D = S.player.diwan; D.box = 1000; const w0 = S.player.wallet.sar; S.day++; E.diwanBegin(S); near(D.box, 860); near(S.player.wallet.sar, w0); S.day++; E.diwanBegin(S); near(D.box, 720);
  D.box = 100; S.day++; E.diwanBegin(S); near(D.box, 100, 'الخزينة لا تكفي الأجر: من المحفظة'); near(S.player.wallet.sar, w0 - 140);
  const S2 = hired(), D2 = S2.player.diwan; D2.box = 50; S2.player.wallet.sar = 0; S2.player.wallet.usd = 0; S2.player.wallet.au = 0; for (let i = 1; i <= 4; i++) { S2.day++; E.diwanBegin(S2); a(S2.player.diwan, 'اليوم ' + i); a.equal(D2.late, i); } S2.day++; E.diwanBegin(S2);
  a.equal(S2.player.diwan, undefined, 'ترك العمل بعد 5 أيام'); near(S2.player.wallet.sar, 50, 'عاد ما في الخزينة'); a(S2.news.some(n => /ترك ناظر الديوان/.test(n.t)));
}

// 4) التغطية: الأجور ثم الإيجار ثم الصيانة؛ بقدر الخزينة، ولا مساس بحد الأمين
{
  const S = hired(), D = S.player.diwan, pr = S.player.props.riyadh, m = E.stewardOf(S, 'riyadh'); a(A.setStewardPolicy(S, 'riyadh', policy()).ok);
  const reserve = E.staffReserve ? 0 : 0; const res = pr.staff.filter(w => !(w.wageProof && w.wageProof.day >= S.day) && !(w.free > S.day)).reduce((n, w) => n + E.wkWage(S, S.cities.riyadh, w), 0); a(res > 0);
  D.box = res + 10; const wallet0 = S.player.wallet.sar; const lim0 = m.policy.limit;
  near(E.diwanCover(S, 'riyadh', 90, 'rent'), 10, 'الإيجار لا يأخذ ما حُجز للأجور'); near(D.box, res); near(E.diwanCover(S, 'riyadh', res, 'staff'), res, 'الأجور كاملة'); near(D.box, 0); a.equal(m.policy.limit, lim0, 'حد الأمين لم يتغير'); near(S.player.wallet.sar, wallet0 + 10 + res);
  a.equal(E.diwanCover(S, 'riyadh', 5, 'rent'), 0, 'الخزينة فارغة: لا تجاوز'); a.equal(D.log.filter(l => l.kind === 'pay').length, 2); a(D.log[0].text.includes('أجور'));
  // الترتيب في السداد المتأخر: أجور ثم إيجار
  const S2 = hired(); const list = [{ cat: 'upkeep', i: 1 }, { cat: 'rent', i: 2 }, { cat: 'staff', i: 3 }, { cat: 'wages', i: 4 }, { cat: 'rent', i: 5 }];
  a.equal(J(E.diwanOrder(S2, list).map(x => x.i)), J([3, 4, 2, 5, 1]), 'أجور ثم إيجار ثم غيرهما، ثابت الترتيب داخل الصنف'); delete S2.player.diwan; a.equal(J(E.diwanOrder(S2, list).map(x => x.i)), J([1, 2, 3, 4, 5]), 'بلا ناظر: الترتيب كما كان');
}

// 5) SC-001: محفظة فارغة وخزينة كافية: لا يتأخر أجر عامل يوماً في 180 يوماً؛ بوضع «عبر الأمين»
{
  const S = hired(), D = S.player.diwan, pr = S.player.props.riyadh; a(A.agentPolicy(S, 'sa', 100000, false).ok); a(A.setStewardPolicy(S, 'riyadh', policy({ restock: false })).ok); a(A.setWageMode(S, 'riyadh', 'steward').ok); D.box = 400000; D.rules.pay.mode = 'exec';
  const zero = () => { const w = S.player.wallet; w.sar = 0; w.usd = 0; w.au = 0; w.ag = 0; }; let covered0 = D.covered || 0, lateDays = 0, boxStart = D.box;
  for (let day = 0; day < 180; day++) { zero(); E.tick(S, false); if (pr.staff.some(w => w.late > 0) || (S.paymentDues || []).some(d => d.city === 'riyadh' && d.amount > 0)) lateDays++; }
  a.equal(lateDays, 0, 'لا يوماً واحداً تأخر فيه أجر'); a((D.covered || 0) > covered0, 'غطّى الناظر من الخزينة'); a(D.box < boxStart && D.box > 0); a(D.log.some(l => l.kind === 'pay' && /أجور/.test(l.text)));
  const rented = D.log.filter(l => l.kind === 'pay' && /أجور/.test(l.text)).length; a(rented > 0);
  // بلا ناظر (وخزينة) تتأخر الأجور في السيناريو نفسه: المقارنة تثبت أثره
  const S2 = hired(); a(A.agentPolicy(S2, 'sa', 100000, false).ok); a(A.setStewardPolicy(S2, 'riyadh', policy()).ok); a(A.setWageMode(S2, 'riyadh', 'steward').ok); delete S2.player.diwan; let late2 = 0, p2 = S2.player.props.riyadh;
  for (let day = 0; day < 30; day++) { const w = S2.player.wallet; w.sar = 0; w.usd = 0; w.au = 0; E.tick(S2, false); if (p2.staff.some(x => x.late > 0) || (S2.paymentDues || []).some(d => d.city === 'riyadh' && d.amount > 0)) late2++; }
  a(late2 > 0, 'بدون الناظر تتأخر الأجور (الشاهد)');
}

// 6) المخزن: SC-002 نفّذ ⇒ يهبط تحت 85٪ خلال 7 أيام ويُسجَّل؛ SC-003 اسألني/اتركه لي
const stale = (S, city, fillTo) => { const pr = S.player.props[city], D = S.player.diwan, c = S.cities[city], gs = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].live && !(g in E.BREED) && g !== 'wheat' && !E.GD[g].sp).slice(0, 2); for (const sh of pr.shops) sh.items = []; pr.store = {}; pr.basis = {};
  const cap = E.storeCap(S, city); let load = 0; for (const g of gs) { const q = Math.floor(cap * fillTo / gs.length / E.GD[g].w); pr.store[g] = q; pr.basis[g] = { q, c: q * E.unitPrice(c, g) * 0.3 }; D.idle[city] = D.idle[city] || {}; D.idle[city][g] = { q, since: S.day - 40 }; load += q * E.GD[g].w; } return { cap, gs }; };
{
  const S = hired(), D = S.player.diwan; D.rules.sell.mode = 'exec'; D.rules.fill.mode = 'mine'; const { cap } = stale(S, 'riyadh', 0.95); a(E.storeLoad(S, 'riyadh') >= cap * 0.85); let day0 = S.day, ok = false;
  for (let i = 0; i < 7 && !ok; i++) { E.tick(S, false); ok = E.storeLoad(S, 'riyadh') < cap * 0.85; } a(ok, 'هبط تحت 85٪ خلال 7 أيام'); a(D.log.some(l => l.kind === 'sell' && l.amount > 0), 'سُجّل في ما فعلته'); a(E.diwanView(S).did.some(l => l.kind === 'sell'));
  // لا يبيع تحت الحد الأدنى: كلفة أعلى من السعر
  const S2 = hired(), D2 = S2.player.diwan; D2.rules.sell.mode = 'exec'; const r2 = stale(S2, 'riyadh', 0.95); for (const g of r2.gs) S2.player.props.riyadh.basis[g].c *= 40; const l0 = E.storeLoad(S2, 'riyadh'); for (let i = 0; i < 3; i++) E.tick(S2, false); a(E.storeLoad(S2, 'riyadh') >= l0 - 1, 'الحد الأدنى محفوظ');
}
{
  // اسألني أولاً: يُسأل، وينفّذ بعد المهلة بالضبط (3 أيام)
  const S = hired(), D = S.player.diwan; D.rules.sell.mode = 'ask'; D.rules.sell.wait = 3; D.rules.fill.mode = 'mine'; const { cap } = stale(S, 'riyadh', 0.95); const l0 = E.storeLoad(S, 'riyadh');
  E.tick(S, false); const q = D.ask.find(x => x.type === 'sell' && x.city === 'riyadh'); a(q, 'سؤال معلّق'); const d0 = q.day; a.equal(q.due, d0 + 3); a.equal(D.ask.filter(x => x.type === 'sell').length, 1, 'لا تكرار');
  const sold = () => (S.player.props.riyadh.store[Object.keys(S.player.props.riyadh.store)[0]] || 0); const before = E.storeLoad(S, 'riyadh');
  while (S.day < d0 + 2) E.tick(S, false); a(!D.log.some(l => l.kind === 'sell'), 'لم يُنفَّذ قبل المهلة'); a(D.ask.some(x => x.id === q.id));
  E.tick(S, false); a.equal(S.day, d0 + 3); a(!D.ask.some(x => x.id === q.id), 'زال السؤال في يوم المهلة'); a(D.log.some(l => l.kind === 'sell'), 'نُفّذ في يوم المهلة'); a(D.log.some(l => l.kind === 'ask' && /انتهت مهلة سؤالك/.test(l.text)));
  // الرد «نفّذ عني» فوراً
  const S2 = hired(), D2 = S2.player.diwan; D2.rules.sell.mode = 'ask'; D2.rules.fill.mode = 'mine'; stale(S2, 'riyadh', 0.95); E.tick(S2, false); const q2 = D2.ask.find(x => x.type === 'sell'); const l1 = E.storeLoad(S2, 'riyadh'); a(A.diwanAnswer(S2, q2.id, 'do').ok); a(E.storeLoad(S2, 'riyadh') < l1, 'نفّذ عنك فوراً'); a.equal(D2.ask.filter(x => x.type === 'sell').length, 0); a.equal(A.diwanAnswer(S2, q2.id, 'do').ok, false);
  // «سأتولاها»: لا ينفّذ، ولا يسأل ثانية أسبوعاً
  const S3 = hired(), D3 = S3.player.diwan; D3.rules.sell.mode = 'ask'; D3.rules.fill.mode = 'mine'; stale(S3, 'riyadh', 0.95); E.tick(S3, false); const q3 = D3.ask.find(x => x.type === 'sell'), l3 = E.storeLoad(S3, 'riyadh'); a(A.diwanAnswer(S3, q3.id, 'mine').ok); for (let i = 0; i < 6; i++) { E.tick(S3, false); a(!D3.ask.some(x => x.type === 'sell'), 'لا سؤال خلال أسبوع من تولّيك'); } a(E.storeLoad(S3, 'riyadh') >= l3 - 1e-6 - 5);
  // اتركه لي: تذكير فقط ولا ينفّذ أبداً (30 يوماً)
  const S4 = hired(), D4 = S4.player.diwan; D4.rules.sell.mode = 'mine'; D4.rules.fill.mode = 'mine'; stale(S4, 'riyadh', 0.95); const l4 = E.storeLoad(S4, 'riyadh'); for (let i = 0; i < 30; i++) E.tick(S4, false); const ask4 = D4.ask.find(x => x.type === 'sell'); a(ask4 && ask4.remind === true && ask4.due === undefined, 'تذكير فقط'); a(!D4.log.some(l => l.kind === 'sell'), 'لا ينفّذ أبداً'); a(E.storeLoad(S4, 'riyadh') >= l4 - 1e-6 - 20, 'المخزن لم يُبَع منه بيد الناظر');
  const lb = E.storeLoad(S4, 'riyadh'); a(A.diwanAnswer(S4, ask4.id, 'do').ok); a.equal(E.storeLoad(S4, 'riyadh'), lb, 'الرد على التذكير لا ينفّذ شيئاً'); a(!S4.player.diwan.ask.some(x => x.id === ask4.id));
}

// 7) القواعد: التحقق، وتغيير الوضع إلى «نفّذ» يزيل التذكيرات
{
  const S = hired(), D = S.player.diwan; a.equal(A.diwanRule(S, 'zzz', 'exec').ok, false); a.equal(A.diwanRule(S, 'sell', 'zzz').ok, false); a.equal(A.diwanRule(S, 'sell', 'ask', 2).ok, false); a.equal(A.diwanRule(S, 'herd', 'ask', 3, -5).ok, false);
  a(A.diwanRule(S, 'sell', 'ask', 7).ok); a.equal(D.rules.sell.wait, 7); a(A.diwanRule(S, 'herd', 'exec', 1, 8000).ok); a.equal(D.rules.herd.max, 8000); a.equal(D.rules.herd.wait, 1);
  D.ask.push({ id: S.nextId++, type: 'sell', city: 'riyadh', text: 'x', day: S.day, remind: true }); a(A.diwanRule(S, 'sell', 'exec').ok); a.equal(D.ask.length, 0);
  // الأنواع الثابتة خارج القائمة: لا فعل للزكاة ولا للمشاريع
  a.deepEqual(Object.keys(E.DIWAN_TYPES), ['pay', 'fill', 'sell', 'herd']); a.equal(A.diwanRule(S, 'zakat', 'exec').ok, false); a.equal(A.diwanRule(S, 'invest', 'exec').ok, false);
}

// 8) تعبئة الدكاكين بالأمين (تدوير) عند الامتلاء
{
  const S = hired(), D = S.player.diwan, pr = S.player.props.riyadh, c = S.cities.riyadh; D.rules.fill.mode = 'exec'; D.rules.sell.mode = 'mine';
  const goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live && !(g in E.BREED)), old = goods[0], pick = goods[1]; for (const sh of pr.shops) sh.items = []; pr.shops[0].items = [{ g: old, price: 1.8, auto: false, buyBelow: 1.05, target: 60, sold: 0, revenue: 0, idleDays: 20 }];
  pr.store = { [pick]: Math.floor(E.storeCap(S, 'riyadh') * 0.95 / E.GD[pick].w) }; E.tick(S, false);
  a(!pr.shops[0].items.some(i => i.g === old) || pr.shops[0].items.some(i => i.g === pick), 'دوّر صنفاً من المخزن'); a(D.log.some(l => l.kind === 'fill' && /دوّرتُ/.test(l.text)));
}

// 9) صفقات كبير الرعاة من الخزينة بحد للصفقة
{
  const mk = () => { const S = hired(), pr = S.player.props.riyadh; a(A.buildFarm(S, 'riyadh').ok); S.player.chiefs = { sa: { since: S.day, next: S.day + 99, buy: false, budget: 0, mail: [], late: 0, paid: 0 } };
    const c = S.cities.riyadh, g = Object.keys(E.BREED).find(x => E.sells(c, x) && E.breedOpen(S, x) && !E.GD[x].hyb), est = Math.round(E.unitPrice(c, g) * 5 * 1.05);
    S.player.chiefs.sa.mail.push({ id: S.nextId++, day: S.day, country: 'sa', type: 'buy', city: 'riyadh', g, qty: 5, est, text: 'فرصة' }); return { S, g, est }; };
  { const { S, g, est } = mk(), D = S.player.diwan; D.rules.herd.mode = 'exec'; D.rules.herd.max = est + 10; D.box = 100000; const w = S.player.wallet; w.sar = 0; w.usd = 0; w.au = 0; const f = S.player.props.riyadh.farm, h0 = f.herd[g] || 0; S.day++; E.diwanDay(S);
    a((f.herd[g] || 0) > h0, 'اشترى للمزرعة'); a(D.box < 100000 && D.box > 100000 - est * 1.1, 'من الخزينة بقدر الصفقة'); a.equal(S.player.chiefs.sa.mail.length, 0); a(D.log.some(l => l.kind === 'herd')); a(S.player.wallet.sar < 1e-6 + 5, 'لا بقايا في المحفظة'); }
  { const { S, g, est } = mk(), D = S.player.diwan; D.rules.herd.mode = 'exec'; D.rules.herd.max = est - 1; D.box = 100000; S.player.wallet.sar = 0; S.day++; E.diwanDay(S); a.equal(S.player.chiefs.sa.mail.length, 1, 'فوق حد الصفقة: لا يشتري'); near(D.box, 100000); }
  { const { S, g, est } = mk(), D = S.player.diwan; D.rules.herd.mode = 'ask'; D.rules.herd.max = est + 10; D.box = 100000; S.player.wallet.sar = 0; S.day++; E.diwanDay(S); const q = D.ask.find(x => x.type === 'herd'); a(q, 'يسأل أولاً'); near(D.box, 100000); a(A.diwanAnswer(S, q.id, 'do').ok); a(D.box < 100000); }
  { const { S, g, est } = mk(), D = S.player.diwan; D.rules.herd.mode = 'exec'; D.rules.herd.max = est + 10; D.box = 10; S.player.wallet.sar = 0; S.day++; E.diwanDay(S); a.equal(S.player.chiefs.sa.mail.length, 1, 'الخزينة لا تكفي: لا شراء'); near(D.box, 10); near(S.player.wallet.sar, 0); }
}

// 10) المواعيد من الدوال القائمة: الزكاة، الدَّين، نفاد الخزينة
{
  const S = hired(), D = S.player.diwan; D.box = 1000; let r = E.diwanReminders(S); a(r.some(x => x.k === 'box'), 'قرب نفاد الخزينة'); D.box = 1e7; a(!E.diwanReminders(S).some(x => x.k === 'box'));
  S.zakat.start = S.day - (E.hawlLen(S, S.day) - 5); a(E.diwanReminders(S).some(x => x.k === 'zakat' && /بعد \d+ يوماً/.test(x.text)), 'حول الزكاة خلال 10 أيام'); S.zakat.start = S.day; a(!E.diwanReminders(S).some(x => x.k === 'zakat'));
  S.player.famDebt = { amt0: 1000, left: 500, plan: true, patience: 100, due: S.day + 5, mPaid: 0, paid: 0 }; a(E.diwanReminders(S).some(x => x.k === 'debt')); S.player.famDebt.due = S.day + 20; a(!E.diwanReminders(S).some(x => x.k === 'debt'));
  // أخبار مرة في الأسبوع فقط
  S.zakat.start = S.day - (E.hawlLen(S, S.day) - 5); S.news.length = 0; for (let i = 0; i < 3; i++) { S.day++; D.day = null; E.diwanDay(S); } a.equal(S.news.filter(n => /ناظر الديوان: يحول حول زكاتك/.test(n.t)).length, 1, 'خبر واحد لكل موعد في الأسبوع');
  // الزكاة لا تُفوَّض: لا فعل يخرج الزكاة
  a.equal(typeof A.diwanZakat, 'undefined'); const z = S.zakat; z.due = true; z.amount = 100; const w = S.player.wallet.sar; for (let i = 0; i < 5; i++) { S.day++; D.day = null; E.diwanDay(S); } a.equal(z.due, true, 'الزكاة لا تُخرَج بيد الناظر'); near(S.player.wallet.sar, w);
}

// 11) الحفظ والمفتاح
{
  const S = hired(); S.player.diwan.box = 12345; S.player.diwan.rules.sell.mode = 'mine'; const L = E.load(E.save(S)); a.equal(L.player.diwan.box, 12345); a.equal(L.player.diwan.rules.sell.mode, 'mine'); a.equal(J(E.diwanOf(L).idle), '{}');
  const bad = JSON.parse(E.save(S)); bad.player.diwan.rules = { sell: { mode: 'zzz', wait: 99 }, herd: { max: -4 } }; bad.player.diwan.ask = [null, { id: 1, type: 'fake', day: 0, text: 'x' }, { id: 7, type: 'sell', city: 'riyadh', day: 1, due: 5, text: 'ok' }]; bad.player.diwan.log = [{ d: 'x' }, { d: 1, text: 'y', amount: 3 }];
  const B = E.load(JSON.stringify(bad)).player.diwan; a.equal(B.rules.sell.mode, 'ask'); a.equal(B.rules.sell.wait, 3); a.equal(B.rules.herd.max, 5000); a.equal(B.ask.length, 1); a.equal(B.log.length, 1);
  const bad2 = JSON.parse(E.save(S)); bad2.player.diwan = { box: -5, since: 'x' }; a.equal(E.load(JSON.stringify(bad2)).player.diwan, undefined); const bad3 = JSON.parse(E.save(S)); bad3.player.diwan = 'x'; a.equal(E.load(JSON.stringify(bad3)).player.diwan, undefined);
  const old = JSON.parse(E.save(game())); a.equal(old.player.diwan, undefined); a(E.load(JSON.stringify(old)));
  // المفتاح: بلا ناظر لا أثر، وبوجوده مع الإطفاء لا نشاط ولا خصم أجر
  const base = () => { const T = game(); T.player.props = {}; return T; }; const X = base(), Y = base(); E.DIWAN.on = false; for (let i = 0; i < 20; i++) { E.tick(X, false); } E.DIWAN.on = true; for (let i = 0; i < 20; i++) { E.tick(Y, false); } a.equal(E.save(X), E.save(Y), 'بلا ناظر: خط الأساس لا يتغير بالمفتاح');
  E.DIWAN.on = false; const q = E.diwanQuote(S); a.equal(A.hireDiwan(game()).ok, false); const Hs = hired === 0 ? null : null; const Z = E.load(E.save(S)); const b0 = Z.player.diwan.box, w0 = Z.player.wallet.sar; for (let i = 0; i < 5; i++) E.tick(Z, false); near(Z.player.diwan.box, b0, 'المفتاح مطفأ: لا أجر ولا نشاط'); E.DIWAN.on = true;
}
console.log('PASS diwan: price/hire, box+zakat+networth, wage/quit, cover order, SC-001 180 days, SC-002 exec, SC-003 ask/mine, rules, fill, herd deals, reminders, no zakat delegation, old/bad saves, off switch');
