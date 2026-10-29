// WP-17ب-3: المسائل والتعليقات والحِكم في المُجدوِل: مفتاح لكل نوع، المسألة تُؤجَّل ولا تضيع، والتعليق والحكمة يُسقطان ويُعدّان
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
const { SCHED } = E, KEYS = ['cases', 'tips', 'react'], set = (...on) => KEYS.forEach(k => SCHED[k] = on.includes(k));
KEYS.forEach(k => assert.equal(SCHED[k], true, 'مفتاح ' + k + ' مفعّل افتراضياً')); ok('مفاتيح cases وtips وreact مفعّلة افتراضياً');
const mk = () => { const S = E.newGame(3); A.learnSetChar(S, 'trader'); const L = S.learn; L.level = L.intro = 4; L.abroad = true; S.player.gold = 30000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => L[k] = []); return S; };
const step = (S, block) => { if (block) S.learn.lastMom = S.day + 1; E.tick(S); S.pause = false; S.learn.eq.length = 0; };
// 1) المسألة تُؤجَّل في يوم لحظة وتُعلَن بعد الفسحة (يومين) ولا تضيع
{ const S = mk(), L = S.learn; let n = 0; while (L.mj.due == null && !L.mj.ready && n++ < 90) step(S, true);
  assert.ok(L.mj.due != null && !L.mj.ready, 'الاستحقاق مختوم والإعلان مؤجَّل في يوم اللحظة'); const d0 = L.mj.due; assert.equal(L.lastMom, S.day, 'لحظة اليوم مختومة');
  step(S); assert.ok(!L.mj.ready && L.mj.due === d0, 'لا إعلان بعد يوم واحد'); step(S); assert.ok(L.mj.ready && L.mj.due == null && L.lastMom === S.day, 'الإعلان بعد يومين ويُختم لحظةً ويُمسح الاستحقاق');
  assert.ok(E.mjReady(S), 'بطاقة المسألة جاهزة'); ok('المسألة تنتظر الفسحة (' + d0 + ' ← ' + S.day + ') وتُعلَن'); }
// 2) تحت تزاحم يومي تُعلَن عند السقف (5 أيام)
{ const S = mk(), L = S.learn; let n = 0; while (L.mj.due == null && n++ < 90) step(S, true); const d0 = L.mj.due; for (let i = 0; i < 4; i++) { step(S, true); assert.ok(!L.mj.ready, 'قبل السقف: يوم ' + (S.day - d0)); } step(S, true);
  assert.equal(S.day - d0, SCHED.MAX_HOLD); assert.ok(L.mj.ready, 'عند السقف تُعلَن ولو في يوم لحظة'); ok('تحت التزاحم اليومي تُعلَن عند السقف (' + SCHED.MAX_HOLD + ' أيام)'); }
// 3) المتطلّب بين الاستحقاق والإعلان: تُعلَن المسألة المطلوبة
{ const S = mk(), L = S.learn; let n = 0; while (L.mj.due == null && n++ < 90) step(S, true); L.mj.want = 'majlis'; step(S); step(S); assert.ok(L.mj.ready); assert.equal(E.mjReady(S).id, 'majlis', 'المطلوبة هي التي أُعلنت'); ok('المتطلّب (mj.want) بين الاستحقاق والإعلان يُقرأ لحظة الإعلان'); }
// 4) mjNow بطلب اللاعب يعمل دائماً ويمسح الاستحقاق
{ const S = mk(), L = S.learn; let n = 0; while (L.mj.due == null && n++ < 90) step(S, true); L.lastMom = S.day; const r = A.mjNow(S); assert.ok(r.ok !== false, 'mjNow يعمل في يوم لحظة'); assert.equal(L.eq[0].id, 'mj'); assert.equal(L.mj.due, undefined, 'الاستحقاق ممسوح'); ok('mjNow يعمل دائماً بطلب اللاعب'); }
// 5) مفتاح الرجوع cases=false: القديم حرفياً (إعلان يوم الاستحقاق بلا due)، وتبديل المفتاح لا يفسد الحفظ ولا يُضيع المسألة
{ set('tips', 'react'); const S = mk(), L = S.learn; let n = 0; while (!L.mj.ready && n++ < 90) step(S, true); assert.ok(L.mj.ready && L.mj.due === undefined, 'القديم: تُعلَن يوم الاستحقاق ولو في يوم لحظة'); assert.equal(L.lastMom, S.day, 'اللحظة مختومة من الإطلاق الآخر لا من المسألة');
  set(...KEYS); const S2 = mk(); n = 0; while (S2.learn.mj.due == null && n++ < 90) step(S2, true); set('tips', 'react'); step(S2); assert.ok(S2.learn.mj.ready && S2.learn.mj.due === undefined, 'إطفاء المفتاح والاستحقاق مختوم: إعلان فوري ويُمسح'); set(...KEYS);
  const S3 = mk(); n = 0; while (S3.learn.mj.due == null && n++ < 90) step(S3, true); const L3 = E.load(E.save(S3)); assert.equal(L3.learn.mj.due, S3.learn.mj.due, 'الاستحقاق يبقى في الحفظ'); for (let i = 0; i < 6; i++) step(L3, true); assert.ok(L3.learn.mj.ready, 'يُعلَن بعد التحميل');
  const O = mk(); delete O.learn.mj.due; delete O.learn.schedDrop; const O2 = E.load(E.save(O)); step(O2); ok('مفتاح الرجوع وتبديله والحفظ والتحميل (وحفظ بلا الحقلين الجديدين)'); }
// 6) schedReactOk وschedTipOk
{ const mkS = (stages = 2, last = 10) => ({ day: 10, learn: { lastMom: last, stageDone: new Array(stages).fill(0).map((_, i) => i + 1) } }), norm = { t: 'x' };
  let S = mkS(); assert.equal(E.schedReactOk(S, 'a', norm), false); assert.equal(S.learn.schedDrop.react, 1, 'تعليق عادي في يوم لحظة يُسقط ويُعدّ');
  for (const r of [{ alert: 1 }, { adv: 1 }, { always: 1 }]) assert.equal(E.schedReactOk(S, 'a', r), true, 'التحذير/النصيحة/الدائم لا يُسقط'); assert.equal(S.learn.schedDrop.react, 1);
  S = mkS(1); assert.equal(E.schedReactOk(S, 'a', norm), true, 'قبل إتمام مرحلتين لا إسقاط'); assert.ok(!S.learn.schedDrop);
  S = mkS(2, 7); assert.equal(E.schedReactOk(S, 'a', norm), true, 'يوم بلا لحظة: لا إسقاط');
  S = mkS(); assert.equal(E.schedTipOk(S, 'c1'), false); assert.equal(E.schedTipOk(S, 'c1'), false); assert.equal(E.schedTipOk(S, 'c1'), false); assert.equal(S.learn.schedDrop.tips, 1, 'تُعدّ مرة لكل رحلة'); assert.equal(E.schedTipOk(S, 'c2'), false); assert.equal(S.learn.schedDrop.tips, 2);
  S = mkS(1); assert.equal(E.schedTipOk(S, 'c1'), true, 'قبل مرحلتين لا إسقاط للحكمة');
  set(); S = mkS(); assert.equal(E.schedReactOk(S, 'a', norm), true); assert.equal(E.schedTipOk(S, 'c1'), true); assert.ok(!S.learn.schedDrop, 'المفاتيح مطفأة: لا إسقاط ولا حقل schedDrop'); set(...KEYS);
  for (const [key, f] of [['react', S => E.schedReactOk(S, 'a', norm)], ['tips', S => E.schedTipOk(S, 'c')]]) { set(...KEYS.filter(k => k !== key)); assert.equal(f(mkS()), true, 'مفتاح ' + key + ' مستقل'); set(...KEYS); }
  ok('إسقاط التعليقات والحِكم: العدّ، الاستثناءات، الافتتاحية، والمفاتيح'); }
console.log('\nsched-ui: كلها ناجحة');
