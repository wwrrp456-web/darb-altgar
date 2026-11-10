# مهمة كودكس: باكج أيقونات نظام التفاصيل (037) — مولَّد من `brand/ICON_REGISTRY.md` (لا تعدّله يدوياً)

**الحجم:** 21 أيقونة جديدة فقط (الباقي مرسوم أصلاً). **الاسم ظاهر دائماً بجانب الأيقونة** في اللعبة، فلا تكتب نصاً داخل الأيقونة. اقرأ `brand/ICONS.md` و`brand/ICON_TRANSPARENCY.md` و`brand/IDENTITY.md`، وانظر أيقونات اللعبة الموجودة (`brand/img/icons/` و`brand/img/ui/`) لتنسجم معها.

## المواصفات المشتركة
WebP **شفاف فعلي (alpha)** 128×128، شبه واقعي مرسوم بألوان الذهبي والفيروزي والرمل والعاج، بلا ظل مستطيل ولا خلفية، تُقرأ واضحة عند 28 و44 و68 بكسل. لا تستعمل مسار تصدير JPG في `crop_sheets.py`. لا تربطها بـ`src/icons.js` (الربط من Sonnet بعد المراجعة).

## الدفعة P (8، تجريبية؛ تفاصيل رسمها في `docs/CODEX_ICONS_PILOT.md`)
| # | الملف | الاسم الظاهر | يُستعمل في |
|---|---|---|---|
| 1 | `brand/img/icons/ui-shops.webp` | الدكاكين | شارة الدكاكين؛ بطاقات الدكان |
| 2 | `brand/img/icons/ui-workers.webp` | العمّال | شارة العمّال؛ التوظيف والترقية |
| 3 | `brand/img/icons/ui-risks.webp` | المخاطر | شارة المخاطر؛ خطر الطريق |
| 4 | `brand/img/icons/ui-expenses.webp` | المصاريف | شارة المصاريف؛ الأجور والمستحقات |
| 5 | `brand/img/icons/ui-promote.webp` | رقِّه | خيار: الترقية |
| 6 | `brand/img/icons/ui-delegate.webp` | اتركه للأمين | خيار: التفويض للأمين والناظر |
| 7 | `brand/img/icons/ui-restock.webp` | عبّئ | خيار: التعبئة من المخزن |
| 8 | `brand/img/icons/ui-postpone.webp` | أجّل | خيار: التأجيل والانتظار |

## الدفعة F (13، بعد اعتماد أسلوب P)
| # | الملف | الاسم الظاهر | يُستعمل في |
|---|---|---|---|
| 1 | `brand/img/icons/ui-tasks.webp` | المهام | شارة المهام (038) |
| 2 | `brand/img/icons/ui-feuds.webp` | الخصومات | شارة الخصومات بين الزعماء (036) |
| 3 | `brand/img/icons/ui-hire.webp` | وظّف | خيار: توظيف بائع أو عامل أو قائد |
| 4 | `brand/img/icons/ui-transfer.webp` | انقل | خيار: نقل عامل أو بضاعة بين دكانين |
| 5 | `brand/img/icons/ui-swap.webp` | غيّر السلع | خيار: استبدال سلعة رف أو تدويره |
| 6 | `brand/img/icons/ui-pay.webp` | ادفع | خيار: سداد الأجور والمستحقات |
| 7 | `brand/img/icons/ui-accept.webp` | اقبل | خيار: قبول اقتراح أو دفعة |
| 8 | `brand/img/icons/ui-decline.webp` | ارفض | خيار: رفض دفعة أو اقتراح |
| 9 | `brand/img/icons/ui-pricetag.webp` | سعّر | خيار: مراجعة السعر أو خفضه |
| 10 | `brand/img/icons/ui-sell.webp` | بِع | خيار: بيع الراكد |
| 11 | `brand/img/icons/ui-rest.webp` | استرح | خيار: راحة القافلة |
| 12 | `brand/img/icons/ui-build.webp` | ابنِ | خيار: بناء دكان أو مخزن أو مصنع |
| 13 | `brand/img/icons/ui-repair.webp` | أصلح | خيار: إصلاح مصنع متآكل |

## التسليم
`node build.js` وأضف الصور والملفات المولَّدة للالتزام، واختبار `icons` فقط، وتقرير `docs/CODEX_ICONS_REPORT.md` (ما رُسم وما تُرك وكم استهلكت من حدّك)، وادفع إلى main وتحقق بـ`git ls-tree origin/main`. ثم توقف قبل الخريطة.
