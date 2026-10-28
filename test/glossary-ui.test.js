// WP-14: قاموس التاجر: ٣٠ مصطلحاً، الشرح ≤20 كلمة، الشرعي حرفي من نص معتمد، والتعليم آلي وقت العرض ولا يغيّر النص: node test/glossary-ui.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { chromium } = require('/opt/node-tools/node_modules/playwright');
const G = require('../src/glossary.js'), ok = m => console.log('OK   ' + m);
const src = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const norm = s => s.normalize('NFC').replace(/\s+/g, ' ');
const LESSON_TERMS = require('./lib/lesson-terms.js');
(async () => {
  const vis = G.visible();
  assert.ok(vis.length >= 30, 'أقل من 30 مصطلحاً: ' + vis.length); ok(vis.length + ' مصطلحاً ظاهراً');
  const lessons = norm(src('src/lessons.js')), fiqh = norm(src('src/fiqh.js')), sources = norm(src('docs/review/SOURCES.md')), approved = norm(fs.readdirSync(path.join(__dirname, '../docs/review')).filter(f => /^APPROVED_.*\.md$/.test(f)).map(f => src('docs/review/' + f)).join(' '));
  for (const t of vis) {
    assert.ok(t.name && t.term && t.def && t.m.length, t.id + ': حقل ناقص');
    assert.ok(G.words(t.def) <= 20, t.id + ': الشرح أطول من 20 كلمة (' + G.words(t.def) + ')');
    if (t.k === 'fin') assert.ok(t.ex && /[0-9]/.test(t.ex), t.id + ': المثال بلا أرقام');
    else { assert.ok(t.src, t.id + ': شرعي بلا مصدر'); const hay = lessons + ' ' + fiqh + ' ' + sources + ' ' + approved, parts = norm(t.def).split(/[،؛:.](?=\s|$)/).map(x => x.trim()).filter(x => x.length > 12); assert.ok(parts.length === 0 || parts.every(x => hay.includes(x)) || hay.includes(norm(t.def)), t.id + ': تعريف شرعي ليس حرفياً من نص معتمد: ' + t.def); }
  }
  ok('كل شرح ≤20 كلمة، والمالي له مثال بأرقام، والشرعي حرفي من نص معتمد ذي مصدر');
  for (const t of G.TERMS.filter(t => t.hidden)) assert.ok(t.todo === 'TODO-REVIEW' && !G.byId(t.id) && !G.find(t.m[0]).length, t.id + ': المخفي يجب أن يبقى مخفياً'); ok('المخفي (TODO-REVIEW) لا يُعلَّم ولا يُعرض: ' + G.TERMS.filter(t => t.hidden).map(t => t.id).join('، '));
  const html = 'يا ولدي، <b>السعر المرجعي</b> للقمح وبالجمارك، وهامش ربحك 15٪، والسعر المرجعي مرة أخرى. وفي الدين الإسلامي';
  const out = G.mark(html), strip = s => s.replace(/<[^>]*>/g, '');
  assert.equal(strip(out), strip(html), 'التعليم غيّر النص'); assert.equal((out.match(/class="gl"/g) || []).length, 3, out); assert.ok(!/data-gl="debt"/.test(out)); ok('التعليم لا يغيّر النص المعروض، أول ظهور فقط، والدين بمعنى الملّة لا يُعلَّم');
  const L = require('../src/lessons.js'), text = [];
  const v = x => { if (typeof x === 'string') text.push(x); else if (Array.isArray(x)) x.forEach(v); else if (x && typeof x === 'object') Object.values(x).forEach(v); };
  L.LEVELS.slice(0, 5).forEach(l => { ['title', 'intro', 'lesson', 'task', 'done', 'quiz'].forEach(k => v(l[k])); });
  const all = text.join(' ');
  for (const w of LESSON_TERMS) { assert.ok(all.normalize('NFC').replace(/[ً-ٰٟ]/g, '').includes(w.normalize('NFC').replace(/[ً-ٰٟ]/g, '')), 'المصطلح ليس في دروس 1–5 (حدّث القائمة): ' + w); assert.ok(G.find(w).length >= 1, 'المطابقة لا تجد: ' + w); }
  ok('كل مصطلح مالي في دروس 1–5 (' + LESSON_TERMS.length + ') في القاموس وتجده المطابقة');
  // الواجهة
  const b = await chromium.launch(), errors = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto('file://' + path.join(__dirname, '../index.html') + '?learn=1&seed=57&type=0'); await p.waitForFunction(() => window.__game && window.Glossary);
    await p.evaluate(() => { const { S, E } = __game; E.A.chooseStart(S, E.COUNTRIES[0].id); E.A.learnSetChar(S, Lessons.CHARS[0].id); __game.renderAll(true); });
    let found = false; for (let i = 0; i < 16 && !found; i++) { await p.waitForTimeout(250); found = await p.locator('#lesson .gl').count() > 0; if (found) break; const nx = p.locator('#lesson [data-act=lnext]'), cl = p.locator('#lesson [data-act=lclose]'); if (await nx.count()) await nx.first().click({ timeout: 2000 }).catch(() => {}); else if (await cl.count()) await cl.first().click({ timeout: 2000 }).catch(() => {}); }
    assert.ok(found, 'لا مصطلح مُعلَّم في درس المستوى الأول');
    const g = p.locator('#lesson .gl').first(), id = await g.getAttribute('data-gl'); await g.click(); await p.waitForTimeout(200);
    assert.ok(await p.locator('#glPop').isVisible(), 'الشرح لم يفتح'); const tx = await p.locator('#glPop').innerText(); assert.ok(tx.includes(G.byId(id).def), 'نص الشرح لا يطابق القاموس'); ok('ضغطة على «' + G.byId(id).term + '» تفتح شرحه');
    assert.ok(await p.evaluate(() => { const r = document.getElementById('glPop').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth + 1; }), 'الشرح خارج الشاشة أو تمرير أفقي'); ok('الشرح داخل الشاشة على 390 بلا تمرير أفقي');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150); assert.ok(!(await p.locator('#glPop').isVisible()), 'Escape لا يغلقه');
    await p.locator('#lesson .gl').first().focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(150); assert.ok(await p.locator('#glPop').isVisible(), 'Enter لا يفتحه'); await p.locator('#glPop [data-act=glclose]').click(); assert.ok(!(await p.locator('#glPop').isVisible())); ok('لوحة المفاتيح: Enter يفتح وEscape والزر يغلقان');
    assert.deepEqual(errors, [], 'أخطاء JS'); ok('بلا أخطاء JS'); console.log('OK glossary-ui');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
