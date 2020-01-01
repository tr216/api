/* Pos Device Service | etulia/portal */

var ingenico=require('./ingenico/ingenico.js');

function start(callback){

	var dbIds=[];
	Object.keys(repoDb).forEach((e)=>{
		// dbIds.push({dbId:e,completed:false});
		dbIds.push(e);
	});

	console.log('dbIds.length:',dbIds.length);
	var index=0;
	function indir(cb){
		if(index>=dbIds.length){
			return cb(null);
		}
		mrutil.console('cheking dbId:' + dbIds[index]);
		checkDbAndDownload(dbIds[index],(err)=>{
			console.log('checkDbAndDownload err:',err);
			index++;
			setTimeout(indir,10000,cb);
		});
	}
	indir((err)=>{
		callback(err);
	});
}

// function checkAllTasksCompleted(tasks){
// 	var completed=true;
// 	tasks.forEach((e)=>{
// 		if(!e.completed){
// 			completed=false;
// 			return;
// 		}
// 	});
// 	return completed;
// }


function checkDbAndDownload(dbId,callback){
	repoDb[dbId].pos_device_services.find({url:{$ne:''},passive:false},(err,serviceDocs)=>{
		if(!err){
			var index=0;
			function runService(cb){
				if(index>=serviceDocs.length){
					cb(null);
				}else{
					repoDb[dbId].pos_devices.find({service:serviceDocs[index]._id,passive:false},(err,posDeviceDocs)=>{
						if(!err){
							
							downloadData(repoDb[dbId],serviceDocs[index],posDeviceDocs,(err)=>{
								if(err){
									console.log('Pos Device Service Download error:',err);
									console.log('Pos Device Service Download error service:',serviceDocs[index]);
								}
								index++;
								setTimeout(runService,3000,cb);
							});
						}else{
							index++;
							setTimeout(runService,3000,cb);
							//cb(err);
						}
					});
				}
			}

			runService((err)=>{
				callback(err);
			});

		}else{
			callback(err);
		}
	});
}

function downloadData(dbModel,serviceDoc,posDeviceDocs,cb){
	
	switch(serviceDoc.serviceType){
		case 'ingenico':
			ingenico.download(dbModel,serviceDoc,posDeviceDocs,cb);
		break;
		default:
			cb(null);
		break;
	}
}
//

function scheduler(){
	mrutil.console(('Pos-Device Service Scheduled Task').green + ' started');
	start((err)=>{
		console.log('start err:',err);
		// setTimeout(scheduler,60000*30); //30 dakika arayla check et.
		setTimeout(()=>{
			scheduler();
		},60000*30); //30 dakika arayla check et.
		// },4000*30); //30 dakika arayla check et.
	});
}


setTimeout(()=>{
	scheduler();
 // },60000*30);
 
},10000*1);


exports.zreportDataToString=(serviceType,data)=>{
	switch(serviceType){
		case 'ingenico':
			return ingenico.zreportDataToString(data);
		default:
			return 'ZREPORT DETAIL...';
	}
}