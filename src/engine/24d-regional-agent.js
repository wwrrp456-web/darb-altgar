/* وكيل الإقليم (الرتبة 4): يشرف على أمناء مناطقك في الدولة الواحدة. تقرير أسبوعي موحّد إلى مكتب التاجر، وحدّ يومي واحد للدولة يوزّعه على الأمناء بحسب حاجة كل منطقة، وإنذار مبكر بالمنطقة الخاسرة وغضب زعيم السوق، وتعبئة محفظة الدولار لأجور الدول الأجنبية. لا يبيع أصلاً ولا يشتري أصلاً. */
const RA = { phase: 4, minStewards: 2, span: 3, fee: 3000, wageMul: 2, every: 7, lateQuit: 5, probation: 90, probationShare: 0.5, negWeeks: 3, mailMax: 5, trustWarn: -30, trustGap: 20 };
const agentOf = (S, country) => ((S.player.regAgents || {})[country]) || null;
const stewardCitiesIn = (S, country) => S.order.filter(id => S.cities[id].country === country && stewardOf(S, id));
const agentWage = (S, country) => { const ws = stewardCitiesIn(S, country).map(id => managerWage(stewardOf(S, id))); return Math.round(RA.wageMul * Math.max(MGR[2].wage, ...ws, 0) * 100) / 100; };
function agentNeed(S, city) { const q = regionalOfficeQuote(S, city); return q && q.ok ? q.wages + q.rent + q.due : 0; }
function agentAlloc(S, country, ra) {
  const cs = stewardCitiesIn(S, country).slice(0, RA.span), eff = (ra.pool || 0) * (S.day - ra.since < RA.probation ? RA.probationShare : 1), needs = cs.map(id => agentNeed(S, id)), tot = needs.reduce((a, b) => a + b, 0);
  ra.alloc = {}; cs.forEach((id, i) => { const m = stewardOf(S, id), share = tot > 0 ? needs[i] / tot : 1 / cs.length, lim = Math.round(eff * share * 100) / 100; ra.alloc[id] = lim; if (m.policy && (m.policy.pay || m.policy.restock)) m.policy.limit = lim; });
}
function agentWeekly(S, country, ra) {
  const cs = stewardCitiesIn(S, country).slice(0, RA.span), parts = [], warns = []; ra.neg = ra.neg || {}; ra.bw = ra.bw || {}; let net = 0;
  for (const id of cs) {
    const pnl = shopPnl(S, id, 7), n7 = pnl ? pnl.total : 0, dues = (S.paymentDues || []).filter(d => d.city === id && d.amount > 0).reduce((a, d) => a + d.amount, 0); net += n7;
    parts.push(S.cities[id].name + ': صافي ' + fmtN(n7) + (dues > 0 ? ' · متأخر ' + fmtN(dues) : ''));
    ra.neg[id] = n7 < 0 ? (ra.neg[id] || 0) + 1 : 0; if (ra.neg[id] === RA.negWeeks) warns.push('منطقة ' + S.cities[id].name + ' تخسر منذ ' + RA.negWeeks + ' أسابيع متتالية: راجع تسعيرها وعمّالها.');
    const bs = bossOf(S, id); if (bs && bs.ruler !== 'player' && bs.trust <= RA.trustWarn && S.day - (ra.bw[id] == null ? -99 : ra.bw[id]) >= RA.trustGap) { ra.bw[id] = S.day; warns.push(bs.name + ' في ' + S.cities[id].name + ' غاضب عليك (ثقته ' + Math.round(bs.trust) + '): أهدِه أو أصلح العلاقة.'); }
  }
  let herd = ''; const ch = chiefOf(S, country); if (ch) { const fc = farmCitiesIn(S, country), heads = fc.reduce((a, id) => a + Object.values(farmOf(S, id).herd).reduce((x, y) => x + y, 0), 0); herd = ' · مواشي ' + (CD[country] ? CD[country].name : '') + ': ' + Math.floor(heads) + ' رأساً'; }
  const push = (type, text) => { ra.mail.unshift({ id: S.nextId++, day: S.day, country, type, text }); };
  push('report', 'تقرير وكيل الإقليم الأسبوعي: ' + parts.join(' | ') + ' | المجموع ' + fmtN(net) + (ra.topped ? ' | حُوِّل لمحفظة الدولار ' + fmtN(ra.topped) : '') + herd + '.'); ra.topped = 0;
  for (const w of warns) push('warn', w);
  ra.mail = ra.mail.filter(m => S.day - m.day <= 21); ra.mail.sort((a, b) => (a.type === 'warn' ? 0 : 1) - (b.type === 'warn' ? 0 : 1) || b.day - a.day); ra.mail.length = Math.min(ra.mail.length, RA.mailMax);
}
function agentBegin(S) {
  const P = S.player; if (!P.regAgents) return;
  for (const country of Object.keys(P.regAgents)) {
    const ra = P.regAgents[country];
    if (stewardCitiesIn(S, country).length < RA.minStewards) { delete P.regAgents[country]; news(S, 'ترك وكيل الإقليم عمله لأنه لم يبقَ لك أمينان في ' + (CD[country] ? CD[country].name : 'هذه الدولة') + '.', 'bad'); continue; }
    const wage = agentWage(S, country);
    if (P.wallet.sar < wage) { ra.late = (ra.late || 0) + 1; if (ra.late >= RA.lateQuit) { delete P.regAgents[country]; news(S, 'ترك وكيل الإقليم عمله لتأخر أجره.', 'bad'); } continue; }
    ra.late = 0; { const c0 = S.ctxCur; S.ctxCur = 'sar'; pPay(S, 'regionalAgent', wage, true); S.ctxCur = c0; } ra.paid = (ra.paid || 0) + wage;
    agentAlloc(S, country, ra);
    if (ra.usd && country !== 'sa') {
      const cs = stewardCitiesIn(S, country).slice(0, RA.span), need = cs.reduce((a, id) => { const q = regionalOfficeQuote(S, id); return a + (q.ok ? (q.wages + q.rent) * 7 : 0); }, 0), have = P.wallet.usd * rateOf(S, 'usd');
      const amt = Math.min(need - have, P.wallet.sar * 0.5, (ra.pool || 0) * 7); if (amt > 5) { const r = A.exchange(S, 'sar', 'usd', amt); if (r.ok) ra.topped = (ra.topped || 0) + amt; }
    }
    if (S.day > ra.since && (S.day - ra.since) % RA.every === 0) agentWeekly(S, country, ra);
  }
}
Object.assign(A, {
  hireAgent(S, country) {
    if (S.phase < RA.phase) return NO('يُفتح في الطور ' + RA.phase); if (!CD[country]) return NO('دولة غير معروفة'); if (agentOf(S, country)) return NO('عندك وكيل إقليم في ' + CD[country].name);
    const n = stewardCitiesIn(S, country).length; if (n < RA.minStewards) return NO('يلزمك ' + RA.minStewards + ' أمناء على الأقل في ' + CD[country].name + ' (عندك ' + n + ')');
    if (S.player.gold < RA.fee) return NO('تحتاج ' + RA.fee + ' ريال'); pPay(S, 'hiring', RA.fee, true);
    (S.player.regAgents = S.player.regAgents || {})[country] = { since: S.day, pool: 0, usd: false, mail: [], late: 0, paid: 0, alloc: {}, neg: {}, bw: {}, topped: 0 };
    return OK('وظّفتَ وكيل إقليم في ' + CD[country].name + ' بأجر ' + agentWage(S, country) + ' ريال يومياً. حدّد حدّه اليومي للدولة؛ وفي أول ' + RA.probation + ' يوماً يعمل بنصف الحد حتى يثبت.');
  },
  fireAgent(S, country) { if (!agentOf(S, country)) return NO('لا وكيل هنا'); delete S.player.regAgents[country]; return OK('سرّحتَ وكيل الإقليم'); },
  agentPolicy(S, country, pool, usd) {
    const ra = agentOf(S, country); if (!ra) return NO('لا وكيل هنا'); pool = Math.max(0, Math.min(1e8, Math.round(+pool || 0)));
    ra.pool = pool; ra.usd = !!usd && country !== 'sa'; agentAlloc(S, country, ra);
    return OK('حُفظ الحد اليومي للدولة: ' + fmtN(pool) + ' ريال، يوزّعه الوكيل على أمنائك' + (ra.usd ? '، ويُبقي محفظة الدولار تكفي أجور أسبوع' : ''));
  },
  agentSeen(S, id) { for (const c of Object.keys(S.player.regAgents || {})) { const ra = S.player.regAgents[c]; ra.mail = ra.mail.filter(m => m.id !== id); } return OK('تم'); },
});
