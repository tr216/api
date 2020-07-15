global.config=require('./config').release
config.status='release'
global.privateConfig=require('./private-config.json')

var log=require('./bin/event-log')

require('./app')((err,app)=>{
	if(!err){
		var http=require('./bin/http-server.js')(app)
		eventLog(`application name:\t ${app.get('name').yellow}`)
		eventLog(`version:\t\t ${app.get('version').yellow}`)
		eventLog(`http port:\t ${app.get('port').toString().yellow}`)
		eventLog(`running mod:\t ${config.status.cyan}`)
	}else{
		errorLog(err)
	}
})


