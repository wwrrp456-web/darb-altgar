#!/usr/bin/env node
'use strict';
// WP-17ب: يقارن سجلَّي لعبتين آليتين (قبل النقل/بعده) ويكتب docs/sched/BEFORE_AFTER.md. الاستعمال: node tools/sched-compare.js before.json after.json
const fs = require('node:fs'), path = require('node:path'), args = process.argv.slice(2), APPEND = args.includes('--append'), CASES = args.includes('--cases'), [bf, af, TITLE = CASES ? '# قبل/بعد نقل المسائل والتعليقات والحِكم إلى المُجدوِل (WP-17ب-3)' : '# قبل/بعد نقل البطاقات إلى المُجدوِل (WP-17ب-1)'] = args.filter(a => a !== '--append' && a !== '--cases');
const ld = f => JSON.parse(fs.readFileSync(f, 'utf8')), A = ld(bf), B = ld(af), GAP = A.gap || 2;
// WP-17ب-3 (--cases): المسائل (case) والتعليقات (react) والحِكم (tip). الاستعمال: node tools/sched-compare.js --cases --append before.json after.json
if (CASES) {
  const MOM = /^(stage|tablet|boss|secret|card):/, mom = D => { const rd = {}, fd = {}; for (const e of D.log) { if (e.ev === 'cdelay') rd[e.id] = e.d; if (e.ev === 'fire' && !(e.id in fd)) fd[e.id] = e.d; } return Object.keys(fd).filter(id => MOM.test(id)).map(id => ({ id, d: rd[id] != null ? rd[id] : fd[id] })); };
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '0.0', mx = a => a.length ? Math.max(...a) : 0;
  const cm = D => { const ms = mom(D), cs = D.log.filter(e => e.ev === 'case'), delay = cs.map(c => c.d - c.due), gap = cs.map(c => Math.min(99, ...ms.map(x => Math.abs(x.d - c.d)))), close = cs.filter((c, i) => gap[i] < GAP && !c.cap);
    const rs = D.log.filter(e => e.ev === 'react'), ts = D.log.filter(e => e.ev === 'tip');
    return { n: cs.length, ids: cs.map(c => c.id), dAvg: avg(delay), dMax: mx(delay), minGap: cs.length ? Math.min(...gap) : 0, closeN: close.length, capN: cs.filter(c => c.cap).length, rShown: rs.filter(e => !e.drop).length, rDrop: rs.filter(e => e.drop).length, tShown: ts.filter(e => !e.drop).length, tDrop: ts.filter(e => e.drop).length, days: D.day }; };
  const D2 = D => { const ms = mom(D); return D.log.filter(e => e.ev === 'case' && !e.cap).flatMap(c => ms.filter(x => Math.abs(x.d - c.d) < GAP).map(x => c.id + ' (يوم ' + c.d + ') مع ' + x.id + ' (يوم ' + x.d + ')')); };
  const a = cm(A), b = cm(B), row = (n, x, y) => '| ' + n + ' | ' + x + ' | ' + y + ' |', pct = (x, y) => y ? (100 * x / y).toFixed(0) + '%' : '—';
  const lostCases = a.ids.filter(x => !b.ids.includes(x));
  const L = [TITLE + '\n', '> مولَّد بـ `node tools/sched-compare.js --cases` من لعبتين آليتين حقيقيتين بالبذرة نفسها (٥): «قبل» بمفاتيح الرجوع السبعة كلها مطفأة، و«بعد» بالافتراضي. الفاصل ' + GAP + ' أيام وسقف التأخير 5.\n', '| المقياس | قبل | بعد |\n|---|---|---|',
    row('أيام اللعبة حتى التخرج', a.days, b.days), row('مسائل مجلس السوق أُعلنت', a.n, b.n), row('تأخير إعلان المسألة عن استحقاقها: متوسط (أيام)', a.dAvg, b.dAvg), row('تأخير إعلان المسألة: أقصى (أيام؛ السقف 5)', a.dMax, b.dMax),
    row('**مسائل أُعلنت بفارق أقل من ' + GAP + ' أيام من لحظة محتوى (عدا السقف)**', '**' + a.closeN + ' من ' + a.n + '**', '**' + b.closeN + ' من ' + b.n + '**'), row('مسائل أُعلنت عند السقف', a.capN, b.capN), row('أقل فارق بين مسألة ولحظة محتوى (أيام)', a.minGap, b.minGap),
    row('تعليقات عمّ سالم معروضة', a.rShown, b.rShown), row('تعليقات أُسقطت في يوم لحظة', 0, b.rDrop), row('نسبة المعروض بعد/قبل (الشرط ≥ 80٪)', '100%', pct(b.rShown, a.rShown)),
    row('حِكم الطريق معروضة (مرة لكل رحلة)', a.tShown, b.tShown), row('حِكم أُسقطت في يوم لحظة', 0, b.tDrop), '',
    '- مسائل أُعلنت «قبل» ولم تُعلن «بعد»: ' + (lostCases.length ? lostCases.join('، ') : '**لا شيء**'),
    ...(b.closeN ? ['- مسائل «بعد» القريبة من لحظة: ' + D2(B).join('، ') + ' (المراحل لا تتأخر أبداً؛ فإن خرجت المرحلة في اليوم نفسه بعد إعلان المسألة في ترتيب tick فلا يملك المُجدوِل تقديمها).'] : []),
    '- **SC-001** (صفر مسألة بفارق أقل من ' + GAP + ' عدا السقف): ' + (b.closeN === 0 ? '**محقق**' : '**غير محقق (' + b.closeN + ')**') + '. **SC-002** (كل مستحق أُعلن): ' + (b.n >= a.n * 0.95 && !lostCases.length ? '**محقق**' : 'راجع: ' + a.n + ' قبل، ' + b.n + ' بعد') + '. **قصة ٢** (المعروض ≥ 80٪): ' + (b.rShown >= 0.8 * a.rShown ? '**محقق**' : '**غير محقق**') + '.',
    '- ملاحظة: المسار بعد الأولى قد يتشعّب لأن تأجيل المسألة يغيّر توقيت ما بعدها؛ «المعروض» للتعليقات هو ما اجتاز قرار العرض (الوضع والتحذير) فعلاً.'];
  const out = path.join(__dirname, '../docs/sched/BEFORE_AFTER.md'); if (APPEND && fs.existsSync(out)) fs.appendFileSync(out, '\n---\n\n' + L.join('\n') + '\n'); else fs.writeFileSync(out, L.join('\n') + '\n'); console.log(L.join('\n')); process.exit(0);
}
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
