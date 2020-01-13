module.exports= function (req, res,callback) {

	if(req.method=='GET'){

		var memberid=req.body.memberid || req.query.memberid || '';
		var lastmessageid=req.body.lastmessageid || req.query.lastmessageid || '';
		var pagenum=Number(req.body.pagenum || req.query.pagenum || req.body.pagenumber || req.query.pagenumber || 0);
		var pagesize=Number(req.body.pagesize || req.query.pagesize || 3);
		var aggregation=[];
		var group={};
		var sort={};
		var match={};
		var skip={};
		var limit={};
		var setreadtrue=false; 

		if(memberid!=''){
			match={$match:{memberid:ObjectId(authinfo.data._id) , memberid2:ObjectId(memberid)}};
			aggregation.push(match);
			setreadtrue=true;
		}else{
			match={$match:{memberid:ObjectId(authinfo.data._id)}};
			aggregation.push(match);

			group={$group:{_id:"$memberid2", memberid:{$first:"$memberid"}, memberid2:{$first:"$memberid2"} ,subject:{$last:"$subject"}, body:{$last:"$body"} , senddate:{$last:"$senddate"}, read:{$last:"$read"} }};
			aggregation.push(group);

			sort= {$sort : {senddate:-1}}
			aggregation.push(sort);

			skip = {$skip: (pagesize*pagenum)};

			aggregation.push(skip);

			limit = {$limit:pagesize};
			aggregation.push(limit);
			setreadtrue=false;
		}

		if(lastmessageid!=''){
			eventLog('lastmessageid:' + lastmessageid);
			match.$match._id = {$gt:ObjectId(lastmessageid)};
		}
		eventLog('match:' + JSON.stringify(match));

		db.messages.aggregate(aggregation).exec(function(err,docs){
			if(err){
				callback({success:false, error:{code:err.name,message:err.message}});
				return;
			}
			db.messages.populate(docs,{ path:"memberid2", select:'membertype employee firm mainpicture mainpictureblur showname showpicture profileenabled'},function(err,popdocs){
				if(err){
					callback({success:false, error:{code:err.name,message:err.message}});
					return;
				}
				if(popdocs!=null){
					var index = 0 ;
					var popdocs2=[];
					var image=null;

					function duzenle(callback){
						if(index==popdocs.length){
							callback({success:true, data:popdocs2});
							return;
						}
						var item=popdocs[index];

						index++;
						if(item.memberid2==null){
							setTimeout(duzenle,0,callback);
							return;
						}
						var showname = item.memberid2.showname || false;
						var showpicture = item.memberid2.showpicture || false;
						var profileenabled = item.memberid2.profileenabled || true;

						if(item.memberid2.membertype=='e'){
							if(showname==false){
								item.who =mrutil.nameMask(item.memberid2.employee.name + ' ' + item.memberid2.employee.lastname);
							}else{
								item.who = item.memberid2.employee.name + ' ' + item.memberid2.employee.lastname;
							}

							item.sex = item.memberid2.employee.sex;
						}else{
							if(showname==false){
								item.who =mrutil.nameMask(item.memberid2.firm.firmtitle);
							}else{
								item.who =item.memberid2.firm.firmtitle;
							}
							item.sex ='';
						}

						delete item.memberid2.firm;
						delete item.memberid2.employee;

						if(showpicture==false || profileenabled==false){
							item.memberid2.mainpicture=item.memberid2.mainpictureblur;
						}

						if(item.memberid2.mainpicture!=null){
							db.images.findOne({_id:item.memberid2.mainpicture},function(err,image){
								if(err){
									eventLog('err:' + err.name + '-' + err.message);
								}
								if(image!=null){
											//image=image.image;
											item.image=image.image;
											//eventLog('image:' + image);
											delete item.memberid2.mainpicture;
											delete item.memberid2.mainpictureblur;
											popdocs2.push(item);
											setTimeout(duzenle,0,callback);
										}else{
											item.image=null;
											popdocs2.push(item);
											delete item.memberid2.mainpicture;
											delete item.memberid2.mainpictureblur;
											setTimeout(duzenle,0,callback);
										}
										
									});
						}else{
							item.image=null;
							popdocs2.push(item);
							delete item.memberid2.mainpicture;
							delete item.memberid2.mainpictureblur;
							setTimeout(duzenle,0,callback);
						}

								// if(image==null){
									
								// }else{
								// 	eventLog('image null degil');
								// 	item.image=image;
								// 	popdocs2.push(item);
								// 	delete item.memberid2.mainpicturesmall;
								// 	delete item.memberid2.mainpicturesmallblur;
								// 	setTimeout(duzenle,0,callback);
								// }
							}

							duzenle(function(result){
								if(setreadtrue){
									var oror=[];
									for(var i=0;i<popdocs2.length;i++){
										if(popdocs2[i].read==false){
											oror.push({_id: ObjectId(popdocs2[i]._id)});
										}
										
									}
									if(oror.length>0){
										db.messages.update({$or:oror},{$set:{read:true,readdate:new Date()}}, {multi: true}, function(err,docs){ //okunmamislari read=true yapalim
											if(err){
												eventLog('error:' + err.name + ' - ' + err.message);
											}
											eventLog('update result:' + docs.length);
											var aggregation=[
											{ $match :{ memberid:ObjectId(authinfo._id),read:false}},
											{ $group :{ _id: null,count: { $sum:1}}}
											];
											db.messages.aggregate(aggregation).exec(function(err,docs){  //okunmamis mesaj sayisini gonderiyoruz
												if(err){
													callback(result);
													return;
												}
												if(docs==null){
													callback(result);
												}else{
													if(docs.length>0){
														socket.senddata(memberid,{type:'unreadmessages',data:docs[0].count});
													}
													callback(result);
												}
												
											});
										});
									}else{
										callback(result);
									}
									
								}else{
									callback(result);
								}
								
							});
							
						}else{
							callback({success:true, data:popdocs});
						}
					});

});

}else if(req.method=='POST'){
	var memberid=req.body.memberid || req.query.memberid || '';
	var subject=req.body.subject || req.query.subject || '';
	var body=req.body.body || req.query.body || '';
	var message1=new db.messages({
		messagetype:'normal',
		connmessageid: '',
		memberid: authinfo.data._id,
		memberid2: memberid,
		iotype: 0,
		subject: subject,
		body: body,
		senddate: new Date(),
		read : true,
		readdate: new Date(), 
		deleted: false,
		deleteddate: new Date()
	});

	message1.save(function(err,newdoc){
		if(err){
			callback({success:false, error:{code:err.name,message:err.message}});
			return;
		}
		var message2=new db.messages({
			messagetype: newdoc.messagetype,
			connmessageid: newdoc._id.toString(),
			memberid: memberid,
			memberid2: authinfo.data._id,
			iotype: 1,
			subject: subject,
			body: body,
			senddate: newdoc.senddate,
			read : false,
			readdate: newdoc.readdate, 
			deleted: false,
			deleteddate: newdoc.deleteddate
		});
		message2.save(function(err,newdoc2){
			if(err){
				callback({success:false, error:{code:err.name,message:err.message}});
				return;
			}


			var aggregation=[
			{ $match :{ memberid:ObjectId(memberid),read:false}},
			{ $group :{ _id: null,count: { $sum:1}}}
			];
						db.messages.aggregate(aggregation).exec(function(err,docs){  //okunmamis mesaj sayisini gonderiyoruz
							if(err){
								callback({success:false, error:{code:err.name,message:err.message}});
								return;
							}
							if(docs==null){
								callback({success:true, data:newdoc});
							}else{
								if(docs.length>0){

									socket.senddata(memberid,{type:'unreadmessages',data:docs[0].count});
								}
								callback({success:true, data:newdoc});
							}
							
						});
						
					});
	});

}else if(req.method=='DELETE'){
	var memberid=req.body.memberid || req.query.memberid || '';
	if(memberid==''){
		callback({success:false, error:{code: 'ERROR' ,message: 'memberid required'}});
	}else{
		db.messages.update({memberid:authinfo.data._id,memberid2:memberid},{$set:{deleted:true,deleteddate:new Date()}},function(err){
			if(err){
				callback({success:false, error:{code:err.name,message:err.message}});
				return;
			}
			callback({success:true});
		});
	}

}else{
	callback({success:false, error:{code: 'WRONG_METHOD' ,message: 'Wrong method'}});
}
}
