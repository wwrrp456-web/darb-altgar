/* درب التجّار v0.2 — محرك المحاكاة (بلا واجهة، يعمل في المتصفح وفي Node).
   كل الحالة بيانات خام قابلة للحفظ JSON. الأرقام والصيغ في DESIGN.md */
(function (root) {
'use strict';

const VER = 3;
const LS = (typeof module !== 'undefined' && module.exports) ? require('./lessons.js') : root.Lessons;
const BAB = (typeof module !== 'undefined' && module.exports) ? require('./babylon.js') : root.Babylon;
const LORE = (typeof module !== 'undefined' && module.exports) ? require('./lore.js') : root.Lore;
const ACHD = (typeof module !== 'undefined' && module.exports) ? require('./achievements.js') : root.Achievements;
const CARDS = (typeof module !== 'undefined' && module.exports) ? require('./cards.js') : root.Cards;
const DLG = (typeof module !== 'undefined' && module.exports) ? require('./dialogs.js') : root.Dialogs;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
const CURS = { sar: { id: 'sar', name: 'ريال', sym: 'ر.س', icon: '🇸🇦' }, usd: { id: 'usd', name: 'دولار', sym: '$', icon: '💵' }, au: { id: 'au', name: 'ذهب', sym: 'غ', icon: '🥇' }, ag: { id: 'ag', name: 'فضة', sym: 'غ', icon: '🥈' } };
const curOf = country => (country === 'sa' ? 'sar' : 'usd');
const FX0 = { usd: 3.75, gold: 300 };
/* نسبة الذهب إلى الفضة تتبدّل ببطء دون عشوائية (حتى لا تتغير متتالية العشوائية العامة): سعر الفضة = سعر الذهب ÷ النسبة */
const goldSilverRatio = day => 85 + 12 * Math.sin(day / 110) + 4 * Math.sin(day / 29);
const silverAt = (gold, day) => gold / goldSilverRatio(day);
function rateOf(S, cur) { return cur === 'sar' ? 1 : cur === 'usd' ? S.fx.usd : cur === 'ag' ? (S.fx.silver || silverAt(S.fx.gold, S.day)) : S.fx.gold; }
/* عملات الدول (للعرض والتعلّم فقط): سعر الصرف مقابل الريال يتحرك ببطء وبلا عشوائية (لا يمسّ متتالية العشوائية العامة). المحافظ تبقى: ريال ودولار وذهب وفضة. */
const LOCAL = {
  sa: { id: 'sar', name: 'الريال السعودي', unit: 'ريال', base: 1, phi: 0 },
  eg: { id: 'egp', name: 'الجنيه المصري', unit: 'جنيه', base: 13.2, phi: 1.3 },
  ir: { id: 'irr', name: 'الريال الإيراني', unit: 'ريال إيراني', base: 11000, phi: 2.1 },
  in: { id: 'inr', name: 'الروبية الهندية', unit: 'روبية', base: 23.5, phi: 0.7 },
  cn: { id: 'cny', name: 'اليوان الصيني', unit: 'يوان', base: 1.95, phi: 3.4 }
};
function localRate(S, country) { const L = LOCAL[country]; if (!L || country === 'sa') return 1; const d = S.day; return L.base * (1 + 0.045 * Math.sin(d / 53 + L.phi) + 0.02 * Math.sin(d / 17 + 2 * L.phi)); }
const feeOf = (a, b) => (a === 'au' || b === 'au' || a === 'ag' || b === 'ag' ? 0.015 : 0.01);
const liquid = S => { const w = S.player.wallet; return w.sar + w.usd * S.fx.usd + w.au * S.fx.gold + (w.ag || 0) * rateOf(S, 'ag'); };
// P.gold = مجموع الريال المعادل للمحافظ. القراءة تجمع، والكتابة تُطبَّق كفرق على المحافظ (تحويل تلقائي برسم)
function applyDelta(S, d) {
  const w = S.player.wallet, cx = S.ctxCur || 'sar';
  if (d >= 0) { w[cx] += d / rateOf(S, cx); return; }
  let need = -d; const order = [cx].concat(['sar', 'usd', 'au', 'ag'].filter(c => c !== cx));
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
  if (S.player.wallet && S.player.wallet.ag == null) S.player.wallet.ag = 0; if (S.fx && S.fx.silver == null) { S.fx.silver = +silverAt(S.fx.gold, S.day).toFixed(3); S.fx.hs = S.fx.hs || [S.fx.silver]; }
  Object.defineProperty(S.player, 'gold', { configurable: true, enumerable: false, get() { return liquid(S); }, set(v) { applyDelta(S, v - liquid(S)); } });
}
const PHASE_AT = [0, 5000, 20000, 60000];
const TITLES = [[0, 'تاجر متجول'], [5000, 'وكيل تجاري'], [20000, 'صاحب مصانع'], [60000, 'مصرفي وحاكم'], [200000, 'سيّد السوق'], [500000, 'شيخ التجّار'], [1500000, 'عميد الأسواق'], [5000000, 'سلطان الدروب']];
const SPEED = 60; // وحدة/يوم (الإحداثيات تطابق الخريطة المرسومة؛ المتوسط العام للرحلات كما كان)

/* ---------- عشوائية بذرية ---------- */
// تيار مستقل لأصناف المواشي حتى لا تتغيّر عوالم البذور القديمة بإضافتها
function rndB(S) {
  let t = (S.seedB = (S.seedB === undefined ? 0x2F6E2B1 : S.seedB) + 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rndG = (S, g) => (GD[g].sp || GD[g].fresh ? rndB(S) : rnd(S));
function rnd(S) {
  let t = (S.seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (S, a, b) => a + (b - a) * rnd(S);

/* ---------- محاسبة ---------- */
function fauc(S, cat, amt) { S.stats.fauc[cat] = (S.stats.fauc[cat] || 0) + amt; }
function sink(S, cat, amt) { S.stats.sink[cat] = (S.stats.sink[cat] || 0) + amt; }
function pPay(S, cat, amt, hard) {
  if (!(amt > 0)) return 0;
  amt = Math.min(amt, S.player.gold);
  S.player.gold -= amt; S.player.led.exp[cat] = (S.player.led.exp[cat] || 0) + amt;
  if (hard) sink(S, cat, amt);
  return amt;
}
function news(S, txt, kind) { S.news.unshift({ d: S.day, t: txt, k: kind || '' }); if (S.news.length > 60) S.news.pop(); }
const mid = g => (GD[g].pmin + GD[g].pmax) / 2;
const valueOf = stock => { let v = 0; for (const g in stock) v += (stock[g] || 0) * mid(g); return v; };

/* ---------- العالم ---------- */
const capOf = c => Math.round(1000 * (0.8 + 0.2 * c.size) * (1 + 0.25 * (c.tier - 1)));
const capG = (c, g) => c.cap * GD[g].depth;
const popTotal = c => c.pop[0] + c.pop[1] + c.pop[2] + c.pop[3];
function demandOf(c, g) {
  const d = GD[g].d, [b, p, r, e] = c.pop, pt = b + p + r + e;
  let x = (d.all || 0) * pt + (d.p || 0) * p + (d.r || 0) * r + (d.e || 0) * e;
  if (g === 'tools' && c.ev && c.ev.k === 'war') x += pt * 0.008;
  return x;
}
function makeCity(S, d) {
  const c = {
    id: d.id, name: d.name, country: d.country, x: d.x, y: d.y, size: d.size, tax: d.tax,
    prod: {}, extra: {}, tier: 1, owner: d.owner || null, sig: d.sig || null, makes: (d.makes || []).slice(),
    stock: {}, idx: {}, short: {}, glut: {}, dem: {}, ev: null, factJobs: 0, sat: { food: 1, lux: 1 },
    pop: [0.25, 0.50, 0.20, 0.05].map(f => Math.round(f * 1000 * d.size)),
  };
  c.cap = capOf(c);
  GIDS.forEach(g => { c.stock[g] = capG(c, g) * ((GD[g].tier === 'raw' || g === 'wheat' || c.makes.includes(g)) ? 0.35 + rndG(S, g) * 0.25 : 0.06 + rndG(S, g) * 0.1); c.idx[g] = 1; c.short[g] = 0; c.glut[g] = 0; c.dem[g] = 0; });
  // معايرة الإنتاج: المنتِج يستقر عند ~75٪ امتلاء (رخيص)، وكل مدينة تزرع جزءاً من قمحها
  GIDS.forEach(g => {
    const cons = demandOf(c, g), make = c.makes.includes(g);
    if (g === 'wheat') c.prod[g] = (make ? 1.35 : 0.65) * cons;
    else if (make) c.prod[g] = cons + 0.009 * capG(c, g) * (1 + 0.2 * rndG(S, g));
  });
  return c;
}

// حفظ قديم: سلع أُضيفت بعده تأخذ رفّاً وإنتاجاً وسعراً معروفاً في كل مدينة
function migrateGoods(S) {
  for (const id of S.order) {
    const c = S.cities[id], d = CITY_DEFS.find(x => x.id === id); if (!c || !d) continue;
    GIDS.forEach(g => {
      if (c.stock[g] !== undefined && c.prod[g] !== undefined || c.stock[g] !== undefined && !c.makes.includes(g)) { if (c.idx[g] === undefined) c.idx[g] = 1; if (c.short[g] === undefined) c.short[g] = 0; if (c.glut[g] === undefined) c.glut[g] = 0; if (c.dem[g] === undefined) c.dem[g] = 0; if (c.makes.includes(g) && c.prod[g] === undefined) c.prod[g] = demandOf(c, g) + 0.009 * capG(c, g); return; }
      const mk = isOwn(c, g);
      c.stock[g] = capG(c, g) * (mk ? 0.45 : 0.1); c.idx[g] = 1; c.short[g] = 0; c.glut[g] = 0; c.dem[g] = 0;
      if (c.makes.includes(g)) c.prod[g] = demandOf(c, g) + 0.009 * capG(c, g) * 1.1;
    });
    const k = S.player.known && S.player.known[id]; if (k) GIDS.forEach(g => { if (k.p[g] === undefined) { k.p[g] = Math.round(unitPrice(c, g) * 10) / 10; k.st[g] = Math.round(c.stock[g]); } });
  }
}
function riskKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
function ensureRisks(S) {
  const ids = S.order;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const k = riskKey(ids[i], ids[j]);
    if (S.risk[k] != null) continue;
    const dd = cdist(S.cities[ids[i]].country, S.cities[ids[j]].country);
    S.risk[k] = +([0.03, 0.06, 0.10][dd] + rnd(S) * 0.04).toFixed(3);
  }
}

function newGame(seed) {
  const S = { seed: (seed >>> 0) || 1, day: 0, phase: 1, cities: {}, order: [], agents: [], risk: {}, news: [],
    orders: [], mkt2: 1, learn: learnNew(), zakat: zakatNew(), stats: { sink: {}, fauc: {} }, hist: { nw: [], px: {} }, nextId: 10, ver: VER, home: HOME, fx: { usd: FX0.usd, gold: FX0.gold, silver: +silverAt(FX0.gold, 0).toFixed(3), hu: [FX0.usd], hg: [FX0.gold], hs: [+silverAt(FX0.gold, 0).toFixed(3)] }, ctxCur: 'sar' };
  CITY_DEFS.forEach(d => { S.cities[d.id] = makeCity(S, d); S.order.push(d.id); });
  ensureRisks(S);
  S.player = {
    wallet: { sar: 800, usd: 0, au: 0, ag: 0 }, led: { inc: {}, exp: {} }, props: {}, factories: [], known: {},
    bank: { dep: {}, loans: [], bonds: [] }, caravans: [], trips: 0, trades: [],
  };
  attachWallet(S); ensureBosses(S);
  S.player.caravans.push(makeCaravan(S, 1, 'القافلة الرئيسية', START_CITY, true));
  const names = ['أبو فهد', 'سالم الجمّال', 'ماجد', 'أبو ناصر', 'راشد', 'عبدالله القافلة', 'مبارك', 'أبو سعد', 'خالد التاجر', 'هزاع', 'يوسف', 'زيد', 'أحمد الحرّاني', 'منصور', 'سلطان', 'وليد', 'حمدان', 'جابر', 'نايف', 'علي البحّار'];
  for (let i = 0; i < 20; i++) S.agents.push({ id: i, name: names[i], gold: 600, city: S.order[i % S.order.length], dest: null, left: 0, cargo: {}, cap: 90 });
  // تسخين العالم: تستقر الأسواق قبل أن يرى اللاعب أسعارها، فلا تتحرك فجأة في أول رحلة
  for (let i = 0; i < 60; i++) { for (const id of S.order) cityDay(S, S.cities[id]); agentsDay(S); }
  S.agents.forEach(a => { a.gold = 600; a.cargo = {}; a.dest = null; a.left = 0; a.from = null; });
  S.stats = { sink: {}, fauc: {} }; S.news = [];
  snapshotKnown(S, S.order);
  news(S, 'ورثتَ قافلة جدّك في الرياض بـ 800 ذهب. اشترِ رخيصاً وبِع غالياً، ودروب التجارة تمتد إلى مصر وفارس والهند والصين.', 'good');
  return S;
}

function makeCaravan(S, id, name, city, main) {
  return { id, name, main: !!main, city, dest: null, from: null, left: 0, total: 0, cargo: {}, carts: 1, crew: 4, guards: 0,
    morale: 90, insured: false, captain: null, route: null, supplies: 0, trips: 0, basis: {}, herd: {}, herders: 0 };
}
/* المركب المملوك: جمل أصيل يزيد الحمولة 20٪، أو فرس سابق يقصّر الرحلة 12٪. واحد لكل قافلة وله علف يومي */
const MOUNT = { camel: { name: 'جمل أصيل', cost: 1400, load: 0.2, speed: 0, up: 5, desc: 'يحمل عنك 20٪ زيادة في الحمولة' }, horse: { name: 'فرس سابق', cost: 2200, load: 0, speed: 0.12, up: 8, desc: 'يقصّر رحلاتك نحو 12٪' } };
const mountOf = car => (car.mount && MOUNT[car.mount.kind]) || null;
const capOfCar = car => Math.round(car.carts * 100 * (1 + (mountOf(car) ? mountOf(car).load : 0)));
function loadOf(car) { let s = 0; for (const g in car.cargo) s += (car.cargo[g] || 0) * GD[g].w; return s; }

/* ---------- الأسعار ---------- */
// علاوة المسافة: السلعة غير الخام (والقمح خارجها) تغلو في المدينة التي لا تنتجها بقدر بُعدها عن أقرب مدينة تنتجها، وترخص حيث تُنتَج
const PREM_MAX = 0.15, PREM_D = 650, PULL_FAR = 0.02;
const PREM = {}; CITY_DEFS.forEach(d => {
  PREM[d.id] = {};
  GOODS.forEach(G => {
    if (G.tier === 'raw' || G.id === 'wheat' || d.makes.includes(G.id)) { PREM[d.id][G.id] = 1; return; }
    let best = Infinity; CITY_DEFS.forEach(m => { if (m.makes.includes(G.id)) best = Math.min(best, Math.hypot(m.x - d.x, m.y - d.y)); });
    PREM[d.id][G.id] = 1 + PREM_MAX * (isFinite(best) ? Math.min(1, best / PREM_D) : 1);
  });
});
const scarcity = (c, g) => (PREM[c.id] && PREM[c.id][g]) || 1;
const isOwn = (c, g) => GD[g].tier === 'raw' || g === 'wheat' || c.makes.includes(g);
const refPrice = (c, g) => mid(g) * GD[g].cult[c.country] * scarcity(c, g);
function evMul(c, G) {
  const e = c.ev; if (!e) return 1;
  switch (e.k) {
    case 'boom': return 1.12;
    case 'bust': return 0.78;
    case 'plague': return G.id === 'wheat' ? 1.7 : 0.95;
    case 'festival': return G.lux ? 1.4 : 1;
    case 'war': return G.id === 'tools' ? 1.6 : G.id === 'iron' ? 1.3 : 1;
  }
  return 1;
}
const unitPrice = (c, g) => priceAt(c, g, c.stock[g]);
function priceAt(c, g, stock) {
  const G = GD[g], r = clamp(stock / capG(c, g), 0, 1);
  let p = G.pmax - (G.pmax - G.pmin) * r;
  p *= G.cult[c.country] * scarcity(c, g) * c.idx[g] * evMul(c, G);
  return clamp(p, G.pmin * 0.4, G.pmax * 3);
}
const ratio = (c, g) => unitPrice(c, g) / refPrice(c, g);

/* ---------- زعماء الأسواق والشراكات ---------- */
// لكل مدينة «كبير تجّار» يحكم سوقها. نفوذ اللاعب (p) يقابل نفوذ الزعيم (b). عند p/(p+b) ≥ 0.55 يُخلَع الزعيم، ويستعيد حكمه إن هبطت الحصة دون 0.40.
const BOSS_NAMES = {
  riyadh: 'الشيخ ماجد الراجح', jeddah: 'أبو سالم البحّار', hail: 'ابن شمّر الجمّال', jazan: 'الحاج عيسى المهري',
  cairo: 'الحاج منصور الأنصاري', alex: 'سيد درويش الريّس', aswan: 'عم صابر النوبي',
  isfahan: 'آقا بهرام التاجر', shiraz: 'خواجه كاوه', tabriz: 'ميرزا آرش',
  delhi: 'سيث ماهيش لال', mumbai: 'سيث راجيش شاه', kolkata: 'بابو ديباك داس',
  xian: 'السيد وانغ لي', guangzhou: 'السيد تشن هاو', shanghai: 'السيد لين فاي',
};
const PACTS = {
  supply: { name: 'عقد توريد', icon: '📦', days: 40, daily: 30, upfront: 0, penalty: 600, minTrust: -30, presence: false, desc: 'شراء أرخص بنسبة 8٪ في هذا السوق طوال مدة العقد.' },
  shop: { name: 'شراكة دكان', icon: '🏪', days: 40, daily: 0, upfront: 0, penalty: 800, minTrust: -10, presence: true, desc: 'دكاكينك تبيع أكثر بـ40٪ بفضل شبكة الزعيم، ويأخذ 15٪ من إيراد الدكاكين.' },
  guard: { name: 'حماية القوافل', icon: '🛡️', days: 30, daily: 45, upfront: 0, penalty: 500, minTrust: 0, presence: false, desc: 'لا يتعرض أحد لقوافلك في الطرق من هذه المدينة وإليها.' },
  alliance: { name: 'تحالف سوق', icon: '🤝', days: 60, daily: 70, upfront: 1500, penalty: 1500, minTrust: 20, presence: true, desc: 'جمارك أقل بالنصف عند الدخول، ونفوذك في السوق يزداد كل يوم.' },
  exclusive: { name: 'عقد حصري', icon: '🔑', days: 30, daily: 55, upfront: 600, penalty: 1000, minTrust: 25, presence: false, desc: 'يبيع لك الزعيم منتج مدينته الخاص وحدك 30 يوماً فلا يشتريه منافسوك. حصتك اليومية منه مضاعفة، وتدفع عليه 6٪ زيادة.' },
};
const BOSS_TAKE = 0.55, BOSS_LOSE = 0.40, MAX_PACTS = 3;
const loreStyle = (bs, id) => (LORE.BOSS_LORE[id] || {}).style || null;
const bossOf = (S, id) => (S.bosses ? S.bosses[id] : null);
const bossB0 = c => 35 + 15 * c.size;
function ensureBosses(S) {
  S.bosses = S.bosses || {}; S.player.pacts = S.player.pacts || [];
  for (const id of S.order) {
    const c = S.cities[id]; if (S.bosses[id] || c.owner === 'player' || !BOSS_NAMES[id]) continue;
    S.bosses[id] = { name: BOSS_NAMES[id], b: bossB0(c), p: 0, ruler: 'boss', trust: 0, disc: {}, cd: 0, gift: -99, dsales: 0 };
  }
}
const bossShare = bs => (bs.p + bs.b > 0 ? bs.p / (bs.p + bs.b) : 0);
const pactIn = (S, city, type) => (S.player.pacts || []).find(x => x.city === city && (!type || x.type === type));
const bossActive = S => S.phase >= 2;
// زعيم السوق مفتاح المنتج الخاص (من المستوى 4): حصتك اليومية من منتج مدينته تتبع ثقته بك، ويحملها رصيد يتراكم حتى 3 أيام
const QUOTA_BASE = 28, QUOTA_DAYS = 3;
const keyOn = S => !!(S.learn && S.learn.char && taught(S.learn) >= 4);
const quotaOn = (S, c, g) => !!c.sig && g === c.sig && c.owner !== 'player' && keyOn(S);
function quotaPerDay(S, c) {
  const bs = bossOf(S, c.id); if (!bs || bs.ruler === 'player') return Infinity;
  let q = QUOTA_BASE * c.size * clamp(1 + bs.trust / 60, 0.3, 3);
  if (pactIn(S, c.id, 'supply')) q *= 1.6;
  if (pactIn(S, c.id, 'exclusive')) q *= 2;
  return q;
}
function quotaLeft(S, c) {
  const q = quotaPerDay(S, c); if (q === Infinity) return Infinity;
  const Q = S.player.quota || (S.player.quota = {}), e = Q[c.id] || (Q[c.id] = { v: q * QUOTA_DAYS, d: S.day });
  e.v = Math.min(q * QUOTA_DAYS, e.v + q * (S.day - e.d)); e.d = S.day; return e.v;
}
const repOf = P => P.rep || (P.rep = { done: 0, broke: 0 });
const exclusiveAt = (S, id) => (S.player.pacts || []).some(x => x.city === id && x.type === 'exclusive');
const rulerMine = (S, c) => c.owner === 'player' || (bossOf(S, c.id) && bossOf(S, c.id).ruler === 'player');
// معامل شراء اللاعب: توريد أرخص، حكم الزعيم أغلى قليلاً، حكم اللاعب أرخص قليلاً
/* ---------- المساومة: لعبة صغيرة، تقرأ مزاج التاجر وتختار الأسلوب الأنسب لكل جولة ----------
   مبتسم ← «أصرّ»، عادي ← «اذكر السعر المرجعي»، منزعج ← «طيّب خاطره». كل إصابة ±2٪ (والمفاوض 3٪) حتى ثلاث، وتُمنح قسيمة لكمية الصفقة في مدينتها ليوم واحد.
   خطآن يُنهيان المساومة. حدّ يومي لكل مدينة، وأدنى قيمة للصفقة، وتُفتح عند المستوى 4. */
const HAGGLE = { rounds: 3, step: 0.02, perDay: 2, minValue: 150, lv: 4, maxQty: 200, maxMiss: 2 };
const HG_BEST = { pleased: 'firm', neutral: 'ref', annoyed: 'praise' }, HG_MOODS = ['pleased', 'neutral', 'annoyed'];
/* ثقافة المساومة لكل دولة: المبدأ واحد (اقرأ مزاج التاجر واختر الأسلوب) لكن الأنسب لكل مزاج يختلف من سوق لسوق، فلا يكفي الحفظ.
   best: الأنسب لكل مزاج. rounds/miss/step: الجولات والأخطاء المسموحة وأثر الإصابة (مجموع الأثر الأقصى 6٪ في كل الأسواق). w: أوزان ظهور المزاج [مبتسم، عادي، منزعج].
   trait: ما يُقال للاعب عند الخطأ (وصف لطبع السوق دون كشف الجواب). why: سبب الجواب الصحيح، يُكشف بعد انتهاء المساومة ويُحفظ في خبرة اللاعب. */
const HG_CULT = {
  sa: { name: 'ضيافة الجزيرة', best: HG_BEST, rounds: 3, miss: 2, step: 0.02, w: [1, 1, 1], trait: 'أهل هذا السوق يقدّرون الصراحة والكرم والكلمة الطيبة.',
    why: { pleased: 'التاجر المبتسم يحترم من يثبت على رأيه بأدب، فأصرّ بلا غضب.', neutral: 'مع التاجر العادي تنفع الحقيقة: اذكر السعر المرجعي وهو يعرفه.', annoyed: 'الغاضب يلين بكلمة طيبة وتطييب للخاطر، لا بالجدال.' } },
  eg: { name: 'ظرف النيل', best: { pleased: 'praise', neutral: 'firm', annoyed: 'ref' }, rounds: 3, miss: 2, step: 0.02, w: [5, 3, 2], trait: 'أهل هذا السوق يحبون الحديث والمزاح، ولا يستعجلون الصفقة.',
    why: { pleased: 'المصري المبتسم يحب المجاملة والإطراء، فيزيد ودّه.', neutral: 'مع العادي أصرّ بهدوء ومزاح، فهو يعدّ الإصرار الهادئ ذكاءً.', annoyed: 'المنزعج يهدأ بالأرقام الواضحة: اذكر السعر المرجعي بهدوء.' } },
  ir: { name: 'أدب الشرق الفارسي', best: { pleased: 'ref', neutral: 'praise', annoyed: 'firm' }, rounds: 2, miss: 1, step: 0.03, w: [2, 5, 3], trait: 'أهل هذا السوق يرون التأدب والتأني أصلاً في البيع، ويعدّون الاستعجال قلة ذوق.',
    why: { pleased: 'الفارسي المبتسم يقدّر العارف بالقيمة: ذكر السعر المرجعي يُظهر خبرتك.', neutral: 'العادي يريد مقدّمة مهذبة قبل الثمن: طيّب خاطره أولاً.', annoyed: 'المنزعج هنا يحترم الثبات الهادئ لا التذلل: أصرّ.' } },
  in: { name: 'نَفَس الهند الطويل', best: { pleased: 'firm', neutral: 'praise', annoyed: 'ref' }, rounds: 4, miss: 3, step: 0.015, w: [3, 3, 4], trait: 'أهل هذا السوق يعدّون المساومة لعبة طويلة، ويحترمون من لا يسرع إلى التنازل.',
    why: { pleased: 'التاجر الهندي المبتسم يحب خصماً صلباً يسليه: أصرّ.', neutral: 'العادي يلين للإطراء الذي يطيل الحديث.', annoyed: 'المنزعج يهدأ بالمنطق والأرقام: السعر المرجعي يحسم النقاش.' } },
  cn: { name: 'حساب الشرق الأقصى', best: { pleased: 'ref', neutral: 'firm', annoyed: 'praise' }, rounds: 3, miss: 2, step: 0.02, w: [2, 6, 2], trait: 'أهل هذا السوق يزنون الكلام بالأرقام، ويقلّ إعجابهم بالمجاملة الكثيرة.',
    why: { pleased: 'التاجر الصيني المبتسم يقدّر الحجة الرقمية الواضحة: اذكر المرجع.', neutral: 'العادي يوازن بصبر؛ الثبات على السعر يقنعه.', annoyed: 'المنزعج يحتاج إلى احترام يحفظ ماء الوجه: طيّب خاطره.' } }
};
const hgCult = (S, city) => HG_CULT[S.cities[city].country] || HG_CULT.sa;
/* أوزان المزاج: تتأثر بثقة زعيم السوق بك (ثقة عالية ترفع المزاج الطيب) */
function hgWeights(S, city) {
  const cu = hgCult(S, city), w = cu.w.slice(), bs = S.bosses && S.bosses[city], tr = bs ? bs.trust : 0, sh = tr >= 15 ? 0.15 : tr <= -10 ? -0.15 : 0, tot = w[0] + w[1] + w[2];
  return [w[0] / tot + sh, w[1] / tot, Math.max(0.02, w[2] / tot - sh)];
}
const hgOf = S => S.player.hg || (S.player.hg = { day: 0, used: {}, vouch: null, game: null });
const haggleOpen = S => { const L = S.learn; return !(L && L.char) || L.level >= HAGGLE.lv; };
function haggleLeft(S, city) { const h = hgOf(S); if (h.day !== S.day) { h.day = S.day; h.used = {}; } return HAGGLE.perDay - (h.used[city] || 0); }
function vouchOf(S, city, g, side) { const v = S.player.hg && S.player.hg.vouch; return v && v.day === S.day && v.city === city && v.g === g && v.side === side && v.left >= 1 ? v : null; }
const vouchMul = (S, city, g, side) => { const v = vouchOf(S, city, g, side); return v ? v.mul : 1; };
const vouchLeft = (S, city, g, side) => { const v = vouchOf(S, city, g, side); return v ? Math.floor(v.left) : 0; };
function vouchUse(S, city, g, side, n) { const v = vouchOf(S, city, g, side); if (v) v.left -= n; }
function buyMul(S, c, g) {
  const hm = (c.id === (S.startCity || START_CITY) ? perkMul(S, 'homeBuy') : 1) * perkMul(S, 'buy_' + c.id) * (g && g === c.sig && pactIn(S, c.id, 'exclusive') ? 1.06 : 1);
  if (!bossActive(S)) return hm;
  const bs = bossOf(S, c.id); if (!bs) return hm;
  if (pactIn(S, c.id, 'supply')) return 0.92 * hm;
  return (bs.ruler === 'player' ? 0.97 : 1.04) * hm;
}
function pactTerms(S, city, type) {
  const c = S.cities[city], bs = bossOf(S, city), d = PACTS[type];
  const m = clamp(1 - bs.trust / 200, 0.6, 1.3) * perkMul(S, 'pact') * (bs.disc[type] && bs.disc[type] > S.day ? 0.8 : 1), sz = c.size;
  return { type, city, days: d.days, daily: Math.round(d.daily * sz * m), upfront: Math.round(d.upfront * sz * m), penalty: Math.round(d.penalty * sz), share: type === 'shop' ? +(0.15 * m).toFixed(3) : 0, negotiated: !!(bs.disc[type] && bs.disc[type] > S.day) };
}
function pactBlock(S, city, type) {
  const bs = bossOf(S, city); if (!bs) return 'لا زعيم في هذه المدينة';
  if (!bossActive(S)) return 'يُفتح في الطور 2';
  if (bs.ruler === 'player') return 'أنت حاكم هذا السوق';
  if (pactIn(S, city)) return 'بينكما عقد قائم';
  if (S.player.pacts.length >= MAX_PACTS) return 'بلغت أقصى عدد من العقود (' + MAX_PACTS + ')';
  if (bs.cd > S.day) return 'الزعيم غاضب منك، عُد بعد ' + (bs.cd - S.day) + ' أيام';
  if (type === 'exclusive') { if (!keyOn(S)) return 'يُفتح بعد المستوى 4'; if (!c0(S, city).sig) return 'لا منتج خاص في هذه المدينة'; }
  const d = PACTS[type]; if (bs.trust < d.minTrust) return 'ثقة الزعيم بك لا تكفي (يلزم ' + d.minTrust + ' وعندك ' + Math.round(bs.trust) + ')';
  if (d.presence && !hasPresence(S, city)) return 'يلزم دكان لك في ' + c0(S, city).name;
  return null;
}
const c0 = (S, id) => S.cities[id];
function bossesDay(S) {
  if (!S.bosses) return;
  const P = S.player;
  for (const id of S.order) {
    const bs = S.bosses[id], c = S.cities[id]; if (!bs) continue;
    const ns = shopsOf(S, id).length, nw = whsOf(S, id);
    let inflow = 0.35 * ns + 0.12 * nw + Math.min(2, bs.dsales / 1500);
    if (pactIn(S, id, 'alliance')) inflow += 0.5;
    bs.dsales = 0;
    bs.p = clamp(bs.p * 0.98 + inflow, 0, 100);
    const share0 = bossShare(bs);
    bs.b = clamp(bs.b + 0.05 * (bossB0(c) - bs.b) + (bs.ruler === 'boss' && share0 > 0.25 ? 0.4 : 0), 5, 120);
    const share = bossShare(bs);
    if (bs.ruler === 'boss' && share >= BOSS_TAKE) {
      bs.ruler = 'player'; bs.b = Math.min(bs.b, 20);
      const pc = pactIn(S, id);
      if (pc) {
        const pay = Math.min(pc.penalty, P.gold); if (pay > 0) pPay(S, 'pactPenalty', pay, true);
        P.pacts = P.pacts.filter(x => x !== pc); bs.trust = -50;
      }
      news(S, 'انقلبتَ على ' + bs.name + ' وصرتَ حاكم سوق ' + c.name + '!' + (pc ? ' (دفعت بند العقد الجزائي)' : ''), 'good'); S.pause = true;
    } else if (bs.ruler === 'player' && share < BOSS_LOSE) {
      bs.ruler = 'boss'; bs.b = Math.max(bs.b, bossB0(c));
      news(S, 'استعاد ' + bs.name + ' السيطرة على سوق ' + c.name + ' بعد تراجع نفوذك.', 'bad'); S.pause = true;
    }
  }
  // العقود
  for (const pc of P.pacts.slice()) {
    const bs = S.bosses[pc.city], c = S.cities[pc.city];
    if (bs.ruler === 'player') { P.pacts = P.pacts.filter(x => x !== pc); continue; }
    ctxFor(S, pc.city);
    if (pc.daily > 0) {
      if (P.gold < pc.daily) {
        const pay = Math.min(pc.penalty, P.gold); if (pay > 0) pPay(S, 'pactPenalty', pay, true);
        P.pacts = P.pacts.filter(x => x !== pc); bs.trust = clamp(bs.trust - 20, -100, 100); bs.cd = S.day + 10; repOf(P).broke++;
        news(S, 'عجزت عن دفع رسوم ' + PACTS[pc.type].name + ' مع ' + bs.name + ': انفسخ العقد ودُفع البند الجزائي.', 'bad'); S.pause = true; continue;
      }
      pPay(S, 'pact', pc.daily, true);
    }
    pc.left--; if (pc.left % 10 === 0) bs.trust = clamp(bs.trust + 1, -100, 100);
    if (pc.left <= 0) {
      P.pacts = P.pacts.filter(x => x !== pc); bs.trust = clamp(bs.trust + 8, -100, 100); repOf(P).done++;
      news(S, 'انتهى ' + PACTS[pc.type].name + ' مع ' + bs.name + ' بوفاء. ثقته بك ارتفعت.', 'good');
    }
  }
}

/* ---------- العقارات: دكاكين ومخازن ---------- */
const SHOP_ITEMS_MAX = 4, WH_CAP = 400, SHELF_CAP = 80;
const shopsOf = (S, city) => (S.player.props[city] ? S.player.props[city].shops : []);
const whsOf = (S, city) => (S.player.props[city] ? S.player.props[city].whs : 0);
const shopLimit = c => Math.floor(2 + 2 * c.size) + (c.tier - 1);
const foreignMul = (S, c) => (c.country === S.home ? 1 : 1.4);
const shopCost = (S, c) => Math.round(1500 * Math.pow(1.5, shopsOf(S, c.id).length) * foreignMul(S, c));
const whCost = (S, c) => Math.round(1200 * Math.pow(1.4, whsOf(S, c.id)) * foreignMul(S, c));
/* بسطة ← دكان مؤجَّر ← شراء: الإيجار يومي ويُخصم 40٪ مما دفعتَه من سعر الشراء لاحقاً */
const STALL_CAP = 40, STALL_ITEMS = 2, STALL_RENT = 4, RENT_RATE = 0.008, RENT_CREDIT = 0.4, RENT_MAXCREDIT = 0.6, EVICT_DAYS = 5;
const shKind = sh => sh.kind || 'own';
/* تحسين الدكان المملوك (كل بند مستويان): رفوف +25٪ سعة، مظلة +6٪ إقبال، لافتة تُجيز سعراً أعلى قليلاً قبل أن يعزف الزبائن */
const SHOP_UP = { shelf: { name: 'رفوف إضافية', desc: 'تزيد سعة الدكان 25٪ لكل مستوى' }, awning: { name: 'مظلة السوق', desc: 'تزيد إقبال الزبائن 6٪ لكل مستوى' }, sign: { name: 'لافتة مميزة', desc: 'يتحمل الزبائن سعراً أعلى قليلاً' } };
const SHOP_UP_COST = [800, 2000], shUp = (sh, k) => (sh.up && sh.up[k]) || 0;
const shCap = sh => (shKind(sh) === 'stall' ? STALL_CAP : Math.round(SHELF_CAP * (1 + 0.25 * shUp(sh, 'shelf'))));
const shItemsMax = sh => (shKind(sh) === 'stall' ? STALL_ITEMS : SHOP_ITEMS_MAX);
const ownShops = p => p.shops.filter(sh => shKind(sh) === 'own').length;
const storeCap = (S, city) => whsOf(S, city) * WH_CAP + shopsOf(S, city).reduce((a, sh) => a + shCap(sh), 0);
function storeLoad(S, city) { const p = S.player.props[city]; if (!p) return 0; let s = 0; for (const g in p.store) s += (p.store[g] || 0) * GD[g].w; return s; }
const storeRoom = (S, city) => Math.max(0, storeCap(S, city) - storeLoad(S, city));
const hasPresence = (S, city) => shopsOf(S, city).length > 0;
/* ---------- عمّال المتاجر: بائعون لكل دكان وأمناء للمخازن، بأجر يومي ويترقّون بالأيام ---------- */
const WK = { seller: { name: 'بائع', wage: [6, 9, 12], pts: [1, 1.25, 1.5] }, keeper: { name: 'أمين مخزن', wage: [8, 12, 17] }, farmer: { name: 'مزارع', wage: [7, 10, 14], pts: [1, 1.25, 1.5] } };
const WK_LV = ['مبتدئ', 'ماهر', 'خبير'], WK_PROMO = [0, 40, 120], SELLER_PTS = Math.ceil(80 / 50), SHRINK = 0.004, WK_FREE = 30, WK_CAP = 1.2;
const staffOf = (S, city) => (S.player.props[city] && S.player.props[city].staff) || [];
const wkLv = w => (w.days >= WK_PROMO[2] ? 2 : w.days >= WK_PROMO[1] ? 1 : 0);
const wkWage = (S, c, w) => Math.round(WK[w.role].wage[wkLv(w)] * (0.85 + 0.25 * c.size) * (c.country === S.home ? 1 : 1.2));
const sellerNeed = (S, city) => shopsOf(S, city).reduce((a, sh) => a + (shKind(sh) === 'stall' ? 1 : SELLER_PTS), 0);
const keeperNeed = (S, city) => whsOf(S, city);
const sellerPts = (S, city) => staffOf(S, city).filter(w => w.role === 'seller').reduce((a, w) => a + WK.seller.pts[wkLv(w)] * (w.late > 0 ? 0.5 : 1), 0);
const keeperHave = (S, city) => staffOf(S, city).filter(w => w.role === 'keeper' && !(w.late > 0)).length;
const sellFactor = (S, city) => { const n = sellerNeed(S, city); return n ? Math.min(WK_CAP, sellerPts(S, city) / n) : 0; };
const hirePool = (S, city) => Math.max(0, Math.floor(S.cities[city].pop[0] / 40) - staffOf(S, city).length);
/* ---------- المزرعة (الطور 3): تُربّي المواشي وتكاثرها وتُنتج الصوف والجبن والبيض، ويذبح اللاعب منها لحماً مجففاً ---------- */
const BUTCHER_COST = 3500, BUTCHER_DAY = 30, FRESH_X = 2.2, BUTCHER_PREM = 1.08; // الملحمة: يومياً تبيع حتى 30 وحدة لحم طازج بعلاوة 8٪، وغلّة الرأس 2.2 ضعف غلّة المجفف
const FARM_PHASE = 3, FARM_COST = 4000, FARM_UP = 3000, FARM_UNITS = 40, FARM_MAXLV = 3, FARM_UPKEEP = 12, FARMER_UNITS = 40;
const PASTURE = { sa: 0.8, eg: 1.3, ir: 1, in: 1.2, cn: 1.1 };
const PRODUCT = { sheep: ['wool', 0.033, false], goat: ['cheese', 0.03, true], cow: ['cheese', 0.08, true], buffalo: ['cheese', 0.09, true], camel: ['cheese', 0.04, true], chicken: ['eggs', 0.015, true], duck: ['eggs', 0.012, true] };
const MEAT = { sheep: 2, goat: 1.6, cow: 5, buffalo: 5.5, camel: 7 };
const farmOf = (S, city) => (S.player.props[city] && S.player.props[city].farm) || null;
const farmCap = (S, city) => { const f = farmOf(S, city); return f ? Math.round(FARM_UNITS * f.level * (PASTURE[S.cities[city].country] || 1)) : 0; };
const farmUnits = f => { let u = 0; for (const g in (f.hx || {})) u += ((f.herd[g] || 0) + 0.5 * youngOf(f, g)) * (BREED[g] ? BREED[g].fu : 1); for (const g in f.herd) if (!(f.hx || {})[g]) u += f.herd[g] * (BREED[g] ? BREED[g].fu : 1); return u; };
const farmHold = f => { const h = {}; for (const g in f.herd) h[g] = (h[g] || 0) + f.herd[g]; for (const g in (f.hx || {})) h[g] = (h[g] || 0) + YOUNG_VAL * f.hx[g].y; return h; };
const farmValue = pr => (pr.farm ? 2500 * pr.farm.level + valueOf(farmHold(pr.farm)) : 0) + (pr.butcher ? BUTCHER_COST * 0.6 : 0);
const farmerNeed = (S, city) => { const f = farmOf(S, city); return f ? Math.ceil(farmUnits(f) / FARMER_UNITS) : 0; };
const farmCover = (S, city) => { const n = farmerNeed(S, city); if (!n) return 1; const pts = staffOf(S, city).filter(w => w.role === 'farmer').reduce((a, w) => a + WK.farmer.pts[wkLv(w)] * (w.late > 0 ? 0.5 : 1), 0); return Math.min(1.2, pts / n); };
// نقل خيل بين قطيع ومزرعة: يحمل سلالة الذكور والإناث بنسبتها
function pedMove(src, dst, dstAdults, n, p) {
  const nm = n * p, nf = n - nm, dm = Math.min(dst.m, dstAdults), df = dstAdults - dm;
  if (dm + nm > 0) dst.mq = ((dst.mq || 1) * dm + (src.mq || 1) * nm) / (dm + nm); if (df + nf > 0) dst.fq = ((dst.fq || 1) * df + (src.fq || 1) * nf) / (df + nf);
}
function farmDay(S, city, pr, c) {
  const f = pr.farm; if (!f) return; ctxFor(S, city); pPay(S, 'farm', FARM_UPKEEP * f.level, true); f.acc = f.acc || {};
  const cap = farmCap(S, city), cover = farmCover(S, city), plague = c.ev && c.ev.k === 'plague' ? 3 : 1;
  for (const g of Array.from(new Set(Object.keys(f.herd).concat(Object.keys(f.hx || {}))))) {
    const B = BREED[g]; if (!B) continue; f.herd[g] = f.herd[g] || 0;
    const rate = GD[g].spoil * spoilMul(f, g) * 0.3 * plague * (cover < 1 ? 2 - cover : 1), loss = f.herd[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
    if (n) { const b0 = f.herd[g]; f.herd[g] = Math.max(0, b0 - n); herdScale(f, g, b0); sink(S, 'spoilage', n * mid(g)); }
    breedStep(S, f, g, Math.min(1, cover), cap - farmUnits(f), B.fu * 0.5, 1);
    const pd = PRODUCT[g]; if (pd && cover > 0) {
      const x = hxOf(f, g), a = f.herd[g], heads = pd[2] ? Math.max(0, a - Math.min(x.m, a)) : a;
      f.acc[pd[0]] = (f.acc[pd[0]] || 0) + heads * pd[1] * hyMul(f, g, pd[0] === 'wool' ? 'wool' : 'milk') * cover; const k = Math.floor(f.acc[pd[0]]);
      if (k >= 1) { const room = Math.floor(storeRoom(S, city) / GD[pd[0]].w), put = Math.min(k, room); if (put > 0) { achFlag(S, 'farm_first'); pr.store[pd[0]] = (pr.store[pd[0]] || 0) + put; addBasis(pr.basis || (pr.basis = {}), pd[0], put, 0); } f.acc[pd[0]] -= k; if (put < k) f.lost = (f.lost || 0) + (k - put); }
    }
  }
}
function welcomeCrew(S, pr, nSellers, keepers) {
  pr.staff = pr.staff || [];
  for (let i = 0; i < (pr.farmerWelcome || 0); i++) pr.staff.push({ id: S.nextId++, role: 'farmer', days: 0, late: 0, free: S.day + WK_FREE }); pr.farmerWelcome = 0;
  for (let i = 0; i < nSellers; i++) pr.staff.push({ id: S.nextId++, role: 'seller', days: 0, late: 0, free: S.day + WK_FREE });
  for (let i = 0; i < keepers; i++) pr.staff.push({ id: S.nextId++, role: 'keeper', days: 0, late: 0, free: S.day + WK_FREE });
}
function rentOf(S, c, kind, landlord, nShops) {
  const base = kind === 'stall' ? STALL_RENT * (0.85 + 0.25 * c.size) * (c.country === S.home ? 1 : 1.2) : Math.round(1500 * Math.pow(1.5, nShops) * foreignMul(S, c)) * RENT_RATE;
  const bs = bossOf(S, c.id), m = landlord === 'boss' && bs && bs.ruler !== 'player' ? clamp(1 - bs.trust / 300, 0.8, 1.2) : 1;
  return Math.max(1, Math.round(base * m));
}
function rentDay(S, city, pr, c) {
  for (const sh of pr.shops.slice()) {
    if (shKind(sh) === 'own') continue;
    const paid = pPay(S, 'rent', sh.rent, true); sh.rentPaid = (sh.rentPaid || 0) + paid;
    if (paid + 1e-6 >= sh.rent) {
      sh.arrears = 0; sh.onTime = (sh.onTime || 0) + 1;
      if (sh.landlord === 'boss' && sh.onTime % 10 === 0) { const bs = bossOf(S, city); if (bs) bs.trust = clamp(bs.trust + 1, -100, 100); }
      continue;
    }
    sh.arrears = (sh.arrears || 0) + 1; if (sh.arrears === 1) learnReact(S, 'rentLate', 10);
    if (sh.arrears >= EVICT_DAYS) {
      pr.shops = pr.shops.filter(x => x !== sh); if (pr.whs > pr.shops.length) pr.whs = pr.shops.length;
      if (sh.landlord === 'boss') { const bs = bossOf(S, city); if (bs) bs.trust = clamp(bs.trust - 10, -100, 100); }
      news(S, 'أُخلي ' + (shKind(sh) === 'stall' ? 'بسطتك' : 'دكانك المؤجَّر') + ' في ' + c.name + ' لتأخّر الإيجار ' + sh.arrears + ' أيام.', 'bad');
    }
  }
}
function staffDay(S, city, pr, c) {
  pr.staff = pr.staff || [];
  for (const w of pr.staff.slice()) {
    w.days++;
    if (w.free > S.day) continue;
    const wage = wkWage(S, c, w), paid = pPay(S, 'staff', wage, true);
    if (paid + 1e-6 >= wage) { w.late = 0; achFlag(S, 'steady_staff'); continue; }
    w.late = (w.late || 0) + 1;
    if (w.late === 1) learnReact(S, 'wageLate', 10);
    if (w.late >= 5) { pr.staff = pr.staff.filter(x => x !== w); news(S, 'ترك ' + WK[w.role].name + ' العمل في ' + c.name + ' لأن أجره تأخّر ' + w.late + ' أيام.', 'bad'); }
  }
  // أمين المخزن: المخزن بلا أمين يتناقص مخزونه (سرقة وإهمال)
  const need = keeperNeed(S, city);
  if (need > 0) {
    const un = Math.max(0, need - keeperHave(S, city)) / need;
    if (un > 0) for (const g in pr.store) {
      const loss = (pr.store[g] || 0) * SHRINK * un; if (loss <= 0) continue;
      pr.store[g] -= loss; takeBasis(pr.basis || (pr.basis = {}), g, loss); sink(S, 'shrink', loss * mid(g));
    }
  }
}

function netWorth(S) {
  const P = S.player; let nw = P.gold;
  P.caravans.forEach(c => { nw += valueOf(holdings(c)) + c.carts * 300 + c.guards * 100; });
  for (const k in P.props) { const p = P.props[k]; nw += ownShops(p) * 1000 + p.whs * 800 + valueOf(p.store) + farmValue(p); }
  P.factories.forEach(f => nw += 2000 * f.level);
  for (const k in P.bank.dep) nw += P.bank.dep[k];
  P.bank.loans.forEach(l => nw -= l.amt);
  P.bank.bonds.forEach(b => nw += b.amt); nw += P.vault || 0;
  for (const id in S.cities) { const c = S.cities[id]; if (c.owner === 'player') nw += 30000; nw += (c.tier - 1) * 4000; const bs = bossOf(S, id); if (bs && bs.ruler === 'player') nw += 4000 * c.size; }
  return nw;
}
function titleOf(nw) { let t = TITLES[0][1]; TITLES.forEach(([a, n]) => { if (nw >= a) t = n; }); return t; }

/* ---------- أساس التكلفة وسجل الصفقات ---------- */
// الجودة تسافر مع سجل التكلفة: w = مجموع (الكمية × الجودة). بلا w فالجودة 1 («أصلية»)
function addBasis(b, g, q, c, ql) { if (q <= 0) return; const x = b[g] || (b[g] = { q: 0, c: 0 }); const w0 = x.w === undefined ? x.q : x.w; x.q += q; x.c += c; if ((ql !== undefined && ql !== 1) || x.w !== undefined) x.w = w0 + q * (ql === undefined ? 1 : ql); }
function takeBasis(b, g, q) { const x = b[g]; if (!x || x.q <= 0) return 0; const t = Math.min(q, x.q), cost = x.c * t / x.q; if (x.w !== undefined) x.w -= x.w * t / x.q; x.q -= t; x.c -= cost; if (x.q < 0.01) delete b[g]; return cost; }
const qualOf = (b, g) => (b && b[g] && b[g].q > 0 && b[g].w !== undefined ? clamp(b[g].w / b[g].q, 0.05, 1) : 1);
const avgCost = (b, g) => (b && b[g] && b[g].q > 0 ? b[g].c / b[g].q : null);
function syncBasis(car) { for (const g in car.basis) { const have = (car.cargo[g] || 0) + ((car.herd || {})[g] || 0); if (have < 0.5) delete car.basis[g]; else if (car.basis[g].q > have) car.basis[g].q = have; } }
function logTrade(S, city, g, q, side, net, pl) {
  const T = S.player.trades; T.unshift({ day: S.day, city, g, q, side, net, pl }); if (T.length > 50) T.pop();
  if (side === 'sell' || side === 'shop') { if (pl >= 0) S.player.led.inc.realized = (S.player.led.inc.realized || 0) + pl; else S.player.led.exp.realizedLoss = (S.player.led.exp.realizedLoss || 0) - pl; }
}
const ctxFor = (S, city) => { S.ctxCur = curOf(S.cities[city].country); };

/* ---------- تجارة ---------- */
function taxRate(S, c, isPlayer) {
  let x = c.tax + (isPlayer ? 0.05 * clamp(netWorth(S) / 200000, 0, 1) : 0);
  if (isPlayer && bossActive(S) && bossOf(S, c.id) && bossOf(S, c.id).ruler === 'boss' && !pactIn(S, c.id)) x += 0.02;
  return x;
}
function buyUnits(S, acct, c, g, qty, room, dst, isPlayer, anyGood, pm) {
  const G = GD[g];
  if (isPlayer && !anyGood && !sells(c, g)) return { n: 0, cost: 0, unsold: true };
  qty = Math.min(Math.floor(qty), Math.floor(c.stock[g]), Math.floor(room / G.w));
  const qo = isPlayer && quotaOn(S, c, g), ql = qo ? Math.floor(quotaLeft(S, c)) : Infinity, capped = qty > ql;
  if (qo) qty = Math.min(qty, ql);
  let cost = 0, n = 0;
  const bm = (isPlayer ? buyMul(S, c, g) : 1) * (pm || 1), vm = isPlayer ? vouchMul(S, c.id, g, 'buy') : 1, vl = isPlayer ? vouchLeft(S, c.id, g, 'buy') : 0;
  for (; n < qty; n++) {
    const p = unitPrice(c, g) * bm * (n < vl ? vm : 1);
    if (cost + p > acct.gold) break;
    cost += p; c.stock[g] -= 1;
  }
  if (n > 0) {
    acct.gold -= cost; dst[g] = (dst[g] || 0) + n;
    if (isPlayer) S.player.led.exp.purchases = (S.player.led.exp.purchases || 0) + cost;
    if (qo && ql !== Infinity) S.player.quota[c.id].v -= n;
    if (isPlayer && vl) vouchUse(S, c.id, g, 'buy', n);
  }
  return { n, cost, quota: capped && n >= qty };
}
function sellUnits(S, acct, c, g, qty, src, isPlayer, haggle) {
  qty = Math.min(Math.floor(qty), Math.floor(src[g] || 0));
  const tr = taxRate(S, c, isPlayer);
  let gross = 0, n = 0; const vm = isPlayer ? vouchMul(S, c.id, g, 'sell') : 1, vl = isPlayer ? vouchLeft(S, c.id, g, 'sell') : 0;
  for (; n < qty; n++) {
    gross += unitPrice(c, g) * (haggle || 1) * (n < vl ? vm : 1);
    c.stock[g] = Math.min(c.stock[g] + 1, capG(c, g) * 1.2);
  }
  const tax = gross * tr, net = gross - tax;
  if (n > 0) {
    src[g] -= n; acct.gold += net; sink(S, 'tax', tax); if (isPlayer && vl) vouchUse(S, c.id, g, 'sell', n);
    if (isPlayer) {
      S.player.led.inc.sales = (S.player.led.inc.sales || 0) + gross;
      S.player.led.exp.tax = (S.player.led.exp.tax || 0) + tax;
      const bsx = bossOf(S, c.id); if (bsx) bsx.dsales += gross;
      if (rulerMine(S, c)) { const gv = tax * 0.2; S.player.gold += gv; S.player.led.inc.governor = (S.player.led.inc.governor || 0) + gv; fauc(S, 'governor', gv); }
    }
  }
  return { n, net, tax };
}

/* ---------- رحلات ---------- */
function dist(S, a, b) { const A = S.cities[a], B = S.cities[b]; return Math.hypot(A.x - B.x, A.y - B.y); }
const navOf = car => (car.captain ? car.captain.nav : 0);
function tripDays(S, car, a, b) {
  const hu = herdUnits(car), sp = SPEED * perkMul(S, 'speed') * (1 + 0.06 * navOf(car)) * (1 - 0.03 * (car.carts - 1)) * (car.morale < 40 ? 0.85 : 1) * (1 + (mountOf(car) ? mountOf(car).speed : 0)) * (hu > 0 ? 1 - Math.min(0.25, 0.15 + 0.1 * hu / 100) : 1);
  return Math.max(1, Math.ceil(dist(S, a, b) / sp * shortMul(S, a, b)));
}
/* القطيع الماشي: مواشٍ تمشي مع القافلة ولا تأخذ مكاناً في الحمولة، يرعاها رعاة بأجر (راعٍ لكل 20 وحدة قطيع). يُبطئ القافلة ويزيد علفها ونفوقها أقل من الحمولة */
const HERD_PER = 20, MAX_HERDERS = 5, HERDER_WAGE = 6, HERDER_FEE = 40;
const herdOf = car => car.herd || (car.herd = {});
/* التكاثر: كل نوع من مواشي القطيع ذكور وإناث وصغار. دورة الولادة T يوماً بحجم L، ويكبر الصغير في M يوماً. على الطريق يُنتج نصف السرعة وبشرط أن تكون القافلة سائرة وغير جائعة */
const BREED = { chicken: { T: 8, L: 5, M: 20, fu: 0.1 }, duck: { T: 8, L: 5, M: 20, fu: 0.1 }, sheep: { T: 40, L: 1.2, M: 40, fu: 1 }, goat: { T: 40, L: 1.3, M: 40, fu: 1 }, cow: { T: 70, L: 1, M: 80, fu: 2 }, buffalo: { T: 75, L: 1, M: 80, fu: 2 }, camel: { T: 100, L: 1, M: 120, fu: 2 }, horse: { T: 90, L: 1, M: 100, fu: 2 } };
const YOUNG_VAL = 0.5, YOUNG_SELL = 0.5, ROAD_BREED = 0.5, ROAD_YMORT = 3;
// الأصناف ترث جداول النوع، معدّلة بسماتها: خصوبة ← حجم الولادة، لحم ← غلّة الذبح، لبن/صوف ← غلّة المزرعة
const spOf = g => GD[g].sp || g;
BREEDS.forEach(b => {
  const B0 = BREED[b.sp]; BREED[b.id] = Object.assign({}, B0, { L: B0.L * (0.7 + 0.1 * b.tr.fert) });
  if (MEAT[b.sp]) MEAT[b.id] = MEAT[b.sp] * (0.7 + 0.1 * b.tr.meat);
  if (PRODUCT[b.sp]) { const p0 = PRODUCT[b.sp]; PRODUCT[b.id] = [p0[0], p0[1] * (0.7 + 0.1 * b.tr[b.sp === 'sheep' ? 'wool' : 'milk']), p0[2]]; }
});
for (const sp in HYB_NAMES) { BREED[sp + '_h'] = Object.assign({}, BREED[sp]); if (MEAT[sp]) MEAT[sp + '_h'] = MEAT[sp]; if (PRODUCT[sp]) PRODUCT[sp + '_h'] = PRODUCT[sp].slice(); }
const NEUTRAL = { meat: 3, milk: 3, wool: 3, speed: 3, endu: 3, fert: 3 }, HYB_LV = 5;
const trHold = (h, g) => (GD[g].hyb ? ((h.hx || {})[g] || {}).tr || NEUTRAL : GD[g].br ? GD[g].br.tr : NEUTRAL);
const pfHold = (h, g) => (GD[g].hyb ? ((h.hx || {})[g] || {}).pf || 1 : GD[g].pf || 1);
const hyMul = (h, g, k) => (GD[g].hyb ? 0.7 + 0.1 * trHold(h, g)[k] : 1);
const hyPf = (h, g) => (GD[g].hyb ? pfHold(h, g) : 1);
const spoilMul = (h, g) => (GD[g].hyb ? 1.3 - 0.1 * trHold(h, g).endu : 1);
const hybOf = sp => sp + '_h';
const hybridOpen = S => { const L = S.learn; return !(L && L.char) || L.level >= HYB_LV; };
function hybMove(src, dst, dstTotal, n) {
  if (!src.tr) return; if (!dst.tr || dstTotal <= 0) { dst.tr = Object.assign({}, src.tr); dst.pf = src.pf; return; }
  BR_KEYS.forEach(k => dst.tr[k] = (dst.tr[k] * dstTotal + src.tr[k] * n) / (dstTotal + n)); dst.pf = (dst.pf * dstTotal + src.pf * n) / (dstTotal + n);
}
// صنف مغلق على اللاعب حتى يبلغ مستوى فتحه (من لا تعليم عنده: مفتوح)
const breedOpen = (S, g) => { const lv = GD[g].lv; if (!lv) return true; const L = S.learn; return !(L && L.char) || L.level >= lv; };
const hxOf = (h, g) => { h.hx = h.hx || {}; return h.hx[g] || (h.hx[g] = { m: Math.round(((h.herd || {})[g] || 0) * 0.25), y: 0, b: 0, mq: 1, fq: 1, yq: 1 }); };
// سلالة الخيل: نجوم 1–5 للذكور (mq) والإناث (fq) والصغار (yq)؛ السعر × (0.8 + 0.2 × النجوم). المهر = متوسط الأبوين + تحسّن (أكبر في إسطبل المزرعة)
const pedMul = q => 0.8 + 0.2 * q;
const pedOf = (h, g) => { const x = (h.hx || {})[g]; if (!x) return 1; const a = (h.herd || {})[g] || 0, m = Math.min(x.m, a), f = a - m; return a > 0 ? ((x.mq || 1) * m + (x.fq || 1) * f) / a : 1; };
const pedMulOf = (h, g) => (spOf(g) === 'horse' ? pedMul(pedOf(h, g)) : 1) * hyPf(h, g);
const youngOf = (h, g) => (((h.hx || {})[g] || {}).y || 0);
const malesOf = (h, g) => Math.min((h.herd || {})[g] || 0, ((h.hx || {})[g] || {}).m || 0);
function herdScale(h, g, before) { const x = (h.hx || {})[g]; if (x && before > 0) { const k = Math.max(0, (h.herd || {})[g] || 0) / before; x.m *= k; if (x.p) x.p *= k; } }
// الحمل: الحوامل x.p تلد بعد مدة حمل G (نصف دورة الولادة)، ثم تعود للتلقيح. عند الاستقرار تبقى معدلات الولادة كما كانت (إناث × الحجم ÷ الدورة)
const gestOf = g => BREED[g].T * 0.5;
const pregOf = (h, g) => Math.floor(Math.min(((h.hx || {})[g] || {}).p || 0, Math.max(0, ((h.herd || {})[g] || 0) - malesOf(h, g))));
const SEXF = { m: 1, f: 1, p: 1.35 }; // سعر الشراء بحسب الجنس: ذكر، أنثى، أنثى حامل
function herdAdd(h, g, n, before) { const x = hxOf(h, g); x.m += n >= 2 ? Math.max(1, Math.round(n * 0.25)) : 0; }
function breedStep(S, h, g, mul, room, per, ymort) {
  const B = BREED[g], x = hxOf(h, g), a = (h.herd || {})[g] || 0; if (!B) return 0;
  if (x.y > 0) {
    x.y -= x.y * GD[g].spoil * spoilMul(h, g) * 1.5 * (ymort || 1); const mat = x.y / B.M; x.y -= mat;
    if (spOf(g) === 'horse' && mat > 0) { const m0 = Math.min(x.m, a), f0 = a - m0, nm = mat * 0.5, yq = x.yq || 1; if (m0 + nm > 0) x.mq = ((x.mq || 1) * m0 + yq * nm) / (m0 + nm); if (f0 + nm > 0) x.fq = ((x.fq || 1) * f0 + yq * nm) / (f0 + nm); }
    h.herd[g] = a + mat; x.m += mat * 0.5;
  }
  const A = (h.herd || {})[g] || 0, m = Math.min(x.m, A), f = A - m; let born = 0;
  // التزاوج: ذكور صنف آخر من النوع نفسه يلقّحون إناث هذا الصنف فيُنتجون هجيناً
  const pg = (h.pair || {})[g], cross = !!(pg && pg !== g && GD[pg] && spOf(pg) === spOf(g) && ((h.herd || {})[pg] || 0) >= 1), mm = cross ? malesOf(h, pg) : m;
  const G = gestOf(g); x.p = Math.min(x.p || 0, f);
  if (mul > 0 && mm >= 1) x.p += Math.max(0, Math.min(f, mm * 6) - x.p) * mul / (B.T - G);
  if (x.p > 0 && mul > 0) { const bn = x.p / G; x.p -= bn; x.b += bn * B.L * hyMul(h, g, 'fert'); }
  if (x.b > 0) {
    const n = Math.min(Math.floor(x.b), per > 0 ? Math.max(0, Math.floor(room / per)) : 0);
    if (n >= 1) {
      if (cross) {
        const H = hybOf(spOf(g)), hx = hxOf(h, H), tF = trHold(h, g), tM = trHold(h, pg), t = {}, tot = ((h.herd || {})[H] || 0) + hx.y, pf = (pfHold(h, g) + pfHold(h, pg)) / 2 * 1.05;
        BR_KEYS.forEach(k => t[k] = Math.min(5, (tF[k] + tM[k]) / 2 + (k === 'endu' || k === 'fert' ? 0.5 : 0)));
        if (!hx.tr || tot <= 0) { hx.tr = t; hx.pf = pf; } else { BR_KEYS.forEach(k => hx.tr[k] = (hx.tr[k] * tot + t[k] * n) / (tot + n)); hx.pf = (hx.pf * tot + pf * n) / (tot + n); }
        h.herd[H] = h.herd[H] || 0; hx.y += n; hx.firstDay = hx.firstDay || (S.day || 1);
      } else {
        if (spOf(g) === 'horse') { const nq = Math.min(5, Math.max(1, ((x.mq || 1) + (x.fq || 1)) / 2 + (h.stable ? 0.2 : 0.05) * (0.5 + rnd(S)))); x.yq = ((x.yq || 1) * x.y + nq * n) / (x.y + n); }
        x.y += n;
      }
      x.b -= n; born = n; if (cross) achFlag(S, 'hybrid_first'); achFlag(S, 'first_birth');
    } else if (x.b > 3) x.b = 3;
  }
  return born;
}
const herdUnits = car => { let u = 0; for (const g in (car.herd || {})) u += ((car.herd[g] || 0) + 0.5 * youngOf(car, g)) * (GD[g].hu || 0); return u; };
const herdCap = car => (car.herders || 0) * HERD_PER;
const holdings = car => { const h = Object.assign({}, car.cargo); for (const g in (car.herd || {})) h[g] = (h[g] || 0) + car.herd[g] + YOUNG_VAL * youngOf(car, g); return h; };
// علف المواشي يدخل في مؤن الرحلة: قمح يومياً لكل رأس في الحمولة أو في القطيع
const fodderDay = car => { let f = 0; for (const g in car.cargo) if (GD[g].fod) f += (car.cargo[g] || 0) * GD[g].fod; if (car.herd) for (const g in car.herd) if (GD[g].fod) f += ((car.herd[g] || 0) + 0.5 * youngOf(car, g)) * GD[g].fod; return f; };
const supplyNeed = (car, days) => Math.ceil((car.crew * 0.12 + fodderDay(car)) * days);
const customsOf = (S, from, to, cargo) => (S.cities[from].country === S.cities[to].country ? 0 : CD[S.cities[to].country].customs * perkMul(S, 'customs') * valueOf(cargo) * (bossActive(S) && pactIn(S, to, 'alliance') ? 0.5 : 1));
function startTrip(S, car, dest) {
  if (car.left > 0) return { ok: false, msg: 'القافلة في الطريق' };
  { const tb = travelBlock(S, car, dest); if (tb) return { ok: false, msg: tb }; }
  { const sb = car.main ? shockBlock(S, car.city, dest) : null; if (sb) return { ok: false, msg: sb }; }
  if (dest === car.city) return { ok: false, msg: 'أنت في هذه المدينة' };
  const c = S.cities[car.city]; ctxFor(S, car.city);
  const days = tripDays(S, car, car.city, dest), need = supplyNeed(car, days), cost = need * unitPrice(c, 'wheat') * perkMul(S, 'prov');
  let prem = car.insured ? valueOf(holdings(car)) * TK.tripRate : 0;
  car.hungry = false;
  if (S.player.gold < cost + prem) {
    if (S.player.gold < cost * 0.3) return { ok: false, msg: 'رصيدك لا يكفي حتى لأقل مؤن (' + Math.ceil(cost * 0.3) + ')' };
    car.hungry = true; prem = 0; if (car.main) learnReact(S, 'hungry', 15);
  }
  pPay(S, 'provisions', Math.min(cost, S.player.gold), true);
  if (prem) tkContribute(S, pPay(S, 'takaful', prem));
  c.stock.wheat = Math.max(0, c.stock.wheat - need);
  car.supplies = need;
  car.from = car.city; car.dest = dest; car.left = days; car.total = days;
  return { ok: true, days, cost: Math.ceil(cost) };
}
/* قطاع الطرق: قتال بالدفاع مقابل قوة الجماعة B؛ الهزيمة تنهب 15–40٪ (أقل بالتأمين). في اللعبة البشرية يختار اللاعب الأسلوب (S.road) وإلا فالقتال الافتراضي */
const roadOn = S => !!(S.learn && S.learn.char && S.learn.level >= 3 && !S.noEvents);
const defenseOf = car => (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
function banditFight(S, car, to, B, defMul) {
  const defense = defenseOf(car) * defMul;
  if (defense >= B) { if (car.main) { news(S, 'صدّ حرّاسك قطاع طرق في الطريق إلى ' + S.cities[to].name + '!', 'good'); learnReact(S, 'banditsRepel', 30); } return { repelled: true }; }
  let f = rr(S, 0.15, 0.4) * perkMul(S, 'banditLoss');
  let lost = 0;
  for (const g in car.cargo) { const l = Math.floor(car.cargo[g] * f); car.cargo[g] -= l; lost += l * mid(g); }
  for (const g in (car.herd || {})) { const b0 = car.herd[g], l = Math.floor(b0 * f); car.herd[g] -= l; lost += l * mid(g); herdScale(car, g, b0); const x = (car.hx || {})[g]; if (x) x.y -= Math.floor(x.y * f); }
  car.morale = Math.max(0, car.morale - 15);
  const comp = car.insured ? tkClaim(S, lost, TK.cover) : 0;
  learnReact(S, 'bandits', 20); sink(S, 'bandits', lost); S.player.led.exp.bandits = (S.player.led.exp.bandits || 0) + lost;
  news(S, (car.main ? '' : car.name + ': ') + 'نهب قطاع الطرق نحو ' + Math.round(f * 100) + '٪ من البضاعة قرب ' + S.cities[to].name + '.', 'bad');
  S.pause = true; syncBasis(car);
  return { repelled: false, f, lost };
}
function arrive(S, car) {
  const to = car.dest; car.city = to; car.dest = null; car.trips++; S.player.trips++; ctxFor(S, to); learnArrive(S, car, to);
  const natH = capRole(car) === 'native' ? car.captain.home : null, cu = customsOf(S, car.from, to, holdings(car)) * (natH && S.cities[to].country === natH ? 0.7 : 1), val0 = valueOf(car.cargo);
  if (cu > 0) {
    let paid = pPay(S, 'customs', cu, true), short = cu - paid, seized = 0;
    for (const g in car.cargo) { if (short <= 0) break; const n = Math.min(Math.floor(car.cargo[g]), Math.ceil(short / mid(g))); if (n > 0) { car.cargo[g] -= n; short -= n * mid(g); seized += n * mid(g); } }
    const totCu = paid + seized; if (val0 > 0) for (const g in car.basis) car.basis[g].c += totCu * (car.basis[g].q * mid(g)) / val0;
    if (seized > 0) { sink(S, 'customs', seized); S.player.led.exp.customs = (S.player.led.exp.customs || 0) + seized; }
    if (car.main) news(S, 'جمارك ' + Math.round(paid + seized) + ' عند دخول ' + CD[S.cities[to].country].name + (seized > 0 ? ' (صودرت بضاعة لتغطية ما نقص من رصيدك)' : '') + '.', seized > 0 ? 'bad' : '');
  }
  const key = riskKey(car.from, to);
  const defense = (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
  const guarded = bossActive(S) && (pactIn(S, car.from, 'guard') || pactIn(S, to, 'guard'));
  const natMul = natH && (S.cities[car.from].country === natH || S.cities[to].country === natH) ? 0.8 : 1;
  if (capRole(car) === 'envoy') { const bs = S.bosses && S.bosses[to]; if (bs && bs.trust < 50 && S.day - (bs.envDay == null ? -99 : bs.envDay) >= 5) { bs.trust = Math.min(50, bs.trust + 1.5); bs.envDay = S.day; if (S.learn && S.learn.char) news(S, car.captain.name + ' مهّد لك عند ' + bs.name + ': زادت ثقته بك.', 'good'); } }
  if (!guarded && rnd(S) < S.risk[key] * natMul) {
    const B = rr(S, 4, 16);
    if (car.main && roadOn(S) && !S.road) { S.road = { k: 'bandits', day: S.day, car: car.id, to, from: car.from, B }; S.pause = true; learnReact(S, 'roadBandits'); }
    else banditFight(S, car, to, B, 1);
  }
  syncBasis(car); snapshotKnown(S, [to]);
  if (car.captain) { car.captain.xp++; if (car.captain.xp % 6 === 0) { const sk = ['trade', 'nav', 'combat'][Math.floor(rnd(S) * 3)]; if (car.captain[sk] < 5) car.captain[sk]++; } }
  if (car.main) { news(S, 'وصلت قافلتك إلى ' + S.cities[to].name + '.'); S.pause = true; }
}
function snapshotKnown(S, ids) {
  ids.forEach(id => {
    const c = S.cities[id], p = {}, st = {};
    GIDS.forEach(g => { p[g] = Math.round(unitPrice(c, g) * 10) / 10; st[g] = Math.round(c.stock[g]); });
    S.player.known[id] = { day: S.day, p, st };
  });
}

/* ---------- أدوار القادة الستة والولاء والراتب ----------
   lux خبير السلع الثمينة: يبيع الكماليات والمصنّعات بعلاوة 4٪ ويشتريها أرخص 3٪ · eyes عيون الأسواق: ينبّهك لأسعار صاعدة وغضب الزعماء
   native ابن البلد: جمارك أقل 30٪ وخطر طرق أقل 20٪ حول بلده · envoy رسول الزعماء: يرفع ثقة زعماء ما يزور من مدن
   indep المستقل: يتاجر بلا مسار فيختار أفضل صفقة كل مرة · loyal الوفيّ: أجره أقل 10٪ وولاؤه ثابت.
   لكل قائد ولاء (0–100): يزيد بالأجر في موعده والعلاوة، وينقص بتأخّره، وتحت 25 يترك العمل (في لعبة التعلّم). */
const ROLES = {
  lux: { name: 'خبير السلع الثمينة', desc: 'يبيع الكماليات والمصنّعات بعلاوة 4٪ ويشتريها أرخص بـ3٪' },
  eyes: { name: 'عيون الأسواق', desc: 'ينبّهك بالأسعار الصاعدة وغضب الزعماء' },
  native: { name: 'ابن البلد', desc: 'جمارك أقل 30٪ وخطر طرق أقل 20٪ حول بلده' },
  envoy: { name: 'رسول الزعماء', desc: 'يرفع ثقة زعماء المدن التي يزورها' },
  indep: { name: 'المستقل', desc: 'يتاجر وحده بلا مسار: يختار أفضل صفقة كل مرة' },
  loyal: { name: 'الوفيّ', desc: 'أجره أقل 10٪ وولاؤه ثابت لا يتأرجح' },
};
const ROLE_KEYS = Object.keys(ROLES), CAP_NAMES = ['مطلق', 'بدر', 'تركي', 'فيصل', 'عيد', 'حمد', 'سلمان', 'ناصر', 'جابر', 'ماجد', 'رشيد', 'سالم'];
const CAP_RAISE_MAX = 0.6, CAP_QUIT = 25;
function captainPool(S) {
  let t = ((S.day + 1) * 7919 + S.player.caravans.length * 104729) >>> 0;
  const r = () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const used = new Set(), out = [];
  for (let i = 0; i < 3; i++) {
    let role; do { role = ROLE_KEYS[Math.floor(r() * 6)]; } while (used.has(role)); used.add(role);
    const sk = () => 1 + Math.floor(r() * 3), trade = sk(), nav = sk(), combat = sk();
    out.push({ i, name: CAP_NAMES[Math.floor(r() * CAP_NAMES.length)], role, home: COUNTRIES[Math.floor(r() * COUNTRIES.length)].id, trade, nav, combat, fee: 1200 + 150 * (trade + nav + combat) });
  }
  return out;
}
const capRole = car => (car.captain && car.captain.role) || null;
const capWage = car => { const cp = car.captain; return cp ? (4 + 2 * (cp.trade + cp.nav + cp.combat) / 3) * (1 + (cp.raise || 0)) * (cp.role === 'loyal' ? 0.9 : 1) : 0; };
const isLuxish = g => !!(GD[g].lux || GD[g].tier === 'proc');
// عيون الأسواق: تنبيه يومي واحد بأعلى سعر صاعد لبضاعة معك، وغضب الزعماء
function eyesDay(S) {
  if (!S.player.caravans.some(c => capRole(c) === 'eyes') || !(S.learn && S.learn.char)) return;
  const memo = S.alerts = S.alerts || {}, held = new Set(); S.player.caravans.forEach(c => { for (const g in c.cargo) if (c.cargo[g] >= 1) held.add(g); });
  for (const id in S.player.props) for (const g in S.player.props[id].store) if (S.player.props[id].store[g] >= 1) held.add(g);
  let best = null;
  S.order.forEach(id => { const c = S.cities[id]; held.forEach(g => { const rt = ratio(c, g); if (rt >= 1.25 && S.day - (memo[id + g] || -99) >= 6 && (!best || rt > best.rt)) best = { id, g, rt }; }); });
  if (best) { memo[best.id + best.g] = S.day; news(S, 'عيون الأسواق: ' + GD[best.g].name + ' في ' + S.cities[best.id].name + ' أعلى من المعتاد بنحو ' + Math.round((best.rt - 1) * 100) + '٪ وعندك منه. فكّر في بيعه هناك.', 'alert'); }
  S.order.forEach(id => { const b = S.bosses && S.bosses[id]; if (b && b.trust <= -30 && S.day - (memo['b' + id] || -99) >= 20) { memo['b' + id] = S.day; news(S, 'عيون الأسواق: ' + b.name + ' في ' + S.cities[id].name + ' غاضب عليك (ثقته ' + Math.round(b.trust) + '). أهدِه أو فاوضه قبل أن يشتد.', 'alert'); } });
}
// المستقل: يختار أفضل صفقة للقافلة نفسها ويسافر
function autoIndep(S, car) {
  const P = S.player, c = S.cities[car.city]; ctxFor(S, car.city);
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) { const res = sellUnits(S, P, c, g, car.cargo[g], car.cargo, true, 1 + 0.015 * car.captain.trade); if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost); } }
  const d = bestDeal(S, car, P.gold * 0.4);
  if (!d) { car.waiting = 'لا صفقة مجزية الآن'; return; }
  const room = capOfCar(car) - loadOf(car), budget = { gold: Math.min(P.gold * 0.4, d.cost * 1.1) }, res = buyUnits(S, budget, c, d.g, Math.min(d.q, room / GD[d.g].w), room, car.cargo, true);
  if (res.n < 1) { car.waiting = 'تعذّر الشراء'; return; }
  P.gold -= res.cost; addBasis(car.basis, d.g, res.n, res.cost);
  const r = startTrip(S, car, d.dest); car.waiting = r.ok ? null : r.msg;
}
/* ---------- القادة والمسارات الآلية ---------- */
function autoRoute(S, car) {
  const r = car.route; if (!r) return;
  const P = S.player, c = S.cities[car.city], cap = capOfCar(car);
  ctxFor(S, car.city);
  const haggle = 1 + 0.015 * (car.captain ? car.captain.trade : 0), lux = capRole(car) === 'lux';
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) {
    const q = Math.floor(car.cargo[g]), res = sellUnits(S, P, c, g, q, car.cargo, true, haggle * (lux && isLuxish(g) ? 1.04 : 1));
    if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost); }
  }
  const buyG = car.city === r.a ? r.buyA : car.city === r.b ? r.buyB : r.buyA;
  if (buyG) {
    const pr = P.props[car.city];
    if (pr && pr.store[buyG] >= 1) {
      const q = Math.min(pr.store[buyG], Math.floor((cap - loadOf(car)) / GD[buyG].w));
      const cost = takeBasis(pr.basis || (pr.basis = {}), buyG, q); pr.store[buyG] -= q; car.cargo[buyG] = (car.cargo[buyG] || 0) + q; addBasis(car.basis, buyG, q, cost);
    }
    const room = cap - loadOf(car);
    if (room >= GD[buyG].w && ratio(c, buyG) < 1.08) {
      const budget = { gold: P.gold * 0.7 };
      const res = buyUnits(S, budget, c, buyG, room / GD[buyG].w, room, car.cargo, true, false, lux && isLuxish(buyG) ? 0.97 : 1);
      P.gold -= res.cost; addBasis(car.basis, buyG, res.n, res.cost);
    }
  }
  const dest = car.city === r.a ? r.b : r.a;
  const res = startTrip(S, car, dest);
  car.waiting = res.ok ? null : res.msg;
}

/* ---------- يوم واحد ---------- */
function fxDay(S) {
  const f = S.fx; let war = 0, boom = 0;
  for (const id of S.order) { const e = S.cities[id].ev; if (e && e.k === 'war') war++; if (e && e.k === 'boom') boom++; }
  f.usd = clamp(f.usd + 0.05 * (FX0.usd - f.usd) + (rnd(S) - 0.5) * 0.03, 3.5, 4.0);
  f.gold = clamp(f.gold + 0.02 * (FX0.gold - f.gold) + f.gold * ((rnd(S) - 0.5) * 0.024 + 0.0006 * war - 0.0003 * boom), 180, 480);
  f.silver = +silverAt(f.gold, S.day).toFixed(3); (f.hs = f.hs || []).push(f.silver); if (f.hs.length > 60) f.hs.shift();
  f.hu.push(+f.usd.toFixed(3)); f.hg.push(+f.gold.toFixed(1)); if (f.hu.length > 60) f.hu.shift(); if (f.hg.length > 60) f.hg.shift();
}
function tick(S) {
  S.day++; S.pause = false; S.ctxCur = 'sar'; fxDay(S);
  if (S.road && S.road.day < S.day) roadAuto(S);
  shockDay(S); seasonDay(S); eyesDay(S);
  for (const id of S.order) cityDay(S, S.cities[id]);
  for (const sh of (S.shocks || [])) { const K = SHOCKS[sh.k]; if (sh.st === 'on' && K && K.day) K.day(S, sh); }
  agentsDay(S); rivalDay(S);
  playerDay(S);
  ordersDay(S);
  debtDay(S); babEventDay(S); freedomDay(S); learnCheck(S); zakatDay(S); advisorDay(S); achDay(S); yearDay(S); cardDay(S);
  const nw = netWorth(S);
  for (let ph = 2; ph <= 4; ph++) if (S.phase < ph && nw >= PHASE_AT[ph - 1]) {
    S.phase = ph; learnReact(S, 'phase' + ph); news(S, 'فُتح الطور ' + ph + ': ' + ['', '', 'الدكاكين والأسطول', 'التكامل الصناعي', 'الإمبراطورية المالية'][ph - 1] + '! لا شيء ممّا بنيتَه يُصادَر.', 'good'); S.pause = true;
  }
  S.hist.nw.push(Math.round(nw)); if (S.hist.nw.length > 150) S.hist.nw.shift();
  for (const id of S.order) {
    const c = S.cities[id], h = S.hist.px[id] || (S.hist.px[id] = {});
    GIDS.forEach(g => { const a = h[g] || (h[g] = []); a.push(+unitPrice(c, g).toFixed(1)); if (a.length > 40) a.shift(); });
  }
  const live = Object.keys(S.player.props).filter(k => hasPresence(S, k)); if (live.length) snapshotKnown(S, live);
  S.ctxCur = 'sar';
}

function cityDay(S, c) {
  GIDS.forEach(g => { c.idx[g] = clamp(c.idx[g] + 0.08 * (1 - c.idx[g]) + (rndG(S, g) - 0.5) * 0.05, 0.8, 1.25); });
  if (c.ev) { c.ev.left--; if (c.ev.left <= 0) c.ev = null; }
  else if (rnd(S) < 0.012) {
    const k = ['boom', 'bust', 'plague', 'festival', 'war'][Math.floor(rnd(S) * 5)];
    c.ev = { k, left: { boom: 20, bust: 15, plague: 12, festival: 8, war: 25 }[k] };
    news(S, ({ boom: 'ازدهار في ', bust: 'كساد في ', plague: 'وباء في ', festival: 'مهرجان في ', war: 'حصار وحرب قرب ' })[k] + c.name + ' (' + CD[c.country].name + ')', k === 'boom' || k === 'festival' ? 'good' : 'bad');
  }
  const pt = popTotal(c);
  const tm = 1 + 0.15 * (c.tier - 1), pm = c.ev && c.ev.k === 'plague' ? 0.6 : 1;
  const hv = seasonsOn(S) && seasonAt(S.day) === 'harvest';
  GIDS.forEach(g => { const base = (c.prod[g] || 0) * tm + (c.extra[g] || 0); if (base) c.stock[g] += base * pm * (c.sh ? shockProdMul(c, g) : 1) * (hv && (GD[g].tier === 'raw' || g === 'wheat') ? SEASONS.harvest.mul : 1); });
  let luxN = 0, luxD = 0, foodSat = 1;
  GIDS.forEach(g => {
    const G = GD[g]; let d = demandOf(c, g) * seasonMul(S, c, g); c.dem[g] = d;
    if (!G.ess) d *= clamp(1.5 - 0.8 * ratio(c, g), 0.3, 1.3);
    const got = Math.min(c.stock[g], d); c.stock[g] -= got;
    if (G.ess) foodSat = d > 0 ? got / d : 1;
    if (G.lux) { luxN += got; luxD += d; }
  });
  c.sat.food += 0.2 * (foodSat - c.sat.food);
  c.sat.lux += 0.2 * ((luxD > 0 ? luxN / luxD : 1) - c.sat.lux);
  GIDS.forEach(g => {
    const cp = capG(c, g);
    // السلعة التي لا تنتجها المدينة لا يمتلئ رفّها وحده إلا ببطء: تبقى نادرة حتى يصلها تاجر أو يُنتَج فيها (extra)
    c.stock[g] += ((isOwn(c, g) || (c.extra[g] || 0) > 0) ? 0.03 : PULL_FAR) * (0.45 * cp - c.stock[g]);
    c.stock[g] = clamp(c.stock[g], 0, cp * 1.2);
  });
  const extraSum = Object.values(c.extra).reduce((a, v) => a + v, 0);
  const jobs = pt * 0.78 + c.factJobs + extraSum * 8;
  const free = jobs - (c.pop[1] + c.pop[2] + c.pop[3]);
  const mv = (i, j, n) => { n = Math.min(Math.max(0, n), c.pop[i]); c.pop[i] -= n; c.pop[j] += n; };
  if (free > 0) mv(0, 1, Math.min(free, c.pop[0] * 0.04));
  if (c.sat.food > 0.9) mv(1, 2, c.pop[1] * 0.003);
  if (c.sat.lux > 0.7 && c.sat.food > 0.9) mv(2, 3, c.pop[2] * 0.002);
  if (c.sat.food < 0.7) { mv(1, 0, c.pop[1] * 0.02); mv(2, 1, c.pop[2] * 0.01); mv(3, 2, c.pop[3] * 0.01); }
  const maxPop = 1500 * c.size * (1 + 0.3 * (c.tier - 1));
  let gr = 0;
  if (c.sat.food > 0.95 && pt < maxPop) gr = 0.002;
  if (c.sat.food < 0.6) gr = -0.005;
  if (c.ev && c.ev.k === 'plague') gr -= 0.008;
  if (gr) c.pop[0] = Math.max(10, c.pop[0] + pt * gr);
  GIDS.forEach(g => {
    const q = ratio(c, g);
    c.short[g] = q > 1.3 ? c.short[g] + 1 : Math.max(0, c.short[g] - 1);
    c.glut[g] = q < 0.6 ? c.glut[g] + 1 : Math.max(0, c.glut[g] - 1);
  });
}

/* ---------- الوكلاء ---------- */
function agentsDay(S) {
  for (const a of S.agents) {
    const up = Math.min(a.gold, 5 + a.gold * 0.015); sink(S, 'agentUpkeep', up); a.gold -= up;
    if (a.left > 0) {
      a.left--;
      if (a.left === 0) {
        const c = S.cities[a.dest]; a.city = a.dest; a.dest = null;
        const cu = Math.min(a.gold, customsOf(S, a.from, a.city, a.cargo)); if (cu > 0) { a.gold -= cu; sink(S, 'customs', cu); }
        if (rnd(S) < S.risk[riskKey(a.from, a.city)] * 0.5) { for (const g in a.cargo) { const l = Math.floor(a.cargo[g] * 0.3); a.cargo[g] -= l; } }
        for (const g of GIDS) if ((a.cargo[g] || 0) >= 1) sellUnits(S, a, c, g, a.cargo[g], a.cargo, false, 1);
      }
      continue;
    }
    const c = S.cities[a.city];
    if (a.gold < 40 && !Object.keys(a.cargo).some(g => a.cargo[g] >= 1)) { a.gold += 300; fauc(S, 'bailout', 300); S.stats.bailouts = (S.stats.bailouts || 0) + 1; }
    let best = null;
    for (const g of GIDS) {
      if (GD[g].sp || GD[g].fresh || g === c.sig && exclusiveAt(S, a.city)) continue;
      const pb = unitPrice(c, g) * 1.01;
      for (const d of S.order) {
        if (d === a.city) continue;
        const dc = S.cities[d];
        const cus = dc.country === c.country ? 0 : CD[dc.country].customs;
        const ps = unitPrice(dc, g) * (1 - dc.tax - cus) * (0.92 + rnd(S) * 0.16);
        const days = Math.max(1, Math.ceil(dist(S, a.city, d) / SPEED));
        const fu = (GD[g].fod || 0) * days * unitPrice(c, 'wheat'), m = (ps - pb - fu) / days / pb;
        if (!best || m > best.m) best = { g, d, m, days, fu };
      }
    }
    if (best && best.m > 0.012) {
      const G = GD[best.g];
      const qty = Math.min(a.cap / G.w, a.gold * 0.9 / unitPrice(c, best.g), c.stock[best.g] * 0.35);
      const res = buyUnits(S, a, c, best.g, qty, a.cap, a.cargo, false);
      if (res.n > 0) { const fc = Math.min(a.gold, res.n * best.fu); a.gold -= fc; sink(S, 'provisions', fc); a.from = a.city; a.dest = best.d; a.left = best.days; a.total = best.days; }
    }
    if (a.gold > 6000) {
      let pick = null;
      for (const id of S.order) { const cc = S.cities[id]; for (const g of GIDS) if (!GD[g].sp && cc.short[g] > 20 && (cc.extra[g] || 0) < 12 && (S.day >= 200 || isOwn(cc, g))) { pick = { cc, g }; break; } if (pick) break; }
      if (pick) { a.gold -= 2500; sink(S, 'investment', 2500); pick.cc.extra[pick.g] = (pick.cc.extra[pick.g] || 0) + 3; pick.cc.short[pick.g] = 0; news(S, 'استثمر تاجر في إنتاج ' + GD[pick.g].name + ' بمدينة ' + pick.cc.name + ' لسدّ النقص.'); }
    }
  }
  for (const id of S.order) { const c = S.cities[id]; for (const g in c.extra) if (c.extra[g] > 0 && c.glut[g] > 25) { c.extra[g] = Math.max(0, c.extra[g] - 3); c.glut[g] = 0; } }
}

/* ---------- المصانع: محلية (كما كانت) وغير محلية بجودة وصحة ومدير أعمال ---------- */
const CRAFT_TRUST = 10, CRAFT_COST = 2500, CRAFT_OPEN = 40;
// المصنع محلي إن كانت الدولة دولة الصنعة الأصلية (للخمس الأولى) أو كانت المدينة تنتج السلعة فعلاً (للبقية)
const factoryLocal = (c, rc) => rc.country === c.country && (rc.old || c.makes.includes(rc.out));
// ما يمنع المصنع غير المحلي: إذن الزعيم صاحب المنتج
function factoryMakeBlock(S, city, recipe) {
  const rc = RECIPES[recipe]; if (S.cities[city].makes.includes(rc.out) && !rc.old) return null;
  const origin = S.order.find(id => S.cities[id].sig === rc.out); if (!origin || origin === city || !bossActive(S)) return null;
  const bs = bossOf(S, origin); if (!bs || bs.craft || bs.trust >= CRAFT_OPEN) return null;
  return 'تصنيع ' + GD[rc.out].name + ' خارج ' + S.cities[origin].name + ' يلزمه إذن كبير تجّارها (ثقته بك ' + CRAFT_OPEN + ' أو «نقل الصنعة» بـ ' + CRAFT_COST + ')';
}
const FACT_HP = { wage: 6, mats: 2, rep: 1, zakat: 1, broke: 8, heal: 2, grace: 30, crisis: 20, forced: 0.4, rescue: 0.10 };
const isAbroad = f => f.local === false;
const factoryBase = f => { const rc = RECIPES[f.recipe]; return isAbroad(f) ? MFG_COST(rc.out) : 4000; };
const factoryValue = f => factoryBase(f) * (1 + 0.4 * (f.level - 1));
function factoryQual(S, f) {
  if (!isAbroad(f)) return 1;
  const pr = S.player.props[f.city], mg = pr && mgrOk(S, f.city, pr);
  let q = reputation(S).quality / 100 + (mg && pr.mgr.lv === 3 ? 0.03 : 0);
  if ((f.hp == null ? 100 : f.hp) < 50) q *= 0.85;
  return clamp(q, 0.3, 0.9);
}
function factoryDay(S, f) {
  const P = S.player, c = S.cities[f.city], rc = RECIPES[f.recipe], pr = P.props[f.city];
  if (!c || !rc) return;
  ctxFor(S, f.city);
  if (!isAbroad(f)) { // المحلي: سلوك ثابت كما كان
    c.factJobs += 80 * f.level; pPay(S, 'wages', rc.wage * f.level, true); pPay(S, 'upkeep', 0.0015 * 2500 * f.level, true);
    if (!pr) return;
    for (let b = 0; b < 4 * f.level; b++) {
      let ok = true;
      for (const g in rc.inp) if ((pr.store[g] || 0) < rc.inp[g]) {
        { const rs = buyUnits(S, P, c, g, rc.inp[g] - (pr.store[g] || 0), storeRoom(S, f.city), pr.store, true, true); pr.basis = pr.basis || {}; addBasis(pr.basis, g, rs.n, rs.cost); }
        if ((pr.store[g] || 0) < rc.inp[g]) ok = false;
      }
      if (!ok || storeRoom(S, f.city) < GD[rc.out].w * rc.n) break;
      let inCost = 0; pr.basis = pr.basis || {};
      for (const g in rc.inp) { pr.store[g] -= rc.inp[g]; inCost += takeBasis(pr.basis, g, rc.inp[g]); }
      pr.store[rc.out] = (pr.store[rc.out] || 0) + rc.n; addBasis(pr.basis, rc.out, rc.n, inCost); achFlag(S, 'factory_first');
      fauc(S, 'factory', rc.n * mid(rc.out));
    }
    return;
  }
  // غير محلي
  f.hp = f.hp == null ? 100 : f.hp; f.set = f.set || { minBal: 0, maxBuy: 1.3, sell: 'hold' }; f.acc = f.acc || 0; f.accCost = f.accCost || 0;
  if (f.crisis) { // أزمة: الإنتاج متوقف حتى الإنقاذ، وبعد المهلة يُباع إجبارياً
    c.factJobs += 20 * f.level;
    if (S.day - f.crisis.day >= FACT_HP.crisis) { const v = Math.round(factoryValue(f) * FACT_HP.forced + (insOn(S, f.city) ? tkClaim(S, factoryValue(f) * (1 - FACT_HP.forced), TK.coverFactory) : 0)); P.gold += v; P.factories = P.factories.filter(x => x !== f); news(S, 'بِيع ' + rc.name + ' في ' + c.name + ' إجبارياً بـ ' + fmtN(v) + ' ريال لأنه لم يُنقَذ في مهلته.', 'bad'); learnReact(S, 'factoryLost'); }
    return;
  }
  c.factJobs += 80 * f.level;
  const wage = rc.wage * f.level, paid = pPay(S, 'wages', wage, true); pPay(S, 'upkeep', 0.0015 * 2500 * f.level, true);
  const mg = pr && mgrOk(S, f.city, pr), over = pr && pr.mgr && !mg, q = factoryQual(S, f), set = f.set;
  const waste = over ? 0.2 : mg && pr.mgr.lv === 1 ? 0.10 : 0;
  let made = 0, short = false;
  if (pr) {
    pr.basis = pr.basis || {};
    for (let b = 0; b < 4 * f.level; b++) {
      let ok = true;
      for (const g in rc.inp) {
        const need = rc.inp[g] * (1 + waste);
        if ((pr.store[g] || 0) < need) {
          const may = !mg || (P.gold >= set.minBal && ratio(c, g) <= set.maxBuy);
          if (may) { const rs = buyUnits(S, P, c, g, Math.ceil(need - (pr.store[g] || 0)), storeRoom(S, f.city), pr.store, true, true); addBasis(pr.basis, g, rs.n, rs.cost); }
          if ((pr.store[g] || 0) < need) ok = false;
        }
      }
      if (!ok) { short = true; break; }
      if (storeRoom(S, f.city) < GD[rc.out].w * rc.n) break;
      let inCost = 0;
      for (const g in rc.inp) { const need = rc.inp[g] * (1 + waste); pr.store[g] -= need; inCost += takeBasis(pr.basis, g, need); }
      f.acc += rc.n * (0.5 + 0.5 * q); f.accCost += inCost;
      const k = Math.floor(f.acc);
      if (k >= 1) { f.acc -= k; achFlag(S, 'factory_first'); pr.store[rc.out] = (pr.store[rc.out] || 0) + k; addBasis(pr.basis, rc.out, k, f.accCost, q); f.accCost = 0; made += k; fauc(S, 'factory', k * mid(rc.out) * q); }
    }
    if (mg && set.sell === 'now' && (pr.store[rc.out] || 0) >= 1) {
      const qm = qualOf(pr.basis, rc.out), r = sellUnits(S, P, c, rc.out, pr.store[rc.out], pr.store, true, qm);
      if (r.n > 0) { const cost = takeBasis(pr.basis, rc.out, r.n); logTrade(S, f.city, rc.out, r.n, 'shop', r.net, r.net - cost); P.led.inc.shops = (P.led.inc.shops || 0) + r.net; f.sold = (f.sold || 0) + r.n; f.rev = (f.rev || 0) + r.net; }
    }
  }
  f.made = (f.made || 0) + made;
  // صحة المصنع
  const R = repOf(P); let d = 0;
  if (paid < wage - 1e-9) { f.late = (f.late || 0) + 1; d -= FACT_HP.wage; } else f.late = 0;
  if (short && made === 0) d -= FACT_HP.mats;
  if (reputation(S).total < 40) d -= FACT_HP.rep;
  if (S.zakat && S.zakat.due && S.zakat.defer) d -= FACT_HP.zakat;
  if ((R.broke || 0) > (f.brk || 0)) { d -= FACT_HP.broke; }
  f.brk = R.broke || 0;
  const grace = S.day - (f.since || 0) < FACT_HP.grace;
  if (d === 0) d = FACT_HP.heal; else if (grace) d = Math.max(0, d);
  const hp0 = f.hp; f.hp = clamp(f.hp + d, 0, 100);
  if (f.hp < 40 && hp0 >= 40) learnReact(S, 'factoryWeak', 20, rc.name);
  if (f.hp <= 0) { f.crisis = { day: S.day }; news(S, 'انهار ' + rc.name + ' في ' + c.name + '! أنقذه خلال ' + FACT_HP.crisis + ' يوماً بغرامة ' + Math.round(FACT_HP.rescue * 100) + '٪ من قيمته وإلا بِيع بـ' + Math.round(FACT_HP.forced * 100) + '٪.', 'bad'); learnReact(S, 'factoryCrisis'); }
}
const fmtN = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/* مدير أعمال المدينة: واحد لكل مدينة بثلاثة مستويات. يشغّل إعدادات المصانع (حدّ الرصيد، أعلى سعر مواد، بيع فوري)، المبتدئ يهدر 10٪ من المواد، والخبير يرفع الجودة 3٪.
   إن زادت الأصول عن طاقته (3/6/10) فهو مُرهَق. وإن لم تراجع حساباته 10 أيام فقد يختلس (≈3٪). */
const MGR = [null, { name: 'مدير مبتدئ', wage: 15, cap: 3 }, { name: 'مدير متمرّس', wage: 35, cap: 6 }, { name: 'مدير خبير', wage: 70, cap: 10 }];
const MGR_AUDIT = 10, MGR_THEFT = 0.03;
const assetsIn = (S, city) => { const pr = S.player.props[city]; if (!pr) return 0; return ownShops(pr) + (pr.whs || 0) + (pr.farm ? 1 : 0) + (pr.butcher ? 1 : 0) + S.player.factories.filter(f => f.city === city).length; };
const mgrOk = (S, city, pr) => !!(pr && pr.mgr && assetsIn(S, city) <= MGR[pr.mgr.lv].cap);
function mgrDay(S, city, pr) {
  const m = pr.mgr, c = S.cities[city], w = MGR[m.lv].wage; ctxFor(S, city);
  const paid = pPay(S, 'staff', w, true); m.late = paid < w - 1e-9 ? (m.late || 0) + 1 : 0;
  if (m.late >= 3) { pr.mgr = null; news(S, 'ترك مدير أعمال ' + c.name + ' العمل لأن أجره تأخّر.', 'bad'); return; }
  if (S.day - (m.audit == null ? m.since : m.audit) >= MGR_AUDIT && rndB(S) < MGR_THEFT / 30) {
    const take = Math.min(Math.round(valueOf(pr.store) * 0.08) + 150, 4000); pr.mgr = null;
    for (const g in pr.store) { pr.store[g] *= 0.92; }
    news(S, 'اختلس مدير أعمال ' + c.name + ' نحو ' + fmtN(take) + ' ريال وهرب! راجع حسابات المدير كل ' + MGR_AUDIT + ' أيام.', 'bad'); learnReact(S, 'mgrTheft');
  }
}
/* ---------- الحوارات والمهام الصغيرة (بيانات src/dialogs.js) ---------- */
const stOf = S => S.story || (S.story = { flags: {}, cool: {}, quests: {}, cur: null });
const cmp = (a, op, b) => (op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : op === '<' ? a < b : a === b);
const questState = (S, id) => { const q = stOf(S).quests[id]; return q ? q.state : 'none'; };
const hasGood = (S, g) => { const car = mainCar(S); return Math.floor(car.cargo[g] || 0); };
function dlgOk(S, conds) {
  const st = stOf(S);
  return (conds || []).every(c => {
    switch (c[0]) {
      case 'flag': return !!st.flags[c[1]];
      case 'not': return !st.flags[c[1]];
      case 'gold': return cmp(S.player.gold, c[1], c[2]);
      case 'trust': { const b = bossOf(S, c[1]); return !!b && cmp(b.trust, c[2], c[3]); }
      case 'level': return cmp(S.learn && S.learn.char ? S.learn.level : 11, c[1], c[2]);
      case 'ready': return (st.cool[c[1]] || 0) <= S.day;
      case 'quest': return questState(S, c[1]) === c[2];
      case 'has': return hasGood(S, c[1]) >= c[2];
      default: return true;
    }
  });
}
function dlgDo(S, effects, city) {
  const st = stOf(S), msgs = [];
  (effects || []).forEach(e => {
    switch (e[0]) {
      case 'flag': st.flags[e[1]] = true; break;
      case 'trust': { const b = bossOf(S, e[1] || city); if (b) { b.trust = clamp(b.trust + e[2], -100, 100); msgs.push((e[2] > 0 ? 'زادت ثقة ' : 'نقصت ثقة ') + b.name + ' بك'); } break; }
      case 'pay': ctxFor(S, city); pPay(S, 'gift', e[1], true); msgs.push('دفعتَ ' + e[1] + ' ريال'); break;
      case 'cool': st.cool[e[1]] = S.day + e[2]; break;
      case 'quest': if (e[1] === 'start') { st.quests[e[2]] = { state: 'active', day: S.day }; msgs.push('مهمة جديدة: ' + DLG.QUESTS[e[2]].title); } else { st.quests[e[2]] = Object.assign(st.quests[e[2]] || {}, { state: 'done', end: S.day }); msgs.push('أتممتَ المهمة: ' + DLG.QUESTS[e[2]].title); } break;
      case 'sellTo': { const car = mainCar(S), g = e[1], n = Math.min(e[2], Math.floor(car.cargo[g] || 0)), c = S.cities[city]; ctxFor(S, city); const total = n * refPrice(c, g) * e[3]; takeBasis(car.basis, g, n); car.cargo[g] -= n; S.player.gold += total; S.player.led.inc.sales = (S.player.led.inc.sales || 0) + total; msgs.push('قبضتَ ' + Math.round(total) + ' ريال'); break; }
      case 'craft': { const r = A.buyCraft(S, e[1]); msgs.push(r.msg); break; }
      case 'react': learnReact(S, e[1]); break;
    }
  });
  return msgs;
}
function dlgView(S) {
  const st = stOf(S), cur = st.cur; if (!cur) return null;
  const D = DLG.DIALOGS[cur.id], N = D.nodes[cur.node], c = S.cities[D.city], bs = bossOf(S, D.city);
  const sub = t => String(t).replace(/\{boss\}/g, bs ? bs.name : '');
  const mood = N.mood === 'auto' ? (bs && bs.trust >= 15 ? 'warm' : bs && bs.trust <= -10 ? 'displeased' : 'stern') : N.mood;
  const opts = [], all = N.opts || [];
  all.forEach((o, k) => { if (dlgOk(S, o.if)) opts.push({ i: k, t: sub(o.t) }); });
  return { id: cur.id, node: cur.node, who: D.who, mood, name: D.who === 'salem' ? 'عمّ سالم' : D.who === 'trader' ? 'تاجر الساحة' : (bs ? bs.name : ''), city: D.city, say: sub(N.say), opts };
}
/* صندوق التكافل التعاوني (بدل التأمين التجاري): تتبرع بمبلغ يومي (للممتلكات 0.04٪ من قيمتها) أو عن كل رحلة (2.5٪ من الحمولة) إلى صندوق مشترك مع تجار السوق.
   التبرع لا يُسترد، ويقتطع المشغّل 10٪ منه أجراً معلوماً على الإدارة. يعوّض الصندوق المتضرر بنسبة من خسارته وبحدّ نصف رصيده، ويُرَدّ فائضه على المشاركين كل 90 يوماً. التعويض ليس مضموناً بالكامل. */
const TK = { seed: 1500, others: 8, wakeel: 0.1, cover: 0.7, coverFactory: 0.5, cap: 0.5, reserve: 3000, cycle: 90, share: 0.25, rate: 0.0004, tripRate: 0.025 };
const tkOf = S => S.player.tk || (S.player.tk = { pool: 0, paid: 0, got: 0, claims: 0, back: 0, last: S.day, joined: false });
function tkContribute(S, amt) {
  if (!(amt > 0)) return; const T = tkOf(S); if (!T.joined) { T.joined = true; T.pool += TK.seed; T.last = S.day; }
  const fee = amt * TK.wakeel; sink(S, 'takafulFee', fee); T.pool += amt - fee; T.paid += amt;
}
function tkClaim(S, lost, cover) {
  const T = S.player.tk; if (!T || !T.joined || !(lost > 0)) return 0; const pay = Math.min(lost * cover, T.pool * TK.cap); if (pay < 1) return 0;
  T.pool -= pay; T.got += pay; T.claims++; S.player.gold += pay; S.player.led.inc.takaful = (S.player.led.inc.takaful || 0) + pay; return pay;
}
function tkDay(S) {
  const T = S.player.tk; if (!T || !T.joined) return; T.pool += TK.others;
  if (S.day - T.last >= TK.cycle) { T.last = S.day; if (T.pool > TK.reserve) { const D = (T.pool - TK.reserve) * 0.4, mine = D * TK.share; T.pool -= D; S.player.gold += mine; T.back += mine; S.player.led.inc.takaful = (S.player.led.inc.takaful || 0) + mine; news(S, 'وزّع صندوق التكافل فائضه على المشاركين: نصيبك ' + fmtN(mine) + ' ريال.', 'good'); learnReact(S, 'tkSurplus', 30); } }
}
const insValue = (S, city) => { const pr = S.player.props[city]; return (pr ? valueOf(pr.store) : 0) + S.player.factories.filter(f => f.city === city).reduce((a, f) => a + factoryValue(f), 0); };
const insPrem = (S, city) => Math.max(3, Math.round(insValue(S, city) * TK.rate * 10) / 10);
const insOn = (S, city) => !!(S.player.props[city] && S.player.props[city].ins);
/* ---------- التاجر المنافس المسمّى (المرحلة 5): يظهر في لعبة التعلّم فقط، يتاجر في الأسواق نفسها بعد اليوم 40 وتُقارَن ثروته بثروتك. عشوائيته معزولة (rndB) ---------- */
const RIVAL_NAMES = ['ابن زياد', 'الحاج منصور', 'أبو عدنان', 'شاهين التاجر'], RIVAL_FROM = 40;
const rivalOn = S => !!(S.learn && S.learn.char && S.rival);
function rivalNew(S) { return { name: RIVAL_NAMES[S.seed % RIVAL_NAMES.length], gold: 3000, city: S.order[Math.floor(S.seed / 8) % S.order.length], from: null, dest: null, left: 0, total: 0, cargo: {}, cap: 150, trips: 0, passed: false, ahead: -999, rep: 0, hist: [] }; }
const rivalNW = S => (S.rival ? Math.round(S.rival.gold + valueOf(S.rival.cargo)) : 0);
function rivalDay(S) {
  if (!(S.learn && S.learn.char)) return; if (!S.rival) S.rival = rivalNew(S); const a = S.rival; if (S.day < RIVAL_FROM) return;
  const k = diffOf(S), up = Math.min(a.gold, 5 + a.gold * 0.012); sink(S, 'agentUpkeep', up); a.gold -= up;
  if (a.left > 0) {
    a.left--;
    if (a.left === 0) {
      const c = S.cities[a.dest]; a.city = a.dest; a.dest = null;
      const cu = Math.min(a.gold, customsOf(S, a.from, a.city, a.cargo)); if (cu > 0) { a.gold -= cu; sink(S, 'customs', cu); }
      if (rndB(S) < S.risk[riskKey(a.from, a.city)] * 0.4) for (const g in a.cargo) a.cargo[g] -= Math.floor(a.cargo[g] * 0.3);
      for (const g of GIDS) if ((a.cargo[g] || 0) >= 1) sellUnits(S, a, c, g, a.cargo[g], a.cargo, false, 1);
      a.trips++;
    }
  } else {
    const c = S.cities[a.city]; if (a.gold < 60 && !Object.keys(a.cargo).some(g => a.cargo[g] >= 1)) { a.gold += 500; fauc(S, 'bailout', 500); }
    let best = null;
    for (const g of GIDS) {
      if (GD[g].sp || GD[g].fresh || !sells(c, g)) continue; const pb = unitPrice(c, g) * 1.01;
      for (const d of S.order) {
        if (d === a.city) continue; const dc = S.cities[d], cus = dc.country === c.country ? 0 : CD[dc.country].customs;
        const ps = unitPrice(dc, g) * (1 - dc.tax - cus) * (0.95 + rndB(S) * 0.1), days = Math.max(1, Math.ceil(dist(S, a.city, d) / SPEED));
        const fu = (GD[g].fod || 0) * days * unitPrice(c, 'wheat'), m = (ps - pb - fu) / days / pb; if (!best || m > best.m) best = { g, d, m, days, fu };
      }
    }
    if (best && best.m > 0.012) {
      const G = GD[best.g], qty = Math.min(a.cap * (0.8 + 0.2 * k) / G.w, a.gold * 0.9 / unitPrice(c, best.g), c.stock[best.g] * 0.3);
      const res = buyUnits(S, a, c, best.g, qty, a.cap, a.cargo, false);
      if (res.n > 0) { const fc = Math.min(a.gold, res.n * best.fu); a.gold -= fc; sink(S, 'provisions', fc); a.from = a.city; a.dest = best.d; a.left = best.days; a.total = best.days; }
    }
    if (a.gold > 9000 && a.cap < 400) { a.gold -= 2000; sink(S, 'investment', 2000); a.cap += 50; }
  }
  if (S.day % 30 === 0) { a.hist.push(rivalNW(S)); if (a.hist.length > 20) a.hist.shift(); }
  const mine = netWorth(S), his = rivalNW(S);
  if (!a.passed && mine > his * 1.05 && S.day >= RIVAL_FROM + 20) { a.passed = true; news(S, 'تفوّقتَ في الثروة على ' + a.name + '! لكن السوق يدور وهو لن يسكت.', 'good'); learnReact(S, 'rivalPass'); }
  else if (a.passed && his > mine * 1.1) { a.passed = false; news(S, a.name + ' عاد إلى الصدارة بثروة ' + fmtN(his) + ' مقابل ' + fmtN(mine) + '.', 'bad'); }
  if (his > mine * 1.5 && S.day - a.ahead > 60) { a.ahead = S.day; news(S, a.name + ' يتقدمك بوضوح (' + fmtN(his) + ' مقابل ثروتك ' + fmtN(mine) + '). راجع صفقاتك.', 'bad'); learnReact(S, 'rivalAhead'); }
}
/* ---------- المواسم (المرحلة 5): سنة 354 يوماً. تغيّر الطلب على سلع بعينها، وإشعار قبلها بثلاثة أيام. تعمل في لعبة التعلّم من المستوى 4 كالصدمات ---------- */
const YEAR = 354, MUSLIM = new Set(['sa', 'eg', 'ir']);
const SEASONS = {
  harvest: { name: 'موسم الحصاد', from: 30, to: 59, mul: 1.25, prod: true, desc: 'الغلال والخامات أوفر وأرخص' },
  hajj: { name: 'موسم الحجيج', from: 140, to: 159, mul: 1.35, goods: ['wheat', 'dates', 'textile', 'incense', 'perfume'], where: c => c.country === 'sa', desc: 'يزدحم الحجاز بالزوّار فيكثر الطلب على القوت والعطور والنسيج في السعودية' },
  ramadan: { name: 'شهر رمضان', from: 200, to: 229, mul: 1.3, goods: ['dates', 'honey', 'sugar', 'rice', 'wheat', 'oliveoil', 'cheese', 'raisins', 'eggs'], where: c => MUSLIM.has(c.country), desc: 'يرتفع الطلب على التمر والسكر والعسل والأرز في بلاد المسلمين' },
  eid: { name: 'أيام العيد', from: 230, to: 239, mul: 1.25, goods: ['textile', 'perfume', 'jewelry', 'sugar', 'honey', 'carpet', 'incense'], where: () => true, desc: 'هدايا وكسوة وحلوى، فيزداد الطلب على النسيج والعطور والمجوهرات' },
  winter: { name: 'برد الشتاء', from: 290, to: 349, mul: 1.25, goods: ['wool', 'leather', 'textile', 'wood'], where: () => true, desc: 'يشتد الطلب على الصوف والجلود والحطب' },
};
const seasonsOn = S => !!(S.learn && S.learn.char && S.learn.level >= 4 && !S.noShocks);
const seasonAt = day => { const d = ((day % YEAR) + YEAR) % YEAR; for (const k in SEASONS) if (d >= SEASONS[k].from && d <= SEASONS[k].to) return k; return null; };
function seasonNow(S) { if (!seasonsOn(S)) return null; const k = seasonAt(S.day); return k ? { k, left: SEASONS[k].to - (S.day % YEAR) + 1, ...SEASONS[k] } : null; }
function seasonNext(S) { if (!seasonsOn(S)) return null; for (let i = 1; i <= 12; i++) { const k = seasonAt(S.day + i); if (k && k !== seasonAt(S.day)) return { k, in: i, ...SEASONS[k] }; } return null; }
function seasonMul(S, c, g) { const k = seasonsOn(S) && seasonAt(S.day); if (!k) return 1; const X = SEASONS[k]; return X.goods && X.goods.includes(g) && X.where(c) ? X.mul : 1; }
function seasonDay(S) {
  if (!seasonsOn(S)) return; const d = S.day % YEAR, now = seasonAt(S.day), was = seasonAt(S.day - 1);
  if (now && now !== was) { news(S, 'بدأ ' + SEASONS[now].name + ': ' + SEASONS[now].desc + '.', 'good'); learnReact(S, 'seasonStart', 10); }
  const nx = seasonAt(S.day + 3); if (nx && SEASONS[nx].from === (S.day + 3) % YEAR) news(S, 'يقترب ' + SEASONS[nx].name + ' بعد 3 أيام: ' + SEASONS[nx].desc + '.', 'rumor');
}
/* ---------- الصدمات الاقتصادية (المرحلة 4): إشاعة قبل 3 أيام ثم أثر ثم نهاية. الشدة والتكرار بحسب الصعوبة (S.diff: calm/normal/hard) ---------- */
const DIFF = { calm: 0.6, normal: 1, hard: 1.4 }, diffOf = S => DIFF[S.diff] || 1;
const SHOCK_WARN = 3, SHOCK_RATE = 0.05, SHOCK_MAX = 3, PORTS = ['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai'];
const shocksOn = S => !!(S.learn && S.learn.char && S.learn.level >= 4 && !S.noShocks);
const FOODISH = new Set(['rice', 'sugar', 'honey', 'oliveoil', 'dates', 'eggs', 'cheese', 'raisins', 'cotton']);
const MONO_NAMES = ['الحاج فيصل', 'أبو غانم', 'الشيخ رشاد', 'ابن سُميط', 'التاجر شاهين', 'سيّد المنصور'];
const pickOf = (S, arr) => arr[Math.floor(rndB(S) * arr.length)];
const shockProdMul = (c, g) => { const sh = c.sh; if (!sh) return 1; const food = GD[g].tier === 'raw' || GD[g].ess || FOODISH.has(g); if (!food) return 1; return sh.k === 'famine' && g !== 'wheat' ? 1 : 1 - sh.cut; };
const shortMul = (S, a, b) => { const x = S.shortcuts && S.shortcuts[riskKey(a, b)]; return x && x.end > S.day ? 0.7 : 1; };
const SHOCKS = {
  closure: { w: 1, name: 'إغلاق حدود', dur: [10, 15], make: S => { const a = pickOf(S, Object.keys(ADJ)); return { a, b: pickOf(S, ADJ[a]) }; },
    rumor: sh => 'إشاعة: قد تُغلَق الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' بعد ' + SHOCK_WARN + ' أيام. أتمم ما تريده قبلها.',
    start: (S, sh) => news(S, 'أُغلقت الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' نحو ' + (sh.end - sh.start) + ' يوماً: لا سفر بينهما حتى تُفتح.', 'bad'),
    end: (S, sh) => news(S, 'فُتحت الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' من جديد.', 'good') },
  banditwave: { w: 1.2, name: 'موجة لصوص', dur: [10, 16], make: S => ({ city: pickOf(S, S.order) }),
    rumor: (sh, S) => 'إشاعة: قطاع الطرق يكثرون حول ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام. حرّاس أكثر أو تأمين أسلم.',
    start: (S, sh) => { sh.sv = {}; S.order.forEach(id => { if (id === sh.city) return; const k = riskKey(sh.city, id); if (S.risk[k] == null) return; sh.sv[k] = S.risk[k]; S.risk[k] = Math.min(0.6, S.risk[k] * (1.5 + 0.4 * sh.sev)); }); news(S, 'موجة لصوص حول ' + S.cities[sh.city].name + ': الطرق منها وإليها أخطر بنحو ' + Math.round((0.5 + 0.4 * sh.sev) * 100) + '٪.', 'bad'); },
    end: (S, sh) => { for (const k in (sh.sv || {})) S.risk[k] = sh.sv[k]; news(S, 'هدأت موجة اللصوص حول ' + S.cities[sh.city].name + '.', 'good'); } },
  pirates: { w: 0.8, name: 'قراصنة', dur: [8, 12], make: S => ({ city: pickOf(S, PORTS.filter(id => S.cities[id])) }),
    rumor: (sh, S) => 'إشاعة: قراصنة يتربصون بالسفن قرب ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام.',
    start: (S, sh) => { sh.sv = {}; PORTS.forEach(id => { if (id === sh.city || !S.cities[id]) return; const k = riskKey(sh.city, id); if (S.risk[k] == null) return; sh.sv[k] = S.risk[k]; S.risk[k] = Math.min(0.6, S.risk[k] * (1.8 + 0.4 * sh.sev)); }); news(S, 'قراصنة قرب ' + S.cities[sh.city].name + ': طرق الموانئ منها أخطر.', 'bad'); },
    end: (S, sh) => { for (const k in (sh.sv || {})) S.risk[k] = sh.sv[k]; news(S, 'انكسرت شوكة القراصنة قرب ' + S.cities[sh.city].name + '.', 'good'); } },
  drought: { w: 1, name: 'جفاف', dur: [16, 24], make: S => ({ country: pickOf(S, COUNTRIES.map(c => c.id)) }),
    rumor: sh => 'إشاعة: جفاف يلوح في ' + CD[sh.country].name + ' بعد ' + SHOCK_WARN + ' أيام، فتغلو الأقوات والخامات.',
    start: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.country === sh.country) c.sh = { k: 'drought', end: sh.end, cut: Math.min(0.7, 0.35 + 0.1 * sh.sev) }; }); news(S, 'جفاف في ' + CD[sh.country].name + ': الغلال والخامات أقل بنحو ' + Math.round(Math.min(0.7, 0.35 + 0.1 * sh.sev) * 100) + '٪.', 'bad'); },
    end: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.sh && c.sh.k === 'drought' && c.country === sh.country) c.sh = null; }); news(S, 'انتهى الجفاف في ' + CD[sh.country].name + '.', 'good'); } },
  flood: { w: 0.7, name: 'فيضان', dur: [12, 18], make: S => ({ country: 'eg' }),
    rumor: sh => 'إشاعة: النيل يفيض بعد ' + SHOCK_WARN + ' أيام وقد يُتلف الزروع.',
    start: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.country === 'eg') c.sh = { k: 'flood', end: sh.end, cut: Math.min(0.6, 0.3 + 0.1 * sh.sev) }; }); news(S, 'فيضان في مصر: الزروع والخامات أقل بنحو ' + Math.round(Math.min(0.6, 0.3 + 0.1 * sh.sev) * 100) + '٪ حتى ينحسر الماء.', 'bad'); },
    end: (S, sh) => { S.order.forEach(id => { const c = S.cities[id]; if (c.sh && c.sh.k === 'flood') c.sh = null; }); news(S, 'انحسر الفيضان في مصر.', 'good'); } },
  famine: { w: 0.7, name: 'مجاعة', dur: [12, 18], make: S => ({ city: pickOf(S, S.order) }),
    rumor: (sh, S) => 'إشاعة: القمح يشحّ في ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام. من يحمل القمح يربح.',
    start: (S, sh) => { const c = S.cities[sh.city]; c.sh = { k: 'famine', end: sh.end, cut: Math.min(0.7, 0.45 + 0.1 * sh.sev) }; c.stock.wheat *= 0.4; news(S, 'قحط في ' + c.name + ': القمح نادر والأسعار تصعد.', 'bad'); },
    end: (S, sh) => { const c = S.cities[sh.city]; if (c.sh && c.sh.k === 'famine') c.sh = null; news(S, 'عاد القمح إلى أسواق ' + c.name + '.', 'good'); } },
  fair: { w: 1, name: 'معرض تجاري', dur: [8, 10], make: S => { const ids = S.order.filter(id => !S.cities[id].ev); return ids.length ? { city: pickOf(S, ids) } : null; },
    rumor: (sh, S) => 'إشاعة: معرض تجاري كبير في ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام: الأسعار صاعدة والبيع رابح.',
    start: (S, sh) => { const c = S.cities[sh.city]; if (!c.ev) c.ev = { k: 'festival', left: sh.end - sh.start }; news(S, 'افتُتح المعرض التجاري في ' + c.name + ': بِع ما معك بأسعار أعلى.', 'good'); },
    end: () => {} },
  sickness: { w: 0.8, name: 'مرض في القافلة', dur: [1, 1], make: S => ({}),
    rumor: () => 'إشاعة: مرض يتفشى بين القوافل في الطرق، فخذ رجالاً أكثر وطعاماً جيداً.',
    start: (S, sh) => { const car = S.player.caravans[0]; if (!car) return; const n = Math.min(car.crew, Math.ceil(2 * sh.sev)); car.crew -= n; car.morale = Math.max(0, car.morale - 15); news(S, 'مرض في قافلتك: غاب ' + n + ' من رجالك وهبطت المعنويات. وظّف رجالاً وأرحهم.', 'bad'); },
    end: () => {} },
  fire: { w: 0.7, name: 'حريق مخزن', dur: [1, 1], make: S => { const ids = Object.keys(S.player.props).filter(id => S.player.props[id].whs && valueOf(S.player.props[id].store) > 400); return ids.length ? { city: pickOf(S, ids) } : null; },
    rumor: (sh, S) => 'إشاعة: حرائق تشتعل في مخازن ' + S.cities[sh.city].name + '. تفقّد مخزنك وأمينه.',
    start: (S, sh) => { const pr = S.player.props[sh.city]; if (!pr) return; const keeper = keeperHave(S, sh.city) >= keeperNeed(S, sh.city) && keeperNeed(S, sh.city) > 0; const f = clamp((0.12 + 0.13 * rndB(S)) * sh.sev * (keeper ? 0.5 : 1), 0.05, 0.5); let lost = 0; for (const g in pr.store) { const l = pr.store[g] * f; pr.store[g] -= l; lost += l * mid(g); takeBasis(pr.basis || (pr.basis = {}), g, l); } const comp = insOn(S, sh.city) ? tkClaim(S, lost, TK.cover) : 0; sink(S, 'fire', lost); news(S, 'حريق في مخزنك بـ' + S.cities[sh.city].name + ' التهم نحو ' + Math.round(f * 100) + '٪ من البضاعة (' + fmtN(lost) + ' ريال)' + (comp > 0 ? ' وعوّضك صندوق التكافل بـ' + fmtN(comp) + ' ريال.' : keeper ? ' لولا أمينك لكان أشدّ.' : '. أمين المخزن يخفف الخسارة.'), 'bad'); learnReact(S, 'shockFire'); },
    end: () => {} },
  taxraid: { w: 0.8, name: 'مداهمة ضريبية', dur: [1, 1], make: S => ({ city: pickOf(S, S.order) }),
    rumor: (sh, S) => 'إشاعة: عمّال الضرائب يداهمون تجّار ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام. من كان حسابه نظيفاً فلا يخاف.',
    start: (S, sh) => { const bad = (S.zakat && S.zakat.due && S.zakat.defer) || (repOf(S.player).broke || 0) > 0; if (bad) { const fine = Math.round(Math.max(200, S.player.gold * 0.04 * sh.sev)); ctxFor(S, sh.city); pPay(S, 'fine', fine, true); news(S, 'داهم عمّال الضرائب ' + S.cities[sh.city].name + ' ووجدوا عليك تقصيراً (زكاة مؤجَّلة أو عقداً مفسوخاً): غرامة ' + fmtN(fine) + ' ريال.', 'bad'); learnReact(S, 'shockTax'); } else news(S, 'داهم عمّال الضرائب ' + S.cities[sh.city].name + ' ومرّت حساباتك سليمة: سمعتك تشفع لك.', 'good'); },
    end: () => {} },
  dump: { w: 1, name: 'إغراق السوق', dur: [8, 10], make: S => { const c = S.cities[pickOf(S, S.order)], gs = GIDS.filter(g => !GD[g].live && !GD[g].fresh && GD[g].tier !== 'raw' && g !== 'wheat' && sells(c, g)); return gs.length ? { city: c.id, g: pickOf(S, gs) } : null; },
    rumor: (sh, S) => 'إشاعة: تجّار يُعدّون لإغراق سوق ' + S.cities[sh.city].name + ' بـ' + GD[sh.g].name + ' بعد ' + SHOCK_WARN + ' أيام.',
    start: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = capG(c, sh.g) * 1.25; news(S, 'أُغرق سوق ' + c.name + ' بـ' + GD[sh.g].name + ': سعره يهبط، وفرصة لمن يشتري ويحمله إلى سوق آخر.', 'good'); },
    end: () => {} },
  monopoly: { w: 0.7, name: 'احتكار تاجر كبير', dur: [14, 20], make: S => { const c = S.cities[pickOf(S, S.order)], gs = GIDS.filter(g => !GD[g].live && !GD[g].fresh && GD[g].tier !== 'raw' && g !== 'wheat' && sells(c, g)); return gs.length ? { city: c.id, g: pickOf(S, gs), who: pickOf(S, MONO_NAMES) } : null; },
    rumor: (sh, S) => 'إشاعة: التاجر الكبير ' + sh.who + ' يشتري كل ' + GD[sh.g].name + ' في ' + S.cities[sh.city].name + ' بعد ' + SHOCK_WARN + ' أيام ليحتكره. من يحمل ' + GD[sh.g].name + ' إليه يربح، لكن احتكاره لا يدوم.',
    start: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = Math.min(c.stock[sh.g], capG(c, sh.g) * 0.1); news(S, sh.who + ' اشترى كل ' + GD[sh.g].name + ' في ' + c.name + ': السعر يصعد. احمل إليه من سوق آخر وبِعه بسعره.', 'bad'); },
    day: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = Math.min(c.stock[sh.g], capG(c, sh.g) * 0.15); },
    end: (S, sh) => { const c = S.cities[sh.city]; c.stock[sh.g] = capG(c, sh.g) * 1.3; news(S, 'انكسر احتكار ' + sh.who + ' لـ' + GD[sh.g].name + ' في ' + c.name + ' وأغرق السوق بما خزّنه: السعر يهبط.', 'good'); } },
  discovery: { w: 0.8, name: 'اكتشاف طريق', dur: [26, 32], make: S => { const a = pickOf(S, S.order); const b = pickOf(S, S.order.filter(x => x !== a)); return { a, b }; },
    rumor: (sh, S) => 'إشاعة: دليل يزعم طريقاً أقصر بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name + '.',
    start: (S, sh) => { S.shortcuts = S.shortcuts || {}; S.shortcuts[riskKey(sh.a, sh.b)] = { end: sh.end }; news(S, 'اكتُشف طريق مختصر بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name + ': الرحلة أقصر بنحو 30٪.', 'good'); },
    end: (S, sh) => { if (S.shortcuts) delete S.shortcuts[riskKey(sh.a, sh.b)]; news(S, 'ضاع الطريق المختصر بين ' + S.cities[sh.a].name + ' و' + S.cities[sh.b].name + ' بفعل الرمال.', ''); } },
};
function shockDay(S) {
  S.shocks = S.shocks || [];
  for (const sh of S.shocks.slice()) {
    const K = SHOCKS[sh.k]; if (!K) { S.shocks = S.shocks.filter(x => x !== sh); continue; }
    if (sh.st === 'rumor' && S.day >= sh.start) { sh.st = 'on'; K.start(S, sh); }
    else if (sh.st === 'on' && S.day >= sh.end) { K.end(S, sh); S.shocks = S.shocks.filter(x => x !== sh); }
  }
  if (!shocksOn(S) || S.day < 15 || S.shocks.length >= SHOCK_MAX) return;
  if (rndB(S) >= SHOCK_RATE * diffOf(S)) return;
  const ks = Object.keys(SHOCKS), tot = ks.reduce((a, k) => a + SHOCKS[k].w, 0); let r = rndB(S) * tot, k = ks[0]; for (const x of ks) { r -= SHOCKS[x].w; if (r <= 0) { k = x; break; } }
  if (S.shocks.some(x => x.k === k)) return;
  const K = SHOCKS[k], par = K.make(S); if (!par) return;
  const dur = K.dur[0] + Math.floor(rndB(S) * (K.dur[1] - K.dur[0] + 1)), sh = Object.assign({ id: S.nextId++, k, st: 'rumor', warn: S.day, start: S.day + SHOCK_WARN, end: S.day + SHOCK_WARN + dur, sev: diffOf(S) }, par);
  S.shocks.push(sh); news(S, K.rumor(sh, S), 'rumor'); learnReact(S, 'shockRumor', 6);
}
// منع السفر عبر حدود مغلقة
function shockBlock(S, fromCity, dest) {
  for (const sh of (S.shocks || [])) if (sh.st === 'on' && sh.k === 'closure') {
    const a = S.cities[fromCity].country, b = S.cities[dest].country;
    if ((a === sh.a && b === sh.b) || (a === sh.b && b === sh.a)) return 'الحدود بين ' + CD[sh.a].name + ' و' + CD[sh.b].name + ' مغلقة حتى اليوم ' + sh.end + '.';
  }
  return null;
}
/* حدث الطريق التفاعلي: قطاع طرق (قاتل / ادفع جزية / ناور) */
function roadResolve(S, choice) {
  const R = S.road; if (!R) return NO('لا حدث');
  const car = S.player.caravans.find(c => c.id === R.car) || S.player.caravans[0], to = R.to; S.road = null;
  if (choice === 'pay') {
    const val = valueOf(holdings(car)), t = Math.min(S.player.gold, Math.round(val * 0.08)); ctxFor(S, to); pPay(S, 'tribute', t, true); car.morale = Math.max(0, car.morale - 3);
    news(S, 'دفعتَ جزية ' + fmtN(t) + ' ريال لقطاع الطرق فتركوا قافلتك. أرخص من نهبها.', ''); learnReact(S, 'roadPaid', 20); return { ok: true, outcome: 'paid', msg: 'دفعتَ ' + fmtN(t) + ' ريال ومرّت القافلة' };
  }
  if (choice === 'evade') {
    const ch = clamp(0.3 + 0.03 * car.crew + (car.captain ? 0.05 * car.captain.nav : 0), 0.2, 0.8);
    if (rndB(S) < ch) { news(S, 'التفّت قافلتك حول الكمين ووصلت سالمة إلى ' + S.cities[to].name + '.', 'good'); return { ok: true, outcome: 'evaded', msg: 'التففتم حول الكمين بسلام' }; }
    const r = banditFight(S, car, to, R.B, 0.8); return { ok: true, outcome: r.repelled ? 'repelled' : 'robbed', msg: r.repelled ? 'اكتُشفتم لكن حرّاسك صدّوهم' : 'اكتُشفتم ونُهب نحو ' + Math.round(r.f * 100) + '٪' };
  }
  const r = banditFight(S, car, to, R.B, choice === 'fight' ? 1.15 : 1);
  return { ok: true, outcome: r.repelled ? 'repelled' : 'robbed', msg: r.repelled ? 'صدّ حرّاسك قطاع الطرق' : 'غلبكم قطاع الطرق ونهبوا نحو ' + Math.round(r.f * 100) + '٪' };
}
const roadAuto = S => { roadResolve(S, 'auto'); };
/* ---------- الملحمة: تذبح من مزرعتك وتبيع اللحم الطازج في السوق مباشرة، وما لم يُبَع يفسد 12٪ يومياً ---------- */
function butcherDay(S, city, pr, c) {
  const b = pr.butcher; b.today = 0;
  const have = Math.floor(pr.store.meat || 0);
  if (have >= 1) {
    const n = Math.min(have, BUTCHER_DAY * b.lv), r = sellUnits(S, S.player, c, 'meat', n, pr.store, true, BUTCHER_PREM);
    if (r.n > 0) { const cost = takeBasis(pr.basis || (pr.basis = {}), 'meat', r.n); logTrade(S, city, 'meat', r.n, 'shop', r.net, r.net - cost); b.sold = (b.sold || 0) + r.n; b.rev = (b.rev || 0) + r.net; b.today = r.net; S.player.led.inc.shops = (S.player.led.inc.shops || 0) + r.net; }
  }
  const left = pr.store.meat || 0;
  if (left > 0) { const loss = left * GD.meat.spoil; pr.store.meat = left - loss; takeBasis(pr.basis || (pr.basis = {}), 'meat', loss); sink(S, 'spoilage', loss * mid('meat')); if (pr.store.meat < 0.05) delete pr.store.meat; }
}
/* ---------- اللاعب ---------- */
function shopsDay(S) {
  const P = S.player;
  for (const city in P.props) {
    const pr = P.props[city], c = S.cities[city]; if (!c) continue;
    ctxFor(S, city); pr.basis = pr.basis || {};
    const ns = pr.shops.length; pr.today = 0;
    if (pr.farm) farmDay(S, city, pr, c);
    if (pr.butcher) butcherDay(S, city, pr, c);
    if (!ns && !pr.whs) continue;
    { const no = ownShops(pr); pPay(S, 'upkeep', no * 10 * (1 + 0.08 * (ns - 1)) + pr.whs * 6, true); }
    rentDay(S, city, pr, c);
    staffDay(S, city, pr, c); const sf = sellFactor(S, city);
    if (ns && sf <= 0) learnReact(S, 'noSeller', 15);
    // تعبئة آلية من السوق عند الرخص
    for (const sh of pr.shops) for (const it of sh.items) {
      if (!it.auto || (pr.store[it.g] || 0) >= it.target) continue;
      if (ratio(c, it.g) >= it.buyBelow) continue;
      const room = storeRoom(S, city), budget = { gold: P.gold * 0.5 };
      const res = buyUnits(S, budget, c, it.g, Math.min(25, it.target - (pr.store[it.g] || 0)), room, pr.store, true, true);
      P.gold -= res.cost; addBasis(pr.basis, it.g, res.n, res.cost);
    }
    // البيع للسكان
    const cnt = {};
    for (const sh of pr.shops) for (const it of sh.items) cnt[it.g] = (cnt[it.g] || 0) + 1;
    const tr = taxRate(S, c, true);
    for (const sh of pr.shops) for (const it of sh.items) {
      const g = it.g, n = cnt[g], mp = unitPrice(c, g), qm = qualOf(pr.basis, g), price = it.price * refPrice(c, g) * qm;
      const share = Math.min(0.7, 0.3 * Math.pow(n, 0.8)) / n;
      const f = clamp(1.8 + 0.1 * shUp(sh, 'sign') - 0.8 * (price / mp), 0, 1.3);
      const shopPact = bossActive(S) ? pactIn(S, city, 'shop') : null;
      const units = Math.min(pr.store[g] || 0, c.dem[g] * share * f * (shopPact ? 1.4 : 1) * (1 + 0.06 * shUp(sh, 'awning')) * sf);
      it.lastSold = units;
      if (units <= 0) continue;
      const gross = units * price, tax = gross * tr, cost0 = takeBasis(pr.basis, g, units);
      logTrade(S, city, g, units, 'shop', gross - tax, gross - tax - cost0);
      pr.store[g] -= units; c.stock[g] = Math.min(c.stock[g] + units, capG(c, g) * 1.2);
      const cut = shopPact ? gross * shopPact.share : 0;
      P.gold += gross - tax - cut; sink(S, 'tax', tax); if (cut) { sink(S, 'pactShare', cut); P.led.exp.pactShare = (P.led.exp.pactShare || 0) + cut; }
      { const bsx = bossOf(S, city); if (bsx) bsx.dsales += gross; }
      P.led.inc.shops = (P.led.inc.shops || 0) + gross; P.led.exp.tax = (P.led.exp.tax || 0) + tax;
      it.sold = (it.sold || 0) + units; it.revenue = (it.revenue || 0) + gross - tax - cut; pr.today += gross - tax - cut;
      if (rulerMine(S, c)) { const gv = tax * 0.2; P.gold += gv; P.led.inc.governor = (P.led.inc.governor || 0) + gv; fauc(S, 'governor', gv); }
    }
  }
}
/* ---------- التمويل المشروع (بدل الفائدة): مضاربة بربح مشترك، ومرابحة بيعاً بالأجل بهامش معلوم سلفاً، وقرض حسن من زعيم موثوق، وصكوك مشاركة في قافلة.
   لا زيادة مشروطة على قرض، ولا غرامة تتراكم عند التأخر. الأرباح والخسائر تأتي من نشاط تجاري حقيقي ---------- */
const FIN = { mud: { share: 0.7, fee: 0.01, setback: 0.004, loss: 0.012 }, mur: { terms: { 30: 0.06, 60: 0.11, 90: 0.16 }, limit: 0.5 }, qard: { trust: 20, base: 1000, perTrust: 100, max: 4000, days: 60 }, sukuk: { amt: 5000, days: 20, share: 0.8, lo: -0.15, hi: 0.35 } };
const bankDebt = S => S.player.bank.loans.reduce((a, l) => a + l.amt, 0);
const bankLate = S => S.player.bank.loans.some(l => (l.late || 0) > 0);
function finDay(S) {
  const P = S.player, B = P.bank;
  for (const city in B.dep) {
    const c = S.cities[city]; if (!c || !(B.dep[city] > 0)) continue;
    const prosp = clamp(((c.pop[2] + c.pop[3]) / popTotal(c)) * 2 * 0.5 + c.sat.food * 0.5, 0, 1);
    let gross = B.dep[city] * (0.0004 + 0.0008 * prosp * (c.ev && c.ev.k === 'war' ? 1.8 : 1)) / FIN.mud.share * (0.5 + rndB(S));
    if (rndB(S) < FIN.mud.setback) { const l = B.dep[city] * FIN.mud.loss; B.dep[city] -= l; sink(S, 'mudarabaLoss', l); news(S, 'خسرت مضاربتك في ' + c.name + ' نحو ' + fmtN(l) + ' ريال: رأس المال غير مضمون، وهذه طبيعة الشراكة في الربح والخسارة.', 'bad'); learnReact(S, 'mudLoss', 30); continue; }
    const mine = gross * FIN.mud.share; B.dep[city] += mine; fauc(S, 'mudaraba', mine); P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) + mine;
  }
  for (const l of B.loans) {
    if (l.due == null) { l.due = S.day + 30; l.type = l.type || 'old'; }
    if (S.day < l.due) continue;
    const pay = Math.min(P.gold, l.amt); if (pay > 0) { P.gold -= pay; l.amt -= pay; }
    if (l.amt > 0.5) {
      l.late = (l.late || 0) + 1;
      if (l.late === 1) { news(S, 'حلّ أجل ' + (l.type === 'qard' ? 'القرض الحسن' : 'دَين المرابحة') + ' ولم يكفِ رصيدك. لا غرامة عليك، لكن الوفاء واجب ولن تُمنح تمويلاً جديداً حتى تسدّد.', 'bad'); learnReact(S, 'mdLate', 10); S.pause = true; }
      if (l.late % 10 === 0) { repOf(P).broke = (repOf(P).broke || 0) + 1; if (l.type === 'qard' && l.city && S.bosses[l.city]) S.bosses[l.city].trust -= 8; }
    }
  }
  B.loans = B.loans.filter(l => l.amt > 0.5);
  B.bonds = B.bonds.filter(b => {
    if (S.day < b.due) return true;
    const r = FIN.sukuk.lo + (FIN.sukuk.hi - FIN.sukuk.lo) * rndB(S), back = r > 0 ? b.amt * (1 + FIN.sukuk.share * r) : b.amt * (1 + r);
    P.gold += back; P.led.inc.bonds = (P.led.inc.bonds || 0) + back; if (back < b.amt) sink(S, 'sukukLoss', b.amt - back);
    news(S, r > 0 ? 'ربحت صكّ المشاركة في القافلة التجارية: عاد ' + fmtN(back) + ' ريال (حصتك ' + Math.round(FIN.sukuk.share * 100) + '٪ من الربح).' : 'خسرت القافلة التجارية التي شاركتَ فيها فنقص رأس مالك إلى ' + fmtN(back) + ' ريال: الخسارة على صاحب المال.', r > 0 ? 'good' : 'bad'); S.pause = true;
    return false;
  });
}
function murabahaQuote(S, g, qty, term) {
  const car = mainCar(S), c = S.cities[car.city], m = FIN.mur.terms[term]; qty = Math.floor(+qty || 0);
  if (m == null) return { ok: false, msg: 'أجل غير معروف' }; if (!GD[g] || !(qty >= 1)) return { ok: false, msg: 'اختر سلعة وكمية' }; if (!sells(c, g)) return { ok: false, msg: GD[g].name + ' لا تُباع هنا' };
  if (GD[g].live) return { ok: false, msg: 'المرابحة للسلع العادية لا للمواشي' };
  const fit = Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w), q = quoteBuy(S, car.city, g, Math.min(qty, fit)); if (!q || q.n < 1) return { ok: false, msg: 'لا مخزون أو لا مكان في القافلة' };
  const face = q.cost * (1 + m); return { ok: true, n: q.n, cost: q.cost, markup: m, face, term, profit: face - q.cost };
}
function playerDay(S) {
  const P = S.player, nw = netWorth(S), wageMult = 1 + 0.06 * (P.caravans.length - 1);
  for (const id in P.props) { const pr = P.props[id]; if (!pr.ins) continue; const prem = insPrem(S, id); if (P.gold < prem) { pr.ins = null; news(S, 'انتهى اشتراكك في صندوق التكافل عن ممتلكاتك في ' + S.cities[id].name + ' لعجزك عن التبرع اليومي.', 'bad'); continue; } tkContribute(S, pPay(S, 'takaful', prem)); }
  for (const car of P.caravans) {
    const wage = (car.crew * 1.5 + car.guards * 5 + (car.herders || 0) * HERDER_WAGE + capWage(car)) * wageMult + (mountOf(car) ? mountOf(car).up : 0);
    const active = car.left > 0 || car.route || capRole(car) === 'indep', owed = active ? wage : wage * 0.25, paidW = pPay(S, 'wages', owed, true);
    if (car.captain) { const cp = car.captain; if (cp.loyal == null) cp.loyal = 70; if (paidW < owed - 1e-9) cp.loyal = Math.max(0, cp.loyal - 3); else cp.loyal = Math.min(100, cp.loyal + (cp.role === 'loyal' ? 0.4 : 0.25) + (cp.raise > 0 ? 0.1 : 0)); if (cp.loyal < CAP_QUIT && !car.main && S.learn && S.learn.char) { news(S, 'ترك ' + cp.name + ' العمل: ولاؤه انهار بسبب تأخّر أجره. وظّف غيره وأكرم من بعده.', 'bad'); learnReact(S, 'capQuit'); car.captain = null; car.route = null; } }
    pPay(S, 'wear', (active ? 1 : 0.25) * car.carts * 0.7 * wageMult, true);
    if (car.left > 0) {
      car.left--; car.supplies = Math.max(0, car.supplies - car.crew * 0.12);
      car.morale = Math.max(0, car.morale - (car.hungry ? 3 : 0.8));
      for (const g in car.cargo) {
        const rate = GD[g].spoil * (1 - 0.1 * navOf(car)) * (car.hungry && GD[g].live ? 2 : 1); if (!rate) continue;
        const loss = car.cargo[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
        if (n) { car.cargo[g] = Math.max(0, car.cargo[g] - n); sink(S, 'spoilage', n * mid(g)); }
      }
      for (const g in (car.herd || {})) {
        const rate = GD[g].spoil * spoilMul(car, g) * 0.7 * (car.hungry ? 2 : 1); if (!rate || !car.herd[g]) continue;
        const loss = car.herd[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
        if (n) { const b0 = car.herd[g]; car.herd[g] = Math.max(0, car.herd[g] - n); herdScale(car, g, b0); sink(S, 'spoilage', n * mid(g)); }
      }
      for (const g in (car.herd || {})) if (BREED[g] && GD[g].hu) breedStep(S, car, g, car.hungry ? 0 : ROAD_BREED, herdCap(car) - herdUnits(car), GD[g].hu * 0.5, ROAD_YMORT * (car.hungry ? 2 : 1));
      if (rnd(S) < 0.05 * (1 - 0.1 * navOf(car))) { car.left++; car.total++; if (car.main) news(S, 'عاصفة رملية أخّرت قافلتك يوماً.', 'bad'); }
      syncBasis(car);
      if (car.left === 0) arrive(S, car);
    } else {
      car.morale = Math.min(100, car.morale + 5);
      if (car.route && car.captain) autoRoute(S, car); else if (!car.route && capRole(car) === 'indep' && !car.main) autoIndep(S, car);
    }
  }
  shopsDay(S);
  bossesDay(S);
  // مصانع
  for (const c of Object.values(S.cities)) c.factJobs = 0;
  for (const f of P.factories.slice()) factoryDay(S, f);
  for (const city in P.props) if (P.props[city].mgr) mgrDay(S, city, P.props[city]);
  finDay(S); tkDay(S);
  if (S.phase >= 3 && nw > 40000) pPay(S, 'wealthLevy', (nw - 40000) * 0.0006, true);
}

/* ---------- أوامر اللاعب ---------- */
const OK = msg => ({ ok: true, msg }), NO = msg => ({ ok: false, msg });
const mainCar = S => S.player.caravans[0];
const carById = (S, id) => S.player.caravans.find(c => c.id === id);
function ensureProps(S, city) { return S.player.props[city] || (S.player.props[city] = { shops: [], whs: 0, store: {}, basis: {}, today: 0 }); }
/* ---------- الوكيل (الطور 3): شراء من أي مدينة دون سفر، تصل البضاعة إلى مخزن اللاعب ---------- */
const AGENT_FEE = 0.08, AGENT_PHASE = 3;
function agentDest(S, city) {
  const P = S.player, car = mainCar(S), here = car.left > 0 ? car.dest : car.city;
  const cands = Object.keys(P.props).filter(id => storeCap(S, id) > 0);
  if (!cands.length) return null;
  if (cands.includes(here)) return here;
  return cands.sort((a, b) => dist(S, here, a) - dist(S, here, b))[0];
}
function agentQuote(S, city, g, qty) {
  const c = S.cities[city], P = S.player;
  if (S.phase < AGENT_PHASE) return { ok: false, why: 'phase', msg: 'الوكيل يُفتح في الطور ' + AGENT_PHASE + ' (صاحب مصانع).' };
  if (!sells(c, g)) return { ok: false, why: 'unsold', msg: 'لا تُباع هذه السلعة في ' + c.name };
  const dest = agentDest(S, city); if (!dest) return { ok: false, why: 'nostore', msg: 'تحتاج مخزناً في إحدى مدنك لتصل إليه البضاعة.' };
  const w = GD[g].w, room = storeRoom(S, dest), cap = Math.floor(room / w), fee = AGENT_FEE * perkMul(S, 'agentFee');
  const q = quoteBuy(S, city, g, Math.min(Math.floor(qty), cap), P.gold / (1 + fee), true), days = Math.max(1, tripDays(S, mainCar(S), city, dest));
  return { ok: q.n > 0, why: q.n > 0 ? '' : cap < 1 ? 'room' : 'gold', msg: q.n > 0 ? '' : cap < 1 ? 'مخزنك في ' + S.cities[dest].name + ' ممتلئ' : 'لا يكفي رصيدك أو المخزون', n: q.n, cost: q.cost, fee: q.cost * fee, total: q.cost * (1 + fee), feeRate: fee, days, dest, cap };
}
function ordersDay(S) {
  S.orders = S.orders || []; const keep = [];
  S.orders.forEach(o => {
    if (o.day > S.day) { keep.push(o); return; }
    const pr = ensureProps(S, o.to), n = Math.min(o.n, Math.floor(storeRoom(S, o.to) / GD[o.g].w)), part = n / o.n;
    if (n > 0) { pr.store[o.g] = (pr.store[o.g] || 0) + n; pr.basis = pr.basis || {}; addBasis(pr.basis, o.g, n, o.cost * part); }
    if (n < o.n) { S.ctxCur = 'sar'; S.player.gold += o.cost * (1 - part); }
    news(S, 'وصل طلب وكيلك: ' + n + ' ' + GD[o.g].name + ' إلى مخزنك في ' + S.cities[o.to].name + (n < o.n ? ' (امتلأ المخزن فأُعيد ثمن الباقي)' : ''), 'good');
  });
  S.orders = keep;
}

/* ---------- التعليم: الشخصية والمستويات والمساعد ---------- */
function learnNew() { return { char: null, level: 1, ev: {}, goods: [], secrets: [], up: [], sq: [], intro: 0, perks: {}, rq: [], rseen: {}, eq: [], lore: {}, cv: {}, cs: {}, csec: [], csq: [], bq: [], abroad: false }; }
function learnPerks(S) { const L = S.learn; L.perks = LS.perksOf(L.char, L.secrets); (L.csec || []).forEach(id => { L.perks['buy_' + id] = 0.98; }); if (L.free) L.perks.pact = (L.perks.pact || 1) * 0.97; const pf = (L.ev && L.ev.profit) || 0; if (pf >= 60) L.perks.prov = (L.perks.prov || 1) * 0.94; else if (pf >= 20) L.perks.prov = (L.perks.prov || 1) * 0.97; }
/* قصص الزعماء وأسرار الأسواق (src/lore.js) */
/* الدرس الذي شُرح فعلاً: أثناء فترة التمرين يكون المستوى التالي مفتوحاً لكن مقدّمته لم تُعرض بعد، فلا يُطلق أي حدث مرتبط بدرسه قبل أن يرويه عمّ سالم */
const taught = L => (L.rest ? L.level - 1 : L.level);
function loreFix(L) { L.eq = L.eq || []; L.tab = L.tab || []; L.tq = L.tq || []; L.fq = L.fq || []; L.lore = L.lore || {}; L.cv = L.cv || {}; L.cs = L.cs || {}; L.csec = L.csec || []; L.csq = L.csq || []; L.bq = L.bq || []; L.hist = L.hist || []; if (L.abroad === undefined) L.abroad = L.level >= 4; }
function loreCheck(S) {
  const L = S.learn; if (!L || !L.char || taught(L) < 3) return; loreFix(L);
  for (const id in S.bosses || {}) {
    const lo = LORE.BOSS_LORE[id], bs = S.bosses[id]; if (!lo) continue;
    const want = !(L.cv[id] > 0) ? 0 : (bs.trust >= 35 || bs.pacted) ? 3 : (bs.trust >= 10 || bs.gift > -99) ? 2 : 1;
    let n = L.lore[id] || 0; while (n < want) { n++; L.bq.push({ c: id, n }); if (n === 3) news(S, 'تعرّفتَ على حكاية ' + bs.name, 'good'); }
    L.lore[id] = n;
  }
  for (const id in LORE.CITY_SECRETS) {
    if (L.csec.includes(id) || (L.cv[id] || 0) < 2 || (L.cs[id] || 0) < 1000) continue;
    L.csec.push(id); L.csq.push(id); learnPerks(S); news(S, 'سرّ سوق جديد في ' + S.cities[id].name + ': ' + LORE.CITY_SECRETS[id].title, 'good');
  }
}
function learnCountry(S, cc) {
  const L = S.learn; if (!L || L.secrets.includes(cc)) return;
  L.secrets.push(cc); if (LS.SECRETS[cc]) { L.sq.push(cc); learnPerks(S); news(S, 'سرّ جديد: ' + LS.SECRETS[cc].title, 'good'); }
}
/* دَين الجدّ وخطة ظافر (70/20/10) والحصّالة */
const famDebtOn = S => !!(S.player.famDebt && S.player.famDebt.left > 0);
function debtSpend(S, amt) { S.ctxCur = curOf(S.home); S.player.gold -= amt; S.ctxCur = 'sar'; }
function debtApply(S, amt) {
  const fd = S.player.famDebt; amt = Math.min(amt, fd.left); if (amt <= 0) return 0;
  fd.left -= amt; fd.paid += amt; fd.mPaid = (fd.mPaid || 0) + amt; S.player.led.exp.debtPaid = (S.player.led.exp.debtPaid || 0) + amt;
  if (fd.left <= 0.5) { fd.left = 0; const L = S.learn; L.free = true; L.fq.push('debtfree'); learnPerks(S); news(S, 'سدّدتَ دَين جدّك كاملاً: ' + BAB.DEBT.free.title, 'good'); S.pause = true; }
  return amt;
}
function debtCut(S, pl) {
  const P = S.player, fd = P.famDebt; if (!fd || !fd.plan) return;
  const toD = fd.left > 0 ? Math.min(fd.left, Math.max(0, Math.min(pl * BAB.DEBT.cutDebt, P.gold))) : 0, toV = Math.max(0, Math.min(pl * BAB.DEBT.cutVault, P.gold - toD));
  if (toD > 0) { debtSpend(S, toD); debtApply(S, toD); }
  if (toV > 0) { debtSpend(S, toV); P.vault = (P.vault || 0) + toV; }
}
function debtDay(S) {
  const P = S.player, fd = P.famDebt, L = S.learn; if (!fd || !L || !L.char || fd.left <= 0) return;
  if (fd.due == null) { if (fd.plan || taught(L) >= 4) { fd.due = S.day + 30; fd.mPaid = 0; } return; }
  const need = Math.min(fd.left, Math.round(fd.amt0 * BAB.DEBT.installPct));
  if (fd.due - S.day === 5 && (fd.mPaid || 0) < need) learnReact(S, 'instSoon', 3);
  if (S.day < fd.due) return;
  if ((fd.mPaid || 0) >= need) { fd.patience = Math.min(100, fd.patience + 10); learnReact(S, 'instOk', 5); }
  else {
    fd.patience -= 25; learnReact(S, 'instLate', 5);
    if (fd.patience <= 0) {
      const take = Math.max(0, Math.min(fd.left, Math.round(P.gold * 0.25), P.gold - 200));
      if (take > 0) { debtSpend(S, take); debtApply(S, take); news(S, 'ضاق صبر ' + BAB.DEBT.creditor + ' فاستوفى ' + Math.round(take) + ' ريالاً من رصيدك.', 'bad'); S.pause = true; }
      fd.patience = 50;
    } else news(S, 'تأخّرتَ عن قسط ' + BAB.DEBT.creditor + ': صبره ' + fd.patience + '٪', 'bad');
  }
  fd.due = S.day + 30; fd.mPaid = 0;
}
/* مؤشرات بابل: الذهب العامل، رصيد الطوارئ، قوة الأسوار */
function wealthStats(S) {
  const P = S.player; let work = 0; const goods = new Set(); const hold = {};
  P.caravans.forEach(c => { work += valueOf(c.cargo); for (const g in c.cargo) if (c.cargo[g] >= 1) hold[g] = (hold[g] || 0) + c.cargo[g] * mid(g); });
  for (const k in P.props) { const p = P.props[k]; work += ownShops(p) * 1000 + p.whs * 800 + valueOf(p.store) + farmValue(p); for (const g in p.store) if (p.store[g] >= 1) hold[g] = (hold[g] || 0) + p.store[g] * mid(g); }
  P.factories.forEach(f => { work += 2000 * f.level; });
  for (const k in P.bank.dep) work += P.bank.dep[k]; P.bank.bonds.forEach(b => { work += b.amt; });
  const idle = liquid(S), vault = P.vault || 0, tot = Object.values(hold).reduce((a, v) => a + v, 0), top = Object.values(hold).reduce((m, v) => Math.max(m, v), 0);
  const tripCost = 200 + 0.03 * work, trips = Math.floor((idle + vault) / tripCost);
  const walls = { div: Object.keys(hold).length >= 3 || (tot > 0 && top / tot < 0.55 && Object.keys(hold).length >= 2), prot: P.caravans.some(c => c.insured || c.guards >= 1), res: trips >= 2 };
  return { work, idle, vault, pctW: work / Math.max(1, work + idle), trips, tripCost, walls, score: +walls.div + +walls.prot + +walls.res };
}
const masteryOf = L => { const n = (L && L.ev && L.ev.profit) || 0; return n >= 60 ? { tier: 2, name: 'خبير', next: null, n } : n >= 20 ? { tier: 1, name: 'ماهر', next: 60, n } : { tier: 0, name: 'مبتدئ', next: 20, n }; };
/* الرغبة المحددة */
function wishCheck(S) {
  const L = S.learn; if (!L || !L.wish) return;
  if (netWorth(S) >= L.wish.amt) { const a = L.wish.amt; L.wish = null; L.wishDone = (L.wishDone || 0) + 1; S.player.gold += 100; learnReact(S, 'wishDone', 1); news(S, 'حقّقتَ رغبتك المحددة: ثروة ' + a + ' ريال! +100 ريال', 'good'); }
}
const A_setWish = function (S, amt) { const L = S.learn; amt = Math.floor(+amt || 0); if (!L || amt < 500) return NO('اكتب رقماً محدداً لا يقل عن 500 ريال'); L.wish = { amt, since: S.day }; return OK('رغبتك: ثروة ' + amt + ' ريال. الرغبة المحددة نصف الطريق.'); };
/* رحلة الحرية: يغطي الدخل السلبي مصروف القافلة */
const FREE_DAILY = 40;
const passiveCum = S => { const i = S.player.led.inc; return (i.shops || 0) + (i.mudaraba || 0) + (i.bonds || 0) + (i.governor || 0); };
function freedomDay(S) {
  const L = S.learn; if (!L || !L.char) return; L.fh = L.fh || []; L.fh.push(passiveCum(S)); if (L.fh.length > 31) L.fh.shift();
  if (!L.freedom && L.fh.length >= 31 && L.fh[30] - L.fh[0] >= FREE_DAILY * 30) { L.freedom = true; learnReact(S, 'freedom', 1); news(S, 'دخلك السلبي يغطي مصروفك: أنت حرّ مالياً!', 'good'); }
}
const passivePerDay = S => { const fh = (S.learn || {}).fh || []; return fh.length < 2 ? 0 : (fh[fh.length - 1] - fh[0]) / (fh.length - 1); };
/* أحداث بابل: سمسار الثراء السريع، صديق يطلب قرضاً، فرصة الحظ */
const roll = (S, k) => { const x = Math.imul((S.day + 1) * 2654435761 + k * 40503, 0x9E3779B1) >>> 0; return (x % 1000) / 1000; };
function babEventDay(S) {
  const L = S.learn, P = S.player; if (!L || !L.char || taught(L) < 4) return;
  L.ex = L.ex || { broker: -99, friend: -99, luck: -99 }; L.eq = L.eq || []; P.loansOut = P.loansOut || [];
  P.loansOut = P.loansOut.filter(o => {
    if (S.day < o.due) return true;
    const back = o.type === 'secure' ? o.amt * 1.05 : o.type === 'worker' ? (roll(S, 7) < 0.8 ? o.amt : 0) : (roll(S, 9) < 0.2 ? o.amt : 0);
    if (back > 0) { P.gold += back; learnReact(S, 'friendOk', 1); news(S, 'ردّ صديقك قرضه (' + Math.round(back) + ' ريال). حسن اختيارك.', 'good'); }
    else { learnReact(S, 'friendLost', 1); news(S, 'ضاع قرض صديقك (' + o.amt + ' ريال). تذكّر قاعدة صالح.', 'bad'); }
    return false;
  });
  if (L.eq.length) return;
  const car = mainCar(S), liq = liquid(S);
  const push = (id, extra) => { L.eq.push(Object.assign({ id, day: S.day }, extra)); L.ex[id] = S.day; S.pause = true; };
  if (taught(L) >= 6 && S.day - L.ex.broker >= 75 && roll(S, 1) < 0.05 && liq >= 600) return push('broker', { dep: clamp(Math.round(liq * 0.15), 300, 1500) });
  if (taught(L) >= 8 && S.day - L.ex.friend >= 60 && roll(S, 2) < 0.05 && liq >= 1000) { const t = ['secure', 'worker', 'emotion'][Math.floor(roll(S, 3) * 3)]; return push('friend', { type: t, amt: clamp(Math.round(liq * 0.15), 200, 1200) }); }
  if (taught(L) >= 4 && S.day - L.ex.luck >= 45 && car.left === 0 && roll(S, 4) < 0.06 && liq >= 800) {
    const c = S.cities[car.city], gs = GIDS.filter(g => g !== 'wheat' && sells(c, g) && c.stock[g] >= 20); if (!gs.length) return;
    return push('luck', { city: car.city, g: gs[Math.floor(roll(S, 5) * gs.length)] });
  }
}
function eventChoice(S, ch) {
  const L = S.learn, P = S.player, ev = L && L.eq && L.eq[0]; if (!ev) return NO('لا حدث');
  const done = () => { L.eq.shift(); };
  if (ev.id === 'broker') {
    if (ch === 'yes') {
      if (liquid(S) < ev.dep) { done(); return NO('لا رصيد كافٍ'); }
      S.ctxCur = curOf(S.home); P.gold -= ev.dep; S.ctxCur = 'sar'; done();
      if (roll(S, 11) < 0.15) { P.gold += ev.dep * 1.2; return OK('كسبتَ هذه المرة (20٪)، لكنها مخاطرة لا تُعاد.'); }
      learnReact(S, 'brokerLost', 1); return NO('احتال عليك السمسار وضاع المقدّم (' + ev.dep + ' ريال). لا تستشر صانع الطوب في الجواهر.');
    }
    L.ev.brokerNo = (L.ev.brokerNo || 0) + 1; done(); learnReact(S, 'brokerNo', 1);
    return OK(ch === 'ask' ? 'سألتَ أهل الاختصاص فأنقذتَ مالك: الربح المضمون السريع خدعة.' : 'رفضتَ عرض الثراء السريع. حكمة!');
  }
  if (ev.id === 'friend') {
    if (ch === 'yes') {
      if (liquid(S) < ev.amt) { done(); return NO('لا رصيد كافٍ'); }
      S.ctxCur = curOf(S.home); P.gold -= ev.amt; S.ctxCur = 'sar'; P.loansOut = P.loansOut || []; P.loansOut.push({ due: S.day + 30, amt: ev.amt, type: ev.type }); done();
      return OK('أقرضتَ صديقك ' + ev.amt + ' ريال إلى ثلاثين يوماً.');
    }
    L.ev.friendNo = (L.ev.friendNo || 0) + 1; done(); return OK('اعتذرتَ بلطف. (القرض بلا ضمان أو سمعة ضياعٌ للمال).');
  }
  if (ev.id === 'luck') {
    if (ch !== 'yes') { done(); return OK('تركتَ الفرصة تمرّ. الحظ لمن استعدّ وبادر.'); }
    const car = mainCar(S), c = S.cities[ev.city]; if (car.city !== ev.city || car.left > 0) { done(); return NO('غادرتَ المدينة وفاتت الفرصة'); }
    const price = unitPrice(c, ev.g) * 0.75, room = Math.floor((capOfCar(car) - loadOf(car)) / GD[ev.g].w), q = Math.max(0, Math.min(room, Math.floor(liquid(S) * 0.4 / price), Math.floor(c.stock[ev.g] * 0.5)));
    if (q < 1) { done(); return NO('لا مكان أو رصيد كافٍ لاقتناص الفرصة'); }
    S.ctxCur = curOf(c.country); P.gold -= price * q; S.ctxCur = 'sar'; c.stock[ev.g] -= q; car.cargo[ev.g] = (car.cargo[ev.g] || 0) + q; addBasis(car.basis, ev.g, q, price * q); done();
    L.ev.luckGot = (L.ev.luckGot || 0) + 1; return OK('اقتنصتَ ' + q + ' ' + GD[ev.g].name + ' بخصم 25٪!');
  }
  done(); return NO('حدث غير معروف');
}
function tabletCheck(S) {
  const L = S.learn, P = S.player; if (!L || !L.char || !L.tab || taught(L) < 1) return;
  const nw = netWorth(S), props = Object.values(P.props), shops = props.reduce((a, p) => a + p.shops.length, 0), ev = L.ev;
  const C = {
    cure1: () => (P.vault || 0) > 0, cure2: () => taught(L) >= 2, cure3: () => nw >= 3000,
    cure4: () => P.caravans.some(c => c.insured || c.guards >= 1), cure5: () => shops >= 1,
    cure6: () => shops >= 2 || Object.keys(P.bank.dep).some(k => P.bank.dep[k] > 0) || P.bank.bonds.length > 0,
    cure7: () => (ev.profit || 0) >= 20, law1: () => (P.vault || 0) >= 300, law2: () => (L.goods || []).length >= 3,
    law3: () => (ev.signPact || 0) >= 1, law4: () => (ev.loss || 0) >= 1, law5: () => (ev.brokerNo || 0) >= 1 || taught(L) >= 9, free: () => !!L.free, freedom: () => !!L.freedom,
  };
  // لا يُمنح لوح قبل أن يروي عمّ سالم الدرس الذي يخصّه
  const MINL = { cure1: 1, cure2: 2, cure3: 3, cure4: 4, cure5: 7, cure6: 9, cure7: 10, law1: 3, law2: 5, law3: 8, law4: 4, law5: 6 };
  for (const id in BAB.TABLETS) if (!L.tab.includes(id) && C[id] && taught(L) >= (MINL[id] || 1) && C[id]()) { L.tab.push(id); L.tq.push(id); P.gold += BAB.TABLETS[id].reward; }
}
/* فترة تمرين بين المراحل: يكرر اللاعب الصفقات الصغيرة (في دولة البداية قبل أول عبور للحدود) ثم يأتي الدرس التالي */
const REST_K = [3, 4, 4, 3, 3, 3, 3, 3, 2], REST_GOLD = { 2: 1500, 3: 2500 };
function restNew(S, n) { const L = S.learn; return { n, k: REST_K[n - 1] || 3, w: 0, home: n <= 3 ? (L.start || S.home) : null, gold: REST_GOLD[n] || 0, infl: n === 3, plan: n === 2 && !!S.player.famDebt && S.player.famDebt.left > 0 }; }
const restDone = (S, rs) => (!rs.infl || S.learn.abroad) && rs.w >= rs.k && S.player.gold >= rs.gold && (!rs.plan || !S.player.famDebt || S.player.famDebt.plan || S.player.famDebt.left <= 0);
function learnCheck(S, silent) {
  const L = S.learn; if (!L || !L.char) return; if (!silent) { loreCheck(S); tabletCheck(S); wishCheck(S); }
  if (!L.abroad && L.level >= 4 && homeStatus(S).met) { L.abroad = true; if (!silent) { learnReact(S, 'abroadOpen', 1); news(S, 'فُتح لك السفر إلى بقية الدول', 'good'); } }
  if (L.rest) { if (!restDone(S, L.rest)) return; L.rest = null; learnReact(S, 'restDone', 1); }
  if (!silent && S.player.gold < 60 && !hasCargo(S)) learnReact(S, 'broke', 20);
  while (L.level <= 10) {
    if (L.hold === L.level && L.intro < L.level) break;
    const lv = LS.LEVELS[L.level - 1]; if (!lv.goals(S).every(g => g[1])) break;
    if (!silent) { S.player.gold += lv.reward; L.up.push(L.level); news(S, 'أتممتَ درس «' + lv.title + '» · +' + lv.reward + ' ريال', 'good'); S.pause = true; }
    L.level++;
    if (!silent && L.level <= 10) { L.rest = restNew(S, L.level - 1); L.hold = L.level; learnReact(S, 'restStart', 1); break; }
  }
}
/* قفل السفر خارج دولة البداية: يُفتح بعد دروس م1–م3 وزيارة كل أسواق بلدك واكتساب نفوذ فيها (حجم مبيعاتك فيها) */
const INFL_NEED = 4000;
function homeStatus(S) {
  const L = S.learn, home = (L && L.start) || S.home, ids = S.order.filter(id => S.cities[id].country === home);
  const seen = ids.filter(id => L && L.cv && L.cv[id] > 0).length, infl = ids.reduce((t, id) => t + ((L && L.cs && L.cs[id]) || 0), 0);
  return { home, total: ids.length, seen, infl: Math.round(infl), need: INFL_NEED, met: seen >= ids.length && infl >= INFL_NEED, lessons: !!L && L.level >= 4 };
}
function travelBlock(S, car, dest) {
  if (car && car.main) { const sb = shockBlock(S, car.city, dest); if (sb) return sb; }
  const L = S.learn; if (!L || !L.char || L.abroad || !car || !car.main) return null;
  const home = L.start || S.home; if (S.cities[dest].country === home) return null;
  return 'السفر خارج ' + CD[home].name + ' مقفل الآن: كوّن ثروتك في أسواق بلدك أولاً (زُر كل أسواقها وابلغ نفوذاً ' + INFL_NEED + ' ريال من المبيعات فيها)';
}
function learnMigrate(S) { // حفظ قديم: شخصية التاجر ومستوى يوافق الطور
  const L = S.learn = learnNew(); L.char = 'trader'; learnPerks(S);
  L.level = [1, 1, 4, 7, 9][S.phase] || 1; L.abroad = true; L.intro = L.level; learnCheck(S, true);
}
function chooseStart(S, cc) {
  const L = S.learn; if (!START_OF[cc]) return NO('دولة غير معروفة');
  if (!L || L.char || S.day > 0 || (S.player.trades && S.player.trades.length)) return NO('لا يمكن تغيير دولة البداية الآن');
  const city = START_OF[cc], car = mainCar(S), w = S.player.wallet, total = liquid(S);
  S.home = cc; S.startCity = city; L.start = cc; car.city = city;
  w.sar = 0; w.usd = 0; w.au = 0; w.ag = 0; if (curOf(cc) === 'sar') w.sar = total; else w.usd = total / S.fx.usd;
  S.news = []; news(S, 'ورثتَ قافلة جدّك في ' + S.cities[city].name + ' بـ 800 ريال. اشترِ رخيصاً وبِع غالياً، وكوّن ثروتك هنا أولاً ثم امضِ إلى بقية الدول.', 'good');
  snapshotKnown(S, S.order);
  return OK('تبدأ من ' + CD[cc].name + ' (' + S.cities[city].name + ')');
}
function learnSetChar(S, id) {
  const L = S.learn; if (!LS.CHARS.some(c => c.id === id)) return NO('شخصية غير معروفة');
  L.char = id; learnPerks(S); learnCountry(S, S.cities[mainCar(S).city].country); loreFix(L); L.cv[mainCar(S).city] = 1;
  if (!S.player.famDebt) { S.player.famDebt = { amt0: BAB.DEBT.amt, left: BAB.DEBT.amt, plan: false, patience: 100, due: null, mPaid: 0, paid: 0 }; S.player.vault = 0; } L.tab = L.tab || []; L.tq = L.tq || []; L.fq = L.fq || [];
  return OK('اخترتَ ' + LS.CHARS.find(c => c.id === id).name);
}
function learnArrive(S, car, to) {
  const L = S.learn; if (!L || !L.char || !car.main) return;
  if (S.cities[car.from].country !== S.cities[to].country) { L.ev.crossed = (L.ev.crossed || 0) + 1; learnReact(S, 'crossed'); }
  learnCountry(S, S.cities[to].country); learnReact(S, 'arrive', 6); loreFix(L); L.cv[to] = (L.cv[to] || 0) + 1;
}
function learnReact(S, key, cool, param) {
  const L = S.learn; if (!L || !L.char) return;
  const n = L.rseen[key] || 0; L.rday = L.rday || {};
  if (n && (!cool || S.day - (L.rday[key] || 0) < cool)) return;
  L.rseen[key] = n + 1; L.rday[key] = S.day; L.rq.push(key); if (param != null) { L.rp = L.rp || {}; L.rp[key] = param; }
}
function productStory(S, g) {
  const L = S.learn, st = LORE.PSTORY[g]; if (!st) return; L.pst = L.pst || []; if (L.pst.includes(g)) return;
  L.pst.push(g); news(S, 'حكاية منتج جديدة في دفترك: ' + st.t, 'good'); learnReact(S, 'productStory', 8);
}
function learnEvent(S, k, args, r, pre) {
  const L = S.learn; if (!L || !L.char) return;
  if ((k === 'buy' || k === 'sell') && r && r.ok !== false && typeof args[1] === 'string') productStory(S, args[1]);
  const bump = n => { L.ev[n] = (L.ev[n] || 0) + 1; learnReact(S, n, LS.REACT[n] && LS.REACT[n].cool); };
  if (k === 'buy') { bump('buy'); if (pre && pre.cheap) bump('buyCheap'); }
  else if (k === 'sell') {
    { const sc = carById(S, args[0]); if (sc) { loreFix(L); L.cs[sc.city] = (L.cs[sc.city] || 0) + Math.max(0, r.net || 0); } }
    bump('sell'); L.sells = (L.sells || 0) + 1; if (L.stallAt !== L.level) { L.stallAt = L.level; L.stallN = 0; } L.stallN++; if (L.stallN >= 4 && L.level <= 3) learnReact(S, 'stall', 4); if (r.pl < 0) learnReact(S, 'loss', 15);
    if (r.pl > 0) debtCut(S, r.pl);
    if (r.pl < 0) L.ev.loss = (L.ev.loss || 0) + 1;
    if (r.pl > 0 && L.rest) { const sc2 = carById(S, args[0]); if (sc2 && (!L.rest.home || S.cities[sc2.city].country === L.rest.home)) L.rest.w++; }
    if (r.pl > 0) {
      bump('profit'); if (L.ev.profit === 20 || L.ev.profit === 60) { learnPerks(S); news(S, 'ارتقت حرفتك: ' + (L.ev.profit === 60 ? 'خبير' : 'ماهر') + ' (مؤن أرخص)', 'good'); } const cost = r.net - r.pl; if (cost > 0 && r.pl / cost >= 0.1) bump('profit10'); if (cost > 0 && r.pl / cost >= 0.15) bump('profit15'); if (cost > 0 && r.pl / cost >= 0.25) learnReact(S, 'bigProfit', 12);
      if (pre && pre.cross) bump('profitCross');
      if (!L.goods.includes(args[1])) L.goods.push(args[1]);
    }
  } else if (k === 'travel') { if (pre && pre.mixed) bump('mixed'); }
  else if (k === 'invest' || k === 'buySukuk') bump(k);
  else bump(k);
}
function learnPre(S, k, a) {
  const car = (k === 'buy' || k === 'sell' || k === 'travel') ? carById(S, a[0]) : null; if (!car) return null;
  const c = S.cities[car.city];
  if (k === 'buy') return { cheap: sells(c, a[1]) && ratio(c, a[1]) < 0.97 };
  if (k === 'sell') return { cross: !!car.from && S.cities[car.from].country !== c.country };
  return { mixed: Object.keys(car.cargo).filter(g => car.cargo[g] >= 1).length >= 2 };
}

/* ---------- الزكاة (عروض التجارة): تدريب تعليمي مع عمّ سالم ----------
   النصاب 85 غراماً من الذهب بسعر اليوم، الحول 354 يوماً (سنة هجرية)، المقدار 2.5٪.
   الوعاء = السيولة + البضاعة (القوافل والمخازن والطلبات في الطريق) + الودائع والسندات − الديون. الدكاكين والمخازن والعربات والمصانع أصول ثابتة لا زكاة فيها. */
const ZAKAT = { RATE: 0.025, HAWL: 354, NISAB_G: 85, NISAB_AG: 595 };
const zakatNew = () => ({ start: null, last: null, paid: 0, due: false, amount: 0, base: 0, defer: 0, hist: [] });
function zakatBase(S) {
  const P = S.player, w = P.wallet, r = { cash: w.sar + w.usd * S.fx.usd + w.au * S.fx.gold + (w.ag || 0) * rateOf(S, 'ag') + (P.vault || 0), goods: 0, store: 0, orders: 0, deposits: 0, bonds: 0, debts: 0 };
  P.caravans.forEach(c => { r.goods += valueOf(holdings(c)); });
  for (const k in P.props) r.store += valueOf(P.props[k].store) + (P.props[k].farm ? valueOf(farmHold(P.props[k].farm)) : 0);
  (S.orders || []).forEach(o => { r.orders += o.cost || 0; });
  for (const k in P.bank.dep) r.deposits += P.bank.dep[k];
  P.bank.bonds.forEach(b => { r.bonds += b.amt; });
  P.bank.loans.forEach(l => { r.debts += l.amt; }); if (P.famDebt) r.debts += P.famDebt.left;
  r.base = Math.max(0, r.cash + r.goods + r.store + r.orders + r.deposits + r.bonds - r.debts);
  r.nisab = ZAKAT.NISAB_G * S.fx.gold; r.nisabAg = ZAKAT.NISAB_AG * rateOf(S, 'ag'); r.rate = ZAKAT.RATE; r.met = r.base >= r.nisab; r.amount = Math.round(r.base * ZAKAT.RATE);
  return r;
}
function zakatDay(S) {
  const Z = S.zakat; if (!Z || !S.learn || !S.learn.char) return;
  const b = zakatBase(S);
  if (Z.start == null) { if (b.met) { Z.start = S.day; learnReact(S, 'nisab'); } return; }
  if (Z.due) { if (Z.defer && S.day >= Z.defer) learnReact(S, 'zakatLate', 7); return; }
  const age = S.day - Z.start;
  if (age >= ZAKAT.HAWL) {
    if (b.met) { Z.due = true; Z.amount = b.amount; Z.base = Math.round(b.base); Z.defer = 0; learnReact(S, 'zakatDue'); S.pause = true; }
    else { Z.hist.unshift({ day: S.day, base: Math.round(b.base), due: 0, paid: 0, note: 'below' }); if (Z.hist.length > 12) Z.hist.pop(); Z.start = null; }
  } else if (ZAKAT.HAWL - age === 30) learnReact(S, 'zakatSoon');
}

/* سمعة التاجر: خمسة أشرطة بوزن متساوٍ (0–100). في المرحلة 3 تحدد جودة مصانعه (35٪ ← 80٪) */
function reputation(S) {
  const P = S.player, L = S.learn || {}, Z = S.zakat || {}, R = repOf(P), fd = P.famDebt;
  const inst = !fd ? 60 : fd.left <= 0 ? 100 : clamp(Math.round(fd.patience == null ? 60 : fd.patience), 0, 100);
  const con = clamp(50 + 12 * R.done - 30 * R.broke, 0, 100);
  const ts = Object.values(S.bosses || {}).filter(b => b.trust).map(b => b.trust);
  const trust = ts.length ? clamp(Math.round(50 + ts.reduce((a, b) => a + b, 0) / ts.length / 2), 0, 100) : 30;
  const mast = clamp(Math.round((((L.ev && L.ev.profit) || 0) / 60) * 100), 0, 100);
  const zk = (Z.paidN || 0) + (Z.lates || 0) === 0 ? 60 : clamp(60 + 20 * (Z.paidN || 0) - 25 * (Z.lates || 0), 0, 100);
  const parts = [
    { id: 'inst', name: 'الوفاء بالأقساط', score: inst, tip: 'سدّد قسط دَين جدّك في موعده' },
    { id: 'pacts', name: 'إتمام العقود', score: con, tip: 'أتمّ عقودك ولا تفسخها' },
    { id: 'trust', name: 'ثقة الزعماء', score: trust, tip: 'أهدِ الزعماء وفاوضهم' },
    { id: 'mastery', name: 'الإتقان', score: mast, tip: 'اكسب صفقات رابحة أكثر' },
    { id: 'zakat', name: 'الوفاء بالزكاة', score: zk, tip: 'أخرج زكاتك عند حلول الحول ولا تؤجّلها' },
  ];
  const total = Math.round(parts.reduce((a, x) => a + x.score, 0) / parts.length);
  return { parts, total, quality: Math.round(35 + 45 * total / 100), weakest: parts.slice().sort((a, b) => a.score - b.score)[0] };
}

/* ---------- المستشار الخاص: عمّ سالم بعد التخرّج يحلّل ويقترح وينبّه ---------- */
function bestDeal(S, carArg, budget) {
  const car = carArg || mainCar(S), here = S.cities[car.city]; if (car.left > 0) return null; let best = null;
  GIDS.forEach(g => {
    if (g === 'wheat' || !sells(here, g) || GD[g].sp) return; // توصيات الصفقات للسلع العامة؛ أصناف المواشي الخاصة تُكتشف من سوق المواشي
    const room = Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w), p = unitPrice(here, g) * 1.04;
    const q = Math.min(30, room, Math.floor((budget != null ? budget : S.player.gold * 0.8) / p), Math.floor((here.stock[g] || 0) * 0.5)); if (q < 3) return;
    const o = sellOptions(S, car.city, g, q, p, car)[0]; if (!o || o.profit <= 0) return;
    const pct = o.profit / (p * q); if (!best || pct > best.pct) best = { g, q, dest: o.city, profit: o.profit, pct, days: o.days, risk: o.risk, cost: p * q, country: o.country };
  });
  return best;
}
function advisorReport(S) {
  const P = S.player, car = mainCar(S), here = S.cities[car.city], z = zakatBase(S), idle = car.left === 0;
  const rep = { city: car.city, idle, dest: car.dest, left: car.left };
  rep.here = GIDS.filter(g => g !== 'wheat' && sells(here, g)).map(g => ({ g, ratio: ratio(here, g), price: unitPrice(here, g), stock: here.stock[g] || 0 })).sort((a, b) => a.ratio - b.ratio);
  rep.deal = bestDeal(S);
  rep.cargo = GIDS.filter(g => (car.cargo[g] || 0) >= 1).map(g => { const q = Math.floor(car.cargo[g]), o = sellOptions(S, car.city, g, q, avgCost(car.basis, g) || mid(g), car)[0]; return { g, q, here: ratio(here, g), best: o ? { city: o.city, profit: o.profit, days: o.days } : null }; });
  const sv = {}; let tot = 0;
  [car.cargo].concat(Object.values(P.props).map(p => p.store)).forEach(st => { for (const g in st) { const v = (st[g] || 0) * mid(g); sv[g] = (sv[g] || 0) + v; tot += v; } });
  const top = Object.keys(sv).sort((a, b) => sv[b] - sv[a])[0];
  rep.portfolio = { cash: z.cash, goods: z.goods, store: z.store, deposits: z.deposits + z.bonds, debts: z.debts, nw: netWorth(S), top: top ? { g: top, pct: sv[top] / tot } : null, goodsTotal: tot };
  rep.risk = { guards: car.guards, crew: car.crew, insured: !!car.insured, cargoValue: valueOf(car.cargo), route: rep.deal ? rep.deal.risk : null };
  rep.zakat = { start: S.zakat.start, due: S.zakat.due, amount: S.zakat.due ? S.zakat.amount : z.amount, met: z.met, base: z.base, nisab: z.nisab };
  return rep;
}
function advisorDay(S) {
  const L = S.learn; if (!L || !L.char || L.level <= 10 || L.advMute) return;
  const car = mainCar(S); if (car.left > 0) return; const here = S.cities[car.city], P = S.player, nw = netWorth(S);
  if (P.gold > 3000 && P.gold > 0.6 * nw) learnReact(S, 'tipCash', 30);
  const held = GIDS.filter(g => (car.cargo[g] || 0) >= 1);
  const spike = held.find(g => ratio(here, g) >= 1.25); if (spike) learnReact(S, 'tipSpike', 8, GD[spike].name);
  if (!held.length) { const ch = GIDS.filter(g => g !== 'wheat' && sells(here, g) && (here.stock[g] || 0) >= 5).sort((a, b) => ratio(here, a) - ratio(here, b))[0]; if (ch && ratio(here, ch) <= 0.8) learnReact(S, 'tipCheap', 8, GD[ch].name); }
  const rp = advisorReport(S).portfolio; if (rp.goodsTotal > 1500 && rp.top && rp.top.pct > 0.55) learnReact(S, 'tipConc', 25, GD[rp.top.g].name);
  if (valueOf(car.cargo) > 4000 && car.guards < 2 && !car.insured) learnReact(S, 'tipGuard', 25);
  if (P.bank.loans.length) learnReact(S, 'tipDebt', 30);
}

const hasCargo = S => S.player.caravans.some(c => Object.values(c.cargo).some(v => v >= 1));
const A = {
  buy(S, carId, g, qty, mode, sex) {
    const car = carById(S, carId), c = S.cities[car.city];
    if (car.left > 0) return NO('القافلة في الطريق');
    ctxFor(S, car.city);
    if (!breedOpen(S, g)) return NO(GD[g].name + ' يُفتح عند المستوى ' + GD[g].lv + ' في مسيرتك');
    let dst = car.cargo, room = capOfCar(car) - loadOf(car);
    if (mode === 'herd') {
      if (!GD[g].hu) return NO(GD[g].name + ' لا تمشي مع القطيع: تُنقل في الحمولة');
      const free = herdCap(car) - herdUnits(car); if (free < GD[g].hu) return NO(herdCap(car) ? 'القطيع ممتلئ: وظّف راعياً آخر' : 'وظّف راعياً أولاً ليسوق القطيع');
      dst = herdOf(car); hxOf(car, g); room = Math.floor(free / GD[g].hu) * GD[g].w;
    }
    if (sex && (mode !== 'herd' || !SEXF[sex])) return NO('الجنس يُحدَّد عند الشراء للقطيع فقط');
    const res = buyUnits(S, S.player, c, g, qty, room, dst, true, false, sex ? SEXF[sex] : 1);
    if (res.n) addBasis(car.basis, g, res.n, res.cost);
    if (res.n && mode === 'herd') { if (!sex) herdAdd(car, g, res.n); else { const x = hxOf(car, g); if (sex === 'm') x.m += res.n; else if (sex === 'p') x.p = (x.p || 0) + res.n; } }
    if (res.n && GD[g].live) learnReact(S, mode === 'herd' ? 'herdBuy' : 'liveBuy');
    if (res.unsold) return NO('لا يُباع هنا. ' + GD[g].name + ' يُشترى من: ' + soldAt(S, g).map(id => S.cities[id].name).join('، '));
    if (!res.n && res.quota) { learnReact(S, 'quotaHit', 15); }
    if (!res.n && res.quota) return NO('حصتك اليوم من ' + GD[g].name + ' انتهت. ثقة ' + bossOf(S, car.city).name + ' ترفعها، وعقد التوريد أو الحصري يضاعفها');
    return res.n ? OK('اشتريت ' + res.n + ' ' + GD[g].name + ' بـ ' + Math.round(res.cost) + ' ريال (متوسط ' + (res.cost / res.n).toFixed(1) + ')') : NO('تعذّر الشراء (ذهب/مخزون/حمولة)');
  },
  zakatPay(S, amt) {
    const Z = S.zakat; if (!Z || !Z.due) return NO('لا زكاة مستحقة الآن');
    amt = Math.round(+amt || 0); if (!(amt > 0)) return NO('أدخل مبلغاً');
    amt = Math.min(amt, Z.amount); if (S.player.gold < amt) return NO('رصيدك لا يكفي لهذا المبلغ');
    pPay(S, 'zakat', amt, true); Z.amount -= amt; Z.paid += amt;
    if (Z.amount > 0) return OK('أخرجتَ ' + amt + ' ريال، وبقي ' + Z.amount + ' ريال من زكاتك');
    const b = zakatBase(S); Z.hist.unshift({ day: S.day, base: Z.base, due: Math.round(Z.base * ZAKAT.RATE), paid: Math.round(Z.base * ZAKAT.RATE), note: 'paid' }); if (Z.hist.length > 12) Z.hist.pop();
    if (!Z.dfr && Z.start != null && S.day - Z.start <= ZAKAT.HAWL + 3) achFlag(S, 'zakat_on_time'); Z.dfr = 0;
    Z.last = S.day; Z.due = false; Z.defer = 0; Z.start = b.met ? S.day : null; Z.paidN = (Z.paidN || 0) + 1;
    return OK('تقبّل الله منك! أخرجتَ زكاة مالك كاملة، وبدأ حول جديد');
  },
  zakatDefer(S) { const Z = S.zakat; if (!Z || !Z.due) return NO('لا زكاة مستحقة الآن'); Z.defer = S.day + 7; Z.dfr = 1; Z.lates = (Z.lates || 0) + 1; S.pause = false; return OK('أجّلتَ الزكاة أسبوعاً، وهي دَين عليك فلا تنسَها'); },
  agentBuy(S, city, g, qty) {
    const q = agentQuote(S, city, g, qty); if (!q.ok) return NO(q.msg);
    const c = S.cities[city]; ctxFor(S, city);
    const acct = { gold: S.player.gold / (1 + q.feeRate) }, res = buyUnits(S, acct, c, g, q.n, 1e9, {}, true, true);
    if (!res.n) return NO('تعذّر الطلب');
    const fee = res.cost * q.feeRate, total = res.cost + fee; S.player.gold -= total; S.player.led.exp.agent = (S.player.led.exp.agent || 0) + fee;
    S.orders = S.orders || []; S.orders.push({ id: S.nextId++, to: q.dest, from: city, g, n: res.n, cost: total, day: S.day + q.days });
    return OK('طلبت ' + res.n + ' ' + GD[g].name + ' من ' + c.name + ' بـ ' + Math.round(total) + ' ريال (رسم الوكيل ' + Math.round(fee) + ') · تصل إلى ' + S.cities[q.dest].name + ' بعد ' + q.days + ' أيام');
  },
  sell(S, carId, g, qty, mode) {
    const car = carById(S, carId), c = S.cities[car.city];
    if (car.left > 0) return NO('القافلة في الطريق');
    ctxFor(S, car.city);
    const b0 = mode === 'herd' ? (herdOf(car)[g] || 0) : 0, pm = (mode === 'herd' ? pedMulOf(car, g) : 1) * qualOf(car.basis, g), res = sellUnits(S, S.player, c, g, qty, mode === 'herd' ? herdOf(car) : car.cargo, true, pm);
    if (mode === 'herd') herdScale(car, g, b0);
    if (!res.n) return NO('لا بضاعة');
    const cost = takeBasis(car.basis, g, res.n), pl = res.net - cost; logTrade(S, car.city, g, res.n, 'sell', res.net, pl);
    return { ok: true, msg: 'بعت ' + res.n + ' ' + GD[g].name + ' صافي ' + Math.round(res.net) + ' ريال · ' + (pl >= 0 ? 'ربحت ' : 'خسرت ') + Math.abs(Math.round(pl)), pl, net: res.net, n: res.n };
  },
  travel(S, carId, dest) { const car = carById(S, carId); const r = startTrip(S, car, dest); return r.ok ? OK('انطلقت: ' + r.days + ' أيام') : NO(r.msg); },
  buyCart(S, carId) { const car = carById(S, carId); if (car.carts >= 6) return NO('الحد الأقصى 6 عربات'); if (car.left > 0) return NO('في الطريق'); if (S.player.gold < 600) return NO('تحتاج 600'); pPay(S, 'assets', 600); car.carts++; return OK('عربة جديدة'); },
  upgradeShop(S, city, shopId, k) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === shopId), U = SHOP_UP[k]; if (!sh || !U) return NO('لا دكان');
    if (S.phase < 2) return NO('يُفتح في الطور 2'); if (shKind(sh) !== 'own') return NO('التحسين للدكان المملوك فقط');
    const lv = shUp(sh, k); if (lv >= 2) return NO('بلغ الحد الأقصى'); const cost = Math.round(SHOP_UP_COST[lv] * foreignMul(S, S.cities[city])); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); sh.up = Object.assign({}, sh.up, { [k]: lv + 1 }); learnReact(S, 'shopUp'); return OK(U.name + ' (مستوى ' + (lv + 1) + ') في دكانك بـ' + S.cities[city].name);
  },
  saveTemplate(S, carId, name) {
    const car = carById(S, carId), r = car && car.route; if (!r) return NO('لا مسار لحفظه'); const T = S.player.tpl || (S.player.tpl = []); if (T.length >= 6) return NO('بلغت 6 قوالب: احذف قالباً أولاً');
    const nm = (name || '').trim() || (S.cities[r.a].name + ' ⇄ ' + S.cities[r.b].name); T.push({ id: S.nextId++, name: nm.slice(0, 30), a: r.a, b: r.b, buyA: r.buyA || null, buyB: r.buyB || null }); return OK('حفظت القالب «' + nm + '»');
  },
  applyTemplate(S, carId, tid) {
    const car = carById(S, carId), t = (S.player.tpl || []).find(x => x.id === tid); if (!car || !t) return NO('قالب غير موجود');
    car.route = { a: t.a, b: t.b, buyA: t.buyA, buyB: t.buyB }; return OK('طبّقت «' + t.name + '» على ' + car.name);
  },
  delTemplate(S, tid) { S.player.tpl = (S.player.tpl || []).filter(x => x.id !== tid); return OK('حُذف القالب'); },
  insureCity(S, city, on) {
    const pr = S.player.props[city]; if (!pr || !(pr.shops.length || S.player.factories.some(f => f.city === city))) return NO('لا ممتلكات لك في هذه المدينة');
    if (S.phase < 3) return NO('يُفتح في الطور 3'); if (on) { if (pr.ins) return NO('مؤمَّنة أصلاً'); if (S.player.gold < insPrem(S, city) * 10) return NO('تحتاج احتياطي تبرعات عشرة أيام'); pr.ins = { since: S.day }; learnReact(S, 'insureOn'); return OK('اشتركتَ في صندوق التكافل عن ممتلكاتك في ' + S.cities[city].name + ' بتبرع ' + insPrem(S, city) + ' يومياً'); }
    pr.ins = null; return OK('أوقفتَ التأمين');
  },
  buyMount(S, carId, kind) {
    const car = carById(S, carId), M = MOUNT[kind]; if (!car || !M) return NO('مركب غير معروف'); if (S.phase < 2) return NO('يُفتح في الطور 2');
    if (car.left > 0) return NO('في الطريق'); if (car.mount) return NO('عند القافلة مركب: بِعه أولاً'); if (S.player.gold < M.cost) return NO('تحتاج ' + M.cost);
    pPay(S, 'assets', M.cost); car.mount = { kind, since: S.day }; learnReact(S, 'mountBuy'); return OK('اشتريت ' + M.name + ' لـ' + car.name + ': ' + M.desc);
  },
  sellMount(S, carId) {
    const car = carById(S, carId), M = car && mountOf(car); if (!M) return NO('لا مركب'); if (car.left > 0) return NO('في الطريق');
    if (loadOf(car) > capOfCar(car) / (1 + M.load) + 1e-9) return NO('الحمولة تزيد عن سعة القافلة بدونه');
    const back = Math.round(M.cost * 0.6); S.player.gold += back; S.player.led.inc.assets = (S.player.led.inc.assets || 0) + back; car.mount = null; return OK('بعت ' + M.name + ' بـ' + back);
  },
  hireCrew(S, carId) { const car = carById(S, carId); if (car.crew >= 12) return NO('الطاقم كامل'); if (S.player.gold < 50) return NO('تحتاج 50'); pPay(S, 'hiring', 50, true); car.crew++; return OK('انضم رجل للطاقم'); },
  sellYoung(S, carId, g, qty) {
    const car = carById(S, carId), c = S.cities[car.city]; if (car.left > 0) return NO('القافلة في الطريق'); ctxFor(S, car.city);
    const x = (car.hx || {})[g], n0 = Math.min(Math.floor(qty), Math.floor(x ? x.y : 0)); if (n0 < 1) return NO('لا صغار منها');
    const tmp = {}; tmp[g] = n0; const res = sellUnits(S, S.player, c, g, n0, tmp, true, YOUNG_SELL * (spOf(g) === 'horse' ? pedMul(x.yq || 1) : 1) * hyPf(car, g)); if (!res.n) return NO('تعذّر البيع');
    x.y -= res.n; logTrade(S, car.city, g, res.n, 'sell', res.net, res.net);
    return { ok: true, msg: 'بعت ' + res.n + ' من صغار ' + GD[g].name + ' صافي ' + Math.round(res.net) + ' ريال', pl: res.net, net: res.net, n: res.n };
  },
  hireHerder(S, carId) {
    const car = carById(S, carId); if ((car.herders || 0) >= MAX_HERDERS) return NO('رعاة كفاية (' + MAX_HERDERS + ')'); if (car.left > 0) return NO('في الطريق');
    if (S.player.gold < HERDER_FEE) return NO('تحتاج ' + HERDER_FEE); pPay(S, 'hiring', HERDER_FEE, true); car.herders = (car.herders || 0) + 1;
    return OK('انضم راعٍ للقافلة: سعة القطيع ' + herdCap(car) + ' وحدة');
  },
  fireHerder(S, carId) {
    const car = carById(S, carId); if (!(car.herders > 0)) return NO('لا رعاة'); if (car.left > 0) return NO('في الطريق');
    if (herdUnits(car) > (car.herders - 1) * HERD_PER) return NO('بِع بعض القطيع أولاً: سعة الرعاة لا تكفيه'); car.herders--; return OK('سرّحت راعياً');
  },
  hireGuard(S, carId) { const car = carById(S, carId); if (car.guards >= 8) return NO('حراس كفاية'); if (S.player.gold < 300) return NO('تحتاج 300'); pPay(S, 'hiring', 300, true); car.guards++; return OK('حارس جديد'); },
  insure(S, carId, on) { carById(S, carId).insured = !!on; return OK(on ? 'اشتركتَ في صندوق التكافل عن هذه القافلة' : 'خرجتَ من صندوق التكافل عن هذه القافلة'); },
  hireCaptain(S, idx) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    if (S.player.caravans.length >= 6) return NO('أقصى أسطول 6 قوافل');
    if (idx != null) {
      const cd = captainPool(S)[idx]; if (!cd) return NO('مرشّح غير موجود'); if (S.player.gold < cd.fee) return NO('تحتاج ' + cd.fee);
      pPay(S, 'assets', cd.fee);
      const car = makeCaravan(S, S.nextId++, 'قافلة ' + cd.name, mainCar(S).city, false);
      car.captain = { name: cd.name, trade: cd.trade, nav: cd.nav, combat: cd.combat, xp: 0, role: cd.role, home: cd.home, loyal: 70, raise: 0, since: S.day };
      S.player.caravans.push(car); learnReact(S, 'capHire');
      return OK('انضم ' + cd.name + ' (' + ROLES[cd.role].name + ' من ' + CD[cd.home].name + ')');
    }
    if (S.player.gold < 1500) return NO('تحتاج 1500');
    pPay(S, 'assets', 1500);
    const id = S.nextId++, names = ['مطلق', 'بدر', 'تركي', 'فيصل', 'عيد', 'حمد'], nm = names[S.player.caravans.length % 6];
    const car = makeCaravan(S, id, 'قافلة ' + nm, mainCar(S).city, false);
    car.captain = { name: nm, trade: 1 + Math.floor(rnd(S) * 2), nav: 1 + Math.floor(rnd(S) * 2), combat: 1 + Math.floor(rnd(S) * 2), xp: 0 };
    S.player.caravans.push(car); return OK('انضم قائد جديد: ' + nm);
  },
  raiseCaptain(S, carId) {
    const car = carById(S, carId), cp = car && car.captain; if (!cp) return NO('لا قائد');
    if ((cp.raise || 0) >= CAP_RAISE_MAX - 1e-9) return NO('بلغت علاوته الحد الأقصى'); if (S.day - (cp.raiseDay == null ? -99 : cp.raiseDay) < 20) return NO('أعطيته علاوة قريباً: انتظر 20 يوماً');
    cp.raise = Math.min(CAP_RAISE_MAX, (cp.raise || 0) + 0.15); cp.raiseDay = S.day; cp.loyal = Math.min(100, (cp.loyal == null ? 70 : cp.loyal) + 12);
    return OK('زدتَ راتب ' + cp.name + ' إلى +' + Math.round(cp.raise * 100) + '٪: ولاؤه الآن ' + Math.round(cp.loyal));
  },
  setRoute(S, carId, route) { carById(S, carId).route = route; return OK('حُدّد المسار'); },
  // --- الدكاكين والمخازن ---
  buildShop(S, city) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    const c = S.cities[city], n = shopsOf(S, city).length; ctxFor(S, city);
    if (n >= shopLimit(c)) return NO('بلغت الحد الأقصى للدكاكين في ' + c.name + ' (' + shopLimit(c) + ')');
    const cost = shopCost(S, c); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost);
    const pr = ensureProps(S, city); pr.shops.push({ id: S.nextId++, items: [], kind: 'own' }); welcomeCrew(S, pr, SELLER_PTS, 0);
    snapshotKnown(S, [city]);
    return OK('بنيت دكاناً في ' + c.name + (whsOf(S, city) < pr.shops.length ? ' · يمكنك الآن بناء مخزن' : ''));
  },
  buildWarehouse(S, city) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    const c = S.cities[city], pr = S.player.props[city]; ctxFor(S, city);
    if (!pr || !pr.shops.length) return NO('ابنِ دكاناً أولاً: كل دكان يفتح مخزناً');
    if (pr.whs >= pr.shops.length) return NO('كل مخزن يحتاج دكاناً: ابنِ دكاناً جديداً أولاً');
    const cost = whCost(S, c); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); pr.whs++; welcomeCrew(S, pr, 0, 1); return OK('بنيت مخزناً في ' + c.name);
  },
  rentShop(S, city, kind, landlord) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    if (kind !== 'stall' && kind !== 'shop') return NO('نوع غير معروف');
    const c = S.cities[city], n = shopsOf(S, city).length; ctxFor(S, city);
    if (n >= shopLimit(c)) return NO('بلغت الحد الأقصى للدكاكين في ' + c.name + ' (' + shopLimit(c) + ')');
    landlord = landlord === 'boss' && bossOf(S, city) && bossOf(S, city).ruler !== 'player' ? 'boss' : 'private';
    const rent = rentOf(S, c, kind, landlord, n), fee = rent * 3; if (S.player.gold < fee) return NO('رسوم الدخول ' + fee + ' (إيجار 3 أيام)');
    pPay(S, 'rent', fee, true);
    const pr = ensureProps(S, city); pr.shops.push({ id: S.nextId++, items: [], kind: kind === 'stall' ? 'stall' : 'rent', landlord, rent, rentPaid: fee, arrears: 0, onTime: 0, since: S.day });
    welcomeCrew(S, pr, kind === 'stall' ? 1 : SELLER_PTS, 0); snapshotKnown(S, [city]);
    return OK('استأجرت ' + (kind === 'stall' ? 'بسطة' : 'دكاناً') + ' في ' + c.name + ' بإيجار ' + rent + ' ريالاً يومياً');
  },
  upgradeStall(S, city, id) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id), c = S.cities[city]; ctxFor(S, city);
    if (!sh || shKind(sh) !== 'stall') return NO('ليست بسطة');
    const rent = rentOf(S, c, 'shop', sh.landlord, pr.shops.length - 1), fee = rent * 5; if (S.player.gold < fee) return NO('رسوم الارتقاء ' + fee);
    pPay(S, 'rent', fee, true); sh.kind = 'rent'; sh.rent = rent; sh.rentPaid = (sh.rentPaid || 0) + fee;
    welcomeCrew(S, pr, 1, 0);
    return OK('ارتقت بسطتك إلى دكان مؤجَّر بإيجار ' + rent + ' ريالاً يومياً');
  },
  buyShop(S, city, id) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id), c = S.cities[city]; ctxFor(S, city);
    if (!sh || shKind(sh) === 'own') return NO('هذا الدكان ملكك أصلاً');
    const price = Math.round(1500 * Math.pow(1.5, pr.shops.length - 1) * foreignMul(S, c)), disc = Math.min(RENT_CREDIT * (sh.rentPaid || 0), RENT_MAXCREDIT * price), pay = Math.round(price - disc);
    if (S.player.gold < pay) return NO('تحتاج ' + pay + ' (السعر ' + price + ' مخصوماً منه ' + Math.round(disc) + ' من إيجارك)');
    pPay(S, 'assets', pay); const wasStall = shKind(sh) === 'stall';
    sh.kind = 'own'; delete sh.rent; delete sh.landlord; delete sh.arrears; delete sh.onTime; delete sh.rentPaid; if (wasStall) welcomeCrew(S, pr, 1, 0);
    return OK('اشتريت الدكان في ' + c.name + ' بـ ' + pay + ' ريالاً (خصم ' + Math.round(disc) + ' من إيجارك)');
  },
  vacateShop(S, city, id) {
    const pr = S.player.props[city], sh = pr && pr.shops.find(x => x.id === id); if (!sh || shKind(sh) === 'own') return NO('لا إيجار');
    if (pr.whs >= pr.shops.length) return NO('كل مخزن يحتاج دكاناً: لا تخلِ قبل تقليل المخازن');
    pr.shops = pr.shops.filter(x => x !== sh); return OK('تركت المكان المؤجَّر');
  },
  buildFarm(S, city) {
    if (S.phase < FARM_PHASE) return NO('تُفتح المزرعة في الطور ' + FARM_PHASE + ' (صاحب مصانع)');
    const c = S.cities[city], pr = S.player.props[city]; ctxFor(S, city);
    if (!pr || !pr.shops.length) return NO('تحتاج دكاناً لك في ' + c.name + ' قبل المزرعة');
    if (pr.farm) return NO('لك مزرعة هنا');
    const cost = Math.round(FARM_COST * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); pr.farm = { level: 1, herd: {}, hx: {}, acc: {}, lost: 0 }; pr.farmerWelcome = 1; welcomeCrew(S, pr, 0, 0);
    return OK('بنيت مزرعة في ' + c.name + ' تتسع لـ ' + farmCap(S, city) + ' وحدة');
  },
  buildStable(S, city) {
    const c = S.cities[city], f = farmOf(S, city); ctxFor(S, city); if (!f) return NO('لا مزرعة'); if (f.stable) return NO('لك إسطبل');
    const cost = Math.round(2500 * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); f.stable = true; return OK('بنيت إسطبلاً: مهور خيلك تتحسّن سلالتها أسرع');
  },
  buyStud(S, city) {
    const c = S.cities[city], f = farmOf(S, city), pr = S.player.props[city]; ctxFor(S, city); if (!f) return NO('لا مزرعة'); if (!c.makes.includes('horse')) return NO('لا تُباع الفحول الأصيلة إلا في أسواق الخيل');
    if (S.day - (f.studDay == null ? -999 : f.studDay) < 60) return NO('الفحول الأصيلة نادرة: انتظر ' + (60 - (S.day - f.studDay)) + ' أيام');
    if (farmCap(S, city) - farmUnits(f) < BREED.horse.fu) return NO('لا مكان في المزرعة');
    const cost = Math.round(unitPrice(c, 'horse') * 5); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); const x = hxOf(f, 'horse'), a = f.herd.horse || 0, m0 = Math.min(x.m, a); x.mq = ((x.mq || 1) * m0 + 4) / (m0 + 1); f.herd.horse = a + 1; x.m += 1; f.studDay = S.day;
    addBasis(pr.basis || (pr.basis = {}), 'horse', 1, cost);
    return OK('اشتريت فحلاً أصيلاً (4 نجوم) بـ ' + cost + ' ريال');
  },
  upgradeFarm(S, city) {
    const c = S.cities[city], f = farmOf(S, city); ctxFor(S, city); if (!f) return NO('لا مزرعة'); if (f.level >= FARM_MAXLV) return NO('أعلى مستوى');
    const cost = Math.round(FARM_UP * f.level * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); f.level++; return OK('وُسّعت المزرعة إلى ' + farmCap(S, city) + ' وحدة');
  },
  farmIn(S, carId, g, qty) {
    const car = carById(S, carId), f = farmOf(S, car.city), pr = S.player.props[car.city]; if (car.left > 0) return NO('القافلة في الطريق'); if (!f) return NO('لا مزرعة في ' + S.cities[car.city].name);
    if (!BREED[g]) return NO('لا تُربّى هذه السلعة');
    const inHerd = GD[g].hu > 0, src = inHerd ? herdOf(car) : car.cargo, have = Math.floor(src[g] || 0);
    const free = farmCap(S, car.city) - farmUnits(f), n = Math.min(Math.floor(qty), have, Math.floor(free / BREED[g].fu)); if (n < 1) return NO(have < 1 ? 'لا ' + GD[g].name + ' معك' : 'المزرعة ممتلئة: وسّعها أو بِع بعضها');
    const b0 = src[g], x = inHerd ? hxOf(car, g) : null, p = x && b0 > 0 ? Math.min(1, x.m / b0) : 0, pp = x && b0 > 0 ? Math.min(1, (x.p || 0) / b0) : 0;
    const fx = hxOf(f, g); if (inHerd && spOf(g) === 'horse') pedMove(x, fx, f.herd[g] || 0, n, p); if (inHerd && GD[g].hyb) hybMove(x, fx, (f.herd[g] || 0) + fx.y, n);
    src[g] = b0 - n; if (inHerd) herdScale(car, g, b0);
    f.herd[g] = (f.herd[g] || 0) + n; if (inHerd) { fx.m += n * p; fx.p = (fx.p || 0) + n * pp; } else herdAdd(f, g, n);
    const cost = takeBasis(car.basis, g, n); addBasis(pr.basis || (pr.basis = {}), g, n, cost);
    return OK('وضعت ' + n + ' ' + GD[g].name + ' في المزرعة');
  },
  farmOut(S, carId, g, qty) {
    const car = carById(S, carId), f = farmOf(S, car.city), pr = S.player.props[car.city]; if (car.left > 0) return NO('القافلة في الطريق'); if (!f) return NO('لا مزرعة هنا');
    const have = Math.floor(f.herd[g] || 0), inHerd = GD[g].hu > 0; let n = Math.min(Math.floor(qty), have);
    if (inHerd) n = Math.min(n, Math.floor((herdCap(car) - herdUnits(car)) / GD[g].hu)); else n = Math.min(n, Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w));
    if (n < 1) return NO(have < 1 ? 'لا ' + GD[g].name + ' بالغة في المزرعة' : inHerd ? 'لا سعة للقطيع: وظّف راعياً' : 'لا مكان في الحمولة');
    const b0 = f.herd[g], x = hxOf(f, g), p = b0 > 0 ? Math.min(1, x.m / b0) : 0, pp = b0 > 0 ? Math.min(1, (x.p || 0) / b0) : 0; f.herd[g] = b0 - n; herdScale(f, g, b0);
    if (inHerd) { const cx = hxOf(car, g); if (spOf(g) === 'horse') pedMove(x, cx, car.herd[g] || 0, n, p); if (GD[g].hyb) hybMove(x, cx, (car.herd[g] || 0) + cx.y, n); herdOf(car)[g] = (car.herd[g] || 0) + n; cx.m += n * p; cx.p = (cx.p || 0) + n * pp; } else car.cargo[g] = (car.cargo[g] || 0) + n;
    const cost = takeBasis(pr.basis || (pr.basis = {}), g, n); addBasis(car.basis, g, n, cost);
    return OK('أخرجت ' + n + ' ' + GD[g].name + ' من المزرعة إلى ' + (inHerd ? 'القطيع' : 'الحمولة'));
  },
  farmSell(S, city, g, qty, kind) {
    const f = farmOf(S, city), c = S.cities[city], pr = S.player.props[city]; if (!f) return NO('لا مزرعة هنا'); ctxFor(S, city);
    if (kind === 'young') {
      const x = (f.hx || {})[g], n0 = Math.min(Math.floor(qty), Math.floor(x ? x.y : 0)); if (n0 < 1) return NO('لا صغار منها');
      const tmp = {}; tmp[g] = n0; const r = sellUnits(S, S.player, c, g, n0, tmp, true, YOUNG_SELL * (spOf(g) === 'horse' ? pedMul(x.yq || 1) : 1) * hyPf(f, g)); if (!r.n) return NO('تعذّر البيع'); x.y -= r.n; logTrade(S, city, g, r.n, 'sell', r.net, r.net);
      return { ok: true, msg: 'بعت ' + r.n + ' من صغار ' + GD[g].name + ' صافي ' + Math.round(r.net) + ' ريال', pl: r.net, net: r.net, n: r.n };
    }
    const b0 = f.herd[g] || 0, r = sellUnits(S, S.player, c, g, qty, f.herd, true, pedMulOf(f, g)); if (!r.n) return NO('لا ' + GD[g].name + ' للبيع'); herdScale(f, g, b0);
    const cost = takeBasis(pr.basis || (pr.basis = {}), g, r.n); logTrade(S, city, g, r.n, 'sell', r.net, r.net - cost);
    return { ok: true, msg: 'بعت ' + r.n + ' ' + GD[g].name + ' صافي ' + Math.round(r.net) + ' ريال', pl: r.net - cost, net: r.net, n: r.n };
  },
  // تزاوج: ذكور الصنف M يلقّحون إناث الصنف F (من النوع نفسه). where = 'car' (قافلة) أو 'farm' (مزرعة في مدينة)
  pairSet(S, where, key, F, M) {
    if (!hybridOpen(S)) return NO('التهجين يُفتح عند المستوى ' + HYB_LV + ' في مسيرتك');
    const h = where === 'farm' ? farmOf(S, key) : carById(S, key); if (!h) return NO(where === 'farm' ? 'لا مزرعة هنا' : 'لا قافلة');
    if (where === 'car' && h.left > 0) return NO('القافلة في الطريق');
    if (!GD[F] || !GD[F].live || !BREED[F]) return NO('لا تُربّى هذه السلعة');
    if (!M || M === F) { if (h.pair) delete h.pair[F]; return OK('عادت إناث ' + GD[F].name + ' للتلقيح بذكور صنفها'); }
    if (spOf(M) !== spOf(F)) return NO('لا يتزاوج إلا صنفان من نوع واحد');
    if (GD[M].hyb && GD[F].hyb) return NO('لا تلقيح بين هجينين هنا: اختر صنفاً أصيلاً');
    if (!(((h.herd || {})[F] || 0) >= 1)) return NO('لا إناث من ' + GD[F].name + ' عندك');
    if (!(((h.herd || {})[M] || 0) >= 1) || malesOf(h, M) < 1) return NO('لا ذكر من ' + GD[M].name + ' عندك');
    h.pair = h.pair || {}; h.pair[F] = M; learnReact(S, 'pairSet');
    return OK('إناث ' + GD[F].name + ' تُلقَّح الآن بذكور ' + GD[M].name + ': المواليد هجين');
  },
  haggleStart(S, g, side, qty) {
    if (!haggleOpen(S)) return NO('تُفتح المساومة عند المستوى ' + HAGGLE.lv + ' في مسيرتك');
    const car = mainCar(S); if (car.left > 0) return NO('القافلة في الطريق'); const c = S.cities[car.city];
    if (!GD[g] || (side !== 'buy' && side !== 'sell')) return NO('مساومة غير صحيحة');
    qty = Math.min(Math.floor(+qty || 0), HAGGLE.maxQty); if (qty < 1) return NO('حدّد الكمية أولاً');
    ctxFor(S, car.city);
    if (side === 'buy') { if (!sells(c, g) || !breedOpen(S, g)) return NO('لا تُباع هنا'); qty = Math.min(qty, Math.floor(c.stock[g] || 0)); }
    else { qty = Math.min(qty, Math.floor(car.cargo[g] || 0) + Math.floor((car.herd || {})[g] || 0)); }
    if (qty < 1) return NO(side === 'buy' ? 'لا مخزون هنا' : 'لا بضاعة معك');
    if (unitPrice(c, g) * qty < HAGGLE.minValue) return NO('الصفقة صغيرة على المساومة: تبدأ من ' + HAGGLE.minValue + ' ريال');
    if (haggleLeft(S, c.id) < 1) return NO('اكتفى تجّار ' + c.name + ' من المساومة اليوم، عُد غداً');
    const h = hgOf(S); h.used[c.id] = (h.used[c.id] || 0) + 1;
    const cu = hgCult(S, c.id), ws = hgWeights(S, c.id), pickMood = () => { const r = rndB(S) * (ws[0] + ws[1] + ws[2]); return r < ws[0] ? HG_MOODS[0] : r < ws[0] + ws[1] ? HG_MOODS[1] : HG_MOODS[2]; };
    h.game = { city: c.id, cc: c.country, culture: cu.name, g, side, qty, round: 0, wins: 0, miss: 0, rounds: cu.rounds, maxMiss: cu.miss, step: cu.step, best: Object.assign({}, cu.best), moods: Array.from({ length: cu.rounds }, pickMood), log: [], done: false, mul: 1 };
    learnReact(S, 'haggleStart');
    return { ok: true, msg: 'بدأت المساومة', game: h.game };
  },
  haggleChoose(S, choice) {
    const h = hgOf(S), G = h.game; if (!G || G.done) return NO('لا مساومة جارية');
    if (!['firm', 'ref', 'praise'].includes(choice)) return NO('أسلوب غير معروف');
    const cu = HG_CULT[G.cc] || HG_CULT.sa, best = (G.best || cu.best)[G.moods[G.round]], mood = G.moods[G.round], right = best === choice, rounds = G.rounds || HAGGLE.rounds, maxMiss = G.maxMiss || HAGGLE.maxMiss;
    G.log.push({ mood, choice, right, best }); if (right) G.wins++; else G.miss++; G.round++;
    if (G.round >= rounds || G.miss >= maxMiss) {
      G.done = true; if (G.wins >= rounds && G.miss === 0) achFlag(S, 'haggle_read'); const step = (G.step || HAGGLE.step) * perkMul(S, 'haggle');
      const lore = (S.player.hgLore = S.player.hgLore || {}); lore[G.cc] = lore[G.cc] || {}; G.log.forEach(l => { lore[G.cc][l.mood] = l.best; }); // خبرة اللاعب: ما انكشف له من طبع هذا السوق
      if (G.wins > 0) { G.mul = G.side === 'buy' ? 1 - step * G.wins : 1 + step * G.wins; h.vouch = { city: G.city, g: G.g, side: G.side, mul: G.mul, left: G.qty, day: S.day, wins: G.wins }; learnReact(S, 'haggleWin', 2); }
      else learnReact(S, 'haggleFail', 2);
    }
    return { ok: true, right, best, mood, done: G.done, wins: G.wins, miss: G.miss, mul: G.mul, trait: right ? '' : cu.trait };
  },
  haggleClose(S) { const h = hgOf(S); h.game = null; return OK('أُغلقت المساومة'); },
  dlgOpen(S, id) {
    const D = DLG.DIALOGS[id]; if (!D) return NO('لا حوار');
    const car = mainCar(S); if (car.city !== D.city || car.left > 0) return NO('عليك أن تكون في ' + S.cities[D.city].name + ' لتتحدث هنا');
    const st = stOf(S); let node = null;
    for (const r of D.start) if (dlgOk(S, r.if)) { node = r.node; break; }
    st.cur = { id, node: node || Object.keys(D.nodes)[0] };
    return { ok: true, msg: '', view: dlgView(S) };
  },
  dlgChoose(S, k) {
    const st = stOf(S), cur = st.cur; if (!cur) return NO('لا حوار جارٍ');
    const D = DLG.DIALOGS[cur.id], N = D.nodes[cur.node], o = (N.opts || [])[k];
    if (!o || !dlgOk(S, o.if)) return NO('خيار غير متاح');
    const msgs = dlgDo(S, o.do, D.city);
    if (o.end || !o.next) st.cur = null; else cur.node = o.next;
    return { ok: true, msg: msgs.join(' · '), msgs, view: dlgView(S) };
  },
  dlgClose(S) { stOf(S).cur = null; return OK('أُغلق الحوار'); },
  roadChoose(S, choice) { if (!S.road) return NO('لا حدث على الطريق'); if (!['fight', 'pay', 'evade'].includes(choice)) return NO('اختيار غير صحيح'); return roadResolve(S, choice); },
  buildButcher(S, city) {
    if (S.phase < FARM_PHASE) return NO('تُفتح في الطور ' + FARM_PHASE);
    const c = S.cities[city], pr = S.player.props[city]; ctxFor(S, city);
    if (!pr || !pr.farm) return NO('الملحمة لصاحب مزرعة: ابنِ مزرعة في ' + (c ? c.name : 'المدينة') + ' أولاً');
    if (pr.butcher) return NO('لك ملحمة هنا');
    const cost = Math.round(BUTCHER_COST * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); pr.butcher = { lv: 1, sold: 0, rev: 0, today: 0 }; learnReact(S, 'buildButcher');
    return OK('فتحتَ ملحمة في ' + c.name + ': تذبح من مزرعتك وتبيع اللحم الطازج في السوق');
  },
  cutMeat(S, city, g, qty) {
    const f = farmOf(S, city), pr = S.player.props[city]; if (!f || !pr) return NO('لا مزرعة هنا'); if (!pr.butcher) return NO('تحتاج ملحمة في هذه المدينة');
    if (!MEAT[g]) return NO(spOf(g) === 'horse' ? 'لا تُذبح الخيل' : 'لا تُذبح هذه');
    const have = Math.floor(f.herd[g] || 0); let n = Math.min(Math.floor(qty), have); if (n < 1) return NO('لا ' + GD[g].name + ' بالغة');
    const ym = MEAT[g] * hyMul(f, g, 'meat') * FRESH_X, room = Math.floor(storeRoom(S, city) / GD.meat.w), maxN = Math.floor(room / ym); n = Math.min(n, maxN); if (n < 1) return NO('مخزنك لا يتسع للحم الطازج');
    const b0 = f.herd[g]; f.herd[g] = b0 - n; herdScale(f, g, b0); const cost = takeBasis(pr.basis || (pr.basis = {}), g, n), y = Math.floor(n * ym);
    pr.store.meat = (pr.store.meat || 0) + y; addBasis(pr.basis, 'meat', y, cost); learnReact(S, 'cutMeat');
    return OK('ذبحت ' + n + ' ' + GD[g].name + ' فصار عندك ' + y + ' لحماً طازجاً: تبيعه الملحمة خلال أيام قبل أن يفسد');
  },
  slaughter(S, city, g, qty) {
    const f = farmOf(S, city), pr = S.player.props[city]; if (!f) return NO('لا مزرعة هنا'); if (!MEAT[g]) return NO(spOf(g) === 'horse' ? 'لا تُذبح الخيل هنا' : 'لا تُذبح هذه');
    const have = Math.floor(f.herd[g] || 0); let n = Math.min(Math.floor(qty), have); if (n < 1) return NO('لا ' + GD[g].name + ' بالغة');
    const ym = MEAT[g] * hyMul(f, g, 'meat'), room = Math.floor(storeRoom(S, city) / GD.jerky.w), maxN = Math.floor(room / ym); n = Math.min(n, maxN); if (n < 1) return NO('مخزنك لا يتسع للحم المجفف');
    const b0 = f.herd[g]; f.herd[g] = b0 - n; herdScale(f, g, b0); const cost = takeBasis(pr.basis || (pr.basis = {}), g, n), y = Math.floor(n * ym);
    pr.store.jerky = (pr.store.jerky || 0) + y; addBasis(pr.basis, 'jerky', y, cost);
    return OK('ذبحت ' + n + ' ' + GD[g].name + ' وحصلت على ' + y + ' من اللحم المجفف في مخزنك');
  },
  hireStaff(S, city, role) {
    if (S.phase < 2) return NO('يُفتح في الطور 2');
    const pr = S.player.props[city], c = S.cities[city]; ctxFor(S, city);
    if (!pr || !WK[role]) return NO('لا عمل هنا');
    if (role === 'seller' && !pr.shops.length) return NO('لا دكان تحتاج بائعاً');
    if (role === 'keeper' && !pr.whs) return NO('لا مخزن يحتاج أميناً');
    if (role === 'farmer' && !pr.farm) return NO('لا مزرعة تحتاج مزارعاً');
    if (hirePool(S, city) < 1) return NO('لا عمّال متاحون في ' + c.name + ' الآن');
    const w = { id: S.nextId++, role, days: 0, late: 0 }, fee = wkWage(S, c, w) * 2; if (S.player.gold < fee) return NO('رسوم التوظيف ' + fee);
    pPay(S, 'staff', fee, true); pr.staff = pr.staff || []; pr.staff.push(w); return OK('وظّفت ' + WK[role].name + ' في ' + c.name + ' (' + wkWage(S, c, w) + ' ريال يومياً)');
  },
  hireFill(S, city) {
    const pr = S.player.props[city]; if (!pr) return NO('لا عقار هنا'); let n = 0, guard = 0;
    while (guard++ < 40) {
      const role = sellerPts(S, city) + 1e-9 < sellerNeed(S, city) ? 'seller' : staffOf(S, city).filter(w => w.role === 'keeper').length < keeperNeed(S, city) ? 'keeper' : farmCover(S, city) < 1 - 1e-9 ? 'farmer' : null;
      if (!role || !A.hireStaff(S, city, role).ok) break; n++;
    }
    return n ? OK('وظّفت ' + n + ' عاملاً') : NO('الطاقم مكتمل أو لا عمّال/رصيد');
  },
  fireStaff(S, city, id) {
    const pr = S.player.props[city]; if (!pr || !(pr.staff || []).some(w => w.id === id)) return NO('لا عامل');
    pr.staff = pr.staff.filter(w => w.id !== id); return OK('سرّحت العامل');
  },
  shopSetItem(S, city, shopId, g, price, auto) {
    const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان');
    price = clamp(price, 0.5, 2);
    const ex = sh.items.find(i => i.g === g);
    if (ex) { ex.price = price; ex.auto = auto !== false; return OK('حُدّث السعر'); }
    if (sh.items.length >= shItemsMax(sh)) return NO((shKind(sh) === 'stall' ? 'البسطة' : 'الدكان') + ' تتسع لـ ' + shItemsMax(sh) + ' سلع فقط');
    sh.items.push({ g, price, auto: auto !== false, buyBelow: 0.9, target: 60, sold: 0, revenue: 0 });
    return OK('أُضيفت ' + GD[g].name + ' للدكان');
  },
  shopRemoveItem(S, city, shopId, g) { const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان'); sh.items = sh.items.filter(i => i.g !== g); return OK('أُزيلت السلعة'); },
  toStore(S, carId, g, qty) {
    const car = carById(S, carId), pr = S.player.props[car.city];
    if (!pr || !hasPresence(S, car.city) || car.left > 0) return NO('لا مخزن هنا');
    qty = Math.min(qty, Math.floor(car.cargo[g] || 0), Math.floor(storeRoom(S, car.city) / GD[g].w));
    if (qty <= 0) return NO('لا بضاعة أو المخزن ممتلئ');
    const ql = qualOf(car.basis, g), bc = takeBasis(car.basis, g, qty); pr.basis = pr.basis || {}; addBasis(pr.basis, g, qty, bc, ql);
    car.cargo[g] -= qty; pr.store[g] = (pr.store[g] || 0) + qty; return OK('أودعت ' + qty + ' ' + GD[g].name);
  },
  fromStore(S, carId, g, qty) {
    const car = carById(S, carId), pr = S.player.props[car.city];
    if (!pr || car.left > 0) return NO('لا مخزن هنا');
    qty = Math.min(qty, Math.floor(pr.store[g] || 0), Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w));
    if (qty <= 0) return NO('لا مجال أو لا مخزون');
    const ql = qualOf(pr.basis, g), bc = takeBasis(pr.basis || (pr.basis = {}), g, qty); addBasis(car.basis, g, qty, bc, ql);
    pr.store[g] -= qty; car.cargo[g] = (car.cargo[g] || 0) + qty; return OK('حمّلت ' + qty + ' ' + GD[g].name);
  },
  buildFactory(S, city, recipe) {
    if (S.phase < 3) return NO('يُفتح في الطور 3');
    const rc = RECIPES[recipe], c = S.cities[city]; if (!rc || !c) return NO('مصنع غير معروف'); ctxFor(S, city);
    if (!hasPresence(S, city)) return NO('يلزم دكان (ومخزن) في المدينة أولاً');
    const local = factoryLocal(c, rc), ex = S.player.factories.find(f => f.city === city && f.recipe === recipe);
    if (ex) { if (ex.level >= 3) return NO('أعلى مستوى'); const cost = local ? 2500 + ex.level * 2500 : Math.round(factoryBase(ex) * 0.4 * ex.level); if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); ex.level++; return OK('رُقّيت الورشة'); }
    if (local) { const cost = Math.round(4000 * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); S.player.factories.push({ id: S.nextId++, city, recipe, level: 1 }); return OK('بُنيت ' + rc.name); }
    // غير محلي
    const mc = factoryMakeBlock(S, city, recipe); if (mc) return NO(mc);
    const cost = MFG_COST(rc.out); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); S.player.factories.push({ id: S.nextId++, city, recipe, level: 1, local: false, hp: 100, since: S.day, set: { minBal: 0, maxBuy: 1.3, sell: 'hold' }, acc: 0, accCost: 0 });
    learnReact(S, 'factoryAbroad');
    return OK('بُنيت ' + rc.name + ' في ' + c.name + ' بجودة ≈ ' + Math.round(reputation(S).quality) + '٪ من الأصلي');
  },
  buyCraft(S, origin) {
    const bs = bossOf(S, origin); if (!bs) return NO('لا زعيم هنا');
    if (bs.craft) return NO('الإذن عندك مسبقاً'); if (bs.trust < CRAFT_TRUST) return NO('يحتاج ثقة ' + CRAFT_TRUST + ' (ثقته بك ' + Math.round(bs.trust) + ')');
    const cost = CRAFT_COST; if (S.player.gold < cost) return NO('تحتاج ' + cost); ctxFor(S, origin); pPay(S, 'pactFee', cost, true); bs.craft = true;
    return OK('نقلتَ صنعة ' + S.cities[origin].name + ': يحق لك تصنيع منتجها في مدن أخرى');
  },
  setFactory(S, id, key, val) {
    const f = S.player.factories.find(x => x.id === id); if (!f || !isAbroad(f)) return NO('لا مصنع');
    f.set = f.set || { minBal: 0, maxBuy: 1.3, sell: 'hold' };
    if (key === 'sell') { if (val !== 'now' && val !== 'hold') return NO('خيار غير صحيح'); f.set.sell = val; }
    else if (key === 'minBal') f.set.minBal = clamp(Math.round(+val || 0), 0, 100000);
    else if (key === 'maxBuy') f.set.maxBuy = clamp(+val || 1.3, 0.6, 2);
    else return NO('إعداد غير معروف');
    return OK('حُفظ الإعداد');
  },
  rescueFactory(S, id) {
    const f = S.player.factories.find(x => x.id === id); if (!f || !f.crisis) return NO('المصنع ليس في أزمة');
    const fine = Math.round(factoryValue(f) * FACT_HP.rescue); if (S.player.gold < fine) return NO('تحتاج ' + fine); ctxFor(S, f.city); pPay(S, 'fine', fine, true);
    f.crisis = null; f.hp = 50; f.late = 0; f.since = S.day - FACT_HP.grace + 10; return OK('أنقذتَ المصنع بغرامة ' + fine + ' ريال');
  },
  hireManager(S, city, lv) {
    if (S.phase < 3) return NO('يُفتح في الطور 3'); const pr = S.player.props[city]; if (!pr || !hasPresence(S, city)) return NO('يلزم دكان لك في المدينة');
    lv = Math.max(1, Math.min(3, Math.floor(lv || 1))); const w = MGR[lv].wage, fee = w * 3; if (pr.mgr && pr.mgr.lv === lv) return NO('عندك ' + MGR[lv].name);
    if (S.player.gold < fee) return NO('رسوم التعيين ' + fee); ctxFor(S, city); pPay(S, 'staff', fee, true);
    pr.mgr = { lv, since: S.day, audit: S.day, late: 0 }; learnReact(S, 'hireMgr');
    return OK('عيّنتَ ' + MGR[lv].name + ' لأعمالك في ' + S.cities[city].name + ' (' + w + ' يومياً، يدير حتى ' + MGR[lv].cap + ' أصول)');
  },
  fireManager(S, city) { const pr = S.player.props[city]; if (!pr || !pr.mgr) return NO('لا مدير'); pr.mgr = null; return OK('سرّحتَ المدير'); },
  auditCity(S, city) { const pr = S.player.props[city]; if (!pr || !pr.mgr) return NO('لا مدير'); pr.mgr.audit = S.day; return OK('راجعتَ حسابات المدير: الأمور سليمة'); },
  invest(S, city, amt) { if (S.phase < 4) return NO('يُفتح في الطور 4'); amt = Math.min(amt, S.player.gold); if (!(amt > 0)) return NO('لا رصيد'); S.player.gold -= amt; S.player.bank.dep[city] = (S.player.bank.dep[city] || 0) + amt; return OK('ضاربتَ بـ' + Math.round(amt) + ' ريال في ' + S.cities[city].name + ': حصتك ' + Math.round(FIN.mud.share * 100) + '٪ من الربح، والخسارة على رأس المال'); },
  divest(S, city, amt) { const d = S.player.bank.dep[city] || 0; amt = Math.min(amt, d); if (!(amt > 0)) return NO('لا رصيد'); const fee = amt * FIN.mud.fee; S.player.bank.dep[city] -= amt; S.player.gold += amt - fee; sink(S, 'bankFee', fee); return OK('سحبتَ ' + Math.round(amt - fee) + ' (رسم إداري ' + Math.round(FIN.mud.fee * 100) + '٪)'); },
  murabaha(S, g, qty, term) {
    if (S.phase < 4) return NO('يُفتح في الطور 4'); const car = mainCar(S); if (car.left > 0) return NO('في الطريق'); if (bankLate(S)) return NO('عليك دَين متأخر: سدّده قبل تمويل جديد');
    const q = murabahaQuote(S, g, qty, +term); if (!q.ok) return NO(q.msg);
    const lim = Math.max(0, netWorth(S) * FIN.mur.limit - bankDebt(S)); if (q.face > lim) return NO('حدّ التمويل ' + Math.floor(lim) + ' ريال (50٪ من ثروتك ناقص ما عليك)');
    const c = S.cities[car.city]; ctxFor(S, car.city); const room = capOfCar(car) - loadOf(car), acct = { gold: 1e12 };
    const res = buyUnits(S, acct, c, g, q.n, room, car.cargo, true, false); if (!res.n) return NO('تعذّر الشراء');
    const face = res.cost * (1 + q.markup); addBasis(car.basis, g, res.n, face);
    S.player.bank.loans.push({ id: S.nextId++, type: 'mur', amt: face, face, markup: q.markup, day: S.day, due: S.day + q.term, g, n: res.n, late: 0 });
    return OK('اشترى لك المموّل ' + res.n + ' ' + GD[g].name + ' بـ' + Math.round(res.cost) + ' وباعها لك بـ' + Math.round(face) + ' (هامش ' + Math.round(q.markup * 100) + '٪ معلوم سلفاً) تسدّدها خلال ' + q.term + ' يوماً');
  },
  qard(S, amt) {
    if (S.phase < 4) return NO('يُفتح في الطور 4'); const car = mainCar(S); if (car.left > 0) return NO('في الطريق'); if (bankLate(S)) return NO('عليك دَين متأخر: سدّده أولاً');
    const bs = bossOf(S, car.city), lim = Math.min(FIN.qard.max, FIN.qard.base + FIN.qard.perTrust * Math.max(0, bs.trust - FIN.qard.trust));
    if (bs.trust < FIN.qard.trust) return NO('القرض الحسن يحتاج ثقة ' + FIN.qard.trust + ' عند زعيم ' + S.cities[car.city].name + ' (ثقتك ' + Math.round(bs.trust) + ')');
    if (S.player.bank.loans.some(l => l.type === 'qard' && l.city === car.city)) return NO('عندك قرض حسن قائم عند هذا الزعيم');
    amt = Math.floor(+amt || 0); if (!(amt >= 100) || amt > lim) return NO('المبلغ بين 100 و' + lim);
    S.player.gold += amt; S.player.bank.loans.push({ id: S.nextId++, type: 'qard', amt, face: amt, markup: 0, day: S.day, due: S.day + FIN.qard.days, city: car.city, late: 0 });
    return OK('أقرضك ' + bs.name + ' ' + amt + ' ريال قرضاً حسناً بلا زيادة، تردّها خلال ' + FIN.qard.days + ' يوماً');
  },
  settle(S, id) {
    const P = S.player; const L = id == null ? P.bank.loans.slice() : P.bank.loans.filter(l => l.id === id); if (!L.length) return NO('لا دَين'); let paid = 0;
    for (const l of L) { const p = Math.min(P.gold, l.amt); if (p > 0) { P.gold -= p; l.amt -= p; paid += p; } }
    P.bank.loans = P.bank.loans.filter(l => l.amt > 0.5); return paid > 0 ? OK('سدّدتَ ' + Math.round(paid) + ' ريال' + (P.bank.loans.length ? '' : ' وبرئت ذمتك')) : NO('لا رصيد للسداد');
  },
  buySukuk(S) { if (S.phase < 4) return NO('يُفتح في الطور 4'); if (S.player.gold < FIN.sukuk.amt) return NO('تحتاج ' + FIN.sukuk.amt); S.player.gold -= FIN.sukuk.amt; S.player.bank.bonds.push({ amt: FIN.sukuk.amt, due: S.day + FIN.sukuk.days }); return OK('شاركتَ بصكّ في قافلة تجارية (' + FIN.sukuk.days + ' يوماً): الربح والخسارة بحسب نتيجة التجارة'); },
  upgradeMarket(S, city) {
    if (S.phase < 4) return NO('يُفتح في الطور 4');
    const c = S.cities[city]; if (c.tier >= 3) return NO('أعلى رتبة'); const cost = c.tier === 1 ? 8000 : 25000;
    if (S.player.gold < cost) return NO('تحتاج ' + cost); pPay(S, 'assets', cost); c.tier++; c.cap = capOf(c);
    news(S, 'ارتقى سوق ' + c.name + ' إلى الرتبة ' + c.tier + '.', 'good'); return OK('رُقّي السوق');
  },
  foundCity(S, country, good) {
    if (S.phase < 4) return NO('يُفتح في الطور 4');
    if (S.order.length >= 20) return NO('اكتمل العالم'); if (S.player.gold < 60000) return NO('تحتاج 60,000'); pPay(S, 'foundCity', 60000, true);
    const id = 'new' + S.nextId++, ct = CD[country];
    const d = { id, name: 'مستوطنة ' + ct.name + ' ' + (S.order.length - 15), country, x: ct.cx + rr(S, -60, 60), y: ct.cy + rr(S, -50, 50), size: 0.6, tax: 0.04, makes: [good, 'wheat'], owner: 'player' };
    S.cities[id] = makeCity(S, d); S.cities[id].pop = [150, 300, 120, 30]; S.order.push(id); ensureRisks(S); snapshotKnown(S, [id]);
    news(S, 'أسّست ' + d.name + '! تحصل على 20٪ من ضرائبها.', 'good'); return OK('تأسست المدينة');
  },
  exchange(S, from, to, amt) {
    if (from === to) return NO('اختر عملتين مختلفتين');
    const w = S.player.wallet; amt = Math.min(+amt || 0, w[from]); if (!(amt > 0.0001)) return NO('لا رصيد كافٍ في محفظة ' + CURS[from].name);
    const val = amt * rateOf(S, from), fee = val * feeOf(from, to) * perkMul(S, 'fxFee'), got = (val - fee) / rateOf(S, to);
    w[from] -= amt; w[to] += got; sink(S, 'exchange', fee); S.player.led.exp.exchange = (S.player.led.exp.exchange || 0) + fee;
    return OK('حوّلت ' + (from === 'au' || from === 'ag' ? amt.toFixed(2) : Math.round(amt)) + ' ' + CURS[from].name + ' إلى ' + (to === 'au' || to === 'ag' ? got.toFixed(2) : Math.round(got)) + ' ' + CURS[to].name + ' (رسم ' + Math.round(fee) + ' ريال)');
  },
  // --- الزعماء والعقود ---
  lobby(S, city, pts) {
    const bs = bossOf(S, city), c = S.cities[city]; if (!bs) return NO('لا زعيم هنا');
    if (!bossActive(S)) return NO('يُفتح في الطور 2');
    if (bs.ruler === 'player') return NO('أنت الحاكم أصلاً');
    pts = Math.max(1, Math.floor(pts || 5)); ctxFor(S, city);
    const cost = Math.round(pts * 150 * c.size * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'lobby', cost, true); bs.p = clamp(bs.p + pts, 0, 100); bs.trust = clamp(bs.trust - pts * 0.6, -100, 100);
    return OK('كسبت ' + pts + ' نقاط نفوذ في ' + c.name + ' بـ ' + cost + ' ريال (الزعيم يضيق منك قليلاً)');
  },
  gift(S, city) {
    const bs = bossOf(S, city), c = S.cities[city]; if (!bs) return NO('لا زعيم هنا');
    if (!bossActive(S)) return NO('يُفتح في الطور 2');
    if (bs.ruler === 'player') return NO('أنت الحاكم');
    if (S.day - bs.gift < 10) return NO('أهديته قبل أيام، انتظر ' + (10 - (S.day - bs.gift)) + ' أيام');
    ctxFor(S, city); const cost = Math.round(500 * c.size * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'gift', cost, true); bs.gift = S.day; bs.trust = clamp(bs.trust + (loreStyle(bs, city) === 'gen' ? 9 : 6), -100, 100);
    return OK('أهديت ' + bs.name + ' هدية بـ ' + cost + ' ريال: ثقته بك ' + Math.round(bs.trust));
  },
  negotiate(S, city, type) {
    const bs = bossOf(S, city); if (!bs || !PACTS[type]) return NO('لا عرض');
    const why = pactBlock(S, city, type); if (why) return NO(why);
    if (bs.disc[type] && bs.disc[type] > S.day) return NO('فاوضتَه فعلاً: العرض الجديد قائم');
    const sty = loreStyle(bs, city), chance = clamp(0.35 + bs.trust / 200 + bossShare(bs) * 0.3 + (sty === 'patient' && S.day - (bs.lastNeg == null ? -99 : bs.lastNeg) >= 5 ? 0.1 : 0), 0.1, 0.85); bs.lastNeg = S.day;
    if (rnd(S) < chance) { bs.disc[type] = S.day + 10; return OK('نجحت المفاوضة: خفّض ' + bs.name + ' الشروط 20٪ (العرض قائم 10 أيام)'); }
    bs.trust = clamp(bs.trust - (sty === 'stern' ? 8 : 5), -100, 100); bs.cd = S.day + 3;
    return NO('رفض ' + bs.name + ' التفاوض وغضب منك (ثقة ' + Math.round(bs.trust) + ')');
  },
  signPact(S, city, type) {
    const why = pactBlock(S, city, type); if (why) return NO(why);
    const bs = bossOf(S, city), t = pactTerms(S, city, type); ctxFor(S, city);
    if (t.upfront > 0) { if (S.player.gold < t.upfront) return NO('الدفعة المقدّمة ' + t.upfront); pPay(S, 'pact', t.upfront, true); }
    bs.pacted = true; S.player.pacts.push({ id: S.nextId++, city, type, left: t.days, total: t.days, daily: t.daily, penalty: t.penalty, share: t.share, since: S.day });
    delete bs.disc[type]; if (type === 'exclusive') learnReact(S, 'exclSign');
    return OK('وقّعت ' + PACTS[type].name + ' مع ' + bs.name + ' لمدة ' + t.days + ' يوماً');
  },
  breakPact(S, city) {
    const pc = pactIn(S, city), bs = bossOf(S, city); if (!pc) return NO('لا عقد');
    ctxFor(S, city); const pay = Math.min(pc.penalty, S.player.gold); if (pay > 0) pPay(S, 'pactPenalty', pay, true);
    S.player.pacts = S.player.pacts.filter(x => x !== pc); bs.trust = clamp(bs.trust - 30, -100, 100); bs.cd = S.day + 15; repOf(S.player).broke++;
    return OK('فسخت العقد ودفعت ' + Math.round(pay) + ' بنداً جزائياً. غضب ' + bs.name + ' منك.');
  },
  work(S) { const car = mainCar(S); if (car.left > 0) return NO('أنت في الطريق'); if (S.player.gold > 150) return NO('لا تحتاج؛ عندك ذهب'); S.player.gold += 40; S.player.led.inc.labor = (S.player.led.inc.labor || 0) + 40; fauc(S, 'labor', 40); return OK('اشتغلت حمّالاً في السوق: +40'); },
};

for (const k of Object.keys(A)) { const f = A[k]; A[k] = function (S) { S.ctxCur = 'sar'; return f.apply(null, arguments); }; }

/* ---------- عروض وتسعير تقديري (لا تغيّر الحالة) ---------- */
function quoteBuy(S, city, g, qty, budget, anyGood) {
  const c = S.cities[city]; let st = c.stock[g], cost = 0, n = 0, last = 0; qty = Math.min(Math.floor(qty), Math.floor(st));
  if (!anyGood && (!sells(c, g) || !breedOpen(S, g))) qty = 0;
  if (quotaOn(S, c, g)) qty = Math.min(qty, Math.floor(quotaLeft(S, c)));
  const bm = buyMul(S, c, g), vm = vouchMul(S, city, g, 'buy'), vl = vouchLeft(S, city, g, 'buy');
  for (; n < qty; n++) { const p = priceAt(c, g, st) * bm * (n < vl ? vm : 1); if (budget != null && cost + p > budget) break; cost += p; st -= 1; last = p; }
  return { n, cost, avg: n ? cost / n : 0, last, first: n ? priceAt(c, g, c.stock[g]) * bm : 0 };
}
function quoteSell(S, city, g, qty, haggle, tr) {
  const c = S.cities[city]; let st = c.stock[g], gross = 0, n = 0; qty = Math.floor(qty); if (tr == null) tr = taxRate(S, c, true);
  const vm = vouchMul(S, city, g, 'sell'), vl = vouchLeft(S, city, g, 'sell');
  for (; n < qty; n++) { gross += priceAt(c, g, st) * (haggle || 1) * (n < vl ? vm : 1); st = Math.min(st + 1, capG(c, g) * 1.2); }
  const tax = gross * tr; return { n, gross, tax, net: gross - tax, avg: n ? (gross - tax) / n : 0 };
}
const liveCity = (S, id) => hasPresence(S, id) || mainCar(S).city === id && mainCar(S).left === 0;
// أين أبيع هذه السلعة وكم أربح؟ تقدير بمعلومات اللاعب (سعر معروف + ميل الانزلاق العام)
function sellOptions(S, fromCity, g, qty, unitCost, car) {
  car = car || mainCar(S); qty = Math.max(1, Math.floor(qty)); const G = GD[g], P = S.player, fc = S.cities[fromCity];
  const wheat = unitPrice(fc, 'wheat'), tr0 = taxRate(S, fc, true), out = [];
  S.order.forEach(id => {
    if (id === fromCity) return;
    const c = S.cities[id], live = liveCity(S, id), k = P.known[id], p0 = live ? unitPrice(c, g) : k.p[g], age = live ? 0 : S.day - k.day;
    const slope = (G.pmax - G.pmin) * G.cult[c.country] * c.idx[g] / capG(c, g);
    const avg = Math.max(G.pmin * 0.4, p0 - slope * (qty - 1) / 2), gross = avg * qty * qualOf(car.basis, g), tr = taxRate(S, c, true), tax = gross * tr;
    const cuRate = c.country === fc.country ? 0 : CD[c.country].customs, customs = cuRate * qty * (unitCost > 0 ? unitCost : p0);
    const days = tripDays(S, car, fromCity, id), prov = (supplyNeed(car, days) + (GD[g].fod ? Math.ceil(qty * GD[g].fod * days) : 0)) * wheat, risk = S.risk[riskKey(fromCity, id)];
    const net = gross - tax - customs, profit = net - unitCost * qty - prov;
    out.push({ city: id, country: c.country, cur: curOf(c.country), price: p0, age, days, risk, tax, customs, prov, net, profit, perUnit: profit / qty, live });
  });
  return out.sort((a, b) => b.profit - a.profit);
}
function storeSummary(S) {
  const rows = []; let cap = 0, load = 0;
  for (const city in S.player.props) { const c = E_cap(S, city), l = storeLoad(S, city); if (c <= 0) continue; rows.push({ city, cap: c, load: l, shops: shopsOf(S, city).length, whs: whsOf(S, city) }); cap += c; load += l; }
  return { rows, cap, load, free: cap - load };
}
const E_cap = (S, city) => storeCap(S, city);
// ما في هذا السوق، وما أستطيع أخذه، وهل تكفي القافلة ومخازني
function marketInfo(S, city, carId) {
  const car = carById(S, carId || 1) || mainCar(S), c = S.cities[city], P = S.player, gold = P.gold;
  const carRoom = capOfCar(car) - loadOf(car), storeFree = storeRoom(S, city), hasStore = hasPresence(S, city);
  const goods = GIDS.map(g => {
    const G = GD[g], sold = sells(c, g), stock = sold ? Math.floor(c.stock[g]) : 0, price = unitPrice(c, g);
    const afford = quoteBuy(S, city, g, stock, gold).n, carU = Math.floor(carRoom / G.w), storeU = hasStore ? Math.floor(storeFree / G.w) : 0;
    const wanted = Math.min(stock, afford), canCar = Math.min(wanted, carU), canStore = Math.min(wanted, storeU);
    const qo = sold && quotaOn(S, c, g), ql = qo ? Math.floor(quotaLeft(S, c)) : Infinity, qpd = qo ? quotaPerDay(S, c) : Infinity;
    const limit = wanted <= 0 ? (stock < 1 ? 'stock' : ql < 1 ? 'quota' : 'gold') : canCar < wanted ? 'room' : (qo && ql < stock && afford <= ql) ? 'quota' : stock <= afford ? 'stock' : 'gold';
    const fitsCar = carU >= wanted && wanted > 0, fitsStore = hasStore && storeU >= wanted && wanted > 0;
    return { g, sold, stock, price, ratio: price / refPrice(c, g), afford, wanted, canCar, canStore, carU, storeU, limit, quota: qo && ql !== Infinity ? { left: ql, perDay: qpd, cap: qpd * QUOTA_DAYS } : null, fitsCar, fitsStore, fits: fitsCar && fitsStore ? 'both' : fitsCar ? 'car' : fitsStore ? 'store' : 'none', have: Math.floor(car.cargo[g] || 0), avg: avgCost(car.basis, g) };
  });
  const soldGoods = goods.filter(x => x.sold), missing = soldGoods.filter(x => x.stock < 1).map(x => x.g), ss = storeSummary(S);
  return { goods, present: soldGoods.length - missing.length, total: soldGoods.length, missing, carRoom, carCap: capOfCar(car), carLoad: loadOf(car), store: { has: hasStore, cap: storeCap(S, city), load: storeLoad(S, city), free: storeFree }, all: ss };
}

/* ---------- اختبار ضغط ---------- */
function botMain(S) {
  const car = mainCar(S), P = S.player; if (car.left > 0) return;
  const c = S.cities[car.city]; ctxFor(S, car.city);
  for (const g of GIDS) if (car.cargo[g] >= 1) sellUnits(S, P, c, g, car.cargo[g], car.cargo, true, 1);
  let best = null; const wheat = unitPrice(c, 'wheat');
  for (const g of GIDS) for (const d of S.order) {
    if (d === car.city || !sells(c, g) || GD[g].sp) continue; // اللاعب الآلي معيار الاقتصاد الأساسي: لا يتاجر في أصناف المواشي الخاصة
    const dc = S.cities[d], days = tripDays(S, car, car.city, d), cus = dc.country === c.country ? 0 : CD[dc.country].customs;
    const pb = unitPrice(c, g) * 1.02, ps = unitPrice(dc, g) * (1 - dc.tax - cus);
    const prov = supplyNeed(car, days) * wheat, w = GD[g].w, fu = (GD[g].fod || 0) * days * wheat;
    const q = Math.floor(Math.min((capOfCar(car) - loadOf(car)) / w, Math.max(0, P.gold - prov - 50) / (pb + fu), c.stock[g] * 0.5));
    const m = (q * (ps - pb - fu) - prov) / days;
    if (q >= 1 && (!best || m > best.m)) best = { g, d, m, fu, q };
  }
  if (P.gold < 100 && !Object.keys(car.cargo).some(g => car.cargo[g] >= 1)) { A.work(S); return; }
  if (best && best.m > 0) { const room = capOfCar(car) - loadOf(car), b = { gold: Math.max(0, P.gold - 150 - best.q * best.fu) }; const r = buyUnits(S, b, c, best.g, room / GD[best.g].w, room, car.cargo, true); P.gold -= r.cost; startTrip(S, car, best.d); }
  else { const o = S.order.filter(x => x !== car.city); startTrip(S, car, o[Math.floor(rnd(S) * o.length)]); }
}
function botBuild(S) {
  const P = S.player;
  if (S.phase >= 2 && P.caravans.length < 3 && P.gold > 4500) { A.hireCaptain(S); const car = P.caravans[P.caravans.length - 1]; car.route = { a: 'jeddah', b: 'riyadh', buyA: 'coffee', buyB: 'dates' }; car.carts = 2; }
  if (S.phase >= 2 && !shopsOf(S, 'riyadh').length && P.gold > 6000) { A.buildShop(S, 'riyadh'); const sh = shopsOf(S, 'riyadh')[0]; if (sh) { A.shopSetItem(S, 'riyadh', sh.id, 'wheat', 1.05); A.shopSetItem(S, 'riyadh', sh.id, 'dates', 1.1); } }
  if (S.phase >= 2 && shopsOf(S, 'riyadh').length && shopsOf(S, 'riyadh').length < 3 && P.gold > 9000) A.buildShop(S, 'riyadh');
  if (S.phase >= 2 && whsOf(S, 'riyadh') < shopsOf(S, 'riyadh').length && P.gold > 5000) A.buildWarehouse(S, 'riyadh');
  if (S.phase >= 2 && shopsOf(S, 'riyadh').length && S.day % 5 === 0) A.hireFill(S, 'riyadh');
  if (S.phase >= 3 && shopsOf(S, 'riyadh').length && !P.factories.length && P.gold > 8000) A.buildFactory(S, 'riyadh', 'perfume');
  if (S.phase >= 4 && P.gold > 30000) A.invest(S, 'riyadh', P.gold * 0.3);
}
function stressTest(opt) {
  opt = opt || {}; const seeds = opt.seeds || 12, days = opt.days || 100, bot = opt.bot !== false;
  const out = { seeds, days, bot, nan: 0, minRatio: 9, maxRatio: 0, floor: 0, ceil: 0, cellDays: 0, agentGold: [], playerNW: [], bailouts: [], pop: [0, 0, 0, 0], food: [], sinks: {}, fauc: {}, shopRev: [], countryFood: {} };
  for (let s = 1; s <= seeds; s++) {
    const S = newGame(s * 7919);
    for (let d = 0; d < days; d++) {
      if (bot) { botMain(S); botBuild(S); }
      tick(S);
      for (const id of S.order) { const c = S.cities[id]; for (const g of GIDS) {
        const r = ratio(c, g); out.cellDays++;
        if (!isFinite(r) || isNaN(c.stock[g])) out.nan++;
        out.minRatio = Math.min(out.minRatio, r); out.maxRatio = Math.max(out.maxRatio, r);
        if (c.stock[g] <= 0.5) out.floor++; if (c.stock[g] >= capG(c, g) * 1.19) out.ceil++;
      } }
    }
    out.agentGold.push(S.agents.reduce((a, x) => a + x.gold, 0) / S.agents.length);
    out.playerNW.push(Math.round(netWorth(S)));
    out.bailouts.push(S.stats.bailouts || 0);
    out.shopRev.push(Math.round(S.player.led.inc.shops || 0));
    let fs = 0; for (const id of S.order) { const c = S.cities[id]; c.pop.forEach((v, i) => out.pop[i] += v / seeds); fs += c.sat.food; out.countryFood[c.country] = (out.countryFood[c.country] || 0) + c.sat.food / seeds / S.order.filter(x => S.cities[x].country === c.country).length; }
    out.food.push(+(fs / S.order.length).toFixed(2));
    for (const k in S.stats.sink) out.sinks[k] = (out.sinks[k] || 0) + S.stats.sink[k] / seeds;
    for (const k in S.stats.fauc) out.fauc[k] = (out.fauc[k] || 0) + S.stats.fauc[k] / seeds;
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  out.summary = { avgAgentGold: Math.round(avg(out.agentGold)), avgPlayerNW: Math.round(avg(out.playerNW)), minPlayerNW: Math.min(...out.playerNW), maxPlayerNW: Math.max(...out.playerNW), avgFoodSat: +avg(out.food).toFixed(2), floorPct: +(100 * out.floor / out.cellDays).toFixed(2), ceilPct: +(100 * out.ceil / out.cellDays).toFixed(2), avgBailouts: +avg(out.bailouts).toFixed(1), avgShopRevenue: Math.round(avg(out.shopRev)) };
  return out;
}

/* ---------- حفظ ---------- */
const save = S => JSON.stringify(S);
/* أسماء الكتاب الأصلية التي لا تظهر للاعب: تُستبدل في النصوص المحفوظة (الأخبار وسجل عمّ سالم) بأسماء اللعبة المعتمدة (docs/NAMES.md) */
const OLD_NAMES = [['الحاج ماثون', 'الحاج صالح'], ['ماثون', 'صالح'], ['داباسير', 'ظافر'], ['أركاد', 'سعيد'], ['نوماسير', 'سعيد'], ['ألغاميش', 'عمران'], ['أغار', 'حمدان']];
function nameFix(S) {
  const city = (BAB.cityOf ? BAB.cityOf(S.home) : 'تيماء'), fix = t => { if (typeof t !== 'string') return t; let r = t; for (const [a, b] of OLD_NAMES) if (r.includes(a)) r = r.split(a).join(b); return r.includes('بابل') ? r.split('بابل').join(city) : r; };
  (S.news || []).forEach(n => { if (n && n.t) n.t = fix(n.t); });
  if (S.learn && S.learn.hist) S.learn.hist.forEach(h => { if (h && h.t) h.t = fix(h.t); });
}
function load(str) {
  const S = JSON.parse(str); if (!S || !S.player) return null;
  if (S.ver === 2) { // ترحيل v2 ← v3: الرصيد القديم صار ريالاً
    S.fx = { usd: FX0.usd, gold: FX0.gold, hu: [FX0.usd], hg: [FX0.gold] }; S.ctxCur = 'sar';
    S.player.wallet = { sar: S.player.gold || 0, usd: 0, au: 0 }; delete S.player.gold; S.player.trades = [];
    S.player.caravans.forEach(cr => { cr.basis = {}; for (const g in cr.cargo) if (cr.cargo[g] >= 1) cr.basis[g] = { q: cr.cargo[g], c: cr.cargo[g] * mid(g) }; });
    for (const k in S.player.props) { const pr = S.player.props[k]; pr.basis = {}; for (const g in pr.store) if (pr.store[g] >= 1) pr.basis[g] = { q: pr.store[g], c: pr.store[g] * mid(g) }; }
    S.ver = VER;
  }
  if (S.ver !== VER) return null;
  if (S.story) S.story.cur = null; // لا يُعاد فتح حوار عند بدء التشغيل
  S.orders = S.orders || []; if (!S.zakat) S.zakat = zakatNew();
  if (!S.mkt2) { S.mkt2 = 1; if (S.learn && S.learn.char) { S.news = S.news || []; news(S, 'تغيّرت الأسواق: لكل مدينة منتج خاص يرخص عندها ويغلو بقدر البُعد عنها، وزعيم السوق يحدّد حصتك منه. دكاكينك ومخازنك كما هي.', 'good'); } }
  if (!S.learn) learnMigrate(S); else { if (!S.learn.rq) { S.learn.rq = []; S.learn.rseen = {}; } loreFix(S.learn); }
  (S.player.caravans || []).forEach(c => { c.herd = c.herd || {}; c.herders = c.herders || 0; });
  CITY_DEFS.forEach(d => { const c = S.cities && S.cities[d.id]; if (c) { c.x = d.x; c.y = d.y; c.makes = d.makes.slice(); } });
  migrateGoods(S);
  for (const k in S.player.props) { const pr = S.player.props[k]; if (!pr.staff) { pr.staff = []; welcomeCrew(S, pr, pr.shops.length * SELLER_PTS, pr.whs); if (pr.shops.length) news(S, 'صار لدكاكينك عمّال بالأجر: لكل دكان بائعان، ولكل مخزن أمين. أعطيناك الطاقم مجاناً ' + WK_FREE + ' يوماً.', 'good'); } }
  nameFix(S);
  attachWallet(S); ensureBosses(S); return S;
}

['zakatPay', 'zakatDefer', 'buy', 'sell', 'travel', 'exchange', 'signPact', 'agentBuy', 'murabaha', 'qard', 'settle', 'invest', 'buySukuk', 'buildShop', 'buildWarehouse', 'toStore', 'rentShop', 'buyShop', 'hireStaff', 'buildFarm', 'slaughter', 'buyStud', 'pairSet', 'buildButcher', 'cutMeat', 'haggleStart', 'haggleChoose'].forEach(k => {
  const f = A[k]; A[k] = function (S, ...a) { const pre = S.learn && S.learn.char ? learnPre(S, k, a) : null; const r = f.call(A, S, ...a); if (S.learn && S.learn.char && r && r.ok !== false) { learnEvent(S, k, a, r, pre); learnCheck(S); cardDay(S); } if (S.ach && r && r.ok !== false) achEvent(S, k, a, r); return r; };
});
A.debtPay = function (S, amt) {
  const fd = S.player.famDebt; if (!fd || fd.left <= 0) return NO('لا دَين عليك');
  amt = Math.min(Math.floor(amt || 0), Math.ceil(fd.left), Math.floor(S.player.gold)); if (amt <= 0) return NO('لا رصيد كافٍ للدفع');
  debtSpend(S, amt); debtApply(S, amt); return OK('سدّدتَ ' + amt + ' ريالاً من دَين جدّك، وبقي ' + Math.round(fd.left));
};
A.debtPlan = function (S, on) {
  const fd = S.player.famDebt; if (!fd) return NO('لا دَين عليك'); fd.plan = !!on; if (on && fd.due == null) { fd.due = S.day + 30; fd.mPaid = 0; }
  return OK(on ? BAB.DEBT.planOn : 'أوقفتَ خطة ظافر');
};
A.setWish = A_setWish; A.eventChoice = eventChoice;
A.vaultBreak = function (S) {
  const P = S.player, v = P.vault || 0; if (v <= 0) return NO('الحصّالة فارغة'); P.vault = 0; S.ctxCur = curOf(S.home); P.gold += v; S.ctxCur = 'sar';
  learnReact(S, 'vaultBreak', 3); return OK('كسرتَ الحصّالة: ' + Math.round(v) + ' ريالاً عادت إلى محفظتك');
};
A.setName = (S, raw) => {
  const L = S.learn; if (!L || L.char) return NO('الاسم يُسجَّل قبل اختيار الشخصية');
  const n = String(raw == null ? '' : raw).replace(/<[^>]*>/g, '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (n.length < 2) return NO('اكتب اسمك (حرفان على الأقل)');
  S.player.name = n; return OK('أهلاً بك يا ' + n);
};
A.learnSetChar = learnSetChar; A.chooseStart = chooseStart;
/* SHA-256 بلا اعتماد على crypto.subtle (يعمل على file:// وفي المتصفحات القديمة): لوضع المطوّر */
function sha256hex(str) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes = []; for (const ch of unescape(encodeURIComponent(str))) bytes.push(ch.charCodeAt(0));
  const bl = bytes.length * 8; bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bl >>> (i * 8)) & 255);
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < bytes.length; o += 64) {
    const w = new Array(64); for (let i = 0; i < 16; i++) w[i] = (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) { const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) { const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[i] + w[i]) | 0, S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0; }
    h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x | 0);
  }
  return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
const BABV = {}; const babFor = S => BABV[S.home] || (BABV[S.home] = BAB.localize(S.home));
/* ---------- الإنجازات (40، معتمدة): حالة S.ach تُنشأ للاعب البشري فقط (الواجهة)، فلا تتأثر محاكاة التجار الآليين ولا اختبار الضغط ---------- */
function achInit(S) { return S.ach || (S.ach = { got: {}, q: [], n: {}, vis: {}, prev: {}, jt: {} }); }
function achGrant(S, id) {
  const X = S.ach; if (!X || X.got[id] != null) return false; const d = ACHD.LIST.find(a => a.id === id); if (!d) return false;
  X.got[id] = S.day; X.q.push(id); news(S, 'إنجاز جديد: ' + d.name + ' — ' + (d.hid ? 'اكتشفتَ إنجازاً مخفياً!' : d.desc), 'good'); return true;
}
const achFlag = achGrant;
function achNote(S, k, v) { const X = S.ach; if (!X) return; if (k === 'jtab') { X.jt[v] = 1; if (X.jt.tasks && X.jt.clues && X.jt.album) achGrant(S, 'learn_journal'); } }
const liveBreeds = S => { const live = new Set(), add = o => { for (const g in (o || {})) if ((o[g] || 0) > 0 && GD[g] && GD[g].live && !GD[g].hyb) live.add(g); };
  for (const car of S.player.caravans) { add(car.cargo); add(car.herd); } for (const id in S.player.props) { const f = S.player.props[id].farm; if (f) add(f.herd); } return live; };
const ACH_CHECK = {
  fx_three: S => { const w = S.player.wallet; return w.sar > 0 && w.usd > 0 && w.au > 0; },
  trip_first: S => S.player.trips >= 1,
  home_routes: S => { const home = (S.learn && S.learn.start) || S.home, ids = S.order.filter(id => S.cities[id].country === home); return ids.length > 0 && ids.every(id => S.ach.vis[id]); },
  world_five: S => new Set(Object.keys(S.ach.vis).map(id => S.cities[id].country)).size >= 5,
  breed_four: S => liveBreeds(S).size >= 4,
  fresh_sale: S => Object.values(S.player.props).some(pr => pr.butcher && pr.butcher.sold >= 1),
  factory_three: S => S.player.factories.some(f => isAbroad(f) && f.level >= 3 && f.hp >= 80 && !f.crisis && S.day - f.since > FACT_HP.grace && factoryQual(S, f) >= 0.7),
  boss_friend: S => Object.values(S.bosses).some(b => b.trust >= 20),
  boss_three: S => new Set(Object.keys(S.bosses).filter(id => S.bosses[id].trust >= 20 && S.cities[id]).map(id => S.cities[id].country)).size >= 3,
  pact_first: S => S.player.pacts.length > 0,
  pact_exclusive: S => S.player.pacts.some(x => x.type === 'exclusive'),
  pact_done: S => repOf(S.player).done >= 1,
  zakat_first: S => !!(S.zakat && S.zakat.paidN >= 1),
  debt_first: S => !!(S.player.famDebt && S.player.famDebt.paid > 0),
  debt_free: S => !!(S.player.famDebt && S.player.famDebt.amt0 > 0 && S.player.famDebt.left <= 0 && S.player.famDebt.paid >= S.player.famDebt.amt0),
  rep_high: S => reputation(S).total >= 80,
  safe_reserve: S => wealthStats(S).score === 3,
  learn_first: S => !!(S.learn && S.learn.char && S.learn.level >= 2),
  learn_four: S => !!(S.learn && S.learn.char && S.learn.level >= 5),
  learn_grad: S => !!(S.learn && S.learn.char && S.learn.level >= 11),
  story_secret: S => !!(S.learn && Object.values(S.learn.lore || {}).reduce((a, x) => a + x, 0) >= 1 && ((S.learn.csec || []).length || (S.learn.tab || []).length)),
};
function achDay(S) {
  const X = S.ach; if (!X) return;
  for (const car of S.player.caravans) {
    const pv = X.prev[car.id];
    if (car.left === 0) X.vis[car.city] = 1;
    if (pv > 0 && car.left === 0) {
      if (car.from && S.cities[car.from] && S.cities[car.from].country !== S.cities[car.city].country) achGrant(S, 'country_two');
      if (herdUnits(car) > 0 && car.herders >= 1) achGrant(S, 'herd_arrival');
      if (car.insured) achGrant(S, 'insured_return');
    }
    X.prev[car.id] = car.left;
  }
  for (const id in ACH_CHECK) if (X.got[id] == null) { try { if (ACH_CHECK[id](S)) achGrant(S, id); } catch (e) { /* حالة ناقصة في حفظ قديم */ } }
}
function achEvent(S, k, a, r) {
  const X = S.ach; if (!X) return;
  if (k === 'buy') achGrant(S, 'trade_first');
  else if (k === 'sell' && r.pl > 0) { achGrant(S, 'profit_first'); X.n.profit = (X.n.profit || 0) + 1; if (X.n.profit >= 20) achGrant(S, 'profit_twenty'); }
  else if (k === 'rentShop' && a[1] === 'stall') achGrant(S, 'rent_first');
  else if (k === 'buyShop') achGrant(S, 'own_shop');
  else if (k === 'toStore') achGrant(S, 'store_order');
  else if (k === 'buyStud') { const pr = S.player.props[a[0]]; if (pr && pr.farm && pr.farm.stable) achGrant(S, 'stable_star'); }
  else if (k === 'auditCity') { const pr = S.player.props[a[0]]; if (pr && pr.mgr && pr.mgr.lv >= 2 && !pr.mgr.late && mgrOk(S, a[0], pr) && S.day - pr.mgr.since >= 3) achGrant(S, 'manager_watch'); }
  achDay(S);
}
/* ---------- بطاقات الفقه ودليل الميدان: تُفتح بالأحداث (بحدّ بطاقة كل 3 أيام) وتُروى بلسان عمّ سالم، وتُحفظ في دفتر الدروس ---------- */
const CARD_GAP = 3;
const propsAny = (S, f) => Object.values(S.player.props).some(f);
const CARD_TRIG = {
  f_sidq: S => S.learn.ev.profit >= 1, f_dayn: S => !!(S.player.famDebt && S.player.famDebt.paid > 0), g_plaza: S => { const c = mainCar(S); return c.city === 'riyadh' && c.left === 0; }, g_ach: S => !!S.ach && Object.keys(S.ach.got).length >= 1,
  f_taradi: S => S.learn.ev.haggleChoose >= 3, g_haggle: S => S.learn.ev.haggleStart >= 1, f_tatfif: S => S.learn.ev.sell >= 3, g_stories: S => (S.learn.pst || []).length >= 1,
  f_ujra: S => propsAny(S, pr => pr.staff && pr.staff.length), g_shop: S => propsAny(S, pr => pr.shops && pr.shops.length),
  f_ghish: S => S.player.factories.length > 0, g_factory: S => S.player.factories.length > 0,
  f_ihtikar: S => (S.shocks || []).some(x => x.k === 'monopoly'), g_shock: S => (S.shocks || []).length > 0, g_road: S => !!S.road,
  f_tasir: S => !!seasonNow(S), g_season: S => !!seasonNow(S), f_taamin: S => S.player.caravans.some(c => c.insured) || propsAny(S, pr => pr.ins),
  g_fleet: S => S.phase >= 2, f_wakala: S => (S.orders || []).length > 0 || S.learn.ev.agentBuy >= 1, f_amana: S => propsAny(S, pr => pr.mgr),
  g_farm: S => propsAny(S, pr => pr.farm), f_zakat: S => !!(S.zakat && S.zakat.paidN >= 1), f_munhi: S => !!S.rival && S.day >= RIVAL_FROM + 10, g_rival: S => !!S.rival && S.day >= RIVAL_FROM,
  f_dinar: S => (S.player.wallet.ag || 0) > 0 || S.learn.ev.exchange >= 3, f_sarf: S => S.learn.ev.exchange >= 1,
  g_currency: S => { const c = mainCar(S); return c.left === 0 && S.cities[c.city].country !== 'sa'; },
  f_riba: S => S.phase >= 4 || S.learn.ev.invest >= 1 || S.learn.ev.murabaha >= 1 || S.learn.ev.qard >= 1 || S.learn.ev.buySukuk >= 1, f_samaha: S => S.learn.level >= 10,
};
function cardDay(S) {
  const L = S.learn; if (!L || !L.char || L.rest) return; L.cards = L.cards || []; L.cq = L.cq || [];
  if (L.cq.length || S.day - (L.cardDay == null ? -99 : L.cardDay) < CARD_GAP) return;
  for (const id of CARDS.LIST) {
    if (L.cards.includes(id)) continue; const C = CARDS.CARDS[id]; if (L.level < C.min) continue;
    let hit = false; try { hit = !!CARD_TRIG[id](S); } catch (e) { hit = false; } if (!hit) continue;
    L.cards.push(id); L.cq.push(id); L.cardDay = S.day; return;
  }
}
/* ---------- اللعب الحر (بعد التخرج أو الطور 4): حولية التاجر كل 354 يوماً وثلاثة أهداف لكل حول، بلا نهاية. للاعب البشري فقط (S.ach) ---------- */
const FREE_YEAR = 354;
const freeOn = S => !!(S.ach && ((S.learn && S.learn.char && S.learn.level >= 11) || S.phase >= 4));
const yrMarkets = S => Object.keys(S.ach.vis || {}).filter(id => !(S.yr.vis0 || []).includes(id)).length;
const YEAR_GOALS = {
  growth: { name: S => 'نمّ ثروتك إلى ' + fmtN(S.yr.goals.find(g => g.k === 'growth').target) + ' ريال', have: S => Math.round(netWorth(S)) },
  deals: { name: S => 'أتمّ ' + S.yr.goals.find(g => g.k === 'deals').target + ' صفقة رابحة', have: S => (S.ach.n.profit || 0) - (S.yr.profit0 || 0) },
  markets: { name: S => 'زُر ' + S.yr.goals.find(g => g.k === 'markets').target + ' أسواق جديدة هذا الحول', have: S => yrMarkets(S) },
};
function yrNewGoals(S, prev) {
  const n = S.yr.n, dealsPrev = prev && prev.deals ? prev.deals : 0;
  return [{ k: 'growth', target: Math.round(netWorth(S) * 1.25), done: false }, { k: 'deals', target: Math.max(12, Math.round(Math.max(dealsPrev, 10 + 2 * n) * 1.1)), done: false }, { k: 'markets', target: Math.max(2, Math.min(6, 3 - (yrMarkets(S) > 8 ? 1 : 0) + (n > 3 ? 1 : 0))), done: false }];
}
function yearDay(S) {
  if (!freeOn(S)) return;
  if (!S.yr) { S.yr = { n: 0, start: S.day, nw0: Math.round(netWorth(S)), trips0: S.player.trips, profit0: S.ach.n.profit || 0, vis0: Object.keys(S.ach.vis || {}), goals: [], hist: [] }; S.yr.goals = yrNewGoals(S); news(S, 'بدأ عهد اللعب الحر: لا نهاية للعبة، ولك في كل حول (354 يوماً) ثلاثة أهداف وتقرير بمسيرتك.', 'good'); return; }
  for (const g of S.yr.goals) if (!g.done && YEAR_GOALS[g.k].have(S) >= g.target) { g.done = true; news(S, 'أنجزتَ هدف الحول: ' + YEAR_GOALS[g.k].name(S) + '.', 'good'); learnReact(S, 'goalDone', 5); }
  if (S.day - S.yr.start < FREE_YEAR) return;
  const nw = Math.round(netWorth(S)), deals = (S.ach.n.profit || 0) - (S.yr.profit0 || 0), rec = { y: S.yr.n + 1, end: S.day, nw, dnw: nw - S.yr.nw0, trips: S.player.trips - S.yr.trips0, deals, markets: yrMarkets(S), goals: S.yr.goals.filter(g => g.done).length, rival: S.rival ? rivalNW(S) : null };
  S.yr.hist.push(rec); if (S.yr.hist.length > 20) S.yr.hist.shift();
  news(S, 'تقرير الحول ' + rec.y + ': ثروتك ' + fmtN(nw) + ' (' + (rec.dnw >= 0 ? '+' : '') + fmtN(rec.dnw) + ')، ' + rec.trips + ' رحلة، ' + deals + ' صفقة رابحة، وأنجزتَ ' + rec.goals + ' من 3 أهداف.', 'good'); learnReact(S, 'yearEnd', 5); S.pause = true;
  S.yr.n++; S.yr.start = S.day; S.yr.nw0 = nw; S.yr.trips0 = S.player.trips; S.yr.profit0 = S.ach.n.profit || 0; S.yr.vis0 = Object.keys(S.ach.vis || {}); S.yr.goals = yrNewGoals(S, rec);
}
const API = { LOCAL, localRate, HG_CULT, hgCult, hgWeights, FREE_YEAR, freeOn, YEAR_GOALS, yearDay, TK, tkOf, tkContribute, tkClaim, tkDay, FIN, murabahaQuote, bankDebt, bankLate, CARDS, CARD_TRIG, cardDay, achInit, achGrant, achFlag, achNote, achDay, ACH_CHECK, ACHD, rivalNW, rivalOn, RIVAL_FROM, SEASONS, YEAR, seasonAt, seasonNow, seasonNext, seasonMul, SHOP_UP, SHOP_UP_COST, shUp, insValue, insPrem, insOn, MOUNT, mountOf, ROLES, ROLE_KEYS, captainPool, capWage, capRole, CAP_QUIT, SHOCKS, DIFF, diffOf, shocksOn, shockBlock, defenseOf, roadOn, shortMul, DLG, dlgOk, dlgView, questState, hasGood, stOf, MFG_COST, MFG_IN, MGR, MGR_AUDIT, FACT_HP, CRAFT_TRUST, CRAFT_COST, CRAFT_OPEN, factoryLocal, factoryMakeBlock, factoryQual, factoryValue, factoryBase, isAbroad, assetsIn, mgrOk, qualOf, HAGGLE, HG_BEST, haggleOpen, haggleLeft, vouchOf, vouchMul, hgOf, BUTCHER_COST, BUTCHER_DAY, FRESH_X, BUTCHER_PREM, HYB_LV, hybridOpen, hybOf, trHold, pfHold, hyMul, hyPf, breedStep, SEXF, pregOf, gestOf, BREEDS, BR_KEYS, BR_LV, spOf, breedOpen, pedMul, pedOf, pedMulOf, FARM_PHASE, FARM_COST, FARM_UP, FARM_MAXLV, FARM_UPKEEP, FARMER_UNITS, PRODUCT, MEAT, farmOf, farmCap, farmUnits, farmHold, farmValue, farmerNeed, farmCover, BREED, hxOf, youngOf, malesOf, YOUNG_SELL, HERD_PER, MAX_HERDERS, HERDER_WAGE, HERDER_FEE, herdOf, herdUnits, herdCap, holdings, fodderDay, shKind, shCap, shItemsMax, ownShops, rentOf, STALL_CAP, STALL_ITEMS, RENT_CREDIT, EVICT_DAYS, WK, WK_LV, WK_FREE, WK_CAP, staffOf, wkLv, wkWage, sellerNeed, keeperNeed, sellerPts, keeperHave, sellFactor, hirePool, SELLER_PTS, reputation, keyOn, quotaOn, quotaPerDay, quotaLeft, QUOTA_DAYS, exclusiveAt, PREM, isOwn, homeStatus, travelBlock, sha256hex, babFor, wealthStats, masteryOf, passivePerDay, FREE_DAILY, babEventDay, freedomDay, BAB, famDebtOn, debtDay, tabletCheck, START_OF, chooseStart, LORE, loreCheck, loreFix, advisorReport, bestDeal, advisorDay, ZAKAT, zakatBase, zakatDay, LS, learnCheck, learnPerks, learnSetChar, sells, soldAt, agentQuote, AGENT_PHASE, AGENT_FEE, BOSS_NAMES, PACTS, BOSS_TAKE, BOSS_LOSE, MAX_PACTS, bossOf, bossShare, pactIn, pactTerms, pactBlock, bossActive, bossB0, buyMul, rulerMine, quoteBuy, quoteSell, sellOptions, marketInfo, storeSummary, curOf, rateOf, feeOf, liquid, CURS, avgCost, FX0, VER, COUNTRIES, CD, ADJ, cdist, GOODS, GD, GIDS, RECIPES, CITY_DEFS, PHASE_AT, TITLES, SPEED, SHOP_ITEMS_MAX, WH_CAP, SHELF_CAP, newGame, tick, unitPrice, refPrice, ratio, capG, netWorth, titleOf, loadOf, capOfCar, tripDays, supplyNeed, customsOf, popTotal, riskKey, dist, A, stressTest, botMain, botBuild, save, load, clamp, snapshotKnown, shopsOf, whsOf, shopLimit, shopCost, whCost, storeCap, storeLoad, storeRoom, hasPresence, mid, valueOf };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Engine = API;
})(typeof window !== 'undefined' ? window : globalThis);
