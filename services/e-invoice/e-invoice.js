/* Pos Device Service | etulia/portal */

var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');


setTimeout(()=>{
	function scheduler(){
		mrutil.console(('E-Invoice Service Scheduled Task').green + ' started');
		start((err)=>{
			if(err){
				mrutil.console(('E-Invoice Service Scheduled Task Error:') + JSON.stringify(err));
			}else{
				mrutil.console(('E-Invoice Service Scheduled Task').blue + ' completed');
			}
			setTimeout(scheduler,60000*5); //30 dakika arayla check et.
		});
	}
	scheduler();
 //},60000*30);
  },1000*8);

function start(callback){

	var dbIds=[];
	Object.keys(repoDb).forEach((e)=>{
		// dbIds.push({dbId:e,completed:false});
		dbIds.push(e);
	});

	console.log('dbIds.length:',dbIds.length);
	var index=0;
	function indir(cb){
		if(index>=dbIds.length){
			return cb(null);
		}
		
		checkDbAndDownloadInvoices(dbIds[index],(err)=>{
			
			index++;
			setTimeout(indir,3000,cb);
		});
	}
	indir((err)=>{
		callback(err);
	});
}

function checkDbAndDownloadInvoices(dbId,callback){
	repoDb[dbId].e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
		if(!err){
			var index=0;
			function runService(cb){
				if(index>=eIntegratorDocs.length){
					cb(null);
				}else{
					console.log('checkDbAndDownloadInvoices downloadInvoices dbId:',dbId);
					downloadInvoices(repoDb[dbId],eIntegratorDocs[index],(err)=>{
						if(err){
							console.log('E-Invoice Service Download error:',err);
							console.log('E-Invoice Service Download error service:',eIntegratorDocs[index]);
						}
						index++;
						setTimeout(runService,3000,cb);
					});
				}
			}

			runService((err)=>{
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

setTimeout(()=>{
	function downloadEInvoiceUsers(){
		mrutil.console(('E-InvoiceUsers Download Scheduled Task').green + ' started');
		//var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');
		uyumsoft.downloadEInvoiceUsers((err)=>{
			if(err){
				mrutil.console(('E-InvoiceUsers Download Scheduled Task Error:') + JSON.stringify(err));
			}else{
				mrutil.console(('E-InvoiceUsers Download Scheduled Task').blue + ' completed');
			}
			setTimeout(downloadEInvoiceUsers,3600*1000*1);
		});
	}
	downloadEInvoiceUsers();
// },3600*1000*12);
},1000*12);


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