
exports.newTask=(taskdata,cb)=>{
	baskaCalisanTaskVarmi(taskdata,(err,bFound,doc)=>{
		if(!err){
			if(bFound){
				cb(null,doc);
			}else{
				var newDoc=new db.tasks(taskdata);
				newDoc.status='pending';
				newDoc.save((err,newDoc2)=>{
					cb(err,newDoc2);
				});
			}
		}else{
			cb(err);
		}
	});
	
}

exports.setRunning=(taskDoc,cb)=>{
	taskDoc.status='running';
	taskDoc.startDate=new Date();
	taskDoc.endDate=new Date();
	taskDoc.save((err)=>{
		if(cb) cb(err);
	});
}

exports.setCompleted=(taskDoc,cb)=>{
	taskDoc.status='completed';
	taskDoc.endDate=new Date();
	taskDoc.save((err)=>{
		if(cb) cb(err);
	});
	
}

exports.setCancelled=(taskDoc,cb)=>{
	taskDoc.status='cancelled';
	taskDoc.endDate=new Date();
	taskDoc.save((err)=>{
		if(cb) cb(err);
	});
}

exports.setPending=(taskDoc,cb)=>{
	taskDoc.status='pending';
	taskDoc.endDate=new Date();
	taskDoc.attemptCount++;
	taskDoc.save((err)=>{
		if(cb) cb(err);
	});
}

exports.setError=(taskDoc,error,cb)=>{
	taskDoc.status='error';
	console.log('setError:',error);
	taskDoc.endDate=new Date();
	if(error){
		if(Array.isArray(error)){
			error.forEach((e)=>{
				taskDoc.error.push(e);
			});
		}else{
			console.log('taskDoc.error.push(error):',error);
			taskDoc.error.push(error);
		}
	}
	taskDoc.save((err)=>{
		if(cb) cb(err);
	});
}

function baskaCalisanTaskVarmi(taskdata,cb){
	var filter={status:{$in:['running','pending']}};
	if(taskdata.documentId!=undefined){
		filter['documentId']=taskdata.documentId;
		if(taskdata.collectionName!=undefined){
			filter['collectionName']=taskdata.collectionName;
			filter['taskType']=taskdata.taskType;
			db.tasks.findOne(filter,(err,doc)=>{
				if(!err){
					if(doc!=null){
						cb(null,true,doc);
					}else{
						cb(null,false);
					}
				}else{
					cb(err);
				}
			})
		}else{
			cb(null,false);
		}
	}else{
		cb(null,false);
	}
	
}



// askDoc.bulkWrite([
// 		{
// 			updateOne:{
// 				filter:{_id:_id},
// 				update: { $set:{status:'cancelled'}} 
// 			}
// 		}
// 	],(err,n)=>{ if(cb) cb(err); });
// 	