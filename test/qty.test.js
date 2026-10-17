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
  // بطاقات السلع
  const gq = '.gcard .qin'; ok(await p.locator(gq).count() > 0, 'بطاقات السلع فيها محدّد');
  const g0 = p.locator('.gcard').filter({ has: p.locator('.qin') }).first();
  await g0.locator('[data-d="1"]').first().click(); await p.waitForTimeout(100);
  const g1 = await p.locator('.gcard .qin').first().inputValue(); ok(+g1 === 2, 'سهم ▲ في بطاقة السلعة يزيد الكمية إلى ٢');
  ok(!(await p.locator('#modal').isVisible()), 'ضغط الأسهم لا يفتح نافذة التفصيل');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'لا تمرير أفقي');
  await p.screenshot({ path: path.join(__dirname, 'qty-mobile.png') });
  ok(errs.length === 0, 'no console errors ' + errs.join('|'));
  await b.close(); console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
})();
