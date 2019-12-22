var api=require('./api.js');

exports.downloadInvoices = function (dbModel,eIntegratorDoc,callback) {
    downloadInboxInvoices(dbModel,eIntegratorDoc,(err)=>{
        downloadOutboxInvoices(dbModel,eIntegratorDoc,(err)=>{
            callback(err);
        });
    });
    
}

function downloadInboxInvoices(dbModel,eIntegratorDoc,callback){
    var isTestPlatform=eIntegratorDoc.url.indexOf('test')>-1?true:false;
    if(isTestPlatform) console.log('uyumsoft test platform');
    dbModel.e_invoices.find({eIntegrator:eIntegratorDoc._id, ioType:1}).sort({'issueDate.value':-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var date2=new Date();
            var query={ 
                ExecutionStartDate:'2019-12-01T00:00:00.000Z', 
                ExecutionEndDate:date2.yyyymmdd() + 'T23:59:59.000Z', 
                PageIndex:0, 
                PageSize:10,

                OnlyNewestInvoices:false,
                SetTaken:false
                // InvoiceNumbers:[] , 
                // InvoiceIds: []
            }
            if(docs.length>0){
                var date1=mrutil.datefromyyyymmdd(docs[0].issueDate.value);
                console.log('Son tarih:',date1);

                date1=date1.addDays(-10);
                console.log('Date1:',date1);
                query.ExecutionStartDate=date1.yyyymmdd() + 'T00:00:00.000Z';
                // query.ExecutionEndDate=date2.yyyymmdd() + 'T23:59:59.000Z';
            }
            if(isTestPlatform) query.ExecutionStartDate=(new Date()).addDays(-1).yyyymmdd() + 'T00:00:00.000Z';

            var index=0;
            var indirilecekFaturalar=[];
            function listeIndir(cb){
                api.getInboxInvoiceList(eIntegratorDoc,query,(err,result)=>{
                    if(!err){
                        console.log('inbox invoices pageIndex:',(result.page +1) + '/' + result.pageCount);
                        if(result.docs.length>0){
                            for(var i=0;i<result.docs.length;i++){
                                if(result.docs[i].uuid!=undefined){
                                    indirilecekFaturalar.push(result.docs[i]);
                                }
                            }
                            query.PageIndex++;
                            if(query.PageIndex>=result.pageCount || ( isTestPlatform && query.PageIndex==2)){ 
                                cb(null)
                            }else{
                                setTimeout(listeIndir,1000,cb);
                            }
                        }else{
                            cb(null)
                        }
                    }else{
                        console.log('downloadInboxInvoices Hata:',err);
                        cb(err);
                    }
                }) 
            }


            listeIndir((err)=>{
                if(!err){
                    var index=0;
                    function faturaIndir(cb){
                        if(index>=indirilecekFaturalar.length) return cb(null);
                        dbModel.e_invoices.findOne({ioType:1,'uuid.value':indirilecekFaturalar[index].uuid},(err,doc)=>{
                            if(!err){
                                if(doc!=null){
                                    if(doc.invoiceStatus!=indirilecekFaturalar[index].status){
                                        doc.modifiedDate=new Date();
                                        doc.invoiceStatus=indirilecekFaturalar[index].status;
                                        doc.save((err,doc2)=>{
                                            console.log('zaten indirilmis. statusu degistirildi. ',indirilecekFaturalar[index].uuid);
                                            index++;
                                            setTimeout(faturaIndir,0,cb);
                                            return;
                                        });
                                    }else{
                                        console.log('zaten indirilmis. ',indirilecekFaturalar[index].uuid);
                                        index++;
                                        setTimeout(faturaIndir,0,cb);
                                        return;
                                    }
                                }
                            }
                            api.getInboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
                                if(!err){
                                    var invoice=prepareInvoiceObject(result.doc.invoice);
                                    invoice['invoiceStatus']=indirilecekFaturalar[index].status;
                                    var fileName=path.join(__dirname,'../../../../temp',invoice.uuid.value);
                                    // fs.writeFileSync(fileName + '.json', JSON.stringify(invoice,null,2),'utf8');
                                    var files={html:'',pdf:null};

                                    api.getInboxInvoiceHtml(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultHtml)=>{
                                        if(!err){
                                            // fs.writeFileSync(fileName + '.html', resultHtml.doc.html,'utf8');
                                            files.html=resultHtml.doc.html;
                                        }
                                        api.getInboxInvoicePdf(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultPdf)=>{
                                            if(!err){
                                                files.pdf=resultPdf.doc.pdf
                                                // var raw = atob(resultPdf.doc.pdf);
                                                // var rawLength = raw.length;
                                                // var array = new Uint8Array(new ArrayBuffer(rawLength));
                                                // for(i = 0; i < rawLength; i++) {
                                                //     array[i] = raw.charCodeAt(i);
                                                // }
                                                // fs.writeFileSync(fileName + '.pdf', array,'utf8');
                                                // files.pdf=array;
                                            }else{
                                                console.log('api.getInboxInvoicePdf Error:',err);
                                            }
                                            insertInvoice(dbModel, eIntegratorDoc,1, invoice,files,(err)=>{
                                                if(err){
                                                    console.log('insertInboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                                    index++;
                                                    setTimeout(faturaIndir,500,cb);
                                                }else{
                                                    index++;
                                                    setTimeout(faturaIndir,500,cb);
                                                    // api.setInvoicesTaken(eIntegratorDoc,[invoice.uuid.value],(err)=>{
                                                    //     if(err){
                                                    //         console.log('api.setInvoicesTaken error:',err);
                                                    //     }else{
                                                    //         console.log(invoice.uuid.value, ' taken');
                                                    //     }
                                                    //     index++;
                                                    //     setTimeout(faturaIndir,500,cb);
                                                    // });
                                                }
                                                
                                            });
                                        });
                                    });
                                    
                                    
                                }else{
                                    console.log('api.getInboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                    index++;
                                    setTimeout(faturaIndir,500,cb);
                                }
                            });
                        })
                        
                    }
                    
                    faturaIndir((err)=>{
                        callback(err);
                    });
                }else{
                    callback(err);
                }
            });
            
        }else{
            callback(err);
        }
    });
}


function downloadOutboxInvoices(dbModel,eIntegratorDoc,callback){
    var isTestPlatform=eIntegratorDoc.url.indexOf('test')>-1?true:false;
    if(isTestPlatform) console.log('uyumsoft test platform');
        
    
    dbModel.e_invoices.find({eIntegrator:eIntegratorDoc._id, ioType:0}).sort({'issueDate.value':-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var date2=new Date();
            var query={ 
                ExecutionStartDate:'2019-01-01T00:00:00.000Z', 
                ExecutionEndDate:date2.yyyymmdd() + 'T23:59:59.000Z', 
                PageIndex:0, 
                PageSize:10,

                OnlyNewestInvoices:false,
                SetTaken:false
                // InvoiceNumbers:[] , 
                // InvoiceIds: []
            }

            if(docs.length>0){
                var date1=mrutil.datefromyyyymmdd(docs[0].issueDate.value);
                console.log('Son tarih:',date1);

                date1=date1.addDays(-10);
                console.log('Date1:',date1);
                query.ExecutionStartDate=date1.yyyymmdd() + 'T00:00:00.000Z';
            }
            if(isTestPlatform) query.ExecutionStartDate=(new Date()).addDays(-1).yyyymmdd() + 'T00:00:00.000Z';

            var index=0;
            var indirilecekFaturalar=[];
            function listeIndir(cb){
                api.getOutboxInvoiceList(eIntegratorDoc,query,(err,result)=>{
                    if(!err){
                        console.log('outbox invoices pageIndex:',(result.page +1) + '/' + result.pageCount);
                        if(result.docs.length>0){
                            for(var i=0;i<result.docs.length;i++){
                                if(result.docs[i].uuid!=undefined){
                                    indirilecekFaturalar.push(result.docs[i]);
                                }
                            }
                            query.PageIndex++;
                            
                            if(query.PageIndex>=result.pageCount || ( isTestPlatform && query.PageIndex==2)){ 
                                cb(null)
                            }else{
                                setTimeout(listeIndir,1000,cb);
                            }
                        }else{
                            cb(null)
                        }
                    }else{
                        console.log('downloadOutboxInvoices Hata:',err);
                        cb(err);
                    }
                }) 
            }


            listeIndir((err)=>{
                if(!err){
                    var index=0;
                    function faturaIndir(cb){
                        if(index>=indirilecekFaturalar.length) return cb(null);
                        dbModel.e_invoices.findOne({ioType:0,'uuid.value':indirilecekFaturalar[index].uuid},(err,doc)=>{
                            if(!err){
                                if(doc!=null){
                                    if(doc.invoiceStatus!=indirilecekFaturalar[index].status){
                                        doc.modifiedDate=new Date();
                                        doc.invoiceStatus=indirilecekFaturalar[index].status;
                                        doc.save((err,doc2)=>{
                                            console.log('zaten indirilmis. statusu degistirildi. ',indirilecekFaturalar[index].uuid);
                                            index++;
                                            setTimeout(faturaIndir,0,cb);
                                            return;
                                        });
                                    }else{
                                        console.log('zaten indirilmis. ',indirilecekFaturalar[index].uuid);
                                        index++;
                                        setTimeout(faturaIndir,0,cb);
                                        return;
                                    }
                                }
                            }

                            api.getOutboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
                                if(!err){
                                    var invoice=prepareInvoiceObject(result.doc.invoice);
                                    invoice['invoiceStatus']=indirilecekFaturalar[index].status;
                                    var fileName=path.join(__dirname,'../../../../temp',invoice.uuid.value);
                                    // fs.writeFileSync(fileName + '.json', JSON.stringify(invoice,null,2),'utf8');
                                    var files={html:'',pdf:null};

                                    api.getOutboxInvoiceHtml(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultHtml)=>{
                                        if(!err){
                                            // fs.writeFileSync(fileName + '.html', resultHtml.doc.html,'utf8');
                                            files.html=resultHtml.doc.html;
                                        }
                                        api.getOutboxInvoicePdf(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,resultPdf)=>{
                                            if(!err){
                                                
                                                files.pdf=resultPdf.doc.pdf
                                                // var raw = atob(resultPdf.doc.pdf);
                                                // var rawLength = raw.length;
                                                // var array = new Uint8Array(new ArrayBuffer(rawLength));
                                                // for(i = 0; i < rawLength; i++) {
                                                //     array[i] = raw.charCodeAt(i);
                                                // }
                                                // fs.writeFileSync(fileName + '.pdf', array,'utf8');
                                                // files.pdf=array;
                                            }else{
                                                console.log('api.getOutboxInvoicePdf Error:',err);
                                            }
                                            insertInvoice(dbModel, eIntegratorDoc,0, invoice,files,(err)=>{
                                                if(err){
                                                    console.log('insertOutboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                                    index++;
                                                    setTimeout(faturaIndir,500,cb);
                                                }else{
                                                    index++;
                                                    setTimeout(faturaIndir,500,cb);
                                                    // api.setInvoicesTaken(eIntegratorDoc,[invoice.uuid.value],(err)=>{
                                                    //     if(err){
                                                    //         console.log('api.setInvoicesTaken error:',err);
                                                    //     }else{
                                                    //         console.log(invoice.uuid.value, ' taken');
                                                    //     }
                                                    //     index++;
                                                    //     setTimeout(faturaIndir,0,cb);
                                                    // });
                                                }
                                                
                                            });
                                        });
                                    });
                                    
                                }else{
                                    console.log('api.getOutboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                    index++;
                                    setTimeout(faturaIndir,500,cb);
                                }
                            });
                        })
                        
                    }
                    
                    faturaIndir((err)=>{
                        callback(err);
                    });
                }else{
                    callback(err);
                }
            });
            
        }else{
            callback(err);
        }
    });
}

function insertInvoice(dbModel,eIntegratorDoc,ioType,invoice,files,callback){
    try{
        dbModel.e_invoices.findOne({ioType:ioType,'uuid.value':invoice.uuid.value},(err,foundDoc)=>{
            if(!err){
                if(foundDoc==null){
                    console.log('insertInvoice uuid:', invoice.uuid.value);
                    
                    var data={ioType:ioType,eIntegrator:eIntegratorDoc._id}
                    data=Object.assign(data,invoice);
                    saveFiles(dbModel,invoice.ID.value, files,(err,resultFiles)=>{
                        if(!err){
                            if(resultFiles.html) data['html']=resultFiles.html;
                            if(resultFiles.pdf) data['pdf']=resultFiles.pdf;
                        }
                        var newInvoice=new dbModel.e_invoices(data);
                        newInvoice.save((err,newDoc)=>{
                            if(dberr(err,callback)){
                                callback(null,newDoc);
                            }
                        })
                    });
                    
                    
                }else{
                    console.log('insertInvoice zaten var');
                    callback(null);
                }
                
            }else{
                console.log('insertInvoice HATA:',err);
                callback(err);
            }
        });

    }catch(e){
        console.log('insertInvoice TRY CATCH:',e);
        callback(e);
    }
}

function saveFiles(dbModel,fileName,files,cb){
    var resultFiles={html:'',pdf:''}

    saveFileHtml(dbModel,fileName,files,(err,html)=>{
        if(!err) resultFiles.html=html;
        saveFilePdf(dbModel,fileName,files,(err,pdf)=>{
            if(!err) resultFiles.pdf=pdf;
            cb(null,resultFiles);
        })
    });
}

function saveFileHtml(dbModel,fileName,files,cb){
    if(files.html){
        var newFile=new dbModel.files({
            name:fileName,
            type:'text/html',
            extension:'html',
            data:files.html
        });
        newFile.save((err,doc)=>{
            if(!err){
                cb(null,doc._id);
            }else{
                cb(err);
            }
        })
    }else{
        cb(null,null)
    }
}

function saveFilePdf(dbModel,fileName,files,cb){
    if(files.pdf){
        var newFile=new dbModel.files({
            name:fileName,
            type:'application/pdf',
            extension:'pdf',
            data:files.pdf
        });
        newFile.save((err,doc)=>{
            if(!err){
                cb(null,doc._id);
            }else{
                cb(err);
            }
        })
    }else{
        cb(null,null)
    }
}

function renameKey(key){
    switch(key){
        case 'UUID': return 'uuid';
        case 'ID': return 'ID';
        case 'URI': return 'URI';
        case '$': return 'attr';
    }
    if(key.length<2) return key;
    key=key[0].toLowerCase() + key.substr(1,key.length-1);
    if(key.substr(key.length-2,2)=='ID' && key.length>2){
        key=key.substr(0,key.length-2) + 'Id';
    }
    return key;
}

function renameInvoiceObjects(obj,renameFunction){
    
    if(Array.isArray(obj)){
        var newObj=[];
        for(var i=0;i<obj.length;i++){
            newObj.push(renameInvoiceObjects(obj[i],renameFunction));
        }
        return newObj;
    }else if (typeof obj==='object'){
        var newObj={};

        var keys=Object.keys(obj);
        keys.forEach((key)=>{
            var newKey=renameFunction(key);
            if((Array.isArray(obj[key]) || typeof obj==='object') && (key!='$')){
                newObj[newKey]=renameInvoiceObjects(obj[key],renameFunction);
            }else{
                newObj[newKey]=obj[key];
            }
        });
        return newObj;
    }else{
        return obj;
    }
}

function deleteEmptyObject(obj,propertyName){
    
    if(Array.isArray(obj)){
        var newObj=[];
        for(var i=0;i<obj.length;i++){
            newObj.push(deleteEmptyObject(obj[i],propertyName));
        }
        return newObj;
    }else if (typeof obj==='object'){
        var newObj={};

        if(obj[propertyName]!=undefined){
            if(JSON.stringify(obj[propertyName])===JSON.stringify({})){
                obj[propertyName]=undefined;
                delete obj[propertyName];
            }
        }
        
        
        var keys=Object.keys(obj);
        keys.forEach((key)=>{
            if(Array.isArray(obj[key]) || typeof obj==='object'){
                newObj[key]=deleteEmptyObject(obj[key],propertyName);
            }else{
                newObj[key]=obj[key];
            }
        })
        
        return newObj;
    }else{
        return obj;
    }
}
function prepareInvoiceObject(invoice){
    invoice=mrutil.deleteObjectProperty(invoice,'xmlns*');
    invoice=deleteEmptyObject(invoice,'$');
    invoice=renameInvoiceObjects(invoice,renameKey);
    return invoice;
}
