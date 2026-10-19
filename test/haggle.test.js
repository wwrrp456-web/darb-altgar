// المساومة: لعبة قراءة مزاج التاجر وقسيمة السعر (محرك فقط)
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, lv, char) { const S = E.newGame(seed); A.learnSetChar(S, char || 'trader'); S.learn.level = lv == null ? 5 : lv; S.player.gold = 60000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; S.cities.riyadh.stock.wool = 600; S.cities.riyadh.stock.coffee = 600; return { S, car, c: S.cities.riyadh }; }
const play = (S, wins, miss) => { const G = S.player.hg.game; let r; for (let i = 0; i < 3 && !G.done; i++) { const right = wins > 0 ? (wins--, true) : false; const choice = right ? E.HG_BEST[G.moods[G.round]] : ({ firm: 'ref', ref: 'praise', praise: 'firm' })[E.HG_BEST[G.moods[G.round]]]; r = A.haggleChoose(S, choice); } return r; };
// الفتح بالمستوى
let w = world(4, 3); ok(A.haggleStart(w.S, 'wool', 'buy', 30).ok === false, 'مغلقة قبل المستوى 4');
w = world(4, 5); ok(E.haggleOpen(E.newGame(2)), 'من لا تعليم عنده: مفتوحة');
ok(A.haggleStart(w.S, 'wool', 'buy', 1).ok === false && /صغيرة/.test(A.haggleStart(w.S, 'wool', 'buy', 1).msg), 'الصفقة الصغيرة مرفوضة');
// ثلاث إصابات: خصم 6٪ على الشراء لهذه الكمية فقط
const u = E.unitPrice(w.c, 'wool'); const q0 = E.quoteBuy(w.S, 'riyadh', 'wool', 30, null).cost;
let r = A.haggleStart(w.S, 'wool', 'buy', 30); ok(r.ok && r.game.moods.length === 3 && r.game.moods.every(m => ['pleased', 'neutral', 'annoyed'].includes(m)), 'بدء المساومة بثلاثة مزاجات');
r = play(w.S, 3); ok(r.done && r.wins === 3 && Math.abs(r.mul - 0.94) < 1e-9, 'ثلاث إصابات: سعر ×0.94 (' + r.mul + ')');
const q1 = E.quoteBuy(w.S, 'riyadh', 'wool', 30, null).cost; ok(Math.abs(q1 / q0 - 0.94) < 1e-6, 'عرض السعر يتضمن القسيمة (' + (q1 / q0).toFixed(3) + ')');
const q31 = E.quoteBuy(w.S, 'riyadh', 'wool', 40, null).cost; ok(q31 > q1 && q31 / E.quoteBuy(w.S, 'riyadh', 'wool', 40, null).avg > 0, 'الزيادة على الكمية بلا خصم');
const g0 = w.S.player.gold; const b = A.buy(w.S, w.car.id, 'wool', 30); ok(b.ok !== false && Math.abs((g0 - w.S.player.gold) / q0 - 0.94) < 0.01, 'الشراء الفعلي بسعر القسيمة');
ok(!E.vouchOf(w.S, 'riyadh', 'wool', 'buy'), 'استُهلكت القسيمة بعد شراء الكمية كلها');
// قسيمة جزئية
w = world(5); A.haggleStart(w.S, 'wool', 'buy', 30); play(w.S, 3); A.buy(w.S, w.car.id, 'wool', 10); ok(E.vouchOf(w.S, 'riyadh', 'wool', 'buy').left === 20, 'يتبقى 20 من القسيمة');
// لا تسري على سلعة أخرى
ok(E.vouchMul(w.S, 'riyadh', 'coffee', 'buy') === 1 && E.vouchMul(w.S, 'jeddah', 'wool', 'buy') === 1, 'لا تسري على سلعة أخرى ولا مدينة أخرى');
// تنتهي بنهاية اليوم
E.tick(w.S); ok(E.vouchMul(w.S, 'riyadh', 'wool', 'buy') === 1, 'القسيمة ليوم واحد');
// خطآن يُنهيان المساومة
w = world(6); A.haggleStart(w.S, 'wool', 'buy', 30); r = play(w.S, 0); ok(r.done && r.wins === 0 && !E.vouchOf(w.S, 'riyadh', 'wool', 'buy'), 'خطآن: انتهت بلا قسيمة');
w = world(6); A.haggleStart(w.S, 'wool', 'buy', 30); const G = w.S.player.hg.game; A.haggleChoose(w.S, E.HG_BEST[G.moods[0]]); const bad = ({ firm: 'ref', ref: 'praise', praise: 'firm' })[E.HG_BEST[G.moods[1]]]; A.haggleChoose(w.S, bad); r = A.haggleChoose(w.S, E.HG_BEST[G.moods[2]]); ok(r.done && r.wins === 2 && Math.abs(r.mul - 0.96) < 1e-9, 'إصابتان وخطأ: 4٪');
// الحدّ اليومي لكل مدينة
w = world(7); A.haggleStart(w.S, 'wool', 'buy', 30); play(w.S, 0); A.haggleStart(w.S, 'coffee', 'buy', 30); play(w.S, 0); r = A.haggleStart(w.S, 'wool', 'buy', 30); ok(r.ok === false && /غداً/.test(r.msg), 'حدّ يومي: ' + r.msg);
E.tick(w.S); ok(A.haggleStart(w.S, 'wool', 'buy', 30).ok !== false, 'يتجدد الحدّ غداً');
// البيع: علاوة 6٪
w = world(8); A.buy(w.S, w.car.id, 'wool', 40); const s0 = E.quoteSell(w.S, 'riyadh', 'wool', 40, 1).net; A.haggleStart(w.S, 'wool', 'sell', 40); play(w.S, 3);
const s1 = E.quoteSell(w.S, 'riyadh', 'wool', 40, 1).net; ok(Math.abs(s1 / s0 - 1.06) < 1e-6, 'البيع بعلاوة 6٪ (' + (s1 / s0).toFixed(3) + ')');
const gg = w.S.player.gold; A.sell(w.S, w.car.id, 'wool', 40); ok(w.S.player.gold - gg > s0 * 1.05, 'البيع الفعلي بسعر القسيمة');
ok(A.haggleStart(world(8).S, 'wool', 'sell', 40).ok === false, 'لا بيع بلا بضاعة');
// المفاوض أنفع بنسبة 50٪
const n = world(9, 5, 'negotiator'); A.haggleStart(n.S, 'wool', 'buy', 30); r = play(n.S, 3); ok(Math.abs(r.mul - (1 - 0.03 * 3)) < 1e-9, 'المفاوض: 3٪ لكل إصابة (×' + r.mul + ')');
// الحفظ والتحميل
const Z = E.load(E.save(n.S)); ok(Z && Z.player.hg && Z.player.hg.vouch && Z.player.hg.vouch.mul === r.mul, 'القسيمة تُحفظ');
// الاقتصاد: المنافسون لا يتأثرون ولا NaN
const st = E.stressTest({ seeds: 6, days: 60, bot: true }); ok(st.nan === 0 && st.summary.avgPlayerNW > 6000, 'الضغط: لا NaN والثروة معقولة (' + Math.round(st.summary.avgPlayerNW) + ')');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
