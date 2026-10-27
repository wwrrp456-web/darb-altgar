// قرض الصديق: يُرد أو يضيع، بخبر ظاهر في المكتب، ويضيف نفوذاً وخبرة: node test/friend-loan.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js');
const S = E.newGame(8); E.A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11 }); S.player.wallet.sar = 20000;
const p0 = E.pointsEarned(S);
S.learn.eq = [{ id: 'friend', day: S.day, type: 'secure', amt: 1000 }];
const r = E.A.eventChoice(S, 'yes'); a(r.ok, r.msg);
const p1 = E.pointsEarned(S); a(p1.infl > p0.infl && p1.xp > p0.xp, 'الإقراض يضيف نفوذاً وخبرة');
a(S.player.loansOut.length === 1 && S.learn.loans.given === 1, 'القرض مسجّل');
S.day += 31; const g0 = S.player.gold; E.babEventDay(S);
a(S.player.loansOut.length === 0 && S.learn.loans.repaid === 1, 'القرض سُدِّد');
a(Math.abs(S.player.gold - g0 - 1000) < 1e-6, 'عاد أصل المبلغ فقط بلا زيادة (قرض حسن لا ربا)');
a(S.learn.fbq.length === 1 && S.learn.fbq[0].ok === 1, 'خبر السداد ينتظر في المكتب');
const p2 = E.pointsEarned(S); a(p2.infl > p1.infl && p2.xp > p1.xp, 'السداد يضيف مكافأة أكبر');
a(E.A.friendSeen(S).ok && S.learn.fbq.length === 0, 'الإغلاق يمسح الخبر');
const L = E.load(E.save(S)); a(L.learn.loans.repaid === 1, 'الحفظ يحفظ العدّاد');
console.log('PASS friend loan: given/repaid rewards and office notice');
