# خطة 036د
- **ملف جديد** `src/engine/30h2m-influence-mfg.js` يستعمل سجل `P.agr` وأفعال 036ج (`signFin` يوجّه إلى `mfgSign` عبر `MFG_KINDS`؛ `agrFinDay`→`mfgDay`؛ `finClose`→`mfgClose`؛ `finView`→`mfgView`؛ `finAssets`→`mfgAssets`؛ `finOn` يقرأ عائلة العقد من `AGR_KINDS[k].fam`).
- **خطّافات:** `20-finance.js` `factoryDayTracked` (يقيس ربح مصنع الشراكة اليومي، وبغير الشراكة يستدعي `factoryDay` كما كان)؛ `06e-wealth-report.js` صفّا `mfgpaid` و`part` (دَين)؛ `30h2-influence.js` (`breakAgr` يرفض فسخ الاستصناع).
- **الدفع بعملتك** (بلا `ctxFor` على ما يُدفع للعقد) كي لا يُخسَّر فرق صرف.
- **سجل `P.agrLog`:** ما ربحتَه أو خسرتَه فعلاً من كل عقد صناعي منتهٍ (يُستعمل في قياس التوازن لعزل أثر العقد عن مسار اللاعب الآلي).
- **الاختبارات:** `influence-mfg` (محرك + توازن) و`influence-mfg-ui` (390).
