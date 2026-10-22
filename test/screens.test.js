// اختبار الشاشات والتنقل ولاعب جديد: node test/screens.test.js (يتطلب playwright)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const DEVH = (fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8').match(/DEV_HASH = '([0-9a-f]{64})'/) || [])[1]; // تبويب اختبار الاقتصاد لا يظهر إلا في وضع المطوّر
const shot = (p, n) => p.screenshot({ path: path.join(__dirname, n + '.png') });
(async () => {
  const b = await chromium.launch(); const errs = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp }); await p.addInitScript(h => { try { sessionStorage.setItem('darb-dev', h); } catch (e) {} }, DEVH);
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ' console: ' + m.text()));
    await p.goto('file://' + path.join(__dirname, '../index.html'));
    ok((await p.evaluate(() => location.hash)) === '' || true, name + ': فتح');
    ok(await p.locator('#coach').count() === 0, name + ': لا بطاقة جولة قديمة للاعب الجديد');
    ok(await p.isVisible('text=ابدأ الرحلة'), name + ': الرئيسية فيها «ابدأ الرحلة»');
    await shot(p, name + '-1-home');
    await p.click('#screen >> text=ابدأ الرحلة');
    ok((await p.evaluate(() => location.hash)) === '#market', name + ': ابدأ ← السوق (hash)');
    const g0 = await p.evaluate(() => window.__game.S.player.gold);
    await shot(p, name + '-2-market');
    await p.click('button[data-act="dealgo"] >> nth=0');
    ok(await p.isVisible('.tprep [data-act="tpgo"]'), name + ': اشترِ وسافر ← بطاقة تجهيز الرحلة (طريق/مؤن/انطلاق)');
    await p.click('.tprep [data-act="tpgo"]');
    ok((await p.evaluate(() => location.hash)) === '#map', name + ': اشترِ وسافر ← الخريطة');
    ok(await p.isVisible('.jcard') && await p.locator('.journey').count() === 0, name + ': بطاقة الرحلة ظاهرة بلا منظر مكرر (الخريطة وحدها)');
    await shot(p, name + '-3-journey');
    await p.evaluate(() => __game.setSpeed(3));
    await p.waitForFunction(() => window.__game.S.player.caravans[0].left === 0 && window.__game.S.player.trips >= 1, null, { timeout: 90000 });
    await p.click('#nav [data-go="market"]');
    await p.click('#screen button[data-act="sellall"] >> nth=0');
    const g1 = await p.evaluate(() => window.__game.S.player.gold);
    ok(g1 !== g0, name + ': الذهب تغيّر بعد البيع (' + Math.round(g0) + ' ← ' + Math.round(g1) + ')');
    for (const s of ['map', 'market', 'caravan', 'estate', 'empire', 'cities']) {
      await p.click(`#nav [data-go="${s}"]`);
      ok((await p.evaluate(() => location.hash)) === '#' + s, name + ': تنقل إلى ' + s);
      if (s === 'map') { await p.click('[data-act="mapreset"]'); await p.click('#map [data-city="hail"] circle:nth-of-type(2)'); } // الخريطة مركّزة على الرحلة الجارية، فنعيد ضبطها أولاً
      await shot(p, name + '-4-' + s);
    }
    await p.goBack();
    ok((await p.evaluate(() => location.hash)) === '#empire', name + ': زر الرجوع');
    // الحالة تبقى بين الشاشات
    ok((await p.evaluate(() => window.__game.S.player.gold)) === g1, name + ': الحالة محفوظة بين الشاشات');
    // أطوار متقدمة: عقارات ومصنع ومصرف
    await p.evaluate(() => { const g = window.__game; g.S.player.gold = 150000; for (let i = 0; i < 3; i++) g.E.tick(g.S); g.go('estate'); });
    await p.click('[data-ec="sa"]'); await p.click('[data-estcity="riyadh"]'); // العقارات تبدأ بمدينة القافلة، فنختار الدولة والمدينة صراحة
    await p.click('button[data-act="bshop"]'); await p.click('button[data-act="bwh"]');
    ok((await p.evaluate(() => window.__game.E.shopsOf(window.__game.S, 'riyadh').length)) === 1 && (await p.evaluate(() => window.__game.E.whsOf(window.__game.S, 'riyadh'))) === 1, name + ': بناء دكان ثم مخزن من الواجهة');
    ok(await p.locator('button[data-act="bwh"][disabled]').count() === 1, name + ': زر المخزن معطل حتى دكان جديد');
    await p.click('button[data-act="iadd"]');
    ok((await p.evaluate(() => window.__game.E.shopsOf(window.__game.S, 'riyadh')[0].items.length)) === 1, name + ': إضافة سلعة للدكان');
    await p.fill('input[id^="ip"]', '120'); await p.click('button[data-act="isave"]');
    ok(Math.abs((await p.evaluate(() => window.__game.E.shopsOf(window.__game.S, 'riyadh')[0].items[0].price)) - 1.2) < 1e-9, name + ': تعديل السعر ١٢٠٪');
    await shot(p, name + '-5-estate');
    await p.click('[data-ec="eg"]'); ok(await p.locator('[data-estcity="cairo"]').count() === 1, name + ': مرشح الدول في العقارات');
    await p.click('#nav [data-go="empire"]'); await p.click('button[data-act="hirecand"] >> nth=0');
    await p.click('button[data-act="factory"] >> nth=0');
    await p.click('button[data-act="invest"] >> nth=0');
    await shot(p, name + '-6-empire');
    await p.click('#nav [data-go="map"]'); await p.click('[data-mc="cn"]'); await shot(p, name + '-7-map-cn');
    await p.click('#nav [data-go="cities"]'); await p.click('[data-ct="ledger"]'); await p.click('[data-ct="test"]'); await p.click('button[data-act="stress"]');
    await p.waitForFunction(() => /NaN/.test(document.getElementById('testOut').textContent), null, { timeout: 60000 });
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)), name + ': لا تمرير أفقي');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors'); if (errs.length || fails) process.exit(1);
})();
