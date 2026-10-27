// قاعدة الأجر المعلوم للحارس والطاقم والقائد: node test/wage.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.player.gold = 9000; return S; };
{ const S = mk(3), c = S.player.caravans[0];
  const w = E.staffWage(S, 'guard'); ok(w.once === 300 && w.day === 5 && w.idle === 1.25, 'أجر الحارس المعلوم: ٣٠٠ مرة و٥ يومياً و١٫٢٥ عند الوقوف');
  const w2 = E.staffWage(S, 'crew'); ok(w2.once === 50 && w2.day === 1.5, 'أجر الطاقم المعلوم');
  const g0 = S.player.gold, r = A.hireGuard(S, c.id);
  ok(r.ok !== false && /أجر معلوم/.test(r.msg) && /300 ريال مرة واحدة/.test(r.msg) && /5 ريال يومياً/.test(r.msg) && g0 - S.player.gold === 300, 'رسالة التوظيف تذكر الأجر المعلوم ويُخصم رسم التوظيف');
  ok(S.learn.rq.includes('guardHire') || S.learn.rseen.guardHire === 1, 'تعليق عمّ سالم بقصة ابن أريقط عند أول توظيف');
  const rt = require('../src/lessons.js'); ok(/ابن أريقط|بن أريقط/.test(rt.REACT.guardHire.t) && /الهجرة/.test(rt.REACT.guardHire.t) && /الأجر/.test(rt.REACT.guardHire.t), 'نص التعليق: الأجر المعلوم وقصة الهجرة');
  A.hireGuard(S, c.id); ok(S.learn.rseen.guardHire === 1, 'التعليق مرة واحدة');
  const r2 = A.hireCrew(S, c.id); ok(/أجر معلوم/.test(r2.msg) && /1.5 ريال يومياً/.test(r2.msg), 'رسالة الطاقم');
  // الأجر الفعلي المخصوم مطابق للمعروض
  c.left = 5; c.guards = 2; c.crew = 0; c.herders = 0; c.captain = null; const before = S.player.gold; E.tick(S);
  ok(Math.abs((before - S.player.gold) - 2 * E.staffWage(S, 'guard').day) < 3, 'ما يُخصم يومياً يطابق المعلن (' + (before - S.player.gold).toFixed(2) + ')'); }
{ const S = mk(4); const c = S.player.caravans[0]; S.player.caravans.push(Object.assign({}, c, { id: 99 })); ok(E.staffWage(S, 'guard').day === 5.3, 'تزيد الأجور ٦٪ لكل قافلة إضافية في المعلن أيضاً'); }
{ const cd = { trade: 3, nav: 3, combat: 3, role: 'lux' }, lo = { trade: 3, nav: 3, combat: 3, role: 'loyal' }; ok(E.candWage(cd) === 10 && E.candWage(lo) === 9, 'أجر القائد المعلوم (والوفيّ أقل ١٠٪)'); }
console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
