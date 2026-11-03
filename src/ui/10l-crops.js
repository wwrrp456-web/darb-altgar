/* الحقول والزرع (018): تبويب «الحقول» في بطاقة المزرعة؛ خطوة واحدة لكل زر. نصوص الزكاة معتمدة حرفياً من المحرك. */
const farmTab = {}, cropWaterChoice = {};
function cropTabs(c) {
  if (!E.CROPS.on) return '';
  const t = farmTab[c.id] === 'fields' ? 'fields' : 'herd';
  return `<div class="row farm-tabs" role="tablist" style="flex-wrap:wrap;margin-block:6px">${[['herd', 'الأنعام'], ['fields', 'الحقول']].map(([k, n]) => `<button class="sm ${t === k ? 'pri' : ''}" role="tab" aria-selected="${t === k}" data-act="farm-tab" data-c="${c.id}" data-t="${k}">${n}</button>`).join('')}</div>`;
}
function cropWaterFor(c, i) {
  const ok = Object.keys(E.CROP_WATER).filter(w => w !== 'river' || E.cropRiver(c)), want = cropWaterChoice[c.id + ':' + i];
  return ok.includes(want) ? want : E.cropRiver(c) ? 'river' : E.cropRain(c) ? 'rain' : 'well';
}
function cropDuesHTML(c) {
  const z = S.player.cropZ, dues = z ? z.dues.filter(d => d.city === c.id) : [];
  let h = '';
  if (dues.length) h += `<div class="card crop-zakat"><b>${esc(E.CROP_ALERT)}</b>${dues.map(d => { const v = E.cropZakatValue(S, d); return `<div class="kv"><span>${gi(d.g)} ${esc(GD[d.g].name)}</span><b>${f1(d.units)} وحدة (≈ ${lm(v, c)})</b></div><div class="row" style="flex-wrap:wrap"><button class="sm pri" data-act="crop-zk" data-id="${d.id}" data-m="kind">أخرجها عيناً</button><button class="sm" data-act="crop-zk" data-id="${d.id}" data-m="cash">أخرجها نقداً (${lm(v, c)})</button></div>`; }).join('')}</div>`;
  if (z && z.salem) h += `<div class="card crop-salem">${mentorSay(E.CROP_SALEM, 'teach')}</div>`;
  return h;
}
function cropPlotHTML(c, f, p, i) {
  const n = i + 1;
  if (p.use !== 'field') return `<div class="card crop-plot" data-plot="${i}"><b>قطعة ${n}: مرعى</b><p class="small muted">تحويلها إلى حقل ينقص المرعى ${E.CROPS.loss} وحدة، ويكلف ${lm(E.CROPS.convert, c)} مرة واحدة.</p><button class="sm" data-act="crop-convert" data-c="${c.id}" data-i="${i}" data-t="field">حوّلها إلى حقل</button></div>`;
  if (p.crop) {
    const def = E.CROP_DEFS[p.crop], left = Math.max(0, Math.ceil(p.need - p.grow)), ripe = E.cropRipe(p), exp = E.cropExpected(S, c.id, p);
    return `<div class="card crop-plot" data-plot="${i}"><b>${gi(def.g)} قطعة ${n}: ${esc(def.name)}</b>${bar(Math.min(p.grow, p.need), p.need)}<p class="small">${ripe ? 'نضج؛ احصده الآن.' : 'باقٍ ' + left + ' يوماً على الحصاد.'} المتوقع ${exp} ${esc(GD[def.g].name)} · السقي: ${esc(E.CROP_WATER[p.water].name)}${E.CROP_WATER[p.water].cost ? ' (' + lm(E.CROP_WATER[p.water].cost, c) + ' يومياً)' : ' (بلا كلفة)'}.</p>${ripe ? `<button class="sm pri" data-act="crop-harvest" data-c="${c.id}" data-i="${i}">احصد</button>` : ''}</div>`;
  }
  const water = cropWaterFor(c, i), waters = Object.keys(E.CROP_WATER).filter(w => w !== 'river' || E.cropRiver(c));
  const opts = E.CROP_IDS.map(id => { const q = E.cropQuote(S, c.id, i, id, water); return { id, q, def: E.CROP_DEFS[id] }; }).sort((a, b) => (b.q.ok ? b.q.profit : -1e9) - (a.q.ok ? a.q.profit : -1e9));
  return `<div class="card crop-plot" data-plot="${i}"><b>قطعة ${n}: حقل فارغ</b><label class="small">السقي <select data-crop-water="${c.id}:${i}">${waters.map(w => `<option value="${w}" ${w === water ? 'selected' : ''}>${esc(E.CROP_WATER[w].name)}${E.CROP_WATER[w].cost ? ' · ' + lm(E.CROP_WATER[w].cost, c) + ' يومياً' : ' · بلا كلفة'}</option>`).join('')}</select></label><h4>ماذا أزرع هنا؟</h4>${opts.map(({ id, q, def }) => q.ok ? `<div class="kv"><span>${gi(def.g)} ${esc(def.name)}<span class="small muted" style="display:block">غلة ${q.units} · ينضج بعد ${q.days} يوماً · البذر ${lm(q.seed, c)}</span></span><button class="sm" data-act="crop-sow" data-c="${c.id}" data-i="${i}" data-crop="${id}" data-w="${water}">ازرع</button></div>` : `<div class="kv muted"><span>${gi(def.g)} ${esc(def.name)}</span><b class="small">${esc(q.msg)}</b></div>`).join('')}<button class="sm" data-act="crop-convert" data-c="${c.id}" data-i="${i}" data-t="pasture">أعدها مرعى</button></div>`;
}
function cropFieldsCard(c, f, pr) {
  const plots = E.cropPlots(f), farmers = E.staffOf(S, c.id).filter(w => w.role === 'farmer'), need = E.farmerNeed(S, c.id);
  return `<section class="card farm farm-managed farm-fields"><h3>🌾 المزرعة <span class="pill">مستوى ${f.level}</span></h3>${cropTabs(c)}<p class="small">كل مزرعة فيها ${plots.length} قطع؛ القطعة إما مرعى للأنعام أو حقل. الغلة تذهب إلى مخزن المدينة، ولكل قطعة مزروعة مزارع واحد.</p><div class="kv"><span>${pic('team/farmer', 'av', 'المزارع')} المزارعون الموجودون / المطلوبون</span><b>موجود ${farmers.length} · مطلوب ${need}</b></div>${cropDuesHTML(c)}${plots.map((p, i) => cropPlotHTML(c, f, p, i)).join('')}<button data-act="hirestaff" data-g="farmer">+ مزارع</button></section>`;
}
