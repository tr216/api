var BasicHttpBinding = require('wcf.js').BasicHttpBinding
var Proxy = require('wcf.js').Proxy
var timeout=180000
var parseString = require('xml2js').parseString

class WcfHelper {
	constructor(url,username,password,namespace){
		this.url=url
		this.username=username
		this.password=password 
		this.namespace=namespace
		this.binding = new BasicHttpBinding({ 
			SecurityMode: "TransportWithMessageCredential",
			MessageClientCredentialType: "UserName", 
			MaxBufferPoolSize : 20000000, 
			MaxBufferSize : 20000000, 
			MaxReceivedMessageSize : 20000000, 
			SendTimeout : new Date(0,0,0,12, 50, 50), 
			ReceiveTimeout : new Date(0,0,0,12, 50, 50)
		})
		

		this.proxy = new Proxy(this.binding, url)
		this.proxy.ClientCredentials.Username.Username = username
		this.proxy.ClientCredentials.Username.Password = password 
	}

	tryInterval=50000
	renameFunction

	body(value){
return `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
<s:Header />
<s:Body>
${value}
</s:Body>
</s:Envelope>`
	}

	queryParameter(query){
		if(!query) return ''
		var dizi=[]
		var value=''
		for(let k in query){
            if(k!='pageIndex' && k!='PageIndex' && k!='pageSize' && k!='PageSize'){
            	if(query[k]!==undefined){
	                if(query[k]!==null){
		                if(!Array.isArray(query[k])){
	                    	if(Object.keys(query[k]).indexOf('pageIndex')>-1 || Object.keys(query[k]).indexOf('pageSize')>-1 || Object.keys(query[k]).indexOf('PageIndex')>-1 || Object.keys(query[k]).indexOf('PageSize')>-1){
		                        dizi.push(`<s:${k} PageIndex="${(query[k].pageIndex || query[k].PageIndex || 0)}" PageSize="${(query[k].pageSize || query[k].PageSize || 10)}">${this.queryParameter(query[k])}</s:${k}>`)
		                    }else{
		                        dizi.push(`<s:${k}>${query[k].toString()}</s:${k}>`)
		                    }
		                }else{
		                    query[k].forEach((e)=>{
		                        dizi.push(`<s:${k}>${e.toString()}</s:${k}>`)
		                    })
		                }
            		}
                }
            }
        }
        dizi.forEach((e,index)=>{
        	value +=e + (index<dizi.length-1?'\n':'')
        })
        return value
	}

	queryContext(funcName, query){
		return this.body(`<s:${funcName} xmlns:s="http://tempuri.org/">
${this.queryParameter(query)}
</s:${funcName}>`)
	}

	tryCount=0

	send(funcName,query,callback){
		try{
			this.proxy.send(this.queryContext(funcName,query), `http://tempuri.org/${this.namespace}/${funcName}`, (response, ctx)=>{
	            if(ctx.error!=undefined){
	                if(ctx.error['code']=='ENOTFOUND') 
	                	return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'})
	                if(ctx.error['code']=='ETIMEDOUT' || ctx.error['code']=='ECONNRESET'){
	                	errorLog('wcf-helper ctx.error:',ctx.error['code'])
	                	if(this.tryCount<5){
	                		this.tryCount++
	                		eventLog(
`wcf-helper :
	url:${this.url}
	username:${this.username}
	funcName:${funcName}
	tryCount:${this.tryCount}
	tryInterval:${this.tryInterval/1000} sn sonra yeniden denenecek
`)
	                		setTimeout(()=>{
	                			this.proxy = new Proxy(this.binding, this.url)
								this.proxy.ClientCredentials.Username.Username = this.username
								this.proxy.ClientCredentials.Username.Password = this.password 
								eventLog('wcf-helper Yeniden deniyor...'.cyan)
	                			this.send(funcName,query,callback)
	                		},this.tryInterval)
	                	}else{
	                		this.tryCount=0
	                		callback({code:ctx.error['code'],message:ctx.error['code']})
	                	}
	                	

	                }else{
	                	this.tryCount=0
	                	callback({code:ctx.error['code'],message:ctx.error['code']})
	                }
	                
	            }else{
	            	this.tryCount=0
	            	fs.writeFileSync(path.join(config.tmpDir,'response.xml'),response,'utf8')
	            	var options={
	            		xmlns:false,
	            		charkey:'value',
	            		attrkey:'attr',
	            		ignoreAttrs:false,
	            		mergeAttrs:false,
	            		explicitArray:false,
	            		firstCharLowerCase:true,
	            		parseNumbers:true,
	            		parseBooleans:true,
	            		attrNameProcessors:[(e)=>{
	            			if(e.indexOf(':')>-1){
	            				// return e.replaceAll(':','_')
	            				return undefined
	            			}else{
	            				return e
	            			}
	            		}],
	            		attrValueProcessors:[(e,name)=>{
	            			if(name.indexOf(':')>-1 || name=='xmlns'){
	            				return undefined
	            			} else {
	            				if(!isNaN(e)) 
	            					e=Number(e)
		            			if(e=='true' || e=='True')
		            				e=true
		            			if(e=='false' || e=='False')
		            				e=false
		            			return e
	            			}
	            			
	            		}],
	            		valueProcessors:[(e,name)=>{
	            			if(!isNaN(e)) 
	            				e=Number(e)
	            			if(e=='true' || e=='True')
	            				e=true
	            			if(e=='false' || e=='False')
	            				e=false
	            			return e
	            		}]
	            	}
	            	
	            	parseString(response,options,(err,jsObject)=>{
	            		if(!err){
	            			// var s=JSON.stringify(jsObject)
	            			// jsObject=JSON.parse(JSON.stringify(jsObject).replaceAll('{"attr":{}}','""'))
	            			fs.writeFileSync(path.join(config.tmpDir,'response.json'),JSON.stringify(jsObject,null,2),'utf8')
	            			// fs.writeFileSync(path.join(config.tmpDir,'response.json'),s,'utf8')
	            			if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
	            				var errorCode=jsObject['s:Envelope']['s:Body']['s:Fault']['faultcode']['value'] || jsObject['s:Envelope']['s:Body']['s:Fault']['faultcode'] || 'WCF_ERROR'

					            var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring']['value']
					            callback({code:errorCode,message:errorMessage})
					        }else{
					        	var body=jsObject['s:Envelope']['s:Body']
					        	fs.writeFileSync(path.join(config.tmpDir,'resBody.json'),JSON.stringify(body,null,2),'utf8')
								callback(null,body)
					        }
	            		}else{
	            			callback(err)
	            		}
	            	})
	            }
	        })
		}catch(tryErr){
			callback(tryErr)
		}
	}
}

module.exports={
	WcfHelper:WcfHelper
}