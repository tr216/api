module.exports = function(member, req, res, callback) {
    eventLog('req.params:',req.params);
    if(req.params.param1==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});

    switch(req.method){
        case 'GET':

            if(req.params.param2=='invite'){
                getMemberList(member,req,res,callback);
            }else{
                if(req.params.param2!=undefined){
                    getOne(member,req,res,callback);
                }else{
                    getList(member,req,res,callback);
                }
                
            }
            
        break;
        case 'POST':
        post(member,req,res,callback);
        break;
        case 'PUT':
        put(member,req,res,callback);
        break;
        case 'DELETE':
        deleteItem(member,req,res,callback);
        break;
        default:
        callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }
}


   
function getList(member,req,res,callback){
    var filter={}
    filter={deleted:false,_id:req.params.param1,owner:member._id};
    eventLog('filter:',filter);
    db.dbdefines.findOne(filter).populate([{path:'authorizedMembers.memberId', select:'_id username'}]).exec((err,doc)=>{
        if(dberr(err,callback))
            if(dbnull(doc,callback)){
                callback({success:true,data:doc});
            }
        
    });
}

function getOne(member,req,res,callback){
    var filter={}
    filter={deleted:false, _id:req.params.param1,owner:member._id , $or:[{'authorizedMembers.memberId':req.params.param2},{'authorizedMembers._id':req.params.param2}]}
    
    db.dbdefines.findOne(filter).populate([{path:'authorizedMembers.memberId', select:'_id username'}]).exec((err,doc)=>{
        if(dberr(err,callback))
            if(dbnull(doc,callback)){
                var result={_id:doc._id,dbName:doc.dbName,
                    memberId:doc.authorizedMembers[0].memberId._id,
                    username:doc.authorizedMembers[0].memberId.username,
                    canRead:doc.authorizedMembers[0].canRead,
                    canWrite:doc.authorizedMembers[0].canWrite,
                    canDelete:doc.authorizedMembers[0].canDelete
                }
                callback({success:true,data:result});
            }
        
    });
}

function getMemberList(member,req,res,callback){
    var filter={}

    filter={
        _id:{$ne:member._id},
        username:{ $regex: '.*' + req.query.username + '.*' ,$options: 'i' }
    }
    
    db.members.find(filter).limit(5).select('_id username name lastName').exec((err,docs)=>{
        
        if(dberr(err,callback)){
            callback({success:true,data:docs});
        }
    });
}


function post(member,req,res,callback){

    var data = req.body || {}

    if((data.memberId || '')=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'memberId gereklidir.'}});

    db.dbdefines.findOne({owner:member._id,_id:req.params.param1,deleted:false},(err,doc)=>{
        if (dberr(err,callback)) {
            if(dbnull(doc,callback)){
                var bFound=false;
                doc.authorizedMembers.forEach((e)=>{
                    if(e.memberId==data.memberId){
                        bFound=true;
                        return;
                    }
                });
                if(bFound) return callback({success:false,error:{code:'ALREADY_EXISTS',message:'Uye zaten bu veri ambarina ekli.'}});
                doc.authorizedMembers.push({
                    memberId:data.memberId,
                    canRead:(data.canRead || false),
                    canWrite:(data.canWrite || false),
                    canDelete:(data.canDelete || false)
                });
                doc.save((err,doc2)=>{
                    if(dberr(err,callback)){
                        callback({success:true,data:doc2.authorizedMembers});
                    }
                });
            }
        }
    });

}



function put(member,req,res,callback){
    var data = req.body || {}

    if(req.params.param2==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre.'}});

    db.dbdefines.findOne({owner:member._id,_id:req.params.param1,deleted:false, $or:[{'authorizedMembers.memberId':req.params.param2},{'authorizedMembers._id':req.params.param2}]},(err,doc)=>{
        if (dberr(err,callback)) {
            if(dbnull(doc,callback)){
                eventLog('data:',data);
                var bFound=false;
                doc.authorizedMembers.forEach((e)=>{
                    if(e.memberId==req.params.param2 || e._id==req.params.param2){
                        bFound=true;
                        e.canRead=data.canRead || false;
                        e.canWrite=data.canWrite || false;
                        e.canDelete=data.canDelete || false;
                        return;
                    }
                });
                if(bFound==false) return callback({success:false,error:{code:'RECORD_NOT_FOUND',message:'Kayit bulunamadi'}});
                doc.save((err,doc2)=>{
                    if(dberr(err,callback)){
                        callback({success:true,data:doc2.authorizedMembers});
                    }
                });
            }
        }
    });
}

function deleteItem(member,req,res,callback){
    var data = req.body || {}

    if(req.params.param2==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre.'}});

    db.dbdefines.findOne({owner:member._id,_id:req.params.param1,deleted:false, $or:[{'authorizedMembers.memberId':req.params.param2},{'authorizedMembers._id':req.params.param2}]},(err,doc)=>{
        if (dberr(err,callback)) {
            if(dbnull(doc,callback)){
                var bFound=false;
                doc.authorizedMembers.forEach((e,index)=>{
                    if(e.memberId==req.params.param2  || e._id==req.params.param2){
                        bFound=true;
                        doc.authorizedMembers.splice(index,1);
                        return;
                    }
                });
                if(bFound==false) return callback({success:false,error:{code:'RECORD_NOT_FOUND',message:'Kayit bulunamadi'}});
                doc.save((err,doc2)=>{
                    if(dberr(err,callback)){
                        callback({success:true,data:doc2.authorizedMembers});
                    }
                });
            }
        }
    });
}