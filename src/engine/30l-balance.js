/* ---------- 053أ موازنة الاقتصاد: الأثمان والهامش والإيجار وأثر الكوارث وخسائر الإهمال ----------
   مفتاح واحد BAL.on: المطفأ = السلوك الحالي حرفاً (كل دالة هنا تعيد الرقم القديم بالعملية نفسها، ولا حقل جديداً في الحفظ، ولا سحباً عشوائياً جديداً).
   المستوى من S.diff القائم (calm مبتدئ، normal أو الغياب متوسط، hard عالٍ). الثوابت القديمة لا تُعدَّل؛ كل موضع يمرّ بدالة من هنا.
   ما يدفعه اللاعب يُحسب بمستوى لحظة الشراء ويُحفظ مضاعفه على الأصل (bk/whbk، حين BAL.on فقط). */
const BAL = {
  on: false,
  k: {                       // مضاعف على الثمن القائم: [مبتدئ، متوسط، عالٍ]؛ المبتدئ = نصف المتوسط، والعالي = 1.6 ضعفه
    shop: [10, 20, 32],      // الدكان: الشراء والإيجار وثمن التمليك وتحسينات الدكان SHOP_UP_COST
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
  price0: [1.5, 1.5, 1.5],   // السعر الافتراضي لصنف جديد في الدكان (بدل SHOP_PRICE0)؛ 1.3 ابتدائي، رُفع إلى 1.5 (حدّ نطاق ط1 [1.2، 1.5]) لأن ط1ب لا تتحقق بـ1.3: الدخل ينمو مع السعر ×2.6 حتى 2.2 (measure-a.json)
  demand: [0.065, 0.121, 0.224], // مضاعف إقبال الزبائن (بدل SHOP_DEMAND): كان 0.5 ابتدائياً؛ ضُبط بتنصيف 8 تجارب لكل مستوى حتى Y(price0) ≈ 36–40٪ (ط1)
  hit: [0.25, 0.40, 0.60],   // نقص مبيعات دكاكين اللاعب في المدينة المصابة
  fire: [[0.15, 0.30], [0.25, 0.45], [0.35, 0.60]], fireMax: 0.75, // تلف بضاعة المخزن في الحريق
  wet: [0.05, 0.10, 0.20],   // تلف البضاعة المخزّنة في الفيضان أو الحرب
  road: [1.3, 1.6, 2.0], riskCap: 0.8, // خطر الطريق البري من مدينة مصابة أو إليها
  cover: [0.70, 0.50, 0.40], // ما يعوّضه التكافل من تلف المال
  negAt: 50, neg: [0.20, 0.30, 0.40], // نقص إقبال الدكان المملوك حين حالته دون 50
  drift: [0.20, 0.30, 0.40], // نقص الحالة اليومي بلا مدير/أمين (يُطرح بعد +0.15 الصيانة المدفوعة)
  quit: [21, 14, 7]          // أيام تأخير الأجر قبل انصراف العامل (اليوم 5)
};
const BAL_LV = ['مبتدئ', 'متوسط', 'عالٍ'];
const balLv = S => S.diff === 'calm' ? 0 : S.diff === 'hard' ? 2 : 1;
const balK = (S, kind) => BAL.on ? BAL.k[kind][balLv(S)] : 1;
const balBk = o => BAL.on && o && o.bk > 0 ? o.bk : 1;          // مضاعف ما دُفع (الغائب = 1)
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
  const price = Math.round(1500 * Math.pow(1.5, pr.shops.length - 1) * foreignMul(S, c) * balK(S, 'shop')), disc = Math.min(RENT_CREDIT * (sh.rentPaid || 0), RENT_MAXCREDIT * price), pay = Math.round(price - disc);
  return { price, disc, pay, rent: sh.rent };
}

/* §5 المدينة المصابة */
const BAL_HIT = { famine: 'مجاعة', drought: 'جفاف', flood: 'فيضان', plague: 'وباء', war: 'حصار وحرب' };
function balHit(S, id) {
  if (!BAL.on) return null; const c = S.cities[id]; if (!c) return null;
  if (c.sh && (c.sh.k === 'famine' || c.sh.k === 'drought' || c.sh.k === 'flood')) return c.sh.k;
  if (c.ev && (c.ev.k === 'plague' || c.ev.k === 'war')) return c.ev.k;
  return null;
}
const balHitMul = (S, city) => balHit(S, city) ? 1 - BAL.hit[balLv(S)] : 1;
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
const balView = S => BAL_LV.map((name, i) => ({ name, shop: Math.round(1500 * BAL.k.shop[i]), rentPct: Math.round(BAL.rentY[i] * 100), hit: Math.round(BAL.hit[i] * 100), cover: Math.round(BAL.cover[i] * 100) }));
/* القيمة الدفترية للدكاكين المملوكة وللمخازن: الرقم الثابت القائم × ما دُفع فعلاً (مضاعف لحظة الشراء) */
const balShopBook = p => p.shops.reduce((a, sh) => shKind(sh) === 'own' ? a + 1000 * balBk(sh) : a, 0);
const balWhBook = p => p.whs * 800 * balWhBk(p);
const balEndowBook = p => p.shops.reduce((a, sh) => sh.endowed && shKind(sh) === 'own' ? a + 1000 * balBk(sh) : a, 0);
