// الصدمات الاقتصادية وأحداث الطريق التفاعلية (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, lv) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = lv == null ? 6 : lv; S.learn.abroad = true; S.player.gold = 50000; S.day = 30; return S; }
const addShock = (S, k, par, dur) => { const K = E.SHOCKS[k]; const sh = Object.assign({ id: S.nextId++, k, st: 'rumor', warn: S.day, start: S.day + 3, end: S.day + 3 + (dur || 10), sev: 1 }, par); S.shocks = S.shocks || []; S.shocks.push(sh); return sh; };
// التشغيل بالشروط
const B = E.newGame(5); for (let i = 0; i < 300; i++) E.tick(B); ok(!(B.shocks || []).length, 'بلا شخصية تعلّم: لا صدمات (يحمي معيار الضغط)');
const E3 = world(5, 3); for (let i = 0; i < 300; i++) E.tick(E3); ok(!(E3.shocks || []).length, 'قبل المستوى 4: لا صدمات');
const N = world(6, 6); let seen = 0, maxc = 0, rumors = 0; for (let i = 0; i < 500; i++) { E.tick(N); maxc = Math.max(maxc, (N.shocks || []).length); if (N.news.some(n => n.k === 'rumor')) rumors++; } seen = N.news.length; ok(rumors > 0, 'تظهر إشاعات (مستوى 6)');
ok(maxc <= E.SHOCKS && true || maxc <= 3, 'لا أكثر من ثلاث صدمات معاً (' + maxc + ')');
// الإشاعة قبل الأثر بثلاثة أيام
let S = world(7); const sh = addShock(S, 'closure', { a: 'sa', b: 'eg' }, 8); for (let i = 0; i < 2; i++) E.tick(S); ok(sh.st === 'rumor' && !E.shockBlock(S, 'riyadh', 'cairo'), 'قبل اليوم الثالث: لا أثر بعد');
E.tick(S); ok(sh.st === 'on' && /مغلقة/.test(E.shockBlock(S, 'riyadh', 'cairo') || ''), 'اليوم الثالث: تُغلق الحدود');
const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; const tr = A.travel(S, car.id, 'cairo'); ok(tr.ok === false && /مغلقة/.test(tr.msg), 'السفر عبر حدود مغلقة مرفوض');
ok(A.travel(S, car.id, 'jeddah').ok, 'السفر الداخلي مسموح');
for (let i = 0; i < 12; i++) E.tick(S); ok(!E.shockBlock(S, 'riyadh', 'cairo') && !S.shocks.some(x => x.id === sh.id), 'تُفتح الحدود وتُزال الصدمة');
// موجة اللصوص: ترفع المخاطر ثم تُستعاد بدقة
S = world(8); const k = 'riyadh|jeddah'; const rk = (a, b) => E.A && (a < b ? a + '|' + b : b + '|' + a); const key = rk('riyadh', 'jeddah'); const base = S.risk[key]; const w = addShock(S, 'banditwave', { city: 'riyadh' }, 6);
for (let i = 0; i < 3; i++) E.tick(S); ok(S.risk[key] > base * 1.4, 'موجة لصوص ترفع الخطر (' + base.toFixed(3) + '→' + S.risk[key].toFixed(3) + ')');
for (let i = 0; i < 8; i++) E.tick(S); ok(Math.abs(S.risk[key] - base) < 1e-12, 'يُستعاد الخطر الأصلي بدقة');
// الجفاف
S = world(9); const cs = S.cities.shiraz; const d = addShock(S, 'drought', { country: 'ir' }, 8); for (let i = 0; i < 3; i++) E.tick(S);
ok(cs.sh && cs.sh.k === 'drought' && E.shocksOn(S), 'جفاف في فارس يضع أثراً على مدنها'); { let sd_ = 0, sq_ = 0; for (const sdd of [9, 10, 11, 12, 13, 14]) { const SS = world(sdd); addShock(SS, 'drought', { country: 'ir' }, 8); for (let i = 0; i < 3; i++) E.tick(SS); const Q = world(sdd); Q.noShocks = true; SS.noShocks = true; Q.cities.shiraz.stock.wool = SS.cities.shiraz.stock.wool = 100; for (let i = 0; i < 5; i++) { E.tick(SS); E.tick(Q); } sd_ += SS.cities.shiraz.stock.wool; sq_ += Q.cities.shiraz.stock.wool; } ok(sd_ < sq_, 'مخزون الصوف أقل أثناء الجفاف من عالم مماثل بلا جفاف (متوسط ست بذور: ' + (sd_ / 6).toFixed(0) + ' < ' + (sq_ / 6).toFixed(0) + ')'); }
for (let i = 0; i < 10; i++) E.tick(S); ok(!cs.sh, 'ينتهي الجفاف');
// اكتشاف طريق
S = world(10); const car2 = S.player.caravans[0]; const t0 = E.tripDays(S, car2, 'riyadh', 'jeddah') ; addShock(S, 'discovery', { a: 'riyadh', b: 'jeddah' }, 12); for (let i = 0; i < 3; i++) E.tick(S); const t1 = E.tripDays(S, car2, 'riyadh', 'jeddah'); ok(t1 <= t0 && E.shortMul(S, 'riyadh', 'jeddah') === 0.7, 'طريق مختصر يقصّر الرحلة (' + t0 + '→' + t1 + ')');
for (let i = 0; i < 14; i++) E.tick(S); ok(E.shortMul(S, 'riyadh', 'jeddah') === 1, 'ينتهي الاختصار');
// مداهمة ضريبية: غرامة لمن قصّر فقط
S = world(11); const g1 = S.player.gold; addShock(S, 'taxraid', { city: 'riyadh' }); for (let i = 0; i < 3; i++) E.tick(S); ok(S.player.gold >= g1 - 500 && S.news.some(n => /سليمة/.test(n.t)), 'حسابات سليمة: لا غرامة');
S = world(12); S.zakat.due = true; S.zakat.defer = S.day + 5; const g2 = S.player.gold; addShock(S, 'taxraid', { city: 'riyadh' }); for (let i = 0; i < 3; i++) E.tick(S); ok(S.player.gold < g2 - 150 && S.news.some(n => /غرامة/.test(n.t)), 'زكاة مؤجَّلة: غرامة');
// الحريق
S = world(13); S.phase = 3; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const pr = S.player.props.riyadh; pr.store.wheat = 600; pr.store.perfume = 100; const v0 = E.valueOf(pr.store); addShock(S, 'fire', { city: 'riyadh' }); for (let i = 0; i < 3; i++) E.tick(S); ok(E.valueOf(pr.store) < v0 * 0.93, 'الحريق يلتهم جزءاً من المخزن (' + Math.round(v0) + '→' + Math.round(E.valueOf(pr.store)) + ')');
// المرض
S = world(14); const cr = S.player.caravans[0]; const crew0 = cr.crew; addShock(S, 'sickness', {}); for (let i = 0; i < 3; i++) E.tick(S); ok(cr.crew < crew0, 'المرض يُنقص الرجال (' + crew0 + '→' + cr.crew + ')');
// الصعوبة
const count = diff => { let t = 0; for (let sd = 1; sd <= 6; sd++) { const T = world(100 + sd, 6); T.diff = diff; const seen = new Set(); for (let i = 0; i < 400; i++) { E.tick(T); (T.shocks || []).forEach(x => seen.add(x.id)); } t += seen.size; } return t; };
const calm = count('calm'), hard = count('hard'); ok(hard > calm, 'الصعب أكثر صدمات من الهادئ (' + calm + ' ← ' + hard + ')');
// حدث الطريق التفاعلي
function ambush(seed) { const T = world(seed, 6); const c = T.player.caravans[0]; c.city = 'riyadh'; c.left = 0; c.guards = 0; c.crew = 2; c.cargo = { coffee: 100 }; c.basis = { coffee: { q: 100, c: 4000 } }; T.risk['jeddah|riyadh'] = 5; return { T, c }; }
let T, c0; ({ T, c: c0 } = ambush(20)); A.travel(T, c0.id, 'jeddah'); for (let i = 0; i < 10 && !T.road; i++) E.tick(T); ok(T.road && T.road.k === 'bandits' && c0.cargo.coffee > 97 && c0.cargo.coffee <= 100 && T.pause, 'قطاع طرق: يتوقف الحدث بانتظار اختيارك دون خسارة بعد');
let r = A.roadChoose(T, 'pay'); ok(r.ok && r.outcome === 'paid' && T.road === null && c0.cargo.coffee > 97 && c0.cargo.coffee <= 100, 'الجزية تحفظ البضاعة');
({ T, c: c0 } = ambush(21)); A.travel(T, c0.id, 'jeddah'); for (let i = 0; i < 10 && !T.road; i++) E.tick(T); c0.guards = 20; r = A.roadChoose(T, 'fight'); ok(r.outcome === 'repelled' && Math.floor(c0.cargo.coffee) >= 98, 'حرّاس كثر: يصدّون');
({ T, c: c0 } = ambush(22)); A.travel(T, c0.id, 'jeddah'); for (let i = 0; i < 10 && !T.road; i++) E.tick(T); r = A.roadChoose(T, 'fight'); ok(r.outcome === 'robbed' && c0.cargo.coffee < 100, 'بلا حرّاس: يُنهب بعضها (' + Math.floor(c0.cargo.coffee) + ')');
({ T, c: c0 } = ambush(23)); A.travel(T, c0.id, 'jeddah'); for (let i = 0; i < 10 && !T.road; i++) E.tick(T); const rs = []; r = A.roadChoose(T, 'evade'); ok(['evaded', 'robbed', 'repelled'].includes(r.outcome), 'المناورة نتيجتها من ثلاث: ' + r.outcome);
({ T, c: c0 } = ambush(24)); A.travel(T, c0.id, 'jeddah'); for (let i = 0; i < 10 && !T.road; i++) E.tick(T); E.tick(T); ok(T.road === null, 'إن لم تختر: يُحسم تلقائياً في اليوم التالي بالقتال');
ok(A.roadChoose(T, 'fight').ok === false, 'لا حدث بعد الحسم');
// بلا تعلّم: كما كان (بلا انتظار)
const P = E.newGame(30); const pc = P.player.caravans[0]; pc.city = 'riyadh'; pc.left = 0; pc.guards = 0; pc.cargo = { coffee: 50 }; P.risk['jeddah|riyadh'] = 1; A.travel(P, pc.id, 'jeddah'); for (let i = 0; i < 10; i++) E.tick(P); ok(!P.road, 'بلا تعلّم: الحسم فوري كالسابق');
// احتكار تاجر كبير مسمّى: يشتري مخزون السلعة، ثم ينكسر ويُغرق السوق
S = world(42); const mc = S.cities.riyadh, mg = Object.keys(mc.stock).find(g => E.sells(mc, g) && !E.GD[g].live && !E.GD[g].fresh && E.GD[g].tier !== 'raw' && g !== 'wheat'); const mono = addShock(S, 'monopoly', { city: 'riyadh', g: mg, who: 'أبو غانم' }, 6);
ok(/أبو غانم/.test(E.SHOCKS.monopoly.rumor(mono, S)), 'الإشاعة تذكر اسم التاجر');
for (let i = 0; i < 3; i++) E.tick(S); ok(mono.st === 'on' && mc.stock[mg] <= E.capG(mc, mg) * 0.15 + 1e-9, 'اشترى المخزون (' + mc.stock[mg].toFixed(1) + ')');
for (let i = 0; i < 3; i++) { mc.stock[mg] = E.capG(mc, mg); E.tick(S); } ok(mc.stock[mg] <= E.capG(mc, mg) * 0.15 + 1e-9, 'يبقى المخزون شحيحاً طوال الاحتكار');
for (let i = 0; i < 4; i++) E.tick(S); ok(!S.shocks.some(x => x.id === mono.id), 'ينتهي الاحتكار');
// الحفظ
const Z = E.load(E.save(S = world(40))); addShock(S, 'closure', { a: 'sa', b: 'eg' }); const Z2 = E.load(E.save(S)); ok(Z2 && Z2.shocks.length === 1 && Z2.shocks[0].k === 'closure', 'الصدمات تُحفظ');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
