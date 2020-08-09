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
		post(dbModel, member, req, res, next, cb)
		break
		case 'PUT':
		put(dbModel, member, req, res, next, cb)
		break
		case 'DELETE':
		deleteItem(dbModel, member, req, res, next, cb)
		break
		default:
		error.method(req, next)
		break
	}

}

function getList(dbModel, member, req, res, next, cb){
	var options={page: (req.query.page || 1),
		populate:[
		{path:'location',select:'_id locationName'},
		{path:'subLocation',select:'_id name'},
		{path:'location2',select:'_id locationName'},
		{path:'subLocation2',select:'_id name'},
		{path:'productionOrderId',select:'_id productionId'}
		]
	}
	if(!req.query.page)
		options.limit=50000

	var filter = {}


	if((req.query.date1 || '')!='')
		filter['issueDate']={$gte:req.query.date1}

	if((req.query.date2 || '')!=''){
		if(filter['issueDate']){
			filter['issueDate']['$lte']=req.query.date2
		}else{
			filter['issueDate']={$lte:req.query.date2}
		}
	}
	if((req.query.docTypeCode || '')!='')
		filter['docTypeCode']=req.query.docTypeCode

	if((req.query.docId || req.query.docNo || '')!='')
		filter['docId']={ $regex: '.*' + (req.query.docId || req.query.docNo) + '.*' ,$options: 'i' }

	if((req.query.description || '')!='')
		filter['description']={ $regex: '.*' + req.query.description + '.*' ,$options: 'i' }

	if((req.query.item || req.query.itemId ||  '')!='')
		filter['docLine.item']=req.query.item || req.query.itemId

	if((req.query.lotNo || '')!='')
		filter['docLine.lotNo']={ $regex: '.*' + req.query.lotNo + '.*' ,$options: 'i' }

	if((req.query.location || '')!='')
		filter['location']=req.query.location

	if((req.query.location2 || '')!='')
		filter['location2']=req.query.location2

	filter_subLocation(dbModel,req,filter,(err,filter2)=>{
		if(dberr(err,next)){
			dbModel.inventory_fiches.paginate(filter2,options,(err, resp)=>{
				if(dberr(err,next)){
					cb(resp)
				}
			})
		}
	})
}

function filter_subLocation(dbModel,req,mainFilter,cb){
	function filter_subLocation1(filter,cb){
		if((req.query.subLocation || '')!=''){
			dbModel.sub_locations.find({ name: { $regex: '.*' + req.query.subLocation + '.*' ,$options: 'i' }},(err,subLocations)=>{
				if(!err){
					if(filter['$or']!=undefined){
						var newOR=[]
						filter['$or'].forEach((e)=>{
							var bFound= false
							fiches.forEach((e2)=>{ 
								if(e['subLocation'].toString()==e2._id.toString()){
									bFound=true
									return
								}
							})
							if(bFound){
								newOR.push(e)
							}
						})
						filter['$or']=newOR
					}else{
						filter['$or']=[]
						subLocations.forEach((e)=>{
							filter['$or'].push({subLocation:e._id})
						})
					}

					cb(null,filter)
				}else{
					cb(err,filter)
				}
			})
		}else{
			cb(null,filter)
		}
	}

	function filter_subLocation2(filter,cb){
		if((req.query.subLocation2 || '')!=''){
			dbModel.sub_locations.find({ name: { $regex: '.*' + req.query.subLocation2 + '.*' ,$options: 'i' }},(err,subLocations)=>{
				if(!err){
					if(filter['$or']!=undefined){
						var newOR=[]
						filter['$or'].forEach((e)=>{
							var bFound= false
							fiches.forEach((e2)=>{ 
								if(e['subLocation2'].toString()==e2._id.toString()){
									bFound=true
									return
								}
							})
							if(bFound){
								newOR.push(e)
							}
						})
						filter['$or']=newOR
					}else{
						filter['$or']=[]
						subLocations.forEach((e)=>{
							filter['$or'].push({subLocation2:e._id})
						})
					}

					cb(null,filter)
				}else{
					cb(err,filter)
				}
			})
		}else{
			cb(null,filter)
		}
	}

	filter_subLocation1(mainFilter,(err,mainFilter2)=>{
		filter_subLocation2(mainFilter2,(err2,mainFilter3)=>{
			cb(err2,mainFilter3)
		})
	})
}


function getOne(dbModel, member, req, res, next, cb){
	var populate=[
	{path:'docLine.item', select:'_id name description unitPacks tracking passive'},
	{path:'docLine.pallet', select:'_id name'}
	]
    // {path:'docLine.color', select:'_id name'}, //qwerty
    // {path:'docLine.pattern', select:'_id name'}, //qwerty
    // {path:'docLine.size', select:'_id name'} //qwerty
    dbModel.inventory_fiches.findOne({_id:req.params.param1}).populate(populate).exec((err,doc)=>{
    	if(dberr(err,next)){
    		cb(doc)
    	}
    })
}

function post(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	if((data.account || '')=='')
		data.account=undefined
	data._id=undefined
	data=fazlaliklariTemizleDuzelt(data)
	if(data.docTypeCode=='URETIMECIKIS' || data.docTypeCode=='URETIMDENGIRIS'){
		if((data.productionOrderId || '')==''){
			return next({code: 'WRONG_DATA', message: 'Üretim emri seçilmemiş'})
		}
	}

	uretimFisiKontrolEt(dbModel,data,(err,data)=>{
		var yeniDoc = new dbModel.inventory_fiches(data)
		documentHelper.yeniStokFisNumarasi(dbModel,yeniDoc,(err11,newDoc)=>{
			if(!epValidateSync(newDoc,next))
		return
			newDoc.save((err, newDoc2)=>{
				if(dberr(err,next)){
					cb(newDoc2)
				} 
			})
		})
	})
}

function put(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)

	var data=req.body || {}
	data._id = req.params.param1
	data.modifiedDate = new Date()
	data=fazlaliklariTemizleDuzelt(data)
	if(data.docTypeCode=='URETIMECIKIS' || data.docTypeCode=='URETIMDENGIRIS'){
		if((data.productionOrderId || '')==''){
			return next({code: 'WRONG_DATA', message: 'Üretim emri seçilmemiş'})
		}
	}
	uretimFisiKontrolEt(dbModel,data,(data)=>{
		dbModel.inventory_fiches.findOne({ _id: data._id},(err,doc)=>{
			if(dberr(err,next)){
				if(dbnull(doc,next)){
					var doc2 = Object.assign(doc, data)
					var newDoc = new dbModel.inventory_fiches(doc2)
					if(!epValidateSync(newDoc,next))
					return

					newDoc.save((err, newDoc2)=>{
						if(dberr(err,next)){
							cb(newDoc2)
						} 
					})
				}
			}
		})
	})
}

function uretimFisiKontrolEt(dbModel,data,cb){
	if(!(data.docTypeCode=='URETIMECIKIS' || data.docTypeCode=='URETIMDENGIRIS'))
		return cb(data)

	dbModel.production_orders.findOne({_id:data.productionOrderId},(err,proOrder)=>{
		if(dberr(err,next)){
			if(proOrder==null) 
				return next({code:'WRONG_DATA',message:'Uretim emri bulunamadi'})

			if(!data.docLine) 
				return cb(data)

			if(data.docTypeCode=='URETIMECIKIS'){
				data.docLine.forEach((e,index)=>{
					var bFound=false
					proOrder.materialSummary.forEach((e2)=>{
						if(e.item._id.toString()==e2.item.toString()){
							bFound=true
							return
						}
					})

					if(!bFound)
						return next({code:'WRONG_DATA',message:'Uretim emrinde olmayan bir hammadde ya da malzemeyi uretime cikamazsiniz. Satir:' + (index+1)})
				})
			}else if(data.docTypeCode=='URETIMDENGIRIS'){
				data.docLine.forEach((e,index)=>{
					var bFound=false
					if(proOrder.item.toString()!=e.item._id.toString()){
						proOrder.outputSummary.forEach((e2)=>{
							if(e.item._id.toString()==e2.item.toString()){
								bFound=true
								return
							}
						})
					}else{
						bFound=true
					}

					if(bFound==false)
						return next({code:'WRONG_DATA',message:'Uretim emrinde tanımsız mamul olamaz. Satir:' + (index+1)})
				})
			}
			cb(data)
		}
	})

}

function fazlaliklariTemizleDuzelt(data){
	if(data.docTypeCode!='TRANSFER'){
		data.location2=data.location
		data.subLocation2=data.subLocation
	}
	if((data.subLocation || '')=='')
		data.subLocation=undefined
	if((data.subLocation2 || '')=='')
		data.subLocation2=undefined

	if(data.docLine){
		data.docLine.forEach((e)=>{

			if((e.pallet || '')==''){
				e.pallet=undefined
			}else{
				if((e.pallet._id || '')=='')
					e.pallet=undefined
			}

			if((e.color || '')==''){
				e.color=undefined
			}else{
				if((e.color._id || '')=='')
					e.color=undefined
			}

			if((e.pattern || '')==''){
				e.pattern=undefined
			}else{
				if((e.pattern._id || '')=='')
					e.pattern=undefined
			}

			if((e.size || '')==''){
				e.size=undefined
			}else{
				if((e.size._id || '')=='')
					e.size=undefined
			}


		})
	}
	return data
}

function deleteItem(dbModel, member, req, res, next, cb){
	if(req.params.param1==undefined)
		return error.param1(req, next)
	var data = req.body || {}
	data._id = req.params.param1
	dbModel.inventory_fiches.removeOne(member,{ _id: data._id},(err,doc)=>{
		if(dberr(err,next)){
			cb(null)
		}
	})
}
