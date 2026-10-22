/* ---------- العقارات: دكاكين ومخازن ---------- */
const SHOP_ITEMS_MAX = 4, WH_CAP = 400, SHELF_CAP = 80;
/* اقتصاد الدكان: زبائن المدينة يشترون من دكانك بمعدّل SHOP_DEMAND ضعف طلب السلعة المنسوب إليك، والسعر الافتراضي 130٪ (الزبون يقبل غلاءً معقولاً: عند 130٪ يقلّ البيع نحو الربع فقط فيرتفع الربح كثيراً) */
const SHOP_DEMAND = 1, SHOP_PRICE0 = 1.8, SHOP_BUYBELOW = 1.05, RETAIL_BASE = 1.5;
/* سوق الجملة (السعر المعروض في السوق) هو ما يدفعه كبار التجار بالكميات، وسعر التجزئة في الدكان أعلى بحكم أن الناس تشتري منه: يتساوى طلب الزبائن مع سعر الجملة × RETAIL_BASE. ومدينة أكثر ازدهاراً (سكان أكثر) تبيع أكثر وبثمن أعلى. */
const shopProsper = c => Math.max(0.6, Math.min(2.6, Math.pow(popTotal(c) / 1000, 1.5)));
const shopF = (c, g, price, mp, sign) => clamp(1.8 + 0.1 * sign - 0.8 * (price / (mp * RETAIL_BASE)), 0, 1.3);
const shopsOf = (S, city) => (S.player.props[city] ? S.player.props[city].shops : []);
const whsOf = (S, city) => (S.player.props[city] ? S.player.props[city].whs : 0);
const shopLimit = c => Math.floor(2 + 2 * c.size) + (c.tier - 1);
const foreignMul = (S, c) => (c.country === S.home ? 1 : 1.4);
const shopCost = (S, c) => Math.round(1500 * Math.pow(1.5, shopsOf(S, c.id).length) * foreignMul(S, c) * Math.pow(shopProsper(c), 0.6));
const whCost = (S, c) => Math.round(1200 * Math.pow(1.4, whsOf(S, c.id)) * foreignMul(S, c));
/* بسطة ← دكان مؤجَّر ← شراء: الإيجار يومي ويُخصم 40٪ مما دفعتَه من سعر الشراء لاحقاً */
const STALL_CAP = 40, STALL_ITEMS = 2, STALL_RENT = 4, RENT_RATE = 0.008, RENT_CREDIT = 0.4, RENT_MAXCREDIT = 0.6, EVICT_DAYS = 5;
const shKind = sh => sh.kind || 'own';
/* تحسين الدكان المملوك (كل بند مستويان): رفوف +25٪ سعة، مظلة +6٪ إقبال، لافتة تُجيز سعراً أعلى قليلاً قبل أن يعزف الزبائن */
const SHOP_UP = { shelf: { name: 'رفوف إضافية', desc: 'تزيد سعة الدكان 25٪ لكل مستوى' }, awning: { name: 'مظلة السوق', desc: 'تزيد إقبال الزبائن 6٪ لكل مستوى' }, sign: { name: 'لافتة مميزة', desc: 'يتحمل الزبائن سعراً أعلى قليلاً' } };
const SHOP_UP_COST = [800, 2000], shUp = (sh, k) => (sh.up && sh.up[k]) || 0;
const shCap = sh => (shKind(sh) === 'stall' ? STALL_CAP : Math.round(SHELF_CAP * (1 + 0.25 * shUp(sh, 'shelf'))));
const shItemsMax = sh => (shKind(sh) === 'stall' ? STALL_ITEMS : SHOP_ITEMS_MAX);
const ownShops = p => p.shops.filter(sh => shKind(sh) === 'own').length;
const storeCap = (S, city) => whsOf(S, city) * WH_CAP + shopsOf(S, city).reduce((a, sh) => a + shCap(sh), 0);
function storeLoad(S, city) { const p = S.player.props[city]; if (!p) return 0; let s = 0; for (const g in p.store) s += (p.store[g] || 0) * GD[g].w; return s; }
const storeRoom = (S, city) => Math.max(0, storeCap(S, city) - storeLoad(S, city));
const hasPresence = (S, city) => shopsOf(S, city).length > 0;
/* ---------- عمّال المتاجر: بائعون لكل دكان وأمناء للمخازن، بأجر يومي ويترقّون بالأيام ---------- */
const WK = { seller: { name: 'بائع', wage: [6, 9, 12], pts: [1, 1.25, 1.5] }, keeper: { name: 'أمين مخزن', wage: [8, 12, 17] }, farmer: { name: 'مزارع', wage: [7, 10, 14], pts: [1, 1.25, 1.5] } };
const WK_LV = ['مبتدئ', 'ماهر', 'خبير'], WK_PROMO = [0, 40, 120], SELLER_PTS = 1, SHRINK = 0.004, WK_FREE = 30, WK_CAP = 1.2;
const staffOf = (S, city) => (S.player.props[city] && S.player.props[city].staff) || [];
const wkLv = w => (w.days >= WK_PROMO[2] ? 2 : w.days >= WK_PROMO[1] ? 1 : 0);
const wkWage = (S, c, w) => Math.round(WK[w.role].wage[wkLv(w)] * (0.85 + 0.25 * c.size) * (c.country === S.home ? 1 : 1.2));
const sellerNeed = (S, city) => shopsOf(S, city).reduce((a, sh) => a + (shKind(sh) === 'stall' ? 1 : SELLER_PTS), 0);
const keeperNeed = (S, city) => whsOf(S, city);
const sellerPts = (S, city) => staffOf(S, city).filter(w => w.role === 'seller').reduce((a, w) => a + WK.seller.pts[wkLv(w)] * (w.late > 0 ? 0.5 : 1), 0);
const keeperHave = (S, city) => staffOf(S, city).filter(w => w.role === 'keeper' && !(w.late > 0)).length;
const sellFactor = (S, city) => { const n = sellerNeed(S, city); return n ? Math.min(WK_CAP, sellerPts(S, city) / n) : 0; };
const hirePool = (S, city) => Math.max(0, Math.floor(S.cities[city].pop[0] / 40) - staffOf(S, city).length);

/* تقرير البائع: لكل سلعة في الدكان حالتها اليوم وسببها بنفس معادلة البيع في 19-player.js (f = 1.8 + 0.1·لافتة − 0.8·سعرك/سعر السوق)، ومعها إصلاح بنقرة.
   الحالات: nobody (لا بائع) · empty (المخزن فارغ) · wait (التعبئة الآلية تنتظر الرخص) · loss (أقل من تكلفتك) · high (غالٍ) · ok (بيع) · new (لم يمضِ يوم بعد) */
function shopReport(S, city, shopId) {
  const sh = shopsOf(S, city).find(s => s.id === shopId), pr = S.player.props[city], c = S.cities[city]; if (!sh || !pr) return [];
  const sf = sellFactor(S, city);
  return sh.items.map(it => {
    const g = it.g, mp = unitPrice(c, g), qm = qualOf(pr.basis, g), ref = refPrice(c, g), price = it.price * ref * qm, have = Math.floor(pr.store[g] || 0);
    const f = shopF(c, g, price, mp, shUp(sh, 'sign')), cost = avgCost(pr.basis, g), sold = it.lastSold || 0;
    const pctOf = p => Math.round(p / (ref * qm) * 100), aim = mp * RETAIL_BASE * (1.375 + 0.125 * shUp(sh, 'sign'));
    const sug = Math.max(50, Math.min(200, Math.max(Math.round(pctOf(aim) / 5) * 5, cost != null ? Math.ceil(cost * 1.15 / (ref * qm) * 100 / 5) * 5 : 0)));
    const o = { g, f, price, mp, have, sold, cost, sug, pct: Math.round(it.price * 100) };
    if (sf <= 0) return Object.assign(o, { st: 'nobody', msg: 'لا يوجد بائع في الدكان فلا أبيع شيئاً.', fix: 'hire' });
    if (have < 1 && it.carry) return Object.assign(o, { st: 'soon', msg: 'المخزن فارغ، وسأستلم هذه السلعة من قافلتك حين تصل.' });
    if (have < 1) return Object.assign(o, !it.auto
      ? { st: 'empty', msg: 'المخزن فارغ من هذه السلعة فلا أجد ما أبيعه. فعّل التعبئة الآلية أو أودع بضاعة من قافلتك.', fix: 'auto' }
      : ratio(c, g) >= it.buyBelow
        ? { st: 'wait', msg: 'المخزن فارغ والتعبئة الآلية تنتظر أن يرخص السعر عن ' + Math.round(it.buyBelow * 100) + '٪ من المعتاد. يمكنك أن تودع بضاعة من قافلتك.' }
        : { st: 'soon', msg: 'المخزن فارغ، والتعبئة الآلية ستشتري لي من السوق غداً.' });
    if (cost != null && price < cost) {
      const need = Math.ceil(cost / (ref * qm) * 100 / 5) * 5;
      return Object.assign(o, need > 200 ? { st: 'loss', msg: 'اشتريتَها بأغلى مما يُباع به هنا. الأفضل أن تبيعها بقافلتك في مدينة أغلى.' } : { st: 'loss', msg: 'سعرك أقل مما دفعتَه فيها، فأبيعها بخسارة. ارفعه إلى ' + Math.max(sug, need) + '٪.', fix: 'price', to: Math.max(sug, need) });
    }
    if (f < 0.35 && sold < 0.05) return Object.assign(o, { st: 'high', msg: 'لم أبع شيئاً: سعرك ' + Math.round(price / mp * 100) + '٪ من سعر الجملة، وهذا غالٍ حتى على الزبائن. اخفضه إلى ' + sug + '٪.', fix: 'price', to: sug });
    if (sold >= 0.05) return Object.assign(o, { st: 'ok', msg: 'بعتُ ' + (Math.round(sold * 10) / 10) + ' وحدة اليوم' + (cost != null ? '، وربحك في الوحدة ≈ ' + Math.round((price - cost) * 10) / 10 + ' ريال.' : '.') + (f < 0.45 ? ' سعرك مرتفع فالبيع بطيء، جرّب خفضه قليلاً.' : '') });
    return Object.assign(o, { st: 'new', msg: 'جاهز للبيع. أخبرك غداً بما بعتُ.' });
  });
}

/* «يستلم من قافلتي»: عند وصول قافلتك مدينة فيها دكانك، يأخذ البائع من حمولتها السلعة التي فعّلتَ لها الخيار حتى بلوغ هدف الدكان (60 وحدة) بحدّ سعة المخزن */
function shopCarry(S, car) {
  const city = car.city, pr = S.player.props[city]; if (!pr || !hasPresence(S, city) || car.left > 0) return;
  let moved = 0;
  shopsOf(S, city).forEach(sh => sh.items.forEach(it => {
    const g = it.g; if (!it.carry || GD[g].live) return;
    const q = Math.floor(Math.min(car.cargo[g] || 0, Math.max(0, (it.target || 60) - (pr.store[g] || 0)), storeRoom(S, city) / GD[g].w)); if (q < 1) return;
    const ql = qualOf(car.basis, g), bc = takeBasis(car.basis, g, q); pr.basis = pr.basis || {}; addBasis(pr.basis, g, q, bc, ql);
    car.cargo[g] -= q; pr.store[g] = (pr.store[g] || 0) + q; moved++;
    if (car.main) news(S, 'استلم بائع دكانك ' + q + ' ' + GD[g].name + ' من قافلتك في ' + S.cities[city].name + '.', 'good');
  }));
  return moved;
}

/* ربح الدكان الصافي للمدينة: متوسط آخر أيام (دخل بعد الضريبة، وصافٍ بعد تكلفة البضاعة والأجور والصيانة) */
function shopPnl(S, city, n) {
  const pr = S.player.props[city], h = (pr && pr.hist || []).slice(-(n || 7)); if (!h.length) return null;
  const sum = k => h.reduce((a, x) => a + (x[k] || 0), 0);
  return { days: h.length, rev: sum('rev') / h.length, net: sum('net') / h.length, total: sum('net') };
}
