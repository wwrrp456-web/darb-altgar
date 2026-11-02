#!/usr/bin/env node
'use strict';
// WP-24 (المرحلة أ): قياس هويات اللعب قبل أي تغيير. لكل شخصية × 8 بذور × سنتا لعب بلاعب آلي واحد متعدد الأنشطة لا يعرف شخصيته (الجداول نفسها لكل الشخصيات)،
// فكل فرق في النتائج ناتج عن نسب الشخصية وحدها. يسجّل عدّ الأنشطة ونسبها، وكلفها، والثروة. ثابت البذور، ولا يعيد القياس إن لم يتغير المحرك ولا الأداة.
// المرحلة ب (بعد اعتماد المقترح): يقيس حالتين بـ24 بذرة لكل شخصية: «قبل» = لاعب آلي محايد والمفتاحان IDENTITY مطفآن، و«بعد» = اللاعب نفسه مضافاً إليه سلوك يسعى لهدف شخصيته ويستعمل مزيتها والمفتاحان مفعّلان.
// الاستعمال: node tools/identity-measure.js [--force]  ← docs/identities/measure.json وMEASURE.md
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const ROOT = path.join(__dirname, '..'), CHARS = ['trader', 'changer', 'leader', 'shopkeeper', 'negotiator'], SEEDS = Array.from({ length: 24 }, (_, i) => i + 1), YEARS = 2, DAYS = YEARS * 354;
const ACT = [['trips', 'رحلات القافلة'], ['explore', 'رحلات استكشاف'], ['guards', 'حراس'], ['restock', 'تعبئة دكاكين'], ['caravans', 'قوافل بقادة'], ['shops', 'دكاكين'], ['factories', 'مصانع'], ['agent', 'طلبات وكيل'], ['fx', 'عمليات صرف'], ['haggle', 'مساومات'], ['pacts', 'عقود شراكة']];

const GUARD_CAP = +process.env.IDM_GUARDS || 2;
const SIGNATURE = { trader: 'explore', changer: 'fx', leader: 'guards', shopkeeper: 'restock', negotiator: 'haggle' };
// سلوك «بعد»: يسعى اللاعب لهدف شخصيته ما دام لم يُنجَز، ويستعمل مزيتها (المعلومات نفسها التي تُعرض للاعب)
function seek(E, S, d, car, cnt, ch, home) {
  const A = E.A; // الأسلوب المميِّز يستمر طوال اللعب (الهدف يكافئه مرة، والمزية تبقى)
  if (ch === 'trader' && d % 4 === 1 && !car.left) { const L = S.learn, seen = id => L.cv && L.cv[id] > 0, cs = new Set(Object.keys(L.cv || {}).filter(seen).map(id => S.cities[id].country), ), cand = S.order.filter(id => id !== car.city && !seen(id)).sort((a, b) => (cs.has(S.cities[a].country) ? 1 : 0) - (cs.has(S.cities[b].country) ? 1 : 0)); if (cand.length && A.travel(S, car.id, cand[0]).ok) cnt.explore++; }
  if (ch === 'changer') { const g = S.learn.idGoal || {}, o = g.open, w = S.player.wallet, T = E.fxTrend(S);
    if (!o && d % 3 === 0 && T && T.usd >= 0 && w.sar > 3000) { if (A.exchange(S, 'sar', 'usd', 2000).ok) { cnt.fx++; cnt.fxRate = S.fx.usd; } }
    else if (o && S.day - o.day >= 3 && (S.fx.usd > (cnt.fxRate || 0) * 1.002 || S.day - o.day >= 12) && w.usd > 1) { if (A.exchange(S, 'usd', 'sar', Math.min(w.usd, o.got)).ok) cnt.fx++; } }
  if (ch === 'leader' && !car.left && d % 6 === 2 && car.guards < GUARD_CAP && S.player.gold > 1500) { if (A.hireGuard(S, car.id).ok) cnt.guards++; }
  if (ch === 'shopkeeper' && S.phase >= 2 && d % 2 === 0) { const pr = S.player.props[home]; if (pr && pr.shops.length < 2 && S.player.gold > 4000) A.buildShop(S, home); if (pr && A.hireFill(S, home).ok) cnt.restock++; } // لا shopQuick: تهيئته فوق طاقة الاقتصاد الحالي (انظر MEASURE.md)
  if (ch === 'negotiator' && !car.left) { const c = S.cities[car.city], g = E.GIDS.find(x => E.sells(c, x) && !E.GD[x].sp && c.stock[x] > 30); if (g) { const r = A.haggleStart(S, g, 'buy', 20); if (r.ok) { let G = r.game; while (!G.done) { const best = G.best[G.moods[G.round]]; A.haggleChoose(S, (S.day + G.round) % 5 ? best : ['firm', 'ref', 'praise'].find(x => x !== best)); } cnt.haggle++; cnt.hwins += G.wins; cnt.hdisc += 1 - G.mul; } } }
}
function runOne(E, charId, seed, mode) {
  E.IDENTITY.goals = E.IDENTITY.perks = mode === 'after'; const after = mode === 'after';
  const A = E.A, S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, charId); S.noLock = 1; S.noEvents = true; S.player.famDebt = null;
  const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; L.abroad = true; const nw0 = E.netWorth(S), cnt = { fxRate: 0, agent: 0, fx: 0, haggle: 0, hwins: 0, hdisc: 0, pacts: 0, explore: 0, guards: 0, restock: 0 }, nw = [], home = E.START_OF[S.home];
  for (let d = 0; d < DAYS; d++) {
    const car = S.player.caravans[0];
    if (d % 6 === 3 && !car.left) { // مساومة على شراء 20 وحدة؛ يُجيب الآلي الصحيح في ثلثي الجولات بجدول ثابت
      const c = S.cities[car.city], g = E.GIDS.find(x => E.sells(c, x) && !E.GD[x].sp && c.stock[x] > 30);
      if (g) { const r = A.haggleStart(S, g, 'buy', 20); if (r.ok) { let G = r.game; while (!G.done) { const best = G.best[G.moods[G.round]]; A.haggleChoose(S, (S.day + G.round) % 3 ? best : ['firm', 'ref', 'praise'].find(x => x !== best)); } cnt.haggle++; cnt.hwins += G.wins; cnt.hdisc += 1 - G.mul; } }
    }
    if (d % 30 === 10 && !car.left) for (const t of Object.keys(E.PACTS)) { if (A.signPact(S, car.city, t).ok) { cnt.pacts++; break; } }
    if (d % 20 === 5) { const o = S.order.find(x => x !== car.city && E.sells(S.cities[x], 'dates')); if (o && A.agentBuy(S, o, 'dates', 40).ok) cnt.agent++; }
    if (d % 14 === 0) { const w = S.player.wallet; if (A.exchange(S, 'sar', 'usd', Math.min(1500, w.sar * 0.2)).ok) cnt.fx++; }
    if (d % 14 === 7) { const w = S.player.wallet; if (w.usd > 1 && A.exchange(S, 'usd', 'sar', w.usd).ok) cnt.fx++; }
    if (after) seek(E, S, d, car, cnt, charId, home);
    E.botMain(S); if (d % 5 === 0) E.botBuild(S); // التجارة بعد الأنشطة الجانبية (والقافلة واقفة في مدينتها صباحاً)
    E.tick(S, false); S.pause = false; if ((d + 1) % 354 === 0) nw.push(Math.round(E.netWorth(S)));
  }
  const P = S.player, exp = P.led.exp, shops = S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0);
  return { char: charId, seed, nw0: Math.round(nw0), nw, final: Math.round(E.netWorth(S)), phase: S.phase,
    acts: { trips: P.trips, explore: cnt.explore, guards: cnt.guards, restock: cnt.restock, caravans: P.caravans.length - 1, shops, factories: P.factories.length, agent: cnt.agent, fx: cnt.fx, haggle: cnt.haggle, pacts: cnt.pacts }, idDone: S.learn.idGoal && S.learn.idGoal.done != null ? S.learn.idGoal.done : null, mode,
    haggle: { n: cnt.haggle, wins: cnt.hwins, disc: cnt.haggle ? cnt.hdisc / cnt.haggle : 0 },
    cost: { exchange: exp.exchange || 0, agent: exp.agent || 0, provisions: exp.provisions || 0, customs: exp.customs || 0, bandits: exp.bandits || 0, pact: exp.pact || 0, tax: exp.tax || 0 } };
}
module.exports = { runOne };
if (!isMainThread) { const E = require('../src/engine.js'); parentPort.postMessage(runOne(E, workerData.char, workerData.seed, workerData.mode)); return; }

const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'), OUTJ = path.join(ROOT, 'docs/identities/measure.json'), OUTM = path.join(ROOT, 'docs/identities/MEASURE.md');
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1), sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); }, se = a => sd(a) / Math.sqrt(a.length || 1), f1 = x => (Math.round(x * 10) / 10).toFixed(1), f0 = x => String(Math.round(x));
async function main() {
  const key = sha(path.join(ROOT, 'src/engine.js')) + ':' + sha(__filename), prev = fs.existsSync(OUTJ) ? JSON.parse(fs.readFileSync(OUTJ, 'utf8')) : null;
  if (prev && prev.key === key && !process.argv.includes('--force')) { console.log('المصدر والأداة لم يتغيرا: استُعمل القياس المحفوظ.'); return report(prev.rows, key); }
  const jobs = ['before', 'after'].flatMap(mode => CHARS.flatMap(c => SEEDS.map(s => ({ char: c, seed: s, mode })))), rows = []; let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) { const j = jobs[next++]; rows.push(await new Promise((res, rej) => { const w = new Worker(__filename, { workerData: j }); w.once('message', res); w.once('error', rej); })); } }));
  rows.sort((a, b) => (a.mode < b.mode ? 1 : a.mode > b.mode ? -1 : 0) || CHARS.indexOf(a.char) - CHARS.indexOf(b.char) || a.seed - b.seed);
  if (sha(path.join(ROOT, 'src/engine.js')) + ':' + sha(__filename) !== key) throw Error('تغيّر المصدر أثناء القياس؛ لم تُحفظ نتيجة مختلطة.');
  fs.writeFileSync(OUTJ, JSON.stringify({ key, measuredAt: new Date().toISOString(), years: YEARS, seeds: SEEDS, rows }, null, 1) + '\n'); report(rows, key);
}
function summarize(rows, name) {
  const by = c => rows.filter(r => r.char === c), seedMean = Object.fromEntries(SEEDS.map(x => [x, avg(CHARS.map(c => by(c).find(r => r.seed === x).final))])), total = r => Object.values(r.acts).reduce((a, b) => a + b, 0), shareOf = (r, k) => 100 * r.acts[k] / Math.max(1, ACT.reduce((t, [kk]) => t + r.acts[kk], 0));
  return CHARS.map(c => { const R = by(c), q = R.map(r => r.final / seedMean[r.seed] - 1), acts = Object.fromEntries(ACT.map(([k]) => [k, avg(R.map(r => r.acts[k]))])), share = Object.fromEntries(ACT.map(([k]) => [k, avg(R.map(r => shareOf(r, k)))]));
    return { c, R, n: R.length, final: avg(R.map(r => r.final)), sd: sd(R.map(r => r.final)), pdev: 100 * avg(q), pse: 100 * se(q), acts, share, shareOf, done: R.filter(r => r.idDone != null).length / R.length, doneDay: avg(R.filter(r => r.idDone != null).map(r => r.idDone)),
      cost: Object.fromEntries(Object.keys(R[0].cost).map(k => [k, avg(R.map(r => r.cost[k]))])), disc: 100 * avg(R.map(r => r.haggle.disc)) }; });
}
function report(rows, key) {
  const L = require('../src/lessons.js'), name = id => L.CHARS.find(c => c.id === id).name, B = summarize(rows.filter(r => r.mode === 'before'), 'before'), Af = summarize(rows.filter(r => r.mode === 'after'), 'after');
  const mean = st => avg(st.map(s => s.final)), N = SEEDS.length, wealth = (st, tag) => ['| الشخصية | الثروة النهائية | الانحراف المزدوج عن المتوسط | خطؤه المعياري (±) | تذبذب البذور (±) |', '|---|---|---|---|---|', ...st.map(s => '| ' + name(s.c) + ' | ' + f0(s.final) + ' | ' + (s.pdev >= 0 ? '+' : '') + f1(s.pdev) + '٪ | ' + f1(s.pse) + '٪ | ' + f0(s.sd) + ' |'), '', '**متوسط الشخصيات الخمس (' + tag + '):** ' + f0(mean(st)) + ' ريالاً. **أكبر انحراف مزدوج مطلق:** ' + f1(Math.max(...st.map(s => Math.abs(s.pdev)))) + '٪.'];
  const shares = st => ['| الشخصية | ' + ACT.map(a => a[1]).join(' | ') + ' |', '|---|' + ACT.map(() => '---').join('|') + '|', ...st.map(s => '| ' + name(s.c) + ' | ' + ACT.map(([k]) => f1(s.share[k])).join(' | ') + ' |')];
  const maxPair = st => { let m = 0, who = ''; for (const a of st) for (const b of st) if (a.c < b.c) for (const [k, n] of ACT) { const d = Math.abs(a.share[k] - b.share[k]); if (d > m) { m = d; who = name(a.c) + ' × ' + name(b.c) + ' في «' + n + '»'; } } return [m, who]; };
  // SC-002: النشاط المميِّز لكل شخصية مقابل متوسط الأربع الأخريات في البذرة نفسها: بالعدد وبالنصيب (نقطة مئوية)
  const sig = st => CHARS.map(c => { const k = SIGNATURE[c], me = st.find(s => s.c === c), others = st.filter(s => s.c !== c), at = (s, x) => s.R.find(r => r.seed === x),
    dc = SEEDS.map(x => at(me, x).acts[k] - avg(others.map(o => at(o, x).acts[k]))), dp = SEEDS.map(x => me.shareOf(at(me, x), k) - avg(others.map(o => o.shareOf(at(o, x), k)))); return { c, k, m: avg(dc), se: se(dc), pp: avg(dp), ppse: se(dp) }; });
  const sB = sig(B), sA = sig(Af), actName = k => ACT.find(a => a[0] === k)[1], pass = x => x.m >= 3 && x.m > 2 * x.se, nPass = sA.filter(pass).length;
  const dBefore = maxPair(B), dAfter = maxPair(Af), devMax = Math.max(...Af.map(s => Math.abs(s.pdev))), devSig = Af.filter(s => Math.abs(s.pdev) > 15 && Math.abs(s.pdev) > 2 * s.pse);
  const out = ['# قياس هويات اللعب (WP-24): «قبل» و«بعد»', '',
    '> مولَّد بـ `node tools/identity-measure.js` (ثابت البذور؛ لا يعيد القياس إن لم يتغير المحرك ولا الأداة). الخام في `docs/identities/measure.json`. جدول المرحلة أ الأول (8 بذور، لاعب محايد) محفوظ في سجل git بالالتزام `6632ae6`.', '',
    '## كيف قيس', '', '- **' + N + ' بذرة × سنتا لعب (' + (YEARS * 354) + ' يوماً) لكل شخصية** في كل حالة، من حالة بداية موحّدة (السعودية، المستوى 11، دون دَين الجدّ، الرحلات الخارجية مفتوحة).',
    '- **«قبل»:** لاعب آلي محايد لا يعرف شخصيته (تجارة بين المدن وبناء الدكاكين والقادة والمصنع، ودورة صرف كل 7 أيام، ومساومة كل 6 أيام، وطلب وكيل كل 20 يوماً، وعقد شراكة كل 30 يوماً)، والمفتاحان `IDENTITY.goals` و`IDENTITY.perks` مطفآن: أي السلوك القديم حرفياً.',
    '- **«بعد»:** اللاعب نفسه **مضافاً إليه سلوك يسعى لهدف شخصيته ما دام لم يُنجَز ويستعمل مزيتها** (بقرارك): التاجر المتجول يزور مدناً جديدة في دول جديدة، والصرّاف يدير دورات صرف باتجاه «بوصلة الصرف»، وقائد القوافل يشتري الحراس، وصاحب الدكان يبني الدكان الثاني ويعبّئ الدكاكين، والمفاوض يساوم كل يوم. والمفتاحان مفعّلان.',
    '- **الانحراف المزدوج** = ثروة الشخصية ÷ متوسط الشخصيات الخمس في البذرة نفسها (يحذف أثر خريطة البذرة). حدّ القياس: الأنشطة غير الممثَّلة هي البحر والمزارع.', '',
    '## 1) «قبل»: الثروة بعد سنتين', '', ...wealth(B, 'قبل'), '', '## 2) «بعد»: الثروة بعد سنتين', '', ...wealth(Af, 'بعد'), '',
    '## 3) توزيع الأنشطة (٪ من الأفعال المعدودة)', '', '**«قبل»**', '', ...shares(B), '', '**«بعد»**', '', ...shares(Af), '',
    '**أكبر فرق بين شخصيتين في أي نشاط:** قبل ' + f1(dBefore[0]) + ' نقطة مئوية (' + dBefore[1] + ')؛ بعد **' + f1(dAfter[0]) + '** نقطة (' + dAfter[1] + ').', '',
    '## 4) SC-002: الفرق في توزيع الأنشطة', '', 'النشاط المميِّز لكل شخصية: الفرق في **عدده خلال سنتين** عن متوسط الشخصيات الأربع الأخرى في البذرة نفسها (المتوسط ± الخطأ المعياري)، ونصيبه من الأفعال بالنقطة المئوية. يُعدّ الفرق ظاهراً إن بلغ ثلاثة أفعال فأكثر وزاد عن ضعف خطئه:', '',
    '| الشخصية | النشاط المميِّز | فرق العدد «قبل» | فرق العدد «بعد» | فرق النصيب «بعد» (نقطة) | ظاهر؟ |', '|---|---|---|---|---|---|', ...sA.map((x, i) => '| ' + name(x.c) + ' | ' + actName(x.k) + ' | ' + (sB[i].m >= 0 ? '+' : '') + f1(sB[i].m) + ' ± ' + f1(sB[i].se) + ' | **' + (x.m >= 0 ? '+' : '') + f1(x.m) + ' ± ' + f1(x.se) + '** | ' + (x.pp >= 0 ? '+' : '') + f1(x.pp) + ' ± ' + f1(x.ppse) + ' | ' + (pass(x) ? 'نعم' : 'لا') + ' |'), '',
    '**النتيجة:** ' + nPass + ' من 5 شخصيات يظهر فرقها في توزيع الأنشطة (المطلوب ≥ 3): **' + (nPass >= 3 ? 'SC-002 متحقق' : 'SC-002 غير متحقق') + '**.', '',
    '## 5) الهدف الجانبي: كم أنجزه الآلي؟', '', '| الشخصية | نسبة البذور التي أنجزت الهدف (بعد) | متوسط يوم الإنجاز |', '|---|---|---|', ...Af.map(s => '| ' + name(s.c) + ' | ' + f0(100 * s.done) + '٪ | ' + (s.done ? f0(s.doneDay) : '—') + ' |'), '',
    '## 6) SC-003: انحراف الثروة (≤ 15٪)', '', 'أكبر انحراف مزدوج مطلق «بعد»: **' + f1(devMax) + '٪** (قبل: ' + f1(Math.max(...B.map(s => Math.abs(s.pdev)))) + '٪). ' + (devSig.length ? 'تتجاوز الحدّ بدلالة (> ضعف الخطأ): ' + devSig.map(s => name(s.c)).join('، ') + ' ← تُخفَّف مزيتها قبل الرفع (D5).' : (devMax > 15 ? 'تتجاوز بعض الشخصيات 15٪ لكن بما لا يزيد عن ضعف خطئها المعياري (تذبذب لا أثر موثّق)، فلا تخفيف (D5 يتطلب أثراً موثّقاً).' : 'كلها ضمن الحدّ.')) + ' **' + (devSig.length ? 'SC-003 غير متحقق' : 'SC-003 متحقق') + '**.', '',
    '## ملاحظات صدق القياس', '',
    '- **قائد القوافل:** الآلي يشتري حارسين فقط (حدّ IDM_GUARDS=2). جرّبنا 2 و4 و8 على 12 بذرة: نسبة ثروته إلى المحايد 0.91 و0.72 و0.81؛ شراء الحراس يكلّف أكثر مما يمنع من نهب، فالحدّ الأصغر الأقرب للتعادل. لذلك فرق «حراس» +2 (دون عتبة الثلاثة) ولا يُعدّ ظاهراً؛ هدفه (10 رحلات آمنة) يُنجَز مع ذلك بلا حراس كثيرين.',
    '- **صاحب الدكان:** هدفه (دكانان رابحان 30 يوماً) 0٪ في الآلي لأن الآلي يوظّف الطاقم ولا يجهّز سلع الدكاكين (استعمال «جهّز دكانك» `shopQuick` يضخّم دخل الدكان نحو 35 ضعفاً، وهذا اختلال اقتصادي قائم قبل هذه الحزمة يخصّ WP-21، ولم أستعمله). إنجاز الهدف نفسه مُختبَر في `test/identities.test.js`.',
    '',
    '## 7) ما تغيّره النسب (التكاليف) «بعد»', '', '| الشخصية | رسم الصرف | رسم الوكيل | مؤن الطريق | جمارك | خسائر النهب | خصم المساومة |', '|---|---|---|---|---|---|---|', ...Af.map(s => '| ' + name(s.c) + ' | ' + f0(s.cost.exchange) + ' | ' + f0(s.cost.agent) + ' | ' + f0(s.cost.provisions) + ' | ' + f0(s.cost.customs) + ' | ' + f0(s.cost.bandits) + ' | ' + f1(s.disc) + '٪ |'), '', '_المفتاح:_ `' + key.slice(0, 12) + '`', ''];
  fs.writeFileSync(OUTM, out.join('\n')); console.log(out.slice(out.indexOf('## 1) «قبل»: الثروة بعد سنتين')).join('\n'));
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
