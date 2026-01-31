const workerLib = require('./node_modules/elkjs/lib/elk-worker.min.js');
console.log('Type of export:', typeof workerLib);
console.log('Worker property:', workerLib.Worker);
console.log('Keys:', Object.keys(workerLib));
