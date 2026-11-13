#!/usr/bin/env node
'use strict';
// تحديث بصمات الاختبار بعد تغيّر المصدر (جلسة التكامل، لا جلسات الفروع).
//  - autopilot-{13,18,23}: تبقى مثبّتة كما التُقطت؛ يُحدَّث sourceHash وحده (قرار بن محمود 2026-11-11، والتقاط autopilot غير قابل للتكرار حتى على main).
//  - guided-{4,8,10}: يُعاد التقاطها بالأداة القائمة scripts/capture-guided.js، وهي تحمّل capture-homest-off فتجري بـHOMEST.on=false.
// الاستعمال: node build.js ثم node scripts/refresh-fixtures.js [--check] [--autopilot] [--guided]
//   --check: يعرض ما هو قديم دون كتابة (رمز الخروج 1 إن وُجد قديم). بلا خيارات نوع: الاثنان معاً.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const fx = n => path.join(__dirname, '../test/fixtures', n), args = process.argv.slice(2), check = args.includes('--check');
const ap = args.includes('--autopilot') || !args.includes('--guided'), gd = args.includes('--guided') || !args.includes('--autopilot');
const apHash = require('../test/lib/autopilot-runner').sourceHash(), gdHash = require('../test/lib/guided-runner').sourceHash();
let stale = 0;
const rows = (names, hash) => names.map(n => { const f = fx(n), j = JSON.parse(fs.readFileSync(f, 'utf8')); return { n, f, j, old: j.sourceHash !== hash }; });
if (ap) {
  for (const r of rows([13, 18, 23].map(n => 'autopilot-' + n + '.json'), apHash)) {
    console.log((r.old ? 'قديم  ' : 'سليم  ') + r.n); if (!r.old) continue; stale++;
    if (!check) { // sourceHash أول مفتاح؛ يُعاد كتابة الملف بنصه نفسه عدا قيمته (لا يمس أي بيانات التقاط)
      const t = fs.readFileSync(r.f, 'utf8'); fs.writeFileSync(r.f, t.replace(r.j.sourceHash, apHash)); console.log('حُدّثت البصمة ' + r.n);
    }
  }
}
if (gd) {
  const rs = rows([4, 8, 10].map(n => 'guided-' + n + '.json'), gdHash); rs.forEach(r => console.log((r.old ? 'قديم  ' : 'سليم  ') + r.n));
  if (rs.some(r => r.old)) {
    stale += rs.filter(r => r.old).length;
    if (!check) { console.log('إعادة التقاط guided بـHOMEST.on=false (scripts/capture-guided.js)…'); cp.execFileSync(process.execPath, [path.join(__dirname, 'capture-guided.js')], { stdio: 'inherit' }); }
  }
}
if (check && stale) { console.log(stale + ' ملف قديم'); process.exitCode = 1; } else console.log(check ? 'كلها سليمة' : 'تم');
