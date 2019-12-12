var optionExample={
    entegrator:'Uyumsoft',
    url:'https://efatura.uyumsoft.com.tr/Services/Integration',
    webservice_id:'',
    webservice_username:'',
    webservice_password:''
}

var BasicHttpBinding = require('wcf.js').BasicHttpBinding;
var Proxy = require('wcf.js').Proxy;

function generateRequestMessage(funcName,query){
    var message =  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
                     '<s:Header />' +
                       '<s:Body>' +
                         '<s:' + funcName + ' xmlns:s="http://tempuri.org/">'

    message +='<s:query PageIndex="' + (query.pageIndex || query.PageIndex || 0) + '" PageSize="' + (query.pageSize || query.PageSize || 20) + '">';
    
    for(let k in query){
        if(k!='pageIndex' && k!='PageIndex' && k!='pageSize' && k!='PageSize'){
            message +="<s:" + k + ">" + query[k].toString() + "</s:" + k +">";
        }
    }


    message +='</s:query>';
    

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
    // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetInboxInvoiceList',query);
    //console.log('message:',message);
    // var message='<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header />' +
    //     '<s:Body><s:GetInboxInvoiceList xmlns:s="http://tempuri.org/" >' + 
    //     '<s:query PageIndex="' + query.PageIndex + '" PageSize="10"><s:ExecutionStartDate>2019-01-01T00:00:00.000Z</s:ExecutionStartDate><s:ExecutionEndDate>2019-10-01T23:59:59.000Z</s:ExecutionEndDate>' +
    //     '<s:pageIndex>' + query.PageIndex + '</s:pageIndex><s:pageSize>10</s:pageSize><s:OnlyNewestInvoices>false</s:OnlyNewestInvoices><s:SetTaken>false</s:SetTaken>' +
    //     '</s:query></s:GetInboxInvoiceList>'+
    //     '</s:Body></s:Envelope>';
    
    proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoiceList", function(response, ctx) {
        // var fileName=path.join(__dirname,'../../../../temp','GetInboxInvoiceList');

        // fs.writeFileSync(fileName + '.xml', response,'utf8');
        // fs.writeFileSync(fileName+'-ctx.json', JSON.stringify(ctx,null,2),'utf8');

        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    // callback({success:true,data:jsObject});
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
                                    tcknVkn:items[i]['TargetTcknVkn'][0],
                                    title:items[i]['TargetTitle'][0]
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
* @query :{ ExecutionStartDate:Date, ExecutionEndDate:Date, pageIndex:Number, pageSize:Number, InvoiceNumbers:String[] , InvoiceIds: String[]}
*/
exports.getInboxInvoices = function (options,query,callback) {
    var binding = new BasicHttpBinding(
        { SecurityMode: "TransportWithMessageCredential"
        , MessageClientCredentialType: "UserName"
    })
    var proxy = new Proxy(binding, options.url);
    // var proxy = new Proxy(binding, 'https://efatura.uyumsoft11.com.tr/');
    proxy.ClientCredentials.Username.Username =options.username;
    proxy.ClientCredentials.Username.Password =options.password ;

    var message=generateRequestMessage('GetInboxInvoices',query);

    proxy.send(message, "http://tempuri.org/IIntegration/GetInboxInvoices", function(response, ctx) {
        // var fileName=path.join(__dirname,'../../../../temp','evelope');
        
        // fs.writeFileSync(fileName + '.xml', response,'utf8');
        // fs.writeFileSync(fileName+'-ctx', JSON.stringify(ctx,null,2),'utf8');
        
        if(ctx.error!=undefined){
            if(ctx.error['code']=='ENOTFOUND') return callback({code:'URL_NOT_FOUND',message:'Web Servis URL bulunamadi!'});

            return callback({code:ctx.error['code'],message:ctx.error['code']});
        }
        try{ 
            mrutil.xml2json(response,(err,jsObject)=>{
                if(!err){
                    // fs.writeFileSync(fileName + '.xml', response,'utf8');
                    // fs.writeFileSync(fileName + '.json', JSON.stringify(jsObject,null,2),'utf8');
                    if(jsObject['s:Envelope']['s:Body'][0]['s:Fault']!=undefined){
                        var errorMessage=jsObject['s:Envelope']['s:Body'][0]['s:Fault'][0]['faultstring'][0]['_'];

                        return callback({code:'WebServiceError',message:errorMessage});
                    }
                    var result={
                        IsSucceded:jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoicesResponse'][0]['GetInboxInvoicesResult'][0]['$'].IsSucceded=='true',
                        page:0,
                        pageSize:0,
                        recordCount: 0,
                        pageCount: 0,
                        docs:[]
                    }
                    if(!result.IsSucceded){
                        return callback({code:'Basarisiz',message:'Uyumsoft E-InvoiceDownload Basarisiz'});
                    }
                    result.page= Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoicesResponse'][0]['GetInboxInvoicesResult'][0]['Value'][0]['$'].PageIndex);
                    result.pageSize=Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoicesResponse'][0]['GetInboxInvoicesResult'][0]['Value'][0]['$'].PageSize);
                    result.recordCount= Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoicesResponse'][0]['GetInboxInvoicesResult'][0]['Value'][0]['$'].TotalCount);
                    result.pageCount=Number(jsObject['s:Envelope']['s:Body'][0]['GetInboxInvoicesResponse'][0]['GetInboxInvoicesResult'][0]['Value'][0]['$'].TotalPages);

                    var items=seperateItems(response);
                    // console.log('items.length:',items.length);

                    // if(items.length==0) return callback(null,result);;
                    var index=0;

                    function xmlAyristir(cb){
                        if(index>=items.length) return cb(null);
                        var xmlData=seperateInvoice(items[index]);
                        if(xmlData!=''){

                            mrutil.xml2json(xmlData,(err,jsonData)=>{
                                if(!err){
                                    result.list.push({data:jsonData,xmlData:xmlData});
                                }
                                index++;
                                setTimeout(xmlAyristir,0,cb);
                            });


                        }else{
                            index++;
                            setTimeout(xmlAyristir,0,cb);
                        }

                    }
                    
                    xmlAyristir((err)=>{
                        callback(err,result);
                    });
                    
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
*/
exports.GetEInvoiceUsers = function (options,pagination,callback) {
    callback(null);
}; 

 






/**
* @query :{CreateStartDate:Date, CreateEndDate:Date, ExecutionStartDate:Date, ExecutionEndDate:Date, pageIndex:Number, pageSize:Number
* , Scenario:String, InvoiceNumbers:String[] , InvoiceIds: String[]}
*
*  Scenario in eInvoice, eArchive
*/
exports.GetOutboxInvoiceList = function (options,query,callback) {
    callback(null);
}; 

/**
* @query :{ ExecutionStartDate:Date, ExecutionEndDate:Date, pageIndex:Number, pageSize:Number, InvoiceNumbers:String[] , InvoiceIds: String[]}
*/
exports.GetOutboxInvoices = function (options,query,callback) {
    callback(null);
}; 


