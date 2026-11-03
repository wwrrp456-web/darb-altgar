/* أفعال الزرع (018): تحويل القطعة، الزرع، الحصاد، إخراج زكاة الزروع. */
A.cropConvert = function (S, city, idx, to) {
  const f = farmOf(S, city), c = S.cities[city];
  if (!CROPS.on || !f || !c || !Number.isSafeInteger(idx) || idx < 0 || idx >= cropPlotCount(f) || (to !== 'field' && to !== 'pasture')) return NO('اختر قطعة من مزرعتك.');
  const cur = (f.plots && f.plots[idx]) || { use: 'pasture' };
  if (to === 'field') {
    if (cur.use === 'field') return NO('القطعة حقل بالفعل.');
    const left = Math.max(0, farmCap(S, city) - CROPS.loss);
    if (left + 1e-9 < farmUnits(f)) return NO('الأنعام تملأ المرعى؛ بِع بعضها أو انقلها قبل تحويل القطعة إلى حقل.');
    ctxFor(S, city); if (S.player.gold < CROPS.convert) return NO('تحتاج ' + CROPS.convert + ' ريال لتحويل القطعة.');
    pPay(S, 'farm', CROPS.convert, true); f.plots = f.plots || []; while (f.plots.length < idx) f.plots.push({ use: 'pasture' }); f.plots[idx] = { use: 'field' };
    return OK('صارت القطعة ' + (idx + 1) + ' حقلاً؛ نقص المرعى ' + CROPS.loss + ' وحدة.');
  }
  if (cur.use !== 'field') return NO('القطعة مرعى بالفعل.');
  if (cur.crop) return NO('في القطعة محصول؛ احصده أولاً (والشجر لا يُزال).');
  f.plots[idx] = { use: 'pasture' }; if (!f.plots.some(p => p && p.use === 'field')) delete f.plots;
  return OK('عادت القطعة ' + (idx + 1) + ' مرعى.');
};
A.cropSow = function (S, city, idx, crop, water) {
  const f = farmOf(S, city), c = S.cities[city];
  if (!CROPS.on || !f || !c || !Number.isSafeInteger(idx) || idx < 0 || idx >= cropPlotCount(f)) return NO('اختر قطعة من مزرعتك.');
  const cur = f.plots && f.plots[idx]; if (!cur || cur.use !== 'field') return NO('حوّل القطعة إلى حقل أولاً.');
  if (cur.crop) return NO('في القطعة محصول بالفعل.');
  const q = cropQuote(S, city, idx, crop, water); if (!q.ok) return NO(q.msg);
  ctxFor(S, city); if (S.player.gold < q.seed) return NO('تحتاج ' + q.seed + ' ريال للبذر.');
  const def = CROP_DEFS[crop]; pPay(S, 'farm', q.seed, true);
  f.plots[idx] = { use: 'field', crop, water, grow: 0, need: def.days, cost: q.seed };
  return OK('زرعتَ ' + def.name + ' بسقي ' + CROP_WATER[water].name + '؛ ينضج بعد ' + def.days + ' يوماً.');
};
A.cropHarvest = function (S, city, idx) { return cropHarvest(S, city, idx); };
A.cropZakatPay = function (S, id, mode) { return cropZakatPay(S, id, mode); };
