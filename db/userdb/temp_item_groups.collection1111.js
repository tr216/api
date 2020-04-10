module.exports=function(conn){
    var schema = mongoose.Schema({
        name:{type: String, trim:true, default:''},
        machines:[{
            machine: {type: mongoose.Schema.Types.ObjectId, ref: 'mrp_machines',default:null}
        }],
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
        "name":1,
        "createdDate":1
    });


    var collectionName='item_groups';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}
