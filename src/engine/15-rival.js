/* ---------- التاجر المنافس المسمّى (المرحلة 5): يظهر في لعبة التعلّم فقط، يتاجر في الأسواق نفسها بعد اليوم 40 وتُقارَن ثروته بثروتك. عشوائيته معزولة (rndB) ---------- */
const RIVAL_NAMES = ['ابن زياد', 'الحاج منصور', 'أبو عدنان', 'شاهين التاجر'], RIVAL_FROM = 40;
const rivalOn = S => !!(S.learn && S.learn.char && S.rival);
function rivalNew(S) { return { name: RIVAL_NAMES[S.seed % RIVAL_NAMES.length], gold: 3000, city: S.order[Math.floor(S.seed / 8) % S.order.length], from: null, dest: null, left: 0, total: 0, cargo: {}, cap: 150, trips: 0, passed: false, ahead: -999, rep: 0, hist: [] }; }
const rivalNW = S => (S.rival ? Math.round(S.rival.gold + valueOf(S.rival.cargo)) : 0);
function rivalDay(S) {
  if (!(S.learn && S.learn.char)) return; if (!S.rival) S.rival = rivalNew(S); const a = S.rival; if (S.day < RIVAL_FROM) return;
  const k = diffOf(S), up = Math.min(a.gold, 5 + a.gold * 0.012); sink(S, 'agentUpkeep', up); a.gold -= up;
  if (a.left > 0) {
    a.left--;
    if (a.left === 0) {
      const c = S.cities[a.dest]; a.city = a.dest; a.dest = null;
      const cu = Math.min(a.gold, customsOf(S, a.from, a.city, a.cargo)); if (cu > 0) { a.gold -= cu; sink(S, 'customs', cu); }
      if (rndB(S) < S.risk[riskKey(a.from, a.city)] * 0.4) for (const g in a.cargo) a.cargo[g] -= Math.floor(a.cargo[g] * 0.3);
      for (const g of GIDS) if ((a.cargo[g] || 0) >= 1) sellUnits(S, a, c, g, a.cargo[g], a.cargo, false, 1);
      a.trips++;
    }
  } else {
    const c = S.cities[a.city]; if (a.gold < 60 && !Object.keys(a.cargo).some(g => a.cargo[g] >= 1)) { a.gold += 500; fauc(S, 'bailout', 500); }
    let best = null;
    for (const g of GIDS) {
      if (GD[g].sp || GD[g].fresh || !sells(c, g)) continue; const pb = unitPrice(c, g) * 1.01;
      for (const d of S.order) {
        if (d === a.city) continue; const dc = S.cities[d], cus = dc.country === c.country ? 0 : CD[dc.country].customs;
        const ps = unitPrice(dc, g) * (1 - dc.tax - cus) * (0.95 + rndB(S) * 0.1), days = Math.max(1, Math.ceil(dist(S, a.city, d) / SPEED));
        const fu = (GD[g].fod || 0) * days * unitPrice(c, 'wheat'), m = (ps - pb - fu) / days / pb; if (!best || m > best.m) best = { g, d, m, days, fu };
      }
    }
    if (best && best.m > 0.012) {
      const G = GD[best.g], qty = Math.min(a.cap * (0.8 + 0.2 * k) / G.w, a.gold * 0.9 / unitPrice(c, best.g), c.stock[best.g] * 0.3);
      const res = buyUnits(S, a, c, best.g, qty, a.cap, a.cargo, false);
      if (res.n > 0) { const fc = Math.min(a.gold, res.n * best.fu); a.gold -= fc; sink(S, 'provisions', fc); a.from = a.city; a.dest = best.d; a.left = best.days; a.total = best.days; }
    }
    if (a.gold > 9000 && a.cap < 400) { a.gold -= 2000; sink(S, 'investment', 2000); a.cap += 50; }
  }
  if (S.day % 30 === 0) { a.hist.push(rivalNW(S)); if (a.hist.length > 20) a.hist.shift(); }
  const mine = netWorth(S), his = rivalNW(S);
  if (!a.passed && mine > his * 1.05 && S.day >= RIVAL_FROM + 20) { a.passed = true; news(S, 'تفوّقتَ في الثروة على ' + a.name + '! لكن السوق يدور وهو لن يسكت.', 'good'); learnReact(S, 'rivalPass'); }
  else if (a.passed && his > mine * 1.1) { a.passed = false; news(S, a.name + ' عاد إلى الصدارة بثروة ' + fmtN(his) + ' مقابل ' + fmtN(mine) + '.', 'bad'); }
  if (his > mine * 1.5 && S.day - a.ahead > 60) { a.ahead = S.day; news(S, a.name + ' يتقدمك بوضوح (' + fmtN(his) + ' مقابل ثروتك ' + fmtN(mine) + '). راجع صفقاتك.', 'bad'); learnReact(S, 'rivalAhead'); }
}
