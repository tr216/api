module.exports = function(req, res, callback) {
	var p = req.body.p || req.query.p || '';
	if (p != 'Tx5634gh!x') {
		callback({
			success: false,
			error: {
				code: 'AUTH_ERROR',
				message: 'Yetki hatasi'
			}
		});
	} else {
		var apikey = "AIzaSyCP-ydtaK5n-aVLyoPBVZD6UdJGHgZMY24"; //google maps api key
		//'http://maps.google.com/maps/api/js?sensor=true';
		callback({
			success: true,
			data: 'https://maps.googleapis.com/maps/api/js?key=' + apikey
		});
		// callback({success:true, data:'http://maps.google.com/maps/api/js?sensor=true'});
	}
}