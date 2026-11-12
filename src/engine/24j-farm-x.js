/* 035ج2 كفاءة رئيس المزرعة: لا نقل إلى مزرعة ممتلئة، وبيع الصغار بحدّه، وسقف المزارعين بالدرجة، وخطة الزرع ببطاقة ask.
   FARMX.on=false = 07a حرفاً: لا m.x ولا حقل جديد في الحفظ. الكفاءة تحسّن القرار داخل صلاحيات اللاعب ولا ترفع سقفه المالي، وكل شيء حتمي.
   رئيس المزرعة لا يبيع الأنعام الكبيرة أبداً (ذلك لكبير الرعاة 035ج). */
const FARMX = { on: true, full: 0.95, youngShare: 0.2, caps: [40, 40, 40, 50, 60], season: 88, ttl: 14, logMax: 12, minAdults: 4 };
const fxGrade = m => Math.max(1, Math.min(5, SKILL.on && m && m.sk && m.sk.g ? m.sk.g : 3));
const fxMaxCap = m => (FARMX.on ? FARMX.caps[fxGrade(m) - 1] : FARM_BOSS.maxCap);
const fxFill = (S, city) => { const f = farmOf(S, city), cap = farmCap(S, city); return f && cap > 0 ? farmUnits(f) / cap : 1; };
function fxOf(m) { if (!m.x) m.x = { cards: [], log: [], q: -1, yw: { d: 0, base: {}, sold: {} }, nid: 1 }; return m.x; }
const fxPush = (arr, o, max) => { arr.unshift(o); if (arr.length > max) arr.length = max; };
function fxWeekX(w) { if (!w.x) w.x = { kept: 0, ySold: 0, yNet: 0, why: [] }; return w.x; }
const fxWhy = (w, t) => { const a = fxWeekX(w).why; if (!a.includes(t)) a.push(t); if (a.length > 6) a.shift(); };
/* النقل من المخزن: الدرجة 3 فأعلى لا تملأ المزرعة فوق 95٪ ؛ ما لم ينتقل يبقى في المخزن مع السبب */
function fxMove(S, city, w, g, m) {
  const pr = S.player.props[city], f = farmOf(S, city), have = Math.floor(pr.store[g] || 0); if (have < 1) return 0;
  if (fxGrade(m) < 3) { const r = farmFromStore(S, city, g, have); if (r.ok) { w.moved += r.n; return r.n; } return 0; }
  const room = Math.floor((farmCap(S, city) * FARMX.full - farmUnits(f)) / BREED[g].fu), q = Math.min(have, Math.max(0, room));
  let moved = 0; if (q >= 1) { const r = farmFromStore(S, city, g, q); if (r.ok) { w.moved += r.n; moved = r.n; } }
  const kept = have - moved; if (kept >= 1) { fxWeekX(w).kept += kept; fxWhy(w, 'أبقيتُ ' + kept + ' رأساً من ' + GD[g].name + ' في المخزن لأن المزرعة ممتلئة'); }
  return moved;
}
/* بيع الصغار حين تبلغ المزرعة 95٪: الدرجة 3 فأعلى، والسعر ≥ المرجعي، وبحدّ 20٪ من صغار النوع في الأسبوع (يُحسب من صغاره أول الأسبوع) */
function fxYoung(S, city, w, m) {
  if (fxGrade(m) < 3 || fxFill(S, city) < FARMX.full) return;
  const f = farmOf(S, city), c = S.cities[city], x = fxOf(m), yw = x.yw;
  if (S.day - yw.d >= 7 || !yw.d) { yw.d = S.day; yw.base = {}; yw.sold = {}; for (const g of Object.keys(BREED)) { const y = Math.floor(youngOf(f, g)); if (y > 0) yw.base[g] = y; } }
  for (const g of Object.keys(yw.base)) {
    const y = Math.floor(youngOf(f, g)), adults = Math.floor(f.herd[g] || 0); if (y < 1 || adults < FARMX.minAdults || malesOf(f, g) < 1) continue; // حد التكاثر: لا يمس أصل القطيع
    if (unitPrice(c, g) < refPrice(c, g)) { fxWhy(w, 'لم أبِع صغار ' + GD[g].name + ' لأن السعر دون المرجعي'); continue; }
    const n = Math.min(y, Math.floor(yw.base[g] * FARMX.youngShare) - (yw.sold[g] || 0)); if (n < 1) continue;
    const r = A.farmSell(S, city, g, n, 'young'); if (!r.ok) continue;
    yw.sold[g] = (yw.sold[g] || 0) + r.n; const wx = fxWeekX(w); wx.ySold += r.n; wx.yNet += r.net; fxWhy(w, 'بعتُ ' + r.n + ' من صغار ' + GD[g].name + ' لأن المزرعة بلغت ' + Math.round(FARMX.full * 100) + '٪');
    fxPush(x.log, { d: S.day, t: 'بعتُ ' + r.n + ' من صغار ' + GD[g].name + ' بصافي ' + Math.round(r.net), amt: Math.round(r.net) }, FARMX.logMax);
  }
}
/* خطة الزرع (الدرجة 5): في بداية كل موسم، إن وُجدت قطعة حقل فارغة، تُعرض بطاقة بخيارين ثم «لا تزرع»؛ ولا يُزرع شيء إلا بما يختاره اللاعب */
const FX_WATERS = ['rain', 'river', 'mixed', 'well'];
function fxPlanQuotes(S, city, idx) {
  const out = []; for (const crop of CROP_IDS) for (const water of FX_WATERS) { const q = cropQuote(S, city, idx, crop, water); if (q.ok) out.push(q); }
  return out;
}
const fxEmptyPlots = (S, city) => { const f = farmOf(S, city); return f && f.plots ? cropPlots(f).map((p, i) => ({ p, i })).filter(o => o.p.use === 'field' && !o.p.crop).map(o => o.i) : []; };
function fxPlanCard(S, city, m) {
  const empty = fxEmptyPlots(S, city); if (!empty.length) return null;
  const qs = fxPlanQuotes(S, city, empty[0]); if (!qs.length) return null;
  const perDay = q => q.profit / q.days, best = qs.slice().sort((a, b) => perDay(b) - perDay(a) || a.cost - b.cost)[0], cheap = qs.slice().sort((a, b) => a.cost - b.cost || perDay(b) - perDay(a))[0];
  const x = fxOf(m), pick = q => ({ crop: q.crop, water: q.water, cost: q.cost, value: q.value, days: q.days, seed: q.seed });
  return { id: 'fx' + city + ':' + (x.nid++), type: 'plan', city, day: S.day, n: empty.length, best: pick(best), cheap: pick(cheap) };
}
function fxSeason(S, city, m) {
  const x = fxOf(m), q = Math.floor(S.day / FARMX.season); if (x.q === q) return; x.q = q;
  x.cards = x.cards.filter(c => S.day - c.day < FARMX.ttl); if (x.cards.some(c => c.type === 'plan')) return;
  const k = fxPlanCard(S, city, m); if (k) x.cards.push(k);
}
function farmXDay(S, city, w, m) { // يُستدعى من farmBossBegin بعد دفع الأجر
  fxYoung(S, city, w, m); if (fxGrade(m) >= 5) fxSeason(S, city, m);
}
function farmXAct(S, city, id, opt) {
  const m = farmBossOf(S, city); if (!FARMX.on || !m || !m.x) return NO('لا بطاقة قائمة');
  const x = m.x, i = x.cards.findIndex(c => c.id === id); if (i < 0) return NO('البطاقة لم تعد قائمة'); const k = x.cards[i];
  if (opt === 'none') { x.cards.splice(i, 1); fxPush(x.log, { d: S.day, t: 'لم تزرع هذا الموسم بقرارك', amt: 0 }, FARMX.logMax); return OK('لن يُزرع شيء هذا الموسم'); }
  const pick = opt === 'cheap' ? k.cheap : opt === 'best' ? k.best : null; if (!pick) return NO('خيار غير معروف');
  const empty = fxEmptyPlots(S, city); if (!empty.length) { x.cards.splice(i, 1); return NO('لا قطعة حقل فارغة الآن'); }
  let sown = 0, spent = 0, last = ''; const g0 = S.player.gold;
  for (const idx of empty) { const r = A.cropSow(S, city, idx, pick.crop, pick.water); if (!r.ok) { last = r.msg; break; } sown++; }
  spent = Math.max(0, g0 - S.player.gold); if (!sown) return NO(last || 'تعذّر الزرع');
  x.cards.splice(i, 1); const t = 'زرعتُ ' + CROP_DEFS[pick.crop].name + ' في ' + sown + ' قطعة بكلفة بذر ' + Math.round(spent);
  fxPush(x.log, { d: S.day, t, amt: -Math.round(spent) }, FARMX.logMax); const w = farmBossWeek(S, city); if (w) fxWhy(w, t);
  return OK(t + (sown < empty.length ? ' (توقف الباقي: ' + last + ')' : ''));
}
Object.assign(A, { farmXAct });
function farmXMigrate(S) {
  for (const pr of Object.values(S.player.props || {})) {
    const m = pr.farmBoss; if (!m || m.x === undefined) continue;
    if (!FARMX.on || !m.x || typeof m.x !== 'object' || Array.isArray(m.x)) { delete m.x; continue; }
    const x = m.x; if (!Array.isArray(x.cards)) x.cards = []; if (!Array.isArray(x.log)) x.log = [];
    x.cards = x.cards.filter(c => c && c.type === 'plan' && S.cities[c.city] && c.best && c.cheap && CROP_DEFS[c.best.crop] && CROP_DEFS[c.cheap.crop]);
    if (!Number.isFinite(x.q)) x.q = -1; if (!Number.isSafeInteger(x.nid) || x.nid < 1) x.nid = 1;
    if (!x.yw || typeof x.yw !== 'object') x.yw = { d: 0, base: {}, sold: {} }; for (const k of ['base', 'sold']) if (!x.yw[k] || typeof x.yw[k] !== 'object') x.yw[k] = {};
  }
}
function farmXView(S) { // ما تعرضه الواجهة: بطاقات الزرع المفتوحة وسجل أفعال الرئيس
  if (!FARMX.on || !S || !S.player) return null; const cards = [];
  for (const city of Object.keys(S.player.props || {})) { const m = farmBossOf(S, city); if (!m || !m.x) continue; for (const k of m.x.cards) if (S.day - k.day < FARMX.ttl && fxEmptyPlots(S, city).length) cards.push(k); }
  return cards;
}
