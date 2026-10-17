/* طبقة العرض فقط: لا تغيّر إحداثيات المحاكاة أو مدد السفر. */
(function (root) {
'use strict';
// أضف رقعاً أخرى بإحداثياتها لتوسيع الرسم؛ المدن تحدد حدود الاستكشاف تلقائياً.
const tiles = [{ art: 'map/world', x: 0, y: 60, width: 1000, height: 560 }];
function extent(cities, country, aspect) {
  const points = cities.filter(c => !country || c.country === country);
  const boxes = country ? [] : tiles.map(t => [t.x, t.y, t.x + t.width, t.y + t.height]);
  points.forEach(c => boxes.push([c.x - 65, c.y - 65, c.x + 65, c.y + 65]));
  if (!boxes.length) boxes.push([0, 60, 1000, 620]);
  const x = Math.min(...boxes.map(b => b[0])), y = Math.min(...boxes.map(b => b[1]));
  const right = Math.max(...boxes.map(b => b[2])), bottom = Math.max(...boxes.map(b => b[3]));
  let w = Math.max(right - x, country ? 280 : 1000), h = Math.max(bottom - y, 220);
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  return [x + (right - x - w) / 2, y + (bottom - y - h) / 2, w, h];
}
function viewport(base, zoom, center) {
  const z = Math.max(1, Math.min(4, zoom)), w = base[2] / z, h = base[3] / z;
  const cx = Math.max(base[0] + w / 2, Math.min(base[0] + base[2] - w / 2, center ? center[0] : base[0] + base[2] / 2));
  const cy = Math.max(base[1] + h / 2, Math.min(base[1] + base[3] - h / 2, center ? center[1] : base[1] + base[3] / 2));
  return [cx - w / 2, cy - h / 2, w, h];
}
// شبكة محلية خفيفة بدلاً من توصيل كل مدينة بكل المدن الأخرى.
function roads(cities, neighbors) {
  const result = [], groups = {};
  cities.forEach(c => (groups[c.country] || (groups[c.country] = [])).push(c));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  Object.values(groups).forEach(group => {
    const connected = group.slice(0, 1), rest = group.slice(1);
    while (rest.length) {
      let best;
      connected.forEach(a => rest.forEach(b => { const d = distance(a, b); if (!best || d < best.d) best = { a, b, d }; }));
      result.push({ a: best.a, b: best.b, border: false }); connected.push(best.b); rest.splice(rest.indexOf(best.b), 1);
    }
  });
  const seen = new Set();
  Object.keys(groups).forEach(id => (neighbors[id] || []).forEach(other => {
    const key = [id, other].sort().join(':'); if (seen.has(key) || !groups[other]) return; seen.add(key);
    let best;
    groups[id].forEach(a => groups[other].forEach(b => { const d = distance(a, b); if (!best || d < best.d) best = { a, b, d }; }));
    if (best) result.push({ a: best.a, b: best.b, border: true });
  }));
  return result;
}
const api = { tiles, extent, viewport, roads };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WorldMap = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
