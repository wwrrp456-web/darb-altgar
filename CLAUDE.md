# درب التجّار (تعليمات Claude)

لعبة استراتيجية تجارية بالمتصفح، ملف HTML واحد يُبنى بـ `node build.js` من `src/engine.js` و`src/ui.js` و`src/template.html`، وتُنشر على GitHub Pages ويمكن تثبيتها على الجوال (PWA في `pwa/`).

- التواصل مع بن محمود بالعربية، مختصراً ومباشراً.
- الأسلوب الفني المعتمد: شبه واقعي مرسوم، خلفية فحمية للأيقونات والشخصيات، مشاهد أفقية ٢١:٩، بلا نصوص داخل الصور. التفاصيل في `brand/README.md` و`brand/PROMPTS.md`.
- بن محمود يولّد الصور خارجياً (Gemini/ChatGPT) من البرومتات ويرسلها؛ أقصّها بـ `brand/crop_sheets.py` وأضعها في `brand/img/<نوع>/<id>.jpg`، فتُلتقط تلقائياً عند البناء (مفاتيح `goods/ ui/ boss/ hero/ scene/ city/ map/world brand/{emblem,cover,splash}`).
- قبل أي دفع: `node build.js` ثم اختبارات `test/screens.test.js` و`lords` و`market` و`tutorial`، ولا تمرير أفقي على الجوال (٣٩٠px).
- الموقع يُخدَّم من فرع `main` مباشرة (Pages: Deploy from a branch)، فيجب أن يكون `index.html` وملفات `pwa/` المنسوخة في الجذر (manifest.webmanifest, sw.js, icon-*.png, apple-touch-icon.png) مبنية ومرفوعة: شغّل `node build.js` وأضفها إلى الـ commit قبل كل دفع. لا تدفع كسراً للبناء.
- الحالة، المرحلة التالية: صور المدن الست عشرة (`city/`)، خريطة العالم (`map/world`)، تاجر السعودية (`hero/sa`)، الشعار والغلاف وشاشة التحميل (`brand/`).
