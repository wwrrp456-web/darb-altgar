// لا تداخل بين عناصر بطاقات السلع و«بضاعتي» (أرقام العملات المحلية الطويلة) على الجوال: node test/overlap-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const w of [320, 360, 390, 760]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 800 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    for (const city of ['cairo', 'mumbai', 'shanghai', 'isfahan']) {
      const has = await p.evaluate(c => { const g = __game, S = g.S, E = g.E; if (!S.cities[c]) return false; E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); S.player.gold = 50000; S.phase = 3; const m = S.player.caravans[0]; m.city = c; m.left = 0; m.cargo.textile = 7200; m.cargo.wheat = 3; g.go('market'); g.renderAll(true); return true; }, city);
      if (!has) continue; await p.waitForTimeout(300);
      const bad = await p.evaluate(() => {
        const hit = (a, b) => { const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(); return r1.width > 0 && r2.width > 0 && r1.height > 0 && r2.height > 0 && Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left) > 1 && Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top) > 1; };
        const out = [];
        document.querySelectorAll('.gcard .top').forEach(t => { const nm = t.children[1]; if (nm && (nm.getBoundingClientRect().width < 80 || nm.scrollWidth > nm.clientWidth + 1)) out.push('gcard-name-crushed:' + (nm.innerText || '').slice(0, 8)); const k = [...t.children].filter(x => x.getBoundingClientRect().width > 0); for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) if (hit(k[i], k[j])) out.push('gcard:' + (t.innerText || '').slice(0, 12)); });
        document.querySelectorAll('.mycargo .mc-row').forEach(t => { const k = [...t.children]; for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) if (hit(k[i], k[j])) out.push('mycargo'); });
        return out;
      });
      ok(bad.length === 0 && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), w + 'px ' + city + ': بلا تداخل ولا تمرير أفقي ' + bad.slice(0, 2).join('|'));
    }
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
