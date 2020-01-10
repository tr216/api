global.taskHelper = require('./taskhelper.js');

exports.run=function(dbModel){
	
	function calistir(callback){

		console.log('Task service started: ',dbModel.dbName);
		dbModel.tasks.find({status:'pending'},(err,taskDocs)=>{
			if(!err){
				console.log('(' + dbModel.dbName.green + ') Calistirilacak gorev sayisi:',taskDocs.length);
				var index=0;
				function taskCalistir(cb){
					try{
						if(index>=taskDocs.length) return cb(null);
						var taskDoc=taskDocs[index];
						switch(taskDoc.taskType){
							case 'connector_transfer_zreport':
								connector_transfer_zreport(dbModel,taskDoc,(err)=>{
									index++;
									setTimeout(taskCalistir,0,cb);
								});
								break;
							case 'connector_import_einvoice':
								connector_import_einvoice(dbModel,taskDoc,(err)=>{
									index++;
									setTimeout(taskCalistir,0,cb);
								});
								break;
							case 'einvoice_send_to_gib':
								einvoice_send_to_gib(dbModel,taskDoc,(err)=>{
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
					}catch(tryErr){
						index++;
						setTimeout(taskCalistir,0,cb);
					}
				}
							
				taskCalistir((err)=>{
					setTimeout(calistir,20000,callback);
				})
							
			}else{
				setTimeout(calistir,20000,callback);
			}
		});
	}

	setTimeout(()=>{
		calistir((err)=>{

		});
	},5000)
	
}


function connector_transfer_zreport(dbModel,taskDoc,cb){
	try{
		taskHelper.setRunning(taskDoc,(err)=>{
			if(!err){

				connector_transfer_zreport_calistir(dbModel,taskDoc,cb);

			}else{
				taskHelper.setError(taskDoc,err,cb);
			}
		});
	}catch(tryErr){
		taskHelper.setError(taskDoc,err,cb);
	}
}


function connector_transfer_zreport_calistir(dbModel,taskDoc,cb){
	if(!taskDoc['document']){
		return taskHelper.setCancelled(taskDoc,cb);
	}
	if(taskDoc['document']['data'] && taskDoc['document']['posDevice'] && dbModel){
		var populate=[
            {path:'posDevice', populate:[
            	{path:'location',select:'_id locationName'},
            	{path:'service',select:'_id name serviceType'},
            	{path:'localConnector',
            		populate:['startFile','files']
            	}

            ]}
        ]
       
		dbModel.pos_device_zreports.findOne({_id:taskDoc.documentId}).populate(populate).exec((err,zreportDoc)=>{
			if(!err){
				console.log('Cihaz seri No:',zreportDoc.posDevice.deviceSerialNo);
				console.log('Lokasyon:',zreportDoc.posDevice.location.locationName);
				console.log('Yazar kasa servisi:',zreportDoc.posDevice.service.serviceType);
				console.log('Local connectorId:',zreportDoc.posDevice.localConnector.connectorId);
				

				services.tr216LocalConnector.run(zreportDoc.posDevice.localConnector,zreportDoc,(err,result)=>{
					if(!err){
						
						dbModel.pos_device_zreports.updateOne({_id:taskDoc.documentId} , {$set:{status:'transferred',error:null}},(err2)=>{
							taskHelper.setCompleted(taskDoc,cb);
							
						});
					}else{
						if(err.code=='NOT_CONNECTED'){
							
							if(taskDoc.attemptCount<=10){
								taskDoc.error=[result.error];
								taskHelper.setPending(taskDoc,cb);
							}else{

								dbModel.pos_device_zreports.updateOne({_id:taskDoc.documentId} , {$set:{status:'error',error:err}},(err2)=>{
									
									taskHelper.setError(taskDoc,err,cb);
									
								});
							}
						}else{
							
							dbModel.pos_device_zreports.updateOne({_id:taskDoc.documentId} , {$set:{status:'error',error:err}},(err2)=>{
								
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


function einvoice_send_to_gib(dbModel,taskDoc,cb){
	if(!taskDoc['document']){
		return taskHelper.setCancelled(taskDoc,cb);
	}
	if(taskDoc['document']['eIntegrator'] && dbModel){
		var yeniUUID=uuid.v4();
		taskDoc['document'].uuid.value=yeniUUID;
		services.eInvoice.sendToGib(dbModel,taskDoc['document'],(err)=>{
			if(!err){
				dbModel.e_invoices.updateOne({_id:taskDoc.documentId} , {$set:{invoiceStatus:'Processing',invoiceErrors:[],'uuid.value':yeniUUID}},(err2)=>{
					taskHelper.setCompleted(taskDoc,cb);
				});
			}else{
				dbModel.e_invoices.findOne({_id:taskDoc.documentId},(err33,doc)=>{
					if(!err33){
						if(doc!=null){
							doc.invoiceErrors.push({code:(err.name || err.code || 'SEND_TO_GIB'),message:(err.message || 'Gib e gonderimde hata olustu')});
							doc.invoiceStatus='Error';
							doc.uuid.value=yeniUUID;
							doc.save((err44,doc2)=>{
								taskHelper.setError(taskDoc,err,cb);
							});
						}else{
							taskHelper.setError(taskDoc,err,cb);
						}
					}else{
						taskHelper.setError(taskDoc,err,cb);
					}
				})
			}
		})
	}else{
		taskHelper.setCancelled(taskDoc,cb);
	}
}



function connector_import_einvoice(dbModel,taskDoc,cb){
	
	taskHelper.setRunning(taskDoc,(err)=>{
		if(!err){
			connector_import_einvoice_calistir(dbModel,taskDoc,(err)=>{
				if(cb) cb(err);
			});

		}else{
			taskHelper.setError(taskDoc,err);
			cb(err);
		}
	});
	
}

function connector_import_einvoice_calistir(dbModel,taskDoc,cb){
	if(!taskDoc['document']){
		return taskHelper.setCancelled(taskDoc,cb);
	}
	if(taskDoc['document']['localConnectorExportInvoice']['localConnector'] && dbModel){
		var populate=[
        	{path:'localConnectorExportInvoice.localConnector',
        		populate:['startFile','files']
        	}
        ]
       
		dbModel.e_integrators.findOne({_id:taskDoc.documentId}).populate(populate).exec((err,eIntegratorDoc)=>{
			if(!err){
				console.log('eIntegrator:',eIntegratorDoc.eIntegrator);
				console.log('name:',eIntegratorDoc.name);
				console.log('Local connectorId:',eIntegratorDoc.localConnectorExportInvoice.localConnector.connectorId);
				

				services.tr216LocalConnector.run(eIntegratorDoc.localConnectorExportInvoice.localConnector,eIntegratorDoc,(err,result)=>{
					if(!err){
						insertEInvoice(dbModel,eIntegratorDoc,result,(err,docs)=>{
							if(!err){
								dbModel.e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'transferred','localConnectorExportInvoice.error':null}},(err)=>{
									taskHelper.setCompleted(taskDoc,cb);
								});
							}else{
								dbModel.e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'error','localConnectorExportInvoice.error':err}},(err2)=>{
									
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

								dbModel.e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'error', 'localConnectorExportInvoice.error':err}},(err2)=>{
									
									taskHelper.setError(taskDoc,err,cb);
									
								});
							}
						}else{
							
							dbModel.e_integrators.updateOne({_id:taskDoc.documentId} , {$set:{'localConnectorExportInvoice.status':'error','localConnectorExportInvoice.error':err}},(err2)=>{
								
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
			e=mrutil.amountValueFixed2Digit(e,'');
		});
		console.log('insertEInvoice invoices.length:',invoices.length);

		var index=0;
		function kaydet(cb){
			if(index>=invoices.length) return cb(null);
			dbModel.e_invoices.findOne({ioType:0, localDocumentId:{$ne:''},localDocumentId:invoices[index].localDocumentId},(err,doc)=>{
				if(!err){
					if(doc==null){
						var tempInvoice=(new dbModel.e_invoices(invoices[index])).toJSON();
						tempInvoice=mrutil.deleteObjectFields(tempInvoice,["_id","__v","createdDate","modifiedDate",'eIntegrator', "pdf", "html"]);
						tempInvoice=mrutil.deleteObjectProperty(tempInvoice,'_id');

						var data1=mrutil.eInvoiceSetCurrencyIDs(tempInvoice,tempInvoice.documentCurrencyCode.value);
						data1['eIntegrator']=eIntegratorDoc._id;
						var newEInvoice=new dbModel.e_invoices(data1);
						

						// var tempInvoice=new dbModel.e_invoices(invoices[index]);
						// console.log('typeOf _id:', (typeof tempInvoice._id));

						// var newEInvoice=mrutil.eInvoiceSetCurrencyIDs(tempInvoice,tempInvoice.documentCurrencyCode.value);
	

						eInvoiceHelper.yeniFaturaNumarasi(dbModel,eIntegratorDoc,newEInvoice,(err,newEInvoice2)=>{
							eInvoiceHelper.kontrolImportEArsiv(dbModel,eIntegratorDoc,newEInvoice2,(err,newEInvoice3)=>{
								newEInvoice3.save((err,newDoc)=>{
									if(err){
										console.log('tasks.js insertEInvoice newEInvoice.save Error:',err);
									}else{
										console.log('tasks.js insertEInvoice newEInvoice.save OK _id:',newDoc._id);
									}
									index++;
									setTimeout(kaydet,0,cb);
								})
							})
						});
						
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
