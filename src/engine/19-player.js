/* ---------- اللاعب ---------- */
function shopsDay(S) {
  const P = S.player;
  for (const city in P.props) {
    const pr = P.props[city], c = S.cities[city]; if (!c) continue;
    ctxFor(S, city); pr.basis = pr.basis || {};
    const ns = pr.shops.length; pr.today = 0; const Lx = P.led.exp, c0 = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0); let todayPl = 0; const rent0 = Lx.rent || 0, rentBefore = Object.fromEntries(pr.shops.map(sh => [sh.id, sh.rentPaid || 0])), shopNets = {};
    if (pr.farm) farmDay(S, city, pr, c);
    if (pr.butcher) butcherDay(S, city, pr, c);
    if (!ns && !pr.whs) continue;
    { const no = ownShops(pr); pPay(S, 'upkeep', no * 10 * (1 + 0.08 * (ns - 1)) + pr.whs * 6, true); }
    rentDay(S, city, pr, c);
    staffDay(S, city, pr, c); const sf = sellFactor(S, city);
    if (ns && sf <= 0) learnReact(S, 'noSeller', 15);
    // تعبئة آلية من السوق عند الرخص
    for (const sh of pr.shops) for (const it of sh.items) {
      if (!it.auto || (pr.store[it.g] || 0) >= it.target) continue;
      if (ratio(c, it.g) >= it.buyBelow) continue;
      const room = storeRoom(S, city), budget = { gold: P.gold * 0.5 };
      const res = buyUnits(S, budget, c, it.g, Math.min(25, it.target - (pr.store[it.g] || 0)), room, pr.store, true, true);
      P.gold -= res.cost; addBasis(pr.basis, it.g, res.n, res.cost);
    }
    // البيع للسكان
    const cnt = {};
    for (const sh of pr.shops) for (const it of sh.items) cnt[it.g] = (cnt[it.g] || 0) + 1;
    const tr = taxRate(S, c, true);
    for (const sh of pr.shops) for (const it of sh.items) {
      const g = it.g, n = cnt[g], mp = unitPrice(c, g), qm = qualOf(pr.basis, g), price = it.price * refPrice(c, g) * qm;
      const share = Math.min(0.7, 0.3 * Math.pow(n, 0.8)) / n;
      const f = shopF(c, g, price, mp, shUp(sh, 'sign'));
      const shopPact = bossActive(S) ? pactIn(S, city, 'shop') : null;
      const units = Math.min(pr.store[g] || 0, c.dem[g] * share * f * SHOP_DEMAND * Math.pow(shopProsper(c), 0.7) * (shopPact ? 1.4 : 1) * (1 + 0.06 * shUp(sh, 'awning')) * sf);
      it.lastSold = units;
      if (units <= 0) continue;
      const gross = units * price, tax = gross * tr, cost0 = takeBasis(pr.basis, g, units);
      const beforeAway = P.led.exp.awayYield || 0;
      logTrade(S, city, g, units, 'shop', gross - tax, gross - tax - cost0 - (S.awaySim && shopPact ? gross * shopPact.share : 0));
      const awayCut = (P.led.exp.awayYield || 0) - beforeAway;
      pr.store[g] -= units; c.stock[g] = Math.min(c.stock[g] + units, capG(c, g) * 1.2);
      const cut = shopPact ? gross * shopPact.share : 0;
      P.gold += gross - tax - cut; sink(S, 'tax', tax); if (cut) { sink(S, 'pactShare', cut); P.led.exp.pactShare = (P.led.exp.pactShare || 0) + cut; }
      { const bsx = bossOf(S, city); if (bsx) bsx.dsales += gross; }
      P.led.inc.shops = (P.led.inc.shops || 0) + gross; P.led.exp.tax = (P.led.exp.tax || 0) + tax;
      it.sold = (it.sold || 0) + units; it.revenue = (it.revenue || 0) + gross - tax - cut; pr.today += gross - tax - cut - awayCut; todayPl += gross - tax - cut - cost0 - awayCut; shopNets[sh.id] = (shopNets[sh.id] || 0) + gross - tax - cut - cost0 - awayCut;
      if (rulerMine(S, c)) { const gv = tax * 0.2; P.gold += gv; P.led.inc.governor = (P.led.inc.governor || 0) + gv; fauc(S, 'governor', gv); }
    }
    if ((S.life && S.life.salemWaqf) || (S.legacy && S.legacy.waqf && S.legacy.waqf.type === 'shop')) {
      const shared = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) - c0 - ((Lx.rent || 0) - rent0);
      for (const sh of pr.shops) recordShopNet(S, city, sh, (shopNets[sh.id] || 0) - shared / Math.max(1, pr.shops.length) - ((sh.rentPaid || 0) - (rentBefore[sh.id] || 0)));
    }
    if (ns) { pr.hist = pr.hist || []; pr.hist.push({ d: S.day, rev: pr.today, net: todayPl - ((Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) - c0) }); if (pr.hist.length > 30) pr.hist.shift(); if (pr.today > 0 && S.learn && S.learn.ev && !S.learn.ev.shopSold) S.learn.ev.shopSold = 1; }
  }
}
