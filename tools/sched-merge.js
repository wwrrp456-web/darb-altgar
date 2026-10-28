#!/usr/bin/env node
'use strict';
// يضمّ سجلات أجزاء اللعبة الآلية الثلاثة (البادئة: node tools/sched-merge.js /tmp/x-) في docs/sched/shadow-log.json ثم شغّل tools/sched-report.js
const fs = require('node:fs'), path = require('node:path'), pre = process.argv[2];
if (!pre) throw Error('الاستعمال: node tools/sched-merge.js <بادئة SCHED_OUT>');
const ph = ['start', 'finance', 'graduate'].map(p => JSON.parse(fs.readFileSync(pre + p + '.json', 'utf8')));
fs.writeFileSync(path.join(__dirname, '../docs/sched/shadow-log.json'), JSON.stringify({ log: ph.flatMap(x => x.log), gap: ph[0].gap, tickErr: ph.reduce((a, x) => a + x.tickErr, 0), day: ph[2].day, stage: ph[2].stage, fin: true, errs: [] }));
