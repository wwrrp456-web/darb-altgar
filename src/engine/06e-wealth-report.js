/* تقرير الثروة: أين تقف ثروتك؟ مجموع البنود يساوي netWorth تماماً، مصنّفةً بسهولة التسييل ليعرف التاجر ما يبيعه أولاً حين يضيق به الحال */
const WEALTH_KINDS = { cash: { n: 'سيولة فورية', hint: 'متاحة الآن' }, goods: { n: 'بضاعة', hint: 'تُباع في الأسواق بسعرها' }, bank: { n: 'مضاربات وصكوك', hint: 'تُسحب أو تُسترد بشروطها' }, asset: { n: 'أصول ثابتة', hint: 'تُباع بنحو 80٪ من قيمتها (65٪ عند الضيق)' }, fixed: { n: 'لا تُباع', hint: 'ملكية ومكانة لا تتحول إلى نقد' }, debt: { n: 'ديون والتزامات', hint: 'تُطرح من ثروتك' } };
function wealthReport(S) {
  const P = S.player, w = P.wallet, rows = [], nw = netWorth(S);
  const add = (k, kind, label, value, items, detail) => { if (Math.abs(value) >= 0.5) rows.push({ k, kind, label, value: Math.round(value * 100) / 100, items: (items || []).filter(i => Math.abs(i.v) >= 0.5), detail: detail || '' }); };
  add('cash', 'cash', 'نقد في محافظك', P.gold, [], 'ريال ' + fmtN(w.sar) + (w.usd ? ' · دولار ' + fmtN(w.usd) : '') + (w.au ? ' · ذهب ' + w.au.toFixed(2) + ' غ' : '') + (w.ag ? ' · فضة ' + fmtN(w.ag) + ' غ' : ''));
  add('vault', 'cash', 'حصّالتك', P.vault || 0, []);
  add('cargo', 'goods', 'بضاعة وقطعان القوافل', P.caravans.reduce((a, c) => a + valueOf(holdings(c)), 0), P.caravans.map(c => ({ l: c.name + ' (' + S.cities[c.left > 0 ? c.dest : c.city].name + ')', v: valueOf(holdings(c)) })));
  const stores = Object.keys(P.props).map(k => ({ l: S.cities[k].name, v: valueOf(P.props[k].store) })); add('store', 'goods', 'بضاعة مخازنك ودكاكينك', stores.reduce((a, i) => a + i.v, 0), stores);
  const dep = Object.keys(P.bank.dep).map(k => ({ l: 'مضاربة في ' + (S.cities[k] ? S.cities[k].name : k), v: P.bank.dep[k] })); add('dep', 'bank', 'مضاربات', dep.reduce((a, i) => a + i.v, 0), dep);
  add('bonds', 'bank', 'صكوك', P.bank.bonds.reduce((a, b) => a + b.amt, 0), P.bank.bonds.map(b => ({ l: 'صك', v: b.amt })));
  const shopV = k => { const p = P.props[k]; return ownShops(p) * 1000 - p.shops.filter(sh => sh.endowed && shKind(sh) === 'own').length * 1000; };
  const shops = Object.keys(P.props).map(k => ({ l: S.cities[k].name + ' (' + ownShops(P.props[k]) + ')', v: shopV(k) })); add('shops', 'asset', 'دكاكين', shops.reduce((a, i) => a + i.v, 0), shops);
  const whs = Object.keys(P.props).map(k => ({ l: S.cities[k].name + ' (' + P.props[k].whs + ')', v: P.props[k].whs * 800 })); add('whs', 'asset', 'مخازن', whs.reduce((a, i) => a + i.v, 0), whs);
  const farms = Object.keys(P.props).map(k => ({ l: S.cities[k].name, v: farmValue(P.props[k]) })); add('farms', 'asset', 'مزارع وملاحم', farms.reduce((a, i) => a + i.v, 0), farms);
  add('fact', 'asset', 'مصانع', P.factories.reduce((a, f) => a + 2000 * f.level, 0), P.factories.map(f => ({ l: RECIPES[f.recipe].name + ' في ' + S.cities[f.city].name, v: 2000 * f.level })));
  add('gear', 'fixed', 'عربات وحراس القوافل', P.caravans.reduce((a, c) => a + c.carts * 300 + c.guards * 100, 0), []);
  let own = 0, rule = 0; const cityItems = []; for (const id in S.cities) { const c = S.cities[id], bs = bossOf(S, id); let v = (c.owner === 'player' ? 30000 : 0) + (c.tier - 1) * 4000 + (bs && bs.ruler === 'player' ? 4000 * c.size : 0); if (v) cityItems.push({ l: c.name, v }); own += v; }
  add('cities', 'fixed', 'مدن وحكم أسواق', own, cityItems);
  add('loans', 'debt', 'قروض عليك', -P.bank.loans.reduce((a, l) => a + l.amt, 0), P.bank.loans.map(l => ({ l: 'قرض', v: -l.amt })));
  add('wages', 'debt', 'أجور مؤجلة', -deferredWages(S), []);
  const sum = rows.reduce((a, r) => a + r.value, 0); if (Math.abs(nw - sum) >= 1) add('other', 'fixed', 'بنود أخرى', nw - sum, []);
  const by = k => rows.filter(r => r.kind === k).reduce((a, r) => a + r.value, 0), calm = ASSET_SALE_FACTORS.calm;
  return { total: nw, rows, kinds: WEALTH_KINDS, by: { cash: by('cash'), goods: by('goods'), bank: by('bank'), asset: by('asset'), fixed: by('fixed'), debt: by('debt') }, assetCash: Math.round(by('asset') * calm), quick: by('cash') + by('goods') + by('bank') };
}
