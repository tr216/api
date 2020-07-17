module.exports = (dbModel, member, req, res, next, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			switch(req.params.param1.toLowerCase()){
				case 'errors':
				getErrors(dbModel, member, req, res, next, cb)
				break
				default:
				getOne(dbModel, member, req, res, next, cb)
				break
			}
			
		}else{
			getList(dbModel, member, req, res, next, cb)
		}
		break
		case 'POST':
		if(req.params.param1=='copy'){
			copy(dbModel, member, req, res, next, cb)
		}else{
			post(dbModel, member, req, res, next, cb)
		}

		break
		case 'PUT':
		put(dbModel, member, req, res, next, cb)
		break
		case 'DELETE':
		deleteItem(dbModel, member, req, res, next, cb)
		break
		default:
		error.method(req)
		break
	}
}

function getList(dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1)

	}
	if(!req.query.page){
		options.limit=50000
	}
	var filter = {}

	dbModel.despatches_receipt_advice.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			cb(resp)
		}
	})
}

function getOne(dbModel, member, req, res, next, cb){
	dbModel.despatches_receipt_advice.findOne({$or:[{_id:req.params.param1},{despatch:req.params.param1}]}).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				cb(doc)
			}
		}
	})
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	data._id=undefined
	data.despatch=data.despatch || ''
	if(data.despatch=='')
		return next({code:'WRONG_VALUE',message:'despatch elemani bos olamaz'})

	var newDoc = new dbModel.despatches_receipt_advice(data)
	epValidateSync(newDoc)
	dbModel.despatches.findOne({_id:data.despatch,ioType:1},(err,despatchDoc)=>{
		if(dberr(err,next)){
			if(dbnull(despatchDoc,next,`Irsaliye bulunamadi _id:${data.despatch}`)){
				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next)){
						despatchDoc.despatchReceiptAdvice=newDoc2._id
						despatchDoc.save((err,despatchDoc2)=>{
							cb(newDoc2)	
						})
					}
				})
			}
		}
	})
	
}


function getErrors(dbModel, member, req, res, next, cb){
	var _id= req.params.param2 || req.query._id || ''
	var select='-receiptAdviceLineInfo'

	if(_id=='') 
		error.param2(req)
	dbModel.despatches_receipt_advice.findOne({_id:_id},select).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var data=doc.toJSON()
				cb(data)
			}
		}
	})
}


function put(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param1(req)

	var data = req.body || {}

	if(data.despatch=='')
		return next({code:'WRONG_VALUE',message:'despatch elemani bos olamaz'})

	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.despatches.findOne({_id:data.despatch,ioType:1},(err,despatchDoc)=>{
		if(dberr(err,next)){
			if(dbnull(despatchDoc,next,`Irsaliye bulunamadi _id:${data.despatch}`)){

				dbModel.despatches_receipt_advice.findOne({ _id: data._id},(err,doc)=>{
					if(dberr(err,next)){
						if(dbnull(doc,next)){
							var doc2 = Object.assign(doc, data)
							var newDoc = new dbModel.despatches_receipt_advice(doc2)
							epValidateSync(newDoc)
							newDoc.save((err, newDoc2)=>{
								if(dberr(err,next)){
									despatchDoc.despatchReceiptAdvice=newDoc2._id
									despatchDoc.save((err,despatchDoc2)=>{
										cb(newDoc2)	
									})
								}
							})
						}
					}
				})
				
			}
		}
	})
}


function deleteItem(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param1(req)
	
	var data = req.body || {}
	data._id = req.params.param1

	dbModel.despatches_receipt_advice.findOne({_id:data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				if(doc.status=='Sent'){
					return next({code:'PERMISSION_DENIED',message:`Belgenin durumundan dolayi silinemez!`})
				}else{
					dbModel.despatches_receipt_advice.removeOne(member,{ _id: data._id},(err,doc)=>{
						if(dberr(err,next)){
							cb(null)
						}
					})
				}
			}
		}
	})
}
