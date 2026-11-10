/* ---------- المنافسون المولَّدون (028أ؛ ملاحظة بن محمود 12): docs/goals/WORLD.md §6 ----------
   منافس واحد ثابت (S.rival في 15-rival.js) يبقى كما هو. هنا يولد منافسون جدد أثناء اللعب: أول ولادة بعد اليوم 120 ثم كل 150–240 يوماً (من بذرة اللعبة وعدّاد الولادات)،
   حتى 6 + درجة السلّم أحياء بسقف 8. لكل منافس ميدان وفكرة واحدة ذات أثر من أربعة أنواع فقط: عرض (يرفع مخزون السلعة)، طلب (يرفع طلبها)، سعر (يضغط السعر عبر المخزون)،
   عمالة (يضيّق مجموعة التوظيف). لا نظام جديد: العرض والسعر عبر هدف مخزون السوق في cityDay، والطلب عبر demandOf، والعمالة عبر hirePool. كل أثر بمدة وسقف (±40٪ و30 يوماً)
   ويعود السوق وحده بعد انقضائه. المخفية حتى رأي المختص: M16 وF13 وG17. أفكار «خط/عقد/جودة/خاص» والأفكار النادرة ومحطات القصة هي 028ب.
   العشوائية: مولّد خاص من S.rivalGen.seed وعدّاد الولادات فلا يمس مجاري rnd/rndB. الذاكرة: يمرّرها المحرك من الواجهة (rivalMemorySet) وإلا S.rivalSeen؛ وزن الاختيار 1 ÷ (1 + مرات الرؤية) للأبعاد، وللفكرة بأُسّ RIVALGEN.ideaPow=8 (بأُسّ 1 تتكرر الفكرة قبل 70٪ من ميدانها: انظر report.md).
   الحقول الاختيارية: S.rivals (قائمة) وS.rivalSeen وS.rivalGen. RIVALGEN.on=false يعيد السلوك السابق حرفياً (الضرب في 1 والطرح 0). */
const RIVALGEN = { on: true, cont: true, first: 120, gapMin: 150, gapMax: 240, life: 260, baseMax: 6, hardMax: 10, hardLegacy: 8, cap: 0.4, maxDays: 30, ideaPow: 8, hold: ['M16', 'F13', 'G17'], recent: 80, retry: 30,
  /* 040ج (دورة الحياة): cont=false يعيد السلوك السابق حرفياً (أثر ≤ 30 يوماً، ولادة كل 150–240، مصير 260 يوماً، سقف 8) */
  maxAge: 540, exitEvery: 30, exitBase: 0.05, respawnMin: 30, respawnMax: 90, ramp: 20, fade: 20, richBonus: 0.1 };
const RG_DOMS = { live: 'أنعام', food: 'أطعمة', goods: 'سلع ومصنوعات', sea: 'بحر' };
const RG_KINDS = { supply: 'عرض', dem: 'طلب', price: 'سعر', labor: 'عمالة' };
const RG_HYB = ['sheep_h', 'goat_h', 'cow_h', 'buffalo_h', 'camel_h', 'horse_h', 'chicken_h', 'duck_h'];
const RG_SEA = ['spice', 'silk', 'pearls', 'driedfish', 'porcelain', 'tea'];
// [الرمز، الميدان، الاسم، النوع، السلع، الأثر (كسر)، الأيام، النطاق، الأثر بجملة، الردّ]
const RG_IDEAS = [
  ['A01', 'live', 'قطيع الربيع', 'supply', ['sp:sheep'], 0.25, 14, 'city', 'يغمر سوق مدينته بالغنم', 'اشترِ من مخزونه الرخيص وبعه في مدينة بعيدة'],
  ['A02', 'live', 'سوق الخيل الموسمي', 'dem', ['sp:horse'], 0.30, 10, 'two', 'يرفع الطلب على الخيل في مدينتين', 'اجلب خيلاً قبل الموسم'],
  ['A03', 'live', 'مربّي السلالة النادرة', 'supply', ['majaheem', 'shaele'], 0.20, 30, 'city', 'يعرض مجاهيم وشعلاً في مدينته شهراً', 'احجز دفعته قبل غيرك'],
  ['A04', 'live', 'كاسر الجمال', 'price', ['sp:camel'], -0.10, 20, 'city', 'يضغط سعر الجمال في سوقه', 'أمسك سلعك وبع في غير سوقه'],
  ['A05', 'live', 'الحلّاب', 'supply', ['cheese'], 0.20, 14, 'city', 'يزيد معروض الجبن والألبان', 'اعرض عقد توريد منافساً'],
  ['A07', 'live', 'هجين مبتكر', 'dem', RG_HYB, 0.20, 14, 'city', 'يسحب الطلب نحو الأنعام الهجينة', 'اشترِ هجيناً أو بع النقية بسعر الندرة'],
  ['A08', 'live', 'مزاد العربي', 'dem', ['sp:horse'], 0.25, 10, 'city', 'يرفع طلب الخيل العربية في موسم الأعياد', 'وفّر قبل الموسم'],
  ['A09', 'live', 'راعي الصحراء', 'supply', ['sp:camel'], 0.30, 14, 'city', 'يعرض جمالاً كثيرة بسعر أقل وجودة أقل', 'اشترِ للوزن وبع للطلب العام'],
  ['A12', 'live', 'بيّاع الدجاج', 'supply', ['eggs', 'sp:chicken'], 0.40, 14, 'city', 'يغمر السوق بالبيض والدجاج', 'نوّع سلعك'],
  ['A13', 'live', 'مربّي البط', 'supply', ['duck_pekin'], 0.15, 14, 'city', 'يعرض بط بكين الفاخر', 'اشترِ للتصدير'],
  ['A15', 'live', 'سباق الجمال', 'dem', ['shaele'], 0.35, 12, 'city', 'يستضيف سباقاً فيرتفع طلب جمال السباق', 'أرسل جملاً قبل السباق'],
  ['A16', 'live', 'مشتري الصوف', 'dem', ['wool', 'hide'], 0.15, 10, 'two', 'يشتري الصوف والجلود فيرتفع خام المصانع', 'اشترِ خامك مبكراً'],
  ['A17', 'live', 'المسلخ الحديث', 'supply', ['meat'], 0.25, 14, 'city', 'يعرض لحماً طازجاً أكثر', 'بع للمسالخ المحلية'],
  ['A18', 'live', 'مدرّب الخيل', 'labor', [], -0.15, 20, 'city', 'يستقطب العمّال من مدينته', 'وظّف قبله أو ارفع الأجر'],
  ['A20', 'live', 'مورّد الأعلاف', 'price', ['wheat'], 0.10, 20, 'country', 'يرفع سعر الأعلاف في منطقته', 'اشترِ من مورّد آخر'],
  ['F01', 'food', 'تمر المواسم', 'supply', ['dates'], 0.30, 14, 'city', 'يغمر السوق بالتمر بعد الحصاد', 'خزّن واشترِ'],
  ['F02', 'food', 'مخبز القوافل', 'dem', ['wheat'], 0.12, 20, 'city', 'يرفع طلب القمح في مدينته', 'وفّر القمح'],
  ['F05', 'food', 'عسل الجبل', 'supply', ['honey'], 0.20, 20, 'city', 'يعرض عسلاً أسبوعياً', 'احجز دفعة'],
  ['F06', 'food', 'زيت الزيتون', 'price', ['oliveoil'], -0.08, 20, 'city', 'يخفض سعر الزيت في مدينته', 'بع في مدينة بعيدة'],
  ['F07', 'food', 'مجفّف السمك', 'supply', ['driedfish'], 0.25, 14, 'port', 'يزيد معروض السمك المجفف في الموانئ', 'اشترِ للمدن الداخلية'],
  ['F08', 'food', 'الحلوانيّ', 'dem', ['sugar'], 0.15, 12, 'two', 'يرفع طلب السكر في الأعياد', 'وفّر قبل الأعياد'],
  ['F10', 'food', 'زعفران نادر', 'supply', ['saffron'], 0.20, 30, 'city', 'يعرض زعفراناً نادراً شهراً', 'اشترِ أولاً'],
  ['F11', 'food', 'بيّاع الشاي', 'dem', ['tea'], 0.20, 14, 'two', 'يرفع طلب الشاي في مدينتين', 'أمّن حصتك'],
  ['F12', 'food', 'الزبّاد', 'supply', ['cheese'], 0.20, 14, 'city', 'يزيد معروض الجبن واللبن المجفف', 'اعرض عقد توريد منافساً'],
  ['F14', 'food', 'سوق الفواكه', 'dem', ['raisins'], 0.18, 20, 'city', 'يرفع طلب الزبيب والفواكه شتاءً', 'خزّن'],
  ['F15', 'food', 'لحم المسافر', 'supply', ['jerky'], 0.15, 14, 'city', 'يعرض لحماً مجففاً للقوافل', 'اعرض أجود'],
  ['F18', 'food', 'دقيق وطحين', 'dem', ['wheat'], 0.10, 14, 'two', 'يرفع طلب القمح لمدينتين', 'وفّر'],
  ['F19', 'food', 'تاجر الملح', 'supply', ['salt'], 0.30, 14, 'city', 'يغمر السوق بالملح الخام', 'اشترِ لمصانعك'],
  ['F20', 'food', 'سوق الأعشاب', 'dem', ['herbs'], 0.25, 12, 'city', 'يرفع طلب الأعشاب الطبية بعد المرض', 'بادر قبل الموجة'],
  ['G02', 'goods', 'نسّاج مبتكر', 'supply', ['textile'], 0.25, 14, 'city', 'يعرض نسيجاً أكثر بسعر أقل', 'بع للأسواق البعيدة'],
  ['G04', 'goods', 'صائغ الجواهر', 'dem', ['jewelry'], 0.20, 14, 'two', 'يرفع طلب المجوهرات في مدينتين', 'وفّر لؤلؤاً وأحجاراً'],
  ['G05', 'goods', 'حدّاد الأدوات', 'supply', ['tools'], 0.30, 14, 'city', 'يزيد معروض الأدوات في مدينته', 'اشترِ لمصانعك'],
  ['G06', 'goods', 'صابون الحمّام', 'dem', ['soap'], 0.15, 14, 'city', 'يرفع طلب الصابون', 'قدّم بديلاً'],
  ['G09', 'goods', 'زجّاج صيدا', 'supply', ['glass'], 0.20, 14, 'city', 'يزيد معروض الزجاج', 'بع بعيداً'],
  ['G10', 'goods', 'ورّاق', 'dem', ['papyrus', 'paper'], 0.18, 14, 'two', 'يرفع طلب الورق والبردي في مدن العلم', 'أمّن ورقاً'],
  ['G11', 'goods', 'غوّاص اللؤلؤ', 'supply', ['pearls'], 0.15, 30, 'city', 'يعرض لؤلؤاً شهرياً', 'احجز'],
  ['G12', 'goods', 'بخّور الأعياد', 'dem', ['incense'], 0.25, 10, 'city', 'يرفع طلب البخور في المواسم', 'وفّر'],
  ['G13', 'goods', 'تاجر الجلود', 'supply', ['leather', 'hide'], 0.25, 14, 'city', 'يعرض جلوداً أكثر بسعر أقل', 'اشترِ'],
  ['G14', 'goods', 'الصانع المقلّد', 'price', ['textile', 'carpet', 'soap', 'tools'], -0.07, 20, 'city', 'يقلّد السلع فيخفّض سعرها في مدينته', 'ارفع الجودة'],
  ['G15', 'goods', 'ورشة الخشب', 'supply', ['wood'], 0.20, 14, 'city', 'يعرض خشباً مصنّعاً أكثر', 'ورّد لمصانعك'],
  ['G16', 'goods', 'معرض الصنّاع', 'dem', ['textile', 'carpet', 'tools', 'soap', 'perfume', 'jewelry'], 0.12, 10, 'city', 'يقيم معرضاً فيرتفع طلب المصنّعات', 'شارك'],
  ['G19', 'goods', 'مورّد الحديد', 'price', ['iron'], 0.10, 20, 'city', 'يرفع سعر الحديد الخام على مصانعك', 'ورّد من غيره'],
  ['M02', 'sea', 'تاجر الموانئ', 'supply', ['driedfish', 'pearls'], 0.20, 14, 'port', 'يزيد معروض السمك المجفف واللؤلؤ في الموانئ', 'اشترِ'],
  ['M05', 'sea', 'رسوم مخفّضة', 'price', RG_SEA, -0.06, 20, 'city', 'يرخّص سلع البحر في ميناء مدينته برسوم أقل', 'رقِّ ميناءك'],
  ['M07', 'sea', 'قبطان ماهر', 'labor', [], -0.15, 20, 'city', 'يستقطب بحّارة مدينته', 'ارفع الأجر'],
  ['M10', 'sea', 'أسطول الشتاء', 'supply', ['silk', 'porcelain', 'tea'], 0.18, 20, 'port', 'تصل سلع الصين أكثر شتاءً', 'بع قبل وصوله'],
  ['M13', 'sea', 'سوق الصيد', 'supply', ['driedfish'], 0.25, 14, 'city', 'يعرض سمكاً لمدينته الساحلية', 'بع للداخل'],
  ['M14', 'sea', 'تاجر اللؤلؤ', 'price', ['pearls'], -0.10, 20, 'city', 'يخفض سعر اللؤلؤ في الخليج', 'بع في غير الخليج'],
  ['M19', 'sea', 'سمسار الأوزان', 'dem', RG_SEA, 0.10, 20, 'city', 'يوحّد المكاييل فيزيد إقبال السوق على سلع الموانئ', 'شاركه'],
].map(a => ({ id: a[0], dom: a[1], name: a[2], kind: a[3], goods: a[4], mul: a[5], days: a[6], scope: a[7], text: a[8], reply: a[9] }));
const RG_PERS = ['الحَذِر', 'الجريء', 'الصبور', 'المتعجّل', 'الصادق', 'الماكر', 'المتواضع', 'المتكبّر', 'المدقّق', 'المغامر', 'المحافظ', 'المجدّد'];
const RG_BG = ['ابن تاجر كبير', 'حرفي صاعد', 'بدوي مرتحل', 'بحّار سابق', 'ابن زعيم سوق', 'مهاجر من إقليم بعيد', 'طالب علم تحوّل للتجارة', 'وريث متعثّر'];
const RG_PATHS = ['الصاعد', 'الخصم النبيل', 'السقوط والعودة', 'الشريك المنقلب', 'المبتكر المنعزل', 'الوارث المتعثّر', 'المنافس الصامت', 'التاجر المهاجر'];
const RG_PATH_RETIRE = [0.15, 0.25, 0.55, 0.35, 0.30, 0.50, 0.30, 0.40];
// 040ج: قوة المنافس من مساره (بترتيب RG_PATHS) وتعديل صغير من شخصيته (بترتيب RG_PERS) ثم نثرة ±0.05 من بذرة اللعبة؛ تُقصّ إلى [0.3، 1]
const RG_PATH_STR = [0.9, 0.8, 0.45, 0.6, 0.7, 0.35, 0.4, 0.55];
const RG_PERS_STR = [-0.05, 0.05, 0.05, -0.05, 0, 0.05, -0.05, 0, 0.05, 0, -0.05, 0.05];
const RG_REL = ['منافس شريف', 'متحدٍّ متكبّر', 'مقلّد', 'تلميذ معجب', 'غامض'];
const RG_FIRST = ['مازن', 'رائد', 'نبيل', 'فارس', 'غسّان', 'هاني', 'سمير', 'وليد', 'ماجد', 'نادر', 'ثامر', 'راشد', 'حازم', 'شاكر', 'رياض', 'عادل', 'مهنّد', 'عصام', 'عوّاد', 'صبري', 'لبيب', 'عزيز', 'جلال', 'ثابت', 'جاسم', 'حمدان', 'منير', 'ضاري', 'ظافر', 'زاهر', 'رامي', 'سليم', 'نصّار', 'هزّاع', 'مبارك', 'جميل', 'كامل', 'بشير', 'أنور', 'ماهر'];
const RG_TITLE = ['الفرّاء', 'الجمّال', 'الخيّال', 'الرحّال', 'السمّان', 'الزيّات', 'الحبّال', 'الوزّان', 'الكيّال', 'النسّاج', 'السرّاج', 'الصبّاغ', 'الخرّاز', 'الحلّاب', 'الغزّال', 'العسّال', 'التمّار', 'القمّاح', 'الملّاح', 'الغوّاص', 'البحّار', 'الجوهري', 'العطّار', 'الورّاق', 'الصائغ', 'الخزّاف', 'الزجّاج', 'البزّاز', 'الدلّال', 'السمسار'];
let RG_MEM = null; // ذاكرة الجهاز (تمرّرها الواجهة)؛ تُعدَّل في مكانها
const rivalMemoryNew = () => ({ recent: [], counts: {} });
function rivalMemorySet(m) { RG_MEM = m && typeof m === 'object' ? (m.recent && m.counts ? m : Object.assign(m, rivalMemoryNew(), m)) : null; }
const rivalMemoryNow = () => RG_MEM;
const rgOn = S => !!(RIVALGEN.on && S && S.learn && S.learn.char);
const rgIdeaVisible = i => !RIVALGEN.hold.includes(i.id);
const rgIdeas = dom => RG_IDEAS.filter(i => i.dom === dom && rgIdeaVisible(i));
const rgState = S => S.rivalGen || (S.rivalGen = { seed: (S.seed >>> 0) || 1, births: 0, next: RIVALGEN.first + 1 });
function rgRng(S) { const G = rgState(S); let t = (G.seed + Math.imul(G.births + 1, 0x9E3779B1) + Math.imul((G.k = (G.k || 0) + 1), 0x85EBCA6B)) | 0; return () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const rgCount = (S, dim, v) => { const m = RG_MEM || S.rivalSeen; return (m && m.counts && m.counts[dim] && m.counts[dim][v]) || 0; };
// 040ج: وزن المدينة يزيد بالازدهار وبقلة منافسيها الحاليين (مع ذاكرة عدم التكرار كما سبق)
function rgPickCity(S, r, list) { const avg = rgProsAvg(S) || 1, w = list.map(v => (0.6 + 0.4 * rgPros(S, v) / avg) / Math.pow(1 + rgCount(S, 'city', v), 1) / (1 + (S.rivals || []).filter(o => o.out == null && o.city === v).length)), tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; } return list[list.length - 1]; }
function rgPick(S, r, dim, list, pow) { const w = list.map(v => 1 / Math.pow(1 + rgCount(S, dim, v), pow || 1)), tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; } return list[list.length - 1]; }
function rgGoods(spec) { const out = new Set(); for (const s of spec) { if (s.startsWith('sp:')) GIDS.forEach(g => { if (GD[g].live && GD[g].sp === s.slice(3)) out.add(g); }); else if (GD[s]) out.add(s); } return [...out]; }
const rgSig = x => [x.dom, x.idea, x.pers, x.city, x.bg, x.path, x.rel, x.name].join('|');
const rgTier = S => { const pk = Math.max((S.projects && S.projects.peak) || 0, 0); return PJ_TIERS.filter(t => pk >= t).length; };
const rivalMax = S => Math.min(RIVALGEN.cont ? RIVALGEN.hardMax : RIVALGEN.hardLegacy, RIVALGEN.baseMax + rgTier(S));
const rgAlive = S => (S.rivals || []).filter(rv => rv.out == null).length;
const rgHash = (S, id, salt) => ((Math.imul(rgState(S).seed ^ Math.imul(id + 1, 2654435761), 0x2C1B3C6D) ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0) / 4294967296;
const rgGap = (S, r) => RIVALGEN.respawnMin + Math.floor(r() * (1 + (RIVALGEN.respawnMax - RIVALGEN.respawnMin) * 0.5 * Math.min(1, rgAlive(S) / rivalMax(S)))); // البديل أسرع كلما قلّ الأحياء (30 يوماً حتى 60 عند الامتلاء؛ ضمن 30–90 المقرَّرة)
const rgClamp = (x, a, b) => Math.max(a, Math.min(b, x));
// قوة المنافس (قابلة للإعادة من البذرة)؛ الحفظ القديم بلا str يُحسب من مساره
function rgStr(S, rv) { if (rv.str == null) rv.str = rgClamp(RG_PATH_STR[Math.max(0, RG_PATHS.indexOf(rv.path))] + (RG_PERS_STR[RG_PERS.indexOf(rv.pers)] || 0) + (rgHash(S, rv.id, 7) - 0.5) * 0.1, 0.3, 1); return rv.str; }
const rgPros = (S, id) => { const p = S.cities[id] && S.cities[id].pros; return p ? PR_KEYS.reduce((a, k) => a + (p[k] || 0), 0) / PR_KEYS.length : 0; };
const rgProsAvg = S => S.order.reduce((a, id) => a + rgPros(S, id), 0) / Math.max(1, S.order.length);
function rgCities(S, home, scope) {
  const hc = S.cities[home]; if (scope === 'city') return [home];
  if (scope === 'two') { const same = S.order.filter(id => id !== home && S.cities[id].country === hc.country), pool = same.length ? same : S.order.filter(id => id !== home); return [home, pool[(S.order.indexOf(home) * 7 + 3) % pool.length]]; }
  if (scope === 'port') return PORTS.filter(id => S.cities[id]);
  return S.order.filter(id => S.cities[id].country === hc.country);
}
// ولادة منافس (تُستدعى يومياً حين يحين موعدها، وتُستدعى مباشرة في الاختبارات). تُرجع المنافس أو null
function rivalGenBirth(S, mem) {
  if (mem) rivalMemorySet(mem);
  const G = rgState(S), r = rgRng(S);
  for (let tries = 0; tries < 40; tries++) {
    const dom = rgPick(S, r, 'dom', Object.keys(RG_DOMS)), idea = rgPick(S, r, 'idea', rgIdeas(dom).map(i => i.id), RIVALGEN.ideaPow);
    const homes = dom === 'sea' ? PORTS.filter(id => S.cities[id]) : S.order, city = RIVALGEN.cont ? rgPickCity(S, r, homes) : rgPick(S, r, 'city', homes), pers = rgPick(S, r, 'pers', RG_PERS), bg = rgPick(S, r, 'bg', RG_BG), path = rgPick(S, r, 'path', RG_PATHS), rel = rgPick(S, r, 'rel', RG_REL);
    const fn = rgPick(S, r, 'fn', RG_FIRST), ep = rgPick(S, r, 'ep', RG_TITLE), name = fn + ' ' + ep, x = { dom, idea, pers, city, bg, path, rel, name }, sig = rgSig(x);
    const M = RG_MEM || S.rivalSeen; if ((M && M.recent || []).some(o => rgSig(o) === sig) || (S.rivals || []).some(o => o.name === name)) continue;
    const I = RG_IDEAS.find(i => i.id === idea), days = Math.min(I.days, RIVALGEN.maxDays), mul = Math.max(-RIVALGEN.cap, Math.min(RIVALGEN.cap, I.mul)), rv = { id: G.births + 1, name, dom, idea, pers, bg, path, rel, city, born: S.day, fate: S.day + RIVALGEN.life, fx: null };
    if (RIVALGEN.cont) { rv.fate = 0; rv.str = rgClamp(rgStr(S, rv) + (rgPros(S, city) > rgProsAvg(S) ? RIVALGEN.richBonus : 0), 0.3, 1); rv.fx = rgContFx(S, rv, I, S.day); }
    else { rv.fx = { kind: I.kind, cities: rgCities(S, city, I.scope), gs: rgGoods(I.goods), mul, start: S.day, until: S.day + days }; }
    // دفعة أولى في المخزون للعرض والسعر (ثم يثبّتها هدف المخزون في cityDay طوال المدة)؛ مع cont يتولى الصعود التدريجي ذلك
    if (!RIVALGEN.cont && (I.kind === 'supply' || I.kind === 'price')) for (const id of rv.fx.cities) for (const g of rv.fx.gs) { const c = S.cities[id]; if (c && c.stock[g] != null) c.stock[g] = Math.max(0, Math.min(capG(c, g) * 1.2, c.stock[g] * rgStockMul(I.kind, mul))); }
    (S.rivals = S.rivals || []).push(rv); G.births++; G.k = 0;
    for (const m of [S.rivalSeen = S.rivalSeen || rivalMemoryNew(), RG_MEM]) if (m) { m.recent.push(x); while (m.recent.length > RIVALGEN.recent) m.recent.shift(); for (const [d, v] of [['dom', dom], ['idea', idea], ['city', city], ['pers', pers], ['bg', bg], ['path', path], ['rel', rel], ['fn', fn], ['ep', ep]]) { const o = m.counts[d] || (m.counts[d] = {}); o[v] = (o[v] || 0) + 1; } }
    RIVALGEN.memDirty = true;
    news(S, 'منافس جديد في السوق: ' + name + ' (' + RG_DOMS[dom] + ') في ' + S.cities[city].name + ': ' + I.name + '، ' + I.text + '. الردّ: ' + I.reply + '.');
    return rv;
  }
  return null;
}
// عرض أكبر أو سعر أقل = مخزون أعلى؛ سعر أعلى = مخزون أقل (السعر يتبع المخزون في السوق)
const rgStockMul = (kind, mul) => Math.max(0.6, Math.min(1.4, kind === 'price' ? 1 - 1.5 * mul : 1 + mul));
// أثر مستمر (040ج): يبقى ما دام المنافس حياً بمقدار I.mul × str (والسقف ±cap)؛ until بعيد (العمر الأقصى + الانحسار) وcont=true علامةً له
function rgContFx(S, rv, I, start) { const mul = rgClamp(I.mul * rgStr(S, rv), -RIVALGEN.cap, RIVALGEN.cap); return { kind: I.kind, cities: rgCities(S, rv.city, I.scope), gs: rgGoods(I.goods), mul, start, until: (rv.born || start) + RIVALGEN.maxAge + RIVALGEN.fade + 1, cont: true }; }
// معامل الصعود في أول ramp يوماً من الولادة والانحسار fade يوماً بعد الخروج (1 لما قبل 040ج)
function rgScale(S, rv) { if (!(rv.fx && rv.fx.cont)) return 1; let k = 1; if (RIVALGEN.ramp > 0) k = Math.min(1, Math.max(0, (S.day - rv.born) / RIVALGEN.ramp)); if (rv.out != null) k *= Math.max(0, 1 - (S.day - rv.out) / RIVALGEN.fade); return k; }
function rgLive(S) { const out = []; if (S.rivals) for (const rv of S.rivals) if (rv.fx && rv.fx.until > S.day) out.push(rv); return out; }
// هدف مخزون السوق (في cityDay): 1 حين لا أثر
function rivalSupplyMul(S, cid, g) {
  if (!S.rivals || !S.rivals.length) return 1; let m = 1;
  for (const rv of rgLive(S)) { const fx = rv.fx; if ((fx.kind === 'supply' || fx.kind === 'price') && fx.cities.includes(cid) && fx.gs.includes(g)) m *= rgStockMul(fx.kind, fx.mul * rgScale(S, rv)); }
  return m;
}
function rivalDemMul(S, cid, g) {
  if (!S.rivals || !S.rivals.length) return 1; let m = 1;
  for (const rv of rgLive(S)) { const fx = rv.fx; if (fx.kind === 'dem' && fx.cities.includes(cid) && fx.gs.includes(g)) m *= 1 + fx.mul * rgScale(S, rv); }
  return m;
}
function rivalLaborMul(S, cid) {
  if (!S.rivals || !S.rivals.length) return 1; let m = 1;
  for (const rv of rgLive(S)) { const fx = rv.fx; if (fx.kind === 'labor' && fx.cities.includes(cid)) m *= 1 + fx.mul * rgScale(S, rv); }
  return m;
}
// عقد للحزم التالية (040ب/040د): مجموع قوة المنافسين الأحياء الذين يشمل أثرهم المدينة (0 إن لا أحد)
function rivalPresence(S, cid) { let t = 0; for (const rv of (S.rivals || [])) if (rv.out == null && rv.fx && rv.fx.cities.includes(cid)) t += rgStr(S, rv); return t; }
// خروج شهري (040ج): p = 0.05 × (1.3 − str) × (1 + shock)؛ shock=1 إن كان في مدينة المنافس وباء أو قحط أو موجة لصوص فعّالة؛ وعمر أقصى maxAge
function rgShock(S, cid) { const c = S.cities[cid]; return !!((c && c.ev && c.ev.k === 'plague') || (c && c.sh && c.sh.k === 'famine') || (S.shocks || []).some(sh => sh.st === 'on' && sh.k === 'banditwave' && sh.city === cid)); }
function rgExitDay(S, G) {
  let any = false;
  for (const rv of (S.rivals || [])) {
    const I = RG_IDEAS.find(i => i.id === rv.idea); rv.fate = 0; const st = rgStr(S, rv);
    if (!rv.fx || !rv.fx.cont) { if (I) { rv.fx = rgContFx(S, rv, I, rv.born || S.day); } } // حفظ قديم: أثر مستمر من فكرته
    if (rv.out != null) continue;
    const age = S.day - rv.born; let why = null;
    if (age >= RIVALGEN.maxAge) why = 'age';
    else if (age > 0 && age % RIVALGEN.exitEvery === 0) { const sh = rgShock(S, rv.city) ? 1 : 0; if (rgHash(S, rv.id, S.day) < RIVALGEN.exitBase * (1.3 - st) * (1 + sh)) why = sh ? 'crisis' : st < 0.5 ? 'weak' : 'age'; }
    if (!why) continue;
    rv.out = S.day; any = true;
    news(S, rv.name + (why === 'crisis' ? ' خرج من السوق: أصابته أزمة في ' + S.cities[rv.city].name + ' فأغلق أعماله.' : why === 'weak' ? ' خرج من السوق: ضعفت تجارته وأغلق أعماله.' : ' اعتزل التجارة بعد سنوات في السوق وأغلق أعماله.'), why === 'crisis' ? 'good' : '');
  }
  S.rivals = (S.rivals || []).filter(rv => rv.out == null || S.day - rv.out < RIVALGEN.fade);
  return any;
}
function rivalGenDay(S) {
  if (!rgOn(S)) return; const G = rgState(S);
  if (RIVALGEN.cont) {
    if (rgExitDay(S, G) && G.next > S.day + RIVALGEN.respawnMax) { const r = rgRng(S); G.next = S.day + rgGap(S, r); }
    if (S.day >= G.next) {
      if (rgAlive(S) >= rivalMax(S)) G.next = S.day + RIVALGEN.retry;
      else { rivalGenBirth(S); const r = rgRng(S); G.next = S.day + rgGap(S, r); }
    }
    return;
  }
  for (const rv of (S.rivals || [])) if (rv.fx && rv.fx.until <= S.day) rv.fx = null;
  // المصير البسيط (028أ): بعد نحو 260 يوماً يبقى أو يتقاعد بحسب مساره وبذرة اللعبة
  if (S.rivals && S.rivals.length) {
    const keep = [];
    for (const rv of S.rivals) {
      if (rv.fate && S.day >= rv.fate) { const u = ((Math.imul(G.seed ^ (rv.id * 2654435761), 0x2C1B3C6D) >>> 0) % 1000) / 1000; rv.fate = 0; if (u < RG_PATH_RETIRE[RG_PATHS.indexOf(rv.path)]) { news(S, rv.name + ' اعتزل التجارة وأغلق أعماله.'); continue; } }
      keep.push(rv);
    }
    S.rivals = keep;
  }
  if (S.day >= G.next) {
    if (rgAlive(S) >= rivalMax(S)) G.next = S.day + RIVALGEN.retry;
    else { rivalGenBirth(S); const r = rgRng(S); G.next = S.day + RIVALGEN.gapMin + Math.floor(r() * (RIVALGEN.gapMax - RIVALGEN.gapMin + 1)); }
  }
}
const RG_STR_NAME = st => st < 0.5 ? 'ضعيف' : st < 0.75 ? 'متوسط' : 'قوي';
function rivalGenView(S) {
  if (!rgOn(S)) return { on: false, list: [], max: 0 };
  return { on: true, max: rivalMax(S), next: rgState(S).next, list: (S.rivals || []).filter(rv => rv.out == null).map(rv => { const I = RG_IDEAS.find(i => i.id === rv.idea), cont = !!(rv.fx && rv.fx.cont), st = RIVALGEN.cont ? rgStr(S, rv) : null, cur = rv.fx ? rv.fx.mul * rgScale(S, rv) : 0;
    return { id: rv.id, name: rv.name, dom: RG_DOMS[rv.dom], idea: I.name, text: I.text, reply: I.reply, kind: RG_KINDS[I.kind], city: S.cities[rv.city].name, pers: rv.pers, bg: rv.bg, path: rv.path, rel: rv.rel, born: rv.born, active: !!(rv.fx && rv.fx.until > S.day), left: rv.fx && !cont ? Math.max(0, rv.fx.until - S.day) : 0,
      cont, str: st, strName: st == null ? '' : RG_STR_NAME(st), days: Math.max(0, S.day - rv.born), pct: Math.round(cur * 100) }; }) };
}
