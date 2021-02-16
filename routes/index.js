var express = require('express')
var router = express.Router()
var passport=require('./passport')
var protectedFields=require('./protected-fields.json')
var appJsModifiedDate=(new Date(fs.statSync(path.join(__dirname,'../app.js')).mtime)).yyyymmddhhmmss() 

module.exports=(app)=>{
	app.all('/', (req, res, next)=>{
		res.status(200).json({ success:true, 
			data:{
				name:app.get('name'),
				version:app.get('version')
			} 
		})
	})
	
	masterControllers(app)
	clientControllers(app)
	
	

	// catch 404 and forward to error handler
	app.use((req, res, next)=>{
		res.status(404).json({ success:false, error:{code:'404',message:'function not found'}})
	})

	app.use((err,req, res, next)=>{
		sendError(err,res)
	})
}


function clientControllers(app){
	app.all('/api/v1/:dbId/*', (req, res, next)=>{
		if(repoDb[req.params.dbId]==undefined){
				next()
			//throw Error(`db:'${req.params.dbId}' bulunamadi`)
		}else{
			next()
		}
	})

	
	app.all('/api/v1/:dbId/:func', (req, res, next)=>{
		setRepoAPIFunctions(req,res,next)
	})
	app.all('/api/v1/:dbId/:func/:param1', (req, res, next)=>{
		setRepoAPIFunctions(req,res,next)
	})
	app.all('/api/v1/:dbId/:func/:param1/:param2', (req, res, next)=>{
		setRepoAPIFunctions(req,res,next)
	})

	app.all('/api/v1/:dbId/:func/:param1/:param2/:param3', (req, res, next)=>{
		setRepoAPIFunctions(req,res,next)
	})

	function setRepoAPIFunctions(req,res,next){
		passport(req,res,(member)=>{
			var ctl=getRepoController(req.params.func)
			if(!ctl){
				return next()
			}
			ctl(repoDb[req.params.dbId],member,req,res,next,(data)=>{
				if(data==undefined)
					res.json({success:true})
				else if(data==null)
					res.json({success:true})
				else if(data.file!=undefined)
					downloadFile(data.file,req,res,next)
				else if(data.fileId!=undefined)
					downloadFileId(repoDb[req.params.dbId],data.fileId,req,res,next)
				else if(data.sendFile!=undefined)
					sendFile(data.sendFile,req,res,next)
				else if(data.sendFileId!=undefined)
					sendFileId(repoDb[req.params.dbId],data.sendFileId,req,res,next)
				else{
					data=clearProtectedFields(req.params.func,data)
					res.status(200).json({ success:true, data: data })
				}
			})
		})
		
	}

	function getRepoController(funcName){

		var controllerName=path.join(__dirname,'../controllers/repo',`${funcName}.controller.js`)
		if(fs.existsSync(controllerName)==false){
			//throw `'${funcName}' controller function was not found`
			return
		}else{
			return require(controllerName)
		}
	}
}

function masterControllers(app){
	app.all('/api', function(req, res) {
		res.status(200).json({success: true, data:`Welcome to TR216.master API V1. Last modified:${appJsModifiedDate}. Your path:/api ,Please use: /api/v1[/:dbId]/:func/[:param1]/[:param2]/[:param3] . Methods: GET, POST, PUT, DELETE`})
	})

	app.all('/api/v1', function(req, res) {
		res.status(200).json({success: true, data:`Welcome to TR216.master API V1. Last modified:${appJsModifiedDate}. Your path:/api/v1 ,Please use: /api/v1[/:dbId]/:func/[:param1]/[:param2]/[:param3] . Methods: GET, POST, PUT, DELETE`})
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
		passport(req,res,(member)=>{
			var ctl=getController(req.params.func)
			if(!ctl){
				return next()
			}
			ctl(member,req,res,next,(data)=>{
				
				if(data==undefined)
					res.json({success:true})
				else if(data==null)
					res.json({success:true})
				else if(data.file!=undefined)
					downloadFile(data.file,req,res,next)
				else if(data.fileId!=undefined)
					downloadFileId(db,data.fileId,req,res,next)
				else{
					data=clearProtectedFields(req.params.func,data)
					res.status(200).json({ success:true, data: data })
				}
			})
		})
	}

	function getController(funcName){

		var controllerName=path.join(__dirname,'../controllers/master',`${funcName}.controller.js`)
		if(fs.existsSync(controllerName)==false){
			//throw Error(`'${funcName}' controller function was not found`)
			return
		}else{
			return require(controllerName)
		}
	}
}

function sendError(err,res){
	var error={code:'403',message:''}
	if(typeof err=='string'){
		error.message=err
	}else{
		error.code=err.code || err.name || 'ERROR'
		if(err.message)
			error.message=err.message
		else
			error.message=err.name || ''
	}
	res.status(403).json({ success:false, error:error})
}

function clearProtectedFields(funcName,data,cb){
	if(protectedFields!=undefined){
		if(protectedFields[funcName]==undefined)
			protectedFields[funcName]=protectedFields['standart']

		if(data!=undefined){
			if(Array.isArray(data)){
				data.forEach((e)=>{
					e=util.deleteObjectFields(e,protectedFields[funcName].outputFields)
				})
				
			}else{
				if(data.hasOwnProperty('docs')){
					data.docs.forEach((e)=>{
						e=util.deleteObjectFields(e,protectedFields[funcName].outputFields)
					})
				}
				data=util.deleteObjectFields(data,protectedFields[funcName].outputFields)
			}
			return data
		}else{
			return data
		}
	}else{
		return data
	}
	
}


global.error={
	param1:function(req, next){
		next({code:'WRONG_PARAMETER', message:`function:[/${req.params.func}] [/:param1] is required`})
	},
	param2:function(req, next){
		next({code:'WRONG_PARAMETER', message:`function:[/${req.params.func}/${req.params.param1}] [/:param2] is required`})
	},
	method:function(req, next){
		next({code:'WRONG_METHOD', message:`function:${req.params.func} WRONG METHOD: ${req.method}`})
	},
	data:function(req, next,field){
		if(field){
			next({code:'WRONG_DATA', message:`"${field}" Yanlış ya da eksik veri`})

		}else{
			next({code:'WRONG_DATA', message:`Yanlış ya da eksik veri`})

		}
	}
}

