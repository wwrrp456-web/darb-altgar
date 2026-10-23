/* ---------- الوكلاء ---------- */
function agentsDay(S) {
  // ذاكرة مؤقتة لهذه الجولة فقط؛ تعاد التسعيرة فور تغير المخزون.
  const prices=new Map(),routes=new Map();
  const price=(c,g)=>{let row=prices.get(c);if(!row){row=new Map();prices.set(c,row);}const stock=c.stock[g],q=row.get(g);if(q&&q.stock===stock)return q.price;const value=unitPrice(c,g);row.set(g,{stock,price:value});return value;};
  for (const a of S.agents) {
    const up = Math.min(a.gold, 5 + a.gold * 0.015); sink(S, 'agentUpkeep', up); a.gold -= up;
    if (a.left > 0) {
      a.left--;
      if (a.left === 0) {
        const c = S.cities[a.dest]; a.city = a.dest; a.dest = null;
        const cu = Math.min(a.gold, customsOf(S, a.from, a.city, a.cargo)); if (cu > 0) { a.gold -= cu; sink(S, 'customs', cu); }
        if (rnd(S) < S.risk[riskKey(a.from, a.city)] * 0.5) { for (const g in a.cargo) { const l = Math.floor(a.cargo[g] * 0.3); a.cargo[g] -= l; } }
        for (const g of GIDS) if ((a.cargo[g] || 0) >= 1) sellUnits(S, a, c, g, a.cargo[g], a.cargo, false, 1);
      }
      continue;
    }
    const c = S.cities[a.city];
    if (a.gold < 40 && !Object.keys(a.cargo).some(g => a.cargo[g] >= 1)) { a.gold += 300; fauc(S, 'bailout', 300); S.stats.bailouts = (S.stats.bailouts || 0) + 1; }
    const wheat=price(c,'wheat');
    let destinations=routes.get(a.city);
    if(!destinations){destinations=S.order.filter(d=>d!==a.city).map(d=>{const dc=S.cities[d],cus=dc.country===c.country?0:CD[dc.country].customs;return {d,city:dc,net:1-dc.tax-cus,days:Math.max(1,Math.ceil(dist(S,a.city,d)/SPEED))};});routes.set(a.city,destinations);}
    let best = null;
    for (const g of GIDS) {
      const G=GD[g];
      if (G.sp || G.fresh || g === c.sig && exclusiveAt(S, a.city)) continue;
      const pb = price(c, g) * 1.01;
      for (const r of destinations) {
        const ps = price(r.city, g) * r.net * (0.92 + rnd(S) * 0.16);
        const days=r.days,fu=(G.fod||0)*days*wheat,m=(ps-pb-fu)/days/pb;
        if (!best || m > best.m) best = { g, d:r.d, m, days, fu };
      }
    }
    if (best && best.m > 0.012) {
      const G = GD[best.g];
      const qty = Math.min(a.cap / G.w, a.gold * 0.9 / unitPrice(c, best.g), c.stock[best.g] * 0.35);
      const res = buyUnits(S, a, c, best.g, qty, a.cap, a.cargo, false);
      if (res.n > 0) { const fc = Math.min(a.gold, res.n * best.fu); a.gold -= fc; sink(S, 'provisions', fc); a.from = a.city; a.dest = best.d; a.left = best.days; a.total = best.days; }
    }
    if (a.gold > 6000) {
      let pick = null;
      for (const id of S.order) { const cc = S.cities[id]; for (const g of GIDS) if (!GD[g].sp && cc.short[g] > 20 && (cc.extra[g] || 0) < 12 && (S.day >= 200 || isOwn(cc, g))) { pick = { cc, g }; break; } if (pick) break; }
      if (pick) { a.gold -= 2500; sink(S, 'investment', 2500); pick.cc.extra[pick.g] = (pick.cc.extra[pick.g] || 0) + 3; pick.cc.short[pick.g] = 0; news(S, 'استثمر تاجر في إنتاج ' + GD[pick.g].name + ' بمدينة ' + pick.cc.name + ' لسدّ النقص.'); }
    }
  }
  for (const id of S.order) { const c = S.cities[id]; for (const g in c.extra) if (c.extra[g] > 0 && c.glut[g] > 25) { c.extra[g] = Math.max(0, c.extra[g] - 3); c.glut[g] = 0; } }
}

