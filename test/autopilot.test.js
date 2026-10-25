// تشغيل جديد فعلي إلى منتصف رحلة المراحل، دون تعديل مصدر اللعبة أو تسريع أيامها.
require('./lib/autopilot-runner')({phase:'start'}).catch(e=>{console.error(e);process.exitCode=1;});
