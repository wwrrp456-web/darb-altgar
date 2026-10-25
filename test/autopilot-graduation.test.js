// يستأنف حفظ الجزء الأول الحقيقي مع عدّادات التشغيل نفسها حتى التخرج.
require('./lib/autopilot-runner')({phase:'graduate'}).catch(e=>{console.error(e);process.exitCode=1;});
