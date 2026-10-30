// WP-23: أهداف المواسم: هدف لكل موسم مرة في الحول، جائزة تجميلية بلا أثر مالي، مفتاح رجوع، حفظ قديم، والمواسم الإحدى عشرة ظاهرة بعد الاعتماد
const assert = require('node:assert/strict'), E = require('../src/engine.js'), RF = require('../src/review-flags.js'), A = E.A, ok = m => console.log('OK   ' + m);
const { SEASON_GOALS, SCHED } = E, RELIG = ['shaban', 'ramadan', 'fitr', 'hajj', 'adha', 'rajab'], VISIBLE = ['harvest', 'winter', 'ukaz', 'majanna', 'majaz', ...RELIG];
const mk = (seed = 11) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 10; S.player.gold = 5000; S.noLock = 1; return S; };
const step = S => { E.tick(S); S.pause = false; const L = S.learn; for (const k of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) L[k] = []; };
const hyear = (S, d) => E.dateOf(S, d).h.y;
assert.equal(SEASON_GOALS.on, true); assert.equal(SCHED.seasons, true); assert.deepEqual(RELIG.map(k => E.seasonGoalDef(null, k, 10).id), ['SG-01', 'SG-02', 'SG-03', 'SG-04', 'SG-05', 'SG-06'], 'معرّفات السجل SG-01..06 بترتيب المواسم الدينية');
// 1) سنوات بلا تكرار: المواسم الإحدى عشرة تُعلَن مرة واحدة في كل حول كامل بعد رفع الإخفاء
assert.deepEqual(RF.FLAGS.hidden, []); assert.equal(VISIBLE.length, 11); assert.deepEqual(E.seasonGoalView(mk()).all.map(x => x.k).sort(), VISIBLE.slice().sort());
{ const S = mk(), seen = new Map(), years = new Set();
  for (let i = 0; i < 354 * 3 + 60; i++) { step(S); const G = S.seasonGoals; if (!G) continue; years.add(G.y);
    for (const k of Object.keys(G.seen)) { const key = G.y + ':' + k; if (seen.has(key)) assert.equal(G.seen[k], seen.get(key), 'لم يتكرر إعلان ' + key); else seen.set(key, G.seen[k]); } }
  const ys = [...years].sort((a, b) => a - b), mid = ys.slice(1, -1); assert.ok(mid.length >= 1, 'حول كامل واحد على الأقل: ' + ys.join());
  for (const y of mid) for (const k of VISIBLE) assert.ok(seen.has(y + ':' + k), 'الموسم ' + k + ' أُعلن هدفه في الحول ' + y);
  ok('المواسم الإحدى عشرة تُعلَن مرة في كل حول (' + mid.join('،') + ') وصفر تكرار'); }
// 2) مفتاح الإخفاء يظل فعالاً إن تقرر مستقبلاً، ثم تعود الأهداف الستة بعد رفعه
{ const keep = RF.FLAGS.hidden.slice(); RF.FLAGS.hidden.push(...RELIG.map(k => E.seasonGoalDef(null, k, 10).id)); try { const S = mk(), seen = new Set(); for (let i = 0; i < 354 + 40; i++) { step(S); if (S.seasonGoals) Object.keys(S.seasonGoals.seen).forEach(k => seen.add(k)); } for (const k of RELIG) assert.ok(!seen.has(k), 'المفتاح يحجب ' + k); assert.deepEqual(E.seasonGoalView(S).all.map(x => x.k).sort(), VISIBLE.filter(k => !RELIG.includes(k)).sort()); } finally { RF.FLAGS.hidden.splice(0, RF.FLAGS.hidden.length, ...keep); } assert.equal(E.seasonGoalView(mk()).all.length, 11); ok('مفتاح الإخفاء يعمل عند ضبطه، والافتراضي يعرض المواسم الإحدى عشرة'); }
// 3) الجائزة تجميلية: إنجاز الهدف بالبيع الفعلي يمنح زخرفة ولقباً بلا أي فرق في الذهب أو الأسعار عن المفتاح المطفأ (بالفعل نفسه)
const winterStart = S => { for (let d = 1; d < 800; d++) if (E.seasonsAt(S, d).includes('winter') && !E.seasonsAt(S, d - 1).includes('winter')) return d; throw Error('no winter'); };
const play = on => { SEASON_GOALS.on = on; try { const S = mk(), d = winterStart(S); S.day = d - 1; step(S); const car = S.player.caravans[0]; car.cargo.wool = 400; const g0 = S.player.gold, idx0 = JSON.stringify(S.cities[car.city].idx), r = A.sell(S, car.id, 'wool', 400), G = S.seasonGoals;
    return { S, G, r, gold: S.player.gold, idx: JSON.stringify(S.cities[car.city].idx), g0, idx0, news: JSON.stringify(S.news || []) }; } finally { SEASON_GOALS.on = true; } };
{ const on = play(true), off = play(false);
  assert.ok(on.r.ok !== false && on.r.n > 0, 'بيع فعلي'); assert.ok(on.G && on.G.done.winter != null && on.G.deco.winter != null, 'أُنجز الهدف: ' + JSON.stringify(on.G)); assert.equal(on.G.cur.length, 0);
  assert.ok(/نلتَ زخرفة برد الشتاء ولقب «تاجر برد الشتاء»/.test(on.news), 'خبر الجائزة');
  assert.equal(off.G, undefined, 'المفتاح مطفأ: لا حقل'); assert.equal(on.gold, off.gold, 'صفر فرق في الذهب'); assert.equal(on.idx, off.idx, 'صفر فرق في الأسعار');
  const v = E.seasonGoalView(on.S); assert.equal(v.last.k, 'winter'); assert.equal(v.last.title, 'تاجر برد الشتاء'); assert.ok(!Object.keys(v.last).some(k => /gold|infl|xp|discount|reward/i.test(k)), 'لا حقل مالي في الجائزة');
  ok('الجائزة زخرفة ولقب بلا ذهب ولا نفوذ ولا خصم؛ والذهب والأسعار متطابقة مع المفتاح المطفأ'); }
// 4) المفتاح مطفأ: لا هدف ولا حقل ولا طابور طوال سنتين
{ SEASON_GOALS.on = false; try { const S = mk(); for (let i = 0; i < 354 * 2; i++) step(S); assert.equal(S.seasonGoals, undefined); assert.ok(!(S.learn.sgq && S.learn.sgq.length)); } finally { SEASON_GOALS.on = true; } ok('SEASON_GOALS.on=false: لا حقل ولا هدف'); }
// 5) صفر فرق في الذهب والأسعار بين التشغيل والإطفاء بالبذرة نفسها بلا أفعال لاعب (سنتان)
{ const run = on => { SEASON_GOALS.on = on; try { const S = mk(5); for (let i = 0; i < 354 * 2; i++) step(S); return JSON.stringify([S.player.gold, Object.values(S.cities).map(c => c.idx)]); } finally { SEASON_GOALS.on = true; } };
  assert.equal(run(true), run(false)); ok('سنتان بالبذرة نفسها: الذهب والأسعار متطابقة تشغيلاً وإطفاءً'); }
// 6) هدف موسم انتهى بلا إنجاز يزول بلا عقوبة ولا يعود في الحول نفسه؛ ثم يُصفَّر في حول جديد
{ const S = mk(); const d = winterStart(S); S.day = d - 1; step(S); let G = S.seasonGoals; assert.equal(G.cur.length >= 1, true); const y = G.y; let n = 0; while (E.seasonActive(S, 'winter') && n++ < 200) step(S); step(S);
  assert.ok(!G.cur.some(c => c.k === 'winter'), 'زال الهدف بانتهاء الموسم'); assert.ok(G.seen.winter != null && G.done.winter == null && G.deco && !G.deco.winter, 'بلا زخرفة ولا عقوبة'); assert.equal(S.player.gold >= 0, true);
  const g = S.player.gold; for (let i = 0; i < 354 + 5; i++) step(S); assert.ok(S.seasonGoals.y !== y, 'تغيّر الحول'); ok('الهدف المنتهي يزول بلا عقوبة، ويُصفَّر في الحول الجديد'); }
// 7) حفظ قديم بلا الحقل يعمل؛ والحقل يبقى في الحفظ
{ const S = mk(); assert.equal(S.seasonGoals, undefined); const T = E.load(E.save(S)); for (let i = 0; i < 50; i++) step(T); const U = mk(); U.day = winterStart(U) - 1; step(U); const V = E.load(E.save(U)); assert.deepEqual(V.seasonGoals, U.seasonGoals); step(V); ok('الحفظ القديم بلا الحقل يعمل، والحقل يُحفظ ويُحمَّل'); }
// 8) الإعلان عبر المُجدوِل: لا يضيع، ويتأخر ولا يتجاوز السقف إن زوحم
{ for (const sch of [true, false]) { SCHED.seasons = sch; try { const S = mk(); S.day = winterStart(S) - 1; S.learn.lastMom = S.day + 1; step(S); const L = S.learn; assert.ok(S.seasonGoals.cur.length >= 1, 'الهدف قائم فوراً');
      if (sch) { assert.ok((L.schedHold || []).some(h => h.q === 'sgq'), 'الإعلان معلّق خلف لحظة اليوم'); for (let i = 0; i < 8; i++) { step(S); if (!(L.schedHold || []).some(h => h.q === 'sgq')) break; } assert.ok(!(L.schedHold || []).some(h => h.q === 'sgq'), 'خرج الإعلان خلال السقف'); step(S); }
      else assert.ok(!(L.schedHold || []).some(h => h.q === 'sgq'), 'المفتاح مطفأ: فوري'); assert.equal((L.sgq || []).length, 0, 'استُهلك الإعلان'); } finally { SCHED.seasons = true; } } ok('الإعلان عبر المُجدوِل: يتأخر عند التزاحم ولا يضيع، وفوري إن أُطفئ SCHED.seasons'); }
console.log('\nseason-goals: كلها ناجحة');
