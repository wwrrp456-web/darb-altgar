# مهمة كودكس الأخيرة (Opus، 2026-11-11): كل ما بقي من الرسم

بعد هذه المهمة لا رسم معلّق على كودكس. أي رسم جديد بعدها يأتي مع حزمة جديدة تحتاجه.

## القواعد (كما في `docs/CODEX_ART_2026-11-11.md` §0)
- **رسم فقط:** لا تلمس `src/` ولا `test/` ولا `brand/img/` ولا `build.js`، ولا تشغّل البناء، ولا تدفع إلى `main`.
- **الفرع:** `codex/art-final` من `origin/main`. ارفع بعد كل مهمة.
- **الأسلوب:**
  - شبه واقعي مرسوم، بالذهبي والفيروزي والرمل والعاج.
  - بلا نص ولا حروف ولا أرقام، وبلا رموز دينية أو سياسية.
  - شفافية فعلية (ألفا حقيقي) وزوايا شفافة تماماً، وبلا خلفية ولا ظل مستطيل.
  - لا تستعمل مسار تصدير JPG في `brand/crop_sheets.py`.
- **اقرأ أولاً:** `brand/ICONS.md` و`brand/ICON_TRANSPARENCY.md` و`brand/IDENTITY.md` و`brand/PROMPTS.md` و`brand/CHARACTERS.md`.

## المهمة 1: أيقونات تبويبات «الأعمال» الثلاث → `brand/next/biz-tabs/`
مطلوبة في `docs/guide/ART_NEEDED.md` (قسم «تبويبات المكتب»، السطر `icons/biz-tab-*`). وهي اليوم مؤقتة من `nav/caravan` و`nav/empire`.
- **الأسلوب:** أيقونات الشريط السفلي `brand/img/nav/` (أكبر حضوراً وأبسط تفاصيل)، ومنسجمة مع تبويبات المكتب الأربع التي رسمتَها (`brand/next/office-tabs/`).
- **المقاس:** 128×128، والحجم ≤ 5 KB (ولا يتجاوز 8).

| الملف | التبويب | ما يُرسم |
|---|---|---|
| `biz-tab-caravan.webp` | القوافل | جمل محمّل بصندوقين وكيس، جانبي يمشي |
| `biz-tab-factory.webp` | المصانع | ورشة صغيرة بقبو ومدخنة يخرج منها دخان خفيف، وأمامها برميل |
| `biz-tab-bank.webp` | المال والمصرف | صندوق خزينة خشبي مصفّح بالنحاس، مفتوح قليلاً عليه دنانير (يختلف عن صرّة «المال» وعن `ui-expenses`) |

- **الفحص:** `python3 tools/art-check.py icons brand/next/biz-tabs`.
- **اللوحة:** `python3 tools/art-sheet.py brand/next/biz-tabs docs/shots/codex-art/biz-tabs.png`.
- **ارفع.**

## المهمة 2: شخصية كبير الرعاة «صاحب الفرص» → `brand/next/characters/chief-herder.webp`
سيصير في حزمة 035ج تاجر مواشٍ لحساب اللاعب: يقارن الأسواق، ويسوق القطيع إليها، ويكتشف أسواقاً جديدة (النموذج `docs/design/chief-herder-mockup.html`). صورته اليوم صورة راعٍ عادي صغيرة (`cutouts/team/shepherd`)، وهو يحتاج هيئة تاجر خبير لا راعٍ بسيط.
- **الوصف:**
  - رجل في الخمسين، وجه لوّحته الشمس، ولحية قصيرة وخطها الشيب، ونظرة ذكية واثقة.
  - ثوب أبيض تحت بشت بني فاتح بحاشية ذهبية رفيعة، وعمامة بيضاء ملفوفة.
  - يمسك عصا رعي طويلة بيد، ودفتراً صغيراً مطوياً بالأخرى.
  - وعند قدمه رأس خروف واحد يطل من جانبه.
  - وقفة نصفية إلى الركبة، متجهة قليلاً إلى اليسار.
- **الانسجام:** مع شخصيات `brand/img/cutouts/characters/` (الناظر وشيخ القوافل والشهبندر) في النسب والإضاءة والأسلوب، ومختلف عنهم بوضوح في الهيئة والعمر.
- **المقاس والحجم:** 512×512 RGBA بشفافية فعلية، والحجم ≤ 40 KB (ولا يتجاوز 60).
- **الفحص:** `SIDE=512 TARGET_KB=40 MAX_KB=60 python3 tools/art-check.py icons brand/next/characters`.
- **اللوحة:** `python3 tools/art-sheet.py brand/next/characters docs/shots/codex-art/chief-herder.png`.
- **ارفع.**

## التقرير: `docs/CODEX_ART_FINAL_REPORT.md` (≤ 15 سطراً)
- ما رُسم، وجدولا الفحص، وآخر التزام.
- وجملة صريحة: «لا رسم معلّق على كودكس بعد هذه المهمة».

## المهام
- [ ] **T0** `git fetch origin main claude/lucid-tesla-i1vu6c`، ثم `git checkout -B codex/art-final origin/main`، ثم `git checkout origin/claude/lucid-tesla-i1vu6c -- docs/CODEX_ART_FINAL_2026-11-11.md tools/art-check.py`.
- [ ] **T1** المهمة 1، ثم الرفع: `git push -u origin codex/art-final`.
- [ ] **T2** المهمة 2، ثم الرفع.
- [ ] **T3** التقرير، ثم الرفع.
- [ ] ⛔ **توقف.**
