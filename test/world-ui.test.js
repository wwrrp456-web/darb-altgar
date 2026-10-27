// الدفعة الثالثة (ب): السوق يشرح ما يحدث فيه، الاستعداد للموسم القادم، العالم يتذكر إنجازك: node test/world-ui.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=4';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const vp of [{ width: 390, height: 800 }, { width: 1100, height: 800 }]) {
    const tag = vp.width + 'px: ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(900);
    const clr = () => p.evaluate(() => ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'rq', 'cq'].forEach(k => __game.S.learn[k] = []));
    await p.evaluate(() => { const g = __game, S = g.S; g.E.A.learnSetChar(S, 'trader'); S.learn.level = 11; S.learn.intro = 11; S.learn.free = true; S.player.gold = 50000; g.go('office'); g.renderAll(true); });
    await clr();
    // ٢٣: موسم قريب في المكتب
    const info = await p.evaluate(() => { const g = __game, S = g.S, E = g.E; const nx = E.seasonCalendar(S).find(x => !x.now && !x.info && x.goods); const j = Math.max(0, nx.in - 5); S.day += j; return { name: nx.name, left: nx.in - j }; });
    await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(250);
    ok(await p.locator('.office [data-ofc=season]').count() === 1, tag + 'بطاقة «الاستعداد للموسم» في المكتب (' + info.name + ')');
    const st = await p.locator('.office [data-ofc=season]').innerText();
    ok(st.includes(info.name) && /لا يعني ذلك ربحاً مضموناً/.test(st), tag + 'فيها اسم الموسم وتنبيه عدم ضمان الربح');
    const before = await p.evaluate(() => ({ g: __game.S.player.gold, d: __game.S.day }));
    await p.evaluate(() => document.querySelector('.office [data-ofc=season] [data-act=ofmarket]').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash) === '#market' && await p.evaluate(b0 => __game.S.player.gold === b0.g && __game.S.day === b0.d, before), tag + '«راجع السوق» تفتح السوق دون أثر اقتصادي');
    // ١٢: موسم نشط يظهر في «ما يحدث في السوق»
    const act = await p.evaluate(() => { const g = __game, S = g.S, E = g.E, c = S.cities[S.player.caravans[0].city]; for (const k in E.SEASONS) { const X = E.SEASONS[k]; if (!X.goods || !X.where || !X.where(c)) continue; const cal = E.seasonCalendar(S).find(x => x.k === k); if (!cal) continue; S.day += cal.now ? 0 : cal.in; if (E.seasonsAt(S, S.day).includes(k)) return X.name; } return null; });
    await p.evaluate(() => { __game.go('market'); __game.renderAll(true); }); await clr(); await p.evaluate(() => __game.renderAll(true)); await p.waitForTimeout(250);
    ok(act && await p.locator('.mdet[data-dk=why]').count() === 1, tag + 'بطاقة «ما يحدث في السوق» عند وجود موسم نشط (' + act + ')');
    await p.evaluate(() => { const d = document.querySelector('.mdet[data-dk=why]'); d.open = true; });
    const wt = await p.locator('.mdet[data-dk=why]').innerText();
    ok(act && wt.includes(act) && /عامل محتمل/.test(wt) && /معلومات اليوم/.test(wt), tag + 'فيها اسم الموسم و«عامل محتمل» وحداثة المعلومة (بلا نسب مخترعة)');
    // ٢٠: العالم يتذكر: دكان وسداد دين
    await p.evaluate(() => { const g = __game, S = g.S; const c = S.player.caravans[0].city; S.player.famDebt = S.player.famDebt || { amt0: 1500, left: 1500, plan: false, patience: 100, due: null, mPaid: 0, paid: 0 }; S.player.famDebt.left = 0; S.story = S.story || { flags: {}, cool: {}, quests: {}, cur: null }; S.story.flags['met_boss_' + c] = true; S.story.flags['met_boss'] = true; S.story.cur = null; });
    const hail = await p.evaluate(() => { const g = __game, S = g.S, c = S.player.caravans[0].city, id = c + '_boss'; const r = g.E.A.dlgOpen(S, id); return { ok: r.ok, node: S.story.cur && S.story.cur.node }; });
    ok(hail.ok && hail.node === 'hail_debt', tag + 'زعيم السوق يحيّي من أوفى دَين جدّه (' + hail.node + ')');
    await p.evaluate(() => { const g = __game; g.E.A.dlgChoose(g.S, 0); g.E.A.dlgClose(g.S); });
    const again = await p.evaluate(() => { const g = __game, S = g.S, c = S.player.caravans[0].city; g.E.A.dlgOpen(S, c + '_boss'); const n = S.story.cur.node; g.E.A.dlgClose(S); return n; });
    ok(again !== 'hail_debt', tag + 'التحية لا تتكرر بعد قبولها (' + again + ')');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + 'بلا تمرير أفقي');
  }
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
})();
