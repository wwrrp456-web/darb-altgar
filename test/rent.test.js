// بسطة ← دكان مؤجَّر ← شراء (محرك فقط): node test/rent.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const fresh = () => { const S = E.newGame(5); S.phase = 2; S.player.gold = 90000; return S; };
let S = fresh();
ok(!A.rentShop(E.newGame(5), 'riyadh', 'stall').ok, 'الإيجار مقفل قبل الطور ٢');
const r1 = A.rentShop(S, 'riyadh', 'stall'); ok(r1.ok, r1.msg);
const pr = S.player.props.riyadh, st = pr.shops[0];
ok(E.shKind(st) === 'stall' && st.rent >= 1 && E.shItemsMax(st) === 2 && E.shCap(st) === E.STALL_CAP, 'البسطة: سعة وسلع أقل');
ok(E.sellerNeed(S, 'riyadh') === 1 && E.staffOf(S, 'riyadh').length === 1, 'البسطة تحتاج بائعاً واحداً');
ok(E.storeCap(S, 'riyadh') === E.STALL_CAP, 'سعة تخزين البسطة ٤٠');
{ const F = fresh(); ok(Math.abs(E.netWorth(S) - (E.netWorth(F) - (F.player.gold - S.player.gold))) < 1, 'المؤجَّر لا يُحسب أصلاً في الثروة'); }
ok(A.shopSetItem(S, 'riyadh', st.id, 'wheat', 1).ok && A.shopSetItem(S, 'riyadh', st.id, 'dates', 1).ok && !A.shopSetItem(S, 'riyadh', st.id, 'wool', 1).ok, 'البسطة تتسع لسلعتين فقط');
// الإيجار اليومي
const g0 = S.player.gold; E.tick(S); ok(S.player.led.exp.rent > st.rent * 3 - 1 && st.rentPaid > st.rent * 3, 'يُدفع الإيجار يومياً ويتراكم');
// ارتقاء
const up = A.upgradeStall(S, 'riyadh', st.id); ok(up.ok && E.shKind(st) === 'rent' && E.shItemsMax(st) === 4, 'الارتقاء إلى دكان مؤجَّر');
ok(E.sellerNeed(S, 'riyadh') === 1, 'الدكان المؤجَّر يحتاج بائعاً واحداً');
for (let i = 0; i < 100; i++) E.tick(S);
// الشراء بالخصم
const paid = st.rentPaid, n = pr.shops.length, price = Math.round(1500 * Math.pow(1.5, n - 1)), expect = Math.round(price - Math.min(0.4 * paid, 0.6 * price));
const gb = S.player.gold, by = A.buyShop(S, 'riyadh', st.id);
ok(by.ok && E.shKind(st) === 'own' && Math.abs((gb - S.player.gold) - expect) <= 1, 'الشراء بخصم ٤٠٪ من الإيجار (' + Math.round(gb - S.player.gold) + ' = ' + expect + ')');
ok(st.rent === undefined && E.netWorth(S) > 0, 'يصير ملكاً بلا إيجار');
ok(!A.buyShop(S, 'riyadh', st.id).ok, 'لا شراء لما تملكه');
// سقف الخصم ٦٠٪
const C = fresh(); A.rentShop(C, 'riyadh', 'shop'); const cs = C.player.props.riyadh.shops[0]; cs.rentPaid = 1e6; const cb = C.player.gold; A.buyShop(C, 'riyadh', cs.id);
ok(Math.abs((cb - C.player.gold) - Math.round(1500 * 0.4)) <= 1, 'الخصم لا يتجاوز ٦٠٪ من الثمن');
// الزعيم كمؤجِّر
const B = fresh(); E.bossOf(B, 'riyadh').trust = 60; const rb = A.rentShop(B, 'riyadh', 'shop', 'boss'), rp = A.rentShop(B, 'riyadh', 'shop', 'private');
const bs = B.player.props.riyadh.shops; ok(rb.ok && rp.ok && bs[0].landlord === 'boss' && bs[0].rent < bs[1].rent, 'إيجار الزعيم أرخص مع الثقة (' + bs[0].rent + ' < ' + bs[1].rent + ')');
const t0 = E.bossOf(B, 'riyadh').trust; for (let i = 0; i < 20; i++) E.tick(B); ok(E.bossOf(B, 'riyadh').trust > t0, 'الوفاء بإيجار الزعيم يرفع ثقته');
// التأخر والإخلاء
const D = fresh(); A.rentShop(D, 'riyadh', 'stall'); D.player.props.riyadh.shops[0].landlord = 'boss';
for (let i = 0; i < 7; i++) { D.player.wallet = { sar: 0, usd: 0, au: 0 }; E.tick(D); if (!D.player.props.riyadh.shops.length) break; }
ok(D.player.props.riyadh.shops.length === 0, 'يُخلى المكان بعد تأخّر الإيجار ٥ أيام');
ok(E.bossOf(D, 'riyadh').trust <= -9, 'إخلاء مؤجِّر الزعيم يخسّره الثقة');
// الترك
const V = fresh(); A.rentShop(V, 'riyadh', 'shop'); const vid = V.player.props.riyadh.shops[0].id;
ok(A.vacateShop(V, 'riyadh', vid).ok && V.player.props.riyadh.shops.length === 0, 'ترك المكان المؤجَّر');
const V2 = fresh(); A.buildShop(V2, 'riyadh'); ok(!A.vacateShop(V2, 'riyadh', V2.player.props.riyadh.shops[0].id).ok, 'لا إخلاء لما تملكه');
// الحد الأقصى والحفظ القديم
const M = fresh(); const lim = E.shopLimit(M.cities.riyadh); let c = 0; while (A.rentShop(M, 'riyadh', 'stall').ok && c < 20) c++; ok(c === lim, 'المؤجَّر يُحسب ضمن حد الدكاكين (' + c + ')');
const O = fresh(); A.buildShop(O, 'riyadh'); const raw = JSON.parse(E.save(O)); delete raw.player.props.riyadh.shops[0].kind; const O2 = E.load(JSON.stringify(raw));
ok(E.shKind(O2.player.props.riyadh.shops[0]) === 'own' && E.netWorth(O2) >= 1000, 'دكاكين الحفظ القديم تبقى ملكاً');
const T = E.load(E.save(S)); ok(E.shKind(T.player.props.riyadh.shops[0]) === 'own', 'الحفظ والتحميل');
const st2 = E.stressTest({ seeds: 8, days: 100, bot: true }); ok(st2.nan === 0, 'الضغط بلا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
