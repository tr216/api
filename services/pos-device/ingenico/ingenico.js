var api=require('./api.js');


exports.download=(dbModel,serviceDoc,posDeviceDocs,callback)=>{
	//console.log('Basic ' + Buffer.from('intiba:intibA!2').toString('base64'))
	if(posDeviceDocs.length>0){
		var index=0;

		function zRaporIndir(cb){
			console.log('zRaporIndir ' + (index+1).toString() + '/' + posDeviceDocs.length )
			if(index>=posDeviceDocs.length){
				cb(null);
			}else{
				if(posDeviceDocs[index].deviceSerialNo!=''){
					generateReqOption(dbModel,posDeviceDocs[index],(err,reqOpt)=>{
						if(!err){
							console.log('reqOpt:',reqOpt);
							api.getZReport(serviceDoc,reqOpt,(err,resp)=>{
								if(!err){
									mrutil.log('resp.ZReportItems.length:',resp.ZReportItems.length.toString());
									//mrutil.log('resp.ZReportItems:',resp.ZReportItems);
									//mrutil.log('resp.ZReportItems.length:',resp.ZReportItems.length.toString());
									// index++;
									// setTimeout(zRaporIndir,0,cb);
									insertZReports(dbModel,posDeviceDocs[index],resp.ZReportItems,(err)=>{
										if(!err){
											index++;
											console.log('index++;')
											setTimeout(zRaporIndir,1000,cb);
										}else{
											
											mrutil.errorLog('insertZReports Error:' ,err);
											index++;
											console.log('index++ error;')
											setTimeout(zRaporIndir,1000,cb);
										}
									});
								}else{
									
									mrutil.errorLog('download getZReport Error:' , err);
									if(err.errno!=undefined){
										if(err.errno=='ETIMEDOUT'){
											mrutil.errorLog('download getZReport Error: 30sn sonra yeniden deniyoruz' , {});
											setTimeout(zRaporIndir,30000,cb);
										}else{
											index++;
											mrutil.errorLog('getZReport Error:' ,err);
											setTimeout(zRaporIndir,1000,cb);
											//cb(err);
										}
									}else{
										index++;
										mrutil.errorLog('getZReport Error:' ,err);
										setTimeout(zRaporIndir,1000,cb);
										//cb(err);
									}
									
								}
							});
						}else{
							index++;
							mrutil.errorLog('generateReqOption Error:' , err);
							setTimeout(zRaporIndir,1000,cb);
							//cb(err);
						}
					});
				}else{
					console.log('posDeviceDocs[index].deviceSerialNo==""');
					index++;
					setTimeout(zRaporIndir,1000,cb);
				}
			}
		}
	
		zRaporIndir((err)=>{
			if(!err){
				console.log('ingenico pos device service download completed:',serviceDoc.name,' total device:',posDeviceDocs.length);
			}else{
				mrutil.errorLog('ingenico pos device service download error:' , err);
			}
			callback(err);
		});
	}else{
		console.log('posDeviceDocs.length==0');
		callback(null);
	}
	
	//cb(null);
}

function insertZReports(dbModel,posDeviceDoc,ZReportItems,callback){
	if(ZReportItems.length==0) return callback(null);

	var index=0;
	function dahaOncedenKaydedilmisMi(cb){
		if(index>=ZReportItems.length){
			return cb(null);
		}
		dbModel.pos_device_zreports.countDocuments({posDevice:posDeviceDoc._id,zNo:ZReportItems[index].ZNo},(err,c)=>{
			if(!err){
				
				if(c==0){
					index++;
					setTimeout(dahaOncedenKaydedilmisMi,0,cb);
				}else{
					ZReportItems.splice(index,1);
					setTimeout(dahaOncedenKaydedilmisMi,0,cb);
				}
			}else{
				mrutil.errorLog('dbModel.pos_device_zreports.countDocuments error:' , err);
				cb(err);
			}
		});
	}
	
	dahaOncedenKaydedilmisMi((err)=>{
		if(!err){
			mrutil.log('insertZReports ZReportItems.length:',ZReportItems.length.toString());
			if(ZReportItems.length==0) return callback(null);
			var data=[];
			ZReportItems.forEach((e)=>{
				var d=(new Date(e.ZDate));
				d.setMinutes(d.getMinutes()+(new Date()).getTimezoneOffset()*-1);

				data.push({posDevice:posDeviceDoc._id,data:e,zNo:e.ZNo,zDate:d,zTotal:e.GunlukToplamTutar});

			});
			mrutil.log('insertZReports beforeSort  data.length:',data.length.toString());
			data.sort(function(a,b){
				if(a.zDate>b.zDate) return 1;
				if(a.zDate<b.zDate) return -1;
				return 0;
			});

			mrutil.log('insertZReports  data.length:',data.length.toString());

			dbModel.pos_device_zreports.insertMany(data,{ordered:true},(err,docs)=>{
				if(err){
					mrutil.errorLog('dbModel.pos_device_zreports.insertMany  error:' , err);
				}
				callback(err);
			});
		}else{
			mrutil.errorLog('dahaOncedenKaydedilmisMi error:' , err);
			callback(err);
		}
	});
}


function generateReqOption(dbModel,posDeviceDoc,cb){
	//dbModel.pos_device_zreports.find({posDevice:posDeviceDoc._id},null,{limit:1,sort:{'data.ZDate':-1,'data.ZNo':-1}},(err,docs)=>{
	dbModel.pos_device_zreports.find({posDevice:posDeviceDoc._id}).sort({zDate:-1}).limit(1).exec((err,docs)=>{
		if(!err){
			var reqOptions={ "ReportId": 0, 
				"SerialList": [ posDeviceDoc.deviceSerialNo ], 
				"StartDate": defaultStartDate(), 
				"EndDate": endDate(), 
				"ExternalField": "", 
				"ReceiptNo": 0, 
				"ZNo": 0, 
				"GetSummary":false, 
				"SaleFlags": 0 
			}
			if(docs.length>0){
				var maxZDate=docs[0]['zDate'];
				//maxZDate.setMinutes(maxZDate.getMinutes()+(new Date()).getTimezoneOffset()*-1);
				reqOptions.StartDate=maxZDate.toISOString();
				//reqOptions.ZNo=docs[0]['zNo']+1;
			}

			cb(null,reqOptions);
		}else{
			cb(err);
		}
	});
	
}

function defaultStartDate(){
	
	return (new Date((new Date()).getFullYear(),4,27,0,(new Date()).getTimezoneOffset()*-1,0)).toISOString();
}

// function defaultEndDate(){
	
// 	return (new Date((new Date()).getFullYear(),0,31,23,59+(new Date()).getTimezoneOffset()*-1,59)).toISOString();
// }

function endDate(){
	var a=new Date();
	a.setMinutes(a.getMinutes()+(new Date()).getTimezoneOffset()*-1);
	return a.toISOString();
}


exports.zreportDataToString=(data)=>{
	return 'ZNo:' + data.ZNo + ', Tarih:' + data.ZDate.substr(0,10) + ' ' + data.ZTime + ', Toplam:' + data.GunlukToplamTutar.formatMoney(2,',','.') + ', T.Kdv:' + data.GunlukToplamKDV.formatMoney(2,',','.');
}