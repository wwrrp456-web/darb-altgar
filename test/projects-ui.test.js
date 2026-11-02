'use strict';
// 015ب: المشاريع الكبرى في المكتب على 390px: درجة أولى بمشروعين، دفع مرحلة بالنقر، الدرجات العالية مقفلة مرئية، الموسوم ⚑ غير ظاهر، مفتاح الرجوع يخفي القسم، بلا تمرير أفقي
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/projects'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
    const prep = async gold => p.evaluate(gold => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.player.gold = gold; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = [];
      S.learn.tab = (S.learn.tab || []).concat(Object.keys(E.TABLETS || {})); g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('office'); g.renderAll(true); }, gold);
    const clean = async () => { await p.evaluate(() => { __game.setSpeed(0); const m = document.getElementById('modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } const l = document.getElementById('lesson'); if (l) l.remove(); document.querySelectorAll('#splash,#spot,#spotArrow').forEach(e => e.remove()); }); };
    const noScroll = async w => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, w + ': لا تمرير أفقي');
    await prep(5000); await p.waitForTimeout(300); await clean();
    // قبل العتبة: سطر الدرجة الأولى فقط
    let sec = p.locator('.projects'); assert.equal(await sec.count(), 1, 'قسم المشاريع الكبرى'); assert.ok(/250,000/.test(await sec.innerText()), 'عتبة الدرجة الأولى'); assert.equal(await p.locator('.pjcard').count(), 0); await noScroll('قبل العتبة');
    // بلوغ العتبة
    await p.evaluate(() => { const { S, E } = __game; S.player.gold = 300000; for (let i = 0; i < 3; i++) { E.tick(S, false); S.pause = false; } __game.renderAll(true); }); await p.waitForTimeout(300); await clean();
    assert.equal(await p.locator('.pjcard').count(), 2, 'مشروعا الدرجة الأولى'); const t = await p.locator('.projects').innerText(); assert.ok(t.includes('لوحة أسعار السوق') && t.includes('محطة استراحة على الطريق') && t.includes('الأثر'), 'الاسم والأثر'); assert.ok(/درجات أعلى مقفلة/.test(t), 'الدرجات العليا مقفلة مرئية');
    for (const hidden of ['ساحة السوق', 'البيمارستان', 'الجامعة والمكتبة', 'دار الترجمة']) { assert.ok(!(await p.evaluate(() => document.body.innerText)).includes(hidden), hidden + ' مخفي حتى اعتماد المختص'); }
    await noScroll('الدرجة الأولى'); await p.evaluate(() => window.scrollTo(0, document.querySelector('.projects').getBoundingClientRect().top + scrollY - 80)); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, 'tier1-390.png') });
    // دفع مرحلة بالنقر
    const gold0 = await p.evaluate(() => __game.S.player.gold); await p.evaluate(() => document.querySelector('[data-project=P19] [data-act=pjfund]').click()); await p.waitForTimeout(250);
    const after = await p.evaluate(() => ({ g: __game.S.player.gold, paid: __game.S.projects.paid.P19, pick: __game.S.projects.pick.P19 })); assert.equal(after.paid, 1); assert.equal(Math.round(gold0 - after.g), 15000); assert.ok(after.pick);
    const card = await p.locator('[data-project=P19]').innerText(); assert.ok(/قيد الإنشاء/.test(card) && /مدفوع 15,000/.test(card), 'حالة الإنشاء'); assert.equal(await p.locator('[data-project=P19] [data-act=pjfund]').count(), 0, 'لا دفع قبل انقضاء المدة'); await noScroll('بعد الدفع');
    await p.evaluate(() => window.scrollTo(0, document.querySelector('[data-project=P19]').getBoundingClientRect().top + scrollY - 80)); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, 'building-390.png') });
    // درجة عالية بالثروة المولَّدة: بطاقات أكثر بلا تمرير أفقي
    await p.evaluate(() => { const { S, E } = __game; S.projects.peak = 5e8; S.projects.tier = 6; S.player.gold = 1e9; __game.renderAll(true); }); await p.waitForTimeout(300); await clean();
    assert.ok(await p.locator('.pjcard').count() >= 8, 'مشاريع الدرجات الست'); await noScroll('درجة 6'); await p.evaluate(() => window.scrollTo(0, document.querySelector('.projects').getBoundingClientRect().top + scrollY - 80)); await p.waitForTimeout(150); await p.screenshot({ path: path.join(OUT, 'tier6-390.png') });
    // مفتاح الرجوع
    await p.evaluate(() => { __game.E.PROJ.on = false; __game.renderAll(true); }); await p.waitForTimeout(200); assert.equal(await p.locator('.projects').count(), 0, 'مطفأ: لا قسم');
    assert.deepEqual(errors, []); ok('المشاريع الكبرى على 390: درجة أولى ودفع مرحلة والدرجات العليا مقفلة والموسوم مخفي ومفتاح الرجوع، بلا تمرير أفقي'); console.log('\nprojects-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
