module.exports=function(conn){
    var schema = mongoose.Schema({
        itemType: {type: String, trim:true, required: [true,'itemType gereklidir'], default: 'item', enum:['item','raw-material','helper-material','product','semi-product','sales-service','purchasing-service','asset']},
        name:dbType.valueType,
        description:dbType.valueType,
        additionalItemIdentification:[{ID:dbType.valueType}],
        brandName:dbType.valueType,
        buyersItemIdentification:{ID:dbType.valueType},
        commodityClassification:[
            {
                itemClassificationCode:dbType.valueType
            }
        ],
        keyword:dbType.valueType,
        manufacturersItemIdentification:{ID:dbType.valueType},
        modelName:dbType.valueType,
        sellersItemIdentification:{ID:dbType.valueType},
        originCountry:dbType.countryType,
        itemInstance:[dbType.itemInstanceType],
        account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
        similar:[{type: mongoose.Schema.Types.ObjectId, ref: 'items'}],
        vendors:[{
            sequenceNumeric:dbType.numberValueType,
            vendor:{type: mongoose.Schema.Types.ObjectId, ref: 'parties'},
            supplyDuration:dbType.numberValueType
        }],
        supplyDuration:dbType.numberValueType,
        tags:{type: String, trim:true, default: ''},
        localDocumentId: {type: String, default: ''},
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now},
        passive: {type: Boolean, default: false}
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
        "name.value":1,
        "description.value":1,
        "brandName.value":1,
        "keyword.value":1,
        "itemInstance.serialId.value":1,
        "itemInstance.lotIdentification.lotNumberId.value":1,
        "buyersItemIdentification.ID.value":1,
        "sellersItemIdentification.ID.value":1,
        "buyersItemIdentification.ID.value":1,
        "localDocumentId":1,
        "tags":1,
        "createdDate":1
    });


    var collectionName='items';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
