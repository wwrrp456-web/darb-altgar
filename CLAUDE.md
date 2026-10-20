# درب التجّار (تعليمات Claude)

لعبة استراتيجية تجارية بالمتصفح، ملف HTML واحد يُبنى بـ `node build.js` من أجزاء `src/engine/` و`src/ui/` (خريطتها في `src/README.md`؛ و`src/engine.js` مولَّد فلا يُعدَّل) و`src/template.html`، وتُنشر على GitHub Pages ويمكن تثبيتها على الجوال (PWA في `pwa/`).

- التواصل مع بن محمود بالعربية، مختصراً ومباشراً.
- الأسلوب الفني المعتمد: شبه واقعي مرسوم، الأيقونات والشخصيات بخلفيات شفافة فعلية (WebP مع alpha)، مشاهد أفقية ٢١:٩. النصوص خارج الرسومات، باستثناء شعار اللعبة. لوحة الواجهة أزرق هادئ وعاجي وذهبي؛ التفاصيل في `brand/README.md` و`brand/IDENTITY.md` و`brand/PROMPTS.md`.
- الرسومات في `brand/img/` وتُدمج تلقائياً عند البناء. الأيقونات والشخصيات WebP مع alpha فعلية، والمشاهد JPG أو WebP. لا تستخدم مسار تصدير JPG في `brand/crop_sheets.py` للأيقونات أو الشخصيات المفرغة.
- قبل أي دفع: `node build.js` ثم اختبارات `test/screens.test.js` و`lords` و`market` و`tutorial`، ولا تمرير أفقي على الجوال (٣٩٠px).
- الموقع يُخدَّم من فرع `main` مباشرة (Pages: Deploy from a branch)، فيجب أن يكون `index.html` وملفات `pwa/` المنسوخة في الجذر (manifest.webmanifest, sw.js, icon-*.png, apple-touch-icon.png) مبنية ومرفوعة: شغّل `node build.js` وأضفها إلى الـ commit قبل كل دفع. لا تدفع كسراً للبناء.
- الأصول الحالية: الصور المفرغة للشخصيات في `cutouts/` وتعابيرها في `expressions/`، وأيقونات السلع والأدوات والقوائم والخريطة مفرغة. راجع `brand/CHARACTERS.md` و`brand/ICONS.md` و`brand/ICON_TRANSPARENCY.md` قبل إضافة أصول جديدة.
