/* ---------- التمويل المشروع (بدل الفائدة): مضاربة بربح مشترك، ومرابحة بيعاً بالأجل بهامش معلوم سلفاً، وقرض حسن من زعيم موثوق، وصكوك مشاركة في قافلة.
   لا زيادة مشروطة على قرض، ولا غرامة تتراكم عند التأخر. الأرباح والخسائر تأتي من نشاط تجاري حقيقي ---------- */
/* الأجر المعلوم: أجر الحارس والطاقم يُعرض كاملاً قبل التوظيف: ما يُدفع مرة واحدة، وما يُدفع يومياً أثناء السفر، وما يُدفع حين تقف القافلة (قاعدة الأجير، اعتمدها المختص) */
const WAGE = { guard: 5, crew: 1.5, idle: 0.25, guardHire: 300, crewHire: 50 };
const wageMultOf = S => 1 + 0.06 * (S.player.caravans.length - 1);
function staffWage(S, kind) { const m = wageMultOf(S), d = Math.round(WAGE[kind] * m * 100) / 100; return { once: WAGE[kind + 'Hire'], day: d, idle: Math.round(d * WAGE.idle * 100) / 100 }; }
const candWage = cd => Math.round((4 + 2 * (cd.trade + cd.nav + cd.combat) / 3) * (cd.role === 'loyal' ? 0.9 : 1) * 10) / 10;
const FIN = { mud: { share: 0.7, fee: 0.01, setback: 0.004, loss: 0.012 }, mur: { terms: { 30: 0.06, 60: 0.11, 90: 0.16 }, limit: 0.5 }, qard: { trust: 20, base: 1000, perTrust: 100, max: 4000, days: 60 }, sukuk: { amt: 5000, days: 20, share: 0.8, lo: -0.15, hi: 0.35 } };
const bankDebt = S => S.player.bank.loans.reduce((a, l) => a + l.amt, 0);
const bankLate = S => S.player.bank.loans.some(l => (l.late || 0) > 0);
function finDay(S) {
  const P = S.player, B = P.bank;
  for (const city in B.dep) {
    const c = S.cities[city]; if (!c || !(B.dep[city] > 0)) continue;
    const prosp = clamp(((c.pop[2] + c.pop[3]) / popTotal(c)) * 2 * 0.5 + c.sat.food * 0.5, 0, 1);
    let gross = B.dep[city] * (0.0004 + 0.0008 * prosp * (c.ev && c.ev.k === 'war' ? 1.8 : 1)) / FIN.mud.share * (0.5 + rndB(S));
    if (rndB(S) < FIN.mud.setback) { const l = B.dep[city] * FIN.mud.loss; B.dep[city] -= l; sink(S, 'mudarabaLoss', l); P.led.exp.mudarabaLoss = (P.led.exp.mudarabaLoss || 0) + l; news(S, 'خسرت مضاربتك في ' + c.name + ' نحو ' + fmtN(l) + ' ريال: رأس المال غير مضمون، وهذه طبيعة الشراكة في الربح والخسارة.', 'bad'); learnReact(S, 'mudLoss', 30); continue; }
    const mine = gross * FIN.mud.share * (S.awaySim ? AWAY_YIELD : 1); B.dep[city] += mine; fauc(S, 'mudaraba', mine); P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) + mine;
  }
  for (const l of B.loans) {
    if(l.src==='salem'){earlyQardDay(S,l);continue;}
    if (l.due == null) { l.due = S.day + 30; l.type = l.type || 'old'; }
    if (S.day < l.due) continue;
    const pay = Math.min(P.gold, l.amt); if (pay > 0) { P.gold -= pay; l.amt -= pay; P.led.exp.debtPaid = (P.led.exp.debtPaid || 0) + pay; }
    if (l.amt > 0.5) {
      l.late = (l.late || 0) + 1;
      if (l.late === 1) { news(S, 'حلّ أجل ' + (l.type === 'qard' ? 'القرض الحسن' : 'دَين المرابحة') + ' ولم يكفِ رصيدك. لا غرامة عليك، لكن الوفاء واجب ولن تُمنح تمويلاً جديداً حتى تسدّد.', 'bad'); learnReact(S, 'mdLate', 10); S.pause = true; }
      if (l.late % 10 === 0) { repOf(P).broke = (repOf(P).broke || 0) + 1; if (l.type === 'qard' && l.city && S.bosses[l.city]) S.bosses[l.city].trust -= 8; }
    }
  }
  B.loans = B.loans.filter(l => l.src==='salem'?l.amt>1e-8:l.amt>0.5);
  B.bonds = B.bonds.filter(b => {
    if (S.day < b.due) return true;
    const r = FIN.sukuk.lo + (FIN.sukuk.hi - FIN.sukuk.lo) * rndB(S), back = r > 0 ? b.amt * (1 + FIN.sukuk.share * r * (S.awaySim ? AWAY_YIELD : 1)) : b.amt * (1 + r);
    P.led.inc.sukukProfit = (P.led.inc.sukukProfit || 0) + back - b.amt;
    P.gold += back; P.led.inc.bonds = (P.led.inc.bonds || 0) + back; if (back < b.amt) sink(S, 'sukukLoss', b.amt - back);
    news(S, r > 0 ? 'ربحت صكّ المشاركة في القافلة التجارية: عاد ' + fmtN(back) + ' ريال (حصتك ' + Math.round(FIN.sukuk.share * 100) + '٪ من الربح).' : 'خسرت القافلة التجارية التي شاركتَ فيها فنقص رأس مالك إلى ' + fmtN(back) + ' ريال: الخسارة على صاحب المال.', r > 0 ? 'good' : 'bad'); S.pause = true;
    return false;
  });
}
function murabahaQuote(S, g, qty, term) {
  const car = mainCar(S), c = S.cities[car.city], m = FIN.mur.terms[term]; qty = Math.floor(+qty || 0);
  if (m == null) return { ok: false, msg: 'أجل غير معروف' }; if (!GD[g] || !(qty >= 1)) return { ok: false, msg: 'اختر سلعة وكمية' }; if (!sells(c, g)) return { ok: false, msg: GD[g].name + ' لا تُباع هنا' };
  if (GD[g].live) return { ok: false, msg: 'المرابحة للسلع العادية لا للمواشي' };
  const fit = Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w), q = quoteBuy(S, car.city, g, Math.min(qty, fit)); if (!q || q.n < 1) return { ok: false, msg: 'لا مخزون أو لا مكان في القافلة' };
  const face = q.cost * (1 + m); return { ok: true, n: q.n, cost: q.cost, markup: m, face, term, profit: face - q.cost };
}
function playerDay(S) {
  const P = S.player, nw = netWorth(S), wageMult = wageMultOf(S);
  shipDay(S);
  for (const id in P.props) { const pr = P.props[id]; if (!pr.ins) continue; const prem = insPrem(S, id); if (P.gold < prem) { pr.ins = null; news(S, 'انتهى اشتراكك في صندوق التكافل عن ممتلكاتك في ' + S.cities[id].name + ' لعجزك عن التبرع اليومي.', 'bad'); continue; } tkContribute(S, pPay(S, 'takaful', prem)); }
  for (const car of P.caravans) {
    const wage = (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * wageMult + (mountOf(car) ? mountOf(car).up : 0);
    const active = car.left > 0 || car.route || capRole(car) === 'indep', owed = active ? wage : wage * WAGE.idle, paidW = payObligation(S, 'wages', owed, car.city, 'caravan', car, 'أجور طاقم القافلة', (mountOf(car) ? mountOf(car).up : 0) * (active ? 1 : WAGE.idle));
    if (car.captain) { const cp = car.captain; if (cp.loyal == null) cp.loyal = 70; if (paidW < owed - 1e-9) cp.loyal = Math.max(0, cp.loyal - 3); else cp.loyal = Math.min(100, cp.loyal + (cp.role === 'loyal' ? 0.4 : 0.25) + (cp.raise > 0 ? 0.1 : 0)); if (cp.loyal < CAP_QUIT && !car.main && S.learn && S.learn.char) { news(S, 'ترك ' + cp.name + ' العمل: ولاؤه انهار بسبب تأخّر أجره. وظّف غيره وأكرم من بعده.', 'bad'); learnReact(S, 'capQuit'); car.captain = null; car.route = null; } }
    pPay(S, 'wear', (active ? 1 : 0.25) * car.carts * 0.7 * wageMult, true);
    if (car.left > 0) {
      car.left--; car.supplies = Math.max(0, car.supplies - car.crew * 0.12);
      car.morale = Math.max(0, car.morale - (car.hungry ? 3 : 0.8));
      for (const g in car.cargo) {
        const rate = GD[g].spoil * (1 - 0.1 * navOf(car)) * (car.hungry && GD[g].live ? 2 : 1); if (!rate) continue;
        const loss = car.cargo[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
        if (n) { car.cargo[g] = Math.max(0, car.cargo[g] - n); sink(S, 'spoilage', n * mid(g)); }
      }
      for (const g in (car.herd || {})) {
        const rate = GD[g].spoil * spoilMul(car, g) * 0.7 * (car.hungry ? 2 : 1); if (!rate || !car.herd[g]) continue;
        const loss = car.herd[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
        if (n) { const b0 = car.herd[g]; car.herd[g] = Math.max(0, car.herd[g] - n); herdScale(car, g, b0); sink(S, 'spoilage', n * mid(g)); }
      }
      for (const g in (car.herd || {})) if (BREED[g] && GD[g].hu) breedStep(S, car, g, car.hungry ? 0 : ROAD_BREED, herdCap(car) - herdUnits(car), GD[g].hu * 0.5, ROAD_YMORT * (car.hungry ? 2 : 1));
      if (rnd(S) < 0.05 * (1 - 0.1 * navOf(car)) * (S.awaySim ? AWAY_RISK : 1)) { car.left++; car.total++; if (car.main) news(S, 'عاصفة رملية أخّرت قافلتك يوماً.', 'bad'); }
      syncBasis(car);
      if (car.left === 0) arrive(S, car);
    } else {
      car.morale = Math.min(100, car.morale + 5);
      if (!S.awaySim || S.captainAuto) { if (car.route && car.captain) autoRoute(S, car); else if (!S.captainAuto && !car.route && capRole(car) === 'indep' && !car.main) autoIndep(S, car); }
    }
  }
  shopsDay(S);
  bossesDay(S);
  // مصانع
  for (const c of Object.values(S.cities)) c.factJobs = 0;
  for (const f of P.factories.slice()) factoryDay(S, f);
  for (const city in P.props) if (P.props[city].mgr) mgrDay(S, city, P.props[city]);
  finDay(S); tkDay(S);
  if (S.phase >= 3 && nw > 40000) pPay(S, 'wealthLevy', (nw - 40000) * 0.0006, true);
}

