/* ---------- المستشار الخاص: عمّ سالم بعد التخرّج يحلّل ويقترح وينبّه ---------- */
function bestDeal(S, carArg, budget, source = 'trade') {
  const car = carArg || mainCar(S), here = S.cities[car.city]; if (car.left > 0) return null; let best = null;
  GIDS.forEach(g => {
    if (g === 'wheat' || !sells(here, g) || GD[g].sp) return; // توصيات الصفقات للسلع العامة؛ أصناف المواشي الخاصة تُكتشف من سوق المواشي
    const room = Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w), p = unitPrice(here, g) * 1.04;
    const q = Math.min(30, room, Math.floor((budget != null ? budget : S.player.gold * 0.8) / p), Math.floor((here.stock[g] || 0) * 0.5)); if (q < 3) return;
    const o = sellOptions(S, car.city, g, q, p, car, source)[0]; if (!o || o.profit <= 0) return;
    const pct = o.profit / (p * q); if (!best || pct > best.pct) best = { g, q, dest: o.city, profit: o.profit, pct, days: o.days, risk: o.risk, cost: p * q, country: o.country };
  });
  return best;
}
function portfolioMix(S) {
  const P=S.player,car=mainCar(S),sv={};let tot=0;
  [car.cargo].concat(Object.values(P.props).map(p=>p.store)).forEach(st=>{for(const g in st){const v=(st[g]||0)*mid(g);sv[g]=(sv[g]||0)+v;tot+=v;}});
  const top=Object.keys(sv).sort((a,b)=>sv[b]-sv[a])[0];
  return {top:top?{g:top,pct:sv[top]/tot}:null,goodsTotal:tot};
}
function advisorReport(S) {
  const P = S.player, car = mainCar(S), here = S.cities[car.city], z = zakatBase(S), idle = car.left === 0;
  const rep = { city: car.city, idle, dest: car.dest, left: car.left };
  rep.here = GIDS.filter(g => g !== 'wheat' && sells(here, g)).map(g => ({ g, ratio: ratio(here, g), price: unitPrice(here, g), stock: here.stock[g] || 0 })).sort((a, b) => a.ratio - b.ratio);
  rep.deal = bestDeal(S);
  rep.cargo = GIDS.filter(g => (car.cargo[g] || 0) >= 1).map(g => { const q = Math.floor(car.cargo[g]), o = sellOptions(S, car.city, g, q, avgCost(car.basis, g) || mid(g), car)[0]; return { g, q, here: ratio(here, g), best: o ? { city: o.city, profit: o.profit, days: o.days } : null }; });
  rep.portfolio = Object.assign({cash:z.cash,goods:z.goods,store:z.store,deposits:z.deposits+z.bonds,debts:z.debts,nw:netWorth(S)},portfolioMix(S));
  rep.risk = { guards: car.guards, crew: car.crew, insured: !!car.insured, cargoValue: valueOf(car.cargo), route: rep.deal ? rep.deal.risk : null };
  rep.zakat = { start: S.zakat.start, due: S.zakat.due, amount: S.zakat.due ? S.zakat.amount : z.amount, met: z.met, base: z.base, nisab: z.nisab };
  return rep;
}
function advisorDay(S) {
  const L = S.learn; if (!L || !L.char || L.level <= 10 || L.advMute) return;
  const car = mainCar(S); if (car.left > 0) return; const here = S.cities[car.city], P = S.player, nw = netWorth(S);
  if (P.gold > 3000 && P.gold > 0.6 * nw) learnReact(S, 'tipCash', 30);
  const held = GIDS.filter(g => (car.cargo[g] || 0) >= 1);
  const spike = held.find(g => ratio(here, g) >= 1.25); if (spike) learnReact(S, 'tipSpike', 8, GD[spike].name);
  if (!held.length) { const ch = GIDS.filter(g => g !== 'wheat' && sells(here, g) && (here.stock[g] || 0) >= 5).sort((a, b) => ratio(here, a) - ratio(here, b))[0]; if (ch && ratio(here, ch) <= 0.8) learnReact(S, 'tipCheap', 8, GD[ch].name); }
  const rp = portfolioMix(S); if (rp.goodsTotal > 1500 && rp.top && rp.top.pct > 0.55) learnReact(S, 'tipConc', 25, GD[rp.top.g].name);
  if (valueOf(car.cargo) > 4000 && car.guards < 2 && !car.insured) learnReact(S, 'tipGuard', 25);
  if (P.bank.loans.length) learnReact(S, 'tipDebt', 30);
}

const hasCargo = S => S.player.caravans.some(c => Object.values(c.cargo).some(v => v >= 1));
const A = {
  earlyQard:issueEarlyQard,
  repayEarlyQard,
  restartTrade,
  sellCityAssets,
  sellAsset,
  settlePayment,
  officePay,
  setWageMode,
  promoteWorker,
  buy(S, carId, g, qty, mode, sex) {
    const car = carById(S, carId), c = S.cities[car.city];
    if (car.left > 0) return NO('القافلة في الطريق');
    ctxFor(S, car.city);
    if (!breedOpen(S, g)) return NO(GD[g].name + ' يُفتح عند المستوى ' + GD[g].lv + ' في مسيرتك');
    let dst = car.cargo, room = capOfCar(car) - loadOf(car);
    if (mode === 'herd') {
      if (!GD[g].hu) return NO(GD[g].name + ' لا تمشي مع القطيع: تُنقل في الحمولة');
      const free = herdCap(car) - herdUnits(car); if (free < GD[g].hu) return NO(herdCap(car) ? 'القطيع ممتلئ: وظّف راعياً آخر' : 'وظّف راعياً أولاً ليسوق القطيع');
      dst = herdOf(car); hxOf(car, g); room = Math.floor(free / GD[g].hu) * GD[g].w;
    }
    const poultry = !!BREED[g] && !(GD[g].hu > 0);
    if (sex && !(mode === 'herd' ? SEXF[sex] : poultry && (sex === 'm' || sex === 'f'))) return NO('الجنس يُحدَّد عند شراء القطيع الماشي أو الدواجن للتربية فقط');
    const res = buyUnits(S, S.player, c, g, qty, room, dst, true, false, sex ? SEXF[sex] : 1);
    if (res.n) addBasis(car.basis, g, res.n, res.cost);
    if (res.n && mode === 'herd') { if (!sex) herdAdd(car, g, res.n); else { const x = hxOf(car, g); if (sex === 'm') x.m += res.n; else if (sex === 'p') x.p = (x.p || 0) + res.n; } }
    if (res.n && mode !== 'herd' && poultry && sex) { const cx = cxOf(car, g); cx[sex] += res.n; } // جنس الدواجن في الحمولة: يُحمل إلى المزرعة للتكاثر
    if (res.n && mode !== 'herd') defectMaybe(S, car, g, res.n, res.cost);
    if (res.n && GD[g].live) learnReact(S, mode === 'herd' ? 'herdBuy' : 'liveBuy');
    if (res.unsold) return NO('لا يُباع هنا. ' + GD[g].name + ' يُشترى من: ' + soldAt(S, g).map(id => S.cities[id].name).join('، '));
    if (!res.n && res.quota) { learnReact(S, 'quotaHit', 15); }
    if (!res.n && res.quota) return NO('حصتك اليوم من ' + GD[g].name + ' انتهت. ثقة ' + bossOf(S, car.city).name + ' ترفعها، وعقد التوريد أو الحصري يضاعفها');
    return res.n ? Object.assign(OK('اشتريت ' + res.n + ' ' + GD[g].name + ' بـ ' + Math.round(res.cost) + ' ريال (متوسط ' + (res.cost / res.n).toFixed(1) + ')'), { n: res.n, cost: res.cost }) : NO('تعذّر الشراء (ذهب/مخزون/حمولة)');
  },
  setStart(S, jd) {
    const L = S.learn; if (!L || !L.char) return NO('اختر شخصيتك أولاً');
    if (S.day > 0 || (S.cal && S.cal.set)) return NO('بدأت رحلتك بالفعل');
    jd = Math.round(+jd); if (!(jd >= CAL.MIN && jd <= CAL.MAX)) return NO('اختر تاريخاً من ' + jdStr(CAL.MIN) + ' فصاعداً');
    S.cal = { jd0: jd, set: true, yr: 1 }; S.yearLog = []; L.datePend = false;
    const d = dateOf(S, 0); return OK('تنطلق قافلتك في ' + d.hs + ' الموافق ' + d.gs);
  },
  defectReturn(S) { return defectReturn(S); },
  defectArsh(S) { return defectArsh(S); },
  zakatPay(S, amt) {
    const Z = S.zakat; if (!Z || !Z.due) return NO('لا زكاة مستحقة الآن');
    if (!(Z.amount > 0)) return NO('لا مبلغ نقدي مستحق' + (Z.anLeft > 0 ? '، بقيت زكاة الأنعام' : ''));
    amt = Math.round(+amt || 0); if (!(amt > 0)) return NO('أدخل مبلغاً');
    amt = Math.min(amt, Z.amount); if (S.player.gold < amt) return NO('رصيدك لا يكفي لهذا المبلغ');
    pPay(S, 'zakat', amt, true); Z.amount -= amt; Z.paid += amt; Z.part = true;
    if (Z.amount > 0) return OK('أخرجتَ ' + amt + ' ريال، وبقي ' + Z.amount + ' ريال من زكاتك');
    if (Z.anLeft > 0) return OK('أخرجتَ زكاة مالك، وبقيت زكاة الأنعام');
    return zakatFinish(S);
  },
  zakatHerdMode(S, mode) {
    const Z = S.zakat; if (!Z || (mode !== 'trade' && mode !== 'sawm')) return NO('اختيار غير صحيح');
    if (Z.due && Z.part) return NO('بدأتَ إخراج الزكاة، فلا يتغير غرض القطيع الآن');
    Z.herdMode = mode; if (!Z.due) return OK(mode === 'sawm' ? 'قطيعك للرعي والنسل: له زكاة أنعام بأنصبتها' : 'قطيعك للتجارة: يُقوَّم بسعر السوق ضمن مالك');
    const b = zakatBase(S), anOn = mode === 'sawm' && b.an.any;
    if (!b.met && !anOn) { Z.hist.unshift({ day: S.day, base: Math.round(b.base), due: 0, paid: 0, note: 'below' }); if (Z.hist.length > 12) Z.hist.pop(); Z.due = false; Z.start = null; Z.amount = 0; Z.an = null; Z.anLeft = 0; return OK('لا زكاة عليك الآن بهذا الغرض'); }
    Z.amount = b.met ? b.amount : 0; Z.base = Math.round(b.base); zakatAnSnap(S, b); return OK('أُعيد الحساب: ' + (mode === 'sawm' ? 'زكاة أنعام للرعي والنسل' : 'قطيعك ضمن عروض التجارة'));
  },
  zakatAn(S, how) {
    const Z = S.zakat; if (!Z || !Z.due || !(Z.anLeft > 0) || !Z.an) return NO('لا زكاة أنعام مستحقة');
    const items = anItems(S, Z.an); let cash = 0, kindN = 0;
    if (how === 'kind') items.forEach(x => { const got = anTake(S, AN_ITEM_SP[x.k], x.n); kindN += got; if (got < x.n) cash += (x.n - got) * anPrice(S, x.k); });
    else items.forEach(x => { cash += x.n * anPrice(S, x.k); });
    cash = Math.round(cash); if (S.player.gold < cash) return NO('رصيدك لا يكفي لقيمة زكاة الأنعام (' + cash + ')');
    if (cash > 0) pPay(S, 'zakat', cash, true);
    Z.paid += cash; Z.anLeft = 0; Z.an = null; Z.part = true;
    const msg = how === 'kind' ? 'أخرجتَ زكاة أنعامك من القطيع (' + kindN + ' رأس)' + (cash ? ' وقيمة الباقي ' + cash + ' ريال' : '') : 'أخرجتَ قيمة زكاة أنعامك ' + cash + ' ريال';
    if (Z.amount > 0) return OK(msg + '، وبقيت زكاة مالك النقدية');
    const r = zakatFinish(S); return OK(msg + '. ' + r.msg);
  },
  zakatDefer(S) { const Z = S.zakat; if (!Z || !Z.due) return NO('لا زكاة مستحقة الآن'); Z.defer = S.day + 7; Z.dfr = 1; Z.lates = (Z.lates || 0) + 1; S.pause = false; return OK('أجّلتَ الزكاة أسبوعاً، وهي دَين عليك فلا تنسَها'); },
  mjNow(S) { return mjNow(S); },
  agentBuy(S, city, g, qty) {
    const q = agentQuote(S, city, g, qty); if (!q.ok) return NO(q.msg);
    const c = S.cities[city]; ctxFor(S, city);
    const acct = { gold: S.player.gold / (1 + q.feeRate) }, res = buyUnits(S, acct, c, g, q.n, 1e9, {}, true, true);
    if (!res.n) return NO('تعذّر الطلب');
    const fee = res.cost * q.feeRate, total = res.cost + fee; S.player.gold -= total; S.player.led.exp.agent = (S.player.led.exp.agent || 0) + fee;
    mjWant(S, 'qabd'); S.orders = S.orders || []; S.orders.push({ id: S.nextId++, to: q.dest, from: city, g, n: res.n, cost: total, day: S.day + q.days });
    return OK('طلبت ' + res.n + ' ' + GD[g].name + ' من ' + c.name + ' بـ ' + Math.round(total) + ' ريال (رسم الوكيل ' + Math.round(fee) + ') · تصل إلى ' + S.cities[q.dest].name + ' بعد ' + q.days + ' أيام');
  },
  sell(S, carId, g, qty, mode) {
    const car = carById(S, carId), c = S.cities[car.city];
    if (car.left > 0) return NO('القافلة في الطريق');
    ctxFor(S, car.city);
    const cb0 = mode !== 'herd' ? (car.cargo[g] || 0) : 0, b0 = mode === 'herd' ? (herdOf(car)[g] || 0) : 0, pm = (mode === 'herd' ? pedMulOf(car, g) : 1) * qualOf(car.basis, g), res = sellUnits(S, S.player, c, g, qty, mode === 'herd' ? herdOf(car) : car.cargo, true, pm, 'trade', car.basis[g]);
    if (mode === 'herd') herdScale(car, g, b0); else cxScale(car, g, cb0);
    if (!res.n) return NO('لا بضاعة');
    const cost = takeBasis(car.basis, g, res.n), pl = res.net - cost; logTrade(S, car.city, g, res.n, 'sell', res.net, pl);
    return { ok: true, msg: 'بعت ' + res.n + ' ' + GD[g].name + ' صافي ' + Math.round(res.net) + ' ريال · ' + (pl >= 0 ? 'ربحت ' : 'خسرت ') + Math.abs(Math.round(pl)), pl, net: res.net, n: res.n };
  },
  sail(S, carId, dest, pace) { const car = carById(S, carId); if (!car) return NO('قافلة غير معروفة'); const r = startSail(S, car, dest, pace); return r.ok ? OK('أبحرتَ: ' + r.days + ' أيام (رسم الميناء ' + r.fee + ')' + (r.pace && r.pace.lv ? ' · مؤن السفر ' + r.pace.units : '')) : NO(r.msg); },
  buyShip(S, city, type) {
    type = type || 'dhow'; const T = SHIPS[type]; if (!T) return NO('نوع سفينة غير معروف'); if (S.phase < SEA.phase) return NO('السفن تُفتح في الطور ' + SEA.phase);
    if ((S.player.seaTrips || 0) < T.need) return NO(T.name + ' تُفتح بعد ' + T.need + ' رحلات بحرية (أبحرتَ ' + (S.player.seaTrips || 0) + ')');
    if (!isPort(city)) return NO('الموانئ فقط: ' + PORTS.map(p => S.cities[p].name).join('، ')); if (shipAt(S, city)) return NO('لك سفينة راسية في هذا الميناء');
    const cost = Math.round(T.cost * foreignMul(S, S.cities[city])); ctxFor(S, city); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); const ship = { id: S.nextId++, type, city, name: T.name + ' ' + (shipsOf(S).length + 1), dest: null, up: { hull: 0, sail: 0 }, crew: 0, captain: null }; shipsOf(S).push(ship); learnReact(S, 'buyShip');
    return OK('اشتريتَ ' + ship.name + ' في ' + S.cities[city].name + ': سعتها ' + T.cap + '، تُبحر بها قافلتك من هذا الميناء');
  },
  sellShip(S, shipId) {
    const ships = shipsOf(S), sh = ships.find(x => x.id === shipId); if (!sh) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر'); const T = SHIPS[sh.type], back = Math.round(T.cost * SEA.sellBack);
    ctxFor(S, sh.city); S.player.gold += back; S.player.ships = ships.filter(x => x !== sh); return OK('بعتَ ' + sh.name + ' بـ' + back);
  },
  upgradeShip(S, shipId, k) {
    const sh = shipsOf(S).find(x => x.id === shipId), U = SHIP_UP[k]; if (!sh || !U) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر');
    const lv = shipUp(sh, k); if (lv >= 2) return NO('بلغ الحد الأقصى'); const cost = Math.round(SHIPS[sh.type].cost * U.cost[lv] * foreignMul(S, S.cities[sh.city])); ctxFor(S, sh.city); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); sh.up = Object.assign({ hull: 0, sail: 0 }, sh.up, { [k]: lv + 1 }); return OK(U.name + ' (مستوى ' + (lv + 1) + ') في ' + sh.name);
  },
  hireSailor(S, shipId) {
    const sh = shipsOf(S).find(x => x.id === shipId); if (!sh) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر'); if (shipCrew(sh) >= SHIPS[sh.type].slots) return NO('طاقم السفينة مكتمل (' + SHIPS[sh.type].slots + ')');
    ctxFor(S, sh.city); if (S.player.gold < SAILOR_FEE) return NO('تحتاج ' + SAILOR_FEE); pPay(S, 'hiring', SAILOR_FEE, true); sh.crew = shipCrew(sh) + 1; return OK('انضم بحّار إلى ' + sh.name);
  },
  dismissSailor(S, shipId) { const sh = shipsOf(S).find(x => x.id === shipId); if (!sh || !sh.city) return NO('لا سفينة راسية'); if (!(shipCrew(sh) > 0)) return NO('لا بحّارة'); sh.crew = shipCrew(sh) - 1; return OK('سرّحت بحّاراً'); },
  hireSeaCaptain(S, shipId, idx) {
    const sh = shipsOf(S).find(x => x.id === shipId); if (!sh) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر'); if (sh.captain) return NO('للسفينة قائد: سرّحه أولاً');
    const cd = seaCaptainPool(S)[idx]; if (!cd) return NO('مرشّح غير موجود'); ctxFor(S, sh.city); if (S.player.gold < cd.fee) return NO('تحتاج ' + cd.fee);
    pPay(S, 'hiring', cd.fee, true); sh.captain = { name: cd.name, role: cd.role, nav: cd.nav, combat: cd.combat, wage: cd.wage, since: S.day }; learnReact(S, 'capHire');
    return OK('انضم ' + cd.name + ' (' + SEA_ROLES[cd.role].name + ') قائداً لـ' + sh.name);
  },
  fireSeaCaptain(S, shipId) { const sh = shipsOf(S).find(x => x.id === shipId); if (!sh || !sh.city) return NO('لا سفينة راسية'); if (!sh.captain) return NO('لا قائد'); const n = sh.captain.name; sh.captain = null; return OK('سرّحت ' + n); },
  buyPack(S, carId, n) { const r = buyPack(S, carById(S, carId), n); return r.ok ? OK('اشتريتَ ' + r.n + ' من مؤن السفر بـ ' + r.cost) : NO(r.msg); },
  travel(S, carId, dest, pace) { const car = carById(S, carId); const r = startTrip(S, car, dest, pace); return r.ok ? OK('انطلقت: ' + r.days + ' أيام' + (r.pace && r.pace.lv ? ' · مؤن السفر ' + r.pace.units : '')) : NO(r.msg); },
  buyCart(S, carId) { const car = carById(S, carId); if (car.carts >= 6) return NO('الحد الأقصى 6 عربات'); if (car.left > 0) return NO('في الطريق'); if (S.player.gold < 600) return NO('تحتاج 600'); pPay(S, 'assets', 600); car.carts++; return OK('عربة جديدة'); },
  upgradeShop(S, city, shopId, k) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === shopId), U = SHOP_UP[k]; if (!sh || !U) return NO('لا دكان');
    if (S.phase < 2) return NO('يُفتح في الطور 2'); if (shKind(sh) !== 'own') return NO('التحسين للدكان المملوك فقط');
    const lv = shUp(sh, k); if (lv >= 2) return NO('بلغ الحد الأقصى'); const cost = Math.round(SHOP_UP_COST[lv] * foreignMul(S, S.cities[city])); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); sh.up = Object.assign({}, sh.up, { [k]: lv + 1 }); learnReact(S, 'shopUp'); return OK(U.name + ' (مستوى ' + (lv + 1) + ') في دكانك بـ' + S.cities[city].name);
  },
  saveTemplate(S, carId, name) {
    const car = carById(S, carId), r = car && car.route; if (!r) return NO('لا مسار لحفظه'); const T = S.player.tpl || (S.player.tpl = []); if (T.length >= 6) return NO('بلغت 6 قوالب: احذف قالباً أولاً');
    const nm = (name || '').trim() || (S.cities[r.a].name + ' ⇄ ' + S.cities[r.b].name); T.push({ id: S.nextId++, name: nm.slice(0, 30), a: r.a, b: r.b, buyA: r.buyA || null, buyB: r.buyB || null }); return OK('حفظت القالب «' + nm + '»');
  },
  applyTemplate(S, carId, tid) {
    const car = carById(S, carId), t = (S.player.tpl || []).find(x => x.id === tid); if (!car || !t) return NO('قالب غير موجود');
    car.route = { a: t.a, b: t.b, buyA: t.buyA, buyB: t.buyB }; return OK('طبّقت «' + t.name + '» على ' + car.name);
  },
  delTemplate(S, tid) { S.player.tpl = (S.player.tpl || []).filter(x => x.id !== tid); return OK('حُذف القالب'); },
  insureCity(S, city, on) {
    const pr = S.player.props[city]; if (!pr || !(pr.shops.length || S.player.factories.some(f => f.city === city))) return NO('لا ممتلكات لك في هذه المدينة');
    if (S.phase < 3) return NO('يُفتح في الطور 3'); if (on) { if (pr.ins) return NO('مؤمَّنة أصلاً'); if (S.player.gold < insPrem(S, city) * 10) return NO('تحتاج احتياطي تبرعات عشرة أيام'); pr.ins = { since: S.day }; learnReact(S, 'insureOn'); return OK('اشتركتَ في صندوق التكافل عن ممتلكاتك في ' + S.cities[city].name + ' بتبرع ' + insPrem(S, city) + ' يومياً'); }
    pr.ins = null; return OK('أوقفتَ التأمين');
  },
  buyMount(S, carId, kind) {
    const car = carById(S, carId), M = MOUNT[kind]; if (!car || !M) return NO('مركب غير معروف'); if (S.phase < 2) return NO('يُفتح في الطور 2');
    if (car.left > 0) return NO('في الطريق'); if (car.mount) return NO('عند القافلة مركب: بِعه أولاً'); if (S.player.gold < M.cost) return NO('تحتاج ' + M.cost);
    pPay(S, 'assets', M.cost); car.mount = { kind, since: S.day }; learnReact(S, 'mountBuy'); return OK('اشتريت ' + M.name + ' لـ' + car.name + ': ' + M.desc);
  },
  sellMount(S, carId) {
    const car = carById(S, carId), M = car && mountOf(car); if (!M) return NO('لا مركب'); if (car.left > 0) return NO('في الطريق');
    if (loadOf(car) > capOfCar(car) / (1 + M.load) + 1e-9) return NO('الحمولة تزيد عن سعة القافلة بدونه');
    const back = Math.round(M.cost * 0.6); S.player.gold += back; S.player.led.inc.assets = (S.player.led.inc.assets || 0) + back; car.mount = null; return OK('بعت ' + M.name + ' بـ' + back);
  },
  hireCrew(S, carId) { const car = carById(S, carId); if (car.crew >= 12) return NO('الطاقم كامل'); if (S.player.gold < 50) return NO('تحتاج 50'); pPay(S, 'hiring', WAGE.crewHire, true); car.crew++; const w = staffWage(S, 'crew'); return OK('انضم رجل للطاقم بأجر معلوم: ' + w.once + ' ريال مرة واحدة، و' + w.day + ' ريال يومياً أثناء السفر'); },
  sellYoung(S, carId, g, qty) {
    const car = carById(S, carId), c = S.cities[car.city]; if (car.left > 0) return NO('القافلة في الطريق'); ctxFor(S, car.city);
    const x = (car.hx || {})[g], n0 = Math.min(Math.floor(qty), Math.floor(x ? x.y : 0)); if (n0 < 1) return NO('لا صغار منها');
    const tmp = {}; tmp[g] = n0; const res = sellUnits(S, S.player, c, g, n0, tmp, true, YOUNG_SELL * (spOf(g) === 'horse' ? pedMul(x.yq || 1) : 1) * hyPf(car, g)); if (!res.n) return NO('تعذّر البيع');
    x.y -= res.n; logTrade(S, car.city, g, res.n, 'sell', res.net, res.net);
    return { ok: true, msg: 'بعت ' + res.n + ' من صغار ' + GD[g].name + ' صافي ' + Math.round(res.net) + ' ريال', pl: res.net, net: res.net, n: res.n };
  },
  hireHerder(S, carId) {
    const car = carById(S, carId); if ((car.herders || 0) >= MAX_HERDERS) return NO('رعاة كفاية (' + MAX_HERDERS + ')'); if (car.left > 0) return NO('في الطريق');
    if (S.player.gold < HERDER_FEE) return NO('تحتاج ' + HERDER_FEE); pPay(S, 'hiring', HERDER_FEE, true); car.herders = (car.herders || 0) + 1;
    return OK('انضم راعٍ للقافلة: سعة القطيع ' + herdCap(car) + ' وحدة');
  },
  fireHerder(S, carId) {
    const car = carById(S, carId); if (!(car.herders > 0)) return NO('لا رعاة'); if (car.left > 0) return NO('في الطريق');
    if (herdUnits(car) > (car.herders - 1) * HERD_PER) return NO('بِع بعض القطيع أولاً: سعة الرعاة لا تكفيه'); car.herders--; return OK('سرّحت راعياً');
  },
  hireGuard(S, carId) { const car = carById(S, carId); if (car.guards >= 8) return NO('حراس كفاية'); if (S.player.gold < 300) return NO('تحتاج 300'); pPay(S, 'hiring', WAGE.guardHire, true); car.guards++; learnReact(S, 'guardHire'); const w = staffWage(S, 'guard'); return OK('حارس جديد بأجر معلوم: ' + w.once + ' ريال مرة واحدة، و' + w.day + ' ريال يومياً أثناء السفر (' + w.idle + ' حين تقف القافلة)'); },
  insure(S, carId, on) { carById(S, carId).insured = !!on; return OK(on ? 'اشتركتَ في صندوق التكافل عن هذه القافلة' : 'خرجتَ من صندوق التكافل عن هذه القافلة'); },
  hireCaptain(S, idx) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    if (S.player.caravans.length >= 6) return NO('أقصى أسطول 6 قوافل');
    if (idx != null) {
      const cd = captainPool(S)[idx]; if (!cd) return NO('مرشّح غير موجود'); if (S.player.gold < cd.fee) return NO('تحتاج ' + cd.fee);
      pPay(S, 'assets', cd.fee);
      const car = makeCaravan(S, S.nextId++, 'قافلة ' + cd.name, mainCar(S).city, false);
      car.captain = { name: cd.name, trade: cd.trade, nav: cd.nav, combat: cd.combat, xp: 0, role: cd.role, home: cd.home, loyal: 70, raise: 0, since: S.day };
      S.player.caravans.push(car); learnReact(S, 'capHire');
      return OK('انضم ' + cd.name + ' (' + ROLES[cd.role].name + ' من ' + CD[cd.home].name + ')');
    }
    if (S.player.gold < 1500) return NO('تحتاج 1500');
    pPay(S, 'assets', 1500);
    const id = S.nextId++, names = ['مطلق', 'بدر', 'تركي', 'فيصل', 'عيد', 'حمد'], nm = names[S.player.caravans.length % 6];
    const car = makeCaravan(S, id, 'قافلة ' + nm, mainCar(S).city, false);
    car.captain = { name: nm, trade: 1 + Math.floor(rnd(S) * 2), nav: 1 + Math.floor(rnd(S) * 2), combat: 1 + Math.floor(rnd(S) * 2), xp: 0 };
    S.player.caravans.push(car); return OK('انضم قائد جديد: ' + nm);
  },
  raiseCaptain(S, carId) {
    const car = carById(S, carId), cp = car && car.captain; if (!cp) return NO('لا قائد');
    if ((cp.raise || 0) >= CAP_RAISE_MAX - 1e-9) return NO('بلغت علاوته الحد الأقصى'); if (S.day - (cp.raiseDay == null ? -99 : cp.raiseDay) < 20) return NO('أعطيته علاوة قريباً: انتظر 20 يوماً');
    cp.raise = Math.min(CAP_RAISE_MAX, (cp.raise || 0) + 0.15); cp.raiseDay = S.day; cp.loyal = Math.min(100, (cp.loyal == null ? 70 : cp.loyal) + 12);
    return OK('زدتَ راتب ' + cp.name + ' إلى +' + Math.round(cp.raise * 100) + '٪: ولاؤه الآن ' + Math.round(cp.loyal));
  },
  setRoute(S, carId, route) { carById(S, carId).route = route; return OK('حُدّد المسار'); },
  // --- الدكاكين والمخازن ---
  buildShop(S, city) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    const c = S.cities[city], n = shopsOf(S, city).length; ctxFor(S, city);
    if (n >= shopLimit(c)) return NO('بلغت الحد الأقصى للدكاكين في ' + c.name + ' (' + shopLimit(c) + ')');
    const cost = shopCost(S, c); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost);
    const pr = ensureProps(S, city); pr.shops.push({ id: S.nextId++, items: [], kind: 'own' }); welcomeCrew(S, pr, SELLER_PTS, 0);
    snapshotKnown(S, [city]);
    return OK('بنيت دكاناً في ' + c.name + (whsOf(S, city) < pr.shops.length ? ' · يمكنك الآن بناء مخزن' : ''));
  },
  buildWarehouse(S, city) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    const c = S.cities[city], pr = S.player.props[city]; ctxFor(S, city);
    if (!pr || !pr.shops.length) return NO('ابنِ دكاناً أولاً: كل دكان يفتح مخزناً');
    if (pr.whs >= pr.shops.length) return NO('كل مخزن يحتاج دكاناً: ابنِ دكاناً جديداً أولاً');
    const cost = whCost(S, c); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); pr.whs++; welcomeCrew(S, pr, 0, 1); return OK('بنيت مخزناً في ' + c.name);
  },
  rentShop(S, city, kind, landlord) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    if (kind !== 'stall' && kind !== 'shop') return NO('نوع غير معروف');
    const c = S.cities[city], n = shopsOf(S, city).length; ctxFor(S, city);
    if (n >= shopLimit(c)) return NO('بلغت الحد الأقصى للدكاكين في ' + c.name + ' (' + shopLimit(c) + ')');
    landlord = landlord === 'boss' && bossOf(S, city) && bossOf(S, city).ruler !== 'player' ? 'boss' : 'private';
    const rent = rentOf(S, c, kind, landlord, n), fee = rent * 3; if (S.player.gold < fee) return NO('رسوم الدخول ' + fee + ' (إيجار 3 أيام)');
    pPay(S, 'rent', fee, true);
    const pr = ensureProps(S, city); pr.shops.push({ id: S.nextId++, items: [], kind: kind === 'stall' ? 'stall' : 'rent', landlord, rent, rentPaid: fee, arrears: 0, onTime: 0, since: S.day });
    welcomeCrew(S, pr, kind === 'stall' ? 1 : SELLER_PTS, 0); snapshotKnown(S, [city]);
    return OK('استأجرت ' + (kind === 'stall' ? 'بسطة' : 'دكاناً') + ' في ' + c.name + ' بإيجار ' + rent + ' ريالاً يومياً');
  },
  upgradeStall(S, city, id) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id), c = S.cities[city]; ctxFor(S, city);
    if (!sh || shKind(sh) !== 'stall') return NO('ليست بسطة');
    const rent = rentOf(S, c, 'shop', sh.landlord, pr.shops.length - 1), fee = rent * 5; if (S.player.gold < fee) return NO('رسوم الارتقاء ' + fee);
    pPay(S, 'rent', fee, true); sh.kind = 'rent'; sh.rent = rent; sh.rentPaid = (sh.rentPaid || 0) + fee;
    welcomeCrew(S, pr, 1, 0);
    return OK('ارتقت بسطتك إلى دكان مؤجَّر بإيجار ' + rent + ' ريالاً يومياً');
  },
  buyShop(S, city, id) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id), c = S.cities[city]; ctxFor(S, city);
    if (!sh || shKind(sh) === 'own') return NO('هذا الدكان ملكك أصلاً');
    const price = Math.round(1500 * Math.pow(1.5, pr.shops.length - 1) * foreignMul(S, c)), disc = Math.min(RENT_CREDIT * (sh.rentPaid || 0), RENT_MAXCREDIT * price), pay = Math.round(price - disc);
    if (S.player.gold < pay) return NO('تحتاج ' + pay + ' (السعر ' + price + ' مخصوماً منه ' + Math.round(disc) + ' من إيجارك)');
    pPay(S, 'assets', pay); const wasStall = shKind(sh) === 'stall';
    sh.kind = 'own'; delete sh.rent; delete sh.landlord; delete sh.arrears; delete sh.onTime; delete sh.rentPaid; if (wasStall) welcomeCrew(S, pr, 1, 0);
    return OK('اشتريت الدكان في ' + c.name + ' بـ ' + pay + ' ريالاً (خصم ' + Math.round(disc) + ' من إيجارك)');
  },
  vacateShop(S, city, id) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id); if (!sh || shKind(sh) === 'own') return NO('لا إيجار');
    if (pr.whs >= pr.shops.length) return NO('كل مخزن يحتاج دكاناً: لا تخلِ قبل تقليل المخازن');
    pr.shops = pr.shops.filter(x => x !== sh); return OK('تركت المكان المؤجَّر');
  },
  buildFarm(S, city) {
    if (S.phase < FARM_PHASE) return NO('تُفتح المزرعة في الطور ' + FARM_PHASE + ' (صاحب مصانع)');
    const c = S.cities[city], pr = S.player.props[city]; ctxFor(S, city);
    if (!pr || !pr.shops.length) return NO('تحتاج دكاناً لك في ' + c.name + ' قبل المزرعة');
    if (pr.farm) return NO('لك مزرعة هنا');
    const cost = Math.round(FARM_COST * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); pr.farm = { level: 1, herd: {}, hx: {}, acc: {}, lost: 0 }; pr.farmerWelcome = 1; welcomeCrew(S, pr, 0, 0);
    return OK('بنيت مزرعة في ' + c.name + ' تتسع لـ ' + farmCap(S, city) + ' وحدة');
  },
  buildStable(S, city) {
    const c = S.cities[city], f = farmOf(S, city); ctxFor(S, city); if (!f) return NO('لا مزرعة'); if (f.stable) return NO('لك إسطبل');
    const cost = Math.round(2500 * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); f.stable = true; return OK('بنيت إسطبلاً: مهور خيلك تتحسّن سلالتها أسرع');
  },
  buyStud(S, city) {
    const c = S.cities[city], f = farmOf(S, city), pr = S.player.props[city]; ctxFor(S, city); if (!f) return NO('لا مزرعة'); if (!c.makes.includes('horse')) return NO('لا تُباع الفحول الأصيلة إلا في أسواق الخيل');
    if (S.day - (f.studDay == null ? -999 : f.studDay) < 60) return NO('الفحول الأصيلة نادرة: انتظر ' + (60 - (S.day - f.studDay)) + ' أيام');
    if (farmCap(S, city) - farmUnits(f) < BREED.horse.fu) return NO('لا مكان في المزرعة');
    const cost = Math.round(unitPrice(c, 'horse') * 5); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); const x = hxOf(f, 'horse'), a = f.herd.horse || 0, m0 = Math.min(x.m, a); x.mq = ((x.mq || 1) * m0 + 4) / (m0 + 1); f.herd.horse = a + 1; x.m += 1; f.studDay = S.day;
    addBasis(pr.basis || (pr.basis = {}), 'horse', 1, cost);
    return OK('اشتريت فحلاً أصيلاً (4 نجوم) بـ ' + cost + ' ريال');
  },
  upgradeFarm(S, city) {
    const c = S.cities[city], f = farmOf(S, city); ctxFor(S, city); if (!f) return NO('لا مزرعة'); if (f.level >= FARM_MAXLV) return NO('أعلى مستوى');
    const cost = Math.round(FARM_UP * f.level * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); f.level++; return OK('وُسّعت المزرعة إلى ' + farmCap(S, city) + ' وحدة');
  },
  farmIn(S, carId, g, qty) {
    const car = carById(S, carId), f = farmOf(S, car.city), pr = S.player.props[car.city]; if (car.left > 0) return NO('القافلة في الطريق'); if (!f) return NO('لا مزرعة في ' + S.cities[car.city].name);
    if (!BREED[g]) return NO('لا تُربّى هذه السلعة');
    const inHerd = GD[g].hu > 0, src = inHerd ? herdOf(car) : car.cargo, have = Math.floor(src[g] || 0);
    const free = farmCap(S, car.city) - farmUnits(f), n = Math.min(Math.floor(qty), have, Math.floor(free / BREED[g].fu)); if (n < 1) return NO(have < 1 ? 'لا ' + GD[g].name + ' معك' : 'المزرعة ممتلئة: وسّعها أو بِع بعضها');
    const b0 = src[g], x = inHerd ? hxOf(car, g) : null, p = x && b0 > 0 ? Math.min(1, x.m / b0) : 0, pp = x && b0 > 0 ? Math.min(1, (x.p || 0) / b0) : 0;
    const fx = hxOf(f, g); if (inHerd && spOf(g) === 'horse') pedMove(x, fx, f.herd[g] || 0, n, p); if (inHerd && GD[g].hyb) hybMove(x, fx, (f.herd[g] || 0) + fx.y, n);
    const cm = inHerd ? 0 : cxMales(car, g, b0, n); // الدواجن: الذكور المعروفة تنتقل، وغير المحدَّد بنسبة افتراضية ربع
    src[g] = b0 - n; if (inHerd) herdScale(car, g, b0); else cxScale(car, g, b0);
    f.herd[g] = (f.herd[g] || 0) + n; if (inHerd) { fx.m += n * p; fx.p = (fx.p || 0) + n * pp; } else if (car.cx && car.cx[g]) fx.m += cm; else herdAdd(f, g, n);
    const cost = takeBasis(car.basis, g, n); addBasis(pr.basis || (pr.basis = {}), g, n, cost);
    return OK('وضعت ' + n + ' ' + GD[g].name + ' في المزرعة');
  },
  farmOut(S, carId, g, qty) {
    const car = carById(S, carId), f = farmOf(S, car.city), pr = S.player.props[car.city]; if (car.left > 0) return NO('القافلة في الطريق'); if (!f) return NO('لا مزرعة هنا');
    const have = Math.floor(f.herd[g] || 0), inHerd = GD[g].hu > 0; let n = Math.min(Math.floor(qty), have);
    if (inHerd) n = Math.min(n, Math.floor((herdCap(car) - herdUnits(car)) / GD[g].hu)); else n = Math.min(n, Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w));
    if (n < 1) return NO(have < 1 ? 'لا ' + GD[g].name + ' بالغة في المزرعة' : inHerd ? 'لا سعة للقطيع: وظّف راعياً' : 'لا مكان في الحمولة');
    const b0 = f.herd[g], x = hxOf(f, g), p = b0 > 0 ? Math.min(1, x.m / b0) : 0, pp = b0 > 0 ? Math.min(1, (x.p || 0) / b0) : 0; f.herd[g] = b0 - n; herdScale(f, g, b0);
    if (inHerd) { const cx = hxOf(car, g); if (spOf(g) === 'horse') pedMove(x, cx, car.herd[g] || 0, n, p); if (GD[g].hyb) hybMove(x, cx, (car.herd[g] || 0) + cx.y, n); herdOf(car)[g] = (car.herd[g] || 0) + n; cx.m += n * p; cx.p = (cx.p || 0) + n * pp; } else car.cargo[g] = (car.cargo[g] || 0) + n;
    const cost = takeBasis(pr.basis || (pr.basis = {}), g, n); addBasis(car.basis, g, n, cost);
    return OK('أخرجت ' + n + ' ' + GD[g].name + ' من المزرعة إلى ' + (inHerd ? 'القطيع' : 'الحمولة'));
  },
  farmSell(S, city, g, qty, kind) {
    const f = farmOf(S, city), c = S.cities[city], pr = S.player.props[city]; if (!f) return NO('لا مزرعة هنا'); ctxFor(S, city);
    if (kind === 'young') {
      const x = (f.hx || {})[g], n0 = Math.min(Math.floor(qty), Math.floor(x ? x.y : 0)); if (n0 < 1) return NO('لا صغار منها');
      const tmp = {}; tmp[g] = n0; const r = sellUnits(S, S.player, c, g, n0, tmp, true, YOUNG_SELL * (spOf(g) === 'horse' ? pedMul(x.yq || 1) : 1) * hyPf(f, g), 'farm'); if (!r.n) return NO('تعذّر البيع'); x.y -= r.n; logTrade(S, city, g, r.n, 'sell', r.net, r.net, 'farm');
      return { ok: true, msg: 'بعت ' + r.n + ' من صغار ' + GD[g].name + ' صافي ' + Math.round(r.net) + ' ريال', pl: r.net, net: r.net, n: r.n };
    }
    const b0 = f.herd[g] || 0, r = sellUnits(S, S.player, c, g, qty, f.herd, true, pedMulOf(f, g), 'farm'); if (!r.n) return NO('لا ' + GD[g].name + ' للبيع'); herdScale(f, g, b0);
    const cost = takeBasis(pr.basis || (pr.basis = {}), g, r.n); logTrade(S, city, g, r.n, 'sell', r.net, r.net - cost, 'farm');
    return { ok: true, msg: 'بعت ' + r.n + ' ' + GD[g].name + ' صافي ' + Math.round(r.net) + ' ريال', pl: r.net - cost, net: r.net, n: r.n };
  },
  // تزاوج: ذكور الصنف M يلقّحون إناث الصنف F (من النوع نفسه). where = 'car' (قافلة) أو 'farm' (مزرعة في مدينة)
  pairSet(S, where, key, F, M) {
    if (!hybridOpen(S)) return NO('التهجين يُفتح عند المستوى ' + HYB_LV + ' في مسيرتك');
    const h = where === 'farm' ? farmOf(S, key) : carById(S, key); if (!h) return NO(where === 'farm' ? 'لا مزرعة هنا' : 'لا قافلة');
    if (where === 'car' && h.left > 0) return NO('القافلة في الطريق');
    if (!GD[F] || !GD[F].live || !BREED[F]) return NO('لا تُربّى هذه السلعة');
    if (!M || M === F) { if (h.pair) delete h.pair[F]; return OK('عادت إناث ' + GD[F].name + ' للتلقيح بذكور صنفها'); }
    if (spOf(M) !== spOf(F)) return NO('لا يتزاوج إلا صنفان من نوع واحد');
    if (GD[M].hyb && GD[F].hyb) return NO('لا تلقيح بين هجينين هنا: اختر صنفاً أصيلاً');
    if (!(((h.herd || {})[F] || 0) >= 1)) return NO('لا إناث من ' + GD[F].name + ' عندك');
    if (!(((h.herd || {})[M] || 0) >= 1) || malesOf(h, M) < 1) return NO('لا ذكر من ' + GD[M].name + ' عندك');
    h.pair = h.pair || {}; h.pair[F] = M; learnReact(S, 'pairSet');
    return OK('إناث ' + GD[F].name + ' تُلقَّح الآن بذكور ' + GD[M].name + ': المواليد هجين');
  },
  haggleStart(S, g, side, qty) {
    if (!haggleOpen(S)) return NO('تُفتح المساومة عند المستوى ' + HAGGLE.lv + ' في مسيرتك');
    const car = mainCar(S); if (car.left > 0) return NO('القافلة في الطريق'); const c = S.cities[car.city];
    if (!GD[g] || (side !== 'buy' && side !== 'sell')) return NO('مساومة غير صحيحة');
    qty = Math.min(Math.floor(+qty || 0), HAGGLE.maxQty); if (qty < 1) return NO('حدّد الكمية أولاً');
    ctxFor(S, car.city);
    if (side === 'buy') { if (!sells(c, g) || !breedOpen(S, g)) return NO('لا تُباع هنا'); qty = Math.min(qty, Math.floor(c.stock[g] || 0)); }
    else { qty = Math.min(qty, Math.floor(car.cargo[g] || 0) + Math.floor((car.herd || {})[g] || 0)); }
    if (qty < 1) return NO(side === 'buy' ? 'لا مخزون هنا' : 'لا بضاعة معك');
    if (unitPrice(c, g) * qty < HAGGLE.minValue) return NO('الصفقة صغيرة على المساومة: تبدأ من ' + HAGGLE.minValue + ' ريال');
    if (haggleLeft(S, c.id) < 1) return NO('اكتفى تجّار ' + c.name + ' من المساومة اليوم، عُد غداً');
    const h = hgOf(S); h.used[c.id] = (h.used[c.id] || 0) + 1;
    const cu = hgCult(S, c.id), ws = hgWeights(S, c.id), pickMood = () => { const r = rndB(S) * (ws[0] + ws[1] + ws[2]); return r < ws[0] ? HG_MOODS[0] : r < ws[0] + ws[1] ? HG_MOODS[1] : HG_MOODS[2]; };
    h.game = { city: c.id, cc: c.country, culture: cu.name, g, side, qty, round: 0, wins: 0, miss: 0, rounds: cu.rounds, maxMiss: cu.miss, step: cu.step, best: Object.assign({}, cu.best), moods: Array.from({ length: cu.rounds }, pickMood), log: [], done: false, mul: 1 };
    learnReact(S, 'haggleStart');
    return { ok: true, msg: 'بدأت المساومة', game: h.game };
  },
  haggleChoose(S, choice) {
    const h = hgOf(S), G = h.game; if (!G || G.done) return NO('لا مساومة جارية');
    if (!['firm', 'ref', 'praise'].includes(choice)) return NO('أسلوب غير معروف');
    const cu = HG_CULT[G.cc] || HG_CULT.sa, best = (G.best || cu.best)[G.moods[G.round]], mood = G.moods[G.round], right = best === choice, rounds = G.rounds || HAGGLE.rounds, maxMiss = G.maxMiss || HAGGLE.maxMiss;
    G.log.push({ mood, choice, right, best }); if (right) G.wins++; else G.miss++; G.round++;
    if (G.round >= rounds || G.miss >= maxMiss) {
      G.done = true; if (G.wins >= rounds && G.miss === 0) achFlag(S, 'haggle_read'); const step = (G.step || HAGGLE.step) * perkMul(S, 'haggle');
      const lore = (S.player.hgLore = S.player.hgLore || {}); lore[G.cc] = lore[G.cc] || {}; G.log.forEach(l => { lore[G.cc][l.mood] = l.best; }); // خبرة اللاعب: ما انكشف له من طبع هذا السوق
      if (G.wins > 0) { G.mul = G.side === 'buy' ? 1 - step * G.wins : 1 + step * G.wins; h.vouch = { city: G.city, g: G.g, side: G.side, mul: G.mul, left: G.qty, day: S.day, wins: G.wins }; learnReact(S, 'haggleWin', 2); }
      else learnReact(S, 'haggleFail', 2);
    }
    return { ok: true, right, best, mood, done: G.done, wins: G.wins, miss: G.miss, mul: G.mul, trait: right ? '' : cu.trait };
  },
  haggleClose(S) { const h = hgOf(S); h.game = null; return OK('أُغلقت المساومة'); },
  dlgOpen(S, id) {
    const D = DLG.DIALOGS[id]; if (!D) return NO('لا حوار');
    const car = mainCar(S); if (car.city !== D.city || car.left > 0) return NO('عليك أن تكون في ' + S.cities[D.city].name + ' لتتحدث هنا');
    const st = stOf(S); let node = null;
    for (const r of D.start) if (dlgOk(S, r.if)) { node = r.node; break; }
    st.cur = { id, node: node || Object.keys(D.nodes)[0] };
    return { ok: true, msg: '', view: dlgView(S) };
  },
  dlgChoose(S, k) {
    const st = stOf(S), cur = st.cur; if (!cur) return NO('لا حوار جارٍ');
    const D = DLG.DIALOGS[cur.id], N = D.nodes[cur.node], o = (N.opts || [])[k];
    if (!o || !dlgOk(S, o.if)) return NO('خيار غير متاح');
    const msgs = dlgDo(S, o.do, D.city);
    if (o.end || !o.next) st.cur = null; else cur.node = o.next;
    return { ok: true, msg: msgs.join(' · '), msgs, view: dlgView(S) };
  },
  dlgClose(S) { stOf(S).cur = null; return OK('أُغلق الحوار'); },
  roadChoose(S, choice) { if (!S.road) return NO('لا حدث على الطريق'); if (!['fight', 'pay', 'evade'].includes(choice)) return NO('اختيار غير صحيح'); return roadResolve(S, choice); },
  buildButcher(S, city) {
    if (S.phase < FARM_PHASE) return NO('تُفتح في الطور ' + FARM_PHASE);
    const c = S.cities[city], pr = S.player.props[city]; ctxFor(S, city);
    if (!pr || !pr.farm) return NO('الملحمة لصاحب مزرعة: ابنِ مزرعة في ' + (c ? c.name : 'المدينة') + ' أولاً');
    if (pr.butcher) return NO('لك ملحمة هنا');
    const cost = Math.round(BUTCHER_COST * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); pr.butcher = { lv: 1, sold: 0, rev: 0, today: 0 }; learnReact(S, 'buildButcher');
    return OK('فتحتَ ملحمة في ' + c.name + ': تذبح من مزرعتك وتبيع اللحم الطازج في السوق');
  },
  cutMeat(S, city, g, qty) {
    const f = farmOf(S, city), pr = S.player.props[city]; if (!f || !pr) return NO('لا مزرعة هنا'); if (!pr.butcher) return NO('تحتاج ملحمة في هذه المدينة');
    if (!MEAT[g]) return NO(spOf(g) === 'horse' ? 'لا تُذبح الخيل' : 'لا تُذبح هذه');
    const have = Math.floor(f.herd[g] || 0); let n = Math.min(Math.floor(qty), have); if (n < 1) return NO('لا ' + GD[g].name + ' بالغة');
    const ym = MEAT[g] * hyMul(f, g, 'meat') * climateFactor(S, 'farm', city) * FRESH_X, room = Math.floor(storeRoom(S, city) / GD.meat.w), maxN = Math.floor(room / ym); n = Math.min(n, maxN); if (n < 1) return NO('مخزنك لا يتسع للحم الطازج');
    const b0 = f.herd[g]; f.herd[g] = b0 - n; herdScale(f, g, b0); const cost = takeBasis(pr.basis || (pr.basis = {}), g, n), y = Math.floor(n * ym);
    pr.store.meat = (pr.store.meat || 0) + y; addBasis(pr.basis, 'meat', y, cost); learnReact(S, 'cutMeat');
    return OK('ذبحت ' + n + ' ' + GD[g].name + ' فصار عندك ' + y + ' لحماً طازجاً: تبيعه الملحمة خلال أيام قبل أن يفسد');
  },
  slaughter(S, city, g, qty) {
    const f = farmOf(S, city), pr = S.player.props[city]; if (!f) return NO('لا مزرعة هنا'); if (!MEAT[g]) return NO(spOf(g) === 'horse' ? 'لا تُذبح الخيل هنا' : 'لا تُذبح هذه');
    const have = Math.floor(f.herd[g] || 0); let n = Math.min(Math.floor(qty), have); if (n < 1) return NO('لا ' + GD[g].name + ' بالغة');
    const ym = MEAT[g] * hyMul(f, g, 'meat') * climateFactor(S, 'farm', city), room = Math.floor(storeRoom(S, city) / GD.jerky.w), maxN = Math.floor(room / ym); n = Math.min(n, maxN); if (n < 1) return NO('مخزنك لا يتسع للحم المجفف');
    const b0 = f.herd[g]; f.herd[g] = b0 - n; herdScale(f, g, b0); const cost = takeBasis(pr.basis || (pr.basis = {}), g, n), y = Math.floor(n * ym);
    pr.store.jerky = (pr.store.jerky || 0) + y; addBasis(pr.basis, 'jerky', y, cost);
    return OK('ذبحت ' + n + ' ' + GD[g].name + ' وحصلت على ' + y + ' من اللحم المجفف في مخزنك');
  },
  hireStaff(S, city, role) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    const pr = S.player.props[city], c = S.cities[city]; ctxFor(S, city);
    if (!pr || !WK[role]) return NO('لا عمل هنا');
    if (role === 'seller' && !pr.shops.length) return NO('لا دكان تحتاج بائعاً');
    if (role === 'keeper' && !pr.whs) return NO('لا مخزن يحتاج أميناً');
    if (role === 'farmer' && !pr.farm) return NO('لا مزرعة تحتاج مزارعاً');
    // العامل المتأخر الأجر يعمل بنصف طاقته ويشغل مكاناً؛ إن امتلأ حدّ المدينة بهم يُستبدل الأكثر تأخراً بدل أن يُغلق التوظيف
    let swap = null;
    if (hirePool(S, city) < 1) {
      swap = staffOf(S, city).filter(x => x.late > 0).sort((a, b) => (b.role === role) - (a.role === role) || b.late - a.late)[0];
      if (!swap) return NO('لا عمّال متاحون في ' + c.name + ': حدّ المدينة ' + hireCap(S, city) + ' عاملاً وكلهم عندك');
    }
    const w = { id: S.nextId++, role, days: 0, late: 0 }, fee = wkWage(S, c, w) * 2; if (S.player.gold < fee) return NO('رصيدك لا يكفي رسوم التوظيف (' + fee + ' ريال)');
    pPay(S, 'staff', fee, true); pr.staff = pr.staff || []; if (swap) pr.staff = pr.staff.filter(x => x !== swap); pr.staff.push(w); return OK((swap ? 'استبدلتَ عاملاً متأخر الأجر: ' : '') + 'وظّفت ' + WK[role].name + ' في ' + c.name + ' (' + wkWage(S, c, w) + ' ريال يومياً)');
  },
  hireFill(S, city) {
    const pr = S.player.props[city]; if (!pr) return NO('لا عقار هنا'); let n = 0, guard = 0, why = '';
    while (guard++ < 40) {
      const role = sellerPts(S, city) + 1e-9 < sellerNeed(S, city) ? 'seller' : staffOf(S, city).filter(w => w.role === 'keeper').length < keeperNeed(S, city) ? 'keeper' : farmCover(S, city) < 1 - 1e-9 ? 'farmer' : null;
      if (!role) break; const hr = A.hireStaff(S, city, role); if (!hr.ok) { why = hr.msg; break; } n++;
    }
    return n ? OK('وظّفت ' + n + ' عاملاً') : NO(why || 'الطاقم مكتمل');
  },
  fireStaff(S, city, id) {
    const pr = S.player.props[city]; if (!pr || !(pr.staff || []).some(w => w.id === id)) return NO('لا عامل');
    const i = pr.staff.findIndex(w => w.id === id); pr.staff.splice(i, 1); return OK('سرّحت عاملاً واحداً'); // عامل واحد فقط ولو تكرر المعرّف في حفظ قديم
  },
  shopSetItem(S, city, shopId, g, price, auto, carry) {
    const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان');
    price = clamp(price, 0.5, 3);
    const ex = sh.items.find(i => i.g === g);
    if (ex) { ex.price = price; ex.auto = auto !== false; if (carry != null) ex.carry = !!carry; return OK('حُدّث السعر'); }
    if (sh.items.length >= shItemsMax(sh)) return NO((shKind(sh) === 'stall' ? 'البسطة' : 'الدكان') + ' تتسع لـ ' + shItemsMax(sh) + ' سلع فقط');
    sh.items.push({ g, price, auto: auto !== false, carry: !!carry, buyBelow: SHOP_BUYBELOW, target: 60, sold: 0, revenue: 0 });
    return OK('أُضيفت ' + GD[g].name + ' للدكان');
  },
  /* «جهّز دكانك»: أنسب سلعة للبدء (الأعلى طلباً بقيمتها في المدينة وفيها مخزون في السوق) بالسعر الافتراضي وتعبئة آلية */
  shopQuick(S, city, shopId) {
    const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان');
    if (sh.items.length >= shItemsMax(sh)) return NO('الدكان ممتلئ بالسلع');
    const c = S.cities[city], have = new Set(sh.items.map(i => i.g));
    const cand = GIDS.filter(x => !have.has(x) && sells(c, x) && !GD[x].sp && !GD[x].live && c.stock[x] >= 30), buyable = cand.filter(x => ratio(c, x) < SHOP_BUYBELOW);
    const g = (buyable.length ? buyable : cand.slice().sort((a, b) => ratio(c, a) - ratio(c, b)).slice(0, 1)).sort((a, b) => c.dem[b] * unitPrice(c, b) - c.dem[a] * unitPrice(c, a))[0]; // نفضّل ما يرخص الآن فتبدأ التعبئة فوراً
    if (!g) return NO('لا سلعة مناسبة الآن، أضف سلعة بنفسك');
    return A.shopSetItem(S, city, shopId, g, SHOP_PRICE0, true);
  },
  shopAutoAll(S, city) { let n = 0; shopsOf(S, city).forEach(sh => sh.items.forEach(i => { if (!i.auto) { i.auto = true; n++; } })); return n ? OK('فُعّلت التعبئة الآلية لـ ' + n + ' سلعة') : NO('كلها مفعّلة'); },
  shopRemoveItem(S, city, shopId, g) { const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان'); sh.items = sh.items.filter(i => i.g !== g); return OK('أُزيلت السلعة'); },
  toStore(S, carId, g, qty) {
    const car = carById(S, carId), pr = S.player.props[car.city];
    if (!pr || !hasPresence(S, car.city) || car.left > 0) return NO('لا مخزن هنا');
    qty = Math.min(qty, Math.floor(car.cargo[g] || 0), Math.floor(storeRoom(S, car.city) / GD[g].w));
    if (qty <= 0) return NO('لا بضاعة أو المخزن ممتلئ');
    const ql = qualOf(car.basis, g), bc = takeBasis(car.basis, g, qty); pr.basis = pr.basis || {}; addBasis(pr.basis, g, qty, bc, ql);
    car.cargo[g] -= qty; pr.store[g] = (pr.store[g] || 0) + qty; return OK('أودعت ' + qty + ' ' + GD[g].name);
  },
  fromStore(S, carId, g, qty) {
    const car = carById(S, carId), pr = S.player.props[car.city];
    if (!pr || car.left > 0) return NO('لا مخزن هنا');
    qty = Math.min(qty, Math.floor(pr.store[g] || 0), Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w));
    if (qty <= 0) return NO('لا مجال أو لا مخزون');
    const ql = qualOf(pr.basis, g), bc = takeBasis(pr.basis || (pr.basis = {}), g, qty); addBasis(car.basis, g, qty, bc, ql);
    pr.store[g] -= qty; car.cargo[g] = (car.cargo[g] || 0) + qty; return OK('حمّلت ' + qty + ' ' + GD[g].name);
  },
  buildFactory(S, city, recipe) {
    if (S.phase < 3) return NO('يُفتح في الطور 3');
    const rc = RECIPES[recipe], c = S.cities[city]; if (!rc || !c) return NO('مصنع غير معروف'); ctxFor(S, city);
    if (!hasPresence(S, city)) return NO('يلزم دكان (ومخزن) في المدينة أولاً');
    const local = factoryLocal(c, rc), ex = S.player.factories.find(f => f.city === city && f.recipe === recipe);
    if (ex) { if (ex.level >= 3) return NO('أعلى مستوى'); const cost = local ? 2500 + ex.level * 2500 : Math.round(factoryBase(ex) * 0.4 * ex.level); if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); ex.level++; return OK('رُقّيت الورشة'); }
    if (local) { const cost = Math.round(4000 * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); S.player.factories.push({ id: S.nextId++, city, recipe, level: 1 }); return OK('بُنيت ' + rc.name); }
    // غير محلي
    const mc = factoryMakeBlock(S, city, recipe); if (mc) return NO(mc);
    const cost = MFG_COST(rc.out); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); S.player.factories.push({ id: S.nextId++, city, recipe, level: 1, local: false, hp: 100, since: S.day, set: { minBal: 0, maxBuy: 1.3, sell: 'hold' }, acc: 0, accCost: 0 });
    learnReact(S, 'factoryAbroad');
    return OK('بُنيت ' + rc.name + ' في ' + c.name + ' بجودة ≈ ' + Math.round(reputation(S).quality) + '٪ من الأصلي');
  },
  buyCraft(S, origin) {
    const bs = bossOf(S, origin); if (!bs) return NO('لا زعيم هنا');
    if (bs.craft) return NO('الإذن عندك مسبقاً'); if (bs.trust < CRAFT_TRUST) return NO('يحتاج ثقة ' + CRAFT_TRUST + ' (ثقته بك ' + Math.round(bs.trust) + ')');
    const cost = CRAFT_COST; if (S.player.gold < cost) return NO('تحتاج ' + cost); ctxFor(S, origin); pPay(S, 'pactFee', cost, true); bs.craft = true;
    return OK('نقلتَ صنعة ' + S.cities[origin].name + ': يحق لك تصنيع منتجها في مدن أخرى');
  },
  setFactory(S, id, key, val) {
    const f = S.player.factories.find(x => x.id === id); if (!f || !isAbroad(f)) return NO('لا مصنع');
    f.set = f.set || { minBal: 0, maxBuy: 1.3, sell: 'hold' };
    if (key === 'sell') { if (val !== 'now' && val !== 'hold') return NO('خيار غير صحيح'); f.set.sell = val; }
    else if (key === 'minBal') f.set.minBal = clamp(Math.round(+val || 0), 0, 100000);
    else if (key === 'maxBuy') f.set.maxBuy = clamp(+val || 1.3, 0.6, 2);
    else return NO('إعداد غير معروف');
    return OK('حُفظ الإعداد');
  },
  rescueFactory(S, id) {
    const f = S.player.factories.find(x => x.id === id); if (!f || !f.crisis) return NO('المصنع ليس في أزمة');
    const fine = Math.round(factoryValue(f) * FACT_HP.rescue); if (S.player.gold < fine) return NO('تحتاج ' + fine); ctxFor(S, f.city); pPay(S, 'fine', fine, true);
    f.crisis = null; f.hp = 50; f.late = 0; f.since = S.day - FACT_HP.grace + 10; return OK('أنقذتَ المصنع بغرامة ' + fine + ' ريال');
  },
  hireManager(S, city, lv, workerId, kind, id) {
    if(workerId!=null)return promoteWorker(S,city,workerId,kind,id);
    if (S.phase < 3) return NO('يُفتح في الطور 3'); const pr = S.player.props[city]; if (!pr || !hasPresence(S, city)) return NO('يلزم دكان لك في المدينة');
    if(!pr.mgr||pr.mgr.rank===2)return NO('مدير الممتلك يُرقّى من عامل خبير عبر هرم فريقي.');
    lv = Math.max(1, Math.min(3, Math.floor(lv || 1))); const w = MGR[lv].wage, fee = w * 3; if (pr.mgr && pr.mgr.lv === lv) return NO('عندك ' + MGR[lv].name);
    if (S.player.gold < fee) return NO('رسوم التعيين ' + fee); ctxFor(S, city); pPay(S, 'staff', fee, true);
    pr.mgr = { lv, since: S.day, audit: S.day, late: 0 }; learnReact(S, 'hireMgr');
    return OK('عيّنتَ ' + MGR[lv].name + ' لأعمالك في ' + S.cities[city].name + ' (' + w + ' يومياً، يدير حتى ' + MGR[lv].cap + ' أصول)');
  },
  fireManager(S, city) { const pr = S.player.props[city]; if (!pr || !pr.mgr) return NO('لا مدير'); pr.mgr = null; return OK('سرّحتَ المدير'); },
  auditCity(S, city) { const pr = S.player.props[city]; if (!pr || !pr.mgr) return NO('لا مدير'); pr.mgr.audit = S.day; return OK('راجعتَ حسابات المدير: الأمور سليمة'); },
  invest(S, city, amt) { if (S.phase < 4) return NO('يُفتح في الطور 4'); amt = Math.min(amt, S.player.gold); if (!(amt > 0)) return NO('لا رصيد'); S.player.gold -= amt; S.player.bank.dep[city] = (S.player.bank.dep[city] || 0) + amt; return OK('ضاربتَ بـ' + Math.round(amt) + ' ريال في ' + S.cities[city].name + ': حصتك ' + Math.round(FIN.mud.share * 100) + '٪ من الربح، والخسارة على رأس المال'); },
  divest(S, city, amt) { const d = S.player.bank.dep[city] || 0; amt = Math.min(amt, d); if (!(amt > 0)) return NO('لا رصيد'); const fee = amt * FIN.mud.fee; S.player.bank.dep[city] -= amt; S.player.gold += amt - fee; sink(S, 'bankFee', fee); return OK('سحبتَ ' + Math.round(amt - fee) + ' (رسم إداري ' + Math.round(FIN.mud.fee * 100) + '٪)'); },
  murabaha(S, g, qty, term) {
    if (S.phase < 4) return NO('يُفتح في الطور 4'); const car = mainCar(S); if (car.left > 0) return NO('في الطريق'); if (bankLate(S)) return NO('عليك دَين متأخر: سدّده قبل تمويل جديد');
    const q = murabahaQuote(S, g, qty, +term); if (!q.ok) return NO(q.msg);
    const lim = Math.max(0, netWorth(S) * FIN.mur.limit - bankDebt(S)); if (q.face > lim) return NO('حدّ التمويل ' + Math.floor(lim) + ' ريال (50٪ من ثروتك ناقص ما عليك)');
    const c = S.cities[car.city]; ctxFor(S, car.city); const room = capOfCar(car) - loadOf(car), acct = { gold: 1e12 };
    const res = buyUnits(S, acct, c, g, q.n, room, car.cargo, true, false); if (!res.n) return NO('تعذّر الشراء');
    const face = res.cost * (1 + q.markup); addBasis(car.basis, g, res.n, face);
    S.player.bank.loans.push({ id: S.nextId++, type: 'mur', amt: face, face, markup: q.markup, day: S.day, due: S.day + q.term, g, n: res.n, late: 0 });
    return OK('اشترى لك المموّل ' + res.n + ' ' + GD[g].name + ' بـ' + Math.round(res.cost) + ' وباعها لك بـ' + Math.round(face) + ' (هامش ' + Math.round(q.markup * 100) + '٪ معلوم سلفاً) تسدّدها خلال ' + q.term + ' يوماً');
  },
  qard(S, amt) {
    if (S.phase < 4) return NO('يُفتح في الطور 4'); const car = mainCar(S); if (car.left > 0) return NO('في الطريق'); if (bankLate(S)) return NO('عليك دَين متأخر: سدّده أولاً');
    const bs = bossOf(S, car.city), lim = Math.min(FIN.qard.max, FIN.qard.base + FIN.qard.perTrust * Math.max(0, bs.trust - FIN.qard.trust));
    if (bs.trust < FIN.qard.trust) return NO('القرض الحسن يحتاج ثقة ' + FIN.qard.trust + ' عند زعيم ' + S.cities[car.city].name + ' (ثقتك ' + Math.round(bs.trust) + ')');
    if (S.player.bank.loans.some(l => l.type === 'qard' && l.city === car.city)) return NO('عندك قرض حسن قائم عند هذا الزعيم');
    amt = Math.floor(+amt || 0); if (!(amt >= 100) || amt > lim) return NO('المبلغ بين 100 و' + lim);
    S.player.gold += amt; S.player.bank.loans.push({ id: S.nextId++, type: 'qard', amt, face: amt, markup: 0, day: S.day, due: S.day + FIN.qard.days, city: car.city, late: 0 });
    return OK('أقرضك ' + bs.name + ' ' + amt + ' ريال قرضاً حسناً بلا زيادة، تردّها خلال ' + FIN.qard.days + ' يوماً');
  },
  settle(S, id) {
    const P = S.player; const L = id == null ? P.bank.loans.slice() : P.bank.loans.filter(l => l.id === id); if (!L.length) return NO('لا دَين'); let paid = 0;
    for (const l of L) { if(l.src==='salem'){paid+=payEarlyQard(S,l,l.amt);continue;} const p = Math.min(P.gold, l.amt); if (p > 0) { P.gold -= p; l.amt -= p; paid += p; P.led.exp.debtPaid = (P.led.exp.debtPaid || 0) + p; } }
    P.bank.loans = P.bank.loans.filter(l => l.src==='salem'?l.amt>1e-8:l.amt>0.5); return paid > 0 ? OK('سدّدتَ ' + Math.round(paid) + ' ريال' + (P.bank.loans.length ? '' : ' وبرئت ذمتك')) : NO('لا رصيد للسداد');
  },
  buySukuk(S) { if (S.phase < 4) return NO('يُفتح في الطور 4'); if (S.player.gold < FIN.sukuk.amt) return NO('تحتاج ' + FIN.sukuk.amt); S.player.gold -= FIN.sukuk.amt; S.player.bank.bonds.push({ amt: FIN.sukuk.amt, due: S.day + FIN.sukuk.days }); return OK('شاركتَ بصكّ في قافلة تجارية (' + FIN.sukuk.days + ' يوماً): الربح والخسارة بحسب نتيجة التجارة'); },
  upgradeMarket(S, city) {
    if (S.phase < 4) return NO('يُفتح في الطور 4');
    const c = S.cities[city]; if (c.tier >= 3) return NO('أعلى رتبة'); const cost = c.tier === 1 ? 8000 : 25000;
    if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); c.tier++; c.cap = capOf(c);
    news(S, 'ارتقى سوق ' + c.name + ' إلى الرتبة ' + c.tier + '.', 'good'); return OK('رُقّي السوق');
  },
  foundCity(S, country, good) {
    if (S.phase < 4) return NO('يُفتح في الطور 4');
    if (S.order.length >= 20) return NO('اكتمل العالم'); if (S.player.gold < 60000) return NO('تحتاج 60,000'); pPay(S, 'foundCity', 60000, true);
    const id = 'new' + S.nextId++, ct = CD[country];
    const d = { id, name: 'مستوطنة ' + ct.name + ' ' + (S.order.length - 15), country, x: ct.cx + rr(S, -60, 60), y: ct.cy + rr(S, -50, 50), size: 0.6, tax: 0.04, makes: [good, 'wheat'], owner: 'player' };
    S.cities[id] = makeCity(S, d); S.cities[id].pop = [150, 300, 120, 30]; S.order.push(id); ensureRisks(S); snapshotKnown(S, [id]);
    news(S, 'أسّست ' + d.name + '! تحصل على 20٪ من ضرائبها.', 'good'); return OK('تأسست المدينة');
  },
  exchange(S, from, to, amt) {
    if (from === to) return NO('اختر عملتين مختلفتين');
    const w = S.player.wallet; amt = Math.min(+amt || 0, w[from]); if (!(amt > 0.0001)) return NO('لا رصيد كافٍ في محفظة ' + CURS[from].name);
    const val = amt * rateOf(S, from), fee = val * feeOf(from, to) * perkMul(S, 'fxFee'), got = (val - fee) / rateOf(S, to);
    w[from] -= amt; w[to] += got; sink(S, 'exchange', fee); S.player.led.exp.exchange = (S.player.led.exp.exchange || 0) + fee;
    return OK('حوّلت ' + (from === 'au' || from === 'ag' ? amt.toFixed(2) : Math.round(amt)) + ' ' + CURS[from].name + ' إلى ' + (to === 'au' || to === 'ag' ? got.toFixed(2) : Math.round(got)) + ' ' + CURS[to].name + ' (رسم ' + Math.round(fee) + ' ريال)');
  },
  // --- الزعماء والعقود ---
  lobby(S, city, pts) {
    const bs = bossOf(S, city), c = S.cities[city]; if (!bs) return NO('لا زعيم هنا');
    if (!bossActive(S)) return NO('يُفتح في الطور 2');
    if (bs.ruler === 'player') return NO('أنت الحاكم أصلاً');
    pts = Math.max(1, Math.floor(pts || 5)); ctxFor(S, city);
    const cost = Math.round(pts * 150 * c.size * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'lobby', cost, true); bs.p = clamp(bs.p + pts, 0, 100); bs.trust = clamp(bs.trust - pts * 0.6, -100, 100);
    learnReact(S, 'giftLesson');
    return OK('كسبت ' + pts + ' نقاط نفوذ في ' + c.name + ' بـ ' + cost + ' ريال (الزعيم يضيق منك قليلاً)');
  },
  gift(S, city) {
    const bs = bossOf(S, city), c = S.cities[city]; if (!bs) return NO('لا زعيم هنا');
    if (!bossActive(S)) return NO('يُفتح في الطور 2');
    if (bs.ruler === 'player') return NO('أنت الحاكم');
    if (S.day - bs.gift < 10) return NO('أهديته قبل أيام، انتظر ' + (10 - (S.day - bs.gift)) + ' أيام');
    ctxFor(S, city); const cost = Math.round(500 * c.size * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'gift', cost, true); bs.gift = S.day; bs.trust = clamp(bs.trust + (6 + (loreStyle(bs, city) === 'gen' ? 3 * (bs.temper ?? 1) : 0)), -100, 100);
    learnReact(S, 'giftLesson');
    return OK('أهديت ' + bs.name + ' هدية بـ ' + cost + ' ريال: ثقته بك ' + Math.round(bs.trust));
  },
  negotiate(S, city, type) {
    const bs = bossOf(S, city); if (!bs || !PACTS[type]) return NO('لا عرض');
    const why = pactBlock(S, city, type); if (why) return NO(why);
    if (bs.disc[type] && bs.disc[type] > S.day) return NO('فاوضتَه فعلاً: العرض الجديد قائم');
    const sty = loreStyle(bs, city), chance = clamp(0.35 + bs.trust / 200 + bossShare(bs) * 0.3 + (sty === 'patient' && S.day - (bs.lastNeg == null ? -99 : bs.lastNeg) >= 5 ? 0.1 * (bs.temper ?? 1) : 0), 0.1, 0.85); bs.lastNeg = S.day;
    if (rnd(S) < chance) { bs.disc[type] = S.day + 10; return OK('نجحت المفاوضة: خفّض ' + bs.name + ' الشروط 20٪ (العرض قائم 10 أيام)'); }
    bs.trust = clamp(bs.trust - (5 + (sty === 'stern' ? 3 * (bs.temper ?? 1) : 0)), -100, 100); bs.cd = S.day + 3;
    return NO('رفض ' + bs.name + ' التفاوض وغضب منك (ثقة ' + Math.round(bs.trust) + ')');
  },
  signPact(S, city, type) {
    const why = pactBlock(S, city, type); if (why) return NO(why);
    const bs = bossOf(S, city), t = pactTerms(S, city, type); ctxFor(S, city);
    if (t.upfront > 0) { if (S.player.gold < t.upfront) return NO('الدفعة المقدّمة ' + t.upfront); pPay(S, 'pact', t.upfront, true); }
    bs.pacted = true; S.player.pacts.push({ id: S.nextId++, city, type, left: t.days, total: t.days, daily: t.daily, penalty: t.penalty, share: t.share, since: S.day });
    delete bs.disc[type]; if (type === 'exclusive') learnReact(S, 'exclSign');
    return OK('وقّعت ' + PACTS[type].name + ' مع ' + bs.name + ' لمدة ' + t.days + ' يوماً');
  },
  breakPact(S, city) {
    const pc = pactIn(S, city), bs = bossOf(S, city); if (!pc) return NO('لا عقد');
    ctxFor(S, city); const pay = Math.min(pc.penalty, S.player.gold); if (pay > 0) pPay(S, 'pactPenalty', pay, true);
    S.player.pacts = S.player.pacts.filter(x => x !== pc); bs.trust = clamp(bs.trust - 30, -100, 100); bs.cd = S.day + 15; repOf(S.player).broke++;
    return OK('فسخت العقد ودفعت ' + Math.round(pay) + ' بنداً جزائياً. غضب ' + bs.name + ' منك.');
  },
  work(S) { const car = mainCar(S); if (car.left > 0) return NO('أنت في الطريق'); if (S.player.gold > 150) return NO('لا تحتاج؛ عندك ذهب'); S.player.gold += 40; S.player.led.inc.labor = (S.player.led.inc.labor || 0) + 40; fauc(S, 'labor', 40); return OK('اشتغلت حمّالاً في السوق: +40'); },
};

for (const k of Object.keys(A)) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }

