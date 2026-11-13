/* شراكات المنافسين عند حكم السوق (040د، حساسة): مضاربة rmud (CT-05) وشراكة مصنع rpart (CT-09) مع منافس في سوق تحكمه؛ المواصفة حرفاً في specs/040-rival-partners/spec.md.
   لا نوع عقد جديد ولا حكم جديد: المعادلات من 036د، والعقود في P.agr، وحالتها الإضافية في S.rivP (تُنشأ عند أول حاجة). RIVP.on=false = ما قبل الحزمة حرفياً بلا حقل جديد في الحفظ.
   لا شرط جزائي هنا ولا payPenalty (§9): التسوية قيمة الحق نفسه (mudValue وpartOwed). المنافس لا زكاة عليه (§10). */
INFLU.fam.rival = true;
const RIVP = { on: true, k: 0.5, rMax: 0.25, capW: 0.5, partW: 0.5, askW: 0.30, t0: 20, tOk: 10, tRule: 30, ruleDays: 180, a0: 0.20, a1: 0.005, a2: 0.30, a3: 0.15, o0: 0.10, oT: 0.003, oMax: 0.40, maxPending: 2, ttl: 20, retry: 15, relief: 0.35, fundBoost: 0.5, bBase: 0.02, cool: 90, bands: [0.35, 0.60] };
Object.assign(AGR_KINDS, {
  rmud: { fam: 'rival', hidden: true, name: 'مضاربة مع منافس', icon: '🏺', minTrust: 0, desc: AGR_KINDS.mud.desc, obl: AGR_KINDS.mud.obl },
  rpart: { fam: 'rival', hidden: true, name: 'شراكة مصنع مع منافس', icon: '🤝', minTrust: 0, desc: AGR_KINDS.part.desc, obl: AGR_KINDS.part.obl },
});
const RPK = { rmud: 1, rpart: 1 }; Object.assign(FIN_KINDS, RPK);
const RIVP_TXT = { other: n => 'الطرف الآخر: ' + n + '، تاجر في سوقك', weak: 'ضعيف', mid: 'متوسط', good: 'جيد', terms: 'شروطك لا تغريه', trust: 'لا يثق بك بعد' };
const rvpOn = S => !!(RIVP.on && INFLU.on && INFLU.fam.rival && S && S.learn && S.learn.char && rgW(S));
const rvpSt = (S, mk) => S.rivP || (mk ? (S.rivP = { since: {}, ok: 0, off: [], rej: {}, cd: {} }) : null);
const rvpGet = (S, id) => (S.rivals || []).find(r => r.id === id) || null;
const rvpAg = (S, rid) => (S.player.agr || []).find(a => RPK[a.kind] && a.rid === rid) || null;
const rvpPartner = (S, rv) => { const a = rvpAg(S, rv.id); return !!(a && !a.orphan); };
const rvpRound100 = x => Math.round(x / 100) * 100;
// §4 ثقة المنافس بك
function rvpT(S, rv) { const st = rvpSt(S), rd = st && st.since[rv.city] != null ? S.day - st.since[rv.city] : 0; return Math.min(100, RIVP.t0 + RIVP.tOk * (st ? st.ok : 0) + RIVP.tRule * Math.min(1, Math.max(0, rd) / RIVP.ruleDays)); }
// §7-أ سقف رأس المال وخياراته
const rvpCapMax = (S, rv) => Math.min(mudCap(S, rv.city), Math.floor(RIVP.capW * (rv.w || 0) / 100) * 100);
const rvpCapOptions = (S, rv) => { const m = rvpCapMax(S, rv); return m >= 100 ? [0.25, 0.5, 1].map(x => Math.max(100, rvpRound100(m * x))) : []; };
// §7-ب أكبر حصة للمنافس يتسع لها مال المنافس، وخيارات الحصص الممكنة
const rvpShareFits = (S, rv, K) => INFLU.part.shares.filter(f => Math.round(K * f) <= RIVP.partW * (rv.w || 0));
// §3 الأهلية: كل سبب رفض بنصه؛ opt.off = عرض وارد يُستثنى من بند «عرض معلّق»، opt.incoming يتجاوز مهلة رفضه لعرضك
function rvpBlock(S, rv, kind, o, opt) {
  opt = opt || {}; o = o || {}; const st = rvpSt(S);
  if (!rv || rv.out != null || rv.w == null) return 'هذا التاجر لم يعد في السوق أو ثروته غير معلومة';
  const bs = bossOf(S, rv.city); if (!bs || bs.ruler !== 'player') return 'لا تحكم سوق ' + (S.cities[rv.city] ? S.cities[rv.city].name : 'هذا التاجر');
  if (!bossActive(S) || !(S.learn && S.learn.char)) return 'يُفتح في الطور 2';
  if (!opt.noSlot && slotsUsed(S) >= slotsOf(S)) return INFLU_TXT.full;
  if (rvpAg(S, rv.id)) return 'بينك وبينه عقد قائم';
  if (st && st.off.some(x => x.rid === rv.id && x.id !== opt.off)) return 'عنده عرض معلّق لك';
  if (st && st.cd[rv.id] != null && st.cd[rv.id] > S.day) return 'انسحب من شراكتك قبل أيام، عُد بعد ' + (st.cd[rv.id] - S.day) + ' يوماً';
  if (!opt.incoming && st && st.rej[rv.id] != null && st.rej[rv.id] + RIVP.retry > S.day) return 'رفض عرضك قبل أيام، عُد بعد ' + (st.rej[rv.id] + RIVP.retry - S.day) + ' يوماً';
  if (kind === 'rmud') {
    if (!INFLU.mud.on) return 'غير متاحة الآن'; const cm = rvpCapMax(S, rv); if (cm < 100) return 'ثروته لا تتسع لمضاربة (يلزم سقف 100 على الأقل)';
    if (o.cap != null) { if (!rvpCapOptions(S, rv).includes(o.cap)) return 'اختر رأس مال من الخيارات'; if (!INFLU.mud.days.includes(o.days)) return 'اختر مدة 30 أو 60 يوماً'; if (!INFLU.mud.shares.includes(o.share)) return 'اختر نسبة ربحك'; if (S.player.gold < o.cap) return 'رصيدك لا يكفي'; }
  } else if (kind === 'rpart') {
    if (!INFLU.part.on) return 'غير متاحة الآن'; if (S.phase < 3) return 'يُفتح في الطور 3'; { const lk = lessonLock(S, 'factory'); if (lk) return lk; }
    const rec = partRecipes(S, rv.city); if (!rec.length) return 'لا مصنع جديد يصلح في ' + S.cities[rv.city].name + ' (يلزم دكان ولا مصنع مكرر)';
    if (!rec.some(r => rvpShareFits(S, rv, partCost(S, rv.city, r)).length)) return 'ثروته لا تتسع لحصة في مصنع';
    if (o.recipe != null) { if (!rec.includes(o.recipe)) return 'لا مصنع جديد من هذا النوع'; const K = partCost(S, rv.city, o.recipe); if (!INFLU.part.shares.includes(o.f)) return 'اختر حصة المنافس'; if (Math.round(K * o.f) > RIVP.partW * rv.w) return 'حصة المنافس تفوق ما تسعه ثروته'; if (S.player.gold < K - Math.round(K * o.f)) return 'حصتك تحتاج ' + (K - Math.round(K * o.f)); }
  } else return 'غير متاحة الآن';
  return null;
}
// §5 احتمال قبول المنافس عرضك
function rvpChance(S, rv, kind, o) {
  const V = kind === 'rmud' ? Math.min(1, Math.max(0, ((1 - o.share) - 0.30) / 0.20)) : Math.min(1, Math.max(0, (o.f - 0.20) / 0.30)), T = rvpT(S, rv);
  const p = Math.min(0.95, Math.max(0.05, RIVP.a0 + RIVP.a1 * T + RIVP.a2 * V - RIVP.a3 * rgStr(S, rv, true))); return { p, V, T, word: p < RIVP.bands[0] ? RIVP_TXT.weak : p < RIVP.bands[1] ? RIVP_TXT.mid : RIVP_TXT.good };
}
// §7 التوقيع الفعلي (لا يفحص الأهلية: المنادي فحصها)
function rvpSignNow(S, rv, kind, t) {
  S.ctxCur = 'sar'; const P = S.player, rec = { id: S.nextId++, kind, city: rv.city, home: rv.city, goods: null, qty: 0, since: S.day, cnt: 0, ok: 0, miss: 0, led: { exp: 0, act: 0, why: '' }, hist: [], rid: rv.id, rcity: rv.city, rname: rv.name };
  if (kind === 'rmud') {
    pPay(S, 'mudarabaCap', t.cap, false); rv.w += t.cap; Object.assign(rec, { left: t.days, total: t.days, cap: t.cap, share: t.share, pnl: 0, rm: null, days: 0, up: 0, dn: 0, months: [], v0: t.cap }); rec.led.exp = t.cap; rec.led.act = t.cap;
  } else {
    const K = partCost(S, rv.city, t.recipe), boss = Math.round(K * t.f), g0 = P.gold, w0 = rv.w; rv.w -= boss; P.gold += boss; const r = A.buildFactory(S, rv.city, t.recipe); if (r.ok === false) { P.gold = g0; rv.w = w0; return NO(r.msg); }
    const f = P.factories[P.factories.length - 1]; f.part = rec.id; Object.assign(rec, { recipe: t.recipe, share: t.f, K, boss, fid: f.id, pnl: 0, left: INFLU.part.days, total: INFLU.part.days, days: 0, v0: 0, pm: 0 }); rec.led.exp = boss; rec.led.act = 0;
  }
  (P.agr || (P.agr = [])).push(rec); rvpSt(S, true); return OK('وقّعت ' + AGR_KINDS[kind].name + ' (' + rv.name + ') لمدة ' + rec.total + ' يوماً');
}
// §7-أ التسوية: back' = min(mudValue, rv.w)؛ لا شيء آخر يُخصم
function rvpMudSettle(S, ag, why, flag) {
  S.ctxCur = 'sar'; const P = S.player, rv = rvpGet(S, ag.rid), val = mudValue(ag), back = rv && rv.w != null ? Math.max(0, Math.min(val, rv.w)) : val, net = back - ag.cap;
  P.gold += back; if (rv && rv.w != null) rv.w = Math.max(0, rv.w - back);
  if (net > 0) { fauc(S, 'mudaraba', net); P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) + net; } else if (net < 0) { sink(S, 'mudarabaLoss', -net); P.led.exp.mudarabaLoss = (P.led.exp.mudarabaLoss || 0) + (-net); }
  mfgLog(S, ag, net); ag.led.act = Math.round(back); ag.led.why = why;
  news(S, 'انتهت ' + AGR_KINDS.rmud.name + ' (' + ag.rname + '): رأس مالك ' + fmtN(ag.cap) + '، عاد إليك ' + fmtN(Math.round(back)) + ' (' + (net >= 0 ? 'ربح ' : 'خسارة ') + fmtN(Math.abs(Math.round(net))) + '). السبب: ' + why, net >= 0 ? 'good' : 'bad');
  if (flag === 'term') { const st = rvpSt(S, true); st.ok += 1; }
  P.agr = P.agr.filter(x => x !== ag); return back;
}
// §7-ب تصفية الشراكة: يدفع اللاعب partOwed إلى ثروة المنافس (إن كان حياً)
function rvpPartSettle(S, ag, why) {
  const P = S.player, rv = rvpGet(S, ag.rid), owed = partOwed(ag), pay = Math.min(owed, P.gold), p = Math.max(-ag.K, ag.pnl || 0);
  P.gold -= pay; P.led.exp.assets = (P.led.exp.assets || 0) + pay; if (rv && rv.out == null && rv.w != null) rv.w += pay; else sink(S, 'pactShare', pay);
  const f = P.factories.find(x => x.id === ag.fid); if (f) delete f.part; const net = Math.round(p + ag.boss - pay); mfgLog(S, ag, net); ag.led.act = Math.round(pay);
  ag.led.why = why + ': اشتريتَ حصة ' + ag.rname + ' (' + Math.round(ag.share * 100) + '٪) بقدر حصته من رأس المال والربح: ' + Math.round(pay) + (p >= 0 ? ' (ربح المصنع ' : ' (خسارة المصنع ') + Math.abs(Math.round(p)) + ' قُسّمت بالنسبة)';
  news(S, 'انتهت ' + AGR_KINDS.rpart.name + ' (' + ag.rname + '): ' + ag.led.why + '.', net >= 0 ? 'good' : ''); P.agr = P.agr.filter(x => x !== ag);
}
// القيد الشهري (§7-أ) يُستدعى من rgWealthMonth بعد تحديث rv.w مباشرة؛ ثم الخيانة (§12)
function rvpMonth(S, rv, w0) {
  if (!RIVP.on) return; const ag = rvpAg(S, rv.id); if (!ag || ag.kind !== 'rmud' || ag.orphan) return;
  const r = w0 > 0 ? Math.min(RIVP.rMax, Math.max(-1, RIVP.k * (rv.w - w0) / w0)) : 0; ag.pnl = (ag.pnl || 0) + ag.cap * r; (ag.months || (ag.months = [])).push(Math.round(r * 1000) / 10); if (ag.months.length > 12) ag.months.shift(); ag.led.act = Math.round(mudValue(ag));
  const pB = RIVP.bBase * (1.3 - rgStr(S, rv, true)) * (1 - rvpT(S, rv) / 200);
  if (rgHash(S, rv.id, S.day + 800000) < pB) { const st = rvpSt(S, true); st.cd[rv.id] = S.day + RIVP.cool; rvpMudSettle(S, ag, 'انسحب ' + rv.name + ' من المضاربة قبل أجلها فسُوّي ما لك بقيمته إلى يومه'); }
}
// إفلاس المنافس أو خروجه (يُستدعى قبل rv.out في rgWealthMonth ومن اليوم): المضاربة تُسوّى بما بقي من ثروته، والشراكة تصير يتيمة
function rvpExit(S, rv) {
  if (!RIVP.on) return; const ag = rvpAg(S, rv.id); if (!ag || ag.orphan) return;
  if (ag.kind === 'rmud') rvpMudSettle(S, ag, 'أفلس ' + rv.name + ' أو خرج من السوق فسُوّي ما لك بما بقي من ثروته'); else { ag.orphan = true; ag.led.why = 'خرج ' + rv.name + ' من السوق: تستمر الشراكة إلى أجلها بلا تعديل'; }
}
// يومياً لعقد منافس قائم (من agrDay): لا يُسقَط بحكمك السوق؛ يبقى إلى أجله
function rvpAgDay(S, ag) {
  const rv = rvpGet(S, ag.rid); if (rv && rv.out != null) rvpExit(S, rv); if (!S.player.agr.includes(ag)) return;
  ag.left--; ag.days = (ag.days || 0) + 1; ag.cnt = (ag.cnt || 0) + 1;
  if (ag.kind === 'rmud') { ag.led.act = Math.round(mudValue(ag)); if (ag.left <= 0) rvpMudSettle(S, ag, 'انتهى أجل العقد', 'term'); return; }
  ag.led.act = Math.round(partOwed(ag));
  if (ag.gone) { rvpPartSettle(S, ag, 'أُغلق المصنع'); return; }
  if (ag.left <= 0) { if (S.player.gold >= partOwed(ag)) rvpPartSettle(S, ag, 'انتهى أجل العقد'); else { ag.left = INFLU.part.ext; ag.led.why = 'نقدك لا يكفي لشراء حصة ' + ag.rname + ': مُدّت الشراكة ' + INFLU.part.ext + ' يوماً'; } }
}
// سحب اللاعب (المضاربة وحدها) وتصفية القائم: نفس التسوية بلا زيادة ولا نقصان وبلا رسم؛ لا يزيد ok ولا ينقصه
function rvpClose(S, ag) { if (ag.kind === 'rmud') rvpMudSettle(S, ag, 'سحبتَ مالك قبل الأجل فحُسب ما حدث إلى يومه'); else rvpPartSettle(S, ag, 'أنهيتَ الشراكة'); }
const rvpWithdrawNow = (S, ag) => { const rv = rvpGet(S, ag.rid), v = mudValue(ag); return Math.round(rv && rv.w != null ? Math.max(0, Math.min(v, rv.w)) : v); };
// §6 العروض الواردة + انتهاؤها + لقطة الشهر + سجل «منذ متى تحكم»
function rvpOffTerms(S, rv, kind) {
  if (kind === 'rmud') return { cap: Math.min(rvpCapMax(S, rv), rvpRound100(RIVP.askW * rv.w)), share: INFLU.mud.shares[Math.floor(3 * rgHash(S, rv.id, S.day + 700000))], days: INFLU.mud.days[Math.floor(2 * rgHash(S, rv.id, S.day + 720000))] };
  const rec = partRecipes(S, rv.city).filter(r => rvpShareFits(S, rv, partCost(S, rv.city, r)).length), recipe = rec[Math.floor(rec.length * rgHash(S, rv.id, S.day + 750000))], fits = rvpShareFits(S, rv, partCost(S, rv.city, recipe)); return { recipe, f: Math.max.apply(null, fits) };
}
function rvpDay(S) {
  if (!rvpOn(S)) return; let st = rvpSt(S);
  for (const cid of S.order) { const bs = bossOf(S, cid), mine = !!(bs && bs.ruler === 'player'); if (mine) { st = rvpSt(S, true); if (st.since[cid] == null) st.since[cid] = S.day; } else if (st && st.since[cid] != null) delete st.since[cid]; }
  if (!st) return; st.off = st.off.filter(o => o.exp >= S.day && rvpGet(S, o.rid) && rvpGet(S, o.rid).out == null);
  if (S.day <= 0 || S.day % PR.month !== 0) return;
  for (const ag of (S.player.agr || [])) if (RPK[ag.kind]) { const v = ag.kind === 'rmud' ? mudValue(ag) : (1 - ag.share) * Math.max(-ag.K, ag.pnl || 0); ag.dm = Math.round(v - (ag.v0 == null ? 0 : ag.v0)); ag.v0 = v; }
  { const L = (S.player.agr || []).filter(x => RPK[x.kind]); if (L.length) { const net = L.reduce((t, x) => t + (x.dm || 0), 0); news(S, 'شراكات المنافسين: صافي الشهر ' + (net < 0 ? '−' : '+') + fmtN(Math.abs(net)) + ' ريال من ' + L.length + (L.length === 1 ? ' عقد' : ' عقود') + '.', net < 0 ? 'bad' : net > 0 ? 'good' : ''); } }
  for (const rv of (S.rivals || [])) {
    if (st.off.length >= RIVP.maxPending) break; const T = rvpT(S, rv);
    const gen = { incoming: true, noSlot: true }; if (rvpBlock(S, rv, 'rmud', null, gen) && rvpBlock(S, rv, 'rpart', null, gen)) continue; // لا أهلية لأي نوع (بنود 1 و2 و3 و6، والخانة تُفحص عند القبول)
    if (!(rgHash(S, rv.id, S.day + 600000) < Math.min(RIVP.oMax, RIVP.o0 + RIVP.oT * T))) continue;
    let kind = null; if (!rvpBlock(S, rv, 'rpart', null, gen) && rgHash(S, rv.id, S.day + 650000) < 0.5) kind = 'rpart'; else if (!rvpBlock(S, rv, 'rmud', null, gen)) kind = 'rmud'; if (!kind) continue;
    st.off.push({ id: S.nextId++, rid: rv.id, kind, terms: rvpOffTerms(S, rv, kind), exp: S.day + RIVP.ttl });
  }
}
Object.assign(A, {
  // عرضك على منافس: قبوله بالاحتمال pAccept (لا مضمون)، ولا كلفة على الرفض
  rvpOffer(S, rid, kind, o) {
    if (!rvpOn(S)) return NO('غير متاحة الآن'); const rv = rvpGet(S, rid); { const lk = lessonLock(S, 'pact'); if (lk) return NO(lk); }
    const why = rvpBlock(S, rv, kind, o || {}); if (why) return NO(why); if (kind === 'rmud' ? o.cap == null : o.recipe == null) return NO('أكمل شروط العرض');
    const ch = rvpChance(S, rv, kind, o), st = rvpSt(S, true);
    if (rgHash(S, rv.id, S.day + 500000) < ch.p) { const r = rvpSignNow(S, rv, kind, o); return r.ok === false ? r : Object.assign({}, r, { accepted: true }); }
    st.rej[rv.id] = S.day; const wh = ch.V < 0.5 ? RIVP_TXT.terms : RIVP_TXT.trust; news(S, 'رفض ' + rv.name + ' عرضك: ' + wh + '.', ''); return { ok: true, accepted: false, msg: 'رفض ' + rv.name + ' عرضك: ' + wh };
  },
  // قبول عرضه الوارد: مضمون بعد إعادة فحص الأهلية والمال والخانة
  rvpAccept(S, id) {
    const st = rvpSt(S), off = st && st.off.find(x => x.id === id); if (!off) return NO('العرض لم يعد قائماً'); if (!rvpOn(S)) return NO('غير متاحة الآن'); const rv = rvpGet(S, off.rid); { const lk = lessonLock(S, 'pact'); if (lk) return NO(lk); }
    const t = off.terms, why = rvpBlock(S, rv, off.kind, off.kind === 'rmud' ? t : { recipe: t.recipe, f: t.f }, { off: off.id, incoming: true }); if (why) return NO(why);
    st.off = st.off.filter(x => x !== off); return rvpSignNow(S, rv, off.kind, t);
  },
  rvpDecline(S, id) { const st = rvpSt(S), off = st && st.off.find(x => x.id === id); if (!off) return NO('العرض لم يعد قائماً'); st.off = st.off.filter(x => x !== off); return OK('رفضتَ العرض'); },
  rvpWithdraw(S, id) { const ag = (S.player.agr || []).find(x => x.id === id && x.kind === 'rmud'); if (!ag) return NO('لا مضاربة'); const v = rvpWithdrawNow(S, ag); rvpMudSettle(S, ag, 'سحبتَ مالك قبل الأجل فحُسب ما حدث إلى يومه'); return OK('استرددتَ ' + fmtN(v) + ' ريال'); },
});
for (const k of ['rvpOffer', 'rvpAccept', 'rvpDecline', 'rvpWithdraw']) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }
// §8 الأثر على السوق: ضغط الشريك أخف، ومساهمته في الصندوق أكبر
const rvpRelief = (S, rv) => (RIVP.on && S.player.agr && S.player.agr.length && rvpPartner(S, rv) ? 1 - RIVP.relief : 1);
function rvpFund(S, id, sp) { if (!RIVP.on || !S.player.agr || !S.player.agr.length) return; for (const rv of (S.rivals || [])) if (rv.out == null && rv.city === id && rvpPartner(S, rv)) mfAdd(S, id, 'rivals', RIVP.fundBoost * MFUND.rivalUnit * rgStr(S, rv, true) * sp); }
// §13 تفويض الناظر: يقبل من العروض الواردة ما يقع ضمن حدّه
const rvpDlPick = (S, t) => { const st = rvpSt(S), cap = t.limits.capPct / 100 * S.player.gold; return st ? st.off.filter(o => { if (o.kind === 'rmud') return o.terms.cap <= cap && o.terms.share >= t.limits.minShare; const rv = rvpGet(S, o.rid); if (!rv) return false; const K = partCost(S, rv.city, o.terms.recipe); return K - Math.round(K * o.terms.f) <= cap; }) : []; };
Object.assign(DELEG_KINDS, { rvpart: { id: 'rvpart', name: 'شراكات المنافسين', types: ['standing'], def: { type: 'standing', scope: '*', capPct: 10, minShare: 0.5, mode: 'exec' },
  check(S, s) { if (!rvpOn(S)) return NO('شراكات المنافسين غير مفعّلة'); if (![5, 10, 20].includes(+s.limits.capPct)) return NO('اختر سقفاً 5 أو 10 أو 20٪ من الرصيد'); if (!INFLU.mud.shares.includes(+s.limits.minShare)) return NO('اختر أدنى نسبة لك من الربح'); return OK(''); },
  norm(s) { return { capPct: +s.limits.capPct, minShare: +s.limits.minShare, pct: +s.limits.capPct }; },
  plan(S, t) { const pick = rvpDlPick(S, t); return { n: pick.length, total: pick.length, cost: 0, pick, text: 'أقبل ' + pick.length + ' عرضاً من منافسي أسواقك ضمن ' + t.limits.capPct + '٪ من رصيدك وبنسبة لك لا تقل عن ' + Math.round(t.limits.minShare * 100) + '٪' }; },
  run(S, t) { const pick = rvpDlPick(S, t); let n = 0, cost = 0; const names = []; for (const o of pick) { const rv = rvpGet(S, o.rid), g0 = S.player.gold, r = A.rvpAccept(S, o.id); if (r.ok !== false) { n++; cost += g0 - S.player.gold; names.push(rv ? rv.name : ''); } } return { done: false, did: n ? 'قبلتُ ' + n + ' عرضاً (' + names.join('، ') + ') بنحو ' + fmtN(Math.round(cost)) + ' ريال من مالك' : '', cost }; },
  fields(S, d) { return [{ k: 'capPct', title: 'أقصى ما يضعه من رصيدك', opts: [5, 10, 20].map(p => ({ v: p, label: p + '٪ من رصيدك', effect: 'حتى ' + fmtN(Math.round(S.player.gold * p / 100)) + ' ريال للعقد' })) }, { k: 'minShare', title: 'أدنى نسبة لك من الربح', opts: INFLU.mud.shares.map(x => ({ v: x, label: Math.round(x * 100) + '٪', effect: 'يرفض المضاربة بأقل منها' })) }]; },
  sum(S, d) { const t = { limits: { capPct: d.capPct, minShare: d.minShare } }; return 'قبول عروض شراكة المنافسين الواردة ضمن ' + d.capPct + '٪ من رصيدك (' + fmtN(Math.round(S.player.gold * d.capPct / 100)) + ' ريال) ونسبة لك ≥ ' + Math.round(d.minShare * 100) + '٪: ' + rvpDlPick(S, t).length + ' عرض الآن'; } } });
function rvpBreak(S, ag) { if (ag.kind === 'rpart') return NO('شراكة المصنع لا تُفسخ قبل أجلها'); const v = rvpWithdrawNow(S, ag); rvpMudSettle(S, ag, 'سحبتَ مالك قبل الأجل فحُسب ما حدث إلى يومه'); return OK('استرددتَ ' + fmtN(v) + ' ريال'); }
// للواجهة
function rvpTerms(S, rv, kind, o) {
  const ch = rvpChance(S, rv, kind, o), why = rvpBlock(S, rv, kind, o);
  if (kind === 'rmud') return { chance: ch.word, p: ch.p, why, cap: o.cap, share: o.share, days: o.days, sum: 'ستضع ' + fmtN(o.cap) + ' ريال عند ' + rv.name + ' مدة ' + o.days + ' يوماً، لك ' + Math.round(o.share * 100) + '٪ من الربح، والخسارة على المال وحده' };
  const K = o.recipe ? partCost(S, rv.city, o.recipe) : 0, boss = Math.round(K * o.f); return { chance: ch.word, p: ch.p, why, K, boss, mine: K - boss, sum: 'ستدفع ' + fmtN(K - boss) + ' من ' + fmtN(K) + ' كلفة المصنع، ويدفع ' + rv.name + ' ' + fmtN(boss) + ' (' + Math.round(o.f * 100) + '٪)، مدة ' + INFLU.part.days + ' يوماً' };
}
const rvpAgView = a => (a.kind === 'rmud' ? { fin: true, rival: true, cap: a.cap, val: Math.round(mudValue(a)), share: a.share, pnl: Math.round(a.pnl || 0) } : { fin: true, mfg: true, rival: true, recipe: a.recipe, share: a.share, K: a.K, boss: a.boss, pnl: Math.round(a.pnl || 0), owed: Math.round(partOwed(a)) });
function rvpView(S) {
  const st = rvpSt(S), list = (S.player.agr || []).filter(a => RPK[a.kind]).map(a => { const rv = rvpGet(S, a.rid), part = !!(rv && rv.out == null && !a.orphan), mud = a.kind === 'rmud'; return { id: a.id, kind: a.kind, name: AGR_KINDS[a.kind].name, rid: a.rid, rname: a.rname, rcity: a.rcity, wealth: rv && rv.w != null ? rv.w : null, left: a.left, total: a.total, paid: mud ? a.cap : Math.round(a.K - a.boss), val: mud ? Math.round(mudValue(a)) : Math.round(a.K + Math.max(-a.K, a.pnl || 0) - partOwed(a)), pnl: Math.round(a.pnl || 0), months: a.months || [], dm: a.dm || 0, share: a.share, orphan: !!a.orphan, back: mud ? rvpWithdrawNow(S, a) : null, relief: part ? Math.round(RIVP.relief * 100) : 0, fundDay: part && rv ? Math.round(RIVP.fundBoost * MFUND.rivalUnit * rgStr(S, rv, true) * Math.pow(shopProsper(S.cities[rv.city]), 0.6) * 10) / 10 : 0, recipe: a.recipe || null, orphanWhy: a.orphan ? a.led.why : '' }; });
  const off = st ? st.off.map(o => { const rv = rvpGet(S, o.rid); return { id: o.id, rid: o.rid, rname: rv ? rv.name : '', kind: o.kind, name: AGR_KINDS[o.kind].name, terms: o.terms, exp: o.exp, days: o.exp - S.day }; }) : [];
  return { on: rvpOn(S), n: list.length, net: list.reduce((a, x) => a + x.dm, 0), off, list };
}
