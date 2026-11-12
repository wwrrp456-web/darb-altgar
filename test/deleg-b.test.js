'use strict';
// 043ب بقية محوّلات الناظر (محرك): لكل محوّل (أ) ينفّذ فعلاً ويطابق الفعل اليدوي في الأثر والمبلغ، (ب) لا يفعل شيئاً حين لا يتحقق شرطه
// (ومنه عدم الرفض في imports)، (ج) يحترم الميزانية وسقف اليوم، (د) ask وmine، (هـ) التراجع للتسعير وحده؛
// والقيم الحرفية (agrwatch = ضرر التسوية، part = partOwed، donate = المعادلة)، والمفاتيح DELEG.b وDELEG.on.
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, near = (x, y, m) => a(Math.abs(x - y) < 1e-6, (m || '') + ` ${x} != ${y}`);
function mk() {
  const S = E.newGame(3); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; S.player.famDebt = null; S.phase = 3; S.player.gold = 1e6; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = true; S.player.fixedEma = 0;
  S.player.diwan = { since: S.day, box: 0, rules: E.diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 }; return S;
}
const D = S => S.player.diwan, next = (S, n = 1) => { for (let i = 0; i < n; i++) { S.day++; D(S).dd = 0; E.delegDay(S); } };
const T = (kind, limits, o) => Object.assign({ kind, type: 'standing', scope: '*', mode: 'exec', limits }, o || {});
const logOf = (S, kind) => (D(S).tlog || []).filter(e => e.kind === kind && !e.add && !e.fin);
const rule = (S, ...ids) => ids.forEach(id => { const b = S.bosses[id]; b.ruler = 'player'; b.p = 100; b.b = 5; });

// 1) price: الراكد يُخفَّض والشحيح يُرفع بالمعادلة حرفاً، عدا ما يسعّره مدير، ويوم 7 فقط؛ التراجع يعمل ويحترم تغيّر السعر بعده؛ والقياس
function shopState() {
  const S = mk(); a(A.buildShop(S, 'riyadh').ok); a(A.buildShop(S, 'riyadh').ok); a(A.buildWarehouse(S, 'riyadh').ok); const pr = S.player.props.riyadh, [s1, s2] = pr.shops;
  a(A.shopSetItem(S, 'riyadh', s1.id, 'dates', 1.5, true).ok); a(A.shopSetItem(S, 'riyadh', s1.id, 'coffee', 1.5, true).ok); a(A.shopSetItem(S, 'riyadh', s2.id, 'wheat', 1.5, true).ok);
  const [d, c] = s1.items; d.target = 60; c.target = 60; pr.store.dates = 60; d.lastSold = 0; pr.store.coffee = 5; c.lastSold = 4; s2.items[0].target = 60; pr.store.wheat = 60; s2.items[0].lastSold = 0;
  pr.mgr = { rank: 2, asset: { kind: 'shop', id: s2.id } }; S.day = 14; return { S, pr, s1, s2 };
}
{
  const { S, pr, s1, s2 } = shopState(), M = shopState();
  a(A.shopSetItem(M.S, 'riyadh', M.s1.id, 'dates', Math.max(1.1, 1.5 - 0.05), true).ok); // يدوياً بالمعادلة نفسها
  a(A.delegAdd(S, T('price', { floor: 1.1 })).ok); near(s1.items[0].price, M.s1.items[0].price, 'الراكد خُفّض كاليدوي'); near(s1.items[0].price, 1.45); near(s1.items[1].price, 1.55, 'الشحيح رُفع'); near(s2.items[0].price, 1.5, 'دكان يسعّره المدير لم يُمسّ');
  const e = logOf(S, 'price')[0]; a(e && Array.isArray(e.u) && e.u.length === 2 && !e.irrev, 'سجل قابل للتراجع'); a.match(e.text, /خفّضتُ سعر/); a.equal(e.amount, 0);
  const t = D(S).tasks[0]; a(t.rv && Object.keys(t.rv).length === 2); s1.items[0].revenue = (s1.items[0].revenue || 0) + 300; a.equal(E.delegView(S).tasks[0].meas.v, 300, 'مبيعات ما سعّرتُه منذ التفويض');
  s1.items[1].price = 1.7; const i = D(S).tlog.indexOf(e), u = A.delegUndo(S, i); a(u.ok); a.match(u.msg, /تغيّر سعره بعدي/); near(s1.items[0].price, 1.5, 'أُعيد'); near(s1.items[1].price, 1.7, 'غيّره اللاعب بعدُ فتُرك');
  a.equal(A.delegUndo(S, D(S).tlog.findIndex(x => x === e)).ok, false, 'لا تراجع مرتين');
  // ليس يوم التسعير: لا شيء؛ والحد الأدنى
  const X = shopState(); X.S.day = 15; a(A.delegAdd(X.S, T('price', { floor: 1.5 })).ok); near(X.s1.items[0].price, 1.5); X.S.day = 20; next(X.S, 1); near(X.s1.items[0].price, 1.5, 'يوم 21: الحد 1.5 يمنع النزول'); near(X.s1.items[1].price, 1.55);
  a.equal(A.delegAdd(X.S, T('price', { floor: 1.2 })).ok, false, 'خيار غير معروض');
}
// 2) herdsell: الصغار فقط حتى thr−0.1، الترتيب بعدد الصغار، سقف 20 رأساً يومياً، حد السعر
function farmState(young, herd) {
  const S = mk(); a(A.buildShop(S, 'riyadh').ok); a(A.buildFarm(S, 'riyadh').ok); const f = E.farmOf(S, 'riyadh'); f.herd.sheep = herd; E.hxOf(f, 'sheep').y = young; f.herd.goat = 2; E.hxOf(f, 'goat').y = 4; return { S, f };
}
{
  const { S, f } = farmState(30, 14), cap = E.farmCap(S, 'riyadh'), u0 = E.farmUnits(f); a(u0 / cap >= 0.9, 'ممتلئة ' + u0 / cap); const pmin = Math.min(0.8, E.ratio(S.cities.riyadh, 'sheep')) ; void pmin;
  const r0 = E.ratio(S.cities.riyadh, 'sheep'), lim = { thr: 0.9, pmin: [0.8, 0.9, 1.0].filter(x => x <= r0).pop() || 0.8 };
  if (r0 < 0.8) { S.cities.riyadh.stock.sheep = 1; }
  const need = E.farmUnits(f) - 0.8 * cap, fu = E.BREED.sheep.fu, n = Math.min(30, Math.ceil(need / (0.5 * fu)), 20);
  const M = farmState(30, 14); if (r0 < 0.8) M.S.cities.riyadh.stock.sheep = 1; const g0m = M.S.player.gold, rm = A.farmSell(M.S, 'riyadh', 'sheep', n, 'young'); a(rm.ok);
  const g0 = S.player.gold, adults = f.herd.sheep; a(A.delegAdd(S, T('herdsell', lim)).ok);
  a.equal(f.hx.sheep.y, 30 - rm.n, 'باع الصغار بالكمية نفسها'); a.equal(f.herd.sheep, adults, 'لم يمس الكبار'); near(S.player.gold - g0, M.S.player.gold - g0m, 'الصافي نفسه'); a(E.farmUnits(f) <= 0.8 * cap + 0.5 * fu + 1e-9);
  const e = logOf(S, 'herdsell')[0]; a(e && e.irrev && e.inc); a.match(e.text, /بيع، لا يُعكس/); near(e.amount, Math.round(rm.net * 100) / 100, 'المبلغ صافي البيع'); a.match(A.delegUndo(S, D(S).tlog.indexOf(e)).msg, /غير قابل للتراجع/);
  a(D(S).tasks[0].tot.in > 0 && D(S).tasks[0].tot.out === 0, 'جلبتُ');
  // سقف اليوم 20
  const B = farmState(200, 10); B.f.level = 3; const cB = E.farmCap(B.S, 'riyadh'); B.f.herd.sheep = Math.round(cB * 0.95 - 100 * E.BREED.sheep.fu - 2 * E.BREED.goat.fu - 2 * E.BREED.goat.fu); if (r0 < 0.8) B.S.cities.riyadh.stock.sheep = 1;
  a(E.farmUnits(B.f) / cB >= 0.9, 'B ممتلئة'); a(A.delegAdd(B.S, T('herdsell', lim)).ok); a.equal(200 - B.f.hx.sheep.y, 20, 'حتى 20 رأساً في اليوم');
  // تحت العتبة: لا شيء؛ وحد السعر
  const C = farmState(6, 4); a(A.delegAdd(C.S, T('herdsell', { thr: 0.9, pmin: 0.8 })).ok); a.equal(C.f.hx.sheep.y, 6, 'تحت العتبة لا يبيع');
  const P2 = farmState(30, 14); P2.S.cities.riyadh.stock.sheep = 1e6; P2.S.cities.riyadh.stock.goat = 1e6; a(E.ratio(P2.S.cities.riyadh, 'sheep') < 0.8); a(A.delegAdd(P2.S, T('herdsell', { thr: 0.9, pmin: 0.8 })).ok); a.equal(P2.f.hx.sheep.y, 30, 'السعر تحت الحد: لا يبيع');
  // قرب الحول في السائمة: يبيع كالمعتاد بلا سطر إيقاف؛ أُزيل حارس الحول الاحتياطي لأن المختص أجاز البيع المفوَّض للحاجة قرب الحول (DL-01 في docs/review/APPROVED_PROJECTS_INCOME_2026-11-12.md)، ومعادلة الزكاة لا تُمسّ
  const H = farmState(30, 14); if (r0 < 0.8) H.S.cities.riyadh.stock.sheep = 1; const Z = H.S.zakat; Z.herdMode = 'sawm'; Z.start = H.S.day; H.S.day += E.hawlLen(H.S, Z.start) - 10;
  a(A.delegAdd(H.S, T('herdsell', lim)).ok); a.equal(H.f.hx.sheep.y, 30 - rm.n, 'يبيع قرب الحول في السائمة كما في غيره');
  a.equal(logOf(H.S, 'herdsell').filter(e => /أوقفتُ بيع الصغار/.test(e.text)).length, 0, 'لا سطر إيقاف');
}
// 3) guard: يوظّف حتى ينخفض الخطر أو gmax أو الميزانية، بـ WAGE.guardHire كاليدوي
function carState() {
  const S = mk(); a(A.hireCaptain(S).ok); const car = S.player.caravans.find(c => c.captain && !c.main); car.route = { a: 'riyadh', b: 'jeddah', buyA: 'dates', buyB: 'coffee' }; car.city = 'riyadh'; car.left = 0; car.guards = 0;
  S.risk[E.riskKey('riyadh', 'jeddah')] = 0.4; return { S, car };
}
{
  const { S, car } = carState(), e0 = E.roadEstimate(S, car, 'jeddah'); a(e0.level === 2, 'طريق خطر ' + e0.loss);
  const M = carState(), gm = M.S.player.gold; a(A.hireGuard(M.S, M.car.id).ok); const one = gm - M.S.player.gold; near(one, E.WAGE.guardHire, 'اليدوي 300');
  const g0 = S.player.gold; a(A.delegAdd(S, T('guard', { lv: 2, gmax: 4, pct: 5 })).ok); const n = car.guards, e1 = E.roadEstimate(S, car, 'jeddah');
  a(n >= 1 && n <= 4, 'وظّف ' + n); a(e1.level < 2 || n === 4, 'توقف عند انخفاض الخطر أو gmax'); near(g0 - S.player.gold, n * E.WAGE.guardHire, 'التكلفة = n × 300');
  const lg = logOf(S, 'guard')[0]; a.match(lg.text, new RegExp('وظّفتُ ' + n + ' حارساً لـ.+ قبل طريق الرياض→جدة: خطر الخسارة من ' + Math.round(e0.loss * 100) + '٪ إلى ' + Math.round(e1.loss * 100) + '٪ بـ'));
  near(D(S).tasks[0].win.spent, n * E.WAGE.guardHire); a.match(A.delegUndo(S, D(S).tlog.indexOf(lg)).msg, /غير قابل للتراجع/);
  // الميزانية: سقف أقل من حارس واحد ⇒ لا توظيف
  const B = carState(); B.S.player.gold = 5000; a(A.delegAdd(B.S, T('guard', { lv: 2, gmax: 4, pct: 2 })).ok); a.equal(B.car.guards, 0, 'السقف 100 < 300');
  // الطريق آمن: لا شيء؛ وقافلة في الطريق: لا شيء
  const C = carState(); C.S.risk[E.riskKey('riyadh', 'jeddah')] = 0; a(A.delegAdd(C.S, T('guard', { lv: 1, gmax: 8, pct: 10 })).ok); a.equal(C.car.guards, 0);
  const F = carState(); F.car.left = 3; a(A.delegAdd(F.S, T('guard', { lv: 2, gmax: 4, pct: 5 })).ok); a.equal(F.car.guards, 0, 'لا يوظّف لقافلة مسافرة');
  // gmax
  const G = carState(); G.S.risk[E.riskKey('riyadh', 'jeddah')] = 5; a(A.delegAdd(G.S, T('guard', { lv: 1, gmax: 2, pct: 10 })).ok); a.equal(G.car.guards, 2, 'gmax = 2');
}
// 4) imports: يقبل بحدّ الكلفة والميزانية عبر A.agrAccept، ولا يرفض أبداً (يسجّل مرة واحدة ويترك الدفعة)
function impState() {
  const S = mk(); rule(S, 'riyadh'); S.bosses.cairo.trust = 30; S.bosses.cairo.cd = 0; a(A.buildShop(S, 'riyadh').ok); a(A.buildWarehouse(S, 'riyadh').ok);
  const g = E.agrGoodsOptions(S, 'cairo', 'import', 'riyadh').find(x => E.sells(S.cities.riyadh, x)) || E.agrGoodsOptions(S, 'cairo', 'import', 'riyadh')[0]; a(A.signAgr(S, 'cairo', 'import', 'riyadh', g, 20).ok, 'عقد استيراد');
  const ag = S.player.agr[0]; E.agrDay(S); a(ag.batch, 'دفعة معروضة'); S.cities.cairo.stock[g] = Math.max(S.cities.cairo.stock[g] || 0, 100);
  E.A.chooseStart; const hp = (() => { S.ctxCur = 'sar'; return E.unitPrice(S.cities.riyadh, g); })(); return { S, ag, g, hp };
}
{
  const { S, ag, hp } = impState(); ag.batch.unit = 0.5 * hp; ag.batch.cust = 0; const M = impState(); M.ag.batch.unit = 0.5 * M.hp; M.ag.batch.cust = 0;
  M.S.ctxCur = 'egp'; const gm = M.S.player.gold, rm = A.agrAccept(M.S, M.ag.id); a(rm.ok, rm.msg);
  const st0 = S.player.props.riyadh.store[ag.goods] || 0; a(A.delegAdd(S, T('imports', { q: 0.9, pct: 10 })).ok); a.equal(ag.batch, null, 'قُبلت'); a.equal(S.player.props.riyadh.store[ag.goods] - st0, M.S.player.props.riyadh.store[M.ag.goods] - (0), 'المخزن كاليدوي');
  const e = logOf(S, 'imports')[0]; a.match(e.text, /^قبلتُ دفعة 20 من .+ بـ[\d,]+ ريال: كلفة الوحدة [\d.]+ وسعرها في الرياض [\d.]+$/); a(e.amount > 0); a.equal(ag.took, 1);
  // كلفة فوق الحد: لا يقبل ولا يرفض، سطر واحد للدفعة
  const X = impState(); X.ag.batch.unit = 2 * X.hp; const b = X.ag.batch; a(A.delegAdd(X.S, T('imports', { q: 0.9, pct: 10 })).ok); a.equal(X.ag.batch, b, 'الدفعة باقية للاعب'); a.equal(X.ag.refused || 0, 0, 'لا رفض');
  next(X.S, 1); a.equal(logOf(X.S, 'imports').filter(e => /^لم أقبل دفعة .+: كلفتها [\d.]+ للوحدة وسعر سوقك [\d.]+ \(حدّك 90٪\)\. القرار لك قبل /.test(e.text)).length, 1, 'سطر واحد');
  // الميزانية: est > cap ⇒ لا قبول
  const Y = impState(); Y.ag.batch.unit = 0.5 * Y.hp; Y.ag.batch.cust = 0; Y.S.player.gold = 1000; a(A.delegAdd(Y.S, T('imports', { q: 0.95, pct: 5 })).ok); if (Y.ag.batch.qty * Y.ag.batch.unit > 50) { a(Y.ag.batch, 'فوق الميزانية لا قبول'); a(logOf(Y.S, 'imports').some(e => /ميزانية الشهر/.test(e.text))); }
  // ask: يسأل ثم ينفّذ بعد المهلة؛ mine تذكير فقط
  const K = impState(); K.ag.batch.unit = 0.5 * K.hp; K.ag.batch.cust = 0; a(A.delegAdd(K.S, T('imports', { q: 0.9, pct: 10 }, { mode: 'ask' })).ok); a(K.ag.batch && D(K.S).tasks[0].pend); next(K.S, E.DELEG.wait); a.equal(K.ag.batch, null, 'نفّذ بعد المهلة');
  const Mi = impState(); Mi.ag.batch.unit = 0.5 * Mi.hp; Mi.ag.batch.cust = 0; a(A.delegAdd(Mi.S, T('imports', { q: 0.9, pct: 10 }, { mode: 'mine' })).ok); next(Mi.S, 4); a(Mi.ag.batch, 'mine لا يقبل'); a(D(Mi.S).tasks[0].pend.remind);
}
// 5) agrwatch: سطر قبل التسوية بسبعة أيام بمعادلة agrSettleExport، dmg = ما تكتبه التسوية، مرة لكل دورة، ولا خصم
{
  const S = mk(); rule(S, 'riyadh'); S.bosses.cairo.trust = 30; S.bosses.cairo.cd = 0; a(A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 160).ok); const ag = S.player.agr[0];
  ag.cnt = ag.period - 5; ag.led.act = 40; ag.saved = 700; const g0 = S.player.gold, x = E.awDmg(S, ag); a(x.short === 120 && x.dmg > 0);
  a(A.delegAdd(S, T('agrwatch', {}, { type: 'report' })).ok); a.equal(E.delegUsed(S), 0, 'لا يشغل خانة'); a.equal(S.player.gold, g0, 'لا خصم');
  const line = logOf(S, 'agrwatch')[0]; a(line, 'سطر'); a.equal(line.text, 'عقد تصدير ' + E.GD.wheat.name + ' مع ' + S.bosses.cairo.name + ': بقي 5 يوماً والناقص 120 وحدة. إن لم تُكمله فالشرط الجزائي بقدر الضرر الفعلي نحو ' + x.dmg.toLocaleString('en-US') + ' ريال (جمارك وفّرتَها ' + Math.round(x.cust).toLocaleString('en-US') + ' وهامش الناقص ' + Math.round(x.lost).toLocaleString('en-US') + ')');
  a(S.news.some(n => n.t.includes('ناظر الديوان: عقد تصدير')), 'في الأخبار');
  ag.cnt++; ag.left--; next(S, 1); a.equal(logOf(S, 'agrwatch').length, 1, 'مرة واحدة لكل دورة (اليوم التالي بالدورة نفسها)'); a.match(A.delegAdd(S, T('agrwatch', {}, { type: 'report' })).msg, /هذا التقرير مضاف أصلاً/);
  ag.cnt = ag.period - 1; E.agrDay(S); a.equal(ag.hist[ag.hist.length - 1].dmg, x.dmg, 'dmg يساوي ما كتبته التسوية');
  const S2 = mk(); rule(S2, 'riyadh'); S2.bosses.cairo.trust = 30; S2.bosses.cairo.cd = 0; a(A.signAgr(S2, 'cairo', 'export', 'riyadh', 'wheat', 160).ok); const ag2 = S2.player.agr[0]; ag2.cnt = ag2.period - 3; ag2.led.act = 160; a(A.delegAdd(S2, T('agrwatch', {}, { type: 'report' })).ok); a.equal(logOf(S2, 'agrwatch').length, 0, 'لا ناقص: لا سطر');
  ag2.led.act = 0; ag2.cnt = 2; next(S2, 1); a.equal(logOf(S2, 'agrwatch').length, 0, 'أبعد من 7 أيام: لا سطر');
}
// 6) part: يشتري حصة الزعيم بـ partOwed حين تبلغ الخسارة الحد، وإلا سطر أسبوعي إن لم يكفِ النقد
function partState(pnl) { const S = mk(); const ag = { id: S.nextId++, kind: 'part', city: 'cairo', home: 'riyadh', recipe: Object.keys(E.RECIPES)[0], share: 0.35, K: 10000, boss: 3500, fid: -1, pnl, since: S.day, left: 90, total: 90, days: 10, cnt: 0, ok: 0, miss: 0, led: { exp: 3500, act: 0, why: '' }, hist: [] }; (S.player.agr = S.player.agr || []).push(ag); return { S, ag }; }
{
  const { S, ag } = partState(-3000), owed = E.partOwed(ag); near(owed, 0.35 * 7000); const g0 = (S.ctxCur = 'sar', S.player.gold);
  a(A.delegAdd(S, T('part', { loss: 0.2 })).ok); a(!S.player.agr.includes(ag), 'صُفّيت'); S.ctxCur = 'sar'; near(g0 - S.player.gold, owed, 'المدفوع = partOwed قبل الشراء');
  const e = logOf(S, 'part')[0]; near(e.amount, Math.round(owed)); a.match(e.text, /^اشتريتُ حصة .+ بـ[\d,]+ ريال/); a.equal(S.bosses.cairo.trust, 0, 'تصفية مبكرة بلا رفع ثقة');
  const B = partState(-1000); a(A.delegAdd(B.S, T('part', { loss: 0.2 })).ok); a(B.S.player.agr.includes(B.ag), 'خسارة 10٪ تحت حد 20٪');
  const C = partState(-3000); C.S.player.gold = 100; a(A.delegAdd(C.S, T('part', { loss: 0.2 })).ok); a(C.S.player.agr.includes(C.ag)); next(C.S, 3); a.equal(logOf(C.S, 'part').filter(e => /ولا يكفي نقدك/.test(e.text)).length, 1, 'سطر أسبوعي'); next(C.S, 5); a.equal(logOf(C.S, 'part').filter(e => /ولا يكفي نقدك/.test(e.text)).length, 2);
}
// 7) donate: كل 30 يوماً min(mx, floor(pct/100 × L.net)) عبر fundDonate، وفرق الثقة بمعادلتها، ولا يمس الاحتياطي
function donState(net) { const S = mk(); a(A.buildShop(S, 'cairo').ok); const P = S.player; P.hs = [{ d: S.day - 28, inc: Object.assign({}, P.led.inc), exp: Object.assign({}, P.led.exp) }]; P.led.inc.shops = (P.led.inc.shops || 0) + net; S.bosses.cairo.trust = 0; return S; }
{
  const S = donState(50000), L = E.hsLedger(S); a.equal(L.since, 'days'); const amt = Math.min(2000, Math.floor(2 / 100 * L.net)); a.equal(amt, 1000);
  a(A.delegAdd(S, T('donate', { pct: 2, mx: 2000, dim: 'sci' }, { scope: 'cairo' })).ok); a.equal(logOf(S, 'donate').length, 0, 'لا تبرع قبل 30 يوماً'); next(S, 29); a.equal(logOf(S, 'donate').length, 0);
  const f0 = (S.cities.cairo.fund || { bal: 0 }).bal, d0 = S.player.led.exp.marketDonation || 0; next(S, 1); const e = logOf(S, 'donate')[0]; a(e, 'تبرع'); near(e.amount, amt); near((S.player.led.exp.marketDonation || 0) - d0, amt, 'marketDonation');
  near(S.cities.cairo.fund.bal - f0, amt + 0 > 0 ? S.cities.cairo.fund.bal - f0 : 0); a(S.cities.cairo.fund.bal - f0 >= amt - 1e-6); near(S.cities.cairo.fund.earmark.sci, amt);
  near(S.bosses.cairo.trust, Math.min(E.MFUND.donateTrustMax, amt / 1000 * E.MFUND.donateTrust), 'فرق الثقة بمعادلة fundDonate'); a.match(e.text, /^تبرعتُ بـ1,000 ريال لصندوق القاهرة لغرض العلم/);
  next(S, 10); a.equal(logOf(S, 'donate').length, 1, 'مرة كل 30 يوماً');
  const M = donState(50000); M.ctxCur = 'egp'; const tr0 = M.bosses.cairo.trust; a(A.fundDonate(M, 'cairo', amt, 'sci').ok); near(M.bosses.cairo.trust - tr0, S.bosses.cairo.trust, 'مطابق لليدوي');
  const R = donState(50000); R.player.fixedEma = 1e9; a(A.delegAdd(R, T('donate', { pct: 2, mx: 2000, dim: null }, { scope: 'cairo' })).ok); next(R, 30); a.equal(logOf(R, 'donate').length, 0, 'لا يمس احتياطي التشغيل');
  const N = donState(-5000); a(A.delegAdd(N, T('donate', { pct: 5, mx: 10000, dim: null }, { scope: 'cairo' })).ok); next(N, 30); a.equal(logOf(N, 'donate').length, 0, 'صافٍ سالب: لا تبرع');
  a.equal(A.delegAdd(donState(1000), T('donate', { pct: 2, mx: 2000, dim: null })).ok, false, 'لا * للتبرع');
}
// 8) الإطار: تقرير واحد لكل نوع، سقف الترحيل، الاقتراحات، الكتالوج بسبب التعطيل
{
  const S = mk(); a(A.delegAdd(S, { kind: 'brief', type: 'report', scope: '*', limits: {}, mode: 'exec' }).ok); rule(S, 'riyadh'); S.bosses.cairo.trust = 30; S.bosses.cairo.cd = 0; a(A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 160).ok);
  a(A.delegAdd(S, T('agrwatch', {}, { type: 'report' })).ok, 'تقرير من نوع آخر يُقبل'); a.equal(A.delegAdd(S, { kind: 'brief', type: 'report', scope: '*', limits: {}, mode: 'exec' }).msg, 'هذا التقرير مضاف أصلاً');
  const reps = Object.values(E.DELEG_KINDS).filter(k => k.types.includes('report')).length; a.equal(reps, 2); const sv = JSON.parse(E.save(S)); for (let i = 0; i < 40; i++) sv.player.diwan.tasks.push({ id: 9000 + i, type: 'standing', kind: 'shopfix', scope: '*', limits: { below: 55, pct: 5 }, mode: 'exec', since: 0, log: [] });
  a.equal(E.load(JSON.stringify(sv)).player.diwan.tasks.length, 30 + reps, 'سقف الترحيل = 30 + أنواع التقارير');
  const av = Object.fromEntries(Object.values(E.DELEG_KINDS).filter(k => k.avail).map(k => [k.id, k.avail(mk())])); a.equal(av.herdsell, 'لا مزرعة لك'); a.equal(av.imports, 'لا عقد استيراد قائم'); a.equal(av.part, 'لا شراكة مصنع قائمة'); a.equal(av.agrwatch, 'لا عقد تصدير قائم');
  // الاقتراحات: مزرعة ممتلئة وعقد تصدير ناقص؛ ولا يُقترح ما فُوِّض
  const { S: F } = farmState(30, 14); rule(F, 'riyadh'); F.bosses.cairo.trust = 30; F.bosses.cairo.cd = 0; a(A.signAgr(F, 'cairo', 'export', 'riyadh', 'wheat', 160).ok);
  const sg = E.delegAsk(F, 'suggest'), kinds = sg.acts.filter(x => x.kind === 'add').map(x => x.spec.kind); a(kinds.includes('herdsell') && kinds.includes('agrwatch'), kinds.join(',')); a(sg.lines.some(l => /^مزرعة الرياض ممتلئة \d+٪/.test(l)));
  const add = sg.acts.find(x => x.kind === 'add' && x.spec.kind === 'herdsell'); a(A.delegAdd(F, add.spec).ok, 'الزر المقترح يفوّض'); a(!E.delegAsk(F, 'suggest').acts.some(x => x.kind === 'add' && x.spec.kind === 'herdsell'), 'لا يُقترح ما فُوِّض');
  a(E.DELEG_KINDS.guard.avail(mk()) === 'لا قافلة بقائد');
}
// 9) المفاتيح: DELEG.b=false يُخفي ويوقف دون حذف؛ DELEG.on=false = قبل 043 بلا حقول
{
  const { S, f } = farmState(30, 14); a(A.delegAdd(S, T('herdsell', { thr: 0.9, pmin: 0.8 }, { mode: 'mine' })).ok); const y0 = f.hx.sheep.y; D(S).tasks[0].mode = 'exec'; D(S).tasks[0].pend = null;
  E.DELEG.b = false; try {
    a.equal(A.delegAdd(S, T('price', { floor: 1.1 })).ok, false, 'مخفية'); next(S, 2); a.equal(f.hx.sheep.y, y0, 'مهمتها لا تُنفَّذ'); a.equal(D(S).tasks.length, 1, 'ولا تُحذف'); a.equal(E.delegView(S).tasks[0].off, true);
    a(!E.delegAsk(S, 'suggest').acts.some(x => x.kind === 'add' && E.DELEG_KINDS[x.spec.kind].b), 'لا اقتراحات منها'); a(A.delegAdd(S, { kind: 'shopfix', type: 'standing', scope: '*', limits: { below: 55, pct: 5 }, mode: 'exec' }).ok, '043أ تعمل');
  } finally { E.DELEG.b = true; }
  next(S, 1); a(f.hx.sheep.y < y0, 'تعود بعد التشغيل');
  E.DELEG.on = false; try { const X = farmState(30, 14).S; a.equal(A.delegAdd(X, T('herdsell', { thr: 0.9, pmin: 0.8 })).ok, false); E.delegDay(X); a(!/"tasks"|"tlog"|"frozen"|"dd"/.test(E.save(X)), 'لا حقول'); } finally { E.DELEG.on = true; }
}
console.log('OK   deleg-b: التسعير (مع التراجع والقياس)، بيع الصغار (سقف اليوم، وبلا إيقاف قرب الحول)، الحراسة (الميزانية)، قبول الدفعات بلا رفض، إنذار الشرط الجزائي = ضرر التسوية، تصفية الشراكة = partOwed، التبرع بالمعادلة، تقرير لكل نوع، والمفاتيح');
