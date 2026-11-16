/* ---------- 054 سجل العقود المنتهية: كل عقد ينتهي يُكتب بربحه أو خسارته وما جرى فيه ----------
   عرض لما حدث فقط: عدّادات تقرأ قيماً تُحسب أصلاً، ولا تغيير في أي رقم اقتصادي ولا في نقاط الانتهاء (يُكتب بالكنس: مقارنة الحيّ قبل اليوم وبعده).
   CLOG.on=false ⇒ السلوك الحالي حرفاً بلا حقل جديد في الحفظ. P.agrLog (mfgLog) لا يُمسّ. المواصفة: specs/054-contract-log/spec.md. */
const CLOG = { on: true, max: 100, page: 10, why: 120 };
const CL_GRP = { boss: ['الزعماء', ['p:shop', 'p:guard', 'p:alliance', 'p:exclusive']], supply: ['التوريد', ['p:supply', 'import', 'raw']], export: ['التصدير', ['export', 'wakala']], fran: ['الامتياز', ['fran']],
  road: ['الممر', ['pass', 'safe']], mud: ['المضاربة', ['mud']], salam: ['السلم', ['salam', 'book']], ist: ['الاستصناع', ['ist']], part: ['الشراكات', ['part']], rival: ['شراكات المنافسين', ['rmud', 'rpart']], loan: ['قروض الأصدقاء', ['loan']] };
const CL_GRP_OF = k => { for (const g in CL_GRP) if (CL_GRP[g][1].includes(k)) return g; return 'boss'; };
const CL_WHY = { term: 'أتمّ أجله', brk: 'فسختَه', buy: 'اشتريتَ حصة الزعيم قبل الأجل', wd: 'سحبتَ مالك قبل الأجل', fail: 'تعثّر التنفيذ', gone: 'زال الطرف أو المصنع', ruled: 'حكمتَ سوق الطرف الثاني', off: 'أُوقف العقد', other: 'انتهى',
  paid: 'ردّ القرض', lost: 'ضاع القرض', forg: 'سامحتَ صديقك', pledge: 'بِعتَ الرهن', sur: 'دفع الكفيل' };
const CL_LIVE = new WeakMap(); // S → { a: Set(عقود P.agr), p: Set(P.pacts) }؛ خارج S فلا يُحفظ
const clN = x => Math.round(x || 0);
function clogWhy(S, x, isPact, R) {
  if (R) return R;
  if (isPact) { if (x.left <= 0) return 'term'; const b = bossOf(S, x.city); return b && b.ruler === 'player' ? 'ruled' : 'fail'; }
  const k = x.kind;
  if ((k === 'part' || k === 'rpart') && x.gone) return 'gone';
  if (RPK[k] && x.left > 0) { const rv = rvpGet(S, x.rid); if (!rv || rv.out != null) return 'gone'; }
  if (x.left > 0) { const b = bossOf(S, x.city); if (!b) return 'gone'; if (!RPK[k] && b.ruler === 'player') return 'ruled'; if (ROAD_KINDS[k] && !roadLive(k)) return 'off'; }
  if ((k === 'salam' || k === 'book' || k === 'ist') && x.got < x.qty) return 'fail';
  return x.left > 0 ? 'other' : 'term';
}
function clogRec(S, x, isPact, R) {
  const P = S.player; if (!P.clog) { P.clog = []; P.clogY = P.clogY || {}; }
  let r;
  if (isPact) { r = { k: 'p:' + x.type, c: x.city, d0: x.since, cap: clN(x.daily * x.total), out: clN(x.pd), in: null, n: null, u: 1, tr: {} };
    if (x.type === 'supply' || x.type === 'shop' || x.type === 'alliance') { r.in = clN(x.bn); r.n = r.in - r.out; r.u = 0; r.tr = { bn: r.in }; } else if (x.type === 'guard') r.tr = { tp: x.tp || 0 }; else if (x.type === 'exclusive') { r.tr = { tq: x.tq || 0 }; const c0 = S.cities[x.city]; if (c0 && c0.sig) r.g = c0.sig; } }
  else {
    const k = x.kind, led = x.led || {}, hs = x.hist || [], sum = f => hs.reduce((a, h) => a + (f(h) || 0), 0);
    r = { k, c: x.city, h: x.home, d0: x.since, g: x.goods, tr: {} }; let cap = 0, out = 0, inn = 0;
    if (k === 'export') { cap = x.qty * INFLU.periods; out = (x.dmg || 0) + (x.brk || 0); inn = x.svT || 0; r.tr = { q: sum(h => h.exp), a: sum(h => h.act), s: sum(h => Math.max(0, (h.exp || 0) - (h.act || 0))) }; }
    else if (k === 'import') { cap = x.qty * INFLU.periods; out = x.vout || 0; inn = (x.vout || 0) + (x.cg || 0); r.tr = { q: sum(h => h.exp), a: sum(h => h.act) }; }
    else if (k === 'salam') { cap = x.cap; out = x.cap; inn = (x.gv || 0) + x.cap * (x.qty - x.got) / x.qty; r.tr = { q: x.qty, a: x.got, s: x.qty - x.got }; }
    else if (k === 'mud') { cap = x.cap; out = x.cap; inn = mudValue(x); r.tr = { q: x.days || 0, a: x.up || 0, s: x.dn || 0 }; }
    else if (k === 'wakala') { cap = x.qty; out = x.cb || 0; inn = x.proceeds || 0; r.tr = { q: x.sent || 0, a: x.sold || 0, s: (x.sent || 0) - (x.sold || 0) }; }
    else if (k === 'ist') { cap = x.price; out = x.paid; inn = x.ref * x.q * x.got + (x.bk || 0); r.tr = { q: x.qty, a: x.got, s: x.qty - x.got }; }
    else if (k === 'raw') { cap = x.qty * INFLU.raw.periods; out = x.vout || 0; inn = (x.vout || 0) + (x.gain || 0); r.tr = { o: (x.rq || {}).o || 0, a: (x.rq || {}).a || 0, r: (x.rq || {}).r || 0 }; }
    else if (k === 'part' || k === 'rpart') { const p = Math.max(-x.K, x.pnl || 0); cap = x.K; out = led.act || 0; inn = (x.boss || 0) + p; r.tr = { a: clN(p), s: clN(x.share * 100) }; }
    else if (k === 'rmud') { cap = x.cap; out = x.cap; inn = led.act || 0; r.tr = { q: x.days || 0, a: x.up || 0, s: x.dn || 0 }; }
    else { cap = k === 'pass' ? x.trips : k === 'safe' ? x.fee : k === 'fran' ? x.qty : x.cap; out = x.tot ? x.tot.out : 0; inn = x.tot ? x.tot.in : 0;
      if (k === 'pass') r.tr = { q: x.tT || 0 }; else if (k === 'fran') r.tr = { q: x.sT || 0 }; else if (k === 'safe') r.tr = { q: x.trips || 0, a: x.saves || 0, s: x.claims || 0 }; else if (k === 'book') r.tr = { q: x.qty, a: x.got || 0, s: (x.qty || 0) - (x.got || 0) }; }
    r.cap = clN(cap); r.out = clN(out); r.in = clN(inn); r.n = r.in - r.out; if (x.rname) r.w = x.rname; if (x.cl0) r.o = 1;
    if (led.why) r.r = String(led.why).slice(0, CLOG.why);
  }
  if (isPact && x.cl0) r.o = 1;
  r.d = S.day; r.why = clogWhy(S, x, isPact, R); clogPut(S, r);
}
function clogPut(S, rec) { const P = S.player; P.clog.push(rec); if (P.clog.length > CLOG.max) P.clog.shift(); clogTotAdd(S, rec); }
function clogTotAdd(S, rec) {
  const P = S.player, y = dateOf(S, rec.d).year, Y = (P.clogY = P.clogY || {})[y] || (P.clogY[y] = { p: 0, l: 0, c: 0, u: 0, g: {} }), G = Y.g[CL_GRP_OF(rec.k)] || (Y.g[CL_GRP_OF(rec.k)] = [0, 0, 0, 0]);
  Y.c++; G[2]++;
  if (rec.why === 'forg') { Y.f = (Y.f || 0) + rec.out; G[3] += rec.out; }
  else if (rec.u) { Y.u += rec.out; G[3] += rec.out; } else if (rec.n > 0) { Y.p += rec.n; G[0] += rec.n; } else if (rec.n < 0) { Y.l += -rec.n; G[1] += -rec.n; }
}
function clogLoan(S, o, f) {
  if (!CLOG.on || !S.player) return; const P = S.player; if (!P.clog) { P.clog = []; P.clogY = P.clogY || {}; }
  const why = ['lost', 'paid', 'forg', 'pledge', 'sur'][f.ok] || 'paid', rec = { k: 'loan', c: S.home, d0: o.day != null ? o.day : S.day, d: S.day, cap: clN(o.amt), out: clN(f.lent), in: clN(f.amt + (f.rest || 0)), why, tr: { q: clN(f.lent), a: clN(f.amt) } };
  if (f.g) rec.w = f.g; rec.n = rec.in - rec.out; if (f.ok === 2) { rec.in = 0; rec.n = -rec.out; } if (f.ok === 3 && typeof lpSaleText === 'function') rec.r = lpSaleText(f).slice(0, CLOG.why); clogPut(S, rec);
}
function clogSweep(S, R) {
  if (!CLOG.on || !S.player) return; const P = S.player, m = CL_LIVE.get(S);
  if (!m) { if (!P.clog) { P.clog = []; P.clogY = {}; for (const x of (P.agr || []).concat(P.pacts || [])) { x.cl0 = 1; if (x.type === 'supply' || x.type === 'shop' || x.type === 'alliance') x.bn = 0; } } CL_LIVE.set(S, { a: new Set(P.agr || []), p: new Set(P.pacts || []) }); return; }
  for (const ag of m.a) if (!(P.agr || []).includes(ag)) clogRec(S, ag, false, R);
  for (const pc of m.p) if (!(P.pacts || []).includes(pc)) clogRec(S, pc, true, R);
  m.a = new Set(P.agr || []); m.p = new Set(P.pacts || []);
}
const clogBegin = S => clogSweep(S, null), clogEnd = S => clogSweep(S, null);
for (const [k, R] of [['breakAgr', 'brk'], ['breakPact', 'brk'], ['partBuyout', 'buy'], ['rvpWithdraw', 'wd']]) { const f = A[k]; if (!f) continue; A[k] = function (S) { clogSweep(S, null); const r = f.apply(null, arguments); clogSweep(S, r && r.ok === false ? null : R); return r; }; }
/* ---- العرض ---- */
const clName = r => r.k.startsWith('p:') ? PACTS[r.k.slice(2)].name : r.k === 'loan' ? 'قرض صديق' : AGR_KINDS[r.k].name;
function clogLines(S, y, g) {
  const L = (S.player.clog || []), out = [];
  for (let i = L.length - 1; i >= 0; i--) { const r = L[i]; if (y !== 'all' && dateOf(S, r.d).year !== y) continue; if (g !== 'all' && CL_GRP_OF(r.k) !== g) continue; out.push(i); }
  return out;
}
function clogView(S, y, g) {
  return clogLines(S, y, g).map(i => { const r = S.player.clog[i], b = bossOf(S, r.c), party = r.w || (r.k === 'loan' ? 'صديقك' : (b ? b.name : BOSS_NAMES[r.c] || '')), c0 = dateOf(S, r.d0 != null ? r.d0 : r.d), c1 = dateOf(S, r.d);
    return { i, rec: r, name: clName(r), party, from: c0.hs, to: c1.hs, date: c1.hs, year: c1.year, days: r.d - (r.d0 != null ? r.d0 : r.d), city: (S.cities[r.c] || {}).name || '', home: r.h && S.cities[r.h] ? S.cities[r.h].name : '', why: CL_WHY[r.why] || '', grp: CL_GRP_OF(r.k) }; });
}
function clogTot(S, y, g) {
  const CY = S.player.clogY || {}, acc = { p: 0, l: 0, c: 0, u: 0, f: 0 };
  for (const yy in CY) { if (y !== 'all' && +yy !== y) continue; const Y = CY[yy];
    if (g === 'all') { acc.p += Y.p; acc.l += Y.l; acc.c += Y.c; acc.u += Y.u; acc.f += Y.f || 0; }
    else { const G = Y.g[g]; if (!G) continue; acc.p += G[0]; acc.l += G[1]; acc.c += G[2]; if (g === 'loan') acc.f += G[3]; else acc.u += G[3]; } }
  return acc;
}
const clogYears = S => Object.keys(S.player.clogY || {}).map(Number).sort((a, b) => b - a);
const clogGroups = (S, y) => { const o = {}; for (const yy in (S.player.clogY || {})) { if (y !== 'all' && +yy !== y) continue; for (const g in S.player.clogY[yy].g) o[g] = (o[g] || 0) + S.player.clogY[yy].g[g][2]; } return Object.keys(CL_GRP).filter(g => o[g] > 0); };
