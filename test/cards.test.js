// بطاقات فقه التجارة ودليل الميدان: node test/cards.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const C = E.CARDS.CARDS, ids = E.CARDS.LIST, F = ids.filter(i => C[i].track === 'f'), G = ids.filter(i => C[i].track === 'g');
ok(ids.length === 43 && F.length === 18 && G.length === 25, '43 بطاقة: 18 فقهية و25 دليل ميدان');
ok(ids.every(i => C[i].title && C[i].say && C[i].text.length >= 1 && C[i].min >= 2 && C[i].min <= 10 && E.CARD_TRIG[i]), 'كل بطاقة بعنوان وتقديم ونص وشرط فتح');
ok(F.every(i => C[i].quiz && C[i].quiz.o.length === 3 && C[i].quiz.ok >= 0 && C[i].quiz.ok < 3 && C[i].quiz.why) && F.every(i => C[i].dalil && C[i].dalil.length >= 1 && C[i].dalil.every(d => d.q && d.s)), 'كل بطاقة فقهية بسؤال ودليل ومصدره');
ok(ids.every(i => !/[٠-٩]/.test(JSON.stringify(C[i]))), 'لا أرقام هندية في النصوص');
ok(new Set(F.map(i => C[i].quiz.ok)).size >= 2, 'الإجابة الصحيحة ليست في موضع واحد دائماً');
ok(/أهل العلم/.test(E.CARDS.NOTE), 'تنبيه الرجوع لأهل العلم موجود');
function world(seed, lv) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = lv == null ? 6 : lv; S.noShocks = true; S.player.gold = 90000; S.day = 50; return S; }
// فتح بالحدث
let S = world(61); E.tick(S); ok(!S.learn.cq.length || S.learn.cq.every(i => C[i]), 'لا خطأ عند بدء اللعب');
S = world(62, 3); S.learn.cq = []; S.learn.cards = []; S.learn.ev.profit = 1; S.learn.cardDay = -99; E.cardDay(S); ok(S.learn.cq[0] === 'f_sidq', 'أول ربح يفتح «الصدق والأمانة»');
// حدّ البطاقة كل 3 أيام ولا تكرار
S.learn.famDebt = null; S.player.famDebt.paid = 100; E.cardDay(S); ok(S.learn.cq.length === 1, 'لا بطاقة ثانية قبل إغلاق الأولى');
S.learn.cq = []; E.cardDay(S); ok(S.learn.cq.length === 0, 'حدّ 3 أيام بين البطاقات'); S.day += 3; E.cardDay(S); ok(S.learn.cq[0] === 'f_dayn', 'بعد 3 أيام تأتي البطاقة التالية');
S.learn.cq = []; S.day += 3; E.cardDay(S); ok(!S.learn.cq.includes('f_dayn') && !S.learn.cq.includes('f_sidq'), 'لا تتكرر بطاقة رأيتها');
// المستوى الأدنى
S = world(63, 2); S.learn.cq = []; S.learn.cards = []; S.learn.cardDay = -99; S.shocks = [{ id: 1, k: 'monopoly', st: 'on', start: 40, end: 70, sev: 1, city: 'riyadh', g: 'coffee', who: 'أبو غانم' }]; E.cardDay(S); ok(!S.learn.cq.includes('f_ihtikar'), 'تحت المستوى الأدنى لا تُفتح (الاحتكار من 4)');
S.learn.level = 4; S.learn.cq = []; S.day += 5; E.cardDay(S); ok(S.learn.cq.includes('f_ihtikar') || S.learn.cq.includes('g_shock'), 'فوق الأدنى تُفتح بالحدث');
// الاحتكار الفعلي يفتح الفقه
S = world(64, 5); S.learn.cards = []; S.learn.cq = []; S.learn.cardDay = -99; S.shocks = [{ id: 2, k: 'monopoly', st: 'rumor', start: 53, end: 70, sev: 1, city: 'riyadh', g: 'coffee', who: 'أبو غانم' }]; E.cardDay(S); ok(S.learn.cq.includes('f_ihtikar'), 'إشاعة الاحتكار تفتح بطاقة الاحتكار');
// الصيغ الأخرى
const t = (mut, id, lv) => { const T = world(65, lv || 8); T.learn.cards = []; T.learn.cq = []; T.learn.cardDay = -99; mut(T); const trig = E.CARD_TRIG[id](T); return trig; };
ok(t(T => { T.player.factories.push({ city: 'riyadh', recipe: 'perfume', level: 1, local: true }); }, 'f_ghish'), 'مصنع يفتح الغش');
ok(t(T => { T.learn.ev.agentBuy = 1; }, 'f_wakala'), 'وكيل يفتح الوكالة');
ok(t(T => { T.phase = 4; }, 'f_riba'), 'الطور 4 يفتح الربا');
ok(t(T => { T.zakat = T.zakat || {}; T.zakat.paidN = 1; }, 'f_zakat'), 'زكاة تفتح فقه الزكاة');
ok(t(T => { T.player.caravans[0].insured = true; }, 'f_taamin'), 'تأمين يفتح الأخذ بالأسباب');
ok(t(T => { T.rival = { name: 'x', gold: 1, cargo: {} }; T.day = 100; }, 'f_munhi'), 'المنافس يفتح المنافسة الشريفة');
ok(t(T => { T.learn.level = 10; }, 'f_samaha', 10), 'التخرج يفتح السماحة');
ok(t(T => { const pr = T.player.props.riyadh = { shops: [{ id: 1 }], whs: 0, store: {}, basis: {}, staff: [{ role: 'seller' }] }; }, 'f_ujra'), 'عامل يفتح حق الأجير');
ok(t(T => { T.player.props.riyadh = { shops: [], whs: 0, store: {}, basis: {}, mgr: { lv: 1 } }; }, 'f_amana'), 'مدير يفتح الأمانة');
// الاختبار الطويل: لعب تلقائي يمنح بطاقات متفرقة بلا خطأ
S = world(66, 8); S.learn.cards = []; for (let i = 0; i < 300; i++) { E.tick(S); S.learn.cq = []; } ok(S.learn.cards.length >= 3 && S.learn.cards.every(i => C[i]), 'مئات الأيام تمنح بطاقات سليمة (' + S.learn.cards.length + ')');
const L = E.load(E.save(S)); ok(L.learn.cards.length === S.learn.cards.length, 'الحفظ');
const B = E.newGame(70); for (let i = 0; i < 200; i++) E.tick(B); ok(!B.learn.cards || !B.learn.cards.length, 'بلا شخصية تعلّم: لا بطاقات (معيار الضغط)');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
