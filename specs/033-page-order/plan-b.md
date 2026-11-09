# Implementation Plan: تنظيم الصفحات — ب

- **D1:** ملف واحد `src/ui/08b-pageorder.js` (PAGEORD، `pgOn(k)`، السوق، الزعماء، تبويبات الأكاديمية)، وخطّافات صغيرة في `08-screen-market` و`09-screen-caravan-estate` و`10-screen-lords` و`02-learn` (screenAcademy) و`06-screen-home` و`16-events` (acatab) و`15-render` (بحث القاموس).
- **D2:** استخراج `dealUnit/dealThink` من `dealCard` و`pactCardHTML` من `screenLords` بلا تغيير في الناتج.
- **D3:** `pgOn(k) = PAGEORD[k] && شخصية مختارة && !foldAuto()`.
- **D4:** «كيف حُسب الربح؟» يتبع `profitWhyOpen()` ما لم يغيّر اللاعب حالتها (الفتح التلقائي لا يُحسب اختياراً).
- **D5:** الأكاديمية: علامات `\u0001seg\u0001` في `screenAcademy` تقسم المحتوى إلى head/lessons/cards؛ `academyTabs` يركّب التبويب المختار.
- **D6:** الرئيسية: `storyCard/stateCard/newsHTML` متغيرات؛ الوضع الجديد: حالتك ← (الإرشاد والموسم والمكتب) ← النشرة ← الحكاية (طيّ) ← بقية البطاقات ← «كيف تلعب؟ ودول العالم» (طيّ).
