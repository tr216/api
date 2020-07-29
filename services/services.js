
// exports.tr216LocalConnector=require('./local-connector/local-connector.js')
exports.tasks=require('./tasks/tasks')

exports.start=(cb)=>{
	// exports.tr216LocalConnector.start(()=>{})
	Object.keys(repoDb).forEach((e)=>{
		exports.tasks.run(repoDb[e])
	})
	cb(null)
}
