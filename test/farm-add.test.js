'use strict';
// إضافة مواشي للمزرعة بخطوة واحدة: شراء + راعٍ عند الحاجة + وضع في المزرعة، مع رفض الحالات الخاطئة.
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const fresh = () => { const S = E.newGame(3); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.phase = 3; S.player.gold = 300000; S.noEvents = true;
  A.buildShop(S, 'riyadh'); assert(A.buildFarm(S, 'riyadh').ok); return S; };
{ const S = fresh(), f = E.farmOf(S, 'riyadh'), g0 = S.player.gold;
  const r = A.farmAdd(S, 'najdi', 6, 'f'); assert(r.ok, r.msg); assert.equal(Math.floor(f.herd.najdi), 6, '6 في المزرعة'); assert(S.player.gold < g0, 'خُصم الثمن');
  assert(S.player.caravans[0].herders >= 1, 'وُظّف راعٍ لسوق القطيع'); assert.equal(Math.floor((S.player.caravans[0].herd || {}).najdi || 0), 0, 'لا شيء بقي مع القافلة');
  assert(!A.farmAdd(S, 'silk', 3).ok, 'ما لا يُربّى مرفوض'); assert(!A.farmAdd(S, 'najdi', 0).ok, 'كمية صفر مرفوضة');
  const car = S.player.caravans[0]; car.left = 3; assert(!A.farmAdd(S, 'najdi', 2).ok, 'القافلة في الطريق'); car.left = 0;
  const S2 = fresh(); S2.player.caravans[0].city = 'cairo'; assert(!A.farmAdd(S2, 'najdi', 2).ok, 'لا مزرعة في المدينة الحالية'); }
console.log('Farm add: buy + herder + into farm in one step, rejects invalid cases: PASS');
