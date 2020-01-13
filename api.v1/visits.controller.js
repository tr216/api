module.exports = function(req, res, callback) {
	if (req.method == 'GET') {

		//var memberid=req.body.memberid || req.query.memberid || '';
		var pagenum = Number(req.body.pagenum || req.query.pagenum || req.body.pagenumber || req.query.pagenumber || 0);
		var pagesize = Number(req.body.pagesize || req.query.pagesize || 3);
		var aggregation = [];
		var group = {};
		var sort = {};
		var match = {};
		var skip = {};
		var limit = {};

		match = {
			$match: {
				memberid2: ObjectId(authinfo.data._id)
			}
		};
		aggregation.push(match);

		group = {
			$group: {
				_id: "$memberid",
				memberid: {
					$last: "$memberid"
				},
				memberid2: {
					$first: "$memberid2"
				},
				visitdate: {
					$last: "$visitdate"
				},
				seendate: {
					$last: "$seendate"
				},
				seen: {
					$last: "$seen"
				}
			}
		};
		aggregation.push(group);

		sort = {
			$sort: {
				seendate: -1
			}
		}
		aggregation.push(sort);

		skip = {
			$skip: (pagesize * pagenum)
		};

		aggregation.push(skip);

		limit = {
			$limit: pagesize
		};
		aggregation.push(limit);



		db.visits.aggregate(aggregation).exec(function(err, docs) {
			if (err) {
				callback({
					success: false,
					error: {
						code: err.name,
						message: err.message
					}
				});
				return;
			}
			db.visits.populate(docs, {
				path: "memberid",
				select: 'membertype employee firm mainpicturesmall mainpicturesmallblur showname showpicture profileenabled'
			}, function(err, popdocs) {
				if (err) {
					callback({
						success: false,
						error: {
							code: err.name,
							message: err.message
						}
					});
					return;
				}
				if (popdocs != null) {
					var index = 0;
					var popdocs2 = [];
					var image = null;

					function duzenle(callback) {
						if (index == popdocs.length) {
							callback({
								success: true,
								data: popdocs2
							});
							return;
						}
						var item = popdocs[index];

						index++;
						if (item.memberid == null) {
							callback({
								success: false,
								error: "ERROR",
								data: "memberid Null"
							});
							return;
						}
						var showname = item.memberid.showname || false;
						var showpicture = item.memberid.showpicture || true;
						var profileenabled = item.memberid.profileenabled || true;

						if (item.memberid.membertype == 'e') {
							if (showname == false) {
								item.who = mrutil.nameMask(item.memberid.employee.name + ' ' + item.memberid.employee.lastname);
							} else {
								item.who = item.memberid.employee.name + ' ' + item.memberid.employee.lastname;
							}

							item.sex = item.memberid.employee.sex;
						} else {
							if (showname == false) {
								item.who = mrutil.nameMask(item.memberid.firm.firmtitle);
							} else {
								item.who = item.memberid.firm.firmtitle;
							}
							item.sex = '';
						}

						delete item.memberid.firm;
						delete item.memberid.employee;

						if (image == null) {
							if (showpicture == false || profileenabled == false) {
								item.memberid.mainpicturesmall = item.memberid.mainpicturesmallblur;
							}

							if (item.memberid.mainpicturesmall != null) {
								db.smallimages.findOne({
									_id: item.memberid.mainpicturesmall
								}, function(err, image) {
									if (err) {
										errorLog('err:' + err.name + '-' + err.message);
									}
									image = image.image;
									item.image = image.image;
									//eventLog('image:' + image);
									delete item.memberid.mainpicturesmall;
									delete item.memberid.mainpicturesmallblur;
									popdocs2.push(item);
									setTimeout(duzenle, 0, callback);
								});
							} else {
								item.image = null;
								popdocs2.push(item);
								delete item.memberid.mainpicturesmall;
								delete item.memberid.mainpicturesmallblur;
								setTimeout(duzenle, 0, callback);
							}
						} else {

							item.image = image;
							popdocs2.push(item);
							delete item.memberid.mainpicturesmall;
							delete item.memberid.mainpicturesmallblur;
							setTimeout(duzenle, 0, callback);
						}
					}

					duzenle(function(result) {

						db.visits.update({
							memberid2: authinfo._id,
							seen: false
						}, {
							$set: {
								seen: true,
								seendate: new Date()
							}
						}, {
							multi: true
						}, function(err, docs) { //okunmamislari read=true yapalim
							if (err) {
								errorLog(__filename,err);
							}
							socket.senddata(authinfo._id, {
								type: 'visitors',
								data: 0
							});
							callback(result);

						});



					});

				} else {
					callback({
						success: true,
						data: popdocs
					});
				}
			});

		});

	} else {
		callback({
			success: false,
			error: {
				code: 'WRONG_METHOD',
				message: 'Wrong method'
			}
		});
	}
}