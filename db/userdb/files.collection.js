module.exports=function(conn){
    var schema = mongoose.Schema({
        name: {type :String, required:[true,'Dosya ismi gereklidir.']},
        extension: {type :String, required:[true,'Dosya uzantisi gereklidir.'], default: 'ejs',
            enum:['ejs','json','xml','xslt','xls','xlsx','doc','docx','txt','pdf','html','js','sh','bat','cmd','jpg','jpeg','csv','sql','xsl','png']
        },
        fileName: {type :String, default:''},
        type: {type :String, default:'text/plain'},
        data: {type: Object, default: null},
        size: {type: Number ,default: 0},
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    schema.pre('save', function(next) {
       this.fileName=this.name + '.' + this.extension;
       this.size=sizeOf(this.data);
       this.modifiedDate=new Date();
       next();
      
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
    

    var collectionName='files';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    //model.relations={pos_devices:'localConnector'}

    return model;
}
