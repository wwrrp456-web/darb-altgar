// بطاقة تجهيز الرحلة عند «اشترِ وسافر»: الطريق (بر/بحر) ثم مؤن السفر ثم الانطلاق: node test/tripprep-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    const setup = sea => p.evaluate(sea => { const g = __game, S = g.S, E = g.E; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.abroad = true; S.learn.free = true; S.phase = 3; S.player.gold = 90000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []);
      const car = S.player.caravans[0]; car.city = 'jeddah'; car.left = 0; if (sea) E.A.buyShip(S, 'jeddah', 'dhow'); g.go('market'); g.renderAll(true); return Object.keys(S.cities).filter(i => i !== 'jeddah' && E.isPort(i)).slice(0, 1)[0]; }, sea);
    await p.goto(URL); await p.waitForTimeout(900);
    const dest = await setup(true); await p.waitForTimeout(300);
    await p.evaluate(d => { const g = __game; g.dealGo ? g.dealGo('wheat', d, 20) : null; }, dest);
    const opened = await p.locator('.tprep').count() === 1;
    if (!opened) { await p.evaluate(d => { document.body.insertAdjacentHTML('beforeend', '<button id="__dg" data-act="dealgo" data-g="wheat" data-d="' + d + '" data-q="20"></button>'); }, dest); await p.evaluate(() => document.getElementById('__dg').click()); await p.waitForTimeout(250); }
    ok(await p.locator('.tprep').count() === 1, tag + 'الضغط على «اشترِ وسافر» يفتح بطاقة التجهيز ولا يسافر مباشرة');
    ok(await p.evaluate(() => __game.S.player.caravans[0].left === 0), tag + 'القافلة لم تنطلق بعد');
    ok(await p.locator('.tprep [data-act=tproute]').count() === 2, tag + 'خيارا البر والبحر ظاهران عند توفر السفينة');
    ok(await p.locator('.tprep .pacebox, .tprep [data-act=pacelv]').count() > 0, tag + 'مؤن السفر داخل البطاقة');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
    await p.locator('.tprep [data-act=pacelv][data-lv="1"]').first().click().catch(() => {}); await p.waitForTimeout(200);
    await p.locator('.tprep [data-act=tproute][data-r=sea]').click(); await p.waitForTimeout(200);
    ok(/بحراً/.test(await p.locator('.tprep [data-act=tpgo]').innerText()), tag + 'اختيار البحر يغيّر زر الانطلاق');
    await p.locator('.tprep [data-act=tproute][data-r=land]').click(); await p.waitForTimeout(150);
    await p.locator('.tprep [data-act=tpcancel]').first().click(); await p.waitForTimeout(200);
    ok(await p.locator('.tprep').count() === 0 && await p.evaluate(() => __game.S.player.caravans[0].left === 0), tag + 'الإلغاء يغلقها دون سفر ولا شراء');
    await p.evaluate(() => __game.renderAll(true));
    await p.evaluate(d => { document.body.insertAdjacentHTML('beforeend', '<button id="__dg2" data-act="dealgo" data-g="wheat" data-d="' + d + '" data-q="20"></button>'); }, dest); await p.evaluate(() => document.getElementById('__dg2').click()); await p.waitForTimeout(250);
    await p.locator('.tprep [data-act=pacelv][data-lv="1"]').first().click().catch(() => {}); await p.waitForTimeout(150);
    await p.locator('.tprep [data-act=tpgo]').click(); await p.waitForTimeout(400);
    ok(await p.evaluate(() => { const c = __game.S.player.caravans[0]; return c.left > 0 && !c.sea && Math.floor(c.cargo.wheat || 0) > 0; }), tag + 'الانطلاق يشتري البضاعة ويسافر براً');
    ok(await p.evaluate(() => !!__game.S.player.caravans[0].pace && __game.S.player.caravans[0].pace.lv >= 0), tag + 'مؤن السفر المختارة طُبّقت على الرحلة');
    ok(await p.evaluate(() => location.hash) === '#map', tag + 'ثم تفتح الخريطة لتتابع القافلة');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
