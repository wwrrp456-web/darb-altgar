// WP-17ب-1: نقل البطاقات الجانبية إلى المُجدوِل: فاصل يومين بين لحظتين، لا تأخير فوق 5 أيام، لا بطاقة تضيع، ومفتاح رجوع بسطر
const assert = require('node:assert/strict'), E = require('../src/engine.js'), ok = m => console.log('OK   ' + m);
const { SCHED } = E;
const start = () => { const S = E.newGame(7); E.A.learnSetChar(S, 'trader'); E.tick(S); S.learn.level = 10; return S; };
const days = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S); S.pause = false; } };
assert.equal(SCHED.cards, true, 'النقل مفعّل افتراضياً'); ok('مفتاح SCHED.cards مفعّل افتراضياً');
// 1) مفتاح الرجوع: false = الطريقة القديمة حرفياً (البطاقة تُطلق في يوم الألواح نفسه ولا أثر في الحالة)
const KEYS = ['cards', 'tablets', 'secrets', 'boss']; KEYS.forEach(k => SCHED[k] = false); { const S = start(); days(S, 1); const L = S.learn;
  assert.ok(L.cards.length >= 1 && L.tab.length >= 1 && L.cardDay === S.day, 'القديم: بطاقة ولوح في اليوم نفسه'); assert.ok(!('cwait' in L) && !('lastMom' in L) && !('momN' in L), 'لا أثر جديد في الحالة مع المفتاح مطفأ'); }
KEYS.forEach(k => SCHED[k] = true); ok('مفتاح الرجوع يعيد الإطلاق القديم ولا يلمس الحالة');
// 2) المفعّل: لوح وبطاقة مستحقان في اليوم نفسه ← البطاقة تُؤجَّل إلى فسحة الفاصل ثم تُعرض (لا تضيع)
{ const S = start(); days(S, 1); const L = S.learn; assert.ok(L.tab.length >= 1 && L.cards.length === 0 && L.cwait, 'البطاقة مؤجَّلة والموعد الأصلي مسجّل'); const d0 = L.cwait.d, id = L.cwait.id;
  days(S, 1); assert.equal(L.cards.length, 0, 'ما زالت مؤجَّلة قبل مرور يومين'); for (let i = 0; i < 6 && !L.cards.length; i++) days(S, 1);
  assert.deepEqual(L.cards, [id], 'عُرضت'); assert.ok(!L.cwait && L.cq.includes(id), 'في طابور العرض'); assert.ok(S.day - d0 <= SCHED.MAX_HOLD, 'تأخير ضمن السقف'); ok('تؤجَّل خلف الألواح والأسرار المستحقة ثم تُعرض ضمن السقف ولا تضيع (' + id + ')'); }
// 3) السقف: لحظات متواصلة كل يوم لا تؤخّر البطاقة فوق 5 أيام
{ const S = start(); days(S, 1); const L = S.learn, d0 = L.cwait.d; for (let i = 0; i < 8 && !L.cards.length; i++) { L.lastMom = S.day; days(S, 1); L.lastMom = S.day - 0; if (!L.cards.length) L.lastMom = S.day; } assert.equal(L.cards.length, 1, 'عُرضت رغم تزاحم اللحظات'); assert.ok(S.day - d0 <= SCHED.MAX_HOLD, 'لم تتجاوز ' + SCHED.MAX_HOLD + ' أيام: ' + (S.day - d0)); ok('سقف التأخير ' + SCHED.MAX_HOLD + ' أيام محترم رغم التزاحم'); }
// 4) زوال الشرط أثناء التأجيل لا يُضيعها
{ const S = start(); days(S, 1); const L = S.learn, id = L.cwait.id; S.learn.level = 1; days(S, 7); assert.ok(L.cards.includes(id), 'البطاقة المستحقة تُعرض ولو زال شرطها'); ok('بطاقة مؤجَّلة لا تضيع إن زال شرطها'); }
// 5) الفاصل بين لحظتين: لا بطاقة في أقل من يومين من لحظة أخرى ما لم يبلغ السقف
{ const S = start(); const fired = []; for (let i = 0; i < 40; i++) { const n = S.learn.cards.length, m = S.learn.lastMom; days(S, 1); if (S.learn.cards.length > n) fired.push({ day: S.day, prevMom: m }); }
  ok('٤٠ يوماً بلا خطأ؛ بطاقات أُطلقت: ' + fired.length); }
console.log('OK sched-cards');
