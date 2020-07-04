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

    if((req.query.passive || '')!=''){
        filter['passive']=req.query.passive;
    }
    if(req.query.name){
        filter['name']={ $regex: '.*' + req.query.name + '.*' ,$options: 'i' };
    }
    if(req.query.description){
        filter['description']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' };
    }
    
    if((req.query.station || '')!=''){
        filter['station']=req.query.station;
    }
    if((req.query.moldGroup || '')!=''){
        filter['moldGroup']=req.query.moldGroup;
    }
    if((req.query.machineGroup || '')!=''){
        filter['machineGroup']=req.query.machineGroup;
    }
    if((req.query.recipe || '')!=''){
        activeDb.recipes.findOne({_id:req.query.recipe},(err,recipeDoc)=>{
            if(dberr(err,callback)) {
                if(dbnull(recipeDoc,callback)) {
                    var dizi=[];
                    var processIndex=-1;
                    if((req.query.processIndex || '')!='') processIndex=Number(req.query.processIndex);

                    recipeDoc.process.forEach((e,index)=>{
                        if(processIndex<0 || processIndex==index){
                            e.machines.forEach((e2)=>{
                                dizi.push(e2.mold);    
                            });
                        }
                    });
                    
                    filter['_id']={$in:dizi};
                    activeDb.mrp_molds.paginate(filter,options,(err, resp)=>{
                        if (dberr(err,callback)) {
                            callback({success: true,data: resp});
                        }
                    });

                }
            }
        })
        
    }else{
        activeDb.mrp_molds.paginate(filter,options,(err, resp)=>{
            if (dberr(err,callback)) {
                callback({success: true,data: resp});
            }
        });
    }

   
}

function getOne(activeDb,member,req,res,callback){
    activeDb.mrp_molds.findOne({_id:req.params.param1},(err,doc)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;
    if((data.account || '')=='') data.account=undefined;
    
    
    var newdoc = new activeDb.mrp_molds(data);
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
    if((data.account || '')=='') data.account=undefined;
    
    activeDb.mrp_molds.findOne({ _id: data._id},(err,doc)=>{
        if (dberr(err,callback)) {
            if(doc==null){
                callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }else{
                var doc2 = Object.assign(doc, data);
                var newdoc = new activeDb.mrp_molds(doc2);
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
    activeDb.mrp_molds.removeOne(member,{ _id: data._id},(err,doc)=>{
        if (dberr(err,callback)) {
            callback({success: true});
        }
    });
}
