// اختبار الجولة التعليمية خطوة بخطوة كما يفعل لاعب جديد: node test/tutorial.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
const shot = (p, n) => p.screenshot({ path: path.join(__dirname, n + '.png') });
(async () => {
  const b = await chromium.launch(); const errs = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ' console: ' + m.text()));
    await p.goto('file://' + path.join(__dirname, '../index.html') + (process.env.SEED ? '?seed=' + process.env.SEED : ''));
    const coach = async () => ((await p.textContent('#coach')) || '').replace(/\s+/g, ' ');
    const step = async () => (await p.evaluate(() => window.__game.S.tut.i));
    ok(await p.isVisible('#coach') && (await coach()).includes('مرحباً أيها التاجر') && (await step()) === 0, name + ': الخطوة ٠: ترحيب وتعريف بالعملات');
    ok((await coach()).includes('٨٠٠ ريال') && (await coach()).includes('الدولار'), name + ': الترحيب يشرح الريال والدولار والذهب');
    await shot(p, name + '-t0-intro');
    await p.click('#coach [data-act="tutnext"]');
    ok((await p.evaluate(() => location.hash)) === '#market' && (await step()) === 1, name + ': ابدأ ← السوق، الخطوة ١ (اقرأ السوق)');
    ok(await p.locator('.tut-hl').count() >= 1, name + ': عنصر مُضاء بالإرشاد');
    await shot(p, name + '-t1-read');
    // خطأ شائع: التنقل بعيداً ثم الاستعانة بزر «اذهب»
    await p.evaluate(() => window.__game.go('home'));
    ok(await p.locator('#coach [data-act="tutgo"]').count() === 1, name + ': خارج الشاشة المطلوبة يظهر زر «اذهب إلى …»');
    await p.click('#coach [data-act="tutgo"]');
    await p.click('.gcard.tut-hl .top');
    ok((await step()) === 2 && await p.isVisible('#modal .mbox'), name + ': فتح لوحة سلعة ← الخطوة ٢');
    ok(await p.locator('#modal button.tut-hl[data-act="buy"]').count() === 1, name + ': زر «اشترِ» في اللوحة مُضاء');
    await shot(p, name + '-t2-buy');
    await p.click('#modal button[data-act="buy"]');
    ok((await step()) === 3 && (await p.evaluate(() => window.__game.E.loadOf(window.__game.S.player.caravans[0]))) > 0, name + ': الشراء ← الخطوة ٣ (القافلة)');
    await p.keyboard.press('Escape');
    await p.click('#nav [data-go="caravan"]');
    ok((await step()) === 4, name + ': فتح القافلة ← الخطوة ٤ (الوجهة)');
    await p.click('#nav [data-go="map"]');
    ok(await p.locator('#map .tut-hl').count() === 1, name + ': المدينة المقترحة مُضاءة على الخريطة');
    const target = await p.evaluate(() => document.querySelector('#map .tut-hl').closest('g').dataset.city);
    await p.click('#map .tut-hl');
    ok((await step()) === 5, name + ': اختيار مدينة ← الخطوة ٥ (سافر) [' + target + ']');
    await shot(p, name + '-t5-go');
    await p.click('button[data-act="go"]');
    ok((await step()) === 6 && (await p.evaluate(() => window.__game.S.player.caravans[0].left)) > 0, name + ': السفر ← الخطوة ٦ (الطريق)');
    await p.click('#b3');
    await p.waitForFunction(() => window.__game.S.player.caravans[0].left === 0 && window.__game.S.player.trips >= 1, null, { timeout: 90000 });
    ok((await step()) === 7 && (await p.evaluate(() => location.hash)) !== '', name + ': الوصول ← الخطوة ٧ (بِع)');
    await p.click('#coach [data-act="tutgo"]');
    ok(await p.locator('button[data-act="sellall"].tut-hl').count() >= 1, name + ': زر «بِع الكل» مُضاء');
    await p.click('#screen button[data-act="sellall"] >> nth=0');
    ok((await step()) === 8 && /ربحت|خسرت/.test(await coach()), name + ': البيع ← الخطوة ٨ بدرس الربح/الخسارة: ' + (await coach()).slice(0, 90));
    await shot(p, name + '-t8-lesson');
    await p.click('#coach [data-act="tutnext"]');
    ok((await step()) === 9, name + ': الخطوة ٩ (العملات)');
    await p.click('#hWallets');
    ok((await step()) === 10, name + ': فتح المحفظة ← الخطوة ١٠');
    await p.click('#coach [data-act="tutnext"]'); ok((await step()) === 11, name + ': الخطوة ١١ (جاهز)');
    await p.click('#coach [data-act="tutnext"]');
    ok(await p.locator('#coach').isHidden() && !(await p.evaluate(() => window.__game.S.tut.on)), name + ': انتهت الجولة');
    // إعادة الجولة من الرئيسية
    await p.click('#nav [data-go="home"]'); ok(await p.locator('[data-act="tutrestart"]').count() === 1, name + ': زر إعادة الجولة في الرئيسية');
    await p.click('[data-act="tutrestart"]'); ok(await p.isVisible('#coach') && (await step()) === 0, name + ': إعادة الجولة تبدأ من الخطوة ٠');
    // الجولة محفوظة عبر إعادة التحميل
    await p.evaluate(() => window.__game.S.tut.i = 3); await p.evaluate(() => window.dispatchEvent(new Event('beforeunload'))); await p.reload();
    ok((await step()) === 3 || (await step()) >= 3, name + ': تقدّم الجولة يُحفظ بعد إعادة التحميل (الخطوة ' + (await step()) + ')');
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)), name + ': لا تمرير أفقي');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors'); if (errs.length || fails) process.exit(1);
})();
