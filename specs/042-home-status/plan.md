# خطة 042 — «حال أعمالي»
- **المحرك** `src/engine/30j-home-status.js`: `HOMEST {on,rows:5,snapDays:7,ring:5}`، `hsDay` (لقطة أسبوعية `{d,inc,exp}` في `P.hs` عند `HOMEST.on` فقط، من `11-day.js`)، و`hsView` قراءة فقط: دفتر، صندوق، دكاكين، سيولة، منافسون. لا حساب اقتصادي جديد.
- **الواجهة** `src/ui/06q-home-status.js`: البطاقة بعد «حالتك» في `06-screen-home.js`؛ كل سطر زرّ `dchip-row` (≥44px) يفتح `dsheet` القائم (نوافذ طيّ 037 للدفتر والصندوق والدكاكين والمنافسين، ونطاق `hs:liq` للسيولة بخياراتها).
- **التنبيهات**: `hsAskCards` → `officeCards` («اليوم») بمكوّن `ask`؛ الأفعال القائمة فقط (`A.shopRepair`، `dLiqCards`، فتح نافذة المنافسين)، والتأجيل بـ`ui.dsnooze` (`dPostpone`).
- **الوصول**: الرئيسية ← سطر ← نافذة (نقرتان)، وأزرار النوافذ تنقل عبر `data-act="hsgo"`.
- **الإطفاء**: `HOMEST.on=false` لا بطاقة ولا تنبيه ولا `P.hs`؛ وعلى غير وضع اللاعب (`dLive`) تبقى الرئيسية القديمة (اتفاقية 037).
- **الاختبارات**: `home-status.test.js` (محرك) و`home-status-ui.test.js` (390/1100)، وتثبيت `HOMEST.on=false` في `skill` و`skill-b`.
