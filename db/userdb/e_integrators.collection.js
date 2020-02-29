module.exports=function(conn){
    var schema = mongoose.Schema({
        eIntegrator: {type: String, trim:true, required: [true,'Entegrator seciniz'], default: 'uyumsoft', enum:['uyumsoft','finansbank','innova','logo','turkcell','ingbank']},
        name: {type: String,  trim:true, required: [true,'Kisa bir isim (Sube vs) gereklidir']},
        eInvoice:{
            url: {type: String, trim:true, default: ''},
            firmNo: {type: Number, default: 0},
            username: {type: String, trim:true, default: ''},
            password: {type: String, default: ''},
            prefix: {type: String, trim:true, default: 'AAA',minlength:3,maxlength:3,required: [true,'3 Karakter Fatura Ön Ek gereklidir']},
            postboxAlias: {type: String, trim:true, default: ''},
            senderboxAlias: {type: String, trim:true, default: ''},
            xslt:[{
                fileName:{type: String, trim:true, default: ''},
                isDefault: {type: Boolean, default: false},
                design:{type: String, trim:true, default: ''}
            }],
            localConnector:{
                import:{ //sqlserver to tr216
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
                export:{ //tr216 to sqlserver
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
            }
        },
        eDespatch:{
            url: {type: String, trim:true, default: ''},
            firmNo: {type: Number, default: 0},
            username: {type: String, trim:true, default: ''},
            password: {type: String, default: ''},
            prefix: {type: String, trim:true, default: 'AAA',minlength:3,maxlength:3,required: [true,'3 Karakter Irsaliye Ön Ek gereklidir']},
            postboxAlias: {type: String, trim:true, default: ''},
            senderboxAlias: {type: String, trim:true, default: ''},
            xslt:[{
                fileName:{type: String, trim:true, default: ''},
                isDefault: {type: Boolean, default: false},
                design:{type: String, trim:true, default: ''}
            }],
            localConnector:{
                import:{ //sqlserver to tr216
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
                export:{ //tr216 to sqlserver
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
            }
        },
        eDocument:{
            url: {type: String, trim:true, default: ''},
            firmNo: {type: Number, default: 0},
            username: {type: String, trim:true, default: ''},
            password: {type: String, default: ''},
            prefix: {type: String, trim:true, default: 'AAA',minlength:3,maxlength:3,required: [true,'3 Karakter dokuman Ön Ek gereklidir']},
            postboxAlias: {type: String, trim:true, default: ''},
            senderboxAlias: {type: String, trim:true, default: ''},
            xslt:[{
                fileName:{type: String, trim:true, default: ''},
                isDefault: {type: Boolean, default: false},
                design:{type: String, trim:true, default: ''}
            }],
            localConnector:{
                import:{ //sqlserver to tr216
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
                export:{ //tr216 to sqlserver
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
            }
        },
        eLedger:{
            url: {type: String, trim:true, default: ''},
            firmNo: {type: Number, default: 0},
            username: {type: String, trim:true, default: ''},
            password: {type: String, default: ''},
            localConnector:{
                import:{ //sqlserver to tr216
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
                export:{ //tr216 to sqlserver
                    localConnector:{type: mongoose.Schema.Types.ObjectId, ref: 'local_connectors' , default:null}, 
                    status: {type: String, trim:true, default: ''},
                    error:{code:'',message:''}
                },
            }
        },
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
