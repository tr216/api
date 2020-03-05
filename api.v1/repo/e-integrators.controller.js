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
    activeDb.e_integrators.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            eventLog('error:',err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    var populate=[
        {path:'eInvoice.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
        {path:'eDespatch.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
        {path:'eDocument.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'}
    ]
        
    activeDb.e_integrators.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
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
    data=cleanDataEmptyLocalConnector(data);
    saveFiles(activeDb,data,(err,data)=>{
        var newdoc = new activeDb.e_integrators(data);
        var err=epValidateSync(newdoc);
        if(err) return callback({success: false, error: {code: err.name, message: err.message}});

        newdoc.save(function(err, newdoc2) {
            if (!err) {
                if(newdoc2.isDefault){
                    activeDb.e_integrators.updateMany({isDefault:true,_id:{$ne:newdoc2._id}},{$set:{isDefault:false}},{multi:true},(err,resp)=>{
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

        activeDb.e_integrators.findOne({ _id: data._id},(err,doc)=>{
            if (!err) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    
                    data=cleanDataEmptyLocalConnector(data);
                    saveFiles(activeDb,data,(err,data)=>{
                        var doc2 = Object.assign(doc, data);
                        var newdoc = new activeDb.e_integrators(doc2);
                        var err=epValidateSync(newdoc);
                        if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                        newdoc.save(function(err, newdoc2) {
                            if (!err) {
                                if(newdoc2.isDefault){
                                    activeDb.e_integrators.updateMany({isDefault:true,_id:{$ne:newdoc2._id}},{$set:{isDefault:false}},{multi:true},(err,resp)=>{
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
    xsltKaydet(activeDb,data.eInvoice.xsltFiles,(err,array1)=>{
        data.eInvoice.xsltFiles=array1;
        if(array1.length>0) data.eInvoice['xslt']=array1[0];

        xsltKaydet(activeDb,data.eDespatch.xsltFiles,(err,array2)=>{
            data.eDespatch.xsltFiles=array2;
            if(array2.length>0) data.eDespatch['xslt']=array2[0];
            xsltKaydet(activeDb,data.eDocument.xsltFiles,(err,array3)=>{
                data.eDocument.xsltFiles=array3;
                if(array3.length>0) data.eDocument['xslt']=array3[0];
                callback(null,data);
            })
        })
    })
}

function xsltKaydet(activeDb,xsltFiles,callback){
    if(xsltFiles==undefined) return [];
    if(xsltFiles.length==0) return [];

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
    if(data['eInvoice'])
        if(data['eInvoice']['localConnector'])
            if(data['eInvoice']['localConnector']['import'])
                if(data['eInvoice']['localConnector']['import'].localConnector==''){
                    data['eInvoice']['localConnector']['import'].localConnector=undefined;
                    delete data['eInvoice']['localConnector']['import'].localConnector;
                }
    if(data['eInvoice'])
        if(data['eInvoice']['localConnector'])
            if(data['eInvoice']['localConnector']['export'])
                if(data['eInvoice']['localConnector']['export'].localConnector==''){
                    data['eInvoice']['localConnector']['export'].localConnector=undefined;
                    delete data['eInvoice']['localConnector']['export'].localConnector;
                }
    if(data['eDespatch'])
        if(data['eDespatch']['localConnector'])
            if(data['eDespatch']['localConnector']['import'])
                if(data['eDespatch']['localConnector']['import'].localConnector==''){
                    data['eDespatch']['localConnector']['import'].localConnector=undefined;
                    delete data['eDespatch']['localConnector']['import'].localConnector;
                }
    if(data['eDespatch'])
        if(data['eDespatch']['localConnector'])
            if(data['eDespatch']['localConnector']['export'])
                if(data['eDespatch']['localConnector']['export'].localConnector==''){
                    data['eDespatch']['localConnector']['export'].localConnector=undefined;
                    delete data['eDespatch']['localConnector']['export'].localConnector;
                }
    if(data['eDocument'])
        if(data['eDocument']['localConnector'])
            if(data['eDocument']['localConnector']['import'])
                if(data['eDocument']['localConnector']['import'].localConnector==''){
                    data['eDocument']['localConnector']['import'].localConnector=undefined;
                    delete data['eDocument']['localConnector']['import'].localConnector;
                }
    if(data['eDocument'])
        if(data['eDocument']['localConnector'])
            if(data['eDocument']['localConnector']['export'])
                if(data['eDocument']['localConnector']['export'].localConnector==''){
                    data['eDocument']['localConnector']['export'].localConnector=undefined;
                    delete data['eDocument']['localConnector']['export'].localConnector;
                }
    return data;
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.e_integrators.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}

