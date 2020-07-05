module.exports = (dbModel, member, req, res, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			getOne(dbModel,member,req,res,cb)
		}else{
			getList(dbModel,member,req,res,cb)
		}
		break
		case 'POST':
		if(req.params.param1=='copy'){
			copy(dbModel,member,req,res,cb)
		}else{
			post(dbModel,member,req,res,cb)
		}
		break
		case 'PUT':
		put(dbModel,member,req,res,cb)
		break
		case 'DELETE':
		deleteItem(dbModel,member,req,res,cb)
		break
		default:
		error.method(req)
		break
	}

}

function copy(dbModel,member,req,res,cb){
	var id=req.params.param2 || req.body['id'] || req.query.id || ''
	var newName=req.body['newName'] || req.body['name'] || ''

	if(id=='')
		error.param2(req)

	dbModel.accounts.findOne({ _id: id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var data=doc.toJSON()
				data._id=undefined
				delete data._id
				if(newName!='')
					data.name=newName
				else
					data.name +=' copy'

				yeniHesapKodu(dbModel,doc,(yeniKod)=>{
					if(dberr(err)){
						data.code=yeniKod
						var newdoc = new dbModel.accounts(data)
						epValidateSync(newdoc)
						newdoc.save((err, newdoc2)=>{
							if(dberr(err))
								cb(newdoc2)
						})
					}
				})

			}
		}
	})
}

function yeniHesapKodu(dbModel,sourceDoc,cb){
	dbModel.accounts.find({parentAccount: (sourceDoc.parentAccount || null), code:{$ne:''}}).sort({code:-1}).limit(1).exec((err,docs)=>{
		if(dberr(err)){
			if(docs.length==0)
				return cb('001')
			cb(util.incString(docs[0].code))
		}
	})
}

function getList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1),
		sort:{accountCode:1}
	}
	if(!req.query.page)
		options.limit=50000

	var filter = {}

	if((req.query.code || req.query.accountCode || '')!='')
		filter['accountCode']={ $regex: '' + (req.query.code || req.query.accountCode) + '.*' ,$options: 'i' }
	
	if((req.query.name || '')!='')
		filter['name']={ $regex: '.*' + req.query.name + '.*' ,$options: 'i' }

	dbModel.accounts.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		}
	})
}

function getOne(dbModel,member,req,res,cb){
	dbModel.accounts.findOne({_id:req.params.param1}).populate([{path:'parentAccount',select:'_id accountCode name'}]).exec((err,doc)=>{
		if(dberr(err)){
			cb(doc)
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined

	if((data.parentAccount || '')=='')
		data.parentAccount=undefined

	var newdoc = new dbModel.accounts(data)

	epValidateSync(newdoc)

	newdoc.save((err, newdoc2)=>{
		if(dberr(err)){
			cb(newdoc2)
		}
	})
}

function put(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data=req.body || {}
	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.accounts.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.accounts(doc2)
				epValidateSync(newdoc)

				newdoc.save((err, newdoc2)=>{
					if(dberr(err))
						cb(newdoc2)
				})
			}
		}
	})
}

function deleteItem(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)

	var data = req.body || {}
	data._id = req.params.param1
	dbModel.accounts.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err))
			cb(null)
	})
}
