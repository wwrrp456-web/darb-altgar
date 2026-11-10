#!/usr/bin/env node
'use strict';
// فحص آلي لمخرَج كيمي (docs/kimi/README.md): node tools/kimi-check.js الملف [--type html|json|md] [--max-lines 400]
// يطبع تقريراً قصيراً: ✓ أو ✗ لكل فحص. لا يعدّل شيئاً. الخروج 0 إن نجحت كلها، 1 إن فشل أي فحص حاسم.
const fs = require('node:fs'), path = require('node:path');
const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--'));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!file || !fs.existsSync(file)) { console.error('الاستعمال: node tools/kimi-check.js الملف [--type html|json|md] [--max-lines 400]'); process.exit(2); }
const type = opt('type', path.extname(file).slice(1).toLowerCase()), maxLines = +opt('max-lines', 400);
const text = fs.readFileSync(file, 'utf8'), lines = text.split('\n').length, res = [];
const chk = (name, ok, note, hard = true) => res.push({ name, ok, note: note || '', hard });
chk('الحجم', lines <= maxLines, lines + ' سطراً (الحد ' + maxLines + ')', false);
chk('بلا بريد إلكتروني', !/[\w.+-]+@[\w-]+\.[\w.]+/.test(text));
chk('بلا مفتاح أو رمز سري', !/(sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{12,}|Bearer\s+[A-Za-z0-9._-]{20,})/.test(text));
// نص ديني ممنوع (قاعدة المشروع: لا نص ديني من خارج المعتمد)
const rel = /[﴿﴾ﷺ]|قال رسول الله|قال الله تعالى|رواه (البخاري|مسلم|الترمذي|أبو داود)|حدّثنا|حدثنا/;
chk('بلا آية ولا حديث', !rel.test(text), rel.test(text) ? 'وُجد نص ديني' : '');
if (type === 'json') { let ok = true, note = ''; try { JSON.parse(text); } catch (e) { ok = false; note = e.message; } chk('JSON صالح', ok, note); }
if (type === 'html') {
  chk('doctype', /^\s*<!doctype html>/i.test(text));
  chk('lang=ar و dir=rtl', /<html[^>]*lang=["']ar/i.test(text) && /<html[^>]*dir=["']rtl/i.test(text));
  chk('meta viewport', /<meta[^>]*name=["']viewport/i.test(text));
  chk('بلا مورد خارجي', !/(src|href)=["']https?:\/\//i.test(text) && !/@import\s+url\(["']?https?:/i.test(text), 'يجب أن يكون الملف مكتفياً بنفسه');
  const open = (text.match(/<div\b/gi) || []).length, close = (text.match(/<\/div>/gi) || []).length;
  chk('توازن div', open === close, open + '/' + close, false);
  let shot = null; try {
    const { chromium } = require('playwright'); const url = 'file://' + path.resolve(file);
    (async () => { const b = await chromium.launch(), out = [];
      for (const w of [390, 360]) { const p = await b.newPage({ viewport: { width: w, height: 800 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
        await p.goto(url); const sw = await p.evaluate(() => document.documentElement.scrollWidth);
        chk('بلا تمرير أفقي على ' + w, sw <= w, 'scrollWidth=' + sw); chk('بلا أخطاء JS على ' + w, errs.length === 0, errs[0] || ''); await p.close(); }
      await b.close(); finish(); })().catch(e => { chk('تشغيل المتصفح', false, e.message, false); finish(); });
  } catch (e) { chk('playwright', false, 'غير متاح: ' + e.message, false); finish(); }
} else finish();
function finish() {
  const bad = res.filter(r => !r.ok && r.hard), warn = res.filter(r => !r.ok && !r.hard);
  console.log('تقرير كيمي: ' + path.basename(file) + ' (' + type + ')');
  for (const r of res) console.log((r.ok ? '✓ ' : r.hard ? '✗ ' : '! ') + r.name + (r.note ? ' — ' + r.note : ''));
  console.log(bad.length ? 'النتيجة: مرفوض (' + bad.length + ' فشل حاسم)' : warn.length ? 'النتيجة: مقبول بملاحظات (' + warn.length + ')' : 'النتيجة: مقبول');
  process.exit(bad.length ? 1 : 0);
}
