var https = require('https')
var http = require('http')

module.exports= (member, req, res, next, cb)=>{
	if(req.method=='POST' || req.method=='PUT'){
		var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''

		var formdata={
			username: util.clearText(req.body.username || req.query.username || ''),
		}
		if(formdata.username.trim()=="")
			throw {code:'USERNAME_EMPTY',message:'Telefon numarasi veya email bos olamaz.'}


		db.members.findOne({username:formdata.username},function(err,doc){
			if(dberr(err, next))
				if(dbnull(doc, next)){
					if(doc.verified==false) 
						throw {code:'USER_NOT_VERIFIED',message:'Kullanici onay kodu girilmemis. Uye olunuz.'}

					if(util.validEmail(formdata.username)){
						mailsend(formdata.username,doc.password,(data)=>{
							cb(data)
						})
					}else if(util.validTelephone(formdata.username)){
						smssend(formdata.username,doc.password,(data)=>{
							cb(data)
						})
					}else{
						throw {code:'USERNAME_WRONG',message:'Kullanici adi hatali.'}
					}
				}
			})
	}else{
		error.method(req,next)
	}
}


function smssend(phonenumber,password,cb){
	var url = "http://sms.verimor.com.tr/v2/send?username=902167060842&password=atabar18&source_addr=02167060842&msg=PAROLANIZ%20:" + password + "%20%20%20%20%20%20%20%20%20%20&dest=905533521042&datacoding=0&valid_for=2:00"
	http.get(url, (res)=>{
		var body = ''
		res.on('data', (chunk)=>{ body += chunk	})
		res.on('end', ()=>{	cb(body) })
	}).on('error', function(e){
		throw e
	})
}

function mailsend(email,password,cb){
	var subject="Parola Hatirlatma"
	var body="Parolaniz : " + password
	util.sendmail(email,subject,body,(err,data)=>{
		if(!err){
			cb(data)
		}else{
			throw err
		}
	})

}