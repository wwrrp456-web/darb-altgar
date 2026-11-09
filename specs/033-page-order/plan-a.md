# Implementation Plan: تنظيم الصفحات 033أ

## القرارات
- **D1 — التبويبات:** مكوّن عام `tabsHTML(id, tabs, cur)` في ملف جديد `src/ui/06m-page-tabs.js`: شريط `role=tablist` بأزرار `role=tab` (أيقونة 40px + اسم + شارة رقم)، المختار مرتفع بحدّ ذهبي. الفعل `ptab` (data-p و data-t) يحفظ `ui.tab[page]` ويعيد الرسم.
- **D2 — المكتب:** `screenOffice` يُقسَّم إلى أربع دوال محتوى (`officeToday/Goals/Mgmt/Money`) تعيد استعمال الدوال القائمة نفسها (`officeCards`، `goalCard`، `projectsHTML`، `mgmtHTML`، `diwanHTML`…، `obligationsHTML`، `paymentHistoryHTML`…). يبقى القديم باسم `screenOfficeOld` ويُستدعى عند `OFFICETABS.on=false`.
- **D3 — «ما ينتظرك» الموحّد:** بطاقات `officeCards(true)` + أسئلة الناظر وشيخ القوافل والشهبندر (`diwanAskHTML`…) + المواعيد؛ والحل بأزرارها القائمة. العدّاد = عدد العناصر.
- **D4 — «متابعاتي»:** `MARKETMINE.on=false` الآن: تبقى «مراقبتي» و«طرقي المفضلة» في «اليوم». الدالة `marketMineHTML()` جاهزة؛ بعد دفع الازدهار لشاشة السوق يُضاف `h += marketMineHTML()` في نهاية `screenMarket` ويُقلب المفتاح (لا نلمس ملف السوق الآن).
- **D5 — الأعمال:** `screenEmpire` يُقسَّم إلى `empFleet/empFactory/empBank` ويُركَّب بتبويبات (`ui.tab.empire`)؛ في الصناعة تُفصل البطاقات ذات `block` (مقفلة) إلى قائمة مجموعة بسطر «N مصنعاً مقفلاً: لماذا؟». `BIZTABS.on=false` يعيد التركيب الخطي.
- **D6 — العقارات:** `infoMark(key, text)`: `<details class="ixd" data-ix>` بحالتها في `ui.ix[key]` (1 مطوية، 2 مفتوحة، غائبة = أول مرة فتُرسم مفتوحة ثم تُعلَّم مطوية بعد الرسم). نصوص الشرح قصيرة في ملف البيانات نفسه. زر «دليل العقارات» = `foldDet('est-guide')` أعلى الصفحة يجمع النصوص كلها. `ESTATEINFO.on=false` يعيد الشاشة السابقة.
- **D7 — الأيقونات المؤقتة:** من `ART['nav/*']` و`ART['office/*']` القائمة؛ وتُسجَّل في `ART_NEEDED.md`.

## Constitution Check
الشرع ✅ (لا نص ديني ولا حكم) · الحفظ ✅ (`darb-ui` فقط، مفاتيح رجوع) · الاختبار ✅ (اختبار جديد + قائمة data-act) · لعب لا محاضرة ✅ (يقلّل الازدحام) · البساطة ✅ (إعادة استعمال دوال العرض القائمة).

## المخاطر
- اختبارات تعتمد على تجاور الأقسام في المكتب (`office-ui`، `diwan-ui`، `management-ui`…): في الاختبارات الآلية (`foldAuto`) تُرسم التبويبات كلها متتابعة مفتوحة كالقديم لئلا تنكسر؛ واختبار 033 يفحص وضع اللاعب (`fold=1`).
