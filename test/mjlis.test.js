// مجلس السوق ودفتر الأحكام (محرك): مسائل كتاب البيوع التعليمية: node test/mjlis.test.js
const E = require('../src/engine.js'), A = E.A, F = E.FIQH;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, lv) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = lv; S.learn.intro = lv; S.learn.abroad = true; S.player.gold = 30000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.noShocks = true; return S; };
const runTo = (S, id, days) => { for (let i = 0; i < days && !(S.learn.eq[0] && S.learn.eq[0].id === id); i++) { E.tick(S); S.pause = false; if (S.learn.eq[0] && S.learn.eq[0].id !== id) S.learn.eq.shift(); } return S.learn.eq[0]; }; // الأحداث الأخرى (فرصة، سمسار…) تُتجاهل هنا
ok(F.CASES.length >= 5 && F.CASES.every(c => c.opts.length === 3 && c.ok >= 0 && c.ok < 3 && c.ruling && c.evidence && c.khilaf && c.comment && c.diff >= 1 && c.diff <= 3), 'المسائل مكتملة: ثلاثة خيارات وحكم ودليل وخلاف وتعليق وصعوبة');
ok(new Set(F.CASES.map(c => c.ok)).size >= 3, 'موضع الجواب الصحيح يتنوع بين المسائل');
ok(/للفتوى أهل العلم|الفتوى والوقائع الحقيقية يُرجع لأهل العلم/.test(F.HEAD) && F.REF.includes('جمهور'), 'العبارة التعليمية الثابتة والمرجع (جمهور الفقهاء)');
ok(F.allowed(3) === 0 && F.allowed(4) === 1 && F.allowed(6) === 2 && F.allowed(8) === 3, 'تدرّج الصعوبة: ١ من المستوى ٤، ٢ من ٦، ٣ من ٨');
// لا مجلس قبل المستوى ٤
{ const S = mk(3, 3); const ev = runTo(S, 'mj', 120); ok(!ev, 'قبل المستوى ٤ لا مجلس سوق'); }
// ظهور المسألة الأولى بعد المستوى ٤ بلا مال ولا أثر اقتصادي
{ const S = mk(3, 4), ev = runTo(S, 'mj', 80); ok(ev && ev.id === 'mj' && ev.c === 'aib', 'تظهر أول مسألة (خيار العيب) خلال ٨٠ يوماً');
  const g0 = S.player.gold, cs = F.CASES[0]; let r = A.eventChoice(S, 'p' + cs.ok);
  ok(r.ok !== false && S.learn.mj.baraka === 1 && S.learn.mj.seen.aib.ok === true && S.player.gold === g0, 'الإجابة الصحيحة: بركة +١ بلا تغيير في المال');
  ok(A.eventChoice(S, 'p0').ok === false && S.learn.eq[0].pick === cs.ok, 'لا إعادة إجابة على المسألة نفسها');
  A.eventChoice(S, 'close'); ok(!S.learn.eq.length, 'الإغلاق ينهي الحدث');
  const nxt = runTo(S, 'mj', 80); ok(!nxt, 'بصعوبة ١ فقط في المستوى ٤: لا مسألة ثانية (المسائل التالية أصعب)');
  S.learn.level = S.learn.intro = 6; const ev2 = runTo(S, 'mj', 80); ok(ev2 && ev2.c === 'qabd', 'عند المستوى ٦ تظهر مسألة بيع المبيع قبل قبضه');
  const wrong = (cs2 => (cs2.ok + 1) % 3)(F.CASES.find(c => c.id === 'qabd')); r = A.eventChoice(S, 'p' + wrong);
  ok(r.ok === false && S.learn.mj.baraka === 1 && S.learn.mj.seen.qabd.ok === false && S.learn.eq[0].right === false, 'الإجابة الخاطئة: لا بركة، وتُسجَّل في الدفتر للتعلّم');
  A.eventChoice(S, 'close');
  const L2 = E.load(E.save(S)); ok(L2.learn.mj.baraka === 1 && L2.learn.mj.seen.aib && L2.learn.mj.seen.qabd && !L2.learn.mj.seen.kharaj, 'الحفظ والتحميل يبقيان الدفتر');
  S.learn.level = S.learn.intro = 8; let got = []; for (let k = 0; k < 4; k++) { const e = runTo(S, 'mj', 80); if (!e) break; got.push(e.c); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === e.c).ok); A.eventChoice(S, 'close'); }
  ok(got.join() === 'bayatan,kharaj,salam' || got.join() === 'kharaj,bayatan,salam' || (got.length === 3 && new Set(got).size === 3), 'عند المستوى ٨ تظهر باقي المسائل مرة واحدة لكل مسألة (' + got.join('،') + ')'); }
// حفظ قديم بلا الدفتر
{ const S = mk(4, 5); const old = JSON.parse(E.save(S)); delete old.learn.mj; const L = E.load(JSON.stringify(old)); ok(L && L.learn.mj && L.learn.mj.baraka === 0, 'حفظ قديم بلا دفتر يُرحَّل بسلام'); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
