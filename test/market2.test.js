// المنتج الخاص لكل سوق: علاوة المسافة، حصة الزعيم، العقد الحصري، سمعة التاجر (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };

// ١) علاوة المسافة
const P = E.PREM;
ok(P.shanghai.porcelain === 1 && P.riyadh.perfume === 1, 'المدينة المنتِجة بلا علاوة');
ok(P.riyadh.wheat === 1 && P.riyadh.wood === 1 && P.xian.iron === 1, 'القمح والخامات بلا علاوة');
ok(P.jeddah.perfume > 1 && P.jeddah.perfume < P.shanghai.perfume, 'العلاوة تكبر بالبُعد: جدة < شنغهاي (عطور الرياض)');
ok(P.riyadh.silk > P.isfahan.silk && P.isfahan.silk > P.xian.silk, 'الحرير أغلى في الرياض من أصفهان ومن شيآن');
const maxP = Math.max(...Object.values(P).flatMap(o => Object.values(o))), minP = Math.min(...Object.values(P).flatMap(o => Object.values(o)));
ok(minP === 1 && maxP <= 1 + 0.25 + 1e-9, 'العلاوة بين صفر و' + (maxP - 1).toFixed(3));
const S = E.newGame(5);
ok(E.refPrice(S.cities.shanghai, 'perfume') > E.refPrice(S.cities.jeddah, 'perfume'), 'السعر المرجعي للعطور أعلى في شنغهاي من جدة');

// ٢) الرفّ لا يمتلئ وحده في المدينة غير المنتِجة
const T = E.newGame(7), far = T.cities.shanghai, cap = E.capG(far, 'perfume');
far.stock.perfume = 0; for (let i = 0; i < 30; i++) E.tick(T);
ok(far.stock.perfume < 0.4 * cap * 0.5, 'رفّ العطور في شنغهاي يمتلئ ببطء (' + far.stock.perfume.toFixed(1) + ' من ' + cap + ')');

// ٣) حصة الزعيم: لا تعمل قبل المستوى ٤
const L1 = E.newGame(11); A.learnSetChar(L1, 'trader'); L1.noLock = 1; L1.player.gold += 60000; L1.phase = 2;
const city = L1.cities.riyadh, g = city.sig, car = L1.player.caravans[0];
ok(g === 'perfume' && !E.keyOn(L1), 'قبل المستوى ٤ لا مفتاح');
ok(!E.quotaOn(L1, city, g) && E.quoteBuy(L1, 'riyadh', g, 30, null).n === Math.min(30, Math.floor(city.stock[g])), 'قبل المستوى ٤ لا حصة');
L1.learn.level = 4;
ok(E.keyOn(L1) && E.quotaOn(L1, city, g) && !E.quotaOn(L1, city, 'wheat'), 'من المستوى ٤: الحصة على المنتج الخاص وحده');
city.stock[g] = 5000; car.cargo = {}; car.carts = 20;
const bs = E.bossOf(L1, 'riyadh'); bs.trust = 0;
const day = E.quotaPerDay(L1, city), cap3 = day * E.QUOTA_DAYS;
ok(Math.abs(day - 28 * 1.3) < 1e-6, 'الحصة اليومية عند ثقة صفر = ' + day.toFixed(1));
const q = E.quoteBuy(L1, 'riyadh', g, 9999, null);
ok(q.n === Math.floor(cap3), 'العرض يُقصّ بالرصيد (' + q.n + ')');
const r = A.buy(L1, car.id, g, 9999);
ok(r.ok !== false && Math.floor(E.quotaLeft(L1, city)) === 0 || E.quotaLeft(L1, city) < 1, 'الشراء استهلك الرصيد كله');
const r2 = A.buy(L1, car.id, g, 5);
ok(r2.ok === false && /حصتك/.test(r2.msg), 'بعد النفاد: رفض برسالة الحصة (' + r2.msg + ')');
E.tick(L1); ok(Math.abs(E.quotaLeft(L1, city) - day) < 1, 'يتجدد الرصيد يومياً بمقدار الحصة');
bs.trust = 60; ok(E.quotaPerDay(L1, city) > day * 1.9, 'ثقة الزعيم ترفع الحصة (×' + (E.quotaPerDay(L1, city) / day).toFixed(2) + ')');
bs.trust = -50; ok(E.quotaPerDay(L1, city) < day * 0.4, 'الثقة السلبية تخفضها');
bs.trust = 0;
const w0 = E.quoteBuy(L1, 'riyadh', 'wheat', 500, null).n; ok(w0 >= 400, 'القمح وبقية السلع لا حصة عليها (' + w0 + ')');
// الحاكم بلا حدود
bs.ruler = 'player'; ok(E.quotaPerDay(L1, city) === Infinity && E.quotaLeft(L1, city) === Infinity, 'حاكم السوق بلا حصة');
bs.ruler = 'boss';
// عقد التوريد يضاعف 1.6
bs.trust = 40; L1.player.gold += 50000; ok(A.signPact(L1, 'riyadh', 'supply').ok, 'عقد توريد');
ok(Math.abs(E.quotaPerDay(L1, city) / (28 * 1.3 * (1 + 40 / 60)) - 1.6) < 1e-6, 'التوريد يضرب الحصة ×١٫٦');
A.breakPact(L1, 'riyadh'); bs.cd = 0; bs.trust = 40;

// ٤) العقد الحصري
const X = E.newGame(13); A.learnSetChar(X, 'trader'); X.noLock = 1; X.player.gold += 80000; X.phase = 2;
ok(/المستوى 4/.test(E.pactBlock(X, 'riyadh', 'exclusive') || ''), 'العقد الحصري مقفل قبل المستوى ٤');
X.learn.level = 4; E.bossOf(X, 'riyadh').trust = 10;
ok(/ثقة/.test(E.pactBlock(X, 'riyadh', 'exclusive') || ''), 'يحتاج ثقة ٢٥ (' + E.pactBlock(X, 'riyadh', 'exclusive') + ')');
E.bossOf(X, 'riyadh').trust = 30;
const base = E.quotaPerDay(X, X.cities.riyadh), pm = E.buyMul(X, X.cities.riyadh, 'perfume');
const sg = A.signPact(X, 'riyadh', 'exclusive'); ok(sg.ok, 'توقيع العقد الحصري: ' + (sg.msg || ''));
ok(Math.abs(E.buyMul(X, X.cities.riyadh, 'perfume') / pm - 1.06) < 1e-9 && Math.abs(E.buyMul(X, X.cities.riyadh, 'wheat') - E.buyMul(X, X.cities.riyadh) ) < 1e-9, 'علاوة ٦٪ على المنتج الخاص وحده');
ok(Math.abs(E.quotaPerDay(X, X.cities.riyadh) / base - 2) < 1e-9, 'الحصة اليومية مضاعفة');
ok(E.exclusiveAt(X, 'riyadh'), 'العقد مسجّل');
// المنافسون لا يشترون المنتج الخاص من المدينة
const ag = X.agents[0]; ag.city = 'riyadh'; ag.left = 0; ag.dest = null; ag.gold = 5000; ag.cargo = {};
const st0 = X.cities.riyadh.stock.perfume; X.cities.riyadh.stock.perfume = 400; X.cities.riyadh.idx.perfume = 0.8;
for (let i = 0; i < 6; i++) { X.agents.forEach(a => { if (a.city === 'riyadh' && !a.left) a.gold = 8000; }); E.tick(X); }
ok(X.agents.every(a => !(a.dest && a.cargo.perfume > 0 && a.from === 'riyadh')), 'لا تاجر آلي يحمل عطور الرياض أثناء العقد الحصري');
// ينتهي العقد بوفاء ويحسب في السمعة
const rp0 = E.reputation(X).parts.find(p => p.id === 'pacts').score;
for (let i = 0; i < 31; i++) E.tick(X);
ok(!E.exclusiveAt(X, 'riyadh'), 'انتهى العقد الحصري بعد ٣٠ يوماً');

// ٥) سمعة التاجر
const R = E.reputation(X);
ok(R.parts.length === 5 && R.parts.every(p => p.score >= 0 && p.score <= 100), 'خمسة أشرطة بين ٠ و١٠٠');
ok(R.total === Math.round(R.parts.reduce((a, p) => a + p.score, 0) / 5), 'المجموع متوسط متساوي الوزن');
ok(R.quality >= 35 && R.quality <= 80, 'الجودة المشتقة بين ٣٥ و٨٠ (' + R.quality + ')');
ok(E.reputation(X).parts.find(p => p.id === 'pacts').score > rp0 || X.player.rep.done >= 1, 'إتمام عقد يرفع شريط العقود');
const Y = E.newGame(21); A.learnSetChar(Y, 'trader'); Y.noLock = 1; Y.phase = 2; Y.player.gold += 50000; E.bossOf(Y, 'jeddah').trust = 40;
A.signPact(Y, 'jeddah', 'guard'); const c0 = E.reputation(Y).parts.find(p => p.id === 'pacts').score; A.breakPact(Y, 'jeddah');
ok(E.reputation(Y).parts.find(p => p.id === 'pacts').score < c0, 'فسخ عقد يخفض شريط العقود');
Y.zakat.due = true; Y.zakat.amount = 100; const z0 = E.reputation(Y).parts.find(p => p.id === 'zakat').score; A.zakatDefer(Y);
ok(E.reputation(Y).parts.find(p => p.id === 'zakat').score < z0, 'تأجيل الزكاة يخفض شريطها');
Y.player.famDebt.left = 0; ok(E.reputation(Y).parts.find(p => p.id === 'inst').score === 100, 'سداد دَين الجد = ١٠٠ في الأقساط');

// ٦) الحفظ والتحميل وترحيل القديم
const Z = E.load(E.save(X)); ok(Z && Z.player.rep && Z.mkt2 === 1, 'الحفظ والتحميل يبقي السمعة');
const old = JSON.parse(E.save(Y)); delete old.mkt2; delete old.player.rep; delete old.player.quota;
const Z2 = E.load(JSON.stringify(old));
ok(Z2 && Z2.mkt2 === 1 && Z2.news[0].t.includes('تغيّرت الأسواق'), 'ترحيل حفظ قديم برسالة توضيح');
ok(E.reputation(Z2).parts.length === 5, 'حفظ قديم بلا حقول يعمل');
// لاعب جديد بلا رسالة ترحيل
ok(!E.newGame(3).news.some(n => /تغيّرت الأسواق/.test(n.t)), 'اللعبة الجديدة بلا رسالة ترحيل');

// ٧) الاستقرار الاقتصادي
const st = E.stressTest({ seeds: 12, days: 100, bot: true });
ok(st.nan === 0 && st.summary.avgPlayerNW > 6000 && st.summary.avgPlayerNW < 16000, 'الضغط: لا NaN والثروة معقولة (' + Math.round(st.summary.avgPlayerNW) + ')');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت');
process.exit(fails ? 1 : 0);
