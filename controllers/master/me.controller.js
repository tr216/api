module.exports = (member, req, res, cb)=>{
    switch(req.method){
        case 'GET':
            getMyProfile(member,req,res,cb)
        break
        case 'PUT':
        if(req.params.param1==undefined){
            put(member,req,res,cb)
        }else if(req.params.param1=='change-password'){
            changePassword(member,req,res,cb)
        }else{
            error.param1(req)
        }
        break
        default:
            error.method(req)
        break
    }
}



function getMyProfile(member,req,res,cb){
    db.members.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err)){
            if(dbnull(doc)){
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

function put(member,req,res,cb){
    db.members.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err)){
            if(dbnull(doc)){
            	doc.name=req.body.name || ''
	            doc.lastName=req.body.lastName || ''
	            doc.email=req.body.email || ''
	            doc.gender=req.body.gender || ''

	            var oldPassword=req.body.oldPassword || ''
	            var newPassword=req.body.newPassword || ''

	            if(doc.name.trim()=='') 
	            	throw {code:'REQUIRE_FIELD',message:'Isim gereklidir.'}
	            if(doc.lastName.trim()=='') 
	            	throw {code:'REQUIRE_FIELD',message:'Soyad gereklidir.'}
	            
	            if(doc.gender!='male' && doc.gender!='female') 
	            	throw {code:'REQUIRE_FIELD',message:'Cinsiyet hatali.'}

	            doc.save((err,newDoc)=>{
	                if(dberr(err)){
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

function changePassword(member,req,res,cb){
    db.members.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err)){
            if(dbnull(doc)){
            	var oldPassword=req.body.oldPassword || ''
	            var newPassword=req.body.newPassword || ''

	            if(newPassword.trim()=='') 
	            	throw {code:'REQUIRE_FIELD',message:'Yeni parola gereklidir.'}
	            if(oldPassword!=doc.password) 
	            	throw {code:'PASSWORD_WRONG',message:'Eski parola hatali.'}
	            doc.password=newPassword
	            doc.save((err,newDoc)=>{
	                if(dberr(err)){
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


