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
            {path:'subLocation',select:'_id name'},
            {path:'location2',select:'_id locationName'},
            {path:'subLocation2',select:'_id name'},
            {path:'productionOrderId',select:'_id productionId'}
        ]
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

    if((req.query.date1 || '')!=''){
        filter['issueDate']={$gte:req.query.date1};
    }

    if((req.query.date2 || '')!=''){
        if(filter['issueDate']){
            filter['issueDate']['$lte']=req.query.date2;
        }else{
            filter['issueDate']={$lte:req.query.date2};
        }
    }
    if((req.query.docTypeCode || '')!=''){
        filter['docTypeCode']=req.query.docTypeCode;
    }
    if((req.query.docId || req.query.docNo || '')!=''){
        filter['docId']={ $regex: '.*' + (req.query.docId || req.query.docNo) + '.*' ,$options: 'i' };
    }

    if((req.query.description || '')!=''){
        filter['description']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' };
    }
    
    if((req.query.item || req.query.itemId ||  '')!=''){
        filter['docLine.item']=req.query.item || req.query.itemId;
    }
    if((req.query.lotNo || '')!=''){
        filter['docLine.lotNo']={ $regex: '.*' + req.query.lotNo + '.*' ,$options: 'i' };
    }

    if((req.query.location || '')!=''){
        filter['location']=req.query.location;
    }
    if((req.query.location2 || '')!=''){
        filter['location2']=req.query.location2;
    }

    filter_subLocation(activeDb,req,filter,(err,filter2)=>{
        if(dberr(err,callback)){
            activeDb.inventory_fiches.paginate(filter2,options,(err, resp)=>{
                if (dberr(err,callback)) {
                    callback({success: true,data: resp});
                }
            });
        }
    });
}

function filter_subLocation(activeDb,req,mainFilter,callback){
    function filter_subLocation1(filter,cb){
        if((req.query.subLocation || '')!=''){
            activeDb.sub_locations.find({ name: { $regex: '.*' + req.query.subLocation + '.*' ,$options: 'i' }},(err,subLocations)=>{
                if(!err){
                    if(filter['$or']!=undefined){
                        var newOR=[];
                        filter['$or'].forEach((e)=>{
                            var bFound= false;
                            fiches.forEach((e2)=>{ 
                                if(e['subLocation'].toString()==e2._id.toString()){
                                    bFound=true;
                                    return;
                                }
                            });
                            if(bFound){
                                newOR.push(e)
                            }
                        });
                        filter['$or']=newOR;
                    }else{
                        filter['$or']=[];
                        subLocations.forEach((e)=>{
                            filter['$or'].push({subLocation:e._id});
                        });
                    }
                    
                    cb(null,filter);
                }else{
                    cb(err,filter);
                }
            });
        }else{
            cb(null,filter);
        }
    }
    
    function filter_subLocation2(filter,cb){
        if((req.query.subLocation2 || '')!=''){
            activeDb.sub_locations.find({ name: { $regex: '.*' + req.query.subLocation2 + '.*' ,$options: 'i' }},(err,subLocations)=>{
                if(!err){
                    if(filter['$or']!=undefined){
                        var newOR=[];
                        filter['$or'].forEach((e)=>{
                            var bFound= false;
                            fiches.forEach((e2)=>{ 
                                if(e['subLocation2'].toString()==e2._id.toString()){
                                    bFound=true;
                                    return;
                                }
                            });
                            if(bFound){
                                newOR.push(e)
                            }
                        });
                        filter['$or']=newOR;
                    }else{
                        filter['$or']=[];
                        subLocations.forEach((e)=>{
                            filter['$or'].push({subLocation2:e._id});
                        });
                    }
                    
                    cb(null,filter);
                }else{
                    cb(err,filter);
                }
            });
        }else{
            cb(null,filter);
        }
    }

    filter_subLocation1(mainFilter,(err,mainFilter2)=>{
        filter_subLocation2(mainFilter2,(err2,mainFilter3)=>{
            callback(err2,mainFilter3);
        })
    })
}


function getOne(activeDb,member,req,res,callback){
    var populate=[
        {path:'docLine.item', select:'_id name description unitPacks tracking passive'},
        {path:'docLine.pallet', select:'_id name'}
        
        // {path:'docLine.color', select:'_id name'}, //qwerty
        // {path:'docLine.pattern', select:'_id name'}, //qwerty
        // {path:'docLine.size', select:'_id name'} //qwerty
    ]
    activeDb.inventory_fiches.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if(dberr(err,callback)) {
            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    if((data.account || '')=='') data.account=undefined;
    data._id=undefined;
    data=fazlaliklariTemizleDuzelt(data);
    if(data.docTypeCode=='URETIMECIKIS' || data.docTypeCode=='URETIMDENGIRIS'){
        if((data.productionOrderId || '')==''){
            return callback({success: false,error: {code: 'WRONG_DATA', message: 'Üretim emri seçilmemiş'}});
        }
    }
    uretimFisiKontrolEt(activeDb,data,(err,data)=>{
        if(err) return callback({success: false, error: {code: err.name, message: err.message}});
        var yeniDoc = new activeDb.inventory_fiches(data);
        documentHelper.yeniStokFisNumarasi(activeDb,yeniDoc,(err11,newDoc)=>{
            var err=epValidateSync(newDoc);
            if(err) return callback({success: false, error: {code: err.name, message: err.message}});

            newDoc.save(function(err, newDoc2) {
                if(dberr(err,callback)) {
                    callback({success:true,data:newDoc2});
                } 
            });
        })
            
    })
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data=req.body || {};
        data._id = req.params.param1;
        data.modifiedDate = new Date();
        data=fazlaliklariTemizleDuzelt(data);
        if(data.docTypeCode=='URETIMECIKIS' || data.docTypeCode=='URETIMDENGIRIS'){
            if((data.productionOrderId || '')==''){
                return callback({success: false,error: {code: 'WRONG_DATA', message: 'Üretim emri seçilmemiş'}});
            }
        }
        uretimFisiKontrolEt(activeDb,data,(err,data)=>{
            if(err) return callback({success: false, error: {code: err.name, message: err.message}});
            activeDb.inventory_fiches.findOne({ _id: data._id},(err,doc)=>{
                if(dberr(err,callback)) {
                    if(doc==null) return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                        
                    var doc2 = Object.assign(doc, data);
                    var newDoc = new activeDb.inventory_fiches(doc2);
                    var err=epValidateSync(newDoc);
                    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                    newDoc.save(function(err, newDoc2) {
                        if(dberr(err,callback)) {
                            callback({success: true,data: newDoc2});
                        } 
                    });
                }
            });
        })
        
    }
}

function uretimFisiKontrolEt(activeDb,data,callback){
    if(!(data.docTypeCode=='URETIMECIKIS' || data.docTypeCode=='URETIMDENGIRIS')) return callback(null,data);

    activeDb.production_orders.findOne({_id:data.productionOrderId},(err,proOrder)=>{
        if(!err){
            if(proOrder==null) return callback({code:'WRONG_DATA',message:'Uretim emri bulunamadi'},data);
            if(!data.docLine) return callback(null,data);

            var hata;

            if(data.docTypeCode=='URETIMECIKIS'){
                

                data.docLine.forEach((e,index)=>{
                    var bFound=false;
                    proOrder.materialSummary.forEach((e2)=>{
                        if(e.item._id.toString()==e2.item.toString()){
                            bFound=true;
                            return;
                        }
                    });
                    if(bFound==false){
                        hata={code:'WRONG_DATA',message:'Uretim emrinde olmayan bir hammadde ya da malzemeyi uretime cikamazsiniz. Satir:' + (index+1)}
                        return;
                    }
                })
            }else if(data.docTypeCode=='URETIMDENGIRIS'){
                data.docLine.forEach((e,index)=>{
                    var bFound=false;
                    if(proOrder.item.toString()!=e.item._id.toString()){
                        proOrder.outputSummary.forEach((e2)=>{
                            if(e.item._id.toString()==e2.item.toString()){
                                bFound=true;
                                return;
                            }
                        });
                    }else{
                        bFound=true;
                    }
                    
                    if(bFound==false){
                        hata={code:'WRONG_DATA',message:'Uretim emrinde tanımsız mamul olamaz. Satir:' + (index+1)}
                        return;
                    }
                })
            }
            
            callback(hata,data);
        }else{
            callback(err,data);
        }
    })
    
}

function fazlaliklariTemizleDuzelt(data){
    console.log('data._id:',data._id);
    if(data.docTypeCode!='TRANSFER'){
        data.location2=data.location;
        data.subLocation2=data.subLocation;
    }
    if((data.subLocation || '')=='') data.subLocation=undefined;
    if((data.subLocation2 || '')=='') data.subLocation2=undefined;
    if(data.docLine){
        data.docLine.forEach((e)=>{
            
            if((e.pallet || '')==''){
                e.pallet=undefined;
            }else{
                if((e.pallet._id || '')=='') e.pallet=undefined;
            }

            if((e.color || '')==''){
                e.color=undefined;
            }else{
                if((e.color._id || '')=='') e.color=undefined;
            }

            if((e.pattern || '')==''){
                e.pattern=undefined;
            }else{
                if((e.pattern._id || '')=='') e.pattern=undefined;
            }

            if((e.size || '')==''){
                e.size=undefined;
            }else{
                if((e.size._id || '')=='') e.size=undefined;
            }

           
        });
    }

    return data;

}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.inventory_fiches.removeOne(member,{ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                callback({success: true});
            }
        });
    }
}
