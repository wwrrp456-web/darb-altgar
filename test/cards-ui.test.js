// واجهة بطاقات الفقه والدليل: node test/cards-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&cards=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 6; S.learn.level = 6; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.learn.cards = ['f_sidq']; S.learn.cq = ['f_sidq']; g.renderAll(true); });
    await p.waitForTimeout(300);
    const t = await p.locator('#lesson').innerText();
    ok(/فقه التجارة/.test(t) && /الصدق والأمانة في البيع/.test(t), tag + 'تظهر بطاقة الفقه بعنوانها');
    ok(/متفق عليه/.test(t) && /رواه الترمذي/.test(t), tag + 'الأدلة بمصادرها');
    ok(/أهل العلم/.test(t), tag + 'تنبيه الرجوع لأهل العلم');
    ok(await p.locator('#lesson [data-act=lclose]').isDisabled(), tag + 'زر «فهمت» معطّل قبل الإجابة');
    await p.locator('#lesson [data-act=cqa][data-g="1"]').click(); await p.waitForTimeout(150);
    ok(/فكّر مرة أخرى/.test(await p.locator('#lesson').innerText()) && await p.locator('#lesson [data-act=lclose]').isDisabled(), tag + 'إجابة خاطئة: تلميح وتبقى مغلقة');
    await p.locator('#lesson [data-act=cqa][data-g="0"]').click(); await p.waitForTimeout(150);
    ok(/أحسنت/.test(await p.locator('#lesson').innerText()) && !(await p.locator('#lesson [data-act=lclose]').isDisabled()), tag + 'الإجابة الصحيحة تُظهر الشرح وتفتح الزر');
    await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.learn.cq.length === 0 && document.getElementById('lesson').hidden), tag + 'الإغلاق يرفع البطاقة من الطابور');
    // دليل الميدان بلا اختبار
    await p.evaluate(() => { const g = __game; g.S.learn.cards.push('g_season'); g.S.learn.cq = ['g_season']; g.renderAll(true); }); await p.waitForTimeout(250);
    ok(/دليل الميدان/.test(await p.locator('#lesson').innerText()) && !(await p.locator('#lesson [data-act=lclose]').isDisabled()), tag + 'بطاقة الدليل بلا اختبار تُغلق مباشرة');
    await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(200);
    // المكتبة
    await p.evaluate(() => __game.salem(true, 'lessons')); await p.waitForTimeout(250);
    ok(/فقه التجارة/.test(await p.locator('#salemPanel').innerText()) && await p.locator('#salemPanel [data-act=cview]').count() === 2, tag + 'المكتبة تعرض البطاقتين');
    await p.locator('#salemPanel [data-act=cview][data-g=f_sidq]').click(); await p.waitForTimeout(250);
    ok(/الصدق والأمانة/.test(await p.locator('#lesson').innerText()) && !(await p.locator('#lesson [data-act=lclose]').isDisabled()), tag + 'إعادة قراءة بطاقة من المكتبة (بلا قفل)');
    await p.locator('#lesson [data-act=lclose]').click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById('lesson').hidden && __game.S.learn.cq.length === 0), tag + 'إغلاق العرض لا يمس الطابور');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
