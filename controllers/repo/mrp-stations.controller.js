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
		{path:'location',select:'_id locationName'}
		]
	}

	if((req.query.pageSize || req.query.limit))
		options['limit']=req.query.pageSize || req.query.limit
	

	var filter = {}

	if((req.query.passive || '')!='')
		filter['passive']=req.query.passive

	if((req.query.name || '')!='')
		filter['name']={ $regex: '.*' + req.query.name + '.*' ,$options: 'i' }
	
	if((req.query.description || '')!='')
		filter['description']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' }

	if((req.query.location || '')!='')
		filter['location']=req.query.location

	dbModel.mrp_stations.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		}
	})
}

function getOne(dbModel,member,req,res,cb){
	dbModel.mrp_stations.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err)){
			cb(doc)
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined
	
	var newdoc = new dbModel.mrp_stations(data)
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

	dbModel.mrp_stations.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.mrp_stations(doc2)
				epValidateSync(newdoc)
				newdoc.save((err, newdoc2)=>{
					if(dberr(err)){
						cb(newdoc2)
					} 
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
	dbModel.mrp_stations.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			cb(null)
		}
	})
}
