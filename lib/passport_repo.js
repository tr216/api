var jwt = require('jsonwebtoken');

module.exports= function (req, res,cb) {
    var token = req.body.token || req.query.token || req.headers['x-access-token']  || req.headers['token'];
    if (token) {
        jwt.verify(token, 'gizliSir', function (err, decoded) {
            if (err) {
                cb({ code: 'FAILED_TOKEN', message: 'Yetki hatasi' });
            } else {
                var dbId=req.params.dbId || '';
                if(decoded.isSysUser==false){  //normal member
                    db.dbdefines.findOne({_id:dbId, $or:[{owner:decoded._id},{'authorizedMembers.memberId':decoded._id}]},(err,doc)=>{
                        if(!err){

                            var auth={owner:false,canRead:false,canWrite:false,canDelete:false};

                            if(doc.owner==decoded._id){
                                auth.owner=true;
                                auth.canRead=true;
                                auth.canWrite=true;
                                auth.canDelete=true;
                            }else{
                                for(var i=0;i<doc.authorizedMembers.length;i++){
                                    if(doc.authorizedMembers[i].memberId==decoded._id){
                                        auth.canRead=doc.authorizedMembers[i].canRead;
                                        auth.canWrite=doc.authorizedMembers[i].canWrite;
                                        auth.canDelete=doc.authorizedMembers[i].canDelete;
                                        break;
                                    }
                                }
                            }
                            var data={member:decoded,auth:auth}
                            
                            if(auth.canRead==false){
                                cb({ code: 'REPO_AUTHECTICATION_ERROR', message: 'Bu veri ambarina erisim yetkiniz yok.' });
                            }else{
                                if(auth.canWrite==false && (req.method=='POST' || req.method=='PUT')){
                                    return cb({ code: 'REPO_AUTHECTICATION_ERROR', message: 'Bu veri ambarina yazma yetkiniz yok.' });
                                }
                                if(auth.canDelete==false && req.method=='DELETE'){
                                    return cb({ code: 'REPO_AUTHECTICATION_ERROR', message: 'Bu veri ambarinda silme yetkiniz yok.' });
                                }
                                cb(null,data);
                            }
                        }else{
                            cb({ code: 'REPO_PASSPORT_ERROR', message: err.message });
                        }
                    });
                }else{    //sysusers
                    db.dbdefines.findOne({_id:dbId},(err,doc)=>{
                        if(!err){

                            var auth={owner:true,canRead:true,canWrite:true,canDelete:true};

                           
                            var data={member:decoded,auth:auth};
                            cb(null,data);
                        }else{
                            cb({ code: 'REPO_PASSPORT_ERROR', message: err.message });
                        }
                    });
                }
            }
        });
    } else {
        cb({ code: 'NO_TOKEN_PROVIDED', message: 'Yetki hatasi' });
    }

}