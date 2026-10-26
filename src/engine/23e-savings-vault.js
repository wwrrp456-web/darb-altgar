/* الحصّالة24: نقل وسجل وخطة ادخار مستقلة من ربح البيع بعد الدَّين. */
const VAULT_HISTORY_MAX = 50;
const vaultMoney = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
function vaultState(S) {
  const P = S.player, old = P.save || {}, balance = vaultMoney(P.vault) ? P.vault : 0;
  const total = vaultMoney(old.total) ? old.total : 0, drawn = vaultMoney(old.drawn) ? old.drawn : 0;
  const opening = vaultMoney(old.opening) ? old.opening : Math.max(0, balance + drawn - total);
  const hist = (Array.isArray(old.hist) ? old.hist : []).filter(h => h && Number.isInteger(h.day) && h.day >= 0 && ['opening', 'deposit', 'withdrawal'].includes(h.type) && vaultMoney(h.amount) && vaultMoney(h.balance)).slice(0, VAULT_HISTORY_MAX).map(h => ({ day: h.day, type: h.type, amount: h.amount, balance: h.balance, reason: ['manual', 'crisis', 'opportunity', 'all', 'legacy', 'profit'].includes(h.reason) ? h.reason : 'manual' }));
  if (!P.save && balance > 0) hist.push({ day: S.day, type: 'opening', amount: balance, balance, reason: 'legacy' });
  return { on: typeof old.on === 'boolean' ? old.on : balance > 0 || !!P.famDebt?.plan, pct: [5, 10, 15].includes(old.pct) ? old.pct : 10, mode: old.mode === 'year' ? 'year' : 'sale', total, drawn, opening, hist };
}
function vaultCredit(S, amount) {
  if (!vaultMoney(amount) || amount <= 0) return;
  const P = S.player, plan = vaultState(S);
  P.vault = (P.vault || 0) + amount; P.save = plan; plan.total += amount;
  plan.hist.unshift({ day: S.day, type: 'deposit', amount, balance: P.vault, reason: 'profit' });
  plan.hist = plan.hist.slice(0, VAULT_HISTORY_MAX);
}
function vaultMigrate(S) {
  const P = S.player;
  if (P.save || P.vault > 0 || P.famDebt?.plan) P.save = vaultState(S);
}
function vaultQuote(S) {
  const P = S.player;
  if (!vaultMoney(P.vault == null ? 0 : P.vault) || !Number.isFinite(P.wallet?.sar)) return { ok: false, msg: 'تعذرت قراءة رصيد الحصّالة والمحفظة' };
  return { ok: true, balance: P.vault || 0, cash: P.wallet.sar, plan: vaultState(S) };
}
function vaultDraw(S, amount, reason = 'manual') {
  const q = vaultQuote(S);
  if (!q.ok) return NO(q.msg);
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return NO('اكتب مبلغ سحب موجباً');
  if (amount > q.balance) return NO('رصيد الحصّالة لا يكفي للمبلغ المطلوب');
  if (!['manual', 'crisis', 'opportunity', 'all'].includes(reason)) return NO('سبب السحب غير صالح');
  if (!Number.isFinite(q.cash + amount) || !Number.isFinite(q.plan.drawn + amount)) return NO('تعذر تسجيل مبلغ السحب');
  const P = S.player;
  P.vault = q.balance - amount; P.wallet.sar = q.cash + amount;
  P.save = q.plan; P.save.drawn += amount;
  P.save.hist.unshift({ day: S.day, type: 'withdrawal', amount, balance: P.vault, reason });
  P.save.hist = P.save.hist.slice(0, VAULT_HISTORY_MAX);
  return Object.assign(OK('سحبتَ ' + fmtN(amount) + ' ريالاً من الحصّالة'), { amount, balance: P.vault });
}

/* لا يُفعَّل وضع السنة من الواجهة قبل تسليم حسابه؛ نحتفظ به للحفظ القديم. */
function savingsPlan(S, on, pct, mode) {
  if (!S.learn?.char || !(S.learn.intro >= 1)) return NO('أكمل درس المستوى 1 أولاً');
  if (typeof on !== 'boolean' || ![5, 10, 15].includes(pct) || mode !== 'sale') return NO('اختر نسبة ادخار صحيحة من كل بيع');
  const q = vaultQuote(S); if (!q.ok) return NO(q.msg);
  S.player.save = Object.assign(q.plan, { on, pct, mode });
  return OK(on ? 'ادخار ' + pct + '٪ من ربح البيع بعد سداد الدَّين، مع إبقاء 200 ريال للتشغيل' : 'أوقفت الادخار؛ رصيد الحصّالة محفوظ وخطة الدَّين مستقلة');
}
function savingsSale(S, profit, debtPaid) {
  const P = S.player;
  // الحقل اختياري: لا نفعّل الادخار لمجرد وجود مال قبل تلقّي الدرس.
  if (!P.save && !P.famDebt?.plan) return 0;
  const q = vaultQuote(S); if (!q.ok || !q.plan.on || q.plan.mode !== 'sale') return 0;
  const net = Math.max(0, profit - debtPaid);
  const amount = Math.min(net * q.plan.pct / 100, Math.max(0, q.cash - 200));
  if (!vaultMoney(amount) || amount <= 0) return 0;
  P.wallet.sar -= amount; vaultCredit(S, amount); return amount;
}
