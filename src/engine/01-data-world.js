/* ---------- الدول ---------- */
const COUNTRIES = [
  { id: 'sa', name: 'السعودية', flag: '🇸🇦', color: '#2f8a4f', customs: 0.05, cx: 400, cy: 400, mapLabel: [398, 400] },
  { id: 'eg', name: 'مصر', flag: '🇪🇬', color: '#c9a050', customs: 0.06, cx: 180, cy: 260, mapLabel: [70, 365] },
  { id: 'ir', name: 'فارس', flag: '🇮🇷', color: '#6a5acd', customs: 0.07, cx: 550, cy: 230, mapLabel: [470, 170] },
  { id: 'in', name: 'الهند', flag: '🇮🇳', color: '#e07a2f', customs: 0.08, cx: 730, cy: 350, mapLabel: [685, 430] },
  { id: 'cn', name: 'الصين', flag: '🇨🇳', color: '#c0392b', customs: 0.08, cx: 870, cy: 230, mapLabel: [875, 365] },
];
const CD = {}; COUNTRIES.forEach(c => CD[c.id] = c);
const ADJ = { sa: ['eg', 'ir', 'in'], eg: ['sa'], ir: ['sa', 'in', 'cn'], in: ['sa', 'ir', 'cn'], cn: ['ir', 'in'] };
// 0 = نفس الدولة، 1 = جارة، 2 = بعيدة
function cdist(a, b) { if (a === b) return 0; if (ADJ[a].includes(b)) return 1; return 2; }

/* ---------- السلع: طبقات (خام/تخصصية/مصنّعة)، وطبقات الطلب [الكل، فقير، ثري، نخبة] ---------- */
const mk = (id, name, icon, pmin, pmax, w, spoil, depth, tier, org, d, extra) => Object.assign({ id, name, icon, pmin, pmax, w, spoil, depth, tier, org: org || null, d }, extra || {});
const GOODS = [
  mk('wheat', 'قمح', '🌾', 8, 30, 1, 0.004, 1, 'raw', null, { all: 0.012 }, { ess: true }),
  mk('wood', 'خشب', '🪵', 10, 36, 2, 0, 1, 'raw', null, { all: 0.003 }),
  mk('iron', 'حديد خام', '⛏️', 14, 50, 3, 0, 1, 'raw', null, { all: 0.002 }),
  mk('wool', 'صوف', '🐑', 12, 42, 1, 0.003, 1, 'raw', null, { all: 0.002 }),
  mk('cotton', 'قطن', '☁️', 12, 40, 1, 0.001, 1, 'raw', null, { all: 0.002 }),
  mk('dates', 'تمر', '🌴', 18, 60, 1, 0.004, 1, 'spec', ['sa'], { r: 0.012, e: 0.02 }, { lux: 1 }),
  mk('coffee', 'قهوة', '☕', 40, 130, 1, 0.002, 0.7, 'spec', ['sa'], { r: 0.008, e: 0.02 }, { lux: 1 }),
  mk('incense', 'بخور', '🪔', 50, 150, 1, 0, 0.5, 'spec', ['sa'], { r: 0.004, e: 0.012 }, { lux: 1 }),
  mk('pearls', 'لؤلؤ', '🦪', 120, 350, 0.5, 0, 0.25, 'spec', ['sa'], { r: 0.0008, e: 0.004 }, { lux: 1 }),
  mk('papyrus', 'ورق بردي', '📜', 25, 80, 1, 0.001, 0.8, 'spec', ['eg'], { r: 0.003, e: 0.006 }, { lux: 1 }),
  mk('glass', 'زجاج', '🔮', 30, 95, 2, 0, 0.7, 'spec', ['eg'], { r: 0.003, e: 0.006 }, { lux: 1 }),
  mk('saffron', 'زعفران', '🌺', 100, 300, 0.5, 0.001, 0.35, 'spec', ['ir'], { r: 0.0015, e: 0.005 }, { lux: 1 }),
  mk('turquoise', 'فيروز', '💎', 80, 240, 0.5, 0, 0.4, 'spec', ['ir'], { r: 0.001, e: 0.004 }, { lux: 1 }),
  mk('spice', 'توابل', '🌶️', 35, 110, 1, 0.002, 0.8, 'spec', ['in'], { p: 0.002, r: 0.006, e: 0.01 }),
  mk('gems', 'أحجار كريمة', '💠', 150, 450, 0.5, 0, 0.2, 'spec', ['in'], { r: 0.0006, e: 0.003 }, { lux: 1 }),
  mk('silk', 'حرير', '🎀', 90, 260, 1, 0, 0.35, 'spec', ['cn'], { r: 0.002, e: 0.008 }, { lux: 1 }),
  mk('tea', 'شاي', '🍵', 30, 95, 1, 0.002, 0.8, 'spec', ['cn'], { p: 0.002, r: 0.006, e: 0.012 }),
  mk('porcelain', 'خزف', '🏺', 60, 180, 2, 0, 0.5, 'spec', ['cn'], { r: 0.003, e: 0.007 }, { lux: 1 }),
  mk('perfume', 'عطور', '🧴', 80, 240, 0.5, 0, 0.5, 'proc', ['sa'], { r: 0.003, e: 0.008 }, { lux: 1 }),
  mk('textile', 'نسيج', '🧵', 35, 110, 1, 0, 0.8, 'proc', ['eg'], { p: 0.002, r: 0.006, e: 0.012 }),
  mk('carpet', 'سجاد', '🧶', 90, 260, 2, 0, 0.35, 'proc', ['ir'], { r: 0.0015, e: 0.005 }, { lux: 1 }),
  mk('jewelry', 'مجوهرات', '💍', 200, 700, 0.5, 0, 0.2, 'proc', ['in'], { r: 0.0006, e: 0.003 }, { lux: 1 }),
  mk('tools', 'أدوات', '🛠️', 30, 100, 2, 0, 0.8, 'proc', ['cn'], { p: 0.003, r: 0.002, e: 0.002 }),
  // غذاء وخامات وسلع يومية (v0.8)
  mk('salt', 'ملح', '🧂', 6, 22, 1.5, 0, 1, 'raw', null, { all: 0.002 }),
  mk('rice', 'أرز', '🍚', 10, 34, 1, 0.002, 1, 'spec', ['in', 'cn'], { all: 0.006 }),
  mk('sugar', 'سكر', '🍬', 25, 80, 1, 0.001, 0.8, 'spec', ['eg', 'in'], { p: 0.002, r: 0.006, e: 0.008 }),
  mk('honey', 'عسل', '🍯', 40, 130, 1, 0, 0.5, 'spec', ['sa'], { r: 0.004, e: 0.01 }, { lux: 1 }),
  mk('oliveoil', 'زيت زيتون', '🫒', 30, 95, 1.5, 0.001, 0.7, 'spec', ['eg'], { p: 0.001, r: 0.004, e: 0.008 }),
  mk('driedfish', 'سمك مجفف', '🐟', 14, 45, 1, 0.002, 0.9, 'spec', ['sa', 'cn'], { all: 0.003, p: 0.002 }),
  mk('leather', 'جلود', '👜', 28, 90, 1.5, 0.001, 0.7, 'spec', ['sa', 'ir'], { p: 0.001, r: 0.003, e: 0.005 }),
  mk('cheese', 'جبن ولبن مجفف', '🧀', 24, 75, 1, 0.006, 0.8, 'spec', ['sa', 'eg'], { all: 0.002, r: 0.003 }),
  mk('raisins', 'زبيب وفواكه مجففة', '🍇', 22, 70, 1, 0.002, 0.8, 'spec', ['ir'], { p: 0.001, r: 0.004, e: 0.006 }),
  mk('paper', 'ورق', '📄', 30, 100, 1, 0.001, 0.7, 'spec', ['cn'], { r: 0.003, e: 0.006 }, { lux: 1 }),
  mk('soap', 'صابون', '🧼', 24, 80, 1, 0, 0.8, 'proc', ['eg'], { all: 0.001, r: 0.003 }),
  mk('herbs', 'أعشاب طبية', '🌿', 40, 140, 0.5, 0.002, 0.5, 'spec', ['in', 'sa'], { r: 0.003, e: 0.008 }, { lux: 1 }),
  mk('jerky', 'لحم مجفف', '🥩', 30, 95, 1, 0.001, 0.6, 'proc', ['sa', 'ir'], { p: 0.001, r: 0.004, e: 0.006 }),
  mk('eggs', 'بيض', '🥚', 12, 38, 1, 0.01, 1, 'spec', ['eg', 'cn'], { all: 0.003 }),
  // مواشٍ حيّة: السعر للرأس، العلف قمح يومياً للرأس (يدخل في مؤن الرحلة)، والنفوق = spoil، ووحدة القطيع hu (لا قطيع للدواجن)
  mk('chicken', 'دجاج', '🐔', 5, 16, 0.2, 0.015, 1.5, 'live', ['eg', 'cn'], { all: 0.004 }, { live: 1, fod: 0.04, hu: 0 }),
  mk('duck', 'بط', '🦆', 6, 18, 0.2, 0.015, 1, 'live', ['cn'], { all: 0.002 }, { live: 1, fod: 0.04, hu: 0 }),
  mk('sheep', 'غنم', '🐏', 60, 170, 1, 0.002, 0.5, 'live', ['sa', 'ir'], { p: 0.0008, r: 0.001 }, { live: 1, fod: 0.12, hu: 1 }),
  mk('goat', 'ماعز', '🐐', 50, 150, 1, 0.002, 0.4, 'live', ['sa', 'in', 'cn'], { p: 0.0006, r: 0.001 }, { live: 1, fod: 0.1, hu: 1 }),
  mk('cow', 'بقر', '🐄', 180, 480, 3, 0.003, 0.15, 'live', ['eg', 'ir', 'sa', 'cn'], { r: 0.0008, e: 0.001 }, { live: 1, fod: 0.45, hu: 2 }),
  mk('buffalo', 'جاموس', '🐃', 200, 520, 3, 0.003, 0.12, 'live', ['in', 'eg'], { r: 0.0007, e: 0.001 }, { live: 1, fod: 0.5, hu: 2 }),
  mk('camel', 'جمال', '🐫', 300, 800, 3, 0.002, 0.1, 'live', ['sa'], { r: 0.0005, e: 0.0012 }, { live: 1, fod: 0.35, hu: 2 }),
  mk('horse', 'خيل', '🐎', 500, 1500, 3, 0.004, 0.05, 'live', ['sa', 'ir'], { e: 0.0015, r: 0.0003 }, { live: 1, fod: 0.6, hu: 2 }),
  // لحم طازج: يخرج من ملحمة صاحب المزرعة، يفسد بسرعة (12٪ يومياً) فيُباع في يومه (v0.10)
  mk('meat', 'لحم طازج', '🍖', 14, 46, 1, 0.12, 0.8, 'proc', null, { all: 0.008, r: 0.003, e: 0.004 }, { fresh: 1 }),
];
/* أصناف المواشي: كل صنف سلعة مستقلة (sp = نوعه). السمات 1–5 بالترتيب [لحم، لبن/بيض، صوف، سرعة، تحمّل، خصوبة]، والمتوسط 3. تتحوّل السمات إلى آثار عند التوليد: تحمّل ← نفوق، خصوبة ← حجم الولادة، لحم/لبن/صوف ← غلّة المزرعة والذبح.
   الفتح: 0 مبتدئ (من البداية)، 1 متوسط (مستوى التعلّم 4)، 2 متقدم (مستوى 7). النوع نفسه (غنم، خيل…) هو الصنف البلدي المتاح دائماً. */
const BR_KEYS = ['meat', 'milk', 'wool', 'speed', 'endu', 'fert'], BR_LV = [1, 4, 7];
const BREEDS = [
  ['najdi', 'sheep', 'غنم نجدي', 1.15, 0, ['sa'], ['riyadh', 'hail'], [4, 2, 3, 2, 4, 3]],
  ['rahmani', 'sheep', 'غنم رحماني', 1.1, 0, ['eg'], ['cairo', 'aswan'], [3, 3, 3, 2, 3, 5]],
  ['karakul', 'sheep', 'غنم قره قل', 1.25, 1, ['ir'], ['tabriz', 'shiraz'], [2, 2, 5, 2, 4, 3]],
  ['marwari', 'sheep', 'غنم مروادي', 0.9, 1, ['in'], ['delhi'], [3, 2, 3, 2, 5, 3]],
  ['hu', 'sheep', 'غنم هو', 1.3, 1, ['cn'], ['shanghai', 'xian'], [3, 2, 2, 2, 2, 5]],
  ['naeemi', 'sheep', 'غنم نعيمي', 1.5, 2, ['sa'], ['riyadh', 'hail'], [5, 2, 3, 2, 3, 3]],
  ['harri', 'sheep', 'غنم حري', 1.3, 2, ['sa'], ['hail'], [4, 3, 3, 2, 4, 3]],
  ['ossimi', 'sheep', 'غنم عوسيمي', 1.4, 2, ['eg'], ['cairo'], [4, 2, 5, 2, 3, 3]],
  ['barki', 'sheep', 'غنم برقي', 1.0, 2, ['eg'], ['aswan'], [3, 2, 3, 2, 5, 3]],
  ['tan', 'sheep', 'غنم تان', 1.6, 2, ['cn'], ['xian'], [4, 2, 5, 2, 3, 3]],
  ['jabali', 'goat', 'ماعز جبلي', 1.1, 0, ['sa'], ['jazan'], [3, 3, 3, 3, 5, 3]],
  ['aardi', 'goat', 'ماعز عاردي', 1.15, 0, ['sa'], ['riyadh', 'hail'], [3, 4, 4, 3, 4, 3]],
  ['jamnapari', 'goat', 'ماعز جمناباري', 1.3, 1, ['in'], ['delhi'], [4, 5, 2, 3, 3, 3]],
  ['kashmiri', 'goat', 'ماعز كشميري', 1.6, 2, ['in'], ['delhi'], [2, 3, 5, 2, 4, 2]],
  ['liaoning', 'goat', 'ماعز لياونينغ', 1.5, 2, ['cn'], ['guangzhou'], [3, 3, 5, 2, 3, 3]],
  ['fayoumi', 'chicken', 'دجاج فيومي', 1.15, 0, ['eg'], ['cairo'], [2, 4, 1, 3, 4, 4]],
  ['silkie', 'chicken', 'دجاج سيلكي', 1.4, 1, ['cn'], ['guangzhou'], [2, 3, 1, 2, 3, 4]],
  ['aseel', 'chicken', 'ديك أصيل', 1.7, 2, ['in'], ['kolkata'], [5, 2, 1, 3, 4, 2]],
  ['duck_pekin', 'duck', 'بط بكين', 1.2, 0, ['cn'], ['shanghai', 'guangzhou'], [4, 4, 1, 3, 3, 4]],
  ['cow_sistani', 'cow', 'بقر سيستاني', 1.1, 0, ['ir'], ['shiraz'], [3, 3, 1, 3, 5, 3]],
  ['cow_yellow', 'cow', 'ثور أصفر صيني', 1.15, 0, ['cn'], ['xian'], [4, 2, 1, 3, 4, 3]],
  ['cow_domiati', 'cow', 'بقر دمياطي', 1.3, 1, ['eg'], ['cairo', 'alex'], [3, 5, 1, 3, 3, 3]],
  ['cow_mazandarani', 'cow', 'بقر مازندراني', 1.2, 1, ['ir'], ['tabriz'], [3, 4, 1, 3, 4, 3]],
  ['buf_egypt', 'buffalo', 'جاموس مصري', 1.1, 0, ['eg'], ['aswan', 'cairo'], [3, 5, 1, 2, 3, 3]],
  ['buf_murrah', 'buffalo', 'جاموس مرّة', 1.5, 1, ['in'], ['delhi', 'kolkata'], [4, 5, 1, 2, 3, 3]],
  ['majaheem', 'camel', 'جمل مجاهيم', 1.3, 0, ['sa'], ['riyadh'], [5, 3, 1, 3, 5, 2]],
  ['safar', 'camel', 'جمل صفر', 1.2, 0, ['sa'], ['hail'], [3, 3, 1, 4, 4, 3]],
  ['humr', 'camel', 'جمل حمر', 1.3, 1, ['sa'], ['hail'], [3, 4, 1, 4, 4, 3]],
  ['shaele', 'camel', 'جمل شعل (سباق)', 1.9, 2, ['sa'], ['riyadh'], [2, 2, 1, 5, 4, 2]],
  ['wadh', 'camel', 'جمل وضح', 2.2, 2, ['sa'], ['riyadh'], [3, 3, 1, 4, 3, 2]],
  ['arab_kuhaylan', 'horse', 'فرس عربي كحيلان', 1.7, 0, ['sa'], ['riyadh'], [2, 1, 1, 4, 5, 3]],
  ['mongolian', 'horse', 'خيل منغولي', 0.6, 0, ['cn'], ['xian'], [3, 1, 1, 3, 5, 4]],
  ['akhal_teke', 'horse', 'خيل أخال تكه', 1.9, 1, ['ir'], ['isfahan'], [2, 1, 1, 5, 3, 2]],
  ['kurdish', 'horse', 'خيل كردي', 1.0, 1, ['ir'], ['tabriz'], [3, 1, 1, 3, 4, 3]],
  ['arab_saqlawi', 'horse', 'فرس عربي صقلاوي', 2.0, 2, ['sa'], ['hail'], [2, 1, 1, 5, 5, 2]],
  ['ili', 'horse', 'خيل إيلي', 1.1, 2, ['cn'], ['xian'], [3, 1, 1, 3, 4, 3]],
].map(([id, sp, name, pf, tier, org, at, t]) => ({ id, sp, name, pf, tier, org, at, tr: BR_KEYS.reduce((o, k, i) => (o[k] = t[i], o), {}) }));
BREEDS.forEach(b => {
  const S0 = GOODS.find(x => x.id === b.sp), r = v => Math.round(v * 10) / 10, d = {};
  for (const k in S0.d) d[k] = S0.d[k] * 0.5;
  GOODS.push(mk(b.id, b.name, S0.icon, r(S0.pmin * b.pf), r(S0.pmax * b.pf), S0.w, S0.spoil * (1.3 - 0.1 * b.tr.endu), S0.depth * 0.6, 'live', b.org, d, { live: 1, fod: S0.fod, hu: S0.hu, sp: b.sp, br: b, lv: BR_LV[b.tier], pf: b.pf }));
});
/* الهجن: لكل نوع سلعة «هجين» واحدة لا تُشترى من الأسواق؛ تنتج من تلقيح ذكر صنف لأنثى صنف آخر من النوع نفسه. سماتها وسعرها في حيازة اللاعب (hx[g].tr وhx[g].pf) = متوسط الأبوين مع «قوة الهجين» (+0.5 تحمّل وخصوبة، +5٪ سعراً) */
const HYB_NAMES = { sheep: 'غنم هجين', goat: 'ماعز هجين', cow: 'بقر هجين', buffalo: 'جاموس هجين', camel: 'جمل هجين', horse: 'خيل هجين', chicken: 'دجاج هجين', duck: 'بط هجين' };
for (const sp in HYB_NAMES) {
  const S0 = GOODS.find(x => x.id === sp), d = {}; for (const k in S0.d) d[k] = S0.d[k] * 0.5;
  GOODS.push(mk(sp + '_h', HYB_NAMES[sp], S0.icon, S0.pmin, S0.pmax, S0.w, S0.spoil, S0.depth * 0.6, 'live', S0.org, d, { live: 1, fod: S0.fod, hu: S0.hu, sp, hyb: 1 }));
}
const GD = {}; GOODS.forEach(g => {
  GD[g.id] = g; g.cult = {};
  COUNTRIES.forEach(c => { g.cult[c.id] = !g.org ? 1 : g.org.includes(c.id) ? 0.85 : g.org.some(o => ADJ[o].includes(c.id)) ? 1.1 : 1.25; });
});
const GIDS = GOODS.map(g => g.id);
// مضاعفات الميزات (الشخصيات والمستويات) — افتراضياً 1
const perkMul = (S, key) => (S.learn && S.learn.perks && S.learn.perks[key]) || 1;
// ما تبيعه المدينة للاعب: ما تنتجه فقط + القمح (مؤن). لكل مدينة «منتج خاص» (sig) لا تنتجه غيرها، فيرخص عندها ويغلو في بقية الأسواق بحسب ظرف السوق. البيع للمدينة مسموح لأي سلعة (الطلب موجود)
const sells = (c, g) => g === 'wheat' || c.makes.includes(g);
// أين تُشترى سلعة؟ (مدن تبيعها)
const soldAt = (S, g) => S.order.filter(id => sells(S.cities[id], g));

// أداة كل دولة: وصفة تصنيع لا تُبنى إلا فيها
const RECIPES = {
  perfume: { name: 'مصنع عطور', country: 'sa', inp: { incense: 2, wood: 1 }, out: 'perfume', n: 2, wage: 14 },
  textile: { name: 'معمل نسيج', country: 'eg', inp: { cotton: 4 }, out: 'textile', n: 2, wage: 12 },
  carpet: { name: 'مشغل سجاد', country: 'ir', inp: { wool: 5 }, out: 'carpet', n: 1, wage: 14 },
  jewelry: { name: 'مشغل مجوهرات', country: 'in', inp: { gems: 2, iron: 1 }, out: 'jewelry', n: 2, wage: 18 },
  tools: { name: 'ورشة أدوات', country: 'cn', inp: { iron: 2, wood: 1 }, out: 'tools', n: 2, wage: 12 },
};

/* مصانع التاجر الكبير (الطور 3): 18 سلعة تُصنَّع. الأصلية الخمس (RECIPES الأولى) محلية في دولتها بجودة كاملة. وأي سلعة منها تُبنى لها ورشة «غير محلية» في مدينة لا تنتجها بجودة 35–80٪ بحسب سمعة التاجر،
   تكلفة بنائها 8000/12000/18000 بحسب غلاء السلعة، ومواد أولية ≈ 18٪ من قيمة الدفعة. الجودة تضرب السعر، والكمية = الإنتاج × (50٪ + نصف الجودة). */
for (const k in RECIPES) RECIPES[k].old = true;
const MFG_IN = { silk: ['cotton', 'wood'], porcelain: ['wood', 'salt'], glass: ['wood', 'salt'], papyrus: ['cotton', 'wood'], paper: ['cotton', 'wood'], soap: ['salt', 'wood'], leather: ['salt', 'wood'], sugar: ['wheat', 'wood'], oliveoil: ['wheat', 'salt'], tea: ['wheat', 'wood'], cheese: ['wheat', 'salt'], raisins: ['wheat', 'salt'], jerky: ['wheat', 'salt'] };
const MFG_NAME = { silk: 'مشغل حرير', porcelain: 'فرن خزف', glass: 'معمل زجاج', papyrus: 'مشغل ورق بردي', paper: 'مصنع ورق', soap: 'معمل صابون', leather: 'مدبغة', sugar: 'معصرة سكر', oliveoil: 'معصرة زيتون', tea: 'مصنع شاي', cheese: 'معمل ألبان', raisins: 'مجفّف فواكه', jerky: 'مجفّف لحوم' };
const MFG_HOME = { silk: 'cn', porcelain: 'cn', glass: 'eg', papyrus: 'eg', paper: 'cn', soap: 'eg', leather: 'sa', sugar: 'eg', oliveoil: 'eg', tea: 'cn', cheese: 'sa', raisins: 'ir', jerky: 'sa' };
const MFG_MATERIAL_SHARE = 0.18;
const MFG_COST = g => { const m = (GD[g].pmin + GD[g].pmax) / 2; return m < 60 ? 8000 : m < 150 ? 12000 : 18000; };
function mfgBuild() {
  for (const g in MFG_IN) {
    const G = GD[g], m = (G.pmin + G.pmax) / 2, n = Math.max(1, Math.min(6, Math.round(150 / m))), V = n * m, inp = {};
    const ins = MFG_IN[g], mid1 = x => (GD[x].pmin + GD[x].pmax) / 2;
    let pair = ins.map(x => Math.max(1, Math.round(MFG_MATERIAL_SHARE * V / 2 / mid1(x))));
    const val = a => a.reduce((t, q, i) => t + q * mid1(ins[i]), 0);
    if (val(pair) > MFG_MATERIAL_SHARE * V * 1.45) pair = [Math.max(1, Math.round(MFG_MATERIAL_SHARE * V / mid1(ins[0]))), 0];
    ins.forEach((x, i) => { if (pair[i] > 0) inp[x] = pair[i]; });
    RECIPES[g] = { name: MFG_NAME[g], country: MFG_HOME[g], inp, out: g, n, wage: Math.round(6 + 0.02 * 4 * V), old: false };
  }
}
mfgBuild();
const CITY_DEFS = [
  { id: 'riyadh', name: 'الرياض', country: 'sa', x: 334, y: 306, size: 1.3, tax: 0.06, sig: 'perfume', makes: ['wheat', 'perfume', 'wool', 'coffee', 'herbs', 'camel', 'horse', 'sheep'] },
  { id: 'jeddah', name: 'جدة', country: 'sa', x: 242, y: 345, size: 1.4, tax: 0.07, sig: 'pearls', makes: ['pearls', 'coffee', 'cotton', 'salt', 'driedfish', 'goat'] },
  { id: 'hail', name: 'حائل', country: 'sa', x: 278, y: 261, size: 0.9, tax: 0.03, sig: 'dates', makes: ['wheat', 'wool', 'iron', 'dates', 'leather', 'cheese', 'jerky', 'camel', 'horse', 'sheep'] },
  { id: 'jazan', name: 'جازان', country: 'sa', x: 289, y: 408, size: 1.0, tax: 0.04, sig: 'incense', makes: ['incense', 'coffee', 'wood', 'honey', 'goat', 'cow'] },
  { id: 'cairo', name: 'القاهرة', country: 'eg', x: 129, y: 202, size: 1.5, tax: 0.06, sig: 'textile', makes: ['wheat', 'textile', 'cotton', 'sugar', 'eggs', 'cow', 'buffalo', 'chicken'] },
  { id: 'alex', name: 'الإسكندرية', country: 'eg', x: 115, y: 177, size: 1.2, tax: 0.05, sig: 'glass', makes: ['cotton', 'glass', 'wheat', 'salt', 'oliveoil', 'soap', 'chicken', 'cow'] },
  { id: 'aswan', name: 'أسوان', country: 'eg', x: 152, y: 302, size: 0.8, tax: 0.03, sig: 'papyrus', makes: ['cotton', 'papyrus', 'wood', 'cheese', 'buffalo', 'goat', 'chicken'] },
  { id: 'isfahan', name: 'أصفهان', country: 'ir', x: 402, y: 191, size: 1.2, tax: 0.06, sig: 'carpet', makes: ['carpet', 'wool', 'iron', 'jerky', 'horse', 'sheep', 'cow'] },
  { id: 'shiraz', name: 'شيراز', country: 'ir', x: 408, y: 237, size: 1.0, tax: 0.04, sig: 'turquoise', makes: ['turquoise', 'wool', 'wheat', 'raisins', 'sheep', 'cow'] },
  { id: 'tabriz', name: 'تبريز', country: 'ir', x: 350, y: 119, size: 0.9, tax: 0.04, sig: 'saffron', makes: ['iron', 'wool', 'saffron', 'leather', 'raisins', 'horse', 'sheep'] },
  { id: 'delhi', name: 'دلهي', country: 'in', x: 644, y: 261, size: 1.5, tax: 0.07, sig: 'jewelry', makes: ['jewelry', 'wheat', 'cotton', 'herbs', 'buffalo', 'goat'] },
  { id: 'mumbai', name: 'بومباي', country: 'in', x: 612, y: 375, size: 1.3, tax: 0.06, sig: 'gems', makes: ['gems', 'cotton', 'wood', 'salt', 'goat'] },
  { id: 'kolkata', name: 'كلكتا', country: 'in', x: 742, y: 334, size: 1.1, tax: 0.05, sig: 'spice', makes: ['spice', 'cotton', 'wheat', 'sugar', 'rice', 'buffalo', 'goat', 'chicken'] },
  { id: 'xian', name: 'شيآن', country: 'cn', x: 885, y: 191, size: 1.3, tax: 0.06, sig: 'silk', makes: ['silk', 'iron', 'tools', 'paper', 'horse', 'sheep', 'cow'] },
  { id: 'guangzhou', name: 'كانتون', country: 'cn', x: 930, y: 320, size: 1.3, tax: 0.07, sig: 'tea', makes: ['tea', 'wood', 'wool', 'rice', 'eggs', 'duck', 'chicken', 'goat'] },
  { id: 'shanghai', name: 'شنغهاي', country: 'cn', x: 958, y: 216, size: 1.5, tax: 0.07, sig: 'porcelain', makes: ['porcelain', 'tools', 'wood', 'driedfish', 'duck', 'chicken', 'cow'] },
];
BREEDS.forEach(b => b.at.forEach(id => CITY_DEFS.find(d => d.id === id).makes.push(b.id)));
const START_CITY = 'riyadh', HOME = 'sa';
const START_OF = { sa: 'riyadh', eg: 'cairo', ir: 'isfahan', in: 'delhi', cn: 'xian' };
const CURS = { sar: { id: 'sar', name: 'ريال', sym: 'ر.س', icon: '🇸🇦' }, usd: { id: 'usd', name: 'دولار', sym: '$', icon: '💵' }, au: { id: 'au', name: 'ذهب', sym: 'غ', icon: '🥇' } };
const curOf = country => (country === 'sa' ? 'sar' : 'usd');
const FX0 = { usd: 3.75, gold: 300 };
function rateOf(S, cur) { return cur === 'sar' ? 1 : cur === 'usd' ? S.fx.usd : S.fx.gold; }
const feeOf = (a, b) => (a === 'au' || b === 'au' ? 0.015 : 0.01);
const liquid = S => { const w = S.player.wallet; return w.sar + w.usd * S.fx.usd + w.au * S.fx.gold; };
// P.gold = مجموع الريال المعادل للمحافظ. القراءة تجمع، والكتابة تُطبَّق كفرق على المحافظ (تحويل تلقائي برسم)
function applyDelta(S, d) {
  const w = S.player.wallet, cx = S.ctxCur || 'sar';
  if (d >= 0) { w[cx] += d / rateOf(S, cx); return; }
  let need = -d; const order = [cx].concat(['sar', 'usd', 'au'].filter(c => c !== cx));
  for (const cur of order) {
    if (need <= 1e-9) break;
    const r = rateOf(S, cur), avail = w[cur] * r;
    if (avail <= 0) continue;
    if (cur === cx) { const use = Math.min(avail, need); w[cur] -= use / r; need -= use; }
    else {
      const fee = feeOf(cur, cx) + 0.005, take = Math.min(avail, need * (1 + fee)), covered = take / (1 + fee);
      w[cur] -= take / r; need -= covered;
      const f = take - covered; if (f > 0) { sink(S, 'exchange', f); S.player.led.exp.exchange = (S.player.led.exp.exchange || 0) + f; }
    }
  }
}
function attachWallet(S) {
  Object.defineProperty(S.player, 'gold', { configurable: true, enumerable: false, get() { return liquid(S); }, set(v) { applyDelta(S, v - liquid(S)); } });
}
const PHASE_AT = [0, 5000, 20000, 60000];
const TITLES = [[0, 'تاجر متجول'], [5000, 'وكيل تجاري'], [20000, 'صاحب مصانع'], [60000, 'مصرفي وحاكم'], [200000, 'سيّد السوق'], [500000, 'شيخ التجّار'], [1500000, 'عميد الأسواق'], [5000000, 'سلطان الدروب']];
const SPEED = 60; // وحدة/يوم (الإحداثيات تطابق الخريطة المرسومة؛ المتوسط العام للرحلات كما كان)

