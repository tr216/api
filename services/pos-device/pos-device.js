/* Pos Device Service | etulia/portal */

var ingenico=require('./ingenico/ingenico.js');

exports.run=function(dbModel){
	function calistir(cb){
		console.log('posDevice_checkDbAndDownload started.',dbModel.dbName);
		checkDbAndDownload(dbModel,(err)=>{
			if(err){
				console.error('posDevice_checkDbAndDownload',err);
			}
			console.log('posDevice_checkDbAndDownload ended.',dbModel.dbName);
			setTimeout(calistir,60000,cb);
		});
	}

	setTimeout(()=>{
		console.log('PosDevice service started: ',dbModel.dbName);
		calistir((err)=>{});
	},12000);
}

// setTimeout(()=>{
// 	console.log(('Pos-Device Service Scheduled Task').green + ' started');
// 	Object.keys(repoDb).forEach((e)=>{
// 		repoDb[e].posDevice_checkDbAndDownload=function(){
// 			console.log('posDevice_checkDbAndDownload started.',e);
// 			checkDbAndDownload(this,(err)=>{
// 				console.log('posDevice_checkDbAndDownload ended.',e);
// 				setTimeout(repoDb[e].posDevice_checkDbAndDownload,10000);
// 			});
// 		}
// 		repoDb[e].posDevice_checkDbAndDownload();
// 	});

// },10000*1);


function checkDbAndDownload(dbModel,callback){

	if(dbModel.pos_device_services==undefined) return callback(null);
	
	dbModel.pos_device_services.find({url:{$ne:''},passive:false},(err,serviceDocs)=>{
		if(!err){
			var index=0;
			function runService(cb){
				if(index>=serviceDocs.length){
					cb(null);
				}else{
					dbModel.pos_devices.find({service:serviceDocs[index]._id,passive:false},(err,posDeviceDocs)=>{
						if(!err){
							
							downloadData(dbModel,serviceDocs[index],posDeviceDocs,(err)=>{
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



exports.zreportDataToString=(serviceType,data)=>{
	switch(serviceType){
		case 'ingenico':
			return ingenico.zreportDataToString(data);
		default:
			return 'ZREPORT DETAIL...';
	}
}