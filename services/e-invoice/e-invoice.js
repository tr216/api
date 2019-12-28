/* Pos Device Service | etulia/portal */

var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');

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
		
		checkDbAndDownloadInvoices(dbIds[index],(err)=>{
			
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



function checkDbAndDownloadInvoices(dbId,callback){
	repoDb[dbId].e_integrators.find({url:{$ne:''},passive:false},(err,eIntegratorDocs)=>{
		if(!err){
			var index=0;
			function runService(cb){
				if(index>=eIntegratorDocs.length){
					cb(null);
				}else{
					downloadInvoices(repoDb[dbId],eIntegratorDocs[index],(err)=>{
						if(err){
							console.log('E-Invoice Service Download error:',err);
							console.log('E-Invoice Service Download error service:',eIntegratorDocs[index]);
						}
						index++;
						setTimeout(runService,3000,cb);
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

function downloadInvoices(dbModel,eIntegratorDoc,cb){
	
	switch(eIntegratorDoc.eIntegrator){
		case 'uyumsoft':
			uyumsoft.downloadInvoices(dbModel,eIntegratorDoc,cb);
		break;
		default:
			cb(null);
		break;
	}
}
//
setTimeout(()=>{
	function scheduler(){
		mrutil.console(('E-Invoice Service Scheduled Task').green + ' started');
		start((err)=>{
			if(err){
				mrutil.console(('E-Invoice Service Scheduled Task Error:') + JSON.stringify(err));
			}else{
				mrutil.console(('E-Invoice Service Scheduled Task').blue + ' completed');
			}
			setTimeout(scheduler,60000*30); //30 dakika arayla check et.
		});
	}
	scheduler();
 },60000*30);
 // },3000*1);
 
// setTimeout(()=>{
// 	var api=require('./uyumsoft/api.js');
// 	api.getEInvoiceUsers({url:'https://efatura.uyumsoft.com.tr/Services/Integration',username:'Alitek_WebServis',password:'AyXEZR%k'},{pagination:{pageIndex:1, pageSize:10}},(err,result)=>{
// 		if(!err){
// 			console.log('einvoice user download:',result);
// 		}else{
// 			console.log('einvoice user error:',err);
// 		}
// 	});
//  },100*30);

setTimeout(()=>{
	function downloadEInvoiceUsers(){
		mrutil.console(('E-InvoiceUsers Download Scheduled Task').green + ' started');
		var uyumsoft=require('./uyumsoft/uyumsoft-e-fatura.js');
		uyumsoft.downloadEInvoiceUsers((err)=>{
			if(err){
				mrutil.console(('E-InvoiceUsers Download Scheduled Task Error:') + JSON.stringify(err));
			}else{
				mrutil.console(('E-InvoiceUsers Download Scheduled Task').blue + ' completed');
			}
			setTimeout(downloadEInvoiceUsers,3600*1000*12);
		});
	}
	downloadEInvoiceUsers();
},3600*1000*12)