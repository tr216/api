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
                                indirilecekFaturalar.push(result.docs[i]);
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
                        api.getInboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
                            if(!err){
                                var invoice=mrutil.renameObjectProperty(result.doc.invoice,renameKey);
                                invoice['invoiceStatus']=indirilecekFaturalar[index].status;
                                // var fileName=path.join(__dirname,'../../../../temp',invoice.uuid.value);
                                // fs.writeFileSync(fileName + '.json', JSON.stringify(invoice,null,2),'utf8');
                                insertInvoice(dbModel, eIntegratorDoc,1, invoice,(err)=>{
                                    if(err){
                                        console.log('insertInboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                        index++;
                                        setTimeout(faturaIndir,500,cb);
                                    }else{
                                        api.setInvoicesTaken(eIntegratorDoc,[invoice.uuid.value],(err)=>{
                                            if(err){
                                                console.log('api.setInvoicesTaken error:',err);
                                            }else{
                                                console.log(invoice.uuid.value, ' taken');
                                            }
                                            index++;
                                            setTimeout(faturaIndir,500,cb);
                                        });
                                    }
                                    
                                });
                                
                            }else{
                                console.log('api.getInboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                index++;
                                setTimeout(faturaIndir,500,cb);
                            }
                        });
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
                // query.ExecutionEndDate=date2.yyyymmdd() + 'T23:59:59.000Z';
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
                                indirilecekFaturalar.push(result.docs[i]);
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
                        api.getOutboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
                            if(!err){
                                var invoice=mrutil.renameObjectProperty(result.doc.invoice,renameKey);
                                invoice['invoiceStatus']=indirilecekFaturalar[index].status;
                                var fileName=path.join(__dirname,'../../../../temp',invoice.uuid.value);
                                fs.writeFileSync(fileName + '.json', JSON.stringify(invoice,null,2),'utf8');
                                insertInvoice(dbModel, eIntegratorDoc,0, invoice,(err)=>{
                                    if(err){
                                        console.log('insertOutboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                        index++;
                                        setTimeout(faturaIndir,500,cb);
                                    }else{
                                        api.setInvoicesTaken(eIntegratorDoc,[invoice.uuid.value],(err)=>{
                                            if(err){
                                                console.log('api.setInvoicesTaken error:',err);
                                            }else{
                                                console.log(invoice.uuid.value, ' taken');
                                            }
                                            index++;
                                            setTimeout(faturaIndir,500,cb);
                                        });
                                    }
                                    
                                });
                                
                            }else{
                                console.log('api.getOutboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                index++;
                                setTimeout(faturaIndir,500,cb);
                            }
                        });
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

function insertInvoice(dbModel,eIntegratorDoc,ioType,invoice,callback){
    try{
        dbModel.e_invoices.findOne({ioType:ioType,'uuid.value':invoice.uuid.value},(err,foundDoc)=>{
            if(!err){
                if(foundDoc==null){
                    console.log('insertInvoice uuid:', invoice.uuid.value);
                    
                    var data={ioType:ioType,eIntegrator:eIntegratorDoc._id}
                    data=Object.assign(data,invoice);
                    
                    var newInvoice=new dbModel.e_invoices(data);
                    newInvoice.save((err,newDoc)=>{
                        if(dberr(err,callback)){
                            callback(null,newDoc);
                        }
                    })
                    
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


function renameKey(key){
    if(key.length<2) return key;
    switch(key){
        case 'UUID': return 'uuid';
        case 'ID': return 'ID';
        case 'URI': return 'URI';
    }
    key=key[0].toLowerCase() + key.substr(1,key.length-1);
    if(key.substr(key.length-2,2)=='ID' && key.length>2){
        key=key.substr(0,key.length-2) + 'Id';
    }
    return key;
}
