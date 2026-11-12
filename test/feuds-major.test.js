'use strict';
// 036ز: الخصومات الكبرى: الثلاث من بداية اللعبة وبلا نهاية، الحدود (مكة والمدينة، دولة 2، مدينة 1)، الأثر في السعر والرف في الاتجاهين، الحفظ القديم بلا تحويل، المفاتيح
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A, { load, run } = require('./lib/skill-sim'), ok = m => console.log('OK   ' + m);
const TX = fs.readFileSync(path.join(__dirname, '../specs/036-influence-contracts/texts.md'), 'utf8');
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; S.phase = 3; S.learn.level = 11; S.learn.stage = 23; return S; };
const PAIRS = [['jeddah', 'alex'], ['guangzhou', 'shanghai'], ['mumbai', 'kolkata']];
const bigs = S => (S.feuds || []).filter(f => f.big);
// 0) النصوص حرفاً من texts.md
for (const k of ['g1', 'g2', 'g3']) { const g = E.MED_TXT.GF[k]; for (const t of [g.title, g.story, g.effect]) assert.ok(TX.includes(t), 'نص ' + k + ' في texts.md: ' + t.slice(0, 30)); }
assert.ok(TX.includes(E.MED_TXT.list)); ok('عناوين الحكايات الثلاث وقصصها وآثارها وشرح القائمة مطابقة لـ texts.md');
// 1) الثلاث من بداية اللعبة، بالزعماء المنصوص عليهم، والأثر في الاتجاهين
{ const S = mk(); assert.equal(bigs(S).length, 3); PAIRS.forEach(([a, b], i) => { const f = bigs(S)[i]; assert.equal(f.a, a); assert.equal(f.b, b); assert.equal(f.s, 0); });
  assert.deepEqual([E.bossOf(S, 'jeddah').name, E.bossOf(S, 'alex').name], ['أبو سالم البحّار', 'سيد درويش الريّس']); assert.equal(E.bossOf(S, 'guangzhou').name, 'السيد تشن هاو'); assert.equal(E.bossOf(S, 'shanghai').name, 'السيد لين فاي'); assert.equal(E.bossOf(S, 'mumbai').name, 'سيث راجيش شاه'); assert.equal(E.bossOf(S, 'kolkata').name, 'بابو ديباك داس');
  for (const [a, b] of PAIRS) for (const [x, y] of [[a, b], [b, a]]) { const gs = E.fdGoods(S, x, y); assert.ok(gs.length, x + '→' + y + ' لها سلع'); const cy = S.cities[y]; gs.forEach(g => { assert.ok(cy.fpm[g] >= E.PREM[y][g] && cy.fpl[g] === E.GRIEF.pull, 'fpm وfpl ' + g); }); }
  const T = E.load(E.save(S)); T.feuds = []; T.player.peace = [{ k: 'g1' }, { k: 'g2' }, { k: 'g3' }]; E.feudApply(T); const g = E.fdGoods(S, 'jeddah', 'alex')[0], p0 = E.unitPrice(T.cities.alex, g), p1 = E.unitPrice(S.cities.alex, g);
  assert.ok(p1 > p0 * 1.02, 'السعر أغلى: ' + p1.toFixed(1) + ' > ' + p0.toFixed(1)); const g2 = E.fdGoods(S, 'alex', 'jeddah')[0]; assert.ok(E.unitPrice(S.cities.jeddah, g2) > E.unitPrice(T.cities.jeddah, g2) * 1.02, 'الاتجاه الآخر');
  const pj = JSON.stringify(S.player); E.feudApply(S); assert.equal(JSON.stringify(S.player), pj, 'لا يمس اللاعب');
  // الرف يمتلئ أبطأ
  const W = E.load(E.save(S)); W.player.peace = [{ k: 'g1' }, { k: 'g2' }, { k: 'g3' }]; W.feuds = []; E.feudApply(W); for (const X of [S, W]) { X.cities.alex.stock[g] = 0; X.cities.alex.extra = {}; } for (let i = 0; i < 10; i++) for (const X of [S, W]) { E.tick(X, false); X.pause = false; }
  assert.ok(S.cities.alex.stock[g] < W.cities.alex.stock[g], 'رف أبطأ'); ok('الثلاث من البداية بزعمائها، والأثر في السعر والرف في الاتجاهين، ولا مساس باللاعب'); }
// 2) لا تنتهي وحدها، والحدود على 3 بذور × 3 سنوات
for (const seed of [1, 2, 3]) { const S = mk(seed); let ordMax = 0; for (let d = 0; d < 1080; d++) { E.tick(S, false); S.pause = false; const l = S.feuds || [];
    assert.equal(bigs(S).length, 3, 'الثلاث باقية يوم ' + d); ordMax = Math.max(ordMax, l.filter(f => !f.big).length); assert.ok(l.filter(f => !f.big).length <= E.GRIEF.world, 'العادية ≤ 4 (الكبرى خارج السقف العالمي)');
    const cnt = {}, cit = {}; for (const f of l) { new Set([S.cities[f.a].country, S.cities[f.b].country]).forEach(k => { cnt[k] = (cnt[k] || 0) + 1; }); cit[f.a] = (cit[f.a] || 0) + 1; cit[f.b] = (cit[f.b] || 0) + 1; assert.ok(!['mecca', 'medina'].includes(f.a) && !['mecca', 'medina'].includes(f.b), 'لا مكة ولا المدينة'); }
    assert.ok(Object.values(cnt).every(v => v <= 2), 'دولة ≤ 2 مع الكبرى'); assert.ok(Object.values(cit).every(v => v === 1), 'مدينة ≤ 1'); }
  assert.ok(ordMax >= 1, 'العادية تولد بجانبها: ' + ordMax); }
ok('الثلاث بلا نهاية 3 سنوات × 3 بذور، والحدود: دولة 2 (تشمل الكبرى)، مدينة 1، العادية ≤ 4 خارج الكبرى، لا مكة ولا المدينة');
// 3) الحفظ القديم: تُضاف عند التحميل ولا تتحول خصومة عادية قائمة
{ const S = load('autopilot-23'); assert.equal(bigs(S).length, 3, 'أُضيفت عند التحميل'); assert.ok(E.feudView(S).every(f => !f.big || f.pct > 0)); const R = E.load(E.save(S)); assert.deepEqual(bigs(R), bigs(S), 'تُحفظ وتُحمَّل');
  // خصومة عادية قائمة على جدة: لا تتحول، وتنتظر انتهاءها
  const raw = E.save(mk(4)), O = JSON.parse(raw); O.feuds = [{ a: 'jeddah', b: 'cairo', s: 0, e: 20 }]; const L = E.load(JSON.stringify(O)); assert.equal(bigs(L).filter(f => f.k === 'g1').length, 0, 'g1 تنتظر'); assert.equal(L.feuds.length, 1 + 2); assert.ok(L.feuds[0].e === 20 && !L.feuds[0].big, 'العادية كما هي');
  L.day = 0; L.noEvents = true; for (let i = 0; i < 25; i++) { E.tick(L, false); L.pause = false; } assert.equal(bigs(L).filter(f => f.k === 'g1').length, 1, 'g1 تُضاف بعد انتهاء العادية');
  // لا تعود بعد الصلح
  const P = mk(5); P.player.peace = [{ k: 'g2', a: 'guangzhou', b: 'shanghai', d: 1 }]; P.feuds = []; E.feudApply(P); for (let i = 0; i < 3; i++) { E.tick(P, false); P.pause = false; } assert.deepEqual(bigs(P).map(f => f.k).sort(), ['g1', 'g3'], 'g2 لا تعود بعد الصلح'); ok('الحفظ القديم: تُضاف عند التحميل، لا تتحول العادية، وتنتظر انتهاءها، ولا تعود بعد الصلح'); }
// 4) المفاتيح: المطفأ = السلوك السابق بلا حقول
{ const prev = E.GRIEF.major.on; try { E.GRIEF.major.on = false; const S = mk(2); assert.ok(!bigs(S).length); run(S, 300); assert.ok(!bigs(S).length); const raw = E.save(S); assert.ok(!/"big"|"peace"|"med"/.test(raw), 'لا حقل جديد في الحفظ'); const L = load('autopilot-23'); assert.ok(!bigs(L).length, 'التحميل لا يضيف');
    assert.equal(E.feudView(S).filter(f => f.big).length, 0); } finally { E.GRIEF.major.on = prev; }
  const pg = E.GRIEF.on; try { E.GRIEF.on = false; const S = mk(2); assert.equal(S.feuds, undefined, 'GRIEF.on=false: لا S.feuds'); assert.ok(!/"feuds"|"fpm"/.test(E.save(S))); } finally { E.GRIEF.on = pg; } ok('GRIEF.major.on=false وGRIEF.on=false: لا خصومات كبرى ولا حقول في الحفظ'); }
console.log('feuds-major: كل الفحوص نجحت');
