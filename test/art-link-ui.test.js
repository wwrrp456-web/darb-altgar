'use strict';
// 037هـ ربط الرسم المرسوم بالشاشات (390 و1100): أيقونات 037 الجديدة، تبويبات المكتب والأعمال، شخصيات الأدوار والمنافسين،
// أيقونة المشروع، إطار الشخصية في الشريط العلوي؛ بلا طلبات فاشلة ولا أخطاء JS ولا تمرير أفقي.
// ARTLINK_SHOTS=before|after + ARTLINK_INDEX=<index.html> يلتقط لقطات 390 فقط (قبل/بعد) بلا تحقق.
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/art-link'), MODE = process.env.ARTLINK_SHOTS || '';
const INDEX = process.env.ARTLINK_INDEX || path.join(__dirname, '../index.html');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw;
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 5000000; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.climate.pending = []; };
const large = () => { const g = __game, S = g.S, A = g.E.A;
  for (const city of ['riyadh', 'jeddah']) { A.buildShop(S, city); A.buildShop(S, city); A.buildWarehouse(S, city); for (const w of S.player.props[city].staff) { w.days = 120; w.free = 0; } }
  for (let i = 0; i < 30; i++) g.E.tick(S, false);
  for (const city of ['riyadh', 'jeddah']) { const pr = S.player.props[city]; A.promoteWorker(S, city, pr.staff.find(w => w.role === 'seller').id, 'shop', pr.shops[0].id); }
  for (let i = 0; i < 90; i++) g.E.tick(S, false);
  for (const city of ['riyadh', 'jeddah']) { A.auditCity(S, city); A.promoteSteward(S, city); }
  S.phase = 4; S.player.wallet.sar = 5000000; A.hireAgent(S, 'sa'); S.player.wallet.sar = 100000; };
const fleet = () => { const g = __game, S = g.S, A = g.E.A; S.player.seaTrips = 1; A.buyShip(S, 'jeddah', 'dhow'); for (let i = 0; i < 3; i++) { A.hireCaptain(S); const c = S.player.caravans.at(-1); c.captain.role = 'loyal'; c.captain.home = 'sa'; c.route = null; c.free = false; } S.player.wallet.sar = 5000000; };
const born = () => { const g = __game, S = g.S; g.E.RIVALW.on = false; S.day = 119; for (let i = 0; i < 3; i++) { g.E.tick(S, false); S.pause = false; } };
const STATE = () => { const { S, E } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; for (const id of S.order) for (const g in E.HOARD_GOODS) { const c0 = S.cities[id]; c0.stock[g] = Math.max(c0.stock[g], (c0.dem[g] || 1) * 60); }
  const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; S.player.gold = 200000; S.player.wallet.sar = 200000; S.phase = 3;
  for (let i = E.shopsOf(S, 'riyadh').length; i < 3; i++) if (!E.A.buildShop(S, 'riyadh').ok) throw Error('shop'); E.A.buildWarehouse(S, 'riyadh');
  const c2 = S.cities.riyadh, gs = E.GIDS.filter(g => E.sells(c2, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 3); for (const s of E.shopsOf(S, 'riyadh')) for (const g of gs) E.A.shopSetItem(S, 'riyadh', s.id, g, E.SHOP_PRICE0, true); E.A.hireFill(S, 'riyadh');
  S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; S.player.fixedEma = 500; S.player.led.inc.shops = 41200; S.player.led.exp.staff = 28720; S.player.led.exp.upkeep = 6400; };
const HIRE = () => { const { S, E } = __game; S.player.diwan = { since: S.day, box: 0, rules: E.diwanDefaults(), ask: [], log: [], cool: {}, said: {}, fillDay: {}, idle: {}, late: 0, paid: 0, covered: 0 }; };
// أيقونة كاملة التحميل؟ (data: أو ملف خارجي)
const loaded = async (p, sel) => { await p.evaluate(s => document.querySelectorAll(s).forEach(i => i.scrollIntoView({ block: 'center' })), sel); await p.waitForFunction(s => [...document.querySelectorAll(s)].every(i => i.complete), sel, { timeout: 4000 }).catch(() => {}); return p.evaluate(s => { const im = [...document.querySelectorAll(s)]; return im.length > 0 && im.every(i => i.complete && i.naturalWidth > 0); }, sel); };
(async () => {
  const b = await chromium.launch(), errors = [], failed = [];
  const shoot = MODE === 'before' || MODE === 'after';
  const ok = (c, m) => { if (shoot) return; a(c, m); };
  const open = async (w, q, setups, screen, extra) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(w + ': ' + e.message)); p.on('requestfailed', r => failed.push(r.url().slice(-80))); p.on('dialog', d => d.accept());
    if (extra) await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw);
    await p.goto('file://' + INDEX + q); await p.waitForFunction(() => !!window.__game);
    if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
    if (!extra) await p.evaluate(base);
    for (const s of setups) await p.evaluate(s);
    await p.evaluate(s => { const g = __game; Object.assign(g.ui.fold || (g.ui.fold = {}), { 'of-diwan': 1, 'of-cchief': 1, 'of-portm': 1, 'of-rivals': 1 }); g.go(s); g.renderAll(true); }, screen); await p.waitForTimeout(500); return p;
  };
  const shot = async (p, w, sel, name) => { if (!shoot || w !== 390) return; await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed' && /عمّ سالم/.test(el.textContent) && el.textContent.length < 400) el.style.display = 'none'; }); const l = p.locator(sel).first(); if (await l.count()) await l.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await p.screenshot({ path: path.join(SHOTS, MODE + '-' + name + '.png') }); };
  const noX = async p => ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'تمرير أفقي');

  for (const w of [390, 1100]) {
    // 1) سجل الأيقونات: كل اسم «جديد» يشير إلى icons/<name>
    { const p = await open(w, '?learn=1&seed=21&fold=1', [], 'home');
      const r = await p.evaluate(() => { const N = GameIcons.named, out = []; for (const k in N) if (N[k].isNew) out.push({ k, has: !!ART['icons/' + k], same: GameIcons.nameUrl(k) === ART['icons/' + k] }); return out; });
      ok(r.length === 21, w + ': 21 اسماً جديداً (' + r.length + ')'); ok(r.every(x => x.has && x.same), w + ': nameUrl يشير إلى icons/ لا إلى البديل ' + r.filter(x => !x.has || !x.same).map(x => x.k));
      await shot(p, w, '#screen', 'home'); await noX(p); await p.context().close(); }
    // 2) تبويبات المكتب والأعمال
    { const p = await open(w, '?learn=1&seed=21', [large], 'office');
      ok(await p.locator('.ptabs .ptab').count() === 4, w + ': أربع تبويبات مكتب');
      const o = await p.evaluate(() => [...document.querySelectorAll('.ptabs .ptab img.pti')].map(i => i.getAttribute('src') === ART[['icons/office-tab-today', 'icons/office-tab-goals', 'icons/office-tab-mgmt', 'icons/office-tab-money'][[...document.querySelectorAll('.ptabs .ptab img.pti')].indexOf(i)]]));
      ok(o.length === 4 && o.every(Boolean), w + ': أيقونات المكتب الجديدة ' + o); ok(await loaded(p, '.ptabs .ptab img.pti'), w + ': أيقونات المكتب تكتمل');
      await shot(p, w, '.ptabs', 'office'); await noX(p); await p.evaluate(() => { __game.go('empire'); __game.renderAll(true); }); await p.waitForTimeout(400);
      const e = await p.evaluate(() => [...document.querySelectorAll('.ptabs .ptab img.pti')].map((i, n) => i.getAttribute('src') === ART[['icons/biz-tab-caravan', 'icons/biz-tab-factory', 'icons/biz-tab-bank'][n]]));
      ok(e.length === 3 && e.every(Boolean), w + ': أيقونات الأعمال الجديدة ' + e); ok(await loaded(p, '.ptabs .ptab img.pti'), w + ': أيقونات الأعمال تكتمل');
      await shot(p, w, '.ptabs', 'biz'); await noX(p); await p.context().close(); }
    // 3) الديوان وشيخ القوافل والشهبندر (بطاقات التوظيف)
    for (const [key, setup, hire, name] of [['diwan-nazir', large, 'diwan', 'diwan'], ['caravan-chief', fleet, 'cchief', 'cchief'], ['port-master', fleet, 'portm', 'portm']]) {
      const p = await open(w, '?learn=1&seed=21&fold=1', [setup, () => { __game.OFFICETABS.on = false; }], 'office');
      const sel = '.card.' + hire + ' img.rolepic[data-art="characters/' + key + '"]';
      ok(await p.locator(sel).count() >= 1, w + ': صورة ' + key); ok(await loaded(p, sel), w + ': صورة ' + key + ' تكتمل');
      const bb = shoot ? null : await p.locator(sel).first().boundingBox(); ok(bb && bb.width <= 80 && bb.width >= 56, w + ': مقاس ' + key + ' ' + (bb && bb.width));
      await shot(p, w, '.card.' + hire, name); await noX(p); await p.context().close(); }
    // 4) المنافسون بحسب المجال
    { const p = await open(w, '?learn=1&seed=21&fold=1', [born, () => { __game.OFFICETABS.on = false; }], 'office');
      const r = await p.evaluate(() => { const K = { live: 'livestock', food: 'food', goods: 'goods', sea: 'sea' }; return __game.S.rivals.map(v => { const row = document.querySelector('[data-rival="' + v.id + '"] img.rolepic'); return { want: 'characters/rival-generic-' + K[v.dom], got: row && row.dataset.art, done: !!row && row.complete && row.naturalWidth > 0 }; }); });
      ok(r.length >= 1 && r.every(x => x.want === x.got && x.done), w + ': صورة المنافس بحسب مجاله ' + JSON.stringify(r));
      await shot(p, w, '.rival-row', 'rivals'); await noX(p); await p.context().close(); }
    // 5) أيقونة المشروع
    { const p = await open(w, '?learn=1&seed=37&sched=0', [() => { const { S, E } = __game; for (let i = 0; i < 3; i++) { E.tick(S, false); S.pause = false; } S.player.gold = 300000; }], 'office');
      await p.evaluate(() => { const { S, E } = __game; S.player.gold = 300000; for (let i = 0; i < 3; i++) { E.tick(S, false); S.pause = false; } __game.renderAll(true); }); await p.waitForTimeout(300);
      ok(await p.locator('.pjcard img.pjic').count() >= 1, w + ': أيقونة في بطاقة مشروع'); ok(await loaded(p, '.pjcard img.pjic'), w + ': أيقونة المشروع تكتمل');
      await shot(p, w, '.pjcard', 'projects'); await noX(p); await p.context().close(); }
    // 6) إطار الشخصية + مجلس الناظر
    { const p = await open(w, '?learn=1&seed=21&fold=1', [], 'home');
      ok(await p.locator('#tbAv img.aframe').count() === 1, w + ': إطار الشخصية'); ok(await loaded(p, '#tbAv img.aframe'), w + ': الإطار يكتمل');
      await shot(p, w, '#top', 'topbar'); await noX(p); await p.context().close(); }
    { const p = await open(w, '?player=1&seed=5', [STATE, HIRE, () => { __game.ui.ix = { shop: 1, warehouse: 1, storage: 1, farm: 1 }; }], 'home', true);
      if (await p.locator('#screen .hs .hs-council').count()) { await p.locator('#screen .hs .hs-council').click(); await p.waitForTimeout(500);
        ok(await p.locator('#dsheet .dl-council img.rolepic[data-art="characters/diwan-nazir"]').count() === 1, w + ': صورة الناظر في المجلس'); ok(await loaded(p, '#dsheet .dl-council img.rolepic'), w + ': صورة المجلس تكتمل');
        await shot(p, w, '#dsheet', 'council'); await noX(p); } else ok(false, w + ': زر المجلس غير ظاهر');
      await p.context().close(); }
  }
  ok(!errors.length, 'أخطاء JS: ' + errors.join('|')); ok(!failed.length, 'طلبات فاشلة: ' + failed.join('|'));
  await b.close(); console.log(shoot ? 'لقطات ' + MODE : 'art-link-ui: كلها نجحت');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
