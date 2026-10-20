// عمّ سالم قائمة منسدلة في الشريط العلوي: node test/salem-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    ok(await p.locator('#hSalem').isHidden(), tag + 'الزر مخفي قبل اختيار الشخصية');
    await p.evaluate(() => { const S = __game.S; __game.E.A.learnSetChar(S, 'trader'); S.learn.intro = 1; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => { S.learn[k].length = 0; }); __game.renderAll(true); }); await p.waitForTimeout(400);
    ok(await p.locator('#hSalem').isVisible(), tag + 'زر عمّ سالم ظاهر في الشريط العلوي');
    for (const scr of ['home', 'market', 'map', 'caravan']) { await p.evaluate(s => __game.go(s), scr); await p.waitForTimeout(250); if (await p.locator('#journeyBar #mission, #app > #mission').count()) ok(false, tag + 'لا بطاقة مهمة ثابتة في ' + scr); }
    ok(await p.locator('#journeyBar #mission').count() === 0, tag + 'لا بطاقة مهمة ثابتة أعلى أي شاشة');
    ok(await p.locator('#salemPanel').isHidden(), tag + 'القائمة مطوية افتراضياً');
    // الفتح والإغلاق
    await p.locator('#hSalem').click(); await p.waitForTimeout(250);
    ok(await p.locator('#salemPanel').isVisible() && await p.locator('#hSalem').getAttribute('aria-expanded') === 'true', tag + 'الضغط على الزر يفتح القائمة');
    ok(await p.locator('#salemPanel #mission').count() === 1 && await p.locator('#salemPanel [data-act=mrun], #salemPanel .goals, #salemPanel .lgoal').count() >= 1, tag + 'تبويب «مهمتي» فيه المهمة والأهداف');
    const box = await p.locator('#salemPanel').boundingBox(), top = await p.evaluate(() => document.getElementById('top').getBoundingClientRect().bottom);
    ok(box.y >= top - 1 && box.x >= 0 && box.x + box.width <= vp.width + 1, tag + 'تنزل تحت الشريط داخل الشاشة (' + Math.round(box.y) + ' ≥ ' + Math.round(top) + ')');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag + 'لا تمرير أفقي والقائمة مفتوحة');
    // التبويبات
    await p.locator('[data-act=salemtab][data-g=ask]').click(); await p.waitForTimeout(250);
    ok(/صفقة|السوق|محفظتي/.test(await p.locator('#salemPanel').innerText()), tag + 'تبويب «اسألني» فيه أقسام المستشار');
    await p.locator('#salemPanel [data-act=advtab][data-g=market]').click(); await p.waitForTimeout(250);
    ok(await p.locator('#salemPanel').isVisible(), tag + 'القائمة تبقى مفتوحة عند تبديل القسم');
    await p.evaluate(() => { const L = __game.S.learn; L.hist = [{ d: 3, t: 'اشتريتَ وبعتَ فأحسنت.', m: 'proud' }]; __game.renderAll(true); });
    await p.locator('[data-act=salemtab][data-g=hist]').click(); await p.waitForTimeout(200);
    ok(/أحسنت/.test(await p.locator('#salemPanel').innerText()), tag + 'تبويب «ما قاله» يعرض السجل');
    await p.locator('[data-act=salemtab][data-g=lessons]').click(); await p.waitForTimeout(200);
    ok(await p.locator('#salemPanel [data-act=lview]').count() >= 1, tag + 'تبويب «دروسي» فيه الدروس السابقة');
    // الإغلاق بالضغط خارجاً وبالزر وبـ Esc
    await p.mouse.click(vp.width / 2, vp.height - 6); await p.waitForTimeout(250);
    ok(await p.locator('#salemPanel').isHidden(), tag + 'الضغط خارج القائمة يطويها');
    await p.locator('#hSalem').click(); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await p.locator('#salemPanel').isHidden(), tag + 'Esc يطويها');
    await p.locator('#hSalem').click(); await p.waitForTimeout(200); await p.locator('[data-act=salemclose]').click(); await p.waitForTimeout(200);
    ok(await p.locator('#salemPanel').isHidden(), tag + 'زر الإغلاق يطويها');
    // الإطلالة الصغيرة عند خطوة جديدة في المستويات الأولى لا تحجب الضغط
    await p.evaluate(() => { __game.go('market'); __game.S.learn.hist = []; __game.renderAll(true); }); await p.waitForTimeout(300);
    const pk = await p.evaluate(() => { const e = document.getElementById('salemPeek'); return { hidden: e.hidden, pe: getComputedStyle(e).pointerEvents }; });
    ok(pk.pe === 'none', tag + 'الإطلالة لا تعترض ضغط ما تحتها');
    ok(await p.locator('#hSalem').isVisible(), tag + 'زر عمّ سالم ظاهر في الشريط');
    // نقطة التنبيه عند تعليق جديد
    await p.evaluate(() => { const L = __game.S.learn; L.rq.push('buy'); __game.renderAll(true); }); await p.waitForTimeout(400);
    ok(await p.evaluate(() => !document.querySelector('#hSalem .dot').hidden), tag + 'نقطة تنبيه على الزر عند تعليق جديد');
    await p.locator('#hSalem').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => document.querySelector('#hSalem .dot').hidden), tag + 'فتح القائمة يطفئ النقطة');
    await ctx.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
