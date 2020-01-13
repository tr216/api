

var BasicHttpBinding = require('wcf.js').BasicHttpBinding;
//var BasicHttpBinding = require('wcf.js').WSHttpBinding;
var Proxy = require('wcf.js').Proxy;

function generateRequestMessage(funcName,query,isQuery=true){
    var message =  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
                     '<s:Header />' +
                       '<s:Body>' +
                         '<s:' + funcName + ' xmlns:s="http://tempuri.org/">'
    if(isQuery){
        message +='<s:query PageIndex="' + (query.pageIndex || query.PageIndex || 0) + '" PageSize="' + (query.pageSize || query.PageSize || 10) + '">';
        for(let k in query){
            if(k!='pageIndex' && k!='PageIndex' && k!='pageSize' && k!='PageSize'){
                if(!Array.isArray(query[k])){
                    message +="<s:" + k + ">" + query[k].toString() + "</s:" + k +">";
                }else{
                    query[k].forEach((e)=>{
                        message +='<s:' + k + '>' + e.toString() + '</s:' + k +'>';
                    });
                }
            }
        }
        message +='</s:query>';
    }else{
        
            for(let k in query){
                if(!Array.isArray(query[k])){
                    if(Object.keys(query[k]).indexOf('pageIndex')>-1 || Object.keys(query[k]).indexOf('pageSize')>-1 || Object.keys(query[k]).indexOf('PageIndex')>-1 || Object.keys(query[k]).indexOf('PageSize')>-1){
                        message +='<s:' + k + ' PageIndex="' + (query[k].pageIndex || query.PageIndex || 0) + '" PageSize="' + (query.pageSize || query.PageSize || 10) + '">' + query[k].toString() + '</s:' + k +'>';
                    }else{
                        message +='<s:' + k + '>' + query[k].toString() + '</s:' + k +'>';
                    }
                }else{
                    query[k].forEach((e)=>{
                        message +='<s:' + k + '>' + e.toString() + '</s:' + k +'>';
                    });
                }
            }
        
    }
    message +='</s:' + funcName + '>';
    message +='</s:Body>' +
    '</s:Envelope>'
    return message;
}



function seperateItems(response){
    var items=[]
    var s1=-1;
    var s2=-1;
    var i=0;

    while(response.indexOf('<Items',s1+1)>-1){
        s1=response.indexOf('<Items',s1+1); 
        s2=response.indexOf('</Items>',s1);                
        if(s2<0 || s2<s1) break;
        var sbuf=response.substr(s1,s2-s1+8);
        eventLog('sbuf.length:',sbuf.length);
        items.push(sbuf);
    }

    return items;
}

function seperateInvoice(items){
    var invoice=''
    if(!items) return invoice;
    var s1=items.indexOf('<Invoice');
    var s2=items.indexOf('</Invoice>');

    if(s1>-1 && s2>s1){
        invoice=items.substr(s1,s2-s1+10);
    }

    return invoice;
}



function uyumsoftInvoiceStatus(status){
    // NotPrepared, NotSend, Draft, Canceled, Queued, Processing, SentToGib, Approved, WaitingForAprovement, Declined,  Return, EArchivedCanceled, Error,
    //  , , , , WaitingForAprovement, Declined,  Return, , Error,
    //'Draft','Processing','SentToGib','Approved','Declined','WaitingForAprovement','Error'

    switch(status){
        case 'NotPrepared':
        case 'NotSend':
        case 'Draft':
        case 'Canceled':
        case 'EArchivedCanceled':
        return 'Draft';

        case 'Queued':
        case 'Processing':
        return 'Processing';

        case 'SentToGib':
        return 'SentToGib';

        case 'Approved':
        return 'Approved';

        case 'Return':
        case 'Declined':
        return 'Declined';

        case 'WaitingForAprovement':
        return 'WaitingForAprovement';

        case 'Error':
        return 'Error';

        default:
        return 'Unknown';
    }
}

function uyumsoftInvoiceProfileID(typeCode){
    switch(typeCode){
        case 'BaseInvoice':
        case '0':
            return 'TEMELFATURA';
        case 'ComercialInvoice':
        case '1':
            return 'TICARIFATURA';
        case 'InvoiceWithPassanger':
        case '2':
            return 'YOLCUBERABERFATURA';
        case 'Export':
        case '3':
            return 'IHRACAT';
        case 'eArchive':
        case '4':
            return 'EARSIVFATURA';
        default:
        return 'TEMELFATURA';
    }
}

/**
* @query :{CreateStartDate:Date, CreateEndDate:Date, ExecutionStartDate:Date, ExecutionEndDate:Date, PageIndex:Number, PageSize:Number
* , Status:String, OnlyNewestInvoices:Boolean, InvoiceNumbers:String[] , InvoiceIds: String[]}
*
*  Status in NotPrepared, NotSend, Draft, Canceled, Queued, Processing, SentToGib, Approved, WaitingForAprovement, Declined, Return, EArchivedCanceled, Error
*/

exports.getInboxInvoiceList = function (options,query,callback) {
    try{ 
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })

        var proxy = new Proxy(binding, options.url);
        
        // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetInboxInvoiceList',query);
        
        
        proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoiceList", function(response, ctx) {


            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
        
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    if(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['$'].IsSucceded=='true'){
                        var result={
                            page:0,
                            pageSize:0,
                            recordCount: 0,
                            pageCount: 0,
                            docs:[]
                        }

                        // result.page= query.PageIndex;
                        // result.pageSize=query.PageSize;
                        result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].PageIndex);
                        result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].PageSize);
                        result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].TotalCount);
                        result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].TotalPages);
                        
                        var items=jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['Items'];
                        if(items){
                            for(var i=0;i<items.length;i++){
                                
                                var obj={
                                    ioType:1,
                                    profileId:uyumsoftInvoiceProfileID(items[i]['Type'][0]),
                                    id:items[i]['InvoiceId'][0],
                                    uuid:items[i]['DocumentId'][0],
                                    issueDate:items[i]['ExecutionDate'][0].toString().substr(0,10),
                                    issueTime:items[i]['ExecutionDate'][0].toString().substr(11,8),
                                    invoiceType:'SATIS',
                                    accountingParty:{
                                        tcknVkn:items[i]['TargetTcknVkn']!=undefined?(items[i]['TargetTcknVkn'][0]) || '':'',
                                        title:items[i]['TargetTitle']!=undefined?(items[i]['TargetTitle'][0]|| ''):''
                                    },
                                    payableAmount:Number(items[i]['PayableAmount'][0]),
                                    taxExclusiveAmount:Number(items[i]['TaxExclusiveAmount'][0]),
                                    taxTotal:Number(items[i]['TaxTotal'][0]),
                                    taxSummary :{
                                        vat1:Number(items[i]['Vat1'][0]),
                                        vat8:Number(items[i]['Vat8'][0]),
                                        vat18:Number(items[i]['Vat18'][0]),
                                        vat0TaxableAmount:Number(items[i]['Vat0TaxableAmount'][0]),
                                        vat1TaxableAmount:Number(items[i]['Vat1TaxableAmount'][0]),
                                        vat8TaxableAmount:Number(items[i]['Vat8TaxableAmount'][0]),
                                        vat18TaxableAmount:Number(items[i]['Vat18TaxableAmount'][0])
                                    },
                                    withHoldingTaxTotal:0,
                                    documentCurrencyCode:items[i]['DocumentCurrencyCode'][0],
                                    exchangeRate:Number(items[i]['ExchangeRate'][0]),
                                    
                                    status:uyumsoftInvoiceStatus(items[i]['Status'][0])
                                }
                                result.docs.push(obj);
                            }
                            callback(null,result);
                        }else{
                            callback(null,result);
                        }
                    }else{
                        callback({code:'UNSUCCESSFUL',message:'Uyumsoft E-InvoiceDownload Basarisiz'});
                    }
                                       
                    
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });

        
        });

    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}

/**
* @query :{CreateStartDate:Date, CreateEndDate:Date, ExecutionStartDate:Date, ExecutionEndDate:Date, PageIndex:Number, PageSize:Number
* , Status:String, OnlyNewestInvoices:Boolean, InvoiceNumbers:String[] , InvoiceIds: String[]}
*
*  Status in NotPrepared, NotSend, Draft, Canceled, Queued, Processing, SentToGib, Approved, WaitingForAprovement, Declined, Return, EArchivedCanceled, Error
*/

exports.getOutboxInvoiceList = function (options,query,callback) {
    try{ 
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetOutboxInvoiceList',query);
    
    
    proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoiceList", function(response, ctx) {
        

        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    if(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['$'].IsSucceded=='true'){
                        var result={
                            page:0,
                            pageSize:0,
                            recordCount: 0,
                            pageCount: 0,
                            docs:[]
                        }

                        // result.page= query.PageIndex;
                        // result.pageSize=query.PageSize;
                        result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].PageIndex);
                        result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].PageSize);
                        result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].TotalCount);
                        result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].TotalPages);
                       
                        var items=jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['Items'];
                        if(items){
                            for(var i=0;i<items.length;i++){
                                
                                var obj={
                                    ioType:1,
                                    profileId:uyumsoftInvoiceProfileID(items[i]['Type'][0]),
                                    id:items[i]['InvoiceId'][0],
                                    uuid:items[i]['DocumentId'][0],
                                    issueDate:items[i]['ExecutionDate'][0].toString().substr(0,10),
                                    issueTime:items[i]['ExecutionDate'][0].toString().substr(11,8),
                                    invoiceType:'SATIS',
                                    accountingParty:{
                                        tcknVkn:items[i]['TargetTcknVkn']!=undefined?(items[i]['TargetTcknVkn'][0]) || '':'',
                                        title:items[i]['TargetTitle']!=undefined?(items[i]['TargetTitle'][0]|| ''):''
                                    },
                                    payableAmount:Number(items[i]['PayableAmount'][0]),
                                    taxExclusiveAmount:Number(items[i]['TaxExclusiveAmount'][0]),
                                    taxTotal:Number(items[i]['TaxTotal'][0]),
                                    taxSummary :{
                                        vat1:Number(items[i]['Vat1'][0]),
                                        vat8:Number(items[i]['Vat8'][0]),
                                        vat18:Number(items[i]['Vat18'][0]),
                                        vat0TaxableAmount:Number(items[i]['Vat0TaxableAmount'][0]),
                                        vat1TaxableAmount:Number(items[i]['Vat1TaxableAmount'][0]),
                                        vat8TaxableAmount:Number(items[i]['Vat8TaxableAmount'][0]),
                                        vat18TaxableAmount:Number(items[i]['Vat18TaxableAmount'][0])
                                    },
                                    withHoldingTaxTotal:0,
                                    documentCurrencyCode:items[i]['DocumentCurrencyCode'][0],
                                    exchangeRate:Number(items[i]['ExchangeRate'][0]),
                                    
                                    status:uyumsoftInvoiceStatus(items[i]['Status'][0])
                                }
                                result.docs.push(obj);
                            }
                            eventLog('result.docs')
                            callback(null,result);
                        }else{
                            callback(null,result);
                        }
                    }else{
                        callback({code:'UNSUCCESSFUL',message:'Uyumsoft E-InvoiceDownload Basarisiz'});
                    }
                                       
                    
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });

        
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }   
}

/**
* @query :{ invoiceId: String}
*/
exports.getInboxInvoice = function (options,invoiceId,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetInboxInvoice',{invoiceId:invoiceId},false);

        proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoice", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }

            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceResponse'][0]['GetInboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{invoice:jsObject['s:Envelope']['s:Body']['GetInboxInvoiceResponse']['GetInboxInvoiceResult']['Value']['Invoice']}
                    }
                    
                    callback(null,result);
                }else{
                    callback(err);
                }
            });
        
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}; 

/**
* @query :{ invoiceId: String}
*/
exports.getOutboxInvoice = function (options,invoiceId,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);

        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetOutboxInvoice',{invoiceId:invoiceId},false);

        proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoice", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
        
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    jsObject=mrutil.deleteObjectProperty(jsObject,'xmlns*');
                   
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    var result={}

                    try{
                        result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceResponse'][0]['GetOutboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{invoice:jsObject['s:Envelope']['s:Body']['GetOutboxInvoiceResponse']['GetOutboxInvoiceResult']['Value']['Invoice']}
                        }
                    }catch(err){
                        return callback({code: err.name || 'CATCHED_ERROR',message:err.message || 'CATCHED_ERROR'});
                    }
                    
                   
                    callback(null,result);
                    
                    
                }else{
                    callback(err);
                }
            });
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || 'CATCHED_ERROR'});
    }
}

/**
* @query :{ invoiceId: String}
*/
exports.getInboxInvoiceHtml = function (options,invoiceId,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetInboxInvoiceView',{invoiceId:invoiceId},false);

        proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoiceView", function(response, ctx) {
            
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];
                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceResponse'][0]['GetInboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{html:jsObject['s:Envelope']['s:Body']['GetInboxInvoiceViewResponse']['GetInboxInvoiceViewResult']['Value']['Html']}
                    }
                   
                    callback(null,result);
                }else{
                    callback(err);
                }
            });
        
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}


/**
* @query :{ invoiceId: String}
*/
exports.getInboxInvoicePdf = function (options,invoiceId,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetInboxInvoicePdf',{invoiceId:invoiceId},false);

        proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoicePdf", function(response, ctx) {
            
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }

            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];
                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceResponse'][0]['GetInboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{pdf:jsObject['s:Envelope']['s:Body']['GetInboxInvoicePdfResponse']['GetInboxInvoicePdfResult']['Value']['Data']}
                    }
                   
                    callback(null,result);
                }else{
                    callback(err);
                }
            });
        
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}

/**
* @query :{ invoiceId: String}
*/
exports.getOutboxInvoiceHtml = function (options,invoiceId,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetOutboxInvoiceView',{invoiceId:invoiceId},false);

        proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoiceView", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];
                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceResponse'][0]['GetOutboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{html:jsObject['s:Envelope']['s:Body']['GetOutboxInvoiceViewResponse']['GetOutboxInvoiceViewResult']['Value']['Html']}
                    }
                   
                    callback(null,result);
                }else{
                    callback(err);
                }
            });

        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}


/**
* @query :{ invoiceId: String}
*/
exports.getOutboxInvoicePdf = function (options,invoiceId,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetOutboxInvoicePdf',{invoiceId:invoiceId},false);

        proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoicePdf", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];
                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceResponse'][0]['GetOutboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{pdf:jsObject['s:Envelope']['s:Body']['GetOutboxInvoicePdfResponse']['GetOutboxInvoicePdfResult']['Value']['Data']}
                    }
                   
                    callback(null,result);
                }else{
                    callback(err);
                }
            });

        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}
/**
* @query :{ invoices: String[]}
*/
exports.setInvoicesTaken = function (options,invoices,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('SetInvoicesTaken',{invoices:invoices},false);

        proxy.send(message, "http://tempuri.org/IIntegration/SetInvoicesTaken", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});
                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];
                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    
                    callback(null);
                }else{
                    callback(err);
                }
            });

        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}


/**
* @vknTckn:String
*/

exports.isEInvoiceUser = function (options,vknTckn,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('IsEInvoiceUser',{vknTckn:vknTckn,alias:''});
        
        proxy.send(message, "http://tempuri.org/IIntegration/IsEInvoiceUser", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }

            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    var value=jsObject['s:Envelope']['s:Body'][0]['IsEInvoiceUserResponse'][0]['IsEInvoiceUserResult'][0]['$'].Value=='true';
                    callback(null,value);
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}






/**
* @query :{ pagination: {pageIndex:Number, pageSize:Number} }
*/


exports.getEInvoiceUsers = function (options,query,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('GetEInvoiceUsers',query,false);
        
        
        proxy.send(message, "http://tempuri.org/IIntegration/GetEInvoiceUsers", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    if(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['$'].IsSucceded=='true'){
                        var result={
                            page:0,
                            pageSize:0,
                            recordCount: 0,
                            pageCount: 0,
                            docs:[]
                        }

                        result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageIndex || query.pagination.pageIndex);
                        result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageSize || query.pagination.pageSize);
                        result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].TotalCount);
                        result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].TotalPages);
                        
                        var items=jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['Items'];
                        if(items){
                            items.forEach((item)=>{
                                var obj={
                                    identifier:item['$'].Identifier.trim(),
                                    postboxAlias:item['$'].PostboxAlias.trim(),
                                    title:item['$'].Title.trim(),
                                    type:item['$'].Type.trim(),
                                    systemCreateDate:new Date(item['$'].SystemCreateDate + '.000+0300'),
                                    firstCreateDate:new Date(item['$'].FirstCreateDate + '.000+0300'),
                                    enabled:Boolean(item['$'].Enabled)

                                }
                                result.docs.push(obj);
                            });

                        }
                        
                        callback(null,result);
                    }else{
                        callback({code:'UNSUCCESSFUL',message:'Uyumsoft getEInvoiceUsers Basarisiz'});
                    }
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}

/**
* @invoice: {object}
*/
exports.sendInvoice = function (options,ssss,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;
        
        var msj ='<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header /><s:Body>';
        msj +='<s:SendInvoice xmlns:s="http://tempuri.org/">';
        msj += ssss
        msj +='</s:SendInvoice></s:Body></s:Envelope>';

        proxy.send(msj, "http://tempuri.org/IIntegration/SendInvoice", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    if(jsObject['s:Envelope']['s:Body']['SendInvoiceResponse']['SendInvoiceResult']['$'].IsSucceded=='false'){
                        return callback({code:'UYUMSOFT_SEND_INVOICE',message:jsObject['s:Envelope']['s:Body']['SendInvoiceResponse']['SendInvoiceResult']['$'].Message});
                    }
                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceResponse'][0]['GetInboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{} // {invoice:jsObject['s:Envelope']['s:Body']['GetInboxInvoiceResponse']['GetInboxInvoiceResult']['Value']['Invoice']}
                    }
                   
                    callback(null,result);
                    
                    
                }else{
                    callback(err);
                }
            });
       
        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
    
}

/**
* @query :{ documentResponseInfo: [{InvoiceId:string, ResponseStatus:string}]}
* ResponseStatus : 'Approved' || ' Declined' || 'Return'
*/
exports.sendDocumentResponse = function (options,query,callback) {
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('SendDocumentResponse',query,false);

        proxy.send(message, "http://tempuri.org/IIntegration/SendDocumentResponse", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});
                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];
                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    if(jsObject['s:Envelope']['s:Body']['SendDocumentResponseResponse']['SendDocumentResponseResult']['$'].IsSucceded=='false'){
                        return callback({code:'UYUMSOFT_SEND_DOCUMENT_RESPONSE',message:jsObject['s:Envelope']['s:Body']['SendDocumentResponseResponse']['SendDocumentResponseResult']['$'].Message});
                    }
                    var result={
                        IsSucceded: true
                    }
                    
                    callback(null);
                }else{
                    callback(err);
                }
            });

        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}

/**
* @query :{  InvoiceIds: String[] }
*/
/*
exports.checkInboxInvoicesStatus=function(options,query,callback){
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('QueryInboxInvoiceStatus',query,false);
        
        proxy.send(message, "http://tempuri.org/IIntegration/QueryInboxInvoiceStatus", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});
                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    if(jsObject['s:Envelope']['s:Body'][0]['QueryInboxInvoiceStatusResponse'][0]['QueryInboxInvoiceStatusResult'][0]['$'].IsSucceded=='false'){
                        return callback({code:'UYUMSOFT_QUERY_INBOX_INVOICE_STATUS',message:jsObject['s:Envelope']['s:Body'][0]['QueryInboxInvoiceStatusResponse'][0]['QueryInboxInvoiceStatusResult'][0]['$'].Message});
                    }
                    eventLog('api result:',JSON.stringify(jsObject['s:Envelope']['s:Body'],null,2));

                    var result={
                        IsSucceded: true,
                        Value:jsObject['s:Envelope']['s:Body'][0]['QueryInboxInvoiceStatusResponse'][0]['QueryInboxInvoiceStatusResult'][0]['Value']
                    }
                    
                    callback(null,result);
                }else{
                    callback(err);
                }
            });

        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}
*/
/**
* @query :{  InvoiceIds: String[] }
*/
/** 
exports.checkOutboxInvoicesStatus=function(options,query,callback){
    try{
        var binding = new BasicHttpBinding(
            { SecurityMode: "TransportWithMessageCredential"
            , MessageClientCredentialType: "UserName"
        })
        var proxy = new Proxy(binding, options.url);
        proxy.ClientCredentials.Username.Username =options.username;
        proxy.ClientCredentials.Username.Password =options.password ;

        var message=generateRequestMessage('QueryOutboxInvoiceStatus',query,false);
        
        proxy.send(message, "http://tempuri.org/IIntegration/QueryOutboxInvoiceStatus", function(response, ctx) {
            if(ctx.error!=undefined){
                if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});
                return callback({code:ctx.error['code'],message:ctx.error['code']});
            }
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    if(jsObject['s:Envelope']['s:Body'][0]['QueryOutboxInvoiceStatusResponse'][0]['QueryOutboxInvoiceStatusResult'][0]['$'].IsSucceded=='false'){
                        return callback({code:'UYUMSOFT_QUERY_OUTBOX_INVOICE_STATUS',message:jsObject['s:Envelope']['s:Body'][0]['QueryOutboxInvoiceStatusResponse'][0]['QueryOutboxInvoiceStatusResult'][0]['$'].Message});
                    }
                    eventLog('api result:',JSON.stringify(jsObject['s:Envelope']['s:Body'],null,2));

                    var result={
                        IsSucceded: true,
                        Value:jsObject['s:Envelope']['s:Body'][0]['QueryOutboxInvoiceStatusResponse'][0]['QueryOutboxInvoiceStatusResult'][0]['Value']
                    }
                    
                    callback(null,result);
                }else{
                    callback(err);
                }
            });

        });
    }catch(tryErr){
        callback({code: tryErr.name || 'CATCHED_ERROR',message:tryErr.message || tryErr});
    }
}
**/