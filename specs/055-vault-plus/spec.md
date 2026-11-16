# 055 — تعديل الحصّالة: تسمية الوضعين، وعاء أوسع لـ«صافي السنة»، ووضع «من كل ربح» (Opus، 2026-11-16)

**الأصل:** `docs/plan/COMMITMENTS.md` §3 البند 16 (اعتمد بن محمود 2026-11-16 التعديلين والإضافة).
**ليست حساسة:** حساب مال لا حكم؛ لا نص شرعي جديد. **الحصّالة تبقى مال اللاعب**: `P.vault` يبقى داخل `cash` في `zakatBase` (`23-zakat.js:58`) و`netWorth` (`07-farm.js:94`) بلا مساس، والسحب كما هو.
**تعتمد على:** 046 (`led.inc.projectIncome` في `30b2-projects-invest.js:116`)، و051 (`winOpen`، نافذة `vault` في `00w-win.js:12`). **بعد 053أ** (QUEUE).
**القاعدة:** لا `<select>` ولا `<details>` جديد ولا طيّ جديد (الموجود في البطاقة يبقى كما هو)، ولا أيقونة جديدة، ولا `rnd`/`Math.random`.

## 0) ما تقوله الشيفرة اليوم (مرجع؛ لا يتغير مع المفتاح المطفأ)
- **«من ربح البيع» (`mode:'sale'`):** `learnEvent` (`22-learn.js:369`) عند `sell` يدوي بربح: `paid = debtCut(S, r.pl)` ثم `savingsSale(S, r.pl, paid)`:
  `amount = min(max(0, pl − debtPaid) × pct/100, max(0, cash − 200))`. لا يمر بها بيع القوافل الآلية ولا الدكاكين ولا المصانع ولا المزرعة ولا المشاريع.
- **«صافي السنة» (`mode:'year'`):** `vaultLedger` (`23f-vault-year.js:6`):
  `profit = Σ inc[k] (k ∈ VAULT_INCOME) − Σ exp[k] (k ∉ VAULT_EXCLUDED_COST) − deferredWages(S) + L.mfTax`
  مع `VAULT_INCOME = ['realized','mudaraba','sukukProfit','governor','labor']`. و`realized` (`logTrade`، `08-trade.js:13`) يجمع `pl ≥ 0` لكل `sell`/`shop`: القوافل يدوية وآلية، والدكاكين، والمصانع (`source 'factory'`)، والمزرعة والمواشي واللحم (`'farm'`)، والأصول (`'asset'`).
  الإيداع في `vaultYearDay` عند تبدّل السنة الهجرية: `proposed = min(max(0, afterDebt × pct/100 − deposited), max(0, cash − 200))`.
- **السندات:** ربح الصكوك داخل الوعاء أصلاً بالمفتاح `sukukProfit` (`20-finance.js:37`: `back − b.amt`، سالب عند الخسارة). أمّا `inc.bonds` (`:38`) فهو **أصل المال مع ربحه** فلا يدخل (يُضاعف الربح ويُدخل رأس المال). **لا تغيير في الصكوك**؛ ويُثبته اختبار (§6-ج). هذا تفسير بند «السندات» في الالتزام.
- **لا تدخل اليوم:** `projectIncome` (046)، و`oppRent` (`23a-asset-sales.js:181`)، و`takaful`، و`compensation`، و`shops`/`sales`/`assets`/`bonds`/`loanBack` (إجماليات أو أصل مال تُمثّلها `realized`).

## 1) المفتاح والحقول
في أول `src/engine/23e-savings-vault.js`:
```
const VAULT = { x: true, all: [5, 10, 15], keep: 200 };
```
- **`VAULT.x = false` ⇒ السلوك الحالي حرفاً بلا حقل جديد في الحفظ:** `vaultState` و`savingsPlan` و`vaultLedger` و`vaultAnnualState` ونصوص البطاقة كما هي حرفاً، والوضع `'all'` مرفوض في `savingsPlan` (الرسالة الحالية «اختر نسبة وطريقة ادخار صحيحتين»)، ويُقرأ `mode:'all'` من حفظ مضاء على أنه `'sale'` (قاعدة `vaultState` الحالية `old.mode === 'year' ? 'year' : 'sale'`).
- حقول جديدة (مع `VAULT.x` فقط، وتُنشأ عند أول حاجة، والحفظ القديم بلا ترحيل):
  - `P.save.mode` يقبل `'all'`.
  - `P.save.mb` دفتر الشهر لوضع `'all'` (§4)، يوجد ما دام الوضع `'all'` ويُحذف بالخروج منه.
  - `P.save.book.x = 1` علامة أن دفتر السنة فُتح بالوعاء الموسّع (§3-ب).
- يُثبَّت `VAULT.x = false` في `test/skill.test.js` و`test/skill-b.test.js` و`scripts/capture-*.js` وكل بصمة قديمة تقرأ `P.save` (identities، rival-wealth، skill-d، skill-e إن فشلت)، وفي اختبارات الحصّالة القديمة الثمانية (`vault-draw`، `vault-draw-ui`، `vault-year`، `vault-reserve`، `vault-panel-ui`، `vault-opportunity`، `vault-opportunity-ui`، `vault-dues-ui`) حتى تبقى شاهداً على المطفأ.
- التصدير في `31-api.js`: `VAULT, VAULT_INCOME_X, VAULT_ALL, vaultMonthDay, vaultMonthQuote`.

## 2) تسمية الأوضاع (مع `VAULT.x`)
أزرار الموعد في `vaultWithdrawHTML` (`src/ui/10g-vault.js:32`) تصير ثلاثة بالمكوّن نفسه (`btn sm`، `aria-pressed`، `data-act="vmode"`، `min-height:44px`، `role="group"` بالوسم «طريقة الادخار»):

| `mode` | نص الزر | سطر الشرح تحت المجموعة حين يكون مختاراً (حرفاً) |
|---|---|---|
| `sale` | من أرباح بيعك اليدوي | `يُقتطع ${pct}٪ من ربح كل بيع تُجريه بيدك بعد سداد الدَّين. لا يدخله ربح القوافل الآلية ولا الدكاكين ولا المصانع ولا المزرعة ولا المشاريع.` |
| `year` | من صافي أعمالك في السنة | `يُقتطع ${pct}٪ من صافي أعمالك كلها في السنة الهجرية بعد المصاريف والدَّين: أرباح البيع (يدوي وقوافل ودكاكين ومصانع ومزرعة)، والمضاربة، وربح الصكوك، وحصة الإمارة، والعمل، ودخل المشاريع، وإيجار المخازن.` |
| `all` | من كل ربح (شهرياً) | `يُقتطع ${pct}٪ من كل ربح دخل محفظتك في الشهر الهجري، قبل المصاريف وبعد سداد الدَّين: البيع بأنواعه، والمضاربة، وربح الصكوك، وحصة الإمارة، والعمل، ودخل المشاريع، وإيجار المخازن. يُودَع أول كل شهر.` |

- السطر في رأس البطاقة (`q.plan.on ? …`) مع `VAULT.x`: `'ادخار ' + pct + '٪ ' + MODE_LINE[mode]` حيث `MODE_LINE = { sale:'من أرباح بيعك اليدوي بعد الدَّين', year:'من صافي أعمالك في السنة بعد الدَّين', all:'من كل ربح كل شهر بعد الدَّين' }`.
- رسالة `savingsPlan` مع `VAULT.x`: `'ادخار ' + pct + '٪ ' + MODE_LINE[mode] + '، مع إبقاء 200 ريال للتشغيل'` (الإيقاف كما هو).
- قاعدة ظهور الاختيار: بعد النقر زرّ واحد `aria-pressed="true"` في المجموعة، والسطر يحمل النسبة المختارة، ويُعاد رسم اللوحة (`dataset.view` يتغير لأن `q` يتغير).

## 3) «صافي السنة» بوعاء موسّع
### أ) المعادلة
```
VAULT_INCOME_X = [...VAULT_INCOME, 'projectIncome', 'oppRent']
vaultLedger(S): المفاتيح = VAULT.x ? VAULT_INCOME_X : VAULT_INCOME     // الباقي حرفاً
```
لا تغيير في `VAULT_EXCLUDED_COST` ولا `deferredWages` ولا `mfTax`. تكلفة تشغيل المشاريع مسجّلة أصلاً في `exp.upkeep` (`30b2-projects-invest.js:114`: `payObligation(S,'upkeep',…)` ← `pPay` في `02-core-world.js:25`) فتُطرح بالقاعدة الحالية؛ فيدخل «صافي السنة» صافي المشروع لا إجماليه.
### ب) دفتر سنة مفتوح قبل المفتاح
`book.net0` في حفظ قديم أُخذ بالوعاء القديم، فيدخل الإيداع الأول كلُّ `projectIncome`/`oppRent` التاريخي. العلاج في `vaultMigrate(S)` (ينادى من `27-save.js:57`) وفي `vaultYearStart`:
```
vaultXFix(S): إن VAULT.x و P.save?.book و !book.x:
  book.net0 += (inc.projectIncome || 0) + (inc.oppRent || 0); book.x = 1
vaultYearStart مع VAULT.x: الدفتر الجديد يُكتب بـ x: 1
```
و`vaultAnnualState` مع `VAULT.x` يحفظ `x: 1` إن كان (بلا `VAULT.x` يُسقطه كما اليوم). فلا يدخل الوعاءَ إلا ما يُكسب بعد التفعيل.

## 4) الوضع الثالث «من كل ربح» (`mode:'all'`)
```
VAULT_ALL = VAULT_INCOME_X                         // المصادر نفسها، بلا طرح مصاريف
mkey(S)  = d.h.y * 12 + d.h.m      حيث d = vaultDate(S)      // الشهر الهجري
P.save.mb = { k: mkey, inc0: { [k]: inc[k] || 0 for k ∈ VAULT_ALL }, debt0: exp.debtPaid || 0, last: null | { k, gain, debt, dep, short } }
```
- **الفتح:** `savingsPlan(S, on, pct, 'all')` يكتب `mb` جديداً من الدفتر الحالي (لا أثر رجعي)، ولا يمس `book` ولا `years`. الخروج إلى `sale`/`year` يحذف `mb` (`delete P.save.mb`). وإن غاب `mb` والوضع `'all'` (حفظ تالف) فُتح في `vaultMonthDay` دون إيداع.
- **الحساب** (`vaultMonthQuote(S)`، نقية، تُنادى للعرض وللإيداع):
```
gain    = Σ_{k ∈ VAULT_ALL} max(0, (inc[k] || 0) − mb.inc0[k])
debt    = max(0, (exp.debtPaid || 0) − mb.debt0)
base    = max(0, gain − debt)
due     = base × pct / 100
amount  = on ? min(due, max(0, wallet.sar − VAULT.keep)) : 0
short   = due − amount                // لا يُرحَّل؛ يُعرض فقط
```
  (`sukukProfit` السالب عند خسارة صكّ يُحسب صفراً في `gain` بـ`max(0, …)` لأنه وعاء أرباح لا صافٍ.)
- **الإيداع** `vaultMonthDay(S)` في `11-day.js:11` بعد `vaultYearDay(S)` مباشرة: إن `VAULT.x` و`P.save?.mode === 'all'` و`mkey(S) !== mb.k`: احسب `vaultMonthQuote`، فإن `amount > 0`: `P.wallet.sar -= amount; vaultCredit(S, amount)` (السبب `'profit'`، والسجل `hist` كما هو)؛ ثم `mb = { k: mkey(S), inc0, debt0` من الدفتر الحالي `, last: { k: mb.k, gain, debt, dep: amount, short } }`. وإن كان `on = false` يُفتح الشهر الجديد بلا إيداع.
- **الخبر** (مرة في الشهر، فقط إن `gain > 0`): `'حصّالة الشهر: ادّخرتَ ' + fmtN(dep) + ' ريال (' + pct + '٪ من أرباح ' + fmtN(gain) + ' ريال' + (debt > 0 ? ' بعد سداد ' + fmtN(debt) + ' من الدَّين' : '') + ')' + (short > 0 ? '. لم يكفِ رصيدك لـ' + fmtN(short) + ' ريال.' : '.')`، والنوع `'good'` إن `dep > 0` وإلا `''`.
- **التداخل:** في `'all'` لا يعمل `savingsSale` (شرطها `mode !== 'sale'` قائم) ولا إيداع `vaultYearDay` (`proposed` شرطه `mode === 'year'` قائم)؛ ويبقى سجل السنة `years` يُكتب كما اليوم. فلا ادخار مزدوج.

## 5) العرض ونقطة الوصول
- **الوصول:** زرّ الحصّالة في الرأس `hVault` ← لوحة «حصّالتي» (نقرة واحدة)؛ والخبر الشهري في الأخبار. لا مكان جديد.
- **معاينة `'all'`** في البطاقة (فقرة `<div class="small" id="vaultMonthPreview">` كمعاينة السنة، بلا `<details>`):
  `هذا الشهر حتى الآن: أرباح ${gain} ريال، سداد دَين ${debt}، يُودَع أول الشهر القادم نحو <b class="num">${amount} ريال</b>.`
  وإن `last`: `الشهر الماضي: أُودِع ${dep} ريال من أرباح ${gain}${short > 0 ? '، ونقص ' + short + ' لقلة الرصيد' : ''}.`
- **جدول «لا صوري»:**

| ما يظهر | الرقم الذي يتغير | أين يراه |
|---|---|---|
| الأزرار الثلاثة وسطر الشرح | `P.save.mode` ومنه مسار الإيداع | البطاقة، الزر المظلَّل والسطر |
| «صافي السنة» الموسّع | `vaultLedger.profit` (+ `projectIncome` + `oppRent`) ← `proposed` | معاينة السنة وتقرير السنة وخبرها |
| «من كل ربح» | `P.vault` و`P.wallet.sar` و`save.total` أول كل شهر | معاينة الشهر، `hist`، الخبر الشهري، رصيد الرأس |
| الحصّالة في الزكاة | `zakatBase.cash` يشمل `P.vault` (بلا تغيير) | نافذة الزكاة كما هي |

## 6) الاختبارات (`test/vault-plus.test.js` و`test/vault-plus-ui.test.js`، في `test/map.json` لـ`23e`/`23f`/`10g`/`11-day` و`test/all.sh`)
- **أ) المطفأ حرفاً:** بذرة ثابتة 400 يوم بخطة `year` ثم `sale` وبيع يدوي وقافلة آلية ومشروع: بصمة `JSON.stringify(P.save)` و`P.vault` و`P.wallet.sar` مع `VAULT.x=false` = البصمة الملتقطة من `origin/main` قبل الحزمة (تُكتب في الاختبار)، ولا مفتاح `mb` ولا `book.x`. و`savingsPlan(S,true,10,'all')` ⇒ `ok:false`.
- **ب) الوعاء الموسّع:** دفتر بـ`projectIncome += 1000` و`oppRent += 200` بعد فتح السنة، `pct=10`، بلا مصاريف ولا دَين ⇒ `vaultYearQuote.profit` يزيد 1200 بالضبط عن المطفأ، و`proposed` يزيد 120 (مع رصيد كافٍ).
- **ج) الصكوك بلا ازدواج:** استحقاق صكّ ربح `X` ⇒ `profit` يزيد `X` (عبر `sukukProfit`) لا `X + b.amt`، في الحالتين.
- **د) دفتر قديم:** حفظ فيه `book` بلا `x` و`inc.projectIncome = 5000` ⇒ بعد التحميل `book.net0` زاد 5000 و`book.x = 1`، و`profit` لا يتغير لحظة التحميل.
- **هـ) «من كل ربح»:** فتح `all` ثم ربح يدوي 300 وربح دكان 200 ودخل مشروع 500 وسداد دَين 100 في الشهر، `pct=10`، رصيد 10٬000 ⇒ عند أول يوم من الشهر التالي إيداع `(1000 − 100) × 0.10 = 90` بالضبط، و`mb.last = {gain:1000, debt:100, dep:90, short:0}`، وخبر واحد. ورصيد 250 ⇒ `dep = 50`، `short = 40`. وشهر بلا ربح ⇒ لا خبر ولا إيداع.
- **و) لا ازدواج:** في `all` البيع اليدوي لا يودع فوراً (`r.saved = 0`)، وتبدّل السنة لا يودع، و`years` يُكتب.
- **ز) الزكاة والملك:** بعد الإيداع `zakatBase(S).cash` لم يتغير (المال انتقل من المحفظة إلى الحصّالة داخل الوعاء نفسه)، و`netWorth` لم يتغير، و`vaultDraw` يعيد المال.
- **الواجهة (390px):** ثلاثة أزرار في المجموعة، نقر كلٍّ ⇒ زرّ واحد `aria-pressed="true"` وسطر الشرح الحرفي (§2) بالنسبة الصحيحة؛ معاينة الشهر تحمل `amount` المحسوب؛ لا `<select>` ولا `<details>` جديد (عدد `details` في البطاقة = المطفأ)؛ لا تمرير أفقي. ومع `VAULT.x=false` زرّان بنصّي اليوم.

## 7) الحجم
تعديل نحو 2–3 آلاف حرف محرك و1.5 ألف واجهة؛ لا صور. يذكر التقرير الحجم قبل/بعد (الحد 3.9 م، العتبة 3.8 م).
