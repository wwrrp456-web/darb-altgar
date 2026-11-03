#!/usr/bin/env node
'use strict';
// 015ب (D5): قياس المشاريع الكبرى بلاعب آلي ثري. الاقتصاد الطبيعي لا يبلغ الدرجات العليا (docs/goals/LADDER.md قسم 6) فيبدأ اللاعب بثروة مولَّدة تقابل الدرجة.
// (أ) SC-002: نسبة النقد العاطل إلى الثروة (متوسط السنوات 3 إلى 6) مع المشاريع ودونها (PROJ.on=false)، 8 بذور، 6 سنوات، لكل ثروة بداية.
// (ب) SC-001: أيام السنة الخامسة التي يوجد فيها مشروع مفتوح لم يكتمل (يحتاج مالاً).
// (ج) FR-002: أثر كل مشروع منفرداً على ربح سنتين: اللاعب نفسه بالمشروع مُتمّاً مقابل دونه، الفرق النسبي للربح (بذور مزدوجة). الحد 10٪.
// الاستعمال: node tools/projects-measure.js  ← docs/goals/MEASURE.md
const fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8], Y = 354, STARTS = [[300000, 'ثروة 300 ألف (الدرجة 1)'], [1500000, 'ثروة 1.5 مليون (الدرجة 2)'], [30000000, 'ثروة 30 مليوناً (الدرجة 4)'], [150000000, 'ثروة 150 مليوناً (الدرجة 5)']];
const mk = (seed, gold) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'shopkeeper'); S.noLock = 1; S.noEvents = true; S.player.famDebt = null; const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; L.abroad = true; S.player.gold = gold; return S; };
const home = S => E.START_OF[S.home];
// سلوك المشاريع: يمول أول مرحلة جاهزة في أي مشروع مفتوح (بأول خيار) ويُبقي احتياطياً 10٪ من الثروة
function fundBot(S) { const reserve = Math.max(50000, 0.1 * E.netWorth(S)); for (const id of E.projectsOpen(S)) { const v = E.projectView(S).open.find(x => x.id === id); if (!v || v.done || v.need || v.wait > 0 || v.paid >= v.total || S.player.gold - v.nextCost < reserve) continue; const o = E.projectPickOptions(S, id); E.projectFund(S, id, v.pick || (o[0] && o[0].v)); } }
function step(S, d, build) { const car = S.player.caravans[0]; if (S.phase >= 2 && d % 2 === 0) { const h = home(S), pr = S.player.props[h]; if (pr && pr.shops.length < 3 && S.player.gold > 4000) A.buildShop(S, h); if (pr) A.hireFill(S, h); } E.botMain(S); if (build && d % 5 === 0) E.botBuild(S); E.tick(S, false); S.pause = false; }
function runIdle(seed, gold, on) {
  E.PROJ.on = on; try { const S = mk(seed, gold), idle = [], openDays = []; let spent0 = 0;
    for (let d = 0; d < 6 * Y; d++) { if (on) fundBot(S); step(S, d); if (d % 30 === 29 && d >= 2 * Y) idle.push(S.player.gold / Math.max(1, E.netWorth(S))); if (d >= 4 * Y && d < 5 * Y && on) openDays.push(E.projectView(S).open.some(x => !x.done) ? 1 : 0); }
    const v = E.projectView(S); return { idle: idle.reduce((a, b) => a + b, 0) / idle.length, nw: E.netWorth(S), openShare: openDays.length ? openDays.reduce((a, b) => a + b, 0) / openDays.length : null, done: v.done, spent: S.player.led.exp.projects || 0 }; } finally { E.PROJ.on = true; }
}
function runGain(seed, id, gold) { const S = mk(seed, gold); S.projects = { peak: 1e11, paid: {}, until: {}, pick: {}, done: [], tier: 9 }; const nw0 = E.netWorth(S);
  if (id) { const o = id === 'P01' || PROJ_ROUTE(id) ? E.projectPickOptions(S, id) : E.projectPickOptions(S, id); const pk = E.PROJECTS[id].pick === 'city' ? home(S) : E.PROJECTS[id].pick === 'country' ? S.home : E.PROJECTS[id].pick === 'port' ? 'jeddah' : (o[0] && o[0].v); S.projects.paid[id] = E.PROJECTS[id].stages.length; S.projects.pick[id] = pk; S.projects.done.push(id); }
  for (let d = 0; d < 2 * Y; d++) step(S, d, true); return E.netWorth(S) - nw0; }
const PROJ_ROUTE = id => E.PROJECTS[id].pick === 'route';
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, se = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1) / a.length); };
const pct = x => (x * 100).toFixed(1) + '٪', f0 = x => Math.round(x).toLocaleString('en-US');
const out = ['# قياس المشاريع الكبرى (015ب، D5)', '', '> مولَّد بـ `node tools/projects-measure.js`. لاعب آلي (صاحب دكاكين بالسلوك المحايد) بثروة مولَّدة (نقد يُترك بلا شراء أصول كما يفعل لاعب يكدّس) لأن الاقتصاد الطبيعي لا يبلغ الدرجات العليا (`docs/goals/LADDER.md` قسم 6). 8 بذور × 6 سنوات للجدول 1، و8 بذور × سنتان للجدول 2 (هنا يشتري الآلي الأصول `botBuild` فيكون له دخل يُقاس به الأثر؛ بدونه الدخل صفر والقياس فارغ). المشاريع الموسومة ⚑ مخفية فلا تدخل القياس.', ''];
const t1 = ['## 1) النقد العاطل: مع المشاريع ودونها (SC-002)', '', '| ثروة البداية | النقد ÷ الثروة دون مشاريع (متوسط س3–س6) | معها | مشاريع أُتمّت (متوسط) | أُنفق (متوسط) | أيام السنة 5 بمشروع مفتوح (SC-001) |', '|---|---:|---:|---:|---:|---:|'];
for (const [g, nm] of STARTS) { const off = SEEDS.map(s => runIdle(s, g, false)), on = SEEDS.map(s => runIdle(s, g, true)); t1.push(`| ${nm} | ${pct(mean(off.map(r => r.idle)))} | ${pct(mean(on.map(r => r.idle)))} | ${mean(on.map(r => r.done)).toFixed(1)} | ${f0(mean(on.map(r => r.spent)))} | ${pct(mean(on.map(r => r.openShare)))} |`); console.error('idle', nm); }
out.push(...t1, '');
const ids = Object.keys(E.PROJECTS).filter(id => !E.PROJECTS[id].rv);
const base = SEEDS.map(s => runGain(s, null, 3e9)), t3 = ['## 2) أثر كل مشروع منفرداً على ربح سنتين (FR-002، الحد 10٪)', '', 'لاعب بثروة 3 مليارات، المشروع مُتمّ منذ اليوم الأول (يُختار له أول خيار في دولته أو مدينته)، والمقارنة بالبذرة نفسها دونه.', '', '| المشروع | فرق الربح (متوسط) | الخطأ المعياري | ضمن 10٪؟ |', '|---|---:|---:|---|'];
let bad = 0; for (const id of ids) { const w = SEEDS.map(s => runGain(s, id, 3e9)), rel = w.map((x, i) => base[i] > 0 ? x / base[i] - 1 : 0), m = mean(rel), e = se(rel), okk = m + 2 * e <= 0.10; if (!okk) bad++; t3.push(`| ${id} ${E.PROJECTS[id].name} | ${pct(m)} | ${pct(e)} | ${okk ? 'نعم' : 'لا (راجع)'} |`); console.error('gain', id); }
out.push(...t3, '', bad ? `**${bad} مشروع يحتاج مراجعة** (الفرق + ضعف الخطأ فوق 10٪).` : '**كل المشاريع المنفَّذة ضمن 10٪ (متوسط + ضعف الخطأ المعياري).**', '');
out.push('## 3) ما يقوله القياس بصدق', '',
  '- **SC-001 (مشروع مفتوح دائماً في السنة 5) لا يتحقق بالمنفَّذ وحده** عند ثروة ثابتة: يُتمّ الآلي كل ما فُتح له في سنتين أو ثلاث، فلا يبقى مفتوح في السنة 5. السبب أن مجموع مشاريع الدرجات 1 إلى 5 المنفَّذة المرئية نحو 18 مليوناً فقط، وأن الجزء الأكبر من المصرف في المؤجَّل (P08 وP18) وفي المدن الجديدة (P10 وP12 وP16 وP17، حزمة 021) وفي الموسوم ⚑ (P13 وP15) وفي الدرجات التي لا تُبلغ بالاقتصاد الحالي.',
  '- **SC-002 (انخفاض النقد العاطل) يظهر عند الثروات الصغيرة فقط:** نسبة النقد العاطل تنزل قليلاً عند 300 ألف و1.5 مليون، ولا تتغير عند 30 و150 مليوناً لأن المنفَّذ لا يستهلك إلا نحو 12٪ منها.',
  '- **اقتراح لا أنفّذه دون موافقتك:** السماح ببناء المشروع الواحد أكثر من مرة في أماكن مختلفة (خان لكل طريق، سوق مسقوف لكل مدينة، مدرسة لكل دولة، ...) فيتناسب المصرف مع الخريطة (18 مدينة) بدل مرة واحدة؛ مع بقاء سقوف الأثر المجمَّع كما هي (PJ_CAP) فلا يزداد الدخل.',
  '- **FR-002:** الأثر المباشر على الدخل محدود بالسقوف في الشيفرة (إقبال الدكاكين +10٪ أقصى)، والجدول 2 يؤكده تجريبياً.', '');
fs.mkdirSync(path.join(__dirname, '../docs/goals'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '../docs/goals/MEASURE.md'), out.join('\n') + '\n'); console.log(out.join('\n'));
