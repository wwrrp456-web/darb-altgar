// واجهة قصص الزعماء وأسرار الأسواق (جوال ٣٩٠px)
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=3&sched=0')); await p.waitForTimeout(2300);
  await p.evaluate(() => { const { S, E } = __game; S.learn.char = 'trader'; E.learnPerks(S); S.learn.intro = 3; S.learn.level = 3; S.phase = 2; S.pause = true; E.loreFix(S.learn); S.learn.cv.riyadh = 1; S.learn.cs.riyadh = 1500; S.learn.cv.riyadh = 2; E.loreCheck(S); __game.renderAll(true); });
  await p.waitForTimeout(300);
  const L = p.locator('#lesson');
  ok(/حكاية الزعيم/.test(await L.textContent()) && /الفصل 1 من 3/.test(await L.textContent()), 'نافذة فصل ١ من حكاية الزعيم');
  ok(await p.locator('#lesson img').count() >= 1, 'صورة الزعيم في النافذة');
  await p.screenshot({ path: '/tmp/shots/lore-boss1.png' });
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(200);
  ok(/سرّ السوق/.test(await L.textContent()) && /الواحة/.test(await L.textContent()), 'ثم نافذة سرّ السوق');
  await p.screenshot({ path: '/tmp/shots/lore-city.png' });
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(200);
  ok(await p.locator('#lesson[hidden]').count() === 1, 'تُغلق النوافذ');
  // شاشة الزعماء
  await p.evaluate(() => { __game.go('lords'); });
  await p.waitForTimeout(300);
  ok(await p.locator('.card.lore').count() === 1 && /1 من 3/.test(await p.locator('.card.lore').textContent()), 'بطاقة الحكاية في شاشة الزعيم (فصل واحد)');
  ok(/🔒 الفصل 2/.test(await p.locator('.card.lore').textContent()), 'الفصل ٢ مقفل بتلميح');
  await p.evaluate(() => { const { S, E } = __game; S.bosses.riyadh.trust = 40; E.loreCheck(S); S.learn.bq.length = 0; __game.renderAll(true); });
  await p.waitForTimeout(200);
  ok(/3 من 3/.test(await p.locator('.card.lore').textContent()) && /نصيحة|💡/.test(await p.locator('.card.lore').textContent()), 'الفصل ٣ يكشف النصيحة');
  await p.screenshot({ path: '/tmp/shots/lore-lords.png' });
  // الأكاديمية
  await p.evaluate(() => __game.go('academy')); await p.waitForTimeout(300);
  const t = await p.locator('#screen').textContent();
  ok(/دفتر الزعماء/.test(t) && /أسرار الأسواق/.test(t), 'قسما دفتر الزعماء وأسرار الأسواق في الأكاديمية');
  await p.screenshot({ path: '/tmp/shots/lore-academy.png', fullPage: true });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
