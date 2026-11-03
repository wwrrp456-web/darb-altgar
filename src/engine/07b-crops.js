/* ---------- الزرع والحصاد وزكاة الزروع (018) ----------
   التصميم: docs/goals/CROPS.md (معتمد). أحكام الزكاة حرفياً من docs/review/APPROVED_REVIEW_2026-10-24.md و APPROVED_CROPS_2026-11-03.md.
   CROPS.on=false يعيد السلوك السابق حرفياً: لا قطع ولا زكاة زروع. القطع اختيارية في الحفظ: f.plots؛ وغيابها = كل القطع مرعى. */
const CROPS = { on: true, kg: 10, nisab: 612, olive: 5, perLevel: 2, convert: 300, loss: 20, over: 20, rot: 0.03, short: 0.5, rainMul: { sa: 0.8, ir: 0.8 }, rainFar: 0.6 };
const CROP_WATER = { rain: { name: 'مطر', cost: 0, rate: 0.1 }, well: { name: 'بئر', cost: 2, rate: 0.05 }, mixed: { name: 'مختلط', cost: 1, rate: 0.075 }, river: { name: 'سيح نهر', cost: 0.5, rate: 0.1 } };
const CROP_RAIN_CITIES = ['jazan'], CROP_RAIN_COUNTRIES = ['in', 'cn'];
const CROP_RIVER_CITIES = ['cairo', 'alex', 'aswan', 'delhi', 'kolkata', 'shanghai', 'xian'];
// zk: تجب فيه زكاة الزروع عند الحصاد (قمح، أرز، تمر، زبيب، بنّ، زيتون)؛ وغيره عروض تجارة يُزكّى ثمنه مع المال.
const CROP_DEFS = {
  wheat: { name: 'قمح', g: 'wheat', kind: 'grain', fit: { eg: 1, ir: 1, in: 1, cn: 0.8, sa: 0.6 }, days: 100, yield: 158, seed: 200, zk: true },
  rice: { name: 'أرز', g: 'rice', kind: 'grain', fit: { in: 1, cn: 1, eg: 0.5 }, days: 110, yield: 175, seed: 250, zk: true },
  cotton: { name: 'قطن', g: 'cotton', kind: 'cash', fit: { eg: 1, in: 1, cn: 0.7 }, days: 150, yield: 122, seed: 300 },
  sugarcane: { name: 'قصب السكر', g: 'sugar', kind: 'cash', fit: { eg: 1, in: 1 }, days: 240, yield: 105, seed: 400 },
  herbs: { name: 'أعشاب طبية', g: 'herbs', kind: 'cash', fit: { in: 1, sa: 0.8 }, days: 70, yield: 52, seed: 250 },
  saffron: { name: 'زعفران', g: 'saffron', kind: 'cash', fit: { ir: 1 }, days: 90, yield: 14, seed: 600 },
  datepalm: { name: 'نخيل التمر', g: 'dates', kind: 'tree', fit: { sa: 1, eg: 0.8 }, days: 360, cycle: 360, yield: 140, seed: 900, zk: true },
  vine: { name: 'كرم العنب', g: 'raisins', kind: 'tree', fit: { ir: 1, sa: 0.6 }, days: 360, cycle: 360, yield: 122, seed: 800, zk: true },
  coffee: { name: 'البنّ', g: 'coffee', kind: 'tree', fit: { sa: 1 }, only: ['jazan'], days: 540, cycle: 360, yield: 70, seed: 1200, zk: true },
  olive: { name: 'الزيتون', g: 'oliveoil', kind: 'tree', fit: { eg: 1 }, only: ['alex'], days: 720, cycle: 360, yield: 63, seed: 1200, zk: true, olive: true },
  tea: { name: 'الشاي', g: 'tea', kind: 'tree', fit: { cn: 1, in: 0.8 }, days: 540, cycle: 180, yield: 70, seed: 1000 }
};
const CROP_IDS = Object.keys(CROP_DEFS);
const CROP_ALERT = 'أثمرت الأرض وبلغت غلتك النصاب؛ أخرج حق الله فيها'; // معتمد حرفياً (الحكم المعتمد، البند 6)
const CROP_SALEM = 'يا بني، ما تدخره من قوتٍ كالحبوب والتمر إذا بلغ حصاده نصاباً (612 كجم) فزكاته واجبةٌ يوم قطافه: نصف العُشر (5٪) إن سقيته بكلفة ومضخات، والعُشر كاملاً (10٪) إن شرب من المطر، وثلاثة أرباع العُشر (7.5٪) إن جمعت بينهما. أما الفواكه الرطبة وسائر الغِلال فتُزكى أثمانها مع أموالك عند تمام الحول'; // معتمد حرفياً (البند 7)
const cropYear = S => Math.floor(S.day / YEAR);
const cropPlotCount = f => (f ? CROPS.perLevel * f.level : 0);
const cropPlots = f => Array.from({ length: cropPlotCount(f) }, (_, i) => (f.plots && f.plots[i]) || { use: 'pasture' });
const cropFieldLoss = f => (CROPS.on && f && f.plots ? CROPS.loss * f.plots.filter((p, i) => i < cropPlotCount(f) && p && p.use === 'field').length : 0);
const cropSownCount = f => (CROPS.on && f && f.plots ? f.plots.filter((p, i) => i < cropPlotCount(f) && p && p.use === 'field' && p.crop).length : 0);
const cropTreeValue = f => (CROPS.on && f && f.plots ? f.plots.reduce((n, p, i) => n + (i < cropPlotCount(f) && p && p.crop && CROP_DEFS[p.crop] && CROP_DEFS[p.crop].kind === 'tree' ? CROP_DEFS[p.crop].seed * 0.6 : 0), 0) : 0);
const cropFit = (def, city) => (def.only && !def.only.includes(city.id) ? 0 : def.fit[city.country] || 0);
const cropRain = city => CROP_RAIN_CITIES.includes(city.id) || CROP_RAIN_COUNTRIES.includes(city.country);
const cropRiver = city => CROP_RIVER_CITIES.includes(city.id);
function cropWaterMul(city, water) {
  const rain = cropRain(city) ? 1 : CROPS.rainMul[city.country] || CROPS.rainFar;
  return water === 'rain' ? rain : water === 'mixed' ? (rain + 1) / 2 : 1;
}
function cropWaterOk(city, water) { return water === 'river' ? cropRiver(city) : Object.hasOwn(CROP_WATER, water); }
const cropKg = (crop, units) => units * GD[CROP_DEFS[crop].g].w * CROPS.kg * (CROP_DEFS[crop].olive ? CROPS.olive : 1); // الزيتون: النصاب بوزن حب الزيتون = الزيت × 5 (CR-03)
function cropQuote(S, city, idx, crop, water) {
  const f = farmOf(S, city), c = S.cities[city], def = CROP_DEFS[crop];
  if (!CROPS.on || !f || !c || !def) return { ok: false, msg: 'اختر محصولاً.' };
  const fit = cropFit(def, c);
  if (!fit) return { ok: false, msg: 'لا يصلح هنا.' };
  if (!cropWaterOk(c, water)) return { ok: false, msg: 'لا نهر يسقي هنا.' };
  const wm = cropWaterMul(c, water), units = Math.floor(def.yield * fit * wm), per = CROP_WATER[water].cost;
  const days = def.days, cost = def.seed + per * days, value = units * mid(def.g);
  return { ok: true, crop, water, fit, wm, units, days, seed: def.seed, perDay: per, cost, value, profit: value - cost };
}
function cropExpected(S, city, p) {
  const f = farmOf(S, city), c = S.cities[city], def = CROP_DEFS[p.crop];
  if (!f || !c || !def) return 0;
  const short = farmCover(S, city) < 1 ? CROPS.short : 1, rot = Math.max(0, 1 - CROPS.rot * Math.max(0, (p.grow - p.need) - CROPS.over));
  return Math.floor(def.yield * cropFit(def, c) * cropWaterMul(c, p.water) * short * rot);
}
const cropRipe = p => !!(p && p.crop && p.grow >= p.need);
function cropZ(S) {
  const P = S.player, y = cropYear(S); let z = P.cropZ;
  if (!z) z = P.cropZ = { y, g: {}, dues: [], hist: [], salem: 0 };
  if (z.y !== y) { z.y = y; z.g = {}; }
  return z;
}
function cropDay(S, city, pr, c) {
  const f = pr.farm; if (!CROPS.on || !f || !f.plots) return;
  const cover = farmCover(S, city);
  ctxFor(S, city);
  cropPlots(f).forEach((p, i) => {
    if (p.use !== 'field' || !p.crop) return;
    const real = f.plots[i], per = CROP_WATER[real.water] ? CROP_WATER[real.water].cost : 0;
    if (per > 0) { const paid = pPay(S, 'farm', per, true); real.cost = (real.cost || 0) + paid; if (paid + 1e-9 < per) return; }
    const was = real.grow; real.grow += cover < 1 ? CROPS.short : 1;
    if (was < real.need && real.grow >= real.need) news(S, 'نضج محصول ' + CROP_DEFS[real.crop].name + ' في قطعة ' + (i + 1) + ' من مزرعة ' + c.name + '؛ احصده قبل أن يفسد.', 'good');
  });
}
function cropHarvestZakat(S, city, crop, units, water) {
  const def = CROP_DEFS[crop], out = { due: 0, alert: false };
  if (!def.zk || units <= 0) return out;
  const z = cropZ(S), r = z.g[def.g] || (z.g[def.g] = { kg: 0, due: 0, charged: 0 });
  r.kg += cropKg(crop, units); r.due += units * CROP_WATER[water].rate;
  if (r.kg + 1e-9 >= CROPS.nisab) {
    const add = Math.round((r.due - r.charged) * 100) / 100;
    if (add > 0) {
      r.charged = r.due; z.dues.push({ id: S.nextId++, city, g: def.g, units: add, day: S.day, y: z.y });
      out.due = add; out.alert = true; news(S, CROP_ALERT, 'good'); if (!z.salem) z.salem = S.day || 1;
    }
  }
  return out;
}
function cropHarvest(S, city, idx) {
  const f = farmOf(S, city), pr = S.player.props[city], c = S.cities[city];
  if (!CROPS.on || !f || !pr || !c || !Number.isSafeInteger(idx) || idx < 0 || idx >= cropPlotCount(f)) return NO('اختر قطعة.');
  const p = f.plots && f.plots[idx];
  if (!p || p.use !== 'field' || !p.crop) return NO('لا محصول في هذه القطعة.');
  if (!cropRipe(p)) return NO('لم ينضج بعد؛ بقي ' + Math.ceil(p.need - p.grow) + ' يوماً.');
  const def = CROP_DEFS[p.crop], units = cropExpected(S, city, p), room = Math.floor(storeRoom(S, city) / GD[def.g].w);
  if (units < 1) return NO('فسد المحصول فلا غلة.');
  if (room < units) return NO('المخزن لا يتسع للغلة (' + units + ' وحدة)؛ أخلِ مكاناً أو وسّعه.');
  ctxFor(S, city);
  pr.store[def.g] = (pr.store[def.g] || 0) + units; addBasis(pr.basis || (pr.basis = {}), def.g, units, p.cost || 0);
  const z = cropHarvestZakat(S, city, p.crop, units, p.water), name = def.name;
  if (def.kind === 'tree') { p.grow = 0; p.need = def.cycle; p.cost = 0; } else f.plots[idx] = { use: 'field' };
  return Object.assign(OK('حصدتَ ' + units + ' ' + GD[def.g].name + ' (' + name + ') إلى مخزنك.' + (z.alert ? ' ' + CROP_ALERT + '.' : '')), { units, zakat: z.due, g: def.g });
}
function cropZakatValue(S, due) { const c = S.cities[due.city]; return Math.round(due.units * (c ? unitPrice(c, due.g) : mid(due.g)) * 100) / 100; }
function cropZakatPay(S, id, mode) {
  const z = S.player.cropZ, due = z && z.dues.find(d => d.id === id);
  if (!CROPS.on || !due) return NO('لا زكاة زروع مستحقة بهذا الرقم.');
  if (mode !== 'kind' && mode !== 'cash') return NO('اختر الإخراج عيناً أو نقداً.');
  const pr = S.player.props[due.city], c = S.cities[due.city], value = cropZakatValue(S, due);
  if (mode === 'kind') {
    if (!pr || (pr.store[due.g] || 0) + 1e-9 < due.units) return NO('لا يكفي المخزن لإخراجها عيناً؛ أخرجها نقداً.');
    pr.store[due.g] = Math.max(0, pr.store[due.g] - due.units); if (pr.store[due.g] < 1e-9) delete pr.store[due.g]; takeBasis(pr.basis || (pr.basis = {}), due.g, due.units);
  } else {
    const keep = S.ctxCur; S.ctxCur = 'sar';
    if (S.player.gold < value) { S.ctxCur = keep; return NO('رصيدك لا يكفي لإخراجها نقداً.'); }
    pPay(S, 'zakat', value, true); S.ctxCur = keep;
  }
  z.dues = z.dues.filter(d => d !== due); z.hist.unshift({ day: S.day, city: due.city, g: due.g, units: due.units, value, mode }); if (z.hist.length > 20) z.hist.length = 20;
  const zn = prosZakat(S, value);
  return Object.assign(OK('تقبّل الله منك! أخرجتَ زكاة ' + GD[due.g].name + (mode === 'kind' ? ' عيناً' : ' نقداً') + (zn ? '. ' + ZAKAT_IMPACT.replace('{N}', zn) : '')), { value, impact: zn });
}
function cropMigrate(S) {
  for (const pr of Object.values((S.player && S.player.props) || {})) {
    const f = pr.farm; if (!f || f.plots === undefined) continue;
    if (!Array.isArray(f.plots)) { delete f.plots; continue; }
    f.plots = f.plots.slice(0, cropPlotCount(f)).map(p => {
      if (!p || (p.use !== 'field' && p.use !== 'pasture')) return { use: 'pasture' };
      if (p.use === 'pasture') return { use: 'pasture' };
      if (!p.crop) return { use: 'field' };
      const def = CROP_DEFS[p.crop];
      if (!def || !CROP_WATER[p.water] || !Number.isFinite(p.grow) || p.grow < 0 || !Number.isFinite(p.need) || p.need <= 0) return { use: 'field' };
      return { use: 'field', crop: p.crop, water: p.water, grow: p.grow, need: p.need, cost: Number.isFinite(p.cost) && p.cost >= 0 ? p.cost : 0 };
    });
    if (!f.plots.some(p => p.use === 'field')) delete f.plots;
  }
  const z = S.player && S.player.cropZ; if (!z) return;
  if (typeof z !== 'object' || !Number.isSafeInteger(z.y) || z.y < 0) { delete S.player.cropZ; return; }
  z.g = z.g && typeof z.g === 'object' ? z.g : {};
  for (const g of Object.keys(z.g)) { const r = z.g[g]; if (!GD[g] || !r || !['kg', 'due', 'charged'].every(k => Number.isFinite(r[k]) && r[k] >= 0)) delete z.g[g]; }
  z.dues = (Array.isArray(z.dues) ? z.dues : []).filter(d => d && Number.isSafeInteger(d.id) && S.cities[d.city] && GD[d.g] && Number.isFinite(d.units) && d.units > 0 && Number.isSafeInteger(d.day));
  for (const d of z.dues) S.nextId = Math.max(S.nextId || 1, d.id + 1);
  z.hist = (Array.isArray(z.hist) ? z.hist : []).slice(0, 20); z.salem = Number.isSafeInteger(z.salem) && z.salem > 0 ? z.salem : 0;
}
