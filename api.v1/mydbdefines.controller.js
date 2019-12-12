module.exports = function(member, req, res, callback) {

    switch(req.method){
        case 'GET':
            if(req.params.param1!=undefined){
                getOne(member,req,res,callback);
            }else{
                getList(member,req,res,callback);
            }
            
        break;
        
        default:
            callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }
}

function getList(member,req,res,callback){
    db.dbdefines.find({deleted:false, passive:false, $or:[{owner:member._id},{'authorizedMembers.memberId':member._id}]}).populate('owner','_id username name lastName').exec((err,docs)=>{
        if(!err){
            var data=[];
            for(var d=0;d<docs.length;d++){
                var auth={owner:false,canRead:false,canWrite:false,canDelete:false};

                if(docs[d].owner._id==member._id){
                    auth.owner=true;
                    auth.canRead=true;
                    auth.canWrite=true;
                    auth.canDelete=true;
                }else{
                    for(var i=0;i<docs[d].authorizedMembers.length;i++){
                        if(docs[d].authorizedMembers[i].memberId==member._id){
                            auth.canRead=docs[d].authorizedMembers[i].canRead;
                            auth.canWrite=docs[d].authorizedMembers[i].canWrite;
                            auth.canDelete=docs[d].authorizedMembers[i].canDelete;
                            break;
                        }
                    }
                }
                if(auth.canRead){
                    data.push({_id:docs[d]._id,dbName:docs[d].dbName,owner:docs[d].owner, auth:auth});
                }
            }
            
            callback({success:true,data:data});
        }else{
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function getOne(member,req,res,callback){
    db.dbdefines.findOne({_id:req.params.param1, deleted:false, passive:false,owner:member._id}).populate('authorizedMembers.memberId','_id username name lastName').exec((err,doc)=>{
        if(dberr(err,callback)){
            if(dbnull(doc,callback)){
                callback({success:true,data:doc});
            }
        }
    });
}