module.exports = (member, req, res, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1){
			getOne(member,req,res,cb)
		}else{
			getList(member,req,res,cb)
		}
		break
		case 'POST':
		post(member,req,res,cb)
		break
		case 'PUT':
		put(member,req,res,cb)
		break
		default:
		error.method(req)
		break
	}
}

function getList(member,req,res,cb){
	var options={
		page: (req.query.page || 1)
	}
	if(!req.query.page){
		options.limit=50000
	}
	var filter = {}
	if(req.query.username){
		filter['username']={ $regex: '.*' + req.query.username + '.*' ,$options: 'i' }
	}
	db.members.paginate(filter,options,(err, resp)=>{
		if(dberr(err))
			cb(resp)
	})
}

function getOne(member,req,res,cb){
	db.members.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err))
			cb(doc)
	})
}

function post(member,req,res,cb){
	var data = req.body || {}
	
	var newdoc = new db.members(data)
	epValidateSync(newdoc)
	newdoc.save(function(err, newdoc2) {
		if(dberr(err))
			cb(newdoc2)
		
	})

	
}

function put(member,req,res,cb){
	if(req.params.param1==undefined){
		cb({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}})
	}else{
		var data = req.body || {}
		
		data._id = req.params.param1
		data.modifiedDate = new Date()

		db.members.findOne({ _id: data._id},(err,doc)=>{
			if(dberr(err))
				if(dbnull(doc)){
					
					var doc2 = Object.assign(doc, data)
					var newdoc = new db.members(doc2)
					epValidateSync(newdoc)
					newdoc.save(function(err, newdoc2) {
						if(dberr(err))
							cb(newdoc2)
					})
					
				}
				
			})
	}
}

function deleteItem(member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	
	var data = req.body || {}
	data._id = req.params.param1
	db.members.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err))
			cb(null)
	})
	
}
