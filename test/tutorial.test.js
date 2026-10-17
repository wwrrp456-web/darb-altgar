// تظليل عمّ سالم في المستويات الأولى: يدلّ اللاعب الجديد على الزر المطلوب خطوة بخطوة: node test/tutorial.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ' console: ' + m.text()));
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=' + (process.env.SEED || 3)); await p.waitForTimeout(2300);
    ok(await p.locator('#coach').count() === 0, name + ': لا توجد بطاقة جولة قديمة');
    await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; __game.E.learnPerks(S); S.learn.intro = 1; __game.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('#lesson[hidden]').count() === 1, name + ': لا نافذة تحجب الشاشة');
    ok(await p.locator('#mission [data-act=mrun].tut-hl').count() === 1, name + ': يُضاء زر المهمة (اشترِ)');
    await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/shots/spot-' + name + '-1.png' });
    await p.click('#mission [data-act=mrun]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.E.loadOf(__game.S.player.caravans[0])) > 0, name + ': تمّ الشراء');
    ok(await p.locator('#mission [data-act=mrun].tut-hl').count() === 1, name + ': ينتقل التظليل إلى زر «بِع»');
    await p.screenshot({ path: '/tmp/shots/spot-' + name + '-2.png' });
    await p.click('#mission [data-act=mrun]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => __game.S.learn.ev.sell >= 1), name + ': تمّ البيع وسُجّل في مسار التعلّم');
    ok(await p.evaluate(() => __game.S.learn.level === 2), name + ': اكتمل المستوى ١ بعد أول شراء وبيع (لا تكرار)');
    await p.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
