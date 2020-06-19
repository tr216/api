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
    var options={page: (req.query.page || 1)
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    var filter = {};

    if(req.query.name){
        filter['name']={ $regex: '.*' + req.query.name + '.*' ,$options: 'i' };
    }
    
    activeDb.mrp_machine_groups.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.mrp_machine_groups.findOne({_id:req.params.param1},(err,doc)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;
    
    var newdoc = new activeDb.mrp_machine_groups(data);
    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});

    newdoc.save(function(err, newdoc2) {
        if (dberr(err,callback)) {
            callback({success:true,data:newdoc2});
        } 
    });

       
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    var data = req.body || {};
    
    data._id = req.params.param1;
    data.modifiedDate = new Date();

    activeDb.mrp_machine_groups.findOne({ _id: data._id},(err,doc)=>{
        if (dberr(err,callback)) {
            if(doc==null){
                callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }else{
                var doc2 = Object.assign(doc, data);
                var newdoc = new activeDb.mrp_machine_groups(doc2);
                var err=epValidateSync(newdoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                newdoc.save(function(err, newdoc2) {
                    if (dberr(err,callback)) {
                        callback({success: true,data: newdoc2});
                    } 
                });
               
            }
        }
    });
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    var data = req.body || {};
    data._id = req.params.param1;
    activeDb.mrp_machine_groups.removeOne(member,{ _id: data._id},(err,doc)=>{
        if (dberr(err,callback)) {
            callback({success: true});
        }
    });
}