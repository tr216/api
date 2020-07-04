
var apiLoader=require('./api-loader.js')
exports.services=require('./services/services.js')

function load(app,cb){
	apiLoader(app).load((err)=>{
		if(!err){
			exports.services.start((err)=>{
				cb(err)
			})
		}else{
			cb(err)
		}
	})
}

module.exports = (app)=>{
	return {
		db:{},
		services:exports.services,
		load:(cb)=>load(app,cb)
	}
}