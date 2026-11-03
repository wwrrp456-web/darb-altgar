// 020: لوحتا ترتيب الدول والأسواق: ترتيب بالازدهار الكلي، قيادتك تطابق الأسواق المقادة، الاتجاه من لقطة 30 يوماً، المفتاح، الحفظ القديم، وعرض فقط بلا أثر
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
const { BOARDS } = E;
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; return S; };
const tick = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
// ١) الحجم والترتيب والقيم المشتقة من 016
{ const S = mk(); tick(S, 65); const m = E.marketBoard(S), c = E.countryBoard(S); assert.equal(m.length, 18); assert.equal(c.length, 5);
  for (let i = 1; i < m.length; i++) assert.ok(m[i - 1].P >= m[i].P - 1e-9, 'الأسواق مرتبة تنازلياً'); for (let i = 1; i < c.length; i++) assert.ok(c[i - 1].P >= c[i].P - 1e-9, 'الدول مرتبة تنازلياً'); assert.deepEqual(m.map(r => r.rank), m.map((_, i) => i + 1));
  for (const r of m) { const v = E.prosperityView(S, r.id); assert.ok(Math.abs(r.P - v.total) < 1e-9, r.id + ' P من 016'); assert.equal(r.pop, E.popTotal(S.cities[r.id])); assert.ok(r.strong.v >= r.weak.v && r.dims.every(d => d.v <= r.strong.v + 1e-9 && d.v >= r.weak.v - 1e-9), 'الأقوى والأضعف'); }
  for (const r of c) { const ids = S.order.filter(id => S.cities[id].country === r.id), w = ids.map(id => S.cities[id].size), exp = ids.reduce((a, id, i) => a + E.prosperityView(S, id).total * w[i], 0) / w.reduce((a, b) => a + b, 0); assert.ok(Math.abs(r.P - exp) < 1e-9, 'متوسط موزون بالأحجام: ' + r.id); assert.equal(r.total, ids.length); assert.equal(r.pop, ids.reduce((a, id) => a + E.popTotal(S.cities[id]), 0)); }
  // رفع ازدهار مدينة يغيّر ترتيبها
  const low = m[m.length - 1].id; E.prosEnsure(S, low); const p = S.cities[low].pros; for (const k of E.PR_KEYS) p[k] = p.b[k] + 40; assert.equal(E.marketBoard(S)[0].id, low, 'الأعلى ازدهاراً أولاً'); ok('الأسواق (18) والدول (5) مرتبة بالازدهار الكلي، والقيم مطابقة لـ016، والدولة بمتوسط موزون بالأحجام'); }
// ٢) قيادتك تطابق الأسواق التي يتصدرها اللاعب، والزعيم ونفوذك
{ const S = mk(); S.phase = 3; tick(S, 35); const sa = S.order.filter(id => S.cities[id].country === 'sa'); assert.ok(sa.length >= 3); S.bosses[sa[0]].ruler = 'player'; S.bosses[sa[1]].ruler = 'player'; const c = E.countryBoard(S).find(r => r.id === 'sa'), m = E.marketBoard(S);
  assert.equal(c.led, 2); assert.equal(c.total, sa.length); for (const r of m) { const led = sa.slice(0, 2).includes(r.id); assert.equal(r.led, led, r.id); assert.equal(!!r.boss, !led && !!S.bosses[r.id], 'زعيم السوق غير المقاد'); }
  const o = m.find(r => r.boss); assert.ok(o.boss.name && o.boss.share >= 0 && o.boss.share <= 1); assert.ok(E.countryBoard(S).filter(r => r.id !== 'sa').every(r => r.led === 0)); ok('«قيادتك» تطابق الأسواق التي يقودها اللاعب، والزعيم ونسبة نفوذك'); }
// ٣) مساهمتك: نسبتك من قيمة كل بُعد
{ const S = mk(); S.projects = { peak: 1e7, paid: { P04: 3 }, until: {}, pick: { P04: 'jeddah' }, done: ['P04'], tier: 3 }; tick(S, 150); const r = E.marketBoard(S).find(x => x.id === 'jeddah'); assert.ok(r.mine.find(d => d.k === 'trade' && d.share > 0), 'السوق المسقوف يظهر في مساهمتك'); assert.ok(!E.marketBoard(S).find(x => x.id === 'cairo').mine.length, 'مدينة بلا مساهمة'); ok('مساهمتك تظهر من مشاريعك ونشاطك فقط'); }
// ٤) الاتجاه من لقطة 30 يوماً
{ const S = mk(); tick(S, 31); assert.ok(S.board && S.board.day === 30 && S.board.prev == null); assert.ok(E.marketBoard(S).every(r => r.trend === 0), 'لا اتجاه قبل لقطتين'); tick(S, 30); assert.equal(S.board.day, 60); assert.ok(S.board.prev && Object.keys(S.board.cur.c).length === 18 && Object.keys(S.board.cur.k).length === 5, 'اللقطة صغيرة');
  const id = 'riyadh', now = E.marketBoard(S).find(r => r.id === id).P; S.board.prev.c[id] = now - 3; S.board.prev.k.sa = E.countryBoard(S).find(r => r.id === 'sa').P + 3; const o = E.marketBoard(S).find(r => r.id === id); assert.equal(o.trend, 1, 'ارتفع'); assert.equal(E.countryBoard(S).find(r => r.id === 'sa').trend, -1, 'هبط'); S.board.prev.c[id] = now - 0.2; assert.equal(E.marketBoard(S).find(r => r.id === id).trend, 0, 'ثابت دون 0.5'); ok('الاتجاه ↑ → ↓ يتبع لقطة 30 يوماً (عتبة 0.5)'); }
// ٥) الحفظ: اللقطة تعود، والقديم بلا لقطة يعمل
{ const S = mk(); tick(S, 61); const L = E.load(E.save(S)); assert.deepEqual(L.board, S.board); assert.equal(E.marketBoard(L).length, 18); const O = mk(); delete O.board; const O2 = E.load(E.save(O)); assert.equal(O2.board, undefined); assert.equal(E.marketBoard(O2).length, 18, 'اللوحة تعمل بلا لقطة'); tick(O2, 31); assert.ok(O2.board); ok('الحفظ: اللقطة تعود، والحفظ القديم بلا حقل يعمل'); }
// ٦) المفتاح: لا لوحات ولا لقطة، والتبديل لا يفسد الحفظ
{ const S = mk(); BOARDS.on = false; try { tick(S, 65); assert.equal(S.board, undefined); assert.deepEqual(E.marketBoard(S), []); assert.deepEqual(E.countryBoard(S), []); } finally { BOARDS.on = true; } assert.equal(E.marketBoard(S).length, 18); const S2 = mk(); E.PROSPER.on = false; try { assert.deepEqual(E.marketBoard(S2), [], 'بلا ازدهار لا لوحات'); } finally { E.PROSPER.on = true; } ok('مفتاحا الرجوع: لا لوحات ولا لقطة'); }
// ٧) عرض فقط: لا أثر على الذهب ولا الازدهار
{ const run = on => { BOARDS.on = on; try { const S = mk(7); S.player.gold = 8000; for (let d = 0; d < 95; d++) { E.botMain(S); tick(S); } return [Math.round(S.player.gold), Math.round(E.netWorth(S)), S.order.map(id => S.cities[id].pros ? Math.round(S.cities[id].pros.trade * 1000) : 0).join(',')]; } finally { BOARDS.on = true; } };
  assert.deepEqual(run(true), run(false)); ok('عرض فقط: الذهب والثروة والازدهار متطابقة بالمفتاحين'); }
console.log('\nboards: كلها ناجحة');
