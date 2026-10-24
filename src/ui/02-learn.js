/* ---------- التعليم: عمّ سالم والمستويات والأكاديمية ---------- */
// الألقاب (اسم الشخصية ووصفها) تُكتسب مع التقدم: قبل المستوى 4 يظهر «تاجر ناشئ» دون لقب
const TITLE_LEVEL = 4, titleEarned = () => !!(S && S.learn && S.learn.level >= TITLE_LEVEL), charTitle = ch => (ch && titleEarned() ? ch.name : 'تاجر ناشئ'), charTag = ch => (ch && titleEarned() ? ch.tag : '');
const LSN = E.LS, MEN = new Proxy(LSN.MENTOR, { get: (base, key) => E.mentorOf(S)[key] ?? base[key] });
const NOLEARN = (() => { try { return navigator.webdriver && !/learn=1/.test(location.search); } catch (e) { return false; } })();
const SALEM_MOODS = { happy: 0, cheer: 1, proud: 2, sad: 3, thinking: 4, worried: 5, teach: 4 };
const mentorAv = (m = 'happy') => {
  if (E.mentorOf(S).id === 'mentor2') { const mood = m === 'cheer' ? 'celebrate' : m === 'teach' ? 'thinking' : m; return `<span class="mav m-${m}">${pic('hero/mentor2_' + mood, 'av dialogue-portrait', MEN.name) || pic(MEN.img, 'av', MEN.name)}</span>`; }

  if (m === 'teach' && ART['expressions/salem/teach']) return `<span class="mav m-teach">${pic('expressions/salem/teach', 'av dialogue-portrait', MEN.name)}</span>`;
  const index = SALEM_MOODS[m] ?? 0;
  const portrait = ART['hero/salem_expressions']
    ? `<span class="pic av salem-portrait cutout" style="--salem-x:${index % 3};--salem-y:${Math.floor(index / 3)}"><img src="${ART['hero/salem_expressions']}" alt="${MEN.name}" draggable="false"></span>`
    : pic(MEN.img, 'av', MEN.name);
  return `<span class="mav m-${m}">${portrait}</span>`;
};
const lvlOf = () => { const st = E.stageOf(S); return st ? Object.assign({}, st, { n: st.source, stage: st.n }) : (S.learn.level <= 10 ? LSN.LEVELS[S.learn.level - 1] : null); };
let cview = null, cardAns = null;
/* نص الحديث في الأدلة يسبقه «قال رسول الله ﷺ» ما لم يكن منسوباً في نصه (الآيات وأقوال الصحابة والروايات الفعلية تبقى كما هي) */
const hadithQ = d => /^(رواه|متفق)/.test(d.s) && !/ﷺ|رسول|قال|قيل|النبي(?!ين)/.test(d.q) ? 'قال رسول الله ﷺ: «' + d.q + '»' : d.q;
/* في الاختبارات الآلية لا تظهر بطاقات الفقه والدليل تلقائياً (حتى لا تحجب النقرات) إلا مع ?cards=1 */
const cardsOn = () => { try { return !navigator.webdriver || /[?&]cards=1/.test(location.search); } catch (e) { return true; } };
function cardHTML(n) {
  const C = E.CARDS.CARDS[n.id], T = E.CARDS.TRACKS[C.track]; if (!cardAns || cardAns.id !== n.id) cardAns = { id: n.id, bad: [], done: false };
  const q = C.quiz, st = cardAns, need = !!q && !n.view && !st.done;
  const dl = (C.dalil || []).length ? `<div class="card dalil">${C.dalil.map(d => `<div class="dl"><div>${esc(hadithQ(d))}</div><div class="small muted">— ${esc(d.s)}</div></div>`).join('')}</div>` : '';
  const qh = q ? `<div class="card cq"><b>${esc(q.q)}</b>${q.o.map((t, i) => `<button class="btn ghost cqo ${st.done && i === q.ok ? 'right' : st.bad.includes(i) ? 'wrong' : ''}" data-act="cqa" data-g="${i}" ${st.done ? 'disabled' : ''}>${esc(t)}</button>`).join('')}${st.done ? `<div class="small" style="margin-top:6px"><b>أحسنت.</b> ${esc(q.why)}</div>` : st.bad.length ? '<div class="small muted" style="margin-top:6px">ليست هذه الإجابة، فكّر مرة أخرى.</div>' : ''}</div>` : '';
  return `<div class="lbox"><div class="lhead"><div><div class="small muted">${esc(T)}</div><h2 style="margin:0">${esc(C.title)}</h2></div></div>${C.who === 'harbor' ? harborSay(C.say) : mentorSay(C.say, 'teach')}<div class="lesson">${C.text.map(p => `<p>${esc(p)}</p>`).join('')}</div>${dl}${C.tip ? `<div class="card"><b>${esc(C.tip)}</b></div>` : ''}${qh}${C.track === 'f' ? `<div class="small muted" style="margin:6px 0">${esc(E.CARDS.NOTE)}</div>` : ''}<button class="btn" data-act="lclose" ${need ? 'disabled' : ''}>${n.view ? 'إغلاق' : 'فهمت'}</button></div>`;
}
function learnNext() {
  if ((S && S.life && S.life.pending) || agingView) return null;
  if (S && S.learn && !S.learn.char && !storyGo) return null; // مربع الحكاية أولاً
  if (S && (S.road || roadRes || (S.story && S.story.cur))) return null; // طبقة واحدة: الطريق والحوار قبل الدروس
  if (coverOn) return null; // الغلاف أولاً: لا عمّ سالم قبل الضغط على «ابدأ الرحلة»
  if (help) return { k: 'help' };
  if (!S.learn) return null;
  if (!S.learn.char) return NOLEARN ? null : { k: 'char' };
  if (NOLEARN) return null;
  const L = S.learn;
  if (L.datePend) return { k: 'start' };
  if (L.stageUp && L.stageUp.length) return { k: 'stageup', stage: L.stageUp[0] };
  if (L.up.length) return { k: 'up', lvl: L.up[0] };
  const Z = S.zakat;
  if (Z && (zview || (Z.due && (!Z.defer || S.day >= Z.defer)))) return { k: 'zakat' };
  if (Z && Z.start != null && !L.zseen) return { k: 'zlesson' };
  if (!S.awayJob && !S.awayReport && S.climate && S.climate.pending.length) return { k:'climate', year:S.climate.pending[0] };
  if (L.fq && L.fq.length) return { k: 'debtfree' };
  if (L.tq && L.tq.length) return { k: 'tablet', id: L.tq[0] };
  if (cview) return { k: 'card', id: cview, view: true };
  if (cardsOn() && L.cq && L.cq.length) return { k: 'card', id: L.cq[0] };
  if (L.eq && L.eq.length) return { k: 'event', id: L.eq[0].id };
  if (dview && S.player.famDebt) return { k: 'debt' };
  if (calview) return { k: 'cal' };
  if (adv && L.level > 10) return { k: 'advisor' };
  if (L.sq.length) return { k: 'secret', cc: L.sq[0] };
  if (L.bq && L.bq.length) return { k: 'boss', c: L.bq[0].c, n: L.bq[0].n };
  if (L.csq && L.csq.length) return { k: 'csecret', id: L.csq[0] };
  if (L.ageStages && E.stageOf(S) && !E.stageStatus(S).waiting && (L.stageIntro || 0) < E.stageOf(S).n && !(E.STAGES.find(x => x.source === L.level).n === E.stageOf(S).n && L.intro >= L.level)) return { k: 'intro', lvl: L.level, stage: E.stageOf(S).n };
  if (!L.ageStages && L.level <= 10 && L.intro < L.level && !L.rest) return { k: 'intro', lvl: L.level };
  if (view) return view;
  return null;
}
let view = null, calview = false, dview = false, zview = false, prof = false, adv = false, advTab = 'deal', help = false;
const goalsHTML = lv => lv.goals(S).map(g => `<div class="lgoal ${g[1] ? 'ok' : ''}"><span class="gk"></span><span>${g[0]}</span></div>`).join('');
const lessonHTML = lv => lv.lesson.map(p => `<p>${p}</p>`).join('');
const lockNote = to => { const tb = E.travelBlock(S, main(), to); return tb ? `<div class="qnote lock">🔒 ${tb}</div>` : ''; };
const addr = t => { const n = S && S.player && S.player.name; return typeof t === 'string' ? (n ? t.replace(/يا ولدي/g, 'يا ' + esc(n)).replace(/\{اسم\}/g, esc(n)) : t.replace(/\{اسم\}/g, 'ولدي')) : t; };
function harborSay(txt) { const im = ART['hero/sea_harbor_master']; return `<div class="msay">${im ? '<img class="av harbor" src="' + im + '" alt="الشاهبندر">' : '<span class="av">⚓</span>'}<div><b>الشاهبندر</b><span class="small muted"> · ناظر الميناء</span><div class="bub">${addr(txt)}</div></div></div>`; }
function mentorSay(txt, m) { return `<div class="msay">${mentorAv(m)}<div><b>${MEN.name}</b><span class="small muted"> · ${MEN.role}</span><div class="bub">${addr(txt)}</div></div></div>`; }
let seq = null;
const seqId = n => n.k === 'char' ? 'welcome' : n.k === 'intro' ? 'intro' + n.lvl + ':' + (n.stage || 0) : n.k;
function beatsOf(n) {
  if (n.k === 'char') { const w = LSN.WELCOME; return w.slice(0, -1).concat([{ startpick: true }, { namepick: true }, w[w.length - 1], { picker: true }]); }
  if (n.k === 'zlesson') { const z = LSN.ZAKAT_LESSON; return [{ say: z.intro }].concat(z.lesson.map(t => ({ say: t })), z.quiz.map(q => ({ quiz: q })), [{ zend: true }]); }
  const lv = n.stage ? E.STAGES[n.stage - 1] : LSN.LEVELS[n.lvl - 1];
  return [{ say: lv.intro }].concat(lv.lesson.map(t => ({ say: t })), lv.quiz.concat(n.stage && n.stage > 6 ? [] : (BV().QUIZ[n.lvl] || [])).map(q => ({ quiz: q })), [{ task: true }]);
}
const dots = (i, n) => `<div class="dots">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join('')}</div>`;
function beatHTML(n, beats) {
  const i = seq.i, b = beats[i], last = i === beats.length - 1, lv = n.lvl ? (n.stage ? E.STAGES[n.stage - 1] : LSN.LEVELS[n.lvl - 1]) : null, zl = n.k === 'zlesson' ? LSN.ZAKAT_LESSON : null;
  let h = '';
  if (b.startpick) return `<div class="lbox wide">${dots(i, beats.length)}${mentorSay('كان لجدّك قوافل في كل الدول. من أي دولة تحب أن تبدأ؟ ابدأ حيث تشعر بالألفة، وكوّن ثروتك فيها أولاً حتى تشتدّ، ثم نمضي إلى بقية الدول.', 'teach')}<div class="chars">${E.COUNTRIES.map(ct => { const c = S.cities[E.START_OF[ct.id]], mk = c.makes.map(g => GD[g].name).join('، '); return `<div class="char"><div style="font-size:42px;text-align:center">${ct.flag}</div><h3>${ct.name}</h3><div class="muted small">تبدأ من ${esc(c.name)}</div><p class="small">تُنتج: ${mk}</p><div class="small muted">${ct.id === 'sa' ? 'عملتك الريال' : 'عملتك الدولار'}</div><button class="btn" data-act="lstart" data-g="${ct.id}">ابدأ من ${ct.name}</button></div>`; }).join('')}</div></div>`;
  if (b.namepick) return `<div class="lbox">${dots(i, beats.length)}${mentorSay('قبل أن نمضي يا ولدي: ما اسمك؟ اكتب اسمك الحقيقي، فهو الذي سأناديك به. أما لقبك في الأسواق (التاجر المتجول مثلاً) فستختاره بعد قليل.', 'happy')}<div class="row" style="margin-top:10px"><input id="pname" type="text" maxlength="16" autocomplete="off" placeholder="اسمك" value="${esc((S.player && S.player.name) || '')}" style="flex:1;min-width:0;font-size:18px;padding:10px 12px;border-radius:12px;border:1px solid var(--line)"><button class="btn" data-act="lname">هذا اسمي</button></div></div>`;
  if (b.picker) return `<div class="lbox wide">${dots(i, beats.length)}${mentorSay('اختر شخصيتك، ولكل واحدة ميزة تناسب طريقها. وسأرافقك مهما اخترت. أما الألقاب فتكتسبها بتقدّمك في المستويات.')}<div class="chars">${LSN.CHARS.map((c, ci) => `<div class="char">${pic(c.img + E.charArtStage(S), 'cimg', 'الطريق ' + ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][ci])}<h3>الطريق ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][ci]}</h3><p class="small">${c.desc}</p><ul>${c.perksText.map(x => `<li>${x}</li>`).join('')}</ul><div class="small muted">يتعمّق في: ${c.focus}</div><button class="btn" data-act="lchar" data-g="${c.id}">اختر هذا الطريق</button></div>`).join('')}</div></div>`;
  const head = zl ? `<div class="lhead"><span class="lnum">${zl.icon}</span><div><div class="small muted">درس خاص</div><h2 style="margin:0">${zl.title}</h2></div></div>` : lv ? `<div class="lhead"><span class="lnum">${lv.icon}</span><div><div class="small muted">${n.stage ? "المرحلة " + n.stage + " من " + E.STAGES.length : "المستوى " + n.lvl + " من 10"} · ${LSN.MODE_NAMES[lv.mode]}</div><h2 style="margin:0">${lv.title}</h2></div></div>` : '';
  h = `<div class="lbox">${head}${dots(i, beats.length)}${i === 0 && lv && lv.bridge ? `<p class="card stage-bridge">${esc(lv.bridge)}</p>` : ''}`;
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
  if (!n) { el.hidden = true; el.innerHTML = ''; delete el.dataset.kind; return; }
  { const kd = n.k + (n.stage ? ':' + n.stage : n.lvl ? ':' + n.lvl : n.id ? ':' + n.id : n.c ? ':' + n.c + '.' + n.n : n.cc ? ':' + n.cc : ''); if (el.dataset.kind !== kd) { el.dataset.kind = kd; if (navigator.webdriver) (window.__lt = window.__lt || []).push(kd); } }
  if (salemOpen) { salemOpen = false; $('salemPanel').hidden = true; $('hSalem').setAttribute('aria-expanded', 'false'); }
  let h = '';
  if (n.k === 'char' || n.k === 'intro' || n.k === 'zlesson') {
    const id = seqId(n); if (!seq || seq.id !== id) seq = { id, i: 0, ans: {}, rep: {} };
    h = beatHTML(n, beatsOf(n));
  } else {
    seq = null;
    if (n.k === 'help') h = helpHTML();
    else if (n.k === 'advisor') h = advisorHTML();
    else if (n.k === 'stageup') { const st = E.STAGES[n.stage - 1]; h = `<div class="lbox"><h2>أتممت المرحلة ${st.n}: ${st.title}</h2>${mentorSay(st.done, 'proud')}<p>مكافأة: ${st.reward} ريال</p>${st.story && st.source <= 10 ? storyCard(st.source) + babCard(st.source) : ''}<button class="btn" data-act="lclose">متابعة</button></div>`; }
    else if (n.k === 'zakat') h = zakatHTML();
    else if (n.k === 'up') { if (lvSnd !== n.lvl) { lvSnd = n.lvl; sfx('levelup'); }
      const lv = LSN.LEVELS[n.lvl - 1], last = n.lvl === 10;
      h = `<div class="lbox"><div class="lhead"><span class="lnum">🎉</span><div><div class="small muted">أتممتَ المستوى ${n.lvl}</div><h2 style="margin:0">${lv.title}</h2></div></div>${mentorSay(lv.done, 'cheer')}${STING[lv.n] ? `<p class="sting">${STING[lv.n]}</p>` : ''}<div class="card">مكافأة: <b>+${lv.reward} ريال</b> و<b>${Math.max(1, Math.round(lv.reward / 50))} من مؤن السفر</b>${last ? '<div style="margin-top:6px">🎓 تخرّجتَ! ومن الآن ' + esc(MEN.name) + ' <b>مستشارك الخاص</b>: يظهر لك زر 💬 تسأله منه عن الصفقات والسوق والمخاطر والزكاة، وتجد دروسك دائماً في «الأكاديمية».</div>' : `<div style="margin-top:6px">${S.learn.rest ? '🏋️ قبل الدرس القادم تمرّن: <b>' + restText(S.learn.rest) + '</b>' : ''}<div>الدرس القادم: <b>${LSN.LEVELS[n.lvl].icon} ${LSN.LEVELS[n.lvl].title}</b></div></div>`}</div>${storyCard(n.lvl)}${babCard(n.lvl)}<button class="btn" data-act="lclose">${last ? 'شكراً يا ' + esc(MEN.name) : 'التالي'}</button></div>`;
    } else if (n.k === 'secret') { sfx('magic');
      const sc = LSN.SECRETS[n.cc], ct = E.COUNTRIES.find(x => x.id === n.cc);
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${sc.icon}</span><div><div class="small muted">سرّ تجاري · ${ct.flag} ${ct.name}</div><h2 style="margin:0">${sc.title}</h2></div></div>${mentorSay('هذا سرّ تعلّمته من أهل هذه البلاد يا ولدي:', 'teach')}<div class="lesson"><p>${sc.text}</p></div><div class="card">🎁 ميزة جديدة: <b>${sc.perk}</b></div><button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'event') h = eventHTML(L0());
    else if (n.k === 'debt') h = debtHTML();
    else if (n.k === 'start') h = startHTML();
    else if (n.k === 'cal') h = calHTML();
    else if (n.k === 'debtfree') {
      const f = E.BAB.DEBT.free;
      h = `<div class="lbox"><div class="lhead"><span class="lnum">🕊️</span><div><div class="small muted">دَين الجدّ</div><h2 style="margin:0">${f.title}</h2></div></div>${mentorSay(f.say, 'cheer')}<div class="card">🎁 ميزة دائمة: <b>${f.perk}</b></div><button class="btn" data-act="lclose">الحمد لله</button></div>`;
    } else if (n.k === 'card') {
      h = cardHTML(n);
    } else if (n.k === 'tablet') {
      const t = BV().TABLETS[n.id];
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${t.icon}</span><div><div class="small muted">لوح حكمة من ${BV().CITY}</div><h2 style="margin:0">${t.title}</h2></div></div>${mentorSay('وجدتُ في الدفتر لوحاً يوافق ما فعلتَ يا ولدي:', 'teach')}<div class="lesson"><p>${t.text}</p></div><div class="card">🎁 جائزة: <b>+${t.reward} ريال</b> و<b>${Math.max(1, Math.round(t.reward / 100))} من مؤن السفر</b></div><button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'climate') {
      const r=S.climate.hist.find(r=>r.year===n.year); h=`<div class="lbox">${climateReportHTML(r)}<button class="btn" data-act="climateclose" data-g="${r.year}">حفظ التقرير ومتابعة</button></div>`;
    } else if (n.k === 'boss') {
      const lo = E.LORE.BOSS_LORE[n.c], bs = S.bosses[n.c], ch = lo.ch[n.n - 1];
      const extra = n.n === 2 ? `<div class="card">👤 طبعه: <b>${lo.trait}</b><br>يحبّ: ${lo.likes}<br>يكره: ${lo.dislikes}</div>` : n.n === 3 ? `<div class="card">💡 نصيحة عمّ سالم: <b>${lo.tip}</b><br><span class="small muted">${E.LORE.STYLES[lo.style].name}: ${E.LORE.STYLES[lo.style].effect}</span></div>` : '';
      h = `<div class="lbox"><div class="lhead">${bossPortrait(n.c, 'av', n.n === 3 ? 'accepted' : 'neutral', true) || '<span class="lnum">📜</span>'}<div><div class="small muted">حكاية الزعيم · ${esc(cityName(n.c))} · الفصل ${n.n} من 3</div><h2 style="margin:0">${esc(bs.father ? bs.father.name : bs.name)}: ${ch.t}</h2></div></div>${mentorSay(n.n === 1 ? 'تعرّف على الرجل الذي يحكم هذا السوق يا ولدي:' : n.n === 2 ? 'بدأ الرجل يرتاح لك، فاسمع ما عرفته عنه:' : 'صرتَ من أصحابه، وهذه حكايته كما رواها لي:', n.n === 3 ? 'proud' : 'teach')}<div class="lesson"><p>${ch.x}</p></div>${extra}<button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'csecret') {
      const sc = E.LORE.CITY_SECRETS[n.id], c = S.cities[n.id], ct = CD[c.country];
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${sc.icon}</span><div><div class="small muted">سرّ السوق · ${ct.flag} ${esc(c.name)}</div><h2 style="margin:0">${sc.title}</h2></div></div>${mentorSay('عرفتَ هذا السوق جيداً الآن، فاسمع سرّه:', 'teach')}<div class="lesson"><p>${sc.text}</p><p><b>الدرس:</b> ${sc.lesson}</p></div><div class="card">🎁 ميزة جديدة: <b>${sc.perkText}</b></div><button class="btn" data-act="lclose">حسناً</button></div>`;
    } else if (n.k === 'view') {
      const lv = LSN.LEVELS[n.lvl - 1];
      h = `<div class="lbox"><div class="lhead"><span class="lnum">${lv.icon}</span><div><div class="small muted">المستوى ${n.lvl}</div><h2 style="margin:0">${lv.title}</h2></div></div><div class="lesson">${lessonHTML(lv)}</div><div class="card task"><b>المهمة:</b> ${lv.task}<div style="margin-top:6px">${goalsHTML(lv)}</div></div><button class="btn" data-act="lclose">إغلاق</button></div>`;
    }
  }
  const key = JSON.stringify(n) + (n.k === 'event' && S.learn.eq[0] ? '|' + S.learn.eq[0].pick : '') + advTab + JSON.stringify(seq) + (n.k === 'card' ? JSON.stringify(cardAns) : '') + (S.learn.char || '') + (n.k === 'start' ? JSON.stringify(stSel) : '') + (n.k === 'cal' ? S.day : '') + (n.k === 'intro' || n.k === 'view' ? lvlKey() : '') + (n.k === 'zakat' ? S.zakat.amount + '|' + S.zakat.due : '') + (n.k === 'debt' ? JSON.stringify(S.player.famDebt) + '|' + S.player.vault : '');
  if (el.dataset.k === key && !el.hidden) return;
  el.dataset.k = key; el.hidden = false; el.innerHTML = h; startTyping(el);
}
const lvlKey = () => { const lv = lvlOf(); return lv ? lv.goals(S).map(g => +g[1]).join('') : ''; };
const STORY_PEOPLE = { grandpa: 'جدّك', saeed: 'سعيد', imran: 'الحاج عمران', zafer: 'ظافر', saleh: 'الحكيم صادق في الحكاية', ghanem: 'غانم', suhail: 'سهيل' };
const barakaLine = b => { const t = E.barakaTier(S), nx = E.BARAKA_TIERS[t]; return t ? `الدرجة ${t} من ${E.BARAKA_TIERS.length}: نجاة القافلة من قطاع الطرق +${Math.round(E.barakaGuard(S) * 100)}٪` + (nx ? ` · التالية عند ${nx}` : '') : `أول درجة عند ${E.BARAKA_TIERS[0]} إجابات صحيحة`; };
const STING = (window.Stingers && window.Stingers.STINGERS) || {};
const STORY_ROLE = { grandpa: 'جدّك صاحب القافلة', saeed: 'كاتب فقير صار أغنى رجل في المدينة', imran: 'المقرض الذي علّمه', zafer: 'تاجر غرق في الدين ثم تحرّر', saleh: 'مقرض خبير يستشيره الناس', ghanem: 'جدّ سهيل', suhail: 'الحفيد' };
const STORY_CAST = { 1: ['saeed', 'imran'], 2: ['zafer'], 3: ['saeed'], 4: ['saeed'], 5: [], 6: ['saeed'], 7: ['saeed'], 8: ['saleh'], 9: ['saeed'], 10: ['ghanem', 'suhail'] };
const storyCast = (lv, grandfather = false) => `<div class="story-cast">${(grandfather ? ['grandpa'] : STORY_CAST[lv] || []).filter(id => art('story/' + id)).map(id => `<figure>${pic('story/' + id, 'story-face', STORY_PEOPLE[id])}<figcaption>${STORY_PEOPLE[id]}<small>${STORY_ROLE[id] || ''}</small></figcaption></figure>`).join('')}</div>`;
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
  }).join('') + `</div><h3 style="margin-top:16px">🗝️ أسرار الأسواق</h3><p class="muted small">يُكشف سرّ السوق حين تزوره مرتين وتبيع فيه بما يزيد على 1000 ريال (بعد المستوى 3).</p><div class="grid g3">` + S.order.filter(id => sc[id]).map(id => {
    const open = (L.csec || []).includes(id), cs = sc[id];
    return `<div class="card lv ${open ? 'done' : 'lock'}"><div class="row" style="margin:0"><span class="lnum">${open ? cs.icon : '🔒'}</span><b>${esc(cityName(id))}</b></div><div class="small" style="margin-top:4px">${open ? '<b>' + cs.title + '</b><br>' + cs.lesson : 'سرّ لم يُكتشف · زيارات ' + Math.min(2, (L.cv || {})[id] || 0) + '/2 · مبيعات ' + Math.min(1000, Math.round((L.cs || {})[id] || 0)) + '/1000'}</div></div>`;
  }).join('') + `</div>`;
  return h;
}
const storyCard = lv => { const st = LSN.storyOf(lv, S.home); return st ? `<div class="card story ${lv === 10 ? 'letter' : ''}"><b>📜 من ذكريات جدّك: ${st.t}</b>${storyCast(lv, true)}<p>${st.x}</p></div>` : ''; };
const storyBook = () => `<h3 style="margin-top:16px">📜 دفتر جدّك</h3><p class="muted small">حكايات جدّك التي رواها لك عمّ سالم كلما أتممتَ درساً.</p>` + (LSN.LEVELS.filter(lv => S.learn.level > lv.n).map(lv => { const st = LSN.storyOf(lv.n, S.home); return `<details class="card story"><summary><b>${st.t}</b></summary>${storyCast(lv.n, true)}<p>${st.x}</p></details>`; }).join('') || '<div class="card lv lock"><div class="small muted">أتمم الدرس الأول لتُفتح أول حكاية.</div></div>');
function lseq(fn) { if (seq) { fn(seq); renderAll(true); } }
function learnClose() {
  const n = learnNext(), L = S.learn; if (!n) return;
  if (n.k === 'stageup') { L.stageUp.shift(); if (n.stage <= 6 && L.up[0] === n.stage) L.up.shift(); } else if (n.k === 'up') L.up.shift(); else if (n.k === 'secret') L.sq.shift(); else if (n.k === 'boss') L.bq.shift(); else if (n.k === 'debt') dview = false; else if (n.k === 'cal') calview = false; else if (n.k === 'start') return; else if (n.k === 'debtfree') L.fq.shift(); else if (n.k === 'tablet') L.tq.shift(); else if (n.k === 'card') { if (n.view) cview = null; else L.cq.shift(); cardAns = null; } else if (n.k === 'csecret') L.csq.shift(); else if (n.k === 'intro') { L.intro = n.lvl; if (n.stage) L.stageIntro = n.stage; go(LV_START[n.lvl - 1] || 'market'); E.learnCheck(S); return; } else if (n.k === 'zlesson') L.zseen = 1; else if (n.k === 'zakat') zview = false; else if (n.k === 'advisor') adv = false; else if (n.k === 'help') help = false; else view = null;
  renderAll(true);
}
/* تعليقات عمّ سالم أثناء اللعب: فقاعة صغيرة غير معطّلة */
let rtimer = null;
function renderReact() {
  const L = S.learn, el = $('react'); if (!el || !L || !L.char || NOLEARN) return;
  if (!L.rq || !L.rq.length || learnNext() || fgOpen()) return;
  const k = L.rq.shift(), r = LSN.REACT[k], lv = lvlOf();
  if (L.rest && !['restStart', 'restDone', 'loss', 'broke', 'instSoon', 'instOk', 'instLate', 'wishDone', 'freedom'].includes(k)) return renderReact(); // أثناء التمرين الحر لا تعليقات إلا الضرورية
  const mode = S.legacy && S.legacy.retired ? (L.advMute ? 'off' : 'alert') : E.stageStatus(S)?.waiting ? 'alert' : lv ? lv.mode : (L.advMute ? 'off' : 'advisor');
  let txt = r && (Array.isArray(r.t) ? r.t[((L.rseen[k] || 1) - 1) % r.t.length] : r.t); if (txt) txt = txt.replace('{p}', (L.rp && L.rp[k]) || '');
  txt = E.mentorWisdom(S,k) || txt;
  if (S.legacy && S.legacy.retired && r && !r.alert && !['loss','broke','instLate','mdLate','wageLate','noSeller','defectFound'].includes(k)) return renderReact();
  if (k === 'back') txt = resumeText() || txt; // عودة اللاعب: ملخص من حالته الحالية فقط (لا يحرّك يوماً ولا رصيداً)
  const show = r && (r.always || mode === 'guide' || mode === 'hint' || (mode === 'alert' && r.alert) || (mode === 'advisor' && (r.adv || r.alert)));
  if (!show) return renderReact();
  (L.hist = L.hist || []).unshift({ d: S.day, t: txt, m: r.m || 'happy', who: MEN.name }); if (L.hist.length > 25) L.hist.length = 25; salemDot = true;
  el.innerHTML = `${mentorAv(r.m || 'happy')}<div><b>${MEN.name}</b><div class="react-say">${addr(txt)}</div></div>`; el.hidden = false; el.classList.add('show'); startTyping(el);
  { const tb = $('top'), bt = tb ? tb.getBoundingClientRect().bottom : 0; el.style.top = Math.max(12, Math.round(bt + 8)) + 'px'; }
  clearTimeout(rtimer); rtimer = setTimeout(() => { el.classList.remove('show'); el.hidden = true; }, k === 'back' ? 12000 : 7000);
}
/* ملخص العودة: القافلة ووجهتها وحمولتها وهدفك الحالي، كلها مقروءة من الحفظ */
function resumeText() {
  try {
    const m = main(), items = GIDS.filter(g => Math.floor(m.cargo[g] || 0) > 0).slice(0, 2).map(g => Math.floor(m.cargo[g]) + ' ' + GD[g].name);
    const where = m.left > 0 ? 'قافلتك في الطريق إلى ' + S.cities[m.dest].name + ' (باقٍ ' + dayAr(m.left) + ')' : 'قافلتك في ' + S.cities[m.city].name;
    const lv = lvlOf(), goal = lv && lv.goals ? (lv.goals(S).find(g => !g[1]) || [])[0] : '';
    return 'أهلاً بعودتك يا ولدي. ' + where + (items.length ? '، وتحمل ' + items.join(' و') : '، وهي فارغة') + '.' + (goal ? ' هدفك الحالي: ' + goal : '');
  } catch (e) { return ''; }
}
const R0 = v => fmt(Math.round(v));
function zakatTable(b) {
  return `<table class="ztab"><tr><td>النقد (الريال والدولار والذهب بسعر اليوم)</td><td>${R0(b.cash)}</td></tr><tr><td>البضاعة في القوافل بسعر السوق</td><td>${R0(b.goods)}</td></tr><tr><td>البضاعة في المخازن</td><td>${R0(b.store)}</td></tr>${b.orders ? `<tr><td>طلبات الوكيل في الطريق</td><td>${R0(b.orders)}</td></tr>` : ''}<tr><td>المضاربات والصكوك</td><td>${R0(b.deposits + b.bonds)}</td></tr><tr><td>الديون عليك (تُطرح)</td><td>− ${R0(b.debts)}</td></tr><tr class="tot"><td>الوعاء الخاضع للزكاة</td><td>${R0(b.base)}</td></tr><tr><td>النصاب (85 غرام ذهب × ${fmt(S.fx.gold)})</td><td>${R0(b.nisab)}</td></tr><tr><td class="small muted">للاطلاع: نصاب الفضة (595 غراماً × ${f1(S.fx.silver)})، وهو أقل بكثير لأن الفضة أرخص. اختلف العلماء في أيّ النصابين يُعتمد للنقود، والمعتمد في اللعبة نصاب الذهب</td><td class="small muted">${R0(b.nisabAg)}</td></tr><tr><td>النسبة (ربع العشر)</td><td>2.5٪</td></tr></table>`;
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
/* مجلس السوق: مشهد من كتاب البيوع بأعمار 10 إلى 15 سنة، ثم الحكم بكلمات بسيطة، وللكبار الدليل والخلاف. أشكال العرض: ذاتي، شاهد في الساحة، قضاء زعيم السوق */
const mjBoss = () => { const c = main().city, b = S.bosses && S.bosses[c]; return b ? { id: c, name: b.name } : null; };
const mjDetails = cs => `<details class="card story"><summary><b>للكبار والتفصيل</b></summary>${cs.full.ruling ? `<p><b>الحكم بنص المختص:</b> ${cs.full.ruling}</p>` : ''}<p><b>الدليل:</b> ${cs.full.evidence}</p><p><b>وجه الخلاف:</b> ${cs.full.khilaf}</p><p class="small muted">${E.FIQH.REF}</p></details>`;
function mjHTML(ev) {
  const cs = E.FIQH.CASES.find(x => x.id === ev.c); if (!cs) return '';
  const bs = cs.mode === 'council' ? mjBoss() : null, mode = bs ? 'council' : cs.mode === 'council' ? 'witness' : cs.mode;
  const face = bs ? bossPortrait(bs.id, 'av', 'neutral') : '', ico = face || '<span class="lnum">📜</span>';
  const head = `<div class="lhead">${ico}<div><div class="small muted">${mode === 'council' ? 'قضاء زعيم السوق' : mode === 'witness' ? 'شاهد في الساحة' : 'مجلس السوق'} · ${cs.bab}</div><h2 style="margin:0">${cs.title}</h2></div></div>`, note = `<div class="small muted" style="margin-top:8px">${E.FIQH.HEAD}</div>`;
  if (ev.pick == null) {
    const say = mode === 'council' ? `جلس ${esc(bs.name)} يقضي بين خصمين في السوق ودعاك إلى مجلسه. اقرأ ما جرى ثم اختر الحكم.` : mode === 'witness' ? 'كنا نمشي في الساحة يا ولدي فسمعنا نقاشاً بين تاجرين، وسألنا أحدهما عن رأينا. اقرأ ما جرى ثم اختر الحكم.' : 'اجلس معي في مجلس السوق يا ولدي، فقد عُرضت اليوم مسألة. اقرأها جيداً ثم اختر الحكم.';
    return `<div class="lbox">${head}${mentorSay(say, 'teach')}<div class="lesson"><p>${cs.scene}</p></div><div class="mjopts">${cs.opts.map((t, i) => `<button class="btn" data-act="evch" data-g="p${i}">${t}</button>`).join('')}</div>${note}</div>`;
  }
  const lead = mode === 'council' ? `قال ${esc(bs.name)}: «حكم الشريعة الذي استقر عليه أهل العلم هو:»` : 'بحسب ما قرره فقهاء المسلمين:';
  return `<div class="lbox">${head}${mentorSay(ev.right ? 'أحسنتَ يا ولدي! زادك الله علماً.' : 'لا بأس يا ولدي، المهم أن تعرف الحكم وتتعلمه.', ev.right ? 'cheer' : 'teach')}${ev.right ? '' : `<div class="qnote">اخترتَ: ${cs.opts[ev.pick]}</div>`}<div class="lesson"><p class="muted">${lead}</p><p><b>الحكم:</b> ${cs.ruling}</p><p><b>لماذا؟</b> ${cs.why}</p><p class="small"><b>معنى الكلمات:</b> ${cs.gloss}</p></div>${mjDetails(cs)}${ev.right ? '<div class="pill good">+1 بركة</div>' : ''}<button class="btn pri" data-act="evch" data-g="close">حسناً، أضفها إلى دفتر الأحكام</button>${note}</div>`;
}
function eventHTML(ev) {
  if (ev.id === 'mj') return mjHTML(ev);
  const btn = (g, t, cls) => `<button class="btn ${cls || ''}" data-act="evch" data-g="${g}">${t}</button>`;
  if (ev.id === 'broker') return `<div class="lbox"><div class="lhead">${actorPortrait('broker', 'neutral', 'event-face')}<div><div class="small muted">حدث في السوق</div><h2 style="margin:0">سمسار الثراء السريع</h2></div></div>${mentorSay('انتبه يا ولدي، رجل أنيق يقترب منك...', 'worried')}<div class="lesson"><p>يهمس لك أن تدفع مقدّماً قدره <b>${fmt(ev.dep)} ريال</b> وأنه يضمن لك ربحاً قدره 50٪ خلال عشرة أيام: «بلا أي مخاطرة!»</p></div><div class="opts">${btn('no', 'أرفض العرض')}${btn('ask', '🧓 أسأل ' + esc(MEN.name) + ' قبل أن أقرر')}${btn('yes', 'أدفع المقدّم', 'ghost')}</div></div>`;
  if (ev.id === 'friend') { const T = { secure: 'صديقك الصيرفي يطلب القرض، وعنده أرض وبيت قيمتهما أضعاف المبلغ.', worker: 'صانع ماهر طيّب السمعة في الوفاء بالعهود يطلب القرض ليشتري أدواته.', emotion: 'قريب لك يطلب القرض لمشروع لم يدرسه، ولم يسبق له أن حافظ على ما في يده.' }; return `<div class="lbox"><div class="lhead">${actorPortrait('friend', 'neutral', 'event-face')}<div><div class="small muted">حدث: قاعدة صالح</div><h2 style="margin:0">صديق يطلب قرضاً</h2></div></div>${mentorSay('هذا موقف علّمنا إياه صالح المقرض: انظر من يطلب قبل أن تعطي.', 'thinking')}<div class="lesson"><p>${T[ev.type]}</p><p>المبلغ المطلوب: <b>${fmt(ev.amt)} ريال</b> لمدة ثلاثين يوماً.</p></div><div class="opts">${btn('yes', 'أقرضه')}${btn('no', 'أعتذر بلطف', 'ghost')}</div></div>`; }
  const g = ev.g; return `<div class="lbox"><div class="lhead">${pic('hero/' + S.cities[ev.city].country, 'event-face', 'تاجر السوق')}<div><div class="small muted">حدث: فرصة في السوق</div><h2 style="margin:0">فرصة اليوم فقط</h2></div></div>${mentorSay('الحظ لمن استعدّ وبادر يا ولدي. انظر ما جاءك:', 'happy')}<div class="lesson"><p>تاجر ضاق به الحال يبيع <b>${GD[g].name}</b> في ${esc(cityName(ev.city))} بخصم 25٪ اليوم فقط. عندك رصيد يكفي لاقتناصها.</p></div><div class="opts">${btn('yes', 'أغتنم الفرصة')}${btn('no', 'أتركها', 'ghost')}</div></div>`;
}
const BV = () => E.babFor(S);
const babCard = lv => { const st = BV().STORY[lv], br = BV().BRIDGE && BV().BRIDGE[lv]; return st ? `<div class="card story"><b>🏺 من حكايات ${BV().CITY}: ${st.t}</b>${br ? `<p class="bridge">${br}</p>` : ''}${storyCast(lv)}<p>${st.x}</p></div>` : ''; };
/* ---------- تاريخ البداية والتقويم ---------- */
let stSel = { m: 'today', hy: 0, hm: 1, hd: 1 };
const todayJd = () => { const t = new Date(); return Math.max(E.CAL.MIN, E.CAL.gregToJd(t.getFullYear(), t.getMonth() + 1, t.getDate())); };
function startJd() {
  const t = todayJd();
  return stSel.m === 'muh' ? E.CAL.nextHijri(t, 1, 1) : stSel.m === 'ram' ? E.CAL.nextHijri(t, 9, 1) : stSel.m === 'cust' ? E.CAL.hijriToJd(stSel.hy, stSel.hm, stSel.hd) : t;
}
function startHTML() {
  const t = todayJd(), th = E.CAL.jdToHijri(t); if (!stSel.hy) { stSel.hy = th.y; stSel.hm = th.m; stSel.hd = th.d; }
  const opts = [['today', 'اليوم', t], ['muh', 'أول محرم القادم', E.CAL.nextHijri(t, 1, 1)], ['ram', 'أول رمضان القادم', E.CAL.nextHijri(t, 9, 1)]];
  const jd = startJd(), bad = jd < t || jd > E.CAL.MAX, sel = (a, b) => a === b ? ' selected' : '';
  const cust = stSel.m === 'cust' ? `<div class="card"><div class="small muted">اختر التاريخ الهجري:</div><div class="row"><select id="dhd" aria-label="اليوم">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}"${sel(i + 1, stSel.hd)}>${i + 1}</option>`).join('')}</select><select id="dhm" aria-label="الشهر">${E.CAL.HMONTHS.map((m, i) => `<option value="${i + 1}"${sel(i + 1, stSel.hm)}>${m}</option>`).join('')}</select><select id="dhy" aria-label="السنة">${Array.from({ length: 60 }, (_, i) => `<option value="${th.y + i}"${sel(th.y + i, stSel.hy)}>${th.y + i} هـ</option>`).join('')}</select></div></div>` : '';
  return `<div class="lbox wide"><div class="lhead"><span class="lnum">📅</span><div><div class="small muted">قبل أن تنطلق</div><h2 style="margin:0">متى تبدأ رحلتك؟</h2></div></div>${mentorSay('لكل موسم تجارته يا ولدي: لرمضان طلبه، وللحج حجيجه. اختر اليوم الذي تنطلق منه القافلة، وسأعلّمك مواعيد المواسم الصحيحة مع الأيام. والتاريخ الهجري هنا حسابي تقريبي، قد يخالف رؤية الهلال بيوم.', 'teach')}
  <div class="card"><div class="kv"><span>تاريخ اليوم على جهازك</span><b>${esc(E.CAL.jdStr(t))}</b></div></div>
  <div class="grid g3 startopts">${opts.map(([id, nm, j]) => `<button class="btn ${stSel.m === id ? '' : 'ghost'}" data-act="dsel" data-g="${id}" aria-pressed="${stSel.m === id}"><b>${nm}</b><br><span class="small">${esc(E.CAL.jdStr(j))}</span></button>`).join('')}<button class="btn ${stSel.m === 'cust' ? '' : 'ghost'}" data-act="dsel" data-g="cust" aria-pressed="${stSel.m === 'cust'}"><b>تاريخ مخصّص</b><br><span class="small">اختر شهراً وسنة</span></button></div>${cust}
  <div class="card ${bad ? 'bad' : 'good'}" id="startPrev">${bad ? 'اختر تاريخاً من اليوم فصاعداً.' : 'تنطلق قافلتك في <b>' + esc(E.CAL.jdStr(jd)) + '</b>'}</div>
  <div class="row"><button class="btn" data-act="datego"${bad ? ' disabled' : ''}>ابدأ الرحلة من هذا اليوم</button></div></div>`;
}
function calSeasons(d) {
  const L = S.learn, on = L && L.char && L.level >= 4, list = E.seasonCalendar(S).slice(0, 9), sac = E.isSacred(S);
  const row = x => { const t = x.now ? '' : E.CAL.jdStr(x.jd).split(' · '); return `<div class="srow"><b>${esc(x.name)}${x.info ? ' <span class="pill">أمان الطرق</span>' : ''}</b><div class="small ${x.now ? 'good-t' : 'muted'}">${x.now ? 'قائم الآن · تبقى ' + dayAr(x.left) + '' : 'بعد ' + dayAr(x.in) + ' · ' + esc(x.g ? t[1] : t[0])}</div></div>`; };
  return `<h3 style="margin-top:12px">🕌 مواسم التجارة</h3>${sac ? '<div class="card good small">نحن في الأشهر الحُرُم: تأمن القوافل في الجزيرة العربية ويقل خطر قطّاع الطرق.</div>' : ''}<div class="card">${list.map(row).join('')}</div>${on ? '' : '<div class="small muted">تؤثر المواسم في الأسعار من المستوى 4.</div>'}<div class="small muted">${esc(E.MARKETS_NOTE)}</div>`;
}
function calHTML() {
  const d = E.dateOf(S), c = S.cal || {}, h0 = E.CAL.jdToHijri(c.jd0 || E.CAL.MIN), log = S.yearLog || [], from = Math.max(1, d.year - 11);
  const rows = []; for (let n = d.year; n >= from; n--) {
    const st = E.CAL.hijriToJd(h0.y + n - 1, h0.m, h0.d), lg = log.find(x => x.n === n);
    rows.push(`<div class="card ${n === d.year ? 'lv cur' : 'lv done'}"><div class="row" style="margin:0"><b>${E.CAL.yearName(n)}</b><span class="spacer"></span>${n === d.year ? '<span class="pill good">الحالية</span>' : '<span class="pill">انتهت</span>'}</div><div class="small muted">بدأت في ${esc(E.CAL.jdStr(st))}</div>${n === d.year ? `${bar(d.dayInYear, d.yearLen, 'gold')}<div class="small">اليوم ${d.dayInYear} من ${d.yearLen}</div>` : lg ? `<div class="small">ثروتك في آخرها ≈ <b>${fmt(lg.nw)}</b> ريال</div>` : ''}</div>`);
  }
  return `<div class="lbox"><div class="lhead"><span class="lnum">📅</span><div><div class="small muted">تقويم رحلتك</div><h2 style="margin:0">${d.yname}</h2></div></div>
  <div class="card"><div class="kv"><span>التاريخ الهجري</span><b>${esc(d.hs)}</b></div><div class="kv"><span>التاريخ الميلادي</span><b>${esc(d.gs)}</b></div><div class="kv"><span>أيام الرحلة منذ الانطلاق</span><b>${S.day}</b></div></div>
  <div class="small muted">التاريخ الهجري في اللعبة حسابي تقريبي، وقد يختلف عن الرؤية الشرعية للهلال بيوم.</div>
  ${calSeasons(d)}
  <details class="card story"><summary><b>لماذا يتحرك رمضان في فصول السنة؟</b></summary><p>السنة الهجرية قمرية تعتمد على حركة الهلال، وعدد أيامها 354 أو 355 يوماً، وهي أقصر من السنة الميلادية الشمسية (365 يوماً) بنحو 11 يوماً؛ لذلك يدور شهر رمضان ومواسم الحج في كل فصول السنة، فنصوم تارة في الشتاء وتارة في الصيف.</p></details>
  <h3 style="margin-top:12px">📖 دفتر السنوات</h3><div class="grid g3 yearlist">${rows.join('')}</div>${d.year > 12 ? '<div class="small muted">تظهر آخر اثنتي عشرة سنة.</div>' : ''}
  <div class="row"><button class="btn" data-act="lclose">تمام</button></div></div>`;
}
function debtHTML() {
  const P = S.player, fd = P.famDebt, v = Math.round(P.vault || 0), B = E.BAB.DEBT, paidPct = Math.round((fd.amt0 - fd.left) / fd.amt0 * 100);
  const need = Math.max(0, Math.min(fd.left, Math.round(fd.amt0 * B.installPct)) - (fd.mPaid || 0)), left = fd.due != null ? Math.max(0, fd.due - S.day) : null;
  const say = fd.left <= 0 ? 'أنت حرّ من الدَّين يا ولدي، وهذه حصّالتك تكبر.' : fd.plan ? 'خطتك قائمة: سبعون لرأس مالك، وعشرون للحاج صالح، وعشرة لحصّالتك من كل صفقة رابحة. واصل.' : 'هذه خطة ظافر: من كل صفقة رابحة سبعون في المئة لرأس مالك، وعشرون للدائن، وعشرة لنفسك. فعّلها وسنخرج من الدَّين معاً.';
  return `<div class="lbox"><div class="lhead">${actorPortrait('creditor', fd.left <= 0 ? 'accepted' : fd.patience < 50 ? 'reserved' : fd.plan ? 'thinking' : 'neutral', 'event-face')}<div><div class="small muted">دَين الجدّ · ${esc(B.creditor)}</div><h2 style="margin:0">الدَّين والحصّالة</h2></div></div>${mentorSay(say, fd.left <= 0 ? 'cheer' : 'teach')}
  <div class="card"><div class="kv"><span>المتبقي من الدَّين</span><b>${fmt(Math.round(fd.left))} من ${fmt(fd.amt0)} ريال</b></div>${bar(paidPct, 100, 'gold')}
  ${fd.left > 0 ? `<div class="kv"><span>صبر الدائن</span><b>${Math.max(0, fd.patience)}٪</b></div><div class="kv"><span>القسط المتوقع كل 30 يوماً</span><b>${fmt(Math.round(fd.amt0 * B.installPct))} ريال</b></div>${left != null ? `<div class="kv"><span>الموعد القادم</span><b>بعد ${dayAr(left)} · ${need > 0 ? 'باقٍ ' + fmt(need) : '✅ وفّيتَه'}</b></div>` : '<div class="small muted">يبدأ العدّ حين تفعّل الخطة أو تبلغ المستوى 4.</div>'}` : ''}</div>
  ${fd.left > 0 ? `<div class="row"><button class="btn ${fd.plan ? 'ghost' : ''}" data-act="dplan" data-g="${fd.plan ? 0 : 1}">${fd.plan ? '⏸ أوقف الخطة 70/20/10' : '📜 فعّل خطة ظافر 70/20/10'}</button></div><div class="row"><button class="btn sm" data-act="dpay" data-q="100">ادفع 100</button><button class="btn sm" data-act="dpay" data-q="500">ادفع 500</button><button class="btn sm" data-act="dpay" data-q="${Math.ceil(fd.left)}">سدّد الكل</button></div>` : ''}
  <div class="card"><div class="kv"><span>🏺 الحصّالة (لا تُنفَق)</span><b>${fmt(v)} ريال</b></div><div class="small muted">عُشر أرباحك مع الخطة. تُحسب من ثروتك وزكاتك.</div>${v > 0 ? '<button class="btn ghost sm" data-act="vbreak">كسر الحصّالة (للطوارئ)</button>' : ''}</div>
  <button class="btn" data-act="lclose">إغلاق</button></div>`;
}
/* زكاة بهيمة الأنعام: غرض القطيع (تجارة أو رعي ونسل) وجدول الواجب والإخراج عيناً أو نقداً */
const AN_GLOSS = 'بنت مخاض: ناقة أتمت سنة ودخلت في الثانية · بنت لبون: أتمت سنتين · حِقّة: أتمت ثلاث سنين · جَذَعة: أتمت أربعاً · تَبيع: عجل أتم سنة · مُسِنّة: بقرة أتمت سنتين. (في اللعبة يُحسب كل رأس مستحَق برأس من نوعه.)';
function anHTML(b) {
  const Z = S.zakat, an = b.an; if (!an.rows.length) return '';
  const sawm = Z.herdMode === 'sawm', lock = Z.due && Z.part, it = x => x.map(d => d.n + ' ' + E.AN_ITEM[d.k]).join(' + ');
  const modeBtn = (m, t) => `<button class="sm ${Z.herdMode === m || (!Z.herdMode && m === 'trade') ? 'pri' : ''}" data-act="zhm" data-g="${m}" aria-pressed="${(Z.herdMode || 'trade') === m}" ${lock ? 'disabled' : ''}>${t}</button>`;
  let h = `<div class="card"><b>زكاة بهيمة الأنعام</b><div class="small muted" style="margin:4px 0">ما غرض قطيعك؟ إن اشتريته للبيع فهو مال تجارة يُقوَّم بسعر السوق ضمن مالك. وإن اقتنيته للرعي والدرّ والنسل (ترعى أكثر العام) فله زكاة أنعام بأنصبة خاصة، أما ما تعلفه أكثر العام فزكاته زكاة تجارة فقط.</div><div class="row" style="margin:6px 0">${modeBtn('trade', 'للتجارة والبيع')}${modeBtn('sawm', 'للرعي والنسل')}</div>`;
  if (sawm) {
    h += `<table class="ztab">${an.rows.map(r => `<tr><td>${r.name}: ${r.adults} بالغة${r.young ? ' و' + r.young + ' صغار' : ''} <span class="small muted">(النصاب ${r.min})</span></td><td>${r.due.length ? it(r.due) : r.adults >= r.min ? '—' : 'دون النصاب'}</td></tr>`).join('')}</table>`;
    if (Z.due && Z.anLeft > 0 && Z.an) { const items = Z.an.flatMap(r => r.due), cash = Math.round(items.reduce((t, x) => t + x.n * E.anPrice(S, x.k), 0)); h += `<div class="small" style="margin:6px 0">المستحق: <b>${Z.an.map(r => r.name + ': ' + it(r.due)).join(' · ')}</b></div><div class="row"><button class="btn" data-act="zan" data-g="kind">أخرجها عيناً من القطيع</button><button class="btn ghost" data-act="zan" data-g="cash">أخرج قيمتها نقداً (${R0(cash)} ريال)</button></div>`; }
    h += `<details class="small" style="margin-top:6px"><summary>معنى الكلمات</summary><div class="small muted">${AN_GLOSS}</div></details>`;
  }
  return h + '</div>';
}
function zakatHTML() {
  const Z = S.zakat, b = E.zakatBase(S), due = Z.due, amt = due ? Z.amount : b.amount;
  const say = due ? (Z.defer ? 'عدتَ يا ولدي، والزكاة ما زالت عليك. هذا حسابها، فأخرجها متى قدرت.' : 'حال الحول يا ولدي! حان وقت الزكاة. هذا حساب مالك، وأنت من يخرجها بيده. الزكاة طُهرة للمال وحقّ للفقراء، فلا تثقل عليك.') : 'هذا حساب مبدئي لزكاة مالك لو حال الحول اليوم.';
  return `<div class="lbox"><div class="lhead"><span class="lnum">🕌</span><div><div class="small muted">${due ? 'حال الحول' : 'حساب مبدئي'}</div><h2 style="margin:0">زكاة عروض التجارة</h2></div></div>${mentorSay(say, due ? 'proud' : 'teach')}${zakatTable(b)}${anHTML(b)}<div class="card"><b>${due ? 'المستحق: ' : 'المتوقع: '}${R0(amt)} ريال</b>${due ? `<div class="small muted" style="margin:4px 0">وعاء يوم تمام الحول: ${R0(Z.base)} × 2.5٪. إن أخرجتَ أقل بقي الباقي عليك.</div><input id="zamt" class="zin" type="number" min="1" max="${Math.round(amt)}" value="${Math.round(amt)}" inputmode="numeric">` : '<div class="small muted">يبدأ الحول حين يبلغ مالك النصاب، وتجب الزكاة بتمام 354 يوماً مع بقاء النصاب.</div>'}</div>${due ? `${Z.amount > 0 ? '<button class="btn" data-act="zpay">أخرج الزكاة</button>' : ''}<button class="btn ghost" data-act="zdefer">أؤجّل أسبوعاً</button>` : `<button class="btn" data-act="lclose">إغلاق</button>`}<div class="small muted">حساب مبسّط للتدريب؛ وللعلماء اجتهادات في التفاصيل، فاسأل أهل العلم الموثوقين في مالك الحقيقي.</div></div>`;
}
/* دفتر الأحكام: المسائل التي عُرضت في مجلس السوق مع أحكامها */
function fiqhBook() {
  const L = S.learn; if (!L.char || !L.mj || (L.level < 4 && !Object.keys(L.mj.seen).length)) return '';
  const F = E.FIQH, seen = F.CASES.filter(c => L.mj.seen[c.id]), left = F.CASES.length - seen.length, nx = E.A && L.level >= 4 && !L.eq.length ? F.CASES.find(c => c.diff <= F.allowed(L.level) && !L.mj.seen[c.id]) : null;
  return `<h3 style="margin-top:16px">📜 دفتر أحكام التجارة</h3><div class="card"><div class="small muted">${F.HEAD}</div><div class="row" style="margin:8px 0 0"><span class="pill">مسائل ${seen.length} من ${F.CASES.length}</span><span class="pill good">رصيد البركة ${L.mj.baraka}</span><span class="pill">${barakaLine(L.mj.baraka)}</span>${nx ? '<span class="spacer"></span><button class="sm pri" data-act="mjnow">مسألة الأسبوع: اقرأها الآن</button>' : ''}</div></div>` + seen.map(c => { const r = L.mj.seen[c.id]; return `<details class="card story"><summary><b>${r.ok ? '✅' : '📖'} ${c.title}</b> <span class="small muted">· ${c.bab}</span></summary><p>${c.scene}</p><p><b>الحكم:</b> ${c.ruling}</p><p><b>لماذا؟</b> ${c.why}</p><p class="small"><b>معنى الكلمات:</b> ${c.gloss}</p>${mjDetails(c)}</details>`; }).join('') + (left > 0 ? `<div class="card lv lock"><span class="lnum">🔒</span> ${left} مسألة قادمة في مجلس السوق</div>` : '');
}
function zakatBook() {
  if (!S.zakat || !S.learn.char) return '';
  const z = LSN.ZAKAT_LESSON, Z = S.zakat, b = E.zakatBase(S);
  return `<h3 style="margin-top:16px">🕌 فقه الزكاة</h3><details class="card story"><summary><b>${z.title}</b></summary>${z.lesson.map(t => `<p>${t}</p>`).join('')}</details><div class="card"><div class="small muted" style="margin-bottom:6px">حسابك الآن:</div>${zakatTable(b)}<div class="small" style="margin-top:6px">${Z.start == null ? 'لم يبدأ حولك بعد (لم تبلغ النصاب).' : Z.due ? '<b>الزكاة مستحقة الآن.</b>' : 'الحول: يوم ' + (S.day - Z.start) + ' من ' + E.hawlLen(S, Z.start) + '.'}${Z.paid ? ' · أخرجتَ في المجموع ' + R0(Z.paid) + ' ريال.' : ''}</div></div>`;
}
function babProfile(L) {
  const W = E.wealthStats(S), M = E.masteryOf(L), pas = E.passivePerDay(S), ck = ok => ok ? '✅' : '⬜';
  let h = `<div class="card"><h3>🧱 أسوار ${BV().CITY}: ${W.score} من 3</h3><div class="small">${ck(W.walls.div)} تنويع بضاعتك · ${ck(W.walls.prot)} تكافل أو حرّاس · ${ck(W.walls.res)} احتياطي يكفي رحلتين (عندك ${W.trips})</div><div class="small muted" style="margin-top:6px">ذهب يعمل ${Math.round(W.pctW * 100)}٪ ${bar(Math.round(W.pctW * 100), 100, 'gold')}ذهب نائم في المحفظة: ${R0(W.idle)} ريال</div></div>`;
  h += `<div class="card"><h3>🎓 إتقان الحرفة: ${M.name}</h3><div class="small muted">${M.next ? 'صفقات رابحة ' + M.n + ' من ' + M.next + ' للرتبة التالية (نفقة الطريق أرخص)' : 'بلغتَ أعلى رتبة: مؤن أرخص 6٪'}</div>${M.next ? bar(Math.round(M.n / M.next * 100), 100, 'gold') : ''}</div>`;
  h += `<div class="card"><h3>🎯 رغبتي المحددة</h3>${L.wish ? `<div class="small">هدفك ثروة ${R0(L.wish.amt)} ريال (الآن ${R0(E.netWorth(S))})</div>${bar(Math.min(100, Math.round(E.netWorth(S) / L.wish.amt * 100)), 100, 'gold')}` : '<div class="small muted">اكتب رقماً محدداً، فالرغبة التي لها رقم أقرب للتحقق.</div>'}<div class="row" style="margin-top:6px"><input id="wishamt" type="number" inputmode="numeric" placeholder="مثلاً 5000" style="flex:1;min-width:0"><button class="btn sm" data-act="wset">${L.wish ? 'غيّر' : 'حدّد'}</button></div></div>`;
  if (L.level >= 9) h += `<div class="card"><h3>🕊️ رحلة الحرية المالية ${L.freedom ? '✅' : ''}</h3><div class="small">دخلك السلبي (دكاكين، مضاربات، صكوك): <b>${R0(pas)}</b> ريال/يوم من <b>${E.FREE_DAILY}</b> لتغطية مصروفك</div>${bar(Math.min(100, Math.round(pas / E.FREE_DAILY * 100)), 100, 'gold')}</div>`;
  return h;
}
function achCard() {
  const X = S.ach; if (!X) return ''; const D = E.ACHD, got = X.got || {}, n = Object.keys(got).length, TT = { b: 'برونزي', s: 'فضي', g: 'ذهبي' };
  const med = (a, on) => ART['ach/medal_' + a.tier] ? `<span class="medal2${on ? '' : ' off'}" title="${on ? TT[a.tier] : ''}"><img class="mr" src="${ART['ach/' + (a.hid && !on ? 'medal_hidden' : 'medal_' + a.tier)]}" alt="">${on && ART['ach/' + a.id] ? `<img class="me" src="${ART['ach/' + a.id]}" alt="">` : ''}</span>` : `<span class="medal t-${a.tier}${on ? ' on' : ' off'}" title="${on ? TT[a.tier] : ''}"></span>`;
  const row = a => { const on = got[a.id] != null, hide = a.hid && !on; return `<div class="ach${on ? ' on' : ''}">${med(a, on)}<div><b>${hide ? 'إنجاز مخفي' : esc(a.name)}</b><div class="small muted">${hide ? 'يُكتشف من اللعب الطبيعي' : esc(a.desc)}${on ? ' · اليوم ' + got[a.id] : ''}</div></div></div>`; };
  return `<div class="card achc"><h3>الإنجازات <span class="pill">${n} من ${D.LIST.length}</span></h3>${bar(n, D.LIST.length, '')}${timelineHTML()}${D.CATS.map(c => { const l = D.LIST.filter(a => a.cat === c), k = l.filter(a => got[a.id] != null).length; return `<details class="mdet" data-dk="ach_${esc(c)}"><summary><b>${esc(c)}</b> <span class="small muted">${k}/${l.length}</span></summary>${l.map(row).join('')}</details>`; }).join('')}</div>`;
}
function yearCard() {
  const Y = S.yr; if (!Y) return '';
  const goals = Y.goals.map(g => { const GN = E.YEAR_GOALS[g.k], have = Math.min(g.target, GN.have(S)); return `<div class="kv"><span>${g.done ? '<b class="good">منجز</b> ' : ''}${esc(GN.name(S))}</span><span class="num small">${fmt(have)} / ${fmt(g.target)}</span></div>${bar(have, g.target, g.done ? '' : '')}`; }).join('');
  const hist = Y.hist.slice(-5).reverse().map(r => `<tr><td>${r.y}</td><td>${fmt(r.nw)}</td><td class="${r.dnw >= 0 ? 'good' : 'bad'}">${r.dnw >= 0 ? '+' : ''}${fmt(r.dnw)}</td><td>${r.trips}</td><td>${r.deals}</td><td>${r.goals}/3</td></tr>`).join('');
  return `<div class="card yearc"><h3>اللعب الحر · الحول ${Y.n + 1} <span class="pill">يوم ${S.day - Y.start} من ${E.FREE_YEAR}</span></h3><div class="small muted">لا نهاية للعبة: لك كل حول ثلاثة أهداف وتقرير بمسيرتك.</div>${goals}${hist ? `<table class="ztab" style="margin-top:8px"><tr><th>حول</th><th>الثروة</th><th>النمو</th><th>رحلات</th><th>صفقات</th><th>أهداف</th></tr>${hist}</table>` : ''}</div>`;
}
function renderProfile() {
  const el = $('profile'); if (!el) return;
  if (!prof || !S.learn) { el.hidden = true; el.innerHTML = ''; return; }
  const L = S.learn, ch = LSN.CHARS.find(c => c.id === L.char), lv = lvlOf(), nxt = L.level < 10 ? LSN.LEVELS[L.level] : null, Z = S.zakat, zb = E.zakatBase(S);
  const gl = lv ? lv.goals(S) : [], pr = gl.length ? Math.round(gl.filter(g => g[1]).length / gl.length * 100) : 100;
  const best = S.player.trades.reduce((m, t) => Math.max(m, t.pl || 0), 0), nw = E.netWorth(S);
  let h = `<div class="pf"><div class="pf-head">${charImg() ? `<img class="pimg" src="${charImg()}" alt="">` : ''}<div style="flex:1;min-width:0"><h2>${S.player.name ? esc(S.player.name) : ch ? charTitle(ch) : 'التاجر'}</h2><div class="muted small">${S.player.name ? 'لقبك: ' + (ch ? charTitle(ch) : 'التاجر') : (ch ? charTag(ch) : '')} · ${E.titleOf(nw)}</div><div style="margin-top:6px"><b>${L.level > 10 ? '🎓 أنهيتَ المعهد' : (E.stageOf(S) ? 'المرحلة ' + E.stageOf(S).n + ' من ' + E.STAGES.length : 'المستوى ' + L.level + ' من 10')}</b>${lv ? `<div class="small muted">${lv.icon} ${lv.title}</div><div class="pbar"><u style="width:${Math.max(4, pr)}%"></u></div>` : ''}</div>${ch ? `<div class="small">${ch.perksText.join(' · ')}</div>` : ''}</div></div>`;
  if (lv) h += `<div class="card"><h3>📋 مهامك الحالية</h3><div class="small muted" style="margin-bottom:4px">${lv.task}</div>${goalsHTML(lv)}<div class="row" style="margin-top:8px"><button class="btn sm" data-act="pgo" data-g="${LV_SCREEN[L.level - 1]}">ابدأ المهمة</button><button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 الدرس</button></div></div>`;
  if (nxt) h += `<div class="card"><h3>⏭ المستوى التالي</h3><div>${nxt.icon} ${nxt.title}</div><div class="small muted">${nxt.task}</div></div>`;
  h += lifeProfileHTML();
  h += babProfile(L);
  if (S.player.famDebt) h += `<div class="card"><h3>💳 دَين الجدّ والحصّالة</h3><div class="small">${S.player.famDebt.left > 0 ? 'المتبقي ' + R0(S.player.famDebt.left) + ' من ' + R0(S.player.famDebt.amt0) + ' ريال' + (S.player.famDebt.plan ? ' · الخطة قائمة' : ' · لا خطة بعد') : '✅ حرّ من الدَّين'} · الحصّالة ${R0(S.player.vault || 0)}</div><button class="btn sm" data-act="dopen">فتح</button></div>`;
  if (Z) h += `<div class="card"><h3>🕌 الزكاة</h3><div class="small">${Z.due ? '<b>حال الحول والزكاة مستحقة: ' + R0(Z.amount) + ' ريال.</b>' : Z.start != null ? 'الحول: يوم ' + (S.day - Z.start) + ' من ' + E.hawlLen(S, Z.start) + ' (باقٍ ' + dayAr(Math.max(0, E.hawlLen(S, Z.start) - (S.day - Z.start))) + ').' : 'وعاؤك ' + R0(zb.base) + ' من نصاب ' + R0(zb.nisab) + ' ريال، ولم يبدأ الحول بعد.'}${Z.last != null ? '<br>آخر زكاة: يوم ' + Z.last + ' · مجموع ما أخرجتَ ' + R0(Z.paid) + ' ريال ✅' : ''}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="zopen">${Z.due ? 'احسب وأخرج الزكاة' : 'احسب زكاتي الآن'}</button></div></div>`;
  h += yearCard() + achCard() + tradeRestartCard();
  if (S.rival && S.day >= E.RIVAL_FROM) { const mine = E.netWorth(S), his = E.rivalNW(S), mx = Math.max(mine, his, 1);
    h += `<div class="card rivalc">${pic('talk/rival_' + (his > mine * 1.1 ? 'smug' : mine > his * 1.1 ? 'upset' : 'neutral'), 'rivalpic', S.rival.name)}<h3>${ti('rival_badge')} منافسك: ${esc(S.rival.name)}</h3><div class="kv"><span>ثروتك</span><b>${fmt(mine)}</b></div>${bar(mine, mx, '')}<div class="kv"><span>ثروة ${esc(S.rival.name)}</span><b>${fmt(his)}</b></div>${bar(his, mx, his > mine ? 'red' : '')}<div class="small muted">${mine >= his ? ti('rival_lose') + 'أنت في الصدارة الآن' : ti('rival_win') + 'يتقدمك الآن'} · أنجز ${S.rival.trips} رحلة. يتاجر في الأسواق نفسها، فاحذر أن يسبقك إلى الفرص.</div></div>`; }
  { const R = E.reputation(S); h += `<div class="card"><h3>🌟 سمعة التاجر <span class="pill">${R.total}٪</span></h3>${R.parts.map(x => `<div class="kv"><span>${x.name}</span><b class="num">${x.score}</b></div>${bar(x.score, 100, x.score < 40 ? 'red' : x.score < 70 ? 'gold' : '')}`).join('')}<div class="small muted" style="margin-top:6px">أضعف أشرطتك: <b>${R.weakest.name}</b>. ${R.weakest.tip}. السمعة ستحدد جودة مصانعك لاحقاً (من 35٪ إلى 80٪).</div></div>`; }
  h += `<div class="stats"><div><b>${S.player.trips}</b>رحلات</div><div><b>${R0(best)}</b>أفضل ربح</div><div><b>${S.day}</b>يوماً</div></div>`;
  if (L.secrets.length) h += `<div class="small">أسرار فتحتَها: ${L.secrets.map(c => { const k = E.COUNTRIES.find(x => x.id === c); return k ? k.flag + ' ' + k.name : ''; }).join(' · ')}</div>`;
  { const D = [['calm', 'هادئ', 'صدمات أقل وأخف'], ['normal', 'عادي', 'التوازن المعتاد'], ['hard', 'صعب', 'صدمات أكثر وأشد']], cur = S.diff || 'normal';
    h += `<div class="card"><h3>مستوى الصعوبة</h3><div class="chips">${D.map(([k, n]) => `<button data-act="diff" data-k="${k}" class="${k === cur ? 'on' : ''}">${n}</button>`).join('')}</div><div class="small muted">${D.find(x => x[0] === cur)[2]}. يؤثر في تكرار الصدمات الاقتصادية وشدتها (إغلاق الحدود، اللصوص، الاحتكار…) ويمكنك تغييره متى شئت.</div></div>`; }
  h += `<div class="card"><h3>حفظ اللعبة ونقلها</h3><div class="small muted">يُحفظ تقدّمك تلقائياً في هذا الجهاز. لنقله إلى جهاز آخر أو الاحتفاظ بنسخة، أنشئ رمزاً وانسخه، ثم الصقه هناك في «استعادة».</div><div class="row"><button class="sm pri" data-act="savecode">أنشئ رمز الحفظ</button>${scode ? '<button class="sm" data-act="savecopy">انسخه</button>' : ''}</div>${scode ? `<textarea class="scbox" id="scOut" readonly aria-label="رمز الحفظ">${esc(scode)}</textarea><div class="small muted">طوله ${fmt(scode.length)} حرفاً. احفظه في ملاحظات أو رسالة لنفسك.</div>` : ''}<div class="small" style="margin-top:8px"><b>استعادة من رمز:</b></div><textarea class="scbox" id="scIn" placeholder="الصق الرمز هنا (يبدأ بـ DT1-)" aria-label="الصق رمز الحفظ">${esc(simpText)}</textarea><div class="row">${simp ? '<span class="qnote">سيحلّ هذا الرمز محل تقدّمك الحالي. هل أنت متأكد؟</span><button class="sm pri" data-act="saveimport">نعم، استعد</button><button class="sm" data-act="saveno">لا</button>' : '<button class="sm" data-act="saveimport">استعد من الرمز</button>'}</div></div>`;
  h += `<div class="row"><button class="btn" data-go="academy">🎓 المعهد (الأكاديمية)</button><button class="btn ghost" data-act="pask">💬 اسأل ${esc(MEN.name)}</button><button class="btn ghost" data-act="pclose">إغلاق</button></div>${newGameCard(true)}</div>`;
  el.hidden = false; el.innerHTML = h; topClose(el);
}
const ADV_TABS = [['deal', '📈 صفقة'], ['market', '🏪 السوق'], ['portfolio', '💼 محفظتي'], ['risk', '🛡️ المخاطر'], ['zakat', '🕌 الزكاة'], ['learn', '🎓 دروس'], ['set', '⚙️']];
const pctS = v => Math.round(v * 100) + '٪';
function advisorHTML(inPanel) {
  const L = S.learn, r = E.advisorReport(S), nm = g => GD[g].name, tabs = `<div class="chips advtabs">${ADV_TABS.map(([k, t]) => `<button data-act="advtab" data-g="${k}" class="${advTab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  let say = '', body = '', mood = 'happy';
  if (advTab === 'deal') {
    if (!r.idle) { say = `قافلتك في الطريق إلى ${S.cities[r.dest].name}، باقٍ ${dayAr(r.left)}. استعدّ لما بعد الوصول.`; mood = 'teach'; }
    else if (r.deal) { const d = r.deal; say = `هذه أفضل صفقة أراها من ${S.cities[r.city].name} الآن: ربح متوقع ${pctS(d.pct)} على ما تدفع.`; mood = 'proud';
      body = `<div class="card"><b>اشترِ ${d.q} ${nm(d.g)} هنا</b> (≈ ${fmt(Math.round(d.cost))} ريال)<br>وبِعها في <b>${S.cities[d.dest].name}</b> بعد ${dayAr(d.days)}<br>ربح متوقع: <b class="cheap">+${fmt(Math.round(d.profit))} ريال</b> · خطر الطريق ${pctS(d.risk || 0)}<div class="small muted" style="margin-top:6px">الحساب بعد نفقة الطريق والجمارك والضريبة، لكن الأسعار تتحرك أثناء السفر.</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="advgo" data-g="market">افتح السوق</button></div></div>`; }
    else { say = 'لا أرى صفقة مجزية من هنا الآن. انتظر يوماً أو انتقل لمدينة أخرى وانظر هناك.'; mood = 'thinking'; }
    if (r.cargo.length) body += `<div class="card"><b>ما تحمله الآن</b>${r.cargo.map(c => `<div class="kv"><span>${nm(c.g)} × ${c.q}</span><span>${c.best ? 'الأفضل في ' + S.cities[c.best.city].name + ' (' + (c.best.profit >= 0 ? '+' : '') + fmt(Math.round(c.best.profit)) + ')' : '—'}</span></div>`).join('')}</div>`;
  } else if (advTab === 'market') {
    const ch = r.here.slice(0, 3), dr = r.here.slice(-3).reverse(); say = `هذا حال سوق ${S.cities[r.city].name} الآن: الأخضر رخيص والأحمر غالٍ مقارنة بالمعتاد.`; mood = 'teach';
    const row = x => `<div class="kv"><span>${nm(x.g)}</span><span class="${x.ratio < 0.95 ? 'cheap' : x.ratio > 1.1 ? 'dear' : ''}">${fmt(Math.round(x.price))} ر.س · ${pctS(x.ratio)} من المعتاد</span></div>`;
    body = `<div class="card"><b>الأرخص هنا</b>${ch.map(row).join('')}</div><div class="card"><b>الأغلى هنا</b>${dr.map(row).join('')}</div>`;
  } else if (advTab === 'portfolio') {
    const p = r.portfolio, tot = Math.max(1, p.cash + p.goods + p.store + p.deposits); say = p.cash > 0.6 * tot ? 'مالك سائل أكثر من اللازم. المال الراكد لا يربح.' : p.top && p.top.pct > 0.55 ? 'تركّزت بضاعتك في سلعة واحدة، تذكّر درس التنويع.' : 'محفظتك متوازنة، أحسنت.'; mood = p.top && p.top.pct > 0.55 ? 'worried' : 'proud';
    const share = (t, v) => `<div class="kv"><span>${t}</span><span>${fmt(Math.round(v))} ريال · ${pctS(v / tot)}</span></div>`;
    body = `<div class="card"><b>توزيع مالك (الثروة ≈ ${fmt(Math.round(p.nw))})</b>${share('نقد', p.cash)}${share('بضاعة في القوافل', p.goods)}${share('بضاعة في المخازن', p.store)}${share('مضاربات وصكوك', p.deposits)}${p.debts ? `<div class="kv"><span>ديون عليك</span><span class="dear">− ${fmt(Math.round(p.debts))}</span></div>` : ''}${p.top ? `<div class="small muted" style="margin-top:6px">أكبر سلعة عندك: ${nm(p.top.g)} (${pctS(p.top.pct)} من بضاعتك)</div>` : ''}</div>`;
  } else if (advTab === 'risk') {
    const k = r.risk; say = k.cargoValue > 4000 && k.guards < 2 ? 'بضاعتك غالية وحراسك قليلون. هذا ما يقلقني.' : 'حال قافلتك مطمئن، ومع ذلك لا تأمن الطريق.'; mood = k.cargoValue > 4000 && k.guards < 2 ? 'worried' : 'happy';
    body = `<div class="card"><div class="kv"><span>الحراس</span><b>${k.guards}</b></div><div class="kv"><span>الطاقم</span><b>${k.crew}</b></div><div class="kv"><span>التكافل</span><b>${k.insured ? 'مفعّل' : 'غير مفعّل'}</b></div><div class="kv"><span>قيمة الحمولة</span><b>${fmt(Math.round(k.cargoValue))} ريال</b></div>${k.route != null ? `<div class="kv"><span>خطر الطريق المقترح</span><b>${pctS(k.route)}</b></div>` : ''}<div class="small muted" style="margin-top:6px">الحراس يصدّون اللصوص، والتأمين يخفّف الخسارة إن وقعت.</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="advgo" data-g="caravan">افتح القافلة</button></div></div>`;
  } else if (advTab === 'zakat') {
    const z = r.zakat; say = z.due ? 'حال الحول! الزكاة مستحقة، فبادر بإخراجها.' : z.start != null ? `حولك جارٍ منذ ${dayAr(S.day - z.start)} من ${E.hawlLen(S, z.start)}.` : 'لم تبلغ النصاب بعد، فلا زكاة عليك الآن.'; mood = z.due ? 'proud' : 'teach';
    body = `<div class="card">وعاؤك ${fmt(Math.round(z.base))} ريال · النصاب ${fmt(Math.round(z.nisab))}<br>المتوقع إن حال الحول اليوم: <b>${fmt(Math.round(z.amount))} ريال</b><div class="row" style="margin-top:8px"><button class="btn sm" data-act="zopen">${z.due ? 'احسب وأخرج الزكاة' : 'احسب زكاتي'}</button></div></div>`;
  } else if (advTab === 'learn') {
    say = 'أي درس تحب أن نراجعه معاً؟'; mood = 'teach';
    body = `<div class="card">${LSN.LEVELS.map(lv => `<button class="btn ghost sm" style="margin:3px" data-act="lview" data-g="${lv.n}">${lv.icon} ${lv.title}</button>`).join('')}<button class="btn ghost sm" style="margin:3px" data-act="zopen">🕌 الزكاة</button></div>`;
  } else {
    say = L.advMute ? 'سأسكت عن النصائح التلقائية، لكنني حاضر متى ناديتني.' : 'سأنبّهك حين أرى ما يستحق: فرصة بيع، تركّز في سلعة، قلة حراس، قرض قائم، وغير ذلك.'; mood = 'happy';
    body = `<div class="card"><button class="btn ghost" data-act="advmute">${L.advMute ? '🔔 أعد النصائح التلقائية' : '🔕 أسكت النصائح التلقائية'}</button></div>`;
  }
  if (inPanel) return `${tabs}${mentorSay(say, mood)}${body}`;
  return `<div class="lbox"><div class="lhead"><span class="lnum">💬</span><div><div class="small muted">مستشارك الخاص</div><h2 style="margin:0">${esc(MEN.name)}</h2></div></div>${tabs}${mentorSay(say, mood)}${body}<button class="btn ghost" data-act="lclose">إغلاق</button></div>`;
}
function renderAdvBtn() {
  const b = $('advBtn'); if (!b) return renderSalem(); const on = !!(S.learn && S.learn.char && S.learn.level > 10 && !NOLEARN);
  b.hidden = !on; if (on && !b.dataset.k) { b.dataset.k = 1; b.innerHTML = `${mentorAv('happy')}<span>استشِر</span>`; }
}
function mentorCard() {
  const L = S.learn; if (!L || !L.char) return '';
  const lv = lvlOf();
  if (!lv) return `<div class="card mentor" style="margin-top:12px"><div class="msay">${mentorAv()}<div><b>${MEN.name}</b><div class="bub">أنا الآن مستشارك الخاص يا صاحب السوق. استشرني في أي صفقة، ودروسك في «الأكاديمية».</div></div></div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="advisor">💬 استشرني</button><button class="btn ghost sm" data-go="academy">🎓 الأكاديمية</button></div></div>`;
  const mode = lv.mode;
  if (mode === 'alert') return `<div class="card mentor" style="margin-top:12px"><div class="msay">${mentorAv()}<div><b>${MEN.name}</b> · المستوى ${lv.n}: ${lv.title}<div class="small muted">مهمتك: ${lv.task}</div></div></div><div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 الدرس</button><button class="btn ghost sm" data-go="academy">🎓 الأكاديمية</button></div></div>`;
  return `<div class="card mentor" style="margin-top:12px"><div class="msay">${mentorAv()}<div><b>${MEN.name}</b> <span class="small muted">· المستوى ${lv.n} من 10: ${lv.icon} ${lv.title}</span><div class="bub">${mode === 'guide' ? lv.task : 'تذكّر: ' + lv.task}</div></div></div>${goalsHTML(lv)}<div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 اقرأ الدرس</button><button class="btn ghost sm" data-go="academy">🎓 الأكاديمية</button></div></div>`;
}
function mentorStrip() {
  const lv = S.learn && S.learn.char ? lvlOf() : null; if (!lv || lv.mode !== 'guide') return '';
  const nx = lv.goals(S).find(g => !g[1]); if (!nx) return '';
  return `<div class="mstrip">${mentorAv()}<span><b>${MEN.name}:</b> ${nx[0]}</span></div>`;
}
function screenAcademy() {
  const L = S.learn, ch = LSN.CHARS.find(c => c.id === L.char);
  let h = `<h2>🎓 الأكاديمية</h2><p class="muted">دروس التجارة التي علّمك إياها ${MEN.name}. كل درس من واقع الأسواق.</p>`;
  if (ch) h += `<div class="card"><div class="msay">${pic(ch.img, 'av', ch.name)}<div><b>${charTitle(ch)}</b> ${charTag(ch) ? `<span class="small muted">· ${charTag(ch)}</span>` : ''}<div class="small">${ch.perksText.join(' · ')}</div></div></div></div>`;
  h += lifeStagesHTML();
  h += `<h3 style="margin-top:16px">المستويات</h3><div class="grid g2">` + LSN.LEVELS.map(lv => {
    const st = L.level > lv.n ? 'done' : L.level === lv.n ? 'cur' : 'lock';
    return `<div class="card lv ${st}"><div class="row" style="margin:0"><span class="lnum">${st === 'lock' ? '🔒' : lv.icon}</span><b>${lv.n}. ${lv.title}</b>${st === 'done' ? '<span class="pill">✓ أُنجز</span>' : st === 'cur' ? '<span class="pill">الحالي</span>' : ''}</div>` + (st === 'lock' ? '<div class="small muted">يُفتح بإتمام الدرس السابق.</div>' : `<div class="small muted" style="margin:6px 0">${lv.task}</div>${st === 'cur' ? goalsHTML(lv) : ''}<button class="btn ghost sm" data-act="lview" data-g="${lv.n}">📖 اقرأ الدرس</button>`) + `</div>`;
  }).join('') + `</div>` + storyBook() + zakatBook() + fiqhBook() + babBooks() + loreBooks() + `<h3 style="margin-top:16px">أسرار الدول</h3><div class="grid g3">` + E.COUNTRIES.map(ct => {
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
  coverLabel();
  sel = main().city; carSel = 1; estCity = sel; estC = S.cities[sel].country; empC = estC;
}

