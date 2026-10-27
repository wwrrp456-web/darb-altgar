// أوضاع قوافل القادة: حرّ وراحة وإيقاف: node test/caravan-modes.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const S = E.newGame(4); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 8; S.learn.abroad = true; S.phase = 2; S.player.gold = 90000; S.noShocks = true;
a(A.hireCaptain(S, 1).ok); const car = S.player.caravans[1]; car.left = 0; car.morale = 30; delete car.captain.role; car.captain.role = 'loyal';
a(!A.captainMode(S, S.player.caravans[0].id, 'free').ok, 'القافلة الرئيسية ليست لقائد مستأجر');
a(A.captainMode(S, car.id, 'free').ok && car.free && !car.route, 'الوضع الحرّ'); a(E.fleetReport(S).find(r => r.id === car.id).mode === 'free');
a(A.captainMode(S, car.id, 'rest', 4).ok && car.restUntil === S.day + 4, 'راحة 4 أيام'); const rep = E.fleetReport(S).find(r => r.id === car.id); a(rep.mode === 'rest' && /يرتاح/.test(rep.status));
const m0 = car.morale; car.waiting = null; E.tick(S); a(car.morale >= m0 + 11, 'المعنويات تتعافى أسرع في الراحة (' + m0 + '→' + car.morale + ')');
for (let i = 0; i < 6; i++) E.tick(S); a(!car.restUntil && car.morale > 70, 'تنتهي الراحة وتتعافى المعنويات');
a(S.news.some(n => /انتهت راحة/.test(n.t)), 'خبر انتهاء الراحة');
a(A.setRoute(S, car.id, { a: 'riyadh', b: 'jeddah', buyA: 'dates', buyB: 'wheat' }).ok && car.route && !car.free, 'اعتماد مسار يُلغي الوضع الحرّ');
a(A.captainMode(S, car.id, 'stop').ok && !car.route && !car.free, 'الإيقاف');
car.left = 3; a(!A.captainMode(S, car.id, 'rest', 3).ok, 'لا راحة أثناء الطريق'); car.left = 0;
a(!A.captainMode(S, car.id, 'bogus').ok, 'وضع مجهول');
a(E.load(E.save(S)).player.caravans[1].free === false, 'الحفظ');
console.log('PASS caravan modes');
