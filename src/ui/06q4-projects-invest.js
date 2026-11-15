/* ---------- 046 المشاريع الكبرى استثمارات (الواجهة): فوق مكوّنات 037 (dsheet وask وdchip) بلا قوائم منسدلة ولا أيقونات جديدة ----------
   نقاط الوصول: سطر «مشاريعك» في «حال أعمالي» (نقرة) ← نافذة القائمة ← تقرير المشروع (نقرتان إلى القائمة، ثلاث إلى التقرير)؛ وصف «تقرير المشروع» في بطاقة المشروع بالمكتب (نقرة)؛
   وتنبيهات «اليوم» (ask). الأرقام كلها من E.projectReport/projectsReport/projectEstimate (قراءة فقط). E.PJINV.on=false: لا سطر ولا تقدير ولا تنبيه. */
const pjUiOn = () => { try { return !!(E.PJINV.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const pjSg = n => (n < 0 ? '−' : '+') + fmt(Math.abs(n));
const pjStateName = c => (c >= 85 ? 'ممتازة' : c >= 65 ? 'جيدة' : c >= 45 ? 'مقبولة' : 'متهالكة');
const pjEffPct = c => Math.round(Math.max(0, Math.min(1, c / 60)) * 100);
const pjKv = (k, v, cls) => `<div class="kv"><span>${k}</span><b class="num ${cls || ''}">${v}</b></div>`;
const PJ_FIX_SPEC = { kind: 'pjfix', type: 'standing', scope: '*', limits: { below: 55, pct: 25 }, mode: 'exec' };
/* تقدير ما قبل الدفع (نص PJ-12 للتشغيلي؛ والخدمي بنص PJ-11 المعتمد) */
function pjEstHTML(p) {
  if (!E.PJINV.on || p.done) return ''; const e = E.projectEstimate(S, p.base); if (!e) return '';
  return `<div class="small" data-pj-est>${e.op ? esc(e.text) : esc(e.text) + `<div class="muted">${esc(E.PJ_SERVICE_TEXT)}</div>`}</div>`;
}
function pjReportBody(key) {
  const r = E.projectReport(S, key); if (!r) return '<p class="small muted">لا بيانات بعد.</p>'; const gold = S.player.gold, q = r.quote;
  let h = `<p class="small muted">${esc(r.name)}${r.where ? ' · ' + esc(r.where) : ''}</p>` + pjKv('الحالة', `${Math.round(r.cond)} من 100 · ${pjStateName(r.cond)}`, r.cond < 60 ? 'dear' : '') + `<div class="small muted">الأثر القديم يعمل بقوة ${pjEffPct(r.cond)}٪ من حالته (دون 60 يضعف)${r.flood ? ' · مُعلَّق بفيضان' : ''}${r.off ? ' · التشغيل متوقف' : ''}</div>`;
  if (r.op) {
    h += pjKv('الحركة الآن', r.T == null ? '—' : r.T.toFixed(2)) + pjKv('دخل آخر 30 يوماً', fmt(r.inc30), 'cheap') + pjKv('تشغيل 30 يوماً', '−' + fmt(r.up30), 'dear') + pjKv('ترميم 30 يوماً', r.rep30 ? '−' + fmt(r.rep30) : '0') + pjKv('الصافي', pjSg(r.net30), r.net30 < 0 ? 'dear' : 'cheap')
      + `<div class="small" style="margin-top:8px">استُرد <b class="num">${fmt(r.recovered)}</b> من <b class="num">${fmt(r.C)}</b> (${r.recoveredPct}٪)</div>${bar(r.recovered, r.C, 'gold')}<div class="small" data-pj-pay>الاسترداد: ${esc(r.paybackText)}</div>`;
  } else {
    h += pjKv('تشغيل 30 يوماً', '−' + fmt(r.up30), 'dear') + pjKv('ترميم 30 يوماً', r.rep30 ? '−' + fmt(r.rep30) : '0') + `<div class="small muted" style="margin-top:6px">${esc(E.PJ_SERVICE_TEXT)}</div>`
      + `<div class="small" data-pj-ind style="margin-top:6px"><b>عائده غير المباشر:</b> ${r.ind.uses ? `عمل ${fmt(r.ind.uses)} مرة` + (r.ind.saved > 0 ? ` · وفّر لك ≈ ${fmt(r.ind.saved)} ريال` : '') + (r.ind.pts >= 0.5 ? ` · أضاف ${r.ind.pts >= 10 ? Math.round(r.ind.pts) : r.ind.pts.toFixed(1)} نقطة` : '') : 'لم يُستعمل أثره بعد'} · ${esc(r.eff)}</div>`;
  }
  if (r.ev.length) h += `<h4 class="dsec">آخر الأحداث</h4>` + r.ev.map(e => `<div class="small">يوم ${e.d}: ${esc(e.text)}</div>`).join('');
  const rep = q && q.can ? (gold + 1e-6 >= q.cost ? `<button type="button" class="sm pri" data-act="pjrepair" data-id="${esc(key)}" style="width:100%;min-height:44px;margin-top:8px">رمِّم (${fmt(q.cost)} ريال)</button>` : `<button type="button" class="sm" disabled style="width:100%;min-height:44px;margin-top:8px">رمِّم (${fmt(q.cost)} ريال)</button><div class="small muted">رصيدك لا يكفي للترميم</div>`) : '<div class="small muted" style="margin-top:8px">حالته جيدة: لا يحتاج ترميماً.</div>';
  const dl = E.delegCanAdd(S, PJ_FIX_SPEC), dlb = dl.ok ? `<button type="button" class="sm" data-act="pjdeleg" style="width:100%;min-height:44px;margin-top:8px">فوّض الناظر ترميم المشاريع</button>` : `<button type="button" class="sm" disabled style="width:100%;min-height:44px;margin-top:8px">فوّض الناظر ترميم المشاريع</button><div class="small muted">${esc(dl.msg)}</div>`;
  const stop = r.op ? `<button type="button" class="sm${r.off ? ' on' : ''}" aria-pressed="${r.off ? 'true' : 'false'}" data-act="pjstop" data-id="${esc(key)}" data-v="${r.off ? '1' : '0'}" style="width:100%;min-height:44px;margin-top:8px">${r.off ? 'استأنف التشغيل' : 'أوقف التشغيل'}</button><div class="small muted" data-pj-stop>${r.off ? 'متوقف: لا تشغيل ولا دخل، ويبقى الأثر بقدر حالته.' : 'يعمل: التشغيل يومياً بنحو ' + fmt(r.up) + ' ريال.'}</div>` : '';
  return h + rep + dlb + stop;
}
function pjListBody() {
  const R = E.projectsReport(S); if (!R) return '';
  return `<p class="small muted">آخر 30 يوماً</p>` + R.list.map(x => `<button type="button" class="dchip dchip-row hs-row${x.cond < 60 ? ' warn' : ''}" data-dchip="fold:pjr-${esc(x.key)}" aria-label="${esc('تقرير ' + x.name)}"><span class="dnm"><b>${esc(x.name)}</b> <b class="num ${x.net30 < 0 ? 'dear' : 'cheap'}">${pjSg(x.net30)}</b><small>حالة ${Math.round(x.cond)} · ${pjStateName(x.cond)}${x.off ? ' · متوقف' : ''}${x.op && x.paybackText ? ' · ' + esc(x.paybackText) : ''}</small></span><span class="dgo" aria-hidden="true">›</span></button>`).join('');
}
function pjReg(R) {
  if (!pjUiOn()) return; R = R || E.projectsReport(S); if (!R) return;
  dsh.folds['hs-pj'] = { sum: '<b>مشاريعك</b>', body: pjListBody, def: false };
  for (const x of R.list) dsh.folds['pjr-' + x.key] = { sum: '<b>تقرير ' + esc(x.name) + '</b>', body: () => pjReportBody(x.key), def: false };
}
/* صف «تقرير المشروع» في بطاقة المشروع المكتمل (المكتب) */
function pjRepRow(p) {
  if (!pjUiOn() || !p.done) return ''; const R = E.projectsReport(S); if (!R || !R.list.some(x => x.key === p.id)) return ''; pjReg(R); const x = R.list.find(y => y.key === p.id);
  return `<button type="button" class="dchip dchip-row hs-row${x.cond < 60 ? ' warn' : ''}" data-dchip="fold:pjr-${esc(p.id)}" aria-label="${esc('تقرير المشروع ' + x.name)}"><span class="dnm"><b>تقرير المشروع</b><small>حالة ${Math.round(x.cond)}${x.op ? ' · صافي 30 يوماً ' + pjSg(x.net30) : ' · ' + (x.ind.uses ? 'عائده غير المباشر ظاهر' : 'خدمة عامة')}</small></span><span class="dgo" aria-hidden="true">›</span></button>`;
}
/* سطر «حال أعمالي»: مشاريعك: N تعمل · صافي الشهر ±X (يُخفى إن لا مشروع مكتمل) */
function pjHomeRow() {
  if (!pjUiOn()) return ''; const R = E.projectsReport(S); if (!R) return ''; pjReg(R); const warn = R.low.length > 0 || R.losing.length > 0;
  return hsRow('fold:hs-pj', 'icons/scales', `<b>مشاريعك</b> <b class="num ${R.net30 < 0 ? 'dear' : 'cheap'}">${pjSg(R.net30)}</b><small>${R.running} ${R.running === 1 ? 'يعمل' : 'تعمل'} من ${R.list.length} · صافي الشهر${R.low.length ? ` · <b class="dear">${R.low.length} يتهالك</b>` : ''}</small>`, warn);
}
/* تنبيهات «اليوم»: حالة < 60، حدث، ومشروع يخسر ثلاثة أشهر (مقترح واحد لكل حالة، معطّل بسببه) */
function pjAskCards() {
  if (!pjUiOn()) return []; const R = E.projectsReport(S); if (!R) return []; const out = [], gold = S.player.gold, dl = E.delegCanAdd(S, PJ_FIX_SPEC);
  const fixOpt = (x, id) => { const q = x.quote; return q && q.can ? (gold + 1e-6 >= q.cost ? { id: 'repair', icon: 'ui-pay', title: 'رمِّمه الآن (' + fmt(q.cost) + ' ريال)', effect: 'يعود إلى ' + E.PJ_INV.repairTo + ' · موصى به', best: true, act: () => { const r = A.projectRepair(S, x.key); if (r.ok !== false) E.pjEvSeen(S, x.key); return r; } } : { id: 'repair', icon: 'ui-pay', title: 'رمِّمه الآن (' + fmt(q.cost) + ' ريال)', off: 'رصيدك لا يكفي' }) : { id: 'repair', icon: 'ui-pay', title: 'رمِّمه الآن', off: 'حالته جيدة' }; };
  const delOpt = () => (dl.ok ? { id: 'steward', icon: 'ui-delegate', title: 'اتركه للناظر', effect: 'قاعدة دائمة: يرمّم تحت حالة 55 بميزانية 25٪ من صافي المشاريع', act: () => A.delegAdd(S, PJ_FIX_SPEC) } : { id: 'steward', icon: 'ui-delegate', title: 'اتركه للناظر', off: dl.msg });
  R.low.slice(0, 2).forEach(x => { const id = 'pj:low:' + x.key; out.push({ id, w: 88, icon: 'icons/scales', title: 'مشروعك «' + x.name + '» بدأ يتهالك', why: 'حالته ' + Math.round(x.cond) + ' من 100 · أثره يعمل بقوة ' + pjEffPct(x.cond) + '٪' + (x.op ? ' · صافي 30 يوماً ' + pjSg(x.net30) : ''), state: 'open', prio: 2, opts: [fixOpt(x, id), dPostpone(id, 7), delOpt()] }); });
  R.evs.slice(0, 2).forEach(x => { const e = x.ev[0], id = 'pj:ev:' + x.key + ':' + e.d; out.push({ id, w: 90, icon: 'icons/scales', title: e.text, why: 'حالته الآن ' + Math.round(x.cond) + ' · الترميم لا يُخصم تلقائياً', state: 'open', prio: 2, opts: [fixOpt(x, id), dPostpone(id, 7)] }); });
  R.losing.slice(0, 2).forEach(x => { const id = 'pj:loss:' + x.key; out.push({ id, w: 84, icon: 'icons/scales', title: '«' + x.name + '» يخسر منذ ' + x.low + ' أشهر', why: 'صافي 30 يوماً ' + pjSg(x.net30) + ' · ' + x.paybackText + ' · حركة قليلة: ابنِ على طريق أزحم المرة القادمة', state: 'open', prio: 3, opts: [
    { id: 'stop', icon: 'ui-pay', title: 'أوقف التشغيل', effect: 'يوقف الدفع والدخل ويبقى الأثر بقدر حالته', best: true, act: () => A.projectStop(S, x.key) }, { id: 'noted', icon: 'ui-postpone', title: 'حركة قليلة: ابنِ على طريق أزحم المرة القادمة', effect: 'بلا فعل · يختفي من المطلوب ' + dayAr(90), act: () => { ui.dsnooze = ui.dsnooze || {}; ui.dsnooze[id] = S.day + 90; saveUi(); return { ok: true, msg: 'أجّلنا التذكير' }; } }] }); });
  return out.filter(c => !dSnoozed(c.id));
}
