# مهام 051 (توحيد النوافذ + 038د T031؛ حزمة واحدة؛ المواصفة `spec.md`)

**قبل البدء:** تأكد أن 049 في `main` (`closeBtn` في `00-state.js`، ولا `alertPanel`)، وإلا توقّف. اقرأ §0 و§2-د. **لا يتغير نص ولا خطوة في النوافذ المحروسة.** لا حقل حفظ جديد. `?win=off` يعيد القديم حرفاً.

- [x] T001 `src/ui/00w-win.js`: `WIN` و`winOpen/winClose/winTop/winOpenAny/winSync`، المكدس، مستمعات Esc والخلفية والسحب الواحدة، التركيز ودورانه؛ سطر في `src/README.md`.
- [x] T002 لفّ المستمعات العشرة (§0-2) و`topClose` و`maskAgingForeground` بـ`if (!WIN.on)`؛ `winSync` يستدعي `fgSync` القائم دون تغيير شروطه.
- [x] T003 `wclose` في `16-events.js` والأسماء البديلة الثلاثة عشر (§2-ج) مع `onClose` لكل حاوية بما كانت تفعله غير الإخفاء.
- [x] T004 النقل إلى `sheet` (§3): `profile` و`wealth` و`salem` (تبويبات) مجالات في `dDomains`؛ `topPanel` و`modal` (trip/cargo/good) و`backupPanel` بـ`winOpen` على حاوياتها؛ فتح بـ`data-dchip`.
- [x] T005 `lesson` و`agingPanel` والاحتفال و`dlg` بنوع `lesson`؛ `react` و`salemPeek` بنوع `react`؛ النوافذ المحروسة بـ`guard:true` (الحصّالة `modal:'native'`).
- [x] T006 `ASK_SRC` في `06o-details.js` وتسجيل المصادر القائمة (hs، tasks، council، chief، fmx، bm، med…) في ملفاتها؛ `dChoose` و`officeCards` يقرآن منه.
- [x] T007 **038د T031** (§4): مجال `tasks` و`tkTopHTML`؛ `tkHomeRow` يفتح `tasks`؛ حذف `F('hs-tasks')` خلف المفتاح؛ شارة «المهام» في «اليوم»؛ ظهور الاختيار في الموضعين. علّم T031 في `specs/038-tasks/tasks.md` بإحالة إلى هنا.
- [x] T008 الرد اللحظي (§5): جدول الحصر في التقرير (يُحذف/يبقى بالسبب)، وحذف المصنَّف «يكفي toast»؛ `toast` بـ`role="status"` و`aria-live` ومدة `WIN.toastMs`.
- [x] T009 `test/win-ui.test.js` (§6) وتحديث الاختبارات القائمة بتعليق «051: …»؛ التسجيل في `all.sh` و`map.json`.
- [x] T010 `report.md` (≤ 40 سطراً): الأرقام (أنماط 14→3، Esc 10→1، `data-act` 107→؟)، جدول §5، حجم الصفحة قبل/بعد (§8)، جدول «لا صوري»؛ `node build.js` + `node test/run.js --changed`؛ «الحزمة الكاملة لم تُشغَّل»؛ `CHANGELOG` (§9). ⛔ توقف حتى مراجعة المنسّق.
