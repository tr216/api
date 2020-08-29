var helper=require('./mydbdefines.helper')
module.exports = (member, req, res, next, cb)=>{

    switch(req.method){
        case 'GET':
            if(req.params.param1!=undefined){
                helper.getOne(member,req,res,next,cb)
            }else{
                helper.getList(member,req,res,next,cb)
            }
            
        break
        
        default:
            error.method(req,next)
        break
    }
}

// exports.getList=function(member,req,res,next,cb){
//     db.dbdefines.find({deleted:false, passive:false, $or:[{owner:member._id},{'authorizedMembers.memberId':member._id}]}).populate('owner','_id username name lastName modules').exec((err,docs)=>{
//         if(!err){
//             var data=[]
//             docs.forEach((e)=>{
//             	var auth={owner:false,canRead:false,canWrite:false,canDelete:false}
               
//                 if(e.owner._id==member._id){
//                     auth.owner=true
//                     auth.canRead=true
//                     auth.canWrite=true
//                     auth.canDelete=true
//                 }else{
//                 	e.authorizedMembers.forEach((e2)=>{
//                 		if(e2.memberId==member._id){
//                             auth.canRead=e2.canRead
//                             auth.canWrite=e2.canWrite
//                             auth.canDelete=e2.canDelete
//                             return
//                         }
//                 	})
                   
//                 }
//                 if(auth.canRead){
//                     data.push({_id:e._id,dbName:e.dbName,owner:e.owner, auth:auth})
//                 }
//             })
//             cb(data)
//         }else{
//             next({code: err.name, message: err.message})
//         }
//     })
// }

// function getOne(member,req,res,next,cb){
//     db.dbdefines.findOne({_id:req.params.param1, deleted:false, passive:false,owner:member._id}).populate('owner','_id username name lastName modules').populate('authorizedMembers.memberId','_id username name lastName').exec((err,doc)=>{
//         if(dberr(err, next)){
//             if(dbnull(doc, next)){
//                 cb(doc)
//             }
//         }
//     })
// }