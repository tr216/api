
exports.print=function(activeDb,module,doc,cb){
    var data={}
    if(doc['__v']!=undefined){
        data=doc.toJSON();
    }else{
        data=doc;
    }
    activeDb.print_designs.find({module:module,passive:false}).sort({isDefault:-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var design='';
            if(docs.length==0){
                design=fs.readFileSync(path.join(__dirname,'print-design-default.ejs'),'utf-8');
            }else{
                design=docs[0].design
            }
            render(design,{data:data},(err,renderedCode)=>{
                if(!err){
                    cb(null,renderedCode)
                }else{
                    cb(null,err.code + ' - ' + err.message);
                }
            });
        }else{
            cb(null,(err.message || err.toString()));
        }
    });
}

function render(code, data,cb){
    try{
        let ejs = require('ejs');
        var renderedCode='';

        renderedCode=ejs.render(code,data);
        
        cb(null,renderedCode);
    }catch(err){
        eventLog(err);
        cb({code:err.name || 'EJS_RENDER_ERROR' ,name:err.name || 'EJS_RENDER_ERROR',message: err.message || err.toString()});
    }
    
}