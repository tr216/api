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
        if(req.params.param1=='copy'){
            copy(activeDb,member,req,res,callback);
        }else{
            post(activeDb,member,req,res,callback);
        }
        
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

function copy(activeDb,member,req,res,callback){
    var id=req.params.param2 || req.body['id'] || req.query.id || '';
    var newName=req.body['newName'] || req.body['name'] || '';

    if(id=='') return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    
    activeDb.items.findOne({ _id: id},(err,doc)=>{
        if(dberr(err,callback)) {
            if(dbnull(doc,callback)) {
                var data=doc.toJSON();
                data._id=undefined;
                delete data._id;
                if(newName!=''){
                    data.name.value=newName;
                }else{
                    data.name.value +=' copy';
                }
                data.passive=true;

                var newdoc = new activeDb.items(data);
                var err=epValidateSync(newdoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                newdoc.save(function(err, newdoc2) {
                    if(dberr(err,callback)) {
                        receteleriKaydet(activeDb,doc,newdoc2,(err,newdoc3)=>{
                            if(!err){
                                callback({success: true,data: newdoc3});
                            }else{
                                activeDb.items.deleteOne({_id:newdoc2._id},(err2)=>{
                                    return ;dberr(err,callback)
                                });
                            }
                        });
                        
                    } 
                });
            }
        }
    });
}

function receteleriKaydet(activeDb,itemDoc,newItemDoc,callback){
    activeDb.recipes.find({item:itemDoc._id},(err,docs)=>{
        if(!err){
            if(docs.length==0) return callback(null,newItemDoc);

            var index=0;

            function kaydet(cb){
                if(index>=docs.length) return cb(null);
                var data=docs[index].toJSON();
                data._id=undefined;
                delete data._id;
                data['item']=newItemDoc._id;
                var yeniReceteDoc=new activeDb.recipes(data);
                yeniReceteDoc.save((err,yeniReceteDoc2)=>{
                    if(!err){
                        if(itemDoc.recipe==docs[index]._id){
                            newItemDoc.recipe=yeniReceteDoc2._id;
                        }
                        index++;
                        setTimeout(kaydet,0,cb);
                    }else{
                        cb(err);
                    }
                });
            }

            kaydet((err)=>{
                if(!err){
                    newItemDoc.save((err,newItemDoc2)=>{
                        callback(err,newItemDoc2);
                    });
                }else{
                    callback(err);
                }
                
            });

        }else{
            callback(err);
        }
    });
}

function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1)

    }
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
                    options['sort'][key]=oBy;
                }
                
            }
        }else{
            break;
        }
    }

    if(req.query.itemType!='all'){
        if((req.query.itemType || req.query.itemtype || req.query.type || '')!=''){
            filter['itemType']=(req.query.itemType || req.query.itemtype || req.query.type);
        }else{
            filter['itemType']='item';
        }
    }else{
        
    }
    

    //filter['passive']=false;
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
    
    if((req.query.accountGroup || '')!=''){
        filter['accountGroup']=req.query.accountGroup;
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
            if(dbnull(doc,callback)) {
                if(!req.query.print){
                    callback({success: true,data: doc});
                }else{
                    if(dberr(err,callback)) {
                        var moduleType='item';
                        if(doc.itemType=='product' || doc.itemType=='semi-product') moduleType='item-product';
                        
                        printHelper.print(activeDb,moduleType,doc,(err,html)=>{
                            if(!err){
                                callback({file: {data:html}});
                            }else{
                                callback({success:false,error:{code:(err.code || err.name || 'PRINT_ERROR'),message:err.message}})
                            }
                        });
                    }
                    
                }
            }
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
            if(dberr(err,callback)){
                if(dbnull(doc,callback)) {
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
