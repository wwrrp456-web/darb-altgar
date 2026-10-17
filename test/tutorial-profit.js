// هل الصفقة التي تقترحها الجولة تربح فعلاً؟ node test/tutorial-profit.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const res = [];
  for (const seed of [3, 7, 11, 19, 23, 31, 42, 57, 88, 101, 150, 222]) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?seed=' + seed);
    await p.click('#coach [data-act="tutnext"]');
    const plan = await p.evaluate(() => JSON.parse(JSON.stringify(window.__game.S.tut.f.plan || null)));
    await p.click('.gcard.tut-hl .top');
    await p.click('#modal button[data-act="buy"]');
    await p.keyboard.press('Escape');
    await p.click('#nav [data-go="caravan"]'); await p.click('#nav [data-go="map"]');
    const dest = await p.evaluate(() => document.querySelector('#map .tut-hl').dataset.city);
    await p.click('#map .tut-hl'); await p.click('button[data-act="go"]'); await p.click('#b3');
    await p.waitForFunction(() => window.__game.S.player.caravans[0].left === 0 && window.__game.S.player.trips >= 1, null, { timeout: 90000 });
    await p.click('#coach [data-act="tutgo"]'); await p.click('#screen button[data-act="sellall"] >> nth=0');
    const t = await p.evaluate(() => window.__game.S.player.trades[0]);
    res.push({ seed, plan: plan && plan.g + '→' + plan.d + ' ~' + plan.profit, dest, pl: Math.round(t.pl) });
    await p.close();
  }
  await b.close();
  console.table(res); const wins = res.filter(r => r.pl > 0).length; console.log('رابحة:', wins, 'من', res.length); process.exit(wins >= res.length * 0.75 ? 0 : 1);
})();
