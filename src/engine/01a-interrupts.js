/* ---------- تصنيف المقاطعات (WP-06): مصدر واحد يقرؤه المحرك والواجهة ومُجدوِل WP-17 كما هو ----------
   window: يوقف الوقت وتظهر نافذة · office: بطاقة في مكتب التاجر بلا إيقاف · notebook: خبر أو دفتر عمّ سالم بلا إيقاف.
   الجرد الكامل بالمواضع والسطور في docs/INTERRUPTS.md. لا يُضاف موضع إيقاف جديد إلا بـinterrupt(S, id) ومعرّف هنا. */
const INTERRUPT_CLASS = {
  // محرك: مواضع S.pause (كان 26 موضعاً)
  bandits: 'window', pirates: 'window', seaStorm: 'window', defectFound: 'window', zakatDue: 'window',
  lifeSalem: 'window', lifeRetire: 'window', lifeFarewell: 'window', debtFree: 'window',
  lessonDone: 'window', stageDone: 'window', arrival: 'window',
  broker: 'window', friend: 'window', luck: 'window', majlis: 'window',
  phaseOpen: 'notebook', bossOverthrow: 'notebook', bossRegain: 'notebook', pactBroken: 'notebook', loanLate: 'notebook',
  sukukResult: 'notebook', creditorTook: 'notebook', earlyQardDefault: 'notebook', yearEnd: 'notebook',
  // واجهة: نوافذ learnNext (للمُجدوِل لاحقاً؛ الدروس الجانبية تنتظر في المكتب أصلاً عبر sideGate)
  'ui:char': 'window', 'ui:start': 'window', 'ui:intro': 'window', 'ui:stageup': 'window', 'ui:zakat': 'window', 'ui:debtfree': 'window', 'ui:event': 'window', 'ui:climate': 'window',
  'ui:tablet': 'office', 'ui:boss': 'office', 'ui:secret': 'office', 'ui:csecret': 'office', 'ui:card': 'office', 'ui:zlesson': 'office', 'ui:help': 'window', 'ui:advisor': 'office'
};
/* حدّ النوافذ: لا أكثر من 3 في كل 17 يوم لعب (≈ 10 دقائق بالسرعة الهادئة الافتراضية 35 ث لليوم)؛ ما زاد من العروض الاختيارية يؤجَّل */
const INTERRUPT_BUDGET = { windows: 3, perDays: 17 };
/* حرجة: تُحتسب ولا تُحجب أبداً · مجانية: جزء من انسياب اللعب أو المنهج فلا تُحتسب ولا تُحجب */
const INTERRUPT_CRIT = new Set(['bandits', 'pirates', 'seaStorm', 'defectFound', 'zakatDue', 'lifeSalem', 'lifeRetire', 'lifeFarewell']);
const INTERRUPT_FREE = new Set(['arrival', 'lessonDone', 'stageDone', 'debtFree', 'majlis']);
function interruptOk(S, id) { // هل تسمح الميزانية بنافذة جديدة الآن؟
  if ((INTERRUPT_CLASS[id] || 'window') !== 'window' || INTERRUPT_CRIT.has(id) || INTERRUPT_FREE.has(id)) return true;
  S.intr = (S.intr || []).filter(d => S.day - d < INTERRUPT_BUDGET.perDays); return S.intr.length < INTERRUPT_BUDGET.windows;
}
function interrupt(S, id) { // الموضع الوحيد الذي يوقف الوقت: نافذة فقط؛ المكتب والدفتر لا يوقفان شيئاً (الخبر يبقى في news)
  const n = S.intrN || (S.intrN = {}); n[id] = (n[id] || 0) + 1; // عدّاد لكل معرّف (للقياس ولمُجدوِل WP-17)
  if ((INTERRUPT_CLASS[id] || 'window') !== 'window') return false;
  if (!INTERRUPT_FREE.has(id)) { S.intr = (S.intr || []).filter(d => S.day - d < INTERRUPT_BUDGET.perDays); S.intr.push(S.day); }
  S.pause = true; return true;
}
