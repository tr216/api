module.exports = (dbModel, member, req, res, next, cb)=>{
	if(req.params.param1==undefined)
		return error.param1(req, next)

	switch(req.method){
		case 'GET':
		switch(req.params.param1.lcaseeng()){

			case 'inboxorderlist':
			return getOrderList(1, dbModel, member, req, res, next, cb)
			case 'inboxwaitingorders':
			return waitingOrders(1, dbModel, member, req, res, next, cb)

			case 'outboxorderlist':
			return getOrderList(0, dbModel, member, req, res, next, cb)
			case 'outboxwaitingorders':
			return waitingOrders(0, dbModel, member, req, res, next, cb)

			case 'order':
			return getOrder(dbModel, member, req, res, next, cb)

			case 'orderview':
			return orderView(dbModel, member, req, res, next, cb)
			case 'orderpdf':
			return orderPdf(dbModel, member, req, res, next, cb)
			case 'orderxmlxslt':
			case 'orderxml':
			case 'orderxslt':
			case 'orderxsltxml':
			return getOrderXmlXslt(dbModel, member, req, res, next, cb)
			case 'eorderuserlist':
			return getEOrderUserList(dbModel, member, req, res, next, cb)
			case 'errors':
			return getErrors(dbModel, member, req, res, next, cb)

			default:
			error.method(req, next)
			break
		}
		break
		case 'POST':
		switch(req.params.param1.lcaseeng()){
			case 'transfer':
			if(req.params.param2.lcaseeng()=='import'){
				transferImport(dbModel, member, req, res, next, cb)
			}else if(req.params.param2.lcaseeng()=='export'){
				error.method(req, next)
			}else{
				error.method(req, next)
			}
			break
			case 'sendtogib':
			return sendToGib(dbModel, member, req, res, next, cb)
			case 'approve':
			return approveDeclineOrder('approve', dbModel,member,req,res,cb)
			case 'decline':
			return approveDeclineOrder('decline', dbModel,member,req,res,cb)
			case 'saveinboxorder':
			case 'saveoutboxorder':
			case 'order':
			return post(dbModel, member, req, res, next, cb)
			case 'findgtipno':
			return findGTIPNO(dbModel, member, req, res, next, cb)
			case 'importoutboxorder':
			return importOutboxOrder(dbModel, member, req, res, next, cb)
			default:
			error.method(req, next)
			break
		}
		break
		case 'PUT':
		switch(req.params.param1.lcaseeng()){
			case 'saveinboxorder':
			case 'saveoutboxorder':
			case 'order':
			return put(dbModel, member, req, res, next, cb)

			default:
			error.method(req, next)
			break
		}
		break
		default:
		error.method(req, next)
		break
	}
}


function waitingOrders(ioType, dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1) 
	}

	if((req.query.pageSize || req.query.limit))
		options['limit']=req.query.pageSize || req.query.limit

	var filter = { 
		ioType:ioType

	}


	var aggregateProject=[

	{$unwind:'$orderLine'},
	{$project: {
		_id:'$orderLine._id',
		sip_id:'$_id',
		profileId:'$profileId',
		ID: '$ID',
		salesOrderId:'$salesOrderId',
		issueDate: '$issueDate',
		issueTime:'$issueTime',
		orderTypeCode: '$orderTypeCode',
		validityPeriod:1,
		lineCountNumeric:1,
		buyerCustomerParty: { party:'$buyerCustomerParty.party'},
		orderLine:1,
		deliveredRemaining:{$subtract:['$orderLine.orderedQuantity.value', '$orderLine.deliveredQuantity.value']},
		producedRemaining:{$subtract:['$orderLine.orderedQuantity.value', '$orderLine.producedQuantity.value']},
		localDocumentId: 1,
		orderStatus: 1,
		localStatus:1
	}
},
{
	$match: {
		deliveredRemaining:{$gt:0},
		producedRemaining:{$gt:0}
	}
}


]
var myAggregate = dbModel.orders.aggregate(aggregateProject)

dbModel.orders.aggregatePaginate(myAggregate,options,(err, resp)=>{
	if(dberr(err,next)){
		cb(resp)
	}
})
}

function getErrors(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	var select='_id profileId ID orderTypeCode localDocumentId issueDate ioType eIntegrator orderErrors localErrors orderStatus localStatus'
	
	if(_id=='') 
		error.param2(req)
	dbModel.orders.findOne({_id:_id},select).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var data=doc.toJSON()
				cb(data)
			}
		}
	})
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	data._id=undefined
	
	data=util.amountValueFixed2Digit(data,'')
	var newDoc = new dbModel.orders(data)
	if(!epValidateSync(newDoc,next))
		return

	newDoc.uuid.value=uuid.v4()
	newDoc=calculateOrderTotals(newDoc)

	dbModel.integrators.findOne({_id:newDoc.eIntegrator},(err,eIntegratorDoc)=>{
		if(dberr(err,next)){
			if(eIntegratorDoc==null)
				return next({code: 'ENTEGRATOR', message: 'Sipariste entegrator bulanamadi.'})

			documentHelper.yeniSiparisNumarasi(dbModel,eIntegratorDoc,newDoc,(err,newDoc)=>{
				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next))
						cb(newDoc2)
				})  
			})
		}
	})
}

function importOutboxOrder(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	
	if(!data.files)
		return next({code: 'WRONG_PARAMETER', message: 'files elemani bulunamadi'})

	if(!Array.isArray(data.files))
		return next({code: 'WRONG_PARAMETER', message: 'files elemani array olmak zorundadir'})

	if(data.files.length==0)
		return next({code: 'WRONG_PARAMETER', message: 'files elemani bos olamaz'})

	data.files.forEach((e)=>{
		if(e.base64Data)
			e['data']=atob(e.base64Data)
	})


	fileImporter.run(dbModel,(data.fileImporter || ''),data,(err,results)=>{
		if(dberr(err,next)){
			documentHelper.findDefaultEIntegrator(dbModel,(data.eIntegrator || ''),(err,eIntegratorDoc)=>{
				if(dberr(err,next))
					cb('ok')
			})
		}
	})
}

function put(dbModel, member, req, res, next, cb){

	if(req.params.param2==undefined)
		error.param2(req)
	var data = req.body || {}
	data._id = req.params.param2
	data.modifiedDate = new Date()
	dbModel.orders.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				data=util.amountValueFixed2Digit(data,'')
				var doc2 = Object.assign(doc, data)
				var newDoc = new dbModel.orders(doc2)
				if(!epValidateSync(newDoc,next))
					return
				newDoc=calculateOrderTotals(newDoc)
				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next))
						cb(newDoc2)
				})
			}
		}
	})
}

function calculateOrderTotals(order){
	var bSatirdaVergiVar=false
	if(order.orderLine!=undefined){
		if(order.orderLine.length>0){
			order.orderLine.forEach(function(line){
				if(line.taxTotal!=undefined)
					if(line.taxTotal.taxAmount.value>0){
						bSatirdaVergiVar=true
					}
				})
		}
		order.lineCountNumeric.value=order.orderLine.length
	}
	if(bSatirdaVergiVar){
		order.taxTotal=[]
		order.withholdingTaxTotal=[]
		order.orderLine.forEach(function(line){
			if(line.taxTotal!=undefined)
				if(line.taxTotal.taxAmount.value>0 && line.taxTotal.taxSubtotal.length>0){
					var bAyniVergiTuruBulundu=false
					order.taxTotal.forEach(function(e){
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
						order.taxTotal.push(JSON.parse(JSON.stringify(line.taxTotal)))
					}
				}
				if(line.withholdingTaxTotal!=undefined)
					if(line.withholdingTaxTotal.length>0)
						if(line.withholdingTaxTotal[0].taxAmount.value>0 && line.withholdingTaxTotal[0].taxSubtotal.length>0){
							var bAyniVergiTuruBulundu=false
							order.withholdingTaxTotal.forEach(function(e){
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
								order.withholdingTaxTotal.push(JSON.parse(JSON.stringify(line.withholdingTaxTotal[0])))
							}
						}
					})
	}

	var vergiToplam=0
	order.taxTotal.forEach((e)=>{
		vergiToplam +=e.taxAmount.value
	})
	var tevkifatToplam=0
	order.withholdingTaxTotal.forEach((e)=>{
		tevkifatToplam +=e.taxAmount.value
	})

	var toplamIndirim=0
	var toplamMasraf=0
	order.allowanceCharge.forEach((e)=>{
		if(e.chargeIndicator.value){
			toplamMasraf +=e.amount.value
		}else{
			toplamIndirim +=e.amount.value
		}
	})

	order.anticipatedMonetaryTotal={
		lineExtensionAmount:{value:0},
		allowanceTotalAmount:{value:toplamIndirim},
		chargeTotalAmount:{value:toplamMasraf},
		taxExclusiveAmount:{value:0},
		taxInclusiveAmount:{value:0},
		payableRoundingAmount:{value:0},
		payableAmount:{value:0},
	}

	if(order.orderLine!=undefined){
		order.orderLine.forEach(function(line){
			order.anticipatedMonetaryTotal.lineExtensionAmount.value += line.lineExtensionAmount.value
		})
	}
	order.anticipatedMonetaryTotal.taxExclusiveAmount.value=order.anticipatedMonetaryTotal.lineExtensionAmount.value - toplamIndirim + toplamMasraf
	order.anticipatedMonetaryTotal.taxInclusiveAmount.value=order.anticipatedMonetaryTotal.taxExclusiveAmount.value + vergiToplam - tevkifatToplam
	order.anticipatedMonetaryTotal.payableRoundingAmount.value=order.anticipatedMonetaryTotal.taxInclusiveAmount.value
	order.anticipatedMonetaryTotal.payableAmount.value=order.anticipatedMonetaryTotal.taxInclusiveAmount.value

	return order
}

function transferImport(dbModel, member, req, res, next, cb){

	dbModel.integrators.find({passive:false,'localConnectorImportOrder.localConnector':{$ne:null}}).populate(['localConnectorImportOrder.localConnector']).exec((err,docs)=>{
		if(dberr(err,next)){
			if(docs.length==0)
				return next({code:'NOT_DEFINED',message:'Local connectoru tanimlanmis aktif bir entegrator bulunmamaktadir.'})

			var index=0
			var kuyrugaAlinan=0
			var zatenKuyrukta=0
			function pushTask(cb){
				if(index>=docs.length)
					return cb(null)
				dbModel.tasks.findOne({taskType:'connector_import_eorder',collectionName:'integrators',documentId:docs[index]._id, status:{$in:['running','pending']}},(err,doc)=>{
					if(dberr(err,next)){
						if(doc==null){
							var taskdata={taskType:'connector_import_eorder',collectionName:'integrators',documentId:docs[index]._id,document:docs[index]}
							taskHelper.newTask(dbModel,taskdata,(err,taskDoc)=>{
								if(!err){
									switch(taskDoc.status){
										case 'running':
										docs[index].localConnectorImportOrder['status']='transferring'
										break
										case 'pending':
										docs[index].localConnectorImportOrder['status']='pending'
										break
										case 'completed':
										docs[index].localConnectorImportOrder['status']='transferred'
										break
										case 'error':
										docs[index].localConnectorImportOrder['status']='error'
										break
										default:
										docs[index].localConnectorImportOrder['status']=''
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

			pushTask((err)=>{
				if(dberr(err,next)){
					if(kuyrugaAlinan==0 && zatenKuyrukta>0){
						return next({code:'ALREADY_IN_PROCESSING',message:'Islem gorev yoneticisine alinmis. Birazdan tamamlanir.'})
					}else{
						cb(`Gorev yoneticisine ${kuyrugaAlinan.toString()} adet gorev alindi`)
					}
				}
			})
		}
	})
}

function getOrderList(ioType, dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1), 
		populate:[
		{path:'eIntegrator',select:'_id eIntegrator name username'}
		],
		limit:10
		,
		select:'_id eIntegrator profileId ID salesOrderId uuid issueDate issueTime orderTypeCode documentCurrencyCode lineCountNumeric localDocumentId pricingExchangeRate buyerCustomerParty sellerSupplierParty anticipatedMonetaryTotal taxTotal withholdingTaxTotal orderStatus orderErrors localStatus localErrors',
		sort:{'issueDate.value':'desc' , 'ID.value':'desc'}
	}

	if((req.query.pageSize || req.query.limit))
		options['limit']=req.query.pageSize || req.query.limit

	var filter = {ioType:ioType}
	
	if((req.query.eIntegrator || '')!='')
		filter['eIntegrator']=req.query.eIntegrator

	if((req.query.ID || '')!='')
		filter['ID.value']={ $regex: '.*' + req.query.ID + '.*' ,$options: 'i' }

	if((req.query.orderNo || '')!=''){
		if(filter['$or']==undefined)
			filter['$or']=[]
		filter['$or'].push({'ID.value':{ '$regex': '.*' + req.query.orderNo + '.*' , '$options': 'i' }})
		filter['$or'].push({'localDocumentId':{ '$regex': '.*' + req.query.orderNo + '.*' ,'$options': 'i' }})
	}
	
	if((req.query.orderStatus || '')!='')
		filter['orderStatus']=req.query.orderStatus

	if((req.query.profileId || '')!='')
		filter['profileId.value']=req.query.profileId

	if((req.query.orderTypeCode || '')!='')
		filter['orderTypeCode.value']=req.query.orderTypeCode

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
	
	dbModel.orders.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			var liste=[]
			resp.docs.forEach((e,index)=>{

				var obj={}
				obj['_id']=e['_id']
				obj['eIntegrator']=e['eIntegrator']
				obj['ioType']=e['ioType']
				obj['profileId']=e['profileId'].value
				obj['ID']=e.ID.value
				obj['salesOrderId']=e['salesOrderId'].value
				obj['uuid']=e['uuid'].value
				obj['issueDate']=e['issueDate'].value
				obj['issueTime']=e['issueTime'].value
				obj['orderTypeCode']=e['orderTypeCode'].value
				
				obj['party']={title:'',vknTckn:''}
				if(ioType==0){
					obj['party']['title']=e.buyerCustomerParty.party.partyName.name.value || (e.buyerCustomerParty.party.person.firstName.value + ' ' + e.buyerCustomerParty.party.person.familyName.value)
					e.buyerCustomerParty.party.partyIdentification.forEach((e2)=>{
						var schemeID=''
						if(e2.ID.attr!=undefined){
							schemeID=(e2.ID.attr.schemeID || '').toLowerCase()
						}
						if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
							obj['party']['vknTckn']=e2.ID.value || ''
							return
						}
					})
				}else{
					obj['party']['title']=e.sellerSupplierParty.party.partyName.name.value || (e.sellerSupplierParty.party.person.firstName.value + ' ' + e.sellerSupplierParty.party.person.familyName.value)
					e.sellerSupplierParty.party.partyIdentification.forEach((e2)=>{
						var schemeID=''
						if(e2.ID.attr!=undefined){
							schemeID=(e2.ID.attr.schemeID || '').toLowerCase()
						}
						
						if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
							obj['party']['vknTckn']=e2.ID.value || ''
							return
						}

					})
				}
				obj['payableAmount']=e['anticipatedMonetaryTotal'].payableAmount.value
				obj['taxExclusiveAmount']=e['anticipatedMonetaryTotal'].taxExclusiveAmount.value
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
				obj['orderStatus']=e['orderStatus']
				obj['orderErrors']=e['orderErrors']
				obj['localStatus']=e['localStatus']
				obj['localErrors']=e['localErrors']
				

				liste.push(obj)
			})
			resp.docs=liste
			cb(resp)
		}
	})
}

function getOrder(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false
	var select='-additionalDocumentReference'
	if(includeAdditionalDocumentReference==true)
		select=''

	if(_id=='')
		error.param2(req)

	dbModel.orders.findOne({_id:_id}).select(select).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var data=doc.toJSON()
				cb(data)
			}
		}
	})
}

function orderView(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	if(_id=='')
		error.param2(req)
	dbModel.orders.findOne({_id:_id}).populate(['html']).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				cb({file: doc.html})
			}
		}
	})
}

function orderPdf(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	if(_id=='')
		error.param2(req)

	dbModel.orders.findOne({_id:_id}).populate(['pdf']).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				cb({file: doc.pdf})
			}
		}
	})
}

function getOrderXmlXslt(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	if(_id=='')
		error.param2(req)

	dbModel.orders.findOne({_id:_id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var order=doc.toJSON()
				var xml=btoa(util.order2xml(order))
				var xslt=util.orderXslt(order)
				cb({xml:xml,xslt:xslt})
			}
		}
	})
}

function getEOrderUserList(dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1), 
		limit:10
	}

	if((req.query.pageSize || req.query.limit))
		options['limit']=req.query.pageSize || req.query.limit

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
	
	db.eorder_users.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			cb(resp)
		} 
	})
}