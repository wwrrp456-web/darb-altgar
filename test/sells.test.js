// توفر السلع والشراء عن بُعد (الوكيل): node test/sells.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(42);
ok(!E.sells(S.cities.riyadh, 'silk'), 'الحرير لا يُباع في الرياض');
ok(E.sells(S.cities.riyadh, 'wheat'), 'القمح يُباع في كل مكان');
ok(E.soldAt(S, 'silk').every(id => S.cities[id].country === 'cn' || S.cities[id].makes.includes('silk')), 'الحرير يُباع في مدن الصين/منتجيه فقط');
const r = A.buy(S, 1, 'silk', 1);
ok(r && r.ok === false, 'شراء الحرير في الرياض مرفوض: ' + (r && r.msg));
// البيع مسموح لأي سلعة
const cr = S.player.caravans[0]; cr.cargo.silk = 3;
ok(A.sell(S, 1, 'silk', 3).ok !== false, 'بيع الحرير في الرياض مسموح');
// الوكيل مقفل قبل الطور ٣
const cn = E.soldAt(S, 'silk')[0];
ok(!E.agentQuote(S, cn, 'silk', 5).ok, 'الوكيل مقفل قبل الطور ٣');
S.phase = 3; S.player.gold = 100000;
const q = E.agentQuote(S, cn, 'silk', 5);
console.log('   agentQuote:', JSON.stringify(q).slice(0, 200));
ok(!q.ok && q.why === 'nostore', 'الوكيل يشترط مخزناً');
A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh');
const q2 = E.agentQuote(S, cn, 'silk', 5);
ok(q2.ok && q2.fee > 0, 'الوكيل جاهز مع رسم ' + q2.fee);
const g0 = S.player.gold, r2 = A.agentBuy(S, cn, 'silk', 5);
ok(r2.ok !== false && S.orders.length === 1 && S.player.gold < g0, 'طلب الوكيل سُجّل ودُفع ثمنه');
for (let i = 0; i < 60 && S.orders.length; i++) E.tick(S);
ok(S.orders.length === 0, 'الطلب سُلّم بعد أيام السفر');
const l = E.load(JSON.stringify(Object.assign({}, S, { orders: undefined })));
ok(Array.isArray(l.orders), 'ترحيل الحفظ القديم يضيف orders');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
