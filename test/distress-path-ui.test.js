// WP-12: مسار «ضاق بي الحال»: بطاقة واحدة بخطوات مرتبة لا يُعرض فيها ما ليس متاحاً: node test/distress-path-ui.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw;
const BASE = 'file://' + path.join(__dirname, '../index.html'), SHOTS = process.env.SHOTS || '', ok = m => console.log('OK   ' + m);
const PREP = () => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; const c = S.player.caravans[0]; c.left = 0; c.city = 'riyadh'; S.phase = 3; S.player.props = {}; S.player.factories = []; S.player.vault = 0; S.player.bank.loans = []; S.player.bank.dep = {}; S.player.bank.bonds = []; Object.keys(c.cargo).forEach(k => c.cargo[k] = 0); c.herd = {}; const w = S.player.wallet; Object.keys(w).forEach(k => w[k] = 0); };
const steps = p => p.evaluate(() => [...document.querySelectorAll('.distress-card li[data-step]')].map(l => l.dataset.step));
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    const mk = async name => { const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('pageerror', e => errors.push(e.message)); await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + '?player=1&seed=5'); await p.waitForFunction(() => !!window.__game); if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); } await p.evaluate(PREP); return p; };
    const shot = async (p, n) => { if (SHOTS) { await p.evaluate(() => __game.go('home')); await p.waitForTimeout(400); await p.locator('.distress-card').screenshot({ path: path.join(SHOTS, n + '.png') }); } };
    // ١) نقد صفر مع بضاعة: الخطوة الأولى بيعها، ولا حصّالة ولا أصل
    let p = await mk(); await p.evaluate(() => { const c = __game.S.player.caravans[0]; c.cargo.wheat = 20; __game.go('home'); }); await p.waitForTimeout(400);
    let s = await steps(p); assert.equal(s[0], 'goods', s.join()); assert.ok(!s.includes('vault') && !s.includes('asset'), s.join()); ok('نقد صفر مع بضاعة: الأولى «بِع بضاعتك» (' + s.join(' ← ') + ')'); await shot(p, '1-goods');
    await p.locator('.distress-card [data-step=goods] [data-go=market]').click(); await p.waitForTimeout(300); assert.equal(await p.evaluate(() => location.hash), '#market'); ok('زر الخطوة يفتح السوق'); await p.context().close();
    // ٢) أصول فقط (بلا بضاعة ولا حصّالة، والقرض غير متاح لقلة المستوى): الخطوة الأولى بيع أصل
    p = await mk(); await p.evaluate(() => { const S = __game.S; S.learn.level = 2; S.player.props.riyadh = { shops: [{ id: 1, kind: 'own' }], whs: 1, farm: null, butcher: null, staff: [], mgr: null, ins: null, store: {} }; __game.go('home'); }); await p.waitForTimeout(400);
    s = await steps(p); assert.equal(s[0], 'asset', s.join()); assert.ok(!s.includes('goods') && !s.includes('vault') && !s.includes('qard'), s.join()); ok('أصول فقط: الأولى «بِع أصلاً» (' + s.join(' ← ') + ')'); await shot(p, '2-assets'); await p.context().close();
    // ٣) حصّالة: الأولى سحبها
    p = await mk(); await p.evaluate(() => { __game.S.player.vault = 800; __game.go('home'); }); await p.waitForTimeout(400);
    s = await steps(p); assert.equal(s[0], 'vault', s.join()); assert.ok(!s.includes('goods') && !s.includes('asset'), s.join()); ok('حصّالة: الأولى «اسحب من حصّالتك» (' + s.join(' ← ') + ')'); await shot(p, '3-vault');
    await p.locator('.distress-card [data-step=vault] [data-act=vault-open]').click(); await p.waitForTimeout(500); await p.context().close();
    // ٤) لا ضيق مع نقد معقول وبضاعة: لا بطاقة
    p = await mk(); await p.evaluate(() => { const S = __game.S; S.player.caravans[0].cargo.wheat = 20; S.player.wallet.sar = 400; __game.go('home'); }); await p.waitForTimeout(400); assert.equal(await p.locator('.distress-card').count(), 0); ok('نقد معقول وبضاعة: لا بطاقة'); await p.context().close();
    assert.deepEqual(errors, [], 'أخطاء JS'); ok('بلا أخطاء JS'); console.log('OK distress-path-ui');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})();
