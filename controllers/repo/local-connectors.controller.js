module.exports = (dbModel, member, req, res, next, cb)=>{

	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			getOne(dbModel, member, req, res, next, cb)
		}else{
			getList(dbModel, member, req, res, next, cb)
		}
		break
		case 'POST':

		if(req.params.param1=='test'){
			
			test(dbModel, member, req, res, next, cb)
		}else{
			if(req.params.param2=='file'){

				saveFile(dbModel, member, req, res, next, cb)
			}else if(req.params.param2=='run'){

				runCode(dbModel, member, req, res, next, cb)
			}else if(req.params.param2=='setstart' || req.params.param2=='setStart'){
				setStart(dbModel, member, req, res, next, cb)
			}else{
				post(dbModel, member, req, res, next, cb)
			}
		}
		break
		case 'PUT':
		if(req.params.param2=='file'){
			saveFile(dbModel, member, req, res, next, cb)
		}else if(req.params.param2=='run'){
			runCode(dbModel, member, req, res, next, cb)
		}else if(req.params.param2=='setstart' || req.params.param2=='setStart'){
			setStart(dbModel, member, req, res, next, cb)
		}else{
			put(dbModel, member, req, res, next, cb)
		}
		break
		case 'DELETE':
		if(req.params.param2=='file'){
			deleteFile(dbModel, member, req, res, next, cb)
		}else{
			deleteItem(dbModel, member, req, res, next, cb)
		}

		break
		default:
		error.method(req)
		break
	}

}

function getList(dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1)}
	if(!req.query.page)
		options.limit=50000


	var filter = {}
	if((req.query.connectorType || '')!='')
		filter['connectorType']=req.query.connectorType

	dbModel.local_connectors.paginate(filter,options,(err, resp)=>{
		if(dberr(err,next)){
			var orList=[]
			var filter={}
			resp.docs.forEach((item)=>{
				orList.push({connectorId:item.connectorId,connectorPass:item.connectorPass})
			})
			
			if(orList.length>0)
				filter['$or']=orList

			db.local_connectors.find(filter,(err,docs)=>{
				if(dberr(err,next)){
					resp.docs.forEach((item)=>{
						var connectedItem= docs.find((e)=>{return (item.connectorId==e.connectorId && item.connectorPass==e.connectorPass)})
						if(connectedItem!=undefined){
							item['status']='offline'
							item['lastOnline']=connectedItem.lastOnline
							if((new Date()-connectedItem.lastOnline)/1000<120){
								item['status']='online'
							}
						}else{
							item['status']='error'
							item['lastOnline']=null
						}
					})
					cb(resp)
				}
			})

		}
	})
}

function getOne(dbModel, member, req, res, next, cb){
	var populate=[{path:'files',select:'_id name extension fileName type size createdDate modifiedDate'}]
	var fileId=req.query.fileId || req.query.fileid || ''

	dbModel.local_connectors.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				if(doc.startFile!=undefined){
					doc=doc.toObject()
					doc.files.forEach((e)=>{
						if(e._id==doc.startFile.toString()){
							e['isStart']=true
						}else{
							e['isStart']=false
						}

					})
				}

				if(fileId!=''){
					var bFound=false
					doc.files.forEach((e)=>{
						if(e._id==fileId){
							bFound=true
							return
						}
					})
					if(!bFound)
						return next({code: 'FILE_NOT_FOUND', message: 'Dosya bulunamadi'})

					dbModel.files.findOne({_id:fileId},(err,fileDoc)=>{
						if(dberr(err,next)){

							if(fileDoc){
								doc.files.forEach((e)=>{
									if(e._id==fileId){
										e['data']=fileDoc.data
										return
									}
								})
							}
							cb(doc)
						}
					})
				}else{
					cb(doc)
				}
			}
		} 
	})
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	data._id=undefined

	var newDoc = new dbModel.local_connectors(data)
	if(!epValidateSync(newDoc,next))
		return
	newDoc.save((err, newDoc2)=>{
		if(dberr(err,next)){
			cb(newDoc2)
		}
	})
}


function put(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	var data = req.body || {}

	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.local_connectors.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var doc2 = Object.assign(doc, data)
				var newDoc = new dbModel.local_connectors(doc2)
				if(!epValidateSync(newDoc,next))
					return
				newDoc.save((err, newDoc2)=>{
					if(dberr(err,next))
						cb(newDoc2)
				})
			}
		}
	})
}

function deleteItem(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	var data = req.body || {}
	data._id = req.params.param1
	dbModel.local_connectors.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err,next))
			cb(null)
	})
}


function saveFile(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	if(req.params.param2==undefined)
		error.param2(req)

	var data = req.body || {}
	var populate=[{path:'files',select:'_id name extension size type fileName '}]

	data['_id']=req.body._id || req.query.fileId || req.query.fileid

	dbModel.local_connectors.findOne({ _id: req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				if(data._id==undefined){
					var newfileDoc = new dbModel.files(data)
					epValidateSync(newfileDoc)
					newfileDoc.save(function(err, newfileDoc2) {
						if(dberr(err,next)){
							doc.files.push(newfileDoc2._id)
							doc.modifiedDate=new Date()
							doc.save((err)=>{
								if(dberr(err,next))
									cb('')
							})
						}
					})
				}else{
					var bFound=false
					doc.files.forEach((f)=>{
						if(f._id != undefined){
							if(f.name==data['name'] && f.extension==data['extension'] && f._id != data._id){
								bFound=true
								return
							}
						}
					})

					if(bFound)
						return next({code: 'ALREADY_EXISTS', message: 'Ayni dosya isminden baska bir kayit daha var!'})
					

					dbModel.files.findOne({_id:data._id},(err,fileDoc)=>{
						if(dberr(err,next)){
							if(dbnull(fileDoc)){
								fileDoc.name=data.name
								fileDoc.extension=data.extension
								fileDoc.data=data.data
								fileDoc.type=data.type
								fileDoc.size=data.size

								epValidateSync(fileDoc)

								if(dberr(err,next)){
									fileDoc.save((err)=>{
										if(dberr(err,next)){
											doc.modifiedDate=new Date()
											doc.save((err)=>{
												if(dberr(err,next))
													cb('')
											})
										}
									})

								}
							}
						}
					})
				}
			}
		}
	})
}

function setStart(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	if(req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '')
		error.param2(req)

	var fileId=req.query.fileId || req.query.fileid || ''
	dbModel.local_connectors.findOne({ _id: req.params.param1,files:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				doc.files.forEach((e,index)=>{
					if(e==req.query.fileId){
						doc.startFile=e._id
						return
					}
				})
				doc.save((err,doc2)=>{
					if(dberr(err,next))
						cb('')
				})
			}
		}
	})
}

function deleteFile(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	if(req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '')
		error.param2(req)

	var fileId=req.query.fileId || req.query.fileid || ''

	dbModel.local_connectors.findOne({ _id: req.params.param1,files:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				doc.files.forEach((e,index)=>{
					if(e==req.query.fileId){
						doc.files.splice(index,1)
						return
					}
				})
				doc.save((err,doc2)=>{
					if(dberr(err,next)){
						dbModel.files.removeOne(member,{ _id: req.query.fileId },(err)=>{
							if(dberr(err,next))
								cb(doc2)
						})
					}
				})
			}
		}
	})
}

function runCode(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	if(req.params.param2==undefined)
		error.param2(req)

	var data = req.body || {}
	var populate=['startFile','files']

	dbModel.local_connectors.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var sampleData={}

				if(data.sampleData!=undefined)
					sampleData=data.sampleData
				services.tr216LocalConnector.run(doc,sampleData,(err,resp)=>{
					if(dberr(err,next))
						cb((resp || ''))
				})
			}
		}
	})
}


function test(dbModel, member, req, res, next, cb){
	var data = req.body || {}

	if(data['connectorId']==undefined || data['connectorPass']==undefined || data['connectionType']==undefined)
		return next({code:'WRONG_PARAMETER',message:'connectorId, connectorPass, connectionType are required.'})
	switch(data.connectionType){
		case 'mssql':
			data['command']='MSSQL_CONNECTION_TEST'
		break
		case 'mysql':
			data['command']='MYSQL_CONNECTION_TEST'
		break
		default:
			data['command']='TIME'
		break
	}
	connectorService.post(dbModel,`/send`,data,(err,data)=>{
		if(dberr(err,next)){
			cb(data)
		}
	})

	// switch(data.connectionType){
	// 	case 'mssql':
	// 	connectorService.post(dbModel,`/send`,{},(err,data)=>{
	// 			if(dberr(err,next)){
	// 				cb(data)
	// 			}
	// 		})
	// 	services.tr216LocalConnector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
	// 	                                                ,'MSSQL_CONNECTION_TEST',{connection:data.connection,query:''},(result)=>{
	// 	                                                	cb(result.data)
	// 	                                                })
	// 	break
	// 	case 'mysql':
	// 	services.tr216LocalConnector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
	// 	                                                ,'MYSQL_CONNECTION_TEST',{connection:data.connection,query:''},(result)=>{
	// 	                                                	cb(result.data)
	// 	                                                })
	// 	break
	// 	default:
	// 	services.tr216LocalConnector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
	// 	                                                ,'TIME',{},(result)=>{
	// 	                                                	cb(result.data)
	// 	                                                })
	// 	break
	// }

}