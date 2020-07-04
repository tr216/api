module.exports = function(req, res, callback) {
    passport(req, res, function(result) {
        if (result.success) {
            var member = result.data;

            if (req.method == 'GET') {
                var filter = {};
                filter = {
                    $or: [{
                        owner: member._id
                    }, {
                        "sharedmembers.memberid": member._id
                    }]
                };
                var objectid=req.query._id || '';
                if(objectid!=''){
                    db.locations.findOne(filter, function(err, doc) {
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
                }else{
                    db.locations.find(filter, function(err, doc) {
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
                }
                

            } else if (req.method == 'POST') {
                var data = req.body || {};
                data.createddate = new Date();
                data.modifieddate = new Date();
                data.owner = member._id;

                var newdoc = new db.locations(data);

                newdoc.save(function(err, newdoc2) {
                    if (err) {
                        callback({
                            success: false,
                            error: {
                                code: err.name,
                                message: err.message
                            }
                        });
                    } else {
                        callback({
                            success: true,
                            error: null,
                            data: newdoc2
                        });
                    }
                });

            } else if (req.method == 'PUT') {
                var data = req.body || {};
                data._id = req.query._id || '';
                data.modifieddate = new Date();
                db.locations.findOne({
                    _id: data._id,
                    owner : member._id
                }, function(err, doc) {
                    if (err) {
                        callback({
                            success: false,
                            error: {
                                code: err.name,
                                message: err.message
                            }
                        });
                    } else {
                        if (doc == null) {
                            callback({
                                success: false,
                                error: {
                                    code: 'RECORD_NOT_FOUND',
                                    message: 'Kayit bulunamadi'
                                }
                            });
                            return;
                        }

                        var doc2 = Object.assign(doc, data);

                        var newdoc = new db.locations(doc2);
                        newdoc.save(function(err, newdoc2) {
                            if (err) {
                                callback({
                                    success: false,
                                    error: {
                                        code: err.name,
                                        message: err.message
                                    }
                                });
                            } else {
                                callback({
                                    success: true,
                                    error: null,
                                    data: newdoc2
                                });
                            }
                        });

                    }
                });
            } else if (req.method == 'DELETE') {
                var data = req.body || {};
                data._id = req.query._id || '';
                data.modifieddate = new Date();
                eventLog(data);
                db.locations.remove({
                    _id: data._id,
                    owner : member._id
                }, function(err) {
                    if (err) {
                        callback({
                            success: false,
                            error: {
                                code: err.name,
                                message: err.message
                            }
                        });
                    } else {
                     callback({
                        success: true,
                        error: null
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