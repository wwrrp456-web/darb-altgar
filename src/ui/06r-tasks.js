/* ---------- 038ب «مهامك»: ثلاث خانات (قصيرة، أسبوعية، موسمية) في «اليوم» وفي نافذة سطر «حال أعمالي» ----------
   فوق مكوّنات 037 (ask وdsheet) بلا مكوّن جديد ولا قوائم منسدلة ولا أيقونات جديدة. النصوص من E.tasksView (حرفاً من specs/038-tasks/texts.md).
   اختيار واحدة من ثلاث بطاقة ask؛ وبعد الاختيار يُظلَّل الخيار (on + aria-pressed) مع ملخص بالأرقام (التقدم والمكافأة والمهلة).
   E.TASKS.on=false: لا قسم ولا سطر ولا قراءة للحالة. الرسم قراءة فقط حتى يفتح اللاعب النافذة أو القسم (فيُنشأ tk2 عندها). */
const tkUiOn = () => { try { return !!(E.TASKS.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const TK_ICON = { tr: 'icons/cart', ex: 'icons/ship', rl: 'nav/lords', lr: 'icons/academy', mg: 'ui-workers', bd: 'ui-shops', ct: 'icons/pact' };
const tkIc = id => TK_ICON[String(id).slice(0, 2)] || 'ui-tasks';
const tkCard = sl => { // بطاقة ask لخانة قصيرة/أسبوعية بحسب حالتها
  const id = 'tk:' + sl.tier;
  if (sl.state === 'offer') return { id, icon: 'ui-tasks', title: sl.name, why: 'اختر واحدة من ثلاث.', state: 'open', prio: 5,
    opts: sl.offers.map(o => ({ id: 'o' + o.i, icon: tkIc(o.id), title: o.text, effect: 'لماذا اقترحتها؟ ' + o.why + (o.fit ? E.TKC_TXT.id : '') + ' · المكافأة: ' + o.reward, act: () => A.tasksPick(S, sl.tier, o.i) })) };
  if (sl.state === 'active') return { id, icon: 'ui-tasks', title: sl.name, why: sl.kind, state: 'open', prio: 5, keepRes: true, bar: { v: sl.n, mx: sl.need }, res: 'التقدم: ' + sl.prog + ' · المكافأة: ' + sl.reward + ' · المهلة: ' + dayAr(sl.left),
    opts: [{ id: 'cur', icon: tkIc(sl.id), title: sl.text, effect: 'لماذا اقترحتها؟ ' + sl.why, on: true }, { id: 'drop', icon: 'ui-decline', title: 'تراجع واختر غيرها', effect: '', act: () => A.tasksDrop(S, sl.tier) }] };
  return null;
};
function tkSlotHTML(sl) {
  const c = tkCard(sl); if (c) return ask(c, c.id);
  const fin = sl.fin ? ask({ id: 'tkd:' + sl.tier, icon: 'ui-tasks', title: 'أنجزتَ المهمة: ' + sl.fin.text, why: 'المكافأة: ' + sl.fin.reward, state: 'done', res: sl.fin.say }) : '';
  return `<div class="tk-slot" data-tk-slot="${sl.tier}" data-state="${sl.state}"><h3 class="tk-h">${esc(sl.name)}</h3>${fin}<div class="small muted tk-wait">${esc(sl.text)}</div></div>`;
}
function tkSeasonHTML(v) {
  const s = v.season; if (!s || (!s.cur.length && !s.done.length)) return '';
  const cur = s.cur.map(c => { const card = { id: 'tk:season:' + c.k, icon: 'icons/target', title: s.name, why: 'موسم ' + c.label, state: 'open', prio: 5, res: 'التقدم: ' + c.n + ' من ' + c.need + ' · المكافأة: ' + c.reward + ' · المهلة: ' + dayAr(c.left),
      opts: [{ id: 'cur', icon: 'icons/target', title: c.text, effect: 'لماذا اقترحتها؟ ' + c.why, on: true }] }; return ask(card, card.id).replace(/<\/div>$/, `${bar(c.n, c.need, 'gold')}</div>`); });
  const done = s.done.map(c => ask({ id: 'tkd:season:' + c.k, icon: 'icons/target', title: 'أنجزتَ المهمة: ' + c.text, why: 'المكافأة: ' + c.reward, state: 'done', res: E.TASKS.TXT.done }));
  return `<div class="tk-slot" data-tk-slot="season"><h3 class="tk-h">${esc(s.name)}</h3>${cur.join('')}${done.join('')}</div>`;
}
function tkTopHTML(v) { // سطر السقف الأسبوعي وشريطه (051: جزء tkBodyHTML الأول حرفاً، ويقرؤه مجال tasks)
  v = v || E.tasksView(S); if (!v) return '';
  const tt = v.titles, tl = tt ? (tt.got.length ? E.TKC_TXT.got.replace('{قائمة}', tt.got.join(' · ')) + (tt.next ? ' · ' + E.TKC_TXT.next.replace('{لقب}', tt.next.name).replace('{ن}', tt.next.n).replace('{نوع}', tt.next.kind) : '') : tt.next ? E.TKC_TXT.first.replace('{لقب}', tt.next.name).replace('{ن}', tt.next.n).replace('{نوع}', tt.next.kind) : '') : '';
  return `<p class="small muted tk-top">${esc(v.top)}${tt && tl ? ` <span class="tk-titles" data-tk-titles>${esc(tl)}</span>` : ''}</p><div class="tk-cap small" data-tk-cap><span>${esc(v.week)}</span>${bar(v.infl, v.inflCap, 'gold')}${v.capped ? `<div class="muted">${esc(E.TASKS.TXT.capped)}</div>` : ''}</div>`;
}
function tkBodyHTML() {
  const v = E.tasksView(S); if (!v) return '';
  return tkTopHTML(v) + v.slots.map(tkSlotHTML).join('') + tkSeasonHTML(v);
}
/* 038د T031 (051): «مهامك» مجال في dDomains (askFrom('tasks') يرتّب بـprio ويؤجَّل بـdsnooze وتظهر «لا شيء ينتظرك») وشارة بعدد الخانات المنتظرة في «اليوم» */
dDomains.tasks = { icon: 'ui-tasks', name: 'مهامك', gen: () => tkAskCards(), extra: () => { const v = tkUiOn() && E.tasksView(S); return v ? tkTopHTML(v) + v.slots.filter(sl => !tkCard(sl)).map(tkSlotHTML).join('') /* الخانات بلا بطاقة (منتظرة/أُنجزت) بنصها كما في «اليوم» */ + tkSeasonHTML(v) : ''; },
  get sub() { try { return E.tasksView(S).top; } catch (e) { return 'المطلوب منك الآن'; } } };

/* 051: شارة «المهام» بعدد الخانات المنتظرة (عرض أو جارية) في رأس القسم بصف واحد مع العنوان؛ عدد 0 يبقى بلا رقم فلا يقفز التخطيط */
const tkChip = () => (WIN.on ? dchip({ id: 'tasks', icon: 'ui-tasks', count: askFrom('tasks').length }) : '');
const tkSectionHTML = () => (tkUiOn() ? `<section class="card tasks" aria-label="مهامك">${WIN.on ? `<div class="tk-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h2 style="margin:0">مهامك</h2>${tkChip()}</div>` : '<h2 style="margin-top:0">مهامك</h2>'}${tkBodyHTML()}</section>` : '');
/* بطاقات ask الحيّة لـdChoose (اختيار/تراجع): تُبنى من العرض نفسه فيجدها المعالج من أي مكان (النافذة أو «اليوم») */
function tkAskCards() { const v = tkUiOn() && E.tasksView(S); return v ? v.slots.map(tkCard).filter(Boolean) : []; }
function tkHomeRow() { // سطر «مهامك» في «حال أعمالي»: عدد الجارية، ويفتح النافذة (نقرتان من الرئيسية: السطر ثم الاختيار)
  if (!tkUiOn()) return ''; const b = E.tasksBrief(S); if (!b) return '';
  return hsRow(WIN.on ? 'tasks' : 'fold:hs-tasks', 'ui-tasks', `<b>مهامك</b> <b class="num">${b.n}</b><small>${b.n ? 'جارية الآن' : 'لا مهمة جارية'} · اختر واحدة من ثلاث</small>`);
}

ASK_SRC.tasks = tkAskCards; // 051
