module.exports = (member, req, res, next, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			getOne(member,req,res,next,cb)
		}else{
			getList(member,req,res,next,cb)
		}
		break
		case 'POST':
		post(member,req,res,next,cb)
		break
		case 'PUT':
		put(member,req,res,next,cb)
		break
		case 'DELETE':
		deleteItem(member,req,res,next,cb)
		break
		default:
		error.method(req,next)
		break
	}
}


function getOne(member,req,res,next,cb){

	var filter = {owner: member._id, deleted:false}
	filter._id=req.params.param1
	db.dbdefines.findOne(filter, function(err, doc) {
		if(dberr(err, next))
			cb(doc)
	})
}


function getList(member,req,res,next,cb){
	var options={page: (req.query.page || 1) }
	if((req.query.pageSize || req.query.limit)){
		options.limit=req.query.pageSize || req.query.limit
	}
	var filter = {owner: member._id, deleted:false}

	db.dbdefines.paginate(filter,options,(err, resp)=>{
		if(dberr(err, next))
			cb(resp)

	})
}


function post(member,req,res,next,cb){
	var data = req.body || {}
	if(!data.hasOwnProperty("dbName"))
		return next({code: "ERROR", message: "dbName is required."})

	if(data.dbName.trim()=="")
		return next({code: "ERROR", message: "dbName must not be empty."})


	data.owner = member._id


	if(data.hasOwnProperty("resonanceOptions")){
		data.resonanceOptions.resonanceId = data.resonanceOptions.resonanceId.replaceAll(' ','').replaceAll('.','').replaceAll('-','')
	}


	db.dbdefines.findOne({owner:member._id,dbName:data.dbName,deleted:false},function(err,foundDoc){
		if(dberr(err, next))
			if(foundDoc!=null){
				return next({code: `DB_ALREADY_EXISTS`, message: `Database '${data.dbName}' already exists.`})
			}else{
				var newDoc = new db.dbdefines(data)
				newDoc.save(function(err, newDoc2) {
					if (!err) {
						var userDb=`userdb-${newDoc2._id}`
						var userDbHost=config.mongodb.userAddress
						var dbName=newDoc2.dbName
						newUserDb(newDoc2._id,userDb,userDbHost,dbName,(err)=>{
							if(!err){
								newDoc2.userDb = userDb
								newDoc2.userDbHost = userDbHost
								newDoc2.save(function(err,newDoc3){
									result.data=newDoc3

									cb(result)
								})
							}
						})
					} else {
						next({code: err.name, message: err.message})
					}
				})
			}
		
	})

}


function newUserDb(_id,userDb,userDbHost,dbName,cb){

	loadUserDb(_id,userDb,userDbHost,dbName,(err)=>{
		if(!err){
			cb(null)
		}else{
			next({code:'NEW_USERDB',message:err.message})
		}
	})

}


function put(member,req,res,next,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	
	var data = req.body || {}
	data._id = req.params.param1
	if(data.hasOwnProperty('resonanceOptions'))
		data.resonanceId = data.resonanceOptions.resonanceId.replaceAll(' ','').replaceAll('.','').replaceAll('-','')
	
	data.modifiedDate = new Date()
	db.dbdefines.findOne({ _id: data._id, owner : member._id}, (err, doc)=>{
		if(dberr(err, next))
			if(dbnull(doc, next)){
				var doc2 = Object.assign(doc, data)
				var newDoc = new db.dbdefines(doc2)
				newDoc.save(function(err, newDoc2) {
					if(dberr(err, next))
						cb(newDoc2)
				})
			}
	})
}

function deleteItem(member,req,res,next,cb){
	if(req.params.param1==undefined)
		error.param1(req)

	var data = req.body || {}
	data._id = req.params.param1

	db.dbdefines.findOne({ _id: data._id, owner : member._id, deleted:false}, (err, doc)=>{
		if(dberr(err, next))
			if(dbnull(doc, next)){
				doc.deleted=true
				doc.modifiedDate = new Date()
				doc.save(function(err, newDoc2) {
					if(dberr(err,next)){
						cb({success: true})
					}
				})
			}
	})
}