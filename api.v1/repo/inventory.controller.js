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
        populate:[
            {path:'item',select:'_id name'},
            {path:'details.locationId',select:'_id locationName locationType'}
        ]
        
    }
    if(!req.query.page){
        options.limit=50000;
    }
    var filter = {};

    if((req.query.item || '')!=''){
        filter['item']=req.query.item;
    }
    if((req.query.locationId || req.query.location || '')!=''){
        filter['details.locationId']=req.query.locationId || req.query.location;
    }
   

    activeDb.inventory_lives.paginate(filter,options,(err, resp)=>{
        if (dberr(err,callback)) {
            callback({success: true,data: resp});
        } else {
            errorLog(__filename,err);
        }
    });
}

function getOne(activeDb,member,req,res,callback){
    var populate=[
        {path:'item',select:'_id name'},
        {path:'details.locationId',select:'_id locationName locationType'}
    ]
    activeDb.inventory_lives.findOne({$or:[{item:req.params.param1},{_id:req.params.param1}]}).populate(populate).exec((err,doc)=>{
        if (!err) {
            callback({success: true,data: doc});
        } else {
            callback({success: false, error: {code: err.name, message: err.message}});
        }
    });
}

