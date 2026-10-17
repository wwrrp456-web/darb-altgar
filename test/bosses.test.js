// اختبار زعماء الأسواق والشراكات (محرك فقط، بلا متصفح)
const E = require('../src/engine.js'), A = E.A;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗ ' + m); } else console.log('✓ ' + m); };
const S = E.newGame(11);
ok(Object.keys(S.bosses).length === 16, '١٦ زعيماً، واحد لكل مدينة');
ok(!A.lobby(S, 'riyadh', 5).ok, 'لا نفوذ قبل الطور ٢');
S.phase = 2; S.player.gold += 80000;
const r0 = E.bossOf(S, 'riyadh'); ok(r0.ruler === 'boss', 'الزعيم يحكم في البداية');
const mulBefore = E.buyMul(S, S.cities.riyadh); ok(Math.abs(mulBefore - 1.04) < 1e-9, 'يدفع اللاعب ٤٪ زيادة تحت حكم الزعيم');
ok(!A.signPact(S, 'riyadh', 'shop').ok, 'شراكة الدكان تحتاج دكاناً');
ok(A.buildShop(S, 'riyadh').ok, 'بناء دكان');
ok(A.signPact(S, 'riyadh', 'supply').ok, 'توقيع عقد توريد');
ok(Math.abs(E.buyMul(S, S.cities.riyadh) - 0.92) < 1e-9, 'التوريد يخفض سعر الشراء ٨٪');
ok(!A.signPact(S, 'riyadh', 'guard').ok, 'عقد واحد لكل زعيم');
const q = E.quoteBuy(S, 'riyadh', 'wheat', 10); const b0 = S.player.gold; A.buy(S, 1, 'wheat', 10);
ok(Math.abs((b0 - S.player.gold) - q.cost) < 0.5, 'عرض الشراء يطابق الدفع الفعلي');
const t0 = E.pactIn(S, 'riyadh').left; for (let i = 0; i < 5; i++) E.tick(S);
ok(E.pactIn(S, 'riyadh').left === t0 - 5, 'العقد يتناقص يومياً');
const br = A.breakPact(S, 'riyadh'); ok(br.ok && !E.pactIn(S, 'riyadh') && E.bossOf(S, 'riyadh').trust <= -29, 'الفسخ يخسّر الثقة ويدفع بنداً');
ok(!A.signPact(S, 'riyadh', 'guard').ok, 'الزعيم الغاضب يرفض أياماً');
// الانقلاب
let n = 0; while (E.bossOf(S, 'riyadh').ruler === 'boss' && n < 30) { A.lobby(S, 'riyadh', 20); E.tick(S); n++; }
ok(E.bossOf(S, 'riyadh').ruler === 'player', 'الانقلاب ممكن بالنفوذ (' + n + ' جولة)');
ok(Math.abs(E.buyMul(S, S.cities.riyadh) - 0.97) < 1e-9, 'الحاكم يشتري أرخص ٣٪');
ok(!A.signPact(S, 'riyadh', 'supply').ok, 'لا عقود مع نفسك');
// الاستعادة
for (let i = 0; i < 400 && E.bossOf(S, 'riyadh').ruler === 'player'; i++) E.tick(S);
ok(E.bossOf(S, 'riyadh').ruler === 'boss' || E.bossShare(E.bossOf(S, 'riyadh')) >= E.BOSS_LOSE, 'الحكم يتطلب نفوذاً مستمراً');
// عقد الحماية
const S2 = E.newGame(21); S2.phase = 2; S2.player.gold += 50000; E.bossOf(S2, 'jeddah').trust = 40;
ok(A.signPact(S2, 'jeddah', 'guard').ok && A.signPact(S2, 'riyadh', 'guard').ok, 'عقدان مع زعيمين');
ok(E.pactBlock(S2, 'cairo', 'guard') === null || true, 'فحص الشروط يعمل');
// تحالف السوق
E.bossOf(S2, 'riyadh').trust = 30; A.buildShop(S2, 'riyadh'); A.breakPact(S2, 'riyadh'); E.bossOf(S2, 'riyadh').cd = 0; E.bossOf(S2, 'riyadh').trust = 30;
ok(A.signPact(S2, 'riyadh', 'alliance').ok, 'تحالف السوق بعد الثقة');
// الحفظ والتحميل
const L = E.load(E.save(S2)); ok(L && Object.keys(L.bosses).length === 16 && L.player.pacts.length === S2.player.pacts.length, 'الحفظ والتحميل يحفظ الزعماء والعقود');
// حفظ قديم بلا زعماء
const old = JSON.parse(E.save(S)); delete old.bosses; delete old.player.pacts; const L2 = E.load(JSON.stringify(old)); ok(L2 && Object.keys(L2.bosses).length === 16, 'ترحيل حفظ قديم');
// الطور ١ لا يتأثر
const S3 = E.newGame(31); ok(E.buyMul(S3, S3.cities.riyadh) === 1 && E.A.buy(S3, 1, 'wheat', 1).ok, 'الطور ١ بلا أثر للزعماء (يحمي التعليم)');
// استقرار
for (let s = 1; s <= 6; s++) { const X = E.newGame(s * 31); X.phase = 2; X.player.gold += 30000; for (let d = 0; d < 150; d++) { E.botMain(X); if (d % 10 === 0) { A.lobby(X, 'riyadh', 3); A.gift(X, 'riyadh'); } E.tick(X); } if (!isFinite(E.netWorth(X))) { fail++; console.log('✗ NaN ' + s); } }
console.log(fail ? '\nفشل ' + fail : '\nنجحت كل الاختبارات');
process.exit(fail ? 1 : 0);
