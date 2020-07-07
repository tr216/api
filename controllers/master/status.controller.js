module.exports = (member,req, res, cb)=>{
	eDespatchService.get(null,'/',{},(err,data)=>{
		if(dberr(err)){
			cb({
				workingMode: config.status,
				eDespatchService:'working',
				repostoryCount:Object.keys(repoDb).length
			})
		}
	})
}

