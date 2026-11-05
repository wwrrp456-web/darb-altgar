/* تجربة البداية (032): شريط التحميل الأول، وحارس أخطاء الصور (إعادة محاولة واحدة)، وملخص الرحلة، وتلميح الجواب الخاطئ. المفاتيح في E.FIRSTX. */
function ftxLoaderDone() { const el = document.getElementById('bootload'); if (!el) return; el.classList.add('out'); setTimeout(() => el.remove(), 450); }
// فحص أخطاء الصور: خطأ تحميل img يُعاد مرة واحدة بعد ثانية ونصف (ثم يُسجَّل في window.__imgFail)
window.__imgFail = window.__imgFail || [];
document.addEventListener('error', ev => {
  const im = ev.target; if (!im || im.tagName !== 'IMG') return; const src = im.getAttribute('src') || ''; if (!src || src.startsWith('data:')) return;
  if (!im.dataset.retry) { im.dataset.retry = '1'; setTimeout(() => { im.src = src + (src.includes('?') ? '&' : '?') + 'r=1'; }, 1500); } else window.__imgFail.push(src);
}, true);
const ftxMoney = n => Math.round(n).toLocaleString('en-US');
function tripSumHTML() {
  if (!E.FIRSTX.summary || !S.learn || !S.learn.char) return ''; const v = E.ftxTripView(S); if (!v) return '';
  const after = v.exp - v.parts.filter(x => x.k !== 'provisions').reduce((a, x) => a + x.amt, 0);
  const rows = v.parts.length ? `<ul class="small">${v.parts.map(x => `<li>${esc(x.label)}: <b class="num">${ftxMoney(x.amt)}</b> ريال</li>`).join('')}</ul>` : '<div class="small muted">لم تكلّفك الرحلة شيئاً غير نفقتها المحسوبة سلفاً.</div>';
  const end = v.sold ? `<div class="small">ربحك الفعلي من البيع: <b class="num">${ftxMoney(v.actual)}</b> ريال. الفرق عن المتوقع يأتي من سعر البيع الفعلي بعد الضريبة وهبوط السعر مع الكمية.</div>` : '<div class="small muted">بِع بضاعتك لترى الربح الفعلي.</div>';
  return `<details class="tripsum" open data-tripsum><summary><b>ملخص الرحلة: ${esc(cityName(v.from))} ← ${esc(cityName(v.to))}</b></summary><div class="small">الربح المتوقع قبل السفر كان <b class="num">${ftxMoney(v.exp)}</b> ريال (بعد نفقة الطريق). وخلال الرحلة دُفع:</div>${rows}${v.parts.some(x => x.k !== 'provisions') ? `<div class="small">المتوقع بعد هذه المصاريف: <b class="num">${ftxMoney(after)}</b> ريال.</div>` : ''}${end}</details>`;
}
// تلميح للجواب الخاطئ: يذكر الخيار الخاطئ ويقتبس أول جملة من شرح السؤال نفسه
function ftxHint(q, bad) {
  if (!E.FIRSTX.hint || !q || !bad || !bad.length) return ''; const w = q.o[bad[bad.length - 1]]; const first = String(q.why || '').split(/(?<=[.!؟:])\s/)[0].trim();
  return `ليس «${w}» هو الصحيح.${first ? ' تلميح: ' + first : ''}`;
}
