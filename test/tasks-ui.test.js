'use strict';
// 038ب «مهامك» (الواجهة) على 390 و1100: سطر «حال أعمالي» بعدد الجارية (قراءة فقط)، النافذة والقسم في «اليوم» بثلاث خانات،
// اختيار واحدة من ثلاث يُظلَّل (on + aria-pressed) مع ملخص بالأرقام، التراجع، الخانة الموسمية (دينية تجميلية وغيرها نفوذ ولقب)،
// الإنجاز والفاصل، لا تمرير أفقي، لمس ≥ 44، والمطفأ = الرئيسية القديمة بلا حالة في الحفظ
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/tasks'); fs.mkdirSync(SHOTS, { recursive: true });
const errors = [];
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(() => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; __game.go('home'); }); await p.waitForTimeout(500); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const row = p => p.locator('#screen .hs .hs-row[data-dchip="fold:hs-tasks"]');
const view = p => p.evaluate(() => JSON.parse(JSON.stringify(__game.E.tasksView(__game.S))));
const sheetT = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const gotoToday = async p => { await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'today'; __game.go('office'); }); await p.waitForTimeout(500); };
// يضع الموسم قيد التشغيل بتحريك اليوم إلى أول يوم يحمل الموسم k، ويحقن هدفاً جارياً (الدينية تُحقن حقناً لأنها مخفية بمراجعة المختص)
const seasonize = (p, k, got) => p.evaluate(([k, got]) => { const { S, E } = __game; const d0 = S.day; let hit = -1; for (let d = 0; d < 800 && hit < 0; d++) { S.day = d; if (E.seasonsAt(S, d).includes(k)) hit = d; } if (hit < 0) { S.day = d0; return null; }
  S.day = hit; S.seasonGoals = { y: E.dateOf(S).h.y, done: {}, seen: {}, cur: [{ k, need: 40, got, day: hit }], deco: {} }; __game.renderAll(true); return hit; }, [k, got]);
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    // ١) لاعب جديد: السطر في «حال أعمالي»، الرسم قراءة فقط، والنافذة بخانتين من ثلاث معروضات
    const p = await mk(b, w, '?player=1&seed=5'), r = row(p);
    a.equal(await r.count(), 1, w + ': سطر «مهامك» ظاهر'); const rt = (await r.textContent()).replace(/\s+/g, ' ');
    a.ok(rt.includes('مهامك') && rt.includes('0') && rt.includes('لا مهمة جارية'), w + ': ' + rt); a.ok((await r.boundingBox()).height >= 44, 'لمس ≥ 44'); a.ok((await r.getAttribute('aria-label')).includes('مهامك'));
    a.equal(await p.evaluate(() => __game.S.player.tk2), undefined, w + ': الرسم لا ينشئ حالة (قراءة فقط)'); a.equal(await wide(p), false);
    a.equal(await p.locator('#screen .hs .hs-row').last().getAttribute('data-dchip'), 'fold:hs-tasks', 'السطر بعد الخمسة (خارج سقف الأسطر)');
    await r.click(); await p.waitForTimeout(400); const v0 = await view(p), t = await sheetT(p);
    a.ok(t && t.includes('مهامك') && t.includes(v0.top) && t.includes(v0.week), 'النافذة: ' + String(t).slice(0, 100)); a.equal(await wide(p), false, w + ': لا تمرير أفقي في النافذة');
    for (const sl of v0.slots) { a.equal(sl.state, 'offer'); a.ok(sl.offers.length >= 1 && sl.offers.length <= 3, 'المعروضات'); const card = p.locator(`#dsheet [data-dask="tk:${sl.tier}"]`); a.equal(await card.count(), 1, 'بطاقة ' + sl.tier);
      a.equal(await card.locator('.dopt').count(), sl.offers.length, 'عدد الخيارات = المعروضات');
      for (const o of sl.offers) { a.ok(t.includes(o.text), 'نص العرض حرفاً: ' + o.text); a.ok(t.includes('لماذا اقترحتها؟ ' + o.why), 'السبب: ' + o.why); a.ok(t.includes(o.reward), 'المكافأة: ' + o.reward); a.ok(!/ذهب/.test(o.reward), 'لا ذهب'); } }
    a.ok(t.includes('اختر واحدة من ثلاث'), 'تلميح الاختيار'); a.equal(await p.locator('#dsheet .dopt.on').count(), 0, 'لا خيار مظلَّل قبل الاختيار');
    for (const bx of await p.locator('#dsheet .dopt').all()) a.ok((await bx.boundingBox()).height >= 44, 'لمس الخيار ≥ 44');
    // اختيار أول عرض في القصيرة: يُظلَّل ويُلخَّص بالأرقام، والمحرك يسجّله
    const o0 = v0.slots[0].offers[0]; await p.locator('#dsheet [data-dask="tk:short"] .dopt').first().click(); await p.waitForTimeout(500);
    const v1 = await view(p); a.equal(v1.slots[0].state, 'active'); a.equal(v1.slots[0].id, o0.id);
    const on = p.locator('#dsheet [data-dask="tk:short"] .dopt.on'); a.equal(await on.count(), 1, 'خيار مظلَّل واحد'); a.equal(await on.getAttribute('aria-pressed'), 'true'); a.ok((await on.textContent()).includes(o0.text));
    const res = await p.locator('#dsheet [data-dask="tk:short"] .dres').textContent(); a.ok(res.includes('التقدم: ' + v1.slots[0].prog) && res.includes('المكافأة: ' + o0.reward) && res.includes('المهلة: ') && /\d/.test(res), 'ملخص بالأرقام: ' + res);
    a.equal(await p.locator('#dsheet [data-dask="tk:short"] .bar').count(), 1, 'شريط التقدم'); a.equal(await p.locator('#dsheet [data-dask="tk:week"] .dopt').count(), v0.slots[1].offers.length, 'الأسبوعية لم تتأثر');
    a.equal(await p.evaluate(() => __game.S.player.tk2.slots.short.pick.id), o0.id); a.equal(await wide(p), false);
    if (w === 390) await p.screenshot({ path: path.join(SHOTS, 'tasks-390-new-player.png') });
    // سطر «حال أعمالي» يعرض الجارية (١) بعد الإغلاق
    await p.locator('#dsheet .dx').click(); await p.waitForTimeout(300); const rt2 = (await row(p).textContent()).replace(/\s+/g, ' '); a.ok(rt2.includes('1') && rt2.includes('جارية'), 'السطر بعد الاختيار: ' + rt2); a.equal((await p.evaluate(() => __game.E.tasksBrief(__game.S))).n, 1);
    // التراجع بلا عقوبة يعيد العرض الثلاثي
    await row(p).click(); await p.waitForTimeout(300); const g0 = await p.evaluate(() => __game.S.player.gold); await p.locator('#dsheet [data-dask="tk:short"] .dopt[data-oid="drop"]').click(); await p.waitForTimeout(500);
    a.equal((await view(p)).slots[0].state, 'none', 'بعد التراجع لا معروض حتى التجدد (محرك 038أ)'); a.equal(await p.evaluate(() => __game.S.player.gold), g0, 'لا عقوبة'); a.ok((await sheetT(p)).includes('لا مهام الآن، تجارتك تسير.'));
    await p.context().close(); }
  ok('لاعب جديد: السطر بالعدد (قراءة فقط) بعد الأسطر الخمسة، النافذة بثلاث معروضات بنصوصها حرفاً، الاختيار يُظلَّل ويُلخَّص (التقدم والمكافأة والمهلة)، التراجع بلا عقوبة، بلا تمرير أفقي (390 و1100)');
  // ٢) قسم «اليوم» في المكتب: نفس الخانات، اختيار بنقرة، وحالة متقدّمة (تقدّم وإنجاز وفاصل)
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'); await gotoToday(p);
    const sec = p.locator('#screen section.tasks'); a.equal(await sec.count(), 1, w + ': قسم «مهامك» في اليوم'); a.ok((await sec.locator('h2').textContent()).includes('مهامك')); a.equal(await wide(p), false);
    const v = await view(p); a.equal(await sec.locator('[data-dask^="tk:"]').count(), 2, 'خانتان قصيرة وأسبوعية'); await sec.scrollIntoViewIfNeeded();
    await sec.locator('[data-dask="tk:week"] .dopt').nth(1).click(); await p.waitForTimeout(500); const v2 = await view(p), pk = v2.slots[1];
    a.equal(pk.state, 'active'); a.equal(pk.id, v.slots[1].offers[1].id); a.equal(await p.locator('#screen section.tasks .dopt.on[aria-pressed="true"]').count(), 1, 'تظليل بعد النقر في اليوم');
    a.ok((await p.locator('#screen section.tasks [data-dask="tk:week"] .dres').textContent()).includes('المكافأة: ' + pk.reward));
    // تقدّم حقيقي: ينقص الفرق فيعرض «ك من ن» ثم يُنجَز بالفعل المطلوب فتظهر بطاقة الإنجاز والفاصل
    const doneId = await p.evaluate(() => { const { S, E } = __game; const sl = S.player.tk2.slots.short; sl.pick = { id: 'lr1', p: {} }; sl.st = { since: S.day, due: S.day + 6, base: { n: 0 }, n: 0, need: 1 }; sl.offer = []; __game.renderAll(true); return 'lr1'; });
    await p.waitForTimeout(300); a.ok((await p.locator('#screen section.tasks [data-dask="tk:short"] .dres').textContent()).includes('التقدم: 0 من 1'));
    await p.evaluate(() => { const { S, E } = __game; const L = S.learn; L.mj = L.mj || {}; L.mj.seen = Object.assign({}, L.mj.seen, { zz1: 1 }); const x0 = S.learn.xp; window.__x0 = [x0, E.bonus ? 1 : 0]; E.tasksDay(S); __game.renderAll(true); }); await p.waitForTimeout(400);
    const dv = await view(p); a.equal(dv.slots[0].state, 'wait'); a.ok(dv.slots[0].fin && dv.slots[0].fin.text === 'أجبتَ عن مسألة في المجلس', JSON.stringify(dv.slots[0].fin));
    const dt = (await p.locator('#screen section.tasks [data-tk-slot="short"]').textContent()).replace(/\s+/g, ' ');
    a.ok(dt.includes('أنجزتَ المهمة: أجبتَ عن مسألة في المجلس') && dt.includes('المكافأة: +4 خبرة') && dt.includes('أحسنت يا ولدي!') && /المهمة القادمة بعد \d+ أيام\./.test(dt), dt);
    a.equal(await p.locator('#screen section.tasks [data-tk-slot="short"] .dask.done').count(), 1);
    if (w === 390) { await sec.scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'tasks-390-advanced.png') }); }
    a.equal(await wide(p), false); await p.context().close(); }
  ok('«اليوم»: القسم بخانتين، الاختيار بنقرة يُظلَّل، والإنجاز يعرض بطاقة «أنجزتَ المهمة» والمكافأة والفاصل (390 و1100)');
  // ٣) الخانة الموسمية: غير الدينية (نفوذ ولقب) ثم الدينية (تجميلية فقط)
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'); a.ok(await seasonize(p, 'harvest', 12) != null, 'يوجد يوم للحصاد'); await gotoToday(p);
    const sv = await view(p); a.equal(sv.season.cur.length, 1); const c = sv.season.cur[0]; a.equal(c.religious, false);
    const t = (await p.locator('#screen [data-tk-slot="season"]').textContent()).replace(/\s+/g, ' ');
    a.ok(t.includes('مهمة الموسم') && t.includes('بدأ موسم الحصاد') && t.includes('التقدم: 12 من 40') && t.includes('المكافأة: +10 نفوذ ولقب «تاجر موسم الحصاد»'), t);
    a.ok(/اشترِ 40|بِع 40/.test(t), 'نص الهدف يطابق ما يُعدّ فعلاً: ' + t); a.equal(await p.locator('[data-tk-slot="season"] .dopt.on[aria-pressed="true"]').count(), 1);
    a.ok(!/ذهب/.test(c.reward)); a.equal(await wide(p), false); if (w === 390) { await p.locator('[data-tk-slot="season"]').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, 'tasks-390-season.png') }); }
    await p.context().close(); }
  { // الدينية: نصّ 008 كما هو والجائزة تجميلية فقط، ولا نفوذ يُمنح
    const p = await mk(b, 390, '?player=1&seed=5'); a.ok(await seasonize(p, 'ramadan', 5) != null); await gotoToday(p);
    const sv = await view(p), c = sv.season.cur[0]; a.equal(c.religious, true); a.equal(c.reward, 'زخرفة الموسم (تجميلية فقط)');
    const t = (await p.locator('#screen [data-tk-slot="season"]').textContent()).replace(/\s+/g, ' '); a.ok(t.includes('المكافأة: زخرفة الموسم (تجميلية فقط)') && !t.includes('نفوذ'), t);
    a.equal(await p.evaluate(([k]) => __game.E.seasonGoalView(__game.S).cur[0].text, ['x']), c.text, 'النص المعتمد في 008 حرفاً');
    await p.screenshot({ path: path.join(SHOTS, 'tasks-390-religious-season.png') }); a.equal(await wide(p), false); await p.context().close(); }
  ok('الموسمية: غير الدينية +10 نفوذ ولقب بنصٍّ يطابق ما يُعدّ فعلاً، والدينية جائزتها تجميلية فقط بنصّ 008 حرفاً، ولا ذهب (390 و1100)');
  // ٤) المطفأ: لا سطر ولا قسم ولا نافذة ولا حالة
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { __game.E.TASKS.on = false; __game.go('home'); }); await p.waitForTimeout(400);
    a.equal(await row(p).count(), 0, 'TASKS.on=false: لا سطر'); a.equal(await p.locator('#screen .hs .hs-row').count() >= 4, true, 'بقية الأسطر كما هي');
    await gotoToday(p); a.equal(await p.locator('#screen section.tasks').count(), 0, 'لا قسم في اليوم'); a.equal(await p.evaluate(() => __game.S.player.tk2), undefined, 'لا حالة'); a.ok(!JSON.stringify(await p.evaluate(() => JSON.parse(__game.E.save(__game.S)).player)).includes('"tk2"'), 'لا حقل في الحفظ');
    a.equal(await p.evaluate(() => __game.E.tasksBrief(__game.S)), null); await p.context().close(); }
  { const p = await mk(b, 390, '?seed=5'); a.equal(await row(p).count(), 0, 'بلا ?player=1 لا سطر'); await p.context().close(); }
  ok('المطفأ وبلا وضع اللاعب: لا سطر ولا قسم ولا حقل في الحفظ');
  await b.close(); a.deepEqual(errors, [], 'أخطاء صفحة: ' + errors.join(' | '));
  console.log('tasks-ui: كل الفحوص نجحت');
})().catch(e => { console.error(e); process.exit(1); });
