// تأمين الممتلكات (مخزن ومصانع): node test/insurance.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
function world(seed) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 6; S.learn.abroad = true; S.phase = 3; S.player.gold = 90000; S.day = 30; S.player.caravans[0].city = 'riyadh'; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); return S; }
let S = world(11); const pr = S.player.props.riyadh; pr.store = { coffee: 200 };
ok(E.insPrem(S, 'riyadh') >= 3, 'القسط أدنى 3 (' + E.insPrem(S, 'riyadh') + ')');
let r = A.insureCity(S, 'riyadh', true); ok(r.ok && E.insOn(S, 'riyadh'), 'تفعيل التأمين');
ok(!A.insureCity(S, 'riyadh', true).ok, 'لا تأمين مزدوج'); ok(!A.insureCity(S, 'cairo', true).ok, 'لا ممتلكات في مدينة أخرى');
const g0 = S.player.gold; S.noShocks = true; E.tick(S); ok(g0 - S.player.gold >= E.insPrem(S, 'riyadh') - 1e-6, 'يُخصم القسط يومياً');
// حريق مؤمَّن مقابل غير مؤمَّن
function fire(ins) { const T = world(12); T.player.props.riyadh.store = { coffee: 1000 }; if (ins) A.insureCity(T, 'riyadh', true); T.shocks = [{ id: 99, k: 'fire', st: 'rumor', warn: T.day, start: T.day + 1, end: T.day + 2, sev: 1, city: 'riyadh' }]; E.tick(T); return T.player.props.riyadh.store.coffee; }
const a = fire(false), b = fire(true); ok(b > a && 1000 - b < (1000 - a) * 0.5, 'التأمين يخفف الحريق (' + Math.round(1000 - a) + ' مقابل ' + Math.round(1000 - b) + ')');
// انقطاع التأمين عند العجز
S.player.gold = 0; E.tick(S); ok(!E.insOn(S, 'riyadh'), 'يتوقف التأمين عند العجز عن القسط');
ok(!A.insureCity(world(13), 'riyadh', true).ok === false, 'يعمل في عالم جديد');
const L = E.load(E.save(S = world(14))); ok(!!L, 'الحفظ يعمل');
const T = E.newGame(5); T.phase = 2; ok(!A.insureCity(T, 'riyadh', true).ok, 'مغلق قبل الطور 3');
console.log(fails ? '\nFAILED ' + fails : '\nكلها نجحت'); process.exit(fails ? 1 : 0);
