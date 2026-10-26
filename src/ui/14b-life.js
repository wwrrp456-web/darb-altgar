/* واجهة العمر والمراحل؛ تتوسع بقرارات انتقال الأمانة في المرحلة ج. */
function lifeProfileHTML() {
  if (!S.learn || !S.learn.char) return '';
  const st = E.stageStatus(S), age = Math.floor(E.ageOf(S));
  return `<div class="life-progress"><b>العمر: ${age} سنة</b>${st ? `<div>المرحلة ${st.stage} من ${E.STAGES.length}</div><div>عمر الفتح: ${ageFmt(st.required)} سنة · متبقٍ ${spanAr(st.days)}</div>${bar(1 - st.days / Math.max(1, E.AGE_YEAR * 4), 1, '')}` : '<div>اللعب الحر</div>'}</div>` + obligationsHTML() + lifeExtraProfileHTML();
}
function renderLifeUI() {
  const b = $('captainAuto'); if (b) { b.hidden = !(S.learn && S.learn.char); b.setAttribute('aria-pressed', String(!!S.captainAuto)); b.textContent = S.captainAuto ? 'إيقاف التشغيل التلقائي' : 'التشغيل التلقائي'; }
  const el = $('awayPanel'); if (!el) return; if (S.life && S.life.pending) { el.hidden = true; return; }
  if (S.awayJob) { const j = S.awayJob; el.hidden = false; el.innerHTML = `<div class="lbox" role="dialog" aria-modal="true" aria-label="حساب الغياب"><h2>حساب ما حدث أثناء غيابك</h2><p role="status">${j.wanted - j.remaining} من ${dayAr(j.wanted)}</p></div>`; return; }
  const r = S.awayReport; if (!r) { el.hidden = true; return; }
  el.hidden = false; el.innerHTML = awayReportHTML(r);
}
const AWAY_INC = { shops: 'مبيعات الدكاكين', realized: 'أرباح التجارة', mudaraba: 'المضاربة', farm: 'المزرعة', factory: 'المصانع' };
const AWAY_EXP = { staff: 'أجور العمال', rent: 'الإيجار', upkeep: 'الصيانة', wages: 'أجور القوافل والمصانع', purchases: 'شراء البضاعة', tax: 'الضرائب', wealthLevy: 'رسم الثروة', farm: 'المزرعة', exchange: 'الصرف', zakat: 'الزكاة', debtPaid: 'سداد الدين' };
function awayReportHTML(r) {
  const rows = (arr, labels) => arr && arr.length ? arr.map(([k, v]) => `<div class="kv"><span>${labels[k] || k}</span><b class="num">${fmt(v)}</b></div>`).join('') : '<div class="small muted">لا شيء يُذكر</div>';
  const empty = (r.empty || []).length ? `<h3>سلع نفد مخزونها</h3><p class="small">${r.empty.map(x => `${gi(x.g)} ${esc(gname(x.g))} (${esc(cityName(x.city))})`).join('، ')}</p><div class="small muted">نفاد المخزون يعني توقف البيع مع استمرار الإيجار والأجور. افتح المكتب واضغط «عبّئ دكاكيني»، أو وظّف أمين مخزن ليعبّئ آلياً.</div>` : '';
  const low = r.reserve && r.cash < r.reserve ? `<div class="qnote">نقدك (${fmt(r.cash)}) أقل من احتياطي التشغيل (${fmt(r.reserve)} = التزامات ${E.RESERVE_DAYS} يوماً): أوقفتُ شراء المخزون الآلي لئلا تُفلس.</div>` : '';
  const world = (r.events || []).length ? `<details class="mdet"><summary>أخبار العالم أثناء غيابك (${r.events.length})</summary><ul>${r.events.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>` : '';
  return `<div class="lbox" role="dialog" aria-modal="true" aria-label="ما حدث أثناء غيابك"><h2>ما حدث أثناء غيابك</h2><p>${dayAr(r.days)} · تغيّر رصيدك: <b class="num ${r.change < 0 ? 'dear' : 'good'}">${fmt(Math.round(r.change))}</b> ريال معادل</p>${low}<h3>دخلك</h3>${rows(r.inc, AWAY_INC)}<h3>مصروفاتك</h3>${rows(r.exp, AWAY_EXP)}${empty}${world}<div class="row"><button class="btn" data-act="awayclose">متابعة</button><button class="btn ghost" data-act="awayoffice">افتح المكتب</button></div></div>`;
}
function lifeStagesHTML() {
  if (!S.learn || !S.learn.ageStages) return '';
  const L = S.learn;
  return '<h3>مراحل المسيرة</h3><div class="grid g2">' + E.STAGES.map(st => {
    const done = (L.stageDone || []).includes(st.n), current = E.stageOf(S)?.n === st.n;
    return `<div class="card"><b>${st.n}. ${esc(st.title)}</b><p>العمر المخطط: ${st.age} سنة · ${done ? 'أُنجزت' : current ? 'الحالية' : 'قادمة'}</p>${done || current && !E.stageStatus(S).waiting ? st.lesson.map(t => `<p>${t}</p>`).join('') : ''}</div>`;
  }).join('') + '</div>';
}

let catchingUp = false;
async function resumeAwayUI() {
  if (catchingUp || !S || !E.awayBegin(S)) return;
  catchingUp = true; speed = 0; clearTimeout(timer);
  try {
    while (S.awayJob) {
      if (document.visibilityState === 'hidden' || (S.life && S.life.pending)) break;
      E.awayAdvance(S, 25); renderLifeUI(); persist();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  } finally { catchingUp = false; renderAll(true); persist(); }
}
