'use strict';
// 040و السيولة: سحب تلقائي من الودائع لسداد الالتزامات (رسم 1٪ بالضبط)، حدّ monthMax، النقد الوفير بلا تدخل، payout، قاعدة الناظر draw، الإطفاء بلا حقول جديدة، الحفظ القديم
const a = require('node:assert/strict'), { E, load, rich, run } = require('./lib/skill-sim.js'), A = E.A, L = E.LIQ;
a.equal(L.on, true); a.equal(L.fee, E.FIN ? E.FIN.mud.fee : 0.01); a.equal(L.monthMax, 0.4); a.equal(L.warnDays, 7); a.equal(L.horizon, 14);
let W = 0, F = 0; const d0 = A.divest; A.divest = (S, c, amt) => { const b = S.player.bank.dep[c] || 0, r = d0(S, c, amt); const t = b - (S.player.bank.dep[c] || 0); W += t; F += t * 0.01; return r; };
function banker(cash = 50) { const S = rich(load('autopilot-23')), P = S.player, pr = P.props[Object.keys(P.props)[0]]; while (pr.shops.length < 4) pr.shops.push({ id: S.nextId++, items: [], kind: 'own', since: S.day });
  for (const k of Object.keys(P.wallet)) P.wallet[k] = 0; P.wallet.sar = cash; P.bank.dep = Object.fromEntries(S.order.slice(0, 5).map(c => [c, 2e5])); return S; }
const staff = S => Object.values(S.player.props).reduce((n, p) => n + (p.staff ? p.staff.length : 0), 0), dues = S => (S.paymentDues || []).reduce((t, d) => t + (d.amount || 0), 0), depT = S => Object.values(S.player.bank.dep).reduce((x, y) => x + y, 0);
// 1) الإطفاء: السلوك السابق (متأخرات وعمال يغادرون) ولا حقل جديد في الحفظ
{ L.on = false; try { W = F = 0; const S = banker(), s0 = staff(S); run(S, 200); a(dues(S) > 0, 'قبل: متأخرات'); a(staff(S) < s0, 'قبل: عمال يغادرون'); a.equal(W, 0); const j = E.save(S); for (const k of ['liqLog', 'liqM', 'liqAcc', '"liq"']) a(!j.includes(k), 'حقل جديد في الحفظ: ' + k); const dr = S.player.diwan; a(!dr || !dr.rules.draw); } finally { L.on = true; } }
// 2) سيناريو المصرفي: لا متأخرات ولا مغادرة، الرسم = 1٪ من المسحوب، والدفتر
{ W = F = 0; const S = banker(), s0 = staff(S), m0 = S.player.led.inc.mudaraba || 0, e0 = { ...S.player.led.exp }; run(S, 360); a.equal(dues(S), 0, 'لا متأخرات'); a.equal(staff(S), s0, 'لا مغادرة'); a(W > 1000, 'سُحب: ' + W); a(Math.abs(F - W * 0.01) < 1e-9);
  const log = S.player.liqLog; a(log.length > 0 && log.length <= L.logMax); for (const x of log) a(Math.abs(x.fee - x.amt * 0.01) < 1e-9, 'الرسم 1٪'); a(log.every(x => x.why === 'auto'));
  const wages = S.player.led.exp.staff - (e0.staff || 0), up = S.player.led.exp.upkeep - (e0.upkeep || 0); a(Math.abs(W * 0.99 + 50 - (wages + up)) < 0.01 * (wages + up), 'المسحوب الصافي يغطي الأجور والصيانة: ' + (W * 0.99 + 50) + ' مقابل ' + (wages + up)); const v = E.liqView(S); a(v && v.dep > 0 && v.depNet === v.dep * 0.99 && Number.isFinite(v.days));
  a((S.player.led.inc.mudaraba || 0) - m0 > 0); const j = JSON.parse(E.save(S)); a(Array.isArray(j.player.liqLog)); const T = E.load(E.save(S)); run(T, 30); a.equal(dues(T), 0, 'الحفظ يكمل'); }
// 3) النقد وفير: لا سحب ولا رسم
{ W = F = 0; const S = banker(2e6); run(S, 200); a.equal(W, 0); a.equal(F, 0); a.equal(S.player.liqLog, undefined); a.equal(dues(S), 0); const v = E.liqView(S); a(!v.low); }
// 4) monthMax يُحترم: لا يُسحب تلقائياً فوق الحد، ويظهر تنبيه
{ W = F = 0; const S = banker(); A.liqSet(S, 'monthMax', 0.0001); const dep0 = depT(S); run(S, 25); a(W <= dep0 * 0.0001 + 1e-6, 'سقف الشهر: ' + W); a(dues(S) > 0, 'يبقى عجز دون سحب إضافي'); a(S.news.some(n => /حدّه الشهري/.test(n.t)), 'تنبيه الحد');
  const S2 = banker(); a(A.liqSet(S2, 'monthMax', 2).ok === false); a(A.liqSet(S2, 'xx', 1).ok === false); a(A.liqSet(S2, 'cover', false).ok); W = 0; run(S2, 30); a.equal(W, 0, 'cover=false: لا سحب'); a(dues(S2) > 0);
  const S3 = banker(); a(A.liqSet(S3, 'monthMax', 1).ok); W = 0; run(S3, 30); a(W > 0); }
// 5) payout: أرباح المضاربة تصل النقد شهرياً بالمقدار نفسه الذي كان يُضاف للوديعة
{ const S = E.newGame(4); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.phase = 4; S.player.wallet.sar = 100000; S.player.bank.dep = { riyadh: 50000 }; a(A.liqSet(S, 'payout', true).ok);
  const cash0 = S.player.wallet.sar, inc0 = S.player.led.inc.mudaraba || 0; for (let i = 0; i < 90; i++) { E.tick(S, false); S.pause = false; if (S.day % 30 === 0) break; } while (S.day % 30 !== 0) { E.tick(S, false); S.pause = false; }
  const inc = (S.player.led.inc.mudaraba || 0) - inc0, loss = S.player.led.exp.mudarabaLoss || 0; a(inc > 0); a(Math.abs(S.player.bank.dep.riyadh - (50000 - loss)) < 1e-6, 'الوديعة لم تتغير'); const costs = Object.entries(S.player.led.exp).filter(([k]) => k !== 'mudarabaLoss').reduce((t, [, v]) => t + v, 0);
  a(Math.abs(S.player.wallet.sar + (S.player.liqAcc || 0) - cash0 - inc + costs) < 1e-6 || S.player.wallet.sar > cash0, 'الأرباح في النقد'); a(S.player.wallet.sar > cash0, 'وصل النقد شهرياً');
  a(A.liqSet(S, 'payout', false).ok); E.tick(S, false); a.equal(S.player.liqAcc, 0, 'عند الإيقاف يُفرَّغ المتراكم'); }
// 6) ناظر الديوان: قاعدة draw (exec يسحب إلى الخزينة، ask يسأل)، والناظر القديم بلا القاعدة يعمل
{ const mk = () => { const S = banker(1e5); const P = S.player; P.diwan = { since: S.day, box: 0, rules: E.diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 }; P.fixedEma = 500; P.phase = 4; S.phase = 4; return S; };
  const S = mk(); a(!S.player.diwan.rules.draw, 'ناظر جديد: لا حقل جديد في الافتراضيات'); a.equal(E.diwanView(S).rules.draw.mode, 'ask');
  const old = mk(); delete old.player.diwan.rules.draw; const v = E.diwanView(old); a(v.rules.draw && v.rules.draw.mode === 'ask', 'ناظر قديم: الافتراضي'); a(A.diwanRule(old, 'draw', 'exec').ok); a.equal(old.player.diwan.rules.draw.mode, 'exec'); a(A.diwanRule(old, 'zz', 'exec').ok === false);
  W = 0; E.tick(old, false); old.pause = false; a(W > 0, 'exec: سُحب'); a(old.player.diwan.log.some(l => l.kind === 'draw'), 'سجل الناظر'); const need = old.player.fixedEma * 14; a(old.player.diwan.box > 0 && old.player.diwan.box <= need * 1.01 + 1, 'الخزينة تقارب الالتزامات: ' + old.player.diwan.box);
  A.diwanRule(S, 'draw', 'ask', 1); E.tick(S, false); S.pause = false; a(S.player.diwan.ask.some(x => x.type === 'draw'), 'ask: سؤال'); a.equal(S.player.diwan.box < 1, true); for (let i = 0; i < 3; i++) { E.tick(S, false); S.pause = false; } a(S.player.diwan.box > 0, 'بعد المهلة ينفّذ'); }
// 7) الحفظ القديم (بلا P.liq ولا liqLog) يعمل بالافتراضي
{ const S = banker(); run(S, 5); const j = JSON.parse(E.save(S)); delete j.player.liq; delete j.player.liqLog; delete j.player.liqM; const T = E.load(JSON.stringify(j)); a(T); run(T, 40); a.equal(dues(T), 0); const v = E.liqView(T); a(v.pol.cover === true && v.pol.payout === false && v.pol.monthMax === 0.4); }
A.divest = d0;
console.log('PASS liquidity: auto-cover from deposits (1% fee exact), monthMax, cash-rich idle, payout, diwan draw rule, off switch (no new fields), old save');
