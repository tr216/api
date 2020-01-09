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

var locationTypes=[
            {"text":"(0)Depo","value": 0},
            {"text":"(1)Magaza","value": 1},
            {"text":"(2)Uretim","value":2},
            {"text":"(3)Iade","value":3},
            {"text":"(4)Seyyar","value":4},
            {"text":"(5)Diger","value":5}
        ]
function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1)}
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {};

    for(var i=0;i<100;i++){
        if(req.query['order'+i]!=undefined){
            var o1=req.query['order'+i];
            var oBy='asc';
            if(o1.substring(0,4)=='desc') oBy='desc';
            if(o1.indexOf('_')>-1){
                var key=o1.substr(o1.indexOf('_')+1);
                if(options['sort']==undefined) options['sort']={};

                if(key.indexOf('.')<0 && key!=''){
                    if(key=='locationTypeName') key='locationType';
                    options['sort'][key]=oBy;
                }
                
            }
        }else{
            break;
        }
    }

    if(req.query.passive!=undefined){
        filter['passive']=req.query.passive;
    }
    activeDb.locations.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            resp.docs.forEach((doc)=>{
                //doc=doc.toObject();
                doc['locationTypeName']='';
                locationTypes.forEach((e)=>{
                    if(e.value==doc.locationType){
                        doc['locationTypeName']=e.text;
                        return;
                    }
                });
            });
            callback({success: true,data: resp});
        } else {
            console.error(__filename,err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.locations.findOne({_id:req.params.param1},(err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    var newdoc = new activeDb.locations(data);
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
        var data=req.body || {};
        data._id = req.params.param1;
        data.modifiedDate = new Date();

        activeDb.locations.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new activeDb.locations(doc2);
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
        activeDb.locations.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}
