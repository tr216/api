module.exports = function(activeDb, member, req, res, callback) {
   
    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            if(req.params.param1=='rapor1'){
                rapor1(activeDb,member,req,res,callback);
            }else if(req.params.param1=='rapor2'){
                rapor2(activeDb,member,req,res,callback);
            }else{
                getOne(activeDb,member,req,res,callback);
            }
            
        }else{
            getList(activeDb,member,req,res,callback);
        }
        break;
        case 'POST':
            if(req.params.param1=='transfer'){
                transfer(activeDb,member,req,res,callback);
            }else if(req.params.param1=='rollback'){
                rollback(activeDb,member,req,res,callback);
            }else if(req.params.param1=='settransferred'){
                setTransferred(activeDb,member,req,res,callback);
            // }else if(req.params.param1=='export-luca'){
            //     exportLuca(activeDb,member,req,res,callback);
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


function rapor1(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1)}
    if((req.query.pageSize || req.query.limit)){
        options.limit=req.query.pageSize || req.query.limit;
    }

    var filter = {}
   
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


    if(req.query.date1){
        filter['zDate']={$gte:(new Date(req.query.date1))};
    }

    if(req.query.date2){
        if(filter['zDate']){
            filter['zDate']['$lte']=(new Date(req.query.date2+ 'T23:59:59+0300'));
        }else{
            filter['zDate']={$lte:(new Date(req.query.date2+ 'T23:59:59+0300'))};
        }
    }


    var aggregateGroup={ $group: {
               _id:'$posDevice',
               posDevice:{$first:'$posDevice'},
               GunlukToplamTutar: { $sum: '$data.GunlukToplamTutar' },
               GunlukToplamKDV: { $sum: '$data.GunlukToplamKDV' },
               MaliFisAdedi: { $sum: '$data.MaliFisAdedi' },
               NakitTutari: { $sum: '$data.NakitTutari' },
               KrediTutari: { $sum: '$data.KrediTutari' },
               FoodSaleCnt: { $sum: '$data.FoodSaleCnt' },
               FoodRcptTotalAmount: { $sum: '$data.FoodRcptTotalAmount' },
               InvoiceTotal: { $sum: '$data.InvoiceTotal' },
               EInvoiceTotal: { $sum: '$data.EInvoiceTotal' },
               EArchiveInvoiceTotal: { $sum: '$data.EArchiveInvoiceTotal' },
               BankaTransferTutari: { $sum: '$data.BankaTransferTutari' },
               TaxRate0Amount: { $sum: '$data.TaxRate0Amount' },
               TaxRate1Amount: { $sum: '$data.TaxRate1Amount' },
               TaxRate8Amount: { $sum: '$data.TaxRate8Amount' },
               TaxRate18Amount: { $sum: '$data.TaxRate18Amount' },
               FaturaliSatisTutari: { $sum: '$data.FaturaliSatisTutari' },
               count: { $sum: 1 }
            }
        }

    

    filter_deviceSerialNo(activeDb,req,filter,(err,filter)=>{
        if(dberr(err,callback)){
            filter_location(activeDb,req,filter,(err,filter)=>{
                if(dberr(err,callback)){
                    var aggregate=[]
                    if(filter!={}){
                        aggregate=[{$match:filter},aggregateGroup];
                    }else{
                        aggregate=[aggregateGroup];
                    }
                    var myAggregate = activeDb.pos_device_zreports.aggregate(aggregate);
                    activeDb.pos_device_zreports.aggregatePaginate(myAggregate,options,(err, resp)=>{
                        if (dberr(err,callback)) {
                            if(resp.docs.length==0){
                                return callback({success: true,data: resp});
                            }
                            var populate={
                                path:'posDevice',
                                select:'_id location service deviceSerialNo deviceModel',
                                populate:[
                                    {path:'location',select:'_id locationName'}
                                    ]
                            }

                            activeDb.pos_device_zreports.populate(resp.docs,populate,(err,docs)=>{
                                if (dberr(err,callback)) {
                                    resp.docs=docs;
                                    callback({success: true,data: resp});
                                }
                            })
                        }
                    });
                }
            });
        }
    });
    
}

function rapor2(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1)}
    if((req.query.pageSize || req.query.limit)){
        options.limit=req.query.pageSize || req.query.limit;
    }

    var filter = {}
   
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


    if(req.query.date1){
        filter['zDate']={$gte:(new Date(req.query.date1))};
    }

    if(req.query.date2){
        if(filter['zDate']){
            filter['zDate']['$lte']=(new Date(req.query.date2));
        }else{
            filter['zDate']={$lte:(new Date(req.query.date2))};
        }
    }

    filter_location(activeDb,req,filter,(err,filter)=>{
        if(dberr(err,callback)){
            var aggregate=[
                {
                    $match:filter
                },
                {
                    $lookup: {
                        from: 'pos_devices',
                        localField: 'posDevice',
                        foreignField: '_id',
                        as: 'posDevice'
                    }
                },
                { 
                    $unwind:"$posDevice"
                },
                
                {  $group: {
                       _id:'$posDevice.location',
                       location:{$first:'$posDevice.location'},
                       GunlukToplamTutar: { $sum: '$data.GunlukToplamTutar' },
                       GunlukToplamKDV: { $sum: '$data.GunlukToplamKDV' },
                       MaliFisAdedi: { $sum: '$data.MaliFisAdedi' },
                       NakitTutari: { $sum: '$data.NakitTutari' },
                       KrediTutari: { $sum: '$data.KrediTutari' },
                       FoodSaleCnt: { $sum: '$data.FoodSaleCnt' },
                       FoodRcptTotalAmount: { $sum: '$data.FoodRcptTotalAmount' },
                       InvoiceTotal: { $sum: '$data.InvoiceTotal' },
                       EInvoiceTotal: { $sum: '$data.EInvoiceTotal' },
                       EArchiveInvoiceTotal: { $sum: '$data.EArchiveInvoiceTotal' },
                       BankaTransferTutari: { $sum: '$data.BankaTransferTutari' },
                       TaxRate0Amount: { $sum: '$data.TaxRate0Amount' },
                       TaxRate1Amount: { $sum: '$data.TaxRate1Amount' },
                       TaxRate8Amount: { $sum: '$data.TaxRate8Amount' },
                       TaxRate18Amount: { $sum: '$data.TaxRate18Amount' },
                       FaturaliSatisTutari: { $sum: '$data.FaturaliSatisTutari' },
                       count: { $sum: 1 }
                    }
                }
            ]

            activeDb.pos_device_zreports.aggregate(aggregate,(err,docs)=>{
                if (dberr(err,callback)) {
                    var populate={
                        path:'location',
                        model: 'locations',
                        select:'_id locationName'
                    }

                    activeDb.pos_device_zreports.populate(docs,populate,(err,docs)=>{
                        if (dberr(err,callback)) {
                            
                            callback({success: true,data: docs});
                        }
                    })
                }
            });
        }
    });
}


function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1)}
    if((req.query.pageSize || req.query.limit)){
        options.limit=req.query.pageSize || req.query.limit;
    }

    var filter = {}
    
    options.sort={
        zDate:'asc'
    }

    options.populate={
        path:'posDevice',
        select:'_id location service deviceSerialNo deviceModel',
        populate:[
            {path:'location',select:'_id locationName'},
            {path:'service',select:'_id name serviceType'},
            {path:'localConnector',select:'_id name'}
            ]
    }

    if(req.query.zNo || req.query.ZNo || req.query.zno){
        filter['zNo']=req.query.zNo || req.query.ZNo || req.query.zno;
    }
    if(req.query.zTotal || req.query.ztotal){
        filter['zTotal']=Number((req.query.zTotal || req.query.ztotal));
    }

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

    
    if(req.query.status=='transferred'){
        filter['status']='transferred';
    }else if(req.query.status=='pending'){
        filter['status']='pending';
    }else {
        filter['status']={$nin:['pending','transferred']};
    }


    if(req.query.date1){
        filter['zDate']={$gte:(new Date(req.query.date1))};
    }

    if(req.query.date2){
        if(filter['zDate']){
            filter['zDate']['$lte']=(new Date(req.query.date2));
        }else{
            filter['zDate']={$lte:(new Date(req.query.date2))};
        }
    }



    filter_deviceSerialNo(activeDb,req,filter,(err,filter)=>{
        if(dberr(err,callback)){
            filter_location(activeDb,req,filter,(err,filter)=>{
                if(dberr(err,callback)){
                    
                    activeDb.pos_device_zreports.paginate(filter,options,(err, resp)=>{
                        if (dberr(err,callback)) {
                            resp.docs.forEach((e)=>{
                                e.zDate=e.zDate.yyyymmdd();
                                
                                e.data=services.posDevice.zreportDataToString(e.posDevice.service.serviceType,e.data);
                            });
                            callback({success: true,data: resp});
                           
                        }
                    });
                }
            });
        }
    });
    
}

function filter_deviceSerialNo(activeDb,req,filter,cb){
    if(req.query.deviceSerialNo || req.query['posDevice.deviceSerialNo']){
        activeDb.pos_devices.find({ deviceSerialNo:{$regex: '.*' + (req.query.deviceSerialNo || req.query['posDevice.deviceSerialNo']) + '.*' ,$options: 'i' }},(err,posDeviceDocs)=>{
            if(!err){

                filter['$or']=[];
                posDeviceDocs.forEach((e)=>{
                    filter['$or'].push({posDevice:e._id});
                });
                cb(null,filter);
            }else{
                cb(err,filter);
            }
        });
    }else{
        cb(null,filter);
    }
}

function filter_location(activeDb,req,filter,cb){
    if((req.query.location || req.query['posDevice.location._id']) ){
        activeDb.pos_devices.find({ location: (req.query.location || req.query['posDevice.location._id']) },(err,posDeviceDocs)=>{
            if(!err){
                if(filter['$or']!=undefined){
                    var newOR=[];
                    filter['$or'].forEach((e)=>{
                        var bfound= false;
                        posDeviceDocs.forEach((e2)=>{ 
                            if(e['posDevice'].toString()==e2._id.toString()){
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
                    posDeviceDocs.forEach((e)=>{
                        filter['$or'].push({posDevice:e._id});
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


function getOne(activeDb,member,req,res,callback){
    var populate={
        path:'posDevice',
        select:'_id location service deviceSerialNo deviceModel',
        populate:[
            {path:'location',select:'_id locationName'},
            {path:'service',select:'_id name serviceType'},
            {path:'localConnector',select:'_id name'}
            ]
        }
    activeDb.pos_device_zreports.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}


function post(activeDb,member,req,res,callback){

    var data = req.body || {};
    var newdoc = new activeDb.pos_device_zreports(data);
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
        var data = req.body || {};
        data._id = req.params.param1;
        data.modifiedDate = new Date();

        activeDb.pos_device_zreports.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    // activeDb.pos_device_zreports.countDocuments({_id:{$ne:data._id},locationName:data.locationName},(err,c)=>{
                    //     if(!err){
                    //         if(c>0){
                    //             callback({success: false, error: {code: "ERROR", message: "'" + data.locationName + "' zaten var."}});
                    //         }else{
                                var doc2 = Object.assign(doc, data);
                                var newdoc = new activeDb.pos_device_zreports(doc2);
                                var err=epValidateSync(newdoc);
                                if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                                newdoc.save(function(err, newdoc2) {
                                    if (!err) {
                                        callback({success: true,data: newdoc2});
                                    } else {
                                        callback({success: false, error: {code: err.name, message: err.message}});
                                    }
                                });
                    //         }
                    //     }else{
                    //         callback({success: false, error: {code: err.name, message: err.message}});
                    //     }
                    // });
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
        activeDb.pos_device_zreports.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}

function transfer(activeDb,member,req,res,callback){
    var data = req.body || {};
    if(data.list==undefined){
        return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
    }

    
    var populate={
        path:'posDevice',
        select:'_id location service deviceSerialNo deviceModel',
        populate:['location','service','localConnector']
        }
    var idList=[];
    data.list.forEach((e)=>{
        if(e && typeof e === 'object' && e.constructor === Object){
            if(e._id!=undefined){
                idList.push(e._id);
            }else if(e.id!=undefined){
                idList.push(e.id);
            }else{
                return callback({success: false, error: {code: 'ERROR', message: 'list is wrong.'}});
            }
        }else{
            idList.push(e);
        }
    });
    var filter={status:{$nin:['transferred','pending']},_id:{$in:idList}};
    activeDb.pos_device_zreports.find(filter).populate(populate).exec((err,docs)=>{
        if (dberr(err,callback)) {
            var index=0;
            function pushTask(cb){
                if(index>=docs.length){
                    cb(null);
                }else{
                    var taskdata={taskType:'connector_transfer_zreport',collectionName:'pos_device_zreports',documentId:docs[index]._id,document:docs[index]}
                    taskHelper.newTask(activeDb,taskdata,(err,taskDoc)=>{
                        if(!err){
                            switch(taskDoc.status){
                                case 'running':
                                    docs[index].status='transferring';
                                    break;
                                case 'pending':
                                    docs[index].status='pending';
                                    break;
                                case 'completed':
                                    docs[index].status='transferred';
                                    break;
                                case 'error':
                                    docs[index].status='error';
                                    break;
                                default:
                                     docs[index].status='';
                                     break;
                            }
                            docs[index].save((err,newDoc)=>{
                                if(!err){
                                    index++;
                                    setTimeout(pushTask,0,cb);
                                }else{
                                    cb(err);
                                }
                            });
                        }else{
                            cb(err);
                        }
                    });
                }
            }
            pushTask((err)=>{
                if(dberr(err,callback)){
                    var resp=[]
                    // for(var i=0;i<docs.length;i++){
                    //     resp.push(docs[i]._id.toString());
                    // }
                    docs.forEach((e)=>{
                        resp.push(e._id.toString());
                    });
                    callback({success: true,data:resp});
                }
            });
        }
    })
    
}


function rollback(activeDb,member,req,res,callback){
    var data = req.body || {};
    if(data.list==undefined){
        return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
    }
    
    var idList=[];
    data.list.forEach((e)=>{
        if(e && typeof e === 'object' && e.constructor === Object){
            if(e._id!=undefined){
                idList.push(e._id);
            }else if(e.id!=undefined){
                idList.push(e.id);
            }else{
                return callback({success: false, error: {code: 'ERROR', message: 'rollbackList is wrong.'}});
            }
        }else{
            idList.push(e);
        }
    });
    var filter={status:{$ne:''},_id:{$in:idList}};
    activeDb.pos_device_zreports.updateMany(filter,{$set:{status:''}},{multi:true},(err,resp)=>{
        if(dberr(err,callback)){
            callback({success:true,data:resp});
        }
    });
    
    
}

function setTransferred(activeDb,member,req,res,callback){
    var data = req.body || {};
    if(data.list==undefined){
        return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
    }
    
    var idList=[];
    data.list.forEach((e)=>{
        if(e && typeof e === 'object' && e.constructor === Object){
            if(e._id!=undefined){
                idList.push(e._id);
            }else if(e.id!=undefined){
                idList.push(e.id);
            }else{
                return callback({success: false, error: {code: 'ERROR', message: 'rollbackList is wrong.'}});
            }
        }else{
            idList.push(e);
        }
    });
    var filter={status:{$ne:'transferred'},_id:{$in:idList}};
    activeDb.pos_device_zreports.updateMany(filter,{$set:{status:'transferred'}},{multi:true},(err,resp)=>{
        if(dberr(err,callback)){
            callback({success:true,data:resp});
        }
    });
    
    
}


// function exportLuca(activeDb,member,req,res,callback){
//     var data = req.body || {};
//     if(data.list==undefined){
//         return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
//     }
    
//     var idList=[];
//     data.list.forEach((e)=>{
//         if(e && typeof e === 'object' && e.constructor === Object){
//             if(e._id!=undefined){
//                 idList.push(e._id);
//             }else if(e.id!=undefined){
//                 idList.push(e.id);
//             }else{
//                 return callback({success: false, error: {code: 'ERROR', message: 'rollbackList is wrong.'}});
//             }
//         }else{
//             idList.push(e);
//         }
//     });
//     var filter={status:{$ne:''},_id:{$in:idList}};
//     activeDb.pos_device_zreports.find(filter).populate({
//         path:'posDevice',
//         select:'_id location service deviceSerialNo deviceModel',
//         populate:[
//             {path:'location',select:'_id locationName'},
//             {path:'service',select:'_id name serviceType'},
//             {path:'localConnector',select:'_id name'}
//             ]
//     }).exec((err,docs)=>{
//         if(dberr(err,callback)){
//             var header='Fiş No;Fiş Tarihi;Hesap Kodu;Evrak No;Evrak Tarihi;Açıklama;Borç;Alacak;Miktar;\n';
//             var lines='';
//             for(var i=0;i<docs.length;i++){
//                 if(docs[i].posDevice.service.serviceType=='ingenico'){
//                     lines +='"00000";"' + lucaDate(docs[i].data.ZDate + '";')
//                 }
                
//             }

//             callback({success: true, data:header+lines});
//         }
//     });
    
    
// }

// function lucaDate(sDate){
//     if(sDate.length<10) return '';
//     return  sDate.substr(8,2) + '/' + sDate.substr(5,2) + '/' + sDate.substr(0,4)
// }