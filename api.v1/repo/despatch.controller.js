module.exports = function(activeDb, member, req, res, callback) {
    if(req.params.param1==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});

    switch(req.method){
        case 'GET':
            switch(req.params.param1.lcaseeng()){
                case 'inboxdespatchlist':
                return getDespatchList(1,activeDb,member,req,res,callback);
                break;
                case 'outboxdespatchlist':
                return getDespatchList(0,activeDb,member,req,res,callback);
                break;
                case 'despatch':
                return getDespatch(activeDb,member,req,res,callback);
                break;
                
                case 'edespatchuserlist':
                return getEDespatchUserList(activeDb,member,req,res,callback);
                case 'errors':
                return getErrors(activeDb,member,req,res,callback);

                default:
                return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
                break;
            }
        break;
        case 'POST':
            switch(req.params.param1.lcaseeng()){
                case 'transfer':
                    // if(req.params.param2.lcaseeng()=='import'){
                    //     transferImport(activeDb,member,req,res,callback)
                    // }else if(req.params.param2.lcaseeng()=='export'){
                        return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
                    // }else{
                    //     return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
                    // }
                break;
                case 'sendtogib':
                    return sendToGib(activeDb,member,req,res,callback);
                case 'approve':
                    return approveDeclineDespatch('approve', activeDb,member,req,res,callback);
                case 'decline':
                    return approveDeclineDespatch('decline', activeDb,member,req,res,callback);
                case 'saveinboxdespatch':
                case 'saveoutboxdespatch':
                case 'despatch':
                    return post(activeDb,member,req,res,callback);
                
                default:
                    return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
                break;
            }

        break;
        case 'PUT':

            switch(req.params.param1.lcaseeng()){
                
                case 'saveinboxdespatch':
                case 'saveoutboxdespatch':
                case 'despatch':
                    return put(activeDb,member,req,res,callback);
                
                default:
                    return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
                break;
            }
        break;
        default:
        return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }
}


function getErrors(activeDb,member,req,res,callback){
    var _id= req.params.param2 || req.query._id || '';
    var select='_id profileId ID despatchTypeCode localDocumentId issueDate ioType eIntegrator despatchErrors localErrors despatchStatus localStatus';
    
    if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
    activeDb.despatches.findOne({_id:_id},select).exec((err,doc)=>{
        if(dberr(err,callback))
            if(dbnull(doc,callback)){
                var data=doc.toJSON();
                callback({success: true,data: data});
            }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;
    
    data=mrutil.amountValueFixed2Digit(data,'');
    var newDoc = new activeDb.despatches(data);
    var err=epValidateSync(newDoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
    newDoc.uuid.value=uuid.v4();
    
    activeDb.e_integrators.findOne({_id:newDoc.eIntegrator},(err,eIntegratorDoc)=>{
        if(dberr(err,callback)){
            if(eIntegratorDoc==null) return callback({success: false,error: {code: 'ENTEGRATOR', message: 'Faturada entegrator bulanamadi.'}});
            documentHelper.yeniIrsaliyeNumarasi(activeDb,eIntegratorDoc,newDoc,(err,newDoc)=>{
                newDoc.save(function(err, newDoc2) {
                    if(dberr(err,callback)){
                        callback({success:true,data:newDoc2});
                    }
                });  
            });
        }
    });
}


function put(activeDb,member,req,res,callback){
    
    if(req.params.param2==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    var data = req.body || {};
    data._id = req.params.param2;
    data.modifiedDate = new Date();
    
    activeDb.despatches.findOne({ _id: data._id},(err,doc)=>{
        if (!err) {
            if(doc==null){
                eventLog('doc==null');
                callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }else{
                data=mrutil.amountValueFixed2Digit(data,'');
                var doc2 = Object.assign(doc, data);
                var newDoc = new activeDb.despatches(doc2);
                var err=epValidateSync(newDoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                //newDoc=calculateInvoiceTotals(newDoc);
                newDoc.save(function(err, newDoc2) {
                    if(dberr(err,callback)){
                        eventLog('After taxtotal:',doc.taxTotal);
                        callback({success: true,data: newDoc2});
                    }
                });
               
            }
        }else{
            eventLog('put error:',err);
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function getDespatchList(ioType,activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1), 
        populate:[
        {path:'eIntegrator',select:'_id eIntegrator name username'}
        ],
        limit:10
        ,
        select:'_id eIntegrator profileId ID uuid issueDate issueTime despatchAdviceTypeCode lineCountNumeric localDocumentId deliveryCustomerParty despatchSupplierParty despatchStatus despatchErrors localStatus localErrors',
        sort:{'issueDate.value':'desc' , 'ID.value':'desc'}
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    var filter = {ioType:ioType}
    
    if(req.query.eIntegrator){
        filter['eIntegrator']=req.query.eIntegrator;
    }
    if((req.query.ID || '')!=''){
        filter['ID.value']={ $regex: '.*' + req.query.ID + '.*' ,$options: 'i' };
    }
    if((req.query.despatchNo || '')!=''){
        if(filter['$or']==undefined) filter['$or']=[];
        filter['$or'].push({'ID.value':{ '$regex': '.*' + req.query.despatchNo + '.*' , '$options': 'i' }})
        filter['$or'].push({'localDocumentId':{ '$regex': '.*' + req.query.despatchNo + '.*' ,'$options': 'i' }})
    }
    if(req.query.despatchStatus){
        filter['despatchStatus']=req.query.despatchStatus;
    }
    if((req.query.profileId || '')!=''){
        filter['profileId.value']=req.query.profileId;
    }
    if((req.query.despatchAdviceTypeCode || '')!=''){
        filter['despatchAdviceTypeCode.value']=req.query.despatchAdviceTypeCode;
    }

    if((req.query.date1 || '')!=''){
        filter['issueDate.value']={$gte:req.query.date1};
    }

    if((req.query.date2 || '')!=''){
        if(filter['issueDate.value']){
            filter['issueDate.value']['$lte']=req.query.date2;
        }else{
            filter['issueDate.value']={$lte:req.query.date2};
        }
    }
    
    activeDb.despatches.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            var liste=[]
            resp.docs.forEach((e,index)=>{

                var obj={}
                obj['_id']=e['_id'];
                obj['eIntegrator']=e['eIntegrator'];
                obj['ioType']=e['ioType'];
                obj['profileId']=e['profileId'].value;
                obj['ID']=e.ID.value;
                obj['uuid']=e['uuid'].value;
                obj['issueDate']=e['issueDate'].value;
                obj['issueTime']=e['issueTime'].value;
                obj['despatchAdviceTypeCode']=e['despatchAdviceTypeCode'].value;
                
                obj['party']={title:'',vknTckn:''}
                if(ioType==0){
                    obj['party']['title']=e.deliveryCustomerParty.party.partyName.name.value || (e.deliveryCustomerParty.party.person.firstName.value + ' ' + e.deliveryCustomerParty.party.person.familyName.value);;
                    e.deliveryCustomerParty.party.partyIdentification.forEach((e2)=>{
                        var schemeID='';
                        if(e2.ID.attr!=undefined){
                            schemeID=(e2.ID.attr.schemeID || '').toLowerCase();
                        }
                        if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
                            obj['party']['vknTckn']=e2.ID.value || '';
                            return;
                        }
                    });
                }else{
                    obj['party']['title']=e.despatchSupplierParty.party.partyName.name.value || (e.despatchSupplierParty.party.person.firstName.value + ' ' + e.despatchSupplierParty.party.person.familyName.value);
                    e.despatchSupplierParty.party.partyIdentification.forEach((e2)=>{
                        var schemeID='';
                        if(e2.ID.attr!=undefined){
                            schemeID=(e2.ID.attr.schemeID || '').toLowerCase();
                        }
                        
                        if(schemeID.indexOf('vkn')>-1 || schemeID.indexOf('tckn')>-1){
                            obj['party']['vknTckn']=e2.ID.value || '';
                            return;
                        }

                    });
                }
                
                obj['lineCountNumeric']=e['lineCountNumeric'].value;
                obj['localDocumentId']=e['localDocumentId'];
                obj['despatchStatus']=e['despatchStatus'];
                obj['despatchErrors']=e['despatchErrors'];
                obj['localStatus']=e['localStatus'];
                obj['localErrors']=e['localErrors'];
                

                liste.push(obj);
            });
            resp.docs=liste;
            callback({success: true,data: resp});
        } else {
            errorLog('error:',err);
        }
    });
}

function getDespatch(activeDb,member,req,res,callback){
    var _id= req.params.param2 || req.query._id || '';
    var includeAdditionalDocumentReference= req.query.includeAdditionalDocumentReference || false;
    var select='-additionalDocumentReference';
    if(includeAdditionalDocumentReference==true) select='';
    
    if(_id=='') return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
    activeDb.despatches.findOne({_id:_id},select).exec((err,doc)=>{
        if(dberr(err,callback))
            if(dbnull(doc,callback)){
                var data=doc.toJSON();
                callback({success: true,data: data});
            }
    });
}

function getEDespatchUserList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1), 
        limit:10
    }

    if((req.query.pageSize || req.query.limit)){
        options['limit']=req.query.pageSize || req.query.limit;
    }

    var filter = {}
    
    var vkn=req.query.vkn || req.query.tckn || req.query.vknTckn || req.query.taxNumber || req.query.identifier || '';

    if(vkn!=''){
        filter['identifier']={ '$regex': '.*' + vkn + '.*' ,'$options': 'i' };
    }
    if((req.query.title || '')!=''){
        filter['title']={ '$regex': '.*' + req.query.title + '.*' ,'$options': 'i' };
    }
    if(req.query.enabled){
        filter['enabled']=Boolean(req.query.enabled);
    }
    if((req.query.postboxAlias || '')!=''){
        filter['postboxAlias']={ $regex: '.*' + req.query.postboxAlias + '.*' ,$options: 'i' };
    }
    
    
    db.einvoice_users.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } 
    });
}

function sendToGib(activeDb,member,req,res,callback){
    var data = req.body || {};
    if(data.list==undefined){
        return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
    }
    var populate={
        path:'eIntegrator'
        //select:'_id eIntegrator name url username password firmNo invoicePrefix dispatchPrefix postboxAlias senderboxAlias passive'
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
    var filter={despatchStatus:{$in:['Draft','Error']},_id:{$in:idList}};

    activeDb.despatches.find(filter).populate(populate).exec((err,docs)=>{
        if (dberr(err,callback)) {
            var index=0;

            function pushTask(cb){
                if(index>=docs.length){
                    cb(null);
                }else{
                    
                    var taskdata={taskType:'einvoice_send_to_gib',collectionName:'despatches',documentId:docs[index]._id,document:docs[index].toJSON()}
                    taskHelper.newTask(activeDb, taskdata,(err,taskDoc)=>{
                        if(!err){
                            switch(taskDoc.status){
                                case 'running':
                                    docs[index].status='Processing';
                                    break;
                                case 'pending':
                                    docs[index].despatchStatus='Pending';
                                    break;
                                case 'completed':
                                    docs[index].despatchStatus='Processing';
                                    break;
                                case 'error':
                                    docs[index].despatchStatus='Error';
                                    break;
                                default:
                                     //docs[index].despatchStatus='';
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


function approveDeclineDespatch(type, activeDb,member,req,res,callback){
    var data = req.body || {};
    if(data.list==undefined){
        return callback({success: false, error: {code: 'ERROR', message: 'list is required.'}});
    }
    var taskType='';
    switch(type){
        case 'approve':
            taskType='despatch_approve';
        break;
        case 'decline':
            taskType='despatch_decline';
        break;
    }
    var populate={
        path:'eIntegrator'
    }
    var select='_id ID uuid eIntegrator';

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

    var filter={despatchStatus:'WaitingForAprovement',_id:{$in:idList}};

    activeDb.despatches.find(filter).select(select).populate(populate).exec((err,docs)=>{
        if (dberr(err,callback)) {
            var index=0;
            function pushTask(cb){
                eventLog('docs.length:',docs.length);
                if(index>=docs.length){
                    cb(null);
                }else{
                    
                    var taskdata={taskType: taskType,collectionName:'despatches',documentId:docs[index]._id,document:docs[index].toJSON()}
                    taskHelper.newTask(activeDb, taskdata,(err,taskDoc)=>{
                        if(!err){
                            docs[index].save((err,newDoc)=>{
                                if(!err){
                                    index++;
                                    setTimeout(pushTask,0,cb);
                                }else{
                                    eventLog('burasi:',err);
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
                if(err){
                    errorLog(err);
                }
                if(dberr(err,callback)){
                    var resp=[]
                    
                    docs.forEach((e)=>{
                        resp.push(e._id.toString());
                    });
                    callback({success: true,data:resp});
                }
            });
        }
    })
}
