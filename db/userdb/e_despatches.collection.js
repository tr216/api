module.exports=function(conn){
    var schema = mongoose.Schema({
        ioType :{ type: Number,default: 0}, // 0 - cikis , 1- giris
        eIntegrator: {type: mongoose.Schema.Types.ObjectId, ref: 'e_integrators', required: true},
        profileId: { 
            value: { type: String,default: '', trim:true, enum:['TEMELIRSALIYE'], required: true}
        },
        ID: dbType.idType,
        uuid: dbType.valueType,
        issueDate: {value :{ type: String,  required: [true,'Fatura tarihi gereklidir']}},
        issueTime: {value :{ type: String,default: '00:00:00.0000000+03:00'}},
        despatchAdviceTypeCode: dbType.codeType,
        despatchPeriod: dbType.periodType,
        note:[dbType.valueType],
        additionalDocumentReference:[dbType.documentReferenceType],
        orderReference:[dbType.orderReferenceType],
        originatorDocumentReference:[dbType.documentReferenceType],
        despatchSupplierParty:{
            party:dbType.partyType,
            despatchContact:dbType.contactType
        },
        deliveryCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        originatorCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        sellerSupplierParty:{
            party:dbType.partyType,
            despatchContact:dbType.contactType
        },
        buyerCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        shipment:dbType.shipmentType,
        lineCountNumeric:dbType.numberValueType,
        despatchLine:[dbType.despatchLineType],
        localDocumentId: {type: String, default: ''},
        despatchStatus: {type: String, default: 'Draft',enum:['Draft','Pending','Queued', 'Processing','SentToGib','Approved','Declined','WaitingForAprovement','Error']},
        despatchErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
        despatchStatus: {type: String, default: '',enum:['','transferring','pending','transferred','error']},
        despatchErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    

    schema.pre('save', function(next) {
        if(this.despatchLine){
            this.lineCountNumeric.value=this.despatchLine.length;
        }
        

       
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
    
    schema.index({
        "ioType":1,
        "ID.value":1,
        "issueDate.value":1,
        "uuid.value":1,
        "eIntegrator":1,
        "profileId.value":1,
        "despatchTypeCode.value":1,
        "localDocumentId":1,
        "despatchStatus":1,
        "localStatus":1,
        "createdDate":1
    });


    var collectionName='e_despatch';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
