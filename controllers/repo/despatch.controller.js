module.exports = (dbModel, member, req, res, cb)=>{
	if(req.params.param1==undefined) 
		error.param1(req)
	switch(req.method){
		case 'GET':
		switch(req.params.param1.lcaseeng()){
			case 'inboxdespatchlist':
			return getDespatchList(1,dbModel,member,req,res,cb)
			break
			case 'outboxdespatchlist':
			return getDespatchList(0,dbModel,member,req,res,cb)
			break
			case 'despatch':
			return getDespatch(dbModel,member,req,res,cb)
			break
			case 'despatch-logs':
			return getDespatchLogs(dbModel,member,req,res,cb)
			break
			case 'edespatchuserlist':
			return getEDespatchUserList(dbModel,member,req,res,cb)
			case 'errors':
			return getErrors(dbModel,member,req,res,cb)

			default:
			return error.method(req)
			break
		}
		break
		case 'POST':
		switch(req.params.param1.lcaseeng()){

			case 'sendtogib':
			return sendToGib(dbModel,member,req,res,cb)
			case 'approve':
			return approveDeclineDespatch('approve', dbModel,member,req,res,cb)
			case 'decline':
			return approveDeclineDespatch('decline', dbModel,member,req,res,cb)
			case 'saveinboxdespatch':
			case 'saveoutboxdespatch':
			case 'despatch':
			return post(dbModel,member,req,res,cb)
			case 'importoutbox':
			return importOutbox(dbModel,member,req,res,cb)
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


function importOutbox(dbModel,member,req,res,cb){
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
				if(dberr(err)){
					documentHelper.insertEDespatch(dbModel,eIntegratorDoc,results,(err)=>{
						if(dberr(err))
							cb('ok')
					})
				}
			})
		}else{
			throw err
		}
	})
	
}

function getErrors(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	var select='_id profileId ID despatchTypeCode localDocumentId issueDate ioType eIntegrator despatchErrors localErrors despatchStatus localStatus'

	if(_id=='') 
		error.param2(req)
	dbModel.despatches.findOne({_id:_id},select).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var data=doc.toJSON()
				cb(data)
			}
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined

	data=util.amountValueFixed2Digit(data,'')
	data=fazlaliklariTemizleDuzelt(data)
	var newDoc = new dbModel.despatches(data)
	epValidateSync(newDoc)

	newDoc.uuid.value=uuid.v4()

	dbModel.integrators.findOne({_id:newDoc.eIntegrator},(err,eIntegratorDoc)=>{
		if(dberr(err)){
			if(eIntegratorDoc==null) 
				throw {code: 'ENTEGRATOR', message: 'Entegrator bulanamadi.'}
			documentHelper.yeniIrsaliyeNumarasi(dbModel,eIntegratorDoc,newDoc,(err,newDoc)=>{
				newDoc.save((err, newDoc2)=>{
					if(dberr(err))
						cb(newDoc2)
				})  
			})
		}
	})
}


function put(dbModel,member,req,res,cb){
	if(req.params.param2==undefined)
		error.param2(req)

	var data = req.body || {}
	data._id = req.params.param2
	data.modifiedDate = new Date()
	data=fazlaliklariTemizleDuzelt(data)

	dbModel.despatches.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				data=util.amountValueFixed2Digit(data,'')
				var doc2 = Object.assign(doc, data)
				var newDoc = new dbModel.despatches(doc2)
				epValidateSync(newDoc)
				newDoc.save((err, newDoc2)=>{
					if(dberr(err)){
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

function getDespatchList(ioType,dbModel,member,req,res,cb){
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

function getDespatch(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false
	var select='-additionalDocumentReference'
	if(includeAdditionalDocumentReference==true)
		select=''

	if(_id=='')
		error.param2(req)

	dbModel.despatches.findOne({_id:_id}).select(select).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				if(!req.query.print){
					var data=doc.toJSON()
					cb(data)
				}else{
					yazdir(dbModel,'despatch',req,res,doc,(err,html)=>{
						if(dberr(err))
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
		if(dberr(err)){
			if(doc2.eIntegrator.despatch.url=='')
				return printHelper.print(dbModel,'despatch',doc, designId, cb)
			dbModel.services.eDespatch.xsltView(doc2,(err,html)=>{
				cb(err,html)
			})
		}
	})
}

function getDespatchLogs(dbModel,member,req,res,cb){
	var _id= req.params.param2 || req.query._id || ''
	var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false
	var select='-additionalDocumentReference'
	if(includeAdditionalDocumentReference==true)
		select=''

	if(_id=='')
		error.param2(req)

	dbModel.despatches.findOne({_id:_id}).select(select).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				doc.populate('eIntegrator').execPopulate((err,doc2)=>{
					if(dberr(err)){
						if(doc2.eIntegrator.despatch.url=='')
							throw {code:'EDESPATCH_ERROR',message:'irsaliye icin entegrator web servisi tanimlanmamis'}
						dbModel.services.eDespatch.logs(doc2,(err,data)=>{
							if(dberr(err))
								cb(data)

						})
					}
				})
			}
		}
	})
}

function getEDespatchUserList(dbModel,member,req,res,cb){
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
	var filter={despatchStatus:{$in:['Draft','Error']},_id:{$in:idList}}

	dbModel.despatches.find(filter).populate(populate).exec((err,docs)=>{
		if(dberr(err)){
			var index=0

			function pushTask(cb){
				if(index>=docs.length)
					return cb(null)
				var taskdata={taskType:'edespatch_send_to_gib',collectionName:'despatches',documentId:docs[index]._id,document:docs[index].toJSON()}
				taskHelper.newTask(dbModel, taskdata,(err,taskDoc)=>{
					if(!err){
						docs[index].despatchStatus='Pending'

						docs[index].save((err)=>{
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
