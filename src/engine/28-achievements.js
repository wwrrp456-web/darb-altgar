/* ---------- الإنجازات (40، معتمدة): حالة S.ach تُنشأ للاعب البشري فقط (الواجهة)، فلا تتأثر محاكاة التجار الآليين ولا اختبار الضغط ---------- */
function achInit(S) { return S.ach || (S.ach = { got: {}, q: [], n: {}, vis: {}, prev: {}, jt: {} }); }
function achGrant(S, id) {
  const X = S.ach; if (!X || X.got[id] != null) return false; const d = ACHD.LIST.find(a => a.id === id); if (!d) return false;
  X.got[id] = S.day; X.q.push(id); news(S, 'إنجاز جديد: ' + d.name + ' — ' + (d.hid ? 'اكتشفتَ إنجازاً مخفياً!' : d.desc), 'good'); return true;
}
const achFlag = achGrant;
function achNote(S, k, v) { const X = S.ach; if (!X) return; if (k === 'jtab') { X.jt[v] = 1; if (X.jt.tasks && X.jt.clues && X.jt.album) achGrant(S, 'learn_journal'); } }
const liveBreeds = S => { const live = new Set(), add = o => { for (const g in (o || {})) if ((o[g] || 0) > 0 && GD[g] && GD[g].live && !GD[g].hyb) live.add(g); };
  for (const car of S.player.caravans) { add(car.cargo); add(car.herd); } for (const id in S.player.props) { const f = S.player.props[id].farm; if (f) add(f.herd); } return live; };
const ACH_CHECK = {
  fx_three: S => { const w = S.player.wallet; return w.sar > 0 && w.usd > 0 && w.au > 0; },
  trip_first: S => S.player.trips >= 1,
  home_routes: S => { const home = (S.learn && S.learn.start) || S.home, ids = S.order.filter(id => S.cities[id].country === home); return ids.length > 0 && ids.every(id => S.ach.vis[id]); },
  world_five: S => new Set(Object.keys(S.ach.vis).map(id => S.cities[id].country)).size >= 5,
  breed_four: S => liveBreeds(S).size >= 4,
  fresh_sale: S => Object.values(S.player.props).some(pr => pr.butcher && pr.butcher.sold >= 1),
  factory_three: S => S.player.factories.some(f => isAbroad(f) && f.level >= 3 && f.hp >= 80 && !f.crisis && S.day - f.since > FACT_HP.grace && factoryQual(S, f) >= 0.7),
  boss_friend: S => Object.values(S.bosses).some(b => b.trust >= 20),
  boss_three: S => new Set(Object.keys(S.bosses).filter(id => S.bosses[id].trust >= 20 && S.cities[id]).map(id => S.cities[id].country)).size >= 3,
  pact_first: S => S.player.pacts.length > 0,
  pact_exclusive: S => S.player.pacts.some(x => x.type === 'exclusive'),
  pact_done: S => repOf(S.player).done >= 1,
  zakat_first: S => !!(S.zakat && S.zakat.paidN >= 1),
  debt_first: S => !!(S.player.famDebt && S.player.famDebt.paid > 0),
  debt_free: S => !!(S.player.famDebt && S.player.famDebt.amt0 > 0 && S.player.famDebt.left <= 0 && S.player.famDebt.paid >= S.player.famDebt.amt0),
  rep_high: S => reputation(S).total >= 80,
  safe_reserve: S => wealthStats(S).score === 3,
  learn_first: S => !!(S.learn && S.learn.char && S.learn.level >= 2),
  learn_four: S => !!(S.learn && S.learn.char && S.learn.level >= 5),
  learn_grad: S => !!(S.learn && S.learn.char && S.learn.level >= 11),
  story_secret: S => !!(S.learn && Object.values(S.learn.lore || {}).reduce((a, x) => a + x, 0) >= 1 && ((S.learn.csec || []).length || (S.learn.tab || []).length)),
};
function achDay(S) {
  const X = S.ach; if (!X) return;
  for (const car of S.player.caravans) {
    const pv = X.prev[car.id];
    if (car.left === 0) X.vis[car.city] = 1;
    if (pv > 0 && car.left === 0) {
      if (car.from && S.cities[car.from] && S.cities[car.from].country !== S.cities[car.city].country) achGrant(S, 'country_two');
      if (herdUnits(car) > 0 && car.herders >= 1) achGrant(S, 'herd_arrival');
      if (car.insured) achGrant(S, 'insured_return');
    }
    X.prev[car.id] = car.left;
  }
  for (const id in ACH_CHECK) if (X.got[id] == null) { try { if (ACH_CHECK[id](S)) achGrant(S, id); } catch (e) { /* حالة ناقصة في حفظ قديم */ } }
}
function achEvent(S, k, a, r) {
  const X = S.ach; if (!X) return;
  if (k === 'buy') achGrant(S, 'trade_first');
  else if (k === 'sell' && r.pl > 0) { achGrant(S, 'profit_first'); X.n.profit = (X.n.profit || 0) + 1; if (X.n.profit >= 20) achGrant(S, 'profit_twenty'); }
  else if (k === 'rentShop' && a[1] === 'stall') achGrant(S, 'rent_first');
  else if (k === 'buyShop') achGrant(S, 'own_shop');
  else if (k === 'toStore') achGrant(S, 'store_order');
  else if (k === 'buyStud') { const pr = S.player.props[a[0]]; if (pr && pr.farm && pr.farm.stable) achGrant(S, 'stable_star'); }
  else if (k === 'auditCity') { const pr = S.player.props[a[0]]; if (pr && pr.mgr && pr.mgr.lv >= 2 && !pr.mgr.late && mgrOk(S, a[0], pr) && S.day - pr.mgr.since >= 3) achGrant(S, 'manager_watch'); }
  achDay(S);
}
