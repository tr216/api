var dbModel
var processList=[]
var repeatInterval=50000
var SinifGrubu=require('./uyumsoft/DespatchIntegration.class.js')
var downloadInterval=5000 

var ioBox=(ioType)=>{ return ioType==0?'Outbox':'Inbox'}

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

			iteration(integrators,(item,cb)=>{ syncDespatchList(0,item,cb)},0,true,(err,result)=>{
				if(err)
					errorLog(`e-despatch service ${ioBox(0)}List  error:`,err)
				else
					eventLog(`e-despatch service ${ioBox(0)}List\tok`)

				iteration(integrators,(item,cb)=>{ syncDespatchList(1,item,cb)},0,true,(err,result)=>{
					if(err)
						errorLog(`e-despatch service ${ioBox(1)}List  error:`,err)
					else
						eventLog(`e-despatch service ${ioBox(1)}List\tok`)

					iteration(integrators,(item,cb)=>{ syncDespatches(0,item,cb)},0,true,(err,result)=>{
						if(err)
							errorLog(`e-despatch service ${ioBox(0)}Despatches  error:`,err)
						else
							eventLog(`e-despatch service ${ioBox(0)}Despatches\tok`)

						iteration(integrators,(item,cb)=>{ syncDespatches(1,item,cb)},0,true,(err,result)=>{
							if(err)
								errorLog(`e-despatch service ${ioBox(1)}Despatches  error:`,err)
							else
								eventLog(`e-despatch service ${ioBox(1)}Despatches\tok`)
							
							
							eventLog('e-despatch service finished:',dbModel.dbName)
							setTimeout(calistir,repeatInterval)
						})
					})
				})
			})
			
		}else{
			errorLog('e-despatch service error:',err)
			setTimeout(calistir,repeatInterval)
		}
	})
}

function syncDespatches(ioType,integrator,callback){
	eventLog(`syncDespatches ${ioBox(ioType)} started `)
	dbModel.temp_table.find({docType:`eDespatch_sync${ioBox(ioType)}List`,status:'',docId2:integrator._id},(err,docs)=>{
		if(!err){
			iteration(docs,
			(listItem,cb)=>{ 
				getDespatch(ioType,integrator,listItem,cb)
			},
			downloadInterval,true,
			(err,result)=>{
				callback(err,result)
			})
		}else{
			callback(err)
		}
	})
}

function getDespatch(ioType,integrator,listItem,callback){
	dbModel.despatches.findOne({ioType:ioType, eIntegrator:listItem.docId2,'uuid.value':listItem.docId},(err,doc)=>{
		if(!err){
			if(doc==null){
				
				var GetDespatch=(query,cb)=>{
					if(ioType==0){
						integrator.despatchIntegration.GetOutboxDespatch(query,cb)
					}else{
						integrator.despatchIntegration.GetInboxDespatch(query,cb)
					}
				}
				GetDespatch(listItem.docId,(err,data)=>{
					if(!err){
						fs.writeFileSync(path.join(config.tmpDir,`${ioBox(ioType)}_${listItem.document.despatchNumber}.json`),JSON.stringify(data,null,2),'utf8')
						var newDoc=new dbModel.despatches(data.value.despatchAdvice)
						newDoc.eIntegrator=integrator._id
						newDoc.ioType=ioType
						newDoc.despatchStatus=listItem.document.statusEnum
						if(newDoc.profileId.value=='TEMELSEVKIRSALIYESI')
							newDoc.profileId.value='TEMELIRSALIYE'


						newDoc.save((err,newDoc2)=>{
							if(!err){
								eventLog(`Despatch_${ioBox(ioType)}:${newDoc2.ID.value} indirildi`)
							}
							listItem.status='Downloaded'
							listItem.save((err)=>{
								callback(err)
							})
							
						})
					}else{
						callback(err)
					}
				})
			}else{
				eventLog(`getDespatch ${ioBox(ioType)} ${doc.ID.value} zaten var `)
				if(ioType==0){
					listItem.status='Uploaded'
				}else{
					listItem.status='Downloaded'
				}
				
				listItem.save((err)=>{
					callback(err)
				})
			}
		}else{
			callback(err)
		}
	})
}

function syncDespatchList(ioType,integrator,callback){
	syncDespatchList_queryModel(ioType,integrator,(err,query)=>{
		var GetDespatchList=(query,cb)=>{
			if(ioType==0){
				integrator.despatchIntegration.GetOutboxDespatchList(query,cb)
			}else{
				integrator.despatchIntegration.GetInboxDespatchList(query,cb)
			}
		}

		function indir(cb){
			GetDespatchList(query,(err,data)=>{
				if(!err){
					if(data.value.attr.totalPages==0) 
						return cb(null)
					eventLog(`syncDespatchList ${ioBox(ioType)} page:${data.value.attr.pageIndex+1}/${data.value.attr.totalPages}`)
					if(!Array.isArray(data.value.items)){
						data.value.items=[clone(data.value.items)]
					}
					data.value.items.forEach((e)=>{ e._integratorId=integrator._id })
					iteration(data.value.items,(item,cb)=>{ insertTempTable(ioType,item,cb)},0,false,(err)=>{
						if(!err){
							if(data.value.attr.pageIndex<data.value.attr.totalPages-1){
								query.PageIndex++
								setTimeout(indir,downloadInterval,cb)
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

function syncDespatchList_queryModel(ioType,integrator,cb){
	var query=ioType==0?new SinifGrubu.OutboxDespatchListQueryModel():new SinifGrubu.InboxDespatchListQueryModel()

	
	query.PageIndex=0
	query.PageSize=10
	query.CreateStartDate=defaultStartDate()
	query.CreateEndDate=endDate()

	dbModel.temp_table.find({docType:`eDespatch_sync${ioBox(ioType)}List`}).sort({orderBy:-1}).limit(1).exec((err,docs)=>{
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

function insertTempTable(ioType,item,callback){
	if(item['statusEnum']=='Error')
		return callback(null)
	var filter={
			docType:`eDespatch_sync${ioBox(ioType)}List`,
			docId:item['despatchId'],
			docId2:item['_integratorId']
		}

	dbModel.temp_table.findOne(filter,(err,doc)=>{
		if(err) 
			return callback(err)
		if(doc==null){
			var data={
				docType:`eDespatch_sync${ioBox(ioType)}List`,
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
	
	return (new Date((new Date()).getFullYear(),5,30,0,0,0)).toISOString()
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