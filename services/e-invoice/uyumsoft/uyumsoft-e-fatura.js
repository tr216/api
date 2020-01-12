var api=require('./api.js');


exports.downloadInboxInvoices=function(dbModel,eIntegratorDoc,callback){
	var isTestPlatform=eIntegratorDoc.url.indexOf('test')>-1?true:false;
	if(isTestPlatform) console.log('uyumsoft test platform');
	console.log('downloadInboxInvoices dbId:',dbModel._id);
	dbModel.e_invoices.find({eIntegrator:eIntegratorDoc._id, ioType:1}).sort({'issueDate.value':-1}).limit(1).exec((err,docs)=>{
		if(!err){
			var date2=new Date();
			var query={ 
				ExecutionStartDate:'2019-01-01T00:00:00.000Z', 
				ExecutionEndDate:date2.yyyymmdd() + 'T23:59:59.000Z', 
				PageIndex:0, 
				PageSize:10,

				OnlyNewestInvoices:false,
				SetTaken:false
				// InvoiceNumbers:[] , 
				// InvoiceIds: []
			}
			if(docs.length>0){
				var date1=mrutil.datefromyyyymmdd(docs[0].issueDate.value);
				console.log('Son tarih:',date1);

				date1=date1.addDays(-10);
				console.log('Date1:',date1);
				query.ExecutionStartDate=date1.yyyymmdd() + 'T00:00:00.000Z';
				// query.ExecutionEndDate=date2.yyyymmdd() + 'T23:59:59.000Z';
			}
			if(isTestPlatform) query.ExecutionStartDate=(new Date()).addDays(-1).yyyymmdd() + 'T00:00:00.000Z';
			//console.log('downloadInboxInvoices query:',query);
			
			var indirilecekFaturalar=[];

			function listeIndir(cb){
				api.getInboxInvoiceList(eIntegratorDoc,JSON.parse(JSON.stringify(query)),(err,result)=>{
					if(!err){
						console.log('inbox invoices pageIndex:',(result.page +1) + '/' + result.pageCount);
						if(result.docs.length>0){
							for(var i=0;i<result.docs.length;i++){
								if(result.docs[i].uuid!=undefined){
									indirilecekFaturalar.push(result.docs[i]);
								}
							}
							query.PageIndex++;
							if(query.PageIndex>=result.pageCount  || ( isTestPlatform && query.PageIndex==2)){ 
								console.log('downloadInboxInvoices.listeIndir sonu.');
								kaydetInboxInvoices(dbModel,eIntegratorDoc,Array.from(indirilecekFaturalar),(err)=>{
									indirilecekFaturalar=[];
									cb(null);
								});
							}else{
								kaydetInboxInvoices(dbModel,eIntegratorDoc,Array.from(indirilecekFaturalar),(err)=>{
									indirilecekFaturalar=[];
									setTimeout(()=>{
										listeIndir(cb);
										return;
									},1000);
								});
								
							}
						}else{
							cb(null)
						}
					}else{
						console.log('downloadInboxInvoices Hata:',err);
						cb(err);
					}
				}) 
			}


			listeIndir((err)=>{
				callback(err);
			});
			
		}else{
			callback(err);
		}
	});
}

function kaydetInboxInvoices(dbModel,eIntegratorDoc,indirilecekFaturalar,callback){
	var index=0;
	console.log('kaydetInboxInvoices indirilecekFaturalar.length:',indirilecekFaturalar.length);
	function faturaIndir(cb){
		if(index>=indirilecekFaturalar.length) return cb(null);
		dbModel.e_invoices.findOne({ioType:1,'uuid.value':indirilecekFaturalar[index].uuid},(err,doc)=>{
			if(!err){
				if(doc!=null){
					if(doc.invoiceStatus!=indirilecekFaturalar[index].status){
						doc.modifiedDate=new Date();
						doc.invoiceStatus=indirilecekFaturalar[index].status;
						doc.save((err,doc2)=>{
							//console.log('zaten indirilmis. statusu degistirildi. ',indirilecekFaturalar[index].uuid);
							index++;
							setTimeout(faturaIndir,0,cb);
							return;
						});
					}else{
						//console.log('zaten indirilmis. ',indirilecekFaturalar[index].uuid);
						index++;
						setTimeout(faturaIndir,0,cb);
						return;
					}
				}
			}
			console.log('before:')
			api.getInboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
				if(!err){
					var invoice=prepareInvoiceObject(result.doc.invoice);
					invoice['invoiceStatus']=indirilecekFaturalar[index].status;
					
					var files={html:'',pdf:null};

					api.getInboxInvoiceHtml(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultHtml)=>{
						if(!err){
							
							files.html=resultHtml.doc.html;
						}
						api.getInboxInvoicePdf(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultPdf)=>{
							if(!err){
								files.pdf=resultPdf.doc.pdf
								
							}else{
								console.log('api.getInboxInvoicePdf Error:',err);
							}
							insertInvoice(dbModel, eIntegratorDoc,1, invoice,files,(err)=>{
								if(err){
									console.log('insertInboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
									index++;
									setTimeout(faturaIndir,500,cb);
								}else{
									console.log('insertInboxInvoice OK uuid: ', indirilecekFaturalar[index].uuid);
									index++;
									setTimeout(faturaIndir,500,cb);
									
								}
								
							});
						});
					});
					
					
				}else{
					console.log('api.getInboxInvoice error: ',err);
					index++;
					setTimeout(faturaIndir,500,cb);
				}
			});
		})
		
	}
					
	faturaIndir((err)=>{
		callback(err);
	});
}


exports.downloadOutboxInvoices=function(dbModel,eIntegratorDoc,callback){
	var isTestPlatform=eIntegratorDoc.url.indexOf('test')>-1?true:false;
	if(isTestPlatform) console.log('uyumsoft test platform');
	console.log('downloadOutboxInvoices dbId:',dbModel._id);
	dbModel.e_invoices.find({eIntegrator:eIntegratorDoc._id, ioType:0}).sort({'issueDate.value':-1}).limit(1).exec((err,docs)=>{
		if(!err){
			var date2=new Date();
			var query={ 
				ExecutionStartDate:'2019-01-01T00:00:00.000Z', 
				ExecutionEndDate:date2.yyyymmdd() + 'T23:59:59.000Z', 
				PageIndex:0, 
				PageSize:10,

				OnlyNewestInvoices:false,
				SetTaken:false
				// InvoiceNumbers:[] , 
				// InvoiceIds: []
			}
			if(docs.length>0){
				var date1=mrutil.datefromyyyymmdd(docs[0].issueDate.value);
				console.log('Son tarih:',date1);

				date1=date1.addDays(-10);
				console.log('Date1:',date1);
				query.ExecutionStartDate=date1.yyyymmdd() + 'T00:00:00.000Z';
				// query.ExecutionEndDate=date2.yyyymmdd() + 'T23:59:59.000Z';
			}
			if(isTestPlatform) query.ExecutionStartDate=(new Date()).addDays(-1).yyyymmdd() + 'T00:00:00.000Z';
			//console.log('downloadOutboxInvoices query:',query);
			
			var indirilecekFaturalar=[];

			function listeIndir(cb){
				api.getOutboxInvoiceList(eIntegratorDoc,JSON.parse(JSON.stringify(query)),(err,result)=>{
					if(!err){
						console.log('Outbox invoices pageIndex:',(result.page +1) + '/' + result.pageCount);
						if(result.docs.length>0){
							for(var i=0;i<result.docs.length;i++){
								if(result.docs[i].uuid!=undefined){
									indirilecekFaturalar.push(result.docs[i]);
								}
							}
							query.PageIndex++;
							if(query.PageIndex>=result.pageCount  || ( isTestPlatform && query.PageIndex==2)){ 
								console.log('downloadOutboxInvoices.listeIndir sonu.');
								kaydetOutboxInvoices(dbModel,eIntegratorDoc,Array.from(indirilecekFaturalar),(err)=>{
									indirilecekFaturalar=[];
									cb(null);
								});
							}else{
								kaydetOutboxInvoices(dbModel,eIntegratorDoc,Array.from(indirilecekFaturalar),(err)=>{
									indirilecekFaturalar=[];
									setTimeout(()=>{
										listeIndir(cb);
										return;
									},1000);
								});
								
							}
						}else{
							cb(null)
						}
					}else{
						console.log('downloadOutboxInvoices Hata:',err);
						cb(err);
					}
				}) 
			}


			listeIndir((err)=>{
				callback(err);
			});
			
		}else{
			callback(err);
		}
	});
}

function kaydetOutboxInvoices(dbModel,eIntegratorDoc,indirilecekFaturalar,callback){
	var index=0;
	console.log('kaydetOutboxInvoices indirilecekFaturalar.length:',indirilecekFaturalar.length);
	function faturaIndir(cb){
		if(index>=indirilecekFaturalar.length) return cb(null);
		dbModel.e_invoices.findOne({ioType:0,'uuid.value':indirilecekFaturalar[index].uuid},(err,doc)=>{
			if(!err){
				if(doc!=null){
					if(doc.invoiceStatus!=indirilecekFaturalar[index].status){
						doc.modifiedDate=new Date();
						doc.invoiceStatus=indirilecekFaturalar[index].status;
						doc.save((err,doc2)=>{
							//console.log('zaten indirilmis. statusu degistirildi. ',indirilecekFaturalar[index].uuid);
							index++;
							setTimeout(faturaIndir,500,cb);
							return;
						});
					}else{
						//console.log('zaten indirilmis. ',indirilecekFaturalar[index].uuid);
						index++;
						setTimeout(faturaIndir,500,cb);
						return;
					}
				}
			}
			api.getOutboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
				if(!err){
					var invoice=prepareInvoiceObject(result.doc.invoice);
					invoice['invoiceStatus']=indirilecekFaturalar[index].status;
					
					var files={html:'',pdf:null};

					api.getOutboxInvoiceHtml(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultHtml)=>{
						if(!err){
							
							files.html=resultHtml.doc.html;
						}
						api.getOutboxInvoicePdf(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultPdf)=>{
							if(!err){
								files.pdf=resultPdf.doc.pdf
								
							}else{
								console.log('api.getOutboxInvoicePdf Error:',err);
							}
							insertInvoice(dbModel, eIntegratorDoc,0, invoice,files,(err)=>{
								if(err){
									console.error('insertOutboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
									index++;
									setTimeout(faturaIndir,500,cb);
								}else{
									console.log('insertOutboxInvoice OK uuid: ', indirilecekFaturalar[index].uuid);
									index++;
									setTimeout(faturaIndir,500,cb);
									
								}
								
							});
						});
					});
					
					
				}else{
					console.log('api.getOutboxInvoice error: ',err);
					index++;
					setTimeout(faturaIndir,500,cb);
				}
			});
		})
		
	}
					
	faturaIndir((err)=>{
		callback(err);
	});
}


function insertInvoice(dbModel,eIntegratorDoc,ioType,invoice,files,callback){
	try{
		dbModel.e_invoices.findOne({ioType:ioType,'uuid.value':invoice.uuid.value},(err,foundDoc)=>{
			if(!err){
				if(foundDoc==null){
					console.log('insertInvoice uuid:', invoice.uuid.value);
					
					var data={ioType:ioType,eIntegrator:eIntegratorDoc._id}
					data=Object.assign(data,invoice);
					var testInvoiceValidate=new dbModel.e_invoices(data);
					var err=epValidateSync(testInvoiceValidate);
					console.log('Error:',err);
					if(err) return callback({success: false, error: {code: err.name, message: err.message}});
					saveFiles(dbModel,invoice.ID.value, files,(err,resultFiles)=>{
						if(!err){
							if(resultFiles.html) data['html']=resultFiles.html;
							if(resultFiles.pdf) data['pdf']=resultFiles.pdf;
						}
						var newInvoice=new dbModel.e_invoices(data);
						newInvoice.save((err,newDoc)=>{
							if(!err){
								callback(null,newDoc);
							}else{
								callback(err);
							}
						})
					});
					
					
				}else{
					console.log('insertInvoice zaten var');
					callback(null);
				}
				
			}else{
				console.error('insertInvoice HATA:',err);
				callback(err);
			}
		});

	}catch(tryErr){
		callback(tryErr);
	}
}

function saveFiles(dbModel,fileName,files,cb){
	var resultFiles={html:'',pdf:''}

	saveFileHtml(dbModel,fileName,files,(err,html)=>{
		if(!err) resultFiles.html=html;
		saveFilePdf(dbModel,fileName,files,(err,pdf)=>{
			if(!err) resultFiles.pdf=pdf;
			cb(null,resultFiles);
		})
	});
}

function saveFileHtml(dbModel,fileName,files,cb){
	if(files.html){
		var newFile=new dbModel.files({
			name:fileName,
			type:'text/html',
			extension:'html',
			data:files.html
		});
		newFile.save((err,doc)=>{
			if(!err){
				cb(null,doc._id);
			}else{
				cb(err);
			}
		})
	}else{
		cb(null,null)
	}
}

function saveFilePdf(dbModel,fileName,files,cb){
	if(files.pdf){
		var newFile=new dbModel.files({
			name:fileName,
			type:'application/pdf',
			extension:'pdf',
			data:files.pdf
		});
		newFile.save((err,doc)=>{
			if(!err){
				cb(null,doc._id);
			}else{
				cb(err);
			}
		})
	}else{
		cb(null,null)
	}
}

function renameKey(key){
	switch(key){
		case 'UUID': return 'uuid';
		case 'ID': return 'ID';
		case 'URI': return 'URI';
		case '$': return 'attr';
	}
	if(key.length<2) return key;
	key=key[0].toLowerCase() + key.substr(1,key.length-1);
	if(key.substr(key.length-2,2)=='ID' && key.length>2){
		key=key.substr(0,key.length-2) + 'Id';
	}
	return key;
}

function renameInvoiceObjects(obj,renameFunction){
	
	if(Array.isArray(obj)){
		var newObj=[];
		for(var i=0;i<obj.length;i++){
			newObj.push(renameInvoiceObjects(obj[i],renameFunction));
		}
		return newObj;
	}else if (typeof obj==='object'){
		var newObj={};

		var keys=Object.keys(obj);
		keys.forEach((key)=>{
			var newKey=renameFunction(key);
			if((Array.isArray(obj[key]) || typeof obj==='object') && (key!='$')){
				newObj[newKey]=renameInvoiceObjects(obj[key],renameFunction);
			}else{
				newObj[newKey]=obj[key];
			}
		});
		return newObj;
	}else{
		return obj;
	}
}

function deleteEmptyObject(obj,propertyName){
	
	if(Array.isArray(obj)){
		var newObj=[];
		for(var i=0;i<obj.length;i++){
			newObj.push(deleteEmptyObject(obj[i],propertyName));
		}
		return newObj;
	}else if (typeof obj==='object'){
		var newObj={};

		if(obj[propertyName]!=undefined){
			if(JSON.stringify(obj[propertyName])===JSON.stringify({})){
				obj[propertyName]=undefined;
				delete obj[propertyName];
			}
		}
		
		
		var keys=Object.keys(obj);
		keys.forEach((key)=>{
			if(Array.isArray(obj[key]) || typeof obj==='object'){
				newObj[key]=deleteEmptyObject(obj[key],propertyName);
			}else{
				newObj[key]=obj[key];
			}
		})
		
		return newObj;
	}else{
		return obj;
	}
}

function prepareInvoiceObject(invoice){
	invoice=mrutil.deleteObjectProperty(invoice,'xmlns*');
	invoice=deleteEmptyObject(invoice,'$');
	invoice=renameInvoiceObjects(invoice,renameKey);
	return invoice;
}

exports.downloadEInvoiceUsers=function(callback){
	
	var index=0;
	var hataDeneme=0;
	var indirilecekFaturalar=[];
	var query={pagination:{pageIndex:0, pageSize:300}}
	function listeIndir(cb){
		api.getEInvoiceUsers({url:'https://efatura.uyumsoft.com.tr/Services/Integration',username:'Alitek_WebServis',password:'AyXEZR%k'},query,(err,result)=>{
			if(!err){
				console.log('einvoice_users pageIndex:',(result.page +1) + '/' + result.pageCount);
				if(result.docs.length>0){
					insertEInvoiceUsers(result.docs,(err)=>{
						if(err){
							console.log('insertEInvoiceUsers Error:',err);
						}
						query.pagination.pageIndex++;
						if(query.pagination.pageIndex>=result.pageCount){ 
							cb(null)
						}else{
							setTimeout(listeIndir,3000,cb);
						}
					})
					
				}else{
					cb(null)
				}
			}else{
				console.log('einvoice_users error:',err);
				if(hataDeneme<10){
					hataDeneme++;
					setTimeout(listeIndir,3000,cb);
				}else{
					cb(err);
				}
				
				
			}
		});
		
	}


	listeIndir((err)=>{
		callback(err);
	});

}

function insertEInvoiceUsers(docs,callback){
	var index=0;
	function kaydet(cb){
		if(index>=docs.length) return cb(null);
		db.einvoice_users.findOne({identifier:docs[index].identifier,postboxAlias:docs[index].postboxAlias},(err,foundDoc)=>{
			if(!err){
				if(foundDoc==null){
					var newDoc=new db.einvoice_users({
						identifier:docs[index].identifier,
						postboxAlias:docs[index].postboxAlias,
						title:docs[index].title,
						type:docs[index].type,
						systemCreateDate:docs[index].systemCreateDate,
						firstCreateDate:docs[index].firstCreateDate,
						enabled:docs[index].enabled
					});
					newDoc.save((err,newDoc2)=>{
						if(!err){
							console.log('E-Fatura Mukellefi eklendi:' + newDoc2.title);
							index++;
							setTimeout(kaydet,500,cb);
						}else{
							cb(err);
						}
					});
				}else{
					if(foundDoc.postboxAlias===docs[index].postboxAlias && foundDoc.title===docs[index].title && foundDoc.enabled===docs[index].enabled){
						
						index++;
						setTimeout(kaydet,500,cb);
					}else{
						
						foundDoc.postboxAlias=docs[index].postboxAlias;
						foundDoc.title=docs[index].title;
						foundDoc.type=docs[index].type;
						foundDoc.systemCreateDate=docs[index].systemCreateDate;
						foundDoc.firstCreateDate=docs[index].firstCreateDate;
						foundDoc.enabled=docs[index].enabled;

						foundDoc.save((err,newDoc2)=>{
							if(!err){
								console.log('E-Fatura Mukellefi duzeltildi:' + newDoc2.title);
								index++;
								setTimeout(kaydet,500,cb); 
							}else{
								cb(err);
							}
						});
					}
					
				}
			}else{
				cb(err);
			}
		})
	}

	kaydet((err)=>{
		callback(err);
	});
}

exports.sendToGib=function(dbModel,eInvoice,callback){
	try{
		var options=JSON.parse(JSON.stringify(eInvoice.eIntegrator));
		var isTestPlatform=false;
		if(options.url.indexOf('test')>-1) isTestPlatform=true;

		var title = eInvoice.accountingCustomerParty.party.partyName.name;
		var vergiNo='';
		var alias='defaultpk';
		var email='';

		if(isTestPlatform){
			eInvoice.accountingSupplierParty.party.partyIdentification.forEach((e)=>{
				var schemeID=(e.ID.attr.schemeID || '').toUpperCase();
				if(schemeID=='VKN' || schemeID=='TCKN'){
					e.ID.value='9000068418';
					return;
				}
			});
			if( eInvoice.profileId.value!='EARSIVFATURA'){
				eInvoice.accountingCustomerParty.party.partyIdentification.forEach((e)=>{
					var schemeID=(e.ID.attr.schemeID || '').toUpperCase();
					if(schemeID=='VKN' || schemeID=='TCKN'){
						e.ID.value='9000068418';
						return;
					}
				});
			}
		}

		eInvoice.accountingCustomerParty.party.partyIdentification.forEach((e)=>{
			var schemeID=(e.ID.attr.schemeID || '').toUpperCase();
			if(schemeID=='VKN' || schemeID=='TCKN'){
				vergiNo=e.ID.value;
				return;
			}
		});

		if(eInvoice.accountingCustomerParty.party.contact.electronicMail.value.indexOf('@')>-1){
			email=eInvoice.accountingCustomerParty.party.contact.electronicMail.value;
			if(isTestPlatform) email='alitek@gmail.com';
		}

		
		findEInvoiceUserPostBoxAlias(vergiNo,eInvoice.profileId.value,(err,postboxAlias)=>{
			if(!err) alias=postboxAlias;

			var invoiceXml=mrutil.e_invoice2xml(eInvoice,'Invoice');
			
			invoiceXml=invoiceXml.replace('<Invoice','<s:Invoice');
			invoiceXml=invoiceXml.replace('</Invoice','</s:Invoice');
			var xml='<s:invoices>';
			xml +='<s:InvoiceInfo LocalDocumentId="' + eInvoice.localDocumentId + '">';
			// xml +'<s:Scenario>eInvoice</s:Scenario>';
			if(eInvoice.profileId.value!='EARSIVFATURA'){
				xml +'<s:Scenario>1</s:Scenario>';
			}else{
				xml +'<s:Scenario>2</s:Scenario>';
			}
			
			if(!isTestPlatform || eInvoice.profileId.value=='EARSIVFATURA'){
			// if(!isTestPlatform){
				xml +='<s:TargetCustomer Title="' + title + '" VknTckn="' + vergiNo + '" Alias="' + alias + '" />';
			}else{
				xml +='<s:TargetCustomer Title="' + title + '" VknTckn="9000068418" Alias="defaultpk" />';
			}
			
			// xml +='<s:Invoice>' + invoiceXml + '</s:Invoice>';
			xml +='' + invoiceXml + '';
			xml +='<s:EArchiveInvoiceInfo DeliveryType="Electronic" />';
			xml +='</s:InvoiceInfo>';
			xml +='</s:invoices>';

			console.log('before: api.sendInvoice(options,xml,(err,result)=>{');
			api.sendInvoice(options,xml,(err,result)=>{
				if(!err){

					//console.log('sendToGib result:',result);
					callback(null,eInvoice);
				}else{
					//console.log('sendToGib error:',err);
					callback(err);
				}

			});
		});
	}catch(tryErr){
		callback(tryErr);
	}
}

function findEInvoiceUserPostBoxAlias(vergiNo,profileId,callback){
	try{
		if(profileId=='EARSIVFATURA') return callback(null,'defaultpk');

		db.einvoice_users.findOne({identifier:vergiNo,enabled:true},(err,doc)=>{
			if(!err){
				if(doc!=null){
					callback(null,doc.postboxAlias);
				}else{
					callback(null,'defaultpk');
				}
				
			}else{
				callback(err);
			}
		});

	}catch(tryErr){
		callback(tryErr);
	}
}


exports.sendDocumentResponse=function(responseStatus, dbModel,eInvoice,callback){
	try{
		var options=JSON.parse(JSON.stringify(eInvoice.eIntegrator));
		var isTestPlatform=false;
		if(options.url.indexOf('test')>-1) isTestPlatform=true;
		var query={DocumentResponseInfo:[{InvoiceId:eInvoice.uuid.value,ResponseStatus:responseStatus}]}

		api.sendDocumentResponse(options,query,(err,result)=>{
				if(!err){

					console.log('sendDocumentResponse result:',result);
					callback(null,eInvoice);
				}else{
					console.log('sendDocumentResponse error:',err);
					callback(err);
				}

			});
	}catch(tryErr){
		callback(tryErr);
	}
}