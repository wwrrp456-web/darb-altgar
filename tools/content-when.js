// شرط الظهور الفعلي لكل قطعة محتوى مقروءاً، مع مصدره في الشيفرة: file::symbol[.key] (WP-16ب).
// مستخرَج بقراءة الدوال المذكورة في كل نوع، لا مستنتج؛ ولا يُنسَخ منطق الشروط إلى الخريطة (الشرط القابل للتنفيذ مكانه WP-17أ باستدعاء هذه الدوال).
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'src');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
// أقرب دالة تحيط بالسطر (function name أو const name = …=> أو طريقة في كائن الأفعال A)
function enclosing(file, lineNo) {
  const L = read(file).split('\n');
  for (let i = lineNo - 1; i >= 0; i--) {
    let m = L[i].match(/^(?:async )?function (\w+)/) || L[i].match(/^const (\w+) *= *(?:async )?\(?[\w, ]*\)? *=>/) || L[i].match(/^  (\w+)\(([^)]*)\) \{/) || L[i].match(/^  (\w+): *\(?S[,)]/);
    if (m) return m[1];
  }
  return null;
}
const CARD_WHEN = {
  f_sidq: 'بعد أول صفقة رابحة', f_dayn: 'بعد سداد أول مبلغ من دَين الجدّ', g_plaza: 'حين تكون قافلتك واقفة في الرياض', g_ach: 'بعد نيل أول إنجاز', f_taradi: 'بعد ثلاث اختيارات في المساومة', g_haggle: 'بعد بدء أول مساومة',
  f_tatfif: 'بعد ثلاث عمليات بيع', g_stories: 'بعد أول حكاية سلعة في دفترك', f_ujra: 'حين يكون عندك عامل في أي مدينة', g_shop: 'حين يكون عندك دكان', f_ghish: 'حين يكون عندك مصنع', g_factory: 'حين يكون عندك مصنع',
  f_ihtikar: 'حين يقوم احتكار في سوق ما', g_shock: 'حين يكون في اللعبة حدث مؤثر قائم', g_road: 'حين تتعرض قافلتك لحدث في الطريق', f_tasir: 'حين يكون في اللعبة موسم قائم', g_season: 'حين يكون في اللعبة موسم قائم',
  f_taamin: 'حين تؤمّن قافلة أو تشترك في صندوق التكافل', g_fleet: 'عند بلوغ الطور الثاني', f_wakala: 'بعد أول طلب عبر وكيل', f_amana: 'حين يكون لك مدير في مدينة', g_farm: 'حين تملك مزرعة', f_zakat: 'بعد أول زكاة تؤدّيها',
  f_munhi: 'بعد عشرة أيام من ظهور المنافس', g_rival: 'حين يظهر منافس', f_dinar: 'حين تملك فضة أو بعد ثلاث عمليات صرف', f_sarf: 'بعد أول صرف عملة', g_sea: 'حين تملك سفينة', g_harbor: 'بعد أول رحلة بحرية', g_monsoon: 'بعد رحلتين بحريتين',
  g_stormsea: 'بعد أول عاصفة بحرية', g_pirsea: 'بعد أول هجوم قراصنة', f_qirad: 'بعد ثلاث رحلات بحرية', g_port_jeddah: 'بعد الرسوّ في جدة', g_port_jazan: 'بعد الرسوّ في جازان', g_port_alex: 'بعد الرسوّ في الإسكندرية',
  g_port_mumbai: 'بعد الرسوّ في مومباي', g_port_kolkata: 'بعد الرسوّ في كلكتا', g_port_guangzhou: 'بعد الرسوّ في قوانغتشو', g_port_shanghai: 'بعد الرسوّ في شنغهاي', g_currency: 'حين تقف قافلتك في مدينة خارج السعودية',
  f_riba: 'عند بلوغ الطور الرابع أو بعد أول استثمار أو مرابحة أو قرض أو صكّ', f_samaha: 'عند بلوغ المستوى 10'
};
const TABLET_WHEN = {
  cure1: 'حين يصير في حصّالتك مال', cure2: 'بعد أن يروي عمّ سالم درس المستوى 2', cure3: 'حين تبلغ ثروتك 3000 أو تشتري بفرصة من حصّالتك', cure4: 'حين تؤمّن قافلة أو تضع عليها حارساً', cure5: 'حين يكون عندك دكان',
  cure6: 'حين يكون عندك دكانان أو مضاربة أو صكّ', cure7: 'بعد عشرين صفقة رابحة', law1: 'حين يبلغ ادخارك هدف الحصّالة', law2: 'بعد الربح من ثلاث سلع مختلفة', law3: 'بعد توقيع أول شراكة مع زعيم', law4: 'بعد أول صفقة خاسرة',
  law5: 'بعد رفض عرض سمسار أو عند درس المستوى 9', free: 'حين تُسدَّد دَين الجدّ فيتحرر دخلك', freedom: 'حين يغطي دخلك السلبي مصروفك ثلاثين يوماً'
};
const TABLET_MINL = { cure1: 1, cure2: 2, cure3: 3, cure4: 4, cure5: 7, cure6: 9, cure7: 10, law1: 3, law2: 5, law3: 8, law4: 4, law5: 6 }; // نسخة من tabletCheck للتوثيق فقط
// تعليقات عمّ سالم: نص الشرط مقروءاً لما يُطلَق مباشرة من الشيفرة؛ وما سواه أسماء أفعال تُطلقها learnEvent تلقائياً بعد نجاح الفعل
const REACT_WHEN = {
  guardHire: 'بعد توظيف حارس لقافلة', newYear: 'عند بدء سنة جديدة', defectFound: 'حين تكتشف عيباً في بضاعة اشتريتَها', defectRet: 'بعد ردّ البضاعة المعيبة واسترداد ثمنها', defectArsh: 'بعد أخذ الأرش على بضاعة معيبة',
  buy: 'بعد كل شراء ناجح (يُهدَّأ بعدها)', sell: 'بعد كل بيع ناجح', profit: 'بعد كل بيع رابح', profit15: 'بعد بيع ربحه 15% فأكثر من تكلفته', bigProfit: 'بعد بيع ربحه 25% فأكثر (مرة كل 12 يوماً)', loss: 'بعد بيع بخسارة (مرة كل 15 يوماً)',
  stall: 'بعد أربع صفقات بيع في المستوى الواحد وهو ≤ 3', arrive: 'عند وصول القافلة الرئيسية (مرة كل 6 أيام)', crossed: 'عند عبور القافلة الرئيسية حدود دولة', restStart: 'حين ينتهي المستوى وتبدأ فترة التمرين (مسار المستويات القديم فقط؛ لعب المراحل العمرية لا يطلقه)', restDone: 'حين تنتهي فترة التمرين (مسار المستويات القديم فقط)',
  abroadOpen: 'حين يُفتح السفر إلى دولة أخرى (المستوى ≥ 4 وأتممتَ زيارة كل أسواق بلدك وبلغ نفوذك 2000) (مسار المستويات القديم فقط؛ في المراحل العمرية يُفتح السفر بخبر لا بتعليق)', instSoon: 'قبل خمسة أيام من قسط دَين الجدّ إن لم يُسدَّد', instOk: 'عند حلول القسط وقد سُدّد', instLate: 'عند تأخر قسط دَين الجدّ (حالة قائمة تُنطق مرة)',
  vaultBreak: 'بعد كسر الحصّالة (سحب كل رصيدها)', wishDone: 'حين تبلغ الثروة التي حدّدتَها رغبةً', freedom: 'حين يغطي دخلك السلبي مصروفك 30 يوماً', brokerNo: 'بعد رفض عرض السمسار', brokerLost: 'بعد أن يحتال عليك السمسار',
  friendOk: 'حين يردّ صديقك القرض', friendLost: 'حين يضيع قرض الصديق', bandits: 'عند خسارة بضاعة لقطاع طرق (مرة كل 20 يوماً)', roadBandits: 'عند اعتراض قطاع طرق لقافلتك', banditsRepel: 'بعد صدّ قطاع طرق أو قراصنة (مرة كل 30 يوماً)',
  roadPaid: 'بعد دفع فدية لقطاع طرق أو قراصنة', hungry: 'حين تجوع قافلتك في الطريق (حالة قائمة)', broke: 'حين ينفد نقدك ولا بضاعة معك (حالة قائمة)', oppAsset: 'بعد اغتنام فرصة أصل من الحصّالة', oppSold: 'بعد بيع ذهب أو فضة في فرصة', wageLate: 'عند أول تأخر لأجر عامل',
  mountBuy: 'بعد شراء مطيّة لقافلة', insureOn: 'بعد الاشتراك في صندوق التكافل', shopUp: 'بعد تطوير دكان', productStory: 'حين تُضاف حكاية سلعة إلى دفترك', seasonStart: 'عند بدء موسم', rivalPass: 'حين تتفوق ثروتك على المنافس', rivalAhead: 'حين يتقدمك المنافس بوضوح',
  yearEnd: 'عند ختام الحول (السنة)', goalDone: 'حين تنجز هدفاً من أهداف الحول', capHire: 'بعد تعيين قائد قافلة', capQuit: 'حين يترك قائد عمله لتأخر أجره', shockRumor: 'عند ظهور إشاعة حدث (جفاف أو احتكار…)', shockFire: 'عند حريق يصيب مخزناً', tkSurplus: 'حين يوزّع صندوق التكافل فائضه',
  shockTax: 'عند مداهمة عمّال الضرائب', buyShip: 'بعد شراء سفينة', seaPirates: 'عند هجوم قراصنة على السفينة', seaStorm: 'عند عاصفة بحرية', giftLesson: 'بعد إهداء زعيم سوق هدية', ushur: 'عند دفع رسوم عبور (عُشور) للقافلة الرئيسية', factoryAbroad: 'بعد بناء مصنع خارج بلدك',
  factoryWeak: 'حين تهبط سلامة مصنع دون 40%', factoryCrisis: 'عند دخول مصنع في أزمة', factoryLost: 'حين يُباع مصنع إجبارياً', hireMgr: 'بعد تعيين مدير', mgrTheft: 'حين يسرق مدير ويهرب', haggleStart: 'عند بدء مساومة', haggleWin: 'عند فوزك في مساومة', haggleFail: 'عند خسارتك مساومة',
  buildButcher: 'بعد بناء ملحمة', cutMeat: 'بعد ذبح وتقطيع ماشية', pairSet: 'بعد تحديد زوج تربية', liveBuy: 'بعد شراء حيوان حيّ للحمولة', herdBuy: 'بعد شراء حيوان لقطيع التربية', rentLate: 'عند أول تأخر في إيجار دكان', noSeller: 'حين يعوزك البائع في دكان (حالة قائمة)',
  quotaHit: 'حين يرفض الشراء لبلوغ حصة اليوم من منتج المدينة', exclSign: 'بعد توقيع شراكة حصرية', qard: 'بعد طلب قرض حسن', mudLoss: 'عند خسارة في مضاربة', mdLate: 'عند تأخر سداد قرض أو مرابحة', nisab: 'حين يبلغ مالك النصاب ويبدأ الحول', zakatSoon: 'قبل ثلاثين يوماً من حلول الحول', zakatLate: 'حين تتأخر الزكاة بعد موعد التأجيل',
  tipCash: 'حين يزيد نقدك عن 3000 وفوق 60% من ثروتك (نصيحة قائمة)', tipSpike: 'حين يرتفع سعر سلعة تحملها 25% فأكثر', tipCheap: 'حين تجد سلعة رخيصة 20% دون مرجعها', tipConc: 'حين تتركز بضاعتك (فوق 55%) في سلعة واحدة', tipGuard: 'حين تحمل بضاعة فوق 4000 بحراسة قليلة وبلا تكافل', tipDebt: 'حين يكون عليك قرض (نصيحة قائمة)',
  zakatDefer: 'بعد تأجيل الزكاة', zakatPay: 'بعد أداء الزكاة', settle: 'بعد سداد قرض أو مرابحة', murabaha: 'بعد أخذ تمويل مرابحة', agentBuy: 'بعد طلب شراء عبر وكيل', signPact: 'بعد توقيع شراكة مع زعيم', hireStaff: 'بعد توظيف عامل في دكان',
  buyShop: 'بعد شراء دكان', rentShop: 'بعد استئجار دكان', toStore: 'بعد نقل بضاعة إلى مخزن المدينة', buildShop: 'بعد بناء دكان', buildFarm: 'بعد بناء مزرعة', slaughter: 'بعد ذبح ماشية', buyStud: 'بعد شراء فحل', exchange: 'بعد صرف عملة', travel: 'بعد بدء رحلة',
  back: 'بعد العودة (رجوع القافلة)', buyCheap: 'بعد شراء بسعر أقل من المرجعي', profitCross: 'بعد بيع رابح في دولة غير التي اشتريتَ منها', phase2: 'عند فتح الطور الثاني (الدكاكين والأسطول)', phase3: 'عند فتح الطور الثالث (التكامل الصناعي)', phase4: 'عند فتح الطور الرابع'
};
const REACT_SRC = { _default: 'engine/22-learn.js::learnEvent' };
const REACT_OVERRIDE = { shockFire: 'engine/17-shocks.js::SHOCKS.fire', shockTax: 'engine/17-shocks.js::SHOCKS.taxraid', vaultBreak: 'engine/27-save.js::vaultBreak', phase2: null, phase3: null, phase4: null };
function reactSrc(key) {
  if (key in REACT_OVERRIDE) { if (REACT_OVERRIDE[key]) return REACT_OVERRIDE[key]; return 'engine/11-day.js::' + enclosing('engine/11-day.js', 22); }
  const files = fs.readdirSync(path.join(ROOT, 'engine')).filter(f => f.endsWith('.js')).sort();
  for (const f of files) { const L = read('engine/' + f).split('\n'); for (let i = 0; i < L.length; i++) if (new RegExp("learnReact\\(\\w+, *'" + key + "'").test(L[i])) { const sym = enclosing('engine/' + f, i + 1); if (sym) return 'engine/' + f + '::' + sym; } }
  return REACT_SRC._default;
}
function achSrc(id) {
  const checks = read('engine/28-achievements.js'); if (new RegExp('^  ' + id + ':', 'm').test(checks)) return 'engine/28-achievements.js::ACH_CHECK.' + id;
  const files = fs.readdirSync(path.join(ROOT, 'engine')).filter(f => f.endsWith('.js')).sort();
  for (const f of files) { const L = read('engine/' + f).split('\n'); for (let i = 0; i < L.length; i++) if (new RegExp("ach(?:Grant|Flag)\\(\\w+, '" + id + "'").test(L[i])) { const sym = enclosing('engine/' + f, i + 1); if (sym) return 'engine/' + f + '::' + sym; } }
  return 'engine/28-achievements.js::achEvent';
}
module.exports = { CARD_WHEN, TABLET_WHEN, TABLET_MINL, REACT_WHEN, reactSrc, achSrc, enclosing };
