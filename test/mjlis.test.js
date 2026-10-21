// مجلس السوق ودفتر الأحكام (محرك): مسائل كتاب البيوع التعليمية: node test/mjlis.test.js
const E = require('../src/engine.js'), A = E.A, F = E.FIQH;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const mk = (seed, lv) => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = lv; S.learn.intro = lv; S.learn.abroad = true; S.player.gold = 30000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.noShocks = true; return S; };
const runTo = (S, id, days) => { for (let i = 0; i < days && !(S.learn.eq[0] && S.learn.eq[0].id === id); i++) { E.tick(S); S.pause = false; if (S.learn.eq[0] && S.learn.eq[0].id !== id) S.learn.eq.shift(); } return S.learn.eq[0]; }; // الأحداث الأخرى (فرصة، سمسار…) تُتجاهل هنا
ok(F.CASES.length === 48 && F.CASES.every(c => c.opts.length === 3 && c.ok >= 0 && c.ok < 3 && c.ruling && c.why && c.gloss && c.full.evidence && c.full.khilaf && c.diff >= 1 && c.diff <= 3 && ['self', 'witness', 'council'].includes(c.mode)), 'ثمان وأربعون مسألة مكتملة: ثلاثة خيارات وحكم مبسط ولماذا ومعنى الكلمات والدليل والخلاف وصعوبة وشكل عرض');
ok(F.CASES.every(c => c.scene.split(/\s+/).length <= 60 && c.opts.every(o => o.split(/\s+/).length <= 22) && c.ruling.split(/\s+/).length <= 45), 'طبقة الصغار قصيرة: المشهد حتى ٦٠ كلمة والخيار حتى ٢٢ والحكم حتى ٤٥');
ok(F.CASES.every(c => c.scene.split(/[.؟!]/).filter(t => t.trim()).every(t => t.trim().split(/\s+/).length <= 30)), 'جمل المشهد قصيرة (حتى ثلاثين كلمة، والنص المعتمد من المختص)');
ok(F.CASES.filter(c => c.mode === 'witness').length >= 4 && F.CASES.filter(c => c.mode === 'council').length >= 4 && F.CASES.some(c => c.mode === 'self'), 'الأشكال الثلاثة كلها مستعملة');
ok(F.CASES.map(c => c.id).join() === 'aib,qabd,bayatan,kharaj,salam,majlis,shart,talaqqi,najsh,murabaha,iqala,urbun,talaf,ma_la_yamlik,sobra,jawaih,qudra,khulf,tadlis,ala_bay,riba_fadl,ikrah,jahala,hadir,ina,gharar,thamar,daynbidayn,tasir,nasia,sarf,taqsit,wada,istisna,tawliya,shartfasid,rahn,kafala,hawala,taflis,shufa,sharika,ijara,hayawan,maa,ajir_tafrit,ajir_afa,sulh', 'ترتيب المسائل ومعرّفاتها');
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
  const nxt = runTo(S, 'mj', 80); ok(nxt && nxt.c === 'majlis', 'بصعوبة ١ في المستوى ٤: المسألة الثانية خيار المجلس');
  A.eventChoice(S, 'p' + F.CASES.find(c => c.id === 'majlis').ok); A.eventChoice(S, 'close'); const n3 = runTo(S, 'mj', 80); ok(n3 && n3.c === 'najsh', 'ثم النجش (صعوبة ١)'); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === 'najsh').ok); A.eventChoice(S, 'close'); const n4 = runTo(S, 'mj', 80); ok(n4 && n4.c === 'iqala', 'ثم الإقالة (صعوبة ١)'); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === 'iqala').ok); A.eventChoice(S, 'close'); const n5 = runTo(S, 'mj', 80); ok(n5 && n5.c === 'tadlis', 'ثم التدليس (صعوبة ١)'); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === 'tadlis').ok); A.eventChoice(S, 'close'); const n6 = runTo(S, 'mj', 80); ok(n6 && n6.c === 'ikrah', 'ثم الإكراه (صعوبة ١)'); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === 'ikrah').ok); A.eventChoice(S, 'close'); const n7 = runTo(S, 'mj', 80); ok(n7 && n7.c === 'sulh', 'ثم الصلح (صعوبة ١)'); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === 'sulh').ok); A.eventChoice(S, 'close'); ok(!runTo(S, 'mj', 80), 'بعد المسائل السهلة السبع لا شيء في المستوى ٤');
  S.learn.level = S.learn.intro = 6; const ev2 = runTo(S, 'mj', 80); ok(ev2 && ev2.c === 'qabd', 'عند المستوى ٦ تظهر مسألة بيع المبيع قبل قبضه');
  const b0 = S.learn.mj.baraka, wrong = (cs2 => (cs2.ok + 1) % 3)(F.CASES.find(c => c.id === 'qabd')); r = A.eventChoice(S, 'p' + wrong);
  ok(r.ok === false && S.learn.mj.baraka === b0 && S.learn.mj.seen.qabd.ok === false && S.learn.eq[0].right === false, 'الإجابة الخاطئة: لا بركة، وتُسجَّل في الدفتر للتعلّم');
  A.eventChoice(S, 'close');
  const L2 = E.load(E.save(S)); ok(L2.learn.mj.baraka === S.learn.mj.baraka && L2.learn.mj.seen.aib && L2.learn.mj.seen.qabd && !L2.learn.mj.seen.kharaj, 'الحفظ والتحميل يبقيان الدفتر');
  S.learn.level = S.learn.intro = 8; let got = []; for (let k = 0; k < 55; k++) { const e = runTo(S, 'mj', 80); if (!e) break; got.push(e.c); A.eventChoice(S, 'p' + F.CASES.find(c => c.id === e.c).ok); A.eventChoice(S, 'close'); }
  ok(got.length === 40 && new Set(got).size === 40 && !got.includes('aib'), 'عند المستوى ٨ تظهر الأربعون الباقية (غير ما مضى) مرة واحدة لكل مسألة (' + got.join('،') + ')'); }
// الطلب من حدث حقيقي: مسألة تسبق غيرها إن كانت بصعوبة مسموحة
{ const S = mk(5, 8); S.learn.mj.want = 'talaf'; S.learn.ex = { broker: -99, friend: -99, luck: -99, mj: -99 }; const e = runTo(S, 'mj', 80); ok(e && e.c === 'talaf', 'المسألة المطلوبة من حدث حقيقي تُعرض أولاً'); const T = mk(5, 4); T.learn.mj.want = 'urbun'; const e2 = runTo(T, 'mj', 80); ok(e2 && e2.c === 'aib', 'المسألة المطلوبة الأصعب من المستوى لا تتقدم على السهلة');
  const U = mk(6, 4); U.learn.ex = { broker: -99, friend: -99, luck: -99, mj: -99 }; U.day = 10; const g0 = U.player.gold; const r = A.mjNow(U); ok(r.ok !== false && U.learn.eq[0].id === 'mj' && U.learn.eq[0].c === 'aib' && U.learn.ex.mj === U.day, 'قراءة مسألة الأسبوع من الدفتر تفتح المسألة وتعيد جدولة المجلس'); ok(A.mjNow(U).ok === false, 'لا فتح مسألة والحدث قائم'); ok(U.player.gold === g0, 'بلا أثر مالي'); }
// خبر مسألة الأسبوع قبل الموعد
{ const S = mk(7, 4); S.learn.ex = { broker: -99, friend: -99, luck: -99, mj: S.day }; let seen = false; for (let i = 0; i < 30; i++) { E.tick(S); S.pause = false; if (S.learn.eq.length) S.learn.eq.shift(); if (S.news.some(n => /مسألة تُناقش قريباً في مجلس السوق/.test(n.t))) { seen = true; break; } } ok(seen, 'يظهر خبر مسألة الأسبوع قبل موعد المجلس'); }
// حفظ قديم بلا الدفتر
{ const S = mk(4, 5); const old = JSON.parse(E.save(S)); delete old.learn.mj; const L = E.load(JSON.stringify(old)); ok(L && L.learn.mj && L.learn.mj.baraka === 0, 'حفظ قديم بلا دفتر يُرحَّل بسلام'); }
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
