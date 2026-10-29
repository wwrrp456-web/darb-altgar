# ملف مراجعة النصوص الشرعية

- `docs/SHARIA_REVIEW.docx`: الملف الذي يُرسَل للمراجع (Word، RTL، جداول قرار لكل بند). ونسخته `docs/SHARIA_REVIEW.pdf` للقراءة.
- يُولَّد من نصوص اللعبة نفسها فلا يختلف عمّا يراه اللاعب:

```sh
node docs/review/export_data.js > /tmp/review_data.json
python3 docs/review/build_sharia_review.py          # يكتب docs/SHARIA_REVIEW.docx
soffice --headless --convert-to pdf --outdir docs docs/SHARIA_REVIEW.docx
```

- بعد عودة الملف من المراجع: تُطبَّق التعديلات في `src/cards.js` و`src/lessons.js` و`src/engine.js` (معاملات `FIN` و`TK`)، ثم تُعاد الاختبارات (`sh test/all.sh`) ويُعاد توليد الملف.

## ملف المراجعة اللغوية والأدبية الشامل

- `docs/review/batches/`: ملف تعليمات + ٢١ دفعة صغيرة (٣٠٠–١٤٠٠ كلمة) تُسلَّم للمراجع واحدة بعد أخرى (للمراجع اللغوي)، مع باب الترابط وملاحظة قفل السفر. الصفوف الشرعية مقفلة للمختص.
- يُولَّد من نصوص اللعبة نفسها:

```sh
node docs/review/export_texts.js > /tmp/texts_data.json
python3 docs/review/build_texts_review.py intro; for i in $(seq 1 21); do python3 docs/review/build_texts_review.py $i; done
```

## الدفعات بالأرقام (WP-20)

جدول الاعتماد: `docs/review/STATUS.md` (مولَّد) والسجل `docs/review/registry.json`. ثلاثة أوامر:

```sh
node tools/review-inventory.js                      # يجدّد السجل والجدول من نصوص اللعبة (لا يعيد ترقيم بند موجود)
node tools/review-export.js 07-اسم [--ids H-05,H-06]  # يكتب docs/review/batches/07-اسم.md جاهزاً للنسخ (الافتراضي: ما بلا اعتماد موثّق، ≤ 30 بنداً)
node tools/review-import.js الرد.md --batch 07-اسم [--dry]  # يطبّق رد المختص بالأرقام: «معتمد» أو نص بديل أو «يُحذف»
```

- الرد سطر لكل رقم: `[H-05] معتمد` أو `[H-05]` ثم النص البديل أو `[H-05] يُحذف`. يُرفض الرقم المفقود أو المكرر أو الغريب بلا كتابة.
- النص البديل يُستبدل في الشيفرة بحرفه للبنود ذات النص الواحد فقط؛ البنود متعددة الحقول (بطاقة، مسألة، مصطلح) تُعلَّم «تطبيق يدوي».
- «يُحذف» لا يحذف من الشيفرة: يضع المعرّف في `src/review-flags.js` (hidden) ويُبلَّغ بن محمود، والحذف قرار تنفيذ لاحق. وبعد أي كتابة يعاد البناء واختبارا `quran-prefix` و`approved-batch05`، فإن فشل شيء أُعيدت الملفات.
- لا كتابة إلى أي `APPROVED_*`، ولا إخفاء إلا بقرار بن محمود (الافتراضي فارغ).
- «معتمد» تليها إشارات مصادر مثل `[1][2]` تُعدّ «معتمد» لا نصاً بديلاً؛ وقسم `Sources:` أو `المصادر:` في آخر الرد يُتجاهل ويبقى في ملف الرد (`docs/review/batches/NN-اسم.reply.md`، يُحفظ كما ورد).
- الاستيراد يعيد توليد `STATUS.md` من السجل؛ وإعادة الجرد (`review-inventory.js`) تُبقي ما اعتمده الاستيراد وتعدّ ملفات الردود `*.reply.md` مصدراً للاعتماد.
