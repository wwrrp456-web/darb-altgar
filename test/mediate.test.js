'use strict';
// 036ز: الوساطة: الشروط، المراحل الأربع بالسفر الفعلي، لا هدايا ولا مال، النجاح (عودة السلع للأبد وعهد الصلح وGR-01 حرفاً والاحتفال)، الفشل بنقص ثقة معلوم، المفتاح
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
const TX = fs.readFileSync(path.join(__dirname, '../specs/036-influence-contracts/texts.md'), 'utf8'), AP = fs.readFileSync(path.join(__dirname, '../docs/review/APPROVED_INFLUENCE_CONTRACTS_2026-11-09.md'), 'utf8');
const mk = (seed = 3) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; S.phase = 4; S.player.gold = 1e6; S.learn.level = 11; S.learn.stage = 23; S.learn.abroad = 1; for (const k in S.risk) S.risk[k] = 0; return S; };
const ready = S => { const b = S.bosses.riyadh; b.ruler = 'player'; b.p = 100; b.b = 5; S.bosses.jeddah.trust = 60; S.bosses.alex.trust = 40; return S; };
const car = S => S.player.caravans[0];
const trip = (S, d) => { const r = A.travel(S, car(S).id, d); assert.ok(r.ok, d + ': ' + r.msg); let n = 0; while ((car(S).left > 0 || car(S).city !== d) && n++ < 300) { E.tick(S, false); S.pause = false; S.road = null; } assert.equal(car(S).city, d); };
const f1 = S => (S.feuds || []).find(f => f.k === 'g1');
const GR01 = 'قال الله تعالى: ﴿إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ﴾؛ الإصلاح بين المتخاصمين من أعظم القُربات وأنبل خصال التجّار';
// 0) النصوص حرفاً
assert.equal(E.MED_TXT.GR01, GR01); assert.ok(AP.includes(GR01), 'GR-01 في APPROVED'); assert.ok(TX.includes(GR01), 'GR-01 في texts.md'); assert.ok(TX.includes(E.MED_TXT.medDesc) && TX.includes(E.MED_TXT.medObl), 'CT-15'); assert.ok(AP.includes('تُحذف الهدايا من الوسيط'));
assert.equal(E.MED_TXT.win('أ', 'ب'), 'اصطلح أ وب بفضل سعيك. عادت السلع بين السوقين، وفتحا لك «عهد الصلح».'); assert.equal(E.MED_TXT.stall, 'لم يطمئن أحدهما بعد. زد ثقته ثم عاود.'); assert.equal(E.MED_TXT.celTitle, 'أصلحتَ بين خصمين'); assert.equal(E.MED_TXT.celText('س', 'ص'), 'عاد التجار يتبادلون السلع بين س وص، وصار اسمك يُذكر في الأسواق.');
assert.equal(E.MED_TXT.covenant('ز'), 'عقد لا يملكه غيرك مع ز: جمارك أقل وحصة أكبر من سلعه، مكافأةً لك على إصلاحك بينه وبين خصمه.'); assert.equal(E.MED_TXT.stage[0].t, 'اسمع الأول'); assert.equal(E.MED_TXT.stage[0].x('أ', 'ب', 'س', 'ص'), 'زر أ في س واسمع شكواه كاملة.'); assert.equal(E.MED_TXT.stage[3].x(), 'اجمع الزعيمين في سوق محايد وقرّب بينهما بالكلام الطيب.');
ok('GR-01 حرفاً (APPROVED وtexts.md) ونصوص CT-15 والمراحل والنجاح والتعثّر والاحتفال');
// 1) الشروط
{ const S = mk(); assert.match(E.medBlock(S, 'g1'), /يلزم أن تحكم سوقاً/, 'بلا سوق محكوم'); ready(S); S.phase = 3; assert.match(E.medBlock(S, 'g1'), /الطور 4/); S.phase = 4;
  S.bosses.alex.trust = 19; assert.match(E.medBlock(S, 'g1'), /ثقة سيد درويش الريّس بك لا تكفي \(يلزم 20 وعندك 19\)/); S.bosses.alex.trust = 20; S.bosses.jeddah.trust = 19; assert.match(E.medBlock(S, 'g1'), /أبو سالم/); S.bosses.jeddah.trust = 20; assert.equal(E.medBlock(S, 'g1'), null, 'عند الحد تُفتح');
  assert.match(E.medBlock(S, 'zz'), /لا خصومة/); S.bosses.alex.ruler = 'player'; assert.match(E.medBlock(S, 'g1'), /لم يعد في/); S.bosses.alex.ruler = 'boss';
  const v = E.medView(S); assert.equal(v.list.length, 3); const m = v.list.find(x => x.k === 'g1'); assert.ok(m.can && m.ph && m.ru); assert.equal(m.chance, 50, 'فرصة 50٪ عند حد الثقة'); ok('الشروط: الطور 4، سوق محكوم، ثقة كل زعيم ≥ 20 (عند الحد تُفتح)، ولا وساطة بلا خصومة'); }
// 2) المراحل الأربع بالسفر الفعلي، بلا مال ولا بضاعة ولا هدية
{ const S = ready(mk()); S.bosses.jeddah.trust = S.bosses.alex.trust = 100; const P = S.player; const before = () => JSON.stringify({ g: P.gold, w: P.wallet, props: P.props, c: car(S).cargo, st: P.pacts, agr: P.agr, tr: [S.bosses.jeddah.trust, S.bosses.alex.trust, S.bosses.jeddah.gift, S.bosses.alex.gift] });
  const b0 = before(); assert.ok(A.medStart(S, 'g1').ok); assert.equal(before(), b0, 'البدء: لا مال ولا بضاعة ولا هدية ولا ثقة'); assert.equal(A.medStart(S, 'g1').ok, false, 'لا بدء مرتين'); assert.equal(P.med.st, 0);
  for (let i = 0; i < 5; i++) { E.tick(S, false); S.pause = false; } assert.equal(P.med.st, 0, 'المكوث لا يُقدّم المراحل'); trip(S, 'cairo'); assert.equal(P.med.st, 0, 'مدينة غير مقصودة لا تُقدّم');
  // تجربة مباشرة: وصول القافلة إلى المدينة الصحيحة وحدها هو الذي يُقدّم، ولا يغيّر مالاً
  E.medArrive(S, 'alex'); assert.equal(P.med.st, 0, 'الإسكندرية ليست مرحلة 1'); const g = P.gold;
  trip(S, 'jeddah'); assert.equal(P.med.st, 1, 'المرحلة 1: وصول قافلتك إلى جدة'); trip(S, 'alex'); assert.equal(P.med.st, 2, 'المرحلة 2: الإسكندرية');
  trip(S, 'jeddah'); assert.equal(P.med.st, 2); assert.equal(P.med.lg, 1, 'المرحلة 3 الشطر الأول'); trip(S, 'alex'); assert.equal(P.med.st, 3, 'المرحلة 3 تمّت'); assert.equal(P.med.lg, 0);
  const a = E.medView(S).active; assert.equal(a.st, 3); assert.equal(a.dest, E.MED_TXT.neutral); assert.deepEqual(a.destIds.every(id => !['saudi', 'egypt'].includes(S.cities[id].country)), true, 'السوق المحايد خارج دولتيهما'); assert.ok(a.destIds.length >= 6);
  assert.ok(a.stages.map(s => s.done).join() === 'true,true,true,false'); const mid = JSON.stringify(P.wallet); E.medArrive(S, 'cairo'); assert.equal(P.med.st, 3, 'مدينة الخصمين ليست محايدة'); assert.equal(JSON.stringify(P.wallet), mid);
  ok('أربع مراحل بالسفر الفعلي (جدة، الإسكندرية، جدة ثم الإسكندرية، محايد)، بلا انتقال مجاني، وبدء الوساطة لا يمس مالاً ولا بضاعة ولا ثقة'); }
// 3) النجاح الفعلي: عودة السلع للأبد، عهد الصلح، GR-01، الاحتفال
{ const S = ready(mk()); S.bosses.jeddah.trust = S.bosses.alex.trust = 100; assert.ok(A.medStart(S, 'g1').ok); trip(S, 'jeddah'); trip(S, 'alex'); trip(S, 'jeddah'); trip(S, 'alex'); assert.equal(S.player.med.st, 3);
  const g0 = E.fdGoods(S, 'jeddah', 'alex')[0], pricedUp = E.unitPrice(S.cities.alex, g0), tr = [S.bosses.jeddah.trust, S.bosses.alex.trust];
  // المحايد: أقرب مدينة من خارج الدولتين؛ نفرض يوماً تنجح فيه القرعة ونثبّت اليوم قبل الوصول
  const ki = 0; let d = 1; while (E.fdH(S, 21, d, ki, 1) >= 0.95) d++; S.day = d; E.medArrive(S, 'isfahan');
  assert.equal(S.player.med, undefined, 'انتهت الوساطة'); assert.ok(!f1(S), 'زالت الخصومة'); assert.equal(S.cities.alex.fpm && S.cities.alex.fpm[g0], undefined, 'عادت السلع: لا علاوة'); assert.equal(S.cities.jeddah.fpm, undefined);
  assert.ok(E.unitPrice(S.cities.alex, g0) < pricedUp, 'السعر نزل'); assert.equal(S.bosses.jeddah.trust, 100); S.bosses.jeddah.trust = tr[0]; // الحد الأقصى 100 فلا زيادة ظاهرة؛ نختبر الزيادة أدناه
  assert.equal(S.player.peace.length, 1); assert.deepEqual([S.player.peace[0].k, S.player.peace[0].a, S.player.peace[0].b], ['g1', 'jeddah', 'alex']);
  assert.ok(S.news.some(n => n.t === E.MED_TXT.win(S.bosses.jeddah.name, S.bosses.alex.name)), 'خبر النجاح'); assert.ok(S.news.some(n => n.t === GR01), 'GR-01 حرفاً في الأخبار'); assert.ok([...(S.learn.celq || []), ...(S.learn.schedHold || []).filter(h => h.q === 'celq').map(h => h.item)].some(c => c.id === 'feud_peace' && c.arg === 'g1'), 'احتفال (009)'); assert.equal(S.learn.cel['feud_peace:g1'], S.day);
  // للأبد: 3 سنوات بعد، وبعد الحفظ والتحميل
  for (let i = 0; i < 720; i++) { E.tick(S, false); S.pause = false; } assert.ok(!f1(S), 'لا تعود'); const R = E.load(E.save(S)); assert.ok(!f1(R)); assert.equal(R.player.peace.length, 1);
  // عهد الصلح: جمارك أقل وحصة أكبر، وللطرفين
  const cg = { wheat: 100 }, T0 = E.load(E.save(S)); T0.player.peace = []; const cu = E.customsOf(S, 'riyadh', 'alex', cg, true), cu0 = E.customsOf(T0, 'riyadh', 'alex', cg, true); assert.ok(cu0 > 0 && Math.abs(cu / cu0 - E.INFLU.mediate.cust) < 1e-9, 'جمارك ×' + E.INFLU.mediate.cust + ': ' + cu + ' من ' + cu0);
  assert.ok(E.peaceAt(S, 'alex') && E.peaceAt(S, 'jeddah') && !E.peaceAt(S, 'cairo')); const q0 = (() => { const T = E.load(E.save(S)); T.player.peace = []; return E.quotaPerDay(T, T.cities.jeddah); })(); assert.ok(Math.abs(E.quotaPerDay(S, S.cities.jeddah) / q0 - E.INFLU.mediate.quota) < 1e-9, 'حصة أكبر ×' + E.INFLU.mediate.quota);
  assert.equal(E.slotsUsed(S), 0, 'العهد لا يأخذ خانة'); const v = E.medView(S); assert.equal(v.peace[0].cust, 40); ok('النجاح: زالت الخصومة وعادت السلع للأبد (3 سنوات وبعد الحفظ)، عهد الصلح (جمارك −40٪ وحصة ×1.5)، GR-01 حرفاً في الأخبار، احتفال (009)'); }
// 4) ثقة الزعيمين تزيد بقدر معلوم عند النجاح
{ const S = ready(mk()); S.bosses.jeddah.trust = 30; S.bosses.alex.trust = 25; S.player.med = { k: 'g1', st: 3, lg: 0, d: 0, tries: 0 }; const ch = E.medChance(S, f1(S)); assert.equal(ch, 0.5 + 5 * 0.01); let d = 1; while (E.fdH(S, 21, d, 0, 1) >= ch) d++; S.day = d; E.medArrive(S, 'isfahan'); assert.equal(S.bosses.jeddah.trust, 30 + E.INFLU.mediate.win); assert.equal(S.bosses.alex.trust, 25 + E.INFLU.mediate.win); ok('النجاح يرفع ثقة كل زعيم ' + E.INFLU.mediate.win + ' نقطة'); }
// 5) الفشل: ينقص ثقة الأقل ثقة بقدر معلوم، وتبقى الخصومة، ومهلة، ثم تعاود
{ const S = ready(mk()); S.bosses.jeddah.trust = 30; S.bosses.alex.trust = 25; S.player.med = { k: 'g1', st: 3, lg: 0, d: 0, tries: 0 }; const ch = E.medChance(S, f1(S)); let d = 1; while (E.fdH(S, 21, d, 0, 1) < ch) d++; S.day = d; E.medArrive(S, 'isfahan');
  assert.equal(S.bosses.alex.trust, 25 - E.INFLU.mediate.fail, 'نقص ثقة الأقل'); assert.equal(S.bosses.jeddah.trust, 30, 'الآخر سليم'); assert.ok(f1(S), 'الخصومة باقية'); assert.deepEqual([S.player.med.st, S.player.med.tries, S.player.med.wait], [0, 1, d + E.INFLU.mediate.cd]);
  assert.ok(S.news.some(n => /تعذّر الصلح/.test(n.t) && /8/.test(n.t)), 'خبر الفشل بالرقم'); assert.ok(!S.player.peace, 'لا عهد'); assert.equal(E.medView(S).active.wait, E.INFLU.mediate.cd);
  E.medArrive(S, 'jeddah'); assert.equal(S.player.med.st, 0, 'خلال المهلة لا يُحسب وصول'); S.day += E.INFLU.mediate.cd; S.bosses.alex.trust = 40; E.medArrive(S, 'jeddah'); assert.equal(S.player.med.st, 1, 'بعد المهلة يُحسب'); assert.ok(A.medCancel(S).ok); assert.equal(S.player.med, undefined); ok('الفشل: ينقص الأقل ثقةً ' + E.INFLU.mediate.fail + '، تبقى الخصومة، مهلة ' + E.INFLU.mediate.cd + ' أيام، ثم تعاود، والتراجع ممكن'); }
// 6) التعثّر: انخفاض الثقة دون الحد أثناء الطريق
{ const S = ready(mk()); assert.ok(A.medStart(S, 'g1').ok); S.bosses.alex.trust = 10; E.medArrive(S, 'jeddah'); assert.equal(S.player.med.st, 0, 'تعثّر'); assert.ok(S.news.some(n => n.t === E.MED_TXT.stall)); S.bosses.alex.trust = 20; E.medArrive(S, 'jeddah'); assert.equal(S.player.med.st, 1); ok('التعثّر: لا تقدّم والثقة دون الحد، وبنص تعثّر المعتمد'); }
// 7) النسبة المعلنة تطابق القرعة عدّاً
{ const S = ready(mk()); S.bosses.jeddah.trust = S.bosses.alex.trust = 60; const ch = E.medChance(S, f1(S)); let w = 0; const N = 2000; for (let d = 1; d <= N; d++) if (E.fdH(S, 21, d, 0, 1) < ch) w++; assert.ok(Math.abs(w / N - ch) < 0.04, 'نسبة النجاح ' + (w / N).toFixed(3) + ' ≈ ' + ch); ok('القرعة تطابق النسبة المعلنة: ' + (w / N).toFixed(3) + ' عند ' + ch.toFixed(2)); }
// 8) المفتاح
{ const prev = E.INFLU.mediate.on; try { E.INFLU.mediate.on = false; const S = ready(mk()); assert.match(E.medBlock(S, 'g1'), /غير متاحة/); assert.equal(A.medStart(S, 'g1').ok, false); assert.equal(E.medView(S).list.length, 0); for (let i = 0; i < 200; i++) { E.tick(S, false); S.pause = false; } assert.ok(!/"med"|"peace"/.test(E.save(S)), 'لا حقل في الحفظ'); const Q = mk(); Q.player.peace = [{ k: 'g1', a: 'jeddah', b: 'alex' }]; assert.equal(E.peaceCust(Q, 'alex'), 1, 'المطفأ: لا أثر عهد'); } finally { E.INFLU.mediate.on = prev; } ok('INFLU.mediate.on=false: لا وساطة ولا عهد ولا حقول'); }
console.log('mediate: كل الفحوص نجحت');
