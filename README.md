# 🐪 درب التجّار

لعبة استراتيجية تجارية بالمتصفح: قافلة وأسواق وإمبراطورية تمتد من مصر إلى الصين.

**العب الآن:** https://wwrrp456-web.github.io/darb-altgar/

## التثبيت على الجوال
- **أندرويد (كروم):** القائمة ⋮ ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
- **آيفون (سفاري):** زر المشاركة ← «إضافة إلى الشاشة الرئيسية».

يعمل دون اتصال بعد أول فتح، ويُحفظ تقدّمك في متصفح الجهاز.

## التطوير
```
node build.js          # يبني index.html وsite/ وdist-artifact.html
node test/screens.test.js   # اختبارات الواجهة (Playwright)
node test/bosses.test.js    # اختبارات المحرك
```
- `src/engine.js` المحرك، `src/ui.js` الواجهة، `src/template.html` القالب والأنماط.
- `brand/img/` الرسومات (تُدمج في الصفحة عند البناء)، و`brand/PROMPTS.md` برومتات توليد الصور.
- `pwa/` ملفات التثبيت (manifest وservice worker وأيقونات).
- يُنشر الموقع من جذر فرع `main` (Pages: Deploy from a branch)، لذا يُرفع `index.html` المبني مع ملفات التثبيت في الجذر بعد كل `node build.js`.
