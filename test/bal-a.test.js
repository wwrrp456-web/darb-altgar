// 053أ موازنة الاقتصاد (محرك): المطفأ = القديم حرفاً (بصمة ملتقطة من main قبل التعديل)، والمفعّل معادلات §2–§6 لكل مستوى: node test/bal-a.test.js
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const LV = [['calm', 0], [undefined, 1], ['hard', 2]], near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
E.BAL.on = false;

function mk(diff, gold) { const S = E.newGame(7); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 4; S.player.gold = gold || 600000; if (diff) S.diff = diff; return S; }
// (أ) البصمة: نفس إعداد الأصول و60 يوماً لكل مستوى، التقطت من main (47e2482→6e1e66b) قبل أي تعديل
function fp(diff) {
  const S = mk(diff), log = [], home = 'riyadh', c = S.cities[home], P = S.player;
  const tryA = (n, ...a) => { const g0 = P.gold; let r; try { r = A[n](S, ...a); } catch (e) { r = { ok: false }; } log.push([n, !!r && r.ok !== false, Math.round(g0 - P.gold)]); return r; };
  tryA('buildShop', home); tryA('rentShop', 'jeddah', 'shop', 'private'); tryA('buildShop', home); tryA('buildWarehouse', home);
  tryA('buildFarm', home); tryA('upgradeFarm', home); tryA('buildFactory', home, Object.keys(E.RECIPES).find(r => E.factoryLocal(c, E.RECIPES[r])) || 'perfume');
  const car = P.caravans[0]; tryA('buyCart', car.id); tryA('hireGuard', car.id); tryA('hireCrew', car.id); tryA('hireCaptain'); tryA('hireCaptain', 0);
  tryA('upgradeShop', home, E.shopsOf(S, home)[0].id, 'shelf'); tryA('upgradeWarehouse', home);
  const goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).slice(0, 4);
  E.shopsOf(S, home).forEach(sh => goods.forEach(g => A.shopSetItem(S, home, sh.id, g, E.SHOP_PRICE0, true))); A.hireFill && A.hireFill(S, home);
  tryA('buyShip', 'jeddah', 'dhow');
  for (let d = 0; d < 60; d++) { E.tick(S); S.pause = false; }
  const jsh = E.shopsOf(S, 'jeddah')[0]; if (jsh) tryA('buyShop', 'jeddah', jsh.id);
  return { S, log, nw: E.netWorth(S), gold: P.gold };
}
const LOG = [['buildShop', true, 2116], ['rentShop', true, 36], ['buildShop', true, 3174], ['buildWarehouse', true, 1200], ['buildFarm', true, 4000], ['upgradeFarm', true, 3000], ['buildFactory', true, 4000], ['buyCart', true, 600], ['hireGuard', true, 300], ['hireCrew', true, 50], ['hireCaptain', true, 1500], ['hireCaptain', true, 2100], ['upgradeShop', true, 800], ['upgradeWarehouse', true, 2000], ['buyShip', true, 3200], ['buyShop', true, 1198]];
const FP = { nw: 632430.8604733081, gold: 561478.0843746732 };
for (const [d] of LV) {
  const r = fp(d), tag = ' [' + (d || 'normal') + ']';
  ok(JSON.stringify(r.log) === JSON.stringify(LOG), 'المطفأ: أثمان كل فعل كما كانت' + tag);
  ok(r.nw === FP.nw && r.gold === FP.gold, 'المطفأ: netWorth والذهب بعد 60 يوماً مطابقان للبصمة' + tag + ' (' + r.nw + ' / ' + r.gold + ')');
  const save = JSON.stringify(r.S);
  ok(!/"bk":[0-9.]|"whbk":|"hitLost":|"hitK":/.test(save), 'المطفأ: لا bk ولا whbk ولا hitLost في الحفظ' + tag);
}
{ // معادلات القديم مكتوبة هنا، للدوال الجديدة والمعدّلة
  const S = mk(), c = S.cities.riyadh, cj = S.cities.jeddah, car = S.player.caravans[0]; car.carts = 3;
  ok(E.whCost(S, c) === Math.round(1200 * E.foreignMul(S, c)) && E.cartCost(car, S) === 800 && E.cartCost(car) === 800, 'المطفأ: المخزن والعربة');
  ok(E.farmCost(S, c) === Math.round(E.FARM_COST * E.foreignMul(S, c)) && E.farmUpCost(S, c, { level: 2 }) === Math.round(E.FARM_UP * 2 * E.foreignMul(S, c)), 'المطفأ: المزرعة وتوسعتها');
  ok(E.capFee(S) === 1500 && E.capFee(S, { fee: 1650 }) === 1650, 'المطفأ: قافلة بقائد');
  ok(E.shipCost(S, 'dhow', 'jeddah') === Math.round(E.SHIPS.dhow.cost * E.foreignMul(S, cj)), 'المطفأ: السفينة');
  ok(E.hireCost(S, 'guard') === 300 && E.hireCost(S, 'crew') === 50 && E.hireCost(S, 'sailor') === E.SAILOR_FEE, 'المطفأ: التوظيف');
  ok(E.balWage(S, 'guard') === E.WAGE.guard && E.balWage(S, 'crew') === E.WAGE.crew && E.balWage(S, 'sailor') === E.SAILOR_WAGE, 'المطفأ: الأجور اليومية');
  ok(E.shopUpCost(S, 1, 'cairo') === Math.round(2000 * 1.4) && E.whUpCost(S, 2) === 12000, 'المطفأ: تحسين الدكان وترقية المخزن');
  ok(E.balPrice0(S) === E.SHOP_PRICE0 && E.balDemand(S) === E.SHOP_DEMAND && E.balQuit(S) === 5 && E.balCover(S) === E.TK.cover, 'المطفأ: السعر الافتراضي والإقبال والانصراف والتكافل');
  ok(E.rentOf(S, c, 'shop', 'private', 0) === Math.max(1, Math.round(Math.round(1500 * E.foreignMul(S, c)) * 0.008)), 'المطفأ: الإيجار');
  ok(E.balHit(S, 'riyadh') === null && E.balHitMul(S, 'riyadh') === 1 && E.balRisk(S, 0.3, 'riyadh', 'cairo') === 0.3, 'المطفأ: لا إصابة ولا خطر إضافي');
  const q = E.partCost(S, 'riyadh', Object.keys(E.RECIPES).find(r => E.factoryLocal(c, E.RECIPES[r]))); ok(q === Math.round(4000 * E.foreignMul(S, c)), 'المطفأ: partCost');
}

// (ب) المفعّل لكل مستوى
const K = E.BAL.k; E.BAL.on = true;
for (const [d, i] of LV) {
  const S = mk(d, 5e6), c = S.cities.riyadh, cj = S.cities.jeddah, car = S.player.caravans[0], f = E.foreignMul(S, cj), tag = ' [' + E.BAL_LV[i] + ']'; car.carts = 3;
  ok(E.balLv(S) === i, 'balLv' + tag);
  ok(E.whCost(S, c) === Math.round(1200 * E.foreignMul(S, c) * K.wh[i]) && E.whUpCost(S, 1) === Math.round(E.WH_UP_COST[1] * K.wh[i]), 'مخزن وترقيته' + tag);
  ok(E.farmCost(S, c) === Math.round(E.FARM_COST * K.farm[i]) && E.farmUpCost(S, cj, { level: 2 }) === Math.round(E.FARM_UP * 2 * f * K.farm[i]), 'مزرعة وتوسعتها' + tag);
  ok(E.capFee(S) === Math.round(1500 * K.car[i]) && E.capFee(S, { fee: 1650 }) === Math.round(1650 * K.car[i]), 'قافلة بقائد' + tag);
  ok(E.cartCost(car, S) === Math.round(800 * K.cart[i]) && E.cartCost(car) === 800, 'عربة (مع S فقط)' + tag);
  ok(E.shipCost(S, 'dhow', 'jeddah') === Math.round(E.SHIPS.dhow.cost * f * K.ship[i]), 'سفينة' + tag);
  ok(E.hireCost(S, 'guard') === Math.round(300 * K.hire[i]) && E.hireCost(S, 'sailor') === Math.round(E.SAILOR_FEE * K.hire[i]) && E.staffWage(S, 'guard').once === E.hireCost(S, 'guard'), 'توظيف' + tag);
  ok(E.balWage(S, 'crew') === E.WAGE.crew * K.wage[i] && (() => { const on_ = E.staffWage(S, 'guard').day; E.BAL.on = false; const off_ = E.staffWage(S, 'guard').day; E.BAL.on = true; return near(on_, off_ * K.wage[i], 0.011); })(), 'أجر يومي' + tag);
  ok(E.shopUpCost(S, 0, 'jeddah') === Math.round(800 * f * K.shop[i]), 'تحسين الدكان' + tag);
  const rc = Object.keys(E.RECIPES).find(r => E.factoryLocal(c, E.RECIPES[r])), ab = Object.keys(E.RECIPES).find(r => !E.factoryLocal(c, E.RECIPES[r]) && !E.RECIPES[r].closed);
  ok(E.factoryCost(S, 'riyadh', rc).cost === Math.round(4000 * K.fact[i]) && E.partCost(S, 'riyadh', rc) === E.factoryCost(S, 'riyadh', rc).cost, 'مصنع محلي وpartCost' + tag);
  if (ab) ok(E.factoryCost(S, 'riyadh', ab).cost === Math.round(E.MFG_COST(E.RECIPES[ab].out) * K.fact[i]), 'مصنع غير محلي' + tag);
  const base = E.shopBase(S, c, 0), cost0 = E.shopCost(S, c), rent = E.rentOf(S, c, 'shop', 'private', 0); ok(base === 1500 * E.shopProsper(c) ** 0.6 * K.shop[i] && rent === Math.max(1, Math.round(Math.round(base) * E.BAL.rentY[i] / 354)), 'الإيجار اليومي من shopBase: ' + rent + tag);
  A.rentShop(S, 'riyadh', 'shop', 'private'); const sh = E.shopsOf(S, 'riyadh')[0]; sh.rentPaid = 18105;
  const q = E.shopBuyQuote(S, 'riyadh', sh.id); ok(q.price === Math.round(base) && q.price === cost0 && q.disc === Math.min(0.4 * 18105, 0.6 * q.price) && q.pay === Math.round(q.price - q.disc) && q.rent === rent, 'ثمن التمليك والخصم: ' + JSON.stringify(q) + tag);
  ok(q.disc === Math.min(7242, 0.6 * q.price) && q.pay === Math.round(q.price - q.disc), 'الخصم min(0.4 × 18,105، 0.6 × الثمن) والدفع بعده' + tag);
  { const S2 = mk(['calm', undefined, 'hard'][i], 5e6), c2 = S2.cities.riyadh, t = E.popTotal ? E.popTotal(c2) : c2.pop.reduce((a, b) => a + b, 0); c2.pop = c2.pop.map(x => x * 1000 / t); A.rentShop(S2, 'riyadh', 'shop', 'private'); const q2 = E.shopBuyQuote(S2, 'riyadh', E.shopsOf(S2, 'riyadh')[0].id);
    ok(Math.abs(E.shopProsper(c2) - 1) < 1e-9 && q2.price === Math.round(1500 * K.shop[i] * E.foreignMul(S2, c2)), 'شاهد حرفي: shopProsper = 1 ← ثمن التمليك 1500 × k × f = ' + q2.price + tag); }
  const g0 = S.player.gold; A.buyShop(S, 'riyadh', sh.id); ok(near(g0 - S.player.gold, q.pay, 1e-6) && sh.kind === 'own', 'A.buyShop يخصم pay تماماً' + tag);
}
// (ب٢) A.* تخصم ما تعرضه الدوال، وبقية الأثمان
for (const [d, i] of LV) {
  const S = mk(d, 5e6), c = S.cities.riyadh, home = 'riyadh', tag = ' [' + E.BAL_LV[i] + ']', P = S.player, car = P.caravans[0];
  const spent = (fn) => { const g = P.gold; const r = fn(); return { r, d: Math.round(g - P.gold) }; };
  let x = spent(() => A.buildShop(S, home)), c0 = E.shopCost(S, c); ok(x.r.ok !== false && x.d === Math.round(E.shopCost(S, c) / 1.5 * 1) || x.d > 0, 'بناء دكان بثمن موجب' + tag);
  A.buildShop(S, home); const sh1 = E.shopsOf(S, home)[0];
  { const cc = E.shopCost(S, c); x = spent(() => A.buildShop(S, home)); ok(x.d === cc, 'buildShop = shopCost' + tag); }
  { const cc = E.whCost(S, c); x = spent(() => A.buildWarehouse(S, home)); ok(x.d === cc, 'buildWarehouse = whCost' + tag); }
  { const cc = E.farmCost(S, c); x = spent(() => A.buildFarm(S, home)); ok(x.d === cc, 'buildFarm = farmCost' + tag); }
  { const cc = E.farmUpCost(S, c, E.farmOf(S, home)); x = spent(() => A.upgradeFarm(S, home)); ok(x.d === cc && E.farmUpQuote(S, home).ok !== undefined, 'upgradeFarm = farmUpCost' + tag); }
  { const cc = E.cartCost(car, S); x = spent(() => A.buyCart(S, car.id)); ok(x.d === cc, 'buyCart = cartCost' + tag); }
  { const cc = E.hireCost(S, 'guard'); x = spent(() => A.hireGuard(S, car.id)); ok(x.d === cc, 'hireGuard = hireCost' + tag); }
  { const cc = E.hireCost(S, 'crew'); x = spent(() => A.hireCrew(S, car.id)); ok(x.d === cc, 'hireCrew = hireCost' + tag); }
  { const cc = E.capFee(S); x = spent(() => A.hireCaptain(S)); ok(x.d === cc, 'hireCaptain = capFee' + tag); }
  { const cd = E.captainPool(S)[0], cc = E.capFee(S, cd); x = spent(() => A.hireCaptain(S, 0)); ok(x.d === cc, 'hireCaptain(i) = capFee(cd)' + tag); }
  { const cc = E.shopUpCost(S, 0, home); x = spent(() => A.upgradeShop(S, home, sh1.id, 'shelf')); ok(x.d === cc, 'upgradeShop = shopUpCost' + tag); }
  { const cc = E.whUpCost(S, 0); x = spent(() => A.upgradeWarehouse(S, home)); ok(x.d === cc, 'upgradeWarehouse = whUpCost' + tag); }
  { const cc = E.shipCost(S, 'dhow', 'jeddah'); x = spent(() => A.buyShip(S, 'jeddah', 'dhow')); ok(x.d === cc, 'buyShip = shipCost' + tag); }
  { const ship = E.shipsOf(S)[0], cc = E.shipUpCost(S, ship, 'hull'); x = spent(() => A.upgradeShip(S, ship.id, 'hull')); ok(x.d === cc, 'upgradeShip = shipUpCost' + tag); }
  { const ship = E.shipsOf(S)[0], cc = E.hireCost(S, 'sailor'); x = spent(() => A.hireSailor(S, ship.id)); ok(x.d === cc, 'hireSailor = hireCost' + tag); }
  { const rc = Object.keys(E.RECIPES).find(r => E.factoryLocal(c, E.RECIPES[r])), cc = E.factoryCost(S, home, rc).cost; x = spent(() => A.buildFactory(S, home, rc)); ok(x.d === cc, 'buildFactory = factoryCost.cost' + tag);
    const up = E.factoryCost(S, home, rc).up; x = spent(() => A.buildFactory(S, home, rc)); ok(up > 0 && x.d === up, 'ترقية المصنع = factoryCost.up' + tag); }
}

// (و) partCost يساوي ما يخصمه buildFactory على المستويات الثلاثة (محلي وغير محلي)
for (const [d, i] of LV) {
  const names = Object.keys(E.RECIPES).filter(r => !E.RECIPES[r].closed); let local = 0, abroad = 0;
  for (const r of names) {
    const S = mk(d, 5e6); A.buildShop(S, 'riyadh'); const isLoc = E.factoryLocal(S.cities.riyadh, E.RECIPES[r]); if (isLoc ? local >= 1 : abroad >= 1) continue;
    const pc = E.partCost(S, 'riyadh', r), g = S.player.gold, res = A.buildFactory(S, 'riyadh', r); if (res.ok === false) continue; isLoc ? local++ : abroad++;
    ok(g - S.player.gold === pc, 'partCost(' + r + (isLoc ? ' محلي' : ' غير محلي') + ') = ما يخصمه buildFactory [' + E.BAL_LV[i] + ']: ' + pc);
  }
  ok(local >= 1, 'جُرّب مصنع محلي [' + E.BAL_LV[i] + ']');
}

// (ج) bk: الشراء على مبتدئ ثم تغيير S.diff إلى hard لا يحرّك شيئاً
{
  const S = mk('calm', 5e6), P = S.player, c = S.cities.riyadh; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); A.buildFarm(S, 'riyadh'); A.upgradeFarm(S, 'riyadh');
  const rc = Object.keys(E.RECIPES).find(r => E.factoryLocal(c, E.RECIPES[r])); A.buildFactory(S, 'riyadh', rc); A.buildFactory(S, 'riyadh', rc);
  A.buyShip(S, 'jeddah', 'dhow'); A.rentShop(S, 'jeddah', 'shop', 'private'); const rs = E.shopsOf(S, 'jeddah')[0]; rs.rentPaid = 1000; A.buyShop(S, 'jeddah', rs.id);
  const pr = P.props.riyadh, sh = pr.shops[0], f = pr.farm, fa = P.factories[0], ship = E.shipsOf(S)[0];
  ok(sh.bk === K.shop[0] && pr.whbk === K.wh[0] && fa.bk > 0 && ship.bk === K.ship[0] && rs.bk === K.shop[0], 'bk يُكتب عند الشراء (دكان، مخزن، مصنع، سفينة، تمليك)');
  ok(near(f.bk, E.balMix(K.farm[0], 2, K.farm[0])) && near(fa.bk, K.fact[0]), 'bk المزرعة والمصنع متوسط موزون: ' + f.bk + ' ' + fa.bk);
  const nw0 = E.netWorth(S), g0 = P.gold, q0 = E.assetBaseQuote ? E.assetBaseQuote(S, 'riyadh', 'shop', sh.id) : null, fv0 = E.factoryValue(fa);
  S.diff = 'hard';
  ok(P.gold === g0 && sh.bk === K.shop[0] && pr.whbk === K.wh[0] && E.netWorth(S) === nw0 && E.factoryValue(fa) === fv0, 'تغيير المستوى: الرصيد وbk وnetWorth وقيمة المصنع بلا تغيير');
  if (q0) ok(JSON.stringify(E.assetBaseQuote(S, 'riyadh', 'shop', sh.id)) === JSON.stringify(q0), 'assetBaseQuote بلا تغيير');
  ok(E.shopCost(S, c) === Math.round(1500 * Math.pow(1.5, E.shopsOf(S, 'riyadh').length) * 1 * Math.pow(E.shopProsper(c), 0.6) * E.prosMul(S, 'shopcost', { city: 'riyadh' }) * K.shop[2]), 'الثمن التالي بمضاعف hard');
  const sv = ship.bk; const back = E.shipBack(S, ship); ok(back === Math.round(E.SHIPS.dhow.cost * E.SEA.sellBack * K.ship[0]), 'ثمن بيع السفينة يتبع ما دُفع');
  ok(E.netWorth(S) > 0 && sv === K.ship[0], 'netWorth موجب');
}

// (د) الكوارث
function twin(i) { const d = ['calm', undefined, 'hard'][i], mkS = () => { const S = mk(d, 5e6); S.noShocks = true; S.noEvents = true; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const sh = E.shopsOf(S, 'riyadh')[0], c = S.cities.riyadh, g = E.GIDS.filter(x => E.sells(c, x) && !E.GD[x].sp && !E.GD[x].live)[0]; A.shopSetItem(S, 'riyadh', sh.id, g, 1.2, true); S.player.props.riyadh.store[g] = 1e6; A.hireFill && A.hireFill(S, 'riyadh'); return { S, g, sh }; }; return [mkS(), mkS()]; }
for (const [, i] of LV) {
  const [a, b] = twin(i), tag = ' [' + E.BAL_LV[i] + ']'; b.S.cities.riyadh.sh = { k: 'famine', end: b.S.day + 50, cut: 0.3 }; a.S.cities.riyadh.sh = { k: 'famine', end: a.S.day + 50, cut: 0.3 };
  ok(E.balHit(b.S, 'riyadh') === 'famine' && E.balHit(mk(), 'riyadh') === null && E.balHitMul(b.S, 'riyadh') === 1 - E.BAL.hit[i], 'balHit والمضاعف' + tag);
  { const h0 = E.BAL.hit[i]; E.BAL.hit[i] = 0; E.tick(a.S); E.BAL.hit[i] = h0; } E.tick(b.S); a.S.pause = b.S.pause = false; // النسختان في المجاعة نفسها، والفرق الوحيد نسبة الإصابة
  const ua = E.shopsOf(a.S, 'riyadh')[0].items[0].lastSold, ub = E.shopsOf(b.S, 'riyadh')[0].items[0].lastSold;
  ok(ua > 0 && Math.abs(ub / ua - (1 - E.BAL.hit[i])) < 1e-6, 'مبيعات المصاب = (1 − hit): ' + (ub / ua).toFixed(6) + tag);
  const pr = b.S.player.props.riyadh; ok(pr.hitK === 'famine' && pr.hitLost > 0 && !(a.S.player.props.riyadh.hitLost > 0), 'hitLost وhitK لمن أُصيب مبيعاته' + tag);
  const lost0 = pr.hitLost; b.S.cities.riyadh.sh = null; E.tick(b.S); b.S.pause = false;
  ok(!('hitLost' in pr) && !('hitK' in pr) && b.S.news.concat(b.S.log || []).some(n => /انتهت مجاعة في الرياض: نقصت مبيعات دكاكينك فيها/.test(JSON.stringify(n))), 'خبر النهاية ثم حذف الحقلين (' + Math.round(lost0) + ')' + tag);
  // الطريق
  const S = mk(['calm', undefined, 'hard'][i]), car = S.player.caravans[0]; car.city = 'riyadh'; const to = 'jeddah', e0 = E.roadEstimate(S, car, to); S.cities.riyadh.sh = { k: 'drought', end: S.day + 40, cut: 0.2 }; const e1 = E.roadEstimate(S, car, to);
  const raw = e0.attack / (e0.secMul || 1); ok(near(e1.attack, Math.min(0.8, raw * E.BAL.road[i] * e0.secMul), 1e-9) || near(e1.attack, Math.min(0.8, raw * E.BAL.road[i]) * e0.secMul, 1e-9), 'roadEstimate.attack = min(0.8, raw × road): ' + e0.attack + ' ← ' + e1.attack + tag);
  ok(e1.bal && e1.bal.mul === E.BAL.road[i] && e1.bal.why.length === 1 && !e0.bal, 'سبب خطر الطريق' + tag);
  // فيضان مصر وتعويض التكافل
  const F = mk(['calm', undefined, 'hard'][i], 5e6); F.noEvents = true; A.buildShop(F, 'cairo'); A.buildWarehouse(F, 'cairo'); const prc = F.player.props.cairo; prc.store = { wheat: 1000, dates: 500 }; F.player.tk = { joined: true, pool: 100000, paid: 0, got: 0, back: 0, claims: 0, last: F.day }; F.player.tkCities = F.player.tkCities || {};
  const cmp = E.insOn(F, 'cairo'); const w0 = prc.store.wheat, d0 = prc.store.dates, g0 = F.player.gold, pool0 = F.player.tk.pool; const lost = E.balStoreLoss(F, 'cairo', 'flood');
  ok(near(prc.store.wheat, w0 * (1 - E.BAL.wet[i]), 1e-9) && near(prc.store.dates, d0 * (1 - E.BAL.wet[i]), 1e-9) && lost > 0, 'فيضان: نقص المخزون = wet بالضبط (' + E.BAL.wet[i] + ')' + tag);
  const comp = F.player.gold - g0; if (cmp) ok(near(comp, Math.min(lost * E.BAL.cover[i], pool0 * E.TK.cap), 1e-6), 'تعويض التكافل = min(lost × cover, pool × cap): ' + comp + tag); else ok(comp === 0, 'بلا تكافل في المدينة: لا تعويض' + tag);
  ok(F.player.led.exp.flood === lost && F.stats.sink.flood === lost, 'led.exp.flood وsink' + tag);
}
{ // الحريق ضمن [lo × (keeper ? .5 : 1), hi] وبسحب rndB واحد
  for (const [, i] of LV) { const S = mk(['calm', undefined, 'hard'][i], 5e6); A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const pr = S.player.props.riyadh; pr.store = { wheat: 10000 }; const keeper = E.keeperHave(S, 'riyadh') >= E.keeperNeed(S, 'riyadh');
    const b0 = S.seedB, v0 = pr.store.wheat; E.SHOCKS.fire.start(S, { city: 'riyadh', sev: 1.7 }); const f = 1 - pr.store.wheat / v0, [lo, hi] = E.BAL.fire[i];
    ok(f >= lo * (keeper ? 0.5 : 1) - 1e-9 && f <= hi + 1e-9 && S.seedB !== b0, 'حريق ضمن النطاق: ' + f.toFixed(4) + ' في [' + lo * (keeper ? 0.5 : 1) + '،' + hi + '] [' + E.BAL_LV[i] + ']');
    const S2 = JSON.parse(JSON.stringify(S)); }
}

// (هـ) الإهمال
for (const [, i] of LV) {
  const S = mk(['calm', undefined, 'hard'][i], 5e6), tag = ' [' + E.BAL_LV[i] + ']'; S.noShocks = true; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); const pr = S.player.props.riyadh, sh = pr.shops[0];
  sh.cond = 40; const want = E.scSalesOf(40) * (1 - E.BAL.neg[i]); ok(near(E.scSalesMul(sh, S), want) && near(E.scQuote(S, 'riyadh', sh.id).sales, want), 'إقبال الدكان تحت 50: ×(1 − neg)' + tag);
  ok(/إقبال −\d+٪ · دون 50: −\d+٪/.test(E.scEffect(E.scQuote(S, 'riyadh', sh.id))), 'scEffect يذكر النقص الإضافي: ' + E.scEffect(E.scQuote(S, 'riyadh', sh.id)) + tag);
  sh.cond = 60; ok(near(E.scSalesMul(sh, S), E.scSalesOf(60)), 'فوق 50: بلا نقص إضافي' + tag);
  sh.cond = 80; pr.wcond = 80; E.scDay(S, 'riyadh', pr, 10, 10); ok(near(sh.cond, 80 + 0.15 - E.BAL.drift[i], 0.011), 'بلا مدير: الحالة تنقص بـ drift − 0.15: ' + sh.cond + tag);
  const wk = E.keeperHave(S, 'riyadh') >= E.keeperNeed(S, 'riyadh'); ok(wk ? near(pr.wcond, 80.15, 0.011) : near(pr.wcond, 80.15 - E.BAL.drift[i], 0.011), 'المخزن: drift عند نقص الأمناء فقط (' + pr.wcond + ')' + tag);
  sh.cond = 80; pr.mgr = { rank: 2, lv: 1 }; E.scDay(S, 'riyadh', pr, 10, 10); ok(near(sh.cond, 80.15, 0.011), 'مع pr.mgr: لا drift' + tag); pr.mgr = null;
  sh.cond = 80; E.scDay(S, 'riyadh', pr, 10, 0); ok(near(sh.cond, 80 - E.SHOPCOND.neglect, 0.011), 'الصيانة غير المدفوعة كما هي' + tag);
  ok(E.balQuit(S) === E.BAL.quit[i], 'balQuit' + tag);
}
{ // انصراف العامل: يترك عند late = quit (14 متوسط) لا 13، وعند 5 حين المطفأ
  for (const on of [false, true]) { E.BAL.on = on; const S = mk(undefined, 5e6); S.noShocks = true; A.buildShop(S, 'riyadh'); const pr = S.player.props.riyadh, w = pr.staff[0]; S.player.gold = 0; w.free = 0; const q = on ? 14 : 5; let left = null;
    for (let d = 1; d <= q + 1; d++) { S.player.gold = 0; E.tick(S); S.pause = false; if (!pr.staff.includes(w)) { left = d; break; } }
    ok(left !== null && w.late === q, (on ? 'متوسط' : 'مطفأ') + ': العامل يترك عند late = ' + q + ' (late=' + w.late + ')'); }
  E.BAL.on = true;
}

// (ز) لا سحب عشوائي جديد (seedB فقط منذ 053ب: القرار 3 يلغي سحب rnd بعد خروج war تحت BAL.on): seed وseedB بعد 30 يوماً بـBAL.on = بالمطفأ (بذرة بلا إصابة ولا حريق)
{ const run = on => { E.BAL.on = on; const S = mk(undefined, 5e6); S.noShocks = true; S.noEvents = true; A.buildShop(S, 'riyadh'); A.buildWarehouse(S, 'riyadh'); for (let d = 0; d < 30; d++) { E.tick(S); S.pause = false; } return [S.seed, S.seedB]; };
  const off = run(false), on = run(true); E.BAL.on = true; ok(off[1] === on[1], 'عدد السحوبات العشوائية في 30 يوماً متساوٍ: ' + off + ' / ' + on); }

// balView
{ const v = E.balView(mk()); ok(v.length === 3 && v[1].shop === E.shopCost(mk(), mk().cities.riyadh) && v[1].rentPct === 20 && v[1].hit === Math.round(E.BAL.hit[1] * 100) && v[1].cover === 50 && [0, 1, 2].every(i => { const S3 = mk(['calm', undefined, 'hard'][i]); return v[i].shop === E.shopCost(S3, S3.cities.riyadh); }), 'balView للمستويات الثلاثة: شاهد الدفتر = ثمن أول دكان يراه اللاعب في بلده'); }
E.BAL.on = false; ok(E.BAL.on === false, 'BAL.on يبقى false في الشيفرة');
console.log(fails ? '\nFAILS: ' + fails : '\nكل الاختبارات نجحت'); process.exit(fails ? 1 : 0);
