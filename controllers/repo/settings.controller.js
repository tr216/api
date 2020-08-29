module.exports = (dbModel, member, req, res, next, cb)=>{
	switch(req.method){
		case 'GET':
		getSettings(dbModel, member, req, res, next, cb)
		break
		case 'POST':
		case 'PUT':
		save(dbModel, member, req, res, next, cb)
		break
		case 'DELETE':
		deleteItem(dbModel, member, req, res, next, cb)
		break
		default:
		error.method(req, next)
		break
	}
}
var defaultSettings=fixJSON(fs.readFileSync(path.join(__root,'db/repo.resources','repodb-settings.json'),'utf8'))


function getSettings(dbModel, member, req, res, next, cb){
	db.dbdefines.findOne({_id:dbModel._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var obj={
					default:defaultSettings,
					settings:Object.assign({}, defaultSettings,doc.settings )
				}
				cb(obj)
			}
		}
	})
}


function save(dbModel, member, req, res, next, cb){
	var data = Object.assign({}, defaultSettings, req.body )
	console.log(`data:`,data)
	db.dbdefines.findOne({_id:dbModel._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var settings=doc.settings || {}

				if(settings.page==undefined)
					settings.page={}

				doc.settings=Object.assign({}, settings,data)
			
				if(data.page){
					for(let k in data.page){
						var sayfa={}
						sayfa=clone(data.page[k])
						for(let j in sayfa){
							if(Array.isArray(sayfa[j])){
								var dizi=[]
								sayfa[j].forEach((e)=>{
									if((e || '')!=''){
										dizi.push(e)
									}
								})
								sayfa[j]=dizi
							}
						}
						console.log(`${k}:`,sayfa)
						doc.settings.page[k]=sayfa
					}

				}else{
					//doc.settings.page={}
				}
				

				doc.save((err,doc2)=>{
					if(dberr(err,next)){
						var obj={
							default:defaultSettings,
							settings:doc2.settings,
							user:(doc2.settings || {})
						}
						cb(obj)
					}
				})
			}
		}
	})
}


function deleteItem(dbModel, member, req, res, next, cb){
	db.dbdefines.findOne({_id:dbModel._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				doc.settings=clone(defaultSettings)
				doc.save((err,doc2)=>{
					if(dberr(err,next)){
						var obj={
							default:defaultSettings,
							settings:doc2.settings
						}
						cb(obj)
					}
				})
			}
		}
	})
}
