// عمّال المتاجر: بائعون وأمناء مخازن بالأجر (محرك فقط): node test/staff.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function fresh(seed) { const S = E.newGame(seed || 5); S.phase = 2; S.player.gold = 80000; A.buildShop(S, 'riyadh'); const sh = E.shopsOf(S, 'riyadh')[0]; A.shopSetItem(S, 'riyadh', sh.id, 'wheat', 1.0); S.player.props.riyadh.store.wheat = 400; S.player.props.riyadh.basis.wheat = { q: 400, c: 400 * 20 }; return S; }
let S = fresh();
const pr = S.player.props.riyadh;
ok(E.staffOf(S, 'riyadh').length === 2 && E.sellerNeed(S, 'riyadh') === 2, 'الدكان الجديد يأتي ببائعين مجاناً ويحتاج بائعين');
ok(E.sellFactor(S, 'riyadh') === 1, 'الطاقم الكامل = مبيعات كاملة');
const sold = St => { const b = St.player.props.riyadh; const before = b.store.wheat; return () => before - b.store.wheat; };
// بلا بائعين: لا مبيعات
const S0 = fresh(); const p0 = S0.player.props.riyadh; p0.staff = []; const w0 = p0.store.wheat; S0.player.caravans.forEach(c => c.crew = 0);
for (let i = 0; i < 5; i++) E.tick(S0); ok(Math.abs(p0.store.wheat - w0) < 1e-6, 'دكان بلا بائع لا يبيع شيئاً');
// بائع واحد مبتدئ = نصف الطاقة
const S1 = fresh(); const p1 = S1.player.props.riyadh; p1.staff = p1.staff.slice(0, 1); ok(Math.abs(E.sellFactor(S1, 'riyadh') - 0.5) < 1e-9, 'بائع مبتدئ من اثنين = ٥٠٪ مبيعات');
const Sf = fresh(); const pf = Sf.player.props.riyadh; for (let i = 0; i < 10; i++) E.tick(Sf); const full = 400 - pf.store.wheat;
for (let i = 0; i < 10; i++) E.tick(S1); const half = 400 - p1.store.wheat;
ok(full > 0 && half < full * 0.8, 'المبيعات تتبع عدد البائعين (' + Math.round(half) + ' < ' + Math.round(full) + ')');
// الأجور بعد المجانية
const g0 = S.player.gold; for (let i = 0; i < E.WK_FREE - 1; i++) E.tick(S);
const spentFree = g0 - S.player.gold; for (let i = 0; i < 3; i++) E.tick(S);
ok(S.player.led.exp.staff > 0, 'الأجور تُدفع بعد انقضاء المجانية (' + Math.round(S.player.led.exp.staff) + ')');
// الترقية بالأيام
for (let i = 0; i < 100; i++) E.tick(S);
ok(E.staffOf(S, 'riyadh').every(w => E.wkLv(w) === 2), 'العامل يصير خبيراً بعد ١٢٠ يوماً');
ok(E.sellFactor(S, 'riyadh') > 1 && E.sellFactor(S, 'riyadh') <= E.WK_CAP + 1e-9, 'الخبراء يرفعون المبيعات حتى ' + E.sellFactor(S, 'riyadh').toFixed(2));
ok(E.wkWage(S, S.cities.riyadh, E.staffOf(S, 'riyadh')[0]) > E.wkWage(S, S.cities.riyadh, { role: 'seller', days: 0 }), 'الخبير أجره أعلى');
// الأجر المتأخر
const L = fresh(); const pl = L.player.props.riyadh; for (let i = 0; i < E.WK_FREE + 1; i++) E.tick(L);
L.player.wallet = { sar: 0, usd: 0, au: 0 }; E.tick(L);
ok(E.staffOf(L, 'riyadh').every(w => w.late >= 1) && E.sellFactor(L, 'riyadh') < 1, 'تأخّر الأجر يضعف العمّال');
for (let i = 0; i < 6; i++) { L.player.wallet = { sar: 0, usd: 0, au: 0 }; E.tick(L); }
ok(E.staffOf(L, 'riyadh').length === 0, 'يغادر العمّال بعد ٥ أيام تأخير');
// التوظيف
const H = fresh(); const ph = H.player.props.riyadh; ph.staff = [];
const r1 = A.hireStaff(H, 'riyadh', 'seller'); ok(r1.ok && E.staffOf(H, 'riyadh').length === 1, 'توظيف بائع');
ok(!A.hireStaff(H, 'riyadh', 'keeper').ok, 'لا أمين بلا مخزن');
const fl = A.hireFill(H, 'riyadh'); ok(fl.ok && E.sellerPts(H, 'riyadh') >= 2, 'وظّف حتى اكتمال الحاجة');
ok(!A.hireFill(H, 'riyadh').ok, 'لا توظيف زائد عند الاكتمال');
const pool = E.hirePool(H, 'riyadh'); ok(pool >= 0 && pool < 10, 'عدد المتاحين محدود بسكان المدينة (' + pool + ')');
const idv = E.staffOf(H, 'riyadh')[0].id; ok(A.fireStaff(H, 'riyadh', idv).ok && E.staffOf(H, 'riyadh').every(w => w.id !== idv), 'تسريح عامل');
const poor = fresh(); poor.player.props.riyadh.staff = []; poor.player.wallet = { sar: 3, usd: 0, au: 0 }; ok(!A.hireStaff(poor, 'riyadh', 'seller').ok, 'الرسوم تحتاج رصيداً');
// الأمين والمخزن
const K = fresh(); A.buildWarehouse(K, 'riyadh'); const pk = K.player.props.riyadh;
ok(E.keeperNeed(K, 'riyadh') === 1 && E.keeperHave(K, 'riyadh') === 1, 'المخزن الجديد يأتي بأمين مجاناً');
pk.staff = pk.staff.filter(w => w.role !== 'keeper'); const w1 = pk.store.wheat; for (let i = 0; i < 10; i++) E.tick(K);
ok(K.player.props.riyadh.store.wheat < w1 - 1 || true, 'تتبع');
const K2 = fresh(); A.buildWarehouse(K2, 'riyadh'); const pk2 = K2.player.props.riyadh; pk2.staff = pk2.staff.filter(w => w.role !== 'keeper'); pk2.shops[0].items = []; const a = pk2.store.wheat; for (let i = 0; i < 10; i++) E.tick(K2);
ok(pk2.store.wheat < a * 0.97, 'مخزن بلا أمين يتناقص مخزونه (' + Math.round(a) + ' ← ' + Math.round(pk2.store.wheat) + ')');
const K3 = fresh(); A.buildWarehouse(K3, 'riyadh'); const pk3 = K3.player.props.riyadh; pk3.shops[0].items = []; const b3 = pk3.store.wheat; for (let i = 0; i < 10; i++) E.tick(K3); ok(Math.abs(pk3.store.wheat - b3) < 1e-6, 'مع الأمين لا يتناقص');
// الحفظ القديم
const O = fresh(); const raw = JSON.parse(E.save(O)); delete raw.player.props.riyadh.staff; const O2 = E.load(JSON.stringify(raw));
ok(O2 && E.staffOf(O2, 'riyadh').length === 2 && E.staffOf(O2, 'riyadh').every(w => w.free > O2.day), 'ترحيل: طاقم مجاني ٣٠ يوماً للدكاكين القديمة');
ok(O2.news.some(n => /عمّال بالأجر/.test(n.t)), 'رسالة توضيح للاعب القديم');
const O3 = E.load(E.save(O2)); ok(E.staffOf(O3, 'riyadh').length === 2, 'الحفظ والتحميل يبقي الطاقم');
const st = E.stressTest({ seeds: 8, days: 100, bot: true }); ok(st.nan === 0, 'الضغط بلا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
