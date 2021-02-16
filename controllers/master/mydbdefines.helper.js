exports.getList=function(member,req,res,next,cb){
	db.dbdefines.find({deleted:false, passive:false, $or:[{owner:member._id},{'authorizedMembers.memberId':member._id}]}).populate('owner','_id username name lastName modules').exec((err,docs)=>{
		if(!err){
			console.log(`mydbdefines member._id:`,member._id)
			
			var data=[]
			docs.forEach((e)=>{
				console.log(`mydbdefines db:`,e.dbName)
				var auth={owner:false,canRead:false,canWrite:false,canDelete:false}

				if(e.owner._id.toString()==member._id.toString()){
					auth.owner=true
					auth.canRead=true
					auth.canWrite=true
					auth.canDelete=true
				}else{
					e.authorizedMembers.forEach((e2)=>{
						if(e2.memberId.toString()==member._id.toString()){
							auth.canRead=e2.canRead
							auth.canWrite=e2.canWrite
							auth.canDelete=e2.canDelete
							return
						}
					})
				}
				if(auth.canRead){
					data.push({_id:e._id,dbName:e.dbName,owner:e.owner, auth:auth})
				}
			})
			cb(data)
			// preparePageSettings(data,(err,data2)=>{
			// 	if(!err){
			// 		cb(data2)
			// 	}else{
			// 		next(err)
			// 	}
				
			// })
			
		}else{
			next({code: err.name, message: err.message})
		}
	})
}

exports.getOne=function(member,req,res,next,cb){
	db.dbdefines.findOne({_id:req.params.param1, deleted:false, passive:false,owner:member._id}).populate('owner','_id username name lastName modules').populate('authorizedMembers.memberId','_id username name lastName').exec((err,doc)=>{
		if(dberr(err, next)){
			if(dbnull(doc, next)){
				
				cb(doc)
			}
		}
	})
}

function preparePageSettings(databases,callback){
	iteration(databases,(dbItem,cb)=>{
		if(!dbItem.settings.page)
			return cb(null)
		var sayfalar=Object.keys(dbItem.settings.page)

		iteration(sayfalar,(sayfa,cb2)=>{
			var programs=clone(dbItem.settings.page[sayfa].programs)
			dbItem.settings.page[sayfa].programs=[]
			
			iteration(programs,(prg,cb3)=>{

				var prgFilter={passive:false}
				if(typeof prg=='string'){
					prgFilter['_id']=prg
				}else{
					prgFilter['_id']=prg._id || prg.id || ''
				}
				
				repoDb[dbItem._id].programs.findOne(prgFilter).select('_id type name showButtonText icon').exec((err,prgDoc)=>{
					if(!err){
						if(prgDoc!=null){
							dbItem.settings.page[sayfa].programs.push({_id:prgDoc._id.toString(),type:prgDoc.type,name:prgDoc.name,showButtonText:(prgDoc.showButtonText || false),icon:(prgDoc.icon || '')})
						}
						cb3(null)
					}else{
						cb3(err)
					}
				})
			},0,true,cb2)

		},0,true,cb)

	},0,true,(err)=>{
		callback(null,databases)
	})
}