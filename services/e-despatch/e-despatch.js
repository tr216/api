/* E Invoice Service | etulia/portal */

var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');

exports.run=function(dbModel){
	
	function calistirInbox(){
		eventLog('checkDbAndDownloadInboxInvoices started.',dbModel.dbName);
		try{
			checkDbAndDownloadInboxInvoices(dbModel,(err)=>{
				if(err){
					errorLog('checkDbAndDownloadInboxInvoices',err);
				}
				eventLog('checkDbAndDownloadInboxInvoices ended.',dbModel.dbName);
				setTimeout(calistirInbox,60000);
			});
		}catch(tryErr){
			setTimeout(calistirInbox,60000);
		}
		
	}
	function calistirOutbox(){
		eventLog('checkDbAndDownloadOutboxInvoices started.',dbModel.dbName);
		try{
			checkDbAndDownloadOutboxInvoices(dbModel,(err)=>{
				if(err){
					errorLog('checkDbAndDownloadOutboxInvoices',err);
				}
				eventLog('checkDbAndDownloadOutboxInvoices ended.',dbModel.dbName);
				setTimeout(calistirOutbox,60000);
			});
		}catch(tryErr){
			setTimeout(calistirOutbox,60000);
		}
		
	}

	function calistirCheckOutboxStatus(){
		eventLog('calistirCheckOutboxStatus started.',dbModel.dbName);
		try{
			checkDbAndCheckOutboxInvoicesStatus(dbModel,(err)=>{
				if(err){
					errorLog('checkDbAndCheckOutboxInvoicesStatus',err);
				}
				eventLog('calistirCheckOutboxStatus ended.',dbModel.dbName);
				setTimeout(calistirCheckOutboxStatus,60000);
			});
		}catch(tryErr){
			setTimeout(calistirCheckOutboxStatus,60000);
		}
		
	}

	function calistirCheckInboxStatus(){
		eventLog('calistirCheckOutboxStatus started.',dbModel.dbName);
		try{
			checkDbAndCheckInboxInvoicesStatus(dbModel,(err)=>{
				if(err){
					errorLog('checkDbAndCheckInboxInvoicesStatus',err);
				}
				eventLog('calistirCheckInboxStatus ended.',dbModel.dbName);
				setTimeout(calistirCheckInboxStatus,60000);
			});
		}catch(tryErr){
			setTimeout(calistirCheckInboxStatus,60000);
		}
		
	}
	eventLog('E-Invoice service started: ',dbModel.dbName);
	setTimeout(()=>{
		calistirInbox();
	},15000);

	setTimeout(()=>{
		calistirOutbox();
	},13000);

	setTimeout(()=>{
		calistirCheckOutboxStatus();
	},24000);
	setTimeout(()=>{
		calistirCheckInboxStatus();
	},35000);
}

setTimeout(()=>{
	eventLog('E-InvoiceUsers download service started');

	function downloadEInvoiceUsers(){
		eventLog('downloadEInvoiceUsers started');
		try{
			uyumsoft.downloadEInvoiceUsers((err)=>{
				if(err){
					errorLog('downloadEInvoiceUsers:',  err);
				}
				eventLog('downloadEInvoiceUsers completed');
				setTimeout(downloadEInvoiceUsers,3600*1000*1);
			});
		}catch(tryErr){
			setTimeout(downloadEInvoiceUsers,600*1000);
		}
	}
	downloadEInvoiceUsers();
},600*1000*1000);  //10dk sonra basla
// },1000*3600*24);


function checkDbAndDownloadOutboxInvoices(dbModel,callback){
	try{
		if(dbModel.e_integrators==undefined) return callback(null);
		eventLog('checkDbAndDownloadOutboxInvoices :',dbModel.dbName);
		dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
			if(!err){
				var index=0;
				function calistir(cb){
					if(index>=eIntegratorDocs.length) return cb(null);
					switch(eIntegratorDocs[index].eIntegrator){
						case 'uyumsoft':
							uyumsoft.downloadOutboxInvoices(dbModel,eIntegratorDocs[index],(err)=>{
								if(err){
									errorLog('E-Invoice Service downloadOutboxInvoices error:', dbModel.dbName ,err);
									errorLog('E-Invoice Service downloadOutboxInvoices error service:',eIntegratorDocs[index]);
								}
								index++;
								setTimeout(calistir,3000,cb);
							});
						break;
						default:
							index++;
							setTimeout(calistir,3000,cb);
						break;
					}
					
				}

				calistir((err)=>{
					callback(err);
				});

			}else{
				callback(err);
			}
		});
	}catch(tryErr){
		callback(err);
	}
}


// function downloadOutboxInvoices(dbModel,eIntegratorDoc,cb){
	
// 	switch(eIntegratorDoc.eIntegrator){
// 		case 'uyumsoft':
// 			uyumsoft.downloadOutboxInvoices(dbModel,eIntegratorDoc,cb);
// 		break;
// 		default:
// 			cb(null);
// 		break;
// 	}
// }



function checkDbAndCheckOutboxInvoicesStatus(dbModel,callback){
	try{
		if(dbModel.e_integrators==undefined) return callback(null);
		dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
			if(!err){
				var index=0;
				function calistir(cb){
					if(index>=eIntegratorDocs.length){
						cb(null);
					}else{
						
						checkOutboxInvoicesStatus(dbModel,eIntegratorDocs[index],(err)=>{
							if(err){
								errorLog('E-Invoice Service checkOutboxInvoicesStatus error:', dbModel.dbName ,err);
								errorLog('E-Invoice Service checkOutboxInvoicesStatus error service:',eIntegratorDocs[index]);
							}
							index++;
							setTimeout(calistir,3000,cb);
						});
					}
				}

				calistir((err)=>{
					callback(err);
				});

			}else{
				callback(err);
			}
		});
	}catch(tryErr){
		callback(err);
	}
}


function checkDbAndCheckInboxInvoicesStatus(dbModel,callback){
	try{
		if(dbModel.e_integrators==undefined) return callback(null);
		dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
			if(!err){
				var index=0;
				function calistir(cb){
					if(index>=eIntegratorDocs.length){
						cb(null);
					}else{
						
						checkInboxInvoicesStatus(dbModel,eIntegratorDocs[index],(err)=>{
							if(err){
								errorLog('E-Invoice Service checkInboxInvoicesStatus error:', dbModel.dbName ,err);
								errorLog('E-Invoice Service checkInboxInvoicesStatus error service:',eIntegratorDocs[index]);
							}
							index++;
							setTimeout(calistir,3000,cb);
						});
					}
				}

				calistir((err)=>{
					callback(err);
				});

			}else{
				callback(err);
			}
		});
	}catch(tryErr){
		callback(err);
	}
}

function checkInboxInvoicesStatus(dbModel,eIntegratorDoc,callback){
	
	var filter={
		ioType:1,
		eIntegrator:eIntegratorDoc._id,
		invoiceStatus:{$nin:['Approved','Declined','Error','Draft']},
		createdDate:{$gte:(new Date()).addDays(-30)}
	}

	dbModel.e_invoices.find(filter).select('_id uuid ID invoiceStatus').exec((err,docs)=>{
		if(!err){
			var invoiceList=[];
			docs.forEach((e)=>{
				invoiceList.push({_id:e._id, uuid:e.uuid.value,status:e.invoiceStatus});
			});

			
			if(invoiceList.length>0){
				switch(eIntegratorDoc.eIntegrator){
					case 'uyumsoft':
						uyumsoft.checkInboxInvoicesStatus(dbModel,eIntegratorDoc,invoiceList,(err,guncellenmisInvoiceList)=>{
							if(!err){
								if(guncellenmisInvoiceList.length>0){
									var index=0;
									function calistir(cb){
										if(index>=guncellenmisInvoiceList.length) return cb(null);
										dbModel.e_invoices.updateOne({_id:guncellenmisInvoiceList[index]._id},{$set:{invoiceStatus:guncellenmisInvoiceList[index].status}},(err)=>{
											index++;
											setTimeout(calistir,0,cb);
										});
									}
									calistir((err)=>{
										callback(err);
									})
								}
							}else{
								callback(err)
							}
							
						});
					break;
					default:
						callback(null);
					break;
				}
			}else{
				callback(null)
			}
			
			
		}else{
			callback(err);
		}
	});
}


function checkOutboxInvoicesStatus(dbModel,eIntegratorDoc,callback){
	
	var filter={
		ioType:0,
		eIntegrator:eIntegratorDoc._id,
		invoiceStatus:{$nin:['Approved','Declined','Error','Draft']},
		createdDate:{$gte:(new Date()).addDays(-30)}
	}

	dbModel.e_invoices.find(filter).select('_id uuid ID invoiceStatus').exec((err,docs)=>{
		if(!err){
			var invoiceList=[];
			docs.forEach((e)=>{
				invoiceList.push({_id:e._id, uuid:e.uuid.value,status:e.invoiceStatus});
			});

			
			if(invoiceList.length>0){
				switch(eIntegratorDoc.eIntegrator){
					case 'uyumsoft':
						uyumsoft.checkOutboxInvoicesStatus(dbModel,eIntegratorDoc,invoiceList,(err,guncellenmisInvoiceList)=>{
							if(!err){
								if(guncellenmisInvoiceList.length>0){
									var index=0;
									function calistir(cb){
										if(index>=guncellenmisInvoiceList.length) return cb(null);
										dbModel.e_invoices.updateOne({_id:guncellenmisInvoiceList[index]._id},{$set:{invoiceStatus:guncellenmisInvoiceList[index].status}},(err)=>{
											index++;
											setTimeout(calistir,0,cb);
										});
									}
									calistir((err)=>{
										callback(err);
									})
								}
							}else{
								callback(err)
							}
							
						});
					break;
					default:
						callback(null);
					break;
				}
			}else{
				callback(null)
			}
			
			
		}else{
			callback(err);
		}
	});
}



function checkDbAndDownloadInboxInvoices(dbModel,callback){
	if(dbModel.e_integrators==undefined) return callback(null);
	eventLog('checkDbAndDownloadInboxInvoices :',dbModel.dbName);
	dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
		if(!err){
			var index=0;
			function calistir(cb){
				if(index>=eIntegratorDocs.length) return cb(null);
					
				downloadInboxInvoices(dbModel,eIntegratorDocs[index],(err)=>{
					if(err){
						errorLog('E-Invoice Service downloadInboxInvoices error:', dbModel.dbName ,err);
						errorLog('E-Invoice Service downloadInboxInvoices error service:',eIntegratorDocs[index]);
					}
					index++;
					setTimeout(calistir,3000,cb);
				});
			}

			calistir((err)=>{
				callback(err);
			});

		}else{
			callback(err);
		}
	});
}


function downloadInboxInvoices(dbModel,eIntegratorDoc,cb){
	
	switch(eIntegratorDoc.eIntegrator){
		case 'uyumsoft':
			uyumsoft.downloadInboxInvoices(dbModel,eIntegratorDoc,cb);
		break;
		default:
			cb(null);
		break;
	}
}

exports.sendToGib=function(dbModel,eInvoice,cb){
	try{
		dbModel.e_integrators.findOne({_id:eInvoice.eIntegrator._id}).populate('invoiceXslt').exec((err,eIntegratorDoc)=>{
			if(!err){
				var xsltEkle=false;
				if(eIntegratorDoc.invoiceXslt)
					if(eIntegratorDoc.invoiceXslt.data){
						xsltEkle=true;
						if(eInvoice.additionalDocumentReference.length>0){
							if(eInvoice.additionalDocumentReference[0].attachment)
								if(eInvoice.additionalDocumentReference[0].attachment.embeddedDocumentBinaryObject)
									if(eInvoice.additionalDocumentReference[0].attachment.value){
										xsltEkle=false;
									}
						}
					}
				if(xsltEkle){
					var value='';
					if(eIntegratorDoc.invoiceXslt.data.indexOf('base64,')>-1){
						value=eIntegratorDoc.invoiceXslt.data.split('base64,')[1];
					}else{
						value=eIntegratorDoc.invoiceXslt.data;
					}
					eInvoice.additionalDocumentReference=[{
						ID:{value:'1'},
						issueDate:{ value:eInvoice.issueDate.value},
						documentTypeCode:{ value:'XSLT'},
						documentType:{ value:'XSLT'},
						attachment:{
							embeddedDocumentBinaryObject:{
								attr : {
			                        mimeCode : 'application/xml',
			                        encodingCode : 'Base64',
			                        characterSetCode : 'UTF-8',
			                        filename : eInvoice.ID.value + '.xslt'
			                    },
			                    value :value
							}
						}
					}];
				}	
			}
			switch(eInvoice.eIntegrator.eIntegrator){
				case 'uyumsoft':
					uyumsoft.sendToGib(dbModel,eInvoice,cb);
				break;
				default:
					cb(null);
				break;
			}
		});
		
	}catch(tryErr){
		cb(tryErr)
	}
	
}

exports.approveInvoice=function(dbModel,eInvoice,cb){
	try{
		dbModel.e_integrators.findOne({_id:eInvoice.eIntegrator._id}).exec((err,eIntegratorDoc)=>{
			
			switch(eInvoice.eIntegrator.eIntegrator){
				case 'uyumsoft':
					uyumsoft.sendDocumentResponse('Approved',dbModel,eInvoice,cb);
				break;
				default:
					cb(null);
				break;
			}
		});
		
	}catch(tryErr){
		cb(tryErr)
	}
	
}

exports.declineInvoice=function(dbModel,eInvoice,cb){
	try{
		dbModel.e_integrators.findOne({_id:eInvoice.eIntegrator._id}).exec((err,eIntegratorDoc)=>{
			
			switch(eInvoice.eIntegrator.eIntegrator){
				case 'uyumsoft':
					uyumsoft.sendDocumentResponse('Declined',dbModel,eInvoice,cb);
				break;
				default:
					cb(null);
				break;
			}
		});
		
	}catch(tryErr){
		cb(tryErr)
	}
	
}

exports.returnInvoice=function(dbModel,eInvoice,cb){
	try{
		dbModel.e_integrators.findOne({_id:eInvoice.eIntegrator._id}).exec((err,eIntegratorDoc)=>{
			
			switch(eInvoice.eIntegrator.eIntegrator){
				case 'uyumsoft':
					uyumsoft.sendDocumentResponse('Return',dbModel,eInvoice,cb);
				break;
				default:
					cb(null);
				break;
			}
		});
		
	}catch(tryErr){
		cb(tryErr)
	}
	
}