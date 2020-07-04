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
        	// if(req.params.param2!=undefined){
        	// 	if(req.params.param2=='file'){
         //        	saveFile(activeDb,member,req,res,callback);
	        //     }else if(req.params.param2.toLowerCase()=='setdefaultinvoicexslt'){
	        //         setDefaultInvoiceXslt(activeDb,member,req,res,callback);
	        //     }else{
	        //         post(activeDb,member,req,res,callback);
	        //     }
        	// }else{
        	// 	post(activeDb,member,req,res,callback);
        	// }
            post(activeDb,member,req,res,callback);
        break;
        case 'PUT':
        	// if(req.params.param2!=undefined){
	        // 	if(req.params.param2=='file'){
	        //         saveFile(activeDb,member,req,res,callback);
	        //     }else if(req.params.param2.toLowerCase()=='setdefaultinvoicexslt'){
	        //         setDefaultInvoiceXslt(activeDb,member,req,res,callback);
	        //     }else{
	        //         put(activeDb,member,req,res,callback);
	        //     }
	        // }else{
         //        put(activeDb,member,req,res,callback);
         //    }
            put(activeDb,member,req,res,callback);
        break;
        case 'DELETE':
        	// if(req.params.param2=='file'){
         //        deleteFile(activeDb,member,req,res,callback);
         //    }else{
         //        deleteItem(activeDb,member,req,res,callback);
         //    }
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
    }else{
        options['limit']=50000;
    }

    var filter = {};
    if((req.query.passive || '') !=''){
        filter['passive']=req.query.passive;
    }
    activeDb.integrators.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            eventLog('error:',err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    var populate=[
        {path:'invoice.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
        {path:'despatch.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
        {path:'order.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
        {path:'document.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'}
    ]
        
    activeDb.integrators.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if (dberr(err,callback)) {
            if(doc==null){
                return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }
            callback({success: true,data: doc});
            
        } 
    });
}


function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;
    
    data=cleanDataEmptyLocalConnector(data);
    saveFiles(activeDb,data,(err,data)=>{
        var newdoc = new activeDb.integrators(data);
        var err=epValidateSync(newdoc);
        if(err) return callback({success: false, error: {code: err.name, message: err.message}});

        newdoc.save(function(err, newdoc2) {
            if (!err) {
                if(newdoc2.isDefault){
                    activeDb.integrators.updateMany({isDefault:true,_id:{$ne:newdoc2._id}},{$set:{isDefault:false}},{multi:true},(err,resp)=>{
                        callback({success:true,data:newdoc2});
                    });
                }else{
                    callback({success:true,data:newdoc2});
                }
                
            } else {
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    });
       
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data = req.body || {};
        
        data._id = req.params.param1;
        data.modifiedDate = new Date();

        activeDb.integrators.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    
                    data=cleanDataEmptyLocalConnector(data);
                    saveFiles(activeDb,data,(err,data)=>{
                        var doc2 = Object.assign(doc, data);
                        var newdoc = new activeDb.integrators(doc2);
                        var err=epValidateSync(newdoc);
                        if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                        newdoc.save(function(err, newdoc2) {
                            if (!err) {
                                if(newdoc2.isDefault){
                                    activeDb.integrators.updateMany({isDefault:true,_id:{$ne:newdoc2._id}},{$set:{isDefault:false}},{multi:true},(err,resp)=>{
                                        callback({success:true,data:newdoc2});
                                    });
                                }else{
                                    callback({success:true,data:newdoc2});
                                }
                            } else {
                                callback({success: false, error: {code: err.name, message: err.message}});
                            }
                        });
                    })
                }
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}

function saveFiles(activeDb,data,callback){
    xsltKaydet(activeDb,data.invoice.xsltFiles,(err,array1)=>{
        data.invoice.xsltFiles=array1;
        if(array1.length>0) data.invoice['xslt']=array1[0];

        xsltKaydet(activeDb,data.despatch.xsltFiles,(err,array2)=>{
            data.despatch.xsltFiles=array2;
            if(array2.length>0) data.despatch['xslt']=array2[0];
            xsltKaydet(activeDb,data.document.xsltFiles,(err,array3)=>{
                data.document.xsltFiles=array3;
                if(array3.length>0) data.document['xslt']=array3[0];
                xsltKaydet(activeDb,data.order.xsltFiles,(err,array4)=>{
                    data.order.xsltFiles=array4;
                    if(array4.length>0) data.order['xslt']=array4[0];
                    callback(null,data);
                })
            })
        })
    })
}

function xsltKaydet(activeDb,xsltFiles,callback){
    if(xsltFiles==undefined) return callback(null,[]);
    if(xsltFiles.length==0) return callback(null,[]);

    var dizi=[];
    var index=0;
    function kaydet(cb){
        if(index>=xsltFiles.length) return cb(null);
        var data={ 
            data:xsltFiles[index].data,
            fileName:(xsltFiles[index].fileName || ''),
            name:(xsltFiles[index].name || ''),
            extension:(xsltFiles[index].extension || ''),
            type:(xsltFiles[index].type || 'text/plain')
        }
        if(data.fileName=='' && data.name==''){
            index++;
            setTimeout(kaydet,0,cb);
            return;
        }
        if((xsltFiles[index]._id || '')!=''){
            activeDb.files.findOne({_id:xsltFiles[index]._id},(err,doc)=>{
                if(!err){
                    if(doc!=null){
                        doc.data=data.data;
                        doc.fileName=data.fileName;
                        doc.name=data.name;
                        doc.extension=data.extension;
                        doc.type=data.type;
                        doc.save((err,doc2)=>{
                            if(!err){
                                dizi.push(doc2._id);
                            }else{
                                errorLog(err);
                            }
                            index++;
                            setTimeout(kaydet,0,cb);
                        });
                    }else{
                        var newFile=new activeDb.files(data);
                        newFile.save((err,doc2)=>{
                            if(!err){
                                dizi.push(doc2._id);
                            }else{
                                errorLog(err);
                            }
                            index++;
                            setTimeout(kaydet,0,cb);
                        });
                    }
                }else{
                    index++;
                    setTimeout(kaydet,0,cb);
                }
            });
        }else{
            var newFile=new activeDb.files(data);
            newFile.save((err,doc2)=>{
                if(!err){
                    dizi.push(doc2._id);
                }else{
                    errorLog(err);
                }
                index++;
                setTimeout(kaydet,0,cb);
            });
        }
    }
    
    kaydet((err)=>{
        console.log('dizi:',dizi);
        callback(null,dizi);
    })
}

function cleanDataEmptyLocalConnector(data){
    if(data['invoice'])
        if(data['invoice']['localConnector'])
            if(data['invoice']['localConnector']['import'])
                if(data['invoice']['localConnector']['import'].localConnector==''){
                    data['invoice']['localConnector']['import'].localConnector=undefined;
                    delete data['invoice']['localConnector']['import'].localConnector;
                }
    if(data['invoice'])
        if(data['invoice']['localConnector'])
            if(data['invoice']['localConnector']['export'])
                if(data['invoice']['localConnector']['export'].localConnector==''){
                    data['invoice']['localConnector']['export'].localConnector=undefined;
                    delete data['invoice']['localConnector']['export'].localConnector;
                }
    if(data['despatch'])
        if(data['despatch']['localConnector'])
            if(data['despatch']['localConnector']['import'])
                if(data['despatch']['localConnector']['import'].localConnector==''){
                    data['despatch']['localConnector']['import'].localConnector=undefined;
                    delete data['despatch']['localConnector']['import'].localConnector;
                }
    if(data['despatch'])
        if(data['despatch']['localConnector'])
            if(data['despatch']['localConnector']['export'])
                if(data['despatch']['localConnector']['export'].localConnector==''){
                    data['despatch']['localConnector']['export'].localConnector=undefined;
                    delete data['despatch']['localConnector']['export'].localConnector;
                }
    if(data['document'])
        if(data['document']['localConnector'])
            if(data['document']['localConnector']['import'])
                if(data['document']['localConnector']['import'].localConnector==''){
                    data['document']['localConnector']['import'].localConnector=undefined;
                    delete data['document']['localConnector']['import'].localConnector;
                }
    if(data['document'])
        if(data['document']['localConnector'])
            if(data['document']['localConnector']['export'])
                if(data['document']['localConnector']['export'].localConnector==''){
                    data['document']['localConnector']['export'].localConnector=undefined;
                    delete data['document']['localConnector']['export'].localConnector;
                }
    if(data['order'])
        if(data['order']['localConnector'])
            if(data['order']['localConnector']['import'])
                if(data['order']['localConnector']['import'].localConnector==''){
                    data['order']['localConnector']['import'].localConnector=undefined;
                    delete data['order']['localConnector']['import'].localConnector;
                }
    if(data['order'])
        if(data['order']['localConnector'])
            if(data['order']['localConnector']['export'])
                if(data['order']['localConnector']['export'].localConnector==''){
                    data['order']['localConnector']['export'].localConnector=undefined;
                    delete data['order']['localConnector']['export'].localConnector;
                }
    if(data['ledger'])
        if(data['ledger']['localConnector'])
            if(data['ledger']['localConnector']['import'])
                if(data['ledger']['localConnector']['import'].localConnector==''){
                    data['ledger']['localConnector']['import'].localConnector=undefined;
                    delete data['ledger']['localConnector']['import'].localConnector;
                }
    if(data['ledger'])
        if(data['ledger']['localConnector'])
            if(data['order']['localConnector']['export'])
                if(data['ledger']['localConnector']['export'].localConnector==''){
                    data['ledger']['localConnector']['export'].localConnector=undefined;
                    delete data['ledger']['localConnector']['export'].localConnector;
                } 
    return data;
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.integrators.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}

