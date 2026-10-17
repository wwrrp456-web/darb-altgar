/* درب التجّار v0.2 — الواجهة: سبع شاشات بحالة واحدة مشتركة وتوجيه بالـ hash */
(function () {
'use strict';
const E = Engine, A = E.A, GD = E.GD, GIDS = E.GIDS, CD = E.CD;
const $ = id => document.getElementById(id);
const KEY = 'darb-v3', KEY2 = 'darb-v2';
let S, sel = 'riyadh', screen = 'home', speed = 0, pct = false, carSel = 1, timer = null, lastSave = 0, ct = 'cities', guideOff = false;
let pressing = false, dirty = false, mapC = 'all', mf = 'all', estC = 'sa', estCity = 'riyadh', empC = 'sa', oldSave = false, dg = null, dq = 10, fxFrom = 'sar', fxTo = 'usd';
const SPEEDS = { 0: 0, 1: 1100, 2: 450, 3: 140 };
try { guideOff = localStorage.getItem('darb-guide-off') === '1'; } catch (e) {}
const COAST = new Set(['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai']);

const ART = window.ART || {};
const WM = window.WorldMap;
let mapView = { zoom: 1, center: null }, mapBase, mapVB, mapDrag = null, mapDragged = false, mapListOpen = {};
const gi = g => (ART['goods/' + g] ? `<img class="gi" src="${ART['goods/' + g]}" alt="${GD[g].name}">` : GD[g].icon);
const uic = k => (ART['ui/' + k] ? `<img class="uic" src="${ART['ui/' + k]}" alt="">` : '');
const art = k => ART['cutouts/' + k] || ART[k] || '';
const pic = (k, cls, alt) => (art(k) ? `<img class="pic ${ART['cutouts/' + k] || k.startsWith('expressions/') || k.startsWith('story/') ? 'cutout' : ''} ${cls || ''}" data-art="${k}" src="${art(k)}" alt="${alt || ''}">` : '');
const fmt = n => Math.round(n).toLocaleString('en-US');
const hudFmt = n => {
  const v = Math.abs(n);
  const unit = v >= 1e9 ? [1e9, 'مليار'] : v >= 1e6 ? [1e6, 'مليون'] : v >= 1e4 ? [1e3, 'ألف'] : null;
  return unit ? `${(n / unit[0]).toLocaleString('en-US', { maximumFractionDigits: unit[0] === 1e3 ? 0 : 1 })} ${unit[1]}` : fmt(n);
};
const f1 = n => (Math.round(n * 10) / 10).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const car = () => S.player.caravans.find(c => c.id === carSel) || S.player.caravans[0];
const main = () => S.player.caravans[0];
const cityName = id => S.cities[id].name;
const flag = id => CD[S.cities[id].country].flag;
const cityTag = id => flag(id) + ' ' + esc(cityName(id));
const bar = (v, mx, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, 100 * v / mx))}%"></i></div>`;
const EVN = { boom: 'ازدهار', bust: 'كساد', plague: 'وباء', festival: 'مهرجان', war: 'حرب وحصار' };
const evGood = k => k === 'boom' || k === 'festival';
function spark(arr, w, h) {
  if (!arr || arr.length < 2) return '';
  const mn = Math.min(...arr), mx = Math.max(...arr), rg = mx - mn || 1;
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - 2 - (v - mn) / rg * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" style="direction:ltr;vertical-align:middle"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
function act(r) { if (r && r.msg) toast(r.msg); renderAll(true); }
const fx = () => S.fx;
const curBadge = c => ({ sar: '🇸🇦 ر.س', usd: '💵 $', au: '🥇 غ' })[c];
// سعر بالريال أولاً، ومعه الدولار في الأسواق الأجنبية
function pr(sar, country, dec) { const d = dec == null ? 1 : dec; const v = (Math.round(sar * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US'); return `<b class="num">${v}</b> ر.س` + (country && country !== 'sa' ? `<span class="usd">$${(sar / fx().usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>` : ''); }
const sgn = n => (n >= 0 ? '+' : '−') + fmt(Math.abs(n));
const plCls = n => (n >= 0 ? 'up' : 'dn');
const citiesOf = cn => S.order.filter(id => S.cities[id].country === cn);

/* ---------- حفظ / بدء ---------- */
function persist() { try { localStorage.setItem(KEY, E.save(S)); } catch (e) {} }
function splash() {
  const el = $('splash'); if (!el) return;
  const header = $('hName'); if (header && ART['brand/wordmark']) header.innerHTML = `<img class="brand-wordmark" src="${ART['brand/wordmark']}" alt="درب التجّار">`;
  if (navigator.webdriver) { el.remove(); return; }
  const port = innerHeight > innerWidth, bg = (port ? ART['brand/splash'] : ART['brand/cover']) || ART['brand/cover'] || ART['brand/splash'] || ART['scene/caravan'];
  if (bg) { el.style.backgroundImage = `url(${bg})`; el.classList.add(port && ART['brand/splash'] ? 'p' : 'l'); }
  el.innerHTML = `<div class="brand-loading">${ART['brand/wordmark'] ? `<img class="brand-wordmark" src="${ART['brand/wordmark']}" alt="درب التجّار">` : '<h1>درب التجّار</h1>'}</div><div class="bar"><i></i></div>`;
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, 1500);
}
let instEvt = null, installed = false, instNote = '';
try { window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); instEvt = e; if (S) renderAll(true); }); window.addEventListener('appinstalled', () => { installed = true; instEvt = null; if (S) renderAll(true); }); } catch (e) {}
const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
function installDiag() {
  const ua = navigator.userAgent, inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|Twitter|WhatsApp|Telegram|MiuiBrowser|; wv\)|GSA\//i.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua), chrome = /Chrome\//.test(ua) && !/EdgA|OPR|SamsungBrowser|Firefox/.test(ua);
  const out = [];
  if (inApp) out.push('تفتح اللعبة داخل متصفح تطبيق آخر (واتساب أو غيره). انسخ الرابط وافتحه في كروم مباشرة.');
  if (!window.isSecureContext) out.push('الصفحة غير آمنة (يلزم https).');
  if (!('serviceWorker' in navigator)) out.push('المتصفح لا يدعم ملفات العمل.');
  if (ios) out.push('على الآيفون: افتح الرابط في سفاري، اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».');
  else if (!chrome && !inApp) out.push('يُفضَّل كروم للتثبيت. في المتصفحات الأخرى: القائمة ← «إضافة إلى الشاشة الرئيسية».');
  else if (!inApp) out.push('في كروم: اضغط ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إن لم يظهر الخيار فجرّب إعادة تحميل الصفحة بعد دقيقة من اللعب.');
  return out;
}
function installCard() {
  if (installed || standalone() || !/^https?:$/.test(location.protocol)) return '';
  return `<div class="card" style="margin-top:12px"><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>📲 <b>ثبّت اللعبة على جهازك</b> لتفتح كتطبيق بملء الشاشة</span><button class="btn" data-act="install">${instEvt ? 'ثبّت التطبيق' : 'كيف أثبّتها؟'}</button></div>${instNote ? `<div class="guide" style="margin-top:8px">${instNote}</div>` : ''}</div>`;
}
async function doInstall() {
  if (instEvt) { try { instEvt.prompt(); const r = await instEvt.userChoice; instEvt = null; instNote = r && r.outcome === 'accepted' ? 'تم! ستجد اللعبة على شاشتك الرئيسية.' : 'ألغيت التثبيت. يمكنك المحاولة لاحقاً.'; } catch (e) { instNote = installDiag().join('<br>'); } }
  else instNote = installDiag().join('<br>');
  renderAll(true);
}
/* ---------- التعليم: عمّ سالم والمستويات والأكاديمية ---------- */
const LSN = E.LS, MEN = LSN.MENTOR;
const NOLEARN = (() => { try { return navigator.webdriver && !/learn=1/.test(location.search); } catch (e) { return false; } })();
const SALEM_MOODS = { happy: 0, cheer: 1, proud: 2, sad: 3, thinking: 4, worried: 5, teach: 4 };
const mentorAv = (m = 'happy') => {
  if (m === 'teach' && ART['expressions/salem/teach']) return `<span class="mav m-teach">${pic('expressions/salem/teach', 'av dialogue-portrait', MEN.name)}</span>`;
  const index = SALEM_MOODS[m] ?? 0;
  const portrait = ART['hero/salem_expressions']
    ? `<span class="pic av salem-portrait cutout" style="--salem-x:${index % 3};--salem-y:${Math.floor(index / 3)}"><img src="${ART['hero/salem_expressions']}" alt="${MEN.name}" draggable="false"></span>`
    : pic(MEN.img, 'av', MEN.name);
  return `<span class="mav m-${m}">${portrait}</span>`;
};
const lvlOf = () => (S.learn.level <= 10 ? LSN.LEVELS[S.learn.level - 1] : null);
function learnNext() {
  if (help) return { k: 'help' };
  if (!S.learn) return null;
  if (!S.learn.char) return NOLEARN ? null : { k: 'char' };
  if (NOLEARN) return null;
  const L = S.learn;
  if (L.up.length) return { k: 'up', lvl: L.up[0] };
  const Z = S.zakat;
  if (Z && (zview || (Z.due && (!Z.defer || S.day >= Z.defer)))) return { k: 'zakat' };
  if (Z && Z.start != null && !L.zseen) return { k: 'zlesson' };
  if (L.fq && L.fq.length) return { k: 'debtfree' };
  if (L.tq && L.tq.length) return { k: 'tablet', id: L.tq[0] };
  if (L.eq && L.eq.length) return { k: 'event', id: L.eq[0].id };
  if (dview && S.player.famDebt) return { k: 'debt' };
  if (adv && L.level > 10) return { k: 'advisor' };
  if (L.sq.length) return { k: 'secret', cc: L.sq[0] };
  if (L.bq && L.bq.length) return { k: 'boss', c: L.bq[0].c, n: L.bq[0].n };
  if (L.csq && L.csq.length) return { k: 'csecret', id: L.csq[0] };
  if (L.level <= 10 && L.intro < L.level && !L.rest) return { k: 'intro', lvl: L.level };
  if (view) return view;
  return null;
}
let view = null, dview = false, zview = false, prof = false, adv = false, advTab = 'deal', help = false;
const goalsHTML = lv => lv.goals(S).map(g => `<div class="lgoal ${g[1] ? 'ok' : ''}"><span class="gk"></span><span>${g[0]}</span></div>`).join('');
const lessonHTML = lv => lv.lesson.map(p => `<p>${p}</p>`).join('');
function mentorSay(txt, m) { return `<div class="msay">${mentorAv(m)}<div><b>${MEN.name}</b><span class="small muted"> · ${MEN.role}</span><div class="bub">${txt}</div></div></div>`; }
let seq = null;
const seqId = n => n.k === 'char' ? 'welcome' : n.k === 'intro' ? 'intro' + n.lvl : n.k;
function beatsOf(n) {
  if (n.k === 'char') { const w = LSN.WELCOME; return w.slice(0, -1).concat([{ startpick: true }, w[w.length - 1], { picker: true }]); }
  if (n.k === 'zlesson') { const z = LSN.ZAKAT_LESSON; return [{ say: z.intro }].concat(z.lesson.map(t => ({ say: t })), z.quiz.map(q => ({ quiz: q })), [{ zend: true }]); }
  const lv = LSN.LEVELS[n.lvl - 1];
  return [{ say: lv.intro }].concat(lv.lesson.map(t => ({ say: t })), lv.quiz.concat(BV().QUIZ[n.lvl] || []).map(q => ({ quiz: q })), [{ task: true }]);
}
const dots = (i, n) => `<div class="dots">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join('')}</div>`;
function beatHTML(n, beats) {
  const i = seq.i, b = beats[i], last = i === beats.length - 1, lv = n.lvl ? LSN.LEVELS[n.lvl - 1] : null, zl = n.k === 'zlesson' ? LSN.ZAKAT_LESSON : null;
  let h = '';
  if (b.startpick) return `<div class="lbox wide">${dots(i, beats.length)}${mentorSay('كان لجدّك قوافل في كل الدول. من أي دولة تحب أن تبدأ؟ ابدأ حيث تشعر بالألفة، وكوّن ثروتك فيها أولاً حتى تشتدّ، ثم نمضي إلى بقية الدول.', 'teach')}<div class="chars">${E.COUNTRIES.map(ct => { const c = S.cities[E.START_OF[ct.id]], mk = c.makes.map(g => GD[g].name).join('، '); return `<div class="char"><div style="font-size:42px;text-align:center">${ct.flag}</div><h3>${ct.name}</h3><div class="muted small">تبدأ من ${esc(c.name)}</div><p class="small">تُنتج: ${mk}</p><div class="small muted">${ct.id === 'sa' ? 'عملتك الريال' : 'عملتك الدولار'}</div><button class="btn" data-act="lstart" data-g="${ct.id}">ابدأ من ${ct.name}</button></div>`; }).join('')}</div></div>`;
  if (b.picker) return `<div class="lbox wide">${dots(i, beats.length)}${mentorSay('اختر شخصيتك، ولكل واحدة ميزة تناسب طريقها. وسأرافقك مهما اخترت.')}<div class="chars">${LSN.CHARS.map(c => `<div class="char">${pic(c.img, 'cimg', c.name)}<h3>${c.name}</h3><div class="muted small">${c.tag}</div><p class="small">${c.desc}</p><ul>${c.perksText.map(x => `<li>${x}</li>`).join('')}</ul><div class="small muted">يتعمّق في: ${c.focus}</div><button class="btn" data-act="lchar" data-g="${c.id}">اختر ${c.name}</button></div>`).join('')}</div></div>`;
  const head = zl ? `<div class="lhead"><span class="lnum">${zl.icon}</span><div><div class="small muted">درس خاص</div><h2 style="margin:0">${zl.title}</h2></div></div>` : lv ? `<div class="lhead"><span class="lnum">${lv.icon}</span><div><div class="small muted">المستوى ${n.lvl} من ١٠ · ${LSN.MODE_NAMES[lv.mode]}</div><h2 style="margin:0">${lv.title}</h2></div></div>` : '';
  h = `<div class="lbox">${head}${dots(i, beats.length)}`;
  if (b.say) {
    const rp = seq.rep[i];
    const wm = n.k === 'char' ? ['happy', 'sad', 'proud', 'teach'][i] || 'happy' : i === 0 ? 'happy' : 'teach';
    h += mentorSay(b.say, wm);
    if (b.replies && rp == null) h += `<div class="replies">${b.replies.map((r, k) => `<button class="btn ghost" data-act="lrep" data-g="${k}">${r.t}</button>`).join('')}</div>`;
    else if (b.replies) h += `<div class="mine">${b.replies[rp].t}</div>${mentorSay(b.replies[rp].say, n.k === 'char' && i === 1 ? 'sad' : 'happy')}<button class="btn" data-act="lnext">${last ? 'ابدأ' : 'أكمل'}</button>`;
    else h += `<button class="btn" data-act="lnext">أكمل</button>`;
  } else if (b.quiz) {
    const q = b.quiz, st = seq.ans[i] || { bad: [], done: false };
    h += mentorSay('الآن أختبرك يا ولدي: <b>' + q.q + '</b>', 'thinking');
    h += `<div class="opts">${q.o.map((t, k) => `<button class="btn opt ${st.done && k === q.ok ? 'right' : st.bad.includes(k) ? 'wrong' : ''}" data-act="lans" data-g="${k}" ${st.done || st.bad.includes(k) ? 'disabled' : ''}>${t}</button>`).join('')}</div>`;
    if (st.bad.length && !st.done) h += mentorSay('ليس تماماً. فكّر مرة أخرى بهدوء.', 'worried');
    if (st.done) h += mentorSay(q.why, st.bad.length >= 2 ? 'teach' : st.bad.length ? 'proud' : 'cheer') + `<button class="btn" data-act="lnext">أكمل</button>`;
  } else if (b.zend) {
    h += mentorSay('بارك الله فيك. حين يحول الحول سأريك الحساب وتُخرج الزكاة بيدك، وفي ملفك يظهر عدّاد الحول.', 'proud') + `<button class="btn" data-act="lclose">فهمت</button>`;
  } else if (b.task) {
    h += mentorSay('والآن دورك يا ولدي: العلم بلا عمل لا ينفع.', 'proud') + `<div class="card task"><b>مهمتك:</b> ${lv.task}<div style="margin-top:6px">${goalsHTML(lv)}</div></div><button class="btn" data-act="lclose">هيّا بنا</button>`;
  }
  return h + `</div>`;
}
function renderLesson() {
  const el = $('lesson'); if (!el) return;
  const n = learnNext();
  if (!n) { el.hidden = true; el.innerHTML = ''; return; }
  let h = '';
  if (n.k === 'char' || n.k === 'intro' || n.k === 'zlesson') {
    const id = seqId(n); if (!seq || seq.id !== id) seq = { id, i: 0, ans: {}, rep: {} };
    h = beatHTML(n, beatsOf(n));
  } else {
    seq = null;
    if (n.k === 'help') h = helpHTML();
    else if (n.k === 'advisor') h = advisorHTML();
    else if (n.k === 'zakat') h = zakatHTML();
    else if (n.k === 'up') {
      const lv = LSN.LEVELS[n.lvl - 1], last = n.lvl === 10;
      h = `<div class="lbox"><div class="lhead"><span class="lnum">🎉</span><div><div class="small muted">أتممتَ المستوى ${n.lvl}</div><h2 style="margin:0">${lv.title}</h2></div></div>${mentorSay(lv.done, 'cheer')}<div class="card">مكافأة: <b>+${lv.reward} ريال</b>${last ? '<div style="margin-top:6px">🎓 تخرّجتَ! ومن الآن عمّ سالم <b>مستشارك الخاص</b>: يظهر لك زر 💬 تسأله منه عن الصفقات والسوق والمخاطر والزكاة، وتجد دروسك دائماً في «الأكاديمية».</div>' : `<div style="margin-top:6px">${S.learn.rest ? '🏋️ قبل الدرس القادم تمرّن: <b>' + restText(S.learn.rest) + '</b>' : ''}<div>الدرس القادم: <b>${LSN.LEVELS[n.lvl].icon} ${LSN.LEVELS[n.lvl].title}</b></div></div>`}</div>${storyCard(n.lvl)}${babCard(n.lvl)}<button class="btn" data-act="lclose">${last ? 'شكراً يا عمّ سالم' : 'التالي'}</button></div>`;
    } else if (n.k === 'secret') {
      const sc = LSN.SECRETS[n.cc], ct = E.COUNTRIES.find(x => x.id === n.cc);
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${sc.icon}</span><div><div class="small muted">سرّ تجاري · ${ct.flag} ${ct.name}</div><h2 style="margin:0">${sc.title}</h2></div></div>${mentorSay('هذا سرّ تعلّمته من أهل هذه البلاد يا ولدي:', 'teach')}<div class="lesson"><p>${sc.text}</p></div><div class="card">🎁 ميزة جديدة: <b>${sc.perk}</b></div><button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'event') h = eventHTML(L0());
    else if (n.k === 'debt') h = debtHTML();
    else if (n.k === 'debtfree') {
      const f = E.BAB.DEBT.free;
      h = `<div class="lbox"><div class="lhead"><span class="lnum">🕊️</span><div><div class="small muted">دَين الجدّ</div><h2 style="margin:0">${f.title}</h2></div></div>${mentorSay(f.say, 'cheer')}<div class="card">🎁 ميزة دائمة: <b>${f.perk}</b></div><button class="btn" data-act="lclose">الحمد لله</button></div>`;
    } else if (n.k === 'tablet') {
      const t = BV().TABLETS[n.id];
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${t.icon}</span><div><div class="small muted">لوح حكمة من ${BV().CITY}</div><h2 style="margin:0">${t.title}</h2></div></div>${mentorSay('وجدتُ في الدفتر لوحاً يوافق ما فعلتَ يا ولدي:', 'teach')}<div class="lesson"><p>${t.text}</p></div><div class="card">🎁 جائزة: <b>+${t.reward} ريال</b></div><button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'boss') {
      const lo = E.LORE.BOSS_LORE[n.c], bs = S.bosses[n.c], ch = lo.ch[n.n - 1];
      const extra = n.n === 2 ? `<div class="card">👤 طبعه: <b>${lo.trait}</b><br>يحبّ: ${lo.likes}<br>يكره: ${lo.dislikes}</div>` : n.n === 3 ? `<div class="card">💡 نصيحة عمّ سالم: <b>${lo.tip}</b><br><span class="small muted">${E.LORE.STYLES[lo.style].name}: ${E.LORE.STYLES[lo.style].effect}</span></div>` : '';
      h = `<div class="lbox"><div class="lhead">${bossPortrait(n.c, 'av', n.n === 3 ? 'accepted' : 'neutral') || '<span class="lnum">📜</span>'}<div><div class="small muted">حكاية الزعيم · ${esc(cityName(n.c))} · الفصل ${n.n} من 3</div><h2 style="margin:0">${esc(bs.name)}: ${ch.t}</h2></div></div>${mentorSay(n.n === 1 ? 'تعرّف على الرجل الذي يحكم هذا السوق يا ولدي:' : n.n === 2 ? 'بدأ الرجل يرتاح لك، فاسمع ما عرفته عنه:' : 'صرتَ من أصحابه، وهذه حكايته كما رواها لي:', n.n === 3 ? 'proud' : 'teach')}<div class="lesson"><p>${ch.x}</p></div>${extra}<button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'csecret') {
      const sc = E.LORE.CITY_SECRETS[n.id], c = S.cities[n.id], ct = CD[c.country];
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${sc.icon}</span><div><div class="small muted">سرّ السوق · ${ct.flag} ${esc(c.name)}</div><h2 style="margin:0">${sc.title}</h2></div></div>${mentorSay('عرفتَ هذا السوق جيداً الآن، فاسمع سرّه:', 'teach')}<div class="lesson"><p>${sc.text}</p><p><b>الدرس:</b> ${sc.lesson}</p></div><div class="card">🎁 ميزة جديدة: <b>${sc.perkText}</b></div><button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'view') {
      const lv = LSN.LEVELS[n.lvl - 1];
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${lv.icon}</span><div><div class="small muted">المستوى ${n.lvl}</div><h2 style="margin:0">${lv.title}</h2></div></div><div class="lesson">${lessonHTML(lv)}</div><div class="card task"><b>المهمة:</b> ${lv.task}<div style="margin-top:6px">${goalsHTML(lv)}</div></div><button class="btn" data-act="lclose">إغلاق</button></div>`;
    }
  }
  const key = JSON.stringify(n) + advTab + JSON.stringify(seq) + (S.learn.char || '') + (n.k === 'intro' || n.k === 'view' ? lvlKey() : '') + (n.k === 'zakat' ? S.zakat.amount + '|' + S.zakat.due : '') + (n.k === 'debt' ? JSON.stringify(S.player.famDebt) + '|' + S.player.vault : '');
  if (el.dataset.k === key && !el.hidden) return;
  el.dataset.k = key; el.hidden = false; el.innerHTML = h;
}
const lvlKey = () => { const lv = lvlOf(); return lv ? lv.goals(S).map(g => +g[1]).join('') : ''; };
const STORY_PEOPLE = { grandpa: 'جدّك', saeed: 'سعيد', imran: 'الحاج عمران', zafer: 'ظافر', saleh: 'صالح الحكيم في الحكاية', ghanem: 'غانم', suhail: 'سهيل' };
const STORY_CAST = { 1: ['saeed', 'imran'], 2: ['zafer'], 3: ['saeed'], 4: ['saeed'], 5: [], 6: ['saeed'], 7: ['saeed'], 8: ['saleh'], 9: ['saeed'], 10: ['ghanem', 'suhail'] };
const storyCast = (lv, grandfather = false) => `<div class="story-cast">${(grandfather ? ['grandpa'] : STORY_CAST[lv] || []).filter(id => art('story/' + id)).map(id => `<figure>${pic('story/' + id, 'story-face', STORY_PEOPLE[id])}<figcaption>${STORY_PEOPLE[id]}</figcaption></figure>`).join('')}</div>`;
function babBooks() {
  const L = S.learn; if (!L || !L.char) return '';
  const B = BV(), tab = L.tab || [];
  return `<h3 style="margin-top:16px">🏺 حكايات ${B.CITY}</h3><p class="muted small">${B.NOTE ? B.CITY + ': ' + B.NOTE + '. ' : ''}حكايات رواها لك عمّ سالم كلما أتممتَ درساً.</p>` + (LSN.LEVELS.filter(lv => L.level > lv.n).map(lv => B.STORY[lv.n] ? `<details class="card story"><summary><b>${lv.n}. ${B.STORY[lv.n].t}</b></summary>${storyCast(lv.n)}<p>${B.STORY[lv.n].x}</p></details>` : '').join('') || '<div class="card muted small">تُفتح الحكايات مع إتمام الدروس.</div>')
    + `<h3 style="margin-top:16px">📜 ألواح الحكمة (${tab.length} من ${Object.keys(B.TABLETS).length})</h3><div class="grid g3">` + Object.keys(B.TABLETS).map(id => { const t = B.TABLETS[id], open = tab.includes(id); return `<div class="card lv ${open ? 'done' : 'lock'}"><div class="row" style="margin:0"><span class="lnum">${open ? t.icon : '🔒'}</span><b>${open ? t.title : 'لوح مغلق'}</b></div><div class="small" style="margin-top:4px">${open ? t.text : t.hint}</div></div>`; }).join('') + `</div>`;
}
function loreBooks() {
  const L = S.learn; if (!L || !L.char) return '';
  const b = E.LORE.BOSS_LORE, sc = E.LORE.CITY_SECRETS;
  let h = `<h3 style="margin-top:16px">📖 دفتر الزعماء</h3><p class="muted small">حكايات زعماء الأسواق تُفتح فصلاً فصلاً كلما عرفتهم أكثر.</p><div class="grid g3">` + S.order.filter(id => b[id] && S.bosses[id]).map(id => {
    const n = (L.lore || {})[id] || 0;
    return `<div class="card lv ${n ? 'done' : 'lock'}"><div class="row" style="margin:0"><span class="lnum">${n ? '📜' : '🔒'}</span><b>${esc(cityName(id))}</b><span class="pill">${n}/3</span></div><div class="small" style="margin-top:4px">${n ? esc(S.bosses[id].name) + ' · ' + b[id].trait : 'لم تتعرف عليه بعد'}</div></div>`;
  }).join('') + `</div><h3 style="margin-top:16px">🗝️ أسرار الأسواق</h3><p class="muted small">يُكشف سرّ السوق حين تزوره مرتين وتبيع فيه بما يزيد على ١٠٠٠ ريال (بعد المستوى ٣).</p><div class="grid g3">` + S.order.filter(id => sc[id]).map(id => {
    const open = (L.csec || []).includes(id), cs = sc[id];
    return `<div class="card lv ${open ? 'done' : 'lock'}"><div class="row" style="margin:0"><span class="lnum">${open ? cs.icon : '🔒'}</span><b>${esc(cityName(id))}</b></div><div class="small" style="margin-top:4px">${open ? '<b>' + cs.title + '</b><br>' + cs.lesson : 'سرّ لم يُكتشف · زيارات ' + Math.min(2, (L.cv || {})[id] || 0) + '/2 · مبيعات ' + Math.min(1000, Math.round((L.cs || {})[id] || 0)) + '/1000'}</div></div>`;
  }).join('') + `</div>`;
  return h;
}
const storyCard = lv => { const st = LSN.storyOf(lv, S.home); return st ? `<div class="card story ${lv === 10 ? 'letter' : ''}"><b>📜 من ذكريات جدّك: ${st.t}</b>${storyCast(lv, true)}<p>${st.x}</p></div>` : ''; };
const storyBook = () => `<h3 style="margin-top:16px">📜 دفتر جدّك</h3><p class="muted small">حكايات جدّك التي يرويها لك عمّ سالم كلما أتممتَ درساً.</p>` + (LSN.LEVELS.filter(lv => S.learn.level > lv.n).map(lv => { const st = LSN.storyOf(lv.n, S.home); return `<details class="card story"><summary><b>${st.t}</b></summary>${storyCast(lv.n, true)}<p>${st.x}</p></details>`; }).join('') || '<div class="card lv lock"><div class="small muted">أتمم الدرس الأول لتُفتح أول حكاية.</div></div>');
function lseq(fn) { if (seq) { fn(seq); renderAll(true); } }
function learnClose() {
  const n = learnNext(), L = S.learn; if (!n) return;
  if (n.k === 'up') L.up.shift(); else if (n.k === 'secret') L.sq.shift(); else if (n.k === 'boss') L.bq.shift(); else if (n.k === 'debt') dview = false; else if (n.k === 'debtfree') L.fq.shift(); else if (n.k === 'tablet') L.tq.shift(); else if (n.k === 'csecret') L.csq.shift(); else if (n.k === 'intro') { L.intro = n.lvl; go(LV_START[n.lvl - 1] || 'market'); E.learnCheck(S); return; } else if (n.k === 'zlesson') L.zseen = 1; else if (n.k === 'zakat') zview = false; else if (n.k === 'advisor') adv = false; else if (n.k === 'help') help = false; else view = null;
  renderAll(true);
}
/* تعليقات عمّ سالم أثناء اللعب: فقاعة صغيرة غير معطّلة */
let rtimer = null;
function renderReact() {
  const L = S.learn, el = $('react'); if (!el || !L || !L.char || NOLEARN) return;
  if (!L.rq || !L.rq.length || learnNext()) return;
  const k = L.rq.shift(), r = LSN.REACT[k], lv = lvlOf(), mode = lv ? lv.mode : (L.advMute ? 'off' : 'advisor');
  let txt = r && (Array.isArray(r.t) ? r.t[((L.rseen[k] || 1) - 1) % r.t.length] : r.t); if (txt) txt = txt.replace('{p}', (L.rp && L.rp[k]) || '');
  const show = r && (r.always || mode === 'guide' || mode === 'hint' || (mode === 'alert' && r.alert) || (mode === 'advisor' && (r.adv || r.alert)));
  if (!show) return renderReact();
  el.innerHTML = `${mentorAv(r.m || 'happy')}<div><b>${MEN.name}</b><div>${txt}</div></div>`; el.hidden = false; el.classList.add('show');
  { const tb = $('top'), bt = tb ? tb.getBoundingClientRect().bottom : 0; el.style.top = Math.max(12, Math.round(bt + 8)) + 'px'; }
  clearTimeout(rtimer); rtimer = setTimeout(() => { el.classList.remove('show'); el.hidden = true; }, 7000);
}
const R0 = v => fmt(Math.round(v));
function zakatTable(b) {
  return `<table class="ztab"><tr><td>النقد (الريال والدولار والذهب بسعر اليوم)</td><td>${R0(b.cash)}</td></tr><tr><td>البضاعة في القوافل بسعر السوق</td><td>${R0(b.goods)}</td></tr><tr><td>البضاعة في المخازن</td><td>${R0(b.store)}</td></tr>${b.orders ? `<tr><td>طلبات الوكيل في الطريق</td><td>${R0(b.orders)}</td></tr>` : ''}<tr><td>الودائع والسندات</td><td>${R0(b.deposits + b.bonds)}</td></tr><tr><td>الديون عليك (تُطرح)</td><td>− ${R0(b.debts)}</td></tr><tr class="tot"><td>الوعاء الخاضع للزكاة</td><td>${R0(b.base)}</td></tr><tr><td>النصاب (٨٥ غرام ذهب × ${fmt(S.fx.gold)})</td><td>${R0(b.nisab)}</td></tr><tr><td>النسبة (ربع العشر)</td><td>٢٫٥٪</td></tr></table>`;
}
const L0 = () => S.learn.eq[0];
const ACTOR_NAMES = { creditor: 'الحاج صالح الصيرفي', broker: 'سمسار السوق', friend: 'صديقك' };
function actorPortrait(id, mood = 'neutral', cls = 'av') {
  return pic('expressions/events/' + id + '_' + mood, cls + ' dialogue-portrait', ACTOR_NAMES[id] || '');
}
function showCharacterReply(id, mood, text) {
  const el = $('react');
  if (!el || !text) return;
  el.innerHTML = `${actorPortrait(id, mood)}<div><b>نتيجة الموقف · ${ACTOR_NAMES[id]}</b><div>${esc(text)}</div></div>`;
  el.hidden = false;
  clearTimeout(rtimer);
  rtimer = setTimeout(() => { el.hidden = true; }, 7000);
}
function eventAction(choice) {
  const ev = L0(), id = ev && ev.id;
  const r = A.eventChoice(S, choice);
  act(r);
  if (id === 'broker' || id === 'friend') showCharacterReply(id, choice === 'ask' ? 'thinking' : choice === 'yes' && r.ok !== false ? 'accepted' : 'reserved', r.msg);
}
function eventHTML(ev) {
  const btn = (g, t, cls) => `<button class="btn ${cls || ''}" data-act="evch" data-g="${g}">${t}</button>`;
  if (ev.id === 'broker') return `<div class="lbox"><div class="lhead">${actorPortrait('broker', 'neutral', 'event-face')}<div><div class="small muted">حدث في السوق</div><h2 style="margin:0">سمسار الثراء السريع</h2></div></div>${mentorSay('انتبه يا ولدي، رجل أنيق يقترب منك...', 'worried')}<div class="lesson"><p>يهمس لك أن تدفع مقدّماً قدره <b>${fmt(ev.dep)} ريال</b> وأنه يضمن لك ربحاً قدره ٥٠٪ خلال عشرة أيام: «بلا أي مخاطرة!»</p></div><div class="opts">${btn('no', 'أرفض العرض')}${btn('ask', '🧓 أسأل عمّ سالم قبل أن أقرر')}${btn('yes', 'أدفع المقدّم', 'ghost')}</div></div>`;
  if (ev.id === 'friend') { const T = { secure: 'صديقك الصيرفي يطلب القرض، وعنده أرض وبيت قيمتهما أضعاف المبلغ.', worker: 'صانع ماهر طيّب السمعة في الوفاء بالعهود يطلب القرض ليشتري أدواته.', emotion: 'قريب لك يطلب القرض لمشروع لم يدرسه، ولم يسبق له أن حافظ على ما في يده.' }; return `<div class="lbox"><div class="lhead">${actorPortrait('friend', 'neutral', 'event-face')}<div><div class="small muted">حدث: قاعدة صالح</div><h2 style="margin:0">صديق يطلب قرضاً</h2></div></div>${mentorSay('هذا موقف علّمنا إياه صالح المقرض: انظر من يطلب قبل أن تعطي.', 'thinking')}<div class="lesson"><p>${T[ev.type]}</p><p>المبلغ المطلوب: <b>${fmt(ev.amt)} ريال</b> لمدة ثلاثين يوماً.</p></div><div class="opts">${btn('yes', 'أقرضه')}${btn('no', 'أعتذر بلطف', 'ghost')}</div></div>`; }
  const g = ev.g; return `<div class="lbox"><div class="lhead">${pic('hero/' + S.cities[ev.city].country, 'event-face', 'تاجر السوق')}<div><div class="small muted">حدث: فرصة في السوق</div><h2 style="margin:0">فرصة اليوم فقط</h2></div></div>${mentorSay('الحظ لمن استعدّ وبادر يا ولدي. انظر ما جاءك:', 'happy')}<div class="lesson"><p>تاجر ضاق به الحال يبيع <b>${GD[g].name}</b> في ${esc(cityName(ev.city))} بخصم ٢٥٪ اليوم فقط. عندك رصيد يكفي لاقتناصها.</p></div><div class="opts">${btn('yes', 'أغتنم الفرصة')}${btn('no', 'أتركها', 'ghost')}</div></div>`;
}
const BV = () => E.babFor(S);
const babCard = lv => { const st = BV().STORY[lv]; return st ? `<div class="card story"><b>🏺 من حكايات ${BV().CITY}: ${st.t}</b>${storyCast(lv)}<p>${st.x}</p></div>` : ''; };
function debtHTML() {
  const P = S.player, fd = P.famDebt, v = Math.round(P.vault || 0), B = E.BAB.DEBT, paidPct = Math.round((fd.amt0 - fd.left) / fd.amt0 * 100);
  const need = Math.max(0, Math.min(fd.left, Math.round(fd.amt0 * B.installPct)) - (fd.mPaid || 0)), left = fd.due != null ? Math.max(0, fd.due - S.day) : null;
  const say = fd.left <= 0 ? 'أنت حرّ من الدَّين يا ولدي، وهذه حصّالتك تكبر.' : fd.plan ? 'خطتك قائمة: سبعون لرأس مالك، وعشرون للحاج صالح، وعشرة لحصّالتك من كل صفقة رابحة. واصل.' : 'هذه خطة ظافر: من كل صفقة رابحة سبعون في المئة لرأس مالك، وعشرون للدائن، وعشرة لنفسك. فعّلها وسنخرج من الدَّين معاً.';
  return `<div class="lbox"><div class="lhead">${actorPortrait('creditor', fd.left <= 0 ? 'accepted' : fd.patience < 50 ? 'reserved' : fd.plan ? 'thinking' : 'neutral', 'event-face')}<div><div class="small muted">دَين الجدّ · ${esc(B.creditor)}</div><h2 style="margin:0">الدَّين والحصّالة</h2></div></div>${mentorSay(say, fd.left <= 0 ? 'cheer' : 'teach')}
  <div class="card"><div class="kv"><span>المتبقي من الدَّين</span><b>${fmt(Math.round(fd.left))} من ${fmt(fd.amt0)} ريال</b></div>${bar(paidPct, 100, 'gold')}
  ${fd.left > 0 ? `<div class="kv"><span>صبر الدائن</span><b>${Math.max(0, fd.patience)}٪</b></div><div class="kv"><span>القسط المتوقع كل ٣٠ يوماً</span><b>${fmt(Math.round(fd.amt0 * B.installPct))} ريال</b></div>${left != null ? `<div class="kv"><span>الموعد القادم</span><b>بعد ${left} يوم · ${need > 0 ? 'باقٍ ' + fmt(need) : '✅ وفّيتَه'}</b></div>` : '<div class="small muted">يبدأ العدّ حين تفعّل الخطة أو تبلغ المستوى ٤.</div>'}` : ''}</div>
  ${fd.left > 0 ? `<div class="row"><button class="btn ${fd.plan ? 'ghost' : ''}" data-act="dplan" data-g="${fd.plan ? 0 : 1}">${fd.plan ? '⏸ أوقف الخطة ٧٠/٢٠/١٠' : '📜 فعّل خطة ظافر ٧٠/٢٠/١٠'}</button></div><div class="row"><button class="btn sm" data-act="dpay" data-q="100">ادفع ١٠٠</button><button class="btn sm" data-act="dpay" data-q="500">ادفع ٥٠٠</button><button class="btn sm" data-act="dpay" data-q="${Math.ceil(fd.left)}">سدّد الكل</button></div>` : ''}
  <div class="card"><div class="kv"><span>🏺 الحصّالة (لا تُنفَق)</span><b>${fmt(v)} ريال</b></div><div class="small muted">عُشر أرباحك مع الخطة. تُحسب من ثروتك وزكاتك.</div>${v > 0 ? '<button class="btn ghost sm" data-act="vbreak">كسر الحصّالة (للطوارئ)</button>' : ''}</div>
  <button class="btn" data-act="lclose">إغلاق</button></div>`;
}
function zakatHTML() {
  const Z = S.zakat, b = E.zakatBase(S), due = Z.due, amt = due ? Z.amount : b.amount;
  const say = due ? (Z.defer ? 'عدتَ يا ولدي، والزكاة ما زالت عليك. هذا حسابها، فأخرجها متى قدرت.' : 'حال الحول يا ولدي! حان وقت الزكاة. هذا حساب مالك، وأنت من يخرجها بيده. الزكاة طُهرة للمال وحقّ للفقراء، فلا تثقل عليك.') : 'هذا حساب مبدئي لزكاة مالك لو حال الحول اليوم.';
  return `<div class="lbox"><div class="lhead"><span class="lnum">🕌</span><div><div class="small muted">${due ? 'حال الحول' : 'حساب مبدئي'}</div><h2 style="margin:0">زكاة عروض التجارة</h2></div></div>${mentorSay(say, due ? 'proud' : 'teach')}${zakatTable(b)}<div class="card"><b>${due ? 'المستحق: ' : 'المتوقع: '}${R0(amt)} ريال</b>${due ? `<div class="small muted" style="margin:4px 0">وعاء يوم تمام الحول: ${R0(Z.base)} × ٢٫٥٪. إن أخرجتَ أقل بقي الباقي عليك.</div><input id="zamt" class="zin" type="number" min="1" max="${Math.round(amt)}" value="${Math.round(amt)}" inputmode="numeric">` : '<div class="small muted">يبدأ الحول حين يبلغ مالك النصاب، وتجب الزكاة بتمام ٣٥٤ يوماً مع بقاء النصاب.</div>'}</div>${due ? `<button class="btn" data-act="zpay">أخرج الزكاة</button><button class="btn ghost" data-act="zdefer">أؤجّل أسبوعاً</button>` : `<button class="btn" data-act="lclose">إغلاق</button>`}<div class="small muted">حساب مبسّط للتدريب؛ وللعلماء اجتهادات في التفاصيل، فاسأل أهل العلم الموثوقين في مالك الحقيقي.</div></div>`;
}
function zakatBook() {
  if (!S.zakat || !S.learn.char) return '';
  const z = LSN.ZAKAT_LESSON, Z = S.zakat, b = E.zakatBase(S);
  return `<h3 style="margin-top:16px">🕌 فقه الزكاة</h3><details class="card story"><summary><b>${z.title}</b></summary>${z.lesson.map(t => `<p>${t}</p>`).join('')}</details><div class="card"><div class="small muted" style="margin-bottom:6px">حسابك الآن:</div>${zakatTable(b)}<div class="small" style="margin-top:6px">${Z.start == null ? 'لم يبدأ حولك بعد (لم تبلغ النصاب).' : Z.due ? '<b>الزكاة مستحقة الآن.</b>' : 'الحول: يوم ' + (S.day - Z.start) + ' من ' + E.ZAKAT.HAWL + '.'}${Z.paid ? ' · أخرجتَ في المجموع ' + R0(Z.paid) + ' ريال.' : ''}</div></div>`;
}
function babProfile(L) {
  const W = E.wealthStats(S), M = E.masteryOf(L), pas = E.passivePerDay(S), ck = ok => ok ? '✅' : '⬜';
  let h = `<div class="card"><h3>🧱 أسوار ${BV().CITY}: ${W.score} من 3</h3><div class="small">${ck(W.walls.div)} تنويع بضاعتك · ${ck(W.walls.prot)} تأمين أو حرّاس · ${ck(W.walls.res)} احتياطي يكفي رحلتين (عندك ${W.trips})</div><div class="small muted" style="margin-top:6px">ذهب يعمل ${Math.round(W.pctW * 100)}٪ ${bar(Math.round(W.pctW * 100), 100, 'gold')}ذهب نائم في المحفظة: ${R0(W.idle)} ريال</div></div>`;
  h += `<div class="card"><h3>🎓 إتقان الحرفة: ${M.name}</h3><div class="small muted">${M.next ? 'صفقات رابحة ' + M.n + ' من ' + M.next + ' للرتبة التالية (مؤن أرخص)' : 'بلغتَ أعلى رتبة: مؤن أرخص ٦٪'}</div>${M.next ? bar(Math.round(M.n / M.next * 100), 100, 'gold') : ''}</div>`;
  h += `<div class="card"><h3>🎯 رغبتي المحددة</h3>${L.wish ? `<div class="small">هدفك ثروة ${R0(L.wish.amt)} ريال (الآن ${R0(E.netWorth(S))})</div>${bar(Math.min(100, Math.round(E.netWorth(S) / L.wish.amt * 100)), 100, 'gold')}` : '<div class="small muted">اكتب رقماً محدداً، فالرغبة التي لها رقم أقرب للتحقق.</div>'}<div class="row" style="margin-top:6px"><input id="wishamt" type="number" inputmode="numeric" placeholder="مثلاً ٥٠٠٠" style="flex:1;min-width:0"><button class="btn sm" data-act="wset">${L.wish ? 'غيّر' : 'حدّد'}</button></div></div>`;
  if (L.level >= 9) h += `<div class="card"><h3>🕊️ رحلة الحرية المالية ${L.freedom ? '✅' : ''}</h3><div class="small">دخلك السلبي (دكاكين، ودائع، سندات): <b>${R0(pas)}</b> ريال/يوم من <b>${E.FREE_DAILY}</b> لتغطية مصروفك</div>${bar(Math.min(100, Math.round(pas / E.FREE_DAILY * 100)), 100, 'gold')}</div>`;
  return h;
}
function renderProfile() {
  const el = $('profile'); if (!el) return;
  if (!prof || !S.learn) { el.hidden = true; el.innerHTML = ''; return; }
  const L = S.learn, ch = LSN.CHARS.find(c => c.id === L.char), lv = lvlOf(), nxt = L.level < 10 ? LSN.LEVELS[L.level] : null, Z = S.zakat, zb = E.zakatBase(S);
  const gl = lv ? lv.goals(S) : [], pr = gl.length ? Math.round(gl.filter(g => g[1]).length / gl.length * 100) : 100;
  const best = S.player.trades.reduce((m, t) => Math.max(m, t.pl || 0), 0), nw = E.netWorth(S);
  let h = `<div class="pf"><div class="pf-head">${charImg() ? `<img class="pimg" src="${charImg()}" alt="">` : ''}<div style="flex:1;min-width:0"><h2>${ch ? ch.name : 'التاجر'}</h2><div class="muted small">${ch ? ch.tag : ''} · ${E.titleOf(nw)}</div><div style="margin-top:6px"><b>${L.level > 10 ? '🎓 أنهيتَ المعهد' : 'المستوى ' + L.level + ' من ١٠'}</b>${lv ? `<div class="small muted">${lv.icon} ${lv.title}</div><div class="pbar"><u style="width:${Math.max(4, pr)}%"></u></div>` : ''}</div>${ch ? `<div class="small">${ch.perksText.join(' · ')}</div>` : ''}</div></div>`;
  if (lv) h += `<div class="card"><h3>📋 مهامك الحالية</h3><div class="small muted" style="margin-bottom:4px">${lv.task}</div>${goalsHTML(lv)}<div class="row" style="margin-top:8px"><button class="btn sm" data-act="pgo" data-g="${LV_SCREEN[L.level - 1]}">ابدأ المهمة</button><button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 الدرس</button></div></div>`;
  if (nxt) h += `<div class="card"><h3>⏭ المستوى التالي</h3><div>${nxt.icon} ${nxt.title}</div><div class="small muted">${nxt.task}</div></div>`;
  h += babProfile(L);
  if (S.player.famDebt) h += `<div class="card"><h3>💳 دَين الجدّ والحصّالة</h3><div class="small">${S.player.famDebt.left > 0 ? 'المتبقي ' + R0(S.player.famDebt.left) + ' من ' + R0(S.player.famDebt.amt0) + ' ريال' + (S.player.famDebt.plan ? ' · الخطة قائمة' : ' · لا خطة بعد') : '✅ حرّ من الدَّين'} · الحصّالة ${R0(S.player.vault || 0)}</div><button class="btn sm" data-act="dopen">فتح</button></div>`;
  if (Z) h += `<div class="card"><h3>🕌 الزكاة</h3><div class="small">${Z.due ? '<b>حال الحول والزكاة مستحقة: ' + R0(Z.amount) + ' ريال.</b>' : Z.start != null ? 'الحول: يوم ' + (S.day - Z.start) + ' من ' + E.ZAKAT.HAWL + ' (باقٍ ' + Math.max(0, E.ZAKAT.HAWL - (S.day - Z.start)) + ' يوماً).' : 'وعاؤك ' + R0(zb.base) + ' من نصاب ' + R0(zb.nisab) + ' ريال، ولم يبدأ الحول بعد.'}${Z.last != null ? '<br>آخر زكاة: يوم ' + Z.last + ' · مجموع ما أخرجتَ ' + R0(Z.paid) + ' ريال ✅' : ''}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="zopen">${Z.due ? 'احسب وأخرج الزكاة' : 'احسب زكاتي الآن'}</button></div></div>`;
  h += `<div class="stats"><div><b>${S.player.trips}</b>رحلات</div><div><b>${R0(best)}</b>أفضل ربح</div><div><b>${S.day}</b>يوماً</div></div>`;
  if (L.secrets.length) h += `<div class="small">أسرار فتحتَها: ${L.secrets.map(c => { const k = E.COUNTRIES.find(x => x.id === c); return k ? k.flag + ' ' + k.name : ''; }).join(' · ')}</div>`;
  h += `<div class="row"><button class="btn" data-go="academy">🎓 المعهد (الأكاديمية)</button><button class="btn ghost" data-act="pask">💬 اسأل عمّ سالم</button><button class="btn ghost" data-act="pclose">إغلاق</button></div></div>`;
  el.hidden = false; el.innerHTML = h;
}
const ADV_TABS = [['deal', '📈 صفقة'], ['market', '🏪 السوق'], ['portfolio', '💼 محفظتي'], ['risk', '🛡️ المخاطر'], ['zakat', '🕌 الزكاة'], ['learn', '🎓 دروس'], ['set', '⚙️']];
const pctS = v => Math.round(v * 100) + '٪';
function advisorHTML() {
  const L = S.learn, r = E.advisorReport(S), nm = g => GD[g].name, tabs = `<div class="chips advtabs">${ADV_TABS.map(([k, t]) => `<button data-act="advtab" data-g="${k}" class="${advTab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  let say = '', body = '', mood = 'happy';
  if (advTab === 'deal') {
    if (!r.idle) { say = `قافلتك في الطريق إلى ${S.cities[r.dest].name}، باقٍ ${r.left} أيام. استعدّ لما بعد الوصول.`; mood = 'teach'; }
    else if (r.deal) { const d = r.deal; say = `هذه أفضل صفقة أراها من ${S.cities[r.city].name} الآن: ربح متوقع ${pctS(d.pct)} على ما تدفع.`; mood = 'proud';
      body = `<div class="card"><b>اشترِ ${d.q} ${nm(d.g)} هنا</b> (≈ ${fmt(Math.round(d.cost))} ريال)<br>وبِعها في <b>${S.cities[d.dest].name}</b> بعد ${d.days} أيام<br>ربح متوقع: <b class="cheap">+${fmt(Math.round(d.profit))} ريال</b> · خطر الطريق ${pctS(d.risk || 0)}<div class="small muted" style="margin-top:6px">الحساب بعد المؤن والجمارك والضريبة، لكن الأسعار تتحرك أثناء السفر.</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="advgo" data-g="market">افتح السوق</button></div></div>`; }
    else { say = 'لا أرى صفقة مجزية من هنا الآن. انتظر يوماً أو انتقل لمدينة أخرى وانظر هناك.'; mood = 'thinking'; }
    if (r.cargo.length) body += `<div class="card"><b>ما تحمله الآن</b>${r.cargo.map(c => `<div class="kv"><span>${nm(c.g)} × ${c.q}</span><span>${c.best ? 'الأفضل في ' + S.cities[c.best.city].name + ' (' + (c.best.profit >= 0 ? '+' : '') + fmt(Math.round(c.best.profit)) + ')' : '—'}</span></div>`).join('')}</div>`;
  } else if (advTab === 'market') {
    const ch = r.here.slice(0, 3), dr = r.here.slice(-3).reverse(); say = `هذا حال سوق ${S.cities[r.city].name} الآن: الأخضر رخيص والأحمر غالٍ مقارنة بالمعتاد.`; mood = 'teach';
    const row = x => `<div class="kv"><span>${nm(x.g)}</span><span class="${x.ratio < 0.95 ? 'cheap' : x.ratio > 1.1 ? 'dear' : ''}">${fmt(Math.round(x.price))} ر.س · ${pctS(x.ratio)} من المعتاد</span></div>`;
    body = `<div class="card"><b>الأرخص هنا</b>${ch.map(row).join('')}</div><div class="card"><b>الأغلى هنا</b>${dr.map(row).join('')}</div>`;
  } else if (advTab === 'portfolio') {
    const p = r.portfolio, tot = Math.max(1, p.cash + p.goods + p.store + p.deposits); say = p.cash > 0.6 * tot ? 'مالك سائل أكثر من اللازم. المال الراكد لا يربح.' : p.top && p.top.pct > 0.55 ? 'تركّزت بضاعتك في سلعة واحدة، تذكّر درس التنويع.' : 'محفظتك متوازنة، أحسنت.'; mood = p.top && p.top.pct > 0.55 ? 'worried' : 'proud';
    const share = (t, v) => `<div class="kv"><span>${t}</span><span>${fmt(Math.round(v))} ريال · ${pctS(v / tot)}</span></div>`;
    body = `<div class="card"><b>توزيع مالك (الثروة ≈ ${fmt(Math.round(p.nw))})</b>${share('نقد', p.cash)}${share('بضاعة في القوافل', p.goods)}${share('بضاعة في المخازن', p.store)}${share('ودائع وسندات', p.deposits)}${p.debts ? `<div class="kv"><span>ديون عليك</span><span class="dear">− ${fmt(Math.round(p.debts))}</span></div>` : ''}${p.top ? `<div class="small muted" style="margin-top:6px">أكبر سلعة عندك: ${nm(p.top.g)} (${pctS(p.top.pct)} من بضاعتك)</div>` : ''}</div>`;
  } else if (advTab === 'risk') {
    const k = r.risk; say = k.cargoValue > 4000 && k.guards < 2 ? 'بضاعتك غالية وحراسك قليلون. هذا ما يقلقني.' : 'حال قافلتك مطمئن، ومع ذلك لا تأمن الطريق.'; mood = k.cargoValue > 4000 && k.guards < 2 ? 'worried' : 'happy';
    body = `<div class="card"><div class="kv"><span>الحراس</span><b>${k.guards}</b></div><div class="kv"><span>الطاقم</span><b>${k.crew}</b></div><div class="kv"><span>التأمين</span><b>${k.insured ? 'مفعّل' : 'غير مفعّل'}</b></div><div class="kv"><span>قيمة الحمولة</span><b>${fmt(Math.round(k.cargoValue))} ريال</b></div>${k.route != null ? `<div class="kv"><span>خطر الطريق المقترح</span><b>${pctS(k.route)}</b></div>` : ''}<div class="small muted" style="margin-top:6px">الحراس يصدّون اللصوص، والتأمين يخفّف الخسارة إن وقعت.</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="advgo" data-g="caravan">افتح القافلة</button></div></div>`;
  } else if (advTab === 'zakat') {
    const z = r.zakat; say = z.due ? 'حال الحول! الزكاة مستحقة، فبادر بإخراجها.' : z.start != null ? `حولك جارٍ منذ ${S.day - z.start} يوماً من ${E.ZAKAT.HAWL}.` : 'لم تبلغ النصاب بعد، فلا زكاة عليك الآن.'; mood = z.due ? 'proud' : 'teach';
    body = `<div class="card">وعاؤك ${fmt(Math.round(z.base))} ريال · النصاب ${fmt(Math.round(z.nisab))}<br>المتوقع إن حال الحول اليوم: <b>${fmt(Math.round(z.amount))} ريال</b><div class="row" style="margin-top:8px"><button class="btn sm" data-act="zopen">${z.due ? 'احسب وأخرج الزكاة' : 'احسب زكاتي'}</button></div></div>`;
  } else if (advTab === 'learn') {
    say = 'أي درس تحب أن نراجعه معاً؟'; mood = 'teach';
    body = `<div class="card">${LSN.LEVELS.map(lv => `<button class="btn ghost sm" style="margin:3px" data-act="lview" data-g="${lv.n}">${lv.icon} ${lv.title}</button>`).join('')}<button class="btn ghost sm" style="margin:3px" data-act="zopen">🕌 الزكاة</button></div>`;
  } else {
    say = L.advMute ? 'سأسكت عن النصائح التلقائية، لكنني حاضر متى ناديتني.' : 'سأنبّهك حين أرى ما يستحق: فرصة بيع، تركّز في سلعة، قلة حراس، قرض قائم، وغير ذلك.'; mood = 'happy';
    body = `<div class="card"><button class="btn ghost" data-act="advmute">${L.advMute ? '🔔 أعد النصائح التلقائية' : '🔕 أسكت النصائح التلقائية'}</button></div>`;
  }
  return `<div class="lbox"><div class="lhead"><span class="lnum">💬</span><div><div class="small muted">مستشارك الخاص</div><h2 style="margin:0">عمّ سالم</h2></div></div>${tabs}${mentorSay(say, mood)}${body}<button class="btn ghost" data-act="lclose">إغلاق</button></div>`;
}
function renderAdvBtn() {
  const b = $('advBtn'); if (!b) return; const on = !!(S.learn && S.learn.char && S.learn.level > 10 && !NOLEARN);
  b.hidden = !on; if (on && !b.dataset.k) { b.dataset.k = 1; b.innerHTML = `${mentorAv('happy')}<span>استشِر</span>`; }
}
function mentorCard() {
  const L = S.learn; if (!L || !L.char) return '';
  const lv = lvlOf();
  if (!lv) return `<div class="card mentor" style="margin-top:12px"><div class="msay">${mentorAv()}<div><b>${MEN.name}</b><div class="bub">أنا الآن مستشارك الخاص يا صاحب السوق. استشرني في أي صفقة، ودروسك في «الأكاديمية».</div></div></div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="advisor">💬 استشرني</button><button class="btn ghost sm" data-go="academy">🎓 الأكاديمية</button></div></div>`;
  const mode = lv.mode;
  if (mode === 'alert') return `<div class="card mentor" style="margin-top:12px"><div class="msay">${mentorAv()}<div><b>${MEN.name}</b> · المستوى ${lv.n}: ${lv.title}<div class="small muted">مهمتك: ${lv.task}</div></div></div><div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 الدرس</button><button class="btn ghost sm" data-go="academy">🎓 الأكاديمية</button></div></div>`;
  return `<div class="card mentor" style="margin-top:12px"><div class="msay">${mentorAv()}<div><b>${MEN.name}</b> <span class="small muted">· المستوى ${lv.n} من ١٠: ${lv.icon} ${lv.title}</span><div class="bub">${mode === 'guide' ? lv.task : 'تذكّر: ' + lv.task}</div></div></div>${goalsHTML(lv)}<div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 اقرأ الدرس</button><button class="btn ghost sm" data-go="academy">🎓 الأكاديمية</button></div></div>`;
}
function mentorStrip() {
  const lv = S.learn && S.learn.char ? lvlOf() : null; if (!lv || lv.mode !== 'guide') return '';
  const nx = lv.goals(S).find(g => !g[1]); if (!nx) return '';
  return `<div class="mstrip">${mentorAv()}<span><b>${MEN.name}:</b> ${nx[0]}</span></div>`;
}
function screenAcademy() {
  const L = S.learn, ch = LSN.CHARS.find(c => c.id === L.char);
  let h = `<h2>🎓 الأكاديمية</h2><p class="muted">دروس التجارة التي علّمك إياها ${MEN.name}. كل درس من واقع الأسواق.</p>`;
  if (ch) h += `<div class="card"><div class="msay">${pic(ch.img, 'av', ch.name)}<div><b>${ch.name}</b> <span class="small muted">· ${ch.tag}</span><div class="small">${ch.perksText.join(' · ')}</div></div></div></div>`;
  h += `<h3 style="margin-top:16px">المستويات</h3><div class="grid g2">` + LSN.LEVELS.map(lv => {
    const st = L.level > lv.n ? 'done' : L.level === lv.n ? 'cur' : 'lock';
    return `<div class="card lv ${st}"><div class="row" style="margin:0"><span class="lnum">${st === 'lock' ? '🔒' : lv.icon}</span><b>${lv.n}. ${lv.title}</b>${st === 'done' ? '<span class="pill">✓ أُنجز</span>' : st === 'cur' ? '<span class="pill">الحالي</span>' : ''}</div>` + (st === 'lock' ? '<div class="small muted">يُفتح بإتمام الدرس السابق.</div>' : `<div class="small muted" style="margin:6px 0">${lv.task}</div>${st === 'cur' ? goalsHTML(lv) : ''}<button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 اقرأ الدرس</button>`) + `</div>`;
  }).join('') + `</div>` + storyBook() + zakatBook() + babBooks() + loreBooks() + `<h3 style="margin-top:16px">أسرار الدول</h3><div class="grid g3">` + E.COUNTRIES.map(ct => {
    const sc = LSN.SECRETS[ct.id]; if (!sc) return '';
    const open = L.secrets.includes(ct.id);
    return `<div class="card lv ${open ? 'done' : 'lock'}"><div class="row" style="margin:0"><span class="lnum">${open ? sc.icon : '🔒'}</span><b>${ct.flag} ${ct.name}</b></div>` + (open ? `<div class="small" style="margin:6px 0"><b>${sc.title}</b></div><div class="small muted">${sc.text}</div><div class="small" style="margin-top:6px">🎁 ${sc.perk}</div>` : '<div class="small muted">زر هذه الدولة لتكتشف سرّها.</div>') + `</div>`;
  }).join('') + `</div>`;
  return h;
}
function boot() {
  splash(); applyUi();
  try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel=manifest]')) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  try { const s = localStorage.getItem(KEY) || localStorage.getItem(KEY2); if (s) S = E.load(s); } catch (e) {}
  try { if (!S && localStorage.getItem('darb-v1')) oldSave = true; } catch (e) {}
  if (!S || !S.player) { let sd = (Date.now() % 100000) + 1; try { const q = new URLSearchParams(location.search).get('seed'); if (q) sd = +q || sd; } catch (e) {} S = E.newGame(sd); }
  S.tut = { on: false, i: 0, f: {} };
  sel = main().city; carSel = 1; estCity = sel; estC = S.cities[sel].country; empC = estC;
}

/* ---------- الوقت ---------- */
function setSpeed(n) { speed = n; clearInterval(timer); if (n) timer = setInterval(step, SPEEDS[n]); renderHeader(); renderAll(true); }
function step() {
  E.tick(S);
  if (S.pause) { speed = 0; clearInterval(timer); }
  if (S.day - lastSave >= 5) { persist(); lastSave = S.day; }
  renderAll(false);
}

/* ---------- التوجيه ---------- */
const SCREENS = [['home', '🏠', 'الرئيسية', 1], ['map', '🗺️', 'الخريطة', 1], ['market', '🏪', 'السوق', 1], ['caravan', '🐪', 'القافلة', 1], ['estate', '🏬', 'العقارات', 2], ['lords', '🤝', 'الزعماء', 1], ['empire', '🏛️', 'الإمبراطورية', 2], ['academy', '🎓', 'الأكاديمية', 1], ['cities', '🏙️', 'الدول والدفتر', 1, 'الدول']];
function go(s) {
  if (!SCREENS.some(x => x[0] === s)) s = 'home';
  if (s === 'market' && main().left === 0 && screen !== 'market') sel = main().city;
  screen = s; dg = null; prof = false; if (S.tut) { S.tut.f[s] = true; if (s === 'cities' && ct === 'fx') S.tut.f.fx = true; }
  if (location.hash !== '#' + s) { try { history.pushState(null, '', '#' + s); } catch (e) { location.hash = s; } }
  window.scrollTo(0, 0); renderAll(true);
}
window.addEventListener('popstate', () => { const h = location.hash.replace('#', ''); if (SCREENS.some(x => x[0] === h)) { screen = h; renderAll(true); } });

/* ---------- الرأس والتنقل ---------- */
function charImg() { const c = S.learn && S.learn.char; return (c && art('hero/c_' + c)) || art('hero/trader') || art('hero/c_trader'); }
const LV_SCREEN = ['market', 'market', 'map', 'map', 'market', 'cities', 'estate', 'lords', 'empire', 'cities'];
const hbar = f => `<i class="hb"><u style="width:${Math.max(3, Math.min(100, Math.round(f * 100)))}%"></u></i>`;
function renderHeader() {
  const w = S.player.wallet, L = S.learn, cr = main();
  $('hWallets').innerHTML = [['riyal', w.sar, 'ريال'], ['usd', w.usd, 'دولار'], ['goldbar', w.au, 'غ ذهب']].map(([icon, value, label]) => `<span class="wtile" title="${value.toLocaleString('en-US', { maximumFractionDigits: 3 })} ${label}">${uic(icon)}<b>${icon === 'usd' ? '$' : ''}${icon === 'goldbar' && Math.abs(value) < 10000 ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : hudFmt(value)}</b><small>${label}</small></span>`).join('');
  const ld = Math.round(E.loadOf(cr)), cap = E.capOfCar(cr);
  $('hLoad').innerHTML = `${uic('crate')}<b dir="ltr">${hudFmt(ld)}/${hudFmt(cap)}</b><small>الحمولة</small>`;
  $('hLoad').title = `حمولة القافلة: ${fmt(ld)} / ${fmt(cap)}`;
  const fdb = S.player.famDebt, hd = $('hDebt');
  if (hd) { if (fdb && fdb.left > 0 && L && L.char) { hd.hidden = false; hd.innerHTML = `<b>${fmt(Math.round(fdb.left))}</b><small>💳 الدَّين</small>${hbar(1 - fdb.left / fdb.amt0)}`; } else hd.hidden = true; }
  const Z = S.zakat, zb = Z && L && L.char ? E.zakatBase(S) : null, hw = $('hHawl');
  if (zb) {
    const left = Z.start != null ? Math.max(0, E.ZAKAT.HAWL - (S.day - Z.start)) : null;
    hw.className = 'hudt zk' + (Z.due ? ' due' : ''); hw.hidden = false;
    hw.innerHTML = Z.due ? `<b>مستحقة</b><small>🕌 الزكاة</small>${hbar(1)}` : left != null ? `<b>${left} يوم</b><small>🕌 الحول</small>${hbar(1 - left / E.ZAKAT.HAWL)}` : `<b>${Math.round(zb.base / zb.nisab * 100)}٪</b><small>🕌 من النصاب</small>${hbar(zb.base / zb.nisab)}`;
  } else hw.hidden = true;
  if (hd && !hd.hidden) { if (Z && Z.due) hd.hidden = true; else hw.hidden = true; }
  $('hLoad').classList.toggle('solo', (!hd || hd.hidden) && hw.hidden); // الخانة الخامسة: الدَّين، وتأخذها الزكاة حين تُستحق
  $('hDay').textContent = S.day;
  const nw = E.netWorth(S), TT = [0, 5000, 20000, 60000, 200000], ti = TT.filter(a => nw >= a).length - 1, PA = E.PHASE_AT, pi = PA.filter(a => nw >= a).length - 1;
  $('hTitle').textContent = E.titleOf(nw); $('hNW').textContent = hudFmt(nw);
  $('hNW').parentElement.parentElement.title = `الثروة: ${fmt(nw)} ريال`;
  $('hProg').style.width = (ti >= TT.length - 1 ? 100 : Math.max(4, Math.min(100, (nw - TT[ti]) / (TT[ti + 1] - TT[ti]) * 100))) + '%';
  $('hNwProg').style.width = (pi >= PA.length - 1 ? 100 : Math.max(4, Math.min(100, (nw - PA[pi]) / (PA[pi + 1] - PA[pi]) * 100))) + '%';
  const av = $('hAvatar'), lv = L && L.char ? lvlOf() : null, gl = lv ? lv.goals(S) : [], pr = gl.length ? Math.round(gl.filter(g => g[1]).length / gl.length * 100) : 100;
  const img = charImg(), key = (L && L.char || 'trader') + '|' + img.length + '|' + (L ? L.level : 0) + '|' + pr;
  if (av.dataset.k !== key) { av.dataset.k = key; av.innerHTML = `${img ? `<span class="face-crop"><img class="face" src="${img}" alt=""></span>` : '👤'}<i class="ring" style="--p:${pr}"></i>${L && L.char ? `<b class="lvl">${L.level > 10 ? '🎓' : L.level}</b>` : ''}`; }
  $('hRun').textContent = speed ? '▶ الوقت يمضي' : '⏸ الوقت متوقف'; $('hRun').classList.toggle('on', !!speed);
  [['bPause', 0], ['b1', 1], ['b2', 2], ['b3', 3]].forEach(([id, v]) => $(id).classList.toggle('on', speed === v));
}
const UIK = 'darb-ui'; let ui = { nav: false, top: false, full: false };
try { Object.assign(ui, JSON.parse(localStorage.getItem(UIK) || '{}')); } catch (e) {}
function applyUi() {
  document.body.classList.toggle('nav-off', !!ui.nav); document.body.classList.toggle('top-off', !!ui.top);
  const nt = $('navTog'), tt = $('topTog'); if (nt) { nt.textContent = ui.nav ? '☰' : '⌄'; nt.title = ui.nav ? 'فتح شريط القوائم' : 'طيّ شريط القوائم'; nt.setAttribute('aria-expanded', String(!ui.nav)); }
  if (tt) { tt.textContent = ui.top ? '⌄' : '⌃'; tt.title = ui.top ? 'فتح الشريط العلوي' : 'طيّ الشريط العلوي'; tt.setAttribute('aria-expanded', String(!ui.top)); }
  placeSpot();
}
function saveUi() { try { localStorage.setItem(UIK, JSON.stringify(ui)); } catch (e) {} applyUi(); }
const navIcon = (id, fallback) => ART['nav/' + id] ? `<img class="nav-icon" src="${ART['nav/' + id]}" alt="" draggable="false">` : fallback;
function renderNav() {
  $('nav').innerHTML = SCREENS.filter(x => x[0] !== 'academy').map(([id, ic, name, ph, short]) => `<button data-go="${id}" class="${screen === id ? 'on' : ''}" aria-label="${name}" title="${name}" ${screen === id ? 'aria-current="page"' : ''}><span class="ic" aria-hidden="true">${navIcon(id, ic)}</span><span class="nav-label"><span class="full">${name}</span><span class="short">${short || name}</span></span>${S.phase < ph ? '<span class="lk" aria-hidden="true">🔒</span>' : ''}${id === 'map' && main().left > 0 ? '<span class="dot" aria-hidden="true"></span>' : ''}</button>`).join('');
}
function journeyBar() {
  const cr = main(), mc = missionCard();
  if (cr.left <= 0 || screen === 'map') return mc;
  return mc + `<div class="card" style="margin-bottom:12px;padding:10px 14px"><div class="row" style="margin:0"><b>🐪 في الطريق إلى ${cityTag(cr.dest)}</b><span class="muted small">باقٍ ${cr.left} يوم</span><span class="spacer"></span>${speed ? '' : '<button class="sm pri" data-act="play">▶ شغّل الوقت</button>'}<button class="sm" data-go="map">شاهد الرحلة</button></div>${bar(cr.total - cr.left, cr.total, 'gold')}</div>`;
}

/* ---------- مشاهد SVG ---------- */
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function heroScene() {
  return `<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="610" cy="120" r="64" fill="#fff4cf" opacity=".92"/><circle cx="610" cy="120" r="92" fill="#fff4cf" opacity=".28"/><path d="M0 215 Q150 150 310 205 T620 195 T800 180 V300 H0Z" fill="var(--dune1)"/><path d="M0 262 Q200 205 400 250 T800 236 V300 H0Z" fill="var(--dune2)"/><g font-size="34" text-anchor="middle"><text x="330" y="244">🐪</text><text x="388" y="248">🐪</text><text x="446" y="244">🐪</text></g><g font-size="26"><text x="90" y="236">🌴</text><text x="700" y="226">🌴</text></g></svg>`;
}
const WALL = { sa: ['#e7d3a6', '#dcc592', '#efdcb5'], eg: ['#e9d9a9', '#d9c07e', '#f0e2b8'], ir: ['#9fc7d8', '#7fb0c8', '#c3dde8'], in: ['#f2b98a', '#e8a070', '#f7cfae'], cn: ['#d98c7a', '#c9705e', '#e8b0a2'] };
function cityScene(c) {
  const k = c.ev ? c.ev.k : '';
  const img = ART['city/' + c.id] || ART['scene/' + c.country];
  if (img) {
    const tint = { boom: '#e9b94955', festival: '#f3b6d255', plague: '#2f4a2a66', war: '#7a1f1466', bust: '#6b727a55' }[k] || '';
    return `<div class="cityimg"><img src="${img}" alt="${esc(c.name)}">${tint ? `<span class="tint" style="background:${tint}"></span>` : ''}<span class="cf">${CD[c.country].flag}</span><span class="cb">${k ? `<b class="evc">${EVN[k]}</b>` : ''}${c.owner ? '🏛️' : ''}${E.shopsOf(S, c.id).length ? '🏪' : ''}</span></div>`;
  }
  const sky = { boom: '#f6c667', festival: '#f3b6d2', plague: '#b9c4a2', war: '#d9867a', bust: '#c8cdd2' }[k] || 'var(--sky1)';
  let rn = hash(c.id); const rand = () => { rn = (Math.imul(rn, 1103515245) + 12345) >>> 0; return rn / 4294967296; };
  const cols = CD[c.country].mapPalette || WALL[c.country] || WALL.sa, pag = c.country === 'cn';
  let s = `<svg class="scene" viewBox="0 0 320 130" role="img" aria-label="${esc(c.name)}"><rect width="320" height="130" fill="${sky}"/><circle cx="${40 + (hash(c.id) % 200)}" cy="30" r="14" fill="#fff4cf" opacity=".9"/>`;
  if (COAST.has(c.id)) s += `<path d="M0 100 Q40 92 80 100 T160 100 T240 100 T320 100 V130 H0Z" fill="var(--sea)"/>`;
  s += `<rect y="96" width="320" height="34" fill="var(--dune2)"/>`;
  const n = Math.round(5 + c.size * 3 + (c.tier - 1) * 2);
  for (let i = 0; i < n; i++) {
    const w = 22 + rand() * 18, h = 26 + rand() * 40 * Math.min(1.4, c.size), x = 8 + i * (300 / n) + rand() * 6, col = cols[i % 3];
    s += `<rect x="${x.toFixed(1)}" y="${(96 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${col}" stroke="#6b5a3a" stroke-width="1.2"/>`;
    if (i % 3 === 0) s += pag ? `<path d="M${(x - 5).toFixed(1)} ${(96 - h + 4).toFixed(1)} L${(x + w / 2).toFixed(1)} ${(96 - h - 12).toFixed(1)} L${(x + w + 5).toFixed(1)} ${(96 - h + 4).toFixed(1)}z" fill="#8a2a1c" stroke="#5b1a10" stroke-width="1"/>` : `<path d="M${x.toFixed(1)} ${(96 - h).toFixed(1)} q${(w / 2).toFixed(1)} -${(w * 0.8).toFixed(1)} ${w.toFixed(1)} 0z" fill="#c9a96a" stroke="#6b5a3a" stroke-width="1.2"/>`;
    s += `<rect x="${(x + w / 2 - 2).toFixed(1)}" y="${(96 - h * 0.55).toFixed(1)}" width="4" height="8" rx="2" fill="#6b5a3a" opacity=".7"/>`;
  }
  if (k === 'festival') s += [30, 80, 130, 180, 230, 280].map((x, i) => `<path d="M${x} ${16 + i} l8 0 l-4 12z" fill="${['#d19a2a', '#b8402f', '#1f6f6b'][i % 3]}"/>`).join('');
  if (k === 'war') s += `<circle cx="250" cy="50" r="16" fill="#555" opacity=".55"/><circle cx="270" cy="36" r="12" fill="#555" opacity=".45"/>`;
  if (k === 'plague') s += `<rect width="320" height="130" fill="#2f4a2a" opacity=".18"/>`;
  s += `<text x="12" y="124" font-size="16">${CD[c.country].flag}</text><text x="300" y="124" font-size="16" text-anchor="end">${c.owner ? '🏛️' : ''}${E.shopsOf(S, c.id).length ? '🏪' : ''}</text></svg>`;
  return s;
}
function journeyScene(cr) {
  const t = (cr.total - cr.left) / Math.max(1, cr.total);
  return `<div class="journey" aria-label="رحلة القافلة"><svg viewBox="0 0 800 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="150" cy="70" r="40" fill="#fff4cf" opacity=".9"/><path d="M0 150 Q160 100 320 145 T640 140 T800 130 V220 H0Z" fill="var(--dune1)"/><path d="M0 190 Q200 150 400 185 T800 175 V220 H0Z" fill="var(--dune2)"/></svg><span class="jl" style="right:3%">${cityTag(cr.from)}</span><span class="jl" style="left:3%">${cityTag(cr.dest)}</span><div class="camelMove" style="right:${(7 + 86 * t).toFixed(1)}%"><span class="camel">🐪</span></div></div>`;
}

/* ---------- المعلومات والصفقات ---------- */
const hasShop = cid => E.hasPresence(S, cid);
function liveView(cid) { const c = main(); return (c.city === cid && c.left === 0) || hasShop(cid); }
function marketView(cid) {
  const c = S.cities[cid];
  if (liveView(cid)) { const p = {}, st = {}; GIDS.forEach(g => { p[g] = E.unitPrice(c, g); st[g] = c.stock[g]; }); return { p, st, age: 0 }; }
  const k = S.player.known[cid]; return { p: k.p, st: k.st, age: S.day - k.day };
}
const live0 = id => liveView(id);
function deals() {
  const cr = main(), here = cr.city, hv = marketView(here), out = [], hc = S.cities[here], P = S.player;
  const wheat = E.unitPrice(hc, 'wheat');
  GIDS.forEach(g => S.order.forEach(d => {
    if (d === here || !E.sells(hc, g)) return;
    const dv = marketView(d), dc = S.cities[d], cus = dc.country === hc.country ? 0 : CD[dc.country].customs;
    const net = dv.p[g] * (1 - dc.tax - cus) - hv.p[g] * 1.02, days = E.tripDays(S, cr, here, d);
    if (net <= 0) return;
    const prov = E.supplyNeed(cr, days) * wheat, reserve = prov * 1.25 + 10;
    const room = Math.floor((E.capOfCar(cr) - E.loadOf(cr)) / GD[g].w), afford = Math.floor(Math.max(0, P.gold - reserve) / (hv.p[g] * (1 + cus * 1.1)));
    const stk = Math.floor(hv.st[g] * 0.6), q0 = Math.min(room, afford, stk), lim = q0 === afford ? 'gold' : q0 === room ? 'room' : 'stock';
    if (q0 < 1) return;
    // أنسب كمية: الربح الفعلي يشمل انزلاق الشراء والبيع، فالأكبر ليس دائماً الأربح
    let best = null;
    [1, 0.7, 0.5, 0.35, 0.2, 0.1].forEach(f => {
      const q = Math.max(1, Math.floor(q0 * f)), qb = live0(here) ? E.quoteBuy(S, here, g, q, P.gold - reserve) : { n: q, avg: hv.p[g] * 1.01 };
      if (qb.n < 1) return;
      const so = E.sellOptions(S, here, g, qb.n, qb.avg, cr).find(o => o.city === d);
      if (so && (!best || so.profit > best.profit)) best = { q: qb.n, profit: so.profit };
    });
    if (best && best.profit > 0) out.push({ g, d, net, days, q: best.q, max: q0, lim, profit: best.profit, pd: best.profit / days, pct: best.profit / (best.q * hv.p[g]), cus });
  }));
  return out.sort((a, b) => b.pd - a.pd);
}
const QS = {};
const LIMNOTE = { gold: 'لا يكفي مبلغك لشراء كمية إضافية', room: 'قافلتك امتلأت: لا مكان لكمية إضافية', stock: 'نفد المتوفر في السوق: لا كمية إضافية' };
const clampQ = (v, mx) => Math.max(1, Math.min(Math.max(1, mx), Math.floor(+v) || 1));
function stepper(key, val, mx, extra) {
  return `<div class="qs"><button class="sm qb" data-act="qstep" data-k="${key}" data-d="-10" data-max="${mx}" ${val <= 1 ? 'disabled' : ''} aria-label="أنقص ١٠">−١٠</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="-1" data-max="${mx}" ${val <= 1 ? 'disabled' : ''} aria-label="أنقص">▼</button><input class="qin" type="number" inputmode="numeric" min="1" max="${mx}" value="${val}" data-act="qin" data-k="${key}" data-max="${mx}" aria-label="الكمية"><button class="sm qb" data-act="qstep" data-k="${key}" data-d="1" data-max="${mx}" ${val >= mx ? 'disabled' : ''} aria-label="زد">▲</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="10" data-max="${mx}" ${val >= mx ? 'disabled' : ''} aria-label="زد ١٠">+١٠</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="999999" data-max="${mx}" ${val >= mx ? 'disabled' : ''}>أقصى</button>${extra || ''}</div>`;
}
function dealCard(o, can) {
  const key = 'd:' + o.g + ':' + o.d, q = clampQ(QS[key] == null ? o.q : QS[key], o.max), m = main(), here = m.city;
  let est = '', warn = '';
  if (can) {
    const qb = live0(here) ? E.quoteBuy(S, here, o.g, q, S.player.gold) : null, so = qb && qb.n ? E.sellOptions(S, here, o.g, qb.n, qb.avg, m).find(x => x.city === o.d) : null;
    if (qb && qb.n) est = `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س${so ? ` · ربح متوقع <b class="${so.profit >= 0 ? 'cheap' : 'dear'} num">${so.profit >= 0 ? '+' : ''}${fmt(so.profit)}</b>` : ''}`;
    if (q >= o.max) warn = `<div class="qnote">${LIMNOTE[o.lim]}</div>`;
    else if (q !== o.q && so && so.profit < o.profit * 0.9) warn = `<div class="qnote soft">الكمية الأنسب ${o.q} (ربح ${fmt(o.profit)})</div>`;
  }
  return `<div class="card deal"><div class="row" style="margin:0"><span style="font-size:30px">${gi(o.g)}</span><div><b>${GD[o.g].name}</b> ← ${cityTag(o.d)}<div class="small muted">${o.days} أيام${o.cus ? ' · جمارك ' + Math.round(o.cus * 100) + '٪' : ''}</div></div></div>${can ? `<div class="small">اختر الكمية (الأنسب <b class="num">${o.q}</b> · الأقصى <b class="num">${o.max}</b>)</div>${stepper(key, q, o.max)}<div class="small">${est}</div>${warn}<button class="pri" data-act="dealgo" data-g="${o.g}" data-d="${o.d}" data-q="${q}" title="يشتري الكمية المختارة ثم يسافر">اشترِ ${q} وسافر</button>` : `<div class="small">تشتري <b class="num">${o.q}</b> وحدة (الأنسب) · ربح متوقع <b class="cheap num">+${fmt(o.profit)}</b></div>`}</div>`;
}
function guideHTML() {
  if (guideOff || S.tut) return '';
  const P = S.player, cr = main(), ld = E.loadOf(cr);
  let step, msg, btn = '';
  if (cr.left > 0) { step = 3; msg = `القافلة في الطريق إلى <b>${cityTag(cr.dest)}</b> (باقٍ ${cr.left} يوم). ${speed ? 'الوقت يمضي، انتظر الوصول.' : 'الوقت متوقف: اضغط ▶ ليمضي.'}`; btn = speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'; }
  else if (ld >= 1 && P.trips >= 1) { step = 4; msg = `وصلت إلى <b>${cityTag(cr.city)}</b>! بِع بضاعتك هنا.`; btn = '<button class="pri" data-act="sellall">💰 بِع كل البضاعة</button>'; }
  else if (ld >= 1) { step = 2; msg = `معك بضاعة. الآن <b>سافر</b> إلى مدينة أغلى: من الخريطة أو بزر «اشترِ وسافر» في السوق.`; btn = '<button class="pri" data-go="map">🗺️ افتح الخريطة</button>'; }
  else if (P.trips === 0) { step = 1; msg = `أنت في <b>${cityTag(cr.city)}</b> بـ ${fmt(P.gold)} ريال. <b>اشترِ</b> سلعة سعرها أخضر (رخيص) من السوق. ابدأ بمدن بلدك فهي أقرب وبلا جمارك.`; btn = screen === 'market' ? '' : '<button class="pri" data-go="market">🏪 اذهب إلى السوق</button>'; }
  else { step = 5; msg = `ثروتك الآن ${fmt(E.netWorth(S))}. كرّر: <b>اشترِ رخيصاً ← سافر ← بِع</b>. عند ثروة ${fmt(E.PHASE_AT[1])} يُفتح الطور ٢ (دكاكين ومخازن وقادة).`; }
  return `<div class="guide"><div class="row" style="margin:0">${av('official')}<b>الخطوة ${step} من ٥</b><span class="spacer"></span><button class="sm" data-act="guideoff" title="إخفاء الإرشاد">إخفاء</button></div><div style="margin:4px 0">${msg}</div>${btn}</div>`;
}

/* ---------- ١ الرئيسية ---------- */
const HB = ART['brand/cover'] || ART['scene/caravan'];
function screenHome() {
  const P = S.player, nw = E.netWorth(S), started = P.trips > 0 || S.day > 0, cr = main();
  const nextPh = S.phase < 4 ? E.PHASE_AT[S.phase] : null;
  const phNames = ['', 'تاجر متجول', 'الدكاكين والأسطول', 'التكامل الصناعي', 'الإمبراطورية المالية'];
  let h = `<section class="home-intro" aria-label="غلاف درب التجّار"><div class="home-brand"><h1>${ART['brand/wordmark'] ? `<img class="brand-wordmark" src="${ART['brand/wordmark']}" alt="درب التجّار">` : 'درب التجّار'}</h1><p>قافلة، وأسواق تتنفس، وإمبراطورية تمتد من مصر إلى الصين.</p></div><div class="hero">${HB ? `<img class="herobg" src="${HB}" alt="قافلة التاجر ومعالم دول التجارة">` : heroScene()}${HB ? '' : pic('hero/trader', 'trader', 'التاجر')}</div></section>`;
  if (oldSave) h = `<div class="guide" style="margin-bottom:12px">هذا إصدار جديد بعالم من خمس دول، ولا يقرأ حفظ الإصدار السابق. بدأت لك لعبة جديدة.</div>` + h;
  h += `<div class="grid g2" style="margin-top:12px"><div class="card"><h2>الحكاية</h2><p class="story">مات جدّك وترك لك قافلة صغيرة وثمانمئة ريال في ${esc(cityName(S.startCity || 'riyadh'))}. من هنا تبدأ دروب التجارة: بنجدٍ تمرٌ وقهوة، وبمصر قطنٌ وورق، وبفارس سجادٌ وزعفران، وبالهند توابلُ وأحجار، وبالصين حريرٌ وخزف. وعلى كل درب جمارك ولصوص وعواصف. اشترِ حيث الرخص، وبِع حيث الغلاء، ثم ابنِ دكاكين ومخازن ومصانع في مدن العالم… حتى يُقال عنك: <b>سيّد السوق</b>.</p><div class="row"><button class="pri big" data-go="${cr.left > 0 ? 'map' : 'market'}">${started ? '🐪 تابع الرحلة' : '🐪 ابدأ الرحلة'}</button><button data-go="map">🗺️ الخريطة</button></div></div>`;
  h += `<div class="card"><h2>حالتك</h2><div class="kv"><span>اللقب</span><b>${E.titleOf(nw)}</b></div><div class="kv"><span>اليوم</span><b class="num">${S.day}</b></div><div class="kv"><span>السيولة (ريال معادل)</span><b class="num">${fmt(P.gold)}</b></div><div class="kv"><span>🇸🇦 ريال · 💵 دولار · 🥇 ذهب</span><b class="num">${fmt(P.wallet.sar)} · $${fmt(P.wallet.usd)} · ${P.wallet.au.toFixed(2)}غ</b></div><div class="kv"><span>الثروة الصافية</span><b class="num">${fmt(nw)}</b></div><div class="kv"><span>الطور</span><b>${S.phase} · ${phNames[S.phase]}</b></div>${nextPh ? `<div class="small muted" style="margin-top:8px">الطور ${S.phase + 1} عند ثروة ${fmt(nextPh)}</div>${bar(nw, nextPh, 'gold')}` : '<p class="small">وصلت إلى آخر طور. لا نهاية للعبة.</p>'}</div></div>`;
  const g = guideHTML(); if (g) h += `<div style="margin-top:12px">${g}</div>`;
  h += mentorCard() + installCard();
  h += `<h2 style="margin-top:16px">كيف تلعب؟</h2><div class="grid g4">`;
  [['🛒', 'اشترِ', 'في «السوق» السعر الأخضر يعني رخيص. اشترِ منه.'], ['🧭', 'سافر', 'من «الخريطة» اختر مدينة غالية واضغط سافر.'], ['⏳', 'انتظر', 'يمضي الوقت وترى القافلة تتحرك. ⏸ يوقفه.'], ['💰', 'بِع', 'عند الوصول اضغط «بِع كل البضاعة». الفرق ربحك.']].forEach(([ic, t, d], i) => { h += `<div class="card step"><div class="n">${i + 1}</div><div><h3>${ic} ${t}</h3><div class="small muted">${d}</div></div></div>`; });
  h += `</div><h2 style="margin-top:16px">دول العالم</h2><div class="grid g3">` + E.COUNTRIES.map(ct => {
    const own = E.GOODS.filter(x => x.org && x.org.includes(ct.id));
    return `<div class="card"><div class="row" style="margin:0"><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">${citiesOf(ct.id).length} مدن</span><span class="pill">جمارك ${Math.round(ct.customs * 100)}٪</span></div><div class="small" style="margin-top:6px">تشتهر بـ: ${own.map(x => gi(x.id) + ' ' + x.name).join('، ')}</div></div>`;
  }).join('') + `</div><h2 style="margin-top:16px">نشرة اليوم</h2><div class="card">${S.news.slice(0, 4).map(n => `<div class="kv"><span class="${n.k === 'good' ? 'cheap' : n.k === 'bad' ? 'dear' : ''}">${esc(n.t)}</span><span class="muted small">يوم ${n.d}</span></div>`).join('')}</div>`;
  return h;
}

/* ---------- ٢ الخريطة ---------- */
function countryChips(cur, attr) { return `<div class="chips" style="margin-bottom:10px">${attr === 'data-mc' ? `<button ${attr}="all" class="${cur === 'all' ? 'on' : ''}">🌍 كل العالم</button>` : ''}${E.COUNTRIES.map(c => `<button ${attr}="${c.id}" class="${cur === c.id ? 'on' : ''}">${c.flag} ${c.name}</button>`).join('')}</div>`; }
function mapBox() {
  const all = mapC === 'all', CT = S.cities, ids = all ? S.order : citiesOf(mapC);
  const W = ($('mapbox') && $('mapbox').clientWidth) || Math.max(1, $('screen').clientWidth - (innerWidth >= 1000 ? 338 : 2));
  const height = W < 600 ? (all && mapView.zoom < 1.8 ? 260 : 340) : 450;
  mapBase = WM.extent(S.order.map(id => CT[id]), all ? null : mapC, W / height);
  const vb = mapVB = WM.viewport(mapBase, mapView.zoom, mapView.center), u = vb[2] / W;
  const overview = all && W < 600 && mapView.zoom < 1.8;
  const nar = W < 420, fsL = nar ? 11 : 12, fsC = nar ? 12 : 14;
  const nr = c => (overview ? 4 : (all ? 9 : 13) + c.size * .8 + (c.tier - 1)) * u;
  /* توزيع الأسماء دون تداخل: لكل مدينة عدّة مواضع مرشّحة (تحت/فوق/جنب)، يُختار أقلها تداخلاً مع أسماء ومدن أخرى */
  const rect = (x, y, w, h) => ({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 });
  const ov = (p, q) => Math.max(0, Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0)) * Math.max(0, Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0));
  const out = bx => (Math.max(0, vb[0] - bx.x0) + Math.max(0, bx.x1 - vb[0] - vb[2])) * (bx.y1 - bx.y0) + (Math.max(0, vb[1] - bx.y0) + Math.max(0, bx.y1 - vb[1] - vb[3])) * (bx.x1 - bx.x0);
  const nodeBox = {}; ids.forEach(id => { const c = CT[id], r = nr(c) + 2 * u; nodeBox[id] = rect(c.x, c.y, r * 2, r * 2); });
  const placed = [], lab = {}, cl = {};
  const score = (bx, own, k) => { let s = k * 0.01 * u * u + out(bx) * 30; placed.forEach(p => { s += ov(bx, p) * 3; }); ids.forEach(o => { s += ov(bx, nodeBox[o]) * (o === own ? 6 : 4); }); return s; };
  // أسماء الدول في مواضع هادئة ثابتة على الخريطة (تُحجَز أولاً فتتجنبها أسماء المدن)
  E.COUNTRIES.forEach(ct => {
    if (!all && ct.id !== mapC) return;
    const cs = citiesOf(ct.id).map(id => CT[id]); if (!cs.length) return;
    const anchor = ct.mapLabel || [cs.reduce((s, c) => s + c.x, 0) / cs.length, Math.max(...cs.map(c => c.y)) + 40];
    const hw = (ct.name.length * fsC * 0.30 + 15) * u, hh = (fsC + 8) * u, a = all ? anchor : [vb[0] + vb[2] / 2, vb[1] + hh];
    const bx = rect(a[0], a[1], hw * 2, hh); placed.push(bx); cl[ct.id] = { x: a[0], y: a[1] };
  });
  const cands = (c, hw, hh, r, g) => { const dv = r + g + hh / 2, dh = r + g + hw, o = []; [0, 1, 2].forEach(m => [1, -1].forEach(s => [0, .75, -.75, 1.5, -1.5].forEach(k => o.push([k * hw, s * (dv + m * (hh + g))])))); [0, 1, -1].forEach(k => [1, -1].forEach(s => o.push([s * dh, k * (hh + g)]))); return o; };
  const geo = {}; ids.forEach(id => { const c = CT[id], r = nr(c); geo[id] = { c, r, hw: (c.name.length * fsL * 0.36 + 9) * u, hh: (fsL + 9) * u, g: 3 * u }; });
  // خط ربط الاسم بمدينته: يُمنع تقاطع خطّين (يمنع أن يبدو اسم تابعاً لمدينة مجاورة)
  const lead = (c, bx) => ({ x1: c.x, y1: c.y, x2: Math.max(bx.x0, Math.min(c.x, bx.x1)), y2: Math.max(bx.y0, Math.min(c.y, bx.y1)) });
  const ccw = (ax, ay, bx, by, cx, cy) => (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
  const cross = (p, q) => ccw(p.x1, p.y1, q.x1, q.y1, q.x2, q.y2) !== ccw(p.x2, p.y2, q.x1, q.y1, q.x2, q.y2) && ccw(p.x1, p.y1, p.x2, p.y2, q.x1, q.y1) !== ccw(p.x1, p.y1, p.x2, p.y2, q.x2, q.y2);
  const pick = id => { const { c, r, hw, hh, g } = geo[id]; let best = null; cands(c, hw, hh, r, g).forEach(([dx, dy], k) => { const bx = rect(c.x + dx, c.y + dy, hw * 2, hh), ld = lead(c, bx); let s = score(bx, id, k + Math.hypot(dx, dy) / u * .2); ids.forEach(o => { if (o !== id && lab[o] && cross(ld, lab[o].ld)) s += 6000 * u * u; }); if (!best || s < best.s) best = { s, bx, dx, dy, ld }; }); lab[id] = { x: c.x + best.dx, y: c.y + best.dy, hw, hh, up: best.dy < 0, bx: best.bx, ld: best.ld }; placed.push(best.bx); };
  const ord = (overview ? [] : ids.slice()).sort((p, q) => CT[q].size - CT[p].size);
  ord.forEach(pick);
  for (let pass = 0; pass < 4; pass++) ord.forEach(id => { const i = placed.indexOf(lab[id].bx); if (i >= 0) placed.splice(i, 1); pick(id); });
  let h = `<defs><pattern id="map-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#f6dfaa" stroke-opacity=".1" stroke-width="${u}"/></pattern></defs><rect x="${mapBase[0]}" y="${mapBase[1]}" width="${mapBase[2]}" height="${mapBase[3]}" fill="#6d8d95"/>`;
  WM.tiles.forEach(t => { if (ART[t.art]) h += `<image href="${ART[t.art]}" x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" preserveAspectRatio="none"/>`; });
  h += `<rect x="${mapBase[0]}" y="${mapBase[1]}" width="${mapBase[2]}" height="${mapBase[3]}" fill="url(#map-grid)" pointer-events="none"/>`;
  WM.roads(S.order.map(id => CT[id]), E.ADJ).forEach(({a, b, border}) => {
    if (!all && a.country !== mapC && b.country !== mapC) return;
    const risk = S.risk[E.riskKey(a.id, b.id)] || 0;
    h += `<line class="map-road" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${risk > .1 ? '#a83f2c' : border ? '#f7e1ab' : '#765530'}" stroke-width="${(1.6 * u).toFixed(1)}" ${border ? `stroke-dasharray="${6*u} ${5*u}"` : ''} opacity="${overview ? '.45' : '.8'}"/>`;
  });
  const cr = main(), routeTo = cr.left > 0 ? cr.dest : sel, routeFrom = cr.left > 0 ? cr.from : cr.city;
  if (routeTo !== routeFrom && CT[routeTo] && CT[routeFrom]) {
    const a = CT[routeFrom], b = CT[routeTo];
    h += `<line class="map-route" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff5d2" stroke-width="${6*u}" opacity=".7"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#476b7e" stroke-width="${3*u}" stroke-dasharray="${8*u} ${5*u}"/>`;
  }
  E.COUNTRIES.forEach(ct => { const p = cl[ct.id]; if (!p) return; h += `<g data-mc="${ct.id}" role="button" tabindex="0" aria-label="استكشف ${ct.name}" class="map-country"><rect x="${p.x-(ct.name.length*fsC*.30+15)*u}" y="${p.y-(fsC+8)*u/2}" width="${(ct.name.length*fsC*.30+15)*2*u}" height="${(fsC+8)*u}" rx="${5*u}" fill="#e8eff3f5" stroke="#cfac69" stroke-width="${u}"/><text x="${p.x.toFixed(1)}" y="${(p.y + fsC * .35 * u).toFixed(1)}" text-anchor="middle" font-size="${(fsC * u).toFixed(1)}" font-weight="700" fill="#304f60" pointer-events="none">${ct.flag} ${ct.name}</text></g>`; });
  ids.forEach(id => {
    const c = CT[id], r = nr(c), ev = c.ev ? c.ev.k : '', ct = CD[c.country], L = lab[id];
    const glow = evGood(ev) ? '#d19a2a' : ev ? '#b8402f' : '';
    if (overview) {
      h += `<g data-city="${id}" role="button" tabindex="0" aria-label="${esc(c.name)}"><circle cx="${c.x}" cy="${c.y}" r="${10*u}" fill="transparent"/><circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${id === sel ? '#fff5d2' : '#476b7e'}" stroke="${id === sel ? '#a47419' : '#f6deae'}" stroke-width="${1.5*u}"/><title>${esc(c.name)}</title></g>`; return;
    }
    if (glow) h += `<circle cx="${c.x}" cy="${c.y}" r="${(r + 6 * u).toFixed(1)}" fill="${glow}" opacity=".45"/>`;
    h += `<g data-city="${id}" style="cursor:pointer" role="button" tabindex="0" aria-label="${esc(c.name)}${ev ? ' — ' + EVN[ev] : ''}">${(() => { const nx = Math.max(L.x - L.hw, Math.min(c.x, L.x + L.hw)), ny = Math.max(L.y - L.hh / 2, Math.min(c.y, L.y + L.hh / 2)); return Math.hypot(nx - c.x, ny - c.y) > r + 2 * u ? `<line x1="${c.x}" y1="${c.y}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${ct.color}" stroke-width="${(1.6 * u).toFixed(1)}" opacity=".95"/>` : ''; })()}<circle cx="${c.x}" cy="${c.y + u}" r="${(r + u).toFixed(1)}" fill="#173e37" opacity=".2"/><circle cx="${c.x}" cy="${c.y}" r="${r.toFixed(1)}" fill="#fff8e6" stroke="${sel === id ? '#a97920' : '#406f60'}" stroke-width="${((sel === id ? 2.4 : 1.5) * u).toFixed(1)}"/>`;
    const marker = c.owner ? 'fort' : hasShop(id) ? 'market' : 'city';
    h += `<image data-map-art="${marker}" href="${ART['map/'+marker]}" x="${c.x-r}" y="${c.y-r}" width="${r*2}" height="${r*2}" pointer-events="none"/>`;
    h += `<rect x="${(L.x - L.hw).toFixed(1)}" y="${(L.y - L.hh / 2).toFixed(1)}" width="${(L.hw * 2).toFixed(1)}" height="${L.hh.toFixed(1)}" rx="${(5 * u).toFixed(1)}" fill="${sel === id ? '#f7e5b7' : '#fff9e9f2'}" stroke="${sel === id ? '#9b7027' : '#b89c69'}" stroke-width="${u.toFixed(1)}"/><text x="${L.x.toFixed(1)}" y="${(L.y + fsL * .36 * u).toFixed(1)}" text-anchor="middle" font-size="${(fsL * u).toFixed(1)}" font-weight="700" fill="#263a31" pointer-events="none">${esc(c.name)}</text>`;
    if (ev) h += `<text x="${c.x}" y="${(L.up ? c.y + r + 12 * u : c.y - r - 4 * u).toFixed(1)}" text-anchor="middle" font-size="${(10 * u).toFixed(1)}" fill="${glow}" font-weight="700" stroke="#0a1418" stroke-width="${(2.4 * u).toFixed(1)}" paint-order="stroke" pointer-events="none">${EVN[ev]}</text>`;
    h += `</g>`;
  });
  const pos = (from, to, left, total) => { const a = CT[from], b = CT[to], t = 1 - left / Math.max(1, total); return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t]; };
  S.agents.forEach(a => { if (a.left > 0 && a.dest) { const [x, y] = pos(a.from, a.dest, a.left, a.total || a.left); h += `<circle cx="${x}" cy="${y}" r="${(2.6 * u).toFixed(1)}" fill="#6d6757" opacity=".8" pointer-events="none"/>`; } });
  S.player.caravans.forEach(c => {
    const here = CT[c.city]; let x, y;
    if (c.left > 0) [x, y] = pos(c.from, c.dest, c.left, c.total);
    else { x = here.x + (c.main ? -(nr(here) + 22 * u) : (nr(here) + 18 * u + 6 * (c.id % 7) * u)); y = here.y - nr(here) * .6; }
    const r = (c.main ? 19 : 13) * u;
    h += `<g class="map-caravan" data-caravan="${c.id}" role="img" aria-label="${c.main ? 'قافلتي' : 'قافلة تجارية'}${c.left > 0 ? ' في الطريق إلى '+esc(cityName(c.dest)) : ' في '+esc(cityName(c.city))}" pointer-events="none"><circle cx="${x}" cy="${y+u}" r="${r+u}" fill="#153f39" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff8e6" stroke="${c.main ? '#476b7e' : '#a98d4e'}" stroke-width="${2*u}"/><image data-map-art="caravan" href="${ART['map/caravan']}" x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}"/></g>`;
  });
  return `<svg id="map" style="height:${height}px" viewBox="${vb.map(v => v.toFixed(1)).join(' ')}" direction="ltr" role="group" tabindex="0" aria-label="خريطة دروب التجارة؛ استخدم الأسهم للتحريك بعد التقريب">${h}</svg>`;
}
function cityPanel() {
  const c = S.cities[sel], cr = main(), v = marketView(sel), here = cr.city === sel && cr.left === 0, ct = CD[c.country];
  const lst = GIDS.map(g => ({ g, r: v.p[g] / E.refPrice(c, g) })).sort((a, b) => a.r - b.r);
  const cheap = lst.slice(0, 2), dear = lst.slice(-2).reverse();
  let h = `<div class="card citycard">${cityScene(c)}<div class="row" style="margin:0"><span class="title" style="margin:0">${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">سكان ${fmt(E.popTotal(c))}</span>${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]} · ${c.ev.left} يوم</span>` : ''}</div>`;
  h += `<div class="small muted" style="margin:6px 0">${liveView(sel) ? 'أسعار حيّة' : 'معلومات قبل ' + v.age + ' يوم'} · ${E.shopsOf(S, sel).length ? '🏪 ' + E.shopsOf(S, sel).length + ' دكان · 📦 ' + E.whsOf(S, sel) + ' مخزن' : 'لا عقارات لك هنا'}</div>`;
  h += `<div class="kv"><span>الأرخص نسبياً</span><span class="cheap">${cheap.map(x => gi(x.g) + ' ' + GD[x.g].name).join(' · ')}</span></div><div class="kv"><span>الأغلى نسبياً</span><span class="dear">${dear.map(x => gi(x.g) + ' ' + GD[x.g].name).join(' · ')}</span></div>`;
  if (cr.left > 0) h += `<p class="small muted">قافلتك في الطريق.</p>`;
  else if (here) h += `<p><b>أنت هنا.</b></p><div class="row"><button class="pri" data-go="market">🏪 افتح السوق</button><button data-act="estcity" data-c="${sel}">🏬 العقارات</button></div>`;
  else {
    const dd = E.tripDays(S, cr, cr.city, sel), need = E.supplyNeed(cr, dd), pc = need * E.unitPrice(S.cities[cr.city], 'wheat'), rk = S.risk[E.riskKey(cr.city, sel)], cus = S.cities[cr.city].country === c.country ? 0 : ct.customs;
    h += `<div class="kv"><span>المدة</span><b class="num">${dd} أيام</b></div><div class="kv"><span>المؤن</span><b class="num">≈ ${fmt(pc)}</b></div><div class="kv"><span>خطر اللصوص</span><b class="num ${rk > 0.1 ? 'dear' : ''}">${Math.round(rk * 100)}٪</b></div>${cus ? `<div class="kv"><span>جمارك ${ct.name}</span><b class="num dear">${Math.round(cus * 100)}٪ من قيمة الحمولة</b></div>` : ''}`;
    h += `<div class="row"><button class="pri big" data-act="go" data-to="${sel}">🐪 سافر إلى ${esc(c.name)}</button></div>`;
  }
  return h + `</div>`;
}
function screenMap() {
  const cr = main(); let h = '';
  const g = guideHTML(); if (g) h += `<div style="margin-bottom:12px">${g}</div>`;
  if (cr.left > 0) h += `<div class="card" style="margin-bottom:12px"><div class="row" style="margin:0"><b>🐪 في الطريق إلى ${cityTag(cr.dest)}</b><span class="muted">باقٍ ${cr.left} من ${cr.total} يوم</span><span class="spacer"></span>${speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'}</div>${journeyScene(cr)}${bar(cr.total - cr.left, cr.total, 'gold')}</div>`;
  h += `<div class="map-layout"><section class="map-atlas" aria-label="أطلس التجارة"><div class="map-heading"><div><small>أطلس التاجر</small><h2>دروب التجارة</h2></div><small>${E.COUNTRIES.length} دول · ${S.order.length} مدينة</small></div><div class="map-toolbar"><button data-act="maphere">🐪 موقع قافلتي</button><span class="spacer"></span><button data-act="mapzoom" data-d="1" aria-label="تقريب الخريطة" ${mapView.zoom >= 4 ? 'disabled' : ''}>＋</button><output aria-label="مستوى التقريب">${Math.round(mapView.zoom * 100)}٪</output><button data-act="mapzoom" data-d="-1" aria-label="إبعاد الخريطة" ${mapView.zoom <= 1 ? 'disabled' : ''}>−</button><button data-act="mapreset" aria-label="إعادة ضبط عرض الخريطة">↺</button></div><div class="map-filters">${countryChips(mapC, 'data-mc')}</div><div id="mapbox">${mapBox()}<div class="map-compass" role="img" aria-label="اتجاه الشمال"><span>شمال</span><img src="${ART['map/compass']}" alt="" draggable="false"></div></div><div class="map-legend"><span><i></i>درب محلي</span><span><i class="border"></i>درب بين الدول</span><span><i class="route"></i>${cr.left > 0 ? 'رحلتي الحالية' : 'المسار المختار'}</span><span><i class="risk"></i>خطر مرتفع</span></div><p class="map-caption">اختر دولة لاستكشاف مدنها، أو اضغط مدينة لعرض السوق والرحلة. قرّب واسحب لاستكشاف التفاصيل.</p><details class="map-cities" ${(mapListOpen[mapC] ?? (mapC !== 'all')) ? 'open' : ''}><summary>مدن ${mapC === 'all' ? 'العالم' : CD[mapC].name}</summary><div class="chips">${(mapC === 'all' ? S.order : citiesOf(mapC)).map(id => `<button data-city="${id}" class="${sel === id ? 'on' : ''}">${id === cr.city ? '🐪 ' : ''}${esc(cityName(id))}</button>`).join('')}</div></details></section><aside class="map-panel" aria-label="المدينة والرحلة">${cityPanel()}</aside></div>`;
  return h;
}

/* ---------- ٣ السوق ---------- */
const tierName = t => (t === 'raw' ? 'خام' : t === 'spec' ? 'تخصصية' : 'مصنّعة');
function capStrip(mi, c) {
  const m = mi.all;
  return `<div class="sumbar"><div class="m"><div class="small muted">🐪 قافلتي</div><b class="num">${fmt(mi.carLoad)} / ${fmt(mi.carCap)}</b>${bar(mi.carLoad, mi.carCap, mi.carRoom < mi.carCap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.carRoom)} وزن</div></div>
  <div class="m"><div class="small muted">📦 مخزني في ${esc(c.name)}</div>${mi.store.has ? `<b class="num">${fmt(mi.store.load)} / ${fmt(mi.store.cap)}</b>${bar(mi.store.load, Math.max(1, mi.store.cap), mi.store.free < mi.store.cap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.store.free)} وزن</div>` : '<b>لا مخزن هنا</b><div class="small muted">ابنِ دكاناً ثم مخزناً من «العقارات»</div>'}</div>
  <div class="m"><div class="small muted">🏬 كل مخازني</div><b class="num">${fmt(m.load)} / ${fmt(m.cap)}</b>${bar(m.load, Math.max(1, m.cap))}<div class="small muted">${m.rows.length} مدينة · فارغ ${fmt(m.free)}</div></div>
  <div class="m"><div class="small muted">💰 رصيدك</div><b class="num">${fmt(S.player.gold)} ريال</b><div class="small muted">${fmt(S.player.wallet.sar)} ر.س · $${fmt(S.player.wallet.usd)} · ${S.player.wallet.au.toFixed(2)}غ</div></div></div>`;
}
const priceTag = r => r < 0.85 ? `<span class="pt g">🟢 فرصة شراء — أرخص بـ${Math.round((1 - r) * 100)}٪</span>` : r > 1.15 ? `<span class="pt r">🔴 غالية — لا تشترِ (أغلى بـ${Math.round((r - 1) * 100)}٪)</span>` : '<span class="pt n">⚪ سعر عادي</span>';
const refBar = r => `<i class="refbar" title="موضع السعر بالنسبة للمرجعي"><b style="inset-inline-start:${Math.round(Math.max(0, Math.min(1, (r - 0.6) / 0.8)) * 100)}%"></b></i>`;
const refLine = (ref, price, r) => `<div class="refline">السعر المرجعي (العادي): <b>${f1(ref)}</b> · اليوم: <b class="${r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : ''}">${f1(price)}</b></div><div>${priceTag(r)}</div>${refBar(r)}`;
const helpBtn = '<button class="helpbtn" data-act="help" aria-label="شرح مبسّط">؟</button>';
function helpHTML() {
  const c = S.cities[main().city], g = cheapestGood() || 'dates', price = E.unitPrice(c, g), ref = E.refPrice(c, g), r = price / ref;
  return `<div class="lbox"><div class="lhead"><span class="lnum">📘</span><div><div class="small muted">شرح مبسّط</div><h2 style="margin:0">دليل الأسعار والربح</h2></div></div>
  ${mentorSay('هذه أهم كلمتين في التجارة يا ولدي، وسأشرحهما بأبسط ما أستطيع.', 'teach')}
  <div class="card"><b>💰 السعر المرجعي</b><p>هو <b>السعر العادي الأساسي</b> للسلعة في السوق، السعر الذي يُفترض أن تُشترى به. مثال من سوقك: ${GD[g].name} مرجعيها ${f1(ref)} ريال، واليوم سعرها ${f1(price)} ريال.</p></div>
  <div class="card"><b>🟢🔴 الألوان</b><p>🟢 <b>خضراء</b>: أرخص من المرجعي بـ١٥٪ فأكثر → فرصة، اشترِ.<br>⚪ <b>عادية</b>: قريبة من المرجعي.<br>🔴 <b>حمراء</b>: أغلى منه بـ١٥٪ فأكثر → لا تشترِ.</p><p class="small muted">الآن ${GD[g].name}: ${priceTag(r)}</p></div>
  <div class="card"><b>📈 هامش الربح</b><p>يجيب عن سؤال واحد: <b>لكل ١٠٠ ريال تدفعها، كم تربح؟</b> إن اشتريت بـ١٠٠ وبعت بـ١٢٠ فربحك ٢٠، وهامشك ٢٠٪. كلما كبر الهامش كانت الصفقة أحسن، وأقل ما أنصحك به ١٥٪.</p></div>
  <div class="card"><b>🧾 المصاريف</b><p>المؤن والضريبة والجمارك تُخصم من ربحك، واللعبة تحسبها لك داخل «الربح المتوقع» فلا تنسَها.</p></div>
  <div class="card"><b>✅ القاعدة الذهبية</b><p>اشترِ حين تكون السلعة خضراء، وبِعها في سوق سعرها فيه أعلى، بهامش ١٥٪ فأكثر.</p></div>
  <button class="btn" data-act="lclose">فهمت</button></div>`;
}
function screenMarket() {
  const cr = main(), c = S.cities[sel], v = marketView(sel), live = liveView(sel), ct = CD[c.country];
  const atHere = cr.city === sel && cr.left === 0, ld = E.loadOf(cr);
  const mi = live ? E.marketInfo(S, sel, 1) : null, byG = {}; if (mi) mi.goods.forEach(x => byG[x.g] = x);
  let h = `${pic(ART['city/' + c.id] ? 'city/' + c.id : 'scene/' + c.country, 'banner', c.name)}<div class="row" style="margin-top:0"><span class="title" style="margin:0">${ART['hero/' + c.country] ? av(c.country) : ''}🏪 سوق ${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">رتبة ${c.tier}</span><span class="pill">يتعامل بـ ${E.curOf(c.country) === 'sar' ? 'الريال' : 'الدولار'}</span><span class="pill">ضريبة ${Math.round((c.tax + (atHere ? 0.05 * Math.min(1, E.netWorth(S) / 200000) : 0)) * 100)}٪</span>${live ? '<span class="pill good">أسعار حيّة</span>' : `<span class="pill bad">آخر زيارة قبل ${v.age} يوم</span>`}${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]} · ${c.ev.left} يوم</span>` : ''}<span class="spacer"></span><label class="small"><input type="checkbox" id="pctBox" ${pct ? 'checked' : ''}> عرض النسبة من المرجع</label></div>`;
  h += E.COUNTRIES.map(k => `<div class="chips" style="margin-bottom:6px"><span class="cn">${k.flag}</span>${citiesOf(k.id).map(id => `<button data-city="${id}" class="${id === sel ? 'on' : ''}">${id === cr.city ? '🐪 ' : ''}${esc(cityName(id))}</button>`).join('')}</div>`).join('');
  const g = guideHTML(); if (g) h += `<div style="margin:10px 0">${g}</div>`;
  h += bossStrip(c);
  // ملخص السوق عند الدخول
  if (mi) {
    h += `<div class="card" style="margin:10px 0"><h2>ماذا في سوق ${esc(c.name)}؟</h2><div class="row" style="margin-top:0"><span class="pill good">متوفر ${mi.present} من ${mi.total} سلعة</span>${mi.missing.length ? `<span class="pill bad">غير متوفر: ${mi.missing.map(x => gi(x) + ' ' + GD[x].name).join('، ')}</span>` : ''}</div>${capStrip(mi, c)}${atHere ? '' : '<p class="small muted" style="margin-bottom:0">هذه معلومات حيّة لأن لك عقاراً هنا. للتداول يجب أن تكون القافلة في المدينة.</p>'}</div>`;
  } else {
    h += `<div class="card" style="margin:10px 0"><h2>سوق ${esc(c.name)}</h2><p class="small muted" style="margin:0">معلوماتك عن هذا السوق قبل ${v.age} يوم. لترى ما فيه وما تستطيع أخذه وهل تكفي مخازنك، يجب أن تدخله بقافلتك أو أن تبني فيه دكاناً.</p></div>`;
  }
  if (cr.left > 0) h += `<div class="card" style="margin-bottom:12px">القافلة في الطريق إلى ${cityTag(cr.dest)}.</div>`;
  else if (atHere && ld >= 1) { const worth = Object.keys(cr.cargo).reduce((a, k) => a + (cr.cargo[k] >= 1 ? E.quoteSell(S, sel, k, cr.cargo[k], 1).net : 0), 0), cost = Object.keys(cr.basis || {}).reduce((a, k) => a + cr.basis[k].c, 0); h += `<div class="card" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>معك بضاعة صافي بيعها هنا <b class="num">${fmt(worth)}</b> ر.س مقابل تكلفتها <b class="num">${fmt(cost)}</b> ← <b class="pl ${plCls(worth - cost)} num">${sgn(worth - cost)} ر.س</b></span><span class="spacer"></span><button class="pri big" data-act="sellall">💰 بِع كل البضاعة هنا</button></div>`; }
  else if (!atHere) {
    const dd = E.tripDays(S, cr, cr.city, sel), rk = S.risk[E.riskKey(cr.city, sel)], cus = S.cities[cr.city].country === c.country ? 0 : ct.customs;
    h += `<div class="card" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>قافلتك في <b>${cityTag(cr.city)}</b>. للتداول هنا عليك السفر.</span><span class="spacer"></span><button class="pri big" data-act="go" data-to="${sel}">🐪 سافر إلى ${esc(c.name)} (${dd} أيام · خطر ${Math.round(rk * 100)}٪${cus ? ' · جمارك ' + Math.round(cus * 100) + '٪' : ''})</button></div>`;
  }
  if (cr.left === 0) { const top = deals().slice(0, 3); if (top.length) h += `<h2>أفضل الصفقات من ${cityTag(cr.city)} ${helpBtn}</h2><div class="grid g3" style="margin-bottom:14px">${top.map(o => dealCard(o, true)).join('')}</div>`; }
  h += `<h2>السلع ${helpBtn} <span class="small muted">اضغط على سلعة لترى كل تفاصيلها وأين تربح منها</span></h2><div class="chips tierchips">${[['all', 'الكل'], ['here', 'من ' + ct.name], ['raw', 'خام'], ['spec', 'تخصصية'], ['proc', 'مصنّعة']].map(([id, n]) => `<button data-mf="${id}" class="${mf === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="grid g3">`;
  const soldHere = gd => E.sells(c, gd), shownG = GIDS.filter(gd => soldHere(gd) || Math.floor(cr.cargo[gd] || 0) >= 1);
  shownG.filter(gd => mf === 'all' || (mf === 'here' ? (GD[gd].org || []).includes(c.country) : GD[gd].tier === mf)).forEach(gd => {
    const G = GD[gd], x = byG[gd], price = v.p[gd], r = price / E.refPrice(c, gd), have = Math.floor(cr.cargo[gd] || 0), cls = r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : '';
    const badge = r < 0.85 ? `<span class="pill good">${uic('cheap')}رخيص</span>` : r > 1.15 ? `<span class="pill bad">${uic('dear')}غالٍ</span>` : '<span class="pill">عادي</span>';
    const sold = soldHere(gd), stock = sold ? Math.floor(v.st[gd]) : 0, none = stock < 1;
    h += `<div class="card gcard ${none ? 'locked' : r < 0.85 ? 'cheapc' : r > 1.15 ? 'dearc' : ''}" data-gd="${gd}"><div class="top"><span class="ic">${gi(G.id)}</span><div style="flex:1"><b>${G.name}</b> ${badge}<div class="small muted">${G.org ? 'منشأ: ' + G.org.map(o => CD[o].flag).join('') : 'خام عام'} · ${tierName(G.tier)}</div><div class="price ${cls}">${pct ? Math.round(r * 100) + '٪' : pr(price, c.country)}</div></div><span class="muted">${spark(S.hist.px[sel] && S.hist.px[sel][gd], 56, 22)}</span></div>`;
    h += sold ? `<div class="small">${none ? '<span class="dear">نفد من هذا السوق</span>' : 'متوفر <b class="num">' + fmt(stock) + '</b> وحدة'}</div>${bar(v.st[gd], E.capG(c, gd), r < 0.85 ? '' : r > 1.15 ? 'red' : 'gold')}` : `<div class="small"><span class="pill">بيع فقط</span> <span class="muted">لا تُباع هنا. تُشترى من: ${E.soldAt(S, gd).slice(0, 4).map(id => CD[S.cities[id].country].flag + ' ' + esc(S.cities[id].name)).join('، ')}</span></div>`;
    if (sold) h += refLine(E.refPrice(c, gd), price, r);
    if (x && !none) {
      const why = { gold: 'رصيدك', room: 'حمولة القافلة', stock: 'المتوفر في السوق' }[x.limit];
      h += `<div class="take">أقدر آخذ <b class="num">${fmt(x.canCar)}</b> <span class="muted">(الحدّ: ${why})</span></div><div class="fitrow"><span class="fit ${x.fitsCar ? 'ok' : 'no'}">${x.fitsCar ? '✓ تكفي قافلتي' : '✗ قافلتي تتسع ' + fmt(x.carU)}</span><span class="fit ${x.fitsStore ? 'ok' : 'no'}">${mi.store.has ? (x.fitsStore ? '✓ يكفي مخزني' : '✗ مخزني يتسع ' + fmt(x.storeU)) : '✗ لا مخزن'}</span></div>`;
    }
    if (have && live) { const q = E.quoteSell(S, sel, gd, have, 1), cost = x && x.avg != null ? x.avg * have : 0, pl = q.net - cost; h += `<div class="small">معك <b>${have}</b>${x && x.avg != null ? ' · تكلفتك ' + f1(x.avg) + ' للوحدة' : ''} · لو بعت هنا <b class="pl ${plCls(pl)} num">${sgn(pl)} ر.س</b></div>`; }
    else if (have) h += `<div class="small">معك <b>${have}</b></div>`;
    if (atHere) h += `${buyRow(gd, x, none)}${sellRow(gd, have, live)}`; else if (sold && S.phase >= E.AGENT_PHASE) h += agentRow(gd);
    h += `</div>`;
  });
  return h + `</div>`;
}

function sellRow(gd, have, live) {
  if (have < 1) return `<div class="btns"><span class="lb">بِع</span><span class="small muted">لا تملك منها شيئاً</span></div>`;
  const key = 's:' + gd, q = clampQ(QS[key] == null ? 1 : QS[key], have), qs = live ? E.quoteSell(S, sel, gd, q, 1) : null, avg = E.avgCost(main().basis, gd);
  const pl = qs && avg != null ? qs.net - avg * q : null;
  return `<div class="btns"><span class="lb">بِع</span></div>${stepper(key, q, have)}<div class="small">${qs ? `صافي ≈ <b class="num">${fmt(qs.net)}</b> ر.س${pl != null ? ` · <b class="pl ${plCls(pl)} num">${sgn(pl)}</b>` : ''}` : ''}</div>${q >= have ? '<div class="qnote soft">هذا كل ما تملكه من هذه السلعة</div>' : ''}<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="sell" data-g="${gd}" data-q="${q}">بِع ${q}</button><button class="sm" data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button></div>`;
}
function agentRow(gd) {
  const key = 'a:' + gd, q0 = clampQ(QS[key] == null ? 10 : QS[key], 9999), aq = E.agentQuote(S, sel, gd, q0);
  const mx = Math.max(1, aq.cap || 1), q = clampQ(q0, mx), a2 = q === q0 ? aq : E.agentQuote(S, sel, gd, q);
  return `<div class="agentbox"><div class="btns"><span class="lb">🤝 اطلب عبر وكيلك دون سفر</span></div>${aq.cap != null || aq.ok ? stepper(key, q, mx) : ''}<div class="small">${a2.ok ? `تدفع ≈ <b class="num">${fmt(a2.total)}</b> ر.س (رسم الوكيل ${Math.round(a2.feeRate * 100)}٪) · تصل إلى مخزنك في <b>${esc(S.cities[a2.dest].name)}</b> بعد <b>${a2.days}</b> أيام` : esc(a2.msg || '')}</div>${a2.ok ? `<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="agent" data-g="${gd}" data-q="${q}">اطلب ${q}</button></div>` : ''}</div>`;
}
function buyRow(gd, x, none) {
  if (none || !x) return '';
  const mx = Math.max(0, x.canCar), key = 'g:' + gd;
  if (mx < 1) return `<div class="btns"><span class="lb">اشترِ</span></div><div class="qnote">${LIMNOTE[x.limit] || 'لا تستطيع الشراء الآن'}</div>`;
  const q = clampQ(QS[key] == null ? 1 : QS[key], mx), qb = E.quoteBuy(S, sel, gd, q, S.player.gold);
  return `<div class="btns"><span class="lb">اشترِ</span></div>${stepper(key, q, mx)}<div class="small">${qb && qb.n ? `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س` : ''}</div>${q >= mx ? `<div class="qnote">${LIMNOTE[x.limit]}</div>` : ''}<div class="row" style="margin:4px 0 0"><button class="sm pri" data-act="buy" data-g="${gd}" data-q="${q}">اشترِ ${q}</button></div>`;
}
/* ---------- لوحة تفصيل السلعة ---------- */
function renderModal() {
  const m = $('modal');
  if (!dg || screen !== 'market') { m.hidden = true; m.innerHTML = ''; return; }
  const gd = dg, G = GD[gd], c = S.cities[sel], cr = main(), v = marketView(sel), live = liveView(sel), atHere = cr.city === sel && cr.left === 0;
  const price = v.p[gd], ref = E.refPrice(c, gd), r = price / ref, hist = (S.hist.px[sel] || {})[gd] || [];
  const mi = live ? E.marketInfo(S, sel, 1) : null, x = mi && mi.goods.find(y => y.g === gd);
  const have = Math.floor(cr.cargo[gd] || 0), avg = E.avgCost(cr.basis, gd);
  const maxQ = x ? Math.max(1, x.canCar) : 100, q = dq === 'max' ? maxQ : +dq;
  const qb = live ? E.quoteBuy(S, sel, gd, q, S.player.gold) : null;
  const unitCost = have && avg != null ? avg : qb && qb.n ? qb.avg : price;
  const opts = E.sellOptions(S, sel, gd, Math.max(1, have || (qb ? qb.n : q)), unitCost), cur = E.curOf(c.country);
  let h = `<div class="mbox" role="dialog" aria-label="${G.name}"><div class="row" style="margin-top:0"><span style="font-size:40px">${gi(G.id)}</span><div><h2 style="margin:0">${G.name} <span class="pill">${tierName(G.tier)}</span>${G.org ? `<span class="pill">منشأ ${G.org.map(o => CD[o].flag + ' ' + CD[o].name).join('، ')}</span>` : '<span class="pill">خام عام</span>'}</h2><div class="small muted">وزن الوحدة ${G.w} · تلف ${G.spoil ? (G.spoil * 100).toFixed(1) + '٪ يومياً' : 'لا يتلف'} · ${G.ess ? 'ضرورية' : G.lux ? 'كمالية' : 'عادية'}</div></div><span class="spacer"></span><button data-act="gdclose" class="sm">✕ إغلاق</button></div>`;
  h += missionInline();
  h += `<div class="grid g2" style="margin-top:8px"><div class="card"><div class="small muted">سعر الوحدة في ${esc(c.name)} ${live ? '' : '(معلومة قديمة)'}</div><div style="font-size:26px;font-weight:800" class="${r < 0.85 ? 'cheap' : r > 1.15 ? 'dear' : ''}">${pr(price, c.country)}</div>${refLine(ref, price, r)}<div style="color:var(--teal)">${spark(hist, 220, 40)}</div><div class="small muted">آخر ${hist.length} يوماً: من ${f1(Math.min(...hist, price))} إلى ${f1(Math.max(...hist, price))} ر.س</div></div>`;
  if (!E.sells(c, gd)) {
    h += `<div class="card"><b>بيع فقط في ${esc(c.name)}</b><p class="small">لا تُباع هذه السلعة هنا. تُشترى من: ${E.soldAt(S, gd).map(id => CD[S.cities[id].country].flag + ' ' + esc(S.cities[id].name)).join('، ')}.<br>اشترِها من هناك ثم بِعها هنا إن كان السعر أعلى.</p>${S.phase >= E.AGENT_PHASE ? '' : '<p class="small muted">🔒 الشراء عن بُعد عبر الوكيل يُفتح في الطور ٣ (صاحب مصانع).</p>'}</div>`;
  } else {
  h += `<div class="card"><div class="small muted">كم أشتري؟</div><div class="chips" style="margin:6px 0">${(planOn() && planOn().g === gd && ![1, 10, 25, 100].includes(planOn().q) ? [1, 10, 25, 100, planOn().q].sort((a, b) => a - b) : [1, 10, 25, 100]).map(n => `<button data-dq="${n}" class="${String(dq) === String(n) ? 'on' : ''}">${n}${planOn() && planOn().g === gd && planOn().q === n ? ' (مقترح)' : ''}</button>`).join('')}<button data-dq="max" class="${dq === 'max' ? 'on' : ''}">أقصى (${fmt(maxQ)})</button></div>${x && x.canCar >= 1 ? stepper('m', clampQ(q, maxQ), maxQ) : ''}${x && q >= maxQ ? `<div class="qnote">${LIMNOTE[x.limit]}</div>` : ''}`;
  if (qb) {
    h += `<div class="kv"><span>تدفع</span><b>${pr(qb.cost, c.country, 0)}</b></div><div class="kv"><span>متوسط الوحدة (مع انزلاق السعر)</span><b>${pr(qb.avg, c.country)}</b></div>${qb.n < q ? `<div class="small dear">تستطيع شراء ${qb.n} فقط من ${q}${x ? ' (الحدّ: ' + ({ gold: 'رصيدك', room: 'الحمولة', stock: 'المتوفر' }[x.limit]) + ')' : ''}</div>` : ''}`;
    h += `<div class="fitrow"><span class="fit ${x.carU >= q ? 'ok' : 'no'}">${x.carU >= q ? '✓ تكفي قافلتي' : '✗ قافلتي تتسع ' + fmt(x.carU)}</span><span class="fit ${mi.store.has && x.storeU >= q ? 'ok' : 'no'}">${mi.store.has ? (x.storeU >= q ? '✓ يكفي مخزني هنا' : '✗ مخزني يتسع ' + fmt(x.storeU)) : '✗ لا مخزن هنا'}</span></div>`;
    h += atHere ? `<div class="row"><button class="pri" data-act="buy" data-g="${gd}" data-q="${qb.n || 1}" ${qb.n ? '' : 'disabled'}>اشترِ ${qb.n}</button>${have ? `<button class="${guideOn() ? 'gbig' : ''}" data-act="sell" data-g="${gd}" data-q="999">بِع الكل (${have})</button>` : ''}</div>${have ? sellRow(gd, have, live) : ''}` : '<div class="small muted">للشراء يجب أن تكون القافلة في هذه المدينة.</div>';
  } else h += '<p class="small muted">لا أسعار حيّة هنا. السعر المعروض آخر ما عرفته.</p>';
  }
  h += `</div></div>`;
  if (have) {
    const qs = live ? E.quoteSell(S, sel, gd, have, 1) : null;
    h += `<div class="card" style="margin-top:10px"><b>معك ${have} وحدة</b><div class="kv"><span>تكلفتك للوحدة</span><b>${avg != null ? f1(avg) + ' ر.س' : '—'}</b></div>${qs ? `<div class="kv"><span>لو بعتها هنا (صافي بعد الضريبة)</span><b>${fmt(qs.net)} ر.س</b></div><div class="kv"><span>الربح/الخسارة</span><b class="pl ${plCls(qs.net - (avg || 0) * have)} num">${sgn(qs.net - (avg || 0) * have)} ر.س</b></div>` : ''}</div>`;
  }
  if (opts[0] && opts[0].profit > 0) { const n0 = Math.max(1, have || (qb ? qb.n : q)), cost0 = unitCost * n0, o0 = opts[0]; h += `<div class="card" style="margin-top:10px"><b>📈 مثال على هامش الربح</b><div class="small" style="margin-top:4px">تدفع ≈ <b>${fmt(Math.round(cost0))}</b> ريال، وتبيع في ${esc(cityName(o0.city))} فيبقى لك صافي ≈ <b>${fmt(Math.round(o0.net - o0.prov))}</b> ← تربح ≈ <b class="cheap">${fmt(Math.round(o0.profit))}</b>.<br>هامش الربح = ${fmt(Math.round(o0.profit))} ÷ ${fmt(Math.round(cost0))} = <b>${Math.round(o0.profit / cost0 * 100)}٪</b> (يعني لكل ١٠٠ ريال تدفعها تربح ${Math.round(o0.profit / cost0 * 100)}) ${helpBtn}</div></div>`; }
  h += `<h3 style="margin-top:14px">أين أبيع ${G.name}؟ <span class="small muted">(لـ ${fmt(Math.max(1, have || (qb ? qb.n : q)))} وحدة، بعد الضريبة والجمارك والمؤن)</span></h3><div class="optrow hd small muted"><span>المدينة</span><span>سعر البيع</span><span>الصافي</span><span>أيام</span><span>الربح/الخسارة</span><span></span></div>`;
  opts.slice(0, 8).forEach(o => {
    h += `<div class="optrow"><span>${cityTag(o.city)}${o.age ? `<span class="small muted"> (قبل ${o.age}ي)</span>` : ''}</span><span>${pr(o.price, o.country)}</span><span class="num">${fmt(o.net)} ر.س${o.customs ? `<span class="usd">جمارك ${fmt(o.customs)}</span>` : ''}</span><span class="num">${o.days} · ${Math.round(o.risk * 100)}٪</span><span class="pl ${plCls(o.profit)} num">${sgn(o.profit)} ر.س<span class="usd">${sgn(o.perUnit)}/وحدة</span></span><span>${atHere && cr.left === 0 ? (have ? `<button class="sm pri" data-act="go" data-to="${o.city}">سافر</button>` : `<button class="sm pri" data-act="dealgo2" data-g="${gd}" data-d="${o.city}" data-q="${q}">اشترِ وسافر</button>`) : ''}</span></div>`;
  });
  const hist2 = S.player.trades.filter(t => t.g === gd).slice(0, 5);
  if (hist2.length) h += `<h3 style="margin-top:14px">صفقاتك الأخيرة في ${G.name}</h3>` + hist2.map(t => `<div class="kv small"><span>يوم ${t.day} · ${cityTag(t.city)} · ${t.side === 'shop' ? 'دكان' : 'بيع'} ${f1(t.q)}</span><b class="pl ${plCls(t.pl)} num">${sgn(t.pl)} ر.س</b></div>`).join('');
  m.innerHTML = h + `</div>`; m.hidden = false;
}

/* ---------- ٤ القافلة ---------- */
function screenCaravan() {
  const P = S.player, cr = car(); let h = `${pic('scene/caravan', 'banner', 'القافلة')}`;
  if (P.caravans.length > 1) h += `<div class="chips" style="margin-bottom:12px">${P.caravans.map(c => `<button data-act="selcar" data-id="${c.id}" class="${c.id === cr.id ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div>`;
  const cap = E.capOfCar(cr), ld = E.loadOf(cr), idle = cr.left === 0;
  h += `<div class="grid g3"><div class="card"><h3>📍 الموقع</h3><b>${idle ? cityTag(cr.city) : 'في الطريق إلى ' + cityTag(cr.dest)}</b>${idle ? '' : `<div class="small muted">باقٍ ${cr.left} يوم</div>${bar(cr.total - cr.left, cr.total, 'gold')}`}</div><div class="card"><h3>💪 المعنويات</h3><b class="num">${Math.round(cr.morale)} / 100</b>${bar(cr.morale, 100, cr.morale < 50 ? 'red' : '')}<div class="small muted">تنخفض بالسفر وتعود بالراحة في المدن.</div></div><div class="card"><h3>${av('leader')} الطاقم</h3><div class="kv"><span>عربات</span><b>${cr.carts}</b></div><div class="kv"><span>رجال</span><b>${cr.crew}</b></div><div class="kv"><span>حرّاس</span><b>${cr.guards}</b></div>${cr.captain ? `<div class="small muted">القائد ${esc(cr.captain.name)}: تجارة ${cr.captain.trade} · ملاحة ${cr.captain.nav} · قتال ${cr.captain.combat}</div>` : ''}</div></div>`;
  const icons = []; GIDS.forEach(g => { const n = Math.ceil((cr.cargo[g] || 0) * GD[g].w / 10 - 0.001); for (let i = 0; i < n; i++) icons.push(gi(g)); });
  const slots = Math.max(cap / 10, icons.length);
  h += `<h2 style="margin-top:16px">📦 الحمولة <span class="muted small num">${fmt(ld)} / ${cap}</span></h2><div class="card"><div class="crates">${Array.from({ length: slots }, (_, i) => `<div class="crate ${icons[i] ? 'f' : ''}">${icons[i] || ''}</div>`).join('')}</div>${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).length ? `<div class="row small">${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).map(g => `<span class="pill">${gi(g)} ${GD[g].name}: ${Math.floor(cr.cargo[g])}${E.avgCost(cr.basis, g) != null ? ' · تكلفة ' + f1(E.avgCost(cr.basis, g)) : ''}</span>`).join('')}</div>` : '<p class="small muted">القافلة فارغة. اشترِ من السوق.</p>'}</div>`;
  h += `<h2 style="margin-top:16px">🔧 تجهيز القافلة</h2><div class="grid g4">`;
  [[uic('crate') || '🛒', 'عربة', 'تزيد الحمولة ١٠٠', '٦٠٠', 'cart'], [av('porter') || '🧑‍🌾', 'رجل طاقم', 'يسرّع الدفاع قليلاً', '٥٠', 'crew'], [av('guard') || '🛡️', 'حارس', 'يصدّ اللصوص', '٣٠٠', 'guard']].forEach(([ic, t, d, p, a]) => { h += `<div class="card up"><span class="ic">${ic}</span><b>${t}</b><div class="small muted">${d}</div><button data-act="${a}" ${idle ? '' : 'disabled'}>+ ${t} (${p})</button></div>`; });
  h += `<div class="card up"><span class="ic">📜</span><b>تأمين الرحلة</b><div class="small muted">٢٫٥٪ من قيمة الحمولة، ويقلل خسارة اللصوص إلى ٣٠٪.</div><label><input type="checkbox" id="insBox" ${cr.insured ? 'checked' : ''}> مفعّل</label></div></div>`;
  if (idle && cr.main && P.gold <= 150 && ld < 1) h += `<div class="card" style="margin-top:12px"><b>أفلست؟</b> <button data-act="work">اعمل حمّالاً في السوق (+٤٠)</button></div>`;
  return h;
}

/* ---------- ٥ العقارات: دكاكين ومخازن ---------- */
function teaser(ph, icon, title, items) {
  const nw = E.netWorth(S), need = E.PHASE_AT[ph - 1];
  return `<div class="card locked"><h2>${icon} ${title} <span class="pill">🔒 الطور ${ph}</span></h2><ul class="small" style="margin:0 0 6px;padding-inline-start:18px">${items.map(i => `<li>${i}</li>`).join('')}</ul><div class="small muted">يُفتح عند ثروة ${fmt(need)} (ثروتك ${fmt(nw)})</div><div class="lockbar">${bar(nw, need, 'gold')}</div></div>`;
}
/* ---------- الزعماء والعقود ---------- */
const av = k => pic('hero/' + k, 'av', '');
const pactIc = t => (t === 'guard' && ART['hero/guard'] ? av('guard') : t === 'supply' && ART['ui/crate'] ? uic('crate') : E.PACTS[t].icon);
let bossReaction = null;
function bossMood(id) {
  if (bossReaction && bossReaction.game === S && bossReaction.id === id && bossReaction.day === S.day) return bossReaction.mood;
  const trust = S.bosses[id] ? S.bosses[id].trust : 0;
  return trust >= 20 ? 'accepted' : trust <= -10 ? 'reserved' : trust > 0 ? 'thinking' : 'neutral';
}
function bossPortrait(id, cls = 'boss', mood = bossMood(id)) {
  const key = 'expressions/boss/' + id + '_' + mood;
  return ART[key] ? pic(key, cls + ' dialogue-portrait', S.bosses[id] ? S.bosses[id].name : '') : pic('boss/' + id, cls, '');
}
function bossAction(run, kind) {
  const r = run();
  bossReaction = { game: S, id: lordCity, day: S.day, mood: r && r.ok === false || kind === 'lobby' || kind === 'breakp' ? 'reserved' : 'accepted' };
  return act(r);
}
const bossPic = (c, mine) => mine ? pic('hero/c_' + (S.learn.char || 'trader'), 'boss', 'أنت') : bossPortrait(c.id);
const trustWord = v => v >= 50 ? 'صديق' : v >= 20 ? 'موثوق' : v > -10 ? 'محايد' : v > -40 ? 'متوتر' : 'عدائي';
function bossStrip(c) {
  const bs = E.bossOf(S, c.id); if (!bs) return '';
  const sh = Math.round(E.bossShare(bs) * 100), mine = bs.ruler === 'player', pc = E.pactIn(S, c.id);
  return `<div class="card" style="margin:10px 0;display:flex;flex-wrap:wrap;gap:12px;align-items:center"><span style="position:relative">${bossPic(c, mine) || '🧔'}${mine ? '<span style="position:absolute;top:-6px;inset-inline-end:-4px;font-size:22px">👑</span>' : ''}</span><div style="flex:1;min-width:200px"><b>${mine ? 'أنت حاكم سوق ' + esc(c.name) : 'كبير تجّار ' + esc(c.name) + ': ' + esc(bs.name)}</b><div class="small muted">نفوذك ${sh}٪ (تحكم عند ${Math.round(E.BOSS_TAKE * 100)}٪) · ثقته بك: ${trustWord(bs.trust)}${pc ? ' · بينكما ' + E.PACTS[pc.type].name : ''}</div>${bar(sh, 100, mine ? '' : 'gold')}</div><button class="sm ${S.phase >= 2 ? 'pri' : ''}" data-act="tolord" data-c="${c.id}">${S.phase >= 2 ? '🤝 العقود والنفوذ' : 'تعرّف على الزعيم'}</button></div>`;
}
let lordC = 'sa', lordCity = 'riyadh';
const LORE_HINT = ['تُفتح حين تزور هذه المدينة (بعد المستوى ٣)', 'تُفتح حين يرتاح لك: ثقة ١٠ أو هدية منك', 'تُفتح حين يصادقك: ثقة ٣٥ أو عقد معه'];
function loreCard(id) {
  const L = S.learn, lo = E.LORE.BOSS_LORE[id], bs = S.bosses[id]; if (!L || !L.char || !lo || !bs) return '';
  const n = (L.lore || {})[id] || 0, sty = E.LORE.STYLES[lo.style];
  let h = `<div class="card lore" style="margin-bottom:12px"><h3 style="margin-top:0">📜 حكاية ${esc(bs.name)} <span class="pill">${n} من 3</span></h3>`;
  for (let i = 0; i < 3; i++) h += i < n ? `<div class="chap"><b>${i + 1}. ${lo.ch[i].t}</b><p class="small" style="margin:4px 0 10px">${lo.ch[i].x}</p></div>` : `<div class="chap small muted">🔒 الفصل ${i + 1}: ${LORE_HINT[i]}</div>`;
  if (n >= 2) h += `<div class="small">👤 <b>${lo.trait}</b> · يحبّ: ${lo.likes} · يكره: ${lo.dislikes}</div>`;
  if (n >= 3) h += `<div class="small" style="margin-top:6px">💡 <b>${lo.tip}</b> <span class="muted">(${sty.name}: ${sty.effect})</span></div>`;
  return h + `</div>`;
}
function screenLords() {
  const c = S.cities[lordCity], bs = E.bossOf(S, lordCity), P = S.player, on = S.phase >= 2;
  let h = `<span class="title" style="margin:0">🤝 الزعماء والعقود</span><p class="small muted" style="margin:6px 0 10px">في كل سوق كبير تجّار يحكمه. كلما بنيت وبعت أكثر زاد نفوذك. عندما تتجاوز حصتك ${Math.round(E.BOSS_TAKE * 100)}٪ تخلعه وتصير حاكماً (ضريبة ٢٠٪ لك، وشراء أرخص). وإن هبط نفوذك دون ${Math.round(E.BOSS_LOSE * 100)}٪ عاد إليه الحكم. وفي المقابل، يمكنك عقد شراكات معه.${on ? '' : ' <b>الأفعال تُفتح في الطور ٢.</b>'}</p>`;
  h += countryChips(lordC, 'data-lc') + `<div class="chips" style="margin-bottom:10px">${citiesOf(lordC).map(id => { const b = E.bossOf(S, id); return `<button data-lcity="${id}" class="${id === lordCity ? 'on' : ''}">${b && b.ruler === 'player' ? '👑 ' : ''}${esc(cityName(id))}</button>`; }).join('')}</div>`;
  if (!bs) return h + '<div class="card">لا زعيم في هذه المدينة (مدينة أسستَها بنفسك).</div>';
  const sh = Math.round(E.bossShare(bs) * 100), mine = bs.ruler === 'player', ct = CD[c.country], pc = E.pactIn(S, lordCity);
  h += `<div class="card" style="margin-bottom:12px"><div class="row" style="margin:0"><span style="position:relative">${bossPic(c, mine) || '🧔'}${mine ? '<span style="position:absolute;top:-8px;inset-inline-end:-6px;font-size:28px">👑</span>' : ''}</span><div style="flex:1;min-width:200px"><h2 style="margin:0">${esc(bs.name)}</h2><div class="small muted">كبير تجّار ${esc(c.name)} · ${ct.flag} ${ct.name} · ${mine ? '<b>أنت الحاكم الآن</b>' : 'يحكم السوق'}</div></div></div>`;
  h += `<div class="grid g3" style="margin-top:10px"><div><div class="small muted">نفوذك في السوق</div><b class="num">${sh}٪</b>${bar(sh, 100, mine ? '' : 'gold')}<div class="small muted">نفوذك ${f1(bs.p)} مقابل نفوذه ${f1(bs.b)}</div></div><div><div class="small muted">ثقته بك</div><b>${trustWord(bs.trust)} <span class="num">(${Math.round(bs.trust)})</span></b>${bar(bs.trust + 100, 200, bs.trust < 0 ? 'red' : '')}</div><div><div class="small muted">ما يدخل نفوذك يومياً</div><div class="small">دكاكينك ${E.shopsOf(S, lordCity).length} · مخازنك ${E.whsOf(S, lordCity)} · مبيعاتك في السوق</div></div></div>`;
  if (!mine) { const k = Math.round(150 * c.size * (c.country === S.home ? 1 : 1.4)); h += `<div class="row" style="margin-top:10px"><button class="sm pri" data-act="lobby" data-q="5" ${on ? '' : 'disabled'}>📣 اكسب نفوذاً +٥ (${fmt(5 * k)})</button><button class="sm" data-act="lobby" data-q="20" ${on ? '' : 'disabled'}>+٢٠ (${fmt(20 * k)})</button><button class="sm" data-act="gift" ${on ? '' : 'disabled'}>🎁 هدية (${fmt(Math.round(500 * c.size * (c.country === S.home ? 1 : 1.4)))})</button></div><div class="small muted">الإنفاق على النفوذ يُغضب الزعيم قليلاً. الهدية ترفع ثقته (مرة كل ١٠ أيام).</div>`; }
  else h += `<div class="small" style="margin-top:8px">فوائد الحكم: ٢٠٪ من ضريبة مبيعاتك هنا تعود إليك، وشراؤك أرخص ٣٪، وتُحسب لثروتك. حافظ على نفوذك فوق ${Math.round(E.BOSS_LOSE * 100)}٪.</div>`;
  h += `</div>`;
  h += loreCard(lordCity);
  if (!mine) {
    if (pc) {
      const d = E.PACTS[pc.type];
      h += `<div class="card" style="margin-bottom:12px"><h2 style="margin-top:0">${pactIc(pc.type)} ${d.name} <span class="pill good">قائم</span></h2><div class="small">${d.desc}</div><div class="kv"><span>المتبقي</span><b>${pc.left} من ${pc.total} يوم</b></div>${bar(pc.total - pc.left, pc.total, 'gold')}<div class="kv"><span>الرسم اليومي</span><b>${fmt(pc.daily)} ريال</b></div>${pc.share ? `<div class="kv"><span>حصته من إيراد الدكاكين</span><b>${Math.round(pc.share * 100)}٪</b></div>` : ''}<div class="kv"><span>البند الجزائي عند الفسخ</span><b>${fmt(pc.penalty)} ريال</b></div><div class="row"><button class="sm" data-act="breakp">فسخ العقد</button></div></div>`;
    } else {
      h += `<h2>عروض ${esc(bs.name)}</h2><div class="grid g2">` + Object.keys(E.PACTS).map(k => {
        const d = E.PACTS[k], tm = E.pactTerms(S, lordCity, k), why = E.pactBlock(S, lordCity, k);
        return `<div class="card ${why ? 'locked' : ''}"><h3 style="margin-top:0">${pactIc(k)} ${d.name}${tm.negotiated ? ' <span class="pill good">مخفَّض ٢٠٪</span>' : ''}</h3><div class="small">${d.desc}</div><div class="kv"><span>المدة</span><b>${tm.days} يوماً</b></div>${tm.daily ? `<div class="kv"><span>رسم يومي</span><b>${fmt(tm.daily)} ريال</b></div>` : ''}${tm.share ? `<div class="kv"><span>حصة الزعيم</span><b>${Math.round(tm.share * 100)}٪ من إيراد الدكاكين</b></div>` : ''}${tm.upfront ? `<div class="kv"><span>دفعة مقدّمة</span><b>${fmt(tm.upfront)} ريال</b></div>` : ''}<div class="kv"><span>بند جزائي</span><b>${fmt(tm.penalty)} ريال</b></div>${why ? `<div class="small dear" style="margin-top:6px">${esc(why)}</div>` : ''}<div class="row"><button class="sm pri" data-act="sign" data-k="${k}" ${why ? 'disabled' : ''}>✍️ وقّع العقد</button><button class="sm" data-act="nego" data-k="${k}" ${why || tm.negotiated ? 'disabled' : ''}>🗣️ فاوض</button></div></div>`;
      }).join('') + `</div>`;
    }
  }
  const all = P.pacts || [];
  h += `<h2>${uic('seal')}عقودي (${all.length} من ${E.MAX_PACTS})</h2>` + (all.length ? `<div class="grid g3">${all.map(x => `<div class="card"><b>${pactIc(x.type)} ${E.PACTS[x.type].name}</b><div class="small muted">${cityTag(x.city)} · ${esc(E.bossOf(S, x.city).name)}</div><div class="small">متبقٍ ${x.left} يوم${x.daily ? ' · ' + fmt(x.daily) + '/يوم' : ''}</div></div>`).join('')}</div>` : '<div class="card small muted">لا عقود قائمة.</div>');
  const ruled = S.order.filter(id => E.bossOf(S, id) && E.bossOf(S, id).ruler === 'player');
  h += `<div class="small muted" style="margin-top:10px">أسواق تحكمها: ${ruled.length ? ruled.map(cityTag).join('، ') : 'لا شيء بعد'}.</div>`;
  return h;
}
function screenEstate() {
  if (S.phase < 2) return teaser(2, '🏬', 'الدكاكين والمخازن', ['ابنِ دكاكين في مدن أي دولة وبِع فيها سلعك بسعرك', 'السكان يشترون منها يومياً بحسب طبقاتهم وسعرك', 'كل دكان جديد يفتح لك مخزناً إضافياً']);
  const P = S.player, cities = citiesOf(estC), c = S.cities[estCity] || S.cities[cities[0]], ct = CD[c.country];
  const shops = E.shopsOf(S, c.id), whs = E.whsOf(S, c.id), pr = P.props[c.id], cap = E.storeCap(S, c.id), ld = E.storeLoad(S, c.id), lim = E.shopLimit(c);
  let h = `${pic('scene/shop', 'banner', 'الدكان')}<p class="sub">ابنِ دكاكين في مدن العالم. كل دكان جديد يتيح لك مخزناً إضافياً، والبيع آلي من المخزن بالسعر الذي تحدده.</p>${countryChips(estC, 'data-ec')}<div class="chips" style="margin-bottom:12px">${cities.map(id => `<button data-estcity="${id}" class="${id === c.id ? 'on' : ''}">${esc(cityName(id))}${E.shopsOf(S, id).length ? ' 🏪' + E.shopsOf(S, id).length : ''}</button>`).join('')}</div>`;
  h += `<div class="card"><div class="row" style="margin:0"><span class="title" style="margin:0">${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">سكان ${fmt(E.popTotal(c))}</span><span class="pill">ضريبة ${Math.round(c.tax * 100)}٪</span>${c.country !== S.home ? '<span class="pill bad">البناء هنا أغلى ×١٫٤</span>' : ''}</div>
  <div class="grid g3" style="margin-top:10px"><div class="card"><h3>🏪 الدكاكين ${shops.length} / ${lim}</h3>${bar(shops.length, lim)}<div class="row"><button class="pri" data-act="bshop" ${shops.length >= lim ? 'disabled' : ''}>ابنِ دكاناً (${fmt(E.shopCost(S, c))})</button></div></div>
  <div class="card"><h3>📦 المخازن ${whs} / ${shops.length}</h3>${bar(whs, Math.max(1, shops.length))}<div class="small muted">كل دكان يفتح مخزناً واحداً.</div><div class="row"><button class="pri" data-act="bwh" ${whs >= shops.length ? 'disabled' : ''}>ابنِ مخزناً (${fmt(E.whCost(S, c))})</button></div></div>
  <div class="card"><h3>🧺 التخزين ${fmt(ld)} / ${fmt(cap)}</h3>${bar(ld, Math.max(1, cap), ld > cap * 0.9 ? 'red' : '')}<div class="small muted">دخل اليوم: <b class="num">${fmt(pr ? pr.today || 0 : 0)}</b></div></div></div>`;
  if (!shops.length) h += `<p class="muted">لا عقارات لك في ${esc(c.name)} بعد. الدكان الأول يعطيك أيضاً أسعاراً حيّة في هذه المدينة.</p>`;
  shops.forEach((sh, i) => {
    h += `<div class="shopbox"><div class="row" style="margin:0"><b>🏪 الدكان ${i + 1}</b><span class="small muted">يتسع لـ ${E.SHOP_ITEMS_MAX} سلع</span></div>`;
    sh.items.forEach(it => {
      const G = GD[it.g], mp = E.unitPrice(c, it.g), ref = E.refPrice(c, it.g), have = Math.floor(pr.store[it.g] || 0);
      h += `<div class="itemrow"><span style="font-size:22px">${gi(G.id)}</span><b>${G.name}</b><span class="small muted">سوق ${f1(mp)} · مخزن ${have}</span><span class="spacer"></span><label class="small">السعر ٪ <input type="number" id="ip${sh.id}_${it.g}" value="${Math.round(it.price * 100)}" min="50" max="200" step="5"></label><label class="small"><input type="checkbox" id="ia${sh.id}_${it.g}" ${it.auto ? 'checked' : ''}> تعبئة آلية</label><button class="sm pri" data-act="isave" data-s="${sh.id}" data-g="${it.g}">حفظ</button><button class="sm" data-act="irm" data-s="${sh.id}" data-g="${it.g}">إزالة</button><span class="small ${it.lastSold > 0.05 ? 'cheap' : 'muted'}">بيع اليوم ${f1(it.lastSold || 0)} · إجمالي ${fmt(it.revenue || 0)}</span></div>`;
    });
    if (sh.items.length < E.SHOP_ITEMS_MAX) h += `<div class="itemrow"><b class="small">أضف سلعة:</b><select id="ig${sh.id}">${GIDS.map(g => `<option value="${g}">${GD[g].icon} ${GD[g].name}</option>`).join('')}</select><label class="small">السعر ٪ <input type="number" id="ipn${sh.id}" value="105" min="50" max="200" step="5"></label><button class="sm pri" data-act="iadd" data-s="${sh.id}">أضف</button></div>`;
    h += `</div>`;
  });
  if (pr && (Object.keys(pr.store).some(g => pr.store[g] >= 1) || shops.length)) {
    const cr = main(), here = cr.city === c.id && cr.left === 0;
    h += `<h3 style="margin-top:12px">📦 محتوى المخزن</h3><div class="row small">${GIDS.filter(g => pr.store[g] >= 1).map(g => `<span class="pill">${gi(g)} ${GD[g].name}: ${Math.floor(pr.store[g])}</span>`).join('') || '<span class="muted">فارغ. أحضر بضاعة بالقافلة أو فعّل التعبئة الآلية.</span>'}</div>`;
    h += here ? `<div class="row small">${GIDS.filter(g => pr.store[g] >= 1).map(g => `<button class="sm" data-act="fromstore" data-g="${g}">حمّل ${GD[g].name} في القافلة</button>`).join('')}${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).map(g => `<button class="sm" data-act="tostore" data-g="${g}">أودع ${GD[g].name} من القافلة</button>`).join('')}</div>` : `<p class="small muted">لتحميل المخزن أو إيداع البضاعة، يجب أن تكون قافلتك في ${esc(c.name)}.</p>`;
  }
  return h + `</div>`;
}

/* ---------- ٦ الإمبراطورية ---------- */
function screenEmpire() {
  const P = S.player; let h = '';
  const names = S.order.map(id => [id, flag(id) + ' ' + cityName(id)]), goods = GIDS.map(g => [g, GD[g].name]);
  const opt = (arr, selv, none) => (none ? '<option value="">— لا شيء —</option>' : '') + arr.map(([v, n]) => `<option value="${v}" ${v === selv ? 'selected' : ''}>${n}</option>`).join('');
  if (S.phase < 2) h += teaser(2, '🚚', 'الأسطول', ['قادة قوافل بمسارات آلية بين مدينتين']);
  else {
    h += `<div class="card"><h2>🚚 الأسطول</h2><div class="row"><button class="pri" data-act="hire">توظيف قائد قافلة (١٥٠٠)</button><span class="small muted">${P.caravans.length}/٦ · الرواتب تزيد ٦٪ لكل قافلة إضافية</span></div>`;
    const cs = P.caravans.filter(c => c.captain);
    if (!cs.length) h += '<p class="small muted">لا قادة بعد. وظّف قائداً واختر له مساراً بين مدينتين.</p>';
    cs.forEach(c => {
      const r = c.route || {};
      h += `<div class="card" style="margin:8px 0"><b>${esc(c.name)}</b> <span class="small muted">${c.left > 0 ? 'في الطريق إلى ' + cityTag(c.dest) : 'في ' + cityTag(c.city) + (c.waiting ? ' — ' + esc(c.waiting) : '')} · تجارة ${c.captain.trade} ملاحة ${c.captain.nav} قتال ${c.captain.combat} · حمولة ${fmt(E.loadOf(c))}/${E.capOfCar(c)}</span><div class="row small">من <select id="ra${c.id}">${opt(names, r.a)}</select> يشتري <select id="rba${c.id}">${opt(goods.filter(([g]) => (!S.cities[r.a] || E.sells(S.cities[r.a], g)) || g === r.buyA), r.buyA, true)}</select> ← إلى <select id="rb${c.id}">${opt(names, r.b)}</select> يشتري <select id="rbb${c.id}">${opt(goods.filter(([g]) => (!S.cities[r.b] || E.sells(S.cities[r.b], g)) || g === r.buyB), r.buyB, true)}</select> <button class="sm pri" data-act="route" data-id="${c.id}">اعتمد المسار</button><button class="sm" data-act="cartc" data-id="${c.id}">+ عربة</button><button class="sm" data-act="guardc" data-id="${c.id}">+ حارس</button></div></div>`;
    });
    h += `</div>`;
  }
  if (S.phase < 3) h += `<div style="margin-top:12px">${teaser(3, '🏭', 'الصناعة', ['لكل دولة أداتها: عطور بالسعودية، نسيج بمصر، سجاد بفارس، مجوهرات بالهند، أدوات بالصين', 'تحتاج دكاناً في المدينة، وتوفّر وظائف فترتقي طبقات المدينة'])}</div>`;
  else {
    h += `<div class="card" style="margin-top:12px"><h2>🏭 الصناعة</h2><p class="small muted">لكل دولة أداتها الخاصة، ولا تُبنى إلا فيها. المصنع يأخذ المواد من مخزن المدينة أو من سوقها وينتج إلى المخزن، ويدفع أجوراً وصيانة. يلزمك دكان في المدينة.</p>${countryChips(empC, 'data-ee')}<div class="chips" style="margin-bottom:10px">${citiesOf(empC).map(id => `<button data-estcity2="${id}" class="${id === estCity ? 'on' : ''}">${esc(cityName(id))}</button>`).join('')}</div><div class="grid g2">`;
    const cc = S.cities[estCity] && S.cities[estCity].country === empC ? S.cities[estCity] : S.cities[citiesOf(empC)[0]];
    for (const rid in E.RECIPES) {
      const rc = E.RECIPES[rid], mine = rc.country === cc.country, inV = Object.keys(rc.inp).reduce((a, g) => a + rc.inp[g] * E.mid(g), 0), outV = rc.n * E.mid(rc.out), ex = P.factories.find(f => f.city === cc.id && f.recipe === rid);
      h += `<div class="card ${mine ? '' : 'locked'}"><b>${CD[rc.country].flag} ${rc.name}</b><div class="small muted">${Object.keys(rc.inp).map(g => rc.inp[g] + ' ' + GD[g].name).join(' + ')} ← ${rc.n} ${GD[rc.out].name}<br>قيمة تقريبية ${fmt(inV)} ← ${fmt(outV)}</div><div class="row"><button class="sm pri" data-act="factory" data-r="${rid}" data-c="${cc.id}" ${mine ? '' : 'disabled'}>${ex ? 'رقِّ (المستوى ' + ex.level + ')' : 'ابنِ'} في ${esc(cc.name)}</button>${mine ? '' : `<span class="small muted">لا تُبنى إلا في ${CD[rc.country].name}</span>`}</div></div>`;
    }
    h += `</div><h3 style="margin-top:10px">مصانعك</h3>${P.factories.length ? P.factories.map(f => `<div class="kv"><span>${E.RECIPES[f.recipe].name} — ${cityTag(f.city)}</span><b>المستوى ${f.level}</b></div>`).join('') : '<p class="small muted">لا مصانع بعد.</p>'}</div>`;
  }
  if (S.phase < 4) h += `<div style="margin-top:12px">${teaser(4, '🏦', 'المصرف والإمبراطورية', ['ودائع بفائدة، وقروض، وسندات حرب', 'ترقية رتبة السوق', 'تأسيس مدينتك الخاصة وأخذ ٢٠٪ من ضرائبها'])}</div>`;
  else {
    const B = P.bank, debt = B.loans.reduce((a, l) => a + l.amt, 0), c = S.cities[sel];
    h += `<div class="card" style="margin-top:12px"><h2>🏦 المصرف والإمبراطورية</h2><div class="grid g2"><div><h3>الودائع (تُسحب في مدينتها، رسم ١٪)</h3><div class="row"><button class="sm" data-act="dep" data-q="1000">أودع ١٠٠٠ في ${esc(c.name)}</button><button class="sm" data-act="dep" data-q="10000">١٠٬٠٠٠</button><button class="sm" data-act="wd" data-q="1000">اسحب ١٠٠٠</button><button class="sm" data-act="wd" data-q="999999">اسحب الكل</button></div>${Object.keys(B.dep).filter(k => B.dep[k] > 0.5).map(k => `<div class="kv"><span>${cityTag(k)}</span><b class="num">${fmt(B.dep[k])}</b></div>`).join('') || '<p class="small muted">لا ودائع.</p>'}</div><div><h3>القروض وسندات الحرب</h3><div class="row"><button class="sm" data-act="borrow" data-q="5000">اقترض ٥٠٠٠</button><button class="sm" data-act="repay">سدّد ما أمكن</button></div><div class="small muted">فائدة ٠٫٢٥٪ يومياً · الحدّ ٥٠٪ من ثروتك · عليك ${fmt(debt)}</div><div class="row"><button class="sm" data-act="bond">سند حرب (٥٠٠٠ · ٢٠ يوماً)</button></div><div class="small muted">٥٥٪ ربح ٥٠٪ · ٤٥٪ خسارة ٥٠٪ · لديك ${B.bonds.length} سند</div></div></div><h3 style="margin-top:10px">الإمبراطورية (المدينة المحددة: ${cityTag(sel)})</h3><div class="row"><button class="sm pri" data-act="upg">رقِّ سوق ${esc(c.name)} (رتبة ${c.tier} ← ${c.tier + 1}: ${c.tier === 1 ? '٨٠٠٠' : '٢٥٠٠٠'})</button></div><div class="row"><select id="fcZone">${E.COUNTRIES.map(k => `<option value="${k.id}">${k.flag} ${k.name}</option>`).join('')}</select><select id="fcGood">${GIDS.map(g => `<option value="${g}">${GD[g].name}</option>`).join('')}</select><button class="sm pri" data-act="found">أسّس مدينة جديدة (٦٠٬٠٠٠)</button></div><p class="small muted">تأخذ ٢٠٪ من ضرائب مدينتك الخاصة.</p></div>`;
  }
  return h;
}

/* ---------- ٧ الدول والدفتر ---------- */
const LN = { exchange: 'رسوم صرافة', realized: 'أرباح محققة من الصفقات', realizedLoss: 'خسائر محققة في الصفقات', sales: 'مبيعات القافلة', shops: 'مبيعات الدكاكين', purchases: 'مشتريات', tax: 'ضرائب', customs: 'جمارك', provisions: 'مؤن', wages: 'رواتب', wear: 'إهلاك العربات', bandits: 'لصوص', spoilage: 'تلف', insurance: 'تأمين', upkeep: 'صيانة', assets: 'أصول', hiring: 'توظيف', wealthLevy: 'زكاة وأعطيات', loanInterest: 'فوائد قروض', interest: 'فوائد ودائع', bonds: 'سندات', governor: 'عوائد مدينتك', labor: 'عمل يدوي', foundCity: 'تأسيس مدينة', factory: 'إنتاج مصانع', bailout: 'إنقاذ تجّار', agentUpkeep: 'نفقات التجّار', investment: 'استثمار التجّار', bankFee: 'رسوم مصرف', bondLoss: 'خسارة سندات' };
let testOut = '';
function screenCities() {
  let h = `<div class="chips" style="margin-bottom:12px">${[['cities', '🌍 الدول والمدن'], ['fx', '💱 الصرافة'], ['ledger', '📒 الدفتر']].concat(devMode ? [['test', '🧪 اختبار الاقتصاد']] : []).map(([id, n]) => `<button data-ct="${id}" class="${ct === id ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (ct === 'cities') {
    const nm = ['متسولون', 'فقراء', 'أثرياء', 'نخبة'];
    E.COUNTRIES.forEach(k => {
      const cs = citiesOf(k.id), pop = cs.reduce((a, id) => a + E.popTotal(S.cities[id]), 0), own = E.GOODS.filter(x => x.org && x.org.includes(k.id));
      h += `<div class="countryhead"><span class="cbadge" style="background:${k.color}">${k.flag} ${k.name}</span><span class="pill">سكان ${fmt(pop)}</span><span class="pill">جمارك ${Math.round(k.customs * 100)}٪</span><span class="small muted">${own.map(x => gi(x.id)).join(' ')}</span></div><div class="grid g3">`;
      h += cs.map(id => {
        const c = S.cities[id], pt = E.popTotal(c);
        return `<div class="card citycard">${cityScene(c)}<div class="row" style="margin:0"><b style="font-size:17px">${esc(c.name)}</b><span class="pill">رتبة ${c.tier}</span>${c.ev ? `<span class="pill ${evGood(c.ev.k) ? 'good' : 'bad'}">${EVN[c.ev.k]}</span>` : ''}${E.shopsOf(S, id).length ? `<span class="pill good">🏪${E.shopsOf(S, id).length} 📦${E.whsOf(S, id)}</span>` : ''}</div><div class="small muted" style="margin:4px 0">السكان ${fmt(pt)} · شبع ${Math.round(c.sat.food * 100)}٪ · كماليات ${Math.round(c.sat.lux * 100)}٪</div>${c.pop.map((v, i) => `<div class="kv small"><span>${nm[i]}</span><b class="num">${fmt(v)}</b></div>${bar(v, pt, i === 3 ? 'gold' : '')}`).join('')}<div class="small muted" style="margin-top:6px">ينتج: ${c.makes.map(g => gi(g)).join(' ')}</div><div class="row"><button class="sm" data-act="viewcity" data-c="${id}">🗺️ الخريطة</button><button class="sm" data-act="viewmarket" data-c="${id}">🏪 السوق</button></div></div>`;
      }).join('') + `</div>`;
    });
    h += `<p class="small muted">المتسولون يحتاجون وظائف ليصيروا فقراء. وإذا وصل القمح بانتظام يرتقي الفقراء إلى أثرياء فتطلب المدينة الكماليات.</p>`;
  } else if (ct === 'fx') {
    const w = S.player.wallet, F = S.fx, mm = a => [Math.min(...a), Math.max(...a)];
    const [u0, u1] = mm(F.hu), [g0, g1] = mm(F.hg);
    h += `<div class="grid g3"><div class="card fxcard"><div class="small muted">🇸🇦 الريال السعودي</div><b class="num">${fmt(w.sar)}</b> ريال<div class="small muted">عملة السعودية، وأساس كل الأسعار</div></div><div class="card fxcard"><div class="small muted">💵 الدولار (عالمي، عملة بقية الدول)</div><b class="num">$${fmt(w.usd)}</b> ≈ ${fmt(w.usd * F.usd)} ريال<div class="small">السعر الآن <b class="num">${F.usd.toFixed(3)}</b> ريال <span style="color:var(--teal)">${spark(F.hu, 90, 22)}</span></div><div class="small muted">آخر ${F.hu.length} يوماً: ${u0.toFixed(2)} – ${u1.toFixed(2)}</div></div><div class="card fxcard"><div class="small muted">🥇 الذهب (غرام)</div><b class="num">${w.au.toFixed(3)}</b> غ ≈ ${fmt(w.au * F.gold)} ريال<div class="small">الغرام الآن <b class="num">${fmt(F.gold)}</b> ريال <span style="color:var(--teal)">${spark(F.hg, 90, 22)}</span></div><div class="small muted">آخر ${F.hg.length} يوماً: ${fmt(g0)} – ${fmt(g1)}</div></div></div>`;
    h += `<div class="card" style="margin-top:12px"><h2>${pic('hero/changer', 'boss', 'الصرّاف')} 💱 الصرافة</h2><div class="row"><label class="small">من <select id="fxFrom">${['sar', 'usd', 'au'].map(c => `<option value="${c}" ${fxFrom === c ? 'selected' : ''}>${E.CURS[c].icon} ${E.CURS[c].name}</option>`).join('')}</select></label><label class="small">إلى <select id="fxTo">${['sar', 'usd', 'au'].filter(c => c !== fxFrom).map(c => `<option value="${c}" ${fxTo === c ? 'selected' : ''}>${E.CURS[c].icon} ${E.CURS[c].name}</option>`).join('')}</select></label><label class="small">المبلغ <input type="number" id="fxAmt" min="0" step="any" value="" placeholder="0" style="width:120px"></label><button class="sm" data-act="fxpct" data-q="25">٢٥٪</button><button class="sm" data-act="fxpct" data-q="50">٥٠٪</button><button class="sm" data-act="fxpct" data-q="100">الكل</button><button class="pri" data-act="fxdo">حوّل</button></div><div id="fxPrev" class="small" style="min-height:22px">أدخل مبلغاً لترى ما ستستلمه.</div>
    <div class="row"><button class="sm" data-act="fxall" data-f="usd" data-t="sar" ${w.usd > 0 ? '' : 'disabled'}>كل الدولار ← ريال</button><button class="sm" data-act="fxall" data-f="au" data-t="sar" ${w.au > 0 ? '' : 'disabled'}>كل الذهب ← ريال</button><button class="sm" data-act="fxall" data-f="sar" data-t="usd" ${w.sar > 0 ? '' : 'disabled'}>كل الريال ← دولار</button></div>
    <p class="small muted">الرسم ١٪ بين الريال والدولار و١٫٥٪ للذهب. وإن اشتريت في بلد أجنبي بلا رصيد دولار يُحوَّل لك تلقائياً من محافظك الأخرى برسم الصرافة ٠٫٥٪ زيادة. الذهب لا يدرّ فائدة، لكنه يغلو في الحروب. ورسوم الصرافة المدفوعة حتى الآن: <b class="num">${fmt(S.player.led.exp.exchange || 0)}</b> ريال.</p></div>`;
  } else if (ct === 'ledger') {
    const L = S.player.led, tr = o => Object.keys(o).sort((a, b) => o[b] - o[a]).map(k => `<div class="kv"><span>${LN[k] || k}</span><b class="num">${fmt(o[k])}</b></div>`).join('') || '<p class="small muted">—</p>';
    h += `<div class="grid g2"><div class="card"><h2>دخلك</h2>${tr(L.inc)}</div><div class="card"><h2>مصروفك</h2>${tr(L.exp)}</div></div><div class="card" style="margin-top:12px"><h2>صفقاتك الأخيرة</h2>${S.player.trades.slice(0, 12).map(t => `<div class="kv small"><span>يوم ${t.day} · ${gi(t.g)} ${GD[t.g].name} × ${f1(t.q)} · ${cityTag(t.city)} · ${t.side === 'shop' ? 'دكان' : 'بيع'}</span><b class="pl ${plCls(t.pl)} num">${sgn(t.pl)} ر.س</b></div>`).join('') || '<p class="small muted">لا صفقات بعد.</p>'}</div><div class="card" style="margin-top:12px"><h2>الثروة الصافية</h2><div style="color:var(--teal)">${spark(S.hist.nw, 520, 70)}</div></div><div class="card" style="margin-top:12px"><h2>مصارف العالم كلّه (أي تاجر)</h2><div class="row">${Object.keys(S.stats.sink).sort((a, b) => S.stats.sink[b] - S.stats.sink[a]).map(k => `<span class="pill">${LN[k] || k}: ${fmt(S.stats.sink[k])}</span>`).join('')}</div><h3>منابع من خارج التجارة</h3><div class="row">${Object.keys(S.stats.fauc).map(k => `<span class="pill">${LN[k] || k}: ${fmt(S.stats.fauc[k])}</span>`).join('') || '—'}</div></div>`;
  } else {
    h += `<div class="card"><p class="small">يشغّل المحاكاة آلياً ٨ بذور مع لاعب آلي، ويفحص الأسعار غير المنطقية، وانهيار المخزون أو امتلاءه، ونموّ الثروة، والمصارف.</p><div class="row"><button class="pri" data-act="stress">شغّل ١٠٠ يوم</button><button data-act="stress2">٣٠٠ يوم</button></div><div id="testOut">${testOut}</div></div>`;
  }
  return h;
}
function runStress(days) {
  $('testOut').innerHTML = '<p class="muted">جارٍ التشغيل…</p>';
  setTimeout(() => {
    const r = E.stressTest({ seeds: 8, days, bot: true }), s = r.summary;
    testOut = `<div class="kv"><span>أخطاء رقمية (NaN)</span><b class="${r.nan ? 'dear' : 'cheap'}">${r.nan}</b></div><div class="kv"><span>أدنى/أعلى سعر نسبياً</span><b class="num">${r.minRatio.toFixed(2)} – ${r.maxRatio.toFixed(2)}</b></div><div class="kv"><span>نفاد المخزون / امتلاؤه</span><b class="num">${s.floorPct}٪ / ${s.ceilPct}٪</b></div><div class="kv"><span>شبع السكان</span><b class="num">${Math.round(s.avgFoodSat * 100)}٪</b></div><div class="kv"><span>متوسط ذهب التاجر الآلي (بدأ ٦٠٠)</span><b class="num">${fmt(s.avgAgentGold)}</b></div><div class="kv"><span>ثروة اللاعب الآلي: متوسط / أدنى / أعلى</span><b class="num">${fmt(s.avgPlayerNW)} / ${fmt(s.minPlayerNW)} / ${fmt(s.maxPlayerNW)}</b></div><p class="small muted">أكبر المصارف: ${Object.keys(r.sinks).sort((a, b) => r.sinks[b] - r.sinks[a]).slice(0, 5).map(k => (LN[k] || k) + ' ' + fmt(r.sinks[k])).join('، ')}</p>`;
    if ($('testOut')) $('testOut').innerHTML = testOut;
  }, 30);
}

/* ---------- الجولة التعليمية ---------- */
const hasCargo = () => Object.keys(main().cargo).some(g => main().cargo[g] >= 1);
const sellKey = () => { const t = S.player.trades[0]; return t ? t.day + '|' + t.q + '|' + Math.round(t.net) : ''; };
function nearestDomestic() {
  const m = main(), c = S.cities[m.city];
  return S.order.filter(id => id !== m.city && S.cities[id].country === c.country).sort((a, b) => E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0];
}
function lastSellLine() {
  const t = S.player.trades.find(x => x.side === 'sell'); if (!t) return 'بعت وتعلّمت.';
  const cost = t.net - t.pl, pc = cost > 0 ? Math.round(100 * t.pl / cost) : 0;
  return t.pl >= 0 ? `آخر صفقة: <b class="cheap">ربحت ${fmt(t.pl)} ريال</b> (${pc}٪ على ما دفعت).` : `آخر صفقة: <b class="dear">خسرت ${fmt(-t.pl)} ريال</b>. لا بأس: الخسارة الأولى أرخص معلّم.`;
}
// أنسب صفقة للمبتدئ: من أفضل الصفقات داخل بلده أولاً (بلا جمارك)، وإلا الأفضل عموماً
function tutPlan() {
  if (S.tut.f.plan) return S.tut.f.plan;
  const m = main(), hc = S.cities[m.city].country, all = deals();
  const big = all.filter(o => o.q >= 3 && o.profit >= 50), pool = (big.length ? big : all.filter(o => o.q >= 3).length ? all.filter(o => o.q >= 3) : all).slice().sort((x, y) => (y.pct || 0) - (x.pct || 0)), dom = pool.filter(o => S.cities[o.d].country === hc), pick = dom[0] || pool[0];
  const plan = pick ? { g: pick.g, d: pick.d, q: pick.q, profit: Math.round(pick.profit), foreign: S.cities[pick.d].country !== hc } : { g: 'wheat', d: nearestDomestic(), q: 10, profit: 0, foreign: false };
  if (S.tut.i >= 1) S.tut.f.plan = plan; return plan;
}
// أفضل مدينة لبيع ما تحمله الآن (داخل البلد أولاً إن ربحت فيها)
function tutDest() {
  const m = main(), hc = S.cities[m.city].country, held = E.GIDS.filter(g => (m.cargo[g] || 0) >= 1).sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0];
  if (!held) return { d: nearestDomestic(), profit: 0 };
  const opts = E.sellOptions(S, m.city, held, Math.floor(m.cargo[held]), E.avgCost(m.basis, held) || E.mid(held), m);
  const dom = opts.filter(o => o.country === hc && o.profit > 0)[0], best = dom || opts[0];
  return { d: best.city, g: held, profit: Math.round(best.profit), foreign: best.country !== hc };
}
/* ---------- تظليل عمّ سالم: يدلّك على الزر المطلوب في المستويات ١–٣ ---------- */
let hlKey = '';
/* ---------- «مهمة عمّ سالم»: خطوة واحدة واضحة بزر ينفّذها فعلاً (متوافقة مع الخيارات) ---------- */
const restText = rs => `حقّق ${rs.k} صفقات رابحة${rs.home ? ' في ' + CD[rs.home].name : ''}${rs.gold ? ' وابلغ رصيداً ' + fmt(rs.gold) + ' ريال' : ''}${rs.plan ? ' وفعّل خطة ظافر' : ''}`;
const MIN_MARGIN = 0.15, LV_START = ['market', 'market', 'market', 'market', 'market', 'market', 'market', 'lords', 'market', 'market'];
const guideOn = () => { try { const lv = S.learn && S.learn.char && !NOLEARN ? lvlOf() : null; return !!lv && lv.mode === 'guide'; } catch (e) { return false; } };
const planOn = () => null;
function sellAll() {
  const m = main(); let tot = 0, n = 0;
  GIDS.forEach(x => { const k = Math.floor(m.cargo[x] || 0); if (k > 0) { const b = S.player.gold; const r = A.sell(S, m.id, x, k); if (r.ok) { n += k; tot += S.player.gold - b; } } });
  return act({ ok: n > 0, msg: n ? 'بعت ' + n + ' وحدة بصافي ' + fmt(tot) + ' ريال' : 'لا بضاعة للبيع' });
}
function travelTo(to) { const m = main(), r = A.travel(S, m.id, to); if (r.ok) { toast(r.msg); sel = m.city; leaveTo('map'); setSpeed(speed || 1); } else act(r); }
function cheapestGood() {
  const c = S.cities[main().city]; let best = null, br = 9;
  E.GIDS.forEach(g => { if (g === 'wheat' || !E.sells(c, g) || (c.stock[g] || 0) < 3) return; const r = E.ratio(c, g); if (r < br) { br = r; best = g; } });
  return best;
}
function pickDeal(foreign, excl, homeOnly) {
  const hc = S.cities[main().city].country;
  const all = deals().filter(o => (!foreign || S.cities[o.d].country !== hc) && (!homeOnly || S.cities[o.d].country === homeOnly) && !(excl && excl.includes(o.g))).sort((a, b) => b.pct - a.pct);
  return { good: all.find(o => o.pct >= MIN_MARGIN) || null, best: all[0] || null };
}
const mpct = v => Math.round(v * 100);
function dealMsg(o) {
  const m = main(), price = marketView(m.city).p[o.g], cost = o.q * price;
  return `اشترِ <b>${o.q} ${GD[o.g].name}</b> هنا وبِعها في <b>${cityName(o.d)}</b> (${o.days} أيام). تدفع ≈ ${fmt(Math.round(cost))} ريال وتربح ≈ <b class="cheap">${fmt(Math.round(o.profit))}</b>، أي <b>هامش ${mpct(o.pct)}٪</b>`;
}
function missionStep() {
  const L = S.learn; if (!L || !L.char || NOLEARN) return null;
  const rs = L.rest, lv = rs ? { n: 0, title: 'تمرين', mode: (lvlOf() || {}).mode, rest: rs } : lvlOf(); if (!lv) return null; const gl = rs ? [] : lv.goals(S); if (!rs && gl.every(g => g[1])) return null;
  const m = main(), ev = L.ev, M = L.m || (L.m = {}), cargo = hasCargo(), kinds = GIDS.filter(g => (m.cargo[g] || 0) >= 1), here = S.cities[m.city];
  const R = o => Object.assign({ lv, goals: gl }, o), nw = E.netWorth(S);
  if (m.left > 0) return R({ msg: `🐪 القافلة في الطريق إلى <b>${cityName(m.dest)}</b>، باقٍ ${m.left} أيام.`, why: 'أثناء السفر يمضي الوقت وتنقص المؤن.', label: speed ? '⏩ أسرع' : '▶ شغّل الوقت', run: () => setSpeed(speed ? 3 : 1) });
  const fd = S.player.famDebt;
  if (fd && fd.left > 0) {
    const need = Math.min(fd.left, Math.round(fd.amt0 * E.BAB.DEBT.installPct)) - (fd.mPaid || 0);
    if (rs && rs.plan && !fd.plan) return R({ msg: 'فعّل <b>خطة ظافر</b>: من كل صفقة رابحة ٧٠٪ لرأس مالك، و٢٠٪ للحاج صالح، و١٠٪ لحصّالتك.', why: 'هكذا سدّد ظافر ديونه وبنى ثروته في وقت واحد.', label: '📜 فعّل الخطة', run: () => act(A.debtPlan(S, true)) });
    if (fd.due != null && fd.due - S.day <= 5 && need > 0 && S.player.gold >= need + 100) return R({ msg: `اقترب موعد قسط الحاج صالح (بعد ${Math.max(0, fd.due - S.day)} أيام): ادفع <b>${fmt(Math.round(need))} ريال</b>.`, why: 'الوفاء بالقسط يرفع صبر الدائن وثقته بك.', label: `💳 ادفع القسط ${fmt(Math.round(need))}`, run: () => act(A.debtPay(S, need)) });
  }
  const gate = { 7: 2, 9: 3, 10: 4 }[lv.n], PH = E.PHASE_AT; let note = '';
  if (gate && S.phase < gate) note = `ثروتك ${fmt(Math.round(nw))} ومطلوب ${fmt(PH[gate - 1])} لفتح هذه الخطوة. واصل الصفقات لتنمو.`;
  // خطوات المستويات الخاصة (بعد فتح الطور)
  if (!note) {
    if (lv.n === 6 && !ev.exchange) { const w = S.player.wallet, from = w.sar >= 50 ? 'sar' : 'usd', to = from === 'sar' ? 'usd' : 'sar', amt = from === 'sar' ? 50 : Math.max(1, Math.floor(w.usd * 0.3)); return R({ msg: `حوّل <b>${amt} ${E.CURS[from].name}</b> إلى ${E.CURS[to].name} لتجرّب الصرف.`, why: 'لكل تحويل رسم صغير، وهذا ما يُسمّى سعر الصرف.', label: '💱 حوّل الآن', run: () => act(A.exchange(S, from, to, amt)) }); }
    if (lv.n === 7) {
      if (!ev.buildShop) return R({ msg: `ابنِ <b>دكاناً</b> في ${cityName(m.city)}.`, why: 'الدكان يفتح لك مخزناً تحفظ فيه بضاعتك.', label: '🏬 ابنِ دكاناً هنا', run: () => act(A.buildShop(S, m.city)) });
      if (!ev.toStore) { if (!cargo) { const g = cheapestGood(), q = g ? Math.min(6, Math.floor(S.player.gold / (E.unitPrice(here, g) * 1.05))) : 0; if (g && q >= 1) return R({ msg: `اشترِ ${q} ${GD[g].name} لتودعها في المخزن.`, label: `🛒 اشترِ ${q}`, run: () => act(A.buy(S, m.id, g, q)) }); } else { const g = kinds[0]; return R({ msg: `أودع <b>${GD[g].name}</b> في مخزنك لتنتظر سعراً أفضل.`, why: 'المخزون الذكي يدور ولا يتكدّس.', label: '📦 أودع في المخزن', run: () => act(A.toStore(S, m.id, g, Math.min(3, Math.floor(m.cargo[g])))) }); } }
    }
    if (lv.n === 8 && !ev.signPact) {
      for (const id of S.order) for (const t of Object.keys(E.PACTS)) if (!E.pactBlock(S, id, t)) { const tm = E.pactTerms(S, id, t); return R({ msg: `وقّع <b>${E.PACTS[t].name}</b> مع زعيم ${cityName(id)}. المقدّم ${fmt(tm.upfront)} ريال.`, why: 'الشراكة تعطيك ميزة مقابل التزامك، فاقرأ الشروط.', label: '🤝 وقّع الشراكة', run: () => act(A.signPact(S, id, t)) }); }
    }
    if (lv.n === 9 && !ev.agentBuy) {
      for (const id of S.order) for (const g of GIDS) { if (g !== 'wheat' && E.sells(S.cities[id], g)) { const q = E.agentQuote(S, id, g, 5); if (q.ok) return R({ msg: `اطلب <b>5 ${GD[g].name}</b> من ${cityName(id)} عبر وكيلك. الرسم ${fmt(Math.round(q.fee))} ريال.`, why: 'الوكيل يشتري عنك ويصل المخزن بعد أيام.', label: '📜 اطلب عبر الوكيل', run: () => act(A.agentBuy(S, id, g, 5)) }); } }
      return R({ msg: 'تحتاج مخزناً في إحدى مدنك ليصل إليه طلب الوكيل: ابنِ دكاناً أولاً.', label: '🏬 ابنِ دكاناً هنا', run: () => act(A.buildShop(S, m.city)) });
    }
    if (lv.n === 10) {
      if (!ev.borrow) return R({ msg: 'اقترض <b>5000 ريال</b> من المصرف لتجرّب الائتمان.', why: 'القرض يضخّم الربح ويضخّم الخسارة، فاحذر.', label: '🏦 اقترض 5000', run: () => act(A.borrow(S, 5000)) });
      if (!ev.repay) return R({ msg: 'سدّد قرضك الآن ولا تؤخّره.', label: '✅ سدّد القرض', run: () => act(A.repay(S)) });
    }
  }
  // دورة الصفقة: شراء ← سفر ← بيع
  if (cargo) {
    if (M.dest && m.city !== M.dest) {
      if (lv.n === 5 && !ev.mixed && kinds.length < 2 && m.city === M.from) { const d2 = pickDeal(false, kinds.concat(L.goods || [])).best || pickDeal(false, kinds).best; if (d2) { const q2 = Math.max(1, Math.min(4, d2.q)); return R({ msg: `نوّع قافلتك: أضف <b>${q2} ${GD[d2.g].name}</b> مع بضاعتك قبل السفر.`, why: 'التنويع يحميك إن هبط سعر سلعة واحدة.', label: `🛒 أضف ${q2} ${GD[d2.g].name}`, run: () => act(A.buy(S, m.id, d2.g, q2)) }); } }
      return R({ msg: `سافر إلى <b>${cityName(M.dest)}</b> لتبيع بضاعتك بأفضل ربح.`, label: `🐪 سافر إلى ${cityName(M.dest)}`, run: () => travelTo(M.dest) });
    }
    if (!M.dest && lv.n !== 1) { // اشترى يدوياً: نختار له أفضل مكان للبيع
      const g = kinds.sort((a, b) => m.cargo[b] * E.mid(b) - m.cargo[a] * E.mid(a))[0], o = E.sellOptions(S, m.city, g, Math.floor(m.cargo[g]), E.avgCost(m.basis, g) || E.mid(g), m)[0];
      if (o) return R({ msg: `أفضل مكان تبيع فيه <b>${GD[g].name}</b>: <b>${cityName(o.city)}</b> (ربح متوقع ≈ ${fmt(Math.round(o.profit))} ريال).`, label: `🐪 سافر إلى ${cityName(o.city)}`, run: () => { M.dest = o.city; M.from = m.city; travelTo(o.city); } });
    }
    return R({ msg: lv.n === 1 ? `بِع بضاعتك هنا لترى كيف يُحسب الربح أو الخسارة. الربح الكبير يأتي من بيعها في سوق آخر بسعر أعلى، وهذا ما سنفعله بعد قليل.` : `وصلتَ! بِع بضاعتك هنا.`, why: 'سيظهر لك الصافي بعد الضريبة والجمارك.', label: '💰 بِع كل البضاعة', run: () => { M.dest = null; M.from = null; sellAll(); } });
  }
  // لا بضاعة: خطوة الشراء
  M.dest = null;
  if (lv.n === 1) {
    const g = cheapestGood(); if (!g) return R({ msg: 'لا أرى سلعة مناسبة في هذا السوق الآن، جرّب مدينة أخرى.', label: '⏭ يوم جديد', run: () => $('bNext').click() });
    const price = E.unitPrice(here, g), ref = E.refPrice(here, g), room = Math.floor((E.capOfCar(m) - E.loadOf(m)) / GD[g].w), q = Math.max(1, Math.min(5, room, Math.floor(S.player.gold / (price * 1.05))));
    const rr = price / ref, tag = rr < 0.85 ? `أرخص من المرجعي بـ${mpct(1 - rr)}٪ 🟢` : rr > 1.15 ? 'أغلى من المرجعي 🔴' : 'قريبة من المرجعي ⚪';
    return R({ msg: `اشترِ <b>${q} ${GD[g].name}</b>: سعرها اليوم ${f1(price)} والسعر المرجعي (العادي) ${f1(ref)}، فهي ${tag}.`, why: 'السعر المرجعي هو سعرها الأساسي العادي في السوق.', label: `🛒 اشترِ ${q} ${GD[g].name}`, run: () => { const r = A.buy(S, m.id, g, q); act(r); } });
  }
  if (rs && rs.home && here.country !== rs.home) { const back = S.order.filter(id => S.cities[id].country === rs.home).sort((a, b) => E.tripDays(S, m, m.city, a) - E.tripDays(S, m, m.city, b))[0]; return R({ msg: `التمرين في <b>${CD[rs.home].name}</b>: عُد إلى ${cityName(back)} وكرّر صفقاتك الصغيرة هناك.`, why: 'نتقن السوق القريب أولاً قبل أن نغامر بعيداً.', label: `🐪 عُد إلى ${cityName(back)}`, run: () => travelTo(back) }); }
  const hOnly = rs && rs.home ? rs.home : null;
  let pd = pickDeal(lv.n === 4, lv.n === 5 ? (L.goods || []) : null, hOnly); if (!pd.good && !pd.best) pd = pickDeal(lv.n === 4, null, hOnly);
  const d = pd.good || pd.best;
  if (!d) return R({ note, msg: 'لا أرى صفقة رابحة من هذه المدينة اليوم. انتظر يوماً لتتغير الأسعار أو انتقل لمدينة أخرى.', label: '⏭ انتظر يوماً', run: () => $('bNext').click() });
  const honest = pd.good ? '' : `لا صفقة بهامش ${mpct(MIN_MARGIN)}٪ أو أكثر اليوم؛ هذه أعلى ما عندي (${mpct(d.pct)}٪). جرّبها أو انتظر يوماً.`;
  const split = lv.n === 5 && !ev.mixed;
  return R({ note, msg: (lv.n === 4 ? 'صفقة <b>إلى دولة أخرى</b> (الجمارك محسوبة): ' : '') + dealMsg(d), why: honest || 'هامش الربح = ما تربحه لكل ١٠٠ ريال تدفعها. أبقيتُ لك مؤن الطريق.', label: split ? '🛒 اشترِ هنا' : '🛒🐪 اشترِ وسافر', run: () => { M.dest = d.d; M.from = m.city; if (split) act(A.buy(S, m.id, d.g, d.q)); else dealGo(d.g, d.d, d.q); } });
}
function restHTML(rs) {
  const g = S.player.gold, row = (ok, t) => `<div class="lgoal ${ok ? 'ok' : ''}"><span class="gk"></span><span>${t}</span></div>`;
  return `<div>${row(rs.w >= rs.k, `صفقات رابحة${rs.home ? ' في ' + CD[rs.home].name : ''}: ${Math.min(rs.w, rs.k)} من ${rs.k}`)}${rs.gold ? row(g >= rs.gold, `رصيدك ${fmt(Math.round(g))} من ${fmt(rs.gold)} ريال`) : ''}${rs.plan ? row(!!(S.player.famDebt && (S.player.famDebt.plan || S.player.famDebt.left <= 0)), 'فعّل خطة ظافر ٧٠/٢٠/١٠') : ''}</div>`;
}
const COMPACT_SCREENS = ['cities', 'estate', 'empire', 'lords', 'academy', 'caravan'];
function missionCard() {
  const st = missionStep(); if (!st) return '';
  const lv = st.lv, cp = COMPACT_SCREENS.includes(screen);
  if (cp) return `<div class="card mission compact" id="mission"><div class="msay">${mentorAv('teach')}<div style="flex:1;min-width:0"><b>عمّ سالم</b> <span class="small muted">· ${lv.rest ? 'تمرين قبل المستوى ' + (lv.rest.n + 1) : 'مهمة المستوى ' + lv.n}</span><div class="bub">${st.msg}</div></div></div>${st.label ? `<button class="btn big" data-act="mrun">${st.label}</button>` : ''}</div>`;
  return `<div class="card mission" id="mission"><div class="msay">${mentorAv('teach')}<div style="flex:1;min-width:0"><b>عمّ سالم</b> <span class="small muted">· ${lv.rest ? 'تمرين قبل المستوى ' + (lv.rest.n + 1) : 'مهمة المستوى ' + lv.n + ': ' + lv.title}</span><div class="bub">${st.msg}</div>${st.why ? `<div class="small muted" style="margin-top:4px">${st.why}</div>` : ''}${st.note ? `<div class="small" style="margin-top:4px">ℹ️ ${st.note}</div>` : ''}</div></div>${lv.rest ? restHTML(lv.rest) : goalsHTML(lv)}${st.label ? `<button class="btn big" data-act="mrun">${st.label}</button>` : ''}${lv.rest ? '<button class="btn ghost sm" data-act="restskip">أنا جاهز للدرس التالي</button>' : ''}${lv.mode === 'guide' ? `<button class="btn ghost sm" data-act="mfull">${ui.full ? 'إخفاء الخيارات الإضافية' : 'إظهار كل الخيارات'}</button>` : ''}</div>`;
}
function missionInline() {
  const st = missionStep(); if (!st || !st.label) return '';
  return `<div class="card mission inline"><div class="small">${st.msg}</div><button class="btn big" data-act="mrun">${st.label}</button></div>`;
}
function mentorTarget() {
  const L = S.learn; if (!L || !L.char || NOLEARN || learnNext()) return null;
  const lv = lvlOf(); if (!lv || lv.mode !== 'guide') return null;
  const st = missionStep(); if (!st || !st.label) return null;
  return dg ? '#modal [data-act="mrun"]' : '#mission [data-act="mrun"]';
}
function placeSpot() {
  const sp = $('spot'); if (!sp) return; const n = document.querySelector('.tut-hl');
  if (!n || !S) { sp.hidden = true; return; }
  const r = n.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) { sp.hidden = true; return; }
  sp.style.left = (r.left - 6) + 'px'; sp.style.top = (r.top - 6) + 'px'; sp.style.width = (r.width + 12) + 'px'; sp.style.height = (r.height + 12) + 'px'; sp.hidden = false;
  sp.dataset.side = r.bottom + 90 < innerHeight ? 'below' : 'above';
}
window.addEventListener('scroll', () => placeSpot(), { passive: true, capture: true }); window.addEventListener('resize', () => placeSpot());
function renderSpot() {
  document.querySelectorAll('.tut-hl').forEach(n => n.classList.remove('tut-hl'));
  const q = mentorTarget(), n = q && document.querySelector(q);
  if (n) { n.classList.add('tut-hl'); const hk = q + '|' + screen + '|' + (dg ? 1 : 0); if (hlKey !== hk) { hlKey = hk; try { n.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {} } }
  setTimeout(placeSpot, 30);
}

/* ---------- العرض ---------- */
const RENDER = { home: screenHome, map: screenMap, market: screenMarket, caravan: screenCaravan, estate: screenEstate, empire: screenEmpire, lords: screenLords, cities: screenCities, academy: screenAcademy };
let lastLeft = null;
function renderAll(force) {
  { // وصول القافلة الرئيسية: الانتقال إلى سوق المدينة التي وصلتها
    const mc = main();
    if (lastLeft !== null && lastLeft > 0 && mc.left === 0) {
      sel = mc.city; dg = null; force = true; toast('وصلت إلى ' + S.cities[mc.city].name + ' 🏪');
      if (screen !== 'market') { screen = 'market'; try { history.pushState(null, '', '#market'); } catch (e) { location.hash = 'market'; } window.scrollTo(0, 0); }
    }
    lastLeft = mc.left;
  }
  renderHeader();
  if (!force && pressing) { dirty = true; return; }
  renderNav();
  const ae = document.activeElement, scr = $('screen');
  if (!force && ae && /^(SELECT|INPUT)$/.test(ae.tagName) && ae.type !== 'checkbox' && scr.contains(ae)) return;
  if (!force && screen === 'cities' && ct === 'test') return;
  if (!force && (screen === 'estate' || screen === 'empire') && ae && scr.contains(ae)) return;
  $('journeyBar').innerHTML = journeyBar();
  scr.innerHTML = RENDER[screen]();
  if (force || !dg) renderModal();
  renderProfile();
  document.body.classList.toggle('guide-simple', guideOn() && !ui.full);
  renderSpot(); renderLesson(); renderReact(); renderAdvBtn();
  GameIcons.paint(document.body);
  dirty = false;
}
function scrollToTabs() {
  const el = document.querySelector('#screen .chips'); if (!el) return;
  const t = el.getBoundingClientRect().top;
  if (t < 0 || t > innerHeight * 0.45) window.scrollTo({ top: Math.max(0, t + scrollY - 12), behavior: 'smooth' });
}
function leaveTo(s) { screen = s; dg = null; try { history.pushState(null, '', '#' + s); } catch (e) {} window.scrollTo(0, 0); }

function dealGo(gd, to, want) {
  const m = main(), c0 = S.cities[m.city], cr0 = c0.country !== S.cities[to].country ? CD[S.cities[to].country].customs : 0;
  if (m.left > 0) return toast('القافلة في الطريق');
  const dd = E.tripDays(S, m, m.city, to), reserve = E.supplyNeed(m, dd) * E.unitPrice(c0, 'wheat') * 1.25 + 10;
  const room = Math.floor((E.capOfCar(m) - E.loadOf(m)) / GD[gd].w), afford = Math.floor((S.player.gold - reserve) / (E.unitPrice(c0, gd) * (1 + cr0 * 1.1)));
  const k = Math.max(0, Math.min(room, afford, want || 999));
  if (k < 1) return toast('رصيدك أو مساحة القافلة لا يكفي لهذه الصفقة');
  A.buy(S, m.id, gd, k);
  const r = A.travel(S, m.id, to);
  if (r.ok) { toast('اشتريت ' + k + ' ' + GD[gd].name + ' وانطلقت'); sel = m.city; dg = null; leaveTo('map'); setSpeed(speed || 1); } else act(r);
}
function fxPreview() {
  const el = $('fxPrev'); if (!el) return;
  const f = $('fxFrom').value, t = $('fxTo').value, amt = parseFloat($('fxAmt').value) || 0, w = S.player.wallet;
  if (f === t) { el.innerHTML = '<span class="dear">اختر عملتين مختلفتين</span>'; return; }
  const a = Math.min(amt, w[f]), val = a * E.rateOf(S, f), fee = val * E.feeOf(f, t), got = (val - fee) / E.rateOf(S, t);
  el.innerHTML = amt > w[f] ? `<span class="dear">رصيدك ${f === 'au' ? w[f].toFixed(3) : fmt(w[f])} فقط</span>` : `تدفع ${f === 'au' ? a.toFixed(3) : fmt(a)} ${E.CURS[f].name} ← تستلم <b>${t === 'au' ? got.toFixed(3) : fmt(got)}</b> ${E.CURS[t].name} · رسم ${fmt(fee)} ريال (${(E.feeOf(f, t) * 100).toFixed(1)}٪)`;
}
document.addEventListener('input', ev => { if (ev.target.id === 'fxAmt') fxPreview(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (prof) { prof = false; renderAll(true); } else if (dg) { dg = null; renderAll(true); } } });

function moveMap(dx, dy) {
  if (!mapVB || !mapBase) return;
  mapView.center = [mapVB[0] + mapVB[2] / 2 + dx, mapVB[1] + mapVB[3] / 2 + dy];
  mapVB = WM.viewport(mapBase, mapView.zoom, mapView.center);
  mapView.center = [mapVB[0] + mapVB[2] / 2, mapVB[1] + mapVB[3] / 2];
  if ($('map')) $('map').setAttribute('viewBox', mapVB.join(' '));
}
document.addEventListener('keydown', ev => {
  const target = ev.target.closest('#map'); if (!target) return;
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role=button]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
  if (dir) { ev.preventDefault(); moveMap(dir[0] * mapVB[2] * .15, dir[1] * mapVB[3] * .15); }
});
document.addEventListener('pointerdown', ev => {
  const svg = ev.target.closest('#map'); if (!svg || ev.button !== 0) return;
  mapDragged = false;
  mapDrag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, center: [mapVB[0]+mapVB[2]/2, mapVB[1]+mapVB[3]/2], width: svg.clientWidth, height: svg.clientHeight, box: mapVB.slice(), svg };
});
document.addEventListener('pointermove', ev => {
  if (!mapDrag || mapDrag.id !== ev.pointerId || mapView.zoom <= 1) return;
  const dx = ev.clientX - mapDrag.x, dy = ev.clientY - mapDrag.y;
  if (!mapDragged && Math.hypot(dx, dy) < 7) return;
  mapDragged = true;
  if (!mapDrag.svg.hasPointerCapture(ev.pointerId)) mapDrag.svg.setPointerCapture(ev.pointerId);
  mapView.center = [mapDrag.center[0] - dx / mapDrag.width * mapDrag.box[2], mapDrag.center[1] - dy / mapDrag.height * mapDrag.box[3]];
  mapVB = WM.viewport(mapBase, mapView.zoom, mapView.center); mapDrag.svg.setAttribute('viewBox', mapVB.join(' '));
});
function endMapDrag() { if (!mapDrag) return; const dragged = mapDragged; mapDrag = null; pressing = false; if (dragged && screen === 'map') renderAll(true); setTimeout(() => { mapDragged = false; }, 100); }
document.addEventListener('pointerup', endMapDrag);
document.addEventListener('pointercancel', endMapDrag);
// لا تختار مدينة بالخطأ بعد سحب الخريطة.
document.addEventListener('click', ev => { if (mapDragged && ev.target.closest('#mapbox')) { mapDragged = false; ev.preventDefault(); ev.stopImmediatePropagation(); } }, true);
let mapResize;
window.addEventListener('resize', () => { clearTimeout(mapResize); mapResize = setTimeout(() => { if (screen === 'map') renderAll(true); }, 120); });
document.addEventListener('toggle', ev => { if (ev.target.matches('.map-cities') && ev.target.isConnected) mapListOpen[mapC] = ev.target.open; }, true);

/* ---------- الأحداث ---------- */
document.addEventListener('pointerdown', () => { pressing = true; clearTimeout(document.__pt); document.__pt = setTimeout(() => { pressing = false; }, 1500); });
document.addEventListener('pointercancel', () => { pressing = false; if (dirty) renderAll(false); });
document.addEventListener('change', ev => {
  const i = ev.target; if (!i || !i.classList || !i.classList.contains('qin')) return;
  const mx = +i.dataset.max || 1, v = clampQ(i.value, mx), k = i.dataset.k; if (k === 'm') dq = v; else QS[k] = v; renderAll(true);
});
document.addEventListener('click', ev => {
  pressing = false;
  if (ev.target.closest('.home-brand h1, #hName')) { const now = Date.now(); devTaps = devTaps.filter(x => now - x < 4000); devTaps.push(now); if (devTaps.length >= 7) { devTaps = []; devGate(); } }
  const t = ev.target.closest('[data-go],[data-city],[data-ct],[data-act],[data-mc],[data-mf],[data-ec],[data-ee],[data-estcity],[data-estcity2],[data-gd],[data-dq],[data-lc],[data-lcity]'); if (!t) { if (ev.target.id === 'modal') { dg = null; renderAll(true); return; } if (dirty) renderAll(false); return; }
  const d = t.dataset;
  if (/^dev/.test(d.act || '') && !devMode && d.act !== 'devcheck' && d.act !== 'devcancel') return;
  if (d.act === 'mapzoom') { mapView.zoom = Math.max(1, Math.min(4, mapView.zoom * (+d.d > 0 ? 1.5 : 1/1.5))); return renderAll(true); }
  if (d.act === 'mapreset') { mapView = { zoom: 1, center: null }; return renderAll(true); }
  if (d.act === 'maphere') {
    const cr = main(); sel = cr.left > 0 ? cr.dest : cr.city;
    mapC = cr.left > 0 ? 'all' : S.cities[cr.city].country;
    const a = S.cities[cr.from || cr.city], b = S.cities[cr.dest || cr.city], t = cr.left > 0 ? 1 - cr.left / Math.max(1, cr.total) : 0;
    mapView = { zoom: cr.left > 0 ? 2 : 1, center: cr.left > 0 ? [a.x+(b.x-a.x)*t, a.y+(b.y-a.y)*t] : null };
    return renderAll(true);
  }
  if (d.go) return go(d.go);
  if (d.city) { sel = d.city; if (screen === 'map' && mapC === 'all' && innerWidth < 600) { mapC = S.cities[sel].country; mapView = { zoom: 1, center: null }; } if (S.tut && screen === 'map') S.tut.f.picked = sel; return renderAll(true); }
  if (d.ct) { ct = d.ct; if (S.tut && ct === 'fx') S.tut.f.fx = true; renderAll(true); return scrollToTabs(); }
  if (d.mc) { mapC = d.mc; mapView = { zoom: 1, center: null }; if (mapC !== 'all' && S.cities[sel].country !== mapC) sel = citiesOf(mapC)[0] || sel; return renderAll(true); }
  if (d.mf) { mf = d.mf; return renderAll(true); }
  if (d.gd) { dg = d.gd; const pl = planOn(); dq = pl && pl.g === d.gd ? pl.q : 10; return renderAll(true); }
  if (d.dq) { dq = d.dq; return renderAll(true); }
  if (d.ec) { estC = d.ec; estCity = citiesOf(estC)[0]; return renderAll(true); }
  if (d.ee) { empC = d.ee; estCity = citiesOf(empC)[0]; return renderAll(true); }
  if (d.lc) { lordC = d.lc; lordCity = citiesOf(lordC)[0]; return renderAll(true); }
  if (d.lcity) { lordCity = d.lcity; return renderAll(true); }
  if (d.estcity) { estCity = d.estcity; return renderAll(true); }
  if (d.estcity2) { estCity = d.estcity2; return renderAll(true); }
  const a = d.act, cr = car(), g = d.g, q = +d.q, m = main();
  switch (a) {
    case 'agent': return act(A.agentBuy(S, sel, g, q));
    case 'qin': return;
    case 'qstep': { const mx = +d.max || 1, k = d.k; const cur = k === 'm' ? (dq === 'max' ? mx : +dq || 1) : (QS[k] == null ? (k.startsWith('d:') ? (deals().find(o => 'd:' + o.g + ':' + o.d === k) || { q: 1 }).q : 1) : QS[k]); const nv = clampQ(cur + (+d.d), mx); if (k === 'm') dq = nv; else QS[k] = nv; return renderAll(true); }
    case 'buy': return act(A.buy(S, m.id, g, q));
    case 'sell': return act(A.sell(S, m.id, g, q));
    case 'go': return travelTo(d.to);
    case 'play': return setSpeed(1);
    case 'guideoff': guideOff = true; try { localStorage.setItem('darb-guide-off', '1'); } catch (e) {} return renderAll(true);
    case 'mrun': { const st = missionStep(); if (st && st.run) st.run(); return; }
    case 'mfull': ui.full = !ui.full; return saveUi();
    case 'help': help = true; return renderAll(true);
    case 'sellall': return sellAll();
    case 'dealgo': return dealGo(d.g, d.d, +d.q || 999);
    case 'dealgo2': return dealGo(d.g, d.d, +d.q || 999);
    case 'gdclose': dg = null; return renderAll(true);
    case 'openfx': ct = 'fx'; return go('cities');
    case 'navtog': ui.nav = !ui.nav; return saveUi();
    case 'toptog': ui.top = !ui.top; return saveUi();
    case 'install': return doInstall();
    case 'restskip': S.learn.rest = null; E.learnCheck(S); return renderAll(true);
    case 'lstart': { const r = A.chooseStart(S, g); toast(r.msg); return lseq(s => { s.i++; }); }
    case 'lchar': return act(A.learnSetChar(S, g));
    case 'profile': prof = true; return renderAll(true);
    case 'pclose': prof = false; if (d.go) return go(d.go); return renderAll(true);
    case 'pgo': prof = false; return go(g);
    case 'pask': prof = false; { const lv = lvlOf(); if (lv) view = { k: 'view', lvl: lv.n }; else adv = true; } return renderAll(true);
    case 'evch': return eventAction(g);
    case 'wset': return act(A.setWish(S, ($('wishamt') || {}).value));
    case 'dopen': prof = false; dview = true; return renderAll(true);
    case 'debt': dview = true; return renderAll(true);
    case 'dpay': { const r = A.debtPay(S, +d.q); act(r); if (r.msg) showCharacterReply('creditor', r.ok === false ? 'reserved' : 'accepted', r.msg); return; }
    case 'dplan': return act(A.debtPlan(S, d.g === '1'));
    case 'vbreak': return act(A.vaultBreak(S));
    case 'zopen': prof = false; zview = true; return renderAll(true);
    case 'zpay': return act(A.zakatPay(S, +($('zamt') || {}).value));
    case 'zdefer': return act(A.zakatDefer(S));
    case 'advisor': prof = false; adv = true; advTab = d.g || advTab; return renderAll(true);
    case 'advtab': advTab = g; return renderAll(true);
    case 'advmute': S.learn.advMute = !S.learn.advMute; return renderAll(true);
    case 'advgo': adv = false; return go(g);
    case 'lclose': return learnClose();
    case 'lnext': return lseq(q => { q.i++; });
    case 'lrep': return lseq(q => { q.rep[q.i] = +g; });
    case 'lans': return lseq(q => { const b = beatsOf(learnNext())[q.i].quiz, st = q.ans[q.i] || (q.ans[q.i] = { bad: [], done: false }); if (+g === b.ok) st.done = true; else { st.bad.push(+g); if (st.bad.length >= 2) st.done = true; } });
    case 'lview': view = { k: 'view', lvl: +g }; return renderAll(true);
    case 'fxdo': { const amt = parseFloat($('fxAmt').value); return act(A.exchange(S, $('fxFrom').value, $('fxTo').value, amt)); }
    case 'fxall': return act(A.exchange(S, d.f, d.t, S.player.wallet[d.f]));
    case 'fxpct': { const f = $('fxFrom').value; $('fxAmt').value = (S.player.wallet[f] * (+d.q) / 100).toFixed(f === 'au' ? 3 : 0); return fxPreview(); }
    case 'selcar': carSel = +d.id; return renderAll(true);
    case 'cart': return act(A.buyCart(S, cr.id));
    case 'crew': return act(A.hireCrew(S, cr.id));
    case 'guard': return act(A.hireGuard(S, cr.id));
    case 'cartc': return act(A.buyCart(S, +d.id));
    case 'guardc': return act(A.hireGuard(S, +d.id));
    case 'work': return act(A.work(S));
    case 'hire': return act(A.hireCaptain(S));
    case 'bshop': return act(A.buildShop(S, estCity));
    case 'bwh': return act(A.buildWarehouse(S, estCity));
    case 'isave': { const sid = +d.s; return act(A.shopSetItem(S, estCity, sid, g, (+$('ip' + sid + '_' + g).value || 100) / 100, $('ia' + sid + '_' + g).checked)); }
    case 'irm': return act(A.shopRemoveItem(S, estCity, +d.s, g));
    case 'iadd': { const sid = +d.s; return act(A.shopSetItem(S, estCity, sid, $('ig' + sid).value, (+$('ipn' + sid).value || 105) / 100, true)); }
    case 'fromstore': return act(A.fromStore(S, m.id, g, 999));
    case 'tostore': return act(A.toStore(S, m.id, g, 999));
    case 'estcity': estCity = d.c; estC = S.cities[estCity].country; return go('estate');
    case 'route': { const id = +d.id, a1 = $('ra' + id).value, b1 = $('rb' + id).value; if (a1 === b1) return toast('اختر مدينتين مختلفتين'); return act(A.setRoute(S, id, { a: a1, b: b1, buyA: $('rba' + id).value || null, buyB: $('rbb' + id).value || null })); }
    case 'factory': return act(A.buildFactory(S, d.c, d.r));
    case 'dep': return act(A.deposit(S, sel, q));
    case 'wd': return act(A.withdraw(S, sel, q));
    case 'borrow': return act(A.borrow(S, q));
    case 'repay': return act(A.repay(S));
    case 'bond': return act(A.buyBond(S));
    case 'upg': return act(A.upgradeMarket(S, sel));
    case 'found': return act(A.foundCity(S, $('fcZone').value, $('fcGood').value));
    case 'viewcity': sel = d.c; mapC = S.cities[sel].country; mapView = { zoom: 1, center: null }; return go('map');
    case 'tolord': lordCity = d.c; lordC = S.cities[lordCity].country; return go('lords');
    case 'lobby': return bossAction(() => A.lobby(S, lordCity, q), 'lobby');
    case 'gift': return bossAction(() => A.gift(S, lordCity), 'gift');
    case 'nego': return bossAction(() => A.negotiate(S, lordCity, d.k), 'nego');
    case 'sign': return bossAction(() => A.signPact(S, lordCity, d.k), 'sign');
    case 'breakp': return bossAction(() => A.breakPact(S, lordCity), 'breakp');
    case 'viewmarket': sel = d.c; leaveTo('market'); return renderAll(true);
    case 'dev1': S.player.gold += 10000; persist(); return renderAll(true);
    case 'dev2': S.player.gold += 50000; persist(); return renderAll(true);
    case 'dev3': for (let i = 0; i < 20; i++) E.tick(S); persist(); return renderAll(true);
    case 'dev100': for (let i = 0; i < 100; i++) { E.tick(S); S.pause = false; } persist(); return renderAll(true);
    case 'devlvl': return devLevel(+($('devLv') || {}).value || 1);
    case 'devunlock': return devUnlock();
    case 'devdebt': { const fd = S.player.famDebt; if (!fd || fd.left <= 0) return toast('لا دَين'); if (S.player.gold < fd.left) S.player.gold = fd.left + 100; return act(A.debtPay(S, Math.ceil(fd.left))); }
    case 'devcheck': return devCheck();
    case 'devcancel': { const g = $('devgate'); if (g) g.hidden = true; return; }
    case 'devoff': return setDev(false);
    case 'devnew': { const b = $('devNew'); if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'اضغط للتأكيد (تفقد الحالية)'; return; } delete b.dataset.sure; b.textContent = 'لعبة جديدة'; S = E.newGame(Date.now() % 100000 + 1); sel = 'riyadh'; carSel = 1; mapC = 'all'; mapView = { zoom: 1, center: null }; mapListOpen = {}; persist(); $('dev').hidden = true; setSpeed(0); return go('home'); }
    case 'stress': return runStress(100);
    case 'stress2': return runStress(300);
  }
});
document.addEventListener('change', ev => {
  if (ev.target.id === 'fxFrom') { fxFrom = ev.target.value; if (fxTo === fxFrom) fxTo = ['sar', 'usd', 'au'].find(c => c !== fxFrom); renderAll(true); return; }
  if (ev.target.id === 'fxTo') { fxTo = ev.target.value; fxPreview(); return; }
  if (ev.target.id === 'pctBox') { pct = ev.target.checked; renderAll(true); }
  if (ev.target.id === 'insBox') { A.insure(S, car().id, ev.target.checked); renderAll(true); }
});
/* ---------- وضع المطوّر (للمالك فقط) ----------
   لمس الشعار ٧ مرات خلال ٤ ثوانٍ ثم رمز سري. يُحفظ الجزء المُشفَّر (SHA-256) لا الرمز نفسه، وتبقى الحالة على الجهاز.
   هذه حماية للواجهة لا أكثر: اللعبة بلا خادم، ومن فتح أدوات المتصفح يستطيع تعديل حالته أصلاً. */
const DEV_SALT = 'darb-dev-v1', DEV_HASH = 'e4180f7326f3fd0c011f5782435c176fac4eb38f8d1020cf25410f39b9dd4767', DEV_KEY = 'darb-dev';
let devMode = false, devTaps = [], devFails = 0;
try { devMode = localStorage.getItem(DEV_KEY) === DEV_HASH; } catch (e) {}
function setDev(on) {
  devMode = !!on; try { on ? localStorage.setItem(DEV_KEY, DEV_HASH) : localStorage.removeItem(DEV_KEY); } catch (e) {}
  document.body.classList.toggle('dev', devMode);
  if (devMode) window.__game = GAME; else { if (!navigator.webdriver) delete window.__game; $('dev').hidden = true; if (ct === 'test') ct = 'cities'; }
  renderAll(true);
}
function devGate() {
  if (devMode) { $('dev').hidden = false; return; }
  if (devFails >= 5) return toast('مقفل لبقية هذه الجلسة');
  let el = $('devgate'); if (!el) { el = document.createElement('div'); el.id = 'devgate'; el.className = 'modal'; document.body.appendChild(el); }
  el.hidden = false; el.innerHTML = `<div class="mbox" style="max-width:320px;margin:auto"><b>رمز المطوّر</b><input id="devcode" type="password" dir="ltr" autocomplete="off" autocapitalize="characters" style="width:100%;margin:10px 0;padding:10px;font-size:16px"><div class="row"><button class="btn" data-act="devcheck">دخول</button><button class="btn ghost" data-act="devcancel">إلغاء</button></div><div class="small" id="devmsg" style="margin-top:6px"></div></div>`;
  setTimeout(() => { const i = $('devcode'); if (i) i.focus(); }, 60);
}
function devCheck() {
  const v = (($('devcode') || {}).value || '').trim().toUpperCase();
  if (E.sha256hex(DEV_SALT + ':' + v) === DEV_HASH) { $('devgate').hidden = true; setDev(true); $('dev').hidden = false; return toast('وضع المطوّر مفعّل على هذا الجهاز'); }
  devFails++; const m = $('devmsg'); if (m) m.textContent = devFails >= 5 ? 'مقفل لبقية هذه الجلسة' : 'رمز غير صحيح (' + devFails + ' من ٥)';
  if (devFails >= 5) setTimeout(() => { const g = $('devgate'); if (g) g.hidden = true; }, 900);
}
function devLevel(n) {
  const L = S.learn; if (!L || !L.char) return toast('اختر الشخصية أولاً');
  L.level = Math.max(1, Math.min(11, n)); L.intro = L.level; L.rest = null; L.hold = 0; ['up', 'sq', 'bq', 'csq', 'tq', 'fq', 'eq', 'rq'].forEach(k => { if (L[k]) L[k].length = 0; });
  const need = { 7: 2, 9: 3, 10: 4 }[L.level]; if (need && S.phase < need) S.player.gold = Math.max(S.player.gold, E.PHASE_AT[need - 1] + 3000);
  persist(); toast('القفز إلى المستوى ' + L.level); renderAll(true);
}
function devUnlock() {
  const L = S.learn; if (!L || !L.char) return toast('اختر الشخصية أولاً'); E.loreFix(L);
  L.tab = Object.keys(E.BAB.TABLETS); S.order.forEach(id => { if (E.LORE.BOSS_LORE[id]) L.lore[id] = 3; if (E.LORE.CITY_SECRETS[id] && !L.csec.includes(id)) L.csec.push(id); });
  E.COUNTRIES.forEach(c => { if (!L.secrets.includes(c.id)) L.secrets.push(c.id); }); E.learnPerks(S); persist(); toast('فُتحت كل الألواح والأسرار وفصول الزعماء'); renderAll(true);
}
$('bPause').onclick = () => setSpeed(0);
$('b1').onclick = () => setSpeed(1); $('b2').onclick = () => setSpeed(2); $('b3').onclick = () => setSpeed(3);
$('bNext').onclick = () => { speed = 0; clearInterval(timer); step(); renderAll(true); };
$('bDev').onclick = () => { $('dev').hidden = !$('dev').hidden; };
window.addEventListener('beforeunload', persist);

boot();
{ const h = location.hash.replace('#', ''); screen = SCREENS.some(x => x[0] === h) ? h : 'home'; }
renderAll(true);
const GAME = { get S() { return S; }, E, setSpeed, go, renderAll };
if (navigator.webdriver || devMode) window.__game = GAME;
document.body.classList.toggle('dev', devMode);
GameIcons.start();
})();
