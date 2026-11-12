// 045 حارس الشرط الجزائي (GN-01): الضرر المالي الفعلي وحده، لا غرامة ثابتة. هذا الملف الوحيد الذي يخصم 'pactPenalty'.
// PEN.old=false هو الجديد (العقود القديمة بلا غرامة مالية)؛ true يعيد الغرامات الثابتة حرفاً.
const PEN = { old: false };
// المكوّنات المعتمدة وحدها (Opus)؛ مكوّن جديد يُضاف هنا بقرار مع سطر سببه
const PEN_PARTS = {
  customsGiven: 'ما تنازل عنه الزعيم من جمارك مقابل التزام لم يُوفَّ، بقدر الناقص',
  marginLost: 'هامش الطرف الآخر الضائع في الكمية الناقصة: الكمية × هامش النفوذ × السعر المرجعي',
  moneyHeld: 'كلفة فرصة مال محبوس بالتأخير: المبلغ × العائد اليومي × الأيام (تعويض للاعب)',
  priceDrop: 'انخفاض سعر السلعة الفعلي عند فسخ بعد بدء العمل',
};
function actualDamage(S, parts, opts) {
  const lines = []; let total = 0;
  for (const k of Object.keys(parts || {})) {
    if (!Object.prototype.hasOwnProperty.call(PEN_PARTS, k)) throw new Error('مكوّن ضرر غير معتمد: ' + k);
    const v = Math.max(0, +parts[k] || 0); total += v; lines.push({ part: k, value: v, why: PEN_PARTS[k] });
  }
  if (opts && opts.round) total = Math.round(total);
  return { total, lines };
}
// يخصم بقدر الضرر الفعلي (حتى رصيدك)، ولا يخصم شيئاً إن كان صفراً. opts.log(pay) لتسجيل دفتر العقد، opts.round لتقريب المجموع.
function payPenalty(S, ag, parts, why, opts) {
  const d = actualDamage(S, parts, opts), pay = d.total > 0 ? pPay(S, 'pactPenalty', Math.min(d.total, S.player.gold), true) : 0;
  if (opts && opts.log) opts.log(pay, d);
  return pay;
}
// عقود الزعماء القديمة (PACTS): لا ضرر مالياً يقاس، فالغرامة صفر؛ وPEN.old=true يعيد الثابتة حرفاً
function oldPactFine(S, pc) {
  if (!PEN.old) return 0;
  const pay = Math.min(pc.penalty, S.player.gold); return pay > 0 ? pPay(S, 'pactPenalty', pay, true) : 0;
}
