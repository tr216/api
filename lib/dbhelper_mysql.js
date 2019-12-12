var mysql = require('mysql');
var async = require('async');

var connectionpool = mysql.createPool({
    host     : config.mysqlconn.host,
    port     : config.mysqlconn.port,
    user     : config.mysqlconn.user,
    password : config.mysqlconn.password,
    database : config.mysqlconn.database,
    charset: "utf8"
});


exports.queryFormat = function(query, values) {
    if (!values) return query;
    return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
            var val = mysql.escape(values[key]);
            // if (val[0] == "'" && val[val.length - 1] == "'") {
            //     val = val.substring(1, val.length - 1);
            // }
            return val;
        }
        return txt;
    }.bind(this));
}

exports.query = function (sql, params, callback) {
    connectionpool.getConnection(function (err, connection) {

        if (err) {
            callback({success: false, error: { code: err.code , message: err.message }, data: null });
        } else {

            sql = exports.queryFormat(sql, params);
            connection.query(sql, function (err, rows, fields) {
                connection.release();
                if (err) {
                    
                    callback({ success: false, error: { code: err.code , message: err.message }, data: null });

                } else {

                    if(fields==undefined){
                        callback({ success: true, error: null, data : { affectedrows: rows.affectedRows} });
                    }else{
                        var fields2 = [];
                        for (var i = 0; i < fields.length; i++) {
                            var len = fields[i].length;
                            if (fields[i].charsetNr == 33) len = len / 3;
                            fields2.push({name: fields[i].name, length: len,type: fields[i].type ,zeroFill : fields[i].zeroFill , charsetNr : fields[i].charsetNr  })
                        }
                        callback({ success: true, error: null, data : { fields: fields2, rows: rows, length: rows.length } });
                    }
                    
                    
                }

            });
        }
    });
}

//Run multiple update/insert/delete query without any parameters. Parameters should be applied before processing
exports.multiplequery = function (sqlarray, callback) {
    var errormessages="";
    var tasks=[];
    var affectedrows=0;
    tasks.push(function (cb) {
                cb(null);
            });

    for(var i=0;i<sqlarray.length;i++){
        function calis(sql,index){
            var sqltask=function(callback){
                    
                    exports.query(sql,null,function(result){
                        if(!result.success){
                            // errormessages +="QueryError[" + index.toString() + "] : " + result.error.message +"\r\n";
                            errormessages +="QueryError[] : " + result.error.message +"\r\n";
                            callback(result.error.message);
                        }else{
                            if(result.data.affectedrows!=undefined){
                                affectedrows += Number(result.data.affectedrows);
                            }
                            callback(null);
                        }
                        
                    });
                   
                }
            tasks.push(sqltask);
        }

        calis(sqlarray[i],i);
    }
    
     tasks.push(function (cb) {
                cb(null);
            });

    async.waterfall(tasks,
        function (err) {
            // console.log('errormessages:' + errormessages);
            if(err){
                callback({ success: false, error: { code: "WATERFALL_ERROR" , message: err }, data: {affectedrows:affectedrows} });
                return;
            }
            if(errormessages!=""){
                callback({ success: false, error: { code: "QUERY_EXECUTE_ERROR" , message: errormessages }, data: {affectedrows:affectedrows} });
                return;
            }
            
            callback({ success: true, error: null, data: {affectedrows:affectedrows} });
            return;
            
        });

}


//Query  Paging + Filtering + Sorting
exports.queryPFS = function(req,sql,params,callback) {
   
    var liststyle=req.body.liststyle|| req.query.liststyle || ''; // req.query.liststyle!=undefined?req.query.liststyle: (req.body.liststyle!=undefined?req.body.liststyle:'');
    var pagenum=req.query.pagenum || 0;
    var pagesize=req.query.pagesize ||  0;
    var start = pagenum * Number(pagesize);
    //var last = Number(start) + Number(pagesize)-1;
    var filterquery='';
    var sortdatafield=req.query.sortdatafield || '';
    var sortorder=req.query.sortorder  || '';
    
    var totalrows=0;
    sql = filterApply(req,sql);
    
    exports.query("SELECT COUNT(*) as totalrows FROM (" + sql + ") XX869YY",params,function(result){
        if(!result.success){
            callback(formatResult(result,0,liststyle));
        }else{
            totalrows = result.data.rows[0]["totalrows"];
            var sortdatafield=req.query.sortdatafield || '';
            var sortorder=req.query.sortorder || '';
            var orderby='';
            if ( sortdatafield !='' )
            {
                if(sortorder =='desc'){
                    orderby ='ORDER BY ' + req.query.sortdatafield + ' DESC';
                }else if (sortorder =='asc'){
                    orderby ='ORDER BY ' + req.query.sortdatafield + ' ASC';
                }
            }
            sql = "SELECT * FROM (" + sql + ") XXT869T " + orderby;
            if(pagesize!=0){
                sql = sql + ' LIMIT ' + start + ',' + pagesize + ' ';
            }
            
            exports.query(sql,params,function(result){
                callback(formatResult(result,totalrows,liststyle));
            });
        }
    });
    
}



function formatResult(result,totalrows,liststyle){
    
    var sonuc=null;
    
    var success=result.success!=undefined?result.success:false;
    var error=result.error!=undefined?result.error:null;
    var data=result.data!=undefined?result.data:[];
    var rows=data.rows!=undefined?data.rows:null;
    var fields=data.fields!=undefined?data.fields:null;

    switch(liststyle){
        case 'grid':
            sonuc= [{success:success,
                    error:error,
                    TotalRows:totalrows ,
                    Rows:rows
                    }];
            break;
         case 'list':
            sonuc= data;
            break;
        default:

            sonuc= {success:success,
                    error:error,
                    data:{
                        fields:fields,
                        rows:rows, 
                        length:rows.length
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
                    if(filtervalue.length>0){
                        if(filtervalue[0]=="*"){
                            //where += " " + filterdatafield + " LIKE '%" +  +"%'";
                            filtervalue=filtervalue.substring(1,filtervalue.length-1);
                        }
                    }
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
        query = "SELECT * FROM (" + query + ") XED869 " + where;

    }

    return query;
}