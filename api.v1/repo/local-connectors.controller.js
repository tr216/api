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
           
            if(req.params.param1=='test'){
                test(activeDb,member,req,res,callback);
            }else{
                if(req.params.param2=='file'){
                    
                    saveFile(activeDb,member,req,res,callback);
                }else if(req.params.param2=='run'){
                    
                    runCode(activeDb,member,req,res,callback);
                }else if(req.params.param2=='setstart' || req.params.param2=='setStart'){
                    setStart(activeDb,member,req,res,callback);
                }else{
                    post(activeDb,member,req,res,callback);
                }
            }
        break;
        case 'PUT':
            if(req.params.param2=='file'){
                saveFile(activeDb,member,req,res,callback);
            }else if(req.params.param2=='run'){
                runCode(activeDb,member,req,res,callback);
            }else if(req.params.param2=='setstart' || req.params.param2=='setStart'){
                setStart(activeDb,member,req,res,callback);
            }else{
                put(activeDb,member,req,res,callback);
            }
        break;
        case 'DELETE':
            if(req.params.param2=='file'){
                deleteFile(activeDb,member,req,res,callback);
            }else{
                deleteItem(activeDb,member,req,res,callback);
            }
            
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
    if((req.query.connectorType || '')!=''){
        filter['connectorType']=req.query.connectorType;
    }
    
    activeDb.local_connectors.paginate(filter,options,(err, resp)=>{
        if(dberr(err,callback)){
            var filter={$or:[]}
            resp.docs.forEach((item)=>{
                filter.$or.push({connectorId:item.connectorId,connectorPass:item.connectorPass});
            });
            db.etulia_connectors.find(filter,(err,docs)=>{
                if(dberr(err,callback)){
                    resp.docs.forEach((item)=>{
                        var connectedItem= docs.find((e)=>{return (item.connectorId==e.connectorId && item.connectorPass==e.connectorPass)});
                        if(connectedItem!=undefined){
                            item['status']='offline';
                            item['lastOnline']=connectedItem.lastOnline;
                            if((new Date()-connectedItem.lastOnline)/1000<120){
                                item['status']='online';
                            }
                        }else{
                            item['status']='error';
                            item['lastOnline']=null;
                        }
                    });
                    callback({success: true,data: resp});
                }
            });
            
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    var populate=[{path:'files',select:'_id name extension fileName type size createdDate modifiedDate'}];
    var fileId=req.query.fileId || req.query.fileid || '';
    
    activeDb.local_connectors.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if (dberr(err,callback)) {
            if(doc==null){
                return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }
            if(doc.startFile!=undefined){
                doc=doc.toObject();
                doc.files.forEach((e)=>{
                    if(e._id==doc.startFile.toString()){
                        e['isStart']=true;
                    }else{
                        e['isStart']=false;
                    }
                    
                });
               
            }
            if(fileId!=''){
                var bFound=false;
                doc.files.forEach((e)=>{
                    if(e._id==fileId){
                        bFound=true;
                        return;
                    }
                });
                if(!bFound){
                    callback({success: false,error: {code: 'FILE_NOT_FOUND', message: 'Dosya bulunamadi'}});
                }else{
                    activeDb.files.findOne({_id:fileId},(err,fileDoc)=>{
                        if(dberr(err,callback)){

                                if(fileDoc){
                                    doc.files.forEach((e)=>{
                                        if(e._id==fileId){
                                            e['data']=fileDoc.data;
                                            return;
                                        }
                                    });
                                }
                            callback({success: true,data: doc});
                        }
                    });
                }
               
            }else{
               
                callback({success: true,data: doc});
            }
            
        } 
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    var newdoc = new activeDb.local_connectors(data);
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


        activeDb.local_connectors.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new activeDb.local_connectors(doc2);
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
        activeDb.local_connectors.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}


function saveFile(activeDb,member,req,res,callback){
    if(req.params.param1==undefined || req.params.param2==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data = req.body || {};
        var populate=[{path:'files',select:'_id name extension size type fileName '}];

        if(req.body._id!=undefined){
            data['_id']=req.body._id;
        }else{
             data['_id']=req.query.fileId || req.query.fileid
        }
        eventLog('fileID:',data['_id']);

        activeDb.local_connectors.findOne({ _id: req.params.param1}).populate(populate).exec((err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{

                    if(data._id==undefined){
                        eventLog('data:',data);
                        var newfileDoc = new activeDb.files(data);
                        var err=epValidateSync(newfileDoc);
                        if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                        newfileDoc.save(function(err, newfileDoc2) {
                            if(dberr(err,callback)){
                                doc.files.push(newfileDoc2._id);
                                doc.modifiedDate=new Date();
                                doc.save((err)=>{
                                    if(dberr(err,callback)){
                                        callback({success: true,data: ''});
                                    }
                                });
                            }
                        });
                    }else{
                        var bFound=false;
                        doc.files.forEach((f)=>{
                            if(f._id != undefined){
                                if(f.name==data['name'] && f.extension==data['extension'] && f._id != data._id){
                                    bFound=true;
                                    return;
                                }
                            }
                        });
                        if(bFound){
                            return callback({success: false,error: {code: 'ALREADY_EXISTS', message: 'Ayni dosya isminden baska bir kayit daha var!'}});
                        }

                        activeDb.files.findOne({_id:data._id},(err,fileDoc)=>{
                            if(dberr(err,callback)){
                                if(fileDoc==null) return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                                fileDoc.name=data.name;
                                fileDoc.extension=data.extension;
                                //fileDoc.modifiedDate=new Date();
                                fileDoc.data=data.data;
                                fileDoc.type=data.type;
                                fileDoc.size=data.size;

                                //eventLog('fileDoc:',fileDoc);
                                var err=epValidateSync(fileDoc);
                                if(dberr(err,callback)){
                                    fileDoc.save((err)=>{
                                        if(dberr(err,callback)){
                                            doc.modifiedDate=new Date();
                                            doc.save((err)=>{
                                                if(dberr(err,callback)){
                                                    callback({success: true,data: ''});
                                                }
                                            });
                                        }
                                    });
                                    
                                }
                            }
                        });
                    }
                }
            }
        });
    }
}

function setStart(activeDb,member,req,res,callback){
    if(req.params.param1==undefined || req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '') {
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var fileId=req.query.fileId || req.query.fileid || '';
        activeDb.local_connectors.findOne({ _id: req.params.param1,files:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    doc.files.forEach((e,index)=>{
                        if(e==req.query.fileId){
                            doc.startFile=e._id;
                            return;
                        }
                    });
                    doc.save((err,doc2)=>{
                        if (dberr(err,callback)) {
                            callback({success: true,data:''});
                        }
                    });
                    
                }
            }
        });
    }
}

function deleteFile(activeDb,member,req,res,callback){
    if(req.params.param1==undefined || req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '') {
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var fileId=req.query.fileId || req.query.fileid || '';
        activeDb.local_connectors.findOne({ _id: req.params.param1,files:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    doc.files.forEach((e,index)=>{
                        if(e==req.query.fileId){
                            doc.files.splice(index,1);
                            return;
                        }
                    });
                    doc.save((err,doc2)=>{
                        if (dberr(err,callback)) {
                            activeDb.files.removeOne(member,{ _id: req.query.fileId },(err)=>{
                                if (!err) {
                                    callback({success: true,data:doc2});
                                }else{
                                    callback({success: false, error: {code: err.name, message: err.message}});
                                }
                            });
                        }
                    });
                    
                }
            }
        });
    }
}

function runCode(activeDb,member,req,res,callback){
    if(req.params.param1==undefined || req.params.param2==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data = req.body || {};
        var populate=['startFile','files'];
        activeDb.local_connectors.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
            if(dberr(err,callback)){
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    var sampleData={};

                    if(data.sampleData!=undefined) sampleData=data.sampleData;
                    services.tr216LocalConnector.run(doc,sampleData,(err,resp)=>{
                        if(!err){
                            callback({success:true,data:(resp || '')});
                        }else{
                            callback({success: false,error: {code: (err.name || 'CONNECTOR_RUN_ERROR'), message: err.message}});
                        }
                    });
                }
            }
        });
    }
}


function test(activeDb,member,req,res,callback){
    var data = req.body || {};
    //var newdoc = new activeDb.local_connectors(data);
   
    if(data['connectorId']==undefined || data['connectorPass']==undefined || data['connectionType']==undefined){
        return callback({success:false,error:{code:'WRONG_PARAMETER',message:'connectorId, connectorPass, connectionType are required.'}});
    }

    switch(data.connectionType){
        case 'mssql':

            services.tr216LocalConnector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
                ,'MSSQL_CONNECTION_TEST',{connection:data.connection,query:''},(result)=>{
                callback(result);
            });
            break;
        case 'mysql':
            services.tr216LocalConnector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
                ,'MYSQL_CONNECTION_TEST',{connection:data.connection,query:''},(result)=>{
                callback(result);
            });
            break;
        default:
            services.tr216LocalConnector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
                ,'TIME',{},(result)=>{
                callback(result);
            });
            break;
    }
   
}