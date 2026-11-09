/* ---------- 035أ البطاقة الموحّدة للموظف: الدور، التخصص، الدرجة، شريط التقدم، السبب، ما تفتحه الدرجة التالية، تقدم الأسبوع ---------- */
function skillCardHTML(e, role) {
  const v = E.skillView(S, e, role); if (!v) return '';
  const spec = v.spec.filter(s => s.f !== v.home).map(s => `<span class="pill">${esc(s.name)} ${Math.round(s.v * 100)}٪</span>`).join(' ');
  return `<div class="skillcard" data-skill="${esc(role)}"><div class="kv"><b>${esc(role)}</b><span class="pill gold">${esc(v.gradeName)}</span></div>`
    + `<div class="small muted">التخصص: <b>${esc(v.homeName)}</b>${spec ? ' · يتعلم: ' + spec : ''}</div>`
    + `<div class="sk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v.frac * 100)}" aria-label="التقدم للترقية">${bar(Math.round(v.frac * 100), 100, 'gold')}</div>`
    + `<div class="small">${v.top ? 'بلغ أعلى درجة.' : 'التقدم نحو «' + esc(v.nextName) + '»: بعد نحو ' + dayAr(v.daysLeft) + '.'}</div>`
    + `<div class="small muted">${esc(v.why)}</div>`
    + (v.next && !v.top ? `<div class="small"><b>تفتح الدرجة التالية:</b> ${esc(v.next)}</div>` : '')
    + `<div class="small muted">تقدم هذا الأسبوع: ${v.week}</div></div>`;
}
const skillFold = (e, role, key) => { if (!E.SKILL.on || !e || !e.sk) return ''; return foldLazy('sk-' + key, false, `<span class="small">الكفاءة · ${esc(E.skillView(S, e, role).gradeName)}</span>`, () => skillCardHTML(e, role)); };
