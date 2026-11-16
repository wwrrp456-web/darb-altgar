'use strict';
// 030 السمسار التعليمي المولَّد (واجهة): البطاقة في المكتب والموجز، ظهور الاختيار بعد كل فعل، نافذة «السماسرة»، الشارة وسطر «حال أعمالي»،
// لا select/details ولا best، 390 بلا تمرير أفقي، ولقطات docs/shots/broker/ (SC-006). node test/broker-ui.test.js
const a = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = path.join(__dirname, '../docs/shots/broker'); fs.mkdirSync(SHOTS, { recursive: true });
const base = () => { const g = __game, S = g.S, A = g.E.A; g.setSpeed(0); A.learnSetChar(S, 'trader'); S.noLock = 1; Object.assign(S.learn, { intro: 11, level: 8, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.wallet.sar = 20000; S.player.caravans[0].carts = 50; g.E.RIVALW.on = false; S.player.bank = S.player.bank || { dep: {} }; S.player.bank.dep = { jeddah: 120000 }; /* يظهر «حال أعمالي» بوديعة */ };
const clean = () => { const S = __game.S; for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.climate.pending = []; };
// يضع عرضاً مولَّداً مطابقاً للشرط كما تضعه الدورة
const place = kind => { const g = __game, S = g.S, E = g.E, c = S.cities[S.player.caravans[0].city]; for (const id of E.GIDS) if (!E.GD[id].live && E.sells(c, id)) c.stock[id] = Math.max(c.stock[id] || 0, 300); S.day = 40;
  const pred = { honest: o => o.t.honest && o.type === 'good' && o.t.wOk && !o.t.noInsp && !o.t.noise, bad: o => !o.t.honest && o.type !== 'refer' && o.t.wOk && !o.t.noInsp, badOthers: o => !o.t.honest && o.type !== 'refer' && o.style === 'others' && !o.t.noInsp }[kind];
  for (let k = 0; k < 800; k++) { const o = E.brokerGen(S, E.brokerMemoryNew()); if (o && pred(o)) { S.brokers.offer = o; o.until = S.day + 8; S.brokerGen.next = S.day + 25; S.learn.ex = S.learn.ex || { broker: -99, friend: -99, luck: -99 }; S.learn.ex.broker = S.day; return o.name; } } return null; };
(async () => {
  const b = await chromium.launch(), errors = [];
  const open = async (w, kind) => { const p = await b.newPage({ viewport: { width: w, height: 950 } }); p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=21&details=1&fold=1'); await p.waitForFunction(() => !!window.__game); await p.evaluate(base); await p.evaluate('window.__place = ' + place.toString()); if (kind) a(await p.evaluate(k => window.__place(k), kind), 'عرض ' + kind); await p.evaluate(clean); await p.evaluate(() => { __game.go('office'); __game.renderAll(true); }); return p; };
  const noOverflow = async p => a.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'تمرير أفقي');
  const hideSalem = p => p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed' && /عمّ سالم/.test(el.textContent) && el.textContent.length < 400) el.style.display = 'none'; });
  const shot = async (p, sel, name) => { await hideSalem(p); await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(SHOTS, name) }); };
  const card = p => p.locator('.dask[data-dask^="brk:"]').first();
  const opt = (p, id) => p.locator('.dask[data-dask^="brk:"] [data-oid="' + id + '"]').first();
  // قبل أي عرض: لا بطاقة ولا شارة
  { const p = await open(390); a.equal(await p.locator('[data-dask^="brk:"]').count(), 0); a.equal(await p.locator('[data-dchip="brk"]').count(), 0); await p.close(); }
  for (const w of [390, 1100]) {
    const p = await open(w, 'honest'), name = await p.evaluate(() => __game.S.brokers.offer.name);
    a(await card(p).isVisible(), 'البطاقة في المكتب'); const t = await card(p).innerText(); a(t.includes(name), 'اسم السمسار'); a.match(t, /للوحدة/); a.match(t, /يبقى عرضه/);
    a.equal(await p.evaluate(() => !!(__game.S.story && __game.S.story.cur) || !!document.querySelector('dialog[open]') || !!__game.S.pause), false, 'بلا مقاطعة');
    a.equal(await card(p).locator('select, details').count(), 0, 'لا select ولا details'); a.equal(await p.locator('.dask[data-dask^="brk:"] .dopt.best').count(), 0, 'لا best (لا توصية قبل القرار)');
    for (const id of ['insp', 'ask', 'warr', 'acc', 'no']) a.equal(await opt(p, id).count(), 1, 'خيار ' + id);
    a.equal(await p.evaluate(() => __game.S.learn.rq.length + __game.S.learn.eq.length), 0, 'لا تعليق لعمّ سالم قبل القرار'); await noOverflow(p);
    await shot(p, '.dask[data-dask^="brk:"]', 'card-before-' + w + '.png');
    // الموجز: البطاقة نفسها في الرئيسية
    await p.evaluate(() => { __game.go('home'); __game.renderAll(true); }); a(await p.locator('#screen [data-dchip="brk"].hs-row').count() >= 1, 'سطر «حال أعمالي»'); await p.locator('#screen [data-bp="brief"]').click(); await p.waitForTimeout(400); a(await p.locator('#briefPanel [data-dask^="brk:"]').count() >= 1, 'البطاقة في موجز الرئيسية'); await shot(p, '#briefPanel [data-dask^="brk:"]', 'brief-' + w + '.png'); await p.evaluate(() => { __game.brief.open = false; document.getElementById('briefPanel').hidden = true; });
    await p.evaluate(() => { __game.go('office'); __game.renderAll(true); });
    // ظهور الاختيار بعد كل فعل: on + aria-pressed + السطر بالرقم
    for (const [id, re] of [['insp', /المعاينة: /], ['ask', /سؤال الزعيم: /], ['warr', /الضمان: /]]) {
      const o = opt(p, id); if (await o.isDisabled()) continue; await o.click(); await p.waitForFunction(i => { const e = document.querySelector('.dask[data-dask^="brk:"] [data-oid="' + i + '"]'); return e && e.disabled; }, id); const o2 = opt(p, id);
      a(await p.evaluate(() => !!document.querySelector('[data-dask^="brk:"]')), 'بقيت البطاقة'); a.match(await o2.getAttribute('class'), /\bon\b/, id + ' مظلَّل'); a.equal(await o2.getAttribute('aria-pressed'), 'true'); a(await o2.isDisabled(), id + ' معطَّل بعد الفعل'); a.match(await o2.innerText(), /تمّ: /);
      a.match(await card(p).innerText(), re, 'السطر بالرقم بعد ' + id);
    }
    a(await opt(p, 'ask').count() === 1); await noOverflow(p); await shot(p, '.dask[data-dask^="brk:"]', 'card-after-' + w + '.png');
    // الشارة في تبويب اليوم تفتح نافذة «السماسرة»
    const chip = p.locator('[data-dchip="brk"]').first(); a(await chip.isVisible(), 'الشارة'); await chip.click(); a(await p.locator('#dsheet').isVisible(), 'النافذة'); const st = await p.locator('#dsheet').innerText(); a.match(st, /السماسرة/); a(st.includes(name)); a.equal(await p.locator('#dsheet select, #dsheet details').count(), 0); await noOverflow(p);
    await shot(p, '#dsheet', 'sheet-' + w + '.png'); await p.evaluate(() => __game.dClose());
    // القبول ثم الحلّ: صف في السجل وتعليق عمّ سالم بعد يومين
    await opt(p, 'acc').click(); a.equal(await p.evaluate(() => __game.S.brokers.offer), null); a.equal(await p.locator('[data-dask^="brk:"]').count(), 0, 'تختفي البطاقة بعد القبول');
    await p.evaluate(() => { const S = __game.S; for (let i = 0; i < 3; i++) { __game.E.tick(S, false); S.pause = false; S.learn.eq = []; } __game.renderAll(true); }); a(await p.evaluate(() => __game.S.learn.rq.includes('brkOk')), 'brkOk بعد الحلّ');
    await p.evaluate(() => __game.dOpen('brk')); const st2 = await p.locator('#dsheet').innerText(); a(st2.includes(name) && /صافيك/.test(st2) && /صدق في 1 من 1|صدق في ١ من ١/.test(st2), 'صف السجل: ' + st2.slice(0, 200)); a.equal(await p.locator('#dsheet [data-brk-row]').count(), 1);
    await shot(p, '#dsheet', 'ledger-' + w + '.png'); await p.close();
  }
  { // غاشّ بمهلة: بطاقة «لك مهلة ردّ» ثم الردّ، وتعليق عمّ سالم بالحديث المعتمد
    const p = await open(390, 'bad'); await opt(p, 'warr').click(); await opt(p, 'acc').click();
    await p.evaluate(() => { const S = __game.S; for (let i = 0; i < 3; i++) { __game.E.tick(S, false); S.pause = false; S.learn.eq = []; } __game.renderAll(true); });
    const rc = p.locator('.dask[data-dask="brk:ret"]'); a(await rc.isVisible(), 'بطاقة مهلة الردّ'); a.match(await rc.innerText(), /لك مهلة ردّ عند/); a.equal(await rc.locator('.dopt.best').count(), 0); await shot(p, '.dask[data-dask="brk:ret"]', 'ret-390.png'); await noOverflow(p);
    await p.evaluate(() => document.querySelector('.dask[data-dask="brk:ret"] [data-oid="ret"]').click()); a.equal(await p.evaluate(() => __game.S.brokers.ret), null); a(await p.evaluate(() => __game.S.learn.rq.includes('brkRet')));
    const txt = await p.evaluate(() => __game.S.learn.rp.brkRet); a(txt.includes(await p.evaluate(() => __game.E.BR_SH.SH04)), 'الحديث المعتمد حرفاً'); await p.close();
  }
  { // خسارة بلا مهلة بأسلوب «يستشهد بآخرين»: تعليق عمّ سالم يحمل عبارة النجش المعتمدة حرفاً؛ وتظهر الرسالة في واجهة عمّ سالم
    const p = await open(390, 'badOthers'); await p.evaluate(() => { const S = __game.S; S.brokers.offer.seen.warr = { d: S.day, ok: false }; }); await opt(p, 'acc').click();
    await p.evaluate(() => { const S = __game.S; for (let i = 0; i < 3; i++) { __game.E.tick(S, false); S.pause = false; S.learn.eq = []; } __game.renderAll(true); });
    a(await p.evaluate(() => __game.S.learn.rq.includes('brkLost')), 'brkLost'); const txt = await p.evaluate(() => __game.S.learn.rp.brkLost); a(txt.includes(await p.evaluate(() => __game.E.BR_SH.SH03)), 'عبارة النجش حرفاً'); a(txt.includes(await p.evaluate(() => __game.E.BR_SH.SH04)));
    await p.evaluate(() => { __game.go('home'); __game.renderAll(true); }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOTS, 'salem-after-loss-390.png') }); await p.close();
  }
  { // مفتاح الرجوع: BROKER.on=false = لا بطاقة ولا شارة ولا سطر
    const p = await open(390, 'honest'); await p.evaluate(() => { __game.E.BROKER.on = false; __game.renderAll(true); }); a.equal(await p.locator('[data-dask^="brk:"]').count(), 0); a.equal(await p.locator('[data-dchip="brk"]').count(), 0); await p.close();
  }
  a.equal(errors.length, 0, errors.join('\n')); console.log('PASS broker UI 390/1100: card, brief, visible choices, sheet, ledger, chip, return window, no select/details, no overflow, off switch');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
