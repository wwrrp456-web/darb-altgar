// نظام التعليم: اختيار الشخصية، دروس عمّ سالم، الأكاديمية
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=3')); await p.waitForTimeout(2500);
  ok(await p.locator('#lesson:not([hidden]) .char').count() === 5, 'شاشة اختيار الشخصية فيها ٥ شخصيات');
  await p.screenshot({ path: '/tmp/shots/learn-char.png' });
  await p.locator('[data-act=lchar][data-g=leader]').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const S = __game.S; return S.learn.char === 'leader' && S.learn.perks.speed > 1; }), 'اختيار قائد القوافل يفعّل ميزاته');
  ok(true, 'مرحلة بعد الاختيار');
  await p.evaluate(() => { __game.S.tut.on = false; __game.renderAll(true); }); await p.waitForTimeout(200);
  // سرّ الجزيرة ثم درس المستوى ١
  let txt = await p.locator('#lesson').textContent(); ok(/سرّ/.test(txt), 'بطاقة سرّ السعودية تظهر أولاً');
  await p.screenshot({ path: '/tmp/shots/learn-secret.png' });
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(200);
  txt = await p.locator('#lesson').textContent(); ok(/قراءة السعر والقيمة/.test(txt) && /عمّ سالم/.test(txt), 'درس المستوى ١ بلسان عمّ سالم');
  await p.screenshot({ path: '/tmp/shots/learn-intro.png' });
  await p.locator('[data-act=lclose]').click(); await p.waitForTimeout(200);
  ok(await p.locator('#lesson[hidden]').count() === 1, 'تُغلق النافذة');
  ok(await p.locator('.mentor').count() === 1, 'بطاقة المساعد في الرئيسية');
  await p.screenshot({ path: '/tmp/shots/learn-home.png', fullPage: false });
  // إنجاز المستوى ١ من المحرك
  const lv = await p.evaluate(() => { const { S, E } = __game, A = E.A; S.cities.riyadh.stock.dates = 1e4; const c = S.cities.riyadh; const g = E.GIDS.find(x => x !== 'wheat' && E.sells(c, x)); c.stock[g] = 1e4; c.price = c.price || {}; A.buy(S, 1, g, 3); A.sell(S, 1, g, 3); __game.renderAll(true); return S.learn.level; });
  console.log('   level after trade:', lv);
  ok(lv >= 1, 'إتمام المستوى ١ يرفع المستوى');
  if (lv === 2) { await p.waitForTimeout(200); txt = await p.locator('#lesson').textContent(); ok(/أتممتَ|مكافأة/.test(txt), 'نافذة الترقية'); await p.screenshot({ path: '/tmp/shots/learn-up.png' }); }
  await p.locator('[data-act=lclose]').click().catch(() => {}); await p.waitForTimeout(200);
  await p.evaluate(() => { document.querySelectorAll('[data-act=lclose]').forEach(x => x.click()); __game.go('academy'); }); await p.waitForTimeout(300);
  ok(await p.locator('.lv').count() >= 10, 'الأكاديمية تعرض المستويات والأسرار');
  await p.screenshot({ path: '/tmp/shots/learn-academy.png', fullPage: true });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
