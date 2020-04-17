module.exports=function(conn){
    var schema = mongoose.Schema({
        name: {type: String, trim:true, required: [true,'isim gereklidir.'] , unique:true},
        palletType: {type: String, trim:true, default:'Palet' , index:true},
        width: {type: Number, default: 0, index:true}, //birim cm/CMT
        length: {type: Number, default: 0, index:true}, //birim cm/CMT
        height: {type: Number, default: 0, index:true},//birim cm/CMT
        maxWeight:{type: Number, default: 0, index:true},//birim kg/KGM
        location: {type: mongoose.Schema.Types.ObjectId, ref: 'locations', default:null},
        subLocation: {type: mongoose.Schema.Types.ObjectId, ref: 'sub_locations', default:null},
        pack:[{
            item: {type: mongoose.Schema.Types.ObjectId, ref: 'items', default:null},
            lotNo: {type: String, trim:true, default:'' , index:true},
            serialNo: {type: String, trim:true, default:'' , index:true},
            quantity: {type: Number, default: 0, index:true},
            quantity2: {type: Number, default: 0, index:true},
            quantity3: {type: Number, default: 0, index:true},
            unitCode:{type: String, trim:true, default: '', index:true}
        }],
        createdDate: { type: Date,default: Date.now, index:true},
        modifiedDate:{ type: Date,default: Date.now},
        passive: {type: Boolean, default: false, index:true}
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
 

    var collectionName='pallets';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    // model.removeMany=(member, filter,cb)=>{ sendToTrashMany(conn,collectionName,member,filter,cb); }
    // model.relations={pos_devices:'location'}
    // model.relations={machines:'location'}
    return model;
}
