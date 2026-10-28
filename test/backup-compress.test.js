// WP-03ب: لقطات النسخ الاحتياطي ونسخة before-restore مضغوطتان (DTG1) مع قراءة القديم غير المضغوط: node test/backup-compress.test.js
const assert = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=37', ok = m => console.log('OK   ' + m);
const mb = n => (n * 2 / 1048576).toFixed(2) + ' م.ب';
const open = async p => { await p.locator('#hMenu').click(); await p.locator('[data-act=backup-open]').first().click(); await p.waitForSelector('#backupPanel:not([hidden])'); };
const restore = async (p, i) => { await open(p); await p.locator('#backupPanel details summary').first().click(); await p.locator(`[data-act=backup-snapshot][data-i="${i}"]`).click(); await p.waitForSelector('.backup-preview'); await p.locator('[data-act=backup-confirm]').click(); await p.locator('[data-act=backup-apply]').click(); await p.waitForTimeout(700); };
const calm = p => p.evaluate(() => { const { S } = __game; for (const k of ['stageUp', 'up', 'sq', 'tq', 'bq', 'csq', 'cq', 'fq', 'eq', 'rq']) S.learn[k] = []; Object.assign(S.learn, { intro: 11, welcome: 99, datePend: false }); if (S.climate) S.climate.pending = []; S.awayReport = null; __game.setSpeed(0); __game.go('home'); }).then(() => p.waitForTimeout(400));
const state = p => p.evaluate(() => ({ day: __game.S.day, gold: Math.round(__game.S.player.gold), name: __game.S.player.name }));
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    // ١) لعبة عمرها 3651 يوماً عبر مسار الحفظ الحقيقي: جدول الأحجام قبل/بعد
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(URL); await p.waitForTimeout(1500);
    await p.evaluate(async () => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { level: 11, stage: 23, intro: 11, welcome: 99, datePend: false, zseen: true, free: true });
      for (let i = 1; i <= 3650; i++) { E.tick(S); if (i % 60 === 0) { window.dispatchEvent(new Event('pagehide')); await new Promise(r => setTimeout(r, 40)); } } window.dispatchEvent(new Event('pagehide')); await new Promise(r => setTimeout(r, 500)); });
    const ring0 = await p.evaluate(() => JSON.parse(localStorage.getItem('darb-backup-snapshots') || '[]'));
    assert.equal(ring0.length, 2, 'الحلقة لقطتان'); assert.ok(ring0.every(e => typeof e.z === 'string' && e.z.startsWith('DTG1.') && !e.envelope), 'اللقطات مضغوطة DTG1'); ok('لقطتان في الحلقة، كلتاهما DTG1 مضغوطة، بلا envelope');
    // استعادة لقطة مضغوطة، وبعدها نسخة before-restore مضغوطة وتراجع عنها
    await calm(p); await p.evaluate(() => { __game.S.player.wallet.sar += 5000; }); const dirty = await state(p);
    await p.waitForTimeout(600); const ringNow = await p.evaluate(() => JSON.parse(localStorage.getItem('darb-backup-snapshots') || '[]')); await restore(p, 0); const afterRestore = await state(p); assert.equal(afterRestore.day, ringNow[0].day, 'استُعيد يوم اللقطة'); ok('استعادة لقطة مضغوطة تعمل (اليوم ' + afterRestore.day + ')');
    const before = await p.evaluate(() => localStorage.getItem('darb-save-before-restore')); assert.ok(before && before.startsWith('DTG1.'), 'before-restore مضغوطة'); ok('نسخة before-restore مضغوطة DTG1');
    await calm(p); await open(p); await p.locator('[data-act=backup-undo]').click(); await p.waitForSelector('.backup-preview'); await p.locator('[data-act=backup-confirm]').click(); await p.locator('[data-act=backup-apply]').click(); await p.waitForTimeout(700);
    assert.deepEqual(await state(p), dirty); ok('التراجع من before-restore المضغوطة يعيد التقدم السابق بالضبط');
    // الجدول: الحجم الفعلي مقابل المكافئ القديم (غير المضغوط، 3 لقطات) للحالة نفسها
    const t = await p.evaluate(() => { const { S, E } = __game, L = k => (localStorage.getItem(k) || '').length, r = SaveCode.encode(E.save(S)), env = JSON.stringify({ format: 'darb-backup', version: 1, createdAt: new Date().toISOString(), code: r.code, checksum: E.sha256hex(r.code) });
      const entryOld = JSON.stringify({ day: S.day, stage: 23, retired: false, createdAt: new Date().toISOString(), envelope: JSON.parse(env) }).length;
      return { save: L('darb-v3'), ringNew: L('darb-backup-snapshots'), beforeNew: L('darb-save-before-restore'), entryOld, beforeOld: env.length }; });
    const oldTotal = t.save + 3 * t.entryOld + t.beforeOld, newTotal = t.save + t.ringNew + t.beforeNew;
    console.log('\nلعبة عمرها 3651 يوماً (أحرف ≈ بايت UTF-16 ÷ 2):');
    console.log('| المفتاح | قبل (غير مضغوط، 3 لقطات) | بعد (DTG1، لقطتان) |\n|---|---|---|');
    console.log(`| darb-v3 (الحفظ، لم يتغير) | ${mb(t.save)} | ${mb(t.save)} |`);
    console.log(`| الحلقة الاحتياطية | ${mb(3 * t.entryOld)} (3 × ${mb(t.entryOld)}) | ${mb(t.ringNew)} (2 × ${mb(t.ringNew / 2)}) |`);
    console.log(`| darb-save-before-restore | ${mb(t.beforeOld)} | ${mb(t.beforeNew)} |`);
    console.log(`| **المجموع** | **${mb(oldTotal)}** | **${mb(newTotal)}** |\n`);
    assert.ok(t.ringNew < 2 * t.entryOld * 0.8 && t.beforeNew < t.beforeOld * 0.8, 'الضغط لم يوفّر 20% على الأقل'); assert.ok(newTotal * 2 / 1048576 < 3, 'المجموع لا ينزل تحت 3 م.ب: ' + mb(newTotal)); ok('المجموع ' + mb(oldTotal) + ' ← ' + mb(newTotal) + ' (تحت 3 م.ب)');
    // ٢) لقطة قديمة غير مضغوطة (envelope) في أجهزة اللاعبين: تُقرأ وتُستعاد
    const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); q.on('pageerror', e => errors.push(e.message)); await q.goto(URL); await q.waitForTimeout(1500);
    await q.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.player.wallet.sar = 1234; S.day = 40; const r = SaveCode.encode(E.save(S));
      localStorage.setItem('darb-backup-snapshots', JSON.stringify([{ day: 40, stage: 1, retired: false, createdAt: new Date().toISOString(), envelope: { format: 'darb-backup', version: 1, createdAt: new Date().toISOString(), code: r.code, checksum: E.sha256hex(r.code) } }]));
      S.player.wallet.sar = 99; S.day = 41; window.dispatchEvent(new Event('pagehide')); });
    await calm(q); await restore(q, 0); const old = await state(q); assert.equal(old.gold, 1234); assert.equal(old.day, 40); ok('استعادة لقطة قديمة غير مضغوطة (envelope) تعمل');
    // ٣) متصفح بلا CompressionStream: يرجع إلى الصيغة القديمة ويعمل
    const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx3.addInitScript(() => { delete window.CompressionStream; });
    const r3 = await ctx3.newPage(); r3.on('pageerror', e => errors.push(e.message)); await r3.goto(URL); await r3.waitForTimeout(1500);
    await r3.evaluate(async () => { const { S, E } = __game; E.A.chooseStart(S, 'sa'); E.A.learnSetChar(S, 'trader'); S.player.wallet.sar = 777; S.day = 50; window.dispatchEvent(new Event('pagehide')); await new Promise(r => setTimeout(r, 400)); });
    const ring3 = await r3.evaluate(() => JSON.parse(localStorage.getItem('darb-backup-snapshots') || '[]')); assert.ok(ring3.length >= 1 && ring3.at(-1).envelope && !ring3.at(-1).z); ok('بلا CompressionStream: تُحفظ لقطة بالصيغة القديمة');
    await r3.evaluate(() => { __game.S.player.wallet.sar = 1; }); await calm(r3); await restore(r3, ring3.length - 1); assert.equal((await state(r3)).gold, 777); ok('وتُستعاد');
    assert.deepEqual(errors, [], 'أخطاء JS'); ok('بلا أخطاء JS'); console.log('OK backup-compress');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})();
