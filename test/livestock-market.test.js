'use strict';
// سياسة السوق: لا يُباع النوع العام (غنم، جمل، خيل…) في مدينة فيها صنف مسمّى من النوع نفسه؛ والمدن بلا صنف مسمّى تُبقيه حتى تُضاف أصنافها.
const assert = require('node:assert/strict'), E = require('../src/engine.js');
const S = E.newGame(3);
let generic = 0, withNamed = 0;
for (const id of S.order) {
  const c = S.cities[id];
  for (const g of c.makes) {
    if (!(E.BREED[g] && !E.GD[g].sp && !E.GD[g].hyb)) continue;
    generic++;
    assert(!c.makes.some(h => E.GD[h].sp === g), id + ' يبيع ' + g + ' العام وفيه صنف مسمّى منه');
  }
  for (const g of c.makes) if (E.GD[g].sp) withNamed++;
}
assert.equal(S.cities.riyadh.makes.includes('horse'), false, 'لا خيل عام في الرياض');
assert(S.cities.riyadh.makes.includes('arab_kuhaylan'), 'الخيل العربي الكحيلان في الرياض');
assert(S.cities.mecca.makes.includes('camel'), 'مكة بلا صنف مسمّى للجمال: يبقى العام موسوماً حتى تُضاف أصنافها');
assert.equal(generic, 17, 'عدد الحالات العامة المتبقية بلا صنف مسمّى');
console.log('Livestock markets sell named breeds, not generic species where a named breed exists: PASS');
