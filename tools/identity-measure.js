#!/usr/bin/env node
'use strict';
// WP-24 (المرحلة أ): قياس هويات اللعب قبل أي تغيير. لكل شخصية × 8 بذور × سنتا لعب بلاعب آلي واحد متعدد الأنشطة لا يعرف شخصيته (الجداول نفسها لكل الشخصيات)،
// فكل فرق في النتائج ناتج عن نسب الشخصية وحدها. يسجّل عدّ الأنشطة ونسبها، وكلفها، والثروة. ثابت البذور، ولا يعيد القياس إن لم يتغير المحرك ولا الأداة.
// الاستعمال: node tools/identity-measure.js [--force]  ← docs/identities/measure.json وMEASURE.md
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const ROOT = path.join(__dirname, '..'), CHARS = ['trader', 'changer', 'leader', 'shopkeeper', 'negotiator'], SEEDS = [1, 2, 3, 4, 5, 6, 7, 8], YEARS = 2, DAYS = YEARS * 354;
const ACT = [['trips', 'رحلات القافلة'], ['caravans', 'قوافل بقادة'], ['shops', 'دكاكين'], ['factories', 'مصانع'], ['agent', 'طلبات وكيل'], ['fx', 'عمليات صرف'], ['haggle', 'مساومات'], ['pacts', 'عقود شراكة']];

function runOne(E, charId, seed) {
  const A = E.A, S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, charId); S.noLock = 1; S.noEvents = true; S.player.famDebt = null;
  const L = S.learn; L.level = 11; L.stage = 23; L.stageIntro = 22; L.abroad = true; const nw0 = E.netWorth(S), cnt = { agent: 0, fx: 0, haggle: 0, hwins: 0, hdisc: 0, pacts: 0 }, nw = [];
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
    E.botMain(S); if (d % 5 === 0) E.botBuild(S); // التجارة بعد الأنشطة الجانبية (والقافلة واقفة في مدينتها صباحاً)
    E.tick(S, false); S.pause = false; if ((d + 1) % 354 === 0) nw.push(Math.round(E.netWorth(S)));
  }
  const P = S.player, exp = P.led.exp, shops = S.order.reduce((n, c) => n + E.shopsOf(S, c).length, 0);
  return { char: charId, seed, nw0: Math.round(nw0), nw, final: Math.round(E.netWorth(S)), phase: S.phase,
    acts: { trips: P.trips, caravans: P.caravans.length - 1, shops, factories: P.factories.length, agent: cnt.agent, fx: cnt.fx, haggle: cnt.haggle, pacts: cnt.pacts },
    haggle: { n: cnt.haggle, wins: cnt.hwins, disc: cnt.haggle ? cnt.hdisc / cnt.haggle : 0 },
    cost: { exchange: exp.exchange || 0, agent: exp.agent || 0, provisions: exp.provisions || 0, customs: exp.customs || 0, bandits: exp.bandits || 0, pact: exp.pact || 0, tax: exp.tax || 0 } };
}
if (!isMainThread) { const E = require('../src/engine.js'); parentPort.postMessage(runOne(E, workerData.char, workerData.seed)); return; }

const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'), OUTJ = path.join(ROOT, 'docs/identities/measure.json'), OUTM = path.join(ROOT, 'docs/identities/MEASURE.md');
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1), sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); }, f1 = x => (Math.round(x * 10) / 10).toFixed(1), f0 = x => String(Math.round(x));
async function main() {
  const key = sha(path.join(ROOT, 'src/engine.js')) + ':' + sha(__filename), prev = fs.existsSync(OUTJ) ? JSON.parse(fs.readFileSync(OUTJ, 'utf8')) : null;
  if (prev && prev.key === key && !process.argv.includes('--force')) { console.log('المصدر والأداة لم يتغيرا: استُعمل القياس المحفوظ.'); return report(prev.rows, key); }
  const jobs = CHARS.flatMap(c => SEEDS.map(s => ({ char: c, seed: s }))), rows = []; let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) { const j = jobs[next++]; rows.push(await new Promise((res, rej) => { const w = new Worker(__filename, { workerData: j }); w.once('message', res); w.once('error', rej); })); } }));
  rows.sort((a, b) => CHARS.indexOf(a.char) - CHARS.indexOf(b.char) || a.seed - b.seed);
  if (sha(path.join(ROOT, 'src/engine.js')) + ':' + sha(__filename) !== key) throw Error('تغيّر المصدر أثناء القياس؛ لم تُحفظ نتيجة مختلطة.');
  fs.writeFileSync(OUTJ, JSON.stringify({ key, measuredAt: new Date().toISOString(), years: YEARS, seeds: SEEDS, rows }, null, 1) + '\n'); report(rows, key);
}
function report(rows, key) {
  const L = require('../src/lessons.js'), name = id => L.CHARS.find(c => c.id === id).name, by = c => rows.filter(r => r.char === c);
  const stat = CHARS.map(c => { const R = by(c), tot = k => avg(R.map(r => r.acts[k])), acts = Object.fromEntries(ACT.map(([k]) => [k, tot(k)])), sum = Object.values(acts).reduce((a, b) => a + b, 0);
    return { c, n: R.length, final: avg(R.map(r => r.final)), sd: sd(R.map(r => r.final)), growth: avg(R.map(r => r.final / r.nw0)), acts, share: Object.fromEntries(ACT.map(([k]) => [k, 100 * acts[k] / sum])), haggle: { wins: avg(R.map(r => r.haggle.n ? r.haggle.wins / r.haggle.n : 0)), disc: 100 * avg(R.map(r => r.haggle.disc)) },
      cost: Object.fromEntries(Object.keys(R[0].cost).map(k => [k, avg(R.map(r => r.cost[k]))])), perFx: avg(R.map(r => r.acts.fx ? r.cost.exchange / r.acts.fx : 0)), perAgent: avg(R.map(r => r.acts.agent ? r.cost.agent / r.acts.agent : 0)), perPact: avg(R.map(r => r.acts.pacts ? r.cost.pact / r.acts.pacts : 0)) }; });
  const mean = avg(stat.map(s => s.final)), seedMean = Object.fromEntries(SEEDS.map(sd0 => [sd0, avg(CHARS.map(c => rows.find(r => r.char === c && r.seed === sd0).final))]));
  // انحراف مزدوج: ثروة الشخصية ÷ متوسط الشخصيات الخمس في البذرة نفسها (يحذف أثر خريطة البذرة)، ثم المتوسط والخطأ المعياري عبر البذور
  for (const s of stat) { const q = by(s.c).map(r => r.final / seedMean[r.seed] - 1); s.pdev = 100 * avg(q); s.pse = 100 * sd(q) / Math.sqrt(q.length); }
  const dev = s => s.pdev;
  let maxPP = 0, maxPair = ''; for (const a of stat) for (const b of stat) if (a.c < b.c) for (const [k, n] of ACT) { const d = Math.abs(a.share[k] - b.share[k]); if (d > maxPP) { maxPP = d; maxPair = name(a.c) + ' × ' + name(b.c) + ' في «' + n + '»'; } }
  const out = ['# قياس هويات اللعب (WP-24، المرحلة أ): جدول «قبل»', '',
    '> مولَّد بـ `node tools/identity-measure.js` (ثابت البذور؛ لا يعيد القياس إن لم يتغير المحرك ولا الأداة). البيانات الخام في `docs/identities/measure.json`. **لا تغيير في أي نسبة أو هدف أو مزية في هذه المرحلة.**', '',
    '## كيف قيس', '', '- **لاعب آلي واحد** لا يعرف شخصيته ويفعل الأنشطة نفسها بالجداول نفسها لكل الشخصيات: تجارة بين المدن (`botMain`) وبناء الدكاكين والقادة والمصنع (`botBuild`)، ودورة صرف كل 7 أيام، ومساومة كل 6 أيام (يجيب صواباً في ثلثي الجولات)، وطلب وكيل كل 20 يوماً، ومحاولة عقد شراكة كل 30 يوماً.',
    '- لكل شخصية **' + SEEDS.length + ' بذور × سنتا لعب** (' + (YEARS * 354) + ' يوماً)، من حالة بداية موحّدة (السعودية، المستوى 11، دون دَين الجدّ، الرحلات الخارجية مفتوحة). فكل فرق بين الشخصيات سببه نسبها وحدها.',
    '- **حدّ القياس:** لأن اللاعب الآلي لا يختار نشاطه بحسب شخصيته، فجدول الأنشطة يقيس **ما تفعله النسب بالعوائد والتكاليف**، لا ما يختاره لاعب بشري. الأنشطة غير الممثَّلة: البحر والمزارع (لا يفعلها هذا الآلي).', '',
    '## 1) الثروة النهائية بعد سنتين (متوسط ' + SEEDS.length + ' بذور)', '', '| الشخصية | الثروة النهائية | الانحراف المزدوج عن المتوسط | خطؤه المعياري (±) | تذبذب البذور (±) | النمو (×) |', '|---|---|---|---|---|---|',
    ...stat.map(s => '| ' + name(s.c) + ' | ' + f0(s.final) + ' | ' + (dev(s) >= 0 ? '+' : '') + f1(dev(s)) + '٪ | ' + f1(s.pse) + '٪ | ' + f0(s.sd) + ' | ' + f1(s.growth) + ' |'), '', '**متوسط الشخصيات الخمس:** ' + f0(mean) + ' ريالاً. **أكبر انحراف مزدوج مطلق:** ' + f1(Math.max(...stat.map(s => Math.abs(dev(s))))) + '٪ (الحد المقبول في SC-003: 15٪). **الانحراف المزدوج** = ثروة الشخصية ÷ متوسط الشخصيات الخمس في البذرة نفسها، وهو أدق من المقارنة المطلقة لأن تذبذب البذور كبير.', '',
    '## 2) توزيع الأنشطة (٪ من مجموع الأفعال المعدودة، متوسط البذور)', '', '| الشخصية | ' + ACT.map(a => a[1]).join(' | ') + ' |', '|---|' + ACT.map(() => '---').join('|') + '|', ...stat.map(s => '| ' + name(s.c) + ' | ' + ACT.map(([k]) => f1(s.share[k])).join(' | ') + ' |'), '',
    '**أكبر فرق بين شخصيتين في أي نشاط:** ' + f1(maxPP) + ' نقطة مئوية (' + maxPair + ').', '',
    '## 3) الأعداد الخام لكل شخصية (متوسط خلال سنتين)', '', '| الشخصية | ' + ACT.map(a => a[1]).join(' | ') + ' |', '|---|' + ACT.map(() => '---').join('|') + '|', ...stat.map(s => '| ' + name(s.c) + ' | ' + ACT.map(([k]) => f1(s.acts[k])).join(' | ') + ' |'), '',
    '## 4) ما تغيّره النسب فعلاً (التكاليف والعوائد)', '', '| الشخصية | رسم الصرف لكل عملية | رسم الوكيل لكل طلب | مؤن الطريق (سنتان) | جمارك (سنتان) | خسائر قطاع الطرق | مقدّم العقد الواحد | خصم المساومة المتوسط |', '|---|---|---|---|---|---|---|---|',
    ...stat.map(s => '| ' + name(s.c) + ' | ' + f1(s.perFx) + ' | ' + f1(s.perAgent) + ' | ' + f0(s.cost.provisions) + ' | ' + f0(s.cost.customs) + ' | ' + f0(s.cost.bandits) + ' | ' + f0(s.perPact) + ' | ' + f1(s.haggle.disc) + '٪ |'), '',
    '## 5) قراءة النتيجة', '', '- **الفرضية** (النسب لا تغيّر أسلوب اللعب): الجدول 2 يُظهر أن توزيع الأنشطة متقارب بين الشخصيات (أكبر فرق ' + f1(maxPP) + ' نقطة)، وأن النسب تظهر في الجدول 4 أرقاماً صغيرة في تكاليف لا يراها اللاعب أثناء اللعب إلا في خانة الدفتر.',
    '- **الثروة:** ' + stat.filter(s => Math.abs(s.pdev) > 2 * s.pse).length + ' من 5 شخصيات فقط يزيد انحرافها المزدوج عن ضعف خطئه المعياري؛ والتذبذب بين البذور (±' + f0(avg(stat.map(s => s.sd))) + ' ريال في المتوسط، نحو ' + f0(100 * avg(stat.map(s => s.sd)) / mean) + '٪) يجعل ثماني بذور لا تحسم فروقاً أقل من نحو ' + f0(2 * avg(stat.map(s => s.pse))) + '٪.',
    '- **للقرار:** `PROPOSAL.md` يقترح هدفاً جانبياً ومزية ظاهرة لكل شخصية على آليات قائمة، بانتظار اعتمادك.', '', '_المفتاح:_ `' + key.slice(0, 12) + '`', ''];
  fs.writeFileSync(OUTM, out.join('\n')); console.log(out.slice(out.indexOf('## 1) الثروة النهائية بعد سنتين (متوسط ' + SEEDS.length + ' بذور)'), out.indexOf('## 3) الأعداد الخام لكل شخصية (متوسط خلال سنتين)')).join('\n'));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
