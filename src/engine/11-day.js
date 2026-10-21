/* ---------- يوم واحد ---------- */
function fxDay(S) {
  const f = S.fx; let war = 0, boom = 0;
  for (const id of S.order) { const e = S.cities[id].ev; if (e && e.k === 'war') war++; if (e && e.k === 'boom') boom++; }
  f.usd = clamp(f.usd + 0.05 * (FX0.usd - f.usd) + (rnd(S) - 0.5) * 0.03, 3.5, 4.0);
  f.gold = clamp(f.gold + 0.02 * (FX0.gold - f.gold) + f.gold * ((rnd(S) - 0.5) * 0.024 + 0.0006 * war - 0.0003 * boom), 180, 480);
  f.silver = +silverAt(f.gold, S.day).toFixed(3); (f.hs = f.hs || []).push(f.silver); if (f.hs.length > 60) f.hs.shift();
  f.hu.push(+f.usd.toFixed(3)); f.hg.push(+f.gold.toFixed(1)); if (f.hu.length > 60) f.hu.shift(); if (f.hg.length > 60) f.hg.shift();
}
function tick(S) {
  S.day++; S.pause = false; S.ctxCur = 'sar'; fxDay(S);
  if (S.road && S.road.day < S.day) roadAuto(S);
  shockDay(S); seasonDay(S); eyesDay(S);
  for (const id of S.order) cityDay(S, S.cities[id]);
  for (const sh of (S.shocks || [])) { const K = SHOCKS[sh.k]; if (sh.st === 'on' && K && K.day) K.day(S, sh); }
  agentsDay(S); rivalDay(S);
  playerDay(S);
  ordersDay(S);
  debtDay(S); defectDay(S); babEventDay(S); freedomDay(S); learnCheck(S); zakatDay(S); advisorDay(S); achDay(S); yearDay(S); calDay(S); cardDay(S);
  const nw = netWorth(S);
  for (let ph = 2; ph <= 4; ph++) if (S.phase < ph && nw >= PHASE_AT[ph - 1]) {
    S.phase = ph; learnReact(S, 'phase' + ph); news(S, 'فُتح الطور ' + ph + ': ' + ['', '', 'الدكاكين والأسطول', 'التكامل الصناعي', 'الإمبراطورية المالية'][ph - 1] + '! لا شيء ممّا بنيتَه يُصادَر.', 'good'); S.pause = true;
  }
  S.hist.nw.push(Math.round(nw)); if (S.hist.nw.length > 150) S.hist.nw.shift();
  for (const id of S.order) {
    const c = S.cities[id], h = S.hist.px[id] || (S.hist.px[id] = {});
    GIDS.forEach(g => { const a = h[g] || (h[g] = []); a.push(+unitPrice(c, g).toFixed(1)); if (a.length > 40) a.shift(); });
  }
  const live = Object.keys(S.player.props).filter(k => hasPresence(S, k)); if (live.length) snapshotKnown(S, live);
  S.ctxCur = 'sar';
}

function cityDay(S, c) {
  GIDS.forEach(g => { c.idx[g] = clamp(c.idx[g] + 0.08 * (1 - c.idx[g]) + (rndG(S, g) - 0.5) * 0.05, 0.8, 1.25); });
  if (c.ev) { c.ev.left--; if (c.ev.left <= 0) c.ev = null; }
  else if (rnd(S) < 0.012) {
    const k = ['boom', 'bust', 'plague', 'festival', 'war'][Math.floor(rnd(S) * 5)];
    c.ev = { k, left: { boom: 20, bust: 15, plague: 12, festival: 8, war: 25 }[k] };
    news(S, ({ boom: 'ازدهار في ', bust: 'كساد في ', plague: 'وباء في ', festival: 'مهرجان في ', war: 'حصار وحرب قرب ' })[k] + c.name + ' (' + CD[c.country].name + ')', k === 'boom' || k === 'festival' ? 'good' : 'bad');
  }
  const pt = popTotal(c);
  const tm = 1 + 0.15 * (c.tier - 1), pm = c.ev && c.ev.k === 'plague' ? 0.6 : 1;
  const hv = seasonsOn(S) && seasonAt(S.day) === 'harvest';
  GIDS.forEach(g => { const base = (c.prod[g] || 0) * tm + (c.extra[g] || 0); if (base) c.stock[g] += base * pm * (c.sh ? shockProdMul(c, g) : 1) * (hv && (GD[g].tier === 'raw' || g === 'wheat') ? SEASONS.harvest.mul : 1); });
  let luxN = 0, luxD = 0, foodSat = 1;
  GIDS.forEach(g => {
    const G = GD[g]; let d = demandOf(c, g) * seasonMul(S, c, g); c.dem[g] = d;
    if (!G.ess) d *= clamp(1.5 - 0.8 * ratio(c, g), 0.3, 1.3);
    const got = Math.min(c.stock[g], d); c.stock[g] -= got;
    if (G.ess) foodSat = d > 0 ? got / d : 1;
    if (G.lux) { luxN += got; luxD += d; }
  });
  c.sat.food += 0.2 * (foodSat - c.sat.food);
  c.sat.lux += 0.2 * ((luxD > 0 ? luxN / luxD : 1) - c.sat.lux);
  GIDS.forEach(g => {
    const cp = capG(c, g);
    // السلعة التي لا تنتجها المدينة لا يمتلئ رفّها وحده إلا ببطء: تبقى نادرة حتى يصلها تاجر أو يُنتَج فيها (extra)
    c.stock[g] += ((isOwn(c, g) || (c.extra[g] || 0) > 0) ? 0.03 : PULL_FAR) * (0.45 * cp - c.stock[g]);
    c.stock[g] = clamp(c.stock[g], 0, cp * 1.2);
  });
  const extraSum = Object.values(c.extra).reduce((a, v) => a + v, 0);
  const jobs = pt * 0.78 + c.factJobs + extraSum * 8;
  const free = jobs - (c.pop[1] + c.pop[2] + c.pop[3]);
  const mv = (i, j, n) => { n = Math.min(Math.max(0, n), c.pop[i]); c.pop[i] -= n; c.pop[j] += n; };
  if (free > 0) mv(0, 1, Math.min(free, c.pop[0] * 0.04));
  if (c.sat.food > 0.9) mv(1, 2, c.pop[1] * 0.003);
  if (c.sat.lux > 0.7 && c.sat.food > 0.9) mv(2, 3, c.pop[2] * 0.002);
  if (c.sat.food < 0.7) { mv(1, 0, c.pop[1] * 0.02); mv(2, 1, c.pop[2] * 0.01); mv(3, 2, c.pop[3] * 0.01); }
  const maxPop = 1500 * c.size * (1 + 0.3 * (c.tier - 1));
  let gr = 0;
  if (c.sat.food > 0.95 && pt < maxPop) gr = 0.002;
  if (c.sat.food < 0.6) gr = -0.005;
  if (c.ev && c.ev.k === 'plague') gr -= 0.008;
  if (gr) c.pop[0] = Math.max(10, c.pop[0] + pt * gr);
  GIDS.forEach(g => {
    const q = ratio(c, g);
    c.short[g] = q > 1.3 ? c.short[g] + 1 : Math.max(0, c.short[g] - 1);
    c.glut[g] = q < 0.6 ? c.glut[g] + 1 : Math.max(0, c.glut[g] - 1);
  });
}

