// كتابة كلام عمّ سالم حيّةً (الدرس والتعليق): node test/typing-salem.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4&type=1';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL);
  await p.waitForSelector('#lesson .bub.typing', { timeout: 8000 });
  await p.waitForTimeout(100);
  const t1 = (await p.locator('#lesson .msay .bub').first().innerText()).length;
  ok(await p.locator('#lesson .bub.typing').count() === 1, 'كلام عمّ سالم في الدرس يُكتب حيّاً (' + t1 + ' حرفاً)');
  await p.waitForTimeout(600);
  ok((await p.locator('#lesson .msay .bub').first().innerText()).length > t1, 'يزداد النص مع الوقت');
  await p.locator('#lesson .bub.typing').click(); await p.waitForTimeout(100);
  ok(await p.locator('#lesson .bub.typing').count() === 0, 'النقر يكمل النص');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
