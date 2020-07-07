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
		post(dbModel, member, req, res, next, cb)
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
	var options={page: (req.query.page || 1)}
	if(!req.query.page){
		options.limit=50000
	}
	var filter = {}

	if((req.query.passive || '')!='')
		filter['passive']=req.query.passive


	if((req.query.name || '')!='')
		filter['name']={ $regex: '.*' + req.query.name  + '.*' ,$options: 'i' }

	dbModel.shifts.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			cb(resp)
		}
	})
}

function getOne(dbModel, member, req, res, next, cb){
	dbModel.shifts.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err,next)){
			cb(doc)
		}
	})
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	data._id=undefined

	var newdoc = new dbModel.shifts(data)
	epValidateSync(newdoc)

	timesCheck(newdoc,(err)=>{
		if(dberr(err,next)){
			newdoc.save((err, newdoc2)=>{
				if(dberr(err,next)){
					cb(newdoc2)
				} 
			})
		}
	})
}

function put(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data=req.body || {}
	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.shifts.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.shifts(doc2)
				epValidateSync(newdoc)

				timesCheck(newdoc,(err)=>{
					if(dberr(err,next)){
						newdoc.save((err, newdoc2)=>{
							if(dberr(err,next)){
								cb(newdoc2)
							} 
						})
					}
				})

			}
		}
	})
}

function timesCheck(data,cb){
	if(!data.times) return cb(null)
		var dizi=[]
	var err=null
	data.times.forEach((e,index)=>{
		if((e.startHour || 0)==(e.endHour || 0)){
			err={code:'SYNTAX_ERROR',message:'Satir ' + (index+1).toString() + ' baslangic ve bitis saatleri ayni olamaz!' }
			return
		}
	})
	cb(err)
}

function deleteItem(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data = req.body || {}
	data._id = req.params.param1
	dbModel.shifts.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			cb(null)
		}
	})
}