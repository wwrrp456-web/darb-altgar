// منافسة كبار التجار بالنفوذ والخبرة: node test/boss-challenge.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js');
const S = E.newGame(8); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { intro: 11, level: 11 }); S.phase = 2; E.ensureBosses && E.ensureBosses(S);
a(E.A.challenge(S, 'hail', 20).ok === false, 'بلا خبرة لا منازلة');
S.learn.taken = E.STAGES.map(x => x.n); const rank = E.traderRank(S); a(rank >= 3, 'رتبة بعد الدروس الأساسية: ' + rank);
const big = Object.keys(S.cities).find(id => E.bossRankNeed(S.cities[id]) > rank); a(big, 'مدينة أكبر من رتبتك');
a(!E.A.challenge(S, big, 20).ok, 'الزعيم الأكبر يحتاج رتبة أعلى');
const ok = Object.keys(S.cities).find(id => S.bosses[id] && E.bossRankNeed(S.cities[id]) <= rank);
const bs = S.bosses[ok], p0 = bs.p, l0 = E.pointsLeft(S, 'infl'), r = E.A.challenge(S, ok, 20); a(r.ok, r.msg);
a(bs.p > p0 + 4 && E.pointsLeft(S, 'infl') === l0 - 20, 'يرفع الحضور ويصرف النفوذ');
a(!E.A.challenge(S, ok, 1e6).ok, 'لا يصرف أكثر من المتاح');
const m = E.bossDayMul(S); a(m > 1, 'الخبرة تضاعف دخل النفوذ اليومي'); S.noLock = 1; a(E.bossDayMul(S) === 1, 'بلا وضع تعلّم لا مضاعف');
const L = E.load(E.save(S)); a(L.bosses[ok].backed === 20, 'الحفظ');
console.log('PASS boss challenge: rank gate, influence spend, daily multiplier');
