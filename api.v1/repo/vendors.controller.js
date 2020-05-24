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
    var filter = {partyType:'Vendor'};

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
    if((req.query.name || req.query.partyName || '')!=''){
        filter['partyName.name.value']={ $regex: '.*' + (req.query.name || req.query.partyName) + '.*' ,$options: 'i' };
    }

    if((req.query.cityName || '')!=''){
        filter['postalAddress.cityName.value']={ $regex: '.*' + req.query.cityName + '.*' ,$options: 'i' };
    }
    if((req.query.district || '')!=''){
        filter['postalAddress.district.value']={ $regex: '.*' + req.query.district + '.*' ,$options: 'i' };
    }
    activeDb.parties.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            resp.docs.forEach((e)=>{
                e.vknTckn='';
                e.mersisNo='';
                e.partyIdentification.forEach((e2)=>{
                    switch(e2.ID.attr.schemeID.toUpperCase()){
                        case 'VKN':
                        case 'TCKN':
                            e.vknTckn=e2.ID.value;
                        break;
                        case 'MERSISNO':
                        case 'MERSİSNO':
                            e.mersisNo=e2.ID.value;
                        break;
                    }
                });
            });
            callback({success: true,data: resp});
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    activeDb.parties.findOne({_id:req.params.param1},(err,doc)=>{
        if(dberr(err,callback)) {

            callback({success: true,data: doc});
        }
    });
}

function post(activeDb,member,req,res,callback){
    var data = req.body || {};
    data._id=undefined;

    if((data.account || '')=='') data.account=undefined;

    var newdoc = new activeDb.parties(data);
    newdoc.partyType='Vendor';
    var err=epValidateSync(newdoc);
    if(err) return callback({success: false, error: {code: err.name, message: err.message}});
    newdoc.save(function(err, newdoc2) {
        if(dberr(err,callback)) {
            callback({success:true,data:newdoc2});
        } 
    });
}

function put(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}});
    }else{
        var data=req.body || {};
        data._id = req.params.param1;
        data.modifiedDate = new Date();
        if((data.account || '')=='') data.account=undefined;
        
        activeDb.parties.findOne({ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                if(doc==null) return callback({success: false,error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}});
                    
                if(doc.partyType!='Vendor' &&  doc.partyType!='VendorAgency')
                    return callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Yanlis partyType'}});
                    
                var doc2 = Object.assign(doc, data);
                var newdoc = new activeDb.parties(doc2);
                var err=epValidateSync(newdoc);
                if(err) return callback({success: false, error: {code: err.name, message: err.message}});
                newdoc.save(function(err, newdoc2) {
                    if(dberr(err,callback)) {
                        callback({success: true,data: newdoc2});
                    } 
                });
            }
        });
    }
}

function deleteItem(activeDb,member,req,res,callback){
    if(req.params.param1==undefined){
        callback({success: false,error: {code: 'WRONG_PARAMETER', message: 'Parametre hatali'}});
    }else{
        var data = req.body || {};
        data._id = req.params.param1;
        activeDb.parties.removeOne(member,{ _id: data._id},(err,doc)=>{
            if(dberr(err,callback)) {
                callback({success: true});
            }
        });
    }
}
