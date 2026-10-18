// الحفظ الفوري على الجوال وزر «لعبة جديدة»: node test/save.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?seed=3';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(2200);
  await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; __game.E.learnPerks(S); S.learn.intro = 1; __game.renderAll(true); });
  await p.evaluate(() => { const g = __game, m = g.S.player.caravans[0]; g.E.A.buy(g.S, m.id, 'wool', 3); g.renderAll(true); });
  await p.waitForTimeout(600); // بلا أي حدث مغادرة: الحفظ بعد الفعل نفسه
  ok(await p.evaluate(() => !!localStorage.getItem('darb-v3')), 'يُحفظ التقدّم بعد الفعل دون انتظار ٥ أيام ولا حدث مغادرة');
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message)); await p2.goto(URL.replace('?seed=3', '?seed=99')); await p2.waitForTimeout(2200);
  ok(await p2.evaluate(() => __game.S.player.caravans[0].cargo.wool === 3), 'فتح جديد (كأنه بعد قتل التطبيق) يستعيد القافلة بالبضاعة');
  await p2.close();
  // زر لعبة جديدة بتأكيدين
  await p.evaluate(() => { __game.go ? __game.go('home') : (location.hash = 'home'); }); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('[data-go=home]').click()); await p.waitForTimeout(200);
  ok(await p.locator('[data-act=newask]').count() === 1, 'زر «لعبة جديدة» ظاهر في الرئيسية للاعب العادي');
  await p.locator('[data-act=newask]').click(); await p.waitForTimeout(150);
  ok(await p.locator('[data-act=newgo]').count() === 1 && await p.evaluate(() => __game.S.player.caravans[0].cargo.wool === 3), 'يطلب تأكيداً ولا يمسح قبله');
  await p.locator('[data-act=newcancel]').click(); await p.waitForTimeout(150);
  ok(await p.locator('[data-act=newgo]').count() === 0 && await p.evaluate(() => __game.S.player.caravans[0].cargo.wool === 3), 'التراجع يُبقي التقدّم');
  await p.locator('[data-act=newask]').click(); await p.locator('[data-act=newgo]').click(); await p.waitForTimeout(700);
  ok(await p.evaluate(() => !__game.S.player.caravans[0].cargo.wool && !__game.S.learn.char), 'التأكيد يبدأ لعبة جديدة (بلا شخصية ولا بضاعة)');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('darb-v3')).learn.char === null), 'اللعبة الجديدة هي المحفوظة');
  // ملف التاجر
  await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; __game.E.learnPerks(S); S.learn.intro = 1; __game.renderAll(true); });
  await p.locator('[data-act=profile]').first().click(); await p.waitForTimeout(250);
  ok(await p.locator('#profile [data-act=newask]').count() === 1, 'الزر موجود في ملف التاجر أيضاً');
  // وضع المطوّر لا يبقى بين الفتحات
  const c2 = await b.newContext({ viewport: { width: 390, height: 800 } }); const q = await c2.newPage(); await q.goto(URL); await q.waitForTimeout(1500);
  await q.evaluate(() => localStorage.setItem('darb-dev', 'x')); await q.reload(); await q.waitForTimeout(1200);
  ok(await q.evaluate(() => localStorage.getItem('darb-dev') === null && !document.body.classList.contains('dev')), 'مفتاح التفعيل القديم يُمسح ولا يفعّل الوضع');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
