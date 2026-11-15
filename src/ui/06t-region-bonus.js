/* 035هـ واجهة وكيل الإقليم بالدرجات: بطاقة الكفاءة وسطر النقل الساري وزرّا التوزيع داخل بطاقة الوكيل، وبطاقات «المطلوب» rag:shift وrag:perf وrag:fund؛ فوق ask ومكوّنات 037 فقط (بلا قوائم منسدلة ولا أيقونات جديدة).
   وبطاقة المكافأة bon:* (§3؛ مفتاح BON.on) تُولَّد في الدالة نفسها ليجدها dChoose. */
const ragUiOn = () => { try { return !!(E.RAG.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
function ragAskCards() {
  if (!ragUiOn()) return []; const out = [];
  try {
    for (const c of E.ragView(S).cards) {
      const ra = E.agentOf(S, c.country), ct = (E.CD[c.country] || {}).name || '';
      if (c.kind === 'shift') {
        const f = cityName(c.from), t = cityName(c.to);
        out.push({ id: c.id, icon: 'ui-delegate', title: 'نقل جزء من الحد · ' + ct, why: 'عائد الحد في ' + t + ' ' + c.rb + ' وفي ' + f + ' ' + c.rw + '. أقترح نقل ' + Math.round(E.RAG.shift.k * 100) + '٪ من حد ' + f + ' (' + fmt(c.d) + ' ريال يومياً) إلى ' + t + ' لمدة ' + c.days + ' يوماً.', state: 'open', w: 52, mark: true, opts: [
          { id: 'move', icon: 'ui-delegate', title: 'انقل ' + fmt(c.d) + ' ريال', effect: 'حد ' + f + ' ينقص ' + fmt(c.d) + ' وحد ' + t + ' يزيد ' + fmt(c.d) + ' · مجموع الحدود ثابت · ' + dayAr(c.days), best: true, act: () => A.ragShift(S, c.country, c.from, c.to) },
          dPostpone(c.id, 7)] });
      } else if (c.kind === 'perf') {
        const b = cityName(c.best);
        out.push({ id: c.id, icon: 'ui-delegate', title: 'توزيع حد الدولة بالأداء · ' + ct, why: 'صار وكيلك شيخ الصنعة: أقترح توزيع حدّ الدولة ' + Math.round(E.RAG.perf.need * 100) + '٪ بالحاجة و' + Math.round(E.RAG.perf.profit * 100) + '٪ بالربح. بهذا تأخذ ' + b + ' ' + fmt(c.limPerf) + ' بدل ' + fmt(c.limNeed) + '.', state: 'open', w: 54, mark: true, opts: [
          { id: 'perf', icon: 'ui-delegate', title: 'وزّع بالحاجة والربح', effect: b + ' يأخذ ' + fmt(c.limPerf) + ' بدل ' + fmt(c.limNeed) + ' يومياً · مجموع الحد ثابت', best: true, act: () => A.ragMode(S, c.country, 'perf') },
          { id: 'need', icon: 'ui-decline', title: 'أبقِ التوزيع بالحاجة', effect: 'يبقى ' + b + ' على ' + fmt(c.limNeed) + ' يومياً', act: () => A.ragMode(S, c.country, 'need') }] });
      } else if (c.kind === 'fund') {
        out.push({ id: c.id, icon: 'ui-pay', title: 'رفع الحد اليومي · ' + ct, why: 'حاجة مناطقك ' + fmt(c.N) + ' ريال يومياً وحدّك ' + fmt(c.pool) + '. أقترح رفعه إلى ' + fmt(c.Z) + '؛ يبقى احتياطي المستحقات والزكاة (' + fmt(c.res) + ') لا يُمس.', state: 'open', w: 56, mark: true, opts: [
          { id: 'raise', icon: 'ui-pay', title: 'اجعله ' + fmt(c.Z), effect: 'الحد من ' + fmt(c.pool) + ' إلى ' + fmt(c.Z) + ' ريال يومياً · لا يُرفع إلا بنقرتك', best: true, act: () => A.agentPolicy(S, c.country, c.Z, ra && ra.usd) },
          dPostpone(c.id, 7)] });
      }
    }
  } catch (e) {}
  try { out.push(...bonAskCards()); } catch (e) {}
  return out.filter(c => !dSnoozed(c.id));
}
const ragBtn = (c, v, label, on) => `<button type="button" class="sm${on ? ' on' : ''}" aria-pressed="${on ? 'true' : 'false'}" data-act="ragmode" data-i="${esc(c)}" data-v="${v}" style="min-height:44px">${esc(label)}</button>`;
function ragAgentHTML(country, ra) {
  if (!E.RAG.on || !ra) return ''; const v = E.ragView(S).agents[country]; if (!v) return '';
  let h = typeof skillCardHTML === 'function' ? skillCardHTML(ra, 'وكيل الإقليم') : '';
  if (v.shift) h += `<div class="small" data-rag-shift>نقل ${Math.round(v.shift.k * 100)}٪ من حد ${esc(cityName(v.shift.from))} إلى ${esc(cityName(v.shift.to))} حتى يوم ${v.shift.till} <button type="button" class="sm" data-act="ragshiftoff" data-i="${esc(country)}" style="min-height:44px">ألغِ النقل</button></div>`;
  if (v.grade >= 5) {
    const sum = Object.entries(v.alloc).map(([id, x]) => esc(cityName(id)) + ': ' + fmt(x)).join(' · ');
    h += `<div class="small muted">توزيع الحد</div><div class="chips" role="group" aria-label="توزيع الحد">${ragBtn(country, 'need', 'بالحاجة', v.mode === 'need')}${ragBtn(country, 'perf', 'بالحاجة والربح', v.mode === 'perf')}</div><div class="small" data-rag-sum>التوزيع الآن: ${sum || 'لم يوزَّع بعد'}</div>`;
  }
  return h + bonPersonHTML(ra, 'ra', country);
}

/* ---- المكافأة الشهرية §3: بطاقة bon:{id} (أعطه / نصفها / لا مكافأة)، وحقل المبلغ في بطاقة الشخص ---- */
const bonUiOn = () => { try { return !!(E.BON.on && E.SKILL.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
function bonAskCards() {
  if (!bonUiOn()) return []; const out = [];
  for (const q of E.bonList(S).open) {
    const b = S.player.bonus.list.find(x => x.id === q.id), role = q.kind === 'ra' ? 'وكيل الإقليم' : (S.player.props[q.key].mgr.rank === 3 ? 'الأمين' : 'المدير');
    const eff = f => 'يتقدّم أسرع ' + f.mulPct + '٪ ويصبر على تأخر أجره ' + f.grace + ' يوم أكثر لمدة ' + E.BON.growDays + ' يوماً';
    out.push({ id: 'bon:' + q.id, icon: 'ui-workers', title: 'مكافأة ' + q.name.replace(/^(وكيل الإقليم|أمين المنطقة|مدير الممتلك) في /, '') + ' (' + role + ')', w: 60, mark: true,
      why: 'صافي وحدته في 30 يوماً ' + fmt(q.N) + ' ريال، ونصيبه ' + (Math.round(q.share * 1000) / 10) + '٪ = ' + fmt(b.raw) + '، وسقفها أجر شهرين ' + fmt(q.cap) + '. الفائض فوق الاحتياطي ' + fmt(q.free) + '. اختيارية ولا تنقص من أجره إن تركتها.',
      opts: [
        { id: 'full', icon: 'ui-pay', title: 'أعطه ' + fmt(q.offer), effect: fmt(q.offer) + ' ريال من محفظتك · ' + eff(q.full), best: true, act: () => A.bonusGive(S, q.id, q.offer) },
        { id: 'half', icon: 'ui-pay', title: 'نصفها ' + fmt(q.half), effect: fmt(q.half) + ' ريال · ' + eff(q.halfE), act: () => A.bonusGive(S, q.id, q.half) },
        { id: 'none', icon: 'ui-decline', title: 'لا مكافأة هذا الشهر', effect: 'لا ينقص ذلك من أجره ولا من عمله', act: () => A.bonusGive(S, q.id, 0) }] });
  }
  return out;
}
/* حقل المبلغ في بطاقة الشخص: يظهر وللمفتوح فقط، وسطر المكافأة السارية */
function bonPersonHTML(e, kind, key) {
  if (!bonUiOn() || !e) return ''; let h = '';
  const q = E.bonList(S).open.find(x => x.kind === kind && x.key === key);
  if (e.sk && e.sk.bon && S.day < e.sk.bon.till) h += `<div class="small" data-bon-on>مكافأة سارية: يتقدّم أسرع ${Math.round((e.sk.bon.mul - 1) * 100)}٪ ويصبر ${e.sk.bon.grace} يوم حتى يوم ${e.sk.bon.till}</div>`;
  if (q) h += `<div class="kv small" data-bon-field><span>مكافأة مقترحة ${fmt(q.offer)} (الأعلى ${fmt(q.lim)})</span><span><input id="bg${q.id}" type="number" inputmode="numeric" min="0" max="${q.lim}" value="${q.offer}" aria-label="مبلغ المكافأة" style="width:90px;min-height:44px"> <button type="button" class="sm" data-act="bongive" data-i="${q.id}" style="min-height:44px">أعطه</button></span></div>`;
  return h;
}
