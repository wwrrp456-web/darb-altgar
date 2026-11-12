/* ---------- 042 «حال أعمالي» (الرئيسية): قراءة فقط لما بُني في 040/041 + لقطات أسبوعية للدفتر ----------
   P.hs = آخر ring لقطات أسبوعية {d, inc, exp} لإجماليات P.led (تُكتب فقط حين HOMEST.on، بلا ترحيل: الحفظ القديم يبدأ فارغاً).
   hsView يُحسب عند الرسم فقط (لا حلقة يومية سوى hsDay)، ولا يغيّر الحالة. HOMEST.on=false: لا يُكتب P.hs ولا شيء آخر (الرئيسية القديمة حرفياً). */
const HOMEST = { on: true, rows: 5, snapDays: 7, ring: 5, minDays: 28, badBelow: 60, newRival: 14 };
const hsRound = o => { const r = {}; for (const k in (o || {})) { const v = Math.round(o[k] || 0); if (v) r[k] = v; } return r; };
const hsSum = o => { let t = 0; for (const k in (o || {})) if (isFinite(o[k])) t += o[k]; return t; };
function hsDay(S) {
  if (!HOMEST.on || !S || !S.player || !S.player.led || S.day <= 0 || S.day % HOMEST.snapDays !== 0) return;
  const P = S.player, ring = P.hs || (P.hs = []); if (ring.length && ring[ring.length - 1].d === S.day) return;
  ring.push({ d: S.day, inc: hsRound(P.led.inc), exp: hsRound(P.led.exp) }); while (ring.length > HOMEST.ring) ring.shift();
}
/* 📒 الدفتر: الفرق بين الإجمالي الآن ولقطة عمرها ≥ minDays (الأحدث منها)؛ وإلا «منذ البداية» */
function hsLedger(S) {
  const P = S.player, L = P.led, ring = P.hs || [];
  let snap = null; for (const s of ring) if (S.day - s.d >= HOMEST.minDays) snap = s;
  const base = snap || { inc: {}, exp: {} }, rows = [];
  for (const [side, sg] of [['inc', 1], ['exp', -1]]) for (const k in L[side]) { if (k === 'wealthLevy' && !(L[side][k] > 0)) continue; const v = (L[side][k] || 0) - (base[side][k] || 0); if (Math.abs(v) >= 1) rows.push({ k, side, v: sg * v }); }
  rows.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const inc = hsSum(L.inc) - hsSum(base.inc), exp = hsSum(L.exp) - hsSum(base.exp), top = rows.slice(0, 6), rest = (inc - exp) - top.reduce((a, r) => a + r.v, 0); // «غيرها» = الباقي فيطابق المجموعُ الصافي
  return { net: inc - exp, inc, exp, days: snap ? S.day - snap.d : null, since: snap ? 'days' : 'start', rows: top, other: rest, snaps: ring.length };
}
/* 🏺 صندوق أهم مدينة: أكثر دكاكينك، وتُفضَّل التي تحكمها؛ وإلا مدينة تحكمها */
function hsFund(S) {
  if (!(typeof mfOn === 'function' && mfOn(S))) return null;
  const ids = (S.order || []).filter(id => S.cities[id]), mine = id => S.player.props[id] ? shopsOf(S, id).length : 0, rules = id => { const b = bossOf(S, id); return b && b.ruler === 'player' ? 1 : 0; };
  const cand = ids.filter(id => mine(id) > 0 || rules(id)).sort((a, b) => (mine(b) - mine(a)) || (rules(b) - rules(a)) || ids.indexOf(a) - ids.indexOf(b)); if (!cand.length) return null;
  const id = cand[0], v = fundView(S, id); if (!v) return null; const bs = bossOf(S, id), f = S.cities[id].fund || {};
  const days = PR.month - (S.day % PR.month), spend = Math.max(0, Math.min(v.bal, (v.bal - MFUND.reserveDays * (f.avg || 0)) * MFUND.spendShare));
  return { city: id, name: S.cities[id].name, bal: v.bal, ruler: v.ruler, boss: bs ? bs.name : '', mine: v.ruler === 'player', view: v, spendDays: days, spend: Math.round(spend) };
}
/* 🏬 الدكاكين المملوكة بحالتها وأثرها (من 040هـ) */
function hsShops(S) {
  if (!SHOPCOND.on) return null; const list = [];
  for (const city of (S.order || [])) { const pr = S.player.props[city]; if (!pr) continue;
    for (const sh of pr.shops) { if (shKind(sh) !== 'own') continue; const q = scQuote(S, city, sh.id); if (!q) continue; list.push({ city, cityName: S.cities[city].name, id: sh.id, g: sh.items && sh.items[0] ? sh.items[0].g : null, cond: q.cond, name: q.name, eff: scEffect(q), cost: q.cost, can: q.can, bad: q.cond < HOMEST.badBelow, good: q.cond >= SHOPCOND.states[1][0] }); } }
  if (!list.length) return null; return { list, good: list.filter(x => x.good).length, bad: list.filter(x => x.bad).length, mid: list.filter(x => !x.good && !x.bad).length };
}
/* 🧭 المنافسون النشطون في مدنك (حيث لك أصول) */
function hsRivals(S) {
  if (!rgOn(S)) return null; const mineC = Object.keys(S.player.props).filter(id => S.player.props[id] && (shopsOf(S, id).length || S.player.props[id].whs));
  const v = rivalGenView(S), out = [];
  for (const r of v.list) { const rv = (S.rivals || []).find(x => x.id === r.id); if (!rv || !rv.fx) continue; const here = rv.fx.cities.filter(c => mineC.includes(c)); if (!here.length) continue; out.push({ ...r, here, hereNames: here.map(c => S.cities[c].name), fresh: S.day - rv.born <= HOMEST.newRival }); }
  if (!out.length) return null; out.sort((a, b) => (b.str || 0) - (a.str || 0)); return { list: out, top: out[0] };
}
function hsView(S) {
  if (!HOMEST.on || !S || !S.player || !S.learn || !S.learn.char) return null;
  const P = S.player, lv = typeof liqView === 'function' ? liqView(S) : null, shops = hsShops(S), liq = lv && lv.dep > 0 ? lv : null;
  const hasAny = (S.order || []).some(id => P.props[id] && shopsOf(S, id).length) || !!liq; if (!hasAny) return null; // لا بطاقة قبل أول دكان أو وديعة
  return { ledger: hsLedger(S), fund: hsFund(S), shops, liq, rivals: hsRivals(S), feuds: GRIEF.on ? feudsMine(S) : [] };
}
