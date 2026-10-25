require('./lib/guided-runner')({start:4,end:8}).catch(e=>{console.error(e);process.exitCode=1});
