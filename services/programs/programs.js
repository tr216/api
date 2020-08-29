exports.run=(dbModel, programDoc, data, cb)=>{
	console.log(`programDoc.type:`,programDoc.type)
	switch(programDoc.type){
		case 'file-importer':
		fileImporter(dbModel,programDoc,data,cb)
		break
		case 'file-exporter':
		fileExporter(dbModel,programDoc,data,cb)
		break
		case 'connector-importer':
		connectorImporter(dbModel,programDoc,data,cb)
		break
		case 'connector-exporter':
		connectorExporter(dbModel,programDoc,data,cb)
		break
		case 'email':
		emailSender(dbModel,programDoc,data,cb)
		break
		case 'sms':
			cb(null,data) //qwerty
			break
			default:
			cb({code:'WRONG_PARAMETER',message:'Yanlis program parametresi'})
			break
		}
		
	}

	function fileImporter(dbModel,programDoc,data,cb){
		if(programDoc.collections.length==0)
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		if(programDoc.collections[0].name=='')
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})

		data=dataDuzelt(data)

		util.renderFiles(programDoc.files,data,(err,renderedCode)=>{
			if(!err){
				runRendered(renderedCode,(err,veri)=>{
					if(!err){
						var dizi=[]
						if(!Array.isArray(veri)){
							dizi.push(veri)
						}else{
							dizi=veri
						}
						dizi.forEach((e)=>{
							if(e.collection==undefined)
								e.collection=programDoc.collections[0].name
						})
						insertUpdateCollection(dbModel,dizi,cb)
					}else{
						cb(err)
					}
				})
			}else{
				cb(err)
			}
		})
	}

	function emailSender(dbModel,programDoc,data,cb){
		if(programDoc.collections.length==0)
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		if(programDoc.collections[0].name=='')
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		
		var data2=dataDuzelt(data)
		var collection=clone(programDoc.collections[0])

		if((collection.filter || '').trim()!=''){
			if(!(collection.filter.trim().substr(0,1)=='{' && collection.filter.trim().substr(-1,1)=='}')){
				collection.filter='{' + collection.filter + '}'
			}
			try{
				collection.filter=JSON.parse(collection.filter)
			}catch(tryErr){	}
		}

		if((collection.updateExpression || '').trim()!=''){
			if(!(collection.updateExpression.trim().substr(0,1)=='{' && collection.updateExpression.trim().substr(-1,1)=='}')){
				collection.updateExpression='{' + collection.updateExpression + '}'
			}
			try{
				collection.updateExpression=JSON.parse(collection.updateExpression)
			}catch(tryErr){	}
		}

		if((collection.updateErrorExpression || '').trim()!=''){
			if(!(collection.updateErrorExpression.trim().substr(0,1)=='{' && collection.updateErrorExpression.trim().substr(-1,1)=='}')){
				collection.updateErrorExpression='{' + collection.updateErrorExpression + '}'
			}
			try{
				collection.updateErrorExpression=JSON.parse(collection.updateErrorExpression)
			}catch(tryErr){	}
		}

		getSelectedDataFromCollection(dbModel,collection,data2,(err,docs)=>{
			if(!err){
				util.renderFiles(programDoc.files,docs,(err,renderedCode)=>{
					if(!err){
						runRendered(renderedCode,(err,veri)=>{
							if(!err){
								var dizi=[]
								if(!Array.isArray(veri)){
									dizi.push(veri)
								}else{
									dizi=veri
								}
								dizi.forEach((e)=>{
									if(e.from==undefined)
										e.from=programDoc.emailSender.from
								})
							cb(null,'mail sent') //qwerty
						}else{
							cb(err)
						}
					})
					}else{
						cb(err)
					}
				})
			}else{
				cb(err)
			}
		})
	}

	function connectorExporter(dbModel,programDoc,data,cb){
		if(programDoc.collections.length==0)
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		if(programDoc.collections[0].name=='')
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		
		var data2=dataDuzelt(data)

		var collection=clone(programDoc.collections[0])

		if((collection.filter || '').trim()!=''){
			if(!(collection.filter.trim().substr(0,1)=='{' && collection.filter.trim().substr(-1,1)=='}')){
				collection.filter='{' + collection.filter + '}'
			}
			try{
				collection.filter=JSON.parse(collection.filter)
			}catch(tryErr){	}
		}

		if((collection.updateExpression || '').trim()!=''){
			if(!(collection.updateExpression.trim().substr(0,1)=='{' && collection.updateExpression.trim().substr(-1,1)=='}')){
				collection.updateExpression='{' + collection.updateExpression + '}'
			}
			try{
				collection.updateExpression=JSON.parse(collection.updateExpression)
			}catch(tryErr){	}
		}

		if((collection.updateErrorExpression || '').trim()!=''){
			if(!(collection.updateErrorExpression.trim().substr(0,1)=='{' && collection.updateErrorExpression.trim().substr(-1,1)=='}')){
				collection.updateErrorExpression='{' + collection.updateErrorExpression + '}'
			}
			try{
				collection.updateErrorExpression=JSON.parse(collection.updateErrorExpression)
			}catch(tryErr){	}
		}


		getSelectedDataFromCollection(dbModel,collection,data2,(err,docs)=>{
			if(!err){
				var tempIndex=0

				iteration(docs,(item,cb2)=>{
					tempLog(`item_${tempIndex}.json`,JSON.stringify(item,null,2))
					tempIndex++

					util.renderFiles(programDoc.files,item,(err,renderedCode)=>{
						if(!err){
							var data={}
							data=Object.assign({},data, programDoc.connector)
							if(programDoc.connector.connectionType=='mssql' || programDoc.connector.connectionType=='mysql'){
								data.query=renderedCode
							}else{
								data.content=renderedCode
							}

							connectorService.post(dbModel,`/send`,data,(err,data)=>{
								if(err && collection.updateErrorExpression){
									updateOneDocument(item,collection.updateErrorExpression,err,(err2)=>{
										console.log(`err2:`,err2)
										cb2(err,data)
									})
								}else if(!err && collection.updateExpression){
									updateOneDocument(item,collection.updateExpression,null,(err2)=>{
										console.log(`err2:`,err2)
										cb2(err,data)
									})
								}else{
									cb2(err,data)
								}
							})
						}else{
							if(collection.updateErrorExpression){
								updateOneDocument(item,collection.updateErrorExpression,err,(err2)=>{
									console.log(`err2:`,err2)
									cb2(err,data)
								})
							}else{
								cb2(err)
							}
						}
					})
				},500,true,(err)=>{

				})
				cb(null,`${docs.length} adet görev çalıştırılmak üzere kuyruğa alındı`)
			}else{
				cb(err)
			}
		})
	}

	function fileExporter(dbModel,programDoc,data,cb){
		if(programDoc.collections.length==0)
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		if(programDoc.collections[0].name=='')
			return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
		
		var data2=dataDuzelt(data)
		var collection=clone(programDoc.collections[0])

		if((collection.filter || '').trim()!=''){
			if(!(collection.filter.trim().substr(0,1)=='{' && collection.filter.trim().substr(-1,1)=='}')){
				collection.filter='{' + collection.filter + '}'
			}
			try{
				collection.filter=JSON.parse(collection.filter)
			}catch(tryErr){	}
		}

		if((collection.updateExpression || '').trim()!=''){
			if(!(collection.updateExpression.trim().substr(0,1)=='{' && collection.updateExpression.trim().substr(-1,1)=='}')){
				collection.updateExpression='{' + collection.updateExpression + '}'
			}
			try{
				collection.updateExpression=JSON.parse(collection.updateExpression)
			}catch(tryErr){	}
		}

		if((collection.updateErrorExpression || '').trim()!=''){
			if(!(collection.updateErrorExpression.trim().substr(0,1)=='{' && collection.updateErrorExpression.trim().substr(-1,1)=='}')){
				collection.updateErrorExpression='{' + collection.updateErrorExpression + '}'
			}
			try{
				collection.updateErrorExpression=JSON.parse(collection.updateErrorExpression)
			}catch(tryErr){	}
		}
		getSelectedDataFromCollection(dbModel,collection,data2,(err,docs)=>{
			if(!err){

				util.renderFiles(programDoc.files,docs,(err,renderedCode)=>{
					if(!err){
						runRendered(renderedCode,(err,veri)=>{
							if(!err){
								cb(null,veri)
							}else{
								cb(err)
							}
						})
					}else{
						cb(err)
					}
				})
			}else{
				cb(err)
			}
		})
	}

	function getSelectedDataFromCollection(dbModel,collection,data,cb){
		var idList=[]
		if(!Array.isArray(data)){
			if(data.list!=undefined){
				data.list.forEach((e)=>{
					if(e && typeof e === 'object' && e.constructor === Object){
						if(e._id!=undefined){
							idList.push(e._id)
						}else if(e.id!=undefined){
							idList.push(e.id)
						}else{
							return cb({code: 'ERROR', message: 'list is wrong.'})
						}
					}else{
						idList.push(e)
					}
				})
			}else{
				if(typeof data=='string'){
					idList.push(data)
				}else if(data && typeof data === 'object' && data.constructor === Object){

				}else{
					return cb({code:'WRONG_DATA',message:'Hatali liste verisi. ornek:  list=[{"_id":"xxxxxxx"},{"_id":"yyyyyyyy"}'})
				}
			}
		}else{
			data.forEach((e)=>{
				if(e && typeof e === 'object' && e.constructor === Object){
					if(e._id!=undefined){
						idList.push(e._id)
					}else if(e.id!=undefined){
						idList.push(e.id)
					}else{
						return cb({code: 'ERROR', message: 'list is wrong.'})
					}
				}else{
					idList.push(e)
				}
			})
		}


		var filter={_id:{$in:idList}}
		if(collection.filter){
			Object.keys(collection.filter).forEach((k)=>{
				filter[k]=collection.filter[k]
			})
		}
		
		var populate=[]
		
		switch(collection.name){
			case 'pos_device_zreports':
			populate=[{
				path:'posDevice',
				populate:[
				{path:'location'},
				{path:'service', select:'_id name serviceType'}
				]
			}]
			break
		}
		console.log(`filter:`,filter)
		dbModel[collection.name].find(filter).populate(populate).exec((err,docs)=>{
			if(dberr(err,cb)){
				cb(null,docs)
				
			}
		})
	}


	function updateOneDocument(doc,updateExp,err, cb){
		Object.keys(updateExp).forEach((k)=>{
			doc[k]=evalObjectValuesExpression(updateExp[k],doc.toJSON(),err)
		})
		doc.save((err,doc2)=>{
			cb(err,doc2)
		})
	}

	function evalObjectValuesExpression(field, doc,err){

		if(typeof field=='string'){
			field=eval('\`' + field + '\`')
		}else if(Array.isArray(field)){
			field.forEach((e)=>{
				e=evalObjectValuesExpression(e,doc,err)
			})
		}else if(typeof field=='object'){
			Object.keys(field).forEach((k)=>{
				field[k]=evalObjectValuesExpression(field[k],doc,err)
			})
		}


		return field
	}
	

	function connectorImporter(dbModel,programDoc,data,cb){
		try{
			if(programDoc.collections.length==0)
				return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})
			if(programDoc.collections[0].name=='')
				return cb({code:'WRONG_PARAMETER',message:'Collection secilmemis'})

			if(programDoc.connector.connectorId=='' || programDoc.connector.connectorPass=='' || programDoc.connector.connectionType=='')
				return cb({code:'WRONG_PARAMETER',message:'connectorId, connectorPass, connectionType zorunludur'})

			util.renderFiles(programDoc.files,data,(err,renderedCode)=>{
				if(!err){
					var data={}
					data=Object.assign({},data, programDoc.connector)
					if(programDoc.connector.connectionType=='mssql' || programDoc.connector.connectionType=='mysql'){
						data.query=renderedCode
					}else{
						data.content=renderedCode
					}

					connectorService.post(dbModel,`/send`,data,(err,data)=>{
						if(dberr(err,cb)){
							
							if(typeof data=='string'){
								data=JSON.parse(data)
							}
							var dizi=[]
							if(!Array.isArray(data)){
								dizi.push(data)
							}else{
								dizi=data
							}
							dizi.forEach((e)=>{
								if(e.collection==undefined)
									e.collection=programDoc.collections[0].name
							})
							insertUpdateCollection(dbModel,dizi,cb)
						}
					})

				}else{
					cb(err)
				}
			})
		}catch(tryErr){
			return cb({code:tryErr.name || 'PARSING_ERROR',message:tryErr.message || 'connectorImporter error' })
		}
	}

	


	function dataDuzelt(data){
		if(typeof data=='string'){
			data=atob2(data)
			try{
				data=JSON.parse(data)
			}catch(err){
				
			}
		}else{
			if(data.files!=undefined){
				data.files.forEach((e)=>{
					e.data=atob2(e.data)
				})
			}
		}
		return data
	}

	function insertUpdateCollection(dbModel,data,callback){
		try{
			iteration(data,(item,cb)=>{
				var collection=item.collection
				item.collection=undefined
				var newDoc=dbModel[collection](item)
				if(!epValidateSync(newDoc,cb))
					return
				switch(collection){
					case 'despatches':
					saveDespatch(dbModel, newDoc,cb)
					break
					case 'despatches':
					saveDespatch(dbModel, newDoc,cb)
					break
					default:
					newDoc.save((err,newDoc2)=>{
						if(!err){
							cb(null,newDoc2._id)
						}else{
							cb(err)
						}
					})
					break
				}
			},0,true,callback)
		}catch(tryErr){
			return cb({code:tryErr.name || 'PARSING_ERROR',message:tryErr.message || 'execCmd error' })
		}
	}

	function saveDespatch(dbModel, newDoc,cb){
		if(newDoc.localDocumentId=='')
			return cb(null)

		dbModel.despatches.findOne({ioType:newDoc.ioType,localDocumentId:newDoc.localDocumentId},(err,doc)=>{
			if(dberr(err,cb)){
				if(doc!=null){
					cb({code:'ALREADY_EXISTS',message:`${newDoc.localDocumentId} zaten var.`})
				}else{
					documentHelper.findDefaultEIntegrator(dbModel,(newDoc.eIntegrator || ''),(err,eIntegratorDoc)=>{
						if(!err){
							documentHelper.yeniIrsaliyeNumarasi(dbModel,eIntegratorDoc,newDoc,(err,newDoc2)=>{
								newDoc2.save((err,newDoc3)=>{
									if(!err){
										cb(null,newDoc3._id)
									}else{
										cb(err)
									}
								})
							})
							
						}else{
							cb(err)
						}
					})
					
				}
			}
		})
	}

	function saveInvoice(dbModel, newDoc,cb){
		if(newDoc.localDocumentId=='')
			return cb(null)

		dbModel.invoices.findOne({ioType:newDoc.ioType,localDocumentId:newDoc.localDocumentId},(err,doc)=>{
			if(dberr(err,cb)){
				if(doc!=null){
					cb(null,{success:false, error:{code:'ALREADY_EXISTS',message:`${newDoc.localDocumentId} zaten var.`}})
				}else{
					newDoc.save((err,newDoc2)=>{
						if(!err){
							cb(null,{success:true, data:newDoc2._id})
						}else{
							cb(null,{success:false, error:err})
						}
					})
				}
			}
		})
	}


	function runRendered(renderedCode,cb){
		try{
			var fileName=path.join(os.tmpdir() , 'tr216_' + uuid.v4() + '.js')
			

			fs.writeFile(fileName, renderedCode, 'utf8', (err)=>{
				if(!err){
					util.execCmd('node',[fileName,'-e'],(err,veri,stderr)=>{
						if(stderr.trim()==''){
							var data=''
							try{
								data=JSON.parse(veri)
							}catch(e){
								
								data=veri
								
							}

							cb(null,data)
							fs.unlinkSync(fileName)
						}else{
							cb({code:'cmd_JS_ERROR',message:stderr})
							fs.unlinkSync(fileName)
						}
					})
				}else{
					cb({code:err.code || err.name || 'FILE_IMPORTER ERROR TEMP WRITE',message:err.message || 'FILE_IMPORTER ERROR TEMP WRITE' })
				}
			})


		}catch(tryErr){
			return cb({code:tryErr.name || 'PARSING_ERROR',message:tryErr.message || 'execCmd error' })
		}
	}
