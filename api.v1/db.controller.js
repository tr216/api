
module.exports = function(req, res, callback) {
    passport(req, res, function(result) {
        if (result.success) {
            var member = result.data;
            if(req.params.param1=='resonance'){
                switch(req.params.param2){
                    case 'test':
                        resonance_test(member,req,res,callback);
                    break;
                    case 'mssqltest':
                        resonance_mssqltest(member,req,res,callback);
                    break;

                    case 'mssqlquery':
                        resonance_mssql(member,req,res,callback);
                    break;

                    case 'mysqlquery':
                        resonance_mysql(member,req,res,callback);
                    break;

                    default:
                        callback({success:false,error:{code:'UNKNOWN_DB_COMMAND',messahe:'Unknown database command'}});
                    break;
                }
            }else{
                callback({success:false,error:{code:'UNKNOWN_DB_COMMAND',messahe:'Unknown database command'}});
            }
        } else {
            callback(result);
        }
    });


}


/**
* @api {get,post} /db/resonance/test 1. Checking Resonance
* @apiName resonanceTest
* @apiGroup Database Functions
*
* @apiDescription Only check is Resonance active or deactive.
*
* If ResonanceID and password are true than you can control your server via Resonance.
*
* @apiParam {string} resonanceId ResonanceID
* @apiParam {string} resonancePassword Resonance password
*
* @apiSuccess {boolean} success success of result.
* @apiSuccess {string} data Server time which Resonance installed.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "success": true,
*       "data": "2038-11-08 18:22:09"
*     }
*
* @apiError RECORD_NOT_FOUND Record not found. ResonanceID or Password was wrong.
* @apiError TIMEOUT Timeout. The resonance cannot estanlished a connection to its own mysql server.
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "success": false,
*       "error": {code: string , message : string}
*     }
*/

function resonance_test(member,req,res,callback){
    var resonanceId=req.body.resonanceId || req.query.resonanceId || '';
    var resonancePassword =req.body.resonancePassword || req.body.password || req.query.resonancePassword || req.query.password || '';
    resonanceId = resonanceId.replaceAll(' ','').replaceAll('.','');
   
    db.resonanceIds.findOne({resonanceId:resonanceId,resonancePassword:resonancePassword},function(err,doc){
        if(!err){
            if(doc!=null){
                service_resonance.sendCommand({id:doc.resonanceId,password:doc.resonancePassword,uuid:doc.resonanceUuid},"TIME","",function(result){
                    callback(result.data);
                });
            }else{
                callback({success:false,error:{code:"RECORD_NOT_FOUND",message:"Kayit bulunamadi"}});
            }
           
        }else{
            callback({success:false,error:{code:err.name,message:err.message}});
        }
    });
}


/**
* @api {post} /db/resonance/mssqltest 2. Checking MsSQL Connection via Resonance
* @apiName resonanceMsSQLTest
* @apiGroup Database Functions
*
* @apiParamExample Parameters-Body-JSON
* {
*     "resonanceOptions":{
*         "resonanceId": "111222333",
*         "password": "1111",
*         "mssql":{
*             "server":"localhost",
*             "database":"TestDB",
*             "port": 1433,   //optional default:1433
*             "user":"sa",
*             "password":"sa_pass"
*         }
*     }
* }
*
* @apiSuccess {boolean} success success of result.
* @apiSuccess {string} data MsSQL Server time which Resonance installed.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "success": true,
*       "data": "2038-11-08 18:22:09"
*     }
*
* @apiError RECORD_NOT_FOUND Record not found. ResonanceID or Password was wrong.
* @apiError TIMEOUT Timeout. The resonance cannot estanlished a connection to its own mysql server.
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "success": false,
*       "error": {code: string , message : string}
*     }
*/
function resonance_mssqltest(member,req,res,callback){
    var resonanceId=req.body.resonanceOptions.resonanceId || '';
    var resonancePassword =req.body.resonanceOptions.password || '';
    resonanceId = resonanceId.toString().replaceAll(' ','').replaceAll('.','');
    var server=req.body.resonanceOptions.mssql.server  || '';
    var database=req.body.resonanceOptions.mssql.database || '';
    var user=req.body.resonanceOptions.mssql.user || '';
    var password=req.body.resonanceOptions.mssql.password || '';
    var port=req.body.resonanceOptions.mssql.port || 1433;
   
    db.resonanceIds.findOne({resonanceId:resonanceId,resonancePassword:resonancePassword},function(err,doc){
        if(!err){
            if(doc!=null){
               
                var params={connection:{user:user,password:password,server:server,database:database,port:port}};
                service_resonance.sendCommand({id:doc.resonanceId,password:doc.resonancePassword,uuid:doc.resonanceUuid},"MSSQL_CONNECTION_TEST",params,function(result){
                    callback(result.data);
                });
            }else{
                callback({success:false,error:{code:"RECORD_NOT_FOUND",message:"Kayit bulunamadi"}});
            }
           
        }else{
            callback({success:false,error:{code:err.name,message:err.message}});
        }
    });
}


/**
* @api {post} /db/resonance/mysqltest 3. DB Resonance MySQL Test
* @apiName resonanceMySQLTest
* @apiGroup Database Functions
*
* @apiParamExample Parameters-Body-JSON
* {
*     "resonanceOptions":{
*         "resonanceId": "111222333",
*         "password": "1111",
*         "mysql":{
*             "server":"localhost",
*             "database":"TestDB",
*             "port": 3306,   //optional default:3306
*             "user":"root",
*             "password":"root_pass"
*         }
*     }
* }
*
* @apiSuccess {boolean} success Islem basarisini gosterir.
* @apiSuccess {string} data Sunucu Sql server tarih saati.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "success": true,
*       "data": "2038-11-08 18:22:09"
*     }
*
* @apiError RECORD_NOT_FOUND Record not found. ResonanceID or Password was wrong.
* @apiError TIMEOUT Timeout. The resonance cannot estanlished a connection to its own mysql server.
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "success": false,
*       "error": {code: string , message : string}
*     }
*/
function resonance_mysqltest(member,req,res,callback){
    var resonanceId=req.body.resonanceOptions.resonanceId || '';
    var resonancePassword =req.body.resonanceOptions.password || '';
    resonanceId = resonanceId.toString().replaceAll(' ','').replaceAll('.','');
    var server=req.body.resonanceOptions.mysql.server  || '';
    var database=req.body.resonanceOptions.mysql.database || '';
    var user=req.body.resonanceOptions.mysql.user || '';
    var password=req.body.resonanceOptions.mysql.password || '';
    var port=req.body.resonanceOptions.mysql.port || 3306;

    db.resonanceIds.findOne({resonanceId:resonanceId,resonancePassword:resonancePassword},function(err,doc){
        if(!err){
            if(doc!=null){
               
                var params={connection:{user:user,password:password,server:server,database:database,port:port}};
                service_resonance.sendCommand({id:doc.resonanceId,password:doc.resonancePassword,uuid:doc.resonanceUuid},"MYSQL_CONNECTION_TEST",params,function(result){
                    console.log(result.data);
                    callback(result.data);
                });
            }else{
                callback({success:false,error:{code:"RECORD_NOT_FOUND",message:"Kayit bulunamadi.."}});
            }
           
        }else{
            callback({success:false,error:{code:err.name,message:err.message}});
        }
    });   


}

/**
* @api {post} /db/resonance/mssqlquery 4. MsSQL Query
* @apiName resonanceMsSQLQuery
* @apiGroup Database Functions
*
* @apiParam {string} [dbId] Database dbdefines._id. one of 'dbId' or 'dbName' is required
* @apiParam {string} [dbName] Database name (dbdefines.dbName). one of 'dbId' or 'dbName' is required
* @apiParam {string} query T-SQL query or queries.
*
* @apiParamExample Parameters-Body-JSON
* //example-1
* {
*     "dbName":"db001",
*     "query" :"SELECT * FROM Table1 WHERE firstname like '%John%'"
* }
*
* //example-2 multiple queries
* {
*     "dbName":"db001",
*     "query" :"SELECT * FROM Table1 WHERE firstname like '%John%';SELECT id,cityname FROM cities;"
* }
*
* //example-3 select query and update query together
* {
*     "dbId":"5baa3529fa607a24642ba5ff",
*     "query" :"SELECT * FROM Table1 WHERE firstname like '%John%';UPDATE cities SET cityname='Paris' WHERE id=4;INSERT INTO Table1(firstname,lastname) VALUES('John','Watson');"
* }
*
* @apiSuccess {boolean} success success of result
* @apiSuccess {object} data Data object
* @apiSuccess (data {}) {array[array[object]]} rows results of each query. 2 dimensions array
* @apiSuccess (data {}) {array[number]} rowsAffected Affected record count or row count of each query . 1 dimension array
* @apiSuccess (data {}) {object} output output object
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "success": true,
*       "data": { 
*           "rows":[
*               [
*                   {"id":1,"firstname":"Mary","lastname":"Jane"},
*                   {"id":2,"firstname":"John","lastname":"Watson"},
*                   {"id":3,"firstname":"Alexander","lastname":"Bruno"}
*               ],
*               [
*                   {"id":1,"cityname":"London"},
*                   {"id":2,"cityname":"Istanbul"},
*                   {"id":3,"cityname":"Moscow"},
*                   {"id":4,"cityname":"Paris"},
*                   {"id":5,"cityname":"Tokyo"}
*               ],
*           ],
*           "rowsAffected":[3,5],
*           "output":{}
*       }
*     }
*
* @apiError EREQUEST MsSQL Query syntax errors
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "success": false,
*       "error": {code: string , message : string}
*     }
*/


function resonance_mssql(member,req,res,callback){
    var dbId=req.body._id || req.body.dbId || '';
    var dbName=req.body.dbName || req.body.dbName || '';
    var query=req.body.query  || '';
    var filter={};
    if(dbId!=''){
        filter={owner:member._id, _id:dbId};
    }else{
        filter={owner:member._id, dbName:dbName};
    }
    if(query.trim()==''){
        callback({success:false,error:{code:"QUERY_EMPTY",message:"Sql sorgu bos olamaz."}});
        return;
    }

    db.dbdefines.findOne(filter,function(err,doc){
        if(!err){
            if(doc==null){
                callback({success:false,error:{code:"RECORD_NOT_FOUND",message:"Kayit bulunamadi."}});
            }else{
                db.resonanceIds.findOne({resonanceId:doc.resonanceOptions.resonanceId,resonancePassword:doc.resonanceOptions.password},function(err,resonanceDoc){
                    if(!err){
                        if(resonanceDoc!=null){

                            var params={query:query, connection:{user:doc.resonanceOptions.mssql.user,password:doc.resonanceOptions.mssql.password,server:doc.resonanceOptions.mssql.server,database:doc.resonanceOptions.mssql.database,port:doc.resonanceOptions.mssql.port}};
                            service_resonance.sendCommand({id:resonanceDoc.resonanceId,password:resonanceDoc.resonancePassword,uuid:resonanceDoc.uuid},"MSSQL_QUERY",params,function(result){

                                callback(result);
                            });
                        }else{
                            callback({success:false,error:{code:"RESONANCE_INFO_NOT_FOUND",message:"Resonance kaydi bulunamadi.."}});
                        }
                       
                    }else{
                        console.log('error:db.resonanceIds.findOne');
                        callback({success:false,error:{code:err.name,message:err.message}});
                    }
                });   
            }
        }else{
            console.log('error:db.dbdefines.findOne');
            callback({success:false,error:{code:err.name,message:err.message}});
        }
    });
    


}


/**
* @api {post} /db/resonance/mysqlquery 5. MySQL Query
* @apiName resonanceMySQLQuery
* @apiGroup Database Functions
*
* @apiParam {string} [dbId] Database dbdefines._id. one of 'dbId' or 'dbName' is required
* @apiParam {string} [dbName] Database name (dbdefines.dbName). one of 'dbId' or 'dbName' is required
* @apiParam {string} query or queries.
*
* @apiParamExample Parameters-Body-JSON
* //example-1
* {
*     "dbName":"db001",
*     "query" :"SELECT * FROM Table1 WHERE firstname like '%John%'"
* }
*
* //example-2 multiple queries
* {
*     "dbName":"db001",
*     "query" :"SELECT * FROM Table1 WHERE firstname like '%John%';SELECT id,cityname FROM cities;"
* }
*
* //example-3 select query and update query together
* {
*     "dbId":"5baa3529fa607a24642ba5ff",
*     "query" :"SELECT * FROM Table1 WHERE firstname like '%John%';UPDATE cities SET cityname='Paris' WHERE id=4;INSERT INTO Table1(firstname,lastname) VALUES('John','Watson');"
* }
*
* @apiSuccess {boolean} success success of result
* @apiSuccess {object} data Data object
* @apiSuccess (data {}) {array[array[string]]} fields field names of each query.
* @apiSuccess (data {}) {array[array[object]]} rows results of each query. 2 dimensions array
* @apiSuccess (data {}) {array[number]} rowsAffected Affected record count or row count of each query . 1 dimension array
* @apiSuccess (data {}) {array[number]} insertId insert query or queries autoincrement field value(s).
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "success": true,
*       "data": { 
*            "fields":[
*                   [
*                       "id","firstname","lastname"
*                   ],
*                   [
*                       "id","cityname"
*                   ],
*            ],
*           "rows":[
*               [
*                   {"id":1,"firstname":"Mary","lastname":"Jane"},
*                   {"id":2,"firstname":"John","lastname":"Watson"},
*                   {"id":3,"firstname":"Alexander","lastname":"Bruno"}
*               ],
*               [
*                   {"id":1,"cityname":"London"},
*                   {"id":2,"cityname":"Istanbul"},
*                   {"id":3,"cityname":"Moscow"},
*                   {"id":4,"cityname":"Paris"},
*                   {"id":5,"cityname":"Tokyo"}
*               ],
*           ],
*           "rowsAffected":[3,5],
*           "insertId":[0,0]
*       }
*     }
*
* @apiError ER_PARSE_ERROR You have an error in your SQL syntax
* @apiError ER_NO_SUCH_TABLE Table doesn't exist"
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 500 Internal Server Error
*     {
*       "success": false,
*       "error": {code: string , message : string}
*     }
*/


function resonance_mysql(member,req,res,callback){
    var dbId=req.body._id || req.body.dbId || '';
    var dbName=req.body.dbName || req.body.dbName || '';
    var query=req.body.query  || '';
    var filter={};
    if(dbId!=''){
        filter={owner:member._id, _id:dbId};
    }else{
        filter={owner:member._id, dbName:dbName};
    }
    if(query.trim()==''){
        callback({success:false,error:{code:"QUERY_EMPTY",message:"Sql sorgu bos olamaz."}});
        return;
    }

    db.dbdefines.findOne(filter,function(err,doc){
        if(!err){
            if(doc==null){
                callback({success:false,error:{code:"RECORD_NOT_FOUND",message:"Kayit bulunamadi."}});
            }else{
                db.resonanceIds.findOne({resonanceId:doc.resonanceOptions.resonanceId,resonancePassword:doc.resonanceOptions.password},function(err,resonanceDoc){
                    if(!err){
                        if(resonanceDoc!=null){

                            var params={query:query, connection:{user:doc.resonanceOptions.mysql.user,password:doc.resonanceOptions.mysql.password,server:doc.resonanceOptions.mysql.server,database:doc.resonanceOptions.mysql.database,port:doc.resonanceOptions.mysql.port}};
                            service_resonance.sendCommand({id:resonanceDoc.resonanceId,password:resonanceDoc.resonancePassword,uuid:resonanceDoc.uuid},"MYSQL_QUERY",params,function(result){

                                callback(result);
                            });
                        }else{
                            callback({success:false,error:{code:"RESONANCE_INFO_NOT_FOUND",message:"Resonance kaydi bulunamadi.."}});
                        }
                       
                    }else{
                        console.log('error:db.resonanceIds.findOne');
                        callback({success:false,error:{code:err.name,message:err.message}});
                    }
                });   
            }
        }else{
            console.log('error:db.dbdefines.findOne');
            callback({success:false,error:{code:err.name,message:err.message}});
        }
    });
    


}