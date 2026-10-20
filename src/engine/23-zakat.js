/* ---------- الزكاة (عروض التجارة): تدريب تعليمي مع عمّ سالم ----------
   النصاب 85 غراماً من الذهب بسعر اليوم، الحول 354 يوماً (سنة هجرية)، المقدار 2.5٪.
   الوعاء = السيولة + البضاعة (القوافل والمخازن والطلبات في الطريق) + الودائع والسندات − الديون. الدكاكين والمخازن والعربات والمصانع أصول ثابتة لا زكاة فيها. */
const ZAKAT = { RATE: 0.025, HAWL: 354, NISAB_G: 85 };
const zakatNew = () => ({ start: null, last: null, paid: 0, due: false, amount: 0, base: 0, defer: 0, hist: [] });
function zakatBase(S) {
  const P = S.player, w = P.wallet, r = { cash: w.sar + w.usd * S.fx.usd + w.au * S.fx.gold + (P.vault || 0), goods: 0, store: 0, orders: 0, deposits: 0, bonds: 0, debts: 0 };
  P.caravans.forEach(c => { r.goods += valueOf(holdings(c)); });
  for (const k in P.props) r.store += valueOf(P.props[k].store) + (P.props[k].farm ? valueOf(farmHold(P.props[k].farm)) : 0);
  (S.orders || []).forEach(o => { r.orders += o.cost || 0; });
  for (const k in P.bank.dep) r.deposits += P.bank.dep[k];
  P.bank.bonds.forEach(b => { r.bonds += b.amt; });
  P.bank.loans.forEach(l => { r.debts += l.amt; }); if (P.famDebt) r.debts += P.famDebt.left;
  r.base = Math.max(0, r.cash + r.goods + r.store + r.orders + r.deposits + r.bonds - r.debts);
  r.nisab = ZAKAT.NISAB_G * S.fx.gold; r.rate = ZAKAT.RATE; r.met = r.base >= r.nisab; r.amount = Math.round(r.base * ZAKAT.RATE);
  return r;
}
function zakatDay(S) {
  const Z = S.zakat; if (!Z || !S.learn || !S.learn.char) return;
  const b = zakatBase(S);
  if (Z.start == null) { if (b.met) { Z.start = S.day; learnReact(S, 'nisab'); } return; }
  if (Z.due) { if (Z.defer && S.day >= Z.defer) learnReact(S, 'zakatLate', 7); return; }
  const age = S.day - Z.start;
  if (age >= ZAKAT.HAWL) {
    if (b.met) { Z.due = true; Z.amount = b.amount; Z.base = Math.round(b.base); Z.defer = 0; learnReact(S, 'zakatDue'); S.pause = true; }
    else { Z.hist.unshift({ day: S.day, base: Math.round(b.base), due: 0, paid: 0, note: 'below' }); if (Z.hist.length > 12) Z.hist.pop(); Z.start = null; }
  } else if (ZAKAT.HAWL - age === 30) learnReact(S, 'zakatSoon');
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

