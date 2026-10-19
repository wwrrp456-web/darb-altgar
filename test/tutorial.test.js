// تظليل عمّ سالم في المستويات الأولى: يدلّ اللاعب الجديد على الزر المطلوب خطوة بخطوة: node test/tutorial.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ' console: ' + m.text()));
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=' + (process.env.SEED || 4)); await p.waitForTimeout(2300);
    ok(await p.locator('#coach').count() === 0, name + ': لا توجد بطاقة جولة قديمة');
    await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; __game.E.learnPerks(S); S.learn.intro = 1; __game.renderAll(true); });
    await p.waitForTimeout(300);
    ok(await p.locator('#lesson[hidden]').count() === 1, name + ': لا نافذة تحجب الشاشة');
    const hand = p.locator('#spot [data-icon="icons/guide-hand"] img');
    ok(await hand.count() === 1 && await hand.evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }), name + ': يد الإرشاد المرسومة ظاهرة ومحملة');
    ok(await p.locator('#spot').evaluate(el => getComputedStyle(el).pointerEvents === 'none'), name + ': اليد لا تحجب الضغط على الخيار');
    await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/shots/spot-' + name + '-1.png' });
    // نتبع التظليل بالضغط الفعلي على العنصر المضاء: قراءة البطاقة ← شراء ← سفر ← قراءة ← بيع
    const seen = new Set(); let bought = false, sold = false;
    for (let i = 0; i < 40 && !sold; i++) {
      if (await p.locator('#lesson:not([hidden]) button').count()) { await p.locator('#lesson:not([hidden]) button').last().click(); await p.waitForTimeout(300); continue; } // نافذة سرّ الدولة عند الوصول
      const hl = p.locator('.tut-hl'); if (await hl.count() !== 1) { await p.waitForTimeout(400); continue; }
      const key = await hl.evaluate(el => el.matches('.gcard') ? 'card' : el.matches('#modal [data-act=buy]') ? 'buy' : el.matches('#modal [data-act=sell]') ? 'sell' : el.matches('#nav button') ? 'nav' : el.matches('[data-act=go]') ? 'go' : el.matches('[data-city]') ? 'city' : 'other');
      seen.add(key); if (process.env.V) console.log(i, key, await p.evaluate(() => document.querySelector('#mission .bub, #modal .mission .small')?.textContent.slice(0, 80))); if (key === 'card' && i < 6) await p.screenshot({ path: '/tmp/shots/spot-' + name + '-1.png' });
      if (key === 'card') await hl.locator('.top').click(); else await hl.click();
      await p.waitForTimeout(250);
      if (key === 'buy') { bought = true; ok(await p.evaluate(() => __game.E.loadOf(__game.S.player.caravans[0])) > 0, name + ': تمّ الشراء بالضغط على الخيار المضاء'); }
      if (key === 'go') { await p.evaluate(() => __game.setSpeed(3)); await p.waitForFunction(() => __game.S.player.caravans[0].left === 0, null, { timeout: 60000 }); }
      sold = await p.evaluate(() => __game.S.learn.ev.sell >= 1);
    }
    ok(seen.has('card') && seen.has('buy'), name + ': يوجّه أولاً إلى بطاقة السلعة ثم إلى زر الشراء (' + [...seen] + ')');
    ok(seen.has('go') && seen.has('sell'), name + ': بعد الشراء يوجّه إلى السفر ثم بطاقة البيع ثم زر البيع');
    ok(sold && await p.evaluate(() => __game.S.learn.level === 2), name + ': اكتمل المستوى ١ بعد الشراء والسفر والبيع');
    await p.close();
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
