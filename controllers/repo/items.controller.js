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
		if(req.params.param1=='copy'){
			copy(dbModel, member, req, res, next, cb)
		}else{
			post(dbModel, member, req, res, next, cb)
		}

		break
		case 'PUT':
		put(dbModel, member, req, res, next, cb)
		break
		case 'DELETE':
		deleteItem(dbModel, member, req, res, next, cb)
		break
		default:
		error.method(req)
		break
	}

}

function copy(dbModel, member, req, res, next, cb){
	var id=req.params.param2 || req.body['id'] || req.query.id || ''
	var newName=req.body['newName'] || req.body['name'] || ''

	if(id=='')
		error.param2(req)

	dbModel.items.findOne({ _id: id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var data=doc.toJSON()
				data._id=undefined
				delete data._id
				if(newName!=''){
					data.name.value=newName
				}else{
					data.name.value +=' copy'
				}
				data.createdDate=new Date()
				data.modifiedDate=new Date()

				var newdoc = new dbModel.items(data)
				epValidateSync(newdoc)
				newdoc.save((err, newdoc2)=>{
					if(dberr(err,next)){
						receteleriKaydet(dbModel,doc,newdoc2,(err,newdoc3)=>{
							if(!err){
								cb(newdoc3)
							}else{
								dbModel.items.deleteOne({_id:newdoc2._id},(err2)=>{
									return dberr(err,next)
								})
							}
						})

					} 
				})
			}
		}
	})
}

function receteleriKaydet(dbModel,itemDoc,newItemDoc,cb){
	dbModel.recipes.find({item:itemDoc._id},(err,docs)=>{
		if(!err){
			if(docs.length==0) 
				return cb(null,newItemDoc)

			var index=0

			function kaydet(cb){
				if(index>=docs.length) return cb(null)
					var data=docs[index].toJSON()
				data._id=undefined
				delete data._id
				data['item']=newItemDoc._id
				var yeniReceteDoc=new dbModel.recipes(data)
				yeniReceteDoc.save((err,yeniReceteDoc2)=>{
					if(!err){
						if(itemDoc.recipe==docs[index]._id){
							newItemDoc.recipe=yeniReceteDoc2._id
						}
						index++
						setTimeout(kaydet,0,cb)
					}else{
						cb(err)
					}
				})
			}

			kaydet((err)=>{
				if(!err){
					newItemDoc.save((err,newItemDoc2)=>{
						cb(err,newItemDoc2)
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

function getList(dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1)

	}
	if(!req.query.page){
		options.limit=50000
	}
	var filter = {}


	if(req.query.itemType!='all'){
		if((req.query.itemType || req.query.itemtype || req.query.type || '')!=''){
			filter['itemType']=(req.query.itemType || req.query.itemtype || req.query.type)
		}else{
			filter['itemType']='item'
		}
	}


    //filter['passive']=false
    if((req.query.passive || '')!='')
    	filter['passive']=req.query.passive
    
    if((req.query.name || '')!=''){
    	filter['$or']=[
    	{'name.value':{ $regex: '.*' + req.query.name + '.*' ,$options: 'i' }},
    	{'description.value':{ $regex: '.*' + req.query.name + '.*' ,$options: 'i' }}
    	]
    }
    
    if((req.query.brandName || '')!='')
    	filter['brandName.value']={ $regex: '.*' + req.query.brandName + '.*' ,$options: 'i' }
    
    if((req.query.description || '')!='')
    	filter['description.value']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' }
    
    if((req.query.keyword || '')!='')
    	filter['keyword.value']={ $regex: '.*' + req.query.keyword + '.*' ,$options: 'i' }
    
    if((req.query.modelName || '')!='')
    	filter['modelName.value']={ $regex: '.*' + req.query.modelName + '.*' ,$options: 'i' }
    
    if((req.query.itemClassificationCode || '')!='')
    	filter['commodityClassification.itemClassificationCode.value']={ $regex: '.*' + req.query.itemClassificationCode + '.*' ,$options: 'i' }
    
    
    if((req.query.accountGroup || '')!='')
    	filter['accountGroup']=req.query.accountGroup

    dbModel.items.paginate(filter,options,(err, resp)=>{
    	if(dberr(err,next)){
    		cb(resp)
    	}
    })
}

function getOne(dbModel, member, req, res, next, cb){
	var populate=[
	{path:'images',select:'_id name extension fileName data type size createdDate modifiedDate'},
	{path:'files',select:'_id name extension fileName data type size createdDate modifiedDate'},
	{path:'packingOptions.packingType',select:'_id name description width length height weight maxWeight'},
	{path:'packingOptions.packingType2',select:'_id name description width length height weight maxWeight'},
	{path:'packingOptions.packingType3',select:'_id name description width length height weight maxWeight'},
	{path:'packingOptions.palletType',select:'_id name description width length height maxWeight'}
	]
	dbModel.items.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				if(!req.query.print){
					cb(doc)
				}else{
					var moduleType='item'
					if(doc.itemType=='product' || doc.itemType=='semi-product')
						moduleType='item-product'

					printHelper.print(dbModel,moduleType,doc,(err,html)=>{
						if(!err){
							cb({file: {data:html}})
						}else{
							cb({success:false,error:{code:(err.code || err.name || 'PRINT_ERROR'),message:err.message}})
						}
					})
				}
			}
		}
	})
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	data._id=undefined

	if((data.accountGroup || '')=='')
		data.accountGroup=undefined

	saveFiles(dbModel,data,(err,data)=>{
		var newdoc = new dbModel.items(data)
		epValidateSync(newdoc)
		newdoc.save((err, newdoc2)=>{
			if(dberr(err,next)){
				cb(newdoc2)
			} 
		})
	})
}

function put(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data=req.body || {}
	data._id = req.params.param1
	data.modifiedDate = new Date()
	if((data.accountGroup || '')=='')
		data.accountGroup=undefined

	dbModel.items.findOne({ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				saveFiles(dbModel,data,(err,data)=>{
					var doc2 = Object.assign(doc, data)
					var newdoc = new dbModel.items(doc2)
					epValidateSync(newdoc)

					newdoc.save((err, newdoc2)=>{
						if(dberr(err,next)){
							cb(newdoc2)
						} 
					})
				})
			}
		}
	})
}

function deleteItem(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		error.param1(req)
	var data = req.body || {}
	data._id = req.params.param1
	dbModel.items.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			cb(null)
		}
	})
}


function saveFiles(dbModel,data,cb){
	dosyaKaydet(dbModel,data.images,(err,array1)=>{
		data.images=array1
		dosyaKaydet(dbModel,data.files,(err,array2)=>{
			data.files=array2
			cb(null,data)
		})
	})
}

function dosyaKaydet(dbModel,files,cb){
	if(files==undefined)
		return cb(null,[])
	if(files.length==0)
		return cb(null,[])

	var dizi=[]
	var index=0
	function kaydet(cb){
		if(index>=files.length)
			return cb(null)
		var data={ 
			data:files[index].data,
			fileName:(files[index].fileName || ''),
			name:(files[index].name || ''),
			extension:(files[index].extension || ''),
			type:(files[index].type || 'text/plain')
		}
		if(data.fileName=='' && data.name==''){
			index++
			setTimeout(kaydet,0,cb)
			return
		}
		if((files[index]._id || '')!=''){
			dbModel.files.findOne({_id:files[index]._id},(err,doc)=>{
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