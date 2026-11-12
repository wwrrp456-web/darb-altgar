'use strict';
// 035ج كبير الرعاة «صاحب الفرص» (الواجهة) على 390: الوصول (سطر «المواشي» في «حال أعمالي» ← اللوحة)، البطاقة بخياراتها والخيار المعطّل وسببه،
// ظهور الاختيار (تظليل + ملخص بالرقم + إعادة رسم)، الجدول، الصلاحيات، السجل والإلغاء، التجميد، بطاقة «ما ينتظرك»، لا تمرير أفقي ولا أخطاء JS، والمطفأ.
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/chief-x'); fs.mkdirSync(SHOTS, { recursive: true });
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false;
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; S.player.gold = 400000; S.player.wallet.sar = 400000; S.phase = 3; S.learn.level = Math.max(S.learn.level, 11);
  for (let i = E.shopsOf(S, 'riyadh').length; i < 3; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); E.A.buildWarehouse(S, 'riyadh');
  const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh');
  S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; S.player.fixedEma = 500; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; };
const HERD = () => { const { S, E } = __game, A = E.A; if (!A.buildFarm(S, 'riyadh').ok && !E.farmOf(S, 'riyadh')) throw Error('farm'); if (!A.hireChief(S, 'sa').ok && !E.chiefOf(S, 'sa')) throw Error('chief');
  const f = E.farmOf(S, 'riyadh'), ch = E.chiefOf(S, 'sa'); S.player.props.riyadh.butcher = 1; f.level = 3; ch.sk = { g: 5, xp: 999, m: 1, spec: {} };
  f.herd = { najdi: 40, naeemi: 20 }; E.hxOf(f, 'najdi').m = 14; E.hxOf(f, 'naeemi').m = 7; E.snapshotKnown(S, S.order); S.cities.riyadh.stock.najdi = E.capG(S.cities.riyadh, 'najdi'); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']);
  const x = E.chxOf(ch, true); x.nx = S.day - 1; x.disc = S.day; x.rep = S.day; E.chiefDay(S); x.nx = S.day + 999; };
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(HERD); await p.evaluate(() => { __game.ui.ix = { shop: 1, warehouse: 1, storage: 1, farm: 1 }; __game.go('home'); }); await p.waitForTimeout(500); return p; };
const view = p => p.evaluate(() => JSON.parse(JSON.stringify(__game.E.chiefXView(__game.S), (k, v) => (k === 'ch' ? undefined : v))));
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const sheet = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const num = s => +String(s).replace(/[^\d]/g, ''), errors = [];
(async () => {
  const b = await chromium.launch(), p = await mk(b, 390, '?player=1&seed=5');
  let v = await view(p); a.ok(v && v.list.length === 1 && v.opps >= 1, 'فرصة بيع جاهزة: ' + JSON.stringify(v && v.opps));
  // 1) الوصول: سطر «المواشي» في «حال أعمالي» بالأرقام الصحيحة ثم اللوحة
  const row = p.locator('#screen .hs .hs-row[data-dchip="hs:chx"]'); a.equal(await row.count(), 1, 'سطر المواشي في حال أعمالي'); const rt = (await row.innerText()).replace(/\s+/g, ' ');
  a.ok(rt.includes('المواشي') && rt.includes(v.opps + ' فرص') || rt.includes(v.opps + ' فرصة'), rt); a.ok(rt.includes(String(v.heads)) && rt.includes('رأس في الطريق'), rt); a.ok(rt.includes('صافي الشهر') && rt.includes(String(Math.abs(v.month)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')), rt);
  a.ok((await row.boundingBox()).height >= 44, 'لمس ≥ 44'); a.equal(await wide(p), false, 'لا تمرير أفقي في الرئيسية');
  await row.click(); await p.waitForTimeout(350); let t = await sheet(p); a.ok(t && t.includes('كبير الرعاة'), 'اللوحة تفتح بنقرة واحدة من السطر (نقرتان من الرئيسية)'); a.equal(await wide(p), false, 'لا تمرير أفقي في اللوحة');
  await p.screenshot({ path: path.join(SHOTS, 'panel-390.png') });
  // 2) البطاقة: خياراتها والخيار المعطّل وسببه
  const card = p.locator('#dsheet .dask:has(.dopt[data-oid="sell"])').first(); a.ok(await card.count() === 1, 'بطاقة البيع'); const opts = await card.locator('.dopt').evaluateAll(es => es.map(e => ({ t: e.textContent.replace(/\s+/g, ' ').trim(), dis: e.disabled, id: e.dataset.oid, best: e.classList.contains('best') })));
  a.deepEqual(opts.map(o => o.id), ['sell', 'half', 'wait', 'all'], 'بيع (موصى به) · نصف للجزّار · انتظر · الكل'); a.ok(opts[0].best && /الصافي المتوقع نحو [\d,]+ ريال/.test(opts[0].t) && opts[0].t.includes('في مزرعتك'), opts[0].t); a.ok(opts[1].t.includes('الجزّار')); a.ok(opts[2].t.includes('السعر قد يرتفع أو ينزل؛ لا ضمان'));
  a.ok(opts[3].dis && opts[3].t.includes('يترك المزرعة تحت حد التكاثر'), 'الخيار المعطّل وسببه ظاهر: ' + opts[3].t); const m0 = v.list[0].cards.find(c => c.type === 'sell'), n0 = m0.qty;
  // 3) ظهور الاختيار: بعد النقر خيار مظلَّل بـaria-pressed وسطر ملخص بالرقم الصحيح، والنافذة تُعاد رسمها
  await card.locator('.dopt[data-oid="sell"]').click(); await p.waitForTimeout(250);
  const done = p.locator('#dsheet .dask[data-state="done"]'); a.equal(await done.count(), 1, 'البطاقة تتحول إلى منجزة'); await p.screenshot({ path: path.join(SHOTS, 'chosen-390.png') }); a.equal(await done.locator('.dopt.on[aria-pressed="true"]').count(), 1, 'الخيار المختار مظلَّل'); a.equal(await done.locator('.dopt.on').getAttribute('data-oid'), 'sell');
  const res = await done.locator('.dres').innerText(); a.ok(res.includes('بيع ' + n0) || res.includes(String(n0)), 'ملخص بالرقم: ' + res + ' / ' + n0); a.ok(/[\d,]{3,}/.test(res));
  v = await view(p); a.ok(v.heads >= 1 || v.list[0].log.some(l => l.k === 'sell'), 'القطيع سُيِّر أو بيع'); a.ok(v.list[0].trips.length >= 1, 'رحلة في الطريق'); await p.waitForTimeout(1700);
  // 4) الجدول والصلاحيات وظهور الاختيار فيها
  t = await sheet(p); a.ok(t.includes('جدول منتجات مزارعك') && t.includes('أسواق غير مكتشفة ضمن مداه'), 'الجدول وسطر غير المكتشفة'); a.ok(await p.locator('#dsheet table.chx-t tbody tr').count() >= 2); a.ok(/أسواق غير مكتشفة ضمن مداه: \d+/.test(t));
  const sellBtns = p.locator('#dsheet [data-act="chxrule"][data-k="sell"]'); a.equal(await sellBtns.count(), 3); await sellBtns.nth(0).scrollIntoViewIfNeeded(); await sellBtns.nth(0).click(); await p.waitForTimeout(250);
  a.equal(await p.locator('#dsheet [data-k="sell"].on[aria-pressed="true"]').count(), 1, 'عنصر واحد مظلَّل في مجموعة البيع'); a.equal(await p.locator('#dsheet [data-k="sell"].on').getAttribute('data-v'), 'exec'); a.ok((await p.locator('#dsheet [data-chx-sum="modes"]').innerText()).includes('البيع: ينفّذ ويُبلغ'));
  a.equal(await p.evaluate(() => __game.E.chiefOf(__game.S, 'sa').x.rules.sell), 'exec');
  const f0 = v.list[0].table.slice().sort((x, y) => y.heads - x.heads)[0]; await p.locator('#dsheet [data-k="minPct"][data-v="100"]').click(); await p.waitForTimeout(200);
  a.equal(await p.locator('#dsheet [data-k="minPct"].on[aria-pressed="true"]').count(), 1); const ref = await p.evaluate(g => __game.E.refPrice(__game.S.cities.riyadh, g), f0.g), sum = (await p.locator('#dsheet [data-chx-sum="minPct"]').innerText()).replace(/\s+/g, ' ');
  a.ok(sum.includes('100٪') && sum.includes(String(Math.round(ref)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')), 'ملخص أدنى سعر بالرقم: ' + sum); await p.locator('#dsheet [data-k="weekMax"][data-v="40"]').click(); await p.waitForTimeout(200);
  a.ok((await p.locator('#dsheet [data-chx-sum="weekMax"]').innerText()).includes('40٪') && (await p.locator('#dsheet [data-chx-sum="weekMax"]').innerText()).includes(String(Math.floor(f0.heads * 0.4))), 'ملخص weekMax بالرقم');
  await p.locator('#dsheet [data-k="butcher"][data-v="0"]').click(); await p.waitForTimeout(200); a.equal(await p.evaluate(() => __game.E.chiefOf(__game.S, 'sa').x.rules.butcher), false); a.equal(await p.locator('#dsheet [data-k="butcher"].on').getAttribute('data-v'), '0');
  a.equal(await wide(p), false, 'لا تمرير أفقي بعد الاختيارات');
  // 5) السجل والإلغاء
  t = await sheet(p); a.ok(t.includes('سجل أفعاله') && t.includes('ساق'), 'السجل يذكر السَّوق'); const cancel = p.locator('#dsheet [data-act="chxcancel"]'); a.ok(await cancel.count() >= 1, 'زر ألغِ وأعِد القطيع للرحلة التي لم تصل'); a.ok((await cancel.first().innerText()).includes('ألغِ وأعِد القطيع'));
  await p.evaluate(() => { __game.S.day += 1; }); const tr0 = (await view(p)).list[0].trips.length; await cancel.first().scrollIntoViewIfNeeded(); await cancel.first().click(); await p.waitForTimeout(300); v = await view(p);
  a.ok(v.list[0].trips.some(y => y.kind === 'back'), 'الإلغاء: القطيع يعود'); a.ok(v.list[0].log.some(l => l.k === 'cancel')); a.ok((await sheet(p)).includes('أُلغيت رحلة'));
  // 6) تجميد الكل
  const fz = p.locator('#dsheet [data-act="chxfreeze"]'); await fz.scrollIntoViewIfNeeded(); await fz.click(); await p.waitForTimeout(250); a.equal(await p.locator('#dsheet [data-act="chxfreeze"][aria-pressed="true"]').count(), 1, 'التجميد مظلَّل'); a.equal(await p.evaluate(() => __game.E.chiefOf(__game.S, 'sa').x.freeze), true); a.ok((await sheet(p)).includes('وما في الطريق يكمل'));
  await p.locator('#dsheet .dx').click(); await p.waitForTimeout(250); a.equal(await sheet(p), null, 'تُغلق');
  // 7) بطاقة «ما ينتظرك» في المكتب: نفسها بخياراتها
  await p.evaluate(() => { const E = __game.E, S = __game.S, x = E.chxOf(E.chiefOf(S, 'sa'), true); x.freeze = false; x.rules.sell = 'ask'; x.nx = S.day - 1; S.day += 4; E.chiefDay(S); x.nx = S.day + 999; __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'today'; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(400);
  const oc = p.locator('#screen .dask[data-dask^="chx:"]'); a.ok(await oc.count() >= 1, 'البطاقة المنتظرة في ما ينتظرك بمكتب اليوم'); a.ok((await oc.first().locator('.dopt').count()) >= 2, 'خيارات البطاقة'); a.equal(await wide(p), false, 'لا تمرير أفقي في المكتب');
  // 8) المطفأ: لا سطر ولا لوحة
  await p.evaluate(() => { __game.E.CHIEFX.on = false; __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(300); a.equal(await p.locator('#screen .hs .hs-row[data-dchip="hs:chx"]').count(), 0, 'مطفأ: لا سطر'); await p.evaluate(() => { __game.E.CHIEFX.on = true; });
  a.deepEqual(errors, [], 'لا أخطاء JS: ' + errors.join(' | ')); ok('كبير الرعاة (الواجهة) على 390'); await b.close(); console.log('PASS chief-x-ui');
})().catch(e => { console.error(e); process.exit(1); });
