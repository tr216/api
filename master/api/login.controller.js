module.exports= function (member, req, res, callback) {
	
	if(req.method=='GET' || req.method=='POST'){
		var username= mrutil.clearText(req.body.username || req.query.username || '');
		var password= mrutil.clearText(req.body.password || req.query.password || '');
		var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
		if(username.trim()==""){
			callback({success:false, error:{code:'USERNAME_EMPTY',message:'Kullanıcı bilgisi(email,username,telefon) boş olamaz.'}});
		}else{
			if(username.length>5 && username.substr(-5)=='@root'){
				username=username.substr(0,username.length-5);

				db.sysusers.findOne({username:username,password:password},(err,doc)=>{
					if(dberr(err,callback)){
						if(doc==null) return callback({success:false, error:{code:'LOGIN_FAILED',message:'Giriş başarısız'}});
						if(doc.passive) return callback({success:false, error:{code:'USER_PASSIVE',message:'Kullanici pasif duruma alinmis.'}});
						var userinfo = { 
							_id : doc._id,
							username: doc.username,
							name: doc.name,
							lastName: doc.lastName,
							gender: doc.gender,
							role : doc.role,
							isSysUser:true,
							isMember:false,
							auth:doc.auth,
							ip: IP
						}

						var token;
						var jwt = require('jsonwebtoken');
						token=jwt.sign(userinfo, 'gizliSir', {expiresIn: 30*1440*60});
						callback({success:true, data:{username:doc.username, isSysUser:true,isMember:false, role:doc.role, token:token}});
					}
				});
			}else{
				db.members.findOne({username:username , password:password},function(err,doc){
					if(dberr(err,callback)){
		                if(doc==null) return callback({success:false, error:{code:'LOGIN_FAILED',message:'Giriş başarısız'}});
		                if(doc.passive) callback({success:false, error:{code:'USER_PASSIVE',message:'Kullanici pasif duruma alinmis.'}});
		                if(doc.verified==false) callback({success:false, error:{code:'USER_NOT_VERIFIED',message:'Kullanici onay kodu alinmamis.'}});
		                var userinfo = { 
		                    _id : doc._id,
		                    username: doc.username,
		                    name: doc.name,
		                    lastName: doc.lastName,
		                    gender: doc.gender,
		                    role : doc.role,
		                    isSysUser:false,
		                    isMember:true,
		                    ip: IP,
		                    modules:(doc.modules || {})
		                }
		                
		                var token;
		                var jwt = require('jsonwebtoken');
		                if(doc.ismobile){
		                    token=jwt.sign(userinfo, 'gizliSir', {expiresIn: 5*365*1440*60});
		                }else{
		                    token=jwt.sign(userinfo, 'gizliSir', {expiresIn: 30*1440*60});
		                }
		                
		                callback({success:true, data:{username:doc.username, name:doc.name, lastName:doc.lastName,gender:doc.gender, isSysUser:false,isMember:true, role:doc.role, token:token}});
		            }
				});
			}
			

		}

	}else{
		callback({success:false, error:{code: 'WRONG_METHOD' ,message: 'Wrong method'}});
	}

}
