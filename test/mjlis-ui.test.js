// مجلس السوق ودفتر الأحكام (واجهة): node test/mjlis-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 5; S.learn.intro = 5; S.learn.abroad = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.noShocks = true; S.learn.eq.push({ id: 'mj', day: S.day, c: 'aib' }); g.go('market'); g.renderAll(true); });
    await p.waitForTimeout(500);
    const txt = await p.locator('#lesson').innerText();
    ok(/قضاء زعيم السوق|مجلس السوق|شاهد في الساحة/.test(txt) && /خيار العيب/.test(txt) && /للفتوى|يُرجع لأهل العلم/.test(txt), tag + 'يظهر مشهد المسألة مع العبارة التعليمية الثابتة');
    ok(await p.locator('#lesson .mjopts button').count() === 3, tag + 'ثلاثة خيارات');
    ok(!(await p.locator('#lesson').innerText()).includes('الحكم:'), tag + 'الحكم لا يظهر قبل الاختيار');
    const g0 = await p.evaluate(() => __game.S.player.gold);
    await p.locator('#lesson .mjopts button').nth(1).click(); await p.waitForTimeout(400);
    const t2 = await p.locator('#lesson').innerText();
    ok(/الحكم:/.test(t2) && /لماذا؟/.test(t2) && /معنى الكلمات/.test(t2) && /للكبار والتفصيل/.test(t2) && /\+1 بركة/.test(t2), tag + 'بعد الإجابة الصحيحة: الحكم المبسط ولماذا ومعنى الكلمات ومطوية للكبار وبركة');
    ok(/حكم الشريعة الذي استقر عليه أهل العلم هو/.test(t2) && /قال /.test(t2), tag + 'قضاء الزعيم: صياغة «حكم الشريعة الذي استقر عليه أهل العلم»');
    ok(!/الدليل:/.test(t2), tag + 'الدليل مطويّ حتى يفتحه القارئ');
    await p.locator('#lesson details summary').click(); await p.waitForTimeout(200);
    const t2b = await p.locator('#lesson').innerText(); ok(/الدليل:/.test(t2b) && /وجه الخلاف:/.test(t2b) && /جمهور الفقهاء/.test(t2b), tag + 'للكبار: الدليل ووجه الخلاف والمرجع');
    ok(await p.evaluate(() => __game.S.player.gold) === g0, tag + 'لا أثر مالي');
    ok(await p.evaluate(() => document.querySelector('#lesson').scrollWidth <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await p.locator('#lesson [data-g=close]').click(); await p.waitForTimeout(400);
    ok(await p.locator('#lesson').isHidden() || !(await p.locator('#lesson .mjopts').count()), tag + 'الإغلاق يخفي النافذة');
    await p.evaluate(() => { __game.go('academy'); __game.renderAll(true); }); await p.waitForTimeout(400);
    const ac = await p.locator('#screen').innerText();
    ok(/دفتر أحكام التجارة/.test(ac) && /خيار العيب/.test(ac) && /رصيد البركة 1/.test(ac) && /مسائل 1 من 45/.test(ac) && /مسألة الأسبوع: اقرأها الآن/.test(ac), tag + 'دفتر الأحكام في الأكاديمية يعرض المسألة والرصيد');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'الأكاديمية بلا تمرير أفقي');
    // إجابة خاطئة
    await p.evaluate(() => { const S = __game.S; S.learn.eq.push({ id: 'mj', day: S.day, c: 'qabd' }); __game.go('market'); __game.renderAll(true); }); await p.waitForTimeout(400);
    await p.locator('#lesson .mjopts button').nth(0).click(); await p.waitForTimeout(400);
    const t3 = await p.locator('#lesson').innerText(); ok(/اخترتَ:/.test(t3) && !/\+1 بركة/.test(t3) && /الحكم:/.test(t3) && /بحسب ما قرره فقهاء المسلمين/.test(t3), tag + 'الإجابة الخاطئة: يظهر اختيارك والحكم بلا بركة');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
