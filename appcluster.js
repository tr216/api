global.cluster = require('cluster');
//const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
  	console.log('fork cpu no:',i);
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  
  //console.log('cluster.worker:', cluster.worker); 
  var kp=require('./deneme.js');
  

}