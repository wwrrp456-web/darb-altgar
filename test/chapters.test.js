// WP-18: رحلة الفصول السبعة: اشتقاق نقي من الحفظ وخريطة المحتوى
const assert = require('node:assert/strict'), E = require('../src/engine.js'), CM = require('../src/content-map.js'), A = E.A, ok = m => console.log('OK   ' + m);
const J = S => E.chapterJourney(S, CM.PIECES), st = (S, n) => J(S).find(c => c.n === n).state;
const mk = (seed = 7) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); return S; };
// (أ) كل قطعة في فصل واحد بالضبط، والمجموع 397 مع الحِكم
{ const j = J(mk()); assert.equal(j.length, 7); assert.equal(j.reduce((a, c) => a + c.total + c.wisdom, 0), CM.PIECES.length); assert.equal(CM.PIECES.length, 397);
  for (const p of CM.PIECES) assert.equal(CM.PIECES.filter(q => q.id === p.id).length, 1, 'معرّف فريد ' + p.id);
  const wis = CM.PIECES.filter(p => p.type === 'wisdom'); assert.equal(j.reduce((a, c) => a + c.wisdom, 0), wis.length); assert.equal(j[3].wisdom, wis.length, 'الحِكم كلها في ف٤');
  assert.equal(j.reduce((a, c) => a + Object.values(c.byType).reduce((x, y) => x + y[1], 0), 0), 397 - wis.length); ok('كل قطعة تُعدّ في فصل واحد (397 = المتتبَّع + الحِكم)'); }
// (د) حفظ جديد
{ const S = mk(), j = J(S); assert.equal(j[0].state, 'current'); assert.deepEqual(j.slice(1).map(c => c.state), ['new', 'new', 'new', 'side', 'side', 'new']); ok('حفظ جديد: ف١ حالي والباقي لم يبدأ (٥ و٦ جانبي)'); }
// (ب) أتم المراحل ١–٥ والحالية ٦ ⇒ ف٣ حالي، ف١ وف٢ منجزان
{ const S = mk(); Object.assign(S.learn, { stageDone: [1, 2, 3, 4, 5], stage: 6, level: STAGE_SRC(6) }); const j = J(S); assert.equal(E.stageOf(S).n, 6);
  assert.equal(j[2].state, 'current'); assert.equal(j[0].state, 'done'); assert.equal(j[1].state, 'done'); assert.ok(j[0].done >= j[0].core); ok('ف٣ حالي وف١ وف٢ منجزان (قبول القصة ١)'); }
function STAGE_SRC(n) { return E.STAGES[n - 1].source; }
// (ج) أثناء ف٤ ⇒ ف٣ جارٍ لا منجز
{ const S = mk(); Object.assign(S.learn, { stageDone: [1, 2, 3, 4, 5, 6, 7, 8, 9], stage: 10, level: STAGE_SRC(10) }); assert.equal(E.stageOf(S).n, 10); const j = J(S); assert.equal(j[3].state, 'current'); assert.equal(j[2].state, 'partial', 'ف٣ فيه ١٩ و٢٠ لم تأتِ'); ok('أثناء ف٤: ف٣ جارٍ لا منجز'); }
// (هـ) بعد التخرج
{ const S = mk(); Object.assign(S.learn, { stageDone: Array.from({ length: 22 }, (_, i) => i + 1), level: 11, stage: 23 }); assert.equal(E.stageOf(S), null); const j = J(S); assert.ok(['current', 'done'].includes(j[6].state)); assert.equal(j[6].state, 'done'); assert.equal(j[2].state, 'done'); ok('بعد التخرج: ف٧ منجز ولا خطأ'); }
// (و) ابدأ حفيداً
{ const S = mk(); Object.assign(S.learn, { stageDone: [1, 2, 3], level: 11, stage: 23 }); S.legacy = { retired: true, heirAge: 25 }; assert.doesNotThrow(() => J(S)); assert.equal(J(S).length, 7); ok('حالة الحفيد لا ترمي خطأ'); }
// بلا شخصية
{ const S = E.newGame(3); const j = J(S); assert.deepEqual(j.map(c => c.state), Array(7).fill('new')); ok('بلا شخصية: كلها لم تبدأ بلا خطأ'); }
// (ز) لا تعدّل S
{ const S = mk(); Object.assign(S.learn, { stageDone: [1, 2, 3], stage: 4, level: STAGE_SRC(4) }); const a = E.save(S); J(S); J(S); assert.equal(E.save(S), a); ok('الدالة لا تعدّل الحالة'); }
// عدّ المسائل والتعليقات
{ const S = mk(); S.learn.mj.seen.aib = { ok: true }; S.learn.rseen.guardHire = 2; const j = J(S); assert.equal(j[2].byType.case[0], 1); assert.equal(j[1].byType.react[0], 1); ok('المسائل والتعليقات المنجزة تُعدّ'); }
console.log('\nchapters: كلها ناجحة');
