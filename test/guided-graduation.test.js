// التخرج وجميع شروط الدَّين والحصالة والتسلسل الأصلية، دون حذف مرحلة.
require('./lib/guided-runner')({start:10,end:11}).catch(e=>{console.error(e);process.exitCode=1});
