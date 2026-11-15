/* ---------- 046 المشاريع الكبرى استثمارات (المواصفة: specs/046-projects-invest/spec.md) ----------
   كل مشروع مكتمل أصل تشغيلي: رأس مال C، تشغيل يومي u = C×UP/354 يمرّ بـpayObligation (المتأخرات وتغطية الناظر والسيولة)،
   وحالة cond تهترئ بلا صيانة وتُضرب بقوة الأثر القديم (cond/60)، وأحداث شهرية، وتقرير باسترداد رأس المال.
   التشغيلي (P01 P20 P04 P05 P14 P09) له دخل inc = g×T×M×K من غير اللاعب (PJ-05 PJ-07..10 معتمدة)؛ الخدمي (P07 وبقية الأثر) لا أجرة له
   وعائده غير المباشر مقيس في موضع الأثر نفسه (ops.ind). المخفي للمراجعة (⚑) لا يدفع ولا يقبض.
   الحفظ: البيانات في S.projects.ops[key] فقط (تُنشأ عند أول يوم والمفتاح مفعّل) وعدّادا الحركة S.projects.tr؛ PJINV.on=false = سلوك 015 حرفياً بلا حقل جديد. */
const PJINV = { on: true };
const PJ_INV = {
  year: 354, gain: { road: 0.47, net: 0.54, city: 0.64, cc: 0.73, port: 0.74 }, tUsual: { road: 2.7, net: 2.9, city: 1.6, cc: 1.4, port: 1.5 }, // معايرة tools/projects-roi.js (8 بذور × 3 سنوات): ضرب الدخل ليطابق الاسترداد PB عند أزحم موضع؛ tUsual = حركة الموضع المعتاد المقيسة لتقدير ما قبل الدفع
  start: 80, wear: 0.25, mend: 0.35, neglect: 0.9, hold: 90, repairTo: 90, repairRate: 0.005, below: 60, flood: 20, ring: 30, month: 30, epiMul: 1.5,
  up: { op: 0.04, sv: 0.025 }, pb: { P20: 2.5, P01: 3, P04: 3.5, P09: 3.5, P05: 4, P14: 6 },
  raid: { mul: 2, cap: 0.25, lo: 15, hi: 30, slow: 0.5 }, fire: 0.03, storm: 0.04, stormOff: 2, hit: { P04: [10, 25], P05: [10, 25] }, pcts: [10, 25, 50],
  arrW: 0.25, arrWnet: 0.03, rivalW: 0.15, festival: 1.5, shock: 0.5, war: 0.3, netCap: 3,
};
const PJ_KIND = { P01: 'road', P20: 'road', P14: 'net', P04: 'city', P09: 'cc', P05: 'port' };
const pjOpKind = id => PJ_KIND[pjBase(id)] || null, pjIsOp = id => !!PJ_KIND[pjBase(id)];
const pjInvOn = S => !!(PJINV.on && pjOn(S) && pjData(S));
const pjR = x => Math.round(x * 100) / 100;
const pjCl = x => Math.max(0, Math.min(100, pjR(x)));
/* ---- ops: يُنشأ عند أول يوم؛ المسجَّل القديم الفاسد يُنقّى ---- */
function pjOps(S, key, make) {
  const p = pjData(S); if (!p) return null; if (!p.ops || typeof p.ops !== 'object') { if (!make) return null; p.ops = {}; }
  let o = p.ops[key];
  if (!o || typeof o !== 'object') { if (!make) return null; o = p.ops[key] = { cond: PJ_INV.start, since: S.day, rec: 0, r: { i: [], u: [], f: [] }, ev: [], ind: { uses: 0, saved: 0, pts: 0 }, low: 0, slow: 0 }; }
  if (!Number.isFinite(o.cond)) o.cond = PJ_INV.start; o.cond = pjCl(o.cond); if (!Number.isFinite(o.rec)) o.rec = 0;
  if (!o.r || typeof o.r !== 'object') o.r = { i: [], u: [], f: [] }; for (const k of ['i', 'u', 'f']) if (!Array.isArray(o.r[k])) o.r[k] = [];
  if (!Array.isArray(o.ev)) o.ev = []; if (!o.ind || typeof o.ind !== 'object') o.ind = { uses: 0, saved: 0, pts: 0 };
  return o;
}
const pjCond = (S, key) => { const o = PJINV.on ? pjOps(S, key, false) : null; return o ? o.cond : PJ_INV.start; };
const pjStr = (S, key) => (PJINV.on ? Math.max(0, Math.min(1, pjCond(S, key) / 60)) : 1); // قوة الأثر القديم
const pjSusp = (S, key, fx) => { if (!PJINV.on || fx.k !== 'days') return false; const o = pjOps(S, key, false); return !!(o && o.flood); }; // فيضان: أثر الزمن معلّق
const pjFxMul = (S, key, v) => (PJINV.on ? 1 + (v - 1) * pjStr(S, key) : v), pjFxAdd = (S, key, v) => (PJINV.on ? v * pjStr(S, key) : v);
/* ---- حركة الطرق والموانئ: عدّاد بتناقص يومي (≈ عدد الوصولات في 30 يوماً) ---- */
const pjDec = (o, day) => o.v * Math.pow(1 - 1 / PJ_INV.month, Math.max(0, day - o.d));
function pjBump(S, k) { const p = pjData(S); if (!p || !p.done || !p.done.length) return; const t = p.tr || (p.tr = {}), o = t[k] || (t[k] = { v: 0, d: S.day }); o.v = pjR(pjDec(o, S.day) + 1); o.d = S.day; }
const pjArr = (S, a, b) => { if (PJINV.on && pjOn(S)) pjBump(S, 'r:' + riskKey(a, b)); }, pjShip = (S, city) => { if (PJINV.on && pjOn(S)) pjBump(S, 's:' + city); };
function pjArr30(S, k) { const p = pjData(S), o = p && p.tr && p.tr[k]; return o && Number.isFinite(o.v) && Number.isFinite(o.d) ? pjDec(o, S.day) : 0; }
/* ---- القياس في موضع الأثر: uses++ وما وُفّر (ريال) أو نقاط، لكل مشروع مكتمل ينطبق عليه المفتاح ---- */
function pjUseBase(S, k, ctx, base, pts) {
  if (!pjInvOn(S) || !(base > 0 || base === 0)) return; const p = pjData(S);
  for (const id of p.done) { const d = PROJECTS[pjBase(id)]; if (!d || pjHidden(id)) continue;
    for (const fx of d.fx) { if (fx.k !== k || !pjMatch(S, id, fx, ctx) || pjSusp(S, id, fx)) continue; const o = pjOps(S, id, true), st = pjStr(S, id);
      const eff = fx.mul ? 1 + (fx.mul - 1) * st : 0, gain = fx.mul ? (eff < 1 ? base * (1 - eff) : base * (1 - 1 / eff)) : base * (fx.add || 0) * st;
      o.ind.uses++; if (pts && !fx.mul) o.ind.pts = Math.max(o.ind.pts, pjR(gain)); else if (pts) o.ind.pts = pjR(o.ind.pts + gain); else o.ind.saved = Math.round(o.ind.saved + gain); } }
}
const pjUseSave = (S, k, ctx, base) => pjUseBase(S, k, ctx, base, false), pjUsePts = (S, k, ctx, base) => pjUseBase(S, k, ctx, base, true);
/* ---- أماكن المشروع ---- */
function pjCities(S, key) {
  const d = PROJECTS[pjBase(key)], pk = pjData(S).pick[key]; if (pk == null) return [];
  if (d.pick === 'route') return String(pk).split('|').filter(c => S.cities[c]); if (d.pick === 'country') return S.order.filter(c => pjCountry(S, c) === pk); return S.cities[pk] ? [pk] : [];
}
function pjCity(S, key) { const cs = pjCities(S, key); return cs.find(c => S.cities[c].country === S.home) || cs[0] || S.order[0]; }
function pjProsTrade(S, c) { try { const v = prosperityView(S, c); const d = v && v.dims && v.dims.find(x => x.k === 'trade'); return d ? d.v : 50; } catch (e) { return 50; } }
const pjCityT = (S, c, id) => { const cc = S.cities[c]; return Math.max(0.4, Math.min(2.5, popTotal(cc) / 1500)) * (id === 'P05' ? 1 + 0.1 * pjArr30(S, 's:' + c) : 0.75 + 0.5 * pjProsTrade(S, c) / 100); };
function pjTraffic(S, key) {
  const id = pjBase(key), k = pjOpKind(id), pk = pjData(S).pick[key], cs = pjCities(S, key); if (!k || !cs.length) return 0;
  if (k === 'road') { const [a, b] = cs; if (!b) return 0.4; return Math.max(0.4, Math.min(2.5, (popTotal(S.cities[a]) + popTotal(S.cities[b])) / 2000)) * (1 + PJ_INV.rivalW * Math.min(2, rivalPresence(S, a) + rivalPresence(S, b))) + PJ_INV.arrW * pjArr30(S, 'r:' + pk); }
  if (k === 'net') { let arr = 0; const t = pjData(S).tr || {}; for (const kk in t) if (kk.startsWith('r:') && kk.slice(2).split('|').some(c => cs.includes(c))) arr += pjArr30(S, kk); return Math.min(PJ_INV.netCap, cs.reduce((n, c) => n + popTotal(S.cities[c]), 0) / 2000 / cs.length * 1.5 + PJ_INV.arrWnet * arr); }
  if (k === 'cc') return cs.reduce((n, c) => n + pjCityT(S, c, id), 0) / cs.length;
  return pjCityT(S, cs[0], id);
}
/* الموسم والحال M: مهرجان ×1.5 (P04 وP09)، c.sh ×0.5 على المدينة أو أحد طرفي الطريق، حرب ×0.3 */
function pjSeason(S, key) {
  const id = pjBase(key), cs = pjCities(S, key); if (!cs.length) return 1; const f = c => { const cc = S.cities[c], e = cc.ev && cc.ev.k; return (e === 'war' ? PJ_INV.war : 1) * (cc.sh ? PJ_INV.shock : 1) * (e === 'festival' && (id === 'P04' || id === 'P09') ? PJ_INV.festival : 1); };
  if (pjOpKind(id) === 'road') { const m = cs.map(f); return cs.some(c => S.cities[c].ev && S.cities[c].ev.k === 'war') ? Math.min(...m) : cs.some(c => S.cities[c].sh) ? PJ_INV.shock : 1; }
  return cs.reduce((n, c) => n + f(c), 0) / cs.length;
}
const pjUp = id => pjCost(id) * (pjIsOp(id) ? PJ_INV.up.op : PJ_INV.up.sv) / PJ_INV.year;
const pjG = id => pjCost(id) / (PJ_INV.pb[pjBase(id)] * PJ_INV.year) + pjUp(id);
const pjK = cond => 0.6 + 0.4 * cond / 100;
function pjEpi(S, key) { return pjCities(S, key).some(c => { const cc = S.cities[c]; return (cc.ev && cc.ev.k === 'plague') || (cc.sh && cc.sh.k === 'famine'); }); }
/* الدخل اليومي (تشغيلي فقط) عند حالة cond */
function pjIncome(S, key, o) { const id = pjBase(key); if (!pjIsOp(id) || o.off) return 0; return pjG(id) * pjTraffic(S, key) * pjSeason(S, key) * pjK(o.cond) * PJ_INV.gain[pjOpKind(id)] * (o.slow > 0 ? PJ_INV.raid.slow : 1); }
function pjPush(a, v) { a.push(Math.round(v)); while (a.length > PJ_INV.ring) a.shift(); }
const pjSum = a => a.reduce((x, y) => x + y, 0);
/* ---- الترميم ---- */
function pjQuote(S, key) {
  const p = pjData(S); if (!PJINV.on || !p || !p.done.includes(key)) return null; const o = pjOps(S, key, false), cond = o ? o.cond : PJ_INV.start, id = pjBase(key), C = pjCost(id);
  const gain = Math.max(0, PJ_INV.repairTo - cond), cost = Math.ceil(gain / 10) * C * PJ_INV.repairRate; return { key, cond, to: PJ_INV.repairTo, gain, cost, can: gain > 0.5 };
}
function projectRepair(S, key) {
  if (!pjInvOn(S)) return NO('الترميم غير متاح'); const q = pjQuote(S, key); if (!q) return NO('لا مشروع مكتمل بهذا الاسم'); const id = pjBase(key); if (pjHidden(id)) return NO('لا مشروع بهذا الاسم');
  if (!q.can) return NO('حالته جيدة: لا يحتاج ترميماً'); if (S.player.gold + 1e-6 < q.cost) return NO('رصيدك لا يكفي للترميم (يلزم ' + fmtN(q.cost) + ' ريال)');
  const o = pjOps(S, key, true), c0 = S.ctxCur; S.ctxCur = 'sar'; const paid = pPay(S, 'projectRepair', q.cost, true); S.ctxCur = c0; o.cond = q.to; o.flood = false; pjR1(o, 'f', paid); o.rec = pjR(o.rec - paid);
  return OK('رمّمتَ «' + PROJECTS[id].name + '»: صارت حالته ' + Math.round(q.to) + ' (' + fmtN(paid) + ' ريال)');
}
function pjR1(o, k, v) { const a = o.r[k]; if (!a.length) a.push(0); a[a.length - 1] += Math.round(v); } // يضيف إلى سجل اليوم الأخير
/* إيقاف التشغيل: يتوقف الدفع والدخل ويبقى الأثر بقوة cond (الحالة تتآكل بالإهمال البطيء) */
function projectStop(S, key, on) {
  if (!pjInvOn(S)) return NO('غير متاح'); const p = pjData(S); if (!p.done.includes(key)) return NO('لا مشروع مكتمل بهذا الاسم'); const o = pjOps(S, key, true);
  if (on === false) { if (!o.off) return NO('يعمل أصلاً'); o.off = false; o.low = 0; return OK('استؤنف تشغيل «' + PROJECTS[pjBase(key)].name + '»'); }
  if (o.off) return NO('متوقف أصلاً'); o.off = true; return OK('أُوقف تشغيل «' + PROJECTS[pjBase(key)].name + '»: لا دفع ولا دخل، ويبقى أثره بقدر حالته');
}
/* ---- الأحداث الشهرية (بذرية rnd(S)) ---- */
function pjEv(S, key, o, k, text, hit) {
  o.cond = pjCl(o.cond - hit); o.ev.unshift({ d: S.day, k, text, seen: false }); if (o.ev.length > 5) o.ev.length = 5; news(S, text + ' (حالة المشروع الآن ' + Math.round(o.cond) + ')', 'bad');
}
function pjRoadRisk(S, key) { const pk = pjData(S).pick[key]; if (PROJECTS[pjBase(key)].pick === 'route') return S.risk[pk] || 0; const ks = Object.keys(S.risk).filter(r => r.split('|').some(c => S.cities[c] && S.cities[c].country === pk)); return ks.length ? ks.reduce((n, r) => n + S.risk[r], 0) / ks.length : 0; }
function pjMonthEvents(S, key, o) {
  const id = pjBase(key), nm = PROJECTS[id].name, cs = pjCities(S, key), where = cs.length ? cs.map(c => S.cities[c].name).join(' - ') : '';
  if (id === 'P01' || id === 'P20' || id === 'P14') { const pr = Math.min(PJ_INV.raid.cap, PJ_INV.raid.mul * pjRoadRisk(S, key)); if (rnd(S) < pr) { const h = Math.round(PJ_INV.raid.lo + rnd(S) * (PJ_INV.raid.hi - PJ_INV.raid.lo)); o.slow = PJ_INV.month; pjEv(S, key, o, 'raid', 'غارة لصوص على «' + nm + '» (' + where + '): نُهب بعض ما فيه ونزل دخل الشهر إلى النصف', h); } }
  else if (id === 'P04') { if (rnd(S) < PJ_INV.fire) { const h = Math.round(PJ_INV.hit.P04[0] + rnd(S) * (PJ_INV.hit.P04[1] - PJ_INV.hit.P04[0])); o.slow = PJ_INV.month; pjEv(S, key, o, 'fire', 'حريق في «' + nm + '» (' + where + ')', h); } }
  else if (id === 'P05') { const other = PORTS.find(c => c !== cs[0] && S.cities[c] && SEA_REGION[c] !== SEA_REGION[cs[0]]), fair = !other || monsoonOf(S, cs[0], other).fair; if (rnd(S) < PJ_INV.storm * (fair ? 1 : PJ_INV.stormOff)) { const h = Math.round(PJ_INV.hit.P05[0] + rnd(S) * (PJ_INV.hit.P05[1] - PJ_INV.hit.P05[0])); o.slow = PJ_INV.month; pjEv(S, key, o, 'storm', 'عاصفة على «' + nm + '» (' + where + ')', h); } }
}
/* ---- اليوم ---- */
function pjStepCond(o, ok) { if (!ok) return pjCl(o.cond - PJ_INV.neglect); const n = o.cond + PJ_INV.mend - PJ_INV.wear; return pjCl(n > PJ_INV.hold ? Math.max(PJ_INV.hold, Math.min(o.cond, n)) : n); }
function pjDay(S) {
  if (!pjInvOn(S)) return; const p = pjData(S); if (!p.done.length) return; const roll = S.day % PJ_INV.month === 0, c0 = S.ctxCur; S.ctxCur = 'sar'; const sums = [];
  for (const key of p.done.slice()) { const id = pjBase(key), d = PROJECTS[id]; if (!d || pjHidden(id) || p.pick[key] == null) continue; const o = pjOps(S, key, true); if (o.dd === S.day) continue; o.dd = S.day;
    for (const k of ['i', 'u', 'f']) o.r[k].push(0); for (const k of ['i', 'u', 'f']) while (o.r[k].length > PJ_INV.ring) o.r[k].shift(); if (o.slow > 0) o.slow--;
    if (id === 'P07') { const fl = pjCities(S, key).some(c => S.cities[c].sh && S.cities[c].sh.k === 'flood'); if (fl && !o.flood) { o.flood = true; pjEv(S, key, o, 'flood', 'فيضان على «' + d.name + '»: عُلّق أثره على زمن الرحلة مدة الصدمة', PJ_INV.flood); } else if (!fl && o.flood) o.flood = false; }
    if (!o.off) {
      const u = pjUp(id) * (!pjIsOp(id) && pjEpi(S, key) ? PJ_INV.epiMul : 1), city = pjCity(S, key), paid = payObligation(S, 'upkeep', u, city, 'project', o, 'تشغيل «' + d.name + '»'), ok = paid >= u - 1e-6;
      o.cond = pjStepCond(o, ok); const inc = pjIncome(S, key, o);
      if (inc > 0) { S.player.gold += inc; S.player.led.inc.projectIncome = (S.player.led.inc.projectIncome || 0) + inc; fauc(S, 'projectIncome', inc); }
      o.r.i[o.r.i.length - 1] += Math.round(inc); o.r.u[o.r.u.length - 1] += Math.round(paid); o.rec = pjR(o.rec + inc - paid);
    } else o.cond = pjCl(o.cond - PJ_INV.wear);
    if (roll) { pjMonthEvents(S, key, o); const net = pjSum(o.r.i) - pjSum(o.r.u) - pjSum(o.r.f); o.low = pjIsOp(id) && !o.off && net < 0 ? (o.low || 0) + 1 : 0; sums.push({ key, id, net }); }
  }
  S.ctxCur = c0;
  if (roll && sums.length) { const t = sums.reduce((n, x) => n + x.net, 0); news(S, 'مشاريعك هذا الشهر: صافي ' + (t < 0 ? '−' : '+') + fmtN(Math.abs(t)) + ' ريال (' + sums.slice(0, 4).map(x => PROJECTS[x.id].name + ' ' + (x.net < 0 ? '−' : '+') + fmtN(Math.abs(x.net))).join('، ') + (sums.length > 4 ? '…' : '') + ')', t < 0 ? 'bad' : 'good'); }
}
/* ---- التقرير ---- */
function projectReport(S, key) {
  const p = pjData(S); if (!PJINV.on || !p || !p.done.includes(key)) return null; const id = pjBase(key), C = pjCost(id), o = pjOps(S, key, false) || { cond: PJ_INV.start, rec: 0, r: { i: [], u: [], f: [] }, ev: [], ind: { uses: 0, saved: 0, pts: 0 }, low: 0 };
  const inc30 = pjSum(o.r.i), up30 = pjSum(o.r.u), rep30 = pjSum(o.r.f), net30 = inc30 - up30 - rep30, recovered = Math.max(0, Math.round(o.rec)), op = pjIsOp(id);
  const pay = op && net30 > 0 ? Math.max(0, (C - recovered)) / Math.max(1, net30 / 30) : null;
  return { key, id, name: PROJECTS[id].name, op, C, inc30, up30, rep30, net30, recovered, recoveredPct: Math.min(100, Math.round(recovered / C * 1000) / 10), paybackDays: pay == null ? null : Math.round(pay), paybackText: !op ? '' : recovered >= C ? 'استردّ رأس ماله' : pay == null ? 'لا يُسترد بهذا المعدل' : 'نحو ' + (pay / PJ_INV.year).toFixed(1) + ' سنة', cond: o.cond, T: op && pjData(S).pick[key] != null ? pjR(pjTraffic(S, key)) : null, M: op ? pjR(pjSeason(S, key)) : null, ev: o.ev.slice(), ind: Object.assign({}, o.ind), off: !!o.off, flood: !!o.flood, low: o.low || 0, quote: pjQuote(S, key), where: pjCities(S, key).map(c => S.cities[c].name).join(' - '), up: pjUp(id), eff: PROJECTS[id].eff };
}
function projectsReport(S) {
  if (!pjInvOn(S)) return null; const p = pjData(S), list = p.done.filter(k => !pjHidden(pjBase(k)) && p.pick[k] != null).map(k => projectReport(S, k)).filter(Boolean); if (!list.length) return null;
  return { list, running: list.filter(x => !x.off).length, net30: list.reduce((n, x) => n + x.net30, 0), low: list.filter(x => x.cond < PJ_INV.below), losing: list.filter(x => x.low >= 3 && !x.off), evs: list.filter(x => x.ev.length && !x.ev[0].seen && S.day - x.ev[0].d <= 14 && x.ev[0].k !== 'flood') };
}
const pjEvSeen = (S, key) => { const o = pjOps(S, key, false); if (o && o.ev[0]) o.ev[0].seen = true; return OK(''); };
/* تقدير قبل الدفع (نص PJ-12 معتمد حرفاً): عند حركة معتادة T=1 وM=1 وحالة مستقرة */
function projectEstimate(S, id) {
  id = pjBase(id); const d = PROJECTS[id]; if (!d || !PJINV.on) return null; const C = pjCost(id), up = C * (pjIsOp(id) ? PJ_INV.up.op : PJ_INV.up.sv);
  if (!pjIsOp(id)) return { op: false, C, up: Math.round(up), text: 'تشغيل ≈ ' + fmtN(up) + ' ريال في السنة · عائده سمعة وازدهار: ' + d.eff };
  const kd = pjOpKind(id), inc = pjG(id) * PJ_INV.tUsual[kd] * PJ_INV.year * pjK(PJ_INV.hold - 2) * PJ_INV.gain[kd], net = inc - up, yrs = net > 0 ? C / net : null;
  return { op: true, C, inc: Math.round(inc), up: Math.round(up), years: yrs == null ? null : Math.round(yrs * 10) / 10, text: 'تقدير عند حركة معتادة: عائد ≈ ' + fmtN(inc) + ' ريال في السنة، تشغيل ≈ ' + fmtN(up) + '، استرداد رأس المال ≈ ' + (yrs == null ? '—' : yrs.toFixed(1)) + ' سنة. تقدير لا وعد: الحركة والأحداث تغيّره.' };
}
const PJ_INC_TXT = { P01: 'أجرة المبيت والمرافق وبيع العلف من قوافل التجار الآخرين (قوافلك لا تدفع)', P20: 'بيع المؤن والماء والعلف للمسافرين من قوافل الآخرين (قوافلك لا تدفع)', P04: 'إيجار المحلات للتجار', P05: 'أجرة الرسو والحراسة من السفن الأخرى (سفنك لا ترسو بأجرة)', P09: 'أجرة ضبط الموازين والمكاييل وختمها', P14: 'أجرة المبيت والمرافق وبيع العلف من قوافل الآخرين في خانات الدولة', P07: 'لا أجرة عبور (مكس محرّم)؛ عائده غير مباشر: أمان وسرعة' };
const PJ_SERVICE_TEXT = 'خدمة عامة: لا أجرة من المنتفعين، ونفعها المستمر صدقة جارية، وأصلها ملكك تديره وترمّمه.';
/* ---- تفويض الناظر pjfix: مرة واحدة أو قاعدة دائمة تحت حالة X بحدّ شهري نسبة من صافي المشاريع (نمط shopfix، يُسجَّل من هذا الملف) ---- */
function pjFixList(S, t) { const out = []; const R = projectsReport(S); if (!R) return out; for (const x of R.list) { const q = x.quote; if (q && q.can && q.cond < t.limits.below && !pjHidden(x.id)) out.push({ key: x.key, id: x.id, cond: q.cond, cost: q.cost }); } return out.sort((a, b) => a.cond - b.cond || a.cost - b.cost); }
function pjFixWin(S, t) { if (t.type !== 'standing') return { cap: Infinity, spent: 0, d: S.day, fresh: true }; const w = t.win; if (w && w.pj && S.day - w.d < 30) return w; const R = projectsReport(S); return { d: S.day, pj: 1, cap: Math.max(0, Math.round((R ? R.net30 : 0) * t.limits.pct / 100)), spent: 0, fresh: true }; }
function pjFixPlan(S, t) {
  const w = pjFixWin(S, t), all = pjFixList(S, t), pick = []; let left = w.cap - w.spent, cost = 0; for (const x of all) if (x.cost <= left + 1e-9) { pick.push(x); left -= x.cost; cost += x.cost; }
  return { n: pick.length, total: all.length, cost, pick, cap: w.cap, spent: w.spent, text: 'أرمّم ' + pick.length + ' مشروعاً تحت حالة ' + t.limits.below + ' بنحو ' + fmtN(cost) + ' ريال' };
}
function pjFixRun(S, t) {
  const p = pjFixPlan(S, t); if (t.type === 'standing' && p.cap !== Infinity) { const w = pjFixWin(S, t); t.win = w.fresh ? { d: w.d, pj: 1, cap: w.cap, spent: 0 } : w; }
  let spent = 0, n = 0; const names = []; for (const x of p.pick) { const r = projectRepair(S, x.key); if (r.ok === false) continue; spent += x.cost; n++; names.push(PROJECTS[x.id].name); }
  if (t.win) t.win.spent += spent; const left = pjFixList(S, t).length, did = n ? 'رمّمتُ ' + n + ' مشروعاً (' + [...new Set(names)].join('، ') + ') بـ' + fmtN(spent) + ' ريال، لا يُعكس الترميم' : '';
  if (t.type === 'once') return { done: left === 0 || (n === 0 && p.total === 0), did: did || (p.total ? '' : 'لا مشروع تحت حالة ' + t.limits.below), cost: spent };
  return { done: false, did, cost: spent };
}
const PJFIX = { id: 'pjfix', name: 'ترميم المشاريع', types: ['once', 'standing'], def: { type: 'standing', scope: '*', below: 55, pct: 25, mode: 'exec' },
  check(S, s) { if (!PJINV.on) return NO('استثمار المشاريع غير مفعّل'); if (!DELEG.belows.includes(+s.limits.below)) return NO('اختر حالة 45 أو 55 أو 65'); if (s.type === 'standing' && !PJ_INV.pcts.includes(+s.limits.pct)) return NO('اختر ميزانية 10 أو 25 أو 50٪ من صافي المشاريع'); if (s.scope !== '*') return NO('الترميم يشمل كل المشاريع'); const R = projectsReport(S); return R ? OK('') : NO('لا مشروع مكتمل بعد'); },
  norm: s => (s.type === 'standing' ? { below: +s.limits.below, pct: +s.limits.pct } : { below: +s.limits.below }), plan: pjFixPlan, run: pjFixRun,
  fields(S, d) {
    const tmp = k => Object.assign({ id: 0, kind: 'pjfix', type: d.type, scope: '*', mode: d.mode, limits: { below: d.below, pct: d.pct } }, k || {});
    return [{ k: 'type', title: 'متى؟', opts: [{ v: 'standing', label: 'قاعدة دائمة', effect: 'يراقب كل يوم ويرمّم ضمن ميزانية شهرية من صافي المشاريع · تشغل خانة' }, { v: 'once', label: 'الآن مرة واحدة', effect: 'يرمّم ما تحت الحد ثم تتحرر خانتها' }] },
      { k: 'below', title: 'تحت أي حالة؟', opts: DELEG.belows.map(b => ({ v: b, label: 'تحت ' + b, effect: pjFixList(S, tmp({ limits: { below: b, pct: d.pct } })).length + ' مشروع الآن' })) }]
      .concat(d.type === 'standing' ? [{ k: 'pct', title: 'ميزانية الشهر', opts: PJ_INV.pcts.map(q => ({ v: q, label: q + '٪ من صافي المشاريع', effect: 'حتى ' + fmtN(Math.max(0, (projectsReport(S) || { net30: 0 }).net30 * q / 100)) + ' ريال شهرياً' })) }] : [])
      .concat([{ k: 'mode', title: 'كيف يتصرف؟', opts: Object.keys(DELEG_MODES).map(m => ({ v: m, label: DELEG_MODES[m], effect: m === 'exec' ? 'يرمّم ويخبرك' : m === 'ask' ? 'يسألك ثم يرمّم بعد ' + DELEG.wait + ' أيام إن لم تردّ' : 'يذكّرك فقط ولا يرمّم' })) }]);
  },
  sum(S, d) { const t = { id: 0, kind: 'pjfix', type: d.type, scope: '*', mode: d.mode, limits: { below: d.below, pct: d.pct } }, p = pjFixPlan(S, t); return 'ترميم المشاريع تحت حالة ' + d.below + ': ' + p.total + ' مشروع الآن بنحو ' + fmtN(p.pick.length ? p.cost : 0) + ' ريال' + (d.type === 'standing' ? ' · ميزانية الشهر ' + d.pct + '٪ من صافي المشاريع = ' + fmtN(p.cap) + ' ريال' : ''); } };
Object.assign(DELEG_KINDS, { pjfix: PJFIX });
Object.assign(A, { projectRepair, projectStop });
