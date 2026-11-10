'use strict';
// محاكاة حتمية صغيرة لقياس 035أ: حفظ متقدم + عمّال بأيام مختلفة + مدير ممتلك على مصنع؛ تُستعمل في skill.test.js وأداة القياس
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const E = require('../../src/engine.js');
const fx = n => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/' + n + '.json'), 'utf8')).raw;
function load(name = 'autopilot-23') { const r = E.loadChecked(fx(name)); if (!r.ok) throw Error(r.why); return r.S; }
/* يضيف طاقماً متنوعاً الأيام في كل مدينة لك فيها ممتلكات (بذات حقول التوظيف الحقيقية)، فتتحرك الدرجات والتلف */
function rich(S) {
  for (const city of Object.keys(S.player.props)) { const pr = S.player.props[city]; pr.staff = pr.staff || [];
    for (const [role, days] of [['seller', 30], ['seller', 100], ['seller', 5], ['keeper', 20], ['keeper', 90], ['farmer', 60]]) pr.staff.push({ id: S.nextId++, role, days, late: 0, free: 0 }); }
  return S;
}
function run(S, n) { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } return S; }
const hash = S => crypto.createHash('sha256').update(E.save(S)).digest('hex').slice(0, 16);
/* أمين منطقة بتفويض كامل ودكان بأصناف راكدة ومخزن فيه بدائل: يحرّك التدوير وبيع الراكد والتعبئة والتسعير (035ب) */
function withSteward(S) {
  const city = Object.keys(S.player.props).find(c => S.cities[c] && S.player.props[c].shops.length), pr = S.player.props[city];
  pr.mgr = { rank: 3, lv: 2, id: S.nextId++, wage: 40, days: 200, span: 6, since: S.day - 200, audit: S.day, late: 0, policy: { pay: false, report: true, restock: true, pricing: true, rotate: true, sellStale: true, herd: false, minPrice: { sellStale: 1, herd: 1 }, limit: 400, every: 'daily' } };
  pr.whs = Math.max(pr.whs || 0, 1); pr.store = pr.store || {}; for (const g of ['wheat', 'dates', 'wool', 'sugar', 'honey']) pr.store[g] = 80; pr.basis = pr.basis || {};
  for (const sh of pr.shops) for (const it of sh.items) { it.idleDays = 20; it.lastSold = 0; }
  if (!pr.shops[0].items.length) pr.shops[0].items.push({ g: 'wool', price: 1.4, auto: true, carry: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 20 });
  return S;
}
module.exports = { E, fx, load, rich, run, hash, withSteward };
