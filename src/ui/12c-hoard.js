/* الاحتكار المحرّم (022): سطر حال المدينة («أهل المدينة في ضيق من…») في بطاقتها. الحكم والنص المعتمدان: docs/review/APPROVED_MONOPOLY_2026-11-03.md */
function hoardCityHTML(id) {
  const l = E.hoardCity(S, id); if (!l.length) return '';
  const rows = l.map(x => `<div class="small hoardrow${x.pun ? ' dear' : ''}" data-hoard="${x.g}">أهل ${esc(cityName(id))} في ضيق من <b>${esc(x.name)}</b> (${esc(x.kind)})${x.mine ? ` وعندك منها <b class="num">${x.held}</b> في مخزنك؛ اطرحها بسعر عادل (لا يزيد على 1.1 من المرجعي)${x.pun ? ' لتتعافى سمعتك' : ''}.` : '. جلب هذه السلعة إليهم تجارة نافعة.'}</div>`).join('');
  return `<div class="hoardcity" data-hoardcity="${id}">${rows}</div>`;
}
