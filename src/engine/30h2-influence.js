/* ---------- اتفاقيات النفوذ (036أ): الخانات، سجل الاتفاقيات P.agr، اتفاقيتا التصدير والاستيراد ----------
   فكرة بن محمود: السيطرة على سوق تفتح اتفاقيات مع زعماء أسواق أخرى. الطرف الثاني دائماً زعيم سوق (لا شخصيات جديدة).
   الخانات: عقودك القديمة P.pacts واتفاقياتك P.agr تُعدّ معاً، والحد = أسواقك المحكومة + 1 بحد أدنى MAX_PACTS؛ من عنده فوق الحد يبقى حتى الانتهاء. لا قفل بين عقدين.
   اتفاقية التصدير (CT-01 معتمدة): تختار سوقاً تحكمه (home) وسلعة يبيعها، وكمية شهرية تبيعها عند الزعيم؛ مقابلها جمارك أقل على تلك السلعة وبلا زيادة 2٪ على الغريب.
     عند نهاية كل شهر: إن قصّرت دفعتَ «شرطاً جزائياً لتعويض الضرر الناتج عن التقصير في التنفيذ» = الضرر المالي الفعلي (الجمارك التي تمتّعتَ بها بنسبة التقصير + هامش الناقص)، لا مبلغاً ثابتاً.
   اتفاقية الاستيراد (CT-02 معتمدة من المختص بصيغتها المعدَّلة في الدفعة 12، تُظهَر كاملة): كل دفعة إيجاب وقبول جديدان عند تسليمها؛ تقبلها أو ترفضها بلا غرامة، ويضيع منك تقدّم العقد فقط.
   الأثر الأكبر لا التراكم (FR-008): حين تحكم سوقاً تبقى عقودك مع زعيمه حتى تنتهي (بلا رسوم ولا بند جزائي وبلا حصة للزعيم المخلوع)، وأثر كل جهة هو الأكبر من أثر الحكم وأثر العقد.
   INFLU.on=false يعيد السلوك القديم حرفياً (لا خانات جديدة، العقود تُحذف عند الحكم)؛ INFLU.fam.lane=false يوقف الاتفاقيتين وحدهما. الحقول اختيارية في الحفظ: P.agr وP.agrSpec. */
const INFLU = { on: true, fam: { lane: true }, period: 30, periods: 3, cut: 0.3, cutStep: 0.05, cutRuled: 0.02, cutMax: 0.6, tierMax: 4, margin: 0.08, trustOk: 3, trustMiss: 10, trustEnd: 5, impCut: 0.08, impStep: 0.02, impCust: 0.5, batchWait: 5 };
const INFLU_TXT = {
  full: 'لا خانة فارغة. احكم سوقاً آخر أو أنهِ عقداً قائماً.', penal: 'شرط جزائي لتعويض الضرر الناتج عن التقصير في التنفيذ',
  slots: (n, m) => 'عقودك الفعّالة: ' + n + ' من ' + m + '. كل سوق تحكمه يفتح لك خانة.',
  kept: (nm, bs) => 'وفّيتَ بعقد ' + nm + '. ترتفع ثقة ' + bs + ' بك وتتحسن شروطك.', missed: (nm, bs) => 'لم تفِ بعقد ' + nm + '. دفعتَ ما في العقد وضعفت ثقة ' + bs + ' بك.',
};
const AGR_KINDS = {
  export: { name: 'اتفاقية تصدير', icon: '🤝', minTrust: -10, desc: 'تتفق مع زعيم هذا السوق أن تُباع بضاعة مخازنك عنده بجمارك أقل وبأولوية.', obl: 'ترسل كمية محددة كل شهر. وإن قصّرت فعليك شرط جزائي لتعويض الضرر الناتج عن التقصير في التنفيذ.' },
  import: { name: 'اتفاقية استيراد', icon: '📦', minTrust: 0, desc: 'تتفق مع زعيم هذا السوق أن تصلك سلع سوقه بجمارك وأسعار أخف.', obl: 'عقد توريد دوري بسعر محدد: عند تسليم كل دفعة يتجدد الإيجاب والقبول، فتقبل الدفعة أو ترفضها. لا التزام عليك بشراء دفعة قادمة.', note: 'ومن رفض دفعة لا غرامة عليه، لكن لا يتقدّم عقده ولا تتحسن شروطه.' },
};
const agrRuled = S => { let n = 0; for (const id in (S.bosses || {})) if (S.bosses[id].ruler === 'player') n++; return n; };
const slotsOf = S => (INFLU.on ? Math.max(MAX_PACTS, agrRuled(S) + 1) : MAX_PACTS);
const slotsUsed = S => (S.player.pacts || []).length + (INFLU.on ? (S.player.agr || []).length : 0);
const lnOn = S => !!(INFLU.on && INFLU.fam.lane && S && S.learn && S.learn.char);
const agrIn = (S, city, kind) => (INFLU.on && S.player.agr ? S.player.agr.find(a => a.city === city && (!kind || a.kind === kind)) || null : null);
const agrActLn = (S, city) => !!(lnOn(S) && agrIn(S, city, 'export')); // الأولوية: لا زيادة 2٪ على الغريب عند اتفاقية تصدير قائمة
const agrSpec = S => (S.player.agrSpec && S.player.agrSpec.lane) || 0;
const agrTier = S => Math.min(INFLU.tierMax, agrSpec(S));
// قوة العقد تتبع تخصصك (دورات وفّيتَ بها) ونفوذك (أسواقك المحكومة)، بحد أقصى
const agrCutNow = S => Math.min(INFLU.cutMax, INFLU.cut + INFLU.cutStep * agrTier(S) + INFLU.cutRuled * Math.min(5, agrRuled(S)));
const agrImpCut = S => INFLU.impCut + INFLU.impStep * agrTier(S);
// خصم جمارك التصدير على قيمة السلعة المتفق عليها فقط (لا يتراكم مع تحالف السوق: الأفضل منهما)
function agrCustMul(S, to, cargo) {
  if (!lnOn(S)) return 1; const ag = agrIn(S, to, 'export'); if (!ag) return 1;
  const v = valueOf(cargo); if (!(v > 0)) return 1; return 1 - agrCutNow(S) * ((cargo[ag.goods] || 0) * mid(ag.goods)) / v;
}
// يسجّل في الدفتر ما وفّرتَه من الجمارك فعلاً عند الوصول (أساس الشرط الجزائي)
function agrCustomsNote(S, from, to, cargo, natMul) {
  if (!lnOn(S)) return; const ag = agrIn(S, to, 'export'); if (!ag) return;
  const full = customsOf(S, from, to, cargo, false), now = customsOf(S, from, to, cargo, true); if (full > now) ag.saved = (ag.saved || 0) + (full - now) * (natMul == null ? 1 : natMul);
}
// بيع اللاعب في سوق الزعيم: يُحتسب من الكمية الشهرية
function agrSold(S, city, g, n) {
  if (!lnOn(S)) return; const ag = agrIn(S, city, 'export'); if (ag && ag.goods === g) { ag.led.act += n; }
}
function agrQtyOptions(S, city, g) {
  const c = S.cities[city], base = Math.max(10, Math.round((c.dem[g] || 1) * 8 / 5) * 5);
  return [Math.max(5, Math.round(base * 0.5 / 5) * 5), base, Math.round(base * 1.5 / 5) * 5];
}
function agrGoodsOptions(S, city, kind, home) {
  const out = [], c = S.cities[city], h = S.cities[home]; if (!c) return out;
  for (const g of GIDS) { const G = GD[g]; if (G.sp || G.live) continue; if (kind === 'export' ? (h && sells(h, g) && c.dem[g] > 0) : sells(c, g)) out.push(g); }
  return out;
}
function agrBlock(S, city, kind, home, g, qty) {
  const K = AGR_KINDS[kind]; if (!K || !lnOn(S)) return 'غير متاحة الآن';
  const bs = bossOf(S, city); if (!bs) return 'لا زعيم في هذه المدينة';
  if (!bossActive(S)) return 'يُفتح في الطور 2';
  if (bs.ruler === 'player') return 'أنت حاكم هذا السوق';
  if (agrIn(S, city, kind)) return 'بينكما اتفاقية مماثلة';
  const hb = home && bossOf(S, home); if (!hb || hb.ruler !== 'player' || home === city) return 'يلزم سوق تحكمه ليكون طرفك في الاتفاقية';
  if (slotsUsed(S) >= slotsOf(S)) return INFLU_TXT.full;
  if (bs.cd > S.day) return 'الزعيم غاضب منك، عُد بعد ' + (bs.cd - S.day) + ' أيام';
  { const need = K.minTrust + diffTrustExtra(S); if (bs.trust < need) return 'ثقة الزعيم بك لا تكفي (يلزم ' + need + ' وعندك ' + Math.round(bs.trust) + ')'; }
  if (g != null && !agrGoodsOptions(S, city, kind, home).includes(g)) return 'سلعة لا تصلح لهذه الاتفاقية';
  if (qty != null && !(qty >= 1)) return 'كمية غير صالحة';
  return null;
}
function agrTerms(S, city, kind) {
  const days = INFLU.period * INFLU.periods, bs = bossOf(S, city);
  return { kind, city, days, period: INFLU.period, cut: agrCutNow(S), impCut: agrImpCut(S), tier: agrTier(S), upfront: 0, trust: bs ? bs.trust : 0 };
}
Object.assign(A, {
  signAgr(S, city, kind, home, g, qty) {
    { const lk = lessonLock(S, 'pact'); if (lk) return NO(lk); }
    qty = Math.floor(+qty); const why = agrBlock(S, city, kind, home, g, qty); if (why) return NO(why);
    const bs = bossOf(S, city), t = agrTerms(S, city, kind), P = S.player; ctxFor(S, city);
    (P.agr || (P.agr = [])).push({ id: S.nextId++, kind, city, home, goods: g, qty, period: t.period, left: t.days, total: t.days, since: S.day, cnt: 0, saved: 0, ok: 0, miss: 0, tier: t.tier, led: { exp: qty, act: 0, why: '' }, hist: [], batch: null, dmg: 0 });
    bs.pacted = true;
    return OK('وقّعت ' + AGR_KINDS[kind].name + ' مع ' + bs.name + ' لمدة ' + t.days + ' يوماً');
  },
  breakAgr(S, id) {
    const P = S.player, ag = (P.agr || []).find(x => x.id === id); if (!ag) return NO('لا اتفاقية');
    // الفسخ المبكر: تعويض ما تمتّعتَ به من الجمارك في الشهر الجاري فقط (الضرر الفعلي)، ويغضب الزعيم
    const bs = bossOf(S, ag.city); let pay = 0; if (ag.kind === 'export' && ag.saved > 0) pay = pPay(S, 'pactPenalty', Math.min(ag.saved, P.gold), true);
    P.agr = P.agr.filter(x => x !== ag); if (bs) { bs.trust = clamp(bs.trust - 10, -100, 100); bs.cd = S.day + 5; } repOf(P).broke++;
    return OK('فسخت ' + AGR_KINDS[ag.kind].name + (pay > 0 ? ' ودفعت ' + Math.round(pay) + ' تعويضاً عن الضرر' : '') + '.');
  },
  agrAccept(S, id) {
    const P = S.player, ag = (P.agr || []).find(x => x.id === id && x.kind === 'import'); if (!ag) return NO('لا اتفاقية');
    const b = ag.batch; if (!b || S.day > b.until) return NO('لا دفعة معروضة');
    const c = S.cities[ag.city], pr = P.props[ag.home]; if (!pr) return NO('لا مخزن لك في ' + S.cities[ag.home].name);
    const n = Math.min(b.qty, Math.floor(c.stock[ag.goods] || 0), Math.floor(storeRoom(S, ag.home) / GD[ag.goods].w)); if (n < 1) return NO('لا مكان في مخزنك أو لا بضاعة عند الزعيم');
    const cost = n * b.unit + b.cust * (n / b.qty); if (P.gold < cost) return NO('الدفعة تحتاج ' + Math.ceil(cost));
    ctxFor(S, ag.city); pPay(S, 'purchases', cost, false); c.stock[ag.goods] -= n; pr.store[ag.goods] = (pr.store[ag.goods] || 0) + n; addBasis(pr.basis || (pr.basis = {}), ag.goods, n, cost);
    ag.led.act += n; ag.led.why = 'قبلتَ دفعة ' + n + ' من ' + b.qty + ' بسعر ' + Math.round(b.unit) + ' للوحدة'; ag.took = (ag.took || 0) + 1; ag.batch = null;
    return OK('قبلتَ الدفعة: ' + n + ' وحدة من ' + GD[ag.goods].name + ' في مخزنك بـ ' + Math.round(cost) + ' ريال');
  },
  agrReject(S, id) {
    const P = S.player, ag = (P.agr || []).find(x => x.id === id && x.kind === 'import'); if (!ag || !ag.batch) return NO('لا دفعة معروضة');
    ag.batch = null; ag.refused = (ag.refused || 0) + 1; ag.led.why = 'رفضتَ الدفعة: بلا غرامة، ولا يتقدّم العقد'; return OK('رفضتَ الدفعة بلا غرامة');
  },
});
for (const k of ['signAgr', 'breakAgr', 'agrAccept', 'agrReject']) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }
function agrSpecAdd(S, d) { const P = S.player, sp = P.agrSpec || (P.agrSpec = { lane: 0 }); sp.lane = Math.max(0, (sp.lane || 0) + d); }
// تسوية شهر لاتفاقية تصدير: الدفتر (متوقع/فعلي/سبب الفرق)، ثم الوفاء أو الشرط الجزائي بالضرر الفعلي
function agrSettleExport(S, ag, bs) {
  const P = S.player, led = ag.led, exp = led.exp, act = led.act, short = Math.max(0, exp - act), c = S.cities[ag.city];
  let dmg = 0, why;
  if (short > 0) {
    const share = exp > 0 ? short / exp : 1, cust = (ag.saved || 0) * share, lost = short * INFLU.margin * refPrice(c, ag.goods); dmg = Math.round(cust + lost);
    why = 'بعتَّ ' + Math.round(act) + ' من ' + exp + ' وحدة من ' + GD[ag.goods].name + '؛ الناقص ' + Math.round(short) + '. الضرر الفعلي: جمارك وفّرتَها ' + Math.round(cust) + ' وهامش الناقص ' + Math.round(lost) + '.';
    const pay = dmg > 0 ? pPay(S, 'pactPenalty', Math.min(dmg, P.gold), true) : 0; ag.miss++; ag.dmg = (ag.dmg || 0) + pay; bs.trust = clamp(bs.trust - INFLU.trustMiss, -100, 100); agrSpecAdd(S, -1);
    news(S, INFLU_TXT.missed(AGR_KINDS.export.name, bs.name), 'bad');
  } else {
    why = 'بعتَّ ' + Math.round(act) + ' من ' + exp + ' وحدة: وفّيتَ بالكمية.'; ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk * projectMul(S, 'trustgrow', { city: ag.city }), -100, 100); agrSpecAdd(S, 1);
    news(S, INFLU_TXT.kept(AGR_KINDS.export.name, bs.name), 'good');
  }
  led.why = why; ag.hist.push({ d: S.day, exp, act: Math.round(act), dmg, why }); if (ag.hist.length > 6) ag.hist.shift(); ag.saved = 0; led.act = 0;
}
function agrDay(S) {
  const P = S.player; if (!INFLU.on || !P.agr || !P.agr.length) return;
  for (const ag of P.agr.slice()) {
    const bs = bossOf(S, ag.city); if (!bs) { P.agr = P.agr.filter(x => x !== ag); continue; }
    if (bs.ruler === 'player') { P.agr = P.agr.filter(x => x !== ag); continue; } // حكمتَ سوق الطرف الثاني: لا طرف يُتَّفق معه
    ag.left--; ag.cnt = (ag.cnt || 0) + 1;
    if (ag.kind === 'import') {
      if (ag.batch && S.day > ag.batch.until) { ag.batch = null; ag.refused = (ag.refused || 0) + 1; ag.led.why = 'مرّت مهلة الدفعة دون قبول: لا غرامة، ولا يتقدّم العقد'; }
      if (ag.cnt === 1 && !ag.batch) {
        const c = S.cities[ag.city], unit = unitPrice(c, ag.goods) * (1 - agrImpCut(S)), hc = S.cities[ag.home], cust = hc.country === c.country ? 0 : CD[hc.country].customs * perkMul(S, 'customs') * INFLU.impCust * unit * ag.qty;
        ag.batch = { qty: ag.qty, unit, cust, until: S.day + INFLU.batchWait, day: S.day }; ag.led.exp = ag.qty; ag.led.act = 0; ag.led.why = 'عُرضت دفعة جديدة: اقبلها أو ارفضها';
      }
      if (ag.cnt >= ag.period || ag.left <= 0) {
        if (ag.took) { agrSpecAdd(S, 1); ag.ok++; bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); } else if (ag.refused) { agrSpecAdd(S, -1); ag.miss++; }
        ag.hist.push({ d: S.day, exp: ag.qty, act: Math.round(ag.led.act), dmg: 0, why: ag.led.why }); if (ag.hist.length > 6) ag.hist.shift(); ag.took = 0; ag.refused = 0; ag.cnt = 0;
      }
    } else if (ag.cnt >= ag.period || ag.left <= 0) { agrSettleExport(S, ag, bs); ag.cnt = 0; }
    if (ag.left <= 0) {
      P.agr = P.agr.filter(x => x !== ag); if (!ag.miss) { bs.trust = clamp(bs.trust + INFLU.trustEnd, -100, 100); repOf(P).done++; }
      news(S, 'انتهت ' + AGR_KINDS[ag.kind].name + ' مع ' + bs.name + '.', ag.miss ? '' : 'good');
    }
  }
}
// للواجهة: الخانات والاتفاقيات القائمة ودفاترها
function agrView(S) {
  const P = S.player, list = (P.agr || []).map(a => ({ id: a.id, kind: a.kind, name: AGR_KINDS[a.kind].name, city: a.city, home: a.home, goods: a.goods, qty: a.qty, left: a.left, total: a.total, exp: a.led.exp, act: Math.round(a.led.act), why: a.led.why, ok: a.ok, miss: a.miss, saved: Math.round(a.saved || 0), batch: a.batch, cut: a.kind === 'export' ? agrCutNow(S) : agrImpCut(S), hist: a.hist }));
  return { on: INFLU.on, used: slotsUsed(S), slots: slotsOf(S), ruled: agrRuled(S), tier: agrTier(S), list, kinds: Object.keys(AGR_KINDS) };
}
