'use strict';
// 040د (الواجهة) على 390 و1100: زر «اعرض شراكة» بسببه المعطَّل، نافذة العرض (ظهور الاختيار وملخص بالرقم واحتمال القبول ونص الزكاة)،
// العقد في سطر «حال أعمالي» ثم التقرير وزر السحب بمبلغه، العرض الوارد بطاقة «المطلوب»، لا تمرير أفقي، لمس ≥ 44، والمفتاح مطفأً = لا زر ولا سطر
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; for (const id of S.order) for (const g in E.HOARD_GOODS) { const c0 = S.cities[id]; c0.stock[g] = Math.max(c0.stock[g], (c0.dem[g] || 1) * 60); }
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; S.player.gold = 200000; S.player.wallet.sar = 200000; S.phase = 3;
  for (let i = E.shopsOf(S, 'riyadh').length; i < 3; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); E.A.buildWarehouse(S, 'riyadh');
  const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh');
  S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; S.player.fixedEma = 500; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; };
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(() => { __game.ui.ix = { shop: 1, warehouse: 1, storage: 1, farm: 1 }; __game.go('home'); }); await p.waitForTimeout(500); return p; };
const errors = [];
const sheet = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

const RIV = () => { const { S, E } = __game; S.day = Math.max(S.day, 130); S.rivals = []; const id = 'riyadh';
  const mk = (i, w, str, nm) => ({ id: 800 + i, name: nm, dom: 'goods', idea: 'G05', pers: 'الجريء', bg: 'حرفي صاعد', path: 'الصاعد', rel: 'منافس شريف', city: id, born: S.day - 100, fate: 0, str, w, kn: 0, fx: { kind: 'supply', cities: [id], gs: ['tools'], mul: 0.2, start: S.day - 100, until: S.day + 9999, cont: true } });
  S.rivals.push(mk(1, 180000, 1, 'مازن الحدّاد'), mk(2, 95000, 0.3, 'راشد النسّاج')); S.rivalGen = Object.assign(S.rivalGen || { seed: 5, births: 2, next: S.day + 500 }, { births: 2, next: S.day + 500 });
  for (const c of S.order) { const b = E.bossOf(S, c); if (b) b.ruler = 'x'; } const b = E.bossOf(S, id); b.ruler = 'player'; b.p = 100; b.b = 5; E.RIVP.a0 = 0.2; S.player.caravans.forEach(c => { c.captain = null; }); __game.go('home'); };
const OFFICE = async p => { await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'goals'; __game.go('office'); }); await p.waitForTimeout(500); await p.evaluate(() => __game.dOpen('fold:of-rivals')); await p.waitForTimeout(400); };
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'); await p.evaluate(RIV); await p.waitForTimeout(400);
    // ١) الزر في بطاقة المنافس (مدينة تحكمها) بحجم لمس كافٍ
    await OFFICE(p); const btn = p.locator('#dsheet [data-rvp-btn="801"] button'); a.equal(await btn.count(), 1, w + ': زر اعرض شراكة'); a.ok((await btn.boundingBox()).height >= 44, 'لمس ≥ 44'); a.equal(await btn.isDisabled(), false);
    // مدينة لا تحكمها: لا زر
    a.equal(await p.evaluate(() => { const { S, E } = __game; E.bossOf(S, 'riyadh').ruler = 'x'; return 0; }), 0); await p.evaluate(() => __game.dClose()); await OFFICE(p); a.equal(await p.locator('#dsheet [data-rvp-btn]').count(), 0, 'بلا حكم: لا زر');
    await p.evaluate(() => { const { S, E } = __game; const b = E.bossOf(S, 'riyadh'); b.ruler = 'player'; }); await p.evaluate(() => __game.dClose()); await OFFICE(p);
    // ٢) نافذة العرض: ظهور الاختيار والملخص بالرقم واحتمال القبول والزكاة
    await p.locator('#dsheet [data-rvp-btn="801"] button').click(); await p.waitForTimeout(400); let t = await sheet(p); a.ok(t.includes('عرض شراكة على مازن الحدّاد') && t.includes('احتمال قبوله'), 'النافذة: ' + String(t).slice(0, 200)); a.ok(/ضعيف|متوسط|جيد/.test(await p.locator('[data-rvp-chance]').innerText()));
    a.ok((await p.locator('#dsheet .dopt.on[aria-pressed="true"]').count()) >= 3, 'خيارات مظلَّلة'); a.ok((await p.locator('[data-rvp-zakat]').innerText()).includes('2.5%')); a.equal(await p.locator('#dsheet select').count(), 0); a.equal(await wide(p), false, w + ': لا تمرير أفقي');
    const sum0 = await p.locator('[data-rvp-sum]').innerText(); a.ok(/ستضع [\d,]+ ريال عند مازن الحدّاد مدة 30 يوماً، لك 60٪ من الربح/.test(sum0), sum0);
    const caps = await p.evaluate(() => { const { S, E } = __game; return E.rvpCapOptions(S, E.rvpGet(S, 801)); }); await p.locator('#dsheet [data-act="rvpset"][data-k="ci"][data-v="2"]').click(); await p.waitForTimeout(200); const sum1 = await p.locator('[data-rvp-sum]').innerText(); a.ok(sum1.includes(caps[2].toLocaleString('en-US')), 'الملخص بالرقم الجديد: ' + sum1 + ' ' + caps[2]); a.equal(await p.locator('#dsheet [data-act="rvpset"][data-k="ci"][data-v="2"][aria-pressed="true"]').count(), 1, 'الخيار المختار مظلَّل');
    await p.locator('#dsheet [data-act="rvpset"][data-k="share"][data-v="0.7"]').click(); await p.waitForTimeout(200); a.ok((await p.locator('[data-rvp-sum]').innerText()).includes('لك 70٪'), 'النسبة'); a.equal(await p.locator('[data-rvp-chance]').innerText(), 'ضعيف');
    await p.locator('#dsheet [data-act="rvpset"][data-k="kind"][data-v="rpart"]').click(); await p.waitForTimeout(200); t = await sheet(p); a.ok(/ستدفع [\d,]+ من [\d,]+ كلفة المصنع/.test(t), 'شراكة المصنع: ' + t.slice(0, 300)); a.equal(await wide(p), false);
    // ٣) إرسال عرض مقبول (نرفع الاحتمال): عقد في المحرك وسطر في حال أعمالي
    await p.locator('#dsheet [data-act="rvpset"][data-k="kind"][data-v="rmud"]').click(); await p.locator('#dsheet [data-act="rvpset"][data-k="share"][data-v="0.5"]').click(); await p.evaluate(() => { __game.E.RIVP.a0 = 5; }); await p.waitForTimeout(200);
    const g0 = await p.evaluate(() => __game.S.player.gold); await p.locator('#dsheet [data-act="rvpsend"]').click(); await p.waitForTimeout(500);
    a.equal(await p.evaluate(() => __game.S.player.agr.filter(x => x.kind === 'rmud').length), 1, 'العقد وُقّع'); a.ok(g0 - await p.evaluate(() => __game.S.player.gold) > 0); a.equal(await p.locator('#dsheet').count(), 0, 'أُغلقت النافذة بعد القبول');
    await p.evaluate(() => { __game.E.RIVP.a0 = 0.2; __game.go('home'); }); await p.waitForTimeout(500);
    const row = p.locator('#screen .hs .hs-row[data-dchip="hs:rvp"]'); a.equal(await row.count(), 1, 'سطر حال أعمالي'); const rt = await row.innerText(); a.ok(/1 عقد/.test(rt) && /صافي هذا الشهر/.test(rt) && /0 عروض|0 عرض/.test(rt), rt); a.ok((await row.boundingBox()).height >= 44);
    await row.click(); await p.waitForTimeout(400); t = await sheet(p); a.ok(t.includes('مضاربة مع منافس') && t.includes('مازن الحدّاد') && t.includes('ضغطه على الأسعار أخفّ 35٪'), 'التقرير: ' + t.slice(0, 400)); a.equal(await wide(p), false);
    const back = await p.evaluate(() => { const { S, E } = __game; return E.rvpWithdrawNow(S, S.player.agr.find(x => x.kind === 'rmud')); }); const wd = p.locator('#dsheet [data-act="rvpwd"]'); a.ok((await wd.innerText()).includes(back.toLocaleString('en-US')), 'زر السحب يعرض المبلغ: ' + await wd.innerText() + ' ' + back); a.ok((await wd.boundingBox()).height >= 44);
    const g1 = await p.evaluate(() => __game.S.player.gold); await wd.click(); await p.waitForTimeout(400); a.ok(Math.abs((await p.evaluate(() => __game.S.player.gold)) - g1 - back) < 1.5, 'استردّ المبلغ المعروض'); a.equal(await p.evaluate(() => __game.S.player.agr.filter(x => x.kind === 'rmud').length), 0);
    // ٤) عرض وارد: بطاقة «المطلوب»، والقبول مضمون وظاهر
    await p.evaluate(() => __game.dClose()); await p.evaluate(() => { const { S, E } = __game; const rv = E.rvpGet(S, 802); const st = E.rvpSt(S, true); st.off.push({ id: S.nextId++, rid: 802, kind: 'rmud', terms: { cap: E.rvpCapOptions(S, rv)[0], share: 0.6, days: 30 }, exp: S.day + 15 }); __game.go('home'); }); await p.waitForTimeout(500);
    const row2 = p.locator('#screen .hs .hs-row[data-dchip="hs:rvp"]'); a.ok(/1 عرض ينتظرك/.test(await row2.innerText()), await row2.innerText()); await row2.click(); await p.waitForTimeout(400); t = await sheet(p); a.ok(t.includes('راشد النسّاج يعرض عليك مضاربة مع منافس'), t.slice(0, 200));
    const ok1 = p.locator('#dsheet [data-dopt^="rvp:off:"][data-oid="ok"]'); a.equal(await ok1.count(), 1); a.ok((await ok1.boundingBox()).height >= 44); await ok1.click(); await p.waitForTimeout(500); a.equal(await p.evaluate(() => __game.S.player.agr.filter(x => x.kind === 'rmud').length), 1, 'قُبل العرض'); a.ok(await p.locator('#dsheet .dask .dopt.on[aria-pressed="true"]').count() >= 1, 'الخيار المقبول مظلَّل');
    await p.context().close();
  }
  console.log('OK   زر اعرض شراكة، نافذة العرض بظهور الاختيار والملخص، العقد في حال أعمالي، التقرير وزر السحب بمبلغه، العرض الوارد بطاقة «المطلوب» (390 و1100)');
  { // المفتاح مطفأً: لا زر ولا سطر
    const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(RIV); await p.evaluate(() => { __game.E.RIVP.on = false; }); await OFFICE(p); a.equal(await p.locator('#dsheet [data-rvp-btn]').count(), 0, 'مطفأ: لا زر'); await p.evaluate(() => __game.dClose()); await p.evaluate(() => __game.go('home')); await p.waitForTimeout(400); a.equal(await p.locator('#screen .hs [data-dchip="hs:rvp"]').count(), 0, 'مطفأ: لا سطر'); await p.context().close(); }
  console.log('OK   RIVP.on=false: لا زر ولا سطر');
  await b.close(); a.deepEqual(errors, []); console.log('rival-partner-ui: ok');
})().catch(e => { console.error(e); process.exit(1); });
