module.exports=function(conn){
    var schema = mongoose.Schema({
        ioType :{ type: Number,default: 0}, // 0 - cikis , 1- giris
        eIntegrator: {type: mongoose.Schema.Types.ObjectId, ref: 'e_integrators', required: true},
        profileID: { type: String,default: '', trim:true, enum:['TEMELFATURA','TICARIFATURA','IHRACAT','YOLCUBERABERFATURA','EARSIVFATURA'], required: true},
        id: { type: String, trim:true, default: '',
            validate: {
              validator: function(v) {
                if(this.ioType==0 && v!='' && v.length!=16){
                    return false;
                }else{
                    return true;
                }
              },
              message: 'Fatura numarasi 16 karakter olmalidir veya bos birakiniz.'
            }
        },
        uuid: { type: String, trim:true, default: ''},
        issueDate: { type: String,  required: [true,'Fatura tarihi gereklidir']},
        issueTime: { type: String,default: '00:00:00.0000000+03:00'},
        invoiceType: { type: String,default: '', trim:true, enum:['SATIS','IADE','TEVKIFAT','ISTISNA','OZELMATRAH','IHRACKAYITLI'],
            validate: {
              validator: function(v) {
                if(this.ioType==0 && (this.profileID=='IHRACAT' || this.profileID=='YOLCUBERABERFATURA') && v!='ISTISNA'){
                    return false;
                }else{
                    return true;
                }
              },
              message: 'Senaryo: IHRACAT veya YOLCUBERABERFATURA oldugunda fatura turu ISTISNA olarak secilmelidir.'
            }
        },
        note:[{ type: String, trim:true, default: ''}],
        documentCurrencyCode:{ type: String, trim:true, default: 'TRY'},
        taxCurrencyCode:{ type: String, trim:true, default: 'TRY'},
        pricingCurrencyCode:{ type: String, trim:true, default: 'TRY'},
        paymentCurrencyCode:{ type: String, trim:true, default: 'TRY'},
        paymentAlternativeCurrencyCode:{ type: String, trim:true, default: 'TRY'},
        lineCountNumeric:{ type: Number,default: 0},
        orderReference:[{ 
            id:{ type: String, trim:true, default: ''},
            issueDate:{ type: String, trim:true, default: ''}
        }],
        despatchDocumentReference:[{ 
            id:{ type: String, trim:true, default: ''},
            issueDate:{ type: String, trim:true, default: ''}
        }],
        accountingSupplierParty: {
            Party: {type: mongoose.Schema.Types.ObjectId, ref: 'parties' },
            AgentParty: {type: mongoose.Schema.Types.ObjectId, ref: 'parties'}
        },
        accountingCustomerParty: {
            Party: {type: mongoose.Schema.Types.ObjectId, ref: 'parties' },
            AgentParty: {type: mongoose.Schema.Types.ObjectId, ref: 'parties'}
        },
        pricingExchangeRate:{ 
            sourceCurrencyCode  :{ type: String,default: 'TRY'},
            targetCurrencyCode  :{ type: String,default: 'TRY'},
            calculationRate   :{ type: Number,default: 0},
            date   :{ type: String,default: ''}
        },
        taxTotal  : {
            taxAmount :{ type: Number,default: 0},
            taxSubtotal:[{
                taxableAmount:{ type: Number,default: 0},
                taxAmount :{ type: Number,default: 0},
                taxCategory :{ 
                    taxScheme:{
                        name:{ type: String, trim:true, default: ''},
                        taxTypeCode:{ type: String, trim:true, default: ''},
                    }
                }
            }]
            
        },
        withholdingTaxTotal  : {
            taxAmount :{ type: Number,default: 0},
            taxSubtotal:[{
                taxableAmount:{ type: Number,default: 0},
                taxAmount :{ type: Number,default: 0},
                taxCategory :{ 
                    taxScheme:{
                        name:{ type: String, trim:true, default: ''},
                        taxTypeCode:{ type: String, trim:true, default: ''},
                    }
                }
            }]
            
        },
        legalMonetaryTotal: { 
            lineExtensionAmount  :{ type: Number,default: 0},
            taxExclusiveAmount  :{ type: Number,default: 0},
            taxInclusiveAmount   :{ type: Number,default: 0},
            allowanceTotalAmount   :{ type: Number,default: 0},
            chargeTotalAmount   :{ type: Number,default: 0},
            payableRoundingAmount   :{ type: Number,default: 0},
            payableAmount    :{ type: Number,default: 0}
        },
        invoiceLine:[{
            id:{type: String, default: ''},
            note:[{type: String, default: ''}],
            invoicedQuantity :{ type: Number,default: 0},
            unitCode:{type: String, default: 'NU'},
            lineExtensionAmount :{ type: Number,default: 0},
            currencyID:{type: String, default: 'TRY'},
            item:{
                name:{type: String, default: ''},
                additionalItemIdentification:{type: String, default: ''},
                brandName:{type: String, default: ''},
                buyersItemIdentification:{type: String, default: ''},
                sellersItemIdentification:{type: String, default: ''},
                manufacturersItemIdentification:{type: String, default: ''},
                commodityClassification:{type: String, default: ''},
                modelName:{type: String, default: ''},
                keyword:{type: String, default: ''},
                description:{type: String, default: ''},
                itemInstance:[{
                    additionalItemProperty:[{
                        id:{type: String, default: ''},
                        name:{type: String, default: ''},
                        nameCode:{type: String, default: ''},
                        testMethod:{type: String, default: ''},
                        value:{type: Number, default: 0},
                        valueQuantity:{type: Number, default: 0},
                        valueQualifier:[],
                        importanceCode:{type: String, default: ''},
                        listValue:[],
                        importanceCode:{type: String, default: ''},
                        period:{type: String, default: ''},
                        itemPropertyGroup:[],
                        dimension:{type: String, default: ''},
                        itemPropertyRange:{}
                    }]
                }]
                 
            },
            price : {
                priceAmount : { type: Number,default: 0}
            },
            delivery : [{
                id : {type: String, default: ''},
                trackingID : {type: String, default: ''},
                shipment:{
                    
                }
            }]
        }],
        invoiceStatus: {type: String, default: '',enum:['Draft','Processing','SentToGib','Approved','Declined','WaitingForAprovement','Error']},
        invoiceErrors:[{code:'',message:''}],
        localStatus: {type: String, default: '',enum:['','transferring','pending','transferred','error']},
        localErrors:[{code:'',message:''}],
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    schema.pre('save', function(next) {
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });
    schema.pre('remove', function(next) {
        next();
    });

    schema.pre('remove', true, function(next, done) {
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });

    schema.on('init', function(model) {

    });
    

    schema.plugin(mongoosePaginate);
    schema.plugin(mongooseAggregatePaginate);
    

    var collectionName='e_invoices';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
