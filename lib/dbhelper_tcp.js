


//var serviceResonance = require('./service_resonance.js');
//Query  Paging + Filtering + Sorting

exports.queryPFS = function(serviceResonance,req,connection,query,orderby,callback) {
   
    if(req==null)req={query:{},body:{}};

    var pagenum=req.query.pagenum || 0;
    var pagesize=req.query.pagesize ||  0;
    var start = pagenum * Number(pagesize) + 1;
    var last = Number(start) + Number(pagesize)-1;
    var filterquery='';
    var sortdatafield=''; req.query.sortdatafield || '';
    var sortorder=req.query.sortorder  || '';
    
    // if(!req){
    //     pagenum= req.query.pagenum || 0;
    //     pagesize=req.query.pagesize ||  0;
    //     sortorder=req.query.sortorder  || '';
    // }

    query = filterApply(req,query);
    
    var params_totalrows={connection:connection, query: 'SELECT COUNT(*) as T FROM (' + query + ') XX' };
    serviceResonance.sendCommand(connection.resonanceid,connection.resonancepassword, 'MSSQL_QUERY' ,params_totalrows , function(result){
        var success=result.success!=undefined?result.success:(result.data.success!=undefined?result.data.success:false);
        var error=result.error!=undefined?result.error:(result.data.error!=undefined?result.data.error:null);
        var data=result.data==undefined?[]:(result.data.data!=undefined?result.data.data : []);

        if(success==false){
            var res={data:{success:false,error:error}};
            callback(formatResult(req,res,0));
        }else{
            var TotalRows = result.data.data[0]['T'];
            var sortdatafield=req.query.sortdatafield || '';
            var sortorder=req.query.sortorder || '';

            if ( sortdatafield !='' )
            {
                if(sortorder =='desc'){
                    orderby ='ORDER BY ' + req.query.sortdatafield + ' DESC';
                }else if (sortorder =='asc'){
                    orderby ='ORDER BY ' + req.query.sortdatafield + ' ASC';
                }
            }
            
            query='SELECT ROW_NUMBER() OVER(' + orderby + ') AS Row$No, * FROM (' + query + ') XX$XX ';


            if(pagesize!=0){
                query ='SELECT * FROM (' + query + ') YY$YY WHERE (Row$No>=' + start + ' AND Row$No<=' + last + ') ';
            }

            query = query + ' ' + orderby;

            var params={connection:connection, query: query};
            
            serviceResonance.sendCommand(connection.resonanceid,connection.resonancepassword, 'MSSQL_QUERY' ,params , function(result){
                callback(formatResult(req,result,TotalRows));
            });
        }

    });
}

exports.sqltest=function(serviceResonance,connection,callback){
    var params = {connection:connection}
    
    serviceResonance.sendCommand(connection.resonanceid,connection.resonancepassword, 'MSSQL_CONNECTION_TEST' ,params,function(result){
        if(!result.data){
            var error = result.error || {code:'ERROR',mesage:'ERROR'};
            callback({success:false,error:error});
        }else{
            callback(result.data);
        }
        
    });
}

function formatResult(req,result,TotalRows){
   
    var sonuc=null;
    var liststyle=req.query.liststyle || req.body.liststyle || '';
    var success=result.success!=undefined?result.success:(result.data.success!=undefined?result.data.success:false);
    var error=result.error!=undefined?result.error:(result.data.error!=undefined?result.data.error:null);
    var data=result.data==undefined?[]:(result.data.data!=undefined?result.data.data : []);

    switch(liststyle){
        case 'grid':
            sonuc= [{success:success,
                    error:error,
                    TotalRows:TotalRows ,
                    Rows:data
                    }];
            break;
         case 'list':
            sonuc= data;
            break;
        default:

            sonuc= {success:success,
                    error:error,
                    data:{
                        rows:data, 
                        length:data.length
                    }};
            break;
    }
    return sonuc;
}

function filterApply(req,query){
    var filterscount = req.query.filterscount || 0;
    if(filterscount>0){
        var where=' WHERE (';
        var tmpdatafield='';
        var tmpfilteroperator='';

        for (var i=0; i < filterscount; i++)
        {
            var filtervalue = req.query['filtervalue' + i];
            var filtercondition = req.query['filtercondition' + i];
            var filterdatafield = req.query['filterdatafield' + i];
            var filteroperator = req.query['filteroperator' + i];

            if (tmpdatafield == '')
            {
                tmpdatafield = filterdatafield;           
            }
            else if (tmpdatafield != filterdatafield)
            {
                where += ')AND(';
            }
            else if (tmpdatafield == filterdatafield)
            {
                if (tmpfilteroperator == 0)
                {
                    where += ' AND ';
                }
                else
                {
                    where += ' OR '; 
                } 
            }

            switch(filtercondition)
            {
                case "NOT_EMPTY":
                case "NOT_NULL":
                where += " " + filterdatafield + " NOT LIKE '" + "" +"'";
                break;
                case "EMPTY":
                case "NULL":
                where += " " + filterdatafield + " LIKE '" + "" +"'";
                break;
                case "CONTAINS_CASE_SENSITIVE":
                where += " BINARY  " + filterdatafield + " LIKE '%" + filtervalue +"%'";
                break;
                case "CONTAINS":
                where += " " + filterdatafield + " LIKE '%" + filtervalue +"%'";
                break;
                case "DOES_NOT_CONTAIN_CASE_SENSITIVE":
                where += " BINARY " + filterdatafield + " NOT LIKE '%" + filtervalue +"%'";
                break;
                case "DOES_NOT_CONTAIN":
                where += " " + filterdatafield + " NOT LIKE '%" + filtervalue +"%'";
                break;
                case "EQUAL_CASE_SENSITIVE":
                where += " BINARY " + filterdatafield + " = '" + filtervalue +"'";
                break;
                case "EQUAL":
                where += " " + filterdatafield + " = '" + filtervalue +"'";
                break;
                case "NOT_EQUAL_CASE_SENSITIVE":
                where += " BINARY " + filterdatafield + " <> '" + filtervalue +"'";
                break;
                case "NOT_EQUAL":
                where += " " + filterdatafield + " <> '" + filtervalue +"'";
                break;
                case "GREATER_THAN":
                where += " " + filterdatafield + " > '" + filtervalue +"'";
                break;
                case "LESS_THAN":
                where += " " + filterdatafield + " < '" + filtervalue +"'";
                break;
                case "GREATER_THAN_OR_EQUAL":
                where += " " + filterdatafield + " >= '" + filtervalue +"'";
                break;
                case "LESS_THAN_OR_EQUAL":
                where += " " + filterdatafield + " <= '" + filtervalue +"'";
                break;
                case "STARTS_WITH_CASE_SENSITIVE":
                where += " BINARY " + filterdatafield + " LIKE '" + filtervalue +"%'";
                break;
                case "STARTS_WITH":
                where += " " + filterdatafield + " LIKE '" + filtervalue +"%'";
                break;
                case "ENDS_WITH_CASE_SENSITIVE":
                where += " BINARY " + filterdatafield + " LIKE '%" + filtervalue +"'";
                break;
                case "ENDS_WITH":
                where += " " + filterdatafield + " LIKE '%" + filtervalue +"'";
                break;
            }

            if (i == filterscount - 1)
            {
                where += ")";
            }

            tmpfilteroperator = filteroperator;
            tmpdatafield = filterdatafield;           
        }
        query = "SELECT * FROM (" + query + ") X869 " + where;

    }

    return query;
}