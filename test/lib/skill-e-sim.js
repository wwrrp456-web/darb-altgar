'use strict';
// 035هـ: سيناريو حتمي بوكيل إقليم وأمينين في السعودية؛ يُستعمل لبصمة «المطفأ = ما قبل الحزمة» ولقياس التوازن بالبذور
const crypto = require('node:crypto');
function setup(E, seed = 5) {
  const A = E.A, S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 4; S.noShocks = true; S.noEvents = true; S.player.gold = 500000; S.player.wallet.sar = 500000;
  for (const c of ['riyadh', 'jeddah']) { if (!A.buildShop(S, c).ok) throw Error('shop'); S.player.props[c].mgr = { id: S.nextId++, rank: 3, lv: 2, wage: 40, days: 100, since: S.day - 100, audit: S.day, late: 0, policy: { pay: true, report: true, restock: true, pricing: false, limit: 0, every: 'daily' } }; A.hireFill && A.hireFill(S, c); }
  if (!A.hireAgent(S, 'sa').ok) throw Error('agent'); A.agentPolicy(S, 'sa', 1000, false); return S;
}
function run(E, S, n) { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; }
const hash = (E, S) => crypto.createHash('sha256').update(E.save(S)).digest('hex').slice(0, 16);
const worth = (E, S) => Math.round(E.netWorth(S));
module.exports = { setup, run, hash, worth };
