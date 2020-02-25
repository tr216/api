
exports.print=function(activeDb,module,data,cb){
    activeDb.print_designs.find({module:module,passive:false}).sort({isDefault:-1}).limit(1).exec((err,docs)=>{
        if(!err){
            if(docs.length==0) return cb(null,'Module:' + module + ' Hata: Tasarim yapilmamis.');
            render(docs[0].design,data,(err,renderedCode)=>{
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