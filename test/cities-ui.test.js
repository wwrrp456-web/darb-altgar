// مشاهد المدن الست عشرة وحوارات زعمائها وتجارها وعمّ سالم: node test/cities-ui.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
// المحرك: كل مدينة بثلاثة حوارات تُفتح وتتنقل بلا أخطاء
{ const S0 = E.newGame(9); A.learnSetChar(S0, 'trader'); S0.learn.level = 8; S0.player.gold = 90000;
  for (const id of S0.order) { const S = E.load(E.save(S0)); const car = S.player.caravans[0]; car.city = id; car.left = 0;
    let all = true, nodes = 0;
    for (const who of ['boss', 'trader', 'salem']) { const r = A.dlgOpen(S, id + '_' + who); if (!r.ok) { all = false; continue; } const view = r.view; nodes++; if (!view.say || /\{[a-z]+\}/.test(view.say) || !view.opts.length) all = false;
      for (let k = 0; k < 4; k++) { const c = A.dlgChoose(S, 0); if (c.ok === false) break; } A.dlgClose(S); }
    ok(all && nodes === 3, 'حوارات ' + id + ' (3) تعمل وبلا رموز غير مستبدلة'); } }
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(2200);
  const ids = await p.evaluate(() => __game.S.order.slice());
  const PENDING = new Set(['mecca', 'medina']); // أصول الحوار الكاملة لهاتين المدينتين تأتي بالدفعة ٩-د من كودكس؛ حتى ذلك الحين تُستعمل صور بديلة
  for (const id of ids) {
    await p.evaluate(cid => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); S.noShocks = true; if (S.story) S.story.cur = null; const car = S.player.caravans[0]; car.city = cid; car.left = 0; g.go('market'); g.renderAll(true); }, id);
    await p.evaluate(cid => { const sel = document.getElementById('mktCity'); if (sel) { sel.value = cid; sel.dispatchEvent(new Event('change', { bubbles: true })); } }, id); await p.waitForTimeout(350);
    const bg = await p.evaluate(() => { const i = document.querySelector('.plaza .plz-bg'); return i ? i.naturalWidth : 0; }).catch(() => 0);
    let w = 0; for (let t = 0; t < 8 && !w; t++) { w = await p.evaluate(() => { const i = document.querySelector('.plaza .plz-bg'); return i ? i.naturalWidth : 0; }); if (!w) await p.waitForTimeout(150); }
    ok(await p.locator('.plaza .spot').count() === 3 && (PENDING.has(id) ? w > 0 : w === 1600), 'مشهد ' + id + ': ثلاث نقاط وصورة محمّلة');
    await p.locator('.plaza .spot[data-g=' + id + '_boss]').click(); await p.waitForTimeout(250);
    let fw = 0; for (let t = 0; t < 8 && !fw; t++) { fw = await p.evaluate(() => { const i = document.querySelector('#dlg img.dlg-face'); return i ? i.naturalWidth : 0; }); if (!fw) await p.waitForTimeout(150); }
    ok((PENDING.has(id) ? fw > 0 : fw === 390) && /أهلاً بك في سوق/.test(await p.locator('#dlg').innerText()), 'زعيم ' + id + ': وجهه محمّل ويحيّيك');
    await p.evaluate(() => __game.E.A.dlgClose(__game.S)); await p.evaluate(() => __game.renderAll(true));
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
