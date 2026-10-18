// اختبار ملخص السوق ولوحة السلعة والصرافة: node test/market.test.js (يتطلب playwright)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(name + ' console: ' + m.text()));
    await p.goto('file://' + path.join(__dirname, '../index.html#market'));
    const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ');
    ok((await txt('#hWallets')).includes('800') && (await txt('#hWallets')).includes('ريال'), name + ': الرأس يعرض المحافظ');
    let t = await txt('#screen');
    ok(t.includes('ماذا في سوق الرياض') && t.includes('متوفر') && t.includes('قافلتي') && t.includes('كل مخازني'), name + ': ملخص السوق: ما فيه وسعات القافلة والمخازن');
    ok(t.includes('أقدر آخذ') && t.includes('تكفي قافلتي') && t.includes('لا مخزن'), name + ': بطاقات السلع: أقدر آخذ وهل تكفي');
    ok(t.includes('ر.س'), name + ': الأسعار بالريال');
    { const n = await p.locator('.deal .unitbox').count(); if (n) { const ut = await p.locator('.deal .unitbox').first().innerText(); ok(/تشتريها هنا بـ/.test(ut) && /ربح الوحدة/.test(ut) && /هامش/.test(ut), name + ': بطاقة الصفقة توضّح الوحدة الواحدة: سعر الشراء والبيع وربح الوحدة'); const th = await p.locator('.deal .think').first().innerText(); ok(/كمية كبيرة/.test(th) && /كمية قليلة/.test(th), name + ': تشرح مقايضة الكمية الكبيرة والقليلة'); } else ok(true, name + ': (لا صفقات الآن)'); }
    await p.screenshot({ path: path.join(__dirname, name + '-m1-market.png') });
    // لوحة السلعة
    await p.click('.gcard[data-gd="wool"] .top');
    ok(await p.isVisible('#modal .mbox'), name + ': تفتح لوحة السلعة');
    t = await txt('#modal');
    ok(t.includes('أين أبيع') && t.includes('تدفع') && t.includes('متوسط الوحدة'), name + ': اللوحة فيها الشراء وأين أبيع');
    const rows0 = await p.locator('#modal .optrow').count();
    ok(rows0 >= 5, name + ': جدول أماكن البيع (' + rows0 + ' صفاً)');
    ok(/[+−]\d/.test(t), name + ': ربح/خسارة متوقعة ظاهرة');
    const before = await txt('#modal .grid .card:nth-child(2)');
    await p.click('#modal [data-dq="25"]');
    ok((await txt('#modal .grid .card:nth-child(2)')) !== before, name + ': تغيير الكمية يغيّر الحساب');
    await p.screenshot({ path: path.join(__dirname, name + '-m2-detail.png') });
    const g0 = await p.evaluate(() => window.__game.S.player.gold);
    await p.click('#modal button[data-act="buy"]');
    const g1 = await p.evaluate(() => window.__game.S.player.gold), have = await p.evaluate(() => Math.floor(window.__game.S.player.caravans[0].cargo.wool || 0));
    ok(g1 < g0 && have > 0, name + ': الشراء من اللوحة (' + have + ' وحدة)');
    t = await txt('#modal'); ok(t.includes('معك ' + have) && t.includes('تكلفتك'), name + ': اللوحة تعرض تكلفتك بعد الشراء');
    await p.keyboard.press('Escape'); ok(await p.locator('#modal').isHidden(), name + ': Esc يغلق اللوحة');
    t = await txt('#screen'); ok(t.includes('لو بعت هنا') && /[+−]\d/.test(t), name + ': البطاقة تعرض الربح/الخسارة لو بعت هنا');
    // مخزن
    await p.evaluate(() => { const g = window.__game; g.S.phase = 4; g.S.player.wallet.sar = 50000; g.E.A.buildShop(g.S, 'riyadh'); g.E.A.buildWarehouse(g.S, 'riyadh'); g.go('map'); g.go('market'); });
    t = await txt('#screen'); ok(t.includes('مخزني في الرياض') && !t.includes('لا مخزن هنا'), name + ': بعد البناء يظهر مخزني في ملخص السوق');
    ok(t.includes('يكفي مخزني'), name + ': بطاقات تُظهر أن المخزن يكفي');
    // الصرافة
    await p.click('#hSar');
    ok(await p.isVisible('#resourceMenu') && (await txt('#resourceTitle')).includes('الريال'), name + ': الريال يفتح قائمته المستقلة');
    await p.click('#resourceMenu [data-act="resourcefx"]');
    ok((await p.evaluate(() => location.hash)) === '#cities' && await p.isVisible('#fxAmt'), name + ': قائمة الريال تفتح الصرافة');
    await p.fill('#fxAmt', '375'); t = await txt('#fxPrev'); ok(t.includes('تستلم'), name + ': معاينة التحويل: ' + t.slice(0, 60));
    const s0 = await p.evaluate(() => window.__game.S.player.wallet.sar);
    await p.click('button[data-act="fxdo"]');
    const w = await p.evaluate(() => window.__game.S.player.wallet);
    ok(w.usd > 90 && w.usd < 100 && Math.abs(s0 - w.sar - 375) < 1e-6, name + ': التحويل ريال←دولار برسم (' + w.usd.toFixed(2) + ')');
    ok((await txt('#hWallets')).includes('$99') || (await txt('#hWallets')).includes('$98'), name + ': الرأس يتحدث');
    await p.screenshot({ path: path.join(__dirname, name + '-m3-fx.png') });
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)), name + ': لا تمرير أفقي');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors'); if (errs.length || fails) process.exit(1);
})();
