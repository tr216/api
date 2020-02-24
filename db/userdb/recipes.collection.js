module.exports=function(conn){
    var schema = mongoose.Schema({
        item: {type: mongoose.Schema.Types.ObjectId, ref: 'items'},
        name:{type: String, default: ''},
        description:{type: String, trim:true, default: ''},
        revision:{ type: Number, default: 1},
        process:[{
            sequence:{ type: Number, default: 0},
            station: {type: mongoose.Schema.Types.ObjectId, ref: 'mrp_stations'},
            step: {type: mongoose.Schema.Types.ObjectId, ref: 'mrp_process_steps'},
            machines: [ {
                machine:{type: mongoose.Schema.Types.ObjectId, ref: 'mrp_machines'},
                minCapacity:{ type: Number, default: 0},
                maxCapacity:{ type: Number, default: 0},
                duration:{ type: Number, default: 0}
            }],
            input: [{
                item:{type: mongoose.Schema.Types.ObjectId, ref: 'items'},
                quantity:{ type: Number, default: 0},
                unitCode:{type: String, trim:true, default: ''}
            }],
            output: [{  //yan urunler
                item:{type: mongoose.Schema.Types.ObjectId, ref: 'items'},
                quantity:{ type: Number, default: 0},
                unitCode:{type: String, trim:true, default: ''}
            }],
            parameters:{type: String, default: ''}
        }],
        materialSummary:[{
            item: {type: mongoose.Schema.Types.ObjectId, ref: 'items'},
            quantity:{ type: Number, default: 0},
            unitCode:{type: String, trim:true, default: ''}
        }],
        outputSummary:[{
            item: {type: mongoose.Schema.Types.ObjectId, ref: 'items'},
            quantity:{ type: Number, default: 0},
            unitCode:{type: String, trim:true, default: ''}
        }],
        qualityControl:[{
            param:{type: String,trim:true, default: ''},
            value:{type: String,trim:true, default: ''}
        }],
        isDefault: {type: Boolean, default: false},
        totalQuantity:{ type: Number, default: 100},
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


    var collectionName='recipes';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
