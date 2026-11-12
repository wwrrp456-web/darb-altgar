// 035أ: كفاءة الإدارة (الأساس + إصلاح أمين المخزن + إصلاح مدير الممتلك المرقّى): node test/skill.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { E, load, rich, run, hash, rvClean } = require('./lib/skill-sim.js');
E.LEVY.on = true; // 040أ: بصمات 035 مجمّدة والرسم القديم قائم فيها؛ الاختبار يخص المهارة لا الرسم
E.RIVALGEN.cont = false; E.MFUND.on = false; E.MFUND.spend = false; E.SHOPCOND.on = false; E.LIQ.on = false; // 040: بصمات قديمة تُثبَّت على السلوك السابق
E.RIVALW.on = false; // 040ح: ثروة المنافسين مطفأة في بصمات 035 (لا rv.w ولا rv.kn في الحفظ)
E.CHIEFX.on = false; /* 035ج: كبير الرعاة بلا ch.x ولا f.tr */ E.HOMEST.on = false; E.DELEG.on = false; // 043أ: بلا مهام مفوَّضة ولا حقول جديدة؛ 042: بصمات قديمة بلا لقطات «حال أعمالي»؛ لا P.hs يُكتب في الحفظ عند الإطفاء
E.GRIEF.on = false; E.TASKS.on = false; E.INFLU.fam.road = false; /* 036هـ: عقود الطرق والمواسم مطفأة في البصمات */ // 038: بصمات قديمة بلا مهام؛ لا P.tk2 يُكتب في الحفظ عند الإطفاء
{ const S0 = run(rich(load()), 10); a.equal(S0.player.tk2, undefined, '038: P.tk2 لا يُكتب عند TASKS.on=false'); a.ok(!('tk2' in JSON.parse(E.save(S0)).player), '038: لا حقل جديد في الحفظ عند الإطفاء'); }
{ const S0 = run(rich(load()), 10); a.equal(S0.player.hs, undefined, '042: P.hs لا يُكتب عند HOMEST.on=false'); a.ok(!('hs' in JSON.parse(E.save(S0)).player), '042: لا حقل جديد في الحفظ'); }
const ok = m => console.log('OK   ' + m), base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/skill-baseline.json'), 'utf8'));
const mig = S => (E.skillMigrate(S), S), clone = S => E.loadChecked(E.save(S)).S, cityOf = S => Object.keys(S.player.props).find(c => S.cities[c] && S.player.props[c].shops.length);
const on0 = E.SKILL.on;
try {
  // ١) المفتاح مطفأ = السلوك السابق حرفياً (بصمة الحالة بعد 150 يوماً، بذرتان)
  E.SKILL.on = false; E.SHOPCOND.on = false; E.LOANPLEDGE.on = false; E.LOANPLEDGE.ask = false; // بصمات ما قبل 035 تسبق 040هـ فتُقاس بمفتاح حالة الدكاكين مطفأً
  for (const [k, f] of [['a23', 'skill-save-a23'], ['a18', 'skill-save-a18']]) { const S = rich(load(f)); run(S, base.days); a.equal(hash(S), base[k].h, 'مطابقة ' + f); a.ok(rvClean(S), '040ح: لا حقول ثروة منافسين في الحفظ'); a.ok(!JSON.stringify(E.save(S)).includes('"sk"'), 'لا sk بلا مفتاح'); }
  E.SHOPCOND.on = true; E.LOANPLEDGE.on = true; E.LOANPLEDGE.ask = true; ok('SKILL.on=false يطابق بصمة ما قبل 035أ حرفياً (بذرتان × 150 يوماً) ولا يكتب sk');
  E.SKILL.on = true;
  // ٢) التهجير: الحفظ القديم (بلا sk) يُحمَّل ويُهجَّر بدرجة تعادل ما يفعله اليوم
  { E.SKILL.on = false; const S0 = rich(load('skill-save-a23')); const city = cityOf(S0); const raw = E.save(S0); E.SKILL.on = true; a.ok(!raw.includes('"sk"'));
    const S = E.loadChecked(raw).S, st = S.player.props[city].staff;
    for (const w of st) { a.ok(w.sk && w.sk.g >= 1, 'sk للعامل'); const old = w.days >= 120 ? 3 : w.days >= 40 ? 2 : 1; a.equal(w.sk.g, old, `درجة ${w.role} بأيام ${w.days}`); a.equal(E.wkLv(w), old - 1, 'wkLv يتبع الدرجة'); }
    // مدراء بأنواعهم
    const P = S.player, p = P.props[city]; p.mgr = { rank: 2, lv: 1, id: 777, asset: { kind: 'shop', id: p.shops[0].id }, wage: 20, days: 130, since: 0, audit: 0, late: 0 }; P.diwan = { since: 0, box: 0, rules: {}, ask: [], log: [], cool: {}, said: {}, late: 0, paid: 0, covered: 0 }; P.caravans[0].captain = { name: 'x', role: 'loyal', trade: 3, nav: 3, combat: 3 };
    E.skillMigrate(S); a.equal(E.skGradeOf('a', 130), 2); a.equal(p.mgr.sk.g, 2, 'مدير الممتلك بأيام خدمته (130) ← متمرّس بنمو الأيام الحالية (ويبدأ مبتدئاً إن كان جديداً)');
    const g0 = p.mgr.sk.g; E.skillMigrate(S); a.equal(p.mgr.sk.g, g0, 'التهجير آمن للتكرار');
    a.equal(P.diwan.sk.g, 3, 'الستة المفوِّضة ← ماهر'); a.equal(P.caravans[0].captain.sk.g, 3, 'قائد بمهارات 3 ← درجة 3'); a.deepEqual(P.caravans[0].gx, { g: 1, xp: 0 }); a.deepEqual(P.caravans[0].cx, { g: 1, xp: 0 });
    p.mgr = { rank: 3, lv: 2, id: 778, wage: 40, days: 10, span: 6, since: 0, audit: 0, late: 0 }; E.skillMigrate(S); a.equal(p.mgr.sk.g, 3, 'الأمين ← ماهر');
    for (const [lv, g] of [[1, 1], [2, 3], [3, 4]]) { p.mgr = { lv, since: 0, audit: 0, late: 0 }; delete p.mgr.sk; E.skillMigrate(S); a.equal(p.mgr.sk.g, g, `مدير مصنع قديم lv${lv} ← ${g}`); }
    const back = E.loadChecked(E.save(S)); a.ok(back.ok && back.S.player.props[city].staff[0].sk.g >= 1, 'sk يُحفظ ويُحمَّل'); }
  ok('التهجير: العمال بدرجتهم الحالية، المدير مبتدئ، المصنع القديم 1/3/4، الأمين ماهر، المفوِّضون ماهر، القادة من مهاراتهم، gx/cx مبتدئ؛ آمن للتكرار؛ يُحفظ');
  // ٣) النمو: m في [0.6, 1.6]، والنتيجة السيئة تبطّئ ولا تُنزل الدرجة
  { const S = mig(rich(load())), city = cityOf(S), pr = S.player.props[city], w = pr.staff.find(x => x.role === 'seller' && x.days === 30);
    const setNet = n => { pr.hist = Array.from({ length: 7 }, () => ({ rev: 100, net: n })); };
    setNet(0); a.ok(Math.abs(E.skM(0) - 1) < 1e-9, 'التعادل m=1'); setNet(-5000); a.equal(E.skM(-5000), 0.6, 'النتيجة السيئة m=0.6 لا أقل'); a.ok(E.skM(1e9) <= 1.6 + 1e-9 && E.skM(1e9) > 1.5, 'الأعلى 1.6');
    w.sk.xp = 100; w.sk.g = 2; const x0 = w.sk.xp; setNet(-5000); E.skillDay(S); a.ok(Math.abs(w.sk.xp - x0 - 0.6) < 1e-9, 'يتبطّأ إلى 0.6'); a.equal(w.sk.g, 2, 'الدرجة لا تنزل');
    for (let i = 0; i < 400; i++) E.skillDay(S); a.ok(w.sk.g >= 2, 'لا نزول أبداً'); a.equal(w.sk.g, 3, 'يصل خبيراً ببطء حتى بالنتيجة السيئة (0.6/يوم)');
    const w2 = pr.staff.find(x => x.role === 'seller' && x.days === 100); w2.sk.xp = 100; w2.sk.g = 2; setNet(1e6); const y0 = w2.sk.xp; E.skillDay(S); a.ok(w2.sk.xp - y0 > 1.5, 'الربح الجيد يسرّع'); }
  ok('النمو: m∈[0.6,1.6]، التعادل 1، السيئ يبطّئ إلى 0.6 ولا تنزل درجة، الجيد يسرّع');
  // ٤) التخصص الثاني بالعمل
  { const S = mig(rich(load())), city = cityOf(S), pr = S.player.props[city], w = pr.staff.find(x => x.role === 'seller'); w.days = 130; w.sk.xp = 130; w.sk.g = 3; w.wageProof = { since: S.day - 200, day: S.day, lastBad: null }; w.free = 0;
    const sh = pr.shops[0], r = E.A.hireManager(S, city, 1, w.id, 'shop', sh.id); a.ok(r.ok, 'ترقية عامل: ' + r.msg); const m = pr.mgr; a.ok(m.sk && m.sk.g === 1 && m.sk.home === 'sale', 'المدير المرقّى مبتدئ بخلفية البيع');
    a.equal(E.skFit(m, 'sale'), 1); a.equal(E.skFit(m, 'make'), 0.3, 'ملاءمة التخصص الثاني 0.3 ابتداءً');
    const f0 = E.skFit(m, 'make'); m.asset = { kind: 'factory', id: 1 }; m.sk.spec = {}; for (let i = 0; i < 100; i++) E.skillDay(S); a.ok(m.sk.spec.make > 0.3 && m.sk.spec.make < 1, 'التخصص الثاني ينمو: ' + m.sk.spec.make); a.ok(E.skFit(m, 'make') > f0); }
  ok('التخصص الثاني يبدأ 0.3 وينمو بالعمل ولا يتجاوز 1');
  // ٥) الإصلاح أ: درجة أمين المخزن تخفض التلف غير المغطّى
  { const loss = g => { const S = mig(rich(load())), city = cityOf(S), pr = S.player.props[city]; pr.whs = 2; pr.staff = pr.staff.filter(w => w.role !== 'keeper'); pr.staff.push({ id: S.nextId++, role: 'keeper', days: 500, late: 0, free: 0, sk: { g, xp: [0, 40, 120][g - 1], home: 'store', spec: {}, m: 1, wk: 0, since: 0 } }); pr.store.wheat = 1000; pr.basis = pr.basis || {}; const b = pr.store.wheat; E.A.work && 0; E.tick(S, false); return b - pr.store.wheat; };
    const l1 = loss(1), l2 = loss(2), l3 = loss(3); a.ok(l1 > 0, 'تلف المخزن غير المغطّى موجود: ' + l1); a.ok(Math.abs(l2 / l1 - 0.75) < 0.05, 'الماهر يخفض 25٪: ' + (l2 / l1).toFixed(3)); a.ok(Math.abs(l3 / l1 - 0.5) < 0.05, 'الخبير يخفض 50٪: ' + (l3 / l1).toFixed(3));
    E.SKILL.on = false; const l1off = loss(3); E.SKILL.on = true; a.ok(Math.abs(l1off / l1 - 1) < 0.05, 'المطفأ: بلا أثر للدرجة (كما كان)'); }
  ok('إصلاح أ: مبتدئ 100٪ ثم ماهر 75٪ ثم خبير 50٪ من تلف المخزن غير المغطّى؛ والمطفأ بلا أثر');
  // ٦) الإصلاح ب: مدير الممتلك المرقّى على المصنع لا يهدر 10٪ بعد درجته الثانية، والجودة +3٪ للخبير
  { const S = mig(rich(load())), city = cityOf(S), pr = S.player.props[city], w = pr.staff.find(x => x.role === 'seller'); w.days = 120; w.sk.xp = 120; w.wageProof = { since: S.day - 200, day: S.day, lastBad: null }; w.free = 0;
    a.ok(E.A.hireManager(S, city, 1, w.id, 'shop', pr.shops[0].id).ok, 'رُقّي بعد 120 يوماً'); const m = pr.mgr; a.equal(E.skMgrWaste(m), 0.1, 'أول يوم: مبتدئ يهدر 10٪');
    pr.hist = Array.from({ length: 7 }, () => ({ rev: 100, net: 0 })); for (let i = 0; i < 61; i++) E.skillDay(S); a.equal(m.sk.g, 2, 'بعد 60 يوماً: متمرّس'); a.equal(E.skMgrWaste(m), 0, 'لا هدر بعد الدرجة الثانية (كان يبقى 10٪ إلى الأبد)');
    m.sk.g = 4; m.sk.xp = 320; m.sk.home = 'make'; a.equal(E.skMgrQual(m), 0.03, 'خبير: جودة +3٪'); m.sk.g = 3; a.equal(E.skMgrQual(m), 0, 'ماهر: لا جودة إضافية');
    E.SKILL.on = false; const old = { rank: 2, lv: 1 }; a.equal(E.skMgrWaste(old), 0.1, 'المطفأ: السلوك القديم (يهدر دائماً)'); E.SKILL.on = true; }
  ok('إصلاح ب: المرقّى يهدر 10٪ أول 60 يوماً ثم 0، والخبير +3٪ جودة، والمطفأ كالقديم');
  // ٧) الحدود: الكفاءة لا تغيّر مالاً ولا تبيع أصلاً (الحالة المالية لا تُمس بيومٍ بلا ربح)
  { const S = mig(rich(load())), g0 = S.player.gold, props0 = Object.keys(S.player.props).length; const A0 = JSON.stringify(Object.keys(S.player.props)); E.skillDay(S); a.equal(S.player.gold, g0, 'skillDay لا تمس المال'); a.equal(JSON.stringify(Object.keys(S.player.props)), A0, 'لا تبيع ولا تشتري أصلاً'); }
  ok('الحدود: skillDay لا تمس المال ولا الأصول');
  // ٨) اللعب الحتمي: البذرة نفسها = النتيجة نفسها
  { const h = () => { const S = mig(rich(load())); run(S, 60); return hash(S); }; a.equal(h(), h(), 'حتمي'); } ok('الحتمية: النمو بلا حظ');
  console.log('PASS skill: off-mode identity, migration, growth, second specialty, fixes a/b, limits, determinism');
} finally { E.SKILL.on = on0; }
