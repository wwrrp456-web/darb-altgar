/* ---------- أوامر اللاعب ---------- */
const OK = msg => ({ ok: true, msg }), NO = msg => ({ ok: false, msg });
const mainCar = S => S.player.caravans[0];
const carById = (S, id) => S.player.caravans.find(c => c.id === id);
function ensureProps(S, city) { return S.player.props[city] || (S.player.props[city] = { shops: [], whs: 0, store: {}, basis: {}, today: 0 }); }
/* ---------- الوكيل (الطور 3): شراء من أي مدينة دون سفر، تصل البضاعة إلى مخزن اللاعب ---------- */
const AGENT_FEE = 0.08, AGENT_PHASE = 3;
function agentDest(S, city) {
  const P = S.player, car = mainCar(S), here = car.left > 0 ? car.dest : car.city;
  const cands = Object.keys(P.props).filter(id => storeCap(S, id) > 0);
  if (!cands.length) return null;
  if (cands.includes(here)) return here;
  return cands.sort((a, b) => dist(S, here, a) - dist(S, here, b))[0];
}
function agentQuote(S, city, g, qty) {
  const c = S.cities[city], P = S.player;
  if (S.phase < AGENT_PHASE) return { ok: false, why: 'phase', msg: 'الوكيل يُفتح في الطور ' + AGENT_PHASE + ' (صاحب مصانع).' };
  if (!sells(c, g)) return { ok: false, why: 'unsold', msg: 'لا تُباع هذه السلعة في ' + c.name };
  const dest = agentDest(S, city); if (!dest) return { ok: false, why: 'nostore', msg: 'تحتاج مخزناً في إحدى مدنك لتصل إليه البضاعة.' };
  const w = GD[g].w, room = storeRoom(S, dest), cap = Math.floor(room / w), fee = AGENT_FEE * perkMul(S, 'agentFee');
  const q = quoteBuy(S, city, g, Math.min(Math.floor(qty), cap), P.gold / (1 + fee), true), days = Math.max(1, tripDays(S, mainCar(S), city, dest));
  return { ok: q.n > 0, why: q.n > 0 ? '' : cap < 1 ? 'room' : 'gold', msg: q.n > 0 ? '' : cap < 1 ? 'مخزنك في ' + S.cities[dest].name + ' ممتلئ' : 'لا يكفي رصيدك أو المخزون', n: q.n, cost: q.cost, fee: q.cost * fee, total: q.cost * (1 + fee), feeRate: fee, days, dest, cap };
}
function ordersDay(S) {
  S.orders = S.orders || []; const keep = [];
  S.orders.forEach(o => {
    if (o.day > S.day) { keep.push(o); return; }
    const pr = ensureProps(S, o.to), n = Math.min(o.n, Math.floor(storeRoom(S, o.to) / GD[o.g].w)), part = n / o.n;
    if (n > 0) { pr.store[o.g] = (pr.store[o.g] || 0) + n; pr.basis = pr.basis || {}; addBasis(pr.basis, o.g, n, o.cost * part); }
    if (n < o.n) { S.ctxCur = 'sar'; S.player.gold += o.cost * (1 - part); }
    news(S, 'وصل طلب وكيلك: ' + n + ' ' + GD[o.g].name + ' إلى مخزنك في ' + S.cities[o.to].name + (n < o.n ? ' (امتلأ المخزن فأُعيد ثمن الباقي)' : ''), 'good');
  });
  S.orders = keep;
}

