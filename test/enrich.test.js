// ملفات الإثراء: حِكَم الطريق وخاتمة الحكمة ومهمتا الحوار: node test/enrich.test.js
const D = require('../src/dialogs.js'), T = require('../src/tips.js').TIPS, S = require('../src/stingers.js').STINGERS, E = require('../src/engine.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
ok(T.length >= 19 && new Set(T.map(t => t.id)).size === T.length, 'حِكَم الطريق: ' + T.length + ' بمعرّفات فريدة');
ok(T.filter(t => t.kind === 'hadith').every(t => t.s), 'كل حديث مخرَّج');
ok(Object.keys(S).length === 10 && Object.values(S).every(x => x.length <= 90), 'خاتمة الحكمة: عشرة أسطر وكل منها ≤ ٩٠ حرفاً');
ok(D.QUESTS.q_hajj && D.QUESTS.q_debtor, 'المهمتان مسجّلتان');
{ // المهمتان داخل حوار التاجر
  const mt = D.DIALOGS.mecca_trader, rt = D.DIALOGS.riyadh_trader;
  ok(mt.nodes.hub.opts.some(o => o.next === 'q_hajj_q_offer') && mt.nodes.q_hajj_q_offer, 'خيار قافلة الحجيج في حوار تاجر مكة');
  ok(rt.nodes.hub.opts.some(o => o.next === 'q_debtor_q_offer') && rt.nodes.q_debtor_q_repay, 'خيار الحساب في حوار تاجر الرياض');
  Object.values(D.DIALOGS).forEach(d => Object.entries(d.nodes).forEach(([k, n]) => (n.opts || []).forEach(o => { if (o.next && !d.nodes[o.next]) ok(false, 'عقدة مفقودة ' + k + '→' + o.next); })));
}
function world(seed, lv) { const S = E.newGame(seed); E.A.learnSetChar(S, 'trader'); S.learn.level = lv; S.player.gold = 20000; const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; return S; }
const pick = (S, re) => { const o = E.dlgView(S).opts.find(x => re.test(x.t)); return o ? E.A.dlgChoose(S, o.i) : { ok: false }; };
{ // مسار المعسر: الإمهال ثم السداد
  const S = world(5, 5); E.A.dlgOpen(S, 'riyadh_trader'); pick(S, /ماذا عندك/);
  ok(!!E.dlgView(S).opts.find(o => /حساب بيننا/.test(o.t)), 'خيار الحساب ظاهر من المستوى 3');
  pick(S, /حساب بيننا/); pick(S, /لنراجع حسابنا/); ok(E.questState(S, 'q_debtor') === 'active', 'بدأت مهمة المعسر');
  const g0 = S.player.gold, t0 = S.bosses.riyadh.trust; pick(S, /أمهلك/); ok(S.player.gold === g0 && S.bosses.riyadh.trust === t0 + 3, 'الإمهال يرفع الثقة 3 ولا يقبض مالاً');
  E.A.dlgClose(S); E.A.dlgOpen(S, 'riyadh_trader'); ok(E.dlgView(S).node === 'q_debtor_q_wait', 'قبل انقضاء المهلة: عقدة الانتظار');
  E.A.dlgClose(S); S.day += 11; E.A.dlgOpen(S, 'riyadh_trader'); ok(E.dlgView(S).node === 'q_debtor_q_repay', 'بعد المهلة: عقدة السداد');
  const g1 = S.player.gold; pick(S, /أقبض 300/); ok(S.player.gold === g1 + 300 && E.questState(S, 'q_debtor') === 'done', 'قبض 300 كاملة وانتهت المهمة');
}
{ // الوضع: إسقاط جزء، والمطالبة الفورية
  let S = world(6, 5); E.A.dlgOpen(S, 'riyadh_trader'); pick(S, /ماذا عندك/); pick(S, /حساب بيننا/); pick(S, /لنراجع حسابنا/);
  let g = S.player.gold, t = S.bosses.riyadh.trust; pick(S, /أسقط 150/); ok(S.player.gold === g + 150 && S.bosses.riyadh.trust === t + 4, 'الوضع: قبض 150 وثقة +4');
  S = world(7, 5); E.A.dlgOpen(S, 'riyadh_trader'); pick(S, /ماذا عندك/); pick(S, /حساب بيننا/); pick(S, /لنراجع حسابنا/);
  g = S.player.gold; t = S.bosses.riyadh.trust; pick(S, /أطلب 300/); ok(S.player.gold === g + 300 && S.bosses.riyadh.trust === t - 2, 'المطالبة الفورية: قبض 300 وثقة −2');
}
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
