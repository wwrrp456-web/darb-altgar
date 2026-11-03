// WP-20: مفاتيح الاعتماد الشرعي: الافتراضي لا يخفي شيئاً، وكل صف «معتمد» ظاهر في اللعبة، ولا صف «مخفي» إلا ما في hidden
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), RF = require('../src/review-flags.js');
const CARDS = require('../src/cards.js').CARDS, FIQH = require('../src/fiqh.js'), GL = require('../src/glossary.js'), TIPS = require('../src/tips.js').TIPS;
const ok = m => console.log('OK   ' + m), reg = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/review/registry.json'), 'utf8')), live = r => !r.gone;
const SG = ['SG-01', 'SG-02', 'SG-03', 'SG-04', 'SG-05', 'SG-06'];
const PJ = ['PJ-01', 'PJ-02', 'PJ-03', 'PJ-04']; assert.deepEqual(RF.FLAGS.hidden, PJ, 'المخفي مشاريع 015ب الموسومة وحدها حتى يعتمدها المختص'); assert.equal(RF.reviewHidden('T-01'), false); for (const id of SG) { assert.equal(RF.reviewHidden(id), false, id + ': ظاهر'); assert.equal(reg.find(r => r.id === id).status, 'approved', id + ': معتمد'); } ok('review-flags: أهداف المواسم الستة معتمدة وظاهرة ولا بنود مخفية');
// السجل: معرّفات فريدة بصيغة ثابتة، وحالات الثلاث فقط
assert.equal(new Set(reg.map(r => r.id)).size, reg.length, 'معرّفات فريدة'); assert.ok(reg.every(r => /^[A-Z]+-\d{2,}$/.test(r.id) && ['approved', 'pending', 'hidden'].includes(r.status) && r.where && r.source && r.file), 'صفوف مكتملة');
assert.deepEqual(reg.filter(r => r.status === 'hidden').map(r => r.id), PJ, 'الصفوف المخفية: مشاريع 015ب الأربعة فقط'); ok('السجل: ' + reg.length + ' بنداً بحالات صالحة، والمخفي مشاريع 015ب وحدها');
// SC-002: كل صف معتمد مصدره حيّ في اللعبة (لم يختفِ) ويظهر في الواجهة بالمعطيات نفسها
const resolve = r => { const [t, k] = [r.key.slice(0, r.key.indexOf(':')), r.key.slice(r.key.indexOf(':') + 1)];
  if (t === 'card') return !!CARDS[k] && CARDS[k].track === 'f'; if (t === 'case') return FIQH.CASES.some(c => c.id === k); if (t === 'term') return GL.TERMS.some(x => x.id === k && !x.todo) && GL.visible().some(x => x.id === k);
  if (t === 'sg') return E.seasonGoalDef(null, k, 10)?.id === r.id && !RF.reviewHidden(r.id) && E.seasonGoalView(E.newGame(5)).all.some(x => x.k === k);
  if (t === 'hoard') return E.HOARD_TEXT === r.show;
  if (t === 'cls') return k === 'zakat' ? E.ZAKAT_IMPACT === r.show : E.CLASS_NAMES[+k] != null && r.show.includes('«' + E.CLASS_NAMES[+k] + '»');
  if (t === 'tip') return TIPS.some(x => x.id === k); if (t === 'approved') return fs.existsSync(path.join(__dirname, '../', r.file)); if (t === 'model') return !!E[k.replace('TK', 'TK')]; return false; };
for (const r of reg.filter(x => live(x) && x.feature !== 'PJ')) assert.ok(resolve(r), 'البند ' + r.id + ' (' + r.key + ') موجود وظاهر في اللعبة');
for (const r of reg.filter(x => live(x) && x.find != null)) { const src = fs.readFileSync(path.join(__dirname, '../', r.file), 'utf8'); assert.equal(src.split(r.find).length - 1, 1, r.id + ': find يقع مرة واحدة'); }
assert.equal(reg.filter(r => r.feature === 'F').length, Object.keys(CARDS).filter(k => CARDS[k].track === 'f').length); assert.equal(reg.filter(r => r.feature === 'C').length, FIQH.CASES.length);
ok('كل بند معتمد حيّ وظاهر (SC-002)، وfind وحيد المطابقة');
// lessonLock: الافتراضي بلا أثر، والإخفاء يقفل الميزة المرتبطة فقط
{ const S = E.newGame(5); E.A.learnSetChar(S, 'trader'); S.learn.level = 1; const base = Object.fromEntries(Object.keys(E.FEAT_LV).map(k => [k, E.lessonLock(S, k)]));
  assert.ok(Object.values(base).every(v => typeof v === 'string' && !/قيد المراجعة/.test(v)), 'الافتراضي: قفل المستوى كما كان');
  S.learn.level = 10; assert.equal(E.lessonLock(S, 'insure'), null, 'الافتراضي: الميزة مفتوحة بعد مستواها');
  RF.FLAGS.hidden.push('T-01'); try { assert.ok(/قيد المراجعة/.test(E.lessonLock(S, 'insure')), 'الإخفاء يقفل التكافل'); assert.equal(E.lessonLock(S, 'agent'), null, 'غيرها لا يتأثر'); } finally { RF.FLAGS.hidden.splice(RF.FLAGS.hidden.indexOf('T-01'), 1); }
  assert.equal(E.lessonLock(S, 'insure'), null); ok('lessonLock يحترم review-flags ولا أثر افتراضياً'); }
// المشاريع الموسومة (015ب): مخفية وغير قابلة للتمويل ولا تظهر في المفتوحة، وتظهر بعد رفع الإخفاء
{ const S = E.newGame(5); E.A.learnSetChar(S, 'trader'); S.player.gold = 1e9; S.projects = { peak: 1e12, paid: {}, until: {}, pick: {}, done: [], tier: 9 };
  for (const [pid, rid] of [['P02', 'PJ-01'], ['P06', 'PJ-02'], ['P13', 'PJ-03'], ['P15', 'PJ-04']]) { assert.equal(E.PROJECTS[pid].rv, rid); assert.ok(!E.projectsOpen(S).includes(pid), pid + ' مخفي'); assert.equal(E.projectFund(S, pid, 'riyadh').ok, false, pid + ' لا يُموَّل'); assert.equal(reg.find(r => r.id === rid).key, 'pj:' + pid); }
  const keep = RF.FLAGS.hidden.slice(); RF.FLAGS.hidden.length = 0; try { assert.ok(E.projectsOpen(S).includes('P02'), 'بعد رفع الإخفاء تظهر'); } finally { RF.FLAGS.hidden.push(...keep); } ok('مشاريع 015ب الموسومة: مخفية وغير قابلة للتمويل حتى الاعتماد'); }
console.log('\nreview-flags: كلها ناجحة');
