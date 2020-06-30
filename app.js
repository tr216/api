require('./eventlog.js')
eventLog('starting')
global.express = require('express')
global.path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
global.colors = require('colors')
global.os = require('os')

global.uyumsoftVkn='9000068418'

require("tls").DEFAULT_MIN_VERSION = 'TLSv1'


global.uuid = require('node-uuid')
global.path_module = require('path')
global.fs=require('fs')

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



global.dbType=require('./lib/db_object_types.js')
global.mrutil = require('./lib/mrutil.js')
global.printHelper = require('./lib/print_helper.js')




global.ttext = require('./lib/language.js')
global.passport = require('./lib/passport.js')
global.passportRepo = require('./lib/passport_repo.js')
global.rootDir=__dirname
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
app.use(bodyParser.json({limit: "500mb"}))
app.use(bodyParser.urlencoded({limit: "500mb", extended: true, parameterLimit:50000}))

app.use(cookieParser())

app.use('/downloads',express.static(path.join(__dirname, 'downloads')))
app.use(flash())


require('./lib/loader_db.js')((err)=>{
	if(!err){
		require('./lib/loader_api_v1.js')(app,(err)=>{
			if(!err){
				global.services=require('./services/services.js')
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
			}else{
				errorLog('loader_api_v1.js ERROR:',err)
			}
		})
	}else{
		errorLog('loader_db.js ERROR:',err)
	}
})







//============= HTTP SERVER ==================
//var debug = require('debug')('node-sbadmin:server')
var http = require('http')



var server = http.createServer(app)


server.listen(config.httpserver.port)
server.on('error', onError)
server.on('listening', onListening)



function normalizePort(val) {
	var port = parseInt(val, 10)

	if (isNaN(port)) {
		// named pipe
		return val
	}

	if (port >= 0) {
		// port number
		return port
	}

	return false
}


function onError(error) {
	if (error.syscall !== 'listen') {
		throw error
	}

	var bind = typeof port === 'string'
	? 'Pipe ' + port
	: 'Port ' + port

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
		console.error(bind + ' requires elevated privileges')
		process.exit(1)
		break
		case 'EADDRINUSE':
		console.error(bind + ' is already in use')
		process.exit(1)
		break
		default:
		throw error
	}
}

function onListening() {
	var addr = server.address()
	var bind = typeof addr === 'string'
	? 'pipe ' + addr
	: 'port ' + addr.port
	//debug('Listening on ' + bind)
}

// ==========HTTP SERVER /===========


if(config.status!='dev'){
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
