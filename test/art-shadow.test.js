// 048: حارس ضد عودة الصور المُظلَّلة (brand/img/<D>/<N>.webp المحجوبة بنظيرها في cutouts/) وضد المفاتيح المعلّقة: node test/art-shadow.test.js
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), img = path.join(root, 'brand/img'), ui = path.join(root, 'src/ui');
const exists = f => fs.existsSync(f);
const walk = (d, base = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'cutouts' && !base ? [] : walk(path.join(d, e.name), base + e.name + '/')) : [base + e.name]);
// (أ) لا ملف محجوب
const shadow = walk(img).filter(f => /\.(webp|png|jpg)$/.test(f) && f.includes('/') && exists(path.join(img, 'cutouts', f)));
assert.deepEqual(shadow, [], 'صور محجوبة بنظيرها في cutouts/ (احذفها): ' + shadow.join(' '));
// (ب) لا مفتاح hero/boss معلّق، (ج) لا ART['hero|boss/…'] مباشر له نظير في cutouts/
const has = k => ['.webp', '.png', '.jpg'].some(x => exists(path.join(img, 'cutouts', k + x)) || exists(path.join(img, k + x)));
const direct = [], dangling = [];
for (const f of fs.readdirSync(ui).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(ui, f), 'utf8');
  for (const m of src.matchAll(/ART\[\s*'((?:hero|boss)\/[A-Za-z0-9_]+)'\s*\]/g)) if (exists(path.join(img, 'cutouts', m[1] + '.webp'))) direct.push(f + ':' + m[1]);
  for (const m of src.matchAll(/\b(?:art|pic|rolePic)\(\s*'((?:hero|boss)\/[A-Za-z0-9_]+)'(?!\s*\+)/g)) if (!has(m[1])) dangling.push(f + ':' + m[1]);
}
assert.deepEqual(direct, [], 'ART[...] مباشر لمفتاح له نظير في cutouts/: ' + direct.join(' '));
assert.deepEqual(dangling, [], 'مفتاح معلّق بلا ملف: ' + dangling.join(' '));
console.log('PASS art-shadow: no shadowed files, no direct ART[hero|boss] on cutout keys, no dangling keys');
