/* ---------- اللاعب ---------- */
/* احتياطي التشغيل: ما يغطي التزامات 14 يوماً (متوسط متحرك لمصاريف الإيجار والأجور والصيانة)، فلا يُصرف على المخزون ما يتركك بلا نقد للأجور. */
const RESERVE_DAYS = 14, RESTOCK_MARGIN = 1.2;
const operatingReserve = S => RESERVE_DAYS * (S.player.fixedEma || 0);
function fixedTrack(S) {
  const P = S.player, Lx = P.led.exp, now = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) + (Lx.wages || 0);
  if (P.fixedPrev == null) { P.fixedPrev = now; P.fixedEma = 0; return; }
  const today = Math.max(0, now - P.fixedPrev); P.fixedPrev = now;
  P.fixedEma = (P.fixedEma || 0) * 0.9 + today * 0.1;
}
/* تعبئة المخزون للدكاكين: يومياً آلياً، ويدوياً من المكتب (force). السعر المقبول: عتبة اللاعب، وبوجود أمين مخزن أو مدير حتى سعر يترك هامش 20٪ بعد الضريبة. */
function restockShops(S, city, o = {}) {
  const P = S.player, pr = P.props[city], c = S.cities[city], res = { n: 0, cost: 0, items: 0, skipped: 0 };
  if (!pr || !c) return res;
  const delegated=!o.force&&stewardOf(S,city)?.policy?.restock;
  if(delegated&&!mgrOk(S,city,pr)){stewardStats(S,city).blocked=true;return res;}
  ctxFor(S, city); pr.basis = pr.basis || {};
  const managed = !!o.force || keeperHave(S, city) > 0 || !!pr.mgr, tr = taxRate(S, c, true), cap = Math.max(0, Math.min(P.gold * 0.5, P.gold - operatingReserve(S)));
  for (const sh of pr.shops) for (const it of sh.items) {
    const target = it.target; if (!o.force && !it.auto) continue; if ((pr.store[it.g] || 0) >= target) continue;
    const limit = managed ? Math.max(it.buyBelow, it.price * (1 - tr) / RESTOCK_MARGIN) : it.buyBelow;
    if (ratio(c, it.g) >= limit) { res.skipped++; continue; }
    const budget = { gold: Math.max(0,delegated?Math.min(cap-res.cost,stewardRemaining(S,city),P.wallet.sar-operatingReserve(S)):cap-res.cost) };
    if (budget.gold <= 0) { if(delegated)stewardStats(S,city).blocked=true;res.skipped++; continue; }
    const per = o.force ? target : 25 * Math.max(1, climateFactor(S, 'shops', city));
    const r = buyUnits(S, budget, c, it.g, Math.min(per, target - (pr.store[it.g] || 0)), storeRoom(S, city), pr.store, true, true);
    if(delegated){P.wallet.sar-=r.cost;if(r.cost>0){const w=stewardStats(S,city);w.spent+=r.cost;w.stock+=r.cost;stewardLog(S,city,{kind:'stock',g:it.g,quantity:r.n,amount:r.cost,why:'تعبئة '+GD[it.g].name});}}
    else P.gold-=r.cost;
    addBasis(pr.basis, it.g, r.n, r.cost); res.n += r.n; res.cost += r.cost; if (r.n > 0) res.items++;
  }
  return res;
}
/* تفويض مدير الممتلك: أسبوعياً يخفض سعر الراكد (مخزون وافر ومبيعات ضعيفة) ويرفع سعر الشحيح (مخزون قليل ومبيعات)، ضمن حدود 1.1–2.2 من المرجعي، ويسجّل ما فعل لتقرأه في المكتب وتقرير الغياب. */
const PRICE_STEP = 0.05, PRICE_MIN = 1.1, PRICE_MAX = 2.2;
function managerPricing(S, city, pr) {
  const m = pr.mgr; if (!m || S.day % 7 !== 0) return 0;
  if(m.rank===3){if(!m.policy?.pricing||m.priceDay===S.day)return 0;m.priceDay=S.day;}
  const P = S.player, log = P.mgrActions || (P.mgrActions = []); let n = 0;
  for (const sh of pr.shops) {
    const scoped = m.rank === 2 ? !!(m.asset && m.asset.kind === 'shop' && m.asset.id === sh.id) : mgrOk(S, city, pr);
    if (!scoped) continue;
    for (const it of sh.items) {
      const have = pr.store[it.g] || 0, tgt = it.target || 1; let to = it.price, why = '';
      if (have >= 0.8 * tgt && (it.lastSold || 0) < 0.05 * tgt) { to = Math.max(PRICE_MIN, it.price - PRICE_STEP); why = 'راكد: خُفّض السعر'; }
      else if (have < 0.25 * tgt && (it.lastSold || 0) > 0) { to = Math.min(PRICE_MAX, it.price + PRICE_STEP); why = 'شحيح ويباع: رُفع السعر'; }
      if (Math.abs(to - it.price) > 1e-9) { const action={g:it.g,shopId:sh.id,from:Math.round(it.price*100)/100,to:Math.round(to*100)/100,why};if(m.rank===3)stewardLog(S,city,{kind:'price',amount:0,...action});else log.unshift({d:S.day,city,...action}); it.price = to; n++; }
    }
  }
  if (log.length > 30) log.length = 30;
  return n;
}
function shopsDay(S) {
  const P = S.player; fixedTrack(S);
  for (const city in P.props) {
    const pr = P.props[city], c = S.cities[city]; if (!c) continue;
    ctxFor(S, city); pr.basis = pr.basis || {};
    const ns = pr.shops.length; pr.today = 0; const Lx = P.led.exp, c0 = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0); let todayPl = 0; const deferredStaff0 = deferredWages(S,city,'staff'), deferredRent0=deferredWages(S,city,'rent'), rentDebtBefore=Object.fromEntries(pr.shops.map(sh=>[sh.id,(S.paymentDues||[]).find(d=>d.id===sh.paymentDue)?.deferredWages||0])), rent0 = Lx.rent || 0, rentBefore = Object.fromEntries(pr.shops.map(sh => [sh.id, sh.rentPaid || 0])), shopNets = {};
    if (pr.farm) farmDay(S, city, pr, c);
    if (pr.butcher) butcherDay(S, city, pr, c);
    if (!ns && !pr.whs) { if (pr.farm) staffDay(S, city, pr, c); continue; }
    { const no = ownShops(pr); pPay(S, 'upkeep', no * 10 * (1 + 0.08 * (ns - 1)) + pr.whs * 6, true); }
    rentDay(S, city, pr, c);
    staffDay(S, city, pr, c); const sf = sellFactor(S, city);
    if (ns && sf <= 0) learnReact(S, 'noSeller', 15);
    // تعبئة آلية من السوق: عتبة اللاعب، ومع أمين مخزن أو مدير حتى سعر يترك هامشاً بعد الضريبة؛ ولا تمس احتياطي التشغيل
    restockShops(S, city);
    managerPricing(S, city, pr);
    // البيع للسكان
    const cnt = {};
    for (const sh of pr.shops) for (const it of sh.items) cnt[it.g] = (cnt[it.g] || 0) + 1;
    const tr = taxRate(S, c, true);
    for (const sh of pr.shops) for (const it of sh.items) {
      const g = it.g, n = cnt[g], mp = unitPrice(c, g), qm = qualOf(pr.basis, g), price = it.price * refPrice(c, g) * qm;
      const share = Math.min(0.7, 0.3 * Math.pow(n, 0.8)) / n;
      const f = shopF(c, g, price, mp, shUp(sh, 'sign'));
      const shopPact = bossActive(S) ? pactIn(S, city, 'shop') : null;
      const units = Math.min(pr.store[g] || 0, c.dem[g] * share * f * SHOP_DEMAND * Math.pow(shopProsper(c), 0.7) * (shopPact ? 1.4 : 1) * (1 + 0.06 * shUp(sh, 'awning')) * sf * climateFactor(S, 'shops', city));
      it.lastSold = units;
      if (units <= 0) continue;
      const gross = units * price, tax = gross * tr, cost0 = takeBasis(pr.basis, g, units);
      const beforeAway = P.led.exp.awayYield || 0;
      logTrade(S, city, g, units, 'shop', gross - tax, gross - tax - cost0 - (shopPact ? gross * shopPact.share : 0));
      const awayCut = (P.led.exp.awayYield || 0) - beforeAway;
      pr.store[g] -= units; c.stock[g] = Math.min(c.stock[g] + units, capG(c, g) * 1.2);
      const cut = shopPact ? gross * shopPact.share : 0; climateIncome(S, 'shops', gross - tax - cut - awayCut);
      P.gold += gross - tax - cut; sink(S, 'tax', tax); if (cut) { sink(S, 'pactShare', cut); P.led.exp.pactShare = (P.led.exp.pactShare || 0) + cut; }
      { const bsx = bossOf(S, city); if (bsx) bsx.dsales += gross; }
      P.led.inc.shops = (P.led.inc.shops || 0) + gross; P.led.exp.tax = (P.led.exp.tax || 0) + tax;
      it.sold = (it.sold || 0) + units; it.revenue = (it.revenue || 0) + gross - tax - cut; pr.today += gross - tax - cut - awayCut; todayPl += gross - tax - cut - cost0 - awayCut; shopNets[sh.id] = (shopNets[sh.id] || 0) + gross - tax - cut - cost0 - awayCut;
      if (rulerMine(S, c)) { const gv = tax * 0.2; P.gold += gv; P.led.inc.governor = (P.led.inc.governor || 0) + gv; fauc(S, 'governor', gv); }
    }
    const deferredStaffCost = deferredWages(S,city,'staff') - deferredStaff0, deferredRentCost=deferredWages(S,city,'rent')-deferredRent0;
    if ((S.life && S.life.salemWaqf) || (S.legacy && S.legacy.waqf && S.legacy.waqf.type === 'shop')) {
      const shared = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) - c0 - ((Lx.rent || 0) - rent0) + deferredStaffCost;
      for (const sh of pr.shops) recordShopNet(S, city, sh, (shopNets[sh.id] || 0) - shared / Math.max(1, pr.shops.length) - ((sh.rentPaid || 0) - (rentBefore[sh.id] || 0)) - (((S.paymentDues||[]).find(d=>d.id===sh.paymentDue)?.deferredWages||0)-(rentDebtBefore[sh.id]||0)));
    }
    if (ns) { pr.hist = pr.hist || []; pr.hist.push({ d: S.day, rev: pr.today, net: todayPl - deferredStaffCost - deferredRentCost - ((Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) - c0) }); if (pr.hist.length > 30) pr.hist.shift(); if (pr.today > 0 && S.learn && S.learn.ev && !S.learn.ev.shopSold) S.learn.ev.shopSold = 1; }
  }
}
