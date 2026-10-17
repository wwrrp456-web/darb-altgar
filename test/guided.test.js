// لعب كامل باتّباع زرّ «مهمة عمّ سالم» فقط من أول لعبة حتى التخرّج: node test/guided.test.js [seed]
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const seed = +process.argv[2] || 5, b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=' + seed)); await p.waitForTimeout(2300);
  const G = () => p.evaluate(() => { const S = __game.S, E = __game.E, c = S.player.caravans[0]; return { lv: S.learn.level, day: S.day, gold: Math.round(S.player.gold), city: c.city, left: c.left, cargo: Math.round(E.loadOf(c)), ev: Object.values(S.learn.ev).reduce((a, b) => a + b, 0), trips: S.player.trips, phase: S.phase }; });
  const sig = g => [g.lv, g.day, g.gold, g.city, g.left, g.cargo, g.ev, g.trips].join('|');
  let lastLv = 0, lvSteps = 0, same = 0, steps = 0, spotChecks = 0, spotOk = 0; let restCards = 0, badText = 0; const msgs = new Set();
  while (steps++ < 700) {
    const g0 = await G(); if (g0.lv >= 11) break;
    if (g0.lv === lastLv && ++lvSteps > 60) { ok(false, 'علق المستوى ' + g0.lv + ' أكثر من ٦٠ خطوة'); break; }
    if (g0.lv !== lastLv) { lvSteps = 0; lastLv = g0.lv; console.log('   ← المستوى', g0.lv, 'اليوم', g0.day, 'الرصيد', g0.gold); }
    if (await p.evaluate(() => /بابل|\{[^}]+\}/.test(document.body.innerText))) { badText++; if (badText === 1) console.log('   ⚠ نص بابلي أو رمز غير مستبدل ظاهر:', await p.evaluate(() => { const t = document.body.innerText, i = t.search(/بابل|\{[^}]+\}/); return t.slice(Math.max(0, i - 40), i + 40); })); }
    const vis = await p.locator('#lesson:not([hidden])').count();
    if (vis) { // نوافذ عمّ سالم: نمرّ بها كما يفعل لاعب جادّ
      if (await p.locator('#lesson [data-act=lstart][data-g=' + (process.env.START || 'sa') + ']').count()) await p.locator('#lesson [data-act=lstart][data-g=' + (process.env.START || 'sa') + ']').click();
      if (await p.locator('#lesson [data-act=evch][data-g=no]').count()) { await p.locator('#lesson [data-act=evch][data-g=no]').click(); await p.waitForTimeout(60); continue; }
      if (await p.locator('#lesson [data-act=lchar][data-g=trader]').count()) await p.locator('#lesson [data-act=lchar][data-g=trader]').click();
      else if (await p.locator('#lesson [data-act=lans]:not([disabled])').count()) { const idx = await p.evaluate(() => { const t = document.querySelector('#lesson .bub b'); const q = t && t.textContent; const E = __game.E.LS; const all = E.LEVELS.flatMap(l => l.quiz).concat(E.ZAKAT_LESSON.quiz); const f = all.find(x => q && q.includes(x.q)); return f ? f.ok : 0; }); await p.locator('#lesson [data-act=lans][data-g="' + idx + '"]').click(); }
      else if (await p.locator('#lesson [data-act=lrep]').count()) await p.locator('#lesson [data-act=lrep]').first().click();
      else if (await p.locator('#lesson [data-act=lnext]').count()) await p.locator('#lesson [data-act=lnext]').first().click();
      else if (await p.locator('#lesson [data-act=zpay]').count()) await p.locator('#lesson [data-act=zpay]').click();
      else if (await p.locator('#lesson [data-act=lclose]').count()) await p.locator('#lesson [data-act=lclose]').first().click();
      else await p.keyboard.press('Escape');
      await p.waitForTimeout(60); continue;
    }
    if (await p.locator('#modal .mbox').count()) await p.keyboard.press('Escape');
    const mis = await p.locator('#mission [data-act=mrun]').count();
    if (!mis && process.env.V && same === 0) console.log('   ?? no mission:', JSON.stringify(await p.evaluate(() => ({ rest: __game.S.learn.rest, lvl: __game.S.learn.level, intro: __game.S.learn.intro, hold: __game.S.learn.hold, up: __game.S.learn.up, les: !document.getElementById('lesson').hidden, txt: document.getElementById('lesson').textContent.slice(0, 80) }))));
    if (!mis) { await p.evaluate(() => __game.E.A && __game.renderAll(true)); await p.waitForTimeout(80); if (++same > 8) break; continue; }
    const txt = (await p.locator('#mission .bub').first().textContent()).replace(/\s+/g, ' ');
    if (await p.locator('#mission [data-act=restskip]').count()) { restCards++; if (restCards === 1) await p.screenshot({ path: '/tmp/shots/rest-card.png' }); }
    msgs.add(txt.slice(0, 60)); if (process.env.V) console.log('   [' + g0.lv + '] يوم ' + g0.day + ' · ' + txt.slice(0, 120) + ' ' + JSON.stringify(await p.evaluate(() => ({g: __game.S.learn.goods, mixed: __game.S.learn.ev.mixed, dest: __game.S.learn.m}))));
    // تظليل المرشد في م١–٣
    if (g0.lv <= 3) { spotChecks++; if (await p.locator('#mission [data-act=mrun].tut-hl').count() === 1) spotOk++; }
    // بوابات الثروة (طور ٢ و٣ و٤): نحقن الرصيد كي لا يطول الاختبار
    const note = await p.locator('#mission .small:has-text("ℹ️")').count();
    if (note) { const need = await p.evaluate(() => __game.E.PHASE_AT[Math.min(3, __game.S.phase)]); await p.evaluate(n => { __game.S.player.gold += n; }, need + 2000); await p.waitForTimeout(50); }
    await p.locator('#mission [data-act=mrun]').click(); await p.waitForTimeout(120);
    let g1 = await G();
    if (g1.left > 0) {
      for (let w = 0; w < 160 && g1.left > 0; w++) {
        await p.evaluate(() => { __game.S.pause = false; __game.setSpeed(3); }); await p.waitForTimeout(200);
        if (await p.locator('#lesson:not([hidden]) [data-act=lclose]').count()) await p.locator('#lesson [data-act=lclose]').first().click().catch(() => {});
        g1 = await G();
      }
      await p.evaluate(() => __game.setSpeed(0)); await p.waitForTimeout(150); g1 = await G();
      if (g1.left > 0) { ok(false, 'لم تصل القافلة خلال المهلة'); break; }
    }
    if (sig(g1) === sig(g0)) { if (++same >= 3) { ok(false, 'لا تقدّم بعد ٣ ضغطات في م' + g0.lv + ': ' + txt.slice(0, 80)); break; } } else same = 0;
  }
  const f = await G();
  ok(f.lv >= 11, 'اكتملت المستويات العشرة بزرّ المهمة فقط (المستوى ' + f.lv + '، اليوم ' + f.day + '، خطوات ' + steps + ')');
  const dbt = await p.evaluate(() => ({ left: Math.round(__game.S.player.famDebt.left), vault: Math.round(__game.S.player.vault || 0), tab: __game.S.learn.tab.length, patience: __game.S.player.famDebt.patience }));
  console.log('   الدَّين عند النهاية:', JSON.stringify(dbt));
  ok(dbt.left < 1500 && dbt.vault > 0, 'الخطة سدّدت من الدَّين وملأت الحصّالة أثناء الرحلة');
  ok(badText === 0, 'لا «بابل» ولا رموز غير مستبدلة في أي نص ظهر للاعب (' + badText + ')');
  ok(restCards >= 3, 'ظهرت بطاقة التمرين مع زر «أنا جاهز» بين المراحل (' + restCards + ')');
  ok(spotChecks === 0 || spotOk / spotChecks > 0.9, 'تظليل 👆 على زرّ المهمة في م١–٣ (' + spotOk + '/' + spotChecks + ')');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.slice(0, 3).join(' | '));
  console.log('   رسائل المهمة المختلفة:', msgs.size);
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
