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
module.exports = { E, fx, load, rich, run, hash };
