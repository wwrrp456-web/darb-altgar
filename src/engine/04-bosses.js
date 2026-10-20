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
