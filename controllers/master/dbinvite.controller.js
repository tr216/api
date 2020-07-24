module.exports = (member, req, res, next, cb)=>{
	if(req.params.param1==undefined)
		error.param1(req)

	switch(req.method){
		case 'GET':
		if(req.params.param2=='invite'){
			getMemberList(member,req,res,cb)
		}else{
			if(req.params.param2!=undefined){
				getOne(member,req,res,cb)
			}else{
				getList(member,req,res,cb)
			}
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
		error.method(req,next)
		break
	}
}



function getList(member,req,res,cb){
	var filter={}
	filter={deleted:false,_id:req.params.param1,owner:member._id}
	db.dbdefines.findOne(filter).populate([{path:'authorizedMembers.memberId', select:'_id username'}]).exec((err,doc)=>{
		if(dberr(err, next)){
			if(dbnull(doc, next))
				cb(doc)
		}
	})
}

function getOne(member,req,res,cb){
	var filter={}
	filter={deleted:false, _id:req.params.param1,owner:member._id , $or:[{'authorizedMembers.memberId':req.params.param2},{'authorizedMembers._id':req.params.param2}]}

	db.dbdefines.findOne(filter).populate([{path:'authorizedMembers.memberId', select:'_id username'}]).exec((err,doc)=>{
		if(dberr(err, next)){
			if(dbnull(doc, next)){
				var result={_id:doc._id,dbName:doc.dbName,
					memberId:doc.authorizedMembers[0].memberId._id,
					username:doc.authorizedMembers[0].memberId.username,
					canRead:doc.authorizedMembers[0].canRead,
					canWrite:doc.authorizedMembers[0].canWrite,
					canDelete:doc.authorizedMembers[0].canDelete
				}
				cb(result)
			}
		}
	})
}

function getMemberList(member,req,res,cb){
	var filter={
		_id:{$ne:member._id},
		username:{ $regex: '.*' + req.query.username + '.*' ,$options: 'i' }
	}

	db.members.find(filter).limit(5).select('_id username name lastName').exec((err,docs)=>{
		if(dberr(err, next))
			cb(docs)
	})
}


function post(member,req,res,cb){

	var data = req.body || {}

	if((data.memberId || '')=='')
		throw {code:'WRONG_PARAMETER',message:'memberId gereklidir.'}

	db.dbdefines.findOne({owner:member._id,_id:req.params.param1,deleted:false},(err,doc)=>{
		if(dberr(err, next)){
			if(dbnull(doc, next)){
				var bFound=false
				doc.authorizedMembers.forEach((e)=>{
					if(e.memberId==data.memberId){
						bFound=true
						return
					}
				})
				if(bFound) 
					throw {code:'ALREADY_EXISTS',message:'Uye zaten bu veri ambarina ekli.'}
				doc.authorizedMembers.push({
					memberId:data.memberId,
					canRead:(data.canRead || false),
					canWrite:(data.canWrite || false),
					canDelete:(data.canDelete || false)
				})
				doc.save((err,doc2)=>{
					if(dberr(err, next))
						cb(doc2.authorizedMembers)
				})
			}
		}
	})

}



function put(member,req,res,cb){
	var data = req.body || {}

	if(req.params.param2==undefined)
		error.param2(req)

	db.dbdefines.findOne({owner:member._id,_id:req.params.param1,deleted:false, $or:[{'authorizedMembers.memberId':req.params.param2},{'authorizedMembers._id':req.params.param2}]},(err,doc)=>{
		if(dberr(err, next)){
			if(dbnull(doc, next)){
				var bFound=false
				doc.authorizedMembers.forEach((e)=>{
					if(e.memberId==req.params.param2 || e._id==req.params.param2){
						bFound=true
						e.canRead=data.canRead || false
						e.canWrite=data.canWrite || false
						e.canDelete=data.canDelete || false
						return
					}
				})
				if(bFound==false)
					dbnull(null)

				doc.save((err,doc2)=>{
					if(dberr(err, next)){
						cb(doc2.authorizedMembers)
					}
				})
			}
		}
	})
}

function deleteItem(member,req,res,cb){
	var data = req.body || {}
	if(req.params.param2==undefined)
		error.param2(req)

	db.dbdefines.findOne({owner:member._id,_id:req.params.param1,deleted:false, $or:[{'authorizedMembers.memberId':req.params.param2},{'authorizedMembers._id':req.params.param2}]},(err,doc)=>{
		if(dberr(err, next)){
			if(dbnull(doc, next)){
				var bFound=false
				doc.authorizedMembers.forEach((e,index)=>{
					if(e.memberId==req.params.param2  || e._id==req.params.param2){
						bFound=true
						doc.authorizedMembers.splice(index,1)
						return
					}
				})
				if(bFound==false)
					dbnull(null)

				doc.save((err,doc2)=>{
					if(dberr(err, next)){
						cb(doc2.authorizedMembers)
					}
				})
			}
		}
	})
}