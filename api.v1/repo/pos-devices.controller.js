module.exports = function(activeDb, member, req, res, callback) {
   
    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            getOne(activeDb,member,req,res,callback);
        }else{
            getList(activeDb,member,req,res,callback);
        }
        break;
        case 'POST':
        post(activeDb,member,req,res,callback);
        break;
        case 'PUT':
        put(activeDb,member,req,res,callback);
        break;
        case 'DELETE':
        deleteItem(activeDb,member,req,res,callback);
        break;
        default:
        callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }

}

function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1), 
        populate:[
            {path:'location',select:'_id locationName'},
            {path:'service',select:'_id name serviceType'},
            {path:'localConnector',select:'_id name'}
        ]
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    var filter = {};
    if(req.query.deviceSerialNo){
        filter['deviceSerialNo']={ $regex: '.*' + req.query.deviceSerialNo + '.*' ,$options: 'i' };
    }
    if(req.query.deviceModel){
        filter['deviceModel']={ $regex: '.*' + req.query.deviceModel + '.*' ,$options: 'i' };
    }
    if(req.query.location){
        filter['location']=req.query.location;
    }
    if(req.query.service){
        filter['service']=req.query.service;
    }
    if(req.query.localConnector){
        filter['localConnector']=req.query.localConnector;
    }
    if(req.query.passive){
        filter['passive']=req.query.passive;
    }

    activeDb.pos_devices.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            eventLog('error:',err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.pos_devices.findOne({_id:req.params.param1},(err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
   
    var newdoc = new activeDb.pos_devices(data);
    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});

    newdoc.save(function(err, newdoc2) {
        if (!err) {
            callback({success:true,data:newdoc2});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });

       
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data = req.body || {};
        
        data._id = req.params.param1;
        data.modifiedDate = new Date();

        activeDb.pos_devices.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                  
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new activeDb.pos_devices(doc2);
                    var err=epValidateSync(newdoc);
                    if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                    newdoc.save(function(err, newdoc2) {
                        if (!err) {
                            callback({success: true,data: newdoc2});
                        } else {
                            callback({success: false, error: {code: err.name, message: err.message}});
                        }
                    });
                   
                }
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.pos_devices.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}
