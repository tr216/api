var uyumsoft=require('./../helpers/e-invoice/uyumsoft.js');

module.exports = function(activeDb, member, req, res, callback) {

  if(req.params.param1==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});
  if(req.params.param2==undefined) return callback({success:false,error:{code:'WRONG_PARAMETER',message:'Hatali Parametre'}});

  activeDb.e_integrators.findOne({_id:req.params.param1},(err,eIntegratorDoc)=>{
    if(dberr(err,callback)){
      if(dbnull(eIntegratorDoc,callback)){
        if(eIntegratorDoc.passive)  return callback({success:false,error:{code:'PASSIVE',message:'Entegrator tanimi pasif durumdadir.'}});
        switch(req.method){
          case 'GET':
            switch(req.params.param2.lcaseeng()){
              case 'iseinvoiceuser':
                return isEInvoiceUser(activeDb,member,req,res,eIntegratorDoc,callback);
              break;
              case 'getinboxinvoicelist':
                return getInboxInvoiceList(activeDb,member,req,res,eIntegratorDoc,callback);
              break;
              default:
                return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
              break;
            }

          break;
          default:
            return callback({success: false, error: {code: 'WRONG_METHOD', message: 'Method was wrong!'}});
          break;
        }
        
      }
    }
  });


}

function getInboxInvoiceList(activeDb,member,req,res,eIntegratorDoc,callback){
  var ExecutionStartDate=req.query.ExecutionStartDate || req.query.executionStartDate || req.query.StartDate || req.query.startDate || '2019-08-01T00:00:00.000Z';
  var ExecutionEndDate=req.query.ExecutionEndDate || req.query.executionEndDate || req.query.EndDate || req.query.endDate || '2019-08-31T23:59:59.000Z';
  var pageIndex=Number(req.query.page || req.query.pageIndex || 0);
  var pageSize=Number(req.query.pageSize || req.query.limit || 10);


  switch(eIntegratorDoc.eIntegrator){
    case 'uyumsoft':
      uyumsoft.getInboxInvoiceList(eIntegratorDoc,{query:{ExecutionStartDate:ExecutionStartDate,ExecutionEndDate:ExecutionEndDate,pageIndex:pageIndex,pageSize:pageSize}},callback);
    break;
    default:
      callback({success:false,error:{code:'INTEGRATOR_ERROR',message:'Integrator function not completed or unknown.'}})
    break;
  }
}


function isEInvoiceUser(activeDb,member,req,res,eIntegratorDoc,callback){
  var vknTckn=req.query.vknTckn || req.query.vkntckn || '';
  if(vknTckn.trim()=='') return callback({success:false,error:{code:'MISSING_PARAM',message:'\'vknTckn\' query parametresi bos olamaz.'}})
  switch(eIntegratorDoc.eIntegrator){
    case 'uyumsoft':
      uyumsoft.isEInvoiceUser(eIntegratorDoc,vknTckn,callback);
    break;
    default:
      callback({success:false,error:{code:'INTEGRATOR_ERROR',message:'Integrator function not completed or unknown.'}})
    break;
  }
}

