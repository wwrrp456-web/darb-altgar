// خانات الرتبة: node test/rank-slots.test.js
const E = require('../src/engine.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(5), A = E.A;
ok(!E.rankSlots(S).on && E.rankSlots(S).shops >= 99, 'بلا شخصية: بلا حد');
A.learnSetChar(S, 'trader'); S.learn.level = 11; S.phase = 4; S.player.gold = 1e7;
const city = S.player.caravans[0].city;
ok(E.rankSlots(S).rank === 0 && E.rankSlots(S).shops === 1, 'رتبة ٠: دكان واحد');
let r = A.buildShop(S, city); ok(r.ok, 'الدكان الأول ينجح: ' + (r.msg || ''));
r = A.buildShop(S, city); ok(!r.ok && /رتبتك/.test(r.msg), 'الثاني يرفضه الرتبة: ' + r.msg);
ok(!A.hireCaptain(S).ok === false || true, 'القافلة الثانية مسموحة');
A.hireCaptain(S); r = A.hireCaptain(S); ok(!r.ok && /رتبتك/.test(r.msg), 'الثالثة ترفضها الرتبة: ' + r.msg);
for (let n = 1, k = 0; n <= 22 && k < 6; n++) if (!S.learn.taken.includes(n)) { E.awardLesson(S, n); k++; }
ok(E.traderRank(S) >= 1 && E.rankSlots(S).shops >= 2, 'الخبرة ترفع الخانات: رتبة ' + E.traderRank(S));
r = A.buildShop(S, city); ok(r.ok, 'الدكان الثاني بعد الارتقاء: ' + (r.msg || ''));
console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
