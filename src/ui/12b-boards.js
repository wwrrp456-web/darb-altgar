/* لوحتا ترتيب الدول والأسواق (020): تبويبان في «الدول والمدن»، بطاقات عمودية. التصميم: docs/goals/WORLD.md القسم 2 */
const BD_TREND = t => t > 0 ? '<span class="cheap" title="ارتفع عن قبل 30 يوماً">↑</span>' : t < 0 ? '<span class="dear" title="هبط عن قبل 30 يوماً">↓</span>' : '<span class="muted" title="ثابت">→</span>';
const bdMini = dims => `<div class="bdmini">${dims.map(d => `<div class="bdd" title="${esc(d.name)}"><span class="small">${esc(d.name)} <b class="num">${Math.round(d.v)}</b></span>${bar(d.v, 100, '')}</div>`).join('')}</div>`;
function countryCardHTML(r) {
  return `<div class="card bdcard bdcountry" data-bdc="${r.id}"><div class="row" style="margin:0"><span class="pill">${r.rank}#</span><span class="cbadge" style="--cc:${r.color}">${r.flag} ${esc(r.name)}</span><span style="margin-inline-start:auto"><b class="num" style="font-size:20px">${Math.round(r.P)}</b> ${BD_TREND(r.trend)}</span></div>${bdMini(r.dims)}<div class="small"><b>الأقوى:</b> ${esc(r.strong.name)} ${Math.round(r.strong.v)} · <b>الأضعف:</b> ${esc(r.weak.name)} ${Math.round(r.weak.v)}</div><div class="small muted">السكان ${fmt(r.pop)} · قيادتك: <b class="num">${r.led} من ${r.total}</b> أسواق</div></div>`;
}
function marketCardHTML(r) {
  const k = CD[r.country], boss = r.led ? '<b class="cheap">الزعيم: أنت</b>' : r.boss ? `الزعيم: ${esc(r.boss.name)} · نفوذك <b class="num">${Math.round(100 * r.boss.share)}٪</b>` : '';
  const mine = r.mine.length ? r.mine.map(d => `${esc(d.name)} ${Math.round(100 * d.share)}٪`).join(' · ') : 'لا مساهمة لك بعد';
  return `<div class="card bdcard bdmarket" role="button" tabindex="0" data-act="boardcity" data-c="${r.id}" data-bdm="${r.id}"><div class="row" style="margin:0"><span class="pill">${r.rank}#</span><b>${esc(r.name)}</b><span class="small muted">${k.flag} ${esc(k.name)}</span><span style="margin-inline-start:auto"><b class="num" style="font-size:20px">${Math.round(r.P)}</b> ${BD_TREND(r.trend)}</span></div>${bdMini(r.dims)}<div class="small"><b>الأقوى:</b> ${esc(r.strong.name)} ${Math.round(r.strong.v)} · <b>الأضعف:</b> ${esc(r.weak.name)} ${Math.round(r.weak.v)}</div><div class="small muted">السكان ${fmt(r.pop)} · ${boss}</div><div class="small muted"><b>مساهمتك:</b> ${mine}</div></div>`;
}
function difficultyCardHTML() {
  const v = E.difficultyView(S); if (!v) return '';
  return `<div class="card bddiff" data-difficulty><div class="row" style="margin:0"><b>صعوبة التوسع</b><span style="margin-inline-start:auto"><b class="num" style="font-size:20px">×${v.D.toFixed(2)}</b>${v.capped ? ' <span class="small muted">(الأقصى)</span>' : ''}</span></div>${bar(v.D - 1, 0.6, v.D > 1.3 ? 'dear' : '')}<div class="small">قدتَ <b class="num">${v.k.toFixed(1)}</b> من 5 دول. كلما قدتَ دولاً أكثر صعب عليك التوسع في غيرها: زعماء أسواقها أقوى نفوذاً${v.trustExtra ? ` ويطلبون ثقة أعلى بـ<b class="num">${v.trustExtra}</b> قبل العقود` : ''}.</div><div class="small muted">صعوبة لا استحالة: لها حدّ أقصى ×1.6، وبلا حروب (نفوذ وعقود فقط). ${v.allies ? `عقود تحالفك النشطة (${v.allies}) خفّضتها ${v.cut.toFixed(2)}.` : 'كل عقد تحالف نشط يخفّضها 0.05 (حتى 0.2).'}</div></div>`;
}
function boardsHTML(kind) {
  if (kind === 'bc') { const b = E.countryBoard(S); return difficultyCardHTML() + `<p class="small muted">الدول مرتبة بازدهارها الكلي (متوسط ازدهار مدنها بأحجامها). الأسهم مقارنة بقبل 30 يوماً.</p>` + b.map(countryCardHTML).join(''); }
  const b = E.marketBoard(S); return difficultyCardHTML() + `<p class="small muted">الأسواق مرتبة بازدهارها الكلي. اضغط على سوق لتفتح بطاقة مدينته.</p>` + b.map(marketCardHTML).join('');
}
function boardTabs() { return E.countryBoard(S).length ? [['bc', 'ترتيب الدول'], ['bm', 'ترتيب الأسواق']] : []; }
