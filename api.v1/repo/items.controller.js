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
    var options={page: (req.query.page || 1)}
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {itemType:'item'};

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

    if((req.query.itemType || req.query.itemtype || req.query.type || '')!=''){
        filter['itemType']=(req.query.itemType || req.query.itemtype || req.query.type);
    }

    filter['passive']=false;
    if((req.query.passive || '')!=''){
        filter['passive']=req.query.passive;
    }
    if((req.query.name || '')!=''){
        filter['name.value']={ $regex: '.*' + req.query.name + '.*' ,$options: 'i' };
    }
    if((req.query.brandName || '')!=''){
        filter['brandName.value']={ $regex: '.*' + req.query.brandName + '.*' ,$options: 'i' };
    }
    if((req.query.description || '')!=''){
        filter['description.value']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' };
    }
    if((req.query.keyword || '')!=''){
        filter['keyword.value']={ $regex: '.*' + req.query.keyword + '.*' ,$options: 'i' };
    }
    if((req.query.modelName || '')!=''){
        filter['modelName.value']={ $regex: '.*' + req.query.modelName + '.*' ,$options: 'i' };
    }
    if((req.query.itemClassificationCode || '')!=''){
        filter['commodityClassification.itemClassificationCode.value']={ $regex: '.*' + req.query.itemClassificationCode + '.*' ,$options: 'i' };
    }
    

    activeDb.items.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.items.findOne({_id:req.params.param1},(err,doc)=>{
        if(dberr(err,callback)) {
            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    
    var newdoc = new activeDb.items(data);
    newdoc.partyType='Customer';
    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});

    newdoc.save(function(err, newdoc2) {
        if(dberr(err,callback)) {
            callback({success:true,data:newdoc2});
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
        
        activeDb.items.findOne({ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                if(doc==null) return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});

                var doc2 = Object.assign(doc, data);
                var newdoc = new activeDb.items(doc2);
                var err=epValidateSync(newdoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                newdoc.save(function(err, newdoc2) {
                    if(dberr(err,callback)) {
                        callback({success: true,data: newdoc2});
                    } 
                });
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
        activeDb.items.removeOne(member,{ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                callback({success: true});
            }
        });
    }
}
