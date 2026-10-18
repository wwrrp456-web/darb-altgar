// الغلاف: الشعار وبسم الله وزر «ابدأ الرحلة» قبل عمّ سالم؛ وترتيب الترحيب: الدولة ← الاسم ← الشخصية: node test/cover.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?cover=1&learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['mobile', { width: 390, height: 800 }], ['desktop', { width: 1280, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(1200);
    ok(await p.locator('#splash.cover #coverGo').isVisible(), name + ': الغلاف وزر الدخول ظاهران');
    ok(/بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/.test(await p.locator('#splash .bism').textContent()), name + ': البسملة تحت الشعار');
    ok(await p.locator('#splash .brand-wordmark').count() === 1, name + ': الشعار ظاهر');
    ok(await p.locator('#lesson:not([hidden])').count() === 0, name + ': لا عمّ سالم قبل الضغط');
    await p.screenshot({ path: '/tmp/shots/cover-' + name + '.png' });
    await p.click('#coverGo'); await p.waitForTimeout(900);
    ok(await p.locator('#splash').count() === 0 && await p.locator('#lesson:not([hidden])').count() === 0, name + ': بعد زر الغلاف يظهر مربع الحكاية لا عمّ سالم');
    ok(await p.locator('.card:has(h2:text("الحكاية")) [data-act=storygo]').isVisible(), name + ': زر «ابدأ الرحلة» أسفل مربع الحكاية');
    await p.locator('[data-act=storygo]').click(); await p.waitForTimeout(500);
    ok(await p.locator('#lesson:not([hidden])').count() === 1, name + ': بعد زر الحكاية يظهر ترحيب عمّ سالم');
    // ترتيب الترحيب
    const seen = [];
    for (let i = 0; i < 30; i++) {
      if (await p.locator('#lesson #pname').count()) { seen.push('name'); await p.fill('#pname', 'خالد'); await p.locator('[data-act=lname]').click(); await p.waitForTimeout(80); continue; }
      if (await p.locator('#lesson [data-act=lstart]').count()) { seen.push('country'); await p.locator('#lesson [data-act=lstart]').first().click(); await p.waitForTimeout(80); continue; }
      if (await p.locator('#lesson [data-act=lchar]').count()) { seen.push('char'); break; }
      if (await p.locator('#lesson [data-act=lrep]').count()) { await p.locator('#lesson [data-act=lrep]').first().click(); await p.waitForTimeout(60); continue; }
      if (await p.locator('#lesson [data-act=lnext]').count()) { await p.locator('#lesson [data-act=lnext]').first().click(); await p.waitForTimeout(60); }
    }
    ok(seen.join('>') === 'country>name>char', name + ': الترتيب دولة ثم اسم ثم شخصية (' + seen.join('>') + ')');
    await p.waitForTimeout(100); await ctx.close();
  }
  // لاعب عائد: «تابع الرحلة» دون ترحيب
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage();
  await p.goto(URL.replace('cover=1', 'cover=1')); await p.waitForTimeout(800);
  await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; __game.E.learnPerks(S); S.learn.intro = 1; __game.renderAll(true); }).catch(() => {});
  await p.evaluate(() => { try { localStorage.setItem('darb-v3', __game.E.save(__game.S)); } catch (e) {} });
  await p.reload(); await p.waitForTimeout(1200);
  ok(/تابع الرحلة/.test(await p.locator('#coverGo').textContent()), 'اللاعب العائد يرى «تابع الرحلة»');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
