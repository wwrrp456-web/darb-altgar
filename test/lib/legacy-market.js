'use strict';
/* اختبارات آليات المواشي تشتري النوع العام (غنم، دجاج…) من أسواق بدء اللعبة؛ أما سياسة السوق الجديدة (لا نوع عام حيث يوجد صنف مسمّى) فيحرسها test/livestock-market.test.js.
   هذا المساعد يعيد الأنواع العامة إلى أسواق كل لعبة جديدة داخل الاختبار فقط. */
module.exports = E => {
  const ng = E.newGame, generic = Object.keys(E.BREED).filter(g => !E.GD[g].sp && !E.GD[g].hyb);
  E.newGame = (...a) => {
    const S = ng(...a);
    for (const id of S.order) { const c = S.cities[id]; for (const g of generic) if (!c.makes.includes(g)) { c.makes.push(g); c.stock[g] = E.capG(c, g) * 0.4; } }
    return S;
  };
  return E;
};
