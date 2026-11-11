/* ---------- 036و الخصومات: قائمة في صفحة الزعماء + سطر في بطاقة السوق المتضرر + سطر «حال أعمالي» (مكوّنات 037 وحدها) ---------- */
const fdGoodsTxt = f => f.goods.slice(0, 3).map(g => GD[g].name).join('، ') + (f.goods.length > 3 ? ' وغيرها' : '');
const fdRow = f => `<div class="kv" data-feud="${f.a}-${f.b}"><span>${cityTag(f.a)} ← ${cityTag(f.b)}<br><small class="muted">${esc(E.FEUD_TXT.line(f.ba, f.bb, fdGoodsTxt(f), f.left))}</small></span><b class="num">${f.pct > 0 ? '+' + f.pct + '٪ · ' : ''}${f.left} يوماً</b></div>`;
function feudListHTML() {
  if (!E.GRIEF.on) return ''; const l = E.feudView(S);
  return `<section class="card" data-feuds aria-label="الخصومات" style="margin-top:12px"><h2 style="margin-top:0">الخصومات</h2>${l.length ? l.map(fdRow).join('') : `<p class="small muted" style="margin:0">${E.FEUD_TXT.none}</p>`}<p class="small muted" style="margin:8px 0 0">${E.FEUD_TXT.help}</p></section>`;
}
function feudMarketLine(c) {
  const f = E.GRIEF.on ? E.feudAt(S, c.id) : null; if (!f) return '';
  return `<div class="card small" data-feud-line style="margin:10px 0">⚔️ ${esc(E.FEUD_TXT.line(f.ba, f.bb, fdGoodsTxt(f), f.left))}${f.pct > 0 ? ` <b class="num dear">+${f.pct}٪</b>` : ''}</div>`;
}
const feudHomeBody = () => E.feudsMine(S).map(fdRow).join('') + hsGoBtn('shops', 'افتح العقارات', E.feudsMine(S)[0].b, true);
