/* ---------- لوحتا ترتيب الدول والأسواق (020؛ ملاحظة بن محمود 11): عرض فقط بلا أثر اقتصادي ----------
   التصميم: docs/goals/WORLD.md القسم 2. تُشتق القيم مما بنته 016 (prosperityView). الحقل الاختياري S.board = { day, cur, prev } لقطة أصغر
   (الازدهار الكلي لكل مدينة ودولة) تُؤخذ كل 30 يوماً بعد التحديث الشهري، ويتبعها سهم الاتجاه (cur − prev).
   الترتيب والقيم تُشتق عند الطلب (رخيصة: 18 مدينة) ولا تُخزَّن لأنها لا تتغير إلا مع التحديث الشهري نفسه.
   BOARDS.on=false ⇒ لا لوحات ولا حقل. */
const BOARDS = { on: true, step: 30, flat: 0.5 };
const bdOn = S => !!(BOARDS.on && PROSPER.on && S && S.learn && S.learn.char);
const bdLed = (S, id) => { const c = S.cities[id], bs = S.bosses && S.bosses[id]; return !!(c && (c.owner === 'player' || (bs && bs.ruler === 'player'))); };
function bdDims(vs, w) { // متوسط موزون لأبعاد مجموعة مدن
  const tot = w.reduce((a, b) => a + b, 0) || 1, out = PR_KEYS.map(k => ({ k, name: PR_NAMES[k], v: vs.reduce((a, d, i) => a + d.find(x => x.k === k).v * w[i], 0) / tot }));
  const hi = out.reduce((a, b) => (b.v > a.v ? b : a)), lo = out.reduce((a, b) => (b.v < a.v ? b : a)); return { dims: out, strong: hi, weak: lo };
}
const bdTrend = (S, key, id, cur) => { const b = S.board; if (!b || !b.prev || b.prev[key][id] == null) return 0; const d = cur - b.prev[key][id]; return d > BOARDS.flat ? 1 : d < -BOARDS.flat ? -1 : 0; };
function marketBoard(S) {
  if (!bdOn(S)) return []; const rows = S.order.map(id => { const v = prosperityView(S, id), c = S.cities[id], bs = S.bosses && S.bosses[id], led = bdLed(S, id), hi = v.dims.reduce((a, b) => (b.v > a.v ? b : a)), lo = v.dims.reduce((a, b) => (b.v < a.v ? b : a));
    return { id, name: c.name, country: c.country, P: v.total, dims: v.dims.map(d => ({ k: d.k, name: d.name, v: d.v, share: d.share })), strong: { k: hi.k, name: hi.name, v: hi.v }, weak: { k: lo.k, name: lo.name, v: lo.v }, pop: popTotal(c), led,
      boss: bs && !led ? { name: bs.name, b: bs.b, p: bs.p, share: bossShare(bs) } : null, mine: v.dims.filter(d => d.share > 0.005).map(d => ({ k: d.k, name: d.name, share: d.share })), poor: v.poor }; });
  rows.sort((a, b) => b.P - a.P || (a.id < b.id ? -1 : 1)); rows.forEach((r, i) => { r.rank = i + 1; r.trend = bdTrend(S, 'c', r.id, r.P); }); return rows;
}
function countryBoard(S) {
  if (!bdOn(S)) return []; const rows = COUNTRIES.map(k => { const ids = S.order.filter(id => S.cities[id].country === k.id); if (!ids.length) return null; const vs = ids.map(id => prosperityView(S, id)), w = ids.map(id => S.cities[id].size), g = bdDims(vs.map(v => v.dims), w);
    return { id: k.id, name: k.name, flag: k.flag, color: k.color, P: vs.reduce((a, v, i) => a + v.total * w[i], 0) / w.reduce((a, b) => a + b, 0), dims: g.dims, strong: g.strong, weak: g.weak, pop: ids.reduce((a, id) => a + popTotal(S.cities[id]), 0), total: ids.length, led: ids.filter(id => bdLed(S, id)).length }; }).filter(Boolean);
  rows.sort((a, b) => b.P - a.P || (a.id < b.id ? -1 : 1)); rows.forEach((r, i) => { r.rank = i + 1; r.trend = bdTrend(S, 'k', r.id, r.P); }); return rows;
}
// لقطة الاتجاه كل 30 يوماً (بعد prosperityDay)
function boardsDay(S) {
  if (!bdOn(S) || S.day <= 0 || S.day % BOARDS.step !== 0) return; const cur = { c: {}, k: {} };
  for (const r of marketBoard(S)) cur.c[r.id] = r.P; for (const r of countryBoard(S)) cur.k[r.id] = r.P;
  S.board = { day: S.day, cur, prev: S.board ? S.board.cur : null };
}
