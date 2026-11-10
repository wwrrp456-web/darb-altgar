# خطة 041أ: قرض الصديق بالرهن عند التعثر
- جزء جديد `src/engine/22c-loan-pledge.js`: `LOANPLEDGE` (الأرقام المعتمدة + `restDays/restPay/cool/coolMul`) و`LP_TXT` (T1–T5 حرفاً من الملف المعتمد) ودوال `lpPledge` و`lpDue` و`lpDecide` و`lpType` و`lpCard`.
- `22-learn.js` (أربع نقاط ربط فقط): نوع الطلب `lpType`، تسجيل الرهن بعد القبول `lpPledge`، معالجة الأجل `lpDue`، وفرع `floan` في `eventChoice`.
- الرهن: `o.pledge = { name, value }` (3–5 أضعاف، اسم مدينة من ممتلكاتك) و`o.id`، لقرض `secure` الجديد فقط؛ القديم بلا رهن يردّ كاملاً.
- التعثر: عند الأجل `roll(S, k)` حتمي (k من يوم القرض) < 0.25؛ يصير `o.st='insolvent'` ويُدفع حدث `floan` إلى `L.eq` (بميزانية المقاطعة نفسها `friend`)، ويبقى القرض حتى القرار.
- القرار: إبراء (`fbq.ok=2`) أو بيع (`price/fee/take/back/rest`، `fbq.ok=3`، إيراد `loanBack`، `L.loanCool` لوزن ×0.7 مدة 120 يوماً) أو إمهال +30 يوماً مرة واحدة (`waited`)؛ والباقي `rest` ديناً +90 يوماً يُسدَّد باحتمال 60٪.
- الواجهة: بطاقة `floan` في `02-learn.js` (T1 والخيارات الثلاثة وT5؛ المقترح بالزر الأساسي، والإمهال المعطّل مع سببه)، و«من أقرضتَ» في `06b-office.js` (الرهن والحالة وسجل القرار)، وتسمية `loanBack` في الدفتر.
- المطفأ: `on=false` لا يلمس أي حقل ولا مسار (القرض بأربعة حقول كما كان).
- الاختبارات: `loan-pledge.test.js` (محرك) و`loan-pledge-ui.test.js` (390 و1100)، في `map.json` و`all.sh`؛ وتثبيت `LOANPLEDGE.on=false` في `skill` و`skill-b`.
