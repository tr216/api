//exports.dbLoader=require('./client.db.js')
exports.apiLoader=require('./client.api.js')

function load(app,cb){
	
	exports.apiLoader(app).load((err)=>{
		if(!err){
				Object.keys(repoDb).forEach((dbId)=>{
					console.log('repoDb[dbId].dbName:',repoDb[dbId].dbName)
			        if(repoDb[dbId]['services']==undefined){
			            repoDb[dbId]['services']=require('./services/client.services')
			            repoDb[dbId].services.start(repoDb[dbId]);
			        }
				});

		}else{
			cb(err)
		}
	})
		
}



module.exports = (app)=>{
	return {
		db:{},
		dbModels:{},
		load:(cb)=>load(app,cb)
	}
}