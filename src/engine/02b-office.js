/* مكتب21: معاينة وسداد المتأخر الفعلي في المنطقة؛ لا خصم تقديري أو رجعي. */
function regionalPaymentRecord(S, city, cat, amount, via = 'auto') {
  if (!Object.hasOwn(S.cities, city) || !(amount > 0) || !PAYMENT_CATS.includes(cat)) return;
  const book = S.paymentBook, row = book?.days[book.days.length - 1];
  if (!row || row.day !== S.day) return;
  const regions = row.regions || (row.regions = {}), r = regions[city] || (regions[city] = { paid: {}, via: {} });
  r.paid[cat] = (r.paid[cat] || 0) + amount;
  r.via[via] = (r.via[via] || 0) + amount;
}
function regionalOfficeQuote(S, city) {
  const c = S.cities[city], P = S.player, pr = P.props[city];
  if (!Object.hasOwn(S.cities, city) || !Object.hasOwn(P.props, city) || !pr) return { ok: false, msg: 'لا مكتب لممتلكاتك في هذه المنطقة.' };
  let wages = 0, rent = 0;
  for (const sh of pr.shops) if (shKind(sh) !== 'own') rent += sh.rent;
  for (const w of pr.staff || []) if (!(w.free > S.day + 1)) wages += wkWage(S, c, { ...w, days: w.days + 1 });
  if (pr.mgr) wages += MGR[pr.mgr.lv].wage;
  for (const f of P.factories) if (f.city === city && !(isAbroad(f) && f.crisis)) wages += RECIPES[f.recipe].wage * f.level;
  for (const car of P.caravans) if (car.city === city) {
    const active = car.left > 0 || car.route || capRole(car) === 'indep';
    wages += (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * wageMultOf(S) * (active ? 1 : WAGE.idle);
  }
  for (const sh of shipsOf(S)) if ((sh.city || sh.dest) === city) wages += (shipCrew(sh) * SAILOR_WAGE + (sh.captain?.wage || 0)) * (sh.city ? .5 : 1);
  const dues = (S.paymentDues || []).filter(d => d.city === city && d.amount > 0).map(d => ({ ...d }));
  const sum = kind => dues.filter(d => kind === 'all' || (kind === 'rent' ? d.kind === 'rent' : d.kind !== 'rent')).reduce((n, d) => n + d.amount, 0);
  const car = mainCar(S), present = car.city === city && car.left <= 0 && !S.road;
  return { ok: true, city, present, wages, rent, weekly: 7 * (wages + rent), balance: P.wallet.sar, dues, due: sum('all'), wageDue: sum('wages'), rentDue: sum('rent') };
}
function regionalPaymentHistory(S, city, span = 30) {
  return paymentHistory(S, span).map(row => {
    const source = S.paymentBook.days.find(r => r.day === row.day)?.regions?.[city];
    return { day: row.day, paid: { ...source?.paid }, via: { ...source?.via } };
  });
}
function officePay(S, city, kind) {
  if (!['wages', 'rent', 'all'].includes(kind)) return NO('اختر بند السداد.');
  const q = regionalOfficeQuote(S, city);
  if (!q.ok) return NO(q.msg);
  if (!q.present) return NO('السداد من المكتب يتطلب حضور قافلتك الرئيسية في المنطقة.');
  const selected = q.dues.filter(d => kind === 'all' || (kind === 'rent' ? d.kind === 'rent' : d.kind !== 'rent'));
  const total = selected.reduce((n, d) => n + d.amount, 0);
  if (!(total > 0)) return NO('لا متأخر مسجل لهذا البند.');
  if (q.balance + 1e-9 < total) return NO('رصيد الريال لا يكفي؛ لم يُخصم شيء.');
  const T = JSON.parse(save(S)); attachWallet(T); const context = T.ctxCur; T.ctxCur = 'sar';
  for (const due of selected) { const r = settlePayment(T, due.id, 'office'); if (!r.ok) return r; }
  T.ctxCur = context; Object.assign(S, T); attachWallet(S);
  return { ok: true, paid: total, msg: 'سددت من المكتب ' + total.toFixed(2) + ' ريال من المتأخر المسجل في ' + S.cities[city].name + '.' };
}
