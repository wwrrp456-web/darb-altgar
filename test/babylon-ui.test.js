// واجهة حكمة بابل: شريحة الدَّين ونافذة الخطة والألواح (جوال ٣٩٠px)
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=3')); await p.waitForTimeout(2300);
  await p.evaluate(() => { const { S, E } = __game; E.A.learnSetChar(S, 'trader'); S.learn.intro = 3; S.learn.level = 3; S.learn.sq.length = 0; S.pause = true; __game.renderAll(true); });
  await p.waitForTimeout(300);
  ok(await p.locator('#hDebt:not([hidden])').count() === 1 && /1,?500|١٬?٥٠٠|1500/.test((await p.locator('#hDebt').textContent()).replace(/[\s,٬]/g, '')) || await p.locator('#hDebt:not([hidden])').count() === 1, 'شريحة دَين الجدّ تظهر في الشريط العلوي');
  await p.screenshot({ path: '/tmp/shots/bab-hud.png' });
  await p.locator('#hDebt').click(); await p.waitForTimeout(250);
  const L = p.locator('#lesson');
  ok(/الدَّين والحصّالة/.test(await L.textContent()) && await p.locator('[data-act=dplan]').count() === 1, 'نافذة الدَّين فيها زر الخطة');
  await p.screenshot({ path: '/tmp/shots/bab-debt.png' });
  await p.locator('[data-act=dplan]').click(); await p.waitForTimeout(250);
  ok(await p.evaluate(() => __game.S.player.famDebt.plan === true), 'تفعيل خطة ظافر من النافذة');
  await p.evaluate(() => { __game.S.player.gold = 4000; __game.renderAll(true); }); await p.waitForTimeout(150);
  await p.locator('[data-act=dpay][data-q="500"]').click(); await p.waitForTimeout(250);
  ok(await p.evaluate(() => Math.round(__game.S.player.famDebt.left) === 1000), 'دفع ٥٠٠ ينقص الدَّين إلى ١٠٠٠');
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(200);
  ok(await p.locator('#lesson[hidden]').count() === 1, 'تُغلق النافذة');
  // لوح طيني
  await p.evaluate(() => { const { S, E } = __game; S.player.vault = 50; E.tabletCheck(S); __game.renderAll(true); }); await p.waitForTimeout(250);
  ok(/لوح طيني/.test(await L.textContent()) && /العلاج الأول/.test(await L.textContent()), 'نافذة لوح العلاج الأول');
  await p.screenshot({ path: '/tmp/shots/bab-tablet.png' });
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(150);
  // تحرر
  await p.evaluate(() => { __game.S.player.gold = 5000; __game.E.A.debtPay(__game.S, 1000); __game.renderAll(true); }); await p.waitForTimeout(250);
  ok(/خرجتَ حرّاً/.test(await L.textContent()), 'نافذة التحرر من الدَّين');
  await p.screenshot({ path: '/tmp/shots/bab-free.png' });
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(200);
  await p.evaluate(() => { __game.E.loreFix(__game.S.learn); __game.S.learn.tq.length = 0; __game.S.learn.fq.length = 0; __game.renderAll(true); });
  ok(await p.locator('#hDebt[hidden]').count() === 1, 'تختفي الشريحة بعد التحرر');
  // أحداث بابل
  await p.evaluate(() => { const { S } = __game; S.learn.eq.push({ id: 'broker', day: S.day, dep: 400 }); S.pause = true; __game.renderAll(true); }); await p.waitForTimeout(250);
  ok(/سمسار الثراء السريع/.test(await L.textContent()) && await p.locator('[data-act=evch]').count() === 3, 'حدث السمسار بثلاثة خيارات');
  await p.screenshot({ path: '/tmp/shots/bab-broker.png' });
  await p.locator('[data-act=evch][data-g=ask]').click(); await p.waitForTimeout(250);
  ok(await p.evaluate(() => __game.S.learn.eq.length === 0 && __game.S.learn.ev.brokerNo === 1), 'سؤال الخبير ينقذ المال');
  await p.evaluate(() => { const { S } = __game; S.learn.tq.length = 0; S.learn.eq.push({ id: 'friend', day: S.day, type: 'emotion', amt: 300 }); __game.renderAll(true); }); await p.waitForTimeout(250);
  ok(/صديق يطلب قرضاً/.test(await L.textContent()), 'حدث الصديق المقترض');
  await p.locator('[data-act=evch][data-g=no]').click(); await p.waitForTimeout(200);
  await p.evaluate(() => { const { S } = __game; S.learn.tq.length = 0; S.learn.eq.length = 0; S.learn.level = 9; S.learn.intro = 9;  document.querySelector('[data-act=profile]') && 0; __game.renderAll(true); }); await p.waitForTimeout(150);
  await p.locator('[data-act=profile]').first().click(); await p.waitForTimeout(250);
  const pt = await p.locator('#profile').textContent();
  ok(/أسوار بابل/.test(pt) && /إتقان الحرفة/.test(pt) && /رغبتي/.test(pt) && /رحلة الحرية/.test(pt), 'ملف التاجر: الأسوار والإتقان والرغبة والحرية');
  await p.screenshot({ path: '/tmp/shots/bab-profile.png', fullPage: true });
  await p.locator('#wishamt').fill('9000'); await p.locator('[data-act=wset]').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => __game.S.learn.wish && __game.S.learn.wish.amt === 9000), 'تحديد الرغبة من الملف');
  await p.locator('[data-act=pclose]').click(); await p.waitForTimeout(150);
  // الأكاديمية
  await p.evaluate(() => { __game.S.learn.level = 4; __game.go('academy'); }); await p.waitForTimeout(300);
  const t = await p.locator('#screen').textContent();
  ok(/حكايات بابل/.test(t) && /الألواح الطينية/.test(t), 'قسما الحكايات والألواح في الأكاديمية');
  await p.screenshot({ path: '/tmp/shots/bab-academy.png', fullPage: true });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
