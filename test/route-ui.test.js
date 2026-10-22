// «مسار»: وجهة ثم سلع بأسهم ثم الربح داخل السلعة: node test/route-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const setup = lv => p.evaluate(lv => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = lv; S.learn.intro = lv; S.learn.abroad = true; S.player.gold = 50000; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); }, lv);
    await setup(2); await p.waitForTimeout(300);
    ok(await p.locator('.route').count() === 0, tag + 'مخفية في المستويين ١ و٢ (واجهة المبتدئ المبسّطة)');
    await setup(7); await p.waitForTimeout(300);
    ok(await p.locator('.route #routeTo').count() === 1 && await p.locator('.route .rchip').count() === 0, tag + 'تظهر من المستوى ٤: خانة الوجهة بلا سلع قبل الاختيار');
    const dest = await p.evaluate(() => { const o = [...document.querySelectorAll('#routeTo option')].find(x => x.value); return o && o.value; });
    await p.selectOption('#routeTo', dest); await p.waitForTimeout(300);
    const n = await p.locator('.route .rchip').count();
    ok(n >= 3, tag + 'بعد اختيار الوجهة تظهر السلع (' + n + ')');
    const arrows = await p.evaluate(() => [...document.querySelectorAll('.route .rchip .ra')].map(x => x.textContent.trim().charAt(0)));
    ok(arrows.every(a => '▲▬▼'.includes(a)) && arrows.some(a => a === '▲' || a === '▼'), tag + 'كل سلعة بسهم ▲ ▬ ▼: ' + [...new Set(arrows)].join(' '));
    const sorted = await p.evaluate(() => { const r = { '▲': 0, '▬': 1, '▼': 2 }; const a = [...document.querySelectorAll('.route .rchip .ra')].map(x => r[x.textContent.trim().charAt(0)]); return a.every((v, i) => !i || a[i - 1] <= v); });
    ok(sorted, tag + 'مرتبة: ▲ ثم ▬ ثم ▼');
    ok(!/ربح|ريال/.test(await p.locator('.route .rgrid').innerText()), tag + 'لا أرقام ولا ربح في القائمة (أداة بحث لا قرار)');
    await p.locator('.route .rchip').first().click(); await p.waitForTimeout(400);
    ok(await p.locator('#modal:not([hidden])').count() === 1, tag + 'الضغط على سلعة يفتح نافذتها');
    ok(await p.evaluate(d => { const s = document.querySelector('#modal select[data-cmp=a]'); return !s || s.value === d; }, dest), tag + 'والوجهة مختارة مسبقاً في المقارنة');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join(' | ')); await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
