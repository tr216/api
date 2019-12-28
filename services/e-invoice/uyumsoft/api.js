// var optionExample={
//     entegrator:'Uyumsoft',
//     url:'https://efatura.uyumsoft.com.tr/Services/Integration',
//     webservice_id:'',
//     webservice_username:'',
//     webservice_password:''
// }


var BasicHttpBinding = require('wcf.js').BasicHttpBinding;
//var BasicHttpBinding = require('wcf.js').WSHttpBinding;
var Proxy = require('wcf.js').Proxy;

function generateRequestMessage(funcName,query,isQuery=true){
    var message =  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
                     '<s:Header />' +
                       '<s:Body>' +
                         '<s:' + funcName + ' xmlns:s="http://tempuri.org/">'
    if(isQuery){
        message +='<s:query PageIndex="' + (query.pageIndex || query.PageIndex || 0) + '" PageSize="' + (query.pageSize || query.PageSize || 20) + '">';
        for(let k in query){
            if(k!='pageIndex' && k!='PageIndex' && k!='pageSize' && k!='PageSize'){
                message +="<s:" + k + ">" + query[k].toString() + "</s:" + k +">";
            }
        }
        message +='</s:query>';
    }else{

        for(let k in query){
            if(Object.keys(query[k]).indexOf('pageIndex')>-1 || Object.keys(query[k]).indexOf('pageSize')>-1 || Object.keys(query[k]).indexOf('PageIndex')>-1 || Object.keys(query[k]).indexOf('PageSize')>-1){
                message +='<s:' + k + ' PageIndex="' + (query[k].pageIndex || query.PageIndex || 0) + '" PageSize="' + (query.pageSize || query.PageSize || 20) + '">' + query[k].toString() + '</s:' + k +'>';
            }else{
                message +='<s:' + k + '>' + query[k].toString() + '</s:' + k +'>';
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
        console.log('sbuf.length:',sbuf.length);
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
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })

    var proxy = new Proxy(binding, options.url);
    console.log('options:',options);
    // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetInboxInvoiceList',query);
    
    
    proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoiceList", function(response, ctx) {
        var fileName=path.join(__dirname,'../../../../temp','GetInboxInvoiceList');

        fs.writeFileSync(fileName + '.xml', response,'utf8');
        
        fs.writeFileSync(fileName + '-ctx.json', JSON.stringify(ctx,null,2),'utf8');

        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName+'.json', JSON.stringify(jsObject,null,2),'utf8');
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

                        console.log('PageIndexXML:',jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].PageIndex);
                        console.log('PageSizeXML:',jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].PageSize);
                        // result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].PageIndex);
                        result.page= query.PageIndex;
                        // result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].PageSize);
                        result.pageSize=query.PageSize;
                        result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].TotalCount);
                        result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['$'].TotalPages);
                        console.log('result.page:',result.page);
                        console.log('result.pageSize:',result.pageSize);
                        console.log('result.recordCount:',result.recordCount);
                        console.log('result.pageCount:',result.pageCount);
                        var items=jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceListResponse'][0]['GetInboxInvoiceListResult'][0]['Value'][0]['Items'];
                        console.log('items.length:',items.length);
                        for(var i=0;i<items.length;i++){
                            console.log('FaturaID:',items[i]['InvoiceId'][0]);
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
                        callback({code:'UNSUCCESSFUL',message:'Uyumsoft E-InvoiceDownload Basarisiz'});
                    }
                                       
                    
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });

        }catch(err){
            callback({code:'CATCHED_ERROR',message:err});
        }
    });
    
}; 

/**
* @query :{CreateStartDate:Date, CreateEndDate:Date, ExecutionStartDate:Date, ExecutionEndDate:Date, PageIndex:Number, PageSize:Number
* , Status:String, OnlyNewestInvoices:Boolean, InvoiceNumbers:String[] , InvoiceIds: String[]}
*
*  Status in NotPrepared, NotSend, Draft, Canceled, Queued, Processing, SentToGib, Approved, WaitingForAprovement, Declined, Return, EArchivedCanceled, Error
*/

exports.getOutboxInvoiceList = function (options,query,callback) {
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
        var fileName=path.join(__dirname,'../../../../temp','GetOutboxInvoiceList');

        fs.writeFileSync(fileName + '.xml', response,'utf8');
        

        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName+'.json', JSON.stringify(jsObject,null,2),'utf8');
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

                        console.log('PageIndexXML:',jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].PageIndex);
                        console.log('PageSizeXML:',jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].PageSize);
                        // result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].PageIndex);
                        result.page= query.PageIndex;
                        // result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].PageSize);
                        result.pageSize=query.PageSize;
                        result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].TotalCount);
                        result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['$'].TotalPages);
                        console.log('result.page:',result.page);
                        console.log('result.pageSize:',result.pageSize);
                        console.log('result.recordCount:',result.recordCount);
                        console.log('result.pageCount:',result.pageCount);
                        var items=jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceListResponse'][0]['GetOutboxInvoiceListResult'][0]['Value'][0]['Items'];
                        console.log('items.length:',items.length);
                        for(var i=0;i<items.length;i++){
                            console.log('FaturaID:',items[i]['InvoiceId'][0]);
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
                        callback({code:'UNSUCCESSFUL',message:'Uyumsoft E-InvoiceDownload Basarisiz'});
                    }
                                       
                    
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });

        }catch(err){
            callback({code:'CATCHED_ERROR',message:err});
        }
    });
    
}; 

/**
* @query :{ invoiceId: String}
*/
exports.getInboxInvoice = function (options,invoiceId,callback) {
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
        var fileName=path.join(__dirname,'../../../../temp','GetInboxInvoice');
        
        fs.writeFileSync(fileName + '.xml', response,'utf8');
        // fs.writeFileSync(fileName+'-ctx', JSON.stringify(ctx,null,2),'utf8');
        
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    //jsObject=mrutil.deleteObjectProperty(jsObject,'xmlns:*');
                    
                    //jsObject=mrutil.deleteObjectProperty(jsObject,'xmlns');
                    // fs.writeFileSync(fileName + '.xml', response,'utf8');
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceResponse'][0]['GetInboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{invoice:jsObject['s:Envelope']['s:Body']['GetInboxInvoiceResponse']['GetInboxInvoiceResult']['Value']['Invoice']}
                    }
                    // if(!result.IsSucceded){
                    //     return callback({code:'Basarisiz',message:'Uyumsoft getInboxInvoice Basarisiz'});
                    // }
                    
                    // if(result.doc.invoice.UBLExtensions!=undefined){
                    //     result.doc.invoice.UBLExtensions=undefined;
                    //     delete result.doc.invoice.UBLExtensions;
                    // }
                    // if(result.doc.invoice.AdditionalDocumentReference!=undefined){

                    // }
                    callback(null,result);
                    
                    
                }else{
                    callback(err);
                }
            });

        }catch(err){
            callback(err);
        }

        
        
    });
    
}; 

/**
* @query :{ invoiceId: String}
*/
exports.getOutboxInvoice = function (options,invoiceId,callback) {
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetOutboxInvoice',{invoiceId:invoiceId},false);

    proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoice", function(response, ctx) {
        var fileName=path.join(__dirname,'../../../../temp','GetOutboxInvoice');
        
        fs.writeFileSync(fileName + '.xml', response,'utf8');
        // fs.writeFileSync(fileName+'-ctx', JSON.stringify(ctx,null,2),'utf8');
        
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    jsObject=mrutil.deleteObjectProperty(jsObject,'xmlns*');
                    //jsObject=mrutil.deleteObjectProperty(jsObject,'xmlns');
                    // fs.writeFileSync(fileName + '.xml', response,'utf8');
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    var result={
                        IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetOutboxInvoiceResponse'][0]['GetOutboxInvoiceResult'][0]['$'].IsSucceded=='true',
                        doc:{invoice:jsObject['s:Envelope']['s:Body']['GetOutboxInvoiceResponse']['GetOutboxInvoiceResult']['Value']['Invoice']}
                    }
                    // if(!result.IsSucceded){
                    //     return callback({code:'Basarisiz',message:'Uyumsoft getOutboxInvoice Basarisiz'});
                    // }
                    
                    // if(result.doc.invoice.UBLExtensions!=undefined){
                    //     result.doc.invoice.UBLExtensions=undefined;
                    //     delete result.doc.invoice.UBLExtensions;
                    // }
                    // if(result.doc.invoice.AdditionalDocumentReference!=undefined){

                    // }
                    callback(null,result);
                    
                    
                }else{
                    callback(err);
                }
            });

        }catch(err){
            callback(err);
        }

        
        
    });
    
}; 

/**
* @query :{ invoiceId: String}
*/
exports.getInboxInvoiceHtml = function (options,invoiceId,callback) {
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
        var fileName=path.join(__dirname,'../../../../temp','GetInboxInvoiceView');
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
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

        }catch(err){
            callback(err);
        }

        
        
    });
    
}; 


/**
* @query :{ invoiceId: String}
*/
exports.getInboxInvoicePdf = function (options,invoiceId,callback) {
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
        var fileName=path.join(__dirname,'../../../../temp','GetInboxInvoicePdf');
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
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

        }catch(err){
            callback(err);
        }

        
        
    });
    
};

/**
* @query :{ invoiceId: String}
*/
exports.getOutboxInvoiceHtml = function (options,invoiceId,callback) {
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetOutboxInvoiceView',{invoiceId:invoiceId},false);

    proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoiceView", function(response, ctx) {
        var fileName=path.join(__dirname,'../../../../temp','GetOutboxInvoiceView');
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
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

        }catch(err){
            callback(err);
        }

        
        
    });
    
}; 


/**
* @query :{ invoiceId: String}
*/
exports.getOutboxInvoicePdf = function (options,invoiceId,callback) {
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetOutboxInvoicePdf',{invoiceId:invoiceId},false);

    proxy.send(message, "http://tempuri.org/IIntegration/GetOutboxInvoicePdf", function(response, ctx) {
        var fileName=path.join(__dirname,'../../../../temp','GetOutboxInvoicePdf');
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
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

        }catch(err){
            callback(err);
        }

        
        
    });
    
};
/**
* @query :{ invoices: String[]}
*/
exports.setInvoicesTaken = function (options,invoices,callback) {
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('SetInvoicesTaken',{invoices:invoices},false);

    proxy.send(message, "http://tempuri.org/IIntegration/SetInvoicesTaken", function(response, ctx) {
        var fileName=path.join(__dirname,'../../../../temp','SetInvoicesTaken');
        
        fs.writeFileSync(fileName + '.xml', response,'utf8');
        // fs.writeFileSync(fileName+'-ctx', JSON.stringify(ctx,null,2),'utf8');
        
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json3(response,(err,jsObject)=>{
                if(!err){
                    // fs.writeFileSync(fileName + '.xml', response,'utf8');
                    fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
                    if(jsObject['s:Envelope']['s:Body']['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body']['s:Fault']['faultstring'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }

                    // var result={
                    //     IsSucceded: true, //jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoiceResponse'][0]['GetInboxInvoiceResult'][0]['$'].IsSucceded=='true',
                    //     doc:{invoice:jsObject['s:Envelope']['s:Body']['GetInboxInvoiceResponse']['GetInboxInvoiceResult']['Value']['Invoice']}
                    // }
                    // if(!result.IsSucceded){
                    //     return callback({code:'Basarisiz',message:'Uyumsoft getInboxInvoice Basarisiz'});
                    // }
                    
                    // if(result.doc.invoice.UBLExtensions!=undefined){
                    //     result.doc.invoice.UBLExtensions=undefined;
                    //     delete result.doc.invoice.UBLExtensions;
                    // }
                    // if(result.doc.invoice.AdditionalDocumentReference!=undefined){

                    // }
                    callback(null);
                    
                    
                }else{
                    callback(err);
                }
            });

        }catch(err){
            callback(err);
        }

        
        
    });
    
}; 


/**
* @vknTckn:String
*/

exports.isEInvoiceUser = function (options,vknTckn,callback) {
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('IsEInvoiceUser',{vknTckn:vknTckn,alias:''});
    console.log('message:',message);
    proxy.send(message, "http://tempuri.org/IIntegration/IsEInvoiceUser", function(response, ctx) {
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
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

        }catch(err){
            callback({code:'CATCHED_ERROR',message:err});
        }
    });
}






/**
* @pagination :{pageIndex:Number, pageSize:Number}
* @query :{pageIndex:Number, pageSize:Number}
*/


exports.getEInvoiceUsers = function (options,query,callback) {
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
        var fileName=path.join(__dirname,'../../../../temp','GetEInvoiceUsers');

        fs.writeFileSync(fileName + '.xml', response,'utf8');
        

        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    fs.writeFileSync(fileName+'.json', JSON.stringify(jsObject,null,2),'utf8');
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

                        console.log('PageIndexXML:',jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageIndex);
                        console.log('PageSizeXML:',jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageSize);
                        // result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageIndex);
                        result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageIndex || query.pagination.pageIndex);
                        // result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageSize);
                        result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].PageSize || query.pagination.pageSize);
                        result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].TotalCount);
                        result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['$'].TotalPages);
                        console.log('result.page:',result.page);
                        console.log('result.pageSize:',result.pageSize);
                        console.log('result.recordCount:',result.recordCount);
                        console.log('result.pageCount:',result.pageCount);
                        var items=jsObject['s:Envelope']['s:Body'][0]['GetEInvoiceUsersResponse'][0]['GetEInvoiceUsersResult'][0]['Value'][0]['Items'];
                        console.log('items.length:',items.length);
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

                        callback(null,result);
                    }else{
                        callback({code:'UNSUCCESSFUL',message:'Uyumsoft getEInvoiceUsers Basarisiz'});
                    }
                                       
                    
                }else{
                    callback({code:'XML2JSON_ERROR',message:(err.name || err.message || err.toString())});
                }
            });

        }catch(err){
            callback({code:'CATCHED_ERROR',message:err});
        }
    });
    
};