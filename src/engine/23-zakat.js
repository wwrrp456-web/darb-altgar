/* ---------- الزكاة (عروض التجارة): تدريب تعليمي مع عمّ سالم ----------
   النصاب 85 غراماً من الذهب بسعر اليوم، الحول 354 يوماً (سنة هجرية)، المقدار 2.5٪.
   الوعاء = السيولة + البضاعة (القوافل والمخازن والطلبات في الطريق) + الودائع والسندات − الديون. الدكاكين والمخازن والعربات والمصانع أصول ثابتة لا زكاة فيها. */
const ZAKAT = { RATE: 0.025, HAWL: 354, NISAB_G: 85, NISAB_AG: 595 };
const zakatNew = () => ({ start: null, last: null, paid: 0, due: false, amount: 0, base: 0, defer: 0, hist: [], herdMode: 'trade', an: null, anLeft: 0 });
/* زكاة بهيمة الأنعام (جدول المختص): السائمة المقتناة للنسل والدر، لا ما يُشترى للبيع (ذاك عروض تجارة). الإبل والبقر والغنم (الضأن والمعز).
   الصغار تُضم إلى أمهاتها إن بلغ الأصل النصاب. يختار اللاعب غرض قطيعه (تجارة أو رعي ونسل). نفترض في «الرعي» أنها ترعى أكثر الحول، وكل رأس مستحَق يُحسب برأس من نوعه (لا أعمار في اللعبة). */
const AN = { camel: { name: 'الإبل', min: 5 }, cow: { name: 'البقر', min: 30 }, sheep: { name: 'الغنم', min: 40 } };
const AN_ITEM = { sheep: 'شاة', makhad: 'بنت مخاض', labun: 'بنت لبون', hiqqa: 'حِقّة', jadha: 'جَذَعة', tabi: 'تَبيع', musinna: 'مُسِنّة' };
const AN_ITEM_SP = { sheep: 'sheep', makhad: 'camel', labun: 'camel', hiqqa: 'camel', jadha: 'camel', tabi: 'cow', musinna: 'cow' };
function anCombo(n, x, y) { let best = null; for (let b = Math.floor(n / y); b >= 0; b--) { const a = Math.floor((n - y * b) / x), r = n - y * b - x * a; if (!best || r < best.r) best = { a, b, r }; } return best; }
function anDue(kind, n) {
  n = Math.floor(n); const one = (k, c) => [{ k, n: c }];
  if (kind === 'camel') {
    if (n < 5) return []; if (n < 10) return one('sheep', 1); if (n < 15) return one('sheep', 2); if (n < 20) return one('sheep', 3); if (n < 25) return one('sheep', 4);
    if (n <= 35) return one('makhad', 1); if (n <= 45) return one('labun', 1); if (n <= 60) return one('hiqqa', 1); if (n <= 75) return one('jadha', 1); if (n <= 90) return one('labun', 2); if (n <= 120) return one('hiqqa', 2);
    const c = anCombo(n, 40, 50); return [{ k: 'labun', n: c.a }, { k: 'hiqqa', n: c.b }].filter(x => x.n > 0);
  }
  if (kind === 'cow') {
    if (n < 30) return []; if (n < 40) return one('tabi', 1); if (n < 60) return one('musinna', 1);
    const c = anCombo(n, 30, 40); return [{ k: 'tabi', n: c.a }, { k: 'musinna', n: c.b }].filter(x => x.n > 0);
  }
  if (n < 40) return []; if (n <= 120) return one('sheep', 1); if (n <= 200) return one('sheep', 2); if (n <= 399) return one('sheep', 3); return one('sheep', Math.floor(n / 100));
}
const anKind = g => { const sp = spOf(g); return sp === 'camel' ? 'camel' : sp === 'cow' || sp === 'buffalo' ? 'cow' : sp === 'sheep' || sp === 'goat' ? 'sheep' : null; };
// أماكن القطعان: القطيع الماشي للقوافل ومزارع اللاعب (بضاعة الحمولة تبقى عروض تجارة دائماً)
function anHerds(S) {
  const out = [], P = S.player;
  P.caravans.forEach(c => out.push(c)); for (const k in P.props) if (P.props[k].farm) out.push(P.props[k].farm);
  return out;
}
function anAssess(S) {
  const cnt = { camel: { a: 0, y: 0 }, cow: { a: 0, y: 0 }, sheep: { a: 0, y: 0 } };
  anHerds(S).forEach(h => { for (const g in (h.herd || {})) { const k = anKind(g); if (!k) continue; cnt[k].a += h.herd[g] || 0; cnt[k].y += youngOf(h, g); } });
  const rows = []; let any = false;
  for (const k of ['camel', 'cow', 'sheep']) {
    const a = Math.floor(cnt[k].a), y = Math.floor(cnt[k].y); if (a + y < 1) continue;
    const total = a >= AN[k].min ? a + y : a, due = a >= AN[k].min ? anDue(k, total) : [];
    rows.push({ kind: k, name: AN[k].name, adults: a, young: y, n: total, min: AN[k].min, due }); if (due.length) any = true;
  }
  return { rows, any };
}
function anExcluded(S) { // قيمة قطعان الأنعام الثلاثة (بالسعر المتوسط) لتُستبعد من وعاء التجارة حين تُزكّى زكاة أنعام
  let c = 0, f = 0; const P = S.player;
  P.caravans.forEach(car => { for (const g in (car.herd || {})) if (anKind(g)) c += ((car.herd[g] || 0) + YOUNG_VAL * youngOf(car, g)) * mid(g); });
  for (const k in P.props) { const fm = P.props[k].farm; if (fm) for (const g in (fm.herd || {})) if (anKind(g)) f += ((fm.herd[g] || 0) + YOUNG_VAL * (((fm.hx || {})[g] || {}).y || 0)) * mid(g); }
  return { c, f };
}
function anPrice(S, item) { const car = mainCar(S), c = S.cities[car.city]; return unitPrice(c, AN_ITEM_SP[item]); }
function anItems(S, due) { const out = []; due.forEach(r => r.due.forEach(x => out.push({ kind: r.kind, k: x.k, label: AN_ITEM[x.k], n: x.n }))); return out; }
// أخذ رؤوس من القطعان عيناً: يُرجع عدد ما أُخذ فعلاً
function anTake(S, sp, n) {
  let took = 0;
  anHerds(S).forEach(h => { for (const g in (h.herd || {})) { if (took >= n) return; const k = anKind(g); if (!k || (sp === 'sheep' ? k !== 'sheep' : k !== sp)) continue; const t = Math.min(n - took, Math.floor(h.herd[g] || 0)); if (t > 0) { const b0 = h.herd[g]; h.herd[g] -= t; herdScale(h, g, b0); took += t; } } });
  return took;
}
function zakatBase(S) {
  const P = S.player, w = P.wallet, r = { cash: w.sar + w.usd * S.fx.usd + w.au * S.fx.gold + (w.ag || 0) * rateOf(S, 'ag') + (P.vault || 0), goods: 0, store: 0, orders: 0, deposits: 0, bonds: 0, debts: 0 };
  P.caravans.forEach(c => { r.goods += valueOf(holdings(c)); });
  for (const k in P.props) r.store += valueOf(P.props[k].store) + (P.props[k].farm ? valueOf(farmHold(P.props[k].farm)) : 0);
  (S.orders || []).forEach(o => { r.orders += o.cost || 0; });
  for (const k in P.bank.dep) r.deposits += P.bank.dep[k];
  P.bank.bonds.forEach(b => { r.bonds += b.amt; });
  P.bank.loans.forEach(l => { r.debts += l.amt; }); if (P.famDebt) r.debts += P.famDebt.left;
  r.an = anAssess(S);
  if (S.zakat && S.zakat.herdMode === 'sawm') { const ex = anExcluded(S); r.goods = Math.max(0, r.goods - ex.c); r.store = Math.max(0, r.store - ex.f); r.exHerd = Math.round(ex.c + ex.f); }
  r.base = Math.max(0, r.cash + r.goods + r.store + r.orders + r.deposits + r.bonds - r.debts);
  r.nisab = ZAKAT.NISAB_G * S.fx.gold; r.nisabAg = ZAKAT.NISAB_AG * rateOf(S, 'ag'); r.rate = ZAKAT.RATE; r.met = r.base >= r.nisab; r.amount = Math.round(r.base * ZAKAT.RATE);
  return r;
}
function zakatFinish(S) {
  const Z = S.zakat, b = zakatBase(S); Z.hist.unshift({ day: S.day, base: Z.base, due: Math.round(Z.base * ZAKAT.RATE), paid: Math.round(Z.base * ZAKAT.RATE), note: 'paid' }); if (Z.hist.length > 12) Z.hist.pop();
  if (!Z.dfr && Z.start != null && S.day - Z.start <= hawlLen(S, Z.start) + 3) achFlag(S, 'zakat_on_time'); Z.dfr = 0;
  Z.last = S.day; Z.due = false; Z.defer = 0; Z.part = false; Z.an = null; Z.anLeft = 0; Z.start = (b.met || (Z.herdMode === 'sawm' && b.an.any)) ? S.day : null; Z.paidN = (Z.paidN || 0) + 1;
  return OK('تقبّل الله منك! أخرجتَ زكاة مالك كاملة، وبدأ حول جديد');
}
function zakatAnSnap(S, b) { const Z = S.zakat; Z.an = Z.herdMode === 'sawm' && b.an.any ? b.an.rows.filter(r => r.due.length).map(r => ({ kind: r.kind, name: r.name, n: r.n, due: r.due })) : null; Z.anLeft = Z.an ? anItems(S, Z.an).reduce((t, x) => t + x.n, 0) : 0; }
function zakatDay(S) {
  const Z = S.zakat; if (!Z || !S.learn || !S.learn.char) return;
  const b = zakatBase(S);
  const anOn = Z.herdMode === 'sawm' && b.an.any;
  if (Z.start == null) { if (b.met || anOn) { Z.start = S.day; learnReact(S, 'nisab'); } return; }
  if (Z.due) { if (Z.defer && S.day >= Z.defer) learnReact(S, 'zakatLate', 7); return; }
  const age = S.day - Z.start;
  const hawl = hawlLen(S, Z.start);
  if (age >= hawl) {
    if (b.met || anOn) { Z.due = true; Z.amount = b.met ? b.amount : 0; Z.base = Math.round(b.base); Z.defer = 0; Z.part = false; zakatAnSnap(S, b); learnReact(S, 'zakatDue'); S.pause = true; }
    else { Z.hist.unshift({ day: S.day, base: Math.round(b.base), due: 0, paid: 0, note: 'below' }); if (Z.hist.length > 12) Z.hist.pop(); Z.start = null; }
  } else if (hawl - age === 30) learnReact(S, 'zakatSoon');
}

/* سمعة التاجر: خمسة أشرطة بوزن متساوٍ (0–100). في المرحلة 3 تحدد جودة مصانعه (35٪ ← 80٪) */
function reputation(S) {
  const P = S.player, L = S.learn || {}, Z = S.zakat || {}, R = repOf(P), fd = P.famDebt;
  const inst = !fd ? 60 : fd.left <= 0 ? 100 : clamp(Math.round(fd.patience == null ? 60 : fd.patience), 0, 100);
  const con = clamp(50 + 12 * R.done - 30 * R.broke, 0, 100);
  const ts = Object.values(S.bosses || {}).filter(b => b.trust).map(b => b.trust);
  const trust = ts.length ? clamp(Math.round(50 + ts.reduce((a, b) => a + b, 0) / ts.length / 2), 0, 100) : 30;
  const mast = clamp(Math.round((((L.ev && L.ev.profit) || 0) / 60) * 100), 0, 100);
  const zk = (Z.paidN || 0) + (Z.lates || 0) === 0 ? 60 : clamp(60 + 20 * (Z.paidN || 0) - 25 * (Z.lates || 0), 0, 100);
  const parts = [
    { id: 'inst', name: 'الوفاء بالأقساط', score: inst, tip: 'سدّد قسط دَين جدّك في موعده' },
    { id: 'pacts', name: 'إتمام العقود', score: con, tip: 'أتمّ عقودك ولا تفسخها' },
    { id: 'trust', name: 'ثقة الزعماء', score: trust, tip: 'أهدِ الزعماء وفاوضهم' },
    { id: 'mastery', name: 'الإتقان', score: mast, tip: 'اكسب صفقات رابحة أكثر' },
    { id: 'zakat', name: 'الوفاء بالزكاة', score: zk, tip: 'أخرج زكاتك عند حلول الحول ولا تؤجّلها' },
  ];
  const total = Math.round(parts.reduce((a, x) => a + x.score, 0) / parts.length);
  return { parts, total, quality: Math.round(35 + 45 * total / 100), weakest: parts.slice().sort((a, b) => a.score - b.score)[0] };
}

