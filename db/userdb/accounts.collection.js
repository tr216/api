module.exports=function(conn){
    var schema = mongoose.Schema({
        parentAccount: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
        accountCode: {type: String, trim:true, unique:true},
        code: {type: String, trim:true, required: true},
        name: {type: String, trim:true, required: true},
        balanceAmount:{ type: Number,default: 0},
        balanceQuantity:{ type: Number,default: 0},
        balanceQuantity2:{ type: Number,default: 0},
        balanceQuantity3:{ type: Number,default: 0},
        balanceReports:[
            {
                balanceDate:{type: String, trim:true, required: true},
                balanceAmount:{ type: Number,default: 0},
                balanceQuantity:{ type: Number,default: 0},
                balanceQuantity2:{ type: Number,default: 0},
                balanceQuantity3:{ type: Number,default: 0},
            }
        ],
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    schema.pre('save', function(next) {
        if(this.parentAccount){
            conn.model('accounts').findOne({_id:this.parentAccount},(err,parentDoc)=>{
                if(!err){
                    if(parentDoc!=null){
                        this.accountCode=parentDoc.accountCode + '.' + this.code;
                    }
                }else{
                    console.error('schema.save error:',err);
                }
                next();
            });

        }else{
            this.accountCode=this.code;
            next();
        }
        
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
    schema.index({
        "accountCode":1,
        "code":1,
        "name":1,
        "balanceAmount":1,
        "balanceQuantity":1,
        "createdDate":1
    });

    var collectionName='accounts';
    var model=conn.model(collectionName, schema);
    

    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    // model.removeMany=(member, filter,cb)=>{ sendToTrashMany(conn,collectionName,member,filter,cb); }
    model.relations={accounts:'parentAccount', parties:'account'}

    return model;
}

