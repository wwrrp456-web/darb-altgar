/* ---------- مُجدوِل الإيقاع، وضع الظل (WP-17أ): يراقب ويسجّل ولا يغيّر شيئاً في اللعبة.
   مطفأ افتراضياً (SCHED.on=false) فلا يُلمس S ولا الحفظ؛ السجل في هذه الوحدة لا في S.
   ما أُطلق فعلاً: فروق القوائم في S.learn بين ملاحظتين (ملاحظة عند كل يوم وبعد كل فعل).
   ما كان سيطلقه: نسخة T من S قبل مطلقات اليوم، تُستدعى عليها دوال الشروط الموجودة نفسها (لا نسخ منطقها)، ثم تُطبَّق سياسة الترتيب على المرشّحين. ---------- */
const SCHED = { on: false, cards: true, tablets: true, secrets: true, boss: true, MAX_HOLD: 5, GAP_DAYS: 2, map: null, log: [], seq: 0, prev: null, pend: [], last: -99, would: [], tickErr: 0 };
function schedReset(map) { SCHED.map = map || null; SCHED.log = []; SCHED.seq = 0; SCHED.prev = null; SCHED.pend = []; SCHED.last = -99; SCHED.would = []; SCHED.tickErr = 0; SCHED.by = null; }
const schedBy = () => SCHED.by || (SCHED.by = Object.fromEntries((SCHED.map || []).map(p => [p.id, p])));
// الدوال التي يستدعيها المُجدوِل على T، حسب حقل src في خريطة المحتوى (الرمز بعد ::). ما ليس فيها يُلاحَظ فقط لأنه يُطلق عند فعل اللاعب.
const SCHED_CALL = { stageCheck: T => learnCheck(T), loreCheck: T => loreCheck(T), tabletCheck: T => tabletCheck(T), CARD_TRIG: T => cardDay(T), achDay: T => achDay(T), ACH_CHECK: T => achDay(T) };
SCHED.routes = Object.keys(SCHED_CALL);
// قطع الخريطة التي بلغها اللاعب فعلاً، بمعرّفات الخريطة
function schedReached(S) {
  const L = S.learn, out = new Set(); if (!L || !L.char) return out;
  for (const n of L.stageDone || []) out.add('stage:' + n);
  for (const n of L.up || []) out.add('level:' + n);
  for (const id of L.cards || []) out.add('card:' + id);
  for (const id of L.tab || []) out.add('tablet:' + id);
  for (const c in (L.lore || {})) for (let i = 1; i <= L.lore[c]; i++) out.add('boss:' + c + ':' + i);
  for (const id of L.csec || []) out.add('secret:city:' + id);
  for (const id of L.secrets || []) out.add('secret:country:' + id);
  for (const g of L.pst || []) out.add('product:' + g);
  if (S.ach) for (const id in S.ach.got) out.add('achievement:' + id);
  return out;
}
// ما ينتظر العرض الآن في طوابير اللحظات (للتمييز بين الإطلاق والعرض)
function schedQueued(S) {
  const L = S.learn, out = new Set(); if (!L || !L.char) return out;
  for (const n of L.stageUp || []) out.add('stage:' + n);
  for (const n of L.up || []) out.add('level:' + n);
  for (const id of L.cq || []) out.add('card:' + id);
  for (const id of L.tq || []) out.add('tablet:' + id);
  for (const b of L.bq || []) out.add('boss:' + b.c + ':' + b.n);
  for (const id of L.csq || []) out.add('secret:city:' + id);
  for (const id of L.sq || []) out.add('secret:country:' + id);
  if (S.ach) for (const id of S.ach.q || []) out.add('achievement:' + id);
  return out;
}
const schedPush = (e) => { e.n = ++SCHED.seq; SCHED.log.push(e); };
// ملاحظة سلبية: فروق الإطلاق والعرض منذ الملاحظة السابقة
function schedObserve(S, via) {
  if (!SCHED.on || !S.learn || !S.learn.char) return;
  const reached = schedReached(S), queued = schedQueued(S), pv = SCHED.prev;
  if (pv) {
    for (const id of reached) if (!pv.reached.has(id)) { schedPush({ d: S.day, ev: 'fire', id, via }); SCHED.pend.push({ id, d: S.day, via }); }
    for (const id of pv.queued) if (!queued.has(id)) schedPush({ d: S.day, ev: 'shown', id, via });
    for (const id of queued) if (!pv.queued.has(id) && !reached.has(id)) { /* في الطابور دون أن يكون مسجّلاً بلغه: يُهمَل (طوابير بلا قائمة بلوغ) */ }
  }
  SCHED.prev = { reached, queued };
}
// مرشّحو اليوم كما تراهم دوال الشروط نفسها على نسخة من الحالة قبل المطلقات؛ لا يمسّ S
function schedShadowDay(S, T) {
  if (!SCHED.on || !S.learn || !S.learn.char) return null;
  let cand = [];
  try {
    const before = schedReached(T), seen = new Set();
    for (const f of ['stageCheck', 'ACH_CHECK', 'CARD_TRIG']) { const fn = SCHED_CALL[f]; if (seen.has(fn)) continue; seen.add(fn); fn(T); }
    for (const id of schedReached(T)) if (!before.has(id)) cand.push(id);
  } catch (e) { SCHED.tickErr++; }
  return cand;
}
// سياسة الترتيب: الفصل الحالي أولاً، الأساسي قبل الجانبي، ثم الأقدم؛ لحظة واحدة كل GAP_DAYS يوماً (الأساسي في الفصل الحالي لا ينتظر الحد)
function schedPolicy(S, d) {
  const by = schedBy(); if (!SCHED.pend.length) return;
  const cur = Math.max(1, ...[...(SCHED.prev ? SCHED.prev.reached : [])].filter(id => /^(stage|level):/.test(id) && by[id]).map(id => by[id].ch));
  const rank = e => { const p = by[e.id]; return p ? [p.ch <= cur ? 0 : 1, p.kind === 'core' ? 0 : 1, p.ch, e.d] : [2, 1, 99, e.d]; };
  const cmp = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
  SCHED.pend.sort(cmp);
  const head = SCHED.pend[0], p = by[head.id], free = d - SCHED.last >= SCHED.GAP_DAYS, urgent = p && p.kind === 'core' && p.ch <= cur;
  if (free || urgent) { SCHED.pend.shift(); SCHED.last = d; SCHED.would.push({ id: head.id, d, fired: head.d }); schedPush({ d, ev: 'would', id: head.id, fired: head.d }); }
}
// نداء اليوم: يُستدعى من tick قبل المطلقات (T) وبعدها
function schedDayBegin(S) { if (!SCHED.on || !S.learn || !S.learn.char) return null; try { const T = JSON.parse(JSON.stringify(S)); T.shadowClone = 1; return T; } catch (e) { SCHED.tickErr++; return null; } }
function schedDayEnd(S, T) {
  if (!SCHED.on || !S.learn || !S.learn.char) return;
  const cand = T ? schedShadowDay(S, T) : null; schedObserve(S, 'tick');
  schedPush({ d: S.day, ev: 'cand', ids: cand || [] });
  schedPolicy(S, S.day);
}

// ---------- نقل البطاقات إلى المُجدوِل (WP-17ب-1) ----------
// مفتاح الرجوع: SCHED.cards=false يعيد إطلاق البطاقات القديم حرفياً (لا يُلمس شيء من الحالة)؛ true هو الافتراضي.
// لحظات المراحل (الدروس الأساسية لا تتأخر): ارتفاع عددها يختم يوم آخر لحظة في L.lastMom فتنتظر الجانبية فاصلها بعدها
function schedMom(S) {
  const L = S.learn, n = (L.stageDone || []).length;
  if (L.momN == null) { L.momN = n; return; } if (n > L.momN) { L.momN = n; L.lastMom = S.day; }
}
// فسحة الفاصل (يومان بين لحظتين) أو بلوغ سقف التأخير عن الموعد الأصلي d
function schedMayFire(S, d) { const L = S.learn; return S.day - (L.lastMom == null ? -99 : L.lastMom) >= SCHED.GAP_DAYS || S.day - d >= SCHED.MAX_HOLD; }
function schedCardFire(S, id, d) {
  const L = S.learn; L.cards.push(id); L.cq.push(id); L.cardDay = S.day; L.lastMom = S.day; L.momN = (L.momN || 0) + 1;
  if (SCHED.on && !S.shadowClone) schedPush({ d: S.day, ev: 'cdelay', id: 'card:' + id, delay: S.day - d });
}

// ---------- نقل الألواح والأسرار وحكايات الزعماء (WP-17ب-2) ----------
// مفاتيح الرجوع المستقلة: SCHED.tablets (tq) وSCHED.secrets (csq وsq) وSCHED.boss (bq)؛ false يدفع للطابور مباشرة كالقديم.
// الأثر في الحالة (L.tab وL.lore وL.csec وL.secrets والمكافأة والخبر) يبقى فورياً؛ المؤجَّل هو لحظة العرض فقط: L.schedHold في الحفظ.
const SCHED_KEY = { tq: 'tablets', csq: 'secrets', sq: 'secrets', bq: 'boss' }, SCHED_RANK = { tq: 0, csq: 1, sq: 1, bq: 2 }, SCHED_PID = { tq: x => 'tablet:' + x, csq: x => 'secret:city:' + x, sq: x => 'secret:country:' + x, bq: x => 'boss:' + x.c + ':' + x.n };
function schedQ(S, q, item) {
  const L = S.learn; if (!SCHED[SCHED_KEY[q]]) { L[q].push(item); return; }
  (L.schedHold || (L.schedHold = [])).push({ q, item, d: S.day });
}
function schedRelease(S) {
  const L = S.learn, H = L.schedHold; if (!H || !H.length) return;
  const rel = x => { H.splice(H.indexOf(x), 1); L[x.q].push(x.item); L.lastMom = S.day; if (SCHED.on && !S.shadowClone) schedPush({ d: S.day, ev: 'cdelay', id: SCHED_PID[x.q](x.item), delay: S.day - x.d }); };
  const aged = H.filter(x => S.day - x.d >= SCHED.MAX_HOLD); for (const x of aged.sort((a, b) => SCHED_RANK[a.q] - SCHED_RANK[b.q] || a.d - b.d)) rel(x);
  if (H.length && S.day - (L.lastMom == null ? -99 : L.lastMom) >= SCHED.GAP_DAYS) rel(H.slice().sort((a, b) => SCHED_RANK[a.q] - SCHED_RANK[b.q] || a.d - b.d)[0]);
}
