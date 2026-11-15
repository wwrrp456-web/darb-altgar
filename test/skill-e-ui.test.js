'use strict';
// 035هـ واجهة وكيل الإقليم بالدرجات على 390: بطاقة الكفاءة داخل بطاقة الوكيل، سطر النقل الساري وزر الإلغاء، زرّا التوزيع بالتظليل والملخص بالأرقام،
// بطاقات «المطلوب» (نقل الحد، التوزيع بالأداء، رفع الحد) بأرقامها وظهور الاختيار والتنفيذ بالنقرة فقط، الوصول ≤ نقرتين، لا تمرير أفقي. (بطاقة المكافأة موقوفة مع T054.)
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/guided-10.json'), 'utf8')).raw, BASE = 'file://' + path.join(__dirname, '../index.html'), ok = m => console.log('OK   ' + m);
const STATE = () => { const { S } = __game; ['tq', 'eq', 'bq', 'csq', 'fq', 'up', 'sq', 'cq', 'rq', 'stageUp'].forEach(k => S.learn[k] = []); S.learn.datePend = false; S.player.gold = S.player.wallet.sar = 400000; S.phase = 4; S.learn.level = Math.max(S.learn.level, 11); };
const SETUP = () => { const { S, E } = __game, A = E.A, P = S.player;
  for (const c of ['riyadh', 'jeddah']) { if (!E.shopsOf(S, c).length && !A.buildShop(S, c).ok) throw Error('shop ' + c); P.props[c].mgr = { id: S.nextId++, rank: 3, lv: 2, wage: 40, days: 100, since: S.day - 100, audit: S.day, late: 0, policy: { pay: true, report: false, restock: true, pricing: false, limit: 0, every: 'daily' } }; }
  if (!E.agentOf(S, 'sa') && !A.hireAgent(S, 'sa').ok) throw Error('agent'); const ra = E.agentOf(S, 'sa');
  ra.sk = { g: 5, xp: 999, m: 1, wk: 0, spec: {}, home: null, since: 0 }; delete ra.mode; delete ra.shift; delete ra.fundDay;
  const h = (c, n) => { P.props[c].hist = Array.from({ length: 7 }, (_, i) => ({ d: S.day - 6 + i, rev: 100, net: n })); }; h('riyadh', 20); h('jeddah', 0); P.fixedEma = 0; S.zakat = undefined;
  ra.since = S.day - 200; ra.fundDay = S.day; A.agentPolicy(S, 'sa', 50, false); ra.alloc = { riyadh: 100, jeddah: 100 }; };
const mk = async (b, w, q) => { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ': ' + e.message));
  await p.addInitScript(r => { if (!localStorage.getItem('darb-v3')) localStorage.setItem('darb-v3', r); }, raw); await p.goto(BASE + q); await p.waitForFunction(() => !!window.__game);
  if (await p.locator('#coverGo').count()) { await p.locator('#coverGo').click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate(STATE); await p.evaluate(() => { __game.E.RAG.on = true; }); await p.evaluate(SETUP); await p.waitForTimeout(300); return p; };
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), errors = [];
(async () => {
  const b = await chromium.launch(), p = await mk(b, 390, '?player=1&seed=5');
  await p.evaluate(() => { __game.ui.tab = __game.ui.tab || {}; __game.ui.tab.office = 'today'; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(500);
  // 1) بطاقات «المطلوب» في «اليوم» (نقرة واحدة من الرئيسية إلى المكتب ثم الاختيار)
  const cardOf = k => p.locator('#screen .dask[data-dask^="rag:' + k + '"]');
  for (const k of ['shift', 'perf', 'fund']) a.equal(await cardOf(k).count(), 1, 'بطاقة ' + k);
  await cardOf('shift').locator('.dhd').click(); await p.waitForTimeout(200); const st = await cardOf('shift').innerText();
  a.ok(st.includes('نقل جزء من الحد') && st.includes('10٪') && st.includes('10 ريال') && st.includes('28 يوماً') || /28/.test(st), 'نص النقل بأرقامه: ' + st);
  a.ok(st.includes('انقل 10') && st.includes('مجموع الحدود ثابت'), 'خيار النقل وأثره: ' + st);
  await cardOf('perf').locator('.dhd').click(); await p.waitForTimeout(200); const pt = await cardOf('perf').innerText(); a.ok(pt.includes('70٪') && pt.includes('30٪') && pt.includes('وزّع بالحاجة والربح') && pt.includes('أبقِ التوزيع بالحاجة'), pt);
  await cardOf('fund').locator('.dhd').click(); await p.waitForTimeout(200); const ft = await cardOf('fund').innerText(); a.ok(ft.includes('رفعه إلى') && ft.includes('لا يُمس'), ft);
  a.equal(await wide(p), false, 'لا تمرير أفقي في «اليوم»');
  // 2) التنفيذ بالاختيار فقط: قبله لا شيء، وبعده الرقم وظهور الاختيار
  const before = await p.evaluate(() => ({ ...__game.E.agentOf(__game.S, 'sa').alloc, shift: __game.E.agentOf(__game.S, 'sa').shift, mode: __game.E.agentOf(__game.S, 'sa').mode, pool: __game.E.agentOf(__game.S, 'sa').pool }));
  a.ok(before.shift === undefined && before.mode === undefined && before.pool === 50, 'لا تنفيذ قبل النقرة');
  await cardOf('perf').locator('.dopt[data-oid="perf"]').click(); await p.waitForTimeout(250);
  a.equal(await p.evaluate(() => __game.E.agentOf(__game.S, 'sa').mode), 'perf', 'اختير التوزيع بالأداء');
  const sel = p.locator('#screen .dask[data-dask^="rag:perf"] .dopt.on'); a.ok((await sel.count()) >= 1 || (await cardOf('perf').count()) === 0, 'الخيار المختار مظلَّل أو انتهت البطاقة بعد إظهار النتيجة');
  await p.waitForTimeout(900); a.equal(await cardOf('perf').count(), 0, 'لا بطاقة بعد الاختيار');
  await cardOf('fund').locator('.dhd').click().catch(() => {}); await cardOf('fund').locator('.dopt[data-oid="raise"]').click(); await p.waitForTimeout(250);
  const pool = await p.evaluate(() => __game.E.agentOf(__game.S, 'sa').pool); a.ok(pool >= 100, 'رُفع الحد بنقرة اللاعب: ' + pool);
  await p.waitForTimeout(900); await cardOf('shift').locator('.dhd').click().catch(() => {}); await cardOf('shift').locator('.dopt[data-oid="move"]').click(); await p.waitForTimeout(250);
  const sh = await p.evaluate(() => { const ra = __game.E.agentOf(__game.S, 'sa'); return ra.shift && { ...ra.shift, sum: ra.alloc.riyadh + ra.alloc.jeddah }; }); a.ok(sh && sh.from === 'jeddah' && sh.to === 'riyadh', 'نقل بالنقرة');
  // 3) بطاقة الوكيل: الكفاءة والنقل الساري وزرّا التوزيع بالتظليل والملخص
  await p.evaluate(() => { __game.ui.tab.office = 'mgmt'; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(500);
  const card = p.locator('.skillcard[data-skill="وكيل الإقليم"]'); a.equal(await card.count(), 1, 'بطاقة الكفاءة داخل بطاقة الوكيل'); await card.scrollIntoViewIfNeeded(); a.ok((await card.innerText()).includes('شيخ الصنعة'));
  const line = p.locator('[data-rag-shift]'); a.equal(await line.count(), 1, 'سطر النقل الساري'); a.ok((await line.innerText()).includes('حتى يوم') && (await line.innerText()).includes('ألغِ النقل'));
  const per = p.locator('[data-act="ragmode"][data-v="perf"]'), need = p.locator('[data-act="ragmode"][data-v="need"]'); a.equal(await p.locator('[data-act="ragmode"][aria-pressed="true"]').count(), 1, 'مختار واحد مظلَّل'); a.equal(await per.getAttribute('aria-pressed'), 'true'); a.ok((await per.boundingBox()).height >= 44, 'لمس ≥ 44');
  a.ok((await p.locator('[data-rag-sum]').innerText()).includes('التوزيع الآن:'), 'ملخص بالأرقام');
  await need.click(); await p.waitForTimeout(250); a.equal(await p.locator('[data-act="ragmode"][data-v="need"][aria-pressed="true"]').count(), 1, 'بالحاجة مظلَّل'); a.equal(await p.evaluate(() => __game.E.agentOf(__game.S, 'sa').mode), 'need');
  await p.locator('[data-act="ragshiftoff"]').click(); await p.waitForTimeout(250); a.equal(await p.evaluate(() => __game.E.agentOf(__game.S, 'sa').shift), undefined, 'ألغِ النقل'); a.equal(await p.locator('[data-rag-shift]').count(), 0);
  a.equal(await wide(p), false, 'لا تمرير أفقي في بطاقة الوكيل');
  // 4) المطفأ: لا بطاقات ولا سطور
  await p.evaluate(() => { __game.E.RAG.on = false; __game.go('office'); __game.renderAll(true); }); await p.waitForTimeout(400); a.equal(await p.locator('.skillcard[data-skill="وكيل الإقليم"], [data-rag-sum], [data-rag-shift]').count(), 0, 'مطفأ: لا شيء'); a.equal(await p.locator('#screen .dask[data-dask^="rag:"]').count(), 0);
  a.deepEqual(errors, [], 'لا أخطاء JS: ' + errors.join(' | ')); ok('وكيل الإقليم بالدرجات (الواجهة) على 390'); await b.close(); console.log('PASS skill-e-ui');
})().catch(e => { console.error(e); process.exit(1); });
