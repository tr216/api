module.exports = function(member, req, res, callback) {
    switch(req.method){
        case 'GET':
            if(req.params.param1){
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
        default:
            callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }
}

function getList(member,req,res,callback){
    var options={
        page: (req.query.page || 1)
    }
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {};
    if(req.query.username){
        filter['username']={ $regex: '.*' + req.query.username + '.*' ,$options: 'i' };
    }
    db.members.paginate(filter,options,(err, resp)=>{
        if (!err) {
            callback({success: true,data: resp});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function getOne(member,req,res,callback){
    db.members.findOne({_id:req.params.param1},(err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function post(member,req,res,callback){
    var data = req.body || {};
   
    var newdoc = new db.members(data);
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

function put(member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data = req.body || {};
        
        data._id = req.params.param1;
        data.modifiedDate = new Date();

        db.members.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                  
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new db.members(doc2);
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

function deleteItem(member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        db.members.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}
