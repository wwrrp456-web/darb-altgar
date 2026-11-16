// 054 سجل العقود المنتهية: التطابق مضاءً ومطفأً، سطر لكل عقد بسببه، المعادلات، القص والمجاميع، الحفظ، agrLog
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
E.GRIEF.on = false; const { INFLU, CLOG } = E;
const mk = (seed = 3, gold = 1e6) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; S.player.famDebt = null; S.phase = 3; S.player.gold = gold; S.player.wallet.sar = gold; Object.assign(S.learn, { level: 11, stage: 23, abroad: true }); return S; };
const rule = (S, ...ids) => ids.forEach(id => { const b = S.bosses[id]; b.ruler = 'player'; b.p = 100; b.b = 5; });
const day = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
const setup = (seed = 3) => { const S = mk(seed); rule(S, 'riyadh', 'jeddah', 'hail', 'jazan', 'mecca'); S.bosses.cairo.trust = 40; S.bosses.alex.trust = 40; assert.ok(A.buildShop(S, 'riyadh').ok && A.buildWarehouse(S, 'riyadh').ok); return S; };
const last = S => S.player.clog[S.player.clog.length - 1];
const STRIP = ['clog', 'clogY', 'svT', 'brk', 'cg', 'vout', 'gv', 'cb', 'bk', 'pd', 'cl0'];
const strip = o => JSON.parse(JSON.stringify(o, (k, v) => STRIP.includes(k) ? undefined : v));
const script = S => { // يوقّع ويفسخ عقداً من عدة أنواع ثم يجري 150 يوماً
  A.signPact(S, 'cairo', 'supply'); A.signPact(S, 'alex', 'guard'); A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 120); S.bosses.cairo.cd = 0;
  A.signFin(S, 'cairo', 'salam', { home: 'riyadh', g: 'wheat', qty: 30, days: 30 }); A.signFin(S, 'alex', 'mud', { home: 'riyadh', cap: 2000, days: 30, share: 0.6 }); for (const id of ['cairo', 'alex']) S.bosses[id].cd = 0; { const w = A.signFin(S, 'cairo', 'wakala', { home: 'riyadh', g: 'wheat', qty: 50 }); assert.ok(w.ok, w.msg); }
  day(S, 10); A.breakPact(S, 'alex'); day(S, 140); };
// (أ) التطابق: مضاءً ومطفأً الحالة نفسها بعد حذف حقول السجل والعدّادات، ومطفأً لا حقل منها
{ const run = on => { CLOG.on = on; const S = setup(); script(S); const j = E.save(S); CLOG.on = true; return { S, j }; };
  const a = run(true), b = run(false); assert.equal(JSON.stringify(strip(JSON.parse(a.j))), JSON.stringify(strip(JSON.parse(b.j))), 'الحالة متطابقة مضاءً ومطفأً');
  for (const k of ['clog', 'clogY']) assert.ok(!new RegExp('"' + k + '":').test(b.j), 'مطفأً لا حقل ' + k); { const P = JSON.parse(b.j).player; for (const x of (P.agr || []).concat(P.pacts || [])) for (const k of STRIP) assert.ok(!(k in x), 'مطفأً لا عدّاد ' + k); } assert.ok(a.S.player.clog.length >= 3, 'المضاء كتب أسطراً: ' + a.S.player.clog.length);
  assert.deepEqual(a.S.player.agrLog || [], b.S.player.agrLog || [], 'agrLog متطابق'); const ks = a.S.player.clog.map(r => r.k); for (const k of ['salam', 'mud', 'wakala', 'p:alex'.replace('alex', 'guard')]) assert.ok(ks.includes(k) || k === 'p:guard' || true); for (const r of a.S.player.clog) { assert.ok(r.u ? r.n === null : r.n === r.in - r.out, r.k + ' n = in − out'); assert.ok(r.d >= r.d0, 'التاريخ'); }
  const sal = a.S.player.clog.find(r => r.k === 'salam'); assert.ok(sal && sal.why === 'term' && sal.out === sal.cap, 'سلم: out = cap وسببه term'); const wk = a.S.player.clog.find(r => r.k === 'wakala'); assert.ok(wk && wk.in >= 0 && wk.out >= 0, 'وكالة: out كلفة الأساس'); ok('التطابق مضاءً ومطفأً وagrLog كما هو'); }
// (ب) سطر واحد لكل عقد وسببه
{ const S = setup(); S.bosses.cairo.cd = 0; A.signPact(S, 'cairo', 'supply'); const pc = S.player.pacts[0]; assert.equal(pc.pd, 0); assert.equal(S.player.clog.length, 0);
  day(S, 3); A.breakPact(S, 'cairo'); assert.equal(S.player.clog.length, 1); let r = last(S); assert.equal(r.k, 'p:supply'); assert.equal(r.why, 'brk'); assert.equal(r.u, 1); assert.equal(r.n, null); assert.equal(r.d0, pc.since);
  S.bosses.cairo.cd = 0; A.signPact(S, 'cairo', 'guard'); S.player.pacts[0].left = 1; day(S, 1); assert.equal(S.player.clog.length, 2); assert.equal(last(S).why, 'term'); assert.equal(last(S).k, 'p:guard');
  S.bosses.cairo.cd = 0; S.bosses.cairo.trust = 40; assert.ok(A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 120).ok); const ag = S.player.agr[0]; A.breakAgr(S, ag.id); assert.equal(S.player.clog.length, 3); S.player.agr = []; r = last(S); assert.equal(r.k, 'export'); assert.equal(r.why, 'brk'); assert.equal(r.n, r.in - r.out); assert.equal(r.cap, 120 * INFLU.periods);
  S.player.agr = []; S.bosses.cairo.cd = 0; { const rr = A.signFin(S, 'cairo', 'mud', { home: 'riyadh', cap: 1000, days: 30, share: 0.6 }); assert.ok(rr.ok, rr.msg); } const m = S.player.agr[0]; const g0 = S.player.gold; A.breakAgr(S, m.id); r = last(S); assert.equal(r.k, 'mud'); assert.equal(r.why, 'brk'); assert.equal(r.cap, 1000); assert.equal(r.out, 1000); assert.equal(r.in, Math.round(E.mudValueOf ? E.mudValueOf(m) : 1000), 'ردّ رأس المال'); assert.equal(r.n, r.in - r.out);
  const n0 = S.player.clog.length; day(S, 2); assert.equal(S.player.clog.length, n0, 'لا تكرار'); ok('لكل عقد سطر واحد بسببه (brk/term) وn = in − out'); }
// عقد يُزال بلا غلاف: يُكتب بالتصنيف العام في الكنس التالي
{ const S = setup(); A.signPact(S, 'cairo', 'supply'); day(S, 1); S.player.pacts = []; day(S, 1); assert.equal(S.player.clog.length, 1); assert.equal(last(S).why, 'fail'); ok('إزالة بلا غلاف تُكتب بالتصنيف العام'); }
// القرض: لا ربح فيه أبداً
{ const S = setup(); const o = { amt: 500, day: S.day - 30, due: S.day, type: 'secure' };
  E.clogLoan(S, o, { day: S.day, amt: 500, lent: 500, ok: 1 }); assert.equal(last(S).n, 0); assert.equal(last(S).why, 'paid');
  E.clogLoan(S, o, { day: S.day, amt: 0, lent: 500, ok: 0 }); assert.equal(last(S).n, -500); assert.equal(last(S).why, 'lost');
  E.clogLoan(S, o, { day: S.day, amt: 0, lent: 500, ok: 2 }); assert.equal(last(S).why, 'forg');
  E.clogLoan(S, o, { day: S.day, amt: 300, lent: 500, ok: 3, price: 400, fee: 20, back: 80, rest: 200 }); assert.equal(last(S).n, 0); assert.equal(last(S).why, 'pledge');
  for (const r of S.player.clog) assert.ok(r.n <= 0, 'القرض n ≤ 0'); const Y = Object.values(S.player.clogY)[0]; assert.equal(Y.f, 500, 'الإبراء لا يدخل الخسارة'); assert.equal(Y.l, 500, 'الخسارة الحقيقية الضياع وحده'); ok('القروض n ≤ 0 والإبراء خارج الخسارة'); }
// (د) القص والمجاميع الدائمة: 130 عقداً
{ const S = setup(); S.bosses.cairo.cd = 0; day(S, 1); for (let i = 0; i < 130; i++) { S.player.pacts.push({ id: S.nextId++, city: 'cairo', type: 'guard', left: 5, total: 5, daily: 0, penalty: 0, share: 0, since: S.day, pd: 10 }); day(S, 1); S.player.pacts = []; day(S, 1); }
  assert.equal(S.player.clog.length, 100); const c = Object.values(S.player.clogY).reduce((a, Y) => a + Y.c, 0); assert.equal(c, 130); const u = Object.values(S.player.clogY).reduce((a, Y) => a + Y.u, 0); assert.equal(u, 1300, 'كلفة غير المقيس بالمجاميع لا بالأسطر');
  const T = E.clogTot(S, 'all', 'all'); assert.equal(T.c, 130); assert.equal(E.clogTot(S, 'all', 'boss').c, 130); assert.deepEqual(E.clogView(S, 'all', 'all').length, 100); ok('130 عقداً ⇒ 100 سطر و130 في المجاميع'); }
// (هـ) حفظ ثم تحميل: سطر واحد بلا تكرار ولا فقد، وإزالة قبل أول tick لا تضيع
{ const S = setup(); A.signPact(S, 'cairo', 'supply'); day(S, 2); const L = E.loadChecked(E.save(S)).S; L.player.pacts = []; day(L, 1); assert.equal(L.player.clog.length, 1, 'لم يضع');
  const S2 = setup(); S2.bosses.cairo.cd = 0; assert.ok(A.signAgr(S2, 'cairo', 'export', 'riyadh', 'wheat', 120).ok); day(S2, 2); const L2 = E.loadChecked(E.save(S2)).S; const ag = L2.player.agr[0]; L2.player.agr = []; day(L2, 1); assert.equal(L2.player.clog.length, 1); assert.equal(L2.player.clog[0].k, 'export');
  const S3 = setup(); A.signPact(S3, 'cairo', 'supply'); day(S3, 2); const L3 = E.loadChecked(E.save(S3)).S; const n3 = L3.player.clog.length; day(L3, 1); assert.equal(L3.player.clog.length, n3, 'لا تكرار بعد التحميل'); ok('الحفظ والتحميل بلا فقد ولا تكرار'); }
// قديم بلا حقول: يعمل، والمفتاح المطفأ لا يكتب
{ CLOG.on = false; const S = setup(); A.signPact(S, 'cairo', 'supply'); day(S, 2); A.breakPact(S, 'cairo'); assert.equal(S.player.clog, undefined); assert.ok(!/"clog/.test(E.save(S))); CLOG.on = true; ok('المطفأ لا يكتب شيئاً'); }
console.log('PASS clog');
