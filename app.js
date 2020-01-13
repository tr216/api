require('./eventlog.js');

global.express = require('express');
global.path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
global.colors = require('colors');
global.os = require('os');


require("tls").DEFAULT_MIN_VERSION = 'TLSv1';

// var tls=require("tls");
// console.log('tls:',tls);

// process.exit(1);


global.uuid = require('node-uuid');
global.path_module = require('path');

global.config = require('./config.json');
if(process.argv.length>=3){
    if(process.argv[2]=='localhost' || process.argv[2]=='-l'){
        global.config = require('./config_local.json');
    }
}


global.fs=require('fs');

global.mrutil = require('./lib/mrutil.js');



global.ttext = require('./lib/language.js');
global.passport = require('./lib/passport.js');
global.passportRepo = require('./lib/passport_repo.js');
global.rootPath=__dirname;
global.eInvoiceHelper=require('./lib/einvoice_helper.js');
global.fileImporter=require('./lib/file_importer.js');

var app = express();
var cors = require('cors');
app.use(cors());
//var passport = require('passport');
//var expressSession = require('express-session');
var flash = require('connect-flash');


// view engine setup
// app.engine('ejs', engine);
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.set('port', config.httpserver.port);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

//app.use(expressSession({secret: 'mySecretKey' , resave:false , saveUninitialized:true}));


app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

app.use(cookieParser());
eventLog(path.join(__dirname, 'downloads'));

app.use('/downloads',express.static(path.join(__dirname, 'downloads')));
// app.use(passport.initialize());
// app.use(passport.session());
app.use(flash());



require('./lib/loader_db.js')((err)=>{
  if(!err){
    require('./lib/loader_api_v1.js')(app,(err)=>{
      if(!err){
        global.services=require('./services/services.js');
        
      }else{
        eventLog('loader_api_v1.js ERROR:',err);
      }
    });
  }else{
    eventLog('loader_db.js ERROR:',err);
  }
});






//============= HTTP SERVER ==================
//var debug = require('debug')('node-sbadmin:server');
var http = require('http');



var server = http.createServer(app);


server.listen(config.httpserver.port);
server.on('error', onError);
server.on('listening', onListening);



function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
}

// ==========HTTP SERVER /===========



process.on('uncaughtException', function (err) {
    errorLog('Caught exception: ', err);
});


