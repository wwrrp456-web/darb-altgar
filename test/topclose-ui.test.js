// زر إغلاق ✕ أعلى الجهة اليسرى في الصفحات المنبثقة، وقائمة ⋯ لا تبتعد عن زرها عند التمرير: node test/topclose-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 50000; g.go('market'); g.renderAll(true); ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); });
    // ملف التاجر
    await p.evaluate(() => document.querySelector('#hAvatar, [data-act=profile]').click()); await p.waitForTimeout(400);
    const bx = await p.evaluate(() => { const x = document.querySelector('#profile .mx'); if (!x) return null; const r = x.getBoundingClientRect(), m = document.querySelector('#profile .pf').getBoundingClientRect(); return { top: r.top, left: r.left, mleft: m.left, mtop: m.top, w: innerWidth }; });
    ok(!!bx && bx.left < bx.w / 2 && bx.top < 120, tag + 'ملف التاجر: ✕ في أعلى الجهة اليسرى (' + JSON.stringify(bx) + ')');
    await p.evaluate(() => { const m = document.getElementById('profile'); m.scrollTop = 600; }); await p.waitForTimeout(150);
    ok(await p.evaluate(() => { const r = document.querySelector('#profile .mx').getBoundingClientRect(); return r.top >= 0 && r.top < 80; }), tag + 'يبقى ظاهراً عند التمرير');
    await p.evaluate(() => document.querySelector('#profile .mx').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('profile').hidden), tag + '✕ يغلق الملف');
    // نافذة السلعة
    await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-gd="wheat"></button>'); document.querySelector('.__t').click(); document.querySelector('.__t').remove(); }); await p.waitForTimeout(400);
    ok(await p.locator('#modal .mx').count() === 1, tag + 'نافذة السلعة فيها ✕');
    await p.evaluate(() => document.querySelector('#modal .mx').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('modal').hidden), tag + '✕ يغلق نافذة السلعة');
    // قائمة ⋯
    const vis = await p.evaluate(() => { const m = document.getElementById('hMenu'); return !!m && m.offsetParent !== null; });
    if (vis) {
      await p.evaluate(() => document.getElementById('hMenu').click()); await p.waitForTimeout(200);
      ok(await p.evaluate(() => document.getElementById('hmenuPanel').classList.contains('show')), tag + 'القائمة تُفتح');
      await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(250);
      ok(await p.evaluate(() => !document.getElementById('hmenuPanel').classList.contains('show')), tag + 'القائمة تُغلق عند التمرير فلا تبتعد عن زرها');
    }
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
