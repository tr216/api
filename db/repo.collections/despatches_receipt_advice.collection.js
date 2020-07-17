module.exports=function(conn){
    var schema = mongoose.Schema({
        despatch: {type: mongoose.Schema.Types.ObjectId, ref: 'despatches', required: true},
        receiptAdviceNumber: dbType.idType,
        localDocumentId: {type: String, default: ''},
        inboxDespatchId:dbType.valueType, //uuid from despatchId
        note:dbType.valueType, 
        deliveryContactName:dbType.valueType, 
        despatchContactName:dbType.valueType, 
        actualDeliveryDate:dbType.valueType, 
        receiptAdviceLineInfo:[], //receiptAdviceLineInfoType
        receiptAdviceStatus: {type: String, default: '',enum:['','Pending','Sent','Error']},
        receiptAdviceErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
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
    
    schema.index({
        "despatch":1,
        "receiptAdviceNumber.value":1,
        "localDocumentId":1,
        "inboxDespatchId":1,
        "deliveryContactName.value":1,
        "despatchContactName.value":1,
        "actualDeliveryDate.value":1,
        "status":1,
        "createdDate":1
    });


    var collectionName='despatches_receipt_advice';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
