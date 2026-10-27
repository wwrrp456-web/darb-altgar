// صندوق التكافل التعاوني (بدل التأمين): node test/insurance.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 6; S.learn.abroad = true; S.phase = 3; S.player.gold = 90000; S.day = 30; S.player.caravans[0].city = 'riyadh'; S.noShocks = true; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); return S; }
let S = world(11); const pr = S.player.props.riyadh; pr.store = { coffee: 200 };
ok(E.insPrem(S, 'riyadh') >= 3, 'التبرع اليومي أدنى 3 (' + E.insPrem(S, 'riyadh') + ')');
ok(!S.player.tk || !S.player.tk.joined, 'لا اشتراك قبل التفعيل');
let r = A.insureCity(S, 'riyadh', true); ok(r.ok && E.insOn(S, 'riyadh') && /التكافل/.test(r.msg), 'الاشتراك في الصندوق');
ok(!A.insureCity(S, 'riyadh', true).ok, 'لا اشتراك مزدوج'); ok(!A.insureCity(S, 'cairo', true).ok, 'لا ممتلكات في مدينة أخرى');
const g0 = S.player.gold; E.tick(S); const T = S.player.tk; ok(T.joined && T.pool >= E.TK.seed && g0 - S.player.gold >= E.insPrem(S, 'riyadh') - 1e-6, 'يُخصم التبرع ويدخل الصندوق (رصيده ' + Math.round(T.pool) + ')');
ok(T.paid > 0 && E.TK.wakeel === 0.1, 'أجر المشغّل معلوم 10٪');
// حريق: الخسارة تقع كاملة ثم يعوّض الصندوق بنسبة منها
function fire(ins) { const U = world(12); U.player.props.riyadh.store = { coffee: 1000 }; if (ins) A.insureCity(U, 'riyadh', true); E.tick(U); U.player.props.riyadh.store = { coffee: 1000 }; U.shocks = [{ id: 99, k: 'fire', st: 'rumor', warn: U.day, start: U.day + 1, end: U.day + 2, sev: 1, city: 'riyadh' }]; const gb = U.player.gold; E.tick(U); return { left: U.player.props.riyadh.store.coffee, gain: U.player.gold - gb, news: U.news.map(n => n.t).join('|') }; }
const a = fire(false), b = fire(true); const lostA = 1000 - a.left, lostB = 1000 - b.left;
ok(Math.abs(lostA - lostB) < 1e-6 && lostA > 0, 'الخسارة العينية واحدة، والتكافل يعوّضها مالاً (' + Math.round(lostA) + ')');
ok(b.gain > a.gain && /عوّضك صندوق التكافل/.test(b.news), 'تعويض مالي من الصندوق ورسالة');
// التعويض محدود بنصف الرصيد
const C = world(13); A.insureCity(C, 'riyadh', true); E.tick(C); C.player.tk.pool = 100; const gc = C.player.gold; const pay = E.tkClaim(C, 100000, E.TK.cover); ok(Math.abs(pay - 50) < 1e-6 && C.player.tk.pool === 50, 'التعويض بحدّ نصف الرصيد، فلا ضمان كامل (' + pay + ')');
// فائض كل 90 يوماً
const D = world(14); A.insureCity(D, 'riyadh', true); E.tick(D); D.player.tk.pool = 9000; D.player.tk.last = D.day - 90; const gd = D.player.gold; E.tick(D); ok(D.player.tk.back > 0 && D.player.gold > gd && D.news.some(n => /فائضه على المشاركين/.test(n.t)), 'فائض الصندوق يعود للمشاركين');
// انقطاع الاشتراك عند العجز
S.player.gold = 0; E.tick(S); ok(!E.insOn(S, 'riyadh'), 'يتوقف الاشتراك عند العجز عن التبرع');
// قافلة: تبرع عن الرحلة وتعويض
const car = world(15); const cc = car.player.caravans[0]; cc.insured = true; cc.cargo = { coffee: 50 }; cc.city = 'riyadh'; cc.left = 0; const gp = car.player.gold; const tr = A.travel(car, cc.id, 'jeddah'); ok(tr.ok && car.player.tk && car.player.tk.paid > 0, 'تبرع عن الرحلة يدخل الصندوق'); 
const L = E.load(E.save(car)); ok(L.player.tk && L.player.tk.joined, 'الحفظ');
const T2 = E.newGame(5); T2.phase = 2; ok(!A.insureCity(T2, 'riyadh', true).ok, 'مغلق قبل الطور 3');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
