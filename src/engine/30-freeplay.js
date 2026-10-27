/* ---------- اللعب الحر (بعد التخرج أو الطور 4): حولية التاجر كل 354 يوماً وثلاثة أهداف لكل حول، بلا نهاية. للاعب البشري فقط (S.ach) ---------- */
const FREE_YEAR = 354;
const freeOn = S => !!(S.ach && ((S.learn && S.learn.char && S.learn.level >= 11) || S.phase >= 4));
const yrMarkets = S => Object.keys(S.ach.vis || {}).filter(id => !(S.yr.vis0 || []).includes(id)).length;
const YEAR_GOALS = {
  growth: { name: S => 'نمّ ثروتك إلى ' + fmtN(S.yr.goals.find(g => g.k === 'growth').target) + ' ريال', have: S => Math.round(netWorth(S)) },
  deals: { name: S => 'أتمّ ' + S.yr.goals.find(g => g.k === 'deals').target + ' صفقة رابحة', have: S => (S.ach.n.profit || 0) - (S.yr.profit0 || 0) },
  markets: { name: S => 'زُر ' + S.yr.goals.find(g => g.k === 'markets').target + ' أسواق جديدة هذا الحول', have: S => yrMarkets(S) },
};
function yrNewGoals(S, prev) {
  const n = S.yr.n, dealsPrev = prev && prev.deals ? prev.deals : 0;
  return [{ k: 'growth', target: Math.round(netWorth(S) * 1.25), done: false }, { k: 'deals', target: Math.max(12, Math.round(Math.max(dealsPrev, 10 + 2 * n) * 1.1)), done: false }, { k: 'markets', target: Math.max(2, Math.min(6, 3 - (yrMarkets(S) > 8 ? 1 : 0) + (n > 3 ? 1 : 0))), done: false }];
}
function yearDay(S) {
  if (!freeOn(S)) return;
  if (!S.yr) { S.yr = { n: 0, start: S.day, nw0: Math.round(netWorth(S)), trips0: S.player.trips, profit0: S.ach.n.profit || 0, vis0: Object.keys(S.ach.vis || {}), goals: [], hist: [] }; S.yr.goals = yrNewGoals(S); news(S, 'اكتشف عالم اللعبة: أتممتَ المراحل الأساسية وبدأت رحلتك المفتوحة، ولا نهاية للعبة. ولك في كل حول (354 يوماً) ثلاثة أهداف وتقرير بمسيرتك، وما زالت أمامك دروس جانبية وأسواق وأسرار تكتشفها.', 'good'); return; }
  for (const g of S.yr.goals) if (!g.done && YEAR_GOALS[g.k].have(S) >= g.target) { g.done = true; news(S, 'أنجزتَ هدف الحول: ' + YEAR_GOALS[g.k].name(S) + '.', 'good'); learnReact(S, 'goalDone', 5); }
  if (S.day - S.yr.start < FREE_YEAR) return;
  const nw = Math.round(netWorth(S)), deals = (S.ach.n.profit || 0) - (S.yr.profit0 || 0), rec = { y: S.yr.n + 1, end: S.day, nw, dnw: nw - S.yr.nw0, trips: S.player.trips - S.yr.trips0, deals, markets: yrMarkets(S), goals: S.yr.goals.filter(g => g.done).length, rival: S.rival ? rivalNW(S) : null };
  S.yr.hist.push(rec); if (S.yr.hist.length > 20) S.yr.hist.shift();
  news(S, 'تقرير الحول ' + rec.y + ': ثروتك ' + fmtN(nw) + ' (' + (rec.dnw >= 0 ? '+' : '') + fmtN(rec.dnw) + ')، ' + rec.trips + ' رحلة، ' + deals + ' صفقة رابحة، وأنجزتَ ' + rec.goals + ' من 3 أهداف.', 'good'); learnReact(S, 'yearEnd', 5); S.pause = true;
  S.yr.n++; S.yr.start = S.day; S.yr.nw0 = nw; S.yr.trips0 = S.player.trips; S.yr.profit0 = S.ach.n.profit || 0; S.yr.vis0 = Object.keys(S.ach.vis || {}); S.yr.goals = yrNewGoals(S, rec);
}
