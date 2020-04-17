module.exports = function(activeDb, member, req, res, callback) {
   
    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            getOne(activeDb,member,req,res,callback);
        }else{
            getList(activeDb,member,req,res,callback);
        }
        break;
        
        default:
        callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }

}


function getList(activeDb,member,req,res,callback){
    var options={page: (req.query.page || 1),
        sort:{issueDate:-1, issueTime:-1}
        
    }
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {};

    if((req.query.actionType || '')!=''){
        filter['actionType']=req.query.actionType;
    }
    if((req.query.actionCode || '')!=''){
        filter['actionCode']=req.query.actionCode;
    }
    if((req.query.ioType || '')!=''){
        filter['ioType']=req.query.ioType;
    }
    if((req.query.docId || '')!=''){
        filter['docId']=req.query.docId;
    }
    if((req.query.description || '')!=''){
        filter['description']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' };
    }
    if((req.query.docNo || '')!=''){
        filter['docNo']={ $regex: '.*' + req.query.docNo + '.*' ,$options: 'i' };
    }
   

    activeDb.actions.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            errorLog(__filename,err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    var populate=[]; //qwerty

    activeDb.actions.findOne({_id:req.params.param1}).populate([]).exec((err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

