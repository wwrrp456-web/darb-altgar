#!/usr/bin/env node
'use strict';
// 053ب §6: يجمع مخرجات tools/balance-measure.js (--years 5 لكل مستوى) في جدول ب1–ب9. الاستعمال: node tools/balance-b-table.js <dir>
// الملفات في <dir>: on-{calm,normal,hard}.json (invest بصدمات، --ch leave)، pay-*.json (--ch pay)، off-*.json (بلا صدمات)، sa-on-*/sa-off-* (--region sa)، spread-on-*/spread-off-* (--region spread)، y8-*.json (8 سنوات)
const fs = require('node:fs'), path = require('node:path');
const dir = process.argv[2], LV = ['calm', 'normal', 'hard'];
const rd = f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).rows; } catch (e) { return null; } };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null, med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const f2 = x => x == null ? '—' : (+x).toFixed(2), pc = x => x == null ? '—' : (x * 100).toFixed(1) + '٪';
const out = {};
for (const lv of LV) {
  const on = rd('on-' + lv + '.json'), pay = rd('pay-' + lv + '.json'), r = {};
  if (on) {
    const n = on.length; r.n = n;
    r.b1 = mean(on.map(x => x.warByYear.slice(1).reduce((a, b) => a + b, 0) / (x.warByYear.length - 1)));
    r.b1a = on.reduce((a, x) => a + x.warByYear[0], 0);
    r.b3_10 = on.filter(x => x.dd10 > 0).length; r.b3_20 = on.filter(x => x.dd20 > 0).length;
    r.b4 = med(on.filter(x => x.firstLed != null).map(x => x.firstLed)); r.b4n = on.filter(x => x.firstLed != null).length;
    r.b5 = med(on.filter(x => x.firstCountry != null).map(x => x.firstCountry)); r.b5n = on.filter(x => x.firstCountry != null).length;
    const yrs = on[0].warByYear.length; r.b7 = on.reduce((a, x) => a + x.chN, 0) / (n * yrs); r.b7n = on.reduce((a, x) => a + x.chN, 0);
    r.b7exp = on.reduce((a, x) => a + x.chLog.length, 0);
    r.idle = mean(on.map(x => x.ctrl && x.ctrl.at(-1) ? x.ctrl.at(-1).idle : null).filter(x => x != null));
    r.warLoss = mean(on.map(x => x.warHitLost + x.warExp)); r.refused = mean(on.map(x => x.refusedWar));
    r.lostPerYear = mean(on.map(x => x.lostN / yrs));
  }
  if (pay && on) { r.b8leave = mean(on.map(x => x.lostN)); r.b8pay = mean(pay.map(x => x.lostN)); r.b9 = mean(pay.flatMap(x => x.chLog.filter(c => c.act === 'pay').map(c => c.cost / Math.max(1, c.nw)))); r.b9n = pay.reduce((a, x) => a + x.chPaid, 0); }
  const so = rd('sa-on-' + lv + '.json'), sf = rd('sa-off-' + lv + '.json'), po = rd('spread-on-' + lv + '.json'), pf = rd('spread-off-' + lv + '.json');
  if (so && sf) r.b2 = mean(so.map(x => x.incAll)) / mean(sf.map(x => x.incAll)) - 1;
  if (po && pf) r.b2a = mean(po.map(x => x.incAll)) / mean(pf.map(x => x.incAll)) - 1;
  const y8 = rd('y8-' + lv + '.json'); if (y8) { r.b6 = y8.filter(x => x.fiveDay != null).length; r.b6med = med(y8.filter(x => x.fiveDay != null).map(x => x.fiveDay)); r.b6n = y8.length; }
  out[lv] = r;
}
console.log(JSON.stringify(out, null, 1));
const T = (k, fmt = f2) => LV.map(l => fmt(out[l][k])).join(' | ');
console.log('\n| # | مبتدئ | متوسط | عالٍ |\n|---|---|---|---|');
for (const [k, n, fm] of [['b1', 'ب1 حروب/سنة (س2–5)'], ['b1a', 'ب1أ حروب السنة الأولى', x => x], ['b2', 'ب2 أثر الصدمات والحرب (دولة، بلا تكافل)', pc], ['b2a', 'ب2أ (3 دول بتكافل)', pc], ['b3_10', 'ب3 بذور بحلقة ≥10٪', x => x], ['b3_20', 'ب3 بذور بحلقة ≥20٪', x => x], ['b4', 'ب4 أول سوق مقاد (وسيط)', x => x], ['b4n', 'ب4 عدد البذور', x => x], ['b5', 'ب5 أول دولة كاملة (وسيط)', x => x], ['b5n', 'ب5 عدد البذور', x => x], ['b6', 'ب6 بذور الدول الخمس', x => x], ['b7', 'ب7 تحديات/سنة', f2], ['b8leave', 'ب8 مفقودة (leave)', f2], ['b8pay', 'ب8 مفقودة (pay)', f2], ['b9', 'ب9 مدفوع÷ثروة', pc], ['idle', 'نقد عاطل÷ثروة س5', pc], ['warLoss', 'خسارة الحرب (ريال)', x => x == null ? '—' : Math.round(x)], ['refused', 'رحلات رُفضت', f2]]) console.log('| ' + n + ' | ' + T(k, fm || f2) + ' |');
