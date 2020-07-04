/* Pos Device Service | etulia/portal */
var ingenico=require('./ingenico/ingenico.js');

exports.start=(dbModel)=>{
	function calistir(cb){
		eventLog('posDevice_checkDbAndDownload started.',dbModel.dbName);
		try{
			checkDbAndDownload(dbModel,(err)=>{
				if(err){
					errorLog('posDevice_checkDbAndDownload',err);
				}
				eventLog('posDevice_checkDbAndDownload ended.',dbModel.dbName);
				setTimeout(calistir,60000,cb);
			});
		}catch(tryErr){
			setTimeout(calistir,60000,cb);
		}
	}

	setTimeout(()=>{
		eventLog('PosDevice service started: ',dbModel.dbName);
		calistir((err)=>{});
	},12000);
}


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
									eventLog('Pos Device Service Download error:',err);
									eventLog('Pos Device Service Download error service:',serviceDocs[index]);
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
