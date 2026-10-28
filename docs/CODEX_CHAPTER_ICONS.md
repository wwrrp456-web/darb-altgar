# مهمة كودكس: أيقونات الفصول السبعة (توليد صور فقط، جزء من WP-18)

**السياق:** الخطة الرئيسية (`docs/MASTER_PLAN.md` §م٢) تجمع رحلة اللاعب في **سبعة فصول**. حزمة WP-18 (ينفّذها Sonnet) تعرضها كمسار بسبع عُقد في الأكاديمية، ولكل عقدة أيقونة. أسماء الفصول ثابتة ولا تتغير بتوزيع المحتوى داخلها، فتُرسم الأيقونات الآن.

**القواعد نفسها في `docs/CODEX_ART_TODAY.md`:** بلا أي نص أو حرف أو رقم داخل الصورة؛ قناة alpha فعلية (خلفية شفافة حقيقية، لا رقعة شطرنج مرسومة ولا لون صلب)؛ التسليم في `brand/next/chapters/`؛ تحديث `MANIFEST.json` و`PROMPTS_GENERATED.md`؛ commit للمجموعة؛ دمج `origin/main` قبل الدفع. **لا تعدّل `src/` ولا `test/` ولا أي صورة موجودة.** الدمج في اللعبة يتولاه Claude.

## المواصفات
- **المقاس:** 128×128 WebP مفرغة، مثل مجموعة `img/icons/` (انظر `brand/ICONS.md`).
- **الأسلوب:** شبه واقعي مرسوم، كأيقونات `img/icons/` الحالية؛ ألوان الهوية: الذهبي والفيروزي والرمل والعاج (`brand/IDENTITY.md`). خطوط واضحة تُقرأ عند ٣٨px.
- **الاتساق:** الأيقونات السبع مجموعة واحدة: الزاوية نفسها، والإضاءة نفسها، وحجم الموضوع نفسه داخل الإطار (هامش شفاف ~٨٪ من كل جانب). تُعرض متجاورة في مسار، فيجب أن تبدو عائلة واحدة.
- **لا رموز دينية** ولا وجوه بشرية مفصّلة ولا أعلام دول.

## الأيقونات

| # | المعرّف | الفصل | الوصف (للتوليد) |
|---|---|---|---|
| 1 | `ch1` | القافلة الأولى | a single young camel carrying two small cloth bundles, a short rope lead hanging, standing on a strip of sand, hopeful and simple, no text |
| 2 | `ch2` | السوق وزعيمه | a brass balance scale in front of a striped market stall awning, a small rolled pact scroll with a wax seal beside it, no text |
| 3 | `ch3` | الدكان والأمانة | a small arched wooden shop door slightly open, an iron key and a closed leather ledger in front of it, no text |
| 4 | `ch4` | الشراكة والدَّين | two hands clasped in agreement above a small leather coin purse, a reed pen resting beside it, no text |
| 5 | `ch5` | الأرض والأنعام | a sheep standing beside a tied sheaf of wheat and a young date palm, earthy ground, no text |
| 6 | `ch6` | البحر والأقاليم | a small wooden dhow with a triangular sail on gentle waves, a brass compass rose behind it, no text |
| 7 | `ch7` | الإرث | an old carved wooden chest with brass corners, a rolled scroll and an olive branch resting on its lid, no text |

## القبول
- سبع صور WebP بقناة alpha فعلية في `brand/next/chapters/` بالأسماء أعلاه.
- لا نص في أي صورة، والسبع متسقة كمجموعة واحدة.
- `MANIFEST.json` و`PROMPTS_GENERATED.md` محدّثان.
- سطر في `docs/CODEX_TODAY.md` بما سُلّم.
