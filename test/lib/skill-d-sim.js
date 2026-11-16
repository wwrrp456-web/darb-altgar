'use strict';
// 035د: مشهد حتمي لقافلة بقائد وحرس وطاقم وخط آلي؛ يُستعمل في skill-d.test.js وأداة القياس. الحزمة تُمرَّر (E) كي تُولَّد البصمة الأساسية من محرك ما قبل الحزمة
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
function mkScene(E, seed = 5, fixture = 'autopilot-23') {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/' + fixture + '.json'), 'utf8')).raw, r = E.loadChecked(raw); if (!r.ok) throw Error(r.why); const S = r.S, A = E.A, P = S.player;
  S.noShocks = true; P.gold = 400000; if (P.wallet) P.wallet.sar = 400000;
  const a = S.order.includes('jeddah') ? 'jeddah' : S.order[0], b = S.order.includes('riyadh') ? 'riyadh' : S.order[1];
  A.hireCaptain(S, 0); const car = P.caravans[P.caravans.length - 1]; car.route = { a, b, buyA: 'coffee', buyB: 'dates' }; car.carts = 2; car.guards = 3; car.crew = 6; car.supplies = 400; car.morale = 90;
  return { S, car, a, b };
}
function runDays(E, S, n) { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; }
const hashOf = (E, S) => crypto.createHash('sha256').update(E.save(S)).digest('hex').slice(0, 16);
module.exports = { mkScene, runDays, hashOf };
