var schema = mongoose.Schema({
    identifier: {type: String, trim:true, default:""},
    postboxAlias: {type: String, trim:true, default:""},
    title: {type: String, trim:true, default:""},
    type: {type: String, trim:true, default:""},
    systemCreateDate: { type: Date,default: Date.now},
    firstCreateDate: { type: Date,default: Date.now},
    enabled: {type: Boolean, default: false}
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

schema.plugin(mongoosePaginate);



schema.on('init', function(model) {
 
});



module.exports = dbconn.model('einvoice_users', schema);