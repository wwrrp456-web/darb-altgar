/* ---------- العقود المالية مع زعماء الأسواق (036ج): السلم (CT-04) والمضاربة مع «تجار السوق» (CT-05) والوكالة بالعمولة (CT-06) ----------
   تعيش في سجل الاتفاقيات P.agr نفسه (خانات slotsOf، دفتر، لا قفل بين عقدين)، وتحتاج سوقاً تحكمه (FR-001) وزعيم سوق آخر طرفاً ثانياً. الحقول اختيارية في الحفظ.
   السلم: تدفع الآن ثمناً أقل من المعتاد لكمية محددة من سلعة يبيعها سوق الزعيم، وتصل مخزنك في سوقك المحكوم عند الأجل؛ لا فسخ ولا بيع قبل القبض (لا ذمة تُباع). إن تعذّر التسليم (فساد المحصول بجفاف أو فيضان أو قحط، أو نفاد السلعة)
     رُدّ إليك ثمنك كاملاً بنسبة ما لم يُسلَّم دون زيادة ولا نقصان (CT-13 ب). رأس مال السلم يدخل وعاء الزكاة بحوله.
   المضاربة: رأس مال (بسقف حجم بحسب نفوذك وحجم السوق) عند «تجار السوق» (جهة جماعية لا أشخاص) لمدة 30 أو 60 يوماً، ونسبة ربحك تتفقان عليها قبل البدء. عائدها يُحسب كل يوم من هوامش السوق الفعلية (فرق أسعار السلع والمواسم والأحداث c.ev والصدمات c.sh
     وتغيّر مؤشر الأسعار) لا من رقم عشوائي، فهو حتمي بالبذرة وقد يكون سالباً. الخسارة على رأس المال وحده ولا ضمان لربح ولا لمال. سحب مبكر بفسخ وتصفية بالقيمة الحالية بلا غرامة. متوسط عائدها دون تجارتك المباشرة بنحو النصف.
   الوكالة: الزعيم يبيع سلعك الموضوعة عنده (من مخزنك أو قافلتك في سوقه) بنسبة مئوية معلومة من ثمن ما يبيعه، ويحاسبك كل يوم؛ والباقي يُردّ إلى مخزنك عند الانتهاء أو يُصفّى.
   الزكاة (FR-024): رأس مال المضاربة (وربحها المكتمل نقداً عند الانتهاء) ورأس مال السلم وبضاعة الوكالة المعدّة للبيع تدخل zakatBase. وتدخل netWorth وتقرير الثروة.
   مفاتيح: INFLU.fam.fin وINFLU.salam.on وINFLU.mud.on وINFLU.wakala.on؛ false = لا توقيع ولا عرض (السلوك السابق)، وما كان قائماً يُسوَّى كالمعتاد فلا يعلق مال. */
INFLU.fam.fin = true;
Object.assign(INFLU, {
  salam: { on: true, days: [30, 60], cut: [0.08, 0.14], cutStep: 0.01, wait: 7, take: 0.5, minTrust: 0 },
  mud: { on: true, days: [30, 60], shares: [0.5, 0.6, 0.7], k: 0.011, hold: 1.0, shock: 0.01, season: 0.4, cap: 5000, capRuled: 0.2, capTier: 0.1, minTrust: 10, floor: 0.9 },
  wakala: { on: true, days: 60, rate: 0.06, step: 0.005, min: 0.03, perDay: 0.5, haggle: 1.03, minTrust: 0, qty: [25, 50, 100] },
});
const ZAKAT_CT_TEXT = 'تُحسب الزكاة بنسبة 2.5% على رأس المال والأرباح الصافية الحولية والسلع المعدة للبيع، دون الأصول والآلات الثابتة';
Object.assign(INFLU_TXT, {
  zakat: ZAKAT_CT_TEXT,
  refund: 'إن فسد المحصول رُدّ إليك ثمنك كاملاً دون زيادة ولا نقصان.',
  mudEnd: (mk, cap, win, res, share, why) => 'انتهت مضاربتك في ' + mk + '. رأس مالك ' + cap + '، والنتيجة ' + (res >= 0 ? 'ربح ' : 'خسارة ') + win + '، حصتك ' + share + '. السبب: ' + why,
});
Object.assign(AGR_KINDS, {
  salam: { fam: 'fin', name: 'السلم', icon: '📜', minTrust: INFLU.salam.minTrust, desc: 'تدفع ثمن سلعة محددة الآن، وتستلمها بعد مدة معلومة بسعر أقل من سعرها المعتاد.', obl: 'لا تبيعها قبل أن تستلمها. وقد يغلو السوق أو يرخص يوم الاستلام.' },
  mud: { fam: 'fin', name: 'المضاربة مع تجار السوق', icon: '🏺', minTrust: INFLU.mud.minTrust, desc: 'تضع مالاً عند تجار هذا السوق ليتاجروا به مدة معلومة، ويُقسَّم الربح بينكم بنسبة تتفقون عليها قبل البدء.', obl: 'إن حدثت خسارة فهي على المال وحده، ولا يضمن أحد لك ربحاً ولا مالك.' },
  wakala: { fam: 'fin', name: 'الوكالة بالعمولة', icon: '🏪', minTrust: INFLU.wakala.minTrust, desc: 'يبيع لك الزعيم سلعك في سوقه.', obl: 'يأخذ نسبة معلومة من ثمن ما يبيعه.' },
});
const FIN_KINDS = { salam: 1, mud: 1, wakala: 1 };
const finOn = (S, kind) => !!(INFLU.on && INFLU.fam[(AGR_KINDS[kind] || {}).fam || 'fin'] && INFLU[kind] && INFLU[kind].on && S && S.learn && S.learn.char);
const finTier = S => Math.min(INFLU.tierMax, (S.player.agrSpec && S.player.agrSpec.fin) || 0);
function finSpecAdd(S, d) { const sp = S.player.agrSpec || (S.player.agrSpec = { lane: 0 }); sp.fin = Math.max(0, (sp.fin || 0) + d); }
const salamCut = (S, days) => INFLU.salam.cut[days === INFLU.salam.days[1] ? 1 : 0] + INFLU.salam.cutStep * finTier(S);
const wakalaRate = S => Math.max(INFLU.wakala.min, INFLU.wakala.rate - INFLU.wakala.step * finTier(S));
// سقف رأس المال عند تجار سوق: حجم السوق ونفوذك (أسواقك المحكومة) وتخصصك
function mudCap(S, city) { const c = S.cities[city], M = INFLU.mud; return Math.round(M.cap * c.size * (1 + M.capRuled * Math.min(5, agrRuled(S))) * (1 + M.capTier * finTier(S)) / 100) * 100; }
const mudValue = ag => { const p = Math.max(-ag.cap, ag.pnl || 0); return ag.cap + (p > 0 ? ag.share * p : p); };
// عائد يوم واحد كنسبة من رأس المال، من حالة السوق الفعلية فقط: فرق أسعار السلع (هامش التجار)، وتغيّر مؤشر الأسعار (تقييم مخزونهم)، والموسم، والحدث c.ev، والصدمة c.sh
function mudDaily(S, c, ag) {
  const M = INFLU.mud; let dev = 0, mean = 0, sea = 0, n = 0;
  for (const g of GIDS) { const G = GD[g]; if (G.sp || G.live) continue; const r = ratio(c, g); if (!isFinite(r)) continue; dev += Math.abs(r - 1); mean += r; sea += seasonMul(S, c, g) - 1; n++; }
  if (!n) return { g: 0, dev: 0, d: 0 }; dev /= n; mean /= n; sea /= n; const prev = ag.rm == null ? mean : ag.rm; ag.rm = mean;
  const evm = c.ev && c.ev.k === 'war' ? 1.5 : c.ev && c.ev.k === 'festival' ? 1.3 : 1, sh = c.sh ? M.shock * (c.sh.cut || 0.3) : 0;
  const g = M.k * dev * evm + M.hold * (mean - prev) + M.season * sea * 0.01 - sh; return { g, dev, d: mean - prev, sh: !!c.sh, ev: c.ev ? c.ev.k : null, sea };
}
function finAssets(S) { // ما لك عند العقود المالية: يدخل الثروة بقيمته الحالية، وكل ما سوى الربح غير المكتمل يدخل وعاء الزكاة
  let mud = 0, salam = 0, stock = 0, zk = 0; for (const a of (S.player.agr || [])) {
    if (a.kind === 'mud') { mud += mudValue(a); zk += a.cap; } else if (a.kind === 'salam') { salam += a.cap; zk += a.cap; } else if (a.kind === 'wakala') { const v = valueOf(a.stock || {}); stock += v; zk += v; } }
  const M = mfgAssets(S); // 036د: ما دُفع للاستصناع والتوريد، وحصة شريكك في المصنع (دَين عليك)
  return { mud, salam, stock, mfg: M.total, total: mud + salam + stock + M.total, zk: zk + M.zk };
}
function finBase(S, city, kind, home) { // شروط مشتركة (FR-001، الخانات، الغضب، الثقة)
  const K = AGR_KINDS[kind]; if (!K || !finOn(S, kind)) return 'غير متاحة الآن';
  const bs = bossOf(S, city); if (!bs) return 'لا زعيم في هذه المدينة'; if (!bossActive(S)) return 'يُفتح في الطور 2'; if (bs.ruler === 'player') return 'أنت حاكم هذا السوق';
  if (agrIn(S, city, kind)) return 'بينكما اتفاقية مماثلة';
  const hb = home && bossOf(S, home); if (!hb || hb.ruler !== 'player' || home === city) return 'يلزم سوق تحكمه ليكون طرفك في الاتفاقية';
  if (slotsUsed(S) >= slotsOf(S)) return INFLU_TXT.full; if (bs.cd > S.day) return 'الزعيم غاضب منك، عُد بعد ' + (bs.cd - S.day) + ' أيام';
  { const need = K.minTrust + diffTrustExtra(S); if (bs.trust < need) return 'ثقة الزعيم بك لا تكفي (يلزم ' + need + ' وعندك ' + Math.round(bs.trust) + ')'; }
  return null;
}
function finGoods(S, city, kind) { const c = S.cities[city], out = []; if (!c) return out; for (const g of GIDS) { const G = GD[g]; if (G.sp || G.live) continue; if (kind === 'salam' ? sells(c, g) : c.dem[g] > 0) out.push(g); } return out; }
function finQtyOptions(S, city, kind, g) { const c = S.cities[city]; if (kind === 'wakala') return INFLU.wakala.qty.slice(); const base = Math.max(10, Math.round((c.dem[g] || 1) * 10 / 5) * 5); return [Math.max(5, Math.round(base * 0.5 / 5) * 5), base, base * 2]; }
function finCapOptions(S, city) { const cap = mudCap(S, city); return [0.25, 0.5, 1].map(x => Math.max(100, Math.round(cap * x / 100) * 100)); }
function finBlock(S, city, kind, o) {
  o = o || {}; let why = finBase(S, city, kind, o.home); if (why) return why; const c = S.cities[city], P = S.player;
  if (kind === 'salam') {
    if (!finGoods(S, city, 'salam').includes(o.g)) return 'سلعة لا تصلح لهذا العقد'; if (!INFLU.salam.days.includes(o.days)) return 'اختر مدة 30 أو 60 يوماً'; if (!(o.qty >= 1)) return 'كمية غير صالحة';
    const pr = P.props[o.home]; if (!pr || !(pr.whs > 0) || storeRoom(S, o.home) < o.qty * GD[o.g].w) return 'لا مكان في مخزنك بسوقك المحكوم لهذه الكمية';
    const cost = o.qty * unitPrice(c, o.g) * (1 - salamCut(S, o.days)); if (P.gold < cost) return 'الثمن يحتاج ' + Math.ceil(cost);
  } else if (kind === 'mud') {
    if (!INFLU.mud.days.includes(o.days)) return 'اختر مدة 30 أو 60 يوماً'; if (!INFLU.mud.shares.includes(o.share)) return 'اختر نسبة ربحك'; const cap = mudCap(S, city);
    if (!(o.cap >= 100)) return 'كمية غير صالحة'; if (o.cap > cap) return 'سقف رأس المال عند تجار ' + c.name + ' ' + cap; if (P.gold < o.cap) return 'رصيدك لا يكفي';
  } else if (kind === 'wakala') {
    if (!finGoods(S, city, 'wakala').includes(o.g)) return 'سلعة لا تصلح لهذا العقد'; if (!INFLU.wakala.qty.includes(o.qty)) return 'كمية غير صالحة';
  } else if (MFG_KINDS[kind]) return mfgBlock(S, city, kind, o);
  else return 'غير متاحة الآن';
  return null;
}
Object.assign(A, {
  signFin(S, city, kind, o) {
    { const lk = lessonLock(S, 'pact'); if (lk) return NO(lk); } o = Object.assign({}, o); const why = finBlock(S, city, kind, o); if (why) return NO(why);
    if (MFG_KINDS[kind]) return mfgSign(S, city, kind, o); // 036د
    const bs = bossOf(S, city), P = S.player, c = S.cities[city]; /* الدفع بعملتك لا بعملة السوق: لا فرق صرف على رأس المال */ const rec = { id: S.nextId++, kind, city, home: o.home, goods: o.g || null, qty: o.qty || 0, since: S.day, cnt: 0, ok: 0, miss: 0, led: { exp: 0, act: 0, why: '' }, hist: [] };
    if (kind === 'salam') { const cut = salamCut(S, o.days), unit = unitPrice(c, o.g) * (1 - cut), cost = unit * o.qty; pPay(S, 'purchases', cost, false); Object.assign(rec, { left: o.days, total: o.days, cap: cost, unit, cut, got: 0, dw: 0 }); rec.led.exp = o.qty; }
    else if (kind === 'mud') { pPay(S, 'mudarabaCap', o.cap, false); Object.assign(rec, { left: o.days, total: o.days, cap: o.cap, share: o.share, pnl: 0, rm: null, days: 0, up: 0, dn: 0 }); rec.led.exp = o.cap; rec.led.act = o.cap; }
    else Object.assign(rec, { left: INFLU.wakala.days, total: INFLU.wakala.days, rate: wakalaRate(S), stock: {}, basis: {}, sent: 0, sold: 0, proceeds: 0, fee: 0 });
    (P.agr || (P.agr = [])).push(rec); bs.pacted = true; return OK('وقّعت ' + AGR_KINDS[kind].name + ' مع ' + bs.name + ' لمدة ' + rec.total + ' يوماً');
  },
  wakalaConsign(S, id, q) {
    const P = S.player, ag = (P.agr || []).find(x => x.id === id && x.kind === 'wakala'); if (!ag) return NO('لا اتفاقية'); q = Math.floor(+q); const left = ag.qty - ag.sent; if (!(q >= 1)) return NO('كمية غير صالحة'); if (q > left) return NO('أقصى ما تضعه عنده ' + left + ' وحدة');
    const g = ag.goods, pr = P.props[ag.city], car = P.caravans.find(x => x.left === 0 && x.city === ag.city && (x.cargo[g] || 0) >= 1);
    let n = Math.min(q, Math.floor(pr ? pr.store[g] || 0 : 0)), src = 'store'; if (n < 1 && car) { n = Math.min(q, Math.floor(car.cargo[g])); src = 'car'; } if (n < 1) return NO('لا ' + GD[g].name + ' عندك في ' + S.cities[ag.city].name + ' (في مخزنك أو قافلتك)');
    let cost; if (src === 'store') { cost = takeBasis(pr.basis || (pr.basis = {}), g, n); pr.store[g] -= n; } else { cost = takeBasis(car.basis, g, n); car.cargo[g] -= n; if (car.cargo[g] <= 0) delete car.cargo[g]; syncBasis(car); }
    ag.stock[g] = (ag.stock[g] || 0) + n; addBasis(ag.basis, g, n, cost); ag.sent += n; ag.led.exp = ag.sent; return OK('سلّمتَ ' + n + ' وحدة من ' + GD[g].name + ' لوكيلك في ' + S.cities[ag.city].name);
  },
});
for (const k of ['signFin', 'wakalaConsign']) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }
// تسوية: السلم عند الأجل (تسليم أو رد رأس مال بنسبة ما لم يُسلَّم)
function salamSettle(S, ag, bs, force) {
  const c = S.cities[ag.city], P = S.player, g = ag.goods, pr = P.props[ag.home], w = GD[g].w; ctxFor(S, ag.city);
  const spoil = !!(c.sh && ['drought', 'flood', 'famine'].includes(c.sh.k)), want = ag.qty - ag.got, avail = spoil ? 0 : Math.floor((c.stock[g] || 0) * INFLU.salam.take), room = pr ? Math.floor(storeRoom(S, ag.home) / w) : 0, n = Math.max(0, Math.min(want, avail, room));
  if (n > 0) { c.stock[g] -= n; pr.store[g] = (pr.store[g] || 0) + n; addBasis(pr.basis || (pr.basis = {}), g, n, n * ag.unit); ag.got += n; ag.led.act = ag.got; }
  if (ag.got >= ag.qty) { ag.led.why = 'استلمتَ ' + ag.got + ' وحدة من ' + GD[g].name + ' بسعر ' + Math.round(ag.unit) + ' للوحدة'; news(S, 'استلمتَ سلمك من ' + GD[g].name + ' (' + ag.got + ' وحدة) في ' + S.cities[ag.home].name + '.', 'good'); finSpecAdd(S, 1); ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); return true; }
  if (spoil || force || ++ag.dw >= INFLU.salam.wait || (!(avail > 0) && !(room > 0) && ag.dw >= 1 && spoil)) { // تعذّر التسليم: رد رأس المال بنسبة ما لم يُسلَّم، دون زيادة ولا نقصان
    const back = ag.cap * (ag.qty - ag.got) / ag.qty; P.gold += back; ag.led.why = INFLU_TXT.refund + ' (' + Math.round(back) + ')'; news(S, INFLU_TXT.refund + ' ' + AGR_KINDS.salam.name + ' في ' + S.cities[ag.city].name + ': ' + Math.round(back) + ' ريال.', ''); if (ag.got > 0) { finSpecAdd(S, 1); ag.ok++; } return true;
  }
  ag.led.why = 'تأخّر التسليم يوماً: ننتظر السلعة أو مكاناً في مخزنك'; return false;
}
// المضاربة: تصفية بالقيمة الحالية (عند الأجل أو بالسحب المبكر)، والخسارة على رأس المال وحده
function mudSettle(S, ag, bs, early) {
  const P = S.player, c = S.cities[ag.city], p = Math.max(-ag.cap, ag.pnl || 0), share = p > 0 ? ag.share * p : p, pay = ag.cap + share; P.gold += pay;
  if (share > 0) { fauc(S, 'mudaraba', share); P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) + share; } else if (share < 0) { sink(S, 'mudarabaLoss', -share); P.led.exp.mudarabaLoss = (P.led.exp.mudarabaLoss || 0) + (-share); }
  const why = mudWhy(ag, early); ag.led.why = why; ag.led.act = Math.round(pay);
  news(S, INFLU_TXT.mudEnd(c.name, fmtN(ag.cap), fmtN(Math.abs(Math.round(p))), p, fmtN(Math.abs(Math.round(share))), why), share >= 0 ? 'good' : 'bad');
  if (!early) { if (share >= 0) { finSpecAdd(S, 1); ag.ok++; } bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); }
}
function mudWhy(ag, early) { // بلغة طفل، من الأسباب الفعلية
  const bits = []; if (early) bits.push('سحبتَ مالك قبل الأجل فحُسب ما حدث إلى يومه'); const up = ag.up || 0, dn = ag.dn || 0;
  if ((ag.pnl || 0) >= 0) bits.push(up >= dn ? 'السلع كانت مختلفة الأسعار فربح التجار من الفرق' : 'ربح التجار من فرق الأسعار رغم تقلّب الأسعار'); else bits.push('هبطت الأسعار وخسر التجار في مخزونهم');
  if (ag.ev) bits.push('وأثّر في السوق حدث (' + ag.ev + ')'); if (ag.shk) bits.push('وأصابته أزمة نقص فتعطّلت التجارة'); return bits.join('، ') + '.';
}
function wakalaDay(S, ag, bs) {
  const P = S.player, c = S.cities[ag.city], g = ag.goods; ctxFor(S, ag.city);
  const have = Math.floor(ag.stock[g] || 0); if (have >= 1) {
    const n = Math.min(have, Math.max(3, Math.floor((c.dem[g] || 1) * INFLU.wakala.perDay))), acct = { gold: 0 }, res = sellUnits(S, acct, c, g, n, ag.stock, true, INFLU.wakala.haggle, 'trade', ag.basis[g]);
    if (res.n > 0) { takeBasis(ag.basis, g, res.n); const fee = acct.gold * ag.rate; P.gold += acct.gold - fee; sink(S, 'pactShare', fee); P.led.exp.pactShare = (P.led.exp.pactShare || 0) + fee; ag.sold += res.n; ag.proceeds += acct.gold - fee; ag.fee += fee; ag.led.act = ag.sold; ag.led.why = 'باع ' + res.n + ' وحدة اليوم وأخذ نسبته ' + Math.round(ag.rate * 1000) / 10 + '٪'; }
  }
}
function wakalaEnd(S, ag, bs) { // الباقي: يُردّ إلى مخزنك في سوقه إن وُجد مكان، وإلا يُصفّى بالنسبة نفسها
  const P = S.player, g = ag.goods, left = Math.floor(ag.stock[g] || 0), pr = P.props[ag.city]; let back = 0;
  if (left >= 1 && pr && pr.whs > 0) { back = Math.min(left, Math.floor(storeRoom(S, ag.city) / GD[g].w)); if (back > 0) { const cost = takeBasis(ag.basis, g, back); ag.stock[g] -= back; pr.store[g] = (pr.store[g] || 0) + back; addBasis(pr.basis || (pr.basis = {}), g, back, cost); } }
  const rest = Math.floor(ag.stock[g] || 0); if (rest >= 1) { const c = S.cities[ag.city], acct = { gold: 0 }; ctxFor(S, ag.city); const res = sellUnits(S, acct, c, g, rest, ag.stock, true, INFLU.wakala.haggle, 'trade', ag.basis[g]); if (res.n > 0) { const fee = acct.gold * ag.rate; P.gold += acct.gold - fee; sink(S, 'pactShare', fee); P.led.exp.pactShare = (P.led.exp.pactShare || 0) + fee; ag.sold += res.n; ag.proceeds += acct.gold - fee; ag.fee += fee; } }
  finSpecAdd(S, 1); ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); ag.led.why = 'باع لك ' + ag.sold + ' وحدة وأخذ ' + Math.round(ag.fee) + ' عمولة' + (back ? '، وردّ إليك ' + back + ' إلى مخزنك' : '');
  news(S, 'انتهت ' + AGR_KINDS.wakala.name + ' مع ' + bs.name + ': باع لك ' + ag.sold + ' وحدة من ' + GD[g].name + ' وأخذ ' + Math.round(ag.fee) + ' ريالاً عمولة.', 'good');
}
function agrFinDay(S, ag, bs) { // يومياً لعقد مالي قائم (يُستدعى من agrDay)
  if (MFG_KINDS[ag.kind]) return mfgDay(S, ag, bs); // 036د
  ag.left--; ag.cnt = (ag.cnt || 0) + 1;
  if (ag.kind === 'mud') { const c = S.cities[ag.city], r = mudDaily(S, c, ag); ag.pnl = Math.max(-ag.cap, (ag.pnl || 0) + ag.cap * r.g); ag.days++; if (r.d > 0) ag.up++; else if (r.d < 0) ag.dn++; if (r.ev) ag.ev = r.ev; if (r.sh) ag.shk = 1; ag.led.act = Math.round(mudValue(ag)); if (ag.left <= 0) { mudSettle(S, ag, bs, false); S.player.agr = S.player.agr.filter(x => x !== ag); } return; }
  if (ag.kind === 'wakala') { wakalaDay(S, ag, bs); if (ag.left <= 0) { wakalaEnd(S, ag, bs); S.player.agr = S.player.agr.filter(x => x !== ag); } return; }
  if (ag.kind === 'salam' && ag.left <= 0) { if (salamSettle(S, ag, bs, false)) S.player.agr = S.player.agr.filter(x => x !== ag); }
}
function finClose(S, ag, why) { // إسقاط عقد مالي قبل أجله (حكمتَ سوق الطرف الثاني، أو سحب مبكر): لا يعلق مالك
  if (MFG_KINDS[ag.kind]) return mfgClose(S, ag, why); // 036د
  const bs = bossOf(S, ag.city) || { trust: 0 };
  if (ag.kind === 'mud') mudSettle(S, ag, bs, true);
  else if (ag.kind === 'salam') { const back = ag.cap * (ag.qty - ag.got) / ag.qty; S.player.gold += back; news(S, INFLU_TXT.refund + ' ' + AGR_KINDS.salam.name + ': ' + Math.round(back) + ' ريال.', ''); }
  else if (ag.kind === 'wakala') wakalaEnd(S, ag, bs);
}
function finView(a) { // للواجهة
  if (MFG_KINDS[a.kind]) return mfgView(a); // 036د
  const o = { fin: true }; if (a.kind === 'mud') Object.assign(o, { cap: a.cap, val: Math.round(mudValue(a)), share: a.share, pnl: Math.round(a.pnl || 0) });
  else if (a.kind === 'salam') Object.assign(o, { cap: Math.round(a.cap), got: a.got, unit: Math.round(a.unit), cut: a.cut });
  else Object.assign(o, { rate: a.rate, stock: Math.floor((a.stock || {})[a.goods] || 0), sent: a.sent, sold: a.sold, fee: Math.round(a.fee || 0), proceeds: Math.round(a.proceeds || 0), room: a.qty - a.sent });
  return o;
}
