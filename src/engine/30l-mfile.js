/* ---------- 052 ملف التاجر الحيّ + كشوف الأداء وتنبيهات الخسارة + السمعة والإنجازات بأثر ----------
   أربعة مفاتيح مستقلة؛ كلٌّ مطفأ = السلوك القديم حرفياً بلا حقل جديد في الحفظ.
   الحفظ الاختياري ينشأ عند أول حاجة: P.mx (KASHF)، tr.tx/lw/gl/es في سجل الصفقات (KASHF)، مفاتيح ach:/wt:/bd:/achx في L.bk (ACHX).
   لا يلمس P.gold. لا شرط جزائي ولا زكاة جديدة؛ الزكاة مستبعدة من repT (038 FR-005). */
const MFILE = { on: true };
const KASHF = { on: true, hist: 6, big: 300, share: 0.2, glut: 0.9, minLoss: 2 };
const REPX = { on: true, k: 0.10, kf: 0.25 };
const ACHX = { on: true, infl: { b: 3, s: 6, g: 12 }, none: ['zakat_first', 'zakat_on_time', 'rep_high'], title: [0, 5, 10, 15, 20, 25, 30, 35], board: 3 };
const mxHuman = S => !!(S && S.player && S.learn && S.learn.char);
const mxOn = S => !!(KASHF.on && mxHuman(S));
const mxK = S => Math.floor(S.day / PR.month);
const mxSnap = P => ({ inc: Object.assign({}, P.led.inc), exp: Object.assign({}, P.led.exp) });
function mxEnsure(S) {
  if (!mxOn(S)) return null; const P = S.player;
  if (!P.mx) P.mx = { k: mxK(S), d0: S.day, led0: mxSnap(P), t: {}, s: {}, last: null, hist: [] };
  return P.mx;
}
const mxShopRow = (M, id) => M.s[id] || (M.s[id] = { c: '', rev: 0, cogs: 0, fix: 0, g: {} });

/* ===== §3-ب سبب خسارة الصفقة ===== */
function lossParts(S, tr) {
  const q = tr.q, cost = tr.net - tr.pl, uc = cost / q, us = (tr.net + (tr.tx == null ? 0 : tr.tx)) / q, m = mid(tr.g);
  return { b: Math.round(Math.max(0, uc - m) * q), s: Math.round(Math.max(0, m - us) * q), t: Math.round(tr.tx == null ? 0 : tr.tx), uc, us, m };
}
function lossWhy(S, tr) {
  if (!tr || !tr.lw) return 'لا تفصيل لهذه الصفقة';
  const lw = tr.lw, loss = -tr.pl, q = tr.q, m = mid(tr.g), uc = (tr.net - tr.pl) / q, us = (tr.net + (tr.tx || 0)) / q;
  const txt = { s: 'بعتَها بـ' + fmtN(us) + ' للوحدة والمعتاد ≈ ' + fmtN(m) + (tr.gl ? '؛ السوق متخم بها' : ''), b: 'اشتريتَها بـ' + fmtN(uc) + ' للوحدة والمعتاد ≈ ' + fmtN(m), t: 'ضريبة السوق ' + fmtN(lw.t) };
  const order = ['s', 'b', 't'], first = order.reduce((a, k) => (lw[k] > lw[a] ? k : a), 's');
  const parts = [first].concat(order.filter(k => k !== first && lw[k] >= KASHF.share * loss && lw[k] > 0));
  let out = parts.map(k => txt[k]).join('؛ ');
  if (tr.es > 0) out += '؛ قدّرنا ربحها ≈ ' + fmtN(tr.es) + ' عند الانطلاق';
  return out;
}
/* يُستدعى من logTrade بعد تسجيل الصفقة (T[0]) */
function mxTrade(S, tr, tax) {
  if (!mxOn(S) || tr.side !== 'sell' || tr.sector !== 'trade') return;
  const M = mxEnsure(S), c = S.cities[tr.city]; if (tax != null) tr.tx = Math.round(tax);
  const t = M.t[tr.city] || (M.t[tr.city] = { n: 0, pl: 0, nl: 0, lb: 0, ls: 0, lt: 0 });
  t.n += 1; t.pl += tr.pl;
  if (tr.pl < 0 && tr.q > 0) {
    const lp = lossParts(S, tr); tr.lw = { b: lp.b, s: lp.s, t: lp.t };
    t.nl += 1; t.lb += lp.b; t.ls += lp.s; t.lt += lp.t;
    if (c && c.stock[tr.g] >= KASHF.glut * capG(c, tr.g)) tr.gl = 1;
    const car = (S.player.caravans || []).find(x => x.city === tr.city && x.bm && x.bm.est > 0); if (car) tr.es = car.bm.est;
    const loss = -tr.pl;
    if (loss >= KASHF.big) news(S, (diwanOf(S) ? 'الناظر: ' : '') + 'خسرتَ ' + fmtN(loss) + ' في بيع ' + tr.q + ' ' + GD[tr.g].name + ' في ' + (c ? c.name : tr.city) + ': ' + lossWhy(S, tr) + '.', 'bad');
  }
}
/* §3-أ: مبيعات الدكان اليومية */
function mxShopSale(S, city, shId, g, rev, cogs) {
  if (!mxOn(S)) return; const r = mxShopRow(mxEnsure(S), shId); r.c = city; r.rev += rev; r.cogs += cogs; r.g[g] = (r.g[g] || 0) + rev;
}
function mxShopFix(S, city, shId, fix) {
  if (!mxOn(S)) return; const r = mxShopRow(mxEnsure(S), shId); r.c = city; r.fix += fix;
}
/* حصة الدكان من الأجور والصيانة والإيجار: المعادلة نفسها التي يمررها الوقف حرفاً (أجزاء ثلاثة تُطرح بالتتابع لئلا يتغير الرقم) */
function shopFixDay(S, pr, sh, x) {
  const shared = (x.Lx.staff || 0) + (x.Lx.upkeep || 0) + (x.Lx.rent || 0) + (x.Lx.marketFee || 0) - x.c0 - ((x.Lx.rent || 0) - x.rent0) + x.deferredStaffCost;
  const a = shared / Math.max(1, pr.shops.length), b = (sh.rentPaid || 0) - (x.rentBefore[sh.id] || 0), c = ((S.paymentDues || []).find(d => d.id === sh.paymentDue)?.deferredWages || 0) - (x.rentDebtBefore[sh.id] || 0);
  return { a, b, c, sum: a + b + c };
}

/* ===== §3-ج الإقفال ===== */
const mxDiff = (a, b) => { const o = {}; for (const k in (a || {})) { const v = Math.round(a[k] - ((b || {})[k] || 0)); if (v > 0) o[k] = v; } return o; };
const mxSum = o => Object.values(o).reduce((a, b) => a + b, 0);
function mxStatement(S, M, d1) {
  const P = S.player, inc = mxDiff(P.led.inc, M.led0.inc), exp = mxDiff(P.led.exp, M.led0.exp), net = mxSum(inc) - mxSum(exp);
  const t = JSON.parse(JSON.stringify(M.t)), trade = { pl: 0, n: 0, nl: 0 }; for (const c in t) { trade.pl += t[c].pl; trade.n += t[c].n; trade.nl += t[c].nl; }
  let road = 0; for (const k in FX_COST_KEYS) road += exp[k] || 0;
  const shops = {}; for (const id in M.s) { const r = M.s[id]; shops[id] = { c: r.c, rev: Math.round(r.rev), cogs: Math.round(r.cogs), fix: Math.round(r.fix), net: Math.round(r.rev - r.cogs - r.fix), top: Object.entries(r.g).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g, v]) => [g, Math.round(v)]) }; }
  return { k: M.k, d0: M.d0, d1, inc, exp, net, trade, road, t, s: shops };
}
const titleIdx = nw => { let r = 0; WEALTH_TITLES.forEach(([a], i) => { if (nw >= a) r = i; }); return r; };
function mxTitles(S, quiet) {
  if (!ACHX.on || !mxHuman(S)) return 0; let n = 0, sum = 0; const ti = titleIdx(netWorth(S));
  for (let i = 1; i <= ti; i++) { const w = ACHX.title[i] || 0; if (bonusAward(S, 'wt:' + i, w, 0, quiet ? null : 'بلغتَ لقب ' + WEALTH_TITLES[i][1])) { n++; sum += w; } }
  return quiet ? sum : n;
}
function mxDay(S) {
  if (!mxHuman(S)) return; achxMigrate(S);
  if (KASHF.on) {
    const M = mxEnsure(S);
    if (mxK(S) !== M.k) {
      const st = mxStatement(S, M, S.day - 1); M.last = st; M.hist.push({ k: M.k, net: st.net }); if (M.hist.length > KASHF.hist) M.hist.splice(0, M.hist.length - KASHF.hist);
      M.k = mxK(S); M.d0 = S.day; M.led0 = mxSnap(S.player); M.t = {}; M.s = {};
      mxTitles(S, false);
    }
  } else if (ACHX.on && S.day > 0 && S.day % PR.month === 0) mxTitles(S, false);
}
function mxView(S, which) {
  const M = S.player.mx; if (!M) return null;
  if (which === 'last') return M.last;
  return mxStatement(S, M, S.day);
}
function mxShop(S, city, shId) {
  const M = S.player.mx; if (!M) return null; const cur = mxView(S, 'cur').s[shId] || { c: city, rev: 0, cogs: 0, fix: 0, net: 0, top: [] };
  return { d0: M.d0, cur, last: M.last ? (M.last.s[shId] || { net: 0 }) : null };
}
function mxCityNet(S, city, which) {
  const v = which === 'last' ? (S.player.mx && S.player.mx.last) : (S.player.mx && mxView(S, 'cur')); if (!v) return null;
  let n = 0; for (const id in v.s) if (v.s[id].c === city) n += v.s[id].net; return n;
}

/* ===== §3-و بطاقات التنبيه (تُولَّد عند القراءة من الشهر المنتهي؛ بلا تخزين) ===== */
function mxCards(S) {
  const M = S.player && S.player.mx, L = M && M.last; if (!mxOn(S) || !L) return []; const dw = !!diwanOf(S), out = [], k = L.k;
  if (dw) {
    for (const city in L.t) { const t = L.t[city]; if (t.pl < 0 && t.nl >= KASHF.minLoss) {
      const mx = Math.max(t.ls, t.lb, t.lt), x = mx === t.ls ? 'تبيع فيها تحت السعر المعتاد' : mx === t.lb ? 'تشتري بضاعتها غالية قبل أن تبيعها هنا' : 'ضريبة السوق تأكل هامشك';
      out.push({ id: 'nz:mkt:' + city + ':' + k, kind: 'mkt', w: 60, city, title: 'الناظر: تجارتك في ' + S.cities[city].name + ' خسرت ' + fmtN(-t.pl) + ' الشهر الماضي', why: t.nl + ' صفقة خاسرة من ' + t.n + '؛ السبب الأكبر: ' + x }); } }
    if (L.trade.pl > 0 && L.trade.pl - L.road < 0) {
      let bk = null; for (const kk in FX_COST_KEYS) if ((L.exp[kk] || 0) > (bk ? L.exp[bk] : 0)) bk = kk;
      out.push({ id: 'nz:road:' + k, kind: 'road', w: 50, title: 'الناظر: ربحت البضاعة ' + fmtN(L.trade.pl) + ' وخسر الطريق ' + fmtN(L.road), why: bk ? 'أكبر نفقة: ' + FX_COST_KEYS[bk] + ' ' + fmtN(L.exp[bk]) : '' }); }
  }
  for (const id in L.s) { const s = L.s[id]; if (s.net >= 0) continue; const pr = S.player.props[s.c], mgr = pr && pr.mgr; if (!dw && !mgr) continue;
    const idx = pr ? pr.shops.findIndex(x => String(x.id) === String(id)) + 1 : 0; if (pr && idx === 0) continue;
    out.push({ id: 'nz:shop:' + id + ':' + k, kind: 'shop', w: 55, city: s.c, shopId: id, title: (dw ? 'الناظر' : 'مدير ' + S.cities[s.c].name) + ': دكانك ' + idx + ' في ' + S.cities[s.c].name + ' خسر ' + fmtN(-s.net),
      why: s.rev - s.cogs < 0 ? 'يبيع تحت تكلفة بضاعته (' + fmtN(s.rev) + ' مقابل ' + fmtN(s.cogs) + ')' : 'هامشه ' + fmtN(s.rev - s.cogs) + ' لا يغطي الأجور والصيانة والإيجار ' + fmtN(s.fix) }); }
  if (dw) {
    const rows = [], tr = L.t; for (const c in tr) rows.push(['تجارة في ' + S.cities[c].name, Math.round(tr[c].pl)]); for (const id in L.s) rows.push(['دكان في ' + (S.cities[L.s[id].c] || {}).name, L.s[id].net]);
    rows.sort((a, b) => b[1] - a[1]); const hi = rows[0], lo = rows[rows.length - 1];
    out.push({ id: 'nz:month:' + k, kind: 'month', w: 20, title: 'تقرير الناظر للشهر: صافي ' + (L.net < 0 ? '−' : '+') + fmtN(Math.abs(L.net)), why: rows.length ? 'أربح ما عندك: ' + hi[0] + ' · ' + (lo[1] < 0 ? 'أخسره: ' + lo[0] : 'لا خسارة هذا الشهر') : 'لا خسارة هذا الشهر' });
  }
  return out.sort((a, b) => b.w - a.w);
}

/* ===== §4 السمعة بأثر (حساسة؛ الزكاة مستبعدة) ===== */
function repT(S) { const ps = reputation(S).parts.filter(p => p.id !== 'zakat'); return Math.round(ps.reduce((a, p) => a + p.score, 0) / ps.length); }
const repPactMul = S => clamp(1 + REPX.k * (50 - repT(S)) / 50, 1 - REPX.k, 1 + REPX.k);
const repFinMul = S => clamp(1 + REPX.kf * (repT(S) - 50) / 50, 1 - REPX.kf, 1 + REPX.kf);

/* ===== §5 الإنجازات والألقاب واللوحة بأثر (نفوذ فقط) ===== */
function achReward(S, id) {
  if (!ACHX.on || !mxHuman(S) || ACHX.none.includes(id)) return 0; const d = ACHD.LIST.find(a => a.id === id); if (!d) return 0;
  const n = ACHX.infl[d.tier] || 0; return bonusAward(S, 'ach:' + id, n, 0, null) ? n : 0;
}
function achxMigrate(S) {
  if (!ACHX.on || !mxHuman(S) || !S.ach) return; const L = S.learn; L.bk = L.bk || {}; if (L.bk['achx'] != null) return; L.bk['achx'] = S.day;
  let sum = 0, na = 0; for (const id in (S.ach.got || {})) { const n = achReward(S, id); if (n) { sum += n; na++; } }
  const nt = (() => { let c = 0; const ti = titleIdx(netWorth(S)); for (let i = 1; i <= ti; i++) if (bonusAward(S, 'wt:' + i, ACHX.title[i] || 0, 0, null)) { c++; sum += ACHX.title[i] || 0; } return c; })();
  if (sum > 0) news(S, 'مكافأة إنجازاتك وألقابك السابقة: +' + sum + ' نفوذ (' + na + ' إنجازاً و' + nt + ' لقباً).', 'good');
}
function mxBoard(S) {
  if (!ACHX.on || !mxHuman(S)) return; const r = marketBoard(S)[0];
  if (r && r.led) bonusAward(S, 'bd:' + S.day, ACHX.board, 0, 'سوقك ' + r.name + ' الأول في لوحة الأسواق هذا الشهر');
}
