/* اتفاقيات النفوذ (036أ/ب): الخانات (أسواقك المحكومة + 1، أدنى 3)، سجل P.agr، التصدير والاستيراد والخط الآلي؛ الشرح في specs/036-influence-contracts/spec-a.md. INFLU.on=false يعيد السلوك القديم حرفياً؛ INFLU.fam.lane وINFLU.line.on للممر والخط. */
const INFLU = { on: true, fam: { lane: true }, period: 30, periods: 3, cut: 0.3, cutStep: 0.05, cutRuled: 0.02, cutMax: 0.6, tierMax: 4, margin: 0.08, trustOk: 3, trustMiss: 10, trustEnd: 5, impCut: 0.08, impStep: 0.02, impCust: 0.5, batchWait: 5, line: { on: true, week: 7 } };
const INFLU_TXT = {
  lane: { name: 'الخط الآلي', desc: 'تحوّل الاتفاقية إلى خط تسير عليه قافلة أو سفينة بين سوقيك: تبيع وتشتري وتنقل بالقواعد المعتادة.', obl: 'أجور الطريق وخطرها كالمعتاد.', ok: (a, b, j) => 'خط ' + a + ' إلى ' + b + ' جلب لك ' + j + ' هذا الأسبوع.' },
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
  roadArrive(S, from, to, cargo, natMul); if (!lnOn(S)) return; const ag = agrIn(S, to, 'export'); if (!ag) return;
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
    if (ROAD_KINDS[ag.kind]) return roadBreak(S, ag); // 036هـ
    if (ag.kind === 'salam' || ag.kind === 'ist') return NO(ag.kind === 'ist' ? 'الاستصناع لا يُفسخ بعد أن يبدأ الصانع' : 'السلم لا يُفسخ قبل أجله'); // لا خيار لك بعد معرفة السوق: إما تسليم أو رد رأس مال عند التعذّر
    if (FIN_KINDS[ag.kind]) { const nm = AGR_KINDS[ag.kind].name; agrDrop(S, ag, 'فسختَ العقد'); return OK('فسختَ ' + nm + ' وصُفّي ما لك بقيمته اليوم بلا غرامة.'); } // المضاربة: سحب مبكر بفسخ وتصفية؛ والوكالة: يُردّ ما بقي
    // الفسخ المبكر: تعويض ما تمتّعتَ به من الجمارك في الشهر الجاري فقط (الضرر الفعلي)، ويغضب الزعيم
    const bs = bossOf(S, ag.city); let pay = 0; if (ag.kind === 'export' && ag.saved > 0) pay = pPay(S, 'pactPenalty', Math.min(ag.saved, P.gold), true);
    agrDrop(S, ag, 'فسختَ الاتفاقية'); if (bs) { bs.trust = clamp(bs.trust - 10, -100, 100); bs.cd = S.day + 5; } repOf(P).broke++;
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
// إسقاط اتفاقية: يُغلَق خطها الآلي أولاً (القافلة حرّة والسفينة حرّة)، ثم تُحذف
function agrDrop(S, ag, why) { if (ag.lane) laneClose(S, ag, why); if (FIN_KINDS[ag.kind]) finClose(S, ag, why); S.player.agr = S.player.agr.filter(x => x !== ag); }
function agrDay(S) {
  const P = S.player; if (!INFLU.on || !P.agr || !P.agr.length) return;
  for (const ag of P.agr.slice()) {
    const bs = bossOf(S, ag.city); if (!bs) { agrDrop(S, ag, 'زال الزعيم'); continue; }
    if (bs.ruler === 'player') { agrDrop(S, ag, 'حكمتَ سوق الطرف الثاني'); continue; } // حكمتَ سوق الطرف الثاني: لا طرف يُتَّفق معه
    if (FIN_KINDS[ag.kind]) { agrFinDay(S, ag, bs); continue; } // 036ج: العقود المالية
    if (ag.lane) laneDay(S, ag);
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
      agrDrop(S, ag, 'انتهت الاتفاقية'); if (!ag.miss) { bs.trust = clamp(bs.trust + INFLU.trustEnd, -100, 100); repOf(P).done++; }
      news(S, 'انتهت ' + AGR_KINDS[ag.kind].name + ' مع ' + bs.name + '.', ag.miss ? '' : 'good');
    }
  }
}
// للواجهة: الخانات والاتفاقيات القائمة ودفاترها
function agrView(S) {
  const P = S.player, list = (P.agr || []).map(a => ({ id: a.id, kind: a.kind, name: AGR_KINDS[a.kind].name, city: a.city, home: a.home, goods: a.goods, qty: a.qty, left: a.left, total: a.total, exp: a.led.exp, act: Math.round(a.led.act), why: a.led.why, ok: a.ok, miss: a.miss, saved: Math.round(a.saved || 0), batch: a.batch, cut: a.kind === 'export' ? agrCutNow(S) : agrImpCut(S), hist: a.hist, ...(FIN_KINDS[a.kind] ? finView(a) : {}) }));
  return { on: INFLU.on, used: slotsUsed(S), slots: slotsOf(S), ruled: agrRuled(S), tier: agrTier(S), list, kinds: Object.keys(AGR_KINDS) };
}
/* الخط الآلي (036ب): قالب مسار فوق autoRoute أو خط الشهبندر لاتفاقية قائمة؛ الشرح في specs/036-influence-contracts/plan-b.md. INFLU.line.on مفتاحه. */
const lineOn = S => !!(lnOn(S) && INFLU.line.on);
const laneRt = ag => (ag.kind === 'export' ? { a: ag.home, b: ag.city, buyA: ag.goods, buyB: null } : { a: ag.home, b: ag.city, buyA: null, buyB: ag.goods });
const laneNeed = ag => (ag.kind === 'export' ? ag.home : ag.city) + '|' + ag.goods;
const laneRtEq = (r, t) => !!r && r.a === t.a && r.b === t.b && (r.buyA || null) === t.buyA && (r.buyB || null) === t.buyB;
const laneAg = (S, car) => (car && car.lane != null && S.player.agr ? S.player.agr.find(a => a.id === car.lane && a.lane && a.lane.car === car.id) || null : null);
const laneCar = (S, car) => !!(lineOn(S) && laneAg(S, car));
function laneAvail(S, car, city, g, have) { // سحب الخط من مخزن مدينته: الفائض فوق هدف دكاكينها فقط، ولا شيء إن كان لقائد تموين
  if (!laneCar(S, car)) return have; if (supplyOf(S, city, g)) return 0;
  const pr = S.player.props[city]; let tgt = 0; if (pr) for (const sh of pr.shops) for (const it of sh.items) if (it.g === g) tgt += Math.max(1, it.target || 60);
  return Math.max(0, have - tgt);
}
const laneFree = (S, car) => !!(car.captain && !car.main && car.left === 0 && !car.route && !car.line && !car.sup && !car.free && !car.lane && capRole(car) !== 'indep' && !((car.restUntil || 0) > S.day));
function laneCars(S) { return S.player.caravans.filter(c => laneFree(S, c)); }
function laneBlock(S, ag, carId, mode) {
  if (ag && ag.kind !== 'export' && ag.kind !== 'import') return 'غير متاح الآن';
  if (!ag || !lineOn(S) || !(S.player.agr || []).includes(ag)) return 'غير متاح الآن'; if (ag.lane) return 'للاتفاقية خط قائم';
  const car = carById(S, carId); if (!car) return 'اختر قافلة'; if (!car.captain || car.main) return 'الخط لقافلة يقودها قائد مستأجر، لا لقافلتك الرئيسية'; if (!laneFree(S, car)) return 'هذه القافلة مشغولة بعمل آخر أو في الطريق';
  const need = laneNeed(ag), rt = laneRt(ag); for (const o of S.player.agr) if (o !== ag && o.lane && o.lane.mode === 'land' && laneNeed(o) === need) return 'خط آخر يشتري هذه السلعة من هذه المدينة';
  if (mode === 'land') { const buyC = ag.kind === 'export' ? ag.home : ag.city; const o = supplyOf(S, buyC, ag.goods); if (o && ag.kind === 'export') return 'قائد آخر (' + o.name + ') يموّن هذا المخزن بهذه السلعة'; return null; }
  if (mode === 'sea') {
    if (!portmOf(S)) return 'يلزم شهبندر'; if (!isPort(ag.home) || !isPort(ag.city)) return 'يلزم ميناءان'; if (car.city !== ag.home && car.city !== ag.city) return 'يبدأ الخط والقافلة في أحد السوقين'; const ship = laneShip(S, car, ag); if (!ship) return 'لا سفينة راسية في ' + S.cities[car.city].name; return null;
  }
  return 'اختر خطاً برياً أو بحرياً';
}
const laneShip = (S, car) => shipsOf(S).find(x => x.city === car.city && !pmLines(S).some(c => c.line.ship === x.id)) || null;
Object.assign(A, {
  laneOpen(S, agId, carId, mode) {
    const ag = (S.player.agr || []).find(a => a.id === agId), why = laneBlock(S, ag, carId, mode); if (why) return NO(why); const car = carById(S, carId), rt = laneRt(ag);
    if (mode === 'land') { car.route = rt; car.free = false; car.sup = null; car.waiting = null; }
    else { const r = A.portmOpenLine(S, car.id, laneShip(S, car).id, ag.home, ag.city, false); if (r.ok === false) return r; }
    car.lane = ag.id; ag.lane = { car: car.id, mode, since: S.day, wk: S.day, pl0: car.pl || 0, paused: false };
    return OK('فُتح الخط الآلي بين ' + S.cities[ag.home].name + ' و' + S.cities[ag.city].name + ' بقافلة ' + car.name + (mode === 'sea' ? ' (بحري)' : ' (بري)') + '.');
  },
  laneClose(S, agId) { const ag = (S.player.agr || []).find(a => a.id === agId); if (!ag || !ag.lane) return NO('لا خط'); laneClose(S, ag, 'أنهيتَ الخط'); return OK('أُغلق الخط الآلي؛ القافلة حرّة.'); },
});
for (const k of ['laneOpen', 'laneClose']) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }
function laneClose(S, ag, why) {
  const L = ag.lane; if (!L) return; const car = carById(S, L.car);
  if (car) { if (L.mode === 'land' && laneRtEq(car.route, laneRt(ag))) car.route = null; if (L.mode === 'sea' && car.line) { delete car.line; car.waiting = null; } if (car.lane === ag.id) delete car.lane; }
  delete ag.lane; if (why) news(S, 'أُغلق الخط الآلي بين ' + S.cities[ag.home].name + ' و' + S.cities[ag.city].name + ': ' + why + '.');
}
function laneDay(S, ag) { // يومياً لاتفاقية لها خط؛ لا يرمي استثناءً أبداً (قائد غائب أو قافلة ذهبت)
  const L = ag.lane; if (!L || !lineOn(S)) return; const car = carById(S, L.car);
  if (!car) { laneClose(S, ag, 'القافلة لم تعد لك'); return; }
  if (!car.captain) { L.paused = true; return; } // بلا قائد لا يعمل؛ يستأنف بقائد
  const rt = laneRt(ag);
  if (L.paused) { L.paused = false; if (L.mode === 'land' && !car.route && !car.line && !car.sup && !car.free) car.route = rt; }
  if (L.mode === 'land' && !laneRtEq(car.route, rt)) { laneClose(S, ag, 'غيّرتَ عمل القافلة'); return; }
  if (L.mode === 'sea' && !car.line) { laneClose(S, ag, 'ألغيتَ خط السفينة'); return; }
  if (S.day - L.wk >= INFLU.line.week) { const d = (car.pl || 0) - (L.pl0 || 0); L.wk = S.day; L.pl0 = car.pl || 0; L.last = Math.round(d); if (d > 0) news(S, INFLU_TXT.lane.ok(S.cities[ag.home].name, S.cities[ag.city].name, Math.round(d) + ' ريالاً'), 'good'); }
}
