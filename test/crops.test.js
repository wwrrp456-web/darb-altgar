'use strict';
// 018 الزرع والحصاد وزكاة الزروع: النسب الثلاث، النصاب، لا ضم بين الأجناس، العروض لا تُزكّى، الضم السنوي، الزيتون، الأشجار، الحفظ القديم، مفتاح الرجوع.
const a = require('node:assert/strict'), fs = require('node:fs'), E = require('../src/engine.js'), A = E.A, near = (x, y) => a(Math.abs(x - y) < 1e-6, `${x} != ${y}`);
function fresh(city = 'cairo') {
  const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.noEvents = true; S.noShocks = true; S.player.gold = 500000;
  a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok); a(A.buildFarm(S, city).ok);
  const pr = S.player.props[city]; for (let i = 0; i < 4; i++) pr.staff.push({ id: S.nextId++, role: 'farmer', days: 300, late: 0, free: 0 });
  return S;
}
const tick = (S, city, n) => { for (let i = 0; i < n; i++) { S.day++; E.cropDay(S, city, S.player.props[city], S.cities[city]); } };
const WY = E.CROP_DEFS.wheat.yield, approved = fs.readFileSync(require('node:path').join(__dirname, '../docs/review/APPROVED_REVIEW_2026-10-24.md'), 'utf8');

// 1) النصوص المعتمدة حرفياً، والأحكام الأساسية
a(approved.includes(E.CROP_ALERT), 'نص التنبيه معتمد حرفياً'); a(approved.includes(E.CROP_SALEM), 'جملة عمّ سالم معتمدة حرفياً');
a.equal(E.CROPS.nisab, 612); a.equal(E.CROPS.kg, 10); a.equal(E.CROPS.on, true);
a.deepEqual(Object.fromEntries(Object.entries(E.CROP_WATER).map(([k, v]) => [k, v.rate])), { rain: 0.1, well: 0.05, mixed: 0.075, river: 0.1 });
a.deepEqual(E.CROP_IDS.filter(id => E.CROP_DEFS[id].zk).map(id => E.CROP_DEFS[id].g).sort(), ['coffee', 'dates', 'oliveoil', 'raisins', 'rice', 'wheat']);

// 2) الأرض: التحويل والسعة والمزارعون
{
  const S = fresh(), f = S.player.props.cairo.farm, cap0 = E.farmCap(S, 'cairo'), need0 = E.farmerNeed(S, 'cairo'), gold0 = S.player.gold;
  a.equal(E.cropPlots(f).length, 2); a(E.cropPlots(f).every(p => p.use === 'pasture')); a.equal(f.plots, undefined, 'لا حقل في الحفظ حتى يحوّل اللاعب');
  a(A.cropConvert(S, 'cairo', 0, 'field').ok); near(E.farmCap(S, 'cairo'), cap0 - 20); a(gold0 - S.player.gold >= 300 && gold0 - S.player.gold < 330, 'كلفة التحويل بعملة المدينة');
  a.equal(A.cropConvert(S, 'cairo', 0, 'field').ok, false); a.equal(A.cropConvert(S, 'cairo', 5, 'field').ok, false); a.equal(A.cropConvert(S, 'cairo', 1, 'xx').ok, false);
  a(A.cropSow(S, 'cairo', 0, 'wheat', 'river').ok); a.equal(E.farmerNeed(S, 'cairo'), need0 + 1, 'القطعة المزروعة تحتاج مزارعاً');
  a.equal(A.cropConvert(S, 'cairo', 0, 'pasture').ok, false, 'في القطعة محصول');
  // الأنعام تملأ المرعى فلا تحويل
  const S2 = fresh(); const f2 = S2.player.props.cairo.farm; f2.herd = { sheep: E.farmCap(S2, 'cairo') - 10 }; a.equal(A.cropConvert(S2, 'cairo', 0, 'field').ok, false);
  // إعادتها مرعى
  const S3 = fresh(); a(A.cropConvert(S3, 'cairo', 0, 'field').ok); a(A.cropConvert(S3, 'cairo', 0, 'pasture').ok); a.equal(S3.player.props.cairo.farm.plots, undefined);
  // المفتاح العام: لا قطع ولا خصم من السعة
  const S4 = fresh(); a(A.cropConvert(S4, 'cairo', 0, 'field').ok); E.CROPS.on = false; near(E.farmCap(S4, 'cairo'), cap0); a.equal(A.cropConvert(S4, 'cairo', 1, 'field').ok, false); a.equal(E.farmerNeed(S4, 'cairo'), need0); E.CROPS.on = true;
}

// 3) الزرع: المناسب للدولة، السقي، الكلفة
{
  const S = fresh('riyadh'), pr = S.player.props.riyadh; a(A.cropConvert(S, 'riyadh', 0, 'field').ok);
  a.equal(A.cropSow(S, 'riyadh', 0, 'coffee', 'well').ok, false, 'البنّ لجازان فقط'); a.equal(E.cropQuote(S, 'riyadh', 0, 'coffee', 'well').msg, 'لا يصلح هنا.');
  a.equal(A.cropSow(S, 'riyadh', 0, 'wheat', 'river').ok, false, 'لا نهر في الرياض'); a.equal(A.cropSow(S, 'riyadh', 0, 'wheat', 'xx').ok, false);
  const g0 = S.player.gold; a(A.cropSow(S, 'riyadh', 0, 'datepalm', 'well').ok); near(g0 - S.player.gold, 900);
  a.equal(A.cropSow(S, 'riyadh', 0, 'wheat', 'well').ok, false, 'القطعة مشغولة');
  const rain = E.cropQuote(S, 'riyadh', 1, 'wheat', 'rain'), well = E.cropQuote(S, 'riyadh', 1, 'wheat', 'well'), mix = E.cropQuote(S, 'riyadh', 1, 'wheat', 'mixed');
  a(rain.units < well.units && well.units === Math.floor(WY * 0.6) && mix.units > rain.units && mix.units < well.units, 'المطر في السعودية أقل غلة'); near(well.perDay, 2); near(mix.perDay, 1); near(rain.perDay, 0);
  const S2 = fresh('delhi'); a(E.cropQuote(S2, 'delhi', 0, 'wheat', 'rain').units >= WY); a.equal(E.cropQuote(S2, 'delhi', 0, 'wheat', 'river').ok, true, 'دلهي على نهر');
  a.equal(E.cropQuote(fresh('jazan'), 'jazan', 0, 'coffee', 'rain').ok, true);
}

// 4) النمو والحصاد والتلف والمزارعون
{
  const S = fresh(), pr = S.player.props.cairo, f = pr.farm; a(A.cropConvert(S, 'cairo', 0, 'field').ok); a(A.cropSow(S, 'cairo', 0, 'wheat', 'river').ok);
  a.equal(A.cropHarvest(S, 'cairo', 0).ok, false, 'لم ينضج'); tick(S, 'cairo', 99); a.equal(E.cropRipe(f.plots[0]), false); tick(S, 'cairo', 1); a(E.cropRipe(f.plots[0]));
  a(S.news.some(n => /نضج محصول قمح/.test(n.t)));
  const w0 = pr.store.wheat || 0, r = A.cropHarvest(S, 'cairo', 0); a(r.ok); a.equal(r.units, WY); near(pr.store.wheat - w0, WY); a.equal(f.plots[0].crop, undefined, 'الحقل فارغ بعد الحصاد'); near(r.zakat, WY * 0.1, 'الغلة تبلغ النصاب (62 وحدة قمح) فتجب زكاة سيح الأنهار 10٪');
  // نقص المزارع: نضج أبطأ 50٪ وغلة أقل
  const S2 = fresh(), p2 = S2.player.props.cairo; p2.staff = []; a(A.cropConvert(S2, 'cairo', 0, 'field').ok); a(A.cropSow(S2, 'cairo', 0, 'wheat', 'river').ok); tick(S2, 'cairo', 100); a.equal(E.cropRipe(p2.farm.plots[0]), false); tick(S2, 'cairo', 100); a(E.cropRipe(p2.farm.plots[0]));
  const r2 = A.cropHarvest(S2, 'cairo', 0); a.equal(r2.units, Math.floor(WY / 2), 'نصف الغلة عند نقص المزارع');
  // التلف: بعد 20 يوماً من النضج يفسد 3٪ يومياً
  const S3 = fresh(), p3 = S3.player.props.cairo; a(A.cropConvert(S3, 'cairo', 0, 'field').ok); a(A.cropSow(S3, 'cairo', 0, 'wheat', 'river').ok); tick(S3, 'cairo', 120); a.equal(E.cropExpected(S3, 'cairo', p3.farm.plots[0]), WY); tick(S3, 'cairo', 10); a(E.cropExpected(S3, 'cairo', p3.farm.plots[0]) < WY); tick(S3, 'cairo', 100); a.equal(A.cropHarvest(S3, 'cairo', 0).ok, false, 'فسد كله');
  // المخزن لا يتسع: لا حصاد ولا ضياع
  const S4 = fresh(), p4 = S4.player.props.cairo; a(A.cropConvert(S4, 'cairo', 0, 'field').ok); a(A.cropSow(S4, 'cairo', 0, 'wheat', 'river').ok); tick(S4, 'cairo', 100); p4.store.salt = E.storeCap(S4, 'cairo'); a.equal(A.cropHarvest(S4, 'cairo', 0).ok, false); a(E.cropRipe(p4.farm.plots[0]), 'الغلة باقية في الأرض');
  // أجر السقي يومياً بالكلفة المعتمدة
  const S5 = fresh('riyadh'), p5 = S5.player.props.riyadh; a(A.cropConvert(S5, 'riyadh', 0, 'field').ok); a(A.cropSow(S5, 'riyadh', 0, 'wheat', 'well').ok); const gg = S5.player.gold; tick(S5, 'riyadh', 3); near(gg - S5.player.gold, 6);
}

// 5) SC-001: زكاة الحصاد: النسب الثلاث وسيح الأنهار، النصاب، لا ضم بين الأجناس
{
  const mk = () => fresh(), z = (S, crop, units, water) => E.cropHarvestZakat(S, 'cairo', crop, units, water);
  for (const [w, rate] of [['rain', 0.1], ['well', 0.05], ['mixed', 0.075], ['river', 0.1]]) { const S = mk(); const r = z(S, 'wheat', 100, w); near(r.due, 100 * rate); a(r.alert); a.equal(S.player.cropZ.dues.length, 1); }
  { const S = mk(); a.equal(z(S, 'wheat', 61, 'rain').due, 0, '61 وحدة = 610 كجم دون النصاب'); a.equal(S.player.cropZ.dues.length, 0); a(!S.news.some(n => n.t === E.CROP_ALERT)); }
  { const S = mk(); const r = z(S, 'wheat', 62, 'rain'); a(r.alert, '62 وحدة = 620 كجم'); near(r.due, 6.2); a(S.news.some(n => n.t === E.CROP_ALERT), 'التنبيه الفوري'); a(S.player.cropZ.salem > 0, 'جملة عمّ سالم أول مرة'); }
  // لا ضم بين الأجناس
  { const S = mk(); a.equal(z(S, 'wheat', 40, 'rain').due, 0); a.equal(z(S, 'rice', 40, 'rain').due, 0); a.equal(S.player.cropZ.dues.length, 0, 'قمح 400 + أرز 400 لا يُضمان'); }
  // الضم داخل الجنس الواحد في السنة (CR-02) والزيادة تُحتسب على الكل، ثم تصفير في السنة التالية
  { const S = mk(); a.equal(z(S, 'wheat', 40, 'well').due, 0); const r2 = z(S, 'wheat', 30, 'well'); near(r2.due, 70 * 0.05); const r3 = z(S, 'wheat', 10, 'well'); near(r3.due, 0.5); near(S.player.cropZ.dues.reduce((n, d) => n + d.units, 0), 80 * 0.05);
    S.day += E.YEAR; a.equal(z(S, 'wheat', 40, 'well').due, 0, 'سنة جديدة: النصاب من جديد'); a.equal(S.player.cropZ.dues.length, 2, 'المستحق غير المخرج يبقى'); }
  // مختلف السقي في الجنس الواحد: حكم كل قطعة بسقيها
  { const S = mk(); a.equal(z(S, 'wheat', 40, 'rain').due, 0); near(z(S, 'wheat', 40, 'well').due, 40 * 0.1 + 40 * 0.05); }
  // الزيتون: النصاب بحب الزيتون = الزيت × 5 (CR-03)، 612 ÷ (1.5 × 10 × 5) = 8.16 وحدة زيت
  { const S = mk(); a.equal(z(S, 'olive', 8, 'river').due, 0, '8 وحدات زيت = 600 كجم حب'); const r = z(S, 'olive', 1, 'river'); near(r.due, 0.9); a(r.alert); }
  // السلع التي تجب في عينها عند الحصاد: القمح والأرز والتمر والزبيب والبنّ والزيتون؛ والباقي عروض تجارة (SC-002)
  for (const crop of ['wheat', 'rice', 'datepalm', 'vine', 'coffee', 'olive']) { const S = mk(); a(z(S, crop, 1000, 'rain').alert, crop); }
  for (const crop of ['cotton', 'sugarcane', 'tea', 'saffron', 'herbs']) { const S = mk(); a.equal(z(S, crop, 100000, 'rain').due, 0, crop + ' عروض تجارة'); a.equal(S.player.cropZ, undefined, 'لا يُسجَّل ولا يُنبَّه'); a(!S.news.some(n => n.t === E.CROP_ALERT)); }
}

// 6) حصاد فعلي يبلغ النصاب بضم قطعتين (CR-02) ثم الإخراج عيناً ونقداً
{
  const S = fresh(), pr = S.player.props.cairo; S.player.props.cairo.farm.level = 3;
  for (let i = 0; i < 2; i++) { a(A.cropConvert(S, 'cairo', i, 'field').ok); a(A.cropSow(S, 'cairo', i, 'wheat', 'river').ok); }
  tick(S, 'cairo', 100); const r0 = A.cropHarvest(S, 'cairo', 0); a(r0.ok); near(r0.zakat, WY * 0.1); const r = A.cropHarvest(S, 'cairo', 1); a(r.ok); near(r.zakat, WY * 0.1, 'حصاد القطعة الثانية: المستحق على غلتها فقط بعد ضم الأولى'); a.equal(S.player.cropZ.dues.length, 2); a(/أخرج حق الله/.test(r.msg));
  const due = S.player.cropZ.dues[0], w0 = pr.store.wheat; const k = A.cropZakatPay(S, due.id, 'kind'); a(k.ok); near(w0 - pr.store.wheat, due.units); a.equal(S.player.cropZ.dues.length, 1); a.equal(S.player.cropZ.hist[0].mode, 'kind'); a.equal(A.cropZakatPay(S, due.id, 'kind').ok, false);
  // نقداً: يُخصم من الرصيد ولا يمس المخزن، ويدخل أثر الزكاة (016)
  const S2 = fresh(); E.cropHarvestZakat(S2, 'cairo', 'wheat', 100, 'well'); const d2 = S2.player.cropZ.dues[0], g0 = S2.player.gold, val = E.cropZakatValue(S2, d2); S2.player.props.cairo.store.wheat = 100;
  a(val > 0); a(A.cropZakatPay(S2, d2.id, 'cash').ok); near(g0 - S2.player.gold, val); near(S2.player.props.cairo.store.wheat, 100); a.equal(A.cropZakatPay(S2, d2.id, 'bad').ok, false);
  // عيناً بلا مخزون كافٍ: يُرفض ولا يتغير شيء
  const S3 = fresh(); E.cropHarvestZakat(S3, 'cairo', 'wheat', 100, 'rain'); const raw = JSON.stringify(S3.player.cropZ); a.equal(A.cropZakatPay(S3, S3.player.cropZ.dues[0].id, 'kind').ok, false); a.equal(JSON.stringify(S3.player.cropZ), raw);
  // رصيد لا يكفي نقداً
  const S4 = fresh(); E.cropHarvestZakat(S4, 'cairo', 'wheat', 100000, 'rain'); S4.player.gold = 0; a.equal(A.cropZakatPay(S4, S4.player.cropZ.dues[0].id, 'cash').ok, false);
}

// 7) الأشجار: أول ثمر بعد مدتها ثم دورياً، وتبقى أصلاً
{
  const S = fresh('riyadh'), pr = S.player.props.riyadh, f = pr.farm; a(A.cropConvert(S, 'riyadh', 0, 'field').ok); a(A.cropSow(S, 'riyadh', 0, 'datepalm', 'well').ok);
  tick(S, 'riyadh', 359); a.equal(A.cropHarvest(S, 'riyadh', 0).ok, false); tick(S, 'riyadh', 1); const r = A.cropHarvest(S, 'riyadh', 0); a(r.ok); a.equal(r.units, E.CROP_DEFS.datepalm.yield);
  a.equal(f.plots[0].crop, 'datepalm', 'الشجرة باقية'); a.equal(f.plots[0].need, 360); a.equal(A.cropHarvest(S, 'riyadh', 0).ok, false); tick(S, 'riyadh', 360); a(A.cropHarvest(S, 'riyadh', 0).ok);
  a(E.farmValue(pr) > 2500 * f.level, 'قيمة الشجر ضمن قيمة المزرعة'); a.equal(A.cropConvert(S, 'riyadh', 0, 'pasture').ok, false);
  const S2 = fresh('jazan'); a(A.cropConvert(S2, 'jazan', 0, 'field').ok); a(A.cropSow(S2, 'jazan', 0, 'coffee', 'rain').ok); tick(S2, 'jazan', 539); a.equal(E.cropRipe(S2.player.props.jazan.farm.plots[0]), false); tick(S2, 'jazan', 1); a(E.cropRipe(S2.player.props.jazan.farm.plots[0]));
  const S3 = fresh('guangzhou'); a(A.cropConvert(S3, 'guangzhou', 0, 'field').ok); a(A.cropSow(S3, 'guangzhou', 0, 'tea', 'rain').ok); tick(S3, 'guangzhou', 540); a(A.cropHarvest(S3, 'guangzhou', 0).ok); tick(S3, 'guangzhou', 180); a(A.cropHarvest(S3, 'guangzhou', 0).ok, 'الشاي كل 180 يوماً');
}

// 8) الحفظ: القديم يعمل، والجديد يُحفظ، والفاسد يُنظَّف
{
  const S = fresh(); const old = JSON.parse(E.save(S)); a.equal(old.player.props.cairo.farm.plots, undefined); a.equal(old.player.cropZ, undefined);
  const L = E.load(JSON.stringify(old)); a(L); a.equal(E.cropPlots(L.player.props.cairo.farm).every(p => p.use === 'pasture'), true); near(E.farmCap(L, 'cairo'), E.farmCap(S, 'cairo'));
  a(A.cropConvert(S, 'cairo', 0, 'field').ok); a(A.cropSow(S, 'cairo', 0, 'wheat', 'river').ok); tick(S, 'cairo', 30); E.cropHarvestZakat(S, 'cairo', 'wheat', 100, 'well');
  const R = E.load(E.save(S)); a.equal(JSON.stringify(R.player.props.cairo.farm.plots), JSON.stringify(S.player.props.cairo.farm.plots)); a.equal(R.player.cropZ.dues.length, 1); near(R.player.cropZ.dues[0].units, 5);
  const bad = JSON.parse(E.save(S)); bad.player.props.cairo.farm.plots = [{ use: 'field', crop: 'wheat', water: 'zzz', grow: 3, need: 100 }, { use: 'bogus' }, null, { use: 'pasture' }];
  bad.player.cropZ.dues.push({ id: 1, city: 'nowhere', g: 'wheat', units: 5, day: 1 }, null); bad.player.cropZ.g.fake = { kg: 1, due: 1, charged: 1 };
  const B = E.load(JSON.stringify(bad)); a(B); a.equal(JSON.stringify(B.player.props.cairo.farm.plots), JSON.stringify([{ use: 'field' }, { use: 'pasture' }]), 'القطعة الفاسدة تعود حقلاً فارغاً'); a.equal(B.player.cropZ.dues.length, 1); a.equal(B.player.cropZ.g.fake, undefined);
  const bad2 = JSON.parse(E.save(S)); bad2.player.props.cairo.farm.plots = 'x'; bad2.player.cropZ = 7; const B2 = E.load(JSON.stringify(bad2)); a(B2); a.equal(B2.player.cropZ, undefined);
  // مفتاح الرجوع: لا ينمو شيء ولا زكاة
  E.CROPS.on = false; const g = S.player.props.cairo.farm.plots[0].grow; tick(S, 'cairo', 5); near(S.player.props.cairo.farm.plots[0].grow, g); a.equal(A.cropHarvest(S, 'cairo', 0).ok, false); a.equal(A.cropZakatPay(S, S.player.cropZ.dues[0].id, 'kind').ok, false); E.CROPS.on = true;
}

// 9) ZC-01 (APPROVED_CROP_TRADE_ZAKAT_2026-11-04.md): المحصول المزكّى عند الحصاد يُعفى من وعاء التجارة حولاً (354 يوماً) من يوم حصاده، بحدود الموجود، والأقدم يُباع أولاً
{
  const val = (S, g, q) => q * E.mid(g), base = S => E.zakatBase(S).store;
  const S = fresh(), pr = S.player.props.cairo; S.zakat = S.zakat || {}; a(A.cropConvert(S, 'cairo', 0, 'field').ok); a(A.cropSow(S, 'cairo', 0, 'wheat', 'river').ok); tick(S, 'cairo', 100);
  const before = base(S); const r = A.cropHarvest(S, 'cairo', 0); a(r.ok); a(r.zakat > 0, 'الحصاد مزكّى');
  const stored = pr.store.wheat; a(stored >= WY); a.equal(JSON.stringify(pr.cropLots.wheat), JSON.stringify([{ day: S.day, q: WY }]), 'تُسجَّل الكمية وتاريخ الحصاد');
  const z0 = E.zakatBase(S); near(z0.cropExempt, val(S, 'wheat', WY)); near(base(S) - before, 0, 'المحصول المزكّى لا يدخل الوعاء، وما كان في المخزن قبله يبقى فيه');
  // خلال سنة الحصاد: معفى؛ ويوم 353 معفى
  S.day += 353 - 0; a(E.zakatBase(S).cropExempt > 0, 'قبل تمام الحول: معفى');
  // بعد الحول الكامل (354 يوماً من الحصاد) يدخل الوعاء
  S.day += 1; near(E.zakatBase(S).cropExempt, 0, 'بعد حول كامل يدخل الوعاء كسائر العروض'); near(base(S) - before, val(S, 'wheat', WY), 'قيمة المحصول كلها في الوعاء');
  // بيعه: ثمنه نقد عادي، والمعفى بحدود الموجود
  const S2 = fresh(), p2 = S2.player.props.cairo; a(A.cropConvert(S2, 'cairo', 0, 'field').ok); a(A.cropSow(S2, 'cairo', 0, 'wheat', 'river').ok); tick(S2, 'cairo', 100); a(A.cropHarvest(S2, 'cairo', 0).ok);
  const have = p2.store.wheat; p2.store.wheat = have - Math.floor(WY / 2); near(E.zakatBase(S2).cropExempt, val(S2, 'wheat', WY - Math.floor(WY / 2)), 'يُعفى بحدود الموجود فعلاً بعد البيع');
  p2.store.wheat = 0; near(E.zakatBase(S2).cropExempt, 0, 'بيعه كله فلا إعفاء'); near(E.zakatBase(S2).store, val(S2, 'oliveoil', 0) + E.valueOf(p2.store), 'الوعاء من المخزون الباقي فقط');
  // الأقدم يُباع أولاً: دفعتان، بيع بقدر الأقدم فتبقى الأحدث معفاة
  const S3 = fresh(), p3 = S3.player.props.cairo; p3.store.wheat = 100; E.cropLotAdd(S3, 'cairo', 'wheat', 1, 60); S3.day = 200; E.cropLotAdd(S3, 'cairo', 'wheat', 200, 40); S3.day = 400;
  near(E.zakatBase(S3).cropExempt, val(S3, 'wheat', 40), 'الدفعة الأولى مضى عليها حول؛ الأحدث معفاة'); p3.store.wheat = 40; near(E.zakatBase(S3).cropExempt, val(S3, 'wheat', 40), 'بيع الأقدم أولاً فتبقى الأحدث'); p3.store.wheat = 25; near(E.zakatBase(S3).cropExempt, val(S3, 'wheat', 25));
  // دون النصاب: لا زكاة حصاد فلا إعفاء؛ ثم يبلغ النصاب بضم حصاد لاحق في السنة فتُعفى الدفعتان
  const S4 = fresh(), p4 = S4.player.props.cairo; p4.store.wheat = 70; a.equal(E.cropHarvestZakat(S4, 'cairo', 'wheat', 40, 'well').due, 0); a.equal(p4.cropLots, undefined, 'دون النصاب: لا إعفاء'); near(E.zakatBase(S4).cropExempt, 0);
  a(E.cropHarvestZakat(S4, 'cairo', 'wheat', 30, 'well').due > 0); near(E.zakatBase(S4).cropExempt, val(S4, 'wheat', 70), 'بلوغ النصاب بالضم يُعفي حصادات السنة');
  // عروض التجارة (قطن وشاي...) لا إعفاء لها: تُزكّى كسائر المخزون
  const S5 = fresh(), p5 = S5.player.props.cairo; p5.store.cotton = 500; E.cropHarvestZakat(S5, 'cairo', 'cotton', 500, 'river'); a.equal(p5.cropLots, undefined); near(E.zakatBase(S5).cropExempt, 0);
  // الإخراج عيناً يقلّل المخزون فيقلّ المعفى بحدود الموجود
  const S6 = fresh(), p6 = S6.player.props.cairo; a(A.cropConvert(S6, 'cairo', 0, 'field').ok); a(A.cropSow(S6, 'cairo', 0, 'wheat', 'river').ok); tick(S6, 'cairo', 100); a(A.cropHarvest(S6, 'cairo', 0).ok); const d6 = S6.player.cropZ.dues[0]; p6.store.wheat = d6.units + 5; a(A.cropZakatPay(S6, d6.id, 'kind').ok); near(E.zakatBase(S6).cropExempt, val(S6, 'wheat', 5));
  // التنظيف اليومي يحذف المنتهي، والمفتاح يعطّل الإعفاء، والحفظ القديم والفاسد
  const S7 = fresh(), p7 = S7.player.props.cairo; p7.store.wheat = 50; S7.day = 1; E.cropLotAdd(S7, 'cairo', 'wheat', 1, 50); S7.day = 400; E.cropDay(S7, 'cairo', p7, S7.cities.cairo); a.equal(p7.cropLots, undefined, 'انتهى الحول فلا حاجة للسجل');
  E.CROPS.on = false; const S8 = fresh(), p8 = S8.player.props.cairo; p8.store.wheat = 50; E.cropLotAdd(S8, 'cairo', 'wheat', 0, 50); near(E.zakatBase(S8).cropExempt, 0, 'المفتاح مطفأ: الوعاء كما كان'); E.CROPS.on = true; near(E.zakatBase(S8).cropExempt, val(S8, 'wheat', 50));
  const raw = JSON.parse(E.save(S8)); raw.player.props.cairo.cropLots = { wheat: [{ day: 0, q: 50 }, { day: 'x', q: 5 }, null, { day: 99999, q: 4 }], fake: [{ day: 0, q: 1 }] }; const L = E.load(JSON.stringify(raw)); a.equal(JSON.stringify(L.player.props.cairo.cropLots), JSON.stringify({ wheat: [{ day: 0, q: 50 }] }));
  raw.player.props.cairo.cropLots = 5; a.equal(E.load(JSON.stringify(raw)).player.props.cairo.cropLots, undefined); const old = JSON.parse(E.save(fresh())); a.equal(old.player.props.cairo.cropLots, undefined); a(E.load(JSON.stringify(old)));
  // كل ذلك لا يغيّر زكاة سلعة غير المحصول: وعاء التجارة بلا محاصيل مطابق لما قبل
  const S9 = fresh(); S9.player.props.cairo.store.salt = 100; near(E.zakatBase(S9).cropExempt, 0);
}
console.log('PASS crops: plots/cap/farmers, sow/fit/water, growth/harvest/rot/store, zakat rates 10/5/7.5/river, nisab 612, no cross-genus, yearly pooling, olive x5, trade crops exempt, kind/cash payout, trees, old save, off switch, ZC-01 harvest-zakat crop exempt from trade zakat for one hawl');
