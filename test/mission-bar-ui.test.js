// WP-08: شريط المهمة الثابت: جملة وزر «نفّذها لي» تحت الشريط العلوي في الشاشات التسع، لا يغطي محتوى، ويختفي حيث يجب: node test/mission-bar-ui.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37';
const ok = m => console.log('OK   ' + m);
const SCREENS = ['home', 'office', 'map', 'market', 'caravan', 'estate', 'lords', 'empire', 'cities'];
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const width of [320, 390]) {
      const p = await (await b.newContext({ viewport: { width, height: 760 } })).newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.goto(URL); await p.waitForFunction(() => !!window.__game);
      await p.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 1, stage: 1, intro: 1, stageIntro: 1, welcome: 99, datePend: false, free: false }); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.m = {}; __game.renderAll(true); });
      await p.waitForTimeout(300);
      const seen = [];
      for (const id of SCREENS) {
        await p.evaluate(s => __game.go(s), id); await p.waitForTimeout(150);
        if (!(await p.locator('#journeyBar #missionBar').count())) continue; // شاشة قد تُقفل في م1
        const r = await p.evaluate(() => { const bar = document.getElementById('missionBar'), sc = document.getElementById('screen'), a = bar.getBoundingClientRect(), s = sc.getBoundingClientRect(), g = bar.querySelector('[data-act=mrun]').getBoundingClientRect(); return { txt: bar.innerText.length, right: a.right, left: a.left, barBottom: a.bottom, screenTop: s.top, goRight: g.right, goLeft: g.left, h: a.height, sw: document.documentElement.scrollWidth <= innerWidth + 1, wrap: bar.parentElement.id }; });
        assert.ok(r.txt > 10 && r.wrap === 'journeyBar', id + ': نص الشريط'); assert.ok(r.right <= width + 1 && r.left >= -1 && r.goRight <= width + 1 && r.goLeft >= -1, `${width}px ${id}: الشريط خارج العرض`); assert.ok(r.barBottom <= r.screenTop + 1, `${width}px ${id}: الشريط يغطي المحتوى`); assert.ok(r.sw, `${width}px ${id}: تمرير أفقي`); assert.ok(r.h < 140, `${id}: ارتفاع الشريط ${r.h}`);
        seen.push(id);
      }
      assert.ok(seen.length >= 8, width + 'px: يظهر في ' + seen.length + ' شاشات فقط: ' + seen.join(',')); ok(`${width}px: الشريط في ${seen.length} من ٩ شاشات، داخل العرض ولا يغطي المحتوى ولا تمرير أفقي`);
      // زر «نفّذها لي» ينفّذ الخطوة فعلاً (م1: شراء)
      await p.evaluate(() => __game.go('home')); await p.waitForTimeout(150);
      await p.locator('#missionBar [data-act=mrun]').click(); await p.waitForTimeout(250);
      assert.ok(await p.evaluate(() => { const c = __game.S.player.caravans[0]; return c.left > 0 || Object.values(c.cargo).some(v => v >= 1); }), 'الزر نفّذ خطوة المهمة (شراء أو سفر)'); ok(width + 'px: «نفّذها لي» ينفّذ الخطوة فعلاً');
      assert.equal(await p.locator('#journeyBar #mission').count(), 0, 'لا بطاقة #mission الكبيرة أعلى الشاشة');
      // م2: «ساعدني» فقط (guidanceOf)
      await p.evaluate(() => { const { S } = __game; Object.assign(S.learn, { level: 2, stage: 2, intro: 2, stageIntro: 2 }); S.learn.m = {}; __game.renderAll(true); }); await p.waitForTimeout(200);
      assert.equal(await p.locator('#missionBar').count(), 0, 'م2 بلا «ساعدني»: لا شريط'); ok(width + 'px: م2 بلا «ساعدني»: يختفي');
      // اللعب الحر بعد م10
      await p.evaluate(() => { const { S } = __game; Object.assign(S.learn, { level: 11, stage: 23, intro: 11, stageIntro: 22, free: true }); __game.renderAll(true); }); await p.waitForTimeout(200);
      assert.equal(await p.locator('#missionBar').count(), 0, 'اللعب الحر: لا شريط'); ok(width + 'px: اللعب الحر: يختفي');
      await p.context().close();
    }
    assert.deepEqual(errors, []); console.log('OK mission-bar-ui');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
