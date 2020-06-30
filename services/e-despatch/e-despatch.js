var dbModel
var processList=[]
var repeatInterval=50000
var SinifGrubu=require('./uyumsoft/DespatchIntegration.class.js')

function calistir(){
	eventLog('e-despatch service started:',dbModel.dbName)

	dbModel.integrators.find({passive:false},(err,docs)=>{
		if(!err){
			var integrators=[]
			docs.forEach((e)=>{
				var itg=e.toJSON()
				itg['despatchIntegration']=new SinifGrubu.DespatchIntegration(itg.despatch.url,itg.despatch.username,itg.despatch.password)
				integrators.push(itg)
			})

			iteration(integrators,syncInboxList,0,true,(err,result)=>{
				if(err)
					errorLog('e-despatch service error:',err)
				
				iteration(integrators,syncInbox,0,true,(err,result)=>{
					if(err)
						errorLog('e-despatch service error:',err)
					if(result)
						eventLog('e-despatch service finished:',dbModel.dbName)
					setTimeout(calistir,repeatInterval)
				})
			})
			
		}else{
			errorLog('e-despatch service error:',err)
			setTimeout(calistir,repeatInterval)
		}
	})
}

function syncInbox(integrator,callback){
	dbModel.temp_table.find({docType:'eDespatch_syncInboxList',status:'',docId2:integrator._id},(err,docs)=>{
		if(!err){
			iteration(docs,
			(listItem,cb)=>{ 
				syncInbox_getInboxDespatch(integrator,listItem,cb)
			},
			5000,true,
			(err,result)=>{
				callback(err,result)
			})
		}else{
			callback(err)
		}
	})
}

function syncInbox_getInboxDespatch(integrator,listItem,callback){
	dbModel.despatches.findOne({eIntegrator:listItem.docId2,'uuid.value':listItem.docId},(err,doc)=>{
		if(!err){
			if(doc==null){
				integrator.despatchIntegration.GetInboxDespatch(listItem.docId,(err,data)=>{
					if(!err){
						fs.writeFileSync(path.join(config.tmpDir,`inbox_${listItem.document.despatchNumber}.json`),JSON.stringify(data,null,2),'utf8')
						var newDoc=new dbModel.despatches(data.value.despatchAdvice)
						newDoc.eIntegrator=integrator._id
						newDoc.ioType=1
						newDoc.despatchStatus=listItem.document.statusEnum
						

						newDoc.save((err,newDoc2)=>{
							if(!err){
								eventLog(`Despatch:${newDoc2.ID.value} indirildi`)
							}
							callback(err)
						})
					}else{
						callback(err)
					}
				})
			}else{
				callback(null)
			}
		}else{
			callback(err)
		}
	})
}

function syncInboxList(integrator,callback){
	syncInboxList_queryModel(integrator,(err,query)=>{

		function indir(cb){
			
			integrator.despatchIntegration.GetInboxDespatchList(query,(err,data)=>{
				if(!err){
					if(data.value.attr.totalPages==0) 
						return cb(null)
					console.log(`syncInboxList page:${data.value.attr.pageIndex+1}/${data.value.attr.totalPages}`)
					if(typeof data.value.Items=='object'){
						data.value.Items=[clone(data.value.Items)]
					}
					data.value.items.forEach((e)=>{ e._integratorId=integrator._id })
					iteration(data.value.items,insertTempTable,0,false,(err)=>{
						if(!err){
							if(data.value.attr.pageIndex<data.value.attr.totalPages-1){
								query.PageIndex++
								setTimeout(indir,5000,cb)
							}else{
								cb(null)
							}
							
						}else{
							cb(err)
						}
					})
				}else{
					cb(err)
				}
			})
		}

		indir((err)=>{
			callback(err)
		})
		
	})
	
}

function syncInboxList_queryModel(integrator,cb){
	var query=new SinifGrubu.InboxDespatchListQueryModel()
	query.PageIndex=0
	query.PageSize=10
	query.CreateStartDate=defaultStartDate()
	query.CreateEndDate=endDate()

	dbModel.temp_table.find({docType:'eDespatch_syncInboxList'}).sort({orderBy:-1}).limit(1).exec((err,docs)=>{
		if(!err){
			if(docs.length>0){
				var tarih=new Date(docs[0].document['createDateUtc'])
				tarih.setMinutes(tarih.getMinutes()+(new Date()).getTimezoneOffset()*-1)
				query.CreateStartDate=tarih.toISOString()

				cb(null,query)
			}else{
				cb(null,query)
			}
		}else{
			cb(err,query)
		}
	})
}

function insertTempTable(item,callback){
	var filter={
			docType:'eDespatch_syncInboxList',
			docId:item['despatchId'],
			docId2:item['_integratorId']
		}

	dbModel.temp_table.findOne(filter,(err,doc)=>{
		if(err) 
			return callback(err)
		if(doc==null){
			var data={
				docType:'eDespatch_syncInboxList',
				docId:item['despatchId'],
				docId2:item['_integratorId'],
				document:item,
				status:'',
				orderBy:item['createDateUtc']
			}
			
			doc=new dbModel.temp_table(data)
			doc.save((err)=>{
				callback(err)
			})
		}else{
			if(doc.document['statusEnum']!=item['statusEnum']){
				doc.status='modified'
				doc.document=item
				doc.modifiedDate=new Date()

				doc.save((err)=>{
					callback(err)
				})
			}else{
				callback(null)
			}
		}
	})
}


function defaultStartDate(){
	
	return (new Date((new Date()).getFullYear(),5,27,0,(new Date()).getTimezoneOffset()*-1,0)).toISOString()
}

// function defaultEndDate(){
	
// 	return (new Date((new Date()).getFullYear(),0,31,23,59+(new Date()).getTimezoneOffset()*-1,59)).toISOString()
// }

function endDate(){
	var a=new Date()
	a.setMinutes(a.getMinutes()+(new Date()).getTimezoneOffset()*-1)
	return a.toISOString()
}


exports.run=(userDbConn)=>{
	dbModel=userDbConn
	calistir()
}