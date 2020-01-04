


// var reqOptions={ 
// 	"ReportId": 1, 
// 	"SerialList": [ "JH20085062"], 
// 	"StartDate": "2018-04-04T11:14:39.7338064+03:00", 
// 	"EndDate": "2018-04-04T11:14:39.7348064+03:00", 
// 	"ExternalField": "sample string 4", 
// 	"ReceiptNo": 5, 
// 	"ZNo": 6, 
// 	"GetSummary": true, 
// 	"SaleFlags": 0 
// }

//var reqOptions={ "ReportId": 0, "SerialList": [ "JH20085062" ], "StartDate": "2018-01-01T00:00:00", "EndDate": "2019-03-23T23:23:49", "ExternalField": "", "ReceiptNo": 0, "ZNo": 0, "GetSummary":true, "SaleFlags": 0 }
//var reqOptions={}

//var url1='https://213.143.229.29:4001/iCiroPro/ICiroWebService'; //https://213.143.229.29:4001/iCiroPro/ICiroWebService/GetZReport


function ingenicoWebService(serviceUrl,username,password,endPoint,reqOptions,cb){
	var url=serviceUrl + endPoint;
	var headers = {
	    'Content-Type':'application/json', //; charset=utf-8',
	    'Operator':'tr216',
	    'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
	}

	var options = {
	    url: url,
	    method: 'POST',
	    headers: headers,
	    rejectUnauthorized: false,
	    json:reqOptions
	}
	var request=require('request');
	request(options, (error, response, body)=>{

		if(error){
			return cb(error);
		}
		if(response){
			if(response.statusCode!=200){
				return cb({code:'INGENICO_API_ERROR',message:'INGENICO_API_ERROR | ' + url});
			}
		}
		//console.log('body type:',(typeof body));
		
		if(body){
			if(body.ErrCode!='0' && body.ErrCode!=''){
				return cb({code:body.ErrCode,message:body.ErrDesc});
			}else{
				cb(null,body);
			}
		}else{
			cb({code:'EMPTY',message:'Empty result'});
		}
	    
	});
}


exports.getZReport=(serviceOptions,reqOptions,cb)=>{
	
	ingenicoWebService(serviceOptions.url,serviceOptions.username,serviceOptions.password,'/GetZReport',reqOptions,(err,resp)=>{
		if(!err){
			var index=0;

			function detaylariIndir(callb){
				console.log('detaylariIndir:' + index + '/' + resp.ZReportItems.length)
				if(index>=resp.ZReportItems.length) return callb(null);
				exports.getZReportSubParts(serviceOptions,reqOptions,resp.ZReportItems[index].ZNo,resp.ZReportItems[index].EkuNo,(err,subResult)=>{
					if(!err){
						resp.ZReportItems[index]['SubParts']=subResult;
					}
					index++;
					setTimeout(detaylariIndir,100,callb);
				});
			}
			
			detaylariIndir((err)=>{
				if(err){
					mrutil.errorLog('detaylariIndir',err);
				}
				
				cb(err,resp);
			});
		}else{
			mrutil.errorLog('getZReport.ingenicoWebService',err);
			cb(err,resp);
		}
		
	});
}

exports.getZReportSubParts=(serviceOptions,reqOptions,zNo,ekuNo,cb)=>{
	
	reqOptions['ExternalField']=zNo + ';' + ekuNo;
	ingenicoWebService(serviceOptions.url,serviceOptions.username,serviceOptions.password,'/GetZReportSubParts',reqOptions,(err,resultSubParts)=>{
		cb(err,resultSubParts);
	});
}