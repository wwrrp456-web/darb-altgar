/* واجهة العمر والمراحل؛ تتوسع بقرارات انتقال الأمانة في المرحلة ج. */
function lifeProfileHTML() {
  if (!S.learn || !S.learn.char) return '';
  const st = E.stageStatus(S), age = Math.floor(E.ageOf(S));
  return `<div class="life-progress"><b>العمر: ${age} سنة</b>${st ? `<div>المرحلة ${st.stage} من ${E.STAGES.length}</div><div>عمر الفتح: ${st.required} سنة · متبقٍ ${st.days} يوماً</div>${bar(1 - st.days / Math.max(1, E.AGE_YEAR * 4), 1, '')}` : '<div>اللعب الحر</div>'}</div>` + lifeExtraProfileHTML();
}
function renderLifeUI() {
  const b = $('captainAuto'); if (b) { b.hidden = !(S.learn && S.learn.char); b.setAttribute('aria-pressed', String(!!S.captainAuto)); b.textContent = S.captainAuto ? 'إيقاف التشغيل التلقائي' : 'التشغيل التلقائي'; }
  const el = $('awayPanel'); if (!el) return; if (S.life && S.life.pending) { el.hidden = true; return; }
  if (S.awayJob) { const j = S.awayJob; el.hidden = false; el.innerHTML = `<div class="lbox" role="dialog" aria-modal="true" aria-label="حساب الغياب"><h2>حساب ما حدث أثناء غيابك</h2><p role="status">${j.wanted - j.remaining} من ${j.wanted} أيام</p></div>`; return; }
  const r = S.awayReport; if (!r) { el.hidden = true; return; }
  el.hidden = false; el.innerHTML = `<div class="lbox" role="dialog" aria-modal="true" aria-label="ما حدث أثناء غيابك"><h2>ما حدث أثناء غيابك</h2><p>${r.days} أيام · تغير الرصيد: ${fmt(r.change)} ريال معادل</p><ul>${r.events.map(t => `<li>${esc(t)}</li>`).join('')}</ul><button class="btn" data-act="awayclose">متابعة</button></div>`;
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
