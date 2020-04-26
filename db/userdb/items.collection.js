module.exports=function(conn){
    var schema = mongoose.Schema({
        itemType: {type: String, trim:true, required: [true,'itemType gereklidir'], default: 'item', enum:['item','raw-material','helper-material','product','semi-product','sales-service','purchasing-service','asset','expense']},
        code:dbType.valueType,
        name:dbType.valueType,
        description:dbType.valueType,
        additionalItemIdentification:[{ID:dbType.idType}],
        brandName:dbType.valueType,
        buyersItemIdentification:{ID:dbType.idType},
        commodityClassification:[
            {
                itemClassificationCode:dbType.codeType
            }
        ],
        keyword:dbType.valueType,
        manufacturersItemIdentification:{ID:dbType.idType},
        modelName:dbType.valueType,
        sellersItemIdentification:{ID:dbType.idType},
        originCountry:dbType.countryType,
        itemInstance:[dbType.itemInstanceType],
        taxTotal:[dbType.taxTotalType],
        withholdingTaxTotal:[dbType.taxTotalType],
        accountGroup: {type: mongoose.Schema.Types.ObjectId, ref: 'account_groups', default:null},
        similar:[{type: mongoose.Schema.Types.ObjectId, ref: 'items'}],
        unitPacks:[{
            unitCode:{type: String, trim:true, default: ''},
            netWeight:dbType.quantityType,
            dimension:{ width:dbType.measureType, height:dbType.measureType,length:dbType.measureType},
            barcode:{type: String, trim:true, default: ''}
        }],
        vendors:[{
            sequenceNumeric:dbType.numberValueType,
            vendor:{type: mongoose.Schema.Types.ObjectId, ref: 'parties'},
            supplyDuration:dbType.numberValueType
        }],
        tracking:{
            lotNo:{type: Boolean, default: false},
            serialNo:{type: Boolean, default: false},
            color:{type: Boolean, default: false},
            pattern:{type: Boolean, default: false},
            size:{type: Boolean, default: false}
        },
        supplyDuration:dbType.numberValueType,
        tags:{type: String, trim:true, default: ''},
        images:[{type: mongoose.Schema.Types.ObjectId, ref: 'files'}],
        files:[{type: mongoose.Schema.Types.ObjectId, ref: 'files'}],
        exceptInventory: {type: Boolean, default: false},
        exceptRecipeCalculation: {type: Boolean, default: false},
        recipe: {type: mongoose.Schema.Types.ObjectId, ref: 'recipes'},
        palletRequired:{type: Boolean, default: false},
        palletTypes:[{palletType:{type: mongoose.Schema.Types.ObjectId, ref: 'pallet_types'}}],
        packingRequired:{type: Boolean, default: false},
        packingTypes:[{
            packingType:{type: mongoose.Schema.Types.ObjectId, ref: 'packing_types'},
            quantity:{ type: Number, default: 0},
            unitCode:{type: String, trim:true, default: ''}
        }],
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
