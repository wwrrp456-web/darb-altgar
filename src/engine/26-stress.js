/* ---------- اختبار ضغط ---------- */
function botMain(S) {
  const car = mainCar(S), P = S.player; if (car.left > 0) return;
  const c = S.cities[car.city]; ctxFor(S, car.city);
  for (const g of GIDS) if (car.cargo[g] >= 1) sellUnits(S, P, c, g, car.cargo[g], car.cargo, true, 1);
  let best = null; const wheat = unitPrice(c, 'wheat');
  for (const g of GIDS) for (const d of S.order) {
    if (d === car.city || !sells(c, g) || GD[g].sp) continue; // اللاعب الآلي معيار الاقتصاد الأساسي: لا يتاجر في أصناف المواشي الخاصة
    const dc = S.cities[d], days = tripDays(S, car, car.city, d), cus = dc.country === c.country ? 0 : CD[dc.country].customs;
    const pb = unitPrice(c, g) * 1.02, ps = climateSaleGross(S, 'trade', d, unitPrice(dc, g), dc.tax + cus, pb) * (1 - dc.tax - cus);
    const prov = supplyNeed(car, days) * wheat, w = GD[g].w, fu = (GD[g].fod || 0) * days * wheat;
    const q = Math.floor(Math.min((capOfCar(car) - loadOf(car)) / w, Math.max(0, P.gold - prov - 50) / (pb + fu), c.stock[g] * 0.5));
    const m = (q * (ps - pb - fu) - prov) / days;
    if (q >= 1 && (!best || m > best.m)) best = { g, d, m, fu, q };
  }
  if (P.gold < 100 && !Object.keys(car.cargo).some(g => car.cargo[g] >= 1)) { A.work(S); return; }
  if (best && best.m > 0) { const room = capOfCar(car) - loadOf(car), b = { gold: Math.max(0, P.gold - 150 - best.q * best.fu) }; const r = buyUnits(S, b, c, best.g, room / GD[best.g].w, room, car.cargo, true); P.gold -= r.cost; startTrip(S, car, best.d); }
  else { const o = S.order.filter(x => x !== car.city); startTrip(S, car, o[Math.floor(rnd(S) * o.length)]); }
}
function botBuild(S) {
  const P = S.player;
  if (S.phase >= 2 && P.caravans.length < 3 && P.gold > 4500) { A.hireCaptain(S); const car = P.caravans[P.caravans.length - 1]; car.route = { a: 'jeddah', b: 'riyadh', buyA: 'coffee', buyB: 'dates' }; car.carts = 2; }
  if (S.phase >= 2 && !shopsOf(S, 'riyadh').length && P.gold > 6000) { A.buildShop(S, 'riyadh'); const sh = shopsOf(S, 'riyadh')[0]; if (sh) { A.shopSetItem(S, 'riyadh', sh.id, 'wheat', 1.05); A.shopSetItem(S, 'riyadh', sh.id, 'dates', 1.1); } }
  if (S.phase >= 2 && shopsOf(S, 'riyadh').length && shopsOf(S, 'riyadh').length < 3 && P.gold > 9000) A.buildShop(S, 'riyadh');
  if (S.phase >= 2 && whsOf(S, 'riyadh') < shopsOf(S, 'riyadh').length && P.gold > 5000) A.buildWarehouse(S, 'riyadh');
  if (S.phase >= 2 && shopsOf(S, 'riyadh').length && S.day % 5 === 0) A.hireFill(S, 'riyadh');
  if (S.phase >= 3 && shopsOf(S, 'riyadh').length && !P.factories.length && P.gold > 8000) A.buildFactory(S, 'riyadh', 'perfume');
  if (S.phase >= 4 && P.gold > 30000) A.invest(S, 'riyadh', P.gold * 0.3);
}
function stressTest(opt) {
  opt = opt || {}; const seeds = opt.seeds || 12, days = opt.days || 100, bot = opt.bot !== false;
  const out = { seeds, days, bot, nan: 0, minRatio: 9, maxRatio: 0, floor: 0, ceil: 0, cellDays: 0, agentGold: [], playerNW: [], bailouts: [], pop: [0, 0, 0, 0], food: [], sinks: {}, fauc: {}, shopRev: [], countryFood: {} };
  for (let s = 1; s <= seeds; s++) {
    const S = newGame(s * 7919);
    for (let d = 0; d < days; d++) {
      if (bot) { botMain(S); botBuild(S); }
      tick(S);
      for (const id of S.order) { const c = S.cities[id]; for (const g of GIDS) {
        const r = ratio(c, g); out.cellDays++;
        if (!isFinite(r) || isNaN(c.stock[g])) out.nan++;
        out.minRatio = Math.min(out.minRatio, r); out.maxRatio = Math.max(out.maxRatio, r);
        if (c.stock[g] <= 0.5) out.floor++; if (c.stock[g] >= capG(c, g) * 1.19) out.ceil++;
      } }
    }
    out.agentGold.push(S.agents.reduce((a, x) => a + x.gold, 0) / S.agents.length);
    out.playerNW.push(Math.round(netWorth(S)));
    out.bailouts.push(S.stats.bailouts || 0);
    out.shopRev.push(Math.round(S.player.led.inc.shops || 0));
    let fs = 0; for (const id of S.order) { const c = S.cities[id]; c.pop.forEach((v, i) => out.pop[i] += v / seeds); fs += c.sat.food; out.countryFood[c.country] = (out.countryFood[c.country] || 0) + c.sat.food / seeds / S.order.filter(x => S.cities[x].country === c.country).length; }
    out.food.push(+(fs / S.order.length).toFixed(2));
    for (const k in S.stats.sink) out.sinks[k] = (out.sinks[k] || 0) + S.stats.sink[k] / seeds;
    for (const k in S.stats.fauc) out.fauc[k] = (out.fauc[k] || 0) + S.stats.fauc[k] / seeds;
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  out.summary = { avgAgentGold: Math.round(avg(out.agentGold)), avgPlayerNW: Math.round(avg(out.playerNW)), minPlayerNW: Math.min(...out.playerNW), maxPlayerNW: Math.max(...out.playerNW), avgFoodSat: +avg(out.food).toFixed(2), floorPct: +(100 * out.floor / out.cellDays).toFixed(2), ceilPct: +(100 * out.ceil / out.cellDays).toFixed(2), avgBailouts: +avg(out.bailouts).toFixed(1), avgShopRevenue: Math.round(avg(out.shopRev)) };
  return out;
}

