خط الأساس: `78a1d20`؛ تاريخ البناء: 2026-10-21. تُوصف اللعبة كما هي في هذه النسخة، بما فيها تعليمات المهمة المؤرخة 2026-10-22.

# سجل الدليلين


- [لاعب] 2026-10-22: يبدأ اللاعب الجديد بصفحة الحكاية وحدها (قصة الجدّ والقافلة)، ثم يضغط «ابدأ الرحلة» فتظهر اللعبة وتبدأ مقدمة عمّ سالم.
- [لاعب] 2026-10-21: اكتملت فصول دليل التاجر للجوال، من أول شراء ورحلة إلى المراحل المتقدمة، بصور فعلية وقاموس للمصطلحات.
- [لاعب] 2026-10-21: اختر تاريخ انطلاقك، وتابع التاريخ الهجري والميلادي ودفتر السنوات والمواسم المقبلة من نافذة التقويم.
- [لاعب] 2026-10-21: تعرف إلى مواعيد رمضان والعيد والحج وأسواق عكاظ ومجنّة وذي المجاز، والحصاد والشتاء، وكيف تستعد لبضاعتك.
- [لاعب] 2026-10-21: يقل خطر طرق الجزيرة في الأشهر الحرم إلى النصف من المستوى 4، مع بقاء الحاجة للحماية.
- [لاعب] 2026-10-21: راجع حول الزكاة الهجري، والفرق بين قطيع التجارة وقطيع الرعي والنسل؛ الجاموس مع البقر في حساب الأنعام.
- [لاعب] 2026-10-21: مجلس السوق يضم 48 مسألة، مع شرح مبسط وتفصيل للكبار ودفتر للأحكام التي تعلمتها.
- [لاعب] 2026-10-21: إذا ظهر عيب خفي، تعرف إلى مهلة الرد عند البائع أو الأرش، واحفظ البضاعة ولا تبعها بعد معرفة العيب.
- [لاعب] 2026-10-21: اقرأ رسم التوظيف والأجر المتكرر للحارس والطاقم والقائد قبل تعيينهم.
- [لاعب] 2026-10-21: تساعد الرياح الإبحار شرقًا من أبريل إلى سبتمبر وغربًا من أكتوبر إلى مارس؛ راقب شارتها قبل الانطلاق.
- [لاعب] 2026-10-21: يشرح القاموس فدية الطريق وخدمات السوق والهدية والرشوة والعُشور، وتجد معنى اختصارات المبالغ الكبيرة.
- [لاعب] 2026-10-22: ثبّت دليل اللاعب بأيقونته بجانب اللعبة من قائمة ⋯ داخل اللعبة؛ يعمل دون اتصال ويتحدّث وحده، ويمكنك تحميل نسخة PDF من الزرّ أعلى الصفحة.
- [مبرمج] 2026-10-21: تم تحديث مرجع التقويم والمواسم والأشهر الحرم وحول الزكاة والرياح من الشيفرة الحالية، مع فصل منطق اللاعب عن الروبوتات.
- [مبرمج] 2026-10-21: تم قياس اختبار الضغط مجددًا بالأمر node test/stress.js وحفظ تفاصيل خط الأساس؛ لا أرقام منسوخة من توثيق سابق.
- [مبرمج] 2026-10-21: يعرض المرجع 48 مسألة وبيانات الأجر المعلوم والجاموس، مع تحقق تلقائي من الثوابت والسلع والأهداف والمصادر.
- [مبرمج] 2026-10-21: التسليم player.html وplayer.pdf وdev.pdf؛ HTML المبرمج وسيط داخل src، ولا رابط إليه في دليل اللاعب.
- [مبرمج] 2026-10-21: يولد السكربت فصول التغييرات من أسطر هذا السجل، ويترك حزمة النشر وسياسة الأمان الأصلية دون تعديل.

- [لاعب] 2026-10-21: تحسن عرض الدليل على الشاشات الصغيرة والطباعة، مع رابط تنزيل PDF وقسم التغييرات في نهاية الصفحة.
- [مبرمج] 2026-10-21: أضيف تقرير تحقق وقائمة الملفات وتعليمات إعادة البناء والتصوير، وضغط صور نسخ الطباعة دون تغيير أصول اللعبة.

## ما يلزم تحديثه عند تغيّر اللعبة

كل تعديل له أثر على اللاعب يسجل بسطر مؤرخ موسوم [لاعب]، والتفصيل التقني بسطر [مبرمج]. يعرض كل دليل أحدث 20 سطرًا لنوعه.

| النظام | مصدر الشيفرة | مصدر فصل المبرمج | فصل اللاعب |
|---|---|---|---|
| المشروع في صفحة | `build.js`, `src/README.md`, `src/ui/03-time-routing.js` | `src/dev-core.json#project` | خاص بالمبرمج |
| بنية الشيفرة وخريطة الملفات | `build.js`, `src/engine/00-head.js`, `src/engine/31-api.js` | `src/dev-core.json#architecture` | خاص بالمبرمج |
| البناء والنشر | `build.js`, `src/ui/01-save.js`, `pwa/sw.js` | `src/dev-core.json#build-deploy` | خاص بالمبرمج |
| الاختبارات وقياس الاقتصاد | `test/run.js`, `test/all.sh`, `test/map.json` | `src/dev-core.json#tests` | خاص بالمبرمج |
| العشوائية والحتمية | `src/engine/02-core-world.js`, `src/engine/22-learn.js`, `src/engine/26-stress.js` | `src/dev-core.json#determinism` | خاص بالمبرمج |
| الحفظ والترحيل | `src/engine/00-head.js`, `src/engine/27-save.js`, `src/ui/00-state.js` | `src/dev-core.json#save` | خاص بالمبرمج |
| سير عمل الرسومات | `build.js`, `src/ui/00-state.js`, `src/icons.js` | `src/dev-core.json#art` | خاص بالمبرمج |
| قواعد المشروع الثابتة | `CLAUDE.md`, `test/numerals.test.js`, `test/textlint.test.js` | `src/dev-core.json#rules` | خاص بالمبرمج |
| الاقتصاد والأسعار | `src/engine/02-core-world.js`, `src/engine/03-prices.js`, `src/engine/08-trade.js` | `src/dev-systems.json#prices` | `src/player.json#profit` |
| السلع والمدن ومكة والمدينة | `src/engine/01-data-world.js`, `src/engine/27-save.js`, `src/lore.js` | `src/dev-systems.json#goods-world` | `src/player.json#screens` |
| الصفقات والتكلفة الواصلة | `src/engine/08-trade.js`, `src/engine/25-quotes.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#trade` | `src/player.json#profit` |
| البضاعة المعيبة وخيار الرد والأرش | `src/engine/22-learn.js`, `src/engine/24-advisor-actions.js`, `src/engine/27-save.js` | `src/dev-systems.json#defects` | `src/player.json#profit` |
| المساومة وثقافات الأسواق | `src/engine/05-haggle.js`, `src/engine/24-advisor-actions.js`, `src/ui/05-scenes-deals.js` | `src/dev-systems.json#haggle` | `src/player.json#haggle-player` |
| القوافل والسفر البري والمسارات | `src/engine/09-travel.js`, `src/engine/09d-routes.js`, `scripts/gen-routes.py` | `src/dev-systems.json#land` | `src/player.json#travel` |
| السفر البحري والسفن | `src/engine/09b-sea.js`, `src/engine/09d-routes.js`, `src/ui/09-screen-caravan-estate.js` | `src/dev-systems.json#sea` | `src/player.json#travel` |
| إيقاع السفر ومؤن السفر | `src/engine/09c-pace.js`, `src/ui/03-time-routing.js` | `src/dev-systems.json#pace` | `src/player.json#travel` |
| المخاطر واللصوص والقراصنة | `src/engine/09-travel.js`, `src/engine/09b-sea.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#risks` | `src/player.json#travel` |
| الأجر المعلوم والالتزامات اليومية | `src/engine/20-finance.js`, `src/engine/10-captains.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#wages` | `src/player.json#travel` |
| الدكاكين والمخازن والعمال | `src/engine/06-estate.js`, `src/engine/19-player.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#estate` | `src/player.json#properties` |
| المزارع والقطعان والتكاثر | `src/engine/07-farm.js`, `src/engine/09-travel.js`, `src/engine/18-butcher.js` | `src/dev-systems.json#farms` | `src/player.json#properties` |
| المصانع ومديرو الأعمال | `src/engine/13-factories.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#factories` | `src/player.json#properties` |
| الوكلاء والطلبات والتجار المنافسون | `src/engine/21-orders.js`, `src/engine/12-agents.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#agents` | `src/player.json#properties` |
| العملات والصرف والذهب والفضة | `src/engine/02-core-world.js`, `src/engine/24-advisor-actions.js`, `src/ui/04-header.js` | `src/dev-systems.json#currency` | `src/player.json#money` |
| الزعماء والعقود والشراكات | `src/engine/04-bosses.js`, `src/engine/05-haggle.js`, `src/engine/24-advisor-actions.js` | `src/dev-systems.json#bosses` | `src/player.json#pacts-player` |
| صندوق التكافل التعاوني | `src/engine/14-dialogs.js`, `src/engine/19-player.js`, `src/engine/20-finance.js` | `src/dev-systems.json#takaful` | `src/player.json#travel` |
| الدين والقرض والحصّالة والتمويل | `src/babylon.js`, `src/engine/22-learn.js`, `src/engine/20-finance.js` | `src/dev-systems.json#debt` | `src/player.json#money` |
| الزكاة: التجارة وبهيمة الأنعام | `src/engine/23-zakat.js`, `src/engine/24-advisor-actions.js`, `src/ui/14-salem-notebook.js` | `src/dev-systems.json#zakat` | `src/player.json#money` |
| المواسم والصدمات الاقتصادية | `src/engine/16-seasons.js`, `src/engine/17-shocks.js`, `src/engine/16b-calendar.js` | `src/dev-systems.json#seasons` | `src/player.json#learning-player` |
| التقويم وتاريخ الانطلاق ودفتر السنوات | `src/engine/16b-calendar.js`, `src/engine/11-day.js`, `src/engine/16-seasons.js` | `src/dev-systems.json#calendar` | `src/player.json#screens` |
| التعلّم والأسرار والألواح ومجلس السوق | `src/lessons.js`, `src/lore.js`, `src/babylon.js` | `src/dev-systems.json#learning` | `src/player.json#learning-player` |
| عمّ سالم والمهمات والتظليل | `src/ui/13-guide-mission.js`, `src/ui/14-salem-notebook.js`, `src/ui/02-learn.js` | `src/dev-systems.json#salem` | `src/player.json#first-five` |
| الحوارات والساحات | `src/dialogs.js`, `src/engine/14-dialogs.js`, `src/ui/05-scenes-deals.js` | `src/dev-systems.json#dialogs` | `src/player.json#screens` |
| الخريطة المسطحة والمجسمة | `src/ui/07-screen-map.js`, `src/world-map.js`, `src/map3d.js` | `src/dev-systems.json#maps` | `src/player.json#screens` |
| الواجهة والإيقاع والجوال | `src/ui/00-state.js`, `src/ui/03-time-routing.js`, `src/ui/04-header.js` | `src/dev-systems.json#interface` | `src/player.json#screens` |
| الإمبراطورية والمنافس واللعب الحر | `src/engine/15-rival.js`, `src/engine/24-advisor-actions.js`, `src/engine/30-freeplay.js` | `src/dev-systems.json#empire-freeplay` | `src/player.json#learning-player` |
| مرجع البيانات الحالي: السلع والوصفات والمحتوى | `src/engine/01-data-world.js`, `src/fiqh.js`, `src/cards.js` | `src/dev-systems.json#data-reference` | `src/player.json#glossary` |
| أدوات المطوّر والتسريع والتشغيل التلقائي | `src/ui/17-dev-autopilot.js`, `src/ui/16-events.js`, `src/ui/03-time-routing.js` | `src/dev-tools.json#dev-tools` | خاص بالمبرمج |
| مراحل اللعبة وجدول الوصول السريع | `src/lessons.js`, `src/engine/11-day.js`, `src/engine/22-learn.js` | `src/dev-stages.json#stages` | خاص بالمبرمج |

### التاب بالعرض الأفقي (2026-10-22)
- [لاعب] 2026-10-22: على التاب (٩٦٠–١٢٨٠px) لم يعد الشريط العلوي الكبير يلازم الشاشة ويأكل نحو ثلث ارتفاعها؛ يمرّ مع المحتوى، ويظهر الشريط المصغّر عند التمرير وتحته شريط التنقل ظاهراً وقابلاً للنقر.
- [مبرمج] 2026-10-22: `#top` غير مثبّت عند min-width:761px، والمصغّر `.hmini.show` يُثبَّت على كل العروض، و`#nav` يُزاح تحته؛ اختبار `tablet-ui` (٩٦٠×٦٠٠ حتى ١٢٨٠×٨٠٠).

### سرعة فتح اللعبة (2026-10-22)
- [لاعب] 2026-10-22: تفتح اللعبة بسرعة بعد أول مرة؛ لم تعد الصفحة (نحو ١٤ ميغابايت) تُنزَّل من جديد في كل فتحة، وعند صدور نسخة جديدة يظهر زر «حدّث الآن» كالمعتاد.
- [مبرمج] 2026-10-22: `pwa/sw.js` يخدم الصفحة من الذاكرة (جلب واحد بعد التثبيت أو التحديث)، و`version.json` وحده بلا ذاكرة؛ و«حدّث الآن» ينتظر تفعيل ملف العمل الجديد قبل إعادة التحميل.
