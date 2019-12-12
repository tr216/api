module.exports = function(member, req, res, callback) {

    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            getOne(member,req,res,callback);
        }else{
            getList(member,req,res,callback);
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


function getOne(member,req,res,callback){
    var filter = {owner: member._id, deleted:false};
    filter._id=req.params.param1;
    db.dbdefines.findOne(filter, function(err, doc) {
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

   
function getList(member,req,res,callback){
    var options={page: (req.query.page || 1) };
     if((req.query.pageSize || req.query.limit)){
        options.limit=req.query.pageSize || req.query.limit;
    }
    var filter = {owner: member._id, deleted:false};
    for(var i=0;i<100;i++){
        if(req.query['order'+i]!=undefined){
            var o1=req.query['order'+i];
            var oBy='asc';
            if(o1.substring(0,4)=='desc') oBy='desc';
            if(o1.indexOf('_')>-1){
                var key=o1.substr(o1.indexOf('_')+1);
                if(options['sort']==undefined) options['sort']={};

                if(key.indexOf('.')<0 && key!=''){
                    options['sort'][key]=oBy;
                }
            }
        }else{
            break;
        }
    }
    
    db.dbdefines.paginate(filter,options,(err, resp)=>{
        if (!err) {
            
            callback({success: true,data: resp});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}


function post(member,req,res,callback){


    var data = req.body || {};
    

    if(!data.hasOwnProperty("dbName")){
        callback({success: false, error: {code: "ERROR", message: "dbName is required."}});
        return;
    }else{
        if(data.dbName.trim()==""){
            callback({success: false, error: {code: "ERROR", message: "dbName must not be empty."}});
            return;
        }
    }

   
    data.owner = member._id;


    if(data.hasOwnProperty("resonanceOptions")){
        data.resonanceOptions.resonanceId = data.resonanceOptions.resonanceId.replaceAll(' ','').replaceAll('.','').replaceAll('-','');
    }


    db.dbdefines.findOne({owner:member._id,dbName:data.dbName,deleted:false},function(err,foundDoc){
        if (!err) {
            if(foundDoc!=null){
                callback({success: false, error: {code: "DB_ALREADY_EXISTS", message: "Database '" + data.dbName + "' already exists."}});
            }else{
                var newdoc = new db.dbdefines(data);
                
                newdoc.save(function(err, newdoc2) {
                    if (!err) {
                        var userDb="userdb-" + newdoc2._id;
                        var userDbHost=config.mongodb.userAddress;
                        newUserDb(newdoc2._id,userDb,userDbHost,function(result){
                            if(result.success){
                                newdoc2.userDb = userDb;
                                newdoc2.userDbHost = userDbHost;
                                newdoc2.save(function(err,newdoc3){
                                    result.data=newdoc3;
                                                                        
                                    callback(result);
                                });
                            }else{
                                db.dbdefines.deleteOne({_id:newdoc2._id},function(err){
                                    callback(result);
                                });
                                
                            }
                        });
                    } else {
                        callback({success: false, error: {code: err.name, message: err.message}});
                    }
                });
            }
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });

}


function newUserDb(_id,userDb,userDbHost,callback){
    
    loadUserDb(_id,userDb,userDbHost,(err)=>{
        if(!err){
            callback({success:true});
        }else{
            callback({success:false,error:{code:'NEW_USERDB',message:err.message}});
        }
    });
   
}


function put(member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        if(data.hasOwnProperty("resonanceOptions")){
            data.resonanceId = data.resonanceOptions.resonanceId.replaceAll(' ','').replaceAll('.','').replaceAll('-','');
        }
        data.modifiedDate = new Date();
        db.dbdefines.findOne({ _id: data._id, owner : member._id}, function(err, doc) {
            if (err) {
                callback({success: false, error: {code: err.name, message: err.message}});
            } else {
                if (doc == null) {
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    var doc2 = Object.assign(doc, data);

                    var newdoc = new db.dbdefines(doc2);
                    newdoc.save(function(err, newdoc2) {
                        if (err) {
                            callback({success: false, error: {code: err.name, message: err.message}});
                        } else {
                            callback({success: true,data: newdoc2});
                        }
                    });
                }
            }
        });
    }
}

function deleteItem(member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        
        db.dbdefines.findOne({ _id: data._id, owner : member._id, deleted:false}, function(err, doc) {
            if (err) {
                callback({success: false, error: {code: err.name, message: err.message}});
            } else {
                if (doc == null) {
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    doc.deleted=true;
                    doc.modifiedDate = new Date();
                    
                    doc.save(function(err, newdoc2) {
                        if (err) {
                            callback({success: false, error: {code: err.name, message: err.message}});
                        } else {
                            callback({success: true});
                        }
                    });
                }
            }
        });
    }
}