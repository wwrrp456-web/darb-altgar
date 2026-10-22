/* مهمتان جانبيتان للدمج مع بيانات الحوارات، دون ربط بالمحرك أو الواجهة هنا.
   gain أثر معتمد في توضيحات docs/CODEX_TASKS_11.md، يضيفه مسؤول الدمج.
   sellTo الحالي يحسب الثمن من السعر المرجعي، لا من سعر السوق المتغير؛
   لذلك تسمي النصوص أساس الزيادة صراحة، وتحتاج علاوة السعر الحي مراجعة عند الدمج.
   need في مهمة المعسر يصف بضاعة بيعت سابقاً، ولا يطلب تسليمها أو خصمها ثانية؛
   يتولى الدمج عرض الدين والمهلة في الدفتر بدلاً من عداد حمولة التسليم. */
(function (root) {
'use strict';
const DEBT = 300;
const HALF_DEBT = DEBT / 2;
const HAJJ_QTY = 12;
const HAJJ_PAY = 1.3;

const QUESTS_EXTRA = {
  q_hajj: {
    city: 'mecca', title: 'زاد قافلة الحج', need: ['wheat', HAJJ_QTY], pay: HAJJ_PAY,
    text: 'أوصل 12 وحدة من القمح إلى تاجر مكة المكرمة لزاد قافلة الحجيج على درب زبيدة، بزيادة 30٪ على السعر المرجعي.'
  },
  q_debtor: {
    city: 'riyadh', title: 'إعانة التاجر المعسر', need: ['dates', 10], pay: 0,
    // لا مكافأة sellTo؛ مبلغ الدين ثابت وتسويته حصراً عبر gain.
    amount: DEBT,
    text: 'لتاجر مبتدئ في الرياض دين لك قدره 300 ريال ثمن 10 وحدات من التمر؛ اختر إمهاله 10 أيام، أو إسقاط 150 ريالاً وقبض الباقي، أو قبض الثمن كاملاً الآن.'
  }
};

const DIALOGS_EXTRA = {
  mecca_hajj_trader: {
    who: 'trader', city: 'mecca',
    start: [
      { if: [['quest', 'q_hajj', 'done']], node: 'q_done' },
      { if: [['quest', 'q_hajj', 'active']], node: 'q_active' },
      { if: [['level', '>=', 4]], node: 'q_offer' },
      { node: 'q_locked' }
    ],
    nodes: {
      q_locked: {
        mood: 'neutral',
        say: 'الطريق طويل، فاستعد له وتعلّم حساب نفقته، ثم عد إليّ؛ أحب أن يصل زاد الحجيج في أمان.',
        opts: [{ t: 'سأستعد ثم أعود', end: true }]
      },
      q_offer: {
        mood: 'pleased',
        say: 'أنتظر قافلة للحجيج تأتي على درب زبيدة. أحتاج 12 وحدة من القمح لزادهم، وأدفع زيادة 30٪ على السعر المرجعي.',
        opts: [
          { t: 'سأجلب لك القمح', if: [['level', '>=', 4], ['quest', 'q_hajj', 'none']], do: [['quest', 'start', 'q_hajj']], end: true },
          { t: 'لا أستطيع الآن', end: true }
        ]
      },
      q_active: {
        mood: 'neutral',
        say: 'هل أحضرت 12 وحدة من القمح؟ اتفقنا على زيادة 30٪ على السعر المرجعي، والزاد ينتظره أهل القافلة.',
        opts: [
          { t: 'نعم، هذا زاد القافلة', if: [['quest', 'q_hajj', 'active'], ['has', 'wheat', HAJJ_QTY]], do: [['sellTo', 'wheat', HAJJ_QTY, HAJJ_PAY], ['trust', 'mecca', 3], ['quest', 'done', 'q_hajj']], next: 'q_done' },
          { t: 'ليس بعد، سأعود بالقمح', end: true }
        ]
      },
      q_done: {
        mood: 'pleased',
        say: 'وصل الزاد، واستقر حسابنا. أشكرك على وفائك؛ سأذكر حسن معاملتك بين أهل السوق.',
        opts: [{ t: 'رحلة طيبة لقافلتكم', end: true }]
      }
    }
  },
  riyadh_debtor: {
    who: 'trader', city: 'riyadh',
    start: [
      { if: [['quest', 'q_debtor', 'done']], node: 'q_done' },
      { if: [['quest', 'q_debtor', 'active'], ['flag', 'q_debtor_deferred'], ['ready', 'q_debtor_due']], node: 'q_repay' },
      { if: [['quest', 'q_debtor', 'active'], ['flag', 'q_debtor_deferred']], node: 'q_wait' },
      { if: [['quest', 'q_debtor', 'active']], node: 'q_active' },
      { node: 'q_offer' }
    ],
    nodes: {
      q_offer: {
        mood: 'neutral',
        say: 'أنا تاجر مبتدئ. اشتريت منك 10 وحدات من التمر بثمن 300 ريال، ثم تعثّر بيعي. جئت أصارحك، فالمال في ذمتي ولم أنس حقك.',
        opts: [
          { t: 'لنراجع حسابنا معاً', if: [['quest', 'q_debtor', 'none']], do: [['quest', 'start', 'q_debtor']], next: 'q_active' },
          { t: 'نراجع الحساب لاحقاً', end: true }
        ]
      },
      q_active: {
        mood: 'neutral',
        say: 'عليّ لك 300 ريال ثمن التمر. إن أمهلتني 10 أيام أتممت بيع بضاعتي، وإن أردت مالك الآن فسأجمعه لك.',
        opts: [
          { t: 'أمهلك 10 أيام', if: [['quest', 'q_debtor', 'active'], ['not', 'q_debtor_deferred'], ['not', 'q_debtor_resolved']], do: [['flag', 'q_debtor_deferred'], ['trust', 'riyadh', 3], ['cool', 'q_debtor_due', 10]], next: 'q_deferred' },
          { t: 'أسقط 150 وأقبض 150 ريالاً', if: [['quest', 'q_debtor', 'active'], ['not', 'q_debtor_deferred'], ['not', 'q_debtor_resolved']], do: [['gain', HALF_DEBT], ['trust', 'riyadh', 4], ['flag', 'q_debtor_partial'], ['flag', 'q_debtor_resolved'], ['quest', 'done', 'q_debtor']], next: 'q_partial' },
          { t: 'أطلب 300 ريال الآن', if: [['quest', 'q_debtor', 'active'], ['not', 'q_debtor_deferred'], ['not', 'q_debtor_resolved']], do: [['gain', DEBT], ['trust', 'riyadh', -2], ['flag', 'q_debtor_immediate'], ['flag', 'q_debtor_resolved'], ['quest', 'done', 'q_debtor']], next: 'q_full' }
        ]
      },
      q_deferred: {
        mood: 'pleased',
        say: 'أشكرك على المهلة. بقيت 300 ريال في حسابك، وأعود إليك بها بعد 10 أيام. سأرتب بيعي وأحفظ موعدك.',
        opts: [{ t: 'ألقاك بعد 10 أيام', end: true }]
      },
      q_wait: {
        mood: 'neutral',
        say: 'لم تمض المهلة بعد. ما زلت أرتب بيع بضاعتي، وموعدنا بعد انقضاء الأيام العشرة التي اتفقنا عليها.',
        opts: [{ t: 'أعود عند الموعد', end: true }]
      },
      q_repay: {
        mood: 'pleased',
        say: 'انقضت المهلة، وجمعت لك 300 ريال كاملة. أشكرك على صبرك؛ هذا ثمن التمر الذي بقي في حسابك.',
        opts: [
          { t: 'أقبض 300 ريال', if: [['quest', 'q_debtor', 'active'], ['flag', 'q_debtor_deferred'], ['ready', 'q_debtor_due'], ['not', 'q_debtor_resolved']], do: [['gain', DEBT], ['flag', 'q_debtor_resolved'], ['quest', 'done', 'q_debtor']], next: 'q_paid' }
        ]
      },
      q_paid: {
        mood: 'pleased',
        say: 'وصل إليك حقك كاملاً، وأغلقنا حساب التمر. سرّني أن بقي بيننا باب للمعاملة الطيبة.',
        opts: [{ t: 'استقر حسابنا، شكراً لك', end: true }]
      },
      q_partial: {
        mood: 'pleased',
        say: 'هذه 150 ريالاً، وأشكرك على إسقاط 150 ريالاً من الثمن. انتهى حسابنا، ولن أنسى حسن معاملتك.',
        opts: [{ t: 'ليكن حسابك القادم أوضح', end: true }]
      },
      q_full: {
        mood: 'neutral',
        say: 'جمعت لك 300 ريال كاملة وأديتها الآن، وأغلقنا الحساب. سأحتاط لنفقة بضاعتي قبل الصفقة القادمة.',
        opts: [{ t: 'استقر حسابنا', end: true }]
      },
      q_done: {
        mood: 'neutral',
        say: 'استقر حساب التمر بيننا ولم يبق منه شيء. سأراجع حساباتي قبل أن أبدأ صفقة جديدة.',
        opts: [{ t: 'وفقك الله في تجارتك', end: true }]
      }
    }
  }
};

const API = { QUESTS_EXTRA, DIALOGS_EXTRA };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else root.QuestsExtra = API;
})(typeof window !== 'undefined' ? window : globalThis);
