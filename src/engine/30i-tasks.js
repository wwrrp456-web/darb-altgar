/* ---------- 038أ المهام والمكافآت: المحرك ----------
   خانتان فعّالتان في هذه الحزمة (قصيرة 3 أيام، أسبوعية 7)؛ تظهر ثلاث مهام بأنواع مختلفة ويختار اللاعب واحدة. لا آلية جديدة: كل قالب بدالتين على حالة موجودة (gen للتوليد، done للإنجاز).
   الإنجاز بالفرق: عند القبول تُحفظ لقطة عدّادات (base) وتُقارَن لاحقاً، فيصح بعد إعادة التحميل. العدّادات المفقودة من سجل الصفقات (آخر 50) تُحفظ في tk2.seen.
   المكافآت: نفوذ وخبرة عبر bonusAward بمفتاح فريد، سقف أسبوعي؛ والثقة والميزة المؤقتة L.tb (≤10٪ و≤7 أيام، الأكبر يغلب) واللقب مدعومة للقوالب اللاحقة. لا ذهب أبداً.
   لا عقوبة: المهلة للمقبولة ضعف المدة وانتهاؤها بلا خسارة. التوليد حتمي (roll من اليوم والمفتاح) ولا يستهلك rnd.
   الحالة كسولة: لا يُنشأ tk2 حتى يفتح اللاعب المهام (tasksView) أو يقبل مهمة، فلا يتغير شيء في اللعبة قبل ذلك (بصمات الحفظ القديمة تبقى). TASKS.on=false: لا يُقرأ ولا يُكتب شيء والسلوك القديم حرفياً. كل حقل محفوظ اختياري. النصوص حرفاً من specs/038-tasks/texts.md. */
const TASKS = {
  on: true,
  dur: { short: 3, week: 7 }, gap: { short: 1, week: 2 }, graceMul: 2, // مدة الخانة، الفاصل بعد الإنجاز، مهلة المقبولة = ضعف المدة
  cap: { infl: 25, xp: 30 }, // سقف المكافآت الأسبوعي (مبدئي، يُضبط بالقياس في 038د)
  keep: 40, mixMax: 0.30, offerN: 3, boostMaxDays: 7, boostMaxMul: 0.1,
  names: { short: 'مهمة قصيرة', week: 'مهمة الأسبوع' },
  KIND: { tr: 'تجارة', ex: 'استكشاف', rl: 'علاقات', lr: 'تعلّم', mg: 'إدارة', bd: 'بناء' },
  TXT: {
    top: 'اختر ما يناسبك يا ولدي، ولا عجلة.', accept: 'اتفقنا، هيّا إلى العمل.', drop: 'لا بأس، اختر غيرها.', done: 'أحسنت يا ولدي!',
    lapse: 'لم يحن وقتها، سنجد لك غيرها.', none: 'لا مهام الآن، تجارتك تسير.',
    week: (s, c) => 'مكافآت هذا الأسبوع: ' + s + ' من ' + c + ' نفوذ.', capped: 'بلغتَ حدّ هذا الأسبوع، والمهام تبقى لك بلقبها.', next: n => 'المهمة القادمة بعد ' + n + ' أيام.',
  },
};
const tkFill = (s, p) => s.replace(/\{([^}]+)\}/g, (m, k) => (p && p[k] != null ? p[k] : m));
const tkL = S => S.learn && S.learn.char ? S.learn : null;
const tkOn = S => TASKS.on && !!tkL(S) && !S.shadowClone;
function tkState(S) { // الحالة الاختيارية: تُنشأ عند أول حاجة فقط
  const P = S.player, T = P.tk2 || (P.tk2 = {}); T.slots = T.slots || {}; T.done = T.done || []; T.cap = T.cap || { wk: -1, infl: 0, xp: 0 }; T.recent = T.recent || [];
  const s = T.seen = T.seen || {}; s.sell = s.sell || {}; s.buy = s.buy || {}; s.hw = s.hw || {}; if (s.scan == null) s.scan = -1;
  if (!s.vis) { s.vis = {}; for (const id in (P.known || {})) if (P.known[id].day > 0) s.vis[id] = 1; for (const c of P.caravans || []) s.vis[c.city] = 1; if (S.startCity) s.vis[S.startCity] = 1; } return T;
}
/* مشاهدات تراكمية من سجل الصفقات (يحفظ آخر 50 فقط) فلا يضيع «أول بيع/شراء»؛ التكرار آمن لأنها مجموعات */
function tkScan(S, T) {
  const tr = S.player.trades || [], sn = T.seen; for (let i = tr.length - 1; i >= 0; i--) { const t = tr[i]; if (t.day < sn.scan || t.sector === 'asset') continue; if (t.side === 'sell' && t.sector !== 'shops') sn.sell[t.city] = 1; else if (t.side === 'buy') sn.buy[t.g] = 1; }
  sn.scan = S.day;
}
/* خطّاف صغير من المساومة: فوز واحد على الأقل في المدينة */
function tkNote(S, what, city) { if (!tkOn(S) || !S.player.tk2) return; if (what === 'visit') { tkState(S).seen.vis[city] = 1; return; } if (what !== 'haggle') return; const h = tkState(S).seen.hw, x = h[city] || (h[city] = { n: 0, d: -99 }); x.n++; x.d = S.day; }
const tkKnown = S => Object.keys(S.player.known || {}); // مدن لها أسعار معروفة (كلها منذ البداية)
const tkVisited = S => Object.keys(tkState(S).seen.vis); // مدن وصلتها قوافلك فعلاً
const tkCountries = S => { const o = {}; for (const id of tkVisited(S)) if (S.cities[id]) o[S.cities[id].country] = 1; return Object.keys(o); };
const tkSells = (S, since) => (S.player.trades || []).filter(t => t.side === 'sell' && t.sector !== 'shops' && t.sector !== 'asset' && t.day >= since);
const tkDeficient = S => { let n = 0, bad = 0; for (const city in S.player.props) { const pr = S.player.props[city]; for (const sh of pr.shops) { if (!sh.items.length) continue; n++; if (sh.items.some(it => (pr.store[it.g] || 0) < (it.target || 0))) bad++; } } return { n, bad }; };

/* ---------- القوالب الاثنا عشر (038أ) ---------- */
const TK_T = {
  tr1: { kind: 'tr', tier: 'short', weight: 3, reward: { xp: 4 },
    t: { offer: 'احمل {ن} وحدة {سلعة} من {مدينة أ} إلى {مدينة ب}', why: 'لأن قافلتك فارغة و{سلعة} غالية في {مدينة ب}', prog: '{ك} من {ن} وصلت', done: 'وصلت {سلعة} إلى {مدينة ب}' },
    gen(S) {
      const car = S.player.caravans.find(c => c.main) || S.player.caravans[0]; if (!car || car.left > 0 || !S.cities[car.city]) return null;
      const room = capOfCar(car) - loadOf(car); if (room < capOfCar(car) * 0.65) return null; const A = S.cities[car.city]; let best = null;
      for (const id of tkKnown(S)) { if (id === car.city || !S.cities[id]) continue; const B = S.cities[id], k = S.player.known[id];
        for (const g of GIDS) { if (GD[g].live || !sells(A, g) || !(A.stock[g] >= 6)) continue; const pa = unitPrice(A, g), pb = k.p[g], ref = refPrice(B, g); if (!(pb > ref * 1.05) || !(pb > pa * 1.15)) continue;
          const n = Math.min(30, Math.floor(room / GD[g].w * 0.6), Math.floor(A.stock[g] * 0.5)); if (n < 5) continue; const sc = pb / pa - dist(S, A.id, id) / 4000; if (!best || sc > best.sc) best = { sc, g, id, n }; } }
      return best ? { g: best.g, a: A.id, b: best.id, 'ن': best.n, 'سلعة': GD[best.g].name, 'مدينة أ': A.name, 'مدينة ب': S.cities[best.id].name } : null;
    },
    base: () => ({}), done: (S, st, p) => { const n = tkSells(S, st.since).filter(t => t.city === p.b && t.g === p.g).reduce((a, t) => a + t.q, 0); return { n: Math.floor(n), need: p['ن'], ok: n >= p['ن'] }; } },
  tr2: { kind: 'tr', tier: 'short', weight: 3, reward: { infl: 3, xp: 4 },
    t: { offer: 'اربح {ن} ريالاً صافية في صفقة واحدة', why: 'آخر صفقاتك ربحها قليل', prog: 'أفضل صفقة لك الآن {ك} ريالاً', done: 'ربحتَ {ك} ريالاً في صفقة واحدة' },
    gen(S) { const s = tkSells(S, -1).slice(0, 5); if (s.length < 3) return null; const avg = s.reduce((a, t) => a + Math.max(0, t.pl), 0) / s.length; if (avg >= 400) return null; return { 'ن': Math.min(600, Math.max(60, Math.ceil(avg * 1.5 / 10) * 10)) }; },
    base: () => ({}), done: (S, st, p) => { const b = Math.max(0, ...tkSells(S, st.since).map(t => t.pl)); return { n: Math.floor(b), need: p['ن'], ok: b >= p['ن'] }; } },
  tr3: { kind: 'tr', tier: 'short', weight: 2, reward: { xp: 5 },
    t: { offer: 'بِع شيئاً في سوق لم تبع فيه من قبل', why: 'ما بعتَ إلا في {عدد} أسواق', prog: '{ك} من 1', done: 'بعتَ في سوق جديد: {مدينة}' },
    gen(S, T) { const sold = Object.keys(T.seen.sell); if (!sold.length || !tkVisited(S).some(id => S.cities[id] && !T.seen.sell[id])) return null; return { 'عدد': sold.length }; },
    base: (S, T) => ({ list: Object.keys(T.seen.sell) }), done: (S, st, p, T) => { const nw = Object.keys(T.seen.sell).filter(id => !st.base.list.includes(id)); return { n: nw.length ? 1 : 0, need: 1, ok: nw.length > 0, last: nw[0] && { 'مدينة': S.cities[nw[0]].name } }; } },
  ex1: { kind: 'ex', tier: 'short', weight: 3, reward: { xp: 6 },
    t: { offer: 'زر مدينة لم تزرها', why: 'ما زرتَ إلا {عدد} مدن', prog: '{ك} من 1', done: 'وصلتَ إلى {مدينة} لأول مرة' },
    gen(S) { const k = tkVisited(S); return Object.keys(S.cities).some(id => !k.includes(id)) ? { 'عدد': k.length } : null; },
    base: S => ({ list: tkVisited(S) }), done: (S, st) => { const nw = tkVisited(S).filter(id => !st.base.list.includes(id)); return { n: nw.length ? 1 : 0, need: 1, ok: nw.length > 0, last: nw[0] && S.cities[nw[0]] && { 'مدينة': S.cities[nw[0]].name } }; } },
  ex3: { kind: 'ex', tier: 'short', weight: 2, reward: { xp: 4 },
    t: { offer: 'اشترِ سلعة لم تشترِها من قبل', why: 'لم تجرّب إلا {عدد} سلعة', prog: '{ك} من 1', done: 'اشتريتَ {سلعة} لأول مرة' },
    gen(S, T) { const bought = Object.keys(T.seen.buy); if (!bought.length) return null; const car = S.player.caravans.find(c => c.main) || S.player.caravans[0], c = car && S.cities[car.city]; if (!c || !GIDS.some(g => !GD[g].live && !T.seen.buy[g] && sells(c, g) && c.stock[g] >= 1)) return null; return { 'عدد': bought.length }; },
    base: (S, T) => ({ list: Object.keys(T.seen.buy) }), done: (S, st, p, T) => { const nw = Object.keys(T.seen.buy).filter(g => !st.base.list.includes(g)); return { n: nw.length ? 1 : 0, need: 1, ok: nw.length > 0, last: nw[0] && { 'سلعة': GD[nw[0]].name } }; } },
  lr1: { kind: 'lr', tier: 'short', weight: 2, reward: { xp: 4 },
    t: { offer: 'أجب عن مسألة في مجلس السوق', why: 'لم تفتح المجلس منذ أسبوع', prog: '{ك} من 1', done: 'أجبتَ عن مسألة في المجلس' },
    gen(S) { const L = tkL(S); return L && L.mj && L.mj.ready && S.day >= L.mj.ready && (L.ex == null || L.ex.mj == null || S.day - L.ex.mj >= 7) ? {} : null; },
    base: S => ({ n: Object.keys((tkL(S).mj || {}).seen || {}).length }), done: (S, st) => { const n = Object.keys((tkL(S).mj || {}).seen || {}).length; return { n: n > st.base.n ? 1 : 0, need: 1, ok: n > st.base.n }; } },
  lr2: { kind: 'lr', tier: 'short', weight: 2, reward: { xp: 6 },
    t: { offer: 'أتمّ درساً جديداً في الأكاديمية', why: 'بقي لك {عدد} دروس', prog: '{ك} من 1', done: 'أتممتَ درس «{اسم الدرس}»' },
    gen(S) { const L = tkL(S), st = L && stageOf(S), ss = st && stageStatus(S); return st && ss && !ss.waiting ? { 'عدد': Math.max(1, STAGES.length - ((L.stage || 1) - 1)) } : null; },
    base: S => { const L = tkL(S), st = stageOf(S); return { stage: L.stage || 1, name: st ? st.title : '' }; }, done: (S, st) => { const ok = (tkL(S).stage || 1) > st.base.stage; return { n: ok ? 1 : 0, need: 1, ok, last: { 'اسم الدرس': st.base.name } }; } },
  mg1: { kind: 'mg', tier: 'short', weight: 2, reward: { xp: 3 },
    t: { offer: 'سدّد ما تأخّر من أجور عمّالك', why: 'تأخّر أجر {ن} من عمّالك', prog: 'تبقّى {ك}', done: 'سدّدتَ كل الأجور' },
    gen(S) { const n = (S.paymentDues || []).filter(d => (d.deferredWages || 0) > 0).length; return n ? { 'ن': n } : null; },
    base: () => ({}), done: S => { const n = (S.paymentDues || []).filter(d => (d.deferredWages || 0) > 0).length; return { n, need: 0, ok: n === 0 }; } },
  rl1: { kind: 'rl', tier: 'week', weight: 3, reward: { infl: 8 },
    t: { offer: 'ارفع ثقة {الزعيم} إلى {ن}', why: 'ثقته {ك} الآن', prog: '{ك} من {ن}', done: 'صارت ثقة {الزعيم} {ن}' },
    gen(S) {
      if (!bossActive(S)) return null; let best = null; for (const id of tkVisited(S)) { const bs = S.bosses[id]; if (!bs || !(bs.trust < 30) || bs.trust < -20) continue; if (!best || bs.trust > best.t) best = { id, t: bs.trust }; }
      if (!best) return null; const bs = S.bosses[best.id], n = Math.min(40, Math.ceil((bs.trust + 8) / 5) * 5); return { b: best.id, 'ن': n, 'الزعيم': bs.name, 'ك': Math.round(bs.trust) };
    },
    base: () => ({}), done: (S, st, p) => { const bs = S.bosses[p.b], t = bs ? Math.round(bs.trust) : 0; return { n: t, need: p['ن'], ok: !!bs && bs.trust >= p['ن'] }; } },
  rl2: { kind: 'rl', tier: 'week', weight: 2, reward: { infl: 5 },
    t: { offer: 'انتزع خصماً في مساومة مع {الزعيم}', why: 'لم تفاوضه منذ مدة', prog: '{ك} من 1', done: 'نجحت مساومتك مع {الزعيم}' },
    gen(S, T) {
      if (!bossActive(S) || !haggleOpen(S)) return null; for (const id of tkVisited(S)) { const bs = S.bosses[id], h = T.seen.hw[id]; if (bs && haggleLeft(S, id) > 0 && (!h || S.day - h.d >= 14)) return { c: id, 'الزعيم': bs.name }; } return null;
    },
    base: (S, T, p) => ({ n: (T.seen.hw[p.c] || { n: 0 }).n }), done: (S, st, p, T) => { const n = (T.seen.hw[p.c] || { n: 0 }).n; return { n: n > st.base.n ? 1 : 0, need: 1, ok: n > st.base.n }; } },
  ex2: { kind: 'ex', tier: 'week', weight: 3, reward: { infl: 8 },
    t: { offer: 'ادخل بقافلتك دولة لم تدخلها', why: 'ما دخلتَ إلا {عدد} دول', prog: '{ك} من 1', done: 'دخلتَ {دولة} لأول مرة' },
    gen(S) { const k = tkCountries(S); return Object.keys(S.cities).some(id => !k.includes(S.cities[id].country)) ? { 'عدد': k.length } : null; },
    base: S => ({ list: tkCountries(S) }), done: (S, st) => { const nw = tkCountries(S).filter(c => !st.base.list.includes(c)); return { n: nw.length ? 1 : 0, need: 1, ok: nw.length > 0, last: nw[0] && { 'دولة': CD[nw[0]].name } }; } },
  bd2: { kind: 'bd', tier: 'week', weight: 2, reward: { xp: 8 },
    t: { offer: 'عبّئ كل دكاكينك بالبضاعة', why: 'بعض رفوفك فارغة', prog: '{ك} من {ن} دكاناً معبّأ', done: 'دكاكينك كلها معبّأة' },
    gen(S) { const d = tkDeficient(S); return d.n && d.bad ? { 'ن': d.n } : null; },
    base: () => ({}), done: S => { const d = tkDeficient(S); return { n: d.n - d.bad, need: d.n, ok: d.n > 0 && d.bad === 0 }; } },
};
const TK_IDS = Object.keys(TK_T);
const tkP = (def, id, p, st) => { const q = Object.assign({}, p, st && st.n != null ? { 'ك': st.n } : {}, st && st.need != null ? { 'ن': st.need } : {}, st && st.last); return q; };
const tkText = (id, f, p, st) => tkFill(TK_T[id].t[f], Object.assign({}, p, st ? Object.assign({ 'ك': st.n }, st.need ? { 'ن': st.need } : {}, st.last) : {}));
const tkRewardLine = r => [r.infl ? '+' + r.infl + ' نفوذ' : '', r.xp ? '+' + r.xp + ' خبرة' : '', r.trust ? '+' + r.trust.n + ' ثقة' : '', r.boost ? 'جمارك أقل ' + Math.round((1 - r.boost.mul) * 100) + '٪ لمدة ' + r.boost.days + ' أيام' : ''].filter(Boolean).join(' و');

/* ---------- الميزة المؤقتة L.tb = { kind, until, mul }: لا تتراكم والأكبر يغلب؛ المفتاح المطفأ أو انتهاؤها = 1 ---------- */
function tbMul(S, kind) { const L = S.learn, b = TASKS.on && L && L.tb; return b && b.kind === kind && b.until > S.day ? b.mul : 1; }
function tbGive(S, kind, days, mul) {
  const L = tkL(S); if (!L) return false; mul = Math.max(1 - TASKS.boostMaxMul, Math.min(1 + TASKS.boostMaxMul, mul)); days = Math.min(TASKS.boostMaxDays, days); const b = L.tb;
  if (b && b.until > S.day && Math.abs(1 - b.mul) >= Math.abs(1 - mul)) return false; L.tb = { kind, until: S.day + days, mul }; return true;
}
/* ---------- المكافأة: نفوذ وخبرة بسقف أسبوعي (مفتاح فريد فلا منح مزدوج)، ثقة بحدود مرة واحدة، ميزة، لقب ---------- */
function tkReward(S, T, id, since, p) {
  const r = TK_T[id].reward, c = T.cap, wk = Math.floor(S.day / 7); if (c.wk !== wk) { c.wk = wk; c.infl = 0; c.xp = 0; }
  const infl = Math.max(0, Math.min(r.infl || 0, TASKS.cap.infl - c.infl)), xp = Math.max(0, Math.min(r.xp || 0, TASKS.cap.xp - c.xp)), msg = TASKS.TXT.done + ' ' + tkText(id, 'done', p, null);
  if (infl || xp) { if (bonusAward(S, 'tk2:' + id + ':' + since, infl, xp, msg)) { c.infl += infl; c.xp += xp; } } else { news(S, msg, 'good'); if (r.infl || r.xp) news(S, TASKS.TXT.capped, ''); }
  if (r.trust) { const bs = S.bosses[r.trust.boss]; if (bs) bs.trust = clamp(bs.trust + r.trust.n, -100, 100); }
  if (r.boost) tbGive(S, r.boost.kind, r.boost.days, r.boost.mul);
  if (r.title && ACHD.LIST.some(a => a.id === r.title)) achGrant(S, r.title);
}
/* ---------- العرض: تصفية بـgen، ثلاث بأنواع مختلفة بالأوزان، لا تكرار متتالٍ، حتمي (roll) ---------- */
function tkOffer(S, T, tier) {
  const last = T.recent.filter(r => r.t === tier).slice(-1)[0], cands = [];
  for (const id of TK_IDS) { const d = TK_T[id]; if (d.tier !== tier || (last && last.id === id)) continue; const p = d.gen(S, T); if (p) { const rc = T.recent.filter(r => r.id === id).length, kc = T.recent.filter(r => TK_T[r.id] && TK_T[r.id].kind === d.kind).length;
    cands.push({ id, p, w: d.weight * (rc ? 0.3 : 1) * (kc ? 1 : 1.5) }); } }
  /* حاكم التنوع (FR-006): نوع تجاوزت حصته من آخر 12 مهمة مقبولة TASKS.mixMax (الأكثر تمثيلاً فقط) يُستبعد من العرض ما دام يبقى نوعان آخران على الأقل */
  const hist = T.recent.slice(-12), share = {}; for (const r of hist) if (TK_T[r.id]) share[TK_T[r.id].kind] = (share[TK_T[r.id].kind] || 0) + 1;
  const top = Object.keys(share).filter(x => hist.length >= 6 && share[x] / hist.length > TASKS.mixMax).sort((a, b) => share[b] - share[a] || (a < b ? -1 : 1))[0], kindsAll = new Set(cands.map(c => TK_T[c.id].kind));
  if (top && kindsAll.has(top) && kindsAll.size >= 3) for (let i = cands.length - 1; i >= 0; i--) if (TK_T[cands[i].id].kind === top) cands.splice(i, 1);
  const out = [], used = {}; let k = 0;
  while (out.length < TASKS.offerN) { const pool = cands.filter(c => !used[TK_T[c.id].kind]); if (!pool.length) break; const tot = pool.reduce((a, c) => a + c.w, 0); let x = roll(S, 9000 + (tier === 'week' ? 500 : 0) + k++) * tot, pick = pool[pool.length - 1];
    for (const c of pool) { x -= c.w; if (x < 0) { pick = c; break; } } used[TK_T[pick.id].kind] = 1; out.push({ id: pick.id, p: pick.p }); }
  return out;
}
const tkSlot = (T, tier) => T.slots[tier] || (T.slots[tier] = { offer: [], pick: null, st: null, until: -1, next: 0 });
function tkRefresh(S, T, tier) { const sl = tkSlot(T, tier); sl.offer = tkOffer(S, T, tier); delete sl.fin; sl.until = S.day + TASKS.dur[tier]; sl.next = 0; }
function tkFinish(sl, S, T, tier, why, doneTxt) { // يفرغ الخانة (إنجاز أو انقضاء مهلة) ويتجدد العرض بعد الفاصل
  const rc = T.recent.slice().reverse().find(r => r.id === sl.pick.id && r.t === tier && r.ok == null); if (rc) rc.ok = why === 'ok'; if (why === 'ok') { T.done.push({ id: sl.pick.id, d: S.day }); if (T.done.length > TASKS.keep) T.done.shift(); }
  if (why === 'ok') sl.fin = { id: sl.pick.id, d: S.day, txt: doneTxt || '' }; sl.pick = null; sl.st = null; sl.offer = []; sl.next = S.day + (why === 'ok' ? TASKS.gap[tier] : 0);
}
function tasksDay(S) {
  if (!tkOn(S) || !S.player.tk2) return; const T = tkState(S); tkScan(S, T);
  for (const tier of ['short', 'week']) {
    const sl = tkSlot(T, tier);
    if (sl.pick) {
      const d = TK_T[sl.pick.id].done(S, sl.st, sl.pick.p, T); sl.st.n = d.n; sl.st.need = d.need; if (d.last) sl.st.last = d.last;
      if (d.ok) { const pp = tkP(null, sl.pick.id, sl.pick.p, sl.st); tkReward(S, T, sl.pick.id, sl.st.since, pp); tkFinish(sl, S, T, tier, 'ok', tkText(sl.pick.id, 'done', pp, null)); }
      else if (S.day > sl.st.due) { news(S, TASKS.TXT.lapse, ''); tkFinish(sl, S, T, tier, 'lapse'); }
      continue;
    }
    if (S.day < sl.next) continue; if (!sl.offer.length || S.day >= sl.until) tkRefresh(S, T, tier);
  }
}
/* ---------- الأفعال: اختيار واحدة من المعروضات، والتراجع بلا عقوبة ---------- */
function tasksPick(S, tier, i) {
  if (!tkOn(S)) return NO('المهام غير متاحة'); const T = tkState(S), sl = tkSlot(T, tier); if (sl.pick) return NO('عندك مهمة قائمة في هذه الخانة'); const o = sl.offer[i]; if (!o) return NO('اختر من المعروض');
  tkScan(S, T); const d = TK_T[o.id], p = d.gen(S, T); if (!p) { sl.offer.splice(i, 1); return NO('لم تعد هذه المهمة مناسبة لحالتك'); }
  const dur = TASKS.dur[tier]; T.recent.push({ id: o.id, t: tier, d: S.day, ok: null }); if (T.recent.length > TASKS.keep) T.recent.shift(); sl.pick = { id: o.id, p }; sl.st = { since: S.day, due: S.day + dur * TASKS.graceMul, base: d.base(S, T, p), n: 0, need: p['ن'] || 1 }; sl.offer = [];
  news(S, TASKS.TXT.accept, ''); return OK(TASKS.TXT.accept);
}
function tasksDrop(S, tier) {
  if (!tkOn(S)) return NO('المهام غير متاحة'); const T = tkState(S), sl = tkSlot(T, tier); if (!sl.pick) return NO('لا مهمة قائمة'); const rc = T.recent.slice().reverse().find(r => r.id === sl.pick.id && r.t === tier && r.ok == null); if (rc) rc.ok = false; sl.pick = null; sl.st = null; sl.offer = []; sl.next = 0; return OK(TASKS.TXT.drop);
}
/* ---------- العرض للواجهة (038ب): بطاقات الخانات ---------- */
function tasksView(S) {
  if (!tkOn(S)) return null; const fresh = !S.player.tk2, T = tkState(S); if (fresh) tasksDay(S); const wk = Math.floor(S.day / 7), c = T.cap.wk === wk ? T.cap : { infl: 0, xp: 0 };
  const slots = ['short', 'week'].map(tier => { const sl = tkSlot(T, tier);
    if (sl.pick) { const id = sl.pick.id, p = tkP(null, id, sl.pick.p, sl.st); return { tier, name: TASKS.names[tier], state: 'active', id, kind: TASKS.KIND[TK_T[id].kind], text: tkText(id, 'offer', sl.pick.p, sl.st), why: tkText(id, 'why', sl.pick.p, null), prog: tkText(id, 'prog', sl.pick.p, sl.st), reward: tkRewardLine(TK_T[id].reward), left: Math.max(0, sl.st.due - S.day) }; }
    if (sl.offer.length) return { tier, name: TASKS.names[tier], state: 'offer', offers: sl.offer.map((o, i) => ({ i, id: o.id, kind: TASKS.KIND[TK_T[o.id].kind], text: tkText(o.id, 'offer', o.p, null), why: tkText(o.id, 'why', o.p, null), reward: tkRewardLine(TK_T[o.id].reward) })) };
    const fin = sl.fin && sl.next > S.day && TK_T[sl.fin.id] ? { text: sl.fin.txt, reward: tkRewardLine(TK_T[sl.fin.id].reward), say: TASKS.TXT.done } : null;
    return { tier, name: TASKS.names[tier], state: sl.next > S.day ? 'wait' : 'none', fin, text: sl.next > S.day ? TASKS.TXT.next(sl.next - S.day) : TASKS.TXT.none }; });
  return { top: TASKS.TXT.top, week: TASKS.TXT.week(c.infl, TASKS.cap.infl), infl: c.infl, inflCap: TASKS.cap.infl, capped: c.infl >= TASKS.cap.infl || c.xp >= TASKS.cap.xp, slots, season: tkSeasonView(S) };
}
/* ---------- الخانة الموسمية (038ب): هدف الموسم القائم (008) كما هو؛ يُقبل تلقائياً عند بدء الموسم فلا اختيار فيه ولا تراجع.
   الدينية (SG-01..06): النص المعتمد في 008 وجائزتها تجميلية فقط. غير الدينية: +10 نفوذ ولقب (بالسقف الأسبوعي نفسه). قراءة فقط ---------- */
TASKS.season = { infl: 10, cosm: 'زخرفة الموسم (تجميلية فقط)', offer: 'بِع {ن} وحدة من سلع {الموسم} في أسواقه', why: 'بدأ موسم {الموسم}', done: 'أتممتَ هدف {الموسم}', reward: '+{ن} نفوذ ولقب «{لقب}»', name: 'مهمة الموسم' };
function tkSeasonView(S) {
  const sv = seasonGoalView(S), G = S.seasonGoals, out = { name: TASKS.season.name, cur: [], done: [] }; if (!sv || !sv.on) return out;
  const lab = n => String(n).replace(/^موسم /, ''), one = (c, d) => ({ k: c.k, religious: !!d.id, label: lab(d.name), why: tkFill(TASKS.season.why, { 'الموسم': lab(d.name) }), reward: d.id ? TASKS.season.cosm : tkFill(TASKS.season.reward, { 'ن': TASKS.season.infl, 'لقب': d.title }) });
  for (const c of sv.cur) out.cur.push(Object.assign(one(c, c), { text: c.id || c.verb !== 'sell' ? c.text : tkFill(TASKS.season.offer, { 'ن': c.need, 'الموسم': lab(c.name) }), n: c.got, need: c.need, left: c.left }));
  if (G && G.done) for (const k in G.done) if (G.done[k] != null && seasonActive(S, k) && !sv.cur.some(c => c.k === k)) { const d = seasonGoalDef(S, k); if (d && !sgHidden(k)) out.done.push(Object.assign(one(d, d), { text: tkFill(TASKS.season.done, { 'الموسم': lab(d.name) }) })); }
  return out;
}
/* مكافأة الهدف غير الديني: نفوذ بالسقف الأسبوعي، ولا تُمنح إلا لمن فتح المهام (الحالة الكسولة) فلا يتغير شيء قبل ذلك ولا عند الإطفاء */
function tkSeasonDone(S, k, d) {
  if (!tkOn(S) || !S.player.tk2 || d.id) return; const T = tkState(S), c = T.cap, wk = Math.floor(S.day / 7); if (c.wk !== wk) { c.wk = wk; c.infl = 0; c.xp = 0; }
  const infl = Math.max(0, Math.min(TASKS.season.infl, TASKS.cap.infl - c.infl)); if (infl && bonusAward(S, 'tk2:season:' + k + ':' + (S.seasonGoals ? S.seasonGoals.y : 0), infl, 0, TASKS.TXT.done + ' ' + tkFill(TASKS.season.done, { 'الموسم': String(d.name).replace(/^موسم /, '') }))) c.infl += infl;
}
/* ملخص قراءة فقط لسطر «حال أعمالي»: عدد المهام الجارية (لا يُنشئ حالة ولا يولّد عرضاً) */
function tasksBrief(S) {
  if (!tkOn(S)) return null; const T = S.player.tk2; let n = 0; if (T && T.slots) for (const tier of ['short', 'week']) if (T.slots[tier] && T.slots[tier].pick) n++;
  return { n: n + tkSeasonView(S).cur.length, fresh: !T };
}
A.tasksPick = tasksPick; A.tasksDrop = tasksDrop;
