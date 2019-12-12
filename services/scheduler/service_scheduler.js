
var mrutil = require('./mrutil.js');
var util = require('util');
var uuid = require('node-uuid');

var dbHelper = require('./dbhelper_mysql.js');

var mutabakatemail = require('./mutabakatemail.js');
var rapormailigonder = require('./rapormailigonder.js');


var isCheking=false;
exports.start=function(){
	setInterval(function () {
		mrutil.console('[Scheduler] Scheduler check started');
		if(isCheking){
			mrutil.console('[Scheduler] Scheduler checking continue.');
			return;
		}
		isCheking=true;

		checkScheduler(function(result){
			isCheking=false;
			if(!result.success){
				mrutil.console('[Scheduler] Scheduler finished with error:' + JSON.stringify(result)); //.error.code + ' - ' + result.error.message);
			}else{
				mrutil.console('[Scheduler] Scheduler finished successfully');
			}
		});
	    //mrutil.console('Scheduler checked.');
	}, 10000);
}

//var temp20160831=false;

function checkScheduler(callback) {
	try {
		dbHelper.query("SELECT * FROM schedulertask_reconciliation WHERE Active=1 ORDER BY SchedulerDay,SchedulerHour,SchedulerMinute",null,function(result){
			if(!result.success){
				callback({success:false, error:result.error});
			}else{
				mrutil.console('[Scheduler] total active task count:' + result.data.rows.length);
				if(result.data.rows.length==0){
					callback({success:false, error:{code:'ERROR',message:'There is no active scheduler job'}});
				}else{
					var bFound=false;
					for(var i=0;i<result.data.rows.length;i++){
						var now_day=(new Date()).getDate();
						var now_hour=(new Date()).getHours();
						var now_minute=(new Date()).getMinutes();
						var ayardakika=Number(result.data.rows[i]["SchedulerHour"]) * 60 + Number(result.data.rows[i]["SchedulerMinute"]);
						var suandakika=now_hour * 60 + now_minute;



						if(bFound==false && result.data.rows[i]["SchedulerDay"]==now_day && suandakika>=ayardakika && suandakika<=(ayardakika+30)){
							mrutil.console('[Scheduler] task found. Scheduler task detail: {Day=' + result.data.rows[i]["SchedulerDay"] + ', Hour=' + result.data.rows[i]["SchedulerHour"]  + ', Minute=' + result.data.rows[i]["SchedulerMinute"] + '}');
							bFound=true;


							// if(temp20160831==false){
							// 	temp20160831=true;
							// 	runScheduler(function(result){
							// 		callback(result);
							// 	});
							// }else{
							// 	callback({success:true, error:null});
							// }
							dbHelper.query("SELECT COUNT(*) as total_rows FROM `history_mailsending` WHERE `Deleted`=0 AND `MailType`=0 AND `bError`=0 AND `SendTime`>=CURDATE() AND  (HOUR(CURTIME()) * 60 + MINUTE(CURTIME())) BETWEEN (HOUR(`SendTime`) * 60 + MINUTE(`SendTime`) ) and (HOUR(`SendTime`) * 60 + MINUTE(`SendTime`)+30) ",null,function(result){
								if(!result.success){
									callback({success:false, error:result.error});
								}else{
									var bStartJob=false;
									if(result.data.rows[0]["total_rows"]==0){
										bStartJob=true;
									}else{
										bStartJob=false;
									}

									if(bStartJob){
										runScheduler(function(result){
											callback(result);
										});

									}else{
										callback({success:true, error:null});
									}

								}
							});
							break;
						}else{
							/* last scheduler item */
							if(i==result.data.rows.length-1){
								sendReportMail(result.data.rows[i]["SchedulerDay"],result.data.rows[i]["SchedulerHour"],result.data.rows[i]["SchedulerMinute"],function(result){
									if(result.success){
										mrutil.console('[Scheduler] Reconciliation report was sent successfully.');
									}else{
										mrutil.console('[Scheduler] Reconciliation report was not successful. Error:' + result.error.message);
									}
								});
							}
						}


					}
					if(!bFound){
						mrutil.console('[Scheduler] Task could not be found for starting.');
						callback({success:true, error:null});
					}
				}
			}
		});
	} catch ( err ) {
	    
	    callback({success:false, error:{code:'ERROR',message:err}});
	}
}

function runScheduler(callback){
	mrutil.console('Scheduler running....');
	mrutil.console('Scheduler calisti hobaaaa....');
	//callback({success:true,error:null});
	sendmail(function(result){
		mrutil.console('Scheduler finished.');
		callback(result);

	});
	
}

function sendmail(callback){

	var periodYear=(new Date()).getFullYear();
	var periodMonth=(new Date()).getMonth();
	var temp1 = new Date(periodYear , periodMonth,0);
	var periodstart = new Date(temp1.getFullYear(),temp1.getMonth(),1);
	var sqlparams={period:(new Date(periodYear , periodMonth,0)).yyyymmdd() , periodstart: periodstart.yyyymmdd() };

	var sql="SELECT `firms`.`FirmID`,`firms`.`DBCode` " + 
	" ,`firms`.`FirmIntCode`,`firms`.`FirmCode`,`firms`.`FirmName`,`firms`.`Competent`,`firms`.`TaxOffice`,`firms`.`TaxNumber`,`firms`.`IsEInvoiceMember`, `firms`.`IsForeing`,`firms`.`Email`,`firms`.`Email2` " + 
	" ,`firms`.`InMutabakatList`,`firms`.`InAnnouncementList`,`firms`.`MailLanguage`,`firms`.`Tel1`,`firms`.`Tel2`,`firms`.`Fax`,`firms`.`IsDeleted` " + 
	" ,IFNULL(`firms_balance`.`ID`,0) as `ID` ,IFNULL(`firms_balance`.`Period`,:period) as `Period`,`firms_balance`.`Curr`,`firms_balance`.`TotalDebit`,`firms_balance`.`TotalCredit`,`firms_balance`.`Balance`,`firms_balance`.`BSBalance`,`firms_balance`.`BSInvoiceCount`, " + 
	" `firms_balance`.`BABalance`,`firms_balance`.`BAInvoiceCount`,IFNULL(`firms_balance`.`MailUUIDCode`,'') as `MailUUIDCode`,IFNULL(`firms_balance`.`MailCount`,0) as `MailCount`, " + 
	" `firms_balance`.`SendTime`,`firms_balance`.`MailClickTime`,`firms_balance`.`ReconciliationTime`, " + 
	" `firms_balance`.`ReconciliationReason` " + 
	" ,IFNULL(`firms_balance`.`MailStatus`,0) as `MailStatus`,IFNULL(`firms_balance`.`ReconciliationResult`,0) as `ReconciliationResult` " + 
	" ,CASE IFNULL(`firms_balance`.`MailStatus`,0) WHEN 0 THEN 'GITMEDI' WHEN 1 THEN 'GONDERILDI' WHEN 2 THEN 'TIKLANDI' ELSE '---' END as `MailStatusDescription` " + 
	" ,CASE IFNULL(`firms_balance`.`ReconciliationResult`,0) WHEN 0 THEN 'ONAYSIZ' WHEN 1 THEN 'ONAYLANDI' WHEN 2 THEN 'REDDEDILDI' ELSE '---' END as `ReconciliationResultDescription` " + 
	" FROM `firms` LEFT OUTER JOIN  " + 
	" `firms_balance` ON `firms`.`FirmID` = `firms_balance`.`FirmID` and `firms_balance`.`Period`= :period " + 
	" WHERE `firms`.`Email`<>'' AND IFNULL(`firms_balance`.`Curr`,'')<>'' AND `firms`.`InMutabakatList`=1 AND IFNULL(`firms_balance`.`ReconciliationResult`,0)=0 " +
	" AND (ABS(`firms_balance`.`Balance`)>=5) " +
	" ORDER BY `firms`.`FirmID` " ;

// AND IFNULL(`firms_balance`.`MailStatus`,0)<>2
	dbHelper.query(sql,sqlparams,function(result){
		if(!result.success){
			callback(result);
		}else{
			if(result.data.rows.length>0){
				mrutil.console('[Scheduler] ' + result.data.rows.length + ' record(s) was found.');
				var rowIndex=0;
				var sqlResult=result.data.rows;

				function mailGonderelimAbicim(callback){
					if(rowIndex>sqlResult.length-1){
						callback({success:true,error:null});
						return;
					}

					var formdata=sqlResult[rowIndex];
					rowIndex++;
					mutabakatemail.sendMutabakatMail(formdata,0,function(res){
						if(res.success==false){
							console.log("Mail gonderim hata:" + res.error.message);
						}

						setTimeout(mailGonderelimAbicim,10,callback);
					});
				}

				mailGonderelimAbicim(function(result){
					callback(result);
				});
				
			}else{
				callback(result);
			}

		}

	});
}


function sendReportMail(SchedulerDay,SchedulerHour,SchedulerMinute, callback){
	var now_day=(new Date()).getDate();
	var now_hour=(new Date()).getHours();
	var now_minute=(new Date()).getMinutes();
	var ayardakika=Number(SchedulerHour) * 60 + Number(SchedulerMinute);
	var suandakika=now_hour * 60 + now_minute;


	mrutil.getParameters(function(optionParameters){
		if(optionParameters==null){
			callback({success:false,error:{code:'PARAMETER_NOT_FOUND',message:'Parameter not found!'}});
		}else{
			var LastSent=(new Date(1900,1,1,0,0,0)).yyyymmdd();
			if(optionParameters.SCHEDULERREPORT_LASTSENT!=undefined){
				LastSent=optionParameters.SCHEDULERREPORT_LASTSENT;
			}
			if(Number(optionParameters.SCHEDULERREPORT_AFTERDAY)>0 && optionParameters.SCHEDULERREPORT_MAILTO!=''){
				if(Number(SchedulerDay)+Number(optionParameters.SCHEDULERREPORT_AFTERDAY)==now_day && ((new Date(LastSent)).getDate()<now_day || LastSent==(new Date(1900,1,1,0,0,0)).yyyymmdd() ) && suandakika>=ayardakika && suandakika<=(ayardakika+30)){
					mrutil.console('[Scheduler] Report mail is sending now...');
					rapormailigonder.sendRepotMail(optionParameters.SCHEDULERREPORT_MAILTO,function(result){
						if(result.success){
							var params={lastsent: (new Date()).yyyymmddhhmmss()};
							var sql ="INSERT INTO parameters (ParamName,ParamValue) VALUES('SCHEDULERREPORT_LASTSENT', :lastsent) ON DUPLICATE KEY UPDATE ParamValue=VALUES(ParamValue);";
							dbHelper.query(sql,params,function(result){
								mrutil.console('[Scheduler] Report mail was sent successfully.');
								callback(result);
							});
						}else{
							mrutil.console('[Scheduler] Report mail was not successful. Error:' + result.error.message);
							callback(result);
						}
						
					});
					
				}			
			}
		}
	});
}

