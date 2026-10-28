// WP-16: خريطة المحتوى كاملة وسليمة: كل قطعة مسجّلة، لا متطلب دائري، لا فصل بلا قطعة أساسية، لا متطلب في فصل لاحق: node test/content-map.test.js
const assert = require('node:assert/strict'), { enumerate } = require('../tools/content-enum.js'), CM = require('../src/content-map.js'), ok = m => console.log('OK   ' + m);
const live = enumerate(), ids = new Set(CM.PIECES.map(p => p.id));
assert.equal(ids.size, CM.PIECES.length, 'معرّف مكرر في الخريطة'); ok('لا معرّف مكرر (' + ids.size + ' قطعة)');
const missing = live.filter(p => !ids.has(p.id)).map(p => p.id); assert.deepEqual(missing, [], 'قطع غير مسجّلة في الخريطة (شغّل node tools/gen-content-map.js ثم راجع التصنيف): ' + missing.slice(0, 12).join(' ')); ok('كل قطعة محتوى حيّة مسجّلة (' + live.length + ')');
const liveIds = new Set(live.map(p => p.id)), stale = CM.PIECES.filter(p => !liveIds.has(p.id)).map(p => p.id); assert.deepEqual(stale, [], 'قطع في الخريطة لم تعد موجودة: ' + stale.join(' ')); ok('لا قطعة في الخريطة بلا أصل');
const types = new Set(live.map(p => p.type)); assert.equal(types.size, 11, 'أنواع المحتوى ليست 11: ' + [...types].join(',')); ok('الأنواع الإحدى عشر كلها ممثَّلة: ' + [...types].join(' '));
for (const p of CM.PIECES) { assert.ok(p.ch >= 1 && p.ch <= CM.CHAPTERS.length, p.id + ': فصل غير صالح'); assert.ok(['core', 'side'].includes(p.kind), p.id + ': نوع غير صالح'); assert.ok([1, 2, 3].includes(p.effort), p.id + ': جهد غير صالح'); assert.ok(p.topic && p.topic.length, p.id + ': بلا موضوع'); }
ok('السمات الخمس صالحة في كل قطعة');
for (const p of CM.PIECES) for (const q of p.req) assert.ok(ids.has(q), p.id + ' يتطلب قطعة غير موجودة: ' + q); ok('كل متطلب يشير إلى قطعة موجودة');
const color = {}, byId = Object.fromEntries(CM.PIECES.map(p => [p.id, p])), cyc = [];
const dfs = (id, path) => { if (color[id] === 2) return; if (color[id] === 1) { cyc.push(path.concat(id).join(' ← ')); return; } color[id] = 1; for (const q of byId[id].req) dfs(q, path.concat(id)); color[id] = 2; };
CM.PIECES.forEach(p => dfs(p.id, [])); assert.deepEqual(cyc, [], 'متطلب دائري: ' + cyc[0]); ok('لا متطلب دائري');
for (const c of CM.CHAPTERS) assert.ok(CM.PIECES.some(p => p.ch === c.n && p.kind === 'core'), 'الفصل ' + c.n + ' (' + c.title + ') بلا قطعة أساسية'); ok('كل فصل من السبعة فيه قطعة أساسية');
const later = CM.PIECES.filter(p => p.req.some(q => byId[q].ch > p.ch)).map(p => p.id + '(ف' + p.ch + ') يتطلب ' + p.req.find(q => byId[q].ch > p.ch) + '(ف' + byId[p.req.find(q => byId[q].ch > p.ch)].ch + ')');
assert.deepEqual(later, [], 'قطعة متطلبها في فصل لاحق: ' + later.slice(0, 6).join(' ؛ ')); ok('لا قطعة متطلبها في فصل لاحق');
// WP-16ب: لكل قطعة شرط ظهور فعلي مقروء (when) ومصدره (src: الملف::الدالة[.المفتاح]) يشير إلى دالة موجودة فعلاً
const fs = require('node:fs'), path = require('node:path'), srcDir = path.join(__dirname, '../src'), cache = {}, text = f => cache[f] || (cache[f] = fs.readFileSync(path.join(srcDir, f), 'utf8'));
const bad = [];
for (const p of CM.PIECES) {
  if (typeof p.when !== 'string' || p.when.trim().length < 6) { bad.push(p.id + ': when فارغ'); continue; }
  const m = /^([\w./-]+\.js)::(\w+)(?:\.(\w+))?$/.exec(p.src || ''); if (!m) { bad.push(p.id + ': src بصيغة غير صالحة: ' + p.src); continue; }
  const [, file, sym, key] = m; if (!fs.existsSync(path.join(srcDir, file))) { bad.push(p.id + ': الملف غير موجود ' + file); continue; }
  const t = text(file), def = new RegExp('(?:function\\s+' + sym + '\\b)|(?:\\b(?:const|let|var)\\s+' + sym + '\\b)|(?:^\\s*' + sym + '\\s*[:(=])|(?:\\b[A-Z]\\.' + sym + '\\s*=)', 'm');
  if (!def.test(t)) bad.push(p.id + ': الدالة ' + sym + ' غير معرّفة في ' + file);
  else if (key && !new RegExp('\\b' + key + '\\s*[:(]').test(t)) bad.push(p.id + ': المفتاح ' + key + ' غير موجود في ' + file);
}
assert.deepEqual(bad, [], 'when/src غير صالح:\n' + bad.slice(0, 10).join('\n')); ok('لكل قطعة when غير فارغ وsrc يشير إلى دالة موجودة (' + CM.PIECES.length + ')');
console.log('OK content-map');
