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
    if((req.query.item || '')!=''){
        filter['item']=req.query.item;
    }
   
    
    activeDb.recipes.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    var populate=[
        { path:'process.station', select:'_id name'},
        { path:'process.step', select:'_id name useMaterial'},
        { path:'process.machines.machineGroup', select:'_id name'},
        { path:'process.machines.mold', select:'_id name'},
        { path:'process.input.item', select:'_id itemType name description'},
        { path:'process.output.item', select:'_id itemType name description'},
        { path:'materialSummary.item', select:'_id itemType name description'},
        { path:'outputSummary.item', select:'_id itemType name description'}
    ]
    activeDb.recipes.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if(dberr(err,callback)) {
            if(!req.query.print){
                callback({success: true,data: doc});
            }else{
                doc.populate('item').execPopulate((err,doc2)=>{
                    if(dberr(err,callback)) {
                        printHelper.print(activeDb,'recipe',doc2,(err,html)=>{
                            if(!err){
                                callback({file: {data:html}});
                            }else{
                                callback({success:false,error:{code:(err.code || err.name || 'PRINT_ERROR'),message:err.message}})
                            }
                        });
                    }
                })
                
            }
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;
    
    if((data.item || '')=='') return callback({success: false, error: {code: 'WRONG_PARAMETER', message: 'item gereklidir'}});
    activeDb.items.findOne({_id:data.item},(err,itemDoc)=>{
        if(dberr(err,callback)){
            if(itemDoc==null) return callback({success: false, error: {code: 'ITEM_NOT_FOUND', message: 'item bulunamadi.'}});
            if(data.process)
                if(data.process.machines){
                    data.process.machines.forEach((e)=>{
                        if((e.machineGroup || '')=='') e.machineGroup=undefined;
                        if((e.mold || '')=='') e.mold=undefined;
                    });
                }
                
            
            var newdoc = new activeDb.recipes(data);

            var err=epValidateSync(newdoc);
            if(err) return callback({success: false, error: {code: err.name, message: err.message}});
            newdoc=calculateMaterialSummary(newdoc);
            newdoc.save(function(err, newdoc2) {
                if(dberr(err,callback)) {
                    defaultReceteAyarla(activeDb,newdoc2,(err,newdoc3)=>{
                        var populate=[
                            { path:'process.station', select:'_id name'},
                            { path:'process.step', select:'_id name useMaterial'},
                            { path:'process.machines.machineGroup', select:'_id name'},
                            { path:'process.machines.mold', select:'_id name'},
                            { path:'process.input.item', select:'_id itemType name description'},
                            { path:'process.output.item', select:'_id itemType name description'},
                            { path:'materialSummary.item', select:'_id itemType name description'},
                            { path:'outputSummary.item', select:'_id itemType name description'}
                        ]
                        activeDb.recipes.findOne({_id:newdoc3._id}).populate(populate).exec((err,doc)=>{
                            if(dberr(err,callback)) {
                                callback({success: true,data: doc});
                            }
                        });
                    });
                } 
            });
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
        if((data.item || '')=='') return callback({success: false, error: {code: 'WRONG_PARAMETER', message: 'item gereklidir'}});
        activeDb.items.findOne({_id:data.item},(err,itemDoc)=>{
            if(dberr(err,callback)){
                if(itemDoc==null) return callback({success: false, error: {code: 'ITEM_NOT_FOUND', message: 'item bulunamadi.'}});
                activeDb.recipes.findOne({ _id: data._id},(err,doc)=>{
                    if(dberr(err,callback)) {
                        if(doc==null) return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                        if(data.process)
                            if(data.process.machines){
                                data.process.machines.forEach((e)=>{
                                    if((e.machineGroup || '')=='') e.machineGroup=undefined;
                                    if((e.mold || '')=='') e.mold=undefined;

                                });
                            }
                        doc.process=[];
                        var doc2 = Object.assign(doc, data);
                        var newdoc = new activeDb.recipes(doc2);
                        var err=epValidateSync(newdoc);
                        if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                        newdoc=calculateMaterialSummary(newdoc);
                        newdoc.save(function(err, newdoc2) {
                            defaultReceteAyarla(activeDb,newdoc2,(err,newdoc3)=>{
                                var populate=[
                                    { path:'process.station', select:'_id name'},
                                    { path:'process.step', select:'_id name useMaterial'},
                                    { path:'process.machines.machineGroup', select:'_id name'},
                                    { path:'process.machines.mold', select:'_id name'},
                                    { path:'process.input.item', select:'_id itemType name description'},
                                    { path:'process.output.item', select:'_id itemType name description'},
                                    { path:'materialSummary.item', select:'_id itemType name description'},
                                    { path:'outputSummary.item', select:'_id itemType name description'}
                                ]
                                activeDb.recipes.findOne({_id:newdoc3._id}).populate(populate).exec((err,doc)=>{
                                    if(dberr(err,callback)) {
                                        callback({success: true,data: doc});
                                    }
                                });
                            });
                        });
                    }
                });
            }
        });
    }
}

function calculateMaterialSummary(doc){
    doc.materialSummary=[];
    doc.outputSummary=[];
    doc.process.forEach((e)=>{
        e.input.forEach((e1)=>{
            var bFound=false;
            doc.materialSummary.forEach((e2)=>{
                if(e2.item==e1.item){
                    bFound=true;
                    e2.quantity +=e1.quantity;
                    return;
                }
            });
            if(bFound==false){
                doc.materialSummary.push({item:e1.item,quantity:e1.quantity,unitCode:e1.unitCode});
            }
        })
        e.output.forEach((e1)=>{
            var bFound=false;
            doc.outputSummary.forEach((e2)=>{
                if(e2.item==e1.item){
                    bFound=true;
                    e2.quantity +=e1.quantity;
                    return;
                }
            });
            if(bFound==false){
                doc.outputSummary.push({item:e1.item,quantity:e1.quantity,unitCode:e1.unitCode});
            }
        })
    });

    var toplamAgirlik=doc.totalWeight || 0;

    if(toplamAgirlik>0){
        doc.materialSummary.forEach((e)=>{
            e.percent=Math.round(1000*100*e.quantity/toplamAgirlik)/1000;
        });
        doc.outputSummary.forEach((e)=>{
            e.percent=Math.round(1000*100*e.quantity/toplamAgirlik)/1000;
        });
    }

    return doc;
}

function defaultReceteAyarla(activeDb,doc,callback){

    if(doc.isDefault){

        // activeDb.recipes.find({ item:doc.item, isDefault:true }).count((err,countQuery)=>{
        //     console.log('countQuery1:',countQuery)
            activeDb.recipes.updateMany({item:doc.item,_id:{$ne:doc._id}},{$set:{isDefault:false}},{multi:true},(err,c)=>{
                callback(null,doc);
            });
        // });
        
    }else{
        activeDb.recipes.find({ item:doc.item, isDefault:true }).count((err,countQuery)=>{
            
            if(countQuery>0) return callback(null,doc);
            doc.isDefault=true;
            doc.save((err,doc2)=>{
                if(!err){
                   callback(null,doc2); 
                }else{
                   callback(null,doc); 
                }
                
            })
        });
    }
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.recipes.removeOne(member,{ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                const countQuery = activeDb.recipes.where({ item:doc.item, isDefault:true }).countDocuments();
                if(countQuery>0) return callback({success: true});
                activeDb.recipes.updateOne({item:doc.item},{$set:{isDefault:true}},(err,c)=>{
                    callback({success: true});
                });
                
            }
        });
    }
}
