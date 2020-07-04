module.exports = function(member, req, res, callback) {

    switch(req.method){
        case 'GET':
            getMyProfile(member,req,res,callback);
        break;
        case 'PUT':
            put(member,req,res,callback);
        break;
        default:
            callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
        break;
    }
}

function getMyProfile(member,req,res,callback){
    db.sysusers.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err,callback)){
            if(doc==null) return callback({success:false,error:{code:'RECORD_NOT_FOUND',message:'Kayit bulunamadi'}});
            var myProfile={
                _id:doc._id,
                name:doc.name,
                lastName:doc.lastName,
                username:doc.username,
                email:doc.email,
                gender:doc.gender
            }
            callback({success:true,data:myProfile});
        }
    });  
}

function put(member,req,res,callback){
    db.sysusers.findOne({_id:member._id},(err,doc)=>{
        if(dberr(err,callback)){
            if(doc==null) return callback({success:false,error:{code:'RECORD_NOT_FOUND',message:'Kayit bulunamadi'}});
            //var data={}
            doc.name=req.body.name || '';
            doc.lastName=req.body.lastName || '';
            doc.email=req.body.email || '';
            doc.gender=req.body.gender || '';

            var oldPassword=req.body.oldPassword || '';
            var newPassword=req.body.newPassword || '';

            if(doc.name.trim()=='') return callback({success:false,error:{code:'REQUIRE_FIELD',message:'Isim gereklidir.'}});
            if(doc.lastName.trim()=='') return callback({success:false,error:{code:'REQUIRE_FIELD',message:'Soyad gereklidir.'}});
            if(oldPassword!='' || newPassword!=''){
                if(oldPassword!=doc.password) return callback({success:false,error:{code:'PASSWORD_WRONG',message:'Eski parola hatali.'}});
                doc.password=newPassword;
            }
            if(doc.gender!='male' && doc.gender!='female') return callback({success:false,error:{code:'REQUIRE_FIELD',message:'Cinsiyet hatali.'}});

            doc.save((err,newDoc)=>{
                if(dberr(err,callback)){
                    var myProfile={
                        _id:newDoc._id,
                        name:newDoc.name,
                        lastName:newDoc.lastName,
                        username:newDoc.username,
                        email:newDoc.email,
                        gender:newDoc.gender
                    }
                    callback({success:true,data:myProfile});
                }
            });
        }
    });  
}

