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
					case 'connector_import_einvoice':
						connector_import_einvoice(taskDoc,(err)=>{
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
			connector_transfer_zreport_calistir(taskDoc,(err)=>{
				if(cb) cb(err);
			});

		}else{
			taskHelper.setError(taskDoc,err);
			cb(err);
		}
	});
	
}


function connector_transfer_zreport_calistir(taskDoc,cb){
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
				

				services.tr216LocalConnector.run(zreportDoc.posDevice.localConnector,zreportDoc,(err,result)=>{
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

function connector_import_einvoice(taskDoc,cb){
	
	taskHelper.setRunning(taskDoc,(err)=>{
		if(!err){
			connector_import_einvoice_calistir(taskDoc,(err)=>{
				if(cb) cb(err);
			});

		}else{
			taskHelper.setError(taskDoc,err);
			cb(err);
		}
	});
	
}

function connector_import_einvoice_calistir(taskDoc,cb){
	if(!taskDoc['document']){
		return taskHelper.setCancelled(taskDoc,cb);
	}
	if(taskDoc['document']['localConnectorExportInvoice']['localConnector'] && repoDb[taskDoc.userDb]){
		var populate=[
        	{path:'localConnectorExportInvoice.localConnector',
        		populate:['startFile','files']
        	}
        ]
       
		repoDb[taskDoc.userDb].e_integrators.findOne({_id:taskDoc.documentId}).populate(populate).exec((err,eIntegratorDoc)=>{
			if(!err){
				console.log('eIntegrator:',eIntegratorDoc.eIntegrator);
				console.log('name:',eIntegratorDoc.name);
				console.log('Local connectorId:',eIntegratorDoc.localConnectorExportInvoice.localConnector.connectorId);
				

				services.tr216LocalConnector.run(eIntegratorDoc.localConnectorExportInvoice.localConnector,eIntegratorDoc,(err,result)=>{
					if(!err){
						insertEInvoice(repoDb[taskDoc.userDb],eIntegratorDoc,result,(err,docs)=>{
							if(!err){
								repoDb[taskDoc.userDb].e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'transferred','localConnectorExportInvoice.error':null}},(err)=>{
									taskHelper.setCompleted(taskDoc,cb);
								});
							}else{
								repoDb[taskDoc.userDb].e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'error','localConnectorExportInvoice.error':err}},(err2)=>{
									
									taskHelper.setError(taskDoc,err,cb);
									
								});
							}
						});
						
					}else{
						if(err.code=='NOT_CONNECTED'){
							
							if(taskDoc.attemptCount<=10){
								taskDoc.error=[result.error];
								taskHelper.setPending(taskDoc,cb);
							}else{

								repoDb[taskDoc.userDb].e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'error', 'localConnectorExportInvoice.error':err}},(err2)=>{
									
									taskHelper.setError(taskDoc,err,cb);
									
								});
							}
						}else{
							
							repoDb[taskDoc.userDb].e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'error','localConnectorExportInvoice.error':err}},(err2)=>{
								
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

function insertEInvoice(dbModel,eIntegratorDoc,connectorResult,callback){
	try{
		console.log('insertEInvoice started');
		var connInvoices=JSON.parse(connectorResult.data);
		var invoices=[];
		if(Array.isArray(connInvoices)){
			invoices=connInvoices;
		}else{
			invoices.push(connInvoices);
		}
		invoices.forEach((e)=>{
			e.invoiceStatus='Draft';
			e.ioType=0;
			e.invoiceErrors=[];
			e.localStatus='transferred';
			e.localErrors=[];
			e.ID='';
			e.eIntegrator=eIntegratorDoc._id;
			e.uuid={value:uuid.v4()};
			if(e.localDocumentId==undefined){
				e.localDocumentId='';
			}

		});
		console.log('insertEInvoice invoices.length:',invoices.length);

		var index=0;
		function kaydet(cb){
			if(index>=invoices.length) return cb(null);
			dbModel.e_invoices.findOne({ioType:0, localDocumentId:{$ne:''},localDocumentId:invoices[index].localDocumentId},(err,doc)=>{
				if(!err){
					if(doc==null){
						var newEInvoice=new dbModel.e_invoices(invoices[index]);
						newEInvoice.save((err,newDoc)=>{
							if(err){
								console.log('tasks.js insertEInvoice newEInvoice.save Error:',err);
							}else{
								console.log('tasks.js insertEInvoice newEInvoice.save OK _id:',newDoc._id);
							}
							index++;
							setTimeout(kaydet,0,cb);
						})
					}else{
						console.log('localDocumentId zaten var:',invoices[index].localDocumentId);
						index++;
						setTimeout(kaydet,0,cb);
					}
				}else{
					cb({code: err.name, message: err.message});
				}
			});
			
		}

		kaydet((err)=>{
			if(err){
				console.log('insertEInvoice kaydet error:',err);
			}else{
				console.log('insertEInvoice kaydet basarili');
			}
			
			callback(err);
		})

	}catch(tryErr){
		console.log('insertEInvoice tryErr:',tryErr);
		callback({code:tryErr.name,message:tryErr.message});
	}
}