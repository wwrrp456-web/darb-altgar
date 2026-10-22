// يستخرج كل نصوص اللعبة الحوارية والقصصية للمراجع اللغوي: node docs/review/export_texts.js > /tmp/texts_data.json
const fs = require('fs'), path = require('path');
const L = require('../../src/lessons.js'), B = require('../../src/babylon.js'), R = require('../../src/lore.js'), D = require('../../src/dialogs.js');
const C = require('../../src/cards.js'), F = require('../../src/fiqh.js');
let A = {}; try { A = require('../../src/achievements.js'); } catch (e) {}
const root = path.join(__dirname, '../..');
// كلمات تدل على مضمون شرعي/تاريخي: يُقفل للمختص ولا يُعاد تأليفه
const LOCK = /النبي|ﷺ|رضي الله|رواه|حديث|زكاة|الزكاة|نصاب|النصاب|المضاربة|القراض|المقارضة|المرابحة|الربا|ربا|السُّفتجة|السفتجة|الفقه|فقه|فتوى|الحلال|الحرام|حرام|عمرو بن العاص|الهجرة/;
const out = { sections: [] };
const sec = (id, title, intro) => { const s = { id, title, intro: intro || '', rows: [] }; out.sections.push(s); return s; };
const row = (s, id, ctx, text, extra) => {
  if (typeof text !== 'string' || !text.trim()) return;
  s.rows.push(Object.assign({ id, ctx, text, lock: LOCK.test(text) }, extra || {}));
};
const arr = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);

// ١) الترحيب والشخصيات والدَّين
let s = sec('welcome', 'أولاً: الافتتاح (أول ما يراه اللاعب)', 'مشهد لقاء عمّ سالم الأول، ثم الشخصيات الخمس، ثم خبر دَين الجدّ.');
L.WELCOME.forEach((w, i) => { row(s, 'W' + (i + 1), 'عمّ سالم يتكلم', w.say); arr(w.replies).forEach((r, j) => { row(s, 'W' + (i + 1) + '.r' + (j + 1), 'خيار اللاعب', r.t); row(s, 'W' + (i + 1) + '.r' + (j + 1) + 's', 'ردّ عمّ سالم', r.say); }); });
L.CHARS.forEach(c => { row(s, 'CH.' + c.id + '.tag', 'شخصية ' + c.name + ' (وصف قصير)', c.tag); row(s, 'CH.' + c.id + '.desc', 'شخصية ' + c.name + ' (وصف)', c.desc); row(s, 'CH.' + c.id + '.focus', 'شخصية ' + c.name + ' (محور التعلم)', c.focus); });
const D0 = B.DEBT;
row(s, 'DEBT.welcome', 'عمّ سالم يخبر بدَين الجدّ', D0.welcome);
arr(D0.welcomeReplies).forEach((r, j) => { row(s, 'DEBT.r' + (j + 1), 'خيار اللاعب', r.t); row(s, 'DEBT.r' + (j + 1) + 's', 'ردّ عمّ سالم', r.say); });
Object.keys(D0).filter(k => typeof D0[k] === 'string' && !['creditor', 'welcome'].includes(k)).forEach(k => row(s, 'DEBT.' + k, 'دَين الجدّ: ' + k, D0[k]));
Object.keys(D0).filter(k => Array.isArray(D0[k]) && k !== 'welcomeReplies').forEach(k => arr(D0[k]).forEach((t, i) => typeof t === 'string' && row(s, 'DEBT.' + k + i, 'دَين الجدّ: ' + k, t)));

// ٢) المستويات العشرة بدروسها وتمارينها
s = sec('levels', 'ثانياً: دروس المستويات العشرة (عمّ سالم يعلّم)', 'لكل مستوى: افتتاحية، الدرس، المهمة، الأسئلة، رسالة الإتمام. المقاطع الشرعية فيها مقفلة للمختص.');
L.LEVELS.forEach(lv => {
  const p = 'L' + lv.n; row(s, p + '.title', 'عنوان المستوى ' + lv.n, lv.title); row(s, p + '.intro', 'مستوى ' + lv.n + ': افتتاحية عمّ سالم', lv.intro);
  arr(lv.lesson).forEach((t, i) => row(s, p + '.les' + (i + 1), 'مستوى ' + lv.n + ': الدرس، فقرة ' + (i + 1), t));
  row(s, p + '.task', 'مستوى ' + lv.n + ': المهمة', lv.task); row(s, p + '.done', 'مستوى ' + lv.n + ': رسالة الإتمام', lv.done);
  arr(lv.quiz).forEach((q, i) => { row(s, p + '.q' + (i + 1), 'مستوى ' + lv.n + ': سؤال ' + (i + 1), q.q); arr(q.o).forEach((o, k) => row(s, p + '.q' + (i + 1) + '.o' + (k + 1), 'خيار' + (q.ok === k ? ' (الصحيح)' : ''), o)); row(s, p + '.q' + (i + 1) + '.why', 'تعليل الإجابة', q.why); });
});
if (L.ZAKAT_LESSON) { const z = L.ZAKAT_LESSON; row(s, 'Z.title', 'درس الزكاة', z.title); row(s, 'Z.intro', 'درس الزكاة: افتتاحية', z.intro); arr(z.lesson).forEach((t, i) => row(s, 'Z.les' + (i + 1), 'درس الزكاة: فقرة ' + (i + 1), t, { lock: true })); arr(z.quiz).forEach((q, i) => { row(s, 'Z.q' + (i + 1), 'درس الزكاة: سؤال', q.q, { lock: true }); arr(q.o).forEach((o, k) => row(s, 'Z.q' + (i + 1) + '.o' + (k + 1), 'خيار', o, { lock: true })); row(s, 'Z.q' + (i + 1) + '.why', 'تعليل', q.why, { lock: true }); }); Object.keys(z).filter(k => typeof z[k] === 'string' && !['title', 'intro', 'icon'].includes(k)).forEach(k => row(s, 'Z.' + k, 'درس الزكاة: ' + k, z[k], { lock: true })); }

// ٣) ذكريات الجدّ (الطبقة الأولى من الحكايات)
s = sec('memories', 'ثالثاً: ذكريات الجدّ (يرويها عمّ سالم عند كل ترقية)', 'الرموز بين أقواس مثل {جار} و{صرافة} تُستبدل باسم دولة/مدينة بحسب بلد البداية. لا تغيّرها ولا تنقلها خارج موضعها.');
for (const k of Object.keys(L.STORY)) { row(s, 'M' + k + '.t', 'ذكرى الجدّ ' + k + ': العنوان', L.STORY[k].t); row(s, 'M' + k + '.x', 'ذكرى الجدّ ' + k + ': النص', L.STORY[k].x); }
const H = L.HOMEFX; row(s, 'M.homefx', 'قيم الرموز بحسب بلد البداية', Object.keys(H).map(c => c + ' ← ' + Object.keys(H[c]).map(k => '{' + k + '}=' + H[c][k]).join('، ')).join('\n'), { lock: false });

// ٤) حكايات الحكمة (الطبقة الثانية) + الأسئلة + الألواح
s = sec('wisdom', 'رابعاً: حكايات الحكمة والأسئلة والألواح (تتبدل المدينة بحسب بلد البداية)', 'الرمز {م} يصير تيماء/الفسطاط/نيسابور/قاليقوط/الزيتون. هذه الطبقة الثانية بجانب ذكريات الجدّ، وهي موضع أهم ملاحظات الترابط في أول الملف.');
Object.keys(B.CITY).forEach(c => { row(s, 'CITY.' + c, 'مدينة الحكمة لبلد ' + c + ': ' + B.CITY[c], B.CITY_NOTE[c]); });
for (const k of Object.keys(B.STORY)) { row(s, 'WS' + k + '.t', 'حكاية الحكمة ' + k + ': العنوان', B.STORY[k].t); row(s, 'WS' + k + '.x', 'حكاية الحكمة ' + k + ': النص', B.STORY[k].x); }
for (const k of Object.keys(B.QUIZ)) B.QUIZ[k].forEach((q, i) => { const p = 'WQ' + k + '.' + (i + 1); row(s, p, 'سؤال حكمة بعد المستوى ' + k, q.q); arr(q.o).forEach((o, j) => row(s, p + '.o' + (j + 1), 'خيار' + (q.ok === j ? ' (الصحيح)' : ''), o)); row(s, p + '.why', 'تعليل', q.why); });
for (const k of Object.keys(B.TABLETS)) { const t = B.TABLETS[k]; row(s, 'T.' + k + '.title', 'لوح ' + k, t.title); row(s, 'T.' + k + '.text', 'لوح ' + k + ': النص', t.text); row(s, 'T.' + k + '.hint', 'لوح ' + k + ': شرط الفتح كما يراه اللاعب', t.hint); }

// ٥) تعليقات عمّ سالم أثناء اللعب
s = sec('react', 'خامساً: تعليقات عمّ سالم أثناء اللعب (ردود على الأحداث)', 'تظهر عند أحداث محددة (أول شراء، خسارة، جمرك…). عمود «المفتاح» يدل على الحدث. بعضها يحمل نصاً شرعياً مقفلاً.');
for (const k of Object.keys(L.REACT)) arr(L.REACT[k].t).forEach((t, i, a) => row(s, 'R.' + k + (a.length > 1 ? '.' + (i + 1) : ''), 'حدث: ' + k + ' (' + (L.MOODS[L.REACT[k].m] || '') + ' ' + (L.REACT[k].m || '') + ')', t));

// ٦) الأسرار والزعماء والمدن
s = sec('world', 'سادساً: أسرار الدول والمدن وحكايات الزعماء', 'أسرار الدول عند أول وصول، وأسرار المدن، وقصة كل زعيم في ثلاثة فصول تنفتح بالثقة، وقصص المنتجات.');
Object.keys(L.SECRETS).forEach(c => { const x = L.SECRETS[c]; row(s, 'SC.' + c + '.title', 'سر دولة ' + c, x.title); row(s, 'SC.' + c, 'سر دولة ' + c + ': النص', x.text); row(s, 'SC.' + c + '.perk', 'سر دولة ' + c + ': الميزة', x.perk); });
Object.keys(R.CITY_SECRETS).forEach(c => { const x = R.CITY_SECRETS[c]; row(s, 'CS.' + c + '.title', 'سر مدينة ' + c, x.title); row(s, 'CS.' + c, 'سر مدينة ' + c + ': النص', x.text); row(s, 'CS.' + c + '.lesson', 'سر مدينة ' + c + ': الدرس', x.lesson); });
Object.keys(R.BOSS_LORE).forEach(c => { const x = R.BOSS_LORE[c]; row(s, 'BL.' + c + '.trait', 'زعيم ' + c + ': طبعه', x.trait); row(s, 'BL.' + c + '.likes', 'زعيم ' + c + ': يحب', x.likes); row(s, 'BL.' + c + '.dislikes', 'زعيم ' + c + ': يكره', x.dislikes); row(s, 'BL.' + c + '.tip', 'زعيم ' + c + ': نصيحة التعامل', x.tip); arr(x.ch).forEach((h, i) => { row(s, 'BL.' + c + '.ch' + (i + 1) + '.t', 'زعيم ' + c + ': فصل ' + (i + 1) + ' (عنوان)', h.t); row(s, 'BL.' + c + '.ch' + (i + 1), 'زعيم ' + c + ': فصل ' + (i + 1), h.x); }); });
Object.keys(R.PSTORY).forEach(k => { row(s, 'PS.' + k + '.t', 'قصة منتج ' + k, R.PSTORY[k].t); row(s, 'PS.' + k, 'قصة منتج ' + k + ': النص', R.PSTORY[k].x); });
Object.keys(R.STYLES).forEach(k => row(s, 'ST.' + k, 'طبع زعيم: ' + R.STYLES[k].name, [R.STYLES[k].hint, R.STYLES[k].effect].join(' — ')));

// ٧) حوارات المشاهد
s = sec('dialogs', 'سابعاً: حوارات مشاهد الأسواق (الزعيم والتاجر وعمّ سالم)', 'حوارات الرياض مكتوبة بخط اليد. باقي المدن تولَّد من قالب واحد بتبديل اسم المدينة والمنتج؛ يُعرض هنا نموذج واحد (القاهرة) ويُطبَّق تعديله على الكل.');
const dumpDlg = (key, tag) => { const d = D.DIALOGS[key]; if (!d) return; Object.keys(d.nodes).forEach(n => { const nd = d.nodes[n]; row(s, tag + '.' + n, tag + ' ← ' + n, nd.say); arr(nd.opts).forEach((o, i) => o.t && row(s, tag + '.' + n + '.o' + (i + 1), 'خيار اللاعب في ' + tag + '/' + n, o.t)); }); };
['riyadh_boss', 'riyadh_trader', 'riyadh_salem'].forEach(k => dumpDlg(k, 'DLG.' + k));
['cairo_boss', 'cairo_trader', 'cairo_salem'].forEach(k => dumpDlg(k, 'DLG.' + k + ' (نموذج القالب لكل المدن)'));
Object.keys(D.QUESTS).forEach(q => { row(s, 'Q.' + q + '.title', 'مهمة: عنوان', D.QUESTS[q].title); row(s, 'Q.' + q, 'مهمة: نص', D.QUESTS[q].text); });

// ٨) نصوص الواجهة التعليمية (استخراج آلي من ملفات الواجهة)
s = sec('ui', 'ثامناً: نصوص الواجهة التعليمية (مهمة عمّ سالم، الدفتر، الأهداف)', 'استُخرجت آلياً من ملفات الواجهة؛ عمود السياق يذكر الملف والسطر. المتغيرات بين ${ } أو + تُترك كما هي.');
['13-guide-mission.js', '14-salem-notebook.js', '02-learn.js', '06c-insights.js'].forEach(f => {
  const p = path.join(root, 'src/ui', f); if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
    if (/^\s*(\/\/|\/\*|\*)/.test(ln)) return;
    const seen = new Set();
    for (const m of ln.matchAll(/(['"`])((?:\\.|(?!\1).)*?[؀-ۿ](?:\\.|(?!\1).)*?)\1/g)) {
      const t = m[2].trim(); if (t.length < 28 || seen.has(t) || /=>|\.map\(|function|\|\||&&|\?\s/.test(t.replace(/\$\{[^}]*\}/g, ''))) continue; seen.add(t);
      row(s, 'UI.' + f.slice(0, 2) + '.' + (i + 1) + '.' + seen.size, f + ' سطر ' + (i + 1), t);
    }
  });
});

// ٩) جداول الربط بين الطبقات
out.map = L.LEVELS.map(lv => ({ n: lv.n, title: lv.title, mem: (L.STORY[lv.n] || {}).t, wis: (B.STORY[lv.n] || {}).t, wq: (B.QUIZ[lv.n] || []).length, mode: lv.mode }));
out.homefx = H; out.cityName = B.CITY;
// العبارات المحمية (مقاطع تحوي ألفاظاً شرعية) عبر كل القاعدة، لتنبيه المراجع
out.counts = out.sections.map(x => [x.title, x.rows.length, x.rows.filter(r => r.lock).length]);
process.stdout.write(JSON.stringify(out));
