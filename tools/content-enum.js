// يعدّد كل قطعة محتوى للاعب من مصادرها الحيّة (للمولِّد وللاختبار): الأنواع الإحدى عشر. المعرّف النوع:المفتاح.
const path = require('path'), r = f => require(path.join(__dirname, '../src', f));
function enumerate() {
  const E = r('engine.js'), L = r('lessons.js'), Lo = r('lore.js'), B = r('babylon.js'), F = r('fiqh.js'), T = r('tips.js'), C = r('cards.js'), A = r('achievements.js'), out = [];
  const add = (type, key, label, data, extra) => out.push(Object.assign({ id: type + ':' + key, type, label, len: JSON.stringify(data).length }, extra));
  L.LEVELS.forEach(l => add('level', l.n, l.title, [l.intro, l.lesson, l.quiz, l.done], { n: l.n }));
  E.STAGES.forEach(s => add('stage', s.n, s.title, [s.intro, s.lesson, s.quiz, s.done], { n: s.n, source: s.source }));
  F.CASES.forEach(c => add('case', c.id, c.title, c, { diff: c.diff, bab: c.bab }));
  Object.entries(C.CARDS).forEach(([k, c]) => add('card', k, c.title, c, { track: c.track, min: c.min }));
  Object.entries(B.TABLETS).forEach(([k, t]) => add('tablet', k, t.title, t));
  T.TIPS.forEach(t => add('wisdom', t.id, t.theme, t));
  Object.entries(Lo.BOSS_LORE).forEach(([city, b]) => b.ch.forEach((c, i) => add('boss', city + ':' + (i + 1), c.t, c, { city, ch: i + 1 })));
  Object.entries(Lo.CITY_SECRETS).forEach(([k, v]) => add('secret', 'city:' + k, 'سرّ مدينة ' + k, v, { scope: 'city' }));
  Object.entries(L.SECRETS).forEach(([k, v]) => add('secret', 'country:' + k, 'سرّ دولة ' + k, v, { scope: 'country' }));
  Object.keys(Lo.PSTORY).forEach((k, i) => add('product', k, 'حكاية ' + k, Lo.PSTORY[k], { idx: i }));
  A.LIST.forEach(a => add('achievement', a.id, a.name, a, { cat: a.cat }));
  Object.entries(L.REACT).forEach(([k, v]) => add('react', k, k, v));
  return out;
}
module.exports = { enumerate };
