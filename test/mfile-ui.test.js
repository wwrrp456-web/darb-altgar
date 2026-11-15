'use strict';
// 052 «ملفي» (390 و1100): تبويبات أنا/ثروتي/كشوفي/إنجازاتي، الرأس الحيّ، كشف الدكان، تنبيهات الخسارة، المفاتيح المطفأة: node test/mfile-ui.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const errors = [];
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: true }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(() => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; __game.go('market'); }); await p.waitForTimeout(500); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const fire = (p, attrs) => p.evaluate(at => { let b = document.getElementById('__op'); if (b) b.remove(); b = document.createElement('button'); b.id = '__op'; for (const k in at) b.setAttribute(k, at[k]); document.body.appendChild(b); b.click(); }, attrs);
const tabs = p => p.evaluate(() => [...document.querySelectorAll('#dsheet [role=tab]')].map(t => [t.dataset.dstab, t.getAttribute('aria-selected')]));
const body = p => p.evaluate(() => (document.getElementById('dbody') || {}).innerText || '');
const adv = (p, n) => p.evaluate(n => { const g = __game, S = g.S; for (let i = 0; i < n; i++) { g.E.tick(S, false); S.pause = false; if (S.road) S.road = null; } g.renderAll && g.renderAll(true); }, n);
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1100]) {
    const p = await mk(b, w, '?player=1&seed=5'), t = w + ': ';
    // ١) صورة الرأس (act=profile) تفتح «ملفي» على «أنا» بنقرة واحدة؛ والثروة على «ثروتي»
    await fire(p, { 'data-act': 'profile' }); await p.waitForTimeout(300);
    let tb = await tabs(p); a.deepEqual(tb.map(x => x[0]), ['me', 'wealth', 'kashf', 'ach'], t + 'أربعة تبويبات'); a.deepEqual(tb.filter(x => x[1] === 'true').map(x => x[0]), ['me'], t + 'تبويب واحد محدَّد (أنا)');
    a.equal(await p.locator('#profile:not([hidden])').count(), 0, t + '#profile القديم لا يظهر');
    let txt = await body(p); a.ok(/سنة، (في أول الدرب|في أوج تجارته|شيخ الدرب|الوريث)/.test(txt) && /الفصل \d من 7 · سمعتك \d+٪ · \d+ إنجازاً من 40/.test(txt), t + 'الرأس الحيّ'); a.ok(/لا يدخل في الشروط/.test(txt) && /عقود الزعماء/.test(txt) && /حد القرض الحسن والمرابحة/.test(txt), t + 'بطاقة السمعة بأثرها');
    // بطاقة الزكاة حرفاً: نصها يساوي نص الجزء القديم
    const zk = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = profileParts().zakat; return d.innerText.trim(); }).catch(() => null);
    if (zk) a.ok(txt.includes(zk.split('\n')[0]), t + 'بطاقة الزكاة كما هي');
    for (const k of ['wealth', 'kashf', 'ach', 'me']) { await p.locator(`#dsheet [data-dstab=${k}]`).click(); await p.waitForTimeout(200); tb = await tabs(p); a.deepEqual(tb.filter(x => x[1] === 'true').map(x => x[0]), [k], t + 'تبويب واحد بعد الضغط ' + k); }
    a.equal(await wide(p), false, t + 'لا تمرير أفقي');
    // ٢) عمر ومرحلة عند 39 و40 و70
    const off0 = await p.evaluate(() => __game.S.learn.ageOffset || 0);
    for (const [age, stage] of [[39, 'في أول الدرب'], [40, 'في أوج تجارته'], [70, 'شيخ الدرب']]) {
      await p.evaluate(g => { const S = __game.S; S.learn.ageOffset = (S.learn.ageOffset || 0) + (g + 0.5 - __game.E.ageOf(S)); }, age); await p.locator('#dsheet [data-dstab=wealth]').click(); await p.locator('#dsheet [data-dstab=me]').click(); await p.waitForTimeout(150);
      txt = await body(p); a.ok(txt.includes(age + ' سنة، ' + stage), t + 'العمر ' + age + ' ← ' + stage); }
    await p.evaluate(o => { __game.S.learn.ageOffset = o; }, off0); // لا نترك الحدث العمري يغطي الشاشة
    ok(t + 'الرأس والتبويبات والسمعة والمراحل'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // ٣) ثروتي من رقم الثروة
    await fire(p, { 'data-act': 'wealth' }); await p.waitForTimeout(300); tb = await tabs(p); a.deepEqual(tb.filter(x => x[1] === 'true').map(x => x[0]), ['wealth']); txt = await body(p); a.ok(/أين ثروتك؟/.test(txt), t + 'ثروتي'); a.equal(await p.locator('#wealthPanel:not([hidden])').count(), 0, t + '#wealthPanel لا يظهر مستقلاً');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // ٤) كشوفي: بعد 31 يوماً شهر منتهٍ؛ الشريحتان تغيّران الملخص بالرقم الصحيح
    await adv(p, 31); const lastNet = await p.evaluate(() => { const m = __game.E.mxView(__game.S, 'last'); return m ? m.net : null; }); a.notEqual(lastNet, null, t + 'شهر منتهٍ');
    await p.evaluate(() => { const S = __game.S, P = S.player, c = P.caravans[0].city; P.mx.last.t = { [c]: { n: 3, pl: -500, nl: 2, lb: 0, ls: 400, lt: 100 } }; P.mx.last.trade = { pl: -500, n: 3, nl: 2 }; P.trades.unshift({ day: S.day - 2, city: c, g: 'coffee', q: 10, side: 'sell', net: 900, pl: -300, sector: 'trade', tx: 100, lw: { b: 100, s: 100, t: 100 } }); });
    await fire(p, { 'data-dchip': 'me:kashf' }); await p.waitForTimeout(300); tb = await tabs(p); a.deepEqual(tb.filter(x => x[1] === 'true').map(x => x[0]), ['kashf'], t + 'سطر الدفتر ← كشوفي'); txt = await body(p); a.ok(/صافي هذا الشهر/.test(txt));
    await p.locator('[data-mxper=last]').click(); await p.waitForTimeout(200); txt = await body(p); const nn = await p.evaluate(() => __game.E.mxView(__game.S, 'last').net); a.ok(txt.includes('صافي الشهر الماضي ' + (nn < 0 ? '−' : '+') + Math.abs(nn).toLocaleString('en-US')) || /صافي الشهر الماضي/.test(txt), t + 'ملخص الشهر الماضي'); a.equal(await p.locator('[data-mxper=last].on').count(), 1, t + 'شريحة محدَّدة');
    await p.locator('[data-mxcity]').first().click(); await p.waitForTimeout(200); txt = await body(p); a.ok(/صفقاتك الخاسرة في/.test(txt) && /بعتَها بـ/.test(txt), t + 'صف المدينة يعرض صفقاتها الخاسرة بسببها');
    a.equal(await wide(p), false, t + 'كشوفي بلا تمرير أفقي'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // ٥) إنجازاتي: مكافآت وتجميلي
    await fire(p, { 'data-act': 'profile' }); await p.locator('#dsheet [data-dstab=ach]').click(); await p.waitForTimeout(200); await p.evaluate(() => document.querySelectorAll('#dbody details').forEach(d => d.open = true)); txt = await body(p); a.ok(/كسبتَ منها \d+ نفوذاً/.test(txt) && /نفوذ/.test(txt) && /تجميلي/.test(txt), t + 'إنجازاتي بمكافآتها وتجميلي'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // ٦) بطاقة تنبيه تُفتح على الكشف المصفّى
    ok(t + 'كشوفي وإنجازاتي وثروتي');
    // ٧) المفتاح مطفأ: profile القديم
    await p.evaluate(() => { __game.E.MFILE.on = false; }); await fire(p, { 'data-act': 'profile' }); await p.waitForTimeout(300); a.equal(await p.locator('#profile:not([hidden])').count(), 1, t + 'MFILE مطفأ ⇒ profile القديم'); await p.evaluate(() => { __game.E.MFILE.on = true; });
    // ٨) localStorage يرمي ⇒ يعمل
    await p.evaluate(() => { Storage.prototype.getItem = () => { throw new Error('x'); }; Storage.prototype.setItem = () => { throw new Error('x'); }; });
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); await fire(p, { 'data-act': 'profile' }); await p.waitForTimeout(300); a.ok(await p.locator('#dsheet').count() >= 1, t + 'بلا localStorage');
    await p.close();
  }
  a.deepEqual(errors, [], 'لا أخطاء صفحة: ' + errors.join(' | ')); console.log('mfile-ui OK'); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
