'use strict';
// 040هـ واجهة: حالة الدكان والمخزن (كلمة وشريط وأثر وزر ترميم) وسطر الالتزامات؛ بلا تمرير أفقي على 390 ولا قائمة منسدلة جديدة
const assert = require('node:assert/strict'), path = require('node:path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => { const b = await chromium.launch(); try { for (const width of [390, 1100]) {
  const p = await b.newPage({ viewport: { width, height: 850 } }), errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4'); await p.waitForTimeout(700);
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.free = true; S.learn.intro = 11; S.phase = 3; S.player.gold = 90000; g.E.A.buildShop(S, 'riyadh'); g.E.A.buildWarehouse(S, 'riyadh'); g.go('estate'); });
  await p.evaluate(() => { ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []); __game.renderAll(true); });
  const conds = p.locator('.shcond:visible'); assert.equal(await conds.count(), 2, 'دكان ومخزن');
  const SH = p.locator('.shcond:visible:not([data-cond=wh])'), WH = p.locator('.shcond:visible[data-cond=wh]'); assert.match(await SH.innerText(), /الحالة: جيدة/); assert.match(await SH.innerText(), /إقبال عادي/); assert.match(await WH.innerText(), /خطر الحريق عادي/); assert.equal(await p.locator('.shcond:visible [data-act=shoprepair]').count(), 0, 'لا ترميم لسليم');
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي');
  // إهمال: الحالة المتهالكة تُظهر الأثر وزر الترميم
  await p.evaluate(() => { const S = __game.S, pr = S.player.props.riyadh; pr.shops[0].cond = 10; pr.wcond = 20; __game.renderAll(true); });
  const t0 = await SH.innerText(); assert.match(t0, /متهالكة/); assert.match(t0, /إقبال −/); assert.match(await WH.innerText(), /خطر الحريق ×/);
  assert.equal(await p.locator('.shcond:visible [data-act=shoprepair]').count(), 2); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي مع الأزرار');
  assert.equal(await p.locator('.shcond select').count(), 0, 'لا قائمة منسدلة');
  const g0 = await p.evaluate(() => __game.S.player.gold); await SH.locator('[data-act=shoprepair]').click(); await p.waitForTimeout(250);
  const r = await p.evaluate(() => { const S = __game.S, pr = S.player.props.riyadh; return { c: pr.shops[0].cond, g: S.player.gold }; }); assert.equal(r.c, 90, 'الترميم يعيد 90'); assert(r.g < g0, 'خُصم مبلغ الترميم');
  assert.match(await SH.innerText(), /ممتازة/);
  // سطر الالتزامات
  assert.match(await p.locator('.obligations:visible').first().innerText(), /الصيانة: حافظتَ على 1 دكاناً بحالة جيدة/);
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); assert.deepEqual(errors, []); await p.close(); }
  console.log('PASS shop condition card, repair button and obligations line at 390/1100; no overflow'); } finally { await b.close(); } })().catch(e => { console.error(e); process.exitCode = 1; });
