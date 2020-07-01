
exports.yeniFaturaNumarasi=function(dbModel,eIntegratorDoc,newDespatch,cb){
    if(newDespatch.ID.value!='') return cb(null,newDespatch);
    if(newDespatch.issueDate.value.length!=10) return cb(null,newDespatch);
    if(eIntegratorDoc.despatchPrefix.length!=3) return cb(null,newDespatch);
    var yil = newDespatch.issueDate.value.substr(0,4);

    dbModel.despatches.find({ioType:0, 'ID.value':{'$regex': eIntegratorDoc.despatchPrefix + yil + '.*','$options':'i'} }).sort({'ID.value':-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var yeniNo=0;
            var despatchNum=eIntegratorDoc.despatchPrefix + yil;
            if(docs.length>0){
                var s=docs[0].ID.value.substr(7);
                if(!isNaN(s)) yeniNo=Number(s);
            }
            yeniNo++;
            if(yeniNo.toString().length<9){
                for(var i=0;i<(9-yeniNo.toString().length);i++){
                    despatchNum +='0';
                }
            }
            despatchNum +=yeniNo.toString();
            newDespatch.ID.value=despatchNum;
            return cb(null,newDespatch)
        }else{
            return cb(null,newDespatch);
        }
    });
}


exports.kontrolImportEArsiv=function(dbModel,eIntegratorDoc,newDespatch,cb){
    try{
        if(newDespatch.profileId.value == 'IHRACAT' || newDespatch.profileId.value == 'YOLCUBERABERFATURA' || newDespatch.profileId.value =='EARSIVFATURA') return cb(null,newDespatch);
        
        var vergiNo='';
        newDespatch.accountingCustomerParty.party.partyIdentification.forEach((e)=>{
            var schemeID=(e.ID.attr.schemeID || '').toUpperCase();
            if(schemeID=='VKN' || schemeID=='TCKN'){
                vergiNo=e.ID.value;
                return;
            }
        });
        
        if(vergiNo=='') return cb(null,newDespatch);
        db.einvoice_users.findOne({identifier:vergiNo,enabled:true},(err,doc)=>{
            if(!err){
                if(doc==null){
                    eventLog('EARSIVFATURA');
                    newDespatch.profileId.value='EARSIVFATURA';
                }
                cb(null,newDespatch);
            }else{
                cb(null,newDespatch);
            }
        });

    }catch(tryErr){
        errorLog('kontrolImportEArsiv:',tryErr);
        cb(null, newDespatch)
    }
}

exports.insertEDespatch=function(dbModel,eIntegratorDoc,connectorResult,callback){
    try{
        eventLog('insertEDespatch started');
        var connDespatches;
        if(typeof connectorResult=='string'){
           connDespatches=JSON.parse(connectorResult);
        }
        
        var despatches=[];
        if(Array.isArray(connDespatches)){
            despatches=connDespatches;
        }else{
            despatches.push(connDespatches);
        }
        despatches.forEach((e)=>{
            e.despatchStatus='Draft';
            e.ioType=0;
            e.invoiceErrors=[];
            e.localStatus='transferred';
            e.localErrors=[];
            e.ID='';
            e.eIntegrator=eIntegratorDoc._id;
            e.uuid={value:uuid.v4()};
            if(e.localDocumentId==undefined){
                e.localDocumentId='';
            }
            e=mrutil.amountValueFixed2Digit(e,'');
        });

        var index=0;
        function kaydet(cb){
            if(index>=despatches.length) return cb(null);
            dbModel.despatches.findOne({ioType:0, localDocumentId:{$ne:''},localDocumentId:despatches[index].localDocumentId},(err,doc)=>{
                if(!err){
                    if(doc==null){
                        var tempInvoice=(new dbModel.despatches(despatches[index])).toJSON();
                        tempInvoice=mrutil.deleteObjectFields(tempInvoice,["_id","__v","createdDate","modifiedDate",'eIntegrator', "pdf", "html"]);
                        tempInvoice=mrutil.deleteObjectProperty(tempInvoice,'_id');

                        var data1=mrutil.edespatchesetCurrencyIDs(tempInvoice,tempInvoice.documentCurrencyCode.value);
                        data1['eIntegrator']=eIntegratorDoc._id;
                        var newEDespatch=new dbModel.despatches(data1);

                        eDespatchHelper.yeniFaturaNumarasi(dbModel,eIntegratorDoc,newEDespatch,(err,newEDespatch2)=>{
                            eDespatchHelper.kontrolImportEArsiv(dbModel,eIntegratorDoc,newEDespatch2,(err,newEDespatch3)=>{
                                newEDespatch3.save((err,newDoc)=>{
                                    if(err){
                                        eventLog('insertEDespatch newEDespatch.save Error:',err);
                                    }else{
                                        eventLog('insertEDespatch newEDespatch.save OK _id:',newDoc._id);
                                    }
                                    index++;
                                    setTimeout(kaydet,0,cb);
                                })
                            })
                        });
                        
                    }else{
                        eventLog('localDocumentId zaten var:',despatches[index].localDocumentId);
                        index++;
                        setTimeout(kaydet,0,cb);
                    }
                }else{
                    cb({code: err.name, message: err.message});
                }
            });
            
        }

        kaydet((err)=>{
            if(err){
                errorLog('insertEDespatch kaydet error:',err);
            }else{
                eventLog('insertEDespatch kaydet basarili');
            }
            
            callback(err);
        })

    }catch(tryErr){
        errorLog('insertEDespatch tryErr:',tryErr);
        callback({code:tryErr.name,message:tryErr.message});
    }
}


exports.findDefaultEIntegrator=function(dbModel,eIntegratorId,callback){
    
    var filter={passive:false}
    if(eIntegratorId){
        filter['_id']=eIntegratorId;
    }
    dbModel.integrators.find(filter).populate(['invoiceXslt','invoiceXsltFiles']).exec((err,docs)=>{
        if(!err){
            if(docs.length==0) return callback({code:'RECORD_NOT_FOUND',message:'Aktif GIB entegrator bulunamadi'});
            if(docs.length==1) return callback(null,docs[0]);
            var bFoundDefault=false;
            var foundDoc;
            docs.forEach((e)=>{
                if(e.isDefault){
                    bFoundDefault=true;
                    foundDoc=e;
                    return;
                }
            });
            if(bFoundDefault) return callback(null,foundDoc);
            callback(null,docs[0]);

        }else{
            callback(err);
        }
    });
}