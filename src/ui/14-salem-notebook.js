/* ---------- عمّ سالم: قائمة منسدلة من الشريط العلوي ---------- */
let salemOpen = false, salemTab = 'mission', salemDot = false, lastMkey = null, peekT = null;
const salemOn = () => !!(S && S.learn && S.learn.char && !NOLEARN);
function mkeyNow() { const st = missionStep(); if (!st) return null; const p = mpath(st); return st.lv.n + '|' + (st.lv.rest ? 'r' : '') + '|' + (p ? p.msg : st.msg); }
function salemPos(el) { const hb = $('top') ? $('top').getBoundingClientRect().bottom : 60; el.style.top = Math.max(8, Math.round(hb + 6)) + 'px'; return hb; }
/* ---------- دفتر التاجر: المهام والخيوط وألبوم الحكايات ---------- */
let jtab = 'tasks', scode = '', simpText = '', simp = false;
function journalTasks() {
  const L = S.learn, lv = lvlOf(), d = S.player.famDebt; let h = '';
  h += missionCard(true) || `<div class="small muted" style="padding:6px 0">لا مهمة جديدة الآن. استشر عمّ سالم من تبويب «اسألني».</div>`;
  if (lv) h += `<div class="card"><b>أهداف المستوى ${lv.n}: ${lv.title}</b>${goalsHTML(lv)}</div>`;
  if (d && d.left > 0) h += `<div class="card"><b>دَين جدّك للحاج صالح</b><div class="small">متبقٍّ <b class="num">${fmt(Math.round(d.left))}</b> من <b class="num">${fmt(d.amt0)}</b> ريال</div>${bar(d.amt0 - d.left, d.amt0, 'gold')}</div>`;
  const qs = Object.keys(E.DLG.QUESTS).filter(id => E.questState(S, id) !== 'none');
  if (qs.length) h += `<h3 style="margin:10px 0 4px">مهام الحكايات</h3>` + qs.map(id => { const q = E.DLG.QUESTS[id], st = E.questState(S, id), have = Math.min(q.need[1], E.hasGood(S, q.need[0])), prog = q.amount ? `لك عليه ${q.amount} ريال · المدينة: ${esc(cityName(q.city))}` : `معك ${have} من ${q.need[1]} ${GD[q.need[0]].name} · المدينة: ${esc(cityName(q.city))}`; return `<div class="card"><div class="row" style="margin:0">${ti(st === 'done' ? 'quest_done' : 'quest_active')}<b>${q.title}</b><span class="pill ${st === 'done' ? 'good' : ''}">${st === 'done' ? 'أُنجزت' : 'جارية'}</span></div><div class="small">${q.text}</div>${st === 'done' ? '' : `<div class="small muted">${prog}</div>`}</div>`; }).join('');
  const done = LSN.LEVELS.filter(x => L.level > x.n), next = LSN.LEVELS.filter(x => x.n > L.level).slice(0, 2);
  if (done.length) h += `<h3 style="margin:10px 0 4px">أتممتَها</h3>` + done.map(x => `<div class="itemrow"><span>${x.icon} <b>${x.n}. ${x.title}</b></span><span class="spacer"></span><span class="pill good">${ti('quest_done')} أُنجزت</span></div>`).join('');
  if (next.length) h += `<h3 style="margin:10px 0 4px">القادمة</h3>` + next.map(x => `<div class="itemrow"><span>${ti('quest_locked')} ${x.n}. ${x.title}</span></div>`).join('');
  return h;
}
function journalClues() {
  const L = S.learn, b = E.LORE.BOSS_LORE, sc = E.LORE.CITY_SECRETS, B = BV(), out = [];
  S.order.filter(id => b[id] && S.bosses[id]).forEach(id => {
    const n = (L.lore || {})[id] || 0, bs = S.bosses[id]; if (n >= 3) return;
    const hint = !(L.cv && L.cv[id] > 0) ? 'زُر ' + cityName(id) + ' لتتعرف على كبير تجّارها' : n === 1 ? 'ثقته بك ' + Math.round(bs.trust) + ' من 10، أو قدّم له هدية، ليكشف ما يحب' : 'ثقته بك ' + Math.round(bs.trust) + ' من 35، أو وقّع معه عقداً، ليروي حكايته';
    out.push({ k: n + (L.cv && L.cv[id] > 0 ? 1 : 0), t: `<span class="lnum">👤</span> <b>${esc(cityName(id))}</b> <span class="pill">${n}/3</span><div class="small">${hint}</div>` });
  });
  if (L.level >= 4) S.order.filter(id => sc[id] && !(L.csec || []).includes(id)).forEach(id => out.push({ k: ((L.cv || {})[id] || 0) + ((L.cs || {})[id] || 0) / 1000, t: `<span class="lnum">🗝️</span> <b>سرّ ${esc(cityName(id))}</b><div class="small">زيارات ${Math.min(2, (L.cv || {})[id] || 0)} من 2 · مبيعات ${fmt(Math.min(1000, Math.round((L.cs || {})[id] || 0)))} من 1000 ريال</div>` }));
  Object.keys(B.TABLETS).filter(id => !(L.tab || []).includes(id)).forEach(id => out.push({ k: 0.1, t: `<span class="lnum">📜</span> <b>لوح مغلق</b><div class="small">${B.TABLETS[id].hint}</div>` }));
  if (!out.length) return `<div class="small muted" style="padding:8px 0">لا خيوط معلّقة. كشفتَ كل ما عرفتَه حتى الآن.</div>`;
  return `<div class="small muted" style="margin:6px 0">${ti('clue')} ما بقي لك لتكتشفه، الأقرب أولاً:</div>` + out.sort((a, b) => b.k - a.k).slice(0, 12).map(x => `<div class="card clue">${x.t}</div>`).join('');
}
function prodBook() {
  const L = S.learn, got = L.pst || [], PS = E.LORE.PSTORY;
  return Object.keys(PS).map(g => got.includes(g) ? `<div class="hist-row"><b>${ti('product_story')}${gi(g)} ${esc(PS[g].t)}</b><div>${addr(PS[g].x)}</div></div>` : `<div class="hist-row muted">${ti('product_story_lock') || '🔒'} حكاية ${esc(GD[g].name)}: اشترِ هذه السلعة أو بِعها لتكتشفها.</div>`).join('');
}
function journalAlbum() {
  const L = S.learn, B = BV(), nb = Object.keys((L.lore || {})).reduce((a, k) => a + ((L.lore || {})[k] || 0), 0), cs = (L.csec || []).length, tb = (L.tab || []).length, st = LSN.LEVELS.filter(x => L.level > x.n && LSN.storyOf(x.n, S.home)).length;
  const sum = `<div class="row small" style="margin:6px 0"><span class="pill">${ti('album')} ذكريات الجدّ ${st}</span><span class="pill">فصول الزعماء ${nb}</span><span class="pill">أسرار الأسواق ${cs}</span><span class="pill">ألواح الحكمة ${tb}</span><span class="pill">حكايات المنتجات ${(L.pst || []).length}</span></div>`;
  return sum + `<details class="mdet"><summary><b>حكايات المنتجات</b></summary>${prodBook()}</details><details class="mdet" open><summary><b>ذكريات جدّك</b></summary>${storyBook()}</details><details class="mdet"><summary><b>دفتر الزعماء وأسرار الأسواق</b></summary>${loreBooks()}</details><details class="mdet"><summary><b>حكايات ${B.CITY} وألواح الحكمة</b></summary>${babBooks()}</details>`;
}
function journalBody() {
  E.achNote(S, 'jtab', jtab);
  const chips = [['tasks', 'المهام'], ['clues', 'الخيوط'], ['album', 'الألبوم'], ['help', 'التعليمات']].map(([id, n]) => `<button data-act="jtab" data-g="${id}" class="${jtab === id ? 'on' : ''}">${n}</button>`).join('');
  return `<div class="chips jtabs" style="margin:6px 0">${chips}</div>` + (jtab === 'clues' ? journalClues() : jtab === 'album' ? journalAlbum() : jtab === 'help' ? howtoAll() : journalTasks());
}
function cardLib() {
  const got = (S.learn && S.learn.cards) || [], C = E.CARDS.CARDS; if (!got.length) return '';
  const grp = t => { const ids = got.filter(id => C[id].track === t); return ids.length ? `<div class="small" style="margin:8px 0 2px"><b>${esc(E.CARDS.TRACKS[t])}</b> <span class="muted">${ids.length} من ${E.CARDS.LIST.filter(i => C[i].track === t).length}</span></div><div>${ids.map(id => `<button class="btn ghost sm" style="margin:3px" data-act="cview" data-g="${id}">${esc(C[id].title)}</button>`).join('')}</div>` : ''; };
  return grp('f') + grp('g') + '<hr style="margin:10px 0">';
}
function salemBody() {
  const L = S.learn;
  if (salemTab === 'ask') return advisorHTML(true);
  if (salemTab === 'journal') return journalBody();
  if (salemTab === 'hist') { const h = L.hist || []; return h.length ? h.map(x => `<div class="hist-row"><div class="small muted">اليوم ${x.d}</div><div>${addr(x.t)}</div></div>`).join('') : '<div class="small muted" style="padding:8px 0">لم أقل شيئاً بعد. سأعلّق على صفقاتك وأخطائك وأنبّهك حين يلزم.</div>'; }
  if (salemTab === 'lessons') return cardLib() + `<div class="small muted" style="margin:6px 0">أعد قراءة أي درس مرّ بك:</div><div>${LSN.LEVELS.filter(lv => L.level >= lv.n).map(lv => `<button class="btn ghost sm" style="margin:3px" data-act="lview" data-g="${lv.n}">${lv.icon} ${lv.title}</button>`).join('')}<button class="btn ghost sm" style="margin:3px" data-act="zopen">🕌 الزكاة</button></div>`;
  const mc = missionCard(true);
  return mc || mentorSay('لا مهمة جديدة الآن يا ولدي. استشرني في أي صفقة من تبويب «اسألني»، أو راجع دروسك.', 'happy');
}
function renderSalem() {
  const btn = $('hSalem'), pn = $('salemPanel'), pk = $('salemPeek'); if (!btn || !pn) return;
  const on = salemOn(); btn.hidden = !on;
  if (!on) { pn.hidden = true; pn.innerHTML = ''; if (pk) pk.hidden = true; salemOpen = false; return; }
  if (!btn.dataset.k) { btn.dataset.k = 1; btn.innerHTML = `${mentorAv('teach')}<i class="dot" hidden></i>`; }
  btn.setAttribute('aria-expanded', String(salemOpen));
  const k = mkeyNow(); if (k !== lastMkey) { lastMkey = k; if (k) { const lv = lvlOf(); salemDot = true; if (lv && lv.mode === 'guide' && lv.n <= 3) peekWant = true; } }
  if (peekWant && calmNow()) { peekWant = false; peekShow(); } // الرسالة تنتظر حتى يفرغ اللاعب مما بين يديه (بطاقة، سفر، درس) فلا تتراكم عليه
  const tabs = [['mission', '🎯 مهمتي'], ['journal', '📒 دفتري'], ['ask', '💬 اسألني'], ['hist', '📜 ما قاله'], ['lessons', '🎓 دروسي']];
  pn.innerHTML = `<div class="sp-head">${mentorAv('teach')}<div><b>عمّ سالم</b><div class="small muted">${MEN.role}</div></div><span class="spacer"></span><button class="sm" data-act="salemclose">إغلاق</button></div><div class="sp-tabs">${tabs.map(([id, n]) => `<button data-act="salemtab" data-g="${id}" class="${salemTab === id ? 'on' : ''}">${n}</button>`).join('')}</div>${salemBody()}`;
  pn.hidden = !salemOpen;
  if (salemOpen) { /* الشريط قد يتبدّل ارتفاعه بعد رسم الأيقونات فيُعاد التموضع */ const hb = salemPos(pn); pn.style.maxHeight = Math.max(160, innerHeight - hb - 80) + 'px'; salemDot = false; requestAnimationFrame(() => { if (salemOpen && !pn.hidden) { const h2 = salemPos(pn); pn.style.maxHeight = Math.max(160, innerHeight - h2 - 80) + 'px'; } }); if (pk) pk.hidden = true; }
  const dot = btn.querySelector('.dot'); if (dot) dot.hidden = !(salemDot && !salemOpen);
}
function peekShow() {
  const st = missionStep(), el = $('salemPeek'); if (!st || !el) return;
  const p = mpath(st), msg = p ? p.msg : st.msg;
  el.innerHTML = `<div class="msay">${mentorAv('teach')}<div style="flex:1;min-width:0"><b>عمّ سالم</b><div class="bub">${msg}</div></div></div><div class="row" style="margin-top:6px"><button class="sm" data-act="salemopen">افتح عمّ سالم</button><button class="sm" data-act="peekclose">حسناً</button></div>`;
  salemPos(el); el.hidden = false; clearTimeout(peekT); peekT = setTimeout(() => { el.hidden = true; }, 11000);
}
function salemSet(open, tab) {
  salemOpen = open; if (tab) salemTab = tab; if (open) { const pk = $('salemPeek'); if (pk) pk.hidden = true; salemDot = false; }
  renderAll(true);
}
function renderSpot() {
  document.querySelectorAll('.tut-hl').forEach(n => n.classList.remove('tut-hl'));
  const q = mentorTarget(), n = q && [...document.querySelectorAll(q)].find(e => e.getClientRects().length);
  if (n) { n.classList.add('tut-hl'); const hk = q + '|' + screen + '|' + (dg ? 1 : 0); if (hlKey !== hk) { hlKey = hk; try { n.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {} } }
  setTimeout(placeSpot, 30);
}

