global.taskHelper = require('./taskhelper.js');

function start(cb){
	console.log('Task service started.');

	db.tasks.find({status:'pending'},(err,taskDocs)=>{
		if(!err){
			console.log('Calistirilacak gorev sayisi:',taskDocs.length);
			var index=0;
			function taskCalistir(cb){
				if(index>=taskDocs.length) return cb(null);
				var taskDoc=taskDocs[index];
				switch(taskDoc.taskType){
					case 'connector_transfer_zreport':
						connector_transfer_zreport(taskDoc,(err)=>{
							index++;
							setTimeout(taskCalistir,0,cb);
						});
						break;
					default:
						taskHelper.setCancelled(taskDoc,(err)=>{
							index++;
							setTimeout(taskCalistir,0,cb);
						});
						break;
				}
			}
						
			taskCalistir((err)=>{
				cb(err);
			})
						
		}else{
			cb(err);
		}
	});
}

setTimeout(()=>{
	function basla(cb){
		start((err)=>{
			if(err){
				console.log('Task service error:',err);
			}
			setTimeout(basla,20000,cb)
		});
	}
	
	basla();
},5000)


function connector_transfer_zreport(taskDoc,cb){
	
	taskHelper.setRunning(taskDoc,(err)=>{
		if(!err){
			calistir(taskDoc,(err)=>{
				if(cb) cb(err);
			});

		}else{
			taskHelper.setError(taskDoc,err);
			cb(err);
		}
	});
	
}


function calistir(taskDoc,cb){
	if(!taskDoc['document']){
		return taskHelper.setCancelled(taskDoc,cb);
	}
	if(taskDoc['document']['data'] && taskDoc['document']['posDevice'] && repoDb[taskDoc.userDb]){
		var populate=[
            {path:'posDevice', populate:[
            	{path:'location',select:'_id locationName'},
            	{path:'service',select:'_id name serviceType'},
            	{path:'localConnector',
            		populate:['startFile','files']
            	}

            ]}
        ]
       
		repoDb[taskDoc.userDb].pos_device_zreports.findOne({_id:taskDoc.documentId}).populate(populate).exec((err,zreportDoc)=>{
			if(!err){
				console.log('Cihaz seri No:',zreportDoc.posDevice.deviceSerialNo);
				console.log('Lokasyon:',zreportDoc.posDevice.location.locationName);
				console.log('Yazar kasa servisi:',zreportDoc.posDevice.service.serviceType);
				console.log('Local connectorId:',zreportDoc.posDevice.localConnector.connectorId);
				

				services.etuliaConnector.run(zreportDoc.posDevice.localConnector,zreportDoc,(err,result)=>{
					if(!err){
						console.log('result:',result);
						repoDb[taskDoc.userDb].pos_device_zreports.updateOne({_id:taskDoc.documentId} , {$set:{status:'transferred',error:null}},(err)=>{
							taskHelper.setCompleted(taskDoc,cb);
							
						});
					}else{
						if(err.code=='NOT_CONNECTED'){
							
							if(taskDoc.attemptCount<=10){
								taskDoc.error=[result.error];
								taskHelper.setPending(taskDoc,cb);
							}else{

								repoDb[taskDoc.userDb].pos_device_zreports.updateOne({_id:taskDoc.documentId} , {$set:{status:'error',error:err}},(err2)=>{
									
									taskHelper.setError(taskDoc,err,cb);
									
								});
							}
						}else{
							
							repoDb[taskDoc.userDb].pos_device_zreports.updateOne({_id:taskDoc.documentId} , {$set:{status:'error',error:err}},(err2)=>{
								
								taskHelper.setError(taskDoc,err,cb);
								
							});
							
						}
					}
				});
				
			}else{
				taskHelper.setError(taskDoc,err,cb);
			}
		});
	}else{
		taskHelper.setCancelled(taskDoc,cb);
	}
		
}

function getSQL(mesaj){
	var sql='INSERT INTO table1 (mesaj) VALUES(\'' + mesaj + '\');';
	return sql;
}
