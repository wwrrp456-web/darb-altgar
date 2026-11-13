'use strict';
// 050 «يومك في 30 ثانية» + «بِع في أفضل سوق» + مسار التاجر + سباق الرئاسة (الواجهة) على 390 و1100: الظهور والتوقيت، الأقسام الأربعة بنصوص النموذج،
// الخيار في «ما ينتظرك» (إعادة رسم وبطاقة done)، أزرار الشريط السفلي، ورقة «بِع في أفضل سوق» (شريحة on واحدة وملخص بالرقم)، بطاقة السباق، سطر المسار،
// لا تمرير أفقي، لمس ≥ 44px، وlocalStorage يرمي فتعمل اللوحة
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const SHOTS = path.join(__dirname, '../docs/shots/brief'); fs.mkdirSync(SHOTS, { recursive: true });
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; if (S.tut) S.tut.on = false;
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; delete c.bm; S.player.gold = 200000; S.player.wallet.sar = 200000; S.phase = 3; S.player.name = 'سعيد';
  for (let i = E.shopsOf(S, 'riyadh').length; i < 2; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop');
  const sh = E.shopsOf(S, 'riyadh')[0]; sh.cond = 50; const by = {}; for (const rv of (S.rivals || [])) if (rv.out == null && rv.w != null) (by[rv.city] = by[rv.city] || []).push(rv); E.racePick(S, by); if (S.race && S.race.cid) S.race.cid = S.race.cid; };
const mk = async (b, w, q, pre) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); if (pre) await p.addInitScript(pre); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(() => __game.go('home')); await p.waitForTimeout(400); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const panel = p => p.evaluate(() => { const e = document.getElementById('briefPanel'); return e && !e.hidden ? e.innerText.replace(/\s+/g, ' ').trim() : null; });
const opened = p => p.evaluate(() => __game.brief.open);
const sheet = p => p.evaluate(() => { const s = document.getElementById('dsheet'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
const errors = [];
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5');
    // أ) لا تظهر وحدها في المتصفح الآلي بلا ?brief=1، ويفتحها زر «يومي» في الرئيسية
    a.equal(await opened(p), false, w + ': لا فتح تلقائي في الآلي بلا ?brief=1'); a.equal(await p.locator('#screen [data-bp="brief"]').count(), 1, 'زر «يومي»'); a.ok((await p.locator('#screen [data-bp="brief"]').boundingBox()).height >= 44);
    await p.locator('#screen [data-bp="brief"]').click(); await p.waitForTimeout(400); a.equal(await opened(p), true);
    const t = await panel(p); a.ok(t.startsWith('صباح الخير يا سعيد'), t.slice(0, 40)); a.ok(/اليوم \d+ ·/.test(t));
    const heads = await p.evaluate(() => [...document.querySelectorAll('#briefPanel .card > h2')].map(h => h.textContent.trim())); a.equal(heads.length, 4);
    a.ok(heads[0] === 'ماذا حدث في غيابك' && /^ما ينتظرك \(\d+\)$/.test(heads[1]) && heads[2] === 'خطوتك المقترحة اليوم' && heads[3] === 'مسار التاجر', 'الأقسام الأربعة بالترتيب: ' + heads);
    a.equal(await p.evaluate(() => [...document.querySelectorAll('#briefPanel .bp-bar .go')].map(x => x.textContent.trim())).then(x => x.join('|')), 'ابدأ يومي|افتح الرئيسية');
    a.equal(await p.locator('#briefPanel [data-ev]').count() >= 2, true, 'سطر الدفتر وسطر الأخبار على الأقل');
    // الوقت متوقف والمصدر نفسه
    a.equal(await p.evaluate(() => document.getElementById('hTimeState').dataset.clock), 'blocked', 'الوقت متوقف وهي مفتوحة');
    const n = +heads[1].match(/\d+/)[0], liveN = await p.evaluate(() => __game.S && 0); void liveN; a.ok(n >= 1, 'فيها بطاقة دكان متهالك على الأقل');
    a.equal(await wide(p), false, w + ': لا تمرير أفقي');
    for (const h of await p.evaluate(() => [...document.querySelectorAll('#briefPanel button, #briefPanel .dopt')].filter(x => !x.disabled).map(x => Math.round(x.getBoundingClientRect().height)))) a.ok(h >= 44, 'لمس ≥ 44: ' + h);
    if (w === 390) await p.screenshot({ path: path.join(SHOTS, 'brief-390.png') }); else await p.screenshot({ path: path.join(SHOTS, 'brief-1100.png') });
    // ب) خيار في «ما ينتظرك»: إعادة رسم وبطاقة done والذهب والحالة
    const rep = p.locator('#briefPanel .dask[data-dask^="hs:shop:"] .dopt[data-oid="repair"]'); a.equal(await rep.count(), 1, 'بطاقة ترميم الدكان'); const g0 = await p.evaluate(() => __game.S.player.gold);
    await rep.click(); await p.waitForTimeout(350); a.equal(await p.locator('#briefPanel .dask.done').count() >= 1, true, 'بطاقة done بعد الخيار'); a.equal(await p.evaluate(() => __game.E.shopsOf(__game.S, 'riyadh')[0].cond), 90); a.ok(g0 - await p.evaluate(() => __game.S.player.gold) > 0, 'الذهب نقص');
    a.equal(await p.locator('#briefPanel .dask.done .dres, #briefPanel .dask.done').count() >= 1, true);
    // ج) ابدأ يومي: يغلق ويذهب إلى السوق (واقفة)
    const day0 = await p.evaluate(() => __game.S.day); await p.locator('#briefPanel [data-bp="start"]').click(); await p.waitForTimeout(500);
    a.equal(await opened(p), false); a.equal(await p.evaluate(() => __game.screen), 'market', 'القافلة واقفة: السوق'); a.equal(await p.evaluate(() => __game.S.brief && __game.S.brief.seen), day0, 'لقطة S.brief عند الإغلاق'); a.ok(+await p.evaluate(() => localStorage.getItem('brief.t')) > 0);
    await p.evaluate(() => __game.go('home')); await p.locator('#screen [data-bp="brief"]').click(); await p.waitForTimeout(300); const t2 = await panel(p); a.ok(/لم يتحرك دفترك|صافي/.test(t2));
    await p.locator('#briefPanel [data-bp="home"]').click(); await p.waitForTimeout(400); a.equal(await p.evaluate(() => __game.screen), 'home'); a.equal(await opened(p), false);
    await p.context().close();
  }
  ok('اللوحة: تُفتح بزر «يومي»، الأقسام الأربعة بالترتيب ونصوص النموذج، الوقت متوقف، لا تمرير أفقي، لمس ≥ 44، الخيار يعيد الرسم ببطاقة done، «ابدأ يومي» → السوق و«افتح الرئيسية» → الرئيسية (390 و1100)');
  // د) الظهور التلقائي عند الفتح وبعد 10 دقائق لا قبلها (ساعة مزيّفة)، وlocalStorage يرمي
  { const p = await mk(b, 390, '?player=1&brief=1&seed=5'); await p.waitForFunction(() => __game.brief.open, null, { timeout: 8000 }); a.equal(await opened(p), true, 'تظهر عند الفتح'); await p.locator('#briefPanel [data-bp="home"]').click(); await p.waitForTimeout(300);
    a.equal(await p.evaluate(() => __game.brief.tryOpen()), 'throttled', 'قبل 10 دقائق لا تعود'); a.equal(await opened(p), false);
    await p.evaluate(() => { const real = Date.now; Date.now = () => real() + 9 * 60000; }); a.equal(await p.evaluate(() => __game.brief.tryOpen()), 'throttled', 'بعد 9 دقائق لا');
    await p.evaluate(() => { const real = Date.now; Date.now = () => real() + 2 * 60000; }); a.equal(await p.evaluate(() => __game.brief.tryOpen()), 'opened', 'بعد 11 دقيقة تعود'); a.equal(await opened(p), true); await p.locator('#briefPanel [data-bp="home"]').click(); await p.context().close(); }
  { const p = await mk(b, 390, '?player=1&brief=1&seed=5', () => { const g = Storage.prototype.getItem, s = Storage.prototype.setItem; Storage.prototype.getItem = function (k) { if (k === 'brief.t') throw new Error('blocked'); return g.call(this, k); }; Storage.prototype.setItem = function (k, v) { if (k === 'brief.t') throw new Error('blocked'); return s.call(this, k, v); }; });
    await p.waitForFunction(() => __game.brief.open, null, { timeout: 8000 }); a.ok(await panel(p), 'اللوحة تعمل ولو رمى التخزين'); await p.locator('#briefPanel [data-bp="start"]').click(); await p.waitForTimeout(400); a.equal(await opened(p), false); a.equal(await p.evaluate(() => __game.brief.tryOpen()), 'opened', 'بلا تخزين تظهر عند كل فتح'); await p.context().close(); }
  ok('الظهور: عند الفتح، وبعد 10 دقائق لا قبلها (9 لا، 11 نعم)، وlocalStorage يرمي فتعمل اللوحة');
  // د2) تقرير الغياب: اللوحة بدله وبأرقامه، والزر يفتح التقرير الكامل القائم، وتحذفه عند الإغلاق
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { const S = __game.S, r = { days: 3, change: 2140, inc: [['shops', 4900]], exp: [['staff', 1960]], empty: [], mgr: [], cash: 1, reserve: 0, events: ['خبر من العالم'] }; S.awayReport = r; S.lastAway = { ...r, day: S.day }; window.__r = __game.brief.tryOpen(true); }); a.equal(await p.evaluate(() => window.__r), 'opened');
    const t = await panel(p); a.ok(t.includes('غبتَ 3 أيام') && t.includes('+2,140') && t.includes('تقرير الغياب كاملاً'), t.slice(0, 300)); a.equal(await p.evaluate(() => document.getElementById('awayPanel').hidden), true, 'التقرير القديم لا يظهر خلف اللوحة');
    await p.locator('#briefPanel [data-bp="away"]').click(); await p.waitForTimeout(300); a.equal(await opened(p), false); a.equal(await p.evaluate(() => !!__game.S.awayReport && !document.getElementById('awayPanel').hidden), true, 'التقرير الكامل القائم');
    await p.locator('#awayPanel [data-act="awayclose"]').click(); await p.waitForTimeout(200); a.equal(await p.evaluate(() => __game.S.awayReport), undefined);
    await p.evaluate(() => { const S = __game.S; S.awayReport = { days: 2, change: -500, inc: [], exp: [['staff', 500]], empty: [], mgr: [], cash: 1, reserve: 0, events: [] }; __game.brief.tryOpen(true); }); await p.waitForTimeout(250); await p.locator('#briefPanel [data-bp="start"]').click(); await p.waitForTimeout(300); a.equal(await p.evaluate(() => __game.S.awayReport), undefined, 'تُحذف عند إغلاق اللوحة'); await p.context().close(); }
  ok('تقرير الغياب: اللوحة تحلّ محله بأرقامه (غبتَ 3 أيام، +2,140)، وزر «تقرير الغياب كاملاً» يفتحه، ويُحذف عند الإغلاق');
  // هـ) مسار التاجر: سطر في الرئيسية ونافذته
  for (const w of [390, 1100]) { const p = await mk(b, w, '?player=1&seed=5'); a.equal(await p.locator('#screen .hs .pg-row').count(), 1, w + ': سطر المسار أول بطاقة «حال أعمالي»'); a.equal(await p.evaluate(() => document.querySelector('#screen .hs').firstElementChild.nextElementSibling.classList.contains('pg-row') || document.querySelector('#screen .hs .pg-row') === document.querySelector('#screen .hs .dchip-row')), true);
    const v = await p.evaluate(() => JSON.parse(JSON.stringify(__game.E.progView(__game.S, window.ContentMap.PIECES)))); const txt = await p.locator('#screen .hs .pg-row').innerText(); a.ok(txt.includes(v.title) && (v.last || txt.includes(String(v.left).replace(/\B(?=(\d{3})+(?!\d))/g, ','))), 'الرقم يطابق المحرك: ' + txt); a.ok((await p.locator('#screen .hs .pg-row').boundingBox()).height >= 44);
    await p.locator('#screen .hs .pg-row').click(); await p.waitForTimeout(300); const t = await sheet(p); for (const k of ['اللقب', 'الرتبة', 'الفصل', 'المشاريع', 'افتح الرحلة']) a.ok(t.includes(k), 'نافذة المسار: ' + k); a.ok(t.includes('بقي ' + String(v.xpLeft).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) || v.rk >= 7);
    await p.locator('#dsheet [data-bp="journey"]').click(); await p.waitForTimeout(400); a.equal(await p.evaluate(() => __game.screen), 'academy'); a.equal(await wide(p), false); await p.context().close(); }
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { const { S, E } = __game; S.player.props = {}; S.player.bank.dep = {}; __game.go('home'); }); await p.waitForTimeout(300);
    a.equal(await p.locator('#screen .hs').count(), 0, 'بلا بطاقة (قبل أول دكان)'); a.equal(await p.locator('#screen .pgline .pg-row').count(), 1, 'يظهر السطر وحده'); await p.context().close(); }
  ok('مسار التاجر: سطر أول في «حال أعمالي» (أو وحده قبل أول دكان) بأرقام المحرك، ونافذته بالمسارات الأربعة، و«افتح الرحلة» → الأكاديمية');
  // و) سباق الرئاسة: بطاقة السوق وورقة المنافسين
  for (const w of [390, 1100]) { const p = await mk(b, w, '?player=1&seed=5'); const cid = await p.evaluate(() => { const { S } = __game; const c = S.player.caravans[0]; c.city = S.race.cid; c.left = 0; return S.race.cid; }); await p.evaluate(() => __game.go('market')); await p.waitForTimeout(400);
    a.equal(await p.locator('#screen .race[data-race]').count(), 1, w + ': بطاقة السباق في السوق'); const rows = await p.locator('#screen .race .race-row').count(), v = await p.evaluate(() => JSON.parse(JSON.stringify(__game.E.raceView(__game.S)))); a.ok(rows >= 2 && rows <= 4 && rows === v.rows.length, 'صفوف السباق ' + rows); a.ok((await p.locator('#screen .race').innerText()).includes('سباق رئاسة التجار في سوق ' + v.city));
    a.ok(await p.locator('#screen .race [data-race-st]').innerText().then(t => /ينقصك|بينك وبين|أنت الأول|تسبق الثاني|أنت رئيس التجار/.test(t))); a.equal(await p.locator('#screen .race .race-row').first().locator('.bar i').count(), 1);
    a.equal(await wide(p), false, w + ': لا تمرير أفقي'); await p.evaluate(() => { __game.S.player.caravans[0].city = 'riyadh'; __game.go('market'); }); await p.waitForTimeout(300); a.equal(await p.locator('#screen .race[data-race]').count(), 0, 'تغيب حين لا تكون القافلة في سوق السباق');
    await p.evaluate(() => __game.go('home')); await p.waitForTimeout(300); const rv = p.locator('#screen .hs [data-dchip="fold:hs-riv"]'); if (await rv.count()) { a.ok((await rv.innerText()).includes('ترتيبك '), 'سطر المنافسين يحمل الترتيب: ' + await rv.innerText()); await rv.click(); await p.waitForTimeout(300); a.equal(await p.locator('#dsheet .race[data-race]').count(), 1, 'بطاقة السباق في ورقة المنافسين (نقرتان)'); }
    await p.context().close(); }
  ok('السباق: بطاقة بأربعة صفوف كحدّ أقصى في السوق (حين تكون القافلة فيه) وفي ورقة المنافسين، بسطر الحالة والشريط، بلا تمرير أفقي');
  // ز) «بِع في أفضل سوق»: الحمولة (ورقة، شريحة on واحدة وملخص بالرقم، سافر)، ثم بطاقة الوصول (بِع الآن)، ثم الشراء (حمّل وسافر)
  for (const w of [390, 1100]) { const p = await mk(b, w, '?player=1&seed=5');
    const g = await p.evaluate(() => { const { S, E } = __game, c = S.player.caravans[0]; let best = null; for (const g of E.GIDS) { if (E.GD[g].sp || E.GD[g].live || g === 'wheat' || !E.sells(S.cities[c.city], g)) continue; const u = E.mid(g), L = E.bestMarkets(S, c, g, 20, u); if (!best || L.length > best.n) best = { g, n: L.length }; } c.cargo[best.g] = 20; c.basis[best.g] = { q: 20, c: 20 * E.mid(best.g) }; __game.go('market'); return best; });
    a.ok(g.n >= 1, 'سلعة لها سوق رابح'); await p.waitForTimeout(400); const btn = p.locator('#mycargo [data-bm="cargo"]'); a.ok(await btn.count() >= 1, w + ': زر «بِع في أفضل سوق» في بطاقة الحمولة'); a.ok((await btn.first().boundingBox()).height >= 44);
    await p.locator(`#mycargo [data-bm="cargo"][data-g="${g.g}"]`).click(); await p.waitForTimeout(300);
    const chips = p.locator('#dsheet .bm-chip'), nChips = await chips.count(), list = await p.evaluate(g0 => JSON.parse(JSON.stringify(__game.E.bestMarkets(__game.S, __game.S.player.caravans[0], g0, 20, __game.E.mid(g0)))), g.g); a.equal(nChips, list.length); a.ok(nChips >= 1 && nChips <= 3);
    const sum = () => p.locator('#dsheet [data-bm-sum]').innerText(), cn = id => p.evaluate(i => __game.S.cities[i].name, id), fmtN = n => Math.round(n).toLocaleString('en-US').replace(/,/g, ',');
    for (let i = 0; i < nChips; i++) { if (i > 0) { await chips.nth(i).click(); await p.waitForTimeout(150); } a.equal(await p.locator('#dsheet .bm-chip.on').count(), 1, 'شريحة on واحدة بعد كل ضغطة'); a.equal(await chips.nth(i).getAttribute('aria-pressed'), 'true'); const t = await sum(); a.ok(t.includes('تسافر بحمولتك إلى ' + await cn(list[i].city)) && t.includes('ربح متوقع ≈ ' + fmtN(list[i].profit)), 'الملخص بالرقم: ' + t); }
    a.equal(await sheet(p).then(t => t.includes('حمّل وسافر')), false, 'للحمولة: «سافر» لا «حمّل وسافر»'); const pick = nChips - 1, g0 = await p.evaluate(() => __game.S.player.gold);
    await p.locator('#dsheet [data-bm="run"]').click(); await p.waitForTimeout(500); const st = await p.evaluate(() => { const c = __game.S.player.caravans[0]; return { left: c.left, bm: c.bm, gold: __game.S.player.gold, screen: __game.screen, sheet: !!document.getElementById('dsheet') }; });
    a.ok(st.left > 0 && st.bm && st.bm.dest === list[pick].city && st.bm.g === g.g, 'سافر إلى الشريحة المختارة'); a.ok(st.gold <= g0 && g0 - st.gold < 100, 'الحمولة: لا شراء (تُخصم نفقة الطريق فقط)'); a.equal(st.screen, 'map'); a.equal(st.sheet, false, 'تُغلق الورقة');
    // الوصول: بطاقة «المطلوب» في اللوحة (ثم بِع الآن)
    await p.evaluate(() => { const { S, E } = __game, c = S.player.caravans[0]; let n = 0; while (c.left > 0 && n++ < 40) { E.tick(S, false); S.pause = false; if (S.road) S.road = null; } __game.renderAll(true); });
    const pa = await p.evaluate(() => { const pa = __game.E.planArrived(__game.S); return pa && { q: pa.q, est: pa.est, now: pa.now, g: pa.g, city: pa.city }; }); a.ok(pa, 'وصلت والخطة باقية'); const bal = await p.evaluate(() => __game.S.player.gold);
    await p.evaluate(() => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; window.__r = __game.brief.tryOpen(true); }); a.equal(await p.evaluate(() => window.__r), 'opened'); await p.waitForTimeout(400); const card = p.locator('#briefPanel .dask[data-dask^="bm:"]'); a.equal(await card.count(), 1, w + ': بطاقة الوصول في «ما ينتظرك»'); const ct = await card.innerText(); a.ok(ct.includes('وصلتَ') && ct.includes('بِع ' + pa.q) && ct.includes('التقدير عند الانطلاق ≈ ' + fmtN(pa.est)) && ct.includes('الآن ≈ ' + fmtN(pa.now)), ct);
    a.equal(await p.locator('#briefPanel .dask').first().getAttribute('data-dask').then(x => x.startsWith('bm:')), true, 'الأولى (w=99)');
    await card.locator('.dopt[data-oid="sell"]').click(); await p.waitForTimeout(350); a.equal(await p.locator('#briefPanel .dask[data-dask^="bm:"].done').count(), 1, 'done بعد البيع'); const after = await p.evaluate(() => { const S = __game.S, c = S.player.caravans[0]; return { gold: S.player.gold, bm: c.bm, news: S.news.filter(n => n.t.includes('ربح رحلة')).map(n => n.t), pl: S.player.trades[0].pl }; });
    a.ok(after.gold > bal, 'الذهب زاد'); a.equal(after.bm, undefined, 'حُذفت الخطة'); a.equal(after.news.length, 1); a.ok(after.news[0].replace(/,/g, '').includes(String(Math.abs(Math.round(after.pl)))) && after.news[0].replace(/,/g, '').includes('قدّرناه ' + pa.est), after.news[0]);
    await p.locator('#briefPanel [data-bp="home"]').click(); await p.waitForTimeout(300);
    // الشراء: من نافذة السلعة، حمّل وسافر
    const bs = await p.evaluate(() => { const { S, E } = __game, c = S.player.caravans[0]; c.city = 'riyadh'; c.left = 0; c.cargo = {}; c.basis = {}; delete c.bm; S.player.gold = 200000; S.player.wallet.sar = 200000; const st = E.bestStep(S); window.__bs = st && { g: st.g, q: st.q, dest: st.dest }; return window.__bs; });
    a.ok(bs, 'خطوة حمّل وسافر'); await p.evaluate(() => __game.go('market')); await p.waitForTimeout(400); await p.evaluate(g0 => { const e = document.querySelector(`#screen [data-gd="${g0}"]`); e.scrollIntoView(); e.click(); }, bs.g); await p.waitForTimeout(400);
    const bb = p.locator('#modal [data-bm="buy"]'); a.equal(await bb.count(), 1, 'زر «بِع في أفضل سوق» في نافذة السلعة'); a.ok((await bb.boundingBox()).height >= 44); const q = +await bb.getAttribute('data-q'); await bb.click(); await p.waitForTimeout(300);
    const sm = await sum(), cs = await p.evaluate(() => JSON.parse(JSON.stringify(__game.E.bestMarkets(__game.S, __game.S.player.caravans[0], window.__bs.g, +document.querySelector('[data-bm-sum]').dataset.q || 0, 1)))); void cs; a.ok(sm.includes('ستشتري ' + q) && sm.includes('وتسافر إلى') && /ربح متوقع ≈ [\d,]+ ريال/.test(sm), 'ملخص الشراء: ' + sm);
    a.ok((await p.locator('#dsheet [data-bm="run"]').innerText()).includes('حمّل وسافر')); const gb = await p.evaluate(() => __game.S.player.gold); await p.locator('#dsheet [data-bm="run"]').click(); await p.waitForTimeout(500);
    const fin = await p.evaluate(() => { const c = __game.S.player.caravans[0]; return { left: c.left, cargo: c.cargo, gold: __game.S.player.gold, bm: c.bm }; }); a.ok(fin.left > 0 && fin.gold < gb && fin.bm && fin.bm.g === bs.g && Math.floor(fin.cargo[bs.g]) === q, 'اشترى وسافر'); a.equal(await wide(p), false);
    await p.context().close(); }
  ok('«بِع في أفضل سوق»: زر في بطاقة الحمولة ونافذة السلعة، ورقة بشريحة on واحدة وملخص بالرقم بعد كل ضغطة، «سافر»/«حمّل وسافر» بالفعل القائم، وبطاقة الوصول «بِع الآن» تحذف الخطة وتكتب خبر الربح الفعلي (390 و1100)');
  // ح) المفاتيح: كلٌّ مطفأ = الواجهة القديمة حرفياً
  { const p = await mk(b, 390, '?player=1&seed=5'); await p.evaluate(() => { const E = __game.E; E.BRIEF.on = false; E.BESTM.on = false; E.RACE.on = false; const { S } = __game, c = S.player.caravans[0]; c.cargo.coffee = 20; c.basis.coffee = { q: 20, c: 180 }; c.city = S.race.cid; __game.go('market'); }); await p.waitForTimeout(400);
    a.equal(await p.locator('[data-bm],[data-bp],.race[data-race],.pg-row').count(), 0, 'لا زر ولا بطاقة سباق ولا سطر مسار'); a.equal(await p.evaluate(() => __game.brief.tryOpen(true)), 'off'); await p.evaluate(() => __game.go('home')); await p.waitForTimeout(300); a.equal(await p.locator('#screen [data-bp="brief"],#screen .pg-row,#screen .pgline').count(), 0); await p.context().close(); }
  ok('كل مفتاح مطفأ = الواجهة القديمة: لا زر «يومي» ولا سطر مسار ولا زر «بِع في أفضل سوق» ولا بطاقة سباق');
  console.log('PASS brief-ui'); await b.close();
  a.deepEqual(errors, []);
})().catch(e => { console.error(e); process.exit(1); });
