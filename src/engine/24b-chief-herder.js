/* كبير الرعاة: مشرف عام لبهيمة الأنعام في دولة اللاعب. يوظَّف في كل دولة فيها مزرعة، فيرسل إلى مكتب التاجر تقارير القطعان ونصائح البيع وفرص الشراء، وللاعب أن يفوّضه بالشراء ضمن حد يضعه. أجره يومي، والقطيع نفسه يرعاه الرعاة والمزارعون كما هو. للتعلّم والمسيرة فقط. */
const CHIEF = { phase: 3, fee: 1500, wage: 25, every: 12, buyRatio: 0.9, sellRatio: 1.15, mailMax: 6, ttl: 20, lateQuit: 5, tryQty: 10 };
const chiefOf = (S, country) => ((S.player.chiefs || {})[country]) || null;
const farmCitiesIn = (S, country) => S.order.filter(id => S.cities[id].country === country && farmOf(S, id));
function chiefBuy(S, city, g, qty) {
  const f = farmOf(S, city), c = S.cities[city], pr = S.player.props[city]; if (!f || !BREED[g] || !sells(c, g)) return NO('لا تُشترى هذه هنا');
  if (!breedOpen(S, g)) return NO(GD[g].name + ' لم تُفتح بعد في مسيرتك'); ctxFor(S, city);
  const maxN = Math.floor((farmCap(S, city) - farmUnits(f)) / BREED[g].fu); qty = Math.min(Math.floor(qty), maxN); if (qty < 1) return NO('المزرعة ممتلئة');
  if (S.player.gold < unitPrice(c, g) * qty * 1.05) return NO('رصيدك لا يكفي لهذه الصفقة');
  const res = buyUnits(S, S.player, c, g, qty, qty * GD[g].w + 1e-6, f.herd, true, false, 1); if (!res.n) return NO('تعذّر الشراء (مخزون السوق أو الرصيد)');
  addBasis(pr.basis || (pr.basis = {}), g, res.n, res.cost); herdAdd(f, g, res.n);
  return Object.assign(OK('اشتريتَ ' + res.n + ' ' + GD[g].name + ' إلى مزرعة ' + c.name + ' بـ ' + Math.round(res.cost) + ' ريال'), { n: res.n, cost: res.cost });
}
function chiefScan(S, country) {
  const out = [], push = o => out.push(Object.assign({ id: S.nextId++, day: S.day, country }, o));
  for (const city of farmCitiesIn(S, country)) {
    const f = farmOf(S, city), c = S.cities[city], cap = farmCap(S, city), units = farmUnits(f), kinds = Object.keys(f.herd).filter(g => BREED[g] && f.herd[g] >= 1);
    const heads = kinds.reduce((a, g) => a + Math.floor(f.herd[g]), 0), val = Math.round(valueOf(farmHold(f)));
    push({ type: 'report', city, text: 'تقرير مزرعة ' + c.name + ': ' + (heads ? kinds.map(g => Math.floor(f.herd[g]) + ' ' + GD[g].name).join('، ') : 'لا قطيع بعد') + '؛ قيمتها نحو ' + fmtN(val) + ' ريال، وتشغل ' + Math.round(100 * units / Math.max(1, cap)) + '٪ من سعتها.' });
    if (heads && units >= cap * 0.95) push({ type: 'full', city, text: 'مزرعة ' + c.name + ' ممتلئة تقريباً: بِع بعض القطيع أو وسّع المزرعة ليستمر التكاثر.' });
    for (const g of kinds) {
      const r = ratio(c, g), n = Math.floor(f.herd[g] * 0.3); if (r >= CHIEF.sellRatio && n >= 1) push({ type: 'sell', city, g, qty: n, text: 'سعر ' + GD[g].name + ' في ' + c.name + ' مرتفع الآن (' + Math.round((r - 1) * 100) + '٪ فوق المعتاد). أنصحك ببيع ' + n + ' منها.', est: Math.round(unitPrice(c, g) * n * 0.9) });
    }
    const room = farmCap(S, city) - units; let best = null;
    for (const g of GIDS) { if (!BREED[g] || !sells(c, g) || !breedOpen(S, g)) continue; const r = ratio(c, g), n = Math.min(CHIEF.tryQty, Math.floor(room / BREED[g].fu)); if (r <= CHIEF.buyRatio && n >= 3 && (!best || r < best.r)) best = { g, r, n }; }
    if (best) push({ type: 'buy', city, g: best.g, qty: best.n, text: 'فرصة في ' + c.name + ': ' + GD[best.g].name + ' أرخص من المعتاد بنحو ' + Math.round((1 - best.r) * 100) + '٪. أنصحك بشراء ' + best.n + ' للمزرعة.', est: Math.round(unitPrice(c, best.g) * best.n * 1.05) });
  }
  return out;
}
function chiefDay(S) {
  const P = S.player; if (!P.chiefs) return;
  for (const country of Object.keys(P.chiefs)) {
    const ch = P.chiefs[country];
    if (!farmCitiesIn(S, country).length) { delete P.chiefs[country]; news(S, 'سرّح كبير الرعاة نفسه لأنه لم تبقَ لك مزرعة في ' + (CD[country] ? CD[country].name : 'هذه الدولة') + '.', ''); continue; }
    if (P.gold < CHIEF.wage) { ch.late = (ch.late || 0) + 1; if (ch.late >= CHIEF.lateQuit) { delete P.chiefs[country]; news(S, 'ترك كبير الرعاة عمله لتأخر أجره.', 'bad'); } continue; }
    ch.late = 0; { const c0 = S.ctxCur; ctxFor(S, S.order.find(id => S.cities[id].country === country)); pPay(S, 'chiefHerder', CHIEF.wage, true); S.ctxCur = c0; } ch.paid = (ch.paid || 0) + CHIEF.wage;
    ch.mail = (ch.mail || []).filter(m => S.day - m.day <= CHIEF.ttl);
    if (S.day < ch.next) continue; ch.next = S.day + CHIEF.every;
    for (const m of chiefScan(S, country)) {
      if (m.type === 'report') ch.mail = ch.mail.filter(x => !(x.type === 'report' && x.city === m.city));
      if (m.type === 'buy' && ch.buy && m.est <= (ch.budget || 0) && P.gold >= m.est * 1.2) { const r = chiefBuy(S, m.city, m.g, m.qty); if (r.ok) { news(S, 'كبير الرعاة اشترى بتفويضك: ' + r.msg, 'good'); continue; } }
      ch.mail.unshift(m);
    }
    const pri = { buy: 0, sell: 1, full: 2, report: 3 }; ch.mail.sort((a, b) => pri[a.type] - pri[b.type] || b.day - a.day); ch.mail.length = Math.min(ch.mail.length, CHIEF.mailMax);
  }
}
Object.assign(A, {
  hireChief(S, country) {
    if (S.phase < CHIEF.phase) return NO('يُفتح في الطور ' + CHIEF.phase); if (!CD[country]) return NO('دولة غير معروفة');
    if (chiefOf(S, country)) return NO('عندك كبير رعاة في ' + CD[country].name); if (!farmCitiesIn(S, country).length) return NO('ابنِ مزرعة في ' + CD[country].name + ' أولاً');
    if (S.player.gold < CHIEF.fee) return NO('تحتاج ' + CHIEF.fee + ' ريال'); pPay(S, 'hiring', CHIEF.fee, true);
    (S.player.chiefs = S.player.chiefs || {})[country] = { since: S.day, next: S.day + 2, buy: false, budget: 0, mail: [], late: 0, paid: 0 };
    return OK('وظّفتَ كبير رعاة في ' + CD[country].name + ' بأجر ' + CHIEF.wage + ' ريال يومياً؛ ستصلك تقاريره ونصائحه في مكتب التاجر.');
  },
  fireChief(S, country) { if (!chiefOf(S, country)) return NO('لا كبير رعاة هنا'); delete S.player.chiefs[country]; return OK('سرّحتَ كبير الرعاة'); },
  chiefPolicy(S, country, buy, budget) {
    const ch = chiefOf(S, country); if (!ch) return NO('لا كبير رعاة هنا'); budget = Math.max(0, Math.min(1e7, Math.round(+budget || 0)));
    ch.buy = !!buy && budget > 0; ch.budget = ch.buy ? budget : 0;
    return OK(ch.buy ? 'فوّضتَه بالشراء حتى ' + fmtN(budget) + ' ريال للصفقة الواحدة' : 'أوقفتَ تفويض الشراء؛ سيعرض الفرص عليك فقط');
  },
  chiefAct(S, id) {
    for (const country of Object.keys(S.player.chiefs || {})) {
      const ch = S.player.chiefs[country], i = (ch.mail || []).findIndex(m => m.id === id); if (i < 0) continue; const m = ch.mail[i]; let r;
      if (m.type === 'sell') r = A.farmSell(S, m.city, m.g, m.qty); else if (m.type === 'buy') r = chiefBuy(S, m.city, m.g, m.qty); else r = OK('تم');
      if (r.ok !== false) ch.mail.splice(i, 1); return r;
    }
    return NO('الرسالة لم تعد قائمة');
  },
  chiefSkip(S, id) { for (const country of Object.keys(S.player.chiefs || {})) { const ch = S.player.chiefs[country]; ch.mail = (ch.mail || []).filter(m => m.id !== id); } return OK('تم'); },
});
