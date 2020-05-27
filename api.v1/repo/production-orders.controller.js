module.exports = function(activeDb, member, req, res, callback) {
    
    switch(req.method){
        case 'GET':
            if(req.params.param1!=undefined){
                if(req.params.param1.lcaseeng()=='salesorders'){
                    salesOrders(activeDb,member,req,res,callback);
                }else{
                    getOne(activeDb,member,req,res,callback);
                }
                
            }else{
                getList(activeDb,member,req,res,callback);
            }
        break;
        case 'POST':
            if(req.params.param1!=undefined){
                if(req.params.param1=='approve'){
                    approveDecline('Approved',activeDb,member,req,res,callback);
                }else if(req.params.param1=='decline'){
                    approveDecline('Declined',activeDb,member,req,res,callback);
                }else if(req.params.param1=='start'){
                    approveDecline('Processing',activeDb,member,req,res,callback);
                }else if(req.params.param1.toLowerCase()=='setdraft'){
                    approveDecline('Draft',activeDb,member,req,res,callback);
                }else if(req.params.param1.toLowerCase()=='complete'){
                    approveDecline('Completed',activeDb,member,req,res,callback);
                }else{
                    callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
                }
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

function approveDecline(status, activeDb,member,req,res,callback){
    if(req.params.param2==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    var data = req.body || {};
    
    data._id = req.params.param2;
    data.modifiedDate = new Date();
    activeDb.production_orders.findOne({ _id: data._id},(err,doc)=>{
        if (dberr(err,callback)) {
            if(doc==null){
                callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }else{
                doc.status=status;
                doc.save(function(err, doc2) {
                    if (dberr(err,callback)){
                        callback({success:true,data:doc2});
                    }
                });
               
            }
        }
    });
}

function salesOrders(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1) ,
        // ,
        // select:'_id profileId ID salesOrderId issueDate issueTime orderTypeCode validityPeriod lineCountNumeric buyerCustomerParty.party buyerCustomerParty.deliveryContact buyerCustomerParty.accountingContact buyerCustomerParty.buyerContact orderLine localDocumentId orderStatus localStatus '

        
        
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    //var filter = {ioType:0,orderStatus:'Approved'}; // qwerty sadece onaylanmis siparisler
    // var filter = { 
    //     ioType:0
        
    // }

    

    var aggregateProject=[
        {$unwind:'$orderLine'},
        {$project: {
               _id:'$orderLine._id',
               sip_id:'$_id',
               profileId:'$profileId',
               ioType:'$ioType',
               ID: '$ID',
               salesOrderId:'$salesOrderId',
               issueDate: '$issueDate',
               issueTime:'$issueTime',
               orderTypeCode: '$orderTypeCode',
               validityPeriod:1,
               lineCountNumeric:1,
               buyerCustomerParty: { party:'$buyerCustomerParty.party'},
               orderLine:1,
               deliveredRemaining:{$subtract:['$orderLine.orderedQuantity.value', '$orderLine.deliveredQuantity.value']},
               producedRemaining:{$subtract:['$orderLine.orderedQuantity.value', '$orderLine.producedQuantity.value']},
               localDocumentId: 1,
               orderStatus: 1,
               localStatus:1
            }
        },
        {
            $match: {
               ioType:0,
               deliveredRemaining:{$gt:0},
               producedRemaining:{$gt:0}
            }
        }
    ]

    if((req.query.orderLineId || '')!=''){
        aggregateProject[2]['$match']['_id']={ $in: [ObjectId(req.query.orderLineId)]}
    }

    var myAggregate = activeDb.orders.aggregate(aggregateProject);

    activeDb.orders.aggregatePaginate(myAggregate,options,(err, resp)=>{
        if(err){
            errorLog(err);
        }
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getList(activeDb,member,req,res,callback){
    
    var options={page: (req.query.page || 1), 
        select:'-process',
        populate:[
            {path:'item',select:'_id name description'},
            {path:'sourceRecipe',select:'_id name description'}
        ]
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    var filter = {};

    if((req.query.productionId || req.query.productionNo || req.query.no || '')!=''){
        filter['productionId']={ '$regex': '.*' + (req.query.productionId || req.query.productionNo || req.query.no) + '.*' , '$options': 'i' }
    }
    if((req.query.productionTypeCode || '')!=''){
        filter['productionTypeCode']=req.query.productionTypeCode;
    }
    if((req.query.status || '')!=''){
        filter['status']=req.query.status;
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

    if((req.query.musteri || req.query.customer || req.query.customerName || '')!=''){
        filter['orderLineReference.orderReference.buyerCustomerParty.party.partyName.name.value']={ '$regex': '.*' + (req.query.musteri || req.query.customer || req.query.customerName) + '.*' , '$options': 'i' }
    }

    applyOtherFilters(activeDb,req,filter,(err,filter2)=>{
        if(dberr(err,callback)){
            activeDb.production_orders.paginate(filter2,options,(err, resp)=>{
                if (dberr(err,callback)) {
                    callback({success: true,data: resp});
                }
            });
        }
    });
}

function applyOtherFilters(activeDb,req,mainFilter,callback){
    function filter_item(filter,cb){
        if((req.query.itemName || '')!='' || (req.query.item || req.query.itemId || '')!=''){
            var itemFilter={ 'name.value': { $regex: '.*' + req.query.itemName + '.*' ,$options: 'i' }}
            if((req.query.item || req.query.itemId || '')!=''){
                itemFilter={_id:(req.query.item || req.query.itemId)}
            }
            activeDb.items.find(itemFilter,(err,itemList)=>{
                if(!err){
                    if(filter['$or']!=undefined){
                        var newOR=[];
                        filter['$or'].forEach((e)=>{
                            var bfound= false;
                            fiches.forEach((e2)=>{ 
                                if(e['item'].toString()==e2._id.toString()){
                                    bfound=true;
                                    return;
                                }
                            });
                            if(bfound){
                                newOR.push(e)
                            }
                        });
                        filter['$or']=newOR;
                    }else{
                        filter['$or']=[];
                        itemList.forEach((e)=>{
                            filter['$or'].push({item:e._id});
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
    

    filter_item(mainFilter,(err,mainFilter2)=>{
        callback(err,mainFilter2);
    })
}

function getOne(activeDb,member,req,res,callback){
    var populate=[
        { path:'process.station', select:'_id name'},
        { path:'process.step', select:'_id name useMaterial'},
        { path:'process.machines.machine', select:'_id name'},
        { path:'process.machines.mold', select:'_id name'},
        { path:'process.input.item', select:'_id itemType name description'},
        { path:'process.output.item', select:'_id itemType name description'},
        { path:'materialSummary.item', select:'_id itemType name description'},
        { path:'outputSummary.item', select:'_id itemType name description'},
        { path:'packingOption.packingType',select:'_id name description width length height weight maxWeight'},
        { path:'packingOption.packingType2',select:'_id name description width length height weight maxWeight'},
        { path:'packingOption.packingType3',select:'_id name description width length height weight maxWeight'},
        { path:'packingOption.palletType',select:'_id name description width length height maxWeight'}
    ]
    
    activeDb.production_orders.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if (dberr(err,callback)) {
            if(!req.query.print){
                callback({success: true,data: doc});
            }else{
                doc.populate('item').execPopulate((err,doc2)=>{
                    if(dberr(err,callback)) {
                        var designId=req.query.designId || '';
                        printHelper.print(activeDb,'mrp-production-order',doc2, designId, (err,html)=>{
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
    verileriDuzenle(activeDb,data,(err,data)=>{
        documentHelper.yeniUretimNumarasi(activeDb,data,(err,data)=>{
            var newdoc = new activeDb.production_orders(data);
            var err=epValidateSync(newdoc);
            if(err) return callback({success: false, error: {code: err.name, message: err.message}});
            newdoc=calculateMaterialSummary(newdoc);
            newdoc.save(function(err, newdoc2) {
                if (dberr(err,callback)) {
                    var populate=[
                        { path:'process.station', select:'_id name'},
                        { path:'process.step', select:'_id name useMaterial'},
                        { path:'process.machines.machine', select:'_id name'},
                        { path:'process.machines.mold', select:'_id name'},
                        { path:'process.input.item', select:'_id itemType name description'},
                        { path:'process.output.item', select:'_id itemType name description'},
                        { path:'materialSummary.item', select:'_id itemType name description'},
                        { path:'outputSummary.item', select:'_id itemType name description'}
                    ]
                    activeDb.production_orders.findOne({_id:newdoc2._id}).populate(populate).exec((err,newdoc3)=>{
                        if(dberr(err,callback)) {
                            callback({success: true,data: newdoc3});
                        }
                    });
                } 
            });
        })
    })
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    var data = req.body || {};
    
    data._id = req.params.param1;
    data.modifiedDate = new Date();
    verileriDuzenle(activeDb,data,(err,data)=>{
        activeDb.production_orders.findOne({ _id: data._id},(err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    doc.orderLineReference=[];
                    doc.process=[];
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new activeDb.production_orders(doc2);
                    var err=epValidateSync(newdoc);
                    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                    newdoc=calculateMaterialSummary(newdoc);
                    newdoc.save(function(err, newdoc2) {
                        if (dberr(err,callback)) {
                            var populate=[
                                { path:'process.station', select:'_id name'},
                                { path:'process.step', select:'_id name useMaterial'},
                                { path:'process.machines.machine', select:'_id name'},
                                { path:'process.machines.mold', select:'_id name'},
                                { path:'process.input.item', select:'_id itemType name description'},
                                { path:'process.output.item', select:'_id itemType name description'},
                                { path:'materialSummary.item', select:'_id itemType name description'},
                                { path:'outputSummary.item', select:'_id itemType name description'}
                            ]
                            activeDb.production_orders.findOne({_id:newdoc2._id}).populate(populate).exec((err,newdoc3)=>{
                                if(dberr(err,callback)) {
                                    callback({success: true,data: newdoc3});
                                }
                            });
                        } 
                    });
                   
                }
            }
        });
    });
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

function verileriDuzenle(activeDb,data,callback){
    if(!data.packingOption) return callback(null,data);
    if((data.packingOption.palletType || '')=='') data.packingOption.palletType=undefined;
    if((data.packingOption.packingType || '')=='') data.packingOption.packingType=undefined;
    if((data.packingOption.packingType2 || '')=='') data.packingOption.packingType2=undefined;
    if((data.packingOption.packingType3 || '')=='') data.packingOption.packingType3=undefined;
    callback(null,data);
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.production_orders.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (dberr(err,callback)) {
                callback({success: true});
            }
        });
    }
}
