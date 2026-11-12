// 048: حارس ضد عودة الصور المحجوبة بنظيراتها في cutouts/ (art() يفضّل cutouts/ دائماً).
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), img = path.join(root, 'brand/img');
const exts = /\.(webp|png|jpe?g)$/i, strip = f => f.replace(/\.[^.]+$/, '');
const list = d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => exts.test(f)) : [];
const dirs = fs.readdirSync(path.join(img, 'cutouts'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
// (أ) لا ملف يحجبه نظيره في cutouts/
const shadow = [];
for (const d of dirs) { const cut = new Set(list(path.join(img, 'cutouts', d)).map(strip)); for (const f of list(path.join(img, d))) if (cut.has(strip(f))) shadow.push(d + '/' + f); }
assert.deepEqual(shadow, [], 'ملفات محجوبة بنظيرها في cutouts/ (احذفها): ' + shadow.join(' '));
// (ب) كل مفتاح hero/ أو boss/ حرفي في src/ui له ملف
const has = k => ['', 'cutouts/'].some(p => ['webp', 'png', 'jpg', 'jpeg'].some(x => fs.existsSync(path.join(img, p + k + '.' + x))));
const ui = path.join(root, 'src/ui'), missing = [], direct = [];
for (const f of fs.readdirSync(ui).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(ui, f), 'utf8');
  for (const m of src.matchAll(/\b(?:art|pic|rolePic|av)\(\s*'((?:hero|boss)\/[a-z0-9_]+)'\s*[,)]/g)) if (!has(m[1])) missing.push(f + ': ' + m[1]);
  // (ج) ART['hero/..'] مباشر لمفتاح له نظير في cutouts/ يحجب المسار
  for (const m of src.matchAll(/ART\['((?:hero|boss)\/[a-z0-9_]+)'\]/g)) if (has('cutouts/' + m[1])) direct.push(f + ': ' + m[1]);
}
assert.deepEqual(missing, [], 'مفاتيح معلّقة بلا ملف: ' + missing.join(' | '));
assert.deepEqual(direct, [], "استعمل art('...') لا ART['...'] لمفتاح له نظير في cutouts/: " + direct.join(' | '));
console.log('art-shadow: ok');
