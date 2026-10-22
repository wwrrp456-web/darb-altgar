/* ---------- أدوار القادة الستة والولاء والراتب ----------
   lux خبير السلع الثمينة: يبيع الكماليات والمصنّعات بعلاوة 4٪ ويشتريها أرخص 3٪ · eyes عيون الأسواق: ينبّهك لأسعار صاعدة وغضب الزعماء
   native ابن البلد: جمارك أقل 30٪ وخطر طرق أقل 20٪ حول بلده · envoy رسول الزعماء: يرفع ثقة زعماء ما يزور من مدن
   indep المستقل: يتاجر بلا مسار فيختار أفضل صفقة كل مرة · loyal الوفيّ: أجره أقل 10٪ وولاؤه ثابت.
   لكل قائد ولاء (0–100): يزيد بالأجر في موعده والعلاوة، وينقص بتأخّره، وتحت 25 يترك العمل (في لعبة التعلّم). */
const ROLES = {
  lux: { name: 'خبير السلع الثمينة', desc: 'يبيع الكماليات والمصنّعات بعلاوة 4٪ ويشتريها أرخص بـ3٪' },
  eyes: { name: 'عيون الأسواق', desc: 'ينبّهك بالأسعار الصاعدة وغضب الزعماء' },
  native: { name: 'ابن البلد', desc: 'جمارك أقل 30٪ وخطر طرق أقل 20٪ حول بلده' },
  envoy: { name: 'رسول الزعماء', desc: 'يرفع ثقة زعماء المدن التي يزورها' },
  indep: { name: 'المستقل', desc: 'يتاجر وحده بلا مسار: يختار أفضل صفقة كل مرة' },
  loyal: { name: 'الوفيّ', desc: 'أجره أقل 10٪ وولاؤه ثابت لا يتأرجح' },
};
const ROLE_KEYS = Object.keys(ROLES), CAP_NAMES = ['مطلق', 'بدر', 'تركي', 'فيصل', 'عيد', 'حمد', 'سلمان', 'ناصر', 'جابر', 'ماجد', 'رشيد', 'سالم'];
const CAP_RAISE_MAX = 0.6, CAP_QUIT = 25;
function captainPool(S) {
  let t = ((S.day + 1) * 7919 + S.player.caravans.length * 104729) >>> 0;
  const r = () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const used = new Set(), out = [];
  for (let i = 0; i < 3; i++) {
    let role; do { role = ROLE_KEYS[Math.floor(r() * 6)]; } while (used.has(role)); used.add(role);
    const sk = () => 1 + Math.floor(r() * 3), trade = sk(), nav = sk(), combat = sk();
    out.push({ i, name: CAP_NAMES[Math.floor(r() * CAP_NAMES.length)], role, home: COUNTRIES[Math.floor(r() * COUNTRIES.length)].id, trade, nav, combat, fee: 1200 + 150 * (trade + nav + combat) });
  }
  return out;
}
const capRole = car => (car.captain && car.captain.role) || null;
const capWage = car => { const cp = car.captain; return cp ? (4 + 2 * (cp.trade + cp.nav + cp.combat) / 3) * (1 + (cp.raise || 0)) * (cp.role === 'loyal' ? 0.9 : 1) : 0; };
const isLuxish = g => !!(GD[g].lux || GD[g].tier === 'proc');
// عيون الأسواق: تنبيه يومي واحد بأعلى سعر صاعد لبضاعة معك، وغضب الزعماء
function eyesDay(S) {
  if (!S.player.caravans.some(c => capRole(c) === 'eyes') || !(S.learn && S.learn.char)) return;
  const memo = S.alerts = S.alerts || {}, held = new Set(); S.player.caravans.forEach(c => { for (const g in c.cargo) if (c.cargo[g] >= 1) held.add(g); });
  for (const id in S.player.props) for (const g in S.player.props[id].store) if (S.player.props[id].store[g] >= 1) held.add(g);
  let best = null;
  S.order.forEach(id => { const c = S.cities[id]; held.forEach(g => { const rt = ratio(c, g); if (rt >= 1.25 && S.day - (memo[id + g] || -99) >= 6 && (!best || rt > best.rt)) best = { id, g, rt }; }); });
  if (best) { memo[best.id + best.g] = S.day; news(S, 'عيون الأسواق: ' + GD[best.g].name + ' في ' + S.cities[best.id].name + ' أعلى من المعتاد بنحو ' + Math.round((best.rt - 1) * 100) + '٪ وعندك منه. فكّر في بيعه هناك.', 'alert'); }
  S.order.forEach(id => { const b = S.bosses && S.bosses[id]; if (b && b.trust <= -30 && S.day - (memo['b' + id] || -99) >= 20) { memo['b' + id] = S.day; news(S, 'عيون الأسواق: ' + b.name + ' في ' + S.cities[id].name + ' غاضب عليك (ثقته ' + Math.round(b.trust) + '). أهدِه أو فاوضه قبل أن يشتد.', 'alert'); } });
}
// المستقل: يختار أفضل صفقة للقافلة نفسها ويسافر
function autoIndep(S, car) {
  const P = S.player, c = S.cities[car.city]; ctxFor(S, car.city);
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) { const res = sellUnits(S, P, c, g, car.cargo[g], car.cargo, true, 1 + 0.015 * car.captain.trade); if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); car.pl = (car.pl || 0) + (res.net - cost); logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost); } }
  const d = bestDeal(S, car, P.gold * 0.4);
  if (!d) { car.waiting = 'لا صفقة مجزية الآن'; return; }
  const room = capOfCar(car) - loadOf(car), budget = { gold: Math.min(P.gold * 0.4, d.cost * 1.1) }, res = buyUnits(S, budget, c, d.g, Math.min(d.q, room / GD[d.g].w), room, car.cargo, true);
  if (res.n < 1) { car.waiting = 'تعذّر الشراء'; return; }
  P.gold -= res.cost; addBasis(car.basis, d.g, res.n, res.cost);
  const r = startTrip(S, car, d.dest); car.waiting = r.ok ? null : r.msg;
}
/* ---------- القادة والمسارات الآلية ---------- */
function autoRoute(S, car) {
  const r = car.route; if (!r) return;
  const P = S.player, c = S.cities[car.city], cap = capOfCar(car);
  ctxFor(S, car.city);
  const haggle = 1 + 0.015 * (car.captain ? car.captain.trade : 0), lux = capRole(car) === 'lux';
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) {
    const q = Math.floor(car.cargo[g]), res = sellUnits(S, P, c, g, q, car.cargo, true, haggle * (lux && isLuxish(g) ? 1.04 : 1));
    if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); car.pl = (car.pl || 0) + (res.net - cost); logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost); }
  }
  const buyG = car.city === r.a ? r.buyA : car.city === r.b ? r.buyB : r.buyA;
  if (buyG) {
    const pr = P.props[car.city];
    if (pr && pr.store[buyG] >= 1) {
      const q = Math.min(pr.store[buyG], Math.floor((cap - loadOf(car)) / GD[buyG].w));
      const cost = takeBasis(pr.basis || (pr.basis = {}), buyG, q); pr.store[buyG] -= q; car.cargo[buyG] = (car.cargo[buyG] || 0) + q; addBasis(car.basis, buyG, q, cost);
    }
    const room = cap - loadOf(car);
    if (room >= GD[buyG].w && ratio(c, buyG) < 1.08) {
      const budget = { gold: P.gold * 0.7 };
      const res = buyUnits(S, budget, c, buyG, room / GD[buyG].w, room, car.cargo, true, false, lux && isLuxish(buyG) ? 0.97 : 1);
      P.gold -= res.cost; addBasis(car.basis, buyG, res.n, res.cost);
    }
  }
  const dest = car.city === r.a ? r.b : r.a;
  const res = startTrip(S, car, dest);
  car.waiting = res.ok ? null : res.msg;
}


/* تقرير الأسطول: لكل قافلة بقائد حالتها وربحها وما يعطّلها بلغة بسيطة (قراءة فقط) */
const WAIT_TXT = { 'لا صفقة مجزية الآن': 'لا يجد صفقة تستحق الآن: غيّر سلعته أو مساره، أو اجعله «مستقلاً» ليختار بنفسه.', 'تعذّر الشراء': 'تعذّر الشراء: نقدك لا يكفي أو السلعة غير متاحة في هذه المدينة.' };
function fleetReport(S) {
  const mult = wageMultOf(S);
  return S.player.caravans.filter(c => c.captain && !c.main).map(car => {
    const cp = car.captain, daily = (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * mult + (mountOf(car) ? mountOf(car).up : 0);
    const indep = capRole(car) === 'indep', idleCost = daily * WAGE.idle, value = valueOf(car.cargo), lines = [];
    let status;
    if (car.left > 0) status = 'في الطريق إلى ' + S.cities[car.dest].name + '، باقٍ ' + car.left + ' يوم.';
    else if (car.waiting) status = 'واقف في ' + S.cities[car.city].name + ': ' + (WAIT_TXT[car.waiting] || car.waiting);
    else status = (car.route || indep) ? 'في ' + S.cities[car.city].name + ' يستعد للرحلة التالية.' : 'واقف في ' + S.cities[car.city].name + '.';
    if (!car.route && !indep) lines.push({ ok: false, t: 'بلا مسار: يقف ولا يتاجر وتدفع له ≈ ' + Math.round(idleCost) + ' ريال يومياً بلا عمل. حدّد له مساراً بين مدينتين.' });
    if (car.trips > 0) { const pl = Math.round(car.pl || 0); lines.push({ ok: pl >= 0, t: 'أنجز ' + car.trips + ' رحلة، وربحه من المبيعات ≈ ' + pl + ' ريال' + (pl < 0 ? ' (خسارة)' : '') + ' مقابل أجور يومية ≈ ' + Math.round(daily) + '.' }); }
    else lines.push({ ok: true, t: 'لم ينجز رحلة بعد. أجوره اليومية ≈ ' + Math.round(daily) + ' ريال.' });
    const lo = cp.loyal == null ? 70 : cp.loyal; if (lo < 40) lines.push({ ok: false, t: 'ولاؤه ' + Math.round(lo) + ' من 100' + (lo < 25 ? ': يوشك أن يترك العمل!' : ': ضعيف، ادفع أجره في موعده أو أعطه علاوة.') });
    if (value > 3000 && !car.guards && !car.insured) lines.push({ ok: false, t: 'في حمولته ≈ ' + Math.round(value) + ' ريال بلا حرّاس ولا تكافل. زوّده بحارس أو اشترك في التكافل.' });
    if (car.morale < 50) lines.push({ ok: false, t: 'معنوياته ' + Math.round(car.morale) + ' من 100: تحتاج راحة وطعاماً.' });
    return { id: car.id, name: car.name, status, lines, ok: lines.every(l => l.ok) && !car.waiting, pl: Math.round(car.pl || 0), trips: car.trips || 0, daily: Math.round(daily) };
  });
}
