//============= HTTP SERVER ==================
module.exports = (app,callback)=>{
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

		

		// handle specific listen errors with friendly messages
		switch (error.code) {
			case 'EACCES':
			console.error('port:',config.httpserver.port,' requires elevated privileges')
			process.exit(1)
			break
			case 'EADDRINUSE':
			console.error('port:',config.httpserver.port,' is already in use')
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
		console.log('Listening on ' + bind)
		if(callback)
			callback(null)
	}
}
// ==========HTTP SERVER /===========
