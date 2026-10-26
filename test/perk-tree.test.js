'use strict';
// شجرة المزايا: النفوذ يُصرف على ثلاثة مستويات فيؤثر فعلاً في المحرك؛ والخبرة تتراكم رتبة ولا تُصرف.
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const fresh = () => { const S = E.newGame(3); A.learnSetChar(S, 'trader'); const L = S.learn; L.secrets = []; L.csec = []; L.cards = []; L.tab = []; L.mj = { seen: {}, baraka: 0 }; for (const id in S.bosses) S.bosses[id].lore = 0; return S; };
{ const S = fresh(), L = S.learn; const base = E.perkMul(S, 'customs');
  assert(!A.buyPerk(S, 'customs').ok, 'بلا نقاط لا شراء');
  L.cards = Array.from({ length: 30 }, (_, i) => 'c' + i); // نفوذ كافٍ
  const have = E.pointsLeft(S, 'infl'); assert(have >= 150, 'نفوذ من الجانبية: ' + have);
  const r1 = A.buyPerk(S, 'customs'); assert(r1.ok, r1.msg); assert(Math.abs(E.perkMul(S, 'customs') - base * 0.95) < 1e-9, 'خصم الجمارك فعلاً');
  assert.equal(E.pointsLeft(S, 'infl'), have - 150, 'خُصم الثمن من النفوذ'); assert.equal(E.perkTier(S, 'customs'), 1);
  L.cards = Array.from({ length: 300 }, (_, i) => 'c' + i);
  assert(A.buyPerk(S, 'customs').ok); assert(A.buyPerk(S, 'customs').ok); assert(!A.buyPerk(S, 'customs').ok, 'حد 3 مستويات'); assert(Math.abs(E.perkMul(S, 'customs') - base * 0.85) < 1e-9, 'المستوى الثالث 15٪');
  assert(!A.buyPerk(S, 'nope').ok, 'ميزة غير معروفة');
  const T = E.load(E.save(S)); assert.equal(E.perkTier(T, 'customs'), 3, 'تبقى بعد الحفظ'); assert(Math.abs(E.perkMul(T, 'customs') - base * 0.85) < 1e-9, 'أثرها يبقى بعد التحميل'); assert.equal(T.learn.pts.spent.infl, 150 + 300 + 600); }
{ const S = fresh(), L = S.learn; assert.equal(E.traderRank(S), 0); L.taken = Array.from({ length: 22 }, (_, i) => i + 1);
  const xp = E.pointsEarned(S).xp; assert.equal(E.traderRank(S), Math.min(E.RANK_MAX, Math.floor(xp / E.XP_PER_RANK)), 'الرتبة من الخبرة المتراكمة');
  L.pts.spent.xp = 99999; assert.equal(E.traderRank(S), Math.min(E.RANK_MAX, Math.floor(xp / E.XP_PER_RANK)), 'الخبرة لا تُصرف: الرتبة لا تنقص'); }
console.log('Perk tree: influence is spent on 3 tiers with real effect, persisted; experience builds rank and is not spent: PASS');
