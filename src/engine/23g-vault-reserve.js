/* احتياطي الطوارئ قراءة فقط، بلا تقدير دخل مستقبلي أو خصم تلقائي. */
function vaultGoal(S) {
  const tripCost = wealthStats(S).tripCost, target = 3 * tripCost, balance = S.player.vault || 0;
  return { tripCost, target, balance, progress: Math.min(1, Math.max(0, balance / target)), met: balance >= target };
}
function inCrisis(S) {
  const P = S.player, cash = P.wallet.sar, car = mainCar(S), due = (S.paymentDues || []).filter(d => d.amount > 0), unpaid = due.reduce((n,d)=>n+d.amount,0);
  const result = (code, label, need) => ({ code, label, need: Math.max(0, need), suggested: Math.min(P.vault || 0, Math.max(0, need - cash)) });
  if (unpaid > 0) return result('wages', 'مستحقات متأخرة مسجلة', unpaid);
  const oldLate = P.caravans.some(c=>c.late>0) || (P.ships||[]).some(c=>c.late>0) || P.factories.some(f=>f.late>0) || Object.values(P.props).some(pr=>(pr.staff||[]).some(w=>w.late>0));
  if (oldLate) return result('wages', 'أجور متأخرة؛ راجع سجل الالتزامات', vaultGoal(S).tripCost);
  const fd = P.famDebt, family = fd && fd.left > 0 && Number.isFinite(fd.due) && fd.due-S.day <= 5 ? Math.max(0, Math.min(fd.left, fd.amt0 * BAB.DEBT.installPct) - (fd.mPaid || 0)) : 0;
  const debt = P.bank.loans.filter(l=>l.amt>0&&Number.isFinite(l.due)&&l.due-S.day<=5).reduce((n,l)=>n+l.amt,0) + family;
  if (debt > cash) return result('debt', 'سداد قريب لا يغطيه رصيد الريال', debt);
  if (S.road) return result('attack', 'خطر يعترض القافلة في الطريق', Math.max(vaultGoal(S).tripCost, .08*valueOf(holdings(car))));
  const city = car && S.cities[car.city];
  if (city?.ev && ['bust','plague','war'].includes(city.ev.k)) return result(city.ev.k, {bust:'كساد في سوق القافلة',plague:'وباء في مدينة القافلة',war:'حصار قرب القافلة'}[city.ev.k], vaultGoal(S).tripCost);
  if (city?.sh && ['drought','flood','famine','fire'].includes(city.sh.k)) return result(city.sh.k, SHOCKS[city.sh.k]?.name || 'حدث يضغط على تجارتك', vaultGoal(S).tripCost);
  const shock=(S.shocks||[]).find(sh=>sh.st==='on'&&['drought','flood','famine','fire','dump','sickness','monopoly'].includes(sh.k)&&(sh.city===car?.city||!!P.props[sh.city]||!!sh.country&&sh.country===city?.country));
  if(shock)return result(shock.k,SHOCKS[shock.k]?.name||'حدث سلبي قائم',vaultGoal(S).tripCost);
  const recent = (S.news || []).some(n => n.d >= S.day-5 && n.k==='bad' && /نُهب|نهب|العاصفة|غرقت|خسرت.*قافل/.test(n.t));
  if (recent) return result('loss', 'خسارة قافلة حديثة مسجلة', vaultGoal(S).tripCost);
  const need = vaultGoal(S).tripCost;
  return cash < need ? result('trip', 'رصيد الريال أقل من كلفة رحلة تقديرية', need) : null;
}
