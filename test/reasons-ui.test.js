// سبب المنع ومعه الحل: نقص الريال مع عملة أخرى ← الصرافة، وامتلاء القافلة ← القافلة: node test/reasons-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const open = () => p.evaluate(() => { const g = __game; g.renderAll(true); document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-gd="wheat"></button>'); document.querySelector('.__t').click(); });
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 0.5; g.go('market'); g.renderAll(true); });
    await open(); await p.waitForTimeout(300);
    ok(/لا يكفي مبلغك/.test(await p.locator('#modal').innerText()) && /خفّض الكمية/.test(await p.locator('#modal').innerText()), tag + 'نقص الرصيد: السبب ظاهر ومعه الحل (خفّض الكمية)');
    await p.evaluate(() => { const S = __game.S; S.player.gold = 90000; const m = S.player.caravans[0]; m.cargo.wheat = 1e6; __game.renderAll(true); }); await p.waitForTimeout(200);
    ok(/امتلأت|لا مكان/.test(await p.locator('#modal').innerText()) && await p.locator('#modal [data-go=caravan]').count() >= 1, tag + 'امتلاء القافلة: السبب ومعه «افتح القافلة»');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
