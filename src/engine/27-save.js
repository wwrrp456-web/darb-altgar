/* ---------- حفظ ---------- */
const save = S => JSON.stringify(S);
/* أسماء الكتاب الأصلية التي لا تظهر للاعب: تُستبدل في النصوص المحفوظة (الأخبار وسجل عمّ سالم) بأسماء اللعبة المعتمدة (docs/NAMES.md) */
const OLD_NAMES = [['الحاج ماثون', 'الحاج صالح'], ['ماثون', 'صالح'], ['داباسير', 'ظافر'], ['أركاد', 'سعيد'], ['نوماسير', 'سعيد'], ['ألغاميش', 'عمران'], ['أغار', 'حمدان']];
function nameFix(S) {
  const city = (BAB.cityOf ? BAB.cityOf(S.home) : 'تيماء'), fix = t => { if (typeof t !== 'string') return t; let r = t; for (const [a, b] of OLD_NAMES) if (r.includes(a)) r = r.split(a).join(b); return r.includes('بابل') ? r.split('بابل').join(city) : r; };
  (S.news || []).forEach(n => { if (n && n.t) n.t = fix(n.t); });
  if (S.learn && S.learn.hist) S.learn.hist.forEach(h => { if (h && h.t) h.t = fix(h.t); });
}
/* سجل الترحيلات مرتّب: كل خطوة تنقل الحفظ من إصدار إلى الذي يليه، ويُكمَل التسلسل حتى VER. إصدار بلا خطوة = غير معروف فيعيد load قيمة null */
const MIGRATIONS = [
  { from: 2, to: 3, fn: S => { // ترحيل v2 ← v3: الرصيد القديم صار ريالاً
    S.fx = { usd: FX0.usd, gold: FX0.gold, hu: [FX0.usd], hg: [FX0.gold] }; S.ctxCur = 'sar';
    S.player.wallet = { sar: S.player.gold || 0, usd: 0, au: 0 }; delete S.player.gold; S.player.trades = [];
    S.player.caravans.forEach(cr => { cr.basis = {}; for (const g in cr.cargo) if (cr.cargo[g] >= 1) cr.basis[g] = { q: cr.cargo[g], c: cr.cargo[g] * mid(g) }; });
    for (const k in S.player.props) { const pr = S.player.props[k]; pr.basis = {}; for (const g in pr.store) if (pr.store[g] >= 1) pr.basis[g] = { q: pr.store[g], c: pr.store[g] * mid(g) }; }
  } }
];
function migrate(S) {
  for (let m; S.ver !== VER && (m = MIGRATIONS.find(x => x.from === S.ver)); ) { m.fn(S); S.ver = m.to; }
}
function load(str) {
  const S = JSON.parse(str); if (!S || !S.player) return null;
  migrate(S);
  if (S.ver !== VER) return null;
  paymentMigrate(S);
  if (S.story) S.story.cur = null; // لا يُعاد فتح حوار عند بدء التشغيل
  S.orders = S.orders || []; S.defects = S.defects || []; if (!S.zakat) S.zakat = zakatNew();
  if (!S.mkt2) { S.mkt2 = 1; if (S.learn && S.learn.char) { S.news = S.news || []; news(S, 'تغيّرت الأسواق: لكل مدينة منتج خاص يرخص عندها ويغلو بقدر البُعد عنها، وزعيم السوق يحدّد حصتك منه. دكاكينك ومخازنك كما هي.', 'good'); } }
  if (!S.learn) learnMigrate(S); else { if (!S.learn.rq) { S.learn.rq = []; S.learn.rseen = {}; } loreFix(S.learn); }
  (S.player.caravans || []).forEach(c => { c.herd = c.herd || {}; c.herders = c.herders || 0; });
  CITY_DEFS.forEach(d => { const c = S.cities && S.cities[d.id]; if (c) { c.x = d.x; c.y = d.y; c.makes = d.makes.slice(); } });
  // مدن أُضيفت بعد حفظ اللعبة (مكة والمدينة): تُنشأ وتُسخَّن أسواقها وتُضاف إلى الخريطة والمخاطر ومعارف اللاعب
  { const add = CITY_DEFS.filter(d => S.cities && !S.cities[d.id]); if (add.length) { add.forEach(d => { S.cities[d.id] = makeCity(S, d); S.order.push(d.id); for (let i = 0; i < 40; i++) cityDay(S, S.cities[d.id]); }); ensureRisks(S); snapshotKnown(S, add.map(d => d.id)); if (S.learn && S.learn.char) { S.news = S.news || []; news(S, 'انضمت إلى خريطة التجارة ' + add.map(d => d.name).join(' و') + '.', 'good'); } } }
  migrateGoods(S);
  { const seen = new Set(); let mx = S.nextId || 10; for (const k in S.player.props) for (const w of (S.player.props[k].staff || [])) if (typeof w.id === 'number' && w.id >= mx) mx = w.id + 1; S.nextId = mx; for (const k in S.player.props) for (const w of (S.player.props[k].staff || [])) { if (typeof w.id !== 'number' || seen.has(w.id)) w.id = S.nextId++; seen.add(w.id); } } // معرّفات العمّال فريدة (حفظ قديم قد يكرر معرّفاً فيُسرَّح الكل بضغطة)
  for (const k in S.player.props) { const pr = S.player.props[k]; if (!pr.staff) { pr.staff = []; welcomeCrew(S, pr, pr.shops.length * SELLER_PTS, pr.whs); if (pr.shops.length) news(S, 'صار لدكاكينك عمّال بالأجر: لكل دكان بائعان، ولكل مخزن أمين. أعطيناك الطاقم مجاناً ' + WK_FREE + ' يوماً.', 'good'); } }
  if (S.player && !S.player.ships) S.player.ships = []; if (S.player && !S.player.sea) S.player.sea = { storm: 0, pirates: 0, repelled: 0, ports: {} };
  teamMigrate(S);
  nameFix(S);
  attachWallet(S); vaultMigrate(S); ensureBosses(S); lifeMigrate(S); climateInit(S); return S;
}

/* فتح الحفظ عند بدء اللعبة: يُرجع {ok, S, migrated} أو {ok:false, why}. شروط أخفّ من backupValidate عمداً (تلك للاستعادة من نسخة) كي لا يُرفض حفظ سليم كلاعب متقاعد */
function loadChecked(str) {
  let S, ver;
  try { const raw = JSON.parse(str); ver = raw && raw.ver; S = load(str); } catch (e) { return { ok: false, why: 'parse' }; }
  if (!S) return { ok: false, why: 'version' };
  if (!S.player || !S.cities || typeof S.day !== 'number' || !isFinite(S.day)) return { ok: false, why: 'fields' };
  try { if (typeof netWorth(S) !== 'number' || !isFinite(netWorth(S))) return { ok: false, why: 'networth' }; } catch (e) { return { ok: false, why: 'networth' }; }
  return { ok: true, S, migrated: ver !== VER };
}
['zakatPay', 'zakatDefer', 'buy', 'sell', 'travel', 'exchange', 'signPact', 'agentBuy', 'murabaha', 'qard', 'settle', 'invest', 'buySukuk', 'buildShop', 'buildWarehouse', 'toStore', 'shopSetItem', 'rentShop', 'buyShop', 'hireStaff', 'buildFarm', 'slaughter', 'buyStud', 'pairSet', 'buildButcher', 'cutMeat', 'haggleStart', 'haggleChoose'].forEach(k => {
  const f = A[k]; A[k] = function (S, ...a) { const pre = S.learn && S.learn.char ? learnPre(S, k, a) : null; const r = f.call(A, S, ...a); if (S.learn && S.learn.char && r && r.ok !== false) { learnEvent(S, k, a, r, pre); learnCheck(S); cardDay(S); if (SCHED.on) schedObserve(S, 'action'); } if (S.ach && r && r.ok !== false) achEvent(S, k, a, r); return r; };
});
A.debtPay = function (S, amt) {
  const fd = S.player.famDebt; if (!fd || fd.left <= 0) return NO('لا دَين عليك');
  amt = Math.min(Math.floor(amt || 0), Math.ceil(fd.left), Math.floor(S.player.gold)); if (amt <= 0) return NO('لا رصيد كافٍ للدفع');
  debtSpend(S, amt); debtApply(S, amt); return OK('سدّدتَ ' + amt + ' ريالاً من دَين جدّك، وبقي ' + Math.round(fd.left));
};
A.debtPlan = function (S, on) {
  const fd = S.player.famDebt; if (!fd) return NO('لا دَين عليك'); if (on && !S.player.save) S.player.save = Object.assign(vaultState(S), { on: true }); fd.plan = !!on; if (on && fd.due == null) { fd.due = S.day + 30; fd.mPaid = 0; }
  return OK(on ? BAB.DEBT.planOn : 'أوقفتَ خطة ظافر');
};
A.setWish = A_setWish; A.eventChoice = eventChoice;
A.vaultDraw = vaultDraw; A.vaultOpportunityBuy = vaultOpportunityBuy;
A.savingsPlan = savingsPlan;
A.vaultBreak = function (S) {
  const v = S.player.vault || 0; if (v <= 0) return NO('الحصّالة فارغة');
  const result = A.vaultDraw(S, v, 'all'); if (!result.ok) return result;
  learnReact(S, 'vaultBreak', 3); return Object.assign(result, OK('كسرتَ الحصّالة: ' + Math.round(v) + ' ريالاً عادت إلى محفظتك'));
};
A.setName = (S, raw) => {
  const L = S.learn; if (!L || L.char) return NO('الاسم يُسجَّل قبل اختيار الشخصية');
  const n = String(raw == null ? '' : raw).replace(/<[^>]*>/g, '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (n.length < 2) return NO('اكتب اسمك (حرفان على الأقل)');
  S.player.name = n; return OK('أهلاً بك يا ' + n);
};
A.learnSetChar = learnSetChar; A.chooseStart = chooseStart;
/* SHA-256 بلا اعتماد على crypto.subtle (يعمل على file:// وفي المتصفحات القديمة): لوضع المطوّر */
function sha256hex(str) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes = []; for (const ch of unescape(encodeURIComponent(str))) bytes.push(ch.charCodeAt(0));
  const bl = bytes.length * 8; bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bl >>> (i * 8)) & 255);
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < bytes.length; o += 64) {
    const w = new Array(64); for (let i = 0; i < 16; i++) w[i] = (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) { const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) { const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[i] + w[i]) | 0, S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0; }
    h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x | 0);
  }
  return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
const BABV = {}; const babFor = S => BABV[S.home] || (BABV[S.home] = BAB.localize(S.home));
