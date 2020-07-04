var stats = fs.statSync(path.join(rootDir,'app.js'))
var appJsModifiedDate=(new Date(stats.mtime)).yyyymmddhhmmss() 

var protectedFields=require(path.join(rootDir,'lib','protected-fields.json'))
global.apiv1 = {}
global.apiv1_system = {}

function setMasterAPIFunctions(app){
    app.all('/api', function(req, res) {
        res.status(200).json({success: true, data:'Welcome to TR216.master API V1. Last modified:' + appJsModifiedDate + '. Your path:/api ,Please use: /api/v1/[:dbId]/:func/[:param1]/[:param2]/[:param3] . Methods: GET, POST, PUT, DELETE'})
    })


    app.all('/api/v1', function(req, res) {
        res.status(200).json({success: true, data:'Welcome to TR216.master API V1. Last modified:' + appJsModifiedDate + '. Your path:/api/v1 ,Please use: /api/v1/[:dbId]/:func/[:param1]/[:param2]/[:param3] .Methods: GET, POST, PUT, DELETE'})
    })
   
    app.all('/api/v1/:func', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })
    app.all('/api/v1/:func/:param1', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })

    app.all('/api/v1/:func/:param1/:param2', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })

    app.all('/api/v1/:func/:param1/:param2/:param3', function(req, res,next) {
        setAPIFunctions(req,res,next)
    })

    function setAPIFunctions(req, res,next){
        res.set({
            'Content-Type': 'application/json; charset=utf-8'
        })

        if (apiv1[req.params.func] == undefined) {
            return next()
        } else {
            passport(req,res,(err,member)=>{
                if(!err){
                    if((req.method=="POST" || req.method=="PUT") && protectedFields[req.params.func]!=undefined){
                        req.body=mrutil.deleteObjectFields(req.body,protectedFields[req.params.func].inputFields)
                    }
                    apiv1[req.params.func](member, req, res, function(result) {
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


function setSystemAPIFunctions(app){
    app.all('/api/v1/system/:func', function(req, res) {
        setAPIFunctions(req,res)
    })
    app.all('/api/v1/system/:func/:param1', function(req, res) {

        setAPIFunctions(req,res)
    })

    app.all('/api/v1/system/:func/:param1/:param2', function(req, res) {
        setAPIFunctions(req,res)
    })

    app.all('/api/v1/system/:func/:param1/:param2/:param3', function(req, res) {
        setAPIFunctions(req,res)
    })
    
    function setAPIFunctions(req,res){
        res.set({
            'content-type': 'application/json charset=utf-8'
        })

        if (apiv1_system[req.params.func] == undefined) {
            res.status(403).json({success: false, error: {code: 'UNKNOWN_FUNCTION', message: 'Unknown function'}})
        } else {
            passport(req,res,(err,member)=>{
                if(!err){
                    eventLog('req.params:',req.params)
                    eventLog('member:',member)
                    if(member.isSysUser!=true) return res.status(403).json({success: false, error: {code: 'AUTHENTICATION_FAILED', message: 'Authentication failed'}})
                    
                    if((req.method=="POST" || req.method=="PUT") && protectedFields[req.params.func]!=undefined){
                        req.body=mrutil.deleteObjectFields(req.body,protectedFields[req.params.func].inputFields)
                    }
                    apiv1_system[req.params.func](member, req, res, function(result) {
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
	moduleLoader(path.join(__dirname, 'api'),'.controller.js','master api',(err,holder)=>{
		if(!err){
			global.apiv1=holder
			Object.keys(holder).forEach((e)=>{
				if(protectedFields[e]==undefined){
                    protectedFields[e]=protectedFields.standart;
                }
			})
			setMasterAPIFunctions(app)
			moduleLoader(path.join(__dirname, 'api','system'),'.controller.js','system api',(err,holder)=>{
				if(!err){
					global.apiv1_system=holder
					Object.keys(holder).forEach((e)=>{
						if(protectedFields[e]==undefined){
		                    protectedFields[e]=protectedFields.standart;
		                }
					})
					setSystemAPIFunctions(app)
					cb(null)
				}else{
					cb(err)
				}
			})
		}else{
			cb(err)
		}
	})

}
module.exports=(app)=>{
	
	return {
		load:(cb)=>load(app,cb)
	}
}
