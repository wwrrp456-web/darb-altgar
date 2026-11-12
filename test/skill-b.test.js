// 035ب: قدرات الدكاكين والمستودع والأمين بالدرجة، سجل الحاجات، وضعا الدكان، الميزانية، التجربة، اقتراح التوظيف: node test/skill-b.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { E, load, rich, run, hash, withSteward, rvClean } = require('./lib/skill-sim.js');
E.LEVY.on = true; // 040أ: بصمات 035 مجمّدة والرسم القديم قائم فيها؛ الاختبار يخص المهارة لا الرسم
E.RIVALGEN.cont = false; E.MFUND.on = false; E.MFUND.spend = false; E.SHOPCOND.on = false; E.LIQ.on = false; // 040: بصمات قديمة تُثبَّت على السلوك السابق
E.RIVALW.on = false; // 040ح: ثروة المنافسين مطفأة في بصمات 035 (لا rv.w ولا rv.kn في الحفظ)
E.CHIEFX.on = false; /* 035ج: كبير الرعاة بلا ch.x ولا f.tr */ E.FARMX.on = false; E.MGRX.on = false; /* 035ج2: رئيس المزرعة ومدير المصنع والمزارع بلا m.x ولا ملاءمة */ E.HOMEST.on = false; E.DELEG.on = false; // 043أ: بلا مهام مفوَّضة ولا حقول جديدة؛ 042: بصمات قديمة بلا لقطات «حال أعمالي»؛ لا P.hs يُكتب في الحفظ عند الإطفاء
E.GRIEF.on = false; E.GRIEF.major.on = false; E.INFLU.mediate.on = false; E.INFLU.tazkiya.on = false; E.TASKS.on = false; E.INFLU.fam.road = false; /* 036هـ: عقود الطرق والمواسم مطفأة في البصمات */ // 038: بصمات قديمة بلا مهام؛ لا P.tk2 يُكتب في الحفظ عند الإطفاء
{ const S0 = run(rich(load()), 10); a.equal(S0.player.tk2, undefined, '038: P.tk2 لا يُكتب عند TASKS.on=false'); a.ok(!('tk2' in JSON.parse(E.save(S0)).player), '038: لا حقل جديد في الحفظ عند الإطفاء'); }
{ const S0 = run(rich(load()), 10); a.equal(S0.player.hs, undefined, '042: P.hs لا يُكتب عند HOMEST.on=false'); a.ok(!('hs' in JSON.parse(E.save(S0)).player), '042: لا حقل جديد في الحفظ'); }
const ok = m => console.log('OK   ' + m), base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/skill-b-baseline.json'), 'utf8'));
const scene = (f = 'skill-save-a23') => { const S = withSteward(rich(load(f))); S.noShocks = true; E.skillMigrate(S); const city = Object.keys(S.player.props)[0], pr = S.player.props[city], sh = pr.shops[0], m = pr.mgr; return { S, city, pr, sh, m, c: S.cities[city] }; };
const idleScene = (mode) => { const x = scene(); x.sh.items = [{ g: 'wool', price: 3, auto: false, carry: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 20, lastSold: 0 }]; x.pr.store.wool = 60; if (mode) x.sh.mode = mode; E.tick(x.S, false); x.sh.items[0].idleDays = 20; return x; };
const on0 = [E.SKILLB.on, { ...E.SKILLB.caps }];
try {
  // ١) المطفأ = السلوك السابق حرفياً (بصمة بذرتين)؛ وكل القدرات مطفأة بمفتاح واحد لكل منها
  E.SHOPCOND.on = false; E.LOANPLEDGE.on = false; E.LOANPLEDGE.ask = false; // بصمات ما قبل 035ب تسبق 040هـ و041أ
  for (const mode of ['all', 'caps']) { if (mode === 'all') E.SKILLB.on = false; else { E.SKILLB.on = true; for (const k of Object.keys(E.SKILLB.caps)) E.SKILLB.caps[k] = false; }
    for (const [k, f] of [['a23', 'skill-save-a23'], ['a18', 'skill-save-a18']]) { const S = withSteward(rich(load(f))); E.skillMigrate(S); run(S, base.days); a.equal(hash(S), base[k].h, `مطابقة ${mode} ${f}`); a.ok(rvClean(S), '040ح: لا حقول ثروة منافسين في الحفظ'); } }
  E.SHOPCOND.on = true; E.LOANPLEDGE.on = true; E.LOANPLEDGE.ask = true; E.SKILLB.on = on0[0]; Object.assign(E.SKILLB.caps, on0[1]); ok('SKILLB.on=false وكل مفاتيح القدرات مطفأة = بصمة ما قبل 035ب حرفياً (بذرتان × 150 يوماً)');
  // ٢) التسعير بالدرجة: الدنيا والوسطى كما كانت، والعليا أدق
  { const q = g => E.sbPrice({ sk: { g } }, 0.05, 1.1); a.deepEqual([1, 2, 3].map(q), [{ step: 0.05, min: 1.1 }, { step: 0.05, min: 1.1 }, { step: 0.05, min: 1.1 }], 'الدرجات 1–3 كما كانت'); a.deepEqual(q(4), { step: 0.04, min: 1.05 }); a.deepEqual(q(5), { step: 0.03, min: 1.05 });
    const lowest = g => { const x = scene(); x.pr.mgr = { rank: 2, lv: 1, id: 900, asset: { kind: 'shop', id: x.sh.id }, wage: 20, days: 100, since: 0, audit: 0, late: 0, sk: { g, xp: 0, home: 'sale', spec: {}, m: 1, wk: 0 } }; x.sh.items = [{ g: 'wool', price: 1.12, auto: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, lastSold: 0, idleDays: 5 }]; const it = x.sh.items[0]; for (let i = 0; i < 22; i++) { it.lastSold = 0; x.pr.store.wool = 55; E.tick(x.S, false); } return it.price; };
    a.ok(lowest(3) >= 1.1 - 1e-9 && lowest(3) < 1.15, 'ماهر لا ينزل عن 1.1: ' + lowest(3)); a.ok(lowest(4) < 1.1 - 1e-9 && lowest(4) >= 1.05 - 1e-9, 'خبير يصل 1.05: ' + lowest(4)); }
  ok('التسعير: الدرجات 1–3 خطوة 0.05 وحدّ 1.1 كما كانت، والخبير 0.04 وحدّ 1.05، وشيخ الصنعة 0.03');
  // ٣) عتبات الأمين بالدرجة: الماهر = 017 حرفياً
  { const m = g => ({ sk: { g } }); a.deepEqual([sbs(m(3), 'Shop'), sbs(m(3), 'Store'), sbs(m(3), 'Qty')], [E.SKILLB && 14, 30, 40], 'الماهر كما في 017'); a.deepEqual([sbs(m(4), 'Shop'), sbs(m(4), 'Store'), sbs(m(4), 'Qty')], [10, 21, 60]); a.deepEqual([sbs(m(5), 'Shop'), sbs(m(5), 'Store'), sbs(m(5), 'Qty')], [7, 14, 80]);
    E.SKILLB.on = false; a.deepEqual([sbs(m(5), 'Shop'), sbs(m(5), 'Store'), sbs(m(5), 'Qty')], [14, 30, 40], 'المطفأ: 017 حرفياً'); E.SKILLB.on = true; }
  ok('عتبات الأمين: ماهر 14/30/40 (017)، خبير 10/21/60، شيخ 7/14/80؛ والمطفأ 017');
  // ٤) مراعاة الموسم: لا يدوّر الأمين سلعة موسمها قائم أو قريب ويشرح السبب
  { const x = scene(); x.S.noShocks = false; x.S.learn.level = 11; x.sh.items = [{ g: 'wool', price: 3, auto: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 20, lastSold: 0 }]; x.pr.store.wool = 60;
    const hold = E.sbSeasonHold(x.S, x.c, 'wool', x.m); if (!hold) { while (!E.sbSeasonHold(x.S, x.c, 'wool', x.m)) x.S.day++; } const h = E.sbSeasonHold(x.S, x.c, 'wool', x.m); a.ok(h && /الشتاء|الصوف|برد/.test(h.name + ''), 'موسم قريب للصوف: ' + JSON.stringify(h));
    E.tick(x.S, false); x.sh.items[0].idleDays = 20; E.tick(x.S, false); a.equal(x.sh.items[0].g, 'wool', 'لم يدوّر'); const said = (x.S.player.mgrActions || []).find(z => z.kind === 'hold'); a.ok(said && /لم أدوّر صوف لأن/.test(said.why), 'السبب بلغة بسيطة: ' + (said && said.why));
    x.m.sk.g = 2; a.equal(E.sbSeasonHold(x.S, x.c, 'wool', x.m), null, 'المتمرّس لا يراعي الموسم'); }
  ok('الأمين الماهر فأعلى يراعي الموسم ويقول «لم أدوّر صوف لأن برد الشتاء…»؛ ودون ذلك لا');
  // ٥) وضع «اقترح عليّ»: اقتراح بلا تغيير، رفض بلا أثر، اعتماد يُنفَّذ مرة واحدة ولا يتكرر بعد إعادة التحميل
  { const x = idleScene('suggest'); E.tick(x.S, false); const p = E.sbNeeds(x.S).find(n => n.kind === 'trial' && n.state === 'open'); a.ok(p, 'اقتراح مفتوح'); a.equal(x.sh.items[0].g, 'wool', 'لم يتغير الرف'); a.ok(/لم تُبَع/.test(p.why) && /وحدة/.test(p.why), 'الشرح: ' + p.why);
    const gold0 = x.S.player.gold, i = p.id; const dec = E.A.mgrDecline(x.S, i); a.ok(dec.ok && x.S.player.gold === gold0 && x.sh.items[0].g === 'wool', 'الرفض لا يصرف ولا يغيّر'); a.equal(E.A.mgrApprove(x.S, i).ok, false, 'المرفوض لا يُنفَّذ');
    const y = idleScene('suggest'); E.tick(y.S, false); const q = E.sbNeeds(y.S).find(n => n.kind === 'trial' && n.state === 'open'); const r = E.A.mgrApprove(y.S, q.id); a.ok(r.ok, r.msg); a.equal(y.sh.items[0].g, q.g, 'الاعتماد يبدّل الرف'); a.equal(y.sh.trial.state, 'run'); a.equal(E.A.mgrApprove(y.S, q.id).ok, false, 'لا تنفيذ مزدوج');
    const back = E.loadChecked(E.save(y.S)).S; const bn = E.sbNeeds(back).find(n => n.id === q.id); a.equal(bn.state, 'done', 'الحالة تُحفظ'); a.equal(E.A.mgrApprove(back, q.id).ok, false, 'لا تنفيذ بعد إعادة التحميل'); const sh2 = back.player.props[y.city].shops[0]; a.equal(sh2.trial.to, q.g); }
  ok('اقترح عليّ: اقتراح مشروح بلا تغيير، الرفض بلا صرف، الاعتماد مرة واحدة، والحالة تُحفظ بلا تنفيذ مزدوج بعد إعادة التحميل');
  // ٦) وضع «تصرّف ضمن حدودي»: يجرّب بنفسه ضمن ميزانية التجربة، والاحتياطي لا يُمس
  { const x = idleScene('act'); E.tick(x.S, false); a.ok(x.sh.trial && x.sh.trial.state === 'run', 'بدأت تجربة'); const B = E.sbBudget(x.S, x.city); a.ok(x.S.player.gold >= B.reserve, 'الاحتياطي محفوظ'); a.ok(x.pr.store.wool >= 1, 'بضاعة الرف القديم بقيت في المخزن'); a.equal(x.sh.items[0].target, E.SKILLB.trial.units, 'تعبئة صغيرة للتجربة');
    const z = idleScene('act'); z.S.player.gold = E.sbBudget(z.S, z.city).reserve + 10; E.tick(z.S, false); a.ok(!z.sh.trial, 'لا تجربة بلا ميزانية'); a.ok(z.sh.items[0].g === 'wool'); }
  ok('تصرّف ضمن حدودي: تجربة صغيرة، البضاعة القديمة تبقى، لا تجربة إن لم تكفِ الميزانية ولا يُمس الاحتياطي');
  // ٧) التجربة: 14 يوماً مؤهلاً؛ الأيام غير المؤهلة لا تُحتسب؛ نجاح يُبقي، وفشل يُرجع القديم؛ قفل 14 يوماً
  { const mk = () => { const x = idleScene('act'); E.tick(x.S, false); const t = x.sh.trial; t.base = 100; return { x, t, it: x.sh.items.find(i => i.g === t.to) }; };
    { const { x, t, it } = mk(); const day = (units, have0, sf = 1) => { E.sbDay(x.S, x.sh, it, units, have0, 2, 0.05, x.pr, t.to, sf); }; for (let i = 0; i < 10; i++) day(0, 0); for (let i = 0; i < 4; i++) day(0, 5, 0); a.equal(t.q, 0, 'نفاد المخزون وغياب البائع لا يُحتسبان'); a.equal(t.skipped.stock, 10); a.equal(t.skipped.seller, 4);
      for (let i = 0; i < 13; i++) day(10, 20); E.sbShopDay(x.S, x.city, x.pr); a.equal(t.state, 'run', 'قبل 14 مؤهلاً لا تقييم'); day(10, 20); E.sbShopDay(x.S, x.city, x.pr);
      a.ok(['ok', 'failed'].includes(t.state), 'تُقيَّم بعد 14 يوماً مؤهلاً'); }
    { const { x, t, it } = mk(); t.base = 1; for (let i = 0; i < 14; i++) E.sbDay(x.S, x.sh, it, 50, 60, 2, 0.05, x.pr, t.to, 1); E.sbShopDay(x.S, x.city, x.pr); a.equal(t.state, 'ok', 'ربح أفضل: تبقى'); a.equal(x.sh.items.some(i => i.g === t.to), true); a.equal(it.target, 60, 'يعود التعبئة الكاملة'); a.ok(x.sh.trialLock >= x.S.day + 14, 'قفل 14 يوماً'); }
    { const { x, t, it } = mk(); const oldG = t.from; t.base = 1e9; for (let i = 0; i < 14; i++) E.sbDay(x.S, x.sh, it, 0, 60, 2, 0.05, x.pr, t.to, 1); const store0 = JSON.stringify(x.pr.store); E.sbShopDay(x.S, x.city, x.pr); a.equal(t.state, 'failed', 'ركود بعد 14 مؤهلاً'); a.equal(x.sh.items[0].g, oldG, 'رجع القديم'); a.equal(JSON.stringify(x.pr.store), store0, 'لم تُمَسّ البضاعة'); const lg = (x.S.player.mgrActions || []).find(z => z.kind === 'trialEnd'); a.ok(lg && /لم تنجح تجربة/.test(lg.why) && /أرجعتُ/.test(lg.why), 'يشرح الفشل: ' + (lg && lg.why));
      x.sh.items[0].idleDays = 99; E.tick(x.S, false); a.equal(x.sh.trial.state, 'failed', 'لا تجربة جديدة خلال القفل'); a.equal(x.sh.items[0].g, oldG); } }
  ok('التجربة: الأيام غير المؤهلة (بلا مخزون/بلا بائع) تُستبعد وتُعلَن، تُقيَّم بعد 14 مؤهلاً، النجاح يُبقي والفشل يُرجع القديم بالشرح، وقفل 14 يوماً');
  // ٨) سجل الحاجات: طلب واحد لكل احتياج
  { const x = scene(); x.sh.items = [{ g: 'dates', price: 1.4, auto: true, buyBelow: 5, target: 200, sold: 0, revenue: 0, idleDays: 0, lastSold: 0 }]; x.pr.store.dates = 0; x.S.player.gold = 5e4; const r1 = E.A.officeRestock(x.S, x.city); const n1 = E.sbNeeds(x.S).filter(n => n.kind === 'stock').length;
    a.ok(n1 >= 1, 'سُجّل طلب'); const nd = E.sbNeeds(x.S).find(n => n.kind === 'stock' && n.g === 'dates'); a.equal(nd.state, 'done'); const before = x.pr.store.dates; // مصدر آخر في اليوم نفسه بلا إجبار: لا يشتري الاحتياج نفسه
    const gold1 = x.S.player.gold; E.restockShops(x.S, x.city); a.equal(x.S.player.gold, gold1, 'المصدر الثاني لم يصرف'); a.equal(x.pr.store.dates, before);
    const back = E.loadChecked(E.save(x.S)).S; a.ok(E.sbNeeds(back).some(n => n.id === nd.id && n.state === 'done'), 'السجل يُحفظ'); const g2 = back.player.gold; E.restockShops(back, x.city); a.equal(back.player.gold, g2, 'لا صرف مزدوج بعد إعادة التحميل'); }
  ok('سجل الحاجات: الاحتياج الذي نُفّذ اليوم لا يُشترى من مصدر آخر، ويُحفظ، ولا صرف مزدوج بعد إعادة التحميل');
  // ٩) الميزانية التعليمية: احتياطي 14 يوماً لا يُمس والباقي يُقسَّم بشرح
  { const x = scene(); const B = E.sbBudget(x.S, x.city); a.equal(B.reserve, Math.round(14 * (x.S.player.fixedEma || 0)), 'الاحتياطي = مستحقات 14 يوماً'); a.ok(B.trial <= B.spend && B.fill + B.trial === B.spend, 'التقسيم'); a.ok(/يغطي مستحقات 14 يوماً/.test(B.why), 'الشرح'); a.equal(E.A.budgetAccept(x.S, x.city, B.spend + 1).ok, false, 'أكبر من الفائض مرفوض'); a.ok(E.A.budgetAccept(x.S, x.city, 500).ok); a.equal(E.sbBudget(x.S, x.city).trial, 500); a.equal(E.sbBudget(x.S, x.city).accepted, true); }
  ok('الميزانية: الاحتياطي = مستحقات 14 يوماً، التقسيم بشرح، يعدّلها اللاعب ولا تتجاوز الفائض');
  // ١٠) اقتراح التوظيف اللطيف مرة واحدة
  { const S = rich(load('skill-save-a23')); S.noShocks = true; E.skillMigrate(S); const city = Object.keys(S.player.props)[0], pr = S.player.props[city]; pr.mgr = null; pr.whs = 2; pr.farm = pr.farm || null; while (E.teamAssets(S, city).length < 3) { pr.shops.push(JSON.parse(JSON.stringify(pr.shops[0]))); pr.shops[pr.shops.length - 1].id = S.nextId++; }
    delete S.player.hints; const news0 = (S.news || []).length; E.tick(S, false); a.ok(S.player.hints && S.player.hints.hire, 'ظهر التلميح'); const n1 = (S.news || []).filter(n => /ثقل العمل/.test(n.t || n.text || '')).length; E.tick(S, false); E.tick(S, false); a.equal((S.news || []).filter(n => /ثقل العمل/.test(n.t || n.text || '')).length, n1, 'مرة واحدة فقط'); a.ok(n1 === 1, 'رسالة واحدة'); E.SKILLB.caps.hint = false; const T = rich(load('skill-save-a23')); E.skillMigrate(T); const c2 = Object.keys(T.player.props)[0]; T.player.props[c2].mgr = null; T.player.props[c2].whs = 3; E.tick(T, false); a.ok(!(T.player.hints && T.player.hints.hire), 'المطفأ بلا تلميح'); E.SKILLB.caps.hint = true; }
  ok('اقتراح التوظيف: مرة واحدة فقط عند ثقل العمل، ومفتاحه يطفئه');
  // ١١) الحفظ القديم والفاسد
  { const S = rich(load('skill-save-a23')); S.player.needs = [{ id: 1, kind: 'trial', city: 'nope', state: 'open', day: 0 }, { id: 2, kind: 'stock', city: Object.keys(S.player.props)[0], state: 'bogus', day: 0 }, { id: 3, kind: 'stock', city: Object.keys(S.player.props)[0], state: 'reserved', day: 0, g: 'dates' }]; E.sbMigrate(S); a.equal(E.sbNeeds(S).length, 1, 'الفاسد يُسقَط'); a.equal(E.sbNeeds(S)[0].state, 'void', 'محجوز قديم يصير باطلاً'); const O = load('skill-save-a23'); a.ok(!O.player.needs, 'الحفظ القديم بلا needs يعمل'); E.tick(O, false); }
  ok('الحفظ القديم يعمل، والحقول الفاسدة تُسقَط');
  console.log('PASS skill-b: caps off identity, price/steward grades, season, modes, trial, ledger, budget, hint, save');
} finally { E.SKILLB.on = on0[0]; Object.assign(E.SKILLB.caps, on0[1]); }
function sbs(m, k) { return { Shop: E.sbIdleShop, Store: E.sbIdleStore, Qty: E.sbDayQty }[k](m); }
