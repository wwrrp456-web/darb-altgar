// البداية إلى المستوى4، بنفس أفعال المسار المشترك.
require('./lib/guided-runner')({end:4}).catch(e=>{console.error(e);process.exitCode=1});
