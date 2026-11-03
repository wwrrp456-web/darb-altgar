/* هيكل الإدارة (023): عرض وروابط فقط. يجمع من الدوال القائمة (teamAssets، promotionQuote، stewardQuote، agentHireQuote، wkWage...)
   ولا يضيف شرطاً ولا أجراً ولا يغيّر الاقتصاد. MGMT.on=false يخفي الشاشة. */
const MGMT = { on: true };
const MGMT_RANKS = ['عامل', 'مدير ممتلك', 'أمين المنطقة', 'وكيل الإقليم'];
function mgmtNext(S, id, assets, rows) {
  const pr = S.player.props[id], m = pr.mgr;
  if (!m) {
    const w = (pr.staff || []).slice().sort((a, b) => b.days - a.days || a.id - b.id)[0], a = assets[0];
    if (!w || !a) return { to: 2, name: MGMT_RANKS[1], ok: false, reasons: [!w ? 'وظّف عاملاً أولاً ثم رقِّه بعد خدمته.' : 'لا ممتلك في هذه المنطقة.'], action: null };
    const q = promotionQuote(S, id, w.id, a.kind, a.id);
    return { to: 2, name: MGMT_RANKS[1], ok: q.ok, reasons: q.reasons || [q.msg], action: q.ok ? { act: 'team-promote', c: id, worker: w.id, kind: a.kind, id: a.id, label: 'رقِّ العامل إلى مدير ' + a.label } : null };
  }
  if (m.rank === 2) { const q = stewardQuote(S, id); return { to: 3, name: MGMT_RANKS[2], ok: q.ok, reasons: q.reasons || [q.msg], action: q.ok ? { act: 'steward-promote', c: id, label: 'رقِّ المدير إلى أمين المنطقة' } : null }; }
  return null;
}
function mgmtCity(S, id) {
  const pr = S.player.props[id], c = S.cities[id]; if (!pr || !c) return null;
  const assets = teamAssets(S, id), m = pr.mgr || null;
  const rows = assets.map(a => ({ kind: a.kind, id: a.id, label: a.label, by: m && m.rank === 3 && stewardCovers(S, id, a) ? 'steward' : m && m.rank === 2 && m.asset && m.asset.kind === a.kind && m.asset.id === a.id ? 'manager' : null }));
  const staff = staffOf(S, id), pts = sellerPts(S, id), sNeed = sellerNeed(S, id), kNeed = keeperNeed(S, id), fNeed = farmerNeed(S, id);
  const farmers = staff.filter(w => w.role === 'farmer').length, keepers = staff.filter(w => w.role === 'keeper').length, sellers = staff.filter(w => w.role === 'seller').length;
  const workers = { seller: { n: sellers, pts, need: sNeed, missing: Math.max(0, Math.ceil(sNeed - pts - 1e-9)) }, keeper: { n: keepers, need: kNeed, missing: Math.max(0, kNeed - keeperHave(S, id)) }, farmer: { n: farmers, need: fNeed, missing: Math.max(0, fNeed - farmers) } };
  const workerWages = staff.reduce((n, w) => n + wkWage(S, c, w), 0), mgrWage = m ? managerWage(m) : 0, bossWage = pr.farmBoss ? pr.farmBoss.wage : 0;
  const next = mgmtNext(S, id, assets, rows), alerts = [];
  for (const r of rows.filter(r => !r.by)) { const act = next && next.ok && next.action && next.action.act === 'team-promote' && next.action.kind === r.kind && next.action.id === r.id ? next.action : null; alerts.push({ k: 'uncovered', city: id, text: 'ممتلك بلا مدير: ' + r.label, action: act, go: act ? null : 'estcity' }); }
  if (m && m.rank === 3 && assets.length > stewardSpan(m)) { const up = stewardSpanQuote(S, id, 1); alerts.push({ k: 'span', city: id, text: 'أمين فوق نطاقه: يدير ' + stewardSpan(m) + ' من ' + assets.length + ' ممتلكات.', action: up.ok ? { act: 'steward-span', c: id, dir: 1, label: 'وسّع نطاقه' } : null, go: up.ok ? null : 'estcity' }); }
  if (pr.farm && workers.farmer.missing > 0) alerts.push({ k: 'farmers', city: id, text: 'مزرعة ينقصها ' + workers.farmer.missing + ' مزارع.', action: hirePool(S, id) > 0 ? { act: 'mg-hire', c: id, g: 'farmer', label: 'وظّف مزارعاً' } : null, go: hirePool(S, id) > 0 ? null : 'estcity' });
  return { id, name: c.name, country: c.country, rank: m ? m.rank : 0, rankName: m ? MGMT_RANKS[m.rank - 1] : 'بلا مدير', mgrWage, manager: m ? { rank: m.rank, wage: mgrWage, label: m.rank === 2 && m.asset ? (rows.find(r => r.kind === m.asset.kind && r.id === m.asset.id) || {}).label || '' : '', span: m.rank === 3 ? stewardSpan(m) : 0 } : null, assets: rows, covered: rows.filter(r => r.by).length, workers, workerWages, bossWage, wages: workerWages + mgrWage + bossWage, next, alerts };
}
function mgmtView(S) {
  if (!MGMT.on || !S || !S.player) return null;
  const out = { countries: [], wages: 0, alerts: 0, assets: 0, covered: 0 };
  for (const country of Object.keys(CD)) {
    const cities = S.order.filter(id => S.cities[id].country === country && S.player.props[id] && teamAssets(S, id).length + (S.player.props[id].staff || []).length > 0).map(id => mgmtCity(S, id)).filter(Boolean);
    const ra = agentOf(S, country), quote = !ra && stewardCitiesIn(S, country).length ? agentHireQuote(S, country) : null;
    if (!cities.length && !ra) continue;
    const agentWageNow = ra ? agentWage(S, country) : 0, wages = cities.reduce((n, c) => n + c.wages, 0) + agentWageNow;
    out.countries.push({ country, name: CD[country].name, flag: CD[country].flag, agent: ra ? { wage: agentWageNow, since: ra.since } : null, next: quote ? { to: 4, name: MGMT_RANKS[3], ok: quote.ok, reasons: quote.reasons, action: quote.ok ? { act: 'agenthire', i: country, label: 'وظّف وكيل إقليم' } : null } : null, cities, wages });
    out.wages += wages; out.alerts += cities.reduce((n, c) => n + c.alerts.length, 0); out.assets += cities.reduce((n, c) => n + c.assets.length, 0); out.covered += cities.reduce((n, c) => n + c.covered, 0);
  }
  return out;
}
