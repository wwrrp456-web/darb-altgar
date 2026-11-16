/* السمسار التعليمي المولَّد (030): سماسرة مولَّدون حقيقتهم تُولَّد عند العرض لا عند القبول، وقرائن تُفحص قبل القرار.
   كل ثابت ومعادلة وترتيب سحب حرفاً من specs/030-broker/plan.md؛ لا Math.random ولا rnd/rndB/roll/rgRng هنا (المولّد بذري خاص: S.brokerGen).
   BROKER.on=false = السلوك الحالي حرفاً (سمسار الثراء السريع القديم، ولا حقل جديد في الحفظ). النصوص الشرعية الأربعة في BR_SH حرفاً من docs/review/APPROVED_BROKER_2026-11-16.md. */
const BROKER = {
  on: true,                       // false = السلوك الحالي حرفاً (لا حقول، والسمسار القديم كما هو)
  minLevel: 6, minLiq: 600, minQ: 5,
  gap: [20, 40], retry: 7,        // أيام بين العروض؛ وإعادة المحاولة إن تعذّر العرض
  life: [5, 10], rushLife: 3, lifeMin: 3, lifeMax: 12,
  share: 0.25, min: 300,          // حجم الصفقة نسبة من السيولة (ريال)، وأدناه
  cap: [1500, 3000, 6000, 12000, 25000, 50000, 100000, 200000, 400000, 800000], // سقف بالريال لكل rgTier(S) = 0..9
  fee: [0.03, 0.035, 0.04, 0.045, 0.05], // أجرة السمسرة في الدلالة (SH-01): نسبة معلومة تُسحب عند الإنشاء
  honest: [0.90, 0.75, 0.55, 0.40, 0.15], // احتمال الصدق بالسمعة الحقيقية BR_REP
  relBonus: [0, 0, 0.10, 0.05], honestMax: 0.95, // بالعلاقة BR_REL
  uHonest: [0.78, 0.92],          // السعر ÷ السوق للصادق
  uBad: [[0.55, 0.92], [0.65, 0.92], [0.72, 0.92]], // للغاشّ بحسب brBand(S)
  tooGood: 0.75,                  // دونه «أحسن من أن يكون حقيقياً»
  v: [0.60, 0.80],                // جودة بضاعة الغاشّ = u × v
  noise: [0.25, 0.30, 0.35],      // ضجيج الصادق بحسب brBand(S)
  noInsp: 0.40,                   // الغاشّ يرفض المعاينة
  wHonest: 0.90, wBad: 0.30, wMin: 0.05, wMax: 0.95, // قبول كتابة مهلة الردّ
  inspFee: 0.01, inspMin: 10, inspMax: 200, // رسم المعاينة من ثمن الصفقة (بعملة السوق)
  askCool: 14, askTrust: 1,       // السؤال الثاني عند الزعيم نفسه خلال 14 يوماً يكلّف ثقة 1
  retDays: 7, reveal: 2,          // مهلة الردّ المكتوبة؛ وأيام ظهور النتيجة بعد القرار
  recent: 80, stylePow: 8, claimX: 1.5, ledgerMax: 40, logMax: 20,
  memDirty: false
};
const brBand = S => Math.min(2, Math.floor(rgTier(S) / 3));
const brLerp = (a, x) => a[0] + (a[1] - a[0]) * x;
const brRate = (S, cur) => cur === 'sar' ? 1 : S.fx.usd;   // ريال لكل وحدة من عملة السوق
const brR2 = x => Math.round(x * 100) / 100;

const BR_TYPE = { good: 'بضاعة حاضرة بسعر حسن', unseen: 'بضاعة لم تُرَ', refer: 'دلالة على مورّد بعمولة' };
const BR_STYLE = { full: 'يعرض الأرقام كاملة', exagg: 'يبالغ', rush: 'يستعجل', secret: 'يتكتم على المصدر', others: 'يستشهد بآخرين' };
const BR_REP = ['معروف بالصدق', 'طيب السمعة قليل المعرفة', 'مجهول', 'سجله مختلط', 'سيئ السمعة'];
const BR_REL = ['غريب', 'سبق التعامل معه', 'أوصى به زعيم', 'قريب أحد عمّالك'];
const BR_PERS = [ // life: أيام تُضاف لمدة العرض · w: يُضاف لاحتمال قبول المهلة · insp: مضاعف رسم المعاينة
  { n: 'هادئ يفصّل', life: 0, w: 0.05, insp: 0.5 }, { n: 'متحمس', life: 2, w: 0, insp: 1 },
  { n: 'متكتم', life: 0, w: -0.05, insp: 1 },        { n: 'ودود', life: 1, w: 0.05, insp: 1 },
  { n: 'متعجّل', life: -2, w: 0, insp: 1 },          { n: 'متواضع', life: 0, w: 0.05, insp: 1 },
  { n: 'مدّعٍ', life: 0, w: -0.05, insp: 1 },        { n: 'دقيق', life: 1, w: 0, insp: 0.5 },
  { n: 'مجامل', life: 1, w: -0.05, insp: 1 },        { n: 'صريح', life: 0, w: 0.10, insp: 1 } ];
const BR_TITLE = ['الحدّاد', 'الخشّاب', 'الطحّان', 'الخبّاز', 'الحلواني', 'الدبّاغ', 'السلّال', 'المبيّض', 'الكوّاز', 'الرفّاء',
  'الحائك', 'الشمّاع', 'الصبّان', 'الدهّان', 'الحمّال', 'البقّال', 'الفاكهاني', 'اللبّان', 'المكاري', 'الخضّار',
  'الحجّار', 'الطيّان', 'الحصّاد', 'الحرّاث', 'الصوّاف', 'الفانوسي', 'الفرّان', 'الحطّاب', 'الصيّاد', 'الزرّاع']; // لا تكرار مع RG_TITLE؛ لمراجعة بن محمود
/* النصوص الشرعية المعتمدة حرفاً (docs/review/APPROVED_BROKER_2026-11-16.md)؛ لا نص شرعي غيرها في الحزمة */
const BR_SH = {
  SH01: 'أجرة السمسرة (أو الجعالة): نسبة معلومة من ثمن الصفقة عند إتمامها',
  SH03: 'ادعاء رغبة المشترين كذباً لخداع المشتري ورفع السعر محرّم (وهو من النجش والغش)',
  SH04: 'البَيِّعَانِ بِالخِيَارِ مَا لَمْ يَتَفَرَّقَا، فَإِنْ صَدَقَا وَبَيَّنَا بُورِكَ لَهُمَا فِي بَيْعِهِمَا، وَإِنْ كَتَمَا وَكَذَبَا مُحِقَتْ بَرَكَةُ بَيْعِهِمَا',
  SH05: 'المستشار مؤتمن، وسؤال أهل الخبرة نصيحة تحفظ الحقوق'
};
const BR_HADITH = 'قال رسول الله ﷺ: '; // صيغة التقديم المعتمدة في src/fiqh.js (تُراجَع في البرومت 6)

/* ---------- المولّد والذاكرة ---------- */
let BR_MEM = null;
const brokerMemoryNew = () => ({ recent: [], counts: {} });
function brokerMemorySet(m) { BR_MEM = m && typeof m === 'object' ? (m.recent && m.counts ? m : Object.assign(m, brokerMemoryNew(), m)) : null; }
const brokerMemoryNow = () => BR_MEM;
const brState = S => S.brokerGen || (S.brokerGen = { seed: (((S.seed >>> 0) ^ 0x5BD1E995) >>> 0) || 1, n: 0, k: 0, next: null });
const brRng = S => { const G = brState(S); return rgStream((G.seed + Math.imul(G.n + 1, 0x9E3779B1) + Math.imul((G.k = (G.k || 0) + 1), 0x85EBCA6B)) | 0); };
const brCount = (S, dim, v) => { const m = BR_MEM || S.brokerSeen; return (m && m.counts && m.counts[dim] && m.counts[dim][v]) || 0; };
const brPick = (S, r, dim, list, pow) => rgPick(S, r, dim, list, pow, brCount);
const brSig = x => [x.name, x.type, x.style, x.pers, x.ri, x.rel].join('|');
const brData = S => S.brokers || (S.brokers = { offer: null, ret: null, pend: [], ledger: {}, log: [], ask: {} });
const brPersOf = o => BR_PERS.find(x => x.n === o.pers) || BR_PERS[0];

/* مشتقات العرض: تُحسب ولا تُحفظ */
const brCost = o => brR2(o.p * o.q);
const brFeeAmt = o => Math.round(o.fee * brCost(o));
const brTotal = o => brCost(o) + brFeeAmt(o);
const brInspAmt = o => Math.round(Math.min(BROKER.inspMax, Math.max(BROKER.inspMin, Math.round(brCost(o) * BROKER.inspFee))) * (o.style === 'secret' ? 2 : 1) * brPersOf(o).insp);
const brPct = o => Math.round((1 - o.p / o.m) * 100);
const brTooGood = o => o.p / o.m < BROKER.tooGood;

/* الإنشاء: يُستدعى من brokerDay فقط، والقافلة الرئيسية واقفة في مدينة */
function brokerGen(S, mem) {
  if (mem) brokerMemorySet(mem);
  const car = mainCar(S); if (!car || car.left !== 0) return null;
  const B = brData(S), G = brState(S), r = brRng(S), cid = car.city, c = S.cities[cid], cur = curOf(c.country), rate = brRate(S, cur), band = brBand(S);
  const amt = Math.round(Math.min(BROKER.share * liquid(S), BROKER.cap[rgTier(S)]) / 10) * 10;
  if (amt < BROKER.min) return null;
  const goods = GIDS.filter(g => !GD[g].live && sells(c, g) && (c.stock[g] || 0) >= 10);
  if (!goods.length) return null;
  const rels = ['غريب'], ledger = B.ledger, olds = Object.keys(ledger).filter(n => ledger[n].last <= S.day - 60);
  if (olds.length) rels.push('سبق التعامل معه');
  if (bossOf(S, cid)) rels.push('أوصى به زعيم');
  if (Object.values(S.player.props).some(p => (p.staff || []).length)) rels.push('قريب أحد عمّالك');
  for (let tries = 0; tries < 40; tries++) {
    const type = brPick(S, r, 'type', ['good', 'unseen', 'refer']);
    const style = brPick(S, r, 'pat:' + type, ['full', 'exagg', 'rush', 'secret', 'others'], BROKER.stylePow);
    const pers = brPick(S, r, 'pers', BR_PERS.map(x => x.n));
    const rel = brPick(S, r, 'rel', rels);
    let name, ri, fn = null, ep = null, old = null;
    if (rel === 'سبق التعامل معه') { name = old = brPick(S, r, 'old', olds); ri = ledger[name].ri; }
    else {
      fn = brPick(S, r, 'fn', RG_FIRST); ep = brPick(S, r, 'ep', BR_TITLE); name = fn + ' ' + ep;
      ri = BR_REP.indexOf(brPick(S, r, 'rep', BR_REP));
      if (ledger[name] || (S.rivals || []).some(o => o.out == null && o.name === name)) continue;
    }
    const g = brPick(S, r, 'g', goods);
    const x = { name, type, style, pers, ri, rel };
    if (((BR_MEM || S.brokerSeen || {}).recent || []).some(o => brSig(o) === brSig(x))) continue;
    /* الحقيقة: سحبات بهذا الترتيب حرفاً، كلها من r */
    const pH = Math.min(BROKER.honestMax, BROKER.honest[ri] + BROKER.relBonus[BR_REL.indexOf(rel)]);
    const honest = r() < pH;
    const m = unitPrice(c, g), u = brR2(brLerp(honest ? BROKER.uHonest : BROKER.uBad[band], r())), p = brR2(m * u);
    const q = Math.floor(amt / rate / p);
    if (q < BROKER.minQ) return null;
    const qd = honest ? 1 : brR2(u * brLerp(BROKER.v, r()));
    const noise = honest && r() < BROKER.noise[band] ? (r() < 0.5 ? 'rush' : 'warranty') : null;
    const noInsp = !honest && r() < BROKER.noInsp;
    const PE = BR_PERS.find(y => y.n === pers);
    const wOk = type === 'refer' ? null : noise === 'warranty' ? false : r() < Math.min(BROKER.wMax, Math.max(BROKER.wMin, (honest ? BROKER.wHonest : BROKER.wBad) + PE.w));
    const fee = type === 'refer' ? BROKER.fee[Math.floor(r() * BROKER.fee.length)] : 0;
    const life = style === 'rush' || noise === 'rush' ? BROKER.rushLife : Math.min(BROKER.lifeMax, Math.max(BROKER.lifeMin, BROKER.life[0] + Math.floor(r() * (BROKER.life[1] - BROKER.life[0] + 1)) + PE.life));
    const o = { id: G.n + 1, day: S.day, until: S.day + life, life, city: cid, cur, name, type, style, pers, rel, ri, g, q, p, m, fee,
      claim: style === 'exagg' ? Math.round(q * (m - p) * BROKER.claimX) : 0, t: { honest, qd, wOk, noInsp, noise }, seen: {}, st: 'open' };
    G.n++; G.k = 0;
    for (const M of [S.brokerSeen = S.brokerSeen || brokerMemoryNew(), BR_MEM]) if (M) {
      M.recent.push(x); while (M.recent.length > BROKER.recent) M.recent.shift();
      const dims = [['type', type], ['pat:' + type, style], ['pers', pers], ['rel', rel], ['rep', BR_REP[ri]], ['g', g]];
      if (old) dims.push(['old', old]); else dims.push(['fn', fn], ['ep', ep]);
      for (const [d, v] of dims) { const k = M.counts[d] || (M.counts[d] = {}); k[v] = (k[v] || 0) + 1; }
    }
    BROKER.memDirty = true;
    const L = ledger[name] = ledger[name] || { ri, seen: 0, acc: 0, rev: 0, hon: 0, net: 0, last: S.day };
    L.seen++; L.last = S.day;
    const names = Object.keys(ledger); if (names.length > BROKER.ledgerMax) { names.sort((a, b) => ledger[a].last - ledger[b].last); for (const n of names.slice(0, names.length - BROKER.ledgerMax)) delete ledger[n]; }
    return o;
  }
  return null;
}

/* ---------- الدورة ---------- */
function brokerDay(S) {
  if (!BROKER.on || S.shadowClone) return;
  const L = S.learn; if (!L || !L.char || taught(L) < BROKER.minLevel) return;
  const B = brData(S), G = brState(S);
  if (G.next == null) { const r = brRng(S); G.next = S.day + BROKER.gap[0] + Math.floor(r() * (BROKER.gap[1] - BROKER.gap[0] + 1)); }
  B.pend = B.pend.filter(x => { if (x.d > S.day) return true; brResolve(S, x.o); return false; });
  if (B.ret && S.day > B.ret.until) { const R = B.ret; B.ret = null; if (R.bad) brFinal(S, R.o, 0); }
  if (B.offer && S.day > B.offer.until) { news(S, 'انصرف السمسار ' + B.offer.name + ' بعرضه.', ''); brLog(S, B.offer, 'gone', 0, 0); B.offer = null; }
  if (!B.offer && S.day >= G.next) {
    const car = mainCar(S), can = liquid(S) >= BROKER.minLiq && !(L.eq && L.eq.length) && !B.ret && car && car.left === 0;
    const o = can ? brokerGen(S) : null, r = brRng(S);
    G.next = S.day + (o ? BROKER.gap[0] + Math.floor(r() * (BROKER.gap[1] - BROKER.gap[0] + 1)) : BROKER.retry);
    if (o) {
      B.offer = o; (L.ex = L.ex || { broker: -99, friend: -99, luck: -99 }).broker = S.day;
      news(S, 'سمسار في سوق ' + S.cities[o.city].name + ': ' + o.name + ' يعرض عليك ' + BR_TYPE[o.type] + '. عرضه في مكتب التاجر ' + dayAr(o.life) + '.', 'rumor');
      interrupt(S, 'brokerGen'); // 'office': عدّاد فقط، لا إيقاف
    }
  }
}

/* ---------- الأفعال: كلها OK/NO ولا سحب عشوائي فيها ---------- */
function brHere(S, o) {
  const B = S.brokers, car = mainCar(S);
  if (!BROKER.on || !B || !o || B.offer !== o || o.st !== 'open') return NO('لا عرض سمسار الآن');
  if (!(car.city === o.city && car.left === 0)) return NO('ارجع إلى ' + S.cities[o.city].name + ' أولاً');
  return null;
}
const brOpen = S => (BROKER.on && S.brokers && S.brokers.offer && S.brokers.offer.st === 'open') ? S.brokers.offer : null;
function brokerInspect(S) {
  const o = brOpen(S); if (!o) return NO('لا عرض سمسار الآن'); if (o.seen.insp) return NO('عاينتَ هذه البضاعة من قبل');
  const bad = brHere(S, o); if (bad) return bad;
  if (o.t.noInsp) { o.seen.insp = { d: S.day, refused: 1 }; return OK('رفض ' + o.name + ' أن تعاين البضاعة'); }
  const P = S.player, amt = brInspAmt(o);
  S.ctxCur = o.cur; if (P.gold < amt) { S.ctxCur = 'sar'; return NO('رصيدك لا يكفي لرسم المعاينة'); }
  P.gold -= amt; P.led.exp.agent = (P.led.exp.agent || 0) + amt; S.ctxCur = 'sar';
  o.seen.insp = { d: S.day + (o.type === 'unseen' ? 1 : 0), q: o.t.qd, fee: amt };
  return OK(o.type === 'unseen' ? 'دفعتَ ' + amt + ' رسماً. تصلك نتيجة المعاينة غداً' : 'دفعتَ ' + amt + ' رسماً. المعاينة: ' + brInspTxt(o));
}
function brokerAsk(S) {
  const o = brOpen(S); if (!o) return NO('لا عرض سمسار الآن'); if (o.seen.ask) return NO('سألتَ الزعيم من قبل');
  const b = bossOf(S, o.city); if (!b) return NO('لا زعيم لسوق هذه المدينة');
  const B = S.brokers; if (S.day - (B.ask[o.city] != null ? B.ask[o.city] : -99) < BROKER.askCool) b.trust = Math.max(0, (b.trust || 0) - BROKER.askTrust);
  B.ask[o.city] = S.day; o.seen.ask = { d: S.day, txt: brBossTxt(S, o) };
  return OK('سألتَ زعيم السوق عن ' + o.name);
}
function brokerWarranty(S) {
  const o = brOpen(S); if (!o) return NO('لا عرض سمسار الآن');
  if (o.type === 'refer') return NO('لا مهلة ردّ في الدلالة: أنت تشتري من المورّد نفسه');
  if (o.seen.warr) return NO('طلبتَ المهلة من قبل');
  o.seen.warr = { d: S.day, ok: o.t.wOk };
  return OK(o.t.wOk ? 'كتب لك ' + o.name + ' مهلة ردّ ' + dayAr(BROKER.retDays) : 'رفض ' + o.name + ' أن يكتب لك مهلة ردّ');
}
function brokerAccept(S) {
  const o = brOpen(S); if (!o) return NO('لا عرض سمسار الآن');
  const bad = brHere(S, o); if (bad) return bad;
  const P = S.player, L = S.learn, B = S.brokers, car = mainCar(S), cost = brCost(o), feeAmt = brFeeAmt(o), total = cost + feeAmt;
  const room = Math.floor((capOfCar(car) - loadOf(car)) / GD[o.g].w);
  if (room < o.q) return NO('لا مكان في قافلتك لـ' + o.q + ' ' + GD[o.g].name + ' (يتسع ' + Math.max(0, room) + ')');
  S.ctxCur = o.cur; if (P.gold + 1e-9 < total) { S.ctxCur = 'sar'; return NO('رصيدك بـ' + CURS[o.cur].name + ' لا يكفي: تحتاج ' + fmtN(total)); }
  P.gold -= total; P.led.exp.purchases = (P.led.exp.purchases || 0) + cost; if (feeAmt) P.led.exp.agent = (P.led.exp.agent || 0) + feeAmt; S.ctxCur = 'sar';
  car.cargo[o.g] = (car.cargo[o.g] || 0) + o.q; addBasis(car.basis, o.g, o.q, total, o.t.qd);
  o.st = 'acc'; o.car = car.id; o.accDay = S.day;
  if (o.type !== 'refer' && o.seen.warr && o.seen.warr.ok) B.ret = { o, until: S.day + BROKER.retDays, bad: false };
  (L.evDone = L.evDone || {}).broker = 1; B.pend.push({ d: S.day + BROKER.reveal, o }); B.offer = null;
  return OK('اشتريتَ ' + o.q + ' ' + GD[o.g].name + ' من ' + o.name + ' بـ' + fmtN(total) + ' ' + CURS[o.cur].name + (feeAmt ? ' (منها أجرة السمسرة ' + fmtN(feeAmt) + ')' : ''));
}
function brokerDecline(S) {
  const o = brOpen(S); if (!o) return NO('لا عرض سمسار الآن');
  const L = S.learn, B = S.brokers; o.st = 'no'; L.ev.brokerNo = (L.ev.brokerNo || 0) + 1; (L.evDone = L.evDone || {}).broker = 1;
  B.pend.push({ d: S.day + BROKER.reveal, o }); B.offer = null;
  return OK('اعتذرتَ من ' + o.name + '. ستسمع بعد أيام ما كان من أمر عرضه');
}
function brokerReturn(S) {
  const B = S.brokers, R = BROKER.on && B && B.ret; if (!R || !R.bad) return NO('لا شيء تردّه الآن');
  const car = carById(S, R.o.car), o = R.o;
  if (!car || car.city !== o.city || car.left !== 0) return NO('ارجع إلى ' + S.cities[o.city].name + ' أولاً: الردّ عند السمسار');
  const k = Math.min(o.q, Math.floor(car.cargo[o.g] || 0)); if (k < 1) return NO('لم يبقَ من البضاعة شيء تردّه');
  takeBasis(car.basis, o.g, k); car.cargo[o.g] -= k; if (car.cargo[o.g] <= 0) delete car.cargo[o.g];
  const refund = brR2(o.p * k); S.ctxCur = o.cur; S.player.gold += refund; S.ctxCur = 'sar';
  B.ret = null; brFinal(S, o, k, refund);
  return OK('ردّ ' + o.name + ' ' + fmtN(refund) + ' ' + CURS[o.cur].name + ' وأخذ بضاعته');
}
function brokerKeep(S) {
  const B = S.brokers, R = BROKER.on && B && B.ret; if (!R || !R.bad) return NO('لا مهلة تنتهيها الآن');
  B.ret = null; brFinal(S, R.o, 0); return OK('أبقيتَ البضاعة وانتهت المهلة');
}

/* ---------- النتائج والتعلّم والسجل ---------- */
const brFee = o => Math.round(o.fee * brR2(o.p * o.q));
const brNet = (o, k) => Math.round((o.q - k) * (o.m * o.t.qd - o.p) - brFee(o)); // بسعر السوق يوم العرض؛ k = المردود
const brCur = o => CURS[o.cur].name;
function brClues(o) {
  const c = [];
  if (brTooGood(o)) c.push('السعر أقل من السوق بـ' + brPct(o) + '٪، وهذا أحسن من أن يكون حقيقياً');
  if (o.life === BROKER.rushLife) c.push('استعجلك بـ3 أيام فقط');
  if (o.t.noInsp) c.push('رفض أن تعاين البضاعة'); else if (!o.t.honest) c.push('المعاينة كانت ستكشف أن جودتها نحو ' + Math.round(o.t.qd * 100) + '٪ مما وصف');
  if (o.t.wOk === false) c.push('رفض أن يكتب لك مهلة ردّ');
  if (o.ri === 3 || o.ri === 4) c.push('زعيم السوق يعرف أن ' + (o.ri === 4 ? 'سمعته سيئة' : 'سجله مختلط'));
  if (o.style === 'others') c.push('ادّعى أن تجاراً آخرين يطلبونها' + (o.t.honest ? ' وكان صادقاً' : ' ولا أثر لذلك في السوق'));
  return c.join('، ');
}
const brTail = o => 'كانت القرينة: ' + brClues(o) + '.' + (o.style === 'others' && !o.t.honest ? ' «' + BR_SH.SH03 + '».' : '') + (!o.t.honest ? ' ' + BR_HADITH + '«' + BR_SH.SH04 + '»' : '');
function brLog(S, o, st, r, rev) {
  const B = brData(S); B.log.push({ d: S.day, name: o.name, type: o.type, st, honest: rev ? o.t.honest : null, r, cur: o.cur }); while (B.log.length > BROKER.logMax) B.log.shift();
  const e = B.ledger[o.name] || (B.ledger[o.name] = { ri: o.ri, seen: 1, acc: 0, rev: 0, hon: 0, net: 0, last: S.day });
  if (rev) { e.rev++; e.hon += o.t.honest ? 1 : 0; }
  if (st === 'acc') e.acc++;
  e.net += Math.round(r * brRate(S, o.cur)); e.last = S.day;
}
function brFinal(S, o, k, refund) {
  const r = brNet(o, k); brLog(S, o, 'acc', r, 1);
  learnReact(S, k > 0 ? 'brkRet' : 'brkLost', 1, k > 0 ? fmtN(refund) + ' ' + brCur(o) + '. ' + brTail(o) : 'نحو ' + fmtN(-r) + ' ' + brCur(o) + '. ' + brTail(o));
}
function brResolve(S, o) {
  const B = S.brokers;
  if (o.st === 'no') {
    brLog(S, o, 'no', 0, 1);
    if (o.t.honest) {
      const inn = [(o.t.noise === 'rush' || o.style === 'rush') ? 'استعجل لأمر عنده' : '', o.t.wOk === false ? 'اكتفى بكلمته عن الكتابة' : '', o.ri === 2 ? 'لا تعرفه' : ''].filter(Boolean).join('، ');
      learnReact(S, 'brkMissed', 1, fmtN(o.q * (o.m - o.p) - brFee(o)) + ' ' + brCur(o) + '. ' + (inn ? 'وما أخافك كان بريئاً: ' + inn : 'ولم يكن في عرضه ما يريب'));
    } else learnReact(S, 'brkDodged', 1, brTail(o));
    return;
  }
  const ret = B.ret && B.ret.o.id === o.id ? B.ret : null;
  if (o.t.honest) {
    brLog(S, o, 'acc', brNet(o, 0), 1); learnReact(S, 'brkOk', 1, 'صافيك نحو ' + fmtN(brNet(o, 0)) + ' ' + brCur(o) + ' بسعر السوق يوم العرض');
    if (ret) { B.ret = null; news(S, 'جاءت بضاعة ' + o.name + ' كما وُصفت، فلا حاجة إلى مهلة الردّ.', 'good'); }
    return;
  }
  news(S, 'تبيّن أن ' + o.q + ' ' + GD[o.g].name + ' من ' + o.name + ' جودتها نحو ' + Math.round(o.t.qd * 100) + '٪ مما وصف.' + (ret ? ' ومعك مهلة ردّ مكتوبة ' + dayAr(ret.until - S.day) + ': ارجع إلى ' + S.cities[o.city].name + ' وردّها.' : ''), 'bad');
  if (ret) ret.bad = true; else brFinal(S, o, 0);
}

/* ---------- نصوص العرض (غير شرعية، كتبها Opus في plan.md §8-أ) ---------- */
const brInspTxt = o => o.t.noInsp ? 'رفض أن تعاين البضاعة' : o.t.honest ? 'البضاعة كما وُصفت' : 'جودتها نحو ' + Math.round(o.t.qd * 100) + '٪ مما وصف';
function brBossTxt(S, o) {
  const T = ['معروف بالصدق عندنا', 'طيب السمعة، لكن قليلاً من التجار يعرفونه', 'لا أعرفه', 'سجله مختلط: صدق مرة ولم يصدق أخرى', 'سمعته سيئة عندنا'], e = S.brokers.ledger[o.name];
  return T[o.ri] + (o.style === 'others' ? '، وما يقوله عن مشترين آخرين ' + (o.t.honest ? 'صحيح' : 'لا أثر له في السوق') : '') + (e && e.rev > 0 ? '. وسجلك معه: صدق في ' + e.hon + ' من ' + e.rev : '');
}
function brokerView(S) {
  const B = BROKER.on && S && S.brokers; if (!B) return null;
  const car = mainCar(S), ledger = Object.keys(B.ledger).map(n => Object.assign({ name: n }, B.ledger[n])).sort((a, b) => b.last - a.last);
  const v = { offer: null, ret: null, ledger, tot: { offers: ledger.reduce((a, e) => a + e.seen, 0), acc: ledger.reduce((a, e) => a + e.acc, 0), net: ledger.reduce((a, e) => a + e.net, 0) } };
  const o = B.offer;
  if (o && o.st === 'open') {
    const cost = brCost(o), feeAmt = brFeeAmt(o), e = B.ledger[o.name], cn = brCur(o), left = o.until - S.day, S5 = o.seen;
    const lines = [];
    lines.push(o.q + ' ' + GD[o.g].name + ' بـ' + fmtN(o.p) + ' ' + cn + ' للوحدة (السوق ' + fmtN(o.m) + ')' + (o.style === 'full' ? ' · أرخص من السوق بـ' + brPct(o) + '٪' : '') + (brTooGood(o) ? ' · أحسن من أن يكون حقيقياً' : ''));
    if (o.type === 'unseen') lines.push('لم تَرَها: موصوفة بالصفة والكمية والسعر، في خانٍ خارج السوق');
    if (o.type === 'refer') { lines.push(BR_SH.SH01 + ' · ' + brR2(o.fee * 100) + '٪ = ' + fmtN(feeAmt) + ' ' + cn); lines.push('يدلّك على مورّد يبيع بـ' + fmtN(o.p) + ' للوحدة'); }
    const claim = ['يقول إنه معروف بالصدق', 'يقول إن قليلاً من التجار يعرفونه', 'لا تعرفه', 'لا تعرفه', 'يقول إنه معروف بالصدق'][o.ri], PE = brPersOf(o);
    lines.push(claim + ' · ' + PE.n + (o.rel === 'سبق التعامل معه' ? ' · سبق أن تعاملتَ معه: صدق في ' + (e ? e.hon : 0) + ' من ' + (e ? e.rev : 0) : o.rel === 'أوصى به زعيم' ? ' · يقول إن زعيم السوق أوصى به' : o.rel === 'قريب أحد عمّالك' ? ' · يقول إنه قريب أحد عمّالك' : ''));
    const st = { full: '', exagg: 'يقول إنك ستربح منها ' + fmtN(o.claim) + ' ' + cn, rush: 'يريد جوابك سريعاً', secret: 'لا يذكر من أين جاء بها', others: 'يقول إن تجاراً آخرين يطلبونها' }[o.style]; if (st) lines.push(st);
    lines.push(left > 0 ? 'يبقى عرضه ' + dayAr(left) : 'آخر يوم لعرضه');
    if (S5.insp && S.day >= S5.insp.d) lines.push('المعاينة: ' + brInspTxt(o));
    if (S5.ask) lines.push('سؤال الزعيم: ' + S5.ask.txt);
    if (S5.warr) lines.push('الضمان: ' + (S5.warr.ok ? 'كتب لك مهلة ردّ 7 أيام' : 'رفض أن يكتب لك مهلة ردّ'));
    const b = bossOf(S, o.city), hereBad = brHere(S, o), room = Math.floor((capOfCar(car) - loadOf(car)) / GD[o.g].w);
    S.ctxCur = o.cur; const gold = S.player.gold; S.ctxCur = 'sar';
    const offAcc = hereBad ? hereBad.msg : room < o.q ? 'لا مكان في قافلتك لـ' + o.q + ' ' + GD[o.g].name + ' (يتسع ' + Math.max(0, room) + ')' : gold + 1e-9 < cost + feeAmt ? 'رصيدك بـ' + cn + ' لا يكفي: تحتاج ' + fmtN(cost + feeAmt) : '';
    v.offer = { o, id: o.id, offAcc, name: o.name, type: o.type, typeTxt: BR_TYPE[o.type], city: S.cities[o.city].name, g: GD[o.g].name, cur: cn, cost, feeAmt, total: cost + feeAmt, inspAmt: brInspAmt(o), pct: brPct(o), tooGood: brTooGood(o), left,
      lines: lines.slice(0, 8), here: !hereBad, hereMsg: hereBad ? hereBad.msg : '', room, hasBoss: !!b, askRepeat: !!b && S.day - (B.ask[o.city] != null ? B.ask[o.city] : -99) < BROKER.askCool,
      inspDone: !!S5.insp, inspPending: !!(S5.insp && S.day < S5.insp.d), inspTxt: S5.insp ? (S.day >= S5.insp.d ? brInspTxt(o) : '') : '', askDone: !!S5.ask, askTxt: S5.ask ? S5.ask.txt : '', warrDone: !!S5.warr, warrTxt: S5.warr ? (S5.warr.ok ? 'كتب لك مهلة ردّ 7 أيام' : 'رفض أن يكتب لك مهلة ردّ') : '' };
  }
  if (B.ret && B.ret.bad) {
    const R = B.ret, k = Math.min(R.o.q, Math.floor((carById(S, R.o.car) || { cargo: {} }).cargo[R.o.g] || 0)), rc = carById(S, R.o.car);
    v.ret = { name: R.o.name, left: R.until - S.day, q: R.o.q, g: GD[R.o.g].name, k, refund: brR2(R.o.p * k), cur: brCur(R.o), here: !!rc && rc.city === R.o.city && rc.left === 0, city: S.cities[R.o.city].name };
  }
  return v;
}
const brokerChipOn = S => !!(BROKER.on && S && S.brokers && (S.brokers.offer || (S.brokers.ret && S.brokers.ret.bad) || Object.keys(S.brokers.ledger).length));
const BROKER_ACT = { brokerInspect, brokerAsk, brokerWarranty, brokerAccept, brokerDecline, brokerReturn, brokerKeep };
