// محدّد الكمية بأسهم: الصفقات وبطاقات السلع
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '../index.html?seed=3#market')); await p.waitForTimeout(500);
  await p.evaluate(() => { try { document.querySelector('[data-act=tutskip]').click(); } catch (e) {} });
  await p.waitForTimeout(200);
  const deal = '.deal .qin';
  ok(await p.locator(deal).count() > 0, 'بطاقات الصفقات فيها محدّد كمية');
  const v0 = +await p.locator(deal).first().inputValue();
  await p.locator('.deal [data-d="-1"]').first().click(); await p.waitForTimeout(100);
  const v1 = +await p.locator(deal).first().inputValue();
  ok(v1 === Math.max(1, v0 - 1), 'سهم ▼ ينقص الكمية (' + v0 + '→' + v1 + ')');
  await p.locator('.deal [data-d="999999"]').first().click(); await p.waitForTimeout(100);
  const vm = +await p.locator(deal).first().inputValue(), mx = +await p.locator(deal).first().getAttribute('max');
  ok(vm === mx, 'أقصى يصل للحدّ (' + vm + ')');
  ok(await p.locator('.deal .qnote').first().isVisible(), 'تظهر ملاحظة الحدّ عند الأقصى');
  ok(await p.locator('.deal [data-d="1"]').first().isDisabled(), 'سهم ▲ معطّل عند الحدّ');
  ok(/اشترِ \d+ وسافر/.test(await p.locator('.deal .pri').first().innerText()), 'زر الشراء يعرض الكمية المختارة');
  // نافذة السلعة (التفاصيل صارت في الورقة السفلية)
  await p.locator('.gcard[data-gd=wheat] .top').click(); await p.waitForTimeout(200);
  const m = p.locator('#modal');
  ok(await m.locator('.qin').count() > 0, 'نافذة السلعة فيها محدّد');
  const q0 = +await m.locator('.qin').first().inputValue();
  await m.locator('[data-d="1"]').first().click(); await p.waitForTimeout(100);
  const q1 = +await m.locator('.qin').first().inputValue(); ok(q1 === q0 + 1, 'سهم ▲ في النافذة يزيد الكمية (' + q0 + '→' + q1 + ')');
  await m.locator('button.pri[data-act="buy"]').first().click(); await p.waitForTimeout(150);
  // البيع بأسهم
  ok(await m.locator('[data-act="sell"]').count() >= 2, 'بعد الشراء تظهر أزرار البيع');
  const have = +(await m.locator('.qin').last().getAttribute('max'));
  ok(have >= 1, 'حدّ البيع = ما تملكه (' + have + ')');
  await m.locator('[data-d="999999"]').last().click(); await p.waitForTimeout(80);
  ok((await m.locator('.qnote').last().innerText()).includes('كل ما تملكه'), 'ملاحظة: هذا كل ما تملكه');
  await m.locator('[data-d="-1"]').last().click(); await p.waitForTimeout(80);
  const q3 = +await m.locator('.qin').last().inputValue(); ok(q3 === Math.max(1, have - 1), 'سهم ▼ في البيع ينقص الكمية');
  await m.locator('button.pri[data-act="sell"]').click(); await p.waitForTimeout(150);
  const left = await p.evaluate(() => Math.floor(window.__game.S.player.caravans[0].cargo.wheat || 0));
  ok(left === have - q3, 'بعد البيع يتبقى ' + left + ' من ' + have);
  await p.keyboard.press('Escape');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'لا تمرير أفقي');
  await p.screenshot({ path: path.join(__dirname, 'qty-mobile.png') });
  ok(errs.length === 0, 'no console errors ' + errs.join('|'));
  await b.close(); console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
})();
