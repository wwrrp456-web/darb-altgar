/* 035ج2 كفاءة مدير المصنع القديم: السعة والأمانة بالدرجة، وتوقّع نفاد المواد (3 أيام للدرجة 3، 7 للرابعة فأعلى) ببطاقة ask، وشراء المواد للدرجة 5 بميزانية اللاعب.
   MGRX.on=false = السلوك السابق حرفاً: لا m.x ولا حقل جديد في الحفظ. لا ينقص سعة أي مدير قائم (درجته لا تنزل عن معادل مستواه المشترى: 1/3/4 ← 3/6/10).
   الكفاءة لا ترفع السقف المالي: الشراء بيد اللاعب (بطاقة ask) أو بوضع exec اختاره ضمن ميزانية أسبوعية يضعها، وقرار حتمي لا حظ فيه. */
const MGRX = { on: true, cap: [3, 4, 6, 10, 12], theft: [1, 0.8, 0.6, 0.3, 0.1], warn: [0, 0, 3, 7, 7], win: 7, buyDays: 10, ttl: 14, again: 1, ignore: 14, budgets: [0, 2000, 5000, 10000], modes: ['ask', 'exec'], logMax: 12, maxCards: 3 };
const mgrxGrade = m => Math.max(1, Math.min(5, Math.max(skMgrG(m), skLegacyG(m))));
const mgrCap = m => (MGRX.on ? MGRX.cap[mgrxGrade(m) - 1] : MGR[m.lv].cap);
const mgrTheftMul = m => (MGRX.on ? MGRX.theft[mgrxGrade(m) - 1] : 1);
const mgrxIsOld = m => !!m && m.rank !== 2 && m.rank !== 3;
function mgrxOf(m) { if (!m.x) m.x = { use: {}, cards: [], snooze: {}, log: [], mode: 'ask', budget: 0, sp: { d: 0, n: 0 }, nid: 1 }; return m.x; }
const mgrxPush = (arr, o, max) => { arr.unshift(o); if (arr.length > max) arr.length = max; };
/* استهلاك المواد الخام الفعلي (يسجَّل عند الصنع لا من الوصفة): يوم → كمية */
function mgrxUse(S, pr, g, amt) {
  const m = pr && pr.mgr; if (!MGRX.on || !mgrxIsOld(m) || mgrxGrade(m) < 3 || !(amt > 0)) return;
  const u = mgrxOf(m).use, o = u[g] || (u[g] = {}); o[S.day] = (o[S.day] || 0) + amt;
}
function mgrxRate(S, x, g) {
  const o = x.use[g]; if (!o) return 0; let t = 0;
  for (const d of Object.keys(o)) { if (S.day - d >= MGRX.win) delete o[d]; else t += o[d]; }
  return t / MGRX.win;
}
function mgrxInputs(S, city) { const s = new Set(); for (const f of S.player.factories) if (f.city === city && isAbroad(f)) for (const g in RECIPES[f.recipe].inp) s.add(g); return Array.from(s); }
function mgrxCheapest(S, city, g) { // أرخص سوق يعرفها اللاعب (أسعار آخر زيارة) مقابل سوق المدينة
  const here = unitPrice(S.cities[city], g); let best = { id: city, name: S.cities[city].name, p: here };
  for (const id of Object.keys(S.player.known || {})) { const k = S.player.known[id], p = k && k.p && k.p[g]; if (id !== city && S.cities[id] && p > 0 && p < best.p) best = { id, name: S.cities[id].name, p, age: Math.max(0, S.day - (k.day || 0)) }; }
  return best;
}
function mgrxBuy(S, city, pr, g, qty, byUser) {
  const m = pr.mgr, c = S.cities[city], x = m && m.x; if (!x || !c || !(qty >= 1)) return NO('لا شراء الآن');
  const c0 = S.ctxCur; ctxFor(S, city); const D = diwanOf(S), rule = D && D.rules && D.rules.herd, need = unitPrice(c, g) * qty * 1.05, g0 = S.player.gold; let amt = 0;
  if (!byUser) { // التنفيذ التلقائي: ضمن الميزانية الأسبوعية وضمن إعدادات مصانعك (حد الرصيد وأعلى سعر للمواد) لا فوقها
    if (S.day - x.sp.d >= 7) { x.sp.d = S.day; x.sp.n = 0; } if (x.sp.n + need > x.budget + 1e-9) { S.ctxCur = c0; return NO('فوق الميزانية الأسبوعية'); }
    const fs = S.player.factories.filter(f => f.city === city && isAbroad(f) && RECIPES[f.recipe].inp[g] != null), minBal = Math.max(0, ...fs.map(f => (f.set && f.set.minBal) || 0)), maxBuy = Math.min(1.3, ...fs.map(f => (f.set && f.set.maxBuy) || 1.3));
    const canBox = g0 < need && rule && rule.mode !== 'mine' && (rule.max || 0) > 0 && need <= rule.max && S.ctxCur === 'sar' && D.box + 1e-9 >= need - g0; // التمويل من الخزينة بقاعدتها لا يخضع لحد رصيد المحفظة
    if (ratio(c, g) > maxBuy || (!canBox && g0 - need < minBal)) { S.ctxCur = c0; return NO('خارج إعداداتك: السعر فوق حدّك أو الرصيد دون حدّه'); }
  }
  if (g0 < need && rule && rule.mode !== 'mine' && (rule.max || 0) > 0 && need <= rule.max && S.ctxCur === 'sar' && D.box + 1e-9 >= need - g0) { amt = need - g0; D.box -= amt; S.player.wallet.sar += amt; }

  pr.basis = pr.basis || {}; const r = buyUnits(S, S.player, c, g, qty, storeRoom(S, city), pr.store, true, true);
  const fromBox = Math.min(amt, Math.max(0, r.cost - g0)), refund = amt - fromBox; if (refund > 0) { D.box += refund; S.player.wallet.sar -= refund; }
  if (!r.n) { S.ctxCur = c0; return NO('تعذّر الشراء: لا مخزون أو لا مكان'); }
  addBasis(pr.basis, g, r.n, r.cost); if (!byUser) x.sp.n += r.cost;
  if (fromBox > 0) diwanLog(S, D, 'herd', city, 'اشترى مدير ' + c.name + ' ' + r.n + ' ' + GD[g].name + ' بتمويل من الخزينة', fromBox);
  mgrxPush(x.log, { d: S.day, t: 'اشتريتُ ' + r.n + ' ' + GD[g].name + ' من ' + c.name + (byUser ? ' بطلبك' : ' ضمن ميزانيتك'), amt: -Math.round(r.cost) }, MGRX.logMax);
  S.ctxCur = c0; return Object.assign(OK('اشتُري ' + r.n + ' ' + GD[g].name + ' بـ' + Math.round(r.cost) + ' ريال'), { n: r.n, cost: r.cost, fromBox });
}
function mgrxDay(S, city, pr) {
  const m = pr.mgr, gr = m && mgrxGrade(m); if (!MGRX.on || !mgrxIsOld(m) || gr < 3 || !mgrOk(S, city, pr, null)) return;
  const x = mgrxOf(m), warn = MGRX.warn[gr - 1], c = S.cities[city];
  x.cards = x.cards.filter(k => S.day - k.day < MGRX.ttl && (pr.store[k.g] || 0) < k.rate * (warn + 1)); // انحلّت بالشراء أو بالمهلة
  for (const g of mgrxInputs(S, city)) {
    const rate = mgrxRate(S, x, g); if (!(rate > 0)) continue; const stock = pr.store[g] || 0, days = stock / rate;
    if (days > warn + 1e-9 || (x.snooze[g] || 0) > S.day || x.cards.some(k => k.g === g) || x.cards.length >= MGRX.maxCards) continue;
    const qty = Math.max(1, Math.ceil(rate * MGRX.buyDays - stock)), est = Math.round(unitPrice(c, g) * qty * 1.05);
    if (gr >= 5 && x.mode === 'exec' && x.budget > 0) { const r = mgrxBuy(S, city, pr, g, qty, false); if (r.ok) { news(S, 'مدير ' + c.name + ' اشترى ' + r.n + ' ' + GD[g].name + ' قبل نفادها ضمن ميزانيتك.'); continue; } }
    x.cards.push({ id: 'mx' + city + ':' + (x.nid++), type: 'short', city, g, day: S.day, days: Math.round(days * 10) / 10, rate: Math.round(rate * 100) / 100, stock: Math.round(stock * 10) / 10, qty, est, cheap: gr >= 4 ? mgrxCheapest(S, city, g) : null });
  }
}
function mgrXAct(S, city, id, opt) {
  const pr = S.player.props[city], m = pr && pr.mgr, x = m && m.x; if (!MGRX.on || !x) return NO('لا بطاقة قائمة');
  const i = x.cards.findIndex(k => k.id === id); if (i < 0) return NO('البطاقة لم تعد قائمة'); const k = x.cards[i];
  if (opt === 'buy') { const r = mgrxBuy(S, city, pr, k.g, k.qty, true); if (r.ok) x.cards.splice(i, 1); return r; }
  if (opt === 'tomorrow') { x.snooze[k.g] = S.day + MGRX.again; x.cards.splice(i, 1); return OK('سأذكّرك غداً'); }
  if (opt === 'ignore') { x.snooze[k.g] = S.day + MGRX.ignore; x.cards.splice(i, 1); return OK('تُرك التنبيه ' + MGRX.ignore + ' يوماً'); }
  return NO('خيار غير معروف');
}
Object.assign(A, {
  mgrXAct, farmXAct,
  mgrXRule(S, city, key, val) {
    const pr = S.player.props[city], m = pr && pr.mgr; if (!MGRX.on || !mgrxIsOld(m)) return NO('لا مدير مصنع هنا');
    if (mgrxGrade(m) < 5) return NO('الشراء بيد المدير من الدرجة الخامسة'); const x = mgrxOf(m);
    if (key === 'mode') { if (!MGRX.modes.includes(val)) return NO('اختر يسألني أو ينفّذ'); x.mode = val; return OK(val === 'exec' ? 'يشتري المواد ضمن ميزانيتك الأسبوعية ويُبلغك' : 'يسألك قبل كل شراء'); }
    if (key === 'budget') { val = +val; if (!MGRX.budgets.includes(val)) return NO('خيار غير معروف'); x.budget = val; return OK(val ? 'ميزانية الشراء الأسبوعية ' + val + ' ريال' : 'لا شراء تلقائي: الميزانية صفر'); }
    return NO('صلاحية غير معروفة');
  },
});
function mgrXMigrate(S) {
  for (const pr of Object.values(S.player.props || {})) {
    const m = pr.mgr; if (!m || m.x === undefined) continue;
    if (!MGRX.on || !mgrxIsOld(m) || !m.x || typeof m.x !== 'object' || Array.isArray(m.x)) { delete m.x; continue; }
    const x = m.x; for (const k of ['use', 'snooze']) if (!x[k] || typeof x[k] !== 'object' || Array.isArray(x[k])) x[k] = {};
    for (const k of ['cards', 'log']) if (!Array.isArray(x[k])) x[k] = [];
    x.cards = x.cards.filter(k => k && k.type === 'short' && S.cities[k.city] && GD[k.g] && Number.isFinite(k.rate) && Number.isFinite(k.qty));
    if (!MGRX.modes.includes(x.mode)) x.mode = 'ask'; if (!MGRX.budgets.includes(x.budget)) x.budget = 0;
    if (!x.sp || typeof x.sp !== 'object') x.sp = { d: 0, n: 0 }; if (!Number.isSafeInteger(x.nid) || x.nid < 1) x.nid = 1;
  }
}
function mgrXView(S) { // بطاقات التنبيه المفتوحة + حال كل مدير (لواجهة المصنع)
  if (!MGRX.on || !S || !S.player) return null; const cards = [], mgrs = [];
  for (const city of Object.keys(S.player.props || {})) {
    const pr = S.player.props[city], m = pr.mgr; if (!mgrxIsOld(m)) continue; const g = mgrxGrade(m), x = m.x;
    mgrs.push({ city, grade: g, cap: MGRX.cap[g - 1], theft: Math.round(MGR_THEFT * MGRX.theft[g - 1] * 1000) / 10, warn: MGRX.warn[g - 1], mode: x ? x.mode : 'ask', budget: x ? x.budget : 0, log: x ? x.log : [] });
    if (x) for (const k of x.cards) if (S.day - k.day < MGRX.ttl) cards.push(k);
  }
  return { cards, mgrs };
}
