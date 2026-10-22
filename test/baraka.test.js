// رصيد البركة: ثلاث درجات تقلّل تعرّض القافلة لقطاع الطرق (محرك): node test/baraka.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = b => { const S = E.newGame(11); A.learnSetChar(S, 'trader'); S.learn.level = 5; S.learn.mj.baraka = b; return S; };
ok(E.BARAKA_TIERS.join() === '5,12,25', 'الدرجات عند 5 و12 و25');
[[0, 0, 0], [4, 0, 0], [5, 1, 0.04], [12, 2, 0.08], [25, 3, 0.12], [90, 3, 0.12]].forEach(([b, t, g]) => { const S = mk(b); ok(E.barakaTier(S) === t && Math.abs(E.barakaGuard(S) - g) < 1e-9, 'رصيد ' + b + ' ← درجة ' + t + ' وحماية ' + g); });
function rate(b, n) { const S = mk(b), car = S.player.caravans[0]; let blessed = 0; for (let i = 0; i < n; i++) { car.cargo = {}; car.herd = {}; const r = E.banditFight(S, car, S.order.find(id => id !== car.city), 1e9, 0.01); if (r && r.blessed) blessed++; } return blessed / n; }
ok(rate(0, 1500) === 0, 'بلا رصيد: لا نجاة بالبركة');
const r1 = rate(5, 4000), r3 = rate(25, 4000);
ok(r1 > 0.025 && r1 < 0.055, 'الدرجة الأولى ≈ 4٪ (' + r1.toFixed(3) + ')');
ok(r3 > 0.09 && r3 < 0.15, 'الدرجة الثالثة ≈ 12٪ (' + r3.toFixed(3) + ')');
{ const S = mk(25); S.noEvents = true; const car = S.player.caravans[0]; car.main = false; car.cargo = {}; let any = 0; for (let i = 0; i < 500; i++) { const r = E.banditFight(S, car, S.order.find(id => id !== car.city), 1e9, 0.01); if (r && r.blessed) any++; } ok(any === 0, 'قوافل الوكلاء وغير الرئيسية لا تنتفع'); }
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
