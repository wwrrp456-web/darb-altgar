'use strict';
// فحص النصوص بعد التعويض والتوطين، ثم النص المرئي في صفحات اللعبة.
const path = require('node:path');
const fs = require('node:fs');

// هذا عنوان مرجع في تعليق مصدر، وليس استثناءً لأي حوار أو نص ظاهر للاعب.
const historical = [{ source: 'src/babylon.js:عنوان المرجع التاريخي', text: 'أغنى رجل في بابل', reason: 'عنوان كتاب جورج كلاسون الصادر سنة 1926، في تعليق توثيقي فقط.' }];
function violations({ source, text }) {
  const rules = [];
  if (/بابل/u.test(text) && !historical.some(e => e.source === source && e.text === text)) rules.push('اسم المدينة القديم');
  if (/(?<![\p{L}])(?:داباسير|ماثون|أركاد|نوماسير|ألغاميش|أغار)(?![\p{L}])/u.test(text)) rules.push('اسم من الكتاب الأصلي (انظر docs/NAMES.md)');
  if (/\{[\p{L}_][\p{L}\p{N}_]*\}/u.test(text)) rules.push('قالب لم يُعوَّض');
  if (/\b(?:undefined|null|NaN)\b|\[object Object\]/.test(text)) rules.push('قيمة برمجية ظاهرة');
  return rules;
}

// WP-14: كل مصطلح مالي يظهر في دروس المستويات 1–5 موجود في src/glossary.js وتجده المطابقة الآلية (التعليم آلي وقت العرض)
function glossaryRule() {
  const G = require('../src/glossary.js'), L = require('../src/lessons.js'), terms = require('./lib/lesson-terms.js'), text = [];
  const v = x => { if (typeof x === 'string') text.push(x); else if (Array.isArray(x)) x.forEach(v); else if (x && typeof x === 'object') Object.values(x).forEach(v); };
  L.LEVELS.slice(0, 5).forEach(l => ['title', 'intro', 'lesson', 'task', 'done', 'quiz'].forEach(k => v(l[k])));
  const flat = s => s.normalize('NFC').replace(/[\u064B-\u065F\u0670]/g, ''), all = flat(text.join(' ')), bad = [];
  for (const w of terms) { if (!all.includes(flat(w))) bad.push('قائمة المصطلحات قديمة، المصطلح غير موجود في دروس 1–5: ' + w); else if (!G.find(w).length) bad.push('مصطلح مالي في دروس 1–5 لا تجده مطابقة القاموس: ' + w); }
  for (const t of G.visible()) if (G.words(t.def) > 20) bad.push('شرح أطول من 20 كلمة: ' + t.id);
  if (bad.length) throw Error('قاعدة القاموس:\n' + bad.join('\n'));
}

// WP-19 (D7): كل حقل short/xxxShort (طبقة الناشئ) ≤ 20 كلمة، بلا ﴿ ولا ﷺ ولا «قال»، وله أصل كامل بجانبه (لا يُحذف شيء)
function shortRule() {
  const mods = ['lessons', 'lore', 'cards', 'tips', 'babylon', 'dialogs', 'achievements'].map(n => [n, require('../src/' + n + '.js')]), bad = []; let n = 0;
  const walk = (src, v) => { if (Array.isArray(v)) v.forEach((x, i) => walk(src + '[' + i + ']', x)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    const m = /^(short|(.+)Short)$/.exec(k);
    if (m && typeof x === 'string') { n++; const base = m[2] || 'text';
      if (x.trim().split(/\s+/).length > 20) bad.push(src + '.' + k + ': أطول من 20 كلمة'); if (/[﴿﴾ﷺ]|قال\s|رواه/.test(x)) bad.push(src + '.' + k + ': نص ديني في القصير');
      if (typeof v[base] !== 'string') bad.push(src + '.' + k + ': لا أصل كامل ' + base); else if (v[base] === x) bad.push(src + '.' + k + ': القصير يطابق الأصل'); }
    walk(src + '.' + k, x); } };
  for (const [name, mod] of mods) walk('src/' + name + '.js', mod);
  if (bad.length) throw Error('قاعدة النص القصير:\n' + bad.join('\n')); console.log('OK   النصوص القصيرة (' + n + ') ≤ 20 كلمة بلا نص ديني ولها أصل كامل');
}

async function main() {
  glossaryRule(); shortRule();
  const { chromium } = require('/opt/node-tools/node_modules/playwright');
  const browser = await chromium.launch();
  const records = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=57&type=0');
    await page.waitForFunction(() => window.__game && window.Lessons && window.Dialogs && window.Cards && window.Achievements);
    // نفحص عنوان المرجع التاريخي نفسه باستثناء ضيق موثّق أعلاه.
    const firstComment = fs.readFileSync(path.join(__dirname, '../src/babylon.js'), 'utf8').split('\n')[0];
    for (const entry of historical) {
      if (!firstComment.includes(entry.text)) throw Error('تغيّر المرجع التاريخي؛ راجع قائمة الاستثناءات.');
      records.push({ source: entry.source, text: entry.text });
    }
    records.push(...await page.evaluate(() => {
      const { E } = __game, L = window.Lessons, rows = [];
      const visit = (source, value) => {
        if (typeof value === 'string') rows.push({ source, text: value });
        else if (Array.isArray(value)) value.forEach((v, i) => visit(source + '[' + i + ']', v));
        else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(source + '.' + k, v));
      };
      const address = value => {
        if (typeof value === 'string') return value.replace(/\{اسم\}/g, 'أحمد');
        if (Array.isArray(value)) return value.map(address);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, address(v)]));
        return value;
      };
      for (const key of ['MENTOR', 'CHARS', 'LEVELS', 'SECRETS', 'WELCOME', 'ZAKAT_LESSON', 'MODE_NAMES']) visit('src/lessons.js:' + key, address(L[key]));
      visit('src/lore.js', E.LORE);
      visit('src/cards.js', E.CARDS);
      visit('src/achievements.js', window.Achievements);
      visit('src/dialogs.js:المشاهد', E.DLG.SCENES);
      visit('src/dialogs.js:المهام', E.DLG.QUESTS);
      visit('src/engine.js:الدول', E.COUNTRIES);
      visit('src/engine.js:المدن', E.CITY_DEFS);
      visit('src/engine.js:الأحداث', E.SHOCKS);
      // المصدر يستبدل أول {p} في renderReact؛ نستخدم التعويض نفسه، فلا نخفي تكرارًا خاطئًا.
      for (const [key, reaction] of Object.entries(L.REACT)) {
        const texts = Array.isArray(reaction.t) ? reaction.t : [reaction.t];
        texts.forEach((text, i) => visit('src/lessons.js:REACT.' + key + '[' + i + ']', address(text.replace('{p}', E.GD.coffee.name))));
      }
      let worlds = 0, cities = new Set(), dialogueNodes = 0;
      for (const country of E.COUNTRIES) for (const char of L.CHARS) {
        const S = E.newGame(57); E.A.chooseStart(S, country.id); E.A.learnSetChar(S, char.id);
        const prefix = country.id + '/' + char.id;
        worlds++;
        visit('src/engine.js:الأخبار الأولية/' + prefix, S.news);
        visit('src/babylon.js:babFor/' + prefix, E.babFor(S));
        for (const n of Object.keys(L.STORY)) visit('src/lessons.js:storyOf/' + prefix + '/' + n, L.storyOf(n, country.id));
        for (const level of L.LEVELS) visit('src/lessons.js:أهداف الدرس/' + prefix + '/' + level.n, level.goals(S));
        S.learn.level = 10; S.player.gold = 100000;
        for (const city of S.order) {
          cities.add(city); S.player.caravans[0].city = city;
          // DIALOGS مخرجات cityDialogs الفعلية عند تحميل المصدر لجميع المدن.
          for (const [id, dialogue] of Object.entries(E.DLG.DIALOGS).filter(([, d]) => d.city === city)) {
            for (const [node, data] of Object.entries(dialogue.nodes)) {
              E.stOf(S).cur = { id, node };
              visit('src/dialogs.js:cityDialogs/' + prefix + '/' + id + '/' + node, E.dlgView(S));
              // نفحص كذلك الخيارات المشروطة التي لا تظهر في الحالة الحالية.
              const boss = S.bosses[city];
              (data.opts || []).forEach((o, i) => visit('src/dialogs.js:خيار/' + prefix + '/' + id + '/' + node + '/' + i, o.t.replace(/\{boss\}/g, boss ? boss.name : '')));
              dialogueNodes++;
            }
          }
        }
        for (let i = 0; i < 8; i++) E.tick(S);
        visit('src/engine.js:أخبار المحاكاة/' + prefix, S.news);
      }
      if (worlds !== 25 || cities.size !== 18 || !dialogueNodes) throw Error('لم تكتمل تغطية الدول والشخصيات والمدن.');
      rows.push({ source: 'تغطية', text: '٥ دول × ٥ شخصيات، و١٦ مدينة؛ ' + dialogueNodes + ' عقدة حوار محلية.' });
      return rows;
    }));
    // المرور الحقيقي على الشاشات لكل توليفة دولة وشخصية، قبل المحاكاة وبعدها.
    const combinations = await page.evaluate(() => __game.E.COUNTRIES.flatMap(c => Lessons.CHARS.map(ch => [c.id, ch.id])));
    for (const [country, char] of combinations) {
      await page.evaluate(([country, char]) => {
        const G = __game, E = G.E, fresh = E.newGame(57);
        E.A.chooseStart(fresh, country); E.A.learnSetChar(fresh, char);
        for (const key of Object.keys(G.S)) delete G.S[key]; Object.assign(G.S, fresh);
        G.setSpeed(0); G.S.phase = 4; G.S.learn.level = 10; G.S.learn.intro = 10;
        G.S.learn.welcome = 99; G.S.learn.bq = []; G.S.learn.csq = []; G.S.learn.tq = []; G.S.learn.fq = []; G.S.learn.cq = []; G.S.learn.rq = [];
        G.S.learn.rest = null; G.S.learn.up = []; G.S.learn.eq = []; G.S.learn.sq = []; G.S.learn.zseen = true;
        G.S.player.gold = 100000; G.S.noShocks = true; G.renderAll();
        if (window.Overlay) window.Overlay.closeAll?.();
      }, [country, char]);
      for (const stage of ['قبل المحاكاة', 'بعد المحاكاة']) {
        if (stage === 'بعد المحاكاة') await page.evaluate(() => { for (let i = 0; i < 8; i++) __game.E.tick(__game.S); });
        const screens = { home: '06-screen-home', map: '07-screen-map', market: '08-screen-market', caravan: '09-screen-caravan-estate', estate: '09-screen-caravan-estate', lords: '10-screen-lords', empire: '11-screen-empire', academy: '02-learn', cities: '12-screen-cities' };
        for (const [screen, file] of Object.entries(screens)) {
          await page.evaluate(screen => { __game.go(screen); __game.renderAll(); }, screen);
          if (await page.evaluate(() => location.hash) !== '#' + screen) throw Error('لم تُفتح الشاشة المطلوبة: ' + screen);
          records.push({ source: 'src/ui/' + file + '.js:' + country + '/' + char + '/' + screen + '/' + stage, text: await page.locator('body').innerText() });
        }
      }
    }
    let failures = 0;
    for (const record of records) for (const rule of violations(record)) {
      failures++;
      console.error('مخالفة: ' + record.source + ' | القاعدة: ' + rule + '\nالنص: ' + record.text);
    }
    for (const error of errors) { failures++; console.error('مخالفة: أخطاء المتصفح | ' + error); }
    console.log('فُحص ' + records.length + ' نصًا؛ المخالفات: ' + failures + '.');
    if (failures) process.exitCode = 1;
    else console.log('✓ النصوص سليمة، واكتملت تغطية المدن والدول والشخصيات والشاشات.');
  } finally { await browser.close(); }
}
module.exports = { violations };
if (require.main === module) main().catch(error => { console.error('تعذّر إكمال فحص النصوص: ' + error.message); process.exitCode = 1; });
