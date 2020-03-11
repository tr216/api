module.exports = function(activeDb, member, req, res, callback) {
   
    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            getOne(activeDb,member,req,res,callback);
        }else{
            getList(activeDb,member,req,res,callback);
        }
        break;
        case 'POST':
        post(activeDb,member,req,res,callback);
        break;
        case 'PUT':
        put(activeDb,member,req,res,callback);
        break;
        case 'DELETE':
        deleteItem(activeDb,member,req,res,callback);
        break;
        default:
        callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }

}

function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1)}
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {};

    for(var i=0;i<100;i++){
        if(req.query['order'+i]!=undefined){
            var o1=req.query['order'+i];
            var oBy='asc';
            if(o1.substring(0,4)=='desc') oBy='desc';
            if(o1.indexOf('_')>-1){
                var key=o1.substr(o1.indexOf('_')+1);
                if(options['sort']==undefined) options['sort']={};

                if(key.indexOf('.')<0 && key!=''){
                    options['sort'][key]=oBy;
                }
                
            }
        }else{
            break;
        }
    }

    if((req.query.passive || '')!=''){
        filter['passive']=req.query.passive;
    }
    
    if((req.query.name || '')!=''){
        filter['name']={ $regex: '.*' + req.query.name  + '.*' ,$options: 'i' };
    }
    
    activeDb.shifts.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.shifts.findOne({_id:req.params.param1},(err,doc)=>{
        if(dberr(err,callback)) {
            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    var newdoc = new activeDb.shifts(data);

    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
    timesCheck(newdoc,(err)=>{
        if(!err){
            newdoc.save(function(err, newdoc2) {
                if(dberr(err,callback)) {
                    callback({success: true,data: newdoc2});
                } 
            });
        }else{
            callback({success: false, error: {code: err.code, message: err.message}});
        }
    })
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data=req.body || {};
        data._id = req.params.param1;
        data.modifiedDate = new Date();
        
        activeDb.shifts.findOne({ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                if(dbnull(doc,callback)) {
                    var doc2 = Object.assign(doc, data);
                    var newdoc = new activeDb.shifts(doc2);
                    var err=epValidateSync(newdoc);
                    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                    timesCheck(newdoc,(err)=>{
                        if(!err){
                            newdoc.save(function(err, newdoc2) {
                                if(dberr(err,callback)) {
                                    callback({success: true,data: newdoc2});
                                } 
                            });
                        }else{
                            callback({success: false, error: {code: err.code, message: err.message}});
                        }
                    })
                    
                }
            }
        });
    }
}

function timesCheck(data,cb){
    if(!data.times) return cb(null);
    var dizi=[];
    var err=null;
    data.times.forEach((e,index)=>{
        if((e.startHour || 0)==(e.endHour || 0)){
            err={code:'SYNTAX_ERROR',message:'Satir ' + (index+1).toString() + ' baslangic ve bitis saatleri ayni olamaz!' }
            return;
        }
        
    });

    cb(err);
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.shifts.removeOne(member,{ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                callback({success: true});
            }
        });
    }
}
