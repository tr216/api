require('./eventlog.js')
eventLog('starting')
global.express = require('express')
global.path = require('path')
global.fs=require('fs')

var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
global.dbLoader=require('./db/db-loader')

global.colors = require('colors')
global.os = require('os')

global.uyumsoftVkn='9000068418'

require("tls").DEFAULT_MIN_VERSION = 'TLSv1'

global.uuid = require('node-uuid')


global.config = require('./config.json')
global.config['status']='dist'

if(process.argv.length>=3){
	if(process.argv[2]=='localhost' || process.argv[2]=='-l'){
		global.config = require('./config-local.json')
		global.config['status']='dev'
	}
}else if(fs.existsSync('./config-test.json')){
	global.config = require('./config-test.json')
	global.config['status']='test'
}

// global.dbType=require('./lib/db_object_types.js')
global.mrutil = require('./lib/mrutil.js')
global.printHelper = require('./lib/print_helper.js')


global.ttext = require('./lib/language.js')
global.passport = require('./lib/passport.js')
global.passportRepo = require('./lib/passport_repo.js')
global.rootDir=__dirname
global.masterDir=path.join(__dirname,'master')
global.clientDir=path.join(__dirname,'client')

global.WcfHelper=require('./lib/wcf-helper.js').WcfHelper
global.documentHelper=require('./lib/document_helper.js')
// global.eDespatchHelper=require('./lib/edespatch_helper.js')
global.fileImporter=require('./lib/file_importer.js')

var app = express()
var cors = require('cors')
app.use(cors())
var flash = require('connect-flash')

app.set('port', config.httpserver.port)

app.use(logger('dev'))
app.use(bodyParser.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}))

app.use(cookieParser())

app.use('/downloads',express.static(path.join(__dirname, 'downloads')))
app.use(flash())

var http=require('./http-server.js')
http(app)

global.master=require('./master/master.js')(app)
global.client=require('./client/client.js')(app)

dbLoader((err)=>{
	master.load((err)=>{
		if(!err){
			eventLog('master.module loaded')
			client.load((err)=>{
				if(!err){
					eventLog('client.modules loaded')
				}
				switch(config.status){
					case 'test':
					eventLog('API is running on '.yellow + 'test'.cyan + ' platform.'.yellow)
					break
					case 'dev':
					eventLog('API is running on '.yellow + 'development'.cyan + ' platform.'.yellow)
					break
					case 'dist':
					eventLog('API is running '.yellow + 'release'.red + ' mode.'.yellow)
					break
				}
				handlerApi(app)
			})
		}else{
			errorLog('master module error:',err)
		}
		
	})
})



// client.apiLoader(app).load((err)=>{
// 	if(!err){
// 		eventLog('client api loaded')
// 		master.apiLoader(app).load((err)=>{
// 			if(!err){
// 				eventLog('master api loaded')
// 			}else{
// 				errorLog('master.apiLoader error:',err)
// 			}
// 		})
// 	}else{
// 		errorLog('client.apiLoader error:',err)
// 	}
// })

//global.client=require('./client/client.js')(app)

// require('./lib/loader_db.js')((err)=>{
// 	if(!err){
// 		require('./lib/loader_api_v1.js')(app,(err)=>{
// 			if(!err){
// 				global.services=require('./services/services.js')
// 				switch(config.status){
// 					case 'test':
// 					eventLog('API is running on '.yellow + 'test'.cyan + ' platform.'.yellow)
// 					break
// 					case 'dev':
// 					eventLog('API is running on '.yellow + 'development'.cyan + ' platform.'.yellow)
// 					break
// 					case 'dist':
// 					eventLog('API is running '.yellow + 'release'.red + ' mode.'.yellow)
// 					break
// 				}
// 			}else{
// 				errorLog('loader_api_v1.js ERROR:',err)
// 			}
// 		})
// 	}else{
// 		errorLog('loader_db.js ERROR:',err)
// 	}
// })

	

function handlerApi(app){
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        eventLog(req.params)
        var err = new Error('Not Found')
        err.status = 404
        //next(err)
        res.status(err.status)
        res.end('{success:false,error: {code:404,message:"' + err.message + '"}}')
    })

    if (config.status == 'dev') {
        app.use(function(err, req, res, next) {
          res.status(err.status || 500)
          eventLog(err)
          res.end('{success:false,error: {code:500,message:"' + err.message + '"}}')
        })
    }


    app.use(function(err, req, res, next) {
        res.status(err.status || 500)
        res.end('{success:false,error: {code:500,message:"' + err.message + '"}}')
    })
}


if(config.status!='dev111'){
	process.on('uncaughtException', function (err) {
		errorLog('Caught exception: ', err)
	})
}




// // run inline programs

// runNodeJs(path.join('./services','e-despatch','e-despatch.js'),(err,data)=>{
//   if(!err){
//     console.log('data:',data)
//   }else{
//     console.error(err)
//   }
// })
