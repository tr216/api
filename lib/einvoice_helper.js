
exports.yeniFaturaNumarasi=function(dbModel,eIntegratorDoc,newInvoice,cb){
    if(newInvoice.ID.value!='') return cb(null,newInvoice);
    if(newInvoice.issueDate.value.length!=10) return cb(null,newInvoice);
    if(eIntegratorDoc.invoicePrefix.length!=3) return cb(null,newInvoice);
    var yil = newInvoice.issueDate.value.substr(0,4);

    dbModel.e_invoices.find({ioType:0, 'ID.value':{'$regex': eIntegratorDoc.invoicePrefix + yil + '.*','$options':'i'} }).sort({'ID.value':-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var yeniNo=0;
            var invoiceNum=eIntegratorDoc.invoicePrefix + yil;
            if(docs.length>0){
                var s=docs[0].ID.value.substr(7);
                if(!isNaN(s)) yeniNo=Number(s);
            }
            yeniNo++;
            if(yeniNo.toString().length<9){
                for(var i=0;i<(9-yeniNo.toString().length);i++){
                    invoiceNum +='0';
                }
            }
            invoiceNum +=yeniNo.toString();
            newInvoice.ID.value=invoiceNum;
            return cb(null,newInvoice)
        }else{
            return cb(null,newInvoice);
        }
    });
}


exports.kontrolImportEArsiv=function(dbModel,eIntegratorDoc,newInvoice,cb){
    try{
        if(newInvoice.profileId.value == 'IHRACAT' || newInvoice.profileId.value == 'YOLCUBERABERFATURA' || newInvoice.profileId.value =='EARSIVFATURA') return cb(null,newInvoice);
        
        var vergiNo='';
        newInvoice.accountingCustomerParty.party.partyIdentification.forEach((e)=>{
            var schemeID=(e.ID.attr.schemeID || '').toUpperCase();
            if(schemeID=='VKN' || schemeID=='TCKN'){
                vergiNo=e.ID.value;
                return;
            }
        });
        
        if(vergiNo=='') return cb(null,newInvoice);
        db.einvoice_users.findOne({identifier:vergiNo,enabled:true},(err,doc)=>{
            if(!err){
                if(doc==null){
                    console.log('EARSIVFATURA');
                    newInvoice.profileId.value='EARSIVFATURA';
                }
                cb(null,newInvoice);
            }else{
                cb(null,newInvoice);
            }
        });

    }catch(tryErr){
        console.error('kontrolImportEArsiv:',tryErr);
        cb(null, newInvoice)
    }
}

