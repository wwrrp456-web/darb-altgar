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
          Object.assign(S.player.wallet, { sar: value, usd: value, au: value, ag: value });
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
        assert.equal(layout.resources.length, 5);
        assert(layout.resources.every(r => r.visibleIcon && r.readable && r.exact), `Readable resources at ${width}px / ${value}`);
      }
      assert.equal(await page.locator('#hWallets').evaluate(el => el.tagName), 'DIV', 'Currencies are not wrapped in one button');
      const originalHash = await page.evaluate(() => location.hash);
      for (const [id, name, from] of [['hSar','الريال','sar'],['hUsd','الدولار','usd'],['hGold','الذهب','au'],['hLoad','حمولة',null]]) {
        await page.click('#' + id);
        assert.equal(await page.locator('#resourceMenu').isVisible(), true);
        assert((await page.locator('#resourceTitle').textContent()).includes(name));
        assert.equal(await page.locator('.resource-trigger[aria-expanded=true]').count(), 1);
        assert.equal(await page.locator('#' + id).getAttribute('aria-expanded'), 'true');
        assert.equal(await page.evaluate(() => location.hash), originalHash, 'Opening a resource does not navigate');
        const box = await page.locator('#resourceMenu').boundingBox();
        assert(box.x >= 0 && box.x + box.width <= width + 1 && box.y >= 0 && box.y + box.height <= 901, 'Dropdown fits viewport');
        assert(await page.locator('.resource-trigger').evaluateAll(els => { const m = document.getElementById('resourceMenu').getBoundingClientRect(); return els.every(el => { const b = el.getBoundingClientRect(); return b.bottom <= m.top || b.top >= m.bottom || b.right <= m.left || b.left >= m.right; }); }), 'Dropdown leaves all four resource triggers reachable');
        if (from) assert.equal(await page.locator('#resourceMenu [data-act=resourcefx]').getAttribute('data-f'), from);
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#resourceMenu').isHidden(), true);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'hLoad', 'Escape restores focus to its trigger');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#resourceMenu').isVisible(), true, 'Keyboard opens the dropdown');
      await page.click('#hLoad');
      assert.equal(await page.locator('#resourceMenu').isHidden(), true, 'Same trigger toggles closed');
      await page.click('#hUsd');
      await page.mouse.click(2, 300);
      assert.equal(await page.locator('#resourceMenu').isHidden(), true, 'Outside click dismisses');
      await page.click('#hGold');
      await page.locator('#resourceMenu [data-act=resourcefx]').focus();
      await page.evaluate(() => { __game.S.player.wallet.au = 2.125; __game.renderAll(true); });
      assert((await page.locator('.resource-balance').textContent()).includes('2.125'), 'Open balance updates live');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'resourcefx', 'Live updates preserve action focus');
      await page.click('#resourceMenu [data-act=resourcefx]');
      assert.equal(await page.locator('#fxFrom').inputValue(), 'au', 'Gold opens exchange with gold selected');
      assert.equal(await page.locator('#resourceMenu').isHidden(), true);
      await page.evaluate(() => { __game.S.player.caravans[0].cargo = {wheat:2,dates:3}; __game.renderAll(true); });
      await page.click('#hLoad');
      assert.equal(await page.locator('.resource-cargo .kv').count(), 2, 'Cargo dropdown lists carried goods');
      assert.equal(await page.locator('.resource-balance b').getAttribute('dir'), 'ltr', 'Load and capacity keep their numeric order in Arabic');
      await page.click('#resourceMenu [data-go=caravan]');
      assert.equal(await page.evaluate(() => location.hash), '#caravan');
      assert.equal(await page.locator('#resourceMenu').isHidden(), true, 'Navigation closes the dropdown');
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
      console.log(`OK   HUD ${width}px: independent dropdowns, keyboard, live data, exchange, cargo, bounds, icons, celebration and collapse`);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
