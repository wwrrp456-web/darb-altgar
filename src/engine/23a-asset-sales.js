/* تسعير الأصول، قراءة فقط. تنفيذ التصفية والورقة يضافان في دفعات23 التالية. */
const ASSET_SALE_FACTORS = { calm: 0.80, distressed: 0.65 };
function assetQuote(S, city, kind, id) {
  const c = S.cities[city], P = S.player, pr = P.props[city];
  const no = msg => ({ ok: false, msg });
  if (!c || !pr) return no('لا ممتلكات في هذه المدينة.');
  if (!['shop', 'warehouse'].includes(kind)) return no('هذا النوع غير متاح في هذه الدفعة.');
  let target = null, value = 0;
  if (kind === 'shop') {
    target = pr.shops.find(sh => sh.id === id);
    if (!target || shKind(target) !== 'own') return no('اختر دكاناً تملكه؛ المكان المستأجر لا يُباع.');
    if (target.endowed || lifeBooks(S).some(w => w.city === city && w.shop === id)) return no('هذا الأصل غير متاح للبيع.');
    value = 1000; // قيمة الدكان الحالية فيnetWorth، لا ثمن إعادة بنائه.
  } else {
    if (!(pr.whs > 0)) return no('لا مخزن تملكه هنا.');
    value = 800; // قيمة وحدة المخزن الحالية فيnetWorth.
  }
  const main = P.caravans.find(car => car.main) || P.caravans[0];
  if (main && main.left > 0) return no('انتظر وصول قافلتك الرئيسية قبل بيع الأصل.');
  if ((S.orders || []).some(order => order.from === city || order.to === city)) return no('أكمل عقد التوصيل المرتبط بهذه المدينة أولاً.');
  const dues = S.paymentDues || [], debt = bankDebt(S) > 0 || famDebtOn(S) || dues.some(d => d.amount > 0);
  const stranded = P.gold <= 150 && main && valueOf(holdings(main)) < 1 && passivePerDay(S) <= 0;
  const mode = debt || stranded ? 'distressed' : 'calm', factor = ASSET_SALE_FACTORS[mode], price = Math.floor(value * factor);
  const remainingShops = pr.shops.filter(sh => sh !== target);
  const removedWarehouses = kind === 'warehouse' ? 1 : Math.max(0, pr.whs - remainingShops.length);
  const remainingWarehouses = pr.whs - removedWarehouses;
  const capacityAfter = remainingWarehouses * WH_CAP + remainingShops.reduce((sum, sh) => sum + shCap(sh), 0);
  const rentDues = kind === 'shop' ? dues.filter(d => d.id === target.paymentDue && d.kind === 'rent') : [];
  return { ok: true, city, kind, id: target ? target.id : null, value, factor, mode, price,
    // مخازن ملازمة لبيع الدكان تُعرض منفصلة، ولا تختفي بلا ثمن.
    accompanyingWarehouses: removedWarehouses - (kind === 'warehouse' ? 1 : 0),
    accompanyingPrice: kind === 'shop' ? Math.floor(removedWarehouses * 800 * factor) : 0,
    capacityAfter, load: storeLoad(S, city),
    sharedStore: Object.entries(pr.store).filter(([, q]) => q > 0).map(([g, q]) => ({ g, q })),
    knownRentArrears: rentDues.reduce((sum, d) => sum + d.amount, 0),
    unknownRentArrears: !!(target && target.arrears && (!rentDues.length || rentDues.some(d => d.unknownPast))),
    note: 'تسعير الأصل فقط؛ صافي تصفية البضائع وأجور العاملين يُحسب قبل تنفيذ البيع.' };
}
