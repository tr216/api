module.exports = function(req, res, callback) {
    passport(req, res, function(result) {
        if (result.success) {
            var member = result.data;
            if (req.method == 'GET') {
                var itemid = req.query.id || '';

                db.items.findOne({
                    _id: itemid,
                    deleted:false
                }).populate('member','name lastname address').populate('picturelist.image').exec(function(err, doc) {
                    if (!err) {
                        callback({
                            success: true,
                            error: null,
                            data: doc
                        });
                    } else {
                        callback({
                            success: false,
                            error: {
                                code: err.name,
                                message: err.message
                            }
                        });
                    }
                });
            } else {
                callback({
                    success: false,
                    error: {
                        code: 'WRONG_METHOD',
                        message: 'Method was wrong!'
                    }
                });
            }

        } else {
            callback(result);
        }
    });
}

