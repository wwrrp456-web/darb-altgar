#!/usr/bin/env node
'use strict';
// 027 (T005، SC-002): ربح الخط البحري السنوي ÷ ربح قافلة برية مستأجرة على المسافة نفسها (الميناءان نفسهما)، 12 بذرة × 360 يوماً.
// الخط البحري: سفينة سنبوق + قافلة مستأجرة + شهبندر، يلتزم موسم الرياح (الافتراضي)؛ ويُقاس أيضاً «كل المواسم». البرية: قافلة مستأجرة بالمنطق نفسه (بيع، ثم bestDeal إلى الميناء الآخر، ثم startTrip برّي).
// الربح = تغيّر الثروة خلال المدة بعد تهيئة الخط (لا رسم الشهبندر ولا ثمن السفينة)، مضافاً إليه أجر الشهبندر المدفوع (يُقاس الخط لا مساعده) وضريبة الثروة اليومية (تُدفع على الرصيد لا على الخط، وهي واحدة في الطرفين).
// بعد قرار ب3 (الخيار ب): الخط الافتراضي يعمل على الساحل بين موانئ بحره وهو ينتظر الموسم ثم يعود ليعبر عند الفتح.
// الاستعمال: node tools/port-measure.js [--a jeddah --b mumbai --days 360 --seeds 12] ← specs/027-port-master/measure.md
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/engine.js'), 'utf8').replace('const API = { ', 'const API = { startTrip, sellUnits, buyUnits, takeBasis, addBasis, logTrade, ctxFor, capOfCar, loadOf, '), box);
const E = box.module.exports, A = E.A, QTYS = (process.argv.includes('--sweep') ? [30, 60, 100, 150, 220] : []);
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PA = arg('a', 'jeddah'), PB = arg('b', 'mumbai'), DAYS = +arg('days', 360), NS = +arg('seeds', 12), SEEDS = Array.from({ length: NS }, (_, i) => i + 1);
const f0 = x => Math.round(x).toLocaleString('en-US'), f2 = x => (Math.round(x * 100) / 100).toLocaleString('en-US'), mean = a => a.reduce((x, y) => x + y, 0) / a.length;
function base(seed) { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.noEvents = true; S.player.wallet.sar = 400000; S.player.seaTrips = 1; return S; }
const firstLeg = S => { const f = (x, y) => E.monsoonOf(S, x, y).fair; return f(PA, PB) || !f(PB, PA) ? [PA, PB] : [PB, PA]; }; // يبدأ من الميناء الذي رحلته الأولى مواتية
function mk(S, start) { if (!A.hireCaptain(S).ok) throw Error('captain'); const c = S.player.caravans.at(-1); c.captain.role = 'loyal'; c.captain.home = 'sa'; c.city = start; c.route = null; c.free = false; return c; }
function runSea(seed, all) {
  const S = base(seed), [s, o] = firstLeg(S); if (!A.buyShip(S, s, 'dhow').ok) throw Error('ship'); const c = mk(S, s); if (!A.hirePortM(S).ok) throw Error('portm'); const r = A.portmOpenLine(S, c.id, E.shipsOf(S)[0].id, s, o, all); if (!r.ok) throw Error(r.msg);
  const lv = () => S.player.led.exp.wealthLevy || 0, w0 = E.netWorth(S), l0 = lv(); let run = 0, maxRun = 0, off = 0;
  for (let d = 0; d < DAYS; d++) { E.tick(S, false); const here = c.left === 0 ? c.city : null; const rs = here && (E.SEA_REGION[here] === E.SEA_REGION[s] ? [s, o] : [o, s]), open = here && E.monsoonOf(S, rs[0], rs[1]).fair; const idleOpen = here && (open || all) && !(c.waiting && /الموسم/.test(c.waiting)); run = idleOpen ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
  return { profit: E.netWorth(S) - w0 + (S.player.portm ? S.player.portm.paid : 0) + lv() - l0, sails: c.line ? c.line.sails : 0, coast: c.line ? c.line.coast || 0 : 0, maxRun, pl: c.pl || 0 };
}
function landStep(S, c, s, o) {
  if (c.left > 0) return; const here = c.city; if (here !== s && here !== o) return; const other = here === s ? o : s, P = S.player, cc = S.cities[here]; E.ctxFor(S, here);
  const haggle = 1 + 0.015 * c.captain.trade;
  for (const g of E.GIDS) if ((c.cargo[g] || 0) >= 1) { const res = E.sellUnits(S, P, cc, g, Math.floor(c.cargo[g]), c.cargo, true, haggle, 'auto', c.basis[g]); if (res.n > 0) { const cost = E.takeBasis(c.basis, g, res.n); const rec = E.logTrade(S, here, g, res.n, 'sell', res.net, res.net - cost, 'auto'); c.pl = (c.pl || 0) + rec.pl; } }
  const d = E.bestDeal(S, c, P.gold * 0.4, 'auto', other);
  if (d) { const room = E.capOfCar(c) - E.loadOf(c), budget = { gold: Math.min(P.gold * 0.4, d.cost * 1.1) }, res = E.buyUnits(S, budget, cc, d.g, Math.min(d.q, room / E.GD[d.g].w), room, c.cargo, true); if (res.n >= 1) { P.gold -= res.cost; E.addBasis(c.basis, d.g, res.n, res.cost); c.__nd = 0; } else c.__nd = (c.__nd || 0) + 1; } else c.__nd = (c.__nd || 0) + 1;
  if ((c.__nd || 0) > 0 && (c.__nd || 0) < E.PORTM.noDealDays && E.loadOf(c) < 1) return;
  const r = E.startTrip(S, c, other, undefined, 'auto'); if (r.ok) c.__nd = 0;
}
function runLand(seed) { const S = base(seed), [s, o] = firstLeg(S); const c = mk(S, s); c.free = false; const lv = () => S.player.led.exp.wealthLevy || 0, w0 = E.netWorth(S), l0 = lv(); for (let d = 0; d < DAYS; d++) { landStep(S, c, s, o); E.tick(S, false); } return { profit: E.netWorth(S) - w0 + lv() - l0, trips: c.trips }; }
module.exports = { runSea, runLand };
if (require.main === module) {
  const sea = SEEDS.map(s => runSea(s, false)), all = SEEDS.map(s => runSea(s, true)), land = SEEDS.map(runLand);
  const M = r => mean(r.map(x => x.profit)), ratio = (x, y) => M(x) / M(y), per = SEEDS.map((s, i) => ({ s, sea: sea[i].profit, all: all[i].profit, land: land[i].profit }));
  const sweep = QTYS.map(q => { E.PORTM.qty = q; const r = SEEDS.map(s => runSea(s, false)); E.PORTM.qty = 30; return { q, p: M(r), ratio: ratio(r, land), sails: mean(r.map(x => x.sails)) }; });
  const out = ['# قياس الشهبندر (027، SC-002)', '', '> مولَّد بـ `node tools/port-measure.js` (' + SEEDS.length + ' بذرة × ' + DAYS + ' يوماً): الخط بين ' + PA + ' و' + PB + ' بسفينة سنبوق (سعة 220) وقافلة مستأجرة، مقابل قافلة برية مستأجرة بالمنطق نفسه بين الميناءين نفسهما. الربح = تغيّر الثروة بعد تهيئة الخط مضافاً إليه أجر الشهبندر وضريبة الثروة اليومية (واحدة في الطرفين)؛ يُقاس الخط لا مساعده.', ''];
  out.push('| | متوسط الربح السنوي | النسبة إلى البرية |', '|---|---:|---:|', `| قافلة برية مستأجرة | ${f0(M(land))} | 1.00 |`, `| خط بحري (يلتزم الموسم، الافتراضي) | ${f0(M(sea))} | ${f2(ratio(sea, land))} |`, `| خط بحري (كل المواسم) | ${f0(M(all))} | ${f2(ratio(all, land))} |`, '');
  const okd = ratio(sea, land) >= 0.8 && ratio(sea, land) <= 1.5; out.push('المطلوب (SC-002): النسبة بين 0.8 و1.5 للخط الافتراضي: ' + (okd ? '**متحقق**.' : '**خارج المجال** ⛔ (توقف T005).'), '');
  if (sweep.length) out.push('## اقتراح ثابت واحد: `PORTM.qty` (أقصى وحدات تشتريها القافلة في الرحلة الواحدة، الآن 30 كحد `bestDeal` القائم)', '', 'الخط الافتراضي (يلتزم الموسم) بقيم مختلفة للثابت (البرية بلا تغيير: 30 كما في اللعبة):', '', '| PORTM.qty | متوسط الربح السنوي | النسبة إلى البرية | متوسط رحلات الخط |', '|---:|---:|---:|---:|', ...sweep.map(w => `| ${w.q}${w.q === 30 ? ' (الحالي)' : ''} | ${f0(w.p)} | ${f2(w.ratio)} | ${f2(w.sails)} |`), '');
  out.push('## لكل بذرة', '', '| بذرة | بري | بحري (الموسم) | بحري (كل المواسم) | رحلات الخط (منها ساحلية) | أقصى وقوف في موسم مفتوح (يوم) |', '|---:|---:|---:|---:|---:|---:|', ...per.map((r, i) => `| ${r.s} | ${f0(r.land)} | ${f0(r.sea)} | ${f0(r.all)} | ${sea[i].sails} (${sea[i].coast}) | ${sea[i].maxRun} |`));
  const text = out.join('\n'); fs.writeFileSync(path.join(__dirname, '../specs/027-port-master/measure.md'), text + '\n'); console.log(text);
}
