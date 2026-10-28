// WP-11: تراجع ١٠ ثوانٍ عن آخر صفقة، وتأكيد الصفقة الكبيرة أو الخاسرة: node test/undo-trade-ui.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw;
const W = 'wheat', BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const STATE = () => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; Object.keys(c.cargo).forEach(k => c.cargo[k] = 0); Object.keys(c.basis || {}).forEach(k => c.basis[k] = 0); S.player.gold = 200000; S.phase = 3; if (!S.player.trades.some(t => t.side === 'sell' && t.pl > 0)) S.player.trades.push({ side: 'sell', pl: 1, g: W, n: 1, day: S.day }); };
const page = async b => { const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + '?player=1&seed=5'); await p.waitForFunction(() => !!window.__game); await p.evaluate(STATE); if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); } await p.evaluate(() => __game.go('market')); await p.waitForTimeout(400); return p; };
const fire = (p, act, g, q) => p.evaluate(([a, g, q]) => { document.querySelectorAll('.__t').forEach(e => e.remove()); document.body.insertAdjacentHTML('beforeend', '<button class="__t" data-act="' + a + '" data-g="' + g + '" data-q="' + q + '"></button>'); document.querySelector('.__t').click(); }, [act, g, q]);
const snap = p => p.evaluate(() => { const { S, E } = __game, m = S.player.caravans[0]; return { gold: S.player.gold, cargo: JSON.stringify(m.cargo), stock: JSON.stringify(S.cities[m.city].stock), basis: JSON.stringify(m.basis), trades: S.player.trades.length, all: E.save(S) }; });
const rc = p => p.evaluate(() => { const e = document.getElementById('rcpt'); return e && !e.hidden ? e.innerText : ''; });
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    let p = await page(b); p.on('pageerror', e => errors.push(e.message));
    // ١) شراء صغير ثم تراجع: الحالة كلها كما كانت بالضبط
    const s0 = await snap(p); await fire(p, 'buy', W, 3); await p.waitForTimeout(300);
    const s1 = await snap(p); assert.ok(s1.gold < s0.gold && s1.trades > s0.trades || s1.cargo !== s0.cargo, 'الشراء لم ينفّذ');
    assert.equal(await p.locator('#rcpt [data-act=tradeundo]').count(), 1, 'زر التراجع غير موجود'); ok('إيصال الشراء فيه زر «تراجع»');
    assert.ok(!/تأكيد/.test(await rc(p)), 'صفقة صغيرة لا تحتاج تأكيداً');
    await p.locator('#rcpt [data-act=tradeundo]').click(); await p.waitForTimeout(300);
    const s2 = await snap(p); assert.equal(s2.gold, s0.gold); assert.equal(s2.cargo, s0.cargo); assert.equal(s2.stock, s0.stock); assert.equal(s2.basis, s0.basis); assert.equal(s2.trades, s0.trades); assert.equal(s2.all, s0.all, 'الحالة الكاملة تختلف');
    ok('التراجع يعيد المال والبضاعة ومخزون المدينة والحالة كلها بالضبط');
    assert.equal(await p.evaluate(() => localStorage.getItem('darb-v3') === __game.E.save(__game.S)), true, 'الحفظ لا يطابق الحالة بعد التراجع'); ok('الحفظ يطابق الحالة بعد التراجع');
    // ٢) البيع: تراجع ثم لا زر بعده
    await fire(p, 'buy', W, 5); await p.waitForTimeout(250); const sb = await snap(p); await fire(p, 'sell', W, 2); await p.waitForTimeout(300); if (/تأكيد/.test(await rc(p))) { await p.locator('#rcpt [data-act=tradego]').click(); await p.waitForTimeout(300); }
    assert.equal(await p.locator('#rcpt [data-act=tradeundo]').count(), 1); await p.locator('#rcpt [data-act=tradeundo]').click(); await p.waitForTimeout(250);
    assert.equal((await snap(p)).all, sb.all, 'تراجع البيع لا يعيد الحالة'); ok('التراجع عن البيع يعيد الحالة');
    // ٣) لا تراجع بعد فعل آخر ولا بعد مرور اليوم
    await fire(p, 'buy', W, 1); await p.waitForTimeout(250); await fire(p, 'buy', W, 1); await p.waitForTimeout(250);
    const sc = await snap(p); await p.evaluate(() => { __game.S.day += 1; }); await p.locator('#rcpt [data-act=tradeundo]').click(); await p.waitForTimeout(250);
    assert.equal((await snap(p)).gold, sc.gold, 'التراجع عمل بعد مرور اليوم'); assert.equal((await snap(p)).cargo, sc.cargo); ok('لا تراجع بعد مرور اليوم');
    // ٤) انقضاء ١٠ ثوانٍ
    await fire(p, 'buy', W, 1); await p.waitForTimeout(10600);
    assert.equal(await p.locator('#rcpt [data-act=tradeundo]').count(), 0, 'الزر بقي بعد ١٠ ثوانٍ'); ok('الزر يزول بعد ١٠ ثوانٍ');
    // ٥) تأكيد الشراء الكبير
    await p.evaluate(W => { const c = __game.S.player.caravans[0]; Object.keys(c.cargo).forEach(k => c.cargo[k] = 0); __game.S.cities[c.city].stock[W] = 500; const w = __game.S.player.wallet; Object.keys(w).forEach(k => w[k] = 0); w.sar = 600; }, W); const sg = await snap(p); 
    await fire(p, 'buy', W, 10); await p.waitForTimeout(300);
    const t1 = await rc(p); assert.ok(/تأكيد الشراء/.test(t1) && /%/.test(t1), 'لا تأكيد للصفقة الكبيرة: ' + t1); assert.equal((await snap(p)).gold, sg.gold, 'نُفّذ قبل التأكيد');
    await p.locator('#rcpt [data-act=rcptclose]').click(); await p.waitForTimeout(200); assert.equal((await snap(p)).gold, sg.gold, 'الإلغاء نفّذ الصفقة'); ok('التأكيد قبل الشراء الكبير والإلغاء لا ينفّذ');
    await fire(p, 'buy', W, 10); await p.waitForTimeout(300); await p.locator('#rcpt [data-act=tradego]').click(); await p.waitForTimeout(300);;
    const gnow = (await snap(p)).gold; assert.ok(gnow < sg.gold, gnow + '/' + sg.gold + ' ' + 'التأكيد لم ينفّذ ' + await p.evaluate(() => (document.getElementById('toast')||{}).innerText + '|' + document.getElementById('rcpt').innerText + '|' + __game.S.player.gold + '|' + JSON.stringify(__game.S.player.caravans[0].cargo))); assert.equal(await p.locator('#rcpt [data-act=tradeundo]').count(), 1); ok('«نعم، نفّذ» ينفّذ ويعرض إيصالاً قابلاً للتراجع');
    // ٦) تأكيد البيع بخسارة
    await p.evaluate(() => { const { S, E } = __game, m = S.player.caravans[0]; const w = S.player.wallet; Object.keys(w).forEach(k => w[k] = 0); w.sar = 200000; m.cargo.wheat = 10; m.basis.wheat = { q: 10, c: 100000 }; });
    const sl = await snap(p); await fire(p, 'sell', W, 5); await p.waitForTimeout(300);
    assert.ok(/تأكيد البيع بخسارة/.test(await rc(p))); assert.equal((await snap(p)).gold, sl.gold); ok('البيع بخسارة يطلب تأكيداً بالأرقام');
    await p.context().close();
    assert.deepEqual(errors, [], 'أخطاء JS'); ok('بلا أخطاء JS');
    console.log('OK undo-trade-ui');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})();
