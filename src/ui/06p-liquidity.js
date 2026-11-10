/* السيولة (040و): بطاقة في المكتب (النقد، الودائع صافية، التزامات 14 يوماً، أيام التغطية، آخر السحوبات) وإعدادات P.liq بأزرار ثابتة (لا قوائم منسدلة)؛ وبطاقات «المطلوب» في نافذة 037 */
const liqDaysTxt = v => v.days === Infinity ? 'لا التزامات' : Math.floor(v.days) + ' يوماً';
function liqBodyHTML() {
  const v = E.liqView(S); if (!v) return '';
  const kv = (k, val, cls) => `<div class="kv"><span>${k}</span><b class="num ${cls || ''}">${val}</b></div>`, pol = v.pol, m = v.month;
  const tog = (key, on, label) => `<button class="sm ${on ? '' : 'ghost'}" data-act="liqset" data-k="${key}" data-v="${on ? 0 : 1}" aria-pressed="${on}">${label}: ${on ? 'مفعّل' : 'موقوف'}</button>`;
  const cap = [0, 20, 40, 60, 100].map(p => `<button class="sm ${Math.round(pol.monthMax * 100) === p ? '' : 'ghost'}" data-act="liqset" data-k="monthMax" data-v="${p}">${p}٪</button>`).join(' ');
  const last = v.log.slice(-3).reverse().map(x => `<div class="small muted" data-liq-log>يوم ${x.d}: ${fmt(x.amt)} من وديعة ${esc(cityName(x.city))} (رسم ${fmt(x.fee)})${x.why === 'manual' ? ' · بطلبك' : x.why === 'diwan' ? ' · للخزينة' : ''}</div>`).join('');
  return `<div class="liq" data-liq>${kv('النقد', fmt(v.cash) + ' ريال', v.low ? 'dear' : '')}${kv('الودائع (صافي بعد رسم ' + Math.round(E.LIQ.fee * 100) + '٪)', fmt(v.depNet) + ' ريال')}${kv('التزامات ' + E.LIQ.horizon + ' يوماً', fmt(v.need) + ' ريال')}${kv('أيام التغطية', liqDaysTxt(v), v.low ? 'dear' : 'cheap')}${v.diwan != null ? kv('خزينة الديوان', fmt(v.diwan) + ' ريال') : ''}`
    + `<div class="small" data-liq-month>سحب تلقائي هذا الشهر: <b class="num">${fmt(m.used)}</b> من ${fmt(m.cap)} ريال</div>${last}`
    + `<div class="row small" data-liq-set style="flex-wrap:wrap;gap:6px">${tog('cover', pol.cover, 'السحب التلقائي لسداد التزاماتك')} ${tog('payout', pol.payout, 'أرباح المضاربة إلى النقد شهرياً')}</div><div class="small" data-liq-max>حدّ السحب التلقائي شهرياً من الودائع: ${cap}</div></div>`;
}
function liqCardHTML() { const v = E.liqView ? E.liqView(S) : null; if (!v || v.dep <= 0) return ''; return `<section class="card liq-card" aria-label="السيولة"><h3 style="margin-top:0">السيولة <span class="pill ${v.low ? 'dear' : ''}">تغطية ${liqDaysTxt(v)}</span></h3>${liqBodyHTML()}</section>`; }
