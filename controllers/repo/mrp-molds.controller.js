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
	var options={page: (req.query.page || 1)
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



	if((req.query.station || '')!='')
		filter['station']=req.query.station

	if((req.query.moldGroup || '')!='')
		filter['moldGroup']=req.query.moldGroup

	if((req.query.machineGroup || '')!='')
		filter['machineGroup']=req.query.machineGroup

	if((req.query.recipe || '')!=''){
		dbModel.recipes.findOne({_id:req.query.recipe},(err,recipeDoc)=>{
			if(dberr(err)){
				if(dbnull(recipeDoc,cb)){
					var dizi=[]
					var processIndex=-1
					if((req.query.processIndex || '')!='')
						processIndex=Number(req.query.processIndex)

					recipeDoc.process.forEach((e,index)=>{
						if(processIndex<0 || processIndex==index){
							e.machines.forEach((e2)=>{
								dizi.push(e2.mold)    
							})
						}
					})

					filter['_id']={$in:dizi}
					dbModel.mrp_molds.paginate(filter,options,(err, resp)=>{
						if(dberr(err)){
							cb(resp)
						}
					})

				}
			}
		})
	}else{
		dbModel.mrp_molds.paginate(filter,options,(err, resp)=>{
			if(dberr(err)){
				cb(resp)
			}
		})
	}
}

function getOne(dbModel,member,req,res,cb){
	dbModel.mrp_molds.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err)){
			cb(doc)
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined
	if((data.account || '')=='')
		data.account=undefined


	var newdoc = new dbModel.mrp_molds(data)
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
	if((data.account || '')=='')
		data.account=undefined

	dbModel.mrp_molds.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.mrp_molds(doc2)
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
	dbModel.mrp_molds.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			cb(null)
		}
	})
}
