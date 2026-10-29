// WP-17ب-2: الألواح وأسرار المدن والدول وحكايات الزعماء عبر المُجدوِل: مفتاح لكل نوع، فاصل يومين، سقف 5، لا شيء يضيع، والمؤجَّل في الحفظ
const assert = require('node:assert/strict'), E = require('../src/engine.js'), ok = m => console.log('OK   ' + m);
const { SCHED } = E, KEYS = ['cards', 'tablets', 'secrets', 'boss'], set = (...on) => KEYS.forEach(k => SCHED[k] = on.includes(k));
const start = () => { const S = E.newGame(7); E.A.learnSetChar(S, 'trader'); E.tick(S); S.learn.level = 10; return S; };
const days = (S, n) => { for (let i = 0; i < n; i++) { E.tick(S); S.pause = false; } };
const queued = L => (L.tq.length + L.sq.length + L.csq.length + L.bq.length), heldN = L => (L.schedHold || []).length;
KEYS.forEach(k => assert.equal(SCHED[k], true, 'مفتاح ' + k + ' مفعّل افتراضياً')); ok('مفاتيح الأنواع الأربعة مفعّلة افتراضياً');
// 1) مفاتيح الرجوع: كل نوع مستقل، ومطفأ = دفع مباشر للطابور كالقديم بلا أثر في الحالة
for (const [key, q] of [['tablets', 'tq'], ['boss', 'bq']]) {
  set(...KEYS.filter(k => k !== key)); const S = start(); days(S, 1); const L = S.learn;
  assert.ok(L[q].length >= 1, 'الطابور ' + q + ' يمتلئ مباشرة والمفتاح ' + key + ' مطفأ'); assert.ok(!(L.schedHold || []).some(h => h.q === q), 'لا تأجيل لـ' + q + ' مع المفتاح مطفأ'); }
set(); { const S = start(); days(S, 6); const L = S.learn; assert.ok(!('schedHold' in L) && !('lastMom' in L) && !('momN' in L), 'لا أثر في الحالة'); assert.ok(L.tq.length >= 1 && L.bq.length >= 1, 'القديم: كلها في الطوابير مباشرة'); }
set(...KEYS); ok('مفتاح لكل نوع، وإطفاؤها كلها يعيد القديم ولا يلمس الحالة');
// 2) الأثر فوري والعرض مؤجَّل: اللوح مسجّل في L.tab ومكافأته منحت، وطابوره يُملأ بفاصل يومين، وكله يصل خلال السقف
{ const S = start(); const g0 = S.player.gold; days(S, 1); const L = S.learn; const total = L.tab.length + Object.values(L.lore).reduce((a, x) => a + x, 0) + L.csec.length + L.secrets.length;
  assert.ok(L.tab.length >= 2 && heldN(L) + queued(L) >= 3, 'ألواح وحكايات مستحقة (' + L.tab.length + ')'); assert.ok(queued(L) <= 1, 'لحظة واحدة فقط في الطابور يوم الاستحقاق: ' + queued(L)); assert.ok(heldN(L) >= 2, 'والباقي محفوظ للعرض لاحقاً');
  const seen = []; for (let i = 0; i < 12; i++) { days(S, 1); L.tq.length = 0; L.bq.length = 0; L.sq.length = 0; L.csq.length = 0; seen.push(heldN(L)); }
  assert.equal(heldN(L), 0, 'لا يبقى شيء معلّقاً بعد 12 يوماً: ' + seen.join()); ok('الأثر فوري، العرض بفاصل، ولا يبقى معلّقاً (' + seen.slice(0, 6).join('،') + ')'); }
// 3) كل ما استحق يصل الطابور بعينه (لا يضيع): يُجمَع ما دخل الطابور
{ const S = start(); days(S, 1); const L = S.learn, got = { tq: [], bq: [] }; const drain = () => { got.tq.push(...L.tq.splice(0)); got.bq.push(...L.bq.splice(0)); L.sq.length = 0; L.csq.length = 0; };
  drain(); for (let i = 0; i < 14; i++) { days(S, 1); drain(); } assert.deepEqual([...got.tq].sort(), [...L.tab].sort(), 'كل لوح مستحق ظهر مرة واحدة'); assert.equal(got.bq.length, Object.values(L.lore).reduce((a, x) => a + x, 0), 'كل فصل حكاية ظهر'); ok('لا لوح ولا فصل حكاية يضيع (' + got.tq.length + ' ألواح، ' + got.bq.length + ' فصول)'); }
// 4) الأولوية: الألواح ثم الأسرار ثم الحكايات؛ وسقف 5 أيام يفرج عن الكل
{ const S = start(); const L = S.learn; L.schedHold = [{ q: 'bq', item: { c: 'riyadh', n: 1 }, d: 0 }, { q: 'sq', item: 'eg', d: 0 }, { q: 'tq', item: 'cure1', d: 0 }, { q: 'csq', item: 'mecca', d: 0 }]; L.lastMom = -99; S.day = 1; L.tq = []; L.sq = []; L.csq = []; L.bq = [];
  const order = []; for (let d = 1; d <= 8; d++) { S.day = d; E.schedRelease(S); const now = ['tq', 'csq', 'sq', 'bq'].filter(k => L[k].length).map(k => k); for (const k of now) { if (!order.includes(k)) order.push(k); } }
  assert.equal(order[0], 'tq', 'اللوح أولاً'); assert.ok(order.indexOf('bq') > order.indexOf('tq') && order.indexOf('bq') > Math.min(order.indexOf('csq'), order.indexOf('sq')), 'الحكاية بعد اللوح والسرّ'); assert.equal(L.schedHold.length, 0, 'خرج الكل');
  const S2 = start(); const L2 = S2.learn; L2.schedHold = [{ q: 'bq', item: { c: 'riyadh', n: 1 }, d: 0 }, { q: 'tq', item: 'cure1', d: 0 }]; L2.tq = []; L2.bq = []; L2.lastMom = 10; S2.day = 5; E.schedRelease(S2); assert.equal(L2.schedHold.length, 0, 'السقف يفرج عن الكل'); ok('الأولوية لوح ← سرّ ← حكاية، والسقف يفرج عن الكل'); }
// 5) المؤجَّل محفوظ في حفظ اللاعب
{ const S = start(); days(S, 1); const n = heldN(S.learn); assert.ok(n >= 1, 'فيه معلّق'); const S2 = E.load(E.save(S)); assert.equal((S2.learn.schedHold || []).length, n, 'المعلّق باق بعد الحفظ والتحميل'); assert.deepEqual(S2.learn.schedHold, S.learn.schedHold); ok('المؤجَّل يبقى في الحفظ (' + n + ')'); }
// 6) المراحل لا تتأخر أبداً
{ const S = start(); const L = S.learn; days(S, 1); assert.ok(!(L.schedHold || []).some(h => !['tq', 'sq', 'csq', 'bq'].includes(h.q)), 'لا شيء من المراحل في المعلّق'); ok('المراحل والمستويات خارج المُجدوِل'); }
console.log('OK sched-types');
