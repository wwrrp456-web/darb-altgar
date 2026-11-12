'use strict';
// 035ج2 واجهة كفاءة رئيس المزرعة ومدير المصنع على 390: بطاقة خطة الزرع وبطاقة نفاد المواد في «ما ينتظرك» (الخيارات، ظهور الاختيار بالتظليل والسطر والرقم، التنفيذ بالاختيار فقط)،
// سطور الدرجة في صفحة المزرعة وبطاقة المدير، شرائح الشراء للدرجة 5 مع ملخصها، صورة كبير الرعاة تكتمل، لا تمرير أفقي ولا أخطاء JS.
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/chief-x'); fs.mkdirSync(SHOTS, { recursive: true });
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false;
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; S.player.gold = 400000; S.player.wallet.sar = 400000; S.phase = 3; S.learn.level = Math.max(S.learn.level, 11);
  for (let i = E.shopsOf(S, 'riyadh').length; i < 3; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); E.A.buildWarehouse(S, 'riyadh');
  const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh');
  S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; S.player.fixedEma = 500; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; };
const SETUP = () => { const { S, E } = __game, A = E.A, a_ok = v => { if (!v) throw Error('setup'); };
  if (!A.buildFarm(S, 'riyadh').ok && !E.farmOf(S, 'riyadh')) throw Error('farm'); if (!E.farmBossOf(S, 'riyadh') && !A.hireFarmBoss(S, 'riyadh', 10).ok) throw Error('boss');
  const m = E.farmBossOf(S, 'riyadh'), f = E.farmOf(S, 'riyadh'); f.level = 3; m.sk = { g: 5, xp: 999, m: 1, spec: {}, home: 'farm', wk: 0 }; f.herd = { najdi: 20 }; E.hxOf(f, 'najdi').m = 6; S.player.gold = S.player.wallet.sar = 400000;
  if (!E.farmFarmers(S, 'riyadh').length) A.hireStaff(S, 'riyadh', 'farmer'); a_ok(A.cropConvert(S, 'riyadh', 0, 'field').ok); a_ok(A.cropConvert(S, 'riyadh', 1, 'field').ok); S.day = (Math.floor(S.day / E.FARMX.season) + 1) * E.FARMX.season; E.farmBossBegin(S, 'riyadh');
  const origin = S.order.find(id => S.cities[id].sig === 'silk'); S.bosses[origin].trust = 50; a_ok(A.buildFactory(S, 'riyadh', 'silk').ok); a_ok(A.hireManager(S, 'riyadh', 3).ok);
  const pr = S.player.props.riyadh, g = pr.mgr; g.sk = { g: 5, xp: 999, m: 1, spec: {}, home: 'make', wk: 0 }; g.x = undefined; S.cities.riyadh.stock.cotton = 5000;
  for (let d = 0; d < 7; d++) { const t = S.day; S.day = t - d; E.mgrxUse(S, pr, 'cotton', 10); S.day = t; } pr.store.cotton = 20; E.mgrxDay(S, 'riyadh', pr); };
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(SETUP); await p.evaluate(() => { __game.ui.ix = { shop: 1, warehouse: 1, storage: 1, farm: 1 }; __game.go('home'); }); await p.waitForTimeout(500); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const num = s => +String(s).replace(/[^\d]/g, ''), errors = [];
(async () => {
  const b = await chromium.launch(), p = await mk(b, 390, '?player=1&seed=5');
  await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'today'; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(500);
  // 1) البطاقتان في «ما ينتظرك»
  const plan = p.locator('#screen .dask[data-dask^="fx"]'), short = p.locator('#screen .dask[data-dask^="mx"]');
  a.equal(await plan.count(), 1, 'بطاقة خطة الزرع'); a.equal(await short.count(), 1, 'بطاقة نفاد المواد'); a.ok((await plan.locator('.dhd .dt').innerText()).includes('خطة الزرع')); a.ok((await short.locator('.dhd .dt').innerText()).includes('نفاد المواد'));
  a.equal(await p.evaluate(() => __game.E.farmOf(__game.S, 'riyadh').plots.every(q => !q.crop)), true, 'لم يُزرع شيء قبل الاختيار'); a.equal(await wide(p), false, 'لا تمرير أفقي في المكتب');
  // 2) بطاقة الزرع: الخيارات والتنفيذ بالاختيار وظهوره
  await plan.locator('.dhd').click(); await p.waitForTimeout(200); const popts = plan.locator('.dopt'); a.ok(await popts.count() >= 2, 'خياران على الأقل'); a.ok((await popts.last().innerText()).includes('لا تزرع'));
  const g0 = await p.evaluate(() => __game.S.player.gold); await plan.locator('.dopt[data-oid="best"]').click(); await p.waitForTimeout(250);
  a.equal(await p.evaluate(() => __game.E.farmOf(__game.S, 'riyadh').plots.slice(0, 2).every(q => !!q.crop)), true, 'زُرع بالاختيار'); const spent = g0 - await p.evaluate(() => __game.S.player.gold); a.ok(spent > 0, 'خُصم البذر ' + spent);
  const sel = p.locator('#screen .dask[data-dask^="fx"] .dopt.on, #dsheet .dask[data-dask^="fx"] .dopt.on'); a.ok((await sel.count()) >= 1 || (await p.locator('#screen .dask[data-dask^="fx"]').count()) === 0, 'الخيار المختار مظلَّل أو انتهت البطاقة بعد إظهار النتيجة');
  // 3) بطاقة النفاد: اشترِ الآن بالرقم
  await p.waitForTimeout(500); const s0 = await p.evaluate(() => __game.S.player.props.riyadh.store.cotton), k = await p.evaluate(() => __game.E.mgrXView(__game.S).cards[0]); a.equal(k.g, 'cotton'); a.ok(k.days <= 7);
  if (await short.count()) { await short.locator('.dhd').click(); await p.waitForTimeout(200); a.equal(await short.locator('.dopt').count(), 3, 'ثلاثة خيارات'); const txt = await short.innerText(); a.ok(txt.includes('اشترِ الآن من') && txt.includes('ذكّرني غداً') && txt.includes('تجاهل'), txt);
    await short.locator('.dopt[data-oid="buy"]').click(); await p.waitForTimeout(250); }
  a.ok((await p.evaluate(() => __game.S.player.props.riyadh.store.cotton)) > s0 + k.qty * 0.9, 'المخزون زاد بالكمية'); a.equal(await p.evaluate(() => __game.E.mgrXView(__game.S).cards.length), 0, 'انحلّت البطاقة'); a.equal(await wide(p), false);
  // 4) صفحة المزرعة: سطر كفاءة الرئيس (وسقفه بالدرجة)، وبطاقة المدير بالسعة والأمانة وشرائح الشراء
  await p.evaluate(() => { __game.go('estate'); __game.renderAll(true); }); await p.waitForTimeout(400); await p.locator('[data-estcity=riyadh]').first().click().catch(() => {}); await p.waitForTimeout(500);
  const fx = p.locator('.farm-x'); a.equal(await fx.count(), 1, 'سطر كفاءة رئيس المزرعة'); await fx.scrollIntoViewIfNeeded(); const ft = await fx.innerText(); a.ok(ft.includes('شيخ الصنعة') && ft.includes('60') && ft.includes('لا يبيع الأنعام الكبيرة'), ft);
  a.equal(await p.locator('#farmBossCap').getAttribute('max'), '60', 'سقف الإدخال 60 للدرجة 5');
  await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.empire = 'factory'; __game.go('empire'); __game.renderAll(true); }); await p.waitForTimeout(400); await p.locator('[data-ee="sa"]').first().click(); await p.waitForTimeout(500);
  const mx = p.locator('.mgr-x'); a.equal(await mx.count(), 1, 'بطاقة كفاءة المدير'); await mx.scrollIntoViewIfNeeded(); const mt = await mx.innerText(); a.ok(mt.includes('السعة') && mt.includes('12') && mt.includes('أمانته') && mt.includes('ينبّه قبل نفاد'), mt);
  // ظهور الاختيار: شرائح الوضع والميزانية
  const execB = mx.locator('[data-act="mxrule"][data-k="mode"][data-v="exec"]'); a.equal(await mx.locator('[data-act="mxrule"][data-k="mode"][aria-pressed="true"]').count(), 1, 'وضع مظلَّل افتراضياً'); a.ok((await execB.boundingBox()).height >= 44, 'لمس ≥ 44');
  await execB.click(); await p.waitForTimeout(250); const mx2 = p.locator('.mgr-x'); a.equal(await mx2.locator('[data-v="exec"][aria-pressed="true"]').count(), 1, 'ينفّذ مظلَّل'); a.equal(await p.evaluate(() => __game.S.player.props.riyadh.mgr.x.mode), 'exec');
  await mx2.locator('[data-k="budget"][data-v="5000"]').click(); await p.waitForTimeout(250); const mx3 = p.locator('.mgr-x'); a.equal(await mx3.locator('[data-k="budget"][data-v="5000"][aria-pressed="true"]').count(), 1, 'الميزانية مظلَّلة'); a.ok((await mx3.locator('[data-mx-sum]').innerText()).includes('5,000') || (await mx3.locator('[data-mx-sum]').innerText()).includes('5٬000') || num(await mx3.locator('[data-mx-sum]').innerText()) === 5000, 'ملخص بالرقم: ' + await mx3.locator('[data-mx-sum]').innerText());
  a.equal(await p.evaluate(() => __game.S.player.props.riyadh.mgr.x.budget), 5000); a.equal(await wide(p), false, 'لا تمرير أفقي في المزرعة والمصنع');
  // 5) صورة كبير الرعاة
  await p.evaluate(() => { const { S, E } = __game; if (!E.chiefOf(S, 'sa')) E.A.hireChief(S, 'sa'); const ch = E.chiefOf(S, 'sa'); ch.sk = { g: 3, xp: 999, m: 1, spec: {} }; E.chxOf(ch, true); __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(400);
  await p.evaluate(() => __game.openDomain ? __game.openDomain('hs:chx') : 0); await p.locator('#screen .hs .hs-row[data-dchip="hs:chx"]').click().catch(() => {}); await p.waitForTimeout(500);
  const im = p.locator('#dsheet img.chx-pic'); if (await im.count()) { a.equal(await im.first().getAttribute('data-art'), 'characters/chief-herder'); await p.waitForFunction(() => { const i = document.querySelector('#dsheet img.chx-pic'); return i && i.complete; }, null, { timeout: 8000 }).catch(() => {}); a.ok(await im.first().evaluate(i => i.naturalWidth > 0), 'صورة كبير الرعاة تكتمل'); a.equal(await im.first().evaluate(i => getComputedStyle(i).objectFit), 'cover'); a.equal(await wide(p), false); } else a.fail('لا لوحة كبير الرعاة');
  // 6) المطفأ: لا بطاقتين ولا سطور
  await p.evaluate(() => { __game.E.FARMX.on = false; __game.E.MGRX.on = false; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(400); a.equal(await p.locator('#screen .dask[data-dask^="fx"], #screen .dask[data-dask^="mx"]').count(), 0, 'مطفأ: لا بطاقات'); await p.evaluate(() => { __game.E.FARMX.on = true; __game.E.MGRX.on = true; });
  a.deepEqual(errors, [], 'لا أخطاء JS: ' + errors.join(' | ')); ok('كفاءة رئيس المزرعة ومدير المصنع (الواجهة) على 390'); await b.close(); console.log('PASS farm-x-ui');
})().catch(e => { console.error(e); process.exit(1); });
