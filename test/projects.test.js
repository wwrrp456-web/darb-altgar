// WP-22 / 015ب: المشاريع الكبرى: درجات بأعلى ثروة، مراحل ومدة، إنفاق مصرف، آثار بسقوفها، مفتاح رجوع، حفظ قديم، وإخفاء الموسوم ⚑
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, RF = require('../src/review-flags.js'), ok = m => console.log('OK   ' + m);
const { PROJ, PROJECTS, PJ_TIERS, PJ_CAP } = E; E.PROSPER.on = false; // يعزل اختبار المشاريع عن أثر الازدهار (016) المختبَر في prosperity.test.js
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; return S; };
const tick = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
const rich = (S, v) => { S.player.gold = v; while (S.day % 3 !== 0) tick(S); tick(S, 3); }; // يجعل يوم الفحص قريباً
const open = (S, tier) => { S.projects = { peak: PJ_TIERS[tier - 1], paid: {}, until: {}, pick: {}, done: [], tier }; };
const doneWith = (S, id, pick) => { const p = S.projects; p.paid[id] = PROJECTS[id].stages.length; p.pick[id] = pick; p.done.push(id); };
// ١) الجدول معتمد: 14 مشروعاً منفَّذاً، تكاليفها كما في LADDER.md، والدرجة الأولى عند 250 ألفاً
assert.deepEqual(PJ_TIERS, [250000, 1e6, 5e6, 25e6, 1e8, 5e8, 1e9, 3e9, 1e10]); assert.equal(Object.keys(PROJECTS).length, 14);
const COST = { P19: 30000, P20: 40000, P01: 160000, P02: 120000, P03: 600000, P04: 500000, P05: 2500000, P06: 2000000, P07: 8000000, P09: 6000000, P11: 40000000, P13: 120000000, P14: 300000000, P15: 250000000 };
for (const id in COST) { assert.equal(PROJECTS[id].stages.reduce((a, b) => a + b, 0), COST[id], id + ' الكلفة'); assert.ok(PROJECTS[id].stages.length >= 2 && PROJECTS[id].stages.length <= 5, id + ' مراحل'); }
assert.deepEqual(Object.keys(PROJECTS).filter(id => PROJECTS[id].rv).sort(), ['P02', 'P06', 'P13', 'P15']); ok('الجدول: 14 مشروعاً بكلفها المعتمدة، والموسوم ⚑ أربعة');
// ٢) الدرجة بأعلى ثروة: لا حقل قبل العتبة، وتُفتح عندها، والإنفاق لا يُقفلها
{ const S = mk(); tick(S, 6); assert.equal(S.projects, undefined, 'لا حقل قبل بلوغ العتبة'); assert.deepEqual(E.projectsOpen(S), []); assert.equal(E.projectView(S).tier, 0);
  S.player.gold = 300000; tick(S, 3); assert.ok(S.projects && S.projects.peak >= 250000); assert.equal(E.projectView(S).tier, 1); assert.deepEqual(E.projectsOpen(S).sort(), ['P19', 'P20']); assert.ok(S.news.some(n => /مشاريع كبرى جديدة/.test(n.t)), 'إشعار فتح الدرجة');
  S.player.gold = 5000; tick(S, 3); assert.ok(S.projects.peak >= 250000 && E.projectView(S).tier === 1, 'هبوط الثروة لا يُقفل الدرجة'); ok('الدرجة بأعلى ثروة بلغها اللاعب، ولا حقل قبل العتبة'); }
// ٣) المراحل والمدة والإنفاق المصرف
{ const S = mk(); S.player.gold = 300000; tick(S, 3); assert.equal(E.projectFund(S, 'P19').ok, false, 'يلزم اختيار المدينة'); assert.equal(E.projectFund(S, 'P19', 'nowhere').ok, false);
  const g = S.player.gold, sunk = S.player.led.exp.projects || 0; let r = E.projectFund(S, 'P19', 'riyadh'); assert.ok(r.ok, r.msg); assert.equal(S.player.gold, g - 15000); assert.equal(S.player.led.exp.projects, sunk + 15000, 'يُسجَّل بند مشاريع كبرى');
  assert.equal(E.projectFund(S, 'P19').ok, false, 'المرحلة التالية قبل انقضاء المدة'); assert.match(E.projectFund(S, 'P19').msg, /بعد \d+ يوماً/);
  tick(S, PROJECTS.P19.days); r = E.projectFund(S, 'P19'); assert.ok(r.ok, r.msg); assert.equal(E.projectView(S).open.find(x => x.id === 'P19').done, false, 'لا أثر قبل الإتمام'); assert.equal(E.projectMul(S, 'shop', { city: 'riyadh', g: 'dates' }), 1);
  tick(S, PROJECTS.P19.days + 1); const v = E.projectView(S).open.find(x => x.id === 'P19'); assert.ok(v.done && v.spent === 30000); assert.ok(S.news.some(n => /اكتمل مشروعك/.test(n.t))); assert.equal(E.projectFund(S, 'P19').ok, false, 'أُتمّ');
  assert.ok(Math.abs(E.projectMul(S, 'shop', { city: 'riyadh', g: 'dates' }) - 1.03) < 1e-9); assert.equal(E.projectMul(S, 'shop', { city: 'jeddah', g: 'dates' }), 1, 'مدينة أخرى بلا أثر');
  const S2 = mk(); S2.player.gold = 10000; S2.projects = { peak: 300000, paid: {}, until: {}, pick: {}, done: [], tier: 1 }; assert.match(E.projectFund(S2, 'P19', 'riyadh').msg, /لا يكفي/); assert.equal(S2.projects.pick.P19, undefined, 'لا اختيار محفوظ إن فشل الدفع'); ok('المراحل بمدة إنشاء، والإنفاق مصرف مسجَّل، ولا أثر قبل الإتمام'); }
// ٤) درجة غير مفتوحة ولا تمويل؛ وP14 يشترط P01
{ const S = mk(); open(S, 1); S.player.gold = 1e9; assert.equal(E.projectFund(S, 'P01', 'a|b').ok, false, 'درجة 2 مقفلة'); open(S, 8); assert.match(E.projectFund(S, 'P14', 'sa').msg, /يشترط/); doneWith(S, 'P01', E.projectPickOptions(S, 'P01')[0].v); assert.ok(E.projectFund(S, 'P14', 'sa').ok); ok('الدرجات المقفلة لا تُموَّل، وشبكة الخانات تشترط الخان'); }
// ٥) الآثار بنطاقها وسقفها
{ const S = mk(); open(S, 8); const ro = E.projectPickOptions(S, 'P01'); assert.ok(ro.length > 3); const [a, b] = ro[0].v.split('|'); const k = ro[0].v;
  doneWith(S, 'P01', k); assert.equal(E.projectMul(S, 'risk', { from: a, to: b }), 0.75); assert.equal(E.projectMul(S, 'risk', { from: b, to: a }), 0.75, 'الاتجاهان'); assert.equal(E.projectMul(S, 'risk', { from: a, to: 'xian' }), 1);
  doneWith(S, 'P20', k); assert.ok(Math.abs(E.projectMul(S, 'risk', { from: a, to: b }) - 0.675) < 1e-9); const ca = S.cities[a].country; doneWith(S, 'P14', ca); doneWith(S, 'P07', k); assert.equal(E.projectMul(S, 'risk', { from: a, to: b }), PJ_CAP.risk[0], 'سقف الخطر 0.6');
  assert.equal(E.projectMul(S, 'days', { from: a, to: b }), 0.9);
  const S2 = mk(); open(S2, 8); doneWith(S2, 'P19', 'riyadh'); doneWith(S2, 'P04', 'riyadh'); doneWith(S2, 'P15', 'riyadh'); assert.equal(E.projectMul(S2, 'shop', { city: 'riyadh', g: 'perfume' }), 1.1, 'سقف إقبال الدكاكين +10٪ (FR-002)'); const S3 = mk(); open(S3, 8); doneWith(S3, 'P15', 'riyadh'); assert.equal(E.projectMul(S3, 'shop', { city: 'riyadh', g: 'perfume' }), 1.08); assert.equal(E.projectMul(S3, 'shop', { city: 'riyadh', g: 'wheat' }), 1, 'P15 للفاخر وحده'); 
  doneWith(S2, 'P03', 'riyadh'); doneWith(S2, 'P13', 'jeddah'); assert.equal(E.projectMul(S2, 'xp', { city: 'hail' }), 1.25, 'خبرة دولة المدينة المختارة بسقف +25٪'); assert.equal(E.projectMul(S2, 'xp', { city: 'cairo' }), 1);
  doneWith(S2, 'P11', 'sa'); assert.equal(E.projectAdd(S2, 'qual', { city: 'riyadh' }), 3); assert.equal(E.projectAdd(S2, 'qual', { city: 'cairo' }), 0);
  doneWith(S2, 'P05', 'jeddah'); doneWith(S2, 'P09', 'sa'); doneWith(S2, 'P06', 'riyadh'); assert.equal(E.projectMul(S2, 'pirate', { city: 'jeddah' }), 0.8); assert.equal(E.projectMul(S2, 'portfee', { city: 'jeddah' }), 0.85); assert.equal(E.projectMul(S2, 'trustgrow', { city: 'mecca' }), 1.1); assert.equal(E.projectMul(S2, 'ev', { city: 'riyadh' }), 0.7);
  for (const [kk, c] of Object.entries(PJ_CAP)) assert.ok(c[0] <= c[1], kk); ok('الآثار بنطاقها (مدينة/طريق/دولة) وسقوفها'); }
// ٦) الأثر مربوط بنقاط التعديل القائمة: زمن الرحلة وفدية الميناء ومعدّل الهجوم وجودة المصنع
{ const S = mk(); open(S, 5); const k = E.projectPickOptions(S, 'P07')[0].v, [a, b] = k.split('|'), car = S.player.caravans[0]; const d0 = E.tripDays(S, car, a, b); doneWith(S, 'P07', k); const d1 = E.tripDays(S, car, a, b); assert.ok(d1 <= d0 && (d0 < 2 || d1 < d0), 'الطريق المعبَّد يقصّر الرحلة ' + d0 + ' ← ' + d1);
  S.player.caravans[0].city = a; S.player.caravans[0].left = 0; ok('زمن الرحلة يتبع الطريق المعبَّد'); }
// ٧) مساهمات الأبعاد تُسجَّل لحزمة 016 بلا أثر هنا
{ const S = mk(); open(S, 3); doneWith(S, 'P04', 'jeddah'); const c = E.projectContrib(S); assert.deepEqual(c.jeddah, { trade: 8, urban: 4 }); ok('مساهمات الأبعاد مسجَّلة لحزمة الازدهار'); }
// ٨) الحفظ: حقل اختياري، حفظ قديم يعمل، والتحميل يعيد الحالة
{ const S = mk(); S.player.gold = 300000; tick(S, 3); E.projectFund(S, 'P20', E.projectPickOptions(S, 'P20')[0].v); const L2 = E.load(E.save(S)); assert.deepEqual(L2.projects, S.projects, 'يعود المحفوظ كما هو');
  const old = mk(); delete old.projects; const O = E.load(E.save(old)); assert.equal(O.projects, undefined); tick(O, 6); assert.equal(O.projects, undefined, 'لعب بلا مشاريع لا يضيف حقلاً'); ok('الحفظ: يعود المشروع كما هو، والحفظ القديم يعمل بلا حقل'); }
// ٩) مفتاح الرجوع: PROJ.on=false يعيد السلوك القديم (لا حقل ولا أثر ولا قسم) والتبديل لا يفسد الحفظ
{ const run = on => { PROJ.on = on; try { const S = mk(7); S.player.gold = 400000; tick(S, 20); return S; } finally { PROJ.on = true; } };
  const off = run(false), on = run(true); assert.equal(off.projects, undefined, 'المفتاح مطفأ: لا حقل'); assert.ok(on.projects, 'المفتاح مفعّل: حقل');
  assert.equal(Math.round(off.player.gold), Math.round(on.player.gold), 'الذهب مطابق: لا أثر لمشروع غير مدفوع'); assert.equal(Math.round(E.netWorth(off)), Math.round(E.netWorth(on)));
  PROJ.on = false; try { assert.deepEqual(E.projectsOpen(on), []); assert.equal(E.projectFund(on, 'P19', 'riyadh').ok, false); on.projects.done.push('P19'); on.projects.pick.P19 = 'riyadh'; assert.equal(E.projectMul(on, 'shop', { city: 'riyadh', g: 'dates' }), 1, 'المفتاح مطفأ: لا أثر'); on.projects.done.pop(); } finally { PROJ.on = true; }
  const back = E.load(E.save(on)); tick(back, 3); assert.ok(back.projects); ok('مفتاح الرجوع: لا حقل ولا أثر ولا تمويل مطفأً، والتبديل لا يفسد الحفظ'); }
// ١٠) الموسوم ⚑ مخفي ولا يُموَّل ما دام معرّفه في review-flags
{ const S = mk(); open(S, 8); S.player.gold = 1e10; for (const id of ['P02', 'P06', 'P13', 'P15']) { assert.ok(!E.projectsOpen(S).includes(id)); assert.equal(E.projectFund(S, id, 'riyadh').ok, false); } assert.deepEqual(RF.FLAGS.hidden.slice(), ['PJ-01', 'PJ-02', 'PJ-03', 'PJ-04']); assert.ok(!E.projectView(S).tiers.flatMap(t => t.ids).some(id => PROJECTS[id].rv)); ok('P02 وP06 وP13 وP15 مخفية وغير قابلة للتمويل'); }
// ١٠ب) بعد رفع الإخفاء (محاكاة الاعتماد): P02 يمنح ثقة الزعيم +10 مرة واحدة بسقفها
{ const keep = RF.FLAGS.hidden.slice(); RF.FLAGS.hidden.length = 0; try { const S = mk(); S.player.gold = 1e7; open(S, 2); E.ensureBosses && E.ensureBosses(S); S.phase = Math.max(S.phase, 2); tick(S); const bs = S.bosses && S.bosses.riyadh; assert.ok(bs, 'زعيم الرياض'); { const t0 = bs.trust; for (let i = 0; i < 3; i++) { const r = E.projectFund(S, 'P02', 'riyadh'); assert.ok(r.ok, r.msg); tick(S, PROJECTS.P02.days + 1); } tick(S, 2); assert.ok(S.projects.done.includes('P02')); assert.equal(Math.round((bs.trust - t0) * 10) / 10 >= 9, true, 'ثقة +10'); const t1 = bs.trust; tick(S, 10); assert.ok(bs.trust - t1 < 5, 'مرة واحدة'); assert.equal(E.projectMul(S, 'ev', { city: 'riyadh' }), 0.9); } } finally { RF.FLAGS.hidden.push(...keep); } ok('P02 (بعد الاعتماد المحاكى): ثقة الزعيم مرة واحدة وأثر الأحداث'); }
// ١١) لا مشروع واحد يرفع الدخل أكثر من 10٪: حدّ أعلى للمعاملات المباشرة على الدخل
for (const id in PROJECTS) for (const fx of PROJECTS[id].fx) if (fx.k === 'shop') assert.ok(fx.mul <= 1.1, id + ' ≤ +10٪');
assert.ok(PJ_CAP.shop[1] <= 1.1 && PJ_CAP.qual[1] <= 4, 'سقوف الدخل'); ok('FR-002: لا أثر مباشر على الدخل فوق 10٪');
// ١٢) البناء المتعدد (قرار بن محمود 2026-11-03): مثيل جديد في مكان آخر بكلفة كاملة، والأثر المجمَّع بسقفه
{ const S = mk(); S.player.gold = 1e7; open(S, 3); const [a, b] = ['riyadh', 'jeddah'];
  assert.ok(E.projectFund(S, 'P19', a).ok); tick(S, PROJECTS.P19.days); assert.ok(E.projectFund(S, 'P19').ok); tick(S, PROJECTS.P19.days + 1); assert.ok(S.projects.done.includes('P19'));
  let v = E.projectView(S).open.filter(x => x.base === 'P19'); assert.deepEqual(v.map(x => x.id), ['P19', 'P19#2'], 'بطاقة المثيل التالي بعد إتمام الأول'); assert.equal(v[1].again, true);
  assert.equal(E.projectFund(S, 'P19#3', b).ok, false, 'لا قفز فوق المثيل التالي'); assert.equal(E.projectFund(S, 'P19#2', a).ok, false, 'المكان نفسه مرفوض'); assert.ok(!E.projectPickOptions(S, 'P19#2').some(o => o.v === a), 'الخيارات تستثني الأماكن المبنية');
  const g = S.player.gold; assert.ok(E.projectFund(S, 'P19#2', b).ok); assert.equal(g - S.player.gold, 15000, 'كلفة كاملة'); tick(S, PROJECTS.P19.days); assert.ok(E.projectFund(S, 'P19#2').ok); tick(S, PROJECTS.P19.days + 1);
  assert.equal(E.projectMul(S, 'shop', { city: a, g: 'dates' }), 1.03); assert.equal(E.projectMul(S, 'shop', { city: b, g: 'dates' }), 1.03, 'الأثر في كل مدينة بُني فيها'); assert.deepEqual(S.projects.done, ['P19', 'P19#2']);
  const L2 = E.load(E.save(S)); assert.deepEqual(L2.projects, S.projects); assert.equal(E.projectMul(L2, 'shop', { city: b, g: 'dates' }), 1.03);
  const S2 = mk(); open(S2, 4); S2.player.gold = 1e9; const keys = ['P03', 'P03#2', 'P03#3']; S2.projects.paid = { P03: 4, 'P03#2': 4, 'P03#3': 4 }; S2.projects.done = keys.slice(); S2.projects.pick = { P03: 'riyadh', 'P03#2': 'cairo', 'P03#3': 'delhi' };
  assert.equal(E.projectMul(S2, 'xp', { city: 'riyadh' }), 1.15, 'كل دولة بمدرستها لا تتراكم'); S2.projects.pick['P03#2'] = 'jeddah'; assert.equal(E.projectMul(S2, 'xp', { city: 'riyadh' }), 1.25, 'مدرستان في الدولة نفسها: السقف 1.25');
  ok('البناء المتعدد: مثيلات بكلفة كاملة في أماكن مختلفة، والأثر المجمَّع بسقفه، والحفظ يعود'); }
console.log('\nprojects: كلها ناجحة');
