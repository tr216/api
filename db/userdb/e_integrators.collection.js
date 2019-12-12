module.exports=function(conn){
    var schema = mongoose.Schema({
        eIntegrator: {type: String, trim:true, required: [true,'Entegrator seciniz'], default: 'uyumsoft', enum:['uyumsoft','finansbank','innova','logo','turkcell','ingbank']},
        name: {type: String,  trim:true, required: [true,'Kisa bir isim (Sube vs) gereklidir']},
        url: {type: String, trim:true, default: ''},
        firmNo: {type: Number, default: 0},
        username: {type: String, trim:true, default: ''},
        password: {type: String, default: ''},
        invoicePrefix: {type: String, trim:true, default: 'AAA',minlength:3,maxlength:3,required: [true,'3 Karakter Fatura Ön Ek gereklidir']},
        dispatchPrefix: {type: String, trim:true, default: 'AAA',minlength:3,maxlength:3,required: [true,'3 Karakter Fatura Ön Ek gereklidir']},
        postboxAlias: {type: String, trim:true, default: ''},
        senderboxAlias: {type: String, trim:true, default: ''},
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now},
        isDefault: {type: Boolean, default: false},
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
    

    var collectionName='e_integrators';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    // model.relations={pos_device_zreports:'posDevice'}

    return model;
}
