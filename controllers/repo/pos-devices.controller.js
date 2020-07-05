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
		post(dbModel,member,req,res,cb)
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

function getList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1), 
		populate:[
		{path:'location',select:'_id locationName'},
		{path:'service',select:'_id name serviceType'},
		{path:'localConnector',select:'_id name'}
		]
	}

	if((req.query.pageSize || req.query.limit))
		options['limit']=req.query.pageSize || req.query.limit


	var filter = {}
	if((req.query.deviceSerialNo || '')!='')
		filter['deviceSerialNo']={ $regex: '.*' + req.query.deviceSerialNo + '.*' ,$options: 'i' }

	if((req.query.deviceModel || '')!='')
		filter['deviceModel']={ $regex: '.*' + req.query.deviceModel + '.*' ,$options: 'i' }

	if((req.query.location || '')!='')
		filter['location']=req.query.location

	if((req.query.service || '')!='')
		filter['service']=req.query.service

	if((req.query.localConnector || '')!='')
		filter['localConnector']=req.query.localConnector

	if((req.query.passive || '')!='')
		filter['passive']=req.query.passive

	dbModel.pos_devices.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		}
	})
}

function getOne(dbModel,member,req,res,cb){
	dbModel.pos_devices.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err)){
			cb(doc)
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined

	var newdoc = new dbModel.pos_devices(data)
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
	var data = req.body || {}

	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.pos_devices.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.pos_devices(doc2)
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
	dbModel.pos_devices.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			cb(null)
		}
	})
}
