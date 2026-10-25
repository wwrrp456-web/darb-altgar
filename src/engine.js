/* درب التجّار v0.2 — محرك المحاكاة (بلا واجهة، يعمل في المتصفح وفي Node).
   كل الحالة بيانات خام قابلة للحفظ JSON. الأرقام والصيغ في DESIGN.md */
(function (root) {
'use strict';

const VER = 3;
const LS = (typeof module !== 'undefined' && module.exports) ? require('./lessons.js') : root.Lessons;
const BAB = (typeof module !== 'undefined' && module.exports) ? require('./babylon.js') : root.Babylon;
const FIQH = (typeof module !== 'undefined' && module.exports) ? require('./fiqh.js') : root.Fiqh;
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
  { id: 'jazan', name: 'جازان', country: 'sa', x: 285, y: 410, size: 1.0, tax: 0.04, sig: 'incense', makes: ['incense', 'coffee', 'wood', 'honey', 'goat', 'cow'] },
  { id: 'mecca', name: 'مكة المكرمة', country: 'sa', x: 252, y: 351, size: 1.3, tax: 0.05, sig: null, makes: ['wheat', 'leather', 'cotton', 'honey', 'raisins', 'camel', 'goat', 'sheep'] },
  { id: 'medina', name: 'المدينة المنورة', country: 'sa', x: 250, y: 308, size: 1.1, tax: 0.04, sig: null, makes: ['wheat', 'dates', 'raisins', 'cotton', 'honey', 'camel', 'sheep', 'goat'] },
  { id: 'cairo', name: 'القاهرة', country: 'eg', x: 128, y: 196, size: 1.5, tax: 0.06, sig: 'textile', makes: ['wheat', 'textile', 'cotton', 'sugar', 'eggs', 'cow', 'buffalo', 'chicken'] },
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
  { id: 'shanghai', name: 'شنغهاي', country: 'cn', x: 975, y: 216, size: 1.5, tax: 0.07, sig: 'porcelain', makes: ['porcelain', 'tools', 'wood', 'driedfish', 'duck', 'chicken', 'cow'] },
];
BREEDS.forEach(b => b.at.forEach(id => CITY_DEFS.find(d => d.id === id).makes.push(b.id)));
// المواشي لا تُباع بنوعها العام (غنم، جمل، خيل…) في مدينة فيها صنف مسمّى من النوع نفسه (نجدي، مجاهيم، عربي…): قرار المالك. المدن التي لا صنف مسمّى فيها تُبقي النوع العام موسوماً «نوع عادي» حتى تُضاف أصنافها بمصادر موثّقة.
CITY_DEFS.forEach(d => { d.makes = d.makes.filter(g => !BREEDS.some(b => b.sp === g) || !d.makes.some(h => BREEDS.some(b => b.id === h && b.sp === g))); });
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
/* نظام الصرف: «حرّ» للمبتدئ (المستويات 1–3) وللاعب الآلي (صرف تلقائي برسمه المعتاد)، و«يدوي» من المستوى 4 (المشتريات تُدفع من محفظة عملة السوق فقط، والتحويل من الصرافة)،
   و«برسم» إن اختار اللاعب الصرف التلقائي بعد المستوى 4 فيدفع رسماً أعلى على كل تحويل فوري بلا صرّاف. */
const FXM = { level: 4, penalty: 0.05 };
function fxMode(S) {
  const L = S.learn; if (!L || !L.char || S.fxFree || S.noShocks) return 'free';
  if (L.level < FXM.level) return 'free';
  return L.fxAuto ? 'penalty' : 'manual';
}
/* ما يستطيع اللاعب إنفاقه على شراء السلع في مدينة: في الوضع اليدوي قيمة محفظة عملة هذا السوق وحدها، وإلا مجموع محافظه */
function buyBudget(S, city) {
  const P = S.player; if (fxMode(S) !== 'manual' || !S.cities[city]) return P.gold;
  const cx = curOf(S.cities[city].country); return P.wallet[cx] * rateOf(S, cx);
}
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
      const fee = feeOf(cur, cx) + 0.005 + (fxMode(S) === 'penalty' ? FXM.penalty : 0), take = Math.min(avail, need * (1 + fee)), covered = take / (1 + fee);
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
const WEALTH_TITLES = [[0, 'تاجر متجول'], [5000, 'وكيل تجاري'], [20000, 'صاحب مصانع'], [60000, 'مصرفي وحاكم'], [200000, 'سيّد السوق'], [500000, 'شيخ التجّار'], [1500000, 'عميد الأسواق'], [5000000, 'سلطان الدروب']];
const TITLES = WEALTH_TITLES; // اسم متوافق مع التكاملات القديمة.
const SPEED = 60; // وحدة/يوم (الإحداثيات تطابق الخريطة المرسومة؛ المتوسط العام للرحلات كما كان)

/* ---------- عشوائية بذرية ---------- */
// حالة Mulberry32 تبقى 32-بت؛ تراكمها كعدد كبير يفقد الدقة في المسيرات الطويلة.
// تيار مستقل لأصناف المواشي حتى لا تتغيّر عوالم البذور القديمة بإضافتها
function rndB(S) {
  let t = (S.seedB = (((S.seedB === undefined ? 0x2F6E2B1 : S.seedB) >>> 0) + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rndG = (S, g) => (GD[g].sp || GD[g].fresh ? rndB(S) : rnd(S));
function rnd(S) {
  let t = (S.seed = ((S.seed >>> 0) + 0x6D2B79F5) >>> 0);
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
  paymentRecord(S, cat, amt);
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
  const S = { seed: (seed >>> 0) || 1, climateSeed: (seed >>> 0) || 1, day: 0, phase: 1, cities: {}, order: [], agents: [], risk: {}, news: [],
    orders: [], mkt2: 1, learn: learnNew(), zakat: zakatNew(), stats: { sink: {}, fauc: {} }, hist: { nw: [], px: {} }, nextId: 10, ver: VER, home: HOME, fx: { usd: FX0.usd, gold: FX0.gold, silver: +silverAt(FX0.gold, 0).toFixed(3), hu: [FX0.usd], hg: [FX0.gold], hs: [+silverAt(FX0.gold, 0).toFixed(3)] }, ctxCur: 'sar' };
  CITY_DEFS.forEach(d => { S.cities[d.id] = makeCity(S, d); S.order.push(d.id); });
  ensureRisks(S);
  S.player = {
    wallet: { sar: 800, usd: 0, au: 0, ag: 0 }, ships: [], led: { inc: {}, exp: {} }, props: {}, factories: [], known: {},
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
  climateInit(S); return S;
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

/* دفتر الالتزامات: المبالغ الفعلية فقط، دون تغيير الخصم أو سياسة المغادرة. */
const PAYMENT_CATS = ['rent', 'staff', 'wages', 'upkeep', 'wear', 'farm'];
function paymentRecord(S, cat, paid) {
  if (!PAYMENT_CATS.includes(cat)) return;
  const book = S.paymentBook || (S.paymentBook = { since: S.day, days: [] });
  let row = book.days[book.days.length - 1];
  if (!row || row.day !== S.day) {
    book.days = book.days.filter(r => r.day >= S.day - 59 && r.day <= S.day).slice(-59);
    row = { day: S.day, paid: {} }; book.days.push(row);
  }
  if (paid > 0) row.paid[cat] = (row.paid[cat] || 0) + paid;
  if (book.days.length > 60) book.days.shift();
}
function paymentHistory(S, span = 30) {
  const book = S.paymentBook; if (!book) return [];
  const first = Math.max(book.since, S.day - Math.min(60, Math.max(1, span)) + 1), rows = [];
  for (let day = S.day; day >= first; day--) {
    const row = book.days.find(r => r.day === day);
    rows.push({ day, paid: row ? Object.assign({}, row.paid) : {} });
  }
  return rows;
}
function payObligation(S, cat, amount, city, kind, target, label) {
  const paid = pPay(S, cat, amount, true), short = amount - paid;
  if (short > 1e-6) {
    const dues = S.paymentDues || (S.paymentDues = []);
    let due = dues.find(d => d.id === target.paymentDue);
    if (!due) {
      const id = (S.paymentNext || 0) + 1; S.paymentNext = id; target.paymentDue = id;
      due = { id, city, kind, cat, label, amount: 0, unknownPast: !!(target.arrears || target.late), since: S.day }; dues.push(due);
    }
    due.amount += short;
  }
  return paid;
}
function paymentTarget(S, due) {
  const pr = S.player.props[due.city];
  const targets = due.kind === 'rent' ? pr && pr.shops : due.kind === 'staff' ? pr && pr.staff : due.kind === 'manager' ? pr && [pr.mgr] : due.kind === 'factory' ? S.player.factories : due.kind === 'caravan' ? S.player.caravans : S.player.ships;
  return (targets || []).find(t => t && t.paymentDue === due.id);
}
function settlePayment(S, id) {
  const due = (S.paymentDues || []).find(d => d.id === id);
  if (!due || !(due.amount > 0) || !Number.isFinite(due.amount)) return NO('لا متأخر مسجل لهذا البند.');
  if (S.player.gold + 1e-9 < due.amount) return NO('رصيد الريال لا يكفي لسداد المتأخر المسجل: ' + due.amount.toFixed(2) + ' ريال.');
  const target = paymentTarget(S, due), paid = pPay(S, due.cat, due.amount, true);
  due.amount = Math.max(0, due.amount - paid);
  if (due.amount < 1e-6) {
    if (target) {
      if (due.kind === 'rent') target.rentPaid = (target.rentPaid || 0) + paid;
      if (!due.unknownPast) { if (due.kind === 'rent') target.arrears = 0; else if ('late' in target) target.late = 0; }
      delete target.paymentDue;
    }
    S.paymentDues = S.paymentDues.filter(d => d !== due);
  }
  return OK('دفعت ' + paid.toFixed(2) + ' ريال من رصيدك لسداد المتأخر المقيد.' + (due.unknownPast ? ' توجد متأخرات سابقة غير مقيدة في السجل.' : ''));
}
function paymentMigrate(S) {
  const book = S.paymentBook;
  if (book) {
    if (!Number.isInteger(book.since) || !Array.isArray(book.days)) delete S.paymentBook;
    else {
      book.since = Math.max(0, Math.min(S.day, book.since));
      book.days = book.days.filter(r => r && Number.isInteger(r.day) && r.day >= S.day - 59 && r.day <= S.day && r.paid && typeof r.paid === 'object').slice(-60);
      for (const r of book.days) for (const k of Object.keys(r.paid)) if (!PAYMENT_CATS.includes(k) || !Number.isFinite(r.paid[k]) || r.paid[k] < 0) delete r.paid[k];
    }
  }
  if (S.paymentDues) {
    if (!Array.isArray(S.paymentDues)) S.paymentDues = [];
    S.paymentDues = S.paymentDues.filter(d => d && Number.isSafeInteger(d.id) && d.id > 0 && Number.isFinite(d.amount) && d.amount > 0 && PAYMENT_CATS.includes(d.cat) && ['rent','staff','manager','factory','caravan','ship'].includes(d.kind));
    S.paymentNext = S.paymentDues.reduce((max, d) => Math.max(max, d.id), Number.isSafeInteger(S.paymentNext) ? S.paymentNext : 0);
  }
}
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
  riyadh: 'الشيخ ماجد الراجح', jeddah: 'أبو سالم البحّار', hail: 'ابن شمّر الجمّال', jazan: 'الحاج عيسى المهري', mecca: 'الشيخ عبدالعزيز المكّي', medina: 'الشيخ إبراهيم المدني',
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
/* اقتصاد الدكان: زبائن المدينة يشترون من دكانك بمعدّل SHOP_DEMAND ضعف طلب السلعة المنسوب إليك، والسعر الافتراضي 130٪ (الزبون يقبل غلاءً معقولاً: عند 130٪ يقلّ البيع نحو الربع فقط فيرتفع الربح كثيراً) */
const SHOP_DEMAND = 1, SHOP_PRICE0 = 1.8, SHOP_BUYBELOW = 1.05, RETAIL_BASE = 1.5;
/* سوق الجملة (السعر المعروض في السوق) هو ما يدفعه كبار التجار بالكميات، وسعر التجزئة في الدكان أعلى بحكم أن الناس تشتري منه: يتساوى طلب الزبائن مع سعر الجملة × RETAIL_BASE. ومدينة أكثر ازدهاراً (سكان أكثر) تبيع أكثر وبثمن أعلى. */
const shopProsper = c => Math.max(0.6, Math.min(2.6, Math.pow(popTotal(c) / 1000, 1.5)));
const shopF = (c, g, price, mp, sign) => clamp(1.8 + 0.1 * sign - 0.8 * (price / (mp * RETAIL_BASE)), 0, 1.3);
const shopsOf = (S, city) => (S.player.props[city] ? S.player.props[city].shops : []);
const whsOf = (S, city) => (S.player.props[city] ? S.player.props[city].whs : 0);
const shopLimit = c => Math.floor(2 + 2 * c.size) + (c.tier - 1);
const foreignMul = (S, c) => (c.country === S.home ? 1 : 1.4);
const shopCost = (S, c) => Math.round(1500 * Math.pow(1.5, shopsOf(S, c.id).length) * foreignMul(S, c) * Math.pow(shopProsper(c), 0.6));
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
const WK_LV = ['مبتدئ', 'ماهر', 'خبير'], WK_PROMO = [0, 40, 120], SELLER_PTS = 1, SHRINK = 0.004, WK_FREE = 30, WK_CAP = 1.2;
const staffOf = (S, city) => (S.player.props[city] && S.player.props[city].staff) || [];
const wkLv = w => (w.days >= WK_PROMO[2] ? 2 : w.days >= WK_PROMO[1] ? 1 : 0);
const wkWage = (S, c, w) => Math.round(WK[w.role].wage[wkLv(w)] * (0.85 + 0.25 * c.size) * (c.country === S.home ? 1 : 1.2));
const sellerNeed = (S, city) => shopsOf(S, city).reduce((a, sh) => a + (shKind(sh) === 'stall' ? 1 : SELLER_PTS), 0);
const keeperNeed = (S, city) => whsOf(S, city);
const sellerPts = (S, city) => staffOf(S, city).filter(w => w.role === 'seller').reduce((a, w) => a + WK.seller.pts[wkLv(w)] * (w.late > 0 ? 0.5 : 1), 0);
const keeperHave = (S, city) => staffOf(S, city).filter(w => w.role === 'keeper' && !(w.late > 0)).length;
const sellFactor = (S, city) => { const n = sellerNeed(S, city); return n ? Math.min(WK_CAP, sellerPts(S, city) / n) : 0; };
// سقف العمّال من إجمالي سكان المدينة (كان من الطبقة الدنيا وحدها فتفرغ مع ارتقاء السكان فيُغلق التوظيف نهائياً)
const hireCap = (S, city) => Math.floor(popTotal(S.cities[city]) / 180);
const hirePool = (S, city) => Math.max(0, hireCap(S, city) - staffOf(S, city).length);

/* تقرير البائع: لكل سلعة في الدكان حالتها اليوم وسببها بنفس معادلة البيع في 19-player.js (f = 1.8 + 0.1·لافتة − 0.8·سعرك/سعر السوق)، ومعها إصلاح بنقرة.
   الحالات: nobody (لا بائع) · empty (المخزن فارغ) · wait (التعبئة الآلية تنتظر الرخص) · loss (أقل من تكلفتك) · high (غالٍ) · ok (بيع) · new (لم يمضِ يوم بعد) */
function shopReport(S, city, shopId) {
  const sh = shopsOf(S, city).find(s => s.id === shopId), pr = S.player.props[city], c = S.cities[city]; if (!sh || !pr) return [];
  const sf = sellFactor(S, city);
  return sh.items.map(it => {
    const g = it.g, mp = unitPrice(c, g), qm = qualOf(pr.basis, g), ref = refPrice(c, g), price = it.price * ref * qm, have = Math.floor(pr.store[g] || 0);
    const f = shopF(c, g, price, mp, shUp(sh, 'sign')), cost = avgCost(pr.basis, g), sold = it.lastSold || 0;
    const pctOf = p => Math.round(p / (ref * qm) * 100), aim = mp * RETAIL_BASE * (1.375 + 0.125 * shUp(sh, 'sign'));
    const sug = Math.max(50, Math.min(200, Math.max(Math.round(pctOf(aim) / 5) * 5, cost != null ? Math.ceil(cost * 1.15 / (ref * qm) * 100 / 5) * 5 : 0)));
    const o = { g, f, price, mp, have, sold, cost, sug, pct: Math.round(it.price * 100) };
    if (sf <= 0) return Object.assign(o, { st: 'nobody', msg: 'لا يوجد بائع في الدكان فلا أبيع شيئاً.', fix: 'hire' });
    if (have < 1 && it.carry) return Object.assign(o, { st: 'soon', msg: 'المخزن فارغ، وسأستلم هذه السلعة من قافلتك حين تصل.' });
    if (have < 1) return Object.assign(o, !it.auto
      ? { st: 'empty', msg: 'المخزن فارغ من هذه السلعة فلا أجد ما أبيعه. فعّل التعبئة الآلية أو أودع بضاعة من قافلتك.', fix: 'auto' }
      : ratio(c, g) >= it.buyBelow
        ? { st: 'wait', msg: 'المخزن فارغ والتعبئة الآلية تنتظر أن يرخص السعر عن ' + Math.round(it.buyBelow * 100) + '٪ من المعتاد. يمكنك أن تودع بضاعة من قافلتك.' }
        : { st: 'soon', msg: 'المخزن فارغ، والتعبئة الآلية ستشتري لي من السوق غداً.' });
    if (cost != null && price < cost) {
      const need = Math.ceil(cost / (ref * qm) * 100 / 5) * 5;
      return Object.assign(o, need > 200 ? { st: 'loss', msg: 'اشتريتَها بأغلى مما يُباع به هنا. الأفضل أن تبيعها بقافلتك في مدينة أغلى.' } : { st: 'loss', msg: 'سعرك أقل مما دفعتَه فيها، فأبيعها بخسارة. ارفعه إلى ' + Math.max(sug, need) + '٪.', fix: 'price', to: Math.max(sug, need) });
    }
    if (f < 0.35 && sold < 0.05) return Object.assign(o, { st: 'high', msg: 'لم أبع شيئاً: سعرك ' + Math.round(price / mp * 100) + '٪ من سعر الجملة، وهذا غالٍ حتى على الزبائن. اخفضه إلى ' + sug + '٪.', fix: 'price', to: sug });
    if (sold >= 0.05) return Object.assign(o, { st: 'ok', msg: 'بعتُ ' + (Math.round(sold * 10) / 10) + ' وحدة اليوم' + (cost != null ? '، وربحك في الوحدة ≈ ' + Math.round((price - cost) * 10) / 10 + ' ريال.' : '.') + (f < 0.45 ? ' سعرك مرتفع فالبيع بطيء، جرّب خفضه قليلاً.' : '') });
    return Object.assign(o, { st: 'new', msg: 'جاهز للبيع. أخبرك غداً بما بعتُ.' });
  });
}

/* «يستلم من قافلتي»: عند وصول قافلتك مدينة فيها دكانك، يأخذ البائع من حمولتها السلعة التي فعّلتَ لها الخيار حتى بلوغ هدف الدكان (60 وحدة) بحدّ سعة المخزن */
function shopCarry(S, car) {
  const city = car.city, pr = S.player.props[city]; if (!pr || !hasPresence(S, city) || car.left > 0) return;
  let moved = 0;
  shopsOf(S, city).forEach(sh => sh.items.forEach(it => {
    const g = it.g; if (!it.carry || GD[g].live) return;
    const q = Math.floor(Math.min(car.cargo[g] || 0, Math.max(0, (it.target || 60) - (pr.store[g] || 0)), storeRoom(S, city) / GD[g].w)); if (q < 1) return;
    const ql = qualOf(car.basis, g), bc = takeBasis(car.basis, g, q); pr.basis = pr.basis || {}; addBasis(pr.basis, g, q, bc, ql);
    car.cargo[g] -= q; pr.store[g] = (pr.store[g] || 0) + q; moved++;
    if (car.main) news(S, 'استلم بائع دكانك ' + q + ' ' + GD[g].name + ' من قافلتك في ' + S.cities[city].name + '.', 'good');
  }));
  return moved;
}

/* ربح الدكان الصافي للمدينة: متوسط آخر أيام (دخل بعد الضريبة، وصافٍ بعد تكلفة البضاعة والأجور والصيانة) */
function shopPnl(S, city, n) {
  const pr = S.player.props[city], h = (pr && pr.hist || []).slice(-(n || 7)); if (!h.length) return null;
  const sum = k => h.reduce((a, x) => a + (x[k] || 0), 0);
  return { days: h.length, rev: sum('rev') / h.length, net: sum('net') / h.length, total: sum('net') };
}
/* ---------- المزرعة (الطور 3): تُربّي المواشي وتكاثرها وتُنتج الصوف والجبن والبيض، ويذبح اللاعب منها لحماً مجففاً ---------- */
const BUTCHER_COST = 3500, BUTCHER_DAY = 30, FRESH_X = 2.2, BUTCHER_PREM = 1.08; // الملحمة: يومياً تبيع حتى 30 وحدة لحم طازج بعلاوة 8٪، وغلّة الرأس 2.2 ضعف غلّة المجفف
const FARM_PHASE = 3, FARM_COST = 4000, FARM_UP = 3000, FARM_UNITS = 40, FARM_MAXLV = 3, FARM_UPKEEP = 4, FARMER_UNITS = 40;
const PASTURE = { sa: 0.8, eg: 1.3, ir: 1, in: 1.2, cn: 1.1 };
const PRODUCT = { sheep: ['wool', 0.066, false], goat: ['cheese', 0.03, true], cow: ['cheese', 0.08, true], buffalo: ['cheese', 0.09, true], camel: ['cheese', 0.04, true], chicken: ['eggs', 0.015, true], duck: ['eggs', 0.012, true] };
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
    const rate = GD[g].spoil * spoilMul(f, g) * 0.3 * plague * climateRisk(S, 'farm', city) * (cover < 1 ? 2 - cover : 1), loss = f.herd[g] * rate; let n = Math.floor(loss); if (rnd(S) < loss - n) n++;
    if (n) { const b0 = f.herd[g]; f.herd[g] = Math.max(0, b0 - n); herdScale(f, g, b0); sink(S, 'spoilage', n * mid(g)); }
    breedStep(S, f, g, Math.min(1, cover), cap - farmUnits(f), B.fu * 0.5, 1);
    const pd = PRODUCT[g]; if (pd && cover > 0) {
      const x = hxOf(f, g), a = f.herd[g], heads = pd[2] ? Math.max(0, a - Math.min(x.m, a)) : a;
      f.acc[pd[0]] = (f.acc[pd[0]] || 0) + heads * pd[1] * hyMul(f, g, pd[0] === 'wool' ? 'wool' : 'milk') * cover * climateFactor(S, 'farm', city); const k = Math.floor(f.acc[pd[0]]);
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
    const paid = payObligation(S, 'rent', sh.rent, city, 'rent', sh, shKind(sh) === 'stall' ? 'إيجار بسطة' : 'إيجار دكان'); sh.rentPaid = (sh.rentPaid || 0) + paid;
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
    const wage = wkWage(S, c, w), paid = payObligation(S, 'staff', wage, city, 'staff', w, WK[w.role].name);
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
  for (const pr of Object.values(P.props)) nw -= pr.shops.filter(sh => sh.endowed && shKind(sh) === 'own').length * 1000;
  return nw;
}
function titleOf(nw) { let t = WEALTH_TITLES[0][1]; WEALTH_TITLES.forEach(([a, n]) => { if (nw >= a) t = n; }); return t; }

/* ---------- أساس التكلفة وسجل الصفقات ---------- */
// الجودة تسافر مع سجل التكلفة: w = مجموع (الكمية × الجودة). بلا w فالجودة 1 («أصلية»)
function addBasis(b, g, q, c, ql) { if (q <= 0) return; const x = b[g] || (b[g] = { q: 0, c: 0 }); const w0 = x.w === undefined ? x.q : x.w; x.q += q; x.c += c; if ((ql !== undefined && ql !== 1) || x.w !== undefined) x.w = w0 + q * (ql === undefined ? 1 : ql); }
function takeBasis(b, g, q) { const x = b[g]; if (!x || x.q <= 0) return 0; const t = Math.min(q, x.q), cost = x.c * t / x.q; if (x.w !== undefined) x.w -= x.w * t / x.q; x.q -= t; x.c -= cost; if (x.q < 0.01) delete b[g]; return cost; }
const qualOf = (b, g) => (b && b[g] && b[g].q > 0 && b[g].w !== undefined ? clamp(b[g].w / b[g].q, 0.05, 1) : 1);
const avgCost = (b, g) => (b && b[g] && b[g].q > 0 ? b[g].c / b[g].q : null);
function syncBasis(car) { for (const g in car.basis) { const have = (car.cargo[g] || 0) + ((car.herd || {})[g] || 0); if (have < 0.5) delete car.basis[g]; else if (car.basis[g].q > have) car.basis[g].q = have; } }
function logTrade(S, city, g, q, side, net, pl, source) {
  if (S.awaySim && pl > 0 && (side === 'sell' || side === 'shop')) { ctxFor(S, city); const cut = pl * (1 - AWAY_YIELD); S.player.gold -= cut; net -= cut; pl -= cut; S.player.led.exp.awayYield = (S.player.led.exp.awayYield || 0) + cut; }
  source=source||(side==='shop'?'shops':'trade'); if((side==='sell'||side==='shop')&&source!=='shops')climateIncome(S,source,net);
  const T = S.player.trades; T.unshift({ day: S.day, city, g, q, side, net, pl, sector: source }); if (T.length > 50) T.pop();
  if (side === 'sell' || side === 'shop') { if (pl >= 0) S.player.led.inc.realized = (S.player.led.inc.realized || 0) + pl; else S.player.led.exp.realizedLoss = (S.player.led.exp.realizedLoss || 0) - pl; }
  return T[0];
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
  const budget = isPlayer && acct === S.player ? buyBudget(S, c.id) : acct.gold; // يدوي: محفظة عملة السوق فقط
  for (; n < qty; n++) {
    const p = unitPrice(c, g) * bm * (n < vl ? vm : 1);
    if (cost + p > budget) break;
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
function sellUnits(S, acct, c, g, qty, src, isPlayer, haggle, source = 'trade', basis = 0) {
  qty = Math.min(Math.floor(qty), Math.floor(src[g] || 0));
  const tr = taxRate(S, c, isPlayer);
  let gross = 0, n = 0; const vm = isPlayer ? vouchMul(S, c.id, g, 'sell') : 1, vl = isPlayer ? vouchLeft(S, c.id, g, 'sell') : 0;
  for (; n < qty; n++) {
    gross += unitPrice(c, g) * (haggle || 1) * (n < vl ? vm : 1);
    c.stock[g] = Math.min(c.stock[g] + 1, capG(c, g) * 1.2);
  }
  if(isPlayer)gross=climateSaleGross(S,source,c.id,gross,tr,climateBasisCost(basis,n));
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
// المسافة البرية الفعلية: طول الطريق على اليابسة (09d-routes.js) لا الخط المستقيم، وإلا فالمستقيم احتياطاً
const landDist = (S, a, b) => routeLen(a, b, false) || dist(S, a, b);
const navOf = car => (car.captain ? car.captain.nav : 0);
function tripDays(S, car, a, b) {
  const hu = herdUnits(car), sp = SPEED * perkMul(S, 'speed') * (1 + 0.06 * navOf(car)) * (1 - 0.03 * (car.carts - 1)) * (car.morale < 40 ? 0.85 : 1) * (1 + (mountOf(car) ? mountOf(car).speed : 0)) * (hu > 0 ? 1 - Math.min(0.25, 0.15 + 0.1 * hu / 100) : 1);
  return Math.max(1, Math.ceil(landDist(S, a, b) / sp * shortMul(S, a, b)));
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
/* جنس الدواجن في الحمولة (لا تمشي مع القطيع): cx[g] = {m: ذكور معروفة، f: إناث معروفة}، والباقي غير محدَّد */
const cxOf = (car, g) => { car.cx = car.cx || {}; return car.cx[g] || (car.cx[g] = { m: 0, f: 0 }); };
function cxScale(car, g, before) { const x = (car.cx || {})[g]; if (!x) return; const now = car.cargo[g] || 0; if (before > 0) { const k = Math.max(0, Math.min(1, now / before)); x.m *= k; x.f *= k; } }
function cxMales(car, g, have, n) { const x = (car.cx || {})[g]; if (!x || have <= 0) return 0; const m = Math.min(x.m, have), f = Math.min(x.f, have - m), unk = have - m - f; return n * (m + 0.25 * unk) / have; }
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
function startTrip(S, car, dest, pace, source = 'trade') {
  if (car.left > 0) return { ok: false, msg: 'القافلة في الطريق' };
  { const tb = travelBlock(S, car, dest); if (tb) return { ok: false, msg: tb }; }
  { const sb = car.main ? shockBlock(S, car.city, dest) : null; if (sb) return { ok: false, msg: sb }; }
  if (dest === car.city) return { ok: false, msg: 'أنت في هذه المدينة' };
  const c = S.cities[car.city]; ctxFor(S, car.city);
  const days = tripDays(S, car, car.city, dest), need = supplyNeed(car, days), cost = need * unitPrice(c, 'wheat') * perkMul(S, 'prov');
  let prem = car.insured ? valueOf(holdings(car)) * TK.tripRate : 0;
  car.hungry = false;
  if (S.player.gold < cost + prem) {
    if (S.player.gold < cost * 0.3) return { ok: false, msg: 'رصيدك لا يكفي حتى لأقل نفقة طريق (' + Math.ceil(cost * 0.3) + ')' };
    car.hungry = true; prem = 0; if (car.main) learnReact(S, 'hungry', 15);
  }
  pPay(S, 'provisions', Math.min(cost, S.player.gold), true);
  if (prem) tkContribute(S, pPay(S, 'takaful', prem));
  c.stock.wheat = Math.max(0, c.stock.wheat - need);
  car.supplies = need;
  car.tripSector = source; car.from = car.city; car.dest = dest; car.left = days; car.total = days;
  applyPace(S, car, days, paceSec(S, car, car.from, dest, days, false), pace, capOfCar(car));
  return { ok: true, days, cost: Math.ceil(cost), pace: car.pace };
}
/* قطاع الطرق: قتال بالدفاع مقابل قوة الجماعة B؛ الهزيمة تنهب 15–40٪ (أقل بالتأمين). في اللعبة البشرية يختار اللاعب الأسلوب (S.road) وإلا فالقتال الافتراضي */
const roadOn = S => !!(S.learn && S.learn.char && S.learn.level >= 3 && !S.noEvents);
const defenseOf = car => (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
function banditFight(S, car, to, B, defMul, kind) {
  if (car.main && barakaTier(S) && rr(S, 0, 1) < barakaGuard(S)) { news(S, 'مرّ ' + (kind === 'pirates' ? 'القراصنة' : 'قطاع الطرق') + ' دون أن يمسّوا قافلتك: هذا من بركة رصيدك', 'good'); return { repelled: true, blessed: true }; }
  const who = kind === 'pirates' ? 'القراصنة' : 'قطاع الطرق', defense = (defenseOf(car) + (kind === 'pirates' ? seaExtra(S, to) : 0)) * defMul;
  if (defense >= B) { if (kind === 'pirates') seaStat(S).repelled++;
  if (car.main) { news(S, 'صدّ حرّاسك ' + (kind === 'pirates' ? 'القراصنة في البحر قبل ' : 'قطاع طرق في الطريق إلى ') + S.cities[to].name + '!', 'good'); learnReact(S, 'banditsRepel', 30); } return { repelled: true }; }
  let f = rr(S, 0.15, 0.4) * perkMul(S, 'banditLoss');
  let lost = 0;
  for (const g in car.cargo) { const l = Math.floor(car.cargo[g] * f); car.cargo[g] -= l; lost += l * mid(g); }
  for (const g in (car.herd || {})) { const b0 = car.herd[g], l = Math.floor(b0 * f); car.herd[g] -= l; lost += l * mid(g); herdScale(car, g, b0); const x = (car.hx || {})[g]; if (x) x.y -= Math.floor(x.y * f); }
  car.morale = Math.max(0, car.morale - 15);
  const comp = car.insured ? tkClaim(S, lost, TK.cover) : 0;
  learnReact(S, 'bandits', 20); sink(S, 'bandits', lost); S.player.led.exp.bandits = (S.player.led.exp.bandits || 0) + lost;
  news(S, (car.main ? '' : car.name + ': ') + 'نهب ' + who + ' نحو ' + Math.round(f * 100) + '٪ من البضاعة قرب ' + S.cities[to].name + '.', 'bad');
  S.pause = true; syncBasis(car);
  return { repelled: false, f, lost };
}
function arrive(S, car) {
  const to = car.dest, seaTrip = car.sea; car.pace = null; car.city = to; car.dest = null; car.sea = null; car.trips++; S.player.trips++; ctxFor(S, to); learnArrive(S, car, to);
  const natH = capRole(car) === 'native' ? car.captain.home : null, cu = customsOf(S, car.from, to, holdings(car)) * (natH && S.cities[to].country === natH ? 0.7 : 1), val0 = valueOf(car.cargo);
  if (cu > 0) {
    let paid = pPay(S, 'customs', cu, true), short = cu - paid, seized = 0;
    for (const g in car.cargo) { if (short <= 0) break; const n = Math.min(Math.floor(car.cargo[g]), Math.ceil(short / mid(g))); if (n > 0) { car.cargo[g] -= n; short -= n * mid(g); seized += n * mid(g); } }
    const totCu = paid + seized; if (val0 > 0) for (const g in car.basis) car.basis[g].c += totCu * (car.basis[g].q * mid(g)) / val0;
    if (seized > 0) { sink(S, 'customs', seized); S.player.led.exp.customs = (S.player.led.exp.customs || 0) + seized; }
    if (car.main) learnReact(S, 'ushur');
    if (car.main) news(S, 'جمارك ' + Math.round(paid + seized) + ' عند دخول ' + CD[S.cities[to].country].name + (seized > 0 ? ' (صودرت بضاعة لتغطية ما نقص من رصيدك)' : '') + '.', seized > 0 ? 'bad' : '');
  }
  const key = riskKey(car.from, to);
  const defense = (car.guards * 1.5 + car.crew * 0.4 + (car.captain ? car.captain.combat * 2 : 0)) * (car.morale / 100);
  const guarded = bossActive(S) && (pactIn(S, car.from, 'guard') || pactIn(S, to, 'guard'));
  const natMul = natH && (S.cities[car.from].country === natH || S.cities[to].country === natH) ? 0.8 : 1;
  if (capRole(car) === 'envoy') { const bs = S.bosses && S.bosses[to]; if (bs && bs.trust < 50 && S.day - (bs.envDay == null ? -99 : bs.envDay) >= 5) { bs.trust = Math.min(50, bs.trust + 1.5); bs.envDay = S.day; if (S.learn && S.learn.char) news(S, car.captain.name + ' مهّد لك عند ' + bs.name + ': زادت ثقته بك.', 'good'); } }
  if (seaTrip) seaArrive(S, car, to, seaTrip);
  else if (!guarded && rnd(S) < S.risk[key] * natMul * sacredMul(S, car.from, to) * (S.awaySim ? AWAY_RISK : 1) * climateRisk(S, car.tripSector || 'trade', to)) {
    const B = rr(S, 4, 16);
    if (car.main && roadOn(S) && !S.road) { S.road = { k: 'bandits', day: S.day, car: car.id, to, from: car.from, B }; S.pause = true; learnReact(S, 'roadBandits'); }
    else banditFight(S, car, to, B, 1);
  }
  syncBasis(car); if (!S.road) shopCarry(S, car); snapshotKnown(S, [to]);
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

/* ---------- السفر البحري (المرحلة 1): موانئ وسفينة تُشترى تُبحر بها القافلة بين الموانئ ----------
   الفرق عن البر: سعة أكبر وسرعة أعلى في المسافات الطويلة، لكن رسوم ميناء، ورياح موسمية تحدد موسم الإبحار بين البحار، وعواصف وقراصنة بدل قطاع الطرق.
   موانئ اللعبة: جدة وجازان (البحر الأحمر) والإسكندرية (المتوسط) ومومباي وكلكتا (الهند) وكانتون وشنغهاي (الصين). لا ميناء لفارس. */
// الموانئ PORTS معرَّفة في 17-shocks.js (نفس موانئ صدمة القراصنة)
const SEA_REGION = { jeddah: 0, jazan: 0, alex: 0, mumbai: 1, kolkata: 1, guangzhou: 2, shanghai: 2 };
const SEA = { phase: 3, feePct: 0.012, feeMin: 25, sellBack: 0.7, baseRisk: 0.1, offRisk: 0.1, offDays: 1.35, YEAR_HALF: 177 };
/* أنواع السفن: need = عدد الرحلات البحرية اللازمة لفتح النوع (تدرّج)، slots = بحّارة، upkeep = أجر صيانة يومي (ربعه وهي راسية) */
const SHIPS = {
  dhow: { name: 'سنبوق', cap: 220, cost: 3200, speed: 1.4, slots: 3, upkeep: 6, need: 0 },
  baghla: { name: 'بغلة', cap: 450, cost: 9500, speed: 1.5, slots: 5, upkeep: 14, need: 3 },
  boom: { name: 'بوم', cap: 800, cost: 22000, speed: 1.6, slots: 8, upkeep: 30, need: 10 }
};
const SHIP_UP = { hull: { name: 'تقوية الهيكل', cost: [0.2, 0.4], desc: 'تقل خسارة العاصفة 15٪ لكل مستوى ويزيد دفاع السفينة' }, sail: { name: 'أشرعة أخف', cost: [0.15, 0.3], desc: 'سرعة +8٪ لكل مستوى' } };
const SEA_ROLES = { navigator: { name: 'ملاّح', desc: 'سرعة +6٪ لكل نقطة ملاحة وعاصفة أخف' }, bold: { name: 'قبطان جريء', desc: 'دفاع أعلى ضد القراصنة' }, sage: { name: 'نوخذة حكيم', desc: 'يخفض احتمال العاصفة والقراصنة 20٪' } };
const SEA_ROLE_KEYS = Object.keys(SEA_ROLES), SEA_CAP_NAMES = ['سالم', 'ناصر', 'مبارك', 'خميس', 'سعود', 'راشد', 'عبيد', 'حميد', 'زايد', 'جمعة'], SAILOR_FEE = 120, SAILOR_WAGE = 2.5;
const seaStat = S => S.player.sea || (S.player.sea = { storm: 0, pirates: 0, repelled: 0, ports: {} });
const shipUp = (sh, k) => ((sh.up || {})[k] || 0), shipCrew = sh => sh.crew || 0;
const shipNav = (sh, car) => (sh && sh.captain ? sh.captain.nav : navOf(car));
/* مرشّحو القيادة البحرية: ثلاثة بالمعادلة نفسها كقادة البر (حتمية بحسب اليوم، بلا عشوائية عامة) */
function seaCaptainPool(S) {
  let t = ((S.day + 1) * 6007 + shipsOf(S).length * 90001) >>> 0;
  const r = () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const used = new Set(), out = [];
  for (let i = 0; i < 3; i++) {
    let role; do { role = SEA_ROLE_KEYS[Math.floor(r() * 3)]; } while (used.has(role)); used.add(role);
    const nav = 1 + Math.floor(r() * 3), combat = 1 + Math.floor(r() * 3);
    out.push({ i, name: SEA_CAP_NAMES[Math.floor(r() * SEA_CAP_NAMES.length)], role, nav, combat, fee: 900 + 300 * (nav + combat), wage: +(5 + (nav + combat) * 1.5).toFixed(1) });
  }
  return out;
}
/* دفاع السفينة ضد القراصنة: طاقم + هيكل + قائد بحري، فوق دفاع القافلة نفسها */
function seaExtra(S, city) { const sh = shipAt(S, city); if (!sh) return 0; return shipCrew(sh) * 0.6 + shipUp(sh, 'hull') * 1.2 + (sh.captain ? sh.captain.combat * (sh.captain.role === 'bold' ? 3.2 : 2.2) : 0); }
function shipDay(S) {
  for (const sh of shipsOf(S)) {
    const T = SHIPS[sh.type], moving = !sh.city; let w = T.upkeep * (moving ? 1 : 0.25) + shipCrew(sh) * SAILOR_WAGE * (moving ? 1 : 0.5) + (sh.captain ? sh.captain.wage * (moving ? 1 : 0.5) : 0);
    payObligation(S, 'wages', w, sh.city || sh.dest, 'ship', sh, 'أجور وتشغيل السفينة');
  }
}
const isPort = id => PORTS.indexOf(id) >= 0;
const shipsOf = S => S.player.ships || (S.player.ships = []);
const shipAt = (S, city) => shipsOf(S).find(x => x.city === city) || null;
const shipOf = (S, car) => (car && car.sea ? shipsOf(S).find(x => x.id === car.sea.ship) || null : null);
/* الرياح الموسمية بين البحار: للاعب بالتاريخ الميلادي الحقيقي: الرياح الجنوبية الغربية من أبريل إلى سبتمبر تحمل السفن شرقاً من البحر الأحمر إلى الهند والصين، والشمالية الشرقية من أكتوبر إلى مارس تعيدها غرباً. وللروبوتات نصف سنة الاقتصاد كما كان. داخل البحر الواحد لا تأثير */
function monsoonOf(S, from, to) {
  const rf = SEA_REGION[from], rt = SEA_REGION[to]; if (rf === rt) return { dir: 'calm', fair: true };
  const east = rt > rf, firstHalf = S.learn && S.learn.char ? dateOf(S).g.m >= 4 && dateOf(S).g.m <= 9 : (S.day % YEAR) < SEA.YEAR_HALF;
  return { dir: east ? 'out' : 'back', fair: east === firstHalf };
}
function seaDays(S, car, ship, a, b, rec) {
  const sp = SPEED * ship.speed * perkMul(S, 'speed') * (1 + 0.06 * shipNav(rec, car)) * (1 + 0.08 * shipUp(rec || {}, 'sail')) * (car.morale < 40 ? 0.85 : 1), m = monsoonOf(S, a, b);
  return Math.max(1, Math.ceil((routeLen(a, b, true) || dist(S, a, b)) / sp * (m.fair ? 1 : SEA.offDays)));
}
/* خطة الإبحار: تُرجع سبب المنع أو التفاصيل (مدة، رسم، مؤن، خطر) للمقارنة بالبر */
function seaPlan(S, car, dest) {
  const from = car.city, r = { ok: false, msg: '' };
  if (S.phase < SEA.phase) { r.msg = 'السفر بحراً يُفتح في الطور ' + SEA.phase; return r; }
  if (car.left > 0) { r.msg = 'القافلة في الطريق'; return r; }
  if (!isPort(from) || !isPort(dest)) { r.msg = 'الإبحار بين الموانئ فقط'; return r; }
  if (from === dest) { r.msg = 'أنت في هذا الميناء'; return r; }
  const ship = shipAt(S, from), tb = travelBlock(S, car, dest), sb = car.main ? shockBlock(S, from, dest) : null;
  if (tb) { r.msg = tb; return r; } if (sb) { r.msg = sb; return r; }
  if (!ship) { r.msg = 'لا سفينة لك راسية في ' + S.cities[from].name; r.needShip = true; return r; }
  const sd = SHIPS[ship.type], ld = loadOf(car);
  if (herdUnits(car) > 0) { r.msg = 'القطيع الماشي لا يُبحر: بِعه أو أنزله أولاً'; return r; }
  if (ld > sd.cap) { r.msg = 'حمولتك ' + Math.round(ld) + ' تزيد على سعة السفينة ' + sd.cap + ': أنزل ' + Math.ceil(ld - sd.cap) + ' في المخزن أو بِعها'; return r; }
  const m = monsoonOf(S, from, dest), days = seaDays(S, car, sd, from, dest, ship), need = supplyNeed(car, days), c = S.cities[from], val = valueOf(holdings(car));
  const fee = Math.max(SEA.feeMin, SEA.feePct * val), prov = need * unitPrice(c, 'wheat') * perkMul(S, 'prov'), risk = SEA.baseRisk + (m.fair ? 0 : SEA.offRisk);
  return { ok: true, ship, days, need, fee, prov, risk, monsoon: m, cap: sd.cap, load: ld };
}
function startSail(S, car, dest, pace) {
  const p = seaPlan(S, car, dest); if (!p.ok) return { ok: false, msg: p.msg };
  const c = S.cities[car.city]; ctxFor(S, car.city);
  if (S.player.gold < p.fee + p.prov * 0.3) return { ok: false, msg: 'رصيدك لا يكفي رسم الميناء ونفقة الطريق (' + Math.ceil(p.fee + p.prov * 0.3) + ')' };
  car.hungry = S.player.gold < p.fee + p.prov;
  const prem = car.insured ? valueOf(holdings(car)) * TK.tripRate * 1.4 : 0; // التأمين البحري أغلى قليلاً من البري
  pPay(S, 'portfee', p.fee, true); pPay(S, 'provisions', Math.min(p.prov, S.player.gold), true); if (prem && S.player.gold >= prem) tkContribute(S, pPay(S, 'takaful', prem));
  c.stock.wheat = Math.max(0, c.stock.wheat - p.need);
  car.supplies = p.need; car.from = car.city; car.dest = dest; car.left = p.days; car.total = p.days;
  car.sea = { ship: p.ship.id, from: car.city, type: p.ship.type }; p.ship.city = null; p.ship.dest = dest;
  applyPace(S, car, p.days, paceSec(S, car, car.from, dest, p.days, true), pace, p.cap);
  return { ok: true, days: p.days, fee: Math.ceil(p.fee), cost: Math.ceil(p.prov), pace: car.pace };
}
/* عند الوصول: ترسو السفينة، وقد تقع عاصفة (تُلقى بعض البضاعة) أو يهاجم قراصنة (يختار اللاعب كما مع قطاع الطرق) */
function seaArrive(S, car, to, sea) {
  const ship = shipsOf(S).find(x => x.id === sea.ship); if (ship) { ship.city = to; ship.dest = null; }
  const m = monsoonOf(S, sea.from, to), sage = ship && ship.captain && ship.captain.role === 'sage' ? 0.8 : 1, p = (SEA.baseRisk + (m.fair ? 0 : SEA.offRisk)) * sage * (S.awaySim ? AWAY_RISK : 1) * climateRisk(S, 'trade', to);
  S.player.seaTrips = (S.player.seaTrips || 0) + 1; seaStat(S).ports[to] = S.day;
  if (rnd(S) >= p) { if (car.main) S.seaRes = { k: 'fair', msg: m.fair ? 'رياح مواتية، وصلتَ سالماً إلى ' + S.cities[to].name : 'وصلتَ سالماً رغم مخالفة الموسم' }; return; }
  if (rnd(S) < 0.5) { // عاصفة
    const f = clamp(rr(S, 0.04, 0.14) * (1 - 0.1 * shipNav(ship, car)) * (1 - 0.15 * shipUp(ship || {}, 'hull')) * (ship && ship.captain && ship.captain.role === 'navigator' ? 0.85 : 1), 0.02, 0.2); let lost = 0;
    for (const g in car.cargo) { const l = Math.floor(car.cargo[g] * f); car.cargo[g] -= l; lost += l * mid(g); }
    const comp = car.insured ? tkClaim(S, lost, TK.cover) : 0; sink(S, 'storm', lost); S.player.led.exp.storm = (S.player.led.exp.storm || 0) + lost;
    news(S, (car.main ? '' : car.name + ': ') + 'عاصفة في عرض البحر ألقت نحو ' + Math.round(f * 100) + '٪ من البضاعة قبل ' + S.cities[to].name + (comp ? ' (عوّضك صندوق التكافل)' : '') + '.', 'bad');
    if (car.main) { S.seaRes = { k: 'storm', msg: 'عاصفة ألقت نحو ' + Math.round(f * 100) + '٪ من بضاعتك' }; S.pause = true; learnReact(S, 'seaStorm', 20); }
    seaStat(S).storm++; syncBasis(car); return;
  }
  seaStat(S).pirates++;
  const B = rr(S, 5, 18); // قراصنة
  if (car.main && roadOn(S) && !S.road) { S.road = { k: 'pirates', day: S.day, car: car.id, to, from: sea.from, B }; S.pause = true; learnReact(S, 'seaPirates'); }
  else banditFight(S, car, to, B, 1, 'pirates');
}
/* ---------- إيقاع السفر (عرض فقط: أيام العالم والاقتصاد كما هي) ----------
   زمن الانتظار الفعلي للرحلة بالثواني يتبع المسافة، و«مؤن السفر» اختيارية تختصره. لا RNG هنا. */
const PACE = { base: 12, perDist: 0.055, min: 15, max: 50, seaMin: 10, packBase: 8, packMax: 60, lv: [{ id: 0, name: 'عادي', cut: 0, rate: 0 }, { id: 1, name: 'سريع', cut: 0.2, rate: 0.5 }, { id: 2, name: 'أسرع', cut: 0.35, rate: 1.2 }] };
const cityHash = id => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973; return h / 9973; };
const landSec = (S, a, b) => clamp(PACE.base + PACE.perDist * landDist(S, a, b), PACE.min, PACE.max);
// البحر أسرع من البر على الدرب نفسه بنسبة أيامه، فيبقى زمن اليوم الواحد كما في البر
function paceSec(S, car, a, b, days, sea) { const ls = landSec(S, a, b); return sea ? clamp(ls * days / Math.max(1, tripDays(S, car, a, b)), PACE.seaMin, PACE.max * 1.2) : ls; }
const packPrice = (S, cityId) => Math.round(PACE.packBase * (0.9 + 0.2 * cityHash(cityId)));
const packUnits = (lv, days, cap) => (lv ? Math.ceil(PACE.lv[lv].rate * days * (0.75 + 0.25 * cap / 100)) : 0);
function paceQuote(S, car, dest, sea) {
  let days, cap;
  if (sea) { const p = seaPlan(S, car, dest); if (!p.ok) return null; days = p.days; cap = p.cap; } else { days = tripDays(S, car, car.city, dest); cap = capOfCar(car); }
  const sec = paceSec(S, car, car.city, dest, days, sea), price = packPrice(S, car.city), have = car.pack || 0;
  return { days, sec: Math.round(sec), price, have, lv: PACE.lv.map(L => { const u = packUnits(L.id, days, cap), miss = Math.max(0, u - have); return { id: L.id, name: L.name, units: u, sec: Math.round(sec * (1 - L.cut)), miss, cost: miss * price }; }) };
}
// عند الانطلاق: يشتري الناقص من مؤن السفر إن أمكن (وإلا ينزل لأعلى مستوى يقدر عليه) ويحفظ زمن الانتظار على القافلة الرئيسية
function applyPace(S, car, days, sec, lv, cap) {
  car.pace = null; if (!car.main) return;
  const price = packPrice(S, car.city); let L = Math.max(0, Math.min(2, lv | 0));
  while (L > 0 && Math.max(0, packUnits(L, days, cap) - (car.pack || 0)) * price > S.player.gold) L--;
  const u = packUnits(L, days, cap), miss = Math.max(0, u - (car.pack || 0));
  if (miss) { pPay(S, 'packs', miss * price, true); car.pack = (car.pack || 0) + miss; }
  car.pack = (car.pack || 0) - u;
  const secF = Math.round(sec * (1 - PACE.lv[L].cut));
  car.pace = { lv: L, units: u, sec0: Math.round(sec), sec: secF, ms: Math.round(secF * 1000 / Math.max(1, days)), day: S.day };
  if (L > 0) car.morale = Math.min(100, car.morale + 4);
}
// شراء مؤن السفر من سوق المدينة التي تقف فيها القافلة (سعر شبه ثابت، بحدّ أقصى للمخزون)
function buyPack(S, car, n) {
  n = Math.floor(n); if (!car || !(n >= 1)) return { ok: false, msg: 'اختر كمية صحيحة' };
  if (car.left > 0) return { ok: false, msg: 'القافلة في الطريق' };
  const have = car.pack || 0, room = PACE.packMax - have; if (room < 1) return { ok: false, msg: 'مخزونك من مؤن السفر ممتلئ (' + PACE.packMax + ')' };
  const price = packPrice(S, car.city), k = Math.min(n, room, Math.floor(S.player.gold / price)); if (k < 1) return { ok: false, msg: 'رصيدك لا يكفي' };
  pPay(S, 'packs', k * price, true); car.pack = have + k; return { ok: true, n: k, cost: k * price };
}
/* ---------- مسارات القوافل (مولَّدة بـ scripts/gen-routes.py من صورة الخريطة، لا تُعدَّل يدوياً) ----------
   مسارات برية على اليابسة فقط، ومسارات بحرية بين الموانئ على الماء فقط (تُقرأ بالاتجاهين). */
const ROUTES = { land: {"alex|aswan":[[115,177],[114.0,186.0],[152,302]],"alex|cairo":[[115,177],[118.0,186.0],[128,196]],"alex|delhi":[[115,177],[118.0,182.0],[644,261]],"alex|guangzhou":[[115,177],[118.0,182.0],[510.0,242.0],[930,320]],"alex|hail":[[115,177],[118.0,182.0],[278,261]],"alex|isfahan":[[115,177],[118.0,182.0],[214.0,190.0],[402,191]],"alex|jazan":[[115,177],[118.0,182.0],[190.0,230.0],[286.0,402.0],[285,410]],"alex|jeddah":[[115,177],[118.0,182.0],[190.0,230.0],[246.0,330.0],[242,345]],"alex|kolkata":[[115,177],[118.0,182.0],[510.0,242.0],[742,334]],"alex|mecca":[[115,177],[118.0,182.0],[190.0,230.0],[246.0,330.0],[252,351]],"alex|medina":[[115,177],[118.0,182.0],[190.0,230.0],[250,308]],"alex|mumbai":[[115,177],[118.0,182.0],[510.0,242.0],[618.0,346.0],[618.0,366.0],[612,375]],"alex|riyadh":[[115,177],[118.0,182.0],[334,306]],"alex|shanghai":[[115,177],[118.0,182.0],[214.0,190.0],[975,216]],"alex|shiraz":[[115,177],[118.0,182.0],[394.0,222.0],[408,237]],"alex|tabriz":[[115,177],[118.0,182.0],[214.0,190.0],[350,119]],"alex|xian":[[115,177],[118.0,182.0],[214.0,190.0],[885,191]],"aswan|cairo":[[152,302],[128,196]],"aswan|delhi":[[152,302],[150.0,206.0],[502.0,226.0],[644,261]],"aswan|guangzhou":[[152,302],[150.0,206.0],[458.0,226.0],[930,320]],"aswan|hail":[[152,302],[150.0,206.0],[262.0,246.0],[278,261]],"aswan|isfahan":[[152,302],[150.0,206.0],[402,191]],"aswan|jazan":[[152,302],[150.0,206.0],[174.0,214.0],[218.0,274.0],[286.0,402.0],[285,410]],"aswan|jeddah":[[152,302],[150.0,206.0],[174.0,214.0],[218.0,274.0],[246.0,330.0],[242,345]],"aswan|kolkata":[[152,302],[150.0,206.0],[458.0,226.0],[742,334]],"aswan|mecca":[[152,302],[150.0,206.0],[174.0,214.0],[218.0,274.0],[246.0,330.0],[252,351]],"aswan|medina":[[152,302],[150.0,206.0],[174.0,214.0],[250,308]],"aswan|mumbai":[[152,302],[150.0,206.0],[458.0,226.0],[614.0,338.0],[618.0,366.0],[612,375]],"aswan|riyadh":[[152,302],[150.0,206.0],[262.0,246.0],[334,306]],"aswan|shanghai":[[152,302],[150.0,206.0],[975,216]],"aswan|shiraz":[[152,302],[150.0,206.0],[394.0,222.0],[408,237]],"aswan|tabriz":[[152,302],[150.0,206.0],[350,119]],"aswan|xian":[[152,302],[150.0,206.0],[885,191]],"cairo|delhi":[[128,196],[598.0,242.0],[644,261]],"cairo|guangzhou":[[128,196],[502.0,234.0],[930,320]],"cairo|hail":[[128,196],[278,261]],"cairo|isfahan":[[128,196],[402,191]],"cairo|jazan":[[128,196],[174.0,214.0],[218.0,274.0],[286.0,402.0],[285,410]],"cairo|jeddah":[[128,196],[174.0,214.0],[218.0,274.0],[246.0,330.0],[242,345]],"cairo|kolkata":[[128,196],[502.0,234.0],[742,334]],"cairo|mecca":[[128,196],[174.0,214.0],[218.0,274.0],[246.0,330.0],[252,351]],"cairo|medina":[[128,196],[174.0,214.0],[250,308]],"cairo|mumbai":[[128,196],[502.0,234.0],[618.0,346.0],[618.0,366.0],[612,375]],"cairo|riyadh":[[128,196],[298.0,270.0],[334,306]],"cairo|shanghai":[[128,196],[975,216]],"cairo|shiraz":[[128,196],[394.0,222.0],[408,237]],"cairo|tabriz":[[128,196],[306.0,162.0],[350,119]],"cairo|xian":[[128,196],[885,191]],"delhi|guangzhou":[[644,261],[930,320]],"delhi|hail":[[644,261],[354.0,218.0],[278,261]],"delhi|isfahan":[[644,261],[402,191]],"delhi|jazan":[[644,261],[354.0,218.0],[290.0,402.0],[285,410]],"delhi|jeddah":[[644,261],[354.0,218.0],[242,345]],"delhi|kolkata":[[644,261],[742,334]],"delhi|mecca":[[644,261],[354.0,218.0],[252,351]],"delhi|medina":[[644,261],[354.0,218.0],[250,308]],"delhi|mumbai":[[644,261],[618.0,366.0],[612,375]],"delhi|riyadh":[[644,261],[354.0,218.0],[334,306]],"delhi|shanghai":[[644,261],[975,216]],"delhi|shiraz":[[644,261],[408,237]],"delhi|tabriz":[[644,261],[350,119]],"delhi|xian":[[644,261],[885,191]],"guangzhou|hail":[[930,320],[358.0,218.0],[278,261]],"guangzhou|isfahan":[[930,320],[402,191]],"guangzhou|jazan":[[930,320],[358.0,218.0],[290.0,402.0],[285,410]],"guangzhou|jeddah":[[930,320],[358.0,218.0],[242,345]],"guangzhou|kolkata":[[930,320],[746.0,330.0],[742,334]],"guangzhou|mecca":[[930,320],[358.0,218.0],[252,351]],"guangzhou|medina":[[930,320],[358.0,218.0],[250,308]],"guangzhou|mumbai":[[930,320],[646.0,338.0],[618.0,366.0],[612,375]],"guangzhou|riyadh":[[930,320],[358.0,218.0],[350.0,238.0],[334,306]],"guangzhou|shanghai":[[930,320],[975,216]],"guangzhou|shiraz":[[930,320],[408,237]],"guangzhou|tabriz":[[930,320],[350,119]],"guangzhou|xian":[[930,320],[885,191]],"hail|isfahan":[[278,261],[402,191]],"hail|jazan":[[278,261],[286.0,402.0],[285,410]],"hail|jeddah":[[278,261],[242,345]],"hail|kolkata":[[278,261],[370.0,218.0],[742,334]],"hail|mecca":[[278,261],[252,351]],"hail|medina":[[278,261],[250,308]],"hail|mumbai":[[278,261],[370.0,218.0],[582.0,306.0],[618.0,350.0],[618.0,366.0],[612,375]],"hail|riyadh":[[278,261],[334,306]],"hail|shanghai":[[278,261],[370.0,218.0],[975,216]],"hail|shiraz":[[278,261],[370.0,218.0],[406.0,234.0],[408,237]],"hail|tabriz":[[278,261],[350,119]],"hail|xian":[[278,261],[370.0,218.0],[885,191]],"isfahan|jazan":[[402,191],[350.0,226.0],[290.0,402.0],[285,410]],"isfahan|jeddah":[[402,191],[350.0,226.0],[242,345]],"isfahan|kolkata":[[402,191],[742,334]],"isfahan|mecca":[[402,191],[350.0,226.0],[252,351]],"isfahan|medina":[[402,191],[274.0,286.0],[250,308]],"isfahan|mumbai":[[402,191],[606.0,330.0],[618.0,358.0],[618.0,366.0],[612,375]],"isfahan|riyadh":[[402,191],[350.0,226.0],[334,306]],"isfahan|shanghai":[[402,191],[975,216]],"isfahan|shiraz":[[402,191],[408,237]],"isfahan|tabriz":[[402,191],[350,119]],"isfahan|xian":[[402,191],[885,191]],"jazan|jeddah":[[285,410],[286.0,402.0],[250.0,350.0],[242,345]],"jazan|kolkata":[[285,410],[286.0,402.0],[358.0,218.0],[522.0,250.0],[742,334]],"jazan|mecca":[[285,410],[286.0,402.0],[252,351]],"jazan|medina":[[285,410],[286.0,402.0],[250,308]],"jazan|mumbai":[[285,410],[286.0,402.0],[358.0,218.0],[522.0,250.0],[618.0,346.0],[618.0,366.0],[612,375]],"jazan|riyadh":[[285,410],[286.0,402.0],[334,306]],"jazan|shanghai":[[285,410],[286.0,402.0],[358.0,218.0],[975,216]],"jazan|shiraz":[[285,410],[286.0,402.0],[358.0,218.0],[398.0,226.0],[408,237]],"jazan|tabriz":[[285,410],[350,119]],"jazan|xian":[[285,410],[286.0,402.0],[358.0,218.0],[885,191]],"jeddah|kolkata":[[242,345],[362.0,218.0],[594.0,278.0],[742,334]],"jeddah|mecca":[[242,345],[252,351]],"jeddah|medina":[[242,345],[250,308]],"jeddah|mumbai":[[242,345],[362.0,218.0],[538.0,262.0],[618.0,346.0],[618.0,366.0],[612,375]],"jeddah|riyadh":[[242,345],[334,306]],"jeddah|shanghai":[[242,345],[362.0,218.0],[975,216]],"jeddah|shiraz":[[242,345],[362.0,218.0],[398.0,226.0],[408,237]],"jeddah|tabriz":[[242,345],[350,119]],"jeddah|xian":[[242,345],[362.0,218.0],[885,191]],"kolkata|mecca":[[742,334],[366.0,218.0],[350.0,226.0],[252,351]],"kolkata|medina":[[742,334],[366.0,218.0],[282.0,278.0],[250,308]],"kolkata|mumbai":[[742,334],[618.0,366.0],[612,375]],"kolkata|riyadh":[[742,334],[366.0,218.0],[350.0,226.0],[334,306]],"kolkata|shanghai":[[742,334],[975,216]],"kolkata|shiraz":[[742,334],[408,237]],"kolkata|tabriz":[[742,334],[350,119]],"kolkata|xian":[[742,334],[885,191]],"mecca|medina":[[252,351],[250,308]],"mecca|mumbai":[[252,351],[358.0,218.0],[526.0,250.0],[618.0,346.0],[618.0,366.0],[612,375]],"mecca|riyadh":[[252,351],[334,306]],"mecca|shanghai":[[252,351],[358.0,218.0],[975,216]],"mecca|shiraz":[[252,351],[358.0,218.0],[398.0,226.0],[408,237]],"mecca|tabriz":[[252,351],[350,119]],"mecca|xian":[[252,351],[358.0,218.0],[885,191]],"medina|mumbai":[[250,308],[362.0,218.0],[538.0,262.0],[618.0,346.0],[618.0,366.0],[612,375]],"medina|riyadh":[[250,308],[334,306]],"medina|shanghai":[[250,308],[362.0,218.0],[975,216]],"medina|shiraz":[[250,308],[362.0,218.0],[398.0,226.0],[408,237]],"medina|tabriz":[[250,308],[350,119]],"medina|xian":[[250,308],[362.0,218.0],[885,191]],"mumbai|riyadh":[[612,375],[614.0,366.0],[614.0,338.0],[550.0,290.0],[370.0,218.0],[350.0,226.0],[334,306]],"mumbai|shanghai":[[612,375],[618.0,370.0],[975,216]],"mumbai|shiraz":[[612,375],[614.0,366.0],[614.0,338.0],[550.0,290.0],[408,237]],"mumbai|tabriz":[[612,375],[614.0,366.0],[614.0,338.0],[350,119]],"mumbai|xian":[[612,375],[885,191]],"riyadh|shanghai":[[334,306],[354.0,222.0],[402.0,218.0],[975,216]],"riyadh|shiraz":[[334,306],[354.0,222.0],[390.0,218.0],[408,237]],"riyadh|tabriz":[[334,306],[350,119]],"riyadh|xian":[[334,306],[354.0,222.0],[402.0,218.0],[885,191]],"shanghai|shiraz":[[975,216],[408,237]],"shanghai|tabriz":[[975,216],[358.0,126.0],[350,119]],"shanghai|xian":[[975,216],[885,191]],"shiraz|tabriz":[[408,237],[350,119]],"shiraz|xian":[[408,237],[885,191]],"tabriz|xian":[[350,119],[414.0,134.0],[885,191]]}, sea: {"alex|guangzhou":[[115,177],[114.0,170.0],[158.0,170.0],[166.0,178.0],[166.0,202.0],[162.0,218.0],[290.0,462.0],[306.0,470.0],[394.0,470.0],[682.0,518.0],[834.0,514.0],[890.0,562.0],[894.0,562.0],[922.0,446.0],[934.0,334.0],[930,320]],"alex|jazan":[[115,177],[114.0,170.0],[158.0,170.0],[166.0,178.0],[166.0,202.0],[162.0,218.0],[250.0,386.0],[278.0,414.0],[285,410]],"alex|jeddah":[[115,177],[114.0,170.0],[158.0,170.0],[166.0,178.0],[166.0,202.0],[162.0,218.0],[218.0,326.0],[234.0,342.0],[242,345]],"alex|kolkata":[[115,177],[114.0,170.0],[158.0,170.0],[166.0,178.0],[166.0,202.0],[162.0,218.0],[290.0,462.0],[306.0,470.0],[394.0,470.0],[662.0,498.0],[750.0,346.0],[742,334]],"alex|mumbai":[[115,177],[114.0,170.0],[158.0,170.0],[166.0,178.0],[166.0,202.0],[162.0,218.0],[290.0,462.0],[306.0,470.0],[612,375]],"alex|shanghai":[[115,177],[114.0,170.0],[158.0,170.0],[166.0,178.0],[166.0,202.0],[162.0,218.0],[290.0,462.0],[306.0,470.0],[394.0,470.0],[682.0,518.0],[834.0,514.0],[890.0,562.0],[894.0,562.0],[986.0,254.0],[986.0,222.0],[975,216]],"guangzhou|jazan":[[930,320],[934.0,334.0],[910.0,546.0],[894.0,562.0],[890.0,562.0],[834.0,518.0],[798.0,514.0],[666.0,518.0],[378.0,470.0],[298.0,470.0],[282.0,434.0],[282.0,418.0],[285,410]],"guangzhou|jeddah":[[930,320],[934.0,334.0],[910.0,546.0],[894.0,562.0],[890.0,562.0],[834.0,518.0],[798.0,514.0],[666.0,518.0],[378.0,470.0],[298.0,470.0],[238.0,350.0],[242,345]],"guangzhou|kolkata":[[930,320],[934.0,334.0],[910.0,546.0],[894.0,562.0],[890.0,562.0],[850.0,526.0],[750.0,346.0],[742,334]],"guangzhou|mumbai":[[930,320],[934.0,334.0],[910.0,546.0],[894.0,562.0],[890.0,562.0],[834.0,518.0],[798.0,514.0],[670.0,518.0],[642.0,486.0],[606.0,378.0],[612,375]],"guangzhou|shanghai":[[930,320],[938.0,330.0],[954.0,322.0],[978.0,286.0],[986.0,246.0],[986.0,222.0],[975,216]],"jazan|jeddah":[[285,410],[278.0,414.0],[278.0,410.0],[274.0,406.0],[238.0,350.0],[242,345]],"jazan|kolkata":[[285,410],[282.0,418.0],[286.0,454.0],[302.0,470.0],[626.0,474.0],[650.0,498.0],[666.0,494.0],[750.0,346.0],[742,334]],"jazan|mumbai":[[285,410],[282.0,418.0],[286.0,454.0],[302.0,470.0],[612,375]],"jazan|shanghai":[[285,410],[282.0,418.0],[286.0,454.0],[302.0,470.0],[626.0,474.0],[674.0,518.0],[834.0,514.0],[890.0,562.0],[894.0,562.0],[986.0,254.0],[986.0,222.0],[975,216]],"jeddah|kolkata":[[242,345],[238.0,350.0],[298.0,470.0],[622.0,474.0],[654.0,498.0],[666.0,494.0],[750.0,346.0],[742,334]],"jeddah|mumbai":[[242,345],[238.0,350.0],[298.0,470.0],[562.0,418.0],[602.0,378.0],[612,375]],"jeddah|shanghai":[[242,345],[238.0,350.0],[298.0,470.0],[602.0,474.0],[678.0,518.0],[834.0,514.0],[890.0,562.0],[894.0,562.0],[986.0,254.0],[986.0,222.0],[975,216]],"kolkata|mumbai":[[742,334],[750.0,346.0],[662.0,498.0],[650.0,498.0],[626.0,446.0],[606.0,378.0],[612,375]],"kolkata|shanghai":[[742,334],[750.0,346.0],[862.0,542.0],[890.0,562.0],[894.0,562.0],[986.0,254.0],[986.0,222.0],[975,216]],"mumbai|shanghai":[[612,375],[606.0,378.0],[642.0,490.0],[678.0,518.0],[834.0,514.0],[890.0,562.0],[894.0,562.0],[986.0,254.0],[986.0,222.0],[975,216]]} };
function routePath(a, b, sea) { const k = a < b ? a + '|' + b : b + '|' + a, pl = (sea ? ROUTES.sea : ROUTES.land)[k]; if (!pl) return null; return a < b ? pl : pl.slice().reverse(); }
function routeLen(a, b, sea) { const pl = routePath(a, b, sea); if (!pl) return 0; let s = 0; for (let i = 1; i < pl.length; i++) s += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); return s; }
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
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) { const res = sellUnits(S, P, c, g, car.cargo[g], car.cargo, true, 1 + 0.015 * car.captain.trade, 'auto', car.basis[g]); if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); const record = logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost, 'auto'); car.pl = (car.pl || 0) + record.pl; } }
  const d = bestDeal(S, car, P.gold * 0.4, 'auto');
  if (!d) { car.waiting = 'لا صفقة مجزية الآن'; return; }
  const room = capOfCar(car) - loadOf(car), budget = { gold: Math.min(P.gold * 0.4, d.cost * 1.1) }, res = buyUnits(S, budget, c, d.g, Math.min(d.q, room / GD[d.g].w), room, car.cargo, true);
  if (res.n < 1) { car.waiting = 'تعذّر الشراء'; return; }
  P.gold -= res.cost; addBasis(car.basis, d.g, res.n, res.cost);
  const r = startTrip(S, car, d.dest, undefined, 'auto'); car.waiting = r.ok ? null : r.msg;
}
/* ---------- القادة والمسارات الآلية ---------- */
function autoRoute(S, car) {
  const r = car.route; if (!r) return;
  const P = S.player, c = S.cities[car.city], cap = capOfCar(car);
  ctxFor(S, car.city);
  const haggle = 1 + 0.015 * (car.captain ? car.captain.trade : 0), lux = capRole(car) === 'lux';
  for (const g of GIDS) if ((car.cargo[g] || 0) >= 1) {
    const q = Math.floor(car.cargo[g]), res = sellUnits(S, P, c, g, q, car.cargo, true, haggle * (lux && isLuxish(g) ? 1.04 : 1), 'auto', car.basis[g]);
    if (res.n > 0) { const cost = takeBasis(car.basis, g, res.n); const record = logTrade(S, car.city, g, res.n, 'sell', res.net, res.net - cost, 'auto'); car.pl = (car.pl || 0) + record.pl; }
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
  const res = startTrip(S, car, dest, undefined, 'auto');
  car.waiting = res.ok ? null : res.msg;
}


/* تقرير الأسطول: لكل قافلة بقائد حالتها وربحها وما يعطّلها بلغة بسيطة (قراءة فقط) */
const WAIT_TXT = { 'لا صفقة مجزية الآن': 'لا يجد صفقة تستحق الآن: غيّر سلعته أو مساره، أو اجعله «مستقلاً» ليختار بنفسه.', 'تعذّر الشراء': 'تعذّر الشراء: نقدك لا يكفي أو السلعة غير متاحة في هذه المدينة.' };
function fleetReport(S) {
  const mult = wageMultOf(S);
  return S.player.caravans.filter(c => c.captain && !c.main).map(car => {
    const cp = car.captain, daily = (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * mult + (mountOf(car) ? mountOf(car).up : 0);
    const indep = capRole(car) === 'indep', idleCost = daily * WAGE.idle, value = valueOf(car.cargo), lines = [];
    let status;
    if (car.left > 0) status = 'في الطريق إلى ' + S.cities[car.dest].name + '، باقٍ ' + car.left + ' يوم.';
    else if (car.waiting) status = 'واقف في ' + S.cities[car.city].name + ': ' + (WAIT_TXT[car.waiting] || car.waiting);
    else status = (car.route || indep) ? 'في ' + S.cities[car.city].name + ' يستعد للرحلة التالية.' : 'واقف في ' + S.cities[car.city].name + '.';
    if (!car.route && !indep) lines.push({ ok: false, t: 'بلا مسار: يقف ولا يتاجر وتدفع له ≈ ' + Math.round(idleCost) + ' ريال يومياً بلا عمل. حدّد له مساراً بين مدينتين.' });
    if (car.trips > 0) { const pl = Math.round(car.pl || 0); lines.push({ ok: pl >= 0, t: 'أنجز ' + car.trips + ' رحلة، وربحه من المبيعات ≈ ' + pl + ' ريال' + (pl < 0 ? ' (خسارة)' : '') + ' مقابل أجور يومية ≈ ' + Math.round(daily) + '.' }); }
    else lines.push({ ok: true, t: 'لم ينجز رحلة بعد. أجوره اليومية ≈ ' + Math.round(daily) + ' ريال.' });
    const lo = cp.loyal == null ? 70 : cp.loyal; if (lo < 40) lines.push({ ok: false, t: 'ولاؤه ' + Math.round(lo) + ' من 100' + (lo < 25 ? ': يوشك أن يترك العمل!' : ': ضعيف، ادفع أجره في موعده أو أعطه علاوة.') });
    if (value > 3000 && !car.guards && !car.insured) lines.push({ ok: false, t: 'في حمولته ≈ ' + Math.round(value) + ' ريال بلا حرّاس ولا تكافل. زوّده بحارس أو اشترك في التكافل.' });
    if (car.morale < 50) lines.push({ ok: false, t: 'معنوياته ' + Math.round(car.morale) + ' من 100: تحتاج راحة وطعاماً.' });
    return { id: car.id, name: car.name, status, lines, ok: lines.every(l => l.ok) && !car.waiting, pl: Math.round(car.pl || 0), trips: car.trips || 0, daily: Math.round(daily) };
  });
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
function tick(S, recordHistory = true) {
  S.day++; paymentRecord(S, 'rent', 0); climateDay(S); S.pause = false; S.ctxCur = 'sar'; fxDay(S);
  if (S.road && S.road.day < S.day) roadAuto(S);
  shockDay(S); seasonDay(S); eyesDay(S);
  for (const id of S.order) cityDay(S, S.cities[id]);
  for (const sh of (S.shocks || [])) { const K = SHOCKS[sh.k]; if (sh.st === 'on' && K && K.day) K.day(S, sh); }
  agentsDay(S); rivalDay(S);
  playerDay(S);
  ordersDay(S);
  debtDay(S); defectDay(S); babEventDay(S); freedomDay(S); learnCheck(S); zakatDay(S); advisorDay(S); achDay(S); yearDay(S); calDay(S); cardDay(S);
  const nw = netWorth(S);
  for (let ph = 2; ph <= 4; ph++) if (S.phase < ph && nw >= PHASE_AT[ph - 1]) {
    S.phase = ph; learnReact(S, 'phase' + ph); news(S, 'فُتح الطور ' + ph + ': ' + ['', '', 'الدكاكين والأسطول', 'التكامل الصناعي', 'الإمبراطورية المالية'][ph - 1] + '! لا شيء ممّا بنيتَه يُصادَر.', 'good'); S.pause = true;
  }
  // المحاكاة المعيارية تستطيع تخطي أرشيف الرسم فقط؛ لا يقرأه أي قرار اقتصادي.
  if (recordHistory) {
  S.hist.nw.push(Math.round(nw)); if (S.hist.nw.length > 150) S.hist.nw.shift();
  for (const id of S.order) {
    const c = S.cities[id], h = S.hist.px[id] || (S.hist.px[id] = {});
    GIDS.forEach(g => { const a = h[g] || (h[g] = []); a.push(+unitPrice(c, g).toFixed(1)); if (a.length > 40) a.shift(); });
  }
  }
  const live = Object.keys(S.player.props).filter(k => hasPresence(S, k)); if (live.length) snapshotKnown(S, live);
  S.ctxCur = 'sar'; lifeDay(S);
}

function cityDay(S, c) {
  GIDS.forEach(g => { c.idx[g] = clamp(c.idx[g] + 0.08 * (1 - c.idx[g]) + (rndG(S, g) - 0.5) * 0.05, 0.8, 1.25); });
  if (c.ev) { c.ev.left--; if (c.ev.left <= 0) c.ev = null; }
  else if (rnd(S) < 0.012) {
    const k = ['boom', 'bust', 'plague', 'festival', 'war'][Math.floor(rnd(S) * 5)];
    const sector=k==='plague'?'farm':k==='bust'?'shops':'trade';
    if(climateRisk(S,sector,c.id)===1 || rnd(S)<.7){
    c.ev = { k, left: { boom: 20, bust: 15, plague: 12, festival: 8, war: 25 }[k] };
    news(S, ({ boom: 'ازدهار في ', bust: 'كساد في ', plague: 'وباء في ', festival: 'مهرجان في ', war: 'حصار وحرب قرب ' })[k] + c.name + ' (' + CD[c.country].name + ')', k === 'boom' || k === 'festival' ? 'good' : 'bad');
    }
  }
  const pt = popTotal(c);
  const tm = 1 + 0.15 * (c.tier - 1), pm = c.ev && c.ev.k === 'plague' ? 0.6 : 1;
  const hv = seasonActive(S, 'harvest');
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
  // ذاكرة مؤقتة لهذه الجولة فقط؛ تعاد التسعيرة فور تغير المخزون.
  const prices=new Map(),routes=new Map();
  const price=(c,g)=>{let row=prices.get(c);if(!row){row=new Map();prices.set(c,row);}const stock=c.stock[g],q=row.get(g);if(q&&q.stock===stock)return q.price;const value=unitPrice(c,g);row.set(g,{stock,price:value});return value;};
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
    const wheat=price(c,'wheat');
    let destinations=routes.get(a.city);
    if(!destinations){destinations=S.order.filter(d=>d!==a.city).map(d=>{const dc=S.cities[d],cus=dc.country===c.country?0:CD[dc.country].customs;return {d,city:dc,net:1-dc.tax-cus,days:Math.max(1,Math.ceil(dist(S,a.city,d)/SPEED))};});routes.set(a.city,destinations);}
    let best = null;
    for (const g of GIDS) {
      const G=GD[g];
      if (G.sp || G.fresh || g === c.sig && exclusiveAt(S, a.city)) continue;
      const pb = price(c, g) * 1.01;
      for (const r of destinations) {
        const ps = price(r.city, g) * r.net * (0.92 + rnd(S) * 0.16);
        const days=r.days,fu=(G.fod||0)*days*wheat,m=(ps-pb-fu)/days/pb;
        if (!best || m > best.m) best = { g, d:r.d, m, days, fu };
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
const LOCAL_FACTORY_BATCHES = 2, LOCAL_FACTORY_UPKEEP = 3.75, LOCAL_FACTORY_YIELD = 1.45; // مردود الصناعة المحلية؛ يقاس منفصلاً عن دخل الدكان.
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
  if (!c || !rc) return; const output = rc.n * (isAbroad(f) ? 1 : LOCAL_FACTORY_YIELD) * climateFactor(S, 'factory', f.city);
  ctxFor(S, f.city);
  if (!isAbroad(f)) { // المحلي: المناخ على المخرجات فقط؛ المدخلات والتكاليف كما كانت
    c.factJobs += 80 * f.level; payObligation(S, 'wages', rc.wage * f.level, f.city, 'factory', f, 'أجور ' + rc.name); pPay(S, 'upkeep', LOCAL_FACTORY_UPKEEP * f.level, true);
    if (!pr) return;
    for (let b = 0; b < LOCAL_FACTORY_BATCHES * f.level; b++) {
      let ok = true;
      for (const g in rc.inp) if ((pr.store[g] || 0) < rc.inp[g]) {
        { const rs = buyUnits(S, P, c, g, rc.inp[g] - (pr.store[g] || 0), storeRoom(S, f.city), pr.store, true, true); pr.basis = pr.basis || {}; addBasis(pr.basis, g, rs.n, rs.cost); }
        if ((pr.store[g] || 0) < rc.inp[g]) ok = false;
      }
      if (!ok || storeRoom(S, f.city) < GD[rc.out].w * output) break;
      let inCost = 0; pr.basis = pr.basis || {};
      for (const g in rc.inp) { pr.store[g] -= rc.inp[g]; inCost += takeBasis(pr.basis, g, rc.inp[g]); }
      pr.store[rc.out] = (pr.store[rc.out] || 0) + output; addBasis(pr.basis, rc.out, output, inCost); achFlag(S, 'factory_first');
      fauc(S, 'factory', output * mid(rc.out));
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
  const wage = rc.wage * f.level, paid = payObligation(S, 'wages', wage, f.city, 'factory', f, 'أجور ' + rc.name); pPay(S, 'upkeep', 0.0015 * 2500 * f.level, true);
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
      if (storeRoom(S, f.city) < GD[rc.out].w * output) break;
      let inCost = 0;
      for (const g in rc.inp) { const need = rc.inp[g] * (1 + waste); pr.store[g] -= need; inCost += takeBasis(pr.basis, g, need); }
      f.acc += output * (0.5 + 0.5 * q); f.accCost += inCost;
      const k = Math.floor(f.acc);
      if (k >= 1) { f.acc -= k; achFlag(S, 'factory_first'); pr.store[rc.out] = (pr.store[rc.out] || 0) + k; addBasis(pr.basis, rc.out, k, f.accCost, q); f.accCost = 0; made += k; fauc(S, 'factory', k * mid(rc.out) * q); }
    }
    if (mg && set.sell === 'now' && (pr.store[rc.out] || 0) >= 1) {
      const qm = qualOf(pr.basis, rc.out), r = sellUnits(S, P, c, rc.out, pr.store[rc.out], pr.store, true, qm, 'factory');
      if (r.n > 0) { const cost = takeBasis(pr.basis, rc.out, r.n); logTrade(S, f.city, rc.out, r.n, 'shop', r.net, r.net - cost, 'factory'); P.led.inc.shops = (P.led.inc.shops || 0) + r.net; f.sold = (f.sold || 0) + r.n; f.rev = (f.rev || 0) + r.net; }
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
  const paid = payObligation(S, 'staff', w, city, 'manager', m, MGR[m.lv].name); m.late = paid < w - 1e-9 ? (m.late || 0) + 1 : 0;
  if (m.late >= 3) { pr.mgr = null; news(S, 'ترك مدير أعمال ' + c.name + ' العمل لأن أجره تأخّر.', 'bad'); return; }
  if (S.day - (m.audit == null ? m.since : m.audit) >= MGR_AUDIT && rndB(S) < MGR_THEFT / 30 * climateRisk(S, 'factory', city)) {
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
      case 'shop': return S.order.some(id => shopsOf(S, id).length > 0); // امتلك دكاناً (حالة قائمة لا حدثاً مختلقاً)
      case 'debtfree': return !!(S.player.famDebt && S.player.famDebt.left <= 0);
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
      case 'gain': S.player.gold += e[1]; msgs.push('قبضتَ ' + e[1] + ' ريال'); break;
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
/* ---------- المواسم: مربوطة بالتاريخ الحقيقي. الدينية والتاريخية بالتاريخ الهجري (h: شهر، يوم، شهر، يوم)، والطبيعية بالميلادي (g)،
   فرمضان في رمضان والحج في ذي الحجة. تغيّر الطلب على سلع بعينها، وإشعار قبلها بثلاثة أيام. تعمل في لعبة التعلّم من المستوى 4 كالصدمات.
   المواعيد والأسواق التاريخية معتمدة من المختص الشرعي والتاريخي. قد يتزامن موسمان (الحج وعيد الأضحى مثلاً) فيجتمع أثرهما ---------- */
const YEAR = 354, MUSLIM = new Set(['sa', 'eg', 'ir']);
const HEJAZ = c => ['mecca', 'medina', 'jeddah'].includes(c.id), MKT_GOODS = ['leather', 'camel', 'horse', 'textile', 'wool', 'perfume'];
const SEASONS = {
  harvest: { name: 'موسم الحصاد', g: [4, 15, 6, 15], mul: 1.25, prod: true, desc: 'الغلال والخامات أوفر وأرخص' },
  winter: { name: 'برد الشتاء', g: [12, 1, 2, 28], mul: 1.25, goods: ['wool', 'leather', 'textile', 'wood'], where: () => true, desc: 'يشتد الطلب على الصوف والجلود والحطب' },
  shaban: { name: 'استعداد رمضان', h: [8, 16, 8, 30], mul: 1.15, goods: ['dates', 'wheat', 'rice', 'sugar', 'honey', 'oliveoil', 'raisins'], where: c => MUSLIM.has(c.country), desc: 'تتزوّد الأسواق بمؤن رمضان وتمره في النصف الثاني من شعبان' },
  ramadan: { name: 'شهر رمضان', h: [9, 1, 9, 30], mul: 1.3, goods: ['dates', 'honey', 'sugar', 'rice', 'wheat', 'oliveoil', 'cheese', 'raisins', 'eggs'], where: c => MUSLIM.has(c.country), desc: 'يرتفع الطلب على التمر والسكر والعسل والأرز في بلاد المسلمين' },
  fitr: { name: 'عيد الفطر', h: [10, 1, 10, 3], mul: 1.25, goods: ['textile', 'perfume', 'jewelry', 'sugar', 'honey', 'carpet', 'incense'], where: () => true, desc: 'هدايا وكسوة وحلوى، فيزداد الطلب على النسيج والعطور والمجوهرات' },
  rajab: { name: 'شهر رجب الحرام', h: [7, 1, 7, 30], mul: 1, info: true, desc: 'شهر حرام فرد في وسط العام، كانت العرب تعتمر فيه وتقصد أسواقه (كسوق حُباشة في تهامة) وتأمن فيه القوافل' },
  ukaz: { name: 'سوق عكاظ', h: [11, 1, 11, 20], mul: 1.3, goods: MKT_GOODS, where: HEJAZ, desc: 'سوق عربي قديم كانت القبائل تجتمع فيه قبل موسم الحج للتجارة والشعر، فيكثر الطلب على الجلود والإبل والخيل والنسيج في الحجاز' },
  majanna: { name: 'سوق مَجَنّة', h: [11, 20, 11, 30], mul: 1.3, goods: MKT_GOODS, where: HEJAZ, desc: 'سوق عربي قديم يلي عكاظ في أواخر ذي القعدة بأسفل مكة المكرمة، فتتابع القبائل تجارتها قبل الحج' },
  majaz: { name: 'سوق ذي المجاز', h: [12, 1, 12, 8], mul: 1.3, goods: MKT_GOODS, where: HEJAZ, desc: 'سوق عربي قديم يقام في مطلع ذي الحجة قرب عرفات، وبعده يبدأ الحج' },
  hajj: { name: 'موسم الحجيج', h: [12, 8, 12, 13], mul: 1.35, boost: { mecca: 1.2, medina: 1.15 }, goods: ['wheat', 'dates', 'textile', 'incense', 'perfume', 'raisins', 'honey'], where: c => c.country === 'sa', desc: 'يزدحم الحجاز بالزوّار فيكثر الطلب على القوت والعطور والنسيج في السعودية، وأشدّه في مكة المكرمة والمدينة المنورة' },
  adha: { name: 'عيد الأضحى وأيام النحر', h: [12, 10, 12, 13], mul: 1.3, goods: ['sheep', 'goat', 'camel', 'cow', 'buffalo'], where: c => MUSLIM.has(c.country), desc: 'يكثر الطلب على الغنم والماعز والإبل والبقر والجاموس للأضاحي في بلاد المسلمين' },
};
const MARKETS_NOTE = 'هذه محاكاة لأسواق العرب الكبرى التي اشتهرت في تاريخ الحجاز (عكاظ، ومجنّة، وذو المجاز)، وكانت ترتحل فيها القوافل بالترتيب مع اقتراب موسم الحج.';
const SACRED_NEWS = 'دخلت الأشهر الحُرُم (ذو القعدة، ذو الحجة، محرم، ورجب)؛ وفيها وضعت العرب السلاح قديماً وعظّم الإسلام حرمتها، فتأمن القوافل ويقل خطر قطّاع الطرق.';
const SACRED_RISK = 0.5; // في الجزيرة العربية يهبط خطر قطّاع الطرق إلى النصف في الأشهر الحرم
const seasonsOn = S => !!(S.learn && S.learn.char && S.learn.level >= 4 && !S.noShocks);
const inSpan = (m, d, r) => { const x = m * 100 + d, a = r[0] * 100 + r[1], b = r[2] * 100 + r[3]; return a <= b ? x >= a && x <= b : x >= a || x <= b; };
let _sc = { S: null, k: '', keys: [] };
/* المواسم القائمة في يوم معيّن (بترتيب التعريف) */
function seasonsAt(S, day) {
  const key = (S.cal ? S.cal.jd0 : 0) + ':' + day;
  if (_sc.S === S && _sc.k === key) return _sc.keys;
  const dt = dateOf(S, day), keys = [];
  for (const k in SEASONS) { const X = SEASONS[k]; if (X.h ? inSpan(dt.h.m, dt.h.d, X.h) : inSpan(dt.g.m, dt.g.d, X.g)) keys.push(k); }
  _sc = { S, k: key, keys }; return keys;
}
const seasonAt = (S, day) => { const k = seasonsAt(S, day == null ? S.day : day); return k.length ? k[k.length - 1] : null; }; // الأخصّ (آخر المتزامنة)
const seasonActive = (S, k) => seasonsOn(S) && seasonsAt(S, S.day).includes(k);
function seasonLeft(S, k) { let n = 0; while (n < 60 && seasonsAt(S, S.day + n).includes(k)) n++; return n; }
function seasonNow(S) { if (!seasonsOn(S)) return null; const k = seasonAt(S, S.day); return k ? { k, left: seasonLeft(S, k), also: seasonsAt(S, S.day).filter(x => x !== k).map(x => SEASONS[x].name), ...SEASONS[k] } : null; }
function seasonNext(S) { if (!seasonsOn(S)) return null; const now = seasonsAt(S, S.day); for (let i = 1; i <= 12; i++) { const ks = seasonsAt(S, S.day + i).filter(k => !now.includes(k) && !seasonsAt(S, S.day + i - 1).includes(k)); if (ks.length) return { k: ks[0], in: i, ...SEASONS[ks[0]] }; } return null; }
function seasonMul(S, c, g) {
  if (!seasonsOn(S)) return 1; let m = 1;
  seasonsAt(S, S.day).forEach(k => { const X = SEASONS[k]; if (X.goods && X.goods.includes(g) && X.where(c)) m *= X.mul * ((X.boost && X.boost[c.id]) || 1); });
  return m;
}
/* تقويم المواسم القادمة (للنافذة): أقرب بداية لكل موسم خلال سنة */
function seasonCalendar(S) {
  const out = [], now = seasonsAt(S, S.day);
  for (const k in SEASONS) {
    if (now.includes(k)) { out.push({ k, now: true, in: 0, left: seasonLeft(S, k), ...SEASONS[k] }); continue; }
    for (let i = 1; i <= 400; i++) if (seasonsAt(S, S.day + i).includes(k) && !seasonsAt(S, S.day + i - 1).includes(k)) { out.push({ k, now: false, in: i, jd: dateOf(S, S.day + i).jd, ...SEASONS[k] }); break; }
  }
  return out.sort((a, b) => a.in - b.in);
}
const isSacred = (S, day) => { const h = dateOf(S, day == null ? S.day : day).h; return h.m === 11 || h.m === 12 || h.m === 1 || h.m === 7; };
/* خطر الطريق في الأشهر الحرم: بين مدينتين في الجزيرة العربية، للاعب فقط */
const sacredMul = (S, a, b) => seasonsOn(S) && S.cities[a].country === 'sa' && S.cities[b].country === 'sa' && isSacred(S) ? SACRED_RISK : 1;
function seasonDay(S) {
  if (!seasonsOn(S)) return; const now = seasonsAt(S, S.day), was = seasonsAt(S, S.day - 1);
  now.filter(k => !was.includes(k)).forEach(k => {
    const X = SEASONS[k]; news(S, 'بدأ ' + X.name + ': ' + X.desc + '.', 'good'); learnReact(S, 'seasonStart', 10);
    if (k === 'ukaz') news(S, MARKETS_NOTE, 'rumor');
    if (k === 'hajj') news(S, 'وصلت قوافل الحجيج من مصر والشام والعراق واليمن إلى الحجاز، وازدحمت أسواق مكة المكرمة والمدينة المنورة.', 'rumor');
  });
  const s1 = isSacred(S, S.day), s0 = isSacred(S, S.day - 1); if (s1 && !s0) news(S, SACRED_NEWS, 'rumor');
  const h = dateOf(S).h; if (h.m === 1 && h.d === 10) news(S, 'يوم عاشوراء (10 محرم): من الأيام الفاضلة في مطلع السنة الهجرية.', 'rumor');
  const a = seasonsAt(S, S.day + 3), b = seasonsAt(S, S.day + 2);
  a.filter(k => !b.includes(k)).forEach(k => news(S, 'يقترب ' + SEASONS[k].name + ' بعد 3 أيام: ' + SEASONS[k].desc + '.', 'rumor'));
}
/* ---------- التقويم: كل يوم في اللعبة يقابل يوماً حقيقياً يبدأ من تاريخ يختاره اللاعب ----------
   الميلادي بحساب اليوليان، والهجري بالتقويم الحسابي (المدني)، وقد يخالف رؤية الهلال بيوم أو يومين فيُذكر للاعب أنه تقريبي.
   السنة في رحلة اللاعب: من يوم البداية إلى الذكرى الهجرية التالية له (354 أو 355 يوماً). لا أثر على الروبوتات ولا على الاقتصاد. */
const HMONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const GMONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const YORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
function gregToJd(y, m, d) { const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045; }
function jdToGreg(jd) { const a = jd + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4), d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153); return { y: 100 * b + d - 4800 + Math.floor(m / 10), m: m + 3 - 12 * Math.floor(m / 10), d: e - Math.floor((153 * m + 2) / 5) + 1 }; }
const hijriToJd = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439;
function jdToHijri(jd) {
  let l = jd - 1948440 + 10632; const n = Math.floor((l - 1) / 10631); l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor(50 * l / 17719) + Math.floor(l / 5670) * Math.floor(43 * l / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const m = Math.floor(24 * l / 709); return { y: 30 * n + j - 30, m, d: l - Math.floor(709 * m / 24) };
}
const CAL = { MIN: gregToJd(2026, 10, 22), MAX: gregToJd(2099, 12, 31) }; // لا تبدأ الرحلة بتاريخ أقدم من هذا
const hStr = h => h.d + ' ' + HMONTHS[h.m - 1] + ' ' + h.y + ' هـ', gStr = g => g.d + ' ' + GMONTHS[g.m - 1] + ' ' + g.y + 'م';
const jdStr = jd => hStr(jdToHijri(jd)) + ' · ' + gStr(jdToGreg(jd));
const yearName = n => 'السنة ' + (n >= 1 && n <= YORD.length ? YORD[n - 1] : n);
const calOf = S => S.cal || (S.cal = { jd0: CAL.MIN, yr: 1 });
function dateOf(S, day) {
  const c = calOf(S), jd0 = c.jd0, jd = jd0 + (day == null ? S.day : day), h = jdToHijri(jd), g = jdToGreg(jd), h0 = jdToHijri(jd0);
  const ann = k => hijriToJd(h0.y + k, h0.m, h0.d); let k = h.y - h0.y; while (ann(k) > jd) k--; while (ann(k + 1) <= jd) k++;
  const s = ann(k), e = ann(k + 1);
  return { jd, h, g, hs: hStr(h), gs: gStr(g), year: k + 1, yname: yearName(k + 1), dayInYear: jd - s + 1, yearLen: e - s, yearStart: s };
}
/* أول تاريخ هجري (شهر ويوم) من jd فصاعداً */
function nextHijri(jd, m, d) { for (let i = 0; i < 400; i++) { const h = jdToHijri(jd + i); if (h.m === m && h.d === d) return jd + i; } return jd; }
function calDay(S) {
  const L = S.learn; if (!L || !L.char || !S.cal) return;
  const c = S.cal, d = dateOf(S); if (c.yr == null) c.yr = d.year;
  if (d.year <= c.yr) return;
  S.yearLog = S.yearLog || []; const nw = Math.round(netWorth(S)), prev = S.yearLog.length ? S.yearLog[S.yearLog.length - 1].nw : null;
  for (let n = c.yr; n < d.year; n++) S.yearLog.push({ n, nw, day: S.day });
  c.yr = d.year;
  news(S, 'طويتَ سنةً من رحلتك، وبدأت ' + d.yname + ' (' + d.hs + '). ثروتك الآن ≈ ' + nw + ' ريال' + (prev != null ? '، وكانت ' + prev + ' في آخر السنة التي قبلها' : '') + '.', 'good');
  learnReact(S, 'newYear', 1);
}
/* حَول الزكاة بالتاريخ الهجري الفعلي: من يوم بلوغ النصاب إلى مثله بعد سنة هجرية (354 أو 355 يوماً) */
function hawlLen(S, startDay) { const jd = calOf(S).jd0 + startDay, h = jdToHijri(jd); return hijriToJd(h.y + 1, h.m, h.d) - jd; }
/* أول يوم من أيام اللعبة (من اليوم فصاعداً) يوافق شهراً ويوماً هجريين */
const dayOfHijri = (S, m, d, from) => nextHijri(calOf(S).jd0 + (from == null ? S.day : from), m, d) - calOf(S).jd0;
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
  const climateChance=climateShockRisk(S,k);if(climateChance<1&&rndB(S)>=climateChance)return;
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
/* حدث الطريق التفاعلي: قطاع طرق (قاتل / ادفع فدية الطريق / ناور) */
function roadResolve(S, choice) {
  const R = S.road; if (!R) return NO('لا حدث');
  const sea = R.k === 'pirates', who = sea ? 'القراصنة' : 'قطاع الطرق', car = S.player.caravans.find(c => c.id === R.car) || S.player.caravans[0], to = R.to; S.road = null;
  if (choice === 'pay') {
    const val = valueOf(holdings(car)), t = Math.min(S.player.gold, Math.round(val * 0.08)); ctxFor(S, to); pPay(S, 'tribute', t, true); car.morale = Math.max(0, car.morale - 3);
    news(S, 'دفعتَ فدية الطريق ' + fmtN(t) + ' ريال ل' + who + ' فتركوا ' + (sea ? 'سفينتك' : 'قافلتك') + '. أرخص من نهبها.', ''); learnReact(S, 'roadPaid', 20); return { ok: true, outcome: 'paid', sea, msg: 'دفعتَ ' + fmtN(t) + ' ريال ومرّت ' + (sea ? 'السفينة' : 'القافلة') };
  }
  if (choice === 'evade') {
    const ch = clamp(0.3 + 0.03 * car.crew + (car.captain ? 0.05 * car.captain.nav : 0), 0.2, 0.8);
    if (rndB(S) < ch) { news(S, (sea ? 'ناورت سفينتك ' + who + ' ووصلت سالمة إلى ' : 'التفّت قافلتك حول الكمين ووصلت سالمة إلى ') + S.cities[to].name + '.', 'good'); return { ok: true, outcome: 'evaded', sea, msg: sea ? 'ناورتم القراصنة ونجوتم' : 'التففتم حول الكمين بسلام' }; }
    const r = banditFight(S, car, to, R.B, 0.8, sea ? 'pirates' : ''); return { ok: true, outcome: r.repelled ? 'repelled' : 'robbed', sea, msg: r.repelled ? 'اكتُشفتم لكن حرّاسك صدّوهم' : 'اكتُشفتم ونُهب نحو ' + Math.round(r.f * 100) + '٪' };
  }
  const r = banditFight(S, car, to, R.B, choice === 'fight' ? 1.15 : 1, sea ? 'pirates' : '');
  return { ok: true, outcome: r.repelled ? 'repelled' : 'robbed', sea, msg: r.repelled ? 'صدّ حرّاسك ' + who : 'غلبكم ' + who + ' ونهبوا نحو ' + Math.round(r.f * 100) + '٪' };
}
const roadAuto = S => { roadResolve(S, 'auto'); };
/* ---------- الملحمة: تذبح من مزرعتك وتبيع اللحم الطازج في السوق مباشرة، وما لم يُبَع يفسد 12٪ يومياً ---------- */
function butcherDay(S, city, pr, c) {
  const b = pr.butcher; b.today = 0;
  const have = Math.floor(pr.store.meat || 0);
  if (have >= 1) {
    const n = Math.min(have, BUTCHER_DAY * b.lv), r = sellUnits(S, S.player, c, 'meat', n, pr.store, true, BUTCHER_PREM, 'farm');
    if (r.n > 0) { const cost = takeBasis(pr.basis || (pr.basis = {}), 'meat', r.n); logTrade(S, city, 'meat', r.n, 'shop', r.net, r.net - cost, 'farm'); b.sold = (b.sold || 0) + r.n; b.rev = (b.rev || 0) + r.net; b.today = r.net; S.player.led.inc.shops = (S.player.led.inc.shops || 0) + r.net; }
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
    const ns = pr.shops.length; pr.today = 0; const Lx = P.led.exp, c0 = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0); let todayPl = 0; const rent0 = Lx.rent || 0, rentBefore = Object.fromEntries(pr.shops.map(sh => [sh.id, sh.rentPaid || 0])), shopNets = {};
    if (pr.farm) farmDay(S, city, pr, c);
    if (pr.butcher) butcherDay(S, city, pr, c);
    if (!ns && !pr.whs) { if (pr.farm) staffDay(S, city, pr, c); continue; }
    { const no = ownShops(pr); pPay(S, 'upkeep', no * 10 * (1 + 0.08 * (ns - 1)) + pr.whs * 6, true); }
    rentDay(S, city, pr, c);
    staffDay(S, city, pr, c); const sf = sellFactor(S, city);
    if (ns && sf <= 0) learnReact(S, 'noSeller', 15);
    // تعبئة آلية من السوق عند الرخص
    for (const sh of pr.shops) for (const it of sh.items) {
      const restock = Math.max(1, climateFactor(S, 'shops', city)), target = it.target;
      if (!it.auto || (pr.store[it.g] || 0) >= target) continue;
      if (ratio(c, it.g) >= it.buyBelow) continue;
      const room = storeRoom(S, city), budget = { gold: P.gold * 0.5 };
      const res = buyUnits(S, budget, c, it.g, Math.min(25 * restock, target - (pr.store[it.g] || 0)), room, pr.store, true, true);
      P.gold -= res.cost; addBasis(pr.basis, it.g, res.n, res.cost);
    }
    // البيع للسكان
    const cnt = {};
    for (const sh of pr.shops) for (const it of sh.items) cnt[it.g] = (cnt[it.g] || 0) + 1;
    const tr = taxRate(S, c, true);
    for (const sh of pr.shops) for (const it of sh.items) {
      const g = it.g, n = cnt[g], mp = unitPrice(c, g), qm = qualOf(pr.basis, g), price = it.price * refPrice(c, g) * qm;
      const share = Math.min(0.7, 0.3 * Math.pow(n, 0.8)) / n;
      const f = shopF(c, g, price, mp, shUp(sh, 'sign'));
      const shopPact = bossActive(S) ? pactIn(S, city, 'shop') : null;
      const units = Math.min(pr.store[g] || 0, c.dem[g] * share * f * SHOP_DEMAND * Math.pow(shopProsper(c), 0.7) * (shopPact ? 1.4 : 1) * (1 + 0.06 * shUp(sh, 'awning')) * sf * climateFactor(S, 'shops', city));
      it.lastSold = units;
      if (units <= 0) continue;
      const gross = units * price, tax = gross * tr, cost0 = takeBasis(pr.basis, g, units);
      const beforeAway = P.led.exp.awayYield || 0;
      logTrade(S, city, g, units, 'shop', gross - tax, gross - tax - cost0 - (S.awaySim && shopPact ? gross * shopPact.share : 0));
      const awayCut = (P.led.exp.awayYield || 0) - beforeAway;
      pr.store[g] -= units; c.stock[g] = Math.min(c.stock[g] + units, capG(c, g) * 1.2);
      const cut = shopPact ? gross * shopPact.share : 0; climateIncome(S, 'shops', gross - tax - cut - awayCut);
      P.gold += gross - tax - cut; sink(S, 'tax', tax); if (cut) { sink(S, 'pactShare', cut); P.led.exp.pactShare = (P.led.exp.pactShare || 0) + cut; }
      { const bsx = bossOf(S, city); if (bsx) bsx.dsales += gross; }
      P.led.inc.shops = (P.led.inc.shops || 0) + gross; P.led.exp.tax = (P.led.exp.tax || 0) + tax;
      it.sold = (it.sold || 0) + units; it.revenue = (it.revenue || 0) + gross - tax - cut; pr.today += gross - tax - cut - awayCut; todayPl += gross - tax - cut - cost0 - awayCut; shopNets[sh.id] = (shopNets[sh.id] || 0) + gross - tax - cut - cost0 - awayCut;
      if (rulerMine(S, c)) { const gv = tax * 0.2; P.gold += gv; P.led.inc.governor = (P.led.inc.governor || 0) + gv; fauc(S, 'governor', gv); }
    }
    if ((S.life && S.life.salemWaqf) || (S.legacy && S.legacy.waqf && S.legacy.waqf.type === 'shop')) {
      const shared = (Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) - c0 - ((Lx.rent || 0) - rent0);
      for (const sh of pr.shops) recordShopNet(S, city, sh, (shopNets[sh.id] || 0) - shared / Math.max(1, pr.shops.length) - ((sh.rentPaid || 0) - (rentBefore[sh.id] || 0)));
    }
    if (ns) { pr.hist = pr.hist || []; pr.hist.push({ d: S.day, rev: pr.today, net: todayPl - ((Lx.staff || 0) + (Lx.upkeep || 0) + (Lx.rent || 0) - c0) }); if (pr.hist.length > 30) pr.hist.shift(); if (pr.today > 0 && S.learn && S.learn.ev && !S.learn.ev.shopSold) S.learn.ev.shopSold = 1; }
  }
}
/* ---------- التمويل المشروع (بدل الفائدة): مضاربة بربح مشترك، ومرابحة بيعاً بالأجل بهامش معلوم سلفاً، وقرض حسن من زعيم موثوق، وصكوك مشاركة في قافلة.
   لا زيادة مشروطة على قرض، ولا غرامة تتراكم عند التأخر. الأرباح والخسائر تأتي من نشاط تجاري حقيقي ---------- */
/* الأجر المعلوم: أجر الحارس والطاقم يُعرض كاملاً قبل التوظيف: ما يُدفع مرة واحدة، وما يُدفع يومياً أثناء السفر، وما يُدفع حين تقف القافلة (قاعدة الأجير، اعتمدها المختص) */
const WAGE = { guard: 5, crew: 1.5, idle: 0.25, guardHire: 300, crewHire: 50 };
const wageMultOf = S => 1 + 0.06 * (S.player.caravans.length - 1);
function staffWage(S, kind) { const m = wageMultOf(S), d = Math.round(WAGE[kind] * m * 100) / 100; return { once: WAGE[kind + 'Hire'], day: d, idle: Math.round(d * WAGE.idle * 100) / 100 }; }
const candWage = cd => Math.round((4 + 2 * (cd.trade + cd.nav + cd.combat) / 3) * (cd.role === 'loyal' ? 0.9 : 1) * 10) / 10;
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
    const mine = gross * FIN.mud.share * (S.awaySim ? AWAY_YIELD : 1); B.dep[city] += mine; fauc(S, 'mudaraba', mine); P.led.inc.mudaraba = (P.led.inc.mudaraba || 0) + mine;
  }
  for (const l of B.loans) {
    if(l.src==='salem'){earlyQardDay(S,l);continue;}
    if (l.due == null) { l.due = S.day + 30; l.type = l.type || 'old'; }
    if (S.day < l.due) continue;
    const pay = Math.min(P.gold, l.amt); if (pay > 0) { P.gold -= pay; l.amt -= pay; }
    if (l.amt > 0.5) {
      l.late = (l.late || 0) + 1;
      if (l.late === 1) { news(S, 'حلّ أجل ' + (l.type === 'qard' ? 'القرض الحسن' : 'دَين المرابحة') + ' ولم يكفِ رصيدك. لا غرامة عليك، لكن الوفاء واجب ولن تُمنح تمويلاً جديداً حتى تسدّد.', 'bad'); learnReact(S, 'mdLate', 10); S.pause = true; }
      if (l.late % 10 === 0) { repOf(P).broke = (repOf(P).broke || 0) + 1; if (l.type === 'qard' && l.city && S.bosses[l.city]) S.bosses[l.city].trust -= 8; }
    }
  }
  B.loans = B.loans.filter(l => l.src==='salem'?l.amt>1e-8:l.amt>0.5);
  B.bonds = B.bonds.filter(b => {
    if (S.day < b.due) return true;
    const r = FIN.sukuk.lo + (FIN.sukuk.hi - FIN.sukuk.lo) * rndB(S), back = r > 0 ? b.amt * (1 + FIN.sukuk.share * r * (S.awaySim ? AWAY_YIELD : 1)) : b.amt * (1 + r);
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
  const P = S.player, nw = netWorth(S), wageMult = wageMultOf(S);
  shipDay(S);
  for (const id in P.props) { const pr = P.props[id]; if (!pr.ins) continue; const prem = insPrem(S, id); if (P.gold < prem) { pr.ins = null; news(S, 'انتهى اشتراكك في صندوق التكافل عن ممتلكاتك في ' + S.cities[id].name + ' لعجزك عن التبرع اليومي.', 'bad'); continue; } tkContribute(S, pPay(S, 'takaful', prem)); }
  for (const car of P.caravans) {
    const wage = (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * wageMult + (mountOf(car) ? mountOf(car).up : 0);
    const active = car.left > 0 || car.route || capRole(car) === 'indep', owed = active ? wage : wage * WAGE.idle, paidW = payObligation(S, 'wages', owed, car.city, 'caravan', car, 'أجور طاقم القافلة');
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
      if (rnd(S) < 0.05 * (1 - 0.1 * navOf(car)) * (S.awaySim ? AWAY_RISK : 1)) { car.left++; car.total++; if (car.main) news(S, 'عاصفة رملية أخّرت قافلتك يوماً.', 'bad'); }
      syncBasis(car);
      if (car.left === 0) arrive(S, car);
    } else {
      car.morale = Math.min(100, car.morale + 5);
      if (!S.awaySim || S.captainAuto) { if (car.route && car.captain) autoRoute(S, car); else if (!S.captainAuto && !car.route && capRole(car) === 'indep' && !car.main) autoIndep(S, car); }
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
/* رصيد البركة (يزيد بالإجابة الصحيحة في مجلس السوق): ثلاث درجات تقلّل احتمال تعرّض قافلتك لقطاع الطرق، بحدٍّ أقصى 12٪ */
const BARAKA_TIERS = [5, 12, 25];
const barakaTier = S => { const b = S.learn && S.learn.mj ? S.learn.mj.baraka : 0; return BARAKA_TIERS.filter(t => b >= t).length; };
const barakaGuard = S => 0.04 * barakaTier(S);
function learnNew() { return { char: null, level: 1, ev: {}, goods: [], secrets: [], up: [], sq: [], intro: 0, perks: {}, rq: [], rseen: {}, eq: [], lore: {}, cv: {}, cs: {}, csec: [], csq: [], bq: [], abroad: false }; }
function learnPerks(S) { const L = S.learn; L.perks = LS.perksOf(L.char, L.secrets); (L.csec || []).forEach(id => { L.perks['buy_' + id] = 0.98; }); if (L.free) L.perks.pact = (L.perks.pact || 1) * 0.97; const pf = (L.ev && L.ev.profit) || 0; if (pf >= 60) L.perks.prov = (L.perks.prov || 1) * 0.94; else if (pf >= 20) L.perks.prov = (L.perks.prov || 1) * 0.97; }
/* قصص الزعماء وأسرار الأسواق (src/lore.js) */
/* الدرس الذي شُرح فعلاً: أثناء فترة التمرين يكون المستوى التالي مفتوحاً لكن مقدّمته لم تُعرض بعد، فلا يُطلق أي حدث مرتبط بدرسه قبل أن يرويه عمّ سالم */
const taught = L => (L.rest ? L.level - 1 : L.level);
function loreFix(L) { L.mj = L.mj || { seen: {}, baraka: 0 }; L.eq = L.eq || []; L.tab = L.tab || []; L.tq = L.tq || []; L.fq = L.fq || []; L.lore = L.lore || {}; L.cv = L.cv || {}; L.cs = L.cs || {}; L.csec = L.csec || []; L.csq = L.csq || []; L.bq = L.bq || []; L.hist = L.hist || []; if (L.abroad === undefined) L.abroad = L.level >= 4; }
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
  if(S.player.famDebt?.plan&&S.player.bank.loans.some(l=>l.src==='salem'&&l.amt>0))return earlyQardDebtCut(S,pl);
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
/* البضاعة المعيبة (خيار العيب): للاعب الذي اختار شخصية فقط، من المستوى 4. بعد شراء بعض السلع قد يتبيّن بعد يومين عيب خفي في الكمية كلها: تنقص جودتها إلى النصف، وله خلال مهلة قصيرة وهو في مدينة البائع طلب الرد (استرداد الثمن) أو الأرش (فرق القيمة برضا البائع). لا أثر على الروبوتات */
const DEFECT = { chance: 0.06, minQty: 5, reveal: 2, grace: 12, gap: 25, q: 0.5, arshTrust: 10 };
function defectOpen(S) { return (S.defects || []).find(d => d.st === 'hidden' || d.st === 'found') || null; }
function defectMaybe(S, car, g, n, cost) {
  const L = S.learn; if (!L || !L.char || taught(L) < 4 || n < DEFECT.minQty || GD[g].live) return;
  if (defectOpen(S) || S.day - (S.defectLast == null ? -99 : S.defectLast) < DEFECT.gap) return;
  S.defectSeq = ((S.defectSeq || 0) + 1) % 997; if (roll(S, 60 + S.defectSeq) >= DEFECT.chance) return;
  S.defects = S.defects || []; S.defectLast = S.day;
  S.defects.push({ id: S.nextId++, car: car.id, city: car.city, g, n, cost, day: S.day, st: 'hidden' });
}
/* البيع بعد ظهور العيب (علماً به) تصرفُ المالك ورضاً بالعيب: يسقط حق الرد والأرش (اعتمده المختص) */
function defectSettle(S) {
  const d = defectOpen(S); if (!d || d.st !== 'found') return;
  const car = carById(S, d.car); if (!car || d.held == null || (car.cargo[d.g] || 0) >= d.held) return;
  d.st = 'forfeit'; news(S, 'بعتَ من بضاعة ' + GD[d.g].name + ' بعد أن علمتَ بعيبها، فسقط حقك في الرد والأرش لأن البيع بعد العلم رضاً بالعيب.', 'bad');
}
function defectDay(S) {
  defectSettle(S); const d = defectOpen(S); if (!d) return;
  const car = carById(S, d.car);
  if (d.st === 'hidden' && S.day >= d.day + DEFECT.reveal) {
    const b = car && car.basis[d.g], k = b ? Math.min(d.n, b.q) : 0;
    if (!(k > 0)) { d.st = 'gone'; return; }
    b.w = (b.w === undefined ? b.q : b.w) - k * (1 - DEFECT.q); d.st = 'found'; d.k = k; d.held = car.cargo[d.g] || 0;
    news(S, 'تبيّن في ' + k + ' من ' + GD[d.g].name + ' اشتريتها من ' + S.cities[d.city].name + ' عيب كان مخفياً، فنقصت قيمتها. لك خيار العيب: ارجع إلى البائع قبل أن تنتهي المهلة.', 'bad');
    mjWant(S, 'aib'); learnReact(S, 'defectFound', 1); S.pause = true;
  } else if (d.st === 'found') {
    const have = car ? Math.min(d.k, car.cargo[d.g] || 0) : 0;
    if (have <= 0) { d.st = 'gone'; news(S, 'لم يبقَ من البضاعة المعيبة شيء لتطالب به.', ''); }
    else if (S.day > d.day + DEFECT.grace) { d.st = 'late'; news(S, 'انقضى وقت المطالبة المعتاد؛ والتأخير الطويل في رد البضاعة يُعدّ في عُرف السوق رِضاً بها، فبادر بالرد فور اكتشاف العيب في المرات القادمة.', 'bad'); }
  }
}
/* حالة الطلب الآن: لا بد أن تكون القافلة في مدينة البائع */
function defectClaim(S) {
  defectSettle(S); const d = defectOpen(S); if (!d || d.st !== 'found') return null;
  const car = carById(S, d.car), here = !!car && car.left === 0 && car.city === d.city, k = car ? Math.min(d.k, car.cargo[d.g] || 0) : 0;
  const b = bossOf(S, d.city), trust = b && b.trust != null ? b.trust : 99;
  return { d, here, k, refund: Math.round(d.cost * k / d.n), arsh: Math.round(d.cost * k / d.n * (1 - DEFECT.q)), arshOk: trust >= DEFECT.arshTrust, left: d.day + DEFECT.grace - S.day };
}
function defectReturn(S) {
  const c = defectClaim(S); if (!c) return NO('لا بضاعة معيبة الآن');
  if (!c.here) return NO('ارجع إلى ' + S.cities[c.d.city].name + ' أولاً: الرد يكون عند البائع');
  const car = carById(S, c.d.car), g = c.d.g; takeBasis(car.basis, g, c.k); car.cargo[g] -= c.k; if (car.cargo[g] <= 0) delete car.cargo[g];
  S.cities[c.d.city].stock[g] = (S.cities[c.d.city].stock[g] || 0) + c.k; S.player.gold += c.refund; c.d.st = 'returned';
  learnReact(S, 'defectRet', 1); return OK('ردّ البائع ' + c.refund + ' ريال وأخذ ' + c.k + ' ' + GD[g].name + ' المعيبة');
}
function defectArsh(S) {
  const c = defectClaim(S); if (!c) return NO('لا بضاعة معيبة الآن');
  if (!c.here) return NO('ارجع إلى ' + S.cities[c.d.city].name + ' أولاً');
  if (!c.arshOk) return NO('لم يرضَ البائع بالأرش لأنه لا يثق بك بعد. يمكنك ردّ البضاعة أو تنمية الثقة');
  const car = carById(S, c.d.car), b = car.basis[c.d.g]; if (b) b.c = Math.max(0, b.c - c.arsh);
  S.player.gold += c.arsh; c.d.st = 'arsh'; learnReact(S, 'defectArsh', 1); return OK('أخذتَ ' + c.arsh + ' ريال أرشاً وأبقيتَ البضاعة');
}
function babEventDay(S) {
  const L = S.learn, P = S.player; if (!L || !L.char || taught(L) < 4) return;
  L.ex = L.ex || { broker: -99, friend: -99, luck: -99 }; L.mj = L.mj || { seen: {}, baraka: 0 }; L.eq = L.eq || []; P.loansOut = P.loansOut || [];
  P.loansOut = P.loansOut.filter(o => {
    if (S.day < o.due) return true;
    const back = o.type === 'secure' ? o.amt * 1.05 : o.type === 'worker' ? (roll(S, 7) < 0.8 ? o.amt : 0) : (roll(S, 9) < 0.2 ? o.amt : 0);
    if (back > 0) { P.gold += back; learnReact(S, 'friendOk', 1); news(S, 'ردّ صديقك قرضه (' + Math.round(back) + ' ريال). حسن اختيارك.', 'good'); }
    else { learnReact(S, 'friendLost', 1); news(S, 'ضاع قرض صديقك (' + o.amt + ' ريال). تذكّر قاعدة صادق.', 'bad'); }
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
  // مجلس السوق: مسألة من كتاب البيوع كل 30 إلى 45 يوماً، من المستوى 4، بصعوبة تتدرج مع المستوى
  if (taught(L) >= 4 && S.day - (L.ex.mj == null ? -99 : L.ex.mj) >= 30 + Math.floor(roll(S, 13) * 16)) {
    const c = mjNext(S); if (c) { L.mj.ann = false; return push('mj', { c: c.id }); }
  }
  // مسألة الأسبوع: خبر قبل موعد المجلس بنحو ست أيام، ويمكن قراءتها من دفتر الأحكام قبل موعدها
  if (taught(L) >= 4 && !L.mj.ann && S.day - (L.ex.mj == null ? -99 : L.ex.mj) >= 24 && S.day - (L.ex.mj == null ? -99 : L.ex.mj) < 99) { const c = mjNext(S); if (c) { L.mj.ann = true; news(S, 'مسألة تُناقش قريباً في مجلس السوق: ' + c.title + '. يمكنك قراءتها الآن من دفتر الأحكام في الأكاديمية.', 'rumor'); } }
}
/* المسألة التالية: ما طلبه حدث حقيقي في اللعبة (إن كان بصعوبة مسموحة) وإلا أول مسألة لم تُعرض بصعوبة مسموحة */
function mjNext(S) {
  const L = S.learn, cap = FIQH.allowed(taught(L)), w = L.mj.want && FIQH.CASES.find(x => x.id === L.mj.want);
  if (w && !L.mj.seen[w.id] && w.diff <= cap) return w;
  return FIQH.CASES.find(x => x.diff <= cap && !L.mj.seen[x.id]) || null;
}
function mjWant(S, id) { const L = S.learn; if (L && L.char && L.mj && !L.mj.seen[id]) L.mj.want = id; }
function mjNow(S) {
  const L = S.learn; if (!L || !L.char || taught(L) < 4) return NO('يُفتح مجلس السوق من المستوى 4');
  if (L.eq.length) return NO('أنهِ الحدث الحالي أولاً'); const c = mjNext(S); if (!c) return NO('لا مسألة جديدة الآن');
  L.eq.push({ id: 'mj', day: S.day, c: c.id }); L.ex.mj = S.day; L.mj.ann = false; S.pause = true; return OK('فُتحت مسألة «' + c.title + '»');
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
  if (ev.id === 'mj') { // مجلس السوق: اختيار الحكم ثم عرضه، فإغلاق
    const cs = FIQH.CASES.find(x => x.id === ev.c); if (!cs) { done(); return NO('مسألة غير معروفة'); }
    if (ch === 'close') { done(); return OK('أُضيفت المسألة إلى دفتر الأحكام'); }
    if (ev.pick != null) return NO('اخترتَ من قبل');
    const k = +String(ch).replace('p', ''); if (!(k >= 0 && k < cs.opts.length)) return NO('اختيار غير صحيح');
    ev.pick = k; ev.right = k === cs.ok; L.mj.seen[cs.id] = { p: k, ok: ev.right, d: S.day };
    if (ev.right) { L.mj.baraka++; }
    return ev.right ? OK('أصبتَ! زادت بركتك.') : NO('ليس هذا الحكم، اقرأ التوضيح.');
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
  for (const id in BAB.TABLETS) if (!L.tab.includes(id) && C[id] && taught(L) >= (MINL[id] || 1) && C[id]()) { L.tab.push(id); L.tq.push(id); P.gold += BAB.TABLETS[id].reward; packReward(S, BAB.TABLETS[id].reward / 100); }
}
/* فترة تمرين بين المراحل: يكرر اللاعب الصفقات الصغيرة (في دولة البداية قبل أول عبور للحدود) ثم يأتي الدرس التالي */
const REST_K = [3, 4, 4, 3, 3, 3, 3, 3, 2], REST_GOLD = { 2: 1500, 3: 2500 };
function restNew(S, n) { const L = S.learn; return { n, k: REST_K[n - 1] || 3, w: 0, home: n <= 3 ? (L.start || S.home) : null, gold: REST_GOLD[n] || 0, infl: n === 3, plan: n === 2 && !!S.player.famDebt && S.player.famDebt.left > 0 }; }
const restDone = (S, rs) => (!rs.infl || S.learn.abroad) && rs.w >= rs.k && S.player.gold >= rs.gold && (!rs.plan || !S.player.famDebt || S.player.famDebt.plan || S.player.famDebt.left <= 0);
function learnCheck(S, silent) {
  if (S.learn && S.learn.ageStages && S.learn.char) return stageCheck(S, silent);
  const L = S.learn; if (!L || !L.char) return; if (!silent) { loreCheck(S); tabletCheck(S); wishCheck(S); }
  if (!L.abroad && L.level >= 4 && homeStatus(S).met) { L.abroad = true; if (!silent) { learnReact(S, 'abroadOpen', 1); news(S, 'فُتح لك السفر إلى بقية الدول', 'good'); } }
  if (L.rest) { if (!restDone(S, L.rest)) return; L.rest = null; learnReact(S, 'restDone', 1); }
  if (!silent && S.player.gold < 60 && !hasCargo(S)) learnReact(S, 'broke', 20);
  while (L.level <= 10) {
    if (L.hold === L.level && L.intro < L.level) break;
    const lv = LS.LEVELS[L.level - 1]; if (!lv.goals(S).every(g => g[1])) break;
    if (!silent) { S.player.gold += lv.reward; const pk = packReward(S, lv.reward / 50); L.up.push(L.level); news(S, 'أتممتَ درس «' + lv.title + '» · +' + lv.reward + ' ريال و' + pk + ' من مؤن السفر', 'good'); S.pause = true; }
    L.level++;
    if (!silent && L.level <= 10) { L.rest = restNew(S, L.level - 1); L.hold = L.level; learnReact(S, 'restStart', 1); break; }
  }
}
/* قفل السفر خارج دولة البداية: يُفتح بعد دروس م1–م3 وزيارة كل أسواق بلدك واكتساب نفوذ فيها (حجم مبيعاتك فيها) */
const INFL_NEED = 2000;
const NEIGHBOR = { sa: 'eg', eg: 'sa', ir: 'in', in: 'ir', cn: 'in' }, ALL_ABROAD_LV = 6; // الدولة المجاورة عند المستوى 4 وبقية الدول عند 6
function homeStatus(S) {
  const L = S.learn, home = (L && L.start) || S.home, ids = S.order.filter(id => S.cities[id].country === home);
  const seen = ids.filter(id => L && L.cv && L.cv[id] > 0).length, infl = ids.reduce((t, id) => t + ((L && L.cs && L.cs[id]) || 0), 0);
  return { home, total: ids.length, seen, infl: Math.round(infl), need: INFL_NEED, met: seen >= ids.length && infl >= INFL_NEED, lessons: !!L && L.level >= 4 };
}
function travelBlock(S, car, dest) {
  if (car && car.main) { const sb = shockBlock(S, car.city, dest); if (sb) return sb; }
  const L = S.learn; if (!L || !L.char || !car || !car.main) return null;
  const home = L.start || S.home, cc = S.cities[dest].country; if (cc === home) return null;
  if (!L.abroad) return 'السفر خارج ' + CD[home].name + ' مقفل الآن: تُفتح الدولة المجاورة عند درس الجمارك (المستوى 4) بعد أن تكوّن ثروتك في أسواق بلدك (زُر كل أسواقها وابلغ نفوذاً ' + INFL_NEED + ' ريال من المبيعات فيها)';
  if (L.level < ALL_ABROAD_LV && cc !== NEIGHBOR[home]) return 'الدولة المجاورة فقط مفتوحة الآن (' + CD[NEIGHBOR[home]].name + '). تُفتح بقية الدول عند درس العملات والصرف (المستوى ' + ALL_ABROAD_LV + ')';
  return null;
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
  L.char = id; if (S.captainAuto == null) S.captainAuto = false; if (!L.ageStages) { L.ageStages = 1; L.stage = L.level; L.stageDone = []; L.stageIntro = 0; L.stageUp = []; L.doneDay = S.day; L.stageProfit0 = (L.ev.profit || 0); } learnPerks(S); learnCountry(S, S.cities[mainCar(S).city].country); loreFix(L); L.cv[mainCar(S).city] = 1;
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


/* مؤن السفر جائزة مع كل مكافأة مهمة: تدعم اللاعب ليختصر انتظار رحلاته */
function packReward(S, n) { const car = S.player.caravans[0], k = Math.max(1, Math.round(n)); car.pack = (car.pack || 0) + k; return k; }
/* ---------- الزكاة (عروض التجارة): تدريب تعليمي مع عمّ سالم ----------
   النصاب 85 غراماً من الذهب بسعر اليوم، الحول 354 يوماً (سنة هجرية)، المقدار 2.5٪.
   الوعاء = السيولة + البضاعة (القوافل والمخازن والطلبات في الطريق) + الودائع والسندات − الديون. الدكاكين والمخازن والعربات والمصانع أصول ثابتة لا زكاة فيها. */
const ZAKAT = { RATE: 0.025, HAWL: 354, NISAB_G: 85, NISAB_AG: 595 };
const zakatNew = () => ({ start: null, last: null, paid: 0, due: false, amount: 0, base: 0, defer: 0, hist: [], herdMode: 'trade', an: null, anLeft: 0 });
/* زكاة بهيمة الأنعام (جدول المختص): السائمة المقتناة للنسل والدر، لا ما يُشترى للبيع (ذاك عروض تجارة). الإبل والبقر والغنم (الضأن والمعز).
   الصغار تُضم إلى أمهاتها إن بلغ الأصل النصاب. يختار اللاعب غرض قطيعه (تجارة أو رعي ونسل). نفترض في «الرعي» أنها ترعى أكثر الحول، وكل رأس مستحَق يُحسب برأس من نوعه (لا أعمار في اللعبة). */
const AN = { camel: { name: 'الإبل', min: 5 }, cow: { name: 'البقر', min: 30 }, sheep: { name: 'الغنم', min: 40 } };
const AN_ITEM = { sheep: 'شاة', makhad: 'بنت مخاض', labun: 'بنت لبون', hiqqa: 'حِقّة', jadha: 'جَذَعة', tabi: 'تَبيع', musinna: 'مُسِنّة' };
const AN_ITEM_SP = { sheep: 'sheep', makhad: 'camel', labun: 'camel', hiqqa: 'camel', jadha: 'camel', tabi: 'cow', musinna: 'cow' };
function anCombo(n, x, y) { let best = null; for (let b = Math.floor(n / y); b >= 0; b--) { const a = Math.floor((n - y * b) / x), r = n - y * b - x * a; if (!best || r < best.r) best = { a, b, r }; } return best; }
function anDue(kind, n) {
  n = Math.floor(n); const one = (k, c) => [{ k, n: c }];
  if (kind === 'camel') {
    if (n < 5) return []; if (n < 10) return one('sheep', 1); if (n < 15) return one('sheep', 2); if (n < 20) return one('sheep', 3); if (n < 25) return one('sheep', 4);
    if (n <= 35) return one('makhad', 1); if (n <= 45) return one('labun', 1); if (n <= 60) return one('hiqqa', 1); if (n <= 75) return one('jadha', 1); if (n <= 90) return one('labun', 2); if (n <= 120) return one('hiqqa', 2);
    const c = anCombo(n, 40, 50); return [{ k: 'labun', n: c.a }, { k: 'hiqqa', n: c.b }].filter(x => x.n > 0);
  }
  if (kind === 'cow') {
    if (n < 30) return []; if (n < 40) return one('tabi', 1); if (n < 60) return one('musinna', 1);
    const c = anCombo(n, 30, 40); return [{ k: 'tabi', n: c.a }, { k: 'musinna', n: c.b }].filter(x => x.n > 0);
  }
  if (n < 40) return []; if (n <= 120) return one('sheep', 1); if (n <= 200) return one('sheep', 2); if (n <= 399) return one('sheep', 3); return one('sheep', Math.floor(n / 100));
}
const anKind = g => { const sp = spOf(g); return sp === 'camel' ? 'camel' : sp === 'cow' || sp === 'buffalo' ? 'cow' : sp === 'sheep' || sp === 'goat' ? 'sheep' : null; };
// أماكن القطعان: القطيع الماشي للقوافل ومزارع اللاعب (بضاعة الحمولة تبقى عروض تجارة دائماً)
function anHerds(S) {
  const out = [], P = S.player;
  P.caravans.forEach(c => out.push(c)); for (const k in P.props) if (P.props[k].farm) out.push(P.props[k].farm);
  return out;
}
function anAssess(S) {
  const cnt = { camel: { a: 0, y: 0 }, cow: { a: 0, y: 0 }, sheep: { a: 0, y: 0 } };
  anHerds(S).forEach(h => { for (const g in (h.herd || {})) { const k = anKind(g); if (!k) continue; cnt[k].a += h.herd[g] || 0; cnt[k].y += youngOf(h, g); } });
  const rows = []; let any = false;
  for (const k of ['camel', 'cow', 'sheep']) {
    const a = Math.floor(cnt[k].a), y = Math.floor(cnt[k].y); if (a + y < 1) continue;
    const total = a >= AN[k].min ? a + y : a, due = a >= AN[k].min ? anDue(k, total) : [];
    rows.push({ kind: k, name: AN[k].name, adults: a, young: y, n: total, min: AN[k].min, due }); if (due.length) any = true;
  }
  return { rows, any };
}
function anExcluded(S) { // قيمة قطعان الأنعام الثلاثة (بالسعر المتوسط) لتُستبعد من وعاء التجارة حين تُزكّى زكاة أنعام
  let c = 0, f = 0; const P = S.player;
  P.caravans.forEach(car => { for (const g in (car.herd || {})) if (anKind(g)) c += ((car.herd[g] || 0) + YOUNG_VAL * youngOf(car, g)) * mid(g); });
  for (const k in P.props) { const fm = P.props[k].farm; if (fm) for (const g in (fm.herd || {})) if (anKind(g)) f += ((fm.herd[g] || 0) + YOUNG_VAL * (((fm.hx || {})[g] || {}).y || 0)) * mid(g); }
  return { c, f };
}
function anPrice(S, item) { const car = mainCar(S), c = S.cities[car.city]; return unitPrice(c, AN_ITEM_SP[item]); }
function anItems(S, due) { const out = []; due.forEach(r => r.due.forEach(x => out.push({ kind: r.kind, k: x.k, label: AN_ITEM[x.k], n: x.n }))); return out; }
// أخذ رؤوس من القطعان عيناً: يُرجع عدد ما أُخذ فعلاً
function anTake(S, sp, n) {
  let took = 0;
  anHerds(S).forEach(h => { for (const g in (h.herd || {})) { if (took >= n) return; const k = anKind(g); if (!k || (sp === 'sheep' ? k !== 'sheep' : k !== sp)) continue; const t = Math.min(n - took, Math.floor(h.herd[g] || 0)); if (t > 0) { const b0 = h.herd[g]; h.herd[g] -= t; herdScale(h, g, b0); took += t; } } });
  return took;
}
function zakatBase(S) {
  const P = S.player, w = P.wallet, r = { cash: w.sar + w.usd * S.fx.usd + w.au * S.fx.gold + (w.ag || 0) * rateOf(S, 'ag') + (P.vault || 0), goods: 0, store: 0, orders: 0, deposits: 0, bonds: 0, debts: 0 };
  P.caravans.forEach(c => { r.goods += valueOf(holdings(c)); });
  for (const k in P.props) r.store += valueOf(P.props[k].store) + (P.props[k].farm ? valueOf(farmHold(P.props[k].farm)) : 0);
  (S.orders || []).forEach(o => { r.orders += o.cost || 0; });
  for (const k in P.bank.dep) r.deposits += P.bank.dep[k];
  P.bank.bonds.forEach(b => { r.bonds += b.amt; });
  P.bank.loans.forEach(l => { r.debts += l.amt; }); if (P.famDebt) r.debts += P.famDebt.left;
  r.an = anAssess(S);
  if (S.zakat && S.zakat.herdMode === 'sawm') { const ex = anExcluded(S); r.goods = Math.max(0, r.goods - ex.c); r.store = Math.max(0, r.store - ex.f); r.exHerd = Math.round(ex.c + ex.f); }
  r.base = Math.max(0, r.cash + r.goods + r.store + r.orders + r.deposits + r.bonds - r.debts);
  r.nisab = ZAKAT.NISAB_G * S.fx.gold; r.nisabAg = ZAKAT.NISAB_AG * rateOf(S, 'ag'); r.rate = ZAKAT.RATE; r.met = r.base >= r.nisab; r.amount = Math.round(r.base * ZAKAT.RATE);
  return r;
}
function zakatFinish(S) {
  const Z = S.zakat, b = zakatBase(S); Z.hist.unshift({ day: S.day, base: Z.base, due: Math.round(Z.base * ZAKAT.RATE), paid: Math.round(Z.base * ZAKAT.RATE), note: 'paid' }); if (Z.hist.length > 12) Z.hist.pop();
  if (!Z.dfr && Z.start != null && S.day - Z.start <= hawlLen(S, Z.start) + 3) achFlag(S, 'zakat_on_time'); Z.dfr = 0;
  Z.last = S.day; Z.due = false; Z.defer = 0; Z.part = false; Z.an = null; Z.anLeft = 0; Z.start = (b.met || (Z.herdMode === 'sawm' && b.an.any)) ? S.day : null; Z.paidN = (Z.paidN || 0) + 1;
  return OK('تقبّل الله منك! أخرجتَ زكاة مالك كاملة، وبدأ حول جديد');
}
function zakatAnSnap(S, b) { const Z = S.zakat; Z.an = Z.herdMode === 'sawm' && b.an.any ? b.an.rows.filter(r => r.due.length).map(r => ({ kind: r.kind, name: r.name, n: r.n, due: r.due })) : null; Z.anLeft = Z.an ? anItems(S, Z.an).reduce((t, x) => t + x.n, 0) : 0; }
function zakatDay(S) {
  const Z = S.zakat; if (!Z || !S.learn || !S.learn.char) return;
  const b = zakatBase(S);
  const anOn = Z.herdMode === 'sawm' && b.an.any;
  if (Z.start == null) { if (b.met || anOn) { Z.start = S.day; learnReact(S, 'nisab'); } return; }
  if (Z.due) { if (Z.defer && S.day >= Z.defer) learnReact(S, 'zakatLate', 7); return; }
  const age = S.day - Z.start;
  const hawl = hawlLen(S, Z.start);
  if (age >= hawl) {
    if (b.met || anOn) { Z.due = true; Z.amount = b.met ? b.amount : 0; Z.base = Math.round(b.base); Z.defer = 0; Z.part = false; zakatAnSnap(S, b); learnReact(S, 'zakatDue'); S.pause = true; }
    else { Z.hist.unshift({ day: S.day, base: Math.round(b.base), due: 0, paid: 0, note: 'below' }); if (Z.hist.length > 12) Z.hist.pop(); Z.start = null; }
  } else if (hawl - age === 30) learnReact(S, 'zakatSoon');
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

/* معاينة وتنفيذ بيع الدكان والمخزن؛ المعاينة تعمل على نسخة معزولة. */
const ASSET_SALE_FACTORS = { calm: 0.80, distressed: 0.65 };
function assetBaseQuote(S, city, kind, id, fixedFactor) {
  const c = S.cities[city], P = S.player, pr = P.props[city];
  const no = msg => ({ ok: false, msg });
  if (!c || !pr) return no('لا ممتلكات في هذه المدينة.');
  if (!['shop', 'warehouse', 'farm', 'butcher', 'factory', 'lease', 'close'].includes(kind)) return no('هذا النوع غير متاح في هذه الدفعة.');
  let target = null, value = 0;
  if (kind === 'shop') {
    target = pr.shops.find(sh => sh.id === id);
    if (!target || shKind(target) !== 'own') return no('اختر دكاناً مملوكاً لك؛ فالعقار المستأجر لا يصح بيعه شرعاً ولا نظاماً.');
    if (target.endowed || lifeBooks(S).some(w => w.city === city && w.shop === id)) return no('هذا الأصل غير متاح للبيع.');
    value = 1000; // قيمة الدكان الحالية فيnetWorth، لا ثمن إعادة بنائه.
  } else if(kind==='lease'){
    target=pr.shops.find(sh=>sh.id===id&&shKind(sh)!=='own');if(!target)return no('لا إيجار قائم لهذا المكان.');value=0;
  } else if(kind==='close'){
    if(pr.shops.length||pr.whs||pr.farm||pr.butcher||P.factories.some(f=>f.city===city))return no('توجد أصول تحتاج تصفية أولاً.');value=0;
  } else if(kind==='farm'||kind==='butcher') {
    target=pr[kind];if(!target)return no('لا أصل من هذا النوع هنا.');
    value=kind==='farm'?2500*target.level:BUTCHER_COST*0.6;
  } else if(kind==='factory') {
    target=P.factories.find(f=>f.city===city&&f.id===id);if(!target)return no('اختر مصنعاً تملكه في هذه المدينة.');value=factoryValue(target);
  } else {
    if (!(pr.whs > 0)) return no('لا مخزن تملكه هنا.');
    value = 800; // قيمة وحدة المخزن الحالية فيnetWorth.
  }
  const main = P.caravans.find(car => car.main) || P.caravans[0];
  if (main && main.left > 0) return no('انتظر وصول قافلتك الرئيسية قبل بيع الأصل.');
  if ((S.orders || []).some(order => order.from === city || order.to === city)) return no('أكمل عقد التوصيل المرتبط بهذه المدينة أولاً.');
  const dues = S.paymentDues || [], debt = bankDebt(S) > 0 || famDebtOn(S) || dues.some(d => d.amount > 0);
  const stranded = P.gold <= 150 && main && valueOf(holdings(main)) < 1 && passivePerDay(S) <= 0;
  const factor = fixedFactor == null ? ASSET_SALE_FACTORS[debt || stranded ? 'distressed' : 'calm'] : fixedFactor, mode = factor===ASSET_SALE_FACTORS.distressed?'distressed':'calm', price = Math.floor(value * factor);
  const remainingShops = pr.shops.filter(sh => sh !== target);
  const removedWarehouses = kind === 'warehouse' ? 1 : Math.max(0, pr.whs - remainingShops.length);
  const remainingWarehouses = pr.whs - removedWarehouses;
  const capacityAfter = remainingWarehouses * WH_CAP + remainingShops.reduce((sum, sh) => sum + shCap(sh), 0);
  const rentDues = kind === 'shop'||kind==='lease' ? dues.filter(d => d.id === target.paymentDue && d.kind === 'rent') : [];
  const accompanyingValue=(kind==='shop'||kind==='lease')?removedWarehouses*800:kind==='farm'&&pr.butcher?BUTCHER_COST*.6:0;
  return { ok: true, city, kind, accompanyingValue, id: target && target.id != null ? target.id : null, value, factor, mode, price,
    // مخازن ملازمة لبيع الدكان تُعرض منفصلة، ولا تختفي بلا ثمن.
    accompanyingWarehouses: removedWarehouses - (kind === 'warehouse' ? 1 : 0),
    accompanyingPrice: Math.floor(accompanyingValue*factor),
    accompanyingButcher:kind==='farm'&&!!pr.butcher,
    capacityAfter, load: storeLoad(S, city),
    sharedStore: Object.entries(pr.store).filter(([, q]) => q > 0).map(([g, q]) => ({ g, q })),
    knownRentArrears: rentDues.reduce((sum, d) => sum + d.amount, 0),
    unknownRentArrears: !!(target && target.arrears && (!rentDues.length || rentDues.some(d => d.unknownPast))),
    note: 'تسعير الأصل فقط؛ صافي تصفية البضائع وأجور العاملين يُحسب قبل تنفيذ البيع.' };
}
function assetSaleWorkers(S, q) {
  const pr = S.player.props[q.city], fired = [];
  for (const role of q.kind==='farm'||q.kind==='close'?['seller','keeper','farmer']:['seller','keeper']) {
    let covered = 0;
    const need = role === 'seller' ? sellerNeed(S, q.city) : role==='farmer'?farmerNeed(S,q.city):keeperNeed(S, q.city);
    const workers = (pr.staff || []).filter(w => w.role === role).sort((a,b) => wkLv(b)-wkLv(a) || a.id-b.id);
    for (const w of workers) {
      if (covered >= need) fired.push(w);
      else covered += role === 'seller' ? WK.seller.pts[wkLv(w)] * (w.late ? 0.5 : 1) : w.late ? 0 : 1;
    }
  }
  return fired;
}
function assetStockFraction(S, c, pr, g, amount, qualityOverride) {
  const quality = qualityOverride == null ? qualOf(pr.basis, g) : qualityOverride, integer = Math.floor(amount), r = sellUnits(S, S.player, c, g, integer, pr.store, true, quality, 'asset');
  let net = r.net, quantity = r.n;
  const fraction = Math.min(amount-integer, pr.store[g] || 0);
  if (fraction > 1e-9) {
    const gross = unitPrice(c,g) * quality * fraction, tax = gross * taxRate(S,c,true);
    pr.store[g] -= fraction; c.stock[g] = Math.min(c.stock[g] + fraction, capG(c,g)*1.2);
    S.player.gold += gross-tax; net += gross-tax; quantity += fraction;
    sink(S,'tax',tax); S.player.led.inc.sales=(S.player.led.inc.sales||0)+gross; S.player.led.exp.tax=(S.player.led.exp.tax||0)+tax;
    const boss=bossOf(S,c.id);if(boss)boss.dsales+=gross;
    if(rulerMine(S,c)){const share=tax*.2;S.player.gold+=share;S.player.led.inc.governor=(S.player.led.inc.governor||0)+share;fauc(S,'governor',share);}
  }
  const cost=takeBasis(pr.basis || (pr.basis={}),g,quantity);
  logTrade(S,c.id,g,quantity,'sell',net,net-cost,'asset');
  return { g, q: quantity, net };
}
function assetSaleApply(S, q) {
  const P=S.player, pr=P.props[q.city], c=S.cities[q.city], previousCurrency=S.ctxCur;
  const start=P.wallet.sar, propertyPrice=q.price+q.accompanyingPrice;
  S.ctxCur='sar';P.wallet.sar+=propertyPrice;
  const load=q.load, fraction=load>0?Math.max(0,Math.min(1,(load-q.capacityAfter)/load)):0, goods=[];
  for(const {g,q:quantity} of q.sharedStore)if(fraction>0)goods.push(assetStockFraction(S,c,pr,g,quantity*fraction));
  const livestock=[];let livestockCar=null;
  if(q.kind==='farm'){
    const f=pr.farm,animalResult=assetFarmAnimals(S,q,f,pr);if(!animalResult.ok){S.ctxCur=previousCurrency;return animalResult;}livestock.push(...animalResult.livestock);livestockCar=animalResult.carId;
    for(const [g,amount] of Object.entries(f.acc||{}))if(amount>0&&GD[g])goods.push(assetStockFraction(S,c,{store:{[g]:amount},basis:{}},g,amount));
  }
  const target=q.kind==='factory'?P.factories.find(f=>f.id===q.id&&f.city===q.city):q.kind==='farm'||q.kind==='butcher'?pr[q.kind]:null;
  if(q.kind==='factory'&&target.acc>0){const g=RECIPES[target.recipe].out;goods.push(assetStockFraction(S,c,{store:{[g]:target.acc},basis:{[g]:{q:target.acc,c:target.accCost||0}}},g,target.acc,factoryQual(S,target)));}
  const shop=q.kind==='shop'||q.kind==='lease'?pr.shops.find(sh=>sh.id===q.id):null;
  if(shop)pr.shops=pr.shops.filter(sh=>sh!==shop);
  pr.whs-=q.kind==='warehouse'?1:q.accompanyingWarehouses;
  if(q.kind==='farm'){pr.farm=null;if(q.accompanyingButcher)pr.butcher=null;}
  if(q.kind==='butcher')pr.butcher=null;
  if(q.kind==='factory')P.factories=P.factories.filter(f=>f!==target);
  const fired=assetSaleWorkers(S,q), targets=fired.concat(shop?[shop]:target?[target]:[]);
  const empty=!pr.shops.length&&!pr.whs&&!pr.farm&&!pr.butcher&&!P.factories.some(f=>f.city===q.city);
  if(empty&&pr.mgr)targets.push(pr.mgr);
  const dues=(S.paymentDues||[]).filter(d=>targets.some(t=>t.paymentDue===d.id));
  const unknown=targets.some(t=>(t.late||t.arrears)&&!dues.some(d=>d.id===t.paymentDue))||dues.some(d=>d.unknownPast);
  if(unknown){S.ctxCur=previousCurrency;return NO('يرجى التحقق من أداء أي مستحقات قديمة غير مقيدة قبل إتمام البيع.');}
  const owed=dues.reduce((sum,d)=>sum+d.amount,0);
  if(P.wallet.sar+1e-9<owed){S.ctxCur=previousCurrency;return NO('الثمن ورصيد الريال لا يكفيان للمستحقات المسجلة: '+owed.toFixed(2)+' ريال.');}
  for(const due of dues){const paid=pPay(S,due.cat,due.amount,true);if(shop&&due.id===shop.paymentDue)shop.rentPaid=(shop.rentPaid||0)+paid;}
  const paidIds=new Set(dues.map(d=>d.id));if(S.paymentDues)S.paymentDues=S.paymentDues.filter(d=>!paidIds.has(d.id));
  pr.staff=(pr.staff||[]).filter(w=>!fired.includes(w));if(empty){pr.mgr=null;pr.ins=null;}
  P.led.inc.assets=(P.led.inc.assets||0)+propertyPrice;fauc(S,'assetSale',propertyPrice);
  const result={ok:true,propertyPrice,goods,livestock,livestockCar,goodsNet:P.wallet.sar-start-propertyPrice+owed,duesPaid:owed,staffFired:fired.map(w=>w.id),net:P.wallet.sar-start};
  const history=P.sold||(P.sold=[]);if(q.kind!=='close'||goods.length||owed||fired.length)history.unshift({day:S.day,city:q.city,kind:q.kind,id:q.id,label:q.kind==='lease'?'إنهاء إيجار':q.kind==='close'?'إغلاق إدارة المدينة':'بيع أصل',propertyPrice,goodsNet:result.goodsNet,duesPaid:owed,net:result.net});if(history.length>30)history.pop();
  S.ctxCur=previousCurrency;return result;
}
function assetQuote(S, city, kind, id, options = {}) {
  if(!options||!['sell','keep'].includes(options.livestock||'sell'))return NO('اختر بيع المواشي أو الاحتفاظ بها.');
  if(kind!=='farm'&&options.livestock==='keep')return NO('خيار الاحتفاظ بالمواشي خاص ببيع المزرعة.');
  const base=assetBaseQuote(S,city,kind,id);if(!base.ok)return base;
  base.livestockMode=options.livestock||'sell';base.carId=options.carId;
  const copy=JSON.parse(save(S));attachWallet(copy);
  const result=assetSaleApply(copy,base);
  return result.ok?Object.assign({},base,result,{note:'صافي البيع يشمل السلع والأنعام المباعة بعد تسوية المستحقات؛ ويبقى المخزون الذي تستوعبه المدينة، ولا يُسدّد دَين الجد تلقائياً.'}):Object.assign({},base,{ok:false,msg:result.msg});
}
function sellAsset(S, city, kind, id, options) {
  const q=assetQuote(S,city,kind,id,options);if(!q.ok)return NO(q.msg);
  const result=assetSaleApply(S,q);
  return Object.assign(result,{msg:'تم بيع الأصل؛ تغير رصيد الريال بمقدار '+result.net.toFixed(2)+' ريال بعد تسوية المستحقات.'});
}
function assetFarmAnimals(S,q,f,pr){
 const keys=Array.from(new Set([...Object.keys(f.herd||{}),...Object.keys(f.hx||{})])),livestock=[];
 if(q.livestockMode==='keep'){
  const car=q.carId==null?(S.player.caravans.find(c=>c.main)||S.player.caravans[0]):S.player.caravans.find(c=>c.id===q.carId);
  if(!car||car.left>0||car.city!==q.city)return NO('لنقل المواشي يجب أن تكون القافلة المختارة واقفة في المدينة.');
  const projected={...car,herd:{...(car.herd||{})},hx:{...(car.hx||{})}};
  for(const g of keys){const adult=f.herd[g]||0,young=youngOf(f,g);if(!(adult>0||young>0))continue;
   if(!(GD[g]&&GD[g].hu>0))return NO('نقل المزرعة كاملة للقطيع لا يشمل الدواجن؛ انقلها أو بعها أولاً من المزرعة.');
   if((car.herd||{})[g]>0||(car.cargo||{})[g]>0||youngOf(car,g)>0)return NO('انقل أو بع الصنف الموجود في القافلة أولاً، للمحافظة على أنساب القطيع دون دمج.');
   projected.herd[g]=adult;projected.hx[g]=JSON.parse(JSON.stringify(hxOf(f,g)));
  }
  if(herdUnits(projected)>herdCap(car)+1e-9)return NO('سعة القطيع لا تكفي لنقل جميع المواشي وصغارها؛ زد الرعاة أو اختر البيع.');
  car.herd=projected.herd;car.hx=projected.hx;
  for(const g of keys){const adult=f.herd[g]||0,young=youngOf(f,g);if(!(adult>0||young>0))continue;
   const cost=takeBasis(pr.basis||(pr.basis={}),g,adult);addBasis(car.basis||(car.basis={}),g,adult,cost);
   if(f.pair&&f.pair[g])(car.pair||(car.pair={}))[g]=f.pair[g];
   livestock.push({g,adult,young,mode:'keep'});
  }
  return {ok:true,livestock,carId:car.id};
 }
 const c=S.cities[q.city];
 for(const g of keys){
  const adult=f.herd[g]||0,young=youngOf(f,g);
  if(adult>0){const r=assetStockFraction(S,c,{store:{[g]:adult},basis:pr.basis||(pr.basis={})},g,adult,pedMulOf(f,g));livestock.push({...r,age:'adult',mode:'sell'});}
  if(young>0){const x=hxOf(f,g),quality=YOUNG_SELL*(spOf(g)==='horse'?pedMul(x.yq||1):1)*hyPf(f,g);const r=assetStockFraction(S,c,{store:{[g]:young},basis:{}},g,young,quality);livestock.push({...r,age:'young',mode:'sell'});}
 }
 return {ok:true,livestock,carId:null};
}
/* خطة التصفية تُنفَّذ على نسخة كاملة أولاً؛ لا بيع جزئي في الحالة الحية. */
const CITY_DUE_KINDS = ['rent','staff','manager','factory'];
function citySaleTargets(S, city) {
 const pr=S.player.props[city];if(!pr)return [];
 const rows=S.player.factories.filter(f=>f.city===city).map(f=>({kind:'factory',id:f.id,name:RECIPES[f.recipe].name}));
 if(pr.farm)rows.push({kind:'farm',id:null,name:'المزرعة'+(pr.butcher?' وملحمتها':'')});
 else if(pr.butcher)rows.push({kind:'butcher',id:null,name:'الملحمة'});
 for(let i=0;i<pr.whs;i++)rows.push({kind:'warehouse',id:null,name:'المخزن '+(i+1)});
 pr.shops.forEach((sh,i)=>rows.push({kind:shKind(sh)==='own'?'shop':'lease',id:sh.id,name:shKind(sh)==='own'?'الدكان '+(i+1):'إنهاء إيجار '+(shKind(sh)==='stall'?'البسطة ':'الدكان ')+(i+1)}));
 rows.push({kind:'close',id:null,name:'تصفية المخزون وإغلاق الإدارة'});
 return rows;
}
function prepareCityAssetSale(S,city,options={}){
 const no=msg=>({quote:NO(msg)}),pr=S.player.props[city];
 if(!S.cities[city]||!pr)return no('لا ممتلكات أو إدارة مسجلة في هذه المدينة.');
 if(!Number.isFinite(S.player.wallet.sar)||S.player.wallet.sar<0)return no('رصيد الريال غير صالح؛ راجع بيانات الحفظ قبل التصفية.');
 if(S.awayJob||S.awaySim)return no('انتظر انتهاء حساب الغياب قبل التصفية.');
 if(!options||!['sell','keep'].includes(options.livestock||'sell'))return no('اختر بيع المواشي أو الاحتفاظ بها.');
 const related=(S.paymentDues||[]).filter(d=>d.city===city&&CITY_DUE_KINDS.includes(d.kind));
 if(related.some(d=>!Number.isFinite(d.amount)||d.amount<0||d.unknownPast))return no('رصيد متأخر قديم غير مسجل بالكامل: للتأكد قبل التصفية.');
 const plan=citySaleTargets(S,city);
 if(plan.length===1&&storeLoad(S,city)<=1e-9&&!(pr.staff||[]).length&&!pr.mgr&&!pr.ins&&!related.some(d=>d.amount>0))return no('لا أصول أو مستحقات تحتاج تصفية هنا.');
 const first=assetBaseQuote(S,city,plan[0].kind,plan[0].id);if(!first.ok)return {quote:first};
 const copy=JSON.parse(save(S));attachWallet(copy);
 const P=copy.player,start=P.wallet.sar,factor=first.factor,bridge=related.reduce((sum,d)=>sum+d.amount,0);
 // رصيد محاسبي مؤقت داخل النسخة فقط؛ يقابله التزام بالقيمة نفسها حتى لا يغيّر صافي الثروة أو الضريبة.
 if(!Number.isFinite(bridge))return no('تعذر حساب المستحقات المسجلة؛ راجع بيانات الحفظ.');
 const reserve={amt:bridge,type:'assetSettlementReserve'};
 if(bridge>0){P.wallet.sar+=bridge;P.bank.loans.push(reserve);}
 const items=[],goods=[],livestock=[],staffFired=[];let value=0,propertyPrice=0,duesPaid=0,accompanyingButcher=false;
 for(const entry of plan){
  const q=assetBaseQuote(copy,city,entry.kind,entry.id,factor);
  if(!q.ok)return no(entry.name+': '+q.msg);
  q.livestockMode=entry.kind==='farm'?(options.livestock||'sell'):'sell';q.carId=options.carId;
  const closingOffice=entry.kind==='close'&&!!(copy.player.props[city].mgr||copy.player.props[city].ins);
  const result=assetSaleApply(copy,q);
  if(!result.ok)return no(entry.name+': '+result.msg);
  value+=q.value+q.accompanyingValue;propertyPrice+=result.propertyPrice;duesPaid+=result.duesPaid;
  goods.push(...result.goods);livestock.push(...result.livestock);staffFired.push(...result.staffFired);accompanyingButcher ||= q.accompanyingButcher;
  if(entry.kind!=='close'||result.goods.length||result.duesPaid||result.staffFired.length||closingOffice)items.push({...entry,propertyPrice:result.propertyPrice,duesPaid:result.duesPaid,net:result.net});
 }
 // المطالبات التاريخية المعروفة للعاملين الذين غادروا لا تسقط بمغادرة المدينة.
 const remaining=(copy.paymentDues||[]).filter(d=>d.city===city&&CITY_DUE_KINDS.includes(d.kind));
 copy.ctxCur='sar';
 for(const due of remaining){duesPaid+=pPay(copy,due.cat,due.amount,true);}
 const paidIds=new Set(remaining.map(d=>d.id));if(copy.paymentDues)copy.paymentDues=copy.paymentDues.filter(d=>!paidIds.has(d.id));
 if(bridge>0){P.wallet.sar-=bridge;P.bank.loans=P.bank.loans.filter(l=>l!==reserve);}
 if(![P.wallet.sar,value,propertyPrice,duesPaid].every(Number.isFinite))return no('تعذر حساب قيم التصفية؛ راجع بيانات الحفظ.');
 if(P.wallet.sar < -1e-7)return no('حصيلة البيع ورصيد الريال لا يكفيان لكل المستحقات؛ لا يُباع أي أصل.');
 if(P.wallet.sar<0)P.wallet.sar=0;
 const net=P.wallet.sar-start;
 const history=P.sold||(P.sold=[]);history.unshift({day:S.day,city,kind:'city',label:'تصفية مدينة',propertyPrice,goodsNet:net+duesPaid-propertyPrice,duesPaid,net,itemCount:items.length});if(history.length>30)history.length=30;
 const quote={ok:true,city,kind:'city',id:null,value,factor,mode:first.mode,price:propertyPrice,propertyPrice,accompanyingPrice:0,accompanyingWarehouses:0,accompanyingButcher:false,includesButcher:accompanyingButcher,
  goods,livestock,items,duesPaid,staffFired:[...new Set(staffFired)],goodsNet:net+duesPaid-propertyPrice,net,
  managerReleased:!!pr.mgr,insuranceStopped:!!pr.ins,livestockCar:options.livestock==='keep'?(options.carId==null?(P.caravans.find(c=>c.main)||P.caravans[0]).id:options.carId):null,
  note:'تصفية كل أصول المدينة وإيجاراتها، مع بقاء القافلة والقروض الشخصية ودَين الجدّ.'};
 return {quote,state:copy};
}
function cityAssetQuote(S,city,options){return prepareCityAssetSale(S,city,options).quote;}
function sellCityAssets(S,city,options){
 const prepared=prepareCityAssetSale(S,city,options);if(!prepared.quote.ok)return prepared.quote;
 // اعتماد النسخة المكتملة دفعة واحدة، ثم ربط محفظة الذهب بالجذر الحي مجدداً.
 for(const key of Object.keys(S))delete S[key];Object.assign(S,prepared.state);attachWallet(S);
 return {...prepared.quote,msg:'تمت تصفية أصول '+S.cities[city].name+'؛ تغير رصيد الريال بمقدار '+prepared.quote.net.toFixed(2)+' ريال.'};
}
/* بداية اختيارية للتجارة، لا لعبة جديدة: كل التصفية في نسخة قبل اعتمادها. */
function prepareTradeRestart(S) {
 const no=msg=>({quote:NO(msg)}),P=S.player,main=P.caravans.find(c=>c.main)||P.caravans[0];
 if(!main||!S.cities[main.city])return no('لا قافلة رئيسية صالحة لإعادة البداية.');
 if(P.caravans.some(c=>c.left>0||c.sea)||(P.ships||[]).some(s=>!s.city))return no('انتظر وصول كل القوافل والسفن قبل التصفية الشاملة.');
 if(S.awayJob||S.awaySim||S.road||S.life?.pending||S.story?.cur)return no('أكمل الحدث أو حساب الغياب قبل التصفية الشاملة.');
 if((S.orders||[]).length)return no('أكمل عقود التوصيل قبل التصفية الشاملة.');
 if(P.bank.bonds.length)return no('انتظر استحقاق الصكوك؛ لا يوجد لها بيع مبكر في نظام اللعبة.');
 if(Object.values(S.cities).some(c=>c.owner==='player'||bossOf(S,c.id)?.ruler==='player'))return no('ملكية المدن وحكم الأسواق غير قابلين للتصفية هنا؛ لا تتغير ملكيتهما.');
 const dues=S.paymentDues||[];
 if(dues.some(d=>!Number.isFinite(d.amount)||d.amount<0||d.unknownPast||!PAYMENT_CATS.includes(d.cat)||!['caravan','ship',...CITY_DUE_KINDS].includes(d.kind)))return no('المستحقات غير مقيدة بالكامل: للتأكد قبل التصفية الشاملة.');
 const fleet=[...P.caravans,...(P.ships||[])];
 if(fleet.some(c=>(c.late||c.arrears)&&!dues.some(d=>d.id===c.paymentDue)))return no('متأخر قديم للطاقم غير مقيد: للتأكد قبل التصفية الشاملة.');
 if(!Object.values(P.wallet).every(n=>Number.isFinite(n)&&n>=0)||!Object.values(P.bank.dep).every(n=>Number.isFinite(n)&&n>=0))return no('رصيد غير صالح؛ راجع بيانات الحفظ قبل التصفية.');
 if(P.factories.some(f=>!P.props[f.city]))return no('بيانات مدينة المصنع ناقصة؛ للتأكد قبل التصفية.');
 const validStock=st=>Object.entries(st||{}).every(([g,n])=>GD[g]&&Number.isFinite(n)&&n>=0);
 for(const c of P.caravans)if(!S.cities[c.city]||!validStock(c.cargo)||!validStock(c.herd))return no('بيانات حمولة قافلة غير صالحة؛ راجع الحفظ.');
 for(const [city,pr]of Object.entries(P.props))if(!S.cities[city]||!validStock(pr.store))return no('بيانات مخزون مدينة غير صالحة؛ راجع الحفظ.');
 const debt=bankDebt(S)>0||famDebtOn(S)||dues.some(d=>d.amount>0),stranded=P.gold<=150&&valueOf(holdings(main))<1&&passivePerDay(S)<=0;
 const factor=ASSET_SALE_FACTORS[debt||stranded?'distressed':'calm'],start=P.wallet.sar;
 const T=JSON.parse(save(S));attachWallet(T);T.ctxCur='sar';
 const bridge=dues.reduce((n,d)=>n+d.amount,0);if(!Number.isFinite(bridge))return no('تعذر جمع المستحقات.');
 let reserveId='restartSettlement';while(T.player.bank.loans.some(l=>l.id===reserveId))reserveId+='-';
 // يقابل الاحتياطي التزام مساوٍ داخل النسخة فقط؛ تبقى الثروة والضريبة كما هما.
 if(bridge>0){T.player.wallet.sar+=bridge;T.player.bank.loans.push({id:reserveId,amt:bridge,type:'assetSettlementReserve'});}
 const items=[],goods=[],livestock=[];let assetProceeds=0,duesPaid=0,investmentReturn=0,investmentFees=0;
 for(const city of Object.keys(T.player.props))for(const entry of citySaleTargets(T,city)){
  const q=assetBaseQuote(T,city,entry.kind,entry.id,factor);if(!q.ok)return no(S.cities[city].name+': '+q.msg);
  q.livestockMode='sell';const office=entry.kind==='close'&&!!(T.player.props[city].mgr||T.player.props[city].ins),r=assetSaleApply(T,q);if(!r.ok)return no(S.cities[city].name+': '+r.msg);
  assetProceeds+=r.propertyPrice;duesPaid+=r.duesPaid;
  goods.push(...r.goods.map(g=>({...g,city})));livestock.push(...r.livestock.map(g=>({...g,city})));
  if(entry.kind!=='close'||r.goods.length||r.duesPaid||r.staffFired.length||office)items.push({...entry,city,price:r.propertyPrice,duesPaid:r.duesPaid});
 }
 for(const car of T.player.caravans){
  const c=T.cities[car.city];
  for(const [g,n]of Object.entries(car.cargo))if(n>0)goods.push({...assetStockFraction(T,c,{store:car.cargo,basis:car.basis},g,n),city:car.city,carId:car.id});
  const animals=assetFarmAnimals(T,{city:car.city,livestockMode:'sell'},car,{basis:car.basis});if(!animals.ok)return no(animals.msg);
  livestock.push(...animals.livestock.map(g=>({...g,city:car.city,carId:car.id})));
  car.cargo={};car.herd={};car.basis={};car.hx={};car.cx={};car.pair={};car.route=null;
  if(car.id!==main.id){
   // قيمة العربة الحالية300فيnetWorth؛ رسوم تعيين العامل والحارس ليست أصلاً يباع.
   let price=Math.floor(car.carts*300*factor),mountPrice=0;
   if(car.mount){const mount=mountOf(car);if(!mount)return no('نوع مركب غير معروف؛ للتأكد قبل التصفية.');mountPrice=Math.round(mount.cost*.6);}
   price+=mountPrice;T.player.wallet.sar+=price;assetProceeds+=price;T.player.led.inc.assets=(T.player.led.inc.assets||0)+price;fauc(T,'assetSale',price);
   items.push({kind:'caravan',id:car.id,city:car.city,name:car.name,price,mountPrice,duesPaid:0});
  }
 }
 for(const sh of T.player.ships||[]){
  const type=SHIPS[sh.type];if(!type||!T.cities[sh.city])return no('بيانات سفينة غير صالحة؛ للتأكد قبل التصفية.');
  const price=Math.round(type.cost*SEA.sellBack);T.player.wallet.sar+=price;assetProceeds+=price;T.player.led.inc.assets=(T.player.led.inc.assets||0)+price;fauc(T,'assetSale',price);
  items.push({kind:'ship',id:sh.id,city:sh.city,name:sh.name,price,duesPaid:0});
 }
 for(const [city,amount]of Object.entries(T.player.bank.dep))if(amount>0){
  if(!T.cities[city])return no('مدينة مضاربة غير معروفة؛ للتأكد قبل التصفية.');
  const r=A.divest(T,city,amount);if(!r.ok)return no(r.msg);
  const fee=amount*FIN.mud.fee,net=amount-fee;investmentReturn+=net;investmentFees+=fee;items.push({kind:'investment',city,name:'سحب المضاربة',price:net,fee});
 }
 // يشمل أيضاً مطالبات موظف أو طاقم غادر سابقاً؛ لا تسقط بالتصفية.
 for(const due of T.paymentDues||[]){
  const paid=pPay(T,due.cat,due.amount,true);duesPaid+=paid;if(paid+1e-7<due.amount)return no('الحصيلة لا تكفي لكل المستحقات؛ لا يُباع أي أصل.');
 }
 if(bridge>0){T.player.wallet.sar-=bridge;T.player.bank.loans=T.player.bank.loans.filter(l=>l.id!==reserveId);}
 const cash=T.player.wallet.sar;
 if(![cash,assetProceeds,duesPaid,investmentReturn,investmentFees].every(Number.isFinite)||cash < -1e-7)return no('الحصيلة ورصيد الريال لا يكفيان للمستحقات؛ لا يُباع أي أصل.');
 if(!items.length&&!goods.length&&!livestock.length&&!duesPaid&&S.phase===1)return no('لا أصول تحتاج تصفية أو طور يحتاج إعادة بداية.');
 T.player.wallet.sar=Math.max(0,cash);T.paymentDues=[];
 const kept=T.player.caravans.find(c=>c.id===main.id);kept.main=true;kept.late=0;kept.arrears=0;delete kept.paymentDue;
 T.player.caravans=[kept];T.player.ships=[];T.captainAuto=false;delete T.away;
 T.phase=1;T.pause=true;
 const net=T.player.wallet.sar-start,goodsNet=net+duesPaid-assetProceeds-investmentReturn;
 const history=T.player.sold||(T.player.sold=[]);history.unshift({day:S.day,kind:'restart',label:'تصفية وبداية جديدة',propertyPrice:assetProceeds,goodsNet,duesPaid,net,itemCount:items.length});history.length=Math.min(30,history.length);
 const quote={ok:true,kind:'restart',factor,items,goods,livestock,assetProceeds,goodsNet,investmentReturn,investmentFees,duesPaid,net,cashAfter:T.player.wallet.sar,phaseAfter:1,
  retained:{carId:main.id,city:main.city,wallet:{...T.player.wallet},vault:T.player.vault||0,loans:bankDebt(T),familyDebt:T.player.famDebt?.left||0},
  note:'تبقى القافلة الرئيسية وتجهيزاتها ومؤنها والشخصية والتعليم والإنجازات والعمر والديون والحصّالة. لا منحة نقدية ولا إعادة مكافآت. تعود الأطوار المالية وفق حدود الثروة المعتادة.'};
 return {quote,state:T};
}
function tradeRestartQuote(S){return prepareTradeRestart(S).quote;}
function restartTrade(S){
 const prepared=prepareTradeRestart(S);if(!prepared.quote.ok)return prepared.quote;
 for(const key of Object.keys(S))delete S[key];Object.assign(S,prepared.state);attachWallet(S);
 return {...prepared.quote,msg:'اكتملت التصفية وبقيت قافلتك الرئيسية؛ يمكنك بدء تجارة جديدة.'};
}
/* القرض المبكر مستقل عن سياسة قرض الطور4. */
const EARLY_QARD={min:2000,base:2000,max:3000,level:3,upgradeLevel:5,days:90,grace:30,debtCap:3000,wealthShare:.5};
function earlyQardQuote(S,amount){
 const P=S.player,L=S.learn,policy=EARLY_QARD,no=(code,msg,extra={})=>({ok:false,code,msg,...extra});
 if(!L?.char||L.level<policy.level||S.phase<1)return no('level','يُتاح القرض المبكر من مستوى التعلم 3.');
 const main=P.caravans.find(c=>c.main)||P.caravans[0];if(!main||main.left>0)return no('travel','انتظر وصول قافلتك قبل طلب القرض.');
 if(S.awayJob||S.awaySim)return no('away','انتظر انتهاء حساب الغياب.');
 const loans=P.bank.loans;
 if(loans.some(l=>!Number.isFinite(l.amt)||l.amt<0))return no('data','بيانات الدين غير مكتملة: للتأكد.');
 if(loans.some(l=>l.src==='salem'&&l.amt>0))return no('active','لديك قرض مبكر قائم؛ سدّده قبل طلب آخر.');
 if(loans.some(l=>l.amt>0&&((l.late||0)>0||Number.isFinite(l.due)&&l.due<=S.day)))return no('late','سدّد القسط المستحق قبل طلب قرض جديد.');
 const fd=P.famDebt,family=fd?fd.left:0;
 if(!Number.isFinite(family)||family<0)return no('data','رصيد دَين الجدّ غير مكتمل: للتأكد.');
 if(family>0&&fd.due!=null&&fd.due<=S.day){
  if(!Number.isFinite(fd.amt0)||fd.amt0<=0)return no('data','القسط العائلي غير مقيد بالكامل: للتأكد.');
  const need=Math.min(family,Math.round(fd.amt0*BAB.DEBT.installPct));
  if((fd.mPaid||0)<need)return no('late','سدّد القسط العائلي المستحق قبل طلب قرض جديد.');
 }
 const wealth=netWorth(S),debt=bankDebt(S)+family;
 if(!Number.isFinite(wealth)||!Number.isFinite(debt))return no('data','تعذر حساب الثروة أو الدين: للتأكد.');
 const ceiling=L.level>=policy.upgradeLevel||(P.salemQard?.onTime||0)>0?policy.max:policy.base;
 const wealthLimit=Math.max(0,Math.floor((wealth+policy.base)*policy.wealthShare)),debtRoom=Math.max(0,Math.floor(policy.debtCap-debt)),limit=Math.min(ceiling,wealthLimit,debtRoom);
 const terms={limit,ceiling,wealthLimit,debtRoom,existingDebt:debt,days:policy.days,grace:policy.grace,due:S.day+policy.days};
 if(limit<policy.min)return no('capacity','الحد المتاح أقل من 2000 ريال وفق سقف الثروة أو إجمالي الديون؛ لا يُصدر قرض أصغر.',terms);
 const requested=amount===undefined?limit:amount;
 if(!Number.isSafeInteger(requested)||requested<policy.min||requested>limit)return no('amount','اختر مبلغاً صحيحاً بين 2000 و'+limit+' ريال.',terms);
 return {ok:true,...terms,amount:requested,type:'qard',src:'salem',markup:0};
}
function issueEarlyQard(S,amount){
 const q=earlyQardQuote(S,amount);if(!q.ok)return q;
 const P=S.player,id=S.nextId++,loan={id,type:'qard',src:'salem',amt:q.amount,face:q.amount,markup:0,day:S.day,due:q.due,late:0};
 P.bank.loans.push(loan);P.wallet.sar+=q.amount;
 const book=P.salemQard||(P.salemQard={onTime:0,history:[]});book.issued=(book.issued||0)+1;
 return {...OK('استلمت '+q.amount+' ريال؛ موعد السداد يوم '+q.due+'.'),id,amount:q.amount,due:q.due};
}
function earlyQardComplete(S,l){
 if(l.completed||l.amt>1e-8)return;
 l.completed=true;l.amt=0;
 const book=S.player.salemQard||(S.player.salemQard={onTime:0,history:[]}),onTime=Number.isFinite(l.due)&&S.day<=l.due,early=onTime&&S.day<l.due;
 if(onTime)book.onTime=(book.onTime||0)+1;
 const history=book.history||(book.history=[]);history.unshift({id:l.id,face:l.face,paidAt:S.day,onTime,early,defaulted:!!l.defaulted});history.length=Math.min(20,history.length);
}
function payEarlyQard(S,l,amount){
 if(!(Number.isFinite(amount)&&amount>0&&l.amt>0&&l.src==='salem'))return 0;
 const n=Math.min(amount,l.amt,Math.max(0,S.player.wallet.sar));if(!(n>0))return 0;
 S.player.wallet.sar-=n;l.amt-=n;S.player.led.exp.debtPaid=(S.player.led.exp.debtPaid||0)+n;earlyQardComplete(S,l);return n;
}
function repayEarlyQard(S,amount){
 const l=S.player.bank.loans.find(l=>l.src==='salem'&&l.amt>0);if(!l)return NO('لا قرض مبكر قائم.');
 if(amount===undefined)amount=l.amt;
 if(!Number.isFinite(amount)||amount<=0)return NO('اختر مبلغ سداد موجباً.');
 const paid=payEarlyQard(S,l,amount);if(!paid)return NO('رصيد الريال لا يكفي للسداد.');
 S.player.bank.loans=S.player.bank.loans.filter(l=>l.src==='salem'?l.amt>1e-8:l.amt>.5);
 return {...OK('سدّدت '+paid.toFixed(2)+' ريال من القرض المبكر.'),paid,left:l.amt,early:!!l.completed&&S.day<l.due};
}
function earlyQardDay(S,l){
 if(!Number.isFinite(l.due))return; // لا أجل مخترع لقيد قديم ناقص.
 for(const days of [10,3])if(l.due-S.day===days&&!l['remind'+days]){l['remind'+days]=true;news(S,'بقي '+days+' أيام على سداد القرض المبكر.');}
 if(S.day<l.due)return;
 payEarlyQard(S,l,l.amt);
 if(l.amt>1e-8&&S.day>=l.due+EARLY_QARD.grace){
  l.late=S.day-l.due-EARLY_QARD.grace+1;
  if(!l.defaulted){l.defaulted=true;repOf(S.player).broke++;news(S,'تأخر سداد القرض المبكر؛ يبقى المبلغ المستحق دون زيادة.','bad');S.pause=true;}
 }
}
function earlyQardDebtCut(S,pl){
 const P=S.player,fd=P.famDebt;let budget=Math.max(0,Math.min(pl*BAB.DEBT.cutDebt,P.wallet.sar));
 const targets=P.bank.loans.filter(l=>l.amt>0).map(l=>({day:l.day||0,l}));if(fd.left>0)targets.push({day:-1,family:true});targets.sort((a,b)=>a.day-b.day);
 for(const t of targets){if(budget<=0)break;const n=Math.min(budget,t.family?fd.left:t.l.amt,P.wallet.sar);if(n<=0)continue;
  if(t.family){P.wallet.sar-=n;debtApply(S,n);}else if(t.l.src==='salem')payEarlyQard(S,t.l,n);else{P.wallet.sar-=n;t.l.amt-=n;P.led.exp.debtPaid=(P.led.exp.debtPaid||0)+n;}budget-=n;
 }
 P.bank.loans=P.bank.loans.filter(l=>l.src==='salem'?l.amt>1e-8:l.amt>.5);
 const vault=Math.max(0,Math.min(pl*BAB.DEBT.cutVault,P.wallet.sar));P.wallet.sar-=vault;P.vault=(P.vault||0)+vault;
}
/* ---------- المستشار الخاص: عمّ سالم بعد التخرّج يحلّل ويقترح وينبّه ---------- */
function bestDeal(S, carArg, budget, source = 'trade') {
  const car = carArg || mainCar(S), here = S.cities[car.city]; if (car.left > 0) return null; let best = null;
  GIDS.forEach(g => {
    if (g === 'wheat' || !sells(here, g) || GD[g].sp) return; // توصيات الصفقات للسلع العامة؛ أصناف المواشي الخاصة تُكتشف من سوق المواشي
    const room = Math.floor((capOfCar(car) - loadOf(car)) / GD[g].w), p = unitPrice(here, g) * 1.04;
    const q = Math.min(30, room, Math.floor((budget != null ? budget : S.player.gold * 0.8) / p), Math.floor((here.stock[g] || 0) * 0.5)); if (q < 3) return;
    const o = sellOptions(S, car.city, g, q, p, car, source)[0]; if (!o || o.profit <= 0) return;
    const pct = o.profit / (p * q); if (!best || pct > best.pct) best = { g, q, dest: o.city, profit: o.profit, pct, days: o.days, risk: o.risk, cost: p * q, country: o.country };
  });
  return best;
}
function portfolioMix(S) {
  const P=S.player,car=mainCar(S),sv={};let tot=0;
  [car.cargo].concat(Object.values(P.props).map(p=>p.store)).forEach(st=>{for(const g in st){const v=(st[g]||0)*mid(g);sv[g]=(sv[g]||0)+v;tot+=v;}});
  const top=Object.keys(sv).sort((a,b)=>sv[b]-sv[a])[0];
  return {top:top?{g:top,pct:sv[top]/tot}:null,goodsTotal:tot};
}
function advisorReport(S) {
  const P = S.player, car = mainCar(S), here = S.cities[car.city], z = zakatBase(S), idle = car.left === 0;
  const rep = { city: car.city, idle, dest: car.dest, left: car.left };
  rep.here = GIDS.filter(g => g !== 'wheat' && sells(here, g)).map(g => ({ g, ratio: ratio(here, g), price: unitPrice(here, g), stock: here.stock[g] || 0 })).sort((a, b) => a.ratio - b.ratio);
  rep.deal = bestDeal(S);
  rep.cargo = GIDS.filter(g => (car.cargo[g] || 0) >= 1).map(g => { const q = Math.floor(car.cargo[g]), o = sellOptions(S, car.city, g, q, avgCost(car.basis, g) || mid(g), car)[0]; return { g, q, here: ratio(here, g), best: o ? { city: o.city, profit: o.profit, days: o.days } : null }; });
  rep.portfolio = Object.assign({cash:z.cash,goods:z.goods,store:z.store,deposits:z.deposits+z.bonds,debts:z.debts,nw:netWorth(S)},portfolioMix(S));
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
  const rp = portfolioMix(S); if (rp.goodsTotal > 1500 && rp.top && rp.top.pct > 0.55) learnReact(S, 'tipConc', 25, GD[rp.top.g].name);
  if (valueOf(car.cargo) > 4000 && car.guards < 2 && !car.insured) learnReact(S, 'tipGuard', 25);
  if (P.bank.loans.length) learnReact(S, 'tipDebt', 30);
}

const hasCargo = S => S.player.caravans.some(c => Object.values(c.cargo).some(v => v >= 1));
const A = {
  earlyQard:issueEarlyQard,
  repayEarlyQard,
  restartTrade,
  sellCityAssets,
  sellAsset,
  settlePayment,
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
    const poultry = !!BREED[g] && !(GD[g].hu > 0);
    if (sex && !(mode === 'herd' ? SEXF[sex] : poultry && (sex === 'm' || sex === 'f'))) return NO('الجنس يُحدَّد عند شراء القطيع الماشي أو الدواجن للتربية فقط');
    const res = buyUnits(S, S.player, c, g, qty, room, dst, true, false, sex ? SEXF[sex] : 1);
    if (res.n) addBasis(car.basis, g, res.n, res.cost);
    if (res.n && mode === 'herd') { if (!sex) herdAdd(car, g, res.n); else { const x = hxOf(car, g); if (sex === 'm') x.m += res.n; else if (sex === 'p') x.p = (x.p || 0) + res.n; } }
    if (res.n && mode !== 'herd' && poultry && sex) { const cx = cxOf(car, g); cx[sex] += res.n; } // جنس الدواجن في الحمولة: يُحمل إلى المزرعة للتكاثر
    if (res.n && mode !== 'herd') defectMaybe(S, car, g, res.n, res.cost);
    if (res.n && GD[g].live) learnReact(S, mode === 'herd' ? 'herdBuy' : 'liveBuy');
    if (res.unsold) return NO('لا يُباع هنا. ' + GD[g].name + ' يُشترى من: ' + soldAt(S, g).map(id => S.cities[id].name).join('، '));
    if (!res.n && res.quota) { learnReact(S, 'quotaHit', 15); }
    if (!res.n && res.quota) return NO('حصتك اليوم من ' + GD[g].name + ' انتهت. ثقة ' + bossOf(S, car.city).name + ' ترفعها، وعقد التوريد أو الحصري يضاعفها');
    return res.n ? Object.assign(OK('اشتريت ' + res.n + ' ' + GD[g].name + ' بـ ' + Math.round(res.cost) + ' ريال (متوسط ' + (res.cost / res.n).toFixed(1) + ')'), { n: res.n, cost: res.cost }) : NO('تعذّر الشراء (ذهب/مخزون/حمولة)');
  },
  setStart(S, jd) {
    const L = S.learn; if (!L || !L.char) return NO('اختر شخصيتك أولاً');
    if (S.day > 0 || (S.cal && S.cal.set)) return NO('بدأت رحلتك بالفعل');
    jd = Math.round(+jd); if (!(jd >= CAL.MIN && jd <= CAL.MAX)) return NO('اختر تاريخاً من ' + jdStr(CAL.MIN) + ' فصاعداً');
    S.cal = { jd0: jd, set: true, yr: 1 }; S.yearLog = []; L.datePend = false;
    const d = dateOf(S, 0); return OK('تنطلق قافلتك في ' + d.hs + ' الموافق ' + d.gs);
  },
  defectReturn(S) { return defectReturn(S); },
  defectArsh(S) { return defectArsh(S); },
  zakatPay(S, amt) {
    const Z = S.zakat; if (!Z || !Z.due) return NO('لا زكاة مستحقة الآن');
    if (!(Z.amount > 0)) return NO('لا مبلغ نقدي مستحق' + (Z.anLeft > 0 ? '، بقيت زكاة الأنعام' : ''));
    amt = Math.round(+amt || 0); if (!(amt > 0)) return NO('أدخل مبلغاً');
    amt = Math.min(amt, Z.amount); if (S.player.gold < amt) return NO('رصيدك لا يكفي لهذا المبلغ');
    pPay(S, 'zakat', amt, true); Z.amount -= amt; Z.paid += amt; Z.part = true;
    if (Z.amount > 0) return OK('أخرجتَ ' + amt + ' ريال، وبقي ' + Z.amount + ' ريال من زكاتك');
    if (Z.anLeft > 0) return OK('أخرجتَ زكاة مالك، وبقيت زكاة الأنعام');
    return zakatFinish(S);
  },
  zakatHerdMode(S, mode) {
    const Z = S.zakat; if (!Z || (mode !== 'trade' && mode !== 'sawm')) return NO('اختيار غير صحيح');
    if (Z.due && Z.part) return NO('بدأتَ إخراج الزكاة، فلا يتغير غرض القطيع الآن');
    Z.herdMode = mode; if (!Z.due) return OK(mode === 'sawm' ? 'قطيعك للرعي والنسل: له زكاة أنعام بأنصبتها' : 'قطيعك للتجارة: يُقوَّم بسعر السوق ضمن مالك');
    const b = zakatBase(S), anOn = mode === 'sawm' && b.an.any;
    if (!b.met && !anOn) { Z.hist.unshift({ day: S.day, base: Math.round(b.base), due: 0, paid: 0, note: 'below' }); if (Z.hist.length > 12) Z.hist.pop(); Z.due = false; Z.start = null; Z.amount = 0; Z.an = null; Z.anLeft = 0; return OK('لا زكاة عليك الآن بهذا الغرض'); }
    Z.amount = b.met ? b.amount : 0; Z.base = Math.round(b.base); zakatAnSnap(S, b); return OK('أُعيد الحساب: ' + (mode === 'sawm' ? 'زكاة أنعام للرعي والنسل' : 'قطيعك ضمن عروض التجارة'));
  },
  zakatAn(S, how) {
    const Z = S.zakat; if (!Z || !Z.due || !(Z.anLeft > 0) || !Z.an) return NO('لا زكاة أنعام مستحقة');
    const items = anItems(S, Z.an); let cash = 0, kindN = 0;
    if (how === 'kind') items.forEach(x => { const got = anTake(S, AN_ITEM_SP[x.k], x.n); kindN += got; if (got < x.n) cash += (x.n - got) * anPrice(S, x.k); });
    else items.forEach(x => { cash += x.n * anPrice(S, x.k); });
    cash = Math.round(cash); if (S.player.gold < cash) return NO('رصيدك لا يكفي لقيمة زكاة الأنعام (' + cash + ')');
    if (cash > 0) pPay(S, 'zakat', cash, true);
    Z.paid += cash; Z.anLeft = 0; Z.an = null; Z.part = true;
    const msg = how === 'kind' ? 'أخرجتَ زكاة أنعامك من القطيع (' + kindN + ' رأس)' + (cash ? ' وقيمة الباقي ' + cash + ' ريال' : '') : 'أخرجتَ قيمة زكاة أنعامك ' + cash + ' ريال';
    if (Z.amount > 0) return OK(msg + '، وبقيت زكاة مالك النقدية');
    const r = zakatFinish(S); return OK(msg + '. ' + r.msg);
  },
  zakatDefer(S) { const Z = S.zakat; if (!Z || !Z.due) return NO('لا زكاة مستحقة الآن'); Z.defer = S.day + 7; Z.dfr = 1; Z.lates = (Z.lates || 0) + 1; S.pause = false; return OK('أجّلتَ الزكاة أسبوعاً، وهي دَين عليك فلا تنسَها'); },
  mjNow(S) { return mjNow(S); },
  agentBuy(S, city, g, qty) {
    const q = agentQuote(S, city, g, qty); if (!q.ok) return NO(q.msg);
    const c = S.cities[city]; ctxFor(S, city);
    const acct = { gold: S.player.gold / (1 + q.feeRate) }, res = buyUnits(S, acct, c, g, q.n, 1e9, {}, true, true);
    if (!res.n) return NO('تعذّر الطلب');
    const fee = res.cost * q.feeRate, total = res.cost + fee; S.player.gold -= total; S.player.led.exp.agent = (S.player.led.exp.agent || 0) + fee;
    mjWant(S, 'qabd'); S.orders = S.orders || []; S.orders.push({ id: S.nextId++, to: q.dest, from: city, g, n: res.n, cost: total, day: S.day + q.days });
    return OK('طلبت ' + res.n + ' ' + GD[g].name + ' من ' + c.name + ' بـ ' + Math.round(total) + ' ريال (رسم الوكيل ' + Math.round(fee) + ') · تصل إلى ' + S.cities[q.dest].name + ' بعد ' + q.days + ' أيام');
  },
  sell(S, carId, g, qty, mode) {
    const car = carById(S, carId), c = S.cities[car.city];
    if (car.left > 0) return NO('القافلة في الطريق');
    ctxFor(S, car.city);
    const cb0 = mode !== 'herd' ? (car.cargo[g] || 0) : 0, b0 = mode === 'herd' ? (herdOf(car)[g] || 0) : 0, pm = (mode === 'herd' ? pedMulOf(car, g) : 1) * qualOf(car.basis, g), res = sellUnits(S, S.player, c, g, qty, mode === 'herd' ? herdOf(car) : car.cargo, true, pm, 'trade', car.basis[g]);
    if (mode === 'herd') herdScale(car, g, b0); else cxScale(car, g, cb0);
    if (!res.n) return NO('لا بضاعة');
    const cost = takeBasis(car.basis, g, res.n), pl = res.net - cost; logTrade(S, car.city, g, res.n, 'sell', res.net, pl);
    return { ok: true, msg: 'بعت ' + res.n + ' ' + GD[g].name + ' صافي ' + Math.round(res.net) + ' ريال · ' + (pl >= 0 ? 'ربحت ' : 'خسرت ') + Math.abs(Math.round(pl)), pl, net: res.net, n: res.n };
  },
  sail(S, carId, dest, pace) { const car = carById(S, carId); if (!car) return NO('قافلة غير معروفة'); const r = startSail(S, car, dest, pace); return r.ok ? OK('أبحرتَ: ' + r.days + ' أيام (رسم الميناء ' + r.fee + ')' + (r.pace && r.pace.lv ? ' · مؤن السفر ' + r.pace.units : '')) : NO(r.msg); },
  buyShip(S, city, type) {
    type = type || 'dhow'; const T = SHIPS[type]; if (!T) return NO('نوع سفينة غير معروف'); if (S.phase < SEA.phase) return NO('السفن تُفتح في الطور ' + SEA.phase);
    if ((S.player.seaTrips || 0) < T.need) return NO(T.name + ' تُفتح بعد ' + T.need + ' رحلات بحرية (أبحرتَ ' + (S.player.seaTrips || 0) + ')');
    if (!isPort(city)) return NO('الموانئ فقط: ' + PORTS.map(p => S.cities[p].name).join('، ')); if (shipAt(S, city)) return NO('لك سفينة راسية في هذا الميناء');
    const cost = Math.round(T.cost * foreignMul(S, S.cities[city])); ctxFor(S, city); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); const ship = { id: S.nextId++, type, city, name: T.name + ' ' + (shipsOf(S).length + 1), dest: null, up: { hull: 0, sail: 0 }, crew: 0, captain: null }; shipsOf(S).push(ship); learnReact(S, 'buyShip');
    return OK('اشتريتَ ' + ship.name + ' في ' + S.cities[city].name + ': سعتها ' + T.cap + '، تُبحر بها قافلتك من هذا الميناء');
  },
  sellShip(S, shipId) {
    const ships = shipsOf(S), sh = ships.find(x => x.id === shipId); if (!sh) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر'); const T = SHIPS[sh.type], back = Math.round(T.cost * SEA.sellBack);
    ctxFor(S, sh.city); S.player.gold += back; S.player.ships = ships.filter(x => x !== sh); return OK('بعتَ ' + sh.name + ' بـ' + back);
  },
  upgradeShip(S, shipId, k) {
    const sh = shipsOf(S).find(x => x.id === shipId), U = SHIP_UP[k]; if (!sh || !U) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر');
    const lv = shipUp(sh, k); if (lv >= 2) return NO('بلغ الحد الأقصى'); const cost = Math.round(SHIPS[sh.type].cost * U.cost[lv] * foreignMul(S, S.cities[sh.city])); ctxFor(S, sh.city); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'assets', cost); sh.up = Object.assign({ hull: 0, sail: 0 }, sh.up, { [k]: lv + 1 }); return OK(U.name + ' (مستوى ' + (lv + 1) + ') في ' + sh.name);
  },
  hireSailor(S, shipId) {
    const sh = shipsOf(S).find(x => x.id === shipId); if (!sh) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر'); if (shipCrew(sh) >= SHIPS[sh.type].slots) return NO('طاقم السفينة مكتمل (' + SHIPS[sh.type].slots + ')');
    ctxFor(S, sh.city); if (S.player.gold < SAILOR_FEE) return NO('تحتاج ' + SAILOR_FEE); pPay(S, 'hiring', SAILOR_FEE, true); sh.crew = shipCrew(sh) + 1; return OK('انضم بحّار إلى ' + sh.name);
  },
  dismissSailor(S, shipId) { const sh = shipsOf(S).find(x => x.id === shipId); if (!sh || !sh.city) return NO('لا سفينة راسية'); if (!(shipCrew(sh) > 0)) return NO('لا بحّارة'); sh.crew = shipCrew(sh) - 1; return OK('سرّحت بحّاراً'); },
  hireSeaCaptain(S, shipId, idx) {
    const sh = shipsOf(S).find(x => x.id === shipId); if (!sh) return NO('لا سفينة'); if (!sh.city) return NO('السفينة في البحر'); if (sh.captain) return NO('للسفينة قائد: سرّحه أولاً');
    const cd = seaCaptainPool(S)[idx]; if (!cd) return NO('مرشّح غير موجود'); ctxFor(S, sh.city); if (S.player.gold < cd.fee) return NO('تحتاج ' + cd.fee);
    pPay(S, 'hiring', cd.fee, true); sh.captain = { name: cd.name, role: cd.role, nav: cd.nav, combat: cd.combat, wage: cd.wage, since: S.day }; learnReact(S, 'capHire');
    return OK('انضم ' + cd.name + ' (' + SEA_ROLES[cd.role].name + ') قائداً لـ' + sh.name);
  },
  fireSeaCaptain(S, shipId) { const sh = shipsOf(S).find(x => x.id === shipId); if (!sh || !sh.city) return NO('لا سفينة راسية'); if (!sh.captain) return NO('لا قائد'); const n = sh.captain.name; sh.captain = null; return OK('سرّحت ' + n); },
  buyPack(S, carId, n) { const r = buyPack(S, carById(S, carId), n); return r.ok ? OK('اشتريتَ ' + r.n + ' من مؤن السفر بـ ' + r.cost) : NO(r.msg); },
  travel(S, carId, dest, pace) { const car = carById(S, carId); const r = startTrip(S, car, dest, pace); return r.ok ? OK('انطلقت: ' + r.days + ' أيام' + (r.pace && r.pace.lv ? ' · مؤن السفر ' + r.pace.units : '')) : NO(r.msg); },
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
  hireCrew(S, carId) { const car = carById(S, carId); if (car.crew >= 12) return NO('الطاقم كامل'); if (S.player.gold < 50) return NO('تحتاج 50'); pPay(S, 'hiring', WAGE.crewHire, true); car.crew++; const w = staffWage(S, 'crew'); return OK('انضم رجل للطاقم بأجر معلوم: ' + w.once + ' ريال مرة واحدة، و' + w.day + ' ريال يومياً أثناء السفر'); },
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
  hireGuard(S, carId) { const car = carById(S, carId); if (car.guards >= 8) return NO('حراس كفاية'); if (S.player.gold < 300) return NO('تحتاج 300'); pPay(S, 'hiring', WAGE.guardHire, true); car.guards++; learnReact(S, 'guardHire'); const w = staffWage(S, 'guard'); return OK('حارس جديد بأجر معلوم: ' + w.once + ' ريال مرة واحدة، و' + w.day + ' ريال يومياً أثناء السفر (' + w.idle + ' حين تقف القافلة)'); },
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
    const cm = inHerd ? 0 : cxMales(car, g, b0, n); // الدواجن: الذكور المعروفة تنتقل، وغير المحدَّد بنسبة افتراضية ربع
    src[g] = b0 - n; if (inHerd) herdScale(car, g, b0); else cxScale(car, g, b0);
    f.herd[g] = (f.herd[g] || 0) + n; if (inHerd) { fx.m += n * p; fx.p = (fx.p || 0) + n * pp; } else if (car.cx && car.cx[g]) fx.m += cm; else herdAdd(f, g, n);
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
      const tmp = {}; tmp[g] = n0; const r = sellUnits(S, S.player, c, g, n0, tmp, true, YOUNG_SELL * (spOf(g) === 'horse' ? pedMul(x.yq || 1) : 1) * hyPf(f, g), 'farm'); if (!r.n) return NO('تعذّر البيع'); x.y -= r.n; logTrade(S, city, g, r.n, 'sell', r.net, r.net, 'farm');
      return { ok: true, msg: 'بعت ' + r.n + ' من صغار ' + GD[g].name + ' صافي ' + Math.round(r.net) + ' ريال', pl: r.net, net: r.net, n: r.n };
    }
    const b0 = f.herd[g] || 0, r = sellUnits(S, S.player, c, g, qty, f.herd, true, pedMulOf(f, g), 'farm'); if (!r.n) return NO('لا ' + GD[g].name + ' للبيع'); herdScale(f, g, b0);
    const cost = takeBasis(pr.basis || (pr.basis = {}), g, r.n); logTrade(S, city, g, r.n, 'sell', r.net, r.net - cost, 'farm');
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
    const ym = MEAT[g] * hyMul(f, g, 'meat') * climateFactor(S, 'farm', city) * FRESH_X, room = Math.floor(storeRoom(S, city) / GD.meat.w), maxN = Math.floor(room / ym); n = Math.min(n, maxN); if (n < 1) return NO('مخزنك لا يتسع للحم الطازج');
    const b0 = f.herd[g]; f.herd[g] = b0 - n; herdScale(f, g, b0); const cost = takeBasis(pr.basis || (pr.basis = {}), g, n), y = Math.floor(n * ym);
    pr.store.meat = (pr.store.meat || 0) + y; addBasis(pr.basis, 'meat', y, cost); learnReact(S, 'cutMeat');
    return OK('ذبحت ' + n + ' ' + GD[g].name + ' فصار عندك ' + y + ' لحماً طازجاً: تبيعه الملحمة خلال أيام قبل أن يفسد');
  },
  slaughter(S, city, g, qty) {
    const f = farmOf(S, city), pr = S.player.props[city]; if (!f) return NO('لا مزرعة هنا'); if (!MEAT[g]) return NO(spOf(g) === 'horse' ? 'لا تُذبح الخيل هنا' : 'لا تُذبح هذه');
    const have = Math.floor(f.herd[g] || 0); let n = Math.min(Math.floor(qty), have); if (n < 1) return NO('لا ' + GD[g].name + ' بالغة');
    const ym = MEAT[g] * hyMul(f, g, 'meat') * climateFactor(S, 'farm', city), room = Math.floor(storeRoom(S, city) / GD.jerky.w), maxN = Math.floor(room / ym); n = Math.min(n, maxN); if (n < 1) return NO('مخزنك لا يتسع للحم المجفف');
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
    // العامل المتأخر الأجر يعمل بنصف طاقته ويشغل مكاناً؛ إن امتلأ حدّ المدينة بهم يُستبدل الأكثر تأخراً بدل أن يُغلق التوظيف
    let swap = null;
    if (hirePool(S, city) < 1) {
      swap = staffOf(S, city).filter(x => x.late > 0).sort((a, b) => (b.role === role) - (a.role === role) || b.late - a.late)[0];
      if (!swap) return NO('لا عمّال متاحون في ' + c.name + ': حدّ المدينة ' + hireCap(S, city) + ' عاملاً وكلهم عندك');
    }
    const w = { id: S.nextId++, role, days: 0, late: 0 }, fee = wkWage(S, c, w) * 2; if (S.player.gold < fee) return NO('رصيدك لا يكفي رسوم التوظيف (' + fee + ' ريال)');
    pPay(S, 'staff', fee, true); pr.staff = pr.staff || []; if (swap) pr.staff = pr.staff.filter(x => x !== swap); pr.staff.push(w); return OK((swap ? 'استبدلتَ عاملاً متأخر الأجر: ' : '') + 'وظّفت ' + WK[role].name + ' في ' + c.name + ' (' + wkWage(S, c, w) + ' ريال يومياً)');
  },
  hireFill(S, city) {
    const pr = S.player.props[city]; if (!pr) return NO('لا عقار هنا'); let n = 0, guard = 0, why = '';
    while (guard++ < 40) {
      const role = sellerPts(S, city) + 1e-9 < sellerNeed(S, city) ? 'seller' : staffOf(S, city).filter(w => w.role === 'keeper').length < keeperNeed(S, city) ? 'keeper' : farmCover(S, city) < 1 - 1e-9 ? 'farmer' : null;
      if (!role) break; const hr = A.hireStaff(S, city, role); if (!hr.ok) { why = hr.msg; break; } n++;
    }
    return n ? OK('وظّفت ' + n + ' عاملاً') : NO(why || 'الطاقم مكتمل');
  },
  fireStaff(S, city, id) {
    const pr = S.player.props[city]; if (!pr || !(pr.staff || []).some(w => w.id === id)) return NO('لا عامل');
    const i = pr.staff.findIndex(w => w.id === id); pr.staff.splice(i, 1); return OK('سرّحت عاملاً واحداً'); // عامل واحد فقط ولو تكرر المعرّف في حفظ قديم
  },
  shopSetItem(S, city, shopId, g, price, auto, carry) {
    const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان');
    price = clamp(price, 0.5, 3);
    const ex = sh.items.find(i => i.g === g);
    if (ex) { ex.price = price; ex.auto = auto !== false; if (carry != null) ex.carry = !!carry; return OK('حُدّث السعر'); }
    if (sh.items.length >= shItemsMax(sh)) return NO((shKind(sh) === 'stall' ? 'البسطة' : 'الدكان') + ' تتسع لـ ' + shItemsMax(sh) + ' سلع فقط');
    sh.items.push({ g, price, auto: auto !== false, carry: !!carry, buyBelow: SHOP_BUYBELOW, target: 60, sold: 0, revenue: 0 });
    return OK('أُضيفت ' + GD[g].name + ' للدكان');
  },
  /* «جهّز دكانك»: أنسب سلعة للبدء (الأعلى طلباً بقيمتها في المدينة وفيها مخزون في السوق) بالسعر الافتراضي وتعبئة آلية */
  shopQuick(S, city, shopId) {
    const sh = shopsOf(S, city).find(s => s.id === shopId); if (!sh) return NO('لا دكان');
    if (sh.items.length >= shItemsMax(sh)) return NO('الدكان ممتلئ بالسلع');
    const c = S.cities[city], have = new Set(sh.items.map(i => i.g));
    const cand = GIDS.filter(x => !have.has(x) && sells(c, x) && !GD[x].sp && !GD[x].live && c.stock[x] >= 30), buyable = cand.filter(x => ratio(c, x) < SHOP_BUYBELOW);
    const g = (buyable.length ? buyable : cand.slice().sort((a, b) => ratio(c, a) - ratio(c, b)).slice(0, 1)).sort((a, b) => c.dem[b] * unitPrice(c, b) - c.dem[a] * unitPrice(c, a))[0]; // نفضّل ما يرخص الآن فتبدأ التعبئة فوراً
    if (!g) return NO('لا سلعة مناسبة الآن، أضف سلعة بنفسك');
    return A.shopSetItem(S, city, shopId, g, SHOP_PRICE0, true);
  },
  shopAutoAll(S, city) { let n = 0; shopsOf(S, city).forEach(sh => sh.items.forEach(i => { if (!i.auto) { i.auto = true; n++; } })); return n ? OK('فُعّلت التعبئة الآلية لـ ' + n + ' سلعة') : NO('كلها مفعّلة'); },
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
    for (const l of L) { if(l.src==='salem'){paid+=payEarlyQard(S,l,l.amt);continue;} const p = Math.min(P.gold, l.amt); if (p > 0) { P.gold -= p; l.amt -= p; paid += p; } }
    P.bank.loans = P.bank.loans.filter(l => l.src==='salem'?l.amt>1e-8:l.amt>0.5); return paid > 0 ? OK('سدّدتَ ' + Math.round(paid) + ' ريال' + (P.bank.loans.length ? '' : ' وبرئت ذمتك')) : NO('لا رصيد للسداد');
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
    learnReact(S, 'giftLesson');
    return OK('كسبت ' + pts + ' نقاط نفوذ في ' + c.name + ' بـ ' + cost + ' ريال (الزعيم يضيق منك قليلاً)');
  },
  gift(S, city) {
    const bs = bossOf(S, city), c = S.cities[city]; if (!bs) return NO('لا زعيم هنا');
    if (!bossActive(S)) return NO('يُفتح في الطور 2');
    if (bs.ruler === 'player') return NO('أنت الحاكم');
    if (S.day - bs.gift < 10) return NO('أهديته قبل أيام، انتظر ' + (10 - (S.day - bs.gift)) + ' أيام');
    ctxFor(S, city); const cost = Math.round(500 * c.size * foreignMul(S, c)); if (S.player.gold < cost) return NO('تحتاج ' + cost);
    pPay(S, 'gift', cost, true); bs.gift = S.day; bs.trust = clamp(bs.trust + (6 + (loreStyle(bs, city) === 'gen' ? 3 * (bs.temper ?? 1) : 0)), -100, 100);
    learnReact(S, 'giftLesson');
    return OK('أهديت ' + bs.name + ' هدية بـ ' + cost + ' ريال: ثقته بك ' + Math.round(bs.trust));
  },
  negotiate(S, city, type) {
    const bs = bossOf(S, city); if (!bs || !PACTS[type]) return NO('لا عرض');
    const why = pactBlock(S, city, type); if (why) return NO(why);
    if (bs.disc[type] && bs.disc[type] > S.day) return NO('فاوضتَه فعلاً: العرض الجديد قائم');
    const sty = loreStyle(bs, city), chance = clamp(0.35 + bs.trust / 200 + bossShare(bs) * 0.3 + (sty === 'patient' && S.day - (bs.lastNeg == null ? -99 : bs.lastNeg) >= 5 ? 0.1 * (bs.temper ?? 1) : 0), 0.1, 0.85); bs.lastNeg = S.day;
    if (rnd(S) < chance) { bs.disc[type] = S.day + 10; return OK('نجحت المفاوضة: خفّض ' + bs.name + ' الشروط 20٪ (العرض قائم 10 أيام)'); }
    bs.trust = clamp(bs.trust - (5 + (sty === 'stern' ? 3 * (bs.temper ?? 1) : 0)), -100, 100); bs.cd = S.day + 3;
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
function quoteSell(S, city, g, qty, haggle, tr, source = 'trade', saleBasis) {
  const c = S.cities[city]; let st = c.stock[g], gross = 0, n = 0; qty = Math.floor(qty); if (tr == null) tr = taxRate(S, c, true);
  const vm = vouchMul(S, city, g, 'sell'), vl = vouchLeft(S, city, g, 'sell');
  for (; n < qty; n++) { gross += priceAt(c, g, st) * (haggle || 1) * (n < vl ? vm : 1); st = Math.min(st + 1, capG(c, g) * 1.2); }
  const basis=saleBasis==null?(mainCar(S).basis[g]||0):saleBasis;gross=climateSaleGross(S,source,city,gross,tr,climateBasisCost(basis,n));
  const tax = gross * tr; return { n, gross, tax, net: gross - tax, avg: n ? (gross - tax) / n : 0 };
}
const liveCity = (S, id) => hasPresence(S, id) || mainCar(S).city === id && mainCar(S).left === 0;
// أين أبيع هذه السلعة وكم أربح؟ تقدير بمعلومات اللاعب (سعر معروف + ميل الانزلاق العام)
function sellOptions(S, fromCity, g, qty, unitCost, car, source = 'trade') {
  car = car || mainCar(S); qty = Math.max(1, Math.floor(qty)); const G = GD[g], P = S.player, fc = S.cities[fromCity];
  const wheat = unitPrice(fc, 'wheat'), tr0 = taxRate(S, fc, true), out = [];
  S.order.forEach(id => {
    if (id === fromCity) return;
    const c = S.cities[id], live = liveCity(S, id), k = P.known[id], p0 = live ? unitPrice(c, g) : k.p[g], age = live ? 0 : S.day - k.day;
    const slope = (G.pmax - G.pmin) * G.cult[c.country] * c.idx[g] / capG(c, g);
    const avg = Math.max(G.pmin * 0.4, p0 - slope * (qty - 1) / 2), baseGross = avg * qty * qualOf(car.basis, g), tr = taxRate(S, c, true), gross = climateSaleGross(S,source,id,baseGross,tr,unitCost*qty), tax = gross * tr;
    const cuRate = c.country === fc.country ? 0 : CD[c.country].customs, customs = cuRate * qty * (unitCost > 0 ? unitCost : p0);
    const days = tripDays(S, car, fromCity, id), prov = (supplyNeed(car, days) + (GD[g].fod ? Math.ceil(qty * GD[g].fod * days) : 0)) * wheat, risk = S.risk[riskKey(fromCity, id)];
    const net = gross - tax - customs, profit = net - unitCost * qty - prov;
    out.push({ city: id, country: c.country, cur: curOf(c.country), price: climateSaleGross(S,source,id,p0,tr,unitCost), age, days, risk, tax, customs, prov, net, profit, perUnit: profit / qty, live });
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
  const car = carById(S, carId || 1) || mainCar(S), c = S.cities[city], P = S.player, gold = buyBudget(S, city), goldAll = P.gold, walletCur = curOf(c.country), manual = fxMode(S) === 'manual';
  const carRoom = capOfCar(car) - loadOf(car), storeFree = storeRoom(S, city), hasStore = hasPresence(S, city);
  const goods = GIDS.map(g => {
    const G = GD[g], sold = sells(c, g), stock = sold ? Math.floor(c.stock[g]) : 0, price = unitPrice(c, g);
    const afford = quoteBuy(S, city, g, stock, gold).n, carU = Math.floor(carRoom / G.w), storeU = hasStore ? Math.floor(storeFree / G.w) : 0;
    const wanted = Math.min(stock, afford), canCar = Math.min(wanted, carU), canStore = Math.min(wanted, storeU);
    const qo = sold && quotaOn(S, c, g), ql = qo ? Math.floor(quotaLeft(S, c)) : Infinity, qpd = qo ? quotaPerDay(S, c) : Infinity;
    let limit = wanted <= 0 ? (stock < 1 ? 'stock' : ql < 1 ? 'quota' : 'gold') : canCar < wanted ? 'room' : (qo && ql < stock && afford <= ql) ? 'quota' : stock <= afford ? 'stock' : 'gold';
    if (limit === 'gold' && manual && quoteBuy(S, city, g, stock, goldAll).n > afford) limit = 'wallet'; // الرصيد الكلي يكفي لكن محفظة هذا السوق لا تكفي
    const fitsCar = carU >= wanted && wanted > 0, fitsStore = hasStore && storeU >= wanted && wanted > 0;
    return { g, sold, stock, price, ratio: price / refPrice(c, g), afford, wanted, canCar, canStore, carU, storeU, limit, walletCur, quota: qo && ql !== Infinity ? { left: ql, perDay: qpd, cap: qpd * QUOTA_DAYS } : null, fitsCar, fitsStore, fits: fitsCar && fitsStore ? 'both' : fitsCar ? 'car' : fitsStore ? 'store' : 'none', have: Math.floor(car.cargo[g] || 0), avg: avgCost(car.basis, g) };
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
    const pb = unitPrice(c, g) * 1.02, ps = climateSaleGross(S, 'trade', d, unitPrice(dc, g), dc.tax + cus, pb) * (1 - dc.tax - cus);
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
  paymentMigrate(S);
  if (S.story) S.story.cur = null; // لا يُعاد فتح حوار عند بدء التشغيل
  S.orders = S.orders || []; S.defects = S.defects || []; if (!S.zakat) S.zakat = zakatNew();
  if (!S.mkt2) { S.mkt2 = 1; if (S.learn && S.learn.char) { S.news = S.news || []; news(S, 'تغيّرت الأسواق: لكل مدينة منتج خاص يرخص عندها ويغلو بقدر البُعد عنها، وزعيم السوق يحدّد حصتك منه. دكاكينك ومخازنك كما هي.', 'good'); } }
  if (!S.learn) learnMigrate(S); else { if (!S.learn.rq) { S.learn.rq = []; S.learn.rseen = {}; } loreFix(S.learn); }
  (S.player.caravans || []).forEach(c => { c.herd = c.herd || {}; c.herders = c.herders || 0; });
  CITY_DEFS.forEach(d => { const c = S.cities && S.cities[d.id]; if (c) { c.x = d.x; c.y = d.y; c.makes = d.makes.slice(); } });
  // مدن أُضيفت بعد حفظ اللعبة (مكة والمدينة): تُنشأ وتُسخَّن أسواقها وتُضاف إلى الخريطة والمخاطر ومعارف اللاعب
  { const add = CITY_DEFS.filter(d => S.cities && !S.cities[d.id]); if (add.length) { add.forEach(d => { S.cities[d.id] = makeCity(S, d); S.order.push(d.id); for (let i = 0; i < 40; i++) cityDay(S, S.cities[d.id]); }); ensureRisks(S); snapshotKnown(S, add.map(d => d.id)); if (S.learn && S.learn.char) { S.news = S.news || []; news(S, 'انضمت إلى خريطة التجارة ' + add.map(d => d.name).join(' و') + '.', 'good'); } } }
  migrateGoods(S);
  { const seen = new Set(); let mx = S.nextId || 10; for (const k in S.player.props) for (const w of (S.player.props[k].staff || [])) if (typeof w.id === 'number' && w.id >= mx) mx = w.id + 1; S.nextId = mx; for (const k in S.player.props) for (const w of (S.player.props[k].staff || [])) { if (typeof w.id !== 'number' || seen.has(w.id)) w.id = S.nextId++; seen.add(w.id); } } // معرّفات العمّال فريدة (حفظ قديم قد يكرر معرّفاً فيُسرَّح الكل بضغطة)
  for (const k in S.player.props) { const pr = S.player.props[k]; if (!pr.staff) { pr.staff = []; welcomeCrew(S, pr, pr.shops.length * SELLER_PTS, pr.whs); if (pr.shops.length) news(S, 'صار لدكاكينك عمّال بالأجر: لكل دكان بائعان، ولكل مخزن أمين. أعطيناك الطاقم مجاناً ' + WK_FREE + ' يوماً.', 'good'); } }
  if (S.player && !S.player.ships) S.player.ships = []; if (S.player && !S.player.sea) S.player.sea = { storm: 0, pirates: 0, repelled: 0, ports: {} };
  nameFix(S);
  attachWallet(S); ensureBosses(S); lifeMigrate(S); climateInit(S); return S;
}

['zakatPay', 'zakatDefer', 'buy', 'sell', 'travel', 'exchange', 'signPact', 'agentBuy', 'murabaha', 'qard', 'settle', 'invest', 'buySukuk', 'buildShop', 'buildWarehouse', 'toStore', 'shopSetItem', 'rentShop', 'buyShop', 'hireStaff', 'buildFarm', 'slaughter', 'buyStud', 'pairSet', 'buildButcher', 'cutMeat', 'haggleStart', 'haggleChoose'].forEach(k => {
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
/* العمر والمراحل: لا أثر على عوالم الضغط غير المختارة لشخصية. */
const AGE_YEAR = 354, RETIRE_AGE = 95;
const STAGE_BONUS_MAX = LS.STAGE_BONUS_MAX, STAGE_GAP_MIN = LS.STAGE_GAP_MIN, STAGE_FOUND = LS.STAGE_FOUND, STAGE_FOUND_GAP = LS.STAGE_FOUND_GAP_DAYS / AGE_YEAR;
const AWAY_SEC_PER_DAY = 3, AWAY_MAX_HOURS = 8, AWAY_YIELD = 0.8, AWAY_RISK = 0.85;
const STAGES = LS.buildStages(BAB);
function ageOf(S) { const L = S.learn; return L && L.char ? (S.legacy && S.legacy.retired ? S.legacy.heirAge : 25 + Math.max(0, S.day) / AGE_YEAR + (L.ageOffset || 0)) : 25; }
function stageOf(S) {
  const L = S.learn; if (!L || !L.char || !L.ageStages || L.level > 10 || (S.legacy && S.legacy.retired)) return null;
  const current = STAGES[(L.stage || 1) - 1];
  return current && current.source === L.level ? current : STAGES.find(x => x.source === L.level) || null;
}
function stageStatus(S) {
  const L = S.learn, st = stageOf(S); if (!st) return null;
  const profit = Math.max(0, (L.ev.profit || 0) - (L.stageProfit0 || 0) - 3);
  const bonus = Math.min(STAGE_BONUS_MAX, Math.floor(profit / 10));
  const previous = L.lastStageAge == null ? 25 : L.lastStageAge;
  const required = st.n === 1 ? 25 : st.n <= STAGE_FOUND ? previous + STAGE_FOUND_GAP : Math.max(previous + STAGE_GAP_MIN, st.age - bonus);
  const days = Math.max(0, Math.ceil((required - ageOf(S)) * AGE_YEAR - 1e-7));
  return { stage: st.n, required, age: ageOf(S), bonus, days, waiting: days > 0 };
}
function stageCheck(S, silent) {
  const L = S.learn; if (!L || !L.char) return;
  if (!silent) { loreCheck(S); tabletCheck(S); wishCheck(S); if (S.player.gold < 60 && !hasCargo(S)) learnReact(S, 'broke', 20); }
  if (!L.abroad && L.level >= 4 && homeStatus(S).met) { L.abroad = true; if (!silent) news(S, 'فُتح السفر إلى الدولة المجاورة', 'good'); }
  const st = stageOf(S); if (!st) return;
  // قارئ الحفظ وأدوات الاختبار القديمة يسجلان أول درس للمفهوم في intro.
  if (STAGES.find(x => x.source === st.source).n === st.n && L.intro >= st.source) L.stageIntro = Math.max(L.stageIntro || 0, st.n);
  L.stage = st.n; L.rest = null; const status = stageStatus(S);
  if (status.waiting || (st.n > 1 && (L.stageIntro || 0) < st.n) || !st.goals(S).every(g => g[1])) return;
  L.stageDone = L.stageDone || []; if (L.stageDone.includes(st.n)) return;
  L.stageDone.push(st.n); L.done = st.n; L.doneDay = S.day; L.lastStageAge = ageOf(S);
  if (!silent) { S.player.gold += st.reward; packReward(S, st.reward / 50); (L.stageUp || (L.stageUp = [])).push(st.n); if (st.n <= 6) L.up.push(st.source); news(S, 'أتممتَ مرحلة «' + st.title + '»', 'good'); S.pause = true; }
  L.stage = st.n + 1; const next = STAGES[L.stage - 1]; L.level = next ? next.source : 11;
  L.stageProfit0 = L.ev.profit || 0; L.stageStartDay = S.day;
}
function lifeMigrate(S) {
  const L = S.learn; if (!L || !L.char) return;
  if (!L.ageStages) {
    const stage = STAGES.find(x => x.source === L.level);
    L.ageStages = 1; L.stage = stage ? stage.n : STAGES.length + 1;
    L.stageDone = STAGES.filter(x => x.source < L.level).map(x => x.n);
    L.done = L.stage - 1; L.doneDay = S.day; L.stageIntro = (L.intro >= L.level ? L.stage : L.stage - 1); L.stageUp = [];
    L.ageOffset = Math.min(92, 25 + S.day / AGE_YEAR) - (25 + S.day / AGE_YEAR);
    L.stageProfit0 = (L.ev && L.ev.profit) || 0; L.rest = null;
    // لا إعادة منح أي مكافأة سبق تحصيلها.
  }
  if (S.away && !Number.isFinite(S.away.t)) delete S.away;
  const j = S.awayJob, cap = AWAY_MAX_HOURS * 3600 / AWAY_SEC_PER_DAY;
  if (j && (!Number.isInteger(j.wanted) || j.wanted < 1 || j.wanted > cap || !Number.isInteger(j.remaining) || j.remaining < 0 || j.remaining > j.wanted || !Number.isFinite(j.first) || j.first > S.day || !Number.isFinite(j.before))) delete S.awayJob;
  agingMigrate(S);
}
function lifeDay(S) { agingDay(S); }
function setCaptainAuto(S, enabled) {
  if (!S.learn || !S.learn.char) return NO('اختر شخصيتك أولاً');
  if (enabled && !S.player.caravans.some(c => c.captain && c.route)) return NO('عيّن قائداً وحدد له مساراً أولاً');
  S.captainAuto = !!enabled; if (!enabled) delete S.away;
  return OK(enabled ? 'يعمل القادة على مساراتهم بالسرعة العادية' : 'توقف التشغيل التلقائي');
}
function awayStart(S, now) { if (S.captainAuto && S.learn && S.learn.char && !S.awayJob) { if (!S.away) S.away = { t: now == null ? Date.now() : now }; } }
function awayBegin(S, now) {
  if (S.awayJob) return S.awayJob;
  const mark = S.away; delete S.away;
  if (!mark || !Number.isFinite(mark.t) || !S.captainAuto || !S.learn || !S.learn.char) return null;
  const elapsed = Math.max(0, Math.min(AWAY_MAX_HOURS * 3600000, (now == null ? Date.now() : now) - mark.t));
  const wanted = Math.floor(elapsed / (AWAY_SEC_PER_DAY * 1000)); if (!wanted) return null;
  delete S.awayReport;
  return S.awayJob = { wanted, remaining: wanted, first: S.day, before: liquid(S) };
}
function awayAdvance(S, limit) {
  const job = S.awayJob; if (!job) return true; if (S.life && S.life.pending) return false; delete job.paused;
  S.awaySim = true;
  try { for (let n = 0; n < Math.min(1000, Math.max(1, limit || 25)) && job.remaining > 0; n++) {
    tick(S); job.remaining--; if (S.life && S.life.pending) { job.paused = true; break; } if (S.road) { job.remaining = 0; break; }
  } } finally { delete S.awaySim; }
  if (job.remaining > 0) return false;
  S.awayReport = { days: S.day - job.first, change: liquid(S) - job.before, events: (S.news || []).filter(n => n.d > job.first).slice(0, 12).map(n => n.t) };
  delete S.awayJob; return true;
}
function awayResume(S, now) {
  if (!awayBegin(S, now)) return null;
  while (S.awayJob) { awayAdvance(S, 500); if (S.life && S.life.pending) break; }
  return S.awayReport;
}

/* نسخ جديدة للأعمار؛ الأصول الأصلية لا تُستبدل. */
const BOSS_ELDER_AGE = 85;
function charArtStage(S) { if (S.legacy && S.legacy.retired) return '_heir'; const a = ageOf(S); return a >= 70 ? '_old' : a >= 40 ? '_mid' : ''; }
function bossArtStage(S) { return S.legacy && S.legacy.retired ? '_heir' : ageOf(S) >= BOSS_ELDER_AGE ? '_old' : ''; }
function mentorOf(S) {
  const son = S && ((S.life && S.life.mentorSon) || (S.legacy && S.legacy.retired));
  return son ? { id: 'mentor2', name: 'عبد الله بن سالم', role: 'المرشد', img: 'hero/mentor2', tone: 'وقور' } : LS.MENTOR;
}
/* النصوص المعتمدة: docs/review/APPROVED_AGING_TEXTS.md، بلا إعادة صياغة. */
const LIFE_TEXTS = {
  "retirement": "يا بني، قطعتُ في دروب التجارة عمراً طويلاً، وخضتُ غمار الأسواق بين ربحٍ وعثار؛ فعلّمتني الأيامُ أن أثمن ما يجنيه التاجر ليس كثرة الدراهم، بل طيب السمعة وبركة الحلال.\nواليوم، أسلمك راية القافلة ومفاتيح الدكاكين، راجياً أن تواصل المسير بعزمٍ أشد وخلقٍ أرسخ؛ فاحفظ وصايا آبائك، واجعل تقوى الله بضاعتك الأولى في كل بيعٍ وشراء.",
  "waqf": "الوقف هو تحبيسُ أصلِ المال (كدكانٍ أو بستانٍ أو دار) والتبرّعُ بريعه ومنافعه لوجوه الخير والبر. وهو صدقةٌ جارية لا تباع ولا توهب ولا تورث، بل يستمر ثوابها لصاحبها بعد موته ما دامت العين قائمة. وقد قال النبي ﷺ: إذا مات الإنسان انقطع عنه عمله إلا من ثلاثة: إلا من صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له (رواه مسلم).",
  "will": "الوصية هي تبرّع الإنسان بجزء من ماله لجهات الخير أو لغير الورثة، ويكون تنفيذها بعد وفاته. وقد حددها الشرع بما لا يزيد عن ثلث المال؛ لقول النبي ﷺ لسعد بن أبي وقاص رضي الله عنه: الثلث، والثلث كثير، إنك أن تذر ورثتك أغنياء خير من أن تذرهم عالة يتكففون الناس (متفق عليه). كما لا تجوز الوصية لأحد الورثة؛ لقوله ﷺ: إن الله قد أعطى كل ذي حق حقه فلا وصية لوارث (رواه أصحاب السنن وحسنه الترمذي).",
  "inheritance": "الميراث هو قسمة أموال التاجر وأملاكه بعد وفاته وتجهيزه وسداد ديونه وتنفيذ وصيته المعتبرة. وهو توزيعٌ رباني حكيم تولى الله تعالى بيانه في كتابه الكريم، ليعطي كل قريب نصيبه العادل دون زيادة أو حرمان.",
  "waqfConfirmed": "تم حبس الأصل وتسبيل المنفعة لوجه الله تعالى صدقةً جارية دائمة الأجر.",
  "willConfirmed": "تم قيد الوصية وحفظها في حدود الثلث الشرعي لتُنَفَّذ في وجوه البر.",
  "fatherFarewell": "استودعتُ الله تجارتك ومسيرتك يا بني، فكن أميناً في الكيل، سمحاً في البيع، باراً بالفقراء.",
  "fatigue": [
    "ثقلت خطاي يا بني وخبت قوة بدني، وما عدتُ أطيق وعثاء السفر وغبار القوافل كما عهدتني.",
    "شارفتُ على ختام شوطي في هذه الأسواق، وحسب الشيخ من دنياه أن يسلّم الأمانة لمن يحفظها.",
    "أستودعك اليوم حكمة السنين، فقد حان لراحلة عمك أن تحط رحالها وتستريح."
  ],
  "salemFarewell": "يا صاحب السوق ورفيق الدروب،\nما تركتك لقلة ود، وإنما هو أجلٌ أتى وأوان استراحة قد حان. صحبتك من أول درهم جنيته وأول قافلة أطلقتها، فرأيت فيك عزيمة التاجر النبيل وأمانة المسلم الصدوق.\nلا تغرنك كثرة الأرباح إن خالطتها شائبة، ولا يحزنك كساد يوم فإن الرزق مقسوم والبركة مع الصدق. تركت لك ابني ليكون عوناً وناصحاً على دربي، وأبقيت لكم وقفاً ينشر العلم ويغيث المحتاجين في هذه الحاضرة.\nاستودعكم الله الذي لا تضيع ودائعه، واذكروا عمكم بدعوة صالحة في مظان الإجابة.",
  "salemPassing": "انتقل إلى رحمة الله عمنا ومستشارنا الحكيم (سالم). إنا لله وإنا إليه راجعون؛ نسأل الله أن يغفر له، ويرفع درجاته في الصالحين، ويجعل ما بذله من علمٍ ونصحٍ ونفعٍ في موازين حسناته.",
  "salemLastWish": "وصيتي لكم حفظ الأمانة في المعاملات، والتسامح عند العثرات، والمسارعة إلى أداء حق الفقراء طيبةً بها نفوسكم.",
  "salemWaqf": "وقف عمّ سالم: مساهمةٌ خيرية جارية تستقطع (10%) من صافي أرباح دكانك الذي تخصصه، يُصرف ريعها دورياً لكفالة طلاب العلم والأيتام من أبناء التجار المتعثرين.",
  "salemWaqfAnnual": "أثمر وقف عمّ سالم هذا الحول مبلغ {amount} ريال من أرباح متجرك، جرى توزيعها بالكامل في وجوه البر.",
  "loyalBadge": "شارة وفيّ: وفاءً لذكرى الشيخ سالم، وعملاً بعهده في إعمار الوقف ونشر البركة.",
  "sonIntroduction": [
    "أنا عبد الله بن سالم، نشأت على موائد نصحه وتشربت أصول تجارته منذ صباي.",
    "جئتكم حاملاً وصية والدي وعهده في صحبة قوافلكم والوقوف إلى جواركم في الأسواق.",
    "لن تجدوا مني إلا الصدق والنصح الأمين الذي عهدتموه من أبي رحمه الله."
  ],
  "wisdom": [
    "أصل الربح يُبنى عند حسن الشراء، لا عند التعجل في البيع.",
    "التاجر السمح يربح القلوب قبل أن يربح الدراهم.",
    "درهمٌ حلال فيه بركة خيرٌ من ملء كيسٍ تعلوه الشبهات.",
    "احسب نفقات الدرب ومؤن الطريق قبل أن تفرح بفارق السعر.",
    "لا تضع بضاعتك كلها في مركب واحد، فالتنويع درع الأمان.",
    "لا تؤخر قضاء حقٍّ وأنت قادرٌ على وفائه؛ فالتسويف مع القدرة جورٌ يذهب بالمروءة وينزع الثقة.",
    "إخراج الزكاة نماءٌ للمال وحصنٌ له، وما طاب كسبُ تاجرٍ بمثل بذل الحقوق لأهلها.",
    "اذكر للمشتري ما في المتاع من نقصٍ دون مواربة؛ فوضوح المعاملة أرسخُ للبركة وأبقى للذكر الطيب.",
    "السيولة الراكدة كحملٍ ثقيل بلا مسير؛ اجعل مالك عاملاً بحكمة.",
    "السوق يتقلب بين رخاء وشدة، والحصيف من ادخر في زمن السعة."
  ],
  "heirWelcome": "أهلاً بك يا وريث الهمة والأمانة؛ يسعدني أن أسير معك على خطى آبائنا لنكمل قصة النجاح معاً.",
  "bossElder": [
    "أثقلت السنون كاهل كبير التجار، فبات يعتمد على ساعد ابنه الفتي في تصريف شؤون السوق.",
    "يقف الابن إلى جوار والده في الساحة، يتعلم منه خفايا الأسعار وحسن التدبير.",
    "أوكل القائد إلى نجله الإشراف على واردات القوافل ودفاتر الحسابات ليتمرس في القيادة.",
    "حين يمتزج حزم الشيوخ بنشاط الشباب، تزدهر المتاجر وتستقر المعاملات.",
    "يسلّم الجيل الراحل خبرة العقود لجيل المستقبل، لتبقى راية التجارة خفاقة في هذه الديار."
  ],
  "succession": "تولى الشاب {heirName} قيادة متجر والده في سوق {marketName}، معلناً بداية عهدٍ جديدٍ من النماء والنشاط.",
  "bossHeirMeeting": "مرحباً بكم في متجرنا؛ أسير على نهج والدي في الصدق ورعاية حقوق الشركاء والزبائن، ويدي ممدودة لكم بكل صفقةٍ طيبة."
};
/* انتقال الأمانة: النصوص في LIFE_TEXTS من المراجع حرفياً. لا وفاة للتاجر ولا قسمة ميراث عند تقاعده. */
const SALEM_PASSES_AGE = 62, HEIR_TRUST = 0.6, SALEM_WAQF_PCT = 0.10;
const BOSS_HEIRS = { riyadh: ['سعيد','ماجد الراجح'], jeddah: ['أحمد','أبي سالم البحّار'], hail: ['ناصر','شمّر الجمّال'], jazan: ['عامر','عيسى المهري'], mecca: ['محمد','عبدالعزيز المكّي'], medina: ['عبد الرحمن','إبراهيم المدني'], cairo: ['ظافر','منصور الأنصاري'], alex: ['عمر','سيد درويش الريّس'], aswan: ['حمود','صابر النوبي'], isfahan: ['آرش','بهرام التاجر'], shiraz: ['بهرام','كاوه'], tabriz: ['كاوه','آرش'], delhi: ['راجيش','ماهيش لال'], mumbai: ['ديباك','راجيش شاه'], kolkata: ['ماهيش','ديباك داس'], xian: ['تشن هاو','وانغ لي'], guangzhou: ['لين فاي','تشن هاو'], shanghai: ['وانغ لي','لين فاي'] };
const lifeOf = S => S.life || (S.life = {});
function agingMigrate(S) {
  if (!S.learn || !S.learn.char) return;
  const L = lifeOf(S);
  if ((S.legacy && S.legacy.retired) || ageOf(S) >= SALEM_PASSES_AGE) { if (!L.mentorSon) { L.mentorSon = true; L.passedAt = S.day; L.farewellSeen = true; } }
  checkLifeEvents(S);
}
function checkLifeEvents(S) {
  if (!S.learn || !S.learn.char) return;
  const L = lifeOf(S), age = ageOf(S); if (S.legacy && S.legacy.retired) return;
  if (age >= SALEM_PASSES_AGE && !L.mentorSon) { L.mentorSon = true; L.passedAt = S.day; L.pending = 'salem'; news(S, LIFE_TEXTS.salemPassing); S.pause = true; }
  if (!L.mentorSon && age >= 58) {
    L.fatigue = L.fatigue || [];
    for (const [i, at] of [58,60,61].entries()) if (age >= at && !L.fatigue.includes(i)) { L.fatigue.push(i); news(S, LIFE_TEXTS.fatigue[i]); }
  }
  if (age >= BOSS_ELDER_AGE && !L.bossElders) { L.bossElders = true; news(S, LIFE_TEXTS.bossElder[0]); }
  if (age >= RETIRE_AGE && !L.pending) { L.pending = 'retire'; S.pause = true; }
}
function lifeBooks(S) {
  return [S.life && S.life.salemWaqf, S.legacy && S.legacy.waqf].filter(w => w && w.type === 'shop');
}
function reserveWaqf(S, w) {
  const target = Math.max(0,w.net) * w.pct, delta = target - w.balance;
  if (delta > 0) { const n = Math.min(Math.max(0,S.player.gold),delta); S.player.gold -= n; w.balance += n; }
  else if (delta < 0) { S.player.gold -= delta; w.balance = target; }
}
function recordShopNet(S, city, shop, net) {
  for (const w of lifeBooks(S)) if (w.city === city && w.shop === shop.id) { w.net += net; reserveWaqf(S,w); }
}
function annualWaqf(S,w) {
  if (S.day - w.start < hawlLen(S,w.start)) return;
  const amount = Math.max(0,w.net) * w.pct, paid = Math.min(w.balance,amount);
  w.arrears += amount - paid; w.balance -= paid;
  if (paid > 0) { sink(S,'charity',paid); S.player.led.exp.charity = (S.player.led.exp.charity || 0) + paid; }
  w.hist.unshift({day:S.day,net:w.net,assessed:amount,paid,arrears:w.arrears});w.hist=w.hist.slice(0,20);
  if (w.salem && paid > 0) { news(S,LIFE_TEXTS.salemWaqfAnnual.replace('{amount}',fmtN(paid)),'good'); S.news[0].waqfPaid = paid; }
  w.start=S.day;w.net=0; // الرصيد غير المصروف يبقى حقيقياً في سجل الوقف.
}
function capitalWaqfDay(S,w) {
  const c=S.cities[w.city]; if(!c || !(w.capital > 0)) return;
  const prosperity=clamp(((c.pop[2]+c.pop[3])/popTotal(c))*2*.5+c.sat.food*.5,0,1);
  const gross=w.capital*(.0004+.0008*prosperity)*(c.ev&&c.ev.k==='war'?1.8:1)*(.5+rndB(S))*(S.awaySim?AWAY_YIELD:1);
  if(rndB(S)<FIN.mud.setback*(S.awaySim?AWAY_RISK:1)) { const loss=w.capital*FIN.mud.loss;w.capital-=loss;sink(S,'waqfInvestmentLoss',loss); }
  else {w.capital+=gross;fauc(S,'waqfInvestment',gross);}
  if(S.day-w.start<hawlLen(S,w.start))return;
  const paid=Math.max(0,w.capital-w.principal);w.capital-=paid;if(paid>0)sink(S,'charity',paid);
  w.hist.unshift({day:S.day,net:w.capital+paid-w.principal,assessed:paid,paid,arrears:0});w.hist=w.hist.slice(0,20);w.start=S.day;
}
function agingDay(S) {
  if(!S.learn||!S.learn.char)return;
  checkLifeEvents(S);
  for(const w of lifeBooks(S)) annualWaqf(S,w);
  const w=S.legacy&&S.legacy.waqf;if(w&&w.type==='capital')capitalWaqfDay(S,w);
}
function newShopWaqf(S,city,shop,pct,salem) {return {type:'shop',city,shop,pct,salem:!!salem,start:S.day,net:0,balance:0,arrears:0,hist:[]};}
function setSalemWaqf(S,city,shopId) {
  const L=lifeOf(S),sh=shopsOf(S,city).find(x=>x.id===+shopId);
  if(!L.mentorSon)return NO('لم يُفتح هذا الخيار بعد');
  if(L.salemWaqf)return NO('الدكان المخصص محفوظ في سجل الوقف');
  if(!sh||shKind(sh)!=='own'||sh.endowed)return NO('اختر دكاناً تملكه وغير موقوف');
  L.salemWaqf=newShopWaqf(S,city,sh.id,SALEM_WAQF_PCT,true);L.loyal=true;return OK(LIFE_TEXTS.loyalBadge);
}
function payWaqfArrears(S,which) {
  const w=which==='salem'?S.life&&S.life.salemWaqf:S.legacy&&S.legacy.waqf;
  if(!w||!(w.arrears>0))return NO('لا مبلغ متأخر');
  const paid=pPay(S,'charity',w.arrears,true);w.arrears-=paid;return paid>0?OK('صُرف '+fmtN(paid)+' ريال'):NO('لا رصيد كافٍ');
}
function acknowledgeLife(S) {
  const L=lifeOf(S);if(L.pending!=='salem')return NO('لا رسالة معلّقة');
  L.farewellSeen=true;delete L.pending;checkLifeEvents(S);return OK(LIFE_TEXTS.sonIntroduction[0]);
}
function retirementSummary(S) {
  const P=S.player;
  return {name:P.name||LS.CHARS.find(x=>x.id===S.learn.char)?.name||'التاجر',age:Math.floor(ageOf(S)),wealth:netWorth(S),shops:Object.values(P.props).reduce((a,p)=>a+p.shops.length,0),trips:P.trips||0,achievements:Object.keys(S.ach&&S.ach.got||{}),zakat:S.zakat&&S.zakat.paid||0,day:S.day};
}
function succession(S) {
  for(const id of S.order){const bs=bossOf(S,id);if(!bs||bs.father)continue;
    const spec=BOSS_HEIRS[id];if(!spec)continue;
    bs.father={name:bs.name,trust:bs.trust,lore:(S.learn.lore||{})[id]||0};bs.name=spec[0]+' بن '+spec[1];bs.trust*=HEIR_TRUST;bs.temper=.9;bs.heirGreetingRead=false;
    const text=LIFE_TEXTS.succession.replace('{heirName}',bs.name).replace('{marketName}',S.cities[id].name); news(S,text,'good'); (lifeOf(S).successionNotices||(lifeOf(S).successionNotices=[])).push({id:'generation:'+S.day+':'+id,city:id,text,day:S.day,read:false});
  }
}
function retirementDraft(S,plan) {
  if(!S.learn||!S.learn.char||S.legacy&&S.legacy.retired)return NO('انتقال الأمانة مرة واحدة');
  if(ageOf(S)<RETIRE_AGE)return NO('لم يبلغ التاجر عمر التقاعد');
  const name=String(plan.name||'سهيل').trim(),will=String(plan.will||'').trim(),willPct=Number(plan.willPct||0),pct=Number(plan.pct||0);
  if(!name||name.length>32||will.length>400||!Number.isFinite(pct)||pct<0||pct>100||!Number.isFinite(willPct)||willPct<0||willPct>100/3)return NO('راجع الاسم والوصية والنسبة');
  const before=retirementSummary(S),goods=plan.sellGoods||[],soldShops=plan.sellShops||[];if(!Array.isArray(goods)||!Array.isArray(soldShops))return NO('اختيار البيع غير صحيح');
  if(new Set(goods.map(x=>x.car+':'+x.g+':'+(x.mode||''))).size!==goods.length||new Set(soldShops.map(x=>x.city+':'+x.shop)).size!==soldShops.length)return NO('لا تكرر الأصل نفسه');
  for(const x of goods){const c=S.player.caravans.find(y=>y.id===+x.car),q=c&&Math.floor((x.mode==='herd'?c.herd:c.cargo)?.[x.g]||0);if(!c||c.left>0||q<1||!GD[x.g])return NO('تعذّر بيع بضاعة مختارة');const r=A.sell(S,c.id,x.g,q,x.mode);if(!r.ok)return r;}
  for(const x of soldShops){const p=S.player.props[x.city],sh=p&&p.shops.find(y=>y.id===+x.shop),sw=S.life&&S.life.salemWaqf;
    if(!sh||shKind(sh)!=='own'||sh.endowed||sw&&sw.city===x.city&&sw.shop===sh.id)return NO('لا يُباع الدكان المخصص للوقف');
    p.shops=p.shops.filter(y=>y!==sh);S.player.gold+=1000;fauc(S,'retirementAssetSale',1000);
  }
  let waqf=null;
  if(plan.shop){if(pct>0)return NO('اختر نسبة نقدية أو دكاناً');const {city,shop}=plan.shop,sh=shopsOf(S,city).find(x=>x.id===+shop),sw=S.life&&S.life.salemWaqf;
    if(!sh||shKind(sh)!=='own'||sh.endowed||sw&&sw.city===city&&sw.shop===sh.id)return NO('الدكان غير متاح للوقف');
    sh.endowed=true;waqf=newShopWaqf(S,city,sh.id,1,false);
  }else if(pct>0){const principal=before.wealth*pct/100;if(!(principal>0)||S.player.gold+1e-6<principal)return NO('النقد لا يكفي للنسبة المختارة؛ عدّل النسبة أو ما تبيعه');S.player.gold-=principal;waqf={type:'capital',principal,capital:principal,city:mainCar(S).city,start:S.day,hist:[]};}
  S.legacy={retired:true,heirAge:25,father:Object.assign({alive:true,char:S.learn.char},before),heirName:name,will:{text:will,pct:willPct,beneficiary:'charity',executed:false},waqf,decisions:{pct,shop:plan.shop||null,sellGoods:goods,sellShops:soldShops},at:S.day};
  S.player.name=name;S.learn.level=11;S.learn.stage=STAGES.length+1;S.learn.stageIntro=STAGES.length;S.learn.rest=null;for(const k of ['stageUp','up','sq','tq','bq','csq','cq','fq','eq','rq'])S.learn[k]=[];
  const L=lifeOf(S);L.mentorSon=true;delete L.pending;succession(S);news(S,LIFE_TEXTS.fatherFarewell,'good');S.pause=true;
  return OK(LIFE_TEXTS.heirWelcome);
}
function retirePlayer(S,plan) {
  // المسودة مستقلة: أي رفض يترك المحفظة والأصول والعقود وحالة المولد كما كانت.
  const T=load(save(S));const result=retirementDraft(T,plan||{});if(!result.ok)return result;
  Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,T);attachWallet(S);return result;
}
function elderBossText(S,id) {
  const bs=bossOf(S,id);if(!bs)return '';
  if(bs.father)return bs.heirGreetingRead?'':LIFE_TEXTS.bossHeirMeeting;
  return ageOf(S)>=BOSS_ELDER_AGE&&(S.day+S.order.indexOf(id))%3===0?LIFE_TEXTS.bossElder[Math.floor(S.day/30)%LIFE_TEXTS.bossElder.length]:'';
}
function mentorWisdom(S,key) {
  if(mentorOf(S).id!=='mentor2')return null;
  const map={loss:9,broke:9,noSeller:8,profit:1,bigProfit:0,customs:3,crossed:3,arrive:3,zakatDue:6,mdLate:5,instLate:5,debtfree:5,mudLoss:4,defect:7,defectFound:7,brokerNo:2,opp:0,idle:8,concentrated:4,opportunity:0,wageLate:5};
  return key in map?'كما كان يقول أبي: '+LIFE_TEXTS.wisdom[map[key]]:null;
}
Object.assign(A,{setSalemWaqf,payWaqfArrears,acknowledgeLife,retire:retirePlayer,ackBossHeir(S,id){const b=bossOf(S,id);if(!b||!b.father)return NO('لا رسالة');b.heirGreetingRead=true;return OK('حُفظ اللقاء في دفتر السوق');}});

function retirementQuote(S,plan) { const T=load(save(S)),r=retirementDraft(T,plan||{});return r.ok?Object.assign(r,{wealth:netWorth(T),cash:liquid(T)}):r; }
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
  g_sea: S => shipsOf(S).length > 0, g_harbor: S => (S.player.seaTrips || 0) >= 1, g_monsoon: S => (S.player.seaTrips || 0) >= 2,
  g_stormsea: S => seaStat(S).storm >= 1, g_pirsea: S => seaStat(S).pirates >= 1, f_qirad: S => (S.player.seaTrips || 0) >= 3,
  g_port_jeddah: S => !!seaStat(S).ports.jeddah, g_port_jazan: S => !!seaStat(S).ports.jazan, g_port_alex: S => !!seaStat(S).ports.alex, g_port_mumbai: S => !!seaStat(S).ports.mumbai,
  g_port_kolkata: S => !!seaStat(S).ports.kolkata, g_port_guangzhou: S => !!seaStat(S).ports.guangzhou, g_port_shanghai: S => !!seaStat(S).ports.shanghai,
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
/* مناخ القطاعات: مستقل عن مولّد أحداث العالم، ولا يغيّر أسعار الشراء أو تكاليف التشغيل. */
const CLIMATE_AMPLITUDE=.005, CLIMATE_MIN=1-CLIMATE_AMPLITUDE, CLIMATE_MAX=1+CLIMATE_AMPLITUDE, CLIMATE_BLEND_DAYS=30, CLIMATE_YEAR=354;
const CLIMATE_SECTORS=['shops','trade','auto','farm','factory'];
const CLIMATE_NAMES={shops:'الدكاكين والبسطات',trade:'التجارة المباشرة',auto:'قوافل القادة',farm:'المزارع والمسالخ',factory:'المصانع'};
const climateOn=S=>!!(S.learn&&S.learn.char&&!S.noShocks&&!S.noClimate);
const climateEmpty=()=>Object.fromEntries(CLIMATE_SECTORS.map(k=>[k,0]));
function climateHash(seed,year,key) {let h=(seed>>>0)^Math.imul(year+1,0x9e3779b1);for(let i=0;i<key.length;i++){h=Math.imul(h^key.charCodeAt(i),16777619);h^=h>>>13;}h=Math.imul(h^(h>>>16),0x85ebca6b);return ((h^(h>>>13))>>>0)/4294967296;}
function climateNormalize(raw,lo,hi) {
  const keys=Object.keys(raw),avg=keys.reduce((a,k)=>a+raw[k],0)/keys.length,r=Object.fromEntries(keys.map(k=>[k,clamp(raw[k]/avg,lo,hi)]));
  // إعادة توزيع أثر القص على العناصر غير المقيدة، حتى يبقى المتوسط واحداً فعلاً.
  for(let n=0;n<10;n++){const d=keys.length-keys.reduce((a,k)=>a+r[k],0);if(Math.abs(d)<1e-12)break;const free=keys.filter(k=>d>0?r[k]<hi-1e-12:r[k]>lo+1e-12);if(!free.length)break;for(const k of free)r[k]=clamp(r[k]+d/free.length,lo,hi);}return r;
}
function climateRoll(S,year) {
  const seed=S.climateSeed==null?S.seed:S.climateSeed;year=S.noShocks||S.noClimate?0:year;
  // كل دورة خماسية تعادل حظوظ القطاعات والأقاليم عبر الزمن أيضاً؛ تمنع توالي الضعف لقطاع طوال مسيرة قصيرة.
  const block=Math.floor(Math.max(0,year-1)/5),offset=Math.max(0,year-1)%5;
  function layer(keys,lo,hi,prefix){const order=keys.slice().sort((a,b)=>climateHash(seed,block,prefix+'order:'+a)-climateHash(seed,block,prefix+'order:'+b)),base=climateNormalize(Object.fromEntries(keys.map(k=>[k,lo+(hi-lo)*climateHash(seed,block,prefix+'value:'+k)])),lo,hi);return Object.fromEntries(order.map((k,i)=>[k,year>0?base[order[(i+offset)%keys.length]]:1]));}
  return {cur:layer(CLIMATE_SECTORS,CLIMATE_MIN,CLIMATE_MAX,'sector:'),reg:layer(['sa','eg','ir','in','cn'],1-CLIMATE_AMPLITUDE/4,1+CLIMATE_AMPLITUDE/4,'region:')};
}
function climateInit(S) {
  if(S.climateSeed==null)S.climateSeed=S.seed>>>0;
  if(!S.climate){const year=Math.floor(S.day/CLIMATE_YEAR),r=climateRoll(S,year),p=climateRoll(S,Math.max(0,year-1));S.climate={year,cur:r.cur,prev:p.cur,reg:r.reg,prevReg:p.reg,balance:3,hist:[],income:climateEmpty(),notices:[],hint:[],pending:[]};}
  if(S.climate.balance!==3){const C=S.climate,r=climateRoll(S,C.year),p=climateRoll(S,Math.max(0,C.year-1));Object.assign(C,{balance:3,cur:r.cur,prev:p.cur,reg:r.reg,prevReg:p.reg});}
  return S.climate;
}
function climateFactor(S,sector,city) {
  if(!climateOn(S)||!CLIMATE_SECTORS.includes(sector))return 1;
  const year=Math.floor(S.day/CLIMATE_YEAR),C=S.climate&&S.climate.year===year?S.climate:null,r=C||climateRoll(S,year),p=C?{cur:C.prev,reg:C.prevReg}:climateRoll(S,Math.max(0,year-1)),b=clamp((S.day%CLIMATE_YEAR)/CLIMATE_BLEND_DAYS,0,1),country=S.cities[city]?.country||city||S.home;
  const cur=clamp((r.cur[sector]||1)*(r.reg[country]||1),.7,1.5),prev=clamp((p.cur[sector]||1)*(p.reg[country]||1),.7,1.5);return prev+(cur-prev)*b;
}
const climateSaleMul=(S,source,city)=>source==='trade'||source==='auto'?climateFactor(S,source,city):1;
const climateBasisCost=(basis,n)=>basis&&typeof basis==='object'?(basis.q>0?(basis.c||0)*Math.min(n,basis.q)/basis.q:0):Math.max(0,Number(basis)||0)*n;
function climateSaleGross(S,source,city,gross,tr,cost) {
  const factor=climateSaleMul(S,source,city);if(factor===1||!(tr<1))return gross;
  // على ربح الصفقة الكلي بعد الشراء ورسوم البيع، لا على رأس المال ولا على ربح كل وحدة منفردة.
  // لذلك لا يصنع المناخ ربحاً من دورة شراء وبيع خاسرة في السوق نفسه.
  const profit=Math.max(0,gross*(1-tr)-Math.max(0,Number(cost)||0));return gross+profit*(factor-1)/(1-tr);
}
const climateRisk=(S,sector,city)=>{if(!climateOn(S))return 1;const year=Math.floor(S.day/CLIMATE_YEAR),cur=S.climate&&S.climate.year===year?S.climate.cur:climateRoll(S,year).cur;return cur[sector]<.9?.7:1;};
function climateShockRisk(S,key) {const map={closure:['trade','auto'],banditwave:['trade','auto'],pirates:['trade','auto'],sickness:['trade','auto'],drought:['farm'],flood:['farm'],famine:['farm'],fire:['shops','factory'],taxraid:['shops'],dump:['trade','shops','factory'],monopoly:['trade','shops']};return (map[key]||[]).some(k=>climateRisk(S,k)<1)?.7:1;}
function climateIncome(S,sector,amount) {if(!S.learn||!S.learn.char||!CLIMATE_SECTORS.includes(sector)||!Number.isFinite(amount)||amount<=0)return;const C=climateInit(S);C.income[sector]=(C.income[sector]||0)+amount;}
function climateYearEnd(S,C) {
  const ranked=CLIMATE_SECTORS.slice().sort((a,b)=>C.cur[b]-C.cur[a]),prior=C.hist[0];
  const row={year:C.year+1,income:Object.assign(climateEmpty(),C.income),previous:prior?Object.assign({},prior.income):null,strong:ranked[0],weak:ranked.at(-1),factors:Object.assign({},C.cur)};
  C.hist.unshift(row);C.hist=C.hist.slice(0,5);if(climateOn(S))C.pending.push(row.year);C.pending=C.pending.filter(y=>C.hist.some(x=>x.year===y));
  if(!C.lesson&&C.cur[row.strong]-C.cur[row.weak]>(CLIMATE_MAX-CLIMATE_MIN)/3){C.lesson=true;row.wisdom=[LIFE_TEXTS.wisdom[4],LIFE_TEXTS.wisdom[9]];}
}
const CLIMATE_STRONG=['تشهد حركة {sector} نشاطاً ملحوظاً وإقبالاً وافراً هذا العام.','يتوقع أهل السوق رواجاً طيباً في قطاع {sector} طوال الموسم.','تبدو أرباح {sector} واعدة ومبشرة بمزيد من النماء هذه السنة.'],CLIMATE_WEAK=['يميل نشاط {sector} إلى الهدوء والركود الحذر هذا العام.','يتحدث التجار عن تراجع الطلب على {sector} في هذه الفترة.','تتسم حركة {sector} بالفتور مقارنةً ببقية أسواق الحاضرة.'];
function climateDay(S) {
  const C=climateInit(S),year=Math.floor(S.day/CLIMATE_YEAR);
  if(year!==C.year){if(year===C.year+1&&S.learn&&S.learn.char)climateYearEnd(S,C);const p=climateRoll(S,Math.max(0,year-1)),r=climateRoll(S,year);C.year=year;C.prev=p.cur;C.cur=r.cur;C.prevReg=p.reg;C.reg=r.reg;C.income=climateEmpty();C.hint=[];}
  if(!climateOn(S)||year===0)return;
  const d=S.day%CLIMATE_YEAR,ranked=CLIMATE_SECTORS.slice().sort((a,b)=>C.cur[b]-C.cur[a]);
  for(const [i,at] of [45,90].entries())if(d>=at&&!C.hint.includes(i)&&d<120){C.hint.push(i);const sector=i?ranked.at(-1):ranked[0];
    // نصوص معتمدة من المراجع: docs/review/APPROVED_CLIMATE_TEXTS.md
    const forms=i?CLIMATE_WEAK:CLIMATE_STRONG,text=forms[(year+CLIMATE_SECTORS.indexOf(sector))%forms.length].replace('{sector}',CLIMATE_NAMES[sector]);
    const n={id:'climate:'+year+':'+i,year:year+1,day:S.day,text,read:false,sector};C.notices.push(n);C.notices=C.notices.slice(-10);news(S,text,i?'':'good');}
}
Object.assign(A,{climateClose(S,year){const C=climateInit(S);C.pending=C.pending.filter(y=>y!==+year);return OK('حُفظ تقرير السنة في ملف التاجر');},climateRead(S,id){const n=climateInit(S).notices.find(n=>n.id===id);if(n)n.read=true;return OK('تمت القراءة');}});
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
const API = { earlyQardQuote, EARLY_QARD, tradeRestartQuote, cityAssetQuote, assetQuote, ASSET_SALE_FACTORS, paymentHistory, LOCAL_FACTORY_BATCHES, LOCAL_FACTORY_UPKEEP, LOCAL_FACTORY_YIELD, CLIMATE_MIN, CLIMATE_MAX, CLIMATE_BLEND_DAYS, CLIMATE_YEAR, CLIMATE_NAMES, CLIMATE_SECTORS, climateHash, climateRoll, climateInit, climateFactor, climateSaleGross, climateRisk, climateShockRisk, climateDay, climateIncome, shopsDay, farmDay, factoryDay, butcherDay, LIFE_TEXTS, SALEM_PASSES_AGE, HEIR_TRUST, SALEM_WAQF_PCT, BOSS_HEIRS, agingDay, agingMigrate, checkLifeEvents, recordShopNet, lifeBooks, retirementSummary, retirementQuote, elderBossText, mentorWisdom, BOSS_ELDER_AGE, charArtStage, bossArtStage, mentorOf, STAGES, AGE_YEAR, RETIRE_AGE, STAGE_BONUS_MAX, STAGE_GAP_MIN, AWAY_SEC_PER_DAY, AWAY_MAX_HOURS, AWAY_YIELD, AWAY_RISK, ageOf, stageOf, stageStatus, stageCheck, lifeMigrate, awayStart, awayBegin, awayAdvance, awayResume, setCaptainAuto, shopProsper, RETAIL_BASE, shopPnl, SHOP_DEMAND, SHOP_PRICE0, fleetReport, shopReport, shopCarry, BARAKA_TIERS, barakaTier, barakaGuard, banditFight, WAGE, staffWage, candWage, CAL: Object.assign(CAL, { gregToJd, jdToGreg, hijriToJd, jdToHijri, nextHijri, jdStr, HMONTHS, GMONTHS, yearName }), dateOf, hawlLen, dayOfHijri, seasonsAt, seasonsOn, fxMode, buyBudget, FXM, cxOf, seasonCalendar, isSacred, sacredMul, SACRED_RISK, MARKETS_NOTE, defectClaim, DEFECT, anDue, anAssess, anPrice, AN_ITEM, FIQH, routePath, routeLen, buyPack, PACE, paceQuote, packPrice, packUnits, paceSec, seaStat, SHIP_UP, SEA_ROLES, SAILOR_FEE, SAILOR_WAGE, seaCaptainPool, seaExtra, shipUp, shipCrew, shipNav, PORTS, SEA, SHIPS, isPort, shipsOf, shipAt, shipOf, monsoonOf, seaPlan, seaDays, LOCAL, localRate, HG_CULT, hgCult, hgWeights, FREE_YEAR, freeOn, YEAR_GOALS, yearDay, TK, tkOf, tkContribute, tkClaim, tkDay, FIN, murabahaQuote, bankDebt, bankLate, CARDS, CARD_TRIG, cardDay, achInit, achGrant, achFlag, achNote, achDay, ACH_CHECK, ACHD, rivalNW, rivalOn, RIVAL_FROM, SEASONS, YEAR, seasonAt, seasonNow, seasonNext, seasonMul, SHOP_UP, SHOP_UP_COST, shUp, insValue, insPrem, insOn, MOUNT, mountOf, ROLES, ROLE_KEYS, captainPool, capWage, capRole, CAP_QUIT, SHOCKS, DIFF, diffOf, shocksOn, shockBlock, defenseOf, roadOn, shortMul, DLG, dlgOk, dlgView, questState, hasGood, stOf, MFG_COST, MFG_IN, MGR, MGR_AUDIT, FACT_HP, CRAFT_TRUST, CRAFT_COST, CRAFT_OPEN, factoryLocal, factoryMakeBlock, factoryQual, factoryValue, factoryBase, isAbroad, assetsIn, mgrOk, qualOf, HAGGLE, HG_BEST, haggleOpen, haggleLeft, vouchOf, vouchMul, hgOf, BUTCHER_COST, BUTCHER_DAY, FRESH_X, BUTCHER_PREM, HYB_LV, hybridOpen, hybOf, trHold, pfHold, hyMul, hyPf, breedStep, SEXF, pregOf, gestOf, BREEDS, BR_KEYS, BR_LV, spOf, breedOpen, pedMul, pedOf, pedMulOf, FARM_PHASE, FARM_COST, FARM_UP, FARM_MAXLV, FARM_UPKEEP, FARMER_UNITS, PRODUCT, MEAT, farmOf, farmCap, farmUnits, farmHold, farmValue, farmerNeed, farmCover, BREED, hxOf, youngOf, malesOf, YOUNG_SELL, HERD_PER, MAX_HERDERS, HERDER_WAGE, HERDER_FEE, herdOf, herdUnits, herdCap, holdings, fodderDay, shKind, shCap, shItemsMax, ownShops, rentOf, STALL_CAP, STALL_ITEMS, RENT_CREDIT, EVICT_DAYS, WK, WK_LV, WK_FREE, WK_CAP, staffOf, wkLv, wkWage, sellerNeed, keeperNeed, sellerPts, keeperHave, sellFactor, hirePool, SELLER_PTS, reputation, keyOn, quotaOn, quotaPerDay, quotaLeft, QUOTA_DAYS, exclusiveAt, PREM, isOwn, homeStatus, travelBlock, sha256hex, babFor, wealthStats, masteryOf, passivePerDay, FREE_DAILY, babEventDay, freedomDay, BAB, famDebtOn, debtDay, tabletCheck, START_OF, chooseStart, LORE, loreCheck, loreFix, advisorReport, bestDeal, advisorDay, ZAKAT, zakatBase, zakatDay, LS, learnCheck, learnPerks, learnSetChar, sells, soldAt, agentQuote, AGENT_PHASE, AGENT_FEE, BOSS_NAMES, PACTS, BOSS_TAKE, BOSS_LOSE, MAX_PACTS, bossOf, bossShare, pactIn, pactTerms, pactBlock, bossActive, bossB0, buyMul, rulerMine, quoteBuy, quoteSell, sellOptions, marketInfo, storeSummary, curOf, rateOf, feeOf, liquid, CURS, avgCost, FX0, VER, COUNTRIES, CD, ADJ, cdist, GOODS, GD, GIDS, RECIPES, CITY_DEFS, PHASE_AT, WEALTH_TITLES, TITLES, SPEED, SHOP_ITEMS_MAX, WH_CAP, SHELF_CAP, newGame, tick, unitPrice, refPrice, ratio, capG, netWorth, titleOf, loadOf, capOfCar, tripDays, supplyNeed, customsOf, popTotal, riskKey, dist, A, stressTest, botMain, botBuild, save, load, clamp, snapshotKnown, shopsOf, whsOf, shopLimit, shopCost, whCost, storeCap, storeLoad, storeRoom, hasPresence, mid, valueOf };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Engine = API;
})(typeof window !== 'undefined' ? window : globalThis);
