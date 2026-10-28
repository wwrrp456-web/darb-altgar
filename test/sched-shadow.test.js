// WP-17أ: مُجدوِل الإيقاع في وضع الظل: مطفأ افتراضياً، لا يغيّر الحالة المحفوظة، ويستدعي دوال الشروط الموجودة نفسها وفق حقل src في خريطة المحتوى
const assert = require('node:assert/strict'), E = require('../src/engine.js'), CM = require('../src/content-map.js'), ok = m => console.log('OK   ' + m);
const { SCHED, A } = E;
const game = () => { const S = E.newGame(7); A.learnSetChar(S, 'trader'); return S; };
assert.equal(SCHED.on, false, 'مطفأ افتراضياً'); ok('مطفأ افتراضياً');
// 1) لا يغيّر سلوك اللعبة: الحفظ بعد ١٥٠ يوماً مطابق بايتاً ببايت مع الظل وبدونه
const run = on => { E.schedReset(CM.PIECES); SCHED.on = on; const S = game(); for (let d = 0; d < 150; d++) { E.botMain(S); E.tick(S); } SCHED.on = false; return E.save(S); };
const off = run(false), on = run(true); assert.equal(on, off, 'الظل غيّر الحفظ'); ok('الحفظ مطابق بايتاً بعد ١٥٠ يوماً مع الظل وبدونه');
assert.ok(!('sched' in JSON.parse(off)) && !off.includes('shadow'), 'لا أثر للظل في S'); ok('لا أثر للظل في الحالة المحفوظة');
// 2) مسار حقيقي: بطاقة تُطلق في اليوم فتُرصد إطلاقاً فعلياً ويراها الظل مرشّحة ويمنحها دوراً
E.schedReset(CM.PIECES); SCHED.on = true; { const S = game(); E.tick(S); S.learn.level = 10; E.tick(S); E.tick(S);
  const L = S.learn, fired = SCHED.log.filter(e => e.ev === 'fire').map(e => e.id), cand = SCHED.log.filter(e => e.ev === 'cand').flatMap(e => e.ids);
  assert.ok(L.cards.length >= 1 && L.tab.length >= 1, 'بطاقة ولوح أُطلقا فعلاً'); const id = 'card:' + L.cards[0];
  assert.deepEqual([...new Set(cand)].sort(), [...new Set(fired)].sort(), 'مرشّحو الظل (دوال الشروط على النسخة) = ما أُطلق فعلاً'); assert.ok(fired.includes(id), 'رُصد الإطلاق الفعلي ' + id);
  assert.ok(SCHED.would.length >= 1 && SCHED.would.every(w => fired.includes(w.id)), 'المُجدوِل منح دوراً لما أُطلق فعلاً فقط');
  assert.equal(SCHED.pend.length, fired.length - SCHED.would.length, 'الباقي معلّق في طابور الظل لا مفقود'); ok('مسار حقيقي: ' + fired.length + ' إطلاقات فعلية = مرشّحو الظل، والمُجدوِل يمنح دوراً واحداً ويؤجّل الباقي'); }
SCHED.on = false;
// 3) السياسة: الأساسي في الفصل الحالي لا ينتظر الحد، والجانبي ينتظر GAP_DAYS، والفصل الحالي قبل اللاحق
{ E.schedReset(CM.PIECES); const core1 = CM.PIECES.find(p => p.ch === 1 && p.kind === 'core'), side1 = CM.PIECES.find(p => p.ch === 1 && p.kind === 'side'), late = CM.PIECES.find(p => p.ch >= 4 && p.kind === 'core');
  assert.ok(core1 && side1 && late, 'قطع الاختبار موجودة'); const S = game();
  SCHED.on = true; SCHED.prev = { reached: new Set(['stage:1']), queued: new Set() };
  SCHED.pend.push({ id: late.id, d: 1 }, { id: side1.id, d: 1 }, { id: core1.id, d: 1 });
  const polic = d => { const before = SCHED.would.length; E.schedPolicy(S, d); return SCHED.would.slice(before).map(w => w.id); };
  assert.deepEqual(polic(1), [core1.id], 'الأساسي في الفصل الحالي أولاً'); assert.deepEqual(polic(2), [], 'الجانبي ينتظر الحد'); assert.deepEqual(polic(1 + SCHED.GAP_DAYS), [side1.id], 'ثم الجانبي بعد الحد');
  assert.deepEqual(polic(1 + SCHED.GAP_DAYS * 2), [late.id], 'ثم اللاحق'); SCHED.on = false; ok('سياسة الترتيب: الفصل الحالي ثم الأساسي ثم الحد الأدنى'); }
// 4) كل مصدر في الخريطة إما مُوجَّه إلى دالة شرط يستدعيها الظل أو مذكور صراحةً أنه للرصد فقط
{ const routed = new Set(SCHED.routes), OBSERVE = new Set(['learnCountry', 'productStory', 'achEvent', 'haggleChoose', 'farmDay', 'breedStep', 'staffDay', 'factoryDay', 'zakatFinish', 'achNote', 'mjNext', 'roadTip']), bad = [];
  for (const p of CM.PIECES) { if (p.type === 'react') continue; const sym = /::(\w+)/.exec(p.src)[1]; if (!routed.has(sym) && !OBSERVE.has(sym)) bad.push(p.id + ' → ' + sym); }
  assert.deepEqual(bad, [], 'مصدر غير مصنَّف في المُجدوِل: ' + bad.slice(0, 5).join(' ؛ ')); ok('كل src في الخريطة موجَّه أو مرصود صراحةً'); }
console.log('OK sched-shadow');
