var htmlToText = require('html-to-text');

module.exports= function (req, res,callback) {
    if(req.method=='POST' || req.method=='PUT'){
        var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
        
        // Soru: Hocam; bu sükse dedikleri şey nedir? 
        // Nasıl yapılır? 
        // Mesela "Tarkan büyük sükse yaptı." ne demektir. 
        // Biz de evimizde sükse yapabilir miyiz? 
        // * efe aydal


        var formdata={date:new Date(), IP : IP, name:'',email:'',comment:'',url:''};
        formdata.name = req.body.name || '';
        formdata.tel = req.body.tel || '';
        formdata.email = req.body.email || '';
        formdata.message = req.body.message || '';
        formdata.name = htmlToText.fromString(formdata.name, {wordwrap: 255});
        formdata.tel = htmlToText.fromString(formdata.tel, {wordwrap: 255});
        formdata.email = htmlToText.fromString(formdata.email, {wordwrap: 255});
        formdata.message = htmlToText.fromString(formdata.message, {wordwrap: 255});

        var emailsubject="Fil Iletisim " + formdata.date.yyyymmdd();
        var emailbody="<b>Fil Iletisim Formu</b><br><hr><br>" + 
        "Date :<b>" +  formdata.date.yyyymmddhhmmss() + "</b><br><br>" + 
        "Name:<b>" +formdata.name + "</b><br><br>" + 
        "Email:<b>" +formdata.email + "</b><br><br>" + 
        "Tel:<b>" +formdata.tel + "</b><br><br>" + 
        "IP:<b>" +formdata.IP + "</b><br><br>" + 
        "Mesaj:<b>" + formdata.message + "</b><br><br>" + 
        "<br><br><br><br>"; 
        mrutil.sendadminmail(emailsubject,emailbody,function(result){
            callback(result);
        });
        
        
    }else{
        callback({success:false, error:{code:'WRONG_METHOD',message:'Method was wrong!'}});
    }
   
   
   
}
