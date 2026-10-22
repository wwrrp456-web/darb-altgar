/* حوارات المشاهد والمهام كبيانات (مسودة بن محمود تراجعها). نبرة أسرية للجميع.
   الشروط والآثار قوائم بسيطة يفسّرها المحرك (engine.js: dlgOk / dlgDo):
   شروط:  ['flag', id] · ['not', id] · ['gold', '>=', n] · ['trust', city, '>=', n] · ['level', '>=', n] · ['ready', id] · ['quest', id, 'none|active|done'] · ['has', good, n]
   آثار:  ['flag', id] · ['trust', city, n] · ['pay', n] · ['cool', id, days] · ['quest', 'start|done', id] · ['sellTo', good, n, mult] · ['craft', city] · ['react', key]
   المزاج 'auto' يتبع ثقة الزعيم. */
(function (root) {
'use strict';
const END = { t: 'أستأذن الآن', end: true };

// ---- مشاهد المدن: مواضع نقاط الضغط بالنسبة المئوية من الصورة
const SCENES = {
  riyadh: { img: 'scene/plaza_riyadh', title: 'ساحة سوق الرياض', spots: [
    { id: 'salem', x: 24, y: 66, label: 'عمّ سالم', icon: 'ui/spot_salem', dlg: 'riyadh_salem' },
    { id: 'trader', x: 52, y: 67, label: 'التاجر', icon: 'ui/spot_trader', dlg: 'riyadh_trader' },
    { id: 'boss', x: 81, y: 62, label: 'الزعيم', icon: 'ui/spot_boss', dlg: 'riyadh_boss' },
  ] },
};

// ---- المهام الصغيرة بين الصفقات
const QUESTS = {
  q_coffee: { city: 'riyadh', title: 'قهوة لعرس ابن عمّ التاجر', need: ['coffee', 8], pay: 1.3, text: 'أحضر 8 قهوة لتاجر ساحة الرياض، وهو يدفع فوق سعر السوق بـ30٪.' },
};

// ---- حوار الزعيم
const bossHub = [
  { t: 'أقدّم لك هديةً من القلب (100 ريال)', if: [['gold', '>=', 100], ['ready', 'gift_riyadh']], do: [['pay', 100], ['trust', 'riyadh', 6], ['cool', 'gift_riyadh', 7]], next: 'gift' },
  { t: 'كيف أكسب ثقتك؟', next: 'advice' },
  { t: 'حدّثني عن عطور الرياض', next: 'product' },
  { t: 'أريد إذن نقل الصنعة', if: [['level', '>=', 6]], next: 'craft' },
  END,
];
const BOSS = {
  who: 'boss_riyadh', city: 'riyadh', start: [{ if: [['not', 'met_boss']], node: 'intro' }, { if: [['debtfree'], ['not', 'hail_debt_riyadh']], node: 'hail_debt' }, { if: [['shop'], ['not', 'hail_shop_riyadh']], node: 'hail_shop' }, { if: [['trust', 'riyadh', '>=', 35]], node: 'friend' }, { node: 'hub' }],
  nodes: {
    hail_debt: { mood: 'warm', say: 'بلغني أنك أوفيتَ دَين جدّك كاملاً يا ولدي. هذا وفاءٌ يرفع قدر صاحبه بين التجار. هنيئاً لك.', opts: [{ t: 'بارك الله فيك', do: [['flag', 'hail_debt_riyadh']], next: 'hub' }] },
    hail_shop: { mood: 'warm', say: 'سمعتُ أنك فتحتَ دكانك الأول. مبارك عليك؛ من بدأ صغيراً وصدق في تجارته كبر بإذن الله.', opts: [{ t: 'بارك الله فيك', do: [['flag', 'hail_shop_riyadh']], next: 'hub' }] },
    intro: { mood: 'warm', say: 'أهلاً بك في سوق الرياض يا ولدي. أنا {boss}، كبير تجّار هذا السوق. عطورنا تُحمل إلى بلاد بعيدة، ومن يتاجر في سوقي أراه بعيني. كن أميناً تجدني سنداً لك.',
      opts: [{ t: 'السلام عليكم، شرّفني لقاؤك', do: [['flag', 'met_boss'], ['trust', 'riyadh', 2]], next: 'hub' }, { t: 'جئت أتاجر وأتعلم منكم', do: [['flag', 'met_boss'], ['trust', 'riyadh', 2]], next: 'hub' }] },
    hub: { mood: 'auto', say: 'ماذا تريد يا ولدي؟', opts: bossHub },
    friend: { mood: 'warm', say: 'ابن الأصل! لك عندي مكان في المجلس دائماً. تفضّل، ماذا في بالك؟', opts: bossHub },
    gift: { mood: 'warm', say: 'كرم منك! الهدية تقرّب القلوب، لكن الأمانة في الصفقات هي التي تبني الثقة. زادك الله من فضله.', opts: [{ t: 'شكراً لك', next: 'hub' }] },
    advice: { mood: 'stern', say: 'الثقة تُبنى بثلاثة: وفاؤك بعقودك، وصدقك في صفقاتك، وهديةٌ بين حين وآخر دون إلحاح. ومن فسخ عقداً مرةً ثقلت عليه الثقة سنين.', opts: [{ t: 'فهمت، شكراً', next: 'hub' }] },
    product: { mood: 'warm', say: 'عطور الرياض أصلها بخور وعود من جازان وحائل، وصنعة أيدينا. السوق يبيعها لك بسعر أرخص من أي مكان، وكلما غلت في غير بلادنا زاد ربحك. وللمتقدمين من التجار: حصة يومية لا يتجاوزها أحد.', opts: [{ t: 'ممتاز، وماذا بعد؟', next: 'hub' }] },
    craft: { mood: 'stern', say: 'تريد أن تصنع عطورنا في بلاد أخرى؟ صنعتنا غالية. إذن النقل يحتاج ثقةً بيننا لا تقل عن 10، وألفان وخمسمئة ريال رسماً.', opts: [
      { t: 'أدفع الرسم (2500 ريال)', if: [['gold', '>=', 2500], ['trust', 'riyadh', '>=', 10]], do: [['craft', 'riyadh']], next: 'craft_ok' },
      { t: 'سأعود حين أكون أهلاً لذلك', next: 'hub' }] },
    craft_ok: { mood: 'warm', say: 'اتفقنا. من اليوم لك أن تصنع العطور حيث شئت، وبجودة تشرّف سمعتك وسمعتنا.', opts: [{ t: 'أعدك بذلك', next: 'hub' }] },
  },
};

// ---- حوار تاجر الساحة
const TRADER = {
  who: 'trader', city: 'riyadh', start: [{ if: [['not', 'met_trader']], node: 'intro' }, { if: [['quest', 'q_coffee', 'active']], node: 'q_active' }, { node: 'hub' }],
  nodes: {
    intro: { mood: 'pleased', say: 'السلام عليكم! أنا من أهل هذا السوق منذ زمن. تاجر مثلك يعرف أن لكل سلعة وجهاً ولكل زبون مزاجاً، وأنا أحب من يساوم بأدب.',
      opts: [{ t: 'وعليكم السلام، علّمني المساومة', do: [['flag', 'met_trader']], next: 'tips' }, { t: 'سلّمك الله، ماذا عندك؟', do: [['flag', 'met_trader']], next: 'hub' }] },
    hub: { mood: 'neutral', say: 'تفضّل يا ولدي. ماذا أخدمك؟', opts: [
      { t: 'هل عندك ما تحتاج إليه؟', if: [['quest', 'q_coffee', 'none'], ['level', '>=', 2]], next: 'q_offer' },
      { t: 'كيف أساوم؟', next: 'tips' },
      { t: 'شكراً، سلام', end: true }] },
    tips: { mood: 'pleased', say: 'اقرأ وجه التاجر قبل أن تتكلم: المبتسم يلين لمن يُصرّ على سعره، والهادئ يقتنع بالسعر المرجعي، والمنزعج لا يلين إلا بكلمة طيبة. وتفتح لك المساومة حين تتقدم في تعلّمك.', opts: [{ t: 'جزاك الله خيراً', next: 'hub' }] },
    q_offer: { mood: 'pleased', say: 'عرس ابن عمي بعد أيام وأحتاج 8 قهوة. أدفع لك فوق سعر السوق بثلث تقريباً إن جئتني بها.', opts: [
      { t: 'أبشر، سأجلبها لك', do: [['quest', 'start', 'q_coffee']], end: true },
      { t: 'لا أستطيع الآن', next: 'hub' }] },
    q_active: { mood: 'neutral', say: 'هل جئتني بالقهوة التي طلبتها؟', opts: [
      { t: 'نعم، هذه ثمانٍ', if: [['has', 'coffee', 8]], do: [['sellTo', 'coffee', 8, 1.3], ['trust', 'riyadh', 3], ['quest', 'done', 'q_coffee']], next: 'q_done' },
      { t: 'ليس بعد، أتممها قريباً', end: true }] },
    q_done: { mood: 'pleased', say: 'بارك الله فيك! لسانك حلو ويدك أمينة. إن احتجت شيئاً فأنا هنا.', opts: [{ t: 'في أي وقت', next: 'hub' }] },
  },
};

// ---- حوار عمّ سالم في ركنه
const SALEM = {
  who: 'salem', city: 'riyadh', start: [{ if: [['not', 'met_salem_riyadh']], node: 'intro' }, { node: 'hub' }],
  nodes: {
    intro: { mood: 'teach', say: 'هنا يا ولدي، تحت هذه النخلة، كان جدّك يجلس ويقرأ أرقامه قبل أن يشدّ رحاله. الرياض اسمها من «الروضة»، أرض الواحات، ومنها بدأت أول قوافلنا.', opts: [{ t: 'حدّثني أكثر', do: [['flag', 'met_salem_riyadh']], next: 'hub' }] },
    hub: { mood: 'happy', say: 'اجلس قليلاً. ماذا تريد أن تعرف؟', opts: [
      { t: 'ما نصيحتك اليوم؟', next: 'tip' },
      { t: 'ما دفتر التاجر هذا؟', next: 'journal' },
      { t: 'شكراً يا عم سالم', end: true }] },
    tip: { mood: 'teach', say: 'قبل أن تشتري سلعة اسأل نفسك ثلاثاً: بكم سأشتريها؟ وبكم سأبيعها؟ وكم سأدفع حتى أوصلها؟ والفرق هو ربحك. ومن حفظ هذه الثلاث لم يخسر كثيراً.', opts: [{ t: 'سأذكرها', next: 'hub' }] },
    journal: { mood: 'happy', say: 'هو دفترك أنت: فيه مهامك الجارية والتي أتممتها، والخيوط التي لم تكتشفها بعد، وألبوم الحكايات التي رويتُها لك. افتحه من قائمتي متى شئت.', opts: [{ t: 'ما أجمله', next: 'hub' }] },
  },
};

const DIALOGS = { riyadh_boss: BOSS, riyadh_trader: TRADER, riyadh_salem: SALEM };

// ---- باقي المدن الخمس عشرة: مشهد وحوارات تُولَّد من بيانات الزعماء (lore.js) بقالب واحد، مع ركن عمّ سالم وتاجر السوق العام
const CITY_AR = { mecca: 'مكة المكرمة', medina: 'المدينة المنورة', jeddah: 'جدة', hail: 'حائل', jazan: 'جازان', cairo: 'القاهرة', alex: 'الإسكندرية', aswan: 'أسوان', isfahan: 'أصفهان', shiraz: 'شيراز', tabriz: 'تبريز', delhi: 'دلهي', mumbai: 'بومباي', kolkata: 'كلكتا', xian: 'شيآن', guangzhou: 'كانتون', shanghai: 'شنغهاي' };
const PRODUCT_AR = { pearls: 'اللؤلؤ', dates: 'التمر', incense: 'البخور', textile: 'النسيج', glass: 'الزجاج', papyrus: 'ورق البردي', carpet: 'السجاد', turquoise: 'الفيروز', saffron: 'الزعفران', jewelry: 'المجوهرات', gems: 'الأحجار الكريمة', spice: 'التوابل', silk: 'الحرير', tea: 'الشاي', porcelain: 'الخزف' };
// مدينتا الحجاز بلا منتج خاص: لكل منهما ما تشتهر به أسواقها
const SPECIAL = { mecca: 'أسواق الحجيج', medina: 'تمر المدينة' }, SPECIAL_IS = { mecca: 'هي', medina: 'هو' };
const SIG = { jeddah: 'pearls', hail: 'dates', jazan: 'incense', cairo: 'textile', alex: 'glass', aswan: 'papyrus', isfahan: 'carpet', shiraz: 'turquoise', tabriz: 'saffron', delhi: 'jewelry', mumbai: 'gems', kolkata: 'spice', xian: 'silk', guangzhou: 'tea', shanghai: 'porcelain' };
const LORE_ = (typeof module !== 'undefined' && module.exports) ? require('./lore.js') : root.Lore;
function cityDialogs(id) {
  const lo = (LORE_ && LORE_.BOSS_LORE[id]) || {}, city = CITY_AR[id], prod = PRODUCT_AR[SIG[id]] || SPECIAL[id], hasSig = !!SIG[id], gift = 'gift_' + id;
  const hub = [
    { t: 'أقدّم لك هديةً من القلب (100 ريال)', if: [['gold', '>=', 100], ['ready', gift]], do: [['pay', 100], ['trust', id, 6], ['cool', gift, 7]], next: 'gift' },
    { t: 'كيف أكسب ثقتك؟', next: 'advice' }, { t: hasSig ? 'حدّثني عن ' + prod + ' ' + city : 'حدّثني عن سوق ' + city, next: 'product' },
    ...(hasSig ? [{ t: 'أريد إذن نقل الصنعة', if: [['level', '>=', 6]], next: 'craft' }] : []), END];
  const boss = { who: 'boss_' + id, city: id, start: [{ if: [['not', 'met_boss_' + id]], node: 'intro' }, { if: [['debtfree'], ['not', 'hail_debt_' + id]], node: 'hail_debt' }, { if: [['shop'], ['not', 'hail_shop_' + id]], node: 'hail_shop' }, { if: [['trust', id, '>=', 35]], node: 'friend' }, { node: 'hub' }], nodes: {
    hail_debt: { mood: 'warm', say: 'بلغني أنك أوفيتَ دَين جدّك كاملاً يا ولدي. هذا وفاءٌ يرفع قدر صاحبه بين التجار. هنيئاً لك.', opts: [{ t: 'بارك الله فيك', do: [['flag', 'hail_debt_' + id]], next: 'hub' }] },
    hail_shop: { mood: 'warm', say: 'سمعتُ أنك فتحتَ دكانك الأول. مبارك عليك؛ من بدأ صغيراً وصدق في تجارته كبر بإذن الله.', opts: [{ t: 'بارك الله فيك', do: [['flag', 'hail_shop_' + id]], next: 'hub' }] },
    intro: { mood: 'warm', say: 'أهلاً بك في سوق ' + city + ' يا ولدي. أنا {boss}، ' + (lo.trait ? 'يعرفني الناس بأني ' + lo.trait + '. ' : '') + 'أُقدّر ' + (lo.likes || 'الأمانة') + '. ومن تاجر في سوقي أراه بعيني، فكن أميناً تجدني سنداً لك.',
      opts: [{ t: 'السلام عليكم، شرّفني لقاؤك', do: [['flag', 'met_boss_' + id], ['trust', id, 2]], next: 'hub' }, { t: 'جئت أتاجر وأتعلم منكم', do: [['flag', 'met_boss_' + id], ['trust', id, 2]], next: 'hub' }] },
    hub: { mood: 'auto', say: 'ماذا تريد يا ولدي؟', opts: hub },
    friend: { mood: 'warm', say: 'ابن الأصل! لك عندي مكان في المجلس دائماً. تفضّل، ماذا في بالك؟', opts: hub },
    gift: { mood: 'warm', say: 'كرم منك! الهدية تقرّب القلوب، لكن الأمانة في الصفقات هي التي تبني الثقة. زادك الله من فضله.', opts: [{ t: 'شكراً لك', next: 'hub' }] },
    advice: { mood: 'stern', say: 'أُقدّر ' + (lo.likes || 'الأمانة') + (lo.dislikes ? '، ولا أرتاح إلى ' + lo.dislikes : '') + '. فإن أردت ثقتي فأوفِ بعقودك، واصدق في صفقاتك، وقدّم هديةً بين حين وآخر دون إلحاح.', opts: [{ t: 'فهمت، شكراً', next: 'hub' }] },
    product: { mood: 'warm', say: hasSig ? prod + ' هو ما تشتهر به ' + city + '، وصنعة أيدينا. السوق يبيعه لك هنا بسعر أرخص من أي مكان، وكلما غلا في غير بلادنا زاد ربحك. وللمتقدمين من التجار حصة يومية لا يتجاوزها أحد.' : prod + ' ' + (SPECIAL_IS[id] || 'هي') + ' ما تشتهر به ' + city + '. القوافل لا تنقطع عنها، والموسم يرفع الطلب فيها، فاعرف موعده وهيّئ بضاعتك قبله.', opts: [{ t: 'ممتاز، وماذا بعد؟', next: 'hub' }] },
    craft: { mood: 'stern', say: 'تريد أن تصنع ' + prod + ' في بلاد أخرى؟ صنعتنا غالية. إذن النقل يحتاج ثقةً بيننا لا تقل عن 10، وألفان وخمسمئة ريال رسماً.', opts: [
      { t: 'أدفع الرسم (2500 ريال)', if: [['gold', '>=', 2500], ['trust', id, '>=', 10]], do: [['craft', id]], next: 'craft_ok' }, { t: 'سأعود حين أكون أهلاً لذلك', next: 'hub' }] },
    craft_ok: { mood: 'warm', say: 'اتفقنا. من اليوم لك أن تصنع ' + prod + ' حيث شئت، وبجودة تشرّف سمعتك وسمعتنا.', opts: [{ t: 'أعدك بذلك', next: 'hub' }] } } };
  const trader = { who: 'trader', city: id, start: [{ if: [['not', 'met_trader_' + id]], node: 'intro' }, { node: 'hub' }], nodes: {
    intro: { mood: 'pleased', say: 'السلام عليكم! أنا من تجّار سوق ' + city + ' منذ زمن. وأحب من يساوم بأدب ويقرأ وجه الزبون قبل أن يتكلم.', opts: [{ t: 'وعليكم السلام، علّمني المساومة', do: [['flag', 'met_trader_' + id]], next: 'tips' }, { t: 'سلّمك الله، ماذا عندك؟', do: [['flag', 'met_trader_' + id]], next: 'hub' }] },
    hub: { mood: 'neutral', say: 'تفضّل يا ولدي. ماذا أخدمك؟', opts: [{ t: 'كيف أساوم؟', next: 'tips' }, { t: 'ماذا تعرف عن ' + prod + '؟', next: 'prod' }, { t: 'شكراً، سلام', end: true }] },
    tips: { mood: 'pleased', say: 'اقرأ وجه التاجر قبل أن تتكلم: المبتسم يلين لمن يُصرّ على سعره، والهادئ يقتنع بالسعر المرجعي، والمنزعج لا يلين إلا بكلمة طيبة. وتفتح لك المساومة حين تتقدم في تعلّمك.', opts: [{ t: 'جزاك الله خيراً', next: 'hub' }] },
    prod: { mood: 'neutral', say: hasSig ? 'اشترِ ' + prod + ' هنا حيث هو أرخص، وبِعه حيث يُطلب أكثر. وانظر دائماً إلى السعر المرجعي على البطاقة: هو ميزانك.' : 'في ' + city + ' يجتمع التجار والوافدون، فيرتفع الطلب في المواسم. اشترِ حين يرخص السعر وبِع حين يغلو، وانظر دائماً إلى السعر المرجعي على البطاقة: هو ميزانك.', opts: [{ t: 'نصيحة طيبة', next: 'hub' }] } } };
  const salem = { who: 'salem', city: id, start: [{ if: [['not', 'met_salem_' + id]], node: 'intro' }, { node: 'hub' }], nodes: {
    intro: { mood: 'teach', say: 'هنا في ' + city + ' ركنٌ هادئ كان جدّك يستريح فيه ويراجع حساباته قبل أن يتابع رحلته. اجلس يا ولدي.', opts: [{ t: 'حدّثني أكثر', do: [['flag', 'met_salem_' + id]], next: 'hub' }] },
    hub: { mood: 'happy', say: 'اجلس قليلاً. ماذا تريد أن تعرف؟', opts: [{ t: 'ما نصيحتك اليوم؟', next: 'tip' }, { t: 'شكراً يا عم سالم', end: true }] },
    tip: { mood: 'teach', say: 'قبل أن تشتري سلعة اسأل نفسك ثلاثاً: بكم سأشتريها؟ وبكم سأبيعها؟ وكم سأدفع حتى أوصلها؟ والفرق هو ربحك.', opts: [{ t: 'سأذكرها', next: 'hub' }] } } };
  return { boss, trader, salem, city };
}
for (const id of Object.keys(CITY_AR)) {
  const g = cityDialogs(id);
  SCENES[id] = { img: 'scene/plaza_' + id, title: 'ساحة سوق ' + g.city, spots: [
    { id: 'salem', x: 24, y: 66, label: 'عمّ سالم', icon: 'ui/spot_salem', dlg: id + '_salem' },
    { id: 'trader', x: 52, y: 67, label: 'التاجر', icon: 'ui/spot_trader', dlg: id + '_trader' },
    { id: 'boss', x: 81, y: 62, label: 'الزعيم', icon: 'ui/spot_boss', dlg: id + '_boss' }] };
  DIALOGS[id + '_boss'] = g.boss; DIALOGS[id + '_trader'] = g.trader; DIALOGS[id + '_salem'] = g.salem;
}
const API = { SCENES, QUESTS, DIALOGS };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Dialogs = API;
})(typeof window !== 'undefined' ? window : globalThis);
