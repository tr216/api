exports.posDevice=require('./pos-device/pos-device.js')
exports.eDespatch=require('./e-despatch/e-despatch.js')
exports.tasks=require('./tasks/tasks.js')

exports.start=function(dbModel){
	if(config.enabled_services.tasks) exports.tasks.start(dbModel);
    if(config.enabled_services.eDespatch) exports.eDespatch.start(dbModel); 
    //if(config.enabled_services.posDevice) exports.posDevice.start(dbModel); 
	
}