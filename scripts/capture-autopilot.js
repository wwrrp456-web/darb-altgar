#!/usr/bin/env node
'use strict';
// صيانة خارج الحزمة: لا إنشاء تقدم أو رصيد مصطنع خارج وضع التشغيل الأصلي.
const fs=require('node:fs'),path=require('node:path'),run=require('../test/lib/autopilot-runner');
(async()=>{if(process.argv.length>2)throw Error('الالتقاط ثابت للبذرة5');const files=[13,18,23].map(n=>path.join(__dirname,'../test/fixtures/autopilot-'+n+'.json')),backups=files.map(f=>fs.existsSync(f)?fs.readFileSync(f):null);try{await run({phase:'start',capture:true});await run({phase:'finance',capture:true});await run({phase:'graduate',capture:true});for(const f of files)if(!fs.existsSync(f))throw Error('حفظ غير مكتمل');}catch(e){files.forEach((f,i)=>{if(backups[i])fs.writeFileSync(f,backups[i]);else if(fs.existsSync(f))fs.unlinkSync(f);});throw e;}})().catch(e=>{console.error(e);process.exitCode=1});
