/* الطرق والدكاكين والمواسم (036هـ): معاهدة المرور CT-10 والممر الآمن CT-11 وعقد الامتياز CT-12 وحجز الموسم CT-13 في سجل P.agr؛ الشرح في specs/036-influence-contracts/spec-e.md. مفاتيح: INFLU.fam.road وINFLU.pass/safe/fran/book.on (false = لا توقيع ولا عرض، وما قام يُسوّى). */
INFLU.fam.road = true;
Object.assign(INFLU, {
  pass: { on: true, trips: [2, 4, 6], cut: [0.15, 0.25, 0.35], step: 0.02, days: 90, minTrust: 0 },
  safe: { on: true, fees: [20, 40, 80], wages: [40, 80], pow: [8, 16], cover: 0.7, cap: 0.5, days: 90, minTrust: 0 },
  fran: { on: true, boost: 0.3, step: 0.05, days: 90, minTrust: 10 },
  book: { on: true, cut: 0.08, perDay: 0.0004, max: 0.16, step: 0.01, ahead: 150, wait: 7, take: 0.5, minTrust: 0 },
});
Object.assign(AGR_KINDS, {
  pass: { fam: 'road', name: 'معاهدة مرور', icon: '', uic: 'travel_land', minTrust: INFLU.pass.minTrust, desc: 'تتفق مع الزعيم على جمارك أقل لقوافلك على طرق سوقه.', obl: 'عدد رحلات معلوم في الشهر، وإلا فشرط جزائي لتعويض الضرر الناتج عن التقصير.' },
  safe: { fam: 'road', name: 'ممر آمن بصندوق تكافل', icon: '', uic: 'ins_goods', minTrust: INFLU.safe.minTrust, desc: 'صندوق «تكافل وتعاون بين التجار» يساهم فيه كل من الطرفين بمبلغ معلوم عن كل رحلة، ويغطّي مخاطر الطريق على قوافلكما.', obl: 'المساهمة المعلومة في الصندوق. أو حراسة مأجورة بأجر معلوم.', note: 'ولا ضمان على أحد لما لم يتعدَّ عليه.' },
  fran: { fam: 'road', name: 'عقد امتياز', icon: '', uic: 'spot_shop', minTrust: INFLU.fran.minTrust, desc: 'تبيع منتج مدينة هذا الزعيم وحدك في دكاكينك دون غيرك من تجارك.', obl: 'تعبئ كمية لا تقل عن حد معلوم. ولا يشمل العقد الأقوات الأساسية.' },
  book: { fam: 'road', name: 'حجز موسم', icon: '', uic: 'season_harvest', minTrust: INFLU.book.minTrust, desc: 'تحجز كمية معلومة من محصول الموسم قبل أن يبدأ وتدفع ثمنها مقدماً، وتستلمها عند الحصاد.', obl: 'إن فسد المحصول رُدّ إليك ثمنك كاملاً دون زيادة ولا نقصان.' },
});
const ROAD_KINDS = { pass: 1, safe: 1, fran: 1, book: 1 }; Object.assign(FIN_KINDS, ROAD_KINDS);
const roadLive = k => !!(INFLU.on && INFLU.fam.road && INFLU[k] && INFLU[k].on); // يعمل العقد القائم وأثره (بلا شرط الشخصية: لا يعلق مال)
const roadTier = S => Math.min(INFLU.tierMax, (S.player.agrSpec && S.player.agrSpec.road) || 0);
function roadSpecAdd(S, d) { const sp = S.player.agrSpec || (S.player.agrSpec = { lane: 0 }); sp.road = Math.max(0, (sp.road || 0) + d); }
const rdMove = (ag, inc, out) => { ag.m.in += inc || 0; ag.m.out += out || 0; ag.tot.in += inc || 0; ag.tot.out += out || 0; }; // كل ريال تحرّك فعلاً بسبب العقد (دخل أو كلفة)
const roadNet = a => Math.round(a.tot.in - a.tot.out);
const roadOf = (S, k, f) => (INFLU.on && S.player.agr ? S.player.agr.find(a => a.kind === k && f(a)) || null : null);
// ---- الشروط ----
const passCut = (S, trips) => INFLU.pass.cut[Math.max(0, INFLU.pass.trips.indexOf(trips))] + INFLU.pass.step * roadTier(S);
const franBoost = S => INFLU.fran.boost + INFLU.fran.step * roadTier(S);
const franShop = (S, home, g) => !!(S.player.props[home] && S.player.props[home].shops.some(sh => sh.items.some(it => it.g === g)));
const franGoods = (S, city) => { const c = S.cities[city]; return c ? GIDS.filter(g => !GD[g].sp && !GD[g].live && HOARD_GOODS[g] !== 'قوت' && sells(c, g)) : []; }; // لا يشمل الأقوات الأساسية
function franMins(S, home, g) { const c = S.cities[home], base = Math.max(10, Math.round(((c && c.dem[g]) || 1) * 15 / 5) * 5); return [Math.max(5, Math.round(base * 0.5 / 5) * 5), base, Math.round(base * 1.5 / 5) * 5]; }
const bookGoods = (S, city) => { const c = S.cities[city], out = []; if (!c) return out; for (const k of CROP_IDS) { const g = CROP_DEFS[k].g; if (GD[g] && !GD[g].live && sells(c, g) && !out.includes(g)) out.push(g); } return out; };
const inHarvest = (S, d) => seasonsAt(S, d).includes('harvest');
function bookDue(S) { if (inHarvest(S, S.day)) return 0; for (let i = 1; i <= INFLU.book.ahead; i++) if (inHarvest(S, S.day + i)) return i; return null; } // أيام حتى يبدأ موسم الحصاد (0 = بدأ؛ null = بعيد)
const bookCut = (S, days) => Math.min(INFLU.book.max, INFLU.book.cut + INFLU.book.perDay * days) + INFLU.book.step * roadTier(S);
function roadBlock(S, city, kind, o) { // بعد finBase (الخانات والثقة والسوق المحكوم)
  const P = S.player, c = S.cities[city], R = INFLU[kind];
  if (kind === 'pass') { if (!R.trips.includes(o.trips)) return 'اختر عدد الرحلات في الشهر'; }
  else if (kind === 'safe') { if (!['fund', 'guard'].includes(o.mode)) return 'اختر الصندوق أو الحراسة'; if (!(o.mode === 'fund' ? R.fees : R.wages).includes(o.fee)) return 'اختر المبلغ المعلوم لكل رحلة'; }
  else if (kind === 'fran') { if (o.g && HOARD_GOODS[o.g] === 'قوت') return 'لا يشمل العقد الأقوات الأساسية'; if (!franGoods(S, city).includes(o.g)) return 'سلعة لا تصلح لهذا العقد'; if (!franShop(S, o.home, o.g)) return 'يلزم دكان لك في ' + S.cities[o.home].name + ' يعرض هذه السلعة'; if (!(o.qty >= 1)) return 'كمية غير صالحة'; }
  else if (kind === 'book') {
    if (!bookGoods(S, city).includes(o.g)) return 'سلعة لا تصلح لهذا العقد'; if (!(o.qty >= 1)) return 'كمية غير صالحة'; const due = bookDue(S);
    if (due === 0) return 'بدأ موسم الحصاد: يُحجز المحصول قبل أن يبدأ'; if (due == null) return 'لا موسم حصاد في الـ' + R.ahead + ' يوماً القادمة';
    const pr = P.props[o.home]; if (!pr || !(pr.whs > 0) || storeRoom(S, o.home) < o.qty * GD[o.g].w) return 'لا مكان في مخزنك بسوقك المحكوم لهذه الكمية';
    const cost = o.qty * unitPrice(c, o.g) * (1 - bookCut(S, due)); if (P.gold < cost) return 'الثمن يحتاج ' + Math.ceil(cost);
  } else return 'غير متاحة الآن';
  return null;
}
function roadSign(S, city, kind, o) {
  const P = S.player, bs = bossOf(S, city), c = S.cities[city], rec = { id: S.nextId++, kind, city, home: o.home, goods: o.g || null, qty: o.qty || 0, since: S.day, cnt: 0, ok: 0, miss: 0, led: { exp: 0, act: 0, why: '' }, hist: [], m: { in: 0, out: 0, trips: 0, sold: 0 }, tot: { in: 0, out: 0 } };
  if (kind === 'pass') { Object.assign(rec, { trips: o.trips, cut: passCut(S, o.trips), left: INFLU.pass.days, total: INFLU.pass.days }); rec.led.exp = o.trips; }
  else if (kind === 'safe') Object.assign(rec, { mode: o.mode, fee: o.fee, pool: 0, paid: 0, got: 0, claims: 0, saves: 0, trips: 0, left: INFLU.safe.days, total: INFLU.safe.days });
  else if (kind === 'fran') { const pr = P.props[o.home]; Object.assign(rec, { boost: franBoost(S), s0: (pr && pr.store[o.g]) || 0, left: INFLU.fran.days, total: INFLU.fran.days }); rec.led.exp = o.qty; }
  else { const due = bookDue(S), cut = bookCut(S, due), unit = unitPrice(c, o.g) * (1 - cut), cost = unit * o.qty; pPay(S, 'purchases', cost, false); Object.assign(rec, { cap: cost, unit, cut, got: 0, dw: 0, left: due, total: due }); rec.led.exp = o.qty; rdMove(rec, 0, cost); }
  (P.agr || (P.agr = [])).push(rec); bs.pacted = true; return OK('وقّعت ' + AGR_KINDS[kind].name + ' مع ' + bs.name + ' لمدة ' + rec.total + ' يوماً');
}
// ---- معاهدة المرور: جمارك أقل عند دخول سوق الزعيم (customsOf)، وعدد رحلات معلوم في الشهر ----
let PASS_OFF = false;
function passMul(S, to) { if (PASS_OFF || !roadLive('pass')) return 1; const ag = roadOf(S, 'pass', a => a.city === to); return ag ? 1 - ag.cut : 1; }
function roadArrive(S, from, to, cargo, natMul) { // وصول قافلة لك (من agrCustomsNote في arrive): رحلة تُحسب، وما وفّرته من الجمارك فعلاً
  if (!roadLive('pass')) return; const ag = roadOf(S, 'pass', a => a.city === to); if (!ag) return; ag.m.trips++; ag.led.act = ag.m.trips;
  PASS_OFF = true; const full = customsOf(S, from, to, cargo, true); PASS_OFF = false; const d = (full - customsOf(S, from, to, cargo, true)) * (natMul == null ? 1 : natMul);
  if (d > 0) { rdMove(ag, d, 0); ag.m.saved = (ag.m.saved || 0) + d; } ag.led.why = 'رحلة ' + ag.m.trips + ' من ' + ag.trips + ' هذا الشهر' + (d > 0 ? '؛ وفّرتَ ' + Math.round(d) + ' من الجمارك' : '');
}
// ---- الممر الآمن: مساهمة معلومة لكل رحلة من سوق الزعيم أو إليه، أو أجر حراسة معلوم ----
function roadTrip(S, car, dest) { // من startTrip بعد دفع النفقة
  delete car.rdp; if (!roadLive('safe')) return; const ag = roadOf(S, 'safe', a => a.city === car.city || a.city === dest); if (!ag || S.player.gold < ag.fee) return;
  const paid = pPay(S, ag.mode === 'fund' ? 'takaful' : 'roadGuard', ag.fee, true); rdMove(ag, 0, paid); ag.paid += paid; ag.trips++; car.rdp = ag.id;
  if (ag.mode === 'fund') { ag.pool += paid * 2; ag.led.why = 'ساهمتَ بـ ' + Math.round(paid) + ' وساهم الزعيم بمثلها؛ في الصندوق ' + Math.round(ag.pool); } else ag.led.why = 'دفعتَ أجر الحراسة ' + Math.round(paid) + ' لهذه الرحلة';
}
const rdpAg = (S, car) => (car && car.rdp != null && roadLive('safe') ? roadOf(S, 'safe', a => a.id === car.rdp) : null);
function roadDef(S, car, kind) { const ag = rdpAg(S, car); return ag && ag.mode === 'guard' && kind !== 'pirates' ? INFLU.safe.pow[Math.max(0, INFLU.safe.wages.indexOf(ag.fee))] : 0; }
function roadSaved(S, car) { const ag = rdpAg(S, car); if (!ag) return; ag.saves++; ag.led.why = 'صدّ حرّاس الزعيم قطاع الطرق عن قافلتك (' + ag.saves + ')'; }
function roadClaim(S, car, lost, kind) { // نهبٌ في رحلة مشمولة: يعوّض الصندوق من رصيده وحده بنسبة من الخسارة؛ ولا يضمن أحدٌ ما لم يتعدَّ عليه
  const ag = rdpAg(S, car); if (!ag || ag.mode !== 'fund' || kind === 'pirates' || !(lost > 0)) return 0; const pay = Math.min(lost * INFLU.safe.cover, ag.pool * INFLU.safe.cap); if (pay < 1) { ag.led.why = 'نُهبت قافلتك ورصيد الصندوق لا يكفي للتعويض'; return 0; }
  ag.pool -= pay; ag.got += pay; ag.claims++; S.player.gold += pay; S.player.led.inc.takaful = (S.player.led.inc.takaful || 0) + pay; rdMove(ag, pay, 0); ag.led.why = 'عوّضك الصندوق ' + Math.round(pay) + ' من خسارة ' + Math.round(lost);
  news(S, 'عوّضك صندوق ' + AGR_KINDS.safe.name + ' ' + fmtN(pay) + ' ريالاً من رصيده عن نهب قافلتك.', 'good'); return pay;
}
// ---- عقد الامتياز: بيع منتج مدينة الزعيم في دكاكينك وحدك (إقبال أكبر)، وحد أدنى للتعبئة في الشهر ----
const franOf = (S, city, g) => (roadLive('fran') ? roadOf(S, 'fran', a => a.home === city && a.goods === g) : null);
function franMul(S, city, g) { const ag = franOf(S, city, g); return ag ? 1 + ag.boost : 1; }
function franNote(S, city, g, units, net) { const ag = franOf(S, city, g); if (!ag) return; ag.m.sold += units; rdMove(ag, net * ag.boost / (1 + ag.boost), 0); } // الربح الصافي للوحدات الزائدة بالامتياز
// ---- حجز الموسم: سلم في الذمة؛ عند الحصاد تسليم، وإن فسد المحصول رُدّ الثمن كاملاً ----
function bookSettle(S, ag, bs) {
  const c = S.cities[ag.city], P = S.player, g = ag.goods, pr = P.props[ag.home], w = GD[g].w, spoil = !!(c.sh && ['drought', 'flood', 'famine'].includes(c.sh.k));
  const n = spoil ? 0 : Math.max(0, Math.min(ag.qty - ag.got, Math.floor((c.stock[g] || 0) * INFLU.book.take), pr ? Math.floor(storeRoom(S, ag.home) / w) : 0));
  if (n > 0) { c.stock[g] -= n; pr.store[g] = (pr.store[g] || 0) + n; addBasis(pr.basis || (pr.basis = {}), g, n, n * ag.unit); ag.got += n; ag.led.act = ag.got; rdMove(ag, n * unitPrice(c, g), 0); }
  if (ag.got >= ag.qty) { ag.led.why = 'استلمتَ ' + ag.got + ' وحدة من ' + GD[g].name + ' عند الحصاد بسعر ' + Math.round(ag.unit) + ' للوحدة'; ag.ok++; roadSpecAdd(S, 1); bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); return true; }
  if (spoil || ++ag.dw >= INFLU.book.wait) { const back = ag.cap * (ag.qty - ag.got) / ag.qty; P.gold += back; rdMove(ag, back, 0); ag.led.why = INFLU_TXT.refund + ' (' + Math.round(back) + ')'; news(S, INFLU_TXT.refund + ' ' + AGR_KINDS.book.name + ' في ' + c.name + ': ' + fmtN(back) + ' ريال.', ''); if (ag.got > 0) ag.ok++; return true; }
  ag.led.why = 'ننتظر المحصول أو مكاناً في مخزنك'; return false;
}
// ---- الشهر والنهاية: سطر لكل عقد بما تحرّك فعلاً، والشرط الجزائي بالضرر الفعلي ----
function roadMonth(S, ag, bs) {
  const P = S.player, K = AGR_KINDS[ag.kind], m = ag.m; let why = '', dmg = 0;
  if (ag.kind === 'pass') { const short = Math.max(0, ag.trips - m.trips); if (short > 0) { dmg = (m.saved || 0) * short / ag.trips; why = 'رحلاتك ' + m.trips + ' من ' + ag.trips + '؛ الضرر الفعلي: ما وفّرته من الجمارك بقدر الناقص ' + Math.round(dmg); } else why = 'رحلاتك ' + m.trips + ' من ' + ag.trips + ': وفّيتَ'; }
  else if (ag.kind === 'fran') { const pr = P.props[ag.home], st = (pr && pr.store[ag.goods]) || 0, fill = Math.round(m.sold + Math.max(0, st - ag.s0)), short = Math.max(0, ag.qty - fill); ag.s0 = st; ag.led.act = fill;
    if (short > 0) { dmg = short * INFLU.margin * refPrice(S.cities[ag.city], ag.goods); why = 'عبّأتَ ' + fill + ' من ' + ag.qty + '؛ الضرر الفعلي: هامش الزعيم في الناقص ' + Math.round(dmg); } else why = 'عبّأتَ ' + fill + ' من ' + ag.qty + ': وفّيتَ'; }
  else if (ag.kind === 'safe') why = ag.mode === 'fund' ? 'في الصندوق ' + Math.round(ag.pool) + '، وعوّضك ' + Math.round(ag.got) : 'صدّ الحرّاس ' + ag.saves + ' هجمات';
  else why = 'دفعتَ ' + Math.round(ag.cap) + '؛ الحصاد بعد ' + Math.max(0, ag.left) + ' يوماً';
  if (ag.kind === 'pass' || ag.kind === 'fran') {
    if (dmg > 0) { const pay = payPenalty(S, ag, ag.kind === 'pass' ? { customsGiven: dmg } : { marginLost: dmg }, why); rdMove(ag, 0, pay); ag.miss++; roadSpecAdd(S, -1); bs.trust = clamp(bs.trust - INFLU.trustMiss, -100, 100); news(S, INFLU_TXT.missed(K.name, bs.name), 'bad'); }
    else { ag.ok++; roadSpecAdd(S, 1); bs.trust = clamp(bs.trust + INFLU.trustOk, -100, 100); }
  }
  const net = m.in - m.out; ag.hist.push({ d: S.day, inc: Math.round(m.in), out: Math.round(m.out), net: Math.round(net), why }); if (ag.hist.length > 6) ag.hist.shift(); ag.led.why = why;
  news(S, 'شهر ' + K.name + ' مع ' + bs.name + ': دخل ' + fmtN(m.in) + '، كلفة ' + fmtN(m.out) + '، الصافي ' + fmtN(net) + '. ' + why + '.', net >= 0 ? '' : 'bad');
  ag.m = { in: 0, out: 0, trips: 0, sold: 0 };
}
function roadEnd(S, ag, bs, why) { // نهاية العقد أو تصفيته: خبر بالحصيلة الفعلية وسطر في سجل P.agrLog
  if (ag.kind === 'safe' && ag.pool > 0) { const back = ag.pool / 2; ag.pool = 0; S.player.gold += back; S.player.led.inc.takaful = (S.player.led.inc.takaful || 0) + back; rdMove(ag, back, 0); } // فائض الصندوق بين المشاركَين بقدر مساهمتهما
  const net = roadNet(ag); mfgLog(S, ag, net);
  news(S, (why ? why + ': ' : '') + 'انتهت ' + AGR_KINDS[ag.kind].name + ' مع ' + bs.name + '. الحصيلة الفعلية: دخل ' + fmtN(ag.tot.in) + '، كلفة ' + fmtN(ag.tot.out) + '، الصافي ' + fmtN(net) + '.', net >= 0 ? 'good' : 'bad');
  if (!why && !ag.miss) { bs.trust = clamp(bs.trust + INFLU.trustEnd, -100, 100); repOf(S.player).done++; }
}
const roadDrop = (S, ag) => { S.player.agr = S.player.agr.filter(x => x !== ag); };
function roadDay(S, ag, bs) { // يومياً لعقد قائم (من agrFinDay)
  if (!roadLive(ag.kind)) { roadClose(S, ag, 'أُطفئ العقد'); roadDrop(S, ag); return; }
  ag.left--; ag.cnt++;
  if (ag.kind === 'book') { if (ag.left <= 0) { if (bookSettle(S, ag, bs)) { roadEnd(S, ag, bs); roadDrop(S, ag); } } else if (ag.cnt % INFLU.period === 0) roadMonth(S, ag, bs); return; }
  if (ag.cnt % INFLU.period === 0 || ag.left <= 0) roadMonth(S, ag, bs);
  if (ag.left <= 0) { roadEnd(S, ag, bs); roadDrop(S, ag); }
}
function franShortDmg(S, ag) { // الفسخ: هامش الزعيم في الناقص من التزام الشهر الجاري حتى يوم الفسخ (بنسبة أيامه)
  const pr = S.player.props[ag.home], st = (pr && pr.store[ag.goods]) || 0, fill = ag.m.sold + Math.max(0, st - ag.s0), due = ag.qty * (ag.cnt % INFLU.period) / INFLU.period;
  return Math.max(0, due - fill) * INFLU.margin * refPrice(S.cities[ag.city], ag.goods);
}
function roadClose(S, ag, why) { // فسخ، أو حكمتَ سوق الطرف الثاني، أو أُطفئ: لا يعلق مال
  const P = S.player, bs = bossOf(S, ag.city) || { trust: 0, name: '' };
  if (ag.kind === 'book') { const back = ag.cap * (ag.qty - ag.got) / ag.qty; P.gold += back; rdMove(ag, back, 0); }
  else if (why === 'فسختَ العقد' && (ag.kind === 'pass' || ag.kind === 'fran')) { const dmg = Math.max(0, ag.kind === 'pass' ? ag.m.saved || 0 : franShortDmg(S, ag)); const pay = payPenalty(S, ag, ag.kind === 'pass' ? { customsGiven: dmg } : { marginLost: dmg }, why); rdMove(ag, 0, pay); ag.brk = pay; } // الضرر الفعلي: المرور ما وفّرته هذا الشهر، والامتياز هامش الزعيم في الناقص حتى يوم الفسخ
  roadEnd(S, ag, bs, why);
}
function roadBreak(S, ag) { // من A.breakAgr
  if (ag.kind === 'book') return NO('حجز الموسم لا يُفسخ قبل الحصاد');
  const nm = AGR_KINDS[ag.kind].name, bs = bossOf(S, ag.city); agrDrop(S, ag, 'فسختَ العقد');
  if (ag.kind !== 'safe' && bs) { bs.trust = clamp(bs.trust - 10, -100, 100); bs.cd = S.day + 5; repOf(S.player).broke++; }
  return OK('فسخت ' + nm + (ag.brk > 0 ? ' ودفعت ' + Math.round(ag.brk) + ' تعويضاً عن الضرر' : '') + '.');
}
function roadView(a) {
  const o = { fin: true, road: true, mIn: Math.round(a.m.in), mOut: Math.round(a.m.out), net: roadNet(a), tin: Math.round(a.tot.in), tout: Math.round(a.tot.out) };
  if (a.kind === 'pass') Object.assign(o, { trips: a.trips, done: a.m.trips, cut: a.cut });
  else if (a.kind === 'safe') Object.assign(o, { mode: a.mode, fee: a.fee, pool: Math.round(a.pool), got: Math.round(a.got), saves: a.saves, n: a.trips });
  else if (a.kind === 'fran') Object.assign(o, { boost: a.boost, sold: Math.round(a.m.sold) });
  else Object.assign(o, { cap: Math.round(a.cap), unit: Math.round(a.unit), got: a.got });
  return o;
}
