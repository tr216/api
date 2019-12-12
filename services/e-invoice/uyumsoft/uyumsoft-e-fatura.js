var api=require('./api.js');

exports.downloadInvoices = function (dbModel,eIntegratorDoc,callback) {
    
    dbModel.e_invoices.find({eIntegrator:eIntegratorDoc._id, ioType:1}).sort({issueDate:-1}).limit(1).exec((err,docs)=>{
        if(!err){
            var date2=new Date();
            var query={ 
                ExecutionStartDate:'2019-01-01T00:00:00.000Z', 
                ExecutionEndDate:date2.yyyymmdd() + 'T23:59:59.000Z', 
                PageIndex:0, 
                PageSize:10,

                OnlyNewestInvoices:false,
                SetTaken:false
                // InvoiceNumbers:[] , 
                // InvoiceIds: []
            }

            if(docs.length>0){
                var date1=mrutil.datefromyyyymmdd(docs[0].issueDate);
                
                date1=date1.addDays(-30);
                console.log('Date1:',date1);
                query.ExecutionStartDate=date1.yyyymmdd() + 'T00:00:00.000Z';
                // query.ExecutionEndDate=date2.yyyymmdd() + 'T23:59:59.000Z';
            }

            var index=0;
            var indirilecekFaturalar=[];
            function indir(cb){
                
                api.getInboxInvoiceList(eIntegratorDoc,query,(err,result)=>{
                    if(!err){
                        console.log('pageIndex:',result.page + '/' + result.pageCount);
                        
                            if(result.docs.length>0){
                                for(var i=0;i<result.docs.length;i++){
                                    //if(indirilecekFaturalar.findIndex((e)=>{return (e.uuid==result.docs[i].uuid)})<0){
                                        indirilecekFaturalar.push(result.docs[i]);
                                    //}
                                    
                                }
                                query.PageIndex++;
                                // if(query.PageIndex>=4){
                                if(query.PageIndex>=result.pageCount){
                                    cb(null)
                                }else{
                                    setTimeout(indir,1000,cb);
                                }
                            }else{
                                cb(null)
                            }
                        
                        
                    }else{
                        console.log('downloadInvoices Hata:',err);
                        cb(err);
                    }
                }) 
            }

            indir((err)=>{
                if(!err){
                    console.log('indirilecekFaturalar.length:',indirilecekFaturalar.length);
                    callback(null,indirilecekFaturalar);
                }else{
                    callback(err);
                }
            });
            
        }else{
            callback(err);
        }
    });
    
}



