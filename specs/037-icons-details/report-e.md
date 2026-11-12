# تقرير 037هـ — ربط رسم كودكس بالشاشات (فرع `ccr-8bb8d410-qf2z8v`)

## ما رُبط وأين
1. **أيقونات 037 الـ21:** نُقلت كما هي إلى `brand/img/icons/ui-*.webp`؛ سجل `src/icons.js` أخذها تلقائياً (لا تعديل فيه). الاختبار يتحقق أن `nameUrl(name) === ART['icons/'+name]` للـ21.
2. **التبويبات:** `office-tab-{today,goals,mgmt,money}` و`biz-tab-{caravan,factory,bank}` نُقلت؛ تغيّرت `ptabIcon` وحدها (`06m-page-tabs.js`).
3. **الشخصيات:** `rolePic/roleHead` في `00-state.js` (72px، دائرة بإطار ذهبي): الناظر في رأس الديوان وفي «مجلس الناظر» (`06q2-council.js`)، وشيخ القوافل، والشهبندر؛ والمنافس بصورة 56px بحسب مجاله (`RV_DOMKEY` في `06l-rivals.js`: أنعام/أطعمة/سلع/بحر). كبير الرعاة: نُقل ملفه فقط إلى `cutouts/characters/chief-herder.webp` بلا لمس واجهته.
4. **المشاريع:** `PJ_ICON` في `06f-projects.js` (P19 P20 P01 P03 P04 P05 P07 P09 P11 P14)؛ بلا أيقونة = كما هو.
5. **إطار الشخصية:** `img.aframe` (`ui/avatar-frame`) حول صورة اللاعب في `04b-topbar.js` + CSS في القالب؛ `brand/inline.json` أُعيد توليده بـ`first-paint-keys.js`.
6. **الوثائق:** `ICON_REGISTRY.md` (الـ21 «موجود»)، `ART_NEEDED.md`، و`CHANGELOG.md` (سطر لاعب من المواصفة + سطر مبرمج).
- لا تغيير في `src/engine/` ولا الحفظ، ولا رسم جديد، و`brand/next/` كما هو.

## اللقطات (390، قبل/بعد) في `docs/shots/art-link/`
home، office، biz (قبل وبعد)؛ diwan، cchief، portm، council، rivals، projects، topbar (بعد؛ «قبل» لها لا يوجد لأنها لم تكن موجودة).

## الاختبارات (منفردة)
✓ `art-link-ui` (جديد، 390 و1100؛ سُجّل في `test/map.json` و`test/all.sh`) · `icons` · `page-budget` · `art-ui` · `offline-first` · `top-bar-ui` · `page-order-ui` · `home-status-ui` · `details-all-ui` · `deleg-ui` · `diwan-ui` · `skill-ui`.
`art-link-ui` يتحقق: الأيقونات الجديدة، التبويبات، صور الأدوار والمنافسين (مقاسها واكتمالها)، أيقونة المشروع، الإطار، مجلس الناظر؛ بلا طلبات فاشلة ولا أخطاء JS ولا تمرير أفقي.
دُمج `origin/main` قبل التقرير (لم يتقدّم). 

## حجم الصفحة
`index.html` ≈ 3.57 م بايت؛ `page-budget`: 3.17 م حرف (≤ 3.6 م)، و`art-ui` ≤ 4.7 م.

**الحزمة الكاملة لم تُشغَّل** ولم تُعد التقاط ثوابت autopilot.
