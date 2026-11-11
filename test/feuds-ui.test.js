'use strict';
// 036و (الواجهة) على 390: قائمة «الخصومات» في صفحة الزعماء، سطر بطاقة السوق المتضرر، سطر «حال أعمالي» (نقرتان)، لا تمرير أفقي، المطفأ = بلا شيء
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m), errors = [];
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; S.phase = 3; S.player.gold = 200000; S.player.wallet.sar = 200000;
  for (let i = E.shopsOf(S, 'riyadh').length; i < 1; i++) E.A.buildShop(S, 'riyadh');
  S.feuds = [{ a: 'cairo', b: 'riyadh', s: S.day, e: S.day + 40 }]; E.feudApply(S); S.player.led.inc.shops = 4000; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + '?player=1&seed=5'); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE);
  // قائمة الخصومات في صفحة الزعماء (نقرة واحدة من الرئيسية: الزعماء)
  await p.evaluate(() => __game.go('lords')); await p.waitForTimeout(400);
  const lst = await p.locator('[data-feuds] [data-feud="cairo-riyadh"]').innerText(); a.ok(/\+\d+٪/.test(lst) && /40 يوماً/.test(lst), 'سطر الخصومة بالأثر والمدة: ' + lst); a.equal(await wide(p), false, 'لا تمرير أفقي في الزعماء'); ok('قائمة الخصومات: الأثر والمدة، بلا تمرير أفقي');
  // سطر السوق المتضرر
  await p.evaluate(() => __game.go('market')); await p.waitForTimeout(300); await p.selectOption('#mktCity', 'riyadh'); await p.waitForTimeout(400);
  const ln = await p.locator('[data-feud-line]').innerText(); a.ok(/تنتهي بعد 40 يوماً/.test(ln) && /\+\d+٪/.test(ln), 'سطر السوق: ' + ln); a.equal(await wide(p), false, 'لا تمرير أفقي في السوق');
  await p.selectOption('#mktCity', 'jeddah'); await p.waitForTimeout(300); a.equal(await p.locator('[data-feud-line]').count(), 0, 'سوق غير متضرر بلا سطر'); ok('سطر بطاقة السوق في المتضرر وحده');
  // حال أعمالي: سطر ثم نافذة (نقرة واحدة)
  await p.evaluate(() => __game.go('home')); await p.waitForTimeout(500);
  const row = p.locator('#screen .hs .hs-row[data-dchip="fold:hs-feud"]'); a.equal(await row.count(), 1, 'سطر الخصومة في حال أعمالي'); a.ok((await row.boundingBox()).height >= 44, 'لمس ≥ 44');
  await row.click(); await p.waitForTimeout(300); const sh = await p.evaluate(() => document.getElementById('dsheet').textContent.replace(/\s+/g, ' ')); a.ok(/\d+ يوماً/.test(sh) && /افتح العقارات/.test(sh), 'النافذة: ' + sh.slice(0, 120)); a.equal(await wide(p), false, 'لا تمرير أفقي في الرئيسية');
  await p.evaluate(() => { __game.dClose(); __game.S.feuds = []; __game.E.feudApply(__game.S); __game.go('home'); }); await p.waitForTimeout(400); a.equal(await p.locator('#screen .hs .hs-row[data-dchip="fold:hs-feud"]').count(), 0, 'تنتهي فيختفي السطر'); ok('حال أعمالي: سطر ثم نافذة، ويختفي بانتهائها');
  // المطفأ
  await p.evaluate(() => { const { S, E } = __game; S.feuds = [{ a: 'cairo', b: 'riyadh', s: S.day, e: S.day + 40 }]; E.feudApply(S); E.GRIEF.on = false; __game.go('lords'); }); await p.waitForTimeout(300); a.equal(await p.locator('[data-feuds]').count(), 0, 'المطفأ: لا قائمة');
  await p.evaluate(() => { __game.go('home'); }); await p.waitForTimeout(300); a.equal(await p.locator('.hs-row[data-dchip="fold:hs-feud"]').count(), 0, 'المطفأ: لا سطر'); ok('GRIEF.on=false: لا قائمة ولا سطر');
  await b.close(); a.deepEqual(errors, [], 'أخطاء صفحة: ' + errors.join(' | ')); console.log('feuds-ui: كل الفحوص نجحت');
})().catch(e => { console.error(e); process.exit(1); });
