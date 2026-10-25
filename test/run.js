#!/usr/bin/env node
'use strict';
// مشغّل مستقل؛ قائمة الاختبارات الأصلية تظل في all.sh.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const clock = () => Number(process.hrtime.bigint()) / 1e9;
const number = value => new Intl.NumberFormat('ar', { maximumFractionDigits: 1 }).format(value);
// اختبارات تلعب لعبة كاملة فتحتاج مهلة أطول تحت الحمل المتوازي
const TEST_TIMEOUT = 180; // سقف المالك: لا اختبار دائم يتجاوز 3 دقائق.
const badOutput = /^FAIL|ERRORS:|pageerror/m;

function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (r.error || r.status !== 0) throw Error('تعذّر قراءة تغييرات Git.');
  return r.stdout.split('\0').filter(Boolean);
}

function matches(pattern, file) {
  const re = pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp('^' + re + '$').test(file);
}

async function main() {
  let jobs = Math.min(4, os.availableParallelism ? os.availableParallelism() : os.cpus().length || 1);
  let changed = false, timing = false, serial = false, listOnly = false;
  const filters = [];
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--changed') changed = true;
    else if (arg === '--timing') timing = true;
    else if (arg === '--serial') serial = true;
    else if (arg === '--list') listOnly = true;
    else if (arg === '--jobs') {
      const value = process.argv[++i];
      if (!value || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw Error('قيمة --jobs يجب أن تكون عددًا صحيحًا موجبًا.');
      jobs = Number(value);
    } else if (arg.startsWith('-')) throw Error('خيار غير معروف: ' + arg);
    else filters.push(arg);
  }
  if (serial) jobs = 1;
  const script = fs.readFileSync(path.join(__dirname, 'all.sh'), 'utf8');
  const match = script.match(/^\s*for\s+t\s+in\s+([\s\S]*?);\s*do\b/m);
  if (!match) throw Error('تعذّر استخراج قائمة الاختبارات من all.sh.');
  const all = [...new Set(match[1].trim().split(/\s+/))];
  if (!all.length || all.some(n => !/^[\w-]+$/.test(n) || !fs.existsSync(path.join(__dirname, n + '.test.js')))) throw Error('قائمة الاختبارات غير صالحة أو تحتوي ملفًا مفقودًا.');
  let selected = all;
  if (changed) {
    const files = [...new Set([...git(['diff', '--name-only', '--no-renames', '-z', 'HEAD']), ...git(['ls-files', '--others', '--exclude-standard', '-z'])])];
    const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'map.json'), 'utf8'));
    for (const [key, value] of Object.entries(map)) {
      if (value !== '*' && (!Array.isArray(value) || value.some(n => !all.includes(n)))) throw Error('ربط اختبارات غير صالح: ' + key);
    }
    const names = new Set();
    let full = false;
    for (const file of files) {
      const rules = Object.entries(map).filter(([pattern]) => matches(pattern, file));
      if (!rules.length || rules.some(([, value]) => value === '*')) { full = true; break; }
      for (const [, value] of rules) for (const name of value) names.add(name);
    }
    selected = full ? all : all.filter(n => names.has(n));
    console.log(full ? 'تغيير عام أو غير مربوط: تشغيل الحزمة كاملة.' : 'اختيار الاختبارات المرتبطة بالتغييرات.');
  }
  if (filters.length) selected = selected.filter(n => filters.some(f => n.includes(f)));
  if (!selected.length) {
    if (filters.length) throw Error('لا توجد اختبارات تطابق الكلمات المطلوبة.');
    console.log('لا تغييرات تستدعي الاختبارات.');
    console.log('الناجح: ٠، الفاشل: ٠، الزمن الكلي: ٠ ث.');
    return;
  }
  if (listOnly) { console.log(selected.join(' ')); return; }
  // مسارات العمر والبحر طويلة وكثيفة المحاكاة؛ تُشغَّل منفردة بعد بقية الاختبارات لحماية حد180ث.
  const exclusive = selected.filter(n => /^guided(?:-|$)/.test(n) || ['journey', 'sea', 'sea-stories', 'autopilot'].includes(n)), parallel = selected.filter(n => !exclusive.includes(n));
  const started = clock(), results = [], active = new Set();
  let cursor = 0, interrupted = false;
  const stop = () => { interrupted = true; for (const child of active) child.kill('SIGTERM'); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  console.log('تشغيل ' + number(selected.length) + ' اختبارًا، بتوازٍ ' + number(Math.min(jobs, selected.length)) + '.');
  async function run(name) {
    const start = clock(), out = '/tmp/t_' + name + '.out';
    const fd = fs.openSync(out, 'w');
    let child;
    try {
      child = spawn('timeout', [String(TEST_TIMEOUT), process.execPath, path.join(__dirname, name + '.test.js')], { cwd: root, env: process.env, stdio: ['ignore', fd, fd] });
    } finally { fs.closeSync(fd); }
    active.add(child);
    const status = await new Promise(resolve => {
      let error;
      child.once('error', e => { error = e; });
      child.once('close', (code, signal) => resolve({ code, signal, error }));
    });
    active.delete(child);
    const text = fs.readFileSync(out, 'utf8'), seconds = clock() - start;
    const passed = !interrupted && !status.error && status.code === 0 && !badOutput.test(text);
    results.push({ name, passed, seconds });
    console.log((passed ? '✓ ' : '✗ ') + name + ' (' + number(seconds) + ' ث)');
    if (!passed) {
      if (status.code === 124) console.log('  تجاوز المهلة.');
      else if (status.error) console.log('  تعذّر تشغيل عملية الاختبار.');
      else if (status.code !== 0) console.log('  رمز الخروج: ' + (status.code == null ? status.signal : status.code));
      const lines = text.split(/\r?\n/).filter(l => /^FAIL|ERRORS|pageerror|Error/.test(l));
      for (const line of (lines.length ? lines : text.split(/\r?\n/).filter(Boolean)).slice(0, 3)) console.log('  ' + line);
    }
  }
  async function worker() { while (!interrupted && cursor < parallel.length) await run(parallel[cursor++]); }
  try { await Promise.all(Array.from({ length: Math.min(jobs, parallel.length) }, worker)); for(const name of exclusive){if(interrupted)break;await run(name);} }
  finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
  const passed = results.filter(r => r.passed).length, failed = results.length - passed;
  console.log('الناجح: ' + number(passed) + '، الفاشل: ' + number(failed) + '، الزمن الكلي: ' + number(clock() - started) + ' ث.');
  if (interrupted) console.log('أُوقف التشغيل؛ لم تكتمل كل الاختبارات.');
  if (timing) {
    console.log('أبطأ عشرة اختبارات:');
    for (const r of [...results].sort((a, b) => b.seconds - a.seconds).slice(0, 10)) console.log('  ' + r.name + ': ' + number(r.seconds) + ' ث');
  }
  if (failed || interrupted || results.length !== selected.length) process.exitCode = 1;
}
main().catch(error => { console.error('خطأ: ' + error.message); process.exitCode = 1; });
