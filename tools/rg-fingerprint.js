'use strict';
// بصمة ولادات المنافسين (028أ) 3 بذور × 400 يوم: تثبت أن إعادة هيكلة rgRng/rgPick في 030 بلا أثر. node tools/rg-fingerprint.js [مسار المحرك]
const crypto = require('node:crypto');
module.exports = function (E) {
  const out = {};
  for (const seed of [1, 2, 3]) {
    const S = E.newGame(seed); E.A.learnSetChar(S, 'trader'); S.learn.level = 9; S.noShocks = true; const h = crypto.createHash('sha1');
    for (let d = 0; d < 400; d++) { E.tick(S, false); S.pause = false; S.learn.eq = []; }
    h.update(JSON.stringify(S.rivals)); h.update(JSON.stringify(S.rivalGen)); h.update(JSON.stringify(S.rivalSeen)); out[seed] = { hash: h.digest('hex'), births: (S.rivalGen || {}).births };
  }
  return out;
};
if (require.main === module) { const E_ = require(process.argv[2] || '../src/engine.js'); console.log(JSON.stringify(module.exports(E_), null, 1)); }
