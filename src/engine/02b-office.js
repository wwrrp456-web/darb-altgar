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
  if (pr.mgr) wages += managerWage(pr.mgr);
  for (const f of P.factories) if (f.city === city && !(isAbroad(f) && f.crisis)) wages += RECIPES[f.recipe].wage * f.level;
  for (const car of P.caravans) if (car.city === city) {
    const active = car.left > 0 || car.route || capRole(car) === 'indep';
    wages += (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * wageMultOf(S) * (active ? 1 : WAGE.idle);
  }
  for (const sh of shipsOf(S)) if ((sh.city || sh.dest) === city) wages += (shipCrew(sh) * SAILOR_WAGE + (sh.captain?.wage || 0)) * (sh.city ? .5 : 1);
  const dues = (S.paymentDues || []).filter(d => d.city === city && d.amount > 0).map(d => ({ ...d }));
  const sum = kind => dues.filter(d => kind === 'all' || (kind === 'rent' ? d.kind === 'rent' : d.kind !== 'rent')).reduce((n, d) => n + d.amount, 0);
  const car = mainCar(S), present = car.city === city && car.left <= 0 && !S.road;
  return { ok: true, city, present, mode: wageMode(S,city), wages, rent, weekly: 7 * (wages + rent), balance: P.wallet.sar, dues, due: sum('all'), wageDue: sum('wages'), rentDue: sum('rent') };
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

/* سياسة الأجور وحدها؛ الإيجار والصيانة يستمران تلقائياً. */
function wageMode(S, city) { const mode=S.player.props[city]?.wageMode;return mode==='manual'?'manual':mode==='steward'&&stewardOf(S,city)?'steward':'auto'; }
function deferredWages(S, city, kind) {
 return (S.paymentDues || []).filter(d=>(city==null||d.city===city)&&(!kind||d.kind===kind)).reduce((n,d)=>n+Math.min(d.amount,Math.max(0,d.deferredWages||0)),0);
}
function setWageMode(S, city, mode) {
 if(S.phase<2||!Object.hasOwn(S.cities,city)||!Object.hasOwn(S.player.props,city))return NO('تحتاج ممتلكات في المنطقة من الطور2.');
 if(!['auto','manual','steward'].includes(mode))return NO('طريقة سداد غير معروفة.');
 if(mode==='steward'){const m=stewardOf(S,city);if(!m){S.player.props[city].wageMode='auto';news(S,'لا أمين منطقة مؤهل في '+S.cities[city].name+'؛ بقي سداد الأجور تلقائياً.');return OK('لا أمين مؤهل؛ السداد تلقائي.');}if(!m.policy?.pay||!(m.policy.limit>0))return NO('فعّل تفويض السداد وحدّه في بطاقة الأمين أولاً.');S.player.props[city].wageMode='steward';return OK('سداد الأجور عبر الأمين ضمن الحد الذي اخترته.');}
 S.player.props[city].wageMode=mode;
 return OK(mode==='manual'?'السداد يدوي؛ تتراكم الأجور حتى تسددها من المكتب، والتأخر يؤثر في العاملين.':'السداد تلقائي للأجور الجديدة؛ المتأخر المسجل يبقى مستحقاً حتى تسدده.');
}
