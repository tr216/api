  var https = require('https');
  var http = require('http');

  module.exports= function (member, req, res,callback) {
    if(req.method=='GET' || req.method=='POST'){
      var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
      
      var formdata={
        date:new Date(), 
        ip : IP, 
        username: mrutil.clearText(req.body.username || req.query.username || ''),
        password: mrutil.clearText(req.body.password || req.query.password || ''),

        //ismobile: mrutil.clearText(req.body.ismobile || req.query.ismobile || true),
        
        deviceid: mrutil.clearText(req.body.deviceid || req.query.deviceid || ''),
        devicetoken: mrutil.clearText(req.body.devicetoken || req.query.devicetoken || '')
      };
      if(formdata.username.trim()==""){
        callback({success:false, error:{code:'USERNAME_EMPTY',message:'Telefon numarasi veya email bos olamaz.'}});
      }else{
        
        db.members.findOne({username:formdata.username},function(err,doc){
          if(err){
            callback({success:false, error:{code:err.name,message:err.message}});
          }else if(doc!=null){
            if(doc.verified){
              return callback({success:false, error:{code:'USER_EXISTS',message:'Kullanici zaten kayitli.'}});
            }
            if(doc.authCode==''){
              doc.authCode=mrutil.randomNumber(100200,998000).toString();
              doc.save();
            }
            if(mrutil.validEmail(formdata.username)){
              mailsend(formdata.username,doc.authCode,function(result){
                callback(result);
              });
            }else if(mrutil.validTelephone(formdata.username)){
              smssend(formdata.username,doc.authCode,function(result){
                callback(result);
              });
            }else{
              callback({success:false, error:{code:'USERNAME_WRONG',message:'Kullanici adi hatali.'}});
            }
            //}
          }else{
            signup(formdata,function(result){
              callback(result);
            });
          }
        });
       
      }

    }else{
      callback({success:false, error:{code:'WRONG_METHOD',message:'Method was wrong!'}});
    }


  }


function signup(formdata,callback){
  var authCode=mrutil.randomNumber(100200,998000).toString();
  var ismobile=false;
  if(mrutil.validEmail(formdata.username)){
    ismobile=false;
  }else if(mrutil.validTelephone(formdata.username)){
    ismobile=true;
  }else{
    callback({success:false, error:{code:'USERNAME_WRONG',message:'Kullanici adi hatali.'}});
  }
  var newmember = new db.members({
    username:formdata.username,
    password:formdata.password,
    ismobile: ismobile,
    country: formdata.country,
    role: formdata.role,
    authCode: authCode,
    ip:formdata.ip,
    deviceid:formdata.deviceid,
    devicetoken:formdata.devicetoken
  });
  newmember.save(function(err,newdoc){
    if(err){
      callback({success:false, error:{code:err.name,message:err.message}});
    }else{
      if(ismobile){
        smssend(newdoc.username,newdoc.authCode,function(result){
          callback(result);
        });
      }else{
        mailsend(newdoc.username,newdoc.authCode,function(result){
          callback(result);
        });
      }
      
    }
  });
 
}



function smssend(phonenumber,authCode,callback){
  // callback({success:true, data: null});
  // return;
  //var url = "https://rest.nexmo.com/sms/json?api_key=0d86fd30&api_secret=12ffc8624ba8b155&to=" + phonenumber + "&from=FIL&text=FIL+UYGULAMASINA+HOS GELDINIZ.+ONAY+KODUNUZ+:" + authCode;
  //var url = "https://rest.nexmo.com/sms/json?api_key=0d86fd30&api_secret=12ffc8624ba8b155&to=905533521042&from=FIL&text=ONAY+KODUNUZ+:" + authCode + ".+FIL+UYGULAMASINA+HOS+GELDINIZ.+TELNO:" + phonenumber + "";
  //var url = "https://api.iletimerkezi.com/v1/send-sms/get/?username=5533521042&password=atabar18&text=ONAY%20KODUNUZ%20:" + authCode + " %20TAKASTA%20UYGULAMASINA%20HOS%20GELDINIZ.&receipents=" + phonenumber + "&sender=FIL";
  // var url = "https://api.iletimerkezi.com/v1/send-sms/get/?username=5533521042&password=atabar18&text=ONAY%20KODUNUZ%20:" + authCode + ".%20FIL%20UYGULAMASINA%20HOS%20GELDINIZ.&receipents=5533521042&sender=FIL";
  var url = "http://sms.verimor.com.tr/v2/send?username=902167060842&password=atabar18&source_addr=02167060842&msg=ONAY%20KODUNUZ%20:" + authCode + "%20%20%20%20%20%20%20%20%20%20&dest=905533521042&datacoding=0&valid_for=2:00";

 
  
  http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
      body += chunk;
    });

    res.on('end', function(){
      //console.log('smsbody:' + body);
      callback({success:true, data: body});
    });
  }).on('error', function(e){
    callback({success:false, error:{code:'ERROR',message:e}});
  });
}

function mailsend(email,authCode,callback){
  var subject="Uyelik onay kodu";
  var body="Onay Kodunuz : " + authCode;
  mrutil.sendmail(email,subject,body,function(result){
    callback(result);
  });
  
}
