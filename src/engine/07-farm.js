/* ---------- المزرعة (الطور 3): تُربّي المواشي وتكاثرها وتُنتج الصوف والجبن والبيض، ويذبح اللاعب منها لحماً مجففاً ---------- */
const BUTCHER_COST = 3500, BUTCHER_DAY = 30, FRESH_X = 2.2, BUTCHER_PREM = 1.08; // الملحمة: يومياً تبيع حتى 30 وحدة لحم طازج بعلاوة 8٪، وغلّة الرأس 2.2 ضعف غلّة المجفف
const FARM_PHASE = 3, FARM_COST = 4000, FARM_UP = 3000, FARM_UNITS = 40, FARM_MAXLV = 3, FARM_UPKEEP = 4, FARMER_UNITS = 40;
const PASTURE = { sa: 0.8, eg: 1.3, ir: 1, in: 1.2, cn: 1.1 };
const PRODUCT = { sheep: ['wool', 0.066, false], goat: ['cheese', 0.03, true], cow: ['cheese', 0.08, true], buffalo: ['cheese', 0.09, true], camel: ['cheese', 0.04, true], chicken: ['eggs', 0.015, true], duck: ['eggs', 0.012, true] };
const MEAT = { sheep: 2, goat: 1.6, cow: 5, buffalo: 5.5, camel: 7 };
const farmOf = (S, city) => (S.player.props[city] && S.player.props[city].farm) || null;
const farmCap = (S, city) => { const f = farmOf(S, city); return f ? Math.round(FARM_UNITS * f.level * (PASTURE[S.cities[city].country] || 1)) : 0; };
const farmUnits = f => { let u = 0; for (const g in (f.hx || {})) u += ((f.herd[g] || 0) + 0.5 * youngOf(f, g)) * (BREED[g] ? BREED[g].fu : 1); for (const g in f.herd) if (!(f.hx || {})[g]) u += f.herd[g] * (BREED[g] ? BREED[g].fu : 1); return u; };
const farmHold = f => { const h = {}; for (const g in f.herd) h[g] = (h[g] || 0) + f.herd[g]; for (const g in (f.hx || {})) h[g] = (h[g] || 0) + YOUNG_VAL * f.hx[g].y; return h; };
const farmValue = pr => (pr.farm ? 2500 * pr.farm.level + valueOf(farmHold(pr.farm)) : 0) + (pr.butcher ? BUTCHER_COST * 0.6 : 0);
const farmerNeed = (S, city) => { const f = farmOf(S, city); return f ? Math.ceil(farmUnits(f) / FARMER_UNITS) : 0; };
const farmCover = (S, city) => { const n = farmerNeed(S, city); if (!n) return 1; const pts = staffOf(S, city).filter(w => w.role === 'farmer').reduce((a, w) => a + WK.farmer.pts[wkLv(w)] * (w.late > 0 ? 0.5 : 1), 0); return Math.min(1.2, pts / n); };
// نقل خيل بين قطيع ومزرعة: يحمل سلالة الذكور والإناث بنسبتها
function pedMove(src, dst, dstAdults, n, p) {
  const nm = n * p, nf = n - nm, dm = Math.min(dst.m, dstAdults), df = dstAdults - dm;
  if (dm + nm > 0) dst.mq = ((dst.mq || 1) * dm + (src.mq || 1) * nm) / (dm + nm); if (df + nf > 0) dst.fq = ((dst.fq || 1) * df + (src.fq || 1) * nf) / (df + nf);
}
function farmDay(S, city, pr, c) {
  const f = pr.farm; if (!f) return; ctxFor(S, city); pPay(S, 'farm', FARM_UPKEEP * f.level, true); f.acc = f.acc || {};
  const cap = farmCap(S, city), cover = farmCover(S, city), plague = c.ev && c.ev.k === 'plague' ? 3 : 1;
  for (const g of Array.from(new Set(Object.keys(f.herd).concat(Object.keys(f.hx || {}))))) {
    const B = BREED[g]; if (!B) continue; f.herd[g] = f.herd[g] || 0;
    const rate = GD[g].spoil * spoilMul(f, g) * 0.3 * plague * climateRisk(S, 'farm', city) * (cover < 1 ? 2 - cover : 1), loss = f.herd[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
    if (n) { const b0 = f.herd[g]; f.herd[g] = Math.max(0, b0 - n); herdScale(f, g, b0); sink(S, 'spoilage', n * mid(g)); }
    breedStep(S, f, g, Math.min(1, cover), cap - farmUnits(f), B.fu * 0.5, 1);
    const pd = PRODUCT[g]; if (pd && cover > 0) {
      const x = hxOf(f, g), a = f.herd[g], heads = pd[2] ? Math.max(0, a - Math.min(x.m, a)) : a;
      f.acc[pd[0]] = (f.acc[pd[0]] || 0) + heads * pd[1] * hyMul(f, g, pd[0] === 'wool' ? 'wool' : 'milk') * cover * climateFactor(S, 'farm', city); const k = Math.floor(f.acc[pd[0]]);
      if (k >= 1) { const room = Math.floor(storeRoom(S, city) / GD[pd[0]].w), put = Math.min(k, room); if (put > 0) { achFlag(S, 'farm_first'); pr.store[pd[0]] = (pr.store[pd[0]] || 0) + put; addBasis(pr.basis || (pr.basis = {}), pd[0], put, 0); } f.acc[pd[0]] -= k; if (put < k) f.lost = (f.lost || 0) + (k - put); }
    }
  }
}
function welcomeCrew(S, pr, nSellers, keepers) {
  pr.staff = pr.staff || [];
  for (let i = 0; i < (pr.farmerWelcome || 0); i++) pr.staff.push({ id: S.nextId++, role: 'farmer', days: 0, late: 0, free: S.day + WK_FREE }); pr.farmerWelcome = 0;
  for (let i = 0; i < nSellers; i++) pr.staff.push({ id: S.nextId++, role: 'seller', days: 0, late: 0, free: S.day + WK_FREE });
  for (let i = 0; i < keepers; i++) pr.staff.push({ id: S.nextId++, role: 'keeper', days: 0, late: 0, free: S.day + WK_FREE });
}
function rentOf(S, c, kind, landlord, nShops) {
  const base = kind === 'stall' ? STALL_RENT * (0.85 + 0.25 * c.size) * (c.country === S.home ? 1 : 1.2) : Math.round(1500 * Math.pow(1.5, nShops) * foreignMul(S, c)) * RENT_RATE;
  const bs = bossOf(S, c.id), m = landlord === 'boss' && bs && bs.ruler !== 'player' ? clamp(1 - bs.trust / 300, 0.8, 1.2) : 1;
  return Math.max(1, Math.round(base * m));
}
function rentDay(S, city, pr, c) {
  for (const sh of pr.shops.slice()) {
    if (shKind(sh) === 'own') continue;
    const paid = payObligation(S, 'rent', sh.rent, city, 'rent', sh, shKind(sh) === 'stall' ? 'إيجار بسطة' : 'إيجار دكان'); sh.rentPaid = (sh.rentPaid || 0) + paid;
    if (paid + 1e-6 >= sh.rent) {
      sh.arrears = 0; sh.onTime = (sh.onTime || 0) + 1;
      if (sh.landlord === 'boss' && sh.onTime % 10 === 0) { const bs = bossOf(S, city); if (bs) bs.trust = clamp(bs.trust + 1, -100, 100); }
      continue;
    }
    sh.arrears = (sh.arrears || 0) + 1; if (sh.arrears === 1) learnReact(S, 'rentLate', 10);
    if (sh.arrears >= EVICT_DAYS) {
      pr.shops = pr.shops.filter(x => x !== sh); if (pr.whs > pr.shops.length) pr.whs = pr.shops.length;
      if (sh.landlord === 'boss') { const bs = bossOf(S, city); if (bs) bs.trust = clamp(bs.trust - 10, -100, 100); }
      news(S, 'أُخلي ' + (shKind(sh) === 'stall' ? 'بسطتك' : 'دكانك المؤجَّر') + ' في ' + c.name + ' لتأخّر الإيجار ' + sh.arrears + ' أيام.', 'bad');
    }
  }
}
function staffDay(S, city, pr, c) {
  pr.staff = pr.staff || [];
  for (const w of pr.staff.slice()) {
    workerPayDay(S,w);
    w.days++;
    if (w.free > S.day) continue;
    const wage = wkWage(S, c, w), paid = payObligation(S, 'staff', wage, city, 'staff', w, WK[w.role].name);
    if (paid + 1e-6 >= wage) { w.late = 0; achFlag(S, 'steady_staff'); continue; }
    w.late = (w.late || 0) + 1;
    if (w.late === 1) learnReact(S, 'wageLate', 10);
    if (w.late >= 5) { pr.staff = pr.staff.filter(x => x !== w); news(S, 'ترك ' + WK[w.role].name + ' العمل في ' + c.name + ' لأن أجره تأخّر ' + w.late + ' أيام.', 'bad'); }
  }
  // أمين المخزن: المخزن بلا أمين يتناقص مخزونه (سرقة وإهمال)
  const need = keeperNeed(S, city);
  if (need > 0) {
    const un = Math.max(0, need - keeperHave(S, city)) / need;
    if (un > 0) for (const g in pr.store) {
      const loss = (pr.store[g] || 0) * SHRINK * un; if (loss <= 0) continue;
      pr.store[g] -= loss; takeBasis(pr.basis || (pr.basis = {}), g, loss); sink(S, 'shrink', loss * mid(g));
    }
  }
}

function netWorth(S) {
  const P = S.player; let nw = P.gold;
  P.caravans.forEach(c => { nw += valueOf(holdings(c)) + c.carts * 300 + c.guards * 100; });
  for (const k in P.props) { const p = P.props[k]; nw += ownShops(p) * 1000 + p.whs * 800 + valueOf(p.store) + farmValue(p); }
  P.factories.forEach(f => nw += 2000 * f.level);
  for (const k in P.bank.dep) nw += P.bank.dep[k];
  P.bank.loans.forEach(l => nw -= l.amt);
  P.bank.bonds.forEach(b => nw += b.amt); nw += P.vault || 0;
  for (const id in S.cities) { const c = S.cities[id]; if (c.owner === 'player') nw += 30000; nw += (c.tier - 1) * 4000; const bs = bossOf(S, id); if (bs && bs.ruler === 'player') nw += 4000 * c.size; }
  for (const pr of Object.values(P.props)) nw -= pr.shops.filter(sh => sh.endowed && shKind(sh) === 'own').length * 1000;
  return nw - deferredWages(S);
}
function titleOf(nw) { let t = WEALTH_TITLES[0][1]; WEALTH_TITLES.forEach(([a, n]) => { if (nw >= a) t = n; }); return t; }


/* معاينة الذبح للملحمة: الحدّ بحسب الجنس المختار (ذكور، إناث غير حوامل، أو الكل)، واللحم المتوقع، وتقدير العائد. الذكور الفائضة: ما زاد عن ذكر لكل ١٠ إناث. */
function meatPool(f, g) { const a = Math.floor(f.herd[g] || 0), m = Math.min(a, Math.floor(malesOf(f, g))), fem = a - m, p = Math.min(fem, pregOf(f, g)); return { a, m, f: fem, p, open: Math.max(0, fem - p), surplusM: Math.max(0, m - Math.ceil(fem / 10)) }; }
function meatQuote(S, city, g, qty, sex) {
  const f = farmOf(S, city), pr = S.player.props[city]; if (!f || !pr) return { ok: false, msg: 'لا مزرعة هنا' }; if (!pr.butcher) return { ok: false, msg: 'تحتاج ملحمة في هذه المدينة' };
  if (!MEAT[g]) return { ok: false, msg: spOf(g) === 'horse' ? 'لا تُذبح الخيل' : 'لا تُذبح هذه' };
  const sx = sex === 'm' || sex === 'f' ? sex : 'any', pool = meatPool(f, g), cap = sx === 'm' ? pool.m : sx === 'f' ? pool.open : pool.a;
  if (cap < 1) return { ok: false, msg: sx === 'm' ? 'لا ذكور بالغة من ' + GD[g].name : sx === 'f' ? 'لا إناث غير حوامل من ' + GD[g].name : 'لا ' + GD[g].name + ' بالغة', pool };
  const ym = MEAT[g] * hyMul(f, g, 'meat') * climateFactor(S, 'farm', city) * FRESH_X, room = Math.floor(storeRoom(S, city) / GD.meat.w), maxN = Math.floor(room / ym);
  const n = Math.min(Math.max(1, Math.floor(qty) || 1), cap, maxN); if (n < 1) return { ok: false, msg: 'مخزنك لا يتسع للحم الطازج', pool };
  const meat = Math.floor(n * ym), price = S.cities[city] ? unitPrice(S.cities[city], 'meat') * BUTCHER_PREM : 0;
  return { ok: true, n, sex: sx, meat, perHead: ym, price, rev: Math.round(meat * price), pool, cap, limited: n < Math.floor(qty) };
}
