module.exports= function (member, req, res,callback) {
    if(req.method=='GET' || req.method=='POST'){
      var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';

      var username = mrutil.clearText(req.body.username || req.query.username || '');
      var authCode = mrutil.clearText(req.body.authCode || req.query.authCode || '');
      var deviceid = mrutil.clearText(req.body.deviceid || req.query.deviceid || '');
      var devicetoken = mrutil.clearText(req.body.devicetoken || req.query.devicetoken || '');

      if(username.trim()==""){
        callback({success:false, error:{code:'USERNAME_EMPTY',message:'Telefon numarasi veya email bos olamaz.'}});
      }else{
        db.members.findOne({username:username},function(err,doc){
          if(err){
            callback({success:false, error:{code:err.name,message:err.message}});
          }else if(doc!=null){

            if(doc.authCode==authCode){
              doc.verified=true;
              doc.deviceid = deviceid;
              doc.devicetoken = devicetoken;
              
              doc.save(function(err,newdoc){
                if(err){
                  callback({success:false, error:{code:err.name,message:err.message}});
                }else{
                  var userinfo = { 
                      _id : doc._id,
                      username: doc.username,
                      name: doc.name,
                      lastName: doc.lastName,
                      gender: doc.gender,
                      role : doc.role,
                      isSysUser:false,
                      isMember:true,
                      isMobile: doc.isMobile,
                      country : doc.country,
                      deviceId : doc.deviceId,
                      deviceToken : doc.deviceToken,
                      authCode : doc.authCode,
                      ip: IP
                  }
                  var token ;
                  var jwt = require('jsonwebtoken');
                  if(doc.ismobile==false){
                    token=jwt.sign(userinfo, 'gizliSir', {expiresIn: 30*1440*60});
                  }else{
                    token=jwt.sign(userinfo, 'gizliSir', {expiresIn: 5*365*1440*60});
                  }
                  callback({success:true, data:token});
                }
              });
            }else{
              callback({success:false, error:{code:'AUTH_CODE_ERROR',message:'Onay kod hatali.'}});
            }
          }else{
            callback({success:false, error:{code:'USER_NOT_EXIST',message:'Telefon numarasi veya email bulunamadi.'}});
          }
        });
      }
    }else{
      callback({success:false, error:{code:'WRONG_METHOD',message:'Method was wrong!'}});
    }
  }
