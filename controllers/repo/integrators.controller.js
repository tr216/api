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

		post(dbModel,member,req,res,cb)
		break
		case 'PUT':

		put(dbModel,member,req,res,cb)
		break
		case 'DELETE':

		deleteItem(dbModel,member,req,res,cb)
		break
		default:
		error.method(req)
		break
	}
}

function getList(dbModel,member,req,res,cb){
	var options={page: (req.query.page || 1)
	}

	if((req.query.pageSize || req.query.limit)){
		options['limit']=req.query.pageSize || req.query.limit
	}else{
		options['limit']=50000
	}

	var filter = {}
	if((req.query.passive || '') !='')
		filter['passive']=req.query.passive
	

	dbModel.integrators.paginate(filter,options,(err, resp)=>{
		if(dberr(err)){
			cb(resp)
		} 
	})
}

function getOne(dbModel,member,req,res,cb){
	var populate=[
	{path:'invoice.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
	{path:'despatch.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
	{path:'order.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'},
	{path:'document.xsltFiles',select:'_id name extension fileName data type size createdDate modifiedDate'}
	]

	dbModel.integrators.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				cb(doc)
			}
		} 
	})
}

function post(dbModel,member,req,res,cb){
	var data = req.body || {}
	data._id=undefined
	data=cleanDataEmptyLocalConnector(data)
	saveFiles(dbModel,data,(err,data)=>{
		var newdoc = new dbModel.integrators(data)
		epValidateSync(newdoc)
		newdoc.save((err, newdoc2)=>{
			if(dberr(err)){
				if(newdoc2.isDefault){
					dbModel.integrators.updateMany({isDefault:true,_id:{$ne:newdoc2._id}},{$set:{isDefault:false}},{multi:true},(err,resp)=>{
						cb(newdoc2)
					})
				}else{
					cb(newdoc2)
				}
			}
		})
	})
}

function put(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)
	
	var data = req.body || {}

	data._id = req.params.param1
	data.modifiedDate = new Date()

	dbModel.integrators.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err)){
			if(dbnull(doc)){
				data=cleanDataEmptyLocalConnector(data)
				saveFiles(dbModel,data,(err,data)=>{
					var doc2 = Object.assign(doc, data)
					var newdoc = new dbModel.integrators(doc2)
					epValidateSync(newdoc)
					newdoc.save((err, newdoc2)=>{
						if(dberr(err)){
							if(newdoc2.isDefault){
								dbModel.integrators.updateMany({isDefault:true,_id:{$ne:newdoc2._id}},{$set:{isDefault:false}},{multi:true},(err,resp)=>{
									cb(newdoc2)
								})
							}else{
								cb(newdoc2)
							}
						}
					})
				})
			}
		}
	})

}

function saveFiles(dbModel,data,cb){
	xsltKaydet(dbModel,data.invoice.xsltFiles,(err,array1)=>{
		data.invoice.xsltFiles=array1
		if(array1.length>0)
			data.invoice['xslt']=array1[0]

		xsltKaydet(dbModel,data.despatch.xsltFiles,(err,array2)=>{
			data.despatch.xsltFiles=array2
			if(array2.length>0)
				data.despatch['xslt']=array2[0]
			xsltKaydet(dbModel,data.document.xsltFiles,(err,array3)=>{
				data.document.xsltFiles=array3
				if(array3.length>0)
					data.document['xslt']=array3[0]
				xsltKaydet(dbModel,data.order.xsltFiles,(err,array4)=>{
					data.order.xsltFiles=array4
					if(array4.length>0)
						data.order['xslt']=array4[0]
					cb(null,data)
				})
			})
		})
	})
}

function xsltKaydet(dbModel,xsltFiles,cb){
	if(xsltFiles==undefined)
		return cb(null,[])
	if(xsltFiles.length==0)
		return cb(null,[])

	var dizi=[]
	var index=0
	function kaydet(cb){
		if(index>=xsltFiles.length)
			return cb(null)
		var data={ 
			data:xsltFiles[index].data,
			fileName:(xsltFiles[index].fileName || ''),
			name:(xsltFiles[index].name || ''),
			extension:(xsltFiles[index].extension || ''),
			type:(xsltFiles[index].type || 'text/plain')
		}
		if(data.fileName=='' && data.name==''){
			index++
			setTimeout(kaydet,0,cb)
			return
		}
		if((xsltFiles[index]._id || '')!=''){
			dbModel.files.findOne({_id:xsltFiles[index]._id},(err,doc)=>{
				if(!err){
					if(doc!=null){
						doc.data=data.data
						doc.fileName=data.fileName
						doc.name=data.name
						doc.extension=data.extension
						doc.type=data.type
						doc.save((err,doc2)=>{
							if(!err){
								dizi.push(doc2._id)
							}else{
								errorLog(err)
							}
							index++
							setTimeout(kaydet,0,cb)
						})
					}else{
						var newFile=new dbModel.files(data)
						newFile.save((err,doc2)=>{
							if(!err){
								dizi.push(doc2._id)
							}else{
								errorLog(err)
							}
							index++
							setTimeout(kaydet,0,cb)
						})
					}
				}else{
					index++
					setTimeout(kaydet,0,cb)
				}
			})
		}else{
			var newFile=new dbModel.files(data)
			newFile.save((err,doc2)=>{
				if(!err){
					dizi.push(doc2._id)
				}else{
					errorLog(err)
				}
				index++
				setTimeout(kaydet,0,cb)
			})
		}
	}

	kaydet((err)=>{
		cb(null,dizi)
	})
}

function cleanDataEmptyLocalConnector(data){
	if(data['invoice']){
		if(data['invoice']['localConnector']){
			if(data['invoice']['localConnector']['import']){
				if(data['invoice']['localConnector']['import'].localConnector==''){
					data['invoice']['localConnector']['import'].localConnector=undefined
					delete data['invoice']['localConnector']['import'].localConnector
				}
			}
			if(data['invoice']['localConnector']['export']){
				if(data['invoice']['localConnector']['export'].localConnector==''){
					data['invoice']['localConnector']['export'].localConnector=undefined
					delete data['invoice']['localConnector']['export'].localConnector
				}
			}
		}
	}

	if(data['despatch']){
		if(data['despatch']['localConnector']){
			if(data['despatch']['localConnector']['import']){
				if(data['despatch']['localConnector']['import'].localConnector==''){
					data['despatch']['localConnector']['import'].localConnector=undefined
					delete data['despatch']['localConnector']['import'].localConnector
				}
			}
			if(data['despatch']['localConnector']['export']){
				if(data['despatch']['localConnector']['export'].localConnector==''){
					data['despatch']['localConnector']['export'].localConnector=undefined
					delete data['despatch']['localConnector']['export'].localConnector
				}
			}
		}
	}
	if(data['document']){
		if(data['document']['localConnector']){
			if(data['document']['localConnector']['import']){
				if(data['document']['localConnector']['import'].localConnector==''){
					data['document']['localConnector']['import'].localConnector=undefined
					delete data['document']['localConnector']['import'].localConnector
				}
			}
			if(data['document']['localConnector']['export']){
				if(data['document']['localConnector']['export'].localConnector==''){
					data['document']['localConnector']['export'].localConnector=undefined
					delete data['document']['localConnector']['export'].localConnector
				}
			}
		}
	}

	if(data['order']){
		if(data['order']['localConnector']){
			if(data['order']['localConnector']['import']){
				if(data['order']['localConnector']['import'].localConnector==''){
					data['order']['localConnector']['import'].localConnector=undefined
					delete data['order']['localConnector']['import'].localConnector
				}
			}
			if(data['order']['localConnector']['export']){
				if(data['order']['localConnector']['export'].localConnector==''){
					data['order']['localConnector']['export'].localConnector=undefined
					delete data['order']['localConnector']['export'].localConnector
				}
			}
		}
	}
	if(data['ledger']){
		if(data['ledger']['localConnector']){
			if(data['ledger']['localConnector']['import']){
				if(data['ledger']['localConnector']['import'].localConnector==''){
					data['ledger']['localConnector']['import'].localConnector=undefined
					delete data['ledger']['localConnector']['import'].localConnector
				}
			}
			if(data['ledger']['localConnector']['export']){
				if(data['ledger']['localConnector']['export'].localConnector==''){
					data['ledger']['localConnector']['export'].localConnector=undefined
					delete data['ledger']['localConnector']['export'].localConnector
				}
			}
		}
	}
	return data
}


function deleteItem(dbModel,member,req,res,cb){
	if(req.params.param1==undefined)
		error.param1(req)

	var data = req.body || {}
	data._id = req.params.param1
	dbModel.integrators.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err))
			cb(null)
	})
}

