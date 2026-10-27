// قفل الميزات بالدروس: node test/lesson-lock.test.js
const E = require('../src/engine.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(5), A = E.A;
ok(E.lessonLock(S, 'shop') === null, 'بلا شخصية: لا قفل');
A.learnSetChar(S, 'trader');
S.learn.level = 3; S.phase = 4; S.player.gold = 1e6;
const c = Object.keys(S.cities)[0];
let r = A.buildShop(S, S.player.caravans[0].city || c);
ok(!r.ok && /المعهد/.test(r.msg), 'الدكان مقفل قبل المستوى ٧: ' + r.msg);
ok(!A.signPact(S, c, 'exclusive').ok && /المعهد/.test(A.signPact(S, c, 'exclusive').msg), 'الشراكة مقفلة');
ok(!A.hireGuard(S, S.player.caravans[0].id).ok, 'الحراس مقفلون قبل ٥');
S.learn.level = 7;
r = A.buildShop(S, S.player.caravans[0].city);
ok(!/المعهد/.test(r.msg || ''), 'عند المستوى ٧ لا يمنعه القفل');
S.learn.level = 11;
ok(E.lessonLock(S, 'factory') === null, 'بعد التخرج لا قفل');
console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
