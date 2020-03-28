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

function salesOrders(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1) ,
        // ,
        // select:'_id profileId ID salesOrderId issueDate issueTime orderTypeCode validityPeriod lineCountNumeric buyerCustomerParty.party buyerCustomerParty.deliveryContact buyerCustomerParty.accountingContact buyerCustomerParty.buyerContact orderLine localDocumentId orderStatus localStatus '

        
        
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    //var filter = {ioType:0,orderStatus:'Approved'}; // qwerty sadece onaylanmis siparisler
    var filter = { 
        ioType:0
        
    }
    //orderLine localDocumentId orderStatus localStatus
    // var aggregateGroup={ $group: {
    //            _id:'$_id',
    //            profileId:{$first:'$profileId.value'},
    //            ID: { $first: '$ID.value' },
    //            salesOrderId: { $first: '$salesOrderId.value' },
    //            issueDate: { $first: '$issueDate.value' },
    //            issueTime: { $first: '$issueTime.value' },
    //            orderTypeCode: { $first: '$orderTypeCode.value' },
    //            validityPeriod: { $first: '$validityPeriod' },
    //            lineCountNumeric: { $first: '$lineCountNumeric.value' },
    //            buyerCustomerParty: { $first: '$buyerCustomerParty' },
    //            orderLine_ID: {$first: '$orderLine.ID.value' },
    //            // orderLine_orderedQuantityLeft: {$subtract: ['$orderLine.orderedQuantity.value','$orderLine.orderedQuantity.value'] },
    //            orderLine_orderedQuantity: '$orderLine.orderedQuantity.value',
    //            orderLine_deliveredQuantity: '$orderLine.deliveredQuantity.value',
    //            orderLine_item: '$orderLine.item',
    //            localDocumentId: { $first: '$localDocumentId' },
    //            orderStatus: { $first: '$orderStatus' },
    //            localStatus: { $first: '$localStatus' },
    //            count: { $sum: 1 }
    //         }
    //     }

    var aggregateProject=[
        // {$replaceRoot:{newRoot:'$orderLine'}},
        
        {$unwind:'$orderLine'},
        {$project: {
               _id:'$orderLine._id',
               sip_id:'$_id',
               profileId:'$profileId',
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
               deliveredRemaining:{$gt:0},
               producedRemaining:{$gt:0}
            }
        }
        
        
    ]
    var myAggregate = activeDb.orders.aggregate(aggregateProject);

    activeDb.orders.aggregatePaginate(myAggregate,options,(err, resp)=>{
        if(err){
            console.log('err:',err);
        }
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1), 
        populate:[
            {path:'location',select:'_id locationName'}
        ]
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    var filter = {};

    if((req.query.productionId || req.query.productionNo || req.query.no || '')!=''){
        filter['productionId']={ '$regex': '.*' + (req.query.productionId || req.query.productionNo || req.query.no) + '.*' , '$options': 'i' }
    }
    if(req.query.status){
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
    activeDb.production_orders.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.production_orders.findOne({_id:req.params.param1},(err,doc)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;

    var newdoc = new activeDb.production_orders(data);
    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});

    newdoc.save(function(err, newdoc2) {
        if (dberr(err,callback)) {
            callback({success:true,data:newdoc2});
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

        activeDb.production_orders.findOne({ _id: data._id},(err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new activeDb.production_orders(doc2);
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
