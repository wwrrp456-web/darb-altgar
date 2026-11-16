/* ---------- 053أ موازنة الاقتصاد: الأثمان والهامش والإيجار وأثر الكوارث وخسائر الإهمال ----------
   مفتاح واحد BAL.on: المطفأ = السلوك الحالي حرفاً (كل دالة هنا تعيد الرقم القديم بالعملية نفسها، ولا حقل جديداً في الحفظ، ولا سحباً عشوائياً جديداً).
   المستوى من S.diff القائم (calm مبتدئ، normal أو الغياب متوسط، hard عالٍ). الثوابت القديمة لا تُعدَّل؛ كل موضع يمرّ بدالة من هنا.
   ما يدفعه اللاعب يُحسب بمستوى لحظة الشراء ويُحفظ مضاعفه على الأصل (bk/whbk، حين BAL.on فقط). */
const BAL = {
  on: false,
  k: {                       // مضاعف على الثمن القائم: [مبتدئ، متوسط، عالٍ]؛ المبتدئ = نصف المتوسط، والعالي = 1.6 ضعفه
    shop: [4.2, 6.5, 10.4],  // الدكان (المبتدئ 4.2 بحكم Opus 2026-11-16c؛ كان 3.25): الشراء والإيجار وثمن التمليك وتحسينات الدكان SHOP_UP_COST
    wh:   [5, 10, 16],       // المخزن وترقياته WH_UP_COST
    farm: [3, 6, 9.6],       // المزرعة وتوسعتها FARM_UP
    fact: [3, 6, 9.6],       // المصنع المحلي والخارجي وترقيته
    car:  [4, 8, 12.8],      // القافلة بقائد (1500 ورسم المرشّح cd.fee)
    cart: [2, 4, 6.4],       // العربة
    ship: [5, 10, 16],       // السفن الثلاث وتحسيناتها SHIP_UP
    hire: [2, 4, 6.4],       // توظيف الحارس والرجل (طاقم القافلة) والبحّار
    wage: [1, 2, 3.2]        // الأجر اليومي للحارس والطاقم والبحّار
  },
  rentY: [0.15, 0.20, 0.25], // الإيجار السنوي ÷ ثمن الدكان (معتمد §11؛ لا يُضبط بالقياس)
  price0: [1.5, 1.5, 1.5],   // السعر الافتراضي لصنف جديد في الدكان (بدل SHOP_PRICE0)؛ 1.3 ابتدائي، 1.5 حدّ نطاق ط1 [1.2، 1.5] (حكم Opus 2026-11-16b §4)
  demand: [0.03, 0.0414, 0.0982], // مضاعف إقبال الدكان (بدل SHOP_DEMAND)؛ نطاقه [0.03، 1]: تنصيف 8 تجارب لكل مستوى حتى Y(price0) ≈ 52٪؛ المبتدئ عند الحد الأدنى 0.03
  hit: [0.25, 0.60, 0.90],   // (ط5: رُفعت من 0.25/0.40/0.60 بحدّ +50٪) نقص مبيعات دكاكين اللاعب في المدينة المصابة
  fire: [[0.15, 0.30], [0.25, 0.45], [0.35, 0.60]], fireMax: 0.75, // تلف بضاعة المخزن في الحريق
  wet: [0.05, 0.10, 0.30],   // (ط5: العالي +50٪) تلف البضاعة المخزّنة في الفيضان أو الحرب
  road: [1.3, 1.6, 2.0], riskCap: 0.8, // خطر الطريق البري من مدينة مصابة أو إليها
  cover: [0.70, 0.50, 0.40], // ما يعوّضه التكافل من تلف المال
  negAt: 50, neg: [0.20, 0.30, 0.40], // نقص إقبال الدكان المملوك حين حالته دون 50
  drift: [0.20, 0.22, 0.26], // نقص الحالة اليومي بلا مدير/أمين (يُطرح بعد +0.15 الصيانة المدفوعة)
  quit: [21, 14, 7]          // أيام تأخير الأجر قبل انصراف العامل (اليوم 5)
};
const BAL_LV = ['مبتدئ', 'متوسط', 'عالٍ'];
const balLv = S => S.diff === 'calm' ? 0 : S.diff === 'hard' ? 2 : 1;
const balK = (S, kind) => BAL.on ? BAL.k[kind][balLv(S)] : 1;
const balBk = o => BAL.on && o && o.bk > 0 ? o.bk : 1;          // مضاعف ما دُفع (الغائب = 1)
/* أساس واحد للدكان تحت BAL.on: البناء (× prosMul) والتمليك والإيجار منه (حكم Opus 2026-11-16b §2) */
const shopBase = (S, c, n) => 1500 * Math.pow(1.5, n) * foreignMul(S, c) * Math.pow(shopProsper(c), 0.6) * balK(S, 'shop');
const balMix = (old, n, k) => (old * (n - 1) + k) / n;          // متوسط موزون عند إضافة وحدة n
const balWhBk = pr => BAL.on && pr && pr.whbk > 0 ? pr.whbk : 1;

/* §4 هامش الدكان */
const balPrice0 = S => BAL.on ? BAL.price0[balLv(S)] : SHOP_PRICE0;
const balDemand = S => BAL.on ? BAL.demand[balLv(S)] : SHOP_DEMAND;

/* §2 الأثمان: كل ثمن معروض يُقرأ من هنا، وبه يُخصم الفعل */
const shopUpCost = (S, lv, city) => Math.round(SHOP_UP_COST[lv] * (city && S.cities[city] ? foreignMul(S, S.cities[city]) : 1) * balK(S, 'shop'));
const whUpCost = (S, lv) => Math.round(WH_UP_COST[lv] * balK(S, 'wh'));
const farmCost = (S, c) => Math.round(FARM_COST * foreignMul(S, c) * balK(S, 'farm'));
const farmUpCost = (S, c, f) => Math.round(FARM_UP * f.level * foreignMul(S, c) * balK(S, 'farm'));
function factoryCost(S, city, recipe) {                          // { cost: ثمن مصنع جديد، up: ثمن ترقية القائم (0 إن لم يوجد) }
  const rc = RECIPES[recipe], c = S.cities[city]; if (!rc || !c) return { cost: 0, up: 0 };
  const k = balK(S, 'fact'), local = factoryLocal(c, rc), ex = S.player.factories.find(f => f.city === city && f.recipe === recipe);
  return { cost: local ? Math.round(4000 * foreignMul(S, c) * k) : Math.round(MFG_COST(rc.out) * k), up: ex ? (local ? Math.round((2500 + ex.level * 2500) * k) : Math.round(factoryBase(ex) * 0.4 * ex.level * k)) : 0 };
}
const capFee = (S, cd) => Math.round((cd ? cd.fee : 1500) * balK(S, 'car'));
const shipCost = (S, type, city) => Math.round(SHIPS[type].cost * foreignMul(S, S.cities[city]) * balK(S, 'ship'));
const shipUpCost = (S, sh, k) => Math.round(SHIPS[sh.type].cost * SHIP_UP[k].cost[shipUp(sh, k)] * foreignMul(S, S.cities[sh.city]) * balK(S, 'ship'));
const shipBack = (S, sh) => Math.round(SHIPS[sh.type].cost * SEA.sellBack * balBk(sh));
const hireCost = (S, kind) => Math.round((kind === 'sailor' ? SAILOR_FEE : WAGE[kind + 'Hire']) * balK(S, 'hire'));
const balWage = (S, kind) => (kind === 'sailor' ? SAILOR_WAGE : WAGE[kind]) * balK(S, 'wage');
/* §3 ثمن التمليك والخصم (صيغة الخصم لا تتغير) */
function shopBuyQuote(S, city, id) {
  const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id), c = S.cities[city]; if (!sh || !c) return null;
  const price = BAL.on ? Math.round(shopBase(S, c, pr.shops.length - 1)) : Math.round(1500 * Math.pow(1.5, pr.shops.length - 1) * foreignMul(S, c)), disc = Math.min(RENT_CREDIT * (sh.rentPaid || 0), RENT_MAXCREDIT * price), pay = Math.round(price - disc);
  return { price, disc, pay, rent: sh.rent };
}

/* §5 المدينة المصابة */
const BAL_HIT = { famine: 'مجاعة', drought: 'جفاف', flood: 'فيضان', plague: 'وباء', war: 'حصار وحرب', bust: 'كساد' };
function balHit(S, id) {
  if (!BAL.on) return null; const c = S.cities[id]; if (!c) return null;
  if (c.ev && c.ev.k === 'war') return 'war';   // 053ب: الحرب تتقدّم إن اجتمعت مع جفاف أو فيضان
  if (c.sh && (c.sh.k === 'famine' || c.sh.k === 'drought' || c.sh.k === 'flood')) return c.sh.k;
  if (c.ev && (c.ev.k === 'plague' || c.ev.k === 'war' || c.ev.k === 'bust')) return c.ev.k; // 053ب: الكساد يُنقص مبيعات دكاكينك في المدينة
  return null;
}
const balHitMul = (S, city) => { const k = balHit(S, city); return k ? 1 - (k === 'war' ? BAL.war.hit : BAL.hit)[balLv(S)] : 1; };
/* أيام بقاء الإصابة (للعرض) */
const balHitLeft = (S, id) => { const c = S.cities[id], k = balHit(S, id); if (!k) return 0; return c.sh && c.sh.k === k ? Math.max(0, c.sh.end - S.day) : c.ev ? c.ev.left : 0; };
function balStoreLoss(S, city, why) {          // why ∈ {'flood', 'war'}
  const pr = S.player.props[city]; if (!BAL.on || !pr || !pr.store) return 0;
  const f = BAL.wet[balLv(S)]; let lost = 0;
  for (const g in pr.store) { const l = pr.store[g] * f; if (!(l > 0)) continue; pr.store[g] -= l; lost += l * mid(g); takeBasis(pr.basis || (pr.basis = {}), g, l); }
  if (!(lost > 0)) return 0;
  ctxFor(S, city); const comp = insOn(S, city) ? tkClaim(S, lost, balCover(S)) : 0;
  sink(S, why, lost); S.player.led.exp[why] = (S.player.led.exp[why] || 0) + lost;
  news(S, (why === 'flood' ? 'أتلف الفيضان ' : 'أتلفت الحرب ') + Math.round(f * 100) + '٪ من بضاعتك في ' + S.cities[city].name + ': نحو ' + fmtN(lost) + ' ريال' + (comp ? '، وعوّضك التكافل ' + fmtN(comp) : ' (بلا تكافل في هذه المدينة)') + '.', 'bad');
  return lost;
}
const balRisk = (S, p, from, to) => !BAL.on || !(balHit(S, from) || balHit(S, to)) ? p : Math.min(BAL.riskCap, p * BAL.road[balLv(S)]);
const balCover = S => BAL.on ? BAL.cover[balLv(S)] : TK.cover;
/* الحريق تحت BAL.on: سحب rndB واحد كما اليوم، بلا شدة */
const balFire = (S, keeper) => { const [lo, hi] = BAL.fire[balLv(S)]; return clamp((lo + (hi - lo) * rndB(S)) * (keeper ? 0.5 : 1), 0.05, BAL.fireMax); };

/* §6 خسائر الإهمال */
const balQuit = S => BAL.on ? BAL.quit[balLv(S)] : 5;
const balNeg = (S, c) => BAL.on && c < BAL.negAt ? BAL.neg[balLv(S)] : 0;
const balDrift = S => BAL.drift[balLv(S)];
/* تهالك الدكان بلا مدير ولا أمين منطقة، والمخزن بلا أمين كافٍ (يُطرح بعد +0.15 الصيانة المدفوعة) */
const balShopDrift = (S, city, pr) => BAL.on && !(pr.mgr || stewardOf(S, city)) ? balDrift(S) : 0;
const balWhDrift = (S, city) => BAL.on && keeperHave(S, city) < keeperNeed(S, city) ? balDrift(S) : 0;

/* وصف المستويات الثلاثة (دفتر عمّ سالم) */
const balView = S => { const hc = S.cities[S.startCity || START_CITY]; return BAL_LV.map((name, i) => ({ name, shop: Math.round(1500 * foreignMul(S, hc) * Math.pow(shopProsper(hc), 0.6) * BAL.k.shop[i]), rentPct: Math.round(BAL.rentY[i] * 100), hit: Math.round(BAL.hit[i] * 100), cover: Math.round(BAL.cover[i] * 100), war: 354 / BAL.war.gap[i], warGap: BAL.war.gap[i], chYear: 12 * BAL.ch.p[i] * 3, lose: BAL.ch.lose[i] })); };
/* القيمة الدفترية للدكاكين المملوكة وللمخازن: الرقم الثابت القائم × ما دُفع فعلاً (مضاعف لحظة الشراء) */
const balShopBook = p => p.shops.reduce((a, sh) => shKind(sh) === 'own' ? a + 1000 * balBk(sh) : a, 0);
const balWhBook = p => p.whs * 800 * balWhBk(p);
const balEndowBook = p => p.shops.reduce((a, sh) => sh.endowed && shKind(sh) === 'own' ? a + 1000 * balBk(sh) : a, 0);

/* ---------- 053ب: الحرب حدثاً إقليمياً بلا قتال، وتحدّي المنافسين للأسواق المقادة، ونفوذ الحضور ÷ D، ومُختار الصعوبة ----------
   المفتاح نفسه BAL.on: المطفأ = السلوك الحالي حرفاً (لا S.wars ولا S.balWar ولا S.balCh ولا S.diffDay ولا c.ev.food، ولا سحب عشوائياً جديداً).
   الحرب اضطراب وقطع طرق وغلاء أقوات فقط: لا قتال ولا مشاهد عنف. أثرها على أصول اللاعب يمرّ بمسارات 053أ (balHit/balHitMul/balStoreLoss/balRisk). */
Object.assign(BAL, {
  war: {
    from: YEAR + 1,            // لا حرب في السنة الأولى (الأيام 1..354)
    gap: [708, 354, 177],      // متوسط الأيام بين بدء حربين: مرة/سنتين، مرة/سنة، مرتان/سنة (معتمد §11)
    spread: 0.5,               // الفاصل منتظم على [1 − 0.5، 1 + 0.5] × gap
    warn: 5,                   // أيام الإشاعة قبل البدء
    dur: [20, 40],             // أيام الحرب (§8.3)
    food: [0.30, 0.60],        // غلاء الأقوات في مدنها (§8.3)
    roads: [1, 2],             // الطرق المقطوعة
    hit: [0.35, 0.50, 0.65]    // نقص مبيعات دكاكين اللاعب في مدنها (المتوسط = النصف §8.3)
  },
  ch: {
    p: [0.025, 0.06, 0.17],    // احتمال تحدٍّ في الشهر لكل وحدة من k (diffK)
    pMax: 0.9,
    boost: [25, 35],           // ما يضيفه التحدّي إلى نفوذ الزعيم bs.b (§8.4)
    cost: [125, 250, 400],     // ريال لكل نقطة boost × حجم المدينة × foreignMul
    days: 10,                  // مهلة الردّ
    lose: [0.40, 0.45, 0.50]   // يفقد اللاعب القيادة إذا نزلت حصته عن هذا (§8.4؛ BOSS_LOSE = 0.40)
  },
  infl: [5, 3.25, 2.5],        // 053ب ب4: مضاعف نفوذ الحضور (دكان ومخزن ومبيعات) قبل القسمة على D^pres؛ يعيد معايرة 0.35/0.12 على أثمان 053أ
  pres: [0, 1, 1.5],           // نفوذ الحضور ÷ D^pres (§8.4: كما هو / ÷D / ÷D^1.5)
  df: { per: [0.10, 0.15, 0.20], cap: [1.4, 2.0, 2.6] }, // بدل DF.per وDF.cap (§8.4)؛ DF.bCap = 72 لا يتغير
  lock: 30                     // مهلة تغيير المستوى (معتمد §11)
});

/* §2 الحرب */
const balGap = S => BAL.war.gap[balLv(S)] * (1 - BAL.war.spread + 2 * BAL.war.spread * rndB(S));
function balWarDay(S) {
  if (!BAL.on || !shocksOn(S)) return;
  const W = S.balWar || (S.balWar = { next: Math.max(BAL.war.from, S.day) + Math.round(BAL.war.gap[balLv(S)] * rndB(S)) });
  S.wars = S.wars || [];
  for (const w of S.wars.slice()) {
    if (w.st === 'rumor' && S.day >= w.start) balWarStart(S, w);
    else if (w.st === 'on' && S.day >= w.end) balWarEnd(S, w);
  }
  if (S.day < BAL.war.from || S.day < W.next - BAL.war.warn || S.wars.length) return;
  const w = balWarMake(S); W.next = S.day + BAL.war.warn + Math.round(balGap(S));
  if (w) { S.wars.push(w); news(S, balWarRumor(S, w), 'rumor'); }
}
const BAL_LAND = (S, x, y) => S.risk[riskKey(x, y)] != null && !(PORTS.includes(x) && PORTS.includes(y));
function balWarMake(S) {
  const border = rndB(S) < 0.5;                                       // سحب 1
  const a = pickOf(S, COUNTRIES.map(c => c.id));                     // سحب 2
  const b = border ? pickOf(S, ADJ[a]) : null;                        // سحب 3 (للحدّ وحده)
  const roads = [];
  for (const x of S.order) for (const y of S.order) if (x < y && BAL_LAND(S, x, y)) {
    const cx = S.cities[x].country, cy = S.cities[y].country;
    if (border ? (cx === a && cy === b) || (cx === b && cy === a) : (cx === a) !== (cy === a)) roads.push([x, y]);
  }
  if (!roads.length) return null;
  const n = Math.min(roads.length, BAL.war.roads[0] + (rndB(S) < 0.5 ? 0 : BAL.war.roads[1] - BAL.war.roads[0])); // سحب 4
  const cut = []; while (cut.length < n) { const i = Math.floor(rndB(S) * roads.length); cut.push(roads.splice(i, 1)[0]); } // سحب لكل طريق
  const [lo, hi] = BAL.war.food, food = Math.round((lo + (hi - lo) * rndB(S)) * 100) / 100;      // سحب
  const dur = BAL.war.dur[0] + Math.floor(rndB(S) * (BAL.war.dur[1] - BAL.war.dur[0] + 1));      // سحب
  const cities = border ? [...new Set(cut.flat())] : S.order.filter(id => S.cities[id].country === a);
  const start = S.day + BAL.war.warn;
  return { id: S.nextId++, kind: border ? 'border' : 'country', a, b, cities, roads: cut, food, st: 'rumor', warn: S.day, start, end: start + dur };
}
function balWarStart(S, w) {
  w.st = 'on';
  for (const id of w.cities) S.cities[id].ev = { k: 'war', left: w.end - w.start, food: w.food };
  for (const id of w.cities) if (S.player.props[id]) balStoreLoss(S, id, 'war');   // 053أ §5ج: الخبر والتكافل و«أين أخسر؟»
  news(S, balWarNews(S, w), 'bad'); interrupt(S, 'balWar');
}
function balWarEnd(S, w) {
  for (const id of w.cities) { const c = S.cities[id]; if (c.ev && c.ev.k === 'war') c.ev = null; }
  S.wars = S.wars.filter(x => x !== w);
  news(S, 'هدأ الاضطراب في ' + balWarWhere(S, w) + ' بعد ' + (w.end - w.start) + ' يوماً، وفُتحت الطرق.', 'good');
}
const balWarWhere = (S, w) => w.kind === 'border' ? 'الحدّ بين ' + CD[w.a].name + ' و' + CD[w.b].name : CD[w.a].name;
const balWarRumor = (S, w) => 'إشاعة: اضطراب يلوح في ' + balWarWhere(S, w) + ' بعد ' + BAL.war.warn + ' أيام: قد تُقطع طرق وتغلو الأقوات. أتمم ما تريده هناك قبلها.';
const balRoadName = (S, r) => S.cities[r[0]].name + '–' + S.cities[r[1]].name;
function balWarNews(S, w) {
  const mine = w.cities.filter(id => S.player.props[id] && (shopsOf(S, id).length || S.player.props[id].whs));
  return 'حرب في ' + balWarWhere(S, w) + ' حتى اليوم ' + w.end + ': انقطع الطريق ' + w.roads.map(r => balRoadName(S, r)).join(' و') + '، وغلت الأقوات ' + Math.round(w.food * 100) + '٪، ومبيعات الدكاكين هناك أقل ' + Math.round(BAL.war.hit[balLv(S)] * 100) + '٪، وطرقها أخطر ×' + BAL.road[balLv(S)] + '.' + (mine.length ? ' لك فيها: ' + mine.map(id => S.cities[id].name).join('، ') + '.' : '');
}
/* routePath تعيد إحداثيات الرسم لا مدناً، فيُفحص الزوج المباشر وحده (يُذكر في التقرير) */
function balOnPath(S, from, dest, x, y) {
  const p = [from, dest];
  for (let i = 0; i + 1 < p.length; i++) if ((p[i] === x && p[i + 1] === y) || (p[i] === y && p[i + 1] === x)) return true;
  return false;
}
function balWarBlock(S, fromCity, dest) {
  for (const w of (S.wars || [])) if (w.st === 'on') for (const [x, y] of w.roads) if (balOnPath(S, fromCity, dest, x, y)) return 'الطريق بين ' + S.cities[x].name + ' و' + S.cities[y].name + ' مقطوع للاضطراب حتى اليوم ' + w.end + '.';
  return null;
}
function balWarView(S) {
  if (!BAL.on) return null; const w = (S.wars || []).find(x => x.st === 'on'); if (!w) return null;
  return { id: w.id, where: balWarWhere(S, w), end: w.end, left: Math.max(0, w.end - S.day), roads: w.roads.map(r => ({ a: r[0], b: r[1], name: balRoadName(S, r) })), food: Math.round(w.food * 100), hit: Math.round(BAL.war.hit[balLv(S)] * 100), road: BAL.road[balLv(S)],
    mine: w.cities.filter(id => S.player.props[id] && S.player.props[id].shops.length).map(id => ({ city: id, name: S.cities[id].name, lost: Math.round(S.player.props[id].hitLost || 0) })) };
}

/* §3 المنافسة بعد القيادة */
const balLose = S => BAL.on ? BAL.ch.lose[balLv(S)] : BOSS_LOSE;
function balChWho(S, city) {
  const rv = (S.rivals || []).find(r => r.out == null && r.city === city);
  return rv ? rv.name : S.rival ? S.rival.name : S.bosses[city].name;
}
function balChDay(S) {
  const C = S.balCh;
  if (C && S.bosses[C.city] && S.bosses[C.city].ruler !== 'player') { S.balCh = null; return; }   // فقدتَ السوق قبل الردّ: يسقط التحدّي (انحراف مذكور في التقرير)
  if (C && S.day >= C.end) return balChSettle(S, 'leave', true);                 // انقضت المهلة = تركه
  if (C || S.day <= 0 || S.day % 30 !== 0 || !dfOn(S)) return;
  const led = S.order.filter(id => S.bosses[id] && S.bosses[id].ruler === 'player');
  if (!led.length) return;
  const lv = balLv(S), p = Math.min(BAL.ch.pMax, BAL.ch.p[lv] * diffK(S));
  if (rndB(S) >= p) return;                                                        // سحب 1
  const city = led[Math.floor(rndB(S) * led.length)], c = S.cities[city];         // سحب 2
  const [lo, hi] = BAL.ch.boost, boost = Math.round(lo + (hi - lo) * rndB(S));     // سحب 3
  const cost = Math.round(BAL.ch.cost[lv] * boost * c.size * foreignMul(S, c));
  S.balCh = { city, who: balChWho(S, city), boost, cost, day: S.day, end: S.day + BAL.ch.days };
  news(S, balChNews(S), 'bad'); interrupt(S, 'balCh');
}
function balChShares(S) {
  const C = S.balCh; if (!C) return null; const bs = S.bosses[C.city];
  return { share: bossShare(bs), after: bs.p / (bs.p + Math.min(120, bs.b + C.boost)) };
}
function balChNews(S) {
  const C = S.balCh, c = S.cities[C.city], sh = balChShares(S);
  return C.who + ' ينافسك في سوق ' + c.name + ': إن تركتَه فحصتك ' + Math.round(sh.share * 100) + '٪ ← ' + Math.round(sh.after * 100) + '٪ (تفقد القيادة دون ' + Math.round(balLose(S) * 100) + '٪). ثبّته بـ' + fmtN(C.cost) + (mfOn(S) ? ' في صندوق السوق' : ' في حملة عروض للزبائن') + '. باقٍ ' + Math.max(0, C.end - S.day) + ' أيام.';
}
function balChView(S) {
  const C = S.balCh; if (!BAL.on || !C) return null; const c = S.cities[C.city], sh = balChShares(S);
  return { city: C.city, name: c.name, who: C.who, boost: C.boost, cost: C.cost, left: Math.max(0, C.end - S.day), share: sh.share, after: sh.after, lose: balLose(S), fund: mfOn(S) };
}
function balChSettle(S, how, auto) {
  const C = S.balCh; if (!C) return NO('لا تحدّي قائماً.');
  const bs = S.bosses[C.city], c = S.cities[C.city];
  if (how === 'pay') {
    ctxFor(S, C.city); if (S.player.gold + 1e-9 < C.cost) return NO('رصيدك لا يكفي (' + fmtN(C.cost) + ').');
    const r = mfOn(S) ? fundDonate(S, C.city, C.cost) : (pPay(S, 'marketDefend', C.cost, true), OK(''));
    if (r.ok === false) return r;
    S.balCh = null; news(S, 'ثبّتَّ سوق ' + c.name + ' أمام ' + C.who + ': ' + fmtN(C.cost) + (mfOn(S) ? ' في صندوق السوق.' : ' حملة عروض للزبائن.'), 'good');
    return OK('ثبّتَّ السوق.');
  }
  const s0 = bossShare(bs); bs.b = clamp(bs.b + C.boost, 5, 120); const s1 = bossShare(bs); S.balCh = null;
  news(S, (auto ? 'انقضت مهلة الردّ: ' : '') + C.who + ' نافسك في سوق ' + c.name + ': حصتك ' + Math.round(s0 * 100) + '٪ ← ' + Math.round(s1 * 100) + '٪' + (s1 < balLose(S) ? '، دون حدّ القيادة ' + Math.round(balLose(S) * 100) + '٪.' : '.'), 'bad');
  return OK('تركتَه.');
}
A.balChAnswer = (S, how) => balChSettle(S, how === 'pay' ? 'pay' : 'leave', false);

/* §4 مُختار الصعوبة */
const BAL_DIFFS = ['calm', 'normal', 'hard'];
const balDiffLeft = S => BAL.on && S.diffDay != null ? Math.max(0, BAL.lock - (S.day - S.diffDay)) : 0;
function balDiffPreview(S, k) {                       // الأسواق التي تنزل حصتها عن حدّ المستوى k
  const lose = BAL.ch.lose[BAL_DIFFS.indexOf(k)];
  return S.order.filter(id => { const bs = S.bosses && S.bosses[id]; return bs && bs.ruler === 'player' && bossShare(bs) < lose; }).length;
}
A.setDiff = (S, k) => {
  if (!BAL_DIFFS.includes(k)) return NO('مستوى غير معروف.');
  if (!BAL.on) { S.diff = k === 'normal' ? undefined : k; return OK(''); }     // المطفأ = السطر القائم في 16-events.js حرفاً
  const cur = S.diff || 'normal'; if (k === cur) return OK('');
  const start = !(S.learn && S.learn.char);                                    // قبل اختيار الشخصية = اختيار البدء
  const left = start ? 0 : balDiffLeft(S);
  if (left > 0) return NO('تستطيع تغيير المستوى بعد ' + left + ' يوماً (اليوم ' + (S.diffDay + BAL.lock) + ').');
  S.diff = k === 'normal' ? undefined : k; if (!start) S.diffDay = S.day;
  return OK('المستوى الآن: ' + BAL_LV[BAL_DIFFS.indexOf(k)] + '.');
};
