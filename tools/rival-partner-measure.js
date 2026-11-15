// معايرة k لمضاربة المنافسين (040د §15): 12 بذرة × 720 يوماً. اللاعب يحكم كل الأسواق ويوقّع مضاربة شهرية (رأس مال = ½ السقف، حصتك 60٪) كلما فرغ المنافس.
// الشرط: وسيط العائد السنوي بين 6٪ و30٪، ونسبة العقود الخاسرة بين 10٪ و35٪، ولا NaN. التشغيل: node tools/rival-partner-measure.js [k] [seeds] [days] [مدة العقد 30|60|0=بالتناوب]
const E = require('../src/engine.js'), A = E.A;
const K = process.argv[2] != null ? +process.argv[2] : E.RIVP.k, SEEDS = +(process.argv[3] || 12), DAYS = +(process.argv[4] || 720), CD = +(process.argv[5] || 0);
E.RIVP.k = K; E.GRIEF.on = false; E.rivalMemorySet(null);
const pct = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const ann = [], res = { n: 0, loss: 0, total: 0, betray: 0, bank: 0, nan: 0, full: 0 };
for (let seed = 1; seed <= SEEDS; seed++) {
  const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; S.phase = 3; S.player.gold = 1e9; S.player.wallet.sar = 1e9; Object.assign(S.learn, { level: 11, stage: 23, abroad: true });
  for (const id of S.order) { const b = S.bosses[id]; if (b) { b.ruler = 'player'; b.p = 100; b.b = 5; } }
  const open = new Map(); let seen = 0;
  for (let d = 0; d < DAYS; d++) {
    E.tick(S, false); S.pause = false; if (S.road) S.road = null;
    for (const id of S.order) { const b = S.bosses[id]; if (b && b.ruler !== 'player') { b.ruler = 'player'; b.p = 100; b.b = 5; } } // الحكم يُثبَّت: القياس لعقد المنافس لا لصراع الحكم
    if (d < 150) continue; // الجيل الأول من المنافسين يحتاج وقتاً
    for (const rv of (S.rivals || [])) {
      if (rv.out != null || rv.w == null || E.rvpAg(S, rv.id)) continue; if (E.rvpBlock(S, rv, 'rmud', null, { incoming: true })) continue;
      const cap = E.rvpCapOptions(S, rv)[1], cd = CD || (seen++ % 2 ? 60 : 30); if (!cap || E.rvpBlock(S, rv, 'rmud', { cap, days: cd, share: 0.6 }, { incoming: true })) continue;
      const g0 = S.player.gold; E.rvpSignNow(S, rv, 'rmud', { cap, days: cd, share: 0.6 }); const ag = E.rvpAg(S, rv.id); ag.__g0 = g0; ag.__d0 = S.day; open.set(ag.id, { ag, rid: rv.id, cap });
    }
    for (const [id, o] of open) if (!(S.player.agr || []).includes(o.ag)) {
      open.delete(id); const net = o.ag.led.act - o.cap, days = Math.max(1, S.day - o.ag.__d0), why = o.ag.led.why || '';
      if (!Number.isFinite(net)) { res.nan++; continue; } res.n++; res.total += net; const r = net / o.cap; ann.push(r * 365 / days); if (net < 0) res.loss++; if (net <= -o.cap + 1) res.full++;
      if (/انسحب/.test(why)) res.betray++; if (/أفلس/.test(why)) res.bank++;
    }
  }
  for (const r of S.rivals || []) if (r.w != null && !Number.isFinite(r.w)) res.nan++;
}
const out = { k: K, seeds: SEEDS, days: DAYS, contracts: res.n, p10: pct(ann, 0.1), p50: pct(ann, 0.5), p90: pct(ann, 0.9), lossShare: res.n ? res.loss / res.n : NaN, fullLoss: res.full, betrayals: res.betray, bankruptcies: res.bank, nan: res.nan };
console.log(JSON.stringify(out, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v)));
const ok = out.p50 >= 0.06 && out.p50 <= 0.30 && out.lossShare >= 0.10 && out.lossShare <= 0.35 && out.nan === 0;
console.log(ok ? 'OK: ضمن الشروط' : 'خارج الشروط'); process.exit(ok ? 0 : 1);
