# خطة 036ج
- **ملف جديد** `src/engine/30h2f-influence-fin.js` بعد `30h2-influence.js` (يستعمل سجل `P.agr` وأفعاله): `INFLU.salam/mud/wakala`، `AGR_KINDS` الثلاثة (`fam:'fin'`)، `finBlock/finGoods/finQtyOptions/finCapOptions`، `A.signFin/wakalaConsign`، `salamSettle/mudSettle/wakalaDay/wakalaEnd`، `agrFinDay` (يُستدعى من `agrDay`)، `finClose` (من `agrDrop`: حكم سوق الطرف الثاني أو الفسخ)، `finAssets` (القيمة والزكاة)، `mudDaily` (النموذج).
- **خطّافات رفيعة:** `07-farm.js` `netWorth += finAssets.total`؛ `23-zakat.js` `zakatBase.fin`؛ `06e-wealth-report.js` صفوف `mud/salam/wakala` و`zakatNote`؛ `30h2-influence.js`: `agrDay` يوجّه العقود المالية، و`breakAgr` (السلم لا يُفسخ، والمضاربة سحب مبكر)، و`laneBlock` يرفض غير التصدير والاستيراد.
- **الدفع بعملتك** (بلا `ctxFor` على رأس المال) كي لا يُخسَّر رأس المال فرق صرف.
- **النموذج:** `g_day = k·dev·evm + hold·Δmean + season·sea − shock·cut` (k=0.011، hold=1.0، season=0.4×0.01، shock=0.01)؛ المعايرة بـ12 بذرة × 18 مدينة × 330 يوماً.
- **الواجهة:** `10b-agreements.js` (`finRowHTML/finLedgerHTML/agrToggle`)، أحداث في `16-events.js`، وسطر الزكاة في `renderWealth` (02-learn.js، سطر واحد).
- **السجل:** `tools/review-inventory.js` (بنود `agr:*`)؛ `registry.json` يُولَّد.
- **الاختبارات:** `influence-fin` (محرك + نموذج + توازن 12) و`influence-fin-ui` (390).
