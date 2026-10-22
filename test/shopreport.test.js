// تقرير البائع و«جهّز دكانك» (محرك): node test/shopreport.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world() { const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 2; S.player.gold = 90000; const city = S.player.caravans[0].city; A.buildShop(S, city); const sh = E.shopsOf(S, city)[0], pr = S.player.props[city]; return { S, city, sh, pr }; }
{ const { S, city, sh } = world(); const r = A.shopQuick(S, city, sh.id); ok(r.ok && sh.items.length === 1 && sh.items[0].auto === true && Math.abs(sh.items[0].price - 1.05) < 1e-9, 'shopQuick يضيف أنسب سلعة بـ105٪ وتعبئة آلية'); }
{ const { S, city, sh, pr } = world(); A.shopSetItem(S, city, sh.id, 'wool', 1.05, true); const g = 'wool';
  pr.staff = []; ok(E.shopReport(S, city, sh.id)[0].st === 'nobody' && E.shopReport(S, city, sh.id)[0].fix === 'hire', 'بلا بائع: nobody ومعه إصلاح التوظيف');
  A.hireFill(S, city);
  sh.items[0].auto = false; pr.store[g] = 0; let r = E.shopReport(S, city, sh.id)[0]; ok(r.st === 'empty' && r.fix === 'auto', 'مخزن فارغ بلا تعبئة: empty ومعه تفعيل التعبئة');
  sh.items[0].auto = true; S.cities[city].stock[g] = 500; r = E.shopReport(S, city, sh.id)[0]; ok(['soon', 'wait'].includes(r.st), 'مخزن فارغ مع تعبئة: soon أو wait (' + r.st + ')');
  pr.store[g] = 60; sh.items[0].price = 1.9; sh.items[0].lastSold = 0; r = E.shopReport(S, city, sh.id)[0]; ok(r.st === 'high' && r.fix === 'price' && r.to >= 50 && r.to < 190 && /غالٍ/.test(r.msg), 'سعر مرتفع بلا مبيعات: high باقتراح ' + r.to + '٪');
  sh.items[0].price = 1.05; pr.basis = pr.basis || {}; pr.basis[g] = { q: 60, c: 60 * E.unitPrice(S.cities[city], g) * 1.5 }; r = E.shopReport(S, city, sh.id)[0]; ok(r.st === 'loss' && r.to > 105 && r.to <= 200, 'سعر أقل من التكلفة: loss ويرفع السعر إلى ' + r.to + '٪');
  pr.basis[g] = { q: 60, c: 60 * E.unitPrice(S.cities[city], g) * 4 }; r = E.shopReport(S, city, sh.id)[0]; ok(r.st === 'loss' && !r.fix && /قافلتك/.test(r.msg), 'تكلفة فوق أقصى سعر مسموح: يُنصح بالبيع بالقافلة بلا إصلاح مستحيل');
  pr.basis[g] = { q: 60, c: 60 * E.unitPrice(S.cities[city], g) * 1.5 };
  pr.basis[g] = { q: 60, c: 60 * E.unitPrice(S.cities[city], g) * 0.5 }; sh.items[0].lastSold = 7; r = E.shopReport(S, city, sh.id)[0]; ok(r.st === 'ok' && /بعتُ 7/.test(r.msg), 'بيع اليوم: ok برسالة الكمية');
  sh.items[0].lastSold = 0; r = E.shopReport(S, city, sh.id)[0]; ok(r.st === 'new', 'جاهز ولم يمضِ يوم: new');
  ok(A.shopAutoAll(S, city).ok === false, 'التعبئة الآلية مفعّلة فلا شيء يتغير');
  sh.items[0].auto = false; ok(A.shopAutoAll(S, city).ok && sh.items[0].auto, 'shopAutoAll يفعّلها');
}
{ // يستلم من قافلتي
  const { S, city, sh, pr } = world(); const car = S.player.caravans[0], g = 'wool'; A.shopSetItem(S, city, sh.id, g, 1.05, false, true); car.cargo = { [g]: 80 }; car.basis = { [g]: { q: 80, c: 800 } }; pr.store[g] = 10; car.left = 0;
  let r = E.shopReport(S, city, sh.id)[0]; ok(r.st !== 'empty' || /قافلتك/.test(r.msg), 'مع الاستلام من القافلة: التقرير لا يشكو من الفراغ');
  const moved = E.shopCarry(S, car); ok(moved === 1 && pr.store[g] === 60 && car.cargo[g] === 30, 'يستلم حتى هدف 60 فقط (من 10 إلى 60 ويبقى 30 في القافلة)');
  ok(pr.basis[g] && Math.abs(pr.basis[g].c / pr.basis[g].q - 10) < 1e-6, 'يُنقل متوسط التكلفة مع البضاعة');
  A.shopSetItem(S, city, sh.id, g, 1.05, false, false); car.cargo = { [g]: 50 }; pr.store[g] = 0; ok(!E.shopCarry(S, car) && pr.store[g] === 0, 'بلا الخيار لا يستلم شيئاً');
}
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
