module.exports = (dbModel, member, req, res, cb)=>{
    switch(req.method){
        case 'GET':
        if(req.params.param1!=undefined){
            getOne(dbModel,member,req,res,cb)
        }else{
            getList(dbModel,member,req,res,cb)
        }
        break
        case 'DELETE':
        deleteItem(dbModel,member,req,res,cb)
        break
        default:
        error.method(req)
        break
    }

}

function getList(dbModel,member,req,res,cb){
    var options={ page: (req.query.page || 1),
        sort:{startDate:'desc'},
        select:'-document'
    }
    if((req.query.pageSize || req.query.limit)){
        options.limit=req.query.pageSize || req.query.limit
    }

    var filter = {}

    if((req.query.status || '')!='')
        filter['status']=req.query.status

    if((req.query.taskType || '')!='')
        filter['taskType']=req.query.taskType
    
    if(req.query.date1)
        filter['startDate']={$gte:(new Date(req.query.date1))}

    if(req.query.date2){
        if(filter['startDate']){
            filter['startDate']['$lte']=(new Date(req.query.date2 + 'T23:59:59+0300'))
        }else{
            filter['startDate']={$lte:(new Date(req.query.date2+ 'T23:59:59+0300'))}
        }
    }

    dbModel.tasks.paginate(filter,options,(err, resp)=>{
        if(dberr(err)){
            cb(resp)
        }
    })
}

function getOne(dbModel,member,req,res,cb){
    dbModel.tasks.findOne({_id:req.params.param1},(err,doc)=>{
        if(dberr(err)){
            cb(doc)
        }
    })
}


function deleteItem(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data = req.body || {}
	data._id = req.params.param1
	dbModel.tasks.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			cb(null)
		}
	})
}