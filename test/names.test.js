// ثبات الأسماء: النصوص المحفوظة القديمة تُنقّح عند التحميل: node test/names.test.js
const E = require('../src/engine.js'); const A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const S = E.newGame(21); A.learnSetChar(S, 'trader');
S.news.unshift({ d: 1, t: 'قال الحاج ماثون: خطة داباسير تنفع في بابل. وأركاد ونوماسير وألغاميش وأغار', k: '' });
(S.learn.hist = S.learn.hist || []).unshift({ d: 1, t: 'حكاية أركاد في بابل', m: 'happy' });
const L = E.load(E.save(S));
const t = L.news[0].t + ' ' + L.learn.hist[0].t;
ok(!/ماثون|داباسير|أركاد|نوماسير|ألغاميش|أغار|بابل/.test(t), 'لا أسماء الكتاب ولا بابل بعد التحميل: ' + t);
ok(/ظافر/.test(t) && /سعيد/.test(t) && /عمران/.test(t) && /حمدان/.test(t), 'استُبدلت بالأسماء المعتمدة');
ok(/تيماء/.test(t), 'بابل ← مدينة دولة البداية (' + (L.home || '') + ')');
ok(E.BAB.cityOf('xx') === 'تيماء', 'الاحتياط لا يرجع «بابل»');
console.log(fails ? 'ERRORS: ' + fails : 'كل شيء سليم'); process.exit(fails ? 1 : 0);
