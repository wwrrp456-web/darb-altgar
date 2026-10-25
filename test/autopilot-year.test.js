// يستأنف حفظ التخرج الحقيقي ويكمل354يوماً، كما في الفحص الأصلي.
require('./lib/autopilot-runner')({phase:'year'}).catch(e=>{console.error(e);process.exitCode=1;});
