// اختبارات العملات والصرف وأساس التكلفة والعروض: node test/currency.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, t) => Math.abs(a - b) <= (t || 1e-6) * Math.max(1, Math.abs(b));
// ١. المحافظ والخاصية gold
let S = E.newGame(11);
ok(S.player.wallet.sar === 800 && S.player.wallet.usd === 0 && S.player.wallet.au === 0, 'يبدأ بـ ٨٠٠ ريال');
ok(near(S.player.gold, 800), 'P.gold = مجموع الريال المعادل');
ok(!('gold' in JSON.parse(E.save(S)).player), 'gold لا يُسلسَل');
// ٢. الصرافة
S.player.wallet.sar = 1000;
const nw0 = E.netWorth(S);
let r = A.exchange(S, 'sar', 'usd', 375);
ok(r.ok, 'تحويل ريال إلى دولار'); const usd = S.player.wallet.usd;
ok(near(usd, 375 * (1 - 0.01) / S.fx.usd), 'الدولار المستلم = القيمة − رسم ١٪ (' + usd.toFixed(2) + ')');
ok(near(S.player.wallet.sar, 625), 'الريال خُصم');
ok(near(E.netWorth(S), nw0 - 375 * 0.01), 'الثروة تنقص بالرسم فقط');
ok(!A.exchange(S, 'usd', 'usd', 1).ok && !A.exchange(S, 'au', 'sar', 5).ok, 'رفض نفس العملة أو رصيد غير كافٍ');
A.exchange(S, 'sar', 'au', 300); ok(S.player.wallet.au > 0.9 && S.player.wallet.au < 1, 'ذهب ٣٠٠ ريال ≈ ١ غرام ناقص رسم ١٫٥٪: ' + S.player.wallet.au.toFixed(3));
// ٣. الشراء بعملة السوق وتحويل تلقائي
S = E.newGame(12); const car = S.player.caravans[0];
S.player.wallet = { sar: 2000, usd: 0, au: 0 };
car.city = 'cairo'; S.ctxCur = 'usd';
const sar0 = S.player.wallet.sar; const q = A.buy(S, 1, 'wheat', 20);
ok(q.ok && S.player.wallet.sar < sar0 && S.player.wallet.usd === 0, 'الشراء بالدولار بلا رصيد دولار يحوّل من الريال تلقائياً');
const spent = sar0 - S.player.wallet.sar, cost = car.basis.wheat.c;
ok(spent > cost && spent < cost * 1.03, 'الخصم = التكلفة + رسم تحويل (' + spent.toFixed(1) + ' مقابل ' + cost.toFixed(1) + ')');
// ٤. المبيعات تدخل بعملة المدينة
S = E.newGame(13); S.player.wallet = { sar: 0, usd: 0, au: 0 }; S.player.caravans[0].city = 'riyadh'; S.player.caravans[0].cargo = { dates: 10 };
A.sell(S, 1, 'dates', 10); ok(S.player.wallet.sar > 0 && S.player.wallet.usd === 0, 'بيع في السعودية يدخل ريالاً');
S.player.caravans[0].city = 'xian'; S.player.caravans[0].cargo = { silk: 4 };
A.sell(S, 1, 'silk', 4); ok(S.player.wallet.usd > 0, 'بيع في الصين يدخل دولاراً');
// ٥. تطابق العرض مع التنفيذ
S = E.newGame(14); const cr = S.player.caravans[0]; S.player.wallet.sar = 5000;
const qb = E.quoteBuy(S, 'riyadh', 'dates', 30); const before = S.player.gold; const st0 = S.cities.riyadh.stock.dates;
A.buy(S, 1, 'dates', 30);
ok(near(before - S.player.gold, qb.cost, 1e-9) && cr.cargo.dates === qb.n, 'quoteBuy = الشراء الفعلي (' + qb.cost.toFixed(2) + ')');
ok(near(cr.basis.dates.c, qb.cost, 1e-9) && cr.basis.dates.q === 30, 'أساس التكلفة = ما دُفع');
const qs = E.quoteSell(S, 'riyadh', 'dates', 30, 1); const b2 = S.player.gold; const res = A.sell(S, 1, 'dates', 30);
ok(near(S.player.gold - b2, qs.net, 1e-9) && near(res.net, qs.net, 1e-9), 'quoteSell = البيع الفعلي');
ok(near(res.pl, qs.net - qb.cost, 1e-9), 'الربح المسجل = صافي البيع − التكلفة (' + res.pl.toFixed(2) + ')');
ok(S.player.trades[0].pl === res.pl && S.player.trades[0].side === 'sell', 'سجل الصفقات');
ok(!cr.basis.dates, 'الأساس يُصفَّر بعد بيع الكل');
// ٦. أساس التكلفة مع الإيداع في المخزن والنهب
S = E.newGame(15); S.phase = 4; S.player.wallet.sar = 100000; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh');
S.player.caravans[0].city = 'riyadh'; A.buy(S, 1, 'dates', 20); const avg0 = E.avgCost(S.player.caravans[0].basis, 'dates');
A.toStore(S, 1, 'dates', 20); ok(near(E.avgCost(S.player.props.riyadh.basis, 'dates'), avg0, 1e-9) && !S.player.caravans[0].basis.dates, 'الأساس ينتقل للمخزن');
A.fromStore(S, 1, 'dates', 10); ok(near(E.avgCost(S.player.caravans[0].basis, 'dates'), avg0, 1e-9), 'ثم يعود للقافلة بنفس المتوسط');
// ٧. الجمارك ترفع الأساس
S = E.newGame(16); const c7 = S.player.caravans[0]; S.player.wallet.sar = 5000; A.buy(S, 1, 'dates', 30); const b0 = c7.basis.dates.c;
A.travel(S, 1, 'cairo'); while (c7.left > 0) E.tick(S);
ok(c7.basis.dates && c7.basis.dates.c > b0 * 0.95, 'أساس التكلفة يشمل الجمارك بعد الوصول (' + b0.toFixed(0) + ' ← ' + c7.basis.dates.c.toFixed(0) + ')');
// ٨. أسعار الصرف
S = E.newGame(17); let mnU = 9, mxU = 0, mnG = 1e9, mxG = 0; for (let i = 0; i < 600; i++) { E.tick(S); mnU = Math.min(mnU, S.fx.usd); mxU = Math.max(mxU, S.fx.usd); mnG = Math.min(mnG, S.fx.gold); mxG = Math.max(mxG, S.fx.gold); }
ok(mnU >= 3.5 && mxU <= 4.0 && mnG >= 180 && mxG <= 480 && mxG - mnG > 30, 'الصرف ضمن الحدود ويتحرك: دولار ' + mnU.toFixed(2) + '–' + mxU.toFixed(2) + ' ذهب ' + Math.round(mnG) + '–' + Math.round(mxG));
// ٩. تأثير الصرف على الثروة
S = E.newGame(18); S.player.wallet = { sar: 0, usd: 0, au: 10 }; const w0 = E.liquid(S); S.fx.gold *= 1.1; ok(near(E.liquid(S), w0 * 1.1, 1e-9), 'ارتفاع الذهب ١٠٪ يرفع ثروة محفظته ١٠٪');
// ١٠. معلومات السوق
S = E.newGame(19); const mi = E.marketInfo(S, 'riyadh', 1);
ok(mi.goods.length === E.GIDS.length && mi.present + mi.missing.length === mi.total, 'ملخص السوق متسق');
const wd = mi.goods.find(x => x.g === 'wheat'); ok(wd.afford > 0 && wd.canCar <= wd.carU, 'أقدر آخذ ≤ ما تتسع له القافلة');
S.player.wallet.sar = 1e6; const mi2 = E.marketInfo(S, 'riyadh', 1); ok(mi2.goods.find(x => x.g === 'iron').limit !== 'gold', 'سبب الحدّ يتغير بالذهب');
ok(mi.store.has === false && mi.goods.every(x => x.fitsStore === false), 'لا مخزن ← لا تكفي المخازن');
S.phase = 4; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const mi3 = E.marketInfo(S, 'riyadh', 1);
ok(mi3.store.has && mi3.store.cap === E.WH_CAP + E.SHELF_CAP && mi3.goods.some(x => x.fitsStore), 'بعد البناء تظهر سعة المخزن وتكفي بعض السلع');
ok(E.storeSummary(S).cap === mi3.store.cap, 'ملخص كل المخازن = سعة المدينة الوحيدة');
// ١١. خيارات البيع
const so = E.sellOptions(S, 'riyadh', 'dates', 30, 20); ok(so.length === S.order.length - 1 && so[0].profit >= so[so.length - 1].profit, 'sellOptions مرتبة بالربح');
ok(so.every(o => o.cur === E.curOf(o.country)) && so.find(o => o.country !== 'sa').customs > 0, 'عملة المدينة والجمارك');
// ١٢. ترحيل v2
const v2 = JSON.parse(E.save(E.newGame(20))); v2.ver = 2; v2.player.gold = 1234; delete v2.player.wallet; delete v2.fx; v2.player.caravans[0].cargo = { dates: 5 }; delete v2.player.caravans[0].basis;
const m = E.load(JSON.stringify(v2)); ok(m && m.ver === 3 && near(m.player.gold, 1234) && m.player.wallet.sar === 1234 && m.player.caravans[0].basis.dates.q === 5, 'ترحيل v2 يحفظ الرصيد والحمولة');
E.tick(m); ok(m.day === 1, 'لعبة مُرحَّلة تعمل');
// ١٣. مضاربة: شراء الذهب وبيعه ذهاباً وإياباً لا يربح بلا تقلب
S = E.newGame(21); S.player.wallet = { sar: 10000, usd: 0, au: 0 }; const g0 = E.liquid(S);
A.exchange(S, 'sar', 'au', 10000); A.exchange(S, 'au', 'sar', S.player.wallet.au);
const g1 = E.liquid(S); ok(near(g1, g0 * 0.985 * 0.985, 1e-9), 'الصرف ذهاباً وإياباً بنفس السعر يخسر الرسمين (٢٫٩٨٪): ' + Math.round(g0) + ' ← ' + Math.round(g1));
console.log(fails ? fails + ' فشل' : 'كل الاختبارات نجحت'); process.exit(fails ? 1 : 0);
