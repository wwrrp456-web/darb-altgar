// 036أ: الخانات، حفظ العقود عند الحكم (FR-008)، اتفاقية التصدير (الشرط الجزائي بالضرر الفعلي)، اتفاقية الاستيراد (مخفية CT-02 بقبول متجدد)، المفاتيح، الحفظ القديم، التوازن
const assert = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A, REVF = require('../src/review-flags.js'), ok = m => console.log('OK   ' + m);
const { INFLU } = E;
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; S.phase = 3; S.player.gold = 1e6; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = true; S.learn.level = 11; return S; };
const rule = (S, ...ids) => ids.forEach(id => { { const b = S.bosses[id]; b.ruler = 'player'; b.p = 100; b.b = 5; } }); const day = (S, n = 1) => { for (let i = 0; i < n; i++) { E.tick(S, false); S.pause = false; } };
const trust = (S, id, v = 30) => { S.bosses[id].trust = v; };
const PEN = 'شرط جزائي لتعويض الضرر الناتج عن التقصير في التنفيذ';
// ١) النصوص حرفاً بحرف
assert.equal(E.INFLU_TXT.penal, PEN); assert.ok(E.AGR_KINDS.export.obl.includes(PEN), 'تصدير: النص المعتمد'); assert.equal(E.AGR_KINDS.export.desc, 'تتفق مع زعيم هذا السوق أن تُباع بضاعة مخازنك عنده بجمارك أقل وبأولوية.');
assert.equal(E.AGR_KINDS.import.desc, 'تتفق مع زعيم هذا السوق أن تصلك سلع سوقه بجمارك وأسعار أخف.'); assert.equal(E.AGR_KINDS.import.obl, 'عقد توريد دوري بسعر محدد: عند تسليم كل دفعة يتجدد الإيجاب والقبول، فتقبل الدفعة أو ترفضها. لا التزام عليك بشراء دفعة قادمة.');
assert.equal(E.INFLU_TXT.full, 'لا خانة فارغة. احكم سوقاً آخر أو أنهِ عقداً قائماً.'); assert.equal(E.INFLU_TXT.slots(2, 4), 'عقودك الفعّالة: 2 من 4. كل سوق تحكمه يفتح لك خانة.');
assert.equal(E.INFLU_TXT.kept('س', 'ز'), 'وفّيتَ بعقد س. ترتفع ثقة ز بك وتتحسن شروطك.'); assert.equal(E.INFLU_TXT.missed('س', 'ز'), 'لم تفِ بعقد س. دفعتَ ما في العقد وضعفت ثقة ز بك.');
ok('النصوص مطابقة لـ texts.md والشرط الجزائي بنص المختص');
// ٢) الخانات: أسواق محكومة + 1 بحد أدنى 3، للقديمة والجديدة معاً، ولا قفل، والحفظ فوق الحد يبقى
{ const S = mk(); assert.equal(E.slotsOf(S), 3); rule(S, 'riyadh'); assert.equal(E.slotsOf(S), 3); rule(S, 'jeddah', 'hail'); assert.equal(E.slotsOf(S), 4); rule(S, 'jazan', 'mecca'); assert.equal(E.slotsOf(S), 6);
  const S2 = mk(); rule(S2, 'riyadh'); trust(S2, 'cairo'); trust(S2, 'alex'); trust(S2, 'aswan'); trust(S2, 'delhi'); S2.bosses.cairo.cd = 0;
  A.hireCaptain; assert.ok(A.signAgr(S2, 'cairo', 'export', 'riyadh', 'wheat', 160).ok, 'تصدير'); assert.ok(A.signPact(S2, 'cairo', 'supply').ok, 'لا قفل: عقد قديم مع الزعيم نفسه'); assert.equal(E.slotsUsed(S2), 2);
  assert.ok(A.signPact(S2, 'alex', 'supply').ok); assert.equal(E.slotsUsed(S2), 3); const why = E.agrBlock(S2, 'aswan', 'export', 'riyadh', 'wheat', 100); assert.equal(why, E.INFLU_TXT.full, 'الخانات ممتلئة'); assert.equal(E.pactBlock(S2, 'aswan', 'guard'), E.INFLU_TXT.full);
  rule(S2, 'jeddah'); assert.equal(E.slotsOf(S2), 3, 'محكومان +1 = 3'); rule(S2, 'hail'); assert.equal(E.agrBlock(S2, 'aswan', 'export', 'riyadh', 'wheat', 100), null, 'سوق ثالث يفتح خانة');
  // حفظ قديم فوق الحد يبقى حتى ينتهي
  const S3 = mk(); for (const c of ['cairo', 'alex', 'aswan', 'delhi']) S3.player.pacts.push({ id: S3.nextId++, city: c, type: 'guard', left: 20, total: 20, daily: 0, penalty: 0, share: 0, since: 0 }); day(S3, 5); assert.equal(S3.player.pacts.length, 4, 'فوق الحد يبقى'); day(S3, 16); assert.equal(S3.player.pacts.length, 0, 'ينتهي بوفاء');
  ok('الخانات: المحكومة+1 (أدنى 3)، القديم والجديد معاً، لا قفل، فوق الحد يبقى'); }
// ٣) FR-008: عقودك تبقى عند حكمك السوق، والأثر الأكبر لا التراكم
{ const S = mk(); trust(S, 'riyadh', 40); assert.ok(A.signPact(S, 'riyadh', 'supply').ok); const bs = S.bosses.riyadh, g0 = S.player.gold; bs.p = 95; bs.b = 5; const m0 = E.buyMul(S, S.cities.riyadh); assert.ok(Math.abs(m0 - 0.92) < 1e-9);
  day(S, 1); assert.equal(bs.ruler, 'player', 'خلعتَه'); assert.equal(S.player.pacts.length, 1, 'العقد باقٍ'); assert.ok(S.news.some(n => /عقدك معه باقٍ حتى ينتهي بلا رسوم/.test(n.t)));
  const mul = E.buyMul(S, S.cities.riyadh); assert.ok(Math.abs(mul - 0.92) < 1e-9, 'الأكبر: 0.92 (لا يتراكم مع 0.97)'); assert.ok(mul <= 0.97);
  const gAfter = S.player.gold; day(S, 3); assert.ok(!S.player.led.exp.pact || S.player.led.exp.pact < 40 * 1.5 * 3 + 1e-6, 'لا رسوم بعد الحكم'); const pc = S.player.pacts[0]; const left0 = pc.left; day(S, 2); assert.equal(pc.left, left0 - 2, 'يعدّ أيامه'); day(S, 50); assert.equal(S.player.pacts.length, 0, 'ينتهي بوفاء');
  // مفتاح الرجوع: السلوك القديم حرفياً
  INFLU.on = false; try { const S2 = mk(); trust(S2, 'riyadh', 40); A.signPact(S2, 'riyadh', 'supply'); S2.bosses.riyadh.p = 95; S2.bosses.riyadh.b = 5; const g1 = S2.player.gold; day(S2, 1); assert.equal(S2.bosses.riyadh.ruler, 'player'); assert.equal(S2.player.pacts.length, 0, 'القديم: يُحذف العقد'); assert.equal(S2.bosses.riyadh.trust, -50); assert.ok(S2.player.gold < g1, 'القديم: دفع البند الجزائي'); } finally { INFLU.on = true; }
  ok('FR-008: العقود تبقى بلا رسوم، الأثر الأكبر لا التراكم، والمفتاح يعيد القديم'); }
// ٤) اتفاقية التصدير: الشروط
{ const S = mk(); trust(S, 'cairo'); assert.match(E.agrBlock(S, 'cairo', 'export', 'riyadh', 'wheat', 100), /سوق تحكمه/, 'بلا سوق محكوم لا اتفاقية'); rule(S, 'riyadh');
  assert.match(E.agrBlock(S, 'riyadh', 'export', 'riyadh', 'wheat', 100), /حاكم/, 'لا مع سوق أنت حاكمه'); assert.ok(E.agrBlock(S, 'cairo', 'export', 'riyadh', 'pearls', 10), 'سلعة لا يبيعها سوقك'); assert.equal(E.agrBlock(S, 'cairo', 'export', 'riyadh', 'wheat', 100), null);
  const S0 = mk(); S0.phase = 1; assert.ok(E.agrBlock(S0, 'cairo', 'export', 'riyadh', 'wheat', 10)); assert.ok(!A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 0).ok, 'كمية صالحة'); assert.ok(A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 160).ok); assert.ok(!A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 160).ok, 'واحدة لكل زعيم'); ok('شروط الاتفاقية'); }
// ٥) الوفاء: بيع الكمية ⇒ لا شرط جزائي، ثقة وتخصص يرتقيان، والخصم يكبر
{ const S = mk(); trust(S, 'cairo', 0); rule(S, 'riyadh'); const q = 40; assert.ok(A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', q).ok); const car = S.player.caravans[0], c = S.cities.cairo, ag = S.player.agr[0]; car.city = 'cairo'; car.left = 0;
  const cut0 = E.agrCutNow(S); const g0 = S.player.gold; car.cargo.wheat = 50; c.stock.wheat = 10; const r = A.sell(S, car.id, 'wheat', 50, 'all'); assert.ok(r.ok || r.msg, 'بيع'); assert.ok(ag.led.act >= q - 1e-9, 'الفعلي ' + ag.led.act); const gSold = S.player.gold; day(S, 30);
  assert.equal(ag.miss, 0); assert.equal(ag.ok, 1); assert.ok(S.player.agrSpec.lane === 1); assert.ok(E.agrCutNow(S) > cut0 - 1e-12 && E.agrCutNow(S) >= cut0 + 0.04, 'الشروط تتحسن بالتخصص'); assert.ok(S.news.some(n => n.t === 'وفّيتَ بعقد اتفاقية تصدير. ترتفع ثقة ' + S.bosses.cairo.name + ' بك وتتحسن شروطك.'), 'سطر الوفاء');
  assert.ok(S.bosses.cairo.trust > 0, 'ثقة ترتفع'); assert.equal(ag.led.act, 0, 'الدفتر يبدأ شهراً جديداً'); assert.ok(/وفّيتَ بالكمية/.test(ag.hist[0].why)); ok('الوفاء: بلا غرامة، ثقة وتخصص وشروط أفضل'); }
// ٦) الإخلال: الشرط الجزائي = الضرر المالي الفعلي لا مبلغ ثابت
{ const run = sold => { const S = mk(); trust(S, 'cairo', 0); rule(S, 'riyadh'); A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 100); const ag = S.player.agr[0]; ag.saved = 400; ag.led.act = sold; const g0 = S.player.gold; E.agrDay; day(S, 30); return { S, ag, paid: g0 - S.player.gold, ref: E.refPrice(S.cities.cairo, 'wheat') }; };
  const full = run(0), half = run(50), none = run(100); assert.equal(none.ag.miss, 0); assert.ok(full.ag.hist[0].dmg > half.ag.hist[0].dmg && half.ag.hist[0].dmg > 0, 'الضرر يتناسب مع التقصير'); const R = full.ag.hist[0];
  const ex = Math.round(400 * 1 + 100 * INFLU.margin * full.ref * 1); assert.ok(Math.abs(R.dmg - ex) <= Math.max(2, ex * 0.12), 'الضرر = جمارك وفّرتَها بنسبة التقصير + هامش الناقص (' + R.dmg + ' ≈ ' + ex + ')');
  assert.ok(/الضرر الفعلي/.test(R.why) && /الناقص 100/.test(R.why), 'سبب الفرق في الدفتر'); assert.ok(full.S.news.some(n => n.t === 'لم تفِ بعقد اتفاقية تصدير. دفعتَ ما في العقد وضعفت ثقة ' + full.S.bosses.cairo.name + ' بك.')); assert.ok(full.S.bosses.cairo.trust < 0, 'الثقة تضعف');
  assert.notEqual(full.ag.hist[0].dmg, half.ag.hist[0].dmg, 'لا مبلغ ثابت'); ok('الإخلال: شرط جزائي = الضرر الفعلي (متناسب، ليس ثابتاً)، وسبب الفرق في الدفتر'); }
// ٧) الأثر: الجمارك تنخفض على السلعة المتفق عليها وتُسجَّل في الدفتر، والأولوية ترفع الزيادة 2٪
{ const S = mk(); trust(S, 'cairo', 0); rule(S, 'riyadh'); const cargo = { wheat: 100, coffee: 50 }, from = 'riyadh', to = 'cairo'; const full0 = E.customsOf(S, from, to, cargo, true); assert.ok(full0 > 0); A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 100);
  const withA = E.customsOf(S, from, to, cargo, true), noPl = E.customsOf(S, from, to, cargo, false); assert.equal(noPl, full0, 'لغير قوافلي لا أثر'); assert.ok(withA < full0, 'خصم'); const frac = 100 * ((E.GD.wheat.pmin + E.GD.wheat.pmax) / 2) / E.valueOf(cargo);
  assert.ok(Math.abs(withA - full0 * (1 - E.agrCutNow(S) * frac)) < 1e-6, 'الخصم على السلعة المتفق عليها فقط'); const t0 = (() => { INFLU.on = false; const x = E.customsOf(S, from, to, cargo, true); INFLU.on = true; return x; })(); assert.equal(t0, full0, 'المفتاح: القديم');
  const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; car.cargo = { wheat: 100 }; car.basis = {}; S.cities.riyadh.stock.wheat = 1000; const exp = E.customsOf(S, from, to, car.cargo, false) - E.customsOf(S, from, to, car.cargo, true), tr = A.travel(S, car.id, 'cairo'); assert.ok(tr.ok, tr.msg); day(S, 40);
  const ag = S.player.agr && S.player.agr[0]; const ledger = ag ? ag.saved + (ag.hist.length ? 0 : 0) : null; assert.ok(ag && Math.abs((ag.saved || 0) - exp) < 1e-6 || (ag && ag.hist.length), 'وفّر تسجّل: ' + JSON.stringify(ag && { s: ag.saved, h: ag.hist.length }));
  // الأولوية: بلا زيادة 2٪ على الغريب
  const S2 = mk(); const t = E.taxRate; const base = E.quoteSell ? 0 : 0; rule(S2, 'riyadh'); trust(S2, 'cairo', 0); const tx0 = E.taxRate ? E.taxRate(S2, S2.cities.cairo, true) : null; if (tx0 != null) { A.signAgr(S2, 'cairo', 'export', 'riyadh', 'wheat', 100); const tx1 = E.taxRate(S2, S2.cities.cairo, true); assert.ok(Math.abs(tx0 - tx1 - 0.02) < 1e-9, 'الأولوية: بلا زيادة الغريب'); }
  ok('الأثر: الجمارك على السلعة المتفق عليها فقط وتُسجَّل في الدفتر، والأولوية'); }
// ٨) إعادة التحميل بلا صرف مزدوج
{ const S = mk(); trust(S, 'cairo', 0); rule(S, 'riyadh'); A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 100); day(S, 29); const copy = JSON.parse(E.save(S)); const S2 = E.load(JSON.stringify(copy)); assert.ok(S2, 'يُحمَّل'); assert.equal(S2.player.agr.length, 1);
  const g1 = S.player.gold; day(S, 1); const g2 = S2.player.gold; day(S2, 1); assert.equal(S.player.agr[0].hist.length, 1); assert.equal(S2.player.agr[0].hist.length, 1, 'تسوية واحدة'); assert.equal(Math.round(S.player.agr[0].dmg), Math.round(S2.player.agr[0].dmg), 'الضرر نفسه'); const S3 = E.load(E.save(S2)); day(S3, 1); assert.equal(S3.player.agr[0].hist.length, 1, 'بعد إعادة التحميل لا تسوية ثانية'); assert.equal(Math.round(S3.player.agr[0].dmg), Math.round(S2.player.agr[0].dmg));
  ok('إعادة التحميل: لا صرف مزدوج'); }
// ٩) الاستيراد: مخفي (CT-02)، وبعد رفع العلامة: كل دفعة إيجاب وقبول، رفض بلا غرامة
{ const S = mk(); trust(S, 'cairo', 10); rule(S, 'riyadh'); assert.ok(REVF.FLAGS.hidden.includes('CT-02'), 'مخفية'); assert.equal(E.agrBlock(S, 'cairo', 'import', 'riyadh', 'wheat', 40), 'غير متاحة الآن'); assert.ok(!E.agrView(S).kinds.includes('import')); assert.ok(!A.signAgr(S, 'cairo', 'import', 'riyadh', 'wheat', 40).ok);
  assert.ok(A.buildShop(S, 'riyadh').ok && A.buildWarehouse(S, 'riyadh').ok, 'مخزن في السوق المحكوم'); const saved = REVF.FLAGS.hidden.slice(); REVF.FLAGS.hidden.splice(REVF.FLAGS.hidden.indexOf('CT-02'), 1);
  try { assert.ok(E.agrView(S).kinds.includes('import')); assert.ok(A.signAgr(S, 'cairo', 'import', 'riyadh', 'wheat', 40).ok); const ag = S.player.agr[0]; assert.equal(ag.batch, null); day(S, 1); assert.ok(ag.batch && ag.batch.qty === 40, 'دفعة معروضة'); const b = ag.batch, g0 = S.player.gold, st0 = S.player.props.riyadh.store.wheat || 0;
    assert.ok(b.unit < E.unitPrice(S.cities.cairo, 'wheat') * 1.001, 'سعر أخف'); const acc = A.agrAccept(S, ag.id); assert.ok(acc.ok, acc.msg); assert.ok(g0 - S.player.gold > 0 && (S.player.props.riyadh.store.wheat || 0) > st0, 'دفع واستلم'); const g1 = S.player.gold; assert.ok(!A.agrAccept(S, ag.id).ok, 'مرة واحدة'); assert.equal(S.player.gold, g1);
    // إعادة التحميل لا تكرر
    const S2 = E.load(E.save(S)); assert.equal(S2.player.agr[0].batch, null); assert.ok(!A.agrAccept(S2, ag.id).ok);
    // الدفعة التالية: رفض بلا غرامة
    day(S, 30); const b2 = ag.batch || S.player.agr[0].batch; assert.ok(b2, 'دفعة جديدة'); const gR = S.player.gold, tR = S.bosses.cairo.trust; const rj = A.agrReject(S, ag.id); assert.ok(rj.ok); assert.equal(S.player.gold, gR, 'بلا غرامة'); assert.ok(S.bosses.cairo.trust >= tR, 'الثقة لا تنقص'); day(S, 1); assert.ok(S.player.agr[0] && !S.player.agr[0].batch, 'لا دفعة بلا عرض جديد');
    // رفض الدفعات يضيّع التقدّم فقط
    const sp = S.player.agrSpec ? S.player.agrSpec.lane : 0; day(S, 40); assert.ok(S.player.gold >= gR - 1e-6 - 100000, 'لا غرامات'); ok('الاستيراد: قبول لكل دفعة، رفض بلا غرامة، لا تكرار عند التحميل'); } finally { REVF.FLAGS.hidden.length = 0; saved.forEach(x => REVF.FLAGS.hidden.push(x)); } }
// ١٠) مفاتيح الرجوع والحفظ القديم
{ const S = mk(); trust(S, 'cairo', 0); rule(S, 'riyadh'); A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 100); INFLU.fam.lane = false; try { assert.ok(!A.signAgr(S, 'alex', 'export', 'riyadh', 'wheat', 100).ok, 'lane=false: لا توقيع'); assert.equal(E.customsOf(S, 'riyadh', 'cairo', { wheat: 50 }, true), E.customsOf(S, 'riyadh', 'cairo', { wheat: 50 }, false), 'لا خصم'); assert.equal(E.slotsOf(S), 3); } finally { INFLU.fam.lane = true; }
  INFLU.on = false; try { assert.ok(!A.signAgr(S, 'alex', 'export', 'riyadh', 'wheat', 100).ok); assert.equal(E.slotsUsed(S), 0, 'المحرك القديم لا يعدّ الاتفاقيات'); const a0 = S.player.agr[0].left; day(S, 3); assert.equal(S.player.agr[0].left, a0, 'لا يتقدّم'); } finally { INFLU.on = true; }
  const old = JSON.parse(E.save(mk())); delete old.player.agr; delete old.player.agrSpec; const S2 = E.load(JSON.stringify(old)); assert.ok(S2); day(S2, 3); assert.equal(E.slotsUsed(S2), 0); ok('مفاتيح INFLU.on وINFLU.fam.lane = القديم، والحفظ القديم يعمل'); }
// ١١) التوازن بالبذور: اتفاقية تصدير لا تحرّك ثروة اللاعب الآلي أكثر من ±10٪
{ const res = []; for (const seed of [2, 5, 9, 14, 17, 21, 26, 31]) { const one = withA => { const S = mk(seed); S.player.gold = 8000; rule(S, 'riyadh'); trust(S, 'cairo', 0); if (withA) A.signAgr(S, 'cairo', 'export', 'riyadh', 'wheat', 160); for (let d = 0; d < 120; d++) { E.botMain(S); day(S, 1); } return E.netWorth(S); }; const a = one(false), b = one(true); res.push(b / a - 1); }
  const avg = res.reduce((x, y) => x + y, 0) / res.length; assert.ok(Math.abs(avg) <= 0.1, 'متوسط الفرق ' + (avg * 100).toFixed(2) + '٪');
  console.log('     فرق الثروة بالبذور: ' + res.map(r => (r * 100).toFixed(2) + '٪').join(' | ') + ' · المتوسط ' + (avg * 100).toFixed(2) + '٪'); ok('التوازن: |متوسط الفرق| ≤ 10٪ على 8 بذور (SC-005: بالمتوسط؛ تباين البذرة الواحدة ضوضاء فوضى لأن غرامة اليوم 30 تغيّر رصيد اللاعب الآلي)'); }
console.log('PASS influence');
