/* E Invoice Service | etulia/portal */

var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');

exports.run=function(dbModel){
	
	function calistirInbox(){
		console.log('checkDbAndDownloadInboxInvoices started.',dbModel.dbName);
		try{
			checkDbAndDownloadInboxInvoices(dbModel,(err)=>{
				if(err){
					console.error('checkDbAndDownloadInboxInvoices',err);
				}
				console.log('checkDbAndDownloadInboxInvoices ended.',dbModel.dbName);
				setTimeout(calistirInbox,60000);
			});
		}catch(tryErr){
			setTimeout(calistirInbox,60000);
		}
		
	}
	function calistirOutbox(){
		console.log('checkDbAndDownloadOutboxInvoices started.',dbModel.dbName);
		try{
			checkDbAndDownloadOutboxInvoices(dbModel,(err)=>{
				if(err){
					console.error('checkDbAndDownloadOutboxInvoices',err);
				}
				console.log('checkDbAndDownloadOutboxInvoices ended.',dbModel.dbName);
				setTimeout(calistirOutbox,60000);
			});
		}catch(tryErr){
			setTimeout(calistirOutbox,60000);
		}
		
	}

	console.log('E-Invoice service started: ',dbModel.dbName);
	setTimeout(()=>{
		calistirInbox();
	},12000);

	setTimeout(()=>{
		calistirOutbox();
	},16000);
}

// setTimeout(()=>{
// 	console.log(('E-Invoice Service Scheduled Task').green + ' started');
// 	Object.keys(repoDb).forEach((e)=>{
// 		repoDb[e].eInvoice_checkDbAndDownloadInvoices=function(){
// 			console.log('eInvoice_checkDbAndDownloadInvoices started.',e);
// 			checkDbAndDownloadInvoices(this,(err)=>{
// 				console.log('eInvoice_checkDbAndDownloadInvoices ended.',e);
// 				setTimeout(repoDb[e].eInvoice_checkDbAndDownloadInvoices,60000);
// 			});
// 		}
// 		repoDb[e].eInvoice_checkDbAndDownloadInvoices();
// 	});

// },10000*1);


setTimeout(()=>{
	console.log('E-InvoiceUsers download service started');

	function downloadEInvoiceUsers(){
		console.log('downloadEInvoiceUsers started');
		try{
			uyumsoft.downloadEInvoiceUsers((err)=>{
				if(err){
					console.error('downloadEInvoiceUsers:',  err);
				}
				console.log('downloadEInvoiceUsers completed');
				setTimeout(downloadEInvoiceUsers,3600*1000*1);
			});
		}catch(tryErr){
			setTimeout(downloadEInvoiceUsers,120*1000);
		}
	}
	downloadEInvoiceUsers();
// },3600*1000*12);
},1000*120);




function checkDbAndDownloadInboxInvoices(dbModel,callback){
	if(dbModel.e_integrators==undefined) return callback(null);
	console.log('checkDbAndDownloadInboxInvoices :',dbModel.dbName);
	dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
		if(!err){
			var index=0;
			function calistir(cb){
				if(index>=eIntegratorDocs.length){
					cb(null);
				}else{
					
					downloadInboxInvoices(dbModel,eIntegratorDocs[index],(err)=>{
						if(err){
							console.error('E-Invoice Service downloadInboxInvoices error:', dbModel.dbName ,err);
							console.error('E-Invoice Service downloadInboxInvoices error service:',eIntegratorDocs[index]);
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
}

function checkDbAndDownloadOutboxInvoices(dbModel,callback){
	try{
		if(dbModel.e_integrators==undefined) return callback(null);
		console.log('checkDbAndDownloadInboxInvoices :',dbModel.dbName);
		dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
			if(!err){
				var index=0;
				function calistir(cb){
					if(index>=eIntegratorDocs.length){
						cb(null);
					}else{
						
						downloadOutboxInvoices(dbModel,eIntegratorDocs[index],(err)=>{
							if(err){
								console.error('E-Invoice Service downloadOutboxInvoices error:', dbModel.dbName ,err);
								console.error('E-Invoice Service downloadOutboxInvoices error service:',eIntegratorDocs[index]);
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

function downloadOutboxInvoices(dbModel,eIntegratorDoc,cb){
	
	switch(eIntegratorDoc.eIntegrator){
		case 'uyumsoft':
			uyumsoft.downloadOutboxInvoices(dbModel,eIntegratorDoc,cb);
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