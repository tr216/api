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

var locationTypes=[
{"text":"(0)Depo","value": 0},
{"text":"(1)Magaza","value": 1},
{"text":"(2)Uretim","value":2},
{"text":"(3)Iade","value":3},
{"text":"(4)Seyyar","value":4},
{"text":"(5)Diger","value":5}
]

function getList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1)}
	if(!req.query.page)
		options.limit=50000
	
	var filter = {}

	if((req.query.name || '')!='')
		filter['passive']={ $regex: '.*' + req.query.name + '.*' ,$options: 'i' }
	

	if((req.query.locationType || '')!=''){
		// if(Number(req.query.locationType>=0)){
		filter['locationType']=req.query.locationType
		// }
	}

	if((req.query.passive || '')!='')
		filter['passive']=req.query.passive
	
	dbModel.locations.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			// resp.docs.forEach((doc)=>{
			// 	doc['locationTypeName']=''
			// 	locationTypes.forEach((e)=>{
			// 		if(e.value==doc.locationType){
			// 			doc['locationTypeName']=e.text
			// 			return
			// 		}
			// 	})
			// })
			cb(resp)
		}
	})
}

function getOne(dbModel,member,req,res,cb){
	dbModel.locations.findOne({_id:req.params.param1},(err,doc)=>{
		if(dberr(err)){
			cb(doc)
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined

	var newdoc = new dbModel.locations(data)
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

	dbModel.locations.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new dbModel.locations(doc2)
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
	dbModel.locations.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			cb(null)
		}
	})
}
