// الإنجازات الأربعون: node test/achievements.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const L = E.ACHD.LIST; ok(L.length === 40 && new Set(L.map(a => a.id)).size === 40 && L.filter(a => a.hid).length === 9, '40 إنجازاً، 9 مخفية');
ok(L.every(a => a.name && a.desc && ['b', 's', 'g'].includes(a.tier) && E.ACHD.CATS.includes(a.cat)), 'بيانات كاملة لكل إنجاز');
const covered = new Set(Object.keys(E.ACH_CHECK).concat(['trade_first', 'profit_first', 'profit_twenty', 'haggle_read', 'country_two', 'herd_arrival', 'insured_return', 'farm_first', 'first_birth', 'hybrid_first', 'stable_star', 'rent_first', 'own_shop', 'store_order', 'steady_staff', 'factory_first', 'manager_watch', 'zakat_on_time', 'learn_journal']));
ok(L.every(a => covered.has(a.id)), 'لكل إنجاز شرط مبرمج (' + L.filter(a => !covered.has(a.id)).map(a => a.id).join(',') + ')');
function world(seed) { const S = E.newGame(seed); E.achInit(S); A.learnSetChar(S, 'trader'); S.learn.level = 6; S.phase = 3; S.noShocks = true; S.player.gold = 200000; return S; }
const has = (S, id) => S.ach.got[id] != null;
// بلا achInit: لا شيء (معيار الضغط)
const B = E.newGame(5); for (let i = 0; i < 40; i++) E.tick(B); ok(!B.ach, 'بلا تهيئة: لا حالة إنجازات');
// الأحداث الأساسية
let S = world(41), car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; S.cities.riyadh.stock.wheat = 800;
A.buy(S, car.id, 'wheat', 5); ok(has(S, 'trade_first'), 'أول صفقة');
S.cities.riyadh.stock.wheat = 1; A.sell(S, car.id, 'wheat', 5); ok(has(S, 'profit_first'), 'هامش طيب عند بيع رابح');
S.ach.n.profit = 19; S.cities.riyadh.stock.wheat = 800; A.buy(S, car.id, 'wheat', 5); S.cities.riyadh.stock.wheat = 1; A.sell(S, car.id, 'wheat', 5); ok(has(S, 'profit_twenty'), 'حرفة راسخة عند العشرين');
// حالة
S.player.wallet.usd = 5; S.player.wallet.au = 1; E.achDay(S); ok(has(S, 'fx_three'), 'ثلاث محافظ');
S.player.trips = 1; E.achDay(S); ok(has(S, 'trip_first'), 'أول درب');
S.order.filter(id => S.cities[id].country === S.home).forEach(id => { S.ach.vis[id] = 1; }); E.achDay(S); ok(has(S, 'home_routes'), 'أسواق الديار');
E.COUNTRIES.forEach(c => { S.ach.vis[S.order.find(id => S.cities[id].country === c.id)] = 1; }); E.achDay(S); ok(has(S, 'world_five'), 'دروب العالم');
// الوصول
S = world(42); car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; E.achDay(S);
car.from = 'riyadh'; car.city = 'cairo'; car.left = 0; S.ach.prev[car.id] = 2; car.herd = { sheep: 6 }; car.herders = 1; car.insured = true; E.achDay(S);
ok(has(S, 'country_two') && has(S, 'herd_arrival') && has(S, 'insured_return'), 'الوصول: عبور حدود وقطيع وتأمين');
S = world(43); car = S.player.caravans[0]; car.city = 'cairo'; car.from = 'riyadh'; car.left = 0; S.ach.prev[car.id] = 2; car.herd = { sheep: 6 }; car.herders = 0; E.achDay(S); ok(!has(S, 'herd_arrival') && !has(S, 'insured_return') && has(S, 'country_two'), 'بلا راعٍ ولا تأمين: لا إنجازهما');
// المزرعة والتوالد والأجور
S = world(44); car = S.player.caravans[0]; car.herders = 3; S.cities.riyadh.stock.sheep = 400; car.city = 'riyadh'; car.left = 0; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildFarm(S, 'riyadh');
A.buy(S, car.id, 'sheep', 10, 'herd', 'f'); A.buy(S, car.id, 'sheep', 2, 'herd', 'm'); A.farmIn(S, car.id, 'sheep', 12); for (let i = 0; i < 200; i++) { E.tick(S); S.player.gold = Math.max(S.player.gold, 100000); }
ok(has(S, 'farm_first') && has(S, 'first_birth') && has(S, 'steady_staff'), 'مزرعة وولادة وأجر في موعده');
// الإيجار والدكان والمخزن
S = world(45); car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; car.cargo = { wheat: 20 }; S.cities.riyadh.stock.wheat = 300;
A.rentShop(S, 'riyadh', 'stall'); ok(has(S, 'rent_first'), 'بسطة البداية'); const sh = S.player.props.riyadh.shops[0]; if (A.buyShop(S, 'riyadh', sh.id).ok) ok(has(S, 'own_shop'), 'مفتاح الدكان'); else ok(false, 'شراء البسطة');
A.buildWarehouse(S, 'riyadh'); A.toStore(S, car.id, 'wheat', 10); ok(has(S, 'store_order'), 'مخزن مرتب');
// الزعماء
S = world(46); const ids = S.order.filter(id => S.cities[id].country !== S.cities[S.order[0]].country); S.bosses[S.order[0]].trust = 25; E.achDay(S); ok(has(S, 'boss_friend') && !has(S, 'boss_three'), 'ثقة السوق ولا ثلاث');
E.COUNTRIES.slice(0, 3).forEach(c => { S.bosses[S.order.find(id => S.cities[id].country === c.id)].trust = 30; }); E.achDay(S); ok(has(S, 'boss_three'), 'صحبة الدروب');
S.player.pacts.push({ city: 'riyadh', type: 'exclusive', left: 20 }); E.achDay(S); ok(has(S, 'pact_first') && has(S, 'pact_exclusive'), 'عقد وعقد حصري');
S.player.rep = { done: 1, broke: 0 }; E.achDay(S); ok(has(S, 'pact_done'), 'تمام العهد');
// السمعة والزكاة والدين
S = world(47); S.zakat = S.zakat || {}; S.zakat.paidN = 1; S.player.famDebt.paid = 100; E.achDay(S); ok(has(S, 'zakat_first') && has(S, 'debt_first'), 'زكاة أولى وخطوة وفاء');
S.player.famDebt.left = 0; S.player.famDebt.paid = S.player.famDebt.amt0; E.achDay(S); ok(has(S, 'debt_free'), 'وفاء الجد');
// التعلم والدفتر
S = world(48); S.learn.level = 2; E.achDay(S); ok(has(S, 'learn_first') && !has(S, 'learn_four'), 'أول حكمة');
S.learn.level = 5; E.achDay(S); ok(has(S, 'learn_four'), 'حساب الطريق'); S.learn.level = 11; E.achDay(S); ok(has(S, 'learn_grad'), 'رفيق سالم');
E.achNote(S, 'jtab', 'tasks'); E.achNote(S, 'jtab', 'clues'); ok(!has(S, 'learn_journal'), 'تبويبان لا يكفيان'); E.achNote(S, 'jtab', 'album'); ok(has(S, 'learn_journal'), 'صفحات الدفتر');
S.learn.lore = { riyadh: 1 }; S.learn.csec = ['jeddah']; E.achDay(S); ok(has(S, 'story_secret'), 'ذاكرة المكان');
// لا تكرار، والحفظ
const n0 = Object.keys(S.ach.got).length; E.achDay(S); ok(Object.keys(S.ach.got).length === n0 && S.ach.q.filter(x => x === 'learn_first').length === 1, 'لا تُمنح مرتين');
const Z = E.load(E.save(S)); ok(Z.ach && Z.ach.got.learn_first === S.ach.got.learn_first, 'الإنجازات تُحفظ');
// حفظ قديم يمنح ما تثبته الحالة فوراً
S = world(49); S.ach = null; S.player.trips = 3; E.achInit(S); E.achDay(S); ok(has(S, 'trip_first'), 'حفظ قديم: يُمنح ما تثبته حالته');
ok(L.filter(a => a.id !== 'x').length === 40, 'سلامة');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
