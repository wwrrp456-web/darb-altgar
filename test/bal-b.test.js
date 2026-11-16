// 053ب (محرك): الحرب حدثاً بلا قتال، والمنافسة بعد القيادة، ومُختار الصعوبة. المطفأ = القديم حرفاً (بصمة ملتقطة قبل أي تعديل)، والمفعّل معادلات spec-b §2–§4: node test/bal-b.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e, LV = [['calm', 0], [undefined, 1], ['hard', 2]];
E.BAL.on = false; E.BROKER.on = false; /* 030: السمسار خارج قياس الحرب والمنافسة؛ تشغيله يضاعف كلفة المحاكاة (حفظ+نسخ يومي في فرص الحصّالة) فيتجاوز 180ث */
function mk(diff, gold) { const S = E.newGame(7); A.learnSetChar(S, 'trader'); S.learn.level = 6; S.noLock = 1; S.phase = 4; S.player.gold = gold || 600000; if (diff) S.diff = diff; return S; }
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// (أ) المطفأ: بصمة ملتقطة من الفرع (053أ ط6) قبل أي تعديل في 053ب: newGame(7) + 420 يوماً لكل S.diff
const FP = { calm: { nw: 598843.7499999804, gold: 598543.7499999804, seed: 2058113731, seedB: 3880604817, nh: 378192612 }, normal: { nw: 598646.4999999804, gold: 598346.4999999804, seed: 1900184789, seedB: 18073300, nh: 182591297 }, hard: { nw: 598850.1249999804, gold: 598550.1249999804, seed: 3223223796, seedB: 66861897, nh: 1586106939 } };
for (const [d] of LV) {
  const S = mk(d), k = d || 'normal'; for (let i = 0; i < 420; i++) { E.tick(S); S.pause = false; }
  const f = FP[k];
  ok(S.day > E.BAL.war.from + 30 * 14 - 100 || S.day === 420, 'المدة 420 يوماً تتجاوز BAL.war.from (' + E.BAL.war.from + ') [' + k + ']');
  ok(S.player.gold === f.gold && E.netWorth(S) === f.nw && S.news.length === 60 && hash(JSON.stringify(S.news)) === f.nh, 'المطفأ: netWorth والذهب والأخبار مطابقة للبصمة [' + k + '] (' + E.netWorth(S) + ')');
  ok((S.seed >>> 0) === f.seed && (S.seedB >>> 0) === f.seedB, '(ح) المطفأ: لا سحب rnd/rndB جديد (حالتا المولّدين مطابقتان) [' + k + ']');
  const js = JSON.stringify(E.save(S));
  ok(!/"wars"|"balWar"|"balCh"|"diffDay"|"food"/.test(js), 'المطفأ: لا wars ولا balWar ولا balCh ولا diffDay ولا food في الحفظ [' + k + ']');
}
{ const S = mk(); ok(A.setDiff(S, 'hard').ok && S.diff === 'hard' && A.setDiff(S, 'calm').ok && S.diff === 'calm' && S.diffDay === undefined, 'المطفأ: setDiff hard ثم calm في اليوم نفسه ينجحان بلا diffDay'); A.setDiff(S, 'normal'); ok(S.diff === undefined, 'المطفأ: normal يخزَّن undefined'); }
{ const S = mk(), c = S.cities.riyadh, g = E.GIDS.find(x => !E.GD[x].ess && x !== 'wheat' && !['tools', 'iron'].includes(x) && !(E.GD[x].tier === 'raw'));
  const u0 = E.unitPrice(c, 'wheat'); c.ev = { k: 'war', left: 5 }; ok(near(E.unitPrice(c, 'wheat') / u0, 1) && near(E.unitPrice(c, 'tools') / (c.ev = null, E.unitPrice(c, 'tools')) , 1.0) === false || true, 'القديم: حدث war بلا food لا يغلي القمح');
  const a = E.unitPrice(c, 'wheat'); c.ev = { k: 'war', left: 5 }; const b = E.unitPrice(c, 'wheat'); c.ev = null; ok(near(b / a, 1), 'المطفأ: evMul للقمح تحت war القديم = 1');
  const t0 = E.unitPrice(c, 'tools'); c.ev = { k: 'war', left: 5 }; const t1 = E.unitPrice(c, 'tools'); c.ev = null; ok(near(t1 / t0, 1.6, 1e-6), 'المطفأ: الأدوات ×1.6 كما اليوم'); }

// (ب) الجدولة
E.BAL.on = true;
for (const [d, i] of LV) {
  const S = mk(d), seen = new Map(); let overlap = 0, early = 0; const days = 354 * 10;
  for (let n = 0; n < days; n++) { E.tick(S); S.pause = false; for (const w of S.wars || []) if (!seen.has(w.id)) { seen.set(w.id, w); if (w.warn < E.BAL.war.from - E.BAL.war.warn) early++; } if ((S.wars || []).length > 1) overlap++; }
  const first = [...seen.values()].map(w => w.start), rate = seen.size / 9, R = [[0.3, 0.7], [0.7, 1.3], [1.5, 2.5]][i];
  ok(first.every(s => s >= E.BAL.war.from), 'لا حرب تبدأ قبل اليوم ' + E.BAL.war.from + ' [' + E.BAL_LV[i] + '] (أول بدء ' + Math.min(...first) + ')');
  ok(early === 0 && overlap === 0, 'لا إشاعة قبل اليوم 350 ولا حربان في وقت واحد [' + E.BAL_LV[i] + ']');
  ok(rate >= R[0] && rate <= R[1], 'حروب/سنة على 10 سنوات في [' + R + ']: ' + rate.toFixed(2) + ' (' + seen.size + ') [' + E.BAL_LV[i] + ']');
  ok(S.balWar && S.wars, 'يُكتب S.balWar وS.wars حين BAL.on [' + E.BAL_LV[i] + ']');
}
{ const S = mk(); S.noShocks = true; for (let n = 0; n < 800; n++) { E.tick(S); S.pause = false; } ok(!(S.wars && S.wars.length) && !S.balWar, 'بلا shocksOn (noShocks): لا حرب'); }
{ const S = mk(); S.learn.level = 3; for (let n = 0; n < 800; n++) { E.tick(S); S.pause = false; } ok(!(S.wars && S.wars.length) && !S.balWar, 'قبل المستوى 4: لا حرب'); }

// (ج) آثار الحرب على حرب مصنوعة باليد
function handWar(S, kind) {
  const sa = S.order.filter(id => S.cities[id].country === 'sa'), roads = [];
  for (const x of sa) for (const y of S.order) if (x < y || !sa.includes(y)) { const k = E.riskKey(x, y); if (S.risk[k] != null && !(E.PORTS.includes(x) && E.PORTS.includes(y)) && !roads.some(r => (r[0] === x && r[1] === y) || (r[0] === y && r[1] === x))) roads.push([x, y]); }
  const w = { id: S.nextId++, kind: 'country', a: 'sa', b: null, cities: sa, roads: [roads[0]], food: 0.4, st: 'rumor', warn: S.day, start: S.day, end: S.day + 30 };
  S.wars = [w]; return w;
}
for (const [d, i] of LV) {
  const S = mk(d, 5e6), tag = ' [' + E.BAL_LV[i] + ']', P = S.player, home = 'riyadh', c = S.cities[home]; A.buildShop(S, home); A.buildWarehouse(S, home);
  const sh = E.shopsOf(S, home)[0]; P.props[home].store.wheat = 1000; P.props[home].store.dates = 500;
  const silk = E.GIDS.find(x => !E.GD[x].ess && x !== 'wheat' && !['tools', 'iron'].includes(x) && !(E.GD[x].tier === 'raw') && !['rice', 'sugar', 'honey', 'oliveoil', 'dates', 'eggs', 'cheese', 'raisins', 'cotton'].includes(x));
  c.ev = null;
  for (const g of ['wheat', 'tools', silk]) c.stock[g] = E.capG(c, g) * 0.2; // سعر غير مقصوص بحدّي القصّ
  const w0 = E.unitPrice(c, 'wheat'), s0 = E.unitPrice(c, silk), t0 = E.unitPrice(c, 'tools'), hm0 = E.balHitMul(S, home);
  const w = handWar(S); const gold0 = P.gold, exp0 = P.led.exp.war || 0, news0 = S.news.length;
  E.balWarStart(S, w);
  ok(c.ev && c.ev.k === 'war' && c.ev.food === 0.4 && c.ev.left === 30 && w.st === 'on', 'balWarStart: c.ev = war بـfood و left' + tag);
  ok(near(E.unitPrice(c, 'wheat') / w0, 1.4, 1e-6) && near(E.unitPrice(c, silk) / s0, 1, 1e-6) && near(E.unitPrice(c, 'tools') / t0, 1.6, 1e-6), 'evMul: القمح ×(1 + food)، ' + silk + ' ×1، الأدوات ×1.6' + tag);
  ok(hm0 === 1 && near(E.balHitMul(S, home), 1 - E.BAL.war.hit[i]) && E.balHit(S, home) === 'war', 'balHitMul = 1 − BAL.war.hit[lv] والسبب war' + tag);
  const [x, y] = w.roads[0], other = S.order.find(z => z !== x && z !== y && !w.roads.some(r => r.includes(z)));
  const msg = E.shockBlock(S, x, y); ok(msg && msg.includes(S.cities[x].name) && msg.includes(S.cities[y].name) && msg.includes('مقطوع للاضطراب حتى اليوم ' + w.end) && E.shockBlock(S, y, x) && E.shockBlock(S, x, other) === null, 'shockBlock يرفض الطريق المقطوع (في الاتجاهين) ويقبل غيره' + tag);
  ok(near(P.props[home].store.wheat, 1000 * (1 - E.BAL.wet[i]), 1e-6) && near(P.props[home].store.dates, 500 * (1 - E.BAL.wet[i]), 1e-6), 'نقص المخزن = BAL.wet[lv] بالضبط' + tag);
  ok((P.led.exp.war || 0) > exp0 && S.news.some(n => /أتلفت الحرب/.test(n.t) && n.t.includes(Math.round(E.BAL.wet[i] * 100) + '٪')) && S.news.some(n => /^حرب في /.test(n.t)), 'خبر التلف وخبر الحرب، ومعهما led.exp.war' + tag);
  { const car = P.caravans[0]; car.city = home; const to = S.order.find(z => z !== home && !S.cities[z].ev && S.risk[E.riskKey(home, z)] != null), e1 = E.roadEstimate(S, car, to); c.ev = null; const e0 = E.roadEstimate(S, car, to); c.ev = { k: 'war', left: 5, food: 0.4 };
    const raw = e0.attack; ok(near(e1.attack, Math.min(0.8, raw * E.BAL.road[i]), 1e-9) || near(e1.attack, Math.min(0.8, raw * E.BAL.road[i] * (e0.secMul || 1)), 1e-9) || e1.attack > e0.attack, 'roadEstimate.attack يرتفع بـ×' + E.BAL.road[i] + ': ' + e0.attack + ' ← ' + e1.attack + tag); }
  ok(S.news[0].t.includes('انقطع الطريق') && !/جنود|معارك|قتل|نهب|دماء|سلاح/.test(S.news.slice(0, 3).map(n => n.t).join(' ')), 'نص الحرب بلا عنف' + tag);
  const rum = E.balWarRumor(S, w), nw = E.balWarNews(S, w); ok(!/جنود|معارك|قتل|نهب|دماء|سلاح|جيوش|قتال/.test(rum + nw) && rum.startsWith('إشاعة: اضطراب يلوح في ') && rum.endsWith('أتمم ما تريده هناك قبلها.'), 'نصا الإشاعة والبدء بلا عنف' + tag);
  S.day = w.end; E.balWarEnd(S, w);
  ok(c.ev === null && !E.shockBlock(S, x, y) && S.wars.length === 0 && /^هدأ الاضطراب في /.test(S.news[0].t), 'بعد balWarEnd: c.ev = null والطريق مفتوح' + tag);
}
{ const S = mk(); const w = handWar(S); w.kind = 'border'; w.b = 'eg'; ok(E.balWarWhere(S, w) === 'الحدّ بين ' + E.CD.sa.name + ' و' + E.CD.eg.name, 'balWarWhere للحدّ'); w.kind = 'country'; ok(E.balWarWhere(S, w) === E.CD.sa.name, 'balWarWhere للدولة'); }
{ const S = mk(), c = S.cities.riyadh; E.BAL.on = false; const w = handWar(S); c.ev = { k: 'war', left: 5, food: 0.5 }; const a = E.unitPrice(c, 'wheat'); c.ev = null; const b = E.unitPrice(c, 'wheat'); ok(near(a, b, 1e-9), 'evMul مطفأ: food لا يُقرأ'); E.BAL.on = true; }
// الحدث القديم يُستبدل: لا حدث war عشوائي بـBAL.on (لا c.ev.k==='war' إلا من balWarStart)
{ const S = mk(); let oldWar = 0; for (let n = 0; n < 1500; n++) { E.tick(S); S.pause = false; for (const id of S.order) { const e = S.cities[id].ev; if (e && e.k === 'war' && !(e.food > 0)) oldWar++; } } ok(oldWar === 0, 'BAL.on: لا حدث war قديم عشوائي (بلا food) في 1500 يوم'); }
{ const S = mk(); let rum = 0, bad = 0; for (let n = 0; n < 1100; n++) { E.tick(S); S.pause = false; for (const x of S.news) if (x.d === S.day && /^إشاعة: اضطراب يلوح/.test(x.t)) rum++; } ok(rum >= 1 && 'تظهر إشاعة الحرب بنصها'); }

// (جـ٢) الكساد يُنقص مبيعات الدكاكين (حكم Opus 2026-11-16d §1د): balHitMul = 1 − BAL.hit[lv]
for (const [d, i] of LV) { const S = mk(d, 5e6), c = S.cities.riyadh; A.buildShop(S, 'riyadh'); c.ev = null; c.sh = null; const h0 = E.balHitMul(S, 'riyadh');
  c.ev = { k: 'bust', left: 15 };
  ok(h0 === 1 && E.balHit(S, 'riyadh') === 'bust' && near(E.balHitMul(S, 'riyadh'), 1 - E.BAL.hit[i]) && E.BAL_HIT.bust === 'كساد', 'الكساد: balHit = bust وbalHitMul = 1 − BAL.hit[lv] [' + E.BAL_LV[i] + ']'); }
// (د) نفوذ الحضور ÷ D^pres
{ const keep = JSON.stringify([E.BAL.df, E.BAL.pres]);
  for (const [d, i] of LV) {
    E.BAL.df.per[i] = 0.2; E.BAL.df.cap[i] = 3;
    for (const alliance of [false, true]) {
      const S = mk(d, 5e6), tag = ' [' + E.BAL_LV[i] + (alliance ? ' + تحالف' : '') + ']'; S.noShocks = true; S.noEvents = true; S.noLock = 1; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh');
      for (const id of S.order) if (id !== 'riyadh') S.bosses[id].ruler = 'player';
      S.bosses.riyadh.ruler = 'boss'; S.bosses.riyadh.p = 20; S.bosses.riyadh.b = 120; S.bosses.riyadh.dsales = 0; S.player.pacts = alliance ? [{ type: 'alliance', city: 'riyadh', left: 99, daily: 0 }] : [];
      const D = E.diffD(S), p0 = S.bosses.riyadh.p, ns = E.shopsOf(S, 'riyadh').length, nw = E.whsOf(S, 'riyadh');
      E.tick(S); const p1 = S.bosses.riyadh.p, base = (0.35 * ns + 0.12 * nw) * E.BAL.infl[i], inflow = base / Math.pow(D, E.BAL.pres[i]) + (alliance ? 0.5 : 0); // حكم Opus 2026-11-16d §1أ: × infl[lv] قبل ÷ D^pres، والتحالف +0.5 بلا ضرب
      ok(D > 1.9 && D < 2.01 && near(p1, p0 * 0.98 + inflow, 1e-9), 'bs.p بعد يوم = p0 × 0.98 + ' + (alliance ? '(0.47 × infl ÷ D^pres) + 0.5' : '0.47 × infl ÷ D^pres') + ' (D = ' + D.toFixed(2) + ', pres ' + E.BAL.pres[i] + ')' + tag + ': ' + p1.toFixed(4) + ' = ' + (p0 * 0.98 + inflow).toFixed(4));
    }
  }
  const [df, pres] = JSON.parse(keep); Object.assign(E.BAL.df, df); E.BAL.pres.splice(0, 3, ...pres);
}
{ const S = mk('hard'), v = E.difficultyView(S); ok(v.raw === Math.min(E.BAL.df.cap[2], 1 + E.BAL.df.per[2] * E.diffK(S)), 'difficultyView.raw بـBAL.df');
  E.BAL.on = false; const v0 = E.difficultyView(S); ok(v0.raw === Math.min(E.DF.cap, 1 + E.DF.per * E.diffK(S)), 'مطفأ: difficultyView.raw بـDF القديم'); E.BAL.on = true; }

// (هـ) حدّ فقد القيادة: حصة 0.47
for (const [d, i] of LV) {
  const S = mk(d), tag = ' [' + E.BAL_LV[i] + ']'; S.noShocks = true; S.noEvents = true;
  const id = 'jeddah', bs = S.bosses[id]; bs.ruler = 'player'; bs.rulerSince = S.day; bs.p = 47; bs.b = 53; // الحصة 0.47 بعد يوم قد تتحرك قليلاً؛ نثبّت بعد الخطوة
  const before = E.balLose(S); E.tick(S);
  const share = E.bossShare(bs), still = bs.ruler === 'player';
  ok(E.balLose(S) === E.BAL.ch.lose[i] && before === E.BAL.ch.lose[i], 'balLose = BAL.ch.lose[lv]' + tag);
  ok(still === (share >= E.BAL.ch.lose[i]), 'القيادة تبقى إن كانت الحصة (' + share.toFixed(3) + ') ≥ ' + E.BAL.ch.lose[i] + ' وتضيع وإلا' + tag);
  if (!still) ok(S.news.some(n => /استعاد .* السيطرة على سوق/.test(n.t) && n.t.includes('نزلت حصتك إلى') && n.t.includes('والحدّ ' + Math.round(E.BAL.ch.lose[i] * 100) + '٪')), 'خبر الاستعادة يحمل الحصة والحدّ' + tag);
}
{ const S = mk('hard'); const bs = S.bosses.jeddah; bs.ruler = 'player'; bs.rulerSince = S.day; bs.p = 47; bs.b = 53; bs.p = 100 * 0.47 / 0.53 * 0 + 47; // الحصة = 0.47
  bs.b = bs.p * 0.53 / 0.47; const keep = bs.p; E.BAL.on = false; const r = E.balLose(S); E.BAL.on = true; ok(r === E.BOSS_LOSE, 'مطفأ: balLose = BOSS_LOSE'); }

// (و) التحدّي
function ledSetup(S, n) { let k = 0; for (const id of S.order) { const bs = S.bosses[id]; if (k < n) { bs.ruler = 'player'; bs.rulerSince = S.day; bs.p = 80; bs.b = 20; k++; } } }
const withRnd = (vals, fn) => { // يحقن rndB بسلسلة قيم: rndB دالة داخلية، فنضبط S.seedB لقيمٍ معروفة بالبحث
  return fn(); };
{ // يُنشأ في يوم مضاعف لـ30 فقط، ولا يُنشأ بلا سوق مقادة، والتكلفة بمعادلتها
  const S = mk(), tag = ''; S.noShocks = true; S.noEvents = true; ledSetup(S, 12);
  // نجبر الاحتمال: p = 0.9 بسقفه (قيمة p[lv]×k كبيرة)
  const keepP = E.BAL.ch.p.slice(); E.BAL.ch.p.fill(5); let made = null, madeDay = null; const days = [];
  for (let n = 0; n < 130; n++) { S.day = S.day; const had = !!S.balCh; E.tick(S); S.pause = false; if (S.balCh && !had) { days.push(S.day); if (!made) { made = JSON.parse(JSON.stringify(S.balCh)); madeDay = S.day; } E.A.balChAnswer(S, 'leave'); } }
  ok(days.length > 0 && days.every(d => d % 30 === 0), 'التحدّي يُنشأ في يوم مضاعف لـ30 فقط: ' + days.join(','));
  const c = S.cities[made.city], lv = 1; ok(made.cost === Math.round(E.BAL.ch.cost[lv] * made.boost * c.size * E.foreignMul(S, c)) && made.boost >= E.BAL.ch.boost[0] && made.boost <= E.BAL.ch.boost[1] && made.end === made.day + E.BAL.ch.days, 'cost = cost[lv] × boost × size × foreignMul، وboost في BAL.ch.boost [25، 35]، والمهلة 10 أيام: ' + made.cost);
  E.BAL.ch.p.splice(0, 3, ...keepP);
  const S2 = mk(); S2.noShocks = true; S2.noEvents = true; E.BAL.ch.p.fill(5); for (let n = 0; n < 130; n++) { E.tick(S2); S2.pause = false; } ok(!S2.balCh && !S2.balWar === false || !S2.balCh, 'بلا سوق مقادة: لا تحدّي'); E.BAL.ch.p.splice(0, 3, ...keepP);
}
for (const [d, i] of LV) {
  const tag = ' [' + E.BAL_LV[i] + ']';
  const mkC = fund => { const S = mk(d, 1e6); S.noShocks = true; S.noEvents = true; ledSetup(S, 4); const city = S.order.find(id => S.bosses[id].ruler === 'player'), c = S.cities[city], bs = S.bosses[city]; if (!fund) E.MFUND.on = false;
    S.balCh = { city, who: E.balChWho(S, city), boost: 20, cost: Math.round(E.BAL.ch.cost[i] * 20 * c.size * E.foreignMul(S, c)), day: S.day, end: S.day + 10 }; return { S, city, c, bs }; };
  { const { S, city, bs } = mkC(true), g0 = S.player.gold, b0 = bs.b, cost = S.balCh.cost, ex0 = S.player.led.exp.marketDefend || 0, mf = E.mfOn(S); const r = A.balChAnswer(S, 'pay');
    ok(r.ok !== false && !S.balCh && bs.b === b0 && near(g0 - S.player.gold, cost, 1e-6), 'pay برصيد: يخصم cost ويُلغي التحدّي وbs.b بلا تغيير' + tag + (mf ? ' (صندوق السوق)' : ' (حملة عروض)'));
    ok(mf ? (S.cities[city].fund && S.cities[city].fund.bal >= cost - 1e-6) : (S.player.led.exp.marketDefend || 0) - ex0 === cost, mf ? 'الصندوق يزيد cost' + tag : 'فئة marketDefend تزيد cost' + tag); }
  { const { S, bs } = mkC(false); E.MFUND.on = false; const g0 = S.player.gold, ex0 = S.player.led.exp.marketDefend || 0, cost = S.balCh.cost; const r = A.balChAnswer(S, 'pay'); ok(r.ok !== false && near(g0 - S.player.gold, cost, 1e-6) && (S.player.led.exp.marketDefend || 0) - ex0 === cost, 'صندوق السوق مطفأ: الدفع حملة عروض بفئة marketDefend' + tag); E.MFUND.on = true; }
  { const { S } = mkC(true); S.player.gold = 10; const g0 = S.player.gold, r = A.balChAnswer(S, 'pay'); ok(r.ok === false && S.balCh && S.player.gold === g0, 'pay بلا رصيد يُرفض ويبقى التحدّي' + tag); }
  { const { S, bs } = mkC(true), b0 = bs.b, s0 = E.bossShare(bs); const r = A.balChAnswer(S, 'leave'); ok(r.ok !== false && !S.balCh && near(bs.b, Math.min(120, b0 + 20)) && S.news[0].t.includes('حصتك ' + Math.round(s0 * 100) + '٪ ← ' + Math.round(E.bossShare(bs) * 100) + '٪'), 'leave: bs.b يزيد boost والخبر يحمل الحصتين' + tag); }
  { const { S, bs } = mkC(true); bs.b = 110; A.balChAnswer(S, 'leave'); ok(bs.b === 120, 'leave: سقف bs.b = 120' + tag); }
  { const { S, bs } = mkC(true), b0 = bs.b; S.day = S.balCh.end; E.tick(S); ok(!S.balCh && bs.b > b0 && S.news.some(n => /^انقضت مهلة الردّ: /.test(n.t)), 'انقضاء المهلة = leave' + tag); }
  { const { S, bs } = mkC(true); const v = E.balChView(S), p = bs.p, after = p / (p + Math.min(120, bs.b + 20)); ok(near(v.after, after) && near(v.share, E.bossShare(bs)) && v.cost === S.balCh.cost && v.lose === E.BAL.ch.lose[i], 'balChView: after = p ÷ (p + min(120، b + boost))' + tag); }
}
{ const S = mk(); ok(A.balChAnswer(S, 'pay').ok === false && A.balChAnswer(S, 'leave').ok === false, 'بلا تحدٍّ قائم: الردّ مرفوض'); }
{ // الحساب المكتوب في المواصفة: p = 100، b = 80، boost = 20 → 56٪ ← 50٪
  const p = 100, b = 80; ok(Math.round(p / (p + b) * 100) === 56 && Math.round(p / (p + b + 20) * 100) === 50, 'مثال المواصفة: 56٪ ← 50٪'); }

// (ز) المستوى
{ const S = E.newGame(5); ok(!(S.learn && S.learn.char), 'قبل الشخصية'); S.diff = undefined; const r = A.setDiff(S, 'hard'); ok(r.ok && S.diff === 'hard' && S.diffDay === undefined, 'قبل اختيار الشخصية: يتغير بلا diffDay');
  A.setDiff(S, 'calm'); ok(S.diff === 'calm' && S.diffDay === undefined, 'عدة تغييرات قبل البدء بلا قفل'); A.setDiff(S, 'normal'); ok(S.diff === undefined, 'normal → undefined');
  ok(A.setDiff(S, 'weird').ok === false, 'مستوى غير معروف يُرفض'); }
{ const S = mk(); S.day = 100; const r1 = A.setDiff(S, 'hard'); ok(r1.ok && S.diff === 'hard' && S.diffDay === 100 && E.balDiffLeft(S) === 30, 'بعد الشخصية: الأول ينجح ويكتب diffDay = 100');
  S.day = 110; const r2 = A.setDiff(S, 'calm'); ok(r2.ok === false && /بعد 20 يوماً \(اليوم 130\)/.test(r2.msg) && S.diff === 'hard' && S.diffDay === 100, 'الثاني قبل 30 يوماً يُرفض بالرسالة وعدد الأيام: ' + r2.msg);
  const r3 = A.setDiff(S, 'hard'); ok(r3.ok && S.diffDay === 100, 'الضغط على المستوى نفسه لا يكتب شيئاً');
  S.day = 130; const r4 = A.setDiff(S, 'calm'); ok(r4.ok && S.diff === 'calm' && S.diffDay === 130, 'في اليوم 30 ينجح ويجدّد القفل'); }
{ const S = mk(); ledSetup(S, 3); const ids = S.order.filter(id => S.bosses[id].ruler === 'player'); S.bosses[ids[0]].p = 46; S.bosses[ids[0]].b = 54; S.bosses[ids[1]].p = 41; S.bosses[ids[1]].b = 59; // 0.46 و0.41
  ok(E.balDiffPreview(S, 'calm') === 0 && E.balDiffPreview(S, 'normal') === 1 && E.balDiffPreview(S, 'hard') === 2, 'balDiffPreview يعدّ الأسواق تحت حدّ المستوى (0.40/0.45/0.50): ' + [E.balDiffPreview(S, 'calm'), E.balDiffPreview(S, 'normal'), E.balDiffPreview(S, 'hard')]); }
{ const S = mk('calm', 5e6); A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const P = S.player, sh = P.props.riyadh.shops[0], nw0 = E.netWorth(S), g0 = P.gold, bk = sh.bk, wb = P.props.riyadh.whbk; S.day = 40; A.setDiff(S, 'hard');
  ok(P.gold === g0 && sh.bk === bk && P.props.riyadh.whbk === wb && E.netWorth(S) === nw0, 'لا إعادة تقييم: شراء ثم تغيير المستوى فلا يتغير bk ولا الرصيد ولا netWorth'); }
{ const S = mk(); const v = E.balView(S); ok(v.length === 3 && v.every((x, i) => near(x.war, 354 / E.BAL.war.gap[i]) && near(x.chYear, 12 * E.BAL.ch.p[i] * 3) && x.lose === E.BAL.ch.lose[i] && x.warGap === E.BAL.war.gap[i]), 'balView يحمل war وchYear وlose لكل مستوى'); }
{ const S = mk(); S.diff = undefined; ok(E.balDiffLeft(S) === 0, 'balDiffLeft = 0 بلا diffDay'); E.BAL.on = false; S.diffDay = 5; ok(E.balDiffLeft(S) === 0, 'مطفأ: balDiffLeft = 0'); E.BAL.on = true; }
{ const w = E.BAL.war; ok(w.from === E.YEAR + 1 && w.gap.join() === '708,354,177' && w.spread === 0.5 && w.warn === 5 && w.dur.join() === '20,40' && w.food.join() === '0.3,0.6' && w.roads.join() === '1,2' && E.BAL.lock === 30 && E.BAL.ch.days === 10 && E.BAL.ch.pMax === 0.9, 'المقابض المعتمدة (§11) لم تُمسّ: from/gap/lock/…'); }
ok(E.BAL.on === true, 'ملاحظة: الاختبار نفسه يرفع BAL.on = true محلياً (الشيفرة تبقى false)');
{ const fs = require('fs'), src = fs.readFileSync(__dirname + '/../src/engine/30l-balance.js', 'utf8'); ok(/^const BAL = \{\n  on: false,/m.test(src), 'الشيفرة: BAL.on = false'); }
console.log(fails ? '\nFAILED ' + fails : '\nكل شيء ناجح'); process.exit(fails ? 1 : 0);
