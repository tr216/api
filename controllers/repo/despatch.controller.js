module.exports = (dbModel, member, req, res, next, cb)=>{
	if(req.params.param1==undefined) 
		error.param1(req)
	switch(req.method){
		case 'GET':
		switch(req.params.param1.lcaseeng()){
			case 'inboxdespatchlist':
			return getDespatchList(1, dbModel, member, req, res, next, cb)
			break
			case 'outboxdespatchlist':
			return getDespatchList(0, dbModel, member, req, res, next, cb)
			break
			case 'despatch':
			return getDespatch(dbModel, member, req, res, next, cb)
			break
			case 'logs':
			eDespatchService.get(dbModel,`/logs/${req.params.param2}`,{},(err,data)=>{
				if(dberr(err,next)){
					cb(data)
				}
			})
			break
			case 'view':
			eDespatchService.get(dbModel,`/view/${req.params.param2}`,{},(err,data)=>{
				if(dberr(err,next)){
					cb(data)
				}
			})
			break
			
			case 'edespatchuserlist':
			return getEDespatchUserList(dbModel, member, req, res, next, cb)
			case 'errors':
			return getErrors(dbModel, member, req, res, next, cb)

			default:
			return error.method(req)
			break
		}
		break
		case 'POST':
		switch(req.params.param1.lcaseeng()){
			case 'send':
			if(req.params.param2!=undefined){
				eDespatchService.post(dbModel,`/send/${req.params.param2}`,req.body,(err,data)=>{
					if(dberr(err,next)){
						cb(data)
					}
				})
			}else{
				eDespatchService.post(dbModel,`/send`,req.body,(err,data)=>{
					if(dberr(err,next)){
						cb(data)
					}
				})
			}
			break
			case 'approve':
			return approveDeclineDespatch('approve', dbModel,member,req,res,cb)
			case 'decline':
			return approveDeclineDespatch('decline', dbModel,member,req,res,cb)
			case 'saveinboxdespatch':
			case 'saveoutboxdespatch':
			case 'despatch':
			return post(dbModel, member, req, res, next, cb)
			case 'importoutbox':
			return importOutbox(dbModel, member, req, res, next, cb)
			default:
			return error.method(req)
			break
		}

		break
		case 'PUT':
		switch(req.params.param1.lcaseeng()){
			case 'saveinboxdespatch':
			case 'saveoutboxdespatch':
			case 'despatch':
			return put(dbModel, member, req, res, next, cb)

			default:
			return error.method(req)
			break
		}
		break
		case 'DELETE':

		deleteItem(dbModel, member, req, res, next, cb)
		break
		default:
		return error.method(req)
		break
	}
}


function importOutbox(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	
	if(!data.files)
		return next({code: 'WRONG_PARAMETER', message: 'files elemani bulunamadi'})

	if(!Array.isArray(data.files))
		return next({code: 'WRONG_PARAMETER', message: 'files elemani array olmak zorundadir'})

	if(data.files.length==0)
		return next({code: 'WRONG_PARAMETER', message: 'files elemani bos olamaz'})

	data.files.forEach((e)=>{
		if(e.base64Data){
			e['data']=atob(e.base64Data)
		}
	})
	

	fileImporter.run(dbModel,(data.fileImporter || ''),data,(err,results)=>{
		if(!err){
			documentHelper.findDefaultEIntegrator(dbModel,(data.eIntegrator || ''),(err,eIntegratorDoc)=>{
				if(dberr(err,next)){
					documentHelper.insertEDespatch(dbModel,eIntegratorDoc,results,(err)=>{
						if(dberr(err,next))
							cb('ok')
					})
				}
			})
		}else{
			return next(err)
		}
	})
	
}

function getErrors(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	var select='_id profileId ID despatchTypeCode localDocumentId issueDate ioType eIntegrator despatchErrors localErrors despatchStatus localStatus'

	if(_id=='') 
		error.param2(req)
	dbModel.despatches.findOne({_id:_id},select).exec((err,doc)=>{
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
	data=fazlaliklariTemizleDuzelt(data)
	var newDoc = new dbModel.despatches(data)
	epValidateSync(newDoc)

	newDoc.uuid.value=uuid.v4()

	dbModel.integrators.findOne({_id:newDoc.eIntegrator},(err,eIntegratorDoc)=>{
		if(dberr(err,next)){
			if(eIntegratorDoc==null) 
				return next({code: 'ENTEGRATOR', message: 'Entegrator bulanamadi.'})
			documentHelper.yeniIrsaliyeNumarasi(dbModel,eIntegratorDoc,newDoc,(err,newDoc)=>{
				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next))
						cb(newDoc2)
				})  
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
	data=fazlaliklariTemizleDuzelt(data)

	dbModel.despatches.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				data=util.amountValueFixed2Digit(data,'')
				var doc2 = Object.assign(doc, data)
				var newDoc = new dbModel.despatches(doc2)
				epValidateSync(newDoc)
				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next)){
						cb(newDoc2)
					}
				})
			}
		}
	})
}

function fazlaliklariTemizleDuzelt(data){
	if((data.location || '')=='')
		data.location=undefined
	if((data.location2 || '')=='')
		data.location2=undefined
	if((data.subLocation || '')=='') 
		data.subLocation=undefined
	if((data.subLocation2 || '')=='') 
		data.subLocation2=undefined

	if(data.despatchLine){
		data.despatchLine.forEach((e)=>{
			if(e.item)
				if((e.item._id || '')=='')
					e.item._id=undefined
			})
	}
	return data
}

function getDespatchList(ioType, dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1), 
		populate:[
		{path:'eIntegrator',select:'_id eIntegrator name username'}
		],
		limit:10
		,
		select:'_id eIntegrator profileId ID uuid issueDate issueTime despatchAdviceTypeCode lineCountNumeric localDocumentId deliveryCustomerParty despatchSupplierParty despatchStatus despatchErrors localStatus localErrors',
		sort:{'issueDate.value':'desc' , 'ID.value':'desc'}
	}

	if((req.query.pageSize || req.query.limit))
		options['limit']=req.query.pageSize || req.query.limit

	var filter = {ioType:ioType}

	if(req.query.eIntegrator)
		filter['eIntegrator']=req.query.eIntegrator

	if((req.query.despatchNo || req.query.ID || '')!=''){
		if(filter['$or']==undefined)
			filter['$or']=[]
		filter['$or'].push({'ID.value':{ '$regex': '.*' + req.query.despatchNo || req.query.ID + '.*' , '$options': 'i' }})
		filter['$or'].push({'localDocumentId':{ '$regex': '.*' + req.query.despatchNo || req.query.ID + '.*' ,'$options': 'i' }})
	}

	if(req.query.despatchStatus)
		filter['despatchStatus']=req.query.despatchStatus
	
	if((req.query.profileId || '')!='')
		filter['profileId.value']=req.query.profileId
	
	if((req.query.despatchAdviceTypeCode || '')!='')
		filter['despatchAdviceTypeCode.value']=req.query.despatchAdviceTypeCode
	

	if((req.query.date1 || '')!='')
		filter['issueDate.value']={$gte:req.query.date1}
	

	if((req.query.date2 || '')!=''){
		if(filter['issueDate.value']){
			filter['issueDate.value']['$lte']=req.query.date2
		}else{
			filter['issueDate.value']={$lte:req.query.date2}
		}
	}

	dbModel.despatches.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
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
				obj['despatchAdviceTypeCode']=e['despatchAdviceTypeCode'].value

				obj['party']={title:'',vknTckn:''}
				if(ioType==0){
					obj['party']['title']=e.deliveryCustomerParty.party.partyName.name.value || (e.deliveryCustomerParty.party.person.firstName.value + ' ' + e.deliveryCustomerParty.party.person.familyName.value)
					e.deliveryCustomerParty.party.partyIdentification.forEach((e2)=>{
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
					obj['party']['title']=e.despatchSupplierParty.party.partyName.name.value || (e.despatchSupplierParty.party.person.firstName.value + ' ' + e.despatchSupplierParty.party.person.familyName.value)
					e.despatchSupplierParty.party.partyIdentification.forEach((e2)=>{
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

				obj['lineCountNumeric']=e['lineCountNumeric'].value
				obj['localDocumentId']=e['localDocumentId']
				obj['despatchStatus']=e['despatchStatus']
				obj['despatchErrors']=e['despatchErrors']
				obj['localStatus']=e['localStatus']
				obj['localErrors']=e['localErrors']


				liste.push(obj)
			})
			resp.docs=liste
			cb(resp)
		}
	})
}

function getDespatch(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false
	var select='-additionalDocumentReference'
	if(includeAdditionalDocumentReference==true)
		select=''

	if(_id=='')
		error.param2(req)

	dbModel.despatches.findOne({_id:_id}).select(select).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				if(!req.query.print){
					var data=doc.toJSON()
					cb(data)
				}else{
					yazdir(dbModel,'despatch',req,res,doc,(err,html)=>{
						if(dberr(err,next))
							cb({file: {data:html}})
					})
				}
			}
		}
	})
}

function yazdir(dbModel,moduleName,req,res,doc,cb){
	var designId=req.query.designId || ''
	if((doc.eIntegrator || '')=='')
		return printHelper.print(dbModel,'despatch',doc, designId, cb)
	doc.populate('eIntegrator').execPopulate((err,doc2)=>{
		if(dberr(err,next)){
			if(doc2.eIntegrator.despatch.url=='')
				return printHelper.print(dbModel,'despatch',doc, designId, cb)
			dbModel.services.eDespatch.xsltView(doc2,(err,html)=>{
				if(dberr(err,next)){
					cb(html)
				}
			})
		}
	})
}

function getEDespatchUserList(dbModel, member, req, res, next, cb){
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


	db.einvoice_users.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			cb(resp)
		} 
	})
}


function deleteItem(dbModel, member, req, res, next, cb){
	console.log('despatch.deleteItem calisti')
	if(req.params.param1==undefined)
		error.param1(req)
	
	var data = req.body || {}
	data._id = req.params.param1

	dbModel.despatches.findOne({_id:data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				if(!(doc.despatchStatus=='Draft' || doc.despatchStatus=='Error' || doc.despatchStatus=='Canceled' || doc.despatchStatus=='Declined')){
					return next({code:'PERMISSION_DENIED',message:`Belgenin durumundan dolayi silinemez!`})
				}else{
					dbModel.despatches.removeOne(member,{ _id: data._id},(err,doc)=>{
						if(dberr(err,next)){
							cb(null)
						}
					})
				}
			}
		}
	})
}
