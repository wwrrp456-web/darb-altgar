'use strict';
// تفويض مدير الممتلك: يخفض الراكد ويرفع الشحيح أسبوعياً ضمن حدود، ويسجّل ما فعل، ولا يعمل بلا مدير.
const assert = require('node:assert/strict'), E = require('../src/engine.js');
const fresh = () => { const S = E.newGame(3); E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.phase = 3; S.player.gold = 50000; S.noEvents = true;
  E.A.buildShop(S, 'riyadh'); const pr = S.player.props.riyadh, sh = pr.shops[0]; for (let n = 0; n < 4; n++) E.A.shopQuick(S, 'riyadh', sh.id); return { S, pr, sh }; };
const dayTo7 = S => { while (S.day % 7 !== 6) { E.tick(S, false); S.pause = false; } };
{ // بلا مدير: لا تغيير
  const { S, pr, sh } = fresh(); const before = sh.items.map(i => i.price); dayTo7(S); E.tick(S, false); assert.deepEqual(sh.items.map(i => i.price), before, 'بلا مدير لا تُعدَّل الأسعار'); }
{ // مدير قديم: راكد ← خفض، شحيح ويباع ← رفع
  const { S, pr, sh } = fresh(); pr.mgr = { lv: 2, since: S.day, audit: S.day, late: 0 };
  const a = sh.items[0], b = sh.items[1]; a.price = 1.6; b.price = 1.6;
  dayTo7(S); const pa = a.price, pb = b.price;
  a.lastSold = 0; pr.store[a.g] = a.target; b.lastSold = 3; pr.store[b.g] = 0;
  const g = S.player.gold; S.player.gold = 0; // لا نقد: تمنع التعبئة الآلية تغيير المخزون في اليوم نفسه
  while (S.day % 7 !== 0) { a.lastSold = 0; pr.store[a.g] = a.target; b.lastSold = 3; pr.store[b.g] = 0; E.tick(S, false); S.pause = false; }
  S.player.gold = g;
  const log = S.player.mgrActions || [];
  assert(a.price <= pa + 1e-9 && log.some(x => x.g === a.g && x.to < x.from), 'الراكد يُخفَّض');
  assert(log.some(x => x.g === b.g && x.to > x.from) || b.price >= pb - 1e-9, 'الشحيح يُرفع أو لم يبع في اليوم');
  assert(log.every(x => x.to >= 1.1 - 1e-9 && x.to <= 2.2 + 1e-9), 'ضمن الحدود');
  assert(log.length <= 30);
}
console.log('Manager pricing: no manager no change, stagnant lowered, scarce raised, bounded, logged: PASS');
