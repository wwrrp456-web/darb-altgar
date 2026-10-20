/* ---------- الأسعار ---------- */
// علاوة المسافة: السلعة غير الخام (والقمح خارجها) تغلو في المدينة التي لا تنتجها بقدر بُعدها عن أقرب مدينة تنتجها، وترخص حيث تُنتَج
const PREM_MAX = 0.15, PREM_D = 650, PULL_FAR = 0.02;
const PREM = {}; CITY_DEFS.forEach(d => {
  PREM[d.id] = {};
  GOODS.forEach(G => {
    if (G.tier === 'raw' || G.id === 'wheat' || d.makes.includes(G.id)) { PREM[d.id][G.id] = 1; return; }
    let best = Infinity; CITY_DEFS.forEach(m => { if (m.makes.includes(G.id)) best = Math.min(best, Math.hypot(m.x - d.x, m.y - d.y)); });
    PREM[d.id][G.id] = 1 + PREM_MAX * (isFinite(best) ? Math.min(1, best / PREM_D) : 1);
  });
});
const scarcity = (c, g) => (PREM[c.id] && PREM[c.id][g]) || 1;
const isOwn = (c, g) => GD[g].tier === 'raw' || g === 'wheat' || c.makes.includes(g);
const refPrice = (c, g) => mid(g) * GD[g].cult[c.country] * scarcity(c, g);
function evMul(c, G) {
  const e = c.ev; if (!e) return 1;
  switch (e.k) {
    case 'boom': return 1.12;
    case 'bust': return 0.78;
    case 'plague': return G.id === 'wheat' ? 1.7 : 0.95;
    case 'festival': return G.lux ? 1.4 : 1;
    case 'war': return G.id === 'tools' ? 1.6 : G.id === 'iron' ? 1.3 : 1;
  }
  return 1;
}
const unitPrice = (c, g) => priceAt(c, g, c.stock[g]);
function priceAt(c, g, stock) {
  const G = GD[g], r = clamp(stock / capG(c, g), 0, 1);
  let p = G.pmax - (G.pmax - G.pmin) * r;
  p *= G.cult[c.country] * scarcity(c, g) * c.idx[g] * evMul(c, G);
  return clamp(p, G.pmin * 0.4, G.pmax * 3);
}
const ratio = (c, g) => unitPrice(c, g) / refPrice(c, g);

