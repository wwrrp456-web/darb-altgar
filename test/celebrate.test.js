'use strict';
const assert = require('node:assert/strict'), E = require('../src/engine.js'), CM = require('../src/content-map.js'), A = E.A;
const ok = text => console.log('OK   ' + text);
const pending = S => [...(S.learn.celq || []), ...(S.learn.schedHold || []).filter(x => x.q === 'celq').map(x => x.item)];
function mk(advanced = true, seed = 5) {
  const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true;
  if (advanced) Object.assign(S.learn, { level: 11, stage: 23, stageDone: Array.from({ length: 22 }, (_, i) => i + 1), intro: 11, free: true });
  S.phase = 4; S.player.gold = 30000; S.learn.lastMom = -99; S.learn.schedHold = [];
  delete S.learn.cel; delete S.learn.celq; E.celebrateProgress(S); return S;
}
function arrive(S, to) { const c = S.player.caravans[0]; Object.assign(c, { from: c.city, dest: to, left: 1, total: 1, supplies: 100 }); E.tick(S, false); }
function count(S, id) { return pending(S).filter(x => x.id === id).length; }
assert.equal(E.CELEBRATE.on, true); assert.equal(E.SCHED.celebrate, true);
{ const S = mk(); assert.equal(E.celebrate(S, '__proto__'), false); assert.equal(E.celebrate(S, 'chapter_done', 8), false);
  assert.equal(E.celebrate(S, 'first_country', 'eg'), true); assert.equal(S.learn.cel.first_country, 0); assert.equal(E.celebrate(S, 'first_country', 'ir'), false); assert.equal(count(S, 'first_country'), 1);
  for (let n = 1; n <= 7; n++) { assert(E.celebrate(S, 'chapter_done', n)); assert(!E.celebrate(S, 'chapter_done', n)); assert.equal(S.learn.cel['chapter_done:' + n], 0); }
  assert.equal(count(S, 'chapter_done'), 7); ok('معرّفات صالحة فقط، اليوم0 لا يتكرر، ولكل فصل سجل مستقل'); }
{ const S = mk(); arrive(S, 'cairo'); assert.equal(S.player.caravans[0].city, 'cairo'); assert.equal(S.learn.cel.first_country, S.day); arrive(S, 'mumbai'); assert.equal(count(S, 'first_country'), 1);
  const home = mk(); home.player.caravans[0].city = 'cairo'; arrive(home, 'riyadh'); assert.equal(home.learn.cel.first_country, undefined); ok('وصول فعلي إلى بلد أجنبي، لا العودة للموطن، ولا تكرار في بلد آخر'); }
{ const S = mk(); assert(A.buyShip(S, 'jeddah', 'dhow').ok); const day = S.learn.cel.first_ship; assert.equal(day, S.day); assert(A.buyShip(S, 'jazan', 'dhow').ok); assert.equal(S.learn.cel.first_ship, day); assert.equal(count(S, 'first_ship'), 1); ok('شراء السفينة الحقيقي يطلق الأولى فقط'); }
{ const S = mk(), b = S.bosses.riyadh; b.p = 100; b.b = 5;
  for (let i = 0; i < 30 && b.ruler !== 'player'; i++) E.tick(S, false);
  assert.equal(b.ruler, 'player'); assert.equal(S.learn.cel.market_lead, S.day); E.tick(S, false); assert.equal(count(S, 'market_lead'), 1); ok('خلع الزعيم الحقيقي يطلق احتفال الزعامة مرة'); }
{ const S = mk(), car = S.player.caravans[0]; S.player.famDebt.left = 0; car.cargo.wheat = 10; S.cities[car.city].idx.wheat = 1.8; S.player.gold += 999999 - E.netWorth(S); assert(E.netWorth(S) < 1000000); assert.equal(S.learn.cel.first_million, undefined); assert(A.sell(S, car.id, 'wheat', 1).ok); assert(E.netWorth(S) >= 1000000); assert.equal(S.learn.cel.first_million, S.day); assert(A.sell(S, car.id, 'wheat', 1).ok); assert.equal(count(S, 'first_million'), 1); ok('عبور صافي الثروة مليوناً بفعل فعلي، لا تكرار'); }
{ const S = mk(false); const before = E.save(S); E.chapterJourney(S, CM.PIECES); assert.equal(E.save(S), before, 'استعلام الفصول يبقى نقياً');
  Object.assign(S.learn, { stageDone: [1, 2, 3, 4, 5], stage: 6, level: E.STAGES[5].source }); E.celebrateProgress(S);
  assert.equal(count(S, 'chapter_done'), 2); assert(pending(S).some(x => x.id === 'chapter_done' && x.arg === 1)); assert(pending(S).some(x => x.id === 'chapter_done' && x.arg === 2)); E.celebrateProgress(S); assert.equal(count(S, 'chapter_done'), 2);
  const old = mk(); assert.equal(count(old, 'chapter_done'), 0, 'لا احتفالات رجعية لفصول حفظ متقدم'); ok('انتقال حالة الفصول الفعلي، بلا تعديل للاستعلام ولا إعادة إنجاز قديم'); }
{ const S = mk(), L = S.learn; L.lastMom = 0; E.celebrate(S, 'first_country', 'eg'); S.day = 1; E.schedRelease(S); assert.equal((L.celq || []).length, 0); S.day = 2; E.schedRelease(S); assert.equal(L.celq.length, 1); assert.equal(L.lastMom, 0, 'لا تغيير لساعة الدروس');
  E.celebrate(S, 'first_ship', 1); S.day = 3; E.schedRelease(S); assert.equal(L.celq.length, 1); S.day = 4; E.schedRelease(S); assert.equal(L.celq.length, 2);
  const H = mk(); H.learn.lastMom = H.day; E.celebrate(H, 'first_country', 'eg'); for (let d = 1; d <= 5; d++) { H.day = d; H.learn.lastMom = d; E.schedRelease(H); assert.equal((H.learn.celq || []).length, d === 5 ? 1 : 0); } ok('فاصل يومين وسقف5 أيام، دون تغيير ساعة المحتوى'); }
{ const S = mk(); E.celebrate(S, 'first_country', 'eg'); S.day = (95 - 25) * 354; S.learn.lastMom = S.day;
  assert(A.retire(S, { name: 'سهيل' }).ok); assert.equal(S.legacy.retired, true); assert.equal(S.learn.cel.retirement, S.day); assert.equal(S.learn.celq[0].id, 'retirement'); assert.equal(count(S, 'first_country'), 1, 'المؤجل لا يضيع أثناء التقاعد'); assert(!A.retire(S, { name: 'سهيل' }).ok); assert.equal(count(S, 'retirement'), 1); ok('التقاعد الحقيقي فوري في الطابور، مع حفظ اللحظات المؤجلة ومنع التكرار'); }
{ const S = mk(); E.celebrate(S, 'first_ship', 1); const loaded = E.load(E.save(S)); assert.deepEqual(loaded.learn.cel, S.learn.cel); assert.deepEqual(loaded.learn.schedHold, S.learn.schedHold);
  const raw = JSON.parse(E.save(S)); delete raw.learn.cel; delete raw.learn.celq; raw.learn.schedHold = []; const old = E.load(JSON.stringify(raw)); assert.equal(old.learn.cel, undefined); E.tick(old, false); ok('حفظ قديم بلا الحقول يعمل، والسجل والطابور محفوظان'); }
// حفظ متقدم من قبل الميزة: لا تسمى رحلة لاحقة أو سفينة ثانية «الأولى».
{ const S = mk(); S.learn.ev.crossed = 2; arrive(S, 'cairo'); assert.equal(S.learn.cel.first_country, undefined);
  const T = mk(); assert(A.buyShip(T, 'jeddah', 'dhow').ok); delete T.learn.cel; delete T.learn.celq; T.learn.schedHold = []; assert(A.buyShip(T, 'jazan', 'dhow').ok); assert.equal(T.learn.cel?.first_ship, undefined); ok('حفظ متقدم: لا رحلة أولى زائفة ولا سفينة أولى زائفة'); }
function financial(on) {
  E.CELEBRATE.on = on; const S = mk(false, 19), car = S.player.caravans[0]; S.player.famDebt.left = 0; car.cargo.wheat = 10; S.cities[car.city].idx.wheat = 1.8; S.player.gold += 999999 - E.netWorth(S); assert(A.sell(S, car.id, 'wheat', 1).ok); assert(A.buyShip(S, 'jeddah', 'dhow').ok); S.bosses.riyadh.p = 100; S.bosses.riyadh.b = 5;
  for (let d = 0; d < 12; d++) {
    if (d === 2) { const c = S.player.caravans[0]; Object.assign(c, { from: c.city, dest: 'cairo', left: 1, total: 1, supplies: 100 }); }
    if (d === 4) Object.assign(S.learn, { stageDone: [1, 2, 3, 4, 5], stage: 6, level: E.STAGES[5].source, stageIntro: 99 });
    A.work(S); E.tick(S, false); S.pause = false;
  }
  S.day = (95 - 25) * 354; assert(A.retire(S, { name: 'سهيل' }).ok);
  if (!on) { assert.equal(S.learn.cel, undefined); assert.equal(S.learn.celq, undefined); assert(!(S.learn.schedHold || []).some(x => x.q === 'celq')); }
  return { player: S.player, cities: S.cities, lastMom: S.learn.lastMom, seed: S.seed };
}
try { const yes = financial(true), no = financial(false); assert.deepEqual(yes, no); ok('البذرة والأفعال نفسها: صفر فرق في المحفظة والأصول والمدن وساعة المحتوى؛ المفتاح المطفأ لا ينشئ حقلاً أو طابوراً'); } finally { E.CELEBRATE.on = true; }
console.log('\ncelebrate: كلها ناجحة');
