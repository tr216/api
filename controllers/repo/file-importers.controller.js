module.exports = (dbModel, member, req, res, cb)=>{
	switch(req.method){
		case 'GET':
		if(req.params.param1!=undefined){
			getOne(dbModel,member,req,res,cb)
		}else{
			getList(dbModel,member,req,res,cb)
		}
		break
		case 'POST':

		if(req.params.param1=='test'){
			test(dbModel,member,req,res,cb)
		}else{
			if(req.params.param2=='file'){

				saveFile(dbModel,member,req,res,cb)
			}else if(req.params.param2=='run'){

				runCode(dbModel,member,req,res,cb)
			}else if(req.params.param2=='setstart' || req.params.param2=='setStart'){
				setStart(dbModel,member,req,res,cb)
			}else{
				post(dbModel,member,req,res,cb)
			}
		}
		break
		case 'PUT':
		if(req.params.param2=='file'){
			saveFile(dbModel,member,req,res,cb)
		}else if(req.params.param2=='run'){
			runCode(dbModel,member,req,res,cb)
		}else if(req.params.param2=='setstart' || req.params.param2=='setStart'){
			setStart(dbModel,member,req,res,cb)
		}else{
			put(dbModel,member,req,res,cb)
		}
		break
		case 'DELETE':
		if(req.params.param2=='file'){
			deleteFile(dbModel,member,req,res,cb)
		}else{
			deleteItem(dbModel,member,req,res,cb)
		}

		break
		default:
		error.method(req)
		break
	}

}

function getList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1)}
	if(!req.query.page)
		options.limit=50000

	var filter = {}

	if((req.query.importerType || '')!='')
		filter['importerType']=req.query.importerType

	dbModel.file_importers.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		}
	})
}

function getOne(dbModel,member,req,res,cb){
	var populate=[{path:'files',select:'_id name extension fileName type size createdDate modifiedDate'}]
	var fileId=req.query.fileId || req.query.fileid || ''

	dbModel.file_importers.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
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
					if(!bFound){
						cb({success: false,error: {code: 'FILE_NOT_FOUND', message: 'Dosya bulunamadi'}})
					}else{
						dbModel.files.findOne({_id:fileId},(err,fileDoc)=>{
							if(dberr(err)){

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
					}
				}else{
					cb(doc)
				}
			}
		}
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined

	var newdoc = new dbModel.file_importers(data)
	epValidateSync(newdoc)

	newdoc.save((err, newdoc2)=>{
		if(dberr(err)){
			cb(newdoc2)
		}
	})
}


function put(dbModel,member,req,res,cb){
	if(req.params.param1==undefined){
		cb({success: false,error: {code: 'WRONG_PARAMETER', message: 'Para metre hatali'}})
	}else{
		var data = req.body || {}

		data._id = req.params.param1
		data.modifiedDate = new Date()


		dbModel.file_importers.findOne({ _id: data._id},(err,doc)=>{
			if(dberr(err)){
				if(dbnull(doc)){
					var doc2 = Object.assign(doc, data)
					var newdoc = new dbModel.file_importers(doc2)
					epValidateSync(newdoc)

					newdoc.save((err, newdoc2)=>{
						if(dberr(err))
							cb(newdoc2)
					})
				}
			}
		})
	}
}

function deleteItem(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)

	var data = req.body || {}
	data._id = req.params.param1
	dbModel.file_importers.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err))
			cb(null)
	})
}


function saveFile(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	if(req.params.param2==undefined)
		error.param2(req)
	var data = req.body || {}
	var populate=[{path:'files',select:'_id name extension size type fileName '}]

	if(req.body._id!=undefined){
		data['_id']=req.body._id
	}else{
		data['_id']=req.query.fileId || req.query.fileid
	}


	dbModel.file_importers.findOne({ _id: req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				if(data._id==undefined){

					var newfileDoc = new dbModel.files(data)
					epValidateSync(newfileDoc)

					newfileDoc.save((err, newfileDoc2)=>{
						if(dberr(err)){
							doc.files.push(newfileDoc2._id)
							doc.modifiedDate=new Date()
							doc.save((err)=>{
								if(dberr(err))
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
						throw {code: 'ALREADY_EXISTS', message: 'Ayni dosya isminden baska bir kayit daha var!'}

					dbModel.files.findOne({_id:data._id},(err,fileDoc)=>{
						if(dberr(err)){
							if(dbnull(fileDoc)){
								fileDoc.name=data.name
								fileDoc.extension=data.extension
								fileDoc.data=data.data
								fileDoc.type=data.type
								fileDoc.size=data.size

								epValidateSync(fileDoc)
								if(dberr(err)){
									fileDoc.save((err)=>{
										if(dberr(err)){
											doc.modifiedDate=new Date()
											doc.save((err)=>{
												if(dberr(err))
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

function setStart(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	if(req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '')
		error.param2(req)

	var fileId=req.query.fileId || req.query.fileid || ''
	dbModel.file_importers.findOne({ _id: req.params.param1,files:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				doc.files.forEach((e,index)=>{
					if(e==req.query.fileId){
						doc.startFile=e._id
						return
					}
				})
				doc.save((err,doc2)=>{
					if(dberr(err)){
						cb('')
					}
				})

			}
		}
	})
}

function deleteFile(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	if(req.params.param2==undefined || (req.query.fileId || req.query.fileid || '') == '')
		error.param2(req)

	var fileId=req.query.fileId || req.query.fileid || ''
	dbModel.file_importers.findOne({ _id: req.params.param1,files:{$elemMatch:{$eq:fileId}}},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				doc.files.forEach((e,index)=>{
					if(e==req.query.fileId){
						doc.files.splice(index,1)
						return
					}
				})
				doc.save((err,doc2)=>{
					if(dberr(err)){
						dbModel.files.removeOne(member,{ _id: req.query.fileId },(err)=>{
							if(dberr(err))
								cb(doc2)
						})
					}
				})
			}
		}
	})
}

function runCode(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	if(req.params.param2==undefined)
		error.param2(req)

	var data = req.body || {}
	var populate=['startFile','files']
	dbModel.file_importers.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				var sampleData={}
				if(data.sampleData!=undefined)
					sampleData=data.sampleData
				master.services.tr216LocalConnector.run(doc,sampleData,(err,resp)=>{
					if(dberr(err))
						cb(resp || '')
				})
			}
		}
	})
}