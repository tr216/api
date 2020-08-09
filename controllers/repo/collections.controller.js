module.exports = (dbModel, member, req, res, next, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			getOne(dbModel, member, req, res, next, cb)
		}else{
			getList(dbModel, member, req, res, next, cb)
		}
		break

		default:
		error.method(req, next)
		break
	}

}

function getList(dbModel, member, req, res, next, cb){
	var keys=[]
	var forbiddens=['_id', 'name', 'conn', 'dbName', 'userDb', 'settings', 'recycle', 'actions','variables']
	Object.keys(dbModel).forEach((e)=>{
		bFound=false
		forbiddens.forEach((f)=>{
			if(f==e){
				bFound=true
				return 
			}
		})
		if(!bFound)
			keys.push(e)
	})
	cb(keys)
}

function getOne(dbModel, member, req, res, next, cb){
	if(dbModel[req.params.param1]==undefined){
		next({code:'NOT_FOUND',message:`'${req.params.param1}' collection bulunamadi`})
	}else{
		dbModel[req.params.param1].find({}).sort({_id:-1}).limit(1).exec((err,docs)=>{
			if(dberr(err,next)){
				cb(docs)
			}
		})
	}
	

}

