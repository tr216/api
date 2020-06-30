module.exports = function(activeDb, member, req, res, callback) {
	if(req.params.param1==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});

	switch(req.method){
		case 'GET':
			switch(req.params.param1.lcaseeng()){
				
				case 'inboxinvoicelist':
				return getInvoiceList(1,activeDb,member,req,res,callback);
				break;
				case 'outboxinvoicelist':
				return getInvoiceList(0,activeDb,member,req,res,callback);
				break;
				case 'invoice':
				return getInvoice(activeDb,member,req,res,callback);
				break;
				case 'invoiceview':
				return invoiceView(activeDb,member,req,res,callback);
				break;
				case 'invoicepdf':
				return invoicePdf(activeDb,member,req,res,callback);
				break;
				case 'invoicexmlxslt':
				case 'invoicexml':
				case 'invoicexslt':
				case 'invoicexsltxml':
				return getInvoiceXmlXslt(activeDb,member,req,res,callback);
				break;
				case 'einvoiceuserlist':
				return getEInvoiceUserList(activeDb,member,req,res,callback);
				case 'errors':
				return getErrors(activeDb,member,req,res,callback);

				default:
				return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
				break;
			}
		break;
		case 'POST':
			switch(req.params.param1.lcaseeng()){
				case 'transfer':
					if(req.params.param2.lcaseeng()=='import'){
						transferImport(activeDb,member,req,res,callback)
					}else if(req.params.param2.lcaseeng()=='export'){
						return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
					}else{
						return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
					}
				break;
				case 'sendtogib':
					return sendToGib(activeDb,member,req,res,callback);
				case 'approve':
					return approveDeclineInvoice('approve', activeDb,member,req,res,callback);
				case 'decline':
					return approveDeclineInvoice('decline', activeDb,member,req,res,callback);
				case 'saveinboxinvoice':
				case 'saveoutboxinvoice':
				case 'invoice':
					return post(activeDb,member,req,res,callback);
				case 'findgtipno':
				return findGTIPNO(activeDb,member,req,res,callback);
				case 'importoutboxinvoice':
					return importOutboxInvoice(activeDb,member,req,res,callback);
				default:
					return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
				break;
			}

		break;
		case 'PUT':

			switch(req.params.param1.lcaseeng()){
				
				case 'saveinboxinvoice':
				case 'saveoutboxinvoice':
				case 'invoice':
					return put(activeDb,member,req,res,callback);
				
				default:
					return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
				break;
			}
		break;
		default:
		return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
		break;
	}
}

function findGTIPNO(activeDb,member,req,res,callback){
	var data = req.body || {};
	if(data.invoiceLine==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'invoiceLine elemani bulunamadi'}});
	if(!Array.isArray(data.invoiceLine)) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'invoiceLine array olmalidir'}});

	// data.invoiceLine.forEach((line)=>{

	// });
	callback({success: true,data:'ok'});
}

function getErrors(activeDb,member,req,res,callback){
	var _id= req.params.param2 || req.query._id || '';
	var select='_id profileId ID invoiceTypeCode localDocumentId issueDate ioType eIntegrator invoiceErrors localErrors invoiceStatus localStatus';
	
	if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
	activeDb.invoices.findOne({_id:_id},select).exec((err,doc)=>{
		if(dberr(err,callback))
			if(dbnull(doc,callback)){
				var data=doc.toJSON();
				callback({success: true,data: data});
			}
	});
}

function post(activeDb,member,req,res,callback){
	var data = req.body || {};
	data._id=undefined;
	
	data=mrutil.amountValueFixed2Digit(data,'');
	var newDoc = new activeDb.invoices(data);
	var err=epValidateSync(newDoc);
	if(err) return callback({success: false, error: {code: err.name, message: err.message}});
	newDoc.uuid.value=uuid.v4();
	newDoc=calculateInvoiceTotals(newDoc);
	activeDb.e_integrators.findOne({_id:newDoc.eIntegrator},(err,eIntegratorDoc)=>{
		if(dberr(err,callback)){
			if(eIntegratorDoc==null) return callback({success: false,error: {code: 'ENTEGRATOR', message: 'Faturada entegrator bulanamadi.'}});
			documentHelper.yeniFaturaNumarasi(activeDb,eIntegratorDoc,newDoc,(err,newDoc)=>{
				newDoc.save(function(err, newDoc2) {
					if(dberr(err,callback)){
						callback({success:true,data:newDoc2});
					}
				});  
			});
		}
	});
}

function importOutboxInvoice(activeDb,member,req,res,callback){
	var data = req.body || {};
	
	if(!data.files) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'files elemani bulunamadi'}});
	if(!Array.isArray(data.files)) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'files elemani array olmak zorundadir'}});
	if(data.files.length==0) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'files elemani bos olamaz'}});
	data.files.forEach((e)=>{
		if(e.base64Data){
			e['data']=atob(e.base64Data);
		}
	});
	

	fileImporter.run(activeDb,(data.fileImporter || ''),data,(err,results)=>{
		if(!err){
			documentHelper.findDefaultEIntegrator(activeDb,(data.eIntegrator || ''),(err,eIntegratorDoc)=>{
				if(!err){
					documentHelper.insertEInvoice(activeDb,eIntegratorDoc,results,(err)=>{
						if(!err){
							callback({success:true,data:'ok'})
						}else{
							callback({success:false,error:{code:err.code || err.name || 'ERROR',message:err.message }})
						}
					})
				}else{
					callback({success:false,error:{code:err.code || err.name || 'ERROR',message:err.message }})
				}
			});
			
		}else{
			callback({success:false,error:{code:err.code || err.name || 'ERROR',message:err.message }})
		}
	});
	
}

function put(activeDb,member,req,res,callback){
	eventLog('put buraya geldi');
	if(req.params.param2==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
	var data = req.body || {};
	data._id = req.params.param2;
	data.modifiedDate = new Date();
	eventLog('put sonra buraya geldi');
	activeDb.invoices.findOne({ _id: data._id},(err,doc)=>{
		if (!err) {
			if(doc==null){
				eventLog('doc==null');
				callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
			}else{
				data=mrutil.amountValueFixed2Digit(data,'');
				var doc2 = Object.assign(doc, data);
				var newDoc = new activeDb.invoices(doc2);
				var err=epValidateSync(newDoc);
				if(err) return callback({success: false, error: {code: err.name, message: err.message}});
				newDoc=calculateInvoiceTotals(newDoc);
				newDoc.save(function(err, newDoc2) {
					if(dberr(err,callback)){
						eventLog('After taxtotal:',doc.taxTotal);
						callback({success: true,data: newDoc2});
					}
				});
			   
			}
		}else{
			eventLog('put error:',err);
			callback({success: false, error: {code: err.name, message: err.message}});
		}
	});
}

function calculateInvoiceTotals(invoice){
	var bSatirdaVergiVar=false;
	if(invoice.invoiceLine!=undefined){
	    if(invoice.invoiceLine.length>0){
	        invoice.invoiceLine.forEach(function(line){
	            if(line.taxTotal!=undefined)
	                if(line.taxTotal.taxAmount.value>0){
	                    bSatirdaVergiVar=true;
	                }
	        });
	    }
	    invoice.lineCountNumeric.value=invoice.invoiceLine.length;
	}
    if(bSatirdaVergiVar){
        invoice.taxTotal=[];
        invoice.withholdingTaxTotal=[];
        invoice.invoiceLine.forEach(function(line){
            if(line.taxTotal!=undefined)
                if(line.taxTotal.taxAmount.value>0 && line.taxTotal.taxSubtotal.length>0){
                    var bAyniVergiTuruBulundu=false;
                    invoice.taxTotal.forEach(function(e){
                        if(e.taxSubtotal.length>0)
                            if(e.taxSubtotal[0].percent==line.taxTotal.taxSubtotal[0].percent && e.taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value==line.taxTotal.taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value){
                                e.taxAmount.value +=line.taxTotal.taxAmount.value;
                                e.taxSubtotal[0].taxableAmount.value += line.taxTotal.taxSubtotal[0].taxableAmount.value;
                                e.taxSubtotal[0].taxAmount.value += line.taxTotal.taxSubtotal[0].taxAmount.value;
                                bAyniVergiTuruBulundu=true;
                                return;
                            }
                    });
                    if(bAyniVergiTuruBulundu==false){
                        invoice.taxTotal.push(JSON.parse(JSON.stringify(line.taxTotal)))
                    }
                }
            if(line.withholdingTaxTotal!=undefined)
                if(line.withholdingTaxTotal.length>0)
                    if(line.withholdingTaxTotal[0].taxAmount.value>0 && line.withholdingTaxTotal[0].taxSubtotal.length>0){
                        var bAyniVergiTuruBulundu=false;
                        invoice.withholdingTaxTotal.forEach(function(e){
                            if(e.taxSubtotal.length>0)
                                if(e.taxSubtotal[0].percent==line.withholdingTaxTotal[0].taxSubtotal[0].percent && e.taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value==line.withholdingTaxTotal[0].taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value){
                                    e.taxAmount.value +=line.withholdingTaxTotal[0].taxAmount.value;
                                    e.taxSubtotal[0].taxableAmount.value += line.withholdingTaxTotal[0].taxSubtotal[0].taxableAmount.value;
                                    e.taxSubtotal[0].taxAmount.value += line.withholdingTaxTotal[0].taxSubtotal[0].taxAmount.value;
                                    bAyniVergiTuruBulundu=true;
                                    return;
                                }
                        });
                        if(bAyniVergiTuruBulundu==false){
                            invoice.withholdingTaxTotal.push(JSON.parse(JSON.stringify(line.withholdingTaxTotal[0])))
                        }
                    }
        });
    }

    var vergiToplam=0;
    invoice.taxTotal.forEach((e)=>{
    	vergiToplam +=e.taxAmount.value;
    })
	var tevkifatToplam=0;
    invoice.withholdingTaxTotal.forEach((e)=>{
    	tevkifatToplam +=e.taxAmount.value;
    })

    var toplamIndirim=0;
    var toplamMasraf=0;
    invoice.allowanceCharge.forEach((e)=>{
    	if(e.chargeIndicator.value){
    		toplamMasraf +=e.amount.value;
    	}else{
    		toplamIndirim +=e.amount.value;
    	}
    })

    invoice.legalMonetaryTotal={
    	lineExtensionAmount:{value:0},
    	allowanceTotalAmount:{value:toplamIndirim},
    	chargeTotalAmount:{value:toplamMasraf},
    	taxExclusiveAmount:{value:0},
    	taxInclusiveAmount:{value:0},
    	payableRoundingAmount:{value:0},
    	payableAmount:{value:0},
    }


    if(invoice.invoiceLine!=undefined){
	    invoice.invoiceLine.forEach(function(line){
	    	invoice.legalMonetaryTotal.lineExtensionAmount.value += line.lineExtensionAmount.value;
	    });
	}
	invoice.legalMonetaryTotal.taxExclusiveAmount.value=invoice.legalMonetaryTotal.lineExtensionAmount.value - toplamIndirim + toplamMasraf;
	invoice.legalMonetaryTotal.taxInclusiveAmount.value=invoice.legalMonetaryTotal.taxExclusiveAmount.value + vergiToplam - tevkifatToplam;
	invoice.legalMonetaryTotal.payableRoundingAmount.value=invoice.legalMonetaryTotal.taxInclusiveAmount.value;
	invoice.legalMonetaryTotal.payableAmount.value=invoice.legalMonetaryTotal.taxInclusiveAmount.value;


	return invoice;
}
function transferImport(activeDb,member,req,res,callback){
	
	activeDb.e_integrators.find({passive:false,'localConnectorImportInvoice.localConnector':{$ne:null}}).populate(['localConnectorImportInvoice.localConnector']).exec((err,docs)=>{
		if (dberr(err,callback)) {
			if(docs.length==0){
				return callback({success:false,error:{code:'NOT_DEFINED',message:'Local connectoru tanimlanmis aktif bir entegrator bulunmamaktadir.'}})
			}
			var index=0;
			var kuyrugaAlinan=0;
			var zatenKuyrukta=0;
			

			function pushTask(cb){
				if(index>=docs.length){
					cb(null);
				}else{
					activeDb.tasks.findOne({taskType:'connector_import_einvoice',collectionName:'e_integrators',documentId:docs[index]._id, status:{$in:['running','pending']}},(err,doc)=>{
						if (dberr(err,callback)) {
							if(doc==null){
								var taskdata={taskType:'connector_import_einvoice',collectionName:'e_integrators',documentId:docs[index]._id,document:docs[index]}
								taskHelper.newTask(activeDb,taskdata,(err,taskDoc)=>{
									if(!err){
										switch(taskDoc.status){
											case 'running':
												docs[index].localConnectorImportInvoice['status']='transferring';
												break;
											case 'pending':
												docs[index].localConnectorImportInvoice['status']='pending';
												break;
											case 'completed':
												docs[index].localConnectorImportInvoice['status']='transferred';
												break;
											case 'error':
												docs[index].localConnectorImportInvoice['status']='error';
												break;
											default:
												 docs[index].localConnectorImportInvoice['status']='';
												 break;
										}
										docs[index].save((err,newDoc)=>{
											if(!err){
												kuyrugaAlinan++;
												index++;
												setTimeout(pushTask,0,cb);
											}else{
												cb(err);
												// index++;
												// setTimeout(pushTask,0,cb);
											}
										});
									}else{
										cb(err);
										// index++;
										// setTimeout(pushTask,0,cb);
									}
								});
							}else{
								zatenKuyrukta++;
								index++;
								setTimeout(pushTask,0,cb);
							}
						}
					});
					
				}
			}
			pushTask((err)=>{
				if(dberr(err,callback)){
					if(kuyrugaAlinan==0 && zatenKuyrukta>0){
						callback({success:false,error:{code:'ALREADY_IN_PROCESSING',message:'Islem gorev yoneticisine alinmis. Birazdan tamamlanir.'}})
					}else{
						callback({success: true,data:'Gorev yoneticisine ' + kuyrugaAlinan.toString() + ' adet gorev alindi'});
					}
					
				}
			});
		}
	})
}

function getInvoiceList(ioType,activeDb,member,req,res,callback){
	var options={page: (req.query.page || 1), 
		populate:[
		{path:'eIntegrator',select:'_id eIntegrator name username'}
		],
		limit:10
		,
		select:'_id eIntegrator profileId ID uuid issueDate issueTime invoiceTypeCode documentCurrencyCode lineCountNumeric localDocumentId pricingExchangeRate accountingCustomerParty accountingSupplierParty legalMonetaryTotal taxTotal withholdingTaxTotal invoiceStatus invoiceErrors localStatus localErrors',
		sort:{'issueDate.value':'desc' , 'ID.value':'desc'}
	}

	if((req.query.pageSize || req.query.limit)){
		options['limit']=req.query.pageSize || req.query.limit;
	}

	var filter = {ioType:ioType}
	
	if(req.query.eIntegrator){
		filter['eIntegrator']=req.query.eIntegrator;
	}
	if((req.query.ID || '')!=''){
		filter['ID.value']={ $regex: '.*' + req.query.ID + '.*' ,$options: 'i' };
	}
	if((req.query.invoiceNo || '')!=''){
		if(filter['$or']==undefined) filter['$or']=[];
		filter['$or'].push({'ID.value':{ '$regex': '.*' + req.query.invoiceNo + '.*' , '$options': 'i' }})
		filter['$or'].push({'localDocumentId':{ '$regex': '.*' + req.query.invoiceNo + '.*' ,'$options': 'i' }})
	}
	if(req.query.invoiceStatus){
		filter['invoiceStatus']=req.query.invoiceStatus;
	}
	if((req.query.profileId || '')!=''){
		filter['profileId.value']=req.query.profileId;
	}
	if((req.query.invoiceTypeCode || '')!=''){
		filter['invoiceTypeCode.value']=req.query.invoiceTypeCode;
	}

	if((req.query.documentCurrencyCode || '')!=''){
		filter['documentCurrencyCode.value']=req.query.documentCurrencyCode;
	}

	if((req.query.date1 || '')!=''){
		filter['issueDate.value']={$gte:req.query.date1};
	}

	if((req.query.date2 || '')!=''){
		if(filter['issueDate.value']){
			filter['issueDate.value']['$lte']=req.query.date2;
		}else{
			filter['issueDate.value']={$lte:req.query.date2};
		}
	}
	
	activeDb.invoices.paginate(filter,options,(err, resp)=>{
		if (dberr(err,callback)) {
			var liste=[]
			resp.docs.forEach((e,index)=>{

				var obj={}
				obj['_id']=e['_id'];
				obj['eIntegrator']=e['eIntegrator'];
				obj['ioType']=e['ioType'];
				obj['profileId']=e['profileId'].value;
				obj['ID']=e.ID.value;
				obj['uuid']=e['uuid'].value;
				obj['issueDate']=e['issueDate'].value;
				obj['issueTime']=e['issueTime'].value;
				obj['invoiceTypeCode']=e['invoiceTypeCode'].value;
				
				obj['accountingParty']={title:'',vknTckn:''}
				if(ioType==0){
					obj['accountingParty']['title']=e.accountingCustomerParty.party.partyName.name.value || (e.accountingCustomerParty.party.person.firstName.value + ' ' + e.accountingCustomerParty.party.person.familyName.value);;
					e.accountingCustomerParty.party.partyIdentification.forEach((e2)=>{
						var schemeID='';
						if(e2.ID.attr!=undefined){
							schemeID=(e2.ID.attr.schemeID || '').toLowerCase();
						}
						if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
							obj['accountingParty']['vknTckn']=e2.ID.value || '';
							return;
						}
					});
				}else{
					obj['accountingParty']['title']=e.accountingSupplierParty.party.partyName.name.value || (e.accountingSupplierParty.party.person.firstName.value + ' ' + e.accountingSupplierParty.party.person.familyName.value);
					e.accountingSupplierParty.party.partyIdentification.forEach((e2)=>{
						var schemeID='';
						if(e2.ID.attr!=undefined){
							schemeID=(e2.ID.attr.schemeID || '').toLowerCase();
						}
						
						if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
							obj['accountingParty']['vknTckn']=e2.ID.value || '';
							return;
						}

					});
				}
				obj['payableAmount']=e['legalMonetaryTotal'].payableAmount.value;
				obj['taxExclusiveAmount']=e['legalMonetaryTotal'].taxExclusiveAmount.value;
				obj['taxSummary']={
					vat1:0,vat8:0,vat18:0,
					vat0TaxableAmount:0,
					vat1TaxableAmount:0,
					vat8TaxableAmount:0,
					vat18TaxableAmount:0
				}
				var taxTotal=0,withholdingTaxTotal=0;
				e['taxTotal'].forEach((e2)=>{
					taxTotal=taxTotal + e2.taxAmount.value;
					e2.taxSubtotal.forEach((e3)=>{
						switch(e3.percent.value){
							case 1:
								obj['taxSummary'].vat1+=e3.taxAmount.value;
								obj['taxSummary'].vat1TaxableAmount+=e3.taxableAmount.value;
							break;
							case 8:
								obj['taxSummary'].vat8+=e3.taxAmount.value;
								obj['taxSummary'].vat8TaxableAmount+=e3.taxableAmount.value;
							break;
							case 18:
								obj['taxSummary'].vat18+=e3.taxAmount.value;
								obj['taxSummary'].vat0TaxableAmount+=e3.taxableAmount.value;
							break;
							default:
								obj['taxSummary'].vat18TaxableAmount+=e3.taxableAmount.value;
							break;
						}
					});
				});
				e['withholdingTaxTotal'].forEach((e2)=>{
					withholdingTaxTotal=withholdingTaxTotal + e2.taxAmount.value;
				});
				obj['taxTotal']=taxTotal;
				obj['withholdingTaxTotal']=withholdingTaxTotal;
				obj['documentCurrencyCode']=e['documentCurrencyCode'].value;
				obj['exchangeRate']=e['pricingExchangeRate'].calculationRate.value;

				obj['lineCountNumeric']=e['lineCountNumeric'].value;
				obj['localDocumentId']=e['localDocumentId'];
				obj['invoiceStatus']=e['invoiceStatus'];
				obj['invoiceErrors']=e['invoiceErrors'];
				obj['localStatus']=e['localStatus'];
				obj['localErrors']=e['localErrors'];
				

				liste.push(obj);
			});
			resp.docs=liste;
			callback({success: true,data: resp});
		} else {
			errorLog('error:',err);
		}
	});
}

function getInvoice(activeDb,member,req,res,callback){
	var _id= req.params.param2 || req.query._id || '';
	var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false;
	var select='-additionalDocumentReference';
	if(includeAdditionalDocumentReference==true) select='';
	
	if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
	activeDb.invoices.findOne({_id:_id},select).exec((err,doc)=>{
		if(dberr(err,callback))
			if(dbnull(doc,callback)){
				var data=doc.toJSON();
				callback({success: true,data: data});
			}
	});
}

function invoiceView(activeDb,member,req,res,callback){
	var _id= req.params.param2 || req.query._id || '';
	if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
	activeDb.invoices.findOne({_id:_id}).populate(['html']).exec((err,doc)=>{
		if(dberr(err,callback))
			if(dbnull(doc,callback)){
				callback({file: doc.html});
			}
		});
}

function invoicePdf(activeDb,member,req,res,callback){
	var _id= req.params.param2 || req.query._id || '';
	if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
	activeDb.invoices.findOne({_id:_id}).populate(['pdf']).exec((err,doc)=>{
		if(dberr(err,callback))
			if(dbnull(doc,callback)){
				
				callback({file: doc.pdf});
			}
		});
}

function getInvoiceXmlXslt(activeDb,member,req,res,callback){
	var _id= req.params.param2 || req.query._id || '';
	if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
	activeDb.invoices.findOne({_id:_id},(err,doc)=>{
		if(dberr(err,callback))
			if(dbnull(doc,callback)){
				var invoice=doc.toJSON();
				var xml=btoa(mrutil.e_invoice2xml(invoice));
				var xslt=mrutil.e_invoiceXslt(invoice);
				callback({success: true,data: {xml:xml,xslt:xslt}});
			}
		});
}

function getEInvoiceUserList(activeDb,member,req,res,callback){
	var options={page: (req.query.page || 1), 
		limit:10
	}

	if((req.query.pageSize || req.query.limit)){
		options['limit']=req.query.pageSize || req.query.limit;
	}

	var filter = {}
	
	var vkn=req.query.vkn || req.query.tckn || req.query.vknTckn || req.query.taxNumber || req.query.identifier || '';

	if(vkn!=''){
		filter['identifier']={ '$regex': '.*' + vkn + '.*' ,'$options': 'i' };
	}
	if((req.query.title || '')!=''){
		filter['title']={ '$regex': '.*' + req.query.title + '.*' ,'$options': 'i' };
	}
	if(req.query.enabled){
		filter['enabled']=Boolean(req.query.enabled);
	}
	if((req.query.postboxAlias || '')!=''){
		filter['postboxAlias']={ $regex: '.*' + req.query.postboxAlias + '.*' ,$options: 'i' };
	}
	
	
	db.einvoice_users.paginate(filter,options,(err, resp)=>{
		if (dberr(err,callback)) {
			callback({success: true,data: resp});
		} 
	});
}

function sendToGib(activeDb,member,req,res,callback){
	var data = req.body || {};
	if(data.list==undefined){
		return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
	}
	var populate={
		path:'eIntegrator'
		//select:'_id eIntegrator name url username password firmNo invoicePrefix dispatchPrefix postboxAlias senderboxAlias passive'
	}

	var idList=[];
	data.list.forEach((e)=>{
		if(e && typeof e === 'object' && e.constructor === Object){
			if(e._id!=undefined){
				idList.push(e._id);
			}else if(e.id!=undefined){
				idList.push(e.id);
			}else{
				return callback({success: false, error: {code: 'ERROR', message: 'list is wrong.'}});
			}
		}else{
			idList.push(e);
		}
	});
	var filter={invoiceStatus:{$in:['Draft','Error']},_id:{$in:idList}};

	activeDb.invoices.find(filter).populate(populate).exec((err,docs)=>{
		if (dberr(err,callback)) {
			var index=0;

			function pushTask(cb){
				if(index>=docs.length){
					cb(null);
				}else{
					
					var taskdata={taskType:'einvoice_send_to_gib',collectionName:'invoices',documentId:docs[index]._id,document:docs[index].toJSON()}
					taskHelper.newTask(activeDb, taskdata,(err,taskDoc)=>{
						if(!err){
							switch(taskDoc.status){
								case 'running':
									docs[index].status='Processing';
									break;
								case 'pending':
									docs[index].invoiceStatus='Pending';
									break;
								case 'completed':
									docs[index].invoiceStatus='Processing';
									break;
								case 'error':
									docs[index].invoiceStatus='Error';
									break;
								default:
									 //docs[index].invoiceStatus='';
									 break;
							}
							docs[index].save((err,newDoc)=>{
								if(!err){
									index++;
									setTimeout(pushTask,0,cb);
								}else{
									cb(err);
								}
							});
						}else{
							cb(err);
						}
					});
				}
			}
			pushTask((err)=>{
				if(dberr(err,callback)){
					var resp=[]
					// for(var i=0;i<docs.length;i++){
					//     resp.push(docs[i]._id.toString());
					// }
					docs.forEach((e)=>{
						resp.push(e._id.toString());
					});
					callback({success: true,data:resp});
				}
			});
		}
	})
}


function approveDeclineInvoice(type, activeDb,member,req,res,callback){
	var data = req.body || {};
	if(data.list==undefined){
		return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
	}
	var taskType='';
	switch(type){
		case 'approve':
			taskType='einvoice_approve';
		break;
		case 'decline':
			taskType='einvoice_decline';
		break;
	}
	var populate={
		path:'eIntegrator'
	}
	var select='_id ID uuid eIntegrator';

	var idList=[];
	data.list.forEach((e)=>{
		if(e && typeof e === 'object' && e.constructor === Object){
			if(e._id!=undefined){
				idList.push(e._id);
			}else if(e.id!=undefined){
				idList.push(e.id);
			}else{
				return callback({success: false, error: {code: 'ERROR', message: 'list is wrong.'}});
			}
		}else{
			idList.push(e);
		}
	});

	var filter={invoiceStatus:'WaitingForApprovement',_id:{$in:idList}};

	activeDb.invoices.find(filter).select(select).populate(populate).exec((err,docs)=>{
		if (dberr(err,callback)) {
			var index=0;
			

			function pushTask(cb){
				eventLog('docs.length:',docs.length);
				if(index>=docs.length){
					cb(null);
				}else{
					
					var taskdata={taskType: taskType,collectionName:'invoices',documentId:docs[index]._id,document:docs[index].toJSON()}
					taskHelper.newTask(activeDb, taskdata,(err,taskDoc)=>{
						if(!err){
							
							docs[index].save((err,newDoc)=>{
								if(!err){
									index++;
									setTimeout(pushTask,0,cb);
								}else{
									eventLog('burasi:',err);
									cb(err);
								}
							});
						}else{
							cb(err);
						}
					});
				}
			}
			pushTask((err)=>{
				if(err){
					errorLog(err);
				}
				if(dberr(err,callback)){
					var resp=[]
					
					docs.forEach((e)=>{
						resp.push(e._id.toString());
					});
					callback({success: true,data:resp});
				}
			});
		}
	})
}
