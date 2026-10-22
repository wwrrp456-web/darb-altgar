// تسمية سمة الإنتاج: «لبن وجبن» للأنعام الحلوب، و«بيض» للدجاج والبط فقط: node test/breedlabel-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(900);
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
  const want = { sheep: ['لبن وجبن', 'بيض'], goat: ['لبن وجبن', 'بيض'], cow: ['لبن وجبن', 'بيض'], buffalo: ['لبن وجبن', 'بيض'], camel: ['لبن وجبن', 'بيض'], chicken: ['بيض', 'لبن'], duck: ['بيض', 'لبن'] };
  for (const sp of Object.keys(want)) {
    const gid = await p.evaluate(sp => { const GD = __game.E.GD || {}; const id = Object.keys(GD).find(k => GD[k].sp === sp && GD[k].br); return id || null; }, sp);
    if (!gid) { ok(true, sp + ': لا صنف في هذه النسخة'); continue; }
    await p.evaluate(g => { document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-gd="' + g + '"></button>'); document.querySelector('.__t').click(); }, gid); await p.waitForTimeout(250);
    const t = (await p.locator('#modal .breedc .tn').allInnerTexts()).join('|');
    ok(t.includes(want[sp][0]) && !t.includes(want[sp][1]), sp + ' (' + gid + '): «' + want[sp][0] + '» وليس «' + want[sp][1] + '»');
  }
  ok(!/لبن وبيض/.test(await p.evaluate(() => document.body.innerText)), 'لا تظهر عبارة «لبن وبيض» في أي موضع');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
