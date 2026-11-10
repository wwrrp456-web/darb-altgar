/* ---------- 040هـ حالة الدكاكين والمخازن: للصيانة أثر ظاهر ----------
   مبلغ الصيانة اليومي واسم بندها (upkeep) لا يتغيران (19-player.js): تُعطى الصيانة أثراً فقط.
   لكل دكان مملوك sh.cond ولمخازن المدينة pr.wcond في [0، 100] (اختياري؛ الغائب = start فلا ترحيل).
   يومياً: الصيانة المدفوعة كاملة ← cond += mend − wear حتى سقف hold (90)؛ غير المدفوعة ← cond −= neglect.
   الأثر: مضاعف إقبال الدكان (≤80 يخفض حتى sales[0]، ≥90 يرفع حتى sales[1])، واحتمال حريق المخزن (≥80 ×1 … ≤floor ×breakMul[1]).
   الترميم A.shopRepair: يرفع الحالة إلى repairTo بمقابل repairDays أيام صيانة لكل +10، ويُسجَّل في بند upkeep نفسه.
   SHOPCOND.on=false: لا يُقرأ حقل ولا يُكتب ولا أثر (السلوك السابق حرفياً). */
const SHOPCOND = { on: true, start: 80, wear: 0.3, mend: 0.45, neglect: 0.9, floor: 30, hold: 90, sales: [0.85, 1.03], breakMul: [1, 2.5], repairDays: 12, repairTo: 90, repairBelow: 65, states: [[85, 'ممتازة'], [65, 'جيدة'], [45, 'مقبولة'], [0, 'متهالكة']] };
const scCond = o => (o && o.cond != null ? o.cond : SHOPCOND.start), scWh = pr => (pr && pr.wcond != null ? pr.wcond : SHOPCOND.start);
const scName = c => SHOPCOND.states.find(s => c >= s[0])[1];
const scClamp = x => Math.max(0, Math.min(100, Math.round(x * 100) / 100));
/* مضاعف الإقبال: 1 عند start (80)، ينزل خطياً إلى sales[0] عند 0، ويصعد إلى sales[1] عند hold فأعلى */
const scSalesOf = c => c < SHOPCOND.start ? SHOPCOND.sales[0] + (1 - SHOPCOND.sales[0]) * c / SHOPCOND.start : 1 + (SHOPCOND.sales[1] - 1) * Math.min(1, (c - SHOPCOND.start) / (SHOPCOND.hold - SHOPCOND.start));
const scSalesMul = sh => SHOPCOND.on && sh.kind !== 'stall' && sh.kind !== 'rent' ? scSalesOf(scCond(sh)) : 1;
const scBreakOf = c => c >= SHOPCOND.start ? SHOPCOND.breakMul[0] : c <= SHOPCOND.floor ? SHOPCOND.breakMul[1] : SHOPCOND.breakMul[1] - (SHOPCOND.breakMul[1] - SHOPCOND.breakMul[0]) * (c - SHOPCOND.floor) / (SHOPCOND.start - SHOPCOND.floor);
/* احتمال حريق المخزن: متوسط مضاعفات مخازن اللاعب المؤهلة للحدث (نفس شرط make في 17-shocks) */
function scFireMul(S) {
  if (!SHOPCOND.on) return 1; const ids = Object.keys(S.player.props).filter(id => S.player.props[id].whs && valueOf(S.player.props[id].store) > 400); if (!ids.length) return 1;
  return ids.reduce((a, id) => a + scBreakOf(scWh(S.player.props[id])), 0) / ids.length;
}
function scStep(c, ok) { if (!ok) return scClamp(c - SHOPCOND.neglect); const n = c + SHOPCOND.mend - SHOPCOND.wear; return scClamp(n > SHOPCOND.hold ? Math.max(SHOPCOND.hold, Math.min(c, n)) : n); }
/* يُستدعى من shopsDay بعد دفع الصيانة اليومية: up المطلوب وpaid المدفوع فعلاً */
function scDay(S, city, pr, up, paid) {
  if (!SHOPCOND.on || !(up > 0)) return; const ok = paid >= up - 1e-6;
  for (const sh of pr.shops) if (shKind(sh) === 'own') sh.cond = scStep(scCond(sh), ok);
  if (pr.whs) pr.wcond = scStep(scWh(pr), ok);
}
/* وحدة الصيانة اليومية للمبنى: دكان مملوك أو مجموع المخازن (من معادلة 19-player نفسها) */
const scUnit = (pr, id) => id === 'wh' ? 6 * pr.whs : 10 * (1 + 0.08 * (pr.shops.length - 1));
function scQuote(S, city, id) {
  const pr = S.player.props[city]; if (!SHOPCOND.on || !pr) return null; const sh = id === 'wh' ? null : pr.shops.find(x => x.id === +id);
  if (id === 'wh' ? !pr.whs : !sh || shKind(sh) !== 'own') return null; const c = id === 'wh' ? scWh(pr) : scCond(sh), gain = Math.max(0, SHOPCOND.repairTo - c), cost = Math.round(SHOPCOND.repairDays * scUnit(pr, id) * gain / 10);
  return { id, cond: c, name: scName(c), to: SHOPCOND.repairTo, gain, cost, can: c < SHOPCOND.repairBelow, sales: id === 'wh' ? null : scSalesOf(c), brk: scBreakOf(c) };
}
function shopRepair(S, city, id) {
  const q = scQuote(S, city, id); if (!q) return NO('لا ترميم هنا'); if (!q.can) return NO('حالته ' + q.name + ': لا يحتاج ترميماً الآن'); if (S.player.gold < q.cost) return NO('رصيدك لا يكفي للترميم (يلزم ' + fmtN(q.cost) + ' ريال)');
  const pr = S.player.props[city]; ctxFor(S, city); pPay(S, 'upkeep', q.cost, true); if (id === 'wh') pr.wcond = q.to; else pr.shops.find(x => x.id === +id).cond = q.to;
  return OK('رمّمتَ ' + (id === 'wh' ? 'المخزن' : 'الدكان') + ': صارت حالته ' + scName(q.to) + ' (' + fmtN(q.cost) + ' ريال)');
}
/* عرض الحالة للواجهة: كلمة وأثر بلغة بسيطة */
function scEffect(q) { if (!q) return ''; if (q.sales == null) return q.brk > 1.005 ? 'خطر الحريق ×' + (Math.round(q.brk * 10) / 10) : 'خطر الحريق عادي'; const d = Math.round((q.sales - 1) * 100); return d < 0 ? 'إقبال −' + (-d) + '٪' : d > 0 ? 'إقبال +' + d + '٪' : 'إقبال عادي'; }
function scView(S, city) { const pr = S.player.props[city]; if (!pr || !SHOPCOND.on) return null; return { shops: pr.shops.filter(sh => shKind(sh) === 'own').map(sh => Object.assign({ eff: scEffect(scQuote(S, city, sh.id)) }, scQuote(S, city, sh.id))), wh: pr.whs ? Object.assign({ eff: scEffect(scQuote(S, city, 'wh')) }, scQuote(S, city, 'wh')) : null }; }
/* ملخص الالتزامات: كم مبنى بحالة جيدة فأعلى من المملوك */
function scSummary(S) { if (!SHOPCOND.on) return null; let good = 0, n = 0; for (const city in S.player.props) { const pr = S.player.props[city]; for (const sh of pr.shops) if (shKind(sh) === 'own') { n++; if (scCond(sh) >= SHOPCOND.states[1][0]) good++; } } return { good, n }; }
A.shopRepair = shopRepair;
