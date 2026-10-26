// مركز التنبيهات 🔔: شارة وقائمة وزر «اذهب وأصلح» و«لماذا؟» و«لاحقاً»: node test/alerts-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const clr = () => p.evaluate(() => ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []));
    const click = async sel => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(350); };
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 2; S.learn.intro = 2; S.player.gold = 90000; g.go('home'); g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    ok(await p.locator('#hAlert').isHidden(), tag + 'الجرس مخفي في المستويين ١ و٢');
    await p.evaluate(() => { const g = __game, S = g.S; S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.phase = 2; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.renderAll(true); }); await p.waitForTimeout(300);
    ok(await p.locator('#hAlert').isVisible(), tag + 'الجرس ظاهر من المستوى ٣');
    ok(await p.locator('#hAlert .abadge').isHidden(), tag + 'بلا مشكلات: لا شارة');
    await click('#hAlert'); ok(/لا شيء يحتاج تدخلك/.test(await p.locator('#alertPanel').innerText()), tag + 'القائمة تقول إن لا شيء يحتاج تدخلاً');
    await click('#hAlert');
    // دكان بلا بائع
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A, city = S.player.caravans[0].city; A.buildShop(S, city); A.shopQuick(S, city, g.E.shopsOf(S, city)[0].id); { const pr = S.player.props[city]; for (const sh of pr.shops) for (const it of sh.items) pr.store[it.g] = it.target; } S.player.props[city].staff = []; g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    ok(await p.locator('#hAlert .abadge').isVisible() && (await p.locator('#hAlert .abadge').innerText()) === '1', tag + 'الشارة تعدّ التنبيه');
    await click('#hAlert');
    const txt = await p.locator('#alertPanel').innerText();
    ok(/لا يوجد بائع/.test(txt) && /اذهب وأصلح/.test(txt) && /لماذا؟/.test(txt) && /لاحقاً/.test(txt), tag + 'تنبيه الدكان بلا بائع بأزراره الثلاثة');
    // لماذا؟
    await click('#alertPanel [data-act=alwhy]');
    ok(await p.locator('#salemPanel .howto[open]').count() === 1 && /الطاقم/.test(await p.locator('#salemPanel .howto[open]').innerText()), tag + '«لماذا؟» يفتح تعليمات الطاقم في الدفتر');
    await click('#salemPanel [data-act=salemclose]');
    // اذهب وأصلح
    await p.evaluate(() => { __game.go('market'); __game.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    await click('#hAlert'); await click('#alertPanel [data-act=algo]');
    ok(await p.locator('.shopbox').count() >= 1 && await p.locator('#alertPanel.show').count() === 0, tag + '«اذهب وأصلح» ينقلك إلى صفحة الدكان ويغلق القائمة');
    // لاحقاً
    await click('#hAlert'); await click('#alertPanel [data-act=alsnooze]');
    ok(await p.locator('#hAlert .abadge').isHidden(), tag + '«لاحقاً» يخفي التنبيه والشارة');
    // قافلة بلا مسار
    await p.evaluate(() => { const g = __game; g.E.A.hireCaptain(g.S, 0); g.S.player.caravans[1].captain.role = 'loyal'; g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    await click('#hAlert'); ok(/بلا مسار/.test(await p.locator('#alertPanel').innerText()), tag + 'قافلة القائد بلا مسار تظهر تنبيهاً');
    // إغلاق بالنقر خارجها
    await p.evaluate(() => document.getElementById('screen').click()); await p.waitForTimeout(250);
    ok(await p.locator('#alertPanel.show').count() === 0, tag + 'تُغلق بالنقر خارجها');
    // حرج: إيجار متأخر ≥ 3
    await p.evaluate(() => { const g = __game, S = g.S, city = S.player.caravans[0].city, pr = S.player.props[city]; pr.shops.push({ id: 99, kind: 'stall', rent: 4, rentPaid: 0, arrears: 4, items: [] }); g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    ok(await p.locator('#hAlert .abadge.crit').count() === 1, tag + 'تنبيه حرج (إيجار متأخر): الشارة حمراء');
    await click('#hAlert'); ok(/إيجار بسطتك/.test(await p.locator('#alertPanel .alrt').first().innerText()), tag + 'الحرج يتصدر القائمة');
    await p.evaluate(() => window.scrollTo(0, 300)); await p.waitForTimeout(250);
    ok(await p.locator('#alertPanel.show').count() === 0, tag + 'تُغلق عند التمرير');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
