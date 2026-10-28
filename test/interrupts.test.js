'use strict';
// WP-06: قاعدة واحدة للمقاطعات: كل إيقاف للوقت عبر interrupt(S, id)، وكل معرّف مصنَّف، والميزانية 3 نوافذ لكل 17 يوم: node test/interrupts.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const E = require('../src/engine.js');
const dir = path.join(__dirname, '../src/engine'), files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
const src = files.map(f => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
// ١) لا موضع إيقاف خام في المحرك إلا داخل interrupt() نفسها (وإيقاف نسخة المحاكاة T.pause في 23c)
for (const [f, t] of src) { if (f === '01a-interrupts.js') continue; const raw = t.match(/\bS\.pause\s*=\s*true/g); assert.equal(raw, null, f + ': S.pause = true خام؛ استعمل interrupt(S, id)'); }
// ٢) كل معرّف يُستدعى به interrupt أو interruptOk أو push مصنَّف في INTERRUPT_CLASS
const ids = new Set(); for (const [f, t] of src) for (const m of t.matchAll(/interrupt(?:Ok)?\(\s*S\s*,\s*'([A-Za-z]+)'/g)) ids.add(m[1]);
for (const id of ['broker', 'friend']) ids.add(id); // تمرَّر عبر push(id) في 22-learn.js
for (const id of ids) assert.ok(E.INTERRUPT_CLASS[id], 'معرّف غير مصنَّف: ' + id);
const cls = new Set(['window', 'office', 'notebook']); for (const [k, v] of Object.entries(E.INTERRUPT_CLASS)) assert.ok(cls.has(v), k + ' صنف غير صالح: ' + v);
const orphan = Object.keys(E.INTERRUPT_CLASS).filter(k => !k.startsWith('ui:') && !ids.has(k)); assert.deepEqual(orphan, [], 'معرّفات مصنَّفة بلا موضع: ' + orphan);
console.log('OK   ' + ids.size + ' معرّفاً مستعملاً كلها مصنَّفة، ولا موضع إيقاف خام في المحرك');
// ٣) الأثر: النافذة توقف الوقت، والمكتب والدفتر لا يوقفان
const S = E.newGame(1); S.pause = false; assert.equal(E.interrupt(S, 'yearEnd'), false); assert.equal(S.pause, false, 'دفتر: بلا إيقاف');
assert.equal(E.interrupt(S, 'arrival'), true); assert.equal(S.pause, true, 'نافذة: إيقاف'); S.pause = false;
assert.equal(S.intrN.yearEnd, 1); assert.equal(S.intrN.arrival, 1);
console.log('OK   نافذة توقف الوقت؛ الدفتر لا يوقفه؛ العدّاد يعمل');
// ٤) الميزانية: ٣ نوافذ لكل ١٧ يوماً؛ الحرجة والمجانية لا تُحجب، والتأجيل ينتهي بعد المهلة
const B = E.newGame(2); B.day = 100; const { windows, perDays } = E.INTERRUPT_BUDGET; assert.deepEqual([windows, perDays], [3, 17]);
for (let i = 0; i < windows; i++) { assert.equal(E.interruptOk(B, 'broker'), true); E.interrupt(B, 'broker'); }
assert.equal(E.interruptOk(B, 'broker'), false, 'الرابعة تُحجب'); assert.equal(E.interruptOk(B, 'luck'), false, 'ميزانية واحدة لكل العروض');
assert.equal(E.interruptOk(B, 'bandits'), true, 'حرجة'); assert.equal(E.interruptOk(B, 'arrival'), true, 'مجانية'); assert.equal(E.interruptOk(B, 'yearEnd'), true, 'دفتر');
B.day = 100 + perDays; assert.equal(E.interruptOk(B, 'broker'), true, 'بعد 17 يوماً تعود الميزانية');
console.log('OK   ميزانية النوافذ 3/17 يوماً: تحجب العروض الاختيارية وتُبقي الحرجة والمجانية');
// ٥) محاكاة 600 يوم بلا لاعب: النوافذ المحتسبة في أي 17 يوماً ≤ 3 + الحرجة
const R = E.newGame(5); E.A.learnSetChar(R, 'trader'); R.player.gold = 50000; const days = []; const iv = E.interrupt; let worst = 0;
for (let d = 0; d < 600; d++) { E.tick(R, false); R.pause = false; worst = Math.max(worst, (R.intr || []).length); }
assert.ok(worst <= 3 + 4, 'ذروة النوافذ المحتسبة في 17 يوماً: ' + worst); console.log('OK   600 يوم بلا لاعب: ذروة النوافذ المحتسبة ' + worst);
console.log('OK interrupts');
