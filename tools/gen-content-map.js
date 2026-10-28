// يولّد src/content-map.js من المصادر الحيّة بقواعد تصنيف صريحة (راجعها وعدّل الاستثناءات هنا): node tools/gen-content-map.js
// السمات الخمس لكل قطعة: الفصل، الموضوع، المتطلب، النوع (core أساسي / side جانبي)، الجهد (1 صغير، 2 متوسط، 3 كبير).
const fs = require('fs'), path = require('path'), { enumerate } = require('./content-enum.js'), W = require('./content-when.js');
const E = require('../src/engine.js'), L = require('../src/lessons.js'), ACH = Object.fromEntries(require('../src/achievements.js').LIST.map(a => [a.id.toString(), a]));
const CHAPTERS = [
  { n: 1, title: 'القافلة الأولى', topic: 'السعر والقيمة والهامش' },
  { n: 2, title: 'السوق وزعيمه', topic: 'الجمارك والتنويع والثقة' },
  { n: 3, title: 'الدكان والأمانة', topic: 'المخزون والعمال والعيب والزكاة' },
  { n: 4, title: 'الشراكة والدَّين', topic: 'المضاربة والقرض الحسن والوفاء والتمويل' },
  { n: 5, title: 'الأرض والأنعام', topic: 'المزرعة والتكاثر' },
  { n: 6, title: 'البحر والأقاليم', topic: 'العملات والبحر والإدارة عن بُعد' },
  { n: 7, title: 'الإرث', topic: 'الاستقلال والتقاعد والوراثة' }
];
const CH_LV = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 4, 9: 4, 10: 4 }, lvCh = n => CH_LV[Math.min(10, Math.max(1, n))];
const REACT_CH = [[7, /^(freedom|wishDone|restStart|restDone|yearEnd|goalDone|phase4)$/], [6, /^(seaPirates|seaStorm|buyShip|agentBuy|abroadOpen|factoryAbroad|phase3)$/], [5, /^(buildFarm|herdBuy|slaughter|buyStud|mountBuy|buildButcher|cutMeat|pairSet|liveBuy|phase2)$/],
  [3, /^(buildShop|toStore|wageLate|hireMgr|mgrTheft|hireStaff|rentShop|buyShop|rentLate|noSeller|quotaHit|insureOn|shopUp|defect.*|factory(Weak|Crisis|Lost)|nisab|zakat.*|stall|exchange)$/],
  [4, /^(inst.*|vaultBreak|brokerNo|brokerLost|friend.*|oppAsset|oppSold|qard|settle|mud.*|mdLate|murabaha|signPact|exclSign|tipDebt|broke)$/],
  [2, /^(guardHire|ushur|crossed|bandits|banditsRepel|roadBandits|roadPaid|capHire|capQuit|shock.*|tkSurplus|rival.*|seasonStart|haggle.*|productStory|giftLesson)$/]];
const reactCh = k => { for (const [c, re] of REACT_CH) if (re.test(k)) return c; return 1; };
const ACH_CH = { 'التجارة والربح': 1, 'السفر والاستكشاف': 2, 'المصانع والأعمال': 3, 'الزعماء والعقود': 4, 'السمعة والوفاء والزكاة': 4, 'المواشي والمزرعة': 5, 'التعلّم ومسيرة عمّ سالم': 1 };
const CARD_CH = { g_farm: 5, g_sea: 6, g_harbor: 6, g_monsoon: 6, g_stormsea: 6, g_pirsea: 6, g_factory: 3, g_shop: 3, f_zakat: 3, f_qirad: 4, f_samaha: 4, f_amana: 3, f_wakala: 4 };
const ANCHORS = new Set(['react:buildFarm', 'react:buyShip', 'card:g_farm', 'card:g_sea', 'tablet:freedom', 'tablet:free', 'stage:21', 'stage:22']);
const MINL = { cure1: 1, cure2: 2, cure3: 3, cure4: 4, cure5: 7, cure6: 9, cure7: 10, law1: 3, law2: 5, law3: 8, law4: 4, law5: 6 }, MINLV = { 1: 4, 2: 6, 3: 8 };
const stageCh = s => s.n <= 3 ? 1 : s.n <= 5 ? 2 : s.n <= 9 ? 3 : s.n <= 18 ? 4 : s.n <= 20 ? 3 : 7;
const BAB = { 'الخيارات': 'الخيارات', 'الربا': 'الربا والصرف' };
const effort = len => len < 400 ? 1 : len < 1400 ? 2 : 3;
const rows = [], P = enumerate();
for (const p of P) {
  let ch, req = [], kind = 'side', topic = p.label;
  switch (p.type) {
    case 'level': ch = lvCh(p.n); kind = 'core'; if (p.n > 1) req = ['level:' + (p.n - 1)]; break;
    case 'stage': ch = stageCh(p); kind = 'core'; req = p.n === 19 || p.n === 20 ? ['level:7'] : p.n === 21 ? ['stage:18'] : p.n > 1 ? ['stage:' + (p.n - 1)] : []; if (p.n === 20) req = ['stage:19']; break;
    case 'case': ch = p.diff === 1 ? 2 : p.diff === 2 ? 4 : 5; if (p.diff <= 2 && /^(aib|qabd|talaf|ajir_)/.test(p.id.slice(5))) ch = 3; req = ['level:' + MINLV[p.diff]]; topic = p.bab + ': ' + p.label; break;
    case 'card': ch = CARD_CH[p.id.slice(5)] || lvCh(p.min); req = ['level:' + Math.min(10, p.min)]; topic = (p.track === 'f' ? 'فقه التجارة: ' : 'دليل الميدان: ') + p.label; if (ANCHORS.has(p.id)) kind = 'core'; break;
    case 'tablet': { const k = p.id.slice(7); if (k === 'free' || k === 'freedom') { ch = 7; kind = 'core'; req = ['stage:' + (k === 'freedom' ? 21 : 22)]; if (k === 'free') req = ['tablet:freedom']; } else { ch = lvCh(MINL[k]); req = ['level:' + MINL[k]]; } break; }
    case 'wisdom': ch = 4; topic = 'حِكَم الطريق: ' + p.label; break;
    case 'boss': ch = p.ch === 1 ? 2 : p.ch === 2 ? 4 : 6; req = ['level:' + (p.ch === 1 ? 4 : p.ch === 2 ? 8 : 10)]; topic = 'حكاية الزعيم ' + p.city + ': ' + p.label; break;
    case 'secret': ch = p.scope === 'city' ? 2 : 6; req = ['level:' + (p.scope === 'city' ? 4 : 10)]; break;
    case 'product': ch = Math.min(4, 1 + Math.floor(p.idx / 4)); topic = 'حكاية سلعة ' + p.id.slice(8); break;
    case 'achievement': ch = ACH_CH[p.cat]; topic = p.cat + ': ' + p.label; break;
    case 'react': ch = reactCh(p.id.slice(6)); topic = 'تعليق عمّ سالم: ' + p.id.slice(6); if (ANCHORS.has(p.id)) kind = 'core'; break;
  }
  // شرط الظهور الفعلي (when) ومصدره في الشيفرة (src): انظر tools/content-when.js
  let when, src; const key = p.id.slice(p.id.indexOf(':') + 1);
  switch (p.type) {
    case 'level': { const st = E.STAGES.find(x => x.source === p.n); when = 'درسه مصدر المرحلة ' + st.n + ': يُروى عند بلوغ تلك المرحلة بعد مهلة الانتظار بين المراحل، ويكتمل حين تتحقق أهدافه (LEVELS[' + (p.n - 1) + '].goals)'; src = 'engine/28-life.js::stageCheck'; break; }
    case 'stage': when = 'يُروى عند بلوغ المرحلة ' + p.n + ' بعد مهلة الانتظار بين المراحل، وتكتمل حين تتحقق أهدافها (STAGES[' + (p.n - 1) + '].goals)'; src = 'engine/28-life.js::stageCheck'; break;
    case 'case': when = 'تجهز مسألة كل 30 إلى 45 يوماً بعد المستوى 4 وتنتظر في مكتب التاجر (mjReady)؛ تُختار أول مسألة لم تُعرض بصعوبة ≤ ما يسمح به المستوى (الصعوبة ' + p.diff + ' من المستوى ' + MINLV[p.diff] + ')' + (key === 'aib' ? '؛ وتُقدَّم أولاً بعد اكتشاف عيب في بضاعة (mjWant)' : key === 'qabd' ? '؛ وتُقدَّم أولاً بعد أول طلب عبر وكيل (mjWant)' : ''); src = 'engine/22-learn.js::mjNext'; break;
    case 'card': when = W.CARD_WHEN[key] + '، وقد بلغ مستواك ' + p.min + ' فأكثر؛ بطاقة واحدة كل 3 أيام ولا بطاقة أثناء فترة التمرين'; src = 'engine/29-cards.js::CARD_TRIG.' + key; break;
    case 'tablet': when = W.TABLET_WHEN[key] + (W.TABLET_MINL[key] ? '، بعد أن يروي عمّ سالم الدرس ' + W.TABLET_MINL[key] : ''); src = 'engine/22-learn.js::tabletCheck'; break;
    case 'wisdom': when = 'تظهر في سطر حكمة الطريق أثناء السفر، وتتبدل مع كل رحلة بحسب (يوم اللعبة + ما بقي من الرحلة) على عدد الحِكَم'; src = 'ui/04-header.js::roadTip'; break;
    case 'boss': { const n = p.ch; when = 'بعد أن يروي عمّ سالم المستوى 3: ' + (n === 1 ? 'زرتَ هذه المدينة مرة على الأقل' : n === 2 ? 'ارتفعت ثقة زعيمها إلى 10 فأكثر أو أهديتَه هدية' : 'بلغت ثقته 35 أو وقّعتَ معه شراكة'); src = 'engine/22-learn.js::loreCheck'; break; }
    case 'secret': if (p.scope === 'city') { when = 'بعد أن يروي عمّ سالم المستوى 3: زرتَ هذه المدينة مرتين وبلغت مبيعاتك فيها 1000 ريال'; src = 'engine/22-learn.js::loreCheck'; } else { when = 'عند أول وصول إلى هذه الدولة (ودولة البداية عند اختيار الشخصية)'; src = 'engine/22-learn.js::learnCountry'; } break;
    case 'product': when = 'عند أول شراء أو بيع ناجح لهذه السلعة'; src = 'engine/22-learn.js::productStory'; break;
    case 'achievement': when = 'تُمنح عند: ' + ACH[key].desc; src = W.achSrc(key); break;
    case 'react': { const c = L.REACT[key].cool; when = W.REACT_WHEN[key] + (c ? ' (تهدئة ' + c + ' يوماً)' : ''); src = W.reactSrc(key); break; }
  }
  if (p.type === 'react' && ch > 1 && !req.length) req = ['level:' + [0, 1, 4, 6, 8, 10, 10, 10][ch]];
  rows.push([p.id, p.type, ch, topic, req.join(','), kind === 'core' ? 'c' : 's', effort(p.len), when, src]);
}
// مراحل الإيقاع: قطع تُقدَّم قبل ما بعدها
const out = `/* خريطة المحتوى (WP-16): كل قطعة محتوى للاعب بفصل وموضوع ومتطلب ونوع وجهد. مولَّدة بـ node tools/gen-content-map.js من المصادر الحيّة؛
   التصنيف اقتراح قابل للتعديل (القواعد في أعلى tools/gen-content-map.js). ما يضاف من محتوى جديد يجب أن يسجَّل هنا وإلا فشل test/content-map.test.js.
   الصف: [المعرّف، النوع، الفصل، الموضوع، المتطلبات (مفصولة بفاصلة)، c أساسي أو s جانبي، الجهد 1-3، when شرط الظهور الفعلي مقروءاً، src الملف::الدالة التي تحكمه (WP-16ب)].
   when وsrc مستخرجان من الشيفرة (tools/content-when.js) ولا يُنسخ منطق الشروط هنا: الشرط القابل للتنفيذ مكانه WP-17أ باستدعاء الدوال المذكورة. */
(function (root) {
'use strict';
const CHAPTERS = ${JSON.stringify(CHAPTERS)};
const ROWS = ${JSON.stringify(rows)};
const PIECES = ROWS.map(([id, type, ch, topic, req, kind, effort, when, src]) => ({ id, type, ch, topic, req: req ? req.split(',') : [], kind: kind === 'c' ? 'core' : 'side', effort, when, src }));
const API = { CHAPTERS, PIECES, byId: id => PIECES.find(p => p.id === id) || null, ofChapter: n => PIECES.filter(p => p.ch === n) };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ContentMap = API;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, '../src/content-map.js'), out);
console.log('src/content-map.js', rows.length, 'قطعة');
