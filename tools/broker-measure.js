'use strict';
// قياس FR-005 للسمسار المولَّد (030، plan §10): الرافض دائماً (الأساس) / المتهور / الحذر، 12 بذرة × 3 سنوات (3×354 يوماً)، BROKER.on=true.
// نقطة البداية: حفظ autopilot-18 (≈100 ألف ريال، اليوم 470) بتغيير حالة العشوائية بالبذرة؛ لاعب الـbot botMain/botBuild كما في tools/econ-baseline.js.
// الاستعمال: node tools/broker-measure.js            (كل البذور بالتوازي ثم الجدول)
//            node tools/broker-measure.js --seed=3 --policy=careful [--share=0.25] [--cap=1]   (تشغيل واحد، JSON)
// الانحراف عن plan §10 (موثَّق في measure.md): I = إجمالي دخل الرافض في دفتر اللاعب (led.inc) لا فرق netWorth، لأن لاعب الـbot يخسر في ثلاث سنوات (فرق netWorth سالب في 6 من 12 بذرة)؛ وΔW = صافي صفقات السمسار في السجل (الأثر المباشر) لا فرق netWorth الذي يضخّمه تباعد مسار الـbot.
// الدخل I الأصلي = netWorth(نهاية الرافض) − netWorth(بدايته)؛ الحدّ: 0 < ΔW(الحذر) ≤ 0.03·I و −0.05·I ≤ ΔW(المتهور) < 0، والمتهور أسوأ من الحذر في 10/12 بذرة.
const { E, load } = require('../test/lib/skill-sim.js'), A = E.A, B = E.BROKER;
const arg = k => { const m = process.argv.find(a => a.startsWith('--' + k + '=')); return m ? m.slice(k.length + 3) : null; };
const SEEDS = 12, DAYS = 3 * 354;
function sellAll(S) { const car = E.A && S.player.caravans[0]; if (car.left > 0) return; for (const g of Object.keys(car.cargo)) if (car.cargo[g] >= 1) A.sell(S, car.id, g, Math.floor(car.cargo[g])); }
function policyDay(S, pol, st) { // يعيد true إن لزم انتظار الغد (القافلة لا تغادر)
  const B0 = S.brokers, car = S.player.caravans[0]; if (!B0 || !B0.offer || car.left > 0 || car.city !== B0.offer.city) return false;
  sellAll(S); const o = B0.offer, v = () => E.brokerView(S).offer;
  if (pol === 'refuse') { A.brokerDecline(S); return false; }
  if (pol === 'reckless') { const r = A.brokerAccept(S); if (!r.ok) A.brokerDecline(S); st.acc += r.ok ? 1 : 0; return false; }
  // الحذر
  if (!o.seen.insp) A.brokerInspect(S); if (!o.seen.ask) A.brokerAsk(S); if (!o.seen.warr && o.type !== 'refer') A.brokerWarranty(S);
  const w = v(); if (w.inspPending) return true; // «لم تُرَ»: النتيجة غداً
  const good = w.inspTxt === 'البضاعة كما وُصفت' && !w.tooGood && (o.type === 'refer' || (w.warrDone && o.seen.warr.ok));
  if (good) { const r = A.brokerAccept(S); if (r.ok) { st.acc++; return false; } }
  A.brokerDecline(S); return false;
}
function runOne(seed, pol) {
  const S = load('autopilot-18'); S.seed = (S.seed ^ Math.imul(seed, 2654435761)) >>> 0; S.seedB = (S.seedB ^ Math.imul(seed, 40503)) >>> 0; B.on = true; // حفظ ≈100 ألف (المستوى 10): لاعب الـbot الجديد من newGame يتعثر عند ≈130 ريالاً فلا دخل يُقاس (انحراف موثَّق)
  if (arg('share')) B.share = +arg('share'); if (arg('cap')) for (let i = 0; i < B.cap.length; i++) B.cap[i] /= +arg('cap');
  E.brokerMemorySet(null); const w0 = E.netWorth(S), st = { acc: 0, offers: 0 }, inc0 = Object.values(S.player.led.inc).reduce((x, y) => x + y, 0); let seen = 0;
  for (let d = 0; d < DAYS; d++) {
    if (S.brokers && S.brokers.offer && S.brokers.offer.id !== seen) { seen = S.brokers.offer.id; st.offers++; }
    const wait = policyDay(S, pol, st);
    const car = S.player.caravans[0], stop = car.left === 0 && !st.stopped; // اللاعب الحقيقي يقف في المدينة بعد الوصول؛ الـbot يغادر فوراً فلا يُعرض عليه شيء: نوقفه يوماً بعد كل وصول في كل السياسات
    if (car.left > 0) st.stopped = false; else if (stop) st.stopped = true;
    try { if (!wait && !stop) { E.botMain(S); } E.botBuild(S); } catch (e) {}
    E.tick(S, false); S.pause = false; S.learn.eq = []; if (S.road) S.road = null;
  }
  return { seed, pol, inc: Math.round(Object.values(S.player.led.inc).reduce((x, y) => x + y, 0) - inc0), w0: Math.round(w0), w1: Math.round(E.netWorth(S)), offers: st.offers, acc: st.acc, net: Object.values((S.brokers && S.brokers.ledger) || {}).reduce((a, e) => a + e.net, 0), sh: B.share, cap: B.cap[3] };
}
if (arg('seed')) { console.log(JSON.stringify(runOne(+arg('seed'), arg('policy') || 'refuse'))); process.exit(0); }
const { spawn } = require('node:child_process'), jobs = [];
for (let s = 1; s <= SEEDS; s++) for (const p of ['refuse', 'reckless', 'careful']) jobs.push([s, p]);
const out = [], extra = process.argv.slice(2).filter(a => /^--(share|cap)=/.test(a)); let idx = 0, live = 0;
function next() {
  while (live < 4 && idx < jobs.length) { const [s, p] = jobs[idx++]; live++; let buf = ''; const c = spawn(process.execPath, [__filename, '--seed=' + s, '--policy=' + p, ...extra]); c.stdout.on('data', d => { buf += d; }); c.stderr.on('data', d => process.stderr.write(d));
    c.on('close', () => { live--; try { out.push(JSON.parse(buf.trim().split('\n').pop())); } catch (e) { console.error('فشل', s, p, buf.slice(0, 200)); } if (out.length === jobs.length) report(); else next(); }); }
}
function report() {
  // ΔW الخام (فرق netWorth) يضخّمه تباعد مسار الـbot بعد كل قبول (حمولة السمسار تزاحم تجارته)؛ فيُعتمد الأثر المباشر: صافي الصفقات في سجل السماسرة (ريال، بسعر السوق يوم العرض)، ودخل الرافض I = إجمالي led.inc
  const rows = []; let worse = 0, worseNet = 0; const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  for (let s = 1; s <= SEEDS; s++) { const g = p => out.find(x => x.seed === s && x.pol === p), r = g('refuse'), k = g('reckless'), c = g('careful');
    if (k.w1 - r.w1 < c.w1 - r.w1) worse++; if (k.net < c.net) worseNet++;
    rows.push({ بذرة: s, 'دخل الرافض I': r.inc, 'الحذر صافي الصفقات': c.net, 'المتهور صافي الصفقات': k.net, 'الحذر ΔW خام': c.w1 - r.w1, 'المتهور ΔW خام': k.w1 - r.w1, 'عروض': r.offers, 'قبل الحذر': c.acc, 'قبل المتهور': k.acc }); }
  console.table(rows);
  const I = mean(rows.map(x => x['دخل الرافض I'])), pc = v => +(v / I * 100).toFixed(2), nc = mean(rows.map(x => x['الحذر صافي الصفقات'])), nk = mean(rows.map(x => x['المتهور صافي الصفقات']));
  const res = { share: out[0].sh, cap3: out[0].cap, I: Math.round(I), careful_net: Math.round(nc), careful_net_pct: pc(nc), reckless_net: Math.round(nk), reckless_net_pct: pc(nk), reckless_worse_than_careful: worseNet + '/12', raw_dW_worse: worse + '/12' };
  console.log('متوسط I=' + Math.round(I) + ' | الحذر: ' + res.careful_net + ' (' + res.careful_net_pct + '٪؛ الحد 0<..≤3) | المتهور: ' + res.reckless_net + ' (' + res.reckless_net_pct + '٪؛ الحد −5≤..<0) | المتهور أسوأ من الحذر: ' + worseNet + '/12 (الحد ≥10)');
  console.log(JSON.stringify(res));
}
next();
