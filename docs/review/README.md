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
