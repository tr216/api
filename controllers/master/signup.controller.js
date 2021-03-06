var https = require('https')
var http = require('http')

module.exports= (member, req, res, next, cb)=>{
	if(req.method=='GET' || req.method=='POST'){
		var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''

		var formdata={
			date:new Date(), 
			ip : IP, 
			username: util.clearText(req.body.username || req.query.username || ''),
			password: util.clearText(req.body.password || req.query.password || ''),

			deviceid: util.clearText(req.body.deviceid || req.query.deviceid || ''),
			devicetoken: util.clearText(req.body.devicetoken || req.query.devicetoken || '')
		}
		if(formdata.username.trim()=='')
			return next({code:'USERNAME_EMPTY',message:'Telefon numarasi veya email bos olamaz.'})

		db.members.findOne({username:formdata.username},(err,doc)=>{
			if(dberr(err, next)){
				if(doc!=null){
					if(doc.verified)
						return next({code:'USER_EXISTS',message:'Kullanici zaten kayitli.'})

					if(doc.authCode==''){
						doc.authCode=util.randomNumber(100200,998000).toString()
						doc.save()
					}

					if(util.validEmail(formdata.username)){
						mailsend(formdata.username,doc.authCode,(data)=>{
							cb(data)
						})
					}else if(util.validTelephone(formdata.username)){
						smssend(formdata.username,doc.authCode,(data)=>{
							cb(data)
						})
					}else{
						return next({code:'USERNAME_WRONG',message:'Kullanici adi hatali.'})
					}
				}else{
					signup(formdata,(data)=>{
						cb(data)
					})
				}
			}
		})
	}else{
		error.method(req,next)
	}
}


function signup(formdata,cb){
	var authCode=util.randomNumber(100200,998000).toString()
	var ismobile=false
	if(util.validEmail(formdata.username)){
		ismobile=false
	}else if(util.validTelephone(formdata.username)){
		ismobile=true
	}else{
		return next({code:'USERNAME_WRONG',message:'Kullanici adi hatali.'})
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
	})
	newmember.save((err,newDoc)=>{
		if(dberr(err, next)){
			if(ismobile){
				smssend(newDoc.username,newDoc.authCode,(data)=>{
					cb(data)
				})
			}else{
				mailsend(newDoc.username,newDoc.authCode,(data)=>{
					cb(data)
				})
			}

		}
	})

}


function smssend(phonenumber,authCode,cb){
	var url = "http://sms.verimor.com.tr/v2/send?username=902167060842&password=atabar18&source_addr=02167060842&msg=ONAY%20KODUNUZ%20:" + authCode + "%20%20%20%20%20%20%20%20%20%20&dest=905533521042&datacoding=0&valid_for=2:00"
	http.get(url, (res)=>{
		var body = ''
		res.on('data', (chunk)=>{ body += chunk	})
		res.on('end', ()=>{	cb(body) })
	}).on('error', function(e){
		next(e)
	})
}

function mailsend(email,authCode,cb){
	var subject="Uyelik onay kodu"
	var body="Onay Kodunuz : " + authCode
	util.sendmail(email,subject,body,(err,data)=>{
		if(!err){
			cb(data)
		}else{
			next(err)
		}
	})

}