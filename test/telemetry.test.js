// WP-05: قياس محلي مجهول وبإذن اللاعب: مطفأ افتراضياً، بلا شبكة، first_buy وfirst_profit وتصدير نصي: node test/telemetry.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright'), measure = require('./lib/first-profit.js');
const ok = m => console.log('OK   ' + m);
const openMenu = async g => { if (!(await g.locator('#hMenu').isVisible())) await g.locator('#topDrawer').click(); await g.locator('#hMenu').click(); }; // الشريط الديناميكي يخبّئ ⋯ داخل الدرج
// يمنع الشبكة ويسجّل أي محاولة: fetch وXMLHttpRequest وsendBeacon وWebSocket وEventSource
const NET = () => { window.__net = []; const rec = n => () => { window.__net.push(n); throw new Error('network blocked: ' + n); }; window.fetch = rec('fetch'); XMLHttpRequest.prototype.open = rec('xhr'); navigator.sendBeacon = rec('beacon'); window.WebSocket = rec('ws'); window.EventSource = rec('sse'); };
const NETSRC = '(' + NET.toString() + ')();';
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    // ١) مطفأ افتراضياً: جلسة كاملة حتى أول ربح بلا أي حدث ولا شبكة
    const off = await measure(b, 1, { init: NETSRC, keepOpen: true }); off.page.on('pageerror', e => errors.push(e.message));
    assert.equal(off.sold, true);
    assert.equal(await off.page.evaluate(() => localStorage.getItem('darb-tlog')), null, 'لا أحداث تُكتب بلا موافقة');
    assert.deepEqual(await off.page.evaluate(() => window.__net), [], 'لا شبكة أثناء جلسة كاملة');
    ok('مطفأ افتراضياً: لا سجل ولا شبكة في جلسة حتى أول ربح');
    await off.page.context().close();
    // ٢) مفعّل: first_buy وfirst_profit وscreen وmodal_open وlevel_up، والتصدير النصي من القائمة
    const on = await measure(b, 1, { init: NETSRC + "localStorage.setItem('darb-tlog-on', '1');", keepOpen: true });
    const g = on.page; g.on('pageerror', e => errors.push(e.message));
    assert.equal(on.sold && on.pl > 0, true);
    assert.deepEqual(await g.evaluate(() => window.__net), [], 'لا شبكة والسجل مفعّل');
    const log = await g.evaluate(() => JSON.parse(localStorage.getItem('darb-tlog')));
    const types = log.ev.map(e => e[1]);
    for (const t of ['open', 'first_buy', 'first_profit', 'modal_open', 'modal_close', 'screen', 'level_up']) assert.ok(types.includes(t), 'يظهر ' + t + ' (' + [...new Set(types)].join(',') + ')');
    assert.ok(types.indexOf('first_buy') < types.indexOf('first_profit'), 'الشراء قبل الربح');
    assert.equal(types.filter(t => t === 'first_buy').length, 1); assert.equal(types.filter(t => t === 'first_profit').length, 1);
    assert.ok(log.ev.length <= 500);
    assert.ok(!/نواف/.test(JSON.stringify(log)), 'لا اسم لاعب في السجل');
    ok('مفعّل: ' + [...new Set(types)].join(' ') + ' (' + log.ev.length + ' حدثاً)');
    // التصدير: من قائمة ⋯ نافذة بنص مقروء بأوقات بالدقائق
    await g.evaluate(() => { __game.go('home'); }); await g.waitForTimeout(100);
    await g.evaluate(() => document.querySelector('#lesson') && !document.querySelector('#lesson').hidden && (document.querySelector('#lesson [data-act=lclose],#lesson [data-act=lnext]') || {click() {}}).click());
    await openMenu(g); await g.locator('[data-act=tl-open]').click();
    assert.equal(await g.locator('#tlPanel').isVisible(), true);
    const txt = await g.locator('#tlText').inputValue();
    assert.match(txt, /تقرير تجربة/); assert.match(txt, /first_profit/); assert.match(txt, /\d+\.\dد ·/); assert.ok(!/نواف/.test(txt));
    ok('التقرير النصي: أوقات نسبية بالدقائق وبلا معرّف');
    // idle_gap بعد أكثر من ٦٠ ثانية بلا فعل
    await g.locator('[data-act=tl-close]').first().click();
    await g.clock.fastForward(70000); await g.mouse.click(5, 5);
    const gap = await g.evaluate(() => JSON.parse(localStorage.getItem('darb-tlog')).ev.filter(e => e[1] === 'idle_gap'));
    assert.ok(gap.length >= 1 && gap[0][2].sec >= 60, 'idle_gap مسجّل'); ok('idle_gap بعد ٧٠ ثانية بلا فعل (' + gap[0][2].sec + ' ث)');
    // الإيقاف والمسح
    await openMenu(g); await g.locator('[data-act=tl-open]').click();
    await g.locator('[data-act=tl-clear]').click(); assert.equal(await g.evaluate(() => localStorage.getItem('darb-tlog')), null);
    await g.locator('[data-act=tl-off]').click(); assert.equal(await g.evaluate(() => localStorage.getItem('darb-tlog-on')), null);
    await g.evaluate(() => __game.go('market')); await g.waitForTimeout(100); assert.equal(await g.evaluate(() => localStorage.getItem('darb-tlog')), null, 'بعد الإيقاف لا يُكتب شيء');
    ok('زرّا الإيقاف والمسح يعملان');
    assert.ok(await g.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
    await g.context().close();
    // ٣) لا شبكة في المصدر الجديد
    const src = fs.readFileSync(path.join(__dirname, '../src/ui/16b-telemetry.js'), 'utf8');
    assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'الملف لا يستعمل الشبكة');
    ok('المصدر بلا أي استعمال للشبكة');
    assert.deepEqual(errors, []); console.log('OK telemetry');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
