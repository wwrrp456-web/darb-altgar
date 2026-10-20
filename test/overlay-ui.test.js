// مدير الطبقات: طبقة واحدة، تجميد الوقت، قفل التمرير، إعادة فتح الحوار، بطاقة نتيجة الطريق: node test/overlay-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(2200);
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
  await p.waitForTimeout(300);
  const dlg = async () => p.evaluate(() => { const e = document.getElementById('dlg'); return { hidden: e.hidden, kids: e.children.length }; });
  // ١) فتح الحوار نفسه مرتين بعد إغلاقه لا يترك طبقة فارغة
  for (let i = 0; i < 3; i++) {
    await p.locator('.plaza .spot[data-g=riyadh_boss]').click(); await p.waitForTimeout(200);
    const d = await dlg(); ok(!d.hidden && d.kids > 0, 'المرة ' + (i + 1) + ': الحوار يظهر بمحتوى');
    ok(await p.evaluate(() => document.body.classList.contains('ovl') && getComputedStyle(document.body).overflow === 'hidden'), 'تمرير الخلفية مقفول');
    await p.locator('#dlg [data-act=dlgclose]').click(); await p.waitForTimeout(150);
    const e = await dlg(); ok(e.hidden && e.kids === 0 && !(await p.evaluate(() => document.body.classList.contains('ovl'))), 'بعد الإغلاق لا طبقة ولا قفل');
  }
  // ٢) الحوار يجمّد الوقت ولا تظهر فقاعة فوقه
  await p.evaluate(() => { __game.setSpeed(1); __game.S.learn.rq = ['restStart']; });
  await p.locator('.plaza .spot[data-g=riyadh_boss]').click(); await p.waitForTimeout(200);
  const day0 = await p.evaluate(() => __game.S.day); await p.waitForTimeout(1500);
  ok(await p.evaluate(d => __game.S.day === d, day0), 'الوقت متجمّد أثناء الحوار');
  ok(await p.evaluate(() => document.getElementById('react').hidden), 'لا فقاعة فوق الحوار');
  await p.locator('#dlg [data-act=dlgclose]').click(); await p.waitForTimeout(150);
  // ٣) إعادة التحميل بحوار مفتوح لا تعيد فتحه
  await p.locator('.plaza .spot[data-g=riyadh_boss]').click(); await p.waitForTimeout(200);
  const saved = await p.evaluate(() => { __game.E.A.dlgOpen(__game.S, Object.keys(__game.E.DLG.DIALOGS)[0]); return __game.E.save(__game.S); });
  ok(/"cur":\{/.test(saved), 'الحفظ يحوي حواراً مفتوحاً (الحالة المختبَرة)');
  ok(await p.evaluate(s => { const S2 = __game.E.load(s); return S2.story.cur === null; }, saved), 'التحميل يُفرغ الحوار الجاري');
  // ٤) بطاقة نتيجة الطريق
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.dlgClose(S); const m = S.player.caravans[0]; S.road = { k: 'bandits', day: S.day, car: m.id, to: 'jeddah', from: m.city, B: 10 }; g.renderAll(true); });
  await p.waitForTimeout(200);
  ok(await p.locator('#dlg [data-act=roadopt]').count() === 3, 'خيارات الطريق الثلاثة');
  await p.locator('#dlg [data-act=roadopt][data-c=pay]').click(); await p.waitForTimeout(200);
  ok(await p.locator('#dlg .road-res').count() === 1 && /ريال/.test(await p.locator('#dlg .road-res .dlg-say').innerText()), 'بطاقة النتيجة بسطر واحد');
  ok(await p.locator('#dlg .road-res [data-act=roadok]').count() === 1, 'زر حسناً');
  const d1 = await p.evaluate(() => __game.S.day); await p.waitForTimeout(1200);
  ok(await p.evaluate(d => __game.S.day === d, d1), 'الوقت متجمّد حتى «حسناً»');
  await p.locator('#dlg [data-act=roadok]').click(); await p.waitForTimeout(200);
  const f = await dlg(); ok(f.hidden && f.kids === 0, 'اختفت البطاقة بعد حسناً');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
