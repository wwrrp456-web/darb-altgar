/* ---------- العقود الصناعية مع زعماء الأسواق (036د): الاستصناع (CT-07) وتوريد المواد الخام (CT-08) وشراكة المصنع (CT-09) ----------
   تعيش في سجل الاتفاقيات P.agr (خانات، دفتر، لا قفل بين عقدين) وتحتاج سوقاً تحكمه وزعيم سوق آخر طرفاً. عائلة INFLU.fam.mfg ولكل عقد مفتاحه؛ false = لا توقيع ولا عرض، وما قام يُسوّى فلا يعلق مال.
   الاستصناع: تطلب سلعة مصنّعة من مصنع الزعيم (ما يبيعه سوقه وله وصفة) بكمية وثمن ومدة؛ الثمن = كمية × سعر السوق × جودة المصنع (factoryQual) × (1 − خصم)، والمدة تطول بانخفاض الجودة. الدفع كله مقدماً أو على دفعات
     أو تعجيل جزء وتأجيل الباقي عند التسليم بالاتفاق. تصل السلعة بجودتها إلى مخزنك. إن تأخر الصانع (صدمة أو حرب أو مواد غالية) عُوّضتَ بقدر **الضرر المالي الفعلي** (ما دفعتَه × عائد فرصتك اليومي × أيام التأخير)، لا مبلغاً ثابتاً.
     وإن عجزتَ عن دفع الباقي عند التسليم عشرة أيام فسُخ العقد ويخسر العربون بقدر الضرر الفعلي فقط (انخفاض سعر السلعة عما اتُّفق عليه) ويُردّ الباقي. لا فسخ بعد أن يبدأ الصانع.
   توريد المواد الخام: لمواد يحتاجها مصنع لك في سوقك المحكوم ويبيعها الزعيم؛ نمطان: «عقد توريد دوري» (كل دفعة إيجاب وقبول عند تسليمها فتقبلها أو ترفضها بلا غرامة) أو «سلم دوري» (تدفع ثمن كل دفعة على حدة قبل تسلمها وتصلك بعد أيام؛
     وعند تعذر التسليم يُردّ ثمنها بنسبة ما لم يُسلَّم). لا التزام بدفعات قادمة ولا بيع قطعي آجل البدلين؛ رفض الدفعة يضيّع تقدّم العقد فقط.
   شراكة المصنع: الزعيم يدفع **حصة نقدية** من كلفة مصنع تبنيه في سوقك المحكوم (20/35/50٪)، فيدخل مالُه رأس المال فعلاً وتدفع أنت الباقي. يُقسَّم **الربح والخسارة بقدر الحصص** (ربح المصنع اليومي من قيمة ما أنتج مطروحاً منه المواد والأجور والصيانة).
     عند نهاية المدة (90 يوماً) تشتري حصته بقدر حصته من (رأس المال + الربح) ولا يخسر أكثر من رأس ماله؛ فإن لم يكفِ نقدك مُدّت 30 يوماً. الجاه والتسهيلات لا تُحسب حصة. زكاة الشراكة: يُخصم من وعائك نصيب الزعيم من الربح (حصتك وحدها)، وأصول المصنع الثابتة لا زكاة فيها.
   مفاتيح: INFLU.fam.mfg وINFLU.ist.on وINFLU.raw.on وINFLU.part.on. الحقول اختيارية في الحفظ. */
INFLU.fam.mfg = true;
Object.assign(INFLU, {
  ist: { on: true, tier: [20, 30, 40], disc: { full: 0.05, part: 0.03, inst: 0 }, advance: 0.4, instN: 4, opp: 0.0025, wait: 10, roomWait: 7, minTrust: 0 },
  raw: { on: true, period: 30, periods: 3, cut: 0.08, cutSalam: 0.12, step: 0.01, lag: 10, wait: 5, minTrust: 0 },
  part: { on: true, shares: [0.2, 0.35, 0.5], days: 90, ext: 30, minTrust: 10 },
});
Object.assign(AGR_KINDS, {
  ist: { fam: 'mfg', name: 'الاستصناع', icon: '🏭', minTrust: INFLU.ist.minTrust, desc: 'تطلب من مصنع الزعيم سلعة بمواصفات تتفقون عليها، بثمن معلوم ومدة محددة.', obl: 'تستلمها حين تنتهي، وتدفع الثمن كله أو على دفعات أو تعجّل جزءاً منه وتؤجل الباقي بالاتفاق.' },
  raw: { fam: 'mfg', name: 'توريد المواد الخام (عقد توريد دوري)', icon: '📦', minTrust: INFLU.raw.minTrust, desc: 'يورّد لك الزعيم مواد لمصانعك بسعر متفق عليه للدفعة.', obl: 'عقد توريد دوري يتجدد فيه الإيجاب والقبول عند تسليم كل دفعة. أو سلم دوري تدفع فيه ثمن كل دفعة على حدة قبل تسلمها.', note: 'ومن رفض دفعة لا غرامة عليه، لكن لا يتقدّم عقده ولا تتحسن شروطه.' },
  part: { fam: 'mfg', name: 'شراكة مصنع', icon: '🤝', minTrust: INFLU.part.minTrust, desc: 'يشاركك الزعيم في مصنع بحصة نقدية يدفعها من ماله.', obl: 'تُقسَّم الأرباح بقدر الحصص، وتقع الخسارة بقدر الحصص أيضاً. والحصة مالٌ نقدي أو أصول مقوَّمة بالمال، ولا يُحسب الجاه ولا التسهيلات حصة.' },
});
const mfgLog = (S, ag, net) => { const L = S.player.agrLog || (S.player.agrLog = []); L.push({ k: ag.kind, c: ag.city, d: S.day, n: Math.round(net) }); if (L.length > 40) L.shift(); }; // سجل ما ربحتَه أو خسرتَه فعلاً من كل عقد صناعي منتهٍ
const MFG_KINDS = { ist: 1, raw: 1, part: 1 }; Object.assign(FIN_KINDS, MFG_KINDS);
const istQual = (S, city, g) => factoryQual(S, { local: false, hp: 100, city, recipe: g, level: 1 }); // جودة مصنع الزعيم تتبع factoryQual (سمعتك ومشاريعك)
const istLead = (S, city, g, q) => Math.ceil(INFLU.ist.tier[MFG_COST(g) < 10000 ? 0 : MFG_COST(g) < 15000 ? 1 : 2] / (0.5 + 0.5 * q));
const istGoods = (S, city) => Object.keys(RECIPES).filter(g => !RECIPES[g].closed && sells(S.cities[city], g) && !GD[g].live);
function istTerms(S, city, g, qty, pay) { const c = S.cities[city], q = istQual(S, city, g), unit = unitPrice(c, g) * q * (1 - INFLU.ist.disc[pay]); return { q, unit, price: unit * qty, days: istLead(S, city, g, q) }; }
const rawGoods = (S, home, city) => { const have = new Set(); for (const f of S.player.factories) if (f.city === home && RECIPES[f.recipe]) for (const g in RECIPES[f.recipe].inp) have.add(g); const c = S.cities[city]; return [...have].filter(g => sells(c, g) && GD[g] && !GD[g].live); };
const rawCut = (S, mode) => (mode === 'salam' ? INFLU.raw.cutSalam : INFLU.raw.cut) + INFLU.raw.step * finTier(S);
function partCost(S, home, recipe) { const rc = RECIPES[recipe], c = S.cities[home]; return factoryLocal(c, rc) ? Math.round(4000 * foreignMul(S, c)) : MFG_COST(rc.out); }
function partRecipes(S, home) { const out = []; for (const k of Object.keys(RECIPES)) { const rc = RECIPES[k]; if (rc.closed || S.player.factories.some(f => f.city === home && f.recipe === k)) continue; if (!factoryLocal(S.cities[home], rc) && factoryMakeBlock(S, home, k)) continue; out.push(k); } return hasPresence(S, home) ? out : []; }
const partOf = (S, f) => (f.part != null ? (S.player.agr || []).find(a => a.id === f.part && a.kind === 'part') || null : null);
const partOwed = ag => { const p = Math.max(-ag.K, ag.pnl || 0); return Math.max(0, ag.share * (ag.K + p)); }; // ما يستحقه الزعيم لو صُفّيت الآن
function mfgBlock(S, city, kind, o) {
  const P = S.player, c = S.cities[city];
  if (kind === 'ist') {
    if (!istGoods(S, city).includes(o.g)) return 'سلعة لا تصلح لهذا العقد'; if (!['full', 'inst', 'part'].includes(o.pay)) return 'اختر طريقة الدفع'; if (!(o.qty >= 1)) return 'كمية غير صالحة';
    const pr = P.props[o.home]; if (!pr || !(pr.whs > 0) || storeRoom(S, o.home) < o.qty * GD[o.g].w) return 'لا مكان في مخزنك بسوقك المحكوم لهذه الكمية';
    const T = istTerms(S, city, o.g, o.qty, o.pay), first = o.pay === 'full' ? T.price : o.pay === 'part' ? T.price * INFLU.ist.advance : T.price / INFLU.ist.instN; if (P.gold < first) return 'الدفعة الأولى تحتاج ' + Math.ceil(first);
  } else if (kind === 'raw') {
    if (!['supply', 'salam'].includes(o.mode)) return 'اختر نمط التوريد'; if (!rawGoods(S, o.home, city).includes(o.g)) return 'يلزم مصنع لك في سوقك المحكوم يستعمل هذه المادة ويبيعها الزعيم'; if (!(o.qty >= 1)) return 'كمية غير صالحة';
    if (!(P.props[o.home] && P.props[o.home].whs > 0)) return 'لا مخزن لك في سوقك المحكوم';
  } else if (kind === 'part') {
    if (!INFLU.part.shares.includes(o.share)) return 'اختر حصة الزعيم'; if (!partRecipes(S, o.home).includes(o.recipe)) return 'لا مصنع جديد من هذا النوع في ' + S.cities[o.home].name + ' (يلزم دكان ولا مصنع مماثل، وإذن صاحب المنتج)';
    { const lk = lessonLock(S, 'factory'); if (lk) return lk; } if (S.phase < 3) return 'يُفتح في الطور 3'; const K = partCost(S, o.home, o.recipe), mine = Math.round(K * (1 - o.share)); if (P.gold < mine) return 'حصتك تحتاج ' + mine;
  }
  return null;
}
function mfgSign(S, city, kind, o) {
  const P = S.player, bs = bossOf(S, city), c = S.cities[city], rec = { id: S.nextId++, kind, city, home: o.home, goods: o.g || null, qty: o.qty || 0, since: S.day, cnt: 0, ok: 0, miss: 0, led: { exp: 0, act: 0, why: '' }, hist: [] };
  if (kind === 'ist') {
    const T = istTerms(S, city, o.g, o.qty, o.pay), n = INFLU.ist.instN, first = o.pay === 'full' ? T.price : o.pay === 'part' ? T.price * INFLU.ist.advance : T.price / n; pPay(S, 'purchases', first, false);
    Object.assign(rec, { pay: o.pay, price: T.price, unit: T.unit, q: T.q, paid: first, left: T.days, total: T.days, got: 0, dw: 0, late: null, ref: unitPrice(c, o.g) }); rec.led.exp = o.qty;
  } else if (kind === 'raw') { Object.assign(rec, { mode: o.mode, left: INFLU.raw.period * INFLU.raw.periods, total: INFLU.raw.period * INFLU.raw.periods, batch: null, pend: [], took: 0, refused: 0 }); rec.led.exp = o.qty; }
  else { const K = partCost(S, o.home, o.recipe), boss = Math.round(K * o.share), g0 = P.gold; P.gold += boss; const r = A.buildFactory(S, o.home, o.recipe); if (r.ok === false) { P.gold = g0; return NO(r.msg); }
    const f = P.factories[P.factories.length - 1]; f.part = rec.id; Object.assign(rec, { recipe: o.recipe, share: o.share, K, boss, fid: f.id, pnl: 0, left: INFLU.part.days, total: INFLU.part.days, days: 0 }); rec.led.exp = boss; rec.led.act = 0; }
  (P.agr || (P.agr = [])).push(rec); bs.pacted = true; return OK('وقّعت ' + AGR_KINDS[kind].name + ' مع ' + bs.name + (rec.total ? ' لمدة ' + rec.total + ' يوماً' : ''));
}
Object.assign(A, {
  rawAccept(S, id) {
    const P = S.player, ag = (P.agr || []).find(x => x.id === id && x.kind === 'raw'); if (!ag) return NO('لا اتفاقية'); const b = ag.batch; if (!b || S.day > b.until) return NO('لا دفعة معروضة');
    const c = S.cities[ag.city], pr = P.props[ag.home], w = GD[ag.goods].w; if (!pr) return NO('لا مخزن لك في ' + S.cities[ag.home].name);
    if (ag.mode === 'salam') { const cost = b.qty * b.unit; if (P.gold < cost) return NO('الدفعة تحتاج ' + Math.ceil(cost)); if (storeRoom(S, ag.home) < b.qty * w) return NO('لا مكان في مخزنك لهذه الدفعة'); pPay(S, 'purchases', cost, false); ag.pend.push({ due: S.day + INFLU.raw.lag, qty: b.qty, cap: cost, unit: b.unit, dw: 0, ref: unitPrice(c, ag.goods) }); ag.took++; ag.batch = null; ag.led.why = 'دفعتَ ثمن دفعة ' + b.qty + ' وتصلك بعد ' + INFLU.raw.lag + ' أيام'; return OK('دفعتَ ثمن الدفعة: تصلك بعد ' + INFLU.raw.lag + ' أيام'); }
    ctxFor(S, ag.city); const n = Math.min(b.qty, Math.floor(c.stock[ag.goods] || 0), Math.floor(storeRoom(S, ag.home) / w)); if (n < 1) return NO('لا مكان في مخزنك أو لا بضاعة عند الزعيم'); const cost = n * b.unit + b.cust * (n / b.qty); if (P.gold < cost) return NO('الدفعة تحتاج ' + Math.ceil(cost));
    pPay(S, 'purchases', cost, false); c.stock[ag.goods] -= n; pr.store[ag.goods] = (pr.store[ag.goods] || 0) + n; addBasis(pr.basis || (pr.basis = {}), ag.goods, n, cost); ag.led.act += n; ag.gain = (ag.gain || 0) + n * (unitPrice(c, ag.goods) - b.unit) - b.cust * (n / b.qty); ag.led.why = 'قبلتَ دفعة ' + n + ' من ' + b.qty + ' بسعر ' + Math.round(b.unit) + ' للوحدة'; ag.took++; ag.batch = null;
    return OK('قبلتَ الدفعة: ' + n + ' وحدة من ' + GD[ag.goods].name + ' في مخزنك بـ ' + Math.round(cost) + ' ريال');
  },
  rawReject(S, id) { const ag = (S.player.agr || []).find(x => x.id === id && x.kind === 'raw'); if (!ag || !ag.batch) return NO('لا دفعة معروضة'); ag.batch = null; ag.refused++; ag.led.why = 'رفضتَ الدفعة: بلا غرامة، ولا يتقدّم العقد'; return OK('رفضتَ الدفعة بلا غرامة'); },
  partBuyout(S, id) { const ag = (S.player.agr || []).find(x => x.id === id && x.kind === 'part'); if (!ag) return NO('لا شراكة'); const due = partOwed(ag); if (S.player.gold < due) return NO('شراء حصة الزعيم يحتاج ' + Math.ceil(due)); partSettle(S, ag, bossOf(S, ag.city) || { trust: 0 }, true); S.player.agr = S.player.agr.filter(x => x !== ag); return OK('اشتريتَ حصة الزعيم وصار المصنع لك وحدك'); },
});
for (const k of ['rawAccept', 'rawReject', 'partBuyout']) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }
// ---- الاستصناع ----
function istDelay(S, c, g) { let d = 0; if (c.sh) d += Math.ceil((c.sh.cut || 0.3) * 14); if (c.ev && c.ev.k === 'war') d += 5; const inp = RECIPES[g] ? Object.keys(RECIPES[g].inp) : []; if (inp.length && inp.reduce((t, x) => t + ratio(c, x), 0) / inp.length > 1.3) d += 3; return d; }
function istDeliver(S, ag, bs) {
  const P = S.player, c = S.cities[ag.city], g = ag.goods, pr = P.props[ag.home], w = GD[g].w; /* الدفع بعملتك لا بعملة السوق */
  if (ag.late == null) { ag.late = istDelay(S, c, g); ag.lateN = 0; ag.led.why = ag.late ? 'تأخّر الصانع ' + ag.late + ' أيام' : ''; }
  if (ag.lateN < ag.late) { ag.lateN++; return false; }
  const room = pr ? Math.floor(storeRoom(S, ag.home) / w) : 0, n = Math.min(ag.qty - ag.got, room); const frac = (ag.got + n) / ag.qty, owe = Math.max(0, ag.price * frac - ag.paid);
  if (n > 0 && P.gold >= owe) { if (owe > 0) { pPay(S, 'purchases', owe, false); ag.paid += owe; } pr.store[g] = (pr.store[g] || 0) + n; addBasis(pr.basis || (pr.basis = {}), g, n, ag.price * n / ag.qty, ag.q); ag.got += n; ag.led.act = ag.got; }
  else if (n > 0) { ag.pw = (ag.pw || 0) + 1; ag.led.why = 'جاهزة بانتظار دفع الباقي: ' + Math.ceil(owe); if (ag.pw >= INFLU.ist.wait) return istCancel(S, ag, bs); return false; }
  else { ag.dw++; if (ag.dw >= INFLU.ist.roomWait) { const back = ag.paid * (ag.qty - ag.got) / ag.qty; P.gold += back; ag.led.why = 'لا مكان في مخزنك: رُدّ ما دفعتَه عن غير المُسلَّم ' + Math.round(back); news(S, ag.led.why + ' (' + AGR_KINDS.ist.name + ').', ''); return true; } ag.led.why = 'ننتظر مكاناً في مخزنك'; return false; }
  if (ag.got >= ag.qty) {
    if (ag.late > 0) { const dmg = ag.paid * INFLU.ist.opp * ag.late; P.gold += dmg; mfgLog(S, ag, dmg); fauc(S, 'compensation', dmg); P.led.inc.compensation = (P.led.inc.compensation || 0) + dmg; ag.led.why = 'تأخّر الصانع ' + ag.late + ' أيام فعُوّضتَ ' + Math.round(dmg) + ' (الضرر الفعلي: ما دفعتَه × عائد فرصتك اليومي × أيام التأخير)'; news(S, 'تأخّر مصنع ' + bs.name + ' في ' + AGR_KINDS.ist.name + ': ' + INFLU_TXT.penal + '؛ عُوّضتَ ' + Math.round(dmg) + ' ريالاً.', 'good'); }
    else { ag.led.why = 'استلمتَ ' + ag.got + ' وحدة من ' + GD[g].name + ' بجودة ' + Math.round(ag.q * 100) + '٪'; mfgLog(S, ag, ag.ref * ag.q * ag.qty - ag.price); } news(S, 'استلمتَ طلبك من ' + GD[g].name + ' (' + ag.got + ' وحدة) في ' + S.cities[ag.home].name + '.', 'good'); finSpecAdd(S, 1); ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); return true; }
  return false;
}
function istCancel(S, ag, bs) { // عجز عن دفع الباقي: يخسر العربون بقدر الضرر الفعلي فقط (انخفاض سعر السلعة عما اتُّفق عليه) ويُردّ الباقي
  const P = S.player, c = S.cities[ag.city], dmg = Math.min(ag.paid, Math.max(0, (ag.ref - unitPrice(c, ag.goods)) * ag.q * (ag.qty - ag.got))), back = ag.paid * (ag.qty - ag.got) / ag.qty - dmg; P.gold += Math.max(0, back); mfgLog(S, ag, -dmg);
  ag.led.why = 'عجزتَ عن دفع الباقي فسُخ العقد: رُدّ إليك ' + Math.round(Math.max(0, back)) + ' وخسرتَ ' + Math.round(dmg) + ' بقدر ضرر الصانع الفعلي'; news(S, ag.led.why + '.', 'bad'); ag.miss++; finSpecAdd(S, -1); bs.trust = clamp(bs.trust - INFLU.trustMiss, -100, 100); return true;
}
// ---- التوريد الدوري ----
function rawDay(S, ag, bs) {
  const c = S.cities[ag.city], P = S.player, w = GD[ag.goods].w, pr = P.props[ag.home]; ag.cnt++;
  for (const p of ag.pend.slice()) if (S.day >= p.due) { // سلم دوري: تسليم أو رد بنسبة ما لم يُسلَّم
    const spoil = !!(c.sh && ['drought', 'flood', 'famine'].includes(c.sh.k)), avail = spoil ? 0 : Math.floor((c.stock[ag.goods] || 0) * INFLU.salam.take), room = pr ? Math.floor(storeRoom(S, ag.home) / w) : 0, n = Math.max(0, Math.min(p.qty, avail, room));
    if (n > 0) { c.stock[ag.goods] -= n; pr.store[ag.goods] = (pr.store[ag.goods] || 0) + n; addBasis(pr.basis || (pr.basis = {}), ag.goods, n, n * p.unit); p.qty -= n; p.cap -= n * p.unit; ag.led.act += n; ag.gain = (ag.gain || 0) + n * ((p.ref || p.unit) - p.unit); }
    if (p.qty <= 0) { ag.pend = ag.pend.filter(x => x !== p); continue; }
    if (spoil || ++p.dw >= INFLU.salam.wait) { const back = p.cap; P.gold += back; ag.pend = ag.pend.filter(x => x !== p); ag.led.why = INFLU_TXT.refund + ' (' + Math.round(back) + ')'; news(S, INFLU_TXT.refund + ' ' + AGR_KINDS.raw.name + ': ' + Math.round(back) + ' ريال.', ''); }
  }
  if (ag.batch && S.day > ag.batch.until) { ag.batch = null; ag.refused++; ag.led.why = 'مرّت مهلة الدفعة دون قبول: لا غرامة، ولا يتقدّم العقد'; }
  if (ag.cnt % INFLU.raw.period === 1 && !ag.batch) { const cut = rawCut(S, ag.mode), unit = unitPrice(c, ag.goods) * (1 - cut), hc = S.cities[ag.home], cust = ag.mode === 'salam' || hc.country === c.country ? 0 : CD[hc.country].customs * perkMul(S, 'customs') * INFLU.impCust * unit * ag.qty; ag.batch = { qty: ag.qty, unit, cust, until: S.day + INFLU.raw.wait, day: S.day }; ag.led.why = 'عُرضت دفعة جديدة: اقبلها أو ارفضها'; }
  if (ag.cnt % INFLU.raw.period === 0) { if (ag.took) { finSpecAdd(S, 1); ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); } else if (ag.refused) { finSpecAdd(S, -1); ag.miss++; } ag.took = 0; ag.refused = 0; }
}
// ---- الشراكة ----
function partSettle(S, ag, bs, early) { // يشتري اللاعب حصة الزعيم: حصته من (رأس المال + الربح) ولا يخسر أكثر من رأس ماله
  const P = S.player, due = partOwed(ag), pay = Math.min(due, P.gold); P.gold -= pay; P.led.exp.assets = (P.led.exp.assets || 0) + pay; sink(S, 'pactShare', Math.max(0, pay - ag.boss));
  mfgLog(S, ag, ag.boss - pay); const f = P.factories.find(x => x.id === ag.fid); if (f) delete f.part; ag.led.act = Math.round(pay); const p = Math.max(-ag.K, ag.pnl || 0);
  ag.led.why = 'اشتريتَ حصة الزعيم (' + Math.round(ag.share * 100) + '٪) بقدر حصته من رأس المال والربح: ' + Math.round(pay) + (p >= 0 ? ' (ربح المصنع ' : ' (خسارة المصنع ') + Math.abs(Math.round(p)) + ' قُسّمت بالنسبة)';
  news(S, 'انتهت ' + AGR_KINDS.part.name + ' مع ' + bs.name + ': ' + ag.led.why + '.', p >= 0 ? 'good' : ''); if (!early) { finSpecAdd(S, 1); ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); }
}
function factoryDayTracked(S, f) { // يُستدعى بدل factoryDay: لمصنع شراكة يقيس ربحه اليومي (قيمة المخزن بالمتوسط + النقد قبل وبعد)
  const ag = INFLU.on ? partOf(S, f) : null; if (!ag) return factoryDay(S, f);
  const P = S.player, pr = P.props[f.city], v0 = P.gold + (pr ? valueOf(pr.store) : 0); factoryDay(S, f); if (!P.factories.includes(f)) { ag.gone = true; return; }
  const v1 = P.gold + (pr ? valueOf(pr.store) : 0); ag.pnl = Math.max(-ag.K, (ag.pnl || 0) + (v1 - v0));
}
function mfgDay(S, ag, bs) { // يومياً لعقد صناعي قائم (من agrFinDay)
  if (ag.kind === 'raw') { ag.left--; rawDay(S, ag, bs); if (ag.left <= 0 && !ag.pend.length) { mfgLog(S, ag, ag.gain || 0); S.player.agr = S.player.agr.filter(x => x !== ag); } return; }
  if (ag.kind === 'part') { ag.days++; ag.left--; ag.led.act = Math.round(partOwed(ag)); if (ag.gone) { partSettle(S, ag, bs, true); S.player.agr = S.player.agr.filter(x => x !== ag); return; }
    if (ag.left <= 0) { if (S.player.gold >= partOwed(ag)) { partSettle(S, ag, bs, false); S.player.agr = S.player.agr.filter(x => x !== ag); } else { ag.left = INFLU.part.ext; ag.led.why = 'نقدك لا يكفي لشراء حصة الزعيم: مُدّت الشراكة ' + INFLU.part.ext + ' يوماً'; } } return; }
  // ist: دفعات التقسيط ثم التسليم
  ag.left--; const T = ag.total, n = INFLU.ist.instN;
  if (ag.pay === 'inst' && ag.paid < ag.price - 1e-9 && ag.left > 0) { const k = Math.floor((T - ag.left) * n / T); const due = Math.min(ag.price, ag.price * (1 + k) / n) - ag.paid; if (k >= 1 && due > 1e-9 && S.player.gold >= due) { pPay(S, 'purchases', due, false); ag.paid += due; } }
  if (ag.left <= 0) { if (istDeliver(S, ag, bs)) S.player.agr = S.player.agr.filter(x => x !== ag); }
}
function mfgClose(S, ag, why) { // حكمتَ سوق الطرف الثاني (أو فسخ): لا يعلق مال
  const P = S.player, bs = bossOf(S, ag.city) || { trust: 0 };
  if (ag.kind === 'ist') { const back = ag.paid * (ag.qty - ag.got) / ag.qty; P.gold += back; news(S, 'رُدّ إليك ما دفعتَه عن غير المُسلَّم في ' + AGR_KINDS.ist.name + ': ' + Math.round(back) + ' ريال.', ''); }
  else if (ag.kind === 'raw') { let back = 0; for (const p of ag.pend) back += p.cap; if (back > 0) { P.gold += back; news(S, INFLU_TXT.refund + ' ' + AGR_KINDS.raw.name + ': ' + Math.round(back) + ' ريال.', ''); } }
  else partSettle(S, ag, bs, true);
}
function mfgAssets(S) { // ما دُفع ولم يُسلَّم (استصناع، سلم دوري) يدخل الثروة والزكاة؛ وحصة شريكك دَين عليك، ونصيبه من الربح يُخصم من وعاء الزكاة (حصتك وحدها)
  let total = 0, zk = 0, paid = 0, part = 0; for (const a of (S.player.agr || [])) {
    if (a.kind === 'ist') { const v = a.paid * (a.qty - a.got) / a.qty; total += v; paid += v; zk += v; }
    else if (a.kind === 'raw') { for (const p of a.pend || []) { total += p.cap; paid += p.cap; zk += p.cap; } }
    else if (a.kind === 'part') { total -= partOwed(a); part += partOwed(a); zk -= a.share * Math.max(0, a.pnl || 0); } }
  return { total, zk, paid, part };
}
function mfgView(a) {
  const o = { fin: true, mfg: true };
  if (a.kind === 'ist') Object.assign(o, { price: Math.round(a.price), paid: Math.round(a.paid), pay: a.pay, q: a.q, got: a.got, late: a.late });
  else if (a.kind === 'raw') Object.assign(o, { mode: a.mode, batch: a.batch, pend: (a.pend || []).length, took: a.took || 0 });
  else Object.assign(o, { recipe: a.recipe, share: a.share, K: a.K, boss: a.boss, pnl: Math.round(a.pnl || 0), owed: Math.round(partOwed(a)) });
  return o;
}
