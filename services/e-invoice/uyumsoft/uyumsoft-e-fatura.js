var api=require('./api.js');

exports.downloadInvoices = function (dbModel,eIntegratorDoc,callback) {
    
    dbModel.e_invoices.find({eIntegrator:eIntegratorDoc._id, ioType:1}).sort({issueDate:-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var date2=new Date();
            var query={ 
                ExecutionStartDate:'2019-11-01T00:00:00.000Z', 
                ExecutionEndDate:date2.yyyymmdd() + 'T23:59:59.000Z', 
                PageIndex:0, 
                PageSize:10,

                OnlyNewestInvoices:false,
                SetTaken:false
                // InvoiceNumbers:[] , 
                // InvoiceIds: []
            }

            if(docs.length>0){
                var date1=mrutil.datefromyyyymmdd(docs[0].issueDate);
                console.log('Son tarih:',date1);

                date1=date1.addDays(-30);
                console.log('Date1:',date1);
                query.ExecutionStartDate=date1.yyyymmdd() + 'T00:00:00.000Z';
                // query.ExecutionEndDate=date2.yyyymmdd() + 'T23:59:59.000Z';
            }

            var index=0;
            var indirilecekFaturalar=[];
            function listeIndir(cb){
                
                api.getInboxInvoiceList(eIntegratorDoc,query,(err,result)=>{
                    if(!err){
                        console.log('pageIndex:',(result.page +1) + '/' + result.pageCount);
                        
                        if(result.docs.length>0){
                            for(var i=0;i<result.docs.length;i++){
                                //if(indirilecekFaturalar.findIndex((e)=>{return (e.uuid==result.docs[i].uuid)})<0){
                                    indirilecekFaturalar.push(result.docs[i]);
                                //}
                                
                            }
                            query.PageIndex++;
                            // if(query.PageIndex>=4){
                            if(query.PageIndex>=result.pageCount){
                                cb(null)
                            }else{
                                setTimeout(listeIndir,1000,cb);
                            }
                        }else{
                            cb(null)
                        }
                        
                        
                    }else{
                        console.log('downloadInvoices Hata:',err);
                        cb(err);
                    }
                }) 
            }

            listeIndir((err)=>{
                if(!err){
                    console.log('indirilecekFaturalar.length:',indirilecekFaturalar.length);
                    console.log('Fatura 0:',indirilecekFaturalar[0]);

                    var index=0;

                    function faturaIndir(cb){
                        if(index>=indirilecekFaturalar.length) return cb(null);
                        api.getInboxInvoice(eIntegratorDoc,indirilecekFaturalar[index].uuid,(err,result)=>{
                            if(!err){
                                
                                var invoice=mrutil.renameObjectProperty(result.doc.invoice,renameKey);
                                invoice['invoiceStatus']=indirilecekFaturalar[index].status;
                                var fileName=path.join(__dirname,'../../../../temp',invoice.uuid);
                                
                                fs.writeFileSync(fileName + '.json', JSON.stringify(invoice,null,2),'utf8');
                                insertInboxInvoice(dbModel, eIntegratorDoc, invoice,(err)=>{
                                    
                                    if(err){
                                        console.log('insertInboxInvoice error: uuid: ' + indirilecekFaturalar[index].uuid,err);
                                    }
                                    index++;
                                    setTimeout(faturaIndir,500,cb);
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


function insertInboxInvoice(dbModel,eIntegratorDoc,invoice,callback){
    console.log('insertInboxInvoice started...');
    try{
        dbModel.e_invoices.findOne({ioType:1,uuid:invoice.uuid},(err,foundDoc)=>{
            if(!err){
                if(foundDoc==null){
                    console.log('insertInboxInvoice uuid:', invoice.uuid);
                    
                    var data={ioType:1,eIntegrator:eIntegratorDoc._id,invoiceStatus:'Approved'}
                    data=Object.assign(data,invoice);
                    var newInvoice=new dbModel.e_invoices(data);
                    newInvoice.save((err,newDoc)=>{
                        if(dberr(err,callback)){
                            callback(null,newDoc);
                        }
                    })
                    
                }else{
                    console.log('insertInboxInvoice zaten var');
                    callback(null);
                }
                
            }else{
                console.log('insertInboxInvoice HATA:',err);
                callback(err);
            }
        });

    }catch(e){
        console.log('insertInboxInvoice TRY CATCH:',e);
        callback(e);
    }
}


function renameKey(key){
    if(key.length<2) return key;
    switch(key){
        case 'UUID': return 'uuid';
        case 'ID': return 'id';
        case 'URI': return 'URI';
    }
    key=key[0].toLowerCase() + key.substr(1,key.length-1);
    if(key.substr(key.length-2,2)=='ID' && key.length>2){
        key=key.substr(0,key.length-2) + 'Id';
    }

    return key;
}
