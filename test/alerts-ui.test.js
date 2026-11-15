// 049: مركز التنبيهات 🔔 حُذف (أ2): لا زر ولا لوحة، والحالات نفسها باقية ظاهرة في شاشاتها (دكان بلا بائع ← العقارات، إيجار متأخر ← العقارات، قافلة بلا مسار ← الإمبراطورية): node test/alerts-ui.test.js
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
    const txt = async scr => { await p.evaluate(s => { __game.go(s); __game.renderAll(true); }, scr); await clr(); await p.waitForTimeout(350); return p.locator('#screen').innerText(); };
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.phase = 2; S.player.gold = 90000; g.go('home'); g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    ok(await p.locator('#hAlert, #tbBell, #alertPanel').count() === 0, tag + '049: لا جرس ولا لوحة تنبيهات في الصفحة');
    ok(await p.locator('[data-act=alerts],[data-act=algo],[data-act=alsnooze],[data-act=alwhy]').count() === 0, tag + '049: لا أفعال تنبيهات في الواجهة');
    // دكان بلا بائع
    await p.evaluate(() => { const g = __game, S = g.S, A = g.E.A, city = S.player.caravans[0].city; A.buildShop(S, city); A.shopQuick(S, city, g.E.shopsOf(S, city)[0].id); { const pr = S.player.props[city]; for (const sh of pr.shops) for (const it of sh.items) pr.store[it.g] = it.target; } S.player.props[city].staff = []; g.renderAll(true); }); await clr(); await p.waitForTimeout(300);
    ok(/لا يوجد بائع/.test(await txt('estate')), tag + 'الدكان بلا بائع يظهر في العقارات');
    // قافلة بلا مسار
    await p.evaluate(() => { const g = __game; g.E.A.hireCaptain(g.S, 0); g.S.player.caravans[1].captain.role = 'loyal'; g.renderAll(true); });
    ok(/بلا مسار/.test(await txt('empire')), tag + 'قافلة القائد بلا مسار تظهر في الإمبراطورية');
    // إيجار متأخر
    await p.evaluate(() => { const g = __game, S = g.S, city = S.player.caravans[0].city, pr = S.player.props[city]; pr.shops.push({ id: 99, kind: 'stall', rent: 4, rentPaid: 0, arrears: 4, items: [] }); g.renderAll(true); });
    ok(/متأخر/.test(await txt('estate')), tag + 'الإيجار المتأخر يظهر في العقارات');
    ok(await p.locator('#hAlert').count() === 0, tag + 'ويبقى الرأس بلا جرس');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
