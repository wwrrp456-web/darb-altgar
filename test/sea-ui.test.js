// السفر البحري في الواجهة: الأسطول، المقارنة بين البر والبحر، الإبحار، القراصنة والعاصفة: node test/sea-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    const clr = () => p.evaluate(() => { const L = __game.S.learn; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => L[k] = []); __game.renderAll(true); });
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.learn.free = true; S.phase = 3; S.player.gold = 60000; const car = S.player.caravans[0]; car.city = 'jeddah'; car.left = 0; g.go('caravan'); g.renderAll(true); });
    await clr(); await p.waitForTimeout(250);
    ok(await p.locator('.fleet').count() === 1 && /لا سفن لك بعد/.test(await p.locator('#screen').innerText()) && await p.locator('[data-act=buyship]').count() === 3, tag + 'قسم الأسطول ظاهر بثلاثة أنواع للشراء');
    ok(await p.locator('[data-act=buyship][data-t=baghla]').isDisabled() && await p.locator('[data-act=buyship][data-t=dhow]').isEnabled(), tag + 'البغلة مقفلة والسنبوق متاح');
    await p.locator('[data-act=buyship][data-t=dhow]').click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => __game.S.player.ships.length === 1) && /راسية في/.test(await p.locator('.shipc').innerText()), tag + 'شراء السنبوق من الواجهة');
    await p.locator('[data-act=hiresailor]').click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => __game.S.player.ships[0].crew === 1) && /1\/3/.test(await p.locator('.shipc').innerText()), tag + 'توظيف بحّار');
    await p.locator('[data-act=upship][data-k=hull]').click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => __game.S.player.ships[0].up.hull === 1), tag + 'ترقية الهيكل');
    await p.locator('.shipc details summary').click(); await p.waitForTimeout(150); await p.locator('[data-act=hirecap]').first().click(); await p.waitForTimeout(250);
    ok(await p.evaluate(() => !!__game.S.player.ships[0].captain) && await p.locator('[data-act=firecap]').count() === 1 && await p.locator('.shipc .seacap').count() === 1, tag + 'توظيف قائد بحري بصورته');
    await p.locator('[data-act=firecap]').click(); await p.waitForTimeout(150);
    await p.evaluate(() => { __game.go('map'); __game.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    await p.evaluate(() => { const g = __game; g.E.A; document.querySelector('[data-city=mumbai]') ? document.querySelector('[data-city=mumbai]').dispatchEvent(new MouseEvent('click', { bubbles: true })) : null; });
    await p.waitForTimeout(300);
    ok(await p.locator('.seacmp').count() === 1 && /رسم الميناء/.test(await p.locator('.seacmp').innerText()) && await p.locator('[data-act=sail]').count() === 1, tag + 'مقارنة البحر مع زر الإبحار عند اختيار ميناء');
    ok(await p.locator('[data-act=go]').count() >= 1, tag + 'زر البر يبقى بجانبه');
    await p.locator('[data-act=sail]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !!__game.S.player.caravans[0].sea && __game.S.player.caravans[0].left > 0), tag + 'الإبحار يبدأ والقافلة في البحر');
    ok(/تُبحر إلى/.test(await p.locator('#screen').innerText()), tag + 'لوحة الرحلة تقول «تُبحر»');
    // قراصنة
    await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; m.left = 0; m.sea = null; m.city = 'mumbai'; S.road = { k: 'pirates', day: S.day, car: m.id, to: 'mumbai', from: 'jeddah', B: 10 }; g.renderAll(true); }); await p.waitForTimeout(200);
    ok(/قراصنة!/.test(await p.locator('#dlg').innerText()) && /طاقمك/.test(await p.locator('#dlg').innerText()), tag + 'حوار القراصنة بلغة البحر');
    await p.locator('#dlg [data-act=roadopt][data-c=pay]').click(); await p.waitForTimeout(200);
    ok(/السفينة/.test(await p.locator('#dlg .road-res').innerText()), tag + 'نتيجة القراصنة بلغة البحر');
    await p.locator('#dlg [data-act=roadok]').click(); await p.waitForTimeout(150);
    // عاصفة
    await p.evaluate(() => { __game.S.seaRes = { k: 'storm', msg: 'عاصفة ألقت نحو 9٪ من بضاعتك' }; __game.renderAll(true); }); await p.waitForTimeout(200);
    ok(/عاصفة في البحر/.test(await p.locator('#dlg').innerText()), tag + 'بطاقة العاصفة');
    await p.locator('#dlg [data-act=roadok]').click(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await ctx.close();
  }
  // حكاية الميناء يرويها الشاهبندر بصورته
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL + '&cards=1'); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.learn.cq = ['g_port_guangzhou']; S.learn.cards = []; g.go('home'); g.renderAll(true); });
    await p.waitForTimeout(400);
    const lt = await p.locator('#lesson').innerText();
    ok(/الشاهبندر/.test(lt) && /ميناء كانتون/.test(lt) && await p.locator('#lesson img.harbor').count() === 1, 'بطاقة ميناء كانتون يرويها الشاهبندر بصورته');
    await ctx.close();
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
