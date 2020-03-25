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
        if(req.params.param1=='copy'){
            copy(activeDb,member,req,res,callback);
        }else{
            post(activeDb,member,req,res,callback);
        }
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

function copy(activeDb,member,req,res,callback){
    var id=req.params.param2 || req.body['id'] || req.query.id || '';
    var newName=req.body['newName'] || req.body['name'] || '';
   
    if(id=='') return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    
    activeDb.account_groups.findOne({ _id: id},(err,doc)=>{
        if(dberr(err,callback)) {
            if(dbnull(doc,callback)) {
                var data=doc.toJSON();
                data._id=undefined;
                delete data._id;
                if(newName!=''){
                    data.name=newName;
                }else{
                    data.name +=' copy';
                }
                
                var newdoc = new activeDb.account_groups(data);
                var err=epValidateSync(newdoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});

                newdoc.save(function(err, newdoc2) {
                    if(dberr(err,callback)) {
                        callback({success: true,data: newdoc2});
                    } 
                });
            }
        }
    });
}

function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1),
        populate:[
            {path:'account',select:'_id accountCode name'},
            {path:'salesAccount',select:'_id accountCode name'},
            {path:'returnAccount',select:'_id accountCode name'},
            
            {path:'exportSalesAccount',select:'_id accountCode name'},
            {path:'salesDiscountAccount',select:'_id accountCode name'},
            {path:'buyingDiscountAccount',select:'_id accountCode name'},
            {path:'costOfGoodsSoldAccount',select:'_id accountCode name'}
        ],
        sort:{name:1}
        
    }
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {};

    if((req.query.name || '')!=''){
        filter['name']={ '$regex': '.*' + req.query.name + '.*' ,'$options': 'i' };
    }

    activeDb.account_groups.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            errorLog(__filename,err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.account_groups.findOne({_id:req.params.param1}).exec((err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    
    if((data.account || '')=='') data.account=undefined;
    if((data.salesAccount || '')=='') data.salesAccount=undefined;
    if((data.returnAccount || '')=='') data.returnAccount=undefined;
    if((data.exportSalesAccount || '')=='') data.exportSalesAccount=undefined;
    if((data.salesDiscountAccount || '')=='') data.salesDiscountAccount=undefined;
    if((data.buyingDiscountAccount || '')=='') data.buyingDiscountAccount=undefined;
    if((data.costOfGoodsSoldAccount || '')=='') data.costOfGoodsSoldAccount=undefined;
   

    var newdoc = new activeDb.account_groups(data);

    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
    newdoc.save(function(err, newdoc2) {
        if (!err) {
            callback({success:true,data:newdoc2});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined) return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});

    var data=req.body || {};
    data._id = req.params.param1;
    data.modifiedDate = new Date();
    if((data.account || '')=='') data.account=undefined;
    if((data.returnAccount || '')=='') data.returnAccount=undefined;
    if((data.salesAccount || '')=='') data.salesAccount=undefined;
    if((data.exportSalesAccount || '')=='') data.exportSalesAccount=undefined;
    if((data.salesDiscountAccount || '')=='') data.salesDiscountAccount=undefined;
    if((data.buyingDiscountAccount || '')=='') data.buyingDiscountAccount=undefined;
    if((data.costOfGoodsSoldAccount || '')=='') data.costOfGoodsSoldAccount=undefined;

    activeDb.account_groups.findOne({ _id: data._id},(err,doc)=>{
        if (!err) {
            if(doc==null){
                callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
            }else{

                var doc2 = Object.assign(doc, data);
                var newdoc = new activeDb.account_groups(doc2);
                var err=epValidateSync(newdoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                newdoc.save(function(err, newdoc2) {
                    if (!err) {
                        callback({success: true,data: newdoc2});
                    } else {
                        callback({success: false, error: {code: err.name, message: err.message}});
                    }
                });
            }
        }else{
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
    
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.account_groups.removeOne(member,{ _id: data._id},(err,doc)=>{
            if (!err) {
                callback({success: true});
            }else{
                callback({success: false, error: {code: err.name, message: err.message}});
            }
        });
    }
}
