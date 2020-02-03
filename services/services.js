exports.tr216LocalConnector=require('./local-connector/local-connector.js');

exports.tasks=require('./tasks/tasks.js');
exports.posDevice=require('./pos-device/pos-device.js');

exports.scheduler=require('./scheduler/scheduler.js');
exports.eInvoice=require('./e-invoice/e-invoice.js');
exports.eLedger=require('./e-ledger/e-ledger.js');

exports.runUserDbServices=function(){
    if(config.enabled_services.tasks) exports.tasks.run(this);
    if(config.enabled_services.eInvoice) exports.eInvoice.run(this); 
    if(config.enabled_services.posDevice) exports.posDevice.run(this); 
}

exports.start=function(){
    eventLog('Main Service started.');
    Object.keys(repoDb).forEach((dbId)=>{
        if(repoDb[dbId]['runUserDbServices']==undefined){
            repoDb[dbId]['runUserDbServices']=exports.runUserDbServices;
            repoDb[dbId].runUserDbServices();
        }
   });
}


exports.start();
