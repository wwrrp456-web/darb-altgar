/* أوضاع قوافل القادة المستأجرين: بمسار، حرّ (يتاجر بنفسه وتنتظر الدخل)، تموين (يزوّد مخزنك بسلعة)، راحة (أيام بنصف أجر ومعنويات تتعافى أسرع)، متوقف */
const CAP_REST = { min: 2, max: 10, def: 5, wage: 0.5, morale: 12 };
const CAP_SUP = { minBudget: 200, cashShare: 0.5, customsPenalty: 1.25, kmCost: 0.0004 };
const supplyOf = (S, city, g) => S.player.caravans.find(c => c.sup && c.sup.wh === city && c.sup.g === g && c.captain && !c.main);
/* مصدر التموين: أرخص مدينة تُباع فيها السلعة (مع كلفة المسافة والجمارك إن اختلفت الدولة) */
function supplySource(S, car, sp) {
  let best = null; const wc = S.cities[sp.wh];
  for (const id of S.order) { if (id === sp.wh) continue; const c = S.cities[id]; if (!sells(c, sp.g)) continue; if (travelBlock(S, car, id)) continue;
    const score = unitPrice(c, sp.g) * (1 + CAP_SUP.kmCost * dist(S, id, sp.wh)) * (c.country === wc.country ? 1 : CAP_SUP.customsPenalty); if (!best || score < best.score) best = { id, score }; }
  return best && best.id;
}
/* دورة التموين اليومية للقائد الواقف: يفرّغ في المخزن، ثم يشتري من المصدر ويعود */
function autoSupply(S, car) {
  const sp = car.sup, P = S.player, pr = P.props[sp.wh], g = sp.g; if (!sp || !GD[g]) return;
  if (!pr || !(pr.whs > 0)) { car.waiting = 'مخزنك في ' + S.cities[sp.wh].name + ' لم يعد موجوداً'; return; }
  const c = S.cities[car.city]; ctxFor(S, car.city); const go = dest => { const r = startTrip(S, car, dest, undefined, 'auto'); car.waiting = r.ok ? null : r.msg; };
  if (car.city === sp.wh) {
    const have = Math.floor(car.cargo[g] || 0);
    if (have >= 1) { const q = Math.min(have, Math.floor(storeRoom(S, sp.wh) / GD[g].w)); if (q >= 1) { const cost = takeBasis(car.basis, g, q); car.cargo[g] -= q; if (car.cargo[g] <= 0) delete car.cargo[g]; pr.store[g] = (pr.store[g] || 0) + q; addBasis(pr.basis || (pr.basis = {}), g, q, cost); sp.moved = (sp.moved || 0) + q; sp.trips = (sp.trips || 0) + 1; sp.spent = (sp.spent || 0) + cost; } }
    if ((pr.store[g] || 0) >= sp.target) { car.waiting = 'المخزن مكتفٍ'; return; }
    const src = supplySource(S, car, sp); if (!src) { car.waiting = 'لا مدينة تُباع فيها ' + GD[g].name; return; } return go(src);
  }
  if (sells(c, g)) {
    const stock = pr.store[g] || 0, carried = Math.floor(car.cargo[g] || 0), need = Math.max(0, sp.target - stock - carried), room = capOfCar(car) - loadOf(car), price = unitPrice(c, g);
    const q = Math.min(need, Math.floor(room / GD[g].w), Math.floor(Math.min(sp.budget, P.gold * CAP_SUP.cashShare) / Math.max(0.01, price)));
    if (q >= 1) { const res = buyUnits(S, { gold: Math.min(sp.budget, P.gold * CAP_SUP.cashShare) }, c, g, q, room, car.cargo, true); if (res.n >= 1) { P.gold -= res.cost; addBasis(car.basis, g, res.n, res.cost); } }
    if ((car.cargo[g] || 0) >= 1) return go(sp.wh);
    car.waiting = need < 1 ? 'المخزن مكتفٍ' : 'تعذّر الشراء: الميزانية أو السوق'; if (need < 1) return go(sp.wh); return;
  }
  const src = supplySource(S, car, sp); if (!src) { car.waiting = 'لا مدينة تُباع فيها ' + GD[g].name; return; } go(src);
}
Object.assign(A, {
  captainSupply(S, carId, whCity, g, target, budget) {
    const car = carById(S, carId); if (!car || !car.captain || car.main) return NO('التموين لقوافل يقودها قائد مستأجر');
    const pr = S.player.props[whCity]; if (!pr || !(pr.whs > 0)) return NO('لا مخزن لك في ' + (S.cities[whCity] ? S.cities[whCity].name : 'هذه المدينة')); if (!GD[g] || GD[g].live) return NO('اختر سلعة عادية لا ماشية');
    target = Math.floor(+target || 0); budget = Math.round(+budget || 0); if (target < 1 || target > Math.floor(storeCap(S, whCity) / GD[g].w)) return NO('اختر كمية مستهدفة تسعها سعة مخازنك'); if (budget < CAP_SUP.minBudget) return NO('الحد الأدنى لميزانية الرحلة ' + CAP_SUP.minBudget + ' ريال');
    const other = supplyOf(S, whCity, g); if (other && other.id !== car.id) return NO('قائد آخر (' + other.name + ') يموّن هذا المخزن بهذه السلعة');
    car.sup = { wh: whCity, g, target, budget, moved: 0, trips: 0, spent: 0 }; car.route = null; car.free = false; car.restUntil = 0; car.waiting = null;
    return OK(car.name + ' صار قائد تموين: يزوّد مخزنك في ' + S.cities[whCity].name + ' بـ' + GD[g].name + ' حتى ' + target + ' وحدة، بميزانية ' + budget + ' ريال للرحلة.');
  },
  captainMode(S, carId, mode, days) {
    const car = carById(S, carId); if (!car || !car.captain || car.main) return NO('هذا لقوافل يقودها قائد مستأجر');
    if (mode === 'free') { car.free = true; car.sup = null; car.route = null; car.restUntil = 0; car.waiting = null; return OK('صار ' + car.name + ' يتاجر بحرية: يختار أفضل صفقة بنفسه ويصلك دخله، وتدفع أجره اليومي.'); }
    if (mode === 'rest') {
      if (car.left > 0) return NO('ينتظر وصول القافلة أولاً لتُريحه'); const n = Math.max(CAP_REST.min, Math.min(CAP_REST.max, Math.round(days || CAP_REST.def)));
      car.restUntil = S.day + n; return OK('أرحتَ قائد ' + car.name + ' ' + n + ' أيام بنصف أجر، وتتعافى معنوياته أسرع، ثم يعود إلى عمله السابق.');
    }
    if (mode === 'stop') { car.route = null; car.sup = null; car.free = false; car.restUntil = 0; car.waiting = null; return OK('أوقفتَ ' + car.name + ': يقف في مكانه (وأجره يخفّ إلى الربع).'); }
    return NO('وضع غير معروف');
  },
});
