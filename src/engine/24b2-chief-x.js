/* 035ج كبير الرعاة «صاحب الفرص»: CHIEFX.on=false = 24b حرفاً بلا ch.x ولا f.tr */
const CHIEFX = {
  on: true, droveSpeed: 0.8, waitMax: 3, scoutFee: 150, scanEvery: 3, repEvery: 7, edge: 0.02, buyEdge: 0.05, spread: 0.08,
  buyPick: 2, hold: 21, sigma: 0.04, acc: [0, 1, 1, 0.8, 0.6, 0.4], floorMin: 4, floorShare: 0.3, butcherKeep: 0.2, logMax: 20, askTtl: 14, rebuyDays: 6, plMax: 40,
  T: [null,
    { reach: 0, sell: 1.15, buy: 0.90, qty: 10, mail: 6, disc: 0, split: false },
    { reach: 'country', sell: 1.12, buy: 0.92, qty: 15, mail: 6, disc: 0, split: false },
    { reach: 10, sell: 1.10, buy: 0.93, qty: 20, mail: 8, disc: 30, split: false },
    { reach: 15, sell: 1.08, buy: 0.94, qty: 25, mail: 8, disc: 25, split: true },
    { reach: 20, sell: 1.06, buy: 0.95, qty: 30, mail: 10, disc: 20, split: true }],
  minPct: [90, 95, 100, 105], weekMax: [10, 25, 40], modes: ['exec', 'ask', 'off'],
  modeName: { exec: 'ينفّذ ويُبلغ', ask: 'يسألني', off: 'متوقف' },
};
const chxSig = ch => CHIEFX.sigma * CHIEFX.acc[chxGrade(ch)];
const chxMargin = (o, ch) => CHIEFX.edge * o.here + chxSig(ch) * Math.sqrt(Math.max(1, o.days)) * o.net;
const chxKinds = () => Object.keys(BREED).filter(g => GD[g] && GD[g].hu > 0);
const chxGrade = ch => Math.max(1, Math.min(5, SKILL.on && ch && ch.sk && ch.sk.g ? ch.sk.g : 3));
const chxT = ch => CHIEFX.T[chxGrade(ch)];
const chxRules = () => ({ sell: 'ask', buy: 'ask', minPct: 95, weekMax: 25, butcher: true });
function chxOf(ch, make) {
  if (!ch) return null;
  if (!ch.x && make) ch.x = { rules: chxRules(), freeze: false, known: {}, trips: [], log: [], pnl: 0, pl: [], sold: [], bgt: [], wait: {}, bw: {}, why: {}, nx: 0, rep: 0, disc: 0, wk: { sold: 0, sn: 0, bought: 0, bn: 0, drove: 0, scout: 0, wage: 0 } };
  return ch.x || null;
}
const chxPush = (arr, o, max) => { arr.unshift(o); if (arr.length > max) arr.length = max; };
function chxLog(S, x, k, t, amt, tid, done) { chxPush(x.log, { d: S.day, k, t, amt: Math.round(amt || 0), tid: tid || 0, done: !!done }, CHIEFX.logMax); }
function chxPnl(S, x, amt) { x.pnl += amt; x.pl.push([S.day, amt]); if (x.pl.length > CHIEFX.plMax * 4) x.pl = x.pl.filter(e => S.day - e[0] < 40); }
const chxPnlDays = (S, x, days) => x.pl.filter(e => S.day - e[0] < days).reduce((a, e) => a + e[1], 0);
function chxSync(S) {
  const tr = {};
  for (const country of Object.keys(S.player.chiefs || {})) { const x = S.player.chiefs[country].x; if (!x) continue; for (const t of x.trips) { const o = tr[t.home] || (tr[t.home] = {}); o[t.g] = (o[t.g] || 0) + t.n; } }
  for (const id of Object.keys(S.player.props || {})) { const f = S.player.props[id].farm; if (!f) continue; if (tr[id]) f.tr = tr[id]; else if (f.tr) delete f.tr; }
}
const chxTrUnits = f => { let u = 0; for (const g in (f.tr || {})) u += (f.tr[g] || 0) * (BREED[g] ? BREED[g].fu : 0); return u; };
function chxDays(S, a, b) { if (a === b) return 0; const L = routeLen(a, b, false); if (!(L > 0)) return null; return Math.max(1, Math.ceil(L / (SPEED * CHIEFX.droveSpeed))); }
const chxMood = (S, t, ch) => { let h = (t.id * 2654435761 + S.day * 40503 + 12345) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0; const u = ((h ^ (h >>> 16)) >>> 0) / 4294967296 * 2 - 1; return 1 + chxSig(ch) * Math.sqrt(Math.max(1, t.arrive - t.go, t.dd || 1)) * u; };
const chxCustoms = (S, a, b, g, n) => (a === b ? 0 : customsOf(S, a, b, { [g]: n }, false));
function chxPayCu(S, x, t, from, to, g, n) { const cu = chxCustoms(S, from, to, g, n); if (cu > 0) { const c0 = S.ctxCur; ctxFor(S, t.home); const paid = pPay(S, 'customs', cu, true); S.ctxCur = c0; t.cost += paid; x.wk.drove += paid; chxPnl(S, x, -paid); } }
const chxDrive = (g, n, days) => Math.max(1, Math.ceil(n * GD[g].hu / HERD_PER)) * HERDER_WAGE * days;
function chxKnow(S, ch, id) {
  const k1 = S.player.known && S.player.known[id], a = k1 && k1.day > 0 ? k1 : null, b = ch.x && ch.x.known[id];
  if (a && (!b || a.day >= b.day)) return a; return b || null;
}
function chxSnap(S, id) { const c = S.cities[id], p = {}, st = {}; for (const g of chxKinds()) { p[g] = Math.round(unitPrice(c, g) * 10) / 10; st[g] = Math.round(c.stock[g]); } return { day: S.day, p, st }; }
function chxQuote(S, c, g, n, st0, scale, pm) {
  const cap = capG(c, g) * 1.2; let gross = 0, st = st0, first = priceAt(c, g, st0);
  for (let i = 0; i < n; i++) { gross += priceAt(c, g, st) * scale; st = Math.min(st + 1, cap); }
  const last = priceAt(c, g, Math.max(st0, st - 1)); gross *= (pm || 1); const tr = taxRate(S, c, true);
  return { gross, net: gross * (1 - tr), drop: first > 0 ? 1 - last / first : 0 };
}
function chxHere(S, f, c, g, n) { return chxQuote(S, c, g, n, c.stock[g], 1, pedMulOf(f, g)); }
function chxThere(S, f, ch, m, g, n) { const c = S.cities[m.id], st0 = m.st != null ? m.st : c.stock[g], p0 = priceAt(c, g, st0), sc = p0 > 0 ? m.p / p0 : 1; return chxQuote(S, c, g, n, st0, sc, pedMulOf(f, g)); }
function chxMarkets(S, ch, fcity, g, buy) {
  const T = chxT(ch), out = [], fc = S.cities[fcity]; if (!T.reach) return out;
  for (const id of S.order) {
    if (id === fcity) continue; const c = S.cities[id]; if (buy && !sells(c, g)) continue;
    const k = chxKnow(S, ch, id); if (!k || k.p[g] == null) continue;
    const d = chxDays(S, fcity, id); if (d == null) continue;
    if (T.reach === 'country') { if (c.country !== fc.country) continue; } else if (d > T.reach) continue;
    out.push({ id, days: d, p: k.p[g], st: k.st && k.st[g] != null ? k.st[g] : null, day: k.day, ratio: k.p[g] / refPrice(c, g) });
  }
  return out;
}
function chxSellable(S, ch, x, fcity, f, g) {
  const a = Math.floor(f.herd[g] || 0), R = x.rules, pr = S.player.props[fcity];
  const floor = Math.max(CHIEFX.floorMin, Math.ceil(a * CHIEFX.floorShare)), held = x.bgt.filter(e => e.c === fcity && e.g === g && S.day - e.d < CHIEFX.hold).reduce((t, e) => t + e.n, 0);
  let n = a - floor - Math.min(held, a), why = n < 1 ? 'floor' : '';
  const m = malesOf(f, g); if (m >= 1) n = Math.min(n, Math.floor(a - a / m));
  const sold7 = x.sold.filter(e => e.c === fcity && e.g === g && S.day - e.d < 7).reduce((t, e) => t + e.n, 0);
  const allow = Math.floor((a + sold7) * R.weekMax / 100) - sold7; if (n > allow) { n = allow; if (n < 1) why = why || 'week'; }
  if (R.butcher && pr && pr.butcher) n = Math.floor(n * (1 - CHIEFX.butcherKeep));
  n = Math.min(n, Math.floor(MAX_HERDERS * HERD_PER / GD[g].hu));
  return { n: Math.max(0, n), a, floor, why, sold7 };
}
const chxName = g => GD[g].name;
const dayAr = n => { const v = Math.round(+n); return v === 1 ? 'يوم' : v === 2 ? 'يومين' : v >= 3 && v <= 10 ? v + ' أيام' : v + ' يوماً'; };
function chxWhy(S, x, key, txt) { x.why[key] = { d: S.day, t: txt }; }
function chxSellScan(S, ch, x, fcity) {
  const T = chxT(ch), f = farmOf(S, fcity), c = S.cities[fcity], out = [];
  for (const g of chxKinds()) {
    if ((f.herd[g] || 0) < 1) continue; const wk = fcity + ':' + g; if ((x.wait[wk] || 0) > S.day) continue;
    const sb = chxSellable(S, ch, x, fcity, f, g);
    if (sb.n < 1) { if (sb.why === 'week') chxWhy(S, x, wk, 'لم أبِع ' + chxName(g) + ' لأنك حددتَ ' + x.rules.weekMax + '٪ في الأسبوع وقد بلغتُها'); else if (sb.why === 'floor') chxWhy(S, x, wk, 'لم أبِع ' + chxName(g) + ' لأن قطيعك في ' + c.name + ' عند حد التكاثر'); continue; }
    const floorPct = x.rules.minPct / 100, ratioHere = ratio(c, g), cands = [];
    const evalM = (m, k) => { const here = chxHere(S, f, c, g, k), there = m.local ? here : chxThere(S, f, ch, m, g, k), cost = m.local ? 0 : chxDrive(g, k, m.days) + chxCustoms(S, fcity, m.id, g, k); return { to: m.id, n: k, days: m.days, ratio: m.ratio, net: there.net, here: here.net, cost, gain: there.net - cost - here.net, drop: there.drop }; };
    const mk = chxMarkets(S, ch, fcity, g).filter(m => m.ratio >= T.sell && m.ratio >= floorPct);
    let best = null;
    for (const fr of [1, 0.75, 0.5, 0.34]) { const k = Math.max(1, Math.floor(sb.n * fr)); for (const m of mk) { const o = evalM(m, k); if (o.gain > chxMargin(o, ch) && (!best || o.gain > best.gain)) best = o; } }
    let parts = null;
    if (best) {
      parts = [best];
      if (T.split && best.drop > CHIEFX.spread && best.n >= 2) {
        const k1 = Math.ceil(best.n / 2), k2 = best.n - k1, o1 = evalM(mk.find(m => m.id === best.to), k1); let o2 = null;
        for (const m of mk) if (m.id !== best.to) { const o = evalM(m, k2); if (o.gain > chxMargin(o, ch) && (!o2 || o.gain > o2.gain)) o2 = o; }
        if (o2) parts = [o1, o2];
      }
    } else if (ratioHere >= T.sell && ratioHere >= floorPct) { const o = evalM({ id: fcity, days: 0, ratio: ratioHere, local: true }, sb.n); parts = [o]; }
    else if (mk.length === 0 && T.reach) { const lo = chxMarkets(S, ch, fcity, g).filter(m => m.ratio >= T.sell && m.ratio < floorPct)[0]; if (lo) chxWhy(S, x, wk, 'لم أبِع ' + chxName(g) + ' لأن سعرها في ' + S.cities[lo.id].name + ' تحت حدّك ' + x.rules.minPct + '٪'); }
    if (!parts) continue;
    const n = parts.reduce((t, p) => t + p.n, 0), net = parts.reduce((t, p) => t + p.net - p.cost, 0), here = chxHere(S, f, c, g, n).net;
    out.push({ city: fcity, g, parts, n, net, here, pct: here > 0 ? Math.round(100 * (net / here - 1)) : 0, floor: sb.floor, sold7: sb.sold7, butcher: !!(x.rules.butcher && S.player.props[fcity] && S.player.props[fcity].butcher) });
  }
  return out;
}
function chxSellStart(S, ch, x, o, scale) {
  const f = farmOf(S, o.city), pr = S.player.props[o.city]; if (!f) return NO('لا مزرعة');
  const out = []; let total = 0, sum = 0; const c0 = S.ctxCur;
  for (const p0 of o.parts) {
    const n = Math.min(Math.floor(scale ? p0.n * scale : p0.n), Math.floor(f.herd[o.g] || 0)); if (n < 1) continue;
    const rh = refPrice(S.cities[o.city], o.g) * (1 - taxRate(S, S.cities[o.city], true)) * pedMulOf(f, o.g);
    if (p0.to === o.city) { // محلي
      ctxFor(S, o.city); const b0 = f.herd[o.g], r = sellUnits(S, S.player, S.cities[o.city], o.g, n, f.herd, true, pedMulOf(f, o.g), 'farm'); if (!r.n) continue; herdScale(f, o.g, b0);
      const cost = takeBasis(pr.basis || (pr.basis = {}), o.g, r.n); logTrade(S, o.city, o.g, r.n, 'sell', r.net, r.net - cost, 'farm');
      x.sold.push({ d: S.day, g: o.g, n: r.n, c: o.city }); x.wk.sold += r.net; x.wk.sn += r.n; chxPnl(S, x, r.net - r.n * rh); total += r.n; sum += r.net;
      chxLog(S, x, 'sell', 'باع ' + r.n + ' ' + chxName(o.g) + ' في ' + S.cities[o.city].name + ' بصافي ' + Math.round(r.net), r.net, 0, true);
    } else {
      const hx = (f.hx || {})[o.g], m0 = hx ? hx.m : 0, p0x = hx ? (hx.p || 0) : 0, b0 = f.herd[o.g];
      f.herd[o.g] -= n; herdScale(f, o.g, b0); const m1 = hx ? hx.m : 0, pp1 = hx ? (hx.p || 0) : 0;
      const bq0 = (pr.basis && pr.basis[o.g]) ? pr.basis[o.g].q : 0, bc = takeBasis(pr.basis || (pr.basis = {}), o.g, n), bq = bq0 - ((pr.basis && pr.basis[o.g]) ? pr.basis[o.g].q : 0), id = S.nextId++, days = p0.days;
      x.trips.push({ id, g: o.g, n, n0: n, from: o.city, to: p0.to, home: o.city, go: S.day, arrive: S.day + days, cost: 0, kind: 'sell', floor: x.rules.minPct, bc, bq, mm: m0 - m1, pp: p0x - pp1, w: 0, rh, ex: p0.net });
      x.sold.push({ d: S.day, g: o.g, n, c: o.city }); total += n; sum += p0.net;
      chxLog(S, x, 'drive', 'ساق ' + n + ' ' + chxName(o.g) + ' إلى ' + S.cities[p0.to].name + ' (' + dayAr(days) + ')، المتوقع ' + Math.round(p0.net), p0.net, id);
    }
  }
  S.ctxCur = c0; chxSync(S);
  if (total < 1) return NO('لا قطيع يُباع الآن');
  return Object.assign(OK('بيع ' + total + ' ' + chxName(o.g) + (o.parts.some(p => p.to !== o.city) ? '؛ المتوقع نحو ' + fmtN(Math.round(sum)) + ' ريال (يتغير السعر عند الوصول)' : ' بصافي ' + fmtN(Math.round(sum)) + ' ريال')), { n: total, net: sum });
}
function chxBuyScan(S, ch, x, fcity) {
  const T = chxT(ch), f = farmOf(S, fcity), c = S.cities[fcity], out = [];
  const room = farmCap(S, fcity) - farmUnits(f) - chxTrUnits(f);
  for (const g of chxKinds()) {
    if (!breedOpen(S, g)) continue; const base = Math.max(12, Math.floor(f.herd[g] || 0) + Math.floor((f.tr || {})[g] || 0)), b7 = x.bgt.filter(e => e.c === fcity && e.g === g && S.day - e.d < 7).reduce((t, e) => t + e.n, 0);
    const n0 = Math.min(T.qty, Math.floor(room / BREED[g].fu), Math.floor(base * x.rules.weekMax / 100) - b7); if (n0 < 3) continue;
    if ((x.bw[fcity + ':' + g] || 0) > S.day) continue; const here = unitPrice(c, g); let best = null;
    if (sells(c, g) && ratio(c, g) <= T.buy) best = { from: fcity, days: 0, p: here, landed: here, ratio: ratio(c, g) };
    for (const m of chxMarkets(S, ch, fcity, g, true)) {
      if (m.ratio > T.buy) continue; const landed = m.p * 1.02 + (chxDrive(g, n0, m.days) + chxCustoms(S, m.id, fcity, g, n0)) / n0;
      if (landed <= here * (1 - CHIEFX.buyEdge) && (!best || landed < best.landed)) best = { from: m.id, days: m.days, p: m.p, landed, ratio: m.ratio };
    }
    if (!best) continue;
    out.push({ city: fcity, g, from: best.from, qty: n0, days: best.days, p: best.p, est: Math.round(best.p * n0 * 1.05 + chxDrive(g, n0, best.days) + chxCustoms(S, best.from, fcity, g, n0)), pct: Math.round(100 * (1 - best.landed / here)), ratio: best.ratio });
  }
  return out;
}
function chxBuy(S, ch, mail) {
  const x = chxOf(ch, true), f = farmOf(S, mail.city); if (!f) return NO('لم تعد المزرعة قائمة');
  const g = mail.g, local = !mail.from || mail.from === mail.city, src = local ? mail.city : mail.from, c = S.cities[src];
  const room = Math.floor((farmCap(S, mail.city) - farmUnits(f) - chxTrUnits(f)) / BREED[g].fu), n = Math.min(Math.floor(mail.qty), room);
  if (n < 1) return NO('المزرعة ممتلئة'); if (local ? !sells(c, g) : !chxMarkets(S, ch, mail.city, g, true).some(m => m.id === src)) return NO('السوق خارج مدى كبير الرعاة الآن');
  if (!breedOpen(S, g)) return NO(GD[g].name + ' لم تُفتح بعد في مسيرتك'); const c0 = S.ctxCur; ctxFor(S, src);
  const res = buyUnits(S, S.player, c, g, n, n * GD[g].w + 1e-6, {}, true, false, 1); S.ctxCur = c0;
  if (!res.n) return NO('تعذّر الشراء (مخزون السوق أو الرصيد)');
  const days = local ? 0 : chxDays(S, src, mail.city), t = { id: S.nextId++, g, n: res.n, n0: res.n, from: src, to: mail.city, home: mail.city, go: S.day, arrive: S.day + days, cost: 0, kind: 'buy', bc: res.cost, mm: 0, pp: 0, w: 0, rh: refPrice(S.cities[mail.city], g) };
  x.trips.push(t); x.bw[mail.city + ':' + g] = S.day + CHIEFX.rebuyDays; x.bgt.push({ d: S.day, g, n: res.n, c: mail.city }); x.wk.bought += res.cost; x.wk.bn += res.n;
  chxLog(S, x, 'buy', 'اشترى ' + res.n + ' ' + chxName(g) + ' في ' + c.name + ' بـ ' + Math.round(res.cost) + (local ? '' : ' وساقها'), -res.cost, local ? 0 : t.id, local);
  if (local) { chxArrive(S, ch, x, t); x.trips.pop(); }
  chxSync(S);
  return Object.assign(OK('اشتريتَ ' + res.n + ' ' + chxName(g) + ' من ' + c.name + ' بـ ' + Math.round(res.cost) + ' ريال' + (local ? '' : '، وتصل بعد ' + dayAr(days))), { n: res.n, cost: res.cost });
}
function chxArrive(S, ch, x, t) {
  const f = farmOf(S, t.home), pr = S.player.props[t.home], g = t.g, c0 = S.ctxCur;
  if (!f) { chxLog(S, x, 'lost', 'لم تعد المزرعة قائمة فانتهت الرحلة', 0, 0, true); return true; }
  if (t.kind === 'buy') {
    chxPayCu(S, x, t, t.from, t.home, g, t.n);
    f.herd[g] = (f.herd[g] || 0) + t.n; herdAdd(f, g, t.n); addBasis(pr.basis || (pr.basis = {}), g, t.n, t.bc + t.cost);
    chxPnl(S, x, t.n * t.rh - t.bc); chxLog(S, x, 'arrive', 'وصل ' + t.n + ' ' + chxName(g) + ' إلى ' + S.cities[t.home].name, 0, 0, true); return true;
  }
  if (t.kind === 'back') {
    chxPayCu(S, x, t, t.from, t.home, g, t.n);
    f.herd[g] = (f.herd[g] || 0) + t.n; const hx = hxOf(f, g); hx.m += t.mm || 0; if (t.pp) hx.p = (hx.p || 0) + t.pp;
    if (t.bq > 0) addBasis(pr.basis || (pr.basis = {}), g, t.bq, t.bc); chxLog(S, x, 'back', 'عاد ' + t.n + ' ' + chxName(g) + ' إلى ' + S.cities[t.home].name, 0, 0, true); return true;
  }
  const c = S.cities[t.to]; ctxFor(S, t.to); x.known[t.to] = chxSnap(S, t.to);
  if (!t.cu) { t.cu = 1; chxPayCu(S, x, t, t.home, t.to, g, t.n); S.ctxCur = curOf(c.country); }
  const mood = chxMood(S, t, ch), fl = t.floor / 100 * refPrice(c, g), cap = capG(c, g) * 1.2; let st = c.stock[g], k = 0; while (k < t.n && priceAt(c, g, st) * mood >= fl) { k++; st = Math.min(st + 1, cap); }
  if (k >= 1) {
    const tmp = {}; tmp[g] = k; const share = t.bc * k / t.n, r = sellUnits(S, S.player, c, g, k, tmp, true, pedMulOf(f, g) * mood, 'farm', share);
    if (r.n) {
      logTrade(S, t.to, g, r.n, 'sell', r.net, r.net - share, 'farm'); const q = r.n / t.n; t.mm = (t.mm || 0) * (1 - q); t.pp = (t.pp || 0) * (1 - q); t.bc -= share; t.bq = (t.bq || 0) * (1 - q); t.n -= r.n; t.cost += 0;
      x.wk.sold += r.net; x.wk.sn += r.n; chxPnl(S, x, r.net - r.n * t.rh);
      chxLog(S, x, 'sell', 'باع ' + r.n + ' ' + chxName(g) + ' في ' + c.name + ' بصافي ' + Math.round(r.net) + (t.ex ? ' (توقعتُ ' + Math.round(t.ex * r.n / t.n0) + ')' : ''), r.net, 0, true);
    }
  }
  S.ctxCur = c0;
  if (t.n < 1e-9 || t.n < 0.5) return true;
  t.w++; chxWhy(S, x, t.home + ':' + g, 'لم أبِع ' + chxName(g) + ' لأن سعرها في ' + c.name + ' نزل تحت حدّك ' + t.floor + '٪');
  if (t.w > CHIEFX.waitMax) { // كبوة: يعود القطيع
    const days = chxDays(S, t.to, t.home) || 1; t.kind = 'back'; t.from = t.to; t.to = t.home; t.go = S.day; t.arrive = S.day + days; t.w = 0;
    chxLog(S, x, 'slip', 'كبوة: بقي سعر ' + chxName(g) + ' في ' + c.name + ' تحت حدّك فعاد ' + Math.floor(t.n) + ' رأساً وخسرتَ كلفة السَّوق', -t.cost, t.id);
    news(S, 'كبير الرعاة: عاد قطيعك من ' + c.name + ' دون بيع (كبوة، كلفة السَّوق ' + fmtN(Math.round(t.cost)) + ').', 'bad');
  } else t.arrive = S.day + 1;
  return false;
}
function chxTripDay(S, country, ch, x) {
  const keep = []; const c0 = S.ctxCur;
  for (const t of x.trips) {
    ctxFor(S, t.home);
    const wage = Math.max(1, Math.ceil(t.n * GD[t.g].hu / HERD_PER)) * HERDER_WAGE, paid = pPay(S, 'droveHerd', wage, true); t.cost += paid; x.wk.drove += paid; chxPnl(S, x, -paid);
    if (S.day >= t.arrive) { if (!chxArrive(S, ch, x, t)) keep.push(t); } else keep.push(t);
  }
  x.trips = keep; S.ctxCur = c0; chxSync(S);
}
function chxUnknown(S, ch, x, country) {
  const T = chxT(ch), farms = farmCitiesIn(S, country), P = S.player, out = [];
  for (const id of S.order) {
    const c = S.cities[id]; if ((P.known[id] && P.known[id].day > 0) || x.known[id] || farms.includes(id) || !chxKinds().some(g => sells(c, g))) continue;
    let d = null; for (const fc of farms) { const dd = chxDays(S, fc, id); if (dd != null && (d == null || dd < d)) d = dd; }
    if (d != null && (T.reach === 'country' ? c.country === S.cities[farms[0]].country : d <= T.reach)) out.push({ id, d });
  }
  return out;
}
function chxDiscover(S, country, ch, x) {
  const T = chxT(ch); if (!T.disc || S.day < x.disc + T.disc) return;
  const farms = farmCitiesIn(S, country), P = S.player, best = chxUnknown(S, ch, x, country).sort((a, b) => a.d - b.d)[0];
  x.disc = S.day; if (!best || P.gold < CHIEFX.scoutFee) return;
  const c0 = S.ctxCur; ctxFor(S, farms[0]); const paid = pPay(S, 'chiefHerder', CHIEFX.scoutFee, true); S.ctxCur = c0; x.wk.scout += paid; chxPnl(S, x, -paid);
  const sn = chxSnap(S, best.id), c = S.cities[best.id]; x.known[best.id] = sn;
  const pr = Object.keys(sn.p).slice(0, 3).map(g => chxName(g) + ' ' + Math.round(sn.p[g])).join('، ');
  chxLog(S, x, 'scout', 'اكتشف سوق ' + c.name + ' (' + pr + ')', -paid, 0, true);
  news(S, 'كبير الرعاة: اكتشفتُ سوق ' + c.name + ' (' + dayAr(best.d) + '): ' + pr + '؛ دفعتُ ' + paid + '.', 'good');
}
function chxFund(S, ch, m, byUser) {
  const D = typeof diwanOf === 'function' ? diwanOf(S) : null, rule = D && D.rules && D.rules.herd;
  if (rule && rule.mode !== 'mine' && (rule.max || 0) > 0 && m.est <= rule.max) { const r = diwanBuyHerd(S, D, m); if (r.ok) return r; }
  if (byUser || (ch.buy && m.est <= (ch.budget || 0) && S.player.gold >= m.est * 1.2)) return chxBuy(S, ch, m);
  return NO('لا تمويل لهذه الصفقة (فعّل قاعدة الديوان أو حدّد ميزانية الصفقة)');
}
function chxReport(S, country, ch, x) {
  const w = x.wk, net = Math.round(chxPnlDays(S, x, CHIEFX.repEvery)), why = Object.keys(x.why).filter(k => S.day - x.why[k].d < 14).slice(0, 2).map(k => x.why[k].t);
  const parts = []; if (w.sn) parts.push('بعتُ ' + w.sn + ' رأساً بـ ' + fmtN(Math.round(w.sold))); if (w.bn) parts.push('اشتريتُ ' + w.bn + ' بـ ' + fmtN(Math.round(w.bought))); if (w.drove) parts.push('سَوق ' + fmtN(Math.round(w.drove))); if (w.scout) parts.push('اكتشاف ' + fmtN(Math.round(w.scout))); parts.push('أجري ' + fmtN(w.wage));
  const text = 'تقرير الأسبوع: صافي ما فعلتُه ' + (net < 0 ? '−' : '+') + fmtN(Math.abs(net)) + ' ريال (' + parts.join('، ') + ').' + (why.length ? ' ' + why.join('. ') + '.' : '');
  ch.mail = (ch.mail || []).filter(m => !(m.type === 'report' && m.x)); ch.mail.unshift({ id: S.nextId++, day: S.day, country, type: 'report', x: 1, city: null, text });
  x.wk = { sold: 0, sn: 0, bought: 0, bn: 0, drove: 0, scout: 0, wage: 0 }; x.rep = S.day;
}
function chxScan(S, country, ch, x) {
  const T = chxT(ch), R = x.rules; ch.mail = (ch.mail || []).filter(m => !(m.x && (m.type === 'sell' || m.type === 'buy')));
  if (x.freeze) return;
  for (const fcity of farmCitiesIn(S, country)) {
    if (R.sell !== 'off') for (const o of chxSellScan(S, ch, x, fcity)) {
      if (R.sell === 'exec') { const r = chxSellStart(S, ch, x, o); if (r.ok) { news(S, 'كبير الرعاة: ' + r.msg, 'good'); continue; } }
      const to = o.parts.map(p => p.n + ' في ' + S.cities[p.to].name).join(' و'), c = S.cities[fcity];
      ch.mail.unshift({ id: S.nextId++, day: S.day, country, type: 'sell', x: 1, city: fcity, g: o.g, qty: o.n, parts: o.parts, net: Math.round(o.net), here: Math.round(o.here), pct: o.pct, floor: o.floor, butcher: o.butcher, est: Math.round(o.net),
        text: chxName(o.g) + ': أنصحك ببيع ' + to + '؛ الصافي نحو ' + fmtN(Math.round(o.net)) + ' مقابل ' + fmtN(Math.round(o.here)) + ' في ' + c.name + '.' });
    }
    if (R.buy !== 'off') for (const o of chxBuyScan(S, ch, x, fcity).sort((p, q) => q.pct * q.qty - p.pct * p.qty).slice(0, CHIEFX.buyPick)) {
      const m = { id: S.nextId++, day: S.day, country, type: 'buy', x: 1, city: fcity, g: o.g, qty: o.qty, from: o.from, days: o.days, est: o.est, pct: o.pct, text: 'فرصة: ' + chxName(o.g) + ' في ' + S.cities[o.from].name + ' أرخص من مزرعتك بنحو ' + o.pct + '٪ بعد السَّوق؛ اشترِ ' + o.qty + ' (نحو ' + fmtN(o.est) + ' ريال).' };
      if (R.buy === 'exec') { const r = chxFund(S, ch, m, false); if (r.ok) { news(S, 'كبير الرعاة اشترى بتفويضك: ' + r.msg, 'good'); continue; } }
      ch.mail.unshift(m);
    }
  }
  const pri = { sell: 0, buy: 1, full: 2, report: 3 }; ch.mail = ch.mail.filter(m => !(m.x && S.day - m.day > CHIEFX.askTtl));
  ch.mail.sort((a, b) => pri[a.type] - pri[b.type] || b.day - a.day); ch.mail.length = Math.min(ch.mail.length, T.mail);
}
function chxDay(S, country, ch) {
  const x = chxOf(ch, true); if (!x.nx) { x.nx = S.day; x.rep = S.day; x.disc = S.day; }
  x.wk.wage += CHIEF.wage; chxPnl(S, x, -CHIEF.wage);
  chxTripDay(S, country, ch, x);
  if (S.day >= x.nx) { x.nx = S.day + CHIEFX.scanEvery; chxDiscover(S, country, ch, x); chxScan(S, country, ch, x); }
  if (S.day - x.rep >= CHIEFX.repEvery) chxReport(S, country, ch, x);
}
const chxMailOf = (S, id) => { for (const country of Object.keys(S.player.chiefs || {})) { const ch = S.player.chiefs[country], i = (ch.mail || []).findIndex(m => m.id === id); if (i >= 0) return { country, ch, i, m: ch.mail[i] }; } return null; };
Object.assign(A, {
  chiefXRule(S, country, key, val) {
    const ch = chiefOf(S, country); if (!ch || !CHIEFX.on) return NO('لا كبير رعاة هنا'); const x = chxOf(ch, true), R = x.rules;
    if (key === 'sell' || key === 'buy') { if (!CHIEFX.modes.includes(val)) return NO('اختر ينفّذ أو يسألني أو متوقف'); R[key] = val; return OK((key === 'sell' ? 'البيع: ' : 'الشراء: ') + CHIEFX.modeName[val]); }
    if (key === 'minPct') { val = +val; if (!CHIEFX.minPct.includes(val)) return NO('خيار غير معروف'); R.minPct = val; return OK('أدنى سعر بيع ' + val + '٪ من السعر المرجعي'); }
    if (key === 'weekMax') { val = +val; if (!CHIEFX.weekMax.includes(val)) return NO('خيار غير معروف'); R.weekMax = val; return OK('أقصى بيع أسبوعي ' + val + '٪ من رؤوسه'); }
    if (key === 'butcher') { R.butcher = !!val; return OK(R.butcher ? 'يترك 20٪ للجزّار' : 'لا يترك للجزّار شيئاً'); }
    return NO('صلاحية غير معروفة');
  },
  chiefXFreeze(S, country, on) { const ch = chiefOf(S, country); if (!ch || !CHIEFX.on) return NO('لا كبير رعاة هنا'); const x = chxOf(ch, true); x.freeze = !!on; return OK(x.freeze ? 'جُمّد كل شيء؛ وما في الطريق يكمل' : 'رُفع التجميد'); },
 
  chiefXAct(S, id, opt) {
    const r0 = chxMailOf(S, id); if (!r0) return NO('الرسالة لم تعد قائمة'); const { ch, m, i } = r0, x = chxOf(ch, true); let r;
    if (m.type === 'sell' && m.x) {
      const f = farmOf(S, m.city); if (!f) return NO('لا مزرعة');
      if (opt === 'wait') { x.wait[m.city + ':' + m.g] = S.day + 7; ch.mail.splice(i, 1); chxLog(S, x, 'wait', 'انتظر أسبوعاً قبل بيع ' + chxName(m.g), 0, 0, false); return OK('سأنتظر أسبوعاً ثم أعيد القراءة؛ لا ضمان'); }
      if (opt === 'skip') { ch.mail.splice(i, 1); return OK('تم'); }
      const sb = chxSellable(S, ch, x, m.city, f, m.g), sc = opt === 'half' ? 0.5 : Math.min(1, sb.n / Math.max(1, m.qty)); if (sb.n < 1) return NO('لا قطيع يُباع الآن فوق حد التكاثر');
      r = chxSellStart(S, ch, x, m, sc); if (r.ok) ch.mail.splice(i, 1); return r;
    }
    if (m.type === 'buy' && m.x) {
      if (opt === 'skip') { ch.mail.splice(i, 1); return OK('تم'); }
      r = chxFund(S, ch, m, true); if (r.ok) ch.mail = (ch.mail || []).filter(y => y.id !== id); return r;
    }
    return NO('رسالة غير قابلة');
  },
  chiefXCancel(S, tripId) {
    for (const country of Object.keys(S.player.chiefs || {})) {
      const ch = S.player.chiefs[country], x = ch.x; if (!x) continue; const t = x.trips.find(y => y.id === tripId); if (!t) continue;
      if (t.kind !== 'sell' || S.day >= t.arrive) return NO('الرحلة وصلت أو لا تُلغى'); const el = S.day - t.go;
      t.kind = 'back'; t.from = t.to; t.to = t.home; t.go = S.day; t.arrive = S.day + el; t.w = 0;
      if (el < 1) { chxArrive(S, ch, x, t); x.trips = x.trips.filter(y => y !== t); chxSync(S); return OK('أُلغيت الرحلة وعاد القطيع فوراً'); }
      chxLog(S, x, 'cancel', 'أُلغيت رحلة ' + chxName(t.g) + '، كلفة ما مضى ' + fmtN(Math.round(t.cost)), -t.cost, t.id); chxSync(S);
      return OK('أُلغيت الرحلة: يعود ' + Math.floor(t.n) + ' ' + chxName(t.g) + ' بعد ' + dayAr(el) + '، كلفة ما مضى ' + fmtN(Math.round(t.cost)) + ' ريال');
    }
    return NO('الرحلة لم تعد قائمة');
  },
});
function chxTable(S, ch, x, fcity) {
  const f = farmOf(S, fcity), rows = [];
  for (const g of chxKinds()) {
    const heads = Math.floor(f.herd[g] || 0) + Math.floor((f.tr || {})[g] || 0); if (heads < 1) continue;
    const sb = chxSellable(S, ch, x, fcity, f, g), k = Math.max(1, sb.n), c = S.cities[fcity], here = chxHere(S, f, c, g, k).net; let best = null;
    for (const m of chxMarkets(S, ch, fcity, g)) { const o = chxThere(S, f, ch, m, g, k).net - chxDrive(g, k, m.days); const d = here > 0 ? o / here - 1 : 0; if (!best || d > best.d) best = { id: m.id, name: S.cities[m.id].name, d, days: m.days }; }
    rows.push({ city: fcity, cityName: c.name, g, name: chxName(g), heads, sellable: sb.n, best: best && best.d > -0.5 ? best : null });
  }
  return rows;
}
const chxUndiscovered = (S, ch, x, country) => (chxT(ch).reach ? chxUnknown(S, ch, x, country).length : 0);
function chiefXView(S) {
  if (!CHIEFX.on || !S || !S.player) return null; const list = []; let opps = 0, heads = 0, month = 0;
  for (const country of Object.keys(S.player.chiefs || {})) {
    const ch = S.player.chiefs[country], x = chxOf(ch, false); if (!farmCitiesIn(S, country).length) continue;
    const xx = x || { rules: chxRules(), freeze: false, known: {}, trips: [], log: [], pnl: 0, pl: [], wait: {}, why: {}, sold: [] };
    const cards = (ch.mail || []).filter(m => m.x && (m.type === 'sell' || m.type === 'buy')), tr = xx.trips;
    const table = x ? farmCitiesIn(S, country).reduce((a, fc) => a.concat(chxTable(S, ch, xx, fc)), []) : [];
    opps += cards.length; heads += tr.reduce((t, y) => t + y.n, 0); const mo = chxPnlDays(S, xx, 30); month += mo;
    list.push({ country, name: CD[country].name, flag: CD[country].flag, ch, grade: chxGrade(ch), gradeName: SKILL.grades.a[chxGrade(ch) - 1], T: chxT(ch), x: xx, rules: xx.rules, freeze: xx.freeze, cards, trips: tr, table, undisc: x ? chxUndiscovered(S, ch, xx, country) : 0, log: xx.log, pnl: Math.round(xx.pnl), month: Math.round(mo), mail: (ch.mail || []).filter(m => m.type === 'report' && m.x) });
  }
  return list.length ? { list, opps, heads: Math.round(heads), month: Math.round(month) } : null;
}
function chxMigrate(S) {
  if (!S.player || !S.player.chiefs) return;
  for (const country of Object.keys(S.player.chiefs)) {
    const ch = S.player.chiefs[country]; if (!ch || ch.x === undefined) continue; const x = ch.x;
    if (!CHIEFX.on || !x || typeof x !== 'object' || Array.isArray(x)) { delete ch.x; continue; }
    const R = x.rules = Object.assign(chxRules(), x.rules && typeof x.rules === 'object' ? x.rules : {});
    if (!CHIEFX.modes.includes(R.sell)) R.sell = 'ask'; if (!CHIEFX.modes.includes(R.buy)) R.buy = 'ask'; if (!CHIEFX.minPct.includes(R.minPct)) R.minPct = 95; if (!CHIEFX.weekMax.includes(R.weekMax)) R.weekMax = 25;
    for (const k of ['known', 'wait', 'bw', 'why']) if (!x[k] || typeof x[k] !== 'object' || Array.isArray(x[k])) x[k] = {};
    for (const k of ['log', 'pl', 'sold', 'bgt', 'trips']) if (!Array.isArray(x[k])) x[k] = [];
    x.trips = x.trips.filter(t => t && S.cities[t.home] && S.cities[t.to] && GD[t.g] && t.n > 0 && Number.isFinite(t.arrive));
    for (const k of ['pnl', 'nx', 'rep', 'disc']) if (!Number.isFinite(x[k])) x[k] = 0;
    if (!x.wk || typeof x.wk !== 'object') x.wk = { sold: 0, sn: 0, bought: 0, bn: 0, drove: 0, scout: 0, wage: 0 };
  }
  if (CHIEFX.on) chxSync(S);
}
