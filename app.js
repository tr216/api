global.fs=require('fs')
global.path=require('path')
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var logger = require('morgan')
var favicon = require('serve-favicon')
var methodOverride = require('method-override')


global.__root=__dirname

global.util = require('./bin/util')
global.privateConfig={}
if(fs.existsSync('./private-config.json')){
	global.privateConfig=require('./private-config.json')
}

global.mail=require('./bin/mail')



var indexRouter = require('./routes/index')
var dbLoader = require('./db/db-loader')

global.fileImporter = require('./lib/file_importer')
global.documentHelper = require('./lib/document_helper')

var app = express()
var cors = require('cors')
app.use(cors())
var flash = require('connect-flash')

app.use(logger('dev'))
app.use(bodyParser.json({limit: "100mb"}))
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, parameterLimit:50000}))
app.use(cookieParser())
app.use(methodOverride())

indexRouter(app)
testControllers(false)

app.set('name',require('./package').name)
app.set('version',require('./package').version)
app.set('port',config.httpserver.port)



process.on('uncaughtException', function (err) {
	errorLog('Caught exception: ', err)
	
	if(config.status!='development'){
		mail.sendErrorMail(`Err ${config.status} ${app.get('name')}`,err,(mailErr,info)=>{
			if(mailErr)
				console.log(`mailErr:`,mailErr)
			console.log(`mail info:`,info)
			// process.exit(0)
		})
	}
})

module.exports=(cb)=>{
	dbLoader((err)=>{
		if(!err){
			
			global.taskHelper=require('./bin/taskhelper')
			global.services=require('./services/services.js')
			global.services.start(()=>{})
			global.eDespatchService = require('./bin/rest-helper')(config.eDespatchService.url)
			global.eInvoiceService = require('./bin/rest-helper')(config.eInvoiceService.url)
			global.posDeviceService = require('./bin/rest-helper')(config.posDeviceService.url)
			global.connectorService = require('./bin/rest-helper')(config.connectorService.url)
			
			cb(null,app)

		}else{
			cb(err)
		}

	})
}


/* [CONTROLLER TEST] */
function testControllers(log){
	moduleLoader(path.join(__dirname,'controllers'),'.controller.js',(log?'master controllers testing':''),(err,holder)=>{
		if(err)
			throw err
		else{
			eventLog(`test master controllers OK ${Object.keys(holder).length.toString().yellow}`)
			moduleLoader(path.join(__dirname,'controllers/system'),'.controller.js',(log?'system controllers testing':''),(err,holder)=>{
				if(err)
					throw err
				else{
					eventLog(`test system controllers OK ${Object.keys(holder).length.toString().yellow}`)
					moduleLoader(path.join(__dirname,'controllers/repo'),'.controller.js',(log?'system controllers testing':''),(err,holder)=>{
						if(err)
							throw err
						else
							eventLog(`test repository controllers OK ${Object.keys(holder).length.toString().yellow}`)
					})
				}
			})
		}
	})
}