'use strict';
const assert = require('node:assert/strict'), E = require('../src/engine.js');
function retired(wealth = 90000, text = 'يا ولدي: حافظ على دفترك. <b>بابل</b>\nالسطر الثاني') {
  const S = E.newGame(5); E.A.learnSetChar(S, 'trader'); S.player.name = 'ناصر'; S.phase=4; S.noLock=1; S.noEvents=true; S.noShocks=true; S.learn.level=11; S.learn.stage=23; S.day = 70 * 354; S.player.gold = wealth;
  assert(E.A.buildShop(S,'riyadh').ok);assert(E.A.buyShip(S,'jeddah','dhow').ok);S.player.caravans[0].cargo.wheat=10;S.player.caravans[0].basis.wheat={q:10,c:100};
  assert(E.A.retire(S, { name: 'سهيل', will: text }).ok); return S;
}
const base = E.newGame(17), S = retired(), raw = E.save(S), card = E.grandchildCard(S);
assert.equal(E.save(S), raw); assert.equal(card.name, 'ناصر'); assert.equal(card.char, 'trader'); assert.equal(card.title, 'حفيد ناصر');
assert.equal(card.message, S.legacy.will.text); assert.equal(card.wealth, S.legacy.father.wealth); assert.equal(card.days, S.legacy.father.day);
assert.equal(card.year, E.dateOf({ ...S }, card.days).h.y);
for (const perk of ['purse', 'name', 'map']) {
  const T = E.startGrandchild(S, perk, 17); assert(T); assert.equal(E.save(S), raw, 'لا يمس الجد');
  assert.deepEqual(Object.keys(T.ancestry).sort(), ['name','char','title','perk','message','wealth','days','year'].sort());
  assert.equal(T.day, 0); assert.equal(T.phase, 1); assert.equal(T.learn.char, null); assert.equal(T.learn.level, 1); assert.equal(T.learn.stage, base.learn.stage);
  const expected=E.newGame(17);if(perk==='purse')expected.player.wallet.sar+=200;assert.deepEqual(T.player,expected.player,'اللاعب كله بداية عادية ما عدا النقد المسموح');assert.deepEqual(T.cities,base.cities);assert.equal(T.seed,base.seed);
  assert.deepEqual(T.player.caravans, base.player.caravans); assert.deepEqual(T.agents, base.agents); assert.deepEqual(T.player.props, {}); assert.deepEqual(T.player.factories, []); assert.deepEqual(T.player.ships, []);
  assert.deepEqual(T.player.bank, base.player.bank); assert.equal(T.noLock,undefined);assert.equal(T.noEvents,undefined);assert.equal(T.noShocks,undefined); assert.deepEqual(T.learn, base.learn); assert.equal(T.legacy, undefined); assert.equal(T.life, undefined); assert.equal(T.ach, undefined); assert.equal(T.player.trips, 0);
  assert.equal(T.player.gold - base.player.gold, perk === 'purse' ? 200 : 0);
  for (const id of T.order) { assert.equal(T.bosses[id].trust - base.bosses[id].trust, perk === 'name' && id === 'riyadh' ? 10 : 0); assert.equal(T.bosses[id].p, base.bosses[id].p); }
  assert.deepEqual(T.player.known, base.player.known, 'الأسعار العامة مكشوفة أصلاً؛ لا إضافة زيارة أو معرفة دائمة تتجاوز D2');
  const loaded = E.load(E.save(T)); assert.deepEqual(loaded.ancestry, T.ancestry); assert.equal(loaded.ancestry.message, S.legacy.will.text); assert(E.loadChecked(E.save(T)).ok);
  E.A.chooseStart(T, 'eg'); if (perk === 'name') { assert.equal(T.bosses.riyadh.trust, 0); assert.equal(T.bosses.cairo.trust, 10); }
  assert(E.A.learnSetChar(T, 'trader').ok); assert.equal(T.learn.stage, 1); assert.deepEqual(T.learn.stageDone, []); assert.equal(T.learn.level, 1); assert.equal(T.learn.intro, 0);
}
for (const [worth, bonus] of [[0,0],[-100,0],[999,9.99],[19999,199.99],[20000,200],[1e9,200]]) { const T = retired(); T.legacy.father.wealth = worth; const C = E.startGrandchild(T, 'purse', 17); assert(Math.abs(C.player.gold - base.player.gold - bonus) < 1e-8); }
{ const T = E.startGrandchild(S, 'map', 17), writes = []; T.player.known = new Proxy(T.player.known, { set(o,k,v) { writes.push(k); o[k]=v; return true; } }); assert(E.A.chooseStart(T, 'eg').ok); assert.equal(writes.length, T.order.length + 2); assert.deepEqual(writes.slice(-2).sort(), ['alex','aswan']); assert.deepEqual(T.learn.cv, {}); }
assert.equal(E.startGrandchild(base,'purse',1),null); assert.equal(E.startGrandchild(S,'all',1),null); assert.equal(E.startGrandchild(S,'purse',NaN),null);
{ const T = retired(); T.legacy.will.text = ''; assert.equal(E.startGrandchild(T,'name',17).ancestry.message,''); }
{ const T=retired();delete T.cal;const before=E.save(T);assert(E.grandchildCard(T));assert.equal(E.save(T),before,'لا تهيئة للتقويم في حالة الجد'); }
{ assert(E.loadChecked(E.save(base)).ok); const T = E.load(E.save(base)); assert.equal(T.ancestry,undefined); E.tick(T,false); }
try { E.GRANDCHILD.on=false; assert.equal(E.grandchildCard(S),null); assert.equal(E.startGrandchild(S,'purse',17),null); assert.equal(E.newGame(17).ancestry,undefined); assert.equal(E.save(S),raw); } finally { E.GRANDCHILD.on=true; }
console.log('PASS grandchild: three exact bounded perks, one optional card, fresh stages/assets, pure source, exact will, country selection, old save and off switch');
