// متابعة حقيقية من المرحلة13إلى18مع استمرار عدادات التعثر والخطوات.
require('./lib/autopilot-runner')({phase:'finance'}).catch(e=>{console.error(e);process.exitCode=1;});
