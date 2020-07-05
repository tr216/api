var jwt = require('jsonwebtoken')

module.exports= function (req, res,cb) {
	if(req.params.func=='login' || req.params.func=='signup' || req.params.func=='register' || req.params.func=='verify' || req.params.func=='forgot-password'){
		cb(null)
	}else{
		var token = req.body.token || req.query.token || req.headers['x-access-token']  || req.headers['token']
		if (token) {
			jwt.verify(token, 'gizliSir', function (err, decoded) {
				if (err) 
					throw { code: 'FAILED_TOKEN', message: 'Yetki hatasi' }
				else 
					cb(decoded)
			})
		} else {
			throw {code:`WRONG NO_TOKEN_PROVIDED`, message:`Yetki hatasi`}
		}
	}
}
