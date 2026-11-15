'use strict';
// 049 تنظيف التكرار (ملفات): لا مرجع لمحذوف، كل صورة لها مرجع أو بناء ديناميكي أو في «باقٍ» المكتوبة هنا، لا صادرات محذوفة في API: node test/dedup.test.js
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), root = path.join(__dirname, '..');
const ok = m => console.log('OK   ' + m);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const srcFiles = [...walk('src').filter(f => /\.(js|html)$/.test(f) && f !== 'src/engine.js'), 'build.js', ...fs.readdirSync(path.join(root, 'scripts')).map(f => 'scripts/' + f)];
const SRC = srcFiles.map(read).join('\n');
// 1) ملفات حُذفت
for (const f of ['src/ui/06e-alerts.js', 'brand/img/scenes/farm-fields.webp', 'brand/img/scenes/storage-warehouse.webp']) a.ok(!fs.existsSync(path.join(root, f)), f + ' محذوف');
ok('06e-alerts والمشهدان بلا مرجع محذوفة');
// 2) لا بقايا مركز التنبيهات
for (const w of ['hAlert', 'alertPanel', 'tbBell', 'setAlerts', 'renderAlerts', 'alertList', 'alertsOpen']) a.ok(!SRC.includes(w), 'بقية: ' + w);
ok('لا بقايا لمركز التنبيهات في src');
// 3) لا مرجع لمفتاح صورة محذوف
const DELETED = ['scenes/farm-fields', 'scenes/storage-warehouse', 'ui/cull', 'ui/event_festival', 'ui/foal', 'ui/haggle_handshake', 'ui/ins_claim', 'ui/port_marker', 'ui/salem_note', 'ui/sea_insurance', 'ui/season_eid', 'ui/season_hajj', 'ui/season_ramadan', 'ui/season_winter', 'ui/story_chapter', 'map/caravan-painted', 'map/road_festival', 'map/road_rain', 'map/route_arrow', 'map/route_dot', 'map/sea_calm', 'map/sea_pirate_fight'];
for (const k of DELETED) { a.ok(!(fs.existsSync(path.join(root, 'brand/img', path.dirname(k))) ? fs.readdirSync(path.join(root, 'brand/img', path.dirname(k))) : []).some(f => f.replace(/\.[a-z]+$/, '') === path.basename(k)), k + ' ما زال ملفاً'); a.ok(!new RegExp("['\"`]" + k.replace(/[/-]/g, m => '\\' + m) + "['\"`]").test(SRC), k + ' ما زال مذكوراً'); }
ok(DELETED.length + ' مفتاحاً محذوفاً بلا ملف ولا مرجع');
// 4) كل ملف في brand/img له مرجع نصي (باسمه) أو بادئة ديناميكية أو في قائمة «باقٍ»
const DYN = [/^ui\/mood_/, /^ui\/ship_/, /^ui\/mount_/, /^ui\/shop_up_/, /^map\/ship_.*_map$/, /^scene\/season_/, /^scene\/(sea|road)_/, /^map\/(sea|road)_/, /^goods\//, /^city\//, /^nav\//, /^hero\//, /^boss\//, /^cutouts\//, /^expressions\//, /^ranks\//, /^ach\//, /^celebrate\//, /^chapters\//, /^story\//, /^talk\//, /^seasons\//, /^office\//, /^tier\//, /^brand\//];
const KEEP = ['ui/spot_exit'];
const imgs = walk('brand/img').filter(f => /\.(webp|png|jpe?g)$/.test(f)).map(f => f.slice('brand/img/'.length).replace(/\.[a-z]+$/, '')).filter(k => /^(ui|map|scenes)\//.test(k)); /* نطاق ب3/ب4: ui وmap وscenes */
const lost = imgs.filter(k => !DYN.some(r => r.test(k)) && !KEEP.includes(k) && !SRC.includes(path.basename(k)));
a.deepEqual(lost, [], 'صور بلا مرجع: ' + lost.join(' ، '));
ok(imgs.length + ' صورة: لا يتيمة خارج الأنماط الديناميكية');
// 5) أيقونات رتب الحرس مربوطة
for (const r of ['regular', 'veteran', 'chief']) a.ok(read('src/ui/09b-guards.js').includes('guard-ranks-'), 'رتبة ' + r);
a.ok(/GRI = \['regular', 'veteran', 'chief'\]/.test(read('src/ui/09b-guards.js')), 'ربط أيقونات الرتب');
ok('أيقونات رتب الحرس مربوطة في 09b-guards');
// 6) صادرات API المحذوفة
const E = require('../src/engine.js');
for (const k of ['skMgrG', 'shipOf', 'rivalOn']) a.ok(!(k in (E.API || E)) || typeof (E.API || E)[k] === 'undefined', k + ' ما زال في API');
a.ok(!/const API = \{[^}]*\b(skMgrG|shipOf|rivalOn)\b/.test(read('src/engine/31-api.js')), 'API');
ok('skMgrG وshipOf وrivalOn خرجت من API');
// 7) ألفاظ الإغلاق: لا «حسناً/تمام/فهمت» خام في أزرار src/ui (تمر عبر closeTxt/closeBtn)
const raw = [];
for (const f of walk('src/ui')) { const t = read(f); for (const m of t.matchAll(/(>|\['|: ')(حسناً|حسنًا|تمام|فهمت)(<|',|' \}|'\])/g)) raw.push(f + ': ' + m[0]); }
a.deepEqual(raw, [], 'ألفاظ إغلاق خام: ' + raw.join(' | '));
ok('كل أزرار «حسناً/تمام/فهمت» تمر عبر closeTxt');
