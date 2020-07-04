global.apiv1_repo={}

var protectedFields=require(path.join(rootDir,'lib','protected-fields.json'))

function setClientAPIFunctions(app){
   
    
    app.all('/api/v1/:dbId/:func', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })
    app.all('/api/v1/:dbId/:func/:param1', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })

    app.all('/api/v1/:dbId/:func/:param1/:param2', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })

    app.all('/api/v1/:dbId/:func/:param1/:param2/:param3', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })

    function setAPIFunctions(req, res,next){
        res.set({
            'Content-Type': 'application/json; charset=utf-8'
        })

        if (apiv1_repo[req.params.func] == undefined) {
            return next()
        } else {
            passportRepo(req,res,(err,data)=>{
                if(!err){
                	var member = data.member
                    if((req.method=="POST" || req.method=="PUT") && protectedFields[req.params.func]!=undefined){
                        req.body=mrutil.deleteObjectFields(req.body,protectedFields[req.params.func].inputFields)
                    }
                    apiv1_repo[req.params.func](repoDb[req.params.dbId],member, req, res, function(result) {
                        if(result==null){
                            res.json({})
                        }else if(result.file!=undefined){
                            downloadFile(result.file,req,res)
                        }else{
                            if(result['success']!=undefined){
                                if(result.success==false){
                                    res.status(403).json(result)
                                }else{
                                    if(protectedFields[req.params.func]!=undefined && result['data']!=undefined){
                                        if(Array.isArray(result.data)){
                                        	result.data.forEach((e)=>{
                                        		e=mrutil.deleteObjectFields(e,protectedFields[req.params.func].outputFields)
                                        	})
                                            
                                        }else{
                                            if(result.data.hasOwnProperty('docs')){
                                            	result.data.docs.forEach((e)=>{
                                            		e=mrutil.deleteObjectFields(e,protectedFields[req.params.func].outputFields)
                                            	})
                                            }
                                            result.data=mrutil.deleteObjectFields(result.data,protectedFields[req.params.func].outputFields)
                                        }
                                        
                                    }
                                    res.status(200).json(result)
                                }
                            }else{
                                res.status(200).json(result)
                            }
                        }
                        
                    })
                }else{
                    res.status(403).json({success:false,error:err})
                }
            })
            
        }
    }
}

function load(app,cb){
	moduleLoader(path.join(__dirname, 'api'),'.controller.js','client api',(err,holder)=>{
		if(!err){
			global.apiv1_repo=holder
			Object.keys(holder).forEach((e)=>{
				if(protectedFields[e]==undefined){
                    protectedFields[e]=protectedFields.standart;
                }
			})
			setClientAPIFunctions(app)
			cb(null)
		}else{
			console.error('cb err:',err)
			cb(err)
		}
	})
}

module.exports=(app)=>{
	return {
		load:(cb)=>load(app,cb)
	}
}
