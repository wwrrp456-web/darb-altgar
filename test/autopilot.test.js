// التشغيل التلقائي للمطوّر داخل اللعبة: node test/autopilot.test.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const URL = 'file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=5';
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
  const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(2200);
  const save0 = await p.evaluate(() => localStorage.getItem('darb-v3') || '');
  await p.evaluate(() => __game.apStart({ mode: 'fresh', seed: 5, speed: 'max', target: 'grad', inject: true }));
  let st = null; for (let i = 0; i < 400; i++) { await p.waitForTimeout(500); st = await p.evaluate(() => ({ fin: __game.AP.finished, stuck: __game.AP.stuck, reason: __game.AP.reason, steps: __game.AP.steps, lv: __game.S.learn.level, day: __game.S.day })); if (st.fin) break; }
  console.log('   ', JSON.stringify(st));
  ok(st.fin && !st.stuck && st.lv >= 11, 'يلعب من لعبة جديدة حتى التخرج بلا تعثّر (يوم ' + st.day + '، خطوات ' + st.steps + ')');
  ok(await p.locator('#apbar').count() === 1 && /اكتمل/.test(await p.locator('#apbar').innerText()), 'شريط المراقبة يعرض الاكتمال');
  ok(/تقرير التشغيل التلقائي/.test(await p.evaluate(() => __game.apReport())) && (await p.evaluate(() => __game.apReport())).split('\n').length > 8, 'التقرير جاهز للنسخ وفيه سجلّ الأفعال');
  const save1 = await p.evaluate(() => localStorage.getItem('darb-v3') || '');
  ok(save1 === save0, 'لم يمسّ لعبتك المحفوظة (لا حفظ أثناء التشغيل)');
  // اللعب الحر لسنة
  await p.evaluate(() => { __game.AP.target = 'y1'; __game.AP.finished = false; __game.AP.stuck = false; __game.AP.on = true; __game.AP.speed = 'max'; __game.AP.same = 0; __game.AP.steps = 0; __game.apStart({ mode: 'current', speed: 'max', target: 'y1' }); });
  for (let i = 0; i < 240; i++) { await p.waitForTimeout(500); st = await p.evaluate(() => ({ fin: __game.AP.finished, stuck: __game.AP.stuck, reason: __game.AP.reason, yrs: __game.S.yr ? __game.S.yr.n : -1, day: __game.S.day })); if (st.fin) break; }
  console.log('   ', JSON.stringify(st));
  ok(st.fin && !st.stuck && st.yrs >= 1, 'يكمل حولاً من اللعب الحر (' + st.reason + ')');
  // كاشف التعثر: نافذة لا تُغلق
  await p.evaluate(() => { const g = __game; g.S.learn.cq = []; g.S.learn.up = []; g.AP.finished = false; });
  ok(errs.length === 0, 'بلا أخطاء JS ' + errs.join('|'));
  await b.close(); console.log(fails ? fails + ' فشل' : 'كلها نجحت'); process.exit(fails ? 1 : 0);
})();
