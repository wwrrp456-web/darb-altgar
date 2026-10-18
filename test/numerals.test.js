// توحيد الأرقام: لا أرقام عربية-هندية في الشيفرة ولا في أي شاشة (كلها 0-9): node test/numerals.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const RE = /[٠-٩۰-۹٫٬]/;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const dir = path.join(__dirname, '../src');
const bad = fs.readdirSync(dir).filter(f => /\.(js|html)$/.test(f)).filter(f => RE.test(fs.readFileSync(path.join(dir, f), 'utf8')));
ok(bad.length === 0, 'لا أرقام عربية في المصدر' + (bad.length ? ': ' + bad.join(',') : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=6'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const S = __game.S; S.learn.char = 'trader'; S.player.name = 'خالد'; __game.E.learnPerks(S); S.learn.intro = 1; S.phase = 4; S.player.gold = 90000; __game.renderAll(true); });
  const hits = [];
  for (const id of ['home', 'map', 'market', 'caravan', 'estate', 'empire', 'lords', 'cities', 'academy']) {
    await p.evaluate(i => { location.hash = i; }, id); await p.waitForTimeout(350);
    for (const ct of id === 'cities' ? ['cities', 'fx', 'ledger'] : [null]) {
      if (ct) { await p.evaluate(c => { const b = document.querySelector('[data-ct="' + c + '"]'); b && b.click(); }, ct); await p.waitForTimeout(200); }
      const t = await p.evaluate(() => document.body.innerText); const m = t.match(RE);
      if (m) hits.push(id + (ct ? ':' + ct : '') + ' …' + t.slice(Math.max(0, t.search(RE) - 20), t.search(RE) + 20).replace(/\n/g, ' '));
    }
  }
  await p.evaluate(() => document.querySelector('[data-act=profile]').click()); await p.waitForTimeout(250);
  { const t = await p.evaluate(() => document.getElementById('profile').innerText); if (RE.test(t)) hits.push('profile'); }
  ok(hits.length === 0, 'لا أرقام عربية ظاهرة في الشاشات' + (hits.length ? ': ' + hits.slice(0, 5).join(' | ') : ''));
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
