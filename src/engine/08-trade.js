/* ---------- أساس التكلفة وسجل الصفقات ---------- */
// الجودة تسافر مع سجل التكلفة: w = مجموع (الكمية × الجودة). بلا w فالجودة 1 («أصلية»)
function addBasis(b, g, q, c, ql) { if (q <= 0) return; const x = b[g] || (b[g] = { q: 0, c: 0 }); const w0 = x.w === undefined ? x.q : x.w; x.q += q; x.c += c; if ((ql !== undefined && ql !== 1) || x.w !== undefined) x.w = w0 + q * (ql === undefined ? 1 : ql); }
function takeBasis(b, g, q) { const x = b[g]; if (!x || x.q <= 0) return 0; const t = Math.min(q, x.q), cost = x.c * t / x.q; if (x.w !== undefined) x.w -= x.w * t / x.q; x.q -= t; x.c -= cost; if (x.q < 0.01) delete b[g]; return cost; }
const qualOf = (b, g) => (b && b[g] && b[g].q > 0 && b[g].w !== undefined ? clamp(b[g].w / b[g].q, 0.05, 1) : 1);
const avgCost = (b, g) => (b && b[g] && b[g].q > 0 ? b[g].c / b[g].q : null);
function syncBasis(car) { for (const g in car.basis) { const have = (car.cargo[g] || 0) + ((car.herd || {})[g] || 0); if (have < 0.5) delete car.basis[g]; else if (car.basis[g].q > have) car.basis[g].q = have; } }
function logTrade(S, city, g, q, side, net, pl) {
  const T = S.player.trades; T.unshift({ day: S.day, city, g, q, side, net, pl }); if (T.length > 50) T.pop();
  if (side === 'sell' || side === 'shop') { if (pl >= 0) S.player.led.inc.realized = (S.player.led.inc.realized || 0) + pl; else S.player.led.exp.realizedLoss = (S.player.led.exp.realizedLoss || 0) - pl; }
}
const ctxFor = (S, city) => { S.ctxCur = curOf(S.cities[city].country); };

/* ---------- تجارة ---------- */
function taxRate(S, c, isPlayer) {
  let x = c.tax + (isPlayer ? 0.05 * clamp(netWorth(S) / 200000, 0, 1) : 0);
  if (isPlayer && bossActive(S) && bossOf(S, c.id) && bossOf(S, c.id).ruler === 'boss' && !pactIn(S, c.id)) x += 0.02;
  return x;
}
function buyUnits(S, acct, c, g, qty, room, dst, isPlayer, anyGood, pm) {
  const G = GD[g];
  if (isPlayer && !anyGood && !sells(c, g)) return { n: 0, cost: 0, unsold: true };
  qty = Math.min(Math.floor(qty), Math.floor(c.stock[g]), Math.floor(room / G.w));
  const qo = isPlayer && quotaOn(S, c, g), ql = qo ? Math.floor(quotaLeft(S, c)) : Infinity, capped = qty > ql;
  if (qo) qty = Math.min(qty, ql);
  let cost = 0, n = 0;
  const bm = (isPlayer ? buyMul(S, c, g) : 1) * (pm || 1), vm = isPlayer ? vouchMul(S, c.id, g, 'buy') : 1, vl = isPlayer ? vouchLeft(S, c.id, g, 'buy') : 0;
  const budget = isPlayer && acct === S.player ? buyBudget(S, c.id) : acct.gold; // يدوي: محفظة عملة السوق فقط
  for (; n < qty; n++) {
    const p = unitPrice(c, g) * bm * (n < vl ? vm : 1);
    if (cost + p > budget) break;
    cost += p; c.stock[g] -= 1;
  }
  if (n > 0) {
    acct.gold -= cost; dst[g] = (dst[g] || 0) + n;
    if (isPlayer) S.player.led.exp.purchases = (S.player.led.exp.purchases || 0) + cost;
    if (qo && ql !== Infinity) S.player.quota[c.id].v -= n;
    if (isPlayer && vl) vouchUse(S, c.id, g, 'buy', n);
  }
  return { n, cost, quota: capped && n >= qty };
}
function sellUnits(S, acct, c, g, qty, src, isPlayer, haggle) {
  qty = Math.min(Math.floor(qty), Math.floor(src[g] || 0));
  const tr = taxRate(S, c, isPlayer);
  let gross = 0, n = 0; const vm = isPlayer ? vouchMul(S, c.id, g, 'sell') : 1, vl = isPlayer ? vouchLeft(S, c.id, g, 'sell') : 0;
  for (; n < qty; n++) {
    gross += unitPrice(c, g) * (haggle || 1) * (n < vl ? vm : 1);
    c.stock[g] = Math.min(c.stock[g] + 1, capG(c, g) * 1.2);
  }
  const tax = gross * tr, net = gross - tax;
  if (n > 0) {
    src[g] -= n; acct.gold += net; sink(S, 'tax', tax); if (isPlayer && vl) vouchUse(S, c.id, g, 'sell', n);
    if (isPlayer) {
      S.player.led.inc.sales = (S.player.led.inc.sales || 0) + gross;
      S.player.led.exp.tax = (S.player.led.exp.tax || 0) + tax;
      const bsx = bossOf(S, c.id); if (bsx) bsx.dsales += gross;
      if (rulerMine(S, c)) { const gv = tax * 0.2; S.player.gold += gv; S.player.led.inc.governor = (S.player.led.inc.governor || 0) + gv; fauc(S, 'governor', gv); }
    }
  }
  return { n, net, tax };
}

