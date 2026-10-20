/* ---------- بطاقات الفقه ودليل الميدان: تُفتح بالأحداث (بحدّ بطاقة كل 3 أيام) وتُروى بلسان عمّ سالم، وتُحفظ في دفتر الدروس ---------- */
const CARD_GAP = 3;
const propsAny = (S, f) => Object.values(S.player.props).some(f);
const CARD_TRIG = {
  f_sidq: S => S.learn.ev.profit >= 1, f_dayn: S => !!(S.player.famDebt && S.player.famDebt.paid > 0), g_plaza: S => { const c = mainCar(S); return c.city === 'riyadh' && c.left === 0; }, g_ach: S => !!S.ach && Object.keys(S.ach.got).length >= 1,
  f_taradi: S => S.learn.ev.haggleChoose >= 3, g_haggle: S => S.learn.ev.haggleStart >= 1, f_tatfif: S => S.learn.ev.sell >= 3, g_stories: S => (S.learn.pst || []).length >= 1,
  f_ujra: S => propsAny(S, pr => pr.staff && pr.staff.length), g_shop: S => propsAny(S, pr => pr.shops && pr.shops.length),
  f_ghish: S => S.player.factories.length > 0, g_factory: S => S.player.factories.length > 0,
  f_ihtikar: S => (S.shocks || []).some(x => x.k === 'monopoly'), g_shock: S => (S.shocks || []).length > 0, g_road: S => !!S.road,
  f_tasir: S => !!seasonNow(S), g_season: S => !!seasonNow(S), f_taamin: S => S.player.caravans.some(c => c.insured) || propsAny(S, pr => pr.ins),
  g_fleet: S => S.phase >= 2, f_wakala: S => (S.orders || []).length > 0 || S.learn.ev.agentBuy >= 1, f_amana: S => propsAny(S, pr => pr.mgr),
  g_farm: S => propsAny(S, pr => pr.farm), f_zakat: S => !!(S.zakat && S.zakat.paidN >= 1), f_munhi: S => !!S.rival && S.day >= RIVAL_FROM + 10, g_rival: S => !!S.rival && S.day >= RIVAL_FROM,
  f_dinar: S => (S.player.wallet.ag || 0) > 0 || S.learn.ev.exchange >= 3, f_sarf: S => S.learn.ev.exchange >= 1,
  g_sea: S => shipsOf(S).length > 0,
  g_currency: S => { const c = mainCar(S); return c.left === 0 && S.cities[c.city].country !== 'sa'; },
  f_riba: S => S.phase >= 4 || S.learn.ev.invest >= 1 || S.learn.ev.murabaha >= 1 || S.learn.ev.qard >= 1 || S.learn.ev.buySukuk >= 1, f_samaha: S => S.learn.level >= 10,
};
function cardDay(S) {
  const L = S.learn; if (!L || !L.char || L.rest) return; L.cards = L.cards || []; L.cq = L.cq || [];
  if (L.cq.length || S.day - (L.cardDay == null ? -99 : L.cardDay) < CARD_GAP) return;
  for (const id of CARDS.LIST) {
    if (L.cards.includes(id)) continue; const C = CARDS.CARDS[id]; if (L.level < C.min) continue;
    let hit = false; try { hit = !!CARD_TRIG[id](S); } catch (e) { hit = false; } if (!hit) continue;
    L.cards.push(id); L.cq.push(id); L.cardDay = S.day; return;
  }
}
