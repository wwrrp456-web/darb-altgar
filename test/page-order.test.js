'use strict';
// 033ب تنظيم الصفحات (390): السوق (بطاقة صفقة مختصرة، «كيف حُسب الربح؟» مرة، ملخص بلا تكرار، مراقبتي وطرقي)، القافلة (التجهيز والبحر مطويان)، الزعماء (العقد سطر + التفاصيل؛ غير المتاحة في سطر)، الأكاديمية (4 تبويبات)، الرئيسية (حالتك ثم النشرة، والحكاية مطوية)، ومفاتيح الرجوع، وطول كل صفحة
const a = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/page-order'); fs.mkdirSync(SHOTS, { recursive: true });
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 400000; };
const clean = () => { const S = __game.S; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; document.querySelectorAll('#lesson,#splash,#bootload').forEach(e => e.remove()); };
(async () => {
  const b = await chromium.launch(), errors = [];
  const open = async (screen, setup) => { const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=21&sched=0&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); if (setup) await p.evaluate(setup); await p.evaluate(clean); await p.evaluate(s => { __game.go(s); __game.renderAll(true); }, screen); await p.waitForTimeout(300); return p; };
  const noOverflow = async (p, w) => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, w + ': تمرير أفقي');
  const height = p => p.evaluate(() => document.documentElement.scrollHeight);
  const off = (p, k) => p.evaluate(k => { __game.PAGEORD[k] = false; __game.renderAll(true); }, k);
  const empty = () => { const g = __game, c = g.S.player.caravans[0]; for (const k in c.cargo) delete c.cargo[k]; c.basis = {}; c.city = 'riyadh'; c.left = 0; g.S.player.gold = 5000; g.S.learn.level = 2; g.S.learn.stage = 2; g.S.learn.ageStages = 1; g.S.player.trades = []; };
  { // 1) السوق
    const p = await open('market', empty); const n = await p.locator('.dealc').count(); a(n >= 1, 'بطاقات صفقة مختصرة: ' + n);
    for (let i = 0; i < n; i++) { const c = p.locator('.dealc').nth(i); a.equal(await c.locator('[data-act=dealgo]').count(), 1, 'زر التنفيذ'); a.equal(await c.locator('.dealnet').count(), 1, 'صافي الربح'); a.equal(await c.locator('.unitbox').isVisible(), false, 'أرقام الوحدة داخل القائمة المنسدلة'); }
    a.equal(await p.locator('summary:has-text("كيف حُسب الربح؟")').count(), 1, 'مرة واحدة في الصفحة'); a.equal(await p.locator('details[data-dk=whyprofit]').evaluate(e => e.open), true, 'مفتوحة لأول صفقة للمبتدئ');
    await noOverflow(p, 'السوق');
    await p.evaluate(() => { const g = __game; g.S.player.trades = [{ day: 1, city: 'riyadh', g: 'wheat', q: 1, side: 'sell', net: 10, pl: 5 }]; g.S.learn.level = 5; g.renderAll(true); delete document.querySelector('details[data-dk=whyprofit]'); }); a.equal(await p.locator('details[data-dk=whyprofit]').evaluate(e => e.open), false, 'مطوية لمن ربح من قبل');
    await p.evaluate(() => { const d = document.querySelector('details[data-dk=sum]'); if (d) d.open = true; }); const sumT = await p.locator('details[data-dk=sum]').innerText(); a.doesNotMatch(sumT, /قافلتي|رصيدك/, 'ملخص السوق لا يكرر الشريط'); a.match(sumT, /مخزني/);
    const t = await p.locator('#screen').innerText(); a.match(t, /مراقبتي/); a.match(t, /طرقي المفضلة/);
    await off(p, 'market'); a.equal(await p.locator('.dealc').count(), 0, 'مطفأ: لا بطاقات مختصرة'); a(await p.locator('.deal .unitbox').count() >= 1, 'مطفأ: البطاقة القديمة'); a.equal(await p.locator('summary:has-text("كيف حُسب الربح؟")').count(), 0); a.doesNotMatch(await p.locator('#screen').innerText(), /مراقبتي/, 'مطفأ: لا مراقبتي في السوق'); await p.close();
  }
  { // 2) القافلة
    const p = await open('caravan', () => { const g = __game; g.S.phase = 3; }); const t = await p.locator('#screen').innerText(); for (const w of ['الموقع', 'المعنويات', 'الطاقم', 'الحمولة']) a.match(t, new RegExp(w));
    for (const k of ['car-prep', 'car-fleet']) { const d = p.locator('details[data-fold=' + k + ']'); a.equal(await d.count(), 1, k); a.equal(await d.evaluate(e => e.open), false, k + ' مطوية'); }
    await p.evaluate(() => document.querySelector('details[data-fold=car-prep]').open = true); a(await p.locator('details[data-fold=car-prep] .up').count() >= 1, 'التجهيز موجود داخل القائمة'); a(await p.locator('details[data-fold=car-prep]').innerText().then(x => /التكافل/.test(x)), 'التكافل داخلها'); await noOverflow(p, 'القافلة');
    await off(p, 'caravan'); a.equal(await p.locator('details[data-fold=car-prep]').count(), 0, 'مطفأ'); await p.close();
  }
  { // 3) الزعماء والعقود
    const p = await open('lords', () => { const g = __game; g.S.phase = 3; g.S.player.gold = 5e5; }); const n = await p.locator('.pactrow').count(); a(n >= 1, 'عقود متاحة كسطور'); const lk = p.locator('details[data-dk=pacts_locked]'), nl = (await lk.count()) ? (await lk.locator('.kv').count()) : 0, total = await p.evaluate(() => Object.keys(__game.E.PACTS).length); a.equal(n + nl, total, 'كل العقود ظاهرة: سطر أو في مجموعة غير المتاحة');
    const r = p.locator('.pactrow').first(); a.match(await r.innerText(), /المدة/); a.match(await r.innerText(), /الكلفة/); a.equal(await r.locator('summary:has-text("التفاصيل والتوقيع")').count(), 1); a.equal(await r.locator('[data-act=sign]').isVisible(), false, 'التوقيع داخل التفاصيل'); await r.locator('summary').click(); a.equal(await r.locator('[data-act=sign]').first().isVisible(), true);
    await noOverflow(p, 'الزعماء'); await off(p, 'lords'); a.equal(await p.locator('.pactrow').count(), 0, 'مطفأ'); a(await p.locator('[data-act=sign]').count() >= 1); await p.close();
  }
  { // 4) الأكاديمية
    const p = await open('academy'); const tabs = p.locator('.acatabs [data-act=acatab]'); a.equal(await tabs.count(), 4); a.equal((await tabs.allInnerTexts()).map(x => x.replace(/^\S+\s+/, '').trim()).join('|'), 'الدروس|البطاقات|القاموس|المجلس'); a.equal(await p.locator('.acatabs .on').count(), 1);
    a(await p.locator('#screen').innerText().then(x => /المستويات/.test(x)), 'تبويب الدروس فيه المستويات'); a.doesNotMatch(await p.locator('#screen').innerText(), /كتب الأكاديمية/);
    await p.click('[data-act=acatab][data-t=cards]'); a.match(await p.locator('#screen').innerText(), /كتب الأكاديمية/); a.match(await p.locator('#screen').innerText(), /أسرار الدول/);
    await p.click('[data-act=acatab][data-t=glossary]'); a(await p.locator('#screen .gl').count() >= 10, 'مصطلحات القاموس'); await p.fill('#acaQ', 'سعر'); await p.waitForTimeout(500); const gn = await p.locator('#screen .gl').count(); a(gn >= 1 && gn < 30, 'بحث القاموس: ' + gn);
    await p.click('[data-act=acatab][data-t=council]'); a.match(await p.locator('#screen').innerText(), /مجلس|دفتر أحكام|المجلس/); await noOverflow(p, 'الأكاديمية');
    await off(p, 'academy'); a.equal(await p.locator('.acatabs').count(), 0, 'مطفأ'); a.match(await p.locator('#screen').innerText(), /كتب الأكاديمية/); await p.close();
  }
  { // 5) الرئيسية
    const p = await open('home', () => { const g = __game; g.S.day = 40; g.S.player.trips = 2; }); const t = await p.locator('#screen').innerText(); a(t.indexOf('حالتك') < t.indexOf('نشرة اليوم'), 'حالتك ثم النشرة'); const st = p.locator('details[data-fold=home-story]'); a.equal(await st.evaluate(e => e.open), false, 'الحكاية مطوية بعد أول مرة'); a(await p.locator('#screen [data-go=map]').first().isVisible(), 'أزرار الرحلة ظاهرة');
    await noOverflow(p, 'الرئيسية'); const hOn = await height(p); await off(p, 'home'); a.equal(await p.locator('details[data-fold=home-story]').count(), 0); a((await height(p)) > hOn, 'القديم أطول'); await p.close();
    const q = await open('home', () => { const g = __game; g.S.day = 0; g.S.player.trips = 0; }); a.equal(await q.locator('details[data-fold=home-story]').evaluate(e => e.open), true, 'الحكاية مفتوحة أول مرة'); await q.close();
  }
  a.equal(errors.length, 0, errors.join('\n')); console.log('PASS page-order 390: market, caravan, lords, academy, home + switches off + no horizontal scroll'); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
