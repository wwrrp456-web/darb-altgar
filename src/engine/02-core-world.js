/* ---------- عشوائية بذرية ---------- */
// حالة Mulberry32 تبقى 32-بت؛ تراكمها كعدد كبير يفقد الدقة في المسيرات الطويلة.
// تيار مستقل لأصناف المواشي حتى لا تتغيّر عوالم البذور القديمة بإضافتها
function rndB(S) {
  let t = (S.seedB = (((S.seedB === undefined ? 0x2F6E2B1 : S.seedB) >>> 0) + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rndG = (S, g) => (GD[g].sp || GD[g].fresh ? rndB(S) : rnd(S));
function rnd(S) {
  let t = (S.seed = ((S.seed >>> 0) + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (S, a, b) => a + (b - a) * rnd(S);

/* ---------- محاسبة ---------- */
function fauc(S, cat, amt) { S.stats.fauc[cat] = (S.stats.fauc[cat] || 0) + amt; }
function sink(S, cat, amt) { S.stats.sink[cat] = (S.stats.sink[cat] || 0) + amt; }
function pPay(S, cat, amt, hard) {
  if (!(amt > 0)) return 0;
  amt = Math.min(amt, S.player.gold);
  S.player.gold -= amt; S.player.led.exp[cat] = (S.player.led.exp[cat] || 0) + amt;
  if (hard) sink(S, cat, amt);
  paymentRecord(S, cat, amt);
  return amt;
}
function news(S, txt, kind) { S.news.unshift({ d: S.day, t: txt, k: kind || '' }); if (S.news.length > 60) S.news.pop(); }
const mid = g => (GD[g].pmin + GD[g].pmax) / 2;
const valueOf = stock => { let v = 0; for (const g in stock) v += (stock[g] || 0) * mid(g); return v; };

/* ---------- العالم ---------- */
const capOf = c => Math.round(1000 * (0.8 + 0.2 * c.size) * (1 + 0.25 * (c.tier - 1)));
const capG = (c, g) => c.cap * GD[g].depth;
const popTotal = c => c.pop[0] + c.pop[1] + c.pop[2] + c.pop[3];
function demandOf(c, g) {
  const d = GD[g].d, [b, p, r, e] = c.pop, pt = b + p + r + e;
  let x = (d.all || 0) * pt + (d.p || 0) * p + (d.r || 0) * r + (d.e || 0) * e;
  if (g === 'tools' && c.ev && c.ev.k === 'war') x += pt * 0.008;
  return x;
}
function makeCity(S, d) {
  const c = {
    id: d.id, name: d.name, country: d.country, x: d.x, y: d.y, size: d.size, tax: d.tax,
    prod: {}, extra: {}, tier: 1, owner: d.owner || null, sig: d.sig || null, makes: (d.makes || []).slice(),
    stock: {}, idx: {}, short: {}, glut: {}, dem: {}, ev: null, factJobs: 0, sat: { food: 1, lux: 1 },
    pop: [0.25, 0.50, 0.20, 0.05].map(f => Math.round(f * 1000 * d.size)),
  };
  c.cap = capOf(c);
  GIDS.forEach(g => { c.stock[g] = capG(c, g) * ((GD[g].tier === 'raw' || g === 'wheat' || c.makes.includes(g)) ? 0.35 + rndG(S, g) * 0.25 : 0.06 + rndG(S, g) * 0.1); c.idx[g] = 1; c.short[g] = 0; c.glut[g] = 0; c.dem[g] = 0; });
  // معايرة الإنتاج: المنتِج يستقر عند ~75٪ امتلاء (رخيص)، وكل مدينة تزرع جزءاً من قمحها
  GIDS.forEach(g => {
    const cons = demandOf(c, g), make = c.makes.includes(g);
    if (g === 'wheat') c.prod[g] = (make ? 1.35 : 0.65) * cons;
    else if (make) c.prod[g] = cons + 0.009 * capG(c, g) * (1 + 0.2 * rndG(S, g));
  });
  return c;
}

// حفظ قديم: سلع أُضيفت بعده تأخذ رفّاً وإنتاجاً وسعراً معروفاً في كل مدينة
function migrateGoods(S) {
  for (const id of S.order) {
    const c = S.cities[id], d = CITY_DEFS.find(x => x.id === id); if (!c || !d) continue;
    GIDS.forEach(g => {
      if (c.stock[g] !== undefined && c.prod[g] !== undefined || c.stock[g] !== undefined && !c.makes.includes(g)) { if (c.idx[g] === undefined) c.idx[g] = 1; if (c.short[g] === undefined) c.short[g] = 0; if (c.glut[g] === undefined) c.glut[g] = 0; if (c.dem[g] === undefined) c.dem[g] = 0; if (c.makes.includes(g) && c.prod[g] === undefined) c.prod[g] = demandOf(c, g) + 0.009 * capG(c, g); return; }
      const mk = isOwn(c, g);
      c.stock[g] = capG(c, g) * (mk ? 0.45 : 0.1); c.idx[g] = 1; c.short[g] = 0; c.glut[g] = 0; c.dem[g] = 0;
      if (c.makes.includes(g)) c.prod[g] = demandOf(c, g) + 0.009 * capG(c, g) * 1.1;
    });
    const k = S.player.known && S.player.known[id]; if (k) GIDS.forEach(g => { if (k.p[g] === undefined) { k.p[g] = Math.round(unitPrice(c, g) * 10) / 10; k.st[g] = Math.round(c.stock[g]); } });
  }
}
function riskKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
function ensureRisks(S) {
  const ids = S.order;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const k = riskKey(ids[i], ids[j]);
    if (S.risk[k] != null) continue;
    const dd = cdist(S.cities[ids[i]].country, S.cities[ids[j]].country);
    S.risk[k] = +([0.03, 0.06, 0.10][dd] + rnd(S) * 0.04).toFixed(3);
  }
}

function newGame(seed) {
  const S = { seed: (seed >>> 0) || 1, climateSeed: (seed >>> 0) || 1, day: 0, phase: 1, cities: {}, order: [], agents: [], risk: {}, news: [],
    orders: [], mkt2: 1, learn: learnNew(), zakat: zakatNew(), stats: { sink: {}, fauc: {} }, hist: { nw: [], px: {} }, nextId: 10, ver: VER, home: HOME, fx: { usd: FX0.usd, gold: FX0.gold, silver: +silverAt(FX0.gold, 0).toFixed(3), hu: [FX0.usd], hg: [FX0.gold], hs: [+silverAt(FX0.gold, 0).toFixed(3)] }, ctxCur: 'sar' };
  CITY_DEFS.forEach(d => { S.cities[d.id] = makeCity(S, d); S.order.push(d.id); });
  ensureRisks(S);
  S.player = {
    wallet: { sar: 800, usd: 0, au: 0, ag: 0 }, ships: [], led: { inc: {}, exp: {} }, props: {}, factories: [], known: {},
    bank: { dep: {}, loans: [], bonds: [] }, caravans: [], trips: 0, trades: [],
  };
  attachWallet(S); ensureBosses(S);
  S.player.caravans.push(makeCaravan(S, 1, 'القافلة الرئيسية', START_CITY, true));
  const names = ['أبو فهد', 'سالم الجمّال', 'ماجد', 'أبو ناصر', 'راشد', 'عبدالله القافلة', 'مبارك', 'أبو سعد', 'خالد التاجر', 'هزاع', 'يوسف', 'زيد', 'أحمد الحرّاني', 'منصور', 'سلطان', 'وليد', 'حمدان', 'جابر', 'نايف', 'علي البحّار'];
  for (let i = 0; i < 20; i++) S.agents.push({ id: i, name: names[i], gold: 600, city: S.order[i % S.order.length], dest: null, left: 0, cargo: {}, cap: 90 });
  // تسخين العالم: تستقر الأسواق قبل أن يرى اللاعب أسعارها، فلا تتحرك فجأة في أول رحلة
  for (let i = 0; i < 60; i++) { for (const id of S.order) cityDay(S, S.cities[id]); agentsDay(S); }
  S.agents.forEach(a => { a.gold = 600; a.cargo = {}; a.dest = null; a.left = 0; a.from = null; });
  S.stats = { sink: {}, fauc: {} }; S.news = [];
  snapshotKnown(S, S.order);
  news(S, 'ورثتَ قافلة جدّك في الرياض بـ 800 ذهب. اشترِ رخيصاً وبِع غالياً، ودروب التجارة تمتد إلى مصر وفارس والهند والصين.', 'good');
  climateInit(S); return S;
}

function makeCaravan(S, id, name, city, main) {
  return { id, name, main: !!main, city, dest: null, from: null, left: 0, total: 0, cargo: {}, carts: 1, crew: 4, guards: 0,
    morale: 90, insured: false, captain: null, route: null, supplies: 0, trips: 0, basis: {}, herd: {}, herders: 0 };
}
/* المركب المملوك: جمل أصيل يزيد الحمولة 20٪، أو فرس سابق يقصّر الرحلة 12٪. واحد لكل قافلة وله علف يومي */
const MOUNT = { camel: { name: 'جمل أصيل', cost: 1400, load: 0.35, speed: 0, up: 5, desc: 'يحمل عنك 35٪ زيادة في الحمولة' }, horse: { name: 'فرس سابق', cost: 2200, load: 0, speed: 0.12, up: 8, desc: 'يقصّر رحلاتك نحو 12٪' } };
const mountOf = car => (car.mount && MOUNT[car.mount.kind]) || null;
const capOfCar = car => Math.round(car.carts * 100 * (1 + (mountOf(car) ? mountOf(car).load : 0)));
function loadOf(car) { let s = 0; for (const g in car.cargo) s += (car.cargo[g] || 0) * GD[g].w; return s; }

