// WP-08ب: التوجيه يصل إلى هدفه: الهدف يُمرَّر إلى مكان مقروء، ومدينة الهدف تتوسط الخريطة مرة، وسهم الحافة بدل الاختفاء الصامت: node test/guide-reach-ui.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0', ok = m => console.log('OK   ' + m);
const setup = async (b, w, mission) => {
  const p = await (await b.newContext({ viewport: { width: w, height: 760 } })).newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(URL); await p.waitForFunction(() => !!window.__game);
  await p.evaluate(mission => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: mission ? 1 : 11, intro: mission ? 1 : 11, welcome: 99, datePend: false, free: !mission, ageStages: 1, stage: mission ? 1 : 23, stageIntro: mission ? 1 : 23 }); for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; if (S.climate) S.climate.pending = []; __game.setSpeed(0); }, mission);
  return p;
};
const errors = [];
const inView = p => p.evaluate(() => { const n = document.querySelector('.tut-hl'); if (!n) return { has: false }; const r = n.getBoundingClientRect(); return { has: true, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, spot: !document.getElementById('spot').hidden, arrow: !document.getElementById('spotArrow').hidden, hs: document.documentElement.scrollWidth <= innerWidth + 1 }; });
(async () => {
  const b = await chromium.launch();
  try {
    // ١) مهمة السفر الأولى: هدف خارج الشاشة يُمرَّر إليه ويُحاط بالإطار دون لمس
    for (const w of [320, 390]) {
      const p = await setup(b, w, true); await p.evaluate(() => { const { S, E } = __game; E.A.buy(S, S.player.caravans[0].id, 'wheat', 5); __game.go('map'); __game.renderAll(true); }); await p.waitForTimeout(900);
      const v = await inView(p); assert.ok(v.has, w + ': لا هدف مضيء'); assert.ok(v.top >= 0 && v.bottom <= v.vh, w + ': الهدف خارج الشاشة ' + JSON.stringify(v)); assert.ok(v.spot, w + ': الإطار مخفي'); assert.ok(!v.arrow, w + ': سهم مع هدف ظاهر'); assert.ok(v.hs, w + ': تمرير أفقي');
      const covered = await p.evaluate(() => { const n = document.querySelector('.tut-hl'), r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, t = document.elementFromPoint(x, y); return !(t === n || n.contains(t)); }); assert.ok(!covered, w + ': الهدف مغطّى بفقاعة'); ok(w + 'px: مهمة السفر: الهدف ظاهر وغير مغطّى والإطار حوله بلا أي لمس');
      await p.context().close();
    }
    // ٢) توسيط الخريطة: خريطة مقرّبة بعيداً عن مدينة الهدف ← تتوسط المدينة مرة، ثم لا يُفرض عليه إن حرّك الخريطة
    { const p = await setup(b, 390, false); await p.evaluate(() => { __game.go('map'); __game.renderAll(true); }); await p.waitForTimeout(400);
      await p.locator('[data-mc="all"]').first().click().catch(() => {}); for (let i = 0; i < 4; i++) await p.locator('[data-act=mapzoom][data-d="1"]').first().click().catch(() => {});
      const inMap = () => p.evaluate(() => { const g = document.querySelector('#map g[data-city="mecca"]'), m = document.getElementById('map'); if (!g || !m) return null; const a = g.getBoundingClientRect(), r = m.getBoundingClientRect(); return a.left >= r.left - 1 && a.right <= r.right + 1 && a.top >= r.top - 1 && a.bottom <= r.bottom + 1; });
      const before = await inMap(); assert.ok(before === false || before === null, 'التقريب لم يُبعد المدينة (يلزم تعديل الاختبار): ' + before);
      await p.evaluate(() => { const { S, E } = __game; Object.assign(S.learn, { level: 1, intro: 1, free: false, stage: 1, stageIntro: 1 }); E.A.buy(S, S.player.caravans[0].id, 'wheat', 5); __game.renderAll(true); }); await p.waitForTimeout(900);
      assert.equal(await inMap(), true, 'المدينة لم تتوسط الخريطة بعد ظهور التوجيه'); ok('الخريطة المقرّبة بعيداً عن الوجهة تتوسطها تلقائياً عند ظهور التوجيه');
      await p.locator('[data-act=mapzoom][data-d="-1"]').first().click(); await p.waitForTimeout(200);
      const z = await p.evaluate(() => document.getElementById('map').getAttribute('viewBox')); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(500);
      assert.equal(await p.evaluate(() => document.getElementById('map').getAttribute('viewBox')), z, 'أُعيد التمركز بعد أن حرّك اللاعب الخريطة'); ok('لا يُعاد التمركز بعد أن يحرّك اللاعب الخريطة بنفسه');
      await p.context().close(); }
    // ٣) هدف لا يمكن الوصول إليه بالتمرير: سهم على الحافة، ولمسه يوصل إليه
    { const p = await setup(b, 390, true); await p.addStyleTag({ content: 'html,body{overflow:hidden!important;height:100vh!important}' }); await p.evaluate(() => { const { S, E } = __game; E.A.buy(S, S.player.caravans[0].id, 'wheat', 5); __game.go('map'); __game.renderAll(true); }); await p.waitForTimeout(900);
      let v = await inView(p); assert.ok(v.has && v.top > v.vh, 'الهدف ليس خارج الشاشة: ' + JSON.stringify(v)); assert.ok(v.arrow, 'لا سهم حافة مع هدف خارج الشاشة'); assert.equal(await p.locator('#spotArrow').getAttribute('data-dir'), 'down'); assert.ok(await p.evaluate(() => { const r = document.getElementById('spotArrow').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }), 'السهم خارج الشاشة'); ok('هدف خارج الشاشة لا يمكن تمريره: يظهر سهم على الحافة السفلى (لا اختفاء صامت)');
      await p.addStyleTag({ content: 'html,body{overflow:auto!important;height:auto!important}' }); await p.locator('#spotArrow').click(); await p.waitForTimeout(900);
      v = await inView(p); assert.ok(v.top >= 0 && v.bottom <= v.vh && !v.arrow && v.spot, 'لمس السهم لم يوصل إلى الهدف: ' + JSON.stringify(v)); ok('لمس السهم يمرّر إلى الهدف فيظهر الإطار ويختفي السهم');
      await p.context().close(); }
    assert.deepEqual(errors, [], 'أخطاء JS'); ok('بلا أخطاء JS'); console.log('OK guide-reach-ui');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})();
