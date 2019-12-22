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

function scheduler(){
	mrutil.console(('E-Invoice Service Scheduled Task').green + ' started');
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
 },3000*1);
 
