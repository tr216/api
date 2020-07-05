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
		error.method(req)
		break
		case 'PUT':
		put(dbModel,member,req,res,cb)
		break
		case 'DELETE':
		error.method(req)
		break
		default:
		error.method(req)
		break
	}
}

function getList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1)}
	if(!req.query.page){
		options.limit=50000
	}
	var filter = {}

	if((req.query.name || req.query.parameter || '')!='')
		filter['parameter']={ $regex: '.*' + (req.query.name || req.query.parameter) + '.*' ,$options: 'i' }

	if((req.query.desc || req.query.description || '')!='')
		filter['description']={ $regex: '.*' + (req.query.desc || req.query.description) + '.*' ,$options: 'i' }

	dbModel.variables.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		}
	})
}

function getOne(dbModel,member,req,res,cb){
	dbModel.variables.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err)){
			cb(doc)
		}
	})
}


function put(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data=req.body || {}
	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.variables.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.variables(doc2)
				epValidateSync(newdoc)

				newdoc.save((err, newdoc2)=>{
					if(dberr(err))
						cb(newdoc2)
				})
			}
		}
	})
}

