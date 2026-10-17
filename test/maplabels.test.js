// أسماء المدن على الخريطة لا تتداخل (الشاشة الكاملة وكل دولة، حاسوب وجوال)
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  for (const [name, w, h] of [['desktop', 1280, 900], ['mobile', 390, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + path.join(__dirname, '../index.html#map')); await p.waitForTimeout(500);
    await p.evaluate(() => { const s = document.querySelector('[data-act=tutskip]'); s && s.click(); });
    for (const mc of ['all', 'sa', 'eg', 'ir', 'in', 'cn']) {
      await p.evaluate(m => document.querySelector('[data-mc="' + m + '"]').click(), mc); await p.waitForTimeout(150);
      const worst = await p.evaluate(() => {
        const rs = [...document.querySelectorAll('#map g[data-city] rect')].map(r => r.getBBox());
        const nodes = [...document.querySelectorAll('#map g[data-city] circle:nth-of-type(2)')].map(c => c.getBBox());
        let m = 0; const a = (x, y) => Math.max(0, Math.min(x.x + x.width, y.x + y.width) - Math.max(x.x, y.x)) * Math.max(0, Math.min(x.y + x.height, y.y + y.height) - Math.max(x.y, y.y));
        for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) m = Math.max(m, a(rs[i], rs[j]) / Math.min(rs[i].width * rs[i].height, rs[j].width * rs[j].height));
        return m;
      });
      ok(worst < 0.08, `${name} / ${mc}: أقصى تداخل بين اسمين ${(worst * 100).toFixed(1)}٪`);
    }
    await p.close();
  }
  await b.close(); console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
})();
