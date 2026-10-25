require('./lib/guided-runner')({start:8,end:10}).catch(e=>{console.error(e);process.exitCode=1});
