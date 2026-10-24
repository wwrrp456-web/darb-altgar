/* دفتر الالتزامات: المبالغ الفعلية فقط، دون تغيير الخصم أو سياسة المغادرة. */
const PAYMENT_CATS = ['rent', 'staff', 'wages', 'upkeep', 'wear', 'farm'];
function paymentRecord(S, cat, paid) {
  if (!PAYMENT_CATS.includes(cat)) return;
  const book = S.paymentBook || (S.paymentBook = { since: S.day, days: [] });
  let row = book.days[book.days.length - 1];
  if (!row || row.day !== S.day) {
    book.days = book.days.filter(r => r.day >= S.day - 59 && r.day <= S.day).slice(-59);
    row = { day: S.day, paid: {} }; book.days.push(row);
  }
  if (paid > 0) row.paid[cat] = (row.paid[cat] || 0) + paid;
  if (book.days.length > 60) book.days.shift();
}
function paymentHistory(S, span = 30) {
  const book = S.paymentBook; if (!book) return [];
  const first = Math.max(book.since, S.day - Math.min(60, Math.max(1, span)) + 1), rows = [];
  for (let day = S.day; day >= first; day--) {
    const row = book.days.find(r => r.day === day);
    rows.push({ day, paid: row ? Object.assign({}, row.paid) : {} });
  }
  return rows;
}
function payObligation(S, cat, amount, city, kind, target, label) {
  const paid = pPay(S, cat, amount, true), short = amount - paid;
  if (short > 1e-6) {
    const dues = S.paymentDues || (S.paymentDues = []);
    let due = dues.find(d => d.id === target.paymentDue);
    if (!due) {
      const id = (S.paymentNext || 0) + 1; S.paymentNext = id; target.paymentDue = id;
      due = { id, city, kind, cat, label, amount: 0, unknownPast: !!(target.arrears || target.late), since: S.day }; dues.push(due);
    }
    due.amount += short;
  }
  return paid;
}
function paymentTarget(S, due) {
  const pr = S.player.props[due.city];
  const targets = due.kind === 'rent' ? pr && pr.shops : due.kind === 'staff' ? pr && pr.staff : due.kind === 'manager' ? pr && [pr.mgr] : due.kind === 'factory' ? S.player.factories : due.kind === 'caravan' ? S.player.caravans : S.player.ships;
  return (targets || []).find(t => t && t.paymentDue === due.id);
}
function settlePayment(S, id) {
  const due = (S.paymentDues || []).find(d => d.id === id);
  if (!due || !(due.amount > 0) || !Number.isFinite(due.amount)) return NO('لا متأخر مسجل لهذا البند.');
  if (S.player.gold + 1e-9 < due.amount) return NO('رصيد الريال لا يكفي لسداد المتأخر المسجل: ' + due.amount.toFixed(2) + ' ريال.');
  const target = paymentTarget(S, due), paid = pPay(S, due.cat, due.amount, true);
  due.amount = Math.max(0, due.amount - paid);
  if (due.amount < 1e-6) {
    if (target) {
      if (due.kind === 'rent') target.rentPaid = (target.rentPaid || 0) + paid;
      if (!due.unknownPast) { if (due.kind === 'rent') target.arrears = 0; else if ('late' in target) target.late = 0; }
      delete target.paymentDue;
    }
    S.paymentDues = S.paymentDues.filter(d => d !== due);
  }
  return OK('دفعت ' + paid.toFixed(2) + ' ريال من رصيدك لسداد المتأخر المسجل.' + (due.unknownPast ? ' مبلغ التأخر الأقدم غير مسجل: للتأكد.' : ''));
}
function paymentMigrate(S) {
  const book = S.paymentBook;
  if (book) {
    if (!Number.isInteger(book.since) || !Array.isArray(book.days)) delete S.paymentBook;
    else {
      book.since = Math.max(0, Math.min(S.day, book.since));
      book.days = book.days.filter(r => r && Number.isInteger(r.day) && r.day >= S.day - 59 && r.day <= S.day && r.paid && typeof r.paid === 'object').slice(-60);
      for (const r of book.days) for (const k of Object.keys(r.paid)) if (!PAYMENT_CATS.includes(k) || !Number.isFinite(r.paid[k]) || r.paid[k] < 0) delete r.paid[k];
    }
  }
  if (S.paymentDues) {
    if (!Array.isArray(S.paymentDues)) S.paymentDues = [];
    S.paymentDues = S.paymentDues.filter(d => d && Number.isSafeInteger(d.id) && d.id > 0 && Number.isFinite(d.amount) && d.amount > 0 && PAYMENT_CATS.includes(d.cat) && ['rent','staff','manager','factory','caravan','ship'].includes(d.kind));
    S.paymentNext = S.paymentDues.reduce((max, d) => Math.max(max, d.id), Number.isSafeInteger(S.paymentNext) ? S.paymentNext : 0);
  }
}
