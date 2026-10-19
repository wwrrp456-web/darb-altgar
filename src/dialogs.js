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
  who: 'boss_riyadh', city: 'riyadh', start: [{ if: [['not', 'met_boss']], node: 'intro' }, { if: [['trust', 'riyadh', '>=', 35]], node: 'friend' }, { node: 'hub' }],
  nodes: {
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
const API = { SCENES, QUESTS, DIALOGS };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Dialogs = API;
})(typeof window !== 'undefined' ? window : globalThis);
