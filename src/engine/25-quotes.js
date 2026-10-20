/* ---------- عروض وتسعير تقديري (لا تغيّر الحالة) ---------- */
function quoteBuy(S, city, g, qty, budget, anyGood) {
  const c = S.cities[city]; let st = c.stock[g], cost = 0, n = 0, last = 0; qty = Math.min(Math.floor(qty), Math.floor(st));
  if (!anyGood && (!sells(c, g) || !breedOpen(S, g))) qty = 0;
  if (quotaOn(S, c, g)) qty = Math.min(qty, Math.floor(quotaLeft(S, c)));
  const bm = buyMul(S, c, g), vm = vouchMul(S, city, g, 'buy'), vl = vouchLeft(S, city, g, 'buy');
  for (; n < qty; n++) { const p = priceAt(c, g, st) * bm * (n < vl ? vm : 1); if (budget != null && cost + p > budget) break; cost += p; st -= 1; last = p; }
  return { n, cost, avg: n ? cost / n : 0, last, first: n ? priceAt(c, g, c.stock[g]) * bm : 0 };
}
function quoteSell(S, city, g, qty, haggle, tr) {
  const c = S.cities[city]; let st = c.stock[g], gross = 0, n = 0; qty = Math.floor(qty); if (tr == null) tr = taxRate(S, c, true);
  const vm = vouchMul(S, city, g, 'sell'), vl = vouchLeft(S, city, g, 'sell');
  for (; n < qty; n++) { gross += priceAt(c, g, st) * (haggle || 1) * (n < vl ? vm : 1); st = Math.min(st + 1, capG(c, g) * 1.2); }
  const tax = gross * tr; return { n, gross, tax, net: gross - tax, avg: n ? (gross - tax) / n : 0 };
}
const liveCity = (S, id) => hasPresence(S, id) || mainCar(S).city === id && mainCar(S).left === 0;
// أين أبيع هذه السلعة وكم أربح؟ تقدير بمعلومات اللاعب (سعر معروف + ميل الانزلاق العام)
function sellOptions(S, fromCity, g, qty, unitCost, car) {
  car = car || mainCar(S); qty = Math.max(1, Math.floor(qty)); const G = GD[g], P = S.player, fc = S.cities[fromCity];
  const wheat = unitPrice(fc, 'wheat'), tr0 = taxRate(S, fc, true), out = [];
  S.order.forEach(id => {
    if (id === fromCity) return;
    const c = S.cities[id], live = liveCity(S, id), k = P.known[id], p0 = live ? unitPrice(c, g) : k.p[g], age = live ? 0 : S.day - k.day;
    const slope = (G.pmax - G.pmin) * G.cult[c.country] * c.idx[g] / capG(c, g);
    const avg = Math.max(G.pmin * 0.4, p0 - slope * (qty - 1) / 2), gross = avg * qty * qualOf(car.basis, g), tr = taxRate(S, c, true), tax = gross * tr;
    const cuRate = c.country === fc.country ? 0 : CD[c.country].customs, customs = cuRate * qty * (unitCost > 0 ? unitCost : p0);
    const days = tripDays(S, car, fromCity, id), prov = (supplyNeed(car, days) + (GD[g].fod ? Math.ceil(qty * GD[g].fod * days) : 0)) * wheat, risk = S.risk[riskKey(fromCity, id)];
    const net = gross - tax - customs, profit = net - unitCost * qty - prov;
    out.push({ city: id, country: c.country, cur: curOf(c.country), price: p0, age, days, risk, tax, customs, prov, net, profit, perUnit: profit / qty, live });
  });
  return out.sort((a, b) => b.profit - a.profit);
}
function storeSummary(S) {
  const rows = []; let cap = 0, load = 0;
  for (const city in S.player.props) { const c = E_cap(S, city), l = storeLoad(S, city); if (c <= 0) continue; rows.push({ city, cap: c, load: l, shops: shopsOf(S, city).length, whs: whsOf(S, city) }); cap += c; load += l; }
  return { rows, cap, load, free: cap - load };
}
const E_cap = (S, city) => storeCap(S, city);
// ما في هذا السوق، وما أستطيع أخذه، وهل تكفي القافلة ومخازني
function marketInfo(S, city, carId) {
  const car = carById(S, carId || 1) || mainCar(S), c = S.cities[city], P = S.player, gold = P.gold;
  const carRoom = capOfCar(car) - loadOf(car), storeFree = storeRoom(S, city), hasStore = hasPresence(S, city);
  const goods = GIDS.map(g => {
    const G = GD[g], sold = sells(c, g), stock = sold ? Math.floor(c.stock[g]) : 0, price = unitPrice(c, g);
    const afford = quoteBuy(S, city, g, stock, gold).n, carU = Math.floor(carRoom / G.w), storeU = hasStore ? Math.floor(storeFree / G.w) : 0;
    const wanted = Math.min(stock, afford), canCar = Math.min(wanted, carU), canStore = Math.min(wanted, storeU);
    const qo = sold && quotaOn(S, c, g), ql = qo ? Math.floor(quotaLeft(S, c)) : Infinity, qpd = qo ? quotaPerDay(S, c) : Infinity;
    const limit = wanted <= 0 ? (stock < 1 ? 'stock' : ql < 1 ? 'quota' : 'gold') : canCar < wanted ? 'room' : (qo && ql < stock && afford <= ql) ? 'quota' : stock <= afford ? 'stock' : 'gold';
    const fitsCar = carU >= wanted && wanted > 0, fitsStore = hasStore && storeU >= wanted && wanted > 0;
    return { g, sold, stock, price, ratio: price / refPrice(c, g), afford, wanted, canCar, canStore, carU, storeU, limit, quota: qo && ql !== Infinity ? { left: ql, perDay: qpd, cap: qpd * QUOTA_DAYS } : null, fitsCar, fitsStore, fits: fitsCar && fitsStore ? 'both' : fitsCar ? 'car' : fitsStore ? 'store' : 'none', have: Math.floor(car.cargo[g] || 0), avg: avgCost(car.basis, g) };
  });
  const soldGoods = goods.filter(x => x.sold), missing = soldGoods.filter(x => x.stock < 1).map(x => x.g), ss = storeSummary(S);
  return { goods, present: soldGoods.length - missing.length, total: soldGoods.length, missing, carRoom, carCap: capOfCar(car), carLoad: loadOf(car), store: { has: hasStore, cap: storeCap(S, city), load: storeLoad(S, city), free: storeFree }, all: ss };
}

