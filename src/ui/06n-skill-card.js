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
const skillFold = (e, role, key) => { if (!E.SKILL.on || !e || !e.sk) return ''; if (typeof dApply === 'function' && dApply('team')) return `<span class="pill gold small">الكفاءة · ${esc(E.skillView(S, e, role).gradeName)}</span>`; /* 037ج: البطاقات كلها في شارة العمّال */ return foldLazy('sk-' + key, false, `<span class="small">الكفاءة · ${esc(E.skillView(S, e, role).gradeName)}</span>`, () => skillCardHTML(e, role)); };
/* ---------- 035د: بطاقة القائد (التمييز فوق السقف) وسطرا الحرس والطاقم ---------- */
function sktCaptainHTML(c) {
  const v = E.sktView(S, c); if (!v || !v.cp) return ''; const cp = v.cp, nm = { trade: 'تجارة', nav: 'ملاحة', combat: 'قتال' }, nx = cp.nextTr, frac = nx ? Math.min(100, Math.round(100 * cp.tr / nx)) : 100;
  return `<div class="skillcard sk-cap" data-skill="قائد"><div class="kv"><b>كفاءة القائد</b><span class="pill gold">${cp.bonus ? 'مميَّز +' + cp.bonus : 'قيد التمييز'}</span></div>`
    + `<div class="small">المهارة الفعّالة: ${cp.eff.map(x => `${nm[x.k]} <b class="num">${x.eff}</b>${x.eff !== x.raw ? ` <span class="muted">(الأصل ${x.raw})</span>` : ''}`).join(' · ')}</div>`
    + `<div class="sk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${frac}" aria-label="نحو التمييز">${bar(frac, 100, 'gold')}</div>`
    + `<div class="small">${nx ? `نحو التمييز: <b class="num">${Math.floor(cp.tr)}</b> / ${nx} رحلة` : 'بلغ أعلى تمييز (+2).'}</div>`
    + `<div class="small muted">يتقدم بربح قافلته من كل رحلة؛ وإن خسر تباطأ ولا ينزل. أجره لا يتغير.</div>${nx ? `<div class="small"><b>يفتح التمييز التالي:</b> ${esc(E.SKILL.next.captain[cp.bonus] || '')}</div>` : ''}</div>`;
}
function sktTravelHTML(cr) {
  const v = E.sktView(S, cr); if (!v || (!v.gx && !v.cx)) return '';
  const row = (k, lab, o, nm) => { const top = o.need == null, frac = top ? 100 : Math.round(100 * Math.min(1, (o.xp - o.prev) / (o.need - o.prev))); return `<div class="skillcard sk-${k}" data-skill="${lab}"><div class="kv"><span><b>${lab}</b> · ${esc(o.name)}</span><span class="pill gold num">${o.xp}${top ? '' : ' / ' + o.need}</span></div><div class="sk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${frac}" aria-label="تقدم ${lab}">${bar(frac, 100, 'gold')}</div><div class="small">${o.opens ? 'الأثر الآن: ' + esc(o.opens) + '.' : 'لا أثر بعد؛ يبدأ الأثر عند ' + (o.need == null ? '' : o.need) + '.'}</div>${top ? '' : `<div class="small muted">الدرجة التالية «${esc(nm[o.g])}»: ${esc(k === 'gx' ? E.SKT.open.gx[o.g] : E.SKT.open.cx[o.g])}.</div>`}</div>`; };
  return `<div class="sk-travel" data-sktravel>${v.gx ? row('gx', 'خبرة الحرس', v.gx, E.SKT.names.gx) : ''}${v.cx ? row('cx', 'خبرة الطاقم', v.cx, E.SKT.names.cx) : ''}</div>`;
}
/* شارة الدرجة في سطر الطيّ المرئي (نقرتان من الرئيسية: المكتب ← الإدارة) */
const sktBadge = (e, role) => { const v = E.sktView && e && e.sk ? E.skillView(S, e, role) : null; return v ? ` · <span class="pill gold small">الكفاءة · ${esc(v.gradeName)}</span>` : ''; };
