// node test/savecode.test.js — نص الحفظ حرفيًا، سلامة النقل والحجم والأداء.
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const E = require('../src/engine.js'), C = require('../src/savecode.js');
function roundTrip(json, codec = C) {
 const encoded = codec.encode(json); assert.equal(encoded.ok, true, encoded.msg);
 assert.match(encoded.code, /^DT1-[A-Za-z0-9_]+$/);
 const decoded = codec.decode(encoded.code); assert.equal(decoded.ok, true, decoded.msg);
 assert.equal(decoded.json, json); return encoded.code;
}
function rejects(code, fragment) {
 const result = C.decode(code); assert.equal(result.ok, false, 'Should reject malformed code');
 assert.match(result.msg, /[\u0600-\u06ff]/); if (fragment) assert.ok(result.msg.includes(fragment), result.msg);
}
const S = E.newGame(5); for (let i = 0; i < 60; i++) E.tick(S);
const json = E.save(S), start = performance.now(), encoded = C.encode(json), middle = performance.now();
assert.equal(encoded.ok, true, encoded.msg);
const decoded = C.decode(encoded.code), end = performance.now();
assert.equal(decoded.ok, true, decoded.msg); assert.equal(decoded.json, json);
const loaded = E.load(decoded.json); assert.ok(loaded && loaded.player); assert.equal(loaded.day, S.day);
assert.deepEqual(loaded.player.wallet, S.player.wallet);
// تكامل الحفظ مع المصنع غير المحلي والمدير وسجل الجودة بعد تحديث المحرك.
const F = E.newGame(6); F.phase = 3; F.player.wallet.sar = 1000000;
assert.ok(E.A.buildShop(F, 'riyadh').ok); assert.ok(E.A.buildWarehouse(F, 'riyadh').ok);
E.bossOf(F, 'cairo').trust = 50;
assert.ok(E.A.buildFactory(F, 'riyadh', 'textile').ok); assert.ok(E.A.hireManager(F, 'riyadh', 3).ok);
const factory = F.player.factories[0]; assert.equal(factory.local, false);
assert.ok(E.A.setFactory(F, factory.id, 'minBal', 150).ok);
F.player.props.riyadh.store.textile = 10;
F.player.props.riyadh.basis.textile = { q: 10, c: 800, w: 7 };
const factoryJson = E.save(F), factoryCode = roundTrip(factoryJson), restoredFactory = E.load(C.decode(factoryCode).json);
assert.deepEqual(restoredFactory.player.factories, F.player.factories);
assert.equal(restoredFactory.player.props.riyadh.mgr.lv, 3);
assert.equal(restoredFactory.player.props.riyadh.basis.textile.w, 7);
const ratio = encoded.code.length / Buffer.byteLength(json);
assert.ok(ratio < .6, 'Real save code below 60%: ' + ratio);
// يشمل الحفظ الحقيقي أكثر من 500KB؛ لا يدخل إنشاء اللعبة أو المحاكاة في القياس.
assert.ok(end - start < 1000, 'Encode + decode under one second on the test machine');
for (const text of ['{}', '[]', 'null', 'true', 'false', '0', '-0', '1.2345e+100', '""', '"نص عربي"', ' \r\n { "ب" : [1, 2, 3], "أ": "ث" } \t\n']) roundTrip(text);
const arabic = JSON.stringify({ عنوان: 'حفظ التاجر', نص: 'العربية بالتشكيل: أهلاً وسهلاً، 🐪 🐎 \u200f\u2028\u2029\u0000 '.repeat(5000), اقتباس: '"\\\r\n\t', أعداد: [0, -0.25, 1e20] });
roundTrip(arabic);
for (const unit of [0xd800, 0xdc00]) roundTrip('"' + String.fromCharCode(unit) + '"');
for (const empty of ['', ' ', '\n\t', null, undefined]) { const r = C.encode(empty); assert.equal(r.ok, false); assert.match(r.msg, /[\u0600-\u06ff]/); }
for (const invalid of ['{', 'not json', '{"n":NaN}']) { const r = C.encode(invalid); assert.equal(r.ok, false); assert.ok(r.msg.includes('JSON')); }
for (const empty of ['', ' \n ', '----']) rejects(empty, 'فارغ');
rejects(encoded.code.slice(4), 'البادئة'); rejects(encoded.code.replace('DT1-', 'DT9-'), 'نسخة');
for (const cut of [1, 2, 5, 13, Math.floor(encoded.code.length / 2)]) rejects(encoded.code.slice(0, -cut), 'ناقص أو تالف');
for (const pos of [5, 19, Math.floor(encoded.code.length / 3), Math.floor(encoded.code.length * .7), encoded.code.length - 1]) {
 const changed = encoded.code.slice(0, pos) + (encoded.code[pos] === 'A' ? 'B' : 'A') + encoded.code.slice(pos + 1);
 rejects(changed, 'ناقص أو تالف');
}
const spaced = encoded.code.replace(/(.{13})/g, '$1 - \n\t');
assert.equal(C.decode('نسخة احتياطية: <<' + spaced + '>> انتهى').json, json);
assert.equal(C.decode('--' + encoded.code.replace('DT1-', 'DT1---') + '--').json, json);
assert.equal(C.decode('abc' + encoded.code + 'xyz').json, json);
assert.equal(C.decode(encoded.code.replace(/(.{17})/g, '$1–')).json, json);
// إطار مستقل ببيانات حرف x، ومجموع CRC32 محسوب بأداة مستقلة: النقل صحيح والمحتوى ليس JSON.
rejects('DT1-RFQBAAEAAAACAAAAniPsJwB4', 'JSON');
const MAX = 5 * 1024 * 1024;
assert.equal(C.encode('"' + 'x'.repeat(MAX) + '"').ok, false);
assert.ok(C.encode('"' + 'ض'.repeat(Math.floor(MAX / 2)) + '"').msg.includes('ميغابايت'));
assert.equal(C.decode('DT1-' + 'A'.repeat(MAX * 4 + 1024)).ok, false);
// بيانات متنوعة للتأكد من المطابقات المتداخلة والحدود، لا عينات مشتقة من التنفيذ.
let random = 11;
function rng() { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random; }
for (let n = 0; n < 75; n++) {
 let text = '';
 for (let j = 0; j < n * 19; j++) text += String.fromCharCode(rng() & 65535);
 roundTrip(JSON.stringify({ n, text, list: [n, n / 3, null, true], repeated: 'abcabcabca'.repeat(n) }));
}
roundTrip(JSON.stringify({ repeat: 'abcd'.repeat(100000), edge: 'abc'.repeat(21846) + 'abcdabcd' }));
// تشغيل IIFE دون require أو Buffer يثبت مسار المكتبة في المتصفح.
const context = { TextEncoder, TextDecoder };
vm.runInNewContext(fs.readFileSync(require.resolve('../src/savecode.js'), 'utf8'), context);
const portable = roundTrip(arabic, context.SaveCode); assert.equal(C.decode(portable).json, arabic);
assert.equal(context.SaveCode.decode(encoded.code).json, json);
console.log('OK savecode: real engine round trip/load, Arabic/Unicode, corruption, copy formatting, version, size and browser export');
console.log('Save bytes: ' + Buffer.byteLength(json) + '; code ratio: ' + (ratio * 100).toFixed(1) + '%; encode: ' + (middle - start).toFixed(1) + 'ms; decode: ' + (end - middle).toFixed(1) + 'ms');
