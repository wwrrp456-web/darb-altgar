// كل مكوّن في أي وصفة تصنيع يُباع في سوق واحد على الأقل (لا يتورط اللاعب بمكوّن لا يوجد): node test/recipes-available.test.js
const E = require('../src/engine.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(3);
for (const k in E.RECIPES) {
  const miss = Object.keys(E.RECIPES[k].inp).filter(g => !S.order.some(id => E.sells(S.cities[id], g)));
  ok(!miss.length, 'وصفة ' + E.RECIPES[k].name + ' (' + Object.keys(E.RECIPES[k].inp).map(g => E.GD[g].name).join(' + ') + ')' + (miss.length ? ' ينقصها في الأسواق: ' + miss.join() : ''));
}
ok(E.RECIPES.leather.inp.hide >= 1 && E.RECIPES.leather.inp.salt >= 1, 'المدبغة: جلد خام + ملح');
ok(E.RECIPES.soap.inp.oliveoil >= 1, 'الصابون: زيت زيتون');
ok(S.order.some(id => E.sells(S.cities[id], 'hide')) && S.order.every(id => !E.sells(S.cities[id], 'hide') || S.cities[id].makes.some(h => E.BREEDS.some(b => b.id === h))), 'الجلد الخام يُباع في مدن المواشي المسمّاة فقط');
console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
