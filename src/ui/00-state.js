/* درب التجّار v0.2 — الواجهة: سبع شاشات بحالة واحدة مشتركة وتوجيه بالـ hash */
(function () {
'use strict';
const E = Engine, A = E.A, GD = E.GD, GIDS = E.GIDS, CD = E.CD;
const $ = id => document.getElementById(id);
const KEY = 'darb-v3', KEY2 = 'darb-v2';
let S, sel = 'riyadh', screen = 'home', speed = 0, carSel = 1, timer = null, lastSave = 0, ct = 'cities', guideOff = false;
let landlord = 'private', pressing = false, dirty = false, mapC = 'all', mf = 'all', estC = 'sa', estCity = 'riyadh', empC = 'sa', oldSave = false, dg = null, dq = 10, fxFrom = 'sar', fxTo = 'usd';
let resourceOpen = null, resourceSignature = '';
const SPEEDS = { 0: 0, 1: 1100, 2: 450, 3: 140 };
try { guideOff = localStorage.getItem('darb-guide-off') === '1'; } catch (e) {}
const COAST = new Set(['jeddah', 'jazan', 'alex', 'mumbai', 'kolkata', 'guangzhou', 'shanghai']);

const ART = window.ART || {};
const WM = window.WorldMap;
let mapView = { zoom: 1, center: null }, mapBase, mapVB, mapDrag = null, mapDragged = false, mapListOpen = {};
let map3dPose = null, map3dFailed = false, map3dStatus = '';
const mapModeQuery = new URLSearchParams(location.search).get('map');
const gi = g => (ART['goods/' + g] || (GD[g].hyb && ART['goods/' + GD[g].sp]) ? `<img class="gi" src="${ART['goods/' + g] || ART['goods/' + GD[g].sp]}" alt="${GD[g].name}">` : GD[g].icon);
const uic = k => (ART['ui/' + k] ? `<img class="uic" src="${ART['ui/' + k]}" alt="">` : '');
const art = k => ART['cutouts/' + k] || ART[k] || '';
const pic = (k, cls, alt) => (art(k) ? `<img class="pic ${ART['cutouts/' + k] || k.startsWith('expressions/') || k.startsWith('story/') || k.startsWith('talk/') ? 'cutout' : ''} ${cls || ''}" data-art="${k}" src="${art(k)}" alt="${alt || ''}">` : '');
const fmt = n => Math.round(n).toLocaleString('en-US');
const hudFmt = n => {
  const v = Math.abs(n);
  const unit = v >= 1e9 ? [1e9, 'مليار'] : v >= 1e6 ? [1e6, 'مليون'] : v >= 1e4 ? [1e3, 'ألف'] : null;
  return unit ? `${(n / unit[0]).toLocaleString('en-US', { maximumFractionDigits: unit[0] === 1e3 ? 0 : 1 })} ${unit[1]}` : fmt(n);
};
const f1 = n => (Math.round(n * 10) / 10).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const car = () => S.player.caravans.find(c => c.id === carSel) || S.player.caravans[0];
const main = () => S.player.caravans[0];
const cityName = id => S.cities[id].name;
const flag = id => CD[S.cities[id].country].flag;
const cityTag = id => flag(id) + ' ' + esc(cityName(id));
const bar = (v, mx, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, 100 * v / mx))}%"></i></div>`;
const EVN = { boom: 'ازدهار', bust: 'كساد', plague: 'وباء', festival: 'مهرجان', war: 'حرب وحصار' };
const evGood = k => k === 'boom' || k === 'festival';
function spark(arr, w, h) {
  if (!arr || arr.length < 2) return '';
  const mn = Math.min(...arr), mx = Math.max(...arr), rg = mx - mn || 1;
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - 2 - (v - mn) / rg * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" style="direction:ltr;vertical-align:middle"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
// الأصوات: نجاح الفعل يشغّل صوته، والرفض يشغّل «فشل». الاسم من الفعل الجاري (curAct)
function syncSound() { const b = $('hSound'); if (!b) return; let m = false; try { m = Sound.isMuted(); } catch (e) {} b.setAttribute('aria-pressed', String(!m)); const on = b.querySelector('.s-on'), off = b.querySelector('.s-off'); if (on) on.hidden = m; if (off) off.hidden = !m; b.title = m ? 'الأصوات مكتومة' : 'الأصوات تعمل'; }
const SND = { buy: 'buy', buyherd: 'buy', agent: 'buy', dealgo: 'caravan', go: 'caravan', sell: 'sell', sellall: 'sell', sellherd: 'sell', sellyoung: 'sell', farmsell: 'sell', cutmeat: 'sell', hgclose: 'click', zakatpay: 'coin', dep: 'coin', wd: 'coin', fxdo: 'coin', hiremgr: 'success', rescuefact: 'success', factory: 'success', buildbutcher: 'success', buildfarm: 'success', bshop: 'success', bwh: 'success', signpact: 'success' };
let curAct = null, lvSnd = null;
const sfx = n => { try { if (typeof Sound !== 'undefined') Sound.play(n); } catch (e) {} };
function act(r) { if (r && r.msg) toast(r.msg); if (r && r.ok === false) sfx('fail'); else if (SND[curAct]) sfx(SND[curAct]); renderAll(true); }
const fx = () => S.fx;
const curBadge = c => ({ sar: '🇸🇦 ر.س', usd: '💵 $', au: '🥇 غ', ag: '🥈 غ' })[c];
// سعر بالريال أولاً، ومعه الدولار في الأسواق الأجنبية
function pr(sar, country, dec) { const d = dec == null ? 1 : dec; const v = (Math.round(sar * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US'); return `<b class="num">${v}</b> ر.س` + (country && country !== 'sa' ? `<span class="usd">$${(sar / fx().usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}${E.LOCAL[country] ? ' · ≈ ' + (sar * E.localRate(S, country)).toLocaleString('en-US', { maximumFractionDigits: E.LOCAL[country].base > 100 ? 0 : 1 }) + ' ' + E.LOCAL[country].unit : ''}</span>` : ''); }
const sgn = n => (n >= 0 ? '+' : '−') + fmt(Math.abs(n));
const plCls = n => (n >= 0 ? 'up' : 'dn');
const citiesOf = cn => S.order.filter(id => S.cities[id].country === cn);

