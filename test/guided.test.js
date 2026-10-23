// لعب كامل باتّباع زرّ «مهمة عمّ سالم» فقط من أول لعبة حتى التخرّج: node test/guided.test.js [seed]
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const seed = +process.argv[2] || 5, b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  await p.goto('file://' + path.join(__dirname, '../index.html?learn=1&seed=' + seed)); await p.waitForTimeout(2300);
  const G = () => p.evaluate(() => { const S = __game.S, E = __game.E, c = S.player.caravans[0]; return { lv: S.learn.level, stage: S.learn.stage, day: S.day, gold: Math.round(S.player.gold), city: c.city, left: c.left, cargo: Math.round(E.loadOf(c)), ev: Object.values(S.learn.ev).reduce((a, b) => a + b, 0), trips: S.player.trips, phase: S.phase }; });
  const sig = g => [g.lv, g.day, g.gold, g.city, g.left, g.cargo, g.ev, g.trips].join('|');
  const trace = []; let lastLv = 0, lvSteps = 0, same = 0, steps = 0, spotChecks = 0, spotOk = 0; let restCards = 0, badText = 0, freeCards = 0, freeSpot = 0; const msgs = new Set();
  while (steps++ < 700) {
    await p.evaluate(() => { __game.setSpeed(0); __game.renderAll(true); });
    if (await p.locator('#agingPanel:not([hidden]) [data-act=lifeack]').count()) { await p.locator('[data-act=lifeack]').click(); continue; }
    if (await p.locator('#agingPanel:not([hidden]) [data-act=liferetire]').count()) { await p.locator('[data-act=liferetire]').click(); continue; }
    if(await p.locator('#lesson:not([hidden]) [data-act=climateclose]').count()){await p.locator('[data-act=climateclose]').click();continue;}
    const g0 = await G(); if (g0.lv >= 11) break;
    const waiting = await p.evaluate(() => __game.E.stageStatus(__game.S)?.waiting && !__game.learnNext());
    if (waiting) {
      await p.evaluate(() => { const {E,S}=__game; S.player.gold += E.stageStatus(S).days * 15; let guard=0; while(E.stageStatus(S)?.waiting && !(S.life && S.life.pending) && guard++<1800) { E.A.work(S); E.tick(S); S.pause=false; } __game.renderAll(true); });
      restCards++; same=0; continue;
    }
    if (g0.stage === lastLv && ++lvSteps > 160) { ok(false, 'علق المستوى ' + g0.lv + ' أكثر من ١٦٠ خطوة'); break; }
    if (g0.stage !== lastLv) { lvSteps = 0; lastLv = g0.stage; console.log('   ← المستوى', g0.lv, 'اليوم', g0.day, 'الرصيد', g0.gold); }
    if (await p.evaluate(() => /بابل|\{[^}]+\}/.test(document.body.innerText))) { badText++; if (badText === 1) console.log('   ⚠ نص بابلي أو رمز غير مستبدل ظاهر:', await p.evaluate(() => { const t = document.body.innerText, i = t.search(/بابل|\{[^}]+\}/); return t.slice(Math.max(0, i - 40), i + 40); })); }
    if (await p.locator('#dlg [data-act=roadok]').count()) { await p.locator('#dlg [data-act=roadok]').click(); await p.waitForTimeout(80); continue; }
    if (await p.locator('#dlg [data-act=roadopt][data-c=pay]').count()) { await p.locator('#dlg [data-act=roadopt][data-c=pay]').first().click(); await p.waitForTimeout(80); continue; }
    const vis = await p.locator('#lesson:not([hidden])').count();
    if (vis) { const k = await p.evaluate(() => document.getElementById('lesson').dataset.kind || ''); if (k && trace[trace.length - 1] !== k) trace.push(k); }
    if (vis) { // نوافذ عمّ سالم: نمرّ بها كما يفعل لاعب جادّ
      if (await p.locator('#lesson [data-act=lstart][data-g=' + (process.env.START || 'sa') + ']').count()) await p.locator('#lesson [data-act=lstart][data-g=' + (process.env.START || 'sa') + ']').click();
      if (await p.locator('#lesson [data-act=evch][data-g=close]').count()) { await p.locator('#lesson [data-act=evch][data-g=close]').click(); await p.waitForTimeout(60); continue; } // مجلس السوق: إغلاق الحكم بعد الإجابة
      if (await p.locator('#lesson .mjopts button').count()) { await p.locator('#lesson .mjopts button').first().click(); await p.waitForTimeout(60); continue; } // مجلس السوق: اختيار أول خيار
      if (await p.locator('#lesson [data-act=evch][data-g=no]').count()) { await p.locator('#lesson [data-act=evch][data-g=no]').click(); await p.waitForTimeout(60); continue; }
      if (await p.locator('#lesson #pname').count()) { await p.fill('#pname', 'ياسر'); await p.locator('#lesson [data-act=lname]').click(); continue; }
      if (await p.locator('#lesson [data-act=datego]').count()) { await p.locator('#lesson [data-act=datego]').click(); continue; }
      if (await p.locator('#lesson [data-act=lchar][data-g=trader]').count()) await p.locator('#lesson [data-act=lchar][data-g=trader]').click();
      else if (await p.locator('#lesson [data-act=lans]:not([disabled])').count()) { const idx = await p.evaluate(() => { const t = document.querySelector('#lesson .bub b'); const q = t && t.textContent; const E = __game.E.LS; const all = __game.E.STAGES.flatMap(l => l.quiz).concat(E.LEVELS.flatMap(l => l.quiz)).concat(E.ZAKAT_LESSON.quiz); const f = all.find(x => q && q.includes(x.q)); return f ? f.ok : 0; }); await p.locator('#lesson [data-act=lans][data-g="' + idx + '"]').click(); }
      else if (await p.locator('#lesson [data-act=lrep]').count()) await p.locator('#lesson [data-act=lrep]').first().click();
      else if (await p.locator('#lesson [data-act=lnext]').count()) await p.locator('#lesson [data-act=lnext]').first().click();
      else if (await p.locator('#lesson [data-act=zpay]').count()) await p.locator('#lesson [data-act=zpay]').click();
      else if (await p.locator('#lesson [data-act=cqa]:not([disabled])').count()) { const ci = await p.evaluate(() => { const id = (document.getElementById('lesson').dataset.kind || '').split(':')[1]; return __game.E.CARDS.CARDS[id].quiz.ok; }); await p.locator('#lesson [data-act=cqa][data-g="' + ci + '"]').click(); }
      else if (await p.locator('#lesson [data-act=lclose]').count()) await p.locator('#lesson [data-act=lclose]').first().click();
      else await p.keyboard.press('Escape');
      await p.waitForTimeout(60); continue;
    }
    if (await p.locator('#modal .mbox').count()) await p.keyboard.press('Escape');
    if (!(await p.locator('#mission [data-act=mrun]').count()) && await p.locator('#mission.free [data-act=mhelp]').count()) {
      freeCards++; if (await p.locator('.tut-hl').count()) freeSpot++; // أثناء التمرين الحر لا تظليل
      await p.evaluate(() => __game.salem(true, 'mission')); await p.locator('#mission [data-act=mhelp]').click(); await p.evaluate(() => __game.salem(false)); await p.waitForTimeout(80);
    }
    const mis = await p.locator('#mission [data-act=mrun]').count();
    if (!mis && process.env.V && same === 0) console.log('   ?? no mission:', JSON.stringify(await p.evaluate(() => ({ rest: __game.S.learn.rest, lvl: __game.S.learn.level, intro: __game.S.learn.intro, hold: __game.S.learn.hold, up: __game.S.learn.up, les: !document.getElementById('lesson').hidden, txt: document.getElementById('lesson').textContent.slice(0, 80) }))));
    if (!mis) { await p.evaluate(() => __game.E.A && __game.renderAll(true)); await p.waitForTimeout(80); if (++same > 8) break; continue; }
    const txt = (await p.locator('#mission .bub').first().textContent()).replace(/\s+/g, ' ');
    if (await p.locator('#mission [data-act=restskip]').count()) { restCards++; if (restCards === 1) await p.screenshot({ path: '/tmp/shots/rest-card.png' }); }
    msgs.add(txt.slice(0, 60)); if (process.env.V) console.log('   [' + g0.lv + '] يوم ' + g0.day + ' · ' + txt.slice(0, 120) + ' ' + JSON.stringify(await p.evaluate(() => ({g: __game.S.learn.goods, mixed: __game.S.learn.ev.mixed, dest: __game.S.learn.m}))));
    // تظليل المرشد في م١–٣
    if (g0.lv <= 3) { spotChecks++; if (await p.locator('.tut-hl').count() === 1) spotOk++; }
    // بوابات الثروة (طور ٢ و٣ و٤): نحقن الرصيد كي لا يطول الاختبار
    const note = await p.locator('#mission .small:has-text("ℹ️")').count();
    if (note) { const need = await p.evaluate(() => __game.E.PHASE_AT[Math.min(3, __game.S.phase)]); await p.evaluate(n => { __game.S.player.gold += n; }, need + 2000); await p.waitForTimeout(50); }
    await p.evaluate(() => __game.salem(true, 'mission')); if (await p.locator('#lesson:not([hidden])').count() || !await p.locator('#mission [data-act=mrun]').isVisible()) { if(process.env.V) console.log('   mission changed:', await p.evaluate(()=>({stage:__game.S.learn.stage,kind:__game.learnNext(),text:document.getElementById('salemPanel').innerText.slice(-300)}))); continue; } await p.locator('#mission [data-act=mrun]').click(); await p.evaluate(() => __game.salem(false)); await p.waitForTimeout(120);
    let g1 = await G();
    if (g1.stage === 21 && g1.day === g0.day && g1.left === 0) { await p.waitForFunction(d => __game.S.day > d || !!__game.learnNext(), g0.day, {timeout:10000}); g1 = await G(); }
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
  ok(freeCards >= 4 && freeSpot === 0, 'اللاعب يُترك حراً في م٢ وم٣ والتمارين: بطاقة «ساعدني» بلا تظليل (' + freeCards + ' مرة، تظليل ' + freeSpot + ')');
  ok(badText === 0, 'لا «بابل» ولا رموز غير مستبدلة في أي نص ظهر للاعب (' + badText + ')');
  ok(restCards >= 3, 'ظهرت فواصل الاستكشاف العمرية بين المراحل (' + restCards + ')');
  ok(spotChecks === 0 || spotOk / spotChecks > 0.9, 'تظليل 👆 على زرّ المهمة في م١–٣ (' + spotOk + '/' + spotChecks + ')');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'لا تمرير أفقي');
  { const lt = await p.evaluate(() => window.__lt || []); trace.length = 0; lt.forEach(k => { if (trace[trace.length - 1] !== k) trace.push(k); }); }
  if (process.env.V) console.log('   تسلسل النوافذ:', trace.join(' › '));
  { // ترتيب أحداث القصة مع عمّ سالم: تصاعدي ولا يعود حدث البداية بعد التقدّم
    const idx = k => trace.indexOf(k), lvls = pre => trace.filter(t => t.startsWith(pre + ':')).map(t => +t.split(':')[1]);
    const asc = a => a.every((v, i) => i === 0 || v === a[i - 1] + 1);
    const ups = lvls('stageup'), intros = lvls('intro');
    ok(trace[0] === 'char', 'أول نافذة هي ترحيب عمّ سالم (' + trace[0] + ')');
    ok(ups.length >= 22 && ups[0] === 1 && asc(ups), 'نوافذ إتمام الدروس تصاعدية دون قفز ولا رجوع: ' + ups.join(','));
    ok(intros.length >= 22 && intros[0] === 1 && asc(intros), 'مقدّمات الدروس تصاعدية دون قفز ولا رجوع: ' + intros.join(','));
    ok(ups.every(n => idx('intro:' + n) < idx('stageup:' + n)) && intros.filter(n => n > 1).every(n => idx('stageup:' + (n - 1)) < idx('intro:' + n)), 'مقدّمة كل درس بعد إتمام السابق وقبل إتمامه هو');
    const uniq = trace.filter(t => /^(secret|csecret|tablet|boss|debtfree):/.test(t)); ok(new Set(uniq).size === uniq.length, 'لا تتكرر نافذة سرّ أو لوح أو حكاية زعيم');
    const bossOk = {}; let bad = '';
    trace.filter(t => t.startsWith('boss:')).forEach(t => { const [c, n] = t.slice(5).split('.'); if ((bossOk[c] || 0) + 1 !== +n) bad = bad || (c + ' فصل ' + n); bossOk[c] = +n; });
    ok(!bad, 'فصول كل زعيم متسلسلة ١ ثم ٢ ثم ٣' + (bad ? ' — خلل: ' + bad : ''));
  }
  ok(errs.length === 0, 'لا أخطاء JS ' + errs.slice(0, 3).join(' | '));
  console.log('   رسائل المهمة المختلفة:', msgs.size);
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
