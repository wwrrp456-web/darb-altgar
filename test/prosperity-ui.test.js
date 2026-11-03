'use strict';
// 016: بطاقة ازدهار المدينة في «الدول والمدن» على 390px: مدينة مزدهرة بمشاريعك ومدينة مهملة، بلا تمرير أفقي، ومفتاح الرجوع يخفيها
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = path.join(__dirname, '../docs/shots/prosperity'); fs.mkdirSync(OUT, { recursive: true }); const ok = m => console.log('OK   ' + m);
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37&sched=0'); await p.waitForFunction(() => !!window.__game);
    await p.evaluate(() => { const g = __game, { S, E } = g; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.noLock = 1; S.player.famDebt = null; S.phase = 3; S.player.gold = 2e6; Object.assign(S.learn, { welcome: 99, datePend: false, zseen: true }); for (const q of ['stageUp', 'up', 'sq', 'tq', 'cq', 'fq', 'bq', 'csq', 'eq', 'rq']) S.learn[q] = [];
      // مزدهرة: ثلاثة دكاكين ومشروع السوق المسقوف مُتمّ؛ مهملة: حائل بلا نشاط منذ 200 يوم
      for (let i = 0; i < 3; i++) E.A.buildShop(S, 'riyadh'); S.projects = { peak: 1e7, paid: { P04: 3, P01: 4 }, until: {}, pick: { P04: 'riyadh', P01: 'riyadh|hail' }, done: ['P04', 'P01'], tier: 3 };
      E.prosEnsure(S, 'riyadh'); E.prosEnsure(S, 'hail'); const r = S.cities.riyadh.pros, h = S.cities.hail.pros; for (let i = 0; i < 18; i++) { S.day += 30; r.last = S.day; E.prosMonth(S, 'riyadh', E.projectContrib(S).riyadh); }
      h.last = S.day - 200; for (const k of E.PR_KEYS) h[k] = h.b[k] + 6; g.setSpeed(0); document.querySelectorAll('#splash').forEach(e => e.remove()); g.go('cities'); g.renderAll(true); });
    await p.waitForTimeout(300);
    const clean = async () => p.evaluate(() => { __game.setSpeed(0); const m = document.getElementById('modal'); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ''; } const l = document.getElementById('lesson'); if (l) l.remove(); document.querySelectorAll('#splash,#spot,#spotArrow').forEach(e => e.remove()); });
    const noScroll = async w => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, w + ': لا تمرير أفقي');
    await p.evaluate(() => { document.querySelectorAll('.pros').forEach(d => d.open = true); document.querySelectorAll('.cfold').forEach(d => d.open = true); }); await clean(); await p.waitForTimeout(150);
    const cards = p.locator('.pros'); assert.ok(await cards.count() >= 6, 'بطاقة ازدهار في كل مدينة'); const t = await p.locator('.citycard', { hasText: 'الرياض' }).first().locator('.pros').innerText();
    for (const w of ['التجارة', 'العمران', 'العلم', 'الأدب', 'الصحة', 'الأمن', 'منك', 'من مشاريعك الكبرى +8 دائمة', 'طلب سلعك ×']) assert.ok(t.includes(w), 'الرياض: ' + w + ' | ' + t.replace(/\n/g, ' ').slice(0, 400)); await noScroll('الدول والمدن');
    const tr = await p.locator('.citycard', { hasText: 'حائل' }).first().locator('.pros').innerText(); assert.ok(/لم تزر المدينة ولم تعمل فيها منذ/.test(tr), 'تنبيه الإهمال في حائل'); const hd = await p.locator('.citycard', { hasText: 'حائل' }).first().locator('[data-dim=trade]').innerText(); assert.ok(!hd.includes('من مشاريعك الكبرى'), 'حائل: لا مشروع في بعد التجارة'); const hs = await p.locator('.citycard', { hasText: 'حائل' }).first().locator('[data-dim=sec]').innerText(); assert.ok(hs.includes('من مشاريعك الكبرى +8'), 'حائل: خان الطريق يرفع أمنها');
    const shot = async (name, txt) => { const el = p.locator('.citycard', { hasText: txt }).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(100); await clean(); await el.screenshot({ path: path.join(OUT, name) }); };
    await shot('prosperous-390.png', 'الرياض'); await shot('neglected-390.png', 'حائل');
    await p.evaluate(() => { __game.E.PROSPER.on = false; __game.renderAll(true); }); await p.waitForTimeout(200); assert.equal(await p.locator('.pros').count(), 0, 'مطفأ: لا بطاقة');
    assert.deepEqual(errors, []); ok('بطاقة ازدهار المدينة على 390: مزدهرة ومهملة، أبعاد ستة ونصيب ومشاريع، بلا تمرير أفقي، ومفتاح الرجوع يخفيها'); console.log('\nprosperity-ui: كلها ناجحة');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
