# ملف مراجعة النصوص الشرعية

- `docs/SHARIA_REVIEW.docx`: الملف الذي يُرسَل للمراجع (Word، RTL، جداول قرار لكل بند). ونسخته `docs/SHARIA_REVIEW.pdf` للقراءة.
- يُولَّد من نصوص اللعبة نفسها فلا يختلف عمّا يراه اللاعب:

```sh
node docs/review/export_data.js > /tmp/review_data.json
python3 docs/review/build_sharia_review.py          # يكتب docs/SHARIA_REVIEW.docx
soffice --headless --convert-to pdf --outdir docs docs/SHARIA_REVIEW.docx
```

- بعد عودة الملف من المراجع: تُطبَّق التعديلات في `src/cards.js` و`src/lessons.js` و`src/engine.js` (معاملات `FIN` و`TK`)، ثم تُعاد الاختبارات (`sh test/all.sh`) ويُعاد توليد الملف.
