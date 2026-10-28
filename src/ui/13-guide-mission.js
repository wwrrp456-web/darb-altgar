/* ---------- الجولة التعليمية ---------- */
const hasCargo = () => Object.keys(main().cargo).some(g => main().cargo[g] >= 1);
const sellKey = () => { const t = S.player.trades[0]; return t ? t.day + '|' + t.q + '|' + Math.round(t.net) : ''; };
function nearestDomestic() {
  const m = main(), c = S.cities[m.city];
  return S.order.filter(id => id !== m.city && S.cities[id].country === c.country).sort((a, b) => E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0];
}
function lastSellLine() {
  const t = S.player.trades.find(x => x.side === 'sell'); if (!t) return 'بعت وتعلّمت.';
  const cost = t.net - t.pl, pc = cost > 0 ? Math.round(100 * t.pl / cost) : 0;
  return t.pl >= 0 ? `آخر صفقة: <b class="cheap">ربحت ${fmt(t.pl)} ريال</b> (${pc}٪ على ما دفعت).` : `آخر صفقة: <b class="dear">خسرت ${fmt(-t.pl)} ريال</b>. لا بأس: الخسارة الأولى أرخص معلّم.`;
}
// أنسب صفقة للمبتدئ: من أفضل الصفقات داخل بلده أولاً (بلا جمارك)، وإلا الأفضل عموماً
function tutPlan() {
  if (S.tut.f.plan) return S.tut.f.plan;
  const m = main(), hc = S.cities[m.city].country, all = deals();
  const big = all.filter(o => o.q >= 3 && o.profit >= 50), pool = (big.length ? big : all.filter(o => o.q >= 3).length ? all.filter(o => o.q >= 3) : all).slice().sort((x, y) => (y.pct || 0) - (x.pct || 0)), dom = pool.filter(o => S.cities[o.d].country === hc), pick = dom[0] || pool[0];
  const plan = pick ? { g: pick.g, d: pick.d, q: pick.q, profit: Math.round(pick.profit), foreign: S.cities[pick.d].country !== hc } : { g: 'wheat', d: nearestDomestic(), q: 10, profit: 0, foreign: false };
  if (S.tut.i >= 1) S.tut.f.plan = plan; return plan;
}
// أفضل مدينة لبيع ما تحمله الآن (داخل البلد أولاً إن ربحت فيها)
function tutDest() {
  const m = main(), hc = S.cities[m.city].country, held = E.GIDS.filter(g => (m.cargo[g] || 0) >= 1).sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0];
  if (!held) return { d: nearestDomestic(), profit: 0 };
  const opts = E.sellOptions(S, m.city, held, Math.floor(m.cargo[held]), E.avgCost(m.basis, held) || E.mid(held), m);
  const dom = opts.filter(o => o.country === hc && o.profit > 0)[0], best = dom || opts[0];
  return { d: best.city, g: held, profit: Math.round(best.profit), foreign: best.country !== hc };
}
/* ---------- تظليل عمّ سالم: يدلّك على الزر المطلوب في المستويات 1–3 ---------- */
let hlKey = '';
/* ---------- «مهمة عمّ سالم»: خطوة واحدة واضحة بزر ينفّذها فعلاً (متوافقة مع الخيارات) ---------- */
const restText = rs => `حقّق ${rs.k} صفقات رابحة${rs.home ? ' في ' + CD[rs.home].name : ''}${rs.gold ? ' وابلغ رصيداً ' + fmt(rs.gold) + ' ريال' : ''}${rs.plan ? ' وفعّل خطة ظافر' : ''}`;
const MIN_MARGIN = 0.15, LV_START = ['market', 'market', 'market', 'market', 'market', 'market', 'market', 'lords', 'market', 'market'];
const guideOn = () => { try { const lv = S.learn && S.learn.char && !NOLEARN ? lvlOf() : null; return !!lv && lv.mode === 'guide' && !S.learn.rest && !E.stageStatus(S)?.waiting; } catch (e) { return false; } };
const planOn = () => null;
function sellAll() {
  const m = main(); let tot = 0, n = 0, pl = 0, saved = 0; const left = [], had = S.player.trades.some(t => t.side === 'sell' && t.pl > 0);
  GIDS.forEach(x => { const k = Math.floor(m.cargo[x] || 0); if (k > 0) { const b = S.player.gold; const r = A.sell(S, m.id, x, k); if (r.ok) { n += k; tot += r.net || 0; pl += r.pl || 0; saved += r.saved || 0; } else left.push(GD[x].name); } });
  if (n && !had && pl > 0) showReceipt(firstProfitCard({ pl }, { saved, left }));
  else if (n) showReceipt({ title: 'بعت ' + n + ' وحدة من بضاعتك', rows: [['صافي البيع (بعد الرسوم)', rfmt(tot) + ' ريال'], ['ربح البيع مقارنة بتكلفتك', (pl >= 0 ? '+' : '-') + rfmt(Math.abs(pl)) + ' ريال', pl >= 0 ? 'cheap' : 'dear']], note: left.length ? 'تعذّر بيع: ' + left.join('، ') : '' });
  return act({ ok: n > 0, msg: n ? 'بعت ' + n + ' وحدة بصافي ' + fmt(tot) + ' ريال' : 'لا بضاعة للبيع' });
}
function sailTo(to) { const m = main(), r = A.sail(S, m.id, to, paceLv); if (r.ok) { paceLv = 0; toast(r.msg); sfx('depart'); focusTrip(m); sel = m.city; leaveTo('map'); setSpeed(speed || 1); } else act(r); }
function travelTo(to) { const m = main(), r = A.travel(S, m.id, to, paceLv); if (r.ok) { paceLv = 0; toast(r.msg); focusTrip(m); sel = m.city; leaveTo('map'); setSpeed(speed || 1); } else act(r); }
/* م1: أرخص سلعة يوجد لها سوق أغلى نبيعها فيه (ومسموح السفر إليه)، وإلا أرخص سلعة */
/* أول صفقة للمبتدئ (WP-07): ربح صافٍ أكبر من صفر بعد المؤن والرسوم، ووجهتها داخل بلده وأقربها، وشراؤها في الأخضر (أرخص من المرجعي بـ15%) ما أمكن؛ وإلا أنسب ما يوجد */
/* درجة أمان الصفقة الأولى: 3 بضاعة لا تتلف وهامش 12% فأكثر، 2 بضاعة لا تتلف وربح موجب، 1 تتلف لكن هامشها يتحمل ضياع وحدة، 0 غير ذلك (قد تضيع منها وحدة بالصدفة في الطريق) */
function tutTier(g, net, cost, unit) { const u = unit || cost / 5; return !GD[g].spoil ? (net >= 0.12 * cost ? 3 : 2) : (net >= 0.12 * cost + u * 1.1 ? 1 : 0); }
function tutFirstDeal() {
  const m = main(), c = S.cities[m.city], hc = c.country, wheat = E.unitPrice(c, 'wheat'), out = [];
  E.GIDS.forEach(g => {
    if (g === 'wheat' || GD[g].live || !E.sells(c, g) || (c.stock[g] || 0) < 5) return;
    const price = E.unitPrice(c, g), room = Math.floor((E.capOfCar(m) - E.loadOf(m)) / GD[g].w), q = Math.max(1, Math.min(5, room, Math.floor(S.player.gold / (price * 1.05)))); if (price * q > S.player.gold * 0.8) return;
    const green = price / E.refPrice(c, g) < 0.85;
    E.sellOptions(S, m.city, g, q, price).forEach(o => {
      if (o.city === m.city || o.profit <= 0 || E.travelBlock(S, m, o.city)) return;
      const days = E.tripDays(S, m, m.city, o.city), net = o.profit - E.supplyNeed(m, days) * wheat;
      if (net > 0) out.push({ g, dest: o.city, days, net, green, dom: S.cities[o.city].country === hc, tier: tutTier(g, net, price * q) }); // safe: بضاعة لا تتلف في الطريق (spoil=0) وهامش يمتص الانزلاق وتغيّر السعر
    });
  });
  out.sort((a, b) => (b.tier - a.tier) || (b.dom - a.dom) || (b.green - a.green) || (a.days - b.days) || (b.net - a.net));
  return out[0] || null;
}
function tutFirstDeal2(g0) { // وجهة بيع ما في القافلة: ربح صافٍ بعد المؤن، داخل البلد، الأقرب
  const m = main(), c = S.cities[m.city], hc = c.country, wheat = E.unitPrice(c, 'wheat'), q = Math.floor(m.cargo[g0]);
  const opts = E.sellOptions(S, m.city, g0, q, E.avgCost(m.basis, g0) || E.mid(g0), m).filter(o => o.city !== m.city && o.profit > 0 && !E.travelBlock(S, m, o.city)).map(o => { const days = E.tripDays(S, m, m.city, o.city); return { city: o.city, days, net: o.profit - E.supplyNeed(m, days) * wheat, dom: S.cities[o.city].country === hc, tier: tutTier(g0, o.profit - E.supplyNeed(m, days) * wheat, (E.avgCost(m.basis, g0) || E.mid(g0)) * q, E.avgCost(m.basis, g0) || E.mid(g0)) }; }).filter(o => o.net > 0);
  opts.sort((a, b) => (b.tier - a.tier) || (b.dom - a.dom) || (a.days - b.days) || (b.net - a.net)); return opts[0] || null;
}
/* أقرب سوق في بلدك فيه (حسب الأسعار المعروفة لك) صفقة أولى بضاعتها لا تتلف وهامشها 12% فأكثر: نفتّشه فقط حين لا يوجد هنا ما يُطمأنّ إليه */
function tutScoutCity() {
  const m = main(), hc = S.cities[m.city].country, K = S.player.known; let best = null;
  S.order.forEach(d => {
    if (d === m.city || S.cities[d].country !== hc || E.travelBlock(S, m, d) || !K[d]) return;
    E.GIDS.forEach(g => {
      if (g === 'wheat' || GD[g].live || GD[g].spoil || !E.sells(S.cities[d], g) || !K[d].p[g] || K[d].p[g] * 3 > S.player.gold * 0.8) return;
      S.order.forEach(e => {
        if (e === d || S.cities[e].country !== hc || !K[e] || !K[e].p[g]) return;
        const mg = (K[e].p[g] * (1 - S.cities[e].tax) - K[d].p[g] * 1.02) / K[d].p[g], days = E.tripDays(S, m, m.city, d);
        if (mg >= 0.12 && (!best || mg > best.mg || (mg === best.mg && days < best.days))) best = { d, g, e, mg, days };
      });
    });
  });
  return best;
}
function lv1Good() {
  const fd = tutFirstDeal(); if (fd) return fd.g;
  const m = main(), c = S.cities[m.city], gs = E.GIDS.filter(g => g !== 'wheat' && !GD[g].live && E.sells(c, g) && (c.stock[g] || 0) >= 5 && E.unitPrice(c, g) * 5 <= S.player.gold * 0.8).sort((a, b) => E.ratio(c, a) - E.ratio(c, b));
  return gs.find(g => E.sellOptions(S, m.city, g, 5, E.unitPrice(c, g)).some(o => o.city !== m.city && o.profit > 0 && !E.travelBlock(S, m, o.city))) || gs[0] || null;
}
function cheapestGood() {
  const c = S.cities[main().city]; let best = null, br = 9;
  E.GIDS.forEach(g => { if (g === 'wheat' || GD[g].live || !E.sells(c, g) || (c.stock[g] || 0) < 3 || E.unitPrice(c, g) * 3 > S.player.gold * 0.8) return; const r = E.ratio(c, g); if (r < br) { br = r; best = g; } });
  return best;
}
function pickDeal(foreign, excl, homeOnly) {
  const hc = S.cities[main().city].country;
  const all = deals().filter(o => (!foreign || S.cities[o.d].country !== hc) && (!homeOnly || S.cities[o.d].country === homeOnly) && !(excl && excl.includes(o.g))).sort((a, b) => b.pct - a.pct);
  return { good: all.find(o => o.pct >= MIN_MARGIN) || null, best: all[0] || null };
}
const mpct = v => Math.round(v * 100);
function dealMsg(o) {
  const m = main(), price = marketView(m.city).p[o.g], cost = o.q * price;
  return `اشترِ <b>${o.q} ${GD[o.g].name}</b> هنا وبِعها في <b>${cityName(o.d)}</b> (${dayAr(o.days)}). تدفع ≈ ${fmt(Math.round(cost))} ريال وتربح ≈ <b class="cheap">${fmt(Math.round(o.profit))}</b>، أي <b>هامش ${mpct(o.pct)}٪</b>`;
}
const scr = (to, ct2) => ({ k: 'screen', to, ct: ct2 });
/* مسار «اقرأ البطاقة ← اضغطها ← نفّذ»: المرحلة الحالية لخطوة فيها goal، أو null إن كان الدور على زر الفعل نفسه */
function mpath(st) {
  const gl = st && st.goal; if (!gl) return null; const m = main();
  const navTo = (id, lead) => ({ sel: `#nav [data-go="${id}"]`, msg: `${lead} افتح <b>${(SCREENS.find(x => x[0] === id) || [0, 0, id])[2]}</b> من الشريط السفلي.` });
  if (dg && gl.k !== 'good') return { sel: '#modal [data-act="gdclose"]', msg: 'أغلق هذه النافذة أولاً.' };
  if (gl.k === 'screen') { if (screen !== gl.to) return navTo(gl.to, st.msg); if (gl.ct && ct !== gl.ct) return { sel: `[data-ct="${gl.ct}"]`, msg: st.msg + ' اختر التبويب المضيء.' }; return null; }
  if (gl.k === 'travel') {
    if (screen !== 'map') return navTo('map', gl.lead);
    if (sel !== gl.to) { const country=S.cities[gl.to].country; if(mapC!=='all'&&mapC!==country)return {sel:`#screen button[data-mc="${country}"]`,msg:'اختر دولة الوجهة أولاً.'};return {sel:`#screen .map-cities button[data-city="${gl.to}"]`,msg:`اختر <b>${cityName(gl.to)}</b> من قائمة المدن.`}; }
    return { sel: `[data-act="go"][data-to="${gl.to}"]`, msg: `اضغط «سافر إلى ${cityName(gl.to)}».`, fin: true };
  }
  if (gl.k === 'good') {
    if (screen !== 'market') return navTo('market', gl.read);
    if (sel !== m.city) return { sel: `#screen [data-city="${m.city}"]`, msg: `اختر سوق <b>${cityName(m.city)}</b> (مدينة قافلتك).` };
    if (dg && dg !== gl.g) return { sel: '#modal [data-act="gdclose"]', msg: 'أغلق هذه النافذة ثم اضغط البطاقة المطلوبة.' };
    if (dg !== gl.g) return { sel: `.gcard[data-gd="${gl.g}"]`, msg: gl.read };
    return { sel: gl.side === 'buy' ? '#modal [data-act="buy"]' : '#modal [data-act="sell"][data-q="999"]', msg: gl.act, fin: true };
  }
  return null;
}
function missionGoal() { const st = missionStep(); if (!st || !st.goal) return null; return guidanceOf(st.lv) === 'full' || helpOn() ? st.goal : null; }
function missionStep() {
  const L = S.learn; if (!L || !L.char || NOLEARN) return null;
  if (E.stageOf(S)?.n === 20) return { lv: lvlOf(), msg: 'راجع حساب الزكاة في ملف التاجر.', label: 'احسب زكاتي', run: () => { zview = true; renderAll(true); } };
  if (E.stageOf(S)?.n === 21 && !L.freedom) {
    const lv = lvlOf(), city = main().city, dep = Object.values(S.player.bank.dep).reduce((a, b) => a + b, 0);
    if (dep < 100000 && S.player.gold > 1000) return { lv, msg: E.BAB.TABLETS.freedom.text, label: 'المضاربة', run: () => act(A.invest(S, city, Math.min(100000 - dep, S.player.gold * .5))) };
    return { lv, msg: E.BAB.TABLETS.freedom.text, label: 'تابع نشاط متاجرك', run: () => setSpeed(1) };
  }
  const rs = L.rest, lv = rs ? { n: 0, title: 'تمرين', mode: (lvlOf() || {}).mode, rest: rs } : lvlOf(); if (!lv) return null; const gl = rs ? [] : lv.goals(S); if (!rs && gl.every(g => g[1])) return null;
  const m = main(), ev = L.ev, M = L.m || (L.m = {}), cargo = hasCargo(), kinds = GIDS.filter(g => (m.cargo[g] || 0) >= 1), here = S.cities[m.city];
  const R = o => Object.assign({ lv, goals: gl }, o), nw = E.netWorth(S);
  if (m.left > 0) { // الرحلة جارية والوقت يمضي: لا زر «تابع الرحلة» (لا فائدة منه ويربك)؛ يظهر الزر فقط إن كان الوقت موقوفاً
    const o = { msg: `🐪 القافلة في الطريق إلى <b>${cityName(m.dest)}</b>، باقٍ ${dayAr(m.left)}.`, why: speed > 0 ? 'الرحلة جارية، انتظر وصولها.' : 'أثناء السفر يمضي الوقت وتنقص نفقة الطريق.' };
    return R(speed > 0 ? o : Object.assign(o, { label: '▶ تابع الرحلة', run: () => setSpeed(1) })); }
  const fd = S.player.famDebt;
  if (fd && fd.left > 0) {
    const need = Math.min(fd.left, Math.round(fd.amt0 * E.BAB.DEBT.installPct)) - (fd.mPaid || 0);
    if ((rs && rs.plan || L.ageStages && L.level >= 2) && !fd.plan) return R({ msg: 'فعّل <b>خطة ظافر</b>: من كل صفقة رابحة 70٪ لرأس مالك، و20٪ للحاج صالح، و10٪ لحصّالتك.', why: 'هكذا سدّد ظافر ديونه وبنى ثروته في وقت واحد.', label: '📜 فعّل الخطة', run: () => act(A.debtPlan(S, true)) });
    if (fd.due != null && fd.due - S.day <= 5 && need >= 1 && S.player.gold >= need + 100) return R({ msg: `اقترب موعد قسط الحاج صالح (بعد ${dayAr(Math.max(0, fd.due - S.day))}): ادفع <b>${fmt(Math.round(need))} ريال</b>.`, why: 'الوفاء بالقسط يرفع صبر الدائن وثقته بك.', label: `💳 ادفع القسط ${fmt(Math.round(need))}`, run: () => act(A.debtPay(S, need)) });
  }
  const gate = { 7: 2, 9: 3, 10: 4 }[lv.n], PH = E.PHASE_AT; let note = '';
  if (gate && S.phase < gate) note = `ثروتك ${fmt(Math.round(nw))} ومطلوب ${fmt(PH[gate - 1])} لفتح هذه الخطوة. واصل الصفقات لتنمو.`;
  const shopCity = (() => { try { const ok = id => S.cities[id].country === S.home && E.shopsOf(S, id).length < Math.min(E.shopLimit(S.cities[id]), E.rankSlots(S).shops), cost = id => E.shopCost(S, S.cities[id]), ids = Object.keys(S.cities).filter(ok); if (!ids.length) return m.city; const best = ids.reduce((a, b) => cost(b) < cost(a) ? b : a); return ok(m.city) && cost(m.city) <= cost(best) * 1.05 ? m.city : best; } catch (e) { return m.city; } })();
  if (!note && lv.n === 7 && !ev.buildShop) { try { const sc = E.shopCost(S, S.cities[shopCity]); if (S.player.gold < sc) note = `الدكان في ${cityName(shopCity)} يكلّف ${fmt(sc)} ريال ومعك ${fmt(Math.floor(S.player.gold))}. واصل الصفقات حتى تجمع ثمنه.`; } catch (e) {} }
  // خطوات المستويات الخاصة (بعد فتح الطور)
  if (!note) {
    if (lv.n === 6 && !ev.exchange) { const w = S.player.wallet, from = w.sar >= 50 ? 'sar' : 'usd', to = from === 'sar' ? 'usd' : 'sar', amt = from === 'sar' ? 50 : Math.max(1, Math.floor(w.usd * 0.3)); return R({ msg: `حوّل <b>${amt} ${E.CURS[from].name}</b> إلى ${E.CURS[to].name} لتجرّب الصرف.`, why: 'لكل تحويل رسم صغير، وهذا ما يُسمّى سعر الصرف.', goal: scr('cities', 'fx'), label: '💱 حوّل الآن', run: () => act(A.exchange(S, from, to, amt)) }); }
    if (lv.n === 7) {
      if (!ev.buildShop) return R({ msg: `توجّه إلى سجل العقارات، ومن هناك شيّد <b>دكانك الأول</b> في ${cityName(shopCity)} على بركة الله (أرخص مدن بلدك ثمناً).`, why: 'في الدكان تشتري بالجملة وتبيع بالتجزئة.', goal: scr('estate'), label: '🏬 شيّد دكاناً في ' + cityName(shopCity), run: () => act(A.buildShop(S, shopCity)) });
      const shp = ((S.player.props[m.city] || {}).shops || [])[0] || ((Object.values(S.player.props).find(p => p.shops && p.shops.length) || {}).shops || [])[0], shc = shp && Object.keys(S.player.props).find(c => S.player.props[c].shops.includes(shp));
      if (!ev.shopSetItem && shp) return R({ msg: 'هذه السلعة كلفة جملتها أقل مما تباع به للناس؛ اضغط الزر لتجهيز رفوف دكانك بها.', why: 'الفرق بين الجملة والتجزئة هو مجمل ربحك، ومنه تسدّد النفقات.', goal: scr('estate'), label: '🧺 جهّز دكانك', run: () => act(A.shopQuick(S, shc, shp.id)) });
      if (!ev.shopSold) return R({ msg: 'افتح تقرير البائع المالي بعد يوم بيع، وتأمل كم بعتَ وما الذي بقي لك صافياً بعد حسم النفقات.', why: 'الربح الصافي هو ما يبقى بعد أداء كل التكاليف.', goal: scr('estate'), label: '⏭ يوم جديد', run: () => $('bNext').click() });
    }
    if (lv.n === 8 && (ev.signPact || 0) < (E.stageOf(S)?.part || 1)) {
      for (const id of S.order) for (const t of Object.keys(E.PACTS)) if (!E.pactBlock(S, id, t)) { const tm = E.pactTerms(S, id, t); return R({ msg: `وقّع <b>${E.PACTS[t].name}</b> مع زعيم ${cityName(id)}. المقدّم ${fmt(tm.upfront)} ريال.`, why: 'الشراكة تعطيك ميزة مقابل التزامك، فاقرأ الشروط.', goal: scr('lords'), label: '🤝 وقّع الشراكة', run: () => act(A.signPact(S, id, t)) }); }
    }
    if (lv.n === 9 && (ev.agentBuy || 0) < (E.stageOf(S)?.part || 1)) {
      for (const id of S.order) for (const g of GIDS) { if (g !== 'wheat' && E.sells(S.cities[id], g)) { const q = E.agentQuote(S, id, g, 5); if (q.ok) return R({ msg: `اطلب <b>5 ${GD[g].name}</b> من ${cityName(id)} عبر وكيلك. الرسم ${fmt(Math.round(q.fee))} ريال.`, why: 'الوكيل يشتري عنك ويصل المخزن بعد أيام.', label: '📜 اطلب عبر الوكيل', run: () => act(A.agentBuy(S, id, g, 5)) }); } }
      return R({ msg: 'تحتاج مخزناً في إحدى مدنك ليصل إليه طلب الوكيل: ابنِ دكاناً أولاً.', label: '🏬 ابنِ دكاناً هنا', run: () => act(A.buildShop(S, m.city)) });
    }
    if (lv.n === 10) {
      if (!ev.murabaha || (E.stageOf(S)?.n === 18 && (ev.murabaha || 0) < 2)) {
        const room = E.capOfCar(m) - E.loadOf(m), here2 = GIDS.filter(g => !GD[g].live && E.sells(S.cities[m.city], g)), pick = (cheapestGood() && here2.includes(cheapestGood()) ? [cheapestGood()] : []).concat(here2), mg = pick.find(g => { const q0 = Math.max(1, Math.min(10, Math.floor(room / GD[g].w))); return room >= GD[g].w && E.murabahaQuote(S, g, q0, 30).ok; });
        if (!mg) return hasCargo() ? R({ msg: 'قافلتك ممتلئة: بِع بضاعتك أولاً لتفسح مكاناً للتمويل.', why: 'المرابحة بضاعة تصل قافلتك، فيلزمها مكان.', label: '💰 بِع كل البضاعة', run: () => sellAll() }) : R({ msg: 'لا سلعة يمكن تمويلها في هذا السوق الآن. انتظر يوماً أو انتقل إلى سوق آخر.', label: '⏭ يوم جديد', run: () => $('bNext').click() });
        const q0 = Math.max(1, Math.min(10, Math.floor(room / GD[mg].w))); return R({ msg: 'موّل شراء <b>' + q0 + ' ' + GD[mg].name + '</b> بالمرابحة: يشتريها المموّل ويبيعك إياها بهامش معلوم سلفاً.', why: 'التمويل الشرعي بيع بالأجل لا قرض بفائدة، والدَّين يبقى ثمناً ثابتاً تسدّده في أجله.', goal: scr('empire'), label: '🏦 موّل الشراء بالمرابحة', run: () => act(A.murabaha(S, mg, q0, 30)) });
      }
      if (E.bankDebt(S) > 0) return R({ msg: 'سدّد دَين المرابحة الآن ولا تؤخّره: الوفاء واجب.', goal: scr('empire'), label: '✅ سدّد الدَّين', run: () => act(A.settle(S)) });
    }
  }
  // دورة الصفقة: شراء ← سفر ← بيع
  if (cargo) {
    if (lv.n === 1 && !M.dest && !M.from) { // م1: بعد أول شراء نبيع في سوق آخر أغلى
      const g0 = kinds.slice().sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0], o0 = E.sellOptions(S, m.city, g0, Math.floor(m.cargo[g0]), E.avgCost(m.basis, g0) || E.mid(g0), m).find(o => o.city !== m.city && o.profit > 0 && !E.travelBlock(S, m, o.city));
      const fd = tutFirstDeal2(g0), pick = fd || o0; // البضاعة اشتُريت: أقرب وجهة رابحة داخل البلد أولاً
      if (pick) { M.dest = pick.city || pick.dest; M.from = m.city; }
    }
    if (M.dest && (lv.n === 1 ? m.city === M.from : m.city !== M.dest)) {
      if (lv.n === 5 && !ev.mixed && kinds.length < 2 && m.city === M.from) { const d2 = pickDeal(false, kinds.concat(L.goods || [])).best || pickDeal(false, kinds).best; if (d2) { const q2 = Math.max(1, Math.min(4, d2.q)); return R({ msg: `نوّع قافلتك: أضف <b>${q2} ${GD[d2.g].name}</b> مع بضاعتك قبل السفر.`, why: 'التنويع يحميك إن هبط سعر سلعة واحدة.', label: `🛒 أضف ${q2} ${GD[d2.g].name}`, run: () => act(A.buy(S, m.id, d2.g, q2)) }); } }
      const tmsg = lv.n === 1 ? `ما اشتريتَه رخيصاً تُجني قيمته في سوق آخر: سافر إلى <b>${cityName(M.dest)}</b> وبِعه هناك.` : `سافر إلى <b>${cityName(M.dest)}</b> لتبيع بضاعتك بأفضل ربح.`;
      return R({ msg: tmsg, goal: { k: 'travel', to: M.dest, lead: tmsg }, label: `🐪 سافر إلى ${cityName(M.dest)}`, run: () => travelTo(M.dest) });
    }
    if (!M.dest && lv.n !== 1) { // اشترى يدوياً: نختار له أفضل مكان للبيع
      const g = kinds.sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0], o = E.sellOptions(S, m.city, g, Math.floor(m.cargo[g]), E.avgCost(m.basis, g) || E.mid(g), m).find(x => !E.travelBlock(S, m, x.city));
      if (o) return R({ msg: `أفضل مكان تبيع فيه <b>${GD[g].name}</b>: <b>${cityName(o.city)}</b> (ربح متوقع ≈ ${fmt(Math.round(o.profit))} ريال).`, label: `🐪 سافر إلى ${cityName(o.city)}`, run: () => { M.dest = o.city; M.from = m.city; travelTo(o.city); } });
    }
    const sg = kinds.slice().sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0], sh = Math.floor(m.cargo[sg]), spr = marketView(m.city).p[sg], sref = E.refPrice(here, sg), sbs = E.avgCost(m.basis, sg);
    const smsg = M.from && m.city !== M.from ? `وصلتَ! معك <b>${sh} ${GD[sg].name}</b>: تُباع هنا بسعر <b>${f1(spr)}</b> للوحدة (المرجعي ${f1(sref)})${sbs != null ? ` وتكلفتك ${f1(sbs)}` : ''}.` : (lv.n === 1 ? `بِع بضاعتك هنا لترى كيف يُحسب الربح أو الخسارة. الربح الكبير يأتي من بيعها في سوق آخر.` : `وصلتَ! بِع بضاعتك هنا.`);
    return R({ msg: smsg, goal: { k: 'good', g: sg, side: 'sell', read: smsg + ' اضغط <b>بطاقة ' + GD[sg].name + '</b> لتقرأ تفاصيلها.', act: 'والآن اضغط «بِع الكل» لتعرف ربحك.' }, why: 'سيظهر لك الصافي بعد الضريبة والجمارك.', label: '💰 بِع كل البضاعة', run: () => { M.dest = null; M.from = null; sellAll(); } });
  }
  // لا بضاعة: خطوة الشراء
  M.dest = null; M.from = null;
  if (lv.n === 1) {
    { const f0 = tutFirstDeal(), sc = (!f0 || !f0.tier) && !M.scout && !S.player.trips ? tutScoutCity() : null, /* بعد أي وصول (S.player.trips) أو سفر المهمة (M.scout) لا يُقترح تفتيش ثانٍ، سواء سافر اللاعب بزرّ المهمة أو يدوياً */ nd0 = sc && sc.d; // لا صفقة مضمونة هنا: نفتّش أقرب سوق في بلدك مرة واحدة قبل أن نقبل بصفقة أضعف
      if (nd0) { const sm = `لا أرى هنا اليوم صفقة مأمونة لأول ربحك، لكن أسعار سوق بلدك الآخر واعدة. فلنجرّب: <b>${cityName(nd0)}</b>.`; return R({ msg: sm, goal: { k: 'travel', to: nd0, lead: sm }, label: `🐪 سافر إلى ${cityName(nd0)}`, run: () => { M.scout = true; travelTo(nd0); } }); } }
    const g = lv1Good(); if (!g) return R({ msg: 'لا أرى سلعة مناسبة في هذا السوق الآن، جرّب مدينة أخرى.', label: '⏭ يوم جديد', run: () => $('bNext').click() });
    const price = E.unitPrice(here, g), ref = E.refPrice(here, g), room = Math.floor((E.capOfCar(m) - E.loadOf(m)) / GD[g].w), q = Math.max(1, Math.min(5, room, Math.floor(S.player.gold / (price * 1.05))));
    const rr = price / ref, tag = rr < 0.85 ? `أرخص من المرجعي بـ${mpct(1 - rr)}٪ 🟢` : rr > 1.15 ? 'أغلى من المرجعي 🔴' : 'قريبة من المرجعي ⚪';
    const so = E.sellOptions(S, m.city, g, q, price).find(o => o.city !== m.city && o.profit > 0 && !E.travelBlock(S, m, o.city)), rmsg = `انظر إلى بطاقة <b>${GD[g].name}</b>: سعرها اليوم ${f1(price)} والسعر المرجعي (العادي) ${f1(ref)}، فهي ${tag}.${so ? ` وتُباع في <b>${cityName(so.city)}</b> بنحو ${f1(so.price)}.` : ''} اضغط البطاقة لتقرأ تفاصيلها.`;
    return R({ msg: rmsg, goal: { k: 'good', g, side: 'buy', q, read: rmsg, act: `والآن اضغط «اشترِ ${q}».` }, why: 'السعر المرجعي هو سعرها الأساسي العادي في السوق.', label: `🛒 اشترِ ${q} ${GD[g].name}`, run: () => { const r = A.buy(S, m.id, g, q); act(r); } });
  }
  if (rs && rs.home && here.country !== rs.home) { const back = S.order.filter(id => S.cities[id].country === rs.home).sort((a, b) => E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0]; return R({ msg: `التمرين في <b>${CD[rs.home].name}</b>: عُد إلى ${cityName(back)} وكرّر صفقاتك الصغيرة هناك.`, why: 'نتقن السوق القريب أولاً قبل أن نغامر بعيداً.', label: `🐪 عُد إلى ${cityName(back)}`, run: () => travelTo(back) }); }
  if (!L.abroad && ((rs && rs.infl) || (L.ageStages && L.level >= 4))) { // م4 تُفتح بعد أن تعرف أسواق بلدك
    const hs = E.homeStatus(S), un = S.order.filter(id => S.cities[id].country === hs.home && !(L.cv && L.cv[id] > 0)).sort((a, b) => E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0];
    if (un) { const um = `تعرّف على سوق <b>${cityName(un)}</b> الذي لم تزره بعد؛ نفوذك في بلدك يبدأ بمعرفة كل أسواقها.`; return R({ msg: um, why: 'السفر إلى بقية الدول يُفتح بعد أن تزور أسواق بلدك وتبلغ فيها نفوذاً.', goal: { k: 'travel', to: un, lead: um }, label: `🐪 سافر إلى ${cityName(un)}`, run: () => travelTo(un) }); }
  }
  const hOnly = rs && rs.home ? rs.home : (!L.abroad ? (L.start || S.home) : null);
  let pd = pickDeal(lv.n === 4, lv.n === 5 ? (L.goods || []) : null, hOnly); if (!pd.good && !pd.best) pd = pickDeal(lv.n === 4, null, hOnly);
  const d = pd.good || pd.best, floor = !L.abroad ? (lv.n === 2 && !rs && !ev.profit15 ? MIN_MARGIN : 0.06) : 0;
  if (d && d.pct < floor) {
    if (M.searchCity !== m.city) { M.searchCity = m.city; M.searchDay = S.day; }
    if (S.day - M.searchDay >= 20) {
      const nx = S.order.filter(id => id !== m.city && S.cities[id].country === here.country && !E.travelBlock(S, m, id)).sort((a,b) => ((L.cv || {})[a] || 0) - ((L.cv || {})[b] || 0))[0];
      if (nx) return R({ msg: 'لم تظهر صفقة مناسبة هنا؛ جرّب سوق ' + cityName(nx) + '.', label: 'انتقل إلى ' + cityName(nx), run: () => travelTo(nx) });
    }
  } else { delete M.searchDay; delete M.searchCity; }
  if (d && d.pct < floor) return R({ note, msg: `لا أرى صفقة مجدية في أسواق بلدك اليوم (أعلى هامش ${mpct(d.pct)}٪). الأسعار تتحرك كل يوم، فانتظر يوماً.`, why: 'التاجر الصبور لا يشتري إلا إذا كان الهامش يستحق العناء.', label: '⏭ انتظر يوماً', run: () => $('bNext').click() });
  if (!d) { // لا صفقة هنا: ننتقل لسوق آخر، فالأسواق تختلف أسعارها (قبل فتح السفر داخل بلد البداية فقط)
    const hc2 = L.start || S.home, nx = S.order.filter(id => id !== m.city && (L.abroad || S.cities[id].country === hc2) && !E.travelBlock(S, m, id)).sort((a, b) => ((L.cv && L.cv[a]) || 0) - ((L.cv && L.cv[b]) || 0) || E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0];
    if (nx) { const nm2 = `لا صفقة رابحة من هنا اليوم. جرّب سوق <b>${cityName(nx)}</b>؛ لكل سوق أسعاره وقد تجد فيه فرصتك.`; return R({ note, msg: nm2, goal: { k: 'travel', to: nx, lead: nm2 }, label: `🐪 انتقل إلى ${cityName(nx)}`, run: () => travelTo(nx) }); }
  }
  if (!d) return R({ note, msg: 'لا أرى صفقة رابحة من هذه المدينة اليوم. انتظر يوماً لتتغير الأسعار أو انتقل لمدينة أخرى.', label: '⏭ انتظر يوماً', run: () => $('bNext').click() });
  const honest = pd.good ? '' : `لا صفقة بهامش ${mpct(MIN_MARGIN)}٪ أو أكثر اليوم؛ هذه أعلى ما عندي (${mpct(d.pct)}٪). جرّبها أو انتظر يوماً.`;
  const split = lv.n === 5 && !ev.mixed; M.dest = d.d; M.from = m.city;
  const dmsg = (lv.n === 4 ? 'صفقة <b>إلى دولة أخرى</b> (الجمارك محسوبة): ' : '') + dealMsg(d), dpr = marketView(m.city).p[d.g];
  return R({ note, msg: dmsg, goal: { k: 'good', g: d.g, side: 'buy', q: d.q, read: `بطاقة <b>${GD[d.g].name}</b>: سعرها ${f1(dpr)} والمرجعي ${f1(E.refPrice(here, d.g))}. ${dmsg}. اضغط البطاقة أولاً.`, act: `اضغط «اشترِ ${d.q}» ثم سافر إلى ${cityName(d.d)}.` }, why: honest || 'هامش الربح = ما تربحه لكل 100 ريال تدفعها. أبقيتُ لك نفقة الطريق.', label: split ? '🛒 اشترِ هنا' : '🛒🐪 اشترِ وسافر', run: () => { M.dest = d.d; M.from = m.city; if (split) act(A.buy(S, m.id, d.g, d.q)); else dealGoNow({ g: d.g, d: d.d, q: d.q, route: 'land' }); } });
}
function restHTML(rs) {
  const g = S.player.gold, row = (ok, t) => `<div class="lgoal ${ok ? 'ok' : ''}"><span class="gk"></span><span>${t}</span></div>`;
  return `<div>${row(rs.w >= rs.k, `صفقات رابحة${rs.home ? ' في ' + CD[rs.home].name : ''}: ${Math.min(rs.w, rs.k)} من ${rs.k}`)}${rs.gold ? row(g >= rs.gold, `رصيدك ${fmt(Math.round(g))} من ${fmt(rs.gold)} ريال`) : ''}${rs.infl && !S.learn.abroad ? (() => { const hs = E.homeStatus(S); return row(hs.seen >= hs.total, `زيارة كل أسواق ${CD[hs.home].name}: ${hs.seen} من ${hs.total}`) + row(hs.infl >= hs.need, `نفوذك في ${CD[hs.home].name} (مبيعاتك فيها): ${fmt(Math.min(hs.infl, hs.need))} من ${fmt(hs.need)} ريال`); })() : ''}${rs.plan ? row(!!(S.player.famDebt && (S.player.famDebt.plan || S.player.famDebt.left <= 0)), 'فعّل خطة ظافر 70/20/10') : ''}</div>`;
}
const COMPACT_SCREENS = ['cities', 'estate', 'empire', 'lords', 'academy', 'caravan'];
/* مقدار الإرشاد: المستوى 1 ثم م4 فما فوق يوجّه عمّ سالم خطوة بخطوة، أما م2 وم3 وفترات التمرين فيُترك اللاعب يتصرف بنفسه ولا يرى الخطوة إلا إن طلبها («ساعدني») */
const guidanceOf = lv => ((!lv.rest && lv.n === 1) || lv.n >= 4) ? 'full' : 'ondemand';
let mhelp = null;
const helpSig = () => { const m = main(); return [S.learn.level, S.learn.rest ? 1 : 0, Math.round(E.loadOf(m)), m.city, m.left > 0 ? 1 : 0, Math.round(S.player.gold)].join('|'); };
const helpOn = () => mhelp === helpSig();
function missionFree(lv, st, forPanel) {
  const rest = !!lv.rest, cp = !forPanel && COMPACT_SCREENS.includes(screen);
  const msg = rest ? 'الآن دورك: اشترِ حيث ترخص السلعة وبِعها حيث تغلو، وتنقّل بين الأسواق كما تحب. أنا أراقب وأحسب لك التقدّم.' : 'جرّب بنفسك هذه المهمة. إن احترتَ اضغط «ساعدني» فأريك الخطوة التالية.';
  return `<div class="card mission free${cp ? ' compact' : ''}" id="mission"><div class="msay">${mentorAv('teach')}<div style="flex:1;min-width:0"><b>${esc(MEN.name)}</b> <span class="small muted">· ${rest ? 'تمرين حر قبل المستوى ' + (lv.rest.n + 1) : 'مهمة المستوى ' + lv.n + ': ' + lv.title}</span><div class="bub">${msg}</div></div></div>${cp ? '' : (rest ? restHTML(lv.rest) : goalsHTML(lv))}<div class="row" style="margin-top:8px"><button class="btn" data-act="mhelp">💡 ساعدني في الخطوة التالية</button>${rest ? '<button class="btn ghost sm" data-act="restskip">أنا جاهز للدرس التالي</button>' : ''}</div></div>`;
}
function missionCard(forPanel) {
  const ageWait = E.stageStatus(S); if (ageWait && ageWait.waiting) return `<div class="card mission compact" id="mission"><b>استكشف وجرّب</b><p>المرحلة القادمة بعد ${spanAr(ageWait.days)} (عند عمر ${ageFmt(ageWait.required)} سنة).</p></div>`;
  const st = missionStep(); if (!st) return '';
  const lv = st.lv, cp = !forPanel && COMPACT_SCREENS.includes(screen);
  if (guidanceOf(lv) === 'ondemand' && !helpOn()) return missionFree(lv, st, forPanel);
  const p = mpath(st), msg = p ? p.msg : st.msg, btn = st.label ? (p ? '<button class="btn ghost sm" data-act="mrun">نفّذ عنّي</button>' : `<button class="btn big" data-act="mrun">${st.label}</button>`) : '';
  if (cp) return `<div class="card mission compact" id="mission"><div class="msay">${mentorAv('teach')}<div style="flex:1;min-width:0"><b>${esc(MEN.name)}</b> <span class="small muted">· ${lv.rest ? 'تمرين قبل المستوى ' + (lv.rest.n + 1) : 'مهمة المستوى ' + lv.n}</span><div class="bub">${msg}</div></div></div>${btn}</div>`;
  return `<div class="card mission" id="mission"><div class="msay">${mentorAv('teach')}<div style="flex:1;min-width:0"><b>${esc(MEN.name)}</b> <span class="small muted">· ${lv.rest ? 'تمرين قبل المستوى ' + (lv.rest.n + 1) : 'مهمة المستوى ' + lv.n + ': ' + lv.title}</span><div class="bub">${msg}</div>${st.why ? `<div class="small muted" style="margin-top:4px">${st.why}</div>` : ''}${st.note ? `<div class="small" style="margin-top:4px">ℹ️ ${st.note}</div>` : ''}</div></div>${lv.rest ? restHTML(lv.rest) : goalsHTML(lv)}${btn}${lv.rest ? '<button class="btn ghost sm" data-act="restskip">أنا جاهز للدرس التالي</button>' : ''}${lv.mode === 'guide' ? `<button class="btn ghost sm" data-act="mfull">${ui.full ? 'إخفاء الخيارات الإضافية' : 'إظهار كل الخيارات'}</button>` : ''}</div>`;
}
function missionInline() {
  if (E.stageStatus(S)?.waiting) return '';

  const st = missionStep(); if (!st || !st.label) return '';
  if (guidanceOf(st.lv) === 'ondemand' && !helpOn()) return '';
  const p = mpath(st);
  return `<div class="card mission inline"><div class="small">${p ? p.msg : st.msg}</div>${p ? '<button class="btn ghost sm" data-act="mrun">نفّذ عنّي</button>' : `<button class="btn big" data-act="mrun">${st.label}</button>`}</div>`;
}
function mentorTarget() {
  if(salemOpen&&salemTab!=='mission')return null;
  if (E.stageStatus(S)?.waiting) return null;

  const L = S.learn; if (!L || !L.char || NOLEARN || learnNext()) return null;
  const lv = lvlOf(); if (!lv || lv.mode !== 'guide') return null;
  const st = missionStep(); if (!st || !st.label) return null;
  if (guidanceOf(st.lv) === 'ondemand' && !helpOn()) return null;
  const p = mpath(st); if (p) return p.sel;
  return dg ? '#modal [data-act="mrun"]' : (salemOpen ? '#mission [data-act="mrun"]' : '#hSalem');
}
function placeSpot() {
  const sp = $('spot'); if (!sp) return; const n = document.querySelector('.tut-hl');
  if (!n || !S) { sp.hidden = true; return; }
  const r = n.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) { sp.hidden = true; return; }
  sp.style.left = (r.left - 6) + 'px'; sp.style.top = (r.top - 6) + 'px'; sp.style.width = (r.width + 12) + 'px'; sp.style.height = (r.height + 12) + 'px'; sp.hidden = false;
  sp.dataset.side = r.bottom + 90 < innerHeight ? 'below' : 'above';
}
window.addEventListener('scroll', () => placeSpot(), { passive: true, capture: true }); window.addEventListener('resize', () => placeSpot());
