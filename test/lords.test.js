// اختبار شاشة الزعماء والعقود: node test/lords.test.js (يتطلب playwright)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
const shot = (p, n) => p.screenshot({ path: path.join(__dirname, n + '.png') });
(async () => {
  const b = await chromium.launch(); const errs = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ' console: ' + m.text()));
    await p.goto('file://' + path.join(__dirname, '../index.html'));
    await p.click('#coach [data-act="tutskip"]');
    await p.click('#nav [data-go="market"]');
    ok(await p.isVisible('text=كبير تجّار'), name + ': شريط الزعيم يظهر في السوق');
    await p.click('#screen [data-act="tolord"]');
    ok((await p.evaluate(() => location.hash)) === '#lords', name + ': الانتقال لشاشة الزعماء');
    ok(await p.isVisible('text=الأفعال تُفتح في الطور ٢'), name + ': الأفعال مقفلة في الطور ١');
    ok(await p.locator('button[data-act="lobby"]').first().isDisabled(), name + ': زر النفوذ معطّل');
    await p.evaluate(() => { const S = window.__game.S; S.phase = 2; S.player.wallet.sar += 90000; });
    await p.click('#nav [data-go="lords"]');
    await shot(p, name + '-8-lords');
    await p.click('button[data-act="gift"]');
    ok((await p.evaluate(() => window.__game.S.bosses.riyadh.trust)) > 5, name + ': الهدية رفعت الثقة');
    await p.click('button[data-act="sign"][data-k="supply"]');
    ok((await p.evaluate(() => window.__game.S.player.pacts.length)) === 1, name + ': توقيع عقد توريد');
    ok(await p.isVisible('text=قائم'), name + ': العقد القائم يظهر');
    await shot(p, name + '-8-lords-pact');
    await p.click('button[data-act="breakp"]');
    ok((await p.evaluate(() => window.__game.S.player.pacts.length)) === 0, name + ': فسخ العقد');
    for (let i = 0; i < 6; i++) { await p.click('button[data-act="lobby"][data-q="20"]'); await p.evaluate(() => window.__game.E.tick(window.__game.S)); if (await p.evaluate(() => window.__game.S.bosses.riyadh.ruler === 'player')) break; }
    await p.click('#nav [data-go="lords"]');
    ok(await p.evaluate(() => window.__game.S.bosses.riyadh.ruler === 'player'), name + ': الانقلاب وصرت حاكماً');
    await shot(p, name + '-8-lords-ruler');
    await p.click('[data-lc="cn"]'); await p.click('[data-lcity="shanghai"]');
    ok(await p.isVisible('text=السيد لين فاي'), name + ': تبديل المدينة يعرض زعيمها');
    const ovf = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    ok(!ovf, name + ': لا تمرير أفقي');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.log(errs.join('\n')); fails++; }
  console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
})();
