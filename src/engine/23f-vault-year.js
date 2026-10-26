/* ادخار24/أ-2ب: صافي دفتر الفترة، وحدود السنة الهجرية الفعلية. */
const VAULT_INCOME = ['realized', 'mudaraba', 'sukukProfit', 'governor', 'labor'];
// تكلفة البضاعة والضريبة والوكيل وحصة الشريك/الغياب محسوبة في realized، والأصول ليست مصروف ربح.
const VAULT_EXCLUDED_COST = ['purchases', 'assets', 'tax', 'agent', 'pactShare', 'awayYield', 'debtPaid'];
function vaultLedger(S) {
  const L = S.player.led, inc = L.inc || {}, exp = L.exp || {};
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  if (Object.values(inc).some(n => !finite(n)) || Object.values(exp).some(n => !finite(n))) return null;
  const profit = VAULT_INCOME.reduce((n, k) => n + (inc[k] || 0), 0) - Object.keys(exp).filter(k => !VAULT_EXCLUDED_COST.includes(k)).reduce((n, k) => n + exp[k], 0) - deferredWages(S);
  return Number.isFinite(profit) ? { profit, debt: Math.max(0, exp.debtPaid || 0) } : null;
}
const vaultDate = S => dateOf(S.cal ? S : Object.assign({}, S, { cal: { jd0: CAL.MIN, yr: 1 } }));
function vaultAnnualState(old) {
  const b = old.book;
  const book = b && ['start', 'year', 'net0', 'debt0', 'total0', 'drawn0'].every(k => Number.isFinite(b[k])) && Number.isInteger(b.year) && b.year > 0 && Number.isInteger(b.start) && b.start >= 0 && b.total0 >= 0 && b.drawn0 >= 0 ? { start: b.start, year: b.year, net0: b.net0, debt0: b.debt0, total0: b.total0, drawn0: b.drawn0 } : null;
  const years = (Array.isArray(old.years) ? old.years : []).filter(r => r && ['year', 'start', 'end', 'profit', 'afterDebt', 'deposited', 'drawn', 'balance'].every(k => Number.isFinite(r[k])) && r.year > 0 && r.start >= 0 && r.end >= r.start && r.deposited >= 0 && r.drawn >= 0 && r.balance >= 0).slice(0, 5).map(r => ({ year: r.year, start: r.start, end: r.end, profit: r.profit, afterDebt: r.afterDebt, deposited: r.deposited, drawn: r.drawn, balance: r.balance }));
  return { book, years };
}
function vaultYearStart(S) {
  const P = S.player;
  if (!P.save || P.save.book) return;
  const l = vaultLedger(S); if (!l) return;
  P.save.book = { start: S.day, year: vaultDate(S).year, net0: l.profit, debt0: l.debt, total0: P.save.total, drawn0: P.save.drawn };
}
function vaultYearQuote(S, plan) {
  const l = vaultLedger(S), d = vaultDate(S), b = plan.book;
  if (!l) return { ok: false };
  const profit = b ? l.profit - b.net0 : 0, afterDebt = profit - (b ? Math.max(0, l.debt - b.debt0) : 0);
  const deposited = b ? Math.max(0, plan.total - b.total0) : 0;
  const pending = Math.max(0, afterDebt * plan.pct / 100 - deposited);
  return { ok: true, year: b ? b.year : d.year, start: b ? b.start : S.day, profit, afterDebt, deposited, pending, proposed: plan.on && plan.mode === 'year' ? Math.min(pending, Math.max(0, S.player.wallet.sar - 200)) : 0, end: d.yearStart - (S.cal?.jd0 || CAL.MIN) + d.yearLen };
}
function vaultYearDay(S) {
  const P = S.player;
  if (!P.save?.book || vaultDate(S).year <= P.save.book.year) return;
  const q = vaultQuote(S); if (!q.ok || !q.period.ok) return;
  const b = q.plan.book, p = q.period;
  if (p.proposed > 0) { P.wallet.sar -= p.proposed; vaultCredit(S, p.proposed); }
  const plan = P.save, record = { year: b.year, start: b.start, end: S.day, profit: p.profit, afterDebt: p.afterDebt, deposited: plan.total - b.total0, drawn: plan.drawn - b.drawn0, balance: P.vault || 0 };
  plan.years = [record, ...(plan.years || [])].slice(0, 5);
  plan.book = null; vaultYearStart(S);
  news(S, 'حصّالة السنة ' + record.year + ': صافي الدفتر ' + fmtN(record.profit) + ' ريال، إيداعات ' + fmtN(record.deposited) + '، سحوبات ' + fmtN(record.drawn) + '، الرصيد ' + fmtN(record.balance) + (record.afterDebt <= 0 ? '. لم يُقتطع ادخار سنوي لعدم وجود ربح متاح بعد الدَّين.' : '.'), record.afterDebt < 0 ? '' : 'good');
}
