/* ---------- 050 «يومك في 30 ثانية» + «بِع في أفضل سوق» + مسار التاجر + سباق رئاسة التجار ----------
   ثلاثة مفاتيح مستقلة؛ كلٌّ مطفأ = السلوك القديم حرفياً بلا حقل جديد في الحفظ.
   الحفظ الاختياري ينشأ عند أول حاجة: S.brief (لقطة آخر زيارة)، car.bm (رحلة «بِع في أفضل سوق»)، S.race (سوقك وترتيبك).
   كل الأرقام قراءة لما يحسبه المحرك (sellOptions، P.led، netWorth، chapterJourney، pjTier، rgWView)؛ لا معادلة جديدة سوى مجموع ثروة السوق (raceMarketW)
   الذي يقرأ أجزاءه من الدوال نفسها التي يقرؤها wealthReport. لا يلمس P.gold إلا عبر A.buy وA.sell وA.travel. */
const BRIEF = { on: true, ev: 3, asks: 3, reMin: 10, budget: 0.8, riskB: [0.06, 0.10] };
const BESTM = { on: true, n: 3, minQ: 3 };
const RACE = { on: true, margin: 1.15, hold: 30, week: 7, inflWin: 15, inflMonth: 2 };
const BRIEF_TXT = {
  noMove: 'لم يتحرك دفترك منذ آخر زيارة.', noNews: 'لا أخبار جديدة في أسواقك.', noStep: 'لا خطوة عاجلة اليوم؛ تجارتك تسير.', noAsk: 'لا شيء ينتظرك الآن.',
  noMarket: 'لا سوق رابح معروف لهذه السلعة الآن.', top: 'أعلى ألقاب التجار', mission: ' · وتُكمل مهمتك'
};
/* اسم اللاعب كما يُعرض في الرأس */
const brName = S => (S.player && S.player.name) || ((typeof LS !== 'undefined' && LS.CHARS.find(x => S.learn && x.id === S.learn.char)) || {}).name || 'التاجر';
const briefOn = S => !!(BRIEF.on && S && S.learn && S.learn.char);
/* الزمن بالأيام: تُلحق «ريال» ونحوها في الواجهة */
const brSgn = n => (n < 0 ? '−' : '+') + fmtN(Math.abs(n));
const brRisk = r => (r < BRIEF.riskB[0] ? 0 : r < BRIEF.riskB[1] ? 1 : 2);
const brRiskName = r => ['منخفض', 'متوسط', 'عالٍ'][brRisk(r)];

/* ===== 2) بِع في أفضل سوق ===== */
/* أفضل الأسواق: مجموعة جزئية من sellOptions بلا محجوب وبلا ربح ≤ 0 وبحد BESTM.n (مرتبة أصلاً بالربح) */
function bestMarkets(S, car, g, q, unitCost) {
  car = car || mainCar(S); q = Math.floor(q); if (!(q >= 1) || !GD[g]) return [];
  return sellOptions(S, car.city, g, q, unitCost, car, 'trade').filter(o => !travelBlock(S, car, o.city) && o.profit > 0).slice(0, BESTM.n);
}
/* خطوة اليوم المقترحة (الحالتان 1 و2 فقط؛ الثالثة بطاقة ask من الواجهة والرابعة «لا خطوة») */
function bestStep(S) {
  if (!BESTM.on || !S || !S.player) return null;
  const P = S.player, car = mainCar(S); if (!car || car.left !== 0) return null;
  const held = GIDS.filter(g => Math.floor(car.cargo[g] || 0) >= 1), tot = held.reduce((a, g) => a + Math.floor(car.cargo[g]), 0);
  if (tot >= BESTM.minQ) {
    let best = null;
    for (const g of held) { const q = Math.floor(car.cargo[g]), uc = avgCost(car.basis, g) || mid(g), ms = bestMarkets(S, car, g, q, uc); if (ms.length && (!best || ms[0].profit > best.o.profit)) best = { g, q, o: ms[0], alts: ms }; }
    if (best) return { kind: 'cargo', g: best.g, q: best.q, qBuy: 0, dest: best.o.city, o: best.o, alts: best.alts };
  } else if (tot === 0) {
    const d = bestDeal(S, car, P.gold * BRIEF.budget, 'trade');
    if (d) { const up = unitPrice(S.cities[car.city], d.g) * 1.04, ms = bestMarkets(S, car, d.g, d.q, up); if (ms.length && ms[0].profit > 0) return { kind: 'load', g: d.g, q: d.q, qBuy: d.q, dest: ms[0].city, o: ms[0], alts: ms, cost: up * d.q }; }
  }
  return null;
}
/* سطر «لماذا» (الحالتان 1 و2) */
function bestWhy(S, st) {
  const o = st.o; let t = 'ربح متوقع ≈ ' + fmtN(Math.round(o.profit)) + ' ريال · ' + dayWord(o.days) + ' · خطر الطريق ' + brRiskName(o.risk);
  if (o.age > 0) t += ' · تقدير من سعر عمره ' + dayWord(o.age);
  if (bestMission(S, o.city)) t += BRIEF_TXT.mission;
  return t;
}
/* الأيام بالعربية كما في الواجهة (dayAr)؛ مكرّرة هنا لأن المحرك لا يستورد الواجهة */
function dayWord(n) { const v = Math.round(+n); if (!isFinite(v)) return String(n) + ' يوماً'; const a = Math.abs(v); return a === 1 ? 'يوم' : a === 2 ? 'يومين' : a >= 3 && a <= 10 ? v + ' أيام' : v + ' يوماً'; }
/* هل مهمة مقبولة قالبها «بِع في سوق جديد» ولم يُبع في city من قبل؟ قراءة فقط */
function bestMission(S, city) {
  try { const T = S.player.tk2; if (!T || !(typeof tkOn === 'function' && tkOn(S))) return false; const v = tasksView(S); if (!v) return false;
    return v.slots.some(sl => sl.state === 'active' && sl.id === 'tr3') && !(T.seen && T.seen.sell && T.seen.sell[city]); } catch (e) { return false; }
}
/* الفعل: حمّل (اختيارياً) وسافر. الفحوص كلها قبل أي شراء */
function bestRun(S, carId, g, qBuy, dest, pace) {
  const car = carById(S, carId); if (!BESTM.on) return NO('الميزة مطفأة'); if (!car) return NO('قافلة غير معروفة'); if (!GD[g]) return NO('سلعة غير معروفة');
  if (car.left !== 0) return NO('القافلة في الطريق'); if (!S.cities[dest] || dest === car.city) return NO('وجهة غير صالحة');
  { const tb = travelBlock(S, car, dest); if (tb) return NO(tb); }
  qBuy = Math.max(0, Math.floor(+qBuy || 0)); let quote = null;
  if (qBuy > 0) {
    quote = quoteBuy(S, car.city, g, qBuy, S.player.gold); if (quote.n < qBuy) return NO('لا تكفي السلعة أو الرصيد لشراء ' + qBuy + ' ' + GD[g].name);
    if (capOfCar(car) - loadOf(car) < qBuy * GD[g].w - 1e-9) return NO('سعة القافلة لا تكفي');
  }
  { const days = tripDays(S, car, car.city, dest), need = supplyNeed(car, days) * unitPrice(S.cities[car.city], 'wheat') * perkMul(S, 'prov');
    if (S.player.gold - (quote ? quote.cost : 0) < need * 0.3) return NO('رصيدك لا يكفي لنفقة الطريق بعد الشراء'); }
  const held = Math.floor(car.cargo[g] || 0), unitCost = qBuy > 0 ? quote.cost / qBuy : (avgCost(car.basis, g) || mid(g)), o = sellOptions(S, car.city, g, Math.max(1, held + qBuy), unitCost, car, 'trade').find(x => x.city === dest);
  if (qBuy > 0) { const r1 = A.buy(S, carId, g, qBuy); if (!r1.ok) return r1; }
  const r2 = A.travel(S, carId, dest, pace);
  if (!r2.ok) return NO(r2.msg + ' (اشتريتَ البضاعة وبقيت في القافلة)');
  car.bm = { g, q: Math.floor(car.cargo[g] || 0), dest, est: o ? Math.round(o.profit) : 0, d0: S.day };
  return OK(r2.msg);
}
/* بيع في الوجهة: يجمع الربح الفعلي من A.sell ويكتب الخبر حين تنفد السلعة */
function planSold(S, carId, g, r) {
  const car = carById(S, carId), p = car && car.bm; if (!p || p.g !== g || car.city !== p.dest || !(r && r.ok && isFinite(r.pl))) return;
  p.real = (p.real || 0) + Math.round(r.pl);
  if (Math.floor(car.cargo[g] || 0) < 1) { news(S, 'ربح رحلة ' + GD[g].name + ' إلى ' + S.cities[p.dest].name + ': ' + brSgn(p.real) + ' ريال (قدّرناه ' + fmtN(p.est) + ').', p.real >= 0 ? 'good' : 'bad'); delete car.bm; }
}
/* حالة بطاقة الوصول: القافلة واقفة في وجهة خطتها */
function planArrived(S) {
  if (!BESTM.on || !S || !S.player) return null; const car = S.player.caravans.find(c => c.bm && c.left === 0 && c.city === c.bm.dest && Math.floor(c.cargo[c.bm.g] || 0) >= 1); if (!car) return null;
  const p = car.bm, q = Math.min(p.q, Math.floor(car.cargo[p.g])), uc = avgCost(car.basis, p.g) || 0, c = S.cities[car.city];
  const qs = quoteSell(S, car.city, p.g, q, qualOf(car.basis, p.g), null, 'trade', car.basis[p.g]), now = Math.round(qs.net - uc * q);
  return { car, g: p.g, q, city: car.city, est: p.est, now };
}
function planDrop(S, carId) { const car = carById(S, carId); if (car && car.bm) { delete car.bm; return true; } return false; }

/* ===== 1) يومك في 30 ثانية ===== */
/* نقطة المقارنة: لقطة آخر زيارة (S.brief) وإلا لا شيء (أول مرة) */
function briefSeen(S) {
  const P = S.player; S.brief = { seen: S.day, inc: Object.assign({}, P.led.inc), exp: Object.assign({}, P.led.exp) }; return S.brief;
}
/* ماذا حدث: صافي الدفتر + أخبار (bad ثم good ثم الباقي، الأحدث أولاً، بلا مكرر)؛ مع تقرير الغياب تُؤخذ أرقامه */
function briefView(S) {
  if (!briefOn(S)) return null;
  const P = S.player, R = S.awayReport || null, B = S.brief || null, first = !B && !R;
  const g = R ? R.days : B ? S.day - B.seen : 0, since = R ? S.day - R.days : B ? B.seen : S.day;
  let inc = {}, exp = {}, net = 0, any = false;
  if (R) { for (const [k, v] of (R.inc || [])) { if (v > 0) inc[k] = v; } for (const [k, v] of (R.exp || [])) { if (v > 0) exp[k] = v; } net = Math.round(R.change); any = true; }
  else if (B) { for (const k in P.led.inc) { const v = Math.round((P.led.inc[k] || 0) - ((B.inc || {})[k] || 0)); if (v > 0) inc[k] = v; } for (const k in P.led.exp) { const v = Math.round((P.led.exp[k] || 0) - ((B.exp || {})[k] || 0)); if (v > 0) exp[k] = v; }
    net = Object.values(inc).reduce((a, b) => a + b, 0) - Object.values(exp).reduce((a, b) => a + b, 0); any = Object.keys(inc).length + Object.keys(exp).length > 0; }
  const top = o => { let k = null; for (const x in o) if (k == null || o[x] > o[k]) k = x; return k ? { k, v: o[k] } : null; };
  const seen = new Set(), rank = n => (n.k === 'bad' ? 0 : n.k === 'good' ? 1 : 2), raceN = [], rest = [];
  for (const n of (S.news || [])) { if (!(n.d > since)) continue; (n.race ? raceN : rest).push(n); }
  rest.sort((a, b) => rank(a) - rank(b) || b.d - a.d);
  const events = []; for (const n of raceN.concat(rest)) { const t = String(n.t || ''); if (!t || seen.has(t)) continue; seen.add(t); events.push({ t, k: n.k || '', d: n.d, race: !!n.race }); if (events.length >= BRIEF.ev - 1) break; }
  return { first, days: g, hasAway: !!R, since, net, any, inc, exp, topInc: top(inc), topExp: top(exp), events };
}

/* ===== 1-و) مسار التاجر: قراءة فقط ===== */
function progView(S, pieces) {
  if (!S || !S.player || !S.learn || !S.learn.char) return null;
  const nw = netWorth(S), T = WEALTH_TITLES; let i = 0; for (let k = 0; k < T.length; k++) if (nw >= T[k][0]) i = k;
  const last = i >= T.length - 1, pct = last ? 1 : clamp((nw - T[i][0]) / (T[i + 1][0] - T[i][0]), 0, 1), left = last ? 0 : Math.ceil(T[i + 1][0] - nw);
  let ch = 1; try { const J = chapterJourney(S, pieces || []), cur = J.find(x => x.state === 'current'); ch = cur ? cur.n : ((J.filter(x => x.state === 'done').pop() || {}).n || 1); } catch (e) {}
  const pj = typeof pjTier === 'function' ? pjTier(S) : 0, pjNext = PJ_TIERS[pj], rk = traderRank(S), xpLeft = rk < RANK_MAX ? XP_PER_RANK * (rk + 1) - pointsEarned(S).xp : 0;
  return { nw, title: T[i][1], next: last ? null : T[i + 1][1], nextAt: last ? null : T[i + 1][0], left, pct, last, ch, pj, pjNext: pjNext == null ? null : pjNext, rk, xpLeft,
    slotNext: rk < RANK_MAX ? { shops: SLOT_SHOPS[rk + 1] > SLOT_SHOPS[rk] ? SLOT_SHOPS[rk + 1] : 0, fleet: SLOT_FLEET[rk + 1] > SLOT_FLEET[rk] ? SLOT_FLEET[rk + 1] : 0 } : null };
}

/* ===== 4) سباق رئاسة التجار ===== */
/* مجموع ثروتك في سوق واحد: أجزاؤه من الدوال نفسها التي تقرؤها wealthReport (wrShopV وwrWhsV وwrFactV وwrCityV) */
function raceMarketW(S, cid) {
  const P = S.player, pr = P.props[cid]; let w = 0;
  if (pr) w += valueOf(pr.store) + wrShopV(P, cid) + wrWhsV(pr) + farmValue(pr);
  for (const f of (P.factories || [])) if (f.city === cid) w += wrFactV(f);
  w += (P.bank.dep[cid] || 0);
  for (const ag of (P.agr || [])) if (ag.city === cid && (ag.kind === 'mud' || ag.kind === 'rmud')) w += mudValue(ag);
  const cv = wrCityV(S, cid); return w + cv.own + cv.rule;
}
const raceOn = S => !!(RACE.on && S && S.learn && S.learn.char && rgW(S));
/* سوقك: المدينة ذات أكبر mw بين مدن فيها منافس حي له rv.w؛ التعادل: التي تحكمها ثم مدينة البداية ثم ترتيب S.order. تُعاد شهرياً فقط */
function racePick(S, by) {
  if (!raceOn(S)) return; const R = S.race || (S.race = { cid: null, rk: 0, wk: -1, pl: {} });
  const ch = rgState(S).chief || {}, cur = R.cid, keep = cur && ch[cur] && (ch[cur].id === -1 || ch[cur].cand === -1) && (by[cur] || []).length > 0; if (keep) return; // الرئيس والمرشّح يبقى سباقهما ما دام فيه منافس حي
  let best = null, bw = -1;
  for (const cid of S.order) { if (!(by[cid] || []).length) continue; const mw = raceMarketW(S, cid), rule = (bossOf(S, cid) || {}).ruler === 'player' ? 1 : 0, home = cid === S.startCity ? 1 : 0;
    const key = [mw, rule, home]; if (!best || key[0] > best[0] || (key[0] === best[0] && (key[1] > best[1] || (key[1] === best[1] && key[2] > best[2])))) { best = key; bw = cid; } }
  R.cid = best ? bw : null; if (R.cid !== cur) R.rk = 0;
}
/* الترتيب في سوق cid: أنت + منافسوه الأحياء ذوو الثروة */
function raceRank(S, cid) {
  const me = raceMarketW(S, cid), L = [{ id: -1, name: brName(S), w: me, me: true }];
  for (const rv of (S.rivals || [])) if (rv.city === cid && rv.out == null && rv.w != null) L.push({ id: rv.id, name: rv.name, w: rv.w, rv });
  L.sort((a, b) => b.w - a.w || a.id - b.id); const rk = L.findIndex(x => x.me) + 1;
  return { L, rk, mw: me, gapUp: rk > 1 ? L[rk - 2].w - me : 0, lead: rk === 1 && L.length > 1 ? me / L[1].w : null, above: rk > 1 ? L[rk - 2] : null };
}
/* العرض: يحترم المعرفة (ثروة المنافس من rgWView) ويبقى الترتيب معلناً */
function raceView(S) {
  if (!raceOn(S) || !S.race || !S.race.cid || !S.cities[S.race.cid]) return null; const cid = S.race.cid, r = raceRank(S, cid), st = rgChiefSt(S, cid) || { id: 0, cand: 0, cd: 0 };
  if (r.L.length < 2) return null;
  const rows = r.L.map(x => ({ id: x.id, name: x.me ? 'أنت' : x.name, me: !!x.me, w: x.w, view: x.me ? { exact: true, v: x.w, lo: x.w, hi: x.w } : rgWView(S, x.rv), chief: st.id === x.id }));
  let shown = rows.slice(0, 4); if (r.rk > 4) shown = rows.slice(0, 3).concat(rows[r.rk - 1]);
  const mid = x => (x.view ? (x.view.exact ? x.view.v : (x.view.lo + x.view.hi) / 2) : x.w), mx = Math.max(1, ...shown.map(mid));
  shown = shown.map(x => ({ ...x, pos: rows.indexOf(x) + 1, bar: Math.max(0.02, mid(x) / mx) }));
  const ab = r.above ? rows[r.rk - 2] : null, gapExact = !!(ab && ab.view && ab.view.exact);
  return { cid, city: S.cities[cid].name, rows: shown, n: r.L.length, rk: r.rk, mw: r.mw, gapUp: Math.round(r.gapUp), gapExact, gapLo: ab && ab.view && !ab.view.exact ? Math.max(0, ab.view.lo - r.mw) : 0, gapHi: ab && ab.view && !ab.view.exact ? Math.max(0, ab.view.hi - r.mw) : 0,
    above: ab ? ab.name : '', lead: r.lead, chiefMe: st.id === -1, cand: st.cand === -1, left: st.cand === -1 ? Math.max(0, RACE.hold - (S.day - st.cd)) : 0, leadPct: r.lead ? Math.round((r.lead - 1) * 100) : 0 };
}
/* المنصب (من rgChiefMonth): اللاعب مرشّح كأي منافس في cid وحدها. يُعاد L مضافاً إليه صفّك */
function raceChiefL(S, cid, L) {
  if (!raceOn(S) || !S.race || S.race.cid !== cid) return L;
  const me = { id: -1, name: brName(S), w: raceMarketW(S, cid), me: true }; return L.concat([me]).sort((a, b) => b.w - a.w || a.id - b.id);
}
/* أثر الفوز: نفوذ حقيقي لا ذهب ولا خصم؛ أول مرة في المدينة +15 ثم +2 كل شهر وأنت رئيس */
function raceChiefAward(S, cid, first) {
  if (!raceOn(S)) return; const nm = S.cities[cid].name;
  if (first) bonusAward(S, 'race:' + cid, RACE.inflWin, 0, 'صرتَ رئيس التجار في سوق ' + nm);
  else bonusAward(S, 'racem:' + cid + ':' + Math.floor(S.day / PR.month), RACE.inflMonth, 0, null);
}
function raceDay(S) {
  if (!raceOn(S) || !S.race || !S.race.cid || S.day % RACE.week !== 0 || S.race.wk === S.day) return; const R = S.race, cid = R.cid;
  const r = raceRank(S, cid); if (r.L.length < 2) return; R.wk = S.day; const old = R.rk | 0; R.rk = r.rk; if (!old || old === r.rk) return;
  const nm = S.cities[cid].name;
  if (r.rk < old) news(S, 'تقدّمتَ في سباق رئاسة التجار في ' + nm + ': صرتَ ' + r.rk + ' من ' + r.L.length + '.', 'good');
  else news(S, 'تأخّرتَ في سباق ' + nm + ': صرتَ ' + r.rk + ' من ' + r.L.length + '؛ سبقك ' + r.above.name + '.', 'bad');
  S.news[0].race = 1; // يتقدّم «ماذا حدث» في اللوحة
}
/* الدورة اليومية: السباق الأسبوعي وتنظيف خطط الرحلات */
function briefDay(S) {
  if (BESTM.on) for (const car of S.player.caravans) { const p = car.bm; if (!p) continue; if (!(Math.floor(car.cargo[p.g] || 0) >= 1) || (car.left > 0 && car.dest !== p.dest)) delete car.bm; }
  raceDay(S);
}
A.bestRun = bestRun;
{ const sell0 = A.sell; A.sell = function (S, carId, g, qty, mode) { const r = sell0.apply(A, arguments); if (BESTM.on && r && r.ok && mode !== 'herd') planSold(S, carId, g, r); return r; }; }
