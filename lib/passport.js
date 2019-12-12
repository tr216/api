var jwt = require('jsonwebtoken');

module.exports= function (req, res,cb) {
    if(req.params.func=='login' || req.params.func=='signup' || req.params.func=='register' || req.params.func=='verify' || req.params.func=='forgot-password'){
        cb(null);
    }else{
        var token = req.body.token || req.query.token || req.headers['x-access-token']  || req.headers['token'];
        if (token) {
            jwt.verify(token, 'gizliSir', function (err, decoded) {
                if (err) {
                    cb({ code: 'FAILED_TOKEN', message: 'Yetki hatasi' });
                } else {
                        cb(null,decoded);
                    }
                });
        } else {
            cb({ code: 'NO_TOKEN_PROVIDED', message: 'Yetki hatasi' });
        }
    }
}



// module.exports= function (req, res,callback) {
//     var token = req.body.token || req.query.token || req.headers['x-access-token']  || req.headers['token'];
//     if (token) {
//         jwt.verify(token, 'gizliSir', function (err, decoded) {
//             if (err) {
//                 callback({ success: false, error: { code: 'FAILED_TOKEN', message: 'Yetki hatasi' } });
//             } else {
//                     callback({ success: true, data: decoded });
//                 }
//             });
//     } else {
//         callback({ success: false, error: { code: 'NO_TOKEN_PROVIDED', message: 'Yetki hatasi' }});
//         return;
//     }

// }