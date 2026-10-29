#!/usr/bin/env node
'use strict';
// WP-17ب: لعبة آلية حقيقية واحدة من البداية إلى التخرج (بذرة 5، البطاقات ظاهرة) والمُجدوِل في وضع التسجيل؛ للمقارنة قبل/بعد.
// الاستعمال: node scripts/sched-run.js <ملف الخرج.json> [off]   (off = مفاتيح الأنواع كلها مطفأة = السلوك القديم)
const fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const root = path.join(__dirname, '..'), [out, mode] = process.argv.slice(2);
if (!out) throw Error('الاستعمال: node scripts/sched-run.js out.json [off]');
(async () => {
  const browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(root, 'index.html') + '?learn=1&seed=5&cards=1'); await p.waitForFunction(() => !!window.__game);
  await p.evaluate(off => { const g = __game, E = g.E, tick = E.tick; E.tick = S => tick(S, false); E.schedReset(window.ContentMap.PIECES); E.SCHED.on = true; if (off) for (const k of ['cards', 'tablets', 'secrets', 'boss', 'cases', 'tips', 'react']) E.SCHED[k] = false; g.apStart({ mode: 'fresh', seed: 5, speed: 'max', target: 'grad', inject: true }); }, mode === 'off');
  let st;
  for (let i = 0; i < 2400; i++) {
    await p.waitForTimeout(250);
    st = await p.evaluate(() => {
      const g = __game, a = g.AP, s = g.S;
      if (s.learn.stage === 20 && s.zakat && !s.zakat.due && (!g.learnNext() || g.learnNext().k === 'zakat')) { let guard = 0; while (!s.zakat.due && !(s.life && s.life.pending) && guard++ < 1200) { g.E.A.work(s); g.E.tick(s); s.pause = false; } a.lvSteps = 0; g.renderAll(true); }
      const zd = document.querySelector('#lesson [data-act=zdefer]'); if (zd && !document.querySelector('#lesson [data-act=zpay]')) zd.click();
      return { fin: a.finished, stuck: a.stuck, reason: a.reason, stage: s.learn.stage, day: s.day };
    });
    if (st.fin || st.stuck) break;
  }
  console.log(JSON.stringify(st));
  const data = await p.evaluate(() => ({ log: __game.E.SCHED.log, gap: __game.E.SCHED.GAP_DAYS, tickErr: __game.E.SCHED.tickErr, day: __game.S.day, stage: __game.S.learn.stage }));
  data.errs = errs; data.fin = st.fin; data.stuck = st.stuck; fs.writeFileSync(out, JSON.stringify(data));
  console.log('saved', data.log.length, 'events, day', data.day, 'errs', errs.length); await browser.close();
  if (st.stuck || errs.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
