var jwt = require('jsonwebtoken')



module.exports= function (req, res,cb) {
    var token = req.body.token || req.query.token || req.headers['x-access-token']  || req.headers['token']
    if (token) {
        jwt.verify(token, 'gizliSir', function (err, decoded) {
            if (err) {
                cb({ code: 'FAILED_TOKEN', message: 'Yetki hatasi' })
            } else {
                var dbId=req.params.dbId || ''
                if(decoded.isSysUser==false){  //normal member
                    db.dbdefines.findOne({_id:dbId, $or:[{owner:decoded._id},{'authorizedMembers.memberId':decoded._id}]},(err,doc)=>{
                        if(dberr(err,cb))
                        	if(dbnull(doc,cb)){
                        		 var auth={owner:false,canRead:false,canWrite:false,canDelete:false}

	                            if(doc.owner==decoded._id){
	                                auth.owner=true
	                                auth.canRead=true
	                                auth.canWrite=true
	                                auth.canDelete=true
	                            }else{
	                            	doc.authorizedMembers.forEach((e)=>{
	                            		if(e.memberId==decoded._id){
	                                        auth.canRead=e.canRead
	                                        auth.canWrite=e.canWrite
	                                        auth.canDelete=e.canDelete
	                                        return
	                                    }
	                            	})
	                               
	                            }
	                            var data={member:decoded,auth:auth}
	                            
	                            if(auth.canRead==false){
	                                throw { code: 'REPO_AUTHECTICATION_ERROR', message: 'Bu veri ambarina erisim yetkiniz yok.' }
	                            }else{
	                                if(auth.canWrite==false && (req.method=='POST' || req.method=='PUT')){
	                                    throw { code: 'REPO_AUTHECTICATION_ERROR', message: 'Bu veri ambarina yazma yetkiniz yok.' }
	                                }
	                                if(auth.canDelete==false && req.method=='DELETE'){
	                                    throw { code: 'REPO_AUTHECTICATION_ERROR', message: 'Bu veri ambarinda silme yetkiniz yok.' }
	                                }
	                                cb(data)
	                            }
                        	}                      
                    })
                }else{    //sysusers
                    db.dbdefines.findOne({_id:dbId},(err,doc)=>{
                        if(dberr(err,cb))
                        	if(dbnull(doc,cb)){
                        		var auth={owner:true,canRead:true,canWrite:true,canDelete:true}
	                            var data={member:decoded,auth:auth}
	                            cb(data)
                        	}
                    })
                }
            }
        })
    } else {
        throw {code:`WRONG NO_TOKEN_PROVIDED`, message:`Yetki hatasi`}
    }

}