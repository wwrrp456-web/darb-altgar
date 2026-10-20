// مشاهد نتائج المعارك المتنوعة: لا يتكرر المشهد نفسه متتالياً: node test/outcome-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.intro = 5; S.learn.level = 5; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq'].forEach(k => S.learn[k] = []); g.go('market'); g.renderAll(true); });
  const road = async () => { await p.evaluate(() => { const g = __game, S = g.S, m = S.player.caravans[0]; S.road = { k: 'bandits', day: S.day, car: m.id, to: 'jeddah', from: m.city, B: 10 }; g.renderAll(true); }); await p.waitForTimeout(150); };
  // بلا صور مشاهد: تبقى الأيقونة الصغيرة
  await road(); await p.locator('#dlg [data-act=roadopt][data-c=pay]').click(); await p.waitForTimeout(150);
  ok(await p.locator('#dlg .outscene').count() === 0 && await p.locator('#dlg .road-res .ti.big').count() === 1, 'بلا مشاهد: تعود الأيقونة الصغيرة');
  await p.locator('#dlg [data-act=roadok]').click(); await p.waitForTimeout(100);
  // بثلاثة مشاهد للجزية
  const px = c => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="210" height="90"><rect width="210" height="90" fill="' + c + '"/></svg>');
  await p.evaluate(() => { const px = c => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="210" height="90"><rect width="210" height="90" fill="' + c + '"/></svg>'); window.ART['scene/land_paid_1'] = px('#c33'); window.ART['scene/land_paid_2'] = px('#3c3'); window.ART['scene/land_paid_3'] = px('#33c'); });
  const seen = []; for (let i = 0; i < 8; i++) { await road(); await p.locator('#dlg [data-act=roadopt][data-c=pay]').click(); await p.waitForTimeout(120); seen.push(await p.locator('#dlg .outscene').first().getAttribute('src')); await p.locator('#dlg [data-act=roadok]').click(); await p.waitForTimeout(80); }
  ok(seen.every(Boolean), 'يظهر مشهد في كل مرة');
  ok(seen.every((s, i) => i === 0 || s !== seen[i - 1]), 'لا يتكرر المشهد نفسه مرتين متتاليتين');
  ok(new Set(seen.slice(0, 3)).size === 3 && new Set(seen.slice(3, 6)).size === 3, 'المشاهد الثلاثة كلها تُعرض قبل أن يتكرر أيّ منها');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'بلا تمرير أفقي');
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
