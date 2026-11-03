/* رتب الحراس وتقدير الطريق (019): بطاقة الرتب في تجهيز القافلة، وسطر «خطر الطريق» في تجهيز الرحلة. التصميم: specs/019-guards */
const GR_LEVEL = ['منخفض', 'متوسط', 'عالٍ'], GR_CLS = ['cheap', '', 'dear'];
function guardRanksHTML(cr) {
  const v = E.guardView(S, cr); if (!v.on || !cr.guards) return ''; const r = v.r, nm = v.names, G = E.GR, idle = cr.left === 0;
  const row = (i, n) => `<div class="kv small"><span>${nm[i]}</span><span><b class="num">${n}</b> · دفاع ${G.def[i]} · أجر ×${G.wage[i]}</span></div>`;
  const svcTxt = (need, free) => free ? 'بخدمتهم: مجاناً' : `خدموا ${v.svc} من ${need} رحلات بلا هزيمة، أو ادفع`;
  const b1 = r.p >= 1 ? `<button class="sm" data-act="gpromote" data-id="${cr.id}" data-to="vet" ${v.canVet && (v.vetFree || S.player.gold >= v.fee[0]) ? '' : 'disabled'}>رقِّ حارساً إلى «${nm[1]}» (${v.vetFree ? 'مجاناً' : fmt(v.fee[0]) + ' ريال'})</button><div class="small muted">${svcTxt(v.need[0], v.vetFree)}</div>` : '';
  const b2 = r.c < 1 && r.v >= 1 ? `<button class="sm" data-act="gpromote" data-id="${cr.id}" data-to="chief" ${v.canChief && (v.chiefFree || S.player.gold >= v.fee[1]) ? '' : 'disabled'}>رقِّ متمرّساً إلى «${nm[2]}» (${v.chiefFree ? 'مجاناً' : fmt(v.fee[1]) + ' ريال'})</button><div class="small muted">${svcTxt(v.need[1], v.chiefFree)}</div>` : '';
  return `<div class="card guardranks" data-guardranks><b>رتب الحراس</b>${row(0, r.p)}${row(1, r.v)}${row(2, r.c)}<div class="kv small"><span>قوة الدفاع الآن</span><b class="num">${v.defense.toFixed(1)}</b></div>${r.c ? '<div class="small muted">رئيس الحرس يرفع معنويات القافلة +10 في الدفاع.</div>' : ''}${idle ? b1 + b2 : '<div class="small muted">رقِّ الحراس والقافلة واقفة في مدينة.</div>'}<div class="small muted">اللصوص يطمعون بقدر غنيمة قافلتك: كلما غلت حمولتك قويت عصاباتهم${v.scale > 1.001 ? ` (حمولتك الآن ×${v.scale.toFixed(2)})` : ''}.</div></div>`;
}
function roadEstHTML(cr, to, extra) {
  const e = E.roadEstimate(S, cr, to, extra); if (!e) return ''; if (e.guarded) return `<div class="small cheap" data-roadest>خطر الطريق: <b>منخفض</b> · عقد حماية القوافل يؤمّن هذا الطريق.</div>`;
  const sec = e.secMul < 0.995 ? ` · الأمن والخانات خفّضا الخطر ×${e.secMul.toFixed(2)}` : '';
  return `<div class="small" data-roadest>خطر الطريق: <b class="${GR_CLS[e.level]}">${GR_LEVEL[e.level]}</b> · دفاعك <b class="num">${e.defense.toFixed(0)}</b> مقابل عصابات بقوة <b class="num">${e.lo.toFixed(0)}</b> إلى <b class="num">${e.hi.toFixed(0)}</b>${e.scale > 1.001 ? ' (غنيمتك تزيد طمعهم)' : ''}${sec}</div>`;
}
