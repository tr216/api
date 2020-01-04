module.exports = function(activeDb, member, req, res, callback) {
   
    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            getOne(activeDb,member,req,res,callback);
        }else{
            getList(activeDb,member,req,res,callback);
        }
        break;
        // case 'POST':
        // post(activeDb,member,req,res,callback);
        // break;
        // case 'PUT':
        // put(activeDb,member,req,res,callback);
        // break;
        case 'DELETE':
        deleteItem(activeDb,member,req,res,callback);
        break;
        default:
        callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }

}

function getList(activeDb,member,req,res,callback){
    var options={ page: (req.query.page || 1),
        sort:{startDate:'desc'},
        select:'-document'
    }
    if((req.query.pageSize || req.query.limit)){
        options.limit=req.query.pageSize || req.query.limit;
    }

    var filter = {};

    if((req.query.status || '')!=''){
        filter['status']=req.query.status;
    }

    if((req.query.taskType || '')!=''){
        filter['taskType']=req.query.taskType;
    }
    
    if(req.query.date1){
        filter['startDate']={$gte:(new Date(req.query.date1))};
    }

    if(req.query.date2){
        if(filter['startDate']){
            filter['startDate']['$lte']=(new Date(req.query.date2 + 'T23:59:59+0300'));
        }else{
            filter['startDate']={$lte:(new Date(req.query.date2+ 'T23:59:59+0300'))};
        }
    }

    activeDb.tasks.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            console.log('error:',err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.tasks.findOne({_id:req.params.param1},(err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

// function post(activeDb,member,req,res,callback){
//     var data = req.body || {};
//     var newdoc = new activeDb.locations(data);
//     var err=epValidateSync(newdoc);
//     if(err) return callback({success: false, error: {code: err.name, message: err.message}});
//     newdoc.save(function(err, newdoc2) {
//         if (!err) {
//             callback({success:true,data:newdoc2});
//         } else {
//             callback({success: false, error: {code: err.name, message: err.message}});
//         }
//     });
// }

// function put(activeDb,member,req,res,callback){
//     if(req.params.param1==undefined){
//         callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
//     }else{
//         var data=req.body || {};
//         data._id = req.params.param1;
//         data.modifiedDate = new Date();

//         activeDb.locations.findOne({ _id: data._id},(err,doc)=>{
//             if (!err) {
//                 if(doc==null){
//                     callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
//                 }else{
//                     var doc2 = Object.assign(doc, data);
//                     var newdoc = new activeDb.locations(doc2);
//                     var err=epValidateSync(newdoc);
//                     if(err) return callback({success: false, error: {code: err.name, message: err.message}});
//                     newdoc.save(function(err, newdoc2) {
//                         if (!err) {
//                             callback({success: true,data: newdoc2});
//                         } else {
//                             callback({success: false, error: {code: err.name, message: err.message}});
//                         }
//                     });
//                 }
//             }else{
//                 callback({success: false, error: {code: err.name, message: err.message}});
//             }
//         });
//     }
// }

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.tasks.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}
