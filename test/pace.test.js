// إيقاع السفر: زمن الانتظار الفعلي ومؤن السفر (عرض فقط، الاقتصاد وأيام العالم ثابتان): node test/pace.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, city) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.phase = 3; S.player.gold = 60000; const car = S.player.caravans[0]; if (city) car.city = city; return { S, car }; };
// المدى: 15 إلى 50 ثانية، والقريب في البلد نفسه قرابة 15–20
{ const { S } = mk(3); let mn = 99, mx = 0, dom = 0, domN = 0; S.order.forEach(a => S.order.forEach(b => { if (a === b) return; const s = E.paceSec(S, S.player.caravans[0], a, b, 3, false); mn = Math.min(mn, s); mx = Math.max(mx, s); if (S.cities[a].country === S.cities[b].country) { dom += s; domN++; } }));
  ok(mn >= 15 && mx <= 50, 'الانتظار بين ١٥ و٥٠ ثانية (' + mn.toFixed(1) + ' إلى ' + mx.toFixed(1) + ')');
  ok(dom / domN <= 30 && mx >= 40, 'القريب أقصر والبعيد بين المناطق أطول (متوسط داخل البلد ' + (dom / domN).toFixed(1) + ')'); }
// المستويات: أيام العالم والتكلفة الأساسية واحدة، والانتظار الفعلي يقصر
const run = lv => { const { S, car } = mk(3); const g0 = S.player.gold, r = A.travel(S, car.id, 'cairo', lv); return { S, car, r, spent: g0 - S.player.gold }; };
const L0 = run(0), L1 = run(1), L2 = run(2), Lu = (() => { const { S, car } = mk(3); const r = A.travel(S, car.id, 'cairo'); return { car, r }; })();
ok(L0.r.ok && L1.r.ok && L2.r.ok, 'السفر ينجح بكل المستويات');
ok(L0.car.left === L1.car.left && L1.car.left === L2.car.left && L0.car.total === L2.car.total, 'أيام الرحلة واحدة في كل المستويات (' + L0.car.left + ')');
ok(L0.car.pace.lv === 0 && L0.car.pace.units === 0 && Lu.car.pace.lv === 0, 'بلا مؤن سفر: المستوى العادي ولا استهلاك');
ok(L0.car.pace.sec > L1.car.pace.sec && L1.car.pace.sec > L2.car.pace.sec && L2.car.pace.sec >= L0.car.pace.sec * 0.6, 'الأسرع ينتظر أقل بحدّ أقصى للتوفير (' + L0.car.pace.sec + ' ← ' + L1.car.pace.sec + ' ← ' + L2.car.pace.sec + ')');
ok(Math.abs(L0.car.pace.ms * L0.car.total - L0.car.pace.sec * 1000) < L0.car.total, 'زمن اليوم الفعلي × الأيام = ثواني الرحلة');
ok(!L0.car.hungry && !L1.car.hungry, 'لا عقوبة ولا جوع بدون مؤن السفر');
const q = E.paceQuote(L0.S, L0.car, 'cairo', false);
ok(q === null || q.lv.length === 3, 'عرض الأسعار يعمل');
{ const { S, car } = mk(3); const qq = E.paceQuote(S, car, 'cairo', false); ok(qq.lv[1].units > 0 && qq.lv[2].units > qq.lv[1].units && qq.lv[0].units === 0, 'الوحدات تزيد مع المستوى (' + qq.lv.map(x => x.units).join('/') + ')');
  ok(L1.spent - L0.spent === qq.lv[1].cost && L2.spent - L0.spent === qq.lv[2].cost, 'الفرق في المال هو ثمن مؤن السفر فقط، والاقتصاد كما هو (' + (L1.spent - L0.spent) + ')');
  ok(E.packPrice(S, 'cairo') >= 7 && E.packPrice(S, 'cairo') <= 10, 'سعر موحّد تقريباً: ' + E.packPrice(S, 'cairo')); }
// المخزون: ما يُشترى يبقى للرحلات التالية
{ const { S, car } = mk(3); car.pack = 40; const g0 = S.player.gold; A.travel(S, car.id, 'cairo', 1); ok(car.pace.units > 0 && car.pack >= 40 - car.pace.units, 'يستهلك من مخزونك أولاً ولا يشتري الناقص (' + car.pack + ')');
  for (let i = 0; i < 40 && car.left > 0; i++) E.tick(S); ok(car.pace === null && car.pack >= 0, 'عند الوصول يُمحى إيقاع الرحلة ويبقى المخزون'); }
// قلة المال: ينزل لأعلى مستوى ممكن بلا إخفاق
{ let lows = [], bad = 0; [30, 45, 60, 75, 90, 120].forEach(g => { const { S, car } = mk(3); S.player.gold = g; const r = A.travel(S, car.id, 'cairo', 2); if (r.ok) { lows.push(car.pace.lv); if (S.player.gold < 0) bad++; } });
  ok(bad === 0 && lows.length > 0 && Math.min(...lows) < 2, 'قلة الرصيد تُنزل المستوى بدل أن تفشل (' + lows.join(',') + ')'); }
// القوافل الأخرى لا تتأثر
{ const { S, car } = mk(3); const c2 = S.player.caravans.find(c => !c.main); if (c2) { const r = A.travel(S, c2.id, 'cairo', 2); ok(!r.ok || !c2.pace, 'القوافل غير الرئيسية بلا إيقاع'); } else ok(true, 'لا قافلة ثانية'); }
// البحر: زمن اليوم كزمنه في البر لنفس الدرب، والأيام كما هي
{ const { S, car } = mk(4, 'jeddah'); S.day = 0; A.buyShip(S, 'jeddah'); const sd = E.seaPlan(S, car, 'mumbai'), land = E.tripDays(S, car, 'jeddah', 'mumbai'), r = A.sail(S, car.id, 'mumbai', 1);
  ok(r.ok && car.left === sd.days && car.pace && car.pace.lv === 1 && car.pace.units > 0, 'إبحار بمؤن السفر: الأيام كما هي والمؤن تُستهلك');
  ok(Math.abs(car.pace.ms - Math.round(Math.round(E.paceSec(S, car, 'jeddah', 'mumbai', sd.days, true) * 0.8) * 1000 / sd.days)) <= 1 && sd.days <= land, 'زمن يوم البحر محسوب (' + car.pace.ms + ' مللي)'); }
// شراء مؤن السفر من السوق
{ const { S, car } = mk(3); const g0 = S.player.gold, pr = E.packPrice(S, car.city), r = A.buyPack(S, car.id, 5);
  ok(r.ok && car.pack === 5 && Math.abs(g0 - S.player.gold - 5 * pr) < 1e-6, 'شراء ٥ وحدات بسعر المدينة (' + pr + ')');
  ok(A.buyPack(S, car.id, 500).ok && car.pack === E.PACE.packMax && !A.buyPack(S, car.id, 1).ok, 'الحدّ الأقصى للمخزون ' + E.PACE.packMax);
  ok(!A.buyPack(S, car.id, 0).ok, 'كمية غير صحيحة مرفوضة');
  const t = mk(3); t.S.player.gold = 5; ok(!A.buyPack(t.S, t.car.id, 3).ok && !t.car.pack, 'الرصيد القليل يمنع الشراء');
  const u = mk(3); A.travel(u.S, u.car.id, 'cairo'); ok(!A.buyPack(u.S, u.car.id, 2).ok, 'لا شراء والقافلة في الطريق'); }
// جائزة المهمة: مؤن سفر مع المكافأة
{ const S = E.newGame(3); A.learnSetChar(S, 'trader'); S.learn.intro = 1; const car = S.player.caravans[0], g0 = S.player.gold, p0 = car.pack || 0; S.learn.ev.buy = 1; S.learn.ev.sell = 1; E.learnCheck(S);
  ok(S.learn.level >= 2 && S.player.gold > g0 && (car.pack || 0) - p0 === 3, 'إتمام المستوى الأول يمنح مؤن سفر مع الريال (' + ((car.pack || 0) - p0) + ')'); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
