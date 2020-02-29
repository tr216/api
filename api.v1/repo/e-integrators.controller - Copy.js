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
        	if(req.params.param2!=undefined){
        		if(req.params.param2=='file'){
                	saveFile(activeDb,member,req,res,callback);
	            }else if(req.params.param2.toLowerCase()=='setdefaultinvoicexslt'){
	                setDefaultInvoiceXslt(activeDb,member,req,res,callback);
	            }else{
	                post(activeDb,member,req,res,callback);
	            }
        	}else{
        		post(activeDb,member,req,res,callback);
        	}
            
        break;
        case 'PUT':
        	if(req.params.param2!=undefined){
	        	if(req.params.param2=='file'){
	                saveFile(activeDb,member,req,res,callback);
	            }else if(req.params.param2.toLowerCase()=='setdefaultinvoicexslt'){
	                setDefaultInvoiceXslt(activeDb,member,req,res,callback);
	            }else{
	                put(activeDb,member,req,res,callback);
	            }
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
    var options={page: (req.query.page || 1),
        populate:[
            {path:'localConnectorImportInvoice.localConnector'},
            {path:'localConnectorExportInvoice.localConnector'},
            {path:'localConnectorImportELedger.localConnector'}
        ]
        
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
    var populate=[{path:'invoiceXsltFiles',select:'_id name extension fileName type size createdDate modifiedDate'}];
    var fileId=req.query.fileId || req.query.fileid || '';
    
    activeDb.e_integrators.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
        if (dberr(err,callback)) {
            if(doc==null){
                return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }
            if(doc.invoiceXslt!=undefined){
                doc=doc.toJSON();
                doc.invoiceXsltFiles.forEach((e)=>{
                	eventLog('e._id:',e._id)
                	eventLog('doc.invoiceXslt:',doc.invoiceXslt.toString())
                    if(e._id.toString()==doc.invoiceXslt.toString()){
                        e['isDefault']=true;
                    }else{
                        e['isDefault']=false;
                    }
                    
                });
               
            }
            if(fileId!=''){
                var bFound=false;
                doc.invoiceXsltFiles.forEach((e)=>{
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
                                    doc.invoiceXsltFiles.forEach((e)=>{
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
    if(data['localConnectorImportInvoice']){
        if(data['localConnectorImportInvoice'].localConnector==''){
            data['localConnectorImportInvoice'].localConnector=undefined;
            delete data['localConnectorImportInvoice'].localConnector;
        }
    }
    if(data['localConnectorExportInvoice']){
        if(data['localConnectorExportInvoice'].localConnector==''){
            data['localConnectorExportInvoice'].localConnector=undefined;
            delete data['localConnectorExportInvoice'].localConnector;
        }
    }
    if(data['localConnectorImportELedger']){
        if(data['localConnectorImportELedger'].localConnector==''){
            data['localConnectorImportELedger'].localConnector=undefined;
            delete data['localConnectorImportELedger'].localConnector;
        }
    }
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
                    if(data['localConnectorImportInvoice']){
                        if(data['localConnectorImportInvoice'].localConnector==''){
                            data['localConnectorImportInvoice'].localConnector=undefined;
                            delete data['localConnectorImportInvoice'].localConnector;
                        }
                    }
                    if(data['localConnectorExportInvoice']){
                        if(data['localConnectorExportInvoice'].localConnector==''){
                            data['localConnectorExportInvoice'].localConnector=undefined;
                            delete data['localConnectorExportInvoice'].localConnector;
                        }
                    }
                    if(data['localConnectorImportELedger']){
                        if(data['localConnectorImportELedger'].localConnector==''){
                            data['localConnectorImportELedger'].localConnector=undefined;
                            delete data['localConnectorImportELedger'].localConnector;
                        }
                    }
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
        activeDb.e_integrators.removeOne(member,{ _id: data._id},(err,doc)=>{
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
        var populate=[{path:'invoiceXsltFiles',select:'_id name extension size type fileName '}];

        if(req.body._id!=undefined){
            data['_id']=req.body._id;
        }else{
             data['_id']=req.query.fileId || req.query.fileid
        }
        eventLog('fileID:',data['_id']);

        activeDb.e_integrators.findOne({ _id: req.params.param1}).populate(populate).exec((err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{

                    if(data._id==undefined){
                        var newfileDoc = new activeDb.files(data);
                        var err=epValidateSync(newfileDoc);
                        if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                        newfileDoc.save(function(err, newfileDoc2) {
                            if(dberr(err,callback)){
                                doc.invoiceXsltFiles.push(newfileDoc2._id);
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
                        doc.invoiceXsltFiles.forEach((f)=>{
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

function setDefaultInvoiceXslt(activeDb,member,req,res,callback){
    if(req.params.param1==undefined || req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '') {
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var fileId=req.query.fileId || req.query.fileid || '';
        activeDb.e_integrators.findOne({ _id: req.params.param1,invoiceXsltFiles:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    doc.invoiceXsltFiles.forEach((e,index)=>{
                        if(e==req.query.fileId){
                            doc.invoiceXslt=e._id;
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
        activeDb.e_integrators.findOne({ _id: req.params.param1,invoiceXsltFiles:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
            if (dberr(err,callback)) {
                if(doc==null){
                    callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                }else{
                    doc.invoiceXsltFiles.forEach((e,index)=>{
                        if(e==req.query.fileId){
                            doc.invoiceXsltFiles.splice(index,1);
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