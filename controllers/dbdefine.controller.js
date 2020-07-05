module.exports = (member, req, res, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
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
		case 'DELETE':
		deleteItem(member,req,res,cb)
		break
		default:
		error.method(req)
		break
	}
}


function getOne(member,req,res,cb){

	var filter = {owner: member._id, deleted:false}
	filter._id=req.params.param1
	db.dbdefines.findOne(filter, function(err, doc) {
		if(dberr(err))
			cb(doc)
	})
}


function getList(member,req,res,cb){
	var options={page: (req.query.page || 1) }
	if((req.query.pageSize || req.query.limit)){
		options.limit=req.query.pageSize || req.query.limit
	}
	var filter = {owner: member._id, deleted:false}

	db.dbdefines.paginate(filter,options,(err, resp)=>{
		if(dberr(err))
			cb(resp)

	})
}


function post(member,req,res,cb){
	var data = req.body || {}
	if(!data.hasOwnProperty("dbName"))
		throw {code: "ERROR", message: "dbName is required."}

	if(data.dbName.trim()=="")
		throw {code: "ERROR", message: "dbName must not be empty."}


	data.owner = member._id


	if(data.hasOwnProperty("resonanceOptions")){
		data.resonanceOptions.resonanceId = data.resonanceOptions.resonanceId.replaceAll(' ','').replaceAll('.','').replaceAll('-','')
	}


	db.dbdefines.findOne({owner:member._id,dbName:data.dbName,deleted:false},function(err,foundDoc){
		if(dberr(err))
			if(foundDoc!=null){
				throw {code: `DB_ALREADY_EXISTS`, message: `Database '${data.dbName}' already exists.`}
			}else{
				var newdoc = new db.dbdefines(data)
				newdoc.save(function(err, newdoc2) {
					if (!err) {
						var userDb=`userdb-${newdoc2._id}`
						var userDbHost=config.mongodb.userAddress
						var dbName=newdoc2.dbName
						newUserDb(newdoc2._id,userDb,userDbHost,dbName,(err)=>{
							if(!err){
								newdoc2.userDb = userDb
								newdoc2.userDbHost = userDbHost
								newdoc2.save(function(err,newdoc3){
									result.data=newdoc3

									cb(result)
								})
							}
						})
					} else {
						throw {code: err.name, message: err.message}
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
			throw {code:'NEW_USERDB',message:err.message}
		}
	})

}


function put(member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	
	var data = req.body || {}
	data._id = req.params.param1
	if(data.hasOwnProperty('resonanceOptions'))
		data.resonanceId = data.resonanceOptions.resonanceId.replaceAll(' ','').replaceAll('.','').replaceAll('-','')
	
	data.modifiedDate = new Date()
	db.dbdefines.findOne({ _id: data._id, owner : member._id}, (err, doc)=>{
		if(dberr(err))
			if(dbnull(doc)){
				var doc2 = Object.assign(doc, data)
				var newdoc = new db.dbdefines(doc2)
				newdoc.save(function(err, newdoc2) {
					if(dberr(err))
						cb(newdoc2)
				})
			}
	})
}

function deleteItem(member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)

	var data = req.body || {}
	data._id = req.params.param1

	db.dbdefines.findOne({ _id: data._id, owner : member._id, deleted:false}, (err, doc)=>{
		if(dberr(err))
			if(dbnull(doc)){
				doc.deleted=true
				doc.modifiedDate = new Date()
				doc.save(function(err, newdoc2) {
					if (err) {
						throw {code: err.name, message: err.message}
					} else {
						cb({success: true})
					}
				})
			}
	})
}