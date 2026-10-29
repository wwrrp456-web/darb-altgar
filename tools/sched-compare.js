#!/usr/bin/env node
'use strict';
// WP-17ب: يقارن سجلَّي لعبتين آليتين (قبل النقل/بعده) ويكتب docs/sched/BEFORE_AFTER.md. الاستعمال: node tools/sched-compare.js before.json after.json
const fs = require('node:fs'), path = require('node:path'), [bf, af] = process.argv.slice(2);
const ld = f => JSON.parse(fs.readFileSync(f, 'utf8')), A = ld(bf), B = ld(af), GAP = A.gap || 2;
const m = D => {
  const fires = D.log.filter(e => e.ev === 'fire'), shown = [], seen = new Set(); for (const e of D.log) if (e.ev === 'shown' && !seen.has(e.id)) { seen.add(e.id); shown.push(e); }
  const isM = id => /^(stage|tablet|boss|secret|card):/.test(id), sm = shown.filter(e => isM(e.id));
  const fd = {}; for (const e of fires) if (!(e.id in fd)) fd[e.id] = e.d;
  const gaps = sm.slice(1).map((e, i) => e.d - sm[i].d), close = gaps.filter(g => g < GAP).length, perDay = {}; for (const e of sm) perDay[e.d] = (perDay[e.d] || 0) + 1;
  const sd = sm.map(e => e.d - fd[e.id]).filter(x => !isNaN(x)), cd = D.log.filter(e => e.ev === 'cdelay').map(e => e.delay);
  const cardFires = fires.filter(e => e.id.startsWith('card:')), cardShown = shown.filter(e => e.id.startsWith('card:'));
  const cardClose = cardShown.filter(c => sm.some(o => o !== c && o.id !== c.id && Math.abs(o.d - c.d) < GAP && o.d !== undefined)).length;
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '0.0';
  return { days: D.day, fires: fires.length, momentsShown: sm.length, close, pairs: gaps.length, maxDay: Math.max(0, ...Object.values(perDay)), showDelayAvg: avg(sd), showDelayMax: sd.length ? Math.max(...sd) : 0, cardsFired: cardFires.length, cardsShown: cardShown.length, cardIds: new Set(cardFires.map(e => e.id)), cardDelayAvg: avg(cd), cardDelayMax: cd.length ? Math.max(...cd) : 0, cardDelayN: cd.length, cardClose };
};
const cdPos = B.log.filter(e => e.ev === 'cdelay' && e.delay > 0).length, a = m(A), b = m(B), lost = [...a.cardIds].filter(x => !b.cardIds.has(x)), extra = [...b.cardIds].filter(x => !a.cardIds.has(x));
const row = (n, x, y) => '| ' + n + ' | ' + x + ' | ' + y + ' |';
const L = ['# قبل/بعد نقل البطاقات إلى المُجدوِل (WP-17ب-1)\n', '> مولَّد بـ `node tools/sched-compare.js` من لعبتين آليتين حقيقيتين بالبذرة نفسها (٥) بأجزائها الثلاثة: «قبل» بمفتاح الرجوع `SCHED.cards=false`، و«بعد» بالافتراضي. الفاصل ' + GAP + ' أيام وسقف التأخير 5.\n',
  '| المقياس | قبل | بعد |\n|---|---|---|',
  row('أيام اللعبة حتى التخرج', a.days, b.days), row('لحظات محتوى عُرضت (مراحل/ألواح/زعماء/أسرار/بطاقات)', a.momentsShown, b.momentsShown),
  row('لحظات متتالية بفارق أقل من ' + GAP + ' أيام', a.close + ' من ' + a.pairs, b.close + ' من ' + b.pairs), row('أكثر لحظات في يوم واحد', a.maxDay, b.maxDay),
  row('بطاقات أُطلقت / عُرضت', a.cardsFired + ' / ' + a.cardsShown, b.cardsFired + ' / ' + b.cardsShown), row('بطاقات عُرضت بفارق أقل من ' + GAP + ' من لحظة أخرى', a.cardClose, b.cardClose),
  row('تأخير إطلاق البطاقة عن موعدها الأصلي: متوسط (أيام)', '0.0', b.cardDelayAvg), row('تأخير إطلاق البطاقة: أقصى (أيام؛ السقف 5)', '0', b.cardDelayMax), row('بطاقات تأخّرت فعلاً (تأخير > 0)', '0', cdPos),
  row('تأخر العرض عن الإطلاق: متوسط (أيام)', a.showDelayAvg, b.showDelayAvg), row('تأخر العرض عن الإطلاق: أقصى', a.showDelayMax, b.showDelayMax), '',
  '- بطاقات أُطلقت «قبل» ولم تُطلق «بعد»: ' + (lost.length ? lost.join('، ') : '**لا شيء**'), '- بطاقات أُطلقت «بعد» وليست في «قبل»: ' + (extra.length ? extra.join('، ') : 'لا شيء'),
  '- ملاحظة: المسار بعد الأولى قد يتشعّب لأن تأجيل بطاقة يغيّر توقيت ما بعدها؛ والقاعدة «لا بطاقة تضيع» مثبتة في `test/sched-cards.test.js` (مؤجَّلة تُعرض ولو زال شرطها).'];
fs.writeFileSync(path.join(__dirname, '../docs/sched/BEFORE_AFTER.md'), L.join('\n') + '\n'); console.log(L.join('\n'));
