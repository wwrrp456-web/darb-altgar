/* ---------- المواسم (المرحلة 5): سنة 354 يوماً. تغيّر الطلب على سلع بعينها، وإشعار قبلها بثلاثة أيام. تعمل في لعبة التعلّم من المستوى 4 كالصدمات ---------- */
const YEAR = 354, MUSLIM = new Set(['sa', 'eg', 'ir']);
const SEASONS = {
  harvest: { name: 'موسم الحصاد', from: 30, to: 59, mul: 1.25, prod: true, desc: 'الغلال والخامات أوفر وأرخص' },
  ukaz: { name: 'سوق عكاظ', from: 112, to: 131, mul: 1.3, goods: ['leather', 'camel', 'horse', 'textile', 'wool', 'perfume'], where: c => ['mecca', 'medina', 'jeddah'].includes(c.id), desc: 'سوق عربي قديم كانت القبائل تجتمع فيه قبل موسم الحج للتجارة والشعر، فيكثر الطلب على الجلود والإبل والخيل والنسيج في الحجاز' },
  hajj: { name: 'موسم الحجيج', from: 140, to: 159, mul: 1.35, boost: { mecca: 1.2, medina: 1.15 }, goods: ['wheat', 'dates', 'textile', 'incense', 'perfume', 'raisins', 'honey'], where: c => c.country === 'sa', desc: 'يزدحم الحجاز بالزوّار فيكثر الطلب على القوت والعطور والنسيج في السعودية، وأشدّه في مكة المكرمة والمدينة المنورة' },
  ramadan: { name: 'شهر رمضان', from: 200, to: 229, mul: 1.3, goods: ['dates', 'honey', 'sugar', 'rice', 'wheat', 'oliveoil', 'cheese', 'raisins', 'eggs'], where: c => MUSLIM.has(c.country), desc: 'يرتفع الطلب على التمر والسكر والعسل والأرز في بلاد المسلمين' },
  eid: { name: 'أيام العيد', from: 230, to: 239, mul: 1.25, goods: ['textile', 'perfume', 'jewelry', 'sugar', 'honey', 'carpet', 'incense'], where: () => true, desc: 'هدايا وكسوة وحلوى، فيزداد الطلب على النسيج والعطور والمجوهرات' },
  winter: { name: 'برد الشتاء', from: 290, to: 349, mul: 1.25, goods: ['wool', 'leather', 'textile', 'wood'], where: () => true, desc: 'يشتد الطلب على الصوف والجلود والحطب' },
};
const seasonsOn = S => !!(S.learn && S.learn.char && S.learn.level >= 4 && !S.noShocks);
const seasonAt = day => { const d = ((day % YEAR) + YEAR) % YEAR; for (const k in SEASONS) if (d >= SEASONS[k].from && d <= SEASONS[k].to) return k; return null; };
function seasonNow(S) { if (!seasonsOn(S)) return null; const k = seasonAt(S.day); return k ? { k, left: SEASONS[k].to - (S.day % YEAR) + 1, ...SEASONS[k] } : null; }
function seasonNext(S) { if (!seasonsOn(S)) return null; for (let i = 1; i <= 12; i++) { const k = seasonAt(S.day + i); if (k && k !== seasonAt(S.day)) return { k, in: i, ...SEASONS[k] }; } return null; }
function seasonMul(S, c, g) { const k = seasonsOn(S) && seasonAt(S.day); if (!k) return 1; const X = SEASONS[k]; return X.goods && X.goods.includes(g) && X.where(c) ? X.mul * ((X.boost && X.boost[c.id]) || 1) : 1; }
function seasonDay(S) {
  if (!seasonsOn(S)) return; const d = S.day % YEAR, now = seasonAt(S.day), was = seasonAt(S.day - 1);
  if (now && now !== was) { news(S, 'بدأ ' + SEASONS[now].name + ': ' + SEASONS[now].desc + '.', 'good'); learnReact(S, 'seasonStart', 10); if (now === 'hajj') news(S, 'وصلت قوافل الحجيج من مصر والشام والعراق واليمن إلى الحجاز، وازدحمت أسواق مكة المكرمة والمدينة المنورة.', 'rumor'); }
  const nx = seasonAt(S.day + 3); if (nx && SEASONS[nx].from === (S.day + 3) % YEAR) news(S, 'يقترب ' + SEASONS[nx].name + ' بعد 3 أيام: ' + SEASONS[nx].desc + '.', 'rumor');
}
