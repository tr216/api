

var util = require('util');
var minVersion='01.00.0002';


var net = require('net');
var tcpPORT = config.connector_service.port;
var tcpConnectorClients = [];
var connectorClientRequestQueue=[];
net.Socket.prototype.clientid = '';
net.Socket.prototype.connectorId = '';
net.Socket.prototype.connectorPass = '';
net.Socket.prototype.version = '';
net.Socket.prototype.uuid = '';
net.Socket.prototype.lastcheck = new Date();


function request_CONNECT(sc,data){
    

    db.etulia_connectors.findOne({connectorId:data.connectinfo.id,connectorPass:data.connectinfo.password,uuid:data.connectinfo.uuid},function(err,doc){
        if(err){
            mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,data.command,{success:false,error:{code:'REJECTED',message:'Connection failed'}},data.requestid));
        }else{
            if(doc==null){
                console.log('data.connectinfo:',data.connectinfo);
                mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,data.command,{success:false,error:{code:'REJECTED',message:'ID or PASSWORD was wrong'}},data.requestid));
                return;                
            }
            
            for(var i=0;i<tcpConnectorClients.length;i++){
                console.log('tcpConnectorClients[' + i + '].connectorId:',tcpConnectorClients[i].connectorId);
            }
            var bFound= false;
            for(var i=0;i<tcpConnectorClients.length;i++){
                
                if(tcpConnectorClients[i].connectorId==data.connectinfo.id && tcpConnectorClients[i].connectorPass==data.connectinfo.password  && tcpConnectorClients[i].uuid==data.connectinfo.uuid){
                //if(tcpConnectorClients[i].connectorId==sc.connectorId && tcpConnectorClients[i].connectorPass==sc.connectorPass  && tcpConnectorClients[i].uuid==sc.uuid){
                    bFound=true;
                    
                    tcpConnectorClients[i].lastcheck=new Date();
                    mrutil.socketwrite(tcpConnectorClients[i],mrutil.resPackage(data.connectinfo,'CONNECT',{success:true,data:'CONNECTED'},data.requestid))
                    //mrutil.console('[local-connector] request_CONNECT_r:' + mrutil.resPackage(data.connectinfo,'CONNECT',{success:true,data:'CONNECTED'},data.requestid));
                    break;
                }
            }

            if(bFound==false){
                sc.connectorId=data.connectinfo.id;
                sc.connectorPass=data.connectinfo.password;
                sc.uuid=data.connectinfo.uuid;
                sc.lastcheck=new Date();
                sc.version=data.params.version || '';
                mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'CONNECT',{success:true,data:'CONNECTED'},data.requestid))
                //mrutil.console('[local-connector] request_CONNECT:' + mrutil.resPackage(data.connectinfo,'CONNECT',{success:true,data:'CONNECTED'},data.requestid));
            }
            doc.lastOnline=new Date();
            doc.version=data.params.version || '';
            doc.platform=data.params.platform || '';
            doc.architecture=data.params.architecture || '';
            doc.release=data.params.release || '';
            doc.hostname=data.params.hostname || '';
            doc.lastError='';
            
            doc.save((err,doc2)=>{
                if(!err){
                    if(data.params.version<minVersion){
                        var params={url:config.host.url + '/downloads/localconnector.zip',version:minVersion}
                        console.log('connectore update komutu gonder');
                        exports.sendCommand(data.connectinfo,'UPDATE',params,(result)=>{
                            console.log('UPDATE result:',result);
                            if(!result.success){
                                if(result.error!=undefined){
                                    doc2.lastError=result.error.code + ' - ' + result.error.message;
                                    doc2.save();
                                }
                                
                            }
                            
                        });
                        
                    }
                }
            });
            
           
        }
    });
}


function request_NEWPASS(sc,data){

    if(data.params.newPassword==undefined){
        mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR0',message:'newPassword is required.'}},data.requestid));
        //sc.end();
    }else{
        db.etulia_connectors.findOne({connectorId:sc.connectorId,connectorPass:sc.connectorPass,uuid:sc.uuid},function(err,doc){
            if(err){
                mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR1',message:err.message}},data.requestid));
                //sc.end();
            }else{
                
                if(doc==null){
                    mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR2',message:'ID or PASSWORD was wrong'}},data.requestid));
                    //sc.end();
               
                }else{
                    sc.lastcheck=new Date();
                    doc.lastOnline=new Date();
                    doc.connectorPass=data.params.newPassword;
                    

                    doc.save(function(err,doc2){
                        if(!err){
                            var result={success:true,data:{id:doc2.connectorId,password:doc2.connectorPass,uuid:doc2.uuid}};
                            mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'NEW_PASS',result,data.requestid));
                            sc.connectorPass=doc2.connectorPass;
                            sc.uuid=doc2.uuid;
                            //sc.end();
                        }else{
                            
                            mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR',message:err.message}},data.requestid));
                            //sc.end();
                        }
                        
                        
                    });
                }
                
                
            }
        });
    }
}


function request_NEWID(sc,data){
    var d={connectorPass: mrutil.randomNumber(1001,9998).toString(),uuid:uuid.v4(), ip:sc.remoteAddress};

    var newresonance=new db.etulia_connectors(d);

    newresonance.save((err,doc)=>{
        if(err){
            var result={success:false,error:{code:err.name,message:err.message}};
            mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,data.command,result,data.requestid));

        }else{
            sc.connectorId=doc.connectorId;
            sc.connectorPass=doc.connectorPass;
            sc.uuid=doc.uuid;
            sc.lastcheck=new Date();
            mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,data.command,{success:true,data:{id:doc.connectorId,password:doc.connectorPass,uuid:doc.uuid}},data.requestid));
        }
    });
}

function keepAlive(sc,data){
    
    db.etulia_connectors.findOne({connectorId:data.connectinfo.id,connectorPass:data.connectinfo.password,uuid:data.connectinfo.uuid},function(err,doc){
        if(err){
            
            mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'KEEPALIVE',{success:false,error:{code:'REJECTED',message:'Connection failed'}},data.requestid));
            //sc.end();
        }else{
            
            if(doc==null){
                
                mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'KEEPALIVE',{success:false,error:{code:'REJECTED',message:'ID or PASSWORD was wrong'}},data.requestid));
                //sc.end();
                return;                
            }
            sc.lastcheck=new Date();
            doc.lastOnline=new Date();
           
            
            console.log('keepAlive params:',data.params);
            doc.save(function(err,doc2){
                var result={success:true, data:(new Date()).yyyymmddhhmmss()};
                mrutil.socketwrite(sc,mrutil.resPackage(data.connectinfo,'KEEPALIVE',result,data.requestid));
                
            });
            
        }
    });
} 

var tcpserver = net.createServer(function (sc) {
    tcpConnectorClients.push(sc);
    sc.clientid = uuid.v4();// tcpConnectorClients.length;
    
    mrutil.console('[local-connector] client connected  ' + sc.remoteAddress + ',' + sc.remotePort);
    mrutil.console('[local-connector] client id :  ' + sc.clientid);
    mrutil.console('[local-connector] Total connections :  ' + tcpConnectorClients.length);
    var beep = require('beepbeep');
    //beep(1);
    //mrutil.console(JSON.stringify(mrconn.mrpackage('accept', 'whoareyou')));
    //sc.write("who are you");

    //mrutil.sendadminmail('Deneme', util.inspect(sc, { showHidden: false, depth: null }));

    sc.on('end', function () {
        mrutil.console('[local-connector] client disconnected .' + sc.clientid);
        destroyClient(sc);
        mrutil.console('[local-connector] Total connections :  ' + tcpConnectorClients.length);
    });
    // sc.on('connect', function () {
    //    mrutil.console('event:connect');
    // });

    sc.on('error', function (err) {
       
        mrutil.console('[local-connector] event:error ClientID:' + sc.clientid + '  Error:' + err.code + ' - ' + err.message);
        if(err.code=='ERR_STREAM_DESTROYED' || err.code=='ECONNRESET'){
            destroyClient(sc);
        }
        // for(var i=0;i<connectorClientRequestQueue.length;i++){
        //     if(connectorClientRequestQueue[i].requestid==ondata.requestid){
        //         connectorClientRequestQueue[i].callback(ondata);
        //         connectorClientRequestQueue.splice(i,1);
        //         break;
        //     }
        // }
    });


    var buffer = '';
    sc.on('data', function (data) {
        try {
            
            buffer += data.toString('utf8');

            var data2;
            if (buffer.charCodeAt(buffer.length - 1) == 0) {
                data2= mrutil.socketread(buffer.substring(0, buffer.length - 1)); 
                buffer='';
            }else{
                return;
            }

            var ondata=JSON.parse(data2);
            if(ondata.type=="REQUEST" || ondata.type=="request"){
                switch(ondata.command){
                    case 'CONNECT':
                        request_CONNECT(sc,ondata);
                    break;
                    case 'NEW_ID':
                        request_NEWID(sc,ondata);
                    break;
                    case 'NEW_PASS':
                        request_NEWPASS(sc,ondata);
                    break;
                    case 'KEEPALIVE':
                        keepAlive(sc,ondata);
                       
                        break;
                    default:
                        sc.lastcheck=new Date();
                        var result={success:false,error:{code:'UNKNOWN_COMMAND',message:'Unknown command:'}};
                        mrutil.socketwrite(sc,mrutil.resPackage(ondata.connectinfo,ondata.command,result,ondata.requestid));
                }

            }else if(ondata.type=="RESPONSE" || ondata.type=="response"){
                for(var i=0;i<connectorClientRequestQueue.length;i++){
                    if(connectorClientRequestQueue[i].requestid==ondata.requestid){
                        
                        connectorClientRequestQueue[i].callback(ondata.data);
                        connectorClientRequestQueue.splice(i,1);
                        break;
                    }
                }

            }else{
                mrutil.console('[local-connector] Error data is :', data2);
            }
            
        } catch ( err ) {
            console.log(err);
        }
            
    });
   
});

tcpserver.listen(tcpPORT, function (err) {
    if (err) {
        mrutil.console('[local-connector] Error:' + err.code);
        if (err.code == 'EADDRINUSE') {
            mrutil.console('[local-connector] Address in use, retrying...');
            setTimeout(function () {
                tcpserver.close();
                tcpserver.listen(tcpPORT);
            }, 3000);
        }
    } else {
        mrutil.console('[local-connector] Resonance service running on ' + tcpPORT + ' TCP port.');
    }

    
    
});



// Cleaner task
setInterval(function () {
    
    Cleaner_connectorClientRequestQueue();
    Cleaner_resonanceClient();
    mrutil.console('[local-connector] Cleaner tasks worked.');
}, 15000);


// 5 dk uzerindeki istekleri temizler
function Cleaner_connectorClientRequestQueue(){
    var i=0;
    while(i<connectorClientRequestQueue.length){
        if(connectorClientRequestQueue[i].requesttime<(new Date())){
            var datediff=((new Date())-connectorClientRequestQueue[i].requesttime)/1000;
            if(datediff>60){
                var timeoutresult={success:false,error:{code:'TIMEOUT', message:'Timeout'}};
                connectorClientRequestQueue[i].callback(timeoutresult);
                connectorClientRequestQueue.splice(i,1);
            }else{
                i++;
            }
        }else{
            //if something was wrong. request time bigger than now
            var datediff=(connectorClientRequestQueue[i].requesttime-(new Date()))/1000;
            if(datediff>10){
                var result={success:false,error:{code:'TIMESYNCERROR', message:'Time sync error'}};
                connectorClientRequestQueue[i].callback(result);
                connectorClientRequestQueue.splice(i,1);
            }else{
                i++;
            }
        }
    }
}

// 5 dk uzerindeki istekleri temizler
function Cleaner_resonanceClient(){
    var i=0;
    while(i<tcpConnectorClients.length){
        if(tcpConnectorClients[i].lastcheck<(new Date())){
            var datediff=((new Date())-tcpConnectorClients[i].lastcheck)/1000;
            if(datediff>120){
                // tcpConnectorClients[i].close(function(){
                    
                // });
                tcpConnectorClients[i].destroy();
                delete tcpConnectorClients[i];
                tcpConnectorClients.splice(i,1);
            }else{
                i++;
            }
        }else{
            i++;
        }
    }
}

function destroyClient(sc){
    var i=0;
    while(i<tcpConnectorClients.length){
        if(tcpConnectorClients[i].clientid==sc.clientid){
            tcpConnectorClients[i].destroy();
            delete tcpConnectorClients[i];
            tcpConnectorClients.splice(i,1);
            return;
        }else{
            i++;
        }
    }
}

exports.getResonanceClientList = function () {
    return tcpConnectorClients;
    // var userList = [];
    // for (var i = 0; i < tcpConnectorClients.length; i++) {
    //     userList.push({ clientid : tcpConnectorClients[i].clientid ,resonanceid : tcpConnectorClients[i].connectorId, connectorPass : tcpConnectorClients[i].connectorPass, ipaddress : tcpConnectorClients[i].remoteAddress , port : tcpConnectorClients[i].remotePort });
    // }
    // return userList;
};

exports.getResonanceClientRequestQueue = function () {
    return connectorClientRequestQueue;
};


exports.sendCommand = function (connectinfo,command,params,callback) {
    
    var summary='';
    var bFound=false;
    if(connectinfo.id!=undefined && connectinfo.connectorId==undefined) connectinfo.connectorId=connectinfo.id;
    if(connectinfo.password!=undefined && connectinfo.connectorPass==undefined) connectinfo.connectorPass=connectinfo.password;
    for(var i=tcpConnectorClients.length-1;i>=0;i--){
        if(tcpConnectorClients[i].connectorId==connectinfo.connectorId && tcpConnectorClients[i].connectorPass==connectinfo.connectorPass ){
            
            var reqid=uuid.v4();
            mrutil.socketwrite(
                tcpConnectorClients[i],
                mrutil.reqPackage(
                    {id:tcpConnectorClients[i].connectorId,password:tcpConnectorClients[i].connectorPass,uuid:tcpConnectorClients[i].uuid},
                    command,params,reqid
                ),function(err){
                    
                    if(!err){
                        
                        connectorClientRequestQueue.push({requestid:reqid, requesttime:(new Date()), callback:callback});
                    }else{
                        
                        callback({success:false,error:{code:'NOT_CONNECTED',message:"Connector is not connected"}});
                    }
                });

           
            bFound=true;
            
            break;
        }
    }

    if(bFound==false){
        console.log('resonance bagli degil');
        callback({success:false,error:{code:'NOT_CONNECTED',message:'Connector is not connected'}});
    }
};

 exports.mssqlQuery = function (connector,databaseConnection,query,callback) {
     exports.sendCommand(connector,'MSSQL_QUERY',{connection:databaseConnection,query:query},callback);

}

exports.mysqlQuery = function (connector,databaseConnection,query,callback) {
     exports.sendCommand(connector,'MYSQL_QUERY',{connection:databaseConnection,query:query},callback);

}

exports.run=require('./run.js');