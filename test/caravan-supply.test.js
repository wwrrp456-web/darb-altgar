// تموين المخازن بالقوافل المستأجرة: node test/caravan-supply.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const S = E.newGame(4); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 8; S.learn.abroad = true; S.phase = 2; S.player.gold = 90000; S.noShocks = true;
a(A.hireCaptain(S, 1).ok); const car = S.player.caravans[1], main = S.player.caravans[0];
const wh = 'riyadh'; A.buildShop(S, wh); A.buildWarehouse(S, wh); car.city = 'jeddah'; car.left = 0;
a(!A.captainSupply(S, main.id, wh, 'wheat', 50, 500).ok, 'ليست للقافلة الرئيسية');
a(!A.captainSupply(S, car.id, 'jeddah', 'wheat', 50, 500).ok, 'يلزم مخزن في المدينة');
a(!A.captainSupply(S, car.id, wh, 'sheep', 50, 500).ok, 'ليست ماشية');
a(!A.captainSupply(S, car.id, wh, 'wheat', 50, 10).ok, 'حد أدنى للميزانية');
a(!A.captainSupply(S, car.id, wh, 'wheat', 99999, 500).ok, 'سعة المخزن');
const r = A.captainSupply(S, car.id, wh, 'wheat', 40, 3000); a(r.ok, r.msg); a(E.fleetReport(S).find(x => x.id === car.id).mode === 'supply');
a(E.supplyOf(S, wh, 'wheat') === car, 'قائد التموين معروف'); a(!E.A.captainSupply(S, car.id, wh, 'wheat', 40, 3000).ok === false);
const src = E.supplySource(S, car, car.sup); a(src && src !== wh, 'مصدر التموين: ' + src);
// دورة التموين: يشتري ويسافر ثم يفرّغ في المخزن
const g0 = S.player.gold; let stored = 0;
for (let i = 0; i < 40 && stored < 1; i++) { E.tick(S); stored = S.player.props[wh].store.wheat || 0; }
a(stored >= 1, 'وصلت بضاعة إلى مخزن الرياض: ' + stored); a(car.sup.moved >= 1 && car.sup.trips >= 1, 'سُجّلت الرحلة'); a(S.player.gold < g0, 'دُفع ثمنها وأجره');
a(Object.values(S.player.props[wh].basis || {}).some(b => b.q > 0), 'كلفة الشراء انتقلت إلى المخزن');
// لا ينقل فوق المستهدف: بعد اكتفاء المخزن ينتظر
S.player.props[wh].store.wheat = 1000; for (let i = 0; i < 10; i++) E.tick(S); a(car.waiting === 'المخزن مكتفٍ' || (car.cargo.wheat || 0) === 0, 'يتوقف عند اكتفاء المخزن');
// قائد آخر لا يموّن السلعة نفسها لنفس المخزن
a(A.hireCaptain(S, 0).ok); const c3 = S.player.caravans[S.player.caravans.length - 1]; a(!A.captainSupply(S, c3.id, wh, 'wheat', 40, 3000).ok, 'قائد واحد لكل مخزن وسلعة');
// تغيير الوضع يلغي التموين
a(A.captainMode(S, car.id, 'free').ok && !car.sup, 'الوضع الحرّ يلغي التموين'); a(A.captainSupply(S, car.id, wh, 'wheat', 40, 3000).ok); a(A.setRoute(S, car.id, { a: 'riyadh', b: 'jeddah', buyA: 'dates', buyB: 'wheat' }).ok && !car.sup, 'المسار يلغيه'); 
a(E.load(E.save(S)).player.caravans[1].sup === null, 'الحفظ');
console.log('PASS caravan supply');
