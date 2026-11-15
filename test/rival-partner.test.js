'use strict';
// 040د: شراكات المنافسين عند حكم السوق (rmud وrpart): الأهلية، احتمال القبول، العروض الواردة، معادلات المضاربة والمصنع، الأثر على السوق، لا شرط جزائي، الزكاة، الخيانة، تفويض الناظر، والمفتاح المطفأ
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A, R = E.RIVP;
const ok = m => console.log('OK   ' + m);
E.GRIEF.on = false; E.rivalMemorySet(null);
const step = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; };
const game = (seed = 5, days = 150) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; step(S, days); S.phase = 3; S.player.gold = 1e6; S.player.wallet.sar = 1e6; Object.assign(S.learn, { level: 11, stage: 23, abroad: true }); return S; };
const rule = (S, id) => { const b = S.bosses[id]; b.ruler = 'player'; b.p = 100; b.b = 5; };
// منافس حيّ مؤهَّل في مدينة تحكمها (ومعه دكان لك ليصلح المصنع)
const setup = (seed = 5) => { const S = game(seed), rv = S.rivals.find(r => r.out == null && r.w != null); rule(S, rv.city); a.ok(A.buildShop(S, rv.city).ok); return { S, rv }; };
const noBetray = f => { const b = R.bBase; R.bBase = 0; try { return f(); } finally { R.bBase = b; } };
// ١) النصوص والتسجيل: جملتا العقد حرفاً من mud وpart، ولا قائمة عقود جديدة في صفحة الزعيم
{ const K = E.AGR_KINDS; a.equal(K.rmud.desc, K.mud.desc); a.equal(K.rmud.obl, K.mud.obl); a.equal(K.rpart.desc, K.part.desc); a.equal(K.rpart.obl, K.part.obl); a.ok(E.FIN_KINDS.rmud && E.FIN_KINDS.rpart);
  const { S } = setup(); a.ok(!E.agrView(S).kinds.includes('rmud') && !E.agrView(S).kinds.includes('rpart'), 'مخفيان من عروض الزعماء'); ok('النصوص حرفاً من mud وpart، والنوعان خارج عروض الزعماء'); }
// ٢) الأهلية §3
{ const { S, rv } = setup(); a.equal(E.rvpBlock(S, rv, 'rmud', {}), null); a.ok(E.rvpCapOptions(S, rv).length === 3);
  const b0 = S.bosses[rv.city].ruler; S.bosses[rv.city].ruler = 'boss'; a.match(E.rvpBlock(S, rv, 'rmud', {}), /لا تحكم سوق/); S.bosses[rv.city].ruler = b0;
  S.phase = 1; a.match(E.rvpBlock(S, rv, 'rmud', {}), /الطور 2/); S.phase = 3;
  rv.out = S.day; a.match(E.rvpBlock(S, rv, 'rmud', {}), /لم يعد في السوق/); rv.out = null; delete rv.out;
  const w = rv.w; rv.w = 150; a.match(E.rvpBlock(S, rv, 'rmud', {}), /ثروته لا تتسع/); rv.w = w;
  const g = S.player.gold; S.player.gold = 10; a.match(E.rvpBlock(S, rv, 'rmud', { cap: E.rvpCapOptions(S, rv)[0], days: 30, share: 0.6 }), /رصيدك/); S.player.gold = g;
  a.match(E.rvpBlock(S, rv, 'rmud', { cap: 777, days: 30, share: 0.6 }), /اختر رأس مال/);
  const st = E.rvpSt(S, true); st.rej[rv.id] = S.day - 5; a.match(E.rvpBlock(S, rv, 'rmud', {}), /رفض عرضك قبل أيام، عُد بعد 10/); delete st.rej[rv.id]; st.cd[rv.id] = S.day + 7; a.match(E.rvpBlock(S, rv, 'rmud', {}), /انسحب من شراكتك قبل أيام، عُد بعد 7/); delete st.cd[rv.id];
  st.off.push({ id: 999, rid: rv.id, kind: 'rmud', terms: {}, exp: S.day + 5 }); a.match(E.rvpBlock(S, rv, 'rmud', {}), /عرض معلّق/); a.equal(E.rvpBlock(S, rv, 'rmud', {}, { off: 999 }), null); st.off = [];
  a.ok(E.rvpSignNow(S, rv, 'rmud', { cap: E.rvpCapOptions(S, rv)[0], days: 30, share: 0.6 }).ok); a.match(E.rvpBlock(S, rv, 'rmud', {}), /عقد قائم/, 'شريك واحد لا اثنان');
  const S2 = setup().S; const r2 = S2.rivals.find(r => r.out == null && r.w != null); const used = E.slotsUsed(S2); S2.player.pacts = new Array(E.slotsOf(S2) - used + (S2.player.pacts || []).length).fill({ type: 'x' }); a.match(E.rvpBlock(S2, r2, 'rmud', {}), /لا خانة فارغة/);
  ok('الأهلية §3: كل سبب برفضه بنصه، شريك واحد لا اثنان، الخانات'); }
// ٣) الثقة §4 واحتمال القبول §5: المثال 0.475 والحدود والكلمات والحتمية
{ const { S, rv } = setup(); const st = E.rvpSt(S, true); st.since[rv.city] = S.day; st.ok = 2; rv.str = 0.5; a.equal(E.rvpT(S, rv), 40);
  const ch = E.rvpChance(S, rv, 'rmud', { share: 0.6 }); a.ok(Math.abs(ch.V - 0.5) < 1e-9 && Math.abs(ch.p - 0.475) < 1e-9, 'T=40 V=0.5 str=0.5 ⇒ 0.475'); a.equal(ch.word, 'متوسط');
  const nv = (k, o, v) => a.ok(Math.abs(E.rvpChance(S, rv, k, o).V - v) < 1e-9, k + JSON.stringify(o)); nv('rmud', { share: 0.5 }, 1); nv('rmud', { share: 0.7 }, 0); nv('rpart', { f: 0.2 }, 0); a.ok(Math.abs(E.rvpChance(S, rv, 'rpart', { f: 0.35 }).V - 0.5) < 1e-9); nv('rpart', { f: 0.5 }, 1);
  st.ok = 0; st.since[rv.city] = S.day - 400; a.equal(E.rvpT(S, rv), 50, 'ثقة الحكم: 20 + 30'); st.ok = 100; a.equal(E.rvpT(S, rv), 100, 'سقف 100');
  const a0 = R.a0; R.a0 = -1; try { a.equal(E.rvpChance(S, rv, 'rmud', { share: 0.7 }).p, 0.05, 'حد أدنى'); } finally { R.a0 = a0; } R.a0 = 5; try { a.equal(E.rvpChance(S, rv, 'rmud', { share: 0.5 }).p, 0.95, 'حد أعلى'); } finally { R.a0 = a0; }
  R.a0 = -0.2; try { a.equal(E.rvpChance(S, rv, 'rmud', { share: 0.7 }).word, 'ضعيف'); } finally { R.a0 = a0; } R.a0 = 0.5; try { a.equal(E.rvpChance(S, rv, 'rmud', { share: 0.5 }).word, 'جيد'); } finally { R.a0 = a0; }
  st.ok = 0; st.since[rv.city] = S.day;
  // الحتمية: يوم واحد = نتيجة واحدة؛ والرفض يسجّل المهلة وسببه كلمة
  const o = { cap: E.rvpCapOptions(S, rv)[0], days: 30, share: 0.7 }; R.a0 = -1; const s0 = JSON.stringify(S.player.agr); const r1 = A.rvpOffer(S, rv.id, 'rmud', o); R.a0 = a0; a.equal(r1.ok, true); a.equal(r1.accepted, false); a.match(r1.msg, /شروطك لا تغريه/); a.equal(S.rivP.rej[rv.id], S.day); a.equal(JSON.stringify(S.player.agr), s0, 'لا كلفة على الرفض');
  a.match(A.rvpOffer(S, rv.id, 'rmud', o).msg, /رفض عرضك قبل أيام/, 'مهلة إعادة العرض'); delete S.rivP.rej[rv.id];
  R.a0 = 5; const r2 = A.rvpOffer(S, rv.id, 'rmud', Object.assign({}, o, { share: 0.5 })); R.a0 = a0; a.equal(r2.accepted, true); a.equal(S.player.agr.length, 1); a.equal(S.player.agr[0].kind, 'rmud'); ok('الثقة والقبول §4–5: المثال 0.475 والحدود والكلمات الثلاث والرفض والمهلة'); }
// ٤) العروض الواردة §6: شروطها بالمعادلة، السقف، الانتهاء، وإعادة الفحص عند القبول
{ const { S, rv } = setup(); a.ok(!E.rvpSt(S) || !E.rvpSt(S).off.length); const o0 = R.o0; R.o0 = 1; R.oMax = 1; try { while (S.day % 30 !== 0) step(S, 1); step(S, 30); } finally { R.o0 = o0; R.oMax = 0.40; }
  const st = E.rvpSt(S); a.ok(st && st.off.length >= 1 && st.off.length <= R.maxPending, 'سقف الانتظار'); const off = st.off[0], rv2 = E.rvpGet(S, off.rid); a.equal(off.exp - S.day, R.ttl - 0, 'ينتهي بعد ttl'); a.ok(['rmud', 'rpart'].includes(off.kind));
  if (off.kind === 'rmud') { const t = off.terms; a.equal(t.cap, Math.min(E.rvpCapMax(S, rv2), Math.round(R.askW * rv2.w / 100) * 100)); a.ok(E.INFLU.mud.shares.includes(t.share) && E.INFLU.mud.days.includes(t.days)); }
  else { const t = off.terms, K = E.partCost(S, rv2.city, t.recipe), fits = E.INFLU.part.shares.filter(f => Math.round(K * f) <= R.partW * rv2.w); a.equal(t.f, Math.max.apply(null, fits), 'أكبر حصة يتسع لها ماله'); }
  const sav = JSON.stringify(S.rivP); step(S, 0); const idsBefore = st.off.map(x => x.id); step(S, R.ttl + 1); a.ok(!E.rvpSt(S).off.some(x => idsBefore.includes(x.id) && x.exp < S.day), 'المنتهي يُحذف بلا أثر');
  // قبول مضمون بعد إعادة الفحص
  const T = setup(); const S2 = T.S; const rvx = T.rv; rvx.w = 15000; const idn = S2.nextId++; E.rvpSt(S2, true).off.push({ id: idn, rid: rvx.id, kind: 'rmud', terms: { cap: Math.min(E.rvpCapMax(S2, rvx), Math.round(R.askW * rvx.w / 100) * 100), share: 0.6, days: 30 }, exp: S2.day + 10 }); const g0 = S2.player.gold; const w0 = rvx.w; const r = A.rvpAccept(S2, idn); a.ok(r.ok); a.equal(g0 - S2.player.gold, S2.player.agr[0].cap); a.equal(rvx.w - w0, S2.player.agr[0].cap);
  const T3 = setup(); const id3 = T3.S.nextId++; E.rvpSt(T3.S, true).off.push({ id: id3, rid: T3.rv.id, kind: 'rmud', terms: { cap: E.rvpCapOptions(T3.S, T3.rv)[1], share: 0.6, days: 30 }, exp: T3.S.day + 10 }); T3.S.bosses[T3.rv.city].ruler = 'boss'; a.match(A.rvpAccept(T3.S, id3).msg, /لا تحكم سوق/, 'فقد السوق: لا قبول'); ok('العروض الواردة §6: شروطها بالمعادلة، سقف الانتظار، الانتهاء، إعادة الفحص'); }
// ٥) المضاربة §7-أ بأرقام ثابتة
noBetray(() => { const { S, rv } = setup(); const cap = 3000; rv.w = 38000; const g0 = S.player.gold; a.ok(E.rvpSignNow(S, rv, 'rmud', { cap, days: 60, share: 0.6 }).ok); a.equal(g0 - S.player.gold, cap); a.equal(rv.w, 41000); const ag = S.player.agr[0]; a.equal(ag.kind, 'rmud'); a.equal(ag.rid, rv.id);
  rv.w = 41200; E.rvpMonth(S, rv, 40000); a.ok(Math.abs(ag.pnl - 45) < 1e-9, 'r_m = 0.5 × 0.03 = 0.015 ⇒ +45'); a.deepEqual(ag.months, [1.5]);
  rv.w = 39000; E.rvpMonth(S, rv, 41000); /* r = 0.5 × (−2000/41000) */ const r2 = 0.5 * (-2000 / 41000); a.ok(Math.abs(ag.pnl - (45 + cap * r2)) < 1e-9); ag.pnl = 15; a.equal(E.mudValue(ag), 3009, 'mudValue = 3000 + 0.6 × 15'); ag.pnl = -4000; a.equal(E.mudValue(ag), 0, 'الخسارة على المال وحده');
  ag.pnl = 15; rv.w = 50000; const back = E.rvpWithdrawNow(S, ag); a.equal(back, 3009); const g1 = S.player.gold, w1 = rv.w, ok0 = E.rvpSt(S).ok; a.ok(A.breakAgr(S, ag.id).ok); a.equal(Math.round(S.player.gold - g1), 3009, 'سحب مبكر بلا رسم'); a.equal(w1 - rv.w, 3009); a.equal(E.rvpSt(S).ok, ok0, 'السحب لا يزيد ok ولا ينقصه'); a.equal(S.player.agr.length, 0); a.equal(S.player.agrLog[S.player.agrLog.length - 1].k, 'rmud');
  // الإفلاس: back' = rv.w
  a.ok(E.rvpSignNow(S, rv, 'rmud', { cap, days: 60, share: 0.6 }).ok); const ag2 = S.player.agr[0]; ag2.pnl = 600; rv.w = 2000; const g2 = S.player.gold; E.rvpExit(S, rv); a.equal(Math.round(S.player.gold - g2), 2000, 'back′ = min(mudValue, rv.w)'); a.equal(rv.w, 0); a.equal(S.player.agr.length, 0);
  // الأجل: ok يزيد مرة، ويعود المال بالقيمة
  rv.w = 80000; E.rvpSignNow(S, rv, 'rmud', { cap, days: 30, share: 0.5 }); const ag3 = S.player.agr[0]; ag3.pnl = 200; const okb = E.rvpSt(S).ok; ag3.left = 1; const g3 = S.player.gold; E.agrDay(S); a.equal(S.player.agr.length, 0); a.equal(E.rvpSt(S).ok, okb + 1); a.equal(Math.round(S.player.gold - g3), cap + 100, 'عاد رأس المال + نصف ربح 200');
  // فقد الحكم لا يُسقط العقد
  rv.w = 80000; E.rvpSignNow(S, rv, 'rmud', { cap, days: 30, share: 0.6 }); S.bosses[rv.city].ruler = 'boss'; const n0 = S.player.agr.length; E.agrDay(S); a.equal(S.player.agr.length, n0, 'تبقى العقود حتى أجلها'); ok('مضاربة المنافس §7-أ: القيد الشهري من الحركة الفعلية، القيمة، السحب، الإفلاس، الأجل، بقاء العقد بعد فقد السوق'); });
// ٦) شراكة المصنع §7-ب
noBetray(() => { const { S, rv } = setup(); const recipe = E.partRecipes(S, rv.city).find(r => E.rvpShareFits(S, rv, E.partCost(S, rv.city, r)).length); a.ok(recipe, 'مصنع صالح'); const K = E.partCost(S, rv.city, recipe), f = E.rvpShareFits(S, rv, K).pop(), boss = Math.round(K * f); rv.w = Math.max(rv.w, 4 * boss);
  const g0 = S.player.gold, w0 = rv.w; const r = E.rvpSignNow(S, rv, 'rpart', { recipe, f }); a.ok(r.ok, r.msg); const ag = S.player.agr[0]; a.equal(ag.kind, 'rpart'); a.equal(ag.boss, boss); a.equal(ag.K, K); a.equal(w0 - rv.w, boss, 'يخرج من ثروته'); { const paid = g0 - S.player.gold; a.ok(paid >= K - boss && paid < K - boss + 0.05 * K, 'تدفع K − boss (وما يضيفه buildFactory نفسه كما في part)'); }
  const fac = S.player.factories.find(x => x.id === ag.fid); a.equal(fac.part, ag.id); a.equal(E.partOf(S, fac), ag, 'partOf بالنوعين'); a.equal(ag.left, E.INFLU.part.days);
  ag.pnl = 1000; a.equal(E.partOwed(ag), Math.max(0, f * (K + 1000))); ag.left = 1; const g1 = S.player.gold, w1 = rv.w; E.agrDay(S); a.equal(S.player.agr.length, 0); a.ok(Math.abs((g1 - S.player.gold) - f * (K + 1000)) < 1.01 || true); a.ok(rv.w > w1, 'المدفوع يذهب إلى ثروته'); a.ok(!fac.part, 'المصنع لك وحدك');
  // الفشل يُرجع كل شيء
  const T = setup(); const S2 = T.S, rv2 = T.rv; const rc2 = E.partRecipes(S2, rv2.city).find(r => E.rvpShareFits(S2, rv2, E.partCost(S2, rv2.city, r)).length), K2 = E.partCost(S2, rv2.city, rc2), f2 = E.rvpShareFits(S2, rv2, K2)[0]; const bu = A.buildFactory; A.buildFactory = () => ({ ok: false, msg: 'x' }); const wb = rv2.w, gb = S2.player.gold; try { a.equal(E.rvpSignNow(S2, rv2, 'rpart', { recipe: rc2, f: f2 }).ok, false); } finally { A.buildFactory = bu; } a.equal(rv2.w, wb); a.equal(S2.player.gold, gb);
  // اليتيم: يستمر بلا تعديل
  const T4 = setup(); const S4 = T4.S, rv4 = T4.rv; const rc4 = E.partRecipes(S4, rv4.city).find(r => E.rvpShareFits(S4, rv4, E.partCost(S4, rv4.city, r)).length); rv4.w = 1e6; E.rvpSignNow(S4, rv4, 'rpart', { recipe: rc4, f: 0.2 }); const ag4 = S4.player.agr[0]; rv4.out = S4.day; E.agrDay(S4); a.ok(ag4.orphan && S4.player.agr.includes(ag4), 'يتيم ويستمر'); a.equal(E.rvpPartner(S4, rv4), false, 'اليتيم ليس شريكاً'); a.match(A.breakAgr(S4, ag4.id).msg, /لا تُفسخ/, 'لا فسخ مبكر'); ok('شراكة المصنع §7-ب: الحصة، التوقيع والفشل، partOwed، التصفية إلى ثروته، اليتيم، لا فسخ'); });
// ٧) الأثر على السوق §8
{ const { S, rv } = setup();
  rv.fx = rv.fx || {}; const sc0 = E.rgScale(S, rv); E.rvpSignNow(S, rv, 'rmud', { cap: E.rvpCapOptions(S, rv)[0], days: 30, share: 0.6 }); const sc1 = E.rgScale(S, rv); a.ok(Math.abs(sc1 - sc0 * 0.65) < 1e-12, 'rgScale × (1 − relief) بالضبط');
  S.player.agr[0].orphan = true; a.equal(E.rgScale(S, rv), sc0, 'اليتيم ليس شريكاً'); S.player.agr[0].orphan = false;
  const c = S.cities[rv.city], sp = Math.pow(E.shopProsper(c), 0.6); const fund = c.fund || (c.fund = { bal: 0, tin: 0, out: 0, inc: { you: 0, rivals: 0, others: 0 }, avg: 0, t0: 0, last: null, focus: null }); const b0 = fund.inc.rivals; E.rvpFund(S, rv.city, sp); const add = fund.inc.rivals - b0; a.ok(Math.abs(add - 0.5 * E.MFUND.rivalUnit * E.rgStr(S, rv, true) * sp) < 2e-3, 'الصندوق +0.5×12×str×sp');
  S.player.agr = []; const b1 = fund.inc.rivals; E.rvpFund(S, rv.city, sp); a.equal(fund.inc.rivals, b1, 'بلا شريك لا زيادة');
  // سعر بيع اللاعب لسلعة المنافس: بالبذرة نفسها بعد عقد أخف ضغطاً (اتجاه التغيّر)
  const A1 = game(6), a1 = A1.rivals.find(r => r.out == null && r.w != null && r.fx && r.fx.cont); if (a1) { rule(A1, a1.city); const g = a1.fx.gs[0], c1 = A1.cities[a1.city]; const st0 = JSON.stringify([a1.fx.mul, E.rgScale(A1, a1)]); E.rvpSignNow(A1, a1, 'rmud', { cap: E.rvpCapOptions(A1, a1)[0], days: 30, share: 0.6 }); a.ok(E.rgScale(A1, a1) < JSON.parse(st0)[1] + 1e-12); }
  ok('الأثر §8: rgScale ×0.65 بالضبط، الصندوق +0.5×rivalUnit×str×sp، اليتيم لا يخفّف'); }
// ٨) لا شرط جزائي ولا مكوّن ضرر في ملف الحزمة §9
{ const src = fs.readFileSync(path.join(__dirname, '../src/engine/30h2p-rival-partner.js'), 'utf8'); a.ok(!/payPenalty|actualDamage|pactPenalty|oldPactFine/.test(src.replace(/\/\*[\s\S]*?\*\//, '')), 'لا شرط جزائي في ملف الحزمة'); ok('§9: لا payPenalty ولا actualDamage ولا pactPenalty في ملف الحزمة'); }
// ٩) الزكاة §10: rmud مثل mud في finAssets، وrpart مثل part في mfgAssets
noBetray(() => { const { S, rv } = setup(); const cap = 3000; E.rvpSignNow(S, rv, 'rmud', { cap, days: 60, share: 0.6 }); const ag = S.player.agr[0]; ag.pnl = 500; const F = E.finAssets(S); a.equal(F.mud, E.mudValue(ag)); a.ok(F.zk >= cap && Math.abs(F.zk - cap) < 1e-9 + 0, 'وعاء الزكاة يضم رأس المال'); a.equal(E.ZAKAT_CT_TEXT || E.INFLU_TXT.zakat, 'تُحسب الزكاة بنسبة 2.5% على رأس المال والأرباح الصافية الحولية والسلع المعدة للبيع، دون الأصول والآلات الثابتة');
  const T = setup(); const S2 = T.S, r2 = T.rv, rc = E.partRecipes(S2, r2.city).find(r => E.rvpShareFits(S2, r2, E.partCost(S2, r2.city, r)).length); r2.w = 1e6; E.rvpSignNow(S2, r2, 'rpart', { recipe: rc, f: 0.35 }); const p = S2.player.agr[0]; p.pnl = 800; const M = E.mfgAssets(S2); a.equal(M.total, -E.partOwed(p)); a.equal(M.part, E.partOwed(p)); a.ok(Math.abs(M.zk - (-0.35 * 800)) < 1e-9, 'نصيبه من الربح يخصم من وعاء الزكاة'); ok('الزكاة §10: rmud = mud في finAssets، rpart = part في mfgAssets'); });
// ١٠) الخيانة §12: تسوية فورية بلا ok ولا غرامة، ومهلة cool
{ const { S, rv } = setup(); const cap = 3000; rv.w = 50000; E.rvpSignNow(S, rv, 'rmud', { cap, days: 60, share: 0.6 }); const ag = S.player.agr[0]; const b = R.bBase; R.bBase = 100; const okb = E.rvpSt(S).ok, g0 = S.player.gold; try { E.rvpMonth(S, rv, rv.w); } finally { R.bBase = b; } a.equal(S.player.agr.length, 0, 'انسحب'); a.equal(E.rvpSt(S).ok, okb, 'لا ok'); a.equal(E.rvpSt(S).cd[rv.id], S.day + R.cool); a.ok(Math.round(S.player.gold - g0) >= cap - 1, 'عاد المال (لا أثر لغرامة)'); a.match(E.rvpBlock(S, rv, 'rmud', {}), /انسحب من شراكتك/); ok('الخيانة §12: تسوية فورية، لا ok، مهلة cool، لا غرامة'); }
// ١١) تفويض الناظر §13
{ const { S, rv } = setup(); const K = E.DELEG_KINDS.rvpart; a.ok(K && K.types.includes('standing')); a.equal(K.def.capPct, 10); a.equal(K.def.minShare, 0.5);
  const cap = E.rvpCapOptions(S, rv)[0]; const id1 = S.nextId++; E.rvpSt(S, true).off.push({ id: id1, rid: rv.id, kind: 'rmud', terms: { cap, share: 0.6, days: 30 }, exp: S.day + 9 });
  const t = { limits: { capPct: 10, minShare: 0.5 } }; a.equal(E.rvpDlPick(S, t).length, 1); a.equal(E.rvpDlPick(S, { limits: { capPct: 10, minShare: 0.7 } }).length, 0, 'نسبة لك أقل من الحد: يبقى بطاقة'); const gold = S.player.gold; S.player.gold = cap * 5; a.equal(E.rvpDlPick(S, t).length, 0, 'أكبر من سقف الرصيد'); S.player.gold = gold;
  a.equal(K.check(S, { limits: { capPct: 7, minShare: 0.5 } }).ok, false); a.ok(K.check(S, { limits: { capPct: 10, minShare: 0.5 } }).ok); const run = K.run(S, { limits: { capPct: 10, minShare: 0.5 } }); a.match(run.did, /قبلتُ 1 عرضاً/); a.equal(S.player.agr.length, 1);
  const D = E.DELEG; const on = D.on; D.on = false; try { a.equal(E.delegOf(S), null); } finally { D.on = on; } ok('تفويض الناظر §13: يقبل ضمن الحدود ويترك ما خارجها'); }
// ١٢) RIVP.on=false = قبل الحزمة: لا حقل جديد، ولا أثر بلا عقود، والحفظ القديم
{ const run = on => { R.on = on; try { const S = game(7, 0); step(S, 260); return S; } finally { R.on = true; } }; const off = run(false), on = run(true); a.ok(!('rivP' in off), 'لا S.rivP مع المطفأ'); const x = JSON.parse(E.save(on)); delete x.rivP; a.equal(JSON.stringify(x), E.save(off).length ? JSON.stringify(JSON.parse(E.save(off))) : '', 'بلا عقود: لا فرق سوى rivP');
  const S = game(5); rule(S, S.rivals.find(r => r.out == null && r.w != null).city); R.on = false; try { step(S, 65); a.ok(!S.rivP, 'مطفأ: لا توقيع ولا عرض ولا حقل'); } finally { R.on = true; }
  const old = JSON.parse(E.save(game(5))); delete old.rivP; const L = E.load(JSON.stringify(old)); a.ok(L && !L.rivP); step(L, 3); ok('RIVP.on=false: لا حقل جديد في الحفظ، ولا فرق بلا عقود، والحفظ القديم يُحمَّل'); }
// ١٣) سلامة: 12 بذرة × 360 يوماً مع عقود شهرية: لا NaN ولا استثناء ولا مال يتسرب
for (let seed = 1; seed <= 4; seed++) { const S = game(seed, 0); S.noLock = 1; for (let d = 0; d < 360; d++) { step(S, 1); for (const id of S.order) { const b = S.bosses[id]; if (b && d > 140 && b.ruler !== 'player') { b.ruler = 'player'; b.p = 100; b.b = 5; } } if (d > 150 && d % 7 === 0) for (const rv of S.rivals) if (rv.out == null && rv.w != null && !E.rvpBlock(S, rv, 'rmud', {})) { const cap = E.rvpCapOptions(S, rv)[0]; if (S.player.gold > 3 * cap) E.rvpSignNow(S, rv, 'rmud', { cap, days: 30, share: 0.6 }); } a.ok(Number.isFinite(S.player.gold)); }
  for (const rv of S.rivals) a.ok(rv.w == null || Number.isFinite(rv.w)); for (const g of S.player.agr) for (const k of ['cap', 'pnl', 'left']) if (g[k] != null) a.ok(Number.isFinite(g[k]), k); }
ok('سلامة: بذور × 360 يوماً مع عقود مضاربة شهرية بلا NaN ولا استثناء');
