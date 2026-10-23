/* ---------- الملحمة: تذبح من مزرعتك وتبيع اللحم الطازج في السوق مباشرة، وما لم يُبَع يفسد 12٪ يومياً ---------- */
function butcherDay(S, city, pr, c) {
  const b = pr.butcher; b.today = 0;
  const have = Math.floor(pr.store.meat || 0);
  if (have >= 1) {
    const n = Math.min(have, BUTCHER_DAY * b.lv), r = sellUnits(S, S.player, c, 'meat', n, pr.store, true, BUTCHER_PREM, 'farm');
    if (r.n > 0) { const cost = takeBasis(pr.basis || (pr.basis = {}), 'meat', r.n); logTrade(S, city, 'meat', r.n, 'shop', r.net, r.net - cost, 'farm'); b.sold = (b.sold || 0) + r.n; b.rev = (b.rev || 0) + r.net; b.today = r.net; S.player.led.inc.shops = (S.player.led.inc.shops || 0) + r.net; }
  }
  const left = pr.store.meat || 0;
  if (left > 0) { const loss = left * GD.meat.spoil; pr.store.meat = left - loss; takeBasis(pr.basis || (pr.basis = {}), 'meat', loss); sink(S, 'spoilage', loss * mid('meat')); if (pr.store.meat < 0.05) delete pr.store.meat; }
}
