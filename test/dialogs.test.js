// الحوارات والمهام الصغيرة كبيانات (محرك فقط)
const E = require('../src/engine.js'), A = E.A, D = E.DLG;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed, lv) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = lv == null ? 5 : lv; S.player.gold = 20000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; S.cities.riyadh.stock.coffee = 500; return { S, car }; }
// سلامة البيانات
ok(Object.keys(D.DIALOGS).length === 48 && Object.keys(D.SCENES).length === 16 && Object.values(D.SCENES).every(sc => sc.spots.length === 3 && sc.spots.every(s => D.DIALOGS[s.dlg])), 'ست عشرة مدينة بثلاثة حوارات وثلاث نقاط ضغط لكل منها');
ok(Object.values(D.DIALOGS).every(d => Object.values(d.nodes).every(n => (n.opts || []).every(o => o.end || !o.next || d.nodes[o.next])) && d.start.every(r => d.nodes[r.node])), 'كل الأسهم تشير إلى عقد موجودة');
// الحضور
let { S, car } = world(4); car.city = 'jeddah'; ok(A.dlgOpen(S, 'riyadh_boss').ok === false, 'لا حديث مع زعيم الرياض من جدة');
({ S, car } = world(4));
let r = A.dlgOpen(S, 'riyadh_boss'); ok(r.ok && r.view.node === 'intro' && r.view.mood === 'warm' && /الراجح|ماجد/.test(r.view.name) && !/\{boss\}/.test(r.view.say), 'أول زيارة: مقدمة بمزاج ودود واسم الزعيم');
const t0 = S.bosses.riyadh.trust; r = A.dlgChoose(S, 0); ok(r.view.node === 'hub' && S.bosses.riyadh.trust === t0 + 2 && E.stOf(S).flags.met_boss, 'التعارف يرفع الثقة 2 ويُسجَّل');
// الهدية وفترة التبريد
const g0 = S.player.gold, t1 = S.bosses.riyadh.trust; const gi = r.view.opts.findIndex(o => /هدية/.test(o.t)); r = A.dlgChoose(S, r.view.opts[gi].i);
ok(r.view.node === 'gift' && S.player.gold === g0 - 100 && S.bosses.riyadh.trust === t1 + 6, 'هدية بـ100 تزيد الثقة 6');
A.dlgChoose(S, 0); ok(!E.dlgView(S).opts.some(o => /هدية/.test(o.t)), 'الهدية تختفي أسبوعاً (تبريد)');
S.day += 8; ok(E.dlgView(S).opts.some(o => /هدية/.test(o.t)), 'وتعود بعد 7 أيام');
// خيارات بمستوى
ok(!E.dlgView(S).opts.some(o => /نقل الصنعة/.test(o.t)), 'نقل الصنعة مغلق قبل المستوى 6');
S.learn.level = 7; ok(E.dlgView(S).opts.some(o => /نقل الصنعة/.test(o.t)), 'يظهر من المستوى 6');
// نقل الصنعة عبر الحوار
S.bosses.riyadh.trust = 20; S.player.gold = 5000; const cr = E.dlgView(S).opts.find(o => /نقل الصنعة/.test(o.t)); r = A.dlgChoose(S, cr.i); ok(r.view.node === 'craft', 'عقدة نقل الصنعة');
r = A.dlgChoose(S, r.view.opts.find(o => /أدفع/.test(o.t)).i); ok(S.bosses.riyadh.craft === true && r.view.node === 'craft_ok', 'الدفع يمنح إذن النقل');
A.dlgClose(S); ok(E.stOf(S).cur === null, 'الإغلاق');
// ثقة منخفضة: مزاج منزعج
S.bosses.riyadh.trust = -20; E.stOf(S).cur = { id: 'riyadh_boss', node: 'hub' }; ok(E.dlgView(S).mood === 'displeased', 'ثقة سالبة: الزعيم منزعج');
S.bosses.riyadh.trust = 40; A.dlgClose(S); r = A.dlgOpen(S, 'riyadh_boss'); ok(r.view.node === 'friend', 'ثقة 40: حوار الصديق');
// مهمة القهوة
({ S, car } = world(5)); r = A.dlgOpen(S, 'riyadh_trader'); ok(r.view.node === 'intro', 'مقدمة التاجر'); A.dlgChoose(S, 1);
ok(E.dlgView(S).opts.some(o => /تحتاج/.test(o.t)), 'عرض المهمة متاح من المستوى 2'); A.dlgChoose(S, 0); ok(E.questState(S, 'q_coffee') === 'none', 'العرض لا يبدأ المهمة');
ok(E.dlgView(S).node === 'q_offer', 'عرض المهمة'); r = A.dlgChoose(S, 0); ok(E.questState(S, 'q_coffee') === 'active' && r.view === null, 'قبول المهمة وإغلاق الحوار');
r = A.dlgOpen(S, 'riyadh_trader'); ok(r.view.node === 'q_active', 'عودة: حوار المهمة الجارية'); ok(!r.view.opts.some(o => /هذه ثمان/.test(o.t)), 'بلا قهوة لا يظهر خيار التسليم');
A.buy(S, car.id, 'coffee', 8); r = A.dlgOpen(S, 'riyadh_trader'); const dv = r.view.opts.find(o => /هذه ثمان/.test(o.t)); ok(!!dv, 'مع 8 قهوة يظهر التسليم');
const gold0 = S.player.gold, ref = E.refPrice(S.cities.riyadh, 'coffee'); r = A.dlgChoose(S, dv.i);
ok(E.questState(S, 'q_coffee') === 'done' && Math.abs(S.player.gold - gold0 - 8 * ref * 1.3) < 1 && !(car.cargo.coffee >= 1), 'التسليم يدفع 130٪ من المرجعي ويأخذ البضاعة (' + Math.round(S.player.gold - gold0) + ')');
ok(/قبضتَ/.test(r.msg) && /أتممتَ/.test(r.msg), 'رسالة النتيجة: ' + r.msg);
A.dlgClose(S); r = A.dlgOpen(S, 'riyadh_trader'); ok(r.view.node === 'hub' && !r.view.opts.some(o => /تحتاج/.test(o.t)), 'بعد الإتمام لا تتكرر المهمة');
// الحفظ والتحميل
const Z = E.load(E.save(S)); ok(Z && E.questState(Z, 'q_coffee') === 'done' && E.stOf(Z).flags.met_trader, 'الحوار والمهام تُحفظ');
const O = JSON.parse(E.save(S)); delete O.story; ok(E.load(JSON.stringify(O)) && E.questState(E.load(JSON.stringify(O)), 'q_coffee') === 'none', 'حفظ قديم بلا حوارات يعمل');
ok(A.dlgChoose(world(6).S, 0).ok === false, 'لا اختيار بلا حوار');
const st = E.stressTest({ seeds: 6, days: 60, bot: true }); ok(st.nan === 0, 'الضغط: لا NaN');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
