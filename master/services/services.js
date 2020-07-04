
exports.tr216LocalConnector=require('./local-connector/local-connector.js')

exports.start=(cb)=>{
	exports.tr216LocalConnector.start(()=>{})
	cb(null)
}
