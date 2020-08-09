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
function getSettings(dbModel, member, req, res, next, cb){
	db.dbdefines.findOne({_id:dbModel._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				var obj={
					default:fs.readFileSync(path.join(__root,'db/repo.resources','repodb-settings.json'),'utf8'),
					user:(doc.settings || {})
				}
				cb(obj)
			}
		}
	})
}


function save(dbModel, member, req, res, next, cb){
	var data = req.body || {}
	db.dbdefines.findOne({_id:dbModel._id},(err,doc)=>{
		if(dberr(err,next)){
			if(dbnull(doc,next)){
				doc.settings=data

				doc.save((err,doc2)=>{
					if(dberr(err,next)){
						var obj={
							default:fs.readFileSync(path.join(__root,'db/repo.resources','repodb-settings.json'),'utf8'),
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
				doc.settings=null
				doc.save((err,doc2)=>{
					if(dberr(err,next)){
						var obj={
							default:fs.readFileSync(path.join(__root,'db/repo.resources','repodb-settings.json'),'utf8'),
							user:(doc2.settings || {})
						}
						cb(obj)
					}
				})
			}
		}
	})
}
