// مصادر النفوذ والخبرة من النجاح الفعلي: node test/bonus-points.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js');
const S = E.newGame(8); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 2; for (let i = 0; i < 3; i++) E.tick(S);
const id = Object.keys(S.bosses)[0], bs = S.bosses[id], p0 = E.pointsEarned(S);
bs.p = 100; bs.b = 5; E.tick(S); a(bs.ruler === 'player', 'خُلع الزعيم');
const p1 = E.pointsEarned(S); a(p1.infl - p0.infl >= E.BONUS.ruler.infl, 'مكافأة خلع الزعيم نفوذاً');
bs.p = 100; bs.b = 5; for (let i = 0; i < 3; i++) E.tick(S); a(E.pointsEarned(S).infl === p1.infl, 'لا تتكرر مكافأة الخلع');
S.day += E.BONUS.hold.days; bs.p = 100; bs.b = 5; E.tick(S); a(E.pointsEarned(S).infl - p1.infl >= E.BONUS.hold.infl && E.pointsEarned(S).xp > p1.xp, 'مكافأة الحفاظ على الحكم نفوذاً وخبرة');
const x0 = E.pointsEarned(S).xp; let got = 0; for (let i = 0; i < 6; i++) if (E.bonusDeal(S, 5000)) got++; a(got === E.BONUS.deal.weekCap, 'سقف أسبوعي للصفقات الكبيرة'); a(E.pointsEarned(S).xp - x0 >= got * E.BONUS.deal.xp - 1, 'خبرة الصفقات');
a(!E.bonusDeal(S, 100), 'صفقة صغيرة لا تكافأ'); S.day += 7; a(E.bonusDeal(S, 5000), 'أسبوع جديد يعيد الحد');
a(E.load(E.save(S)).learn.bonus.infl > 0, 'الحفظ');
console.log('PASS bonus points');
