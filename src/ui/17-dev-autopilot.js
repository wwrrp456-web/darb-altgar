/* ---------- وضع المطوّر (للمالك فقط) ----------
   لمس الشعار 7 مرات خلال 4 ثوانٍ ثم رمز سري. يُحفظ الجزء المُشفَّر (SHA-256) لا الرمز نفسه، وتبقى الحالة على الجهاز.
   هذه حماية للواجهة لا أكثر: اللعبة بلا خادم، ومن فتح أدوات المتصفح يستطيع تعديل حالته أصلاً. */
const DEV_SALT = 'darb-dev-v1', DEV_HASH = '8e71f1d941d4d2cd0a64f6a935b0224e9d6cca55ba1e9f72a5c2c8b2d36e6676', DEV_KEY = 'darb-dev';

/* ---------- التشغيل التلقائي للمطوّر: يلعب اللعبة كلاعب جيد أمام عينك ويكشف أين تتعثر. لا يحفظ شيئاً على جهازك (apNoSave) ---------- */
const AP = { seed: 0, on: false, paused: false, speed: 'x5', target: 'grad', start: 'sa', mode: 'fresh', inject: true, steps: 0, same: 0, log: [], errs: [], tm: null, t0: 0, last: '', sig: '', reason: '', lvSteps: 0, lastLv: 0, kinds: [], stuck: false, finished: false };
const AP_DELAY = { slow: 650, x5: 120, max: 0 }, AP_TARGETS = { grad: 'حتى إتمام المراحل 22', y1: 'التخرج ثم حول كامل', y3: 'التخرج ثم 3 أحوال', y5: 'التخرج ثم 5 أحوال' };
const apQ = sel => document.querySelector(sel);
const apLog = t => { AP.log.push('[يوم ' + S.day + ' · م' + (S.learn ? S.learn.level : '-') + '] ' + t); if (AP.log.length > 80) AP.log.shift(); AP.last = t; };
const apOnErr = ev => { if (AP.on) AP.errs.push(String((ev && (ev.message || (ev.reason && ev.reason.message || ev.reason))) || ev).slice(0, 220)); };
window.addEventListener('error', apOnErr); window.addEventListener('unhandledrejection', apOnErr);
function apSig() { const m = main(), L = S.learn || {}; const kd = (() => { try { const n = learnNext(); return n ? n.k + (n.id || n.lvl || '') : ''; } catch (e) { return 'x'; } })(); return [S.day, L.level, Math.round(S.player.gold), m.city, m.left, Object.values(L.ev || {}).reduce((a, b) => a + b, 0), S.player.trips, kd, (L.cards || []).length, S.yr ? S.yr.n : -1, seq ? JSON.stringify([seq.id, seq.i, seq.ans, seq.rep]) : ''].join('|'); }
function apBar() {
  let el = $('apbar'); if (!el) { el = document.createElement('div'); el.id = 'apbar'; document.body.appendChild(el); }
  const L = S.learn || {}, lv = L.level >= 11 ? 'حر' : L.level, st = AP.finished ? (AP.stuck ? 'توقّف: ' + AP.reason : 'اكتمل: ' + AP.reason) : AP.paused ? 'متوقف مؤقتاً' : 'يعمل';
  el.hidden = false; el.className = AP.finished ? (AP.stuck ? 'stuck' : 'done') : '';
  el.innerHTML = `<div class="apb1"><b>تشغيل تلقائي</b> <span>${esc(st)}</span> <span class="small">م${lv} · يوم ${S.day} · ${fmt(S.player.gold)} ر.س · خطوة ${AP.steps}${AP.errs.length ? ' · أخطاء ' + AP.errs.length : ''}</span></div><div class="apb2 small">${esc(AP.last || '')}</div><div class="apb3">${AP.finished ? '' : `<button data-act="appause">${AP.paused ? '▶ تابع' : '⏸ إيقاف مؤقت'}</button><button data-act="apstep">خطوة</button>${['slow', 'x5', 'max'].map(k => `<button data-act="apspeed" data-g="${k}" class="${AP.speed === k ? 'on' : ''}">${{ slow: 'عادي', x5: '×5', max: 'أقصى' }[k]}</button>`).join('')}<button data-act="apstop">إيقاف</button>`}<button data-act="apcopy">نسخ التقرير</button>${AP.finished ? '<button data-act="apend">إنهاء التجربة واسترجاع لعبتي</button>' : ''}</div>`;
}
function apReport() {
  const m = main(), L = S.learn || {}, n = (() => { try { return learnNext(); } catch (e) { return null; } })(), st = (() => { try { const x = missionStep(); return x ? (x.msg || x.label || '').replace(/<[^>]+>/g, '') : ''; } catch (e) { return ''; } })();
  return ['تقرير التشغيل التلقائي — درب التجّار (' + E.VER + ')', 'الحالة: ' + (AP.finished ? (AP.stuck ? 'توقّف: ' : 'اكتمل: ') + AP.reason : AP.paused ? 'متوقف مؤقتاً' : 'يعمل'), 'الهدف: ' + AP_TARGETS[AP.target] + ' · السرعة: ' + AP.speed + ' · الخطوات: ' + AP.steps + ' · المدة: ' + Math.round((Date.now() - AP.t0) / 1000) + ' ث',
    'اليوم ' + S.day + ' · المستوى ' + L.level + ' · الرصيد ' + Math.round(S.player.gold) + ' · الثروة ' + Math.round(E.netWorth(S)) + ' · الطور ' + S.phase + ' · المدينة ' + m.city + ' (في الطريق: ' + m.left + ')',
    'النافذة الحالية: ' + (n ? n.k + (n.id ? ':' + n.id : n.lvl ? ':' + n.lvl : '') : 'لا شيء') + ' · خطوة المهمة: ' + st.slice(0, 160), 'أخطاء برمجية (' + AP.errs.length + '): ' + AP.errs.slice(0, 5).join(' | '), 'تسلسل النوافذ: ' + AP.kinds.slice(-30).join(' › '), '', 'آخر الأفعال:'].concat(AP.log.slice(-25)).join('\n');
}
function apLesson() {
  const n = learnNext(); if (!n) return null; let b;
  if ((b = apQ('#lesson [data-act=lstart][data-g=' + AP.start + ']'))) { b.click(); return 'اختيار دولة البداية'; }
  if ((b = apQ('#lesson [data-act=evch][data-g=close]'))) { b.click(); return 'إغلاق حكم مجلس السوق'; }
  if ((b = apQ('#lesson .mjopts button'))) { b.click(); return 'إجابة مسألة مجلس السوق'; }
  if ((b = apQ('#lesson [data-act=evch][data-g=no]'))) { b.click(); return 'رفض عرض الحدث'; }
  if (apQ('#lesson #pname')) { $('pname').value = 'مراقب'; apQ('#lesson [data-act=lname]').click(); return 'كتابة الاسم'; }
  if ((b = apQ('#lesson [data-act=datego]:not([disabled])'))) { b.click(); return 'اختيار تاريخ البداية'; }
  if ((b = apQ('#lesson [data-act=lchar][data-g=trader]'))) { b.click(); return 'اختيار الشخصية'; }
  const ans = apQ('#lesson [data-act=lans]:not([disabled])');
  if (ans) { let ok = 0; try { ok = beatsOf(n)[seq.i].quiz.ok; } catch (e) {} (apQ('#lesson [data-act=lans][data-g="' + ok + '"]') || ans).click(); return 'إجابة سؤال عمّ سالم'; }
  if ((b = apQ('#lesson [data-act=lrep]'))) { b.click(); return 'متابعة الدرس'; }
  if ((b = apQ('#lesson [data-act=lnext]'))) { b.click(); return 'التالي في الدرس'; }
  if ((b = apQ('#lesson [data-act=zpay]'))) { const Z = S.zakat; if (Z && Z.due && S.player.gold >= Math.min(Z.amount, 1) && S.player.gold > 0) { b.click(); if (S.zakat.due && (apQ('#lesson [data-act=zdefer]'))) { apQ('#lesson [data-act=zdefer]').click(); return 'تأجيل الزكاة (الرصيد لا يكفي)'; } return 'إخراج الزكاة'; } const d = apQ('#lesson [data-act=zdefer]'); if (d) { d.click(); return 'تأجيل الزكاة: لا نقد'; } }
  if (apQ('#lesson [data-act=cqa]:not([disabled])')) { let ci = 0; try { ci = E.CARDS.CARDS[n.id].quiz.ok; } catch (e) {} const t = apQ('#lesson [data-act=cqa][data-g="' + ci + '"]'); if (t) { t.click(); return 'إجابة سؤال بطاقة'; } }
  if ((b = apQ('#lesson [data-act=lclose]:not([disabled])'))) { b.click(); return 'إغلاق نافذة (' + n.k + ')'; }
  return null;
}
function apOverlays() {
  const climate=apQ('#lesson:not([hidden]) [data-act=climateclose]');if(climate){climate.click();return 'قراءة تقرير السنة';}
  if (S.life && S.life.pending) { renderAll(true); const b=apQ(S.life.pending==='salem'?'#agingPanel [data-act=lifeack]':'#agingPanel [data-act=liferetire]'); if(b){b.click();return 'متابعة انتقال الأمانة';} }

  if (roadRes) { roadRes = null; return 'بطاقة نتيجة الطريق'; }
  if (S.road) { const b = apQ('#dlg [data-act=roadopt][data-c=pay]'); if (b) { b.click(); return 'قطّاع طرق: دفع فدية الطريق'; } }
  if (S.story && S.story.cur) { A.dlgClose(S); renderAll(true); return 'إغلاق حوار'; }
  const L = $('lesson'); if (L && !L.hidden) { const kd = L.dataset.kind || ''; if (kd && AP.kinds[AP.kinds.length - 1] !== kd) AP.kinds.push(kd); const r = apLesson(); if (r) return r; return 'نافذة ' + kd + ' لا يُعرف كيف تُغلق'; }
  if (help) { help = false; renderAll(true); return 'إغلاق المساعدة'; }
  if (dg || apQ('#modal .mbox')) { dg = null; renderAll(true); return 'إغلاق نافذة'; }
  if (salemOpen) { salemSet(false); return 'إغلاق لوحة عمّ سالم'; }
  if (prof) { prof = false; renderAll(true); return 'إغلاق الملف'; }
  return null;
}
function apPlay() {
  const L = S.learn, m = main();
  if (!L || !L.char) return null;
  if (L.level >= 11) { E.botMain(S); E.botBuild(S); step(); renderAll(true); return 'لعب حر: يوم ' + S.day + (S.yr ? ' · الحول ' + (S.yr.n + 1) : ''); }
  if (E.stageStatus(S)?.waiting) { if (AP.inject) S.player.gold += 30 * 15; for (let n = 0; n < 30 && E.stageStatus(S)?.waiting && !(S.life && S.life.pending); n++) { E.A.work(S); E.tick(S); S.pause = false; } renderAll(true); return 'استكشاف بين المراحل'; }
  const st = missionStep();
  if (m.left > 0) { let k = 0; while (m.left > 0 && k++ < 6 && !learnNext() && !S.road) { S.pause = false; step(); } return 'السفر إلى ' + (S.cities[m.dest] ? cityName(m.dest) : '؟') + ' (باقٍ ' + m.left + ')'; }
  if (st && st.note && AP.inject) { S.player.gold += E.PHASE_AT[Math.min(3, S.phase)] + 2000; apLog('حقن رصيد لبوابة الثروة'); }
  if (st && st.run) { const t = (st.label || '').replace(/<[^>]+>/g, '') || (st.msg || '').replace(/<[^>]+>/g, '').slice(0, 60); st.run(); if (speed && m.left === 0) step(); renderAll(true); return 'خطوة المهمة: ' + t; }
  S.pause = false; step(); renderAll(true); return 'يوم جديد (لا خطوة مهمة)';
}
function apFinish(reason, stuck) { AP.finished = true; AP.stuck = !!stuck; AP.reason = reason; clearTimeout(AP.tm); AP.on = false; apLog((stuck ? 'توقّف: ' : 'اكتمل: ') + reason); apBar(); }
function apCheckEnd() {
  const L = S.learn || {};
  if (AP.errs.length) return apFinish('خطأ برمجي: ' + AP.errs[0], true), true;
  if (L.level >= 11 && AP.freeStart == null) AP.freeStart = S.day;
  if (AP.target === 'grad' && L.level >= 11) return apFinish('وصلتَ للتخرج (م11) في اليوم ' + S.day), true;
  const yrs = { y1: 1, y3: 3, y5: 5 }[AP.target]; if (yrs && AP.freeStart != null && S.day - AP.freeStart >= yrs * E.AGE_YEAR) return apFinish('أُنجزت ' + yrs + ' أحوال من اللعب الحر (يوم ' + S.day + ')'), true;
  if (AP.steps > 60000) return apFinish('بلغ حدّ الخطوات', true), true;
  return false;
}
function apOne() {
  AP.steps++; const sig0 = apSig(), lv0 = (S.learn || {}).level;
  let r = null; try { r = apOverlays() || apPlay(); } catch (e) { AP.errs.push('استثناء: ' + e.message); }
  if (r) apLog(r);
  if (((S.learn || {}).stage || (S.learn || {}).level) !== AP.lastLv) { AP.lastLv = (S.learn || {}).stage || (S.learn || {}).level; AP.lvSteps = 0; apLog('← المستوى ' + AP.lastLv + ' · يوم ' + S.day + ' · رصيد ' + Math.round(S.player.gold)); } else AP.lvSteps++;
  if (apSig() === sig0) AP.same++; else AP.same = 0;
  if (apCheckEnd()) return false;
  if (AP.same >= 14) return apFinish('لا تقدّم بعد 14 محاولة متتالية', true), false;
  if (AP.lvSteps > 400 && S.learn.level < 11) return apFinish('علق المستوى ' + S.learn.level + ' أكثر من 400 خطوة', true), false;
  return true;
}
function apLoop() {
  if (!AP.on || AP.paused) return;
  const batch = AP.speed === 'max' ? 30 : 1;
  for (let i = 0; i < batch; i++) { if (!apOne()) return; if (!AP.on || AP.paused) break; }
  apBar(); AP.tm = setTimeout(apLoop, AP_DELAY[AP.speed]);
}
function apStart(o) {
  Object.assign(AP, { on: true, paused: false, finished: false, stuck: false, reason: '', steps: 0, same: 0, log: [], errs: [], kinds: [], t0: Date.now(), lvSteps: 0, lastLv: 0 }, o || {}); apNoSave = true;
  clearInterval(timer); speed = 0;
  if (AP.mode === 'fresh') { coverOn = false; storyGo = true; S = E.newGame(AP.seed || ((Date.now() % 90000) + 7)); S.tut = { on: false, i: 0, f: {} }; sel = main().city; carSel = 1; mapC = 'all'; mapView = { zoom: 1, center: null }; mapListOpen = {}; dg = null; prof = false; seq = null; view = null; mhelp = null; go('home'); }
  AP.freeStart = S && S.learn && S.learn.level >= 11 ? S.day : null;
  if (S) S.fxFree = true; // اللاعب الآلي يصرف تلقائياً (لا يزور الصرافة)
  document.body.classList.add('autoplay'); apLog('بدأ التشغيل التلقائي: ' + (AP.mode === 'fresh' ? 'لعبة تجريبية جديدة' : 'من حالتك الحالية (بلا حفظ)') + ' · ' + AP_TARGETS[AP.target]); apBar(); clearTimeout(AP.tm); AP.tm = setTimeout(apLoop, 200);
}
function apOpen() {
  let el = $('apmodal'); if (!el) { el = document.createElement('div'); el.id = 'apmodal'; el.className = 'modal'; document.body.appendChild(el); }
  el.hidden = false; el.innerHTML = `<div class="mbox" style="max-width:360px;margin:auto"><b>التشغيل التلقائي</b><div class="small muted">يلعب اللعبة كلاعب جيد أمام عينك، ويتوقف ويخبرك إن تعثّر. لا يحفظ شيئاً على جهازك: لعبتك المحفوظة آمنة.</div>
    <label class="small">البداية <select id="apMode"><option value="fresh">لعبة تجريبية جديدة</option><option value="current">من حالتي الحالية (بلا حفظ)</option></select></label>
    <label class="small">الدولة <select id="apStart">${E.COUNTRIES.map(c => `<option value="${c.id}">${c.flag} ${c.name}</option>`).join('')}</select></label>
    <label class="small">الهدف <select id="apTarget">${Object.keys(AP_TARGETS).map(k => `<option value="${k}">${AP_TARGETS[k]}</option>`).join('')}</select></label>
    <label class="small">السرعة <select id="apSpeed"><option value="slow">عادي (ترى كل خطوة)</option><option value="x5" selected>×5</option><option value="max">أقصى سرعة</option></select></label>
    <label class="small"><input type="checkbox" id="apInject" checked> أحقن رصيداً عند بوابات الثروة (وإلا طال الانتظار)</label>
    <div class="row"><button class="pri" data-act="apgo">ابدأ</button><button data-act="apclose">إلغاء</button></div></div>`;
}
document.addEventListener('keydown', ev => { if (AP.on && ev.key === 'Escape') { AP.paused = true; apBar(); } });
let devMode = false, devTaps = [], devFails = 0;
try { localStorage.removeItem(DEV_KEY); devMode = sessionStorage.getItem(DEV_KEY) === DEV_HASH; } catch (e) {} // مع الجلسة فقط: يزول بإغلاق التطبيق
function setDev(on) {
  devMode = !!on; try { on ? sessionStorage.setItem(DEV_KEY, DEV_HASH) : sessionStorage.removeItem(DEV_KEY); } catch (e) {}
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
  devFails++; const m = $('devmsg'); if (m) m.textContent = devFails >= 5 ? 'مقفل لبقية هذه الجلسة' : 'رمز غير صحيح (' + devFails + ' من 5)';
  if (devFails >= 5) setTimeout(() => { const g = $('devgate'); if (g) g.hidden = true; }, 900);
}
function devLevel(n) {
  const L = S.learn; if (!L || !L.char) return toast('اختر الشخصية أولاً');
  const stage = E.STAGES[Math.max(0, Math.min(E.STAGES.length - 1, n - 1))]; L.stage = Math.max(1, Math.min(E.STAGES.length + 1, n)); L.ageStages = 1; L.stageIntro = L.stage; L.stageUp = []; L.ageOffset = Math.max(0, (stage ? stage.age : 95) - (25 + S.day / E.AGE_YEAR)); L.lastStageAge = null; L.level = n > E.STAGES.length ? 11 : stage.source; L.intro = L.level; L.rest = null; L.hold = 0; ['up', 'sq', 'bq', 'csq', 'tq', 'fq', 'eq', 'rq'].forEach(k => { if (L[k]) L[k].length = 0; });
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
window.addEventListener('beforeunload', persist); window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });

boot();
if (S.away || S.awayJob) setTimeout(resumeAwayUI, 0);
{ const h = location.hash.replace('#', ''); screen = SCREENS.some(x => x[0] === h) ? h : 'home'; if (S.learn && !S.learn.char && !storyGo) screen = 'home'; }
renderAll(true);
const GAME = { tutFirstDeal, tutScoutCity, get AP() { return AP; }, apStart, apReport, get S() { return S; }, E, setSpeed, go, renderAll, calmNow, dealGo, learnNext, salem: (open, tab) => salemSet(open !== false, tab) };
if (navigator.webdriver || devMode) window.__game = GAME;
