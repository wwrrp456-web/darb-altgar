/* ---------- 035هـ وكيل الإقليم بالدرجات + المكافأة الشهرية 5٪ ----------
   المعادلات حرفياً من specs/035-management-skill/spec-e.md؛ لا rnd ولا rr هنا (حتمية).
   RAG.on=false ⇒ §2 لا يُقرأ ولا يُكتب والوكيل كما هو حرفاً. BON.on=false ⇒ §3 لا يُقرأ ولا يُكتب (لا بطاقة ولا دفع).
   حقول اختيارية تُنشأ عند أول حاجة فقط: ra.shift، ra.mode، ra.fundDay، ra.bon0، e.sk.bon، P.bonus. الحفظ القديم بلاها يعمل.
   المكافأة تبرّع اختياري من التاجر لا جزء من الأجر؛ لا دفع إلا بنقرة اللاعب (A.bonusGive)؛ ولا تمس الاحتياطي المحمي ولا الزكاة الواجبة. */
const RAG = { on: true,
  negWeeks: [3, 2, 2], trustWarn: [-30, -20, -20],
  shift: { k: 0.10, gap: 20, days: 28 },
  perf: { need: 0.7, profit: 0.3 },
  fund: { over: 1.2, gap: 14, round: 100 } };
/* BON.on=false افتراضياً: T054 توقّف عند فحص §0-2 (أجر المدير ليس داخل pr.hist.net؛ انظر report-e.md السؤال 1 لـOpus). المسودة أدناه حرفية من §3 ولم تُراجع ولا تُفعَّل قبل جواب Opus. */
const BON = { on: false,
  rate: 0.05, every: 30, minDays: 30, capMonths: 2, agentShare: 0.2, min: 10,
  grow: 0.10, growDays: 30, grace: 2, graceDays: 30, expire: 10 };

/* ---- أ) الدرجة والعتبات ---- */
const ragGrade = ra => (RAG.on && ra && ra.sk ? skClamp(ra.sk.g, 3, 5) : 3);
const ragT = (ra, key) => (RAG.on ? RAG[key][ragGrade(ra) - 3] : RA[key]);
const ragCs = (S, country) => stewardCitiesIn(S, country).slice(0, RA.span);
const bonOn = () => !!(BON.on && SKILL.on);
const bonMul = (e, S) => (BON.on && e && e.sk && e.sk.bon && S.day < e.sk.bon.till ? e.sk.bon.mul : 1);
const bonGrace = (e, S) => (BON.on && e && e.sk && e.sk.bon && S.day < e.sk.bon.till ? e.sk.bon.grace : 0);
const ragZakatHeld = S => (S.zakat && S.zakat.due ? S.zakat.amount : 0);
/* الفائض فوق الاحتياطي المحمي والزكاة الواجبة غير المدفوعة؛ يُعاد حسابه لحظة الدفع */
const bonFree = S => Math.max(0, S.player.wallet.sar - operatingReserve(S) - ragZakatHeld(S));

/* حدّ كل مدينة بالتوزيع بالأداء (§2-ج): null إن لم يكن الوضع أداءً (فيبقى التوزيع القديم حرفاً) */
function ragShareFor(S, cs, ra, needs, tot, mode) {
  if (!(mode === 'perf')) return null;
  const pos = cs.map(id => { const p = shopPnl(S, id, 7); return Math.max(0, p ? p.total : 0); }), Q = pos.reduce((a, b) => a + b, 0);
  return cs.map((id, i) => (tot > 0 && Q > 0 ? RAG.perf.need * needs[i] / tot + RAG.perf.profit * pos[i] / Q : tot > 0 ? needs[i] / tot : 1 / cs.length));
}
function ragShares(S, cs, ra, needs, tot) { return ragGrade(ra) >= 5 && ra.mode === 'perf' ? ragShareFor(S, cs, ra, needs, tot, 'perf') : null; }
/* النقل الساري: يغيّر التوزيع لا المجموع */
function ragShiftApply(S, cs, ra, lims) {
  const sh = ra.shift; if (!sh) return;
  const i = cs.indexOf(sh.from), j = cs.indexOf(sh.to);
  if (S.day < sh.till && i >= 0 && j >= 0) { const d = Math.round(lims[i] * sh.k * 100) / 100; lims[i] -= d; lims[j] += d; } else delete ra.shift;
}

/* ---- النمو (§2-أ): يُستدعى من آخر skillDay ---- */
function ragDay(S) {
  if (!RAG.on || !SKILL.on || !S.player) return;
  const P = S.player;
  for (const country of Object.keys(P.regAgents || {})) {
    const ra = P.regAgents[country]; if (!ra) continue;
    if (!ra.sk) { skMake(ra, 'a', 3, null, null); ra.sk.since = S.day; }
    if (S.day % 7 === 0) { let net = 0; for (const id of ragCs(S, country)) { const p = shopPnl(S, id, 7); net += p ? p.net : 0; } ra.sk.m = skM(net); ra.sk.wk = 0; }
    skGrow(ra, 'a', ra.sk.m != null ? ra.sk.m : 1, S, null);
  }
}

/* ---- الدرجة 4: أرقام المقارنة وعرض النقل (§2-ب) ---- */
function ragRows(S, cs, ra) {
  return cs.map(id => { const p = shopPnl(S, id, 7), n7 = p ? p.total : 0, al = (ra.alloc && ra.alloc[id]) || 0; return { id, n7, al, r: al > 0 ? Math.round(100 * n7 / (7 * al)) : null }; });
}
function ragBestWorst(rows) { let best = rows[0], worst = rows[0]; for (const r of rows) { if (r.n7 > best.n7) best = r; if (r.n7 < worst.n7) worst = r; } return { best, worst }; }
function ragShiftOffer(S, country) {
  const ra = agentOf(S, country); if (!RAG.on || !ra || ragGrade(ra) < 4) return null;
  const cs = ragCs(S, country); if (cs.length < 2) return null;
  const { best, worst } = ragBestWorst(ragRows(S, cs, ra)); if (best.id === worst.id) return null;
  if (best.r == null || worst.r == null || best.r - worst.r < RAG.shift.gap || !(best.n7 > 0) || !(worst.al > 0)) return null;
  if (ra.shift && S.day < ra.shift.till && [ra.shift.from, ra.shift.to].some(x => x === best.id || x === worst.id)) return null;
  return { id: 'rag:shift:' + country + ':' + Math.floor(S.day / 7), kind: 'shift', country, from: worst.id, to: best.id, rb: best.r, rw: worst.r, d: Math.round(worst.al * RAG.shift.k * 100) / 100, days: RAG.shift.days };
}
/* ---- الدرجة 5: التوزيع بالأداء والتمويل (§2-ج) ---- */
function ragPerfOffer(S, country) {
  const ra = agentOf(S, country); if (!RAG.on || !ra || ragGrade(ra) < 5 || ra.mode !== undefined) return null;
  const cs = ragCs(S, country); if (!cs.length) return null;
  const eff = (ra.pool || 0) * (S.day - ra.since < RA.probation ? RA.probationShare : 1), needs = cs.map(id => agentNeed(S, id)), tot = needs.reduce((a, b) => a + b, 0);
  const sh = ragShareFor(S, cs, ra, needs, tot, 'perf'), lp = sh.map(s => Math.round(eff * s * 100) / 100), ln = cs.map((id, i) => Math.round(eff * (tot > 0 ? needs[i] / tot : 1 / cs.length) * 100) / 100);
  const rows = ragRows(S, cs, ra), { best } = ragBestWorst(rows), bi = cs.indexOf(best.id);
  if (!(lp[bi] !== ln[bi])) return null; // لا أثر رقمياً فلا اقتراح (قاعدة لا صوري)
  return { id: 'rag:perf:' + country, kind: 'perf', country, best: best.id, limPerf: lp[bi], limNeed: ln[bi] };
}
function ragFundCalc(S, country, ra) {
  const cs = ragCs(S, country), N = cs.reduce((a, id) => a + agentNeed(S, id), 0), pool = ra.pool || 0, R = RAG.fund.round;
  const eff = pool * (S.day - ra.since < RA.probation ? RA.probationShare : 1), free = bonFree(S);
  const Z = Math.min(Math.ceil(RAG.fund.over * N / R) * R, Math.floor(free / 7 / R) * R);
  return { N, pool, eff, free, Z, ok: eff < N && Z > pool, res: operatingReserve(S) + ragZakatHeld(S) };
}
function ragFundOffer(S, country) {
  const ra = agentOf(S, country); if (!RAG.on || !ra || ragGrade(ra) < 5 || ra.fundDay == null || S.day - ra.fundDay >= 7) return null;
  const q = ragFundCalc(S, country, ra); if (!q.ok) return null;
  return { id: 'rag:fund:' + country + ':' + ra.fundDay, kind: 'fund', country, ...q };
}
/* يُستدعى من agentWeekly: يرجع سطر المقارنة (درجة ≥ 4) ويعلّم اقتراح التمويل (درجة 5، مرة كل 14 يوماً على الأكثر) */
function ragWeekly(S, country, ra, cs) {
  if (!RAG.on) return ''; const g = ragGrade(ra); let line = '';
  if (g >= 4 && cs.length >= 2) {
    const { best, worst } = ragBestWorst(ragRows(S, cs, ra));
    if (best.id !== worst.id) { const t = x => S.cities[x.id].name + ' (صافي ' + fmtN(x.n7 / 7) + '/يوم، ' + (x.r == null ? 'بلا حد' : 'كل 100 من الحد أعادت ' + x.r) + ')'; line = ' | الأفضل: ' + t(best) + ' · الأضعف: ' + t(worst); }
  }
  if (g >= 5 && S.day - (ra.fundDay != null ? ra.fundDay : -99) >= RAG.fund.gap && ragFundCalc(S, country, ra).ok) ra.fundDay = S.day;
  return line;
}
function ragView(S) {
  const out = { cards: [], agents: {} }; if (!RAG.on || !S.player) return out;
  for (const country of Object.keys(S.player.regAgents || {})) {
    const ra = S.player.regAgents[country]; if (!ra) continue;
    for (const f of [ragShiftOffer, ragPerfOffer, ragFundOffer]) { const c = f(S, country); if (c) out.cards.push(c); }
    const g = ragGrade(ra); out.agents[country] = { grade: g, gradeName: SKILL.grades.a[g - 1], shift: ra.shift && S.day < ra.shift.till ? { ...ra.shift } : null, mode: g >= 5 ? (ra.mode === 'perf' ? 'perf' : 'need') : null, modeSet: ra.mode !== undefined, alloc: { ...(ra.alloc || {}) } };
  }
  return out;
}

/* ---- المكافأة الشهرية (§3) ---- */
/* §3-أ (حكم Opus 2026-11-15c): Ncity = Σ hist.net في 30 يوماً − managerWage(m) × D(m)؛ الأجر يُدفع بعد كتابة pr.hist فلا يدخله. D(m)=min(30,max(0,أيام خدمة المدير)). */
const bonDays = (S, m) => (m ? Math.min(30, Math.max(0, S.day - (m.since != null ? m.since : S.day - (m.days || 0)))) : 0);
const bonHist = (S, city) => { const pr = S.player.props[city]; return ((pr && pr.hist) || []).filter(h => h.d > S.day - 30); };
const bonNcity = (S, city) => { const pr = S.player.props[city], m = pr && pr.mgr; return bonHist(S, city).reduce((a, h) => a + (h.net || 0), 0) - (m ? managerWage(m) * bonDays(S, m) : 0); };
function bonName(S, kind, key) {
  if (kind === 'ra') return 'وكيل الإقليم في ' + (CD[key] ? CD[key].name : key);
  const pr = S.player.props[key], m = pr && pr.mgr; return (m && m.rank === 3 ? 'أمين المنطقة' : 'مدير الممتلك') + ' في ' + (S.cities[key] ? S.cities[key].name : key);
}
function bonEntity(S, b) { return b.kind === 'ra' ? (S.player.regAgents || {})[b.key] : (S.player.props[b.key] || {}).mgr; }
const bonDuesOpen = (S, e) => (S.paymentDues || []).some(d => d.id === e.paymentDue && d.amount > 0);
function bonDay(S) {
  if (!bonOn() || !S.player) return; const P = S.player;
  if (P.bonus) for (const b of P.bonus.list) if (b.state === 'open' && S.day - b.day >= BON.expire) b.state = 'void'; // تنتهي بلا أثر ولا عقوبة
  if (!(S.day > 0) || S.day % BON.every !== 0) return;
  const subs = [], underAgent = new Set();
  for (const country of Object.keys(P.regAgents || {})) for (const id of ragCs(S, country)) underAgent.add(id);
  for (const city of S.order) { const m = (P.props[city] || {}).mgr; if (m && (m.rank === 2 || m.rank === 3) && bonHist(S, city).length) subs.push({ kind: 'mgr', key: city, e: m, w: managerWage(m), share: BON.rate * (underAgent.has(city) ? 1 - BON.agentShare : 1), N: bonNcity(S, city), days: S.day - (m.since != null ? m.since : S.day - (m.days || 0)) }); }
  for (const country of Object.keys(P.regAgents || {})) {
    const ra = P.regAgents[country]; if (!ra) continue;
    const first = ra.bon0 === undefined; if (first) ra.bon0 = ra.paid || 0;
    const N = ragCs(S, country).reduce((a, id) => a + bonNcity(S, id), 0) - ((ra.paid || 0) - ra.bon0);
    ra.bon0 = ra.paid || 0; // لقطة الحساب القادم
    if (!first) subs.push({ kind: 'ra', key: country, e: ra, w: agentWage(S, country), share: BON.rate * BON.agentShare, N, days: S.day - ra.since });
  }
  const free = bonFree(S);
  for (const s of subs) {
    const { e } = s; if (s.days < BON.minDays || (e.late || 0) > 0 || bonDuesOpen(S, e)) continue;
    const raw = s.share * Math.max(0, s.N), cap = BON.capMonths * 30 * s.w, B = Math.floor(Math.min(raw, cap)), offer = Math.min(B, Math.floor(free)), name = bonName(S, s.kind, s.key);
    const L = (P.bonus = P.bonus || { list: [] }).list, base = { id: S.nextId++, day: S.day, kind: s.kind, key: s.key, N: Math.round(s.N) };
    if (offer < BON.min) {
      if (s.N <= 0) L.push({ ...base, state: 'none', why: 'لا مكافأة لـ' + name + ': صافي وحدته هذا الشهر ' + fmtN(s.N) });
      else if (B >= BON.min) L.push({ ...base, state: 'none', why: 'أجّلتُ اقتراح مكافأة ' + name + ' (' + fmtN(B) + ') لأن الفائض فوق الاحتياطي ' + fmtN(free) });
    } else L.push({ ...base, share: s.share, raw: Math.round(raw), cap: Math.round(cap), B, offer, state: 'open' });
    while (L.length > 24) { const k = L.findIndex(x => x.state !== 'open'); L.splice(k < 0 ? 0 : k, 1); }
  }
}
/* أرقام الاقتراح لحظة العرض (السقف والفائض الحاليان) */
function bonEffect(b, amt) { const f = Math.min(1, amt / Math.max(1, b.B)); return { f, mulPct: Math.round(100 * BON.grow * f), grace: Math.round(BON.grace * f), mul: 1 + BON.grow * f }; }
function bonQuote(S, b) {
  const free = bonFree(S), lim = Math.min(b.cap, Math.floor(free)), name = bonName(S, b.kind, b.key), half = Math.floor(b.offer / 2);
  return { id: b.id, name, kind: b.kind, key: b.key, N: b.N, share: b.share, raw: b.raw, cap: b.cap, B: b.B, offer: b.offer, half, free, lim, full: bonEffect(b, b.offer), halfE: bonEffect(b, half) };
}
function bonList(S) {
  const P = S.player, L = (P && P.bonus && P.bonus.list) || [];
  return { open: bonOn() ? L.filter(b => b.state === 'open' && bonEntity(S, b)).map(b => bonQuote(S, b)) : [], notes: L.filter(b => b.state === 'none' && b.why).slice(-6).reverse() };
}
Object.assign(A, {
  ragShift(S, country, from, to) {
    const ra = agentOf(S, country); if (!RAG.on || !ra) return NO('لا وكيل هنا');
    if (from == null) { if (!ra.shift) return NO('لا نقل ساري'); delete ra.shift; agentAlloc(S, country, ra); return OK('أُلغي النقل؛ عاد التوزيع كما كان.'); }
    const cs = ragCs(S, country); if (ragGrade(ra) < 4) return NO('يحتاج وكيلاً بدرجة «خبير» فأعلى'); if (from === to || !cs.includes(from) || !cs.includes(to)) return NO('مدينتان من مناطق الوكيل');
    ra.shift = { from, to, k: RAG.shift.k, till: S.day + RAG.shift.days }; agentAlloc(S, country, ra);
    const d = Math.round((ra.alloc[from] / (1 - RAG.shift.k)) * RAG.shift.k * 100) / 100;
    return OK('نُقل نحو ' + fmtN(d) + ' ريال يومياً من حد ' + S.cities[from].name + ' إلى ' + S.cities[to].name + ' حتى يوم ' + ra.shift.till + '. مجموع الحدود لم يتغير.');
  },
  ragMode(S, country, mode) {
    const ra = agentOf(S, country); if (!RAG.on || !ra) return NO('لا وكيل هنا'); if (ragGrade(ra) < 5) return NO('يحتاج وكيلاً بدرجة «شيخ الصنعة»');
    if (mode !== 'perf' && mode !== 'need') return NO('وضع غير معروف'); ra.mode = mode; agentAlloc(S, country, ra);
    const cs = ragCs(S, country);
    return OK(mode === 'perf' ? 'التوزيع بالحاجة ' + Math.round(RAG.perf.need * 100) + '٪ والربح ' + Math.round(RAG.perf.profit * 100) + '٪: ' + cs.map(id => S.cities[id].name + ' ' + fmtN(ra.alloc[id] || 0)).join(' · ') : 'التوزيع بالحاجة: ' + cs.map(id => S.cities[id].name + ' ' + fmtN(ra.alloc[id] || 0)).join(' · '));
  },
  bonusGive(S, id, amt) {
    const P = S.player, b = bonOn() && P.bonus && P.bonus.list.find(x => x.id === id && x.state === 'open'); if (!b) return NO('انتهى هذا الاقتراح');
    const e = bonEntity(S, b); if (!e) { b.state = 'void'; return NO('لم يعد في خدمتك'); }
    const lim = Math.min(b.cap, Math.floor(bonFree(S))); amt = Math.round(+amt);
    if (!(amt >= 0 && amt <= lim)) return NO('المبلغ أكبر من سقف أجر شهرين أو من الفائض فوق الاحتياطي (' + fmtN(lim) + ')');
    const name = bonName(S, b.kind, b.key);
    if (amt === 0) { b.state = 'no'; return OK('لا مكافأة هذا الشهر. لا ينقص ذلك من أجره ولا من عمله.'); }
    { const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'bonus', amt, true); S.ctxCur = c0; }
    const ef = bonEffect(b, amt); if (!e.sk) skMake(e, 'a', 3, null, null);
    e.sk.bon = { till: S.day + BON.growDays, mul: ef.mul, grace: ef.grace }; b.state = 'paid'; b.amt = amt;
    const msg = 'كافأتَ ' + name + ' بـ' + fmtN(amt) + ' ريال (' + (b.N > 0 ? Math.round(amt / b.N * 1000) / 10 : 0) + '٪ من صافي وحدته ' + fmtN(b.N) + '). يتقدّم أسرع ' + ef.mulPct + '٪ ويصبر على تأخر أجره ' + ef.grace + ' يوم أكثر لمدة ' + BON.growDays + ' يوماً.';
    news(S, msg, 'good'); return OK(msg);
  },
});
