// يجرّب تركيبات وسائط Chromium بالترتيب ويطبع أول تركيبة تُقلع وتفتح صفحة، لتُستعمل في PW_ARGS: node scripts/pw-probe.js
// (لا يستعمل pw-env حتى لا تختلط الوسائط). مسار playwright يُكتشف كما في pw-env.
const fs = require('fs'), path = require('path');
const root = [process.env.PW_ROOT, '/opt/node-tools/node_modules/playwright', '/workspace/cloud-tools/node_modules/playwright', path.join(process.cwd(), 'node_modules/playwright')].filter(Boolean).find(p => fs.existsSync(path.join(p, 'package.json')));
if (!root) { console.error('لا playwright'); process.exit(2); }
const { chromium } = require(root);
const os = require('os'), cp = require('child_process');
// متصفحات موجودة فعلاً: الافتراضي لـplaywright أولاً، ثم أي chrome/headless_shell في مخازن playwright المعروفة وعلى النظام
const found = new Set(), scan = d => { try { for (const n of fs.readdirSync(d)) for (const sub of ['chrome-linux/chrome', 'chrome-linux/headless_shell', 'chrome-linux64/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell']) { const f = path.join(d, n, sub); if (fs.existsSync(f)) found.add(f); } } catch (e) {} };
[process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), '.cache/ms-playwright'), '/opt/pw-browsers', '/root/.cache/ms-playwright', '/home/agent/.cache/ms-playwright'].filter(Boolean).forEach(scan);
for (const c of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) { try { const w = cp.execSync('command -v ' + c, { encoding: 'utf8', shell: '/bin/bash' }).trim(); if (w) found.add(w); } catch (e) {} }
const ARGS = [['--no-sandbox'], ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu'], ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu', '--disable-features=NetworkServiceSandbox,NetworkServiceInProcess'], ['--no-sandbox', '--no-zygote', '--single-process', '--disable-dev-shm-usage', '--disable-gpu']];
const EXECS = [undefined].concat([...found]);
console.log('متصفحات مكتشفة: ' + ([...found].join(' ، ') || 'لا شيء (سيُجرَّب افتراضي playwright فقط)'));
(async () => {
  for (const exe of EXECS) for (const args of ARGS) {
    let b; try { b = await chromium.launch(Object.assign({ args, timeout: 20000 }, exe ? { executablePath: exe } : {})); const p = await b.newPage(); await p.setContent('<title>ok</title><p>مرحبا</p>'); const t = await p.title(); await b.close(); if (t === 'ok') { console.log('نجح: ' + (exe ? 'PW_EXEC="' + exe + '" ' : '') + 'PW_ARGS="' + args.join(' ') + '"'); process.exit(0); } }
    catch (e) { console.log('فشل: ' + (exe || 'الافتراضي') + ' | ' + args.join(' ') + '  ←  ' + String(e.message).split('\n')[0].slice(0, 120)); try { b && await b.close(); } catch (_) {} }
  }
  console.log('لم تنجح أي تركيبة. إن قيل «Executable doesn\'t exist» فثبّت المتصفح المطابق: npx playwright install chromium (أو من مجلد playwright نفسه)، ثم أعد التشغيل. وإلا أرسل الناتج كاملاً.'); process.exit(1);
})();
