module.exports=(localConnectorDoc,data,callback)=>{

		switch(localConnectorDoc.connectionType){
			case 'mssql':
			case 'mysql':
			case 'file':
			case 'console':
			case 'js':
			case 'bat':
			case 'bash':
			case 'wscript':
			case 'cscript':
				runRendered(localConnectorDoc,data,callback);
				break;

			default:
				callback(null);
				break;
		}
	
}

function runRendered(localConnectorDoc,data,cb){
	if(typeof data=='string'){
		try{
			if(data==''){
				data={}
			}else{
				data=JSON.parse(data);
			}
			
		}catch(err){
			eventLog('err:',err);
			return cb({code:'PARSING_ERROR',message:err.message});
		}
		
	}

	
	if(localConnectorDoc.startFile!=undefined){
		if(localConnectorDoc.startFile.data!=undefined && localConnectorDoc.startFile.extension=='ejs'){
			render(localConnectorDoc,data,(err,renderedCode)=>{
				if(!err){
					
					var command='';
					var params={}

					switch(localConnectorDoc.connectionType){
						case 'mssql':
							command='MSSQL_QUERY';
							params={connection:localConnectorDoc.connection,query:renderedCode}
						break;
						case 'mysql':
							command='MYSQL_QUERY';
							params={connection:localConnectorDoc.connection,query:renderedCode}
						break;
						case 'console':
							command='CMD';
							params={connection:localConnectorDoc.connection,command:renderedCode}
						break;
						case 'js':
							command='JS';
							params={content:renderedCode}
						break;
						case 'bat':
							command='BAT';
							params={content:renderedCode}
						break;
						case 'wscript':
							command='WSCRIPT';
							params={content:renderedCode}
						break;
						case 'cscript':
							command='CSCRIPT';
							params={content:renderedCode}
						break;
						case 'bash':
							command='BASH';
							params={content:renderedCode}
						break;
						//case 'file':
						default:
							command='CMD';
							params={connection:localConnectorDoc.connection,command:renderedCode}
						break;
					}

					eventLog('js comut gonderildi.')
					services.tr216LocalConnector.sendCommand({id:localConnectorDoc.connectorId,password:localConnectorDoc.connectorPass}
						,command, params,(result)=>{
						
						if(result.success){
							
							cb(null,result);
						}else{
							cb(result.error,result);
						}
					});
					
				}else{
					cb({code:err.name,message:err.message});
				}
			});

			
		}else{
			
			cb({code:'START_FILE_ERROR',message:'startFile data yok veya uzantisi .ejs degil!'});
		}
		
	}else{
		
		cb({code:'START_FILE_ERROR',message:'startFile tanimlanmamis'});
	}

}

function render(localConnectorDoc,data,cb){
	try{
		let ejs = require('ejs');
		var renderedCode='';
		var includeCode='';
		var code=localConnectorDoc.startFile.data;
		code=code.replaceAll('include(','includeLocal(');

		//code +="\n";

		includeCode +="\n<% \nfunction includeLocal(fileName){ \n";
		includeCode +=" switch(fileName){  \n";
		localConnectorDoc.files.forEach((f)=>{
			if(localConnectorDoc.startFile._id.toString()!=f._id.toString()){
				includeCode +="	case '" + f.fileName + "' : \n";
				if(f.extension=='ejs') {
					includeCode +="	case '" + f.name + "' : \n";
					includeCode +="%>\n";
					includeCode += f.data; // ejs.render(f.data,data);
				}else if(f.type=='text/plain' || f.type=='application/json' || f.type=='text/javascript'){
					includeCode +="%>\n";
					includeCode +=f.data;
				}
				includeCode +="<% break; \r\n";
			}
		});
		includeCode +="	default: %> \n";
		includeCode +=" ";
		includeCode +="	<% break;\n";
		includeCode +=" }\n";
		includeCode +="} %> \n";
		code=includeCode + code;
		

		renderedCode=ejs.render(code,data);
		
		cb(null,renderedCode);
	}catch(err){
		eventLog(err);
		
		cb({code:err.name || 'EJS_RENDER_ERROR' ,name:err.name || 'EJS_RENDER_ERROR',message: err.message || err.toString()});
	}
	
}
