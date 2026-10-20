/* ---------- السفر البحري (المرحلة 1): موانئ وسفينة تُشترى تُبحر بها القافلة بين الموانئ ----------
   الفرق عن البر: سعة أكبر وسرعة أعلى في المسافات الطويلة، لكن رسوم ميناء، ورياح موسمية تحدد موسم الإبحار بين البحار، وعواصف وقراصنة بدل قطاع الطرق.
   موانئ اللعبة: جدة وجازان (البحر الأحمر) والإسكندرية (المتوسط) ومومباي وكلكتا (الهند) وكانتون وشنغهاي (الصين). لا ميناء لفارس. */
// الموانئ PORTS معرَّفة في 17-shocks.js (نفس موانئ صدمة القراصنة)
const SEA_REGION = { jeddah: 0, jazan: 0, alex: 0, mumbai: 1, kolkata: 1, guangzhou: 2, shanghai: 2 };
const SEA = { phase: 3, feePct: 0.012, feeMin: 25, sellBack: 0.7, baseRisk: 0.1, offRisk: 0.1, offDays: 1.35, YEAR_HALF: 177 };
const SHIPS = { dhow: { name: 'سنبوق', cap: 220, cost: 3200, speed: 1.4 } };
const isPort = id => PORTS.indexOf(id) >= 0;
const shipsOf = S => S.player.ships || (S.player.ships = []);
const shipAt = (S, city) => shipsOf(S).find(x => x.city === city) || null;
const shipOf = (S, car) => (car && car.sea ? shipsOf(S).find(x => x.id === car.sea.ship) || null : null);
/* الرياح الموسمية بين البحار: من البحر الأحمر إلى الهند ثم الصين في النصف الأول من السنة، وعودةً في النصف الثاني. داخل البحر الواحد لا تأثير */
function monsoonOf(S, from, to) {
  const rf = SEA_REGION[from], rt = SEA_REGION[to]; if (rf === rt) return { dir: 'calm', fair: true };
  const east = rt > rf, firstHalf = (S.day % YEAR) < SEA.YEAR_HALF;
  return { dir: east ? 'out' : 'back', fair: east === firstHalf };
}
function seaDays(S, car, ship, a, b) {
  const sp = SPEED * ship.speed * perkMul(S, 'speed') * (1 + 0.06 * navOf(car)) * (car.morale < 40 ? 0.85 : 1), m = monsoonOf(S, a, b);
  return Math.max(1, Math.ceil(dist(S, a, b) / sp * (m.fair ? 1 : SEA.offDays)));
}
/* خطة الإبحار: تُرجع سبب المنع أو التفاصيل (مدة، رسم، مؤن، خطر) للمقارنة بالبر */
function seaPlan(S, car, dest) {
  const from = car.city, r = { ok: false, msg: '' };
  if (S.phase < SEA.phase) { r.msg = 'السفر بحراً يُفتح في الطور ' + SEA.phase; return r; }
  if (car.left > 0) { r.msg = 'القافلة في الطريق'; return r; }
  if (!isPort(from) || !isPort(dest)) { r.msg = 'الإبحار بين الموانئ فقط'; return r; }
  if (from === dest) { r.msg = 'أنت في هذا الميناء'; return r; }
  const ship = shipAt(S, from), tb = travelBlock(S, car, dest), sb = car.main ? shockBlock(S, from, dest) : null;
  if (tb) { r.msg = tb; return r; } if (sb) { r.msg = sb; return r; }
  if (!ship) { r.msg = 'لا سفينة لك راسية في ' + S.cities[from].name; r.needShip = true; return r; }
  const sd = SHIPS[ship.type], ld = loadOf(car);
  if (herdUnits(car) > 0) { r.msg = 'القطيع الماشي لا يُبحر: بِعه أو أنزله أولاً'; return r; }
  if (ld > sd.cap) { r.msg = 'حمولتك ' + Math.round(ld) + ' تزيد على سعة السفينة ' + sd.cap + ': أنزل ' + Math.ceil(ld - sd.cap) + ' في المخزن أو بِعها'; return r; }
  const m = monsoonOf(S, from, dest), days = seaDays(S, car, sd, from, dest), need = supplyNeed(car, days), c = S.cities[from], val = valueOf(holdings(car));
  const fee = Math.max(SEA.feeMin, SEA.feePct * val), prov = need * unitPrice(c, 'wheat') * perkMul(S, 'prov'), risk = SEA.baseRisk + (m.fair ? 0 : SEA.offRisk);
  return { ok: true, ship, days, need, fee, prov, risk, monsoon: m, cap: sd.cap, load: ld };
}
function startSail(S, car, dest) {
  const p = seaPlan(S, car, dest); if (!p.ok) return { ok: false, msg: p.msg };
  const c = S.cities[car.city]; ctxFor(S, car.city);
  if (S.player.gold < p.fee + p.prov * 0.3) return { ok: false, msg: 'رصيدك لا يكفي رسم الميناء والمؤن (' + Math.ceil(p.fee + p.prov * 0.3) + ')' };
  car.hungry = S.player.gold < p.fee + p.prov;
  pPay(S, 'portfee', p.fee, true); pPay(S, 'provisions', Math.min(p.prov, S.player.gold), true);
  c.stock.wheat = Math.max(0, c.stock.wheat - p.need);
  car.supplies = p.need; car.from = car.city; car.dest = dest; car.left = p.days; car.total = p.days;
  car.sea = { ship: p.ship.id, from: car.city }; p.ship.city = null; p.ship.dest = dest;
  return { ok: true, days: p.days, fee: Math.ceil(p.fee), cost: Math.ceil(p.prov) };
}
/* عند الوصول: ترسو السفينة، وقد تقع عاصفة (تُلقى بعض البضاعة) أو يهاجم قراصنة (يختار اللاعب كما مع قطاع الطرق) */
function seaArrive(S, car, to, sea) {
  const ship = shipsOf(S).find(x => x.id === sea.ship); if (ship) { ship.city = to; ship.dest = null; }
  const m = monsoonOf(S, sea.from, to), p = SEA.baseRisk + (m.fair ? 0 : SEA.offRisk);
  if (rnd(S) >= p) { if (car.main) S.seaRes = { k: 'fair', msg: m.fair ? 'رياح مواتية، وصلتَ سالماً إلى ' + S.cities[to].name : 'وصلتَ سالماً رغم مخالفة الموسم' }; return; }
  if (rnd(S) < 0.5) { // عاصفة
    const f = clamp(rr(S, 0.04, 0.14) * (1 - 0.1 * navOf(car)), 0.02, 0.2); let lost = 0;
    for (const g in car.cargo) { const l = Math.floor(car.cargo[g] * f); car.cargo[g] -= l; lost += l * mid(g); }
    const comp = car.insured ? tkClaim(S, lost, TK.cover) : 0; sink(S, 'storm', lost); S.player.led.exp.storm = (S.player.led.exp.storm || 0) + lost;
    news(S, (car.main ? '' : car.name + ': ') + 'عاصفة في عرض البحر ألقت نحو ' + Math.round(f * 100) + '٪ من البضاعة قبل ' + S.cities[to].name + (comp ? ' (عوّضك صندوق التكافل)' : '') + '.', 'bad');
    if (car.main) { S.seaRes = { k: 'storm', msg: 'عاصفة ألقت نحو ' + Math.round(f * 100) + '٪ من بضاعتك' }; S.pause = true; learnReact(S, 'seaStorm', 20); }
    syncBasis(car); return;
  }
  const B = rr(S, 5, 18); // قراصنة
  if (car.main && roadOn(S) && !S.road) { S.road = { k: 'pirates', day: S.day, car: car.id, to, from: sea.from, B }; S.pause = true; learnReact(S, 'seaPirates'); }
  else banditFight(S, car, to, B, 1, 'pirates');
}
