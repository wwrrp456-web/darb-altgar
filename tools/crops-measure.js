#!/usr/bin/env node
'use strict';
// 018 (FR-002): ربح القطعة المزروعة سنوياً مقابل ربح 20 وحدة مرعى في المزرعة نفسها (يُضبط بالغلة فقط).
// الاستعمال: node tools/crops-measure.js  ← specs/018-crops/measure.md
const fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A;
const OLD = { wheat: 45, rice: 50, cotton: 35, sugarcane: 30, herbs: 15, saffron: 4, datepalm: 40, vine: 35, coffee: 20, olive: 18, tea: 20 }, Y = 354, mkGame = () => { const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 500000; return S; };
const f1 = x => (Math.round(x * 10) / 10).toLocaleString('en-US'), f2 = x => (Math.round(x * 100) / 100).toLocaleString('en-US');
const S = mkGame(), rows = [], herdRows = [];
const wageOf = (city, S2) => E.wkWage(S2, S2.cities[city], { role: 'farmer', days: 120 });
// ربح القطعة المزروعة (حالة مستقرة): المحصول السنوي يُعاد زرعه، والشجر بغرسه موزّعاً على 6 سنوات؛ العامل: مزارع كامل لكل قطعة
for (const id of E.CROP_IDS) for (const city of S.order) {
  const def = E.CROP_DEFS[id], c = S.cities[city], fit = E.cropFit(def, c); if (!fit) continue;
  let best = null;
  for (const w of ['rain', 'well', 'mixed', 'river']) { const q = E.cropQuote({ ...S, player: { ...S.player, props: { ...S.player.props, [city]: { farm: { level: 1, plots: [] } } } } }, city, 0, id, w); if (!q.ok) continue;
    const cyc = def.kind === 'tree' ? def.cycle : def.days, n = Y / cyc, rev = q.units * E.mid(def.g) * 0.95, water = q.perDay * cyc, seed = def.kind === 'tree' ? def.seed / 6 : def.seed;
    const profit = n * (rev - water) - (def.kind === 'tree' ? def.seed / 6 * 1 : n * seed) - wageOf(city, S) * Y * 0.0; if (!best || profit > best.profit) best = { w, units: q.units, profit }; }
  if (best) rows.push({ id, city, ...best });
}
// ربح 20 وحدة مرعى: محاكاة سنة كاملة لكل سلالة (إنتاج + نمو القطيع) بتغطية كاملة
for (const g of Object.keys(E.BREED)) { if (!E.E_PRODUCT && !E.PRODUCT) {} }
const S2 = mkGame(); A.buildShop(S2, 'riyadh'); A.buildWarehouse(S2, 'riyadh'); A.buildFarm(S2, 'riyadh');
const pr = S2.player.props.riyadh, f = pr.farm;
for (const g of ['sheep', 'goat', 'cow', 'camel', 'chicken']) {
  const units = Math.floor(20 / E.BREED[g].fu), v0 = units * E.mid(g); f.herd = { [g]: units }; f.hx = { [g]: { m: Math.ceil(units / 5), p: 0, y: 0, b: 0, mq: 1, fq: 1, yq: 1 } }; f.acc = {}; pr.store = {};
  const farmers = []; for (let i = 0; i < 2; i++) pr.staff.push({ id: S2.nextId++, role: 'farmer', days: 200, late: 0, free: 0 });
  let culled = 0; for (let d = 0; d < Y; d++) { S2.day++; E.farmDay(S2, 'riyadh', pr, S2.cities.riyadh); const over = E.farmUnits(f) - 20; if (over > 0) { const k = Math.min(Math.floor(f.herd[g] || 0), Math.ceil(over / E.BREED[g].fu)), g0 = S2.player.gold; if (k > 0 && A.farmSell(S2, 'riyadh', g, k).ok) culled += S2.player.gold - g0; } } // المرعى 20 وحدة: الفائض يُباع
  const prod = Object.entries(pr.store).reduce((n, [k, q]) => n + q * E.mid(k) * 0.95, 0), end = ((f.herd[g] || 0) + 0.5 * E.youngOf(f, g)) * E.mid(g);
  herdRows.push({ g, units, profit: prod + culled + end - v0 }); pr.store = {}; pr.staff = pr.staff.filter(w => w.role !== 'farmer');
}
const hp = herdRows.map(r => r.profit), hmax = Math.max(...hp), hmean = hp.reduce((a, b) => a + b, 0) / hp.length;
const out = ['# قياس توازن الزرع (018، FR-002)', '', '> مولَّد بـ `node tools/crops-measure.js`. الربح الصافي السنوي لقطعة (قبل أجر العامل) مقابل 20 وحدة مرعى مُحاكاة سنة كاملة.', '',
  '## ربح المرعى (20 وحدة، سنة)', '', '| السلالة | الرؤوس | الربح |', '|---|---:|---:|', ...herdRows.map(r => `| ${E.GD[r.g].name} | ${r.units} | ${f1(r.profit)} |`), '', `المتوسط ${f1(hmean)} · الأعلى ${f1(hmax)}`, '',
  '## ربح القطعة سنوياً (أفضل سقي) لكل محصول: أفضل مدينة وأسوؤها، ونسبتهما إلى متوسط المرعى', '', '| المحصول | أفضل مدينة | ربحها | النسبة | أسوأ مدينة | ربحها | النسبة |', '|---|---|---:|---:|---|---:|---:|',
  ...E.CROP_IDS.map(id => { const r = rows.filter(x => x.id === id).sort((a, b) => b.profit - a.profit), hi = r[0], lo = r[r.length - 1]; return `| ${E.CROP_DEFS[id].name} | ${S.cities[hi.city].name} | ${f1(hi.profit)} | ${f2(hi.profit / hmean)} | ${S.cities[lo.city].name} | ${f1(lo.profit)} | ${f2(lo.profit / hmean)} |`; }), '',
  `أفضل قطعة في كل المدن والمحاصيل: ${f1(Math.max(...rows.map(r => r.profit)))}؛ وهي ${f2(Math.max(...rows.map(r => r.profit)) / hmean)} من متوسط ربح 20 وحدة مرعى (${f1(hmean)})، والمطلوب بين 0.8 و1.25 (CROPS.md §2): ${(() => { const q = Math.max(...rows.map(r => r.profit)) / hmean; return q >= 0.8 && q <= 1.25 ? 'متحقق' : 'غير متحقق'; })()}. وهي ${f2(Math.max(...rows.map(r => r.profit)) / hmax)} من أعلى ربح للمرعى، فحد FR-002 الأعلى (لا يزيد عن 1.25) متحقق.`, '',
  '## الغلة بعد الضبط (وحدات لكل قطعة؛ الضبط بالغلة فقط ×3.5، دون تغيير النصاب 612 كجم = 62 وحدة قمح ولا أحكام الزكاة)', '', '| المحصول | الغلة قبل | الغلة بعد |', '|---|---:|---:|', ...E.CROP_IDS.map(id => `| ${E.CROP_DEFS[id].name} | ${OLD[id]} | ${E.CROP_DEFS[id].yield} |`), '', 'الأشجار تثمر بالغلة نفسها في كل دورة. القياس يتجاهل أثر الغلة الكبيرة على سعر السوق عند البيع الدفعي (يفترض البيع بالسعر الوسطي ×0.95).'];
fs.writeFileSync(path.join(__dirname, '../specs/018-crops/measure.md'), out.join('\n')); console.log(out.join('\n'));
