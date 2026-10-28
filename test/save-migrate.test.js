// WP-03: لا مسح صامت لحفظ تعذّرت قراءته، وإطار الترحيلات، وقياس التخزين: node test/save-migrate.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const E = require('../src/engine.js');
const NEUTRAL = 'file://' + path.join(__dirname, 'map.json'); // صفحة بلا لعبة: تكتب فيها المفاتيح دون أن يعيد pagehide كتابة الحفظ
const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37';
const ok = m => console.log('OK   ' + m);
/* ---- المحرك (Node) ---- */
{
  const good = E.save(E.newGame(5));
  assert.equal(E.loadChecked(good).ok, true); ok('حفظ سليم يُفتح');
  assert.equal(E.loadChecked(good.slice(0, good.length >> 1)).ok, false); ok('JSON مبتور يُرفض');
  const unk = JSON.parse(good); unk.ver = 99; assert.equal(E.loadChecked(JSON.stringify(unk)).ok, false); ok('إصدار غير معروف يُرفض');
  const nop = JSON.parse(good); delete nop.cities; assert.equal(E.loadChecked(JSON.stringify(nop)).ok, false); ok('غياب cities يُرفض');
  const nod = JSON.parse(good); delete nod.day; assert.equal(E.loadChecked(JSON.stringify(nod)).ok, false); ok('غياب day يُرفض');
  assert.equal(E.loadChecked('null').ok, false); ok('null يُرفض');
  const retired = JSON.parse(good); retired.player.caravans = []; assert.equal(E.loadChecked(JSON.stringify(retired)).ok, true); ok('حفظ بلا قوافل (لاعب متقاعد) لا يُرفض عند الفتح');
  assert.ok(Array.isArray(E.MIGRATIONS) && E.MIGRATIONS.some(m => m.from === 2 && m.to === 3)); ok('سجل الترحيلات فيه v2→v3');
  // v2: لا يوجد في تاريخ المستودع التزام بمحرك v2، فتُبنى من حفظ v3 بعكس الترحيل (كما يفعل backup-ui)
  const S0 = E.newGame(11); E.A.buy(S0, S0.player.caravans[0].id, 'wool', 3);
  const old = JSON.parse(E.save(S0)); old.ver = 2; old.player.gold = 777; delete old.player.wallet; delete old.fx;
  const r = E.loadChecked(JSON.stringify(old)); assert.equal(r.ok, true); assert.equal(r.migrated, true);
  assert.equal(r.S.ver, 3); assert.equal(r.S.player.wallet.sar, 777); assert.equal(r.S.player.caravans[0].cargo.wool, 3);
  assert.ok(r.S.player.caravans[0].basis.wool.q >= 1); ok('v2 يُرحَّل بلا فقد في الرصيد والبضاعة');
}
/* ---- المتصفح ---- */
(async () => {
  const b = await chromium.launch(); const errors = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(URL); await p.waitForTimeout(1800);
    await p.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 11, stage: 23, intro: 11, welcome: 99, datePend: false, zseen: true, free: true }); S.day = 14; __game.renderAll(true); });
    await p.waitForTimeout(800);
    const good = await p.evaluate(() => localStorage.getItem('darb-v3')); assert.ok(good && good.length > 1000, 'حفظ سليم موجود');
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('darb-backup-snapshots') || '[]').length > 0), true, 'يوجد لقطة احتياطية');
    const reopen = async (fn, arg) => { await p.goto(NEUTRAL); if (fn) await p.evaluate(fn, arg); await p.goto(URL); await p.waitForTimeout(1800); };
    const corrupt = good.slice(0, good.length >> 1);
    // ١) حفظ تالف
    await reopen(t => localStorage.setItem('darb-v3', t), corrupt);
    assert.equal(await p.locator('#lostSave').isVisible(), true, 'البطاقة تظهر'); ok('بطاقة الفشل تظهر للحفظ التالف');
    assert.match(await p.locator('#lostSave').innerText(), /إن كنت فتحت نسخة أقدم من اللعبة فحدّث الصفحة/); ok('البطاقة تنبّه إلى تحديث الصفحة عند فتح نسخة أقدم');
    assert.equal(await p.evaluate(() => localStorage.getItem('darb-v3')), corrupt, 'KEY لم يتغيّر');
    assert.equal(await p.evaluate(c => Object.keys(localStorage).filter(k => k.startsWith('darb-lost-')).some(k => localStorage[k] === c), corrupt), true, 'النص الأصلي في darb-lost'); ok('النسخة الأصلية محفوظة وKEY كما هو');
    await p.evaluate(() => { __game.S.day += 3; __game.renderAll(true); }); await p.waitForTimeout(700);
    assert.equal(await p.evaluate(() => localStorage.getItem('darb-v3')), corrupt, 'لا كتابة أثناء الإيقاف'); ok('الحفظ موقوف خلف البطاقة');
    // استعادة من لقطة احتياطية
    await p.locator('[data-lost=restore]').click(); assert.equal(await p.locator('#backupPanel').isVisible(), true);
    await p.locator('#backupPanel summary').click(); await p.locator('[data-act=backup-snapshot]').first().click(); await p.waitForSelector('.backup-preview');
    await p.locator('[data-act=backup-confirm]').click(); await p.locator('[data-act=backup-apply]').click(); await p.waitForTimeout(500);
    assert.equal(await p.locator('#lostSave').count(), 0, 'البطاقة اختفت بعد الاستعادة');
    assert.match(await p.locator('#toast').innerText().catch(() => ''), /عاد الحفظ للعمل/); ok('بعد الاستعادة رسالة «عاد الحفظ للعمل»');
    await p.evaluate(() => { __game.S.day = 77; __game.renderAll(true); }); await p.waitForTimeout(700);
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('darb-v3')).day), 77); ok('الحفظ يعمل بعد الاستعادة (رُفع الإيقاف)');
    // ٢) إصدار غير معروف
    const unk = JSON.stringify(Object.assign(JSON.parse(await p.evaluate(() => localStorage.getItem('darb-v3'))), { ver: 99 }));
    await reopen(t => { Object.keys(localStorage).filter(k => k.startsWith('darb-lost-')).forEach(k => localStorage.removeItem(k)); localStorage.setItem('darb-v3', t); }, unk);
    assert.equal(await p.locator('#lostSave').isVisible(), true); assert.equal(await p.evaluate(() => localStorage.getItem('darb-v3')), unk); ok('إصدار غير معروف: نفس السلوك');
    // ٣) ابدأ لعبة جديدة: تأكيدان ثم يُكتب KEY
    await p.locator('[data-lost=new]').click(); assert.equal(await p.locator('#lostSave').isVisible(), true, 'يلزم تأكيد'); assert.equal(await p.evaluate(() => localStorage.getItem('darb-v3')), unk);
    await p.locator('[data-lost=new]').click(); await p.waitForTimeout(500);
    assert.equal(await p.locator('#lostSave').count(), 0); const nk = await p.evaluate(() => localStorage.getItem('darb-v3')); assert.notEqual(nk, unk); assert.equal(JSON.parse(nk).ver, 3); ok('«ابدأ لعبة جديدة» يرفع الإيقاف ويكتب KEY');
    assert.equal(await p.evaluate(u => Object.keys(localStorage).some(k => k.startsWith('darb-lost-') && localStorage[k] === u), unk), true, 'الأصل ما زال في darb-lost');
    // ٤) فشل نسخ darb-lost لا يمنع البطاقة ولا يرفع الإيقاف
    await p.addInitScript(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('darb-lost-')) throw new DOMException('full', 'QuotaExceededError'); return o.call(this, k, v); }; });
    await reopen(() => { Object.keys(localStorage).filter(k => k.startsWith('darb-lost-')).forEach(k => localStorage.removeItem(k)); localStorage.setItem('darb-v3', '{"bad"'); });
    assert.equal(await p.locator('#lostSave').isVisible(), true); assert.match(await p.locator('#lostSave').innerText(), /لم نستطع حفظ نسخة/);
    await p.evaluate(() => { __game.S.day += 1; __game.renderAll(true); }); await p.waitForTimeout(700);
    assert.equal(await p.evaluate(() => localStorage.getItem('darb-v3')), '{"bad"'); ok('فشل نسخ darb-lost: البطاقة تظهر مع تنبيه والحفظ موقوف');
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
    // ٥) حفظ v2 يُرحَّل ويُبقي نسخة ما قبل الترحيل حتى أول حفظ
    const p2 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p2.on('pageerror', e => errors.push(e.message));
    await p2.goto(URL); await p2.waitForTimeout(1500);
    const v2 = await p2.evaluate(() => { const old = JSON.parse(__game.E.save(__game.S)); old.ver = 2; old.player.gold = 888; delete old.player.wallet; delete old.fx; return JSON.stringify(old); });
    await p2.goto(NEUTRAL); await p2.evaluate(t => localStorage.setItem('darb-v3', t), v2);
    await p2.addInitScript(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'darb-v3') throw new DOMException('full', 'QuotaExceededError'); return o.call(this, k, v); }; });
    await p2.goto(URL); await p2.waitForTimeout(1800);
    assert.equal(await p2.locator('#lostSave').count(), 0); assert.equal(await p2.evaluate(() => __game.S.player.wallet.sar), 888);
    assert.equal(await p2.evaluate(() => localStorage.getItem('darb-save-pre-migrate')), v2); ok('v2 يُفتح وتبقى نسخة ما قبل الترحيل');
    const p3 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); await p3.goto(URL); await p3.waitForTimeout(1500);
    await p3.goto(NEUTRAL); await p3.evaluate(t => localStorage.setItem('darb-v3', t), v2); await p3.goto(URL); await p3.waitForTimeout(1500);
    await p3.evaluate(() => { __game.S.day += 1; __game.renderAll(true); }); await p3.waitForTimeout(700);
    assert.equal(await p3.evaluate(() => localStorage.getItem('darb-save-pre-migrate')), null); assert.equal(await p3.evaluate(() => JSON.parse(localStorage.getItem('darb-v3')).ver), 3); ok('تُمسح نسخة ما قبل الترحيل بنجاح أول حفظ');
    // ٦) قياس التخزين: لعبة عمرها ١٠ سنوات (٣٦٥٠ يوماً) عبر مسار persist الحقيقي
    const tab = await p3.evaluate(() => {
      const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 11, stage: 23, intro: 11, welcome: 99, datePend: false, zseen: true, free: true });
      for (let i = 1; i <= 3650; i++) { E.tick(S); if (i % 60 === 0) window.dispatchEvent(new Event('pagehide')); }
      window.dispatchEvent(new Event('pagehide'));
      try { localStorage.setItem('darb-save-before-restore', (r => JSON.stringify({ format: 'darb-backup', version: 1, createdAt: new Date().toISOString(), code: r.code, checksum: E.sha256hex(r.code) }))(SaveCode.encode(E.save(S)))); } catch (e) {}
      const L = k => (localStorage.getItem(k) || '').length, o = { 'الحفظ': L('darb-v3'), 'الحلقة الاحتياطية (٣ لقطات)': L('darb-backup-snapshots'), 'darb-save-before-restore': L('darb-save-before-restore') };
      o['المجموع'] = Object.values(o).reduce((a, c) => a + c, 0);
      return { o, days: S.day, snaps: JSON.parse(localStorage.getItem('darb-backup-snapshots') || '[]').length };
    });
    console.log('عمر اللعبة: ' + tab.days + ' يوماً، لقطات الحلقة: ' + tab.snaps);
    for (const k in tab.o) console.log('  ' + k + ': ' + (tab.o[k] / 1024).toFixed(0) + ' ك.ب أحرف (≈ ' + (tab.o[k] * 2 / 1048576).toFixed(2) + ' م.ب UTF-16)');
    assert.ok(tab.days >= 3650 && tab.snaps === 3);
    assert.deepEqual(errors, []); console.log('OK save-migrate');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
