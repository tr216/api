module.exports = (dbModel, member, req, res, next, cb)=>{

	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			getOne(dbModel, member, req, res, next, cb)
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
		error.method(req, next)
		break
	}

}

function copy(dbModel, member, req, res, next, cb){
	var id=req.params.param2 || req.body['id'] || req.query.id || ''
	var newName=req.body['newName'] || req.body['name'] || ''

	if(id=='')
		error.param2(req)

	dbModel.account_groups.findOne({ _id: id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var data=doc.toJSON()
				data._id=undefined
				delete data._id
				if(newName!=''){
					data.name=newName
				}else{
					data.name +=' copy'
				}

				var newDoc = new dbModel.account_groups(data)
				if(!epValidateSync(newDoc,next))
					return

				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next)){
						cb(newDoc2)
					}
				})
			}
		}
	})
}

function getList(dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1),
		populate:[
		{path:'account',select:'_id accountCode name'},
		{path:'salesAccount',select:'_id accountCode name'},
		{path:'returnAccount',select:'_id accountCode name'},

		{path:'exportSalesAccount',select:'_id accountCode name'},
		{path:'salesDiscountAccount',select:'_id accountCode name'},
		{path:'buyingDiscountAccount',select:'_id accountCode name'},
		{path:'costOfGoodsSoldAccount',select:'_id accountCode name'}
		],
		sort:{name:1}

	}
	if(!req.query.page)
		options.limit=50000

	var filter = {}

	if((req.query.name || '')!='')
		filter['name']={ '$regex': '.*' + req.query.name + '.*' ,'$options': 'i' }

	dbModel.account_groups.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			cb(resp)
		}
	})
}

function getOne(dbModel, member, req, res, next, cb){
	dbModel.account_groups.findOne({_id:req.params.param1}).exec((err,doc)=>{
		if(dberr(err,next)){
			cb(doc)
		}
	})
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	data._id=undefined

	data=veriTemizle(data)

	var newDoc = new dbModel.account_groups(data)
	if(!epValidateSync(newDoc,next))
		return

	newDoc.save((err, newDoc2)=>{
		if(dberr(err,next)){
			cb(newDoc2)
		}
	})
}

function put(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param2(req)

	var data=req.body || {}
	data._id = req.params.param1
	data.modifiedDate = new Date()

	data=veriTemizle(data)

	dbModel.account_groups.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var doc2 = Object.assign(doc, data)
				var newDoc = new dbModel.account_groups(doc2)
				if(!epValidateSync(newDoc,next))
					return

				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next))
						cb(newDoc2)
				})
			}
		}
	})
}

function veriTemizle(data){
	if((data.account || '')=='')
		data.account=undefined
	if((data.salesAccount || '')=='')
		data.salesAccount=undefined
	if((data.returnAccount || '')=='')
		data.returnAccount=undefined
	if((data.exportSalesAccount || '')=='')
		data.exportSalesAccount=undefined
	if((data.salesDiscountAccount || '')=='')
		data.salesDiscountAccount=undefined
	if((data.buyingDiscountAccount || '')=='')
		data.buyingDiscountAccount=undefined
	if((data.costOfGoodsSoldAccount || '')=='')
		data.costOfGoodsSoldAccount=undefined
	return data
}

function deleteItem(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)
	var data = req.body || {}
	data._id = req.params.param1
	dbModel.account_groups.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			cb(null)
		}
	})
}
