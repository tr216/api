module.exports = (dbModel, member, req, res, cb)=>{
	if(req.params.param1==undefined)
		error.param1(req)

	switch(req.method){
		case 'GET':
		switch(req.params.param1.lcaseeng()){

			case 'inboxinvoicelist':
			return getInvoiceList(1,dbModel,member,req,res,cb)
			break
			case 'outboxinvoicelist':
			return getInvoiceList(0,dbModel,member,req,res,cb)
			break
			case 'invoice':
			return getInvoice(dbModel,member,req,res,cb)
			break
			case 'invoiceview':
			return invoiceView(dbModel,member,req,res,cb)
			break
			case 'invoicepdf':
			return invoicePdf(dbModel,member,req,res,cb)
			break
			case 'invoicexmlxslt':
			case 'invoicexml':
			case 'invoicexslt':
			case 'invoicexsltxml':
			return getInvoiceXmlXslt(dbModel,member,req,res,cb)
			break
			case 'einvoiceuserlist':
			return getEInvoiceUserList(dbModel,member,req,res,cb)
			case 'errors':
			return getErrors(dbModel,member,req,res,cb)

			default:
			return error.method(req)
			break
		}
		break
		case 'POST':
		switch(req.params.param1.lcaseeng()){
			case 'transfer':
			if(req.params.param2.lcaseeng()=='import'){
				transferImport(dbModel,member,req,res,cb)
			}else if(req.params.param2.lcaseeng()=='export'){
				return error.method(req)
			}else{
				return error.method(req)
			}
			break
			case 'sendtogib':
			return sendToGib(dbModel,member,req,res,cb)
			case 'approve':
			return approveDeclineInvoice('approve', dbModel,member,req,res,cb)
			case 'decline':
			return approveDeclineInvoice('decline', dbModel,member,req,res,cb)
			case 'saveinboxinvoice':
			case 'saveoutboxinvoice':
			case 'invoice':
			return post(dbModel,member,req,res,cb)
			case 'importoutboxinvoice':
			return importOutboxInvoice(dbModel,member,req,res,cb)
			default:
			return error.method(req)
			break
		}

		break
		case 'PUT':
		switch(req.params.param1.lcaseeng()){
			case 'saveinboxinvoice':
			case 'saveoutboxinvoice':
			case 'invoice':
			return put(dbModel,member,req,res,cb)

			default:
			return error.method(req)
			break
		}
		break
		default:
		return error.method(req)
		break
	}
}

function getErrors(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	var select='_id profileId ID invoiceTypeCode localDocumentId issueDate ioType eIntegrator invoiceErrors localErrors invoiceStatus localStatus'
	
	if(_id=='')
		error.param2(req)
	dbModel.invoices.findOne({_id:_id}).select(select).exec((err,doc)=>{
		if(dberr(err))
			if(dbnull(doc)){
				var data=doc.toJSON()
				cb(data)
			}
		})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined
	
	data=util.amountValueFixed2Digit(data,'')
	var newDoc = new dbModel.invoices(data)
	epValidateSync(newDoc)
	newDoc.uuid.value=uuid.v4()
	newDoc=calculateInvoiceTotals(newDoc)

	dbModel.integrators.findOne({_id:newDoc.eIntegrator},(err,eIntegratorDoc)=>{
		if(dberr(err)){
			if(eIntegratorDoc==null)
				throw {code: 'ENTEGRATOR', message: 'Faturada entegrator bulanamadi.'}
			documentHelper.yeniFaturaNumarasi(dbModel,eIntegratorDoc,newDoc,(err,newDoc)=>{
				newDoc.save((err, newdoc2)=>{
					if(dberr(err)){
						cb(newDoc2)
					}
				})  
			})
		}
	})
}

function importOutboxInvoice(dbModel,member,req,res,cb){
	var data = req.body || {}
	
	if(!data.files)
		throw {code: 'WRONG_PARAMETER', message: 'files elemani bulunamadi'}
	if(!Array.isArray(data.files))
		throw {code: 'WRONG_PARAMETER', message: 'files elemani array olmak zorundadir'}
	if(data.files.length==0)
		throw {code: 'WRONG_PARAMETER', message: 'files elemani bos olamaz'}
	data.files.forEach((e)=>{
		if(e.base64Data){
			e['data']=atob(e.base64Data)
		}
	})


	fileImporter.run(dbModel,(data.fileImporter || ''),data,(err,results)=>{
		if(!err){
			documentHelper.findDefaultEIntegrator(dbModel,(data.eIntegrator || ''),(err,eIntegratorDoc)=>{
				if(!err){
					documentHelper.insertEInvoice(dbModel,eIntegratorDoc,results,(err)=>{
						if(!err){
							cb('ok')
						}else{
							throw err
						}
					})
				}else{
					throw err
				}
			})

		}else{

		}
	})

}

function put(dbModel,member,req,res,cb){
	if(req.params.param2==undefined)
		error.param2(req)
	var data = req.body || {}
	data._id = req.params.param2
	data.modifiedDate = new Date()

	dbModel.invoices.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				data=util.amountValueFixed2Digit(data,'')
				var doc2 = Object.assign(doc, data)
				var newDoc = new dbModel.invoices(doc2)
				epValidateSync(newDoc)
				newDoc=calculateInvoiceTotals(newDoc)
				newDoc.save((err, newDoc2)=>{
					if(dberr(err)){
						cb(newDoc2)
					}
				})

			}
		}
	})
}

function calculateInvoiceTotals(invoice){
	var bSatirdaVergiVar=false
	if(invoice.invoiceLine!=undefined){
		if(invoice.invoiceLine.length>0){
			invoice.invoiceLine.forEach((line)=>{
				if(line.taxTotal!=undefined){
					if(line.taxTotal.taxAmount.value>0){
						bSatirdaVergiVar=true
						return
					}
				}
			})
		}
		invoice.lineCountNumeric.value=invoice.invoiceLine.length
	}
	if(bSatirdaVergiVar){
		invoice.taxTotal=[]
		invoice.withholdingTaxTotal=[]
		invoice.invoiceLine.forEach((line)=>{
			if(line.taxTotal!=undefined){
				if(line.taxTotal.taxAmount.value>0 && line.taxTotal.taxSubtotal.length>0){
					var bAyniVergiTuruBulundu=false
					invoice.taxTotal.forEach(function(e){
						if(e.taxSubtotal.length>0)
							if(e.taxSubtotal[0].percent==line.taxTotal.taxSubtotal[0].percent && e.taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value==line.taxTotal.taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value){
								e.taxAmount.value +=line.taxTotal.taxAmount.value
								e.taxSubtotal[0].taxableAmount.value += line.taxTotal.taxSubtotal[0].taxableAmount.value
								e.taxSubtotal[0].taxAmount.value += line.taxTotal.taxSubtotal[0].taxAmount.value
								bAyniVergiTuruBulundu=true
								return
							}
						})
					if(bAyniVergiTuruBulundu==false){
						invoice.taxTotal.push(JSON.parse(JSON.stringify(line.taxTotal)))
					}
				}
				if(line.withholdingTaxTotal!=undefined){
					if(line.withholdingTaxTotal.length>0){
						if(line.withholdingTaxTotal[0].taxAmount.value>0 && line.withholdingTaxTotal[0].taxSubtotal.length>0){
							var bAyniVergiTuruBulundu=false
							invoice.withholdingTaxTotal.forEach(function(e){
								if(e.taxSubtotal.length>0)
									if(e.taxSubtotal[0].percent==line.withholdingTaxTotal[0].taxSubtotal[0].percent && e.taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value==line.withholdingTaxTotal[0].taxSubtotal[0].taxCategory.taxScheme.taxTypeCode.value){
										e.taxAmount.value +=line.withholdingTaxTotal[0].taxAmount.value
										e.taxSubtotal[0].taxableAmount.value += line.withholdingTaxTotal[0].taxSubtotal[0].taxableAmount.value
										e.taxSubtotal[0].taxAmount.value += line.withholdingTaxTotal[0].taxSubtotal[0].taxAmount.value
										bAyniVergiTuruBulundu=true
										return
									}
								})
							if(bAyniVergiTuruBulundu==false){
								invoice.withholdingTaxTotal.push(JSON.parse(JSON.stringify(line.withholdingTaxTotal[0])))
							}
						}
					}
				}
			}
		})
	}

	var vergiToplam=0
	invoice.taxTotal.forEach((e)=>{
		vergiToplam +=e.taxAmount.value
	})
	var tevkifatToplam=0
	invoice.withholdingTaxTotal.forEach((e)=>{
		tevkifatToplam +=e.taxAmount.value
	})

	var toplamIndirim=0
	var toplamMasraf=0
	invoice.allowanceCharge.forEach((e)=>{
		if(e.chargeIndicator.value){
			toplamMasraf +=e.amount.value
		}else{
			toplamIndirim +=e.amount.value
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
		invoice.invoiceLine.forEach((line)=>{
			invoice.legalMonetaryTotal.lineExtensionAmount.value += line.lineExtensionAmount.value
		})
	}
	invoice.legalMonetaryTotal.taxExclusiveAmount.value=invoice.legalMonetaryTotal.lineExtensionAmount.value - toplamIndirim + toplamMasraf
	invoice.legalMonetaryTotal.taxInclusiveAmount.value=invoice.legalMonetaryTotal.taxExclusiveAmount.value + vergiToplam - tevkifatToplam
	invoice.legalMonetaryTotal.payableRoundingAmount.value=invoice.legalMonetaryTotal.taxInclusiveAmount.value
	invoice.legalMonetaryTotal.payableAmount.value=invoice.legalMonetaryTotal.taxInclusiveAmount.value
	return invoice
}

function transferImport(dbModel,member,req,res,cb){

	dbModel.integrators.find({passive:false,'localConnectorImportInvoice.localConnector':{$ne:null}}).populate(['localConnectorImportInvoice.localConnector']).exec((err,docs)=>{
		if (dberr(err)){
			if(docs.length==0)
				throw {code:'NOT_DEFINED',message:'Local connectoru tanimlanmis aktif bir entegrator bulunmamaktadir.'}

			var index=0
			var kuyrugaAlinan=0
			var zatenKuyrukta=0


			function pushTask(cb){
				if(index>=docs.length){
					cb(null)
				}else{
					dbModel.tasks.findOne({taskType:'connector_import_einvoice',collectionName:'integrators',documentId:docs[index]._id, status:{$in:['running','pending']}},(err,doc)=>{
						if(dberr(err)){
							if(doc==null){
								var taskdata={taskType:'connector_import_einvoice',collectionName:'integrators',documentId:docs[index]._id,document:docs[index]}
								taskHelper.newTask(dbModel,taskdata,(err,taskDoc)=>{
									if(!err){
										switch(taskDoc.status){
											case 'running':
											docs[index].localConnectorImportInvoice['status']='transferring'
											break
											case 'pending':
											docs[index].localConnectorImportInvoice['status']='pending'
											break
											case 'completed':
											docs[index].localConnectorImportInvoice['status']='transferred'
											break
											case 'error':
											docs[index].localConnectorImportInvoice['status']='error'
											break
											default:
											docs[index].localConnectorImportInvoice['status']=''
											break
										}
										docs[index].save((err,newDoc)=>{
											if(!err){
												kuyrugaAlinan++
												index++
												setTimeout(pushTask,0,cb)
											}else{
												cb(err)
												// index++
												// setTimeout(pushTask,0,cb)
											}
										})
									}else{
										cb(err)
										// index++
										// setTimeout(pushTask,0,cb)
									}
								})
							}else{
								zatenKuyrukta++
								index++
								setTimeout(pushTask,0,cb)
							}
						}
					})

				}
			}
			pushTask((err)=>{
				if(dberr(err)){
					if(kuyrugaAlinan==0 && zatenKuyrukta>0){
						throw {code:'ALREADY_IN_PROCESSING',message:'Islem gorev yoneticisine alinmis. Birazdan tamamlanir.'}
					}else{
						cb('Gorev yoneticisine ' + kuyrugaAlinan.toString() + ' adet gorev alindi')
					}
				}
			})
		}
	})
}

function getInvoiceList(ioType,dbModel,member,req,res,cb){
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
		options['limit']=req.query.pageSize || req.query.limit
	}

	var filter = {ioType:ioType}
	
	if(req.query.eIntegrator){
		filter['eIntegrator']=req.query.eIntegrator
	}
	if((req.query.ID || '')!=''){
		filter['ID.value']={ $regex: '.*' + req.query.ID + '.*' ,$options: 'i' }
	}
	if((req.query.invoiceNo || '')!=''){
		if(filter['$or']==undefined)
			filter['$or']=[]
		filter['$or'].push({'ID.value':{ '$regex': '.*' + req.query.invoiceNo + '.*' , '$options': 'i' }})
		filter['$or'].push({'localDocumentId':{ '$regex': '.*' + req.query.invoiceNo + '.*' ,'$options': 'i' }})
	}
	if(req.query.invoiceStatus)
		filter['invoiceStatus']=req.query.invoiceStatus

	if((req.query.profileId || '')!='')
		filter['profileId.value']=req.query.profileId
	
	if((req.query.invoiceTypeCode || '')!='')
		filter['invoiceTypeCode.value']=req.query.invoiceTypeCode

	if((req.query.documentCurrencyCode || '')!='')
		filter['documentCurrencyCode.value']=req.query.documentCurrencyCode

	if((req.query.date1 || '')!='')
		filter['issueDate.value']={$gte:req.query.date1}

	if((req.query.date2 || '')!=''){
		if(filter['issueDate.value']){
			filter['issueDate.value']['$lte']=req.query.date2
		}else{
			filter['issueDate.value']={$lte:req.query.date2}
		}
	}
	
	dbModel.invoices.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			var liste=[]
			resp.docs.forEach((e,index)=>{

				var obj={}
				obj['_id']=e['_id']
				obj['eIntegrator']=e['eIntegrator']
				obj['ioType']=e['ioType']
				obj['profileId']=e['profileId'].value
				obj['ID']=e.ID.value
				obj['uuid']=e['uuid'].value
				obj['issueDate']=e['issueDate'].value
				obj['issueTime']=e['issueTime'].value
				obj['invoiceTypeCode']=e['invoiceTypeCode'].value
				
				obj['accountingParty']={title:'',vknTckn:''}
				if(ioType==0){
					obj['accountingParty']['title']=e.accountingCustomerParty.party.partyName.name.value || (e.accountingCustomerParty.party.person.firstName.value + ' ' + e.accountingCustomerParty.party.person.familyName.value)
					e.accountingCustomerParty.party.partyIdentification.forEach((e2)=>{
						var schemeID=''
						if(e2.ID.attr!=undefined){
							schemeID=(e2.ID.attr.schemeID || '').toLowerCase()
						}
						if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
							obj['accountingParty']['vknTckn']=e2.ID.value || ''
							return
						}
					})
				}else{
					obj['accountingParty']['title']=e.accountingSupplierParty.party.partyName.name.value || (e.accountingSupplierParty.party.person.firstName.value + ' ' + e.accountingSupplierParty.party.person.familyName.value)
					e.accountingSupplierParty.party.partyIdentification.forEach((e2)=>{
						var schemeID=''
						if(e2.ID.attr!=undefined){
							schemeID=(e2.ID.attr.schemeID || '').toLowerCase()
						}
						
						if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
							obj['accountingParty']['vknTckn']=e2.ID.value || ''
							return
						}

					})
				}
				obj['payableAmount']=e['legalMonetaryTotal'].payableAmount.value
				obj['taxExclusiveAmount']=e['legalMonetaryTotal'].taxExclusiveAmount.value
				obj['taxSummary']={
					vat1:0,vat8:0,vat18:0,
					vat0TaxableAmount:0,
					vat1TaxableAmount:0,
					vat8TaxableAmount:0,
					vat18TaxableAmount:0
				}
				var taxTotal=0,withholdingTaxTotal=0
				e['taxTotal'].forEach((e2)=>{
					taxTotal=taxTotal + e2.taxAmount.value
					e2.taxSubtotal.forEach((e3)=>{
						switch(e3.percent.value){
							case 1:
							obj['taxSummary'].vat1+=e3.taxAmount.value
							obj['taxSummary'].vat1TaxableAmount+=e3.taxableAmount.value
							break
							case 8:
							obj['taxSummary'].vat8+=e3.taxAmount.value
							obj['taxSummary'].vat8TaxableAmount+=e3.taxableAmount.value
							break
							case 18:
							obj['taxSummary'].vat18+=e3.taxAmount.value
							obj['taxSummary'].vat0TaxableAmount+=e3.taxableAmount.value
							break
							default:
							obj['taxSummary'].vat18TaxableAmount+=e3.taxableAmount.value
							break
						}
					})
				})
				e['withholdingTaxTotal'].forEach((e2)=>{
					withholdingTaxTotal=withholdingTaxTotal + e2.taxAmount.value
				})
				obj['taxTotal']=taxTotal
				obj['withholdingTaxTotal']=withholdingTaxTotal
				obj['documentCurrencyCode']=e['documentCurrencyCode'].value
				obj['exchangeRate']=e['pricingExchangeRate'].calculationRate.value

				obj['lineCountNumeric']=e['lineCountNumeric'].value
				obj['localDocumentId']=e['localDocumentId']
				obj['invoiceStatus']=e['invoiceStatus']
				obj['invoiceErrors']=e['invoiceErrors']
				obj['localStatus']=e['localStatus']
				obj['localErrors']=e['localErrors']
				

				liste.push(obj)
			})
			resp.docs=liste
			cb(resp)
		} else {
			errorLog('error:',err)
		}
	})
}

function getInvoice(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false
	var select='-additionalDocumentReference'
	if(includeAdditionalDocumentReference==true)
		select=''

	if(_id=='')
		error.param2(req)

	dbModel.invoices.findOne({_id:_id},select).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var data=doc.toJSON()
				cb(data)
			}
		}
	})
}

function invoiceView(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	if(_id=='')
		error.param2(req)

	dbModel.invoices.findOne({_id:_id}).populate(['html']).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				cb({file: doc.html})
			}
		}
	})
}

function invoicePdf(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	if(_id=='')
		error.param2(req)

	dbModel.invoices.findOne({_id:_id}).populate(['pdf']).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				cb({file: doc.pdf})
			}
		}
	})
}

function getInvoiceXmlXslt(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	if(_id=='')
		error.param2(req)
	dbModel.invoices.findOne({_id:_id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var invoice=doc.toJSON()
				var xml=btoa(util.e_invoice2xml(invoice))
				var xslt=util.e_invoiceXslt(invoice)
				cb({xml:xml,xslt:xslt})
			}
		}
	})
}

function getEInvoiceUserList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1), 
		limit:10
	}

	if((req.query.pageSize || req.query.limit)){
		options['limit']=req.query.pageSize || req.query.limit
	}

	var filter = {}
	
	var vkn=req.query.vkn || req.query.tckn || req.query.vknTckn || req.query.taxNumber || req.query.identifier || ''

	if(vkn!='')
		filter['identifier']={ '$regex': '.*' + vkn + '.*' ,'$options': 'i' }

	if((req.query.title || '')!='')
		filter['title']={ '$regex': '.*' + req.query.title + '.*' ,'$options': 'i' }

	if(req.query.enabled)
		filter['enabled']=Boolean(req.query.enabled)

	if((req.query.postboxAlias || '')!='')
		filter['postboxAlias']={ $regex: '.*' + req.query.postboxAlias + '.*' ,$options: 'i' }
	
	db.einvoice_users.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		} 
	})
}

function sendToGib(dbModel,member,req,res,cb){
	var data = req.body || {}
	if(data.list==undefined)
		throw {code: 'ERROR', message: 'list is required.'}

	var populate={
		path:'eIntegrator'
	}

	var idList=[]
	data.list.forEach((e)=>{
		if(e && typeof e === 'object' && e.constructor === Object){
			if(e._id!=undefined){
				idList.push(e._id)
			}else if(e.id!=undefined){
				idList.push(e.id)
			}else{
				throw {code: 'ERROR', message: 'list is wrong.'}
			}
		}else{
			idList.push(e)
		}
	})

	var filter={invoiceStatus:{$in:['Draft','Error']},_id:{$in:idList}}

	dbModel.invoices.find(filter).populate(populate).exec((err,docs)=>{
		if(dberr(err)){
			var index=0

			function pushTask(cb){
				if(index>=docs.length){
					cb(null)
				}else{
					
					var taskdata={taskType:'einvoice_send_to_gib',collectionName:'invoices',documentId:docs[index]._id,document:docs[index].toJSON()}
					taskHelper.newTask(dbModel, taskdata,(err,taskDoc)=>{
						if(!err){
							switch(taskDoc.status){
								case 'running':
								docs[index].status='Processing'
								break
								case 'pending':
								docs[index].invoiceStatus='Pending'
								break
								case 'completed':
								docs[index].invoiceStatus='Processing'
								break
								case 'error':
								docs[index].invoiceStatus='Error'
								break
								default:
								break
							}
							docs[index].save((err,newDoc)=>{
								if(!err){
									index++
									setTimeout(pushTask,0,cb)
								}else{
									cb(err)
								}
							})
						}else{
							cb(err)
						}
					})
				}
			}
			pushTask((err)=>{
				if(dberr(err)){
					var resp=[]
					docs.forEach((e)=>{
						resp.push(e._id.toString())
					})
					cb(resp)
				}
			})
		}
	})
}


function approveDeclineInvoice(type, dbModel,member,req,res,cb){
	var data = req.body || {}
	if(data.list==undefined)
		throw {code: 'ERROR', message: 'list is required.'}

	var taskType=''
	switch(type){
		case 'approve':
		taskType='einvoice_approve'
		break
		case 'decline':
		taskType='einvoice_decline'
		break
	}
	var populate={
		path:'eIntegrator'
	}
	var select='_id ID uuid eIntegrator'

	var idList=[]
	data.list.forEach((e)=>{
		if(e && typeof e === 'object' && e.constructor === Object){
			if(e._id!=undefined){
				idList.push(e._id)
			}else if(e.id!=undefined){
				idList.push(e.id)
			}else{
				throw {code: 'ERROR', message: 'list is wrong.'}
			}
		}else{
			idList.push(e)
		}
	})

	var filter={invoiceStatus:'WaitingForApprovement',_id:{$in:idList}}

	dbModel.invoices.find(filter).select(select).populate(populate).exec((err,docs)=>{
		if(dberr(err)){
			var index=0

			function pushTask(cb){
				eventLog('docs.length:',docs.length)
				if(index>=docs.length){
					cb(null)
				}else{
					
					var taskdata={taskType: taskType,collectionName:'invoices',documentId:docs[index]._id,document:docs[index].toJSON()}
					taskHelper.newTask(dbModel, taskdata,(err,taskDoc)=>{
						if(!err){
							
							docs[index].save((err,newDoc)=>{
								if(!err){
									index++
									setTimeout(pushTask,0,cb)
								}else{
									cb(err)
								}
							})
						}else{
							cb(err)
						}
					})
				}
			}
			pushTask((err)=>{
				if(err){
					errorLog(err)
				}
				if(dberr(err)){
					var resp=[]
					
					docs.forEach((e)=>{
						resp.push(e._id.toString())
					})
					cb(resp)
				}
			})
		}
	})
}