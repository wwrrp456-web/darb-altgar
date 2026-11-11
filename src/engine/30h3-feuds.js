/* ---------- 036و الخصومات العادية بين الزعماء ----------
   S.feuds = [{a,b,s,e}]: خصومة بين زعيمي مدينتين، تشحّ فيها سلع a (المصنَّعة) في سوق b: (1) علاوة المسافة تتجاهل a فيُحسب السعر من أقرب منتِج آخر (c.fpm[g])،
   (2) يُخفَّض ملء الرف البطيء لتلك السلع (c.fpl[g] × PULL_FAR). لا تمس بضاعة اللاعب ولا قوافله، ولا تشمل مكة والمدينة. أرقام الولادة بذرية بلا استهلاك rnd.
   GRIEF.on=false: لا S.feuds ولا c.fpm ولا c.fpl، والأسواق كما كانت حرفياً. */
const GRIEF = { on: true, perYear: [2, 3], year: 360, minDays: 30, maxDays: 60, perCountry: 2, world: 4, pull: 0.5, noFeud: ['mecca', 'medina'] };
function fdH(S, ...ks) { let t = (S.climateSeed >>> 0) || 1; for (const k of ks) { t = Math.imul(t ^ (k >>> 0), 0x9E3779B1) >>> 0; t ^= t >>> 15; t = Math.imul(t, 0x85EBCA6B) >>> 0; t ^= t >>> 13; } return (t >>> 0) / 4294967296; }
const fdGoods = (S, a, b) => { const cb = S.cities[b]; return S.cities[a].makes.filter(g => GD[g].tier !== 'raw' && g !== 'wheat' && !cb.makes.includes(g)); };
const fdIn = (S, id) => (S.feuds || []).some(f => f.a === id || f.b === id);
const fdCnt = (S, ctry) => (S.feuds || []).filter(f => S.cities[f.a].country === ctry || S.cities[f.b].country === ctry).length;
function feudApply(S) { // يعيد بناء الأثر من القائمة؛ لا حقل في المدينة ما لم تكن متضررة
  for (const id of S.order) { delete S.cities[id].fpm; delete S.cities[id].fpl; }
  for (const f of (S.feuds || [])) {
    const cb = S.cities[f.b], db = CITY_DEFS.find(d => d.id === f.b), pm = cb.fpm || (cb.fpm = {}), pl = cb.fpl || (cb.fpl = {});
    fdGoods(S, f.a, f.b).forEach(g => {
      let best = Infinity; CITY_DEFS.forEach(m => { if (m.id !== f.a && m.makes.includes(g)) best = Math.min(best, Math.hypot(m.x - db.x, m.y - db.y)); });
      pm[g] = Math.max(PREM[f.b][g], 1 + PREM_MAX * (isFinite(best) ? Math.min(1, best / PREM_D) : 1)); pl[g] = GRIEF.pull;
    });
  }
}
function feudBirth(S, ci, k) {
  const ctry = COUNTRIES[ci].id, ok = id => { const c = S.cities[id], bs = bossOf(S, id); return !GRIEF.noFeud.includes(id) && c.owner !== 'player' && bs && bs.ruler === 'boss' && !fdIn(S, id); };
  if (fdCnt(S, ctry) >= GRIEF.perCountry || (S.feuds || []).length >= GRIEF.world) return;
  const mine = S.order.filter(id => S.cities[id].country === ctry && ok(id)); if (!mine.length) return;
  const a = mine[Math.floor(fdH(S, 3, ci, S.day, k) * mine.length)];
  let pool = S.order.filter(id => id !== a && ok(id) && fdCnt(S, S.cities[id].country) < GRIEF.perCountry && fdGoods(S, a, id).length);
  const inner = pool.filter(id => S.cities[id].country === ctry), outer = pool.filter(id => S.cities[id].country !== ctry);
  pool = (fdH(S, 4, ci, S.day, k) < 0.5 ? inner : outer); if (!pool.length) pool = inner.length ? inner : outer; if (!pool.length) return;
  const b = pool[Math.floor(fdH(S, 5, ci, S.day, k) * pool.length)];
  const f = { a, b, s: S.day, e: S.day + GRIEF.minDays + Math.floor(fdH(S, 6, ci, S.day, k) * (GRIEF.maxDays - GRIEF.minDays + 1)) };
  (S.feuds = S.feuds || []).push(f); feudApply(S);
  news(S, FEUD_TXT.born(bossOf(S, a).name, bossOf(S, b).name, S.cities[a].name, S.cities[b].name, f.e - S.day), 'rumor');
}
function feudDay(S) {
  if (!GRIEF.on) return;
  if (S.feuds && S.feuds.length) { const gone = S.feuds.filter(f => f.e <= S.day); if (gone.length) { S.feuds = S.feuds.filter(f => f.e > S.day); feudApply(S); gone.forEach(f => news(S, FEUD_TXT.end(S.cities[f.a].name, S.cities[f.b].name), 'rumor')); } }
  const y = Math.floor(S.day / GRIEF.year);
  COUNTRIES.forEach((C, ci) => { const n = GRIEF.perYear[0] + (fdH(S, 1, ci, y) < 0.5 ? 0 : 1); for (let k = 0; k < n; k++) if (y * GRIEF.year + Math.floor(fdH(S, 2, ci, y, k) * GRIEF.year) === S.day) feudBirth(S, ci, k); });
}
const FEUD_TXT = {
  born: (ba, bb, ca, cb, d) => 'اختلف ' + ba + ' و' + bb + '، فتشحّ سلع ' + ca + ' في سوق ' + cb + ' نحو ' + d + ' يوماً.',
  end: (ca, cb) => 'انتهت الخصومة بين ' + ca + ' و' + cb + '، وتعود سلع ' + ca + ' إلى رفوف سوق ' + cb + '.',
  line: (ba, bb, gs, left) => 'اختلف ' + ba + ' و' + bb + '، فتشحّ ' + gs + ' في هذا السوق ويغلو سعرها. تنتهي بعد ' + left + ' يوماً.',
  none: 'لا خصومات قائمة الآن. قد يختلف زعيمان فتشحّ سلع أحدهما في سوق الآخر مدةً ثم تنتهي وحدها.',
  help: 'الخصومة تقطع سلع أحد الزعيمين عن سوق الآخر مدةً: تغلو وتقلّ على الرف، ولا تمس بضاعتك ولا قوافلك. فرصة لمن عنده منها، وضرر لمن يشتريها.',
  home: (n) => n + (n === 1 ? ' خصومة تمس سوقاً لك فيه أصل' : ' خصومات تمس أسواقاً لك فيها أصول'),
  shelf: 'الرف يمتلئ ببطء',
};
/* عرض القراءة: الأثر في السعر = نسبة العلاوة الجديدة إلى القديمة لأغلى سلعة متضررة */
function feudView(S) {
  if (!GRIEF.on || !S.feuds || !S.feuds.length) return [];
  return S.feuds.map(f => {
    const cb = S.cities[f.b], gs = fdGoods(S, f.a, f.b); let pct = 0; gs.forEach(g => { pct = Math.max(pct, Math.round(100 * ((cb.fpm && cb.fpm[g] || PREM[f.b][g]) / PREM[f.b][g] - 1))); });
    return { a: f.a, b: f.b, aName: S.cities[f.a].name, bName: cb.name, ba: bossOf(S, f.a).name, bb: bossOf(S, f.b).name, goods: gs, pct, left: Math.max(0, f.e - S.day), day: f.s };
  });
}
const feudAt = (S, city) => feudView(S).find(f => f.b === city) || null;
const feudsMine = S => feudView(S).filter(f => { const pr = S.player.props[f.b]; return pr && (shopsOf(S, f.b).length || farmOf(S, f.b)); });
