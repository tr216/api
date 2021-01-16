module.exports = (member, req, res, next, cb)=>{
    switch(req.method){
        case 'GET':
            getMyProfile(member,req,res,next,cb)
        break
        case 'PUT':
        put(member,req,res,next,cb)
        // if(req.params.param1==undefined){
        //     put(member,req,res,next,cb)
        // }else if(req.params.param1=='change-password'){
        //     changePassword(member,req,res,next,cb)
        // }else{
        //     error.param1(req,next)
        // }
        break
        default:
            error.method(req,next)
        break
    }
}



function getMyProfile(member,req,res,next,cb){
    db.members.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err, next)){
            if(dbnull(doc, next)){
            	var myProfile={
	                _id:doc._id,
	                name:doc.name,
	                lastName:doc.lastName,
	                username:doc.username,
	                email:doc.email,
	                gender:doc.gender
	            }
	            cb(myProfile)
            }
        }
    })  
}

function put(member,req,res,next,cb){
    db.members.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err, next)){
            if(dbnull(doc, next)){
            	doc.name=req.body.name || ''
	            doc.lastName=req.body.lastName || ''
	            doc.email=req.body.email || ''
	            doc.gender=req.body.gender || ''

	            var oldPassword=req.body.oldPassword || ''
	            var newPassword=req.body.newPassword || ''
	            var rePassword=req.body.rePassword || ''
	            if(oldPassword!='' || newPassword!='' || rePassword!=''){
	            	if(newPassword.trim()=='') 
		            	return next({code:'REQUIRE_FIELD',message:'Yeni parola gereklidir.'})
		            if(oldPassword!=doc.password) 
		            	return next({code:'PASSWORD_WRONG',message:'Eski parola hatali.'})
		            if(req.body.rePassword!=undefined){
		            	if(newPassword!=rePassword)
		            		return next({code:'REQUIRE_FIELD',message:'Yeni tekrar parola hatali.'})
		            }
		            doc.password=newPassword
	            }
	            if(doc.name.trim()=='') 
	            	return next({code:'REQUIRE_FIELD',message:'Isim gereklidir.'})
	            if(doc.lastName.trim()=='') 
	            	return next({code:'REQUIRE_FIELD',message:'Soyad gereklidir.'})
	            
	            if(doc.gender!='male' && doc.gender!='female') 
	            	return next({code:'REQUIRE_FIELD',message:'Cinsiyet hatali.'})

	            doc.save((err,newDoc)=>{
	                if(dberr(err, next)){
	                    var myProfile={
	                        _id:newDoc._id,
	                        name:newDoc.name,
	                        lastName:newDoc.lastName,
	                        username:newDoc.username,
	                        email:newDoc.email,
	                        gender:newDoc.gender
	                    }
	                    cb(myProfile)
	                }
	            })
            }
        }
    })  
}

// function changePassword(member,req,res,next,cb){
//     db.members.findOne({_id:member._id},(err,doc)=>{
//         if(dberr(err, next)){
//             if(dbnull(doc, next)){
//             	var oldPassword=req.body.oldPassword || ''
// 	            var newPassword=req.body.newPassword || ''

// 	            if(newPassword.trim()=='') 
// 	            	return next({code:'REQUIRE_FIELD',message:'Yeni parola gereklidir.'})
// 	            if(oldPassword!=doc.password) 
// 	            	return next({code:'PASSWORD_WRONG',message:'Eski parola hatali.'})
// 	            doc.password=newPassword
// 	            doc.save((err,newDoc)=>{
// 	                if(dberr(err, next)){
// 	                    var myProfile={
// 	                        _id:newDoc._id,
// 	                        name:newDoc.name,
// 	                        lastName:newDoc.lastName,
// 	                        username:newDoc.username,
// 	                        email:newDoc.email,
// 	                        gender:newDoc.gender
// 	                    }
// 	                    cb(myProfile)
// 	                }
// 	            })
//             }
            
            
            
//         }
//     })  
// }


