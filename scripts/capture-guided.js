#!/usr/bin/env node
'use strict';
// أداة صيانة خارج الحزمة الدائمة: التقاط الحفظ من النقرات والمحاكاة الفعلية، لا إنشاء حالة متخيلة.
const fs=require('node:fs'),path=require('node:path'),run=require('../test/lib/guided-runner');
(async()=>{if(process.argv.length>2)throw Error('الالتقاط ثابت عند المستويات4و8و10بالبذرة5');const files=[4,8,10].map(n=>path.join(__dirname,'../test/fixtures/guided-'+n+'.json')),backups=files.map(f=>fs.existsSync(f)?fs.readFileSync(f):null);for(const f of files)if(fs.existsSync(f))fs.unlinkSync(f);try{await run({end:10,capture:true});for(const f of files)if(!fs.existsSync(f))throw Error('نقطة حفظ مفقودة');}catch(e){files.forEach((f,i)=>{if(backups[i])fs.writeFileSync(f,backups[i]);else if(fs.existsSync(f))fs.unlinkSync(f);});throw e;}})().catch(e=>{console.error(e);process.exitCode=1});
