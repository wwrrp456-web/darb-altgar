/* صندوق السوق (040ب): الدخل من إيجار اللاعب ونصف ضريبته ورسم مملوكه والمنافسين والآخرين، وينفقه الزعيم شهرياً عبر prInflow؛ MFUND.on=false يعيد السلوك السابق. التفاصيل: specs/040-economy-loop/report-b.md */
const MFUND = { on: true, rentShare: 1, taxShare: 0.5, ownFee: 0.6, rivalUnit: 12, baseUnit: 6, spendShare: 0.5, reserveDays: 30, unitCost: 100, focusShare: 0.6, donateTrust: 0.5, donateTrustMax: 2, donateGap: 30, donateMin: 100 };
const mfOn = S => !!(MFUND.on && S && S.learn && S.learn.char);
const mfFund = (S, id) => { const c = S.cities[id]; return c.fund || (c.fund = { bal: 0, tin: 0, out: 0, inc: { you: 0, rivals: 0, others: 0 }, avg: 0, t0: 0, last: null, focus: null }); };
function mfAdd(S, id, who, amt) { if (!(amt > 0)) return; const f = mfFund(S, id); f.bal = mfR(f.bal + amt); f.tin = mfR(f.tin + amt); f.inc[who] = mfR((f.inc[who] || 0) + amt); }
const mfR = x => Math.round(x * 1000) / 1000;
function mfMove(S, id, cat, amt) {
  if (!(amt > 1e-9)) return 0; const P = S.player, L = P.led.exp, a = Math.min(amt, L[cat] || 0); if (!(a > 0)) return 0;
  L[cat] -= a; L.marketFee = (L.marketFee || 0) + a; if (cat === 'tax') P.led.mfTax = (P.led.mfTax || 0) + a; const sk = S.stats.sink; if (sk[cat]) sk[cat] = Math.max(0, sk[cat] - a); sink(S, 'marketFee', a); mfAdd(S, id, 'you', a); return a;
}
const mfTax = (S, id, tax) => { if (mfOn(S) && tax > 0) mfMove(S, id, 'tax', tax * MFUND.taxShare); };
const mfRentFee = (S, id, paid) => { if (mfOn(S) && paid > 0) mfMove(S, id, 'rent', paid * MFUND.rentShare); };
function mfOwnFee(S, id, pr, c) {
  if (!mfOn(S)) return; const n = ownShops(pr) + (pr.whs || 0); if (!(n > 0)) return;
  const paid = pPay(S, 'marketFee', n * MFUND.ownFee * Math.pow(shopProsper(c), 0.6), true); mfAdd(S, id, 'you', paid); mfFund(S, id).own = (mfFund(S, id).own || 0) + paid;
}
const mfHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };
function mfDay(S) {
  if (!mfOn(S)) return;
  for (const id of S.order) {
    const c = S.cities[id], f = mfFund(S, id), sp = Math.pow(shopProsper(c), 0.6);
    mfAdd(S, id, 'rivals', MFUND.rivalUnit * rivalPresence(S, id) * sp); mfAdd(S, id, 'others', MFUND.baseUnit * popTotal(c) / 1000);
    f.avg = mfR(0.9 * f.avg + 0.1 * (f.tin - f.t0)); f.t0 = f.tin;
  }
}
function mfWeights(S, id, p, f) {
  const w = {}; let t = 0; for (const k of PR_KEYS) { w[k] = (1 + PR.cap - Math.min(PR.cap, Math.max(0, p[k] - p.b[k]))) * (0.8 + 0.4 * mfHash(id + k)); t += w[k]; }
  for (const k of PR_KEYS) w[k] /= t;
  const bs = bossOf(S, id); if (f.focus && PR_KEYS.includes(f.focus) && bs && bs.ruler === 'player') for (const k of PR_KEYS) w[k] = (1 - MFUND.focusShare) * w[k] + (k === f.focus ? MFUND.focusShare : 0);
  return w;
}
function mfSpend(S, id, p) {
  if (!mfOn(S)) return; const f = mfFund(S, id), reserve = MFUND.reserveDays * f.avg, spend = Math.max(0, Math.min(f.bal, (f.bal - reserve) * MFUND.spendShare)), w = mfWeights(S, id, p, f), pend = {}; let add = 0;
  if (spend >= 1) { f.bal = mfR(f.bal - spend); f.out = mfR(f.out + spend); for (const k of PR_KEYS) { pend[k] = spend * w[k] / MFUND.unitCost; add += pend[k]; } p.fundPend = pend; }
  const r2 = mfR;
  f.last = { d: S.day, inc: { you: r2(f.inc.you), rivals: r2(f.inc.rivals), others: r2(f.inc.others) }, spent: r2(spend), add: Math.round(add * 100) / 100 };
  f.inc = { you: 0, rivals: 0, others: 0 };
}
function fundFocus(S, city, dim) {
  const c = S.cities[city], bs = c && bossOf(S, city); if (!c) return NO('مدينة غير معروفة.'); if (!mfOn(S)) return NO('صندوق السوق غير مفعّل.');
  if (!(bs && bs.ruler === 'player')) return NO('تحكم المدينة بنفسك لتختار محور إنفاق الصندوق.'); if (dim !== null && !PR_KEYS.includes(dim)) return NO('بُعد غير معروف.');
  mfFund(S, city).focus = dim; return OK(dim ? 'محور إنفاق الصندوق: ' + PR_NAMES[dim] + '.' : 'عاد الإنفاق للتوزيع المعتاد.');
}
function fundDonate(S, city, amt) {
  const c = S.cities[city]; if (!c) return NO('مدينة غير معروفة.'); if (!mfOn(S)) return NO('صندوق السوق غير مفعّل.'); amt = Math.floor(+amt);
  if (!(amt >= MFUND.donateMin)) return NO('أقل تبرع ' + MFUND.donateMin + ' ريال.'); ctxFor(S, city); if (S.player.gold + 1e-9 < amt) return NO('رصيدك لا يكفي للتبرع.');
  const f = mfFund(S, city); pPay(S, 'marketDonation', amt, true); mfAdd(S, city, 'you', amt);
  const bs = bossOf(S, city); let tr = 0; if (bs && bs.ruler !== 'player' && S.day - (f.donDay == null ? -1e9 : f.donDay) >= MFUND.donateGap) { tr = Math.min(MFUND.donateTrustMax, amt / 1000 * MFUND.donateTrust); bs.trust = clamp(bs.trust + tr, -100, 100); f.donDay = S.day; }
  return OK('تبرعتَ بـ' + fmtN(amt) + ' إلى صندوق ' + c.name + (tr > 0 ? ' فارتفعت ثقة زعيمها قليلاً.' : '.'));
}
function fundView(S, id) {
  const c = S.cities[id]; if (!mfOn(S) || !c) return null; const f = c.fund || { bal: 0, tin: 0, out: 0, inc: { you: 0, rivals: 0, others: 0 }, last: null, focus: null }, bs = bossOf(S, id), p = prData(S, id), w = p ? mfWeights(S, id, p, f) : {};
  return { id, bal: f.bal, tin: f.tin, out: f.out, inc: f.inc, last: f.last, focus: f.focus, canFocus: !!(bs && bs.ruler === 'player'), ruler: bs ? bs.ruler : null, rivals: rivalPresence(S, id), dims: PR_KEYS.map((k, i) => ({ k, name: PR_NAMES[k], share: w[k] })), min: MFUND.donateMin };
}
