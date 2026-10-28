// WP-10: شاشتا العقارات والدول أقصر من ٣٠٠٠ بكسل على ٣٩٠ في الحالة المتوسطة، وحالة الطيّ تُحفظ، ولا وظيفة تُفقد: node test/screen-length-ui.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw;
const BASE = 'file://' + path.join(__dirname, '../index.html'), MAX = 3000, ok = m => console.log('OK   ' + m);
const STATE = shops => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; S.player.gold = 200000; S.phase = 3; for (let i = E.shopsOf(S, 'riyadh').length; i < shops; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); if (shops) { E.A.buildWarehouse(S, 'riyadh'); const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh'); } };
const page = async (b, q, shops) => { const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game); await p.evaluate(STATE, shops); if (/player=1/.test(q) && await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); } return p; };
const h = async (p, s) => { await p.evaluate(x => __game.go(x), s); await p.waitForTimeout(450); return p.evaluate(() => document.documentElement.scrollHeight); };
const acts = p => p.evaluate(() => [...new Set([...document.querySelectorAll('#screen [data-act]')].map(e => e.dataset.act))].sort());
const openAll = async p => { await p.evaluate(() => document.querySelectorAll('#screen details.fold').forEach(d => d.open = true)); await p.waitForTimeout(250); };
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    // ١) الأطوال بوضع اللاعب (الأقسام بافتراضاتها الحقيقية)
    for (const shops of [0, 2, 3]) {
      const p = await page(b, '?player=1&seed=5', shops); p.on('pageerror', e => errors.push(e.message));
      const e = await h(p, 'estate'), c = await h(p, 'cities'); assert.ok(e < MAX, `العقارات (${shops} دكاكين): ${e}px`); assert.ok(c < MAX, `الدول: ${c}px`); ok(`دكاكين ${shops}: العقارات ${e}px والدول ${c}px (< ${MAX})`);
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'تمرير أفقي'); await p.context().close();
    }
    // ٢) حالة الطيّ تُحفظ بعد إعادة التحميل
    const p2 = await page(b, '?player=1&seed=5', 2); p2.on('pageerror', e => errors.push(e.message)); await h(p2, 'estate');
    const keyOpen = 'est-howto', keyShut = 'est-obl';
    assert.equal(await p2.locator(`details[data-fold=${keyOpen}]`).evaluate(d => d.open), false); await p2.locator(`details[data-fold=${keyOpen}] > summary`).click(); await p2.waitForTimeout(200);
    assert.equal(await p2.evaluate(k => JSON.parse(localStorage.getItem('darb-ui')).fold[k], keyOpen), 1);
    const savedUi = await p2.evaluate(() => localStorage.getItem('darb-ui')); await p2.context().close(); // جلسة جديدة تحمل ما حُفظ (إعادة تحميل file:// قد تُفقد التخزين أحياناً في Chromium)
    const p3 = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p3.addInitScript(([r, u]) => { if (!localStorage.getItem('darb-v3')) { localStorage.setItem('darb-v3', r); localStorage.setItem('darb-ui', u); } }, [raw, savedUi]); await p3.goto(BASE + '?player=1&seed=5'); await p3.waitForFunction(() => !!window.__game); await p3.evaluate(STATE, 2); if (await p3.locator('#coverGo').count()) { await p3.locator('#coverGo').click().catch(() => {}); await p3.waitForTimeout(900); } await h(p3, 'estate');
    assert.equal(await p3.locator(`details[data-fold=${keyOpen}]`).evaluate(d => d.open), true, 'بقي مفتوحاً بعد إعادة التحميل'); assert.equal(await p3.locator(`details[data-fold=${keyShut}]`).evaluate(d => d.open), false, 'والمطوي بقي مطوياً');
    ok('حالة الطيّ تُحفظ في ui.fold بعد إعادة التحميل'); await p3.context().close();
    // ٣) لا وظيفة تُفقد: مجموعة data-act في الشاشتين مع فتح كل الأقسام = ما في العرض القديم (مفتوح)
    for (const s of ['estate', 'cities']) {
      const pl = await page(b, '?player=1&seed=5', 2); await h(pl, s); await openAll(pl); const a1 = await acts(pl); await pl.context().close();
      const lg = await page(b, '?learn=1&seed=5', 2); await h(lg, s); const a2 = await acts(lg); await lg.context().close();
      const miss = a2.filter(x => !a1.includes(x)); assert.deepEqual(miss, [], s + ': وظائف مفقودة بعد الطيّ: ' + miss); ok(`${s}: كل الأزرار (${a2.length} نوعاً) موجودة بعد فتح الأقسام`);
    }
    assert.deepEqual(errors, []); console.log('OK screen-length-ui');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
