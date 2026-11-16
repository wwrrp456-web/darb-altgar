'use strict';
// 055 (390 و1100): ثلاثة أزرار للموعد، زرّ واحد aria-pressed، سطر الشرح الحرفي بالنسبة المختارة، معاينة الشهر، لا select/details جديد، لا تمرير أفقي؛ والمطفأ زرّان بنصّي اليوم
const a = require('node:assert/strict'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const NOTE = { sale: p => `يُقتطع ${p}٪ من ربح كل بيع تُجريه بيدك بعد سداد الدَّين. لا يدخله ربح القوافل الآلية ولا الدكاكين ولا المصانع ولا المزرعة ولا المشاريع.`,
  year: p => `يُقتطع ${p}٪ من صافي أعمالك كلها في السنة الهجرية بعد المصاريف والدَّين: أرباح البيع (يدوي وقوافل ودكاكين ومصانع ومزرعة)، والمضاربة، وربح الصكوك، وحصة الإمارة، والعمل، ودخل المشاريع، وإيجار المخازن.`,
  all: p => `يُقتطع ${p}٪ من كل ربح دخل محفظتك في الشهر الهجري، قبل المصاريف وبعد سداد الدَّين: البيع بأنواعه، والمضاربة، وربح الصكوك، وحصة الإمارة، والعمل، ودخل المشاريع، وإيجار المخازن. يُودَع أول كل شهر.` };
const LABEL = { sale: 'من أرباح بيعك اليدوي', year: 'من صافي أعمالك في السنة', all: 'من كل ربح (شهرياً)' };
(async () => {
  const b = await chromium.launch(), errors = [];
  try {
    for (const width of [390, 1100]) for (const x of [true, false]) {
      const p = await b.newPage({ viewport: { width, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
      await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=8'); await p.waitForFunction(() => !!window.__game);
      await p.evaluate(xx => { const g = __game, S = g.S; g.E.VAULT.x = xx; g.setSpeed(0); g.E.A.learnSetChar(S, 'trader'); Object.assign(S.learn, { intro: 11, level: 11, stage: 23, stageIntro: 22, free: true, zseen: 1, datePend: false, tab: Object.keys(g.E.BAB.TABLETS) }); for (const k of ['tq', 'eq', 'fq', 'rq', 'up', 'stageUp', 'sq', 'cq', 'bq', 'csq']) S.learn[k] = []; S.player.wallet.sar = 5000; S.player.vault = 1000; S.player.famDebt.left = 0; g.renderAll(true); }, x);
      await p.locator('#hVault').click(); const panel = p.locator('#vaultPanel'); a(await panel.evaluate(e => e.open));
      const btns = () => panel.locator('[data-act=vmode]'), tag = width + (x ? ' جديد' : ' مطفأ');
      if (!x) { a.equal(await btns().count(), 2, tag + ': زرّان'); a.deepEqual(await btns().allInnerTexts(), ['من كل بيع', 'نهاية السنة'], tag + ': نصّا اليوم'); a.equal(await panel.locator('#vaultModeNote, #vaultMonthPreview').count(), 0); }
      else {
        a.equal(await btns().count(), 3, tag + ': ثلاثة أزرار'); a.deepEqual(await btns().allInnerTexts(), Object.values(LABEL));
        const d0 = await panel.locator('details').count();
        for (const pct of [5, 15]) { await panel.locator(`[data-act=vplan][data-q="${pct}"]`).click(); await p.waitForTimeout(150);
          for (const m of ['year', 'all', 'sale']) { await panel.locator(`[data-act=vmode][data-g=${m}]`).click(); await p.waitForTimeout(150);
            a.equal(await panel.locator('[data-act=vmode][aria-pressed=true]').count(), 1, tag + ' ' + m + ': زرّ واحد مضغوط'); a.equal(await panel.locator(`[data-act=vmode][data-g=${m}]`).getAttribute('aria-pressed'), 'true');
            a.equal((await panel.locator('#vaultModeNote').innerText()).trim(), NOTE[m](pct), tag + ' ' + m + ' ' + pct + '٪: سطر الشرح الحرفي');
            a.match(await panel.locator('#vaultCard > p').first().innerText(), new RegExp('ادخار ' + pct + '٪ ' + ({ sale: 'من أرباح بيعك اليدوي', year: 'من صافي أعمالك في السنة', all: 'من كل ربح كل شهر' })[m])); } }
        a.equal(await panel.locator('#vaultMonthPreview').count(), 0, tag + ': لا معاينة شهر خارج all');
        await panel.locator('[data-act=vmode][data-g=all]').click(); await p.waitForTimeout(200);
        const q = await p.evaluate(() => __game.E.vaultMonthQuote(__game.S)), pv = await panel.locator('#vaultMonthPreview').innerText();
        a(q.ok && /هذا الشهر حتى الآن: أرباح .* ريال، سداد دَين .*، يُودَع أول الشهر القادم نحو/.test(pv), tag + ': معاينة الشهر'); a(pv.includes(String(Math.round(q.amount))));
        await p.evaluate(() => { const S = __game.S; S.player.led.inc.realized = (S.player.led.inc.realized || 0) + 400; __game.renderAll(true); }); await p.waitForTimeout(200);
        a((await panel.locator('#vaultMonthPreview').innerText()).includes('60'), tag + ': المعاينة تتحرك بالأرباح (60 = 15٪ من 400)');
        a.equal(await panel.locator('select').count(), 0); a.equal(await panel.locator('details').count(), d0, tag + ': عدد details كالمطفأ');
      }
      a(await btns().first().evaluate(e => e.getBoundingClientRect().height >= 44), tag + ': لمس ≥ 44px'); a(await panel.evaluate(e => e.scrollWidth <= e.clientWidth + 1), tag + ': لا تمرير أفقي');
      a(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); console.log('OK   ' + tag); await p.close();
    }
    a.deepEqual(errors, []); console.log('PASS vault-plus-ui');
  } finally { await b.close(); }
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
