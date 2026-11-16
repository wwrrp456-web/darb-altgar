'use strict';
// بصمة 360 يوماً (3 بذور) للسلوك القديم: S.learn و L.eq والذهب يومياً؛ تُلتقط قبل حزمة 030 وتُقارَن بها حين BROKER.on=false (SC-005)
const E = require('../src/engine.js'), A = E.A, crypto = require('node:crypto');
module.exports = function fingerprint() {
  const out = {};
  for (const seed of [1, 2, 3]) {
    if (E.BROKER) E.BROKER.on = false;
    const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 7; S.noShocks = true; S.player.gold = 5000;
    const h = crypto.createHash('sha1'); let brokerDays = [];
    for (let d = 0; d < 360; d++) {
      E.tick(S, false);
      if (S.learn.eq && S.learn.eq.some(e => e.id === 'broker')) { brokerDays.push(S.day); const ev = S.learn.eq.find(e => e.id === 'broker'); h.update('B' + S.day + ':' + ev.dep + ':' + ev.pct); S.learn.eq = []; }
      S.pause = false; h.update(S.day + ':' + Math.round(S.player.gold * 100) + ':' + JSON.stringify(S.learn.ex) + ';');
    }
    h.update(JSON.stringify(S.learn)); h.update(Object.keys(S).sort().join(','));
    out[seed] = { hash: h.digest('hex'), brokerDays, keys: Object.keys(S).sort() };
  }
  return out;
};
if (require.main === module) console.log(JSON.stringify(module.exports(), null, 1));
