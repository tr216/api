module.exports= function (req, res,callback) {
	if(req.method=='POST'){
		var memberid=req.body.memberid || req.query.memberid || '';
		var username=req.body.username || req.query.username || '';
		if(memberid==''){
			callback({success:false, error:{code: 'ERROR' ,message: 'memberid bos olamaz!'}});
			return;
		}
		if(username==''){
			callback({success:false, error:{code: 'ERROR' ,message: 'username bos olamaz!'}});
			return;
		}
		var ref=new db.references({
			memberid:ObjectId(memberid),
			memberid2 : null,
			username : username,
			refdate : new Date()
		});

		ref.save(function(err,doc){
			if(err){
				callback({success:false, error:{code: err.name ,message: err.message}});
				return;
			}
			callback({success:true});
		});
		

	}else{
		callback({success:false, error:{code: 'WRONG_METHOD' ,message: 'Wrong method'}});
	}
}
