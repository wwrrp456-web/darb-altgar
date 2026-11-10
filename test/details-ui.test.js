'use strict';
// 037ب واجهة التفاصيل (390 و360): لمس ≥44، aria-label، لا تمرير أفقي، نافذة ≤70%، فوق الشريط السفلي، كل أيقونة معروضة مسجَّلة وبجانبها اسم، لقطات
const a = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/details'); fs.mkdirSync(SHOTS, { recursive: true });
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, abroad: true, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 500000;
  for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; document.querySelectorAll('#lesson,#splash,#bootload').forEach(e => e.remove());
  const city = S.player.caravans[0].city; A.buildShop(S, city); const sh = g.E.shopsOf(S, city)[0]; A.shopQuick(S, city, sh.id); const pr = S.player.props[city]; pr.store = {}; sh.items.forEach(it => { pr.store[it.g] = 0; }); pr.staff = [];
  S.paymentDues = [1, 2, 3, 4].map(i => ({ id: i, city, kind: 'staff', cat: 'staff', label: 'بند ' + i, amount: 50 * i, since: S.day - 1 })); S.paymentNext = 4; g.DETAILS.delay = 300; g.renderAll(true); };
(async () => {
  const b = await chromium.launch(), errors = [];
  for (const w of [390, 360]) {
    const p = await b.newPage({ viewport: { width: w, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); await p.goto('file://' + path.join(__dirname, '../index.html') + '?details=1&learn=1&seed=21&sched=0&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); await p.waitForTimeout(250);
    const noOver = async t => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.getElementById('dlab').scrollWidth > innerWidth + 1), false, w + ' ' + t + ': تمرير أفقي');
    // الشارة
    const chips = p.locator('.dchip'); a.equal(await chips.count(), 2);
    for (let i = 0; i < 2; i++) { const bb = await chips.nth(i).boundingBox(); a.ok(bb.width >= 44 && bb.height >= 44, w + ' لمس الشارة ' + bb.width + '×' + bb.height); const al = await chips.nth(i).getAttribute('aria-label'); a.match(al, /مطلوب|لا شيء ينتظرك/); a.ok((await chips.nth(i).locator('.dnm').innerText()).length > 1, 'الاسم ظاهر'); a.ok(al.startsWith(await chips.nth(i).locator('.dnm').innerText()), 'aria يبدأ بالاسم'); }
    await noOver('الشارات'); if (w === 390) await p.screenshot({ path: path.join(SHOTS, 'chip-390.png') });
    // النافذة
    await p.locator('[data-dchip=money]').click(); await p.waitForTimeout(400); await noOver('النافذة');
    const sb = await p.locator('.dsheet').boundingBox(); a.ok(sb.height <= 844 * 0.7 + 1, w + ' ارتفاع النافذة ' + sb.height); a.ok(Math.abs(sb.y + sb.height - 844) <= 1, 'ملتصقة بالأسفل');
    const z = await p.evaluate(() => { const n = document.getElementById('nav'); return { s: +getComputedStyle(document.getElementById('dsheet')).zIndex, n: n ? +getComputedStyle(n).zIndex || 0 : 0 }; }); a.ok(z.s > z.n, 'فوق الشريط السفلي');
    const xb = await p.locator('.dx').boundingBox(); a.ok(xb.width >= 44 && xb.height >= 44, 'زر الإغلاق ≥44');
    for (const sel of ['.dhd', '.dopt']) for (const e of await p.locator(sel).all()) { const bb = await e.boundingBox(); if (bb) a.ok(bb.height >= 44, w + ' ' + sel + ' ' + bb.height); }
    if (w === 390) await p.screenshot({ path: path.join(SHOTS, 'sheet-open-390.png') });
    a.equal(await p.locator('.dask').count(), 3); a.equal(await p.locator('.dmore').count(), 1); await p.locator('.dopt[disabled]').count();
    // كل أيقونة معروضة مسجَّلة ولها اسم ظاهر
    const bad = await p.evaluate(() => [...document.querySelectorAll('#dlabRoot [data-icon-name]')].filter(e => !GameIcons.named[e.dataset.iconName] || !e.querySelector('img') || !e.querySelector('img').getAttribute('src')).map(e => e.dataset.iconName)); a.deepEqual(bad, [], 'أيقونات غير مسجّلة أو بلا أصل: ' + bad);
    const noName = await p.evaluate(() => [...document.querySelectorAll('#dlabRoot [data-icon-name]')].filter(e => { const host = e.closest('button,.dshead'); return !host || !host.textContent.trim(); }).length); a.equal(noName, 0, 'اسم ظاهر بجانب كل أيقونة');
    if (w === 390) { await p.locator('.dopt').first().click(); await p.waitForTimeout(100); await p.screenshot({ path: path.join(SHOTS, 'card-done-390.png') }); await p.waitForTimeout(900); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(50);
    // الحالة الفارغة
    await p.evaluate(() => { __game.S.paymentDues = []; __game.dOpen('money'); }); await p.waitForTimeout(100); a.match(await p.locator('#dbody').innerText(), /لا شيء ينتظرك/); if (w === 390) await p.screenshot({ path: path.join(SHOTS, 'sheet-empty-390.png') });
    // الوضع الداكن وتقليل الحركة
    await p.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' }); await p.waitForTimeout(100); await noOver('داكن'); if (w === 390) await p.screenshot({ path: path.join(SHOTS, 'sheet-dark-390.png') });
    await p.close();
  }
  // السجل: كل أسماء ICON_REGISTRY مسجّلة في GameIcons.named
  const reg = fs.readFileSync(path.join(__dirname, '../brand/ICON_REGISTRY.md'), 'utf8'), names = [...reg.matchAll(/^\| `([^`]+)` \|/gm)].map(m => m[1]);
  const p = await b.newPage(); await p.goto('file://' + path.join(__dirname, '../index.html') + '?details=1'); await p.waitForFunction(() => !!window.GameIcons);
  const miss = await p.evaluate(n => n.filter(x => !GameIcons.named[x] || !GameIcons.nameUrl(x)), names); a.deepEqual(miss, [], 'أسماء السجل غير المربوطة: ' + miss); a.ok(names.length >= 38, 'عدد الأسماء ' + names.length);
  a.deepEqual(errors, [], errors.join('|')); await b.close(); console.log('details-ui: كل الفحوص نجحت (' + names.length + ' اسم في السجل)');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
