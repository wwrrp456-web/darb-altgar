/* ---------- 043ب بقية محوّلات الناظر (spec-b.md؛ المعادلات منها حرفاً) ----------
   سبعة محوّلات تُضاف إلى DELEG_KINDS (التسعير، بيع الصغار، الحراسة، دفعات الاستيراد، إنذار الشرط الجزائي، تصفية الشراكة، التبرع للصندوق).
   كل محوّل يستدعي فعلاً قائماً (A.* أو دالة محرك) بالأرقام نفسها التي يدفعها اللاعب بيده؛ لا مسار مال جديد.
   DELEG.b=false: تُخفى من الكتالوج والاقتراحات وتبقى مهامها في الحفظ بلا تنفيذ. حقولها (rv/seen/last/hz/wk) داخل المهمة وحدها.
   لا يُفوَّض هنا: الزكاة، وفسخ ما فيه شرط جزائي، ورفض دفعات الاستيراد، وشراء الأصول، وبيع الكبار. */
Object.assign(DELEG, { b: true, herdDay: 20 });
const dlIn = (t, city) => t.scope === '*' || t.scope === city;
const dlCtx = (S, city) => { if (city && city !== '*' && S.cities[city]) ctxFor(S, city); else S.ctxCur = 'sar'; };
const dlPct = x => Math.round(x * 100) + '٪';
const dlNum = x => String(dlR2(x));
const dlWinLeft = (S, t) => { const w = dlWin(S, t); return Math.max(0, w.cap - w.spent); };
function dlWinTake(S, t) { const w = dlWin(S, t); t.win = w.fresh ? { d: w.d, cap: w.cap, spent: 0 } : w; return t.win; }
const dlModeField = (S, eff) => ({ k: 'mode', title: 'كيف يتصرف؟', opts: Object.keys(DELEG_MODES).map(m => ({ v: m, label: DELEG_MODES[m], effect: m === 'exec' ? eff[0] : m === 'ask' ? 'يسألك ثم ' + eff[1] + ' بعد ' + DELEG.wait + ' أيام إن لم تردّ' : 'يذكّرك فقط ولا ' + eff[2] })) });
const dlLimOf = d => { const l = {}; for (const k in d) if (!['kind', 'type', 'scope', 'mode'].includes(k)) l[k] = d[k]; return l; };
const dlTmp = (K, d) => ({ id: 0, kind: K.id, type: d.type, scope: d.scope, mode: d.mode, limits: K.norm({ limits: dlLimOf(d), type: d.type }), since: 0, log: [] });
const dlOneOf = (v, list, msg) => (list.includes(+v) ? null : msg);

/* ---- 1) price: تسعير الدكاكين يوم تسعير المدير (S.day % 7 === 0)، عدا ما يسعّره مدير قائم ---- */
const dlMgrPrices = (S, city, pr, sh) => !!(pr.mgr && (pr.mgr.rank === 3 ? !!(pr.mgr.policy && pr.mgr.policy.pricing) && mgrOk(S, city, pr, { kind: 'shop', id: sh.id }) : pr.mgr.rank === 2 ? !!(pr.mgr.asset && pr.mgr.asset.kind === 'shop' && pr.mgr.asset.id === sh.id) : mgrOk(S, city, pr)));
function prList(S, t) {
  const out = [], floor = t.limits.floor;
  for (const city of (S.order || [])) { if (!dlIn(t, city)) continue; const pr = S.player.props[city]; if (!pr) continue;
    for (const sh of pr.shops) { if (dlMgrPrices(S, city, pr, sh)) continue;
      for (const it of sh.items) { const have = pr.store[it.g] || 0, tgt = it.target || 1, sold = it.lastSold || 0; let to = it.price;
        if (have >= 0.8 * tgt && sold < 0.05 * tgt) to = Math.max(floor, it.price - PRICE_STEP);
        else if (have < 0.25 * tgt && sold > 0) to = Math.min(PRICE_MAX, it.price + PRICE_STEP);
        if (Math.abs(to - it.price) > 1e-9) out.push({ city, shopId: sh.id, g: it.g, from: it.price, to }); } } }
  return out;
}
const prItems = (S, t) => { let n = 0; for (const city of (S.order || [])) { if (!dlIn(t, city)) continue; const pr = S.player.props[city]; if (pr) for (const sh of pr.shops) if (!dlMgrPrices(S, city, pr, sh)) n += sh.items.length; } return n; };
function prPlan(S, t) { const L = S.day % 7 === 0 ? prList(S, t) : []; return { n: L.length, list: L, text: 'أعدّل سعر ' + L.length + ' سلعة' + (t.scope === '*' ? '' : ' في ' + dlCityName(S, t.scope)) + ' (الراكد يُخفَّض والشحيح يُرفع)' }; }
function prRun(S, t) {
  const L = prList(S, t), u = [], parts = []; t.rv = t.rv || {};
  for (const x of L) { const sh = shopsOf(S, x.city).find(s => s.id === x.shopId), it = sh && sh.items.find(i => i.g === x.g); if (!it) continue;
    const k = x.city + ':' + x.shopId + ':' + x.g; if (t.rv[k] == null) t.rv[k] = it.revenue || 0;
    const r = A.shopSetItem(S, x.city, x.shopId, x.g, x.to, it.auto, it.carry); if (r.ok === false) continue;
    u.push({ city: x.city, shopId: x.shopId, g: x.g, from: x.from, to: it.price }); parts.push((x.to < x.from ? 'خفّضتُ' : 'رفعتُ') + ' سعر ' + GD[x.g].name + ' في ' + dlCityName(S, x.city) + ' من ' + dlNum(x.from) + ' إلى ' + dlNum(it.price)); }
  return { done: false, did: parts.join('، '), cost: 0, u: u.length ? u : null };
}
function prUndo(S, e) {
  const kept = [];
  for (const x of (Array.isArray(e.u) ? e.u : [])) { const sh = shopsOf(S, x.city).find(s => s.id === x.shopId), it = sh && sh.items.find(i => i.g === x.g); if (!it) continue;
    if (Math.abs(it.price - x.to) <= 1e-8) A.shopSetItem(S, x.city, x.shopId, x.g, x.from, it.auto, it.carry); else kept.push(GD[x.g].name + ': تغيّر سعره بعدي'); }
  return OK(kept.join('، '));
}
const prMeas = (S, t) => { let v = 0; for (const k in (t.rv || {})) { const [city, id, g] = k.split(':'), sh = shopsOf(S, city).find(s => String(s.id) === id), it = sh && sh.items.find(i => i.g === g); if (it) v += (it.revenue || 0) - t.rv[k]; } return { label: 'مبيعات ما سعّرتُه منذ التفويض', v: dlR2(v) }; };

/* ---- 2) herdsell: بيع الصغار عند امتلاء المزرعة، بلا إيقاف قرب الحول (المختص DL-01: البيع المفوَّض للحاجة جائز قرب الحول) ---- */
const hsFarms = (S, t) => (S.order || []).filter(c => dlIn(t, c) && farmOf(S, c) && farmCap(S, c) > 0);
const hsLoad = (S, c) => farmUnits(farmOf(S, c)) / farmCap(S, c);
function hsPicks(S, t, sell) { // sell=true ينفّذ A.farmSell؛ وإلا يقدّر بالمعادلة نفسها دون بيع
  const out = [], c0 = S.ctxCur; let left = DELEG.herdDay, net = 0, n = 0;
  for (const city of hsFarms(S, t)) { if (left <= 0) break; const f = farmOf(S, city), cap = farmCap(S, city); if (farmUnits(f) / cap < t.limits.thr) continue;
    ctxFor(S, city); let need = farmUnits(f) - (t.limits.thr - 0.1) * cap;
    const gs = Object.keys(f.hx || {}).filter(g => ((f.hx[g] || {}).y || 0) >= 1).sort((a, b) => (f.hx[b].y - f.hx[a].y) || (a < b ? -1 : a > b ? 1 : 0));
    for (const g of gs) { if (need <= 0 || left <= 0) break; if (!(ratio(S.cities[city], g) >= t.limits.pmin)) continue; const fu = BREED[g] ? BREED[g].fu : 1;
      const k = Math.min(Math.floor(f.hx[g].y), Math.ceil(need / (0.5 * fu)), left); if (k < 1) continue;
      let got = k, gain = 0; if (sell) { const r = A.farmSell(S, city, g, k, 'young'); if (!r || r.ok === false) continue; got = r.n; gain = r.net; }
      need -= got * 0.5 * fu; left -= got; n += got; net += gain; out.push({ city, g, n: got, net: gain }); } }
  if (!sell) S.ctxCur = c0; return { list: out, n, net };
}
function hsPlan(S, t) { const p = hsPicks(S, t, false); return { n: p.n, text: 'أبيع ' + p.n + ' من صغار المزرعة الممتلئة' + (t.scope === '*' ? '' : ' في ' + dlCityName(S, t.scope)) }; }
function hsRunB(S, t) {
  const p = hsPicks(S, t, true); if (!p.n) return { done: false, did: '', cost: 0 };
  return { done: false, did: 'بعتُ ' + p.list.map(x => x.n + ' من صغار ' + GD[x.g].name + ' في ' + dlCityName(S, x.city)).join('، ') + ' صافي ' + fmtN(p.net) + ' ريال (بيع، لا يُعكس)', cost: 0, gain: p.net };
}

/* ---- 3) guard: حراسة القوافل الواقفة قبل طريق خطر، بميزانية شهرية نسبية ---- */
const gdCars = (S, t) => (S.player.caravans || []).filter(car => car.captain && !car.main && car.left === 0 && car.route && dlIn(t, car.city));
const gdNext = car => (car.city === car.route.a ? car.route.b : car.route.a);
function gdNeed(S, t, car) { const e = roadEstimate(S, car, gdNext(car)); return !!(e && !e.guarded && e.level >= t.limits.lv) ? e : null; }
function gdPlan(S, t) {
  if (lessonLock(S, 'guards')) return { n: 0, text: '' }; const c0 = S.ctxCur; dlCtx(S, t.scope); const left = dlWinLeft(S, t); S.ctxCur = c0;
  const cars = gdCars(S, t).filter(car => gdNeed(S, t, car) && (car.guards || 0) < t.limits.gmax && (car.guards || 0) < 8 && WAGE.guardHire <= left);
  return { n: cars.length, text: 'أوظّف حرّاساً لـ' + cars.length + ' قافلة واقفة قبل طريق خطر' };
}
function gdRun(S, t) {
  dlCtx(S, t.scope); const w = dlWinTake(S, t), parts = []; let cost = 0;
  for (const car of gdCars(S, t)) { let e = gdNeed(S, t, car); if (!e) continue; const e0 = e, next = gdNext(car); let n = 0, paid = 0; ctxFor(S, car.city);
    while (e && e.level >= t.limits.lv && (car.guards || 0) < t.limits.gmax && (car.guards || 0) < 8 && w.spent + WAGE.guardHire <= w.cap) {
      const g0 = S.player.gold, r = A.hireGuard(S, car.id); if (!r || r.ok === false) break; const d = g0 - S.player.gold; w.spent += d; paid += d; n++; e = roadEstimate(S, car, next); }
    if (n) { cost += paid; parts.push('وظّفتُ ' + n + ' حارساً لـ' + car.name + ' قبل طريق ' + dlCityName(S, car.city) + '→' + dlCityName(S, next) + ': خطر الخسارة من ' + Math.round(e0.loss * 100) + '٪ إلى ' + Math.round((e ? e.loss : 0) * 100) + '٪ بـ' + fmtN(paid) + ' ريال'); } }
  return { done: false, did: parts.join('؛ '), cost };
}

/* ---- 4) imports: قبول دفعات الاستيراد والتوريد بحدّ اللاعب؛ لا يرفض أبداً (القرار له) ---- */
const imUc = (ag, b) => (ag.kind === 'raw' && ag.mode === 'salam' ? b.unit : b.unit + b.cust / b.qty);
function imEval(S, t, all) {
  const c0 = S.ctxCur; dlCtx(S, t.scope); let left = dlWinLeft(S, t); S.ctxCur = c0; const out = [];
  for (const ag of (S.player.agr || [])) { if (ag.kind !== 'import' && ag.kind !== 'raw') continue; const b = ag.batch; if (!b || S.day > b.until || !dlIn(t, ag.city)) continue; if (!all && (t.seen || {})[ag.id] === b.day) continue;
    const uc = imUc(ag, b); ctxFor(S, ag.home); const hp = unitPrice(S.cities[ag.home], ag.goods), est = b.qty * uc, price = uc <= t.limits.q * hp, room = est <= left;
    out.push({ ag, b, uc, hp, est, ok: price && room, why: price ? (room ? '' : 'budget') : 'price', left }); if (price && room) left -= est; }
  S.ctxCur = c0; return out;
}
const imBoss = (S, ag) => { const bs = bossOf(S, ag.city); return bs ? bs.name : dlCityName(S, ag.city); };
function imPre(S, D, t) {
  for (const x of imEval(S, t)) { if (x.ok) continue; (t.seen || (t.seen = {}))[x.ag.id] = x.b.day; const by = dateOf(S, x.b.until).hs;
    dlRec(S, D, t, t.kind, x.why === 'price' ? 'لم أقبل دفعة ' + GD[x.ag.goods].name + ' من ' + imBoss(S, x.ag) + ': كلفتها ' + dlNum(x.uc) + ' للوحدة وسعر سوقك ' + dlNum(x.hp) + ' (حدّك ' + Math.round(t.limits.q * 100) + '٪). القرار لك قبل ' + by
      : 'لم أقبل دفعة ' + GD[x.ag.goods].name + ' من ' + imBoss(S, x.ag) + ': كلفتها نحو ' + fmtN(x.est) + ' ريال وبقي من ميزانية الشهر ' + fmtN(x.left) + '. القرار لك قبل ' + by, 0, { irrev: true }); }
}
function imPlan(S, t) { const L = imEval(S, t).filter(x => x.ok); return { n: L.length, text: 'أقبل ' + L.length + ' دفعة استيراد بنحو ' + fmtN(L.reduce((s, x) => s + x.est, 0)) + ' ريال' }; }
function imRun(S, t) {
  const L = imEval(S, t).filter(x => x.ok); dlCtx(S, t.scope); const w = dlWinTake(S, t), parts = []; let cost = 0;
  for (const x of L) { if (w.spent + x.est > w.cap + 1e-9) continue; const ag = x.ag, cur = ag.kind === 'raw' && ag.mode === 'salam' ? 'sar' : curOf(S.cities[ag.city].country);
    S.ctxCur = cur; const g0 = S.player.gold, n0 = ag.led.act || 0, r = ag.kind === 'import' ? A.agrAccept(S, ag.id) : A.rawAccept(S, ag.id); S.ctxCur = cur; const paid = g0 - S.player.gold;
    (t.seen || (t.seen = {}))[ag.id] = x.b.day; if (!r || r.ok === false) { parts.push('تعذّر قبول دفعة ' + GD[ag.goods].name + ' من ' + imBoss(S, ag) + ': ' + (r ? r.msg : '')); continue; }
    w.spent += paid; cost += paid; const n = ag.kind === 'raw' && ag.mode === 'salam' ? x.b.qty : Math.round((ag.led.act || 0) - n0);
    parts.push('قبلتُ دفعة ' + n + ' من ' + GD[ag.goods].name + ' بـ' + fmtN(paid) + ' ريال: كلفة الوحدة ' + dlNum(x.uc) + ' وسعرها في ' + dlCityName(S, ag.home) + ' ' + dlNum(x.hp)); }
  return { done: false, did: parts.join('؛ '), cost };
}

/* ---- 5) agrwatch: إنذار الشرط الجزائي القادم بمعادلة agrSettleExport نفسها (تقرير يومي، لا فعل ولا خصم) ---- */
function awDmg(S, ag) {
  const exp = ag.led.exp, act = ag.led.act, short = Math.max(0, exp - act), share = exp > 0 ? short / exp : 1, cust = (ag.saved || 0) * share, lost = short * INFLU.margin * refPrice(S.cities[ag.city], ag.goods), dmg = Math.round(cust + lost);
  return { short, cust, lost, dmg: typeof actualDamage === 'function' ? actualDamage(S, { customsGiven: cust, marginLost: lost }, { round: true }).total : dmg };
}
const awList = S => (S.player.agr || []).filter(ag => ag.kind === 'export').map(ag => Object.assign({ ag, dl: Math.min(ag.period - (ag.cnt || 0), ag.left) }, awDmg(S, ag)));
function awRun(S, t) {
  t.last = S.day; const lines = [];
  for (const x of awList(S)) { if (x.dl > 7 || !(x.short > 0)) continue; const sd = S.day + x.dl; if ((t.seen || {})[x.ag.id] === sd) continue; (t.seen || (t.seen = {}))[x.ag.id] = sd;
    lines.push('عقد تصدير ' + GD[x.ag.goods].name + ' مع ' + imBoss(S, x.ag) + ': بقي ' + x.dl + ' يوماً والناقص ' + Math.round(x.short) + ' وحدة. إن لم تُكمله فالشرط الجزائي بقدر الضرر الفعلي نحو ' + fmtN(x.dmg) + ' ريال (جمارك وفّرتَها ' + fmtN(x.cust) + ' وهامش الناقص ' + fmtN(x.lost) + ')'); }
  return { done: false, did: lines.join(' · '), cost: 0, news: lines.length > 0 };
}

/* ---- 6) part: تصفية شراكة المصنع الخاسرة بشراء حصة الزعيم (partOwed حرفاً) ---- */
const ptLoss = ag => Math.max(-ag.K, ag.pnl || 0);
const ptList = (S, t) => (S.player.agr || []).filter(ag => ag.kind === 'part' && dlIn(t, ag.city) && ptLoss(ag) <= -t.limits.loss * ag.K);
const ptName = (S, ag) => (RECIPES[ag.recipe] && GD[RECIPES[ag.recipe].out] ? 'مصنع ' + GD[RECIPES[ag.recipe].out].name : 'المصنع') + ' في ' + dlCityName(S, ag.home);
function ptPre(S, D, t) {
  for (const ag of ptList(S, t)) { const due = Math.max(0, ag.share * (ag.K + ptLoss(ag))); ctxFor(S, ag.city); if (S.player.gold >= due) continue; const wk = t.wk || (t.wk = {}); if (wk[ag.id] != null && S.day - wk[ag.id] < 7) continue; wk[ag.id] = S.day;
    dlRec(S, D, t, t.kind, 'شراكة ' + ptName(S, ag) + ' تخسر ' + fmtN(-ptLoss(ag)) + ' (حدّك ' + Math.round(t.limits.loss * 100) + '٪)، وشراء حصة الزعيم يحتاج ' + fmtN(due) + ' ولا يكفي نقدك', 0, { irrev: true }); }
}
function ptPlan(S, t) { const c0 = S.ctxCur, L = ptList(S, t).filter(ag => { ctxFor(S, ag.city); return S.player.gold >= Math.max(0, ag.share * (ag.K + ptLoss(ag))); }); S.ctxCur = c0; return { n: L.length, text: 'أشتري حصة الزعيم في ' + L.length + ' شراكة خاسرة بنحو ' + fmtN(L.reduce((s, ag) => s + partOwed(ag), 0)) + ' ريال' }; }
function ptRun(S, t) {
  const parts = []; let cost = 0;
  for (const ag of ptList(S, t)) { const due = Math.max(0, ag.share * (ag.K + ptLoss(ag))); ctxFor(S, ag.city); if (S.player.gold < due) continue; const nm = ptName(S, ag), r = A.partBuyout(S, ag.id); if (!r || r.ok === false) continue;
    const paid = ag.led.act || 0; cost += paid; parts.push('اشتريتُ حصة ' + imBoss(S, ag) + ' في ' + nm + ' بـ' + fmtN(paid) + ' ريال: خسارة الشراكة ' + fmtN(-ptLoss(ag)) + ' قُسّمت بقدر الحصص'); }
  return { done: false, did: parts.join('؛ '), cost };
}

/* ---- 7) donate: تبرع شهري لصندوق مدينة واحدة من صافي الدفتر، عبر fundDonate القائم ---- */
const dnCities = S => (S.order || []).filter(c => S.cities[c] && (S.player.props[c] || (bossOf(S, c) && bossOf(S, c).ruler === 'player')));
function dnCalc(S, t) {
  const L = hsLedger(S), amt = Math.min(t.limits.mx, Math.floor(t.limits.pct / 100 * L.net)), c0 = S.ctxCur; ctxFor(S, t.scope); const gold = S.player.gold; S.ctxCur = c0;
  const bs = bossOf(S, t.scope), f = (S.cities[t.scope] || {}).fund || {}, tr = bs && bs.ruler !== 'player' && S.day - (f.donDay == null ? -1e9 : f.donDay) >= MFUND.donateGap ? Math.min(MFUND.donateTrustMax, amt / 1000 * MFUND.donateTrust) : 0;
  const due = S.day - (t.last != null ? t.last : t.since) >= 30, ok = L.since === 'days' && L.net > 0 && amt >= MFUND.donateMin && gold - amt >= operatingReserve(S);
  return { L, amt, tr, ok, due, bs };
}
function dnPlan(S, t) { if (!mfOn(S) || t.scope === '*') return { n: 0, text: '' }; const x = dnCalc(S, t); return { n: x.due && x.ok ? 1 : 0, text: 'أتبرع بـ' + fmtN(x.amt) + ' لصندوق ' + dlCityName(S, t.scope) }; }
function dnRun(S, t) {
  const x = dnCalc(S, t); if (!x.due || !x.ok) return { done: false, did: '', cost: 0 }; const tr0 = x.bs ? x.bs.trust : 0, r = A.fundDonate(S, t.scope, x.amt, t.limits.dim || null); if (!r || r.ok === false) return { done: false, did: '', cost: 0 };
  t.last = S.day; const dtr = x.bs ? x.bs.trust - tr0 : 0;
  return { done: false, did: 'تبرعتُ بـ' + fmtN(x.amt) + ' ريال لصندوق ' + dlCityName(S, t.scope) + (t.limits.dim ? ' لغرض ' + PR_NAMES[t.limits.dim] : '') + ' (' + t.limits.pct + '٪ من صافي دفترك في آخر ' + x.L.days + ' يوماً)' + (dtr > 0 ? '، فارتفعت ثقة ' + x.bs.name + ' ' + dlNum(dtr) : ''), cost: x.amt };
}

/* ---- الكتالوج: avail(S) سبب التعطيل أو ''، وfields/sum بأرقام اللحظة ---- */
const dlCities = (S, pred) => (S.order || []).filter(c => S.cities[c] && pred(c));
const dlScopeField = (S, K, d, cities, eff, noAll) => ({ k: 'scope', title: 'أين؟', opts: (noAll ? [] : [{ v: '*', label: 'كل المدن', effect: eff(dlTmp(K, Object.assign({}, d, { scope: '*' }))) }]).concat(cities.map(c => ({ v: c, label: S.cities[c].name, effect: eff(dlTmp(K, Object.assign({}, d, { scope: c }))) }))) });
const dlCheckB = (S, K, s) => { if (!DELEG.b) return NO('مهمة غير معروفة'); const why = K.avail(S); if (why) return NO(why); return null; };
Object.assign(DELEG_KINDS, {
  price: { id: 'price', b: true, name: 'تسعير الدكاكين', types: ['standing'], floors: [1.1, 1.3, 1.5], def: { type: 'standing', scope: '*', floor: 1.1, mode: 'exec' },
    avail: S => ((S.order || []).some(c => S.player.props[c] && S.player.props[c].shops.some(sh => sh.items.length)) ? '' : 'لا دكان فيه سلع'),
    check(S, s) { const x = dlCheckB(S, this, s); if (x) return x; const m = dlOneOf(s.limits.floor, this.floors, 'اختر أدنى سعر 1.1 أو 1.3 أو 1.5'); return m ? NO(m) : OK(''); },
    norm: s => ({ floor: +s.limits.floor }), plan: prPlan, run: prRun, undo: prUndo, meas: prMeas,
    desc: (S, t) => t.limits.floor ? 'أدنى سعر ' + t.limits.floor : '',
    fields(S, d) { const K = this, cities = dlCities(S, c => S.player.props[c] && S.player.props[c].shops.some(sh => sh.items.length));
      return [dlScopeField(S, K, d, cities, t => prItems(S, t) + ' سلعة يسعّرها، و' + prList(S, t).length + ' تحتاج تعديلاً الآن'),
        { k: 'floor', title: 'أدنى سعر للراكد', opts: K.floors.map(f => ({ v: f, label: 'لا ينزل تحت ' + f, effect: prList(S, dlTmp(K, Object.assign({}, d, { floor: f }))).length + ' سلعة تحتاج تعديلاً الآن' })) },
        dlModeField(S, ['يسعّر ويخبرك', 'يسعّر', 'يسعّر'])]; },
    sum(S, d) { const t = dlTmp(this, d); return 'تسعير ' + prItems(S, t) + ' سلعة في ' + dlCityName(S, d.scope) + ' كل أسبوع يوم تسعير المدير: الراكد −' + PRICE_STEP + ' حتى ' + d.floor + '، والشحيح +' + PRICE_STEP + ' حتى ' + PRICE_MAX + ' · ' + prList(S, t).length + ' سلعة تحتاج تعديلاً الآن'; } },
  herdsell: { id: 'herdsell', b: true, name: 'بيع صغار المزرعة الممتلئة', types: ['standing'], thrs: [0.8, 0.9, 1.0], pmins: [0.8, 0.9, 1.0], def: { type: 'standing', scope: '*', thr: 0.9, pmin: 0.9, mode: 'exec' },
    avail: S => ((S.order || []).some(c => farmOf(S, c) && farmCap(S, c) > 0) ? '' : 'لا مزرعة لك'),
    check(S, s) { const x = dlCheckB(S, this, s); if (x) return x; const m = dlOneOf(s.limits.thr, this.thrs, 'اختر عتبة 80 أو 90 أو 100٪') || dlOneOf(s.limits.pmin, this.pmins, 'اختر حد سعر 80 أو 90 أو 100٪'); if (m) return NO(m); if (s.scope !== '*' && !farmOf(S, s.scope)) return NO('لا مزرعة لك في هذه المدينة'); return OK(''); },
    norm: s => ({ thr: +s.limits.thr, pmin: +s.limits.pmin }), plan: hsPlan, run: hsRunB,
    desc: (S, t) => 'عند امتلاء ' + dlPct(t.limits.thr) + ' · حد السعر ' + dlPct(t.limits.pmin),
    fields(S, d) { const K = this, cities = dlCities(S, c => farmOf(S, c) && farmCap(S, c) > 0), ld = t => hsFarms(S, t).map(c => S.cities[c].name + ' ' + dlPct(hsLoad(S, c))).join('، ') || 'لا مزرعة';
      return [dlScopeField(S, K, d, cities, t => 'حمولة ' + ld(t)),
        { k: 'thr', title: 'متى يبيع؟', opts: K.thrs.map(x => ({ v: x, label: 'عند امتلاء ' + dlPct(x), effect: hsPicks(S, dlTmp(K, Object.assign({}, d, { thr: x })), false).n + ' رأساً من الصغار يُباع الآن' })) },
        { k: 'pmin', title: 'أدنى سعر مقابل المعتاد', opts: K.pmins.map(x => ({ v: x, label: 'لا يبيع تحت ' + dlPct(x), effect: hsPicks(S, dlTmp(K, Object.assign({}, d, { pmin: x })), false).n + ' رأساً يُباع الآن' })) },
        dlModeField(S, ['يبيع ويخبرك', 'يبيع', 'يبيع'])]; },
    sum(S, d) { const t = dlTmp(this, d), p = hsPicks(S, t, false); return 'بيع الصغار فقط حين تبلغ المزرعة ' + dlPct(d.thr) + ' حتى ' + dlPct(d.thr - 0.1) + '، بسعر لا يقل عن ' + dlPct(d.pmin) + ' من المعتاد، وحتى ' + DELEG.herdDay + ' رأساً يومياً · الآن ' + p.n + ' رأساً'; } },
  guard: { id: 'guard', b: true, name: 'حراسة القوافل', types: ['standing'], win: true, lvs: [1, 2], gmaxs: [2, 4, 8], pcts: [2, 5, 10], def: { type: 'standing', scope: '*', lv: 2, gmax: 4, pct: 5, mode: 'exec' },
    avail: S => lessonLock(S, 'guards') || ((S.player.caravans || []).some(c => c.captain && !c.main) ? '' : 'لا قافلة بقائد'),
    check(S, s) { const x = dlCheckB(S, this, s); if (x) return x; const m = dlOneOf(s.limits.lv, this.lvs, 'اختر مستوى الخطر') || dlOneOf(s.limits.gmax, this.gmaxs, 'اختر 2 أو 4 أو 8 حرّاس') || dlOneOf(s.limits.pct, this.pcts, 'اختر ميزانية 2 أو 5 أو 10٪ من الرصيد'); return m ? NO(m) : OK(''); },
    norm: s => ({ lv: +s.limits.lv, gmax: +s.limits.gmax, pct: +s.limits.pct }), plan: gdPlan, run: gdRun,
    desc: (S, t) => 'خطر ' + (t.limits.lv === 2 ? 'مرتفع' : 'متوسط فأعلى') + ' · حتى ' + t.limits.gmax + ' حرّاس · ميزانية ' + t.limits.pct + '٪ من رصيدك',
    fields(S, d) { const K = this, cities = dlCities(S, c => (S.player.caravans || []).some(car => car.captain && !car.main && car.city === c)), risky = t => gdCars(S, t).filter(car => gdNeed(S, t, car)).length;
      return [dlScopeField(S, K, d, cities, t => risky(t) + ' قافلة واقفة على طريق خطر الآن'),
        { k: 'lv', title: 'أي خطر؟', opts: [{ v: 2, label: 'المرتفع فقط' }, { v: 1, label: 'المتوسط فأعلى' }].map(o => Object.assign(o, { effect: risky(dlTmp(K, Object.assign({}, d, { lv: o.v }))) + ' قوافل واقفة على طريق خطر الآن' })) },
        { k: 'gmax', title: 'حتى كم حارساً للقافلة؟', opts: K.gmaxs.map(g => ({ v: g, label: g + ' حرّاس', effect: 'توظيف ' + fmtN(WAGE.guardHire) + ' ريال للحارس مرة واحدة' })) },
        { k: 'pct', title: 'ميزانية الشهر', opts: K.pcts.map(p => ({ v: p, label: p + '٪ من رصيدك', effect: 'حتى ' + fmtN(S.player.gold * p / 100) + ' ريال شهرياً' })) },
        dlModeField(S, ['يوظّف ويخبرك', 'يوظّف', 'يوظّف'])]; },
    sum(S, d) { const t = dlTmp(this, d), w = staffWage(S, 'guard'), n = gdCars(S, t).filter(car => gdNeed(S, t, car)).length; return 'حرّاس لـ' + n + ' قافلة واقفة على طريق خطر الآن، حتى ' + d.gmax + ' للقافلة بـ' + fmtN(WAGE.guardHire) + ' للحارس · ميزانية الشهر ' + d.pct + '٪ من رصيدك = ' + fmtN(S.player.gold * d.pct / 100) + ' ريال · وأجر الحارس اليومي ' + dlNum(w.day) + ' في السفر و' + dlNum(w.idle) + ' واقفاً عليك كالمعتاد'; } },
  imports: { id: 'imports', b: true, name: 'قبول دفعات الاستيراد', types: ['standing'], win: true, qs: [0.85, 0.9, 0.95], pcts: [5, 10, 20], def: { type: 'standing', scope: '*', q: 0.9, pct: 10, mode: 'exec' },
    avail: S => ((S.player.agr || []).some(ag => ag.kind === 'import' || ag.kind === 'raw') ? '' : 'لا عقد استيراد قائم'),
    check(S, s) { const x = dlCheckB(S, this, s); if (x) return x; const m = dlOneOf(s.limits.q, this.qs, 'اختر حد الكلفة 85 أو 90 أو 95٪') || dlOneOf(s.limits.pct, this.pcts, 'اختر ميزانية 5 أو 10 أو 20٪ من الرصيد'); return m ? NO(m) : OK(''); },
    norm: s => ({ q: +s.limits.q, pct: +s.limits.pct }), plan: imPlan, run: imRun, pre: imPre,
    desc: (S, t) => 'كلفة ≤ ' + dlPct(t.limits.q) + ' من سعر سوقك · ميزانية ' + t.limits.pct + '٪ من رصيدك',
    fields(S, d) { const K = this, cities = dlCities(S, c => (S.player.agr || []).some(ag => (ag.kind === 'import' || ag.kind === 'raw') && ag.city === c)), okN = t => imEval(S, t, true).filter(x => x.ok).length;
      return [dlScopeField(S, K, d, cities, t => okN(t) + ' دفعة معروضة تحقق حدّك الآن'),
        { k: 'q', title: 'أقصى كلفة للوحدة', opts: K.qs.map(q => ({ v: q, label: dlPct(q) + ' من سعر سوقك', effect: okN(dlTmp(K, Object.assign({}, d, { q }))) + ' دفعة تحقق الحد الآن' })) },
        { k: 'pct', title: 'ميزانية الشهر', opts: K.pcts.map(p => ({ v: p, label: p + '٪ من رصيدك', effect: 'حتى ' + fmtN(S.player.gold * p / 100) + ' ريال شهرياً' })) },
        dlModeField(S, ['يقبل ويخبرك', 'يقبل', 'يقبل'])]; },
    sum(S, d) { const t = dlTmp(this, d), L = imEval(S, t, true); return 'يقبل الدفعة إن كانت كلفة وحدتها ≤ ' + dlPct(d.q) + ' من سعرها في سوقك، ولا يرفض أبداً · الآن ' + L.filter(x => x.ok).length + ' من ' + L.length + ' دفعة معروضة · ميزانية الشهر ' + d.pct + '٪ من رصيدك = ' + fmtN(S.player.gold * d.pct / 100) + ' ريال'; } },
  agrwatch: { id: 'agrwatch', b: true, name: 'إنذار الشرط الجزائي', types: ['report'], every: 1, def: { type: 'report', scope: '*', mode: 'exec' },
    avail: S => ((S.player.agr || []).some(ag => ag.kind === 'export') ? '' : 'لا عقد تصدير قائم'),
    check(S, s) { const x = dlCheckB(S, this, s); return x || OK(''); }, norm: () => ({}), run: awRun, plan: () => ({ n: 1, cost: 0, text: 'أراقب عقود التصدير' }), fields: () => [],
    desc: () => 'يومياً قبل التسوية بسبعة أيام',
    sum(S) { const L = awList(S), n = L.filter(x => x.short > 0).length; return 'ينذرك قبل تسوية عقد التصدير بسبعة أيام إن كان فيه ناقص، بالضرر الفعلي المتوقع · الآن ' + n + ' من ' + L.length + ' عقد تصدير فيه ناقص · لا يشغل خانة'; } },
  part: { id: 'part', b: true, name: 'تصفية الشراكة الخاسرة', types: ['standing'], losses: [0.1, 0.2, 0.3], def: { type: 'standing', scope: '*', loss: 0.2, mode: 'exec' },
    avail: S => ((S.player.agr || []).some(ag => ag.kind === 'part') ? '' : 'لا شراكة مصنع قائمة'),
    check(S, s) { const x = dlCheckB(S, this, s); if (x) return x; const m = dlOneOf(s.limits.loss, this.losses, 'اختر حد الخسارة 10 أو 20 أو 30٪'); return m ? NO(m) : OK(''); },
    norm: s => ({ loss: +s.limits.loss }), plan: ptPlan, run: ptRun, pre: ptPre,
    desc: (S, t) => 'عند خسارة ' + dlPct(t.limits.loss) + ' من رأس المال',
    fields(S, d) { const K = this, cities = dlCities(S, c => (S.player.agr || []).some(ag => ag.kind === 'part' && ag.city === c));
      return [dlScopeField(S, K, d, cities, t => ptList(S, t).length + ' شراكة تحت الحد الآن'),
        { k: 'loss', title: 'متى يصفّي؟', opts: K.losses.map(l => ({ v: l, label: 'خسارة ' + dlPct(l), effect: ptList(S, dlTmp(K, Object.assign({}, d, { loss: l }))).length + ' شراكة تحت الحد الآن' })) },
        dlModeField(S, ['يصفّي ويخبرك', 'يصفّي', 'يصفّي'])]; },
    sum(S, d) { const L = ptList(S, dlTmp(this, d)); return 'يشتري حصة الزعيم حين تخسر الشراكة ' + dlPct(d.loss) + ' من رأس مالها، بقدر حصته (لا يمدّها ولا يفسخ غيرها) · الآن ' + L.length + ' شراكة بنحو ' + fmtN(L.reduce((s, ag) => s + partOwed(ag), 0)) + ' ريال'; } },
  donate: { id: 'donate', b: true, name: 'التبرع الشهري لصندوق السوق', types: ['standing'], pcts: [1, 2, 5], mxs: [500, 2000, 10000], def: { type: 'standing', scope: '', pct: 2, mx: 2000, dim: null, mode: 'exec' },
    avail: S => (!mfOn(S) ? 'صندوق السوق غير مفعّل' : dnCities(S).length ? '' : 'لا مدينة لك فيها أملاك'),
    check(S, s) { const x = dlCheckB(S, this, s); if (x) return x; if (s.scope === '*' || !S.cities[s.scope]) return NO('اختر مدينة واحدة'); const m = dlOneOf(s.limits.pct, this.pcts, 'اختر 1 أو 2 أو 5٪') || dlOneOf(s.limits.mx, this.mxs, 'اختر سقف 500 أو 2000 أو 10000'); if (m) return NO(m); if (s.limits.dim != null && !PR_KEYS.includes(s.limits.dim)) return NO('بُعد غير معروف.'); return OK(''); },
    norm: s => ({ pct: +s.limits.pct, mx: +s.limits.mx, dim: PR_KEYS.includes(s.limits.dim) ? s.limits.dim : null }), plan: dnPlan, run: dnRun,
    desc: (S, t) => t.limits.pct + '٪ من صافي الدفتر · حتى ' + fmtN(t.limits.mx) + (t.limits.dim ? ' · لغرض ' + PR_NAMES[t.limits.dim] : ''),
    fields(S, d) { const K = this, cities = dnCities(S), amtOf = o => { const t = dlTmp(K, Object.assign({}, d, o)); return t.scope && t.scope !== '*' ? dnCalc(S, t) : null; }, eff = o => { const x = amtOf(o); return !x ? '' : x.L.since !== 'days' ? 'لا دفتر شهر بعد' : x.ok ? 'نحو ' + fmtN(x.amt) + ' ريال شهرياً' : 'لا تبرع الآن (الصافي أو الاحتياطي لا يكفي)'; };
      return [dlScopeField(S, K, d, cities, t => { const f = (S.cities[t.scope] || {}).fund; return 'رصيد صندوقها ' + fmtN(f ? f.bal : 0); }, true),
        { k: 'pct', title: 'من صافي دفترك الشهري', opts: K.pcts.map(p => ({ v: p, label: p + '٪', effect: eff({ pct: p }) })) },
        { k: 'mx', title: 'سقف التبرع', opts: K.mxs.map(m => ({ v: m, label: 'حتى ' + fmtN(m), effect: eff({ mx: m }) })) },
        { k: 'dim', title: 'لأي غرض؟', opts: [{ v: null, label: 'توزيع الزعيم المعتاد', effect: 'ينفقه الصندوق على كل الأبعاد' }].concat(PR_KEYS.map(k => ({ v: k, label: PR_NAMES[k], effect: 'يُنفَق أولاً على ' + PR_NAMES[k] }))) },
        dlModeField(S, ['يتبرع ويخبرك', 'يتبرع', 'يتبرع'])]; },
    sum(S, d) { if (!d.scope || d.scope === '*' || !S.cities[d.scope]) return 'اختر مدينة واحدة لصندوقها'; const t = dlTmp(this, d), x = dnCalc(S, t);
      return 'كل 30 يوماً ' + d.pct + '٪ من صافي دفترك حتى ' + fmtN(d.mx) + ' لصندوق ' + dlCityName(S, d.scope) + ': ' + (x.L.since !== 'days' ? 'لا دفتر شهر بعد' : x.ok ? 'نحو ' + fmtN(x.amt) + ' ريال' + (x.tr > 0 ? ' وثقة ' + x.bs.name + ' +' + dlNum(x.tr) : '') : 'لا تبرع الآن (الصافي أو الاحتياطي لا يكفي)') + ' · لا يمسّ احتياطي التشغيل ' + fmtN(operatingReserve(S)); } },
});
/* «ماذا أفوّض؟»: حتى ثلاثة اقتراحات بالترتيب (مزرعة ممتلئة، قافلة على طريق خطر، دفعة رابحة، عقد تصدير ناقص)، ولا يُقترح ما فُوِّض أصلاً */
function dlSuggestB(S) {
  if (!DELEG.b) return []; const D = delegOf(S), has = k => ((D && D.tasks) || []).some(t => t.kind === k), out = [], K = DELEG_KINDS;
  const mk = (k, line) => out.push({ line, spec: { kind: k, type: K[k].def.type, scope: K[k].def.scope, mode: 'exec', limits: K[k].norm({ limits: dlLimOf(K[k].def) }) } });
  if (!has('herdsell')) { const c = (S.order || []).find(c => farmOf(S, c) && farmCap(S, c) > 0 && hsLoad(S, c) >= 0.9); if (c) mk('herdsell', 'مزرعة ' + S.cities[c].name + ' ممتلئة ' + dlPct(hsLoad(S, c)) + ': بيع الصغار حتى 80٪'); }
  if (!has('guard') && !lessonLock(S, 'guards')) { const t = dlTmp(K.guard, Object.assign({}, K.guard.def, { lv: 2 })), n = gdCars(S, t).filter(car => gdNeed(S, t, car)).length; if (n) mk('guard', n + ' قافلة واقفة قبل طريق خطره مرتفع: حراسة بميزانية 5٪'); }
  if (!has('imports')) { const t = dlTmp(K.imports, Object.assign({}, K.imports.def, { q: 0.9 })), L = imEval(S, t, true).filter(x => x.uc <= 0.9 * x.hp); if (L.length) mk('imports', L.length + ' دفعة معروضة كلفتها ≤ 90٪ من سعر سوقك: قبولها بنحو ' + fmtN(L.reduce((s, x) => s + x.est, 0)) + ' ريال'); }
  if (!has('agrwatch')) { const n = awList(S).filter(x => x.short > 0).length; if (n) mk('agrwatch', n + ' عقد تصدير فيه ناقص: إنذار قبل الشرط الجزائي (لا يشغل خانة)'); }
  return out.slice(0, 3);
}
