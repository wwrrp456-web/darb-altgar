/* ---------- المصانع: محلية (كما كانت) وغير محلية بجودة وصحة ومدير أعمال ---------- */
const LOCAL_FACTORY_BATCHES = 2, LOCAL_FACTORY_UPKEEP = 3.75, LOCAL_FACTORY_YIELD = 1.45; // مردود الصناعة المحلية؛ يقاس منفصلاً عن دخل الدكان.
const CRAFT_TRUST = 10, CRAFT_COST = 2500, CRAFT_OPEN = 40;
// المصنع محلي إن كانت الدولة دولة الصنعة الأصلية (للخمس الأولى) أو كانت المدينة تنتج السلعة فعلاً (للبقية)
const factoryLocal = (c, rc) => rc.country === c.country && (rc.old || c.makes.includes(rc.out));
// ما يمنع المصنع غير المحلي: إذن الزعيم صاحب المنتج
function factoryMakeBlock(S, city, recipe) {
  const rc = RECIPES[recipe]; if (S.cities[city].makes.includes(rc.out) && !rc.old) return null;
  const origin = S.order.find(id => S.cities[id].sig === rc.out); if (!origin || origin === city || !bossActive(S)) return null;
  const bs = bossOf(S, origin); if (!bs || bs.craft || bs.trust >= CRAFT_OPEN) return null;
  return 'تصنيع ' + GD[rc.out].name + ' خارج ' + S.cities[origin].name + ' يلزمه إذن كبير تجّارها (ثقته بك ' + CRAFT_OPEN + ' أو «نقل الصنعة» بـ ' + CRAFT_COST + ')';
}
const FACT_HP = { wage: 6, mats: 2, rep: 1, zakat: 1, broke: 8, heal: 2, grace: 30, crisis: 20, forced: 0.4, rescue: 0.10 };
const isAbroad = f => f.local === false;
const factoryBase = f => { const rc = RECIPES[f.recipe]; return isAbroad(f) ? MFG_COST(rc.out) : 4000; };
const factoryValue = f => factoryBase(f) * (1 + 0.4 * (f.level - 1));
function factoryQual(S, f) {
  if (!isAbroad(f)) return 1;
  const pr = S.player.props[f.city], mg = pr && mgrOk(S, f.city, pr);
  let q = reputation(S).quality / 100 + (mg && pr.mgr.lv === 3 ? 0.03 : 0);
  if ((f.hp == null ? 100 : f.hp) < 50) q *= 0.85;
  return clamp(q, 0.3, 0.9);
}
function factoryDay(S, f) {
  const P = S.player, c = S.cities[f.city], rc = RECIPES[f.recipe], pr = P.props[f.city];
  if (!c || !rc) return; const output = rc.n * (isAbroad(f) ? 1 : LOCAL_FACTORY_YIELD) * climateFactor(S, 'factory', f.city);
  ctxFor(S, f.city);
  if (!isAbroad(f)) { // المحلي: المناخ على المخرجات فقط؛ المدخلات والتكاليف كما كانت
    c.factJobs += 80 * f.level; payObligation(S, 'wages', rc.wage * f.level, f.city, 'factory', f, 'أجور ' + rc.name); pPay(S, 'upkeep', LOCAL_FACTORY_UPKEEP * f.level, true);
    if (!pr) return;
    for (let b = 0; b < LOCAL_FACTORY_BATCHES * f.level; b++) {
      let ok = true;
      for (const g in rc.inp) if ((pr.store[g] || 0) < rc.inp[g]) {
        { const rs = buyUnits(S, P, c, g, rc.inp[g] - (pr.store[g] || 0), storeRoom(S, f.city), pr.store, true, true); pr.basis = pr.basis || {}; addBasis(pr.basis, g, rs.n, rs.cost); }
        if ((pr.store[g] || 0) < rc.inp[g]) ok = false;
      }
      if (!ok || storeRoom(S, f.city) < GD[rc.out].w * output) break;
      let inCost = 0; pr.basis = pr.basis || {};
      for (const g in rc.inp) { pr.store[g] -= rc.inp[g]; inCost += takeBasis(pr.basis, g, rc.inp[g]); }
      pr.store[rc.out] = (pr.store[rc.out] || 0) + output; addBasis(pr.basis, rc.out, output, inCost); achFlag(S, 'factory_first');
      fauc(S, 'factory', output * mid(rc.out));
    }
    return;
  }
  // غير محلي
  f.hp = f.hp == null ? 100 : f.hp; f.set = f.set || { minBal: 0, maxBuy: 1.3, sell: 'hold' }; f.acc = f.acc || 0; f.accCost = f.accCost || 0;
  if (f.crisis) { // أزمة: الإنتاج متوقف حتى الإنقاذ، وبعد المهلة يُباع إجبارياً
    c.factJobs += 20 * f.level;
    if (S.day - f.crisis.day >= FACT_HP.crisis) { const v = Math.round(factoryValue(f) * FACT_HP.forced + (insOn(S, f.city) ? tkClaim(S, factoryValue(f) * (1 - FACT_HP.forced), TK.coverFactory) : 0)); P.gold += v; P.factories = P.factories.filter(x => x !== f); news(S, 'بِيع ' + rc.name + ' في ' + c.name + ' إجبارياً بـ ' + fmtN(v) + ' ريال لأنه لم يُنقَذ في مهلته.', 'bad'); learnReact(S, 'factoryLost'); }
    return;
  }
  c.factJobs += 80 * f.level;
  const wage = rc.wage * f.level, paid = payObligation(S, 'wages', wage, f.city, 'factory', f, 'أجور ' + rc.name); pPay(S, 'upkeep', 0.0015 * 2500 * f.level, true);
  const mg = pr && mgrOk(S, f.city, pr), over = pr && pr.mgr && !mg, q = factoryQual(S, f), set = f.set;
  const waste = over ? 0.2 : mg && pr.mgr.lv === 1 ? 0.10 : 0;
  let made = 0, short = false;
  if (pr) {
    pr.basis = pr.basis || {};
    for (let b = 0; b < 4 * f.level; b++) {
      let ok = true;
      for (const g in rc.inp) {
        const need = rc.inp[g] * (1 + waste);
        if ((pr.store[g] || 0) < need) {
          const may = !mg || (P.gold >= set.minBal && ratio(c, g) <= set.maxBuy);
          if (may) { const rs = buyUnits(S, P, c, g, Math.ceil(need - (pr.store[g] || 0)), storeRoom(S, f.city), pr.store, true, true); addBasis(pr.basis, g, rs.n, rs.cost); }
          if ((pr.store[g] || 0) < need) ok = false;
        }
      }
      if (!ok) { short = true; break; }
      if (storeRoom(S, f.city) < GD[rc.out].w * output) break;
      let inCost = 0;
      for (const g in rc.inp) { const need = rc.inp[g] * (1 + waste); pr.store[g] -= need; inCost += takeBasis(pr.basis, g, need); }
      f.acc += output * (0.5 + 0.5 * q); f.accCost += inCost;
      const k = Math.floor(f.acc);
      if (k >= 1) { f.acc -= k; achFlag(S, 'factory_first'); pr.store[rc.out] = (pr.store[rc.out] || 0) + k; addBasis(pr.basis, rc.out, k, f.accCost, q); f.accCost = 0; made += k; fauc(S, 'factory', k * mid(rc.out) * q); }
    }
    if (mg && set.sell === 'now' && (pr.store[rc.out] || 0) >= 1) {
      const qm = qualOf(pr.basis, rc.out), r = sellUnits(S, P, c, rc.out, pr.store[rc.out], pr.store, true, qm, 'factory');
      if (r.n > 0) { const cost = takeBasis(pr.basis, rc.out, r.n); logTrade(S, f.city, rc.out, r.n, 'shop', r.net, r.net - cost, 'factory'); P.led.inc.shops = (P.led.inc.shops || 0) + r.net; f.sold = (f.sold || 0) + r.n; f.rev = (f.rev || 0) + r.net; }
    }
  }
  f.made = (f.made || 0) + made;
  // صحة المصنع
  const R = repOf(P); let d = 0;
  if (paid < wage - 1e-9) { f.late = (f.late || 0) + 1; d -= FACT_HP.wage; } else f.late = 0;
  if (short && made === 0) d -= FACT_HP.mats;
  if (reputation(S).total < 40) d -= FACT_HP.rep;
  if (S.zakat && S.zakat.due && S.zakat.defer) d -= FACT_HP.zakat;
  if ((R.broke || 0) > (f.brk || 0)) { d -= FACT_HP.broke; }
  f.brk = R.broke || 0;
  const grace = S.day - (f.since || 0) < FACT_HP.grace;
  if (d === 0) d = FACT_HP.heal; else if (grace) d = Math.max(0, d);
  const hp0 = f.hp; f.hp = clamp(f.hp + d, 0, 100);
  if (f.hp < 40 && hp0 >= 40) learnReact(S, 'factoryWeak', 20, rc.name);
  if (f.hp <= 0) { f.crisis = { day: S.day }; news(S, 'انهار ' + rc.name + ' في ' + c.name + '! أنقذه خلال ' + FACT_HP.crisis + ' يوماً بغرامة ' + Math.round(FACT_HP.rescue * 100) + '٪ من قيمته وإلا بِيع بـ' + Math.round(FACT_HP.forced * 100) + '٪.', 'bad'); learnReact(S, 'factoryCrisis'); }
}
const fmtN = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/* مدير أعمال المدينة: واحد لكل مدينة بثلاثة مستويات. يشغّل إعدادات المصانع (حدّ الرصيد، أعلى سعر مواد، بيع فوري)، المبتدئ يهدر 10٪ من المواد، والخبير يرفع الجودة 3٪.
   إن زادت الأصول عن طاقته (3/6/10) فهو مُرهَق. وإن لم تراجع حساباته 10 أيام فقد يختلس (≈3٪). */
const MGR = [null, { name: 'مدير مبتدئ', wage: 15, cap: 3 }, { name: 'مدير متمرّس', wage: 35, cap: 6 }, { name: 'مدير خبير', wage: 70, cap: 10 }];
const MGR_AUDIT = 10, MGR_THEFT = 0.03;
const assetsIn = (S, city) => { const pr = S.player.props[city]; if (!pr) return 0; return ownShops(pr) + (pr.whs || 0) + (pr.farm ? 1 : 0) + (pr.butcher ? 1 : 0) + S.player.factories.filter(f => f.city === city).length; };
const mgrOk = (S, city, pr) => !!(pr && pr.mgr && assetsIn(S, city) <= MGR[pr.mgr.lv].cap);
function mgrDay(S, city, pr) {
  const m = pr.mgr, c = S.cities[city], w = MGR[m.lv].wage; ctxFor(S, city);
  const paid = payObligation(S, 'staff', w, city, 'manager', m, MGR[m.lv].name); m.late = paid < w - 1e-9 ? (m.late || 0) + 1 : 0;
  if (m.late >= 3) { pr.mgr = null; news(S, 'ترك مدير أعمال ' + c.name + ' العمل لأن أجره تأخّر.', 'bad'); return; }
  if (S.day - (m.audit == null ? m.since : m.audit) >= MGR_AUDIT && rndB(S) < MGR_THEFT / 30 * climateRisk(S, 'factory', city)) {
    const take = Math.min(Math.round(valueOf(pr.store) * 0.08) + 150, 4000); pr.mgr = null;
    for (const g in pr.store) { pr.store[g] *= 0.92; }
    news(S, 'اختلس مدير أعمال ' + c.name + ' نحو ' + fmtN(take) + ' ريال وهرب! راجع حسابات المدير كل ' + MGR_AUDIT + ' أيام.', 'bad'); learnReact(S, 'mgrTheft');
  }
}
