'use strict';
// 035هـ وكيل الإقليم بالدرجات (الشق المنفَّذ: §2) — المعادلات حرفياً من specs/035-management-skill/spec-e.md.
// شق المكافأة §3 موقوف مع T054 (أجر المدير ليس داخل pr.hist.net)، فهنا نتحقق أنه مطفأ ولا يكتب شيئاً.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), sim = require('./lib/skill-e-sim.js');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { agentNeed, ragShareFor, ragShiftOffer, ragPerfOffer, ragFundCalc, ragCs, '), box);
const E = box.module.exports, A = E.A, ok = m => console.log('OK   ' + m), base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/skill-e-baseline.json'), 'utf8'));
/* بصمات المطفأ: مفاتيح الحزم اللاحقة (كما في skill.test.js) */
E.RIVALW.on = false; E.RIVP.on = false; /* 040د */ // 040ح: ثروة المنافسين مطفأة في بصمات 035 (لا rv.w ولا rv.kn في الحفظ)
/* 035هـ: وكيل الإقليم بالدرجات والمكافأة بلا sk ولا حقول جديدة */ E.SKT.on = false; E.MFILE.on = E.KASHF.on = E.REPX.on = E.ACHX.on = false; /* 052: بلا P.mx ولا tx/lw ولا مفاتيح ach/wt/bd ولا أثر سمعة في البصمات القديمة */ E.PJINV.on = false; /* 046: المشاريع بلا ops ولا دخل ولا تشغيل في البصمات القديمة */ /* 035د: بلا tr ولا gx/cx فعّال ولا عتبات الشيخ/الشهبندر في البصمات */ E.CHIEFX.on = false; /* 035ج: كبير الرعاة بلا ch.x ولا f.tr */ E.FARMX.on = false; E.AGEMOM.on = false; E.BRIEF.on = false; E.BESTM.on = false; E.RACE.on = false; /* 050: بلا S.brief ولا car.bm ولا S.race */ /* 048 */ E.MGRX.on = false; /* 035ج2: رئيس المزرعة ومدير المصنع والمزارع بلا m.x ولا ملاءمة */ E.HOMEST.on = false; E.DELEG.on = false; // 043أ: بلا مهام مفوَّضة ولا حقول جديدة؛ 042: بصمات قديمة بلا لقطات «حال أعمالي»؛ لا P.hs يُكتب في الحفظ عند الإطفاء
E.GRIEF.on = false; E.PEN.old = true; /* 045: غرامات العقود القديمة الثابتة في البصمات */ E.GRIEF.major.on = false; E.INFLU.mediate.on = false; E.INFLU.tazkiya.on = false; E.TASKS.on = false; E.TASKS.c.on = false; E.INFLU.fam.road = false; /* 036هـ: عقود الطرق والمواسم مطفأة في البصمات */ // 038: بصمات قديمة بلا مهام؛ لا P.tk2 يُكتب في الحفظ عند الإطفاء
const near = (x, y, m, t = 1e-6) => a(Math.abs(x - y) < t, (m || '') + ` ${x} != ${y}`);
const fresh = g => { const S = sim.setup(E), ra = E.agentOf(S, 'sa'); if (g) { ra.sk = { g, xp: [0, 0, 150, 320, 700][g - 1], m: 1, wk: 0, spec: {}, home: null, since: 0 }; } return { S, ra }; };
const hist = (S, city, net, n = 7) => { S.player.props[city].hist = Array.from({ length: n }, (_, i) => ({ d: S.day - n + i + 1, rev: 100, net })); };

// 1) المفتاحان مطفآن = ما قبل الحزمة حرفاً (بذرتان × 120 يوماً) وبلا حقل جديد في الحفظ
{
  a.equal(E.BON.on, true, 'المكافأة مفعّلة افتراضياً'); E.BON.on = false; E.RAG.on = false;
  for (const seed of [5, 11]) {
    const S = sim.setup(E, seed); sim.run(E, S, 120); const ra = E.agentOf(S, 'sa');
    a.equal(sim.hash(E, S), base['s' + seed].h, 'مطابقة بصمة بذرة ' + seed); a.equal(sim.worth(E, S), base['s' + seed].nw);
    a.ok(ra.shift === undefined && ra.mode === undefined && ra.fundDay === undefined && ra.bon0 === undefined && ra.sk === undefined && S.player.bonus === undefined, 'لا حقل جديد على الوكيل ولا P.bonus');
    a.ok(!/"(shift|fundDay|bon0|bonus)"/.test(E.save(S)), 'لا حقل جديد في الحفظ');
  }
  E.RAG.on = true; E.BON.on = true; ok('RAG.on=false وBON.on=false يطابقان بصمة ما قبل 035هـ (بذرتان × 120 يوماً) بلا حقل جديد');
}
// 2) النمو: m = skM(Σ صافي مدن الوكيل) أسبوعياً؛ 3→4 عند 320 و5 عند 700؛ لا نزول
{
  const { S, ra } = fresh(); sim.run(E, S, 1); a.ok(ra.sk && ra.sk.g === 3 && ra.sk.xp >= 150, 'يُنشأ sk بدرجة 3 (150 xp)');
  while (S.day % 7 !== 0) sim.run(E, S, 1);
  hist(S, 'riyadh', 120); hist(S, 'jeddah', 60); const xpA = ra.sk.xp; E.skillDay(S); // اليوم من مضاعفات 7
  const net = E.shopPnl(S, 'riyadh', 7).net + E.shopPnl(S, 'jeddah', 7).net; near(ra.sk.m, E.skM(net), 'm = skM(Σ net)'); near(ra.sk.xp - xpA, E.skM(net), 'xp += m'); near(net, 180);
  S.day++; ra.sk.m = 1; ra.sk.xp = 319; ra.sk.g = 3; E.ragDay(S); a.equal(ra.sk.g, 4, '320 ← درجة 4'); ra.sk.xp = 699; E.ragDay(S); a.equal(ra.sk.g, 5, '700 ← درجة 5');
  ra.sk.m = 0.6; const g0 = ra.sk.g; for (let i = 0; i < 40; i++) { S.day++; if (S.day % 7) E.ragDay(S); } a.equal(ra.sk.g, g0, 'لا نزول');
  for (const g of [3, 4, 5]) a.equal(E.ragGrade({ sk: { g } }), g); a.equal(E.ragGrade({ sk: { g: 1 } }), 3); a.equal(E.ragGrade({}), 3);
  ok('النمو: m=skM(Σ net) أسبوعياً، 3→4 عند 320 و5 عند 700، لا نزول');
}
// 3) الدرجة 4: إنذار أبكر، سطر المقارنة، اقتراح النقل، A.ragShift، مجموع الحدود ثابت، ينتهي بعد 28 يوماً
{
  const week = (S, ra) => { S.day += 7; E.agentWeekly(S, 'sa', ra); };
  const warned = (ra, re) => ra.mail.some(m => m.type === 'warn' && re.test(m.text));
  for (const [g, wk] of [[3, 3], [4, 2], [5, 2]]) {
    const { S, ra } = fresh(g); for (const c of ['riyadh', 'jeddah']) hist(S, c, -50); a.equal(E.ragT(ra, 'negWeeks'), wk);
    for (let i = 1; i < wk; i++) { week(S, ra); a.ok(!warned(ra, /تخسر/), 'درجة ' + g + ': لا إنذار قبل ' + wk); } week(S, ra); a.ok(warned(ra, new RegExp('تخسر منذ ' + wk + ' أسابيع')), 'درجة ' + g + ': إنذار عند ' + wk);
  }
  for (const [g, w] of [[3, false], [4, true]]) { const { S, ra } = fresh(g); S.bosses.riyadh.trust = -25; week(S, ra); a.equal(warned(ra, /غاضب/), w, 'ثقة −25 درجة ' + g); }
  { const { S, ra } = fresh(3); S.bosses.riyadh.trust = -35; week(S, ra); a.ok(warned(ra, /غاضب/), '−35 تنذر عند الدرجة 3 كما كان'); }
  { const { S, ra } = fresh(4), off = n7 => { hist(S, 'riyadh', n7 / 7); hist(S, 'jeddah', 0); ra.alloc = { riyadh: 100, jeddah: 100 }; };
    off(140); const o = E.ragShiftOffer(S, 'sa'); a.ok(o && o.from === 'jeddah' && o.to === 'riyadh' && o.rb === 20 && o.rw === 0, 'عند الفرق 20 تظهر بطاقة النقل'); a.equal(o.d, 10); a.equal(o.id, 'rag:shift:sa:' + Math.floor(S.day / 7));
    off(133); a.equal(E.ragShiftOffer(S, 'sa'), null, 'عند الفرق 19 لا بطاقة');
    off(140); week(S, ra); const rep = ra.mail.find(m => m.type === 'report').text; a.ok(rep.includes('الأفضل: ' + S.cities.riyadh.name + ' (صافي 20/يوم، كل 100 من الحد أعادت 20)') && rep.includes('الأضعف: ' + S.cities.jeddah.name + ' (صافي 0/يوم، كل 100 من الحد أعادت 0)'), 'سطر المقارنة بالأرقام: ' + rep);
    ra.alloc.jeddah = 0; a.equal(E.ragShiftOffer(S, 'sa'), null, 'الأضعف بلا حد فلا نقل'); }
  { const { S, ra } = fresh(3); hist(S, 'riyadh', 20); hist(S, 'jeddah', 0); ra.alloc = { riyadh: 100, jeddah: 100 }; a.equal(E.ragShiftOffer(S, 'sa'), null, 'درجة 3 لا تقترح'); a.ok(!A.ragShift(S, 'sa', 'jeddah', 'riyadh').ok, 'ولا تقبل النقل'); }
  { const { S, ra } = fresh(4); const b = { ...ra.alloc }; a.ok(b.riyadh > 0 && b.jeddah > 0); const tot0 = b.riyadh + b.jeddah, r = A.ragShift(S, 'sa', 'jeddah', 'riyadh'); a.ok(r.ok, r.msg);
    const d = Math.round(b.jeddah * 0.1 * 100) / 100; near(ra.alloc.jeddah, b.jeddah - d, 'حد المنقول منه ينقص 10٪'); near(ra.alloc.riyadh, b.riyadh + d, 'ويزيد الآخر بالمقدار نفسه'); near(ra.alloc.jeddah + ra.alloc.riyadh, tot0, 'المجموع ثابت');
    a.equal(S.player.props.jeddah.mgr.policy.limit, ra.alloc.jeddah, 'يصل إلى حد الأمين'); a.equal(ra.shift.till, S.day + 28);
    S.day += 27; E.agentBegin(S); a.ok(ra.shift, 'سارٍ في اليوم 27'); S.day += 1; E.agentBegin(S); a.equal(ra.shift, undefined, 'ينتهي بعد 28 يوماً'); near(ra.alloc.jeddah, b.jeddah, 'يعود الحد');
    a.ok(A.ragShift(S, 'sa', 'jeddah', 'riyadh').ok && E.ragView(S).agents.sa.shift); a.ok(A.ragShift(S, 'sa', null).ok && ra.shift === undefined, 'ألغِ النقل'); a.ok(!A.ragShift(S, 'sa', 'riyadh', 'riyadh').ok); }
  ok('الدرجة 4: إنذار 2 أسبوع/−20، سطر المقارنة بالأرقام، بطاقة النقل عند 20 لا 19، النقل ثابت المجموع وينتهي بعد 28 يوماً');
}
// 4) الدرجة 5: التوزيع بالحاجة والربح، والتمويل
{
  const { S, ra } = fresh(5), cs = ['riyadh', 'jeddah']; hist(S, 'riyadh', 100); hist(S, 'jeddah', 0);
  const sh = E.ragShareFor(S, cs, ra, [100, 300], 400, 'perf'); near(sh[0], 0.475); near(sh[1], 0.525); near(sh[0] + sh[1], 1);
  hist(S, 'riyadh', 0); near(E.ragShareFor(S, cs, ra, [100, 300], 400, 'perf')[0], 0.25, 'Q=0 ← بالحاجة'); near(E.ragShareFor(S, cs, ra, [0, 0], 0, 'perf')[0], 0.5, 'N=0 وQ=0 ← بالتساوي'); a.equal(E.ragShareFor(S, cs, ra, [100, 300], 400, 'need'), null);
  hist(S, 'riyadh', 100); hist(S, 'jeddah', 0); A.agentPolicy(S, 'sa', 1000, false);
  const n1 = E.agentNeed(S, 'riyadh'), n2 = E.agentNeed(S, 'jeddah'), N = n1 + n2, eff = 500, need0 = { riyadh: Math.round(eff * n1 / N * 100) / 100, jeddah: Math.round(eff * n2 / N * 100) / 100 };
  near(ra.alloc.riyadh, need0.riyadh); const o = E.ragPerfOffer(S, 'sa'); a.ok(o && o.best === 'riyadh' && o.limNeed === need0.riyadh && o.limPerf > o.limNeed, 'بطاقة التوزيع بالأداء بأرقامها');
  const rp = 0.7 * n1 / N + 0.3, jp = 0.7 * n2 / N; a.ok(A.ragMode(S, 'sa', 'perf').ok && ra.mode === 'perf'); near(ra.alloc.riyadh, Math.round(eff * rp * 100) / 100); near(ra.alloc.jeddah, Math.round(eff * jp * 100) / 100); near(ra.alloc.riyadh + ra.alloc.jeddah, 500, 'مجموع الحد ثابت', 0.011);
  a.equal(E.ragPerfOffer(S, 'sa'), null, 'بعد الاختيار لا بطاقة'); a.ok(A.ragMode(S, 'sa', 'need').ok && ra.mode === 'need'); near(ra.alloc.riyadh, need0.riyadh, 'الحاجة تعيد القديم'); a.equal(E.ragView(S).agents.sa.mode, 'need');
  const g3 = fresh(4); a.ok(!A.ragMode(g3.S, 'sa', 'perf').ok, 'الدرجة 4 لا توزّع بالأداء');
  // التمويل
  const f = fresh(5), fr = f.ra; A.agentPolicy(f.S, 'sa', 0, false); const N2 = E.agentNeed(f.S, 'riyadh') + E.agentNeed(f.S, 'jeddah'), want = Math.ceil(1.2 * N2 / 100) * 100;
  f.S.player.wallet.sar = 500000; f.S.player.fixedEma = 0; let q = E.ragFundCalc(f.S, 'sa', fr); a.equal(q.Z, want); a.ok(q.ok && q.eff === 0 && q.N === N2);
  f.S.player.fixedEma = 100; f.S.zakat = { due: true, amount: 400 }; f.S.player.wallet.sar = 14 * 100 + 400 + 650; q = E.ragFundCalc(f.S, 'sa', fr); a.equal(q.free, 650, 'free = نقد − احتياطي − زكاة'); a.equal(q.Z, 0, 'Z مقصوص بـ free/7'); a.ok(!q.ok); a.equal(q.res, 1400 + 400);
  f.S.player.wallet.sar = 14 * 100 + 400 + 5000; q = E.ragFundCalc(f.S, 'sa', fr); a.equal(q.Z, Math.min(want, Math.floor(5000 / 7 / 100) * 100)); a.ok(q.ok);
  f.S.zakat = undefined; f.S.player.fixedEma = 0; f.S.player.wallet.sar = 500000; const d0 = f.S.day; E.agentWeekly(f.S, 'sa', fr); a.equal(fr.fundDay, d0, 'يُعلَّم اقتراح التمويل في التقرير الأسبوعي'); a.equal(fr.pool, 0, 'الحد لا يتغير بلا نقرة اللاعب');
  const fo = E.ragView(f.S).cards.find(c => c.kind === 'fund'); a.ok(fo && fo.Z === want && fo.id === 'rag:fund:sa:' + d0); f.S.day += 7; E.agentWeekly(f.S, 'sa', fr); a.equal(fr.fundDay, d0, 'لا يتكرر قبل 14 يوماً'); f.S.day += 7; E.agentWeekly(f.S, 'sa', fr); a.equal(fr.fundDay, d0 + 14, 'يتجدد بعد 14');
  a.ok(A.agentPolicy(f.S, 'sa', want, false).ok && fr.pool === want); a.equal(E.ragView(f.S).cards.find(c => c.kind === 'fund'), undefined, 'بعد رفع الحد لا اقتراح');
  ok('الدرجة 5: share = 0.475/0.525، Q=0 بالحاجة، التوزيع ثابت المجموع، Z مقصوص بـ free/7 مع الاحتياطي والزكاة، لا تغيّر في pool بلا agentPolicy');
}
// 5) الحدود: لا rnd جديد، الأجور ثابتة، المكافأة مطفأة ولا تكتب، بطاقة الكفاءة
{
  const { S, ra } = fresh(5), seeds = () => [S.seed, S.seedB].join(); for (const c of ['riyadh', 'jeddah']) hist(S, c, 30);
  const s0 = seeds(), w0 = E.agentWage(S, 'sa'); E.ragDay(S); E.agentWeekly(S, 'sa', ra); E.ragView(S); A.ragMode(S, 'sa', 'perf'); A.ragShift(S, 'sa', 'jeddah', 'riyadh'); A.agentPolicy(S, 'sa', 800, false); E.skillDay(S); a.equal(seeds(), s0, 'لا rnd جديد'); a.equal(E.agentWage(S, 'sa'), w0, 'الأجر لا يرتفع بالدرجة');
  E.BON.on = false; a.equal(E.bonMul(ra, S), 1); a.equal(E.bonGrace(ra, S), 0); E.skillDay(S); a.equal(S.player.bonus, undefined, 'BON مطفأ لا يكتب P.bonus'); E.BON.on = true;
  for (const [g, t] of [[3, 'يقارن المدن'], [4, 'يقترح توزيع الحد']]) { ra.sk.g = g; const v = E.skillView(S, ra, 'وكيل الإقليم'); a.ok(v && v.next.includes(t), 'بطاقة الكفاءة تعرف مفتاح agent: ' + v.next); }
  E.RAG.on = false; a.equal(E.ragT(ra, 'negWeeks'), E.RA.negWeeks); E.RAG.on = true;
  const L = E.loadChecked(E.save(S)); a.ok(L.ok && L.S.player.regAgents.sa.sk, 'الحفظ يعمل'); ok('لا rnd جديد، الأجر ثابت، المكافأة مطفأة بلا كتابة، بطاقة الكفاءة بمفتاح agent، الحفظ سليم');
}
// 6) التوازن بالبذور: لاعب آلي يقبل كل اقتراح؛ صافي الثروة بعد 365 يوماً ضمن ±10٪ من المطفأ
{
  const auto = S => { for (const c of E.ragView(S).cards) { if (c.kind === 'shift') A.ragShift(S, 'sa', c.from, c.to); else if (c.kind === 'perf') A.ragMode(S, 'sa', 'perf'); else if (c.kind === 'fund') A.agentPolicy(S, 'sa', c.Z, false); } };
  const rows = [];
  for (const seed of [5, 11, 17]) {
    const go = on => { E.RAG.on = on; const S = sim.setup(E, seed), ra = E.agentOf(S, 'sa'); for (let i = 0; i < 365; i++) { sim.run(E, S, 1); if (on) auto(S); } return { nw: sim.worth(E, S), g: ra ? (ra.sk ? ra.sk.g : 3) : 0 }; };
    const off = go(false), on = go(true), r = on.nw / off.nw; rows.push([seed, off.nw, on.nw, (r * 100 - 100).toFixed(2) + '٪', on.g]); a.ok(Math.abs(r - 1) <= 0.10, 'بذرة ' + seed + ': ' + r);
  }
  E.RAG.on = true; console.log('     بذرة | الثروة مطفأ | الثروة مشغّل | الفرق | درجة الوكيل\n     ' + rows.map(r => r.join(' | ')).join('\n     ')); ok('التوازن: الثروة بعد 365 يوماً ضمن ±10٪ في 3 بذور');
}
// 7) المكافأة §3 (حكم Opus): Ncity تطرح أجر المدير × D(m)؛ لا سطر لمدينة بلا سجل
{
  E.BON.on = true; E.SKILL.on = true;
  const mk = w => { const { S, ra } = fresh(3); for (const c of ['riyadh', 'jeddah']) { hist(S, c, 50, 30); S.player.props[c].mgr.wage = w; S.player.props[c].mgr.since = S.day - 100; } return { S, ra }; };
  let prev = null;
  for (const w of [0.01, 40, 400]) {
    const { S } = mk(w), n = E.bonNcity(S, 'riyadh'), gross = 50 * 30; near(n, gross - E.managerWage(S.player.props.riyadh.mgr) * 30, 'Ncity = Σnet − w×30 (w=' + w + ')', 1e-6);
    if (prev !== null) near(prev.n - n, (E.managerWage(S.player.props.riyadh.mgr) - prev.w) * 30, 'تنقص بـ Δw×30 بالضبط', 1e-6); prev = { n, w: E.managerWage(S.player.props.riyadh.mgr) };
  }
  { const { S } = mk(40), m = S.player.props.riyadh.mgr; m.since = S.day - 10; near(E.bonNcity(S, 'riyadh'), 1500 - 40 * 10, 'D(m) = أيام الخدمة لا 30'); m.since = S.day + 5; near(E.bonNcity(S, 'riyadh'), 1500, 'D لا ينزل عن 0'); }
  { const { S, ra } = mk(40); S.day = 60; S.player.wallet.sar = 500000; for (const c of ['riyadh', 'jeddah']) { S.player.props[c].mgr.since = 0; S.player.props[c].hist.forEach((h, i) => h.d = 60 - i); } ra.since = 0; ra.paid = 0; ra.bon0 = 0; ra.late = 0;
    S.player.props.jeddah.hist = []; // مدينة بلا سجل
    E.bonDay(S); const L = (S.player.bonus || { list: [] }).list; a.ok(L.some(b => b.key === 'riyadh'), 'مدينة بسجل لها اقتراح'); a.ok(!L.some(b => b.key === 'jeddah'), 'مدينة بلا دكاكين: لا عنصر في P.bonus.list');
    const b = L.find(x => x.key === 'riyadh' && x.kind === 'mgr'); near(b.N, Math.round(1500 - 40 * 30), 'N المخزَّن = Ncity'); near(b.raw, Math.round(b.share * b.N), 'raw = share × max(0,N)', 1); }
  E.BON.on = false; ok('Ncity تنقص بـw×30 بالضبط (0.01/40/400)، D(m)=أيام الخدمة، ومدينة بلا سجل بلا مكافأة');
}
// 8) الدفع والأثر والقياس: A.bonusGive، الاحتياطي، الانتهاء، والمكافآت ≤ 5٪ من الصافي الموجب (3 بذور × 365)
{
  E.BON.on = true; E.SKILL.on = true; const rows = [];
  for (const seed of [5, 11, 17]) {
    const S = sim.setup(E, seed); for (const c of ['riyadh', 'jeddah']) S.player.props[c].mgr.wage = 3; let paid = 0, pos = 0, n = 0;
    for (let i = 0; i < 365; i++) {
      for (const c of ['riyadh', 'jeddah']) { const pr = S.player.props[c]; pr.whs = Math.max(1, pr.whs || 0); pr.store.wool = 200; pr.shops[0].items = [{ g: 'wool', price: 3, auto: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 0, lastSold: 0 }]; }
      sim.run(E, S, 1); for (const c of ['riyadh', 'jeddah']) { const h = (S.player.props[c].hist || []).slice(-1)[0]; if (h && h.d === S.day) pos += Math.max(0, h.net); }
      for (const q of E.bonList(S).open) { const w0 = S.player.wallet.sar, r = A.bonusGive(S, q.id, q.offer); a.ok(r.ok, r.msg); a.ok(w0 - S.player.wallet.sar >= q.offer - 1 && S.player.wallet.sar >= E.operatingReserve(S) - 1, 'الدفع لا يمس الاحتياطي'); paid += q.offer; n++; }
    }
    rows.push([seed, n, Math.round(paid), Math.round(pos), (100 * paid / Math.max(1, pos)).toFixed(2) + '٪']); a.ok(pos > 0 && n > 0 && paid <= 0.05 * pos + 1, 'بذرة ' + seed + ': مكافآت ' + paid + ' من ' + pos);
  }
  console.log('     بذرة | عدد المكافآت | المدفوع | الصافي الموجب | النسبة\n     ' + rows.map(r => r.join(' | ')).join('\n     '));
  const S = sim.setup(E, 5); for (const c of ['riyadh', 'jeddah']) S.player.props[c].mgr.wage = 3; for (let i = 0; i < 365 && !(S.player.bonus && S.player.bonus.list.some(x => x.state === 'open')); i++) { for (const c of ['riyadh', 'jeddah']) { const pr = S.player.props[c]; pr.whs = Math.max(1, pr.whs || 0); pr.store.wool = 200; pr.shops[0].items = [{ g: 'wool', price: 3, auto: false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0, idleDays: 0, lastSold: 0 }]; } sim.run(E, S, 1); } const L = (S.player.bonus || { list: [] }).list, b = L.find(x => x.state === 'open');
  a.ok(b, 'يوجد اقتراح مفتوح'); if (b) { const e = E.bonEntity(S, b), q = E.bonList(S).open[0]; a.ok(!A.bonusGive(S, b.id, b.cap + 1).ok, 'فوق السقف مرفوض'); a.ok(A.bonusGive(S, b.id, q.half).ok); a.ok(E.bonMul(e, S) > 1 && E.bonGrace(e, S) > 0, 'الأثر حقيقي'); S.day += 30; a.equal(E.bonMul(e, S), 1, 'الأثر ينتهي بعد 30 يوماً'); a.ok(!A.bonusGive(S, b.id, 10).ok, 'لا دفع مزدوج'); }
  E.BON.on = false; ok('المكافآت ≤ 5٪ من الصافي الموجب، والدفع بالاحتياطي، والأثر حقيقي وينتهي');
}
console.log('PASS skill-e');
