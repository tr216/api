var Hashids = require('hashids');

module.exports = function (req, res, callback) {
    var IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    var ref = req.query.ref || req.query.r || '';
    var refnumber;
    var hashids = new Hashids();
    if(ref == '') {
        callback({ success: false, error: { code: 'REFERENCE_ERROR', message: 'Referans hatali' } });
        return;
    }
    refnumber = hashids.decode(ref);
    if(refnumber.length == 0) {
        callback({ success: false, error: { code: 'REFERENCE_ERROR', message: 'Referans hatali' } });
    } else {
        db.members.findOne({ username: refnumber }, function (err, doc) {
            if(err) {
                callback({ success: false, error: { code: err.name, message: err.message } });
                return;
            }
            if(doc == null) {
                callback({ success: false, error: { code: "USER_NOT_FOUND", message: "Uye bulunamadi." } });
                return;
            }
            var data = { username: doc.username, refname: '' };

            if(doc.membertype == 'e') {
                data.refname = doc.employee.name + ' ' + doc.employee.lastname;
            } else {
                data.refname = doc.firm.firmtitle + ' / ' + doc.firm.competentname;
            }
            callback({ success: true, data: data });
        });


    }


}

