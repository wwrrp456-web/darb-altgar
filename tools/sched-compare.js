#!/usr/bin/env node
'use strict';
// WP-17ب: يقارن سجلَّي لعبتين آليتين (قبل النقل/بعده) ويكتب docs/sched/BEFORE_AFTER.md. الاستعمال: node tools/sched-compare.js before.json after.json
const fs = require('node:fs'), path = require('node:path'), args = process.argv.slice(2), APPEND = args.includes('--append'), [bf, af, TITLE = '# قبل/بعد نقل البطاقات إلى المُجدوِل (WP-17ب-1)'] = args.filter(a => a !== '--append');
const ld = f => JSON.parse(fs.readFileSync(f, 'utf8')), A = ld(bf), B = ld(af), GAP = A.gap || 2;
const m = D => {
  const fires = D.log.filter(e => e.ev === 'fire'), shown = [], seen = new Set(); for (const e of D.log) if (e.ev === 'shown' && !seen.has(e.id)) { seen.add(e.id); shown.push(e); }
  const isM = id => /^(stage|tablet|boss|secret|card):/.test(id), sm = shown.filter(e => isM(e.id));
  const fd = {}; for (const e of fires) if (!(e.id in fd)) fd[e.id] = e.d;
  const rd = {}; for (const e of D.log) if (e.ev === 'cdelay') rd[e.id] = e.d; const av = Object.keys(fd).filter(isM).map(id => ({ id, d: rd[id] != null ? rd[id] : fd[id] })).sort((x, y) => x.d - y.d);
  const agaps = av.slice(1).map((e, i) => e.d - av[i].d), aclose = agaps.filter(g => g < GAP).length, aday = {}; for (const e of av) aday[e.d] = (aday[e.d] || 0) + 1;
  const gaps = sm.slice(1).map((e, i) => e.d - sm[i].d), close = gaps.filter(g => g < GAP).length, perDay = {}; for (const e of sm) perDay[e.d] = (perDay[e.d] || 0) + 1;
  const sd = sm.map(e => e.d - fd[e.id]).filter(x => !isNaN(x)), cd = D.log.filter(e => e.ev === 'cdelay').map(e => e.delay);
  const cardFires = fires.filter(e => e.id.startsWith('card:')), cardShown = shown.filter(e => e.id.startsWith('card:'));
  const cardClose = cardShown.filter(c => sm.some(o => o !== c && o.id !== c.id && Math.abs(o.d - c.d) < GAP && o.d !== undefined)).length;
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '0.0';
  return { aclose, apairs: agaps.length, amaxDay: Math.max(0, ...Object.values(aday)), days: D.day, fires: fires.length, momentsShown: sm.length, close, pairs: gaps.length, maxDay: Math.max(0, ...Object.values(perDay)), showDelayAvg: avg(sd), showDelayMax: sd.length ? Math.max(...sd) : 0, cardsFired: cardFires.length, cardsShown: cardShown.length, cardIds: new Set(Object.keys(fd).filter(isM)), cardDelayAvg: avg(cd), cardDelayMax: cd.length ? Math.max(...cd) : 0, cardDelayN: cd.length, cardClose };
};
const cdPos = B.log.filter(e => e.ev === 'cdelay' && e.delay > 0).length, a = m(A), b = m(B), lost = [...a.cardIds].filter(x => !b.cardIds.has(x)), extra = [...b.cardIds].filter(x => !a.cardIds.has(x));
const row = (n, x, y) => '| ' + n + ' | ' + x + ' | ' + y + ' |';
const L = [TITLE + '\n', '> مولَّد بـ `node tools/sched-compare.js` من لعبتين آليتين حقيقيتين بالبذرة نفسها (٥) بأجزائها الثلاثة: «قبل» بمفاتيح الرجوع كلها مطفأة (`SCHED.cards/tablets/secrets/boss=false`)، و«بعد» بالافتراضي. الفاصل ' + GAP + ' أيام وسقف التأخير 5.\n',
  '| المقياس | قبل | بعد |\n|---|---|---|',
  row('أيام اللعبة حتى التخرج', a.days, b.days), row('لحظات محتوى عُرضت (مراحل/ألواح/زعماء/أسرار/بطاقات)', a.momentsShown, b.momentsShown),
  row('**لحظات متتالية متاحة للاعب بفارق أقل من ' + GAP + ' أيام** (يوم الإتاحة: إطلاق المراحل، وخروج الباقي من المُجدوِل)', '**' + a.aclose + ' من ' + a.apairs + '**', '**' + b.aclose + ' من ' + b.apairs + '**'), row('أكثر لحظات متاحة في يوم واحد', a.amaxDay, b.amaxDay),
  row('(عرض المشغّل الآلي) متتالية بفارق أقل من ' + GAP + ' أيام', a.close + ' من ' + a.pairs, b.close + ' من ' + b.pairs), row('(عرض المشغّل الآلي) أكثر لحظات في يوم واحد', a.maxDay, b.maxDay),
  row('بطاقات أُطلقت / عُرضت', a.cardsFired + ' / ' + a.cardsShown, b.cardsFired + ' / ' + b.cardsShown), row('بطاقات عُرضت بفارق أقل من ' + GAP + ' من لحظة أخرى', a.cardClose, b.cardClose),
  row('تأخير اللحظة المنقولة عن موعدها الأصلي: متوسط (أيام)', '0.0', b.cardDelayAvg), row('تأخير اللحظة المنقولة: أقصى (أيام؛ السقف 5)', '0', b.cardDelayMax), row('لحظات تأخّرت فعلاً (كل الأنواع المنقولة، تأخير > 0)', '0', cdPos),
  row('تأخر العرض عن الإطلاق: متوسط (أيام)', a.showDelayAvg, b.showDelayAvg), row('تأخر العرض عن الإطلاق: أقصى', a.showDelayMax, b.showDelayMax), '',
  '- لحظات (كل الأنواع المنقولة) أُطلقت «قبل» ولم تُطلق «بعد»: ' + (lost.length ? lost.join('، ') : '**لا شيء**'), '- لحظات أُطلقت «بعد» وليست في «قبل»: ' + (extra.length ? extra.join('، ') : 'لا شيء'),
  '- **قراءة المقياس:** «متاحة للاعب» هي ما يصنعه المُجدوِل فعلاً (متى تدخل اللحظة قائمة الانتظار). سطرا «عرض المشغّل الآلي» لا يعكسه لأن المشغّل يفتح الدروس الجانبية دفعة واحدة كلما بلغ نافذة (قد تنتظر في القائمة أياماً)، فيتجمّع العرض مهما تباعدت الإتاحة؛ ولاعب حقيقي يرى شارة «دروس جانبية» بعددٍ أقل لأن المؤجَّل لا يدخل العدّاد حتى يخرج.',
  '- ملاحظة: المسار بعد الأولى قد يتشعّب لأن تأجيل بطاقة يغيّر توقيت ما بعدها؛ والقاعدة «لا بطاقة تضيع» مثبتة في `test/sched-cards.test.js` (مؤجَّلة تُعرض ولو زال شرطها).'];
const per = {}; for (const e of B.log.filter(x => x.ev === 'cdelay')) { const t = e.id.split(':')[0]; (per[t] = per[t] || []).push(e.delay); }
L.push('', '**تأخير العرض بعد النقل حسب النوع (أيام لعبية؛ السقف 5):**', '', '| النوع | عدد | متوسط | أقصى | تأخّر فعلاً |', '|---|---|---|---|---|');
for (const t of Object.keys(per)) L.push('| ' + t + ' | ' + per[t].length + ' | ' + (per[t].reduce((x, y) => x + y, 0) / per[t].length).toFixed(1) + ' | ' + Math.max(...per[t]) + ' | ' + per[t].filter(x => x > 0).length + ' |');
const stageDelay = B.log.filter(e => e.ev === 'cdelay' && /^(stage|level)/.test(e.id)).length; L.push('', '- المراحل والمستويات: ' + (stageDelay ? 'تأخّرت (خلل)' : 'لم تتأخر أبداً (خارج المُجدوِل)') + '.');
const out = path.join(__dirname, '../docs/sched/BEFORE_AFTER.md'); if (APPEND && fs.existsSync(out)) fs.appendFileSync(out, '\n---\n\n' + L.join('\n') + '\n'); else fs.writeFileSync(out, L.join('\n') + '\n'); console.log(L.join('\n'));
