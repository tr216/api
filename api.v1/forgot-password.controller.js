  var https = require('https');
  var http = require('http');

  module.exports= function (member, req, res,callback) {
    if(req.method=='POST' || req.method=='PUT'){
      var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
      
      var formdata={
        username: mrutil.clearText(req.body.username || req.query.username || ''),
      };
      if(formdata.username.trim()==""){
        callback({success:false, error:{code:'USERNAME_EMPTY',message:'Telefon numarasi veya email bos olamaz.'}});
      }else{
        
        db.members.findOne({username:formdata.username},function(err,doc){
          if(err){
            callback({success:false, error:{code:err.name,message:err.message}});
          }else if(doc!=null){
              if(doc.verified==false) callback({success:false, error:{code:'USER_NOT_VERIFIED',message:'Kullanici onay kodu girilmemis. Uye olunuz.'}});

              if(mrutil.validEmail(formdata.username)){
                mailsend(formdata.username,doc.password,function(result){
                  callback(result);
                });
              }else if(mrutil.validTelephone(formdata.username)){
                smssend(formdata.username,doc.password,function(result){
                  callback(result);
                });
              }else{
                callback({success:false, error:{code:'USERNAME_WRONG',message:'Kullanici adi hatali.'}});
              }
          }else{
            callback({success:false,error:{code:'RECORD_NOT_FOUND',message:'Kayit bulunamadi'}});
          }
        });
      }
    }else{
      callback({success:false, error:{code:'WRONG_METHOD',message:'Method was wrong!'}});
    }


  }


function smssend(phonenumber,password,callback){
  // callback({success:true, data: null});
  // return;
  //var url = "https://rest.nexmo.com/sms/json?api_key=0d86fd30&api_secret=12ffc8624ba8b155&to=" + phonenumber + "&from=FIL&text=FIL+UYGULAMASINA+HOS GELDINIZ.+ONAY+KODUNUZ+:" + authCode;
  //var url = "https://rest.nexmo.com/sms/json?api_key=0d86fd30&api_secret=12ffc8624ba8b155&to=905533521042&from=FIL&text=ONAY+KODUNUZ+:" + authCode + ".+FIL+UYGULAMASINA+HOS+GELDINIZ.+TELNO:" + phonenumber + "";
  //var url = "https://api.iletimerkezi.com/v1/send-sms/get/?username=5533521042&password=atabar18&text=ONAY%20KODUNUZ%20:" + authCode + " %20TAKASTA%20UYGULAMASINA%20HOS%20GELDINIZ.&receipents=" + phonenumber + "&sender=FIL";
  // var url = "https://api.iletimerkezi.com/v1/send-sms/get/?username=5533521042&password=atabar18&text=ONAY%20KODUNUZ%20:" + authCode + ".%20FIL%20UYGULAMASINA%20HOS%20GELDINIZ.&receipents=5533521042&sender=FIL";
  var url = "http://sms.verimor.com.tr/v2/send?username=902167060842&password=atabar18&source_addr=02167060842&msg=PAROLANIZ%20:" + password + "%20%20%20%20%20%20%20%20%20%20&dest=905533521042&datacoding=0&valid_for=2:00";

 
  
  http.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
      body += chunk;
    });

    res.on('end', function(){
      //console.log('smsbody:' + body);
      console.log('parola Hatirlatma sms: ',phonenumber,password);
      callback({success:true, data: body});
    });
  }).on('error', function(e){
    callback({success:false, error:{code:'ERROR',message:e}});
  });
}

function mailsend(email,password,callback){
  var subject="Parola Hatirlatma";
  var body="Parolaniz : " + password;
  mrutil.sendmail(email,subject,body,function(result){
    console.log('parola Hatirlatma email: ',email,password);
    callback(result);
  });
  
}