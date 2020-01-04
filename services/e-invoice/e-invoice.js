/* Pos Device Service | etulia/portal */

var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');

exports.run=function(dbModel){
	
	function calistir(cb){
		console.log('eInvoice_checkDbAndDownloadInvoices started.',dbModel.dbName);
		checkDbAndDownloadInvoices(dbModel,(err)=>{
			if(err){
				console.error('eInvoice_checkDbAndDownloadInvoices',err);
			}
			console.log('eInvoice_checkDbAndDownloadInvoices ended.',dbModel.dbName);
			setTimeout(calistir,60000,cb);
		});
		
	}
	setTimeout(()=>{
		console.log('E-Invoice service started: ',dbModel.dbName);
		calistir((err)=>{});
	},12000);
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
		uyumsoft.downloadEInvoiceUsers((err)=>{
			if(err){
				console.error('downloadEInvoiceUsers:',  err);
			}
			console.log('downloadEInvoiceUsers completed');
			setTimeout(downloadEInvoiceUsers,3600*1000*1);
		});
	}
	downloadEInvoiceUsers();
// },3600*1000*12);
},1000*120);




function checkDbAndDownloadInvoices(dbModel,callback){
	if(dbModel.e_integrators==undefined) return callback(null);
	console.log('checkDbAndDownloadInvoices dbId:',dbModel._id);
	dbModel.e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
		if(!err){
			var index=0;
			function calistir(cb){
				if(index>=eIntegratorDocs.length){
					cb(null);
				}else{
					
					downloadInvoices(dbModel,eIntegratorDocs[index],(err)=>{
						if(err){
							console.log('E-Invoice Service Download error: dbId:', dbModel._id,err);
							console.log('E-Invoice Service Download error service:',eIntegratorDocs[index]);
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

function downloadInvoices(dbModel,eIntegratorDoc,cb){
	
	switch(eIntegratorDoc.eIntegrator){
		case 'uyumsoft':
			uyumsoft.downloadInvoices(dbModel,eIntegratorDoc,cb);
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