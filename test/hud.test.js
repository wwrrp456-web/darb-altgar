// Resources stay readable on phones, including large balances and contextual cards.
const assert = require('node:assert/strict');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [320, 390, 760, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto('file://' + path.join(__dirname, '../index.html'));
      assert.equal(await page.locator('#hAvatar .lvl').count(), 0, 'No empty level badge');
      assert.equal(await page.locator('#hDebt').isVisible(), false, 'Inapplicable debt card is hidden');
      assert.equal(await page.locator('#hHawl').isVisible(), false, 'Inapplicable zakat card is hidden');
      for (const value of [800, 249743, 1234567890]) {
        await page.evaluate(value => {
          const { S, renderAll } = __game;
          Object.assign(S.player.wallet, { sar: value, usd: value, au: value });
          renderAll(true);
        }, value);
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          resources: [...document.querySelectorAll('#hWallets .wtile, #hLoad')].map(el => {
            const icon = el.querySelector('img'), text = el.querySelector('b');
            return { visibleIcon: icon.complete && icon.naturalWidth > 0 && icon.getBoundingClientRect().width >= 24,
              readable: text.scrollWidth <= text.clientWidth + 1, exact: !!el.title };
          })
        }));
        assert.equal(layout.overflow, false, `No overflow at ${width}px / ${value}`);
        assert.equal(layout.resources.length, 4);
        assert(layout.resources.every(r => r.visibleIcon && r.readable && r.exact), `Readable resources at ${width}px / ${value}`);
      }
      await page.locator('#topTog').click();
      assert.equal(await page.locator('#hWallets').isVisible(), false, 'Collapse hides resources');
      await page.locator('#topTog').click();
      assert.equal(await page.locator('#hWallets').isVisible(), true, 'Expand restores resources');
      await page.goto('file://' + path.join(__dirname, '../index.html?learn=1'));
      await page.evaluate(() => {
        const { S, E, renderAll } = __game;
        E.A.learnSetChar(S, 'trader'); S.learn.level = 2; S.learn.intro = 2;
        S.learn.up = [1]; renderAll(true);
      });
      assert.equal(await page.locator('#hDebt').isVisible(), true);
      assert.equal(await page.locator('#lesson .m-cheer .salem-portrait img').count(), 1, 'Dignified celebration is displayed');
      assert.equal(await page.locator('.mav .mm').count(), 0, 'No cartoon mood badges over Salem');
      const animation = await page.locator('#lesson .m-cheer .av').evaluate(el => getComputedStyle(el).animationName);
      assert.equal(animation, 'none', 'Celebration does not bounce');
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`OK   HUD ${width}px: icons, large balances, contextual cards, dignified celebration, collapse`);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
