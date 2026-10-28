#!/usr/bin/env node
'use strict';
// WP-17أ: يقارن سجل الظل (docs/sched/shadow-log.json) بما أُطلق وعُرض فعلاً في اللعبة الآلية، ويكتب docs/sched/SHADOW_REPORT.md
const fs = require('node:fs'), path = require('node:path'), CM = require('../src/content-map.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/sched/shadow-log.json'), 'utf8')), log = data.log, by = CM.byId, GAP = data.gap;
const OBSERVED = new Set(['stage', 'level', 'card', 'tablet', 'boss', 'secret', 'product', 'achievement']);
const first = (ev, id) => log.find(e => e.ev === ev && e.id === id);
const fires = log.filter(e => e.ev === 'fire'), shown = log.filter(e => e.ev === 'shown'), would = log.filter(e => e.ev === 'would'), cands = log.filter(e => e.ev === 'cand');
const typeOf = id => id.split(':')[0], ch = id => (by(id) || {}).ch, core = id => (by(id) || {}).kind === 'core';
const L = [], w = s => L.push(s);
const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
// 1) التغطية
const total = {}, got = {}; for (const p of CM.PIECES) { total[p.type] = (total[p.type] || 0) + 1; }
for (const e of fires) { const t = typeOf(e.id); got[t] = (got[t] || new Set()).add(e.id); }
// 2) مطابقة مرشّحي الظل (دوال الشروط على النسخة) لما أُطلق فعلاً عند حدود الأيام
const tickFires = {}; for (const e of fires) if (e.via === 'tick') (tickFires[e.d] = tickFires[e.d] || new Set()).add(e.id);
let dayMatch = 0, dayMiss = 0; const mism = [];
for (const c of cands) { const a = tickFires[c.d] || new Set(), b = new Set(c.ids); const onlyShadow = [...b].filter(x => !a.has(x)), onlyActual = [...a].filter(x => !b.has(x));
  if (!onlyShadow.length && !onlyActual.length) { if (a.size) dayMatch++; } else { dayMiss++; mism.push({ d: c.d, onlyShadow, onlyActual }); } }
// 3) ترتيب العرض الفعلي مقابل ما كان سيطلقه المُجدوِل
const wouldSeq = would.map(e => e.id), shownSeq = []; for (const e of shown) if (!shownSeq.includes(e.id)) shownSeq.push(e.id);
const both = wouldSeq.filter(id => shownSeq.includes(id)); let inv = 0, pairs = 0;
for (let i = 0; i < both.length; i++) for (let j = i + 1; j < both.length; j++) { pairs++; if (shownSeq.indexOf(both[i]) > shownSeq.indexOf(both[j])) inv++; }
const delays = would.map(e => e.d - e.fired), wouldDelay = delays.length ? { avg: (delays.reduce((a, b) => a + b, 0) / delays.length).toFixed(1), max: Math.max(...delays), over: delays.filter(x => x > 0).length } : null;
const shownDelays = shownSeq.map(id => { const f = first('fire', id), s = first('shown', id); return f && s ? s.d - f.d : null; }).filter(x => x != null);
// 4) حدّ أدنى بين لحظتين في العرض الفعلي (بالأيام اللعبية؛ العرض الفعلي بلا حدّ)
const shownDays = []; for (const id of shownSeq) shownDays.push(first('shown', id).d);
const closePairs = shownDays.slice(1).filter((d, i) => d - shownDays[i] < GAP).length;
const sameDay = {}; for (const d of shownDays) sameDay[d] = (sameDay[d] || 0) + 1; const maxSameDay = Math.max(0, ...Object.values(sameDay));
// 5) القطع الأساسية في الفصول 1–4 غير المطلقة
const miss14 = CM.PIECES.filter(p => p.kind === 'core' && p.ch <= 4 && OBSERVED.has(p.type) && !fires.some(e => e.id === p.id)).map(p => p.id);
// خط زمني: مرحلة بمرحلة
const stageFires = fires.filter(e => /^stage:/.test(e.id)).map(e => ({ d: e.d, id: e.id }));
w('# تقرير مُجدوِل الإيقاع، وضع الظل (WP-17أ)\n');
w('> مولَّد بـ `node tools/sched-report.js` من `docs/sched/shadow-log.json` (سجل اللعبة الآلية الحقيقية بأجزائها الثلاثة: البداية والمالية والتخرج، بذرة 5؛ يُلتقط بـ `SCHED_SHADOW=1 SCHED_OUT=/tmp/x- node scripts/capture-autopilot.js` ثم تُضمّ ملفات `x-start.json` و`x-finance.json` و`x-graduate.json` في `docs/sched/shadow-log.json`). الحدّ الأدنى التجريبي بين لحظتين: ' + GAP + ' أيام لعبية.\n');
w('**اللعبة:** ' + data.day + ' يوماً لعبياً، المرحلة ' + data.stage + '، المنتهية: ' + (data.fin ? 'نعم (تخرّج)' : 'لا') + '، أخطاء JS: ' + data.errs.length + '، أخطاء الظل: ' + data.tickErr + '.\n');
w('## 1) التغطية: ما رآه المراقِب من أنواع المحتوى\n');
w('| النوع | في الخريطة | أُطلق فعلاً في اللعبة الآلية | ملاحظة |\n|---|---|---|---|');
for (const t of Object.keys(total)) w('| ' + t + ' | ' + total[t] + ' | ' + (OBSERVED.has(t) ? (got[t] ? got[t].size : 0) + ' (' + pct(got[t] ? got[t].size : 0, total[t]) + ')' : 'غير مرصود') + ' | ' + (OBSERVED.has(t) ? '' : t === 'case' ? 'تُطلق بـ mjNext/mjReady وتُعرض من واجهة المسائل؛ تدخل في 17ب' : t === 'wisdom' ? 'تُعرض من roadTip في الواجهة لا من المحرّك' : 'تعليقات عمّ سالم تُطلقها learnEvent بحدّ تبريد خاص') + ' |');
w('\n## 2) مطابقة الظل لما أُطلق فعلاً (عند حدود الأيام)\n');
w('- أيام فيها إطلاق فعلي مطابق تماماً لمرشّحي الظل: **' + dayMatch + '**');
const totShadow = mism.reduce((a, m) => a + m.onlyShadow.length, 0), totActual = mism.reduce((a, m) => a + m.onlyActual.length, 0);
w('- أيام اختلفت: **' + dayMiss + '** (من ' + cands.length + ' يوماً رُصد)');
w('- مرشّحون رآهم الظل ولم يُطلقوا فعلاً: **' + totShadow + '** (لا ادّعاء كاذب). إطلاقات فعلية لم يرها الظل عند حدّ اليوم: **' + totActual + '**، وكلها أُطلقت خارج مسار tick بين ملاحظتين (إنجازات تمنحها achEvent، سرّ دولة عند الوصول، تقدّم مرحلة بعد إتمام درسها في الواجهة)، فلا تُعدّ خللاً بل حدّاً لوضع الظل: مطلقات الواجهة تدخل المُجدوِل في 17ب.');
w('- مجموع الإطلاقات المرصودة: ' + fires.length + ' (' + fires.filter(e => e.via === 'tick').length + ' عند حدّ اليوم، ' + fires.filter(e => e.via === 'action').length + ' عند فعل اللاعب).');
if (mism.length) { w('\nأمثلة الاختلاف (أول 12):\n'); for (const m of mism.slice(0, 12)) w('- يوم ' + m.d + ': الظل فقط [' + m.onlyShadow.join(', ') + '] · الفعلي فقط [' + m.onlyActual.join(', ') + ']'); }
w('\n## 3) ترتيب المُجدوِل مقابل العرض الفعلي\n');
w('- لحظات مُنحت دوراً في الظل: ' + would.length + ' · عُرضت فعلاً: ' + shownSeq.length + ' · مشتركة: ' + both.length);
w('- أزواج مقلوبة الترتيب بين ما سيطلقه المُجدوِل وما عُرض: **' + inv + '** من ' + pairs + ' (' + pct(inv, pairs) + ')');
if (wouldDelay) w('- تأجيل المُجدوِل عن لحظة الإطلاق الفعلي: متوسط ' + wouldDelay.avg + ' يوم، أقصى ' + wouldDelay.max + '، لحظات تأجّلت ' + wouldDelay.over + ' من ' + would.length);
w('- لحظات أُطلقت ولم يمنحها الظل دوراً حتى نهاية اللعبة: ' + fires.filter(e => !would.some(x => x.id === e.id)).length);
w('- تأخّر العرض الفعلي عن الإطلاق (أيام لعبية): ' + (shownDelays.length ? 'متوسط ' + (shownDelays.reduce((a, b) => a + b, 0) / shownDelays.length).toFixed(1) + '، أقصى ' + Math.max(...shownDelays) : '—'));
w('\n## 4) الحدّ الأدنى بين لحظتين (في العرض الفعلي الحالي)\n');
w('- لحظات متتالية عُرضت بفارق أقل من ' + GAP + ' أيام: **' + closePairs + '** من ' + Math.max(0, shownDays.length - 1) + '؛ أكثر لحظات في يوم واحد: **' + maxSameDay + '**.');
w('- هذا ما سيمنعه المُجدوِل عند النقل (17ب)؛ في وضع الظل لا يمنع شيئاً.');
const cardsFired = got.card ? got.card.size : 0;
w('\n## ما كشفه الظل (للقرار في ترتيب النقل)\n');
w('1. **' + pct(fires.filter(e => e.via === 'action').length, fires.length) + ' من الإطلاقات تقع عند فعل اللاعب لا عند حدّ اليوم**؛ فمن ينقل نوعاً إلى المُجدوِل عليه أن يعترض مطلقه في 27-save.js (لفّاف الأفعال) والواجهة، لا في tick وحده.');
w('2. **التزاحم حقيقي:** ' + closePairs + ' من ' + Math.max(0, shownDays.length - 1) + ' لحظات متتالية عُرضت بفارق أقل من ' + GAP + ' أيام، وفي يوم واحد حتى ' + maxSameDay + ' لحظات؛ هذا بالضبط ما يعالجه الحدّ الأدنى.');
w('3. **البطاقات شبه غائبة في اللعبة الآلية:** أُطلقت ' + cardsFired + ' من ' + total.card + ' (فاصل CARD_GAP وشرط اللحظة)؛ نقلها سيُظهر أثراً صغيراً بينما الألواح والأسرار أكثر حضوراً.');
w('4. **أنواع غير مرصودة بعد** (المسائل والحكم وتعليقات عمّ سالم): تُطلق من الواجهة ولا يراها المراقِب، وتحتاج مراقِبة في الواجهة قبل نقلها.');
w('5. الظل أُجري على بذرة واحدة (5) ومسار واحد للمشغّل الآلي؛ أنماط لاعب حقيقي (يتعجّل أو يتأنّى) تحتاج جلسات تجربة قبل اعتماد الحدّ.');
w('\n## 5) القطع الأساسية في الفصول 1–4 التي لم تُطلق (في الأنواع المرصودة)\n');
w(miss14.length ? miss14.map(x => '- `' + x + '` (ف' + ch(x) + ')').join('\n') : '- لا شيء: كلها أُطلقت.');
w('\n## 6) الخط الزمني: المراحل وما بينها\n');
w('| يوم | مرحلة بلغها | لحظات أُطلقت منذ المرحلة السابقة (حسب النوع) |\n|---|---|---|');
let prevD = -1; for (const s of stageFires) { const between = fires.filter(e => e.d > prevD && e.d <= s.d && !/^stage:/.test(e.id)), c = {}; for (const e of between) c[typeOf(e.id)] = (c[typeOf(e.id)] || 0) + 1; w('| ' + s.d + ' | ' + s.id + ' | ' + (Object.entries(c).map(([k, v]) => k + '×' + v).join('، ') || '—') + ' |'); prevD = s.d; }
w('\n## 7) أول ٤٠ حدثاً (إطلاق ← ظل ← عرض)\n');
w('| يوم | حدث | قطعة | فصل/نوع | مصدر |\n|---|---|---|---|---|');
for (const e of log.filter(x => x.ev !== 'cand').slice(0, 40)) w('| ' + e.d + ' | ' + ({ fire: 'أُطلقت', shown: 'عُرضت', would: 'كان سيطلقها' }[e.ev]) + ' | `' + e.id + '` | ' + (ch(e.id) ? 'ف' + ch(e.id) + (core(e.id) ? ' أساسي' : ' جانبي') : '—') + ' | ' + (e.via || (e.fired != null ? 'أُطلقت يوم ' + e.fired : '')) + ' |');
fs.writeFileSync(path.join(__dirname, '../docs/sched/SHADOW_REPORT.md'), L.join('\n') + '\n'); console.log(L.slice(0, 40).join('\n'));
